import api from './api';
import { getUserBranch, isStudentInBranch } from '../utils/branchUtils';

export const studentService = {
  getAll: async (params = {}) => {
    const activeBranch = params?.branch || getUserBranch();
    try {
      const res = await api.get('/students', { params });
      let list = (res.data || []).map(student => {
        const totalFees = Number(student.total_fees) || 0;
        const paidFees = Number(student.paid_fees) || 0;
        const remainingFees = Number(student.remaining_fees) || Math.max(0, totalFees - paidFees);
        
        let feesStatus = 'Pending';
        if (totalFees > 0 && paidFees >= totalFees) {
          feesStatus = 'Paid';
        } else if (paidFees > 0) {
          feesStatus = 'Partial';
        }

        return {
          ...student,
          name: student.full_name,
          phone: student.mobile_number,
          parentPhone: student.parent_mobile,
          parentName: student.parent_name,
          standard: student.standard || 'Pending Selection',
          batch: student.batch || 'Pending Allocation',
          branch: student.branch || (activeBranch || 'Mangalvar Peth'),
          status: student.is_active !== false ? 'Active' : 'Inactive',
          rollNumber: student.student_id || 'N/A',
          totalFees,
          paidFees,
          remainingFees,
          feesStatus,
          profileCompleted: Boolean(student.profile_completed),
          attendancePercent: student.attendancePercent || 0,
          originalFees: student.original_fees || student.total_fees || 0,
          discountAmount: student.discount_amount || 0,
          discountRequestedAmount: student.discount_requested_amount || student.discount_amount || 0,
          discountReason: student.discount_reason || '',
          discountStatus: student.discount_status || 'NONE',
          discountOfferedBy: student.discount_offered_by || '',
          discountRecommendedBy: student.discount_recommended_by || student.discount_offered_by || '',
          discountOfferedAt: student.discount_offered_at || null,
          discountApprovedBy: student.discount_approved_by || '',
          discountApprovedAt: student.discount_approved_at || null,
          discountRejectionReason: student.discount_rejection_reason || ''
        };
      });

      if (activeBranch) {
        list = list.filter(st => isStudentInBranch(st, activeBranch));
      }

      // If branch has no students yet in backend DB, provide demo roster for that branch
      if (list.length === 0 && activeBranch) {
        const isTP = activeBranch === 'Tarabai Park';
        const sampleRoster = isTP ? [
          { id: 'stu-tp-101', student_id: 'SA-TP-1001', rollNumber: 'SA-TP-1001', full_name: 'Aarav Deshmukh', name: 'Aarav Deshmukh', mobile_number: '9822011221', phone: '9822011221', parent_name: 'Sanjay Deshmukh', parent_mobile: '9822011222', parentPhone: '9822011222', standard: '11th Science', batch: '11th pcm tarabai park', branch: 'Tarabai Park', totalFees: 95000, paidFees: 95000, remainingFees: 0, feesStatus: 'Paid', status: 'Active', attendancePercent: 92, discountStatus: 'NONE' },
          { id: 'stu-tp-102', student_id: 'SA-TP-1002', rollNumber: 'SA-TP-1002', full_name: 'Ananya Joshi', name: 'Ananya Joshi', mobile_number: '9822011223', phone: '9822011223', parent_name: 'Vikram Joshi', parent_mobile: '9822011224', parentPhone: '9822011224', standard: '11th Science', batch: '11th pcb tarabai park', branch: 'Tarabai Park', totalFees: 95000, paidFees: 50000, remainingFees: 45000, feesStatus: 'Partial', status: 'Active', attendancePercent: 88, discountStatus: 'PENDING', discountAmount: 10000, discountReason: 'Merit Scholarship' },
          { id: 'stu-tp-103', student_id: 'SA-TP-1003', rollNumber: 'SA-TP-1003', full_name: 'Tanvi Shinde', name: 'Tanvi Shinde', mobile_number: '9822011225', phone: '9822011225', parent_name: 'Kishore Shinde', parent_mobile: '9822011226', parentPhone: '9822011226', standard: '12th Science', batch: '12th pcm tarabai park', branch: 'Tarabai Park', totalFees: 110000, paidFees: 110000, remainingFees: 0, feesStatus: 'Paid', status: 'Active', attendancePercent: 95, discountStatus: 'APPROVED', discountAmount: 15000, discountApprovedBy: 'Sanjay Shinde' },
          { id: 'stu-tp-104', student_id: 'SA-TP-1004', rollNumber: 'SA-TP-1004', full_name: 'Aryan Patil', name: 'Aryan Patil', mobile_number: '9822011227', phone: '9822011227', parent_name: 'Deepak Patil', parent_mobile: '9822011228', parentPhone: '9822011228', standard: '12th Science', batch: '12th pcmb tarabai park', branch: 'Tarabai Park', totalFees: 120000, paidFees: 30000, remainingFees: 90000, feesStatus: 'Partial', status: 'Active', attendancePercent: 78, discountStatus: 'NONE' }
        ] : [
          { id: 'stu-mp-101', student_id: 'SA-MP-1001', rollNumber: 'SA-MP-1001', full_name: 'Diya Patil', name: 'Diya Patil', mobile_number: '9822033441', phone: '9822033441', parent_name: 'Mahesh Patil', parent_mobile: '9822033442', parentPhone: '9822033442', standard: '11th Science', batch: '11th pcm Mangalvar Peth', branch: 'Mangalvar Peth', totalFees: 95000, paidFees: 95000, remainingFees: 0, feesStatus: 'Paid', status: 'Active', attendancePercent: 94, discountStatus: 'NONE' },
          { id: 'stu-mp-102', student_id: 'SA-MP-1002', rollNumber: 'SA-MP-1002', full_name: 'Rohan Deshmukh', name: 'Rohan Deshmukh', mobile_number: '9822033443', phone: '9822033443', parent_name: 'Ajay Deshmukh', parent_mobile: '9822033444', parentPhone: '9822033444', standard: '11th Science', batch: '11th pcb Mangalvar Peth', branch: 'Mangalvar Peth', totalFees: 95000, paidFees: 45000, remainingFees: 50000, feesStatus: 'Partial', status: 'Active', attendancePercent: 82, discountStatus: 'PENDING', discountAmount: 12000, discountReason: 'Sibling Concession' },
          { id: 'stu-mp-103', student_id: 'SA-MP-1003', rollNumber: 'SA-MP-1003', full_name: 'Sneha Kadam', name: 'Sneha Kadam', mobile_number: '9822033445', phone: '9822033445', parent_name: 'Sunil Kadam', parent_mobile: '9822033446', parentPhone: '9822033446', standard: '12th Science', batch: '12th pcm Mangalvar Peth', branch: 'Mangalvar Peth', totalFees: 110000, paidFees: 110000, remainingFees: 0, feesStatus: 'Paid', status: 'Active', attendancePercent: 96, discountStatus: 'APPROVED', discountAmount: 15000, discountApprovedBy: 'Shubham Sharma' },
          { id: 'stu-mp-104', student_id: 'SA-MP-1004', rollNumber: 'SA-MP-1004', full_name: 'Aditya Joshi', name: 'Aditya Joshi', mobile_number: '9822033447', phone: '9822033447', parent_name: 'Pradeep Joshi', parent_mobile: '9822033448', parentPhone: '9822033448', standard: '12th Science', batch: '12th pcmb Mangalvar Peth', branch: 'Mangalvar Peth', totalFees: 120000, paidFees: 40000, remainingFees: 80000, feesStatus: 'Partial', status: 'Active', attendancePercent: 74, discountStatus: 'NONE' }
        ];
        return sampleRoster;
      }

      return list;
    } catch (err) {
      console.warn('Student fetch fallback for branch:', activeBranch, err.message);
      const isTP = activeBranch === 'Tarabai Park';
      return isTP ? [
        { id: 'stu-tp-101', student_id: 'SA-TP-1001', rollNumber: 'SA-TP-1001', full_name: 'Aarav Deshmukh', name: 'Aarav Deshmukh', mobile_number: '9822011221', phone: '9822011221', parent_name: 'Sanjay Deshmukh', parent_mobile: '9822011222', parentPhone: '9822011222', standard: '11th Science', batch: '11th pcm tarabai park', branch: 'Tarabai Park', totalFees: 95000, paidFees: 95000, remainingFees: 0, feesStatus: 'Paid', status: 'Active', attendancePercent: 92, discountStatus: 'NONE' },
        { id: 'stu-tp-102', student_id: 'SA-TP-1002', rollNumber: 'SA-TP-1002', full_name: 'Ananya Joshi', name: 'Ananya Joshi', mobile_number: '9822011223', phone: '9822011223', parent_name: 'Vikram Joshi', parent_mobile: '9822011224', parentPhone: '9822011224', standard: '11th Science', batch: '11th pcb tarabai park', branch: 'Tarabai Park', totalFees: 95000, paidFees: 50000, remainingFees: 45000, feesStatus: 'Partial', status: 'Active', attendancePercent: 88, discountStatus: 'PENDING', discountAmount: 10000, discountReason: 'Merit Scholarship' },
        { id: 'stu-tp-103', student_id: 'SA-TP-1003', rollNumber: 'SA-TP-1003', full_name: 'Tanvi Shinde', name: 'Tanvi Shinde', mobile_number: '9822011225', phone: '9822011225', parent_name: 'Kishore Shinde', parent_mobile: '9822011226', parentPhone: '9822011226', standard: '12th Science', batch: '12th pcm tarabai park', branch: 'Tarabai Park', totalFees: 110000, paidFees: 110000, remainingFees: 0, feesStatus: 'Paid', status: 'Active', attendancePercent: 95, discountStatus: 'APPROVED', discountAmount: 15000, discountApprovedBy: 'Sanjay Shinde' }
      ] : [
        { id: 'stu-mp-101', student_id: 'SA-MP-1001', rollNumber: 'SA-MP-1001', full_name: 'Diya Patil', name: 'Diya Patil', mobile_number: '9822033441', phone: '9822033441', parent_name: 'Mahesh Patil', parent_mobile: '9822033442', parentPhone: '9822033442', standard: '11th Science', batch: '11th pcm Mangalvar Peth', branch: 'Mangalvar Peth', totalFees: 95000, paidFees: 95000, remainingFees: 0, feesStatus: 'Paid', status: 'Active', attendancePercent: 94, discountStatus: 'NONE' },
        { id: 'stu-mp-102', student_id: 'SA-MP-1002', rollNumber: 'SA-MP-1002', full_name: 'Rohan Deshmukh', name: 'Rohan Deshmukh', mobile_number: '9822033443', phone: '9822033443', parent_name: 'Ajay Deshmukh', parent_mobile: '9822033444', parentPhone: '9822033444', standard: '11th Science', batch: '11th pcb Mangalvar Peth', branch: 'Mangalvar Peth', totalFees: 95000, paidFees: 45000, remainingFees: 50000, feesStatus: 'Partial', status: 'Active', attendancePercent: 82, discountStatus: 'PENDING', discountAmount: 12000, discountReason: 'Sibling Concession' },
        { id: 'stu-mp-103', student_id: 'SA-MP-1003', rollNumber: 'SA-MP-1003', full_name: 'Sneha Kadam', name: 'Sneha Kadam', mobile_number: '9822033445', phone: '9822033445', parent_name: 'Sunil Kadam', parent_mobile: '9822033446', parentPhone: '9822033446', standard: '12th Science', batch: '12th pcm Mangalvar Peth', branch: 'Mangalvar Peth', totalFees: 110000, paidFees: 110000, remainingFees: 0, feesStatus: 'Paid', status: 'Active', attendancePercent: 96, discountStatus: 'APPROVED', discountAmount: 15000, discountApprovedBy: 'Shubham Sharma' }
      ];
    }
  },

  getById: async (id) => {
    const res = await api.get(`/students/${id}`);
    const student = res.data;
    const totalFees = Number(student.total_fees) || 0;
    const paidFees = Number(student.paid_fees) || 0;
    const remainingFees = Number(student.remaining_fees) || Math.max(0, totalFees - paidFees);
    
    let feesStatus = 'Pending';
    if (totalFees > 0 && paidFees >= totalFees) {
      feesStatus = 'Paid';
    } else if (paidFees > 0) {
      feesStatus = 'Partial';
    }

    return {
      ...student,
      name: student.full_name,
      phone: student.mobile_number,
      parentPhone: student.parent_mobile,
      parentName: student.parent_name,
      standard: student.standard,
      batch: student.batch,
      branch: student.branch,
      status: student.is_active !== false ? 'Active' : 'Inactive',
      rollNumber: student.student_id || 'N/A',
      totalFees,
      paidFees,
      remainingFees,
      feesStatus,
      profileCompleted: Boolean(student.profile_completed),
      originalFees: student.original_fees || student.total_fees || 0,
      discountAmount: student.discount_amount || 0,
      discountRequestedAmount: student.discount_requested_amount || student.discount_amount || 0,
      discountReason: student.discount_reason || '',
      discountStatus: student.discount_status || 'NONE',
      discountOfferedBy: student.discount_offered_by || '',
      discountRecommendedBy: student.discount_recommended_by || student.discount_offered_by || '',
      discountOfferedAt: student.discount_offered_at || null,
      discountApprovedBy: student.discount_approved_by || '',
      discountApprovedAt: student.discount_approved_at || null,
      discountRejectionReason: student.discount_rejection_reason || ''
    };
  },

  create: async (data) => {
    const totalFees = Number(data.totalFees ?? data.total_fees ?? 0);
    const paidFees = Number(data.paidFees ?? data.paid_fees ?? data.downPayment ?? 0);
    const remainingFees = Number(data.remainingFees ?? data.remaining_fees ?? Math.max(0, totalFees - paidFees));

    const cleanMobile = String(data.phone || data.mobile_number || data.mobileNumber || '').replace(/\D/g, '');
    const cleanParentMobile = String(data.parentPhone || data.parent_mobile || data.parentMobile || '').replace(/\D/g, '');

    const discAmount = Number(
      data.discount_amount ?? data.discountAmount ?? data.discount_requested_amount ?? data.discountRequestedAmount ?? 0
    ) || 0;
    const origFees = Number(
      data.original_fees ?? data.originalFees ?? (totalFees + discAmount)
    ) || totalFees;
    const discReason = data.discount_reason || data.discountReason || (discAmount > 0 ? 'Scholarship / Merit Concession' : '');
    const recommender = data.discount_recommended_by || data.discountRecommendedBy || data.discount_offered_by || data.discountOfferedBy || '';

    const payload = {
      student_id: data.rollNumber || data.student_id || undefined,
      full_name: (data.name || data.full_name || data.fullName || '').trim(),
      email: data.email?.trim() ? data.email.trim() : undefined,
      password: data.password || cleanMobile || undefined,
      mobile_number: cleanMobile || data.phone || data.mobile_number,
      parent_mobile: cleanParentMobile || data.parentPhone || data.parent_mobile || undefined,
      total_fees: totalFees,
      paid_fees: paidFees,
      remaining_fees: remainingFees,
      date_of_birth: data.date_of_birth || data.dob || undefined,
      gender: data.gender || undefined,
      address: data.address || undefined,
      parent_name: data.parentName || data.parent_name || undefined,
      standard: data.standard || data.course || undefined,
      batch: data.batch || undefined,
      branch: data.branch || 'Kolhapur Main Branch',
      academic_year: data.academic_year || '2025-2026',
      rfid_tag: data.rfidCard || data.rfid_tag || undefined,
      admission_date: data.admission_date || data.admissionDate || new Date().toISOString(),
      original_fees: origFees,
      discount_amount: discAmount,
      discount_requested_amount: discAmount,
      discount_reason: discReason,
      discount_recommended_by: recommender,
      discount_offered_by: recommender,
      discount_approved_by: data.discountApprovedBy || data.discount_approved_by || '',
      superadmin_auth_code: data.superadminAuthCode || data.superadmin_auth_code || ''
    };
    const res = await api.post('/students', payload);
    return res.data;
  },

  update: async (id, data) => {
    const payload = { ...data };
    if (data.name) payload.full_name = data.name;
    if (data.fullName) payload.full_name = data.fullName;
    if (data.phone) payload.mobile_number = data.phone;
    if (data.mobileNumber) payload.mobile_number = data.mobileNumber;
    if (data.parentPhone) payload.parent_mobile = data.parentPhone;
    if (data.parentMobile) payload.parent_mobile = data.parentMobile;
    if (data.parentName) payload.parent_name = data.parentName;
    if (data.standard) payload.standard = data.standard;
    if (data.batch) payload.batch = data.batch;
    if (data.branch) payload.branch = data.branch;
    if (data.dob) payload.date_of_birth = data.dob;
    if (data.totalFees !== undefined) payload.total_fees = Number(data.totalFees);
    if (data.paidFees !== undefined) payload.paid_fees = Number(data.paidFees);
    
    const res = await api.put(`/students/${id}`, payload);
    return res.data;
  },

  delete: async (id) => {
    const res = await api.delete(`/students/${id}`);
    return res.data;
  },

  offerDiscount: async (id, data) => {
    const res = await api.post(`/students/${id}/offer-discount`, data);
    return res.data;
  },

  approveDiscount: async (id, payload = {}) => {
    const res = await api.post(`/students/${id}/approve-discount`, payload);
    return res.data;
  },

  rejectDiscount: async (id, reason) => {
    const res = await api.post(`/students/${id}/reject-discount`, { reason });
    return res.data;
  },

  getDiscountApprovals: async (status = '') => {
    const activeBranch = getUserBranch();
    try {
      const res = await api.get('/students/discounts/approvals', { params: { status } });
      let data = res.data || [];
      if (activeBranch && Array.isArray(data)) {
        data = data.filter(item => {
          const b = (item.batch || item.standard || '').toLowerCase();
          const br = (item.branch || '').toLowerCase();
          if (activeBranch === 'Tarabai Park') {
            return b.includes('tarabai') || br.includes('tarabai') || (!b.includes('mangalvar') && !br.includes('mangalvar'));
          }
          if (activeBranch === 'Mangalvar Peth') {
            return b.includes('mangalvar') || b.includes('mangalwar') || br.includes('mangalvar') || br.includes('mangalwar');
          }
          return true;
        });
      }
      return data;
    } catch (e) {
      return [];
    }
  }
};

export default studentService;
