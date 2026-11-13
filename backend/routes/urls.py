from django.urls import path
from .views import RouteListCreateView, RouteDetailView, RouteStopsView, BusStopDetailView

urlpatterns = [
    path('routes/', RouteListCreateView.as_view(), name='route_list_create'),
    path('routes/<int:pk>/', RouteDetailView.as_view(), name='route_detail'),
    path('routes/<int:route_id>/stops/', RouteStopsView.as_view(), name='route_stops'),
    path('stops/<int:pk>/', BusStopDetailView.as_view(), name='stop_detail'),
]
