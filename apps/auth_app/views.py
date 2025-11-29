
"""
View controllers for VulnScan authentication application.

This module contains all API view classes that handle HTTP requests for user
authentication, profile management, and account operations. Each view follows
Django REST Framework patterns with proper authentication, validation, and
response handling.

Architecture:
- APIView-based classes for clear separation of concerns
- JWT authentication via HTTP-only cookies for security
- Comprehensive error handling with consistent response formats
- Support for both JSON and multipart form data

Security Features:
- Password hashing using Django's secure password hashers
- JWT token generation with expiration
- HTTP-only cookies to prevent XSS token theft
- CSRF protection with exemptions only for specific testing scenarios
- Input validation at both serializer and view levels
"""

from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser

from .authentication import CookieJWTAuthentication
from .jwt_utils import create_jwt_for_user
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    ProfileSerializer,
    ChangePasswordSerializer,
    DeleteAccountSerializer,
    ProfilePhotoUploadSerializer,
    ProfileNameUpdateSerializer,
)
from .utils.images import process_avatar
from .models import UserProfile

# Authentication cookie configuration
AUTH_COOKIE_NAME = "auth_token"
AUTH_COOKIE_AGE = 7 * 24 * 60 * 60  # 7 days in seconds

# Security note: Set secure=True in production when using HTTPS
COOKIE_SECURE_SETTING = False  # Change to True in production environment


class RegisterView(APIView):
    """
    Handle user registration with account creation and automatic login.
    
    This view creates a new user account, generates a JWT token, and
    automatically logs the user in by setting an authentication cookie.
    
    Flow:
    1. Validate registration data using RegisterSerializer
    2. Create new user with hashed password
    3. Generate JWT token for the new user
    4. Set HTTP-only cookie with the token
    5. Return user profile data with 201 status
    
    Permissions: AllowAny (public endpoint)
    Methods: POST only
    """
    
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        """
        Process user registration request.
        
        Args:
            request: HTTP request with registration data
            
        Returns:
            Response: 201 Created with user data and auth cookie, or error response
            
        Example Request:
            POST /api/auth/register
            {
                "firstName": "John",
                "lastName": "Doe", 
                "email": "john@example.com",
                "password": "Secure123!"
            }
        """
        serializer = RegisterSerializer(data=request.data)
        
        if serializer.is_valid():
            # Create new user account
            user = serializer.save()
            
            # Generate JWT token for automatic login
            token = create_jwt_for_user(user)
            
            # Build success response with user data
            response = Response(
                {
                    "user": {
                        "userId": f"u_{user.id}",
                        "email": user.email,
                        "firstName": user.first_name,
                        "lastName": user.last_name,
                        "createdAt": getattr(user, "date_joined", timezone.now()).isoformat(),
                    }
                },
                status=status.HTTP_201_CREATED,
            )
            
            # Set authentication cookie for automatic login
            response.set_cookie(
                AUTH_COOKIE_NAME,
                token,
                httponly=True,      # Prevent XSS access
                samesite="Strict",  # CSRF protection
                secure=COOKIE_SECURE_SETTING,  # HTTPS only in production
                max_age=AUTH_COOKIE_AGE,       # 7 days expiration
                path="/",           # Available across entire site
            )
            return response

        # Handle specific email conflict error
        if "email" in serializer.errors and any(
            "already registered" in str(m) for m in serializer.errors["email"]
        ):
            return Response(
                {"error": {"code": 409, "message": "Email already registered"}}, 
                status=409
            )
            
        # Return generic validation errors
        return Response(
            {"error": {"code": 400, "message": serializer.errors}}, 
            status=400
        )


