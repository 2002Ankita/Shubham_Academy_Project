import api from './api';

// Removed MOCK_ATTENDANCE_LOGS

export const attendanceService = {
  getLogs: async (params = {}) => {
    try {
      const res = await api.get('/attendance', { params });
      return res.data;
    } catch {
      return [];
    }
  },

  scanRfid: async (rfidCard, gate = 'Gate 1') => {
    try {
      const res = await api.post('/attendance/rfid-scan', { rfidCard, gate });
      return res.data;
    } catch (err) {
      throw err;
    }
  },

  markManual: async (data) => {
    try {
      const res = await api.post('/attendance/manual', data);
      return res.data;
    } catch (err) {
      throw err;
    }
  },

  getReportSummary: async () => {
    try {
      const res = await api.get('/attendance/summary');
      return res.data;
    } catch {
      return {
        totalStudents: 0,
        presentToday: 0,
        absentToday: 0,
        averagePercent: 0,
        weeklyData: []
      };
    }
  },

  checkIn: async (teacherId) => {
    const payload = {
      teacher_id: teacherId,
      date: new Date().toISOString(),
      status: 'Present'
    };
    const res = await api.post('/attendance/check-in', payload);
    return res.data;
  },

  checkOut: async (teacherId) => {
    const payload = {
      teacher_id: teacherId,
      date: new Date().toISOString(),
      status: 'Present'
    };
    const res = await api.post('/attendance/check-out', payload);
    return res.data;
  },

  getWorkingTime: async (teacherId) => {
    const res = await api.get(`/attendance/teacher/${teacherId}`);
    return res.data.map(r => {
      const ensureUtc = (dt) => dt ? (dt.endsWith('Z') || dt.includes('+') ? dt : dt + 'Z') : null;
      const checkInDate = r.check_in_time ? new Date(ensureUtc(r.check_in_time)) : null;
      const checkOutDate = r.check_out_time ? new Date(ensureUtc(r.check_out_time)) : null;
      
      let totalHours = '--';
      if (checkInDate && checkOutDate) {
        const diffMs = checkOutDate - checkInDate;
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        totalHours = `${diffHrs}h ${diffMins}m`;
      }

      return {
        id: r.id,
        date: new Date(ensureUtc(r.date)).toISOString().split('T')[0],
        day: new Date(ensureUtc(r.date)).toLocaleDateString('en-US', { weekday: 'long' }),
        checkIn: checkInDate ? checkInDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--',
        checkOut: checkOutDate ? checkOutDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--',
        breakTime: '1h 00m',
        totalHours: r.total_hours || totalHours,
        status: r.status
      };
    });
  }
};

export default attendanceService;
