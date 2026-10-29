import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SalarySummary from '../components/salary/SalarySummary';
import SalaryBreakdown from '../components/salary/SalaryBreakdown';
import SalaryHistory from '../components/salary/SalaryHistory';
import salaryService from '../services/salaryService';
import useAuth from '../hooks/useAuth';
import { downloadSalaryReceipt } from '../utils/salaryReceipt';
import { ArrowLeft, Building2 } from 'lucide-react';
import { getUserBranch } from '../utils/branchUtils';

// Helper to match months (e.g., "October 2026" with "Oct 2026")
const matchesMonth = (m1, m2) => {
  if (!m1 || !m2) return false;
  const s1 = String(m1).trim().toLowerCase();
  const s2 = String(m2).trim().toLowerCase();
  if (s1 === s2) return true;
  const p1 = s1.split(/\s+/);
  const p2 = s2.split(/\s+/);
  if (p1.length >= 2 && p2.length >= 2) {
    const y1 = p1[p1.length - 1];
    const y2 = p2[p2.length - 1];
    if (y1 === y2) {
      return p1[0].slice(0, 3) === p2[0].slice(0, 3);
    }
  }
  return s1.includes(s2) || s2.includes(s1);
};

export default function Salary() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('');

  const currentMonthName = React.useMemo(() => {
    return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, []);

  // Compute available months list (from existing records + recent 12 months)
  const availableMonths = React.useMemo(() => {
    const list = [];
    salaries.forEach(s => {
      if (s.month && !list.some(m => matchesMonth(m, s.month))) {
        list.push(s.month);
      }
    });

    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStr = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      if (!list.some(m => matchesMonth(m, mStr))) {
        list.push(mStr);
      }
    }
    return list;
  }, [salaries]);

  useEffect(() => {
    const fetchMySalaries = async () => {
      try {
        const data = await salaryService.getMySalaries();
        setSalaries(data || []);
      } catch (err) {
        console.error('Failed to fetch salaries:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMySalaries();
  }, []);

  useEffect(() => {
    if (!selectedMonth && availableMonths.length > 0) {
      setSelectedMonth(availableMonths[0]);
    }
  }, [availableMonths, selectedMonth]);

  // Get selected month's salary or default
  const safeNum = (val) => Number(val) || 0;
  const activeSalary = React.useMemo(() => {
    if (!salaries.length) return null;
    if (selectedMonth) {
      const found = salaries.find(s => matchesMonth(s.month, selectedMonth));
      if (found) return found;
    }
    return salaries[salaries.length - 1] || null;
  }, [salaries, selectedMonth]);

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center p-5 text-muted" style={{ minHeight: '300px' }}>
        <div className="spinner-border spinner-border-sm text-danger me-2" role="status" />
        <span>Loading salary data...</span>
      </div>
    );
  }

  const displayPeriod = selectedMonth || (activeSalary?.month) || currentMonthName;

  const summary = activeSalary ? {
    currentMonthSalary: `₹${safeNum(activeSalary.netPayable).toLocaleString()}`,
    payPeriod: displayPeriod,
    amountPaid: `₹${safeNum(activeSalary.amountPaid).toLocaleString()}`,
    amountPaidSubtext: 'Total received this month',
    amountPending: `₹${safeNum(activeSalary.amountPending).toLocaleString()}`,
    amountPendingSubtext: 'Remaining balance',
    workingHours: activeSalary.workingHours ? `${activeSalary.workingHours} hrs` : '160 hrs',
    workingHoursSubtext: activeSalary.workingHoursSubtext || 'Standard monthly quota',
    hourlyRate: activeSalary.hourlyRate ? `₹${activeSalary.hourlyRate}` : '₹' + Math.round(safeNum(activeSalary.baseSalary) / 160).toString(),
    hourlyRateSubtext: activeSalary.hourlyRateSubtext || 'Standard slab rate',
    paymentStatus: activeSalary.status || 'N/A',
    paymentStatusSubtext: activeSalary?.status === 'Disbursed' ? 'Fully paid' : activeSalary?.status === 'Partially Paid' ? 'Installment received' : activeSalary?.status === 'Paid' ? 'Successfully deposited' : 'Pending',
  } : {
    currentMonthSalary: '₹0',
    payPeriod: displayPeriod,
    amountPaid: '₹0',
    amountPaidSubtext: '-',
    amountPending: '₹0',
    amountPendingSubtext: '-',
    workingHours: '0 hrs',
    workingHoursSubtext: '-',
    hourlyRate: '₹0',
    hourlyRateSubtext: '-',
    paymentStatus: 'N/A',
    paymentStatusSubtext: '-'
  };

  const deductions = safeNum(activeSalary?.deductions);
  const pt = Math.min(200, deductions);
  
  const breakdown = activeSalary ? {
    basicSalary: safeNum(activeSalary.baseSalary),
    workingHoursPay: 0,
    overtime: 0,
    allowances: safeNum(activeSalary.allowances),
    deductions: deductions,
    pt: pt,
    otherDeductions: deductions - pt,
    netSalary: safeNum(activeSalary.netPayable),
    workingHours: Math.round(safeNum(activeSalary.workingHours || 160)),
    payPeriod: displayPeriod
  } : {
    basicSalary: 0,
    workingHoursPay: 0,
    overtime: 0,
    allowances: 0,
    deductions: 0,
    pt: 0,
    otherDeductions: 0,
    netSalary: 0,
    workingHours: 0,
    payPeriod: displayPeriod
  };

  const history = salaries.map(s => ({
    month: s.month || 'N/A',
    workingHours: `${Math.round(safeNum(s.workingHours || 160))} hrs`,
    grossSalary: `₹${(safeNum(s.baseSalary) + safeNum(s.allowances)).toLocaleString()}`,
    deductions: safeNum(s.deductions).toLocaleString(),
    netSalary: safeNum(s.netPayable),
    amountPending: safeNum(s.amountPending),
    paymentDate: s.disbursedDate && s.disbursedDate !== '--' ? s.disbursedDate : 'Pending',
    status: s.status || 'Processing',
    installments: s.installments || []
  })).reverse();

  const handleDownloadReceipt = (monthToDownload) => {
    const targetMonth = monthToDownload || selectedMonth || displayPeriod;
    const targetRecord = salaries.find(s => matchesMonth(s.month, targetMonth)) || activeSalary;

    downloadSalaryReceipt({
      month: targetMonth,
      record: targetRecord,
      user: user,
      breakdown: breakdown,
      summary: summary
    });
  };

  return (
    <div className="d-flex flex-column w-100" style={{ gap: '20px', minWidth: 0, boxSizing: 'border-box' }}>
      {/* 1. Page Header */}
      <div className="d-flex align-items-center gap-3 pt-0 pb-0.5">
        <button
          type="button"
          onClick={() => navigate('/teacher/dashboard')}
          className="btn btn-light d-inline-flex align-items-center justify-content-center border shadow-sm"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            borderColor: '#E2E8F0',
            backgroundColor: '#FFFFFF',
            color: '#0F172A',
            padding: 0,
            cursor: 'pointer'
          }}
          aria-label="Back to dashboard"
          title="Back to dashboard"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="d-flex align-items-center justify-content-between flex-grow-1 flex-wrap gap-2">
          <div>
            <h1 className="fw-bold brand-font text-sa-charcoal m-0" style={{ fontSize: '22px', lineHeight: 1.25 }}>
              My Salary
            </h1>
            <p className="text-sa-muted m-0 mt-1" style={{ fontSize: '13.5px' }}>
              View your salary and payment details
            </p>
          </div>
          <span
            className="badge rounded-pill d-inline-flex align-items-center gap-1.5 px-3 py-1.5"
            style={{
              backgroundColor: '#FDF0F0',
              color: '#8B1216',
              border: '1px solid #F5C2C4',
              fontSize: '0.82rem',
              fontWeight: '600'
            }}
          >
            <Building2 size={14} />
            <span>{getUserBranch(user)} Campus</span>
          </span>
        </div>
      </div>

      {/* 2. Top Summary Cards */}
      <SalarySummary summary={summary} />

      {/* 3. Salary Breakdown Card */}
      <SalaryBreakdown
        breakdown={breakdown}
        months={availableMonths}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        onDownloadReceipt={handleDownloadReceipt}
      />

      {/* 4. Salary History Table */}
      <div className="w-100" style={{ marginTop: '8px' }}>
        <SalaryHistory history={history} />
      </div>
    </div>
  );
}
