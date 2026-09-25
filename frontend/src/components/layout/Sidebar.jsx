import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard,
  Building2,
  Users,
  FileBarChart,
  ShieldAlert,
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
  PhoneCall
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

export default function Sidebar({ isOpen, onClose, width, isStudent: propIsStudent, isSuperAdmin: propIsSuperAdmin }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isSuperAdmin = propIsSuperAdmin ?? (user?.role === 'super-admin' || location.pathname.startsWith('/super-admin'));
  const isStudent = propIsStudent ?? (user?.role === 'student' || location.pathname.startsWith('/student'));
  const sidebarWidth = isStudent ? '250px' : (isSuperAdmin ? '245px' : (width || 'var(--sa-sidebar-width)'));

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getNavLinks = () => {
    const role = user?.role || 'admin';

    // ONLY Super Admin gets the 9 items matching reference screenshot
    if (isSuperAdmin || role === 'super-admin') {
      return [
        { label: 'Dashboard', path: '/super-admin/dashboard', icon: Home, matchPrefixes: ['/super-admin/dashboard'] },
        { label: 'Students', path: '/admin/students', icon: Users, matchPrefixes: ['/admin/students'] },
        { label: 'Attendance', path: '/admin/attendance', icon: CalendarCheck, matchPrefixes: ['/admin/attendance'] },
        { label: 'Fees', path: '/admin/fees', icon: IndianRupee, matchPrefixes: ['/admin/fees'] },
        { label: 'Notes & Stock', path: '/admin/notes/stock', icon: Package, matchPrefixes: ['/admin/notes'] },
        { label: 'Examinations', path: '/admin/exams', icon: FileText, matchPrefixes: ['/admin/exams', '/admin/marks', '/admin/results'] },
        { label: 'Teachers', path: '/admin/teachers', icon: TeacherPenIcon, matchPrefixes: ['/admin/teachers'] },
        { label: 'Notifications', path: '/admin/notifications', icon: Bell, matchPrefixes: ['/admin/notifications', '/admin/notices'] },
        { label: 'Reports', path: '/super-admin/reports', icon: BarChart3, matchPrefixes: ['/super-admin/reports'] },
        { label: 'Contact', path: '/super-admin/contact', icon: PhoneCall, matchPrefixes: ['/super-admin/contact', '/admin/contact'] },
      ];
    }

    // Unchanged original links for Admin
    if (role === 'admin') {
      return [
        { label: 'Academy Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { label: 'Student Directory', path: '/admin/students', icon: GraduationCap },
        { label: 'Register Student', path: '/admin/students/register', icon: UserCheck },
        { label: 'Teacher Directory', path: '/admin/teachers', icon: Users },
        { label: 'Teacher Salary', path: '/admin/teachers/salary', icon: CreditCard },
        { label: 'RFID Attendance', path: '/admin/attendance', icon: CalendarCheck },
        { label: 'Attendance Reports', path: '/admin/attendance/report', icon: FileBarChart },
        { label: 'Fee Collection', path: '/admin/fees', icon: CreditCard },
        { label: 'Examination Mgmt', path: '/admin/exams', icon: BookCheck },
        { label: 'Marks Entry', path: '/admin/marks/entry', icon: ClipboardList },
        { label: 'Results & Rankings', path: '/admin/results', icon: Award },
        { label: 'Notes Stock', path: '/admin/notes/stock', icon: BookMarked },
        { label: 'Notes Delivery', path: '/admin/notes/delivery', icon: Truck },
        { label: 'Notices Board', path: '/admin/notices', icon: Bell },
        { label: 'Academy Reports', path: '/admin/reports', icon: FileBarChart },
        { label: 'Contact', path: '/admin/contact', icon: PhoneCall, matchPrefixes: ['/admin/contact', '/super-admin/contact'] },
      ];
    }

    // Unchanged original links for Teacher
    if (role === 'teacher') {
      return [
        { label: 'Teacher Dashboard', path: '/teacher/dashboard', icon: LayoutDashboard },
        { label: 'My Classes', path: '/teacher/classes', icon: BookOpen },
        { label: 'Students', path: '/teacher/students', icon: GraduationCap },
        { label: 'Class Attendance', path: '/teacher/attendance', icon: CalendarCheck },
        { label: 'Examinations', path: '/teacher/exams', icon: BookCheck },
        { label: 'Enter Marks', path: '/teacher/marks', icon: ClipboardList },
        { label: 'Study Materials', path: '/teacher/study-materials', icon: BookMarked },
        { label: 'Announcements', path: '/teacher/announcements', icon: Bell },
        { label: 'My Profile', path: '/teacher/profile', icon: UserCheck2 },
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
    if (item.matchPrefixes) {
      return item.matchPrefixes.some(prefix => location.pathname.startsWith(prefix));
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
        className={`d-flex flex-column text-white transition-all ${
          isOpen ? 'position-fixed top-0 start-0 h-100 shadow-lg' : 'd-none d-md-flex position-sticky top-0'
        }`}
        style={{
          width: sidebarWidth,
          minWidth: sidebarWidth,
          height: '100vh',
          background: (isSuperAdmin || isStudent)
            ? 'linear-gradient(180deg, #8B1216 0%, #6E0B0F 100%)'
            : 'var(--sa-primary-red)',
          zIndex: 1045,
          borderRight: '1px solid rgba(255,255,255,0.08)',
          boxShadow: (isSuperAdmin || isStudent) ? '4px 0 20px rgba(0,0,0,0.18)' : '4px 0 20px rgba(0,0,0,0.15)',
          flexShrink: 0
        }}
      >
        {/* BRAND HEADER: Actual shubham-logo.png from assets for Super Admin & Student, Original for other roles */}
        {(isSuperAdmin || isStudent) ? (
          <div className="d-flex flex-column align-items-center text-center px-3 pt-3.5 pb-2.5 flex-shrink-0">
            <img
              src="/assets/shubham-logo.png"
              alt="Shubham Academy"
              style={{
                width: '100%',
                maxWidth: isStudent ? '170px' : '180px',
                height: 'auto',
                maxHeight: isStudent ? '75px' : '82px',
                objectFit: 'contain',
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.25))'
              }}
            />
            <div
              className="text-white text-opacity-90 mt-1.5"
              style={{ fontSize: '0.74rem', letterSpacing: '0.02em', fontWeight: 400 }}
            >
              Education Builds Brighter Future
            </div>
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

        {/* User Role Tag - Hidden for Student & Super Admin */}
        {!isStudent && !isSuperAdmin && (
          <div className="px-4 py-2 bg-black bg-opacity-15 d-flex align-items-center justify-content-between">
            <span className="text-white text-opacity-75 small text-capitalize fw-medium">
              Role: <strong className="text-warning">{user?.role?.replace('-', ' ')}</strong>
            </span>
            <span className="badge bg-success small py-1 px-2" style={{ fontSize: '0.65rem' }}>Active</span>
          </div>
        )}

        {/* NAV LINKS */}
        {isSuperAdmin ? (
          /* Super Admin Nav Links matching reference image */
          <div className="flex-grow-1 overflow-y-auto px-3 py-2 d-flex flex-column gap-1.5">
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
                    backgroundColor: active ? 'rgba(255, 255, 255, 0.17)' : 'transparent',
                    color: active ? '#FFFFFF' : 'rgba(255, 255, 255, 0.92)',
                    fontWeight: active ? 600 : 500,
                    fontSize: '0.95rem',
                    borderRadius: '10px',
                    boxShadow: active ? '0 4px 14px rgba(0, 0, 0, 0.12)' : 'none',
                    padding: '9.5px 15px',
                    gap: '15px',
                    backdropFilter: active ? 'blur(8px)' : 'none'
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
                  <Icon size={21} className={active ? 'text-white' : 'text-white text-opacity-90'} />
                  <span style={{ letterSpacing: '0.01em' }}>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        ) : isStudent ? (
          /* Student Nav Links inspired by reference design */
          <div
            className="flex-grow-1 overflow-y-auto px-3 py-2 d-flex flex-column"
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
          <div className="flex-grow-1 overflow-y-auto px-2 py-2.5 d-flex flex-column gap-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `d-flex align-items-center justify-content-between px-2.5 py-2 rounded-2 text-white text-decoration-none transition-all ${
                      isActive
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
        {isSuperAdmin ? (
          <>
            {/* Super Admin Logout Button placed up above the divider */}
            <div className="px-3 pt-2 pb-2 flex-shrink-0">
              <button
                onClick={handleLogout}
                className="btn w-100 d-flex align-items-center justify-content-center gap-2 text-white border-0 transition-all shadow-sm"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.12)',
                  fontSize: '0.90rem',
                  fontWeight: 500,
                  padding: '9.5px 15px',
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
                <span style={{ letterSpacing: '0.02em' }}>Logout</span>
              </button>
            </div>

            {/* Super Admin Brand Motto */}
            <div className="px-3 pt-3 pb-3 text-center flex-shrink-0 border-top border-white border-opacity-10">
              <div
                className="fw-bold text-white text-opacity-90"
                style={{ fontSize: '0.72rem', letterSpacing: '0.14em' }}
              >
                LEARN &nbsp;|&nbsp; GROW &nbsp;|&nbsp; SUCCEED
              </div>
              <div
                className="mx-auto mt-2 rounded-pill"
                style={{
                  width: '48px',
                  height: '3px',
                  backgroundColor: 'var(--sa-mustard-yellow)'
                }}
              />
            </div>
          </>
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
              <div
                className="mx-auto mt-1.5 rounded-pill"
                style={{
                  width: '44px',
                  height: '3px',
                  backgroundColor: 'var(--sa-mustard-yellow)'
                }}
              />
            </div>
          </div>
        ) : (
          /* Original Footer Logout Action for Admin & Teacher */
          <div className="p-2.5 border-top border-white border-opacity-10 bg-black bg-opacity-20">
            <button
              onClick={handleLogout}
              className="btn btn-outline-light w-100 btn-sm d-flex align-items-center justify-content-center gap-2 py-1.5 rounded-2"
              style={{ fontSize: '0.82rem' }}
            >
              <LogOut size={15} />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
