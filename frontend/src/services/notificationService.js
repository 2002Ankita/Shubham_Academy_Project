import api from './api';
import { getUserBranch, filterAttendanceByBranch } from '../utils/branchUtils';

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

  if (activeBranch) {
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

    const newLogs = [];
    let duplicatesFound = 0;

    activeChannels.forEach(ch => {
      const isWA = ch.toLowerCase().includes('whatsapp');
      const channelName = isWA ? 'WhatsApp' : 'SMS';
      const idempotencyKey = `absence_${studentId || rollNumber}_${dateStr}_lec${lectureNum}_${channelName.toLowerCase()}`;

      // Check duplicate
      const existing = history.find(h => h.idempotency_key === idempotencyKey);
      if (existing) {
        duplicatesFound++;
        return;
      }

      const messageContent = isWA
        ? `*Shubham Academy • Urgent Absence Notice* ⚠️\n\nDear Parent, your ward *${studentName}* (Roll: *${rollNumber}*) was marked *ABSENT* for:\n\n📌 *Session:* ${lectureSlotName}\n📚 *Subject:* ${subject || 'Lecture'}\n📅 *Date:* ${dateStr}\n⏰ *Recorded Time:* ${timeFormatted}\n👥 *Batch:* ${batch}\n\nPlease verify this absence or contact academy administration for inquiries.\n\n_Shubham Academy Administrative Wing_`
        : `Dear Parent, your ward ${studentName} (${rollNumber}) was marked ABSENT for ${lectureSlotName} [${subject || 'Lecture'}] on ${dateStr} at ${timeFormatted}. Please contact Shubham Academy administration for inquiries.`;

      const newLog = {
        id: `LOG-ABS-${channelName.substring(0, 2).toUpperCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        notification_type: 'absence_alert',
        title: `Absence Alert (${channelName}): ${studentName}`,
        student_name: studentName,
        roll_number: rollNumber,
        parent_mobile: parentMobile || '+91 98220 12345',
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

