from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User
from buses.models import Driver


class UserSerializer(serializers.ModelSerializer):
    assigned_bus = serializers.SerializerMethodField()
    license_number = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'phone_number', 'assigned_bus', 'license_number']

    def get_assigned_bus(self, obj):
        if obj.role == 'driver' and hasattr(obj, 'driver_profile'):
            bus = getattr(obj.driver_profile, 'assigned_bus', None)
            if bus:
                return {
                    'id': bus.id,
                    'bus_number': bus.bus_number,
                    'registration_number': bus.registration_number,
                    'status': bus.status,
                    'route_id': bus.route_id,
                    'route_name': bus.route.route_name if bus.route else None
                }
        return None

    def get_license_number(self, obj):
        if obj.role == 'driver' and hasattr(obj, 'driver_profile'):
            return obj.driver_profile.license_number
        return None


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    license_number = serializers.CharField(write_only=True, required=False, allow_blank=True)
    phone_number = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'role', 'phone_number', 'license_number', 'first_name', 'last_name']

    def validate(self, attrs):
        role = attrs.get('role', 'passenger')
        if role == 'driver' and not attrs.get('license_number'):
            raise serializers.ValidationError({"license_number": "License number is required for drivers."})
        return attrs

    def create(self, validated_data):
        license_number = validated_data.pop('license_number', None)
        password = validated_data.pop('password')
        role = validated_data.get('role', 'passenger')

        user = User.objects.create_user(password=password, **validated_data)

        if role == 'driver':
            Driver.objects.create(
                user=user,
                phone_number=user.phone_number or '',
                license_number=license_number or f"DL-{user.id:04d}"
            )

        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        username = data.get('username')
        password = data.get('password')

        if not username or not password:
            raise serializers.ValidationError("Both username and password are required.")

        user = authenticate(username=username, password=password)
        if not user:
            raise serializers.ValidationError("Invalid credentials. Please check your username and password.")

        if not user.is_active:
            raise serializers.ValidationError("This user account has been disabled.")

        data['user'] = user
        return data
