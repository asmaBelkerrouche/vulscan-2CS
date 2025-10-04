from rest_framework import serializers
from .models import Scan, ScanResult, Vulnerability, Report

class ScanResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScanResult
        fields = ["open_ports","http_info","tls_info","raw_output","created_at","updated_at"]

class VulnerabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Vulnerability
        fields = ["id","severity","name","path","description","impact","remediation","reference_links","status","evidence","created_at"]

class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = ["total","critical","high","medium","low","info","duration","vulnerabilities","download_link","generated_at"]

class ScanSerializer(serializers.ModelSerializer):
    result = ScanResultSerializer(read_only=True)
    vulnerabilities = VulnerabilitySerializer(many=True, read_only=True)
    report = ReportSerializer(read_only=True)

    class Meta:
        model = Scan
        fields = [
            "id","target","mode","status","progress","created_at",
            "started_at","finished_at","estimated_time_left",
            "result","vulnerabilities","report",
        ]

class ScanCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Scan
        fields = ["target","mode"]


        
