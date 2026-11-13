from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse, FileResponse
from django.conf import settings
from pathlib import Path

def serve_react_app(request):
    dist_index = settings.BASE_DIR.parent / 'frontend' / 'dist' / 'index.html'
    if dist_index.exists():
        return FileResponse(open(dist_index, 'rb'), content_type='text/html')
    return HttpResponse(
        "<h1>Smart Bus Tracking System API</h1><p>API is running at <a href='/api/tracking/buses/'>/api/tracking/buses/</a></p><p>Run Vite frontend at http://localhost:5173</p>",
        content_type='text/html'
    )

def serve_asset(request, asset_path):
    dist_asset = settings.BASE_DIR.parent / 'frontend' / 'dist' / 'assets' / asset_path
    if dist_asset.exists():
        content_type = 'application/javascript' if asset_path.endswith('.js') else 'text/css' if asset_path.endswith('.css') else 'application/octet-stream'
        return FileResponse(open(dist_asset, 'rb'), content_type=content_type)
    return HttpResponse(status=404)

def serve_root_image(request, filename):
    file_path = settings.BASE_DIR.parent / 'frontend' / 'dist' / filename
    if file_path.exists():
        return FileResponse(open(file_path, 'rb'), content_type='image/jpeg')
    return HttpResponse(status=404)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('accounts.urls')),
    path('api/', include('buses.urls')),
    path('api/', include('routes.urls')),
    path('api/', include('tracking.urls')),
    path('assets/<path:asset_path>', serve_asset),
    path('bg-bus.jpg', lambda req: serve_root_image(req, 'bg-bus.jpg')),
    path('logo-bus.jpg', lambda req: serve_root_image(req, 'logo-bus.jpg')),
    path('', serve_react_app),
]
