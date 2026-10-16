import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Loader from '../components/common/Loader';

export default function RoleBasedRoute({ allowedRoles, children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loader fullPage message="Verifying role permissions..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const userRoleNormalized = (user?.role || '').toLowerCase().replace('_', '-');
  const allowedNormalized = allowedRoles.map(r => r.toLowerCase().replace('_', '-'));
  if (!allowedNormalized.includes(userRoleNormalized)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
