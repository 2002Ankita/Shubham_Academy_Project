// Teacher Salary & Payroll Demo Data matching the approved dashboard values

export const salarySummary = {
  currentMonthSalary: '₹26,000',
  workingHours: '32.5 hrs',
  hourlyRate: '₹541.67',
  paymentStatus: 'Pending',
  payPeriod: 'September 2026'
};

export const salaryBreakdown = {
  basicSalary: 24000,
  workingHoursPay: 2000,
  overtime: 500,
  allowances: 0,
  deductions: 500,
  netSalary: 26000
};

export const salaryHistory = [
  {
    month: 'September 2026',
    workingHours: '32.5 hrs',
    grossSalary: '₹26,000',
    deductions: '₹500',
    netSalary: '₹25,500',
    paymentDate: 'Pending',
    status: 'Pending'
  },
  {
    month: 'August 2026',
    workingHours: '46 hrs',
    grossSalary: '₹25,000',
    deductions: '₹500',
    netSalary: '₹24,500',
    paymentDate: '05 Sep 2026',
    status: 'Paid'
  },
  {
    month: 'July 2026',
    workingHours: '48 hrs',
    grossSalary: '₹26,000',
    deductions: '₹0',
    netSalary: '₹26,000',
    paymentDate: '05 Aug 2026',
    status: 'Paid'
  },
  {
    month: 'June 2026',
    workingHours: '45 hrs',
    grossSalary: '₹24,500',
    deductions: '₹500',
    netSalary: '₹24,000',
    paymentDate: '05 Jul 2026',
    status: 'Paid'
  },
  {
    month: 'May 2026',
    workingHours: '48 hrs',
    grossSalary: '₹26,000',
    deductions: '₹0',
    netSalary: '₹26,000',
    paymentDate: '05 Jun 2026',
    status: 'Paid'
  }
];
