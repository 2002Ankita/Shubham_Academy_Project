import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// Layouts
import DashboardLayout from '../components/layout/DashboardLayout';
import AuthLayout from '../components/layout/AuthLayout';

// Protection
import ProtectedRoute from './ProtectedRoute';
import RoleBasedRoute from './RoleBasedRoute';

// Auth Pages
import SignIn from '../pages/auth/SignIn';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';
import Unauthorized from '../pages/auth/Unauthorized';

// Super Admin Pages
import SuperAdminDashboard from '../pages/super-admin/Dashboard';
import Academies from '../pages/super-admin/Academies';
import SuperAdminUsers from '../pages/super-admin/Users';
import SuperAdminReports from '../pages/super-admin/Reports';
import AuditLogs from '../pages/super-admin/AuditLogs';
import SuperAdminSettings from '../pages/super-admin/Settings';

// Academy Admin Pages
import AdminDashboard from '../pages/admin/Dashboard';
import StudentList from '../pages/admin/StudentList';
import StudentRegistration from '../pages/admin/StudentRegistration';
import StudentDetails from '../pages/admin/StudentDetails';
import TeacherList from '../pages/admin/TeacherList';
import AddTeacher from '../pages/admin/AddTeacher';
import TeacherSalary from '../pages/admin/TeacherSalary';
import RFIDAttendance from '../pages/admin/RFIDAttendance';
import AttendanceReport from '../pages/admin/AttendanceReport';
import FeeCollection from '../pages/admin/FeeCollection';
import PendingFees from '../pages/admin/PendingFees';
import FeeReceipt from '../pages/admin/FeeReceipt';
import CreateExam from '../pages/admin/CreateExam';
import MarksEntry from '../pages/admin/MarksEntry';
import Results from '../pages/admin/Results';
import NotesStock from '../pages/admin/NotesStock';
import NotesDelivery from '../pages/admin/NotesDelivery';
import Notices from '../pages/admin/Notices';
import Notifications from '../pages/admin/Notifications';
import AdminReports from '../pages/admin/Reports';

// Teacher Pages
import TeacherDashboard from '../pages/teacher/Dashboard';
import TeacherMyClasses from '../pages/teacher/MyClasses';
import TeacherStudents from '../pages/teacher/Students';
import TeacherAttendance from '../pages/teacher/Attendance';
import TeacherExaminations from '../pages/teacher/Examinations';
import TeacherEnterMarks from '../pages/teacher/EnterMarks';
import TeacherStudyMaterials from '../pages/teacher/StudyMaterials';
import TeacherAnnouncements from '../pages/teacher/Announcements';
import TeacherProfile from '../pages/teacher/Profile';

// Student Pages
import StudentDashboard from '../pages/student/Dashboard';
import StudentMyClasses from '../pages/student/MyClasses';
import StudentAttendance from '../pages/student/Attendance';
import StudentFees from '../pages/student/Fees';
import StudentExaminations from '../pages/student/Examinations';
import StudentResults from '../pages/student/Results';
import StudentStudyMaterials from '../pages/student/StudyMaterials';
import StudentNotesDelivery from '../pages/student/NotesDelivery';
import StudentAnnouncements from '../pages/student/Announcements';
import StudentProfile from '../pages/student/Profile';

export default function AppRoutes() {
  const { user } = useAuth();

  const getRootRedirect = () => {
    if (!user) return '/login';
    if (user.role === 'super-admin') return '/super-admin/dashboard';
    if (user.role === 'admin') return '/admin/dashboard';
    if (user.role === 'teacher') return '/teacher/dashboard';
    return '/student/dashboard';
  };

  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<Navigate to={getRootRedirect()} replace />} />

      {/* Public Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<SignIn />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Route>

      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Super Admin Protected Routes */}
      <Route
        element={
          <RoleBasedRoute allowedRoles={['super-admin']}>
            <DashboardLayout />
          </RoleBasedRoute>
        }
      >
        <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
        <Route path="/super-admin/academies" element={<Academies />} />
        <Route path="/super-admin/users" element={<SuperAdminUsers />} />
        <Route path="/super-admin/reports" element={<SuperAdminReports />} />
        <Route path="/super-admin/audit-logs" element={<AuditLogs />} />
        <Route path="/super-admin/settings" element={<SuperAdminSettings />} />
      </Route>

      {/* Academy Admin & Super Admin Protected Routes */}
      <Route
        element={
          <RoleBasedRoute allowedRoles={['admin', 'super-admin']}>
            <DashboardLayout />
          </RoleBasedRoute>
        }
      >
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/students" element={<StudentList />} />
        <Route path="/admin/students/register" element={<StudentRegistration />} />
        <Route path="/admin/students/:id" element={<StudentDetails />} />
        <Route path="/admin/teachers" element={<TeacherList />} />
        <Route path="/admin/teachers/add" element={<AddTeacher />} />
        <Route path="/admin/teachers/salary" element={<TeacherSalary />} />
        <Route path="/admin/attendance" element={<RFIDAttendance />} />
        <Route path="/admin/attendance/report" element={<AttendanceReport />} />
        <Route path="/admin/fees" element={<FeeCollection />} />
        <Route path="/admin/fees/pending" element={<PendingFees />} />
        <Route path="/admin/fees/receipt" element={<FeeReceipt />} />
        <Route path="/admin/exams" element={<CreateExam />} />
        <Route path="/admin/marks/entry" element={<MarksEntry />} />
        <Route path="/admin/results" element={<Results />} />
        <Route path="/admin/notes/stock" element={<NotesStock />} />
        <Route path="/admin/notes/delivery" element={<NotesDelivery />} />
        <Route path="/admin/notices" element={<Notices />} />
        <Route path="/admin/notifications" element={<Notifications />} />
        <Route path="/admin/reports" element={<AdminReports />} />
      </Route>

      {/* Teacher Protected Routes */}
      <Route
        element={
          <RoleBasedRoute allowedRoles={['teacher']}>
            <DashboardLayout />
          </RoleBasedRoute>
        }
      >
        <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
        <Route path="/teacher/classes" element={<TeacherMyClasses />} />
        <Route path="/teacher/students" element={<TeacherStudents />} />
        <Route path="/teacher/attendance" element={<TeacherAttendance />} />
        <Route path="/teacher/exams" element={<TeacherExaminations />} />
        <Route path="/teacher/marks" element={<TeacherEnterMarks />} />
        <Route path="/teacher/study-materials" element={<TeacherStudyMaterials />} />
        <Route path="/teacher/announcements" element={<TeacherAnnouncements />} />
        <Route path="/teacher/profile" element={<TeacherProfile />} />
      </Route>

      {/* Student Protected Routes */}
      <Route
        element={
          <RoleBasedRoute allowedRoles={['student']}>
            <DashboardLayout />
          </RoleBasedRoute>
        }
      >
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/classes" element={<StudentMyClasses />} />
        <Route path="/student/attendance" element={<StudentAttendance />} />
        <Route path="/student/fees" element={<StudentFees />} />
        <Route path="/student/exams" element={<StudentExaminations />} />
        <Route path="/student/results" element={<StudentResults />} />
        <Route path="/student/study-materials" element={<StudentStudyMaterials />} />
        <Route path="/student/notes-delivery" element={<StudentNotesDelivery />} />
        <Route path="/student/announcements" element={<StudentAnnouncements />} />
        <Route path="/student/profile" element={<StudentProfile />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
