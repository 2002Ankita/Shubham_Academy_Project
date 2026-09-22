import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
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
  BookCheck
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getNavLinks = () => {
    const role = user?.role || 'admin';

    if (role === 'super-admin') {
      return [
        { label: 'System Dashboard', path: '/super-admin/dashboard', icon: LayoutDashboard },
        { label: 'Academies', path: '/super-admin/academies', icon: Building2 },
        { label: 'Users & Roles', path: '/super-admin/users', icon: Users },
        { label: 'Global Reports', path: '/super-admin/reports', icon: FileBarChart },
        { label: 'Audit Logs', path: '/super-admin/audit-logs', icon: ShieldAlert },
        { label: 'Platform Settings', path: '/super-admin/settings', icon: Settings },
      ];
    }

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
      ];
    }

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

    // student
    return [
      { label: 'Student Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
      { label: 'My Classes & Timetable', path: '/student/classes', icon: BookOpen },
      { label: 'Attendance Records', path: '/student/attendance', icon: CalendarCheck },
      { label: 'Fee Details & Receipts', path: '/student/fees', icon: CreditCard },
      { label: 'Exam Schedules', path: '/student/exams', icon: BookCheck },
      { label: 'My Results & Rank', path: '/student/results', icon: Award },
      { label: 'Study Materials', path: '/student/study-materials', icon: BookMarked },
      { label: 'Notes Book Delivery', path: '/student/notes-delivery', icon: Truck },
      { label: 'Announcements', path: '/student/announcements', icon: Bell },
      { label: 'Student Profile', path: '/student/profile', icon: UserCheck2 },
    ];
  };

  const navLinks = getNavLinks();

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
        className={`d-flex flex-column position-fixed top-0 start-0 h-100 text-white transition-all ${
          isOpen ? 'translate-middle-x-none' : 'd-none d-md-flex'
        }`}
        style={{
          width: 'var(--sa-sidebar-width)',
          backgroundColor: 'var(--sa-primary-red)',
          zIndex: 1045,
          borderRight: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '4px 0 20px rgba(0,0,0,0.15)'
        }}
      >
        {/* Brand Header */}
        <div className="d-flex align-items-center justify-content-center px-3 py-2 border-bottom border-white border-opacity-10" style={{ height: 'var(--sa-header-height)' }}>
          <img
            src="/assets/shubham-logo.png"
            alt="Shubham Academy"
            style={{ maxHeight: '46px', maxWidth: '100%', objectFit: 'contain' }}
          />
        </div>

        {/* User Role Tag */}
        <div className="px-4 py-2 bg-black bg-opacity-15 d-flex align-items-center justify-content-between">
          <span className="text-white text-opacity-75 small text-capitalize fw-medium">
            Role: <strong className="text-warning">{user?.role?.replace('-', ' ')}</strong>
          </span>
          <span className="badge bg-success small py-1 px-2" style={{ fontSize: '0.65rem' }}>Active</span>
        </div>

        {/* Nav Links */}
        <div className="flex-grow-1 overflow-y-auto px-3 py-3 d-flex flex-column gap-1">
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `d-flex align-items-center justify-content-between px-3 py-2 rounded-3 text-white text-decoration-none transition-all ${
                    isActive
                      ? 'bg-white text-sa-primary fw-bold shadow-sm'
                      : 'hover-sidebar-item text-opacity-85'
                  }`
                }
                style={({ isActive }) => ({
                  backgroundColor: isActive ? '#FFFFFF' : 'transparent',
                  color: isActive ? 'var(--sa-primary-red)' : 'rgba(255,255,255,0.92)',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.88rem'
                })}
              >
                <div className="d-flex align-items-center gap-3">
                  <Icon size={18} />
                  <span>{item.label}</span>
                </div>
                <ChevronRight size={14} className="opacity-50" />
              </NavLink>
            );
          })}
        </div>

        {/* Footer Logout Action */}
        <div className="p-3 border-top border-white border-opacity-10 bg-black bg-opacity-20">
          <button
            onClick={handleLogout}
            className="btn btn-outline-light w-100 btn-sm d-flex align-items-center justify-content-center gap-2 py-2 rounded-3"
            style={{ fontSize: '0.85rem' }}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
