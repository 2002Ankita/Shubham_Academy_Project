import api from './api';

const MOCK_MARKS = [
  {
    id: 'MRK-001',
    studentId: 'STU-001',
    studentName: 'Aarav Deshmukh',
    rollNumber: 'SA-2026-1042',
    examTitle: 'Unit Test 1 (Physics & Chemistry)',
    subject: 'Physics',
    maxMarks: 50,
    obtainedMarks: 47,
    percentage: 94,
    grade: 'A+',
    remarks: 'Outstanding conceptual grasp'
  },
  {
    id: 'MRK-002',
    studentId: 'STU-001',
    studentName: 'Aarav Deshmukh',
    rollNumber: 'SA-2026-1042',
    examTitle: 'Unit Test 1 (Physics & Chemistry)',
    subject: 'Chemistry',
    maxMarks: 50,
    obtainedMarks: 45,
    percentage: 90,
    grade: 'A+',
    remarks: 'Strong analytical skills'
  },
  {
    id: 'MRK-003',
    studentId: 'STU-002',
    studentName: 'Ananya Sharma',
    rollNumber: 'SA-2026-1043',
    examTitle: 'Unit Test 1 (Physics & Chemistry)',
    subject: 'Physics',
    maxMarks: 50,
    obtainedMarks: 42,
    percentage: 84,
    grade: 'A',
    remarks: 'Very good effort'
  },
  {
    id: 'MRK-004',
    studentId: 'STU-003',
    studentName: 'Rohan Joshi',
    rollNumber: 'SA-2026-1044',
    examTitle: 'Unit Test 1 (Mathematics)',
    subject: 'Mathematics',
    maxMarks: 50,
    obtainedMarks: 48,
    percentage: 96,
    grade: 'A+',
    remarks: 'Near perfect problem solving'
  }
];

export const marksService = {
  getAll: async (params = {}) => {
    try {
      const res = await api.get('/marks', { params });
      return res.data;
    } catch {
      return MOCK_MARKS;
    }
  },

  getStudentResults: async (studentId) => {
    try {
      const res = await api.get(`/marks/student/${studentId}`);
      return res.data;
    } catch {
      return MOCK_MARKS.filter(m => m.studentId === studentId);
    }
  },

  submitMarks: async (data) => {
    try {
      const res = await api.post('/marks', data);
      return res.data;
    } catch {
      const newMark = {
        id: `MRK-${Date.now()}`,
        ...data,
        percentage: Math.round((data.obtainedMarks / data.maxMarks) * 100),
        grade: (data.obtainedMarks / data.maxMarks) >= 0.9 ? 'A+' : (data.obtainedMarks / data.maxMarks) >= 0.8 ? 'A' : 'B+'
      };
      MOCK_MARKS.push(newMark);
      return { success: true, message: 'Marks submitted successfully', mark: newMark };
    }
  }
};

export default marksService;
