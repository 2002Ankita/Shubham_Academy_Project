import api from './api';

export const marksService = {
  getAll: async (params = {}) => {
    const res = await api.get('/marks', { params });
    return res.data.map(mark => ({
      id: mark.id,
      studentId: mark.student_id,
      studentName: mark.student_name || 'Student ID: ' + mark.student_id.substring(mark.student_id.length - 6),
      rollNumber: mark.roll_number || 'N/A',
      examTitle: mark.exam_name || `Exam ID: ${mark.exam_id}`,
      subject: mark.subject || 'N/A',
      maxMarks: mark.max_marks || 100,
      obtainedMarks: mark.marks_obtained,
      percentage: ((mark.marks_obtained / (mark.max_marks || 100)) * 100).toFixed(1),
      grade: mark.grade || (mark.pass_status ? 'Pass' : 'Fail'),
      remarks: mark.remarks
    }));
  },

  getStudentResults: async (studentId) => {
    const res = await api.get(`/marks/${studentId}`);
    return res.data.map(mark => ({
      id: mark.id,
      studentId: mark.student_id,
      studentName: mark.student_name || 'Student ID: ' + mark.student_id.substring(mark.student_id.length - 6),
      rollNumber: mark.roll_number || 'N/A',
      examTitle: mark.exam_name || `Exam ID: ${mark.exam_id}`,
      subject: mark.subject || 'N/A',
      maxMarks: mark.max_marks || 100,
      obtainedMarks: mark.marks_obtained,
      percentage: ((mark.marks_obtained / (mark.max_marks || 100)) * 100).toFixed(1),
      grade: mark.grade || (mark.pass_status ? 'Pass' : 'Fail'),
      remarks: mark.remarks
    }));
  },

  submitMarks: async (data) => {
    const payload = {
      student_id: data.studentId,
      exam_id: data.examId || data.exam_id,
      marks_obtained: Number(data.obtainedMarks),
      remarks: data.remarks || ''
    };
    const res = await api.post('/marks', payload);
    return { success: true, message: 'Marks submitted successfully', mark: res.data };
  }
};

export default marksService;
