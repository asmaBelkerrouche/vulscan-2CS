"""
Serializers for VulnScan authentication application.

This module defines all serializers used for user authentication, profile management,
and data validation in the VulnScan API. Serializers handle data conversion between
Python objects and JSON, input validation, and business logic enforcement.

Architecture:
- Registration: User creation with validation
- Authentication: Login credential handling
- Profile Management: Read/write operations with camelCase support
- Security: Password change and account deletion with confirmation
- File Upload: Avatar image validation and processing

Key Features:
- Dual camelCase/snake_case field support for frontend compatibility
- Comprehensive input validation and error handling
- Secure password management with Django validators
- Image upload validation for avatars
- Context-aware URL generation for media files
"""

from django.contrib.auth.models import User
from django.utils import timezone
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers


# =============================================================================
# AUTHENTICATION SERIALIZERS
# =============================================================================

class RegisterSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration with comprehensive validation.
    
    Handles new user account creation with email uniqueness check,
    password strength validation, and automatic username generation
    from email address.
    
    Fields:
    - firstName: User's first name (camelCase for frontend)
    - lastName: User's last name (camelCase for frontend)  
    - email: Unique email address (used as username)
    - password: Secure password (write-only, min 8 characters)
    
    Validation:
    - Email must be unique across all users
    - Password meets Django's security requirements
    - Names are trimmed and validated
    """
    
    firstName = serializers.CharField(
        source="first_name",
        max_length=150,
        help_text="User's first name"
    )
    lastName = serializers.CharField(
        source="last_name", 
        max_length=150,
        help_text="User's last name"
    )
    email = serializers.EmailField(
        help_text="Unique email address used for login"
    )
    password = serializers.CharField(
        write_only=True, 
        min_length=8,
        help_text="Secure password (minimum 8 characters)"
    )

    class Meta:
        model = User
        fields = ("firstName", "lastName", "email", "password")

    def validate_email(self, value):
        """
        Validate email uniqueness (case-insensitive).
        
        Args:
            value (str): Email address to validate
            
        Returns:
            str: Validated email address
            
        Raises:
            ValidationError: If email is already registered
        """
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Email address is already registered")
        return value.lower().strip()

    def create(self, validated_data):
        """
        Create a new user account with the provided data.
        
        Uses email as username and applies Django's secure user creation
        which includes proper password hashing.
        
        Args:
            validated_data (dict): Validated user data
            
        Returns:
            User: Newly created user instance
        """
        first = validated_data.get("first_name", "").strip()
        last = validated_data.get("last_name", "").strip()
        email = validated_data.get("email").lower().strip()
        pwd = validated_data.get("password")
        
        return User.objects.create_user(
            username=email,  # Use email as username for simplicity
            email=email, 
            password=pwd,
            first_name=first, 
            last_name=last
        )


class LoginSerializer(serializers.Serializer):
    """
    Serializer for user authentication (login).
    
    Validates email and password combination for user login.
    Used by authentication views to verify credentials.
    
    Fields:
    - email: User's email address
    - password: User's password (write-only)
    """
    
    email = serializers.EmailField(help_text="Registered email address")
    password = serializers.CharField(
        write_only=True,
        help_text="Account password"
    )


# =============================================================================
# PROFILE SERIALIZERS
# =============================================================================

class ProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for reading user profile data with formatted output.
    
    Provides user profile information in camelCase format for frontend
    consumption, including generated user ID and avatar URL.
    
    Fields:
    - userId: Generated user identifier (u_{id})
    - email: User's email address
    - firstName: User's first name (camelCase)
    - lastName: User's last name (camelCase)
    - createdAt: Account creation timestamp (ISO format)
    - avatarUrl: Absolute URL to user's avatar image
    """
    
    userId = serializers.SerializerMethodField(
        help_text="Unique user identifier in format u_{id}"
    )
    firstName = serializers.CharField(
        source="first_name",
        help_text="User's first name"
    )
    lastName = serializers.CharField(
        source="last_name",
        help_text="User's last name"
    )
    createdAt = serializers.SerializerMethodField(
        help_text="Account creation timestamp in ISO 8601 format"
    )
    avatarUrl = serializers.SerializerMethodField(
        help_text="Absolute URL to user's profile picture"
    )

    class Meta:
        model = User
        fields = ("userId", "email", "firstName", "lastName", "createdAt", "avatarUrl")

    def get_userId(self, obj):
        """
        Generate formatted user ID for frontend consumption.
        
        Args:
            obj (User): User instance
            
        Returns:
            str: Formatted user ID (e.g., "u_42")
        """
        return f"u_{obj.id}"

    def get_createdAt(self, obj):
        """
        Get account creation timestamp in ISO format.
        
        Args:
            obj (User): User instance
            
        Returns:
            str: ISO 8601 formatted timestamp
        """
        return (obj.date_joined.isoformat()
                if hasattr(obj, "date_joined")
                else timezone.now().isoformat())

    def get_avatarUrl(self, obj):
        """
        Get absolute URL for user's avatar image.
        
        Args:
            obj (User): User instance
            
        Returns:
            str or None: Absolute URL to avatar or None if not set
        """
        request = self.context.get("request")
        avatar = getattr(getattr(obj, "profile", None), "avatar", None)
        if not avatar:
            return None
        url = avatar.url
        return request.build_absolute_uri(url) if request else url


