import React, { useState, useRef, useEffect } from 'react';
import { Menu, Bell, UserCircle, LogOut, CheckCircle, ChevronDown, Search, Calendar, ArrowRight, X, Clock, ChevronRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import notificationService from '../../services/notificationService';

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
  const [notificationsList, setNotificationsList] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const userMenuRef = useRef(null);
  const notificationsRef = useRef(null);

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
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const loadNotifications = () => {
      const unreadNotifs = notificationService.getUnreadNotifications(isSuperAdmin);
      setNotificationsList(unreadNotifs);
      setUnreadCount(unreadNotifs.length);
    };

    loadNotifications();

    const handleUpdate = () => {
      loadNotifications();
    };

    window.addEventListener('sa_notifications_updated', handleUpdate);
    return () => {
      window.removeEventListener('sa_notifications_updated', handleUpdate);
    };
  }, [isSuperAdmin]);

  const handleNotificationClick = (notif) => {
    notificationService.markAsRead(notif.id);
    notificationService.setSelectedNotice(notif);
    setShowNotifications(false);

    const targetRoute = isStudent
      ? '/student/announcements'
      : isTeacher
      ? '/teacher/announcements'
      : '/admin/notices';

    navigate(targetRoute, { state: { selectedNotice: notif } });
  };

  const handleMarkAllRead = (e) => {
    e.stopPropagation();
    notificationService.markAllAsRead(isSuperAdmin);
  };

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
      <div className="d-flex align-items-center h-100" style={{ gap: '14px', paddingRight: '4px' }}>
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
        <div className="position-relative" ref={notificationsRef} style={{ marginRight: '4px' }}>
          <button
            type="button"
            className="btn btn-light rounded-circle position-relative text-sa-charcoal border"
            style={{ width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span
                className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                style={{ fontSize: '0.58rem', padding: '0.15em 0.4em' }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div
              className="position-absolute end-0 mt-2 bg-white border rounded-3 shadow-lg p-3"
              style={{ width: '330px', zIndex: 1050 }}
            >
              <div className="d-flex align-items-center justify-content-between pb-2 border-bottom mb-2">
                <div className="d-flex align-items-center gap-2">
                  <span className="fw-bold small text-sa-charcoal">Notifications</span>
                  {unreadCount > 0 ? (
                    <span className="badge bg-danger rounded-pill" style={{ fontSize: '0.65rem' }}>
                      {unreadCount} New
                    </span>
                  ) : (
                    <span className="badge bg-light text-muted border rounded-pill" style={{ fontSize: '0.65rem' }}>
                      All Clear
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    className="btn btn-link p-0 text-decoration-none"
                    style={{ fontSize: '0.72rem', color: '#881337', fontWeight: 600 }}
                    onClick={handleMarkAllRead}
                  >
                    Clear all
                  </button>
                )}
              </div>

              {notificationsList.length === 0 ? (
                <div className="text-center py-4 px-3 text-sa-muted">
                  <div
                    className="d-inline-flex align-items-center justify-content-center rounded-circle mb-2"
                    style={{ width: '40px', height: '40px', backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}
                  >
                    <CheckCircle size={20} className="text-success" />
                  </div>
                  <p className="small fw-bold text-sa-charcoal mb-0" style={{ fontSize: '0.82rem' }}>
                    No new notifications
                  </p>
                  <p className="text-sa-muted mb-0 mt-1" style={{ fontSize: '0.74rem' }}>
                    All notifications have been reviewed
                  </p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-1.5" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                  {notificationsList.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-2 border d-flex align-items-center justify-content-between gap-2 cursor-pointer transition-all"
                      style={{
                        cursor: 'pointer',
                        backgroundColor: '#FFFFFF',
                        borderColor: '#F1F5F9',
                        transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#FFF1F2';
                        e.currentTarget.style.borderColor = '#FDA4AF';
                        e.currentTarget.style.transform = 'translateX(4px)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(136, 19, 55, 0.08)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#FFFFFF';
                        e.currentTarget.style.borderColor = '#F1F5F9';
                        e.currentTarget.style.transform = 'translateX(0px)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                      onClick={() => handleNotificationClick(item)}
                    >
                      <div className="d-flex align-items-center gap-2 flex-grow-1 min-w-0">
                        <span
                          className="rounded-circle bg-danger flex-shrink-0"
                          style={{ width: '6.5px', height: '6.5px' }}
                        />
                        <span
                          className="fw-bold text-sa-charcoal text-truncate"
                          style={{ fontSize: '0.81rem' }}
                          title={item.title}
                        >
                          {item.title}
                        </span>
                      </div>

                      <div className="d-flex align-items-center gap-1.5 flex-shrink-0">
                        <span
                          className="badge rounded-pill fw-semibold"
                          style={{
                            backgroundColor: '#F8FAFC',
                            color: '#64748B',
                            border: '1px solid #E2E8F0',
                            fontSize: '0.70rem',
                            padding: '0.25em 0.55em'
                          }}
                        >
                          <Clock size={11} className="me-1 align-text-top" />
                          {item.time}
                        </span>
                        <ChevronRight size={13} className="text-sa-muted" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Profile avatar & info */}
        <div
          className="position-relative h-100 d-flex align-items-center"
          ref={userMenuRef}
          style={{ width: isTeacher ? '195px' : '205px' }}
        >
          <div
            className="d-flex align-items-center justify-content-between px-3 h-100 cursor-pointer w-100"
            onClick={() => setShowUserMenu(!showUserMenu)}
            style={{
              cursor: 'pointer',
              borderLeft: '1px solid rgba(220, 38, 38, 0.14)',
              borderRight: showUserMenu ? '1px solid rgba(220, 38, 38, 0.14)' : '1px solid transparent',
              borderTop: showUserMenu ? '1px solid rgba(220, 38, 38, 0.14)' : '1px solid transparent',
              borderBottom: 'none',
              background: showUserMenu ? 'rgba(255, 255, 255, 0.92)' : 'transparent',
              backdropFilter: showUserMenu ? 'blur(20px) saturate(190%)' : 'none',
              WebkitBackdropFilter: showUserMenu ? 'blur(20px) saturate(190%)' : 'none',
              borderTopLeftRadius: showUserMenu ? '14px' : '0',
              borderTopRightRadius: showUserMenu ? '14px' : '0',
              zIndex: 1061,
              transition: 'all 0.15s ease'
            }}
          >
            <div className="d-flex align-items-center gap-2 overflow-hidden">
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
                    (isStudent
                      ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                      : isAdmin
                      ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
                      : isTeacher
                      ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
                      : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80')
                  }
                  alt="Avatar"
                  className="rounded-circle object-fit-cover border flex-shrink-0"
                  style={{ width: isTeacher ? '28px' : '34px', height: isTeacher ? '28px' : '34px' }}
                />
              )}
              <div className="d-none d-sm-flex flex-column text-start text-truncate" style={{ lineHeight: 1.15 }}>
                <span className="fw-bold text-sa-charcoal text-truncate" style={{ fontSize: isTeacher ? '0.80rem' : '0.85rem' }}>
                  {user?.name || (isStudent ? 'Aarav Deshmukh' : isAdmin ? 'Rajesh Patil' : isTeacher ? 'Dr. Priya Kulkarni' : 'Shubham Sharma')}
                </span>
                <span className="text-sa-muted" style={{ fontSize: '0.70rem', fontWeight: 500 }}>
                  {isSuperAdmin ? 'Super Admin' : isTeacher ? 'Senior Faculty' : isStudent ? 'Student' : 'Administrator'}
                </span>
              </div>
            </div>
            <ChevronDown
              size={13}
              className="text-sa-muted ms-1 flex-shrink-0"
              style={{
                transform: showUserMenu ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease'
              }}
            />
          </div>

          {showUserMenu && (
            <div
              className="position-absolute shadow-lg"
              style={{
                top: 'calc(100% - 2px)',
                left: 0,
                width: '100%',
                zIndex: 1060,
                background: 'rgba(255, 255, 255, 0.92)',
                backdropFilter: 'blur(20px) saturate(190%)',
                WebkitBackdropFilter: 'blur(20px) saturate(190%)',
                borderLeft: '1px solid rgba(220, 38, 38, 0.14)',
                borderRight: '1px solid rgba(220, 38, 38, 0.14)',
                borderBottom: '1px solid rgba(220, 38, 38, 0.14)',
                borderTop: 'none',
                borderBottomLeftRadius: '14px',
                borderBottomRightRadius: '14px',
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
                boxShadow: '0 14px 28px rgba(185, 28, 28, 0.08), 0 6px 14px rgba(0, 0, 0, 0.04)',
                padding: '6px'
              }}
            >
              {/* View Profile Item */}
              <button
                type="button"
                className="dropdown-item btn btn-sm text-start py-2.5 px-3 rounded-3 d-flex align-items-center gap-3 w-100"
                style={{
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(254, 242, 242, 0.85)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                onClick={() => {
                  setShowUserMenu(false);
                  if (isAdmin || user?.role === 'admin') navigate('/admin/profile');
                  else if (isSuperAdmin || user?.role === 'super-admin') navigate('/super-admin/settings');
                  else if (isTeacher || user?.role === 'teacher') navigate('/teacher/profile');
                  else navigate('/student/profile');
                }}
              >
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{
                    width: '30px',
                    height: '30px',
                    backgroundColor: 'rgba(254, 242, 242, 0.95)',
                    border: '1px solid rgba(220, 38, 38, 0.20)',
                    color: 'var(--sa-primary-red, #A91D22)'
                  }}
                >
                  <UserCircle size={17} />
                </div>
                <span className="fw-semibold text-sa-charcoal" style={{ fontSize: '0.86rem' }}>
                  View Profile
                </span>
              </button>

              {/* Subtle Divider */}
              <div style={{ height: '1px', backgroundColor: 'rgba(220, 38, 38, 0.10)', margin: '4px 6px' }} />

              {/* Logout Item */}
              <button
                type="button"
                className="dropdown-item btn btn-sm text-start py-2.5 px-3 rounded-3 d-flex align-items-center gap-3 w-100"
                style={{
                  cursor: 'pointer',
                  color: '#DC2626',
                  transition: 'all 0.15s ease',
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(254, 226, 226, 0.85)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                onClick={handleLogout}
              >
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{
                    width: '30px',
                    height: '30px',
                    backgroundColor: 'rgba(254, 226, 226, 0.95)',
                    border: '1px solid rgba(220, 38, 38, 0.24)',
                    color: '#DC2626'
                  }}
                >
                  <LogOut size={16} />
                </div>
                <span className="fw-semibold" style={{ color: '#DC2626', fontSize: '0.86rem' }}>
                  Logout
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
