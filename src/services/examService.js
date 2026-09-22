import api from './api';

const MOCK_EXAMS = [
  {
    id: 'EXAM-101',
    title: 'Mid-Term Assessment 2026',
    standard: '12th Science',
    subject: 'Physics',
    date: '2026-10-05',
    startTime: '10:00 AM',
    duration: '3 Hours',
    maxMarks: 100,
    passingMarks: 35,
    roomNo: 'Hall A & B',
    status: 'Scheduled'
  },
  {
    id: 'EXAM-102',
    title: 'Mid-Term Assessment 2026',
    standard: '12th Science',
    subject: 'Chemistry',
    date: '2026-10-07',
    startTime: '10:00 AM',
    duration: '3 Hours',
    maxMarks: 100,
    passingMarks: 35,
    roomNo: 'Hall A & B',
    status: 'Scheduled'
  },
  {
    id: 'EXAM-103',
    title: 'Mid-Term Assessment 2026',
    standard: '12th Science',
    subject: 'Mathematics',
    date: '2026-10-09',
    startTime: '10:00 AM',
    duration: '3 Hours',
    maxMarks: 100,
    passingMarks: 35,
    roomNo: 'Hall A & B',
    status: 'Scheduled'
  },
  {
    id: 'EXAM-104',
    title: 'Unit Test 1 (Physics & Chemistry)',
    standard: '12th Science',
    subject: 'Physics',
    date: '2026-08-20',
    startTime: '09:00 AM',
    duration: '1.5 Hours',
    maxMarks: 50,
    passingMarks: 18,
    roomNo: 'Classroom 4',
    status: 'Completed'
  }
];

export const examService = {
  getAll: async (params = {}) => {
    try {
      const res = await api.get('/exams', { params });
      return res.data;
    } catch {
      return MOCK_EXAMS;
    }
  },

  create: async (data) => {
    try {
      const res = await api.post('/exams', data);
      return res.data;
    } catch {
      const newExam = {
        ...data,
        id: `EXAM-${Math.floor(100 + Math.random() * 900)}`,
        status: 'Scheduled'
      };
      MOCK_EXAMS.unshift(newExam);
      return newExam;
    }
  },

  delete: async (id) => {
    try {
      const res = await api.delete(`/exams/${id}`);
      return res.data;
    } catch {
      const idx = MOCK_EXAMS.findIndex(e => e.id === id);
      if (idx !== -1) MOCK_EXAMS.splice(idx, 1);
      return { success: true };
    }
  }
};

export default examService;
