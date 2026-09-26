import api from './api';

export const studentService = {
  getAll: async (params = {}) => {
    const res = await api.get('/students', { params });
    // Map backend response fields to frontend expectations if necessary
    return res.data.map(student => ({
      ...student,
      name: student.full_name,
      phone: student.mobile_number,
      parentPhone: student.parent_mobile,
      standard: student.course,
      status: student.is_active !== false ? 'Active' : 'Inactive',
      // Provide defaults for missing frontend-specific mock fields
      rollNumber: student.student_id || 'N/A',
      feesStatus: 'Unknown',
      totalFees: 0,
      paidFees: 0,
      attendancePercent: 0
    }));
  },

  getById: async (id) => {
    const res = await api.get(`/students/${id}`);
    const student = res.data;
    return {
      ...student,
      name: student.full_name,
      phone: student.mobile_number,
      parentPhone: student.parent_mobile,
      standard: student.course,
      status: student.is_active !== false ? 'Active' : 'Inactive',
      rollNumber: student.student_id || 'N/A'
    };
  },

  create: async (data) => {
    // Map frontend data to backend payload
    const payload = {
      full_name: data.name || data.full_name,
      email: data.email,
      mobile_number: data.phone || data.mobile_number,
      date_of_birth: data.date_of_birth || new Date().toISOString(),
      gender: data.gender || 'Male',
      address: data.address || '',
      parent_name: data.parentName || data.parent_name || '',
      parent_mobile: data.parentPhone || data.parent_mobile || '',
      course: data.standard || data.course,
      batch: data.batch,
      academic_year: data.academic_year || '2023-2024'
    };
    const res = await api.post('/students', payload);
    return res.data;
  },

  update: async (id, data) => {
    const payload = { ...data };
    if (data.name) payload.full_name = data.name;
    if (data.phone) payload.mobile_number = data.phone;
    if (data.parentPhone) payload.parent_mobile = data.parentPhone;
    if (data.standard) payload.course = data.standard;
    
    const res = await api.put(`/students/${id}`, payload);
    return res.data;
  },

  delete: async (id) => {
    const res = await api.delete(`/students/${id}`);
    return res.data;
  }
};

export default studentService;
