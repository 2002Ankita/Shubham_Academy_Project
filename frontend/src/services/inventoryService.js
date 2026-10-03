import api from './api';

export const inventoryService = {
  getItems: async () => {
    const res = await api.get('/inventory/items');
    return res.data;
  },
  
  createItem: async (data) => {
    const res = await api.post('/inventory/items', data);
    return res.data;
  },

  getDeliveries: async () => {
    const res = await api.get('/inventory/deliveries');
    return res.data.map(d => ({
      ...d,
      studentName: d.student_name,
      rollNumber: d.roll_number,
      bookTitle: d.book_title,
      verifiedBy: d.verified_by
    }));
  },

  createDelivery: async (data) => {
    const res = await api.post('/inventory/deliveries', data);
    return res.data;
  },

  updateDeliveryStatus: async (id, status, verifiedBy) => {
    const payload = { status, verified_by: verifiedBy };
    const res = await api.put(`/inventory/deliveries/${id}`, payload);
    return res.data;
  }
};

export default inventoryService;
