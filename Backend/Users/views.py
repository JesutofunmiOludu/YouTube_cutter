from django.contrib.auth import get_user_model
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.exceptions import TokenError

from .serializers import (
    RegisterSerializer,
    UserProfileSerializer,
    CustomTokenObtainPairSerializer,
)

User = get_user_model()


# ── POST /api/auth/register/ ───────────────────────────────
class RegisterView(generics.CreateAPIView):
    """Create a new user account."""
    queryset         = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Issue tokens immediately on registration
        refresh = RefreshToken.for_user(user)
        return Response({
            'message': 'Account created successfully.',
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
