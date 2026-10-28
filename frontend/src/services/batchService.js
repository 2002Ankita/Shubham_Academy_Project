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
      if (!data || data.length === 0) {
        // Fallback default batches for offline/demo mode with correct branch assignments
        const mpBatches = MANGALVAR_BATCHES.map((name, idx) => ({
          id: `batch-seed-mp-${idx + 1}`,
          name: name,
          standard: name.includes('12th') ? '12th Science' : '11th Science',
          subject: 'Physics, Chemistry, Mathematics',
          room: `Room ${101 + idx} (Mangalvar Peth)`,
          time: idx % 2 === 0 ? '08:00 AM – 10:30 AM' : '10:30 AM – 01:00 PM',
          student_count: 24 + (idx * 2),
          teacher_name: 'Dr. Priya Kulkarni',
          branch: 'Mangalvar Peth'
        }));
        const tpBatches = TARABAI_BATCHES.map((name, idx) => ({
          id: `batch-seed-tp-${idx + 1}`,
          name: name,
          standard: name.includes('12th') ? '12th Science' : '11th Science',
          subject: 'Physics, Chemistry, Mathematics',
          room: `Room ${201 + idx} (Tarabai Park)`,
          time: idx % 2 === 0 ? '09:00 AM – 11:30 AM' : '02:00 PM – 04:30 PM',
          student_count: 26 + (idx * 2),
          teacher_name: 'Prof. Rajesh Sharma',
          branch: 'Tarabai Park'
        }));
        const allFallback = [...mpBatches, ...tpBatches];
        if (activeBranch && activeBranch !== 'ALL' && activeBranch !== 'All') {
          return filterBatchesByBranch(allFallback, activeBranch);
        }
        return allFallback;
      }
      return data;
    } catch (err) {
      console.warn('Batch fetch error, using branch fallback:', err.message);
      const mpBatches = MANGALVAR_BATCHES.map((name, idx) => ({
        id: `batch-seed-mp-${idx + 1}`,
        name: name,
        standard: name.includes('12th') ? '12th Science' : '11th Science',
        subject: 'Physics, Chemistry, Mathematics',
        room: `Room ${101 + idx} (Mangalvar Peth)`,
        time: idx % 2 === 0 ? '08:00 AM – 10:30 AM' : '10:30 AM – 01:00 PM',
        student_count: 24 + (idx * 2),
        teacher_name: 'Dr. Priya Kulkarni',
        branch: 'Mangalvar Peth'
      }));
      const tpBatches = TARABAI_BATCHES.map((name, idx) => ({
        id: `batch-seed-tp-${idx + 1}`,
        name: name,
        standard: name.includes('12th') ? '12th Science' : '11th Science',
        subject: 'Physics, Chemistry, Mathematics',
        room: `Room ${201 + idx} (Tarabai Park)`,
        time: idx % 2 === 0 ? '09:00 AM – 11:30 AM' : '02:00 PM – 04:30 PM',
        student_count: 26 + (idx * 2),
        teacher_name: 'Prof. Rajesh Sharma',
        branch: 'Tarabai Park'
      }));
      const allFallback = [...mpBatches, ...tpBatches];
      if (activeBranch && activeBranch !== 'ALL' && activeBranch !== 'All') {
        return filterBatchesByBranch(allFallback, activeBranch);
      }
      return allFallback;
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
