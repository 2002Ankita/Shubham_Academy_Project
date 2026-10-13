import api from './api';

export const examService = {
  getAll: async (params = {}) => {
    const res = await api.get('/exams', { params });
    return res.data.map(exam => {
      const examDateStr = exam.exam_date
        ? (typeof exam.exam_date === 'string'
            ? exam.exam_date.split('T')[0]
            : new Date(exam.exam_date).toISOString().split('T')[0])
        : 'N/A';

      let startTimeStr = '10:00 AM';
      if (exam.start_time) {
        if (typeof exam.start_time === 'string' && exam.start_time.includes('T')) {
          startTimeStr = exam.start_time.split('T')[1].substring(0, 5);
        } else if (typeof exam.start_time === 'string') {
          startTimeStr = exam.start_time;
        }
      }

      return {
        id: exam.id,
        title: exam.exam_name,
        standard: exam.standard + (exam.batch ? ` - ${exam.batch}` : '') + (exam.branch ? ` - ${exam.branch}` : ''),
        examStandard: exam.standard,
        batch: exam.batch || 'General',
        classBatch: exam.batch ? `${exam.standard} (${exam.batch})` : exam.standard,
        subject: exam.subject,
        date: examDateStr,
        startTime: startTimeStr,
        duration: '3 Hours',
        totalMarks: exam.max_marks || 100,
        maxMarks: exam.max_marks,
        passingMarks: exam.passing_marks,
        roomNo: exam.roomNo || exam.room_no || 'Exam Hall 101',
        status: exam.status || 'Scheduled',
        teacher_id: exam.teacher_id || '',
        teacher_name: exam.teacher_name || ''
      };
    });
  },

  create: async (data) => {
    // Map frontend data to backend payload
    const standardVal = data.standard || 'General';
    const hasDelimiter = standardVal.includes(' - ');
    const parts = hasDelimiter ? standardVal.split(' - ') : [standardVal];

    const payload = {
      exam_name: data.title || 'New Exam',
      standard: parts[0] || 'General',
      batch: data.batch || parts[1] || parts[0] || 'General',
      branch: data.branch || parts[2] || (standardVal.toLowerCase().includes('mangalvar') ? 'Mangalvar Peth' : 'Tarabai Park'),
      subject: data.subject || 'General',
      exam_date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
      start_time: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
      end_time: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
      max_marks: Number(data.maxMarks || 100),
      passing_marks: Number(data.passingMarks || 35),
      teacher_id: data.teacher_id || 'UNKNOWN'
    };
    
    // NOTE: The current backend POST /api/exams requires teacher_id.
    // If the frontend form doesn't provide it, this might fail unless teacher_id is injected.
    
    const res = await api.post('/exams', payload);
    return res.data;
  },

  delete: async (id) => {
    const res = await api.delete(`/exams/${id}`);
    return res.data;
  },

  update: async (id, data) => {
    const payload = {};
    if (data.status) payload.status = data.status;
    if (data.title) payload.exam_name = data.title;
    const res = await api.put(`/exams/${id}`, payload);
    return res.data;
  }
};

export default examService;
