import api from './api';

const PASSOUT_STORAGE_KEY = 'sa_passout_students_v1';

const getLocalPassouts = () => {
  try {
    const raw = localStorage.getItem(PASSOUT_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveLocalPassouts = (items) => {
  try {
    localStorage.setItem(PASSOUT_STORAGE_KEY, JSON.stringify(items || []));
  } catch (e) {
    console.warn('Could not cache passout students:', e);
  }
};

const passoutService = {
  getAll: async (params = {}) => {
    try {
      const res = await api.get('/passout-students', { params });
      const data = Array.isArray(res.data) ? res.data : [];
      saveLocalPassouts(data);
      return data;
    } catch (err) {
      console.warn('Fallback to cached passout students:', err);
      return getLocalPassouts();
    }
  },

  create: async (payload) => {
    const res = await api.post('/passout-students', payload);
    return res.data;
  },

  update: async (id, payload) => {
    const res = await api.put(`/passout-students/${id}`, payload);
    return res.data;
  },

  remove: async (id) => {
    const res = await api.delete(`/passout-students/${id}`);
    return res.data;
  },

  getLogs: async (id) => {
    const res = await api.get(`/passout-students/${id}/logs`);
    return res.data;
  }
};

export default passoutService;
