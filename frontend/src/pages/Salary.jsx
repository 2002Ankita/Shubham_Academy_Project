import React, { useState, useEffect, useMemo } from 'react';
import SalarySummary from '../components/salary/SalarySummary';
import SalaryBreakdown from '../components/salary/SalaryBreakdown';
import SalaryHistory from '../components/salary/SalaryHistory';
import salaryService from '../services/salaryService';
import useAuth from '../hooks/useAuth';
import { downloadSalaryReceipt } from '../utils/salaryReceipt';

export default function Salary() {
  const { user } = useAuth();
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('October 2026');

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

  const monthOptions = useMemo(() => {
    const defaultMonths = [
      'October 2026',
      'September 2026',
      'August 2026',
      'July 2026',
      'June 2026',
      'May 2026',
      'April 2026',
      'March 2026',
      'February 2026',
      'January 2026'
    ];
    const list = new Set(defaultMonths);
    (salaries || []).forEach((s) => {
      if (s.month) list.add(s.month);
    });
    return Array.from(list);
  }, [salaries]);

  // Find salary matching selected month or fallback
  const currentSalary = useMemo(() => {
    if (!salaries || salaries.length === 0) return null;
    const match = salaries.find(
      (s) => (s.month || '').toLowerCase() === selectedMonth.toLowerCase()
    );
    return match || null;
  }, [salaries, selectedMonth]);

  if (loading) {
    return <div>Loading salary data...</div>;
  }

  const safeNum = (val) => Number(val) || 0;

  const summary = currentSalary ? {
    currentMonthSalary: `₹${safeNum(currentSalary.netPayable).toLocaleString()}`,
    payPeriod: currentSalary.month || selectedMonth || 'N/A',
    workingHours: currentSalary.workingHours ? `${currentSalary.workingHours} hrs` : '160 hrs',
    workingHoursSubtext: currentSalary.workingHoursSubtext || 'Standard monthly quota',
    hourlyRate: currentSalary.hourlyRate ? `₹${currentSalary.hourlyRate}` : '₹' + Math.round(safeNum(currentSalary.baseSalary) / 160).toString(),
    hourlyRateSubtext: currentSalary.hourlyRateSubtext || 'Standard slab rate',
    paymentStatus: currentSalary.status || 'N/A',
    paymentStatusSubtext: currentSalary?.status === 'Paid' ? 'Successfully deposited' : 'Disbursement by 5th',
  } : {
    currentMonthSalary: '₹0',
    payPeriod: selectedMonth || 'N/A',
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
    workingHours: 160,
    payPeriod: currentSalary.month || selectedMonth
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
    payPeriod: selectedMonth
  };

  const history = salaries.map(s => ({
    month: s.month || 'N/A',
    workingHours: '160 hrs',
    grossSalary: `₹${(safeNum(s.baseSalary) + safeNum(s.allowances)).toLocaleString()}`,
    deductions: safeNum(s.deductions).toLocaleString(),
    netSalary: `₹${safeNum(s.netPayable).toLocaleString()}`,
    paymentDate: s.disbursedDate && s.disbursedDate !== '--' ? s.disbursedDate : 'Pending',
    status: s.status || 'Processing',
  })).reverse();

  const handleDownloadReceipt = (monthName) => {
    const target = monthName || selectedMonth;
    const record = salaries.find(
      (s) => (s.month || '').toLowerCase() === (target || '').toLowerCase()
    );
    downloadSalaryReceipt({
      month: target,
      record: record,
      user: user,
      breakdown: breakdown,
      summary: summary
    });
  };

  return (
    <div className="d-flex flex-column w-100" style={{ gap: '20px', minWidth: 0, boxSizing: 'border-box' }}>
      {/* 1. Page Header */}
      <div>
        <h1 className="fw-bold brand-font text-sa-charcoal m-0" style={{ fontSize: '22px', lineHeight: 1.25 }}>
          My Salary
        </h1>
        <p className="text-sa-muted m-0 mt-1" style={{ fontSize: '13.5px' }}>
          View your salary and payment details.
        </p>
      </div>

      {/* 2. Top Summary Cards */}
      <SalarySummary summary={summary} />

      {/* 3. Salary Breakdown Card with Month Selector & Download Monthly Receipt */}
      <SalaryBreakdown
        breakdown={breakdown}
        selectedMonth={selectedMonth}
        onMonthChange={(newMonth) => setSelectedMonth(newMonth)}
        monthOptions={monthOptions}
        onDownloadReceipt={() => handleDownloadReceipt(selectedMonth)}
      />

      {/* 4. Salary History Table */}
      <div className="w-100" style={{ marginTop: '8px' }}>
        <SalaryHistory
          history={history}
          onDownload={(m) => handleDownloadReceipt(m)}
        />
      </div>
    </div>
  );
}
