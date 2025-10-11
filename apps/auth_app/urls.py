from django.urls import path
from .views import (
    RegisterView, LoginView, LogoutView, ProfileView,
    ChangePasswordView, DeleteAccountView,
    ProfilePhotoView, ProfileNameView
)

urlpatterns = [
    path("register", RegisterView.as_view(), name="register"),
    path("login",    LoginView.as_view(),    name="login"),
    path("logout",   LogoutView.as_view(),   name="logout"),
    path("profile",  ProfileView.as_view(),  name="profile"),

    
    path("profile/change-password", ChangePasswordView.as_view(), name="profile-change-password"),
    path("profile/delete-account",  DeleteAccountView.as_view(),  name="profile-delete-account"),

    path("profile/photo", ProfilePhotoView.as_view(), name="profile-photo"),
    path("profile/name",  ProfileNameView.as_view(),  name="profile-name"),
]