class LoginView(APIView):
    """
    Handle user authentication and JWT token generation.
    
    Validates user credentials and upon success, generates a JWT token
    and sets it as an HTTP-only cookie for subsequent authenticated requests.
    
    Flow:
    1. Validate login credentials using LoginSerializer
    2. Authenticate user with Django's authenticate()
    3. Generate JWT token for authenticated user
    4. Set HTTP-only cookie with the token
    5. Return user profile data
    
    Permissions: AllowAny (public endpoint)
    Methods: POST only
    """
    
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        """
        Process user login request.
        
        Args:
            request: HTTP request with login credentials
            
        Returns:
            Response: 200 OK with user data and auth cookie, or 401 Unauthorized
            
        Example Request:
            POST /api/auth/login
            {
                "email": "john@example.com",
                "password": "Secure123!"
            }
        """
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        email = serializer.validated_data["email"]
        password = serializer.validated_data["password"]

        # Authenticate user with Django's built-in system
        user = authenticate(request, username=email, password=password)
        if user is None:
            return Response(
                {"error": {"code": 401, "message": "Invalid email or password"}}, 
                status=401
            )

        # Generate JWT token for authenticated session
        token = create_jwt_for_user(user)
        
        # Build success response
        response = Response(
            {
                "user": {
                    "userId": f"u_{user.id}",
                    "email": user.email,
                    "firstName": user.first_name,
                    "lastName": user.last_name,
                }
            },
            status=200,
        )
        
        # Set authentication cookie
        response.set_cookie(
            AUTH_COOKIE_NAME,
            token,
            httponly=True,
            samesite="Strict",
            secure=COOKIE_SECURE_SETTING,
            max_age=AUTH_COOKIE_AGE,
            path="/",
        )
        return response


class LogoutView(APIView):
    """
    Handle user logout by clearing authentication cookie.
    
    This view invalidates the user's session by removing the JWT token
    from the client's cookies. The token itself remains valid until
    expiration but cannot be used without the cookie.
    
    Permissions: IsAuthenticated (requires valid JWT)
    Methods: POST only
    """
    
    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """
        Process user logout request.
        
        Args:
            request: HTTP request (authentication handled by middleware)
            
        Returns:
            Response: 204 No Content with cleared auth cookie
        """
        response = Response(status=status.HTTP_204_NO_CONTENT)
        response.delete_cookie(AUTH_COOKIE_NAME, path="/")
        return response


class ProfileView(APIView):
    """
    Retrieve current user's profile information.
    
    Provides read-only access to the authenticated user's profile data
    including user ID, email, names, creation date, and avatar URL.
    
    Permissions: IsAuthenticated (requires valid JWT)
    Methods: GET only
    """
    
    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """
        Retrieve current user profile.
        
        Args:
            request: HTTP request with authenticated user
            
        Returns:
            Response: 200 OK with serialized user profile data
        """
        return Response(
            {"user": ProfileSerializer(request.user).data}, 
            status=200
        )


class ChangePasswordView(APIView):
    """
    Handle password change requests with security validation.
    
    Requires the current password for verification and ensures the new
    password meets security requirements. Upon success, issues a new
    JWT token to maintain the authenticated session.
    
    Permissions: IsAuthenticated (requires valid JWT)
    Methods: POST only
    """
    
    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    # @method_decorator(csrf_exempt)  # Uncomment only for testing with Postman
    def post(self, request):
        """
        Process password change request.
        
        Args:
            request: HTTP request with password change data
            
        Returns:
            Response: 200 OK with success message and new auth cookie, or error
            
        Example Request:
            POST /api/auth/profile/change-password
            {
                "currentPassword": "oldPassword123",
                "newPassword": "newSecurePassword456", 
                "newPasswordConfirm": "newSecurePassword456"
            }
        """
        serializer = ChangePasswordSerializer(
            data=request.data, 
            context={"user": request.user}
        )
        serializer.is_valid(raise_exception=True)

        user = request.user
        
        # Verify current password
        if not user.check_password(serializer.validated_data["currentPassword"]):
            return Response(
                {"error": {"code": 401, "message": "Current password is incorrect"}}, 
                status=401
            )

        # Update password with secure hashing
        user.set_password(serializer.validated_data["newPassword"])
        user.save()

        # Generate new JWT token since password changed
        token = create_jwt_for_user(user)
        response = Response(
            {"detail": "Password updated successfully"}, 
            status=200
        )
        
        # Update authentication cookie with new token
        response.set_cookie(
            AUTH_COOKIE_NAME,
            token,
            httponly=True,
            samesite="Strict",
            secure=COOKIE_SECURE_SETTING,
            max_age=AUTH_COOKIE_AGE,
            path="/",
        )
        return response


