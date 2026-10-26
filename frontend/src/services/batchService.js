import api from './api';
import { getUserBranch, filterBatchesByBranch, MANGALVAR_BATCHES, TARABAI_BATCHES } from '../utils/branchUtils';

const batchService = {
  getBatches: async (params = {}) => {
    const activeBranch = params?.branch !== undefined ? params.branch : getUserBranch();
    try {
      const response = await api.get('/batches', { params });
      let data = response.data || [];
      if (activeBranch && activeBranch !== 'ALL' && activeBranch !== 'All' && Array.isArray(data)) {
        data = filterBatchesByBranch(data, activeBranch);
      }
      if ((!data || data.length === 0) && activeBranch) {
        // Fallback default batches for offline/demo mode
        const defaultNames = activeBranch === 'Mangalvar Peth' ? MANGALVAR_BATCHES : TARABAI_BATCHES;
        return defaultNames.map((name, idx) => ({
          id: `batch-seed-${idx + 1}`,
          name: name,
          standard: name.includes('12th') ? '12th Science' : '11th Science',
          subject: 'Comprehensive Science',
          room: `Room ${101 + idx} (${activeBranch})`,
          time: '08:00 AM – 10:30 AM',
          student_count: 24,
          teacher_name: 'Dr. Priya Kulkarni',
          branch: activeBranch
        }));
      }
      return data;
    } catch (err) {
      console.warn('Batch fetch error, using branch fallback:', err.message);
      const defaultNames = activeBranch === 'Mangalvar Peth' ? MANGALVAR_BATCHES : (activeBranch === 'Tarabai Park' ? TARABAI_BATCHES : [...MANGALVAR_BATCHES, ...TARABAI_BATCHES]);
      return defaultNames.map((name, idx) => ({
        id: `batch-seed-${idx + 1}`,
        name: name,
        standard: name.includes('12th') ? '12th Science' : '11th Science',
        subject: 'Comprehensive Science',
        room: `Room ${101 + idx} (${activeBranch || 'Academy'})`,
        time: '08:00 AM – 10:30 AM',
        student_count: 24,
        teacher_name: 'Dr. Priya Kulkarni',
        branch: activeBranch || 'Academy'
      }));
    }
  },

  getMyClasses: async () => {
    const response = await api.get('/batches/my-classes');
    return response.data;
  },

  getBatchStudents: async (id) => {
    const response = await api.get(`/batches/${id}/students`);
    return response.data;
  },

  createBatch: async (data) => {
    const response = await api.post('/batches', data);
    return response.data;
  },

  updateBatch: async (id, data) => {
    const response = await api.put(`/batches/${id}`, data);
    return response.data;
  },

  deleteBatch: async (id) => {
    const response = await api.delete(`/batches/${id}`);
    return response.data;
  },

  importTimetable: async (timetableSlots) => {
    const response = await api.post('/batches/timetable/import', timetableSlots);
    return response.data;
  },

  addTimetableSlot: async (slot) => {
    const response = await api.post('/batches/timetable/import', [slot]);
    return response.data;
  },

  deleteTimetableSlot: async (slotData) => {
    const response = await api.post('/batches/timetable/delete-slot', slotData);
    return response.data;
  }
};

export default batchService;
