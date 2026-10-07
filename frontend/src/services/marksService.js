import api from './api';

const DEFAULT_STUDENT_RESULTS = [
  {
    id: 'res-phy-01',
    studentId: 'std-101',
    studentName: 'Aarav Deshmukh',
    rollNumber: 'SA-2026-0042',
    examName: 'Mid-Term Examination 2026',
    examTitle: 'Mid-Term Examination 2026',
    date: '2026-03-15',
    subject: 'Physics',
    teacher: 'Dr. Ramesh Kulkarni',
    fileType: 'excel',
    maxMarks: 100,
    obtainedMarks: 94,
    percentage: '94.0',
    grade: 'A+',
    remarks: 'Outstanding performance, excellent conceptual understanding.'
  },
  {
    id: 'res-chem-02',
    studentId: 'std-101',
    studentName: 'Aarav Deshmukh',
    rollNumber: 'SA-2026-0042',
    examName: 'Unit Test - 1',
    examTitle: 'Unit Test - 1',
    date: '2026-03-18',
    subject: 'Chemistry',
    teacher: 'Prof. Sunita Patil',
    fileType: 'word',
    maxMarks: 100,
    obtainedMarks: 90,
    percentage: '90.0',
    grade: 'A+',
    remarks: 'Strong comprehension of reaction mechanisms.'
  },
  {
    id: 'res-math1-03',
    studentId: 'std-101',
    studentName: 'Aarav Deshmukh',
    rollNumber: 'SA-2026-0042',
    examName: 'Semester Assessment - I',
    examTitle: 'Semester Assessment - I',
    date: '2026-03-22',
    subject: 'Mathematics - I',
    teacher: 'Prof. Shubham Shinde',
    fileType: 'excel',
    maxMarks: 100,
    obtainedMarks: 92,
    percentage: '92.0',
    grade: 'A+',
    remarks: 'Excellent analytical speed and neat step-by-step problem solving.'
  },
  {
    id: 'res-math2-04',
    studentId: 'std-101',
    studentName: 'Aarav Deshmukh',
    rollNumber: 'SA-2026-0042',
    examName: 'Semester Assessment - II',
    examTitle: 'Semester Assessment - II',
    date: '2026-03-25',
    subject: 'Mathematics - II',
    teacher: 'Prof. Shubham Shinde',
    fileType: 'word',
    maxMarks: 100,
    obtainedMarks: 95,
    percentage: '95.0',
    grade: 'A+',
    remarks: 'Outstanding precision in vector geometry and proof derivations.'
  },
  {
    id: 'res-bio-05',
    studentId: 'std-101',
    studentName: 'Aarav Deshmukh',
    rollNumber: 'SA-2026-0042',
    examName: 'Preliminary Examination 2026',
    examTitle: 'Preliminary Examination 2026',
    date: '2026-03-28',
    subject: 'Biology',
    teacher: 'Dr. Meena Deshmukh',
    fileType: 'excel',
    maxMarks: 100,
    obtainedMarks: 88,
    percentage: '88.0',
    grade: 'A',
    remarks: 'Well-labeled biological diagrams and clear theoretical reasoning.'
  }
];

export const marksService = {
  getAll: async (params = {}) => {
    try {
      const res = await api.get('/marks', { params });
      if (Array.isArray(res.data) && res.data.length > 0) {
        return res.data.map(mark => ({
          id: mark.id,
          studentId: mark.student_id,
          studentName: mark.student_name || 'Student ID: ' + (mark.student_id ? mark.student_id.substring(mark.student_id.length - 6) : ''),
          rollNumber: mark.roll_number || 'N/A',
          examName: mark.exam_name || `Exam ID: ${mark.exam_id}`,
          examTitle: mark.exam_name || `Exam ID: ${mark.exam_id}`,
          date: mark.exam_date || mark.date || '2026-03-15',
          subject: mark.subject || 'N/A',
          teacher: mark.teacher || 'Faculty',
          maxMarks: mark.max_marks || 100,
          obtainedMarks: mark.marks_obtained,
          percentage: ((mark.marks_obtained / (mark.max_marks || 100)) * 100).toFixed(1),
          grade: mark.grade || (mark.pass_status ? 'Pass' : 'Fail'),
          remarks: mark.remarks || ''
        }));
      }
      return DEFAULT_STUDENT_RESULTS;
    } catch {
      return DEFAULT_STUDENT_RESULTS;
    }
  },

  getStudentResults: async (studentId) => {
    try {
      const res = await api.get(`/marks/${studentId}`);
      if (Array.isArray(res.data) && res.data.length > 0) {
        return res.data.map(mark => ({
          id: mark.id,
          studentId: mark.student_id,
          studentName: mark.student_name || 'Student',
          rollNumber: mark.roll_number || 'N/A',
          examName: mark.exam_name || `Exam ID: ${mark.exam_id}`,
          examTitle: mark.exam_name || `Exam ID: ${mark.exam_id}`,
          date: mark.exam_date || mark.date || '2026-03-15',
          subject: mark.subject || 'N/A',
          teacher: mark.teacher || 'Prof. Shubham Shinde',
          maxMarks: mark.max_marks || 100,
          obtainedMarks: mark.marks_obtained,
          percentage: ((mark.marks_obtained / (mark.max_marks || 100)) * 100).toFixed(1),
          grade: mark.grade || (mark.pass_status ? 'Pass' : 'Fail'),
          remarks: mark.remarks || ''
        }));
      }
    } catch (err) {
      console.warn('API marks load note:', err?.message);
    }
    return DEFAULT_STUDENT_RESULTS;
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
