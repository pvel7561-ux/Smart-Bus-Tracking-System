import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import PassengerDashboard from './pages/PassengerDashboard';
import DriverDashboard from './pages/DriverDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ManageBuses from './pages/ManageBuses';
import ManageDrivers from './pages/ManageDrivers';
import ManageRoutes from './pages/ManageRoutes';
import LiveTracking from './pages/LiveTracking';
import BusDetails from './pages/BusDetails';

import authService from './services/authService';

// Layout with optional sidebar for admin & driver
const AppLayout = ({ children, showSidebar = false }) => {
  return (
    <div className="app-container">
      <Navbar />
      <div className="main-content">
        {showSidebar && <Sidebar />}
        <main className="page-wrapper">
          {children}
        </main>
      </div>
    </div>
  );
};

// Index route router based on user role
const RootRedirect = () => {
  const user = authService.getUser();
  if (!user) return <Navigate to="/passenger" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'driver') return <Navigate to="/driver" replace />;
  return <Navigate to="/passenger" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Auth Routes */}
        <Route path="/login" element={<AppLayout><Login /></AppLayout>} />
        <Route path="/register" element={<AppLayout><Register /></AppLayout>} />

        {/* Home / Root */}
        <Route path="/" element={<RootRedirect />} />

        {/* Passenger Views */}
        <Route path="/passenger" element={<AppLayout><PassengerDashboard /></AppLayout>} />
        <Route path="/tracking/:id" element={<AppLayout><LiveTracking /></AppLayout>} />
        <Route path="/buses/:id" element={<AppLayout><BusDetails /></AppLayout>} />

        {/* Protected Driver Routes */}
        <Route element={<ProtectedRoute allowedRoles={['driver', 'admin']} />}>
          <Route path="/driver" element={<AppLayout showSidebar={true}><DriverDashboard /></AppLayout>} />
        </Route>

        {/* Protected Admin Routes */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin" element={<AppLayout showSidebar={true}><AdminDashboard /></AppLayout>} />
          <Route path="/admin/buses" element={<AppLayout showSidebar={true}><ManageBuses /></AppLayout>} />
          <Route path="/admin/drivers" element={<AppLayout showSidebar={true}><ManageDrivers /></AppLayout>} />
          <Route path="/admin/routes" element={<AppLayout showSidebar={true}><ManageRoutes /></AppLayout>} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
