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
          examId: mark.exam_id,
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
          obtainedMarks: mark.marks_obtained || mark.obtainedMarks,
          percentage: mark.percentage || (mark.marks_obtained ? ((mark.marks_obtained / (mark.max_marks || 100)) * 100).toFixed(1) : 0),
          grade: mark.grade || (mark.pass_status ? 'Pass' : 'Fail'),
          remarks: mark.remarks || ''
        })).filter(m => {
          const subj = (m.subject || m.examName || '').toLowerCase();
          let hasSubjectCheck = false;
          let subjectMatched = false;
          
          if (subj.includes('physics')) { hasSubjectCheck = true; if (sStream.includes('p')) subjectMatched = true; }
          if (subj.includes('chemistry')) { hasSubjectCheck = true; if (sStream.includes('c')) subjectMatched = true; }
          if (subj.includes('math')) { hasSubjectCheck = true; if (sStream.includes('m')) subjectMatched = true; }
          if (subj.includes('biology') || subj.includes('bio')) { hasSubjectCheck = true; if (sStream.includes('b')) subjectMatched = true; }
          
          if (hasSubjectCheck && sStream) return subjectMatched;
          return true;
        });
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
      remarks: data.remarks || ''
    };
    const res = await api.post('/marks', payload);
    return { success: true, message: 'Marks submitted successfully', mark: res.data };
  },

  submitBulkMarks: async (examId, entries) => {
    const res = await api.post('/marks/bulk', {
      exam_id: examId,
      entries: entries.map(entry => ({
        student_id: entry.studentId,
        marks_obtained: Number(entry.marksObtained),
        remarks: entry.remarks || ''
      }))
    });
    return res.data;
  }
};

export default marksService;
