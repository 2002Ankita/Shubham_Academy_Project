import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard,
  Building2,
  Users,
  FileBarChart,
  ShieldAlert,
  Shield,
  Settings,
  UserCheck,
  GraduationCap,
  CalendarCheck,
  CreditCard,
  BookOpen,
  ClipboardList,
  BookMarked,
  Truck,
  Bell,
  LogOut,
  ChevronRight,
  UserCheck2,
  Award,
  BookCheck,
  Home,
  FileText,
  BarChart3,
  Cloud,
  Megaphone,
  User,
  IndianRupee,
  Package,
  PhoneCall,
  Clock,
  Calendar,
  Crown,
  LifeBuoy
} from 'lucide-react';

// Custom Teacher Icon with bust and pen matching reference screenshot for Super Admin
const TeacherPenIcon = ({ size = 21, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ minWidth: size, minHeight: size }}
  >
    <path d="M17 21a7 7 0 0 0-14 0" />
    <circle cx="10" cy="8" r="4.5" />
    <path d="M21.5 15.5l-3 3a1.2 1.2 0 0 1-.8.4l-2.2.6.6-2.2c.1-.3.2-.6.4-.8l3-3a1.4 1.4 0 0 1 2 2z" />
  </svg>
);

// Academy Admin Icons matching user reference screenshot
const OverviewHomeIcon = ({ size = 21, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    style={{ minWidth: size, minHeight: size }}
  >
    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
  </svg>
);

const AdmissionsIcon = ({ size = 21, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    style={{ minWidth: size, minHeight: size }}
  >
    <path d="M14 8c0-2.21-1.79-4-4-4S6 5.79 6 8s1.79 4 4 4 4-1.79 4-4zm-4 6c-3.31 0-6 1.79-6 4v2h12v-2c0-2.21-2.69-4-6-4zm9-3v-2h-2v2h-2v2h2v2h2v-2h2v-2h-2z" />
  </svg>
);

const StudentsIcon = ({ size = 21, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    style={{ minWidth: size, minHeight: size }}
  >
    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
  </svg>
);

const RfidAttendanceIcon = ({ size = 21, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ minWidth: size, minHeight: size }}
  >
    <rect x="2" y="4" width="20" height="16" rx="3" />
    <path d="M6 8h12M6 12h12M6 16h6" strokeWidth="2.2" />
  </svg>
);

const FeeRupeeIcon = ({ size = 21, className = '' }) => (
  <IndianRupee size={size} strokeWidth={2.5} className={className} style={{ minWidth: size, minHeight: size }} />
);

const NotesStockIcon = ({ size = 21, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    style={{ minWidth: size, minHeight: size }}
  >
    <path d="M12 2L3 7v10l9 5 9-5V7l-9-5zm0 2.2L18.6 8 12 11.6 5.4 8 12 4.2zM4.8 9.3l6.2 3.4v7.7L4.8 17V9.3zm8.4 11.1v-7.7l6.2-3.4V17l-6.2 3.4z" />
  </svg>
);

const ExaminationsDocIcon = ({ size = 21, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    style={{ minWidth: size, minHeight: size }}
  >
    <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
  </svg>
);

const TeachersWritingIcon = ({ size = 21, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    style={{ minWidth: size, minHeight: size }}
  >
    <path d="M10 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM3 19a7 7 0 0 1 11.2-5.6l-1.4 1.4A5.5 5.5 0 0 0 5 19H3zm15.1-4.8l2.1-2.1c.4-.4 1-.4 1.4 0l1.4 1.4c.4.4.4 1 0 1.4l-2.1 2.1-2.8-2.8zm-1.4 1.4l2.8 2.8-5.7 5.7H11v-2.8l5.7-5.7z" />
  </svg>
);

const NotificationsBellIcon = ({ size = 21, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    style={{ minWidth: size, minHeight: size }}
  >
    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
  </svg>
);

const ReportsBarIcon = ({ size = 21, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    style={{ minWidth: size, minHeight: size }}
  >
    <path d="M4 19h4v-7H4v7zm6 0h4V5h-4v14zm6 0h4v-10h-4v10z" />
  </svg>
);

const ContactPhoneIcon = ({ size = 21, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    style={{ minWidth: size, minHeight: size }}
  >
    <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-2.2 2.2a15.053 15.053 0 0 1-6.59-6.59l2.2-2.21a.96.96 0 0 0 .25-1.01A11.36 11.36 0 0 1 8.5 3.92c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.54c0-.55-.45-1-.99-1z" />
  </svg>
);

export default function Sidebar({ isOpen, onClose, width, isStudent: propIsStudent, isSuperAdmin: propIsSuperAdmin, isTeacher: propIsTeacher, isAdmin: propIsAdmin }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isSuperAdmin = propIsSuperAdmin ?? (user?.role === 'super-admin' || location.pathname.startsWith('/super-admin'));
  const isStudent = propIsStudent ?? (user?.role === 'student' || location.pathname.startsWith('/student'));
  const isTeacher = propIsTeacher ?? (user?.role === 'teacher' || location.pathname.startsWith('/teacher'));
  const isAdmin = propIsAdmin ?? (!isSuperAdmin && !isStudent && !isTeacher && (user?.role === 'admin' || location.pathname.startsWith('/admin')));
  const sidebarWidth = (isAdmin || isSuperAdmin) ? '265px' : isTeacher ? '245px' : isStudent ? '250px' : (width || 'var(--sa-sidebar-width)');

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getNavLinks = () => {
    const role = user?.role || 'admin';

    // ONLY Super Admin gets the 10 items matching reference design
    if (isSuperAdmin || role === 'super-admin') {
      return [
        { label: 'Dashboard', path: '/super-admin/dashboard', icon: OverviewHomeIcon, matchPrefixes: ['/super-admin/dashboard'] },
        { label: 'Students', path: '/admin/students', icon: StudentsIcon, matchPrefixes: ['/admin/students'] },
        { label: 'Attendance', path: '/admin/attendance', icon: RfidAttendanceIcon, matchPrefixes: ['/admin/attendance'] },
        { label: 'Fees', path: '/admin/fees', icon: FeeRupeeIcon, matchPrefixes: ['/admin/fees'] },
        { label: 'Notes & Stock', path: '/admin/notes/stock', icon: NotesStockIcon, matchPrefixes: ['/admin/notes'] },
        { label: 'Examinations', path: '/admin/exams', icon: ExaminationsDocIcon, matchPrefixes: ['/admin/exams', '/admin/marks', '/admin/results'] },
        { label: 'Teachers', path: '/admin/teachers', icon: TeachersWritingIcon, matchPrefixes: ['/admin/teachers'] },
        { label: 'Leave Approvals', path: '/admin/teachers/leave-approvals', icon: Calendar, matchPrefixes: ['/admin/teachers/leave-approvals'] },
        { label: 'Batch Management', path: '/admin/batches', icon: BookOpen, matchPrefixes: ['/admin/batches'] },
        { label: 'Notifications', path: '/admin/notifications', icon: NotificationsBellIcon, matchPrefixes: ['/admin/notifications', '/admin/notices'] },
        { label: 'Reports', path: '/super-admin/reports', icon: ReportsBarIcon, matchPrefixes: ['/super-admin/reports'] },
        { label: 'Contact', path: '/super-admin/contact', icon: ContactPhoneIcon, matchPrefixes: ['/super-admin/contact', '/admin/contact'] },
      ];
    }

    // Teacher navigation
    if (isTeacher || role === 'teacher') {
      return [
        { label: 'Dashboard', path: '/teacher/dashboard', icon: LayoutDashboard },
        { label: 'My Classes', path: '/teacher/classes', icon: BookOpen },
        { label: 'Attendance', path: '/teacher/attendance', icon: CalendarCheck },
        { label: 'Leave Request', path: '/teacher/leave-request', icon: Calendar },
        { label: 'Students', path: '/teacher/students', icon: GraduationCap },
        { label: 'Examinations', path: '/teacher/exams', icon: BookCheck },
        { label: 'Enter Marks', path: '/teacher/marks', icon: ClipboardList },
        { label: 'Working Time', path: '/teacher/working-time', icon: Clock },
        { label: 'Study Materials', path: '/teacher/study-materials', icon: BookMarked },
        { label: 'Announcements', path: '/teacher/announcements', icon: Bell },
        { label: 'My Salary', path: '/teacher/salary', icon: CreditCard },
      ];
    }

    // Academy Admin matching reference screenshot + Contact
    if (isAdmin || role === 'admin') {
      return [
        { label: 'Overview', path: '/admin/dashboard', icon: OverviewHomeIcon, matchPrefixes: ['/admin/dashboard'] },
        { label: 'Admissions', path: '/admin/students/register', icon: AdmissionsIcon, matchPrefixes: ['/admin/students/register'] },
        { label: 'Students', path: '/admin/students', icon: StudentsIcon, matchPrefixes: ['/admin/students'] },
        { label: 'RFID Attendance', path: '/admin/attendance', icon: RfidAttendanceIcon, matchPrefixes: ['/admin/attendance'] },
        { label: 'Fee Collection', path: '/admin/fees', icon: FeeRupeeIcon, matchPrefixes: ['/admin/fees'] },
        { label: 'Notes & Stock', path: '/admin/notes/stock', icon: NotesStockIcon, matchPrefixes: ['/admin/notes'] },
        { label: 'Examinations', path: '/admin/exams', icon: ExaminationsDocIcon, matchPrefixes: ['/admin/exams', '/admin/marks', '/admin/results'] },
        { label: 'Teachers', path: '/admin/teachers', icon: TeachersWritingIcon, matchPrefixes: ['/admin/teachers'] },
        { label: 'Batch Management', path: '/admin/batches', icon: BookOpen, matchPrefixes: ['/admin/batches'] },
        { label: 'Leave Approvals', path: '/admin/teachers/leave-approvals', icon: Calendar, matchPrefixes: ['/admin/teachers/leave-approvals'] },
        { label: 'Notifications', path: '/admin/notifications', icon: NotificationsBellIcon, matchPrefixes: ['/admin/notifications', '/admin/notices'] },
        { label: 'Reports', path: '/admin/reports', icon: ReportsBarIcon, matchPrefixes: ['/admin/reports'] },
        { label: 'Contact', path: '/admin/contact', icon: ContactPhoneIcon, matchPrefixes: ['/admin/contact'] },
      ];
    }

    // Links for Student (My Profile accessible via top-right profile avatar)
    return [
      { label: 'Dashboard', path: '/student/dashboard', icon: Home },
      { label: 'My Classes', path: '/student/classes', icon: Users },
      { label: 'Attendance', path: '/student/attendance', icon: CalendarCheck },
      { label: 'Fees & Receipts', path: '/student/fees', icon: CreditCard },
      { label: 'Examinations', path: '/student/exams', icon: FileText },
      { label: 'Results', path: '/student/results', icon: BarChart3 },
      { label: 'Study Materials', path: '/student/study-materials', icon: BookOpen },
      { label: 'Notes Delivery', path: '/student/notes-delivery', icon: Cloud },
      { label: 'Announcements', path: '/student/announcements', icon: Megaphone },
    ];
  };

  const navLinks = getNavLinks();

  const isItemActive = (item) => {
    // If on registration/admission, activate Admissions, not Students
    if (item.path === '/admin/students') {
      return location.pathname.startsWith('/admin/students') && !location.pathname.startsWith('/admin/students/register');
    }
    if (item.matchPrefixes) {
      return item.matchPrefixes.some(prefix => location.pathname.startsWith(prefix));
    }
    if (isTeacher) {
      if (item.path === '/teacher/dashboard') {
        return location.pathname === '/teacher/dashboard' || location.pathname === '/teacher';
      }
      return location.pathname === item.path || location.pathname.startsWith(item.path + '/');
    }
    if (isStudent) {
      if (item.path === '/student/dashboard') {
        return location.pathname === '/student/dashboard' || location.pathname === '/student';
      }
      return location.pathname === item.path || location.pathname.startsWith(item.path + '/');
    }
    return location.pathname === item.path;
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="d-md-none position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50"
          style={{ zIndex: 1040 }}
          onClick={onClose}
        />
      )}

      <aside
        className={`d-flex flex-column text-white transition-all ${isOpen ? 'position-fixed top-0 start-0 h-100 shadow-lg' : 'd-none d-md-flex position-sticky top-0'
          }`}
        style={{
          width: sidebarWidth,
          minWidth: sidebarWidth,
          height: '100vh',
          background: (isSuperAdmin || isAdmin)
            ? 'linear-gradient(180deg, rgba(139, 18, 22, 0.76) 0%, rgba(98, 11, 14, 0.84) 40%, rgba(45, 6, 8, 0.92) 100%)'
            : (isStudent || isTeacher)
              ? 'linear-gradient(180deg, #8B1216 0%, #6E0B0F 100%)'
              : 'var(--sa-primary-red)',
          backdropFilter: (isSuperAdmin || isAdmin) ? 'blur(24px) saturate(190%)' : 'none',
          WebkitBackdropFilter: (isSuperAdmin || isAdmin) ? 'blur(24px) saturate(190%)' : 'none',
          zIndex: 1045,
          borderRight: (isSuperAdmin || isAdmin)
            ? '1px solid rgba(255, 255, 255, 0.18)'
            : '1px solid rgba(255,255,255,0.08)',
          boxShadow: (isSuperAdmin || isAdmin)
            ? '0 8px 32px 0 rgba(0, 0, 0, 0.38), inset 1px 0 1px 0 rgba(255, 255, 255, 0.16)'
            : (isStudent || isTeacher) ? '4px 0 20px rgba(0,0,0,0.18)' : '4px 0 20px rgba(0,0,0,0.15)',
          flexShrink: 0
        }}
      >
        {/* BRAND HEADER: Actual shubham-logo.png from assets for Admin, Super Admin, Student & Teacher */}
        {(isAdmin || isSuperAdmin || isStudent || isTeacher) ? (
          <div
            className="d-flex flex-column align-items-center text-center px-3 pt-4 pb-3 flex-shrink-0"
            style={(isSuperAdmin || isAdmin) ? {
              background: 'radial-gradient(ellipse at 50% 15%, rgba(255, 255, 255, 0.14), transparent 70%)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.12)'
            } : {}}
          >
            <img
              src="/assets/shubham-logo.png"
              alt="Shubham Academy"
              style={{
                width: '100%',
                maxWidth: (isStudent || isTeacher) ? '160px' : '175px',
                height: 'auto',
                maxHeight: (isAdmin || isSuperAdmin) ? '74px' : '76px',
                objectFit: 'contain',
                filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.30))'
              }}
            />
            <div
              className="text-white text-opacity-90 mt-1.5"
              style={{ fontSize: '0.75rem', letterSpacing: '0.03em', fontWeight: 400 }}
            >
              Education Builds Brighter Future
            </div>
            {/* Role Badge for Super Admin */}
            {isSuperAdmin && (
              <div
                className="d-flex align-items-center justify-content-center gap-1.5 mt-2.5 px-3 py-1.5 rounded-pill fw-bold text-uppercase w-100"
                style={{
                  fontSize: '0.74rem',
                  letterSpacing: '0.08em',
                  background: 'linear-gradient(135deg, rgba(217, 155, 38, 0.32) 0%, rgba(180, 83, 9, 0.40) 100%)',
                  border: '1px solid rgba(245, 169, 0, 0.50)',
                  color: '#FDE047',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.2)',
                  borderRadius: '9999px'
                }}
              >
                <Crown size={14} style={{ color: '#FDE047' }} />
                <span>SUPER ADMIN</span>
              </div>
            )}

            {/* Role Badge for Academy Admin */}
            {isAdmin && !isSuperAdmin && (
              <div
                className="d-flex align-items-center justify-content-center gap-1.5 mt-2.5 px-3 py-1.5 rounded-pill fw-bold text-uppercase w-100"
                style={{
                  fontSize: '0.74rem',
                  letterSpacing: '0.08em',
                  background: 'linear-gradient(135deg, rgba(217, 155, 38, 0.32) 0%, rgba(180, 83, 9, 0.40) 100%)',
                  border: '1px solid rgba(245, 169, 0, 0.50)',
                  color: '#FDE047',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.2)',
                  borderRadius: '9999px'
                }}
              >
                <Shield size={14} style={{ color: '#FDE047' }} />
                <span>ACADEMY ADMIN</span>
              </div>
            )}
          </div>
        ) : (
          <div
            className="d-flex align-items-center justify-content-center px-3 py-2 border-bottom border-white border-opacity-10"
            style={{ height: 'var(--sa-header-height)' }}
          >
            <img
              src="/assets/shubham-logo.png"
              alt="Shubham Academy"
              style={{ maxHeight: '42px', maxWidth: '100%', objectFit: 'contain' }}
            />
          </div>
        )}

        {/* User Role Tag - Hidden for Admin, Student, Super Admin & Teacher */}
        {!isAdmin && !isStudent && !isSuperAdmin && !isTeacher && (
          <div className="px-4 py-2 d-flex align-items-center justify-content-between">
            <span className="text-white small text-capitalize fw-bold">
              {user?.role?.replace('-', ' ')}
            </span>
            <span className="badge bg-success small py-1 px-2" style={{ fontSize: '0.65rem' }}>Active</span>
          </div>
        )}

        {/* NAV LINKS */}
        {(isAdmin || isSuperAdmin || isTeacher) ? (
          /* Admin, Super Admin & Teacher Nav Links matching reference design */
          <div
            className="flex-grow-1 overflow-y-auto no-scrollbar px-3 py-2 d-flex flex-column"
            style={{ gap: (isAdmin || isSuperAdmin) ? '9px' : isTeacher ? '6px' : '8px' }}
          >
            {navLinks.map((item) => {
              const Icon = item.icon;
              const active = isItemActive(item);

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className="d-flex align-items-center text-decoration-none transition-all"
                  style={{
                    backgroundColor: active
                      ? ((isSuperAdmin || isAdmin) ? 'rgba(255, 255, 255, 0.24)' : 'rgba(255, 255, 255, 0.18)')
                      : 'transparent',
                    border: active
                      ? ((isSuperAdmin || isAdmin) ? '1px solid rgba(255, 255, 255, 0.38)' : '1px solid rgba(255, 255, 255, 0.18)')
                      : '1px solid transparent',
                    color: active ? '#FFFFFF' : 'rgba(255, 255, 255, 0.92)',
                    fontWeight: active ? 600 : 500,
                    fontSize: (isAdmin || isSuperAdmin) ? '0.96rem' : isTeacher ? '0.92rem' : '0.95rem',
                    borderRadius: '12px',
                    boxShadow: active
                      ? ((isSuperAdmin || isAdmin)
                        ? '0 8px 24px -4px rgba(0, 0, 0, 0.35), inset 0 1px 2px rgba(255, 255, 255, 0.45), 0 0 12px rgba(255, 255, 255, 0.14)'
                        : '0 4px 15px rgba(0, 0, 0, 0.18)')
                      : 'none',
                    padding: (isAdmin || isSuperAdmin) ? '11px 16px' : isTeacher ? '8.5px 14px' : '10px 15px',
                    gap: (isAdmin || isSuperAdmin) ? '16px' : isTeacher ? '14px' : '15px',
                    backdropFilter: (isSuperAdmin || isAdmin) ? 'blur(14px)' : (active ? 'blur(8px)' : 'none')
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = (isSuperAdmin || isAdmin) ? 'rgba(255, 255, 255, 0.14)' : 'rgba(255, 255, 255, 0.09)';
                      if (isSuperAdmin || isAdmin) e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.22)';
                      e.currentTarget.style.color = '#FFFFFF';
                      if (isSuperAdmin || isAdmin) e.currentTarget.style.transform = 'translateX(3px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      if (isSuperAdmin || isAdmin) e.currentTarget.style.border = '1px solid transparent';
                      e.currentTarget.style.color = 'rgba(255, 255, 255, 0.92)';
                      if (isSuperAdmin || isAdmin) e.currentTarget.style.transform = 'translateX(0)';
                    }
                  }}
                >
                  <Icon size={isTeacher ? 20 : (isAdmin || isSuperAdmin) ? 21 : 21} className={active ? 'text-white' : 'text-white text-opacity-90'} />
                  <span style={{ letterSpacing: '0.01em', whiteSpace: 'nowrap' }}>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        ) : isStudent ? (
          /* Student Nav Links inspired by reference design */
          <div
            className="flex-grow-1 overflow-y-auto no-scrollbar px-3 py-2 d-flex flex-column"
            style={{ gap: '6px' }}
          >
            {navLinks.map((item) => {
              const Icon = item.icon;
              const active = isItemActive(item);

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/student/dashboard'}
                  onClick={onClose}
                  className="d-flex align-items-center text-decoration-none transition-all"
                  style={{
                    backgroundColor: active ? 'rgba(255, 255, 255, 0.17)' : 'transparent',
                    color: active ? '#FFFFFF' : 'rgba(255, 255, 255, 0.92)',
                    fontWeight: active ? 600 : 500,
                    fontSize: '0.93rem',
                    borderRadius: '10px',
                    boxShadow: active ? '0 4px 14px rgba(0, 0, 0, 0.12)' : 'none',
                    padding: '9px 14px',
                    gap: '14px',
                    backdropFilter: active ? 'blur(8px)' : 'none',
                    minHeight: '42px'
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.color = '#FFFFFF';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'rgba(255, 255, 255, 0.92)';
                    }
                  }}
                >
                  <span
                    className="d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: '22px', height: '22px' }}
                  >
                    <Icon size={20} className={active ? 'text-white' : 'text-white text-opacity-90'} />
                  </span>
                  <span style={{ letterSpacing: '0.01em', whiteSpace: 'nowrap' }}>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        ) : (
          /* Original Nav Links for Admin, Teacher */
          <div className="flex-grow-1 overflow-y-auto no-scrollbar px-2 py-2.5 d-flex flex-column gap-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `d-flex align-items-center justify-content-between px-2.5 py-2 rounded-2 text-white text-decoration-none transition-all ${isActive
                      ? 'bg-white text-sa-primary fw-bold shadow-sm'
                      : 'hover-sidebar-item text-opacity-90'
                    }`
                  }
                  style={({ isActive }) => ({
                    backgroundColor: isActive
                      ? '#FFFFFF'
                      : 'transparent',
                    color: isActive
                      ? 'var(--sa-primary-red)'
                      : 'rgba(255,255,255,0.92)',
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '0.84rem'
                  })}
                >
                  <div className="d-flex align-items-center gap-2.5">
                    <Icon size={17} />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight size={14} className="opacity-50" />
                </NavLink>
              );
            })}
          </div>
        )}

        {/* BOTTOM AREA */}
        {(isAdmin || isSuperAdmin || isTeacher) ? (
          <div className="flex-shrink-0 mt-auto">
            {/* Logout Button placed above the divider */}
            <div className="px-3 pt-2 pb-2">
              <button
                onClick={handleLogout}
                className="btn w-100 d-flex align-items-center justify-content-center gap-2 text-white border-0 transition-all shadow-sm"
                style={{
                  backgroundColor: (isSuperAdmin || isAdmin) ? 'rgba(255, 255, 255, 0.16)' : 'rgba(255, 255, 255, 0.12)',
                  border: (isSuperAdmin || isAdmin) ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid rgba(255, 255, 255, 0.14)',
                  fontSize: (isAdmin || isSuperAdmin) ? '0.92rem' : '0.90rem',
                  fontWeight: 500,
                  padding: (isAdmin || isSuperAdmin) ? '10px 16px' : '9px 14px',
                  borderRadius: '12px',
                  backdropFilter: 'blur(12px)',
                  boxShadow: (isSuperAdmin || isAdmin) ? '0 4px 16px rgba(0, 0, 0, 0.22), inset 0 1px 1px rgba(255, 255, 255, 0.25)' : 'none',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = (isSuperAdmin || isAdmin) ? 'rgba(255, 255, 255, 0.26)' : 'rgba(255, 255, 255, 0.22)';
                  e.currentTarget.style.borderColor = (isSuperAdmin || isAdmin) ? 'rgba(255, 255, 255, 0.35)' : 'rgba(255, 255, 255, 0.25)';
                  e.currentTarget.style.color = '#FFFFFF';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  if (isSuperAdmin || isAdmin) e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.28), inset 0 1px 1px rgba(255, 255, 255, 0.35)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = (isSuperAdmin || isAdmin) ? 'rgba(255, 255, 255, 0.16)' : 'rgba(255, 255, 255, 0.12)';
                  e.currentTarget.style.borderColor = (isSuperAdmin || isAdmin) ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.14)';
                  e.currentTarget.style.color = '#FFFFFF';
                  e.currentTarget.style.transform = 'translateY(0)';
                  if (isSuperAdmin || isAdmin) e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.22), inset 0 1px 1px rgba(255, 255, 255, 0.25)';
                }}
              >
                <LogOut size={17} />
                <span style={{ letterSpacing: '0.02em' }}>Logout</span>
              </button>
            </div>

            {/* Brand Motto */}
            <div className="px-3 pt-2.5 pb-3 text-center border-top border-white border-opacity-10">
              <div
                className="fw-bold text-white text-opacity-90"
                style={{ fontSize: '0.72rem', letterSpacing: '0.14em' }}
              >
                LEARN &nbsp;|&nbsp; GROW &nbsp;|&nbsp; SUCCEED
              </div>
            </div>
          </div>
        ) : isStudent ? (
          /* Student Footer with exact existing text: Sign Out & LEARN | GROW | SUCCEED */
          <div className="flex-shrink-0 mt-auto">
            {/* Student Sign Out Button */}
            <div className="px-3 pt-2 pb-2">
              <button
                onClick={handleLogout}
                className="btn w-100 d-flex align-items-center justify-content-center gap-2 text-white border-0 transition-all shadow-sm"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.12)',
                  fontSize: '0.90rem',
                  fontWeight: 500,
                  padding: '9px 14px',
                  borderRadius: '10px',
                  backdropFilter: 'blur(8px)',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.22)';
                  e.currentTarget.style.color = '#FFFFFF';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
                  e.currentTarget.style.color = '#FFFFFF';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <LogOut size={17} />
                <span style={{ letterSpacing: '0.02em' }}>Sign Out</span>
              </button>
            </div>

            {/* Student Brand Motto */}
            <div className="px-3 pt-2.5 pb-3 text-center border-top border-white border-opacity-10">
              <div
                className="fw-bold text-white text-opacity-90"
                style={{ fontSize: '0.72rem', letterSpacing: '0.14em' }}
              >
                LEARN &nbsp;|&nbsp; GROW &nbsp;|&nbsp; SUCCEED
              </div>
            </div>
          </div>
        ) : (
          /* Footer Brand Motto for Admin & Teacher */
          <div className="px-3 pt-3 pb-3 text-center border-top border-white border-opacity-10 mt-auto">
            <div
              className="fw-bold text-white text-opacity-90"
              style={{ fontSize: '0.72rem', letterSpacing: '0.14em' }}
            >
              LEARN &nbsp;|&nbsp; GROW &nbsp;|&nbsp; SUCCEED
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
