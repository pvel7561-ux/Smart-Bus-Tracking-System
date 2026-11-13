from django.contrib import admin
from .models import Route, BusStop


class BusStopInline(admin.TabularInline):
    model = BusStop
    extra = 1
    ordering = ('stop_order',)


@admin.register(Route)
class RouteAdmin(admin.ModelAdmin):
    list_display = ('id', 'route_name', 'starting_point', 'destination', 'is_active', 'total_stops')
    list_filter = ('is_active',)
    search_fields = ('route_name', 'starting_point', 'destination')
    inlines = [BusStopInline]

    def total_stops(self, obj):
        return obj.stops.count()


@admin.register(BusStop)
class BusStopAdmin(admin.ModelAdmin):
    list_display = ('id', 'route', 'stop_order', 'stop_name', 'latitude', 'longitude')
    list_filter = ('route',)
    search_fields = ('stop_name', 'route__route_name')
