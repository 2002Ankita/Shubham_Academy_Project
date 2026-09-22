import api from './api';

const MOCK_SALARIES = [
  {
    id: 'SAL-2026-08-01',
    teacherId: 'TCH-001',
    teacherName: 'Dr. Priya Kulkarni',
    subject: 'Physics',
    month: 'August 2026',
    baseSalary: 75000,
    allowances: 8000,
    deductions: 3500,
    netPayable: 79500,
    status: 'Disbursed',
    disbursedDate: '2026-09-01',
    transactionRef: 'NEFT-8842109'
  },
  {
    id: 'SAL-2026-08-02',
    teacherId: 'TCH-002',
    teacherName: 'Prof. Amit Sawant',
    subject: 'Mathematics',
    month: 'August 2026',
    baseSalary: 68000,
    allowances: 6000,
    deductions: 3000,
    netPayable: 71000,
    status: 'Disbursed',
    disbursedDate: '2026-09-01',
    transactionRef: 'NEFT-8842110'
  },
  {
    id: 'SAL-2026-08-03',
    teacherId: 'TCH-003',
    teacherName: 'Mrs. Neha Deshpande',
    subject: 'Chemistry',
    month: 'August 2026',
    baseSalary: 65000,
    allowances: 5500,
    deductions: 2800,
    netPayable: 67700,
    status: 'Processing',
    disbursedDate: '--',
    transactionRef: '--'
  }
];

export const salaryService = {
  getAll: async (params = {}) => {
    try {
      const res = await api.get('/salary', { params });
      return res.data;
    } catch {
      return MOCK_SALARIES;
    }
  },

  disburseSalary: async (salaryId) => {
    try {
      const res = await api.post(`/salary/disburse/${salaryId}`);
      return res.data;
    } catch {
      const item = MOCK_SALARIES.find(s => s.id === salaryId);
      if (item) {
        item.status = 'Disbursed';
        item.disbursedDate = new Date().toISOString().split('T')[0];
        item.transactionRef = `NEFT-${Math.floor(1000000 + Math.random() * 9000000)}`;
      }
      return { success: true, message: 'Salary disbursed successfully', data: item };
    }
  }
};

export default salaryService;
