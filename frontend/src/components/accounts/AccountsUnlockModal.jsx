import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, ShieldCheck, Building, KeyRound, AlertTriangle, X } from 'lucide-react';
import { useAccountsAuth } from '../../context/AccountsAuthContext';
import { BRANCH_TARABAI, BRANCH_MANGALWAR } from '../../config/branchBatchConfig';

export default function AccountsUnlockModal() {
  const {
    isUnlockModalOpen,
    closeAccountsModal,
    unlockAccounts,
    modalBranch,
    targetRoute
  } = useAccountsAuth();

  const navigate = useNavigate();

  const [selectedBranch, setSelectedBranch] = useState(modalBranch || BRANCH_TARABAI);
  const [accountsId, setAccountsId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (modalBranch) {
      setSelectedBranch(modalBranch);
      // Auto-suggest the corresponding branch accounts ID
      if (modalBranch.toLowerCase().includes('mangal')) {
        setAccountsId('accounts.mangalvar');
      } else {
        setAccountsId('accounts.tarabai');
      }
    }
  }, [modalBranch, isUnlockModalOpen]);

  if (!isUnlockModalOpen) return null;

  const handleBranchSwitch = (b) => {
    setSelectedBranch(b);
    setErrorMsg('');
    if (b.toLowerCase().includes('mangal')) {
      setAccountsId('accounts.mangalvar');
    } else {
      setAccountsId('accounts.tarabai');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!accountsId.trim() || !password.trim()) {
      setErrorMsg('Please enter both Accounts ID and Password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const res = await unlockAccounts(accountsId.trim(), password.trim(), selectedBranch);
    setLoading(false);

    if (res.success) {
      if (targetRoute) {
        navigate(targetRoute);
      }
    } else {
      setErrorMsg(res.message || 'Invalid Accounts ID or Password.');
    }
  };

  return (
    <div
      className="modal show d-block"
      style={{
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(5px)',
        zIndex: 1060
      }}
      tabIndex="-1"
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '500px' }}>
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          {/* Header */}
          <div
            className="p-3.5 d-flex align-items-center justify-content-between text-white"
            style={{
              backgroundColor: '#8B1216',
              background: 'linear-gradient(135deg, #8B1216 0%, #5E0C0F 100%)'
            }}
          >
            <div className="d-flex align-items-center gap-2.5">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center bg-white bg-opacity-20 text-white"
                style={{ width: '38px', height: '38px' }}
              >
                <Lock size={20} />
              </div>
              <div>
                <h6 className="m-0 fw-bold text-white" style={{ fontSize: '15px' }}>
                  Accounts & Financials Security Gate
                </h6>
                <span className="small text-white-50" style={{ fontSize: '11.5px' }}>
                  Restricted Access • Fees Counter & Faculty Payroll
                </span>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-link text-white-50 text-decoration-none p-1"
              onClick={closeAccountsModal}
              title="Close"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4">
              {/* Security Context Notice */}
              <div
                className="p-3 rounded-3 mb-3 border"
                style={{ backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }}
              >
                <div className="d-flex gap-2">
                  <AlertTriangle size={18} className="text-warning flex-shrink-0 mt-0.5" />
                  <div className="small text-sa-charcoal" style={{ fontSize: '11.5px', lineHeight: 1.45 }}>
                    <strong>Confidential Financial Module:</strong> Fees collection figures and teacher salaries are restricted from general faculty viewing. Enter the <strong>Accounts ID & Password</strong> for this branch or use Super Admin credentials.
                  </div>
                </div>
              </div>

              {/* Branch Selector Switch */}
              <div className="mb-3">
                <label className="form-label small fw-semibold text-sa-charcoal mb-1 d-flex align-items-center gap-1.5">
                  <Building size={14} className="text-sa-primary" />
                  Select Campus / Branch:
                </label>
                <div className="btn-group w-100" role="group">
                  <button
                    type="button"
                    onClick={() => handleBranchSwitch(BRANCH_TARABAI)}
                    className="btn btn-sm py-2 fw-semibold"
                    style={{
                      backgroundColor: selectedBranch === BRANCH_TARABAI ? '#8B1216' : '#F8FAFC',
                      color: selectedBranch === BRANCH_TARABAI ? '#FFFFFF' : '#475569',
                      border: '1px solid #CBD5E1',
                      fontSize: '12px'
                    }}
                  >
                    🌲 Tarabai Park Campus
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBranchSwitch(BRANCH_MANGALWAR)}
                    className="btn btn-sm py-2 fw-semibold"
                    style={{
                      backgroundColor: selectedBranch === BRANCH_MANGALWAR ? '#8B1216' : '#F8FAFC',
                      color: selectedBranch === BRANCH_MANGALWAR ? '#FFFFFF' : '#475569',
                      border: '1px solid #CBD5E1',
                      fontSize: '12px'
                    }}
                  >
                    🏛️ Mangalvar Peth Campus
                  </button>
                </div>
              </div>

              {/* Accounts ID */}
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label className="form-label small fw-semibold text-sa-charcoal m-0">
                    Accounts User ID <span className="text-danger">*</span>
                  </label>
                  <span className="text-muted" style={{ fontSize: '11px' }}>
                    Branch ID or Superadmin
                  </span>
                </div>
                <div className="input-group">
                  <span className="input-group-text bg-light text-muted" style={{ height: '38px' }}>
                    <ShieldCheck size={16} />
                  </span>
                  <input
                    type="text"
                    value={accountsId}
                    onChange={(e) => {
                      setAccountsId(e.target.value);
                      setErrorMsg('');
                    }}
                    placeholder={
                      selectedBranch === BRANCH_MANGALWAR
                        ? 'e.g., accounts.mangalvar'
                        : 'e.g., accounts.tarabai'
                    }
                    className="form-control"
                    style={{ height: '38px', fontSize: '13.5px' }}
                    autoFocus
                    required
                  />
                </div>
              </div>

              {/* Accounts Password */}
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label className="form-label small fw-semibold text-sa-charcoal m-0">
                    Accounts Password <span className="text-danger">*</span>
                  </label>
                </div>
                <div className="input-group">
                  <span className="input-group-text bg-light text-muted" style={{ height: '38px' }}>
                    <KeyRound size={16} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrorMsg('');
                    }}
                    placeholder="Enter Accounts Password"
                    className="form-control"
                    style={{ height: '38px', fontSize: '13.5px' }}
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                    title={showPassword ? 'Hide Password' : 'Show Password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="alert alert-danger p-2 small mb-3 text-center" style={{ fontSize: '12px' }}>
                  {errorMsg}
                </div>
              )}

              {/* Quick Fill Pills for Admin Convenience */}
              <div className="p-2.5 rounded-3 bg-light border mb-2">
                <span className="d-block small text-muted mb-1.5" style={{ fontSize: '11px', fontWeight: 600 }}>
                  Quick Fill Authorized Credentials:
                </span>
                <div className="d-flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBranch(BRANCH_TARABAI);
                      setAccountsId('accounts.tarabai');
                      setPassword('Tarabai@123');
                      setErrorMsg('');
                    }}
                    className="btn btn-xs btn-outline-secondary py-0.5 px-2 rounded-pill"
                    style={{ fontSize: '10.5px' }}
                  >
                    Tarabai Park (Tarabai@123)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBranch(BRANCH_MANGALWAR);
                      setAccountsId('accounts.mangalvar');
                      setPassword('Mangalvar@123');
                      setErrorMsg('');
                    }}
                    className="btn btn-xs btn-outline-secondary py-0.5 px-2 rounded-pill"
                    style={{ fontSize: '10.5px' }}
                  >
                    Mangalvar Peth (Mangalvar@123)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAccountsId('superadmin@shubham.edu');
                      setPassword('password123');
                      setErrorMsg('');
                    }}
                    className="btn btn-xs btn-outline-primary py-0.5 px-2 rounded-pill"
                    style={{ fontSize: '10.5px' }}
                  >
                    Super Admin Master
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer bg-light p-3 d-flex justify-content-between">
              <button
                type="button"
                className="btn btn-outline-secondary px-3"
                onClick={closeAccountsModal}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn text-white px-4 fw-semibold d-inline-flex align-items-center gap-2"
                style={{ backgroundColor: '#8B1216', borderColor: '#8B1216' }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <Lock size={15} />
                    <span>Unlock Accounts Section</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
