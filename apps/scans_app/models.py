from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.postgres.fields import ArrayField


class Scan(models.Model):
    STATUS_CHOICES = [
        ('queued', 'Queued'),
        ('running', 'Running'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('canceled', 'Canceled'),
    ]
    MODE_CHOICES = [('quick', 'Quick'), ('full', 'Full')]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)  # auth_user FK
    target = models.CharField(max_length=255)
    mode = models.CharField(max_length=20, choices=MODE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='queued')
    progress = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    created_at = models.DateTimeField(auto_now_add=True)   # DEFAULT NOW()
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    estimated_time_left = models.CharField(max_length=50, null=True, blank=True)

    def __str__(self):
        return f"[{self.id}] {self.target} ({self.mode}) - {self.status}"


class ScanResult(models.Model):
    # scan_id INT UNIQUE REFERENCES scans(id) ON DELETE CASCADE
    scan = models.OneToOneField(Scan, on_delete=models.CASCADE, related_name="result")
    # JSONB columns (schemaless, evolve over time)
    open_ports = models.JSONField(default=list)   # [{"port":80,"service":"http","banner":"nginx"}, ...]
    http_info = models.JSONField(default=dict)    # {"status":200,"title":"Home","server":"Apache"}
    tls_info = models.JSONField(default=dict)     # {"issuer":"Let's Encrypt","valid":true,...}
    raw_output = models.JSONField(default=dict)   # optional raw results / debug
    created_at = models.DateTimeField(auto_now_add=True)  # DEFAULT NOW()
    updated_at = models.DateTimeField(auto_now=True)      # trigger equivalent


class Vulnerability(models.Model):
    SEVERITY_CHOICES = [
        ('info', 'Info'),
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    STATUS_CHOICES = [
        ('new', 'New'),
        ('acknowledged', 'Acknowledged'),
        ('fixed', 'Fixed'),
    ]

    scan = models.ForeignKey(Scan, on_delete=models.CASCADE, related_name="vulnerabilities")
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES)
    name = models.CharField(max_length=255)
    path = models.CharField(max_length=255, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    impact = models.TextField(null=True, blank=True)
    remediation = models.TextField(null=True, blank=True)
    # TEXT[] in SQL → ArrayField(CharField)
    reference_links = ArrayField(
        base_field=models.CharField(max_length=1024),
        default=list,
        blank=True,
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    evidence = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)  # DEFAULT NOW()


class Report(models.Model):
    scan = models.OneToOneField(Scan, on_delete=models.CASCADE, related_name="report")
    total = models.IntegerField(default=0)
    critical = models.IntegerField(default=0)
    high = models.IntegerField(default=0)
    medium = models.IntegerField(default=0)
    low = models.IntegerField(default=0)
    info = models.IntegerField(default=0)
    duration = models.CharField(max_length=50, null=True, blank=True)
    # INT[] in SQL → ArrayField(IntegerField)
    vulnerabilities = ArrayField(
        base_field=models.IntegerField(),
        default=list,
        blank=True,
    )
    download_link = models.CharField(max_length=255, null=True, blank=True)
    generated_at = models.DateTimeField(auto_now_add=True)  # DEFAULT NOW()


# Optional: Notes table (from your DDL)
class Note(models.Model):
    vuln = models.ForeignKey(Vulnerability, on_delete=models.CASCADE, related_name="notes")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
