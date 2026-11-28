import * as XLSX from 'xlsx';

/**
 * Utility to export academy datasets to Excel (.xlsx) spreadsheets
 * with formatted headers, auto-adjusted column widths, and metadata.
 */

export function exportToExcel({
  filename = 'Shubham_Classes_Report',
  sheetName = 'Report Data',
  title = 'SHUBHAM CLASSES - KOLHAPUR',
  subtitle = 'OFFICIAL ACADEMY AUDIT REPORT',
  campus = 'All Campuses (Consolidated)',
  headers = [],
  rows = [],
  summaryRows = []
}) {
  try {
    const wb = XLSX.utils.book_new();

    // Build structured worksheet rows
    const wsData = [
      [title],
      [subtitle],
      [`Generated: ${new Date().toLocaleString('en-GB')} | Campus: ${campus}`],
      [], // blank line
      headers,
      ...rows
    ];

    if (summaryRows && summaryRows.length > 0) {
      wsData.push([]);
      summaryRows.forEach(sr => wsData.push(sr));
    }

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Auto-calculate column widths
    const colWidths = headers.map((h, colIdx) => {
      let maxLen = String(h || '').length;
      rows.forEach(r => {
        const val = r[colIdx];
        if (val !== undefined && val !== null) {
          const len = String(val).length;
          if (len > maxLen) maxLen = len;
        }
      });
      return { wch: Math.min(Math.max(maxLen + 3, 12), 45) };
    });
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));

    const finalFileName = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
    XLSX.writeFile(wb, finalFileName);
    return true;
  } catch (err) {
    console.error('Error generating Excel report:', err);
    throw err;
  }
}

/**
 * Standardized Export Helpers for Academy Modules
 */

export function exportStudentsToExcel(students = [], campus = 'All Campuses') {
  const headers = [
    'Roll Number',
    'Student Name',
    'Standard',
    'Academic Batch',
    'Campus Branch',
    'Parent Mobile',
    'Admission Date',
    'Total Fees (₹)',
    'Fees Paid (₹)',
    'Balance Dues (₹)',
    'Admission Approval Status'
  ];

  const rows = students.map(s => [
    s.rollNumber || s.roll_number || s.student_id || 'N/A',
    s.name || s.full_name || 'N/A',
    s.standard || 'General',
    s.academic_batch || s.batch || 'Regular',
    s.branch || campus,
    s.parentMobile || s.parent_mobile || s.contact_number || 'N/A',
    s.admission_date ? new Date(s.admission_date).toLocaleDateString('en-GB') : 'N/A',
    Number(s.totalFees || s.total_fees || 0),
    Number(s.amountPaid || s.paid_fees || 0),
    Number(s.pendingFees || s.balance_due || Math.max(0, (s.totalFees || s.total_fees || 0) - (s.amountPaid || s.paid_fees || 0))),
    s.admission_approval_status || (s.admission_confirmation_status === 'CONFIRMED' ? 'Approved' : 'Pending Super Admin')
  ]);

  const totalFee = rows.reduce((acc, r) => acc + (Number(r[7]) || 0), 0);
  const totalPaid = rows.reduce((acc, r) => acc + (Number(r[8]) || 0), 0);
  const totalDues = rows.reduce((acc, r) => acc + (Number(r[9]) || 0), 0);

  const summary = [
    ['TOTAL STUDENTS:', rows.length, '', '', '', '', 'SUMMARY TOTALS:', totalFee, totalPaid, totalDues, '']
  ];

  return exportToExcel({
    filename: `Shubham_Classes_Kolhapur_Students_${new Date().toISOString().slice(0, 10)}`,
    sheetName: 'Students Directory',
    title: 'SHUBHAM CLASSES - KOLHAPUR',
    subtitle: 'STUDENT ROSTER & FEE LEDGER AUDIT',
    campus,
    headers,
    rows,
    summaryRows: summary
  });
}

