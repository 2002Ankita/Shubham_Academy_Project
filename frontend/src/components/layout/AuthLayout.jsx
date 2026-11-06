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
        backgroundColor: '#959B9B',
        fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif"
      }}
    >
      {/* LEFT SECTION (approximately 55–57% width) - Full-Bleed Branding & Illustration */}
      <div
        className="d-none d-lg-block position-relative overflow-hidden h-100"
        style={{
          flex: '0 0 57%',
          width: '57%',
          height: '100vh',
          backgroundColor: '#570817'
        }}
      >
        <img
          src="/assets/shubham-auth-banner-v1.png"
          alt="Shubham Academy - Learn. Grow. Succeed."
          className="w-100 h-100"
          style={{
            objectFit: 'cover',
            objectPosition: 'left center',
            display: 'block'
          }}
        />
      </div>

      {/* RIGHT SECTION (approximately 43–45% width) - Centered Login Card */}
      <div
        className="flex-grow-1 h-100 d-flex align-items-center justify-content-center p-3 p-md-4 position-relative overflow-y-auto no-scrollbar"
        style={{
          backgroundColor: '#959B9B',
          height: '100vh'
        }}
      >
        {/* Top-Right Decorative Smooth Vector Curves (from Screenshot 1) */}
        <svg
          className="position-absolute top-0 end-0 pointer-events-none"
          width="320"
          height="280"
          viewBox="0 0 320 280"
          fill="none"
          style={{ zIndex: 0, opacity: 0.12 }}
        >
          <path
            d="M320,0 L140,0 C180,90 240,160 320,200 Z"
            fill="#FFFFFF"
          />
          <path
            d="M320,0 L200,0 C230,110 270,180 320,240 Z"
            fill="#FFFFFF"
          />
        </svg>

        {/* White Floating Login Card */}
        <div
          className="bg-white position-relative shadow-lg w-100"
          style={{
            maxWidth: '520px',
            borderRadius: '20px',
            padding: '26px 30px',
            boxShadow: '0 15px 45px rgba(0, 0, 0, 0.14), 0 2px 8px rgba(0, 0, 0, 0.05)',
            zIndex: 1
          }}
        >
          <Outlet />
        </div>
      </div>
    </div>
  );
}
