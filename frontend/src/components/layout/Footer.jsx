import React from 'react';

export default function Footer() {
  return (
    <footer className="py-3 px-4 border-top bg-white mt-auto d-flex flex-column flex-sm-row align-items-center justify-content-between text-sa-muted small">
      <div className="d-flex align-items-center gap-2">
        <img
          src="/assets/shubham-logo.png"
          alt="Shubham Academy"
          style={{ height: '22px', width: 'auto' }}
        />
        <span>
          © 2026 <strong className="text-sa-primary">Shubham Academy</strong> Management System. All rights reserved.
        </span>
      </div>
      <div className="d-flex align-items-center gap-3 mt-2 mt-sm-0">
        <span className="badge bg-light text-dark border">Version 2.4.0</span>
        <span>Connected to FastAPI backend</span>
      </div>
    </footer>
  );
}
