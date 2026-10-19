import api from './api';

const mapTeacher = (teacher) => {
  if (!teacher) return null;
  let joinDate = 'N/A';
  if (teacher.joining_date) {
    try {
      joinDate = typeof teacher.joining_date === 'string'
        ? teacher.joining_date.split('T')[0]
        : new Date(teacher.joining_date).toISOString().split('T')[0];
    } catch {
      joinDate = 'N/A';
    }
  }

  return {
    ...teacher,
    name: teacher.full_name || '--',
    phone: teacher.mobile_number || '--',
    subject: (Array.isArray(teacher.subjects) && teacher.subjects.length > 0)
      ? teacher.subjects[0]
      : (teacher.subject || 'N/A'),
    qualification: teacher.qualification || 'Qualified Faculty',
    experience: teacher.experience || 'N/A',
    assignedClasses: teacher.assigned_batches || [],
    monthlySalary: teacher.hourly_rate ? teacher.hourly_rate * 160 : 0,
    status: teacher.status || 'Active',
    joinDate
  };
};

export const teacherService = {
  getAll: async (params = {}) => {
    const res = await api.get('/teachers', { params });
    const list = Array.isArray(res.data) ? res.data : (res.data ? [res.data] : []);
    return list.map(mapTeacher);
  },

  getMe: async () => {
    const res = await api.get('/teachers/me');
    return mapTeacher(res.data);
  },

  getById: async (id) => {
    const res = await api.get(`/teachers/${id}`);
    return mapTeacher(res.data);
  },

  create: async (data) => {
    const payload = {
      full_name: data.name || data.full_name,
      email: data.email,
      password: data.password,
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
