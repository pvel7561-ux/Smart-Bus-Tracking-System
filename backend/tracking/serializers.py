from rest_framework import serializers
from .models import Trip, BusLocation
from buses.models import Bus
from routes.models import Route
from buses.serializers import BusSerializer
from routes.serializers import RouteSerializer


class TripSerializer(serializers.ModelSerializer):
    bus_number = serializers.CharField(source='bus.bus_number', read_only=True)
    driver_name = serializers.SerializerMethodField()
    route_name = serializers.CharField(source='route.route_name', read_only=True, default='')

    class Meta:
        model = Trip
        fields = ['id', 'bus', 'bus_number', 'driver', 'driver_name', 'route', 'route_name', 'start_time', 'end_time', 'status', 'notes']

    def get_driver_name(self, obj):
        return obj.driver.user.get_full_name() or obj.driver.user.username


class BusLocationSerializer(serializers.ModelSerializer):
    bus_number = serializers.CharField(source='bus.bus_number', read_only=True)

    class Meta:
        model = BusLocation
        fields = ['id', 'bus', 'bus_number', 'trip', 'latitude', 'longitude', 'speed', 'heading', 'accuracy', 'timestamp']


class LocationUpdateSerializer(serializers.Serializer):
    bus_id = serializers.IntegerField()
    latitude = serializers.FloatField(min_value=-90.0, max_value=90.0)
    longitude = serializers.FloatField(min_value=-180.0, max_value=180.0)
    accuracy = serializers.FloatField(required=False, allow_null=True)
    speed = serializers.FloatField(required=False, allow_null=True, default=0.0)
    heading = serializers.FloatField(required=False, allow_null=True, default=0.0)
    trip_id = serializers.IntegerField(required=False, allow_null=True)


class LiveBusDetailSerializer(serializers.ModelSerializer):
    driver_name = serializers.SerializerMethodField()
    driver_phone = serializers.SerializerMethodField()
    route_details = RouteSerializer(source='route', read_only=True)
    latest_location = serializers.SerializerMethodField()
    active_trip = serializers.SerializerMethodField()

    class Meta:
        model = Bus
        fields = [
            'id',
            'bus_number',
            'registration_number',
            'capacity',
            'status',
            'driver_name',
            'driver_phone',
            'route',
            'route_details',
            'latest_location',
            'active_trip'
        ]

    def get_driver_name(self, obj):
        if obj.driver:
            return obj.driver.user.get_full_name() or obj.driver.user.username
        return 'Unassigned'

    def get_driver_phone(self, obj):
        if obj.driver:
            return obj.driver.phone_number
        return ''

    def get_latest_location(self, obj):
        loc = obj.locations.order_by('-timestamp').first()
        if loc:
            return BusLocationSerializer(loc).data
        return None

    def get_active_trip(self, obj):
        trip = obj.trips.filter(status='ongoing').order_by('-start_time').first()
        if trip:
            return TripSerializer(trip).data
        return None
