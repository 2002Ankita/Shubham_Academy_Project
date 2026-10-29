import React, { useState, useEffect } from 'react';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import BranchBatchSelector from '../common/BranchBatchSelector';
import { useAuth } from '../../hooks/useAuth';
import {
  BRANCH_TARABAI,
  BRANCH_MANGALWAR,
  ACADEMIC_BATCHES,
  formatStudentBatchDisplay
} from '../../config/branchBatchConfig';
import { getUserBranch } from '../../utils/branchUtils';

const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return null;
  const match = String(timeStr).trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
  if (!match) return null;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const ampm = match[3] ? match[3].toUpperCase() : null;
  if (ampm === 'PM' && h < 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return h * 60 + m;
};

const minutesToTimeDisplay = (totalMins) => {
  let h = Math.floor(totalMins / 60) % 24;
  const m = totalMins % 60;
  const ampm = h >= 12 ? 'pm' : 'am';
  const displayH = h % 12 || 12;
  return `${String(displayH).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
};

const parseDurationToMinutes = (durStr) => {
  if (!durStr) return 180;
  const match = String(durStr).match(/(\d+(?:\.\d+)?)/);
  if (!match) return 180;
  return Math.round(parseFloat(match[1]) * 60);
};

export default function ExamForm({ onSubmit, loading, onCancel, teachers = [], initialBranch, fixedBranch = false }) {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SuperAdmin';
  const activeBranch = initialBranch || getUserBranch(user);
  const isMangal = Boolean(activeBranch && activeBranch.toLowerCase().includes('mangal'));
  const defaultBranch = activeBranch ? (isMangal ? BRANCH_MANGALWAR : BRANCH_TARABAI) : BRANCH_TARABAI;
  const defaultSession = isMangal ? 'Morning' : '';

  const [formData, setFormData] = useState({
    title: 'Weekly Test - Mechanics & Kinematics',
    standard: '11th Science',
    branch: defaultBranch,
    session: defaultSession,
    academicBatch: ACADEMIC_BATCHES[0],
    batch: `${defaultBranch} • ${defaultSession ? `${defaultSession} • ` : ''}${ACADEMIC_BATCHES[0]}`,
    subject: 'Physics',
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00 am',
    endTime: '01:00 pm',
    duration: '3 Hours',
    maxMarks: 100,
    passingMarks: 35,
    roomNo: 'Hall A & B',
    teacher_id: '',
    notifySMS: true,
    notifyWhatsApp: true
  });

  useEffect(() => {
    if (!isSuperAdmin && activeBranch) {
      const b = isMangal ? BRANCH_MANGALWAR : BRANCH_TARABAI;
      const s = isMangal ? (formData.session || 'Morning') : '';
      setFormData(prev => ({
        ...prev,
        branch: b,
        session: s,
        batch: formatStudentBatchDisplay({ branch: b, session: s, academicBatch: prev.academicBatch })
      }));
    }
  }, [activeBranch, isSuperAdmin, isMangal]);

  const [previewTab, setPreviewTab] = useState('whatsapp'); // 'whatsapp' or 'sms'

  useEffect(() => {
    if (initialBranch) {
      const bNorm = initialBranch.toLowerCase().includes('mangal') ? BRANCH_MANGALWAR : BRANCH_TARABAI;
      setFormData(prev => ({
        ...prev,
        branch: bNorm,
        batch: `${bNorm} • ${prev.academicBatch || ACADEMIC_BATCHES[0]}`
      }));
    }
  }, [initialBranch]);

  useEffect(() => {
    if (teachers.length > 0 && !formData.teacher_id) {
      setFormData(prev => ({ ...prev, teacher_id: teachers[0].id }));
    }
  }, [teachers]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const next = { ...prev, [name]: value };

      if (name === 'startTime' || name === 'duration') {
        const sMins = parseTimeToMinutes(name === 'startTime' ? value : prev.startTime);
        const dMins = parseDurationToMinutes(name === 'duration' ? value : prev.duration);
        if (sMins !== null && dMins > 0) {
          next.endTime = minutesToTimeDisplay(sMins + dMins);
        }
      } else if (name === 'endTime') {
        const sMins = parseTimeToMinutes(prev.startTime);
        const eMins = parseTimeToMinutes(value);
        if (sMins !== null && eMins !== null && eMins > sMins) {
          const diffMins = eMins - sMins;
          const h = Math.floor(diffMins / 60);
          const m = diffMins % 60;
          if (m === 0) next.duration = `${h} ${h === 1 ? 'Hour' : 'Hours'}`;
          else next.duration = `${h}h ${m}m`;
        }
      }

      return next;
    });
  };

  const activeChannels = [
    formData.notifySMS ? 'SMS' : null,
    formData.notifyWhatsApp ? 'WhatsApp' : null
  ].filter(Boolean);

  const handleSubmit = (e) => {
    e.preventDefault();
    const resolvedBranch = formData.branch || defaultBranch || 'Tarabai Park';
    const resolvedBatch = formData.batch || `${resolvedBranch} • ${formData.academicBatch || ACADEMIC_BATCHES[0]}`;

    onSubmit({
      ...formData,
      batch: resolvedBatch,
      branch: resolvedBranch,
      standard: formData.standard || formData.academicBatch || '11th Science',
      notify_parents: activeChannels.length > 0,
      notify_sms: formData.notifySMS,
      notify_whatsapp: formData.notifyWhatsApp,
      channels: activeChannels.length > 0 ? activeChannels : ['SMS', 'WhatsApp'],
      maxMarks: Number(formData.maxMarks),
      passingMarks: Number(formData.passingMarks)
    });
  };

  const smsPreviewMessage = `Dear Parent, a test '${formData.title || 'Weekly Assessment'}' for subject '${formData.subject}' has been scheduled on ${formData.date || 'today'} (${formData.startTime} - ${formData.endTime}) for batch '${formData.batch}'. Please ensure attendance. - Shubham Academy`;

  const waPreviewMessage = `*Shubham Academy • Scheduled Assessment Alert* 📢\n\nDear Parent, an important examination has been scheduled for your ward:\n\n📝 *Test Name:* ${formData.title || 'Weekly Assessment'}\n📚 *Subject:* ${formData.subject}\n📅 *Date:* ${formData.date || 'Today'}\n⏰ *Time:* ${formData.startTime} - ${formData.endTime} (${formData.duration})\n👥 *Target Batch:* ${formData.batch}\n📍 *Hall / Room:* ${formData.roomNo || 'Main Examination Hall'}\n🎯 *Max Marks:* ${formData.maxMarks} (Passing: ${formData.passingMarks})\n\nPlease ensure your ward prepares thoroughly and arrives on time.\n\n_Shubham Academy Examination Cell_`;

  return (
    <form onSubmit={handleSubmit} className="sa-card p-4 border shadow-sm">
      <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
        <div>
          <h5 className="brand-font fw-bold text-sa-charcoal mb-0 fs-6">
            Schedule Assessment / Test & Dispatch Parent Alerts
          </h5>
          <span className="small text-muted">
            Enter test details and schedule; parents of enrolled students will be alerted automatically via SMS and WhatsApp.
          </span>
        </div>
        <div className="d-flex align-items-center gap-1.5">
          <span className="badge bg-success-subtle text-success border border-success-subtle px-2.5 py-1.5 fw-medium d-inline-flex align-items-center gap-1">
            <span>💬 WhatsApp & 📱 SMS Connected</span>
          </span>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-12 col-md-6">
          <Input
            label="Test / Assessment Name"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g. Thermodynamics Weekly Unit Test"
            required
          />
        </div>

        <div className="col-12">
          <BranchBatchSelector
            branch={formData.branch || BRANCH_TARABAI}
            fixedBranch={fixedBranch}
            onBranchChange={(b) => setFormData(prev => ({
              ...prev,
              branch: b,
              batch: formatStudentBatchDisplay({ branch: b, session: prev.session, academicBatch: prev.academicBatch })
            }))}
            session={formData.session || ''}
            onSessionChange={(s) => setFormData(prev => ({
              ...prev,
              session: s,
              batch: formatStudentBatchDisplay({ branch: prev.branch, session: s, academicBatch: prev.academicBatch })
            }))}
            academicBatch={formData.academicBatch || ACADEMIC_BATCHES[0]}
            onAcademicBatchChange={(ab) => setFormData(prev => ({
              ...prev,
              academicBatch: ab,
              batch: formatStudentBatchDisplay({ branch: prev.branch, session: prev.session, academicBatch: ab }),
              standard: ab.includes('12th') ? '12th Science' : '11th Science'
            }))}
            layout="grid"
          />
        </div>

        <div className="col-12 col-md-4">
          <Select
            label="Subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            options={['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Accountancy', 'Economics', 'Comprehensive Science']}
          />
        </div>

        <div className="col-12 col-md-4">
          <Input
            label="Test Date"
            name="date"
            type="date"
            value={formData.date}
            onChange={handleChange}
            required
          />
        </div>

        <div className="col-12 col-md-4">
          <Select
            label="Invigilator / Supervisor"
            name="teacher_id"
            value={formData.teacher_id}
            onChange={handleChange}
            options={teachers.map(t => ({ value: t.id, label: t.name }))}
          />
        </div>

        <div className="col-12 col-md-4">
          <Input
            label="Start Time"
            name="startTime"
            value={formData.startTime}
            onChange={handleChange}
            placeholder="e.g. 10:00 am"
            required
          />
        </div>

        <div className="col-12 col-md-4">
          <Input
            label="End Time"
            name="endTime"
            value={formData.endTime}
            onChange={handleChange}
            placeholder="e.g. 01:00 pm"
            required
          />
        </div>

        <div className="col-12 col-md-4">
          <Input
            label="Duration"
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            placeholder="e.g. 3 Hours"
            required
          />
        </div>

        <div className="col-12 col-md-6">
          <Input
            label="Maximum Marks"
            name="maxMarks"
            type="number"
            value={formData.maxMarks}
            onChange={handleChange}
            required
          />
        </div>

        <div className="col-12 col-md-6">
          <Input
            label="Assigned Hall / Classroom"
            name="roomNo"
            value={formData.roomNo}
            onChange={handleChange}
            placeholder="e.g. Hall A (Main Campus)"
          />
        </div>

        {/* Automatic Parent SMS & WhatsApp Notification Settings */}
        <div className="col-12">
          <div className="p-3.5 rounded-3 border bg-light bg-opacity-75">
            <span className="small fw-bold text-sa-charcoal d-block mb-2">
              Parent Notification Channels (Sent automatically upon schedule creation):
            </span>

            <div className="d-flex flex-wrap gap-4 mb-3">
              <div className="form-check form-switch d-flex align-items-center gap-2">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="notifyWhatsAppSwitch"
                  checked={formData.notifyWhatsApp}
                  onChange={(e) => setFormData(prev => ({ ...prev, notifyWhatsApp: e.target.checked }))}
                  style={{ cursor: 'pointer', width: '2.4rem', height: '1.25rem' }}
                />
                <label className="form-check-label fw-bold text-success d-flex align-items-center gap-1" htmlFor="notifyWhatsAppSwitch" style={{ cursor: 'pointer' }}>
                  <span>💬 Notify Parents on WhatsApp</span>
                  <span className="badge bg-success text-white py-0.5 px-1.5" style={{ fontSize: '10px' }}>Instant</span>
                </label>
              </div>

              <div className="form-check form-switch d-flex align-items-center gap-2">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="notifySMSSwitch"
                  checked={formData.notifySMS}
                  onChange={(e) => setFormData(prev => ({ ...prev, notifySMS: e.target.checked }))}
                  style={{ cursor: 'pointer', width: '2.4rem', height: '1.25rem' }}
                />
                <label className="form-check-label fw-bold text-primary d-flex align-items-center gap-1" htmlFor="notifySMSSwitch" style={{ cursor: 'pointer' }}>
                  <span>📱 Notify Parents on SMS</span>
                  <span className="badge bg-primary-subtle text-primary py-0.5 px-1.5" style={{ fontSize: '10px' }}>Cellular</span>
                </label>
              </div>
            </div>

            {(formData.notifyWhatsApp || formData.notifySMS) && (
              <div className="p-3 rounded-3 bg-white border border-secondary-subtle">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="btn-group btn-group-sm" role="group">
                    {formData.notifyWhatsApp && (
                      <button
                        type="button"
                        onClick={() => setPreviewTab('whatsapp')}
                        className={`btn btn-sm ${previewTab === 'whatsapp' ? 'btn-success text-white' : 'btn-outline-success'}`}
                        style={{ fontSize: '12px' }}
                      >
                        💬 WhatsApp Message Preview
                      </button>
                    )}
                    {formData.notifySMS && (
                      <button
                        type="button"
                        onClick={() => setPreviewTab('sms')}
                        className={`btn btn-sm ${previewTab === 'sms' ? 'btn-primary text-white' : 'btn-outline-primary'}`}
                        style={{ fontSize: '12px' }}
                      >
                        📱 SMS Message Preview
                      </button>
                    )}
                  </div>
                  <span className="small text-muted" style={{ fontSize: '11px' }}>
                    Auto-dispatched to enrolled parent contacts
                  </span>
                </div>

                {previewTab === 'whatsapp' && formData.notifyWhatsApp ? (
                  <div
                    className="p-3 rounded-3 border"
                    style={{
                      backgroundColor: '#e7f8ee',
                      borderColor: '#a7f3d0',
                      color: '#065f46',
                      fontSize: '13px',
                      lineHeight: 1.5,
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'system-ui, -apple-system, sans-serif'
                    }}
                  >
                    {waPreviewMessage}
                  </div>
                ) : (
                  <div className="p-2.5 rounded-2 bg-light text-sa-charcoal font-monospace border small">
                    "{smsPreviewMessage}"
                  </div>
                )}

                <span className="small text-success d-flex align-items-center gap-1 mt-2" style={{ fontSize: '11px' }}>
                  ✓ Delivery status and receipt timestamps will be tracked in Notification History for each student.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="d-flex align-items-center justify-content-end gap-2 mt-4 pt-3 border-top">
        {onCancel && (
          <Button variant="light" type="button" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" variant="primary" loading={loading}>
          Schedule Test & Dispatch Alerts
        </Button>
      </div>
    </form>
  );
}

