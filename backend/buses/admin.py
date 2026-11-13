from django.contrib import admin
from .models import Bus, Driver


@admin.register(Driver)
class DriverAdmin(admin.ModelAdmin):
    list_display = ('id', 'get_name', 'phone_number', 'license_number', 'is_available')
    search_fields = ('user__username', 'user__first_name', 'user__last_name', 'license_number', 'phone_number')

    def get_name(self, obj):
        return obj.user.get_full_name() or obj.user.username
    get_name.short_description = 'Driver Name'


@admin.register(Bus)
class BusAdmin(admin.ModelAdmin):
    list_display = ('bus_number', 'registration_number', 'capacity', 'driver', 'route', 'status')
    list_filter = ('status', 'route')
    search_fields = ('bus_number', 'registration_number')
