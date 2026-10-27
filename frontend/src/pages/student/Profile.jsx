import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import studentService from '../../services/studentService';
import batchService from '../../services/batchService';
import BackButton from '../../components/common/BackButton';
import {
  User,
  Mail,
  Phone,
  GraduationCap,
  MapPin,
  CheckCircle2,
  Check,
  Pencil,
  X,
  Save,
  Camera,
  Upload,
  ShieldCheck,
  AlertCircle,
  Building2,
  CalendarCheck,
  CreditCard,
  Award,
  Lock,
  ArrowLeft,
  Calendar,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { toast } from 'react-toastify';

export default function StudentProfile() {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);
  const [batchesList, setBatchesList] = useState([]);

  // Fetch batches for academic selection
  useEffect(() => {
    batchService.getBatches()
      .then((data) => {
        if (Array.isArray(data)) setBatchesList(data);
      })
      .catch((err) => console.warn('Could not load batches list:', err));
  }, []);

  // Initial default student profile structure
  const defaultProfile = {
    id: user?.id || 'N/A',
    studentId: user?.rollNumber || user?.student_id || 'Auto-generated',
    name: user?.name || user?.full_name || '',
    phone: user?.phone || user?.mobile_number || '',
    parentPhone: user?.parentPhone || user?.parent_mobile || '',
    email: user?.email || '',
    dob: '',
    gender: 'Male',
    address: '',
    city: '',
    state: 'Maharashtra',
    pincode: '',
    standard: user?.standard || '',
    batch: user?.batch || '',
    branch: user?.branch || 'Mangalvar Peth',
    academicYear: '2025-2026',
    previousSchool: '',
    parentName: user?.parentName || user?.parent_name || '',
    relation: 'Father',
    parentEmail: '',
    parentOccupation: '',
    rfidCard: user?.rfidCard || 'Pending Assignment',
    totalFees: Number(user?.totalFees) || 45000,
    paidFees: Number(user?.paidFees) || 15000,
    remainingFees: Number(user?.remainingFees) || 30000,
    feesStatus: 'Partial',
    profileCompleted: false,
    avatar: user?.avatar || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80'
  };

  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('student_profile_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && String(parsed.id) === String(user?.id)) {
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

  // Form State for editing
  const [formData, setFormData] = useState({
    // Admin-entered fields (strictly read-only for students):
    name: profile.name,
    phone: profile.phone,
    parentPhone: profile.parentPhone,
    totalFees: profile.totalFees,
    paidFees: profile.paidFees,
    remainingFees: profile.remainingFees,

    // Student-entered personal fields:
    email: profile.email,
    dob: profile.dob,
    gender: profile.gender || 'Male',
    address: profile.address,
    city: profile.city || '',
    state: profile.state || 'Maharashtra',
    pincode: profile.pincode || '',
    avatar: profile.avatar,

    // Student-entered academic fields:
    standard: profile.standard,
    batch: profile.batch,
    branch: profile.branch || 'Kolhapur Main Branch',
    academicYear: profile.academicYear || '2025-2026',
    previousSchool: profile.previousSchool || '',

    // Student-entered parent fields:
    parentName: profile.parentName,
    relation: profile.relation || 'Father',
    parentEmail: profile.parentEmail || '',
    parentOccupation: profile.parentOccupation || ''
  });

  const [errors, setErrors] = useState({});

  // Dynamic Profile Completion calculation based on all required profile fields
  const profileFields = useMemo(() => [
    { key: 'name', label: 'Student Full Name (Admin)', isComplete: Boolean(profile?.name?.trim()) },
    { key: 'phone', label: 'Mobile Number (Admin)', isComplete: Boolean(profile?.phone?.trim()) },
    { key: 'parentPhone', label: 'Parent Mobile (Admin)', isComplete: Boolean(profile?.parentPhone?.trim()) },
    { key: 'dob', label: 'Date of Birth (Student)', isComplete: Boolean(profile?.dob) },
    { key: 'gender', label: 'Gender (Student)', isComplete: Boolean(profile?.gender) },
    { key: 'email', label: 'Student Email (Student)', isComplete: Boolean(profile?.email?.trim()) },
    { key: 'address', label: 'Residential Address (Student)', isComplete: Boolean(profile?.address?.trim()) },
    { key: 'standard', label: 'Class / Standard (Student)', isComplete: Boolean(profile?.standard && profile.standard !== 'Pending Selection') },
    { key: 'batch', label: 'Study Batch (Student)', isComplete: Boolean(profile?.batch && profile.batch !== 'Pending Allocation') },
    { key: 'parentName', label: 'Parent / Guardian Name (Student)', isComplete: Boolean(profile?.parentName?.trim()) }
  ], [profile]);

  const totalFields = profileFields.length;
  const completedFields = profileFields.filter((f) => f.isComplete).length;
  const completionPercentage = Math.round((completedFields / totalFields) * 100);

  // Fetch real profile data from backend on mount
  useEffect(() => {
    const fetchRealProfile = async () => {
      if (!user?.id) return;
      try {
        const data = await studentService.getById(user.id);
        if (data) {
          const totalFees = Number(data.total_fees || data.totalFees) || 0;
          const paidFees = Number(data.paid_fees || data.paidFees) || 0;
          const remainingFees = Math.max(0, totalFees - paidFees);

          const formattedDob = data.date_of_birth
            ? new Date(data.date_of_birth).toISOString().split('T')[0]
            : '';

          const updated = {
            ...profile,
            id: data.id || profile.id,
            studentId: data.student_id || data.rollNumber || profile.studentId,
            name: data.full_name || data.name || profile.name,
            phone: data.mobile_number || data.phone || profile.phone,
            parentPhone: data.parent_mobile || data.parentPhone || profile.parentPhone,
            email: data.email || profile.email,
            dob: formattedDob || profile.dob,
            gender: data.gender || profile.gender,
            address: data.address || profile.address,
            city: data.city || profile.city,
            state: data.state || profile.state,
            pincode: data.pincode || profile.pincode,
            standard: data.standard || profile.standard,
            batch: data.batch || profile.batch,
            branch: data.branch || profile.branch,
            academicYear: data.academic_year || profile.academicYear,
            previousSchool: data.previous_school || profile.previousSchool,
            parentName: data.parent_name || profile.parentName,
            relation: data.relation || profile.relation,
            parentEmail: data.parent_email || profile.parentEmail,
            parentOccupation: data.parent_occupation || profile.parentOccupation,
            rfidCard: data.rfid_tag || profile.rfidCard,
            totalFees,
            paidFees,
            remainingFees,
            feesStatus: paidFees >= totalFees && totalFees > 0 ? 'Paid' : paidFees > 0 ? 'Partial' : 'Pending',
            profileCompleted: Boolean(data.profile_completed),
            avatar: data.avatar || profile.avatar
          };

          setProfile(updated);
          localStorage.setItem('student_profile_data', JSON.stringify(updated));
        }
      } catch (err) {
        console.warn('Could not fetch real profile data:', err);
      }
    };

    fetchRealProfile();
  }, [user?.id]);

  // Keep form data in sync when entering edit mode
  useEffect(() => {
    if (isEditing) {
      setFormData({
        name: profile.name,
        phone: profile.phone,
        parentPhone: profile.parentPhone,
        totalFees: profile.totalFees,
        paidFees: profile.paidFees,
        remainingFees: profile.remainingFees,
        email: profile.email,
        dob: profile.dob,
        gender: profile.gender || 'Male',
        address: profile.address,
        city: profile.city || '',
        state: profile.state || 'Maharashtra',
        pincode: profile.pincode || '',
        avatar: profile.avatar,
        standard: profile.standard,
        batch: profile.batch,
        branch: profile.branch || 'Kolhapur Main Branch',
        academicYear: profile.academicYear || '2025-2026',
        previousSchool: profile.previousSchool || '',
        parentName: profile.parentName,
        relation: profile.relation || 'Father',
        parentEmail: profile.parentEmail || '',
        parentOccupation: profile.parentOccupation || ''
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
      toast.error('Please select a valid image file (PNG, JPG, WebP)');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
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

    if (formData.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.pincode?.trim() && !/^\d{6}$/.test(formData.pincode.trim())) {
      newErrors.pincode = 'Please enter a valid 6-digit PIN code';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }

    setSaving(true);
    try {
      // Payload for Student Role Update:
      // Note: Admin-locked fields (name, phone, parentPhone, fees) are stripped/ignored by backend RBAC for safety
      const updatedFields = {
        email: formData.email?.trim() || undefined,
        dob: formData.dob || undefined,
        date_of_birth: formData.dob ? new Date(formData.dob).toISOString() : undefined,
        gender: formData.gender,
        address: (formData.address || '').trim(),
        city: (formData.city || '').trim(),
        state: (formData.state || '').trim(),
        pincode: (formData.pincode || '').trim(),
        standard: formData.standard || undefined,
        batch: formData.batch || undefined,
        branch: formData.branch,
        academic_year: formData.academicYear,
        previous_school: (formData.previousSchool || '').trim(),
        parent_name: (formData.parentName || '').trim(),
        relation: formData.relation,
        parent_email: (formData.parentEmail || '').trim(),
        parent_occupation: (formData.parentOccupation || '').trim(),
        avatar: formData.avatar
      };

      // 1. Send update to Backend API
      await studentService.update(profile.id, updatedFields);

      // 2. Update local profile state
      const merged = {
        ...profile,
        ...updatedFields,
        parentName: updatedFields.parent_name,
        previousSchool: updatedFields.previous_school,
        parentEmail: updatedFields.parent_email,
        parentOccupation: updatedFields.parent_occupation,
        academicYear: updatedFields.academic_year,
        profileCompleted: Boolean(
          updatedFields.date_of_birth && 
          updatedFields.gender && 
          updatedFields.address && 
          updatedFields.parent_name
        )
      };

      setProfile(merged);
      localStorage.setItem('student_profile_data', JSON.stringify(merged));

      // 3. Update Auth context if needed
      if (updateUser) {
        updateUser({
          email: merged.email,
          standard: merged.standard,
          batch: merged.batch,
          avatar: merged.avatar
        });
      }

      setIsEditing(false);
      setErrors({});
      toast.success('Student profile updated successfully!');
    } catch (err) {
      console.error('Error updating student profile:', err);
      const detail = err.response?.data?.detail;
      let errMsg = 'Failed to save student profile. Please try again.';
      if (typeof detail === 'string') {
        errMsg = detail;
      } else if (Array.isArray(detail) && detail.length > 0) {
        const item = detail[0];
        const fieldName = Array.isArray(item.loc) ? item.loc.filter(l => l !== 'body' && l !== 'response').join(' ') : '';
        errMsg = fieldName ? `${fieldName}: ${item.msg}` : (item.msg || 'Validation error');
      } else if (err.message) {
        errMsg = err.message;
      }
      toast.error(errMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setErrors({});
    setIsEditing(false);
  };

  return (
    <div className="d-flex flex-column gap-4" style={{ maxWidth: '1040px', margin: '0 auto' }}>
      {/* Top Breadcrumb */}
      <div>
        <BackButton to="/student/dashboard" label="Back to Dashboard" />
      </div>

      {/* ========================================================================= */}
      {/* 1. VIEW MODE                                                             */}
      {/* ========================================================================= */}
      {!isEditing ? (
        <>
          {/* Header Title & Status */}
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2">
            <div>
              <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
                My Student Profile
              </h3>
              <span className="small text-sa-muted">
                Role-Based Student Profile: Admin-entered fields are protected. Personal and academic details can be edited below.
              </span>
            </div>

            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn text-white fw-semibold px-3 py-1.5 rounded-2 small d-inline-flex align-items-center gap-2 shadow-xs"
                style={{ backgroundColor: '#8B1216' }}
                onClick={() => setIsEditing(true)}
              >
                <Pencil size={15} />
                <span>{completionPercentage < 100 ? 'Complete Profile' : 'Edit Profile'}</span>
              </button>
            </div>
          </div>

          {/* Profile Overview Card with Avatar & Progress */}
          <div className="sa-card overflow-hidden">
            <div
              style={{
                height: '4px',
                background: 'linear-gradient(90deg, #8B1216 0%, #C4272D 60%, #F5A900 100%)'
              }}
            />

            <div className="p-4">
              <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-4">
                <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center gap-4 flex-grow-1 w-100">
                  {/* Avatar with Circular Ring */}
                  <div
                    className="position-relative flex-shrink-0 d-flex align-items-center justify-content-center"
                    style={{ width: '116px', height: '116px' }}
                  >
                    <svg
                      className="position-absolute top-0 start-0"
                      width="116"
                      height="116"
                      viewBox="0 0 116 116"
                      style={{ transform: 'rotate(-90deg)', pointerEvents: 'none' }}
                    >
                      <circle cx="58" cy="58" r="51" fill="none" stroke="#E2E8F0" strokeWidth="5" />
                      <circle
                        cx="58"
                        cy="58"
                        r="51"
                        fill="none"
                        stroke={completionPercentage === 100 ? '#10B981' : '#8B1216'}
                        strokeWidth="5"
                        strokeDasharray={2 * Math.PI * 51}
                        strokeDashoffset={(2 * Math.PI * 51) * (1 - completionPercentage / 100)}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                      />
                    </svg>

                    <div
                      className="rounded-circle overflow-hidden shadow-sm"
                      style={{ width: '92px', height: '92px', backgroundColor: '#FFFFFF', border: '2px solid #FFFFFF' }}
                    >
                      <img
                        src={profile.avatar}
                        alt={profile.name}
                        className="w-100 h-100 rounded-circle"
                        style={{ objectFit: 'cover' }}
                      />
                    </div>

                    {completionPercentage === 100 ? (
                      <div
                        className="position-absolute d-flex align-items-center justify-content-center rounded-circle shadow-sm"
                        style={{
                          width: '32px',
                          height: '32px',
                          backgroundColor: '#22C55E',
                          border: '3px solid #FFFFFF',
                          bottom: '2px',
                          right: '2px',
                          zIndex: 4
                        }}
                        title="Profile 100% Completed"
                      >
                        <Check size={18} strokeWidth={3.5} className="text-white" />
                      </div>
                    ) : (
                      <div
                        className="position-absolute start-50 translate-middle-x px-2 py-0.5 rounded-pill shadow-sm fw-bold"
                        style={{
                          bottom: '-6px',
                          backgroundColor: '#8B1216',
                          color: '#FFFFFF',
                          border: '2px solid #FFFFFF',
                          fontSize: '0.68rem',
                          zIndex: 3
                        }}
                      >
                        {completionPercentage}% Done
                      </div>
                    )}
                  </div>

                  {/* Identity Details */}
                  <div className="flex-grow-1 w-100">
                    <div className="d-flex align-items-center gap-3 flex-wrap mb-1">
                      <h3 className="brand-font fw-bold m-0 text-sa-charcoal fs-4">
                        {profile.name}
                      </h3>
                      <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2.5 py-1 rounded-pill small">
                        Active Student
                      </span>
                      {completionPercentage < 100 ? (
                        <span className="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 px-2.5 py-1 rounded-pill small">
                          Profile Incomplete ({completionPercentage}%)
                        </span>
                      ) : (
                        <span className="badge bg-success text-white px-2.5 py-1 rounded-pill small">
                          Profile Completed ✓
                        </span>
                      )}
                    </div>

                    <div className="row g-2 mt-2 small text-sa-muted">
                      <div className="col-12 col-sm-4">
                        <strong className="text-sa-charcoal d-block">Student ID:</strong>
                        <span className="text-sa-primary fw-bold">{profile.studentId}</span>
                      </div>
                      <div className="col-12 col-sm-4">
                        <strong className="text-sa-charcoal d-block">Enrolled Class:</strong>
                        <span>{profile.standard || <em className="text-muted">Pending Selection</em>}</span>
                      </div>
                      <div className="col-12 col-sm-4">
                        <strong className="text-sa-charcoal d-block">Study Batch:</strong>
                        <span>{profile.batch || <em className="text-muted">Pending Allocation</em>}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Fee Structure Summary (Admin-Entered & Locked) */}
          <div className="sa-card p-4">
            <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
              <div className="d-flex align-items-center gap-2">
                <CreditCard size={18} style={{ color: '#8B1216' }} />
                <h6 className="fw-bold m-0 text-sa-charcoal">Fee Account Overview</h6>
              </div>
              <span className="badge bg-light text-muted border d-inline-flex align-items-center gap-1 small">
                <Lock size={12} /> Managed by Accounts Admin (Read-Only)
              </span>
            </div>

            <div className="row g-3">
              <div className="col-12 col-sm-4">
                <div className="p-3 rounded-3 bg-light border">
                  <span className="text-muted small d-block mb-1">Total Course Fee</span>
                  <h4 className="fw-bold text-sa-charcoal m-0 fs-5">
                    ₹{Number(profile.totalFees || 0).toLocaleString()}
                  </h4>
                </div>
              </div>
              <div className="col-12 col-sm-4">
                <div className="p-3 rounded-3 bg-light border">
                  <span className="text-muted small d-block mb-1">Total Fee Paid</span>
                  <h4 className="fw-bold text-success m-0 fs-5">
                    ₹{Number(profile.paidFees || 0).toLocaleString()}
                  </h4>
                </div>
              </div>
              <div className="col-12 col-sm-4">
                <div className="p-3 rounded-3 bg-light border">
                  <span className="text-muted small d-block mb-1">Remaining Fee Balance</span>
                  <h4 className="fw-bold text-danger m-0 fs-5">
                    ₹{Number(profile.remainingFees || 0).toLocaleString()}
                  </h4>
                </div>
              </div>
            </div>
          </div>

          {/* 3-Section Cards (Admin-Entered Details, Personal Details, Academic Details) */}
          <div className="row g-4">
            {/* Section 1: Admin-Entered Data (Read-Only) */}
            <div className="col-12 col-md-6">
              <div className="sa-card p-4 h-100">
                <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                  <h6 className="fw-bold m-0 text-sa-charcoal d-flex align-items-center gap-2">
                    <ShieldCheck size={18} style={{ color: '#8B1216' }} />
                    <span>Admin-Entered Basic Info</span>
                  </h6>
                  <span className="badge bg-light text-secondary border small d-inline-flex align-items-center gap-1">
                    <Lock size={12} /> Read-Only
                  </span>
                </div>

                <div className="d-flex flex-column gap-3 small">
                  <div>
                    <span className="text-muted d-block">Student Official Name</span>
                    <strong className="text-sa-charcoal fs-6">{profile.name}</strong>
                  </div>
                  <div>
                    <span className="text-muted d-block">Student Mobile Number</span>
                    <strong className="text-sa-charcoal">{profile.phone}</strong>
                  </div>
                  <div>
                    <span className="text-muted d-block">Parent Mobile (Alerts & SMS)</span>
                    <strong className="text-sa-charcoal">{profile.parentPhone}</strong>
                  </div>
                  <div className="p-2.5 rounded-2 bg-light border text-muted small mt-2">
                    <Lock size={13} className="me-1 inline-block" />
                    These core identification details were registered by Academy Admin. To request changes, please contact the admin desk.
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Student-Entered Personal Information */}
            <div className="col-12 col-md-6">
              <div className="sa-card p-4 h-100">
                <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                  <h6 className="fw-bold m-0 text-sa-charcoal d-flex align-items-center gap-2">
                    <User size={18} style={{ color: '#8B1216' }} />
                    <span>Personal Profile Details</span>
                  </h6>
                  <span className="badge bg-light text-muted border small">Editable by Student</span>
                </div>

                <div className="d-flex flex-column gap-2.5 small">
                  <div className="d-flex justify-content-between border-bottom pb-1.5">
                    <span className="text-muted">Student Email:</span>
                    <span className="fw-semibold text-sa-charcoal">{profile.email || 'Not provided'}</span>
                  </div>
                  <div className="d-flex justify-content-between border-bottom pb-1.5">
                    <span className="text-muted">Date of Birth:</span>
                    <span className="fw-semibold text-sa-charcoal">{profile.dob || 'Not provided'}</span>
                  </div>
                  <div className="d-flex justify-content-between border-bottom pb-1.5">
                    <span className="text-muted">Gender:</span>
                    <span className="fw-semibold text-sa-charcoal">{profile.gender}</span>
                  </div>
                  <div className="d-flex justify-content-between border-bottom pb-1.5">
                    <span className="text-muted">Address:</span>
                    <span className="fw-semibold text-sa-charcoal text-end" style={{ maxWidth: '240px' }}>
                      {profile.address
                        ? `${profile.address}${profile.city ? `, ${profile.city}` : ''}${profile.pincode ? ` - ${profile.pincode}` : ''}`
                        : 'Not provided'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Academic Details */}
            <div className="col-12 col-md-6">
              <div className="sa-card p-4 h-100">
                <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                  <h6 className="fw-bold m-0 text-sa-charcoal d-flex align-items-center gap-2">
                    <GraduationCap size={18} style={{ color: '#8B1216' }} />
                    <span>Academic & Batch Information</span>
                  </h6>
                  <span className="badge bg-light text-muted border small">Editable by Student</span>
                </div>

                <div className="d-flex flex-column gap-2.5 small">
                  <div className="d-flex justify-content-between border-bottom pb-1.5">
                    <span className="text-muted">Enrolled Standard:</span>
                    <span className="fw-bold text-sa-charcoal">{profile.standard || 'Pending Selection'}</span>
                  </div>
                  <div className="d-flex justify-content-between border-bottom pb-1.5">
                    <span className="text-muted">Study Batch:</span>
                    <span className="fw-bold text-sa-primary">{profile.batch || 'Pending Allocation'}</span>
                  </div>
                  <div className="d-flex justify-content-between border-bottom pb-1.5">
                    <span className="text-muted">Academy Branch:</span>
                    <span className="fw-semibold text-sa-charcoal">{profile.branch}</span>
                  </div>
                  <div className="d-flex justify-content-between border-bottom pb-1.5">
                    <span className="text-muted">Academic Year:</span>
                    <span className="fw-semibold text-sa-charcoal">{profile.academicYear}</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Previous School:</span>
                    <span className="fw-semibold text-sa-charcoal">{profile.previousSchool || 'Not provided'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Parent & Guardian Details */}
            <div className="col-12 col-md-6">
              <div className="sa-card p-4 h-100">
                <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                  <h6 className="fw-bold m-0 text-sa-charcoal d-flex align-items-center gap-2">
                    <Building2 size={18} style={{ color: '#8B1216' }} />
                    <span>Parent & Guardian Information</span>
                  </h6>
                  <span className="badge bg-light text-muted border small">Editable by Student</span>
                </div>

                <div className="d-flex flex-column gap-2.5 small">
                  <div className="d-flex justify-content-between border-bottom pb-1.5">
                    <span className="text-muted">Parent / Guardian Name:</span>
                    <span className="fw-bold text-sa-charcoal">{profile.parentName || 'Not provided'}</span>
                  </div>
                  <div className="d-flex justify-content-between border-bottom pb-1.5">
                    <span className="text-muted">Relationship:</span>
                    <span className="fw-semibold text-sa-charcoal">{profile.relation}</span>
                  </div>
                  <div className="d-flex justify-content-between border-bottom pb-1.5">
                    <span className="text-muted">Parent Mobile (Locked):</span>
                    <span className="fw-semibold text-sa-charcoal">{profile.parentPhone}</span>
                  </div>
                  <div className="d-flex justify-content-between border-bottom pb-1.5">
                    <span className="text-muted">Parent Email:</span>
                    <span className="fw-semibold text-sa-charcoal">{profile.parentEmail || 'Not provided'}</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Parent Occupation:</span>
                    <span className="fw-semibold text-sa-charcoal">{profile.parentOccupation || 'Not provided'}</span>
                  </div>
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
                    Complete Student Profile
                  </h3>
                  <span className="small text-sa-muted">
                    Fill in your personal, academic, and parent details. Admin-entered fields remain read-only.
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
                    className="btn text-white px-4 py-1.5 rounded-2 small fw-semibold shadow-sm d-inline-flex align-items-center gap-1.5"
                    style={{ backgroundColor: '#8B1216' }}
                    disabled={saving}
                  >
                    {saving ? (
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                    ) : (
                      <Save size={16} />
                    )}
                    <span>Save Profile</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Read-Only Admin Section (Locked Banner) */}
            <div
              className="p-3.5 rounded-3 border"
              style={{ backgroundColor: '#FDF0F0', borderColor: 'rgba(139, 18, 22, 0.2)' }}
            >
              <div className="d-flex align-items-center gap-2 mb-2" style={{ color: '#8B1216' }}>
                <Lock size={18} />
                <h6 className="fw-bold m-0 fs-6">Admin-Entered Fields (Read-Only)</h6>
              </div>
              <p className="text-muted small m-0 mb-3" style={{ fontSize: '0.82rem' }}>
                The following identification and fee details were set by the Academy Admin at registration and cannot be modified by students.
              </p>

              <div className="row g-2 small">
                <div className="col-12 col-sm-6 col-md-3">
                  <div className="bg-white p-2.5 rounded-2 border">
                    <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Student Name</span>
                    <strong className="text-sa-charcoal">{formData.name}</strong>
                  </div>
                </div>
                <div className="col-12 col-sm-6 col-md-3">
                  <div className="bg-white p-2.5 rounded-2 border">
                    <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Student Mobile</span>
                    <strong className="text-sa-charcoal">{formData.phone}</strong>
                  </div>
                </div>
                <div className="col-12 col-sm-6 col-md-3">
                  <div className="bg-white p-2.5 rounded-2 border">
                    <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Parent Mobile</span>
                    <strong className="text-sa-charcoal">{formData.parentPhone}</strong>
                  </div>
                </div>
                <div className="col-12 col-sm-6 col-md-3">
                  <div className="bg-white p-2.5 rounded-2 border">
                    <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Fee Status</span>
                    <strong className="text-sa-primary">₹{formData.paidFees} / ₹{formData.totalFees}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Photo Upload */}
            <div className="sa-card p-4">
              <h6 className="fw-bold text-sa-charcoal mb-3 fs-6 d-flex align-items-center gap-2">
                <Camera size={18} style={{ color: '#8B1216' }} />
                <span>Profile Photo</span>
              </h6>

              <div className="d-flex align-items-center gap-4">
                <div
                  className="rounded-circle overflow-hidden shadow-sm flex-shrink-0"
                  style={{ width: '84px', height: '84px', border: '3px solid #8B1216' }}
                >
                  <img
                    src={formData.avatar}
                    alt="Avatar preview"
                    className="w-100 h-100"
                    style={{ objectFit: 'cover' }}
                  />
                </div>

                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                    accept="image/*"
                    className="d-none"
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm px-3 py-1.5 rounded-2 d-inline-flex align-items-center gap-1.5 fw-medium mb-1"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={14} />
                    <span>Upload New Photo</span>
                  </button>
                  <span className="text-muted small d-block" style={{ fontSize: '0.78rem' }}>
                    Square PNG, JPG, or WebP up to 2MB.
                  </span>
                </div>
              </div>
            </div>

            {/* Section 1: Student Personal Information */}
            <div className="sa-card p-4">
              <h6 className="fw-bold text-sa-charcoal mb-3 fs-6 pb-2 border-bottom d-flex align-items-center gap-2">
                <User size={18} style={{ color: '#8B1216' }} />
                <span>1. Personal Information</span>
              </h6>

              <div className="row g-3">
                {/* Student Email */}
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold small text-sa-charcoal">
                    Student Email Address
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted"><Mail size={16} /></span>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="student@example.com"
                      className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                    />
                    {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                  </div>
                </div>

                {/* Date of Birth */}
                <div className="col-12 col-md-3">
                  <label className="form-label fw-semibold small text-sa-charcoal">
                    Date of Birth
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted"><Calendar size={16} /></span>
                    <input
                      type="date"
                      value={formData.dob}
                      onChange={(e) => handleInputChange('dob', e.target.value)}
                      className={`form-control ${errors.dob ? 'is-invalid' : ''}`}
                    />
                    {errors.dob && <div className="invalid-feedback">{errors.dob}</div>}
                  </div>
                </div>

                {/* Gender */}
                <div className="col-12 col-md-3">
                  <label className="form-label fw-semibold small text-sa-charcoal">Gender</label>
                  <select
                    className="form-select"
                    value={formData.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Residential Address */}
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold small text-sa-charcoal">
                    Residential Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Street, building, area"
                    className={`form-control ${errors.address ? 'is-invalid' : ''}`}
                  />
                  {errors.address && <div className="invalid-feedback">{errors.address}</div>}
                </div>

                {/* City */}
                <div className="col-12 col-sm-4 col-md-2">
                  <label className="form-label fw-semibold small text-sa-charcoal">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="Kolhapur"
                    className="form-control"
                  />
                </div>

                {/* State */}
                <div className="col-12 col-sm-4 col-md-2">
                  <label className="form-label fw-semibold small text-sa-charcoal">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    placeholder="Maharashtra"
                    className="form-control"
                  />
                </div>

                {/* Pin Code */}
                <div className="col-12 col-sm-4 col-md-2">
                  <label className="form-label fw-semibold small text-sa-charcoal">PIN Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={formData.pincode}
                    onChange={(e) => handleInputChange('pincode', e.target.value)}
                    placeholder="416003"
                    className="form-control"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Academic Details */}
            <div className="sa-card p-4">
              <h6 className="fw-bold text-sa-charcoal mb-3 fs-6 pb-2 border-bottom d-flex align-items-center gap-2">
                <GraduationCap size={18} style={{ color: '#8B1216' }} />
                <span>2. Academic & Course Information</span>
              </h6>

              <div className="row g-3">
                {/* Standard / Class */}
                <div className="col-12 col-md-6">
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <label className="form-label fw-semibold small text-sa-charcoal m-0">
                      Enrolled Class / Standard
                    </label>
                    {profile.standard && profile.standard !== 'Pending Selection' && (
                      <span className="badge bg-light text-muted border small" style={{ fontSize: '11px' }}>
                        <Lock size={11} className="me-1 inline-block" /> Assigned by Admin
                      </span>
                    )}
                  </div>
                  {profile.standard && profile.standard !== 'Pending Selection' ? (
                    <div className="input-group">
                      <input
                        type="text"
                        value={formData.standard || profile.standard}
                        readOnly
                        disabled
                        className="form-control bg-light fw-bold text-sa-charcoal"
                      />
                      <span className="input-group-text bg-light text-muted">
                        <Lock size={15} />
                      </span>
                    </div>
                  ) : (
                    <select
                      className={`form-select ${errors.standard ? 'is-invalid' : ''}`}
                      value={formData.standard}
                      onChange={(e) => handleInputChange('standard', e.target.value)}
                    >
                      <option value="">-- Select Class --</option>
                      <option value="11th Science">11th Science</option>
                      <option value="12th Science">12th Science</option>
                      <option value="11th Commerce">11th Commerce</option>
                      <option value="12th Commerce">12th Commerce</option>
                      <option value="Foundation (8th-10th)">Foundation (8th-10th)</option>
                    </select>
                  )}
                  {errors.standard && <div className="invalid-feedback">{errors.standard}</div>}
                </div>

                {/* Study Batch */}
                <div className="col-12 col-md-6">
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <label className="form-label fw-semibold small text-sa-charcoal m-0">
                      Study Batch
                    </label>
                    {profile.batch && profile.batch !== 'Pending Allocation' && (
                      <span className="badge bg-light text-muted border small" style={{ fontSize: '11px' }}>
                        <Lock size={11} className="me-1 inline-block" /> Assigned by Admin
                      </span>
                    )}
                  </div>
                  {profile.batch && profile.batch !== 'Pending Allocation' ? (
                    <div className="input-group">
                      <input
                        type="text"
                        value={formData.batch || profile.batch}
                        readOnly
                        disabled
                        className="form-control bg-light fw-bold text-sa-primary"
                      />
                      <span className="input-group-text bg-light text-muted">
                        <Lock size={15} />
                      </span>
                    </div>
                  ) : (
                    <select
                      className={`form-select ${errors.batch ? 'is-invalid' : ''}`}
                      value={formData.batch}
                      onChange={(e) => handleInputChange('batch', e.target.value)}
                    >
                      <option value="">-- Select Batch --</option>
                      {batchesList.length > 0 ? (
                        batchesList.map((b) => (
                          <option key={b.id || b.name} value={b.name}>
                            {b.name}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="11th pcm tarabai park">11th pcm tarabai park</option>
                          <option value="11th pcb tarabai park">11th pcb tarabai park</option>
                          <option value="11th pcmb tarabai park">11th pcmb tarabai park</option>
                          <option value="12th pcm tarabai park">12th pcm tarabai park</option>
                          <option value="12th pcb tarabai park">12th pcb tarabai park</option>
                          <option value="12th pcmb tarabai park">12th pcmb tarabai park</option>
                          <option value="11th pcm Mangalvar Peth">11th pcm Mangalvar Peth</option>
                          <option value="11th pcb Mangalvar Peth">11th pcb Mangalvar Peth</option>
                          <option value="11th pcmb Mangalvar Peth">11th pcmb Mangalvar Peth</option>
                          <option value="12th pcm Mangalvar Peth">12th pcm Mangalvar Peth</option>
                          <option value="12th pcb Mangalvar Peth">12th pcb Mangalvar Peth</option>
                          <option value="12th pcmb Mangalvar Peth">12th pcmb Mangalvar Peth</option>
                        </>
                      )}
                    </select>
                  )}
                  {errors.batch && <div className="invalid-feedback">{errors.batch}</div>}
                </div>

                {/* Branch */}
                <div className="col-12 col-md-4">
                  <label className="form-label fw-semibold small text-sa-charcoal">Branch Location</label>
                  <select
                    className="form-select"
                    value={formData.branch}
                    onChange={(e) => handleInputChange('branch', e.target.value)}
                  >
                    <option value="Mangalwar Peth">Mangalwar Peth Campus</option>
                    <option value="Tarabai Park">Tarabai Park Campus</option>
                  </select>
                </div>

                {/* Academic Year */}
                <div className="col-12 col-md-4">
                  <label className="form-label fw-semibold small text-sa-charcoal">Academic Year</label>
                  <select
                    className="form-select"
                    value={formData.academicYear}
                    onChange={(e) => handleInputChange('academicYear', e.target.value)}
                  >
                    <option value="2025-2026">2025 - 2026</option>
                    <option value="2024-2025">2024 - 2025</option>
                  </select>
                </div>

                {/* Previous School */}
                <div className="col-12 col-md-4">
                  <label className="form-label fw-semibold small text-sa-charcoal">Previous School / College</label>
                  <input
                    type="text"
                    value={formData.previousSchool}
                    onChange={(e) => handleInputChange('previousSchool', e.target.value)}
                    placeholder="e.g. St. Xavier High School"
                    className="form-control"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Parent & Guardian Details */}
            <div className="sa-card p-4">
              <h6 className="fw-bold text-sa-charcoal mb-3 fs-6 pb-2 border-bottom d-flex align-items-center gap-2">
                <Building2 size={18} style={{ color: '#8B1216' }} />
                <span>3. Parent & Guardian Information</span>
              </h6>

              <div className="row g-3">
                {/* Parent Name */}
                <div className="col-12 col-md-5">
                  <label className="form-label fw-semibold small text-sa-charcoal">
                    Parent / Guardian Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.parentName}
                    onChange={(e) => handleInputChange('parentName', e.target.value)}
                    placeholder="e.g., Ajay Sharma"
                    className={`form-control ${errors.parentName ? 'is-invalid' : ''}`}
                  />
                  {errors.parentName && <div className="invalid-feedback">{errors.parentName}</div>}
                </div>

                {/* Relation */}
                <div className="col-12 col-md-3">
                  <label className="form-label fw-semibold small text-sa-charcoal">Relationship</label>
                  <select
                    className="form-select"
                    value={formData.relation}
                    onChange={(e) => handleInputChange('relation', e.target.value)}
                  >
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Guardian">Guardian</option>
                  </select>
                </div>

                {/* Parent Occupation */}
                <div className="col-12 col-md-4">
                  <label className="form-label fw-semibold small text-sa-charcoal">Parent Occupation</label>
                  <input
                    type="text"
                    value={formData.parentOccupation}
                    onChange={(e) => handleInputChange('parentOccupation', e.target.value)}
                    placeholder="e.g. Business / Engineer"
                    className="form-control"
                  />
                </div>

                {/* Parent Email */}
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold small text-sa-charcoal">Parent Email (Optional)</label>
                  <input
                    type="email"
                    value={formData.parentEmail}
                    onChange={(e) => handleInputChange('parentEmail', e.target.value)}
                    placeholder="parent@example.com"
                    className="form-control"
                  />
                </div>

                {/* Parent Mobile - Locked Note */}
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold small text-sa-charcoal">
                    Parent Alert Phone (Locked)
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted"><Lock size={16} /></span>
                    <input
                      type="text"
                      value={formData.parentPhone}
                      readOnly
                      disabled
                      className="form-control bg-light"
                    />
                  </div>
                  <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                    Entered by admin for SMS gateway delivery.
                  </span>
                </div>
              </div>
            </div>

            {/* Save Buttons at Bottom */}
            <div className="d-flex align-items-center justify-content-end gap-3 pt-2">
              <button
                type="button"
                className="btn btn-light border px-4 py-2"
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn text-white px-5 py-2 fw-semibold d-inline-flex align-items-center gap-2 shadow-sm"
                style={{ backgroundColor: '#8B1216' }}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                    <span>Saving Profile...</span>
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    <span>Save Completed Profile</span>
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
