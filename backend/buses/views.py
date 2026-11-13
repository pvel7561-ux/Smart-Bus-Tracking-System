from rest_framework import generics, permissions
from .models import Bus, Driver
from .serializers import BusSerializer, DriverSerializer
from accounts.permissions import IsAdminOrReadOnly, IsAdminUserRole


class BusListCreateView(generics.ListCreateAPIView):
    queryset = Bus.objects.select_related('driver__user', 'route').all()
    serializer_class = BusSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        queryset = super().get_queryset()
        status_param = self.request.query_params.get('status', None)
        route_param = self.request.query_params.get('route', None)
        search_param = self.request.query_params.get('search', None)

        if status_param:
            queryset = queryset.filter(status=status_param)
        if route_param:
            queryset = queryset.filter(route_id=route_param)
        if search_param:
            queryset = queryset.filter(bus_number__icontains=search_param) | queryset.filter(registration_number__icontains=search_param)

        return queryset


class BusDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Bus.objects.select_related('driver__user', 'route').all()
    serializer_class = BusSerializer
    permission_classes = [IsAdminOrReadOnly]


class DriverListCreateView(generics.ListCreateAPIView):
    queryset = Driver.objects.select_related('user').all()
    serializer_class = DriverSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminUserRole()]
        return [permissions.IsAuthenticated()]


class DriverDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Driver.objects.select_related('user').all()
    serializer_class = DriverSerializer
    permission_classes = [IsAdminUserRole]
