from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .authentication import CookieJWTAuthentication
from .jwt_utils import create_jwt_for_user
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    ProfileSerializer,
    ChangePasswordSerializer,
    DeleteAccountSerializer,
)

# Cookie settings (set secure=True in production over HTTPS)
AUTH_COOKIE_NAME = "auth_token"
AUTH_COOKIE_AGE = 7 * 24 * 60 * 60  # 7 days


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token = create_jwt_for_user(user)
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
            response.set_cookie(
                AUTH_COOKIE_NAME,
                token,
                httponly=True,
                samesite="Strict",
                secure=False,  # True in production
                max_age=AUTH_COOKIE_AGE,
                path="/",
            )
            return response

        if "email" in serializer.errors and any(
            "already registered" in str(m) for m in serializer.errors["email"]
        ):
            return Response(
                {"error": {"code": 409, "message": "Email already registered"}}, status=409
            )
        return Response({"error": {"code": 400, "message": serializer.errors}}, status=400)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        password = serializer.validated_data["password"]

        user = authenticate(request, username=email, password=password)
        if user is None:
            return Response(
                {"error": {"code": 401, "message": "Invalid email or password"}}, status=401
            )

        token = create_jwt_for_user(user)
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
        response.set_cookie(
            AUTH_COOKIE_NAME,
            token,
            httponly=True,
            samesite="Strict",
            secure=False,  # True in production
            max_age=AUTH_COOKIE_AGE,
            path="/",
        )
        return response


class LogoutView(APIView):
    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        response = Response(status=status.HTTP_204_NO_CONTENT)
        response.delete_cookie(AUTH_COOKIE_NAME, path="/")
        return response


class ProfileView(APIView):
    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({"user": ProfileSerializer(request.user).data}, status=200)


class ChangePasswordView(APIView):
    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    # @method_decorator(csrf_exempt)  # only if testing from Postman and CSRF blocks you
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"user": request.user})
        serializer.is_valid(raise_exception=True)

        user: User = request.user
        if not user.check_password(serializer.validated_data["currentPassword"]):
            return Response(
                {"error": {"code": 401, "message": "Current password is incorrect"}}, status=401
            )

        user.set_password(serializer.validated_data["newPassword"])
        user.save()

        # Issue a fresh JWT so the session stays valid
        token = create_jwt_for_user(user)
        resp = Response({"detail": "Password updated"}, status=200)
        resp.set_cookie(
            AUTH_COOKIE_NAME,
            token,
            httponly=True,
            samesite="Strict",
            secure=False,  # True in production
            max_age=AUTH_COOKIE_AGE,
            path="/",
        )
        return resp


class DeleteAccountView(APIView):
    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def _handle(self, request):
        serializer = DeleteAccountSerializer(data=request.data or {})
        serializer.is_valid(raise_exception=True)

        user: User = request.user
        if not user.check_password(serializer.validated_data["currentPassword"]):
            return Response({"error": {"code": 401, "message": "Current password is incorrect"}}, status=401)

        user.delete()
        resp = Response(status=204)
        resp.delete_cookie(AUTH_COOKIE_NAME, path="/")
        return resp

    def post(self, request):
        return self._handle(request)

    def delete(self, request):
        return self._handle(request)

from rest_framework.parsers import MultiPartParser, FormParser
from .serializers import ProfilePhotoUploadSerializer
from .utils.images import process_avatar
from .models import UserProfile

class ProfilePhotoView(APIView):
    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)  # accept form-data

    def post(self, request):
        # Accepts multipart from “Choose from Gallery” OR camera blob.
        ser = ProfilePhotoUploadSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        photo = ser.validated_data["photo"]
        processed = process_avatar(photo)

        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        # delete old file if any
        if profile.avatar:
            try: profile.avatar.delete(save=False)
            except Exception: pass

        profile.avatar.save(processed.name, processed, save=True)

        data = ProfileSerializer(request.user, context={"request": request}).data
        return Response({"user": data}, status=200)

    def delete(self, request):
        profile = getattr(request.user, "profile", None)
        if profile and profile.avatar:
            try: profile.avatar.delete(save=False)
            except Exception: pass
            profile.avatar = None
            profile.save(update_fields=["avatar"])
        return Response(status=204)
    

from .authentication import CookieJWTAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .serializers import ProfileNameUpdateSerializer, ProfileSerializer

class ProfileNameView(APIView):
    authentication_classes = [CookieJWTAuthentication]   # ← add this
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        return self._update(request)

    # Optional: keep POST behaving the same
    def post(self, request):
        return self._update(request)

    def _update(self, request):
        ser = ProfileNameUpdateSerializer(data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        for field in ("first_name", "last_name"):
            if field in ser.validated_data:
                setattr(request.user, field, ser.validated_data[field])
        request.user.save()
        data = ProfileSerializer(request.user, context={"request": request}).data
        return Response({"user": data}, status=200)
