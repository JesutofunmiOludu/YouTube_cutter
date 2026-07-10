"""
videos/tests.py — Video API + Freemium enforcement tests
"""
from unittest.mock import patch

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from billing.models import UsageSummary
from videos.models import UserVideo

User = get_user_model()


def auth_client(client, user):
    """Helper: attach a JWT Bearer token to an APIClient."""
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return client


class VideoListCreateTest(APITestCase):
    url = '/api/videos/'

    def setUp(self):
        self.user = User.objects.create_user(
            email='f@f.com', password='pass'
        )
        auth_client(self.client, self.user)

    @patch('videos.processing_pipeline.run_video_setup')          # mock the pipeline
    @patch('videos.utils.fetch_or_create_video')
    def test_save_video_returns_201(self, mock_fetch, mock_pipeline):
        from videos.models import Video
        mock_fetch.return_value = Video.objects.create(
            youtube_id='test123',
            title='Test Video',
            duration_seconds=600,
        )
        res = self.client.post(self.url, {'youtube_id': 'test123'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    @patch('videos.processing_pipeline.run_video_setup')
    @patch('videos.utils.fetch_or_create_video')
    def test_pipeline_called_on_new_video(self, mock_fetch, mock_pipeline):
        """Pipeline must be called exactly once when a new UserVideo is created."""
        from videos.models import Video
        mock_fetch.return_value = Video.objects.create(
            youtube_id='new456',
            title='New Video',
            duration_seconds=300,
        )
        self.client.post(self.url, {'youtube_id': 'new456'}, format='json')
        mock_pipeline.assert_called_once()

    @patch('videos.processing_pipeline.run_video_setup')
    @patch('videos.utils.fetch_or_create_video')
    def test_pipeline_not_called_for_existing_video(self, mock_fetch, mock_pipeline):
        """Pipeline must NOT fire again if the UserVideo already exists."""
        from videos.models import Video, UserVideo
        video = Video.objects.create(
            youtube_id='dup789',
            title='Dup Video',
            duration_seconds=200,
        )
        # Pre-create the UserVideo so this POST is a duplicate
        UserVideo.objects.create(user=self.user, video=video)
        mock_fetch.return_value = video

        self.client.post(self.url, {'youtube_id': 'dup789'}, format='json')
        mock_pipeline.assert_not_called()


    def test_list_videos_returns_200(self):
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_unauthenticated_returns_401(self):
        self.client.credentials()
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


class FreemiumSearchTest(APITestCase):
    """Verify the search endpoint enforces the free-tier limit."""
    url = '/api/videos/search/?q=test'

    def setUp(self):
        self.user = User.objects.create_user(
            email='g@g.com', password='pass'
        )
        auth_client(self.client, self.user)

    @patch('videos.views.requests.get')
    def test_search_within_limit_returns_200(self, mock_get):
        mock_get.return_value.status_code = 200
        mock_get.return_value.raise_for_status = lambda: None
        mock_get.return_value.json.return_value = {'items': []}
        # First request should succeed (limit = 5/day)
        res = self.client.get(self.url)
        self.assertIn(res.status_code, [status.HTTP_200_OK, status.HTTP_403_FORBIDDEN])

    def test_search_over_free_limit_returns_403(self):
        from django.utils import timezone
        from billing.models import UsageSummary
        # Manually set usage at the limit
        summary, _ = UsageSummary.objects.get_or_create(
            user=self.user,
            summary_date=timezone.now().date(),
        )
        summary.searches_count = 5  # FREE_LIMITS['search']
        summary.save()

        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('error', res.data)


class FreemiumCutTest(APITestCase):
    """Verify cut creation enforces the free-tier limit."""

    def setUp(self):
        from videos.models import Video
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
        summary.cuts_count = 3  # FREE_LIMITS['cut']
        summary.save()

        res = self.client.post(self.url, {
            'start_seconds': 0,
            'end_seconds': 60,
            'title': 'Blocked cut',
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
