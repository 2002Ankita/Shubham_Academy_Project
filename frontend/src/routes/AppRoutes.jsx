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
import Register from '../pages/auth/Register';
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
import SuperAdminContact from '../pages/super-admin/Contact';
import DiscountApprovals from '../pages/admin/DiscountApprovals';

// Academy Admin Pages
import AdminDashboard from '../pages/admin/Dashboard';
import StudentList from '../pages/admin/StudentList';
import StudentRegistration from '../pages/admin/StudentRegistration';
import StudentDetails from '../pages/admin/StudentDetails';
import TeacherList from '../pages/admin/TeacherList';
import AddTeacher from '../pages/admin/AddTeacher';
import TeacherSalary from '../pages/admin/TeacherSalary';
import RFIDAttendance from '../pages/admin/RFIDAttendance';
import TeacherAttendanceTracker from '../pages/admin/TeacherAttendanceTracker';
import AttendanceReport from '../pages/admin/AttendanceReport';
import FeeCollection from '../pages/admin/FeeCollection';
import PendingFees from '../pages/admin/PendingFees';
import FeeReceipt from '../pages/admin/FeeReceipt';
import FeeStructure from '../pages/admin/FeeStructure';
import FeeReceiptsList from '../pages/admin/FeeReceiptsList';
import FeeReminderSettings from '../pages/admin/FeeReminderSettings';
import FeeReminderHistory from '../pages/admin/FeeReminderHistory';
import CreateExam from '../pages/admin/CreateExam';
import MarksEntry from '../pages/admin/MarksEntry';
import Results from '../pages/admin/Results';
import BooksStock from '../pages/admin/BooksStock';
import BooksDelivery from '../pages/admin/BooksDelivery';
import Notices from '../pages/admin/Notices';
import Notifications from '../pages/admin/Notifications';
import AdminReports from '../pages/admin/Reports';
import LeaveApprovals from '../pages/admin/LeaveApprovals';
import AdminProfile from '../pages/admin/Profile';
import BatchManagement from '../pages/admin/BatchManagement';
import AdminTopicDurationReport from '../pages/admin/TopicDurationReport';

// Teacher Pages
import TeacherDashboard from '../pages/teacher/Dashboard';
import TeacherMyClasses from '../pages/teacher/MyClasses';
import TeacherStudents from '../pages/teacher/Students';
import TeacherDirectory from '../pages/teacher/Teachers';
import TeacherAttendance from '../pages/teacher/Attendance';
import TeacherExaminations from '../pages/teacher/Examinations';
import TeacherEnterMarks from '../pages/teacher/EnterMarks';
import TeacherStudyMaterials from '../pages/teacher/StudyMaterials';
import TeacherNotes from '../pages/teacher/Notes';
import TeacherAnnouncements from '../pages/teacher/Announcements';
import TeacherProfile from '../pages/teacher/Profile';
import TeacherDailyActivityReport from '../pages/teacher/DailyActivityReport';
import TeacherTopicDurationPlanner from '../pages/teacher/TopicDurationPlanner';
import LeaveRequest from '../pages/LeaveRequest';
import WorkingTime from '../pages/WorkingTime';
import Salary from '../pages/Salary';

