import React, { useState } from 'react';
import { Menu, Bell, UserCircle, LogOut, CheckCircle, ChevronDown } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export default function Header({ onToggleSidebar }) {
  const { user, logout, switchRole } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSwitch = (role) => {
    switchRole(role);
    setShowUserMenu(false);
    if (role === 'super-admin') navigate('/super-admin/dashboard');
    else if (role === 'admin') navigate('/admin/dashboard');
    else if (role === 'teacher') navigate('/teacher/dashboard');
    else if (role === 'student') navigate('/student/dashboard');
  };

  return (
    <header
      className="position-sticky top-0 bg-white border-bottom px-4 d-flex align-items-center justify-content-between"
      style={{
        height: 'var(--sa-header-height)',
        zIndex: 1030,
        borderColor: 'var(--sa-border)'
      }}
    >
      {/* Left side: Hamburger & Title */}
      <div className="d-flex align-items-center gap-2 gap-sm-3">
        <button
          type="button"
          className="btn btn-light d-md-none p-2 rounded-2"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation"
        >
          <Menu size={20} />
        </button>

        <img
          src="/assets/shubham-logo.png"
          alt="Shubham Academy"
          className="d-md-none"
          style={{ maxHeight: '34px', width: 'auto' }}
        />

        <div className="d-none d-sm-flex flex-column">
          <h5 className="m-0 fw-bold text-sa-charcoal brand-font fs-6">
            Academy Management System
          </h5>
          <span className="small text-sa-muted" style={{ fontSize: '0.78rem' }}>
            Pune Main Campus • Academic Session 2026-27
          </span>
        </div>
      </div>

      {/* Right side: Role switcher, Notifications, Profile */}
      <div className="d-flex align-items-center gap-3">
        {/* Quick Demo Role Switcher Badge */}
        <div className="dropdown d-none d-sm-block">
          <button
            className="btn btn-sm btn-light border d-flex align-items-center gap-2 px-3 py-1 rounded-pill"
            type="button"
            data-bs-toggle="dropdown"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <span
              className="rounded-circle"
              style={{ width: '8px', height: '8px', backgroundColor: 'var(--sa-success-green)' }}
            />
            <span className="small fw-semibold text-sa-charcoal">
              Role: <span className="text-sa-primary text-capitalize">{user?.role?.replace('-', ' ')}</span>
            </span>
            <ChevronDown size={14} className="text-sa-muted" />
          </button>

          {showUserMenu && (
            <div
              className="position-absolute end-0 mt-2 bg-white border rounded-3 shadow-lg p-2"
              style={{ width: '220px', zIndex: 1050 }}
            >
              <div className="px-2 py-1 small fw-bold text-sa-muted text-uppercase tracking-wider">
                Switch Active Role
              </div>
              <button
                className={`dropdown-item btn btn-sm text-start py-2 px-3 rounded-2 ${
                  user?.role === 'super-admin' ? 'bg-sa-primary text-white' : ''
                }`}
                onClick={() => handleSwitch('superadmin')}
              >
                Super Admin
              </button>
              <button
                className={`dropdown-item btn btn-sm text-start py-2 px-3 rounded-2 ${
                  user?.role === 'admin' ? 'bg-sa-primary text-white' : ''
                }`}
                onClick={() => handleSwitch('admin')}
              >
                Academy Admin
              </button>
              <button
                className={`dropdown-item btn btn-sm text-start py-2 px-3 rounded-2 ${
                  user?.role === 'teacher' ? 'bg-sa-primary text-white' : ''
                }`}
                onClick={() => handleSwitch('teacher')}
              >
                Teacher (Faculty)
              </button>
              <button
                className={`dropdown-item btn btn-sm text-start py-2 px-3 rounded-2 ${
                  user?.role === 'student' ? 'bg-sa-primary text-white' : ''
                }`}
                onClick={() => handleSwitch('student')}
              >
                Student (Aarav)
              </button>
            </div>
          )}
        </div>

        {/* Notifications Icon */}
        <div className="position-relative">
          <button
            type="button"
            className="btn btn-light rounded-circle p-2 position-relative text-sa-charcoal"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
          >
            <Bell size={19} />
            <span
              className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
              style={{ fontSize: '0.65rem' }}
            >
              3
            </span>
          </button>

          {showNotifications && (
            <div
              className="position-absolute end-0 mt-2 bg-white border rounded-3 shadow-lg p-3"
              style={{ width: '310px', zIndex: 1050 }}
            >
              <div className="d-flex align-items-center justify-content-between pb-2 border-bottom mb-2">
                <span className="fw-bold small text-sa-charcoal">Notifications</span>
                <span className="badge bg-sa-primary small">3 New</span>
              </div>
              <div className="d-flex flex-column gap-2">
                <div className="p-2 bg-sa-off-white rounded-2">
                  <p className="small fw-semibold mb-0 text-sa-charcoal">RFID Attendance Logged</p>
                  <p className="text-xs text-sa-muted mb-0" style={{ fontSize: '0.75rem' }}>Gate 1 entry at 08:14 AM</p>
                </div>
                <div className="p-2 bg-sa-off-white rounded-2">
                  <p className="small fw-semibold mb-0 text-sa-charcoal">Fee Receipt Generated</p>
                  <p className="text-xs text-sa-muted mb-0" style={{ fontSize: '0.75rem' }}>Receipt #REC-99120 verified</p>
                </div>
                <div className="p-2 bg-sa-off-white rounded-2">
                  <p className="small fw-semibold mb-0 text-sa-charcoal">Exam Timetable Published</p>
                  <p className="text-xs text-sa-muted mb-0" style={{ fontSize: '0.75rem' }}>Mid-Term 2026 schedule live</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile avatar */}
        <div className="d-flex align-items-center gap-2 ps-2 border-start">
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
            alt="Avatar"
            className="rounded-circle object-fit-cover border"
            style={{ width: '36px', height: '36px' }}
          />
          <div className="d-none d-lg-flex flex-column">
            <span className="fw-bold text-sa-charcoal small lh-1">{user?.name || 'Academy Member'}</span>
            <span className="text-sa-muted" style={{ fontSize: '0.72rem' }}>{user?.title || user?.email}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
