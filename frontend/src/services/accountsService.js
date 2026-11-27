import api from './api';

export const accountsService = {
  verify: async ({ accounts_id, password, branch }) => {
    const res = await api.post('/accounts/verify', { accounts_id, password, branch });
    return res.data;
  },

  getInfo: async (branch) => {
    const res = await api.get('/accounts/info', { params: { branch } });
    return res.data;
  },

  getSummary: async (branch, month, academic_year) => {
    const res = await api.get('/accounts/summary', { params: { branch, month, academic_year } });
    return res.data;
  }
};

export default accountsService;
