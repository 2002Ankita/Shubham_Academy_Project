import React, { useState, useEffect } from 'react';
import SalarySummary from '../components/salary/SalarySummary';
import SalaryBreakdown from '../components/salary/SalaryBreakdown';
import SalaryHistory from '../components/salary/SalaryHistory';
import salaryService from '../services/salaryService';

export default function Salary() {
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMySalaries = async () => {
      try {
        // Assume getMySalaries exists in salaryService
        const data = await salaryService.getMySalaries();
        setSalaries(data);
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

  // Get current month's salary (assuming first one or latest one is current)
  const currentSalary = salaries.length > 0 ? salaries[salaries.length - 1] : null;

  const safeNum = (val) => Number(val) || 0;

  const summary = currentSalary ? {
    currentMonthSalary: `₹${safeNum(currentSalary.netPayable).toLocaleString()}`,
    payPeriod: currentSalary.month || 'N/A',
    workingHours: '160 hrs', // Default assumption
    workingHoursSubtext: 'Standard monthly quota',
    hourlyRate: '₹' + Math.round(safeNum(currentSalary.baseSalary) / 160).toString(),
    hourlyRateSubtext: 'Standard slab rate',
    paymentStatus: currentSalary.status || 'N/A',
    paymentStatusSubtext: currentSalary?.status === 'Paid' ? 'Successfully deposited' : 'Disbursement by 5th',
  } : {
    currentMonthSalary: '₹0', payPeriod: 'N/A', workingHours: '0 hrs', workingHoursSubtext: '-', hourlyRate: '₹0', hourlyRateSubtext: '-', paymentStatus: 'N/A', paymentStatusSubtext: '-'
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
    payPeriod: currentSalary.month || 'N/A'
  } : { basicSalary: 0, workingHoursPay: 0, overtime: 0, allowances: 0, deductions: 0, pt: 0, otherDeductions: 0, netSalary: 0, workingHours: 0, payPeriod: 'N/A' };

  const history = salaries.map(s => ({
    month: s.month || 'N/A',
    workingHours: '160 hrs',
    grossSalary: `₹${(safeNum(s.baseSalary) + safeNum(s.allowances)).toLocaleString()}`,
    deductions: safeNum(s.deductions).toLocaleString(),
    netSalary: `₹${safeNum(s.netPayable).toLocaleString()}`,
    paymentDate: s.disbursedDate && s.disbursedDate !== '--' ? s.disbursedDate : 'Pending',
    status: s.status || 'Processing',
  })).reverse();

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

      {/* 3. Salary Breakdown Card */}
      <SalaryBreakdown breakdown={breakdown} />

      {/* 4. Salary History Table */}
      <div className="w-100" style={{ marginTop: '8px' }}>
        <SalaryHistory history={history} />
      </div>
    </div>
  );
}
