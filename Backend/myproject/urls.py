from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),

    # ── API routes ──────────────────────────────────────
    path('api/auth/',     include('Users.urls')),
    path('api/videos/',   include('videos.urls')),
    path('api/chat/',     include('chat.urls')),
    path('api/research/', include('chat.research_urls')),
    path('api/search/',   include('chat.search_urls')),
    path('api/billing/',  include('billing.urls')),
]

if settings.DEBUG:
    urlpatterns += [
        path('__debug__/', include('debug_toolbar.urls')),
    ]
    # Serve generated cut clips during development
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
