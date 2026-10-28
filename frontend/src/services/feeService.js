import api from './api';
import { getUserBranch, filterFeesByBranch } from '../utils/branchUtils';

export const feeService = {
  getAll: async (params = {}) => {
    const activeBranch = params?.branch || getUserBranch();
    try {
      // Backend returns FeePaymentResponse
      const res = await api.get('/fees', { params });
      let list = (res.data || []).map(fee => ({
        id: fee.id,
        receiptNo: `REC-${fee.id.substring(fee.id.length - 6).toUpperCase()}`,
        studentId: fee.student_id,
        studentName: fee.student_name || 'Student ID: ' + fee.student_id.substring(fee.student_id.length - 6),
        rollNumber: fee.roll_number || 'N/A',
        batch: fee.batch || '',
        branch: fee.branch || '',
        standard: fee.standard || 'N/A',
        totalFees: fee.total_fees || 0,
        originalFees: fee.original_fees || 0,
        discountAmount: fee.discount_amount || 0,
        discountReason: fee.discount_reason || '',
        discountStatus: fee.discount_status || 'NONE',
        discountApprovedBy: fee.discount_approved_by || '',
        amountPaid: fee.amount_paid,
        pendingAmount: fee.pending_fees != null ? fee.pending_fees : 0,
        cumulativePaid: fee.cumulative_paid != null ? fee.cumulative_paid : fee.amount_paid,
        currentPendingFees: fee.current_pending_fees,
        paymentDate: fee.payment_date ? fee.payment_date.split('T')[0] : '2026-10-22',
        paymentMode: fee.payment_method || 'UPI',
        transactionId: fee.transaction_reference || 'TXN-99102',
        status: 'Paid',
        feeHead: fee.remarks || 'Fee Payment'
      }));

      if (activeBranch) {
        list = filterFeesByBranch(list, activeBranch);
      }
      return list;
    } catch (e) {
      console.warn('Fee fetch failed:', e);
      return [];
    }
  },

  getPending: async (params = {}) => {
    const activeBranch = params?.branch || getUserBranch();
    try {
      // Backend returns PendingFeeResponse
      const res = await api.get('/fees/pending', {
        params: activeBranch && activeBranch !== 'ALL' ? { branch: activeBranch } : {}
      });
      let list = (res.data || []).map(fee => ({
        id: fee.student_id,
        receiptNo: 'PENDING',
        studentId: fee.student_id,
        studentName: fee.student_name,
        rollNumber: fee.student_id ? fee.student_id.substring(fee.student_id.length - 6) : 'N/A',
        batch: fee.batch || '',
        branch: fee.branch || '',
        standard: fee.standard + (fee.batch ? ' - ' + fee.batch : ''),
        totalFees: fee.total_fees,
        originalFees: fee.original_fees || 0,
        discountAmount: fee.discount_amount || 0,
        discountReason: fee.discount_reason || '',
        discountStatus: fee.discount_status || 'NONE',
        discountApprovedBy: fee.discount_approved_by || '',
        amountPaid: fee.amount_paid,
        pendingAmount: fee.pending_fees,
        paymentDate: 'N/A',
        paymentMode: 'N/A',
        transactionId: 'N/A',
        status: 'Pending',
        feeHead: 'Pending Fees'
      }));

      if (activeBranch && activeBranch !== 'ALL') {
        list = filterFeesByBranch(list, activeBranch);
      }
      return list;
    } catch (e) {
      console.warn('Pending fee fetch failed:', e);
      return [];
    }
  },

  getReceipt: async (receiptNo) => {
    const cleanTarget = (receiptNo || '').trim().toUpperCase();

    // 1. Check local storage receipt cache (e.g. freshly collected receipt)
    try {
      const cached = JSON.parse(localStorage.getItem('sa_last_receipt') || 'null');
      if (cached && (cached.receiptNo?.toUpperCase() === cleanTarget || !cleanTarget)) {
        return cached;
      }
    } catch (_) {}

    // 2. Fetch all fees without branch restriction to ensure receipt is discoverable
    try {
      const res = await api.get('/fees');
      const allFees = (res.data || []).map(fee => ({
        id: fee.id,
        receiptNo: `REC-${fee.id.substring(fee.id.length - 6).toUpperCase()}`,
        studentId: fee.student_id,
        studentName: fee.student_name || 'Student',
        rollNumber: fee.roll_number || 'N/A',
        batch: fee.batch || '',
        branch: fee.branch || '',
        standard: fee.standard || 'N/A',
        totalFees: Number(fee.total_fees) || 0,
        originalFees: Number(fee.original_fees) || Number(fee.total_fees) || 0,
        discountAmount: Number(fee.discount_amount) || 0,
        discountReason: fee.discount_reason || '',
        discountStatus: fee.discount_status || 'NONE',
        discountApprovedBy: fee.discount_approved_by || '',
        amountPaid: Number(fee.amount_paid) || 0,
        pendingAmount: Number(fee.pending_fees != null ? fee.pending_fees : (Number(fee.total_fees || 0) - Number(fee.amount_paid || 0))),
        cumulativePaid: Number(fee.cumulative_paid != null ? fee.cumulative_paid : fee.amount_paid) || 0,
        currentPendingFees: Number(fee.current_pending_fees) || 0,
        paymentDate: fee.payment_date ? fee.payment_date.split('T')[0] : new Date().toISOString().split('T')[0],
        paymentMode: fee.payment_method || 'UPI',
        transactionId: fee.transaction_reference || 'TXN-PAID',
        status: 'Paid',
        feeHead: fee.remarks || 'Tuition & Academic Facilities Fee'
      }));

      let found = allFees.find(f => {
        const rNo = (f.receiptNo || '').toUpperCase();
        const fId = (f.id || '').toUpperCase();
        const tId = (f.transactionId || '').toUpperCase();
        return rNo === cleanTarget || fId === cleanTarget || (cleanTarget && fId.endsWith(cleanTarget.replace('REC-', ''))) || tId === cleanTarget;
      });

      // If found in live fees, attempt to enrich with latest student ledger details safely
      if (found) {
        if (found.studentId) {
          try {
            const details = await api.get(`/fees/${found.studentId}`);
            if (details?.data) {
              if (details.data.total_fees != null) found.totalFees = Number(details.data.total_fees);
              if (details.data.original_fees != null) found.originalFees = Number(details.data.original_fees);
              if (details.data.discount_amount != null) found.discountAmount = Number(details.data.discount_amount);
              if (details.data.discount_reason) found.discountReason = details.data.discount_reason;
              if (details.data.discount_status) found.discountStatus = details.data.discount_status;
              if (details.data.discount_approved_by) found.discountApprovedBy = details.data.discount_approved_by;
              if (details.data.pending_fees != null) found.pendingAmount = Number(details.data.pending_fees);
            }
          } catch (_) {
            // Keep existing found data
          }
        }
        return found;
      }
    } catch (e) {
      console.warn('API error in getReceipt:', e);
    }

    return null;
  },

  getFeeDetails: async (studentId, params = {}) => {
    const res = await api.get(`/fees/${studentId}`, { params });
    return res.data;
  },

  collectFee: async (data) => {
    const amountPaidNum = Number(data.amountPaid) || 0;
    const totalFeesNum = Number(data.totalFees) || null;

    const payload = {
      student_id: data.studentId,
      amount_paid: amountPaidNum,
      payment_method: data.paymentMode || 'Online',
      transaction_reference: data.transactionRef || `TXN-${Date.now()}`,
      remarks: data.remarks || data.feeHead || 'Manual Collection',
      total_course_fees_override: totalFeesNum,
      branch: data.branch || undefined,
      standard: data.standard || undefined
    };
    const res = await api.post('/fees', payload);
    const receiptNo = `REC-${res.data.id.substring(res.data.id.length - 6).toUpperCase()}`;

    const formattedReceipt = {
      id: res.data.id,
      receiptNo,
      studentId: res.data.student_id,
      studentName: res.data.student_name || data.studentName || 'Student',
      rollNumber: res.data.roll_number || data.rollNumber || 'N/A',
      standard: res.data.standard || data.standard || 'N/A',
      batch: res.data.batch || data.batch || '',
      branch: res.data.branch || data.branch || '',
      amountPaid: Number(res.data.amount_paid) || amountPaidNum,
      totalFees: Number(res.data.total_fees) || (totalFeesNum || 0),
      pendingAmount: Number(res.data.pending_fees != null ? res.data.pending_fees : (Number(res.data.total_fees || totalFeesNum || 0) - amountPaidNum)),
      originalFees: Number(res.data.original_fees) || Number(res.data.total_fees) || (totalFeesNum || 0),
      discountAmount: Number(res.data.discount_amount) || 0,
      discountStatus: res.data.discount_status || 'NONE',
      discountApprovedBy: res.data.discount_approved_by || '',
      discountReason: res.data.discount_reason || '',
      paymentDate: res.data.payment_date ? res.data.payment_date.split('T')[0] : new Date().toISOString().split('T')[0],
      paymentMode: res.data.payment_method || data.paymentMode || 'Cash',
      transactionId: res.data.transaction_reference || data.transactionRef || `TXN-${Date.now()}`,
      feeHead: res.data.remarks || data.remarks || data.feeHead || 'Tuition & Academic Facilities Fee'
    };

    try {
      localStorage.setItem('sa_last_receipt', JSON.stringify(formattedReceipt));
    } catch (_) {}

    return {
      success: true,
      message: 'Fee payment collected successfully',
      receipt: formattedReceipt
    };
  },

  getFeeStats: async (branch = null) => {
    try {
      const activeBranch = branch || getUserBranch();
      const [pendingList, allFees] = await Promise.all([
        feeService.getPending({ branch: activeBranch }),
        feeService.getAll({ branch: activeBranch })
      ]);

      const pending = (pendingList || []).reduce((acc, curr) => acc + (Number(curr.pendingAmount ?? curr.pending_fees) || 0), 0);
      const collected = (allFees || []).reduce((acc, curr) => acc + (Number(curr.amountPaid ?? curr.amount_paid) || 0), 0);
      const totalTarget = collected + pending;
      const collectionRate = totalTarget > 0 ? Number(((collected / totalTarget) * 100).toFixed(1)) : 0;

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
  },

  // Fee Structures API
  getStructures: async (branch = null) => {
    const params = {};
    if (branch && branch !== 'ALL') {
      params.branch = branch;
    }
    const res = await api.get('/fees/structures', { params });
    return res.data;
  },

  createStructure: async (data) => {
    const res = await api.post('/fees/structures', data);
    return res.data;
  },

  updateStructure: async (id, data) => {
    const res = await api.put(`/fees/structures/${id}`, data);
    return res.data;
  },

  deleteStructure: async (id) => {
    const res = await api.delete(`/fees/structures/${id}`);
    return res.data;
  },

  seedCampusStructures: async () => {
    const res = await api.post('/fees/structures/seed-defaults');
    return res.data;
  }
};

export default feeService;
