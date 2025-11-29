"""
URL configuration for VulnScan vulnerability scanner project.

This module defines the URL routing for the entire VulnScan application.
It serves as the main entry point for all HTTP requests and delegates
to appropriate application-specific URL configurations.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/

Architecture:
- Admin interface: /admin/
- Authentication API: /api/auth/* (delegated to auth_app)
- Scanning API: /api/scans/* (delegated to scans_app)
- Media files: /media/* (served only in DEBUG mode)

Security Note:
- Admin routes are protected by Django's built-in authentication
- API routes use JWT authentication via custom middleware
- Media files are only served in development for security
"""

from django.contrib import admin
from django.urls import path, include
from django.conf.urls.static import static
from django.conf import settings

# Main URL patterns for the VulnScan application
urlpatterns = [
    # Django administration interface
    # Provides built-in admin panel for database management
    # Accessible at: http://localhost:8000/admin/
    path('admin/', admin.site.urls),
    
    # Authentication application URLs
    # Includes all user management endpoints (register, login, logout, profile)
    # API endpoints: /api/auth/register, /api/auth/login, /api/auth/logout, etc.
    path("api/auth/", include("apps.auth_app.urls")),
    
    # Scanning application URLs  
    # Includes all vulnerability scanning endpoints (scans, reports, history)
    # API endpoints: /api/scans/, /api/scans/{id}/, /api/scans/{id}/report, etc.
    path("api/scans/", include("apps.scans_app.urls")),
]

# Serve media files during development only
# In production, media files should be served by a web server (nginx/apache)
# This prevents security issues with serving user-uploaded files in production
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    
    # Optional: Add debug toolbar if installed
    # This helps with performance analysis and debugging during development
    try:
        import debug_toolbar
        urlpatterns += [
            path('__debug__/', include(debug_toolbar.urls)),
        ]
    except ImportError:
        # Debug toolbar not installed, continue without it
        pass

"""
URL Structure Overview:

Admin Routes:
└── /admin/                     - Django admin interface

Authentication API Routes:
└── /api/auth/
    ├── register/               - User registration
    ├── login/                  - User authentication
    ├── logout/                 - User logout
    ├── profile/                - User profile management
    ├── change-password/        - Password update
    └── ...                     - Other auth endpoints

Scanning API Routes:
└── /api/scans/
    ├── ""                      - List scans & create new scans
    ├── <scan_id>/              - Get scan details
    ├── <scan_id>/cancel/       - Cancel ongoing scan
    ├── <scan_id>/report/       - Get scan report
    ├── <scan_id>/download/     - Download report
    └── ...                     - Other scan endpoints

Media Routes (Development only):
└── /media/
    ├── avatars/                - User profile pictures
    └── reports/                - Generated scan reports

API Versioning Note:
Currently using unversioned API endpoints. For future scalability,
consider implementing API versioning (e.g., /api/v1/auth/).

Security Considerations:
- All API endpoints (except auth) require JWT authentication
- Admin interface requires staff user credentials
- Media files are validated before serving
- CORS is configured for frontend communication
"""
```
