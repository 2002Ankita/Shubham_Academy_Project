import api from './api';

export const noticeService = {
  getAll: async (params = {}) => {
    const res = await api.get('/notices', { params });
    return res.data.map(n => ({
      ...n,
      targetAudience: n.target_audiences?.[0] || 'All',
      publishedDate: n.created_at?.split('T')[0],
      author: n.created_by_name || 'Admin'
    }));
  },

  create: async (data) => {
    const payload = {
      title: data.title,
      content: data.content,
      category: data.category,
      priority: data.priority,
      target_audiences: [data.targetAudience || 'All Students & Teachers']
    };
    const res = await api.post('/notices', payload);
    return {
      ...res.data,
      targetAudience: res.data.target_audiences[0],
      publishedDate: res.data.created_at?.split('T')[0]
    };
  },

  delete: async (id) => {
    const res = await api.delete(`/notices/${id}`);
    return res.data;
  }
};

export default noticeService;
