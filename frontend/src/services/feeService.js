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

      // Merge verified offline fee payments into the general ledger
      try {
        const offlineList = JSON.parse(localStorage.getItem('sa_offline_fee_requests') || '[]');
        offlineList.filter(r => r.status === 'APPROVED').forEach(off => {
          const exists = list.some(p => p.id === off.id || (off.receipt_no && p.receiptNo === off.receipt_no));
          if (!exists) {
            list.unshift({
              id: off.id,
              receiptNo: off.receipt_no || `REC-${off.id.substring(off.id.length - 6).toUpperCase()}`,
              studentId: off.student_id,
              studentName: off.student_name,
              rollNumber: off.roll_number || 'N/A',
              batch: off.batch || '',
              branch: off.branch || '',
              standard: off.standard || 'N/A',
              totalFees: Number(off.amount || 0),
              amountPaid: Number(off.amount || 0),
              pendingAmount: 0,
              paymentDate: off.verified_at ? off.verified_at.split('T')[0] : (off.created_at ? off.created_at.split('T')[0] : new Date().toISOString().split('T')[0]),
              paymentMode: off.payment_mode || 'Cash',
              transactionId: off.cheque_number ? `CHQ-${off.cheque_number}` : `CASH-${off.id}`,
              status: 'Paid',
              feeHead: `Offline ${off.payment_mode} Payment (Collected by: ${off.collected_by_faculty || 'Faculty'})`,
              collectedByFaculty: off.collected_by_faculty,
              verifiedBy: off.verified_by
            });
          }
        });
      } catch (err) {}

      return list;
    } catch (e) {
      console.warn('Fee fetch fallback for branch:', activeBranch);
      const isTP = activeBranch === 'Tarabai Park';
      let fallbackList = isTP ? [
        { id: 'fee-tp-01', receiptNo: 'REC-TP-8812', studentId: 'stu-tp-101', studentName: 'Aarav Deshmukh', rollNumber: 'SA-TP-1001', batch: '11th pcm tarabai park', branch: 'Tarabai Park', totalFees: 95000, amountPaid: 45000, pendingAmount: 50000, paymentDate: '2026-10-20', paymentMode: 'NetBanking', status: 'Paid', feeHead: 'Term 1 Tuition' },
        { id: 'fee-tp-02', receiptNo: 'REC-TP-8815', studentId: 'stu-tp-103', studentName: 'Tanvi Shinde', rollNumber: 'SA-TP-1003', batch: '12th pcm tarabai park', branch: 'Tarabai Park', totalFees: 110000, amountPaid: 110000, pendingAmount: 0, paymentDate: '2026-10-21', paymentMode: 'UPI', status: 'Paid', feeHead: 'Annual Comprehensive' }
      ] : [
        { id: 'fee-mp-01', receiptNo: 'REC-MP-7712', studentId: 'stu-mp-101', studentName: 'Diya Patil', rollNumber: 'SA-MP-1001', batch: '11th pcm Mangalvar Peth', branch: 'Mangalvar Peth', totalFees: 95000, amountPaid: 45000, pendingAmount: 50000, paymentDate: '2026-10-18', paymentMode: 'UPI', status: 'Paid', feeHead: 'Term 1 Tuition' },
        { id: 'fee-mp-02', receiptNo: 'REC-MP-7714', studentId: 'stu-mp-103', studentName: 'Sneha Kadam', rollNumber: 'SA-MP-1003', batch: '12th pcm Mangalvar Peth', branch: 'Mangalvar Peth', totalFees: 110000, amountPaid: 110000, pendingAmount: 0, paymentDate: '2026-10-19', paymentMode: 'Cash', status: 'Paid', feeHead: 'Annual Comprehensive' }
      ];

      // Merge verified offline fee payments into the fallback ledger
      try {
        const offlineList = JSON.parse(localStorage.getItem('sa_offline_fee_requests') || '[]');
        offlineList.filter(r => r.status === 'APPROVED').forEach(off => {
          const exists = fallbackList.some(p => p.id === off.id || (off.receipt_no && p.receiptNo === off.receipt_no));
          if (!exists) {
            fallbackList.unshift({
              id: off.id,
              receiptNo: off.receipt_no || `REC-${off.id.substring(off.id.length - 6).toUpperCase()}`,
              studentId: off.student_id,
              studentName: off.student_name,
              rollNumber: off.roll_number || 'N/A',
              batch: off.batch || '',
              branch: off.branch || '',
              standard: off.standard || 'N/A',
              totalFees: Number(off.amount || 0),
              amountPaid: Number(off.amount || 0),
              pendingAmount: 0,
              paymentDate: off.verified_at ? off.verified_at.split('T')[0] : (off.created_at ? off.created_at.split('T')[0] : new Date().toISOString().split('T')[0]),
              paymentMode: off.payment_mode || 'Cash',
              transactionId: off.cheque_number ? `CHQ-${off.cheque_number}` : `CASH-${off.id}`,
              status: 'Paid',
              feeHead: `Offline ${off.payment_mode} Payment (Collected by: ${off.collected_by_faculty || 'Faculty'})`,
              collectedByFaculty: off.collected_by_faculty,
              verifiedBy: off.verified_by
            });
          }
        });
      } catch (err) {}

      return fallbackList;
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

    // 2. Check offline fee requests if receipt matches an offline request
    try {
      const offlineList = JSON.parse(localStorage.getItem('sa_offline_fee_requests') || '[]');
      const offItem = offlineList.find(r => (r.receipt_no && r.receipt_no.toUpperCase() === cleanTarget) || (r.id && r.id.toUpperCase() === cleanTarget));
      if (offItem) {
        return {
          id: offItem.id,
          receiptNo: offItem.receipt_no || receiptNo,
          studentId: offItem.student_id,
          studentName: offItem.student_name,
          rollNumber: offItem.roll_number,
          branch: offItem.branch,
          batch: offItem.batch,
          standard: offItem.standard || '11th Science',
          amountPaid: Number(offItem.amount || 0),
          totalFees: Number(offItem.amount || 0) * 2,
          pendingAmount: Number(offItem.amount || 0),
          paymentMode: offItem.payment_mode,
          paymentDate: offItem.verified_at || offItem.created_at || new Date().toISOString(),
          transactionRef: offItem.cheque_number ? `CHQ-${offItem.cheque_number}` : `CASH-${offItem.id}`,
          remarks: offItem.admin_remarks || `Offline ${offItem.payment_mode} Payment Verified`,
          collectedByFaculty: offItem.collected_by_faculty,
          verifiedBy: offItem.verified_by || 'Academic Admin'
        };
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
  },

  // Branch UPI Scanner Configuration
  getBranchUpiScanner: async (branch = null) => {
    const targetBranch = branch || getUserBranch() || 'Tarabai Park';
    try {
      const res = await api.get('/fees/upi-scanner', { params: { branch: targetBranch } });
      if (res.data) {
        // Merge with local override if exists
        const local = localStorage.getItem(`sa_branch_upi_${targetBranch}`);
        if (local) {
          try {
            return { ...res.data, ...JSON.parse(local) };
          } catch {
            // fallback
          }
        }
        return res.data;
      }
    } catch (e) {
      console.warn('Backend UPI scanner fetch fallback:', e.message);
    }

    const localSaved = localStorage.getItem(`sa_branch_upi_${targetBranch}`);
    if (localSaved) {
      try {
        return JSON.parse(localSaved);
      } catch {
        // fallback
      }
    }

    const isMP = targetBranch.toLowerCase().includes('mangal');
    return {
      id: `default-${isMP ? 'mp' : 'tp'}`,
      branch: isMP ? 'Mangalvar Peth' : 'Tarabai Park',
      upi_id: isMP ? 'shubham.mangalvarpeth@upi' : 'shubham.tarabaipark@upi',
      account_name: isMP ? 'Shubham Academy - Mangalvar Peth Campus' : 'Shubham Academy - Tarabai Park Campus',
      bank_name: isMP ? 'ICICI Bank (Mangalvar Peth, Kolhapur)' : 'HDFC Bank (Tarabai Park, Kolhapur)',
      account_number: isMP ? '031405009821' : '50200088921045',
      ifsc_code: isMP ? 'ICIC0000314' : 'HDFC0001824',
      instructions: 'Scan QR code using Google Pay, PhonePe, Paytm or BHIM UPI. Enter exact installment amount and submit UTR reference.',
      qr_image_url: null,
      is_active: true,
      updated_at: new Date().toISOString()
    };
  },

  updateBranchUpiScanner: async (scannerData) => {
    const targetBranch = scannerData.branch || getUserBranch() || 'Tarabai Park';
    try {
      const res = await api.post('/fees/upi-scanner', scannerData);
      localStorage.setItem(`sa_branch_upi_${targetBranch}`, JSON.stringify(res.data));
      window.dispatchEvent(new CustomEvent('sa_upi_scanner_updated', { detail: res.data }));
      return res.data;
    } catch (e) {
      console.warn('Backend UPI scanner save fallback:', e.message);
      const updated = {
        ...scannerData,
        id: `local-${Date.now()}`,
        updated_at: new Date().toISOString()
      };
      localStorage.setItem(`sa_branch_upi_${targetBranch}`, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('sa_upi_scanner_updated', { detail: updated }));
      return updated;
    }
  },

  // Student Offline Payment Requests (Cash & Cheque)
  submitOfflineFeeRequest: async (requestData) => {
    try {
      const res = await api.post('/fees/offline-requests', requestData);
      // Also update local storage for offline resilience
      const key = 'sa_offline_fee_requests';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      existing.unshift(res.data);
      localStorage.setItem(key, JSON.stringify(existing));
      window.dispatchEvent(new CustomEvent('sa_offline_fee_requests_updated', { detail: res.data }));
      return res.data;
    } catch (e) {
      console.warn('Backend offline request fallback:', e.message);
      const fallbackItem = {
        id: `OFF-REQ-${Math.floor(100000 + Math.random() * 900000)}`,
        student_id: requestData.student_id,
        student_name: requestData.student_name,
        roll_number: requestData.roll_number,
        branch: requestData.branch,
        batch: requestData.batch,
        standard: requestData.standard,
        amount: Number(requestData.amount),
        payment_mode: requestData.payment_mode,
        cheque_number: requestData.cheque_number || null,
        bank_name: requestData.bank_name || null,
        cheque_date: requestData.cheque_date || null,
        depositor_name: requestData.depositor_name || null,
        notes: requestData.notes || '',
        status: 'PENDING',
        created_at: new Date().toISOString(),
        verified_at: null,
        verified_by: null
      };
      const key = 'sa_offline_fee_requests';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      existing.unshift(fallbackItem);
      localStorage.setItem(key, JSON.stringify(existing));
      window.dispatchEvent(new CustomEvent('sa_offline_fee_requests_updated', { detail: fallbackItem }));
      return fallbackItem;
    }
  },

  getOfflineFeeRequests: async (params = {}) => {
    const targetBranch = params.branch || getUserBranch();
    try {
      const res = await api.get('/fees/offline-requests', { params });
      let list = res.data || [];
      if (targetBranch && targetBranch !== 'ALL') {
        const norm = targetBranch.toLowerCase();
        list = list.filter(r => (r.branch || '').toLowerCase().includes(norm));
      }
      return list;
    } catch (e) {
      console.warn('Backend get offline requests fallback:', e.message);
      const key = 'sa_offline_fee_requests';
      let list = JSON.parse(localStorage.getItem(key) || '[]');
      if (list.length === 0) {
        // Pre-populate with realistic demo requests for both branches
        list = [
          {
            id: 'OFF-REQ-882101',
            student_id: 'stu-tp-101',
            student_name: 'Aarav Deshmukh',
            roll_number: 'SA-TP-1001',
            branch: 'Tarabai Park',
            batch: '11th pcm tarabai park',
            standard: '11th Science',
            amount: 15000,
            payment_mode: 'Cash',
            depositor_name: 'Suresh Deshmukh (Father)',
            notes: 'Term 1 cash deposit at Tarabai Park reception',
            collected_by_faculty: 'Prof. Rajesh Sharma (Chemistry Faculty)',
            status: 'PENDING',
            created_at: new Date(Date.now() - 3600000 * 4).toISOString()
          },
          {
            id: 'OFF-REQ-774209',
            student_id: 'stu-mp-101',
            student_name: 'Diya Patil',
            roll_number: 'SA-MP-1001',
            branch: 'Mangalvar Peth',
            batch: '11th pcm Mangalvar Peth',
            standard: '11th Science',
            amount: 25000,
            payment_mode: 'Cheque',
            cheque_number: '004128',
            bank_name: 'Bank of Maharashtra, Mangalvar Peth',
            cheque_date: '2026-10-28',
            depositor_name: 'Diya Patil',
            notes: 'Cheque handed over to accounts desk',
            collected_by_faculty: 'Dr. Priya Kulkarni (Physics Faculty)',
            status: 'PENDING',
            created_at: new Date(Date.now() - 3600000 * 20).toISOString()
          },
          {
            id: 'OFF-REQ-663104',
            student_id: 'stu-tp-102',
            student_name: 'Tanvi Shinde',
            roll_number: 'SA-TP-1002',
            branch: 'Tarabai Park',
            batch: '12th pcmb tarabai park',
            standard: '12th Science',
            amount: 20000,
            payment_mode: 'Cash',
            depositor_name: 'Tanvi Shinde',
            notes: 'Quarter 2 tuition fees paid in cash',
            collected_by_faculty: 'Prof. Snehal Joshi (Mathematics Faculty)',
            status: 'APPROVED',
            receipt_no: 'REC-991204',
            verified_by: 'Academic Admin - Tarabai Park',
            admin_remarks: 'Verified at desk and counter receipt issued',
            created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
            verified_at: new Date(Date.now() - 3600000 * 24).toISOString()
          }
        ];
        localStorage.setItem(key, JSON.stringify(list));
      }
      if (targetBranch && targetBranch !== 'ALL') {
        const norm = targetBranch.toLowerCase();
        list = list.filter(r => (r.branch || '').toLowerCase().includes(norm));
      }
      if (params.status && params.status !== 'ALL') {
        list = list.filter(r => (r.status || '').toUpperCase() === params.status.toUpperCase());
      }
      return list;
    }
  },

  verifyOfflineFeeRequest: async (requestId, verifyData = {}) => {
    let verifiedItem = null;
    try {
      const res = await api.post(`/fees/offline-requests/${requestId}/verify`, verifyData);
      verifiedItem = res.data;
    } catch (e) {
      console.warn('Backend verify offline request fallback:', e.message);
    }

    const key = 'sa_offline_fee_requests';
    const list = JSON.parse(localStorage.getItem(key) || '[]');
    let item = list.find(r => r.id === requestId);
    if (!item && verifiedItem) {
      item = { ...verifiedItem };
      list.unshift(item);
    }
    if (item) {
      item.status = 'APPROVED';
      item.receipt_no = verifiedItem?.receipt_no || item.receipt_no || `REC-${Math.floor(100000 + Math.random() * 900000)}`;
      item.verified_at = verifiedItem?.verified_at || new Date().toISOString();
      item.verified_by = verifyData.verified_by || verifiedItem?.verified_by || 'Academic Admin';
      item.collected_by_faculty = verifyData.collected_by_faculty || verifiedItem?.collected_by_faculty || item.collected_by_faculty || 'Faculty In-Charge';
      item.admin_remarks = verifyData.remarks || verifiedItem?.admin_remarks || 'Verified and received at branch desk';
      localStorage.setItem(key, JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('sa_offline_fee_requests_updated', { detail: item }));
      window.dispatchEvent(new CustomEvent('sa_fee_updated', { detail: item }));
      return item;
    }

    if (verifiedItem) {
      window.dispatchEvent(new CustomEvent('sa_offline_fee_requests_updated', { detail: verifiedItem }));
      window.dispatchEvent(new CustomEvent('sa_fee_updated', { detail: verifiedItem }));
      return verifiedItem;
    }
    throw new Error('Offline fee request not found.');
  },

  rejectOfflineFeeRequest: async (requestId, rejectionReason) => {
    try {
      const res = await api.post(`/fees/offline-requests/${requestId}/reject`, { rejection_reason: rejectionReason });
      return res.data;
    } catch (e) {
      console.warn('Backend reject offline request fallback:', e.message);
      const key = 'sa_offline_fee_requests';
      const list = JSON.parse(localStorage.getItem(key) || '[]');
      const item = list.find(r => r.id === requestId);
      if (item) {
        item.status = 'REJECTED';
        item.admin_remarks = rejectionReason || 'Rejected by branch admin';
        item.verified_at = new Date().toISOString();
        item.verified_by = 'Academic Admin';
        localStorage.setItem(key, JSON.stringify(list));
        window.dispatchEvent(new CustomEvent('sa_offline_fee_requests_updated', { detail: item }));
        return item;
      }
      throw e;
    }
  }
};

export default feeService;
