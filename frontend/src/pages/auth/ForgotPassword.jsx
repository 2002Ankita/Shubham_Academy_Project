import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSent(true);
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
          Password Recovery
        </h3>
        <p className="small text-sa-muted mb-0">
          Enter your registered email address and we will send a password reset verification link.
        </p>
      </div>

      {sent ? (
        <div className="alert alert-success d-flex flex-column gap-2 p-4 text-center rounded-3">
          <CheckCircle2 size={36} className="text-success mx-auto" />
          <h6 className="fw-bold m-0">Reset Link Dispatched</h6>
          <p className="small text-muted mb-2">
            A secure recovery link has been dispatched to <strong>{email}</strong>. Please check your inbox.
          </p>
          <Link to="/reset-password" className="btn btn-sm btn-sa-primary mt-2">
            Proceed to Set New Password
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <Input
            label="Academy Email Address"
            name="email"
            type="email"
            icon={Mail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. yourname@shubham.edu"
            required
          />

          <Button
            type="submit"
            variant="primary"
            className="w-100 py-2 mt-2"
            loading={loading}
          >
            Send Recovery Link
          </Button>
        </form>
      )}
    </div>
  );
}
