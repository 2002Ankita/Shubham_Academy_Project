import api from './api';

export const studentService = {
  getAll: async (params = {}) => {
    const res = await api.get('/students', { params });
    return res.data.map(student => {
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
        branch: student.branch || 'Kolhapur Main Branch',
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
    const remainingFees = Math.max(0, totalFees - paidFees);

    const cleanMobile = String(data.phone || data.mobile_number || data.mobileNumber || '').replace(/\D/g, '');
    const cleanParentMobile = String(data.parentPhone || data.parent_mobile || data.parentMobile || '').replace(/\D/g, '');

    const payload = {
      student_id: data.rollNumber || data.student_id || undefined,
      full_name: (data.name || data.full_name || data.fullName || '').trim(),
      email: data.email?.trim() ? data.email.trim() : undefined,
      password: data.password || 'password123',
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
      original_fees: Number(data.originalFees) || totalFees,
      discount_amount: Number(data.discountAmount) || 0,
      discount_reason: data.discountReason || '',
      discount_recommended_by: data.discountRecommendedBy || data.discount_recommended_by || data.discountOfferedBy || data.discount_offered_by || '',
      discount_offered_by: data.discountRecommendedBy || data.discount_recommended_by || data.discountOfferedBy || data.discount_offered_by || '',
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
    const res = await api.get('/students/discounts/approvals', { params: { status } });
    return res.data;
  }
};

export default studentService;
