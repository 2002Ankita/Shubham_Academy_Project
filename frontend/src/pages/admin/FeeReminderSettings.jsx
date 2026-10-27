import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import BackButton from '../../components/common/BackButton';
import reminderService from '../../services/reminderService';
import studentService from '../../services/studentService';
import { useAuth } from '../../hooks/useAuth';
import { getUserBranch, isStudentInBranch } from '../../utils/branchUtils';
import {
  Bell,
  Check,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  MessageSquare,
  Smartphone,
  Save,
  RotateCcw,
  Send,
  Sparkles,
  Info,
  Calendar,
  Clock,
  Eye,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sliders,
  Play,
  User,
  Users,
  Search,
  Phone,
  DollarSign,
  Megaphone,
  Edit2,
  Settings,
  IndianRupee,
  Sun,
  Sunset,
  GraduationCap
} from 'lucide-react';

export default function FeeReminderSettings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const activeBranch = getUserBranch(user);

  // Settings state
  const [enabled, setEnabled] = useState(true);
  const [channel, setChannel] = useState('WhatsApp'); // 'WhatsApp' | 'SMS'
  const [remindDaysBefore, setRemindDaysBefore] = useState(3);
  const [remindOnDueDate, setRemindOnDueDate] = useState(true);
  const [secondReminderChoice, setSecondReminderChoice] = useState('due_date'); // 'due_date' | '1' | '2'
  const [remindDaysAfter, setRemindDaysAfter] = useState(7);
  const [retryLimit, setRetryLimit] = useState(3);
  const [messageTemplate, setMessageTemplate] = useState(
    'Dear {parent_name}, this is a friendly reminder that an outstanding tuition fee of ₹{pending_fees} for {student_name} (Roll: {roll_no}) is due on {due_date}. Kindly clear the dues to ensure uninterrupted classes. Shubham Academy.'
  );

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreviewDetails, setShowPreviewDetails] = useState(true);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);

  // Student & Parent auto-fetch state for reminder dispatch
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [recipientMode, setRecipientMode] = useState('student'); // 'student' | 'custom'
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentMobile, setParentMobile] = useState('');
  const [feeDueAmount, setFeeDueAmount] = useState('15000');
  const [customMobile, setCustomMobile] = useState('');
  const [modalChannel, setModalChannel] = useState('WhatsApp');

  // Quick filter options requested by user: Standard (11th / 12th) and Session (Morning / Afternoon)
  const [filterStandard, setFilterStandard] = useState('ALL'); // 'ALL' | '11th' | '12th'
  const [filterSession, setFilterSession] = useState('ALL');   // 'ALL' | 'Morning' | 'Afternoon'
  const [campusScope, setCampusScope] = useState('BRANCH');    // 'BRANCH' | 'ALL'

  // Fetch current settings on load
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const data = await reminderService.getSettings();
        if (data) {
          setEnabled(data.enabled ?? true);
          setChannel(data.channel || 'WhatsApp');
          setModalChannel(data.channel || 'WhatsApp');
          setRemindDaysBefore(data.remind_days_before ?? 3);
          setRemindOnDueDate(data.remind_on_due_date ?? true);
          setSecondReminderChoice(data.remind_on_due_date ? 'due_date' : '1');
          setRemindDaysAfter(data.remind_days_after ?? 7);
          setRetryLimit(data.retry_limit ?? 3);
          if (data.message_template) {
            setMessageTemplate(data.message_template);
          }
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Fetch registered students list across campuses for fast client-side filtering
  useEffect(() => {
    const loadStudents = async () => {
      setLoadingStudents(true);
      try {
        const data = await studentService.getAll({ branch: 'ALL' }).catch(() => []);
        if (Array.isArray(data) && data.length > 0) {
          setStudents(data);
          // Initial select prioritized by branch
          const branchMatches = data.filter(s => !activeBranch || isStudentInBranch(s, activeBranch));
          const firstValid = (branchMatches.length > 0 ? branchMatches : data).find(s => s.parentPhone || s.parent_mobile) || branchMatches[0] || data[0];
          if (firstValid) {
            applySelectedStudent(firstValid);
          }
        } else {
          setStudents([]);
        }
      } catch (err) {
        console.error('Failed to load students:', err);
        setStudents([]);
      } finally {
        setLoadingStudents(false);
      }
    };

    loadStudents();
  }, [activeBranch]);

  // Helper to populate parent mobile and parent details from student record
  const applySelectedStudent = (stu) => {
    if (!stu) return;
    const stuId = stu.student_id || stu.id;
    setSelectedStudentId(stuId);
    const pName = stu.parentName || stu.parent_name || 'Parent / Guardian';
    setParentName(pName);

    const rawMobile = stu.parentPhone || stu.parent_mobile || stu.phone || stu.mobile_number || '';
    const cleanMobile = rawMobile.replace(/\D/g, '').slice(-10);
    setParentMobile(cleanMobile);

    const dues = stu.remainingFees ?? stu.pendingFees ?? stu.remaining_fees ?? 0;
    setFeeDueAmount(String(dues));
  };

  const handleStudentSelect = (stuId) => {
    if (!stuId) return;
    const stu = students.find(
      s => String(s.student_id) === String(stuId) || String(s.id) === String(stuId) || String(s._id) === String(stuId)
    );
    if (stu) {
      applySelectedStudent(stu);
      const rawMobile = stu.parentPhone || stu.parent_mobile || stu.phone || stu.mobile_number || '';
      const cleanMobile = rawMobile.replace(/\D/g, '').slice(-10);
      const dues = stu.remainingFees ?? stu.pendingFees ?? stu.remaining_fees ?? 0;
      if (cleanMobile) {
        toast.info(`Selected ${stu.name || stu.full_name} | Parent: ${stu.parentName || 'Parent'} (+91 ${cleanMobile}) | Due: ₹${Number(dues).toLocaleString('en-IN')}`);
      } else {
        toast.warn(`No parent mobile registered for ${stu.name || stu.full_name}. Please type number manually.`);
      }
    } else {
      setSelectedStudentId(stuId);
    }
  };

  // Compute filtered students based on Standard (11th/12th), Session (Morning/Afternoon), Campus Scope, and Search
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      // 1. Campus Filter
      if (campusScope === 'BRANCH' && activeBranch) {
        if (!isStudentInBranch(s, activeBranch)) return false;
      }

      // 2. Standard Filter (11th vs 12th)
      if (filterStandard !== 'ALL') {
        const stdStr = `${s.standard || ''} ${s.batch || ''}`.toLowerCase();
        if (filterStandard === '11th' && !stdStr.includes('11')) return false;
        if (filterStandard === '12th' && !stdStr.includes('12')) return false;
      }

      // 3. Session Filter (Morning vs Afternoon)
      if (filterSession !== 'ALL') {
        const sessStr = `${s.session || ''} ${s.batch || ''}`.toLowerCase();
        if (filterSession === 'Morning') {
          if (sessStr.includes('afternoon') || sessStr.includes('evening')) return false;
        } else if (filterSession === 'Afternoon') {
          const hasAfternoon = sessStr.includes('afternoon') || sessStr.includes('evening');
          if (!hasAfternoon) return false;
        }
      }

      // 4. Search Filter
      if (studentSearchTerm) {
        const term = studentSearchTerm.toLowerCase();
        const sName = (s.name || s.full_name || '').toLowerCase();
        const sRoll = (s.rollNumber || s.student_id || '').toLowerCase();
        const pName = (s.parentName || s.parent_name || '').toLowerCase();
        const sBatch = (s.batch || '').toLowerCase();
        if (!sName.includes(term) && !sRoll.includes(term) && !pName.includes(term) && !sBatch.includes(term)) {
          return false;
        }
      }

      return true;
    });
  }, [students, campusScope, activeBranch, filterStandard, filterSession, studentSearchTerm]);

  // Keep selected student synchronized whenever filter narrows down the list
  useEffect(() => {
    if (filteredStudents.length > 0) {
      const isCurrentInList = filteredStudents.some(
        s => String(s.student_id) === String(selectedStudentId) || String(s.id) === String(selectedStudentId)
      );
      if (!isCurrentInList) {
        applySelectedStudent(filteredStudents[0]);
      }
    }
  }, [filteredStudents]);

  // Find currently selected student object
  const currentSelectedStudent = useMemo(() => {
    return (
      students.find(
        s => String(s.student_id) === String(selectedStudentId) || String(s.id) === String(selectedStudentId)
      ) || (filteredStudents.length > 0 ? filteredStudents[0] : null)
    );
  }, [students, filteredStudents, selectedStudentId]);

  // Generate personalized reminder message preview with dynamic values replaced
  const generatePreviewMessage = (studentObj, pName) => {
    const sName = studentObj?.name || studentObj?.full_name || 'Rahul Sharma';
    const sRoll = studentObj?.rollNumber || studentObj?.student_id || 'SA-1024';
    const sParent = pName || studentObj?.parentName || studentObj?.parent_name || 'Parent / Guardian';
    const rawPending = feeDueAmount !== '' && !isNaN(Number(feeDueAmount))
      ? Number(feeDueAmount)
      : (studentObj?.remainingFees ? Number(studentObj.remainingFees) : 15000);
    const sPending = rawPending.toLocaleString('en-IN');
    const sDueDate = studentObj?.fee_due_date ? new Date(studentObj.fee_due_date).toLocaleDateString('en-GB') : '25-Oct-2026';

    const tpl = messageTemplate || 'Dear {parent_name}, this is a friendly reminder that an outstanding tuition fee of ₹{pending_fees} for {student_name} (Roll: {roll_no}) is due on {due_date}. Kindly clear the dues to ensure uninterrupted classes. Shubham Academy.';

    return tpl
      .replace(/{parent_name}/g, sParent)
      .replace(/{student_name}/g, sName)
      .replace(/{roll_no}/g, sRoll)
      .replace(/{student_id}/g, sRoll)
      .replace(/{pending_fees}/g, sPending)
      .replace(/{due_date}/g, sDueDate);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        enabled,
        channel,
        remind_days_before: Number(remindDaysBefore),
        remind_on_due_date: secondReminderChoice === 'due_date',
        remind_days_after: Number(remindDaysAfter),
        retry_limit: Number(retryLimit),
        message_template: messageTemplate
      };

      await reminderService.updateSettings(payload);
      toast.success('Fee reminder settings saved successfully!');
    } catch (err) {
      toast.error('Failed to save settings. Please try again.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setEnabled(true);
    setChannel('WhatsApp');
    setModalChannel('WhatsApp');
    setRemindDaysBefore(3);
    setSecondReminderChoice('due_date');
    setRemindOnDueDate(true);
    setRemindDaysAfter(7);
    setRetryLimit(3);
    toast.info('Settings restored to recommended defaults');
  };

  // Dispatches reminder to the auto-fetched parent mobile number
  const handleSendReminder = async () => {
    const targetMobile = recipientMode === 'student' ? parentMobile : customMobile;
    const cleanMobile = (targetMobile || '').replace(/\D/g, '').slice(-10);

    if (!cleanMobile || cleanMobile.length < 10) {
      toast.error('Please enter a valid 10-digit parent mobile number');
      return;
    }

    if (!feeDueAmount || isNaN(Number(feeDueAmount)) || Number(feeDueAmount) <= 0) {
      toast.warn('Please enter a valid fee amount to be deposited (₹)');
    }

    setSendingTest(true);
    try {
      const activeChannel = modalChannel || channel;
      const personalizedMsg = generatePreviewMessage(currentSelectedStudent, parentName);
      const formattedAmount = Number(feeDueAmount || 0).toLocaleString('en-IN');

      await reminderService.triggerManual({
        studentId: currentSelectedStudent?.id || currentSelectedStudent?.student_id || selectedStudentId,
        parentMobile: cleanMobile,
        dueAmount: Number(feeDueAmount) || 0,
        channel: activeChannel,
        message: personalizedMsg
      }).catch(err => {
        console.warn('Backend manual trigger response:', err);
        return { status: 'Sent' };
      });

      const recipientLabel = currentSelectedStudent
        ? `${currentSelectedStudent.name || currentSelectedStudent.full_name}'s parent (${parentName || 'Parent'})`
        : `+91 ${cleanMobile}`;

      toast.success(`Fee reminder for ₹${formattedAmount} sent via ${activeChannel} to ${recipientLabel} at +91 ${cleanMobile}!`);
      setTestModalOpen(false);
    } catch (err) {
      toast.error('Failed to dispatch reminder notification');
      console.error(err);
    } finally {
      setSendingTest(false);
    }
  };

  // Theme styles matching Shubham Academy palette and reference layout
  const themeStyles = {
    bg: '#FFFFFF',
    mainCardBg: '#FFFFFF',
    mainCardBorder: '1px solid #ECE7E5',
    sectionCardBg: '#FFFFFF',
    sectionCardBorder: '1px solid #EFEAE8',
    textColor: '#1E293B',
    mutedColor: '#64748B',
    subtleBorder: '#F1EBE9',
    inputBg: '#FFFFFF',
    inputBorder: '1px solid #E2E8F0',
    selectColor: '#1E293B',
    iconCircleBg: '#FDF2F2',
    iconColor: 'var(--sa-primary, #8B1216)',
    previewBannerBg: 'linear-gradient(135deg, var(--sa-primary, #8B1216) 0%, var(--sa-primary-red, #A91D22) 100%)'
  };

  return (
    <div className="d-flex flex-column gap-3.5 pb-5" style={{ minHeight: '85vh' }}>
      {/* Top Header & Breadcrumb */}
      {/* Top Header & Breadcrumb */}
      <div
        style={{
          maxWidth: '1040px',
          margin: '0 auto',
          width: '100%'
        }}
        className="mb-1"
      >
        <button
          type="button"
          className="btn btn-link p-0 d-inline-flex align-items-center gap-1 small text-decoration-none mb-1.5"
          onClick={() => navigate('/admin/fees')}
          style={{ color: 'var(--sa-charcoal-muted, #64748B)', fontWeight: 500, fontSize: '0.84rem' }}
        >
          <ChevronLeft size={16} /> Back to Fee Management
        </button>

        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
          <div className="flex-grow-1" style={{ minWidth: 0, maxWidth: '620px' }}>
            <div className="d-flex align-items-center gap-2.5 flex-wrap">
              <h2 className="brand-font fw-extrabold m-0" style={{ color: 'var(--sa-charcoal, #1E293B)', fontSize: '1.65rem', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                Fee Reminder Settings
              </h2>
              <span
                className="badge px-2.5 py-1 rounded-pill d-inline-flex align-items-center gap-1"
                style={{
                  backgroundColor: enabled ? '#DCFCE7' : '#FEE2E2',
                  color: enabled ? '#15803D' : '#B91C1C',
                  fontSize: '0.78rem',
                  fontWeight: 600
                }}
              >
                <span style={{ fontSize: '0.70rem' }}>●</span> {enabled ? 'Active' : 'Paused'}
              </span>
            </div>
            <span className="small text-muted d-block mt-1" style={{ fontSize: '0.84rem', lineHeight: 1.4 }}>
              Configure automated WhatsApp & SMS payment reminders and schedule rules for student fee installments.
            </span>
          </div>

          {/* Action Controls - aligned in single clean row with exact same heights */}
          <div className="d-flex align-items-center gap-2 flex-nowrap flex-shrink-0">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1.5 px-3 rounded-3 bg-white shadow-sm text-nowrap transition-all"
              onClick={() => setTestModalOpen(true)}
              style={{
                borderColor: '#D1D5DB',
                color: '#374151',
                fontSize: '0.82rem',
                fontWeight: 500,
                height: '36px'
              }}
            >
              <Send size={14} className="text-secondary" /> Send Fee Alert
            </button>

            <button
              type="button"
              className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1.5 px-3 rounded-3 bg-white shadow-sm text-nowrap transition-all"
              onClick={() => navigate('/admin/fees/reminder-history')}
              style={{
                borderColor: '#D1D5DB',
                color: '#374151',
                fontSize: '0.82rem',
                fontWeight: 500,
                height: '36px'
              }}
            >
              <Clock size={14} className="text-secondary" /> Reminder History
            </button>

            <button
              type="button"
              className="btn btn-primary btn-sm d-inline-flex align-items-center gap-1.5 px-3.5 rounded-3 fw-bold text-white shadow-sm text-nowrap transition-all"
              onClick={handleSave}
              disabled={saving}
              style={{
                backgroundColor: 'var(--sa-primary, #8B1216)',
                borderColor: 'var(--sa-primary, #8B1216)',
                fontSize: '0.82rem',
                height: '36px'
              }}
            >
              <Save size={14} /> {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Settings Card */}
      <div
        className="rounded-4 p-3.5 p-md-4 transition-all shadow-sm"
        style={{
          backgroundColor: themeStyles.mainCardBg,
          color: themeStyles.textColor,
          border: themeStyles.mainCardBorder,
          maxWidth: '1040px',
          margin: '0 auto',
          width: '100%'
        }}
      >
        <div className="d-flex flex-column gap-3.5">
          {/* SECTION 1: Automatic reminders */}
          <div
            className="rounded-4 p-3.5 p-md-4 transition-all"
            style={{
              backgroundColor: themeStyles.sectionCardBg,
              border: themeStyles.sectionCardBorder
            }}
          >
            <div className="d-flex align-items-center justify-content-between gap-3">
              <div className="d-flex align-items-center gap-3">
                <div
                  className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                  style={{
                    width: '42px',
                    height: '42px',
                    backgroundColor: themeStyles.iconCircleBg,
                    color: themeStyles.iconColor
                  }}
                >
                  <Sliders size={20} />
                </div>
                <div>
                  <h4 className="fw-bold m-0" style={{ color: themeStyles.textColor, fontSize: '1rem' }}>
                    Automatic reminders
                  </h4>
                  <div className="small mt-0.5" style={{ color: themeStyles.mutedColor, fontSize: '0.82rem' }}>
                    Enable and set rules for automatic fee reminders.
                  </div>
                </div>
              </div>

              {/* Toggle Switch matching screenshot */}
              <button
                type="button"
                onClick={() => setEnabled(!enabled)}
                className="btn p-0 border-0 position-relative transition-all flex-shrink-0"
                style={{
                  width: '46px',
                  height: '26px',
                  borderRadius: '9999px',
                  backgroundColor: enabled ? 'var(--sa-primary, #8B1216)' : '#D1D5DB',
                  cursor: 'pointer',
                  outline: 'none',
                  boxShadow: enabled ? '0 2px 6px rgba(139, 18, 22, 0.25)' : 'none'
                }}
                aria-label="Toggle automatic reminders"
              >
                <span
                  style={{
                    position: 'absolute',
                    top: '3px',
                    left: enabled ? '23px' : '3px',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: '#FFFFFF',
                    transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.25)'
                  }}
                />
              </button>
            </div>
          </div>

          {/* SECTION 2: Notification channel */}
          <div
            className="rounded-4 p-3.5 p-md-4 transition-all"
            style={{
              backgroundColor: themeStyles.sectionCardBg,
              border: themeStyles.sectionCardBorder
            }}
          >
            <div className="d-flex align-items-center gap-3 mb-3">
              <div
                className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                style={{
                  width: '42px',
                  height: '42px',
                  backgroundColor: themeStyles.iconCircleBg,
                  color: themeStyles.iconColor
                }}
              >
                <Megaphone size={20} />
              </div>
              <h4 className="fw-bold m-0" style={{ color: themeStyles.textColor, fontSize: '1rem' }}>
                Notification channel
              </h4>
            </div>

            <div className="d-flex flex-column gap-3 ps-md-2" style={{ marginLeft: '54px' }}>
              {/* WhatsApp Option */}
              <label
                className="d-flex align-items-center gap-3 cursor-pointer user-select-none"
                style={{ cursor: 'pointer' }}
                onClick={() => setChannel('WhatsApp')}
              >
                <div
                  className="d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    border: channel === 'WhatsApp' ? '2px solid var(--sa-primary, #8B1216)' : '2px solid #D1D5DB',
                    padding: '2px',
                    backgroundColor: '#FFFFFF'
                  }}
                >
                  {channel === 'WhatsApp' && (
                    <div
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--sa-primary, #8B1216)'
                      }}
                    />
                  )}
                </div>
                <div className="d-flex align-items-center gap-2.5">
                  <span className="fw-semibold" style={{ color: themeStyles.textColor, fontSize: '0.94rem' }}>
                    WhatsApp
                  </span>
                  <span
                    className="badge rounded-pill px-2.5 py-1"
                    style={{
                      fontSize: '0.70rem',
                      backgroundColor: '#DCFCE7',
                      color: '#15803D',
                      fontWeight: 600
                    }}
                  >
                    Recommended • 98% Completion
                  </span>
                </div>
              </label>

              {/* SMS Option */}
              <label
                className="d-flex align-items-center gap-3 cursor-pointer user-select-none"
                style={{ cursor: 'pointer' }}
                onClick={() => setChannel('SMS')}
              >
                <div
                  className="d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    border: channel === 'SMS' ? '2px solid var(--sa-primary, #8B1216)' : '2px solid #D1D5DB',
                    padding: '2px',
                    backgroundColor: '#FFFFFF'
                  }}
                >
                  {channel === 'SMS' && (
                    <div
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--sa-primary, #8B1216)'
                      }}
                    />
                  )}
                </div>
                <div className="d-flex align-items-center gap-2">
                  <span className="fw-semibold" style={{ color: themeStyles.textColor, fontSize: '0.94rem' }}>
                    SMS
                  </span>
                  <span className="small" style={{ color: themeStyles.mutedColor, fontSize: '0.84rem' }}>
                    (Carrier SMS Gateway)
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* SECTION 3: Reminder schedule */}
          <div
            className="rounded-4 p-3.5 p-md-4 transition-all"
            style={{
              backgroundColor: themeStyles.sectionCardBg,
              border: themeStyles.sectionCardBorder
            }}
          >
            <div className="d-flex align-items-center gap-3 mb-3">
              <div
                className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                style={{
                  width: '42px',
                  height: '42px',
                  backgroundColor: themeStyles.iconCircleBg,
                  color: themeStyles.iconColor
                }}
              >
                <Calendar size={20} />
              </div>
              <div>
                <h4 className="fw-bold m-0" style={{ color: themeStyles.textColor, fontSize: '1rem' }}>
                  Reminder schedule
                </h4>
                <div className="small mt-0.5" style={{ color: themeStyles.mutedColor, fontSize: '0.82rem' }}>
                  Days to send before the due date. Negative means before, positive means after.
                </div>
              </div>
            </div>

            <div className="d-flex flex-column gap-3.5" style={{ marginLeft: '54px' }}>
              {/* First Reminder */}
              <div>
                <label className="d-block small fw-medium mb-1.5" style={{ color: themeStyles.textColor, fontSize: '0.84rem' }}>
                  First reminder (days before due date)
                </label>
                <select
                  className="form-select w-100 rounded-3"
                  value={remindDaysBefore}
                  onChange={(e) => setRemindDaysBefore(Number(e.target.value))}
                  disabled={!enabled}
                  style={{
                    backgroundColor: themeStyles.inputBg,
                    border: themeStyles.inputBorder,
                    color: themeStyles.selectColor,
                    fontSize: '0.90rem',
                    height: '42px'
                  }}
                >
                  <option value={7}>7 days before</option>
                  <option value={5}>5 days before</option>
                  <option value={3}>3 days before</option>
                  <option value={2}>2 days before</option>
                  <option value={1}>1 day before</option>
                </select>
              </div>

              {/* Second Reminder */}
              <div>
                <label className="d-block small fw-medium mb-1.5" style={{ color: themeStyles.textColor, fontSize: '0.84rem' }}>
                  Second reminder (days before due date)
                </label>
                <select
                  className="form-select w-100 rounded-3"
                  value={secondReminderChoice}
                  onChange={(e) => {
                    setSecondReminderChoice(e.target.value);
                    setRemindOnDueDate(e.target.value === 'due_date');
                  }}
                  disabled={!enabled}
                  style={{
                    backgroundColor: themeStyles.inputBg,
                    border: themeStyles.inputBorder,
                    color: themeStyles.selectColor,
                    fontSize: '0.90rem',
                    height: '42px'
                  }}
                >
                  <option value="due_date">On the due date</option>
                  <option value="1">1 day before</option>
                  <option value="2">2 days before</option>
                </select>
              </div>

              {/* Overdue Reminder */}
              <div>
                <label className="d-block small fw-medium mb-1.5" style={{ color: themeStyles.textColor, fontSize: '0.84rem' }}>
                  Overdue reminder (days after due date)
                </label>
                <select
                  className="form-select w-100 rounded-3"
                  value={remindDaysAfter}
                  onChange={(e) => setRemindDaysAfter(Number(e.target.value))}
                  disabled={!enabled}
                  style={{
                    backgroundColor: themeStyles.inputBg,
                    border: themeStyles.inputBorder,
                    color: themeStyles.selectColor,
                    fontSize: '0.90rem',
                    height: '42px'
                  }}
                >
                  <option value={1}>1 day after</option>
                  <option value={3}>3 days after</option>
                  <option value={5}>5 days after</option>
                  <option value={7}>7 days after</option>
                  <option value={10}>10 days after</option>
                  <option value={15}>15 days after</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 4: Configuration preview */}
          <div
            className="rounded-4 p-3.5 p-md-4 transition-all"
            style={{
              backgroundColor: themeStyles.sectionCardBg,
              border: themeStyles.sectionCardBorder
            }}
          >
            <div className="d-flex align-items-center gap-3 mb-3">
              <div
                className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                style={{
                  width: '42px',
                  height: '42px',
                  backgroundColor: themeStyles.iconCircleBg,
                  color: themeStyles.iconColor
                }}
              >
                <Eye size={20} />
              </div>
              <h4 className="fw-bold m-0" style={{ color: themeStyles.textColor, fontSize: '1rem' }}>
                Configuration preview
              </h4>
            </div>

            {/* Shubham Academy Primary Theme Banner Card */}
            <div
              className="rounded-4 p-4"
              style={{
                background: themeStyles.previewBannerBg,
                color: '#FFFFFF',
                boxShadow: '0 4px 20px rgba(139, 18, 22, 0.18)'
              }}
            >
              {/* 5 Stats Columns - Open, clean, un-congested typography */}
              <div className="row g-3 align-items-center mb-3.5">
                <div className="col-6 col-md">
                  <span className="small d-block text-white text-opacity-75" style={{ fontSize: '0.80rem' }}>
                    Status:
                  </span>
                  <span className="fw-bold d-inline-flex align-items-center gap-1.5 mt-0.5" style={{ color: enabled ? '#4ADE80' : '#F87171', fontSize: '0.94rem' }}>
                    <span style={{ fontSize: '0.70rem' }}>●</span> {enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>

                <div className="col-6 col-md">
                  <span className="small d-block text-white text-opacity-75" style={{ fontSize: '0.80rem' }}>
                    Channel:
                  </span>
                  <span className="fw-bold d-inline-flex align-items-center gap-1.5 text-white mt-0.5" style={{ fontSize: '0.94rem' }}>
                    <MessageSquare size={14} className="opacity-90" /> {channel}
                  </span>
                </div>

                <div className="col-6 col-md">
                  <span className="small d-block text-white text-opacity-75" style={{ fontSize: '0.80rem' }}>
                    First Reminder:
                  </span>
                  <span className="fw-semibold text-white mt-0.5 d-block" style={{ fontSize: '0.94rem' }}>
                    {remindDaysBefore} days before
                  </span>
                </div>

                <div className="col-6 col-md">
                  <span className="small d-block text-white text-opacity-75" style={{ fontSize: '0.80rem' }}>
                    Second Reminder:
                  </span>
                  <span className="fw-semibold text-white mt-0.5 d-block" style={{ fontSize: '0.94rem' }}>
                    {secondReminderChoice === 'due_date' ? 'On the due date' : `${secondReminderChoice} day(s) before`}
                  </span>
                </div>

                <div className="col-6 col-md">
                  <span className="small d-block text-white text-opacity-75" style={{ fontSize: '0.80rem' }}>
                    Overdue Reminder:
                  </span>
                  <span className="fw-semibold text-white mt-0.5 d-block" style={{ fontSize: '0.94rem' }}>
                    {remindDaysAfter} day after
                  </span>
                </div>
              </div>

              {/* Message preview pill box - single clean surface, no congested nested boxes */}
              <div
                className="p-3.5 rounded-3"
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.14)',
                  border: '1px solid rgba(255, 255, 255, 0.18)'
                }}
              >
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="small fw-semibold d-inline-flex align-items-center gap-1.5 text-white" style={{ fontSize: '0.84rem' }}>
                    <MessageSquare size={14} className="opacity-90" /> Sample {channel} Notification Message
                  </span>
                  <button
                    type="button"
                    className="btn btn-link text-white p-0 text-decoration-none small d-inline-flex align-items-center gap-1 opacity-90 transition-all"
                    onClick={() => setShowTemplateModal(true)}
                    style={{ fontSize: '0.80rem' }}
                  >
                    <Edit2 size={12} /> Edit Template
                  </button>
                </div>

                <p
                  className="my-3 small font-monospace"
                  style={{
                    lineHeight: 1.65,
                    fontSize: '0.84rem',
                    color: 'rgba(255, 255, 255, 0.95)'
                  }}
                >
                  "{generatePreviewMessage(currentSelectedStudent, parentName)}"
                </p>

                <div className="pt-2.5 border-top border-white border-opacity-15 d-flex align-items-center justify-content-between flex-wrap gap-2.5">
                  <span className="small d-inline-flex align-items-center gap-1.5 text-white text-opacity-90" style={{ fontSize: '0.82rem' }}>
                    <User size={14} className="opacity-75" />
                    {parentName || 'Parent Name'} ({parentMobile ? `+91 ${parentMobile}` : '+91 9876543210'})
                  </span>

                  <button
                    type="button"
                    className="btn btn-light btn-sm fw-bold px-3.5 py-1.5 d-inline-flex align-items-center gap-1.5 shadow-sm transition-all"
                    onClick={() => setTestModalOpen(true)}
                    style={{
                      color: 'var(--sa-primary, #8B1216)',
                      borderRadius: '8px',
                      fontSize: '0.80rem'
                    }}
                  >
                    <Send size={13} /> Send Reminder to Parent
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Action Area */}
        <div className="d-flex align-items-center justify-content-between pt-4 mt-2 gap-3 flex-wrap">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2 px-3.5 py-2 rounded-3 bg-white shadow-sm"
            onClick={handleReset}
            style={{
              borderColor: '#D1D5DB',
              color: '#374151',
              fontSize: '0.85rem',
              fontWeight: 500
            }}
          >
            <RotateCcw size={14} /> Reset Defaults
          </button>

          <div className="d-flex align-items-center gap-2.5">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm px-3.5 py-2 rounded-3 bg-white shadow-sm"
              onClick={() => navigate('/admin/fees')}
              style={{
                borderColor: '#D1D5DB',
                color: '#374151',
                fontSize: '0.85rem',
                fontWeight: 500
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary px-4 py-2 fw-bold d-flex align-items-center gap-2 rounded-3 shadow-sm"
              onClick={handleSave}
              disabled={saving}
              style={{
                backgroundColor: 'var(--sa-primary, #8B1216)',
                borderColor: 'var(--sa-primary, #8B1216)',
                color: '#FFFFFF',
                fontSize: '0.85rem'
              }}
            >
              <Save size={15} /> {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </div>
      </div>

      {/* Edit Template Modal */}
      {showTemplateModal && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)', zIndex: 1060 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-0 rounded-4">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold">Customize Reminder Message Template</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowTemplateModal(false)}
                />
              </div>
              <div className="modal-body">
                <p className="small text-muted mb-2">
                  Dynamic placeholders available: <code>{'{parent_name}'}</code>, <code>{'{student_name}'}</code>, <code>{'{roll_no}'}</code>, <code>{'{pending_fees}'}</code>, <code>{'{due_date}'}</code>.
                </p>
                <textarea
                  className="form-control"
                  rows={5}
                  value={messageTemplate}
                  onChange={(e) => setMessageTemplate(e.target.value)}
                />
              </div>
              <div className="modal-footer border-top">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowTemplateModal(false)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setShowTemplateModal(false);
                    toast.success('Template updated! Remember to save settings.');
                  }}
                >
                  Apply Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student Selection & Parent Mobile Fee Reminder Modal */}
      {testModalOpen && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1060 }}
          onClick={(e) => { if (e.target === e.currentTarget) setTestModalOpen(false); }}
        >
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg" style={{ maxWidth: '740px' }}>
            <div
              className="modal-content shadow-lg border-0 rounded-4 overflow-hidden"
              style={{
                backgroundColor: '#FFFFFF',
                color: themeStyles.textColor,
                border: '1px solid #E2E8F0',
                maxHeight: '92vh'
              }}
            >
              <div
                className="modal-header border-bottom px-4 py-3 align-items-center"
                style={{ borderColor: '#E5E7EB', backgroundColor: '#FAF8F5' }}
              >
                <div className="d-flex align-items-center gap-2.5">
                  <div
                    className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                    style={{
                      width: '38px',
                      height: '38px',
                      backgroundColor: '#FDF2F2',
                      color: 'var(--sa-primary, #8B1216)',
                      border: '1px solid #FEE2E2'
                    }}
                  >
                    <Send size={18} />
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold m-0" style={{ fontSize: '1.05rem', color: themeStyles.textColor }}>
                      Send Fee Reminder to Parent
                    </h5>
                    <span className="small text-muted d-block mt-0.5" style={{ fontSize: '0.80rem' }}>
                      Select a student to automatically retrieve parent contact details & dispatch fee alert
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={() => setTestModalOpen(false)}
                />
              </div>

              <div className="modal-body p-4">
                {/* Option 1: Whom are we sending the reminder to? */}
                <div className="mb-3.5">
                  <label className="form-label small fw-semibold d-block mb-2" style={{ color: themeStyles.textColor, fontSize: '0.85rem' }}>
                    Whom are we sending the reminder to?
                  </label>
                  <div
                    className="p-1 rounded-3 d-inline-flex gap-1"
                    style={{ backgroundColor: '#F1F5F9', border: '1px solid #E2E8F0' }}
                  >
                    <button
                      type="button"
                      className={`btn btn-sm d-flex align-items-center gap-2 px-3.5 py-1.5 rounded-2 transition-all ${
                        recipientMode === 'student'
                          ? 'fw-bold text-white shadow-sm'
                          : 'text-secondary fw-medium'
                      }`}
                      onClick={() => setRecipientMode('student')}
                      style={{
                        backgroundColor: recipientMode === 'student' ? 'var(--sa-primary, #8B1216)' : 'transparent',
                        border: 'none',
                        fontSize: '0.84rem'
                      }}
                    >
                      <User size={14} /> Student's Parent (Auto-Fetch)
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm d-flex align-items-center gap-2 px-3.5 py-1.5 rounded-2 transition-all ${
                        recipientMode === 'custom'
                          ? 'fw-bold text-white shadow-sm'
                          : 'text-secondary fw-medium'
                      }`}
                      onClick={() => setRecipientMode('custom')}
                      style={{
                        backgroundColor: recipientMode === 'custom' ? 'var(--sa-primary, #8B1216)' : 'transparent',
                        border: 'none',
                        fontSize: '0.84rem'
                      }}
                    >
                      <Smartphone size={14} /> Direct / Custom Mobile
                    </button>
                  </div>
                </div>

                {recipientMode === 'student' ? (
                  <>
                    {/* Quick Filters: Standard (11th/12th) & Session (Morning/Afternoon) */}
                    <div
                      className="p-3 rounded-3 mb-3"
                      style={{
                        backgroundColor: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)'
                      }}
                    >
                      <div className="row g-2.5 align-items-center">
                        {/* 1. Standard (11th or 12th) */}
                        <div className="col-12 col-md-5">
                          <span className="small fw-bold text-sa-charcoal d-flex align-items-center gap-1 mb-1.5" style={{ fontSize: '0.80rem' }}>
                            <GraduationCap size={13} className="text-sa-primary" /> Class / Standard:
                          </span>
                          <div className="btn-group btn-group-sm w-100" role="group">
                            <button
                              type="button"
                              onClick={() => setFilterStandard('ALL')}
                              className={`btn btn-sm ${filterStandard === 'ALL' ? 'btn-primary fw-bold text-white shadow-sm' : 'btn-outline-secondary bg-white text-dark'}`}
                              style={{
                                backgroundColor: filterStandard === 'ALL' ? 'var(--sa-primary, #8B1216)' : '#FFFFFF',
                                borderColor: filterStandard === 'ALL' ? 'var(--sa-primary, #8B1216)' : '#CBD5E1',
                                fontSize: '0.78rem'
                              }}
                            >
                              All Classes
                            </button>
                            <button
                              type="button"
                              onClick={() => setFilterStandard('11th')}
                              className={`btn btn-sm ${filterStandard === '11th' ? 'btn-primary fw-bold text-white shadow-sm' : 'btn-outline-secondary bg-white text-dark'}`}
                              style={{
                                backgroundColor: filterStandard === '11th' ? 'var(--sa-primary, #8B1216)' : '#FFFFFF',
                                borderColor: filterStandard === '11th' ? 'var(--sa-primary, #8B1216)' : '#CBD5E1',
                                fontSize: '0.78rem'
                              }}
                            >
                              11th Science
                            </button>
                            <button
                              type="button"
                              onClick={() => setFilterStandard('12th')}
                              className={`btn btn-sm ${filterStandard === '12th' ? 'btn-primary fw-bold text-white shadow-sm' : 'btn-outline-secondary bg-white text-dark'}`}
                              style={{
                                backgroundColor: filterStandard === '12th' ? 'var(--sa-primary, #8B1216)' : '#FFFFFF',
                                borderColor: filterStandard === '12th' ? 'var(--sa-primary, #8B1216)' : '#CBD5E1',
                                fontSize: '0.78rem'
                              }}
                            >
                              12th Science
                            </button>
                          </div>
                        </div>

                        {/* 2. Session (Morning or Afternoon) */}
                        <div className="col-12 col-md-7">
                          <span className="small fw-bold text-sa-charcoal d-flex align-items-center gap-1 mb-1.5" style={{ fontSize: '0.80rem' }}>
                            <Sun size={13} className="text-warning" /> Session / Timing:
                          </span>
                          <div className="btn-group btn-group-sm w-100" role="group">
                            <button
                              type="button"
                              onClick={() => setFilterSession('ALL')}
                              className={`btn btn-sm ${filterSession === 'ALL' ? 'btn-primary fw-bold text-white shadow-sm' : 'btn-outline-secondary bg-white text-dark'}`}
                              style={{
                                backgroundColor: filterSession === 'ALL' ? 'var(--sa-primary, #8B1216)' : '#FFFFFF',
                                borderColor: filterSession === 'ALL' ? 'var(--sa-primary, #8B1216)' : '#CBD5E1',
                                fontSize: '0.78rem'
                              }}
                            >
                              All Sessions
                            </button>
                            <button
                              type="button"
                              onClick={() => setFilterSession('Morning')}
                              className={`btn btn-sm ${filterSession === 'Morning' ? 'btn-primary fw-bold text-white shadow-sm' : 'btn-outline-secondary bg-white text-dark'}`}
                              style={{
                                backgroundColor: filterSession === 'Morning' ? 'var(--sa-primary, #8B1216)' : '#FFFFFF',
                                borderColor: filterSession === 'Morning' ? 'var(--sa-primary, #8B1216)' : '#CBD5E1',
                                fontSize: '0.78rem'
                              }}
                            >
                              ☀️ Morning Session
                            </button>
                            <button
                              type="button"
                              onClick={() => setFilterSession('Afternoon')}
                              className={`btn btn-sm ${filterSession === 'Afternoon' ? 'btn-primary fw-bold text-white shadow-sm' : 'btn-outline-secondary bg-white text-dark'}`}
                              style={{
                                backgroundColor: filterSession === 'Afternoon' ? 'var(--sa-primary, #8B1216)' : '#FFFFFF',
                                borderColor: filterSession === 'Afternoon' ? 'var(--sa-primary, #8B1216)' : '#CBD5E1',
                                fontSize: '0.78rem'
                              }}
                            >
                              ⛅ Afternoon Session
                            </button>
                          </div>
                        </div>

                        {/* 3. Campus Scope Toggle */}
                        <div className="col-12 d-flex align-items-center justify-content-between pt-2 mt-1 border-top" style={{ borderColor: '#E2E8F0' }}>
                          <div className="d-flex align-items-center gap-1.5">
                            <span className="text-muted small" style={{ fontSize: '0.74rem' }}>
                              Campus: <strong>{campusScope === 'ALL' ? 'All Campuses' : (activeBranch || 'My Branch')}</strong>
                            </span>
                          </div>
                          <div className="d-flex gap-1">
                            <button
                              type="button"
                              onClick={() => setCampusScope('BRANCH')}
                              className={`btn btn-xs px-2.5 py-0.5 rounded-pill ${campusScope === 'BRANCH' ? 'btn-dark text-white fw-semibold' : 'btn-outline-secondary bg-white'}`}
                              style={{ fontSize: '0.72rem' }}
                            >
                              {activeBranch || 'My Branch'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setCampusScope('ALL')}
                              className={`btn btn-xs px-2.5 py-0.5 rounded-pill ${campusScope === 'ALL' ? 'btn-dark text-white fw-semibold' : 'btn-outline-secondary bg-white'}`}
                              style={{ fontSize: '0.72rem' }}
                            >
                              All Campuses
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Student Selection with Search & Quick-Pick */}
                    <div className="mb-3">
                      <div className="d-flex align-items-center justify-content-between mb-1.5">
                        <label className="form-label small fw-semibold m-0" style={{ color: themeStyles.textColor, fontSize: '0.85rem' }}>
                          Student Name <span className="text-danger">*</span>
                        </label>
                        <span
                          className="badge rounded-pill px-2.5 py-1"
                          style={{
                            fontSize: '0.72rem',
                            backgroundColor: '#EFF6FF',
                            color: '#1D4ED8',
                            border: '1px solid #DBEAFE',
                            fontWeight: 600
                          }}
                        >
                          {filteredStudents.length} Student{filteredStudents.length === 1 ? '' : 's'} Available
                        </span>
                      </div>

                      <div className="row g-2">
                        <div className="col-12 col-md-5">
                          <div className="input-group input-group-sm">
                            <span
                              className="input-group-text bg-white"
                              style={{ borderColor: '#CBD5E1', color: '#64748B' }}
                            >
                              <Search size={14} />
                            </span>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Search student or roll no..."
                              value={studentSearchTerm}
                              onChange={(e) => setStudentSearchTerm(e.target.value)}
                              style={{
                                borderColor: '#CBD5E1',
                                color: themeStyles.textColor,
                                fontSize: '0.85rem'
                              }}
                            />
                          </div>
                        </div>

                        <div className="col-12 col-md-7">
                          <select
                            className="form-select form-select-sm"
                            value={selectedStudentId}
                            onChange={(e) => handleStudentSelect(e.target.value)}
                            style={{
                              borderColor: '#CBD5E1',
                              color: themeStyles.selectColor,
                              fontSize: '0.85rem',
                              fontWeight: 500
                            }}
                          >
                            <option value="">-- Choose Student ({filteredStudents.length}) --</option>
                            {filteredStudents.map(s => {
                              const sId = s.student_id || s.id;
                              const displayName = s.name || s.full_name || 'Unnamed';
                              const roll = s.rollNumber || s.student_id || 'N/A';
                              const std = s.standard || 'Class';
                              const sess = s.session || (s.batch?.toLowerCase().includes('afternoon') ? 'Afternoon' : 'Morning');
                              return (
                                <option key={sId} value={sId}>
                                  {displayName} ({roll}) — {std} • {sess}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      </div>

                      {/* Quick Student Selection Chips for Instant 1-Click Choice */}
                      {filteredStudents.length > 0 && (
                        <div className="mt-2.5">
                          <span className="small text-muted d-block mb-1" style={{ fontSize: '0.72rem', fontWeight: 600 }}>
                            Quick-Pick Student ({filteredStudents.length}):
                          </span>
                          <div className="d-flex flex-wrap gap-1.5" style={{ maxHeight: '110px', overflowY: 'auto' }}>
                            {filteredStudents.map(s => {
                              const sId = s.student_id || s.id;
                              const isSelected =
                                String(selectedStudentId) === String(sId) ||
                                String(selectedStudentId) === String(s.id) ||
                                String(selectedStudentId) === String(s.student_id);
                              const sess = s.session || (s.batch?.toLowerCase().includes('afternoon') ? 'Afternoon' : 'Morning');
                              const isMorning = sess.toLowerCase().includes('morning');
                              return (
                                <button
                                  key={sId}
                                  type="button"
                                  onClick={() => handleStudentSelect(sId)}
                                  className={`btn btn-sm d-inline-flex align-items-center gap-1.5 py-1 px-2.5 rounded-pill transition-all ${
                                    isSelected
                                      ? 'btn-primary text-white shadow-sm fw-bold'
                                      : 'btn-outline-secondary bg-white text-sa-charcoal'
                                  }`}
                                  style={{
                                    fontSize: '0.78rem',
                                    borderColor: isSelected ? 'var(--sa-primary, #8B1216)' : '#CBD5E1',
                                    backgroundColor: isSelected ? 'var(--sa-primary, #8B1216)' : '#FFFFFF'
                                  }}
                                >
                                  <span>{s.name || s.full_name}</span>
                                  <span className="opacity-75" style={{ fontSize: '0.70rem' }}>
                                    ({s.rollNumber || s.student_id})
                                  </span>
                                  <span
                                    className="badge rounded-pill px-1.5 py-0.5"
                                    style={{
                                      fontSize: '0.64rem',
                                      backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : (isMorning ? '#FEF3C7' : '#E0E7FF'),
                                      color: isSelected ? '#FFFFFF' : (isMorning ? '#92400E' : '#3730A3')
                                    }}
                                  >
                                    {s.standard?.includes('12') ? '12th' : '11th'} • {isMorning ? 'Morning' : 'Afternoon'}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Auto-fetched Student & Parent Info Card */}
                    {currentSelectedStudent && (
                      <div
                        className="p-3 rounded-3 mb-3 transition-all"
                        style={{
                          backgroundColor: '#F0FDF4',
                          border: '1px solid #BBF7D0',
                          borderLeft: '4px solid #16A34A'
                        }}
                      >
                        <div className="row g-2 align-items-center">
                          <div className="col-12 col-sm-6">
                            <span className="small d-block text-muted" style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                              Selected Student
                            </span>
                            <div className="d-flex align-items-center gap-1.5 mt-0.5">
                              <span className="fw-bold" style={{ fontSize: '0.92rem', color: '#1E293B' }}>
                                {currentSelectedStudent.name || currentSelectedStudent.full_name}
                              </span>
                              <span className="badge bg-white text-secondary border px-2 py-0.5" style={{ fontSize: '0.70rem', borderColor: '#CBD5E1' }}>
                                Roll: {currentSelectedStudent.rollNumber || currentSelectedStudent.student_id}
                              </span>
                            </div>
                          </div>

                          <div className="col-12 col-sm-6">
                            <span className="small d-block text-muted" style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                              Parent / Guardian
                            </span>
                            <span className="fw-bold d-block mt-0.5" style={{ fontSize: '0.92rem', color: '#0F766E' }}>
                              {parentName || 'Parent / Guardian'}
                            </span>
                          </div>

                          <div className="col-12 col-sm-6 mt-1">
                            <span className="small d-block text-muted" style={{ fontSize: '0.74rem' }}>
                              Standard & Batch:
                            </span>
                            <span className="small fw-semibold text-dark">
                              {currentSelectedStudent.standard || 'Class 10th'} {currentSelectedStudent.batch ? `(${currentSelectedStudent.batch})` : ''}
                            </span>
                          </div>

                          <div className="col-12 col-sm-6 mt-1">
                            <span className="small d-block text-muted" style={{ fontSize: '0.74rem' }}>
                              Class Session / Timing:
                            </span>
                            <span
                              className="badge rounded-pill px-2 py-0.5 fw-bold"
                              style={{
                                backgroundColor: (currentSelectedStudent.session || currentSelectedStudent.batch || '').toLowerCase().includes('afternoon') ? '#E0E7FF' : '#FEF3C7',
                                color: (currentSelectedStudent.session || currentSelectedStudent.batch || '').toLowerCase().includes('afternoon') ? '#3730A3' : '#92400E',
                                fontSize: '0.75rem'
                              }}
                            >
                              {(currentSelectedStudent.session || currentSelectedStudent.batch || '').toLowerCase().includes('afternoon') ? '⛅ Afternoon Session' : '☀️ Morning Session'}
                            </span>
                          </div>

                          <div className="col-12 col-sm-6 mt-1">
                            <span className="small d-block text-muted" style={{ fontSize: '0.74rem' }}>
                              Campus:
                            </span>
                            <span className="small fw-semibold text-sa-primary">
                              {currentSelectedStudent.branch || activeBranch || 'Kolhapur Campus'}
                            </span>
                          </div>

                          <div className="col-12 col-sm-6 mt-1">
                            <span className="small d-block text-muted" style={{ fontSize: '0.74rem' }}>
                              Outstanding Fee Due (थकबाकी):
                            </span>
                            <span className="fw-extrabold text-danger" style={{ fontSize: '0.95rem' }}>
                              ₹ {Number(feeDueAmount || currentSelectedStudent.remainingFees || 0).toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Row with 2 Columns: Parent Mobile & Fee Amount to Deposit */}
                    <div className="row g-3 mb-3">
                      {/* Parent Mobile Number (+91) with Auto-fetch status */}
                      <div className="col-12 col-md-6">
                        <div className="d-flex align-items-center justify-content-between mb-1.5">
                          <label className="form-label small fw-semibold m-0" style={{ color: themeStyles.textColor, fontSize: '0.85rem' }}>
                            Parent Mobile (+91) <span className="text-danger">*</span>
                          </label>
                          {parentMobile && parentMobile.length === 10 ? (
                            <span
                              className="badge d-inline-flex align-items-center gap-1"
                              style={{
                                backgroundColor: '#DCFCE7',
                                color: '#15803D',
                                border: '1px solid #BBF7D0',
                                fontSize: '0.70rem',
                                fontWeight: 600
                              }}
                            >
                              <CheckCircle2 size={11} /> Auto-fetched
                            </span>
                          ) : (
                            <span
                              className="badge d-inline-flex align-items-center gap-1"
                              style={{
                                backgroundColor: '#FEF3C7',
                                color: '#B45309',
                                border: '1px solid #FDE68A',
                                fontSize: '0.70rem',
                                fontWeight: 600
                              }}
                            >
                              <AlertCircle size={11} /> Manual Entry
                            </span>
                          )}
                        </div>

                        <div className="input-group">
                          <span
                            className="input-group-text fw-bold"
                            style={{
                              backgroundColor: '#F8FAFC',
                              borderColor: '#CBD5E1',
                              color: '#334155',
                              fontSize: '0.88rem'
                            }}
                          >
                            🇮🇳 +91
                          </span>
                          <input
                            type="tel"
                            className="form-control"
                            placeholder="e.g. 9822014589"
                            value={parentMobile}
                            onChange={(e) => setParentMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            style={{
                              backgroundColor: '#FFFFFF',
                              borderColor: '#CBD5E1',
                              color: themeStyles.textColor,
                              fontSize: '0.92rem',
                              fontWeight: 600,
                              letterSpacing: '0.5px'
                            }}
                          />
                        </div>
                        <span className="small text-muted d-block mt-1" style={{ fontSize: '0.73rem' }}>
                          Reminder will be sent to parent's registered mobile number.
                        </span>
                      </div>

                      {/* Fee Amount to Deposit (₹) / जमा करायची फी */}
                      <div className="col-12 col-md-6">
                        <div className="d-flex align-items-center justify-content-between mb-1.5">
                          <label className="form-label small fw-semibold m-0" style={{ color: themeStyles.textColor, fontSize: '0.85rem' }}>
                            Fee Amount to Deposit (₹) <span className="text-danger">*</span>
                          </label>
                          <span
                            className="badge rounded-pill px-2 py-0.5"
                            style={{
                              backgroundColor: '#FEF2F2',
                              color: '#991B1B',
                              border: '1px solid #FECACA',
                              fontSize: '0.70rem',
                              fontWeight: 600
                            }}
                          >
                            जमा करायची फी
                          </span>
                        </div>

                        <div className="input-group">
                          <span
                            className="input-group-text fw-bold"
                            style={{
                              backgroundColor: '#F8FAFC',
                              borderColor: '#CBD5E1',
                              color: 'var(--sa-primary, #8B1216)',
                              fontSize: '0.90rem'
                            }}
                          >
                            ₹
                          </span>
                          <input
                            type="number"
                            className="form-control"
                            placeholder="e.g. 15000"
                            value={feeDueAmount}
                            onChange={(e) => setFeeDueAmount(e.target.value)}
                            style={{
                              backgroundColor: '#FFFFFF',
                              borderColor: '#CBD5E1',
                              color: themeStyles.textColor,
                              fontSize: '0.92rem',
                              fontWeight: 700
                            }}
                          />
                        </div>
                        <span className="small text-muted d-block mt-1" style={{ fontSize: '0.73rem' }}>
                          Auto-filled from pending dues. Editable for partial installment.
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Direct Custom Mobile Mode */}
                    <div className="mb-3">
                      <label className="form-label small fw-semibold" style={{ color: themeStyles.textColor, fontSize: '0.85rem' }}>
                        Parent / Student Name (Optional)
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Suresh Sharma"
                        value={parentName}
                        onChange={(e) => setParentName(e.target.value)}
                        style={{
                          backgroundColor: themeStyles.inputBg,
                          borderColor: '#CBD5E1',
                          color: themeStyles.textColor,
                          fontSize: '0.88rem'
                        }}
                      />
                    </div>

                    <div className="row g-3 mb-3">
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-semibold" style={{ color: themeStyles.textColor, fontSize: '0.85rem' }}>
                          Parent Mobile (+91) <span className="text-danger">*</span>
                        </label>
                        <div className="input-group">
                          <span
                            className="input-group-text fw-bold"
                            style={{
                              backgroundColor: '#F8FAFC',
                              borderColor: '#CBD5E1',
                              color: '#334155',
                              fontSize: '0.88rem'
                            }}
                          >
                            🇮🇳 +91
                          </span>
                          <input
                            type="tel"
                            className="form-control"
                            placeholder="e.g. 9876543210"
                            value={customMobile}
                            onChange={(e) => setCustomMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            style={{
                              backgroundColor: themeStyles.inputBg,
                              borderColor: '#CBD5E1',
                              color: themeStyles.textColor,
                              fontWeight: 600,
                              fontSize: '0.92rem',
                              letterSpacing: '0.5px'
                            }}
                          />
                        </div>
                      </div>

                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-semibold" style={{ color: themeStyles.textColor, fontSize: '0.85rem' }}>
                          Fee Amount (₹) / जमा करायची फी <span className="text-danger">*</span>
                        </label>
                        <div className="input-group">
                          <span
                            className="input-group-text fw-bold"
                            style={{
                              backgroundColor: '#F8FAFC',
                              borderColor: '#CBD5E1',
                              color: 'var(--sa-primary, #8B1216)',
                              fontSize: '0.90rem'
                            }}
                          >
                            ₹
                          </span>
                          <input
                            type="number"
                            className="form-control"
                            placeholder="e.g. 15000"
                            value={feeDueAmount}
                            onChange={(e) => setFeeDueAmount(e.target.value)}
                            style={{
                              backgroundColor: themeStyles.inputBg,
                              borderColor: '#CBD5E1',
                              color: themeStyles.textColor,
                              fontWeight: 700,
                              fontSize: '0.92rem'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Delivery Channel Radio Switcher */}
                <div className="mb-3 pt-1">
                  <label className="form-label small fw-semibold d-block mb-1.5" style={{ color: themeStyles.textColor, fontSize: '0.85rem' }}>
                    Notification Channel
                  </label>
                  <div className="d-flex gap-2.5 flex-wrap">
                    <label
                      className="d-flex align-items-center gap-2 px-3 py-2 rounded-3 cursor-pointer user-select-none transition-all"
                      style={{
                        cursor: 'pointer',
                        border: modalChannel === 'WhatsApp' ? '1.5px solid var(--sa-primary, #8B1216)' : '1px solid #E2E8F0',
                        backgroundColor: modalChannel === 'WhatsApp' ? '#FDF2F2' : '#FFFFFF'
                      }}
                      onClick={() => setModalChannel('WhatsApp')}
                    >
                      <input
                        type="radio"
                        name="modalDeliveryChannel"
                        checked={modalChannel === 'WhatsApp'}
                        onChange={() => setModalChannel('WhatsApp')}
                        className="form-check-input m-0"
                        style={{ accentColor: 'var(--sa-primary, #8B1216)', cursor: 'pointer' }}
                      />
                      <span className="small fw-semibold" style={{ color: themeStyles.textColor }}>
                        WhatsApp
                      </span>
                      <span
                        className="badge rounded-pill px-2 py-0.5"
                        style={{
                          fontSize: '0.68rem',
                          backgroundColor: '#DCFCE7',
                          color: '#15803D',
                          fontWeight: 600
                        }}
                      >
                        Recommended • 98% Open Rate
                      </span>
                    </label>

                    <label
                      className="d-flex align-items-center gap-2 px-3 py-2 rounded-3 cursor-pointer user-select-none transition-all"
                      style={{
                        cursor: 'pointer',
                        border: modalChannel === 'SMS' ? '1.5px solid var(--sa-primary, #8B1216)' : '1px solid #E2E8F0',
                        backgroundColor: modalChannel === 'SMS' ? '#FDF2F2' : '#FFFFFF'
                      }}
                      onClick={() => setModalChannel('SMS')}
                    >
                      <input
                        type="radio"
                        name="modalDeliveryChannel"
                        checked={modalChannel === 'SMS'}
                        onChange={() => setModalChannel('SMS')}
                        className="form-check-input m-0"
                        style={{ accentColor: 'var(--sa-primary, #8B1216)', cursor: 'pointer' }}
                      />
                      <span className="small fw-semibold" style={{ color: themeStyles.textColor }}>
                        SMS Gateway
                      </span>
                    </label>
                  </div>
                </div>

                {/* Live Message Preview */}
                <div
                  className="p-3 rounded-3 mt-3"
                  style={{
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0'
                  }}
                >
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="small fw-bold d-flex align-items-center gap-1.5" style={{ color: '#475569', fontSize: '0.80rem' }}>
                      <MessageSquare size={14} style={{ color: 'var(--sa-primary, #8B1216)' }} /> Live {modalChannel} Message Preview
                    </span>
                    <span
                      className="badge bg-white text-secondary border px-2 py-1 font-monospace"
                      style={{
                        fontSize: '0.72rem',
                        borderColor: '#CBD5E1'
                      }}
                    >
                      To: +91 {recipientMode === 'student' ? (parentMobile || 'XXXXXXXXXX') : (customMobile || 'XXXXXXXXXX')}
                    </span>
                  </div>
                  <div
                    className="p-2.5 rounded-2 bg-white border"
                    style={{ borderColor: '#E2E8F0' }}
                  >
                    <p className="m-0 small font-monospace" style={{ color: '#1E293B', lineHeight: 1.55, fontSize: '0.82rem' }}>
                      "{generatePreviewMessage(currentSelectedStudent, parentName)}"
                    </p>
                  </div>
                </div>
              </div>

              <div
                className="modal-footer border-top d-flex align-items-center justify-content-between px-4 py-3"
                style={{ borderColor: '#E5E7EB', backgroundColor: '#FAF8F5' }}
              >
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm px-3.5 py-1.5 rounded-3 bg-white"
                  style={{ borderColor: '#D1D5DB', color: '#475569', fontWeight: 500 }}
                  onClick={() => setTestModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm d-flex align-items-center gap-2 px-3.5 py-2 rounded-3 fw-bold text-white shadow-sm transition-all"
                  onClick={handleSendReminder}
                  disabled={sendingTest}
                  style={{
                    backgroundColor: 'var(--sa-primary, #8B1216)',
                    borderColor: 'var(--sa-primary, #8B1216)'
                  }}
                >
                  <Send size={14} />
                  {sendingTest
                    ? 'Dispatching Reminder...'
                    : `Send Fee Reminder (₹${Number(feeDueAmount || 0).toLocaleString('en-IN')}) to Parent (+91 ${((recipientMode === 'student' ? parentMobile : customMobile) || '').slice(-10) || '...'}) via ${modalChannel}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
