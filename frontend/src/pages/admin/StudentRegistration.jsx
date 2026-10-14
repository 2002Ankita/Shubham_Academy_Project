import React, { useState, useEffect } from 'react';
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
  Users
} from 'lucide-react';
import studentService from '../../services/studentService';
import batchService from '../../services/batchService';

export default function StudentRegistration() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [batches, setBatches] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(true);

  // Admin Role-Based Form State:
  // Admin fills: Student Name, Student Email ID, Student Mobile, Parent Mobile, Standard, Batch, Fee Details (Total, Paid, Remaining)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobileNumber: '',
    parentPhone: '',
    standard: '11th Science',
    batch: '',
    totalFees: 45000,
    paidFees: 15000,
    remainingFees: 30000,
    password: 'password123',
    admissionDate: new Date().toISOString().split('T')[0]
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    batchService.getBatches()
      .then((data) => {
        if (Array.isArray(data)) {
          setBatches(data);
          // Auto-select first batch if none chosen
          if (data.length > 0 && !formData.batch) {
            setFormData((prev) => ({
              ...prev,
              batch: data[0].name,
              standard: data[0].standard || prev.standard || '11th Science'
            }));
          }
        }
      })
      .catch((err) => {
        console.warn('Could not load batches list:', err);
      })
      .finally(() => {
        setLoadingBatches(false);
      });
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let updated = { ...formData, [name]: value };

    // Real-time calculation for Remaining Fees
    if (name === 'totalFees' || name === 'paidFees') {
      const total = Number(name === 'totalFees' ? value : formData.totalFees) || 0;
      const paid = Number(name === 'paidFees' ? value : formData.paidFees) || 0;
      updated.remainingFees = Math.max(0, total - paid);
    }

    setFormData(updated);

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleBatchChange = (e) => {
    const selectedBatch = e.target.value;
    const found = batches.find((b) => b.name === selectedBatch);
    setFormData((prev) => ({
      ...prev,
      batch: selectedBatch,
      standard: found?.standard || prev.standard || '11th Science'
    }));
    if (errors.batch) {
      setErrors((prev) => ({ ...prev, batch: '' }));
    }
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


    const total = Number(formData.totalFees);
    const paid = Number(formData.paidFees);

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
      const totalFees = Number(formData.totalFees) || 0;
      const paidFees = Number(formData.paidFees) || 0;
      const remainingFees = Math.max(0, totalFees - paidFees);

      const payload = {
        name: formData.fullName.trim(),
        full_name: formData.fullName.trim(),
        email: formData.email?.trim() || undefined,
        phone: cleanMobile,
        mobile_number: cleanMobile,
        parentPhone: cleanParentMobile,
        parent_mobile: cleanParentMobile,
        standard: formData.standard || undefined,
        batch: formData.batch || undefined,
        totalFees: totalFees,
        total_fees: totalFees,
        paidFees: paidFees,
        paid_fees: paidFees,
        remaining_fees: remainingFees,
        password: formData.password || 'password123',
        admission_date: new Date(formData.admissionDate).toISOString()
      };

      const result = await studentService.create(payload);
      toast.success(`Student ${formData.fullName} successfully registered to ${formData.batch || 'Batch'}! ID: ${result?.student_id || result?.rollNumber || 'Created'}`);
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

                {/* Student Email ID */}
                <div className="col-12 col-md-6">
                  <label className="form-label small fw-semibold text-sa-charcoal">
                    Student Email ID
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted">
                      <Mail size={16} />
                    </span>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="e.g., rohan.sharma@example.com"
                      className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                      disabled={loading}
                    />
                    {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                  </div>
                  <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                    Optional. Auto-generated if left blank.
                  </span>
                </div>

                {/* Student Mobile Number */}
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
                    Will serve as the student's primary portal login identifier.
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
                    Used for RFID entry notifications and fee reminder SMS.
                  </span>
                </div>
              </div>

              <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: '32px', height: '32px', backgroundColor: '#FDF0F0', color: '#8B1216' }}
                >
                  <GraduationCap size={18} />
                </div>
                <div>
                  <h6 className="fw-bold m-0 text-sa-charcoal">2. Academic Class & Batch Allocation</h6>
                  <span className="text-muted small" style={{ fontSize: '0.8rem' }}>
                    Assign student to their study batch and curriculum standard
                  </span>
                </div>
              </div>

              <div className="row g-3 mb-4">
                {/* Standard / Class */}
                <div className="col-12 col-md-6">
                  <label className="form-label small fw-semibold text-sa-charcoal">
                    Enrolled Class / Standard
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted">
                      <GraduationCap size={16} />
                    </span>
                    <select
                      name="standard"
                      value={formData.standard}
                      onChange={handleInputChange}
                      className={`form-select ${errors.standard ? 'is-invalid' : ''}`}
                      disabled={loading}
                    >
                      <option value="11th Science">11th Science</option>
                      <option value="12th Science">12th Science</option>
                      <option value="11th Commerce">11th Commerce</option>
                      <option value="12th Commerce">12th Commerce</option>
                      <option value="Foundation (8th-10th)">Foundation (8th-10th)</option>
                    </select>
                    {errors.standard && <div className="invalid-feedback">{errors.standard}</div>}
                  </div>
                  <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                    Curriculum stream for course syllabus.
                  </span>
                </div>

                {/* Study Batch */}
                <div className="col-12 col-md-6">
                  <label className="form-label small fw-semibold text-sa-charcoal">
                    Allocated Study Batch
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted">
                      <Users size={16} />
                    </span>
                    <select
                      name="batch"
                      value={formData.batch}
                      onChange={handleBatchChange}
                      className={`form-select ${errors.batch ? 'is-invalid' : ''}`}
                      disabled={loading}
                    >
                      <option value="">-- Select Study Batch --</option>
                      {batches.length > 0 ? (
                        batches.map((b) => (
                          <option key={b.id || b.name} value={b.name}>
                            {b.name} ({b.standard || 'General'}{b.time ? ` • ${b.time}` : ''})
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="11th PCM Tarabai Park">11th PCM Tarabai Park</option>
                          <option value="12th PCM Tarabai Park">12th PCM Tarabai Park</option>
                          <option value="11th PCB Main Branch">11th PCB Main Branch</option>
                          <option value="12th PCB Main Branch">12th PCB Main Branch</option>
                          <option value="Foundation Integrated">Foundation Integrated</option>
                        </>
                      )}
                    </select>
                    {errors.batch && <div className="invalid-feedback">{errors.batch}</div>}
                  </div>
                  <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                    Student will be enrolled directly into this batch schedule.
                  </span>
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

              <div className="row g-3">
                {/* Total Fees */}
                <div className="col-12 col-md-4">
                  <label className="form-label small fw-semibold text-sa-charcoal">
                    Total Course Fees (₹) <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted fw-bold">₹</span>
                    <input
                      type="number"
                      name="totalFees"
                      value={formData.totalFees}
                      onChange={handleInputChange}
                      min="0"
                      step="500"
                      placeholder="e.g. 45000"
                      className={`form-control ${errors.totalFees ? 'is-invalid' : ''}`}
                      disabled={loading}
                    />
                    {errors.totalFees && <div className="invalid-feedback">{errors.totalFees}</div>}
                  </div>
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
                      totalFees: 45000,
                      paidFees: 15000,
                      remainingFees: 30000,
                      password: 'password123',
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
                <span className="text-muted">Assigned Batch:</span>
                <span className="fw-bold text-sa-primary text-end text-truncate" style={{ maxWidth: '170px' }} title={formData.batch}>
                  {formData.batch || <em className="text-muted fw-normal">Not selected</em>}
                </span>
              </div>

              <div className="d-flex justify-content-between border-bottom pb-2">
                <span className="text-muted">Standard / Class:</span>
                <span className="fw-semibold text-sa-charcoal">
                  {formData.standard || '11th Science'}
                </span>
              </div>

              <div className="d-flex justify-content-between border-bottom pb-2">
                <span className="text-muted">Total Course Fee:</span>
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
                  password123
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
