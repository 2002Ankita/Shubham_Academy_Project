import api from './api';

export const DEFAULT_NOTIFICATIONS = [
  {
    id: 'NTF-01',
    title: 'RFID Attendance Logged',
    time: '08:14 AM',
    date: '05 Oct 2026',
    formattedDateTime: '05 Oct 2026, 08:14 AM',
    type: 'attendance',
    category: 'Attendance & Biometrics',
    priority: 'Normal',
    author: 'Campus Security & Gate Operations',
    details: 'Student Aarav Deshmukh registered an automated biometric RFID in-gate entry at Main Campus Gate 1. In-time recorded: 08:14 AM. Status has been verified and marked as Present for today\'s academic sessions and lectures. No manual intervention required.',
    read: false
  },
  {
    id: 'NTF-02',
    title: 'Fee Payment Receipt Generated',
    time: '10:15 AM',
    date: '05 Oct 2026',
    formattedDateTime: '05 Oct 2026, 10:15 AM',
    type: 'fee',
    category: 'Accounts & Fees',
    priority: 'High',
    author: 'Accounts & Finance Wing',
    details: 'Official installment fee receipt #REC-99120 for ₹45,000 has been verified and digitally stamped by the finance wing. Payment method: UPI / NetBanking. Your student ledger account is currently cleared with zero outstanding dues for the current academic term.',
    read: false
  },
  {
    id: 'NTF-03',
    title: 'Physics Chapter 4 Notes Uploaded',
    time: '11:30 AM',
    date: '05 Oct 2026',
    formattedDateTime: '05 Oct 2026, 11:30 AM',
    type: 'material',
    category: 'Study Materials',
    priority: 'Normal',
    author: 'Dr. Priya Kulkarni (Physics Faculty)',
    details: 'Comprehensive formula booklet, key conceptual derivations, and numerical exercise sheets for Chapter 4 "Wave Optics & Interference" have been uploaded to the Study Materials repository for download.',
    read: false
  },
  {
    id: 'NTF-04',
    title: 'Mid-Term Exam Schedule Out',
    time: '01:45 PM',
    date: '05 Oct 2026',
    formattedDateTime: '05 Oct 2026, 01:45 PM',
    type: 'exam',
    category: 'Examinations',
    priority: 'High',
    author: 'Controller of Examinations',
    details: 'The official schedule for the Mid-Term Evaluation (Academic Year 2026-27) has been released. Examinations commence on October 15, 2026. Hall tickets will be downloadable via the student portal from October 10. Check batch-wise paper timings, syllabus topics, and room allocations in the Examinations module.',
    read: false
  },
  {
    id: 'NTF-05',
    title: 'Maths Doubt Session Scheduled',
    time: '03:20 PM',
    date: '05 Oct 2026',
    formattedDateTime: '05 Oct 2026, 03:20 PM',
    type: 'schedule',
    category: 'Academic Schedule',
    priority: 'Normal',
    author: 'Prof. Rajesh Sharma (Mathematics)',
    details: 'An interactive doubt clearing and problem-solving masterclass on Integral Calculus & Differential Equations will be conducted today at 04:30 PM in Lecture Hall B. All Class 12 students are requested to bring their question sets.',
    read: false
  },
  {
    id: 'NTF-06',
    title: 'Chemistry Lab Journal Submission',
    time: '04:50 PM',
    date: '05 Oct 2026',
    formattedDateTime: '05 Oct 2026, 04:50 PM',
    type: 'assignment',
    category: 'Assignments & Labs',
    priority: 'High',
    author: 'Chemistry Laboratory Wing',
    details: 'All Batch-A students are reminded to submit completed and signed volumetric analysis practical journals before Friday, 05:00 PM to Dr. V. Nair for semester internal assessment marks calculation.',
    read: false
  },
  {
    id: 'NTF-07',
    title: 'Library Book Return Reminder',
    time: '05:30 PM',
    date: '05 Oct 2026',
    formattedDateTime: '05 Oct 2026, 05:30 PM',
    type: 'library',
    category: 'Library Services',
    priority: 'Normal',
    author: 'Central Library Desk',
    details: 'Borrowed reference volume "Concepts of Physics - Vol 2 (H.C. Verma)" accession #LIB-4402 is scheduled for return by tomorrow evening. Renew via the student portal or hand over at circulation desk #2 to avoid overdue charges.',
    read: false
  },
  {
    id: 'NTF-08',
    title: 'System Cloud Snapshot Verified',
    time: '01:00 AM',
    date: '05 Oct 2026',
    formattedDateTime: '05 Oct 2026, 01:00 AM',
    type: 'system',
    category: 'System Administration',
    priority: 'Normal',
    author: 'Automated Cloud Cron',
    details: 'Nightly incremental backup of all student profiles, fee registers, and examination rosters was verified and archived to primary cloud vault successfully.',
    read: false,
    forSuperAdminOnly: true
  }
];

