import React from 'react';
import { Outlet } from 'react-router-dom';
import { ShieldCheck, Zap, Award } from 'lucide-react';

export default function AuthLayout() {
  return (
    <div className="min-vh-100 d-flex flex-column flex-lg-row bg-sa-off-white">
      {/* Left Branding Showcase Column */}
      <div
        className="d-flex flex-column justify-content-between p-4 p-md-5 text-white"
        style={{
          backgroundColor: 'var(--sa-primary-red)',
          flex: '1 1 45%',
          minHeight: '380px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Brand Logo */}
        <div className="z-1">
          <img
            src="/assets/shubham-logo.png"
            alt="Shubham Academy"
            style={{ maxHeight: '90px', width: 'auto', objectFit: 'contain' }}
          />
        </div>

        {/* Value Proposition Highlights */}
        <div className="my-5 z-1 d-none d-md-flex flex-column gap-4">
          <h2 className="brand-font fw-bold fs-3 lh-sm text-white">
            Transforming Academy Operations with Real-Time Precision
          </h2>
          <div className="d-flex flex-column gap-3">
            <div className="d-flex align-items-center gap-3">
              <div className="p-2 rounded-circle bg-white bg-opacity-15">
                <Zap size={20} className="text-warning" />
              </div>
              <span className="small text-white text-opacity-90">
                Instant RFID Gate Attendance & Real-time SMS Broadcasts
              </span>
            </div>
            <div className="d-flex align-items-center gap-3">
              <div className="p-2 rounded-circle bg-white bg-opacity-15">
                <ShieldCheck size={20} className="text-warning" />
              </div>
              <span className="small text-white text-opacity-90">
                Automated Fee Tracking, Pending Alerts & GST Receipts
              </span>
            </div>
            <div className="d-flex align-items-center gap-3">
              <div className="p-2 rounded-circle bg-white bg-opacity-15">
                <Award size={20} className="text-warning" />
              </div>
              <span className="small text-white text-opacity-90">
                Comprehensive Examination Timetables, Marks & Class Rank Cards
              </span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="z-1 small text-white text-opacity-75 pt-3 border-top border-white border-opacity-15">
          FastAPI & React Enterprise Architecture • Pune Main Campus
        </div>
      </div>

      {/* Right Form Column */}
      <div
        className="d-flex align-items-center justify-content-center p-3 p-sm-4 p-md-5"
        style={{ flex: '1 1 55%' }}
      >
        <div className="w-100" style={{ maxWidth: '480px' }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
