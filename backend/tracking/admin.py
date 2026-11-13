from django.contrib import admin
from .models import Trip, BusLocation


@admin.register(Trip)
class TripAdmin(admin.ModelAdmin):
    list_display = ('id', 'bus', 'driver', 'route', 'start_time', 'end_time', 'status')
    list_filter = ('status', 'start_time')
    search_fields = ('bus__bus_number', 'driver__user__username')


@admin.register(BusLocation)
class BusLocationAdmin(admin.ModelAdmin):
    list_display = ('id', 'bus', 'latitude', 'longitude', 'speed', 'accuracy', 'timestamp')
    list_filter = ('timestamp', 'bus')
    search_fields = ('bus__bus_number',)
