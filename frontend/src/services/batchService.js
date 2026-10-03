import api from './api';

const batchService = {
  getBatches: async () => {
    const response = await api.get('/batches');
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
  }
};

export default batchService;
