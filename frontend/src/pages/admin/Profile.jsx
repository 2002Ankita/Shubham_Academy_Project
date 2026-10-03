import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import { toast } from 'react-toastify';
import {
  User,
  Mail,
  Phone,
  Shield,
  Building,
  MapPin,
  Camera,
  Save,
  Key,
  Lock,
  CheckCircle2,
  Clock,
  Sparkles,
  Eye,
  EyeOff,
  Check,
  Award,
  Briefcase,
  Calendar,
  BadgeCheck,
  BookOpen,
  Users,
  CreditCard,
  FileText,
  ScanLine,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminProfile() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'security' | 'permissions'
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Profile Form State
  const [profileData, setProfileData] = useState({
    name: user?.name || 'Rajesh Patil',
    email: user?.email || 'admin@shubham.edu',
    phone: user?.phone || '+91 98220 54321',
    title: user?.title || 'Center Head & Academy Administrator',
    academyName: user?.academyName || 'Shubham Academy',
    branch: user?.branch || 'Kolhapur Main Campus',
    officeRoom: user?.officeRoom || 'Room 102, Administrative Block',
    qualification: user?.qualification || 'M.Sc. (Physics), MBA Educational Administration',
    joiningDate: user?.joiningDate || '2021-08-01',
    emergencyContact: user?.emergencyContact || '+91 98220 99999',
    bio: user?.bio || 'Oversees daily academic operations, student admissions, RFID attendance integration, faculty coordination, and fee collection workflows for Kolhapur campus.',
    avatar: user?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  });

  // Profile Validation Errors
  const [errors, setErrors] = useState({});

  // Password State & Errors
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  // Keep state synchronized when user changes
  useEffect(() => {
    if (user) {
      setProfileData((prev) => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
        title: user.title || prev.title,
        avatar: user.avatar || prev.avatar,
        branch: user.branch || prev.branch,
        qualification: user.qualification || prev.qualification,
        officeRoom: user.officeRoom || prev.officeRoom,
      }));
    }
  }, [user]);

  // Handle Photo Upload
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file (JPG, PNG, or WEBP)');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Photo size should be less than 2 MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const newAvatarUrl = reader.result;
        setProfileData((prev) => ({ ...prev, avatar: newAvatarUrl }));
        toast.info('New profile photo selected. Click "Save Changes" to apply.');
      };
      reader.readAsDataURL(file);
    }
  };

  // Avatar Presets for quick selection
  const avatarPresets = [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
  ];

  // Validate Profile Fields
  const validateProfile = () => {
    const errs = {};
    if (!profileData.name?.trim()) {
      errs.name = 'Full name is required';
    } else if (profileData.name.trim().length < 2) {
      errs.name = 'Full name must be at least 2 characters';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!profileData.email?.trim()) {
      errs.email = 'Official email is required';
    } else if (!emailRegex.test(profileData.email.trim())) {
      errs.email = 'Please enter a valid email address';
    }

    const cleanPhone = (profileData.phone || '').replace(/\D/g, '');
    if (!profileData.phone?.trim()) {
      errs.phone = 'Contact phone number is required';
    } else if (cleanPhone.length < 10) {
      errs.phone = 'Please enter a valid 10-digit mobile number';
    }

    if (!profileData.title?.trim()) {
      errs.title = 'Official designation is required';
    }

    if (!profileData.branch) {
      errs.branch = 'Branch campus is required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Handle Save Profile
  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!validateProfile()) {
      toast.error('Please correct the highlighted fields before saving');
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      if (updateUser) {
        updateUser({
          name: profileData.name.trim(),
          email: profileData.email.trim(),
          phone: profileData.phone.trim(),
          title: profileData.title.trim(),
          branch: profileData.branch,
          avatar: profileData.avatar,
          officeRoom: profileData.officeRoom,
          qualification: profileData.qualification,
          bio: profileData.bio,
        });
      }
      setIsSaving(false);
      toast.success('Academy Admin profile updated successfully!');
    }, 400);
  };

  // Validate and Handle Save Password
  const handleSavePassword = (e) => {
    e.preventDefault();
    const pErrs = {};
    if (!passwords.currentPassword) {
      pErrs.currentPassword = 'Enter current password';
    }
    if (!passwords.newPassword) {
      pErrs.newPassword = 'New password is required';
    } else if (passwords.newPassword.length < 6) {
      pErrs.newPassword = 'Password must be at least 6 characters long';
    }
    if (!passwords.confirmPassword) {
      pErrs.confirmPassword = 'Confirm your new password';
    } else if (passwords.newPassword !== passwords.confirmPassword) {
      pErrs.confirmPassword = 'Passwords do not match';
    }

    setPasswordErrors(pErrs);
    if (Object.keys(pErrs).length > 0) {
      toast.error('Please review password validation requirements');
      return;
    }

    setIsSavingPassword(true);
    setTimeout(() => {
      setIsSavingPassword(false);
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Admin password updated successfully! Please use new credentials on next sign in.');
    }, 600);
  };

  return (
    <div className="d-flex flex-column gap-4" style={{ maxWidth: '1050px' }}>
      {/* Header with Back button */}
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
        <div>
          <button
            type="button"
            className="btn btn-link p-0 d-inline-flex align-items-center gap-1 small text-sa-muted mb-2 text-decoration-none"
            onClick={() => navigate('/admin/dashboard')}
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
          <div className="d-flex align-items-center gap-2">
            <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
              Academy Admin Profile
            </h3>
            <span className="badge rounded-pill bg-danger-subtle text-danger px-2.5 py-1 small fw-bold">
              Administrator
            </span>
          </div>
          <span className="small text-sa-muted">
            Manage your administrative account, center details, credentials, and access security
          </span>
        </div>
      </div>

      {/* Profile Overview Banner Card */}
      <div className="sa-card p-4 bg-white border rounded-3 shadow-xs">
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-4">
          <div className="d-flex align-items-center gap-4">
            {/* Avatar with Camera Upload Badge */}
            <div className="position-relative flex-shrink-0">
              <img
                src={profileData.avatar}
                alt={profileData.name}
                className="rounded-circle border shadow-sm object-fit-cover"
                style={{ width: '92px', height: '92px', borderColor: 'var(--sa-border)' }}
              />
              <label
                htmlFor="admin-avatar-upload"
                className="position-absolute bottom-0 end-0 bg-white rounded-circle shadow border d-flex align-items-center justify-content-center cursor-pointer transition-all"
                style={{
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                  backgroundColor: '#FFFFFF',
                }}
                title="Upload Photo"
              >
                <Camera size={16} className="text-sa-primary" />
                <input
                  id="admin-avatar-upload"
                  type="file"
                  accept="image/*"
                  className="d-none"
                  onChange={handleAvatarChange}
                />
              </label>
            </div>

            <div>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <h4 className="brand-font fw-bold m-0 text-sa-charcoal fs-5">
                  {profileData.name}
                </h4>
                <span className="badge bg-success small d-inline-flex align-items-center gap-1">
                  <BadgeCheck size={13} /> Active Admin
                </span>
              </div>
              <span className="text-sa-primary fw-semibold small d-block mt-0.5">
                {profileData.title}
              </span>
              <div className="d-flex align-items-center gap-3 mt-1.5 flex-wrap text-sa-muted small" style={{ fontSize: '0.82rem' }}>
                <span className="d-inline-flex align-items-center gap-1">
                  <Mail size={13} /> {profileData.email}
                </span>
                <span className="d-inline-flex align-items-center gap-1">
                  <Phone size={13} /> {profileData.phone}
                </span>
                <span className="d-inline-flex align-items-center gap-1">
                  <MapPin size={13} /> {profileData.branch}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Preset Selector */}
          <div className="d-flex flex-column align-items-md-end gap-1.5">
            <span className="small text-sa-muted" style={{ fontSize: '0.78rem' }}>
              Choose Sample Avatar:
            </span>
            <div className="d-flex gap-2">
              {avatarPresets.map((preset, idx) => (
                <img
                  key={idx}
                  src={preset}
                  alt={`Preset ${idx + 1}`}
                  className={`rounded-circle cursor-pointer border ${
                    profileData.avatar === preset ? 'border-2 border-danger shadow-xs' : 'opacity-75'
                  }`}
                  style={{ width: '34px', height: '34px', objectFit: 'cover', cursor: 'pointer' }}
                  onClick={() => {
                    setProfileData((prev) => ({ ...prev, avatar: preset }));
                    toast.info('Avatar selected. Click "Save Changes" to apply.');
                  }}
                  title="Click to use avatar"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="d-flex gap-2 border-top mt-4 pt-3">
          <button
            type="button"
            className={`btn btn-sm px-3 py-2 rounded-2 fw-semibold transition-all ${
              activeTab === 'profile'
                ? 'btn-sa-primary text-white shadow-xs'
                : 'btn-light bg-transparent text-sa-charcoal'
            }`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={15} className="me-1.5" /> Profile & Center Details
          </button>
          <button
            type="button"
            className={`btn btn-sm px-3 py-2 rounded-2 fw-semibold transition-all ${
              activeTab === 'security'
                ? 'btn-sa-primary text-white shadow-xs'
                : 'btn-light bg-transparent text-sa-charcoal'
            }`}
            onClick={() => setActiveTab('security')}
          >
            <Lock size={15} className="me-1.5" /> Security & Password
          </button>
          <button
            type="button"
            className={`btn btn-sm px-3 py-2 rounded-2 fw-semibold transition-all ${
              activeTab === 'permissions'
                ? 'btn-sa-primary text-white shadow-xs'
                : 'btn-light bg-transparent text-sa-charcoal'
            }`}
            onClick={() => setActiveTab('permissions')}
          >
            <Shield size={15} className="me-1.5" /> Role & Module Access
          </button>
        </div>
      </div>

      {/* Tab 1: Profile & Center Details */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="sa-card p-4 bg-white border rounded-3 shadow-xs">
          <div className="d-flex align-items-center justify-content-between pb-3 mb-3 border-bottom">
            <div>
              <h5 className="brand-font fw-bold m-0 text-sa-charcoal fs-6">
                Administrative Identity & Campus Details
              </h5>
              <span className="small text-sa-muted" style={{ fontSize: '0.80rem' }}>
                Update your administrative contact record and academy assignment
              </span>
            </div>
            <span className="small text-sa-muted">
              Fields marked with <span className="text-danger">*</span> are mandatory
            </span>
          </div>

          <div className="row g-3">
            {/* Full Name */}
            <div className="col-12 col-md-6">
              <Input
                label="Full Name"
                name="name"
                value={profileData.name}
                icon={User}
                onChange={(e) => {
                  setProfileData({ ...profileData, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: '' });
                }}
                error={errors.name}
                placeholder="e.g. Rajesh Patil"
                required
              />
            </div>

            {/* Registered Email */}
            <div className="col-12 col-md-6">
              <Input
                label="Registered Official Email"
                name="email"
                type="email"
                value={profileData.email}
                icon={Mail}
                onChange={(e) => {
                  setProfileData({ ...profileData, email: e.target.value });
                  if (errors.email) setErrors({ ...errors, email: '' });
                }}
                error={errors.email}
                placeholder="admin@shubham.edu"
                required
              />
            </div>

            {/* Contact Phone */}
            <div className="col-12 col-md-6">
              <Input
                label="Primary Contact Mobile (10 Digits)"
                name="phone"
                value={profileData.phone}
                icon={Phone}
                onChange={(e) => {
                  setProfileData({ ...profileData, phone: e.target.value });
                  if (errors.phone) setErrors({ ...errors, phone: '' });
                }}
                error={errors.phone}
                placeholder="+91 98220 XXXXX"
                required
              />
            </div>

            {/* Emergency / Alternate Phone */}
            <div className="col-12 col-md-6">
              <Input
                label="Emergency Desk / Alternate Contact"
                name="emergencyContact"
                value={profileData.emergencyContact}
                icon={Phone}
                onChange={(e) => setProfileData({ ...profileData, emergencyContact: e.target.value })}
                placeholder="+91 98220 99999"
              />
            </div>

            {/* Designation */}
            <div className="col-12 col-md-6">
              <Input
                label="Official Designation / Title"
                name="title"
                value={profileData.title}
                icon={Briefcase}
                onChange={(e) => {
                  setProfileData({ ...profileData, title: e.target.value });
                  if (errors.title) setErrors({ ...errors, title: '' });
                }}
                error={errors.title}
                placeholder="e.g. Center Head & Academy Administrator"
                required
              />
            </div>

            {/* Branch Assignment */}
            <div className="col-12 col-md-6">
              <Select
                label="Assigned Campus / Branch"
                name="branch"
                value={profileData.branch}
                onChange={(e) => {
                  setProfileData({ ...profileData, branch: e.target.value });
                  if (errors.branch) setErrors({ ...errors, branch: '' });
                }}
                error={errors.branch}
                options={[
                  'Kolhapur Main Campus',
                  'Pune Main Campus',
                  'Baner Tech Hub',
                  'Viman Nagar Extension',
                  'PCMC Nigdi Campus'
                ]}
                required
              />
            </div>

            {/* Office Cabin / Room */}
            <div className="col-12 col-md-6">
              <Input
                label="Administrative Cabin / Office"
                name="officeRoom"
                value={profileData.officeRoom}
                icon={Building}
                onChange={(e) => setProfileData({ ...profileData, officeRoom: e.target.value })}
                placeholder="e.g. Room 102, Ground Floor Administrative Block"
              />
            </div>

            {/* Qualifications */}
            <div className="col-12 col-md-6">
              <Input
                label="Academic Qualifications"
                name="qualification"
                value={profileData.qualification}
                icon={Award}
                onChange={(e) => setProfileData({ ...profileData, qualification: e.target.value })}
                placeholder="e.g. M.Sc. (Physics), MBA"
              />
            </div>

            {/* Joining Date */}
            <div className="col-12 col-md-6">
              <Input
                label="Date of Joining"
                name="joiningDate"
                type="date"
                value={profileData.joiningDate}
                onChange={(e) => setProfileData({ ...profileData, joiningDate: e.target.value })}
              />
            </div>

            {/* Academy Name */}
            <div className="col-12 col-md-6">
              <Input
                label="Institution Name"
                name="academyName"
                value={profileData.academyName}
                icon={Building}
                disabled
              />
            </div>

            {/* Administrative Bio / Summary */}
            <div className="col-12">
              <label className="form-label small fw-semibold text-sa-charcoal mb-1">
                Administrative Responsibilities & Bio
              </label>
              <textarea
                name="bio"
                className="form-control"
                rows={3}
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                placeholder="Describe your administrative scope, campus responsibilities, or contact hours..."
                style={{ fontSize: '0.90rem' }}
              />
            </div>
          </div>

          <div className="d-flex align-items-center justify-content-end gap-2 mt-4 pt-3 border-top">
            <Button
              type="button"
              variant="light"
              onClick={() => navigate('/admin/dashboard')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isSaving}
              icon={Save}
            >
              Save Profile Changes
            </Button>
          </div>
        </form>
      )}

      {/* Tab 2: Security & Password */}
      {activeTab === 'security' && (
        <div className="d-flex flex-column gap-4">
          <form onSubmit={handleSavePassword} className="sa-card p-4 bg-white border rounded-3 shadow-xs">
            <div className="d-flex align-items-center justify-content-between pb-3 mb-3 border-bottom">
              <div>
                <h5 className="brand-font fw-bold m-0 text-sa-charcoal fs-6">
                  Change Administrator Password
                </h5>
                <span className="small text-sa-muted" style={{ fontSize: '0.80rem' }}>
                  Ensure your account uses a secure password of at least 6 characters
                </span>
              </div>
              <Shield size={20} className="text-sa-primary" />
            </div>

            <div className="row g-3" style={{ maxWidth: '650px' }}>
              <div className="col-12">
                <div className="position-relative">
                  <Input
                    label="Current Password"
                    name="currentPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={passwords.currentPassword}
                    onChange={(e) => {
                      setPasswords({ ...passwords, currentPassword: e.target.value });
                      if (passwordErrors.currentPassword) setPasswordErrors({ ...passwordErrors, currentPassword: '' });
                    }}
                    error={passwordErrors.currentPassword}
                    placeholder="Enter current password"
                    icon={Lock}
                    required
                  />
                </div>
              </div>

              <div className="col-12 col-md-6">
                <Input
                  label="New Password"
                  name="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={passwords.newPassword}
                  onChange={(e) => {
                    setPasswords({ ...passwords, newPassword: e.target.value });
                    if (passwordErrors.newPassword) setPasswordErrors({ ...passwordErrors, newPassword: '' });
                  }}
                  error={passwordErrors.newPassword}
                  placeholder="Min. 6 characters"
                  icon={Key}
                  helperText="Minimum 6 characters"
                  required
                />
              </div>

              <div className="col-12 col-md-6">
                <Input
                  label="Confirm New Password"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={passwords.confirmPassword}
                  onChange={(e) => {
                    setPasswords({ ...passwords, confirmPassword: e.target.value });
                    if (passwordErrors.confirmPassword) setPasswordErrors({ ...passwordErrors, confirmPassword: '' });
                  }}
                  error={passwordErrors.confirmPassword}
                  placeholder="Re-type new password"
                  icon={Key}
                  required
                />
              </div>

              <div className="col-12">
                <button
                  type="button"
                  className="btn btn-sm btn-link p-0 text-decoration-none d-inline-flex align-items-center gap-1.5 text-sa-charcoal"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  <span className="small">{showPassword ? 'Hide Passwords' : 'Show Passwords'}</span>
                </button>
              </div>
            </div>

            <div className="d-flex justify-content-end mt-4 pt-3 border-top">
              <Button
                type="submit"
                variant="primary"
                loading={isSavingPassword}
                icon={Lock}
              >
                Update Password
              </Button>
            </div>
          </form>

          {/* Security Information Badges */}
          <div className="sa-card p-4 bg-white border rounded-3 shadow-xs">
            <h5 className="brand-font fw-bold m-0 text-sa-charcoal fs-6 mb-3">
              Account Security Status
            </h5>
            <div className="row g-3">
              <div className="col-12 col-md-4">
                <div className="p-3 bg-light rounded-3 border">
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <CheckCircle2 size={16} className="text-success" />
                    <span className="small fw-bold">Two-Factor Authentication</span>
                  </div>
                  <span className="text-sa-muted small d-block">
                    SMS Gateway Verification is actively configured for critical actions.
                  </span>
                </div>
              </div>

              <div className="col-12 col-md-4">
                <div className="p-3 bg-light rounded-3 border">
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <Clock size={16} className="text-primary" />
                    <span className="small fw-bold">Current Active Session</span>
                  </div>
                  <span className="text-sa-muted small d-block">
                    Logged in on Windows (Chrome) • Auto-expires in 24 hours.
                  </span>
                </div>
              </div>

              <div className="col-12 col-md-4">
                <div className="p-3 bg-light rounded-3 border">
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <Shield size={16} className="text-sa-primary" />
                    <span className="small fw-bold">RBAC Clearance Level</span>
                  </div>
                  <span className="text-sa-muted small d-block">
                    Level 2: Academy Administrator (Full Operational Scope).
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Permissions & Module Access Matrix */}
      {activeTab === 'permissions' && (
        <div className="sa-card p-4 bg-white border rounded-3 shadow-xs">
          <div className="pb-3 mb-3 border-bottom">
            <h5 className="brand-font fw-bold m-0 text-sa-charcoal fs-6">
              Administrative Operational Clearance
            </h5>
            <span className="small text-sa-muted">
              Overview of authorized system permissions and modules for the Academy Administrator role
            </span>
          </div>

          <div className="row g-3">
            {[
              { title: 'Admissions & Registration', icon: Users, status: 'Full Control', desc: 'Register students, issue RFID cards, manage batches.' },
              { title: 'Student Management', icon: Users, status: 'Full Control', desc: 'Browse student ledgers, profiles, and academic records.' },
              { title: 'RFID Gate Attendance', icon: ScanLine, status: 'Full Control', desc: 'Monitor live turnstiles, simulate taps, and send SMS alerts.' },
              { title: 'Fee Collection Counter', icon: CreditCard, status: 'Full Control', desc: 'Collect tuition fees, manage installments, generate GST receipts.' },
              { title: 'Examination Scheduler', icon: FileText, status: 'Full Control', desc: 'Create exams, assign halls, monitor marks entry.' },
              { title: 'Faculty & Payroll', icon: Award, status: 'Manage & Disburse', desc: 'Onboard faculty, track salary drafts, record disbursements.' },
              { title: 'Study Notes & Inventory', icon: BookOpen, status: 'Full Control', desc: 'Track printed book stock, warehouse alerts, handout verification.' },
              { title: 'Circulars & Notices', icon: Sparkles, status: 'Publish & Broadcast', desc: 'Broadcast circulars to students, parents, and teachers.' },
            ].map((mod, i) => {
              const Icon = mod.icon;
              return (
                <div key={i} className="col-12 col-md-6">
                  <div className="p-3 border rounded-3 d-flex align-items-start gap-3 bg-white hover-shadow transition-all">
                    <div
                      className="p-2.5 rounded-2 d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{ backgroundColor: '#FDF0F0', color: '#8B1216' }}
                    >
                      <Icon size={20} />
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <span className="fw-bold text-sa-charcoal small">{mod.title}</span>
                        <span className="badge bg-success-subtle text-success small fw-semibold">
                          {mod.status}
                        </span>
                      </div>
                      <span className="text-sa-muted small d-block" style={{ fontSize: '0.78rem' }}>
                        {mod.desc}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
