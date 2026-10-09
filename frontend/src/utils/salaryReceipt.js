import { toast } from 'react-toastify';

/**
 * Downloads and prints the official salary receipt for a given month.
 * Implements:
 * 1. Professional printable PDF view (via window.print() formatted document)
 * 2. Formatted receipt file download (.txt)
 */
export const downloadSalaryReceipt = ({
  month,
  record,
  user,
  breakdown,
  summary
}) => {
  const targetMonth = month || record?.month || breakdown?.payPeriod || 'October 2026';
  const teacherName = record?.teacherName || user?.name || 'Dr. Priya Kulkarni';
  const teacherId = record?.teacherId || user?.id || 'TCH-001';
  const designation = user?.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : 'Faculty';
  const subject = record?.subject || 'Academics';

  const safeN = (v) => Number(v) || 0;

  // Extract or calculate values
  let basicSalary = 0;
  let workingHoursPay = 0;
  let overtime = 0;
  let allowances = 0;
  let totalEarnings = 0;
  let pt = 0;
  let leaveDeductions = 0;
  let totalDeductions = 0;
  let netSalary = 0;
  let workingHours = '160 hrs';
  let hourlyRate = '₹0';
  let paymentStatus = 'N/A';
  let paymentDate = '--';
  let transactionRef = 'TXN-' + Math.floor(100000 + Math.random() * 900000);

  if (record) {
    basicSalary = safeN(record.baseSalary);
    allowances = safeN(record.allowances);
    totalDeductions = safeN(record.deductions);
    pt = Math.min(200, totalDeductions);
    leaveDeductions = Math.max(0, totalDeductions - pt);
    netSalary = safeN(record.netPayable);
    totalEarnings = basicSalary + allowances;
    paymentStatus = record.status || 'Paid';
    paymentDate = record.disbursedDate && record.disbursedDate !== '--' ? record.disbursedDate : '05th of Month';
    if (record.transactionRef) transactionRef = record.transactionRef;
    workingHours = record.workingHours ? `${record.workingHours} hrs` : '160 hrs';
    hourlyRate = record.hourlyRate ? `₹${record.hourlyRate}` : (basicSalary > 0 ? `₹${Math.round(basicSalary / 160)}` : '₹0');
  } else if (breakdown) {
    basicSalary = safeN(breakdown.basicSalary);
    workingHoursPay = safeN(breakdown.workingHoursPay);
    overtime = safeN(breakdown.overtime);
    allowances = safeN(breakdown.allowances);
    totalEarnings = basicSalary + workingHoursPay + overtime + allowances;
    pt = safeN(breakdown.pt);
    leaveDeductions = safeN(breakdown.otherDeductions);
    totalDeductions = safeN(breakdown.deductions);
    netSalary = safeN(breakdown.netSalary) || Math.max(0, totalEarnings - totalDeductions);
    workingHours = breakdown.workingHours ? `${breakdown.workingHours} hrs` : (summary?.workingHours || '160 hrs');
    hourlyRate = summary?.hourlyRate || (basicSalary > 0 ? `₹${Math.round(basicSalary / 160)}` : '₹0');
    paymentStatus = summary?.paymentStatus || 'Pending';
    paymentDate = 'Pending';
  }

  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  // 1. Plain Text Format for Direct File Download
  const textContent = `
================================================================================
                               SHUBHAM ACADEMY
                    MONTHLY SALARY RECEIPT / PAYSLIP
================================================================================

1. GENERAL DETAILS:
--------------------------------------------------------------------------------
   Teacher Name         : ${teacherName}
   Teacher ID           : ${teacherId}
   Department / Subject : ${subject}
   Designation          : ${designation}
   Billing Month        : ${targetMonth}
   Receipt Date         : ${currentDate}
   Working Hours        : ${workingHours}
   Hourly Rate          : ${hourlyRate}
   Payment Status       : ${paymentStatus}
   Disbursement Date    : ${paymentDate}
   Transaction Ref      : ${transactionRef}

2. EARNINGS & ADDITIONS:
--------------------------------------------------------------------------------
   Basic Salary                     : ₹${basicSalary.toLocaleString('en-IN')}
   Working Hours Pay                : ₹${workingHoursPay.toLocaleString('en-IN')}
   Overtime / Doubt Sessions        : ₹${overtime.toLocaleString('en-IN')}
   Other Allowances                 : ₹${allowances.toLocaleString('en-IN')}
   -----------------------------------------------------------------------------
   TOTAL EARNINGS                   : ₹${totalEarnings.toLocaleString('en-IN')}

3. DEDUCTIONS & TAXES:
--------------------------------------------------------------------------------
   Professional Tax (PT)            : -₹${pt.toLocaleString('en-IN')}
   Leave Without Pay / Deductions   : -₹${leaveDeductions.toLocaleString('en-IN')}
   -----------------------------------------------------------------------------
   TOTAL DEDUCTIONS                 : -₹${totalDeductions.toLocaleString('en-IN')}

================================================================================
TOTAL NET SALARY PAYABLE            : ₹${netSalary.toLocaleString('en-IN')}
================================================================================

Note: Official system-generated monthly salary receipt from Shubham Academy.
For any queries, please contact the administration office.
================================================================================
`.trim();

  // Trigger text file download
  const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const sanitizedMonth = targetMonth.replace(/\s+/g, '_');
  link.download = `Salary_Receipt_${sanitizedMonth}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  // 2. Open Printable Receipt for Save as PDF
  try {
    const printWindow = window.open('', '_blank', 'width=840,height=900');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Salary_Receipt_${sanitizedMonth}</title>
          <style>
            @page { size: A4 portrait; margin: 15mm; }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              color: #1e293b;
              margin: 0;
              padding: 24px;
              background-color: #ffffff;
            }
            .receipt-container {
              max-width: 720px;
              margin: 0 auto;
              border: 1px solid #e2e8f0;
              padding: 32px;
              border-radius: 8px;
            }
            .header-bar {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #8B151B;
              padding-bottom: 16px;
              margin-bottom: 24px;
            }
            .brand-name {
              font-size: 24px;
              font-weight: 800;
              color: #8B151B;
              letter-spacing: 0.5px;
            }
            .brand-tagline {
              font-size: 11px;
              color: #64748b;
              margin-top: 3px;
            }
            .receipt-badge {
              text-align: right;
            }
            .badge-title {
              font-size: 14px;
              font-weight: 700;
              color: #0f172a;
              background: #f8fafc;
              padding: 4px 12px;
              border: 1px solid #cbd5e1;
              border-radius: 4px;
              display: inline-block;
            }
            .info-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 12px;
              background-color: #f8fafc;
              border: 1px solid #e2e8f0;
              padding: 16px;
              border-radius: 6px;
              margin-bottom: 24px;
              font-size: 13px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              padding: 3px 0;
            }
            .info-label {
              color: #64748b;
            }
            .info-value {
              font-weight: 600;
              color: #0f172a;
            }
            .table-section {
              margin-bottom: 24px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 13px;
            }
            th {
              background-color: #f1f5f9;
              color: #334155;
              text-align: left;
              padding: 8px 12px;
              border: 1px solid #cbd5e1;
              font-weight: 700;
            }
            td {
              padding: 8px 12px;
              border: 1px solid #e2e8f0;
            }
            .amount-col {
              text-align: right;
              font-weight: 600;
            }
            .section-head {
              background-color: #faf5f5;
              color: #8B151B;
              font-weight: 700;
            }
            .total-net-box {
              background-color: #faf5f5;
              border: 2px solid #8B151B;
              padding: 16px 20px;
              border-radius: 6px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 24px;
            }
            .net-label {
              font-size: 14px;
              font-weight: 700;
              color: #0f172a;
            }
            .net-amount {
              font-size: 22px;
              font-weight: 800;
              color: #8B151B;
            }
            .footer-note {
              font-size: 11px;
              color: #64748b;
              text-align: center;
              border-top: 1px dashed #cbd5e1;
              padding-top: 14px;
            }
            .print-btn-bar {
              margin-bottom: 16px;
              text-align: right;
            }
            @media print {
              .print-btn-bar { display: none !important; }
              .receipt-container { border: none; padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="print-btn-bar">
            <button onclick="window.print()" style="padding: 8px 16px; background-color: #8B151B; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; font-size: 13px;">
              Print / Save as PDF
            </button>
          </div>
          <div class="receipt-container">
            <div class="header-bar">
              <div>
                <div class="brand-name">SHUBHAM ACADEMY</div>
                <div class="brand-tagline">Education Builds Brighter Future • Faculty Compensation Statement</div>
              </div>
              <div class="receipt-badge">
                <div class="badge-title">OFFICIAL SALARY RECEIPT</div>
                <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Date: ${currentDate}</div>
              </div>
            </div>

            <div class="info-grid">
              <div class="info-row">
                <span class="info-label">Teacher Name:</span>
                <span class="info-value">${teacherName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Month / Billing Cycle:</span>
                <span class="info-value">${targetMonth}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Teacher ID:</span>
                <span class="info-value">${teacherId}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Working Hours:</span>
                <span class="info-value">${workingHours}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Department:</span>
                <span class="info-value">${subject}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Hourly Rate:</span>
                <span class="info-value">${hourlyRate}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Payment Status:</span>
                <span class="info-value" style="color: ${paymentStatus === 'Paid' ? '#16a34a' : '#d97706'}; font-weight: 700;">${paymentStatus}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Transaction Ref:</span>
                <span class="info-value">${transactionRef}</span>
              </div>
            </div>

            <div class="table-section">
              <table>
                <thead>
                  <tr>
                    <th>Item Description</th>
                    <th class="amount-col" style="width: 150px;">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="section-head">
                    <td colspan="2">A. EARNINGS & ADDITIONS</td>
                  </tr>
                  <tr>
                    <td>Basic Salary</td>
                    <td class="amount-col">₹${basicSalary.toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td>Working Hours Pay</td>
                    <td class="amount-col">₹${workingHoursPay.toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td>Overtime / Doubt Sessions</td>
                    <td class="amount-col">₹${overtime.toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td>Other Allowances</td>
                    <td class="amount-col">₹${allowances.toLocaleString('en-IN')}</td>
                  </tr>
                  <tr style="background-color: #f8fafc; font-weight: 700;">
                    <td>Total Gross Earnings</td>
                    <td class="amount-col">₹${totalEarnings.toLocaleString('en-IN')}</td>
                  </tr>

                  <tr class="section-head">
                    <td colspan="2">B. DEDUCTIONS & TAXES</td>
                  </tr>
                  <tr>
                    <td>Professional Tax (PT)</td>
                    <td class="amount-col" style="color: #dc2626;">-₹${pt.toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td>Leave Without Pay / Deductions</td>
                    <td class="amount-col" style="color: #dc2626;">-₹${leaveDeductions.toLocaleString('en-IN')}</td>
                  </tr>
                  <tr style="background-color: #f8fafc; font-weight: 700;">
                    <td>Total Deductions</td>
                    <td class="amount-col" style="color: #dc2626;">-₹${totalDeductions.toLocaleString('en-IN')}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="total-net-box">
              <div>
                <div class="net-label">FINAL NET SALARY PAYABLE</div>
                <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Calculated for billing period ${targetMonth}</div>
              </div>
              <div class="net-amount">₹${netSalary.toLocaleString('en-IN')}</div>
            </div>

            <div class="footer-note">
              This is a computer-generated salary receipt from Shubham Academy. No signature is required.<br>
              For questions or clarifications, please contact the administration and accounts office.
            </div>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
  } catch (e) {
    console.warn('Print window prevented by browser settings:', e);
  }

  toast.success(`Salary Receipt for ${targetMonth} downloaded successfully!`);
};
