import time
from django.utils import timezone
from django.db import transaction
from .models import Scan, ScanResult, Vulnerability, Report
from apps.scans_app.utils.scanner import run_scan
from celery import shared_task  # type: ignore[reportMissingImports]

def _tick_progress(scan: Scan, step: int, total_steps: int):
    scan.refresh_from_db()
    if scan.status == "canceled":
        return False
    pct = min(99, int(step / total_steps * 100))
    remaining_steps = max(0, total_steps - step)
    scan.progress = pct
    scan.estimated_time_left = f"{remaining_steps // 2}m"
    scan.save(update_fields=["progress", "estimated_time_left"])
    return True

@shared_task(bind=True, name="apps.scans_app.tasks.run_scan_task", max_retries=1)
def run_scan_task(self, scan_id: int):
    try:
        scan = Scan.objects.get(id=scan_id)
    except Scan.DoesNotExist:
        return

    if scan.status in ("completed","failed","canceled"):
        return

    try:
        with transaction.atomic():
            scan.status = "running"
            scan.started_at = timezone.now()
            scan.progress = 0
            scan.estimated_time_left = None
            scan.save(update_fields=["status","started_at","progress","estimated_time_left"])

        total_steps = 20
        for step in range(1, total_steps + 1):
            time.sleep(0.5)
            if not _tick_progress(scan, step, total_steps):
                scan.finished_at = timezone.now()
                scan.save(update_fields=["finished_at"])
                return

        results = run_scan(scan.id, scan.target, scan.mode)

        with transaction.atomic():
            ScanResult.objects.update_or_create(
                scan=scan,
                defaults=dict(
                    open_ports=results.get("open_ports", []),
                    http_info=results.get("http_info", {}),
                    tls_info=results.get("tls_info", {}),
                    raw_output=results,
                ),
            )

            scan.vulnerabilities.all().delete()

            vulns = results.get("vulnerabilities", []) or []
            vuln_ids = []
            severity_count = {"critical":0,"high":0,"medium":0,"low":0,"info":0}
            for v in vulns:
                vuln = Vulnerability.objects.create(
                    scan=scan,
                    severity=v.get("severity","info"),
                    name=v.get("name","Unknown"),
                    path=v.get("path"),
                    description=v.get("description"),
                    impact=v.get("impact"),
                    remediation=v.get("remediation"),
                    reference_links=v.get("reference_links", []),
                )
                vuln_ids.append(vuln.id)
                sev = v.get("severity","info")
                if sev in severity_count:
                    severity_count[sev] += 1

            Report.objects.update_or_create(
                scan=scan,
                defaults=dict(
                    total=len(vuln_ids),
                    critical=severity_count["critical"],
                    high=severity_count["high"],
                    medium=severity_count["medium"],
                    low=severity_count["low"],
                    info=severity_count["info"],
                    duration="~1m",
                    vulnerabilities=vuln_ids,
                ),
            )

            scan.status = "completed"
            scan.progress = 100
            scan.finished_at = timezone.now()
            scan.estimated_time_left = None
            scan.save(update_fields=["status","progress","finished_at","estimated_time_left"])

    except Exception:
        with transaction.atomic():
            scan.status = "failed"
            scan.progress = 0
            scan.finished_at = timezone.now()
            scan.estimated_time_left = None
            scan.save(update_fields=["status","progress","finished_at","estimated_time_left"])
