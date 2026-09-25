import React, { useState } from 'react';
import { Menu, Bell, UserCircle, LogOut, CheckCircle, ChevronDown, Search, Calendar } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Header({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState('Mon, 26 May 2025');
  const [isDateHovered, setIsDateHovered] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  const isStudent = user?.role === 'student' || location.pathname.startsWith('/student');
  const isTeacher = user?.role === 'teacher' || location.pathname.startsWith('/teacher');
  const isSuperAdmin = user?.role === 'super-admin' || location.pathname.startsWith('/super-admin');

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

  const teacherSearchRoutes = [
    { title: 'Today\'s Classes & Schedule', path: '/teacher/classes', keywords: ['classes', 'schedule', 'timetable', 'lectures'] },
    { title: 'Student Directory', path: '/teacher/students', keywords: ['students', 'directory', 'roll'] },
    { title: 'Class Attendance', path: '/teacher/attendance', keywords: ['attendance', 'present', 'absent'] },
    { title: 'Examinations', path: '/teacher/exams', keywords: ['exams', 'examination', 'tests'] },
    { title: 'Enter Marks', path: '/teacher/marks', keywords: ['marks', 'grades', 'scores', 'entry'] },
    { title: 'Study Materials', path: '/teacher/study-materials', keywords: ['materials', 'notes', 'study', 'pdf'] },
    { title: 'Announcements', path: '/teacher/announcements', keywords: ['announcements', 'notices', 'bulletins'] },
    { title: 'Teacher Profile', path: '/teacher/profile', keywords: ['profile', 'account', 'settings'] },
  ];

  const activeSearchRoutes = isTeacher ? teacherSearchRoutes : studentSearchRoutes;

  const filteredRoutes = searchQuery.trim()
    ? activeSearchRoutes.filter(r =>
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

  return (
    <header
      className={`position-sticky top-0 bg-white border-bottom ${isTeacher ? 'px-3 px-md-3.5' : 'px-3 px-md-4'} d-flex align-items-center justify-content-between`}
      style={{
        height: isStudent ? '58px' : isTeacher ? '56px' : 'var(--sa-header-height)',
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

        <h5 className="m-0 fw-bold text-sa-charcoal brand-font d-none d-sm-block" style={{ fontSize: isTeacher ? '0.94rem' : '1.05rem' }}>
          {isTeacher ? 'Teacher Dashboard' : isStudent ? 'Student Dashboard' : isSuperAdmin ? 'Super Admin Dashboard' : 'Admin Dashboard'}
        </h5>
      </div>

      {/* Middle side: Search input matching reference image */}
      <div className="d-none d-md-block position-relative flex-grow-1 mx-3" style={{ maxWidth: isTeacher ? '340px' : '380px' }}>
        <form onSubmit={handleSearchSubmit}>
          <div className="position-relative">
            <Search
              size={14}
              className="position-absolute text-muted"
              style={{ left: '12px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              className="form-control form-control-sm rounded-pill"
              style={{
                height: isTeacher ? '32px' : '36px',
                paddingLeft: '34px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                fontSize: '0.80rem'
              }}
              placeholder={
                isTeacher
                  ? "Search students, classes, materials..."
                  : isStudent
                  ? "Search classes, materials, announcements..."
                  : "Search students, fees, etc..."
              }
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

      {/* Right side: Date Selector, Notifications, Profile */}
      <div className="d-flex align-items-center" style={{ gap: '14px', paddingRight: '4px' }}>
        {/* Date Selector for Teacher Header */}
        {isTeacher && (
          <div className="position-relative">
            <div
              onClick={() => setShowDatePicker(!showDatePicker)}
              onMouseEnter={() => setIsDateHovered(true)}
              onMouseLeave={() => setIsDateHovered(false)}
              className="d-flex align-items-center justify-content-between transition-all"
              style={{
                width: '195px',
                height: '42px',
                padding: '0 13px',
                backgroundColor: isDateHovered ? '#FFF8F8' : '#FFFFFF',
                border: isDateHovered ? '1px solid var(--sa-primary-red)' : '1px solid #E3E7ED',
                borderRadius: '8px',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
                cursor: 'pointer',
                userSelect: 'none'
              }}
              title="Select Date"
            >
              <div className="d-flex align-items-center" style={{ gap: '8px' }}>
                <Calendar size={17} style={{ color: 'var(--sa-primary-red)', flexShrink: 0 }} />
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#1E293B',
                    lineHeight: 1,
                    whiteSpace: 'nowrap'
                  }}
                >
                  <span className="d-none d-sm-inline">{selectedDate.includes('Mon, ') ? 'Mon, ' : ''}</span>
                  {selectedDate.replace('Mon, ', '')}
                </span>
              </div>
              <ChevronDown
                size={14}
                style={{
                  color: '#64748B',
                  flexShrink: 0,
                  marginLeft: '8px',
                  transition: 'transform 0.2s ease',
                  transform: showDatePicker ? 'rotate(180deg)' : 'none'
                }}
              />
            </div>

            {/* Dropdown Menu */}
            {showDatePicker && (
              <div
                className="position-absolute end-0 mt-1 bg-white border rounded-3 shadow-lg p-2"
                style={{
                  width: '215px',
                  zIndex: 1060,
                  borderColor: '#E3E7ED'
                }}
              >
                <div className="px-2 py-1 small text-muted fw-semibold border-bottom mb-1" style={{ fontSize: '11px' }}>
                  SELECT DATE / PERIOD
                </div>
                {[
                  { label: 'Today (Mon, 26 May 2025)', value: 'Mon, 26 May 2025' },
                  { label: 'Yesterday (Sun, 25 May 2025)', value: 'Sun, 25 May 2025' },
                  { label: 'Last Week (Mon, 19 May 2025)', value: 'Mon, 19 May 2025' },
                  { label: 'This Month (May 2025)', value: 'May 2025' }
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedDate(item.value);
                      setShowDatePicker(false);
                    }}
                    className={`dropdown-item px-2.5 py-1.5 rounded-2 text-start small d-flex align-items-center justify-content-between ${
                      selectedDate === item.value ? 'bg-light text-danger fw-bold' : 'text-sa-charcoal'
                    }`}
                    style={{ fontSize: '12px' }}
                  >
                    <span>{item.label}</span>
                    {selectedDate === item.value && <span className="text-danger fw-bold">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Role Badge - for non-student and non-teacher roles */}
        {!isStudent && !isTeacher && (
          <div className="d-none d-sm-flex align-items-center gap-1.5 px-2.5 py-1 rounded-pill bg-light border">
            <span
              className="rounded-circle"
              style={{ width: '7px', height: '7px', backgroundColor: 'var(--sa-success-green)' }}
            />
            <span className="fw-semibold text-sa-charcoal" style={{ fontSize: '0.75rem' }}>
              Role: <span className="text-sa-primary text-capitalize">{user?.role?.replace('-', ' ')}</span>
            </span>
          </div>
        )}

        {/* Notifications Icon with right margin to ensure 18px gap to profile */}
        <div className="position-relative" style={{ marginRight: '4px' }}>
          <button
            type="button"
            className="btn btn-light rounded-circle position-relative text-sa-charcoal border"
            style={{ width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
          >
            <Bell size={17} />
            <span
              className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
              style={{ fontSize: '0.58rem', padding: '0.15em 0.4em' }}
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
            className="d-flex align-items-center gap-1.5 ps-2 border-start cursor-pointer"
            onClick={() => setShowUserMenu(!showUserMenu)}
            style={{ cursor: 'pointer' }}
          >
            <img
              src={
                user?.avatar ||
                (isTeacher
                  ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
                  : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80')
              }
              alt="Avatar"
              className="rounded-circle object-fit-cover border"
              style={{ width: isTeacher ? '28px' : '32px', height: isTeacher ? '28px' : '32px' }}
            />
            <div className="d-none d-sm-flex align-items-center gap-1">
              <span className="fw-bold text-sa-charcoal" style={{ fontSize: isTeacher ? '0.80rem' : '0.84rem' }}>
                {user?.name || (isTeacher ? 'Dr. Priya Kulkarni' : 'Shubham Sharma')}
              </span>
              <ChevronDown size={12} className="text-sa-muted" />
            </div>
          </div>

          {showUserMenu && (
            <div
              className="position-absolute end-0 mt-2 bg-white border rounded-3 shadow-lg p-2"
              style={{ width: '230px', zIndex: 1050 }}
            >
              <div className="px-3 py-2 border-bottom mb-1 bg-light rounded-2">
                <div className="fw-bold text-sa-charcoal small">{user?.name || (isTeacher ? 'Dr. Priya Kulkarni' : 'Shubham Sharma')}</div>
                <div className="text-sa-primary fw-medium" style={{ fontSize: '0.76rem' }}>
                  {user?.role === 'super-admin'
                    ? 'Super Administrator'
                    : user?.title || 'Super Administrator'}
                </div>
                <div className="text-muted text-truncate" style={{ fontSize: '0.70rem' }}>
                  {user?.email || 'superadmin@shubham.edu'}
                </div>
              </div>

              <button
                type="button"
                className="dropdown-item btn btn-sm text-start py-2 px-3 rounded-2 d-flex align-items-center gap-2 text-sa-charcoal"
                onClick={() => {
                  setShowUserMenu(false);
                  if (user?.role === 'super-admin') navigate('/super-admin/settings');
                  else if (user?.role === 'admin') navigate('/admin/dashboard');
                  else if (user?.role === 'teacher') navigate('/teacher/profile');
                  else navigate('/student/profile');
                }}
              >
                <UserCircle size={16} className="text-sa-primary" />
                <span className="fw-medium">View Profile</span>
              </button>

              <div className="dropdown-divider my-1"></div>

              <button
                type="button"
                className="dropdown-item btn btn-sm text-start py-2 px-3 rounded-2 text-danger d-flex align-items-center gap-2"
                onClick={handleLogout}
              >
                <LogOut size={16} />
                <span className="fw-medium">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
