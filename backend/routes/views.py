from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Route, BusStop
from .serializers import RouteSerializer, BusStopSerializer
from accounts.permissions import IsAdminOrReadOnly, IsAdminUserRole


class RouteListCreateView(generics.ListCreateAPIView):
    queryset = Route.objects.prefetch_related('stops').all()
    serializer_class = RouteSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        queryset = super().get_queryset()
        source = self.request.query_params.get('source', None)
        destination = self.request.query_params.get('destination', None)
        search = self.request.query_params.get('search', None)

        if source:
            queryset = queryset.filter(starting_point__icontains=source)
        if destination:
            queryset = queryset.filter(destination__icontains=destination)
        if search:
            queryset = queryset.filter(
                route_name__icontains=search
            ) | queryset.filter(
                starting_point__icontains=search
            ) | queryset.filter(
                destination__icontains=search
            )

        return queryset


class RouteDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Route.objects.prefetch_related('stops').all()
    serializer_class = RouteSerializer
    permission_classes = [IsAdminOrReadOnly]


class RouteStopsView(APIView):
    permission_classes = [IsAdminOrReadOnly]

    def get(self, request, route_id):
        stops = BusStop.objects.filter(route_id=route_id).order_by('stop_order')
        serializer = BusStopSerializer(stops, many=True)
        return Response(serializer.data)

    def post(self, request, route_id):
        data = request.data.copy()
        data['route'] = route_id
        serializer = BusStopSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BusStopDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = BusStop.objects.all()
    serializer_class = BusStopSerializer
    permission_classes = [IsAdminUserRole]
