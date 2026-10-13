import api from './api';

export const inventoryService = {
  getItems: async () => {
    const res = await api.get('/inventory/items');
    return (res.data || []).map(item => ({
      id: item.id,
      title: item.title,
      category: item.category || 'Theory',
      standard: item.standard,
      subject: item.subject || 'General',
      inStock: item.in_stock,
      totalStock: item.total_stock || item.in_stock,
      reorderLevel: item.reorder_level,
      unitCost: item.unit_cost
    }));
  },
  
  createItem: async (data) => {
    const res = await api.post('/inventory/items', data);
    return res.data;
  },

  updateItem: async (id, data) => {
    const res = await api.put(`/inventory/items/${id}`, data);
    return res.data;
  },

  adjustStock: async (id, delta) => {
    const res = await api.post(`/inventory/items/${id}/adjust-stock`, { delta });
    return res.data;
  },

  restockItem: async (id, quantity) => {
    const res = await api.post(`/inventory/items/${id}/restock`, { quantity: Number(quantity) });
    return res.data;
  },

  getDeliveries: async (studentId = null) => {
    const url = studentId ? `/inventory/deliveries?student_id=${encodeURIComponent(studentId)}` : '/inventory/deliveries';
    const res = await api.get(url);
    return (res.data || []).map(d => ({
      ...d,
      id: d.id,
      itemId: d.item_id,
      bookTitle: d.book_title || '',
      category: d.category || 'Theory',
      subject: d.subject || 'General',
      availableStock: d.available_stock,
      quantity: d.quantity || 1,
      studentName: d.handed_over_to || d.student_name || 'Student',
      rollNumber: d.roll_number || d.student_roll_no || 'N/A',
      handedOverBy: d.handed_over_by || d.verified_by || 'Staff Desk',
      handedOverTo: d.handed_over_to || d.student_name || 'Student',
      status: d.status || 'Handed Over',
      date: d.date || '',
      verifiedBy: d.verified_by || d.handed_over_by || '--',
      remarks: d.remarks || ''
    }));
  },

  createDelivery: async (data) => {
    const res = await api.post('/inventory/deliveries', data);
    return res.data;
  },

  updateDeliveryStatus: async (id, status, handedOverBy = null, remarks = null) => {
    const payload = { 
      status, 
      handed_over_by: handedOverBy,
      verified_by: handedOverBy,
      remarks 
    };
    const res = await api.put(`/inventory/deliveries/${id}`, payload);
    return res.data;
  },

  deleteDelivery: async (id) => {
    const res = await api.delete(`/inventory/deliveries/${id}`);
    return res.data;
  },

  getStudentDeliveryStatus: async (studentId) => {
    const res = await api.get(`/inventory/student/${encodeURIComponent(studentId)}/status`);
    return res.data;
  },

  getMyDeliveryStatus: async () => {
    const res = await api.get('/inventory/my-status');
    return res.data;
  }
};

export default inventoryService;
