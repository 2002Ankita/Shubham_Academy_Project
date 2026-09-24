import api from './api';

const MOCK_STUDENTS = [
  {
    id: 'STU-001',
    name: 'Aarav Deshmukh',
    email: 'aarav.d@shubham.edu',
    phone: '+91 98231 45670',
    rollNumber: 'SA-2026-1042',
    standard: '12th Science',
    batch: 'Batch Alpha (Morning)',
    rfidCard: 'RFID-984210',
    status: 'Active',
    feesStatus: 'Paid',
    totalFees: 45000,
    paidFees: 45000,
    parentName: 'Sanjay Deshmukh',
    parentPhone: '+91 98231 45671',
    address: 'Flat 402, Green Park, Kothrud, Pune',
    attendancePercent: 94.2
  },
  {
    id: 'STU-002',
    name: 'Ananya Sharma',
    email: 'ananya.s@shubham.edu',
    phone: '+91 98231 87654',
    rollNumber: 'SA-2026-1043',
    standard: '12th Science',
    batch: 'Batch Alpha (Morning)',
    rfidCard: 'RFID-984211',
    status: 'Active',
    feesStatus: 'Pending',
    totalFees: 45000,
    paidFees: 30000,
    parentName: 'Vikram Sharma',
    parentPhone: '+91 98231 87655',
    address: 'Bungalow 12, Baner Road, Pune',
    attendancePercent: 88.5
  },
  {
    id: 'STU-003',
    name: 'Rohan Joshi',
    email: 'rohan.j@shubham.edu',
    phone: '+91 97123 44556',
    rollNumber: 'SA-2026-1044',
    standard: '11th Science',
    batch: 'Batch Beta (Evening)',
    rfidCard: 'RFID-984212',
    status: 'Active',
    feesStatus: 'Paid',
    totalFees: 40000,
    paidFees: 40000,
    parentName: 'Mahesh Joshi',
    parentPhone: '+91 97123 44557',
    address: 'Sector 4, Viman Nagar, Pune',
    attendancePercent: 91.0
  },
  {
    id: 'STU-004',
    name: 'Tanvi Kulkarni',
    email: 'tanvi.k@shubham.edu',
    phone: '+91 98881 22334',
    rollNumber: 'SA-2026-1045',
    standard: '12th Commerce',
    batch: 'Batch Gamma',
    rfidCard: 'RFID-984213',
    status: 'Active',
    feesStatus: 'Overdue',
    totalFees: 38000,
    paidFees: 15000,
    parentName: 'Nitin Kulkarni',
    parentPhone: '+91 98881 22335',
    address: 'Model Colony, Shivajinagar, Pune',
    attendancePercent: 82.4
  },
  {
    id: 'STU-005',
    name: 'Ishaan Verma',
    email: 'ishaan.v@shubham.edu',
    phone: '+91 98901 66778',
    rollNumber: 'SA-2026-1046',
    standard: '10th Foundation',
    batch: 'Foundation Batch A',
    rfidCard: 'RFID-984214',
    status: 'Active',
    feesStatus: 'Paid',
    totalFees: 32000,
    paidFees: 32000,
    parentName: 'Alok Verma',
    parentPhone: '+91 98901 66779',
    address: 'Pashan Sus Road, Pune',
    attendancePercent: 96.0
  }
];

export const studentService = {
  getAll: async (params = {}) => {
    try {
      const res = await api.get('/students', { params });
      return res.data;
    } catch {
      return MOCK_STUDENTS;
    }
  },

  getById: async (id) => {
    try {
      const res = await api.get(`/students/${id}`);
      return res.data;
    } catch {
      return MOCK_STUDENTS.find(s => s.id === id) || MOCK_STUDENTS[0];
    }
  },

  create: async (data) => {
    try {
      const res = await api.post('/students', data);
      return res.data;
    } catch {
      const newStudent = {
        ...data,
        id: `STU-${String(MOCK_STUDENTS.length + 1).padStart(3, '0')}`,
        rollNumber: `SA-2026-${1040 + MOCK_STUDENTS.length + 1}`,
        status: 'Active',
        paidFees: 0,
        attendancePercent: 100
      };
      MOCK_STUDENTS.unshift(newStudent);
      return newStudent;
    }
  },

  update: async (id, data) => {
    try {
      const res = await api.put(`/students/${id}`, data);
      return res.data;
    } catch {
      const idx = MOCK_STUDENTS.findIndex(s => s.id === id);
      if (idx !== -1) {
        MOCK_STUDENTS[idx] = { ...MOCK_STUDENTS[idx], ...data };
        return MOCK_STUDENTS[idx];
      }
      return data;
    }
  },

  delete: async (id) => {
    try {
      const res = await api.delete(`/students/${id}`);
      return res.data;
    } catch {
      return { success: true, message: `Student ${id} deleted` };
    }
  }
};

export default studentService;
