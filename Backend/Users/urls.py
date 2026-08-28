from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    RegisterView,
    LoginView,
    LogoutView,
    MeView,
    GoogleSocialAuthView,
    SendVerificationEmailView,
    VerifyEmailView,
)

urlpatterns = [
    path('register/',          RegisterView.as_view(),              name='auth-register'),
    path('login/',             LoginView.as_view(),                 name='auth-login'),
    path('refresh/',           TokenRefreshView.as_view(),           name='auth-refresh'),
    path('logout/',            LogoutView.as_view(),                name='auth-logout'),
    path('me/',                MeView.as_view(),                    name='auth-me'),
    path('social/google/',     GoogleSocialAuthView.as_view(),      name='auth-google'),
    path('send-verification/', SendVerificationEmailView.as_view(), name='auth-send-verification'),
    path('verify-email/',      VerifyEmailView.as_view(),           name='auth-verify-email'),
]
