from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
import os

def health_check(request):
    gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
    return JsonResponse({
        "status": "online",
        "service": "PrepNexus AI API Server",
        "gemini_configured": bool(gemini_key),
        "version": "1.0.0"
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', health_check, name='health_check'),
    path('api/auth/', include('accounts.urls')),
    path('api/analyzer/', include('analyzer.urls')),
]
