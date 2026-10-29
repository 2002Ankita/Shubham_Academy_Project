import api from './api';

const DEFAULT_STUDENT_RESULTS = [
  {
    id: 'res-phy-01',
    studentId: 'std-101',
    studentName: 'Aarav Deshmukh',
    rollNumber: 'SA-TP-2026-0042',
    examName: 'Mid-Term Examination 2026',
    examTitle: 'Mid-Term Examination 2026',
    date: '2026-03-15',
    subject: 'Physics',
    branch: 'Tarabai Park',
    batch: '11th pcm tarabai park',
    standard: '11th Science',
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
    rollNumber: 'SA-TP-2026-0042',
    examName: 'Unit Test - 1',
    examTitle: 'Unit Test - 1',
    date: '2026-03-18',
    subject: 'Chemistry',
    branch: 'Tarabai Park',
    batch: '11th pcm tarabai park',
    standard: '11th Science',
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
    rollNumber: 'SA-TP-2026-0042',
    examName: 'Semester Assessment - I',
    examTitle: 'Semester Assessment - I',
    date: '2026-03-22',
    subject: 'Mathematics - I',
    branch: 'Tarabai Park',
    batch: '11th pcm tarabai park',
    standard: '11th Science',
    teacher: 'Prof. Shubham Shinde',
    fileType: 'excel',
    maxMarks: 100,
    obtainedMarks: 92,
    percentage: '92.0',
    grade: 'A+',
    remarks: 'Excellent analytical speed and neat step-by-step problem solving.'
  },
  {
    id: 'res-mp-01',
    studentId: 'std-201',
    studentName: 'Diya Kulkarni',
    rollNumber: 'SA-MP-2026-0101',
    examName: 'Mangalvar Peth Physics Evaluation',
    examTitle: 'Mangalvar Peth Physics Evaluation',
    date: '2026-03-20',
    subject: 'Physics',
    branch: 'Mangalvar Peth',
    batch: '11th pcm Mangalvar Peth',
    standard: '11th Science',
    teacher: 'Prof. Shubham Shinde',
    fileType: 'excel',
    maxMarks: 100,
    obtainedMarks: 96,
    percentage: '96.0',
    grade: 'A+',
    remarks: 'Top-tier analytical precision and conceptual clarity.'
  },
  {
    id: 'res-mp-02',
    studentId: 'std-202',
    studentName: 'Rohan Patil',
    rollNumber: 'SA-MP-2026-0102',
    examName: 'Mangalvar Peth Chemistry Mock',
    examTitle: 'Mangalvar Peth Chemistry Mock',
    date: '2026-03-24',
    subject: 'Chemistry',
    branch: 'Mangalvar Peth',
    batch: '12th pcb Mangalvar Peth',
    standard: '12th Science',
    teacher: 'Prof. Sunita Patil',
    fileType: 'word',
    maxMarks: 100,
    obtainedMarks: 91,
    percentage: '91.0',
    grade: 'A+',
    remarks: 'Consistent high score in organic chemistry reactions.'
  }
];

