# Smart Bus Tracking System (Django & React)

A complete, full-stack, real-time Smart Bus Tracking System built with **Python Django REST Framework** for the backend and **React JS + Leaflet Maps** for the frontend.

Tracks live bus locations using the **driver's mobile phone GPS** (`navigator.geolocation.watchPosition()`), broadcasts coordinates to the Django backend every 5 seconds, and visualizes moving buses over a full interactive **OpenStreetMap** road map with **OSRM** (Open Source Routing Machine) road routing.

---

## 🚌 Features & User Roles

### 1. 🛡️ Fleet Administrator
* **Admin Dashboard:** Real-time telemetry summary, active vs parked buses, driver status, and system health counters.
* **Bus Management:** Add, edit, delete buses, set passenger capacity, assign drivers, and bind buses to routes.
* **Driver Management:** Register driver profiles, track commercial driver license numbers, and contact details.
* **Route & Bus Stop Management:** Create transit corridors with ordered bus stops, GPS coordinates (latitude/longitude), and visual road route preview.
* **Fleet Live Map:** Real-time map displaying all active buses moving simultaneously across the city.

### 2. 📱 Bus Driver
* **Mobile GPS Console:** Mobile-first responsive UI tailored for drivers mounted in vehicle dashboards.
* **Assigned Bus View:** Displays vehicle number, registration plate, and designated route.
* **Start Trip / Stop Trip:** One-touch toggle to activate transit trip and initialize GPS broadcasting.
* **Automatic 5-Second Telemetry:** Uses HTML5 Geolocation API (`watchPosition`) to capture latitude, longitude, heading, speed, and accuracy, sending pings to `/api/tracking/update/` every 5 seconds.
* **GPS Accuracy Meter & Pulse:** Visual feedback on satellite fix precision, update counter, and error guidance.
* **Indoor / Desktop Simulation Mode:** Built-in test simulator that moves the bus along route stops for desktop testing without physical driving.

### 3. 👥 Passenger
* **Live Transit Map:** Interactive OpenStreetMap road map rendered with React-Leaflet and custom SVG bus markers.
* **Bus Search:** Search buses by bus number or route corridor.
* **Route Finder:** Filter routes by starting origin and destination terminal.
* **Dedicated Live Tracking:** Full-screen live view following a selected bus with speed indicator, last GPS timestamp, driver contact, and upcoming stops.
* **True Road Routes:** Follows real street networks via OSRM routing rather than straight lines.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, React Router v6, Leaflet 1.9, React-Leaflet, Axios, Vite, Lucide Icons, Plus Jakarta Sans |
| **Backend** | Python 3, Django 6.0, Django REST Framework, Django CORS Headers |
| **Database** | SQLite (Default for development), PostgreSQL ready for production |
| **Maps & Routing** | OpenStreetMap Tiles, Leaflet.js, OSRM (Open Source Routing Machine) |
| **Telemetry** | W3C Geolocation API (`navigator.geolocation.watchPosition`), Token Authentication |

---

## 📂 Project Directory Structure

```text
smart-bus-tracking-system/
├── backend/
│   ├── config/              # Django settings, WSGI, root URLs & React SPA server
│   ├── accounts/            # Custom User model (Admin, Driver, Passenger), Auth endpoints
│   ├── buses/               # Bus and Driver models, management views, seed data command
│   ├── routes/              # Route and BusStop models, stop sequence ordering
│   ├── tracking/            # Trip and BusLocation models, 5s telemetry endpoints, OSRM proxy
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── assets/          # SVG logos, vehicle markers
│   │   ├── components/      # Navbar, Sidebar, BusCard, BusMap, GPSLocation, RouteMap, ProtectedRoute
│   │   ├── pages/           # Login, Register, AdminDashboard, ManageBuses, ManageDrivers,
│   │   │                    # ManageRoutes, DriverDashboard, PassengerDashboard, LiveTracking, BusDetails
│   │   ├── services/        # api.js (Axios), authService.js, busService.js, geolocation.js
│   │   ├── App.jsx          # Route tree and role guards
│   │   ├── main.jsx         # React DOM root
│   │   └── index.css        # Modern blue & white UI design system
│   ├── dist/                # Production-ready compiled assets
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
* **Python 3.10+**
* **Node.js 18+** and **npm**

---

### 1. Backend Setup (Django)

1. Open a terminal in the `backend/` directory:
   ```bash
   cd backend
   ```

2. Install dependencies (if not already installed globally):
   ```bash
   python -m pip install -r requirements.txt
   ```

3. Run database migrations:
   ```bash
   python manage.py migrate
   ```

4. **Seed initial sample data** (Buses, Drivers, Passengers, Routes, Stops, and Active Trips):
   ```bash
   python manage.py seed_data
   ```

5. Start the Django development server:
   ```bash
   python manage.py runserver 0.0.0.0:8000
   ```
   *The server runs at `http://127.0.0.1:8000` (and on your local Wi-Fi IP address).*

