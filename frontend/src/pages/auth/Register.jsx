import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Lock,
  Mail,
  User,
  Phone,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  GraduationCap,
  ShieldCheck
} from 'lucide-react';
import { toast } from 'react-toastify';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    course: '11th & 12th Science (PCB/PCM)',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (formData.phone.length < 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setRegistered(true);
      toast.success('Registration successful! Welcome to Shubham Academy.');
    }, 700);
  };

  return (
    <div className="w-100 py-0">
      <Link
        to="/login"
        className="d-inline-flex align-items-center gap-1 small text-muted mb-1.5 fw-medium text-decoration-none"
        style={{ fontSize: '0.78rem' }}
      >
        <ArrowLeft size={14} /> Back to Sign In
      </Link>

      {/* Top Pill Badge: ADMISSION PORTAL */}
      <div className="text-center mb-1.5">
        <div
          className="d-inline-flex align-items-center gap-1 px-2.5 py-0.5 rounded-pill"
          style={{
            backgroundColor: '#FDF0F0',
            color: '#8B1216',
            fontSize: '0.72rem',
            fontWeight: '700',
            letterSpacing: '0.04em'
          }}
        >
          <GraduationCap size={13} color="#8B1216" />
          <span>STUDENT REGISTRATION</span>
        </div>
      </div>

      {/* Main Title & Subtitle */}
      <div className="text-center mb-2">
        <h2
          className="fw-bold mb-0.5"
          style={{
            fontSize: '1.38rem',
            letterSpacing: '-0.02em',
            color: '#1A1A1A'
          }}
        >
          Begin Your Journey
        </h2>
        <p className="text-muted small mb-0" style={{ fontSize: '0.78rem' }}>
          Create your account for lectures, notes, and academic tests.
        </p>
      </div>

      {registered ? (
        <div className="alert alert-success d-flex flex-column gap-2 p-3 text-center rounded-3 border-0 my-3" style={{ backgroundColor: '#F0FDF4' }}>
          <CheckCircle2 size={36} className="text-success mx-auto" />
          <h6 className="fw-bold m-0 text-success">Registration Successful!</h6>
          <p className="small text-muted mb-2" style={{ fontSize: '0.80rem' }}>
            Welcome aboard, <strong>{formData.fullName}</strong>. You can now sign in with your email.
          </p>
          <button
            type="button"
            className="btn w-100 py-2 text-white fw-bold shadow-sm"
            style={{ backgroundColor: '#8B1216', borderRadius: '8px', fontSize: '0.88rem' }}
            onClick={() => navigate('/login')}
          >
            Proceed to Sign In
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {/* Full Name */}
          <div className="mb-2 text-start">
            <label className="form-label mb-1 fw-semibold" style={{ fontSize: '0.76rem', color: '#1F2937' }}>
              Full Name
            </label>
            <div className="position-relative">
              <span className="position-absolute top-50 start-0 translate-middle-y ps-3 text-muted" style={{ pointerEvents: 'none' }}>
                <User size={15} color="#9CA3AF" />
              </span>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="e.g. Aarav Patil"
                required
                className="form-control"
                style={{
                  paddingLeft: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB',
                  fontSize: '0.84rem'
                }}
              />
            </div>
          </div>

          {/* Email & Phone */}
          <div className="row g-2 mb-2 text-start">
            <div className="col-12 col-sm-6">
              <label className="form-label mb-1 fw-semibold" style={{ fontSize: '0.76rem', color: '#1F2937' }}>
                Email Address
              </label>
              <div className="position-relative">
                <span className="position-absolute top-50 start-0 translate-middle-y ps-2.5 text-muted" style={{ pointerEvents: 'none' }}>
                  <Mail size={15} color="#9CA3AF" />
                </span>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@email.com"
                  required
                  className="form-control"
                  style={{
                    paddingLeft: '32px',
                    height: '36px',
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB',
                    fontSize: '0.82rem'
                  }}
                />
              </div>
            </div>
            <div className="col-12 col-sm-6">
              <label className="form-label mb-1 fw-semibold" style={{ fontSize: '0.76rem', color: '#1F2937' }}>
                Mobile Number
              </label>
              <div className="position-relative">
                <span className="position-absolute top-50 start-0 translate-middle-y ps-2.5 text-muted" style={{ pointerEvents: 'none' }}>
                  <Phone size={15} color="#9CA3AF" />
                </span>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="9822001122"
                  required
                  className="form-control"
                  style={{
                    paddingLeft: '32px',
                    height: '36px',
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB',
                    fontSize: '0.82rem'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Course Program */}
          <div className="mb-2 text-start">
            <label className="form-label mb-1 fw-semibold" style={{ fontSize: '0.76rem', color: '#1F2937' }}>
              Academic Stream / Program
            </label>
            <div className="position-relative">
              <span className="position-absolute top-50 start-0 translate-middle-y ps-3 text-muted" style={{ pointerEvents: 'none' }}>
                <BookOpen size={15} color="#9CA3AF" />
              </span>
              <select
                name="course"
                value={formData.course}
                onChange={handleChange}
                className="form-select"
                style={{
                  paddingLeft: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB',
                  fontSize: '0.82rem'
                }}
                required
              >
                <option value="11th & 12th Science (PCB/PCM)">11th & 12th Science (PCB/PCM)</option>
                <option value="MHT-CET Specialized Batch">MHT-CET Specialized Batch</option>
                <option value="JEE Advanced Foundation">JEE Advanced Foundation</option>
                <option value="NEET Medical Prep">NEET Medical Prep</option>
                <option value="Commerce & Accounts Elite">Commerce & Accounts Elite</option>
              </select>
            </div>
          </div>

          {/* Password & Confirm */}
          <div className="row g-2 mb-3 text-start">
            <div className="col-12 col-sm-6">
              <label className="form-label mb-1 fw-semibold" style={{ fontSize: '0.76rem', color: '#1F2937' }}>
                Password
              </label>
              <div className="position-relative">
                <span className="position-absolute top-50 start-0 translate-middle-y ps-2.5 text-muted" style={{ pointerEvents: 'none' }}>
                  <Lock size={15} color="#9CA3AF" />
                </span>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="form-control"
                  style={{
                    paddingLeft: '32px',
                    height: '36px',
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB',
                    fontSize: '0.82rem'
                  }}
                />
              </div>
            </div>
            <div className="col-12 col-sm-6">
              <label className="form-label mb-1 fw-semibold" style={{ fontSize: '0.76rem', color: '#1F2937' }}>
                Confirm Password
              </label>
              <div className="position-relative">
                <span className="position-absolute top-50 start-0 translate-middle-y ps-2.5 text-muted" style={{ pointerEvents: 'none' }}>
                  <Lock size={15} color="#9CA3AF" />
                </span>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="form-control"
                  style={{
                    paddingLeft: '32px',
                    height: '36px',
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB',
                    fontSize: '0.82rem'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="btn w-100 d-flex align-items-center justify-content-center gap-2 text-white fw-bold shadow-sm transition-all"
            style={{
              backgroundColor: '#8B1216',
              borderRadius: '8px',
              height: '38px',
              fontSize: '0.90rem'
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#700E12')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#8B1216')}
          >
            {loading ? (
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
            ) : (
              <>
                <ArrowRight size={16} strokeWidth={2.5} />
                <span>Complete Registration</span>
              </>
            )}
          </button>

          <div className="text-center mt-2 pt-1 border-top">
            <span className="text-muted" style={{ fontSize: '0.76rem' }}>
              Already have an account?{' '}
            </span>
            <Link to="/login" className="text-decoration-none fw-bold" style={{ color: '#8B1216', fontSize: '0.76rem' }}>
              Sign In
            </Link>
          </div>
        </form>
      )}

      {/* Security Note Divider & Badge */}
      <div className="mt-2 pt-1.5 border-top text-center">
        <div
          className="d-inline-flex align-items-center justify-content-center gap-1.5 fw-medium"
          style={{ color: '#16A34A', fontSize: '0.74rem' }}
        >
          <ShieldCheck size={14} />
          <span>Your information is safe and secure</span>
        </div>
      </div>
    </div>
  );
}
