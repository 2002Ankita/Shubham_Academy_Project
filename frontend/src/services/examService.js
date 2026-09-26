import api from './api';

export const examService = {
  getAll: async (params = {}) => {
    const res = await api.get('/exams', { params });
    return res.data.map(exam => ({
      id: exam.id,
      title: exam.exam_name,
      standard: exam.course + (exam.batch ? ` - ${exam.batch}` : ''),
      subject: exam.subject,
      date: exam.exam_date?.split('T')[0] || 'N/A',
      startTime: exam.start_time?.split('T')[1]?.substring(0, 5) || '10:00', // Mocking time display if backend sends ISO
      duration: '3 Hours', // Or calculate from start_time and end_time
      maxMarks: exam.max_marks,
      passingMarks: exam.passing_marks,
      roomNo: 'N/A', // Not stored in backend
      status: new Date(exam.exam_date) < new Date() ? 'Completed' : 'Scheduled'
    }));
  },

  create: async (data) => {
    // Map frontend data to backend payload
    const payload = {
      exam_name: data.title || 'New Exam',
      course: data.standard?.split(' - ')[0] || 'General',
      batch: data.standard?.split(' - ')[1] || 'General',
      subject: data.subject || 'General',
      exam_date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
      start_time: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
      end_time: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
      max_marks: Number(data.maxMarks || 100),
      passing_marks: Number(data.passingMarks || 35),
      teacher_id: data.teacher_id || 'UNKNOWN' // Will fail on backend if invalid, but that's what we want
    };
    
    // NOTE: The current backend POST /api/exams requires teacher_id.
    // If the frontend form doesn't provide it, this might fail unless teacher_id is injected.
    
    const res = await api.post('/exams', payload);
    return res.data;
  },

  delete: async (id) => {
    // Note: Backend might not have DELETE /exams yet, but we will call it anyway.
    const res = await api.delete(`/exams/${id}`);
    return res.data;
  }
};

export default examService;
