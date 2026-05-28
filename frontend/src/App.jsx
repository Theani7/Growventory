import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import RoleGuard from './components/RoleGuard';
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import DashboardLayout from './components/DashboardLayout';
import DashboardHome from './pages/DashboardHome';
import Plants from './pages/Plants';
import Categories from './pages/Categories';
import Stock from './pages/Stock';
import Health from './pages/Health';
import Reports from './pages/Reports';
import Notifications from './pages/Notifications';
import Users from './pages/Users';
import Tasks from './pages/Tasks';
import Settings from './pages/Settings';
import Logs from './pages/Logs';

// Auditors land on Reports; everyone else on the standard Overview
const DashboardIndex = () => {
  const { user } = useAuth();
  if (user?.role_name === 'auditor') {
    return <Navigate to="/dashboard/reports" replace />;
  }
  return <DashboardHome />;
};

// Roles allowed to view operational pages (everyone except auditor)
const OPERATIONAL = ['admin', 'supervisor', 'staff'];
// Roles allowed to view reports
const REPORTS_ROLES = ['admin', 'supervisor', 'auditor'];
// Roles allowed to view logs (read-only audit trail)
const LOGS_ROLES = ['admin', 'supervisor', 'auditor'];

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#fff',
              color: '#1a1f29',
              boxShadow: '0 1px 0 0 rgba(17, 24, 28, 0.04), 0 0 0 1px rgba(17, 24, 28, 0.04), 0 12px 32px -8px rgba(17, 24, 28, 0.12)',
              borderRadius: '14px',
              fontSize: '14px',
              fontWeight: 500,
              padding: '12px 16px',
            },
            success: {
              iconTheme: { primary: '#1d8147', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#ff6b6b', secondary: '#fff' },
            },
          }}
        />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected dashboard routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardIndex />} />

            {/* Operational pages — auditor blocked */}
            <Route path="plants" element={
              <RoleGuard allowedRoles={[...OPERATIONAL, /* auditor blocked */]}><Plants /></RoleGuard>
            } />
            <Route path="categories" element={
              <RoleGuard allowedRoles={OPERATIONAL}><Categories /></RoleGuard>
            } />
            <Route path="stock" element={
              <RoleGuard allowedRoles={OPERATIONAL}><Stock /></RoleGuard>
            } />
            <Route path="health" element={
              <RoleGuard allowedRoles={OPERATIONAL}><Health /></RoleGuard>
            } />
            <Route path="tasks" element={
              <RoleGuard allowedRoles={OPERATIONAL}><Tasks /></RoleGuard>
            } />
            <Route path="notifications" element={
              <RoleGuard allowedRoles={OPERATIONAL}><Notifications /></RoleGuard>
            } />

            {/* Reports & Logs — auditor allowed (read-only) */}
            <Route path="reports" element={
              <RoleGuard allowedRoles={REPORTS_ROLES}><Reports /></RoleGuard>
            } />
            <Route path="logs" element={
              <RoleGuard allowedRoles={LOGS_ROLES}><Logs /></RoleGuard>
            } />

            {/* Admin only */}
            <Route path="users" element={
              <RoleGuard allowedRoles={['admin']}><Users /></RoleGuard>
            } />
            <Route path="settings" element={
              <RoleGuard allowedRoles={['admin']}><Settings /></RoleGuard>
            } />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
