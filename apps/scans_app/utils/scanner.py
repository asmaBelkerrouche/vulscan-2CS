import socket
import ssl
import re
from datetime import datetime, timezone
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Dict, Any, List, Optional, Tuple
from urllib.parse import urlparse

import requests

# ---------- Config ----------
TCP_TIMEOUT = 2.0
HTTP_TIMEOUT = 5.0
MAX_WORKERS = 12
HTTP_HEADERS = {"User-Agent": "vulnscanner-lite/0.1 (+https://example.com)"}

TOP_PORTS_QUICK = [80, 443, 22, 21, 25, 3306, 445]
TOP_PORTS_FULL = [
    21,22,23,25,53,80,110,135,139,143,161,389,443,445,
    3389,5900,8080,8081,8443,3306,9200,27017
]

# best-effort mapping for 'service' field
PORT_SERVICE = {
    21: "ftp", 22: "ssh", 23: "telnet", 25: "smtp", 53: "dns",
    80: "http", 110: "pop3", 135: "msrpc", 139: "netbios-ssn",
    143: "imap", 161: "snmp", 389: "ldap", 443: "https",
    445: "smb", 3389: "rdp", 5900: "vnc", 8080: "http-alt",
    8081: "http-alt", 8443: "https-alt", 3306: "mysql",
    9200: "elasticsearch", 27017: "mongodb"
}

# Example fingerprint index (string containment → “possible CVEs”)
SAMPLE_VULN_INDEX = {
    "OpenSSH": ["CVE-2018-15473"],
    "nginx": ["CVE-2019-20372"],
    "Apache": ["CVE-2021-41773"],
    "OpenSSL": ["CVE-2022-3602"]
}

TITLE_RE = re.compile(r"<title[^>]*>(.*?)</title>", re.IGNORECASE | re.DOTALL)


# ---------- Helpers ----------

def _normalize_target(target: str) -> Tuple[str, str]:
    """
    Returns (host, base_url)
      - host: 'example.com'
      - base_url: 'https://example.com' or 'http://example.com' if scheme present;
                  otherwise 'http://<host>' (we prefer http for first probe)
    """
    t = target.strip()
    if t.startswith("http://") or t.startswith("https://"):
        p = urlparse(t)
        host = p.netloc.split("/", 1)[0]
        scheme = p.scheme
        return host, f"{scheme}://{host}"
    # raw host/IP/CIDR (CIDR is not expanded here; caller provides single target)
    return t, f"http://{t}"


def _tcp_connect(host: str, port: int, timeout: float = TCP_TIMEOUT) -> bool:
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except Exception:
        return False


def _banner_grab(host: str, port: int, timeout: float = TCP_TIMEOUT) -> Optional[str]:
    """
    Minimal, safe banner attempt: connect, send CRLF, read up to 1KB.
    """
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(timeout)
        s.connect((host, port))
        try:
            s.sendall(b"\r\n")
        except Exception:
            pass
        data = b""
        try:
            data = s.recv(1024)
        except Exception:
            pass
        finally:
            s.close()
        if not data:
            return None
        return data.decode(errors="ignore").strip()
    except Exception:
        return None


def _http_session() -> requests.Session:
    s = requests.Session()
    s.headers.update(HTTP_HEADERS)
    return s


def _http_basic_checks(session: requests.Session, base_url: str) -> Dict[str, Any]:
    """
    HEAD (follow redirects), then GET if HEAD not enough or content is HTML.
    Collects status_code, server header, title, robots presence, HSTS, CSP, cookie flags.
    """
    out: Dict[str, Any] = {
        "status": None,
        "title": None,
        "server": None,
        "hsts": False,
        "csp": None,
        "robots": None,
        "cookie_flags": [],
        "redirect_chain": []
    }
    try:
        r = session.head(base_url, allow_redirects=True, timeout=HTTP_TIMEOUT, verify=True)
        out["status"] = r.status_code
        out["server"] = r.headers.get("Server")
        out["redirect_chain"] = [h.url for h in r.history] if r.history else []
        # security headers from the final response
        # HSTS header name is Strict-Transport-Security (case-insensitive)
        out["hsts"] = any(h.lower() == "strict-transport-security" for h in r.headers.keys())
        out["csp"] = r.headers.get("Content-Security-Policy")

        need_get = (out["status"] is None) or ("text/html" in (r.headers.get("Content-Type", "") or "").lower())
        if need_get:
            g = session.get(base_url, allow_redirects=True, timeout=HTTP_TIMEOUT, verify=True)
            out["status"] = g.status_code
            out["server"] = out["server"] or g.headers.get("Server")
            html = g.text or ""
            m = TITLE_RE.search(html)
            if m:
                out["title"] = re.sub(r"\s+", " ", m.group(1).strip())

            # robots.txt
            robots_url = base_url.rstrip("/") + "/robots.txt"
            try:
                rr = session.get(robots_url, timeout=HTTP_TIMEOUT, verify=True)
                out["robots"] = (rr.status_code == 200)
            except Exception:
                out["robots"] = None

            # Set-Cookie flags (very crude)
            set_cookie_headers = g.headers.get("Set-Cookie", "")
            flags = []
            if "HttpOnly" in set_cookie_headers:
                flags.append("HttpOnly")
            if "Secure" in set_cookie_headers:
                flags.append("Secure")
            out["cookie_flags"] = flags

    except requests.RequestException:
        # try plain HTTP if HTTPS failed and scheme not enforced
        if base_url.startswith("https://"):
            try:
                http_url = "http://" + base_url.split("://", 1)[1]
                g = session.get(http_url, allow_redirects=True, timeout=HTTP_TIMEOUT, verify=False)
                out["status"] = g.status_code
                out["server"] = out["server"] or g.headers.get("Server")
                html = g.text or ""
                m = TITLE_RE.search(html)
                if m:
                    out["title"] = re.sub(r"\s+", " ", m.group(1).strip())
            except Exception:
                pass
    except Exception:
        pass

    return out


