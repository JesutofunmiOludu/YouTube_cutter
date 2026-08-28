from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Language

User = get_user_model()


# ── Language ───────────────────────────────────────────────
class LanguageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Language
        fields = ('code', 'name', 'native_name')


# ── Registration ───────────────────────────────────────────
class RegisterSerializer(serializers.ModelSerializer):
    password  = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True, label='Confirm password')

    class Meta:
        model  = User
        fields = ('email', 'first_name', 'last_name', 'password', 'password2')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        return User.objects.create_user(**validated_data)


# ── User profile (read + update) ───────────────────────────
class UserProfileSerializer(serializers.ModelSerializer):
    language      = LanguageSerializer(read_only=True)
    language_code = serializers.SlugRelatedField(
        slug_field='code',
        queryset=Language.objects.all(),
        source='language',
        write_only=True,
        required=False,
        allow_null=True,
    )
    full_name         = serializers.CharField(read_only=True)
    subscription_tier = serializers.CharField(read_only=True)
    is_premium        = serializers.BooleanField(read_only=True)

    class Meta:
        model  = User
        fields = (
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'avatar_url', 'country_code', 'language', 'language_code',
            'subscription_tier', 'is_premium',
            'is_verified', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'email', 'subscription_tier', 'is_premium', 'is_verified', 'created_at', 'updated_at')


# ── Custom JWT claims ──────────────────────────────────────
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Adds user email, full_name, and is_verified status to the token payload."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['email']       = user.email
        token['full_name']   = user.full_name
        token['is_verified'] = user.is_verified
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        # Include basic profile alongside the tokens
        data['user'] = UserProfileSerializer(self.user).data
        return data


# ── Email verification serializer ───────────────────────────
class VerifyEmailSerializer(serializers.Serializer):
    uid   = serializers.CharField(required=True, error_messages={'required': 'UID is required.'})
    token = serializers.CharField(required=True, error_messages={'required': 'Verification token is required.'})
