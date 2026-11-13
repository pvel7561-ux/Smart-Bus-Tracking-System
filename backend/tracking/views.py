import requests
from django.utils import timezone
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Trip, BusLocation
from .serializers import (
    TripSerializer,
    BusLocationSerializer,
    LocationUpdateSerializer,
    LiveBusDetailSerializer
)
from buses.models import Bus, Driver
from routes.models import Route
from accounts.permissions import IsAdminUserRole


class TripStartView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        bus_id = request.data.get('bus_id')
        route_id = request.data.get('route_id')

        # Determine driver
        if user.role == 'driver':
            if not hasattr(user, 'driver_profile'):
                return Response(
                    {"error": "User does not have an associated driver profile."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            driver = user.driver_profile
            # Verify assigned bus
            if not bus_id:
                if hasattr(driver, 'assigned_bus') and driver.assigned_bus:
                    bus = driver.assigned_bus
                else:
                    return Response({"error": "No bus assigned to you. Please contact admin."}, status=status.HTTP_400_BAD_REQUEST)
            else:
                try:
                    bus = Bus.objects.get(id=bus_id)
                except Bus.DoesNotExist:
                    return Response({"error": "Bus not found."}, status=status.HTTP_404_NOT_FOUND)

                if bus.driver and bus.driver != driver:
                    return Response({"error": "You are not authorized to start trips for this bus."}, status=status.HTTP_403_FORBIDDEN)
        elif user.role == 'admin' or user.is_superuser:
            if not bus_id:
                return Response({"error": "bus_id is required for admin."}, status=status.HTTP_400_BAD_REQUEST)
            try:
                bus = Bus.objects.get(id=bus_id)
            except Bus.DoesNotExist:
                return Response({"error": "Bus not found."}, status=status.HTTP_404_NOT_FOUND)
            driver = bus.driver
            if not driver:
                return Response({"error": "Bus does not have an assigned driver. Assign driver first."}, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response({"error": "Passengers cannot start trips."}, status=status.HTTP_403_FORBIDDEN)

        # Determine route
        route = None
        if route_id:
            try:
                route = Route.objects.get(id=route_id)
            except Route.DoesNotExist:
                route = bus.route
        else:
            route = bus.route

        # Complete any existing ongoing trips for this bus
        Trip.objects.filter(bus=bus, status='ongoing').update(
            status='completed',
            end_time=timezone.now()
        )

        trip = Trip.objects.create(
            bus=bus,
            driver=driver,
            route=route,
            status='ongoing'
        )

        # Update bus status
        bus.status = 'active'
        if route and bus.route != route:
            bus.route = route
        bus.save()

        return Response({
            "message": "Trip started successfully.",
            "trip": TripSerializer(trip).data,
            "bus": {
                "id": bus.id,
                "bus_number": bus.bus_number,
                "registration_number": bus.registration_number,
                "status": bus.status,
                "route_id": route.id if route else None,
                "route_name": route.route_name if route else None
            }
        }, status=status.HTTP_201_CREATED)


class TripStopView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        trip_id = request.data.get('trip_id')
        bus_id = request.data.get('bus_id')

        trip = None
        if trip_id:
            try:
                trip = Trip.objects.get(id=trip_id, status='ongoing')
            except Trip.DoesNotExist:
                pass

        if not trip and bus_id:
            trip = Trip.objects.filter(bus_id=bus_id, status='ongoing').first()

        if not trip and user.role == 'driver' and hasattr(user, 'driver_profile'):
            trip = Trip.objects.filter(driver=user.driver_profile, status='ongoing').first()

        if not trip:
            return Response({"error": "No active ongoing trip found."}, status=status.HTTP_404_NOT_FOUND)

        # Check permission
        if user.role == 'driver' and trip.driver.user != user:
            return Response({"error": "You cannot stop another driver's trip."}, status=status.HTTP_403_FORBIDDEN)

        trip.status = 'completed'
        trip.end_time = timezone.now()
        trip.save()

        # Update bus status to inactive
        bus = trip.bus
        bus.status = 'inactive'
        bus.save()

        return Response({
            "message": "Trip stopped successfully.",
            "trip": TripSerializer(trip).data
        }, status=status.HTTP_200_OK)


class ActiveTripView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role == 'driver' and hasattr(user, 'driver_profile'):
            driver = user.driver_profile
            trip = Trip.objects.filter(driver=driver, status='ongoing').first()
            assigned_bus = getattr(driver, 'assigned_bus', None)
            return Response({
                "has_active_trip": trip is not None,
                "trip": TripSerializer(trip).data if trip else None,
                "assigned_bus": {
                    "id": assigned_bus.id,
                    "bus_number": assigned_bus.bus_number,
                    "registration_number": assigned_bus.registration_number,
                    "status": assigned_bus.status,
                    "route": {
                        "id": assigned_bus.route.id,
                        "name": assigned_bus.route.route_name,
                        "starting_point": assigned_bus.route.starting_point,
                        "destination": assigned_bus.route.destination,
                        "stops": [
                            {
                                "id": s.id,
                                "name": s.stop_name,
                                "latitude": s.latitude,
                                "longitude": s.longitude,
                                "order": s.stop_order
                            } for s in assigned_bus.route.stops.all()
                        ]
                    } if assigned_bus.route else None
                } if assigned_bus else None
            })
        elif user.role == 'admin' or user.is_superuser:
            ongoing_trips = Trip.objects.filter(status='ongoing')
            return Response({
                "count": ongoing_trips.count(),
                "trips": TripSerializer(ongoing_trips, many=True).data
            })
        else:
            return Response({"message": "Passenger active trips query not supported."}, status=status.HTTP_200_OK)


class LocationUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        serializer = LocationUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        bus_id = serializer.validated_data['bus_id']
        latitude = serializer.validated_data['latitude']
        longitude = serializer.validated_data['longitude']
        accuracy = serializer.validated_data.get('accuracy')
        speed = serializer.validated_data.get('speed', 0.0)
        heading = serializer.validated_data.get('heading', 0.0)
        trip_id = serializer.validated_data.get('trip_id')

        try:
            bus = Bus.objects.get(id=bus_id)
        except Bus.DoesNotExist:
            return Response({"error": "Bus not found."}, status=status.HTTP_404_NOT_FOUND)

        # Authorization: Drivers can only send location for their assigned bus
        if user.role == 'driver':
            if not hasattr(user, 'driver_profile'):
                return Response({"error": "Driver profile missing."}, status=status.HTTP_403_FORBIDDEN)
            if bus.driver != user.driver_profile:
                return Response({"error": "You are not assigned to update this bus."}, status=status.HTTP_403_FORBIDDEN)

        # Find active trip if not supplied
        trip = None
        if trip_id:
            trip = Trip.objects.filter(id=trip_id, bus=bus, status='ongoing').first()
        if not trip:
            trip = Trip.objects.filter(bus=bus, status='ongoing').first()

        # Record location
        loc = BusLocation.objects.create(
            bus=bus,
            trip=trip,
            latitude=latitude,
            longitude=longitude,
            accuracy=accuracy,
            speed=speed,
            heading=heading
        )

        # Ensure bus status is active
        if bus.status != 'active':
            bus.status = 'active'
            bus.save()

        return Response({
            "message": "Location updated successfully.",
            "location": BusLocationSerializer(loc).data
        }, status=status.HTTP_201_CREATED)


class LiveBusesListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        status_param = request.query_params.get('status', None)
        search_param = request.query_params.get('search', None)
        route_param = request.query_params.get('route', None)

        buses = Bus.objects.select_related('driver__user', 'route').prefetch_related('locations', 'route__stops').all()

        if status_param:
            buses = buses.filter(status=status_param)
        if route_param:
            buses = buses.filter(route_id=route_param)
        if search_param:
            buses = buses.filter(bus_number__icontains=search_param) | buses.filter(registration_number__icontains=search_param)

        data = []
        for bus in buses:
            latest_loc = bus.locations.order_by('-timestamp').first()
            active_trip = bus.trips.filter(status='ongoing').first()

            data.append({
                "id": bus.id,
                "bus_number": bus.bus_number,
                "registration_number": bus.registration_number,
                "capacity": bus.capacity,
                "status": bus.status,
                "driver": {
                    "id": bus.driver.id,
                    "name": bus.driver.user.get_full_name() or bus.driver.user.username,
                    "phone": bus.driver.phone_number
                } if bus.driver else None,
                "route": {
                    "id": bus.route.id,
                    "name": bus.route.route_name,
                    "starting_point": bus.route.starting_point,
                    "destination": bus.route.destination,
                    "stops": [
                        {
                            "id": s.id,
                            "stop_name": s.stop_name,
                            "latitude": s.latitude,
                            "longitude": s.longitude,
                            "stop_order": s.stop_order
                        } for s in bus.route.stops.all()
                    ]
                } if bus.route else None,
                "latest_location": {
                    "latitude": latest_loc.latitude,
                    "longitude": latest_loc.longitude,
                    "speed": latest_loc.speed,
                    "heading": latest_loc.heading,
                    "accuracy": latest_loc.accuracy,
                    "timestamp": latest_loc.timestamp
                } if latest_loc else None,
                "active_trip_id": active_trip.id if active_trip else None
            })

        return Response(data, status=status.HTTP_200_OK)


class LiveBusDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, bus_id):
        try:
            bus = Bus.objects.select_related('driver__user', 'route').prefetch_related('route__stops').get(id=bus_id)
        except Bus.DoesNotExist:
            return Response({"error": "Bus not found."}, status=status.HTTP_404_NOT_FOUND)

        latest_loc = bus.locations.order_by('-timestamp').first()
        recent_locations = bus.locations.order_by('-timestamp')[:25]
        active_trip = bus.trips.filter(status='ongoing').first()

        route_data = None
        if bus.route:
            stops = bus.route.stops.order_by('stop_order')
            route_data = {
                "id": bus.route.id,
                "route_name": bus.route.route_name,
                "starting_point": bus.route.starting_point,
                "destination": bus.route.destination,
                "description": bus.route.description,
                "stops": [
                    {
                        "id": s.id,
                        "stop_name": s.stop_name,
                        "latitude": s.latitude,
                        "longitude": s.longitude,
                        "stop_order": s.stop_order
                    } for s in stops
                ]
            }

        return Response({
            "id": bus.id,
            "bus_number": bus.bus_number,
            "registration_number": bus.registration_number,
            "capacity": bus.capacity,
            "status": bus.status,
            "driver": {
                "id": bus.driver.id,
                "name": bus.driver.user.get_full_name() or bus.driver.user.username,
                "phone": bus.driver.phone_number,
                "license_number": bus.driver.license_number
            } if bus.driver else None,
            "route": route_data,
            "active_trip": TripSerializer(active_trip).data if active_trip else None,
            "latest_location": BusLocationSerializer(latest_loc).data if latest_loc else None,
            "recent_breadcrumbs": BusLocationSerializer(recent_locations, many=True).data
        }, status=status.HTTP_200_OK)


class LocationHistoryView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, bus_id):
        limit = int(request.query_params.get('limit', 100))
        trip_id = request.query_params.get('trip_id', None)

        locations = BusLocation.objects.filter(bus_id=bus_id)
        if trip_id:
            locations = locations.filter(trip_id=trip_id)

        locations = locations.order_by('timestamp')[:limit]
        serializer = BusLocationSerializer(locations, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class OSRMRouteProxyView(APIView):
    """
    Proxies routing request to OSRM (Open Source Routing Machine) to get true road-following geometries.
    Format: /api/tracking/osrm-route/?coords=lon1,lat1;lon2,lat2;lon3,lat3
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        coords = request.query_params.get('coords')
        if not coords:
            return Response({"error": "coords parameter is required (lon,lat;lon,lat;...)"}, status=status.HTTP_400_BAD_REQUEST)

        url = f"https://router.project-osrm.org/route/v1/driving/{coords}?overview=full&geometries=geojson"
        try:
            resp = requests.get(url, timeout=5)
            if resp.status_code == 200:
                data = resp.json()
                if data.get('code') == 'Ok' and data.get('routes'):
                    route = data['routes'][0]
                    # geometry.coordinates is array of [lon, lat]
                    # Convert to [lat, lon] for Leaflet
                    points = [[pt[1], pt[0]] for pt in route['geometry']['coordinates']]
                    distance_km = round(route['distance'] / 1000, 2)
                    duration_min = round(route['duration'] / 60, 1)
                    return Response({
                        "status": "success",
                        "distance_km": distance_km,
                        "duration_min": duration_min,
                        "points": points
                    })
        except Exception:
            pass

        # Fallback to direct points if OSRM service is offline or unreachable
        try:
            point_pairs = [c.split(',') for c in coords.split(';')]
            fallback_points = [[float(pair[1]), float(pair[0])] for pair in point_pairs]
            return Response({
                "status": "fallback",
                "points": fallback_points,
                "message": "Direct points returned as fallback."
            })
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
