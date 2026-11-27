import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  IndianRupee,
  Lock,
  Unlock,
  ShieldCheck,
  Building,
  Calendar as CalendarIcon,
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
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useAccountsAuth } from '../../context/AccountsAuthContext';
import { getUserBranch } from '../../utils/branchUtils';
import accountsService from '../../services/accountsService';
import salaryService from '../../services/salaryService';
import { BRANCH_TARABAI, BRANCH_MANGALWAR, normalizeBranch } from '../../config/branchBatchConfig';

const DEFAULT_ACADEMIC_YEARS = [
  'ALL',
  '2029-2030',
  '2028-2029',
  '2027-2028',
  '2026-2027',
  '2025-2026',
  '2024-2025',
  '2023-2024',
  '2022-2023'
];

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
  
  // Current month default: November 2026
  const currentMonthName = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const [selectedMonth, setSelectedMonth] = useState(currentMonthName);
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [viewMode, setViewMode] = useState('dual'); // 'dual' | 'monthly' | 'yearly'

  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState(null);
  const [salaryList, setSalaryList] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'fees' | 'salary' | 'security'

  // Combine backend years and defaults for full multi-year coverage
  const backendYears = summaryData?.available_academic_years || [];
  const allYearOptions = Array.from(
    new Set(['ALL', ...backendYears, ...DEFAULT_ACADEMIC_YEARS.filter((y) => y !== 'ALL')])
  );

  // Helper to dynamically calculate 12 academic months for any year (e.g. 2024-2025, 2025-2026, 2026-2027, etc.)
  const getAcademicMonthsForYear = (ayStr) => {
    if (!ayStr || ayStr === 'ALL') {
      const stats = summaryData?.monthly_calendar_stats || [];
      if (stats.length > 0) {
        return stats.map((s) => {
          const parts = s.month_name.split(' ');
          const yr = parts.length === 2 && !isNaN(parts[1]) ? parseInt(parts[1], 10) : 2026;
          return { full: s.month_name, short: parts[0].slice(0, 3), year: yr };
        });
      }
      ayStr = '2026-2027';
    }

    const match = ayStr.match(/^(\d{4})-(\d{4})$/);
    if (match) {
      const y1 = parseInt(match[1], 10);
      const y2 = parseInt(match[2], 10);
      return [
        { full: `April ${y1}`, short: 'Apr', year: y1 },
        { full: `May ${y1}`, short: 'May', year: y1 },
        { full: `June ${y1}`, short: 'Jun', year: y1 },
        { full: `July ${y1}`, short: 'Jul', year: y1 },
        { full: `August ${y1}`, short: 'Aug', year: y1 },
        { full: `September ${y1}`, short: 'Sep', year: y1 },
        { full: `October ${y1}`, short: 'Oct', year: y1 },
        { full: `November ${y1}`, short: 'Nov', year: y1 },
        { full: `December ${y1}`, short: 'Dec', year: y1 },
        { full: `January ${y2}`, short: 'Jan', year: y2 },
        { full: `February ${y2}`, short: 'Feb', year: y2 },
        { full: `March ${y2}`, short: 'Mar', year: y2 }
      ];
    }

    const singleMatch = ayStr.match(/^(\d{4})$/);
    if (singleMatch) {
      const y = parseInt(singleMatch[1], 10);
      return [
        { full: `January ${y}`, short: 'Jan', year: y },
        { full: `February ${y}`, short: 'Feb', year: y },
        { full: `March ${y}`, short: 'Mar', year: y },
        { full: `April ${y}`, short: 'Apr', year: y },
        { full: `May ${y}`, short: 'May', year: y },
        { full: `June ${y}`, short: 'Jun', year: y },
        { full: `July ${y}`, short: 'Jul', year: y },
        { full: `August ${y}`, short: 'Aug', year: y },
        { full: `September ${y}`, short: 'Sep', year: y },
        { full: `October ${y}`, short: 'Oct', year: y },
        { full: `November ${y}`, short: 'Nov', year: y },
        { full: `December ${y}`, short: 'Dec', year: y }
      ];
    }
    return [];
  };

  const dynamicMonths = getAcademicMonthsForYear(academicYear);

  // Year Change Handler with smart month selection
  const handleYearChange = (newYear) => {
    setAcademicYear(newYear);
    if (newYear === 'ALL') {
      setSelectedMonth('ALL');
      return;
    }
    const months = getAcademicMonthsForYear(newYear);
    const containsCurrent = months.some((m) => m.full === currentMonthName);
    if (containsCurrent) {
      setSelectedMonth(currentMonthName);
    } else if (months.length > 0) {
      setSelectedMonth(months[0].full);
    }
  };

  // Year Navigation Steppers
  const handlePreviousYear = () => {
    const list = allYearOptions.filter((y) => y !== 'ALL');
    const idx = list.indexOf(academicYear);
    if (idx !== -1 && idx < list.length - 1) {
      handleYearChange(list[idx + 1]); // list is descending (2027, 2026, 2025...)
    }
  };

  const handleNextYear = () => {
    const list = allYearOptions.filter((y) => y !== 'ALL');
    const idx = list.indexOf(academicYear);
    if (idx > 0) {
      handleYearChange(list[idx - 1]);
    }
  };

  // Load accounts summary
  const loadAccountsData = async () => {
    setLoading(true);
    try {
      const summary = await accountsService.getSummary(activeBranch, selectedMonth, academicYear);
      setSummaryData(summary);

      const queryParams = selectedMonth === 'ALL' ? {} : { month: selectedMonth };
      const salaries = await salaryService.getAll(queryParams);
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
  }, [activeBranch, selectedMonth, academicYear, isAccountsUnlocked]);

  const handleDisburseClick = async (salaryId, amount) => {
    try {
      await salaryService.disburseSalary(salaryId, amount);
      toast.success('Salary successfully disbursed! Notification sent to Super Admin.');
      loadAccountsData();
    } catch (err) {
      toast.error('Failed to disburse salary.');
    }
  };

  // Date selector handler for native <input type="month" />
  const handleNativeMonthChange = (e) => {
    const val = e.target.value; // e.g. "2024-08"
    if (!val) return;
    const [yStr, mStr] = val.split('-');
    const yNum = parseInt(yStr, 10);
    const mNum = parseInt(mStr, 10);
    const dateObj = new Date(yNum, mNum - 1, 1);
    const mName = dateObj.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    
    // Auto-detect matching academic year (April starts the new academic year)
    const matchingAY = mNum >= 4 ? `${yNum}-${yNum + 1}` : `${yNum - 1}-${yNum}`;
    setAcademicYear(matchingAY);
    setSelectedMonth(mName);
  };

  const isAllMonths = selectedMonth === 'ALL';

  // Derived live metrics
  const monthlyFees = summaryData?.monthly_fees || {
    total_collected: 0,
    total_expected: 0,
    total_pending: 0,
    payments_count: 0,
    collection_rate_percent: 0
  };

  const yearlyFees = summaryData?.yearly_fees || {
    total_collected: 0,
    total_expected: 0,
    total_pending: 0,
    total_students: 0,
    overdue_students_count: 0,
    collection_rate_percent: 0
  };

  const monthlySalary = summaryData?.monthly_salary || {
    total_liability: 0,
    total_disbursed: 0,
    total_pending: 0,
    faculty_count: 0,
    disbursed_count: 0,
    disbursement_rate_percent: 0
  };

  const yearlySalary = summaryData?.yearly_salary || {
    total_liability: 0,
    total_disbursed: 0,
    total_pending: 0,
    total_disbursements_count: 0,
    faculty_count: 0,
    disbursement_rate_percent: 0
  };

  const calendarStats = summaryData?.monthly_calendar_stats || [];

  return (
    <div className="container-fluid p-3 p-md-4">
      {/* 1. Top Header Card */}
      <div
        className="rounded-4 p-4 text-white mb-3 shadow-sm position-relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #8B1216 0%, #4A080A 100%)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 position-relative z-1">
          <div>
            <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
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

              {/* Dynamic Academic Year Selector in Header */}
              <div
                className="d-inline-flex align-items-center gap-1.5 px-2.5 py-1 rounded-pill"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.25)' }}
              >
                <CalendarIcon size={12} className="text-warning" />
                <span style={{ fontSize: '11px', opacity: 0.9 }}>Academic Year:</span>
                <select
                  value={academicYear}
                  onChange={(e) => handleYearChange(e.target.value)}
                  className="form-select form-select-sm border-0 p-0 text-white fw-bold bg-transparent"
                  style={{
                    fontSize: '11.5px',
                    width: 'auto',
                    minWidth: '105px',
                    cursor: 'pointer',
                    boxShadow: 'none'
                  }}
                  title="Switch to Any Academic Year"
                >
                  {allYearOptions.map((yr) => (
                    <option key={yr} value={yr} className="text-dark">
                      {yr === 'ALL' ? '🌟 All Academic Years' : `AY ${yr}`}
                    </option>
                  ))}
                </select>
              </div>
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

            {/* View Mode Toggle */}
            <div className="btn-group btn-group-sm bg-white bg-opacity-10 p-0.5 rounded-3">
              <button
                type="button"
                onClick={() => setViewMode('dual')}
                className={`btn btn-sm ${viewMode === 'dual' ? 'btn-light fw-bold text-dark' : 'text-white'}`}
                style={{ fontSize: '11px', height: '32px' }}
                title="View Both Monthly & Yearly Data Side-by-Side"
              >
                Dual View
              </button>
              <button
                type="button"
                onClick={() => setViewMode('monthly')}
                className={`btn btn-sm ${viewMode === 'monthly' ? 'btn-light fw-bold text-dark' : 'text-white'}`}
                style={{ fontSize: '11px', height: '32px' }}
                title="Focus on Selected Month Only"
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setViewMode('yearly')}
                className={`btn btn-sm ${viewMode === 'yearly' ? 'btn-light fw-bold text-dark' : 'text-white'}`}
                style={{ fontSize: '11px', height: '32px' }}
                title="Focus on Full Academic Year"
              >
                Full Year
              </button>
            </div>

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
              <span>Lock</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Interactive Academic Year Months Calendar Ribbon */}
      <div className="card border-0 shadow-sm rounded-4 mb-4 bg-white">
        <div className="card-body p-3">
          <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
            {/* Left: Year Stepper, Selector & Full Year Toggle */}
            <div className="d-flex flex-wrap align-items-center gap-2 flex-shrink-0">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center text-white"
                style={{ width: '34px', height: '34px', backgroundColor: '#8B1216' }}
              >
                <CalendarIcon size={17} />
              </div>
              <div>
                <div className="d-flex align-items-center gap-1.5">
                  <span className="fw-bold text-sa-charcoal small">Academic Year:</span>
                  
                  {/* Previous Year Stepper */}
                  <button
                    type="button"
                    onClick={handlePreviousYear}
                    className="btn btn-xs btn-outline-secondary p-0.5 px-1 rounded"
                    title="Previous Academic Year"
                    style={{ fontSize: '10px' }}
                  >
                    <ChevronLeft size={12} />
                  </button>

                  {/* Year Dropdown */}
                  <select
                    value={academicYear}
                    onChange={(e) => handleYearChange(e.target.value)}
                    className="form-select form-select-sm fw-bold border-danger py-0.5 px-2 text-danger"
                    style={{ width: 'auto', minWidth: '115px', height: '28px', fontSize: '11.5px' }}
                  >
                    {allYearOptions.map((yr) => (
                      <option key={yr} value={yr}>
                        {yr === 'ALL' ? '⭐ All Years (Consolidated)' : `AY ${yr}`}
                      </option>
                    ))}
                  </select>

                  {/* Next Year Stepper */}
                  <button
                    type="button"
                    onClick={handleNextYear}
                    className="btn btn-xs btn-outline-secondary p-0.5 px-1 rounded"
                    title="Next Academic Year"
                    style={{ fontSize: '10px' }}
                  >
                    <ChevronRight size={12} />
                  </button>
                </div>
                <div className="small text-muted" style={{ fontSize: '11px' }}>
                  {isAllMonths ? 'Showing Full Year Totals' : `Viewing: ${selectedMonth}`}
                </div>
              </div>

              {/* Full Academic Year Button */}
              <button
                type="button"
                onClick={() => setSelectedMonth('ALL')}
                className={`btn btn-sm ms-1 py-1 px-2.5 rounded-pill fw-semibold ${
                  isAllMonths
                    ? 'btn-danger text-white shadow-sm'
                    : 'btn-outline-secondary'
                }`}
                style={{
                  fontSize: '11.5px',
                  backgroundColor: isAllMonths ? '#8B1216' : undefined,
                  borderColor: isAllMonths ? '#8B1216' : undefined
                }}
              >
                ⭐ Full Year (All Months)
              </button>
            </div>

            {/* Middle: Month Pills Ribbon for the Selected Year */}
            <div className="d-flex align-items-center gap-1.5 overflow-auto py-1 px-0 w-100 justify-content-start justify-content-lg-center">
              {dynamicMonths.map((m) => {
                const isSelected = selectedMonth === m.full;
                const isCurrent = currentMonthName === m.full;
                const stat = calendarStats.find((s) => s.month_name === m.full);
                const hasFees = stat && stat.fees_collected > 0;
                const hasSalary = stat && stat.salary_disbursed > 0;

                return (
                  <button
                    key={m.full}
                    type="button"
                    onClick={() => setSelectedMonth(m.full)}
                    className={`btn btn-sm d-flex flex-column align-items-center justify-content-center px-2 py-1 rounded-3 transition-all ${
                      isSelected
                        ? 'text-white shadow-sm'
                        : isCurrent
                        ? 'btn-light border-danger text-danger fw-bold'
                        : 'btn-light text-sa-charcoal'
                    }`}
                    style={{
                      minWidth: '60px',
                      height: '42px',
                      backgroundColor: isSelected ? '#8B1216' : undefined,
                      borderColor: isSelected ? '#8B1216' : undefined,
                      fontSize: '11px'
                    }}
                    title={`${m.full}${hasFees ? ` • Fees: ₹${stat.fees_collected.toLocaleString('en-IN')}` : ''}`}
                  >
                    <span className="fw-bold">{m.short}</span>
                    <div className="d-flex align-items-center gap-1 mt-0.5">
                      <span style={{ fontSize: '9px', opacity: 0.8 }}>'{String(m.year).slice(2)}</span>
                      {hasFees && (
                        <span
                          className="rounded-circle"
                          style={{
                            width: '5px',
                            height: '5px',
                            backgroundColor: isSelected ? '#4ADE80' : '#16A34A'
                          }}
                          title="Fees Collected"
                        />
                      )}
                      {hasSalary && (
                        <span
                          className="rounded-circle"
                          style={{
                            width: '5px',
                            height: '5px',
                            backgroundColor: isSelected ? '#C084FC' : '#7E22CE'
                          }}
                          title="Salary Disbursed"
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right: Quick Jump Controls */}
            <div className="d-flex align-items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  const currYearCalc =
                    new Date().getMonth() >= 3
                      ? `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`
                      : `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`;
                  setAcademicYear(currYearCalc);
                  setSelectedMonth(currentMonthName);
                }}
                className="btn btn-sm btn-outline-danger py-1 px-2.5 rounded-3 fw-semibold"
                style={{ fontSize: '11px' }}
                title="Jump to Current Academic Month & Year"
              >
                Today
              </button>
              <input
                type="month"
                onChange={handleNativeMonthChange}
                className="form-control form-control-sm border text-muted"
                style={{ width: '130px', fontSize: '11px', height: '32px' }}
                title="Select Any Specific Year and Month from Calendar"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Monthly and Yearly KPI Cards Row */}
      <div className="row g-3 mb-4">
        {/* KPI 1: Collected Fees (Monthly & Yearly) */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card h-100 border-0 shadow-sm rounded-3 p-3 bg-white position-relative">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="small text-muted fw-semibold">
                {isAllMonths ? 'Full Year Collected Fees' : `Monthly Fees (${selectedMonth})`}
              </span>
              <div
                className="rounded-circle d-flex align-items-center justify-content-center text-success"
                style={{ width: '36px', height: '36px', backgroundColor: '#ECFDF5' }}
              >
                <IndianRupee size={18} />
              </div>
            </div>

            {/* Primary figure */}
            <h4 className="fw-bold mb-1 text-success">
              ₹{Number(isAllMonths ? yearlyFees.total_collected : monthlyFees.total_collected || 0).toLocaleString('en-IN')}
            </h4>

            {/* Monthly Target / Progress */}
            <div className="small text-muted mb-2">
              <span>Target: ₹{Number(isAllMonths ? yearlyFees.total_expected : monthlyFees.total_expected || 0).toLocaleString('en-IN')}</span>
              <span className="badge bg-success bg-opacity-10 text-success fw-bold ms-2">
                {isAllMonths ? yearlyFees.collection_rate_percent : monthlyFees.collection_rate_percent}%
              </span>
            </div>

            {/* Dual View: Yearly Cumulative Badge */}
            <div className="pt-2 border-top mt-auto d-flex justify-content-between align-items-center small">
              <span className="text-muted" style={{ fontSize: '11px' }}>
                Full Year Total:
              </span>
              <strong className="text-sa-charcoal" style={{ fontSize: '11.5px' }}>
                ₹{Number(yearlyFees.total_collected || 0).toLocaleString('en-IN')}
                <span className="text-muted fw-normal ms-1">({yearlyFees.collection_rate_percent}%)</span>
              </strong>
            </div>
          </div>
        </div>

        {/* KPI 2: Pending Dues (Monthly & Yearly Recovery) */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card h-100 border-0 shadow-sm rounded-3 p-3 bg-white">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="small text-muted fw-semibold">
                {isAllMonths ? 'Yearly Pending Dues' : `Pending Recovery (${selectedMonth})`}
              </span>
              <div
                className="rounded-circle d-flex align-items-center justify-content-center text-danger"
                style={{ width: '36px', height: '36px', backgroundColor: '#FEF2F2' }}
              >
                <AlertCircle size={18} />
              </div>
            </div>

            <h4 className="fw-bold mb-1 text-danger">
              ₹{Number(isAllMonths ? yearlyFees.total_pending : monthlyFees.total_pending || 0).toLocaleString('en-IN')}
            </h4>

            <div className="small text-muted mb-2">
              <span>{yearlyFees.overdue_students_count} Overdue Student Accounts</span>
            </div>

            {/* Dual View: Yearly Dues & Parent Alert */}
            <div className="pt-2 border-top mt-auto d-flex justify-content-between align-items-center small">
              <span className="text-muted" style={{ fontSize: '11px' }}>
                Yearly Dues: ₹{Number(yearlyFees.total_pending || 0).toLocaleString('en-IN')}
              </span>
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

        {/* KPI 3: Faculty Salary Liability (Monthly & Yearly) */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card h-100 border-0 shadow-sm rounded-3 p-3 bg-white">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="small text-muted fw-semibold">
                {isAllMonths ? 'Yearly Faculty Liability' : `Faculty Salary Liability (${selectedMonth})`}
              </span>
              <div
                className="rounded-circle d-flex align-items-center justify-content-center text-primary"
                style={{ width: '36px', height: '36px', backgroundColor: '#EFF6FF' }}
              >
                <Users size={18} />
              </div>
            </div>

            <h4 className="fw-bold mb-1 text-sa-charcoal">
              ₹{Number(isAllMonths ? yearlySalary.total_liability : monthlySalary.total_liability || 0).toLocaleString('en-IN')}
            </h4>

            <div className="small text-muted mb-2">
              <span>{isAllMonths ? yearlySalary.faculty_count : monthlySalary.faculty_count} Active Teachers</span>
            </div>

            {/* Dual View: Yearly Total Liability */}
            <div className="pt-2 border-top mt-auto d-flex justify-content-between align-items-center small">
              <span className="text-muted" style={{ fontSize: '11px' }}>
                Yearly Total Liability:
              </span>
              <strong className="text-primary" style={{ fontSize: '11.5px' }}>
                ₹{Number(yearlySalary.total_liability || 0).toLocaleString('en-IN')}
              </strong>
            </div>
          </div>
        </div>

        {/* KPI 4: Salary Disbursed (Monthly & Yearly Total) */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card h-100 border-0 shadow-sm rounded-3 p-3 bg-white">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="small text-muted fw-semibold">
                {isAllMonths ? 'Yearly Total Disbursed' : `Salary Disbursed (${selectedMonth})`}
              </span>
              <div
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: '36px', height: '36px', backgroundColor: '#FAF5FF', color: '#7E22CE' }}
              >
                <CreditCard size={18} />
              </div>
            </div>

            <h4 className="fw-bold mb-1" style={{ color: '#7E22CE' }}>
              ₹{Number(isAllMonths ? yearlySalary.total_disbursed : monthlySalary.total_disbursed || 0).toLocaleString('en-IN')}
            </h4>

            <div className="small text-muted mb-2 d-flex justify-content-between align-items-center">
              <span>
                {isAllMonths
                  ? `${yearlySalary.total_disbursements_count} Total Disbursements`
                  : `${monthlySalary.disbursed_count} of ${monthlySalary.faculty_count} Disbursed`}
              </span>
              <span className="badge text-white fw-bold" style={{ backgroundColor: '#7E22CE', fontSize: '10.5px' }}>
                {isAllMonths ? yearlySalary.disbursement_rate_percent : monthlySalary.disbursement_rate_percent}%
              </span>
            </div>

            {/* Dual View: Full Year Disbursed */}
            <div className="pt-2 border-top mt-auto d-flex justify-content-between align-items-center small">
              <span className="text-muted" style={{ fontSize: '11px' }}>
                Yearly Disbursed Total:
              </span>
              <strong style={{ color: '#7E22CE', fontSize: '11.5px' }}>
                ₹{Number(yearlySalary.total_disbursed || 0).toLocaleString('en-IN')}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Tabs Navigation */}
      <div className="card border-0 shadow-sm rounded-4 mb-4">
        <div className="card-header bg-white border-bottom p-2 d-flex flex-wrap gap-2">
          {[
            { id: 'overview', label: '📊 Financial Summary & Actions', icon: TrendingUp },
            { id: 'fees', label: '💰 Fees Counter & Collections', icon: IndianRupee },
            { id: 'salary', label: '👨‍🏫 Teacher Salary Register', icon: Users },
            { id: 'security', label: '🔒 Accounts Credentials & Access', icon: ShieldCheck }
          ].map((tab) => {
            const Icon = tab.icon;
            const isTabActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`btn btn-sm d-inline-flex align-items-center gap-1.5 py-2 px-3 rounded-3 fw-semibold transition-all ${
                  isTabActive ? 'text-white' : 'btn-light text-sa-charcoal'
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
          {/* TAB 1: Financial Overview & Actions */}
          {activeTab === 'overview' && (
            <div>
              {/* Executive Dual-Comparison Metrics Matrix */}
              <div className="mb-4 p-3 rounded-3 border bg-white shadow-sm">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h6 className="fw-bold m-0 text-sa-charcoal d-flex align-items-center gap-2">
                      <BarChart3 size={17} className="text-danger" />
                      Monthly vs Yearly Financial Snapshot ({activeBranch})
                    </h6>
                    <span className="text-muted small" style={{ fontSize: '11.5px' }}>
                      Comparing {selectedMonth} with Full Academic Year ({academicYear})
                    </span>
                  </div>
                  <span className="badge bg-light text-dark border">Live Data Synced</span>
                </div>

                <div className="table-responsive">
                  <table className="table table-bordered align-middle m-0 small">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: '35%' }}>Financial Counter</th>
                        <th style={{ width: '32%' }}>
                          Selected Month ({isAllMonths ? 'All Months' : selectedMonth})
                        </th>
                        <th style={{ width: '33%' }}>
                          Full Academic Year ({academicYear})
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="fw-semibold">
                          <span className="d-flex align-items-center gap-1.5">
                            <IndianRupee size={14} className="text-success" />
                            Fees Collected (Bank / Cash)
                          </span>
                        </td>
                        <td className="fw-bold text-success">
                          ₹{Number(isAllMonths ? yearlyFees.total_collected : monthlyFees.total_collected || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="fw-bold text-success">
                          ₹{Number(yearlyFees.total_collected || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                      <tr>
                        <td className="fw-semibold">Total Revenue Expected</td>
                        <td className="fw-bold text-sa-charcoal">
                          ₹{Number(isAllMonths ? yearlyFees.total_expected : monthlyFees.total_expected || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="fw-bold text-sa-charcoal">
                          ₹{Number(yearlyFees.total_expected || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                      <tr>
                        <td className="fw-semibold">
                          <span className="d-flex align-items-center gap-1.5">
                            <AlertCircle size={14} className="text-danger" />
                            Pending Fee Dues (Recovery)
                          </span>
                        </td>
                        <td className="fw-bold text-danger">
                          ₹{Number(isAllMonths ? yearlyFees.total_pending : monthlyFees.total_pending || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="fw-bold text-danger">
                          ₹{Number(yearlyFees.total_pending || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                      <tr>
                        <td className="fw-semibold">
                          <span className="d-flex align-items-center gap-1.5">
                            <Users size={14} className="text-primary" />
                            Teacher Salary Liability
                          </span>
                        </td>
                        <td className="fw-bold text-primary">
                          ₹{Number(isAllMonths ? yearlySalary.total_liability : monthlySalary.total_liability || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="fw-bold text-primary">
                          ₹{Number(yearlySalary.total_liability || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                      <tr>
                        <td className="fw-semibold">
                          <span className="d-flex align-items-center gap-1.5">
                            <CreditCard size={14} style={{ color: '#7E22CE' }} />
                            Teacher Salary Disbursed (NEFT)
                          </span>
                        </td>
                        <td className="fw-bold" style={{ color: '#7E22CE' }}>
                          ₹{Number(isAllMonths ? yearlySalary.total_disbursed : monthlySalary.total_disbursed || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="fw-bold" style={{ color: '#7E22CE' }}>
                          ₹{Number(yearlySalary.total_disbursed || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                      <tr>
                        <td className="fw-semibold">Remaining Salary Balance</td>
                        <td className="fw-bold text-warning-emphasis">
                          ₹{Number(isAllMonths ? yearlySalary.total_pending : monthlySalary.total_pending || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="fw-bold text-warning-emphasis">
                          ₹{Number(yearlySalary.total_pending || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Panels */}
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
                        <span>Total Fees Collected (Yearly)</span>
                        <strong className="text-success">₹{Number(yearlyFees.total_collected || 0).toLocaleString('en-IN')}</strong>
                      </li>
                      <li className="d-flex justify-content-between align-items-center p-2 rounded bg-white border">
                        <span>Pending Fee Dues (Recovery)</span>
                        <strong className="text-danger">₹{Number(yearlyFees.total_pending || 0).toLocaleString('en-IN')}</strong>
                      </li>
                      <li className="d-flex justify-content-between align-items-center p-2 rounded bg-white border">
                        <span>Defaulter Recovery Status ({yearlyFees.overdue_students_count} Overdue)</span>
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
                        <span>Month's Faculty Liability ({selectedMonth})</span>
                        <strong className="text-primary">₹{Number(monthlySalary.total_liability || 0).toLocaleString('en-IN')}</strong>
                      </li>
                      <li className="d-flex justify-content-between align-items-center p-2 rounded bg-white border">
                        <span>Already Disbursed (NEFT)</span>
                        <strong className="text-success">₹{Number(monthlySalary.total_disbursed || 0).toLocaleString('en-IN')}</strong>
                      </li>
                      <li className="d-flex justify-content-between align-items-center p-2 rounded bg-white border">
                        <span>Remaining Salary Balance</span>
                        <strong className="text-warning-emphasis">₹{Number(monthlySalary.total_pending || 0).toLocaleString('en-IN')}</strong>
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
            </div>
          )}

          {/* TAB 2: Fees Counter & Collections Register */}
          {activeTab === 'fees' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold text-sa-charcoal m-0">
                  Fees Collection Register (Monthly & Yearly Comparison)
                </h6>
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

              {/* Summary Table */}
              <div className="table-responsive border rounded-3 bg-white mb-4">
                <table className="table table-hover align-middle m-0 small">
                  <thead className="table-light">
                    <tr>
                      <th>Financial Metric</th>
                      <th>Monthly Value ({selectedMonth})</th>
                      <th>Full Academic Year Total</th>
                      <th>Operational Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="fw-semibold">Total Revenue Target</td>
                      <td className="fw-bold text-sa-charcoal">
                        ₹{Number(monthlyFees.total_expected || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="fw-bold text-sa-charcoal">
                        ₹{Number(yearlyFees.total_expected || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="text-muted">Total fees committed across all registered students</td>
                    </tr>
                    <tr>
                      <td className="fw-semibold">Total Collected Fees (Paid)</td>
                      <td className="fw-bold text-success">
                        ₹{Number(monthlyFees.total_collected || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="fw-bold text-success">
                        ₹{Number(yearlyFees.total_collected || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="text-muted">Direct receipts collected and approved</td>
                    </tr>
                    <tr>
                      <td className="fw-semibold">Total Pending Recovery (Defaulters)</td>
                      <td className="fw-bold text-danger">
                        ₹{Number(monthlyFees.total_pending || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="fw-bold text-danger">
                        ₹{Number(yearlyFees.total_pending || 0).toLocaleString('en-IN')}
                      </td>
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
                      <td className="fw-bold text-primary">{monthlyFees.collection_rate_percent}%</td>
                      <td className="fw-bold text-primary">{yearlyFees.collection_rate_percent}%</td>
                      <td className="text-muted">Percentage of expected fee recovered to date</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Calendar Month-by-Month Fees & Salary Ledger */}
              <div className="card border rounded-3 bg-light p-3">
                <h6 className="fw-bold text-sa-charcoal mb-2 d-flex align-items-center gap-2">
                  <CalendarIcon size={16} className="text-danger" />
                  Academic Months Financial Ledger ({academicYear})
                </h6>
                <div className="table-responsive bg-white rounded border">
                  <table className="table table-sm table-hover align-middle m-0 small">
                    <thead className="table-light">
                      <tr>
                        <th>Academic Month</th>
                        <th>Fees Collected</th>
                        <th>Teacher Salary Disbursed</th>
                        <th>Faculty Count</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calendarStats.map((item) => (
                        <tr
                          key={item.month_name}
                          className={item.month_name === selectedMonth ? 'table-warning' : ''}
                        >
                          <td className="fw-bold text-sa-charcoal">
                            {item.month_name}
                            {item.is_current && (
                              <span className="badge bg-danger ms-2" style={{ fontSize: '9.5px' }}>
                                Current
                              </span>
                            )}
                          </td>
                          <td className="fw-bold text-success">
                            ₹{Number(item.fees_collected || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="fw-bold" style={{ color: '#7E22CE' }}>
                            ₹{Number(item.salary_disbursed || 0).toLocaleString('en-IN')}
                          </td>
                          <td>{item.faculty_count} Faculty</td>
                          <td>
                            {item.fees_collected > 0 || item.salary_disbursed > 0 ? (
                              <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25">
                                Active Records
                              </span>
                            ) : (
                              <span className="badge bg-light text-muted border">No Activity</span>
                            )}
                          </td>
                          <td>
                            <button
                              type="button"
                              onClick={() => setSelectedMonth(item.month_name)}
                              className="btn btn-xs btn-outline-secondary py-0.5 px-2"
                              style={{ fontSize: '11px' }}
                            >
                              Filter Month
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Teacher Salary Register */}
          {activeTab === 'salary' && (
            <div>
              {/* Yearly & Monthly Payroll Total Header */}
              <div className="row g-3 mb-3">
                <div className="col-12 col-md-4">
                  <div className="p-2.5 rounded-3 border bg-light">
                    <span className="small text-muted">Selected Month ({selectedMonth})</span>
                    <h6 className="fw-bold mb-0 text-primary">
                      Liability: ₹{Number(monthlySalary.total_liability || 0).toLocaleString('en-IN')}
                    </h6>
                    <span className="small text-success">
                      Disbursed: ₹{Number(monthlySalary.total_disbursed || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
                <div className="col-12 col-md-4">
                  <div className="p-2.5 rounded-3 border bg-light">
                    <span className="small text-muted">Full Academic Year ({academicYear})</span>
                    <h6 className="fw-bold mb-0 text-sa-charcoal">
                      Total Liability: ₹{Number(yearlySalary.total_liability || 0).toLocaleString('en-IN')}
                    </h6>
                    <span className="small" style={{ color: '#7E22CE' }}>
                      Total Disbursed: ₹{Number(yearlySalary.total_disbursed || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
                <div className="col-12 col-md-4">
                  <div className="p-2.5 rounded-3 border bg-light">
                    <span className="small text-muted">Disbursement Progress</span>
                    <h6 className="fw-bold mb-0 text-success">
                      {yearlySalary.disbursement_rate_percent}% Year-to-Date
                    </h6>
                    <span className="small text-muted">
                      {yearlySalary.total_disbursements_count} Disbursements Logged
                    </span>
                  </div>
                </div>
              </div>

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
                      salaryList.slice(0, 15).map((sal) => (
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
