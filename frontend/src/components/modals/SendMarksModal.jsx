import React, { useState, useMemo } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { Send, CheckCircle2, AlertCircle, XCircle, PhoneOff, MessageSquare, PhoneCall, CheckSquare, Square } from 'lucide-react';
import { toast } from 'react-toastify';
import marksService from '../../services/marksService';

export default function SendMarksModal({
  isOpen,
  onClose,
  exam,
  batch = '',
  subject = '',
  students = [],
  marks = []
}) {
  const [channel, setChannel] = useState('whatsapp'); // 'whatsapp' | 'sms'
  const [selectedIds, setSelectedIds] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);

  // Compute roster of students for this exam with their marks & parent details
  const roster = useMemo(() => {
    if (!exam) return [];
    
    // Find all marks for this exam
    const examMarks = marks.filter(m => m.examId === exam.id || m.exam_id === exam.id);
    
    return examMarks.map(m => {
      const student = students.find(s => s.id === m.studentId || s.student_id === m.studentId || s.id === m.student_id) || {};
      const parentMobile = student.parentPhone || student.parent_mobile || '';
      const maskedMobile = parentMobile.length >= 4 
        ? `${'*'.repeat(Math.max(parentMobile.length - 4, 0))}${parentMobile.slice(-4)}`
        : (parentMobile ? '****' : null);

      const maxMarks = Number(m.maxMarks || exam.max_marks || 100);
      const obtained = Number(m.obtainedMarks ?? m.marks_obtained ?? 0);
      const percentage = maxMarks > 0 ? ((obtained / maxMarks) * 100).toFixed(1) : '0.0';

      return {
        markId: m.id,
        studentId: student.id || m.studentId,
        studentName: student.name || m.studentName || 'Student',
        rollNumber: student.rollNumber || m.rollNumber || 'N/A',
        standard: student.standard || exam.standard || 'N/A',
        batch: student.batch || exam.batch || 'N/A',
        obtainedMarks: obtained,
        maxMarks: maxMarks,
        percentage: percentage,
        grade: m.grade || (obtained >= 40 ? 'Pass' : 'Fail'),
        parentName: student.parentName || student.parent_name || 'Guardian',
        parentMobile: parentMobile,
        maskedMobile: maskedMobile,
        hasPhone: Boolean(parentMobile && parentMobile.replace(/\D/g, '').length >= 10)
      };
    });
  }, [exam, marks, students]);

  // Initial selection: select all students who have a valid phone number
  React.useEffect(() => {
    if (isOpen && roster.length > 0) {
      setSelectedIds(roster.filter(r => r.hasPhone).map(r => r.studentId));
      setSendResult(null);
    }
  }, [isOpen, roster]);

  const allSelected = roster.length > 0 && selectedIds.length === roster.length;
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(roster.map(r => r.studentId));
    }
  };

  const toggleSelectStudent = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSend = async () => {
    if (!exam?.id) {
      toast.error('Please select an examination first.');
      return;
    }
    if (selectedIds.length === 0) {
      toast.warning('Please select at least one student to notify.');
      return;
    }

    setIsSending(true);
    try {
      const payload = {
        exam_id: exam.id,
        batch: batch || exam.batch || '',
        subject: subject || exam.subject || '',
        channel: channel,
        student_ids: selectedIds
      };

      const res = await marksService.sendMarksNotifications(payload);
      setSendResult(res);

      const summary = res.summary || {};
      if (summary.sent > 0) {
        toast.success(`Successfully dispatched ${summary.sent} marks notifications!`);
      } else if (summary.unconfigured > 0) {
        toast.info(
          `Notification request processed for ${summary.unconfigured} student(s). Note: Backend ${channel.toUpperCase()} provider requires API key configuration.`,
          { autoClose: 6000 }
        );
      } else if (summary.missing_phone > 0 && summary.total === summary.missing_phone) {
        toast.warning('Parent mobile numbers are missing for the selected students.');
      } else {
        toast.info(`Notification dispatch completed.`);
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to dispatch marks notifications');
    } finally {
      setIsSending(false);
    }
  };

  const getStatusBadge = (studentId, hasPhone) => {
    if (!hasPhone) {
      return (
        <span className="badge rounded-pill" style={{ backgroundColor: '#FFFBEB', color: '#B45309', border: '1px solid #FDE68A', fontSize: '11px' }}>
          <PhoneOff size={11} className="me-1" /> No Mobile
        </span>
      );
    }

    if (!sendResult) {
      return (
        <span className="badge rounded-pill bg-light text-muted" style={{ border: '1px solid #E2E8F0', fontSize: '11px' }}>
          Ready to Send
        </span>
      );
    }

    const item = (sendResult.results || []).find(r => r.student_id === studentId);
    if (!item) {
      return <span className="text-muted small">--</span>;
    }

    if (item.status === 'sent') {
      return (
        <span className="badge rounded-pill" style={{ backgroundColor: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', fontSize: '11px' }}>
          <CheckCircle2 size={11} className="me-1" /> Sent
        </span>
      );
    }
    if (item.status === 'unconfigured') {
      return (
        <span className="badge rounded-pill" style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', fontSize: '11px' }} title={item.message}>
          <AlertCircle size={11} className="me-1" /> Needs Provider
        </span>
      );
    }
    if (item.status === 'missing_phone') {
      return (
        <span className="badge rounded-pill" style={{ backgroundColor: '#FFFBEB', color: '#B45309', border: '1px solid #FDE68A', fontSize: '11px' }}>
          <PhoneOff size={11} className="me-1" /> No Mobile
        </span>
      );
    }
    return (
      <span className="badge rounded-pill" style={{ backgroundColor: '#FEE2E2', color: '#B91C1C', border: '1px solid #FECACA', fontSize: '11px' }} title={item.message}>
        <XCircle size={11} className="me-1" /> Failed
      </span>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Send Marks to Parents"
      size="lg"
      maxWidth="800px"
    >
      <div className="d-flex flex-column gap-3">
        {/* Context metadata banner */}
        <div
          className="p-3 rounded-3 border"
          style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }}
        >
          <div className="row g-2 text-secondary" style={{ fontSize: '13px' }}>
            <div className="col-12 col-sm-4">
              <strong className="text-dark d-block">Batch / Class:</strong>
              <span>{batch || exam?.batch || exam?.standard || 'All Enrolled Batches'}</span>
            </div>
            <div className="col-12 col-sm-4">
              <strong className="text-dark d-block">Subject:</strong>
              <span className="badge" style={{ backgroundColor: '#FDF0F0', color: '#8B1216', border: '1px solid #FECACA' }}>
                {subject || exam?.subject || 'All Subjects'}
              </span>
            </div>
            <div className="col-12 col-sm-4">
              <strong className="text-dark d-block">Examination:</strong>
              <span className="fw-semibold text-dark">{exam?.title || exam?.exam_name || 'Current Exam'}</span>
            </div>
          </div>
        </div>

        {/* Channel Selection & Summary */}
        <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-3 pt-1">
          <div>
            <label className="form-label fw-bold small text-sa-charcoal m-0 mb-1.5 d-block">
              Send Via Communication Method:
            </label>
            <div className="btn-group" role="group">
              <button
                type="button"
                className={`btn btn-sm d-inline-flex align-items-center gap-1.5 fw-semibold ${channel === 'whatsapp' ? 'btn-success text-white' : 'btn-outline-secondary'}`}
                style={{ padding: '7px 16px', borderRadius: '8px 0 0 8px' }}
                onClick={() => setChannel('whatsapp')}
              >
                <MessageSquare size={15} /> WhatsApp
              </button>
              <button
                type="button"
                className={`btn btn-sm d-inline-flex align-items-center gap-1.5 fw-semibold ${channel === 'sms' ? 'btn-primary text-white' : 'btn-outline-secondary'}`}
                style={{ padding: '7px 16px', borderRadius: '0 8px 8px 0' }}
                onClick={() => setChannel('sms')}
              >
                <PhoneCall size={15} /> SMS
              </button>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="btn btn-sm btn-light border d-inline-flex align-items-center gap-1.5 fw-medium text-dark"
              style={{ padding: '6px 12px', borderRadius: '8px' }}
            >
              {allSelected ? <CheckSquare size={16} className="text-primary" /> : <Square size={16} />}
              <span>{allSelected ? 'Deselect All' : 'Select All'} ({selectedIds.length}/{roster.length})</span>
            </button>
          </div>
        </div>

        {/* Results summary bar if dispatched */}
        {sendResult && (
          <div
            className="p-2.5 px-3 rounded-2 border d-flex flex-wrap align-items-center justify-content-between gap-2"
            style={{ backgroundColor: '#F0FDF4', borderColor: '#BBF7D0', fontSize: '12.5px' }}
          >
            <div className="d-flex align-items-center gap-3">
              <span className="fw-bold text-success">
                <CheckCircle2 size={16} className="me-1 inline" /> Summary:
              </span>
              <span>Total: <strong>{sendResult.summary?.total || 0}</strong></span>
              <span className="text-success">Sent: <strong>{sendResult.summary?.sent || 0}</strong></span>
              <span className="text-primary">Provider Setup Required: <strong>{sendResult.summary?.unconfigured || 0}</strong></span>
              <span className="text-danger">Failed: <strong>{sendResult.summary?.failed || 0}</strong></span>
              <span className="text-warning">No Mobile: <strong>{sendResult.summary?.missing_phone || 0}</strong></span>
            </div>
          </div>
        )}

        {/* Students Roster Table */}
        <div className="table-responsive border rounded-3 overflow-hidden" style={{ maxHeight: '340px' }}>
          <table className="table table-hover align-middle m-0" style={{ fontSize: '13px' }}>
            <thead style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              <tr>
                <th style={{ width: '40px', padding: '10px 12px' }}>
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th style={{ padding: '10px 12px' }}>Student</th>
                <th style={{ padding: '10px 12px' }}>Marks / Max</th>
                <th style={{ padding: '10px 12px' }}>Result</th>
                <th style={{ padding: '10px 12px' }}>Parent / Guardian</th>
                <th style={{ padding: '10px 12px' }}>Masked Mobile</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {roster.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-4 text-muted">
                    No student marks recorded for this examination yet.
                  </td>
                </tr>
              ) : (
                roster.map((row) => {
                  const isChecked = selectedIds.includes(row.studentId);
                  return (
                    <tr key={row.studentId} className={isChecked ? 'table-light' : ''}>
                      <td style={{ padding: '10px 12px' }}>
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={isChecked}
                          onChange={() => toggleSelectStudent(row.studentId)}
                        />
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span className="fw-semibold text-sa-charcoal d-block">{row.studentName}</span>
                        <span className="text-muted small" style={{ fontSize: '11px' }}>Roll: {row.rollNumber}</span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span className="fw-bold" style={{ color: '#8B1216' }}>
                          {row.obtainedMarks} / {row.maxMarks}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span className="fw-semibold text-dark">{row.percentage}%</span>
                        <span className="badge ms-1.5" style={{ backgroundColor: '#F1F5F9', color: '#475569', fontSize: '10.5px' }}>
                          {row.grade}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span className="text-sa-charcoal">{row.parentName || '--'}</span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        {row.maskedMobile ? (
                          <span className="font-monospace small text-dark fw-medium">{row.maskedMobile}</span>
                        ) : (
                          <span className="text-muted small fst-italic">Not available</span>
                        )}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                        {getStatusBadge(row.studentId, row.hasPhone)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Message Preview Box */}
        <div
          className="p-3 rounded-3 border"
          style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }}
        >
          <div className="fw-semibold small text-sa-charcoal mb-1">
            Standard Message Template Preview:
          </div>
          <div className="p-2.5 rounded bg-white border font-monospace text-secondary" style={{ fontSize: '12px', whiteSpace: 'pre-line' }}>
            {`Dear Parent/Guardian,

Your ward [Student Name] has received [Marks]/[Maximum Marks] in ${subject || exam?.subject || '[Subject]'} for ${exam?.title || exam?.exam_name || '[Exam]'}.

Percentage: [Percentage]%

Regards,
Shubham Academy`}
          </div>
        </div>

        {/* Actions */}
        <div className="d-flex justify-content-end align-items-center gap-2 pt-2 border-top">
          <Button variant="light" onClick={onClose} disabled={isSending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            icon={Send}
            onClick={handleSend}
            disabled={isSending || selectedIds.length === 0}
          >
            {isSending ? 'Sending Notifications...' : `Send Marks via ${channel === 'whatsapp' ? 'WhatsApp' : 'SMS'} (${selectedIds.length})`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