export const marksService = {
  getAll: async (params = {}) => {
    try {
      const res = await api.get('/marks', { params });
      if (Array.isArray(res.data) && res.data.length > 0) {
        return res.data
          .filter(mark => mark && (mark.student_name || mark.roll_number || mark.exam_name))
          .map(mark => {
            const rawBranch = mark.branch || (mark.exam_name && mark.exam_name.toLowerCase().includes('mangal') ? 'Mangalvar Peth' : (mark.roll_number && mark.roll_number.includes('MP') ? 'Mangalvar Peth' : 'Tarabai Park'));
            return {
              id: mark.id,
              studentId: mark.student_id,
              examId: mark.exam_id,
              studentName: mark.student_name || (mark.student_id ? 'Student ' + mark.student_id.substring(mark.student_id.length - 6) : 'Unknown Student'),
              rollNumber: mark.roll_number || 'N/A',
              examName: mark.exam_name || (mark.exam_id ? `Exam ${mark.exam_id.substring(mark.exam_id.length - 6)}` : 'Exam'),
              examTitle: mark.exam_name || (mark.exam_id ? `Exam ${mark.exam_id.substring(mark.exam_id.length - 6)}` : 'Exam'),
              date: mark.exam_date || mark.date || new Date().toISOString().split('T')[0],
              subject: mark.subject || 'N/A',
              branch: rawBranch,
              batch: mark.batch || mark.standard || (rawBranch.includes('Mangal') ? '11th pcm Mangalvar Peth' : '11th pcm tarabai park'),
              standard: mark.standard || '11th Science',
              teacher: mark.teacher || 'Faculty',
              maxMarks: mark.max_marks || 100,
              obtainedMarks: mark.marks_obtained,
              percentage: ((mark.marks_obtained / (mark.max_marks || 100)) * 100).toFixed(1),
              grade: mark.grade || (mark.pass_status ? 'Pass' : 'Fail'),
              status: mark.status || 'Published',
              remarks: mark.remarks || ''
            };
          });
      }
      return DEFAULT_STUDENT_RESULTS;
    } catch {
      return DEFAULT_STUDENT_RESULTS;
    }
  },

  getStudentResults: async (studentId) => {
    let studentBatch = '';
    try {
      // Avoid circular dependency by lazy importing studentService if needed
      // but in this case, authService might have the rollNumber or we can use local storage.
      // Easiest is to import studentService dynamically
      const { studentService } = await import('./studentService');
      const student = await studentService.getById(studentId);
      studentBatch = (student?.batch || '').toLowerCase();
    } catch (e) {
      console.warn('Could not fetch student profile for batch filtering');
    }

    const sStream = studentBatch.split(' ')[1] || '';

    const processMarks = (marksArray) => {
      return marksArray.map(mark => ({
        id: mark.id,
        studentId: mark.student_id || mark.studentId,
        examId: mark.exam_id || mark.examId,
        studentName: mark.student_name || mark.studentName || 'Student',
        rollNumber: mark.roll_number || mark.rollNumber || 'N/A',
        examName: mark.exam_name || mark.examName || `Exam ID: ${mark.exam_id}`,
        examTitle: mark.exam_name || mark.examTitle || `Exam ID: ${mark.exam_id}`,
        date: mark.exam_date || mark.date || '2026-03-15',
        subject: mark.subject || 'N/A',
        teacher: mark.teacher || 'Prof. Faculty',
        maxMarks: mark.max_marks || mark.maxMarks || 100,
        obtainedMarks: mark.marks_obtained !== undefined ? mark.marks_obtained : mark.obtainedMarks,
        percentage: mark.percentage || (mark.marks_obtained !== undefined ? ((mark.marks_obtained / (mark.max_marks || 100)) * 100).toFixed(1) : 0),
        grade: mark.grade || (mark.pass_status ? 'Pass' : 'Fail'),
        pass_status: mark.pass_status,
        status: mark.status || 'Published',
        remarks: mark.remarks || ''
      }));
    };

    try {
      const res = await api.get(`/marks/${studentId}`);
      if (Array.isArray(res.data) && res.data.length > 0) {
        return processMarks(res.data);
      }
    } catch (err) {
      console.warn('API marks load note:', err?.message);
    }
    return [];
  },

  submitMarks: async (data) => {
    const payload = {
      student_id: data.studentId,
      exam_id: data.examId || data.exam_id,
      marks_obtained: Number(data.obtainedMarks),
      remarks: data.remarks || '',
      status: data.status || 'Published'
    };
    const res = await api.post('/marks', payload);
    return { success: true, message: 'Marks submitted successfully', mark: res.data };
  },

  submitBulkMarks: async (examId, entries, status = 'Published') => {
    const res = await api.post('/marks/bulk', {
      exam_id: examId,
      status: status,
      entries: entries.map(entry => ({
        student_id: entry.studentId,
        marks_obtained: Number(entry.marksObtained),
        remarks: entry.remarks || '',
        status: entry.status || status
      }))
    });
    return res.data;
  },

  sendMarksNotifications: async (payload) => {
    const res = await api.post('/marks/send-notifications', payload);
    return res.data;
  },

  getNotificationLogs: async (limit = 50) => {
    const res = await api.get('/marks/notification-logs', { params: { limit } });
    return res.data;
  }
};

export default marksService;
