import api from './api';

export const salaryService = {
  getAll: async (params = {}) => {
    try {
      const res = await api.get('/salary', { params });
      return res.data;
    } catch {
      return [];
    }
  },

  updateSalary: async (salaryId, allowances, deductions) => {
    const res = await api.put(`/salary/${salaryId}`, { allowances, deductions });
    return res.data;
  },

  disburseSalary: async (salaryId) => {
    const res = await api.post(`/salary/disburse/${salaryId}`);
    return res.data;
  },

  generateDrafts: async (monthName) => {
    const res = await api.post(`/salary/generate/${encodeURIComponent(monthName)}`);
    return res.data;
  }
};

export default salaryService;
