import React, { useState, useMemo } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { Send, CheckCircle2, AlertCircle, XCircle, PhoneOff, MessageSquare, PhoneCall, CheckSquare, Square } from 'lucide-react';
import { toast } from 'react-toastify';
import marksService from '../../services/marksService';
import notificationService from '../../services/notificationService';

export default function SendMarksModal({
  isOpen,
  onClose,
  exam,
  batch = '',
  subject = '',
  batchOptions = [],
  subjectOptions = [],
  students = [],
  marks = []
}) {
  const [channel, setChannel] = useState('whatsapp'); // 'whatsapp' | 'sms'
  const [selectedBatch, setSelectedBatch] = useState(batch || 'All Batches');
  const [selectedSubject, setSelectedSubject] = useState(subject || 'All Subjects');
  const [selectedIds, setSelectedIds] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);
  const [manualSentMap, setManualSentMap] = useState({});

  React.useEffect(() => {
    if (isOpen) {
      setSelectedBatch(batch || 'All Batches');
      setSelectedSubject(subject || 'All Subjects');
      setSendResult(null);
      setManualSentMap({});
    }
  }, [isOpen, batch, subject]);

  const computedBatchOptions = useMemo(() => {
    if (batchOptions && batchOptions.length > 0) return batchOptions;
    const list = new Set();
    if (exam?.batch) list.add(exam.batch);
    if (exam?.standard) list.add(exam.standard);
    students.forEach(s => s.batch && list.add(s.batch));
    return ['All Batches', ...Array.from(list)];
  }, [batchOptions, exam, students]);

  const computedSubjectOptions = useMemo(() => {
    if (subjectOptions && subjectOptions.length > 0) return subjectOptions;
    const list = new Set();
    if (exam?.subject) list.add(exam.subject);
    marks.forEach(m => m.subject && list.add(m.subject));
    return ['All Subjects', ...Array.from(list)];
  }, [subjectOptions, exam, marks]);

  // Compute roster of students for this exam with their marks & parent details
  const roster = useMemo(() => {
    if (!exam) return [];

    // Find all marks for this exam
    let examMarks = marks.filter(m =>
      m.examId === exam.id ||
      m.exam_id === exam.id ||
      (m.examTitle && (m.examTitle === exam.title || m.examTitle === exam.exam_name)) ||
      (m.examName && (m.examName === exam.title || m.examName === exam.exam_name))
    );

    if (selectedSubject && selectedSubject !== 'All Subjects') {
      examMarks = examMarks.filter(m => (m.subject || exam.subject || '').toLowerCase() === selectedSubject.toLowerCase());
    }

    const list = examMarks.map(m => {
      const student = students.find(s =>
        (s.id && (s.id === m.studentId || s.id === m.student_id)) ||
        (s._id && (s._id === m.studentId || s._id === m.student_id)) ||
        (s.student_id && (s.student_id === m.studentId || s.student_id === m.rollNumber)) ||
        (s.rollNumber && (s.rollNumber === m.rollNumber || s.rollNumber === m.studentId)) ||
        (s.name && m.studentName && s.name.trim().toLowerCase() === m.studentName.trim().toLowerCase())
      ) || {};
      const parentMobile = student.parentPhone || student.parent_mobile || student.phone || student.mobile_number || '';
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

    if (selectedBatch && selectedBatch !== 'All Batches') {
      return list.filter(r =>
        (r.batch || '').toLowerCase().includes(selectedBatch.toLowerCase()) ||
        (r.standard || '').toLowerCase().includes(selectedBatch.toLowerCase())
      );
    }

    return list;
  }, [exam, marks, students, selectedBatch, selectedSubject]);

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
        batch: selectedBatch !== 'All Batches' ? selectedBatch : (batch || exam.batch || ''),
        subject: selectedSubject !== 'All Subjects' ? selectedSubject : (subject || exam.subject || ''),
        channel: channel,
        student_ids: selectedIds
      };

      const res = await marksService.sendMarksNotifications(payload);
      setSendResult(res);

      const summary = res.summary || {};
      const teacherInfo = res.teacher_notification || {};

      // Register dynamic notification so the teacher's alert bell immediately updates
      try {
        notificationService.addNotification({
          title: `SMS Alert: Marks Dispatched for ${exam?.title || exam?.exam_name || exam?.subject || 'Exam'}`,
          type: 'exam',
          category: 'Examinations & SMS Alerts',
          priority: 'High',
          author: 'Automated SMS Gateway',
          details: `Marks notifications for ${exam?.title || exam?.exam_name || exam?.subject} were dispatched to parents of ${summary.total || selectedIds.length} students. Confirmation SMS alert delivered to registered teacher mobile (${teacherInfo.masked_mobile || 'on file'}).`
        });
      } catch (err) {
        console.error('Failed to log teacher notification:', err);
      }

      if (summary.sent > 0) {
        toast.success(`Marks notifications delivered successfully for ${summary.sent} student(s) to parents!`);
      } else if (summary.unconfigured > 0) {
        toast.error(`0 messages sent: WhatsApp / SMS API is not configured in backend .env. Use the green 💬 icon to send directly via WhatsApp.`);
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

    if (manualSentMap[studentId]) {
      return (
        <span className="badge rounded-pill" style={{ backgroundColor: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', fontSize: '11px' }}>
          <CheckCircle2 size={11} className="me-1" /> Sent (WhatsApp Web)
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
        <span className="badge rounded-pill" style={{ backgroundColor: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA', fontSize: '11px' }} title="API Not Configured in backend - Message not sent">
          <XCircle size={11} className="me-1" /> Not Sent
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
        {/* Context metadata & Selection Controls */}
        <div
          className="p-3 rounded-3 border"
          style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }}
        >
          <div className="row g-2.5 align-items-center" style={{ fontSize: '13px' }}>
            <div className="col-12 col-sm-4">
              <label className="form-label fw-bold text-dark mb-1 small d-block">
                Batch / Class:
              </label>
              <select
                className="form-select form-select-sm"
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                style={{ height: '36px', borderRadius: '8px', borderColor: '#CBD5E1', fontSize: '12.5px' }}
              >
                {computedBatchOptions.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div className="col-12 col-sm-4">
              <label className="form-label fw-bold text-dark mb-1 small d-block">
                Subject:
              </label>
              <select
                className="form-select form-select-sm"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                style={{ height: '36px', borderRadius: '8px', borderColor: '#CBD5E1', fontSize: '12.5px' }}
              >
                {computedSubjectOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="col-12 col-sm-4">
              <label className="form-label fw-bold text-dark mb-1 small d-block">
                Examination:
              </label>
              <div
                className="form-control form-control-sm bg-white d-flex align-items-center text-truncate fw-semibold text-sa-charcoal"
                style={{ height: '36px', borderRadius: '8px', borderColor: '#CBD5E1', fontSize: '12.5px' }}
                title={exam?.title || exam?.exam_name || 'Current Exam'}
              >
                {exam?.title || exam?.exam_name || 'Current Exam'}
              </div>
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

        {/* Real-time results summary bar */}
        {(sendResult || Object.keys(manualSentMap).length > 0) && (() => {
          const apiSent = sendResult?.summary?.sent || 0;
          const manualSentCount = Object.keys(manualSentMap).filter(id => {
            const apiItem = (sendResult?.results || []).find(r => r.student_id === id);
            return !apiItem || apiItem.status !== 'sent';
          }).length;
          const totalRealSent = apiSent + manualSentCount;
          const unconfigured = sendResult?.summary?.unconfigured || 0;
          const failed = sendResult?.summary?.failed || 0;
          const missingPhone = sendResult?.summary?.missing_phone || 0;
          const totalProcessed = sendResult?.summary?.total || Object.keys(manualSentMap).length;
          const notSent = Math.max(0, totalProcessed - totalRealSent - missingPhone);

          return (
            <div className="d-flex flex-column gap-2">
              <div
                className="p-2.5 px-3 rounded-2 border d-flex flex-wrap align-items-center justify-content-between gap-2"
                style={{
                  backgroundColor: totalRealSent > 0 ? '#F0FDF4' : '#FEF2F2',
                  borderColor: totalRealSent > 0 ? '#BBF7D0' : '#FECACA',
                  fontSize: '12.5px'
                }}
              >
                <div className="d-flex align-items-center gap-3">
                  <span className={`fw-bold ${totalRealSent > 0 ? 'text-success' : 'text-danger'}`}>
                    {totalRealSent > 0 ? <CheckCircle2 size={16} className="me-1 inline" /> : <XCircle size={16} className="me-1 inline" />} Real-Time Summary:
                  </span>
                  <span>Total: <strong>{totalProcessed}</strong></span>
                  <span className="text-success">Sent: <strong>{totalRealSent}</strong></span>
                  <span className="text-danger">Not Sent: <strong>{notSent}</strong></span>
                  {missingPhone > 0 && (
                    <span className="text-warning">No Mobile: <strong>{missingPhone}</strong></span>
                  )}
                </div>
              </div>

              {unconfigured > 0 && totalRealSent === 0 && (
                <div className="px-1" style={{ fontSize: '11.5px', color: '#B91C1C' }}>
                  ℹ️ <strong>Backend WhatsApp/SMS API is not configured (.env)</strong> — automated messages were not sent. Click the green 💬 icon next to each student to send directly on WhatsApp.
                </div>
              )}

              {sendResult?.teacher_notification && (
                <div
                  className="p-2.5 px-3 rounded-2 border d-flex align-items-center justify-content-between flex-wrap gap-2"
                  style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', fontSize: '12px' }}
                >
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge rounded-pill" style={{ backgroundColor: '#8B1216', color: '#FFFFFF', fontSize: '10.5px' }}>
                      Teacher SMS Alert
                    </span>
                    <span className="text-sa-charcoal">
                      Notification alert copy routed to teacher mobile: <strong>{sendResult.teacher_notification.masked_mobile || 'Registered Mobile'}</strong>
                    </span>
                  </div>
                  <span className="badge bg-white text-secondary border px-2 py-1 rounded-pill" style={{ fontSize: '11px' }}>
                    {sendResult.teacher_notification.status === 'sent' ? 'Delivered' : 'Alert Triggered'}
                  </span>
                </div>
              )}
            </div>
          );
        })()}

        {/* Students Roster Table */}
        <div className="table-responsive border rounded-3" style={{ maxHeight: '280px', overflowY: 'auto', overflowX: 'auto' }}>
          <table className="table table-hover align-middle m-0" style={{ minWidth: '650px', fontSize: '13px' }}>
            <thead className="position-sticky top-0" style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', zIndex: 2 }}>
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
                        <div className="d-flex align-items-center justify-content-end gap-1.5">
                          {getStatusBadge(row.studentId, row.hasPhone)}
                          {row.hasPhone && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-success p-1 d-inline-flex align-items-center rounded-2"
                              title="Send directly on WhatsApp"
                              onClick={(e) => {
                                e.stopPropagation();
                                const cleanDigits = String(row.parentMobile).replace(/\D/g, '');
                                const phoneWithCountry = cleanDigits.length === 10 ? `91${cleanDigits}` : cleanDigits;
                                const remarksText = 'Outstanding performance in test';
                                const msg = `Dear ${row.parentName || 'Parent/Guardian'},\n\nYour ward ${row.studentName} (Roll No: ${row.rollNumber || 'N/A'}) has received ${row.obtainedMarks}/${row.maxMarks} in ${selectedSubject !== 'All Subjects' ? selectedSubject : (exam?.subject || 'Subject')} for ${exam?.title || exam?.exam_name || 'Annual Assessment 2024'}.\n\nPercentage: ${row.percentage}%\nGrade: ${row.grade || 'Pass'}\nRemarks: ${remarksText}\n\nRegards,\nShubham Academy`;
                                window.open(`https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
                                setManualSentMap(prev => ({ ...prev, [row.studentId]: true }));
                                toast.info(`Opened WhatsApp for ${row.studentName}. Send the message directly in WhatsApp.`);
                              }}
                            >
                              <MessageSquare size={13} />
                            </button>
                          )}
                        </div>
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

Your ward [Student Name] (Roll No: [Roll Number]) has received [Marks]/[Maximum Marks] in ${subject || exam?.subject || '[Subject]'} for ${exam?.title || exam?.exam_name || '[Exam]'}.

Percentage: [Percentage]%
Grade: [Grade]
Remarks: [Faculty Remarks]

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
