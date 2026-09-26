import api from './api';

const MOCK_NOTICES = [
  {
    id: 'NOT-001',
    title: 'Upcoming Mid-Term Examination Schedule Published',
    category: 'Examinations',
    priority: 'High',
    targetAudience: 'All Students & Teachers',
    publishedDate: '2026-09-18',
    content: 'The official schedule for the Mid-Term Assessment 2026 has been published. All students must collect their hall tickets from the administrative office before October 1st.',
    author: 'Principal Office'
  },
  {
    id: 'NOT-002',
    title: 'Parent-Teacher Meeting for Class 10th & 12th',
    category: 'Academic',
    priority: 'Normal',
    targetAudience: 'Parents & Teachers',
    publishedDate: '2026-09-15',
    content: 'A comprehensive PTM will be conducted this Saturday from 10:00 AM to 2:00 PM to review student progress and attendance records.',
    author: 'Academic Coordinator'
  },
  {
    id: 'NOT-003',
    title: 'Study Material Volume 3 Available for Collection',
    category: 'Study Materials',
    priority: 'Normal',
    targetAudience: '12th Science Students',
    publishedDate: '2026-09-10',
    content: 'Physical copies of the Organic Chemistry and Electrostatics Question Banks are ready for pickup at the Library counter upon barcode scanning.',
    author: 'Library Department'
  }
];

export const noticeService = {
  getAll: async (params = {}) => {
    try {
      const res = await api.get('/notices', { params });
      return res.data.map(n => ({
        ...n,
        targetAudience: n.target_audiences?.[0] || 'All',
        publishedDate: n.created_at?.split('T')[0],
        category: 'General',
        priority: 'Normal'
      }));
    } catch {
      return MOCK_NOTICES;
    }
  },

  create: async (data) => {
    try {
      const payload = {
        title: data.title,
        content: data.content,
        target_audiences: [data.targetAudience || 'All Students & Teachers']
      };
      const res = await api.post('/notices', payload);
      return {
        ...res.data,
        targetAudience: res.data.target_audiences[0],
        publishedDate: res.data.created_at?.split('T')[0]
      };
    } catch {
      const newNotice = {
        ...data,
        id: `NOT-${String(MOCK_NOTICES.length + 1).padStart(3, '0')}`,
        publishedDate: new Date().toISOString().split('T')[0],
        author: data.author || 'Academy Administration'
      };
      MOCK_NOTICES.unshift(newNotice);
      return newNotice;
    }
  },

  delete: async (id) => {
    try {
      const res = await api.delete(`/notices/${id}`);
      return res.data;
    } catch {
      const idx = MOCK_NOTICES.findIndex(n => n.id === id);
      if (idx !== -1) MOCK_NOTICES.splice(idx, 1);
      return { success: true };
    }
  }
};

export default noticeService;
