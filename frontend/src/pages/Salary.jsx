import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SalarySummary from '../components/salary/SalarySummary';
import SalaryBreakdown from '../components/salary/SalaryBreakdown';
import SalaryHistory from '../components/salary/SalaryHistory';
import salaryService from '../services/salaryService';
import useAuth from '../hooks/useAuth';
import { downloadSalaryReceipt } from '../utils/salaryReceipt';
import { ArrowLeft } from 'lucide-react';

export default function Salary() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <div>Loading salary data...</div>;
  }

  // Get current month's salary (assuming latest one is current)
  const currentSalary = salaries.length > 0 ? salaries[salaries.length - 1] : null;
  const currentMonthName = new Date().toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });

  const safeNum = (val) => Number(val) || 0;

  const summary = currentSalary ? {
    currentMonthSalary: `₹${safeNum(currentSalary.netPayable).toLocaleString()}`,
    payPeriod: currentSalary.month || currentMonthName,
    amountPaid: `₹${safeNum(currentSalary.amountPaid).toLocaleString()}`,
    amountPaidSubtext: 'Total received this month',
    amountPending: `₹${safeNum(currentSalary.amountPending).toLocaleString()}`,
    amountPendingSubtext: 'Remaining balance',
    workingHours: currentSalary.workingHours ? `${currentSalary.workingHours} hrs` : '160 hrs',
    workingHoursSubtext: currentSalary.workingHoursSubtext || 'Standard monthly quota',
    hourlyRate: currentSalary.hourlyRate ? `₹${currentSalary.hourlyRate}` : '₹' + Math.round(safeNum(currentSalary.baseSalary) / 160).toString(),
    hourlyRateSubtext: currentSalary.hourlyRateSubtext || 'Standard slab rate',
    paymentStatus: currentSalary.status || 'N/A',
    paymentStatusSubtext: currentSalary?.status === 'Disbursed' ? 'Fully paid' : currentSalary?.status === 'Partially Paid' ? 'Installment received' : currentSalary?.status === 'Paid' ? 'Successfully deposited' : 'Pending',
  } : {
    currentMonthSalary: '₹0',
    payPeriod: currentMonthName,
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

  const deductions = safeNum(currentSalary?.deductions);
  const pt = Math.min(200, deductions);
  
  const breakdown = currentSalary ? {
    basicSalary: safeNum(currentSalary.baseSalary),
    workingHoursPay: 0,
    overtime: 0,
    allowances: safeNum(currentSalary.allowances),
    deductions: deductions,
    pt: pt,
    otherDeductions: deductions - pt,
    netSalary: safeNum(currentSalary.netPayable),
    workingHours: Math.round(safeNum(currentSalary.workingHours || 160)),
    payPeriod: currentSalary.month || currentMonthName
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
    payPeriod: currentMonthName
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

  const handleDownloadReceipt = () => {
    downloadSalaryReceipt({
      month: currentSalary?.month || breakdown?.payPeriod,
      record: currentSalary,
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

        <div>
          <h1 className="fw-bold brand-font text-sa-charcoal m-0" style={{ fontSize: '22px', lineHeight: 1.25 }}>
            My Salary
          </h1>
          <p className="text-sa-muted m-0 mt-1" style={{ fontSize: '13.5px' }}>
            View your salary and payment details
          </p>
        </div>
      </div>

      {/* 2. Top Summary Cards */}
      <SalarySummary summary={summary} />

      {/* 3. Salary Breakdown Card */}
      <SalaryBreakdown
        breakdown={breakdown}
        onDownloadReceipt={handleDownloadReceipt}
      />

      {/* 4. Salary History Table */}
      <div className="w-100" style={{ marginTop: '8px' }}>
        <SalaryHistory history={history} />
      </div>
    </div>
  );
}
