import api from './api';

const STORAGE_TOPICS_KEY = 'sa_teacher_topic_plans';
const STORAGE_ACTIVITIES_KEY = 'sa_teacher_daily_activities';

export const curriculumService = {
  // -------------------------------------------------------------
  // DAILY TEACHER ACTIVITIES
  // -------------------------------------------------------------

  // Get all daily activities with optional query params
  getDailyActivities: async (params = {}) => {
    try {
      const res = await api.get('/daily-activities', { params });
      if (Array.isArray(res.data) && res.data.length > 0) {
        localStorage.setItem(STORAGE_ACTIVITIES_KEY, JSON.stringify(res.data));
        return res.data;
      }
    } catch (err) {
      console.warn('Backend daily-activities fetch failed, using local storage fallback:', err);
    }

    try {
      const saved = localStorage.getItem(STORAGE_ACTIVITIES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  },

  // Create a new daily activity
  createDailyActivity: async (data) => {
    try {
      const res = await api.post('/daily-activities', data);
      return res.data;
    } catch (err) {
      console.warn('Backend create daily-activity failed, saving locally:', err);
      const localItem = { id: `ACT-${Date.now()}`, ...data, created_at: new Date().toISOString() };
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_ACTIVITIES_KEY) || '[]');
        const updated = [localItem, ...saved];
        localStorage.setItem(STORAGE_ACTIVITIES_KEY, JSON.stringify(updated));
      } catch (_) {}
      return localItem;
    }
  },

  // Update a daily activity
  updateDailyActivity: async (id, data) => {
    try {
      const res = await api.put(`/daily-activities/${id}`, data);
      return res.data;
    } catch (err) {
      console.warn('Backend update daily-activity failed, updating locally:', err);
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_ACTIVITIES_KEY) || '[]');
        const updated = saved.map((item) => (item.id === id ? { ...item, ...data } : item));
        localStorage.setItem(STORAGE_ACTIVITIES_KEY, JSON.stringify(updated));
      } catch (_) {}
      return { id, ...data };
    }
  },

  // Delete a daily activity
  deleteDailyActivity: async (id) => {
    try {
      await api.delete(`/daily-activities/${id}`);
    } catch (err) {
      console.warn('Backend delete daily-activity failed, removing locally:', err);
    }
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_ACTIVITIES_KEY) || '[]');
      const updated = saved.filter((item) => item.id !== id);
      localStorage.setItem(STORAGE_ACTIVITIES_KEY, JSON.stringify(updated));
    } catch (_) {}
    return { success: true };
  },

  // -------------------------------------------------------------
  // TOPIC DURATION & PERIOD ALLOCATION MATRIX
  // -------------------------------------------------------------

  // Get all topic duration plans
  getTopicDurations: async (params = {}) => {
    try {
      const res = await api.get('/topic-durations', { params });
      if (Array.isArray(res.data) && res.data.length > 0) {
        localStorage.setItem(STORAGE_TOPICS_KEY, JSON.stringify(res.data));
        return res.data;
      }
    } catch (err) {
      console.warn('Backend topic-durations fetch failed, using local fallback:', err);
    }

    try {
      const saved = localStorage.getItem(STORAGE_TOPICS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  },

  // Get Academic Admin Matrix (Subject + Faculty + Batch)
  getTopicDurationMatrix: async ({ subject, teacher, batch, month, academicYear }) => {
    try {
      const res = await api.get('/topic-durations/matrix', {
        params: {
          subject,
          teacher,
          batch,
          month: month || 'All',
          academic_year: academicYear || '2026-2027'
        }
      });
      return res.data;
    } catch (err) {
      console.warn('Backend matrix endpoint error, using local computation:', err);
      return null;
    }
  },

  // Create a new topic duration plan
  createTopicDuration: async (data) => {
    try {
      const res = await api.post('/topic-durations', data);
      return res.data;
    } catch (err) {
      console.warn('Backend create topic-duration failed, saving locally:', err);
      const localItem = { id: `TOPIC-${Date.now()}`, ...data };
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_TOPICS_KEY) || '[]');
        const updated = [localItem, ...saved];
        localStorage.setItem(STORAGE_TOPICS_KEY, JSON.stringify(updated));
      } catch (_) {}
      return localItem;
    }
  },

  // Update a topic duration plan
  updateTopicDuration: async (id, data) => {
    try {
      const res = await api.put(`/topic-durations/${id}`, data);
      return res.data;
    } catch (err) {
      console.warn('Backend update topic-duration failed, updating locally:', err);
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_TOPICS_KEY) || '[]');
        const updated = saved.map((item) => (item.id === id ? { ...item, ...data } : item));
        localStorage.setItem(STORAGE_TOPICS_KEY, JSON.stringify(updated));
      } catch (_) {}
      return { id, ...data };
    }
  },

  // Delete a topic duration plan
  deleteTopicDuration: async (id) => {
    try {
      await api.delete(`/topic-durations/${id}`);
    } catch (err) {
      console.warn('Backend delete topic-duration failed, removing locally:', err);
    }
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_TOPICS_KEY) || '[]');
      const updated = saved.filter((item) => item.id !== id);
      localStorage.setItem(STORAGE_TOPICS_KEY, JSON.stringify(updated));
    } catch (_) {}
    return { success: true };
  },

  // Seed default curriculum data on server
  seedCurriculumDatabase: async () => {
    try {
      const res = await api.post('/topic-durations/seed');
      return res.data;
    } catch (err) {
      console.warn('Seeding backend error:', err);
      return null;
    }
  }
};

export default curriculumService;