---

### 2. Frontend Setup (React + Vite)

1. Open a new terminal in the `frontend/` directory:
   ```bash
   cd frontend
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```
   *The React application opens at `http://localhost:5173`.*

---

## 🔑 Pre-Seeded Demo Accounts

The `seed_data` command creates ready-to-test accounts with pre-assigned buses:

| Role | Username | Password | Notes |
|---|---|---|---|
| **Admin** | `admin` | `admin123` | Full access to fleet, drivers, routes, and telemetry |
| **Driver** | `driver_rajesh` | `driver123` | Assigned to **BUS-101** (Central ➔ Airport) |
| **Driver** | `driver_suresh` | `driver123` | Assigned to **BUS-202** (T. Nagar ➔ Tambaram) |
| **Driver** | `driver_anita` | `driver123` | Assigned to **BUS-303** (Adyar ➔ Siruseri IT Park) |
| **Passenger** | `passenger_kavya` | `passenger123` | Passenger portal access |

*(Quick 1-click login buttons are also provided directly on the Login page for instant testing).*

---

## 📱 Real Mobile Phone GPS Testing Guide

Browser security policies require either `localhost` or `HTTPS` for GPS access (`navigator.geolocation`).

### Testing on Mobile Device via Local Wi-Fi:
1. Ensure both your computer and mobile phone are connected to the same Wi-Fi network.
2. Find your computer's local IP address (e.g., `192.168.1.5`):
   * Windows: Run `ipconfig`
   * macOS / Linux: Run `ifconfig` or `ip a`
3. On your mobile phone browser, open:
   `http://192.168.1.5:5173`
   *(Or access via Chrome remote debugging / ngrok for HTTPS)*.
4. Log in as `driver_rajesh` (`driver123`).
5. Click **START TRIP & BROADCAST GPS**.
6. When prompted by your mobile browser, tap **Allow** for Location permissions.
7. Open `http://localhost:5173/passenger` on your computer desktop: you will see the bus marker moving live on the road map!

---

## 📡 REST API Reference

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/register/` | Register passenger or driver (with license) | No |
| `POST` | `/api/login/` | User login (returns Token & assigned bus) | No |
| `POST` | `/api/logout/` | Invalidate token session | Yes |
| `GET` | `/api/auth/me/` | Current user profile | Yes |
| `GET` | `/api/buses/` | List all buses (filters: `status`, `route`, `search`) | Read: No, Write: Admin |
| `POST` | `/api/buses/` | Create a new bus | Admin |
| `GET` | `/api/buses/<id>/` | Bus details | Read: No |
| `PUT` | `/api/buses/<id>/` | Update bus specifications or assignments | Admin |
| `DELETE` | `/api/buses/<id>/` | Delete a bus | Admin |
| `GET` | `/api/drivers/` | List registered drivers | Yes |
| `GET` | `/api/routes/` | List all routes and bus stops | No |
| `POST` | `/api/routes/` | Create a route | Admin |
| `POST` | `/api/routes/<id>/stops/` | Add a stop with coordinates | Admin |
| `POST` | `/api/trips/start/` | Start a trip & activate bus | Driver / Admin |
| `POST` | `/api/trips/stop/` | Stop a trip & deactivate bus | Driver / Admin |
| `GET` | `/api/trips/active/` | Query current ongoing trip | Driver / Admin |
| `POST` | `/api/tracking/update/` | Driver sends 5-second GPS telemetry ping | Driver / Admin |
| `GET` | `/api/tracking/buses/` | Query live positions for all buses | No |
| `GET` | `/api/tracking/bus/<id>/` | Live position & stops for a specific bus | No |
| `GET` | `/api/tracking/history/<id>/` | Chronological GPS breadcrumbs | No |
| `GET` | `/api/tracking/osrm-route/` | True road routing geometries via OSRM | No |

---

## 🧪 Automated Testing

Run the backend test suite:
```bash
cd backend
python manage.py test tracking
```
All tests verify role-based permissions, GPS coordinate validation, driver bus ownership validation, and trip lifecycles.

---

## 🔒 Security Best Practices Implemented
1. **Password Hashing:** Django PBKDF2 with SHA256 password hashing.
2. **Role-Based Authorization:** Permissions enforce that drivers can only update their assigned bus and cannot manipulate other vehicles.
3. **Telemetry Validation:** Latitudes and longitudes are validated to ensure valid spherical coordinates (`-90 <= lat <= 90`, `-180 <= lon <= 180`).
4. **CORS Security:** Configured via `django-cors-headers` allowing granular control over authorized origins.
5. **Token Authentication:** Secure DRF token authentication stored in encrypted database tables.
