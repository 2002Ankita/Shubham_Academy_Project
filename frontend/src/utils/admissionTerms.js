export const ADMISSION_TERMS_AND_CONDITIONS = [
  '1. Admission is provisional until the parent/guardian verifies all inquiry/registration details and accepts these Terms & Conditions.',
  '2. Course fees paid are non-refundable and non-transferable under any circumstances once the batch commences.',
  '3. Minimum 85% attendance in lectures and weekly/monthly tests is mandatory for academic progression and performance reporting.',
  '4. All core academic & contact records (Name, Batch, Campus, Parent Mobile Numbers, Fee Structure) are strictly read-only on the student portal and can only be modified by Academy Management.',
  '5. Any fee concession/discount is subject to final Superadmin approval and timely payment of remaining installments as per the agreed schedule.',
  '6. Parents consent to receive official SMS, WhatsApp, and in-app notifications regarding attendance, lecture schedules, cancellations, exam results, and fee updates on both Father and Mother mobile numbers.',
  '7. Students must adhere to Shubham Academy\'s code of conduct, RFID gate discipline, and campus rules at all times.'
];

export const getAdmissionConfirmUrl = (tokenOrId) => {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/confirm-admission/${encodeURIComponent(tokenOrId || '')}`;
};

export const buildAdmissionConfirmationMessage = (studentData = {}, parentLabel = 'Parent', isWhatsApp = true) => {
  const name = studentData.full_name || studentData.fullName || studentData.name || 'Student';
  const roll = studentData.student_id || studentData.rollNumber || 'Pending';
  const email = studentData.email || '-';
  const studentMobile = studentData.mobile_number || studentData.mobileNumber || studentData.phone || '-';
  const fatherMobile = studentData.father_mobile || studentData.fatherPhone || studentData.parent_mobile || '-';
  const motherMobile = studentData.mother_mobile || studentData.motherPhone || '-';
  const branch = studentData.branch || 'Tarabai Park';
  const program = studentData.admission_type || studentData.admissionType || '11th Standard Only';
  const standard = studentData.standard || '11th Science';
  const batch = studentData.academic_batch || studentData.academicBatch || studentData.batch || '-';
  const session = studentData.session || 'Morning';
  const origFees = Number(studentData.original_fees ?? studentData.originalFees ?? studentData.total_fees ?? 0);
  const discAmt = Number(studentData.discount_amount ?? studentData.discountAmount ?? 0);
  const netFees = Number(studentData.total_fees ?? studentData.totalFees ?? Math.max(0, origFees - discAmt));
  const paidFees = Number(studentData.paid_fees ?? studentData.paidFees ?? 0);
  const remFees = Number(studentData.remaining_fees ?? studentData.remainingFees ?? Math.max(0, netFees - paidFees));
  const token = studentData.admission_confirmation_token || studentData.student_id || studentData.id || '';
  const confirmUrl = getAdmissionConfirmUrl(token);

  if (isWhatsApp) {
    return (
      `*Shubham Academy • Admission Confirmation & Terms Acceptance* 🎓\n\n` +
      `Dear Parent (${parentLabel}),\n` +
      `Please verify the admission & inquiry details filled for your ward and accept the Terms & Conditions to confirm admission:\n\n` +
      `👤 *Student Name:* ${name}\n` +
      `🆔 *Roll / Admission ID:* ${roll}\n` +
      `📧 *Email (User ID):* ${email}\n` +
      `📱 *Student Mobile:* ${studentMobile}\n` +
      `👨 *Father Mobile:* ${fatherMobile}\n` +
      `👩 *Mother Mobile:* ${motherMobile || 'Not provided'}\n` +
      `🏫 *Campus / Branch:* ${branch}\n` +
      `📘 *Program:* ${program}\n` +
      `📚 *Standard / Batch:* ${standard} • ${batch} (${session})\n` +
      `💰 *Gross Fee:* ₹${origFees.toLocaleString()}\n` +
      (discAmt > 0 ? `🏷️ *Recommended Discount:* -₹${discAmt.toLocaleString()}\n` : '') +
      `💵 *Net Payable Fees:* ₹${netFees.toLocaleString()}\n` +
      `✅ *Amount Paid:* ₹${paidFees.toLocaleString()}\n` +
      `⏳ *Remaining Balance:* ₹${remFees.toLocaleString()}\n\n` +
      `📜 *Terms & Conditions Summary:*\n` +
      `• Admission confirms ONLY after parent verification & acceptance.\n` +
      `• Fees once paid are non-refundable & non-transferable.\n` +
      `• Min. 85% attendance is mandatory; core records are read-only.\n\n` +
      `👉 *Review Full Details, Terms & Confirm Admission:*\n${confirmUrl}\n\n` +
      `_Note: Admission status remains PENDING until accepted by the parent._\n` +
      `_Shubham Academy Admissions Office_`
    );
  }

  return `Dear Parent (${parentLabel}), review admission details for ${name} (${roll}, ${standard} - ${batch}, ${branch}, Net Fee: ₹${netFees.toLocaleString()}, Paid: ₹${paidFees.toLocaleString()}, Bal: ₹${remFees.toLocaleString()}) & accept Terms & Conditions to confirm admission: ${confirmUrl} - Shubham Academy`;
};
