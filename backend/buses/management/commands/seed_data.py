from django.core.management.base import BaseCommand
from django.utils import timezone
from accounts.models import User
from buses.models import Bus, Driver
from routes.models import Route, BusStop
from tracking.models import Trip, BusLocation


class Command(BaseCommand):
    help = 'Seeds initial sample data: Admin, Drivers, Passengers, Buses, Routes, Bus Stops, and Active Trips.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('Starting database seeding...'))

        # 1. Admin User
        admin_user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@smartbus.local',
                'first_name': 'System',
                'last_name': 'Administrator',
                'role': 'admin',
                'is_staff': True,
                'is_superuser': True,
                'phone_number': '+91 99999 00000'
            }
        )
        admin_user.set_password('admin123')
        admin_user.role = 'admin'
        admin_user.is_staff = True
        admin_user.is_superuser = True
        admin_user.save()
        self.stdout.write(self.style.SUCCESS('Admin user ready: admin / admin123'))

        # 2. Driver Users & Driver Profiles
        driver_configs = [
            {
                'username': 'driver_rajesh',
                'email': 'rajesh@smartbus.local',
                'first_name': 'Rajesh',
                'last_name': 'Kumar',
                'phone': '+91 98765 43210',
                'license': 'DL-TN-2022-9842'
            },
            {
                'username': 'driver_suresh',
                'email': 'suresh@smartbus.local',
                'first_name': 'Suresh',
                'last_name': 'Raman',
                'phone': '+91 98410 12345',
                'license': 'DL-TN-2021-4567'
            },
            {
                'username': 'driver_anita',
                'email': 'anita@smartbus.local',
                'first_name': 'Anita',
                'last_name': 'Sharma',
                'phone': '+91 97910 88765',
                'license': 'DL-TN-2023-7890'
            }
        ]

        drivers = []
        for d in driver_configs:
            u, _ = User.objects.get_or_create(
                username=d['username'],
                defaults={
                    'email': d['email'],
                    'first_name': d['first_name'],
                    'last_name': d['last_name'],
                    'role': 'driver',
                    'phone_number': d['phone']
                }
            )
            u.set_password('driver123')
            u.role = 'driver'
            u.save()

            dp, _ = Driver.objects.get_or_create(
                user=u,
                defaults={
                    'phone_number': d['phone'],
                    'license_number': d['license'],
                    'is_available': True
                }
            )
            drivers.append(dp)
        self.stdout.write(self.style.SUCCESS('Driver users ready: driver_rajesh, driver_suresh, driver_anita / driver123'))

        # 3. Passenger Users
        passengers = [
            {'username': 'passenger_kavya', 'email': 'kavya@gmail.com', 'first_name': 'Kavya', 'last_name': 'Sundar'},
            {'username': 'passenger_john', 'email': 'john@gmail.com', 'first_name': 'John', 'last_name': 'David'}
        ]
        for p in passengers:
            pu, _ = User.objects.get_or_create(
                username=p['username'],
                defaults={
                    'email': p['email'],
                    'first_name': p['first_name'],
                    'last_name': p['last_name'],
                    'role': 'passenger',
                    'phone_number': '+91 94444 11223'
                }
            )
            pu.set_password('passenger123')
            pu.role = 'passenger'
            pu.save()
        self.stdout.write(self.style.SUCCESS('Passenger users ready: passenger_kavya, passenger_john / passenger123'))

        # 4. Routes and Bus Stops
        routes_data = [
            {
                'name': 'Route 101 - Central Station to Airport',
                'start': 'Central Station',
                'dest': 'Chennai Airport Terminal 2',
                'desc': 'Major city corridor connecting Central railway junction to airport via Anna Salai.',
                'stops': [
                    ('Chennai Central Railway Station', 13.0827, 80.2707, 1),
                    ('Government Estate Metro', 13.0694, 80.2742, 2),
                    ('LIC / Mount Road', 13.0617, 80.2647, 3),
                    ('Thousand Lights', 13.0534, 80.2528, 4),
                    ('Teynampet Signal', 13.0375, 80.2452, 5),
                    ('Saidapet Court', 13.0189, 80.2227, 6),
                    ('Guindy Metro Station', 13.0084, 80.2122, 7),
                    ('Chennai Airport Terminal 2', 12.9815, 80.1636, 8),
                ]
            },
            {
                'name': 'Route 202 - T. Nagar to Tambaram',
                'start': 'T. Nagar Bus Terminus',
                'dest': 'Tambaram Sanatorium',
                'desc': 'Suburban bus route through commercial and residential hubs.',
                'stops': [
                    ('T. Nagar Bus Terminus', 13.0405, 80.2337, 1),
                    ('Panagal Park', 13.0441, 80.2361, 2),
                    ('Nandanam Junction', 13.0298, 80.2398, 3),
                    ('Saidapet Chinnamalai', 13.0152, 80.2241, 4),
                    ('Guindy Asiad Colony', 13.0035, 80.2085, 5),
                    ('Alandur Metro', 12.9972, 80.2014, 6),
                    ('Chromepet Post Office', 12.9516, 80.1412, 7),
                    ('Tambaram Sanatorium', 12.9362, 80.1245, 8),
                ]
            },
            {
                'name': 'Route 303 - Adyar to OMR IT Corridor',
                'start': 'Adyar Depot',
                'dest': 'Siruseri IT Park',
                'desc': 'Tech express connecting southern residential sector with OMR IT parks.',
                'stops': [
                    ('Adyar Depot', 13.0064, 80.2575, 1),
                    ('Thiruvanmiyur Bus Stand', 12.9863, 80.2612, 2),
                    ('Kandanchavadi IT Zone', 12.9667, 80.2458, 3),
                    ('Thoraipakkam Toll Plaza', 12.9392, 80.2335, 4),
                    ('Sholinganallur Junction', 12.9010, 80.2279, 5),
                    ('Navalur Toll Plaza', 12.8524, 80.2263, 6),
                    ('Siruseri SIPCOT IT Park', 12.8285, 80.2201, 7),
                ]
            }
        ]

        created_routes = []
        for r_info in routes_data:
            route, _ = Route.objects.get_or_create(
                route_name=r_info['name'],
                defaults={
                    'starting_point': r_info['start'],
                    'destination': r_info['dest'],
                    'description': r_info['desc'],
                    'is_active': True
                }
            )
            created_routes.append(route)
            for stop_title, lat, lon, order in r_info['stops']:
                BusStop.objects.get_or_create(
                    route=route,
                    stop_order=order,
                    defaults={
                        'stop_name': stop_title,
                        'latitude': lat,
                        'longitude': lon
                    }
                )
        self.stdout.write(self.style.SUCCESS(f'Created {len(created_routes)} routes with bus stops.'))

        # 5. Buses
        bus_configs = [
            {
                'number': 'BUS-101',
                'reg': 'TN-01-AN-4501',
                'capacity': 50,
                'status': 'active',
                'driver': drivers[0],
                'route': created_routes[0],
                'init_lat': 13.0534,
                'init_lon': 80.2528
            },
            {
                'number': 'BUS-202',
                'reg': 'TN-09-BK-8822',
                'capacity': 45,
                'status': 'active',
                'driver': drivers[1],
                'route': created_routes[1],
                'init_lat': 13.0035,
                'init_lon': 80.2085
            },
            {
                'number': 'BUS-303',
                'reg': 'TN-22-CZ-1999',
                'capacity': 55,
                'status': 'inactive',
                'driver': drivers[2],
                'route': created_routes[2],
                'init_lat': 13.0064,
                'init_lon': 80.2575
            },
            {
                'number': 'BUS-404',
                'reg': 'TN-02-EE-3412',
                'capacity': 40,
                'status': 'maintenance',
                'driver': None,
                'route': None,
                'init_lat': None,
                'init_lon': None
            }
        ]

        for b_data in bus_configs:
            bus, _ = Bus.objects.get_or_create(
                bus_number=b_data['number'],
                defaults={
                    'registration_number': b_data['reg'],
                    'capacity': b_data['capacity'],
                    'status': b_data['status'],
                    'driver': b_data['driver'],
                    'route': b_data['route']
                }
            )
            bus.driver = b_data['driver']
            bus.route = b_data['route']
            bus.status = b_data['status']
            bus.save()

            # If bus is active, create an ongoing trip and sample location breadcrumbs
            if b_data['status'] == 'active' and b_data['driver'] and b_data['init_lat']:
                trip, _ = Trip.objects.get_or_create(
                    bus=bus,
                    driver=b_data['driver'],
                    status='ongoing',
                    defaults={
                        'route': b_data['route'],
                        'start_time': timezone.now()
                    }
                )

                # Add initial locations
                lat, lon = b_data['init_lat'], b_data['init_lon']
                for offset in [0.003, 0.002, 0.001, 0.0]:
                    BusLocation.objects.create(
                        bus=bus,
                        trip=trip,
                        latitude=lat - offset,
                        longitude=lon - (offset * 0.7),
                        speed=32.5,
                        heading=195.0,
                        accuracy=8.5
                    )

        self.stdout.write(self.style.SUCCESS('Created buses, active trips, and initial GPS breadcrumbs.'))
        self.stdout.write(self.style.SUCCESS('Database seeding completed successfully!'))
