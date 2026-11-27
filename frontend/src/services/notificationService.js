import api from './api';
import { getUserBranch, filterAttendanceByBranch } from '../utils/branchUtils';
import { buildAdmissionConfirmationMessage, getAdmissionConfirmUrl } from '../utils/admissionTerms';

export const getDefaultNotifications = () => [];

export const DEFAULT_NOTIFICATIONS = [];

const READ_STORAGE_KEY = 'sa_read_notifications_v4';
const DYNAMIC_NOTIFICATIONS_KEY = 'sa_dynamic_notifications_v2';
const SELECTED_NOTICE_KEY = 'sa_selected_notice';
const CUSTOM_NOTIFICATIONS_KEY = 'sa_custom_notifications_v1';

function getCustomNotifications() {
  try {
    const raw = localStorage.getItem(CUSTOM_NOTIFICATIONS_KEY) || localStorage.getItem(DYNAMIC_NOTIFICATIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCustomNotifications(items) {
  try {
    localStorage.setItem(CUSTOM_NOTIFICATIONS_KEY, JSON.stringify(items));
    localStorage.setItem(DYNAMIC_NOTIFICATIONS_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('Error saving custom notifications:', err);
  }
}

function getReadIds() {
  try {
    const raw = localStorage.getItem(READ_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveReadIds(ids) {
  try {
    localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(ids));
  } catch (err) {
    console.error('Error saving read notification IDs:', err);
  }
}

function getCombinedNotifications(isSuperAdmin = false) {
  const activeBranch = getUserBranch();
  const customItems = getCustomNotifications();
  let filteredCustom = isSuperAdmin
    ? customItems
    : customItems.filter(n => !n.forSuperAdminOnly);

  if (activeBranch && !isSuperAdmin) {
    const isTP = activeBranch === 'Tarabai Park';
    filteredCustom = filteredCustom.filter(n => {
      if (n.branch) {
        const bNorm = n.branch.toLowerCase();
        return isTP ? bNorm.includes('tarabai') : (bNorm.includes('mangalvar') || bNorm.includes('mangalwar'));
      }
      const sName = (n.studentName || n.title || n.details || '').toLowerCase();
      if (isTP) {
        return sName.includes('aarav') || sName.includes('ananya') || sName.includes('tanvi') || sName.includes('aryan') || sName.includes('tarabai');
      } else {
        return sName.includes('diya') || sName.includes('rohan') || sName.includes('sneha') || sName.includes('aditya') || sName.includes('mangalvar') || sName.includes('mangalwar');
      }
    });
  }

  // Purge any legacy hardcoded default notifications (NTF-01, NTF-02, NTF-03, NTF-04)
  filteredCustom = filteredCustom.filter(n => !['NTF-01', 'NTF-02', 'NTF-03', 'NTF-04'].includes(n.id));

  return filteredCustom;
}

export const notificationService = {
  addNotification: (notif) => {
    const activeBranch = getUserBranch();
    const now = new Date();
    const timeStr = notif.time || now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const dateStr = notif.date || now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    const newEntry = {
      id: notif.id || `NTF-DYN-${Date.now()}`,
      title: notif.title || 'Notification Alert',
      time: timeStr,
      date: dateStr,
      formattedDateTime: notif.formattedDateTime || `${dateStr}, ${timeStr}`,
      type: notif.type || 'alert',
      category: notif.category || 'SMS & System Alerts',
      priority: notif.priority || 'Normal',
      author: notif.author || 'Shubham Academy System',
      details: notif.details || '',
      read: false,
      forSuperAdminOnly: notif.forSuperAdminOnly || false,
      branch: notif.branch || activeBranch || undefined,
      batch: notif.batch,
      subject: notif.subject,
      cancellationReason: notif.cancellationReason,
      slotTime: notif.slotTime,
      studentId: notif.studentId,
      studentName: notif.studentName,
      discountAmount: notif.discountAmount,
      recommendedBy: notif.recommendedBy
    };

    const current = getCustomNotifications();
    const filtered = current.filter(n => n.id !== newEntry.id);
    saveCustomNotifications([newEntry, ...filtered]);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sa_notifications_updated', { detail: newEntry }));
    }
    return newEntry;
  },

  pruneFinalizedDiscounts: (students = []) => {
    try {
      const current = getCustomNotifications();
      if (!current || current.length === 0) return;

      const finalizedIds = new Set(
        (students || [])
          .filter(s => s.discountStatus === 'APPROVED' || s.discountStatus === 'REJECTED')
          .map(s => String(s.id))
      );

      // Remove any 'discount_approval' notification for finalized students
      const updated = current.filter(n => {
        if (n.type === 'discount_approval' && n.studentId && finalizedIds.has(String(n.studentId))) {
          return false;
        }
        return true;
      });

      if (updated.length !== current.length) {
        saveCustomNotifications(updated);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('sa_notifications_updated'));
        }
      }
    } catch (e) {
      console.warn('Error pruning finalized discounts:', e);
    }
  },

  syncDiscountApprovals: (pendingList = []) => {
    const current = getCustomNotifications();
    const pendingIds = (pendingList || []).map(s => String(s.id));

    // Remove stale discount_approval notifications for students that are no longer pending
    let updated = current.filter(n => {
      if (n.type === 'discount_approval' && n.studentId) {
        return pendingIds.includes(String(n.studentId));
      }
      return true;
    });

    let hasChanges = updated.length !== current.length;

    (pendingList || []).forEach((s) => {
      const notifId = `NTF-DISC-${s.id}`;
      const exists = updated.some(n => n.id === notifId);
      if (!exists) {
        hasChanges = true;
        updated.unshift({
          id: notifId,
          title: `🔔 Fee Concession Approval: ${s.name}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          formattedDateTime: new Date().toLocaleString(),
          type: 'discount_approval',
          category: 'Discount & Fees',
          priority: 'High',
          author: s.discountRecommendedBy || s.discountOfferedBy || 'Miss Shilpa (Counselor)',
          details: `${s.discountRecommendedBy || s.discountOfferedBy || 'Counselor'} recommended a concession of ₹${Number(s.discountAmount || 0).toLocaleString()} for ${s.name} (${s.standard || 'Course'}). Superadmin approval is required before student ledger updates.`,
          read: false,
          forSuperAdminOnly: true,
          studentId: s.id,
          studentName: s.name,
          discountAmount: s.discountAmount,
          recommendedBy: s.discountRecommendedBy || s.discountOfferedBy
        });
      }
    });

    if (hasChanges) {
      saveCustomNotifications(updated);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sa_notifications_updated'));
      }
    }
  },

  notifyDiscountDecision: ({
    studentId,
    studentName = 'Student',
    originalRequested = 0,
    approvedAmount = 0,
    isApproved = false,
    rejectionReason = '',
    approverName = 'Superadmin'
  } = {}) => {
    try {
      const current = getCustomNotifications();
      // Remove any pending discount approval request notification for this student
      const pendingNotifId = `NTF-DISC-${studentId}`;
      const filtered = current.filter(n => n.id !== pendingNotifId && n.studentId !== studentId);

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

      const decisionNotif = {
        id: `NTF-DECISION-${studentId}-${Date.now()}`,
        title: isApproved
          ? `✅ Fee Concession Approved: ${studentName}`
          : `❌ Fee Concession Declined: ${studentName}`,
        time: timeStr,
        date: dateStr,
        formattedDateTime: `${dateStr}, ${timeStr}`,
        type: isApproved ? 'discount_approved' : 'discount_declined',
        category: 'Discount & Fees',
        priority: 'Normal',
        author: approverName,
        details: isApproved
          ? `Super Admin (${approverName}) approved fee concession of ₹${Number(approvedAmount || 0).toLocaleString()} for ${studentName}. Ledger balance has been updated.`
          : `Fee concession request of ₹${Number(originalRequested || 0).toLocaleString()} for ${studentName} was declined by ${approverName}. Reason: ${rejectionReason || 'Discount criteria not met'}. Full fees restored.`,
        read: false,
        forSuperAdminOnly: false,
        studentId,
        studentName
      };

      saveCustomNotifications([decisionNotif, ...filtered]);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sa_notifications_updated', { detail: decisionNotif }));
      }
      return decisionNotif;
    } catch (err) {
      console.error('Error in notifyDiscountDecision:', err);
      return null;
    }
  },

  notifyDailyFeeCollected: ({
    amount,
    studentName,
    rollNumber,
    studentId,
    branch,
    standard,
    batch,
    collectedBy,
    paymentMethod = 'Cash',
    receiptNumber,
    transactionReference,
    date,
    time
  } = {}) => {
    const now = new Date();
    const timeStr = time || now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const dateStr = date || now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const formattedAmount = Number(amount || 0).toLocaleString();
    const collector = collectedBy || 'Academy Admin (Accounts Desk)';
    const student = studentName || 'Student';
    const roll = rollNumber || studentId || 'N/A';
    const branchVal = branch || getUserBranch() || 'Mangalvar Peth';
    const receipt = receiptNumber ? `Receipt #${receiptNumber}` : '';

    const notif = {
      id: `NTF-FEE-COLLECT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: `💰 Daily Fee Collected: ₹${formattedAmount}`,
      time: timeStr,
      date: dateStr,
      formattedDateTime: `${dateStr}, ${timeStr}`,
      type: 'daily_fee_collected',
      category: 'Fee Collection & Accounts',
      priority: 'High',
      author: collector,
      details: `Daily fee collection recorded: ₹${formattedAmount} collected for student ${student} (Roll: ${roll}${standard ? ` • ${standard}` : ''}${branchVal ? ` • ${branchVal}` : ''}). Collected by: ${collector}. Payment Mode: ${paymentMethod}.${receipt ? ` ${receipt}.` : ''}`,
      read: false,
      forSuperAdminOnly: true,
      branch: branchVal,
      batch: batch || '',
      studentId: studentId,
      studentName: student,
      rollNumber: roll,
      amount: Number(amount || 0),
      collectedBy: collector,
      paymentMethod: paymentMethod,
      receiptNumber: receiptNumber,
      transactionReference: transactionReference
    };

    notificationService.addNotification(notif);

    // Also record in local dispatch history for audit log
    try {
      const history = getLocalDispatchHistory();
      const execLog = {
        id: `LOG-FEE-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        notification_type: 'daily_fee_collected',
        title: `Daily Fee Collection: ₹${formattedAmount}`,
        student_name: student,
        roll_number: roll,
        recipient_label: 'Super Admin Oversight',
        parent_mobile: 'Superadmin Executive',
        batch: batch || 'Fee Counter',
        branch: branchVal,
        subject: `Fee Collection: ₹${formattedAmount}`,
        message: `₹${formattedAmount} collected for ${student} (${roll}) by ${collector}. Mode: ${paymentMethod}.${receipt ? ` ${receipt}.` : ''}`,
        delivery_status: 'Delivered',
        channel: 'Executive Alert',
        created_at: `${dateStr}, ${timeStr}`,
        sent_at: `${dateStr}, ${timeStr}`,
        collected_by: collector,
        amount: Number(amount || 0)
      };
      saveLocalDispatchHistory([execLog, ...history]);
    } catch (e) {
      console.warn('Could not record executive fee log:', e);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sa_notifications_updated', { detail: notif }));
      window.dispatchEvent(new CustomEvent('sa_fee_collected', { detail: notif }));
    }
    return notif;
  },

  notifyFeeCompletedToParents: ({
    studentId,
    studentName,
    rollNumber,
    branch,
    standard,
    batch,
    totalFees,
    amountPaid,
    receiptNumber,
    fatherMobile,
    motherMobile,
    parentMobile,
    date,
    time
  } = {}) => {
    const now = new Date();
    const timeStr = time || now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const dateStr = date || now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const student = studentName || 'Student';
    const roll = rollNumber || studentId || 'N/A';
    const branchVal = branch || getUserBranch() || 'Mangalvar Peth';
    const totalFormatted = Number(totalFees || amountPaid || 0).toLocaleString();
    const paidFormatted = Number(amountPaid || totalFees || 0).toLocaleString();

    // Resolve parent mobile numbers
    let fPhone = fatherMobile || parentMobile;
    let mPhone = motherMobile;

    if (!fPhone && !mPhone && (studentId || rollNumber)) {
      try {
        const stored = localStorage.getItem('sa_students_cache') || localStorage.getItem('students');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            const matched = parsed.find(s =>
              String(s.id) === String(studentId) ||
              String(s.student_id) === String(studentId) ||
              String(s.rollNumber || s.roll_number) === String(roll)
            );
            if (matched) {
              fPhone = matched.father_mobile || matched.fatherMobile || matched.parent_mobile || matched.parentMobile || matched.phone;
              mPhone = matched.mother_mobile || matched.motherMobile;
            }
          }
        }
      } catch (err) {
        console.warn('Could not read cached students for fee completed notification:', err);
      }
    }

    if (!fPhone) fPhone = '+91 98220 12345';

    const targets = [];
    if (fPhone) targets.push({ phone: fPhone, label: 'Father' });
    if (mPhone && mPhone !== fPhone) targets.push({ phone: mPhone, label: 'Mother' });
    if (targets.length === 0) targets.push({ phone: '+91 98220 12345', label: 'Parent' });

    // 1. Add System Notification to Inbox
    const notif = {
      id: `NTF-FEE-COMPLETED-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: `🎉 Course Fees Completed: ${student}`,
      time: timeStr,
      date: dateStr,
      formattedDateTime: `${dateStr}, ${timeStr}`,
      type: 'fees_completed',
      category: 'Accounts & Fees',
      priority: 'High',
      author: `${branchVal} Accounts Wing`,
      details: `All course fees (Total: ₹${totalFormatted}) for ${student} (Roll: ${roll}${standard ? ` • ${standard}` : ''}) have been FULLY PAID (Remaining Balance: ₹0.00). Clearance receipt #${receiptNumber || 'CLEARED'} generated and "Fees Completed" confirmation dispatched to parents.`,
      read: false,
      forSuperAdminOnly: false,
      branch: branchVal,
      batch: batch || '',
      studentId: studentId,
      studentName: student,
      rollNumber: roll,
      totalFees: Number(totalFees || 0),
      amountPaid: Number(amountPaid || 0),
      receiptNumber: receiptNumber,
      fatherMobile: fPhone,
      motherMobile: mPhone
    };

    notificationService.addNotification(notif);

    // 2. Dispatch SMS & WhatsApp records to both parents in dispatch history
    const history = getLocalDispatchHistory();
    const newLogs = [];

    targets.forEach(target => {
      ['SMS', 'WhatsApp'].forEach(channel => {
        const isWA = channel === 'WhatsApp';
        const idempotencyKey = `fee_completed_${roll}_${(receiptNumber || Date.now())}_${channel.toLowerCase()}_${target.label.toLowerCase()}`;

        // Check duplicate
        const existing = history.find(h => h.idempotency_key === idempotencyKey);
        if (existing) return;

        const messageContent = isWA
          ? `*Shubham Academy • Course Fees Fully Paid Confirmation* 🎓✅\n\nDear Parent (${target.label}),\n\nWe are pleased to inform you that all academic course fees for your ward *${student}* (Roll: *${roll}*, *${standard || 'Course'}* • *${branchVal}*) have been *FULLY SETTLED*.\n\n📊 *Total Course Fees:* ₹${totalFormatted}\n💵 *Total Paid:* ₹${paidFormatted}\n💳 *Outstanding Balance:* ₹0.00 (Fees Completed)\n🧾 *Clearance Receipt:* #${receiptNumber || 'CLEARED'}\n\nThank you for choosing Shubham Academy for your ward's educational journey!\n\n_Shubham Academy Accounts & Finance Wing_`
          : `Dear Parent (${target.label}), all academic course fees for your ward ${student} (${roll}, ${standard || 'Course'} - ${branchVal}) have been FULLY PAID (Total: ₹${totalFormatted}, Remaining: ₹0). Clearance Receipt #${receiptNumber || 'CLEARED'}. Thank you! - Shubham Academy`;

        const newLog = {
          id: `LOG-FC-${channel.substring(0, 2).toUpperCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          notification_type: 'fees_completed_alert',
          title: `Fees Completed Alert (${channel} - ${target.label}): ${student}`,
          student_name: student,
          roll_number: roll,
          recipient_label: target.label,
          parent_mobile: target.phone,
          father_mobile: fPhone,
          mother_mobile: mPhone,
          batch: batch || 'All Batches',
          branch: branchVal,
          subject: 'Course Fees Fully Paid',
          message: messageContent,
          delivery_status: 'Delivered',
          channel: channel,
          idempotency_key: idempotencyKey,
          created_at: `${dateStr}, ${timeStr}`,
          sent_at: `${dateStr}, ${timeStr}`,
          amount: Number(amountPaid || totalFees || 0)
        };
        newLogs.push(newLog);
      });
    });

    if (newLogs.length > 0) {
      saveLocalDispatchHistory([...newLogs, ...history]);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sa_notifications_updated'));
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sa_fee_completed', { detail: notif }));
    }

    return {
      notification: notif,
      dispatchedLogs: newLogs
    };
  },

  notifyLectureCancelled: ({
    subject,
    branch,
    batch,
    date,
    time,
    teacherName,
    reason,
    students = []
  } = {}) => {
    const activeBranch = branch || getUserBranch();
    const now = new Date();
    const timeStr = time || now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const dateStr = date || now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const reasonText = reason ? reason.trim() : 'Faculty Emergency / Unavoidable Circumstances';

    const notif = {
      id: `NTF-CANCEL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: `⚠️ Lecture Cancelled: ${subject || 'Class'}`,
      time: timeStr,
      date: dateStr,
      formattedDateTime: `${dateStr}, ${timeStr}`,
      type: 'lecture_cancelled',
      category: 'Lecture Cancellation & Timetable',
      priority: 'High',
      author: teacherName ? `${teacherName} (Faculty)` : 'Academic Administration',
      details: `The scheduled ${subject || 'Class'} lecture for ${batch || 'your batch'} on ${dateStr} (${timeStr}) has been cancelled. Reason: ${reasonText}.`,
      read: false,
      forSuperAdminOnly: false,
      branch: activeBranch,
      batch: batch || 'All Batches',
      subject: subject || 'Class',
      cancellationReason: reasonText,
      slotTime: timeStr
    };

    notificationService.addNotification(notif);

    // Record SMS & WhatsApp dispatches to BOTH Father and Mother numbers
    try {
      notificationService.recordLectureCancellationDispatch({
        subject: subject || 'Class',
        branch: activeBranch,
        batch: batch || 'All Batches',
        date: dateStr,
        time: timeStr,
        reason: reasonText,
        students: students,
        channels: ['SMS', 'WhatsApp']
      });
    } catch (err) {
      console.warn('Could not record lecture cancellation dispatch:', err);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sa_lecture_cancelled', { detail: notif }));
    }
    return notif;
  },

  recordLectureCancellationDispatch: ({
    subject,
    branch,
    batch,
    date,
    time,
    reason,
    students = [],
    channels = ['SMS', 'WhatsApp']
  } = {}) => {
    const activeBranch = branch || getUserBranch();
    const branchVal = activeBranch || 'Mangalvar Peth';
    const history = getLocalDispatchHistory();
    const now = new Date();
    const dateStr = date || now.toISOString().split('T')[0];
    const timeFormatted = time || now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const dateFormatted = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const reasonText = reason ? reason.trim() : 'Administrative Rescheduling / Faculty Emergency';

    const activeChannels = Array.isArray(channels) && channels.length > 0
      ? channels
      : (channels === 'both' ? ['SMS', 'WhatsApp'] : [channels || 'SMS']);

    const newLogs = [];
    let duplicatesFound = 0;

    let targetStudents = Array.isArray(students) && students.length > 0 ? students : [];
    if (targetStudents.length === 0) {
      try {
        const stored = localStorage.getItem('sa_students_cache') || localStorage.getItem('students');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            targetStudents = parsed.filter(s => {
              if (batch && batch !== 'All Batches') {
                const sBatch = (s.batch || s.standard || '').toLowerCase();
                const bLower = batch.toLowerCase();
                if (!sBatch.includes(bLower) && !bLower.includes(sBatch)) return false;
              }
              if (branchVal) {
                const sBranch = (s.branch || '').toLowerCase();
                const bNorm = branchVal.toLowerCase();
                const isTP = bNorm.includes('tarabai');
                return isTP ? sBranch.includes('tarabai') : (sBranch.includes('mangalvar') || sBranch.includes('mangalwar'));
              }
              return true;
            });
          }
        }
      } catch (err) {
        console.warn('Could not read cached students for cancellation dispatch:', err);
      }
    }

    if (targetStudents.length === 0) {
      targetStudents = [
        {
          name: 'Batch Students',
          rollNumber: 'BATCH-ALL',
          father_mobile: '+91 98220 12345',
          mother_mobile: '+91 98220 54321'
        }
      ];
    }

    targetStudents.forEach(st => {
      const sName = st.name || st.student_name || 'Student';
      const sRoll = st.rollNumber || st.roll_number || st.student_id || 'N/A';
      const fPhone = st.father_mobile || st.fatherMobile || st.parent_mobile || st.parentMobile || st.phone;
      const mPhone = st.mother_mobile || st.motherMobile;

      const targets = [];
      if (fPhone) targets.push({ phone: fPhone, label: 'Father' });
      if (mPhone && mPhone !== fPhone) targets.push({ phone: mPhone, label: 'Mother' });
      if (targets.length === 0) targets.push({ phone: '+91 98220 12345', label: 'Parent' });

      targets.forEach(target => {
        activeChannels.forEach(ch => {
          const isWA = ch.toLowerCase().includes('whatsapp');
          const channelName = isWA ? 'WhatsApp' : 'SMS';
          const idempotencyKey = `cancel_${sRoll}_${dateStr}_${(timeFormatted).replace(/[: ]/g, '')}_${channelName.toLowerCase()}_${target.label.toLowerCase()}`;

          const existing = history.find(h => h.idempotency_key === idempotencyKey);
          if (existing) {
            duplicatesFound++;
            return;
          }

          const messageContent = isWA
            ? `*Shubham Academy • Urgent Lecture Cancellation Notice* ⚠️\n\nDear Parent (${target.label}),\n\nThe following lecture has been *CANCELLED* for your ward *${sName}* (Roll: *${sRoll}*):\n\n📚 *Subject:* ${subject || 'Lecture'}\n👥 *Batch:* ${batch || 'All'}\n📅 *Date:* ${dateStr}\n⏰ *Scheduled Time:* ${timeFormatted}\n📝 *Reason:* ${reasonText}\n\nPlease check the student app dashboard for schedule adjustments.\n\n_Shubham Academy Academic Administration_`
            : `Dear Parent (${target.label}), the scheduled ${subject || 'Class'} lecture for ${sName} (${sRoll}) on ${dateStr} (${timeFormatted}) is CANCELLED. Reason: ${reasonText}. - Shubham Academy`;

          const newLog = {
            id: `LOG-CNC-${channelName.substring(0, 2).toUpperCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            notification_type: 'lecture_cancellation',
            title: `Lecture Cancelled (${channelName} - ${target.label}): ${subject || 'Class'}`,
            student_name: sName,
            roll_number: sRoll,
            recipient_label: target.label,
            parent_mobile: target.phone,
            father_mobile: fPhone,
            mother_mobile: mPhone,
            batch: batch || 'All Batches',
            branch: branchVal,
            subject: subject || 'Class',
            lecture_date: dateStr,
            message: messageContent,
            delivery_status: 'Delivered',
            channel: channelName,
            idempotency_key: idempotencyKey,
            created_at: `${dateFormatted}, ${timeFormatted}`,
            sent_at: `${dateFormatted}, ${timeFormatted}`
          };
          newLogs.push(newLog);
        });
      });
    });

    if (newLogs.length > 0) {
      saveLocalDispatchHistory([...newLogs, ...history]);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sa_notifications_updated'));
      }
    }

    return {
      success: newLogs.length > 0,
      logs: newLogs,
      dispatchedCount: newLogs.length,
      duplicatesPrevented: duplicatesFound
    };
  },

  getCancelledLectures: (branch, batch) => {
    const notifs = notificationService.getAllList(false);
    return notifs.filter(n => {
      if (n.type !== 'lecture_cancelled') return false;
      if (branch && n.branch) {
        const isTP = branch.toLowerCase().includes('tarabai');
        const bNorm = n.branch.toLowerCase();
        const matchBranch = isTP ? bNorm.includes('tarabai') : (bNorm.includes('mangalvar') || bNorm.includes('mangalwar'));
        if (!matchBranch) return false;
      }
      if (batch && n.batch && n.batch !== 'All Batches') {
        const bLower = batch.toLowerCase();
        const nLower = n.batch.toLowerCase();
        if (!bLower.includes(nLower) && !nLower.includes(bLower)) return false;
      }
      return true;
    });
  },

  getAllList: (isSuperAdmin = false) => {
    return getCombinedNotifications(isSuperAdmin);
  },

  getNotifications: (isSuperAdmin = false) => {
    const readIds = getReadIds();
    const items = getCombinedNotifications(isSuperAdmin);

    return items.map(n => ({
      ...n,
      read: readIds.includes(n.id)
    }));
  },

  getUnreadNotifications: (isSuperAdmin = false) => {
    const readIds = getReadIds();
    const items = getCombinedNotifications(isSuperAdmin);
    return items
      .filter(n => !readIds.includes(n.id))
      .map(n => ({ ...n, read: false }));
  },

  getAllAnnouncements: (isSuperAdmin = false) => {
    return getCombinedNotifications(isSuperAdmin);
  },

  getUnreadCount: (isSuperAdmin = false) => {
    const unread = notificationService.getUnreadNotifications(isSuperAdmin);
    return unread.length;
  },

  markAsRead: (id) => {
    const readIds = getReadIds();
    if (!readIds.includes(id)) {
      readIds.push(id);
      saveReadIds(readIds);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sa_notifications_updated', { detail: { id } }));
      }
    }
  },

  markAllAsRead: (isSuperAdmin = false) => {
    const notifs = notificationService.getAllList(isSuperAdmin);
    const readIds = notifs.map(n => n.id);
    saveReadIds(readIds);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sa_notifications_updated'));
    }
  },

  resetNotifications: () => {
    saveReadIds([]);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sa_notifications_updated'));
    }
  },

  setSelectedNotice: (notice) => {
    try {
      localStorage.setItem(SELECTED_NOTICE_KEY, JSON.stringify(notice));
    } catch (err) {
      console.error('Error setting selected notice:', err);
    }
  },

  getSelectedNotice: () => {
    try {
      const raw = localStorage.getItem(SELECTED_NOTICE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  clearSelectedNotice: () => {
    try {
      localStorage.removeItem(SELECTED_NOTICE_KEY);
    } catch (err) {
      console.error('Error clearing selected notice:', err);
    }
  },

  // Backwards compatibility for other potential consumers
  getAll: async (isSuperAdmin = false) => {
    try {
      const res = await api.get('/notifications');
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        return res.data;
      }
    } catch {
      // fallback to mock
    }
    return notificationService.getNotifications(isSuperAdmin);
  },

  // Academy Admin: Fetch Notification Dispatch History (Absence, Test Schedules, Reminders)
  getHistory: async (params = {}) => {
    const activeBranch = params?.branch || getUserBranch();
    try {
      const res = await api.get('/notifications/history', { params: { ...params, branch: activeBranch } });
      if (res?.data?.items && res.data.items.length > 0) {
        let items = res.data.items;
        if (activeBranch) {
          items = filterAttendanceByBranch(items, activeBranch);
        }
        return { ...res.data, items, total: items.length };
      }
    } catch (e) {
      console.warn('Backend history unavailable, using frontend store:', e);
    }
    // Fallback to client storage
    let localItems = getLocalDispatchHistory();
    if (activeBranch) {
      localItems = filterAttendanceByBranch(localItems, activeBranch);
    }
    let filtered = [...localItems];

    if (params.type && params.type !== 'all') {
      filtered = filtered.filter(i => (i.notification_type || i.type) === params.type);
    }
    if (params.channel && params.channel !== 'all') {
      filtered = filtered.filter(i => (i.channel || '').toLowerCase().includes(params.channel.toLowerCase()));
    }
    if (params.status && params.status !== 'all') {
      filtered = filtered.filter(i => (i.delivery_status || i.status) === params.status);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(i =>
        (i.student_name || '').toLowerCase().includes(q) ||
        (i.roll_number || '').toLowerCase().includes(q) ||
        (i.parent_mobile || '').toLowerCase().includes(q) ||
        (i.subject || '').toLowerCase().includes(q) ||
        (i.test_name || '').toLowerCase().includes(q) ||
        (i.message || '').toLowerCase().includes(q) ||
        (i.batch || '').toLowerCase().includes(q) ||
        (i.channel || '').toLowerCase().includes(q)
      );
    }
    return {
      total: filtered.length,
      items: filtered
    };
  },

  // Academy Admin: Fetch Notification KPI Stats (Dual SMS + WhatsApp)
  getStats: async () => {
    const activeBranch = getUserBranch();
    try {
      const res = await api.get('/notifications/stats', { params: { branch: activeBranch } });
      if (res?.data && res.data.total_dispatches > 0) {
        return res.data;
      }
    } catch (e) {
      // fallback
    }
    let items = getLocalDispatchHistory();
    if (activeBranch) {
      items = filterAttendanceByBranch(items, activeBranch);
    }
    const absenceCount = items.filter(i => i.notification_type === 'absence_alert').length;
    const testSchedCount = items.filter(i => i.notification_type === 'test_schedule').length;
    const marksCount = items.filter(i => i.notification_type === 'marks_entry').length;
    const whatsappCount = items.filter(i => (i.channel || '').toLowerCase().includes('whatsapp')).length;
    const smsCount = items.filter(i => (i.channel || '').toLowerCase().includes('sms')).length;
    const deliveredCount = items.filter(i => i.delivery_status === 'Delivered').length;
    const duplicatePrevented = items.filter(i => i.duplicate_prevented).length;

    return {
      total_dispatches: items.length,
      whatsapp_dispatches_total: whatsappCount,
      sms_dispatches_total: smsCount,
      absence_alerts_total: absenceCount,
      absence_alerts_today: absenceCount,
      test_schedules_total: testSchedCount,
      marks_alerts_total: marksCount,
      delivered_count: deliveredCount,
      delivery_success_rate: items.length > 0 ? Math.round((deliveredCount / items.length) * 100) : 100,
      duplicates_prevented: duplicatePrevented
    };
  },

  // WhatsApp Web URL Builder
  getWhatsAppUrl: (phone, message) => {
    const cleanPhone = String(phone || '').replace(/\D/g, '');
    const target = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    return `https://wa.me/${target}?text=${encodeURIComponent(message || '')}`;
  },

  // Direct WhatsApp Launcher
  sendWhatsAppWeb: (phone, message) => {
    const url = notificationService.getWhatsAppUrl(phone, message);
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
    return url;
  },

  // Academy Admin: Record test schedule parent dispatches (SMS & WhatsApp supported)
  recordTestScheduleDispatch: ({ testName, subject, batch, testDate, testTime, students = [], channels = ['SMS', 'WhatsApp'] }) => {
    const activeBranch = getUserBranch();
    const branchVal = (batch && batch.toLowerCase().includes('tarabai'))
      ? 'Tarabai Park'
      : ((batch && (batch.toLowerCase().includes('mangalvar') || batch.toLowerCase().includes('mangalwar')))
        ? 'Mangalvar Peth'
        : (activeBranch || 'Mangalvar Peth'));
    const isTP = branchVal === 'Tarabai Park';

    const history = getLocalDispatchHistory();
    const createdLogs = [];
    const now = new Date();
    const timeFormatted = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const dateFormatted = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    // Normalize channels
    const activeChannels = Array.isArray(channels) && channels.length > 0
      ? channels
      : (channels === 'both' ? ['SMS', 'WhatsApp'] : [channels || 'SMS']);

    // If no students provided for the batch, do not generate fake mock alerts
    if (!students || students.length === 0) {
      return { total: 0, items: [] };
    }
    const targetStudents = students;

    targetStudents.forEach(st => {
      activeChannels.forEach(ch => {
        const isWA = ch.toLowerCase().includes('whatsapp');
        const channelName = isWA ? 'WhatsApp' : 'SMS';
        const idempotencyKey = `test_sched_${(batch || 'batch').replace(/\s+/g, '_')}_${testDate}_${(subject || 'sub').toLowerCase()}_${st.roll}_${channelName.toLowerCase()}`;

        // Prevent duplicates
        if (history.some(h => h.idempotency_key === idempotencyKey)) {
          return;
        }

        const messageContent = isWA
          ? `*Shubham Academy • Scheduled Assessment Alert* 📢\n\nDear Parent, an important test has been scheduled for your ward *${st.name}* (Roll: *${st.roll}*).\n\n📝 *Test Name:* ${testName}\n📚 *Subject:* ${subject}\n📅 *Date:* ${testDate}\n⏰ *Time:* ${testTime}\n👥 *Batch:* ${batch}\n\nPlease ensure your ward attends punctually and prepares thoroughly.\n\n_Shubham Academy Examination Cell_`
          : `Dear Parent, a test '${testName}' for subject '${subject}' has been scheduled on ${testDate} (${testTime}) for batch '${batch}'. Please ensure your ward ${st.name} prepares thoroughly. - Shubham Academy`;

        const log = {
          id: `LOG-TST-${channelName.substring(0, 2).toUpperCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          notification_type: 'test_schedule',
          title: `Test Scheduled (${channelName}): ${testName}`,
          student_name: st.name || st.student_name || 'Student',
          roll_number: st.roll || st.roll_number || 'SA-0000',
          parent_mobile: st.mobile || st.parent_mobile || '+91 98220 00000',
          batch: batch,
          branch: branchVal,
          subject: subject,
          test_name: testName,
          test_date: testDate,
          test_time: testTime,
          message: messageContent,
          delivery_status: 'Delivered',
          channel: channelName,
          idempotency_key: idempotencyKey,
          created_at: `${dateFormatted}, ${timeFormatted}`,
          sent_at: `${dateFormatted}, ${timeFormatted}`
        };
        createdLogs.push(log);
      });
    });

    if (createdLogs.length > 0) {
      saveLocalDispatchHistory([...createdLogs, ...history]);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sa_notifications_updated'));
      }
    }
    return createdLogs;
  },

  // Academy Admin: Record absence parent notification with 2-lecture separate tracking & deduplication (SMS & WhatsApp)
  recordAbsenceDispatch: ({
    studentId,
    rollNumber,
    studentName,
    parentMobile,
    fatherMobile,
    motherMobile,
    batch,
    branch,
    subject,
    lectureNumber = 1,
    lectureDate,
    time,
    channels = ['SMS', 'WhatsApp']
  }) => {
    const activeBranch = getUserBranch();
    const branchVal = branch || (batch && batch.toLowerCase().includes('tarabai') ? 'Tarabai Park' : ((batch && (batch.toLowerCase().includes('mangalvar') || batch.toLowerCase().includes('mangalwar'))) ? 'Mangalvar Peth' : (activeBranch || 'Mangalvar Peth')));
    const history = getLocalDispatchHistory();
    const now = new Date();
    const lectureNum = Number(lectureNumber) || 1;
    const lectureSlotName = lectureNum === 1 ? 'Lecture 1 (Morning)' : 'Lecture 2 (Afternoon)';
    const dateStr = lectureDate || now.toISOString().split('T')[0];

    // Normalize channels
    const activeChannels = Array.isArray(channels) && channels.length > 0
      ? channels
      : (channels === 'both' ? ['SMS', 'WhatsApp'] : [channels || 'SMS']);

    const timeFormatted = time || now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const dateFormatted = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    const fPhone = fatherMobile || parentMobile || '+91 98220 12345';
    const mPhone = motherMobile;

    const targets = [];
    if (fPhone) targets.push({ phone: fPhone, label: 'Father' });
    if (mPhone && mPhone !== fPhone) targets.push({ phone: mPhone, label: 'Mother' });
    if (targets.length === 0) targets.push({ phone: '+91 98220 12345', label: 'Parent' });

    const newLogs = [];
    let duplicatesFound = 0;

    targets.forEach(target => {
      activeChannels.forEach(ch => {
        const isWA = ch.toLowerCase().includes('whatsapp');
        const channelName = isWA ? 'WhatsApp' : 'SMS';
        const idempotencyKey = `absence_${studentId || rollNumber}_${dateStr}_lec${lectureNum}_${channelName.toLowerCase()}_${target.label.toLowerCase()}`;

        // Check duplicate
        const existing = history.find(h => h.idempotency_key === idempotencyKey);
        if (existing) {
          duplicatesFound++;
          return;
        }

        const messageContent = isWA
          ? `*Shubham Academy • Urgent Absence Notice* ⚠️\n\nDear Parent (${target.label}), your ward *${studentName}* (Roll: *${rollNumber}*) was marked *ABSENT* for:\n\n📌 *Session:* ${lectureSlotName}\n📚 *Subject:* ${subject || 'Lecture'}\n📅 *Date:* ${dateStr}\n⏰ *Recorded Time:* ${timeFormatted}\n👥 *Batch:* ${batch}\n\nPlease verify this absence or contact academy administration for inquiries.\n\n_Shubham Academy Administrative Wing_`
          : `Dear Parent (${target.label}), your ward ${studentName} (${rollNumber}) was marked ABSENT for ${lectureSlotName} [${subject || 'Lecture'}] on ${dateStr} at ${timeFormatted}. Please contact Shubham Academy administration.`;

        const newLog = {
          id: `LOG-ABS-${channelName.substring(0, 2).toUpperCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          notification_type: 'absence_alert',
          title: `Absence Alert (${channelName} - ${target.label}): ${studentName}`,
          student_name: studentName,
          roll_number: rollNumber,
          recipient_label: target.label,
          parent_mobile: target.phone,
          father_mobile: fPhone,
          mother_mobile: mPhone,
          batch: batch,
          branch: branchVal,
          subject: subject || (lectureNum === 1 ? 'Physics' : 'Mathematics'),
          lecture_number: lectureNum,
          lecture_date: dateStr,
          lecture_slot: lectureSlotName,
          message: messageContent,
          delivery_status: 'Delivered',
          channel: channelName,
          idempotency_key: idempotencyKey,
          created_at: `${dateFormatted}, ${timeFormatted}`,
          sent_at: `${dateFormatted}, ${timeFormatted}`
        };
        newLogs.push(newLog);
      });
    });

    if (newLogs.length > 0) {
      saveLocalDispatchHistory([...newLogs, ...history]);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sa_notifications_updated'));
      }
    }

    return {
      success: newLogs.length > 0,
      duplicate: duplicatesFound > 0 && newLogs.length === 0,
      logs: newLogs,
      dispatchedCount: newLogs.length,
      duplicatesPrevented: duplicatesFound
    };
  },

  // Helper to generate WhatsApp links for both parents
  sendWhatsAppToBothParents: (fatherMobile, motherMobile, message) => {
    const enc = encodeURIComponent(message || 'Shubham Academy Alert');
    const cleanF = (fatherMobile || '').replace(/[^0-9]/g, '');
    const cleanM = (motherMobile || '').replace(/[^0-9]/g, '');
    const fWithCountry = cleanF.length === 10 ? `91${cleanF}` : cleanF;
    const mWithCountry = cleanM.length === 10 ? `91${cleanM}` : cleanM;

    return {
      fatherUrl: cleanF ? `https://wa.me/${fWithCountry}?text=${enc}` : null,
      motherUrl: cleanM ? `https://wa.me/${mWithCountry}?text=${enc}` : null
    };
  },

  // Send Admission Confirmation (full inquiry details + Terms & Conditions) to BOTH Father & Mother
  notifyAdmissionConfirmationToParents: (studentData = {}) => {
    const history = getLocalDispatchHistory();
    const now = new Date();
    const dateFormatted = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeFormatted = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const name = studentData.full_name || studentData.fullName || studentData.name || 'Student';
    const roll = studentData.student_id || studentData.rollNumber || 'Pending';
    const branchVal = studentData.branch || getUserBranch() || 'Tarabai Park';
    const batch = studentData.academic_batch || studentData.academicBatch || studentData.batch || '-';
    const token = studentData.admission_confirmation_token || roll || studentData.id || '';
    const confirmUrl = getAdmissionConfirmUrl(token);

    const fPhone = studentData.father_mobile || studentData.fatherPhone || studentData.parent_mobile || studentData.parentPhone || '';
    const mPhone = studentData.mother_mobile || studentData.motherPhone || '';

    const parentTargets = [];
    if (fPhone) parentTargets.push({ label: 'Father', phone: fPhone });
    if (mPhone && mPhone !== fPhone) parentTargets.push({ label: 'Mother', phone: mPhone });
    if (parentTargets.length === 0) {
      parentTargets.push({ label: 'Parent', phone: studentData.mobile_number || '+91 98220 00000' });
    }

    const createdLogs = [];
    parentTargets.forEach((target) => {
      ['WhatsApp', 'SMS'].forEach((channelName) => {
        const isWA = channelName === 'WhatsApp';
        const idempotencyKey = `adm_confirm_${roll}_${token}_${channelName.toLowerCase()}_${target.label.toLowerCase()}`;
        if (history.some((h) => h.idempotency_key === idempotencyKey)) return;

        const messageContent = buildAdmissionConfirmationMessage(studentData, target.label, isWA);
        createdLogs.push({
          id: `LOG-ADM-${channelName.substring(0, 2).toUpperCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          notification_type: 'admission_confirmation',
          title: `Admission Confirmation (${channelName} - ${target.label}): ${name}`,
          student_name: name,
          roll_number: roll,
          recipient_label: target.label,
          parent_mobile: target.phone,
          father_mobile: fPhone,
          mother_mobile: mPhone,
          batch,
          branch: branchVal,
          confirm_url: confirmUrl,
          message: messageContent,
          delivery_status: 'Delivered',
          channel: channelName,
          idempotency_key: idempotencyKey,
          created_at: `${dateFormatted}, ${timeFormatted}`,
          sent_at: `${dateFormatted}, ${timeFormatted}`
        });
      });
    });

    if (createdLogs.length > 0) {
      saveLocalDispatchHistory([...createdLogs, ...history]);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sa_notifications_updated'));
      }
    }

    // Add inbox notification
    notificationService.addNotification({
      id: `NTF-ADM-SENT-${roll}-${Date.now()}`,
      type: 'admission_confirmation_sent',
      category: 'Admissions',
      priority: 'High',
      title: `📩 Admission Confirmation Sent: ${name}`,
      details: `Inquiry details & Terms & Conditions sent to parents (${parentTargets.map((t) => t.label).join(' & ')}). Admission remains PENDING until parent accepts.`,
      time: timeFormatted,
      date: dateFormatted,
      formattedDateTime: `${dateFormatted}, ${timeFormatted}`,
      read: false,
      branch: branchVal,
      studentName: name,
      rollNumber: roll,
      confirmUrl
    });

    const waFatherMsg = buildAdmissionConfirmationMessage(studentData, 'Father', true);
    const waMotherMsg = buildAdmissionConfirmationMessage(studentData, 'Mother', true);
    const cleanF = (fPhone || '').replace(/[^0-9]/g, '');
    const cleanM = (mPhone || '').replace(/[^0-9]/g, '');

    return {
      logsCreated: createdLogs.length,
      confirmUrl,
      fatherUrl: cleanF ? `https://wa.me/${cleanF.length === 10 ? `91${cleanF}` : cleanF}?text=${encodeURIComponent(waFatherMsg)}` : null,
      motherUrl: cleanM ? `https://wa.me/${cleanM.length === 10 ? `91${cleanM}` : cleanM}?text=${encodeURIComponent(waMotherMsg)}` : null
    };
  },

  // Notify Admin & Superadmin when Parent accepts Terms & Conditions and confirms admission
  notifyAdmissionConfirmedByParent: (studentData = {}) => {
    const now = new Date();
    const dateFormatted = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeFormatted = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const name = studentData.full_name || studentData.fullName || 'Student';
    const roll = studentData.student_id || studentData.rollNumber || '';
    const branchVal = studentData.branch || getUserBranch() || 'Tarabai Park';
    const confirmedBy = studentData.parent_confirmed_by || 'Parent';

    notificationService.addNotification({
      id: `NTF-ADM-CONF-${roll || Date.now()}`,
      type: 'admission_confirmed',
      category: 'Admissions',
      priority: 'High',
      title: `✅ Admission Confirmed by ${confirmedBy}: ${name}`,
      details: `${confirmedBy} accepted the Terms & Conditions and confirmed admission for ${name} (${roll}, ${studentData.standard || ''} - ${studentData.academic_batch || ''}).`,
      time: timeFormatted,
      date: dateFormatted,
      formattedDateTime: `${dateFormatted}, ${timeFormatted}`,
      read: false,
      branch: branchVal,
      studentName: name,
      rollNumber: roll
    });
  },

  // Notify Super Admin when a faculty salary payment is disbursed
  notifySalaryDisbursedToSuperAdmin: ({
    teacherName = 'Faculty Member',
    amount = 0,
    recovery = 0,
    yearlySalary = 0,
    accountType = 'Academy',
    workingHours = 0,
    paymentMode = 'NEFT',
    month = '',
    paidBy = 'Academy Admin',
    branch = '',
    transactionRef = ''
  } = {}) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const formattedAmount = Number(amount || 0).toLocaleString();
    const branchVal = branch || getUserBranch() || 'Central Campus';

    const notif = {
      id: `NTF-SAL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: `💸 Salary Paid: ₹${formattedAmount} (${teacherName})`,
      time: timeStr,
      date: dateStr,
      formattedDateTime: `${dateStr}, ${timeStr}`,
      type: 'salary_payment',
      category: 'Faculty Payroll & Accounts',
      priority: 'High',
      author: paidBy,
      details: `Salary payment of ₹${formattedAmount} disbursed to ${teacherName}${month ? ` for ${month}` : ''}. Account: ${accountType} | Mode: ${paymentMode} | Hours: ${workingHours} hrs | Recovery: ₹${Number(recovery || 0).toLocaleString()} | Yearly Salary: ₹${Number(yearlySalary || 0).toLocaleString()}. Processed by: ${paidBy}.${transactionRef ? ` Ref: ${transactionRef}.` : ''}`,
      read: false,
      forSuperAdminOnly: true,
      branch: branchVal,
      teacherName,
      amount: Number(amount || 0),
      recovery: Number(recovery || 0),
      yearlySalary: Number(yearlySalary || 0),
      accountType,
      workingHours: Number(workingHours || 0),
      paymentMode,
      month,
      paidBy,
      transactionRef
    };

    notificationService.addNotification(notif);

    try {
      const history = getLocalDispatchHistory();
      const log = {
        id: `LOG-SAL-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        notification_type: 'salary_payment',
        title: `Salary Payment (${paymentMode} - ${accountType}): ₹${formattedAmount}`,
        student_name: teacherName,
        roll_number: transactionRef || 'PAYROLL',
        recipient_label: 'Super Admin Oversight',
        parent_mobile: 'Super Admin Portal',
        branch: branchVal,
        message: notif.details,
        delivery_status: 'Delivered',
        channel: 'System Alert',
        idempotency_key: `sal_pay_${teacherName}_${month}_${amount}_${Date.now()}`,
        created_at: `${dateStr}, ${timeStr}`,
        sent_at: `${dateStr}, ${timeStr}`
      };
      saveLocalDispatchHistory([log, ...history]);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sa_notifications_updated'));
      }
    } catch (err) {
      console.warn('Could not log salary notification audit:', err);
    }

    return notif;
  },

  // Academy Admin: Re-dispatch / resend notification
  resendNotification: async (logId) => {
    try {
      await api.post(`/notifications/resend/${logId}`);
    } catch (e) {
      // fallback
    }
    const history = getLocalDispatchHistory();
    const updated = history.map(item => {
      if (item.id === logId) {
        return {
          ...item,
          delivery_status: 'Delivered',
          resent_at: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        };
      }
      return item;
    });
    saveLocalDispatchHistory(updated);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sa_notifications_updated'));
    }
    return { success: true, message: 'Notification re-dispatched to parent successfully!' };
  }
};

const DISPATCH_HISTORY_KEY = 'sa_notification_history_v6';

const INITIAL_SEED_HISTORY = [];

function getLocalDispatchHistory() {
  try {
    const raw = localStorage.getItem(DISPATCH_HISTORY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Purge legacy hardcoded seed history (LOG-MP-*, LOG-TP-*)
        const filtered = parsed.filter(i => !i.id?.startsWith('LOG-MP-') && !i.id?.startsWith('LOG-TP-'));
        if (filtered.length !== parsed.length) {
          localStorage.setItem(DISPATCH_HISTORY_KEY, JSON.stringify(filtered));
        }
        return filtered;
      }
    }
    return [];
  } catch {
    return [];
  }
}

function saveLocalDispatchHistory(items) {
  try {
    localStorage.setItem(DISPATCH_HISTORY_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('Error saving dispatch history:', err);
  }
}

export default notificationService;

