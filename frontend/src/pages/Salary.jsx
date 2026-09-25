import React from 'react';
import SalarySummary from '../components/salary/SalarySummary';
import SalaryBreakdown from '../components/salary/SalaryBreakdown';
import SalaryHistory from '../components/salary/SalaryHistory';
import { salarySummary, salaryBreakdown, salaryHistory } from '../data/salaryData';

export default function Salary() {
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
      <SalarySummary summary={salarySummary} />

      {/* 3. Salary Breakdown Card */}
      <SalaryBreakdown breakdown={salaryBreakdown} />

      {/* 4. Salary History Table */}
      <div className="w-100" style={{ marginTop: '8px' }}>
        <SalaryHistory history={salaryHistory} />
      </div>
    </div>
  );
}
