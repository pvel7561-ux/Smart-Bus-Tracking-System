from rest_framework import serializers
from .models import Bus, Driver
from accounts.models import User
from routes.models import Route


class DriverUserNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']


class DriverSerializer(serializers.ModelSerializer):
    user_details = DriverUserNestedSerializer(source='user', read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role='driver'),
        source='user',
        write_only=True
    )
    assigned_bus_number = serializers.SerializerMethodField()

    class Meta:
        model = Driver
        fields = ['id', 'user_id', 'user_details', 'phone_number', 'license_number', 'is_available', 'assigned_bus_number', 'created_at']

    def get_assigned_bus_number(self, obj):
        if hasattr(obj, 'assigned_bus') and obj.assigned_bus:
            return obj.assigned_bus.bus_number
        return None


class BusSerializer(serializers.ModelSerializer):
    driver_details = serializers.SerializerMethodField()
    route_details = serializers.SerializerMethodField()
    latest_location = serializers.SerializerMethodField()
    active_trip = serializers.SerializerMethodField()

    class Meta:
        model = Bus
        fields = [
            'id',
            'bus_number',
            'registration_number',
            'capacity',
            'driver',
            'driver_details',
            'route',
            'route_details',
            'status',
            'latest_location',
            'active_trip',
            'created_at',
            'updated_at'
        ]

    def get_driver_details(self, obj):
        if obj.driver:
            return {
                'id': obj.driver.id,
                'name': obj.driver.user.get_full_name() or obj.driver.user.username,
                'username': obj.driver.user.username,
                'phone_number': obj.driver.phone_number,
                'license_number': obj.driver.license_number
            }
        return None

    def get_route_details(self, obj):
        if obj.route:
            return {
                'id': obj.route.id,
                'route_name': obj.route.route_name,
                'starting_point': obj.route.starting_point,
                'destination': obj.route.destination,
                'total_stops': obj.route.stops.count()
            }
        return None

    def get_latest_location(self, obj):
        latest = obj.locations.order_by('-timestamp').first()
        if latest:
            return {
                'id': latest.id,
                'latitude': latest.latitude,
                'longitude': latest.longitude,
                'speed': latest.speed,
                'heading': latest.heading,
                'accuracy': latest.accuracy,
                'timestamp': latest.timestamp
            }
        return None

    def get_active_trip(self, obj):
        trip = obj.trips.filter(status='ongoing').order_by('-start_time').first()
        if trip:
            return {
                'id': trip.id,
                'start_time': trip.start_time,
                'status': trip.status,
                'driver_name': trip.driver.user.get_full_name() or trip.driver.user.username,
                'route_name': trip.route.route_name if trip.route else None
            }
        return None
