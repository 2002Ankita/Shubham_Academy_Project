import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  IndianRupee,
  Lock,
  Unlock,
  ShieldCheck,
  Building,
  Calendar,
  Users,
  CreditCard,
  TrendingUp,
  AlertCircle,
  FileText,
  Clock,
  ArrowUpRight,
  RefreshCw,
  Send,
  Eye,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useAccountsAuth } from '../../context/AccountsAuthContext';
import { getUserBranch } from '../../utils/branchUtils';
import accountsService from '../../services/accountsService';
import salaryService from '../../services/salaryService';
import { BRANCH_TARABAI, BRANCH_MANGALWAR, normalizeBranch } from '../../config/branchBatchConfig';

export default function Accounts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    isAccountsUnlocked,
    unlockedBranch,
    lockAccounts,
    isSuperAdmin
  } = useAccountsAuth();

  const userBranch = getUserBranch(user) || BRANCH_TARABAI;
  const [activeBranch, setActiveBranch] = useState(unlockedBranch || userBranch);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    return new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
  });

  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState(null);
  const [salaryList, setSalaryList] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'fees' | 'salary' | 'security'

  // Load accounts summary
  const loadAccountsData = async () => {
    setLoading(true);
    try {
      const summary = await accountsService.getSummary(activeBranch, selectedMonth);
      setSummaryData(summary);

      const salaries = await salaryService.getAll({ month: selectedMonth });
      setSalaryList(salaries || []);
    } catch (err) {
      console.error('Failed to load accounts summary:', err);
      toast.error('Could not load accounts data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAccountsUnlocked) {
      loadAccountsData();
    }
  }, [activeBranch, selectedMonth, isAccountsUnlocked]);

  const handleDisburseClick = async (salaryId, amount) => {
    try {
      await salaryService.disburseSalary(salaryId, amount);
      toast.success('Salary successfully disbursed! Notification sent to Super Admin.');
      loadAccountsData();
    } catch (err) {
      toast.error('Failed to disburse salary.');
    }
  };

  const fees = summaryData?.fees_counter || {
    total_expected: 0,
    total_collected: 0,
    total_pending: 0,
    overdue_students_count: 0,
    collection_rate_percent: 0
  };

  const salary = summaryData?.salary_counter || {
    total_liability: 0,
    total_disbursed: 0,
    total_pending: 0,
    faculty_count: 0,
    disbursed_count: 0,
    disbursement_rate_percent: 0
  };

  return (
    <div className="container-fluid p-3 p-md-4">
      {/* Top Header Card */}
      <div
        className="rounded-4 p-4 text-white mb-4 shadow-sm position-relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #8B1216 0%, #4A080A 100%)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 position-relative z-1">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span
                className="badge d-inline-flex align-items-center gap-1.5 py-1 px-2.5 rounded-pill"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)', fontSize: '11.5px', fontWeight: 600 }}
              >
                <Unlock size={12} className="text-warning" />
                Accounts Session Unlocked
              </span>
              <span
                className="badge py-1 px-2.5 rounded-pill"
                style={{ backgroundColor: 'rgba(255,255,255,0.15)', fontSize: '11.5px' }}
              >
                {activeBranch}
              </span>
            </div>
            <h3 className="fw-bold m-0 text-white">Accounts & Financials</h3>
            <span className="text-white-50 small">
              Monthly Fees Counter, Fee Recovery, and Teacher Salary Payroll
            </span>
          </div>

          <div className="d-flex flex-wrap align-items-center gap-2">
            {/* Campus Switcher for Superadmin */}
            {isSuperAdmin && (
              <select
                value={activeBranch}
                onChange={(e) => setActiveBranch(e.target.value)}
                className="form-select form-select-sm bg-white text-dark border-0 fw-semibold"
                style={{ height: '36px', minWidth: '170px' }}
              >
                <option value={BRANCH_MANGALWAR}>🏛️ Mangalvar Peth</option>
                <option value={BRANCH_TARABAI}>🌲 Tarabai Park</option>
              </select>
            )}

            {/* Refresh Button */}
            <button
              onClick={loadAccountsData}
              disabled={loading}
              className="btn btn-sm btn-outline-light d-inline-flex align-items-center gap-1.5"
              style={{ height: '36px' }}
              title="Refresh Accounts Data"
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
              <span>Refresh</span>
            </button>

            {/* Lock Accounts Session Button */}
            <button
              onClick={lockAccounts}
              className="btn btn-sm btn-light fw-bold text-danger d-inline-flex align-items-center gap-1.5 shadow-sm"
              style={{ height: '36px' }}
              title="Lock Accounts Session"
            >
              <Lock size={14} />
              <span>Lock Accounts</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="row g-3 mb-4">
        {/* 1. Monthly Fees Collected */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card h-100 border-0 shadow-sm rounded-3 p-3 bg-white">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="small text-muted fw-semibold">Monthly Fees Counter (Collected)</span>
              <div
                className="rounded-circle d-flex align-items-center justify-content-center text-success"
                style={{ width: '36px', height: '36px', backgroundColor: '#ECFDF5' }}
              >
                <IndianRupee size={18} />
              </div>
            </div>
            <h4 className="fw-bold mb-1 text-success">
              ₹{Number(fees.total_collected || 0).toLocaleString('en-IN')}
            </h4>
            <div className="d-flex align-items-center justify-content-between small text-muted mt-auto pt-2 border-top">
              <span>Expected: ₹{Number(fees.total_expected || 0).toLocaleString('en-IN')}</span>
              <span className="badge bg-success bg-opacity-10 text-success fw-bold">
                {fees.collection_rate_percent}%
              </span>
            </div>
          </div>
        </div>

        {/* 2. Total Pending Dues (Recovery) */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card h-100 border-0 shadow-sm rounded-3 p-3 bg-white">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="small text-muted fw-semibold">Pending Dues (Recovery)</span>
              <div
                className="rounded-circle d-flex align-items-center justify-content-center text-danger"
                style={{ width: '36px', height: '36px', backgroundColor: '#FEF2F2' }}
              >
                <AlertCircle size={18} />
              </div>
            </div>
            <h4 className="fw-bold mb-1 text-danger">
              ₹{Number(fees.total_pending || 0).toLocaleString('en-IN')}
            </h4>
            <div className="d-flex align-items-center justify-content-between small text-muted mt-auto pt-2 border-top">
              <span>{fees.overdue_students_count} Overdue Accounts</span>
              <button
                type="button"
                onClick={() => navigate('/admin/fees/pending')}
                className="btn btn-link p-0 text-decoration-none small text-danger fw-semibold"
                style={{ fontSize: '11px' }}
              >
                Message Parents →
              </button>
            </div>
          </div>
        </div>

        {/* 3. Faculty Payroll Liability */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card h-100 border-0 shadow-sm rounded-3 p-3 bg-white">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="small text-muted fw-semibold">Faculty Salary Liability</span>
              <div
                className="rounded-circle d-flex align-items-center justify-content-center text-primary"
                style={{ width: '36px', height: '36px', backgroundColor: '#EFF6FF' }}
              >
                <Users size={18} />
              </div>
            </div>
            <h4 className="fw-bold mb-1 text-sa-charcoal">
              ₹{Number(salary.total_liability || 0).toLocaleString('en-IN')}
            </h4>
            <div className="d-flex align-items-center justify-content-between small text-muted mt-auto pt-2 border-top">
              <span>{salary.faculty_count} Active Teachers</span>
              <span className="text-muted" style={{ fontSize: '11px' }}>{selectedMonth}</span>
            </div>
          </div>
        </div>

        {/* 4. Salary Disbursed */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card h-100 border-0 shadow-sm rounded-3 p-3 bg-white">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="small text-muted fw-semibold">Salary Disbursed</span>
              <div
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: '36px', height: '36px', backgroundColor: '#FAF5FF', color: '#7E22CE' }}
              >
                <CreditCard size={18} />
              </div>
            </div>
            <h4 className="fw-bold mb-1" style={{ color: '#7E22CE' }}>
              ₹{Number(salary.total_disbursed || 0).toLocaleString('en-IN')}
            </h4>
            <div className="d-flex align-items-center justify-content-between small text-muted mt-auto pt-2 border-top">
              <span>{salary.disbursed_count} of {salary.faculty_count} Disbursed</span>
              <span className="badge text-white fw-bold" style={{ backgroundColor: '#7E22CE' }}>
                {salary.disbursement_rate_percent}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="card border-0 shadow-sm rounded-4 mb-4">
        <div className="card-header bg-white border-bottom p-2 d-flex flex-wrap gap-2">
          {[
            { id: 'overview', label: '📊 Financial Summary & Actions', icon: TrendingUp },
            { id: 'fees', label: '💰 Fees Counter & Collections', icon: IndianRupee },
            { id: 'salary', label: '👨‍🏫 Teacher Salary Register', icon: Users },
            { id: 'security', label: '🔒 Accounts Credentials & Access', icon: ShieldCheck }
          ].map(tab => {
            const Icon = tab.icon;
            const isTabActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`btn btn-sm d-inline-flex align-items-center gap-1.5 py-2 px-3 rounded-3 fw-semibold transition-all ${
                  isTabActive
                    ? 'text-white'
                    : 'btn-light text-sa-charcoal'
                }`}
                style={{
                  backgroundColor: isTabActive ? '#8B1216' : undefined,
                  fontSize: '12.5px'
                }}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="card-body p-4">
          {/* TAB 1: Financial Overview */}
          {activeTab === 'overview' && (
            <div className="row g-4">
              <div className="col-12 col-lg-6">
                <div className="p-3.5 rounded-3 border bg-light h-100">
                  <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                    <h6 className="fw-bold m-0 text-sa-charcoal d-flex align-items-center gap-2">
                      <IndianRupee size={16} className="text-success" />
                      Fees Collection Actions
                    </h6>
                    <button
                      onClick={() => navigate('/admin/fees')}
                      className="btn btn-sm text-white px-2.5 py-1"
                      style={{ backgroundColor: '#8B1216', fontSize: '11px' }}
                    >
                      Open Full Counter →
                    </button>
                  </div>
                  <ul className="list-unstyled mb-0 d-flex flex-column gap-2.5 small">
                    <li className="d-flex justify-content-between align-items-center p-2 rounded bg-white border">
                      <span>Total Fees Collected (Bank / Cash)</span>
                      <strong className="text-success">₹{Number(fees.total_collected || 0).toLocaleString('en-IN')}</strong>
                    </li>
                    <li className="d-flex justify-content-between align-items-center p-2 rounded bg-white border">
                      <span>Pending Fee Dues</span>
                      <strong className="text-danger">₹{Number(fees.total_pending || 0).toLocaleString('en-IN')}</strong>
                    </li>
                    <li className="d-flex justify-content-between align-items-center p-2 rounded bg-white border">
                      <span>Defaulter Recovery Status</span>
                      <button
                        onClick={() => navigate('/admin/fees/pending')}
                        className="btn btn-sm btn-outline-danger py-0.5 px-2"
                        style={{ fontSize: '11px' }}
                      >
                        Send Recovery Alerts
                      </button>
                    </li>
                    <li className="d-flex justify-content-between align-items-center p-2 rounded bg-white border">
                      <span>Fee Receipts & Invoices</span>
                      <button
                        onClick={() => navigate('/admin/fees/receipts')}
                        className="btn btn-sm btn-outline-secondary py-0.5 px-2"
                        style={{ fontSize: '11px' }}
                      >
                        View Receipts
                      </button>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="col-12 col-lg-6">
                <div className="p-3.5 rounded-3 border bg-light h-100">
                  <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                    <h6 className="fw-bold m-0 text-sa-charcoal d-flex align-items-center gap-2">
                      <Users size={16} className="text-primary" />
                      Teacher Salary Payroll Actions
                    </h6>
                    <button
                      onClick={() => navigate('/admin/teachers/salary')}
                      className="btn btn-sm text-white px-2.5 py-1"
                      style={{ backgroundColor: '#8B1216', fontSize: '11px' }}
                    >
                      Open Payroll Register →
                    </button>
                  </div>
                  <ul className="list-unstyled mb-0 d-flex flex-column gap-2.5 small">
                    <li className="d-flex justify-content-between align-items-center p-2 rounded bg-white border">
                      <span>Month's Faculty Liability</span>
                      <strong className="text-primary">₹{Number(salary.total_liability || 0).toLocaleString('en-IN')}</strong>
                    </li>
                    <li className="d-flex justify-content-between align-items-center p-2 rounded bg-white border">
                      <span>Already Disbursed (NEFT)</span>
                      <strong className="text-success">₹{Number(salary.total_disbursed || 0).toLocaleString('en-IN')}</strong>
                    </li>
                    <li className="d-flex justify-content-between align-items-center p-2 rounded bg-white border">
                      <span>Remaining Salary Balance</span>
                      <strong className="text-warning-emphasis">₹{Number(salary.total_pending || 0).toLocaleString('en-IN')}</strong>
                    </li>
                    <li className="d-flex justify-content-between align-items-center p-2 rounded bg-white border">
                      <span>Super Admin Notification Rule</span>
                      <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25" style={{ fontSize: '10.5px' }}>
                        Auto-Notifies on Disburse
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Fees Counter */}
          {activeTab === 'fees' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold text-sa-charcoal m-0">Monthly Fees Collection Register</h6>
                <div className="d-flex gap-2">
                  <button
                    onClick={() => navigate('/admin/fees')}
                    className="btn btn-sm text-white"
                    style={{ backgroundColor: '#8B1216' }}
                  >
                    Go to Fee Counter
                  </button>
                  <button
                    onClick={() => navigate('/admin/fees/offline-requests')}
                    className="btn btn-sm btn-outline-secondary"
                  >
                    Cash & Cheque Requests
                  </button>
                </div>
              </div>

              <div className="table-responsive border rounded-3 bg-white">
                <table className="table table-hover align-middle m-0 small">
                  <thead className="table-light">
                    <tr>
                      <th>Financial Metric</th>
                      <th>Value</th>
                      <th>Operational Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="fw-semibold">Total Revenue (Full Academic Year)</td>
                      <td className="fw-bold text-sa-charcoal">₹{Number(fees.total_expected || 0).toLocaleString('en-IN')}</td>
                      <td className="text-muted">Total fees committed across all registered students</td>
                    </tr>
                    <tr>
                      <td className="fw-semibold">Total Collected Fees (Paid)</td>
                      <td className="fw-bold text-success">₹{Number(fees.total_collected || 0).toLocaleString('en-IN')}</td>
                      <td className="text-muted">Direct receipts collected and approved</td>
                    </tr>
                    <tr>
                      <td className="fw-semibold">Total Pending Recovery (Defaulters)</td>
                      <td className="fw-bold text-danger">₹{Number(fees.total_pending || 0).toLocaleString('en-IN')}</td>
                      <td className="text-muted">
                        <button
                          onClick={() => navigate('/admin/fees/pending')}
                          className="btn btn-xs btn-outline-danger py-0 px-2"
                        >
                          Send Recovery SMS
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td className="fw-semibold">Net Collection Percentage</td>
                      <td className="fw-bold text-primary">{fees.collection_rate_percent}%</td>
                      <td className="text-muted">Percentage of expected fee recovered to date</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Teacher Salary Register */}
          {activeTab === 'salary' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold text-sa-charcoal m-0">
                  Faculty Payroll Register ({selectedMonth})
                </h6>
                <button
                  onClick={() => navigate('/admin/teachers/salary')}
                  className="btn btn-sm text-white"
                  style={{ backgroundColor: '#8B1216' }}
                >
                  Manage Full Payroll
                </button>
              </div>

              <div className="table-responsive border rounded-3 bg-white">
                <table className="table table-hover align-middle m-0 small">
                  <thead className="table-light">
                    <tr>
                      <th>Faculty Name</th>
                      <th>Employee ID</th>
                      <th>Hours</th>
                      <th>Net Payable</th>
                      <th>Paid</th>
                      <th>Pending</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salaryList.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="text-center py-4 text-muted">
                          No salary records found for {selectedMonth}.
                        </td>
                      </tr>
                    ) : (
                      salaryList.slice(0, 10).map((sal) => (
                        <tr key={sal.id}>
                          <td className="fw-bold text-sa-charcoal">{sal.teacher_name || 'Faculty Member'}</td>
                          <td><code>{sal.employee_id || '--'}</code></td>
                          <td>{sal.working_hours || 0} hrs</td>
                          <td className="fw-bold">₹{Number(sal.netPayable || sal.baseSalary || 0).toLocaleString('en-IN')}</td>
                          <td className="text-success">₹{Number(sal.amount_paid || 0).toLocaleString('en-IN')}</td>
                          <td className="text-danger fw-semibold">₹{Number(sal.amount_pending || 0).toLocaleString('en-IN')}</td>
                          <td>
                            <span
                              className={`badge ${
                                sal.status === 'Disbursed'
                                  ? 'bg-success'
                                  : sal.status === 'Partially Paid'
                                  ? 'bg-warning text-dark'
                                  : 'bg-secondary'
                              }`}
                            >
                              {sal.status}
                            </span>
                          </td>
                          <td>
                            {sal.status !== 'Disbursed' && (
                              <button
                                type="button"
                                onClick={() => handleDisburseClick(sal.id, sal.amount_pending)}
                                className="btn btn-xs text-white py-1 px-2.5 rounded fw-semibold"
                                style={{ backgroundColor: '#8B1216', fontSize: '11px' }}
                              >
                                Disburse
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: Security & Credentials */}
          {activeTab === 'security' && (
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <div className="p-3 rounded-3 border bg-light">
                  <h6 className="fw-bold text-sa-charcoal mb-2 d-flex align-items-center gap-2">
                    <Building size={16} className="text-sa-primary" />
                    Tarabai Park Campus Accounts
                  </h6>
                  <ul className="list-unstyled mb-0 small text-sa-charcoal d-flex flex-column gap-1.5">
                    <li><strong>Accounts ID:</strong> <code>accounts.tarabai</code></li>
                    <li><strong>Database Password:</strong> <code className="text-danger fw-bold">Tarabai@123</code></li>
                    <li><strong>Stored In:</strong> MongoDB collection <code>branch_accounts</code></li>
                    <li><strong>Scope:</strong> Tarabai Park fees collection & faculty salary</li>
                  </ul>
                </div>
              </div>

              <div className="col-12 col-md-6">
                <div className="p-3 rounded-3 border bg-light">
                  <h6 className="fw-bold text-sa-charcoal mb-2 d-flex align-items-center gap-2">
                    <Building size={16} className="text-sa-primary" />
                    Mangalvar Peth Campus Accounts
                  </h6>
                  <ul className="list-unstyled mb-0 small text-sa-charcoal d-flex flex-column gap-1.5">
                    <li><strong>Accounts ID:</strong> <code>accounts.mangalvar</code></li>
                    <li><strong>Database Password:</strong> <code className="text-danger fw-bold">Mangalvar@123</code></li>
                    <li><strong>Stored In:</strong> MongoDB collection <code>branch_accounts</code></li>
                    <li><strong>Scope:</strong> Mangalvar Peth fees collection & faculty salary</li>
                  </ul>
                </div>
              </div>

              <div className="col-12">
                <div className="p-3 rounded-3 border bg-white" style={{ borderColor: '#8B1216' }}>
                  <h6 className="fw-bold mb-2 d-flex align-items-center gap-2" style={{ color: '#8B1216' }}>
                    <ShieldCheck size={18} />
                    Super Admin Master Accounts Access
                  </h6>
                  <p className="small text-muted mb-2">
                    There is only one Super Admin for both campuses. Super Admin credentials automatically unlock Accounts access for both Tarabai Park and Mangalvar Peth.
                  </p>
                  <ul className="list-unstyled mb-0 small text-sa-charcoal d-flex flex-column gap-1">
                    <li><strong>Super Admin ID:</strong> <code>superadmin@shubham.edu</code></li>
                    <li><strong>Master Scope:</strong> Full access across both campuses without separate passwords.</li>
                    <li><strong>Disbursement Rule:</strong> Whenever faculty salary is disbursed at either branch, a high-priority alert is immediately logged and delivered to Super Admin.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
