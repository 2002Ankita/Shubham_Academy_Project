import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  BookOpen,
  GraduationCap,
  Clock,
  Calendar,
  Briefcase,
  IndianRupee,
  Camera,
  Save,
  Plus,
  Info,
  ChevronDown,
  Check,
  IdCard
} from 'lucide-react';
import { toast } from 'react-toastify';
import '../../styles/teacherOnboarding.css';

export default function TeacherForm({ initialData, onSubmit, loading, onCancel }) {
  const fileInputRef = useRef(null);
  const [showPassword, setShowPassword] = useState(false);
  const [additionalSubjectsOpen, setAdditionalSubjectsOpen] = useState(false);
  const additionalSubjectsRef = useRef(null);

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    password: initialData?.password || 'Shubham@2026',
    subject: initialData?.subject || 'Physics',
    additionalSubjects: initialData?.additionalSubjects || [],
    qualification: initialData?.qualification || 'M.Sc. B.Ed',
    experience: initialData?.experience?.replace(/[^0-9]/g, '') || '5',
    experienceUnit: 'Years',
    employeeId: initialData?.employeeId || 'EMP001',
    joiningDate: initialData?.joiningDate || new Date().toISOString().split('T')[0],
    employmentType: initialData?.employmentType || 'Full Time',
    monthlySalary: initialData?.monthlySalary || 65000,
    status: initialData?.status || 'Active',
    photoPreview: initialData?.avatar || null,
  });

  const [errors, setErrors] = useState({});

  // Close additional subjects dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (additionalSubjectsRef.current && !additionalSubjectsRef.current.contains(event.target)) {
        setAdditionalSubjectsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handlePhotoClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Photo size must be less than 2 MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({
        ...prev,
        photo: file,
        photoPreview: reader.result,
      }));
      toast.success('Faculty photo selected');
    };
    reader.readAsDataURL(file);
  };

  const toggleAdditionalSubject = (subject) => {
    setFormData((prev) => {
      const exists = prev.additionalSubjects.includes(subject);
      const updated = exists
        ? prev.additionalSubjects.filter((s) => s !== subject)
        : [...prev.additionalSubjects, subject];
      return { ...prev, additionalSubjects: updated };
    });
  };

  // Password strength calculation
  const getPasswordStrength = (pass = '') => {
    if (!pass) return { score: 0, label: 'Enter password', color: '#94A3B8' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass) || /[A-Z]/.test(pass)) score += 1;

    if (score <= 1) return { score: 1, label: 'Weak password', color: '#EF4444' };
    if (score === 2) return { score: 2, label: 'Fair password', color: '#F59E0B' };
    if (score === 3) return { score: 3, label: 'Good password', color: '#10B981' };
    return { score: 4, label: 'Strong password', color: '#168554' };
  };

  const pwdStrength = getPasswordStrength(formData.password);

  const handleSaveDraft = () => {
    try {
      localStorage.setItem('shubham_faculty_onboarding_draft', JSON.stringify(formData));
      toast.info('Form progress saved as draft!');
    } catch {
      toast.error('Unable to save draft locally');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Faculty full name is required';
    if (!formData.email.trim()) newErrors.email = 'Official email is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!initialData && !formData.password.trim()) newErrors.password = 'Temporary password is required';
    if (!formData.qualification.trim()) newErrors.qualification = 'Educational qualification is required';
    if (!formData.monthlySalary) newErrors.monthlySalary = 'Monthly base salary is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please complete all required fields marked with *');
      return;
    }

    setErrors({});
    onSubmit({
      ...formData,
      experience: `${formData.experience} ${formData.experienceUnit}`.trim(),
    });
  };

  const subjectOptions = [
    'Physics',
    'Chemistry',
    'Mathematics',
    'Biology',
    'Computer Science',
    'Accountancy',
    'Economics',
    'English',
  ];

  const qualificationOptions = [
    'M.Sc. B.Ed',
    'M.Sc, CSIR-NET',
    'Ph.D in Physics',
    'B.Ed, M.Sc',
    'B.Tech / M.Tech',
    'M.A, B.Ed',
    'M.Com, B.Ed',
  ];

  const statusColorMap = {
    Active: '#168554',
    'On Leave': '#F59E0B',
    Probation: '#D97706',
    Inactive: '#94A3B8',
  };

  return (
    <form onSubmit={handleSubmit} className="w-100">
      <div className="row g-4 g-lg-5">
        {/* Left Column: Avatar & Employment Status */}
        <div className="col-12 col-lg-3 col-md-4 pe-lg-3">
          <div className="faculty-photo-sidebar">
            <div className="d-flex flex-column align-items-center text-center">
              {/* Avatar Circle */}
              <div
                className="avatar-upload-wrapper"
                onClick={handlePhotoClick}
                title="Click to upload faculty photo"
              >
                {formData.photoPreview ? (
                  <img
                    src={formData.photoPreview}
                    alt="Faculty Preview"
                    className="avatar-preview-img"
                  />
                ) : (
                  <User size={68} className="text-secondary opacity-40" strokeWidth={1.4} />
                )}
                <div className="avatar-camera-btn" onClick={(e) => { e.stopPropagation(); handlePhotoClick(); }}>
                  <Camera size={18} />
                </div>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/png, image/jpeg, image/jpg"
                onChange={handlePhotoChange}
                className="d-none"
              />

              <div className="fw-bold text-sa-charcoal mt-3" style={{ fontSize: '15px' }}>
                Upload Faculty Photo
              </div>
              <div className="text-muted small mt-1" style={{ fontSize: '12px' }}>
                JPG or PNG, maximum 2 MB
              </div>
            </div>

            <div className="mt-4 pt-3 border-top">
              <label className="form-label fw-bold text-sa-charcoal small mb-2 d-block">
                Employment Status
              </label>
              <div className="position-relative">
                <div
                  className="position-absolute top-50 start-0 translate-middle-y ms-3"
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: statusColorMap[formData.status] || '#168554',
                    zIndex: 3,
                  }}
                />
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="sa-custom-input sa-custom-select ps-4 fw-medium"
                  style={{ fontSize: '13.5px' }}
                >
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Probation">Probation</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <p className="text-muted mt-2 mb-0" style={{ fontSize: '12px', lineHeight: '1.4' }}>
                Active faculty members can access the system.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: 3 Numbered Sections */}
        <div className="col-12 col-lg-9 col-md-8 ps-lg-4">
          {/* Section 1: Personal Information */}
          <div id="personal-section" className="mb-4 pb-2">
            <div className="d-flex align-items-center gap-2 mb-3">
              <div className="section-badge">1</div>
              <div>
                <h6 className="fw-bold text-sa-charcoal mb-0" style={{ fontSize: '15px' }}>
                  Personal Information
                </h6>
                <div className="text-muted" style={{ fontSize: '12.5px' }}>
                  Basic details and contact information.
                </div>
              </div>
            </div>

            <div className="row g-3">
              {/* Faculty Full Name */}
              <div className="col-12 col-md-6">
                <label className="form-label small fw-semibold text-sa-charcoal mb-1">
                  Faculty Full Name <span className="text-danger">*</span>
                </label>
                <div className="sa-custom-input-group">
                  <div className="sa-input-icon">
                    <User size={16} />
                  </div>
                  <input
                    type="text"
                    name="name"
                    placeholder="e.g. Dr. Priya Kulkarni"
                    value={formData.name}
                    onChange={handleChange}
                    className={`sa-custom-input ${errors.name ? 'border-danger' : ''}`}
                  />
                </div>
                {errors.name && <div className="text-danger small mt-1">{errors.name}</div>}
              </div>

              {/* Official Email */}
              <div className="col-12 col-md-6">
                <label className="form-label small fw-semibold text-sa-charcoal mb-1">
                  Official Email <span className="text-danger">*</span>
                </label>
                <div className="sa-custom-input-group">
                  <div className="sa-input-icon">
                    <Mail size={16} />
                  </div>
                  <input
                    type="email"
                    name="email"
                    placeholder="superadmin@shubham.edu"
                    value={formData.email}
                    onChange={handleChange}
                    className={`sa-custom-input ${errors.email ? 'border-danger' : ''}`}
                  />
                </div>
                {errors.email && <div className="text-danger small mt-1">{errors.email}</div>}
              </div>

              {/* Phone Number */}
              <div className="col-12 col-md-6">
                <label className="form-label small fw-semibold text-sa-charcoal mb-1">
                  Phone Number <span className="text-danger">*</span>
                </label>
                <div className="sa-custom-input-group">
                  <div className="sa-input-icon">
                    <Phone size={16} />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="+91 98220 XXXXX"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`sa-custom-input ${errors.phone ? 'border-danger' : ''}`}
                  />
                </div>
                {errors.phone && <div className="text-danger small mt-1">{errors.phone}</div>}
              </div>

              {/* Temporary Password */}
              <div className="col-12 col-md-6">
                <label className="form-label small fw-semibold text-sa-charcoal mb-1">
                  Temporary Password <span className="text-danger">*</span>
                </label>
                <div className="sa-custom-input-group">
                  <div className="sa-input-icon">
                    <Lock size={16} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="••••••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className={`sa-custom-input ${errors.password ? 'border-danger' : ''}`}
                    style={{ paddingRight: '2.5rem' }}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <div className="text-danger small mt-1">{errors.password}</div>}

                {/* Password Strength Indicator */}
                <div className="d-flex align-items-center justify-content-between gap-2 mt-2">
                  <div className="d-flex gap-1 flex-grow-1" style={{ maxWidth: '65%' }}>
                    {[1, 2, 3, 4].map((seg) => (
                      <div
                        key={seg}
                        className="strength-meter-bar"
                        style={{
                          backgroundColor:
                            formData.password && seg <= pwdStrength.score
                              ? pwdStrength.color
                              : '#E2E8F0',
                        }}
                      />
                    ))}
                  </div>
                  <span
                    className="small fw-semibold"
                    style={{ fontSize: '11.5px', color: pwdStrength.color }}
                  >
                    {pwdStrength.label}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Academic Information */}
          <div id="academic-section" className="mb-4 pb-2 pt-2 border-top">
            <div className="d-flex align-items-center gap-2 mb-3 mt-2">
              <div className="section-badge">2</div>
              <div>
                <h6 className="fw-bold text-sa-charcoal mb-0" style={{ fontSize: '15px' }}>
                  Academic Information
                </h6>
                <div className="text-muted" style={{ fontSize: '12.5px' }}>
                  Subject expertise and educational background.
                </div>
              </div>
            </div>

            <div className="row g-3">
              {/* Primary Subject */}
              <div className="col-12 col-md-6">
                <label className="form-label small fw-semibold text-sa-charcoal mb-1">
                  Primary Subject <span className="text-danger">*</span>
                </label>
                <div className="sa-custom-input-group">
                  <div className="sa-input-icon">
                    <BookOpen size={16} />
                  </div>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="sa-custom-input sa-custom-select"
                  >
                    {subjectOptions.map((subj) => (
                      <option key={subj} value={subj}>
                        {subj}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Additional Subjects (Multi-select dropdown) */}
              <div className="col-12 col-md-6" ref={additionalSubjectsRef}>
                <label className="form-label small fw-semibold text-sa-charcoal mb-1">
                  Additional Subjects
                </label>
                <div className="position-relative">
                  <div
                    className="sa-custom-input d-flex align-items-center justify-content-between text-truncate cursor-pointer"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setAdditionalSubjectsOpen(!additionalSubjectsOpen)}
                  >
                    <div className="d-flex align-items-center gap-2 text-truncate">
                      <div className="text-sa-muted" style={{ display: 'flex', alignItems: 'center' }}>
                        <BookOpen size={16} color="#94A3B8" />
                      </div>
                      <span className={formData.additionalSubjects.length === 0 ? 'text-muted' : 'text-sa-charcoal'}>
                        {formData.additionalSubjects.length === 0
                          ? 'Select additional subjects'
                          : formData.additionalSubjects.join(', ')}
                      </span>
                    </div>
                    <ChevronDown size={14} className="text-muted flex-shrink-0" />
                  </div>

                  {additionalSubjectsOpen && (
                    <div
                      className="position-absolute start-0 end-0 mt-1 bg-white border rounded-3 shadow-lg p-2"
                      style={{ zIndex: 10, maxHeight: '200px', overflowY: 'auto' }}
                    >
                      {subjectOptions
                        .filter((s) => s !== formData.subject)
                        .map((subj) => {
                          const isChecked = formData.additionalSubjects.includes(subj);
                          return (
                            <div
                              key={subj}
                              className="d-flex align-items-center justify-content-between px-2 py-1.5 rounded hover-bg-light cursor-pointer"
                              style={{ cursor: 'pointer' }}
                              onClick={() => toggleAdditionalSubject(subj)}
                            >
                              <span className="small text-sa-charcoal">{subj}</span>
                              {isChecked && <Check size={14} className="text-sa-primary" />}
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>

              {/* Educational Qualification */}
              <div className="col-12 col-md-6">
                <label className="form-label small fw-semibold text-sa-charcoal mb-1">
                  Educational Qualification <span className="text-danger">*</span>
                </label>
                <div className="sa-custom-input-group">
                  <div className="sa-input-icon">
                    <GraduationCap size={16} />
                  </div>
                  <select
                    name="qualification"
                    value={formData.qualification}
                    onChange={handleChange}
                    className="sa-custom-input sa-custom-select"
                  >
                    {qualificationOptions.map((qual) => (
                      <option key={qual} value={qual}>
                        {qual}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Teaching Experience */}
              <div className="col-12 col-md-6">
                <label className="form-label small fw-semibold text-sa-charcoal mb-1">
                  Teaching Experience <span className="text-danger">*</span>
                </label>
                <div className="sa-custom-input-group">
                  <div className="sa-input-icon">
                    <Clock size={16} />
                  </div>
                  <input
                    type="number"
                    name="experience"
                    placeholder="5"
                    value={formData.experience}
                    onChange={handleChange}
                    className="sa-custom-input"
                    style={{ paddingRight: '5.5rem' }}
                    min="0"
                  />
                  <div
                    className="position-absolute end-0 top-0 bottom-0 d-flex align-items-center pe-2"
                    style={{ zIndex: 3 }}
                  >
                    <select
                      name="experienceUnit"
                      value={formData.experienceUnit}
                      onChange={handleChange}
                      className="form-select form-select-sm border-0 bg-transparent text-sa-charcoal fw-semibold"
                      style={{ fontSize: '13px', cursor: 'pointer' }}
                    >
                      <option value="Years">Years</option>
                      <option value="Months">Months</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Employment Details */}
          <div id="employment-section" className="mb-4 pb-2 pt-2 border-top">
            <div className="d-flex align-items-center gap-2 mb-3 mt-2">
              <div className="section-badge">3</div>
              <div>
                <h6 className="fw-bold text-sa-charcoal mb-0" style={{ fontSize: '15px' }}>
                  Employment Details
                </h6>
                <div className="text-muted" style={{ fontSize: '12.5px' }}>
                  Official information and compensation details.
                </div>
              </div>
            </div>

            <div className="row g-3">
              {/* Employee ID */}
              <div className="col-12 col-md-6">
                <label className="form-label small fw-semibold text-sa-charcoal mb-1">
                  Employee ID <span className="text-danger">*</span>
                </label>
                <div className="sa-custom-input-group">
                  <div className="sa-input-icon">
                    <IdCard size={16} />
                  </div>
                  <input
                    type="text"
                    name="employeeId"
                    placeholder="e.g. EMP001"
                    value={formData.employeeId}
                    onChange={handleChange}
                    className="sa-custom-input"
                  />
                </div>
              </div>

              {/* Joining Date */}
              <div className="col-12 col-md-6">
                <label className="form-label small fw-semibold text-sa-charcoal mb-1">
                  Joining Date <span className="text-danger">*</span>
                </label>
                <div className="sa-custom-input-group">
                  <div className="sa-input-icon">
                    <Calendar size={16} />
                  </div>
                  <input
                    type="date"
                    name="joiningDate"
                    value={formData.joiningDate}
                    onChange={handleChange}
                    className="sa-custom-input"
                  />
                </div>
              </div>

              {/* Employment Type */}
              <div className="col-12 col-md-6">
                <label className="form-label small fw-semibold text-sa-charcoal mb-1">
                  Employment Type <span className="text-danger">*</span>
                </label>
                <div className="sa-custom-input-group">
                  <div className="sa-input-icon">
                    <Briefcase size={16} />
                  </div>
                  <select
                    name="employmentType"
                    value={formData.employmentType}
                    onChange={handleChange}
                    className="sa-custom-input sa-custom-select"
                  >
                    <option value="Full Time">Full Time</option>
                    <option value="Part Time">Part Time</option>
                    <option value="Visiting Faculty">Visiting Faculty</option>
                    <option value="Contractual">Contractual</option>
                  </select>
                </div>
              </div>

              {/* Monthly Base Salary */}
              <div className="col-12 col-md-6">
                <label className="form-label small fw-semibold text-sa-charcoal mb-1">
                  Monthly Base Salary (₹) <span className="text-danger">*</span>
                </label>
                <div className="sa-custom-input-group">
                  <div className="sa-input-icon">
                    <IndianRupee size={16} />
                  </div>
                  <input
                    type="number"
                    name="monthlySalary"
                    placeholder="65000"
                    value={formData.monthlySalary}
                    onChange={handleChange}
                    className={`sa-custom-input ${errors.monthlySalary ? 'border-danger' : ''}`}
                  />
                </div>
                {errors.monthlySalary && (
                  <div className="text-danger small mt-1">{errors.monthlySalary}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Bar */}
      <div className="d-flex flex-column flex-md-row align-items-center justify-content-between gap-3 mt-4 pt-3 border-top">
        <div className="d-flex align-items-center gap-2 text-muted small">
          <Info size={16} className="text-secondary flex-shrink-0" />
          <span>The faculty member will receive login credentials by email.</span>
        </div>

        <div className="d-flex align-items-center gap-2 w-100 w-md-auto justify-content-end">
          {onCancel && (
            <button
              type="button"
              className="btn btn-onboard-cancel"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
          )}

          <button
            type="button"
            className="btn btn-save-draft d-inline-flex align-items-center gap-2"
            onClick={handleSaveDraft}
            disabled={loading}
          >
            <Save size={16} />
            <span>Save as Draft</span>
          </button>

          <button
            type="submit"
            className="btn btn-onboard-primary d-inline-flex align-items-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
            ) : (
              <Plus size={16} strokeWidth={2.5} />
            )}
            <span>{initialData ? 'Update Faculty' : 'Onboard Faculty'}</span>
          </button>
        </div>
      </div>
    </form>
  );
}
