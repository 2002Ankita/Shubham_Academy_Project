import React, { useState, useRef, useEffect } from 'react';
import { Menu, Bell, UserCircle, LogOut, CheckCircle, ChevronDown, Search, Calendar, ArrowRight, X, Clock, ChevronRight, Check, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import notificationService from '../../services/notificationService';
import studentService from '../../services/studentService';
import { toast } from 'react-toastify';

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

  const roleClean = (user?.role || '').toLowerCase().replace('-', '_').trim();
  const isSuperAdmin = roleClean === 'super_admin' || roleClean.includes('super') || location.pathname.startsWith('/super-admin');
  const isStudent = roleClean === 'student' || location.pathname.startsWith('/student');
  const isTeacher = roleClean === 'teacher' || location.pathname.startsWith('/teacher');
  const isAdmin = roleClean === 'admin' || location.pathname.startsWith('/admin') || (!isStudent && !isTeacher && !isSuperAdmin);

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

  useEffect(() => {
    if (!isSuperAdmin) return;

    const syncApprovals = async () => {
      try {
        const [data, dbApprovals] = await Promise.all([
          studentService.getAll().catch(() => []),
          studentService.getDiscountApprovals('PENDING').catch(() => [])
        ]);

        if (Array.isArray(data)) {
          notificationService.pruneFinalizedDiscounts(data);
          const pending = data.filter(
            s => s.discountStatus === 'PENDING' && Number(s.discountAmount || s.discountRequestedAmount) > 0
          );

          if (Array.isArray(dbApprovals)) {
            dbApprovals.forEach((a) => {
              const sid = a.student_id || a.studentId;
              if (sid && !pending.some(p => String(p.id) === String(sid))) {
                pending.push({
                  id: sid,
                  name: a.student_name || 'Student',
                  discountAmount: Number(a.discount_amount || 0),
                  discountRequestedAmount: Number(a.discount_requested_amount || a.discount_amount || 0),
                  discountReason: a.discount_reason || 'Fee Concession',
                  discountStatus: 'PENDING',
                  standard: a.standard || 'Course',
                  discountRecommendedBy: a.recommended_by || a.offered_by || 'Counselor',
                  discountOfferedBy: a.offered_by || 'Counselor'
                });
              }
            });
          }

          notificationService.syncDiscountApprovals(pending);
        }
      } catch (e) {
        console.warn('Could not sync discount approvals in header:', e);
      }
    };

    syncApprovals();
    const interval = setInterval(syncApprovals, 10000);
    window.addEventListener('focus', syncApprovals);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', syncApprovals);
    };
  }, [isSuperAdmin]);

  const handleApproveDiscountFromHeader = async (e, notif) => {
    e.stopPropagation();
    if (!notif.studentId) return;
    try {
      const payload = {
        approved_amount: Number(notif.discountAmount) || 0,
        discount_amount: Number(notif.discountAmount) || 0
      };
      await studentService.approveDiscount(notif.studentId, payload);
      notificationService.markAsRead(notif.id);
      try {
        notificationService.notifyDiscountDecision({
          studentId: notif.studentId,
          studentName: notif.studentName || notif.title,
          originalRequested: notif.discountAmount,
          approvedAmount: notif.discountAmount,
          isApproved: true,
          approverName: user?.full_name || 'Shubham Sharma (Superadmin)'
        });
        const fresh = await studentService.getAll();
        notificationService.pruneFinalizedDiscounts(fresh);
        const pending = (fresh || []).filter(s => s.discountStatus === 'PENDING' && Number(s.discountAmount) > 0);
        notificationService.syncDiscountApprovals(pending);
      } catch (notifErr) {
        console.warn('Notification sync error:', notifErr);
      }
      toast.success(`Discount concession approved for ${notif.studentName || 'student'}!`);
      const unreadNotifs = notificationService.getUnreadNotifications(isSuperAdmin);
      setNotificationsList(unreadNotifs);
      setUnreadCount(unreadNotifs.length);
    } catch (err) {
      toast.error(err.response?.data?.detail || err.message || 'Failed to approve discount');
    }
  };

  const handleRejectDiscountFromHeader = async (e, notif) => {
    e.stopPropagation();
    if (!notif.studentId) return;
    try {
      await studentService.rejectDiscount(notif.studentId, 'Declined via notification console');
      notificationService.markAsRead(notif.id);
      try {
        notificationService.notifyDiscountDecision({
          studentId: notif.studentId,
          studentName: notif.studentName || notif.title,
          originalRequested: notif.discountAmount,
          approvedAmount: 0,
          isApproved: false,
          rejectionReason: 'Declined via notification console',
          approverName: user?.full_name || 'Shubham Sharma (Superadmin)'
        });
        const fresh = await studentService.getAll();
        notificationService.pruneFinalizedDiscounts(fresh);
        const pending = (fresh || []).filter(s => s.discountStatus === 'PENDING' && Number(s.discountAmount) > 0);
        notificationService.syncDiscountApprovals(pending);
      } catch (notifErr) {
        console.warn('Notification sync error:', notifErr);
      }
      toast.info(`Discount request for ${notif.studentName || 'student'} was declined.`);
      const unreadNotifs = notificationService.getUnreadNotifications(isSuperAdmin);
      setNotificationsList(unreadNotifs);
      setUnreadCount(unreadNotifs.length);
    } catch (err) {
      toast.error(err.response?.data?.detail || err.message || 'Failed to decline discount');
    }
  };

  const handleNotificationClick = (notif) => {
    notificationService.markAsRead(notif.id);
    notificationService.setSelectedNotice(notif);
    setShowNotifications(false);

    if (notif.type === 'discount_approval' || notif.category === 'Discount & Fees') {
      navigate('/super-admin/discounts?status=PENDING');
      return;
    }

    if (notif.type === 'timetable_request' || notif.type === 'timetable_pending') {
      navigate('/admin/activity-timetable?tab=weekly');
      return;
    }

    if (notif.type === 'timetable_published' && isTeacher) {
      navigate('/teacher/classes');
      return;
    }

    const targetRoute = isStudent
      ? '/student/announcements'
      : isTeacher
        ? '/teacher/announcements'
        : isSuperAdmin
          ? '/super-admin/dashboard'
          : '/admin/notices';

    navigate(targetRoute, { state: { selectedNotice: notif } });
  };

  const handleMarkAllRead = (e) => {
    e.stopPropagation();
    notificationService.markAllAsRead(isSuperAdmin);
  };

  const studentSearchRoutes = [
    { title: 'My Classes & Timetable', path: '/student/classes', keywords: ['classes', 'timetable', 'schedule', 'lectures'] },
    { title: 'Attendance Records', path: '/student/attendance', keywords: ['attendance', 'gate', 'presence', 'card'] },
    { title: 'Fee Details & Receipts', path: '/student/fees', keywords: ['fees', 'receipt', 'dues', 'payments'] },
    { title: 'Examination Timetable', path: '/student/exams', keywords: ['exams', 'examination', 'hall ticket'] },
    { title: 'Academic Results & Rank', path: '/student/results', keywords: ['results', 'marks', 'report card', 'rank'] },
    { title: 'Books Delivery Status', path: '/student/books-delivery', keywords: ['books', 'delivery', 'theory', 'cet', 'stock'] },
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
      className={`position-sticky top-0 bg-white border-bottom px-3 px-md-4 d-flex align-items-center justify-content-between ${isTeacher ? 'teacher-header' : ''}`}
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
          {isTeacher ? 'Teacher Dashboard' : isStudent ? 'Student Dashboard' : isSuperAdmin ? 'Super Admin Dashboard' : 'Admin Dashboard'}
        </h5>
      </div>

      {/* Middle side: Search input matching reference image */}
      <div className="d-none d-md-block position-relative flex-grow-1 mx-3 mx-lg-4" style={{ maxWidth: '380px' }}>
        <form onSubmit={handleSearchSubmit}>
          <div className="position-relative d-flex align-items-center">
            <Search
              size={15}
              className="position-absolute text-muted"
              style={{ left: '13px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              className="form-control"
              style={{
                height: '38px',
                paddingLeft: '36px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                fontSize: '0.82rem'
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
      <div className="d-flex align-items-center h-100 gap-2 gap-sm-3" style={{ paddingRight: '2px' }}>
        {/* Date Selector for Teacher Header */}
        {isTeacher && (
          <div className="position-relative teacher-date-picker">
            <div
              onClick={() => setShowDatePicker(!showDatePicker)}
              onMouseEnter={() => setIsDateHovered(true)}
              onMouseLeave={() => setIsDateHovered(false)}
              className="d-flex align-items-center justify-content-between transition-all"
              style={{
                width: '190px',
                height: '38px',
                padding: '0 11px',
                backgroundColor: isDateHovered ? '#FFF8F8' : '#FFFFFF',
                border: isDateHovered ? '1px solid var(--sa-primary-red)' : '1px solid #E2E8F0',
                borderRadius: '10px',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
                cursor: 'pointer',
                userSelect: 'none'
              }}
              title="Select Date"
            >
              <div className="d-flex align-items-center" style={{ gap: '7px' }}>
                <Calendar size={15} style={{ color: 'var(--sa-primary-red)', flexShrink: 0 }} />
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#1E293B',
                    lineHeight: 1,
                    whiteSpace: 'nowrap'
                  }}
                >
                  <span className="d-none d-sm-inline">{selectedOption.label.split('(')[0]}</span>
                  <span style={{ fontSize: '11.5px', color: '#64748B' }}>
                    {selectedOption.label.match(/\((.*?)\)/)?.[1] || selectedOption.label}
                  </span>
                </span>
              </div>
              <ChevronDown
                size={13}
                style={{
                  color: '#64748B',
                  flexShrink: 0,
                  marginLeft: '6px',
                  transition: 'transform 0.2s ease',
                  transform: showDatePicker ? 'rotate(180deg)' : 'none'
                }}
              />
            </div>

            {/* Dropdown Menu */}
            {showDatePicker && (
              <div
                className="position-absolute end-0 mt-1.5 bg-white border rounded-3 shadow-lg p-2"
                style={{
                  width: '215px',
                  zIndex: 1060,
                  borderColor: '#E2E8F0'
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
                    className={`dropdown-item px-2.5 py-1.5 rounded-2 text-start small d-flex align-items-center justify-content-between ${globalDateFilter === item.value ? 'bg-light text-danger fw-bold' : 'text-sa-charcoal'
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

        {/* Notifications Icon */}
        <div className="position-relative teacher-header-notifications" ref={notificationsRef}>
          <button
            type="button"
            className="btn btn-light rounded-circle position-relative text-sa-charcoal d-flex align-items-center justify-content-center"
            style={{
              width: '38px',
              height: '38px',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              padding: 0
            }}
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span
                className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                style={{ fontSize: '0.58rem', padding: '0.2em 0.45em' }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div
              className="position-absolute end-0 mt-2 bg-white border shadow-lg p-3"
              style={{
                width: '390px',
                maxWidth: 'calc(100vw - 20px)',
                borderRadius: '16px',
                boxShadow: '0 16px 40px -8px rgba(15, 23, 42, 0.16), 0 4px 12px rgba(15, 23, 42, 0.06)',
                borderColor: '#E2E8F0',
                zIndex: 1050
              }}
            >
              <div className="d-flex align-items-center justify-content-between pb-2.5 border-bottom mb-2.5">
                <div className="d-flex align-items-center gap-2">
                  <span className="fw-bold text-sa-charcoal brand-font" style={{ fontSize: '0.92rem' }}>
                    Notifications
                  </span>
                  {unreadCount > 0 ? (
                    <span
                      className="badge rounded-pill px-2 py-0.5 fw-semibold"
                      style={{ fontSize: '0.68rem', backgroundColor: '#FEE2E2', color: '#991B1B' }}
                    >
                      {unreadCount} New
                    </span>
                  ) : (
                    <span
                      className="badge rounded-pill px-2 py-0.5 fw-medium"
                      style={{ fontSize: '0.68rem', backgroundColor: '#F1F5F9', color: '#64748B' }}
                    >
                      All Clear
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    className="btn btn-link p-0 text-decoration-none fw-semibold"
                    style={{ fontSize: '0.75rem', color: '#8B1216' }}
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
                    style={{ width: '42px', height: '42px', backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}
                  >
                    <CheckCircle size={20} className="text-success" />
                  </div>
                  <p className="small fw-bold text-sa-charcoal mb-0" style={{ fontSize: '0.84rem' }}>
                    No new notifications
                  </p>
                  <p className="text-sa-muted mb-0 mt-1" style={{ fontSize: '0.74rem' }}>
                    All notifications have been reviewed
                  </p>
                </div>
              ) : (
                <div
                  className="d-flex flex-column gap-2 w-100"
                  style={{
                    maxHeight: '380px',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    paddingRight: '2px'
                  }}
                >
                  {notificationsList.map((item) => {
                    const isPendingDiscountApproval = item.type === 'discount_approval';
                    const isDiscountDecision = item.type === 'discount_approved' || item.type === 'discount_declined';

                    // ONLY truly pending discount requests show Accept / Reject action buttons to Superadmin
                    if (isPendingDiscountApproval && isSuperAdmin) {
                      return (
                        <div
                          key={item.id}
                          className="w-100 p-2.5 rounded-3 border d-flex flex-column gap-2"
                          style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            backgroundColor: '#FFFBEB',
                            borderColor: '#FDE68A',
                            transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
                          }}
                        >
                          <div className="d-flex align-items-center justify-content-between gap-2">
                            <div className="d-flex align-items-center gap-1.5 flex-grow-1 min-w-0">
                              <span
                                className="badge rounded-pill fw-bold"
                                style={{ backgroundColor: '#FEF08A', color: '#854D0E', fontSize: '0.68rem', padding: '0.25em 0.55em' }}
                              >
                                Pending Concession
                              </span>
                              <span className="fw-bold text-dark text-truncate" style={{ fontSize: '0.82rem' }}>
                                {item.studentName || item.title}
                              </span>
                            </div>
                            <span
                              className="badge rounded-pill fw-medium d-inline-flex align-items-center"
                              style={{
                                backgroundColor: '#FFFFFF',
                                color: '#64748B',
                                border: '1px solid #E2E8F0',
                                fontSize: '0.68rem',
                                padding: '0.25em 0.5em',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              <Clock size={10} className="me-1 align-text-top flex-shrink-0" />
                              <span>{item.time}</span>
                            </span>
                          </div>

                          <div className="small text-secondary" style={{ fontSize: '0.76rem', lineHeight: 1.35 }}>
                            {item.discountAmount ? (
                              <span>Concession of <strong>₹{Number(item.discountAmount).toLocaleString()}</strong> recommended by {item.author || item.recommendedBy || 'Admission Desk'}</span>
                            ) : (
                              <span>{item.details || item.title}</span>
                            )}
                          </div>

                          <div className="d-flex align-items-center justify-content-between gap-1.5 pt-1 border-top border-warning-subtle">
                            <div className="d-flex align-items-center gap-1.5">
                              <button
                                type="button"
                                className="btn btn-sm btn-success py-0.5 px-2 fw-bold d-inline-flex align-items-center gap-1"
                                style={{ fontSize: '0.72rem', borderRadius: '5px' }}
                                onClick={(e) => handleApproveDiscountFromHeader(e, item)}
                                title="Approve concession now"
                              >
                                <Check size={12} strokeWidth={3} /> Accept
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger py-0.5 px-2 fw-semibold d-inline-flex align-items-center gap-1"
                                style={{ fontSize: '0.72rem', borderRadius: '5px' }}
                                onClick={(e) => handleRejectDiscountFromHeader(e, item)}
                                title="Decline concession"
                              >
                                <X size={12} /> Reject
                              </button>
                            </div>

                            <button
                              type="button"
                              className="btn btn-link p-0 text-decoration-none fw-semibold text-warning-emphasis d-inline-flex align-items-center gap-1"
                              style={{ fontSize: '0.72rem' }}
                              onClick={() => {
                                setShowNotifications(false);
                                navigate('/super-admin/discounts?status=PENDING');
                              }}
                            >
                              <span>Review</span>
                              <ChevronRight size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    }

                    // For finalized decisions (Approved or Declined), render as informative status notification
                    if (isDiscountDecision) {
                      const isApproved = item.type === 'discount_approved';
                      return (
                        <div
                          key={item.id}
                          className="w-100 p-2.5 rounded-3 border d-flex flex-column gap-1.5"
                          style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            cursor: 'pointer',
                            backgroundColor: isApproved ? '#F0FDF4' : '#FEF2F2',
                            borderColor: isApproved ? '#BBF7D0' : '#FECDD3',
                            transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
                          }}
                          onClick={() => handleNotificationClick(item)}
                        >
                          <div className="d-flex align-items-center justify-content-between gap-2">
                            <div className="d-flex align-items-center gap-1.5 flex-grow-1 min-w-0">
                              <span
                                className="badge rounded-pill fw-bold"
                                style={{
                                  backgroundColor: isApproved ? '#DCFCE7' : '#FEE2E2',
                                  color: isApproved ? '#166534' : '#991B1B',
                                  fontSize: '0.68rem',
                                  padding: '0.25em 0.55em'
                                }}
                              >
                                {isApproved ? 'Concession Approved' : 'Concession Declined'}
                              </span>
                              <span className="fw-bold text-dark text-truncate" style={{ fontSize: '0.82rem' }}>
                                {item.studentName || item.title}
                              </span>
                            </div>
                            <span
                              className="badge rounded-pill fw-medium d-inline-flex align-items-center"
                              style={{
                                backgroundColor: '#FFFFFF',
                                color: '#64748B',
                                border: '1px solid #E2E8F0',
                                fontSize: '0.68rem',
                                padding: '0.25em 0.5em',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              <Clock size={10} className="me-1 align-text-top flex-shrink-0" />
                              <span>{item.time}</span>
                            </span>
                          </div>

                          <div className="small text-secondary" style={{ fontSize: '0.75rem', lineHeight: 1.35 }}>
                            {item.details || item.title}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={item.id}
                        className="w-100 p-2.5 rounded-3 border d-flex align-items-center justify-content-between gap-2"
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          cursor: 'pointer',
                          backgroundColor: '#FFFFFF',
                          borderColor: '#E2E8F0',
                          transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#FFF5F5';
                          e.currentTarget.style.borderColor = '#FECDD3';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 18, 22, 0.08)';
                          const arrow = e.currentTarget.querySelector('.notification-arrow');
                          if (arrow) {
                            arrow.style.transform = 'translateX(2px)';
                            arrow.style.color = '#8B1216';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#FFFFFF';
                          e.currentTarget.style.borderColor = '#E2E8F0';
                          e.currentTarget.style.transform = 'none';
                          e.currentTarget.style.boxShadow = 'none';
                          const arrow = e.currentTarget.querySelector('.notification-arrow');
                          if (arrow) {
                            arrow.style.transform = 'none';
                            arrow.style.color = '#94a3b8';
                          }
                        }}
                        onClick={() => handleNotificationClick(item)}
                      >
                        <div className="d-flex align-items-center gap-2 flex-grow-1 min-w-0 pe-2">
                          <span
                            className="rounded-circle bg-danger flex-shrink-0"
                            style={{
                              width: '6.5px',
                              height: '6.5px',
                              boxShadow: '0 0 0 2px rgba(220, 38, 38, 0.15)'
                            }}
                          />
                          <span
                            className="fw-semibold text-sa-charcoal text-truncate d-block"
                            style={{ fontSize: '0.81rem' }}
                            title={item.title}
                          >
                            {item.title}
                          </span>
                        </div>

                        <div className="d-flex align-items-center gap-2 flex-shrink-0 ms-auto">
                          <span
                            className="badge rounded-pill fw-medium d-inline-flex align-items-center"
                            style={{
                              backgroundColor: '#F8FAFC',
                              color: '#64748B',
                              border: '1px solid #E2E8F0',
                              fontSize: '0.70rem',
                              padding: '0.3em 0.6em',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            <Clock size={11} className="me-1 align-text-top flex-shrink-0" />
                            <span>{item.time}</span>
                          </span>
                          <div
                            className="notification-arrow d-flex align-items-center justify-content-center text-muted"
                            style={{ width: '14px', height: '14px', transition: 'all 0.18s ease' }}
                          >
                            <ChevronRight size={14} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {isSuperAdmin && (
                <div className="pt-2 border-top mt-2">
                  {notificationsList.some(n => n.type === 'discount_approval') ? (
                    <button
                      type="button"
                      onClick={() => {
                        setShowNotifications(false);
                        navigate('/super-admin/discounts?status=PENDING');
                      }}
                      className="btn btn-sm btn-warning text-dark w-100 fw-bold d-flex align-items-center justify-content-center gap-1.5 py-1.5"
                      style={{ fontSize: '0.78rem', borderRadius: '8px' }}
                    >
                      <Clock size={13} />
                      <span>Display All Pending Discounts ({notificationsList.filter(n => n.type === 'discount_approval').length})</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setShowNotifications(false);
                        navigate('/super-admin/discounts');
                      }}
                      className="btn btn-sm btn-light border text-secondary w-100 fw-semibold d-flex align-items-center justify-content-center gap-1.5 py-1.5"
                      style={{ fontSize: '0.78rem', borderRadius: '8px' }}
                    >
                      <ShieldCheck size={14} style={{ color: '#8B1216' }} />
                      <span>View Fee Concession Registry</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Subtle Divider */}
        <div className="d-none d-sm-block" style={{ width: '1px', height: '24px', backgroundColor: '#E2E8F0', margin: '0 2px' }} />

        {/* User Profile avatar & info */}
        <div
          className={`position-relative h-100 d-flex align-items-center sa-header-profile-wrapper ${isTeacher ? 'teacher-header-profile' : ''}`}
          ref={userMenuRef}
          style={{ width: 'auto' }}
        >
          <div
            className="d-flex align-items-center justify-content-between px-2 px-sm-3 h-100 cursor-pointer w-100 gap-1.5 rounded-3 transition-all"
            onClick={() => setShowUserMenu(!showUserMenu)}
            style={{
              cursor: 'pointer',
              userSelect: 'none',
              borderRadius: '10px',
              border: showUserMenu ? '1px solid #E2E8F0' : '1px solid transparent',
              backgroundColor: showUserMenu ? '#F8FAFC' : 'transparent',
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
                  style={{ width: '34px', height: '34px' }}
                />
              )}
              <div className="d-none d-sm-flex flex-column text-start text-truncate" style={{ lineHeight: 1.15 }}>
                <span className="fw-bold text-sa-charcoal text-truncate" style={{ fontSize: '0.82rem' }}>
                  {user?.name || (isStudent ? 'Aarav Deshmukh' : isAdmin ? 'Rajesh Patil' : isTeacher ? 'More A.D' : 'Shubham Sharma')}
                </span>
                <span className="text-sa-muted" style={{ fontSize: '0.70rem', fontWeight: 500 }}>
                  {isSuperAdmin ? 'Super Admin' : isTeacher ? 'Senior Faculty' : isStudent ? 'Student' : 'Administrator'}
                </span>
              </div>
            </div>
            <ChevronDown
              size={13}
              className="text-sa-muted ms-1.5 flex-shrink-0"
              style={{
                transform: showUserMenu ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease'
              }}
            />
          </div>

          {showUserMenu && (
            <div
              className="position-absolute shadow-lg bg-white border rounded-3 p-2"
              style={{
                top: 'calc(100% + 6px)',
                right: 0,
                minWidth: '205px',
                zIndex: 1060,
                borderColor: '#E2E8F0',
                borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)'
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
