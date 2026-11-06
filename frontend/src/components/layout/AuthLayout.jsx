import React from 'react';
import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div
      className="vh-100 w-100 d-flex flex-column flex-lg-row overflow-hidden no-scrollbar"
      style={{
        height: '100vh',
        maxHeight: '100vh',
        minHeight: '100vh',
        backgroundColor: '#F8F5F2',
        fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif"
      }}
    >
      {/* LEFT SECTION (approximately 55–57% width) - Pure Deep Maroon Branding & Illustration */}
      <div
        className="d-none d-lg-flex align-items-center justify-content-center position-relative overflow-hidden h-100"
        style={{
          flex: '0 0 57%',
          width: '57%',
          height: '100vh',
          backgroundColor: '#54100F'
        }}
      >
        <img
          src="/assets/shubham-auth-banner-v1.png"
          alt="Shubham Academy - Learn. Grow. Succeed."
          className="w-100 h-100"
          style={{
            objectFit: 'contain',
            objectPosition: 'center center',
            display: 'block'
          }}
        />
      </div>

      {/* RIGHT SECTION (approximately 43–45% width) - Light Cream/Off-White Background with Centered Card */}
      <div
        className="flex-grow-1 h-100 d-flex align-items-center justify-content-center p-3 p-md-4 position-relative overflow-y-auto no-scrollbar"
        style={{
          backgroundColor: '#F8F5F2',
          height: '100vh'
        }}
      >
        {/* Subtle Warm Decorative Waves in Top-Right Corner */}
        <svg
          className="position-absolute top-0 end-0 pointer-events-none"
          width="320"
          height="280"
          viewBox="0 0 320 280"
          fill="none"
          style={{ zIndex: 0, opacity: 0.6 }}
        >
          <path
            d="M320,0 L140,0 C180,90 240,160 320,200 Z"
            fill="rgba(242, 193, 107, 0.15)"
          />
          <path
            d="M320,0 L200,0 C230,110 270,180 320,240 Z"
            fill="rgba(128, 15, 25, 0.05)"
          />
        </svg>

        {/* White Floating Login Card */}
        <div
          className="bg-white position-relative shadow-lg w-100"
          style={{
            maxWidth: '520px',
            borderRadius: '20px',
            padding: '26px 30px',
            boxShadow: '0 15px 45px rgba(0, 0, 0, 0.07), 0 2px 8px rgba(0, 0, 0, 0.03)',
            border: '1px solid rgba(0, 0, 0, 0.05)',
            zIndex: 1
          }}
        >
          <Outlet />
        </div>
      </div>
    </div>
  );
}
