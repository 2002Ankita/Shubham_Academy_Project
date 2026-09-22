import React from 'react';

export default function Loader({ fullPage = false, message = 'Loading Shubham Academy...' }) {
  if (fullPage) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center vh-100 bg-sa-off-white">
        <div className="position-relative mb-3">
          <div
            className="spinner-border"
            style={{
              width: '3.5rem',
              height: '3.5rem',
              color: 'var(--sa-primary-red)',
              borderWidth: '3.5px',
            }}
            role="status"
          >
            <span className="visually-hidden">Loading...</span>
          </div>
          <div
            className="position-absolute top-50 start-50 translate-middle"
            style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--sa-mustard-yellow)' }}
          />
        </div>
        <h6 className="fw-bold text-sa-charcoal tracking-wide mb-1 brand-font">{message}</h6>
        <p className="small text-sa-muted">Securing session and loading modules</p>
      </div>
    );
  }

  return (
    <div className="d-flex align-items-center justify-content-center py-4">
      <div
        className="spinner-border spinner-border-sm me-2"
        style={{ color: 'var(--sa-primary-red)' }}
        role="status"
      />
      <span className="small text-sa-muted">{message}</span>
    </div>
  );
}
