import api from './api';

export const attendanceService = {
  // General Attendance Logs (e.g. RFID / Gate entries)
  getLogs: async (params = {}) => {
    try {
      const res = await api.get('/attendance', { params });
      return res.data;
    } catch {
      return [];
    }
  },

  scanRfid: async (rfidCard, gate = 'Gate 1') => {
    const res = await api.post('/attendance/rfid-scan', { rfidCard, gate });
    return res.data;
  },

  markManual: async (data) => {
    const res = await api.post('/attendance', data);
    return res.data;
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

  // Teacher Check-in / Check-out actions
  checkIn: async (teacherId, remarks = '') => {
    const payload = {
      teacher_id: teacherId,
      date: new Date().toISOString(),
      status: 'Working',
      remarks: remarks || undefined
    };
    const res = await api.post('/attendance/check-in', payload);
    return res.data;
  },

  checkOut: async (teacherId, remarks = '') => {
    const payload = {
      teacher_id: teacherId,
      date: new Date().toISOString(),
      status: 'Present',
      remarks: remarks || undefined
    };
    const res = await api.post('/attendance/check-out', payload);
    return res.data;
  },

  // Teacher specific attendance logs (for Teacher portal and individual working time)
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
      } else if (checkInDate && !checkOutDate) {
        const diffMs = Date.now() - checkInDate.getTime();
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        totalHours = `${diffHrs}h ${diffMins}m`;
      }

      const dateObj = new Date(ensureUtc(r.date) || Date.now());
      const localDateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;

      return {
        id: r.id,
        date: localDateStr,
        day: dateObj.toLocaleDateString('en-US', { weekday: 'long' }),
        checkIn: checkInDate ? checkInDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--',
        checkOut: checkOutDate ? checkOutDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (checkInDate ? 'In Progress' : '--'),
        breakTime: '1h 00m',
        totalHours: r.total_hours || totalHours,
        status: r.status,
        remarks: r.remarks || ''
      };
    });
  },

  // Academy Admin: All Teachers attendance tracking ledger
  getTeachersAttendance: async (params = {}) => {
    const res = await api.get('/attendance/teachers', { params });
    return res.data;
  },

  // Academy Admin: Real-time Teacher Attendance KPI Summary
  getTeachersSummary: async (params = {}) => {
    const res = await api.get('/attendance/teachers/summary', { params });
    return res.data;
  },

  // Academy Admin: Manual check-in / check-out / punch entry
  markTeacherManual: async (data) => {
    const res = await api.post('/attendance/teachers/manual', data);
    return res.data;
  },

  // Academy Admin: Update attendance record
  updateAttendance: async (id, data) => {
    const res = await api.put(`/attendance/${id}`, data);
    return res.data;
  },

  // Academy Admin: Delete attendance record
  deleteAttendance: async (id) => {
    const res = await api.delete(`/attendance/${id}`);
    return res.data;
  }
};

export default attendanceService;
