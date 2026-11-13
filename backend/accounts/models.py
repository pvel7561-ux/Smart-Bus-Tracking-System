from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('driver', 'Driver'),
        ('passenger', 'Passenger'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='passenger')
    phone_number = models.CharField(max_length=20, blank=True, default='')

    def is_admin_user(self):
        return self.role == 'admin' or self.is_superuser

    def is_driver_user(self):
        return self.role == 'driver'

    def is_passenger_user(self):
        return self.role == 'passenger'

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