class DeleteAccountView(APIView):
    """
    Handle user account deletion with safety confirmations.
    
    Requires multiple verification steps including current password
    and optional confirmation phrase to prevent accidental deletion.
    Upon success, deletes the user account and clears authentication cookie.
    
    Permissions: IsAuthenticated (requires valid JWT)
    Methods: POST, DELETE
    """
    
    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def _handle(self, request):
        """
        Common handler for account deletion requests.
        
        Args:
            request: HTTP request with deletion confirmation data
            
        Returns:
            Response: 204 No Content with cleared auth cookie, or error
        """
        serializer = DeleteAccountSerializer(data=request.data or {})
        serializer.is_valid(raise_exception=True)

        user = request.user
        
        # Verify current password for security
        if not user.check_password(serializer.validated_data["currentPassword"]):
            return Response(
                {"error": {"code": 401, "message": "Current password is incorrect"}}, 
                status=401
            )

        # Permanently delete user account and related data
        user.delete()
        
        # Clear authentication cookie
        response = Response(status=204)
        response.delete_cookie(AUTH_COOKIE_NAME, path="/")
        return response

    def post(self, request):
        """Handle account deletion via POST request."""
        return self._handle(request)

    def delete(self, request):
        """Handle account deletion via DELETE request."""
        return self._handle(request)


class ProfilePhotoView(APIView):
    """
    Handle user profile photo upload and management.
    
    Supports uploading new profile pictures from file selection or camera,
    with automatic image processing and validation. Also supports deleting
    existing profile photos.
    
    Permissions: IsAuthenticated (requires valid JWT)
    Methods: POST (upload), DELETE (remove)
    """
    
    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)  # Support multipart form data

    def post(self, request):
        """
        Upload and process new profile photo.
        
        Args:
            request: HTTP request with multipart form data containing image
            
        Returns:
            Response: 200 OK with updated user profile data
            
        Example Request:
            POST /api/auth/profile/photo
            Content-Type: multipart/form-data
            photo: [image file]
        """
        serializer = ProfilePhotoUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        photo = serializer.validated_data["photo"]
        
        # Process image (resize, optimize, etc.)
        processed = process_avatar(photo)

        # Get or create user profile
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        
        # Delete old avatar file if exists
        if profile.avatar:
            try: 
                profile.avatar.delete(save=False)
            except Exception:
                # Log error but continue with new upload
                pass

        # Save new avatar
        profile.avatar.save(processed.name, processed, save=True)

        # Return updated user data
        data = ProfileSerializer(request.user, context={"request": request}).data
        return Response({"user": data}, status=200)

    def delete(self, request):
        """
        Remove current profile photo.
        
        Args:
            request: HTTP request
            
        Returns:
            Response: 204 No Content
        """
        profile = getattr(request.user, "profile", None)
        if profile and profile.avatar:
            try: 
                profile.avatar.delete(save=False)
            except Exception:
                # Log error but continue with removal
                pass
            profile.avatar = None
            profile.save(update_fields=["avatar"])
        return Response(status=204)


class ProfileNameView(APIView):
    """
    Handle user profile name updates.
    
    Supports updating first and last names with support for both
    snake_case and camelCase field names in requests.
    
    Permissions: IsAuthenticated (requires valid JWT)
    Methods: PATCH, POST
    """
    
    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request):
        """Handle name update via PATCH request."""
        return self._update(request)

    def post(self, request):
        """Handle name update via POST request."""
        return self._update(request)

    def _update(self, request):
        """
        Common handler for name update requests.
        
        Args:
            request: HTTP request with name data
            
        Returns:
            Response: 200 OK with updated user profile data
            
        Example Request:
            PATCH /api/auth/profile/name
            {
                "firstName": "John",
                "lastName": "Smith"
            }
        """
        serializer = ProfileNameUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        
        # Update user name fields
        for field in ("first_name", "last_name"):
            if field in serializer.validated_data:
                setattr(request.user, field, serializer.validated_data[field])
                
        request.user.save()
        
        # Return updated user data
        data = ProfileSerializer(request.user, context={"request": request}).data
        return Response({"user": data}, status=200)


"""
Error Handling Strategy:

All views follow a consistent error response format:
{
    "error": {
        "code": 400,  # HTTP status code
        "message": "Descriptive error message"  # or validation errors object
    }
}

Common HTTP Status Codes:
- 200: Success
- 201: Resource created (registration)
- 204: No content (logout, delete)
- 400: Bad request (validation errors)
- 401: Unauthorized (authentication failed)
- 403: Forbidden (valid token but insufficient permissions)
- 404: Not found
- 409: Conflict (email already registered)

Security Considerations:
- Passwords are never logged or returned in responses
- JWT tokens have expiration to limit session duration
- HTTP-only cookies prevent XSS token theft
- SameSite=Strict provides CSRF protection
- Input validation occurs at multiple levels

Testing Recommendations:
- Test each endpoint with valid and invalid data
- Verify authentication requirements are enforced
- Test file upload with various image types and sizes
- Verify error responses are consistent and informative
- Test cookie behavior across different browsers
"""
