import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { ReactNode } from 'react';

interface RoleGuardProps {
  allowedRoles: string[];
  children: ReactNode;
  redirectTo?: string;
}

/**
 * Restricts a route to specific roles.
 * If user role is not in `allowedRoles`, redirects to `redirectTo` (default: /dashboard).
 */
const RoleGuard = ({ allowedRoles, children, redirectTo }: RoleGuardProps) => {
  const { user } = useAuth();
  const role = user?.role_name?.toLowerCase();

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(role ?? '')) {
    // Everyone lands on /dashboard
    const fallback = redirectTo || '/dashboard';
    return <Navigate to={fallback} replace />;
  }

  return children;
};

export default RoleGuard;
