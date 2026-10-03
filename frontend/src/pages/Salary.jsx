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

  const summary = currentSalary ? {
    currentMonthSalary: `₹${currentSalary.netPayable.toLocaleString()}`,
    payPeriod: currentSalary.month,
    workingHours: '160 hrs', // Default, could be calculated
    hourlyRate: '₹' + Math.round(currentSalary.baseSalary / 160).toString(),
    paymentStatus: currentSalary.status,
  } : {
    currentMonthSalary: '₹0', payPeriod: 'N/A', workingHours: '0 hrs', hourlyRate: '₹0', paymentStatus: 'N/A'
  };

  const breakdown = currentSalary ? {
    basicPay: `₹${currentSalary.baseSalary.toLocaleString()}`,
    allowance: `₹${currentSalary.allowances.toLocaleString()}`,
    taxDeduction: `₹${currentSalary.deductions.toLocaleString()}`,
    netPayable: `₹${currentSalary.netPayable.toLocaleString()}`,
  } : { basicPay: '₹0', allowance: '₹0', taxDeduction: '₹0', netPayable: '₹0' };

  const history = salaries.map(s => ({
    month: s.month,
    workingHours: '160 hrs',
    grossSalary: `₹${(s.baseSalary + s.allowances).toLocaleString()}`,
    deductions: s.deductions.toLocaleString(),
    netSalary: `₹${s.netPayable.toLocaleString()}`,
    paymentDate: s.disbursedDate !== '--' ? s.disbursedDate : 'Pending',
    status: s.status,
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
