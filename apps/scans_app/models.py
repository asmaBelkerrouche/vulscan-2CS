```python
"""
Database models for VulnScan scanning application.

This module defines the core data structures for vulnerability scanning operations,
including scan sessions, results, vulnerabilities, reports, and user notes.
The models leverage PostgreSQL-specific features like JSONB and ArrayField
for flexible data storage while maintaining relational integrity.

Architecture:
- Scan: Master record for scanning sessions with status tracking
- ScanResult: Detailed technical findings from scans (JSONB for flexibility)
- Vulnerability: Individual security issues with severity classification
- Report: Aggregated scan results for presentation and export
- Note: User annotations on vulnerabilities for collaboration

PostgreSQL Features Used:
- JSONB: For schemaless storage of scan results and technical data
- ArrayField: For storing lists of references and vulnerability IDs
- Foreign Keys: For maintaining relational integrity with CASCADE operations
- DateTimeField: For audit trails and temporal analysis
"""

from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.postgres.fields import ArrayField


class Scan(models.Model):
    """
    Master model for vulnerability scanning sessions.
    
    Tracks the lifecycle of a scan from creation through completion,
    including progress monitoring, timing information, and user association.
    
    Relationships:
    - Many-to-One with User: Each scan belongs to a single user
    - One-to-One with ScanResult: Detailed technical findings
    - One-to-One with Report: Aggregated results for presentation
    - One-to-Many with Vulnerability: Individual security issues found
    
    Fields:
    - user: Owner of the scan (foreign key to User model)
    - target: Hostname, IP address, or URL to scan
    - mode: Scan intensity level (quick/full)
    - status: Current state in scan lifecycle
    - progress: Completion percentage (0-100)
    - timing: Creation, start, and completion timestamps
    - estimated_time_left: Human-readable time estimate
    
    Indexes:
    - Automatic primary key on id
    - Foreign key index on user_id
    - Composite index on (user_id, created_at) for user history
    - Index on status for filtering and monitoring
    """
    
    STATUS_CHOICES = [
        ('queued', 'Queued'),
        ('running', 'Running'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('canceled', 'Canceled'),
    ]
    
    MODE_CHOICES = [
        ('quick', 'Quick Scan'),    # Fast scan with common ports and basic checks
        ('full', 'Full Scan'),      # Comprehensive scan with all ports and deep analysis
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE,
        help_text="User who initiated the scan"
    )
    
    target = models.CharField(
        max_length=255,
        help_text="Target hostname, IP address, or URL to scan"
    )
    
    mode = models.CharField(
        max_length=20, 
        choices=MODE_CHOICES,
        help_text="Scan intensity and depth level"
    )
    
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='queued',
        help_text="Current state of the scan operation"
    )
    
    progress = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Scan completion percentage (0-100)"
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Timestamp when scan was created"
    )
    
    started_at = models.DateTimeField(
        null=True, 
        blank=True,
        help_text="Timestamp when scan execution began"
    )
    
    finished_at = models.DateTimeField(
        null=True, 
        blank=True,
        help_text="Timestamp when scan completed or failed"
    )
    
    estimated_time_left = models.CharField(
        max_length=50, 
        null=True, 
        blank=True,
        help_text="Human-readable estimate of remaining scan time"
    )

    def __str__(self):
        """Human-readable representation of the scan."""
        return f"[{self.id}] {self.target} ({self.mode}) - {self.status}"

    class Meta:
        """Metadata options for the Scan model."""
        verbose_name = "Vulnerability Scan"
        verbose_name_plural = "Vulnerability Scans"
        ordering = ['-created_at']  # Most recent scans first
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['status']),
            models.Index(fields=['created_at']),
        ]

    @property
    def duration(self):
        """
        Calculate the actual or current duration of the scan.
        
        Returns:
            str or None: Duration in human-readable format or None if not started
        """
        if not self.started_at:
            return None
            
        end_time = self.finished_at or timezone.now()
        duration = end_time - self.started_at
        return str(duration).split('.')[0]  # Remove microseconds


class ScanResult(models.Model):
    """
    Detailed technical results from a vulnerability scan.
    
    Stores raw and processed scan data using PostgreSQL JSONB fields
    for flexibility in storing varying types of scan results without
    requiring schema changes for new scan types or tools.
    
    Relationships:
    - One-to-One with Scan: Each scan has one set of detailed results
    
    JSONB Fields:
    - open_ports: List of discovered open ports with service information
    - http_info: HTTP service details (headers, titles, technologies)
    - tls_info: SSL/TLS certificate and configuration details
    - raw_output: Complete raw output from scanning tools for debugging
    
    Design Rationale:
    JSONB provides schema flexibility while maintaining query performance
    and allowing complex nested data structures from various scanning tools.
    """
    
    scan = models.OneToOneField(
        Scan, 
        on_delete=models.CASCADE, 
        related_name="result",
        help_text="Associated scan session"
    )
    
    open_ports = models.JSONField(
        default=list,
        help_text="List of open ports with service details in JSON format"
    )
    
    http_info = models.JSONField(
        default=dict,
        help_text="HTTP service information including headers and technologies"
    )
    
    tls_info = models.JSONField(
        default=dict,
        help_text="TLS/SSL certificate and configuration details"
    )
    
    raw_output = models.JSONField(
        default=dict,
        help_text="Complete raw output from scanning tools for debugging"
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Timestamp when results were first created"
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="Timestamp when results were last updated"
    )

    def __str__(self):
        """Human-readable representation of scan results."""
        return f"Results for Scan #{self.scan_id}"

    class Meta:
        """Metadata options for the ScanResult model."""
        verbose_name = "Scan Result"
        verbose_name_plural = "Scan Results"
        db_table = 'scan_results'  # Explicit table name


class Vulnerability(models.Model):
    """
    Individual security vulnerability findings from scans.
    
    Represents specific security issues discovered during scanning,
    with detailed information about severity, impact, and remediation.
    Supports user collaboration through notes and status tracking.
    
    Relationships:
    - Many-to-One with Scan: Vulnerabilities belong to a specific scan
    - One-to-Many with Note: Users can add annotations to vulnerabilities
    
    Fields:
    - severity: Criticality level from info to critical
    - name: Vulnerability title or CVE identifier
    - path: Affected endpoint or component
    - description: Technical explanation of the issue
    - impact: Potential consequences if exploited
    - remediation: Recommended fix or mitigation
    - reference_links: External resources and documentation
    - status: Tracking state (new, acknowledged, fixed)
    - evidence: Proof or details of the finding
    """
    
    SEVERITY_CHOICES = [
        ('info', 'Information'),
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

    scan = models.ForeignKey(
        Scan, 
        on_delete=models.CASCADE, 
        related_name="vulnerabilities",
        help_text="Scan session where this vulnerability was found"
    )
    
    severity = models.CharField(
        max_length=20, 
        choices=SEVERITY_CHOICES,
        help_text="Criticality level of the vulnerability"
    )
    
    name = models.CharField(
        max_length=255,
        help_text="Vulnerability name or CVE identifier"
    )
    
    path = models.CharField(
        max_length=255, 
        null=True, 
        blank=True,
        help_text="Affected endpoint, URL, or component path"
    )
    
    description = models.TextField(
        null=True, 
        blank=True,
        help_text="Technical description of the vulnerability"
    )
    
    impact = models.TextField(
        null=True, 
        blank=True,
        help_text="Potential consequences if this vulnerability is exploited"
    )
    
    remediation = models.TextField(
        null=True, 
        blank=True,
        help_text="Recommended fix or mitigation steps"
    )
    
    reference_links = ArrayField(
        base_field=models.CharField(max_length=1024),
        default=list,
        blank=True,
        help_text="List of reference URLs for additional information"
    )
    
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='new',
        help_text="Current status in the vulnerability management workflow"
    )
    
    evidence = models.TextField(
        null=True, 
        blank=True,
        help_text="Technical evidence or proof of the vulnerability"
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Timestamp when vulnerability was recorded"
    )

    def __str__(self):
        """Human-readable representation of the vulnerability."""
        return f"{self.name} ({self.severity}) - Scan #{self.scan_id}"

    class Meta:
        """Metadata options for the Vulnerability model."""
        verbose_name = "Vulnerability"
        verbose_name_plural = "Vulnerabilities"
        ordering = ['-severity', 'name']  # Sort by severity then name
        indexes = [
            models.Index(fields=['scan', 'severity']),
            models.Index(fields=['severity']),
            models.Index(fields=['status']),
        ]


class Report(models.Model):
    """
    Aggregated scan results for presentation and export.
    
    Provides summarized information about a scan session suitable for
    reports, dashboards, and external sharing. Includes statistics
    and references to specific vulnerabilities.
    
    Relationships:
    - One-to-One with Scan: Each scan has one report
    
    Fields:
    - Vulnerability counts by severity level
    - Duration of the scan
    - References to specific vulnerability IDs
    - Download link for generated report files
    """
    
    scan = models.OneToOneField(
        Scan, 
        on_delete=models.CASCADE, 
        related_name="report",
        help_text="Associated scan session"
    )
    
    total = models.IntegerField(
        default=0,
        help_text="Total number of vulnerabilities found"
    )
    
    critical = models.IntegerField(
        default=0,
        help_text="Number of critical severity vulnerabilities"
    )
    
    high = models.IntegerField(
        default=0,
        help_text="Number of high severity vulnerabilities"
    )
    
    medium = models.IntegerField(
        default=0,
        help_text="Number of medium severity vulnerabilities"
    )
    
    low = models.IntegerField(
        default=0,
        help_text="Number of low severity vulnerabilities"
    )
    
    info = models.IntegerField(
        default=0,
        help_text="Number of informational findings"
    )
    
    duration = models.CharField(
        max_length=50, 
        null=True, 
        blank=True,
        help_text="Total scan duration in human-readable format"
    )
    
    vulnerabilities = ArrayField(
        base_field=models.IntegerField(),
        default=list,
        blank=True,
        help_text="List of vulnerability IDs included in this report"
    )
    
    download_link = models.CharField(
        max_length=255, 
        null=True, 
        blank=True,
        help_text="URL or path to downloadable report file"
    )
    
    generated_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Timestamp when report was generated"
    )

    def __str__(self):
        """Human-readable representation of the report."""
        return f"Report for Scan #{self.scan_id}"

    class Meta:
        """Metadata options for the Report model."""
        verbose_name = "Scan Report"
        verbose_name_plural = "Scan Reports"
        ordering = ['-generated_at']


class Note(models.Model):
    """
    User annotations and comments on vulnerability findings.
    
    Enables collaboration and knowledge sharing by allowing users
    to add context, observations, and follow-up information to
    specific vulnerabilities.
    
    Relationships:
    - Many-to-One with Vulnerability: Notes belong to a specific vulnerability
    - Many-to-One with User: Notes are created by specific users
    
    Fields:
    - content: Text content of the note
    - Automatic timestamp for creation tracking
    """
    
    vuln = models.ForeignKey(
        Vulnerability, 
        on_delete=models.CASCADE, 
        related_name="notes",
        help_text="Vulnerability this note is associated with"
    )
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE,
        help_text="User who created this note"
    )
    
    content = models.TextField(
        help_text="Text content of the note or comment"
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Timestamp when note was created"
    )

    def __str__(self):
        """Human-readable representation of the note."""
        return f"Note by {self.user} on Vuln #{self.vuln_id}"

    class Meta:
        """Metadata options for the Note model."""
        verbose_name = "Vulnerability Note"
        verbose_name_plural = "Vulnerability Notes"
        ordering = ['-created_at']  # Most recent notes first
        indexes = [
            models.Index(fields=['vuln', 'created_at']),
        ]


"""
Database Schema Overview:

Tables:
1. scans_scan           - Master scan sessions
2. scans_scanresult     - Detailed technical results (JSONB)
3. scans_vulnerability  - Individual security findings  
4. scans_report         - Aggregated results for reporting
5. scans_note           - User annotations on vulnerabilities

Key Relationships:
Scan (1) ───── (1) ScanResult
   │
   │ (1)
   │
   ▼
Vulnerability (1) ───── (N) Note
   │
   │ (N)
   │  
   ▼
Report (includes vulnerability IDs)

PostgreSQL-Specific Features:
- JSONB fields in ScanResult for flexible data storage
- ArrayField for reference_links and vulnerabilities lists
- Automatic indexes on foreign keys
- DateTime fields with timezone support

Performance Considerations:
- Large scan results may require partitioning for very high volume
- JSONB fields are indexed for query performance
- Consider materialized views for complex report aggregations
- Regular vacuum and analyze for optimal performance

Migration Strategy:
- Use Django migrations for schema evolution
- Test with production-like data volumes
- Consider data migration strategies for schema changes
- Use --dry-run to preview migration changes

Security Considerations:
- User data isolation via foreign key constraints
- Input validation at API level before database storage
- Regular security updates for Django and PostgreSQL
- Backup and recovery procedures for scan data
"""
```
