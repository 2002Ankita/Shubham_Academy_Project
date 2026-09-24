import React, { useState } from 'react';
import { Menu, Bell, UserCircle, LogOut, CheckCircle, ChevronDown, Search } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Header({ onToggleSidebar }) {
  const { user, logout, switchRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  const isStudent = user?.role === 'student' || location.pathname.startsWith('/student');

  const studentSearchRoutes = [
    { title: 'My Classes & Timetable', path: '/student/classes', keywords: ['classes', 'timetable', 'schedule', 'lectures'] },
    { title: 'Attendance Records', path: '/student/attendance', keywords: ['attendance', 'rfid', 'presence'] },
    { title: 'Fee Details & Receipts', path: '/student/fees', keywords: ['fees', 'receipt', 'dues', 'payments'] },
    { title: 'Examination Timetable', path: '/student/exams', keywords: ['exams', 'examination', 'hall ticket'] },
    { title: 'Academic Results & Rank', path: '/student/results', keywords: ['results', 'marks', 'report card', 'rank'] },
    { title: 'Study Materials & Notes', path: '/student/study-materials', keywords: ['materials', 'notes', 'study', 'pdf'] },
    { title: 'Announcements & Notices', path: '/student/announcements', keywords: ['announcements', 'notices', 'bulletins'] },
    { title: 'Student Profile', path: '/student/profile', keywords: ['profile', 'account', 'settings'] },
  ];

  const filteredRoutes = searchQuery.trim()
    ? studentSearchRoutes.filter(r =>
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (filteredRoutes.length > 0) {
      navigate(filteredRoutes[0].path);
      setSearchQuery('');
      setShowSearchResults(false);
    }
  };

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
      className="position-sticky top-0 bg-white border-bottom px-3 px-md-4 d-flex align-items-center justify-content-between"
      style={{
        height: isStudent ? '58px' : 'var(--sa-header-height)',
        zIndex: 1030,
        borderColor: 'var(--sa-border)'
      }}
    >
      {/* Left side: Hamburger & Title */}
      <div className="d-flex align-items-center gap-2 gap-sm-3">
        <button
          type="button"
          className="btn btn-light d-md-none p-1.5 rounded-2"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation"
        >
          <Menu size={18} />
        </button>

        <img
          src="/assets/shubham-logo.png"
          alt="Shubham Academy"
          className="d-md-none"
          style={{ maxHeight: '30px', width: 'auto' }}
        />

        <h5 className="m-0 fw-bold text-sa-charcoal brand-font d-none d-sm-block" style={{ fontSize: '1.05rem' }}>
          {isStudent ? 'Student Dashboard' : 'Admin Dashboard'}
        </h5>
      </div>

      {/* Middle side: Search input matching reference image */}
      <div className="d-none d-md-block position-relative flex-grow-1 mx-3" style={{ maxWidth: '380px' }}>
        <form onSubmit={handleSearchSubmit}>
          <div className="position-relative">
            <Search
              size={15}
              className="position-absolute text-muted"
              style={{ left: '14px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              className="form-control form-control-sm rounded-pill"
              style={{
                height: '36px',
                paddingLeft: '38px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                fontSize: '0.84rem'
              }}
              placeholder={isStudent ? "Search classes, materials, announcements..." : "Search students, fees, etc..."}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
              onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
            />
          </div>
        </form>

          {/* Quick jump autocomplete dropdown */}
          {showSearchResults && filteredRoutes.length > 0 && (
            <div
              className="position-absolute start-0 end-0 mt-1 bg-white border rounded-3 shadow-lg overflow-hidden"
              style={{ zIndex: 1060 }}
            >
              <div className="px-3 py-1 bg-light border-bottom text-muted fw-semibold" style={{ fontSize: '0.72rem' }}>
                QUICK NAVIGATION JUMP
              </div>
              {filteredRoutes.map((route, i) => (
                <button
                  key={i}
                  type="button"
                  className="dropdown-item px-3 py-2 text-start small border-bottom border-light d-flex align-items-center justify-content-between"
                  onMouseDown={() => {
                    navigate(route.path);
                    setSearchQuery('');
                    setShowSearchResults(false);
                  }}
                >
                  <span className="fw-medium text-sa-charcoal">{route.title}</span>
                  <span className="badge bg-light text-muted small">{route.keywords[0]}</span>
                </button>
              ))}
            </div>
          )}
        </div>

      {/* Right side: Notifications, Profile */}
      <div className="d-flex align-items-center gap-2 gap-md-3">
        {/* Quick Demo Role Switcher Badge - for non-student roles */}
        {!isStudent && (
          <div className="dropdown d-none d-sm-block">
            <button
              className="btn btn-sm btn-light border d-flex align-items-center gap-1.5 px-2.5 py-1 rounded-pill"
              type="button"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <span
                className="rounded-circle"
                style={{ width: '7px', height: '7px', backgroundColor: 'var(--sa-success-green)' }}
              />
              <span className="fw-semibold text-sa-charcoal" style={{ fontSize: '0.75rem' }}>
                Role: <span className="text-sa-primary text-capitalize">{user?.role?.replace('-', ' ')}</span>
              </span>
              <ChevronDown size={12} className="text-sa-muted" />
            </button>
          </div>
        )}

        {/* Notifications Icon */}
        <div className="position-relative">
          <button
            type="button"
            className="btn btn-light rounded-circle p-1.5 position-relative text-sa-charcoal"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
          >
            <Bell size={18} />
            <span
              className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
              style={{ fontSize: '0.62rem', padding: '0.2em 0.45em' }}
            >
              4
            </span>
          </button>

          {showNotifications && (
            <div
              className="position-absolute end-0 mt-2 bg-white border rounded-3 shadow-lg p-3"
              style={{ width: '310px', zIndex: 1050 }}
            >
              <div className="d-flex align-items-center justify-content-between pb-2 border-bottom mb-2">
                <span className="fw-bold small text-sa-charcoal">Notifications</span>
                <span className="badge bg-sa-primary small">4 New</span>
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
                <div className="p-2 bg-sa-off-white rounded-2">
                  <p className="small fw-semibold mb-0 text-sa-charcoal">Notes Delivery Dispatched</p>
                  <p className="text-xs text-sa-muted mb-0" style={{ fontSize: '0.75rem' }}>Order #ND-8891 in transit</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile avatar & info */}
        <div className="position-relative">
          <div
            className="d-flex align-items-center gap-2 ps-2 border-start cursor-pointer"
            onClick={() => setShowUserMenu(!showUserMenu)}
            style={{ cursor: 'pointer' }}
          >
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt="Avatar"
              className="rounded-circle object-fit-cover border"
              style={{ width: '32px', height: '32px' }}
            />
            <div className="d-none d-sm-flex align-items-center gap-1.5">
              <span className="fw-bold text-sa-charcoal" style={{ fontSize: '0.84rem' }}>
                {user?.name || 'Aarav Kulkarni'}
              </span>
              <ChevronDown size={13} className="text-sa-muted" />
            </div>
          </div>

          {showUserMenu && (
            <div
              className="position-absolute end-0 mt-2 bg-white border rounded-3 shadow-lg p-2"
              style={{ width: '220px', zIndex: 1050 }}
            >
              <div className="px-3 py-1.5 border-bottom mb-1">
                <div className="fw-bold text-sa-charcoal small">{user?.name || 'Aarav Kulkarni'}</div>
                <div className="text-muted" style={{ fontSize: '0.72rem' }}>Class 10 (A) • Roll #12</div>
              </div>
              <button
                type="button"
                className="dropdown-item btn btn-sm text-start py-1.5 px-3 rounded-2"
                onClick={() => { setShowUserMenu(false); navigate('/student/profile'); }}
              >
                View Profile
              </button>
              <div className="dropdown-divider my-1"></div>
              <div className="px-2 py-1 small fw-bold text-sa-muted text-uppercase tracking-wider" style={{ fontSize: '0.68rem' }}>
                Switch Role (Demo)
              </div>
              <button
                type="button"
                className={`dropdown-item btn btn-sm text-start py-1.5 px-3 rounded-2 ${user?.role === 'super-admin' ? 'bg-sa-primary text-white' : ''}`}
                onClick={() => handleSwitch('superadmin')}
              >
                Super Admin
              </button>
              <button
                type="button"
                className={`dropdown-item btn btn-sm text-start py-1.5 px-3 rounded-2 ${user?.role === 'admin' ? 'bg-sa-primary text-white' : ''}`}
                onClick={() => handleSwitch('admin')}
              >
                Academy Admin
              </button>
              <button
                type="button"
                className={`dropdown-item btn btn-sm text-start py-1.5 px-3 rounded-2 ${user?.role === 'teacher' ? 'bg-sa-primary text-white' : ''}`}
                onClick={() => handleSwitch('teacher')}
              >
                Teacher (Faculty)
              </button>
              <button
                type="button"
                className={`dropdown-item btn btn-sm text-start py-1.5 px-3 rounded-2 ${user?.role === 'student' ? 'bg-sa-primary text-white' : ''}`}
                onClick={() => handleSwitch('student')}
              >
                Student (Aarav)
              </button>
              <div className="dropdown-divider my-1"></div>
              <button
                type="button"
                className="dropdown-item btn btn-sm text-start py-1.5 px-3 rounded-2 text-danger"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
