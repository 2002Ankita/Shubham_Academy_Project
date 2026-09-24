import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function Unauthorized() {
  const { user } = useAuth();

  const getRedirectPath = () => {
    if (!user) return '/login';
    if (user.role === 'super-admin') return '/super-admin/dashboard';
    if (user.role === 'admin') return '/admin/dashboard';
    if (user.role === 'teacher') return '/teacher/dashboard';
    return '/student/dashboard';
  };

  return (
    <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 bg-sa-off-white px-3 text-center">
      <div className="sa-card p-5 border-0 shadow-lg" style={{ maxWidth: '520px' }}>
        <div
          className="rounded-circle p-3 d-inline-flex align-items-center justify-content-center mb-3"
          style={{ backgroundColor: 'rgba(169, 31, 31, 0.1)', color: 'var(--sa-primary-red)' }}
        >
          <ShieldAlert size={48} />
        </div>

        <h3 className="brand-font fw-extrabold text-sa-charcoal mb-2">
          Access Restricted (403)
        </h3>

        <p className="text-sa-muted small mb-4">
          Your active account role (<strong>{user?.role || 'Guest'}</strong>) does not have authorization to view this module.
        </p>

        <div className="d-flex justify-content-center gap-2">
          <Link to={getRedirectPath()} className="btn btn-sa-primary d-inline-flex align-items-center gap-2">
            <ArrowLeft size={16} /> Return to Permitted Dashboard
          </Link>
          <Link to="/login" className="btn btn-outline-secondary">
            Switch Account
          </Link>
        </div>
      </div>
    </div>
  );
}
