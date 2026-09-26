import api from './api';

export const marksService = {
  getAll: async (params = {}) => {
    // The backend currently does not support a global GET /api/marks endpoint.
    // It only supports getting marks per student.
    return [];
  },

  getStudentResults: async (studentId) => {
    const res = await api.get(`/marks/${studentId}`);
    return res.data.map(mark => ({
      id: mark.id,
      studentId: mark.student_id,
      studentName: 'Student ID: ' + mark.student_id.substring(mark.student_id.length - 6),
      rollNumber: 'N/A',
      examTitle: `Exam ID: ${mark.exam_id}`,
      subject: 'N/A', // Subject not embedded in backend response
      maxMarks: 100, // Mocked since not in backend response
      obtainedMarks: mark.marks_obtained,
      percentage: mark.marks_obtained, // Mocked assuming max is 100
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
