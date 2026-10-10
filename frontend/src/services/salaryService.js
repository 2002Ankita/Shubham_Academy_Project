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

  getMySalaries: async () => {
    try {
      const res = await api.get('/salary/me');
      return res.data;
    } catch {
      return [];
    }
  },

  updateSalary: async (salaryId, baseSalary, allowances, deductions, netPayable) => {
    const res = await api.put(`/salary/${salaryId}`, { baseSalary, allowances, deductions, netPayable });
    return res.data;
  },

  disburseSalary: async (salaryId, amount = null) => {
    const res = await api.post(`/salary/disburse/${salaryId}`, { amount });
    return res.data;
  },

  generateDrafts: async (monthName) => {
    const res = await api.post(`/salary/generate/${encodeURIComponent(monthName)}`);
    return res.data;
  }
};

export default salaryService;
