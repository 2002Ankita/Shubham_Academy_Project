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
          standard: student.standard || '11th Science',
          batch: student.academic_batch || student.academicBatch || student.batch || '11th PCM',
          academicBatch: student.academic_batch || student.academicBatch || student.batch || '11th PCM',
          academic_batch: student.academic_batch || student.academicBatch || student.batch || '11th PCM',
          session: student.session || null,
          branch: student.branch || (activeBranch || 'Tarabai Park'),
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

      if (activeBranch && activeBranch !== 'ALL') {
        list = list.filter(st => isStudentInBranch(st, activeBranch));
      }

      return list;
    } catch (err) {
      console.warn('Student fetch fallback for branch:', activeBranch, err.message);
      return [];
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
      standard: student.standard || '11th Science',
      batch: student.academic_batch || student.academicBatch || student.batch || '11th PCM',
      academicBatch: student.academic_batch || student.academicBatch || student.batch || '11th PCM',
      academic_batch: student.academic_batch || student.academicBatch || student.batch || '11th PCM',
      session: student.session || null,
      branch: student.branch || 'Tarabai Park',
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

    const chosenBatch = data.academicBatch || data.academic_batch || data.batch || '11th PCM';
    const chosenStandard = data.standard || (chosenBatch.startsWith('12') ? '12th Science' : '11th Science');

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
      standard: chosenStandard,
      batch: chosenBatch,
      academic_batch: chosenBatch,
      session: data.session || undefined,
      branch: data.branch || 'Tarabai Park',
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
    if (data.academicBatch) payload.academic_batch = data.academicBatch;
    if (data.academic_batch) payload.academic_batch = data.academic_batch;
    if (data.session !== undefined) payload.session = data.session;
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
