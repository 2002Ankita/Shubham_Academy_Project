import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import BackButton from '../../components/common/BackButton';
import {
  User,
  Phone,
  CreditCard,
  AlertCircle,
  FileText,
  ShieldCheck,
  Lock,
  UserCheck,
  Mail,
  GraduationCap,
  Users,
  Tag,
  ArrowRight
} from 'lucide-react';
import studentService from '../../services/studentService';
import batchService from '../../services/batchService';
import feeService from '../../services/feeService';
import notificationService from '../../services/notificationService';
import { useAuth } from '../../hooks/useAuth';
import BranchBatchSelector from '../../components/common/BranchBatchSelector';
import {
  BRANCH_TARABAI,
  BRANCH_MANGALWAR,
  ACADEMIC_BATCHES,
  isSessionRequired,
  formatStudentBatchDisplay
} from '../../config/branchBatchConfig';
import { getUserBranch } from '../../utils/branchUtils';

export const STANDARD_BATCHES = [
  '11th PCM',
  '11th PCB',
  '11th PCMB',
  '12th PCM',
  '12th PCB',
  '12th PCMB'
];

export default function StudentRegistration() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const activeBranch = getUserBranch(user);
  const initialBranch = (activeBranch && activeBranch.toLowerCase().includes('mangalwar')) ? BRANCH_MANGALWAR : BRANCH_TARABAI;
  const [loading, setLoading] = useState(false);
  const [batches, setBatches] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [feeStructures, setFeeStructures] = useState([]);

  // Admin Role-Based Form State:
  // Admin fills: Student Name, Student Email ID, Student Mobile, Parent Mobile, Branch, Session, Academic Batch, Fee Details
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobileNumber: '',
    parentPhone: '',
    branch: initialBranch,
    session: '',
    academicBatch: '11th PCM',
    standard: '11th Science',
    batch: `${initialBranch} • 11th PCM`,
    originalFees: 55000,
    discountAmount: 0,
    discountReason: '',
    discountRecommendedBy: 'Miss Shilpa (Counselor)',
    totalFees: 55000,
    paidFees: 15000,
    remainingFees: 40000,
    password: '',
    admissionDate: new Date().toISOString().split('T')[0]
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    feeService.getStructures(activeBranch).then((data) => {
      if (Array.isArray(data)) setFeeStructures(data);
    }).catch((err) => console.warn('Could not load fee structures:', err));
  }, [activeBranch]);
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let updated = { ...formData, [name]: value };

    // When mobile number is typed, keep password synced to mobile number
    if (name === 'mobileNumber') {
      const clean = value.replace(/\D/g, '');
      updated.password = clean;
    }

    // Real-time calculation for Fees with Discount
    if (name === 'originalFees' || name === 'discountAmount' || name === 'totalFees' || name === 'paidFees') {
      const orig = Number(name === 'originalFees' ? value : updated.originalFees) || 0;
      const disc = Number(name === 'discountAmount' ? value : updated.discountAmount) || 0;

      // At registration time, the payable fee before discount approval is the gross course fee.
      // Once approved, the discount is officially deducted.
      updated.totalFees = orig;
      const paid = Number(name === 'paidFees' ? value : updated.paidFees) || 0;
      updated.remainingFees = Math.max(0, orig - paid);
    }

    setFormData(updated);

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleBranchChange = (newBranch) => {
    const sessionNeeded = isSessionRequired(newBranch);
    const newSession = sessionNeeded ? (formData.session || 'Morning') : '';
    const currentAcademic = formData.academicBatch || '11th PCM';
    const std = currentAcademic.startsWith('12th') ? '12th Science' : '11th Science';
    const fullBatch = `${currentAcademic} ${newBranch}${newSession ? ` (${newSession})` : ''}`;

    let newOriginalFee = formData.originalFees;
    if (feeStructures && feeStructures.length > 0) {
      const match = feeStructures.find(
        (s) => (s.branch === newBranch && s.standard === std) ||
               (s.batch && s.batch.toLowerCase().includes(currentAcademic.toLowerCase()))
      );
      if (match && match.total_fee > 0) {
        newOriginalFee = match.total_fee;
      }
    }

    const disc = Number(formData.discountAmount) || 0;
    const netTotal = Math.max(0, newOriginalFee - disc);
    const paid = Number(formData.paidFees) || 0;

    setFormData((prev) => ({
      ...prev,
      branch: newBranch,
      session: newSession,
      academicBatch: currentAcademic,
      batch: fullBatch,
      standard: std,
      originalFees: newOriginalFee,
      totalFees: netTotal,
      remainingFees: Math.max(0, netTotal - paid)
    }));

    setErrors((prev) => ({ ...prev, branch: '', session: '', academicBatch: '' }));
  };

  const handleSessionChange = (newSession) => {
    const currentAcademic = formData.academicBatch || '11th PCM';
    const fullBatch = `${currentAcademic} ${formData.branch}${newSession ? ` (${newSession})` : ''}`;
    setFormData((prev) => ({
      ...prev,
      session: newSession,
      batch: fullBatch
    }));
    setErrors((prev) => ({ ...prev, session: '' }));
  };

  const handleAcademicBatchChange = (newAcademicBatch) => {
    const std = newAcademicBatch.startsWith('12th') ? '12th Science' : '11th Science';
    const fullBatch = `${newAcademicBatch} ${formData.branch}${formData.session ? ` (${formData.session})` : ''}`;

    let newOriginalFee = formData.originalFees;
    if (feeStructures && feeStructures.length > 0) {
      const match = feeStructures.find(
        (s) => (s.branch === formData.branch && s.standard === std) ||
               (s.batch && s.batch.toLowerCase().includes(newAcademicBatch.toLowerCase()))
      );
      if (match && match.total_fee > 0) {
        newOriginalFee = match.total_fee;
      }
    }

    const disc = Number(formData.discountAmount) || 0;
    const netTotal = Math.max(0, newOriginalFee - disc);
    const paid = Number(formData.paidFees) || 0;

    setFormData((prev) => ({
      ...prev,
      academicBatch: newAcademicBatch,
      batch: fullBatch,
      standard: std,
      originalFees: newOriginalFee,
      totalFees: netTotal,
      remainingFees: Math.max(0, netTotal - paid)
    }));

    setErrors((prev) => ({ ...prev, academicBatch: '', batch: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.fullName.trim()) {
      errs.fullName = 'Student Full Name is required';
    } else if (formData.fullName.trim().length < 3) {
      errs.fullName = 'Full Name must be at least 3 characters';
    }

    if (formData.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Please enter a valid email address';
    }

    const cleanMobile = formData.mobileNumber.replace(/\D/g, '');
    if (!cleanMobile) {
      errs.mobileNumber = 'Student Mobile Number is required';
    } else if (cleanMobile.length !== 10) {
      errs.mobileNumber = 'Must be a valid 10-digit mobile number';
    }

    const cleanParentMobile = formData.parentPhone.replace(/\D/g, '');
    if (!cleanParentMobile) {
      errs.parentPhone = 'Parent Mobile Number is required for alerts';
    } else if (cleanParentMobile.length !== 10) {
      errs.parentPhone = 'Must be a valid 10-digit mobile number';
    } else if (cleanMobile && cleanMobile === cleanParentMobile) {
      errs.parentPhone = 'Parent mobile must be different from student mobile';
    }

    if (!formData.branch) {
      errs.branch = 'Please select a branch';
    }
    if (isSessionRequired(formData.branch) && !formData.session) {
      errs.session = 'Please select Morning or Afternoon session';
    }
    if (!formData.academicBatch) {
      errs.academicBatch = 'Please select an academic batch';
    }

    const orig = Number(formData.originalFees);
    const disc = Number(formData.discountAmount);
    const total = Number(formData.totalFees);
    const paid = Number(formData.paidFees);

    if (isNaN(orig) || orig < 0) {
      errs.originalFees = 'Course fee must be a valid positive amount';
    }
    if (isNaN(disc) || disc < 0) {
      errs.discountAmount = 'Discount amount cannot be negative';
    } else if (disc > orig) {
      errs.discountAmount = 'Discount cannot exceed course fee';
    }
    if (isNaN(total) || total < 0) {
      errs.totalFees = 'Total fee must be a valid positive amount';
    }
    if (isNaN(paid) || paid < 0) {
      errs.paidFees = 'Paid fee amount cannot be negative';
    } else if (paid > total) {
      errs.paidFees = 'Paid amount cannot exceed total course fee';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please correct the highlighted fields before submitting.');
      return;
    }

    setLoading(true);
    try {
      const cleanMobile = formData.mobileNumber.replace(/\D/g, '');
      const cleanParentMobile = formData.parentPhone.replace(/\D/g, '');
      const discAmount = Number(formData.discountAmount) || 0;
      const origFees = Number(formData.originalFees) || 0;
      const paidFees = Number(formData.paidFees) || 0;
      // Before discount approval, the effective course fee is the original fees.
      const effectiveTotalFees = origFees;
      const remainingFees = Math.max(0, effectiveTotalFees - paidFees);

      const payload = {
        name: formData.fullName.trim(),
        full_name: formData.fullName.trim(),
        email: formData.email?.trim() || undefined,
        phone: cleanMobile,
        mobile_number: cleanMobile,
        parentPhone: cleanParentMobile,
        parent_mobile: cleanParentMobile,
        branch: formData.branch,
        session: formData.session || undefined,
        academic_batch: formData.academicBatch,
        academicBatch: formData.academicBatch,
        standard: formData.standard || undefined,
        batch: formData.batch || `${formData.academicBatch} ${formData.branch}`,
        totalFees: effectiveTotalFees,
        total_fees: effectiveTotalFees,
        original_fees: origFees,
        discountAmount: discAmount,
        discount_amount: discAmount,
        discountRequestedAmount: discAmount,
        discount_requested_amount: discAmount,
        discountReason: formData.discountReason || (discAmount > 0 ? 'Scholarship / Merit Concession' : ''),
        discount_reason: formData.discountReason || (discAmount > 0 ? 'Scholarship / Merit Concession' : ''),
        discountRecommendedBy: discAmount > 0 ? (formData.discountRecommendedBy || 'Miss Shilpa (Counselor)') : '',
        discount_recommended_by: discAmount > 0 ? (formData.discountRecommendedBy || 'Miss Shilpa (Counselor)') : '',
        discountOfferedBy: discAmount > 0 ? (formData.discountRecommendedBy || 'Miss Shilpa (Counselor)') : '',
        discount_offered_by: discAmount > 0 ? (formData.discountRecommendedBy || 'Miss Shilpa (Counselor)') : '',
        paidFees: paidFees,
        paid_fees: paidFees,
        remainingFees: remainingFees,
        remaining_fees: remainingFees,
        password: formData.password || formData.mobileNumber?.replace(/\D/g, '') || undefined,
        admission_date: new Date(formData.admissionDate).toISOString()
      };

      const result = await studentService.create(payload);

      // If discount was recommended, submit real-time notification to Superadmin dashboard
      if (discAmount > 0) {
        notificationService.addNotification({
          id: `NTF-DISC-${result?.id || Date.now()}`,
          title: `🔔 Fee Concession Approval: ${formData.fullName}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          formattedDateTime: new Date().toLocaleString(),
          type: 'discount_approval',
          category: 'Discount & Fees',
          priority: 'High',
          author: formData.discountRecommendedBy?.trim() || 'Miss Shilpa (Counselor)',
          details: `${formData.discountRecommendedBy?.trim() || 'Counselor'} recommended a concession of ₹${discAmount.toLocaleString()} for ${formData.fullName} (${formData.batch || formData.standard || 'Course'}). Superadmin approval is required before student ledger updates.`,
          read: false,
          forSuperAdminOnly: true,
          branch: activeBranch,
          studentId: result?.id,
          studentName: formData.fullName,
          discountAmount: discAmount,
          recommendedBy: formData.discountRecommendedBy?.trim() || 'Miss Shilpa'
        });
      }

      toast.success(
        discAmount > 0
          ? `Student ${formData.fullName} successfully registered! Concession of ₹${discAmount.toLocaleString()} submitted to Superadmin for approval.`
          : `Student ${formData.fullName} successfully registered to ${formData.batch || 'Batch'}! ID: ${result?.student_id || result?.rollNumber || 'Created'}`
      );
      navigate('/admin/students');
    } catch (error) {
      console.error('Registration failed:', error);
      const detail = error.response?.data?.detail;
      let errMsg = 'Failed to register student';
      if (typeof detail === 'string') {
        errMsg = detail;
      } else if (Array.isArray(detail) && detail.length > 0) {
        const item = detail[0];
        const fieldName = Array.isArray(item.loc) ? item.loc.filter(l => l !== 'body' && l !== 'response').join(' ') : '';
        errMsg = fieldName ? `${fieldName}: ${item.msg}` : (item.msg || 'Validation error');
      } else if (error.message) {
        errMsg = error.message;
      }
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid px-0 px-md-3 py-2" style={{ maxWidth: '1100px' }}>
      {/* Top Header & Breadcrumb */}
      <div className="mb-3">
        <BackButton to="/admin/students" label="Back to Student Directory" />
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mt-2">
          <div>
            <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
              Student Registration
            </h3>
            <span className="small text-sa-muted">
              Admin Entry: Fill in initial basic details and fee structure. Student completes the rest after login.
            </span>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/admin/students')}
              className="btn d-inline-flex align-items-center gap-2 px-3 py-1.5 rounded-2 fw-semibold transition-all shadow-sm"
              style={{
                border: '1.5px solid #8B1216',
                color: '#8B1216',
                fontSize: '0.85rem',
                backgroundColor: '#FFFFFF'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#8B1216';
                e.currentTarget.style.color = '#FFFFFF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#FFFFFF';
                e.currentTarget.style.color = '#8B1216';
              }}
            >
              <span>View All Students</span>
              <ArrowRight size={14} />
            </button>

            <span
              className="badge py-2 px-3 rounded-pill fw-semibold"
              style={{
                backgroundColor: 'rgba(139, 18, 22, 0.08)',
                color: '#8B1216',
                border: '1px solid rgba(139, 18, 22, 0.2)'
              }}
            >
              <ShieldCheck size={14} className="me-1 inline-block" /> Role-Based Data Entry
            </span>
          </div>
        </div>
      </div>

      {/* Info Notice Box */}
      <div
        className="rounded-3 p-3 mb-4 d-flex align-items-start gap-3"
        style={{
          backgroundColor: '#FFF8F0',
          border: '1px solid #FFE0B2'
        }}
      >
        <AlertCircle size={20} className="text-warning flex-shrink-0 mt-0.5" />
        <div className="small text-sa-charcoal">
          <strong>Workflow Note:</strong> The Admin registers the student with their name, contact details, assigned
          study batch, and course fees. These fields are permanently locked (read-only) for the student. The student
          will log in to their dashboard to complete their remaining personal and profile details.
        </div>
      </div>

      {/* Registration Form & Summary Container */}
      <div className="row g-4">
        {/* Main Form Column */}
        <div className="col-12 col-lg-8">
          <form onSubmit={handleSubmit} noValidate>
            <div className="bg-white rounded-3 border shadow-sm p-4 mb-4">
              {/* Section 1: Basic Information */}
              <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: '32px', height: '32px', backgroundColor: '#FDF0F0', color: '#8B1216' }}
                >
                  <User size={18} />
                </div>
                <div>
                  <h6 className="fw-bold m-0 text-sa-charcoal">1. Student & Parent Contact Details</h6>
                  <span className="text-muted small" style={{ fontSize: '0.8rem' }}>
                    Admin-entered basic identification
                  </span>
                </div>
              </div>

              <div className="row g-3 mb-4">
                {/* Student Full Name */}
                <div className="col-12 col-md-6">
                  <label className="form-label small fw-semibold text-sa-charcoal">
                    Student Full Name <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted">
                      <User size={16} />
                    </span>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="e.g., Rohan Ajay Sharma"
                      className={`form-control ${errors.fullName ? 'is-invalid' : ''}`}
                      disabled={loading}
                    />
                    {errors.fullName && <div className="invalid-feedback">{errors.fullName}</div>}
                  </div>
                  <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                    Enter official name as per previous records.
                  </span>
                </div>

                {/* Student Email ID - Optional */}
                <div className="col-12 col-md-6">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label small fw-semibold text-sa-charcoal m-0">
                      Student Email ID
                    </label>
                    <span className="badge bg-light text-muted border fw-normal" style={{ fontSize: '0.70rem' }}>
                      Optional
                    </span>
                  </div>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted">
                      <Mail size={16} />
                    </span>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Optional — leave blank to use mobile login"
                      className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                      disabled={loading}
                    />
                    {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                  </div>
                  <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                    Optional. Student can register and log in solely using their mobile number.
                  </span>
                </div>

                {/* Student Mobile Number - Required Unique ID & Password */}
                <div className="col-12 col-md-6">
                  <label className="form-label small fw-semibold text-sa-charcoal">
                    Student Mobile Number <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted">
                      <Phone size={16} />
                    </span>
                    <input
                      type="tel"
                      name="mobileNumber"
                      value={formData.mobileNumber}
                      onChange={handleInputChange}
                      maxLength={10}
                      placeholder="10-digit mobile number"
                      className={`form-control ${errors.mobileNumber ? 'is-invalid' : ''}`}
                      disabled={loading}
                    />
                    {errors.mobileNumber && <div className="invalid-feedback">{errors.mobileNumber}</div>}
                  </div>
                  <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                    Unique Student Login ID and default portal Password.
                  </span>
                </div>

                {/* Parent Mobile Number */}
                <div className="col-12 col-md-6">
                  <label className="form-label small fw-semibold text-sa-charcoal">
                    Parent Mobile Number <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted">
                      <Phone size={16} />
                    </span>
                    <input
                      type="tel"
                      name="parentPhone"
                      value={formData.parentPhone}
                      onChange={handleInputChange}
                      maxLength={10}
                      placeholder="Parent 10-digit mobile"
                      className={`form-control ${errors.parentPhone ? 'is-invalid' : ''}`}
                      disabled={loading}
                    />
                    {errors.parentPhone && <div className="invalid-feedback">{errors.parentPhone}</div>}
                  </div>
                  <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                    Used for gate entry notifications and fee reminder SMS.
                  </span>
                </div>
              </div>

              {/* Section 2: Academic Class & Batch Allocation (Admission Source of Truth) */}
              <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: '32px', height: '32px', backgroundColor: '#FDF0F0', color: '#8B1216' }}
                >
                  <GraduationCap size={18} />
                </div>
                <div>
                  <h6 className="fw-bold m-0 text-sa-charcoal">2. Branch & Batch Allocation (Admission Source of Truth)</h6>
                  <span className="text-muted small" style={{ fontSize: '0.8rem' }}>
                    Select Branch first, followed by Session (if Mangalwar Peth) and Academic Batch
                  </span>
                </div>
              </div>

              <div className="p-3 bg-light rounded-3 border mb-4">
                <BranchBatchSelector
                  branch={formData.branch}
                  session={formData.session}
                  academicBatch={formData.academicBatch}
                  onBranchChange={handleBranchChange}
                  onSessionChange={handleSessionChange}
                  onBatchChange={handleAcademicBatchChange}
                  required={true}
                  disabled={loading}
                  fixedBranch={Boolean(activeBranch && !user?.role?.toLowerCase().includes('super'))}
                  showAllOption={false}
                />

                {(errors.branch || errors.session || errors.academicBatch) && (
                  <div className="text-danger small mt-2">
                    {errors.branch || errors.session || errors.academicBatch}
                  </div>
                )}

                <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-3 pt-2 border-top">
                  <div className="small text-sa-charcoal">
                    <span className="text-muted">Enrolled Standard:</span>{' '}
                    <span className="badge bg-white text-dark border px-2 py-1 fw-bold">
                      {formData.standard}
                    </span>
                  </div>
                  <div className="small text-sa-charcoal">
                    <span className="text-muted">Master Placement:</span>{' '}
                    <span className="badge py-1 px-2.5 rounded-pill fw-bold" style={{ backgroundColor: '#8B1216', color: '#FFFFFF' }}>
                      {formData.branch} • {formData.session ? `${formData.session} • ` : ''}{formData.academicBatch}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 3: Fee Details */}
              <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: '32px', height: '32px', backgroundColor: '#FDF0F0', color: '#8B1216' }}
                >
                  <CreditCard size={18} />
                </div>
                <div>
                  <h6 className="fw-bold m-0 text-sa-charcoal">3. Fee Details & Initial Collection</h6>
                  <span className="text-muted small" style={{ fontSize: '0.8rem' }}>
                    Course pricing, initial deposit, and remaining balance
                  </span>
                </div>
              </div>

              <div className="row g-3 mb-4">
                {/* Total / Course Fees */}
                <div className="col-12 col-md-4">
                  <label className="form-label small fw-semibold text-sa-charcoal">
                    Course Fee (Gross) (₹) <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted fw-bold">₹</span>
                    <input
                      type="number"
                      name="originalFees"
                      value={formData.originalFees}
                      onChange={handleInputChange}
                      min="0"
                      step="500"
                      placeholder="e.g. 45000"
                      className={`form-control ${errors.originalFees ? 'is-invalid' : ''}`}
                      disabled={loading}
                    />
                    {errors.originalFees && <div className="invalid-feedback">{errors.originalFees}</div>}
                  </div>
                  <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                    Standard course catalog fee
                  </span>
                </div>

                {/* Paid Fees */}
                <div className="col-12 col-md-4">
                  <label className="form-label small fw-semibold text-sa-charcoal">
                    Paid Fees (Initial) (₹) <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted fw-bold">₹</span>
                    <input
                      type="number"
                      name="paidFees"
                      value={formData.paidFees}
                      onChange={handleInputChange}
                      min="0"
                      step="500"
                      placeholder="e.g. 15000"
                      className={`form-control ${errors.paidFees ? 'is-invalid' : ''}`}
                      disabled={loading}
                    />
                    {errors.paidFees && <div className="invalid-feedback">{errors.paidFees}</div>}
                  </div>
                  <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                    Initial deposit collected at admission
                  </span>
                </div>

                {/* Remaining Fees */}
                <div className="col-12 col-md-4">
                  <label className="form-label small fw-semibold text-sa-charcoal">
                    Remaining Fees (₹)
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted fw-bold">₹</span>
                    <input
                      type="text"
                      name="remainingFees"
                      value={formData.remainingFees}
                      readOnly
                      className="form-control fw-bold text-danger bg-light"
                    />
                  </div>
                  <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                    Auto-calculated balance
                  </span>
                </div>
              </div>

              {/* Section 4: Discount & Scholarship Concession (Optional) */}
              <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: '32px', height: '32px', backgroundColor: '#FDF0F0', color: '#8B1216' }}
                >
                  <Tag size={18} />
                </div>
                <div>
                  <h6 className="fw-bold m-0 text-sa-charcoal">4. Fee Concession & Scholarship (Optional)</h6>
                  <span className="text-muted small" style={{ fontSize: '0.8rem' }}>
                    Recommend scholarship discount requiring Super Admin approval
                  </span>
                </div>
              </div>

              <div className="row g-3 mb-4">
                {/* Discount Amount */}
                <div className="col-12 col-md-4">
                  <label className="form-label small fw-semibold text-sa-charcoal">
                    Discount / Concession (₹)
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted fw-bold">₹</span>
                    <input
                      type="number"
                      name="discountAmount"
                      value={formData.discountAmount}
                      onChange={handleInputChange}
                      min="0"
                      step="500"
                      placeholder="e.g. 5000"
                      className={`form-control ${errors.discountAmount ? 'is-invalid' : ''}`}
                      disabled={loading}
                    />
                    {errors.discountAmount && <div className="invalid-feedback">{errors.discountAmount}</div>}
                  </div>
                  <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                    Deducted from gross course fee
                  </span>
                </div>

                {/* Discount Reason */}
                <div className="col-12 col-md-4">
                  <label className="form-label small fw-semibold text-sa-charcoal">
                    Concession Reason / Category
                  </label>
                  <input
                    type="text"
                    name="discountReason"
                    value={formData.discountReason}
                    onChange={handleInputChange}
                    placeholder="e.g., Merit Scholarship, Sibling"
                    className="form-control"
                    disabled={loading}
                  />
                  <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                    Justification for discount approval
                  </span>
                </div>

                {/* Recommended By */}
                <div className="col-12 col-md-4">
                  <label className="form-label small fw-semibold text-sa-charcoal">
                    Recommended By (Staff / Counselor)
                  </label>
                  <input
                    type="text"
                    name="discountRecommendedBy"
                    value={formData.discountRecommendedBy}
                    onChange={handleInputChange}
                    placeholder="e.g., Miss Shilpa (Counselor)"
                    className="form-control"
                    disabled={loading}
                  />
                  <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                    Authorizing officer recommending concession
                  </span>
                </div>

                {Number(formData.discountAmount) > 0 && (
                  <div className="col-12">
                    <div
                      className="p-2.5 rounded-2 d-flex align-items-center gap-2 text-sa-charcoal small"
                      style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}
                    >
                      <ShieldCheck size={18} className="text-warning-emphasis flex-shrink-0" />
                      <span>
                        <strong>Concession Workflow:</strong> Concession request of ₹
                        {Number(formData.discountAmount).toLocaleString()} is submitted for Superadmin approval. 
                        The standard fee payable before approval is ₹{Number(formData.originalFees).toLocaleString()}. 
                        Once approved by Superadmin, the approved fee will update to ₹{Math.max(0, Number(formData.originalFees) - Number(formData.discountAmount)).toLocaleString()}.
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Fee Breakdown Visual Indicator */}
              <div
                className="mt-4 p-3 rounded-3"
                style={{ backgroundColor: '#F8F9FA', border: '1px solid #E9ECEF' }}
              >
                <div className="d-flex justify-content-between align-items-center mb-1 small">
                  <span className="text-muted fw-semibold">Fee Collection Progress:</span>
                  <span className="fw-bold text-sa-charcoal">
                    ₹{Number(formData.paidFees || 0).toLocaleString()} of ₹
                    {Number(formData.totalFees || 0).toLocaleString()} (
                    {formData.totalFees > 0
                      ? Math.round(((formData.paidFees || 0) / formData.totalFees) * 100)
                      : 0}
                    %)
                  </span>
                </div>
                <div className="progress" style={{ height: '8px' }}>
                  <div
                    className="progress-bar"
                    role="progressbar"
                    style={{
                      width: `${
                        formData.totalFees > 0
                          ? Math.min(100, ((formData.paidFees || 0) / formData.totalFees) * 100)
                          : 0
                      }%`,
                      backgroundColor: '#8B1216'
                    }}
                  />
                </div>
              </div>

              {/* Submit Button Section */}
              <div className="d-flex align-items-center justify-content-between gap-3 mt-4 pt-3 border-top">
                <button
                  type="button"
                  className="btn btn-outline-secondary px-4"
                  onClick={() =>
                    setFormData({
                      fullName: '',
                      email: '',
                      mobileNumber: '',
                      parentPhone: '',
                      standard: '11th Science',
                      batch: '',
                      originalFees: 45000,
                      discountAmount: 0,
                      discountReason: '',
                      discountRecommendedBy: 'Miss Shilpa (Counselor)',
                      totalFees: 45000,
                      paidFees: 15000,
                      remainingFees: 30000,
                      password: '',
                      admissionDate: new Date().toISOString().split('T')[0]
                    })
                  }
                  disabled={loading}
                >
                  Clear Form
                </button>

                <button
                  type="submit"
                  className="btn text-white px-5 py-2 fw-semibold d-inline-flex align-items-center gap-2 shadow-sm"
                  style={{ backgroundColor: '#8B1216' }}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                      <span>Creating Student Account...</span>
                    </>
                  ) : (
                    <>
                      <UserCheck size={18} />
                      <span>Register Student Account</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Sidebar Summary & Live Preview */}
        <div className="col-12 col-lg-4">
          <div className="bg-white rounded-3 border shadow-sm p-4 sticky-top" style={{ top: '20px' }}>
            <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
              <FileText size={20} style={{ color: '#8B1216' }} />
              <h6 className="fw-bold m-0 text-sa-charcoal">Registration Summary</h6>
            </div>

            <div className="d-flex flex-column gap-3 small">
              <div className="d-flex justify-content-between border-bottom pb-2">
                <span className="text-muted">Student Name:</span>
                <span className="fw-bold text-sa-charcoal text-end">
                  {formData.fullName || <em className="text-muted fw-normal">Not entered</em>}
                </span>
              </div>

              <div className="d-flex justify-content-between border-bottom pb-2">
                <span className="text-muted">Student Email:</span>
                <span className="fw-semibold text-sa-charcoal text-end text-truncate" style={{ maxWidth: '170px' }} title={formData.email}>
                  {formData.email || <em className="text-muted fw-normal">Auto-generated</em>}
                </span>
              </div>

              <div className="d-flex justify-content-between border-bottom pb-2">
                <span className="text-muted">Student Mobile:</span>
                <span className="fw-semibold text-sa-charcoal">
                  {formData.mobileNumber || <em className="text-muted fw-normal">Pending</em>}
                </span>
              </div>

              <div className="d-flex justify-content-between border-bottom pb-2">
                <span className="text-muted">Parent Mobile:</span>
                <span className="fw-semibold text-sa-charcoal">
                  {formData.parentPhone || <em className="text-muted fw-normal">Pending</em>}
                </span>
              </div>

              <div className="d-flex justify-content-between border-bottom pb-2">
                <span className="text-muted">Branch:</span>
                <span className="fw-bold text-sa-charcoal">
                  {formData.branch}
                </span>
              </div>

              {formData.session ? (
                <div className="d-flex justify-content-between border-bottom pb-2">
                  <span className="text-muted">Session:</span>
                  <span className="badge bg-primary-subtle text-primary border">
                    {formData.session}
                  </span>
                </div>
              ) : null}

              <div className="d-flex justify-content-between border-bottom pb-2">
                <span className="text-muted">Academic Batch:</span>
                <span className="fw-bold text-sa-primary">
                  {formData.academicBatch}
                </span>
              </div>

              <div className="d-flex justify-content-between border-bottom pb-2">
                <span className="text-muted">Standard / Class:</span>
                <span className="fw-semibold text-sa-charcoal">
                  {formData.standard || '11th Science'}
                </span>
              </div>

              <div className="d-flex justify-content-between border-bottom pb-2">
                <span className="text-muted">Gross Course Fee:</span>
                <span className="fw-bold text-sa-charcoal">
                  ₹{Number(formData.originalFees || formData.totalFees || 0).toLocaleString()}
                </span>
              </div>

              {Number(formData.discountAmount) > 0 && (
                <div className="d-flex justify-content-between border-bottom pb-2">
                  <span className="text-muted">Recommended Discount:</span>
                  <span className="fw-bold text-success">
                    -₹{Number(formData.discountAmount).toLocaleString()}
                    <span className="badge bg-warning-subtle text-warning ms-1" style={{ fontSize: '0.7rem' }}>
                      Pending Approval
                    </span>
                  </span>
                </div>
              )}

              <div className="d-flex justify-content-between border-bottom pb-2">
                <span className="text-muted">Net Payable Fees:</span>
                <span className="fw-bold text-sa-charcoal">
                  ₹{Number(formData.totalFees || 0).toLocaleString()}
                </span>
              </div>

              <div className="d-flex justify-content-between border-bottom pb-2">
                <span className="text-muted">Amount Paid:</span>
                <span className="fw-bold text-success">
                  ₹{Number(formData.paidFees || 0).toLocaleString()}
                </span>
              </div>

              <div className="d-flex justify-content-between border-bottom pb-2">
                <span className="text-muted">Remaining Balance:</span>
                <span className="fw-bold text-danger">
                  ₹{Number(formData.remainingFees || 0).toLocaleString()}
                </span>
              </div>

              <div className="d-flex justify-content-between border-bottom pb-2">
                <span className="text-muted">Default Password:</span>
                <span className="badge bg-light text-dark font-monospace border">
                  {formData.mobileNumber ? formData.mobileNumber.replace(/\D/g, '') : <span className="text-muted">Same as Mobile No.</span>}
                </span>
              </div>

              <div className="d-flex justify-content-between">
                <span className="text-muted">Profile Status:</span>
                <span className="badge bg-warning text-dark fw-semibold">
                  Pending Student Entry
                </span>
              </div>
            </div>

            {/* Role Responsibility Card */}
            <div
              className="mt-4 p-3 rounded-3"
              style={{ backgroundColor: '#FDF0F0', border: '1px solid rgba(139, 18, 22, 0.15)' }}
            >
              <div className="d-flex align-items-center gap-2 mb-1" style={{ color: '#8B1216' }}>
                <Lock size={15} />
                <span className="fw-bold small">Read-Only Enforced</span>
              </div>
              <p className="text-muted small m-0" style={{ fontSize: '0.78rem' }}>
                Once registered, Student Name, Student Mobile, Parent Mobile, Assigned Batch, and Fees will be strictly read-only for
                the student.
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
