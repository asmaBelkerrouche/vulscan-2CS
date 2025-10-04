# vulnscanner/celery.py
import os
from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "vulnscanner.settings")
app = Celery("vulnscanner")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()
