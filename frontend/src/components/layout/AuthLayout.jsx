import React from 'react';
import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div
      className="vh-100 w-100 d-flex flex-column flex-lg-row overflow-hidden no-scrollbar"
      style={{
        height: '100vh',
        maxHeight: '100vh',
        backgroundColor: '#959B9B'
      }}
    >
      {/* Left Side: Full-Bleed Shubham Academy Illustration & Branding Banner (Image 1) */}
      <div
        className="d-none d-lg-block position-relative overflow-hidden h-100"
        style={{
          flex: '0 0 57%',
          width: '57%',
          height: '100vh',
          backgroundColor: '#680D10'
        }}
      >
        <img
          src="/assets/shubham-auth-banner-v1.png"
          alt="Shubham Academy - Learn. Grow. Succeed."
          className="w-100 h-100"
          style={{
            objectFit: 'cover',
            objectPosition: 'center center',
            display: 'block'
          }}
        />
      </div>

      {/* Right Side: Neutral Grey Background with Floating White Card (Image 1) */}
      <div
        className="flex-grow-1 h-100 d-flex align-items-center justify-content-center p-3 p-sm-4 position-relative overflow-y-auto no-scrollbar"
        style={{
          backgroundColor: '#959B9B',
          height: '100vh'
        }}
      >
        {/* Top-Right Decorative Smooth Vector Curves */}
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

        {/* Floating White Card */}
        <div
          className="bg-white position-relative shadow-lg w-100"
          style={{
            maxWidth: '385px',
            borderRadius: '16px',
            padding: '24px 26px',
            boxShadow: '0 15px 45px rgba(0, 0, 0, 0.16), 0 2px 8px rgba(0, 0, 0, 0.06)',
            zIndex: 1
          }}
        >
          <Outlet />
        </div>
      </div>
    </div>
  );
}
