import React from 'react';
import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div
      className="vh-100 w-100 d-flex align-items-center justify-content-center p-2 p-sm-3 position-relative overflow-hidden no-scrollbar"
      style={{
        backgroundColor: '#FAF6F2',
        maxHeight: '100vh',
        height: '100vh'
      }}
    >
      {/* Top-Right Decorative Smooth Vector Waves & Dots Pattern */}
      <svg
        className="position-absolute top-0 end-0 pointer-events-none"
        width="380"
        height="300"
        viewBox="0 0 380 300"
        fill="none"
        style={{ zIndex: 1 }}
      >
        <path
          d="M380,0 L120,0 C170,90 270,140 380,180 Z"
          fill="rgba(217, 119, 24, 0.05)"
        />
        <path
          d="M380,0 L180,0 C220,100 290,160 380,220 Z"
          fill="rgba(139, 18, 22, 0.06)"
        />
        <defs>
          <pattern id="dotPatternTR" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.5" fill="rgba(139, 18, 22, 0.12)" />
          </pattern>
        </defs>
        <rect x="200" y="15" width="160" height="140" fill="url(#dotPatternTR)" opacity="0.7" />
      </svg>

      {/* Bottom-Right Decorative Soft & Faint Maroon Waves */}
      <svg
        className="position-absolute bottom-0 end-0 pointer-events-none"
        width="360"
        height="300"
        viewBox="0 0 360 300"
        fill="none"
        style={{ zIndex: 1 }}
      >
        <path
          d="M100,300 C130,190 220,100 360,80 L360,300 Z"
          fill="rgba(139, 18, 22, 0.08)"
        />
        <path
          d="M170,300 C200,220 270,150 360,140 L360,300 Z"
          fill="rgba(139, 18, 22, 0.12)"
        />
        <path
          d="M240,300 C265,245 310,195 360,190 L360,300 Z"
          fill="rgba(217, 119, 24, 0.07)"
        />
        <defs>
          <pattern id="dotPatternBR" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.5" fill="rgba(139, 18, 22, 0.12)" />
          </pattern>
        </defs>
        <rect x="180" y="160" width="160" height="120" fill="url(#dotPatternBR)" opacity="0.5" />
      </svg>

      {/* Bottom-Left Subtle Dots Pattern */}
      <svg
        className="position-absolute bottom-0 start-0 pointer-events-none"
        width="220"
        height="220"
        viewBox="0 0 220 220"
        fill="none"
        style={{ zIndex: 1 }}
      >
        <defs>
          <pattern id="dotPatternBL" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.5" fill="rgba(139, 18, 22, 0.09)" />
          </pattern>
        </defs>
        <rect x="15" y="60" width="140" height="140" fill="url(#dotPatternBL)" opacity="0.6" />
      </svg>

      {/* Master Unified Floating Card Container */}
      <div
        className="bg-white d-flex flex-column flex-lg-row overflow-hidden shadow-lg position-relative"
        style={{
          width: 'min(1100px, 95vw)',
          height: 'min(585px, 94vh)',
          borderRadius: '26px',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.12), 0 4px 16px rgba(0, 0, 0, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.9)',
          zIndex: 2
        }}
      >
        {/* Left Side: Brand New Shubham Academy Illustration (Edge-to-Edge with Cover to eliminate any gap/line) */}
        <div
          className="d-none d-lg-block position-relative overflow-hidden h-100"
          style={{
            flex: '0 0 min(555px, 50.5%)',
            width: 'min(555px, 50.5%)',
            height: '100%',
            backgroundColor: '#680D10'
          }}
        >
          <img
            src="/assets/shubham-auth-banner-new.png"
            alt="Shubham Academy - Your Dreams Our Mission"
            className="w-100 h-100"
            style={{
              objectFit: 'cover',
              objectPosition: 'left center',
              display: 'block'
            }}
          />
        </div>

        {/* Right Side: Form (Outlet) */}
        <div
          className="d-flex align-items-center justify-content-center p-3 p-sm-4 p-xl-4 bg-white h-100 overflow-y-auto no-scrollbar"
          style={{
            flex: '1 1 auto',
            width: '100%',
            height: '100%'
          }}
        >
          <div className="w-100" style={{ maxWidth: '425px' }}>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
