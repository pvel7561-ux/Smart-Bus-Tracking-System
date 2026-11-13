from django.urls import path
from .views import BusListCreateView, BusDetailView, DriverListCreateView, DriverDetailView

urlpatterns = [
    path('buses/', BusListCreateView.as_view(), name='bus_list_create'),
    path('buses/<int:pk>/', BusDetailView.as_view(), name='bus_detail'),
    path('drivers/', DriverListCreateView.as_view(), name='driver_list_create'),
    path('drivers/<int:pk>/', DriverDetailView.as_view(), name='driver_detail'),
]
