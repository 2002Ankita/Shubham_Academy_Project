import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { Lock, Mail, Shield, UserCheck, GraduationCap, School } from 'lucide-react';
import { toast } from 'react-toastify';

export default function SignIn() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState('admin');
  const [email, setEmail] = useState('admin@shubham.edu');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);

  const handleRoleSelect = (role, defaultEmail) => {
    setSelectedRole(role);
    setEmail(defaultEmail);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login({ email, password, role: selectedRole });
      toast.success(`Welcome back, ${res.user.name}!`);

      if (res.user.role === 'super-admin') {
        navigate('/super-admin/dashboard');
      } else if (res.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (res.user.role === 'teacher') {
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
    <div className="sa-card p-4 p-sm-5 border-0 shadow-lg">
      {/* Official Shubham Academy 3D Logo */}
      <div className="text-center mb-3">
        <img
          src="/assets/shubham-logo.png"
          alt="Shubham Academy"
          className="img-fluid"
          style={{ maxHeight: '68px', width: 'auto', objectFit: 'contain' }}
        />
      </div>

      <div className="text-center mb-4">
        <h3 className="brand-font fw-extrabold text-sa-charcoal fs-4 mb-1">
          Welcome to Shubham Academy
        </h3>
        <p className="small text-sa-muted mb-0">
          Select your portal role and sign in to access your academy dashboard.
        </p>
      </div>

      {/* Role Selector Tabs */}
      <div className="row g-2 mb-4">
        {[
          { id: 'admin', label: 'Academy Admin', icon: School, email: 'admin@shubham.edu' },
          { id: 'teacher', label: 'Teacher', icon: UserCheck, email: 'priya.k@shubham.edu' },
          { id: 'student', label: 'Student', icon: GraduationCap, email: 'aarav.d@shubham.edu' },
          { id: 'superadmin', label: 'Super Admin', icon: Shield, email: 'superadmin@shubham.edu' },
        ].map((r) => {
          const Icon = r.icon;
          const isSelected = selectedRole === r.id;
          return (
            <div key={r.id} className="col-6">
              <button
                type="button"
                className={`btn btn-sm w-100 py-2 d-flex align-items-center justify-content-center gap-2 rounded-3 border transition-all ${
                  isSelected
                    ? 'btn-sa-primary text-white shadow-sm'
                    : 'btn-light bg-white text-sa-charcoal'
                }`}
                onClick={() => handleRoleSelect(r.id, r.email)}
              >
                <Icon size={16} />
                <span className="small fw-semibold">{r.label}</span>
              </button>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit}>
        <Input
          label="Registered Email"
          name="email"
          type="email"
          icon={Mail}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your.name@shubham.edu"
          required
        />

        <div className="d-flex align-items-center justify-content-between mb-1">
          <label className="form-label mb-0">Password</label>
          <Link to="/forgot-password" className="text-xs text-sa-primary fw-semibold" style={{ fontSize: '0.8rem' }}>
            Forgot password?
          </Link>
        </div>
        <Input
          name="password"
          type="password"
          icon={Lock}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />

        <Button
          type="submit"
          variant="primary"
          className="w-100 py-2 mt-2"
          loading={loading}
        >
          Sign In as {selectedRole.toUpperCase()}
        </Button>
      </form>

      {/* Quick Demo Credentials Info Callout */}
      <div className="mt-4 p-3 bg-sa-off-white rounded-3 border">
        <div className="d-flex align-items-center justify-content-between mb-1">
          <span className="text-xs fw-bold text-sa-charcoal" style={{ fontSize: '0.78rem' }}>Demo Quick-Login:</span>
          <span className="badge bg-success small">Ready</span>
        </div>
        <p className="text-xs text-sa-muted mb-0" style={{ fontSize: '0.76rem' }}>
          Select any tab above; credentials will auto-populate for immediate role simulation and testing.
        </p>
      </div>
    </div>
  );
}
