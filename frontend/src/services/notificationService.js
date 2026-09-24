import api from './api';

const MOCK_NOTIFICATIONS = [
  {
    id: 'NTF-01',
    title: 'RFID Attendance Recorded',
    message: 'Your gate entry was logged at 08:14 AM at Gate 1.',
    time: '15 mins ago',
    type: 'attendance',
    read: false
  },
  {
    id: 'NTF-02',
    title: 'Fee Payment Receipt Generated',
    message: 'Receipt #REC-99120 for Rs. 45,000 has been verified.',
    time: '2 hours ago',
    type: 'fee',
    read: false
  },
  {
    id: 'NTF-03',
    title: 'New Study Material Uploaded',
    message: 'Dr. Priya Kulkarni uploaded "Physics Wave Optics Notes PDF".',
    time: '1 day ago',
    type: 'material',
    read: true
  }
];

export const notificationService = {
  getAll: async () => {
    try {
      const res = await api.get('/notifications');
      return res.data;
    } catch {
      return MOCK_NOTIFICATIONS;
    }
  },

  markAllAsRead: async () => {
    try {
      await api.post('/notifications/mark-read');
    } catch {
      MOCK_NOTIFICATIONS.forEach(n => { n.read = true; });
    }
    return { success: true };
  }
};

export default notificationService;
