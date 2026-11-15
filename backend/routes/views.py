import requests
from rest_framework import generics, status, permissions
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


class ReverseGeocodeView(APIView):
    """
    Reverse geocodes coordinates (lat, lon) to a real, human-readable bus stop/landmark name
    using OpenStreetMap Nominatim API with fallback.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        lat = request.query_params.get('lat')
        lon = request.query_params.get('lon')

        if not lat or not lon:
            return Response(
                {"error": "Both 'lat' and 'lon' query parameters are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        headers = {
            'User-Agent': 'SmartBusTrackingSystem/2.0 (contact: admin@smartbus.local)'
        }
        url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}&zoom=18&addressdetails=1"

        try:
            resp = requests.get(url, headers=headers, timeout=5)
            if resp.status_code == 200:
                data = resp.json()
                address = data.get('address', {})

                # Check for transit stop, landmark or road names
                candidates = [
                    address.get('bus_stop'),
                    address.get('public_transport'),
                    address.get('station'),
                    address.get('amenity'),
                    address.get('building'),
                    address.get('road'),
                    address.get('suburb'),
                    address.get('neighbourhood'),
                    data.get('name')
                ]
                clean_name = next((c for c in candidates if c), None)

                if not clean_name:
                    display_parts = data.get('display_name', '').split(',')
                    clean_name = display_parts[0].strip() if display_parts else f"Stop at {float(lat):.4f}, {float(lon):.4f}"

                return Response({
                    "status": "success",
                    "stop_name": clean_name,
                    "display_name": data.get('display_name', ''),
                    "road": address.get('road', ''),
                    "suburb": address.get('suburb', '') or address.get('neighbourhood', ''),
                    "city": address.get('city', '') or address.get('town', '') or address.get('county', ''),
                    "latitude": float(lat),
                    "longitude": float(lon)
                }, status=status.HTTP_200_OK)
        except Exception:
            pass

        # Clean fallback if Nominatim is unreachable
        return Response({
            "status": "fallback",
            "stop_name": f"Bus Stop ({float(lat):.4f}, {float(lon):.4f})",
            "display_name": f"Location at {float(lat):.4f}, {float(lon):.4f}",
            "latitude": float(lat),
            "longitude": float(lon)
        }, status=status.HTTP_200_OK)


class SearchPlacesView(APIView):
    """
    Searches for place names or landmarks to locate coordinates quickly.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        query = request.query_params.get('query', '').strip()
        if not query:
            return Response([], status=status.HTTP_200_OK)

        headers = {
            'User-Agent': 'SmartBusTrackingSystem/2.0 (contact: admin@smartbus.local)'
        }
        url = f"https://nominatim.openstreetmap.org/search?format=json&q={requests.utils.quote(query)}&limit=5&addressdetails=1"

        try:
            resp = requests.get(url, headers=headers, timeout=5)
            if resp.status_code == 200:
                results = []
                for item in resp.json():
                    display_parts = item.get('display_name', '').split(',')
                    short_name = display_parts[0].strip() if display_parts else item.get('name', query)
                    results.append({
                        "stop_name": short_name,
                        "display_name": item.get('display_name', ''),
                        "latitude": float(item['lat']),
                        "longitude": float(item['lon'])
                    })
                return Response(results, status=status.HTTP_200_OK)
        except Exception:
            pass

        return Response([], status=status.HTTP_200_OK)
