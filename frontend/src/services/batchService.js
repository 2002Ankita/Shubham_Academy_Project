import api from './api';

const batchService = {
  getBatches: async (params = {}) => {
    const response = await api.get('/batches', { params });
    return response.data;
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
