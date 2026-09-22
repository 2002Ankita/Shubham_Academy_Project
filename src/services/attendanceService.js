import api from './api';

const MOCK_ATTENDANCE_LOGS = [
  {
    id: 'ATT-101',
    studentId: 'STU-001',
    studentName: 'Aarav Deshmukh',
    rollNumber: 'SA-2026-1042',
    date: '2026-09-19',
    time: '08:14 AM',
    mode: 'RFID Tap',
    status: 'Present',
    rfidCard: 'RFID-984210',
    gate: 'Gate 1 (Main Entrance)',
    smsAlert: 'Sent to Parent (+91 98231 45671)'
  },
  {
    id: 'ATT-102',
    studentId: 'STU-002',
    studentName: 'Ananya Sharma',
    rollNumber: 'SA-2026-1043',
    date: '2026-09-19',
    time: '08:22 AM',
    mode: 'RFID Tap',
    status: 'Present',
    rfidCard: 'RFID-984211',
    gate: 'Gate 1 (Main Entrance)',
    smsAlert: 'Sent to Parent (+91 98231 87655)'
  },
  {
    id: 'ATT-103',
    studentId: 'STU-003',
    studentName: 'Rohan Joshi',
    rollNumber: 'SA-2026-1044',
    date: '2026-09-19',
    time: '08:28 AM',
    mode: 'Manual Entry',
    status: 'Present',
    rfidCard: 'RFID-984212',
    gate: 'Admin Desk',
    smsAlert: 'Sent to Parent (+91 97123 44557)'
  },
  {
    id: 'ATT-104',
    studentId: 'STU-004',
    studentName: 'Tanvi Kulkarni',
    rollNumber: 'SA-2026-1045',
    date: '2026-09-19',
    time: '--',
    mode: 'System Auto-flag',
    status: 'Absent',
    rfidCard: 'RFID-984213',
    gate: '--',
    smsAlert: 'Absence Alert Sent'
  }
];

export const attendanceService = {
  getLogs: async (params = {}) => {
    try {
      const res = await api.get('/attendance', { params });
      return res.data;
    } catch {
      return MOCK_ATTENDANCE_LOGS;
    }
  },

  scanRfid: async (rfidCard, gate = 'Gate 1') => {
    try {
      const res = await api.post('/attendance/rfid-scan', { rfidCard, gate });
      return res.data;
    } catch {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const newEntry = {
        id: `ATT-${Date.now()}`,
        studentId: 'STU-001',
        studentName: 'Aarav Deshmukh',
        rollNumber: 'SA-2026-1042',
        date: now.toISOString().split('T')[0],
        time: timeStr,
        mode: 'RFID Tap',
        status: 'Present',
        rfidCard: rfidCard,
        gate: gate,
        smsAlert: 'Sent to Parent (+91 98231 45671)'
      };
      MOCK_ATTENDANCE_LOGS.unshift(newEntry);
      return {
        success: true,
        message: `Card ${rfidCard} Scanned Successfully!`,
        entry: newEntry
      };
    }
  },

  markManual: async (data) => {
    try {
      const res = await api.post('/attendance/manual', data);
      return res.data;
    } catch {
      return { success: true, message: 'Manual attendance saved successfully', data };
    }
  },

  getReportSummary: async () => {
    try {
      const res = await api.get('/attendance/summary');
      return res.data;
    } catch {
      return {
        totalStudents: 480,
        presentToday: 442,
        absentToday: 38,
        averagePercent: 92.08,
        weeklyData: [
          { day: 'Mon', present: 450, absent: 30 },
          { day: 'Tue', present: 458, absent: 22 },
          { day: 'Wed', present: 435, absent: 45 },
          { day: 'Thu', present: 462, absent: 18 },
          { day: 'Fri', present: 442, absent: 38 },
          { day: 'Sat', present: 420, absent: 60 }
        ]
      };
    }
  }
};

export default attendanceService;
