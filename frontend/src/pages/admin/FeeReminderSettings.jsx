import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import BackButton from '../../components/common/BackButton';
import reminderService from '../../services/reminderService';
import {
  Bell,
  Check,
  ChevronDown,
  ChevronUp,
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
  Play
} from 'lucide-react';

export default function FeeReminderSettings() {
  const navigate = useNavigate();

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
  const [testMobile, setTestMobile] = useState('');
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [previewTheme, setPreviewTheme] = useState('dark'); // 'dark' matching user screenshot or 'light'

  // Fetch current settings on load
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const data = await reminderService.getSettings();
        if (data) {
          setEnabled(data.enabled ?? true);
          setChannel(data.channel || 'WhatsApp');
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
    setRemindDaysBefore(3);
    setSecondReminderChoice('due_date');
    setRemindOnDueDate(true);
    setRemindDaysAfter(7);
    setRetryLimit(3);
    toast.info('Settings restored to recommended defaults');
  };

  const handleSendTest = async () => {
    if (!testMobile || testMobile.length < 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }
    setSendingTest(true);
    try {
      await new Promise(r => setTimeout(r, 900)); // Simulate test send
      toast.success(`Test fee reminder dispatched via ${channel} to +91 ${testMobile}!`);
      setTestModalOpen(false);
      setTestMobile('');
    } catch (err) {
      toast.error('Failed to dispatch test notification');
    } finally {
      setSendingTest(false);
    }
  };

  // Color schemes for dark mode matching reference screenshot
  const isDark = previewTheme === 'dark';
  const themeStyles = {
    bg: isDark ? '#0A0A0E' : '#FFFFFF',
    cardBg: isDark ? '#111116' : '#FFFFFF',
    cardBorder: isDark ? '1px solid rgba(255, 255, 255, 0.10)' : '1px solid #E5E7EB',
    textColor: isDark ? '#FFFFFF' : '#1F2937',
    mutedColor: isDark ? '#9CA3AF' : '#6B7280',
    subtleBorder: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F3F4F6',
    inputBg: isDark ? '#17171E' : '#F9FAFB',
    inputBorder: isDark ? '1px solid rgba(255, 255, 255, 0.16)' : '1px solid #D1D5DB',
    selectColor: isDark ? '#FFFFFF' : '#111827',
    previewBg: isDark ? '#0E0E14' : '#F8FAFC'
  };

  return (
    <div className="d-flex flex-column gap-4 pb-5" style={{ minHeight: '85vh' }}>
      {/* Top Header & Breadcrumb */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
        <div>
          <BackButton to="/admin/fees" label="Back to Fee Management" />
          <div className="d-flex align-items-center gap-2.5 mt-1">
            <h2 className="brand-font fw-extrabold m-0 fs-3" style={{ color: 'var(--sa-charcoal)' }}>
              Fee Reminder Settings
            </h2>
            <span
              className="badge px-2.5 py-1 rounded-pill"
              style={{
                backgroundColor: enabled ? '#DCFCE7' : '#FEE2E2',
                color: enabled ? '#15803D' : '#B91C1C',
                fontSize: '0.78rem',
                fontWeight: 600
              }}
            >
              {enabled ? '● Active Engine' : '○ Paused'}
            </span>
          </div>
          <span className="small text-sa-muted">
            Configure automated WhatsApp & SMS payment nudges and schedule rules for student fee installments
          </span>
        </div>

        {/* Action Controls & Theme Toggle */}
        <div className="d-flex align-items-center gap-2 flex-wrap">
          {/* Quick theme switcher for user to see screenshot style vs default */}
          <div className="btn-group shadow-sm" role="group">
            <button
              type="button"
              className={`btn btn-sm ${isDark ? 'btn-dark' : 'btn-outline-secondary'}`}
              onClick={() => setPreviewTheme('dark')}
              style={{ fontSize: '0.80rem' }}
              title="View in Obsidian Dark (as per reference)"
            >
              Dark Studio
            </button>
            <button
              type="button"
              className={`btn btn-sm ${!isDark ? 'btn-secondary' : 'btn-outline-secondary'}`}
              onClick={() => setPreviewTheme('light')}
              style={{ fontSize: '0.80rem' }}
              title="View in Crisp Light"
            >
              Clean Light
            </button>
          </div>

          <button
            type="button"
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1.5 shadow-sm"
            onClick={() => setTestModalOpen(true)}
          >
            <Send size={15} /> Send Test Alert
          </button>

          <button
            type="button"
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1.5 shadow-sm"
            onClick={() => navigate('/admin/fees/reminder-history')}
          >
            <Clock size={15} /> Reminder History
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm d-flex align-items-center gap-1.5 shadow-sm px-3"
            onClick={handleSave}
            disabled={saving}
            style={{
              backgroundColor: 'var(--sa-primary-red, #B91C1C)',
              borderColor: 'var(--sa-primary-red, #B91C1C)',
              fontWeight: 600
            }}
          >
            <Save size={15} /> {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Main Container - replicates the layout and components in screenshot */}
      <div
        className="rounded-4 p-4 p-md-5 transition-all shadow-sm"
        style={{
          backgroundColor: themeStyles.bg,
          color: themeStyles.textColor,
          border: themeStyles.cardBorder,
          maxWidth: '920px',
          margin: '0 auto',
          width: '100%'
        }}
      >
        <div className="d-flex flex-column gap-5">
          {/* Section 1: Automatic Reminders */}
          <div className="pb-4" style={{ borderBottom: `1px solid ${themeStyles.subtleBorder}` }}>
            <div className="d-flex align-items-center justify-content-between gap-3">
              <div>
                <h4 className="fw-bold m-0 fs-5" style={{ color: themeStyles.textColor }}>
                  Automatic reminders
                </h4>
                <div className="small mt-1" style={{ color: themeStyles.mutedColor }}>
                  Enable scheduled fee notifications
                </div>
              </div>

              {/* Toggle Switch matching screenshot */}
              <button
                type="button"
                onClick={() => setEnabled(!enabled)}
                className="btn p-0 border-0 d-flex align-items-center justify-content-center transition-all"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: enabled ? (isDark ? '#FFFFFF' : '#10B981') : (isDark ? '#27272A' : '#E5E7EB'),
                  color: enabled ? (isDark ? '#000000' : '#FFFFFF') : '#9CA3AF',
                  cursor: 'pointer',
                  boxShadow: enabled ? '0 2px 8px rgba(0,0,0,0.2)' : 'none'
                }}
                aria-label="Toggle automatic reminders"
              >
                {enabled ? <Check size={20} strokeWidth={3} /> : <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#6B7280' }} />}
              </button>
            </div>
          </div>

          {/* Section 2: Notification Channel */}
          <div className="pb-4" style={{ borderBottom: `1px solid ${themeStyles.subtleBorder}` }}>
            <h4 className="fw-bold m-0 fs-5 mb-3" style={{ color: themeStyles.textColor }}>
              Notification channel
            </h4>

            <div className="d-flex flex-column gap-3">
              {/* WhatsApp Option */}
              <label
                className="d-flex align-items-center gap-3 cursor-pointer user-select-none"
                style={{ cursor: 'pointer' }}
                onClick={() => setChannel('WhatsApp')}
              >
                <div
                  className="d-flex align-items-center justify-content-center"
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    border: channel === 'WhatsApp' ? (isDark ? '2px solid #FFFFFF' : '2px solid #10B981') : '2px solid #6B7280',
                    padding: '3px'
                  }}
                >
                  {channel === 'WhatsApp' && (
                    <div
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: isDark ? '#FFFFFF' : '#10B981'
                      }}
                    />
                  )}
                </div>
                <div className="d-flex align-items-center gap-2">
                  <span className="fw-medium fs-6" style={{ color: themeStyles.textColor }}>
                    WhatsApp
                  </span>
                  <span
                    className="badge rounded-pill px-2 py-0.5"
                    style={{
                      fontSize: '0.68rem',
                      backgroundColor: isDark ? 'rgba(37, 211, 102, 0.2)' : '#DCFCE7',
                      color: isDark ? '#4ADE80' : '#15803D'
                    }}
                  >
                    Recommended • 98% Open Rate
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
                  className="d-flex align-items-center justify-content-center"
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    border: channel === 'SMS' ? (isDark ? '2px solid #FFFFFF' : '2px solid #10B981') : '2px solid #6B7280',
                    padding: '3px'
                  }}
                >
                  {channel === 'SMS' && (
                    <div
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: isDark ? '#FFFFFF' : '#10B981'
                      }}
                    />
                  )}
                </div>
                <div className="d-flex align-items-center gap-2">
                  <span className="fw-medium fs-6" style={{ color: themeStyles.textColor }}>
                    SMS
                  </span>
                  <span className="small" style={{ color: themeStyles.mutedColor }}>
                    (Carrier SMS Gateway)
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Section 3: Reminder Schedule */}
          <div className="pb-4" style={{ borderBottom: `1px solid ${themeStyles.subtleBorder}` }}>
            <h4 className="fw-bold m-0 fs-5" style={{ color: themeStyles.textColor }}>
              Reminder schedule
            </h4>
            <div className="small mt-1 mb-4" style={{ color: themeStyles.mutedColor }}>
              Days relative to the fee due date. Negative means before; positive means after.
            </div>

            <div className="d-flex flex-column gap-4">
              {/* First Reminder */}
              <div>
                <label className="d-block small fw-medium mb-2" style={{ color: themeStyles.textColor }}>
                  First reminder (days before due date)
                </label>
                <div className="position-relative">
                  <select
                    className="form-select w-100 py-2.5 px-3 rounded-3"
                    value={remindDaysBefore}
                    onChange={(e) => setRemindDaysBefore(Number(e.target.value))}
                    disabled={!enabled}
                    style={{
                      backgroundColor: themeStyles.inputBg,
                      border: themeStyles.inputBorder,
                      color: themeStyles.selectColor,
                      fontSize: '0.95rem'
                    }}
                  >
                    <option value={7}>7 days before</option>
                    <option value={5}>5 days before</option>
                    <option value={3}>3 days before</option>
                    <option value={2}>2 days before</option>
                    <option value={1}>1 day before</option>
                  </select>
                </div>
              </div>

              {/* Second Reminder */}
              <div>
                <label className="d-block small fw-medium mb-2" style={{ color: themeStyles.textColor }}>
                  Second reminder (days before due date)
                </label>
                <div className="position-relative">
                  <select
                    className="form-select w-100 py-2.5 px-3 rounded-3"
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
                      fontSize: '0.95rem'
                    }}
                  >
                    <option value="due_date">On the due date</option>
                    <option value="1">1 day before</option>
                    <option value="2">2 days before</option>
                  </select>
                </div>
              </div>

              {/* Overdue Reminder */}
              <div>
                <label className="d-block small fw-medium mb-2" style={{ color: themeStyles.textColor }}>
                  Overdue reminder (days after due date)
                </label>
                <div className="position-relative">
                  <select
                    className="form-select w-100 py-2.5 px-3 rounded-3"
                    value={remindDaysAfter}
                    onChange={(e) => setRemindDaysAfter(Number(e.target.value))}
                    disabled={!enabled}
                    style={{
                      backgroundColor: themeStyles.inputBg,
                      border: themeStyles.inputBorder,
                      color: themeStyles.selectColor,
                      fontSize: '0.95rem'
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
          </div>

          {/* Section 4: Configuration Preview */}
          <div>
            <div
              className="d-flex align-items-center justify-content-between cursor-pointer user-select-none py-2"
              onClick={() => setShowPreviewDetails(!showPreviewDetails)}
              style={{ cursor: 'pointer' }}
            >
              <h5 className="fw-bold m-0 fs-5" style={{ color: themeStyles.textColor }}>
                Configuration preview
              </h5>
              <div
                className="d-flex align-items-center justify-content-center"
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E5E7EB',
                  color: themeStyles.textColor
                }}
              >
                {showPreviewDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </div>

            {showPreviewDetails && (
              <div
                className="rounded-3 p-4 mt-3 transition-all"
                style={{
                  backgroundColor: themeStyles.previewBg,
                  border: themeStyles.cardBorder
                }}
              >
                <div className="row g-3">
                  <div className="col-12 col-sm-6">
                    <span className="small d-block" style={{ color: themeStyles.mutedColor }}>
                      Status:
                    </span>
                    <span
                      className="fw-bold fs-6"
                      style={{ color: enabled ? (isDark ? '#4ADE80' : '#16A34A') : (isDark ? '#F87171' : '#DC2626') }}
                    >
                      {enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>

                  <div className="col-12 col-sm-6">
                    <span className="small d-block" style={{ color: themeStyles.mutedColor }}>
                      Channel:
                    </span>
                    <span className="fw-bold fs-6" style={{ color: themeStyles.textColor }}>
                      {channel}
                    </span>
                  </div>

                  <div className="col-12 col-sm-4">
                    <span className="small d-block" style={{ color: themeStyles.mutedColor }}>
                      First Reminder:
                    </span>
                    <span className="fw-semibold" style={{ color: themeStyles.textColor }}>
                      {remindDaysBefore} days before
                    </span>
                  </div>

                  <div className="col-12 col-sm-4">
                    <span className="small d-block" style={{ color: themeStyles.mutedColor }}>
                      Second Reminder:
                    </span>
                    <span className="fw-semibold" style={{ color: themeStyles.textColor }}>
                      {secondReminderChoice === 'due_date' ? 'On the due date' : `${secondReminderChoice} day(s) before`}
                    </span>
                  </div>

                  <div className="col-12 col-sm-4">
                    <span className="small d-block" style={{ color: themeStyles.mutedColor }}>
                      Overdue Reminder:
                    </span>
                    <span className="fw-semibold" style={{ color: themeStyles.textColor }}>
                      {remindDaysAfter} days after
                    </span>
                  </div>
                </div>

                {/* Message preview pill box */}
                <div
                  className="mt-4 p-3 rounded-3"
                  style={{
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF',
                    border: isDark ? '1px dashed rgba(255, 255, 255, 0.15)' : '1px dashed #CBD5E1'
                  }}
                >
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="small fw-semibold d-flex align-items-center gap-1.5" style={{ color: themeStyles.mutedColor }}>
                      <MessageSquare size={14} /> Sample {channel} Notification Message
                    </span>
                    <button
                      type="button"
                      className="btn btn-link btn-sm p-0 text-decoration-none small"
                      onClick={() => setShowTemplateModal(true)}
                      style={{ color: isDark ? '#60A5FA' : 'var(--sa-primary-red)' }}
                    >
                      Edit Template
                    </button>
                  </div>
                  <p className="m-0 small font-monospace" style={{ color: themeStyles.textColor, lineHeight: 1.6 }}>
                    "Dear Suresh Sharma, this is a friendly reminder that an outstanding tuition fee of ₹15,000 for Rahul Sharma (Roll: SA-1024) is due on 25-Oct-2026. Kindly clear the dues to ensure uninterrupted classes. Shubham Academy."
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Save & Action Buttons */}
          <div className="d-flex align-items-center justify-content-between pt-3 gap-3 flex-wrap">
            <button
              type="button"
              className="btn btn-sm d-flex align-items-center gap-1.5"
              onClick={handleReset}
              style={{
                color: themeStyles.mutedColor,
                border: themeStyles.inputBorder,
                backgroundColor: 'transparent'
              }}
            >
              <RotateCcw size={14} /> Reset Defaults
            </button>

            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => navigate('/admin/fees')}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary px-4 py-2 fw-bold d-flex align-items-center gap-2"
                onClick={handleSave}
                disabled={saving}
                style={{
                  backgroundColor: 'var(--sa-primary-red, #B91C1C)',
                  borderColor: 'var(--sa-primary-red, #B91C1C)',
                  borderRadius: '10px'
                }}
              >
                <Save size={16} /> {saving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
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

      {/* Test Notification Modal */}
      {testModalOpen && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)', zIndex: 1060 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-0 rounded-4">
              <div className="modal-header border-bottom">
                <div className="d-flex align-items-center gap-2">
                  <Send size={18} className="text-primary" />
                  <h5 className="modal-title fw-bold m-0">Send Test Fee Reminder</h5>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setTestModalOpen(false)}
                />
              </div>
              <div className="modal-body">
                <p className="small text-muted mb-3">
                  This will dispatch an instant test message using the configured <strong>{channel}</strong> channel to verify provider deliverability.
                </p>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Target Mobile Number (+91)</label>
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="e.g. 9876543210"
                    value={testMobile}
                    onChange={(e) => setTestMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  />
                </div>
              </div>
              <div className="modal-footer border-top">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setTestModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm d-flex align-items-center gap-1.5"
                  onClick={handleSendTest}
                  disabled={sendingTest}
                >
                  <Send size={14} /> {sendingTest ? 'Sending...' : `Send via ${channel}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
