import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function BackButton({
  to,
  label = 'Back to Dashboard',
  className = '',
  fallback = '/super-admin/dashboard'
}) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (to) {
      navigate(to);
    } else if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate(fallback);
    }
  };

  return (
    <button
      type="button"
      className={`btn btn-link p-0 d-inline-flex align-items-center gap-1.5 small text-sa-muted text-decoration-none transition-all sa-back-btn mb-2 ${className}`}
      onClick={handleBack}
      style={{
        fontSize: '0.82rem',
        fontWeight: 500,
        color: '#64748b',
        width: 'fit-content'
      }}
    >
      <ArrowLeft size={16} className="sa-back-arrow flex-shrink-0" />
      <span>{label}</span>
    </button>
  );
}
