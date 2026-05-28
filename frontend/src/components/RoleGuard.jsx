import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Restricts a route to specific roles.
 * If user role is not in `allowedRoles`, redirects to `redirectTo` (default: /dashboard/reports for auditor, /dashboard otherwise).
 */
const RoleGuard = ({ allowedRoles, children, redirectTo }) => {
  const { user } = useAuth();
  const role = user?.role_name;

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(role)) {
    // Auditors land on /dashboard/reports; everyone else on /dashboard
    const fallback = redirectTo || (role === 'auditor' ? '/dashboard/reports' : '/dashboard');
    return <Navigate to={fallback} replace />;
  }

  return children;
};

export default RoleGuard;
