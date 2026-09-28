import React, { useState, useEffect } from 'react';
import LeaveSummary from '../components/leave/LeaveSummary';
import LeaveForm from '../components/leave/LeaveForm';
import LeaveHistory from '../components/leave/LeaveHistory';
import LeaveDetailsModal from '../components/leave/LeaveDetailsModal';
import { initialLeaveBalance } from '../data/leaveData';
import leaveService from '../services/leaveService';
import useAuth from '../hooks/useAuth';
import { toast } from 'react-toastify';

export default function LeaveRequest() {
  const [balance, setBalance] = useState(initialLeaveBalance);
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchRequests();
  }, [user]);

  const fetchRequests = async () => {
    try {
      if (!user) return;
      const data = await leaveService.getTeacherLeaveRequests(user.id);
      // Map data to frontend format
      const formatted = data.map(r => ({
        id: r.id,
        leaveType: r.leave_type,
        fromDate: r.from_date.split('T')[0],
        toDate: r.to_date.split('T')[0],
        days: r.number_of_days,
        reason: r.reason,
        appliedDate: new Date(r.created_at).toLocaleDateString(),
        status: r.status,
        adminComment: r.admin_comment
      }));
      setRequests(formatted);
      // Optional: recalculate balance based on approved leaves
    } catch (err) {
      toast.error('Failed to load leave requests');
    }
  };

  const handleApplySuccess = async (requestPayload, resetFormCallback) => {
    try {
      if (!user) return;
      requestPayload.teacher_id = user.id;
      await leaveService.createLeaveRequest(requestPayload);
      toast.success('Leave application submitted successfully!');
      resetFormCallback();
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit leave request');
      resetFormCallback();
    }
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
