import api from './api';

// Removed MOCK_REPORTS

export const reportService = {
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

  downloadReport: (reportId) => {
    // Generate dummy blob download simulation
    const sampleText = `SHUBHAM ACADEMY MANAGEMENT REPORT\nReport ID: ${reportId}\nGenerated At: ${new Date().toISOString()}\n\n-- Official Confidential Record --`;
    const blob = new Blob([sampleText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Shubham_Academy_${reportId}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }
};

export default reportService;
