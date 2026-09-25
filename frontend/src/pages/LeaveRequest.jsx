import React, { useState } from 'react';
import LeaveSummary from '../components/leave/LeaveSummary';
import LeaveForm from '../components/leave/LeaveForm';
import LeaveHistory from '../components/leave/LeaveHistory';
import LeaveDetailsModal from '../components/leave/LeaveDetailsModal';
import { initialLeaveBalance, initialLeaveRequests } from '../data/leaveData';
import { toast } from 'react-toastify';

export default function LeaveRequest() {
  const [balance, setBalance] = useState(initialLeaveBalance);
  const [requests, setRequests] = useState(initialLeaveRequests);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const handleApplySuccess = (newRequest) => {
    setRequests(prev => [newRequest, ...prev]);
    setBalance(prev => ({
      ...prev,
      pending: prev.pending + 1
    }));
  };

  const handleCancelRequest = (requestId) => {
    setRequests(prev =>
      prev.map(r => (r.id === requestId ? { ...r, status: 'Cancelled', adminComment: 'Cancelled by teacher.' } : r))
    );
    setBalance(prev => ({
      ...prev,
      pending: Math.max(0, prev.pending - 1)
    }));
    setSelectedRequest(null);
    toast.info(`Leave request ${requestId} has been cancelled.`);
  };

  return (
    <div className="d-flex flex-column gap-3">
      {/* 1. Page Header */}
      <div>
        <h1 className="fw-bold brand-font text-sa-charcoal m-0 fs-4">
          Leave Request
        </h1>
        <p className="text-sa-muted m-0 mt-0.5 small">
          Apply for leave and track your leave requests.
        </p>
      </div>

      {/* 2. Top Summary Cards */}
      <LeaveSummary balance={balance} />

      {/* 3. Apply for Leave Form Card */}
      <LeaveForm onSubmitSuccess={handleApplySuccess} />

      {/* 4. Leave Request History */}
      <LeaveHistory requests={requests} onViewDetails={setSelectedRequest} />

      {/* 5. View Details Modal */}
      {selectedRequest && (
        <LeaveDetailsModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onCancelRequest={handleCancelRequest}
        />
      )}
    </div>
  );
}
