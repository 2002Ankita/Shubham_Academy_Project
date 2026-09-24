import api from './api';

const MOCK_REPORTS = [
  {
    id: 'REP-001',
    name: 'Comprehensive Attendance Ledger (August 2026)',
    type: 'Attendance',
    fileFormat: 'PDF / Excel',
    size: '2.4 MB',
    generatedDate: '2026-09-01',
    generatedBy: 'Admin Rajesh Patil'
  },
  {
    id: 'REP-002',
    name: 'Fee Collection & Defaulters Summary (Term 1)',
    type: 'Financial',
    fileFormat: 'PDF',
    size: '1.8 MB',
    generatedDate: '2026-09-05',
    generatedBy: 'Accounts Office'
  },
  {
    id: 'REP-003',
    name: 'Unit Test 1 Class-Wise Performance & Ranking',
    type: 'Academic',
    fileFormat: 'PDF',
    size: '3.1 MB',
    generatedDate: '2026-08-25',
    generatedBy: 'Dr. Priya Kulkarni'
  },
  {
    id: 'REP-004',
    name: 'RFID Gate Scans & SMS Audit Trail',
    type: 'Security',
    fileFormat: 'CSV',
    size: '4.5 MB',
    generatedDate: '2026-09-18',
    generatedBy: 'System Auto-Export'
  }
];

export const reportService = {
  getAll: async () => {
    try {
      const res = await api.get('/reports');
      return res.data;
    } catch {
      return MOCK_REPORTS;
    }
  },

  generateReport: async (reportData) => {
    try {
      const res = await api.post('/reports/generate', reportData);
      return res.data;
    } catch {
      const newRep = {
        id: `REP-${String(MOCK_REPORTS.length + 1).padStart(3, '0')}`,
        name: reportData.name || 'Custom Generated Report',
        type: reportData.type || 'General',
        fileFormat: reportData.fileFormat || 'PDF',
        size: '1.5 MB',
        generatedDate: new Date().toISOString().split('T')[0],
        generatedBy: 'Admin'
      };
      MOCK_REPORTS.unshift(newRep);
      return { success: true, message: 'Report generated successfully', report: newRep };
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
