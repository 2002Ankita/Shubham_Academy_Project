import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import studentService from '../../services/studentService';
import {
  User,
  Mail,
  Phone,
  GraduationCap,
  MapPin,
  CheckCircle2,
  Pencil,
  X,
  Save,
  Camera,
  Upload,
  Radio,
  ShieldCheck,
  ArrowLeft,
  AlertCircle,
  Building2,
  CalendarCheck,
  CreditCard,
  Award
} from 'lucide-react';
import { toast } from 'react-toastify';

export default function StudentProfile() {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);

  // Default profile derived from existing user and studentService defaults
  const defaultProfile = {
    id: user?.id || 'STU-001',
    name: user?.name || 'Aarav Deshmukh',
    email: user?.email || 'aarav.d@shubham.edu',
    phone: user?.phone || '+91 98231 45670',
    rollNumber: user?.rollNumber || 'SA-2026-1042',
    admissionId: 'ADM-2024-089',
    standard: user?.standard || '12th Science',
    batch: user?.batch || 'Batch Alpha (Morning)',
    rfidCard: user?.rfidCard || 'RFID-984210',
    status: 'Active Student',
    feesStatus: 'Paid',
    parentName: user?.parentName || 'Sanjay Deshmukh',
    parentPhone: user?.parentPhone || '+91 98231 45671',
    address: user?.address || 'Flat 402, Green Park, Kothrud, Pune - 411038',
    attendancePercent: 94.2,
    avatar: user?.avatar || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    academicYear: '2025 - 2026'
  };

  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('student_profile_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return { ...defaultProfile, ...parsed };
        }
      } catch (e) {
        console.error('Failed to parse cached student profile:', e);
      }
    }
    return defaultProfile;
  });

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: profile.name,
    email: profile.email,
    phone: profile.phone,
    parentName: profile.parentName,
    parentPhone: profile.parentPhone,
    address: profile.address,
    avatar: profile.avatar
  });
  const [errors, setErrors] = useState({});

  // Sync if auth user updates externally
  useEffect(() => {
    if (user?.name && user.name !== profile.name) {
      setProfile((prev) => ({
        ...prev,
        name: user.name,
        email: user.email || prev.email,
        avatar: user.avatar || prev.avatar
      }));
    }
  }, [user]);

  // Keep form data in sync when entering edit mode
  useEffect(() => {
    if (isEditing) {
      setFormData({
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        parentName: profile.parentName,
        parentPhone: profile.parentPhone,
        address: profile.address,
        avatar: profile.avatar
      });
      setErrors({});
    }
  }, [isEditing, profile]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, avatar: 'Please select a valid image file (PNG, JPG, WebP)' }));
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, avatar: 'Image size must be less than 2MB' }));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      handleInputChange('avatar', event.target.result);
      toast.info('Photo preview updated. Click "Save Changes" to save.');
    };
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Student full name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Full name must be at least 2 characters';
    }

    if (!formData.email?.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone?.trim()) {
      newErrors.phone = 'Phone number is required';
    } else {
      const cleanPhone = formData.phone.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        newErrors.phone = 'Please enter a valid 10-digit phone number';
      }
    }

    if (!formData.parentName?.trim()) {
      newErrors.parentName = 'Parent / Guardian name is required';
    } else if (formData.parentName.trim().length < 2) {
      newErrors.parentName = 'Parent name must be at least 2 characters';
    }

    if (!formData.parentPhone?.trim()) {
      newErrors.parentPhone = 'Parent alert phone is required';
    } else {
      const cleanParentPhone = formData.parentPhone.replace(/\D/g, '');
      if (cleanParentPhone.length < 10) {
        newErrors.parentPhone = 'Please enter a valid 10-digit phone number';
      }
    }

    if (!formData.address?.trim()) {
      newErrors.address = 'Residential address is required';
    } else if (formData.address.trim().length < 6) {
      newErrors.address = 'Please provide complete street / city details';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix the errors in the form before saving.');
      return;
    }

    setSaving(true);
    try {
      const updatedFields = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        parentName: formData.parentName.trim(),
        parentPhone: formData.parentPhone.trim(),
        address: formData.address.trim(),
        avatar: formData.avatar
      };

      // 1. Update mock student service
      if (studentService?.update) {
        await studentService.update(profile.id, updatedFields);
      }

      // 2. Update AuthContext & localStorage for session consistency
      if (updateUser) {
        updateUser(updatedFields);
      }

      // 3. Update persistent profile data
      const merged = { ...profile, ...updatedFields };
      localStorage.setItem('student_profile_data', JSON.stringify(merged));
      setProfile(merged);

      setIsEditing(false);
      setErrors({});
      toast.success('Profile updated successfully!');
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      parentName: profile.parentName,
      parentPhone: profile.parentPhone,
      address: profile.address,
      avatar: profile.avatar
    });
    setErrors({});
    setIsEditing(false);
  };

  return (
    <div className="d-flex flex-column gap-4" style={{ maxWidth: '1040px', margin: '0 auto' }}>
      {/* ========================================================================= */}
      {/* 1. VIEW MODE                                                             */}
      {/* ========================================================================= */}
      {!isEditing ? (
        <>
          {/* Header Description */}
          <div>
            <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
              My Profile
            </h3>
            <span className="small text-sa-muted">
              Manage your student identity, enrolled batch, contact details, and parent alert information
            </span>
          </div>

          {/* Profile Overview Card with Edit Profile Button */}
          <div className="sa-card overflow-hidden">
            {/* Subtle Shubham Academy top accent strip */}
            <div
              style={{
                height: '4px',
                background: 'linear-gradient(90deg, var(--sa-primary-red) 0%, #C4272D 60%, var(--sa-mustard-yellow) 100%)'
              }}
            />

            <div className="p-4 p-md-4">
              <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-4">
                {/* Left: Avatar and Identity Information */}
                <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center gap-3.5 gap-md-4 flex-grow-1 w-100">
                  {/* Avatar with clean, professional framing and active indicator */}
                  <div className="position-relative flex-shrink-0">
                    <div
                      className="rounded-circle p-1"
                      style={{
                        background: 'linear-gradient(145deg, #F8FAFC 0%, #E2E8F0 100%)',
                        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)'
                      }}
                    >
                      <img
                        src={profile.avatar}
                        alt={profile.name}
                        className="rounded-circle d-block"
                        style={{
                          width: '96px',
                          height: '96px',
                          objectFit: 'cover',
                          backgroundColor: '#FFFFFF'
                        }}
                      />
                    </div>
                    {/* Active student online indicator */}
                    <span
                      className="position-absolute bg-success border border-2 border-white rounded-circle shadow-sm"
                      title="Active Student Account"
                      style={{
                        width: '18px',
                        height: '18px',
                        bottom: '4px',
                        right: '4px'
                      }}
                    />
                  </div>

                  {/* Identity Details */}
                  <div className="flex-grow-1 w-100">
                    {/* Student Name + Status Badge */}
                    <div className="d-flex align-items-center gap-3 flex-wrap mb-2">
                      <h3
                        className="brand-font fw-bold m-0 text-sa-charcoal"
                        style={{ fontSize: '1.45rem', letterSpacing: '-0.02em', lineHeight: 1.2 }}
                      >
                        {profile.name}
                      </h3>
                      <span
                        className="d-inline-flex align-items-center gap-1.5 px-3 py-1 rounded-pill fw-semibold flex-shrink-0"
                        style={{
                          backgroundColor: 'var(--sa-success-bg, #ECFDF5)',
                          color: 'var(--sa-success-green, #047857)',
                          border: '1px solid rgba(22, 133, 84, 0.25)',
                          fontSize: '0.75rem',
                          lineHeight: 1
                        }}
                      >
                        <span
                          className="rounded-circle"
                          style={{
                            width: '6px',
                            height: '6px',
                            backgroundColor: 'var(--sa-success-green, #10B981)'
                          }}
                        />
                        Active Student
                      </span>
                    </div>

                    {/* Key Identity Row (Structured 3-Column Layout) */}
                    <div
                      className="rounded-2 my-3 p-3 px-sm-4"
                      style={{
                        backgroundColor: '#F8FAFC',
                        border: '1px solid #E2E8F0'
                      }}
                    >
                      <div className="d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center justify-content-between gap-3 gap-sm-0">
                        {/* Column 1: Roll No */}
                        <div className="flex-fill pe-sm-3">
                          <span
                            className="d-block text-uppercase fw-bold text-sa-muted mb-1"
                            style={{ fontSize: '0.68rem', letterSpacing: '0.06em', lineHeight: 1.2 }}
                          >
                            Roll No.
                          </span>
                          <span
                            className="d-block fw-bold text-sa-charcoal"
                            style={{ fontSize: '0.925rem', lineHeight: 1.3 }}
                          >
                            {profile.rollNumber}
                          </span>
                        </div>

                        {/* Subtle Divider 1 */}
                        <div
                          className="d-none d-sm-block align-self-center mx-2"
                          style={{ width: '1px', height: '28px', backgroundColor: '#E2E8F0' }}
                        />

                        {/* Column 2: Student ID */}
                        <div className="flex-fill px-sm-3">
                          <span
                            className="d-block text-uppercase fw-bold text-sa-muted mb-1"
                            style={{ fontSize: '0.68rem', letterSpacing: '0.06em', lineHeight: 1.2 }}
                          >
                            Student ID
                          </span>
                          <span
                            className="d-block fw-bold text-sa-charcoal"
                            style={{ fontSize: '0.925rem', lineHeight: 1.3 }}
                          >
                            {profile.id}
                          </span>
                        </div>

                        {/* Subtle Divider 2 */}
                        <div
                          className="d-none d-sm-block align-self-center mx-2"
                          style={{ width: '1px', height: '28px', backgroundColor: '#E2E8F0' }}
                        />

                        {/* Column 3: Class */}
                        <div className="flex-fill ps-sm-3">
                          <span
                            className="d-block text-uppercase fw-bold text-sa-muted mb-1"
                            style={{ fontSize: '0.68rem', letterSpacing: '0.06em', lineHeight: 1.2 }}
                          >
                            Class
                          </span>
                          <span
                            className="d-block fw-bold text-sa-primary"
                            style={{ fontSize: '0.925rem', lineHeight: 1.3 }}
                          >
                            {profile.standard}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Secondary Information Chips (RFID & Batch) */}
                    <div className="d-flex align-items-center gap-2.5 flex-wrap">
                      <div
                        className="d-inline-flex align-items-center gap-2 px-3 py-1.5 rounded-2"
                        style={{
                          backgroundColor: '#FFFFFF',
                          color: 'var(--sa-charcoal-light, #475569)',
                          border: '1px solid var(--sa-border, #E2E8F0)',
                          fontSize: '0.78rem',
                          height: '34px',
                          boxSizing: 'border-box'
                        }}
                      >
                        <Radio size={14} className="text-sa-primary flex-shrink-0" />
                        <span className="d-inline-flex align-items-center gap-1">
                          <span className="text-sa-muted">RFID:</span>
                          <strong className="text-sa-charcoal fw-semibold">{profile.rfidCard}</strong>
                        </span>
                      </div>

                      <div
                        className="d-inline-flex align-items-center gap-2 px-3 py-1.5 rounded-2"
                        style={{
                          backgroundColor: '#FFFFFF',
                          color: 'var(--sa-charcoal-light, #475569)',
                          border: '1px solid var(--sa-border, #E2E8F0)',
                          fontSize: '0.78rem',
                          height: '34px',
                          boxSizing: 'border-box'
                        }}
                      >
                        <Building2 size={14} className="text-sa-muted flex-shrink-0" />
                        <span className="d-inline-flex align-items-center gap-1">
                          <span className="text-sa-muted">Batch:</span>
                          <strong className="text-sa-charcoal fw-semibold">{profile.batch}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Edit Profile Action Button */}
                <div className="align-self-stretch align-self-md-center flex-shrink-0">
                  <button
                    type="button"
                    className="btn btn-sa-primary w-100 w-md-auto d-inline-flex align-items-center justify-content-center gap-2 px-3.5 py-2.5 rounded-2 shadow-sm"
                    onClick={() => setIsEditing(true)}
                    style={{ fontSize: '0.875rem', height: '40px' }}
                  >
                    <Pencil size={15} />
                    <span className="fw-semibold">Edit Profile</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Info Cards Grid */}
          <div className="row g-3 g-md-4">
            {/* Card 1: Personal & Contact Information */}
            <div className="col-12 col-lg-6">
              <div className="sa-card p-4 h-100 d-flex flex-column">
                <div className="d-flex align-items-center justify-content-between pb-3 border-bottom mb-3">
                  <div className="d-flex align-items-center gap-2">
                    <div className="p-2 rounded-2 bg-light text-sa-primary">
                      <User size={18} />
                    </div>
                    <h6 className="fw-bold text-sa-charcoal m-0 fs-6">Personal & Contact Info</h6>
                  </div>
                  <span className="badge bg-light text-sa-muted border small">Editable</span>
                </div>

                <div className="d-flex flex-column gap-3 small flex-grow-1">
                  <div>
                    <span className="text-sa-muted d-block mb-1">Student Full Name</span>
                    <div className="fw-semibold text-sa-charcoal fs-6">{profile.name}</div>
                  </div>

                  <div>
                    <span className="text-sa-muted d-block mb-1">Registered Email Address</span>
                    <div className="d-flex align-items-center gap-2 text-sa-charcoal fw-medium">
                      <Mail size={15} className="text-sa-primary flex-shrink-0" />
                      <span>{profile.email}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-sa-muted d-block mb-1">Student Mobile Phone</span>
                    <div className="d-flex align-items-center gap-2 text-sa-charcoal fw-medium">
                      <Phone size={15} className="text-sa-primary flex-shrink-0" />
                      <span>{profile.phone}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-sa-muted d-block mb-1">Residential Address</span>
                    <div className="d-flex align-items-start gap-2 text-sa-charcoal fw-medium">
                      <MapPin size={15} className="text-sa-primary flex-shrink-0 mt-0.5" />
                      <span>{profile.address}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Parent / Guardian & Emergency Alerts */}
            <div className="col-12 col-lg-6">
              <div className="sa-card p-4 h-100 d-flex flex-column">
                <div className="d-flex align-items-center justify-content-between pb-3 border-bottom mb-3">
                  <div className="d-flex align-items-center gap-2">
                    <div className="p-2 rounded-2 bg-light text-sa-primary">
                      <ShieldCheck size={18} />
                    </div>
                    <h6 className="fw-bold text-sa-charcoal m-0 fs-6">Parent & Emergency Contact</h6>
                  </div>
                  <span className="badge bg-light text-sa-muted border small">Editable</span>
                </div>

                <div className="d-flex flex-column gap-3 small flex-grow-1">
                  <div>
                    <span className="text-sa-muted d-block mb-1">Parent / Guardian Full Name</span>
                    <div className="fw-semibold text-sa-charcoal fs-6">{profile.parentName}</div>
                  </div>

                  <div>
                    <span className="text-sa-muted d-block mb-1">Emergency & RFID Alert Mobile Phone</span>
                    <div className="d-flex align-items-center gap-2 text-sa-charcoal fw-medium">
                      <Phone size={15} className="text-sa-primary flex-shrink-0" />
                      <span>{profile.parentPhone}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-sa-muted d-block mb-1">RFID Gate SMS Alerts</span>
                    <div className="d-flex align-items-center gap-2 text-success fw-semibold">
                      <CheckCircle2 size={16} />
                      <span>Active (Instant notifications sent on gate punch)</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-2 bg-light border small text-sa-muted mt-auto">
                    <span className="fw-medium text-sa-charcoal">Note:</span> Attendance timestamps and automated SMS updates are dispatched directly to this parent contact number.
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Academic & Enrollment Information */}
            <div className="col-12">
              <div className="sa-card p-4">
                <div className="d-flex align-items-center justify-content-between pb-3 border-bottom mb-3">
                  <div className="d-flex align-items-center gap-2">
                    <div className="p-2 rounded-2 bg-light text-sa-primary">
                      <GraduationCap size={18} />
                    </div>
                    <h6 className="fw-bold text-sa-charcoal m-0 fs-6">Academic & Enrollment Records</h6>
                  </div>
                  <span className="badge bg-secondary-subtle text-secondary border small">Admin Managed</span>
                </div>

                <div className="row g-3">
                  <div className="col-12 col-sm-6 col-md-3">
                    <div className="p-3 bg-light rounded-2 border">
                      <span className="text-sa-muted small d-block mb-1">Roll Number</span>
                      <span className="fw-bold text-sa-charcoal fs-6">{profile.rollNumber}</span>
                    </div>
                  </div>

                  <div className="col-12 col-sm-6 col-md-3">
                    <div className="p-3 bg-light rounded-2 border">
                      <span className="text-sa-muted small d-block mb-1">Class & Stream</span>
                      <span className="fw-bold text-sa-charcoal fs-6">{profile.standard}</span>
                    </div>
                  </div>

                  <div className="col-12 col-sm-6 col-md-3">
                    <div className="p-3 bg-light rounded-2 border">
                      <span className="text-sa-muted small d-block mb-1">Assigned Batch</span>
                      <span className="fw-bold text-sa-charcoal fs-6 text-truncate d-block" title={profile.batch}>
                        {profile.batch}
                      </span>
                    </div>
                  </div>

                  <div className="col-12 col-sm-6 col-md-3">
                    <div className="p-3 bg-light rounded-2 border">
                      <span className="text-sa-muted small d-block mb-1">Smart RFID Badge</span>
                      <span className="fw-bold text-sa-primary fs-6">{profile.rfidCard}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-top d-flex align-items-start gap-2 text-sa-muted small">
                  <AlertCircle size={16} className="text-sa-primary flex-shrink-0 mt-0.5" />
                  <span>
                    Official academic assignments, batch timetables, and RFID smart badge serial numbers are managed by the Shubham Academy administration. To request updates to academic records, please contact the academy administration desk.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* ========================================================================= */
        /* 2. EDIT PROFILE MODE                                                      */
        /* ========================================================================= */
        <form onSubmit={handleSave} noValidate>
          <div className="d-flex flex-column gap-4">
            {/* Header & Navigation */}
            <div>
              <button
                type="button"
                onClick={handleCancel}
                className="btn btn-link p-0 text-sa-muted text-decoration-none d-inline-flex align-items-center gap-1.5 small mb-2"
              >
                <ArrowLeft size={16} /> Cancel & Return to Profile
              </button>
              <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
                <div>
                  <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
                    Edit Student Profile
                  </h3>
                  <span className="small text-sa-muted">
                    Update your contact details, residential address, parent phone, and student avatar
                  </span>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-light border px-3 py-1.5 rounded-2 small fw-semibold text-sa-charcoal"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-sa-primary px-3 py-1.5 rounded-2 small fw-semibold shadow-sm d-inline-flex align-items-center gap-1.5"
                    disabled={saving}
                  >
                    {saving ? (
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                    ) : (
                      <Save size={15} />
                    )}
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Profile Photo Editor Card */}
            <div className="sa-card p-4">
              <h6 className="fw-bold text-sa-charcoal mb-3 fs-6 d-flex align-items-center gap-2">
                <Camera size={18} className="text-sa-primary" />
                <span>Profile Photo</span>
              </h6>

              <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center gap-4">
                <div className="position-relative">
                  <img
                    src={formData.avatar}
                    alt="Avatar preview"
                    className="rounded-circle border border-2 shadow-sm"
                    style={{
                      width: '84px',
                      height: '84px',
                      objectFit: 'cover',
                      backgroundColor: '#FFFFFF'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="position-absolute bottom-0 end-0 btn btn-sm btn-sa-primary rounded-circle p-1.5 shadow-sm d-flex align-items-center justify-content-center"
                    title="Change Photo"
                  >
                    <Upload size={13} />
                  </button>
                </div>

                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                    accept="image/*"
                    className="d-none"
                  />
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <button
                      type="button"
                      className="btn btn-sa-outline btn-sm px-3 py-1.5 rounded-2 d-inline-flex align-items-center gap-1.5 fw-medium"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload size={14} />
                      <span>Upload New Photo</span>
                    </button>
                    {formData.avatar !== profile.avatar && (
                      <button
                        type="button"
                        className="btn btn-link btn-sm text-sa-muted p-0 text-decoration-none"
                        onClick={() => handleInputChange('avatar', profile.avatar)}
                      >
                        Reset Photo
                      </button>
                    )}
                  </div>
                  <span className="text-sa-muted small d-block" style={{ fontSize: '0.80rem' }}>
                    Recommended: Square JPG, PNG or WebP under 2MB. A clear academic headshot works best.
                  </span>
                  {errors.avatar && (
                    <div className="text-danger small mt-1">{errors.avatar}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Editable Fields Card - 2 Column Form on Desktop */}
            <div className="sa-card p-4">
              <h6 className="fw-bold text-sa-charcoal mb-4 fs-6 pb-2 border-bottom">
                Personal & Contact Information
              </h6>

              <div className="row g-3 g-md-4">
                {/* Column 1: Personal & Student Contact */}
                <div className="col-12 col-md-6">
                  <div className="mb-3">
                    <label htmlFor="student-name" className="form-label fw-semibold small text-sa-charcoal">
                      Student Full Name <span className="text-danger">*</span>
                    </label>
                    <div className="position-relative">
                      <div className="position-absolute top-50 start-0 translate-middle-y ps-3 text-sa-muted pointer-events-none">
                        <User size={17} />
                      </div>
                      <input
                        id="student-name"
                        type="text"
                        className={`form-control ps-5 ${errors.name ? 'is-invalid' : ''}`}
                        placeholder="e.g. Aarav Deshmukh"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                      />
                    </div>
                    {errors.name && <div className="invalid-feedback d-block small mt-1">{errors.name}</div>}
                  </div>

                  <div className="mb-3">
                    <label htmlFor="student-phone" className="form-label fw-semibold small text-sa-charcoal">
                      Student Mobile Phone <span className="text-danger">*</span>
                    </label>
                    <div className="position-relative">
                      <div className="position-absolute top-50 start-0 translate-middle-y ps-3 text-sa-muted pointer-events-none">
                        <Phone size={17} />
                      </div>
                      <input
                        id="student-phone"
                        type="tel"
                        className={`form-control ps-5 ${errors.phone ? 'is-invalid' : ''}`}
                        placeholder="e.g. +91 98231 45670"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                      />
                    </div>
                    {errors.phone && <div className="invalid-feedback d-block small mt-1">{errors.phone}</div>}
                    <div className="form-text text-sa-muted" style={{ fontSize: '0.76rem' }}>
                      Primary contact number for student notifications.
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="parent-name" className="form-label fw-semibold small text-sa-charcoal">
                      Parent / Guardian Name <span className="text-danger">*</span>
                    </label>
                    <div className="position-relative">
                      <div className="position-absolute top-50 start-0 translate-middle-y ps-3 text-sa-muted pointer-events-none">
                        <User size={17} />
                      </div>
                      <input
                        id="parent-name"
                        type="text"
                        className={`form-control ps-5 ${errors.parentName ? 'is-invalid' : ''}`}
                        placeholder="e.g. Sanjay Deshmukh"
                        value={formData.parentName}
                        onChange={(e) => handleInputChange('parentName', e.target.value)}
                      />
                    </div>
                    {errors.parentName && <div className="invalid-feedback d-block small mt-1">{errors.parentName}</div>}
                  </div>
                </div>

                {/* Column 2: Email & Parent Alert Phone */}
                <div className="col-12 col-md-6">
                  <div className="mb-3">
                    <label htmlFor="student-email" className="form-label fw-semibold small text-sa-charcoal">
                      Student Email Address <span className="text-danger">*</span>
                    </label>
                    <div className="position-relative">
                      <div className="position-absolute top-50 start-0 translate-middle-y ps-3 text-sa-muted pointer-events-none">
                        <Mail size={17} />
                      </div>
                      <input
                        id="student-email"
                        type="email"
                        className={`form-control ps-5 ${errors.email ? 'is-invalid' : ''}`}
                        placeholder="e.g. aarav.d@shubham.edu"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                      />
                    </div>
                    {errors.email && <div className="invalid-feedback d-block small mt-1">{errors.email}</div>}
                  </div>

                  <div className="mb-3">
                    <label htmlFor="parent-phone" className="form-label fw-semibold small text-sa-charcoal">
                      Parent Alert Phone (RFID SMS) <span className="text-danger">*</span>
                    </label>
                    <div className="position-relative">
                      <div className="position-absolute top-50 start-0 translate-middle-y ps-3 text-sa-muted pointer-events-none">
                        <Phone size={17} />
                      </div>
                      <input
                        id="parent-phone"
                        type="tel"
                        className={`form-control ps-5 ${errors.parentPhone ? 'is-invalid' : ''}`}
                        placeholder="e.g. +91 98231 45671"
                        value={formData.parentPhone}
                        onChange={(e) => handleInputChange('parentPhone', e.target.value)}
                      />
                    </div>
                    {errors.parentPhone && <div className="invalid-feedback d-block small mt-1">{errors.parentPhone}</div>}
                    <div className="form-text text-sa-muted" style={{ fontSize: '0.76rem' }}>
                      Automated gate punch notifications are delivered to this number.
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="student-address" className="form-label fw-semibold small text-sa-charcoal">
                      Residential Address <span className="text-danger">*</span>
                    </label>
                    <div className="position-relative">
                      <div className="position-absolute top-0 start-0 pt-2.5 ps-3 text-sa-muted pointer-events-none">
                        <MapPin size={17} />
                      </div>
                      <textarea
                        id="student-address"
                        rows={2}
                        className={`form-control ps-5 ${errors.address ? 'is-invalid' : ''}`}
                        placeholder="Flat / House No, Street, Area, City & PIN code"
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        style={{ resize: 'none' }}
                      />
                    </div>
                    {errors.address && <div className="invalid-feedback d-block small mt-1">{errors.address}</div>}
                  </div>
                </div>
              </div>
            </div>

            {/* Read-Only Academic Records Banner */}
            <div className="sa-card p-4 bg-light bg-opacity-50">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h6 className="fw-bold text-sa-charcoal m-0 fs-6 d-flex align-items-center gap-2">
                  <GraduationCap size={18} className="text-sa-muted" />
                  <span>Academic Record Details</span>
                </h6>
                <span className="badge bg-secondary-subtle text-secondary border small">Read-Only</span>
              </div>

              <div className="row g-3">
                <div className="col-12 col-sm-6 col-md-4">
                  <label className="form-label small text-sa-muted mb-1">Roll Number</label>
                  <input
                    type="text"
                    disabled
                    value={profile.rollNumber}
                    className="form-control form-control-sm bg-white"
                  />
                </div>

                <div className="col-12 col-sm-6 col-md-4">
                  <label className="form-label small text-sa-muted mb-1">Enrolled Standard</label>
                  <input
                    type="text"
                    disabled
                    value={profile.standard}
                    className="form-control form-control-sm bg-white"
                  />
                </div>

                <div className="col-12 col-sm-6 col-md-4">
                  <label className="form-label small text-sa-muted mb-1">Smart RFID Badge</label>
                  <input
                    type="text"
                    disabled
                    value={profile.rfidCard}
                    className="form-control form-control-sm bg-white text-sa-primary fw-semibold"
                  />
                </div>
              </div>

              <div className="mt-3 text-sa-muted small" style={{ fontSize: '0.78rem' }}>
                Note: Standard, assigned batch, and RFID card registration are locked by academy administrators.
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="d-flex flex-column-reverse flex-sm-row justify-content-end align-items-stretch align-items-sm-center gap-2.5 pt-2 mb-4">
              <button
                type="button"
                className="btn btn-light border px-4 py-2 rounded-2 fw-semibold text-sa-charcoal"
                onClick={handleCancel}
                disabled={saving}
              >
                <X size={16} className="me-1.5" />
                Cancel
              </button>

              <button
                type="submit"
                className="btn btn-sa-primary px-4 py-2 rounded-2 fw-semibold shadow-sm d-inline-flex align-items-center justify-content-center gap-2"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
