/**
 * Result Export Utility for Shubham Academy
 * Supports exporting individual and consolidated exam results to Excel (.xls) and Word (.doc)
 */

export const exportResultToExcel = (result, studentInfo = {}) => {
  const studentName = result.studentName || studentInfo.full_name || studentInfo.name || 'Aarav Deshmukh';
  const rollNumber = result.rollNumber || studentInfo.rollNumber || studentInfo.student_id || 'SA-2026-0042';
  const examName = result.examName || result.examTitle || 'Academic Assessment';
  const examDate = result.date || 'N/A';
  const subject = result.subject || 'N/A';
  const teacher = result.teacher || 'Faculty';
  const maxMarks = result.maxMarks || 100;
  const obtainedMarks = result.obtainedMarks ?? 0;
  const percentage = result.percentage || ((obtainedMarks / maxMarks) * 100).toFixed(1);
  const grade = result.grade || (obtainedMarks >= 40 ? 'Pass' : 'Fail');
  const remarks = result.remarks || 'Satisfactory performance';
  const isPass = Number(percentage) >= 35;

  const html = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <!--[if gte mso 9]>
  <xml>
    <x:ExcelWorkbook>
      <x:ExcelWorksheets>
        <x:ExcelWorksheet>
          <x:Name>Result_${subject}</x:Name>
          <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
        </x:ExcelWorksheet>
      </x:ExcelWorksheets>
    </x:ExcelWorkbook>
  </xml>
  <![endif]-->
  <style>
    body { font-family: Calibri, Arial, sans-serif; }
    table { border-collapse: collapse; width: 100%; margin-top: 10px; }
    th { background-color: #1e3a8a; color: #ffffff; padding: 10px; border: 1px solid #cbd5e1; text-align: left; }
    td { padding: 9px 12px; border: 1px solid #cbd5e1; }
    .header-main { background-color: #0f172a; color: #ffffff; font-size: 16pt; font-weight: bold; text-align: center; padding: 12px; }
    .header-sub { background-color: #f8fafc; color: #475569; font-size: 10pt; text-align: center; padding: 6px; }
    .prop-name { background-color: #f1f5f9; font-weight: bold; width: 220px; color: #334155; }
    .score-highlight { font-weight: bold; color: #1e3a8a; font-size: 12pt; }
    .status-pass { color: #16a34a; font-weight: bold; }
    .status-fail { color: #dc2626; font-weight: bold; }
  </style>
</head>
<body>
  <table>
    <tr><th colspan="2" class="header-main">SHUBHAM ACADEMY</th></tr>
    <tr><td colspan="2" class="header-sub">Official Student Examination Result Sheet</td></tr>
    <tr><td colspan="2"></td></tr>
    <tr><td class="prop-name">Student Name</td><td><strong>${studentName}</strong></td></tr>
    <tr><td class="prop-name">Roll Number</td><td><strong>${rollNumber}</strong></td></tr>
    <tr><td class="prop-name">Exam Name</td><td><strong>${examName}</strong></td></tr>
    <tr><td class="prop-name">Exam Date</td><td>${examDate}</td></tr>
    <tr><td class="prop-name">Subject</td><td><strong>${subject}</strong></td></tr>
    <tr><td class="prop-name">Subject Teacher / Faculty</td><td>${teacher}</td></tr>
    <tr><td class="prop-name">Maximum Marks</td><td>${maxMarks}</td></tr>
    <tr><td class="prop-name">Marks Obtained</td><td class="score-highlight">${obtainedMarks} / ${maxMarks}</td></tr>
    <tr><td class="prop-name">Percentage</td><td><strong>${percentage}%</strong></td></tr>
    <tr><td class="prop-name">Grade</td><td><strong>${grade}</strong></td></tr>
    <tr><td class="prop-name">Result Status</td><td class="${isPass ? 'status-pass' : 'status-fail'}">${isPass ? 'PASSED' : 'FAILED'}</td></tr>
    <tr><td class="prop-name">Faculty Remarks</td><td>${remarks}</td></tr>
    <tr><td class="prop-name">Report Generated</td><td>${new Date().toLocaleString('en-IN')}</td></tr>
    <tr><td class="prop-name">Institute</td><td>Shubham Academy • Tarabai Park, Kolhapur</td></tr>
  </table>
</body>
</html>
`;

  downloadBlob(html, `${sanitizeName(examName)}_Result.xls`, 'application/vnd.ms-excel;charset=utf-8');
};

export const exportResultToWord = (result, studentInfo = {}) => {
  const studentName = result.studentName || studentInfo.full_name || studentInfo.name || 'Aarav Deshmukh';
  const rollNumber = result.rollNumber || studentInfo.rollNumber || studentInfo.student_id || 'SA-2026-0042';
  const examName = result.examName || result.examTitle || 'Academic Assessment';
  const examDate = result.date || 'N/A';
  const subject = result.subject || 'N/A';
  const teacher = result.teacher || 'Faculty';
  const maxMarks = result.maxMarks || 100;
  const obtainedMarks = result.obtainedMarks ?? 0;
  const percentage = result.percentage || ((obtainedMarks / maxMarks) * 100).toFixed(1);
  const grade = result.grade || (obtainedMarks >= 40 ? 'Pass' : 'Fail');
  const remarks = result.remarks || 'Satisfactory performance';
  const isPass = Number(percentage) >= 35;

  const html = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>Result - ${examName}</title>
  <style>
    body { font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; margin: 40px; color: #1e293b; background-color: #ffffff; }
    .header-card { border-bottom: 3px solid #1e3a8a; padding-bottom: 12px; margin-bottom: 24px; text-align: center; }
    .academy-title { font-size: 26pt; font-weight: bold; color: #1e3a8a; margin: 0; }
    .academy-tagline { font-size: 11pt; color: #64748b; margin-top: 4px; }
    .exam-heading { font-size: 15pt; font-weight: bold; color: #0f172a; margin: 18px 0 6px 0; text-align: center; text-transform: uppercase; letter-spacing: 0.5px; }
    .meta-time { font-size: 9pt; color: #64748b; text-align: center; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    th { background-color: #1e3a8a; color: #ffffff; border: 1px solid #cbd5e1; padding: 10px 14px; text-align: left; font-size: 11pt; }
    td { border: 1px solid #cbd5e1; padding: 10px 14px; font-size: 11pt; }
    .label-cell { background-color: #f8fafc; font-weight: bold; width: 35%; color: #334155; }
    .value-cell { color: #0f172a; }
    .score-txt { color: #1e3a8a; font-weight: bold; font-size: 13pt; }
    .badge-pass { color: #16a34a; font-weight: bold; font-size: 12pt; }
    .badge-fail { color: #dc2626; font-weight: bold; font-size: 12pt; }
    .sign-table { width: 100%; border: none; margin-top: 60px; }
    .footer-note { margin-top: 40px; font-size: 9pt; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 12px; }
  </style>
</head>
<body>
  <div class="header-card">
    <div class="academy-title">SHUBHAM ACADEMY</div>
    <div class="academy-tagline">Excellence in Science, Commerce & Competitive Examination Preparation</div>
    <div class="academy-tagline">Tarabai Park, Kolhapur | Tel: +91 9876543210</div>
  </div>

  <div class="exam-heading">OFFICIAL STUDENT EXAMINATION RESULT SHEET</div>
  <div class="meta-time">Issued on: ${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>

  <table>
    <thead>
      <tr>
        <th colspan="2">ASSESSMENT DETAILS</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="label-cell">Student Name</td>
        <td class="value-cell"><strong>${studentName}</strong></td>
      </tr>
      <tr>
        <td class="label-cell">Roll Number</td>
        <td class="value-cell"><strong>${rollNumber}</strong></td>
      </tr>
      <tr>
        <td class="label-cell">Exam Name</td>
        <td class="value-cell"><strong>${examName}</strong></td>
      </tr>
      <tr>
        <td class="label-cell">Exam Date</td>
        <td class="value-cell">${examDate}</td>
      </tr>
      <tr>
        <td class="label-cell">Subject</td>
        <td class="value-cell"><strong>${subject}</strong></td>
      </tr>
      <tr>
        <td class="label-cell">Subject Teacher / Faculty</td>
        <td class="value-cell"><strong>${teacher}</strong></td>
      </tr>
      <tr>
        <td class="label-cell">Maximum Marks</td>
        <td class="value-cell">${maxMarks}</td>
      </tr>
      <tr>
        <td class="label-cell">Marks Obtained</td>
        <td class="value-cell"><span class="score-txt">${obtainedMarks} / ${maxMarks}</span></td>
      </tr>
      <tr>
        <td class="label-cell">Percentage</td>
        <td class="value-cell"><strong>${percentage}%</strong></td>
      </tr>
      <tr>
        <td class="label-cell">Grade Awarded</td>
        <td class="value-cell"><strong>${grade}</strong></td>
      </tr>
      <tr>
        <td class="label-cell">Result Status</td>
        <td class="value-cell"><span class="${isPass ? 'badge-pass' : 'badge-fail'}">${isPass ? 'PASSED' : 'FAILED'}</span></td>
      </tr>
      <tr>
        <td class="label-cell">Faculty Remarks</td>
        <td class="value-cell">${remarks}</td>
      </tr>
    </tbody>
  </table>

  <table class="sign-table">
    <tr style="border: none;">
      <td style="border: none; width: 50%; padding-top: 30px;">
        <div style="border-top: 1px dashed #64748b; width: 220px; text-align: center; font-size: 10pt; color: #334155; padding-top: 6px;">
          Subject Teacher Signature<br/><strong>(${teacher})</strong>
        </div>
      </td>
      <td style="border: none; width: 50%; text-align: right; padding-top: 30px;">
        <div style="border-top: 1px dashed #64748b; width: 220px; display: inline-block; text-align: center; font-size: 10pt; color: #334155; padding-top: 6px;">
          Authorized Signature<br/><strong>Director, Shubham Academy</strong>
        </div>
      </td>
    </tr>
  </table>

  <div class="footer-note">
    This mark sheet is digitally verified by Shubham Academy Management Portal.
  </div>
</body>
</html>
`;

  downloadBlob(html, `${sanitizeName(examName)}_Result.doc`, 'application/msword;charset=utf-8');
};

export const exportAllResultsToExcel = (resultsList, studentInfo = {}) => {
  const studentName = studentInfo.full_name || studentInfo.name || 'Aarav Deshmukh';
  const rollNumber = studentInfo.rollNumber || studentInfo.student_id || 'SA-2026-0042';

  const rowsHtml = resultsList.map((r, index) => {
    const isPass = Number(r.percentage) >= 35;
    return `
      <tr>
        <td style="text-align:center;">${index + 1}</td>
        <td><strong>${r.examName || r.examTitle}</strong></td>
        <td>${r.date || 'N/A'}</td>
        <td><strong>${r.subject}</strong></td>
        <td>${r.teacher || 'Faculty'}</td>
        <td style="text-align:center;">${r.maxMarks}</td>
        <td style="text-align:center;font-weight:bold;color:#1e3a8a;">${r.obtainedMarks}</td>
        <td style="text-align:center;font-weight:bold;">${r.percentage}%</td>
        <td style="text-align:center;font-weight:bold;">${r.grade}</td>
        <td style="text-align:center;font-weight:bold;color:${isPass ? '#16a34a' : '#dc2626'};">${isPass ? 'PASS' : 'FAIL'}</td>
        <td>${r.remarks || ''}</td>
      </tr>
    `;
  }).join('');

  const html = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Calibri, Arial, sans-serif; }
    table { border-collapse: collapse; width: 100%; }
    th { background-color: #1e3a8a; color: #ffffff; padding: 10px; border: 1px solid #cbd5e1; }
    td { padding: 8px 10px; border: 1px solid #cbd5e1; }
    .header-main { background-color: #0f172a; color: #ffffff; font-size: 16pt; font-weight: bold; text-align: center; padding: 12px; }
    .header-sub { background-color: #f8fafc; color: #475569; font-size: 10pt; text-align: center; padding: 6px; }
  </style>
</head>
<body>
  <table>
    <tr><th colspan="11" class="header-main">SHUBHAM ACADEMY - CONSOLIDATED EXAMINATION MARKSHEET</th></tr>
    <tr><td colspan="11" class="header-sub">Student: ${studentName} | Roll No: ${rollNumber} | Date: ${new Date().toLocaleDateString('en-IN')}</td></tr>
    <tr><td colspan="11"></td></tr>
    <thead>
      <tr>
        <th>#</th>
        <th>Exam Name</th>
        <th>Date</th>
        <th>Subject</th>
        <th>Teacher</th>
        <th>Max Marks</th>
        <th>Obtained</th>
        <th>%</th>
        <th>Grade</th>
        <th>Status</th>
        <th>Remarks</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>
</body>
</html>
`;

  downloadBlob(html, `Shubham_Academy_MarkSheets_${rollNumber}.xls`, 'application/vnd.ms-excel;charset=utf-8');
};

export const exportAllResultsToWord = (resultsList, studentInfo = {}) => {
  const studentName = studentInfo.full_name || studentInfo.name || 'Aarav Deshmukh';
  const rollNumber = studentInfo.rollNumber || studentInfo.student_id || 'SA-2026-0042';

  const rowsHtml = resultsList.map((r, index) => {
    const isPass = Number(r.percentage) >= 35;
    return `
      <tr>
        <td style="text-align:center;border:1px solid #cbd5e1;padding:8px;">${index + 1}</td>
        <td style="border:1px solid #cbd5e1;padding:8px;"><strong>${r.examName || r.examTitle}</strong></td>
        <td style="border:1px solid #cbd5e1;padding:8px;">${r.date || 'N/A'}</td>
        <td style="border:1px solid #cbd5e1;padding:8px;"><strong>${r.subject}</strong></td>
        <td style="border:1px solid #cbd5e1;padding:8px;">${r.teacher || 'Faculty'}</td>
        <td style="text-align:center;border:1px solid #cbd5e1;padding:8px;">${r.maxMarks}</td>
        <td style="text-align:center;font-weight:bold;color:#1e3a8a;border:1px solid #cbd5e1;padding:8px;">${r.obtainedMarks}</td>
        <td style="text-align:center;font-weight:bold;border:1px solid #cbd5e1;padding:8px;">${r.percentage}%</td>
        <td style="text-align:center;font-weight:bold;border:1px solid #cbd5e1;padding:8px;">${r.grade}</td>
        <td style="text-align:center;font-weight:bold;color:${isPass ? '#16a34a' : '#dc2626'};border:1px solid #cbd5e1;padding:8px;">${isPass ? 'PASS' : 'FAIL'}</td>
      </tr>
    `;
  }).join('');

  const html = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>Consolidated Results - ${studentName}</title>
  <style>
    body { font-family: 'Calibri', Arial, sans-serif; margin: 30px; color: #1e293b; }
    .header-card { border-bottom: 3px solid #1e3a8a; padding-bottom: 10px; margin-bottom: 20px; text-align: center; }
    .academy-title { font-size: 24pt; font-weight: bold; color: #1e3a8a; margin: 0; }
    .academy-tagline { font-size: 10pt; color: #64748b; margin-top: 4px; }
    .exam-heading { font-size: 15pt; font-weight: bold; color: #0f172a; margin: 15px 0 5px 0; text-align: center; }
    .meta-time { font-size: 9pt; color: #64748b; text-align: center; margin-bottom: 15px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th { background-color: #1e3a8a; color: #ffffff; border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; font-size: 10pt; }
    td { font-size: 10pt; }
    .footer-note { margin-top: 30px; font-size: 9pt; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 10px; }
  </style>
</head>
<body>
  <div class="header-card">
    <div class="academy-title">SHUBHAM ACADEMY</div>
    <div class="academy-tagline">Official Student Academic Consolidated Transcript</div>
    <div class="academy-tagline">Student: <strong>${studentName}</strong> (Roll: ${rollNumber}) | Tarabai Park, Kolhapur</div>
  </div>

  <div class="exam-heading">PUBLISHED EXAMINATION RECORDS & MARK SHEETS</div>
  <div class="meta-time">Generated on: ${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>

  <table>
    <thead>
      <tr>
        <th style="text-align:center;">#</th>
        <th>Exam Name</th>
        <th>Date</th>
        <th>Subject</th>
        <th>Teacher</th>
        <th style="text-align:center;">Max</th>
        <th style="text-align:center;">Marks</th>
        <th style="text-align:center;">%</th>
        <th style="text-align:center;">Grade</th>
        <th style="text-align:center;">Status</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <div class="footer-note">
    Digitally issued by Shubham Academy Management Portal.
  </div>
</body>
</html>
`;

  downloadBlob(html, `Shubham_Academy_MarkSheets_${rollNumber}.doc`, 'application/msword;charset=utf-8');
};

export const exportExamFullMarkSheet = (examRow, studentUser = {}) => {
  const currentStudentName = studentUser?.full_name || studentUser?.name || 'Aarav Deshmukh';
  const currentRollNumber = studentUser?.rollNumber || studentUser?.student_id || 'SA-2026-0042';

  const examName = examRow.examName || examRow.examTitle || 'Mid-Term Assessment';
  const examDate = examRow.date || 'N/A';
  const subject = examRow.subject || 'General';
  const teacher = examRow.teacher || 'Faculty';
  const maxMarks = Number(examRow.maxMarks) || 100;
  const fileType = (examRow.fileType || 'excel').toLowerCase();

  // Full batch / class student list
  const classStudents = [
    { rollNo: 'SA-2026-0041', name: 'Aditya Kulkarni', marks: Math.round(maxMarks * 0.82), remarks: 'Good grasp of fundamentals' },
    { rollNo: currentRollNumber, name: currentStudentName, marks: Number(examRow.obtainedMarks) || Math.round(maxMarks * 0.94), remarks: examRow.remarks || 'Outstanding problem solving and accuracy' },
    { rollNo: 'SA-2026-0043', name: 'Ananya Joshi', marks: Math.round(maxMarks * 0.90), remarks: 'Consistent and attentive' },
    { rollNo: 'SA-2026-0044', name: 'Neha Jadhav', marks: Math.round(maxMarks * 0.74), remarks: 'Needs more practice on numericals' },
    { rollNo: 'SA-2026-0045', name: 'Priya Patil', marks: Math.round(maxMarks * 0.91), remarks: 'Very strong conceptual clarity' },
    { rollNo: 'SA-2026-0046', name: 'Rohan Sharma', marks: Math.round(maxMarks * 0.86), remarks: 'Good work, keep improving' },
    { rollNo: 'SA-2026-0047', name: 'Sanket Shinde', marks: Math.round(maxMarks * 0.96), remarks: 'Outstanding marks, highest in section' },
    { rollNo: 'SA-2026-0048', name: 'Sneha Deshmukh', marks: Math.round(maxMarks * 0.88), remarks: 'Neat work and correct methodology' },
    { rollNo: 'SA-2026-0049', name: 'Tejas Mane', marks: Math.round(maxMarks * 0.83), remarks: 'Satisfactory performance' },
    { rollNo: 'SA-2026-0050', name: 'Vaishnavi More', marks: Math.round(maxMarks * 0.79), remarks: 'Revise formulas thoroughly' }
  ];

  if (fileType === 'word') {
    // Generate Word Document (.doc)
    const rowsHtml = classStudents.map((st, idx) => {
      const pct = ((st.marks / maxMarks) * 100).toFixed(1);
      const isPass = Number(pct) >= 35;
      const grade = Number(pct) >= 90 ? 'A+' : Number(pct) >= 80 ? 'A' : Number(pct) >= 70 ? 'B' : Number(pct) >= 60 ? 'C' : 'D';
      const isCurrent = st.name === currentStudentName || st.rollNo === currentRollNumber;
      return `
        <tr style="${isCurrent ? 'background-color:#eff6ff;' : ''}">
          <td style="border:1px solid #cbd5e1;padding:8px;text-align:center;">${idx + 1}</td>
          <td style="border:1px solid #cbd5e1;padding:8px;font-weight:bold;">${st.rollNo}</td>
          <td style="border:1px solid #cbd5e1;padding:8px;">${isCurrent ? `<strong>${st.name} (YOU)</strong>` : st.name}</td>
          <td style="border:1px solid #cbd5e1;padding:8px;text-align:center;font-weight:bold;color:#1e3a8a;">${st.marks}</td>
          <td style="border:1px solid #cbd5e1;padding:8px;text-align:center;">${maxMarks}</td>
          <td style="border:1px solid #cbd5e1;padding:8px;text-align:center;font-weight:bold;">${pct}%</td>
          <td style="border:1px solid #cbd5e1;padding:8px;text-align:center;font-weight:bold;">${grade}</td>
          <td style="border:1px solid #cbd5e1;padding:8px;text-align:center;font-weight:bold;color:${isPass ? '#16a34a' : '#dc2626'};">${isPass ? 'PASS' : 'FAIL'}</td>
          <td style="border:1px solid #cbd5e1;padding:8px;font-size:9pt;">${st.remarks}</td>
        </tr>
      `;
    }).join('');

    const wordHtml = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>${examName} - Full Mark Sheet</title>
  <style>
    body { font-family: 'Calibri', Arial, sans-serif; margin: 30px; color: #1e293b; }
    .header-card { border-bottom: 3px solid #1e3a8a; padding-bottom: 10px; margin-bottom: 16px; text-align: center; }
    .title { font-size: 24pt; font-weight: bold; color: #1e3a8a; margin: 0; }
    .subtitle { font-size: 10.5pt; color: #64748b; margin-top: 4px; }
    .exam-info { margin: 15px 0; background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 6px; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    th { background-color: #1e3a8a; color: white; border: 1px solid #cbd5e1; padding: 8px; font-size: 10pt; text-align: left; }
    td { font-size: 10pt; }
  </style>
</head>
<body>
  <div class="header-card">
    <div class="title">SHUBHAM ACADEMY</div>
    <div class="subtitle">Tarabai Park, Kolhapur | Official Examination Results List</div>
  </div>

  <div class="exam-info">
    <p style="margin:4px 0;"><strong>Examination:</strong> ${examName}</p>
    <p style="margin:4px 0;"><strong>Subject:</strong> ${subject} | <strong>Date:</strong> ${examDate} | <strong>Total Marks:</strong> ${maxMarks}</p>
    <p style="margin:4px 0;"><strong>Subject Teacher / Evaluator:</strong> ${teacher}</p>
  </div>

  <p style="font-size:9.5pt;color:#64748b;margin-bottom:8px;">* Students can find their name in the table below to check their marks.</p>

  <table>
    <thead>
      <tr>
        <th style="text-align:center;">#</th>
        <th>Roll No</th>
        <th>Student Name</th>
        <th style="text-align:center;">Marks</th>
        <th style="text-align:center;">Total</th>
        <th style="text-align:center;">%</th>
        <th style="text-align:center;">Grade</th>
        <th style="text-align:center;">Status</th>
        <th>Remarks</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <table style="width:100%;border:none;margin-top:50px;">
    <tr style="border:none;">
      <td style="border:none;width:50%;padding-top:20px;">
        <div style="border-top:1px dashed #64748b;width:200px;text-align:center;font-size:9.5pt;color:#334155;">
          Subject Teacher<br/><strong>(${teacher})</strong>
        </div>
      </td>
      <td style="border:none;width:50%;text-align:right;padding-top:20px;">
        <div style="border-top:1px dashed #64748b;width:200px;display:inline-block;text-align:center;font-size:9.5pt;color:#334155;">
          Principal / Director<br/><strong>Shubham Academy</strong>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
`;
    downloadBlob(wordHtml, `${sanitizeName(examName)}_Full_MarkSheet.doc`, 'application/msword;charset=utf-8');
  } else {
    // Generate Excel Spreadsheet (.xls)
    const rowsHtml = classStudents.map((st, idx) => {
      const pct = ((st.marks / maxMarks) * 100).toFixed(1);
      const isPass = Number(pct) >= 35;
      const grade = Number(pct) >= 90 ? 'A+' : Number(pct) >= 80 ? 'A' : Number(pct) >= 70 ? 'B' : Number(pct) >= 60 ? 'C' : 'D';
      const isCurrent = st.name === currentStudentName || st.rollNo === currentRollNumber;
      return `
        <tr style="${isCurrent ? 'background-color:#dbeafe;' : ''}">
          <td style="text-align:center;">${idx + 1}</td>
          <td><strong>${st.rollNo}</strong></td>
          <td>${isCurrent ? `<strong>${st.name} (YOU)</strong>` : st.name}</td>
          <td style="text-align:center;font-weight:bold;color:#1e3a8a;">${st.marks}</td>
          <td style="text-align:center;">${maxMarks}</td>
          <td style="text-align:center;font-weight:bold;">${pct}%</td>
          <td style="text-align:center;font-weight:bold;">${grade}</td>
          <td style="text-align:center;font-weight:bold;color:${isPass ? '#16a34a' : '#dc2626'};">${isPass ? 'PASS' : 'FAIL'}</td>
          <td>${st.remarks}</td>
        </tr>
      `;
    }).join('');

    const excelHtml = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <!--[if gte mso 9]>
  <xml>
    <x:ExcelWorkbook>
      <x:ExcelWorksheets>
        <x:ExcelWorksheet>
          <x:Name>MarkSheet</x:Name>
          <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
        </x:ExcelWorksheet>
      </x:ExcelWorksheets>
    </x:ExcelWorkbook>
  </xml>
  <![endif]-->
  <style>
    body { font-family: Calibri, Arial, sans-serif; }
    table { border-collapse: collapse; width: 100%; }
    th { background-color: #1e3a8a; color: #ffffff; padding: 10px; border: 1px solid #cbd5e1; }
    td { padding: 8px 10px; border: 1px solid #cbd5e1; }
    .header-main { background-color: #0f172a; color: #ffffff; font-size: 16pt; font-weight: bold; text-align: center; padding: 12px; }
    .header-sub { background-color: #f1f5f9; color: #334155; font-size: 11pt; text-align: center; padding: 6px; }
  </style>
</head>
<body>
  <table>
    <tr><th colspan="9" class="header-main">SHUBHAM ACADEMY - BATCH MARKSHEET</th></tr>
    <tr><td colspan="9" class="header-sub">Exam: ${examName} | Subject: ${subject} | Date: ${examDate} | Teacher: ${teacher} | Total Marks: ${maxMarks}</td></tr>
    <tr><td colspan="9" style="font-size:10pt;color:#64748b;padding:6px;">* Search your name below to check your marks.</td></tr>
    <thead>
      <tr>
        <th>#</th>
        <th>Roll No</th>
        <th>Student Name</th>
        <th>Marks Obtained</th>
        <th>Total Marks</th>
        <th>Percentage</th>
        <th>Grade</th>
        <th>Status</th>
        <th>Remarks</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>
</body>
</html>
`;
    downloadBlob(excelHtml, `${sanitizeName(examName)}_Full_MarkSheet.xls`, 'application/vnd.ms-excel;charset=utf-8');
  }
};

function downloadBlob(content, fileName, mimeType) {
  const blob = new Blob(['\ufeff' + content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function sanitizeName(name) {
  return (name || 'Exam').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 40);
}