// Student Pages
import StudentDashboard from '../pages/student/Dashboard';
import StudentMyClasses from '../pages/student/MyClasses';
import StudentAttendance from '../pages/student/Attendance';
import StudentFees from '../pages/student/Fees';
import StudentExaminations from '../pages/student/Examinations';
import StudentResults from '../pages/student/Results';
import StudentStudyMaterials from '../pages/student/StudyMaterials';
import StudentNotes from '../pages/student/Notes';
import StudentBooksDelivery from '../pages/student/BooksDelivery';
import StudentAnnouncements from '../pages/student/Announcements';
import StudentProfile from '../pages/student/Profile';
import StudentContact from '../pages/student/Contact';

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
        <Route path="/register" element={<Register />} />
        <Route path="/signup" element={<Register />} />
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
        <Route path="/super-admin/admins" element={<SuperAdminUsers />} />
        <Route path="/super-admin/users" element={<SuperAdminUsers />} />
        <Route path="/super-admin/subscriptions" element={<SuperAdminReports />} />
        <Route path="/super-admin/payments" element={<SuperAdminReports />} />
        <Route path="/super-admin/reports" element={<SuperAdminReports />} />
        <Route path="/super-admin/audit-logs" element={<AuditLogs />} />
        <Route path="/super-admin/settings" element={<SuperAdminSettings />} />
        <Route path="/super-admin/profile" element={<SuperAdminSettings />} />
        <Route path="/super-admin/contact" element={<SuperAdminContact />} />
        <Route path="/super-admin/discounts" element={<DiscountApprovals />} />
        <Route path="/super-admin/discount-approvals" element={<DiscountApprovals />} />
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
        <Route path="/admin/batches" element={<BatchManagement />} />
        <Route path="/admin/students" element={<StudentList />} />
        <Route path="/admin/students/register" element={<StudentRegistration />} />
        <Route path="/admin/students/:id" element={<StudentDetails />} />
        <Route path="/admin/teachers" element={<TeacherList />} />
        <Route path="/admin/teachers/add" element={<AddTeacher />} />
        <Route path="/admin/teachers/salary" element={<TeacherSalary />} />
        <Route path="/admin/teachers/attendance" element={<TeacherAttendanceTracker />} />
        <Route path="/admin/teachers/leave-approvals" element={<LeaveApprovals />} />
        <Route path="/admin/teachers/:id/working-time" element={<WorkingTime />} />
        <Route path="/admin/attendance" element={<RFIDAttendance />} />
        <Route path="/admin/attendance/report" element={<AttendanceReport />} />
        <Route path="/admin/fees" element={<FeeCollection />} />
        <Route path="/admin/fees/structure" element={<FeeStructure />} />
        <Route path="/admin/fees/pending" element={<PendingFees />} />
        <Route path="/admin/fees/receipts" element={<FeeReceiptsList />} />
        <Route path="/admin/fees/receipt" element={<FeeReceipt />} />
        <Route path="/admin/discounts" element={<DiscountApprovals />} />
        <Route path="/admin/discount-approvals" element={<DiscountApprovals />} />
        <Route path="/admin/fees/reminder-settings" element={<FeeReminderSettings />} />
        <Route path="/admin/fees/reminders/settings" element={<FeeReminderSettings />} />
        <Route path="/admin/fees/reminder-history" element={<FeeReminderHistory />} />
        <Route path="/admin/fees/reminders/history" element={<FeeReminderHistory />} />
        <Route path="/admin/exams" element={<CreateExam />} />
        <Route path="/admin/marks/entry" element={<MarksEntry />} />
        <Route path="/admin/results" element={<Results />} />
        <Route path="/admin/notes" element={<TeacherNotes />} />
        <Route path="/admin/books/stock" element={<BooksStock />} />
        <Route path="/admin/books-stock" element={<BooksStock />} />
        <Route path="/admin/notes/stock" element={<BooksStock />} />
        <Route path="/admin/books/delivery" element={<BooksDelivery />} />
        <Route path="/admin/books-delivery" element={<BooksDelivery />} />
        <Route path="/admin/notes/delivery" element={<BooksDelivery />} />
        <Route path="/admin/notices" element={<Notices />} />
        <Route path="/admin/notifications" element={<Notifications />} />
        <Route path="/admin/reports" element={<AdminReports />} />
        <Route path="/admin/topic-duration" element={<AdminTopicDurationReport />} />
        <Route path="/admin/curriculum-matrix" element={<AdminTopicDurationReport />} />
        <Route path="/admin/contact" element={<SuperAdminContact />} />
        <Route path="/admin/profile" element={<AdminProfile />} />
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
        <Route path="/teacher/teachers" element={<TeacherDirectory />} />
        <Route path="/teacher/attendance" element={<TeacherAttendance />} />
        <Route path="/teacher/daily-activity" element={<TeacherDailyActivityReport />} />
        <Route path="/teacher/topic-duration" element={<TeacherTopicDurationPlanner />} />
        <Route path="/teacher/topic-pacing" element={<TeacherTopicDurationPlanner />} />
        <Route path="/teacher/leave-request" element={<LeaveRequest />} />
        <Route path="/teacher/working-time" element={<WorkingTime />} />
        <Route path="/teacher/salary" element={<Salary />} />
        <Route path="/teacher/exams" element={<TeacherExaminations />} />
        <Route path="/teacher/marks" element={<TeacherEnterMarks />} />
        <Route path="/teacher/study-materials" element={<TeacherStudyMaterials />} />
        <Route path="/teacher/notes" element={<TeacherNotes />} />
        <Route path="/teacher/books/stock" element={<BooksStock />} />
        <Route path="/teacher/books-stock" element={<BooksStock />} />
        <Route path="/teacher/notes/stock" element={<BooksStock />} />
        <Route path="/teacher/notes-stock" element={<BooksStock />} />
        <Route path="/teacher/books/delivery" element={<BooksDelivery />} />
        <Route path="/teacher/books-delivery" element={<BooksDelivery />} />
        <Route path="/teacher/notes-delivery" element={<BooksDelivery />} />
        <Route path="/teacher/notes/delivery" element={<BooksDelivery />} />
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
        <Route path="/student/notes" element={<StudentNotes />} />
        <Route path="/student/books-delivery" element={<StudentBooksDelivery />} />
        <Route path="/student/books/delivery" element={<StudentBooksDelivery />} />
        <Route path="/student/notes-delivery" element={<StudentBooksDelivery />} />
        <Route path="/student/announcements" element={<StudentAnnouncements />} />
        <Route path="/student/profile" element={<StudentProfile />} />
        <Route path="/student/contact" element={<StudentContact />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
