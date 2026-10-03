import React, { useState, useRef, useEffect } from 'react';
import { Menu, Bell, UserCircle, LogOut, CheckCircle, ChevronDown, Search, Calendar } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Header({ onToggleSidebar, globalDateFilter, setGlobalDateFilter }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isDateHovered, setIsDateHovered] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  const userMenuRef = useRef(null);

  // Dynamic Date calculation
  const today = new Date();
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
  const lastWeek = new Date(); lastWeek.setDate(today.getDate() - 7);

  const formatDateForDisplay = (date) => {
    return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  };
  const formatDateValue = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const dateOptions = [
    { label: `Today (${formatDateForDisplay(today)})`, value: formatDateValue(today) },
    { label: `Yesterday (${formatDateForDisplay(yesterday)})`, value: formatDateValue(yesterday) },
    { label: `Last Week (${formatDateForDisplay(lastWeek)})`, value: formatDateValue(lastWeek) },
    { label: `This Month (${today.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })})`, value: 'month' }
  ];

  const selectedOption = dateOptions.find(o => o.value === globalDateFilter) || dateOptions[0];

  const isStudent = user?.role === 'student' || location.pathname.startsWith('/student');
  const isTeacher = user?.role === 'teacher' || location.pathname.startsWith('/teacher');
  const isSuperAdmin = user?.role === 'super-admin' || location.pathname.startsWith('/super-admin');
  const isAdmin = user?.role === 'admin' || location.pathname.startsWith('/admin') || (!isStudent && !isTeacher && !isSuperAdmin);

  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    }
    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

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
                isSuperAdmin
                  ? "Search academies, users, plans, payments..."
                  : isTeacher
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
                  <span className="d-none d-sm-inline">{selectedOption.label.split('(')[0]}</span>
                  <span style={{ fontSize: '12px', color: '#64748B' }}>
                    {selectedOption.label.match(/\((.*?)\)/)?.[1] || selectedOption.label}
                  </span>
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
                {dateOptions.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      if (setGlobalDateFilter) setGlobalDateFilter(item.value);
                      setShowDatePicker(false);
                    }}
                    className={`dropdown-item px-2.5 py-1.5 rounded-2 text-start small d-flex align-items-center justify-content-between ${
                      globalDateFilter === item.value ? 'bg-light text-danger fw-bold' : 'text-sa-charcoal'
                    }`}
                    style={{ fontSize: '12px' }}
                  >
                    <span>{item.label}</span>
                    {globalDateFilter === item.value && <span className="text-danger fw-bold">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Role Badge - for Academy Admin matching Image 2 */}
        {isAdmin && !isSuperAdmin && (
          <div
            className="d-none d-sm-flex align-items-center gap-1.5 px-2.5 py-1 rounded-pill bg-white border shadow-xs"
            style={{ border: '1px solid #e2e8f0', borderRadius: '9999px' }}
          >
            <span
              className="rounded-circle"
              style={{ width: '8px', height: '8px', backgroundColor: '#10b981', display: 'inline-block' }}
            />
            <span className="fw-semibold" style={{ fontSize: '0.80rem', color: '#c53030' }}>
              Admin
            </span>
          </div>
        )}

        {/* Role Badge for Super Admin */}
        {isSuperAdmin && (
          <>
            <div className="d-none d-sm-flex align-items-center gap-1.5 px-2.5 py-1 rounded-pill bg-light border">
              <span
                className="rounded-circle"
                style={{ width: '7px', height: '7px', backgroundColor: 'var(--sa-success-green)' }}
              />
              <span className="fw-semibold text-sa-primary text-capitalize" style={{ fontSize: '0.75rem' }}>
                Super Admin
              </span>
            </div>
            <div
              className="d-none d-lg-flex align-items-center gap-1.5 px-3 py-1 rounded-pill"
              style={{
                backgroundColor: '#F0FDF4',
                border: '1px solid #BBF7D0',
                fontSize: '0.78rem',
                color: '#15803d',
                fontWeight: 600
              }}
            >
              <span className="rounded-circle bg-success" style={{ width: '7px', height: '7px', display: 'inline-block' }} />
              <span>System Online</span>
            </div>
          </>
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
              {isSuperAdmin ? 5 : 4}
            </span>
          </button>

          {showNotifications && (
            <div
              className="position-absolute end-0 mt-2 bg-white border rounded-3 shadow-lg p-3"
              style={{ width: '310px', zIndex: 1050 }}
            >
              <div className="d-flex align-items-center justify-content-between pb-2 border-bottom mb-2">
                <span className="fw-bold small text-sa-charcoal">Notifications</span>
                <span className="badge bg-sa-primary small">{isSuperAdmin ? '5 New' : '4 New'}</span>
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
        <div className="position-relative" ref={userMenuRef}>
          <div
            className="d-flex align-items-center gap-2 ps-2 border-start cursor-pointer"
            onClick={() => setShowUserMenu(!showUserMenu)}
            style={{ cursor: 'pointer' }}
          >
            {isSuperAdmin ? (
              <div
                className="rounded-circle text-white d-flex align-items-center justify-content-center fw-bold shadow-xs flex-shrink-0"
                style={{ width: '34px', height: '34px', backgroundColor: '#3B0709', fontSize: '0.90rem' }}
              >
                S
              </div>
            ) : (
              <img
                src={
                  user?.avatar ||
                  (isAdmin
                    ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
                    : isTeacher
                    ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
                    : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80')
                }
                alt="Avatar"
                className="rounded-circle object-fit-cover border"
                style={{ width: isTeacher ? '28px' : '34px', height: isTeacher ? '28px' : '34px' }}
              />
            )}
            <div className="d-none d-sm-flex flex-column text-start" style={{ lineHeight: 1.15 }}>
              <span className="fw-bold text-sa-charcoal" style={{ fontSize: isTeacher ? '0.80rem' : '0.85rem' }}>
                {user?.name || (isAdmin ? 'Rajesh Patil' : isTeacher ? 'Dr. Priya Kulkarni' : 'Shubham Sharma')}
              </span>
              <span className="text-sa-muted" style={{ fontSize: '0.70rem', fontWeight: 500 }}>
                {isSuperAdmin ? 'Super Admin' : isTeacher ? 'Senior Faculty' : 'Administrator'}
              </span>
            </div>
            <ChevronDown size={13} className="text-sa-muted ms-1" />
          </div>

          {showUserMenu && (
            <div
              className="position-absolute end-0 mt-2 bg-white border shadow-lg p-2.5"
              style={{
                width: '240px',
                zIndex: 1050,
                borderRadius: '14px',
                border: '1px solid #edf2f7',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)'
              }}
            >
              <div
                className="px-3 py-2.5 mb-2 rounded-3"
                style={{ backgroundColor: '#F8FAFC' }}
              >
                <div className="fw-bold text-sa-charcoal" style={{ fontSize: '0.94rem', lineHeight: 1.25 }}>
                  {user?.name || (isAdmin ? 'Rajesh Patil' : isTeacher ? 'Dr. Priya Kulkarni' : 'Shubham Sharma')}
                </div>
                <div className="fw-medium mt-1" style={{ fontSize: '0.82rem', color: '#c53030' }}>
                  {isAdmin ? 'admin' : isSuperAdmin ? 'super-admin' : (user?.role || 'admin')}
                </div>
                <div className="text-muted text-truncate mt-0.5" style={{ fontSize: '0.78rem' }}>
                  {user?.email || (isAdmin ? 'admin@shubham.edu' : 'superadmin@shubham.edu')}
                </div>
              </div>

              <button
                type="button"
                className="dropdown-item btn btn-sm text-start py-2 px-3 rounded-2 d-flex align-items-center gap-2.5 w-100 text-sa-charcoal"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  setShowUserMenu(false);
                  if (isAdmin || user?.role === 'admin') navigate('/admin/profile');
                  else if (isSuperAdmin || user?.role === 'super-admin') navigate('/super-admin/settings');
                  else if (isTeacher || user?.role === 'teacher') navigate('/teacher/profile');
                  else navigate('/student/profile');
                }}
              >
                <UserCircle size={18} style={{ color: '#c53030', flexShrink: 0 }} />
                <span className="fw-semibold" style={{ color: '#1e293b', fontSize: '0.88rem' }}>View Profile</span>
              </button>

              <button
                type="button"
                className="dropdown-item btn btn-sm text-start py-2 px-3 rounded-2 d-flex align-items-center gap-2.5 w-100 mt-1"
                style={{ color: '#ef4444', cursor: 'pointer' }}
                onClick={handleLogout}
              >
                <LogOut size={18} style={{ color: '#ef4444', flexShrink: 0 }} />
                <span className="fw-semibold" style={{ color: '#ef4444', fontSize: '0.88rem' }}>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
