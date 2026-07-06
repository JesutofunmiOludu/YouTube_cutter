"""
Users/tests.py — Auth endpoint tests
"""
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class RegisterViewTest(APITestCase):
    url = '/api/auth/register/'

    def test_register_returns_201_and_tokens(self):
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
