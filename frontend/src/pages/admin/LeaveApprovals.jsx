import React, { useState, useEffect } from 'react';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import leaveService from '../../services/leaveService';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'react-toastify';

export default function LeaveApprovals() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const data = await leaveService.getAllLeaveRequests();
      setLeaves(data);
    } catch (err) {
      toast.error('Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      await leaveService.updateLeaveStatus(id, status, status === 'Approved' ? 'Approved by Admin' : 'Rejected by Admin');
      toast.success(`Leave request ${status.toLowerCase()} successfully!`);
      fetchLeaves();
    } catch (err) {
      toast.error(`Failed to ${status.toLowerCase()} leave request`);
    }
  };

  return (
    <div className="d-flex flex-column gap-4">
      <div>
        <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
          Faculty Leave Approvals
        </h3>
        <span className="small text-sa-muted">
          Review and approve or reject leave requests submitted by teachers
        </span>
      </div>

      <div className="sa-card p-4">
        <Table
          columns={[
            {
              key: 'teacher_name',
              title: 'Faculty Name',
              render: (val) => <span className="fw-bold text-sa-primary">{val}</span>
            },
            {
              key: 'leave_type',
              title: 'Leave Type',
              render: (val) => <span className="badge bg-light text-dark border">{val}</span>
            },
            {
              key: 'dates',
              title: 'Duration',
              render: (_, row) => (
                <div className="small">
                  <div className="fw-semibold">{new Date(row.from_date).toLocaleDateString()} - {new Date(row.to_date).toLocaleDateString()}</div>
                  <div className="text-sa-muted">{row.number_of_days} Day(s)</div>
                </div>
              )
            },
            {
              key: 'reason',
              title: 'Reason',
              render: (val) => <span className="small text-wrap" style={{ maxWidth: '200px', display: 'inline-block' }}>{val}</span>
            },
            {
              key: 'status',
              title: 'Status',
              render: (val) => (
                <span className={val === 'Approved' ? 'badge-paid' : val === 'Rejected' ? 'badge-overdue' : 'badge-pending'}>
                  {val === 'Approved' && <CheckCircle size={12} className="me-1" />}
                  {val === 'Rejected' && <XCircle size={12} className="me-1" />}
                  {val === 'Pending' && <Clock size={12} className="me-1" />}
                  {val}
                </span>
              )
            },
            {
              key: 'id',
              title: 'Action',
              align: 'end',
              render: (val, row) => (
                row.status === 'Pending' ? (
                  <div className="d-flex gap-2 justify-content-end">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleUpdateStatus(val, 'Approved')}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-danger border-danger hover-danger"
                      onClick={() => handleUpdateStatus(val, 'Rejected')}
                    >
                      Reject
                    </Button>
                  </div>
                ) : (
                  <span className="small text-sa-muted">Processed</span>
                )
              )
            }
          ]}
          data={leaves}
          loading={loading}
        />
      </div>
    </div>
  );
}
