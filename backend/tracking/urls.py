from django.urls import path
from .views import (
    TripStartView,
    TripStopView,
    ActiveTripView,
    LocationUpdateView,
    LiveBusesListView,
    LiveBusDetailView,
    LocationHistoryView,
    OSRMRouteProxyView
)

urlpatterns = [
    path('trips/start/', TripStartView.as_view(), name='trip_start'),
    path('trips/stop/', TripStopView.as_view(), name='trip_stop'),
    path('trips/active/', ActiveTripView.as_view(), name='trip_active'),
    path('tracking/update/', LocationUpdateView.as_view(), name='tracking_update'),
    path('tracking/buses/', LiveBusesListView.as_view(), name='tracking_buses_list'),
    path('tracking/bus/<int:bus_id>/', LiveBusDetailView.as_view(), name='tracking_bus_detail'),
    path('tracking/history/<int:bus_id>/', LocationHistoryView.as_view(), name='tracking_history'),
    path('tracking/osrm-route/', OSRMRouteProxyView.as_view(), name='tracking_osrm_route'),
]
