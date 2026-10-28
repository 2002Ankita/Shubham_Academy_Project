import React, { useState, useEffect, useMemo } from 'react';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import leaveService from '../../services/leaveService';
import useAuth from '../../hooks/useAuth';
import { CheckCircle, XCircle, Clock, Building2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { getUserBranch, isSuperAdminUser, filterLeavesByBranch, CAMPUS } from '../../utils/branchUtils';

export default function LeaveApprovals() {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  const userBranch = getUserBranch(user);
  const isSuperAdmin = isSuperAdminUser(user);
  const [selectedBranch, setSelectedBranch] = useState(isSuperAdmin ? 'ALL' : userBranch);

  useEffect(() => {
    if (!isSuperAdmin && userBranch) {
      setSelectedBranch(userBranch);
    }
  }, [userBranch, isSuperAdmin]);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const data = await leaveService.getAllLeaveRequests();
      setLeaves(data || []);
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

  const effectiveBranch = isSuperAdmin ? selectedBranch : userBranch;
  const filteredLeaves = useMemo(() => {
    return filterLeavesByBranch(leaves, effectiveBranch);
  }, [leaves, effectiveBranch]);

  return (
    <div className="d-flex flex-column gap-4">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div>
          <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
            Faculty Leave Approvals
          </h3>
          <span className="small text-sa-muted">
            Review and approve or reject leave requests submitted by teachers
          </span>
        </div>

        {/* Branch Scope Display: Dropdown for SuperAdmin, Badge for Regular Admin */}
        {isSuperAdmin ? (
          <div className="d-flex align-items-center gap-2">
            <span className="small fw-semibold text-sa-muted d-flex align-items-center gap-1">
              <Building2 size={15} /> Campus:
            </span>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="form-select form-select-sm shadow-xs border"
              style={{ minWidth: '175px', borderRadius: '8px' }}
            >
              <option value="ALL">All Campuses</option>
              <option value={CAMPUS.MANGALVAR_PETH}>{CAMPUS.MANGALVAR_PETH}</option>
              <option value={CAMPUS.TARABAI_PARK}>{CAMPUS.TARABAI_PARK}</option>
            </select>
          </div>
        ) : (
          <span
            className="badge rounded-pill d-inline-flex align-items-center gap-1.5 px-3 py-1.5"
            style={{
              backgroundColor: '#FDF0F0',
              color: '#8B1216',
              border: '1px solid #F5C2C4',
              fontSize: '0.82rem',
              fontWeight: '600'
            }}
          >
            <Building2 size={14} />
            <span>{userBranch} Campus</span>
          </span>
        )}
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
              key: 'branch',
              title: 'Campus',
              render: (val, row) => (
                <span className="badge bg-light text-dark border small fw-semibold">
                  {val || row.campus || 'Mangalvar Peth'}
                </span>
              )
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
                  <div className="fw-semibold">
                    {row.from_date ? new Date(row.from_date).toLocaleDateString() : '--'} - {row.to_date ? new Date(row.to_date).toLocaleDateString() : '--'}
                  </div>
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
          data={filteredLeaves}
          loading={loading}
        />
      </div>
    </div>
  );
}
