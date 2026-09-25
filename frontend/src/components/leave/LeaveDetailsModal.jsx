import React from 'react';
import { X, Calendar, FileText, CheckCircle2, Clock, XCircle, AlertTriangle } from 'lucide-react';

export default function LeaveDetailsModal({ request, onClose, onCancelRequest }) {
  if (!request) return null;

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}
      tabIndex="-1"
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '520px' }}>
        <div className="modal-content border-0 shadow-lg rounded-3">
          {/* Modal Header */}
          <div
            className="modal-header text-white"
            style={{ backgroundColor: '#8B1216', borderTopLeftRadius: 'calc(0.5rem - 1px)', borderTopRightRadius: 'calc(0.5rem - 1px)' }}
          >
            <div className="d-flex align-items-center gap-2">
              <Calendar size={18} />
              <h5 className="modal-title brand-font fs-6 fw-bold m-0">Leave Request Details</h5>
            </div>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              aria-label="Close"
            />
          </div>

          {/* Modal Body */}
          <div className="modal-body p-4">
            <div className="d-flex align-items-center justify-content-between pb-3 mb-3 border-bottom">
              <div>
                <span className="text-sa-muted small d-block">Request ID</span>
                <span className="fw-bold brand-font fs-5 text-sa-charcoal">{request.id}</span>
              </div>
              <div>
                {request.status === 'Approved' ? (
                  <span className="badge rounded-pill" style={{ backgroundColor: '#EAF6EF', color: '#168554', padding: '5px 12px', fontSize: '0.8rem' }}>
                    <CheckCircle2 size={12} className="me-1" /> Approved
                  </span>
                ) : request.status === 'Rejected' ? (
                  <span className="badge rounded-pill" style={{ backgroundColor: '#FDF0F0', color: '#A91D22', padding: '5px 12px', fontSize: '0.8rem' }}>
                    <XCircle size={12} className="me-1" /> Rejected
                  </span>
                ) : request.status === 'Cancelled' ? (
                  <span className="badge rounded-pill" style={{ backgroundColor: '#F1F5F9', color: '#64748B', padding: '5px 12px', fontSize: '0.8rem' }}>
                    Cancelled
                  </span>
                ) : (
                  <span className="badge rounded-pill" style={{ backgroundColor: '#FEF8EB', color: '#D97718', padding: '5px 12px', fontSize: '0.8rem' }}>
                    <Clock size={12} className="me-1" /> Pending
                  </span>
                )}
              </div>
            </div>

            <div className="row g-3">
              <div className="col-6">
                <span className="text-sa-muted small d-block">Leave Type</span>
                <span className="fw-semibold text-sa-charcoal">{request.leaveType}</span>
              </div>

              <div className="col-6">
                <span className="text-sa-muted small d-block">Number of Days</span>
                <span className="fw-bold text-sa-primary">{request.days} {request.days === 1 ? 'Day' : 'Days'}</span>
              </div>

              <div className="col-6">
                <span className="text-sa-muted small d-block">From Date</span>
                <span className="fw-semibold text-sa-charcoal">{request.fromDate}</span>
              </div>

              <div className="col-6">
                <span className="text-sa-muted small d-block">To Date</span>
                <span className="fw-semibold text-sa-charcoal">{request.toDate}</span>
              </div>

              <div className="col-12">
                <span className="text-sa-muted small d-block">Applied Date</span>
                <span className="text-sa-charcoal">{request.appliedDate}</span>
              </div>

              <div className="col-12">
                <span className="text-sa-muted small d-block">Reason for Leave</span>
                <div className="p-2.5 bg-light rounded-2 text-sa-charcoal mt-1" style={{ fontSize: '0.84rem' }}>
                  {request.reason}
                </div>
              </div>

              {request.attachmentName && (
                <div className="col-12">
                  <span className="text-sa-muted small d-block">Attachment</span>
                  <div className="d-flex align-items-center gap-1.5 text-sa-primary mt-1 small">
                    <FileText size={14} />
                    <span>{request.attachmentName}</span>
                  </div>
                </div>
              )}

              <div className="col-12">
                <span className="text-sa-muted small d-block">Admin / Coordinator Comment</span>
                <div
                  className="p-2.5 rounded-2 mt-1"
                  style={{
                    backgroundColor: request.status === 'Approved' ? '#EAF6EF' : request.status === 'Rejected' ? '#FDF0F0' : '#FEF8EB',
                    fontSize: '0.84rem',
                    color: request.status === 'Approved' ? '#168554' : request.status === 'Rejected' ? '#A91D22' : '#D97718'
                  }}
                >
                  {request.adminComment || 'No comments provided yet.'}
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="modal-footer border-top d-flex justify-content-between">
            {request.status === 'Pending' ? (
              <button
                type="button"
                className="btn btn-outline-danger btn-sm d-inline-flex align-items-center gap-1.5"
                onClick={() => onCancelRequest(request.id)}
              >
                <XCircle size={14} />
                <span>Cancel Request</span>
              </button>
            ) : (
              <div />
            )}
            <button
              type="button"
              className="btn btn-secondary btn-sm px-3"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
