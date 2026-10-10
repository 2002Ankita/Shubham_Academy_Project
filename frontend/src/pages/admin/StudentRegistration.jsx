import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  User,
  Calendar,
  MapPin,
  Clock,
  Info,
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  Upload,
  Check,
  FileText,
  Phone,
  Mail,
  Building,
  CheckCircle2,
  Users,
  CreditCard,
  Eye,
  ShieldCheck
} from 'lucide-react';
import studentService from '../../services/studentService';
import batchService from '../../services/batchService';

export default function StudentRegistration() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [batches, setBatches] = useState([]);

  useEffect(() => {
    batchService.getBatches().then(setBatches).catch(console.error);
  }, []);


  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Personal Details
    fullName: '',
    dob: '',
    gender: '',
    mobileNumber: '',
    email: '',
    password: 'password123',
    address: '',
    city: '',
    state: '',
    pinCode: '',

    // Step 1: Academic Information
    previousSchool: '',
    currentClass: '',
    preferredCourse: '',
    batch: '',

    // Step 2: Parent Details
    parentName: '',
    relation: 'Father',
    parentPhone: '',
    parentEmail: '',
    parentOccupation: '',
    emergencyContact: '',

    // Step 3: Course & Fees
    tuitionFee: 35000,
    moduleFee: 6000,
    rfidFee: 4000,
    totalFees: 45000,
    discountAmount: 0,
    paymentMode: 'Installments',
    downPayment: 15000,
    scholarshipCode: '',

    // Meta
    admissionDate: new Date().toISOString().split('T')[0],
    branch: 'Kolhapur Main Branch',
    studentId: 'Auto-generated',
    rfidCard: 'RFID-' + Math.floor(100000 + Math.random() * 900000)
  });

  useEffect(() => {
    const total = (Number(formData.tuitionFee) || 0) + (Number(formData.moduleFee) || 0) + (Number(formData.rfidFee) || 0);
    if (total !== formData.totalFees) {
      setFormData(prev => ({ ...prev, totalFees: total }));
    }
  }, [formData.tuitionFee, formData.moduleFee, formData.rfidFee]);

  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('File size exceeds 2 MB limit');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
        toast.success('Student photo uploaded successfully');
      };
      reader.readAsDataURL(file);
    }
  };

  const validateStep1 = () => {
    const errs = {};
    if (!formData.fullName.trim()) errs.fullName = 'Full Name is required';
    if (!formData.dob) errs.dob = 'Date of birth is required';
    if (!formData.gender) errs.gender = 'Gender is required';
    if (!formData.email || !/^\S+@\S+\.\S+$/.test(formData.email)) {
      errs.email = 'Valid email is required';
    }
    if (!formData.mobileNumber.trim()) {
      errs.mobileNumber = 'Mobile number is required';
    } else if (formData.mobileNumber.trim().length < 10) {
      errs.mobileNumber = 'Mobile number must be 10 digits';
    }
    if (!formData.address.trim()) errs.address = 'Residential address is required';
    if (!formData.city.trim()) errs.city = 'City is required';
    if (!formData.state) errs.state = 'State is required';
    if (!formData.pinCode.trim()) {
      errs.pinCode = 'PIN code is required';
    } else if (formData.pinCode.trim().length < 6) {
      errs.pinCode = 'PIN code must be 6 digits';
    }
    if (!formData.currentClass) errs.currentClass = 'Class is required';
    if (!formData.preferredCourse) errs.preferredCourse = 'Preferred course is required';
    if (!formData.batch) errs.batch = 'Batch is required';

    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error('Please fill in all mandatory fields marked with *');
      const firstField = Object.keys(errs)[0];
      const el = document.querySelector(`[name="${firstField}"]`);
      if (el) el.focus();
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    const errs = {};
    if (!formData.parentName.trim()) errs.parentName = 'Parent name is required';
    if (!formData.parentPhone.trim()) {
      errs.parentPhone = 'Parent mobile is required for RFID SMS';
    } else if (formData.parentPhone.trim().length < 10) {
      errs.parentPhone = 'Parent mobile must be 10 digits';
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error('Please enter parent name and mobile number');
      const firstField = Object.keys(errs)[0];
      const el = document.querySelector(`[name="${firstField}"]`);
      if (el) el.focus();
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!validateStep1()) return;
      toast.success('Personal details completed! Proceeding to Parent Details.');
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (currentStep === 2) {
      if (!validateStep2()) return;
      toast.success('Parent details completed! Proceeding to Course & Fees.');
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (currentStep === 3) {
      setCurrentStep(4);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSaveDraft = () => {
    localStorage.setItem('sa_registration_draft', JSON.stringify(formData));
    toast.info('Student admission saved as draft!');
  };

  const handleFinalSubmit = async (e) => {
    e?.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name: formData.fullName,
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.mobileNumber,
        mobile_number: formData.mobileNumber,
        date_of_birth: formData.dob || new Date().toISOString(),
        gender: formData.gender || 'Male',
        address: `${formData.address}, ${formData.city}, ${formData.state} - ${formData.pinCode}`,
        parent_name: formData.parentName || 'Parent',
        parent_mobile: formData.parentPhone || formData.mobileNumber,
        course: formData.preferredCourse || formData.currentClass,
        standard: formData.currentClass,
        batch: formData.batch,
        totalFees: formData.totalFees,
        rfidCard: formData.rfidCard,
        status: 'Active',
        password: formData.password || 'password123',
        admission_date: new Date(formData.admissionDate).toISOString()
      };

      await studentService.create(payload);
      toast.success(`Student ${formData.fullName} successfully registered! Admission ID: ${formData.studentId}`);
      localStorage.removeItem('sa_registration_draft');
      navigate('/admin/students');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to register student');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, title: 'Personal Details' },
    { number: 2, title: 'Parent Details' },
    { number: 3, title: 'Course & Fees' },
    { number: 4, title: 'Review' },
  ];

  const renderAdmissionSummary = () => (
    <div className="col-12 col-xl-4">
      <div className="bg-white p-4 rounded-3 border shadow-sm">
        {/* Card Title */}
        <div className="d-flex align-items-center gap-2 mb-4">
          <FileText size={22} style={{ color: '#8B1216', fill: '#8B1216' }} />
          <h5 className="fw-bold text-sa-charcoal m-0" style={{ fontSize: '1.15rem' }}>
            Admission Summary
          </h5>
        </div>

        {/* Summary Rows */}
        <div className="d-flex flex-column gap-3 mb-2">
          {/* Student ID */}
          <div className="d-flex align-items-center justify-content-between py-1.5 border-bottom border-light">
            <div className="d-flex align-items-center gap-2.5 text-sa-muted small">
              <User size={18} className="text-secondary opacity-75" />
              <span className="fw-semibold text-secondary">Student ID</span>
            </div>
            <span className="text-muted fw-normal small">
              {formData.studentId || 'Auto-generated'}
            </span>
          </div>

          {/* Admission Date */}
          <div className="d-flex align-items-center justify-content-between py-1.5 border-bottom border-light">
            <div className="d-flex align-items-center gap-2.5 text-sa-muted small">
              <Calendar size={18} style={{ color: '#8B1216' }} />
              <span className="fw-semibold text-secondary">Admission Date</span>
            </div>
            <span className="text-sa-charcoal fw-bold small">
              {formData.admissionDate}
            </span>
          </div>

          {/* Branch */}
          <div className="d-flex align-items-center justify-content-between py-1.5 border-bottom border-light">
            <div className="d-flex align-items-center gap-2.5 text-sa-muted small">
              <MapPin size={18} style={{ color: '#8B1216' }} />
              <span className="fw-semibold text-secondary">Branch</span>
            </div>
            <span className="text-sa-charcoal fw-bold small">
              {formData.branch}
            </span>
          </div>

          {/* Status */}
          <div className="d-flex align-items-center justify-content-between py-1.5">
            <div className="d-flex align-items-center gap-2.5 text-sa-muted small">
              <Clock size={18} style={{ color: '#8B1216' }} />
              <span className="fw-semibold text-secondary">Status</span>
            </div>
            <span
              className="badge px-3 py-1.5 fw-bold rounded-2"
              style={{ backgroundColor: '#FEF3C7', color: '#D97706', fontSize: '0.82rem' }}
            >
              Draft
            </span>
          </div>
        </div>

        {/* RFID Information Notice Box */}
        <div
          className="rounded-3 p-3.5 d-flex align-items-center gap-2.5 mt-4"
          style={{ backgroundColor: '#FEF3C7' }}
        >
          <span
            className="rounded-circle d-inline-flex align-items-center justify-content-center flex-shrink-0 text-white fw-bold"
            style={{
              backgroundColor: '#D97706',
              width: '22px',
              height: '22px',
              fontSize: '0.82rem',
              fontStyle: 'italic',
              fontFamily: 'serif'
            }}
          >
            i
          </span>
          <span className="fw-semibold text-sa-charcoal" style={{ fontSize: '0.86rem', lineHeight: 1.45 }}>
            RFID card can be assigned after registration.
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="d-flex flex-column pb-5" style={{ gap: '22px' }}>
      {/* Top Header & Breadcrumb */}
      <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3">
        <div>
          {/* Breadcrumb */}
          <nav className="d-flex align-items-center mb-1.5" style={{ fontSize: '0.88rem' }}>
            <span style={{ color: '#8B1216', fontWeight: 600 }}>Admissions</span>
            <span className="text-muted mx-2">/</span>
            <span className="text-secondary fw-semibold">New Registration</span>
          </nav>

          <h1 className="fw-bold brand-font text-sa-charcoal m-0" style={{ fontSize: '1.85rem', letterSpacing: '-0.02em' }}>
            Register New Student
          </h1>
          <p className="text-sa-muted mt-1 mb-0" style={{ fontSize: '0.94rem' }}>
            Enter the student's information to create a new admission.
          </p>
        </div>

        {/* View All Students Button matching reference badge */}
        <button
          type="button"
          onClick={() => navigate('/admin/students')}
          className="btn d-inline-flex align-items-center gap-2 px-3.5 py-2 rounded-2 fw-semibold transition-all shadow-sm"
          style={{
            border: '1.5px solid #8B1216',
            color: '#8B1216',
            fontSize: '0.88rem',
            backgroundColor: '#FFFFFF'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#8B1216';
            e.currentTarget.style.color = '#FFFFFF';
            const iconBadge = e.currentTarget.querySelector('.btn-icon-badge');
            if (iconBadge) iconBadge.style.backgroundColor = '#FFFFFF';
            const iconSvg = e.currentTarget.querySelector('.btn-icon-badge svg');
            if (iconSvg) iconSvg.style.stroke = '#8B1216';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#FFFFFF';
            e.currentTarget.style.color = '#8B1216';
            const iconBadge = e.currentTarget.querySelector('.btn-icon-badge');
            if (iconBadge) iconBadge.style.backgroundColor = '#8B1216';
            const iconSvg = e.currentTarget.querySelector('.btn-icon-badge svg');
            if (iconSvg) iconSvg.style.stroke = '#FFFFFF';
          }}
        >
          <span
            className="btn-icon-badge d-inline-flex align-items-center justify-content-center rounded-1 transition-all"
            style={{
              backgroundColor: '#8B1216',
              width: '20px',
              height: '20px',
              padding: '3px'
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="16" y2="12"/>
              <line x1="3" y1="18" x2="18" y2="18"/>
            </svg>
          </span>
          <span>View All Students</span>
        </button>
      </div>

      {/* Stepper Progress Bar */}
      <div className="bg-white rounded-3 p-3.5 border shadow-sm">
        <div className="d-flex align-items-center justify-content-between px-2 px-md-4">
          {steps.map((s, idx) => {
            const isCompleted = currentStep > s.number;
            const isActive = currentStep === s.number;

            return (
              <React.Fragment key={s.number}>
                <div
                  className="d-flex align-items-center gap-2.5 cursor-pointer user-select-none transition-all"
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    setCurrentStep(s.number);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  title={`Open Step ${s.number}: ${s.title}`}
                >
                  {/* Step Number Circle */}
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center fw-bold transition-all flex-shrink-0"
                    style={{
                      width: '32px',
                      height: '32px',
                      fontSize: '0.88rem',
                      backgroundColor: isActive ? '#8B1216' : '#CBD5E1',
                      color: '#FFFFFF',
                      boxShadow: isActive ? '0 2px 8px rgba(139, 18, 22, 0.28)' : 'none'
                    }}
                  >
                    {s.number}
                  </div>

                  {/* Step Title with Active Underline Bar */}
                  <div className="position-relative pb-1">
                    <span
                      className="d-none d-sm-inline fw-semibold transition-all"
                      style={{
                        fontSize: '0.90rem',
                        color: isActive ? '#8B1216' : '#64748B'
                      }}
                    >
                      {s.title}
                    </span>
                    {isActive && (
                      <div
                        className="position-absolute bottom-0 start-0 w-100 rounded-pill d-none d-sm-block"
                        style={{ height: '3px', backgroundColor: '#8B1216' }}
                      />
                    )}
                  </div>
                </div>

                {/* Connecting Line */}
                {idx < steps.length - 1 && (
                  <div
                    className="flex-grow-1 mx-2 mx-md-4 transition-all"
                    style={{
                      height: '2px',
                      backgroundColor: currentStep > idx + 1 ? '#8B1216' : '#E2E8F0'
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* STEP 1: Personal Details & Academic Information */}
      {currentStep === 1 && (
        <>
          <div className="row g-4">
            {/* Left Card: Personal Details */}
            <div className="col-12 col-xl-8">
              <div className="bg-white p-4 rounded-3 border shadow-sm">
                {/* Card Title */}
                <div className="d-flex align-items-center gap-2 mb-4">
                  <User size={22} style={{ color: '#8B1216', fill: '#8B1216' }} />
                  <h5 className="fw-bold text-sa-charcoal m-0" style={{ fontSize: '1.15rem' }}>
                    Personal Details
                  </h5>
                </div>

                <div className="row g-4">
                  {/* Photo Column */}
                  <div className="col-12 col-md-3 d-flex flex-column align-items-center text-center pt-2">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center overflow-hidden mb-2.5 position-relative"
                      style={{
                        width: '115px',
                        height: '115px',
                        border: '2px dashed #CBD5E1',
                        backgroundColor: '#F8FAFC'
                      }}
                    >
                      {photoPreview ? (
                        <img
                          src={photoPreview}
                          alt="Student Preview"
                          className="w-100 h-100 object-fit-cover"
                        />
                      ) : (
                        <User size={54} className="text-secondary opacity-40" />
                      )}
                    </div>

                    <span className="fw-bold text-sa-charcoal mb-2" style={{ fontSize: '0.86rem' }}>
                      Student Photo
                    </span>

                    <label
                      htmlFor="student-photo-input"
                      className="btn d-inline-flex align-items-center justify-content-center gap-1.5 py-2 px-3 rounded-2 fw-semibold w-100 transition-all cursor-pointer shadow-none"
                      style={{
                        backgroundColor: '#FEECEC',
                        color: '#B91C1C',
                        border: 'none',
                        fontSize: '0.84rem'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#FEE2E2';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#FEECEC';
                      }}
                    >
                      <Upload size={14} />
                      Upload Photo
                      <input
                        id="student-photo-input"
                        type="file"
                        accept="image/*"
                        className="d-none"
                        onChange={handlePhotoUpload}
                      />
                    </label>

                    <span className="text-muted mt-2" style={{ fontSize: '0.74rem' }}>
                      JPG or PNG, max 2 MB
                    </span>
                  </div>

                  {/* Form Fields Column */}
                  <div className="col-12 col-md-9">
                    <div className="row g-3">
                      {/* Full Name */}
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-semibold text-sa-charcoal mb-1">
                          Full Name <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          placeholder="Enter full name"
                          className={`form-control ${errors.fullName ? 'is-invalid' : ''}`}
                          style={{ fontSize: '0.90rem', padding: '0.65rem 0.90rem' }}
                        />
                      </div>

                      {/* Date of Birth */}
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-semibold text-sa-charcoal mb-1">
                          Date of Birth <span className="text-danger">*</span>
                        </label>
                        <input
                          type="date"
                          name="dob"
                          value={formData.dob}
                          onChange={handleInputChange}
                          className={`form-control ${errors.dob ? 'is-invalid' : ''}`}
                          style={{ fontSize: '0.90rem', padding: '0.65rem 0.90rem' }}
                        />
                      </div>

                      {/* Admission Date */}
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-semibold text-sa-charcoal mb-1">
                          Admission Date <span className="text-danger">*</span>
                        </label>
                        <input
                          type="date"
                          name="admissionDate"
                          value={formData.admissionDate}
                          onChange={handleInputChange}
                          className={`form-control ${errors.admissionDate ? 'is-invalid' : ''}`}
                          style={{ fontSize: '0.90rem', padding: '0.65rem 0.90rem' }}
                        />
                      </div>

                      {/* Gender */}
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-semibold text-sa-charcoal mb-1">
                          Gender <span className="text-danger">*</span>
                        </label>
                        <select
                          name="gender"
                          value={formData.gender}
                          onChange={handleInputChange}
                          className={`form-select ${errors.gender ? 'is-invalid' : ''}`}
                          style={{ fontSize: '0.90rem', padding: '0.65rem 0.90rem' }}
                        >
                          <option value="">Select gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      {/* Mobile Number */}
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-semibold text-sa-charcoal mb-1">
                          Mobile Number <span className="text-danger">*</span>
                        </label>
                        <input
                          type="tel"
                          name="mobileNumber"
                          value={formData.mobileNumber}
                          onChange={handleInputChange}
                          placeholder="Enter 10 digit mobile number"
                          maxLength={10}
                          className={`form-control ${errors.mobileNumber ? 'is-invalid' : ''}`}
                          style={{ fontSize: '0.90rem', padding: '0.65rem 0.90rem' }}
                        />
                      </div>

                      {/* Email Address */}
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-semibold text-sa-charcoal mb-1">
                          Email Address <span className="text-danger">*</span>
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="Enter valid email address"
                          className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                          style={{ fontSize: '0.90rem', padding: '0.65rem 0.90rem' }}
                        />
                      </div>

                      {/* Password */}
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-semibold text-sa-charcoal mb-1">
                          Dashboard Password <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          placeholder="e.g. password123"
                          className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                          style={{ fontSize: '0.90rem', padding: '0.65rem 0.90rem' }}
                        />
                      </div>

                      {/* Residential Address */}
                      <div className="col-12">
                        <label className="form-label small fw-semibold text-sa-charcoal mb-1">
                          Residential Address <span className="text-danger">*</span>
                        </label>
                        <textarea
                          rows={2}
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          placeholder="Enter residential address"
                          className={`form-control ${errors.address ? 'is-invalid' : ''}`}
                          style={{ fontSize: '0.90rem', padding: '0.65rem 0.90rem', resize: 'vertical' }}
                        />
                      </div>

                      {/* City */}
                      <div className="col-12 col-md-4">
                        <label className="form-label small fw-semibold text-sa-charcoal mb-1">
                          City <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          placeholder="Enter city"
                          className={`form-control ${errors.city ? 'is-invalid' : ''}`}
                          style={{ fontSize: '0.90rem', padding: '0.65rem 0.90rem' }}
                        />
                      </div>

                      {/* State */}
                      <div className="col-12 col-md-4">
                        <label className="form-label small fw-semibold text-sa-charcoal mb-1">
                          State <span className="text-danger">*</span>
                        </label>
                        <select
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                          className={`form-select ${errors.state ? 'is-invalid' : ''}`}
                          style={{ fontSize: '0.90rem', padding: '0.65rem 0.90rem' }}
                        >
                          <option value="">Select state</option>
                          <option value="Maharashtra">Maharashtra</option>
                          <option value="Karnataka">Karnataka</option>
                          <option value="Goa">Goa</option>
                          <option value="Gujarat">Gujarat</option>
                          <option value="Madhya Pradesh">Madhya Pradesh</option>
                        </select>
                        {errors.state && (
                          <div className="invalid-feedback d-block">{errors.state}</div>
                        )}
                      </div>

                      {/* PIN Code */}
                      <div className="col-12 col-md-4">
                        <label className="form-label small fw-semibold text-sa-charcoal mb-1">
                          PIN Code <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          name="pinCode"
                          value={formData.pinCode}
                          onChange={handleInputChange}
                          placeholder="Enter PIN code"
                          maxLength={6}
                          className={`form-control ${errors.pinCode ? 'is-invalid' : ''}`}
                          style={{ fontSize: '0.90rem', padding: '0.65rem 0.90rem' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Card: Admission Summary */}
            {renderAdmissionSummary()}
          </div>

          {/* Row 2 Card: Academic Information (Full Width) */}
          <div className="bg-white p-4 rounded-3 border shadow-sm">
            {/* Card Title */}
            <div className="d-flex align-items-center gap-2 mb-3.5">
              <GraduationCap size={24} style={{ color: '#8B1216' }} />
              <h5 className="fw-bold text-sa-charcoal m-0" style={{ fontSize: '1.15rem' }}>
                Academic Information
              </h5>
            </div>

            <div className="row g-3">
              {/* Previous School */}
              <div className="col-12 col-md-6 col-xl-3">
                <label className="form-label small fw-semibold text-sa-charcoal mb-1">
                  Previous School/College
                </label>
                <input
                  type="text"
                  name="previousSchool"
                  value={formData.previousSchool}
                  onChange={handleInputChange}
                  placeholder="Enter school or college name"
                  className="form-control"
                  style={{ fontSize: '0.90rem', padding: '0.65rem 0.90rem' }}
                />
              </div>

              {/* Current Class */}
              <div className="col-12 col-md-6 col-xl-3">
                <label className="form-label small fw-semibold text-sa-charcoal mb-1">
                  Current Class <span className="text-danger">*</span>
                </label>
                <select
                  name="currentClass"
                  value={formData.currentClass}
                  onChange={handleInputChange}
                  className={`form-select ${errors.currentClass ? 'is-invalid' : ''}`}
                  style={{ fontSize: '0.90rem', padding: '0.65rem 0.90rem' }}
                >
                  <option value="">Select class</option>
                  <option value="8th Standard">8th Standard</option>
                  <option value="9th Standard">9th Standard</option>
                  <option value="10th Standard">10th Standard</option>
                  <option value="11th Science">11th Science</option>
                  <option value="12th Science">12th Science</option>
                  <option value="11th Commerce">11th Commerce</option>
                  <option value="12th Commerce">12th Commerce</option>
                </select>
              </div>

              {/* Preferred Course */}
              <div className="col-12 col-md-6 col-xl-3">
                <label className="form-label small fw-semibold text-sa-charcoal mb-1">
                  Preferred Course <span className="text-danger">*</span>
                </label>
                <select
                  name="preferredCourse"
                  value={formData.preferredCourse}
                  onChange={handleInputChange}
                  className={`form-select ${errors.preferredCourse ? 'is-invalid' : ''}`}
                  style={{ fontSize: '0.90rem', padding: '0.65rem 0.90rem' }}
                >
                  <option value="">Select course</option>
                  <option value="JEE (Main + Advanced) Integrated">JEE (Main + Advanced) Integrated</option>
                  <option value="NEET Medical Pinnacle">NEET Medical Pinnacle</option>
                  <option value="MHT-CET Engineering & Pharmacy">MHT-CET Engineering & Pharmacy</option>
                  <option value="Foundation & Olympiad (8th-10th)">Foundation & Olympiad (8th-10th)</option>
                  <option value="HSC State Board Excellence">HSC State Board Excellence</option>
                </select>
              </div>

              {/* Batch */}
              <div className="col-12 col-md-6 col-xl-3">
                <label className="form-label small fw-semibold text-sa-charcoal mb-1">
                  Batch <span className="text-danger">*</span>
                </label>
                <select
                  name="batch"
                  value={formData.batch}
                  onChange={handleInputChange}
                  className={`form-select ${errors.batch ? 'is-invalid' : ''}`}
                  style={{ fontSize: '0.90rem', padding: '0.65rem 0.90rem' }}
                >
                  <option value="">Select batch</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </>
      )}

      {/* STEP 2: Parent Details */}
      {currentStep === 2 && (
        <>
          <div className="row g-4">
            {/* Left Card: Parent & Guardian Details */}
            <div className="col-12 col-xl-8">
              <div className="bg-white p-4 rounded-3 border shadow-sm">
                <div className="d-flex align-items-center gap-2 mb-4">
                  <Users size={22} style={{ color: '#8B1216' }} />
                  <h5 className="fw-bold text-sa-charcoal m-0" style={{ fontSize: '1.15rem' }}>
                    Parent & Guardian Details
                  </h5>
                </div>

                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-semibold text-sa-charcoal mb-1">
                      Parent / Guardian Full Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      name="parentName"
                      value={formData.parentName}
                      onChange={handleInputChange}
                      placeholder="e.g. Ramesh Sharma"
                      className="form-control"
                      style={{ fontSize: '0.90rem', padding: '0.65rem 0.90rem' }}
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-semibold text-sa-charcoal mb-1">
                      Relationship <span className="text-danger">*</span>
                    </label>
                    <select
                      name="relation"
                      value={formData.relation}
                      onChange={handleInputChange}
                      className="form-select"
                      style={{ fontSize: '0.90rem', padding: '0.65rem 0.90rem' }}
                    >
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Guardian">Guardian</option>
                    </select>
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-semibold text-sa-charcoal mb-1">
                      Parent Mobile Number (For RFID SMS) <span className="text-danger">*</span>
                    </label>
                    <input
                      type="tel"
                      name="parentPhone"
                      value={formData.parentPhone}
                      onChange={handleInputChange}
                      placeholder="Enter 10 digit parent mobile number"
                      maxLength={10}
                      className="form-control"
                      style={{ fontSize: '0.90rem', padding: '0.65rem 0.90rem' }}
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-semibold text-sa-charcoal mb-1">
                      Parent Email Address
                    </label>
                    <input
                      type="email"
                      name="parentEmail"
                      value={formData.parentEmail}
                      onChange={handleInputChange}
                      placeholder="parent@example.com (optional)"
                      className="form-control"
                      style={{ fontSize: '0.90rem', padding: '0.65rem 0.90rem' }}
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-semibold text-sa-charcoal mb-1">
                      Parent Occupation / Business
                    </label>
                    <input
                      type="text"
                      name="parentOccupation"
                      value={formData.parentOccupation}
                      onChange={handleInputChange}
                      placeholder="e.g. Civil Engineer / Business Owner"
                      className="form-control"
                      style={{ fontSize: '0.90rem', padding: '0.65rem 0.90rem' }}
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-semibold text-sa-charcoal mb-1">
                      Alternate Emergency Contact Number
                    </label>
                    <input
                      type="tel"
                      name="emergencyContact"
                      value={formData.emergencyContact}
                      onChange={handleInputChange}
                      placeholder="Secondary phone number"
                      maxLength={10}
                      className="form-control"
                      style={{ fontSize: '0.90rem', padding: '0.65rem 0.90rem' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Card: Admission Summary */}
            {renderAdmissionSummary()}
          </div>

          {/* Row 2: Communication Preferences & RFID Notifications */}
          <div className="bg-white p-4 rounded-3 border shadow-sm">
            <div className="d-flex align-items-center gap-2 mb-3">
              <Phone size={22} style={{ color: '#8B1216' }} />
              <h5 className="fw-bold text-sa-charcoal m-0" style={{ fontSize: '1.15rem' }}>
                Communication & Emergency Notification Setup
              </h5>
            </div>
            <div className="row g-3">
              <div className="col-12 col-md-4">
                <div className="p-3 rounded-2 border bg-light">
                  <div className="fw-bold text-sa-charcoal mb-1" style={{ fontSize: '0.88rem' }}>RFID Attendance SMS</div>
                  <div className="text-muted small">Auto-dispatches SMS to parent mobile upon student gate check-in & check-out.</div>
                  <span className="badge bg-success-subtle text-success mt-2">Active by default</span>
                </div>
              </div>
              <div className="col-12 col-md-4">
                <div className="p-3 rounded-2 border bg-light">
                  <div className="fw-bold text-sa-charcoal mb-1" style={{ fontSize: '0.88rem' }}>Academic Report Cards</div>
                  <div className="text-muted small">Weekly test performance and attendance analytics sent to parent email & WhatsApp.</div>
                  <span className="badge bg-primary-subtle text-primary mt-2">Enabled</span>
                </div>
              </div>
              <div className="col-12 col-md-4">
                <div className="p-3 rounded-2 border bg-light">
                  <div className="fw-bold text-sa-charcoal mb-1" style={{ fontSize: '0.88rem' }}>Emergency Dispatch</div>
                  <div className="text-muted small">Emergency broadcasts connect directly to parent mobile and secondary emergency phone.</div>
                  <span className="badge bg-warning-subtle text-warning mt-2">24x7 Priority</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* STEP 3: Course & Fees */}
      {currentStep === 3 && (
        <>
          <div className="row g-4">
            {/* Left Card: Fee Structure & Payment Schedule */}
            <div className="col-12 col-xl-8">
              <div className="bg-white p-4 rounded-3 border shadow-sm">
                <div className="d-flex align-items-center gap-2 mb-4">
                  <CreditCard size={22} style={{ color: '#8B1216' }} />
                  <h5 className="fw-bold text-sa-charcoal m-0" style={{ fontSize: '1.15rem' }}>
                    Fee Structure & Payment Schedule
                  </h5>
                </div>

                <div className="row g-4">
                  {/* Fee Breakdown Card */}
                  <div className="col-12 col-md-6">
                    <div className="p-3.5 rounded-3 border bg-light">
                      <h6 className="fw-bold text-sa-charcoal mb-3" style={{ fontSize: '0.94rem' }}>Academic Year Fee Breakdown</h6>
                      
                      <div className="d-flex justify-content-between align-items-center py-2 border-bottom text-sa-charcoal small">
                        <span>Tuition & Laboratory Fee</span>
                        <div className="d-flex align-items-center bg-white border rounded px-2 py-1" style={{ width: '100px' }}>
                          <span className="text-muted small me-1">₹</span>
                          <input 
                            type="number" 
                            name="tuitionFee"
                            value={formData.tuitionFee}
                            onChange={handleInputChange}
                            className="form-control form-control-sm border-0 p-0 text-end fw-semibold"
                            style={{ boxShadow: 'none' }}
                          />
                        </div>
                      </div>
                      
                      <div className="d-flex justify-content-between align-items-center py-2 border-bottom text-sa-charcoal small">
                        <span>Study Modules & Books</span>
                        <div className="d-flex align-items-center bg-white border rounded px-2 py-1" style={{ width: '100px' }}>
                          <span className="text-muted small me-1">₹</span>
                          <input 
                            type="number" 
                            name="moduleFee"
                            value={formData.moduleFee}
                            onChange={handleInputChange}
                            className="form-control form-control-sm border-0 p-0 text-end fw-semibold"
                            style={{ boxShadow: 'none' }}
                          />
                        </div>
                      </div>
                      
                      <div className="d-flex justify-content-between align-items-center py-2 border-bottom text-sa-charcoal small">
                        <span>RFID & Test Series</span>
                        <div className="d-flex align-items-center bg-white border rounded px-2 py-1" style={{ width: '100px' }}>
                          <span className="text-muted small me-1">₹</span>
                          <input 
                            type="number" 
                            name="rfidFee"
                            value={formData.rfidFee}
                            onChange={handleInputChange}
                            className="form-control form-control-sm border-0 p-0 text-end fw-semibold"
                            style={{ boxShadow: 'none' }}
                          />
                        </div>
                      </div>
                      
                      <div className="d-flex justify-content-between pt-3 fw-bold text-sa-charcoal align-items-center">
                        <span>Total Course Fee</span>
                        <span style={{ color: '#8B1216', fontSize: '1.15rem' }}>₹{(Number(formData.totalFees) || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Options */}
                  <div className="col-12 col-md-6">
                    <div className="row g-3">
                      <div className="col-12">
                        <label className="form-label small fw-semibold text-sa-charcoal mb-1">
                          Payment Plan
                        </label>
                        <select
                          name="paymentMode"
                          value={formData.paymentMode}
                          onChange={handleInputChange}
                          className="form-select"
                          style={{ fontSize: '0.90rem', padding: '0.65rem 0.90rem' }}
                        >
                          <option value="Installments">3 Easy Term Installments (Recommended)</option>
                          <option value="Full Payment">One-Time Full Payment (5% Early Discount)</option>
                          <option value="Monthly">Monthly Recurring EMI</option>
                        </select>
                      </div>

                      <div className="col-12">
                        <label className="form-label small fw-semibold text-sa-charcoal mb-1">
                          Down Payment / Registration Deposit (₹)
                        </label>
                        <input
                          type="number"
                          name="downPayment"
                          value={formData.downPayment}
                          onChange={handleInputChange}
                          className="form-control"
                          style={{ fontSize: '0.90rem', padding: '0.65rem 0.90rem' }}
                        />
                        <span className="text-muted mt-1 d-block" style={{ fontSize: '0.74rem' }}>
                          Remaining balance: ₹{(formData.totalFees - Number(formData.downPayment || 0)).toLocaleString()}
                        </span>
                      </div>

                      <div className="col-12">
                        <label className="form-label small fw-semibold text-sa-charcoal mb-1">
                          Scholarship / Promo Code
                        </label>
                        <input
                          type="text"
                          name="scholarshipCode"
                          value={formData.scholarshipCode}
                          onChange={handleInputChange}
                          placeholder="e.g. MERIT10, ACADEMY2025"
                          className="form-control text-uppercase"
                          style={{ fontSize: '0.90rem', padding: '0.65rem 0.90rem' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Card: Admission Summary */}
            {renderAdmissionSummary()}
          </div>

          {/* Row 2: Payment Policy & Refund Guidelines */}
          <div className="bg-white p-4 rounded-3 border shadow-sm">
            <div className="d-flex align-items-center gap-2 mb-3">
              <ShieldCheck size={22} style={{ color: '#8B1216' }} />
              <h5 className="fw-bold text-sa-charcoal m-0" style={{ fontSize: '1.15rem' }}>
                Fee Schedule & Payment Guidelines
              </h5>
            </div>
            <div className="row g-3">
              <div className="col-12 col-md-4">
                <div className="p-3 rounded-2 border bg-light">
                  <div className="fw-bold text-sa-charcoal mb-1" style={{ fontSize: '0.88rem' }}>Installment 1 (At Admission)</div>
                  <div className="text-muted small">₹15,000 paid at time of enrollment to confirm batch seat and issue study kit.</div>
                </div>
              </div>
              <div className="col-12 col-md-4">
                <div className="p-3 rounded-2 border bg-light">
                  <div className="fw-bold text-sa-charcoal mb-1" style={{ fontSize: '0.88rem' }}>Installment 2 (Mid Term)</div>
                  <div className="text-muted small">₹15,000 due after 90 days of session commencement with zero interest.</div>
                </div>
              </div>
              <div className="col-12 col-md-4">
                <div className="p-3 rounded-2 border bg-light">
                  <div className="fw-bold text-sa-charcoal mb-1" style={{ fontSize: '0.88rem' }}>Installment 3 (Final Term)</div>
                  <div className="text-muted small">₹15,000 due prior to preliminary test series and board crash course.</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* STEP 4: Review & Confirm */}
      {currentStep === 4 && (
        <>
          <div className="row g-4">
            {/* Left Card: Review Admission Application */}
            <div className="col-12 col-xl-8">
              <div className="bg-white p-4 rounded-3 border shadow-sm">
                <div className="d-flex align-items-center gap-2 mb-4">
                  <ShieldCheck size={22} style={{ color: '#168554' }} />
                  <h5 className="fw-bold text-sa-charcoal m-0" style={{ fontSize: '1.15rem' }}>
                    Review Admission Application
                  </h5>
                </div>

                <div className="row g-4">
                  {/* Student Details Card */}
                  <div className="col-12 col-md-6">
                    <div className="p-3.5 rounded-3 border h-100 bg-light">
                      <div className="d-flex align-items-center gap-3 mb-3">
                        <div
                          className="rounded-circle overflow-hidden d-flex align-items-center justify-content-center flex-shrink-0"
                          style={{ width: '60px', height: '60px', backgroundColor: '#FFFFFF', border: '2px solid #E2E8F0' }}
                        >
                          {photoPreview ? (
                            <img src={photoPreview} alt="" className="w-100 h-100 object-fit-cover" />
                          ) : (
                            <User size={30} className="text-secondary opacity-50" />
                          )}
                        </div>
                        <div>
                          <h6 className="fw-bold text-sa-charcoal m-0">{formData.fullName || 'Student Name'}</h6>
                          <span className="text-sa-muted small d-block">{formData.currentClass || 'Class'} • {formData.gender || 'Gender'}</span>
                          <span className="badge bg-danger-subtle text-danger small mt-1">ID: {formData.studentId}</span>
                        </div>
                      </div>

                      <div className="d-flex flex-column gap-2 small text-sa-charcoal">
                        <div><strong>Mobile:</strong> {formData.mobileNumber || 'Not provided'}</div>
                        <div><strong>Email:</strong> {formData.email || 'N/A'}</div>
                        <div><strong>DOB:</strong> {formData.dob || 'Not provided'}</div>
                        <div><strong>Address:</strong> {formData.address || 'Address'}, {formData.city || 'City'}, {formData.state || 'State'} - {formData.pinCode || 'PIN'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Academic & Parent Summary */}
                  <div className="col-12 col-md-6">
                    <div className="p-3.5 rounded-3 border h-100 bg-light d-flex flex-column gap-3 small">
                      <div>
                        <h6 className="fw-bold text-sa-charcoal border-bottom pb-1.5 mb-2">Academic & Batch</h6>
                        <div><strong>Preferred Course:</strong> {formData.preferredCourse || 'Not selected'}</div>
                        <div><strong>Assigned Batch:</strong> {formData.batch || 'Not assigned'}</div>
                        <div><strong>Previous School:</strong> {formData.previousSchool || 'N/A'}</div>
                      </div>

                      <div>
                        <h6 className="fw-bold text-sa-charcoal border-bottom pb-1.5 mb-2">Parent / Guardian</h6>
                        <div><strong>Name:</strong> {formData.parentName || 'Parent'} ({formData.relation})</div>
                        <div><strong>Parent Phone:</strong> {formData.parentPhone || 'Not provided'}</div>
                        <div><strong>Occupation:</strong> {formData.parentOccupation || 'N/A'}</div>
                      </div>

                      <div className="pt-2 border-top mt-auto">
                        <div className="d-flex justify-content-between fw-bold text-sa-charcoal">
                          <span>Deposit: ₹{Number(formData.downPayment || 0).toLocaleString()}</span>
                          <span className="text-success">Balance: ₹{(formData.totalFees - Number(formData.downPayment || 0)).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Card: Admission Summary */}
            {renderAdmissionSummary()}
          </div>

          {/* Row 2: Final Verification Checklist */}
          <div className="bg-white p-4 rounded-3 border shadow-sm">
            <div className="d-flex align-items-center gap-2 mb-3">
              <CheckCircle2 size={22} style={{ color: '#168554' }} />
              <h5 className="fw-bold text-sa-charcoal m-0" style={{ fontSize: '1.15rem' }}>
                Enrollment Verification & RFID Checklist
              </h5>
            </div>
            <div className="row g-3">
              <div className="col-12 col-md-4">
                <div className="p-3 rounded-2 border bg-light d-flex align-items-start gap-2">
                  <Check size={18} className="text-success mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="d-block small text-sa-charcoal">Academic Seat Allocated</strong>
                    <span className="text-muted small">Batch timing and classroom assigned for 2025-26 academic term.</span>
                  </div>
                </div>
              </div>
              <div className="col-12 col-md-4">
                <div className="p-3 rounded-2 border bg-light d-flex align-items-start gap-2">
                  <Check size={18} className="text-success mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="d-block small text-sa-charcoal">RFID Card Ready for Provisioning</strong>
                    <span className="text-muted small">Smart RFID card code queued for printing upon registration confirmation.</span>
                  </div>
                </div>
              </div>
              <div className="col-12 col-md-4">
                <div className="p-3 rounded-2 border bg-light d-flex align-items-start gap-2">
                  <Check size={18} className="text-success mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="d-block small text-sa-charcoal">Automated SMS Dispatch Queued</strong>
                    <span className="text-muted small">Welcome SMS with credentials and receipt will be sent automatically.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Bottom Action Buttons */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mt-2">
        {/* Left Side: Back button if on later steps */}
        <div>
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="btn btn-outline-secondary d-inline-flex align-items-center gap-1.5 px-3 py-2 rounded-2 fw-semibold"
              style={{ fontSize: '0.90rem' }}
            >
              <ArrowLeft size={16} /> Back
            </button>
          ) : (
            <span />
          )}
        </div>

        {/* Right Side: Cancel, Save as Draft, Next */}
        <div className="d-flex align-items-center" style={{ gap: '16px' }}>
          {/* Cancel */}
          <button
            type="button"
            onClick={() => navigate('/admin/students')}
            className="btn btn-outline-danger px-4 py-2 rounded-2 fw-semibold transition-all shadow-sm"
            style={{
              borderColor: '#8B1216',
              color: '#8B1216',
              backgroundColor: '#FFFFFF',
              fontSize: '0.90rem'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#FDF0F0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#FFFFFF';
            }}
          >
            Cancel
          </button>

          {/* Save as Draft */}
          <button
            type="button"
            onClick={handleSaveDraft}
            className="btn px-4 py-2 rounded-2 fw-semibold transition-all shadow-sm"
            style={{
              borderColor: '#F5A900',
              borderWidth: '1.5px',
              borderStyle: 'solid',
              color: '#D97706',
              backgroundColor: '#FFFFFF',
              fontSize: '0.90rem'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#FEF8EB';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#FFFFFF';
            }}
          >
            Save as Draft
          </button>

          {/* Next / Confirm */}
          {currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="btn d-inline-flex align-items-center gap-2 px-4 py-2 rounded-2 fw-semibold text-white transition-all shadow-sm"
              style={{
                backgroundColor: '#8B1216',
                border: 'none',
                fontSize: '0.90rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#6E0B0F';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#8B1216';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span>Next</span>
              <ArrowRight size={17} />
            </button>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={handleFinalSubmit}
              className="btn d-inline-flex align-items-center gap-2 px-4 py-2 rounded-2 fw-semibold text-white transition-all shadow-sm"
              style={{
                backgroundColor: '#168554',
                border: 'none',
                fontSize: '0.90rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#116640';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#168554';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <CheckCircle2 size={17} />
              <span>{loading ? 'Submitting...' : 'Confirm & Complete Admission'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
