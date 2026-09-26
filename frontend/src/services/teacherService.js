import api from './api';

export const teacherService = {
  getAll: async (params = {}) => {
    const res = await api.get('/teachers', { params });
    return res.data.map(teacher => ({
      ...teacher,
      name: teacher.full_name,
      phone: teacher.mobile_number,
      subject: teacher.subjects?.[0] || 'N/A',
      qualification: 'N/A', // Backend doesn't store this yet
      experience: 'N/A', // Backend doesn't store this yet
      assignedClasses: teacher.assigned_batches || [],
      monthlySalary: teacher.hourly_rate * 160 || 0, // Mocking monthly from hourly
      status: teacher.status || 'Active',
      joinDate: teacher.joining_date?.split('T')[0] || 'N/A'
    }));
  },

  getById: async (id) => {
    const res = await api.get(`/teachers/${id}`);
    const teacher = res.data;
    return {
      ...teacher,
      name: teacher.full_name,
      phone: teacher.mobile_number,
      subject: teacher.subjects?.[0] || 'N/A',
      qualification: 'N/A',
      experience: 'N/A',
      assignedClasses: teacher.assigned_batches || [],
      monthlySalary: teacher.hourly_rate * 160 || 0,
      status: teacher.status || 'Active',
      joinDate: teacher.joining_date?.split('T')[0] || 'N/A'
    };
  },

  create: async (data) => {
    const payload = {
      full_name: data.name || data.full_name,
      email: data.email,
      mobile_number: data.phone || data.mobile_number,
      subjects: [data.subject || 'General'],
      assigned_batches: data.assignedClasses || [],
      hourly_rate: data.monthlySalary ? data.monthlySalary / 160 : 50.0
    };
    const res = await api.post('/teachers', payload);
    return res.data;
  },

  update: async (id, data) => {
    const payload = { ...data };
    if (data.name) payload.full_name = data.name;
    if (data.phone) payload.mobile_number = data.phone;
    if (data.subject) payload.subjects = [data.subject];
    if (data.assignedClasses) payload.assigned_batches = data.assignedClasses;
    if (data.monthlySalary) payload.hourly_rate = data.monthlySalary / 160;

    const res = await api.put(`/teachers/${id}`, payload);
    return res.data;
  },

  delete: async (id) => {
    const res = await api.delete(`/teachers/${id}`);
    return res.data;
  }
};

export default teacherService;
