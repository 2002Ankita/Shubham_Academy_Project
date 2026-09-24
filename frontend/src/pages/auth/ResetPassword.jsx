import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { Lock, ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Password updated successfully! Please sign in.');
      navigate('/login');
    }, 800);
  };

  return (
    <div className="sa-card p-4 p-sm-5 border-0 shadow-lg">
      <Link to="/login" className="d-inline-flex align-items-center gap-1 small text-sa-muted mb-3 fw-medium">
        <ArrowLeft size={16} /> Back to Sign In
      </Link>

      <div className="text-center mb-3">
        <img
          src="/assets/shubham-logo.png"
          alt="Shubham Academy"
          style={{ maxHeight: '54px', width: 'auto' }}
        />
      </div>

      <div className="text-start mb-4">
        <h3 className="brand-font fw-extrabold text-sa-charcoal fs-4 mb-1">
          Set New Password
        </h3>
        <p className="small text-sa-muted mb-0">
          Create a new strong password for your Shubham Academy account.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Input
          label="New Password"
          name="password"
          type="password"
          icon={Lock}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />

        <Input
          label="Confirm New Password"
          name="confirmPassword"
          type="password"
          icon={Lock}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
          required
        />

        <Button
          type="submit"
          variant="primary"
          className="w-100 py-2 mt-2"
          loading={loading}
        >
          Reset Password
        </Button>
      </form>
    </div>
  );
}
