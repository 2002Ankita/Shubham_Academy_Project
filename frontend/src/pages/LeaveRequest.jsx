import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import LeaveSummary from '../components/leave/LeaveSummary';
import LeaveForm from '../components/leave/LeaveForm';
import LeaveHistory from '../components/leave/LeaveHistory';
import LeaveDetailsModal from '../components/leave/LeaveDetailsModal';
import Button from '../components/common/Button';
import leaveService from '../services/leaveService';
import useAuth from '../hooks/useAuth';
import { ArrowLeft, Download } from 'lucide-react';
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
      const formatted = (data || []).map(r => ({
        id: r.id,
        leaveType: r.leave_type,
        fromDate: r.from_date ? String(r.from_date).split('T')[0] : '',
        toDate: r.to_date ? String(r.to_date).split('T')[0] : '',
        days: r.number_of_days || 0,
        reason: r.reason || '',
        appliedDate: r.created_at ? new Date(r.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
        status: r.status || 'Pending',
        adminComment: r.admin_comment || ''
      }));
      setRequests(formatted);

      // Try fetching official summary from backend
      try {
        const summary = await leaveService.getTeacherLeaveSummary(user.id);
        if (summary) {
          setBalance({
            total: summary.total || 24,
            taken: summary.taken || 0,
            pending: summary.pending || 0,
            available: summary.available || (24 - (summary.taken || 0))
          });
          return;
        }
      } catch (sumErr) {
        // Fallback to local computation
      }

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
      requestPayload.teacher_name = user.full_name || user.name || 'Dr. Priya Kulkarni';
      requestPayload.branch = user.branch || (user.email?.includes('tarabai') ? 'Tarabai Park' : 'Mangalvar Peth');
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

  const handleExportExcel = async () => {
    const teacherName = user?.name || user?.full_name || 'Teacher';
    const sanitizedName = teacherName.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `Leave_Requests_${sanitizedName}.xlsx`;

    try {
      // 1. Attempt to download executive Excel report directly from backend API
      if (user?.id) {
        try {
          const blobData = await leaveService.exportLeaveRequests(user.id);
          if (blobData) {
            const blob = new Blob([blobData], {
              type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
            toast.success('Exported leave requests to Excel from backend successfully!');
            return;
          }
        } catch (backendErr) {
          console.warn('Backend Excel export failed or offline, using fallback client generator:', backendErr);
        }
      }

      // 2. Client-side fallback if backend export is unavailable
      const currentDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const sheetData = [
        ['SHUBHAM ACADEMY'],
        ['FACULTY LEAVE REQUESTS REPORT'],
        ['Teacher Name:', teacherName, 'Export Date:', currentDate],
        ['Total Leaves:', balance.total, 'Leaves Taken:', balance.taken, 'Available Leaves:', balance.available],
        [],
        ['Request ID', 'Leave Type', 'From Date', 'To Date', 'Days', 'Reason', 'Status', 'Applied On', 'Admin Remarks']
      ];

      if (!requests || requests.length === 0) {
        sheetData.push(['No leave requests found.', '', '', '', '', '', '', '', '']);
      } else {
        requests.forEach((req) => {
          sheetData.push([
            req.id || '--',
            req.leaveType || '--',
            req.fromDate || '--',
            req.toDate || '--',
            req.days || 0,
            req.reason || '--',
            req.status || 'Pending',
            req.appliedDate || '--',
            req.adminComment || '--'
          ]);
        });
      }

      const ws = XLSX.utils.aoa_to_sheet(sheetData);
      ws['!cols'] = [
        { wch: 18 }, // Request ID
        { wch: 16 }, // Leave Type
        { wch: 14 }, // From Date
        { wch: 14 }, // To Date
        { wch: 8 },  // Days
        { wch: 32 }, // Reason
        { wch: 14 }, // Status
        { wch: 14 }, // Applied On
        { wch: 26 }  // Admin Remarks
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Leave Requests');
      XLSX.writeFile(wb, filename);
      toast.success('Exported leave requests to Excel successfully!');
    } catch (err) {
      console.error('Failed to export leave requests to Excel:', err);
      toast.error('Failed to export Excel file');
    }
  };

  return (
    <div className="d-flex flex-column gap-3">
      {/* 1. Page Header */}
      <div className="d-flex align-items-center gap-3 pt-0 pb-0.5">
        <button
          type="button"
          onClick={() => navigate('/teacher/dashboard')}
          className="btn btn-light d-inline-flex align-items-center justify-content-center border shadow-sm"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            borderColor: '#E2E8F0',
            backgroundColor: '#FFFFFF',
            color: '#0F172A',
            padding: 0,
            cursor: 'pointer'
          }}
          aria-label="Back to dashboard"
          title="Back to dashboard"
        >
          <ArrowLeft size={18} />
        </button>

        <div>
          <h1 className="fw-bold brand-font text-sa-charcoal m-0" style={{ fontSize: '23px', lineHeight: 1.25 }}>
            Leave Request
          </h1>
          <p className="text-sa-muted m-0 mt-0.5" style={{ fontSize: '13.5px' }}>
            Apply for leave and track your leave requests
          </p>
        </div>
      </div>

      {/* 2. Top Summary Cards */}
      <LeaveSummary balance={balance} />

      {/* 3. Apply for Leave Form Card */}
      <LeaveForm onSubmitSuccess={handleApplySuccess} />

      {/* 4. Leave Request History */}
      <LeaveHistory
        requests={requests}
        onViewDetails={setSelectedRequest}
        onExport={handleExportExcel}
      />

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
