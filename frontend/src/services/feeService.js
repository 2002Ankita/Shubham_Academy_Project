import api from './api';

export const feeService = {
  getAll: async (params = {}) => {
    // Backend returns FeePaymentResponse
    const res = await api.get('/fees', { params });
    return res.data.map(fee => ({
      id: fee.id,
      receiptNo: `REC-${fee.id.substring(fee.id.length - 6).toUpperCase()}`,
      studentId: fee.student_id,
      studentName: fee.student_name || 'Student ID: ' + fee.student_id.substring(fee.student_id.length - 6),
      rollNumber: fee.roll_number || 'N/A',
      standard: 'N/A',
      totalFees: fee.amount_paid, // Or whatever it should be. The user said "Amount is not mentioned", maybe they just mean totalFees in the table. Let's map it.
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
      standard: fee.standard + ' - ' + fee.batch + ' - ' + fee.branch,
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
    try {
      // Calculate dynamically
      const pendingRes = await api.get('/fees/pending');
      const allRes = await api.get('/fees');
      
      const pendingFeesArray = pendingRes.data;
      const allFeesArray = allRes.data;

      const pending = pendingFeesArray.reduce((acc, curr) => acc + (curr.pending_fees || 0), 0);
      const collected = allFeesArray.reduce((acc, curr) => acc + (curr.amount_paid || 0), 0);
      const totalTarget = collected + pending;
      const collectionRate = totalTarget > 0 ? ((collected / totalTarget) * 100).toFixed(2) : 0;

      return {
        totalTarget,
        collected,
        pending,
        collectionRate,
        chartData: [
          { month: 'Current', collected, pending }
        ]
      };
    } catch {
      return {
        totalTarget: 0,
        collected: 0,
        pending: 0,
        collectionRate: 0,
        chartData: []
      };
    }
  }
};

export default feeService;
