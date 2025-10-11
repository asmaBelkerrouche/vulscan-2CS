from pathlib import Path
from django.db import models
from django.contrib.auth.models import User

def avatar_upload_to(instance, filename):
    # e.g. avatars/42/avatar.jpg
    return f"avatars/{instance.user_id}/avatar{Path(filename).suffix}"

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    avatar = models.ImageField(upload_to=avatar_upload_to, null=True, blank=True)

    def __str__(self):
        return f"Profile({self.user_id})"
