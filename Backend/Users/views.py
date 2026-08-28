from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.conf import settings
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.exceptions import TokenError
import requests as http_requests

from .models import SocialAuth
from .serializers import (
    RegisterSerializer,
    UserProfileSerializer,
    CustomTokenObtainPairSerializer,
    VerifyEmailSerializer,
)

User = get_user_model()

GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo'


def send_user_verification_email(user):
    """
    Generate a secure, time-limited HMAC verification token and send
    a verification email to the user.
    """
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000').rstrip('/')
    verify_url = f"{frontend_url}/auth/verify-email?uid={uid}&token={token}"

    subject = "Verify your VidMind AI account"
    message = (
        f"Hi {user.first_name or 'there'},\n\n"
        f"Welcome to VidMind AI! Please confirm your email address by clicking the link below:\n\n"
        f"{verify_url}\n\n"
        f"This link will expire soon. If you did not create an account, you can safely ignore this email.\n\n"
        f"— The VidMind AI Team"
    )
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'VidMind AI <noreply@vidmind.ai>')

    send_mail(
        subject=subject,
        message=message,
        from_email=from_email,
        recipient_list=[user.email],
        fail_silently=False,
    )


# ── POST /api/auth/register/ ───────────────────────────────
class RegisterView(generics.CreateAPIView):
    """Create a new user account and dispatch verification email."""
    queryset         = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Send verification email immediately
        try:
            send_user_verification_email(user)
        except Exception as e:
            # In development, console email won't fail; log warning if email sending fails
            print(f"[RegisterView] Could not send verification email: {e}")

        # Issue tokens (includes is_verified=False)
        refresh = CustomTokenObtainPairSerializer.get_token(user)
        return Response({
            'message': 'Account created successfully. Please check your email to verify your account.',
            'access':  str(refresh.access_token),
            'refresh': str(refresh),
            'user':    UserProfileSerializer(user).data,
        }, status=status.HTTP_201_CREATED)


# ── POST /api/auth/login/ ──────────────────────────────────
class LoginView(TokenObtainPairView):
    """Authenticate with email + password; returns JWT pair + user profile."""
    serializer_class   = CustomTokenObtainPairSerializer
    permission_classes = [permissions.AllowAny]


# ── POST /api/auth/logout/ ────────────────────────────────
class LogoutView(APIView):
    """Blacklist the refresh token, effectively logging out."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response(
                {'error': 'refresh token is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'message': 'Logged out successfully.'}, status=status.HTTP_200_OK)


# ── GET / PATCH /api/auth/me/ ──────────────────────────────
class MeView(generics.RetrieveUpdateAPIView):
    """Return or update the currently authenticated user's profile."""
    serializer_class   = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    # Disallow full PUT — only partial updates
    http_method_names = ['get', 'patch', 'head', 'options']


# ── POST /api/auth/send-verification/ ───────────────────────
class SendVerificationEmailView(APIView):
    """
    Re-send email verification link to authenticated user.
    Throttled to prevent spam.
    """
    permission_classes = [permissions.IsAuthenticated]
    throttle_scope     = 'email_verify'

    def post(self, request):
        user = request.user
        if user.is_verified:
            return Response(
                {'message': 'Your email is already verified.'},
                status=status.HTTP_200_OK,
            )

        try:
            send_user_verification_email(user)
            return Response(
                {'message': 'Verification email sent successfully.'},
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to send verification email: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


# ── POST /api/auth/verify-email/ ───────────────────────────
class VerifyEmailView(APIView):
    """
    Verify user email with uid and HMAC token.
    On success: marks user verified and returns fresh JWT tokens (auto-login).
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        uid_b64 = serializer.validated_data['uid']
        token   = serializer.validated_data['token']

        try:
            uid = force_str(urlsafe_base64_decode(uid_b64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response(
                {'error': 'Invalid or expired verification link.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not default_token_generator.check_token(user, token):
            return Response(
                {'error': 'Invalid or expired verification link.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not user.is_verified:
            user.is_verified = True
            user.save(update_fields=['is_verified'])

        # Issue fresh JWT tokens with is_verified=True embedded
        refresh = CustomTokenObtainPairSerializer.get_token(user)

        return Response({
            'message': 'Email verified successfully.',
            'user':    UserProfileSerializer(user).data,
            'access':  str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_200_OK)


# ── POST /api/auth/social/google/ ─────────────────────────
class GoogleSocialAuthView(APIView):
    """
    Accept a Google OAuth access_token from the frontend popup flow,
    verify it by calling Google's userinfo endpoint, then get-or-create
    a User and return a JWT pair identical in shape to the email-login response.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        access_token = request.data.get('access_token')
        if not access_token:
            return Response(
                {'error': 'access_token is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── 1. Verify token by calling Google's userinfo endpoint ──
        try:
            resp = http_requests.get(
                GOOGLE_USERINFO_URL,
                headers={'Authorization': f'Bearer {access_token}'},
                timeout=10,
            )
            resp.raise_for_status()
            payload = resp.json()
        except http_requests.RequestException as e:
            return Response(
                {'error': f'Could not verify Google token: {e}'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # ── 2. Extract user info ───────────────────────────────────
        google_uid = payload.get('sub')
        email      = payload.get('email', '')
        first_name = payload.get('given_name', '')
        last_name  = payload.get('family_name', '')
        avatar_url = payload.get('picture', '')

        if not google_uid or not email:
            return Response(
                {'error': 'Google account is missing required profile information.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── 3. Get or create the User ──────────────────────────────
        user, user_created = User.objects.get_or_create(
            email=email,
            defaults={
                'first_name':  first_name,
                'last_name':   last_name,
                'avatar_url':  avatar_url,
                'is_verified': True,   # Google accounts are pre-verified
            },
        )

        # Update avatar/name if changed
        if not user_created:
            changed = False
            if avatar_url and user.avatar_url != avatar_url:
                user.avatar_url = avatar_url
                changed = True
            if first_name and not user.first_name:
                user.first_name = first_name
                changed = True
            if last_name and not user.last_name:
                user.last_name = last_name
                changed = True
            if not user.is_verified:
                user.is_verified = True
                changed = True
            if changed:
                user.save(update_fields=['avatar_url', 'first_name', 'last_name', 'is_verified'])

        # ── 4. Get or create the SocialAuth record ─────────────────
        SocialAuth.objects.get_or_create(
            provider='google',
            provider_uid=google_uid,
            defaults={'user': user},
        )

        # ── 5. Issue JWT pair ──────────────────────────────────────
        refresh = CustomTokenObtainPairSerializer.get_token(user)
        return Response({
            'user':    UserProfileSerializer(user).data,
            'access':  str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_200_OK)
