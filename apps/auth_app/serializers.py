from django.contrib.auth.models import User
from django.utils import timezone
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

# ---------- Auth ----------
class RegisterSerializer(serializers.ModelSerializer):
    firstName = serializers.CharField(source="first_name")
    lastName  = serializers.CharField(source="last_name")
    email     = serializers.EmailField()
    password  = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model  = User
        fields = ("firstName", "lastName", "email", "password")

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Email already registered")
        return value

    def create(self, validated_data):
        first = validated_data.get("first_name", "")
        last  = validated_data.get("last_name", "")
        email = validated_data.get("email")
        pwd   = validated_data.get("password")
        return User.objects.create_user(
            username=email, email=email, password=pwd,
            first_name=first, last_name=last
        )

class LoginSerializer(serializers.Serializer):
    email    = serializers.EmailField()
    password = serializers.CharField(write_only=True)

# ---------- Profile read ----------
class ProfileSerializer(serializers.ModelSerializer):
    userId    = serializers.SerializerMethodField()
    firstName = serializers.CharField(source="first_name")
    lastName  = serializers.CharField(source="last_name")
    createdAt = serializers.SerializerMethodField()
    avatarUrl = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = ("userId", "email", "firstName", "lastName", "createdAt", "avatarUrl")

    def get_userId(self, obj):
        return f"u_{obj.id}"

    def get_createdAt(self, obj):
        return (obj.date_joined.isoformat()
                if hasattr(obj, "date_joined")
                else timezone.now().isoformat())

    def get_avatarUrl(self, obj):
        request = self.context.get("request")
        avatar = getattr(getattr(obj, "profile", None), "avatar", None)
        if not avatar:
            return None
        url = avatar.url
        return request.build_absolute_uri(url) if request else url

# ---------- Profile write ----------
class ProfileNameUpdateSerializer(serializers.Serializer):
    # accept both snake_case and camelCase
    first_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    last_name  = serializers.CharField(required=False, allow_blank=True, max_length=150)
    firstName  = serializers.CharField(source="first_name", required=False, allow_blank=True, max_length=150)
    lastName   = serializers.CharField(source="last_name",  required=False, allow_blank=True, max_length=150)

    def validate(self, attrs):
        # normalize whitespace
        for k in ("first_name", "last_name"):
            if k in attrs and isinstance(attrs[k], str):
                attrs[k] = attrs[k].strip()
        return attrs

# ---------- Password & deletion ----------
class ChangePasswordSerializer(serializers.Serializer):
    currentPassword    = serializers.CharField(write_only=True)
    newPassword        = serializers.CharField(write_only=True, min_length=8)
    newPasswordConfirm = serializers.CharField(write_only=True, min_length=8)

    def validate(self, data):
        if data["newPassword"] != data["newPasswordConfirm"]:
            raise serializers.ValidationError({"newPasswordConfirm": "Passwords do not match"})
        validate_password(data["newPassword"], user=self.context.get("user"))
        return data

class DeleteAccountSerializer(serializers.Serializer):
    currentPassword = serializers.CharField(write_only=True)
    confirm         = serializers.BooleanField()
    phrase          = serializers.CharField(required=False, allow_blank=True)

    def validate(self, data):
        if not data.get("confirm"):
            raise serializers.ValidationError({"confirm": "Please confirm account deletion"})
        if data.get("phrase") and data["phrase"].strip().upper() != "DELETE":
            raise serializers.ValidationError({"phrase": "Type DELETE to confirm"})
        return data

# ---------- Photo upload ----------
class ProfilePhotoUploadSerializer(serializers.Serializer):
    photo = serializers.ImageField()

    def validate_photo(self, file):
        max_mb = 5
        if file.size > max_mb * 1024 * 1024:
            raise serializers.ValidationError(f"Image too large (>{max_mb}MB)")
        if file.content_type not in {"image/jpeg", "image/png", "image/webp"}:
            raise serializers.ValidationError("Only JPEG/PNG/WebP allowed")
        return file