def _tls_cert_info(host: str, port: int = 443, timeout: float = TCP_TIMEOUT) -> Optional[Dict[str, Any]]:
    """
    Pull server certificate and compute days_left/valid.
    """
    try:
        ctx = ssl.create_default_context()
        with ctx.wrap_socket(socket.socket(socket.AF_INET), server_hostname=host) as s:
            s.settimeout(timeout)
            s.connect((host, port))
            cert = s.getpeercert()
        # Parse dates like 'Oct  1 12:00:00 2025 GMT'
        def _parse_dt(x: Optional[str]) -> Optional[datetime]:
            if not x:
                return None
            try:
                return datetime.strptime(x, "%b %d %H:%M:%S %Y %Z").replace(tzinfo=timezone.utc)
            except Exception:
                return None

        not_before = _parse_dt(cert.get("notBefore"))
        not_after = _parse_dt(cert.get("notAfter"))
        now = datetime.now(timezone.utc)

        days_left = None
        valid = None
        if not_after:
            days_left = (not_after - now).days
            valid = (days_left is not None) and (days_left > 0)

        sans = [v for (_t, v) in cert.get("subjectAltName", ())]
        issuer = cert.get("issuer")
        subject = cert.get("subject")

        return {
            "issuer": issuer,
            "subject": subject,
            "sans": sans,
            "valid_from": cert.get("notBefore"),
            "valid_to": cert.get("notAfter"),
            "days_left": days_left,
            "valid": valid,
        }
    except Exception:
        return None


def _simple_vuln_lookup(text: Optional[str]) -> List[str]:
    if not text:
        return []
    t = text.lower()
    out: List[str] = []
    for k, cves in SAMPLE_VULN_INDEX.items():
        if k.lower() in t:
            out.extend(cves)
    return out


def _scan_port_worker(host: str, port: int) -> Dict[str, Any]:
    state = "open" if _tcp_connect(host, port) else "closed"
    banner = _banner_grab(host, port) if state == "open" else None
    return {
        "port": port,
        "service": PORT_SERVICE.get(port, "unknown"),
        "state": state,
        "banner": banner
    }


# ---------- Public API (used by tasks.py) ----------

def run_scan(scan_id: int, target: str, mode: str) -> Dict[str, Any]:
    """
    Returns dict with keys expected by tasks.py:
      - open_ports: List[ {port, service, state, banner} ]
      - http_info:  {status, title, server, hsts, csp, robots, cookie_flags, redirect_chain}
      - tls_info:   {issuer, subject, sans, valid_from, valid_to, days_left, valid}
      - vulnerabilities: [] or best-effort matches (only in 'full')
    """
    host, base_url = _normalize_target(target)
    ports = TOP_PORTS_QUICK if mode == "quick" else TOP_PORTS_FULL

    # 1) Port scan (threaded)
    open_ports: List[Dict[str, Any]] = []
    with ThreadPoolExecutor(max_workers=min(MAX_WORKERS, max(1, len(ports)))) as pool:
        futures = {pool.submit(_scan_port_worker, host, p): p for p in ports}
        for fut in as_completed(futures):
            open_ports.append(fut.result())

    # 2) HTTP checks (only if 80/443 open)
    http_info: Dict[str, Any] = {}
    try:
        has_http = any(p["port"] == 80 and p["state"] == "open" for p in open_ports)
        has_https = any(p["port"] == 443 and p["state"] == "open" for p in open_ports)
        if has_https:
            base = base_url if base_url.startswith("https://") else "https://" + host
        elif has_http:
            base = base_url if base_url.startswith("http://") else "http://" + host
        else:
            base = None

        if base:
            with _http_session() as sess:
                http_info = _http_basic_checks(sess, base)
    except Exception:
        http_info = {}

    # 3) TLS cert info
    tls_info = _tls_cert_info(host, 443) if any(p["port"] == 443 and p["state"] == "open" for p in open_ports) else {}

    # 4) Basic vuln lookup (string fingerprints)
    matches: List[str] = []
    for p in open_ports:
        if p.get("banner"):
            matches.extend(_simple_vuln_lookup(p["banner"]))
    if http_info.get("server"):
        matches.extend(_simple_vuln_lookup(http_info["server"]))
    matches = sorted(set(matches))

    # For 'full' mode, surface these as “possible” findings (non-exploitative)
    vulnerabilities: List[Dict[str, Any]] = []
    if mode == "full":
        for cve in matches:
            # Convert a fingerprint match into a harmless, informational entry
            # (Your UI labels this as “possible” and advises verification)
            vul_name = f"Possible exposure: {cve}"
            vulnerabilities.append({
                "severity": "low",
                "name": vul_name,
                "path": "/",
                "description": f"Service fingerprint suggests potential relevance of {cve}. Manual verification required.",
                "impact": "May indicate outdated or vulnerable software version.",
                "remediation": "Verify software version; if affected, update to a patched release.",
                "reference_links": [f"https://cve.mitre.org/cgi-bin/cvename.cgi?name={cve}"],
            })

    return {
        "open_ports": open_ports,
        "http_info": http_info,
        "tls_info": tls_info or {},
        "vulnerabilities": vulnerabilities,
    }
