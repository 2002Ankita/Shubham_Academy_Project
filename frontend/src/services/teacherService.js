import api from './api';

const MOCK_TEACHERS = [
  {
    id: 'TCH-001',
    name: 'Dr. Priya Kulkarni',
    email: 'priya.k@shubham.edu',
    phone: '+91 98220 11223',
    subject: 'Physics',
    qualification: 'Ph.D in Applied Physics',
    experience: '12 Years',
    assignedClasses: ['12th Science - Alpha', '11th Science - Beta'],
    monthlySalary: 75000,
    status: 'Active',
    joinDate: '2021-06-15'
  },
  {
    id: 'TCH-002',
    name: 'Prof. Amit Sawant',
    email: 'amit.s@shubham.edu',
    phone: '+91 98220 33445',
    subject: 'Mathematics',
    qualification: 'M.Sc Mathematics, B.Ed',
    experience: '9 Years',
    assignedClasses: ['12th Science - Alpha', '12th Commerce'],
    monthlySalary: 68000,
    status: 'Active',
    joinDate: '2022-04-10'
  },
  {
    id: 'TCH-003',
    name: 'Mrs. Neha Deshpande',
    email: 'neha.d@shubham.edu',
    phone: '+91 98220 55667',
    subject: 'Chemistry',
    qualification: 'M.Sc Organic Chemistry',
    experience: '8 Years',
    assignedClasses: ['11th Science - Beta', '12th Science - Alpha'],
    monthlySalary: 65000,
    status: 'Active',
    joinDate: '2022-08-01'
  },
  {
    id: 'TCH-004',
    name: 'Prof. Ramesh Shinde',
    email: 'ramesh.s@shubham.edu',
    phone: '+91 98220 77889',
    subject: 'Biology',
    qualification: 'M.Sc Botany, CSIR-NET',
    experience: '11 Years',
    assignedClasses: ['12th NEET Special', '11th NEET'],
    monthlySalary: 72000,
    status: 'Active',
    joinDate: '2020-09-01'
  }
];

export const teacherService = {
  getAll: async (params = {}) => {
    try {
      const res = await api.get('/teachers', { params });
      return res.data;
    } catch {
      return MOCK_TEACHERS;
    }
  },

  getById: async (id) => {
    try {
      const res = await api.get(`/teachers/${id}`);
      return res.data;
    } catch {
      return MOCK_TEACHERS.find(t => t.id === id) || MOCK_TEACHERS[0];
    }
  },

  create: async (data) => {
    try {
      const res = await api.post('/teachers', data);
      return res.data;
    } catch {
      const newTeacher = {
        ...data,
        id: `TCH-${String(MOCK_TEACHERS.length + 1).padStart(3, '0')}`,
        status: 'Active',
        assignedClasses: data.assignedClasses || ['11th Science']
      };
      MOCK_TEACHERS.unshift(newTeacher);
      return newTeacher;
    }
  },

  update: async (id, data) => {
    try {
      const res = await api.put(`/teachers/${id}`, data);
      return res.data;
    } catch {
      const idx = MOCK_TEACHERS.findIndex(t => t.id === id);
      if (idx !== -1) {
        MOCK_TEACHERS[idx] = { ...MOCK_TEACHERS[idx], ...data };
        return MOCK_TEACHERS[idx];
      }
      return data;
    }
  },

  delete: async (id) => {
    try {
      const res = await api.delete(`/teachers/${id}`);
      return res.data;
    } catch {
      return { success: true, message: `Teacher ${id} deleted` };
    }
  }
};

export default teacherService;
