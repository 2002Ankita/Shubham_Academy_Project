import api from './api';

export const leaveService = {
  createLeaveRequest: async (leaveData) => {
    const res = await api.post('/leave-requests', leaveData);
    return res.data;
  },
  
  getTeacherLeaveRequests: async (teacherId) => {
    const res = await api.get(`/leave-requests/teacher/${teacherId}`);
    return res.data;
  },

  getAllLeaveRequests: async () => {
    const res = await api.get('/leave-requests');
    return res.data;
  },

  getTeacherLeaveSummary: async (teacherId) => {
    const res = await api.get(`/leave-requests/teacher/${teacherId}/summary`);
    return res.data;
  },

  updateLeaveStatus: async (requestId, status, adminComment) => {
    const res = await api.put(`/leave-requests/${requestId}/status`, null, {
      params: { status, admin_comment: adminComment }
    });
    return res.data;
  },

  exportLeaveRequests: async (teacherId) => {
    const url = teacherId ? `/leave-requests/teacher/${teacherId}/export` : '/leave-requests/export';
    const res = await api.get(url, { responseType: 'blob' });
    return res.data;
  }
};

export default leaveService;
