"""
videos/tests.py — Video API, Dual-Engine Transcription, Search Caching & Freemium tests
"""
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.cache import cache
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from billing.models import UsageSummary
from billing.services import FREE_LIMITS
from videos.models import UserVideo, Video

User = get_user_model()


def auth_client(client, user):
    """Helper: attach a JWT Bearer token to an APIClient."""
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return client


class VideoListCreateTest(APITestCase):
    url = '/api/videos/'

    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(
            email='f@f.com', password='pass', credits_balance=10
        )
        auth_client(self.client, self.user)

    @patch('videos.processing_pipeline.trigger_processing_if_needed')
    @patch('videos.utils.fetch_or_create_video')
    def test_save_video_standard_mode_returns_201(self, mock_fetch, mock_trigger):
        mock_fetch.return_value = Video.objects.create(
            youtube_id='test123',
            title='Test Video',
            duration_seconds=600,
        )
        res = self.client.post(self.url, {
            'youtube_id': 'test123',
            'transcription_mode': 'standard'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.user.refresh_from_db()
        self.assertEqual(self.user.credits_balance, 10)  # Standard mode = 0 credits deducted
        mock_trigger.assert_called_once()

    @patch('videos.processing_pipeline.trigger_processing_if_needed')
    @patch('videos.utils.fetch_or_create_video')
    def test_save_video_extended_mode_deducts_1_credit(self, mock_fetch, mock_trigger):
        """Extended mode should deduct 1 credit from the user's balance."""
        mock_fetch.return_value = Video.objects.create(
            youtube_id='ext789',
            title='Extended Video',
            duration_seconds=600,
        )
        res = self.client.post(self.url, {
            'youtube_id': 'ext789',
            'transcription_mode': 'extended'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.user.refresh_from_db()
        self.assertEqual(self.user.credits_balance, 9)  # 1 credit deducted
        mock_trigger.assert_called_once()

    @patch('videos.processing_pipeline.trigger_processing_if_needed')
    @patch('videos.utils.fetch_or_create_video')
    def test_pipeline_not_called_for_existing_video(self, mock_fetch, mock_trigger):
        """Pipeline must NOT fire again if the UserVideo already exists."""
        video = Video.objects.create(
            youtube_id='dup789',
            title='Dup Video',
            duration_seconds=200,
        )
        UserVideo.objects.create(user=self.user, video=video)
        mock_fetch.return_value = video

        self.client.post(self.url, {'youtube_id': 'dup789'}, format='json')
        mock_trigger.assert_not_called()

    def test_list_videos_returns_200(self):
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_unauthenticated_returns_401(self):
        self.client.credentials()
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


class FreemiumSearchTest(APITestCase):
    """Verify the search endpoint caching and free-tier limits."""
    url = '/api/videos/search/?q=test'

    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(
            email='g@g.com', password='pass'
        )
        auth_client(self.client, self.user)

    @patch('videos.views.requests.get')
    def test_search_caching(self, mock_get):
        mock_get.return_value.status_code = 200
        mock_get.return_value.raise_for_status = lambda: None
        mock_get.return_value.json.return_value = {'items': []}

        # First request -> cached: False
        res1 = self.client.get(self.url)
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        self.assertFalse(res1.data.get('cached'))

        # Second request with same query -> cached: True (served from cache)
        res2 = self.client.get(self.url)
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.assertTrue(res2.data.get('cached'))

    def test_search_over_free_limit_returns_403(self):
        from django.utils import timezone
        summary, _ = UsageSummary.objects.get_or_create(
            user=self.user,
            summary_date=timezone.now().date(),
        )
        summary.searches_count = 10  # FREE_LIMITS['search']
        summary.save()

        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('error', res.data)


class FreemiumCutTest(APITestCase):
    """Verify cut creation enforces the free-tier limit."""

    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(
            email='h@h.com', password='pass'
        )
        auth_client(self.client, self.user)
        video = Video.objects.create(
            youtube_id='abc999', title='Test', duration_seconds=300
        )
        self.user_video = UserVideo.objects.create(
            user=self.user, video=video
        )
        self.url = f'/api/videos/{self.user_video.id}/cuts/'

    def test_cut_over_free_limit_returns_403(self):
        from django.utils import timezone
        summary, _ = UsageSummary.objects.get_or_create(
            user=self.user,
            summary_date=timezone.now().date(),
        )
        summary.cuts_count = 5  # FREE_LIMITS['cut']
        summary.save()

        res = self.client.post(self.url, {
            'start_seconds': 0,
            'end_seconds': 60,
            'title': 'Blocked cut',
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
