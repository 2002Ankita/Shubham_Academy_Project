import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LeaveSummary from '../components/leave/LeaveSummary';
import LeaveForm from '../components/leave/LeaveForm';
import LeaveHistory from '../components/leave/LeaveHistory';
import LeaveDetailsModal from '../components/leave/LeaveDetailsModal';
import leaveService from '../services/leaveService';
import useAuth from '../hooks/useAuth';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';

export default function LeaveRequest() {
  const navigate = useNavigate();
  const [balance, setBalance] = useState({ total: 24, taken: 0, pending: 0, available: 24 });
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
      
      // Recalculate balance based on approved leaves
      let taken = 0;
      let pending = 0;
      formatted.forEach(r => {
        if (r.status === 'Approved') taken += r.days;
        if (r.status === 'Pending') pending += 1;
      });
      
      const total = 24;
      setBalance({
        total,
        taken,
        pending,
        available: total - taken
      });

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

  const handleCancelRequest = async (requestId) => {
    try {
      // API call to cancel the request
      await leaveService.updateLeaveStatus(requestId, 'Cancelled', 'Cancelled by teacher.');
      toast.info(`Leave request has been cancelled.`);
      fetchRequests();
      setSelectedRequest(null);
    } catch (err) {
      toast.error('Failed to cancel leave request.');
    }
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
