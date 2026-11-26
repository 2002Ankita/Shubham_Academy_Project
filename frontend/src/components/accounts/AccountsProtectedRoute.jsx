import React from 'react';
import { useAccountsAuth } from '../../context/AccountsAuthContext';
import { Lock, ShieldCheck, KeyRound, ArrowRight } from 'lucide-react';

export default function AccountsProtectedRoute({ children }) {
  const { isAccountsUnlocked, openAccountsModal, unlockedBranch } = useAccountsAuth();

  if (isAccountsUnlocked) {
    return <>{children}</>;
  }

  return (
    <div className="container-fluid py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden text-center p-4 p-md-5">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
              style={{ width: '64px', height: '64px', backgroundColor: '#FDF0F0', color: '#8B1216' }}
            >
              <Lock size={32} />
            </div>

            <h4 className="fw-bold text-sa-charcoal mb-2">Accounts & Financials Locked</h4>
            <p className="text-muted small mb-4" style={{ maxWidth: '440px', margin: '0 auto' }}>
              Fees collection data and teacher salary payroll are confidential. To view actual collection records or manage teacher salaries, please unlock this section with your branch Accounts ID & Password.
            </p>

            <div
              className="p-3 rounded-3 border mb-4 text-start small mx-auto"
              style={{ maxWidth: '440px', backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }}
            >
              <div className="d-flex align-items-center gap-2 mb-1.5 fw-semibold text-sa-charcoal">
                <ShieldCheck size={16} className="text-sa-primary" />
                <span>Authorized Credentials:</span>
              </div>
              <ul className="m-0 ps-3 text-muted" style={{ fontSize: '12px' }}>
                <li><strong>Tarabai Park:</strong> ID <code>accounts.tarabai</code></li>
                <li><strong>Mangalvar Peth:</strong> ID <code>accounts.mangalvar</code></li>
                <li><strong>Super Admin:</strong> ID <code>superadmin@shubham.edu</code> (Master access)</li>
              </ul>
            </div>

            <div>
              <button
                type="button"
                onClick={() => openAccountsModal()}
                className="btn text-white px-4 py-2.5 rounded-3 fw-semibold d-inline-flex align-items-center gap-2 shadow-sm transition-all"
                style={{ backgroundColor: '#8B1216', borderColor: '#8B1216' }}
              >
                <KeyRound size={18} />
                <span>Enter Accounts ID & Password</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
