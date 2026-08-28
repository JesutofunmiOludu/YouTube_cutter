"""
Users/tests.py — Auth endpoint and verification tests
"""
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.core import mail
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from Users.serializers import CustomTokenObtainPairSerializer

User = get_user_model()


class RegisterViewTest(APITestCase):
    url = '/api/auth/register/'

    def test_register_returns_201_and_tokens_and_sends_email(self):
        res = self.client.post(self.url, {
            'email':      'alice@example.com',
            'first_name': 'Alice',
            'last_name':  'Smith',
            'password':   'SecurePass123!',
            'password2':  'SecurePass123!',
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn('access',  res.data)
        self.assertIn('refresh', res.data)
        self.assertTrue(User.objects.filter(email='alice@example.com').exists())
        user = User.objects.get(email='alice@example.com')
        self.assertFalse(user.is_verified)
        # Check email was dispatched
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn('Verify your VidMind AI account', mail.outbox[0].subject)

    def test_register_duplicate_email_returns_400(self):
        User.objects.create_user(
            email='bob@example.com', password='pass'
        )
        res = self.client.post(self.url, {
            'email':     'bob@example.com',
            'password':  'SecurePass123!',
            'password2': 'SecurePass123!',
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_missing_password_returns_400(self):
        res = self.client.post(self.url, {'email': 'c@c.com'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


class LoginViewTest(APITestCase):
    url = '/api/auth/login/'

    def setUp(self):
        self.user = User.objects.create_user(
            email='dan@example.com', password='SecurePass123!'
        )

    def test_login_returns_tokens(self):
        res = self.client.post(self.url, {
            'email': 'dan@example.com', 'password': 'SecurePass123!'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('access', res.data)

    def test_login_wrong_password_returns_401(self):
        res = self.client.post(self.url, {
            'email': 'dan@example.com', 'password': 'wrong'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


class MeViewTest(APITestCase):
    url = '/api/auth/me/'

    def setUp(self):
        self.user = User.objects.create_user(
            email='eve@example.com', password='pass'
        )
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

    def test_me_returns_user_data(self):
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['email'], 'eve@example.com')

    def test_me_unauthenticated_returns_401(self):
        self.client.credentials()
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


class EmailVerificationTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='verify@example.com',
            password='SecurePass123!',
            first_name='Verify',
            last_name='User',
        )

    def test_send_verification_email(self):
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        res = self.client.post('/api/auth/send-verification/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn(self.user.email, mail.outbox[0].to)

    def test_verify_email_success(self):
        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        token = default_token_generator.make_token(self.user)

        res = self.client.post('/api/auth/verify-email/', {
            'uid': uid,
            'token': token,
        }, format='json')

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('access', res.data)
        self.user.refresh_from_db()
        self.assertTrue(self.user.is_verified)

    def test_verify_email_invalid_token(self):
        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        res = self.client.post('/api/auth/verify-email/', {
            'uid': uid,
            'token': 'invalid-token-123',
        }, format='json')

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.user.refresh_from_db()
        self.assertFalse(self.user.is_verified)

    def test_jwt_contains_is_verified_claim(self):
        token = CustomTokenObtainPairSerializer.get_token(self.user)
        self.assertIn('is_verified', token)
        self.assertFalse(token['is_verified'])

        self.user.is_verified = True
        self.user.save()
        verified_token = CustomTokenObtainPairSerializer.get_token(self.user)
        self.assertTrue(verified_token['is_verified'])
