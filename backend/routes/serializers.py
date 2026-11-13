from rest_framework import serializers
from .models import Route, BusStop


class BusStopSerializer(serializers.ModelSerializer):
    class Meta:
        model = BusStop
        fields = ['id', 'route', 'stop_name', 'latitude', 'longitude', 'stop_order']


class RouteSerializer(serializers.ModelSerializer):
    stops = BusStopSerializer(many=True, read_only=True)
    bus_count = serializers.SerializerMethodField()

    class Meta:
        model = Route
        fields = ['id', 'route_name', 'starting_point', 'destination', 'description', 'is_active', 'stops', 'bus_count', 'created_at']

    def get_bus_count(self, obj):
        return obj.buses.count()