const READ_STORAGE_KEY = 'sa_read_notifications_v4';
const SELECTED_NOTICE_KEY = 'sa_selected_notice';

function getReadIds() {
  try {
    const raw = localStorage.getItem(READ_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveReadIds(ids) {
  try {
    localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(ids));
  } catch (err) {
    console.error('Error saving read notification IDs:', err);
  }
}

export const notificationService = {
  getNotifications: (isSuperAdmin = false) => {
    const readIds = getReadIds();
    const items = isSuperAdmin
      ? DEFAULT_NOTIFICATIONS
      : DEFAULT_NOTIFICATIONS.filter(n => !n.forSuperAdminOnly);

    return items.map(n => ({
      ...n,
      read: readIds.includes(n.id)
    }));
  },

  getUnreadNotifications: (isSuperAdmin = false) => {
    const readIds = getReadIds();
    const items = isSuperAdmin
      ? DEFAULT_NOTIFICATIONS
      : DEFAULT_NOTIFICATIONS.filter(n => !n.forSuperAdminOnly);
    return items
      .filter(n => !readIds.includes(n.id))
      .map(n => ({ ...n, read: false }));
  },

  getAllAnnouncements: (isSuperAdmin = false) => {
    const items = isSuperAdmin
      ? DEFAULT_NOTIFICATIONS
      : DEFAULT_NOTIFICATIONS.filter(n => !n.forSuperAdminOnly);
    return items;
  },

  getUnreadCount: (isSuperAdmin = false) => {
    const unread = notificationService.getUnreadNotifications(isSuperAdmin);
    return unread.length;
  },

  markAsRead: (id) => {
    const readIds = getReadIds();
    if (!readIds.includes(id)) {
      readIds.push(id);
      saveReadIds(readIds);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sa_notifications_updated', { detail: { id } }));
      }
    }
  },

  markAllAsRead: (isSuperAdmin = false) => {
    const notifs = isSuperAdmin
      ? DEFAULT_NOTIFICATIONS
      : DEFAULT_NOTIFICATIONS.filter(n => !n.forSuperAdminOnly);
    const readIds = notifs.map(n => n.id);
    saveReadIds(readIds);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sa_notifications_updated'));
    }
  },

  resetNotifications: () => {
    saveReadIds([]);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sa_notifications_updated'));
    }
  },

  setSelectedNotice: (notice) => {
    try {
      localStorage.setItem(SELECTED_NOTICE_KEY, JSON.stringify(notice));
    } catch (err) {
      console.error('Error setting selected notice:', err);
    }
  },

  getSelectedNotice: () => {
    try {
      const raw = localStorage.getItem(SELECTED_NOTICE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  clearSelectedNotice: () => {
    try {
      localStorage.removeItem(SELECTED_NOTICE_KEY);
    } catch (err) {
      console.error('Error clearing selected notice:', err);
    }
  },

  // Backwards compatibility for other potential consumers
  getAll: async () => {
    try {
      const res = await api.get('/notifications');
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        return res.data;
      }
    } catch {
      // fallback to mock
    }
    return notificationService.getNotifications(false);
  }
};

export default notificationService;
