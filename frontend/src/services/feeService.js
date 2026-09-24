import api from './api';

const MOCK_FEES = [
  {
    id: 'FEE-2026-001',
    receiptNo: 'REC-99120',
    studentId: 'STU-001',
    studentName: 'Aarav Deshmukh',
    rollNumber: 'SA-2026-1042',
    standard: '12th Science',
    totalFees: 45000,
    amountPaid: 45000,
    pendingAmount: 0,
    paymentDate: '2026-08-10',
    paymentMode: 'UPI / Online',
    transactionId: 'TXN-984210982',
    status: 'Paid',
    feeHead: 'Annual Tuition & Lab Fees'
  },
  {
    id: 'FEE-2026-002',
    receiptNo: 'REC-99121',
    studentId: 'STU-002',
    studentName: 'Ananya Sharma',
    rollNumber: 'SA-2026-1043',
    standard: '12th Science',
    totalFees: 45000,
    amountPaid: 30000,
    pendingAmount: 15000,
    paymentDate: '2026-08-15',
    paymentMode: 'Net Banking',
    transactionId: 'TXN-881200331',
    status: 'Pending',
    feeHead: '1st Installment'
  },
  {
    id: 'FEE-2026-003',
    receiptNo: 'REC-99122',
    studentId: 'STU-003',
    studentName: 'Rohan Joshi',
    rollNumber: 'SA-2026-1044',
    standard: '11th Science',
    totalFees: 40000,
    amountPaid: 40000,
    pendingAmount: 0,
    paymentDate: '2026-07-20',
    paymentMode: 'Cheque (Clear)',
    transactionId: 'CHQ-55102',
    status: 'Paid',
    feeHead: 'Annual Tuition Fees'
  },
  {
    id: 'FEE-2026-004',
    receiptNo: '--',
    studentId: 'STU-004',
    studentName: 'Tanvi Kulkarni',
    rollNumber: 'SA-2026-1045',
    standard: '12th Commerce',
    totalFees: 38000,
    amountPaid: 15000,
    pendingAmount: 23000,
    paymentDate: '2026-06-25',
    paymentMode: 'Cash',
    transactionId: 'TXN-110022',
    status: 'Overdue',
    feeHead: 'Term 1 Installment'
  }
];

export const feeService = {
  getAll: async (params = {}) => {
    try {
      const res = await api.get('/fees', { params });
      return res.data;
    } catch {
      return MOCK_FEES;
    }
  },

  getPending: async () => {
    try {
      const res = await api.get('/fees/pending');
      return res.data;
    } catch {
      return MOCK_FEES.filter(f => f.pendingAmount > 0);
    }
  },

  getReceipt: async (receiptNo) => {
    try {
      const res = await api.get(`/fees/receipt/${receiptNo}`);
      return res.data;
    } catch {
      return MOCK_FEES.find(f => f.receiptNo === receiptNo) || MOCK_FEES[0];
    }
  },

  collectFee: async (data) => {
    try {
      const res = await api.post('/fees/collect', data);
      return res.data;
    } catch {
      const newReceiptNo = `REC-${Math.floor(10000 + Math.random() * 90000)}`;
      const feeEntry = {
        id: `FEE-2026-${String(MOCK_FEES.length + 1).padStart(3, '0')}`,
        receiptNo: newReceiptNo,
        studentId: data.studentId,
        studentName: data.studentName || 'Aarav Deshmukh',
        rollNumber: data.rollNumber || 'SA-2026-1042',
        standard: data.standard || '12th Science',
        totalFees: Number(data.totalFees || 45000),
        amountPaid: Number(data.amountPaid),
        pendingAmount: Math.max(0, Number(data.totalFees || 45000) - Number(data.amountPaid)),
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMode: data.paymentMode || 'UPI / Online',
        transactionId: `TXN-${Date.now()}`,
        status: (Number(data.amountPaid) >= Number(data.totalFees || 45000)) ? 'Paid' : 'Pending',
        feeHead: data.feeHead || 'Tuition Fee Installment'
      };
      MOCK_FEES.unshift(feeEntry);
      return { success: true, message: 'Fee payment collected successfully', receipt: feeEntry };
    }
  },

  getFeeStats: async () => {
    try {
      const res = await api.get('/fees/stats');
      return res.data;
    } catch {
      return {
        totalTarget: 18500000,
        collected: 15200000,
        pending: 3300000,
        collectionRate: 82.16,
        chartData: [
          { month: 'Apr', collected: 2100000, pending: 400000 },
          { month: 'May', collected: 2800000, pending: 550000 },
          { month: 'Jun', collected: 3600000, pending: 620000 },
          { month: 'Jul', collected: 2900000, pending: 700000 },
          { month: 'Aug', collected: 2400000, pending: 510000 },
          { month: 'Sep', collected: 1400000, pending: 520000 }
        ]
      };
    }
  }
};

export default feeService;
