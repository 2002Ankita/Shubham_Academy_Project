import api from './api';

export const reportService = {
  getSummary: async (branch = null) => {
    try {
      const params = branch ? { branch } : {};
      const res = await api.get('/reports', { params });
      return res.data;
    } catch (err) {
      console.warn('Could not fetch backend report summary:', err);
      return null;
    }
  },

  getAll: async () => {
    try {
      const res = await api.get('/reports');
      if (Array.isArray(res.data)) {
        return res.data;
      }
      return [];
    } catch {
      return [];
    }
  },

  generateReport: async (reportData) => {
    try {
      const res = await api.post('/reports/generate', reportData);
      return res.data;
    } catch (err) {
      throw err;
    }
  },

  downloadBackendExcel: async (module = 'students', branch = null) => {
    try {
      const params = { module };
      if (branch) params.branch = branch;
      const res = await api.get('/reports/export/excel', {
        params,
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Shubham_Classes_Kolhapur_${module.toUpperCase()}_Report.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      return true;
    } catch (err) {
      console.error('Failed to download backend excel:', err);
      throw err;
    }
  },

  downloadReport: (reportId) => {
    const sampleText = `SHUBHAM CLASSES - KOLHAPUR\nOFFICIAL ACADEMY AUDIT REPORT\nReport ID: ${reportId}\nGenerated At: ${new Date().toISOString()}\n\n-- Official Confidential Academy Record --`;
    const blob = new Blob([sampleText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Shubham_Classes_${reportId}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }
};

export default reportService;
