"""
URL configuration for VulnScan vulnerability scanner project.

This module defines the URL routing for the entire VulnScan application.
It serves as the main entry point for all HTTP requests and delegates
to appropriate application-specific URL configurations.

The `urlpatterns` list routes URLs to views. For more information please see:
https://docs.djangoproject.com/en/5.2/topics/http/urls/
"""
from django.http import HttpResponse
from django.contrib import admin
from django.urls import path, include
from django.conf.urls.static import static
from django.conf import settings

def home(request):
    return HttpResponse("Backend is running!")

# Main URL patterns for the VulnScan application
urlpatterns = [
    path('', home),  # Root URL now shows a message
    # Django administration interface
    path('admin/', admin.site.urls),

    # Authentication application URLs
    path("api/auth/", include("apps.auth_app.urls")),

    # Scanning application URLs
    path("api/scans/", include("apps.scans_app.urls")),
]

# Serve media files during development only
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    
    # Optional: Add debug toolbar if installed
    try:
        import debug_toolbar
        urlpatterns += [
            path('__debug__/', include(debug_toolbar.urls)),
        ]
    except ImportError:
        pass
        
