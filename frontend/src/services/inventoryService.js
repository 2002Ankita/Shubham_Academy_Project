import api from './api';

export const inventoryService = {
  getItems: async () => {
    const res = await api.get('/inventory/items');
    return res.data.map(item => ({
      id: item.id,
      title: item.title,
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

  restockItem: async (id, quantity) => {
    const res = await api.post(`/inventory/items/${id}/restock`, { quantity: Number(quantity) });
    return res.data;
  },

  getDeliveries: async () => {
    const res = await api.get('/inventory/deliveries');
    return res.data.map(d => ({
      id: d.id,
      itemId: d.item_id,
      bookTitle: d.book_title,
      availableStock: d.available_stock,
      quantity: d.quantity || 1,
      studentName: d.handed_over_to || d.student_name,
      rollNumber: d.roll_number,
      handedOverBy: d.handed_over_by || d.verified_by || 'Staff Desk',
      handedOverTo: d.handed_over_to || d.student_name || 'Student',
      status: d.status,
      date: d.date,
      verifiedBy: d.verified_by || d.handed_over_by,
      remarks: d.remarks || ''
    }));
  },

  createDelivery: async (data) => {
    const res = await api.post('/inventory/deliveries', data);
    return res.data;
  },

  updateDeliveryStatus: async (id, status, verifiedBy, remarks) => {
    const payload = {
      status,
      verified_by: verifiedBy,
      handed_over_by: verifiedBy,
      remarks
    };
    const res = await api.put(`/inventory/deliveries/${id}`, payload);
    return res.data;
  }
};

export default inventoryService;
