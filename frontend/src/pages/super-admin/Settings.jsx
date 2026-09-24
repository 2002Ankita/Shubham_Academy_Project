import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { toast } from 'react-toastify';
import {
  User,
  Mail,
  Phone,
  Shield,
  Building2,
  MapPin,
  Camera,
  Save,
  Key,
  Lock,
  Server,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
  Bell,
  Eye,
  EyeOff,
  Sliders,
  Check
} from 'lucide-react';

export default function SuperAdminProfile() {
  const { user, updateUser } = useAuth();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'security' | 'system'
  const [isSaving, setIsSaving] = useState(false);

  // Profile Form State
  const [profileData, setProfileData] = useState({
    name: user?.name || 'Shubham Sharma',
    email: user?.email || 'superadmin@shubham.edu',
    phone: user?.phone || '+91 98220 12345',
    title: user?.title || 'Super Administrator & Managing Director',
    academyName: user?.academyName || 'Shubham Academy Central Administration',
    branch: user?.branch || 'Kolhapur Main Campus (Head Office)',
    officeRoom: user?.officeRoom || 'Executive Suite 201, Administrative Block',
    bio: user?.bio || 'Chief Director of Academic Operations & Strategic Development across all Shubham Academy branches.',
    avatar: user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    emergencyContact: user?.emergencyContact || '+91 98220 99999 (Academy Emergency Desk)',
  });

  // Password State
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);

  // System Settings State
  const [systemSettings, setSystemSettings] = useState({
    fastApiUrl: 'http://localhost:8000/api',
    jwtExpiryMinutes: '1440',
    smsGatewayKey: 'sms_live_pk_9842100877a',
    rfidGatewayIp: '192.168.1.100:8080',
    autoBackupEnabled: true,
  });

  // Keep state synced if user context changes
  useEffect(() => {
    if (user) {
      setProfileData((prev) => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
        title: user.title || prev.title,
        avatar: user.avatar || prev.avatar,
      }));
    }
  }, [user]);

  // Handle Avatar File Upload
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newAvatarUrl = reader.result;
        setProfileData((prev) => ({ ...prev, avatar: newAvatarUrl }));
        toast.info('New photo selected. Click "Save Profile" to apply changes.');
      };
      reader.readAsDataURL(file);
    }
  };

  // Avatar Presets for quick selection
  const avatarPresets = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
  ];

  // Save Profile Handler
  const handleSaveProfile = (e) => {
    e.preventDefault();
    setIsSaving(true);

    setTimeout(() => {
      if (updateUser) {
        updateUser({
          name: profileData.name,
          email: profileData.email,
          phone: profileData.phone,
          title: profileData.title,
          avatar: profileData.avatar,
          branch: profileData.branch,
          officeRoom: profileData.officeRoom,
          bio: profileData.bio,
        });
      }
      setIsSaving(false);
      toast.success('Super Admin profile updated successfully!');
    }, 400);
  };

  // Save Password Handler
  const handleSavePassword = (e) => {
    e.preventDefault();
    if (!passwords.currentPassword) {
      toast.error('Please enter your current password.');
      return;
    }
    if (passwords.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long.');
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('New password and confirm password do not match.');
      return;
    }

    toast.success('Security password updated successfully!');
    setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  // Save System Settings Handler
  const handleSaveSystem = (e) => {
    e.preventDefault();
    toast.success('System and backend configuration saved!');
  };

  return (
    <div className="d-flex flex-column gap-4" style={{ maxWidth: '960px' }}>
      {/* Page Title & Subtitle */}
      <div className="d-flex flex-column flex-sm-row sm:align-items-center justify-content-between gap-2">
        <div>
          <div className="d-flex align-items-center gap-2">
            <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">Super Admin Profile</h3>
            <span
              className="badge px-2.5 py-1 rounded-pill"
              style={{ backgroundColor: '#FDF0F0', color: 'var(--sa-primary)', fontSize: '0.75rem' }}
            >
              Master Account
            </span>
          </div>
          <span className="small text-sa-muted">
            Manage your personal profile details, account security credentials, and platform preferences.
          </span>
        </div>
      </div>

      {/* Hero Overview Card */}
      <div
        className="sa-card p-4 rounded-3 border bg-white position-relative overflow-hidden"
        style={{
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          borderLeft: '4px solid var(--sa-primary)'
        }}
      >
        <div className="d-flex flex-column flex-md-row align-items-md-center gap-4">
          {/* Avatar with Upload Badge */}
          <div className="position-relative flex-shrink-0">
            <img
              src={profileData.avatar}
              alt={profileData.name}
              className="rounded-circle object-fit-cover border shadow-sm"
              style={{ width: '96px', height: '96px', borderColor: 'var(--sa-border)' }}
            />
            <label
              htmlFor="avatar-upload"
              className="position-absolute bottom-0 end-0 bg-white rounded-circle p-2 shadow border cursor-pointer d-flex align-items-center justify-content-center"
              style={{ width: '32px', height: '32px', cursor: 'pointer' }}
              title="Change Profile Photo"
            >
              <Camera size={16} className="text-sa-primary" />
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="d-none"
                onChange={handleAvatarChange}
              />
            </label>
          </div>

          {/* User Details Overview */}
          <div className="flex-grow-1">
            <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
              <h4 className="fw-bold text-sa-charcoal m-0">{profileData.name}</h4>
              <span className="badge bg-success-subtle text-success small border border-success-subtle px-2 py-0.5 rounded-pill d-inline-flex align-items-center gap-1">
                <CheckCircle2 size={12} /> Active Root Admin
              </span>
            </div>
            <p className="text-sa-primary fw-medium mb-2 small">{profileData.title}</p>

            <div className="d-flex flex-wrap gap-y-2 gap-x-4 text-sa-muted small">
              <span className="d-inline-flex align-items-center gap-1.5">
                <Mail size={14} className="text-sa-primary" />
                {profileData.email}
              </span>
              <span className="d-inline-flex align-items-center gap-1.5">
                <Phone size={14} className="text-sa-primary" />
                {profileData.phone}
              </span>
              <span className="d-inline-flex align-items-center gap-1.5">
                <MapPin size={14} className="text-sa-primary" />
                {profileData.branch}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="d-flex gap-2 border-bottom pb-2">
        <button
          type="button"
          className={`btn btn-sm d-flex align-items-center gap-2 px-3 py-2 rounded-2 fw-semibold transition-all ${
            activeTab === 'profile'
              ? 'bg-sa-primary text-white shadow-sm'
              : 'btn-light text-sa-charcoal border'
          }`}
          onClick={() => setActiveTab('profile')}
        >
          <User size={16} />
          Profile Information
        </button>

        <button
          type="button"
          className={`btn btn-sm d-flex align-items-center gap-2 px-3 py-2 rounded-2 fw-semibold transition-all ${
            activeTab === 'security'
              ? 'bg-sa-primary text-white shadow-sm'
              : 'btn-light text-sa-charcoal border'
          }`}
          onClick={() => setActiveTab('security')}
        >
          <Lock size={16} />
          Security & Password
        </button>

        <button
          type="button"
          className={`btn btn-sm d-flex align-items-center gap-2 px-3 py-2 rounded-2 fw-semibold transition-all ${
            activeTab === 'system'
              ? 'bg-sa-primary text-white shadow-sm'
              : 'btn-light text-sa-charcoal border'
          }`}
          onClick={() => setActiveTab('system')}
        >
          <Sliders size={16} />
          System & API Settings
        </button>
      </div>

      {/* TAB 1: Profile Information */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="sa-card p-4 rounded-3 border bg-white d-flex flex-column gap-4">
          <div>
            <h6 className="fw-bold text-sa-charcoal mb-1 d-flex align-items-center gap-2">
              <User size={18} className="text-sa-primary" />
              Personal & Role Details
            </h6>
            <p className="text-sa-muted small m-0">Edit your official super administrator identity and contact info</p>
          </div>

          <div className="row g-3">
            {/* Full Name */}
            <div className="col-12 col-md-6">
              <Input
                label="Full Name"
                name="name"
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                placeholder="Enter full name"
                required
                icon={User}
              />
            </div>

            {/* Official Designation */}
            <div className="col-12 col-md-6">
              <Input
                label="Official Designation"
                name="title"
                value={profileData.title}
                onChange={(e) => setProfileData({ ...profileData, title: e.target.value })}
                placeholder="e.g. Super Administrator & Managing Director"
                required
                icon={Shield}
              />
            </div>

            {/* Email Address */}
            <div className="col-12 col-md-6">
              <Input
                label="Official Email Address"
                name="email"
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                placeholder="superadmin@shubham.edu"
                required
                icon={Mail}
              />
            </div>

            {/* Phone Number */}
            <div className="col-12 col-md-6">
              <Input
                label="Contact Phone Number"
                name="phone"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                placeholder="+91 98220 12345"
                required
                icon={Phone}
              />
            </div>

            {/* Academy Campus / Office */}
            <div className="col-12 col-md-6">
              <Input
                label="Assigned Campus & Office"
                name="branch"
                value={profileData.branch}
                onChange={(e) => setProfileData({ ...profileData, branch: e.target.value })}
                placeholder="e.g. Kolhapur Main Campus"
                required
                icon={Building2}
              />
            </div>

            {/* Office Room / Floor */}
            <div className="col-12 col-md-6">
              <Input
                label="Office Location / Room"
                name="officeRoom"
                value={profileData.officeRoom}
                onChange={(e) => setProfileData({ ...profileData, officeRoom: e.target.value })}
                placeholder="e.g. Executive Suite 201"
                icon={MapPin}
              />
            </div>

            {/* Emergency Contact */}
            <div className="col-12">
              <Input
                label="Emergency Escalation Contact"
                name="emergencyContact"
                value={profileData.emergencyContact}
                onChange={(e) => setProfileData({ ...profileData, emergencyContact: e.target.value })}
                placeholder="Emergency hotline or secretary phone"
                icon={Phone}
              />
            </div>

            {/* Bio / Administrative Scope */}
            <div className="col-12">
              <label className="form-label small fw-semibold text-sa-charcoal">
                Administrative Scope & Bio
              </label>
              <textarea
                className="form-control"
                rows={3}
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                placeholder="Describe your role and administrative responsibilities..."
                style={{ fontSize: '0.88rem' }}
              />
            </div>
          </div>

          {/* Quick Avatar Preset Selection */}
          <div className="border-top pt-3">
            <span className="small fw-semibold text-sa-charcoal d-block mb-2">Or Choose from Quick Avatars:</span>
            <div className="d-flex align-items-center gap-3">
              {avatarPresets.map((preset, idx) => (
                <img
                  key={idx}
                  src={preset}
                  alt={`Preset ${idx + 1}`}
                  onClick={() => setProfileData((prev) => ({ ...prev, avatar: preset }))}
                  className={`rounded-circle object-fit-cover border cursor-pointer transition-all ${
                    profileData.avatar === preset ? 'ring-2 ring-primary border-primary' : 'opacity-75 hover:opacity-100'
                  }`}
                  style={{
                    width: '42px',
                    height: '42px',
                    cursor: 'pointer',
                    boxShadow: profileData.avatar === preset ? '0 0 0 3px var(--sa-primary)' : 'none'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="d-flex justify-content-end pt-3 border-top">
            <Button type="submit" variant="primary" icon={Save} disabled={isSaving}>
              {isSaving ? 'Saving Changes...' : 'Save Profile Changes'}
            </Button>
          </div>
        </form>
      )}

      {/* TAB 2: Security & Password */}
      {activeTab === 'security' && (
        <div className="d-flex flex-column gap-4">
          <form onSubmit={handleSavePassword} className="sa-card p-4 rounded-3 border bg-white d-flex flex-column gap-4">
            <div>
              <h6 className="fw-bold text-sa-charcoal mb-1 d-flex align-items-center gap-2">
                <Lock size={18} className="text-sa-primary" />
                Change Password
              </h6>
              <p className="text-sa-muted small m-0">Ensure your account uses a strong and unique administrative password</p>
            </div>

            <div className="row g-3">
              <div className="col-12 col-md-4">
                <Input
                  label="Current Password"
                  name="currentPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={passwords.currentPassword}
                  onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                  placeholder="••••••••"
                  required
                  icon={Key}
                />
              </div>

              <div className="col-12 col-md-4">
                <Input
                  label="New Password"
                  name="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                  placeholder="••••••••"
                  required
                  icon={Lock}
                />
              </div>

              <div className="col-12 col-md-4">
                <Input
                  label="Confirm New Password"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  required
                  icon={Lock}
                />
              </div>
            </div>

            <div className="d-flex align-items-center justify-content-between pt-2">
              <button
                type="button"
                className="btn btn-sm btn-light border text-muted d-flex align-items-center gap-1.5"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                <span>{showPassword ? 'Hide Passwords' : 'Show Passwords'}</span>
              </button>

              <Button type="submit" variant="primary" icon={Save}>
                Update Password
              </Button>
            </div>
          </form>

          {/* Two-Factor Authentication Card */}
          <div className="sa-card p-4 rounded-3 border bg-white d-flex align-items-center justify-content-between">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <Shield size={18} className="text-success" />
                <h6 className="fw-bold text-sa-charcoal m-0">Two-Factor Authentication (2FA)</h6>
                <span className="badge bg-success-subtle text-success small">Protected</span>
              </div>
              <p className="text-sa-muted small m-0">
                Requires OTP confirmation via registered mobile number upon signing in.
              </p>
            </div>

            <div className="form-check form-switch fs-5 m-0">
              <input
                className="form-check-input cursor-pointer"
                type="checkbox"
                checked={twoFactorEnabled}
                onChange={() => {
                  setTwoFactorEnabled(!twoFactorEnabled);
                  toast.info(`2FA ${!twoFactorEnabled ? 'enabled' : 'disabled'}`);
                }}
              />
            </div>
          </div>

          {/* Active Sessions */}
          <div className="sa-card p-4 rounded-3 border bg-white">
            <h6 className="fw-bold text-sa-charcoal mb-3 d-flex align-items-center gap-2">
              <Clock size={18} className="text-sa-primary" />
              Active Admin Session
            </h6>
            <div className="d-flex align-items-center justify-content-between p-3 rounded-2 bg-light border">
              <div>
                <span className="fw-bold small text-sa-charcoal d-block">Current Browser / Workstation</span>
                <span className="text-muted text-xs" style={{ fontSize: '0.78rem' }}>
                  Windows 11 • Chrome 129 • IP: 192.168.1.10 (Local Network)
                </span>
              </div>
              <span className="badge bg-success small px-2.5 py-1">Active Now</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: System & API Settings */}
      {activeTab === 'system' && (
        <form onSubmit={handleSaveSystem} className="sa-card p-4 rounded-3 border bg-white d-flex flex-column gap-4">
          <div>
            <h6 className="fw-bold text-sa-charcoal d-flex align-items-center gap-2 mb-1">
              <Server size={18} className="text-sa-primary" />
              FastAPI Backend Connection
            </h6>
            <p className="text-sa-muted small m-0">Configure microservices endpoint and authentication parameters</p>
          </div>

          <div className="row g-3">
            <div className="col-12 col-md-8">
              <Input
                label="API Endpoint URL"
                name="fastApiUrl"
                value={systemSettings.fastApiUrl}
                onChange={(e) => setSystemSettings({ ...systemSettings, fastApiUrl: e.target.value })}
                helperText="Active FastAPI microservices base URL"
                required
              />
            </div>
            <div className="col-12 col-md-4">
              <Input
                label="JWT Expiry (Minutes)"
                name="jwtExpiryMinutes"
                type="number"
                value={systemSettings.jwtExpiryMinutes}
                onChange={(e) => setSystemSettings({ ...systemSettings, jwtExpiryMinutes: e.target.value })}
                required
              />
            </div>
          </div>

          <hr className="my-1 text-muted opacity-25" />

          <div>
            <h6 className="fw-bold text-sa-charcoal d-flex align-items-center gap-2 mb-1">
              <Bell size={18} className="text-sa-primary" />
              Hardware & SMS Integrations
            </h6>
            <p className="text-sa-muted small m-0">RFID turnstiles and automated SMS notification gateways</p>
          </div>

          <div className="row g-3">
            <div className="col-12 col-md-6">
              <Input
                label="RFID Sensor Gate Gateway IP"
                name="rfidGatewayIp"
                value={systemSettings.rfidGatewayIp}
                onChange={(e) => setSystemSettings({ ...systemSettings, rfidGatewayIp: e.target.value })}
                helperText="Local hardware broker address"
                required
              />
            </div>
            <div className="col-12 col-md-6">
              <Input
                label="Parent SMS Gateway API Secret"
                name="smsGatewayKey"
                type="password"
                value={systemSettings.smsGatewayKey}
                onChange={(e) => setSystemSettings({ ...systemSettings, smsGatewayKey: e.target.value })}
                helperText="Used for automated gate-scan alerts"
                required
              />
            </div>
          </div>

          <div className="d-flex justify-content-end pt-2 border-top">
            <Button type="submit" variant="primary" icon={Save}>
              Save System Configuration
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
