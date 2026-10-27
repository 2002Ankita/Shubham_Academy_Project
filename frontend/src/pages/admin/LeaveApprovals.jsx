import React, { useState, useEffect, useMemo } from 'react';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import BackButton from '../../components/common/BackButton';
import Modal from '../../components/common/Modal';
import SearchBar from '../../components/common/SearchBar';
import leaveService from '../../services/leaveService';
import { useAuth } from '../../hooks/useAuth';
import { getUserBranch, normalizeBranch, CAMPUS } from '../../utils/branchUtils';
import {
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Filter,
  CheckCircle2,
  AlertCircle,
  Download,
  PlusCircle,
  RefreshCw,
  FileText,
  UserCheck,
  Building,
  Info,
  CalendarDays,
  Send,
  User
} from 'lucide-react';
import { toast } from 'react-toastify';

export default function LeaveApprovals() {
  const { user } = useAuth();
  const userBranch = getUserBranch(user);
  const isSuperAdmin = (user?.role || '').toLowerCase().includes('super');

  // Campus Selection: Default to user's branch or Mangalvar Peth
  const [selectedCampus, setSelectedCampus] = useState(() => {
    if (userBranch) return userBranch;
    return CAMPUS.MANGALVAR_PETH;
  });

  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Modal States
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);

  // Form Inputs in Modals
  const [adminComment, setAdminComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Quick Test Leave Form
  const [newLeaveForm, setNewLeaveForm] = useState({
    teacher_name: 'Dr. Priya Kulkarni',
    teacher_id: 'USR-TCH-01',
    branch: selectedCampus === 'ALL' ? CAMPUS.MANGALVAR_PETH : selectedCampus,
    leave_type: 'Casual Leave',
    from_date: '',
    to_date: '',
    reason: 'Academic conference and curriculum workshop'
  });

  const fetchLeaves = async (showToast = false) => {
    setLoading(true);
    try {
      const data = await leaveService.getAllLeaveRequests({
        branch: selectedCampus === 'ALL' ? undefined : selectedCampus
      });
      setLeaves(data || []);
      if (showToast) {
        toast.success('Leave requests synchronized!');
      }
    } catch (err) {
      toast.error('Failed to load leave requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [selectedCampus]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLeaves(true);
  };

  // Open Approval Modal
  const openApproveModal = (leave) => {
    setSelectedLeave(leave);
    const branchLabel = leave.branch || selectedCampus;
    setAdminComment(`Approved by ${user?.full_name || 'Admin'} (${branchLabel})`);
    setApprovalModalOpen(true);
  };

  // Open Rejection Modal
  const openRejectModal = (leave) => {
    setSelectedLeave(leave);
    setAdminComment('Lecture clash on scheduled date; please reschedule');
    setRejectionModalOpen(true);
  };

  // Open Details Modal
  const openDetailsModal = (leave) => {
    setSelectedLeave(leave);
    setDetailsModalOpen(true);
  };

  // Confirm Approval Action
  const handleConfirmApproval = async () => {
    if (!selectedLeave) return;
    setActionLoading(true);
    try {
      await leaveService.updateLeaveStatus(
        selectedLeave.id,
        'Approved',
        adminComment || 'Approved by Admin'
      );
      toast.success(`Leave request for ${selectedLeave.teacher_name} approved successfully!`);
      setApprovalModalOpen(false);
      fetchLeaves();
    } catch (err) {
      toast.error('Failed to approve leave request');
    } finally {
      setActionLoading(false);
    }
  };

  // Confirm Rejection Action
  const handleConfirmRejection = async () => {
    if (!selectedLeave) return;
    if (!adminComment.trim()) {
      toast.error('Please specify a reason or remark for rejection.');
      return;
    }
    setActionLoading(true);
    try {
      await leaveService.updateLeaveStatus(
        selectedLeave.id,
        'Rejected',
        adminComment.trim()
      );
      toast.info(`Leave request for ${selectedLeave.teacher_name} rejected.`);
      setRejectionModalOpen(false);
      fetchLeaves();
    } catch (err) {
      toast.error('Failed to reject leave request');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Simulated Test Leave Request
  const handleCreateTestLeave = async (e) => {
    e.preventDefault();
    if (!newLeaveForm.from_date || !newLeaveForm.to_date) {
      toast.error('Please specify both From and To dates.');
      return;
    }
    if (new Date(newLeaveForm.to_date) < new Date(newLeaveForm.from_date)) {
      toast.error('To Date cannot be earlier than From Date.');
      return;
    }
    setActionLoading(true);
    try {
      const start = new Date(newLeaveForm.from_date);
      const end = new Date(newLeaveForm.to_date);
      const days = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;

      await leaveService.createLeaveRequest({
        ...newLeaveForm,
        number_of_days: days
      });
      toast.success(`Test leave submitted for ${newLeaveForm.branch}!`);
      setCreateModalOpen(false);
      fetchLeaves();
    } catch (err) {
      toast.error('Failed to submit test leave');
    } finally {
      setActionLoading(false);
    }
  };

  // Export to Excel
  const handleExport = async () => {
    try {
      const blob = await leaveService.exportLeaveRequests({
        branch: selectedCampus === 'ALL' ? undefined : selectedCampus
      });
      if (blob) {
        const url = window.URL.createObjectURL(new Blob([blob]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Faculty_Leaves_${selectedCampus.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        toast.success('Leave report exported to Excel!');
      } else {
        toast.info('Export started.');
      }
    } catch (err) {
      toast.error('Excel export failed');
    }
  };

  // Filtered List
  const filteredLeaves = useMemo(() => {
    return leaves.filter((item) => {
      // Campus match
      if (selectedCampus !== 'ALL') {
        const itemBranch = normalizeBranch(item.branch) || (
          item.teacher_name?.toLowerCase().includes('sharma') ? CAMPUS.MANGALVAR_PETH : CAMPUS.TARABAI_PARK
        );
        if (itemBranch !== normalizeBranch(selectedCampus)) return false;
      }

      // Status match
      if (statusFilter !== 'ALL' && (item.status || '').toUpperCase() !== statusFilter) {
        return false;
      }

      // Type match
      if (typeFilter !== 'ALL' && item.leave_type !== typeFilter) {
        return false;
      }

      // Search match
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = (item.teacher_name || '').toLowerCase().includes(q);
        const matchesReason = (item.reason || '').toLowerCase().includes(q);
        const matchesType = (item.leave_type || '').toLowerCase().includes(q);
        if (!matchesName && !matchesReason && !matchesType) return false;
      }

      return true;
    });
  }, [leaves, selectedCampus, statusFilter, typeFilter, search]);

  // Statistics
  const stats = useMemo(() => {
    const list = selectedCampus === 'ALL'
      ? leaves
      : leaves.filter(l => (normalizeBranch(l.branch) || CAMPUS.TARABAI_PARK) === normalizeBranch(selectedCampus));
    const total = list.length;
    const pending = list.filter(l => (l.status || '').toLowerCase() === 'pending').length;
    const approved = list.filter(l => (l.status || '').toLowerCase() === 'approved').length;
    const rejected = list.filter(l => (l.status || '').toLowerCase() === 'rejected').length;
    return { total, pending, approved, rejected };
  }, [leaves, selectedCampus]);

  return (
    <div className="d-flex flex-column gap-4 pb-5">
      {/* Header Row */}
      <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
        <div>
          <BackButton to="/admin/dashboard" label="Back to Dashboard" />
          <div className="d-flex align-items-center gap-2 mt-1">
            <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
              Faculty Leave Approvals
            </h3>
            <span
              className="badge px-2.5 py-1 rounded-pill"
              style={{
                backgroundColor: '#FDF2F2',
                color: '#8B1216',
                border: '1px solid #FCA5A5',
                fontSize: '0.74rem',
                fontWeight: '700'
              }}
            >
              {selectedCampus === 'ALL' ? '🌐 All Campuses' : selectedCampus === CAMPUS.MANGALVAR_PETH ? '🏛️ Mangalwar Peth' : '🌲 Tarabai Park'}
            </span>
          </div>
          <span className="small text-sa-muted">
            Manage, approve, or reject faculty leave applications for Mangalwar Peth (MP) and Tarabai Park (TP)
          </span>
        </div>

        {/* Top Actions: Campus Selector Pills & Action Buttons */}
        <div className="d-flex flex-wrap align-items-center gap-2">
          {/* Campus Switcher Pills */}
          <div className="btn-group btn-group-sm bg-white p-1 rounded-pill border shadow-xs" role="group">
            <button
              type="button"
              className={`btn btn-sm px-3 rounded-pill fw-bold transition-all ${
                selectedCampus === CAMPUS.MANGALVAR_PETH ? 'text-white' : 'text-muted'
              }`}
              style={{
                backgroundColor: selectedCampus === CAMPUS.MANGALVAR_PETH ? '#8B1216' : 'transparent',
                fontSize: '0.78rem'
              }}
              onClick={() => setSelectedCampus(CAMPUS.MANGALVAR_PETH)}
            >
              🏛️ Mangalwar Peth
            </button>
            <button
              type="button"
              className={`btn btn-sm px-3 rounded-pill fw-bold transition-all ${
                selectedCampus === CAMPUS.TARABAI_PARK ? 'text-white' : 'text-muted'
              }`}
              style={{
                backgroundColor: selectedCampus === CAMPUS.TARABAI_PARK ? '#8B1216' : 'transparent',
                fontSize: '0.78rem'
              }}
              onClick={() => setSelectedCampus(CAMPUS.TARABAI_PARK)}
            >
              🌲 Tarabai Park
            </button>
            {isSuperAdmin && (
              <button
                type="button"
                className={`btn btn-sm px-3 rounded-pill fw-bold transition-all ${
                  selectedCampus === 'ALL' ? 'text-white' : 'text-muted'
                }`}
                style={{
                  backgroundColor: selectedCampus === 'ALL' ? '#8B1216' : 'transparent',
                  fontSize: '0.78rem'
                }}
                onClick={() => setSelectedCampus('ALL')}
              >
                🌐 All Campuses
              </button>
            )}
          </div>

          {/* Test Submission Button */}
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1.5 px-3 py-1.5 rounded-pill shadow-xs"
            style={{ fontSize: '0.78rem', fontWeight: '600' }}
            onClick={() => {
              setNewLeaveForm(prev => ({
                ...prev,
                branch: selectedCampus === 'ALL' ? CAMPUS.MANGALVAR_PETH : selectedCampus,
                from_date: new Date().toISOString().split('T')[0],
                to_date: new Date(Date.now() + 86400000).toISOString().split('T')[0]
              }));
              setCreateModalOpen(true);
            }}
          >
            <PlusCircle size={15} color="#8B1216" />
            <span>Apply Test Leave</span>
          </button>

          {/* Export to Excel Button */}
          <button
            type="button"
            className="btn btn-sm btn-outline-dark d-flex align-items-center gap-1.5 px-3 py-1.5 rounded-pill shadow-xs"
            style={{ fontSize: '0.78rem', fontWeight: '600' }}
            onClick={handleExport}
          >
            <Download size={15} />
            <span>Export Excel</span>
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            className="btn btn-sm btn-light border p-2 rounded-circle shadow-xs"
            title="Refresh Leave List"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="row g-3">
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="sa-card p-3 rounded-3 border bg-white shadow-xs">
            <div className="d-flex align-items-center justify-content-between mb-1">
              <span className="text-sa-muted small fw-semibold" style={{ fontSize: '0.78rem' }}>Total Applications</span>
              <div
                className="p-2 rounded-circle"
                style={{ backgroundColor: '#F1F5F9', color: '#475569' }}
              >
                <Calendar size={17} />
              </div>
            </div>
            <div className="fs-3 fw-bold text-sa-charcoal">{stats.total}</div>
            <div className="text-sa-muted small mt-1" style={{ fontSize: '0.72rem' }}>
              Across {selectedCampus === 'ALL' ? 'all branches' : selectedCampus}
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div
            className="sa-card p-3 rounded-3 border shadow-xs"
            style={{
              backgroundColor: stats.pending > 0 ? '#FFFBEB' : '#FFFFFF',
              borderColor: stats.pending > 0 ? '#FDE68A' : '#E2E8F0'
            }}
          >
            <div className="d-flex align-items-center justify-content-between mb-1">
              <span className="text-amber-800 small fw-semibold" style={{ fontSize: '0.78rem', color: '#B45309' }}>
                Pending Approvals
              </span>
              <div
                className="p-2 rounded-circle"
                style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}
              >
                <Clock size={17} />
              </div>
            </div>
            <div className="fs-3 fw-bold" style={{ color: '#92400E' }}>{stats.pending}</div>
            <div className="small mt-1 fw-medium" style={{ fontSize: '0.72rem', color: '#B45309' }}>
              {stats.pending > 0 ? '⚠️ Action Required' : 'All requests processed'}
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="sa-card p-3 rounded-3 border bg-white shadow-xs">
            <div className="d-flex align-items-center justify-content-between mb-1">
              <span className="small fw-semibold" style={{ fontSize: '0.78rem', color: '#15803D' }}>Approved Leaves</span>
              <div
                className="p-2 rounded-circle"
                style={{ backgroundColor: '#DCFCE7', color: '#16A34A' }}
              >
                <CheckCircle2 size={17} />
              </div>
            </div>
            <div className="fs-3 fw-bold" style={{ color: '#15803D' }}>{stats.approved}</div>
            <div className="small mt-1 text-sa-muted" style={{ fontSize: '0.72rem' }}>
              Sanctioned by department admin
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="sa-card p-3 rounded-3 border bg-white shadow-xs">
            <div className="d-flex align-items-center justify-content-between mb-1">
              <span className="text-sa-muted small fw-semibold" style={{ fontSize: '0.78rem', color: '#BE123C' }}>Rejected / Declined</span>
              <div
                className="p-2 rounded-circle"
                style={{ backgroundColor: '#FFE4E6', color: '#E11D48' }}
              >
                <XCircle size={17} />
              </div>
            </div>
            <div className="fs-3 fw-bold" style={{ color: '#BE123C' }}>{stats.rejected}</div>
            <div className="small mt-1 text-sa-muted" style={{ fontSize: '0.72rem' }}>
              Declined with admin comments
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="sa-card p-3 rounded-3 border bg-white shadow-xs">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-5">
            <SearchBar
              placeholder="Search faculty name, subject, or reason..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="col-6 col-md-3">
            <select
              className="form-select form-select-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ fontSize: '0.82rem', height: '38px', borderRadius: '8px' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending Approval</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div className="col-6 col-md-4">
            <select
              className="form-select form-select-sm"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{ fontSize: '0.82rem', height: '38px', borderRadius: '8px' }}
            >
              <option value="ALL">All Leave Types</option>
              <option value="Casual Leave">Casual Leave</option>
              <option value="Medical Leave">Medical Leave</option>
              <option value="Sick Leave">Sick Leave</option>
              <option value="Earned Leave">Earned Leave</option>
              <option value="Academic Leave">Academic Leave</option>
              <option value="Emergency Leave">Emergency Leave</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Leave Table Card */}
      <div className="sa-card p-4 rounded-3 border bg-white shadow-xs">
        <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
          <div className="d-flex align-items-center gap-2">
            <UserCheck size={18} color="#8B1216" />
            <h5 className="fw-bold m-0 text-sa-charcoal brand-font" style={{ fontSize: '0.96rem' }}>
              Applications ({filteredLeaves.length})
            </h5>
          </div>
          <span className="badge bg-light text-muted border" style={{ fontSize: '0.74rem' }}>
            Showing: {selectedCampus === 'ALL' ? 'Both Campuses (MP & TP)' : selectedCampus}
          </span>
        </div>

        <Table
          columns={[
            {
              key: 'teacher_name',
              title: 'Faculty Member',
              render: (val, row) => {
                const initials = (val || 'T')
                  .split(' ')
                  .map(p => p[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();
                return (
                  <div className="d-flex align-items-center gap-2.5">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-xs flex-shrink-0"
                      style={{
                        width: '34px',
                        height: '34px',
                        backgroundColor: '#8B1216',
                        fontSize: '0.76rem'
                      }}
                    >
                      {initials}
                    </div>
                    <div>
                      <div className="fw-bold text-sa-charcoal" style={{ fontSize: '0.86rem' }}>
                        {val}
                      </div>
                      <div className="text-sa-muted small" style={{ fontSize: '0.72rem' }}>
                        {row.teacher_id || 'FACULTY'}
                      </div>
                    </div>
                  </div>
                );
              }
            },
            {
              key: 'branch',
              title: 'Campus / Branch',
              render: (val) => {
                const isMP = normalizeBranch(val) === CAMPUS.MANGALVAR_PETH;
                return (
                  <span
                    className="badge d-inline-flex align-items-center gap-1 px-2.5 py-1 rounded-pill"
                    style={{
                      backgroundColor: isMP ? '#FDF2F2' : '#F0FDF4',
                      color: isMP ? '#991B1B' : '#166534',
                      border: isMP ? '1px solid #FECACA' : '1px solid #BBF7D0',
                      fontSize: '0.74rem',
                      fontWeight: '700'
                    }}
                  >
                    <span>{isMP ? '🏛️ Mangalwar Peth' : '🌲 Tarabai Park'}</span>
                  </span>
                );
              }
            },
            {
              key: 'leave_type',
              title: 'Leave Type',
              render: (val) => (
                <span
                  className="badge px-2.5 py-1 rounded-2"
                  style={{
                    backgroundColor: '#F8FAFC',
                    color: '#334155',
                    border: '1px solid #E2E8F0',
                    fontSize: '0.76rem',
                    fontWeight: '600'
                  }}
                >
                  {val || 'Leave'}
                </span>
              )
            },
            {
              key: 'dates',
              title: 'Duration & Dates',
              render: (_, row) => {
                const fromStr = row.from_date ? new Date(row.from_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '--';
                const toStr = row.to_date ? new Date(row.to_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '--';
                return (
                  <div className="small">
                    <div className="fw-semibold text-sa-charcoal" style={{ fontSize: '0.82rem' }}>
                      {fromStr} — {toStr}
                    </div>
                    <div className="text-sa-muted" style={{ fontSize: '0.74rem' }}>
                      <span className="badge bg-light text-dark border px-1.5 py-0.5">
                        {row.number_of_days} Day{row.number_of_days > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                );
              }
            },
            {
              key: 'reason',
              title: 'Reason / Purpose',
              render: (val) => (
                <span
                  className="small text-truncate d-inline-block text-sa-charcoal"
                  style={{ maxWidth: '220px', fontSize: '0.80rem' }}
                  title={val}
                >
                  {val || '--'}
                </span>
              )
            },
            {
              key: 'status',
              title: 'Status',
              render: (val) => {
                const s = (val || 'Pending').toLowerCase();
                if (s === 'approved') {
                  return (
                    <span
                      className="badge d-inline-flex align-items-center gap-1 px-2.5 py-1 rounded-pill"
                      style={{
                        backgroundColor: '#DCFCE7',
                        color: '#15803D',
                        border: '1px solid #86EFAC',
                        fontWeight: '700',
                        fontSize: '0.74rem'
                      }}
                    >
                      <CheckCircle size={13} />
                      <span>Approved</span>
                    </span>
                  );
                }
                if (s === 'rejected') {
                  return (
                    <span
                      className="badge d-inline-flex align-items-center gap-1 px-2.5 py-1 rounded-pill"
                      style={{
                        backgroundColor: '#FFE4E6',
                        color: '#BE123C',
                        border: '1px solid #FDA4AF',
                        fontWeight: '700',
                        fontSize: '0.74rem'
                      }}
                    >
                      <XCircle size={13} />
                      <span>Rejected</span>
                    </span>
                  );
                }
                return (
                  <span
                    className="badge d-inline-flex align-items-center gap-1 px-2.5 py-1 rounded-pill"
                    style={{
                      backgroundColor: '#FEF3C7',
                      color: '#B45309',
                      border: '1px solid #FCD34D',
                      fontWeight: '700',
                      fontSize: '0.74rem'
                    }}
                  >
                    <Clock size={13} />
                    <span>Pending</span>
                  </span>
                );
              }
            },
            {
              key: 'admin_comment',
              title: 'Admin Remarks',
              render: (val) => (
                <span
                  className="small text-muted text-truncate d-inline-block"
                  style={{ maxWidth: '170px', fontSize: '0.76rem' }}
                  title={val || ''}
                >
                  {val || <span className="text-muted fst-italic">No remarks</span>}
                </span>
              )
            },
            {
              key: 'id',
              title: 'Action',
              align: 'end',
              render: (_, row) => {
                const s = (row.status || '').toLowerCase();
                if (s === 'pending') {
                  return (
                    <div className="d-flex align-items-center justify-content-end gap-1.5">
                      <button
                        type="button"
                        className="btn btn-sm btn-success d-inline-flex align-items-center gap-1 px-2.5 py-1 rounded-2 shadow-xs fw-bold"
                        style={{ fontSize: '0.76rem', backgroundColor: '#15803D', borderColor: '#15803D' }}
                        onClick={() => openApproveModal(row)}
                        title="Approve Leave Application"
                      >
                        <CheckCircle size={13} />
                        <span>Approve</span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1 px-2.5 py-1 rounded-2 shadow-xs fw-bold"
                        style={{ fontSize: '0.76rem' }}
                        onClick={() => openRejectModal(row)}
                        title="Reject Leave Application"
                      >
                        <XCircle size={13} />
                        <span>Reject</span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-light border p-1 rounded-2"
                        title="View Full Details"
                        onClick={() => openDetailsModal(row)}
                      >
                        <Info size={14} color="#64748B" />
                      </button>
                    </div>
                  );
                }
                return (
                  <div className="d-flex align-items-center justify-content-end gap-1.5">
                    <button
                      type="button"
                      className="btn btn-sm btn-light border d-inline-flex align-items-center gap-1 px-2 py-1 rounded-2 text-muted"
                      style={{ fontSize: '0.74rem' }}
                      onClick={() => openDetailsModal(row)}
                    >
                      <Info size={13} />
                      <span>Details</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary px-1.5 py-1 rounded-2 text-muted"
                      style={{ fontSize: '0.70rem' }}
                      onClick={() => {
                        if (s === 'approved') openRejectModal(row);
                        else openApproveModal(row);
                      }}
                      title="Reconsider Status"
                    >
                      Change
                    </button>
                  </div>
                );
              }
            }
          ]}
          data={filteredLeaves}
          loading={loading}
          emptyMessage={
            <div className="text-center py-5">
              <div
                className="rounded-circle d-inline-flex align-items-center justify-content-center mb-2"
                style={{ width: '48px', height: '48px', backgroundColor: '#F8FAFC', color: '#94A3B8' }}
              >
                <Calendar size={24} />
              </div>
              <h6 className="fw-bold text-sa-charcoal m-0">No leave requests found</h6>
              <p className="text-sa-muted small mt-1 mb-3">
                No leave applications match the selected campus ({selectedCampus}) and filters.
              </p>
              <button
                type="button"
                className="btn btn-sm btn-primary rounded-pill px-3 fw-bold"
                onClick={() => setCreateModalOpen(true)}
              >
                Apply Test Leave
              </button>
            </div>
          }
        />
      </div>

      {/* 1. APPROVAL MODAL */}
      <Modal
        isOpen={approvalModalOpen}
        onClose={() => setApprovalModalOpen(false)}
        title="Approve Faculty Leave"
        size="md"
        footer={
          <div className="d-flex justify-content-end gap-2 w-100">
            <button
              type="button"
              className="btn btn-sm btn-light border px-3"
              onClick={() => setApprovalModalOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-sm btn-success px-4 fw-bold d-flex align-items-center gap-1.5"
              style={{ backgroundColor: '#15803D', borderColor: '#15803D' }}
              onClick={handleConfirmApproval}
              disabled={actionLoading}
            >
              {actionLoading ? <span className="spinner-border spinner-border-sm" /> : <CheckCircle size={15} />}
              <span>Confirm Approval</span>
            </button>
          </div>
        }
      >
        {selectedLeave && (
          <div className="d-flex flex-column gap-3">
            <div className="p-3 rounded-3" style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
              <div className="d-flex align-items-center gap-2 mb-2">
                <CheckCircle2 size={18} color="#15803D" />
                <span className="fw-bold" style={{ color: '#166534', fontSize: '0.88rem' }}>
                  Confirming leave sanction for:
                </span>
              </div>
              <div className="fw-extrabold text-sa-charcoal fs-5">
                {selectedLeave.teacher_name}
              </div>
              <div className="d-flex flex-wrap gap-2 mt-2">
                <span className="badge bg-white text-dark border">
                  🏢 {selectedLeave.branch || selectedCampus}
                </span>
                <span className="badge bg-white text-dark border">
                  📋 {selectedLeave.leave_type}
                </span>
                <span className="badge bg-white text-dark border">
                  ⏳ {selectedLeave.number_of_days} Day(s)
                </span>
              </div>
            </div>

            <div className="small text-sa-muted">
              <strong>Reason for leave:</strong>
              <div className="p-2.5 rounded-2 bg-light border mt-1 text-sa-charcoal">
                "{selectedLeave.reason || 'No reason specified'}"
              </div>
            </div>

            <div>
              <label className="form-label small fw-semibold text-sa-charcoal mb-1">
                Admin Approval Remarks / Notes (Optional)
              </label>
              <input
                type="text"
                className="form-control form-control-sm"
                value={adminComment}
                onChange={(e) => setAdminComment(e.target.value)}
                placeholder="e.g. Approved for Mangalwar Peth; substitute arranged."
                style={{ fontSize: '0.84rem' }}
              />
              <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                This comment will be visible to the faculty member on their portal.
              </span>
            </div>
          </div>
        )}
      </Modal>

      {/* 2. REJECTION MODAL */}
      <Modal
        isOpen={rejectionModalOpen}
        onClose={() => setRejectionModalOpen(false)}
        title="Decline Faculty Leave Request"
        size="md"
        footer={
          <div className="d-flex justify-content-end gap-2 w-100">
            <button
              type="button"
              className="btn btn-sm btn-light border px-3"
              onClick={() => setRejectionModalOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-sm btn-danger px-4 fw-bold d-flex align-items-center gap-1.5"
              style={{ backgroundColor: '#BE123C', borderColor: '#BE123C' }}
              onClick={handleConfirmRejection}
              disabled={actionLoading}
            >
              {actionLoading ? <span className="spinner-border spinner-border-sm" /> : <XCircle size={15} />}
              <span>Confirm Rejection</span>
            </button>
          </div>
        }
      >
        {selectedLeave && (
          <div className="d-flex flex-column gap-3">
            <div className="p-3 rounded-3" style={{ backgroundColor: '#FFF1F2', border: '1px solid #FECDD3' }}>
              <div className="d-flex align-items-center gap-2 mb-2">
                <AlertCircle size={18} color="#BE123C" />
                <span className="fw-bold" style={{ color: '#9F1239', fontSize: '0.88rem' }}>
                  Decline leave application for:
                </span>
              </div>
              <div className="fw-extrabold text-sa-charcoal fs-5">
                {selectedLeave.teacher_name}
              </div>
              <div className="small text-muted mt-1">
                Leave Type: <strong>{selectedLeave.leave_type}</strong> | Campus: <strong>{selectedLeave.branch || selectedCampus}</strong>
              </div>
            </div>

            <div>
              <label className="form-label small fw-bold text-sa-charcoal mb-1">
                Reason for Rejection <span className="text-danger">*</span>
              </label>
              <textarea
                rows="3"
                className="form-control form-control-sm"
                value={adminComment}
                onChange={(e) => setAdminComment(e.target.value)}
                placeholder="State the reason for declining (e.g. Academic test scheduled, insufficient substitute coverage)..."
                required
                style={{ fontSize: '0.84rem' }}
              />
              <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                Required. The faculty member will receive this notification immediately.
              </span>
            </div>
          </div>
        )}
      </Modal>

      {/* 3. DETAILS MODAL */}
      <Modal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        title="Leave Request Details"
        size="md"
        footer={
          <div className="d-flex justify-content-end gap-2 w-100">
            <button
              type="button"
              className="btn btn-sm btn-secondary px-3"
              onClick={() => setDetailsModalOpen(false)}
            >
              Close
            </button>
          </div>
        }
      >
        {selectedLeave && (
          <div className="d-flex flex-column gap-3">
            <div className="d-flex align-items-center justify-content-between p-3 rounded-3 bg-light border">
              <div>
                <div className="fw-bold fs-6 text-sa-charcoal">{selectedLeave.teacher_name}</div>
                <div className="text-sa-muted small">Employee ID: {selectedLeave.teacher_id || 'FACULTY'}</div>
              </div>
              <span
                className="badge px-3 py-1.5 rounded-pill fw-bold"
                style={{
                  backgroundColor: (selectedLeave.status || '').toLowerCase() === 'approved' ? '#DCFCE7' : (selectedLeave.status || '').toLowerCase() === 'rejected' ? '#FFE4E6' : '#FEF3C7',
                  color: (selectedLeave.status || '').toLowerCase() === 'approved' ? '#15803D' : (selectedLeave.status || '').toLowerCase() === 'rejected' ? '#BE123C' : '#B45309',
                  border: '1px solid rgba(0,0,0,0.1)'
                }}
              >
                {selectedLeave.status}
              </span>
            </div>

            <div className="row g-2">
              <div className="col-6">
                <div className="p-2.5 rounded-2 border bg-white">
                  <span className="text-muted small d-block" style={{ fontSize: '0.72rem' }}>Campus / Branch</span>
                  <span className="fw-semibold text-sa-charcoal" style={{ fontSize: '0.84rem' }}>
                    {normalizeBranch(selectedLeave.branch) === CAMPUS.MANGALVAR_PETH ? '🏛️ Mangalwar Peth' : '🌲 Tarabai Park'}
                  </span>
                </div>
              </div>
              <div className="col-6">
                <div className="p-2.5 rounded-2 border bg-white">
                  <span className="text-muted small d-block" style={{ fontSize: '0.72rem' }}>Leave Type</span>
                  <span className="fw-semibold text-sa-charcoal" style={{ fontSize: '0.84rem' }}>
                    {selectedLeave.leave_type}
                  </span>
                </div>
              </div>
              <div className="col-6">
                <div className="p-2.5 rounded-2 border bg-white">
                  <span className="text-muted small d-block" style={{ fontSize: '0.72rem' }}>Date Range</span>
                  <span className="fw-semibold text-sa-charcoal" style={{ fontSize: '0.84rem' }}>
                    {new Date(selectedLeave.from_date).toLocaleDateString()} — {new Date(selectedLeave.to_date).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="col-6">
                <div className="p-2.5 rounded-2 border bg-white">
                  <span className="text-muted small d-block" style={{ fontSize: '0.72rem' }}>Duration</span>
                  <span className="fw-semibold text-sa-charcoal" style={{ fontSize: '0.84rem' }}>
                    {selectedLeave.number_of_days} Day(s)
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="small text-muted fw-semibold mb-1">Reason for Application</label>
              <div className="p-2.5 rounded-2 bg-light border text-sa-charcoal" style={{ fontSize: '0.84rem' }}>
                {selectedLeave.reason || 'No detailed reason provided.'}
              </div>
            </div>

            <div>
              <label className="small text-muted fw-semibold mb-1">Admin Remarks / Audit History</label>
              <div className="p-2.5 rounded-2 bg-light border text-sa-charcoal" style={{ fontSize: '0.84rem' }}>
                {selectedLeave.admin_comment || 'No admin notes recorded yet.'}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* 4. APPLY TEST LEAVE MODAL */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Submit Test Leave Application"
        size="md"
        footer={
          <div className="d-flex justify-content-end gap-2 w-100">
            <button
              type="button"
              className="btn btn-sm btn-light border px-3"
              onClick={() => setCreateModalOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-sm btn-primary px-4 fw-bold d-flex align-items-center gap-1.5"
              style={{ backgroundColor: '#8B1216', borderColor: '#8B1216' }}
              onClick={handleCreateTestLeave}
              disabled={actionLoading}
            >
              {actionLoading ? <span className="spinner-border spinner-border-sm" /> : <Send size={14} />}
              <span>Submit Application</span>
            </button>
          </div>
        }
      >
        <form onSubmit={handleCreateTestLeave} className="d-flex flex-column gap-3">
          <div>
            <label className="form-label small fw-bold text-sa-charcoal mb-1">
              Campus / Branch <span className="text-danger">*</span>
            </label>
            <div className="btn-group w-100 btn-group-sm" role="group">
              <button
                type="button"
                className={`btn ${newLeaveForm.branch === CAMPUS.MANGALVAR_PETH ? 'btn-danger text-white' : 'btn-outline-secondary'}`}
                style={{ backgroundColor: newLeaveForm.branch === CAMPUS.MANGALVAR_PETH ? '#8B1216' : undefined }}
                onClick={() => setNewLeaveForm({ ...newLeaveForm, branch: CAMPUS.MANGALVAR_PETH })}
              >
                🏛️ Mangalwar Peth (MP)
              </button>
              <button
                type="button"
                className={`btn ${newLeaveForm.branch === CAMPUS.TARABAI_PARK ? 'btn-danger text-white' : 'btn-outline-secondary'}`}
                style={{ backgroundColor: newLeaveForm.branch === CAMPUS.TARABAI_PARK ? '#8B1216' : undefined }}
                onClick={() => setNewLeaveForm({ ...newLeaveForm, branch: CAMPUS.TARABAI_PARK })}
              >
                🌲 Tarabai Park (TP)
              </button>
            </div>
          </div>

          <div>
            <label className="form-label small fw-bold text-sa-charcoal mb-1">Faculty Member</label>
            <select
              className="form-select form-select-sm"
              value={newLeaveForm.teacher_name}
              onChange={(e) => {
                const name = e.target.value;
                const idMap = {
                  'Dr. Priya Kulkarni': 'USR-TCH-01',
                  'Prof. Rajesh Sharma': 'USR-TCH-03',
                  'Prof. Sunita Patil': 'USR-TCH-02',
                  'Prof. Amit Sawant': 'USR-TCH-04'
                };
                setNewLeaveForm({
                  ...newLeaveForm,
                  teacher_name: name,
                  teacher_id: idMap[name] || 'USR-TCH-01'
                });
              }}
            >
              <option value="Dr. Priya Kulkarni">Dr. Priya Kulkarni (Physics)</option>
              <option value="Prof. Rajesh Sharma">Prof. Rajesh Sharma (Mathematics)</option>
              <option value="Prof. Sunita Patil">Prof. Sunita Patil (Chemistry)</option>
              <option value="Prof. Amit Sawant">Prof. Amit Sawant (Biology)</option>
            </select>
          </div>

          <div>
            <label className="form-label small fw-bold text-sa-charcoal mb-1">Leave Type</label>
            <select
              className="form-select form-select-sm"
              value={newLeaveForm.leave_type}
              onChange={(e) => setNewLeaveForm({ ...newLeaveForm, leave_type: e.target.value })}
            >
              <option value="Casual Leave">Casual Leave</option>
              <option value="Medical Leave">Medical Leave</option>
              <option value="Sick Leave">Sick Leave</option>
              <option value="Earned Leave">Earned Leave</option>
              <option value="Academic Leave">Academic Leave</option>
              <option value="Emergency Leave">Emergency Leave</option>
            </select>
          </div>

          <div className="row g-2">
            <div className="col-6">
              <label className="form-label small fw-bold text-sa-charcoal mb-1">From Date</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={newLeaveForm.from_date}
                onChange={(e) => setNewLeaveForm({ ...newLeaveForm, from_date: e.target.value })}
                required
              />
            </div>
            <div className="col-6">
              <label className="form-label small fw-bold text-sa-charcoal mb-1">To Date</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={newLeaveForm.to_date}
                onChange={(e) => setNewLeaveForm({ ...newLeaveForm, to_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="form-label small fw-bold text-sa-charcoal mb-1">Reason / Purpose</label>
            <textarea
              rows="2"
              className="form-control form-control-sm"
              value={newLeaveForm.reason}
              onChange={(e) => setNewLeaveForm({ ...newLeaveForm, reason: e.target.value })}
              placeholder="e.g. Attending workshop on new syllabus..."
              required
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