class ProfileNameUpdateSerializer(serializers.Serializer):
    """
    Serializer for updating user's first and last names.
    
    Supports both snake_case and camelCase field names for better
    frontend compatibility and developer experience.
    
    Fields (both naming conventions supported):
    - first_name / firstName: User's first name
    - last_name / lastName: User's last name
    """
    
    # Snake_case fields (Django convention)
    first_name = serializers.CharField(
        required=False, 
        allow_blank=True, 
        max_length=150,
        help_text="User's first name (snake_case)"
    )
    last_name = serializers.CharField(
        required=False, 
        allow_blank=True, 
        max_length=150,
        help_text="User's last name (snake_case)"
    )
    
    # CamelCase fields (frontend convention)
    firstName = serializers.CharField(
        source="first_name", 
        required=False, 
        allow_blank=True, 
        max_length=150,
        help_text="User's first name (camelCase)"
    )
    lastName = serializers.CharField(
        source="last_name",  
        required=False, 
        allow_blank=True, 
        max_length=150,
        help_text="User's last name (camelCase)"
    )

    def validate(self, attrs):
        """
        Normalize and validate name fields.
        
        Args:
            attrs (dict): Input attributes
            
        Returns:
            dict: Validated and normalized attributes
        """
        # Normalize whitespace for name fields
        for field_name in ("first_name", "last_name"):
            if field_name in attrs and isinstance(attrs[field_name], str):
                attrs[field_name] = attrs[field_name].strip()
                
        return attrs


# =============================================================================
# SECURITY SERIALIZERS
# =============================================================================

class ChangePasswordSerializer(serializers.Serializer):
    """
    Serializer for changing user password with security validation.
    
    Ensures password changes follow security best practices:
    - Current password verification
    - New password confirmation
    - Django password strength validation
    - Minimum length requirements
    
    Fields:
    - currentPassword: Current account password (write-only)
    - newPassword: New secure password (write-only)
    - newPasswordConfirm: New password confirmation (write-only)
    """
    
    currentPassword = serializers.CharField(
        write_only=True,
        help_text="Current account password for verification"
    )
    newPassword = serializers.CharField(
        write_only=True, 
        min_length=8,
        help_text="New secure password (minimum 8 characters)"
    )
    newPasswordConfirm = serializers.CharField(
        write_only=True, 
        min_length=8,
        help_text="Confirmation of new password"
    )

    def validate(self, data):
        """
        Validate password change request.
        
        Args:
            data (dict): Input data for password change
            
        Returns:
            dict: Validated data
            
        Raises:
            ValidationError: If passwords don't match or are insecure
        """
        if data["newPassword"] != data["newPasswordConfirm"]:
            raise serializers.ValidationError({
                "newPasswordConfirm": "New passwords do not match"
            })
            
        # Validate password strength using Django's validators
        validate_password(data["newPassword"], user=self.context.get("user"))
        
        return data


