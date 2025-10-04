# apps/scans_app/views.py
from urllib.parse import urlparse
import ipaddress

from django.utils import timezone
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions

from .models import Scan, ScanResult
from .serializers import (
    ScanCreateSerializer,
    ScanResultSerializer,
    VulnerabilitySerializer,
    ReportSerializer,
)
from apps.auth_app.authentication import CookieJWTAuthentication as JWTAuthentication
from .tasks import run_scan_task


class AuthenticatedView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]


def _is_valid_target(target: str) -> bool:
    if not target or len(target) > 255:
        return False

    # CIDR (contains slash)
    try:
        if "/" in target:
            ipaddress.ip_network(target, strict=False)
            return True
    except ValueError:
        pass

    # IP address
    try:
        ipaddress.ip_address(target)
        return True
    except ValueError:
        pass

    # URL with scheme + host
    try:
        parsed = urlparse(target)
        if parsed.scheme in ("http", "https") and parsed.netloc:
            return True
    except Exception:
        pass

    # Plain hostname (best-effort)
    if "." in target and " " not in target:
        return True

    return False


def _scan_summary_for_list(scan: Scan):
    base = {
        "scanId": f"s_{scan.id}",
        "target": scan.target,
        "mode": scan.mode,
        "status": scan.status,
        "createdAt": scan.created_at.isoformat(),
    }
    if scan.status == "completed" and hasattr(scan, "report") and scan.report:
        base["summary"] = {
            "critical": scan.report.critical,
            "high": scan.report.high,
            "medium": scan.report.medium,
            "low": scan.report.low,
            "info": scan.report.info,
        }
        base["duration"] = scan.report.duration
    elif scan.status == "running":
        base["progress"] = scan.progress
    return base


def _scan_detail_for_get(scan: Scan):
    return {
        "scanId": f"s_{scan.id}",
        "target": scan.target,
        "mode": scan.mode,
        "status": scan.status,
        "progress": scan.progress,
        "startedAt": scan.started_at.isoformat() if scan.started_at else None,
        "estimatedTimeLeft": scan.estimated_time_left,
    }


class ScanListCreateView(AuthenticatedView):
    def post(self, request):
        serializer = ScanCreateSerializer(data=request.data or {})
        if not serializer.is_valid():
            return Response({"error": {"code": 400, "message": serializer.errors}}, status=400)

        target = serializer.validated_data["target"]
        mode = serializer.validated_data["mode"]

        if mode not in ("quick", "full"):
            return Response({"error": {"code": 400, "message": "mode must be 'quick' or 'full'"}}, status=400)
        if not _is_valid_target(target):
            return Response({"error": {"code": 400, "message": "Invalid target URL/IP/CIDR"}}, status=400)

        scan = Scan.objects.create(
            user=request.user,
            target=target,
            mode=mode,
            status="queued",
            progress=0,
            created_at=timezone.now(),
        )

        # enqueue Celery task
        run_scan_task.delay(scan.id)

        return Response(
            {
                "scanId": f"s_{scan.id}",
                "target": scan.target,
                "mode": scan.mode,
                "status": "queued",
                "createdAt": scan.created_at.isoformat(),
            },
            status=201,
        )

    def get(self, request):
        limit = int(request.query_params.get("limit", 10))
        offset = int(request.query_params.get("offset", 0))
        status_filter = request.query_params.get("status")
        mode_filter = request.query_params.get("mode")

        qs = Scan.objects.filter(user=request.user).order_by("-created_at")
        if status_filter in {"queued", "running", "completed", "failed", "canceled"}:
            qs = qs.filter(status=status_filter)
        if mode_filter in {"quick", "full"}:
            qs = qs.filter(mode=mode_filter)

        scans = qs[offset : offset + limit]
        return Response({"scans": [_scan_summary_for_list(s) for s in scans]}, status=200)


class ScanDetailView(AuthenticatedView):
    def get(self, request, scan_id: int):
        try:
            scan = Scan.objects.get(id=scan_id, user=request.user)
        except Scan.DoesNotExist:
            return Response({"error": {"code": 404, "message": "Scan not found"}}, status=404)
        return Response(_scan_detail_for_get(scan), status=200)


class ScanCancelView(AuthenticatedView):
    def post(self, request, scan_id: int):
        try:
            scan = Scan.objects.get(id=scan_id, user=request.user)
        except Scan.DoesNotExist:
            return Response({"error": {"code": 404, "message": "Scan not found"}}, status=404)

        if scan.status in ("completed", "failed", "canceled"):
            # idempotent response
            return Response({"scanId": f"s_{scan.id}", "status": scan.status}, status=200)

        scan.status = "canceled"
        scan.estimated_time_left = None
        scan.save(update_fields=["status", "estimated_time_left"])
        return Response({"scanId": f"s_{scan.id}", "status": "canceled"}, status=200)


class ScanResultView(AuthenticatedView):
    def get(self, request, scan_id: int):
        scan = get_object_or_404(Scan, id=scan_id, user=request.user)
        if scan.status != "completed":
            return Response(
                {"detail": f"Scan is {scan.status}. Results available after completion."},
                status=status.HTTP_409_CONFLICT,
            )
        try:
            result = scan.result  # OneToOne
        except ScanResult.DoesNotExist:
            return Response({"detail": "Results not found."}, status=status.HTTP_404_NOT_FOUND)

        data = {
            "scanId": f"s_{scan.id}",
            "target": scan.target,
            "mode": scan.mode,
            "status": scan.status,
            "result": ScanResultSerializer(result).data,
        }
        return Response(data, status=status.HTTP_200_OK)


class ScanReportView(AuthenticatedView):
    """
    Rich report payload: summary + vulnerabilities + (inline) result.
    """
    def get(self, request, scan_id: int):
        scan = get_object_or_404(Scan, id=scan_id, user=request.user)
        if scan.status != "completed":
            return Response(
                {"detail": f"Scan is {scan.status}. Report available after completion."},
                status=status.HTTP_409_CONFLICT,
            )

        payload = {
            "scanId": f"s_{scan.id}",
            "target": scan.target,
            "mode": scan.mode,
            "status": scan.status,
            "summary": ReportSerializer(scan.report).data if hasattr(scan, "report") and scan.report else None,
            "vulnerabilities": VulnerabilitySerializer(scan.vulnerabilities.all(), many=True).data,
            "result": None,
        }
        try:
            payload["result"] = ScanResultSerializer(scan.result).data
        except ScanResult.DoesNotExist:
            payload["result"] = None

        return Response(payload, status=status.HTTP_200_OK)
