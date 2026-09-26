import api from './api';

export const feeService = {
  getAll: async (params = {}) => {
    // Backend returns FeePaymentResponse
    const res = await api.get('/fees', { params });
    return res.data.map(fee => ({
      id: fee.id,
      receiptNo: `REC-${fee.id.substring(fee.id.length - 6).toUpperCase()}`,
      studentId: fee.student_id,
      studentName: 'Student ID: ' + fee.student_id.substring(fee.student_id.length - 6), // Since backend doesn't embed student name here
      rollNumber: 'N/A',
      standard: 'N/A',
      totalFees: 0,
      amountPaid: fee.amount_paid,
      pendingAmount: 0,
      paymentDate: fee.payment_date.split('T')[0],
      paymentMode: fee.payment_method,
      transactionId: fee.transaction_reference,
      status: 'Paid',
      feeHead: fee.remarks || 'Fee Payment'
    }));
  },

  getPending: async () => {
    // Backend returns PendingFeeResponse
    const res = await api.get('/fees/pending');
    return res.data.map(fee => ({
      id: fee.student_id, // Map the student ID as the unique key for the table
      receiptNo: 'PENDING',
      studentId: fee.student_id,
      studentName: fee.student_name,
      rollNumber: fee.student_id.substring(fee.student_id.length - 6),
      standard: fee.course + ' - ' + fee.batch,
      totalFees: fee.total_fees,
      amountPaid: fee.amount_paid,
      pendingAmount: fee.pending_fees,
      paymentDate: 'N/A',
      paymentMode: 'N/A',
      transactionId: 'N/A',
      status: 'Pending',
      feeHead: 'Pending Fees'
    }));
  },

  getReceipt: async (receiptNo) => {
    // Note: If you need to actually fetch a specific receipt, we need an endpoint for it.
    // For now, let's just throw or return a stub since we removed mock data.
    return { receiptNo };
  },

  collectFee: async (data) => {
    const payload = {
      student_id: data.studentId,
      amount_paid: Number(data.amountPaid),
      payment_method: data.paymentMode || 'Online',
      transaction_reference: `TXN-${Date.now()}`,
      remarks: data.feeHead || 'Manual Collection'
    };
    const res = await api.post('/fees', payload);
    const receiptNo = `REC-${res.data.id.substring(res.data.id.length - 6).toUpperCase()}`;
    return { 
      success: true, 
      message: 'Fee payment collected successfully', 
      receipt: { ...res.data, receiptNo } 
    };
  },

  getFeeStats: async () => {
    // Fallback since there is no /fees/stats yet on backend
    return {
      totalTarget: 18500000,
      collected: 15200000,
      pending: 3300000,
      collectionRate: 82.16,
      chartData: [
        { month: 'Apr', collected: 2100000, pending: 400000 }
      ]
    };
  }
};

export default feeService;
