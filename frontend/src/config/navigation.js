import {
  LayoutDashboard,
  Users,
  UserCheck,
  BookOpen,
  CalendarCheck,
  CreditCard,
  FileBarChart,
  BookMarked,
  Truck,
  BookCheck,
  ClipboardList,
  Award,
  Calendar,
  Bell,
  PhoneCall,
  GraduationCap,
  Building2
} from 'lucide-react';

export const navigationConfig = {
  superAdmin: [
    { label: 'Platform Overview', path: '/super-admin/dashboard', icon: LayoutDashboard, matchPrefixes: ['/super-admin/dashboard'] },
    { label: 'Academies', path: '/super-admin/academies', icon: Building2, matchPrefixes: ['/super-admin/academies'] },
    { label: 'Platform Users', path: '/super-admin/users', icon: Users, matchPrefixes: ['/super-admin/users'] },
    { label: 'Audit Logs', path: '/super-admin/audit-logs', icon: FileBarChart, matchPrefixes: ['/super-admin/audit-logs'] },
    { label: 'Settings', path: '/super-admin/settings', icon: FileBarChart, matchPrefixes: ['/super-admin/settings'] },
    { label: 'Students', path: '/admin/students', icon: GraduationCap, matchPrefixes: ['/admin/students'] },
    { label: 'Batch Management', path: '/admin/batches', icon: BookOpen, matchPrefixes: ['/admin/batches'] },
    { label: 'RFID Attendance', path: '/admin/attendance', icon: CalendarCheck, matchPrefixes: ['/admin/attendance'] },
    { label: 'Attendance Reports', path: '/admin/attendance/report', icon: FileBarChart, matchPrefixes: ['/admin/attendance/report'] },
    { label: 'Fee Collection', path: '/admin/fees', icon: CreditCard, matchPrefixes: ['/admin/fees'] },
    { label: 'Notes & Stock', path: '/admin/notes/stock', icon: BookMarked, matchPrefixes: ['/admin/notes/stock'] },
    { label: 'Notes Delivery', path: '/admin/notes/delivery', icon: Truck, matchPrefixes: ['/admin/notes/delivery'] },
    { label: 'Examinations', path: '/admin/exams', icon: BookCheck, matchPrefixes: ['/admin/exams'] },
    { label: 'Marks Entry', path: '/admin/marks/entry', icon: ClipboardList, matchPrefixes: ['/admin/marks/entry'] },
    { label: 'Results & Rankings', path: '/admin/results', icon: Award, matchPrefixes: ['/admin/results'] },
    { label: 'Teachers', path: '/admin/teachers', icon: Users, matchPrefixes: ['/admin/teachers'] },
    { label: 'Teacher Salary', path: '/admin/teachers/salary', icon: CreditCard, matchPrefixes: ['/admin/teachers/salary'] },
    { label: 'Leave Approvals', path: '/admin/teachers/leave-approvals', icon: Calendar, matchPrefixes: ['/admin/teachers/leave-approvals'] },
    { label: 'Notifications', path: '/admin/notifications', icon: Bell, matchPrefixes: ['/admin/notifications'] },
    { label: 'Notices Board', path: '/admin/notices', icon: Bell, matchPrefixes: ['/admin/notices'] },
    { label: 'Reports', path: '/super-admin/reports', icon: FileBarChart, matchPrefixes: ['/super-admin/reports'] },
    { label: 'Contact', path: '/super-admin/contact', icon: PhoneCall, matchPrefixes: ['/super-admin/contact', '/admin/contact'] },
  ],
  admin: [
    { label: 'Overview', path: '/admin/dashboard', icon: LayoutDashboard, matchPrefixes: ['/admin/dashboard'] },
    { label: 'Admissions', path: '/admin/students/register', icon: UserCheck, matchPrefixes: ['/admin/students/register'] },
    { label: 'Students', path: '/admin/students', icon: GraduationCap, matchPrefixes: ['/admin/students'] },
    { label: 'Batch Management', path: '/admin/batches', icon: BookOpen, matchPrefixes: ['/admin/batches'] },
    { label: 'RFID Attendance', path: '/admin/attendance', icon: CalendarCheck, matchPrefixes: ['/admin/attendance'] },
    { label: 'Attendance Reports', path: '/admin/attendance/report', icon: FileBarChart, matchPrefixes: ['/admin/attendance/report'] },
    { label: 'Fee Collection', path: '/admin/fees', icon: CreditCard, matchPrefixes: ['/admin/fees'] },
    { label: 'Notes & Stock', path: '/admin/notes/stock', icon: BookMarked, matchPrefixes: ['/admin/notes/stock'] },
    { label: 'Notes Delivery', path: '/admin/notes/delivery', icon: Truck, matchPrefixes: ['/admin/notes/delivery'] },
    { label: 'Examinations', path: '/admin/exams', icon: BookCheck, matchPrefixes: ['/admin/exams'] },
    { label: 'Marks Entry', path: '/admin/marks/entry', icon: ClipboardList, matchPrefixes: ['/admin/marks/entry'] },
    { label: 'Results & Rankings', path: '/admin/results', icon: Award, matchPrefixes: ['/admin/results'] },
    { label: 'Teachers', path: '/admin/teachers', icon: Users, matchPrefixes: ['/admin/teachers'] },
    { label: 'Teacher Salary', path: '/admin/teachers/salary', icon: CreditCard, matchPrefixes: ['/admin/teachers/salary'] },
    { label: 'Leave Approvals', path: '/admin/teachers/leave-approvals', icon: Calendar, matchPrefixes: ['/admin/teachers/leave-approvals'] },
    { label: 'Notifications', path: '/admin/notifications', icon: Bell, matchPrefixes: ['/admin/notifications'] },
    { label: 'Notices Board', path: '/admin/notices', icon: Bell, matchPrefixes: ['/admin/notices'] },
    { label: 'Reports', path: '/admin/reports', icon: FileBarChart, matchPrefixes: ['/admin/reports'] },
    { label: 'Contact', path: '/admin/contact', icon: PhoneCall, matchPrefixes: ['/admin/contact'] },
  ],
  teacher: [
    { label: 'Dashboard', path: '/teacher/dashboard', icon: LayoutDashboard, matchPrefixes: ['/teacher/dashboard'] },
    { label: 'My Classes', path: '/teacher/classes', icon: BookOpen, matchPrefixes: ['/teacher/classes'] },
    { label: 'Attendance', path: '/teacher/attendance', icon: CalendarCheck, matchPrefixes: ['/teacher/attendance'] },
    { label: 'Leave Request', path: '/teacher/leave-request', icon: Calendar, matchPrefixes: ['/teacher/leave-request'] },
    { label: 'Students', path: '/teacher/students', icon: Users, matchPrefixes: ['/teacher/students'] },
    { label: 'Examinations', path: '/teacher/exams', icon: BookCheck, matchPrefixes: ['/teacher/exams'] },
    { label: 'Enter Marks', path: '/teacher/marks', icon: ClipboardList, matchPrefixes: ['/teacher/marks'] },
    { label: 'Working Time', path: '/teacher/working-time', icon: Clock, matchPrefixes: ['/teacher/working-time'] },
    { label: 'Study Materials', path: '/teacher/study-materials', icon: BookMarked, matchPrefixes: ['/teacher/study-materials'] },
    { label: 'Announcements', path: '/teacher/announcements', icon: Bell, matchPrefixes: ['/teacher/announcements'] },
    { label: 'My Salary', path: '/teacher/salary', icon: CreditCard, matchPrefixes: ['/teacher/salary'] },
  ],
  student: [
    { label: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard, matchPrefixes: ['/student/dashboard'] },
    { label: 'My Classes', path: '/student/classes', icon: BookOpen, matchPrefixes: ['/student/classes'] },
    { label: 'Attendance', path: '/student/attendance', icon: CalendarCheck, matchPrefixes: ['/student/attendance'] },
    { label: 'Fees & Receipts', path: '/student/fees', icon: CreditCard, matchPrefixes: ['/student/fees'] },
    { label: 'Examinations', path: '/student/exams', icon: BookCheck, matchPrefixes: ['/student/exams'] },
    { label: 'Results', path: '/student/results', icon: Award, matchPrefixes: ['/student/results'] },
    { label: 'Study Materials', path: '/student/study-materials', icon: BookMarked, matchPrefixes: ['/student/study-materials'] },
    { label: 'Notes Delivery', path: '/student/notes-delivery', icon: Truck, matchPrefixes: ['/student/notes-delivery'] },
    { label: 'Announcements', path: '/student/announcements', icon: Bell, matchPrefixes: ['/student/announcements'] },
  ]
};

export const getNavLinksByRole = (role) => {
  if (role === 'super-admin') return navigationConfig.superAdmin;
  if (role === 'admin') return navigationConfig.admin;
  if (role === 'teacher') return navigationConfig.teacher;
  if (role === 'student') return navigationConfig.student;
  return [];
};
