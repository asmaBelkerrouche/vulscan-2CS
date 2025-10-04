from django.urls import path
from .views import ScanListCreateView, ScanDetailView, ScanCancelView ,ScanResultView ,ScanReportView

urlpatterns = [
    path("scans", ScanListCreateView.as_view(), name="scan-list-create"),
    path("scans/<int:scan_id>", ScanDetailView.as_view(), name="scan-detail"),
    path("scans/<int:scan_id>/cancel", ScanCancelView.as_view(), name="scan-cancel"),
    path("scans/<int:scan_id>/result", ScanResultView.as_view(), name="scan-result"),
    path("scans/<int:scan_id>/report", ScanReportView.as_view(), name="scan-report"),
]
