import React, { useState, useEffect } from 'react';
import { Calendar, FileText, Paperclip, Send } from 'lucide-react';
import { leaveTypes } from '../../data/leaveData';
import { toast } from 'react-toastify';

export default function LeaveForm({ onSubmitSuccess }) {
  const [leaveType, setLeaveType] = useState('Casual Leave');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [days, setDays] = useState(0);
  const [reason, setReason] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-calculate number of days when fromDate or toDate changes
  useEffect(() => {
    if (fromDate && toDate) {
      const start = new Date(fromDate);
      const end = new Date(toDate);
      if (end >= start) {
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setDays(diffDays);
      } else {
        setDays(0);
      }
    } else if (fromDate) {
      setDays(1);
    } else {
      setDays(0);
    }
  }, [fromDate, toDate]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!leaveType) {
      toast.error('Please select a leave type.');
      return;
    }
    if (!fromDate) {
      toast.error('Please specify From Date.');
      return;
    }
    if (!toDate) {
      toast.error('Please specify To Date.');
      return;
    }
    if (new Date(toDate) < new Date(fromDate)) {
      toast.error('To Date cannot be earlier than From Date.');
      return;
    }
    if (!reason.trim()) {
      toast.error('Please provide a reason for leave.');
      return;
    }

    setIsSubmitting(true);

    const newRequest = {
      id: `LR-2026-${Math.floor(100 + Math.random() * 900)}`,
      leaveType,
      fromDate,
      toDate,
      days: days || 1,
      reason: reason.trim(),
      appliedDate: 'Today',
      status: 'Pending',
      adminComment: 'Submitted. Pending Coordinator review.',
      attachmentName: attachment ? attachment.name : null
    };

    setTimeout(() => {
      onSubmitSuccess(newRequest);
      setIsSubmitting(false);
      // Reset form
      setLeaveType('Casual Leave');
      setFromDate('');
      setToDate('');
      setDays(0);
      setReason('');
      setAttachment(null);
      toast.success('Leave application submitted successfully!');
    }, 400);
  };

  return (
    <div className="sa-card bg-white rounded-3 border p-3 p-md-4 shadow-xs">
      <div className="d-flex align-items-center gap-2 pb-3 mb-3 border-bottom">
        <div
          className="rounded-2 d-flex align-items-center justify-content-center flex-shrink-0"
          style={{ width: '32px', height: '32px', backgroundColor: '#FDF0F0', color: '#8B1216' }}
        >
          <Calendar size={17} />
        </div>
        <div>
          <h4 className="brand-font fw-bold m-0 text-sa-charcoal fs-6">Apply for Leave</h4>
          <span className="text-sa-muted" style={{ fontSize: '0.78rem' }}>
            Submit an advance absence notification for class rescheduling
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="row g-3">
          {/* 1. Leave Type */}
          <div className="col-12 col-md-4">
            <label className="form-label fw-semibold text-sa-charcoal" style={{ fontSize: '0.82rem' }}>
              Leave Type <span className="text-danger">*</span>
            </label>
            <select
              className="form-select form-select-sm"
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              style={{ fontSize: '0.84rem' }}
              required
            >
              {leaveTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* 2. From Date */}
          <div className="col-12 col-sm-6 col-md-3">
            <label className="form-label fw-semibold text-sa-charcoal" style={{ fontSize: '0.82rem' }}>
              From Date <span className="text-danger">*</span>
            </label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                if (!toDate || new Date(toDate) < new Date(e.target.value)) {
                  setToDate(e.target.value);
                }
              }}
              style={{ fontSize: '0.84rem' }}
              required
            />
          </div>

          {/* 3. To Date */}
          <div className="col-12 col-sm-6 col-md-3">
            <label className="form-label fw-semibold text-sa-charcoal" style={{ fontSize: '0.82rem' }}>
              To Date <span className="text-danger">*</span>
            </label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={toDate}
              min={fromDate}
              onChange={(e) => setToDate(e.target.value)}
              style={{ fontSize: '0.84rem' }}
              required
            />
          </div>

          {/* 4. Number of Days (Calculated) */}
          <div className="col-12 col-md-2">
            <label className="form-label fw-semibold text-sa-charcoal" style={{ fontSize: '0.82rem' }}>
              Number of Days
            </label>
            <div
              className="form-control form-control-sm bg-light fw-bold text-center text-sa-primary"
              style={{ fontSize: '0.85rem' }}
            >
              {days} {days === 1 ? 'Day' : 'Days'}
            </div>
          </div>

          {/* 5. Reason Textarea */}
          <div className="col-12">
            <label className="form-label fw-semibold text-sa-charcoal" style={{ fontSize: '0.82rem' }}>
              Reason for Absence <span className="text-danger">*</span>
            </label>
            <textarea
              className="form-control form-control-sm"
              rows={3}
              placeholder="State the purpose of your leave and any lecture proxy arrangements..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{ fontSize: '0.84rem' }}
              required
            />
          </div>

          {/* 6. Optional Attachment */}
          <div className="col-12 col-md-7">
            <label className="form-label fw-semibold text-sa-charcoal" style={{ fontSize: '0.82rem' }}>
              Supporting Document <span className="text-sa-muted fw-normal">(Optional, e.g. Medical Certificate)</span>
            </label>
            <div className="d-flex align-items-center gap-2">
              <input
                type="file"
                id="leave-attachment"
                className="form-control form-control-sm"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                style={{ fontSize: '0.82rem' }}
              />
              {attachment && (
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => {
                    setAttachment(null);
                    const el = document.getElementById('leave-attachment');
                    if (el) el.value = '';
                  }}
                  style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="col-12 col-md-5 d-flex align-items-end justify-content-md-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary btn-sm px-4 py-2 d-inline-flex align-items-center gap-2 fw-semibold w-100 w-md-auto justify-content-center shadow-xs"
              style={{ backgroundColor: '#8B1216', borderColor: '#8B1216', fontSize: '0.85rem' }}
            >
              <Send size={15} />
              <span>{isSubmitting ? 'Submitting...' : 'Submit Leave Request'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
