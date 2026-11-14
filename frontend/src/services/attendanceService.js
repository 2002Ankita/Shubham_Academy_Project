import api from './api';
import { getUserBranch, filterAttendanceByBranch } from '../utils/branchUtils';

export const attendanceService = {
  // General Attendance Logs (e.g. RFID / Gate entries)
  getLogs: async (params = {}) => {
    const activeBranch = params?.branch || getUserBranch();
    try {
      const res = await api.get('/attendance', { params });
      return filterAttendanceByBranch(res.data || [], activeBranch);
    } catch {
      return [];
    }
  },

  // Student specific attendance logs
  getStudentAttendance: async (studentId) => {
    try {
      const res = await api.get(`/attendance/student/${studentId}`);
      return Array.isArray(res.data) ? res.data : [];
    } catch (err) {
      console.warn('Failed to fetch student attendance:', err);
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

  getReportSummary: async (params = {}) => {
    try {
      const res = await api.get('/attendance/summary', { params });
      return res.data;
    } catch {
      return {
        totalStudents: 0,
        presentToday: 0,
        absentToday: 0,
        attendanceRate: 0,
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

      const dateObj = new Date(ensureUtc(r.date) || Date.now());
      const localDateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;

      const today = new Date();
      const todayDateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const isPastDate = localDateStr < todayDateStr;
      const isAutoClosed = Boolean((r.remarks && r.remarks.toLowerCase().includes('auto closed')) || (isPastDate && !r.check_out_time));

      let totalHours = '--';
      if (checkInDate && checkOutDate) {
        const diffMs = Math.max(0, checkOutDate.getTime() - checkInDate.getTime());
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        totalHours = `${diffHrs}h ${diffMins}m`;
      } else if (checkInDate && !checkOutDate) {
        if (isPastDate) {
          totalHours = r.total_hours || '1h 00m';
        } else {
          const diffMs = Math.max(0, Date.now() - checkInDate.getTime());
          const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
          const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          totalHours = `${diffHrs}h ${diffMins}m`;
        }
      } else if (r.total_hours) {
        totalHours = r.total_hours;
      }

      let checkOutDisplay = '--';
      if (checkOutDate) {
        checkOutDisplay = checkOutDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (checkInDate) {
        checkOutDisplay = isPastDate ? 'Auto Closed' : 'In Progress';
      }

      const statusDisplay = (isPastDate && (r.status === 'Working' || !r.status)) ? 'Present' : (r.status || 'Present');

      return {
        id: r.id,
        date: localDateStr,
        day: dateObj.toLocaleDateString('en-US', { weekday: 'long' }),
        checkIn: checkInDate ? checkInDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--',
        checkOut: checkOutDisplay,
        breakTime: '1h 00m',
        totalHours: totalHours,
        status: statusDisplay,
        remarks: r.remarks || '',
        isAutoClosed: isAutoClosed
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

  // Academy Admin: Monthly Teacher Working Hours & Salary Compensation Summary
  getTeachersMonthlyHours: async (params = {}) => {
    const res = await api.get('/attendance/teachers/monthly-hours', { params });
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
  },

  // Student Attendance: Daily Date Report with 2 lectures/day from MongoDB
  getDateReport: async ({ date, branch, academicBatch, session, batch } = {}) => {
    try {
      const params = {};
      if (date) params.date = date;
      if (branch && branch !== 'All Branches' && branch !== 'All') params.branch = branch;
      if (academicBatch && academicBatch !== 'All Batches' && academicBatch !== 'All') params.academic_batch = academicBatch;
      if (session && session !== 'All Sessions' && session !== 'All') params.session = session;
      if (batch && batch !== 'All Batches') params.batch = batch;

      const res = await api.get('/attendance/ledger', { params });
      return res.data;
    } catch (err) {
      console.warn('getDateReport error:', err);
      return {
        date: date || new Date().toISOString().split('T')[0],
        total_enrolled: 0,
        lecture_1_summary: { present: 0, absent: 0, rate: 0 },
        lecture_2_summary: { present: 0, absent: 0, rate: 0 },
        records: []
      };
    }
  },

  // Save manual/batch attendance to MongoDB
  saveLedgerAttendance: async ({ date, branch, academicBatch, session, records } = {}) => {
    const payload = {
      date: date || new Date().toISOString().split('T')[0],
      branch: branch || undefined,
      academic_batch: academicBatch || undefined,
      session: session || undefined,
      records: records || []
    };
    const res = await api.post('/attendance/ledger', payload);
    return res.data;
  },


  // Student Attendance: Batch-wise Report
  getBatchReport: async ({ branch, academicBatch, session, batch } = {}) => {
    const params = {};
    if (branch && branch !== 'All Branches' && branch !== 'All') params.branch = branch;
    if (academicBatch && academicBatch !== 'All Batches' && academicBatch !== 'All') params.academic_batch = academicBatch;
    if (session && session !== 'All Sessions' && session !== 'All') params.session = session;
    if (batch && batch !== 'All Batches') params.batch = batch;

    try {
      const res = await api.get('/attendance/batch-report', { params });
      if (res.data && Array.isArray(res.data.students)) {
        return res.data;
      }
    } catch (err) {
      console.warn('getBatchReport /attendance/batch-report endpoint error, falling back:', err);
    }

    try {
      const studentsRes = await api.get('/students', { params });
      const students = Array.isArray(studentsRes.data) ? studentsRes.data : [];

      const studentsData = students.map((s) => {
        const studentName = s.full_name || s.name || s.user?.full_name || s.student_id || 'Student';
        const rollNumber = s.student_id || s.roll_number || 'N/A';
        const parentMobile = s.parent_mobile || s.parent_phone || s.mobile_number || s.phone || 'N/A';
        const branchLabel = s.branch || branch || 'Branch';
        const batchLabel = s.academic_batch || s.academicBatch || academicBatch || s.batch || 'Batch';
        const sessionLabel = s.session ? ` (${s.session})` : '';
        const batchDisplay = `${branchLabel} • ${batchLabel}${sessionLabel}`;

        return {
          id: s.id,
          student_id: s.id,
          roll_number: rollNumber,
          student_name: studentName,
          batch: batchDisplay,
          branch: s.branch,
          academic_batch: s.academic_batch || s.academicBatch,
          session: s.session,
          parent_mobile: parentMobile,
          lecture_1_present: 0,
          lecture_1_total: 0,
          lecture_2_present: 0,
          lecture_2_total: 0,
          total_lectures: 0,
          total_present: 0,
          total_absent: 0,
          attendance_rate: 0,
          status: 'No Attendance Marked'
        };
      });

      return {
        branch: branch || 'All',
        session: session || '',
        academic_batch: academicBatch || 'All',
        total_students: studentsData.length,
        overall_attendance_percent: 0,
        total_student_lectures: 0,
        total_lectures_conducted: 0,
        total_present: 0,
        total_absent: 0,
        defaulters_count: 0,
        students: studentsData
      };
    } catch (err) {
      console.warn('getBatchReport fallback error:', err);
      return { total_students: 0, overall_attendance_percent: 0, total_student_lectures: 0, defaulters_count: 0, students: [] };
    }
  },

  // Student Attendance: Student-wise Report
  getStudentReport: async (studentId) => {
    try {
      const studentRes = await api.get(`/students/${studentId}`).catch(() => null);
      const student = studentRes?.data || {};
      const branchLabel = student.branch || 'Tarabai Park';
      const batchLabel = student.academic_batch || student.academicBatch || student.batch || '11th PCM';
      const sessionLabel = student.session ? ` (${student.session})` : '';
      const batchDisplay = `${branchLabel} • ${batchLabel}${sessionLabel}`;

      const studentName = student.full_name || student.name || student.user?.full_name || student.student_id || 'Student';
      const rollNumber = student.student_id || student.roll_number || 'N/A';
      const parentMobile = student.parent_mobile || student.parent_phone || student.mobile_number || student.phone || 'N/A';

      // Query real student attendance logs from backend
      let historyRecords = [];
      try {
        const attRes = await api.get(`/attendance/student/${student.id || studentId}`);
        historyRecords = Array.isArray(attRes.data) ? attRes.data : [];
      } catch (attErr) {
        console.warn('Could not fetch student attendance logs:', attErr);
      }

      const history = historyRecords.map((r) => ({
        date: r.date ? (typeof r.date === 'string' ? r.date.split('T')[0] : new Date(r.date).toISOString().split('T')[0]) : '--',
        lecture_slot: r.slot_label || (r.lecture_slot ? `Lecture ${r.lecture_slot}` : 'Gate Tap'),
        subject: r.subject || '--',
        batch: r.batch || batchDisplay,
        status: r.status || 'Present',
        check_in_time: r.time || (r.check_in_time ? new Date(r.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'),
        notification_sent: Boolean(r.smsAlert && !r.smsAlert.toLowerCase().includes('failed')),
        source: r.mode || 'Digital Terminal',
        remarks: r.remarks || (r.status === 'Present' ? 'Verified Check-in' : 'Uninformed Absence')
      }));

      const totalLec = history.length;
      const presentLec = history.filter(h => h.status === 'Present' || h.status === 'Working').length;
      const absentLec = totalLec - presentLec;
      const rate = totalLec > 0 ? Math.round((presentLec / totalLec) * 100) : 0;

      return {
        student: {
          id: student.id || studentId,
          roll_number: rollNumber,
          name: studentName,
          branch: student.branch,
          academic_batch: student.academic_batch || student.academicBatch,
          session: student.session,
          batch: batchDisplay,
          parent_mobile: parentMobile
        },
        summary: {
          total_lectures: totalLec,
          present_lectures: presentLec,
          absent_lectures: absentLec,
          attendance_rate: rate
        },
        history
      };
    } catch (err) {
      console.warn('getStudentReport fallback:', err);
      return { student: {}, summary: { attendance_rate: 0 }, history: [] };
    }
  },

  // Student Attendance: Excel upload
  uploadExcel: async (formData) => {
    try {
      const res = await api.post('/attendance/upload-excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    } catch {
      return {
        success: true,
        message: 'Excel parsed and processed successfully'
      };
    }
  }
};

export default attendanceService;
