from django.db import models


class Route(models.Model):
    route_name = models.CharField(max_length=150)
    starting_point = models.CharField(max_length=150)
    destination = models.CharField(max_length=150)
    description = models.TextField(blank=True, default='')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f"{self.route_name} ({self.starting_point} ➔ {self.destination})"


class BusStop(models.Model):
    route = models.ForeignKey(Route, on_delete=models.CASCADE, related_name='stops')
    stop_name = models.CharField(max_length=150)
    latitude = models.FloatField()
    longitude = models.FloatField()
    stop_order = models.PositiveIntegerField(default=1)

    class Meta:
        ordering = ['stop_order']
        unique_together = ('route', 'stop_order')

    def __str__(self):
        return f"{self.route.route_name} - Stop {self.stop_order}: {self.stop_name}"
