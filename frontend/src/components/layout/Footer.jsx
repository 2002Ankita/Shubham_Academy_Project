import React from 'react';

export default function Footer() {
  return (
    <footer
      className="w-100 mt-auto border-top px-3 px-sm-4 px-xl-5"
      style={{
        background: 'linear-gradient(180deg, #FFFFFF 0%, #FAF8F5 100%)',
        borderTop: '1px solid #E8E5DF',
        boxShadow: '0 -1px 6px rgba(15, 23, 42, 0.02)',
        paddingTop: '6px',
        paddingBottom: '6px',
        position: 'relative', // NOT position: fixed - flows naturally with page content
        zIndex: 10
      }}
    >
      <div 
        className="d-flex align-items-center justify-content-between gap-3 w-100"
        style={{ maxWidth: '1440px', margin: '0 auto', minHeight: '38px' }}
      >
        {/* Left: Academy Brand Logo & Copyright Info */}
        <div className="d-flex align-items-center gap-2.5 text-start">
          <img
            src="/assets/shubham-logo.png"
            alt="Shubham Academy"
            style={{ height: '26px', width: 'auto', objectFit: 'contain' }}
          />
          <div className="d-flex flex-column justify-content-center">
            <span
              className="fw-bold"
              style={{
                color: '#8B1216',
                fontSize: '0.94rem',
                lineHeight: 1.15,
                letterSpacing: '-0.01em'
              }}
            >
              Shubham Academy
            </span>
            <span
              style={{
                fontSize: '0.70rem',
                color: '#64748B',
                lineHeight: 1.25,
                marginTop: '1px'
              }}
            >
              © 2026 Shubham Academy | Management System | All rights reserved.
            </span>
          </div>
        </div>

        {/* Right: Architectural Campus Artwork Extended to Left */}
        <div className="d-flex align-items-center flex-shrink-0">
          <img
            src="/assets/footer-campus-art-wings.png"
            alt="Shubham Academy Campus Illustration"
            style={{
              height: '36px',
              width: 'auto',
              objectFit: 'contain',
              display: 'block',
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.05))'
            }}
          />
        </div>
      </div>
    </footer>
  );
}
