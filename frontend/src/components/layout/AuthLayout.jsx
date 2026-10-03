import React from 'react';
import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div
      className="min-vh-100 d-flex flex-column flex-lg-row bg-sa-off-white no-scrollbar"
      style={{ maxHeight: '100vh', overflow: 'hidden' }}
    >
      {/* Left Branding Showcase Column */}
      <div
        className="d-flex flex-column justify-content-center align-items-center p-3 p-xl-4 text-white position-relative no-scrollbar"
        style={{
          background: 'linear-gradient(135deg, #951217 0%, #6e0b0f 100%)',
          flex: '1 1 48%',
          height: '100vh',
          maxHeight: '100vh',
          overflow: 'hidden'
        }}
      >
        <div className="w-100 h-100 d-flex flex-column align-items-center justify-content-center overflow-hidden">
          <div
            className="position-relative overflow-hidden rounded-4 shadow-lg w-100 d-flex align-items-center justify-content-center"
            style={{
              maxWidth: '520px',
              backgroundColor: '#951217',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.45)'
            }}
          >
            <img
              src="/assets/auth-banner.png"
              alt="Shubham Academy - Inspire. Teach. Achieve."
              className="img-fluid w-100"
              style={{
                maxHeight: '80vh',
                objectFit: 'contain',
                display: 'block'
              }}
            />
          </div>
        </div>

        {/* Subtle footer credit */}
        <div
          className="z-1 small text-white text-opacity-75 pt-2 mt-2 border-top border-white border-opacity-15 w-100 text-center"
          style={{ maxWidth: '520px', fontSize: '0.78rem' }}
        >
          Shubham Academy • Pune Main Campus
        </div>
      </div>

      {/* Right Form Column */}
      <div
        className="d-flex align-items-center justify-content-center p-3 p-sm-4 p-md-5 h-100 overflow-y-auto no-scrollbar"
        style={{ flex: '1 1 52%', maxHeight: '100vh' }}
      >
        <div className="w-100 py-2 no-scrollbar" style={{ maxWidth: '460px' }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
