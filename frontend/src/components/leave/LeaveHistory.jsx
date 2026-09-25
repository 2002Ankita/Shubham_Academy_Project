import React from 'react';
import { FileText, Eye, CheckCircle2, Clock, XCircle } from 'lucide-react';

export default function LeaveHistory({ requests, onViewDetails }) {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return (
          <span
            className="badge rounded-pill fw-medium d-inline-flex align-items-center gap-1"
            style={{ backgroundColor: '#EAF6EF', color: '#168554', fontSize: '0.74rem', padding: '3px 8px' }}
          >
            <CheckCircle2 size={11} /> Approved
          </span>
        );
      case 'Rejected':
        return (
          <span
            className="badge rounded-pill fw-medium d-inline-flex align-items-center gap-1"
            style={{ backgroundColor: '#FDF0F0', color: '#A91D22', fontSize: '0.74rem', padding: '3px 8px' }}
          >
            <XCircle size={11} /> Rejected
          </span>
        );
      case 'Cancelled':
        return (
          <span
            className="badge rounded-pill fw-medium d-inline-flex align-items-center gap-1"
            style={{ backgroundColor: '#F1F5F9', color: '#64748B', fontSize: '0.74rem', padding: '3px 8px' }}
          >
            Cancelled
          </span>
        );
      case 'Pending':
      default:
        return (
          <span
            className="badge rounded-pill fw-medium d-inline-flex align-items-center gap-1"
            style={{ backgroundColor: '#FEF8EB', color: '#D97718', fontSize: '0.74rem', padding: '3px 8px' }}
          >
            <Clock size={11} /> Pending
          </span>
        );
    }
  };

  return (
    <div className="sa-card bg-white rounded-3 border p-3 p-md-4 shadow-xs">
      <div className="d-flex align-items-center justify-content-between pb-3 mb-2 border-bottom flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2">
          <div
            className="rounded-2 d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ width: '32px', height: '32px', backgroundColor: '#FEF8EB', color: '#D97718' }}
          >
            <FileText size={17} />
          </div>
          <div>
            <h4 className="brand-font fw-bold m-0 text-sa-charcoal fs-6">My Leave Requests</h4>
            <span className="text-sa-muted" style={{ fontSize: '0.78rem' }}>
              Past and currently processed applications ({requests.length} records)
            </span>
          </div>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-hover align-middle m-0" style={{ fontSize: '0.82rem' }}>
          <thead>
            <tr className="text-muted border-bottom bg-light" style={{ fontSize: '0.76rem' }}>
              <th className="py-2.5 ps-2">Request ID</th>
              <th className="py-2.5">Leave Type</th>
              <th className="py-2.5">From</th>
              <th className="py-2.5">To</th>
              <th className="py-2.5 text-center">Days</th>
              <th className="py-2.5">Reason</th>
              <th className="py-2.5">Status</th>
              <th className="py-2.5">Applied On</th>
              <th className="py-2.5 pe-2 text-end">Action</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-4 text-sa-muted">
                  No leave requests found.
                </td>
              </tr>
            ) : (
              requests.map((req) => (
                <tr key={req.id}>
                  <td className="ps-2 fw-semibold text-sa-charcoal" style={{ whiteSpace: 'nowrap' }}>
                    {req.id}
                  </td>
                  <td className="fw-medium text-sa-charcoal" style={{ whiteSpace: 'nowrap' }}>
                    {req.leaveType}
                  </td>
                  <td className="text-sa-charcoal" style={{ whiteSpace: 'nowrap' }}>
                    {req.fromDate}
                  </td>
                  <td className="text-sa-charcoal" style={{ whiteSpace: 'nowrap' }}>
                    {req.toDate}
                  </td>
                  <td className="text-center fw-bold text-sa-charcoal">
                    {req.days}
                  </td>
                  <td className="text-sa-muted text-truncate" style={{ maxWidth: '220px' }} title={req.reason}>
                    {req.reason}
                  </td>
                  <td>{getStatusBadge(req.status)}</td>
                  <td className="text-sa-muted" style={{ whiteSpace: 'nowrap' }}>
                    {req.appliedDate}
                  </td>
                  <td className="pe-2 text-end" style={{ whiteSpace: 'nowrap' }}>
                    <button
                      onClick={() => onViewDetails(req)}
                      className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1 py-1 px-2.5 rounded-2"
                      style={{ fontSize: '0.78rem' }}
                    >
                      <Eye size={12} />
                      <span>View</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