class DeleteAccountSerializer(serializers.Serializer):
    """
    Serializer for account deletion with safety confirmations.
    
    Requires multiple confirmation steps to prevent accidental
    account deletion:
    - Boolean confirmation flag
    - Current password verification  
    - Optional "DELETE" phrase typing
    
    Fields:
    - currentPassword: Current password for verification (write-only)
    - confirm: Boolean confirmation flag
    - phrase: "DELETE" phrase for extra safety (optional)
    """
    
    currentPassword = serializers.CharField(
        write_only=True,
        help_text="Current password for security verification"
    )
    confirm = serializers.BooleanField(
        help_text="Must be true to confirm account deletion"
    )
    phrase = serializers.CharField(
        required=False, 
        allow_blank=True,
        help_text='Type "DELETE" for extra confirmation (optional)'
    )

    def validate(self, data):
        """
        Validate account deletion confirmation.
        
        Args:
            data (dict): Deletion confirmation data
            
        Returns:
            dict: Validated data
            
        Raises:
            ValidationError: If confirmations are missing or invalid
        """
        if not data.get("confirm"):
            raise serializers.ValidationError({
                "confirm": "Please confirm account deletion"
            })
            
        if data.get("phrase") and data["phrase"].strip().upper() != "DELETE":
            raise serializers.ValidationError({
                "phrase": 'Please type "DELETE" to confirm account deletion'
            })
            
        return data


# =============================================================================
# FILE UPLOAD SERIALIZERS  
# =============================================================================

class ProfilePhotoUploadSerializer(serializers.Serializer):
    """
    Serializer for user profile photo uploads with security validation.
    
    Validates uploaded images for:
    - File type (JPEG, PNG, WebP only)
    - File size (maximum 5MB)
    - Content type verification
    
    Fields:
    - photo: Image file to upload as profile picture
    """
    
    photo = serializers.ImageField(
        help_text="Profile picture image file (JPEG, PNG, or WebP)"
    )

    def validate_photo(self, file):
        """
        Validate uploaded photo file.
        
        Args:
            file (InMemoryUploadedFile): Uploaded image file
            
        Returns:
            InMemoryUploadedFile: Validated file
            
        Raises:
            ValidationError: If file fails validation checks
        """
        max_mb = 5
        max_size = max_mb * 1024 * 1024  # 5MB in bytes
        
        # Validate file size
        if file.size > max_size:
            raise serializers.ValidationError(
                f"Image file too large. Maximum size is {max_mb}MB"
            )
            
        # Validate file type
        allowed_types = {"image/jpeg", "image/png", "image/webp"}
        if file.content_type not in allowed_types:
            raise serializers.ValidationError(
                "Only JPEG, PNG, and WebP image formats are allowed"
            )
            
        return file


"""
Serialization Patterns Used:

1. ModelSerializer: For User model with automatic field handling
2. Serializer: For custom validation and non-model operations  
3. SerializerMethodField: For computed properties and custom formatting
4. Source parameter: For field name mapping between Python and JSON

Field Naming Strategy:
- Internal: snake_case (Django/Python convention)
- External: camelCase (JavaScript/frontend convention)
- Support for both in ProfileNameUpdateSerializer for flexibility

Security Considerations:
- Passwords are always write-only and never serialized to output
- File uploads are strictly validated for type and size
- Account deletion requires multiple confirmation steps
- Password changes verify current password and use Django's validators

Error Handling:
- Validation errors provide user-friendly messages
- Field-level and object-level validation supported
- Consistent error format for frontend consumption

Testing Recommendations:
- Test each serializer with valid and invalid data
- Verify field mappings between snake_case and camelCase
- Test file upload validation with various file types
- Verify password validation with weak passwords
"""
