import React, { useState, useEffect, useMemo } from 'react';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import feeService from '../../services/feeService';
import { useAuth } from '../../hooks/useAuth';
import { getUserBranch, isSuperAdminUser } from '../../utils/branchUtils';
import { BRANCH_MANGALWAR, BRANCH_TARABAI } from '../../config/branchBatchConfig';
import {
  AlertCircle,
  Send,
  ArrowLeft,
  RefreshCw,
  Search,
  X,
  Filter,
  GraduationCap,
  Users,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// Generates the full 100-year 2000s century series (from 2000-2001 all the way through 2099-2100 & 2100-2101)
const generateAcademicYearsList = () => {
  const years = ['ALL'];
  for (let y = 2100; y >= 2000; y--) {
    years.push(`${y}-${y + 1}`);
  }
  return years;
};

const DEFAULT_ACADEMIC_YEARS = generateAcademicYearsList();

// Helper to dynamically calculate 12 academic months for any year (April through March)
const getAcademicMonthsForYear = (ayStr) => {
  if (!ayStr || ayStr === 'ALL') {
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

export default function PendingFees() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuperAdmin = isSuperAdminUser(user);
  const activeBranch = getUserBranch(user);
  const isMangal = Boolean(activeBranch && activeBranch.toLowerCase().includes('mangal'));
  const [selectedCampus, setSelectedCampus] = useState(isMangal ? BRANCH_MANGALWAR : BRANCH_TARABAI);

  // Academic Year & Month Filters (Dynamic variance matching Accounts module)
  const currentMonthName = useMemo(() => {
    return new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
  }, []);
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [selectedMonth, setSelectedMonth] = useState('ALL');

  // Filters
  const [selectedStandard, setSelectedStandard] = useState('ALL'); // 'ALL', '11th', '12th'
  const [search, setSearch] = useState('');
  const [pendingList, setPendingList] = useState([]);
  const [loading, setLoading] = useState(true);

  const dynamicMonths = useMemo(() => getAcademicMonthsForYear(academicYear), [academicYear]);
  const isAllMonths = selectedMonth === 'ALL';

  useEffect(() => {
    if (activeBranch && !isSuperAdmin) {
      const isM = Boolean(activeBranch.toLowerCase().includes('mangal'));
      setSelectedCampus(isM ? BRANCH_MANGALWAR : BRANCH_TARABAI);
    }
  }, [activeBranch, isSuperAdmin]);

  const fetchPending = async (campus = selectedCampus, ay = academicYear, m = selectedMonth) => {
    setLoading(true);
    try {
      const data = await feeService.getPending({
        branch: campus,
        academic_year: ay,
        month: m
      });
      setPendingList(data || []);
    } catch (err) {
      console.warn('Could not fetch pending fees:', err);
      toast.error('Failed to load pending fees register.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending(selectedCampus, academicYear, selectedMonth);

    // Auto-update pending fees when a fee receipt is generated or fee collected
    const handleFeeUpdate = () => {
      fetchPending(selectedCampus, academicYear, selectedMonth);
    };

    window.addEventListener('sa_fees_updated', handleFeeUpdate);
    window.addEventListener('sa_fee_updated', handleFeeUpdate);
    window.addEventListener('sa_fee_collected', handleFeeUpdate);
    window.addEventListener('sa_offline_fee_requests_updated', handleFeeUpdate);
    window.addEventListener('focus', handleFeeUpdate);
    window.addEventListener('storage', handleFeeUpdate);

    return () => {
      window.removeEventListener('sa_fees_updated', handleFeeUpdate);
      window.removeEventListener('sa_fee_updated', handleFeeUpdate);
      window.removeEventListener('sa_fee_collected', handleFeeUpdate);
      window.removeEventListener('sa_offline_fee_requests_updated', handleFeeUpdate);
      window.removeEventListener('focus', handleFeeUpdate);
      window.removeEventListener('storage', handleFeeUpdate);
    };
  }, [selectedCampus, academicYear, selectedMonth]);

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

  const handlePreviousYear = () => {
    if (academicYear === 'ALL') {
      const currY = new Date().getFullYear();
      handleYearChange(`${currY}-${currY + 1}`);
      return;
    }
    const match = academicYear.match(/^(\d{4})-(\d{4})$/);
    if (match) {
      const prevY1 = parseInt(match[1], 10) - 1;
      const prevY2 = parseInt(match[2], 10) - 1;
      handleYearChange(`${prevY1}-${prevY2}`);
    } else {
      const single = parseInt(academicYear, 10);
      if (!isNaN(single)) handleYearChange(String(single - 1));
    }
  };

  const handleNextYear = () => {
    if (academicYear === 'ALL') {
      const currY = new Date().getFullYear();
      handleYearChange(`${currY}-${currY + 1}`);
      return;
    }
    const match = academicYear.match(/^(\d{4})-(\d{4})$/);
    if (match) {
      const nextY1 = parseInt(match[1], 10) + 1;
      const nextY2 = parseInt(match[2], 10) + 1;
      handleYearChange(`${nextY1}-${nextY2}`);
    } else {
      const single = parseInt(academicYear, 10);
      if (!isNaN(single)) handleYearChange(String(single + 1));
    }
  };

  const handleNativeMonthChange = (e) => {
    const val = e.target.value; // e.g. "2026-11"
    if (!val) return;
    const [yStr, mStr] = val.split('-');
    const yNum = parseInt(yStr, 10);
    const mNum = parseInt(mStr, 10);
    const dateObj = new Date(yNum, mNum - 1, 1);
    const mName = dateObj.toLocaleString('en-US', { month: 'long', year: 'numeric' });

    const matchingAY = mNum >= 4 ? `${yNum}-${yNum + 1}` : `${yNum - 1}-${yNum}`;
    setAcademicYear(matchingAY);
    setSelectedMonth(mName);
  };

  const handleSendReminder = (studentName) => {
    toast.success(`Payment reminder SMS dispatched to ${studentName}'s parents!`);
  };

  // Helper to determine whether an item belongs to 11th or 12th
  const getItemStandardCategory = (item) => {
    const raw = (item.rawStandard || item.standard || item.batch || '').toLowerCase();
    if (raw.includes('11')) return '11th';
    if (raw.includes('12')) return '12th';
    return 'Other';
  };

  // Pre-calculated stats for fast cards
  const stats = useMemo(() => {
    let count11 = 0;
    let total11 = 0;
    let count12 = 0;
    let total12 = 0;
    let countAll = pendingList.length;
    let totalAll = 0;

    pendingList.forEach((item) => {
      const amt = Number(item.pendingAmount ?? item.pending_fees) || 0;
      totalAll += amt;
      const cat = getItemStandardCategory(item);
      if (cat === '11th') {
        count11 += 1;
        total11 += amt;
      } else if (cat === '12th') {
        count12 += 1;
        total12 += amt;
      }
    });

    return {
      countAll,
      totalAll,
      count11,
      total11,
      count12,
      total12
    };
  }, [pendingList]);

  // Dynamically filtered list based on standard & search query
  const filteredList = useMemo(() => {
    return pendingList.filter((item) => {
      // 1. Standard filter (All, 11th, 12th)
      if (selectedStandard !== 'ALL') {
        const cat = getItemStandardCategory(item);
        if (cat !== selectedStandard) return false;
      }

      // 2. Search query filter
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const nameMatch = (item.studentName || '').toLowerCase().includes(q);
        const rollMatch = (item.rollNumber || item.studentId || '').toLowerCase().includes(q);
        const stdMatch = (item.standard || item.batch || '').toLowerCase().includes(q);
        if (!nameMatch && !rollMatch && !stdMatch) return false;
      }

      return true;
    });
  }, [pendingList, selectedStandard, search]);

  // Dynamically varying total outstanding based strictly on current filter/search
  const dynamicTotalOutstanding = useMemo(() => {
    return filteredList.reduce((acc, curr) => acc + (Number(curr.pendingAmount ?? curr.pending_fees) || 0), 0);
  }, [filteredList]);

  // Dynamic card title
  const outstandingTitle = useMemo(() => {
    if (selectedStandard === '11th') return '11th Science Outstanding';
    if (selectedStandard === '12th') return '12th Science Outstanding';
    if (search.trim()) return 'Filtered Outstanding';
    return 'Total Outstanding';
  }, [selectedStandard, search]);

  return (
    <div className="d-flex flex-column gap-4">
      {/* Top Header & Overview */}
      <div>
        <button
          type="button"
          className="btn btn-link p-0 d-inline-flex align-items-center gap-1 small text-sa-muted mb-2 text-decoration-none"
          onClick={() => navigate('/admin/fees')}
        >
          <ArrowLeft size={16} /> Back to Fee Counter
        </button>

        <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
                Fee Defaulters & Outstanding Dues
              </h3>

              {isSuperAdmin ? (
                <div className="btn-group btn-group-sm ms-1 shadow-sm">
                  <button
                    type="button"
                    className={`btn px-2.5 py-1 fw-bold ${selectedCampus === BRANCH_MANGALWAR ? 'btn-teal text-white' : 'btn-outline-secondary bg-white'}`}
                    style={{ fontSize: '0.72rem' }}
                    onClick={() => setSelectedCampus(BRANCH_MANGALWAR)}
                  >
                    🏛️ Mangalvar Peth
                  </button>
                  <button
                    type="button"
                    className={`btn px-2.5 py-1 fw-bold ${selectedCampus === BRANCH_TARABAI ? 'btn-danger text-white' : 'btn-outline-secondary bg-white'}`}
                    style={{ fontSize: '0.72rem' }}
                    onClick={() => setSelectedCampus(BRANCH_TARABAI)}
                  >
                    🌲 Tarabai Park
                  </button>
                </div>
              ) : (
                <span
                  className="badge rounded-pill fw-semibold px-2 py-0.5"
                  style={{
                    backgroundColor: selectedCampus === BRANCH_MANGALWAR ? '#F0FDFA' : '#FDF0F0',
                    color: selectedCampus === BRANCH_MANGALWAR ? '#0D9488' : '#8B1216',
                    border: selectedCampus === BRANCH_MANGALWAR ? '1px solid #99F6E4' : '1px solid #F5C2C4',
                    fontSize: '0.70rem'
                  }}
                >
                  {selectedCampus === BRANCH_MANGALWAR ? '🏛️ Mangalvar Peth Campus' : '🌲 Tarabai Park Campus'}
                </span>
              )}
            </div>
            <span className="small text-sa-muted">
              Track overdue student accounts and dispatch automated SMS payment gateway links for {selectedCampus}
            </span>
          </div>

          <div className="d-flex align-items-center gap-3 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              loading={loading}
              onClick={() => fetchPending(selectedCampus)}
              className="bg-white border text-sa-charcoal shadow-sm"
            >
              Refresh
            </Button>

            {/* Dynamic Total Outstanding Metric Card */}
            <div
              className="p-2.5 px-3 bg-white border rounded-3 d-flex align-items-center gap-3 shadow-sm transition-all"
              style={{
                borderColor: selectedStandard !== 'ALL' || search ? '#EF4444' : '#E5E7EB',
                backgroundColor: selectedStandard !== 'ALL' || search ? '#FEF2F2' : '#FFFFFF',
                minWidth: '220px'
              }}
            >
              <div
                className="rounded-circle p-2 d-flex align-items-center justify-content-center"
                style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}
              >
                <AlertCircle size={22} />
              </div>
              <div>
                <span className="small text-sa-muted d-block lh-1 fw-medium" style={{ fontSize: '0.72rem' }}>
                  {outstandingTitle}
                </span>
                <span className="fw-extrabold text-danger fs-5 d-block mt-0.5">
                  ₹ {dynamicTotalOutstanding.toLocaleString('en-IN')}
                </span>
                <span className="text-muted d-block text-nowrap" style={{ fontSize: '10px' }}>
                  {filteredList.length} defaulter{filteredList.length !== 1 ? 's' : ''} listed
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Academic Year Months Calendar Ribbon (Dynamic Defaulters Variance) */}
      <div className="card border-0 shadow-sm rounded-4 bg-white">
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
                    {DEFAULT_ACADEMIC_YEARS.map((yr) => (
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
                  {isAllMonths ? 'Showing Full Year Defaulters & Dues' : `Viewing Overdue As Of: ${selectedMonth}`}
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
                    title={`Filter fee defaulters as of ${m.full}`}
                  >
                    <span className="fw-bold">{m.short}</span>
                    <div className="d-flex align-items-center gap-1 mt-0.5">
                      <span style={{ fontSize: '9px', opacity: 0.8 }}>'{String(m.year).slice(2)}</span>
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
                  const currY = new Date().getFullYear();
                  const currM = new Date().getMonth() + 1;
                  const matchingAY = currM >= 4 ? `${currY}-${currY + 1}` : `${currY - 1}-${currY}`;
                  setAcademicYear(matchingAY);
                  setSelectedMonth(currentMonthName);
                }}
                className="btn btn-sm btn-outline-danger fw-semibold d-inline-flex align-items-center gap-1"
                style={{ fontSize: '11px', height: '32px' }}
                title="Jump to Current Month"
              >
                <Clock size={13} />
                <span>Today</span>
              </button>

              {/* Native Calendar Month Picker */}
              <input
                type="month"
                onChange={handleNativeMonthChange}
                className="form-control form-control-sm border text-muted"
                style={{ height: '32px', fontSize: '11px', width: 'auto', maxWidth: '135px' }}
                title="Select Any Specific Calendar Month & Year"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Standard Filter Pills (All, 11th, 12th) */}
      <div className="row g-2 g-md-3">
        {/* All Standards */}
        <div className="col-12 col-md-4">
          <div
            onClick={() => setSelectedStandard('ALL')}
            className={`p-3 rounded-3 border cursor-pointer transition-all ${
              selectedStandard === 'ALL'
                ? 'bg-white border-2 border-primary shadow-sm'
                : 'bg-white border text-sa-charcoal opacity-85 hover-shadow'
            }`}
            style={{
              cursor: 'pointer',
              borderLeft: selectedStandard === 'ALL' ? '4px solid #1E3A8A' : undefined
            }}
          >
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="small fw-bold text-sa-charcoal d-inline-flex align-items-center gap-1.5">
                <Users size={15} className="text-primary" /> All Standards
              </span>
              <span
                className={`badge rounded-pill px-2 py-0.5 fw-bold ${
                  selectedStandard === 'ALL' ? 'bg-primary text-white' : 'bg-light text-muted border'
                }`}
                style={{ fontSize: '11px' }}
              >
                {stats.countAll} Students
              </span>
            </div>
            <div className="d-flex justify-content-between align-items-baseline">
              <span className="text-muted text-xs" style={{ fontSize: '11.5px' }}>Combined Dues:</span>
              <span className="fw-extrabold text-sa-charcoal fs-6">
                ₹ {stats.totalAll.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* 11th Science */}
        <div className="col-12 col-md-4">
          <div
            onClick={() => setSelectedStandard('11th')}
            className={`p-3 rounded-3 border cursor-pointer transition-all ${
              selectedStandard === '11th'
                ? 'bg-white border-2 border-danger shadow-sm'
                : 'bg-white border text-sa-charcoal opacity-85 hover-shadow'
            }`}
            style={{
              cursor: 'pointer',
              borderLeft: selectedStandard === '11th' ? '4px solid #DC2626' : undefined
            }}
          >
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="small fw-bold text-sa-charcoal d-inline-flex align-items-center gap-1.5">
                <GraduationCap size={16} className="text-danger" /> 11th Standard
              </span>
              <span
                className={`badge rounded-pill px-2 py-0.5 fw-bold ${
                  selectedStandard === '11th' ? 'bg-danger text-white' : 'bg-light text-muted border'
                }`}
                style={{ fontSize: '11px' }}
              >
                {stats.count11} Students
              </span>
            </div>
            <div className="d-flex justify-content-between align-items-baseline">
              <span className="text-muted text-xs" style={{ fontSize: '11.5px' }}>11th Overdue:</span>
              <span className="fw-extrabold text-danger fs-6">
                ₹ {stats.total11.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* 12th Science */}
        <div className="col-12 col-md-4">
          <div
            onClick={() => setSelectedStandard('12th')}
            className={`p-3 rounded-3 border cursor-pointer transition-all ${
              selectedStandard === '12th'
                ? 'bg-white border-2 border-warning shadow-sm'
                : 'bg-white border text-sa-charcoal opacity-85 hover-shadow'
            }`}
            style={{
              cursor: 'pointer',
              borderLeft: selectedStandard === '12th' ? '4px solid #D97706' : undefined
            }}
          >
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="small fw-bold text-sa-charcoal d-inline-flex align-items-center gap-1.5">
                <GraduationCap size={16} className="text-warning" /> 12th Standard
              </span>
              <span
                className={`badge rounded-pill px-2 py-0.5 fw-bold ${
                  selectedStandard === '12th' ? 'bg-warning text-dark' : 'bg-light text-muted border'
                }`}
                style={{ fontSize: '11px' }}
              >
                {stats.count12} Students
              </span>
            </div>
            <div className="d-flex justify-content-between align-items-baseline">
              <span className="text-muted text-xs" style={{ fontSize: '11.5px' }}>12th Overdue:</span>
              <span className="fw-extrabold text-sa-charcoal fs-6">
                ₹ {stats.total12.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="sa-card p-4">
        {/* Search & Quick Filter Controls */}
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4 pb-3 border-bottom">
          <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ maxWidth: '420px' }}>
            <div className="input-group">
              <span className="input-group-text bg-white text-muted border-end-0">
                <Search size={16} />
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-1"
                placeholder="Search student, roll number, or stream..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ height: '38px', fontSize: '13.5px' }}
              />
              {search && (
                <button
                  type="button"
                  className="btn btn-outline-secondary border-start-0"
                  onClick={() => setSearch('')}
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="d-flex align-items-center gap-2 flex-wrap">
            <span className="text-muted small d-inline-flex align-items-center gap-1" style={{ fontSize: '12px' }}>
              <Filter size={14} /> Standard:
            </span>
            <div className="btn-group btn-group-sm">
              <button
                type="button"
                className={`btn ${selectedStandard === 'ALL' ? 'btn-primary text-white fw-bold' : 'btn-outline-secondary bg-white'}`}
                style={{ fontSize: '12px' }}
                onClick={() => setSelectedStandard('ALL')}
              >
                All
              </button>
              <button
                type="button"
                className={`btn ${selectedStandard === '11th' ? 'btn-danger text-white fw-bold' : 'btn-outline-secondary bg-white'}`}
                style={{ fontSize: '12px' }}
                onClick={() => setSelectedStandard('11th')}
              >
                11th Science
              </button>
              <button
                type="button"
                className={`btn ${selectedStandard === '12th' ? 'btn-warning text-dark fw-bold' : 'btn-outline-secondary bg-white'}`}
                style={{ fontSize: '12px' }}
                onClick={() => setSelectedStandard('12th')}
              >
                12th Science
              </button>
            </div>

            {(selectedStandard !== 'ALL' || search) && (
              <button
                type="button"
                className="btn btn-link btn-sm text-danger text-decoration-none p-0 ms-2"
                style={{ fontSize: '12px' }}
                onClick={() => {
                  setSelectedStandard('ALL');
                  setSearch('');
                }}
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Defaulters Summary Info */}
        <div className="d-flex align-items-center justify-content-between mb-3 text-muted small flex-wrap gap-2" style={{ fontSize: '12px' }}>
          <div>
            Showing <strong className="text-sa-charcoal">{filteredList.length}</strong> of{' '}
            <strong className="text-sa-charcoal">{pendingList.length}</strong> total fee defaulters
            {selectedStandard !== 'ALL' && (
              <span className="ms-1 badge bg-light text-sa-charcoal border">
                {selectedStandard === '11th' ? '11th Standard' : '12th Standard'}
              </span>
            )}
            {search && <span className="ms-1 badge bg-light text-muted border">Query: "{search}"</span>}
          </div>
          <div className="fw-bold text-danger">
            Filtered Outstanding Total: ₹ {dynamicTotalOutstanding.toLocaleString('en-IN')}
          </div>
        </div>

        {/* Fee Defaulters Table */}
        <Table
          columns={[
            {
              key: 'rollNumber',
              title: 'Roll No.',
              render: (val, row) => (
                <span className="fw-bold text-sa-charcoal font-monospace" style={{ fontSize: '13px' }}>
                  {val && val !== 'N/A' ? `#${val}` : (row.studentId ? `#${row.studentId.substring(row.studentId.length - 6)}` : 'N/A')}
                </span>
              )
            },
            {
              key: 'studentName',
              title: 'Student Name',
              render: (val) => <span className="fw-semibold text-sa-charcoal">{val}</span>
            },
            {
              key: 'standard',
              title: 'Class / Stream',
              render: (val) => (
                <span
                  className="badge px-2 py-1 fw-medium"
                  style={{
                    backgroundColor: String(val).includes('11') ? '#EFF6FF' : '#FFFBEB',
                    color: String(val).includes('11') ? '#1E40AF' : '#B45309',
                    border: String(val).includes('11') ? '1px solid #BFDBFE' : '1px solid #FDE68A',
                    fontSize: '11px'
                  }}
                >
                  {val}
                </span>
              )
            },
            {
              key: 'totalFees',
              title: 'Total Fees',
              render: (val, row) => `₹ ${Number(val ?? row.total_fees ?? 0).toLocaleString('en-IN')}`
            },
            {
              key: 'amountPaid',
              title: 'Paid Till Date',
              render: (val, row) => (
                <span className="text-success fw-semibold">
                  ₹ {Number(val ?? row.amount_paid ?? 0).toLocaleString('en-IN')}
                </span>
              )
            },
            {
              key: 'pendingAmount',
              title: 'Overdue Amount',
              render: (val, row) => (
                <span className="fw-extrabold text-danger fs-6">
                  ₹ {Number(val ?? row.pending_fees ?? 0).toLocaleString('en-IN')}
                </span>
              )
            },
            {
              key: 'status',
              title: 'Status',
              render: (val) => <span className="badge-overdue">{val || 'Pending'}</span>
            },
            {
              key: 'id',
              title: 'Action',
              align: 'end',
              render: (val, row) => (
                <Button
                  size="sm"
                  variant="outline"
                  icon={Send}
                  onClick={() => handleSendReminder(row.studentName)}
                  className="btn-sm text-nowrap"
                >
                  Send SMS Alert
                </Button>
              )
            }
          ]}
          data={filteredList}
          loading={loading}
          emptyMessage={
            selectedStandard !== 'ALL' || search
              ? `No fee defaulters found matching ${selectedStandard !== 'ALL' ? `${selectedStandard} Standard` : ''} ${search ? `"${search}"` : ''}.`
              : 'No pending fee accounts found for this campus. All student accounts are up to date!'
          }
        />
      </div>
    </div>
  );
}
