import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function Footer({ isStudent: propIsStudent }) {
  const location = useLocation();
  const { user } = useAuth();
  
  const isStudent = propIsStudent !== undefined
    ? propIsStudent
    : (user?.role === 'student' || location.pathname.startsWith('/student'));

  // 1. Non-student section (Admin & Super Admin): Keep original standard clean footer
  if (!isStudent) {
    return (
      <footer className="py-3 px-4 border-top bg-white mt-auto d-flex align-items-center text-sa-muted small">
        <div className="d-flex align-items-center gap-2">
          <img
            src="/assets/shubham-logo.png"
            alt="Shubham Academy"
            style={{ height: '22px', width: 'auto' }}
          />
          <span>
            &copy; 2026 <strong className="text-sa-primary">Shubham Academy</strong> Management System. All rights reserved.
          </span>
        </div>
      </footer>
    );
  }

  // 2. Student section ONLY: Show customized student footer with red top border & illustration
  return (
    <footer
      className="mt-auto bg-white position-relative overflow-hidden"
      style={{
        borderTop: '2.5px solid #8B1216',
        boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.04)',
        minHeight: '66px',
        zIndex: 10
      }}
    >
      <div className="d-flex align-items-center justify-content-between h-100 position-relative">
        {/* Left Brand & Copyright */}
        <div className="d-flex align-items-center gap-3 px-3 px-md-4 py-3">
          <img
            src="/assets/shubham-logo.png"
            alt="Shubham Academy"
            style={{ height: '42px', width: 'auto', objectFit: 'contain' }}
          />
          <div className="d-flex flex-column justify-content-center">
            <span
              style={{
                color: '#8B1216',
                fontSize: '1.1rem',
                fontWeight: 800,
                lineHeight: 1.2,
                letterSpacing: '-0.01em'
              }}
            >
              Shubham Academy
            </span>
            <span
              className="text-secondary"
              style={{
                fontSize: '0.78rem',
                fontWeight: 500,
                marginTop: '3px',
                lineHeight: 1.2
              }}
            >
              &copy; 2026 Shubham Academy | Management System | All rights reserved.
            </span>
          </div>
        </div>

        {/* Right Education Tree Illustration: Touches Top Red Line & Bottom Edge Full Height */}
        <div
          className="d-none d-lg-flex position-absolute top-0 bottom-0 end-0 align-items-stretch"
          style={{ height: '100%', pointerEvents: 'none' }}
        >
          <img
            src="/assets/footer-illustration.png"
            alt="Education Tree"
            style={{
              height: '100%',
              width: 'auto',
              objectFit: 'contain',
              objectPosition: 'right center',
              display: 'block'
            }}
          />
        </div>
      </div>
    </footer>
  );
}
