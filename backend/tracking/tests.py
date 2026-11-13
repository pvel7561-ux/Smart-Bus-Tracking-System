from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import User
from buses.models import Bus, Driver
from routes.models import Route, BusStop
from tracking.models import Trip, BusLocation


class SmartBusTrackingTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Admin User
        self.admin = User.objects.create_superuser(
            username='admin_test',
            email='admin@test.com',
            password='password123',
            role='admin'
        )

        # Driver 1
        self.driver_user = User.objects.create_user(
            username='driver_test',
            email='driver@test.com',
            password='password123',
            role='driver'
        )
        self.driver_profile = Driver.objects.create(
            user=self.driver_user,
            phone_number='+919876543210',
            license_number='DL-TEST-001'
        )

        # Driver 2
        self.driver_user2 = User.objects.create_user(
            username='driver_test2',
            email='driver2@test.com',
            password='password123',
            role='driver'
        )
        self.driver_profile2 = Driver.objects.create(
            user=self.driver_user2,
            phone_number='+919876543211',
            license_number='DL-TEST-002'
        )

        # Route
        self.route = Route.objects.create(
            route_name='Central - Airport Express',
            starting_point='Central Station',
            destination='Airport Terminal',
            description='Test route'
        )
        self.stop1 = BusStop.objects.create(
            route=self.route,
            stop_name='Central Station',
            latitude=13.0827,
            longitude=80.2707,
            stop_order=1
        )
        self.stop2 = BusStop.objects.create(
            route=self.route,
            stop_name='Airport Terminal',
            latitude=12.9815,
            longitude=80.1636,
            stop_order=2
        )

        # Bus
        self.bus = Bus.objects.create(
            bus_number='BUS-TEST-1',
            registration_number='TN-01-TEST-100',
            capacity=40,
            driver=self.driver_profile,
            route=self.route,
            status='inactive'
        )

    def test_user_login(self):
        resp = self.client.post('/api/login/', {
            'username': 'driver_test',
            'password': 'password123'
        })
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn('token', resp.data)
        self.assertEqual(resp.data['user']['role'], 'driver')
        self.assertEqual(resp.data['user']['assigned_bus']['bus_number'], 'BUS-TEST-1')

    def test_trip_start_and_gps_update_workflow(self):
        # 1. Login driver
        login_resp = self.client.post('/api/login/', {
            'username': 'driver_test',
            'password': 'password123'
        })
        token = login_resp.data['token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')

        # 2. Start Trip
        start_resp = self.client.post('/api/trips/start/', {
            'bus_id': self.bus.id
        })
        self.assertEqual(start_resp.status_code, status.HTTP_201_CREATED)
        self.bus.refresh_from_db()
        self.assertEqual(self.bus.status, 'active')

        trip_id = start_resp.data['trip']['id']

        # 3. Post GPS Telemetry
        gps_resp = self.client.post('/api/tracking/update/', {
            'bus_id': self.bus.id,
            'latitude': 13.0534,
            'longitude': 80.2528,
            'accuracy': 8.5,
            'speed': 34.0,
            'heading': 180.0,
            'trip_id': trip_id
        })
        self.assertEqual(gps_resp.status_code, status.HTTP_201_CREATED)

        # 4. Query live bus location
        live_resp = self.client.get(f'/api/tracking/bus/{self.bus.id}/')
        self.assertEqual(live_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(live_resp.data['status'], 'active')
        self.assertAlmostEqual(live_resp.data['latest_location']['latitude'], 13.0534, places=4)
        self.assertEqual(len(live_resp.data['route']['stops']), 2)

        # 5. Stop Trip
        stop_resp = self.client.post('/api/trips/stop/', {
            'trip_id': trip_id,
            'bus_id': self.bus.id
        })
        self.assertEqual(stop_resp.status_code, status.HTTP_200_OK)
        self.bus.refresh_from_db()
        self.assertEqual(self.bus.status, 'inactive')

    def test_unauthorized_driver_cannot_update_other_bus(self):
        # Login driver 2 who is NOT assigned to bus 1
        login_resp = self.client.post('/api/login/', {
            'username': 'driver_test2',
            'password': 'password123'
        })
        token = login_resp.data['token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')

        # Attempt to post GPS coordinates for bus 1
        gps_resp = self.client.post('/api/tracking/update/', {
            'bus_id': self.bus.id,
            'latitude': 13.0534,
            'longitude': 80.2528
        })
        self.assertEqual(gps_resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_passenger_can_query_buses_and_routes_without_auth(self):
        # Client without credentials
        self.client.credentials()
        resp = self.client.get('/api/tracking/buses/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertTrue(len(resp.data) >= 1)

        routes_resp = self.client.get('/api/routes/')
        self.assertEqual(routes_resp.status_code, status.HTTP_200_OK)