export function exportFeesToExcel(payments = [], campus = 'All Campuses') {
  const headers = [
    'Receipt / Txn ID',
    'Student Name',
    'Roll Number',
    'Campus Branch',
    'Amount Paid (₹)',
    'Payment Mode',
    'Payment Date',
    'Fee Head / Category',
    'Academic Year',
    'Balance Remaining (₹)'
  ];

  const rows = payments.map(p => [
    p.transactionId || p.transaction_reference || p.receiptNumber || p.id || 'TXN',
    p.studentName || p.student_name || 'Student',
    p.rollNumber || p.roll_number || 'N/A',
    p.branch || campus,
    Number(p.amountPaid || p.amount || p.amount_paid || 0),
    p.paymentMode || p.payment_method || 'Cash / Counter',
    p.paymentDate || p.payment_date || p.date || new Date().toISOString().slice(0, 10),
    p.feeHead || p.fee_category || p.remarks || 'Tuition & Coaching Fee',
    p.academicYear || p.academic_year || '2026-2027',
    Number(p.pendingAmount || p.pending_fees || 0)
  ]);

  const totalCollected = rows.reduce((acc, r) => acc + (Number(r[4]) || 0), 0);
  const summary = [
    ['TOTAL RECEIPTS:', rows.length, '', 'TOTAL COLLECTED:', totalCollected, '', '', '', '', '']
  ];

  return exportToExcel({
    filename: `Shubham_Classes_Kolhapur_Fees_Collection_${new Date().toISOString().slice(0, 10)}`,
    sheetName: 'Fee Collections',
    title: 'SHUBHAM CLASSES - KOLHAPUR',
    subtitle: 'FEE COLLECTIONS & AUDIT REGISTER',
    campus,
    headers,
    rows,
    summaryRows: summary
  });
}

export function exportSalariesToExcel(salaries = [], campus = 'All Campuses') {
  const headers = [
    'Faculty / Staff Name',
    'Campus Branch',
    'Salary Month',
    'Base Salary (₹)',
    'Working Hours',
    'Recovery / Deduction (₹)',
    'Net Payable (₹)',
    'Amount Paid (₹)',
    'Payment Mode',
    'Account Type',
    'Status'
  ];

  const rows = salaries.map(s => [
    s.teacherName || s.teacher_name || 'Faculty',
    s.branch || campus,
    s.month || 'Current Month',
    Number(s.baseSalary || s.yearlySalary || 0),
    Number(s.workingHours || 0),
    Number(s.recovery || 0),
    Number(s.netPayable || s.amount || 0),
    Number(s.amountPaid || s.amount || 0),
    s.paymentMode || 'NEFT',
    s.accountType || 'Academy Account',
    s.status || 'Disbursed'
  ]);

  const totalPaid = rows.reduce((acc, r) => acc + (Number(r[7]) || 0), 0);
  const summary = [
    ['TOTAL FACULTY PROCESSED:', rows.length, '', '', '', 'TOTAL DISBURSED:', '', totalPaid, '', '', '']
  ];

  return exportToExcel({
    filename: `Shubham_Classes_Kolhapur_Faculty_Payroll_${new Date().toISOString().slice(0, 10)}`,
    sheetName: 'Faculty Payroll',
    title: 'SHUBHAM CLASSES - KOLHAPUR',
    subtitle: 'FACULTY SALARY & DISBURSEMENT AUDIT',
    campus,
    headers,
    rows,
    summaryRows: summary
  });
}

export function exportDiscountsToExcel(discounts = [], campus = 'All Campuses') {
  const headers = [
    'Roll Number',
    'Student Name',
    'Standard',
    'Campus Branch',
    'Original Fees (₹)',
    'Concession Amount (₹)',
    'Concession %',
    'Net Fees (₹)',
    'Reason / Justification',
    'Approval Status',
    'Approved By',
    'Approval Date'
  ];

  const rows = discounts.map(d => {
    const orig = Number(d.originalFees || d.totalFees || 0);
    const disc = Number(d.discountAmount || d.discountRequestedAmount || 0);
    const pct = orig > 0 ? ((disc / orig) * 100).toFixed(1) + '%' : '0%';
    return [
      d.rollNumber || d.roll_number || 'N/A',
      d.name || d.student_name || 'Student',
      d.standard || 'General',
      d.branch || campus,
      orig,
      disc,
      pct,
      Math.max(0, orig - disc),
      d.discountReason || 'Fee Concession',
      d.discountStatus || 'PENDING',
      d.discountApprovedBy || d.discountOfferedBy || 'Pending',
      d.discountApprovedAt ? new Date(d.discountApprovedAt).toLocaleDateString('en-GB') : 'N/A'
    ];
  });

  const totalConcession = rows.reduce((acc, r) => acc + (Number(r[5]) || 0), 0);
  const summary = [
    ['TOTAL CONCESSIONS LISTED:', rows.length, '', '', 'TOTAL CONCESSION VALUE:', totalConcession, '', '', '', '', '', '']
  ];

  return exportToExcel({
    filename: `Shubham_Classes_Kolhapur_Fee_Concessions_${new Date().toISOString().slice(0, 10)}`,
    sheetName: 'Fee Concessions',
    title: 'SHUBHAM CLASSES - KOLHAPUR',
    subtitle: 'STUDENT FEE CONCESSIONS & APPROVALS AUDIT',
    campus,
    headers,
    rows,
    summaryRows: summary
  });
}
