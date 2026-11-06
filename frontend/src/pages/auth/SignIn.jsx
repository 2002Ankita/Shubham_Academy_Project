import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  GraduationCap,
  UserCog,
  Presentation,
  Users,
  LogIn,
  ShieldCheck
} from 'lucide-react';
import { toast } from 'react-toastify';

export default function SignIn() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const roles = [
    { id: 'admin', label: 'Academy Admin', icon: UserCog, defaultEmail: 'admin@shubham.edu', defaultPwd: 'password123' },
    { id: 'teacher', label: 'Teacher', icon: Presentation, defaultEmail: 'priya.k@shubham.edu', defaultPwd: 'password123' },
    { id: 'student', label: 'Student', icon: Users, defaultEmail: 'aarav.d@shubham.edu', defaultPwd: '9876500001' },
  ];

  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
    const r = roles.find(item => item.id === roleId);
    if (r) {
      setEmail(r.defaultEmail);
      setPassword(r.defaultPwd);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login({ email, password, role: selectedRole });
      toast.success(`Welcome back, ${res.user?.name || res.user?.full_name || 'User'}!`);

      const userRole = (res.user?.role || '').toLowerCase();
      if (userRole === 'super-admin' || userRole === 'super_admin') {
        navigate('/super-admin/dashboard');
      } else if (userRole === 'admin') {
        navigate('/admin/dashboard');
      } else if (userRole === 'teacher') {
        navigate('/teacher/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err) {
      toast.error('Authentication failed: ' + (err.message || 'Please check credentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-100 py-0">
      {/* Top Pill Badge: ACADEMY PORTAL */}
      <div className="text-center mb-2.5">
        <div
          className="d-inline-flex align-items-center gap-1.5 px-3 py-1 rounded-pill"
          style={{
            backgroundColor: '#FDECEB',
            color: '#8B1216',
            fontSize: '0.74rem',
            fontWeight: '700',
            letterSpacing: '0.04em'
          }}
        >
          <GraduationCap size={15} color="#8B1216" />
          <span>ACADEMY PORTAL</span>
        </div>
      </div>

      {/* Main Title & Subtitle */}
      <div className="text-center mb-3">
        <h2
          className="fw-bold mb-1"
          style={{
            fontSize: '1.65rem',
            letterSpacing: '-0.02em',
            color: '#111827'
          }}
        >
          Welcome Back
        </h2>
        <p className="text-muted small mb-0" style={{ fontSize: '0.84rem' }}>
          Sign in to continue to your dashboard.
        </p>
      </div>

      {/* Role Selector: Sign in as */}
      <div className="mb-3">
        <label
          className="form-label d-block text-start mb-2 fw-semibold"
          style={{ fontSize: '0.80rem', color: '#374151' }}
        >
          Sign in as
        </label>
        <div className="row g-2">
          {roles.map((r) => {
            const Icon = r.icon;
            const isSelected = selectedRole === r.id;
            return (
              <div key={r.id} className="col-4">
                <button
                  type="button"
                  className="btn w-100 d-flex flex-column align-items-center justify-content-center p-2 rounded-3 transition-all"
                  style={{
                    backgroundColor: isSelected ? '#FDF2F2' : '#FFFFFF',
                    border: isSelected ? '1.5px solid #8B1216' : '1px solid #E5E7EB',
                    color: isSelected ? '#8B1216' : '#4B5563',
                    borderRadius: '10px',
                    minHeight: '62px',
                    boxShadow: isSelected ? '0 2px 8px rgba(139, 18, 22, 0.08)' : 'none'
                  }}
                  onClick={() => handleRoleSelect(r.id)}
                >
                  <Icon
                    size={20}
                    className="mb-1"
                    color={isSelected ? '#8B1216' : '#6B7280'}
                  />
                  <span
                    className="w-100 text-center d-block px-0.5"
                    style={{
                      fontSize: '0.74rem',
                      fontWeight: isSelected ? '700' : '500',
                      lineHeight: 1.2
                    }}
                  >
                    {r.label}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Login Form */}
      <form onSubmit={handleSubmit}>
        {/* Email Field */}
        <div className="text-start mb-3">
          <label
            htmlFor="email"
            className="form-label mb-1.5 fw-semibold"
            style={{ fontSize: '0.80rem', color: '#374151' }}
          >
            Email Address
          </label>
          <div className="position-relative">
            <span
              className="position-absolute top-50 start-0 translate-middle-y ps-3 text-muted"
              style={{ pointerEvents: 'none' }}
            >
              <Mail size={16} color="#9CA3AF" />
            </span>
            <input
              id="email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="form-control"
              style={{
                paddingLeft: '38px',
                height: '42px',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                fontSize: '0.88rem'
              }}
            />
          </div>
        </div>

        {/* Password Field with Eye Toggle */}
        <div className="text-start mb-2.5">
          <label
            htmlFor="password"
            className="form-label mb-1.5 fw-semibold"
            style={{ fontSize: '0.80rem', color: '#374151' }}
          >
            Password
          </label>
          <div className="position-relative">
            <span
              className="position-absolute top-50 start-0 translate-middle-y ps-3 text-muted"
              style={{ pointerEvents: 'none' }}
            >
              <Lock size={16} color="#9CA3AF" />
            </span>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••"
              required
              className="form-control"
              style={{
                paddingLeft: '38px',
                paddingRight: '38px',
                height: '42px',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                fontSize: '0.88rem',
                backgroundColor: '#FFFFFF'
              }}
            />
            <button
              type="button"
              className="btn btn-link position-absolute top-50 end-0 translate-middle-y pe-2.5 text-muted p-0"
              style={{ textDecoration: 'none' }}
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} color="#6B7280" /> : <Eye size={16} color="#9CA3AF" />}
            </button>
          </div>
        </div>

        {/* Remember Me & Forgot Password Row */}
        <div className="d-flex align-items-center justify-content-between mb-3 pt-0.5">
          <div className="form-check d-flex align-items-center mb-0">
            <input
              className="form-check-input mt-0"
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{ cursor: 'pointer', accentColor: '#8B1216' }}
            />
            <label
              className="form-check-label text-muted ms-2"
              htmlFor="rememberMe"
              style={{ cursor: 'pointer', fontSize: '0.80rem' }}
            >
              Remember me
            </label>
          </div>
          <Link
            to="/forgot-password"
            className="text-decoration-none fw-semibold"
            style={{ color: '#8B1216', fontSize: '0.80rem' }}
          >
            Forgot Password?
          </Link>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="btn w-100 d-flex align-items-center justify-content-center gap-2 text-white fw-bold shadow-sm transition-all"
          style={{
            backgroundColor: '#7A1217',
            borderRadius: '8px',
            height: '44px',
            fontSize: '0.94rem'
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#640E12')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#7A1217')}
        >
          {loading ? (
            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
          ) : (
            <>
              <LogIn size={18} strokeWidth={2.2} />
              <span>Sign In</span>
            </>
          )}
        </button>
      </form>

      {/* New student / Registration prompt */}
      <div className="text-center mt-3">
        <span className="text-muted small" style={{ fontSize: '0.78rem' }}>
          New student?{' '}
        </span>
        <Link
          to="/register"
          className="text-decoration-none fw-bold"
          style={{ color: '#8B1216', fontSize: '0.78rem' }}
        >
          Contact the academy office
        </Link>
        <span className="text-muted small" style={{ fontSize: '0.78rem' }}>
          {' '}for registration.
        </span>
      </div>

      {/* Security Note Divider & Badge */}
      <div className="mt-3 pt-2 border-top text-center">
        <div
          className="d-inline-flex align-items-center justify-content-center gap-1.5 fw-medium"
          style={{ color: '#16A34A', fontSize: '0.76rem' }}
        >
          <ShieldCheck size={15} />
          <span>Your information is safe and secure</span>
        </div>
      </div>
    </div>
  );
}
