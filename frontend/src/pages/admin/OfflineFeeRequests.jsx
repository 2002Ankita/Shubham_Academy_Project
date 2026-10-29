import React, { useState, useEffect } from 'react';
import BackButton from '../../components/common/BackButton';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import feeService from '../../services/feeService';
import teacherService from '../../services/teacherService';
import notificationService from '../../services/notificationService';
import { useAuth } from '../../hooks/useAuth';
import { getUserBranch, CAMPUS, isSuperAdminUser } from '../../utils/branchUtils';
import {
  Banknote,
  FileCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  Building2,
  FileText,
  AlertCircle,
  Eye,
  RefreshCw,
  Printer,
  UserCheck,
  User,
  ShieldCheck,
  Bell,
  Sparkles,
  Plus,
  Trash2
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const DEFAULT_FACULTY_LIST = [
  'Dr. Priya Kulkarni (Physics Faculty)',
  'Prof. Rajesh Sharma (Chemistry Faculty)',
  'Prof. Snehal Joshi (Mathematics Faculty)',
  'Dr. Amit Patil (Biology Faculty)',
  'Accounts & Front Desk Staff'
];

export default function OfflineFeeRequests() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isSuperAdmin = isSuperAdminUser(user);
  const userBranch = getUserBranch(user) || CAMPUS.TARABAI_PARK;

  const [selectedBranch, setSelectedBranch] = useState(userBranch);

  // Automatically keep selectedBranch in sync with logged-in admin's branch
  useEffect(() => {
    const branch = getUserBranch(user);
    if (branch && (!isSuperAdmin || !selectedBranch)) {
      setSelectedBranch(branch);
    }
  }, [user, isSuperAdmin]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modeFilter, setModeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('PENDING');

  // Faculty state
  const [facultyList, setFacultyList] = useState(DEFAULT_FACULTY_LIST);
  const [collectedByFaculty, setCollectedByFaculty] = useState('');
  const [customFacultyMode, setCustomFacultyMode] = useState(false);
  const [customFacultyName, setCustomFacultyName] = useState('');

  // Verify Modal
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [verifyRemarks, setVerifyRemarks] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Reject Modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Load registered faculty
  useEffect(() => {
    const loadFaculty = async () => {
      try {
        const teachers = await teacherService.getAll();
        const customSaved = JSON.parse(localStorage.getItem('sa_fee_custom_faculty_list') || '[]');
        const removedSaved = JSON.parse(localStorage.getItem('sa_fee_removed_faculty_list') || '[]');

        let teacherNames = [];
        if (Array.isArray(teachers) && teachers.length > 0) {
          teacherNames = teachers.map(t => `${t.name} (${t.subject || 'Faculty'})`);
        } else {
          teacherNames = DEFAULT_FACULTY_LIST;
        }

        const combined = Array.from(new Set([...teacherNames, ...customSaved, 'Accounts & Front Desk Staff']))
          .filter(name => !removedSaved.includes(name));

        if (combined.length > 0) {
          setFacultyList(combined);
          if (!collectedByFaculty) {
            setCollectedByFaculty(combined[0]);
          }
        }
      } catch (err) {
        console.warn('Using default faculty list for fee intake:', err);
      }
    };
    loadFaculty();
  }, []);

  const handleAddCustomFaculty = (nameToAdd) => {
    const trimmed = (nameToAdd || customFacultyName).trim();
    if (!trimmed) {
      toast.warning('Please enter a faculty name');
      return;
    }
    // Remove from removed list if present
    const removedSaved = JSON.parse(localStorage.getItem('sa_fee_removed_faculty_list') || '[]');
    const newRemoved = removedSaved.filter(n => n !== trimmed);
    localStorage.setItem('sa_fee_removed_faculty_list', JSON.stringify(newRemoved));

    // Save to custom saved list
    const customSaved = JSON.parse(localStorage.getItem('sa_fee_custom_faculty_list') || '[]');
    if (!customSaved.includes(trimmed)) {
      localStorage.setItem('sa_fee_custom_faculty_list', JSON.stringify([...customSaved, trimmed]));
    }
    setFacultyList(prev => Array.from(new Set([...prev, trimmed])));
    setCollectedByFaculty(trimmed);
    setCustomFacultyMode(false);
    setCustomFacultyName('');
    toast.success(`"${trimmed}" added to faculty dropdown!`);
  };

  const handleRemoveFaculty = (nameToRemove) => {
    if (!nameToRemove) return;
    if (facultyList.length <= 1) {
      toast.warning('At least one faculty or staff name must remain in the list.');
      return;
    }
    // Add to removed list
    const removedSaved = JSON.parse(localStorage.getItem('sa_fee_removed_faculty_list') || '[]');
    if (!removedSaved.includes(nameToRemove)) {
      localStorage.setItem('sa_fee_removed_faculty_list', JSON.stringify([...removedSaved, nameToRemove]));
    }
    // Remove from custom list if present
    const customSaved = JSON.parse(localStorage.getItem('sa_fee_custom_faculty_list') || '[]');
    const newCustom = customSaved.filter(n => n !== nameToRemove);
    localStorage.setItem('sa_fee_custom_faculty_list', JSON.stringify(newCustom));

    const updatedList = facultyList.filter(n => n !== nameToRemove);
    setFacultyList(updatedList);
    if (collectedByFaculty === nameToRemove) {
      setCollectedByFaculty(updatedList[0] || '');
    }
    toast.info(`"${nameToRemove}" removed from dropdown.`);
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await feeService.getOfflineFeeRequests({
        branch: selectedBranch,
        status: statusFilter
      });
      setRequests(data || []);
    } catch (err) {
      console.error('Failed to load offline fee requests:', err);
      toast.error('Failed to load offline fee requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    const handleUpdate = () => fetchRequests();
    window.addEventListener('sa_offline_fee_requests_updated', handleUpdate);
    return () => window.removeEventListener('sa_offline_fee_requests_updated', handleUpdate);
  }, [selectedBranch, statusFilter]);

  // Filters
  const filteredRequests = requests.filter((r) => {
    const matchesSearch =
      !searchQuery ||
      r.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.roll_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.cheque_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.collected_by_faculty?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.verified_by?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesMode =
      modeFilter === 'ALL' || r.payment_mode?.toUpperCase() === modeFilter.toUpperCase();

    return matchesSearch && matchesMode;
  });

  // KPI Calculations
  const pendingRequests = requests.filter((r) => r.status === 'PENDING');
  const pendingCashTotal = pendingRequests
    .filter((r) => r.payment_mode === 'Cash')
    .reduce((acc, r) => acc + (Number(r.amount) || 0), 0);
  const pendingChequeTotal = pendingRequests
    .filter((r) => r.payment_mode === 'Cheque')
    .reduce((acc, r) => acc + (Number(r.amount) || 0), 0);
  const approvedCount = requests.filter((r) => r.status === 'APPROVED').length;

  const openVerifyModal = (req) => {
    setSelectedRequest(req);
    setVerifyRemarks(`Verified and received at ${req.branch} accounts desk.`);
    const initialFaculty = req.collected_by_faculty || (facultyList.length > 0 ? facultyList[0] : 'Dr. Priya Kulkarni (Physics Faculty)');
    setCollectedByFaculty(initialFaculty);
    setCustomFacultyMode(false);
    setCustomFacultyName('');
    setVerifyModalOpen(true);
  };

  const handleConfirmVerify = async () => {
    if (!selectedRequest) return;
    setIsVerifying(true);
    const verifierName = user?.full_name || 'Academic Admin';
    const finalFaculty = customFacultyMode && customFacultyName.trim()
      ? customFacultyName.trim()
      : (collectedByFaculty || 'Faculty In-Charge');

    try {
      const updated = await feeService.verifyOfflineFeeRequest(selectedRequest.id, {
        remarks: verifyRemarks,
        verified_amount: selectedRequest.amount,
        collected_by_faculty: finalFaculty,
        verified_by: verifierName
      });

      // Dispatch automated notification to student
      try {
        notificationService.addNotification({
          id: `NTF-OFFLINE-VERIFIED-${selectedRequest.id}-${Date.now()}`,
          title: `✅ ${selectedRequest.payment_mode} Fee Payment Verified (Receipt #${updated.receipt_no})`,
          type: 'fee',
          category: 'Accounts & Fees',
          priority: 'High',
          branch: selectedRequest.branch,
          studentId: selectedRequest.student_id,
          studentName: selectedRequest.student_name,
          author: `${selectedRequest.branch} Accounts Counter`,
          details: `Your offline ${selectedRequest.payment_mode} fee payment of ₹${Number(selectedRequest.amount).toLocaleString()} has been verified & approved by ${verifierName}. Collected by Faculty: ${finalFaculty}. Official fee receipt #${updated.receipt_no} has been credited to your student ledger.`
        });
      } catch (notifErr) {
        console.warn('Student notification dispatch error:', notifErr);
      }

      toast.success(
        `Payment of ₹${Number(selectedRequest.amount).toLocaleString()} confirmed by ${verifierName}! Receipt #${updated.receipt_no} generated and student notified.`
      );
      setVerifyModalOpen(false);
      fetchRequests();
    } catch (err) {
      console.error('Verify error:', err);
      toast.error(err.response?.data?.detail || 'Failed to verify payment request.');
    } finally {
      setIsVerifying(false);
    }
  };

  const openRejectModal = (req) => {
    setSelectedRequest(req);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedRequest) return;
    if (!rejectReason.trim()) {
      toast.error('Please enter a rejection reason.');
      return;
    }
    setIsRejecting(true);
    try {
      await feeService.rejectOfflineFeeRequest(selectedRequest.id, rejectReason.trim());
      toast.info(`Request ${selectedRequest.id} marked as rejected.`);
      setRejectModalOpen(false);
      fetchRequests();
    } catch (err) {
      console.error('Reject error:', err);
      toast.error('Failed to reject request.');
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <div className="d-flex flex-column gap-4 pb-5">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
        <div>
          <BackButton to="/admin/fees" label="Back to Fee Collection" />
          <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
            Student Offline Fee Requests (Cash & Cheque)
          </h3>
          <span className="small text-sa-muted">
            Manage physical Cash and Cheque fee submissions sent by students branch-wise. Verify deposit to issue official receipts.
          </span>
        </div>

        {/* Branch Selector (Automated for Branch Admins) */}
        <div className="d-flex align-items-center gap-2">
          <div className="d-flex align-items-center gap-2 bg-white px-3 py-1.5 rounded-2 border shadow-xs">
            <Building2 size={16} className="text-danger" />
            <span className="small fw-semibold text-sa-muted">Branch:</span>
            {isSuperAdmin ? (
              <select
                className="form-select form-select-sm border-0 bg-transparent fw-bold text-sa-charcoal shadow-none py-0"
                style={{ width: 'auto', cursor: 'pointer' }}
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
              >
                <option value="Tarabai Park">Tarabai Park Campus</option>
                <option value="Mangalvar Peth">Mangalvar Peth Campus</option>
                <option value="ALL">All Campuses</option>
              </select>
            ) : (
              <span className="fw-semibold text-sa-charcoal" style={{ fontSize: '0.84rem' }}>
                {selectedBranch} Campus
              </span>
            )}
          </div>

          <Button variant="outline" icon={RefreshCw} onClick={fetchRequests} loading={loading}>
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="row g-3">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="sa-card p-3 border-start border-4 border-warning shadow-xs">
            <div className="d-flex align-items-center justify-content-between">
              <span className="text-sa-muted small fw-semibold">Pending Requests</span>
              <span className="badge bg-warning-subtle text-warning-emphasis">Requires Action</span>
            </div>
            <h4 className="fw-extrabold text-sa-charcoal m-0 mt-1">{pendingRequests.length}</h4>
            <span className="text-muted small">Awaiting physical deposit verification</span>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="sa-card p-3 border-start border-4 border-success shadow-xs">
            <span className="text-sa-muted small fw-semibold">Pending Cash Intake</span>
            <h4 className="fw-extrabold text-success m-0 mt-1">₹ {pendingCashTotal.toLocaleString()}</h4>
            <span className="text-muted small">At {selectedBranch} counter</span>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="sa-card p-3 border-start border-4 border-primary shadow-xs">
            <span className="text-sa-muted small fw-semibold">Pending Cheque Clearing</span>
            <h4 className="fw-extrabold text-primary m-0 mt-1">₹ {pendingChequeTotal.toLocaleString()}</h4>
            <span className="text-muted small">Bank clearing pending</span>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="sa-card p-3 border-start border-4 border-info shadow-xs">
            <span className="text-sa-muted small fw-semibold">Verified & Reconciled</span>
            <h4 className="fw-extrabold text-info m-0 mt-1">{approvedCount}</h4>
            <span className="text-muted small">Receipts issued & posted to ledger</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="sa-card p-3 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 shadow-xs">
        <div className="position-relative flex-grow-1" style={{ maxWidth: '420px' }}>
          <Search size={16} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
          <input
            type="text"
            className="form-control ps-5 border-sa-ash shadow-none"
            placeholder="Search student, roll number, cheque #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          {/* Mode Filter */}
          <div className="d-flex align-items-center gap-1.5">
            <span className="small text-muted fw-semibold">Mode:</span>
            <select
              className="form-select form-select-sm border-sa-ash shadow-none"
              style={{ width: '130px' }}
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
            >
              <option value="ALL">All Modes</option>
              <option value="Cash">Cash Only</option>
              <option value="Cheque">Cheque Only</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="d-flex align-items-center gap-1.5">
            <span className="small text-muted fw-semibold">Status:</span>
            <select
              className="form-select form-select-sm border-sa-ash shadow-none"
              style={{ width: '150px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending (Action)</option>
              <option value="APPROVED">Approved (Verified)</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="sa-card p-4 border shadow-sm">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className="d-flex align-items-center gap-2">
            <FileCheck size={18} className="text-danger" />
            <h5 className="brand-font fw-bold text-sa-charcoal m-0 fs-6">
              Offline Payment Verification Queue ({filteredRequests.length})
            </h5>
          </div>
          <span className="badge bg-light text-sa-charcoal border px-2.5 py-1 small">
            📍 Branch: {selectedBranch}
          </span>
        </div>

        <Table
          columns={[
            {
              key: 'id',
              title: 'Request ID',
              render: (val, row) => (
                <div>
                  <span className="fw-bold text-danger d-block">{val}</span>
                  <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                    {row.created_at ? new Date(row.created_at).toLocaleDateString('en-GB') : 'Recent'}
                  </span>
                </div>
              )
            },
            {
              key: 'student_name',
              title: 'Student Details',
              render: (val, row) => (
                <div>
                  <span className="fw-bold text-sa-charcoal d-block">{val}</span>
                  <span className="text-muted small">
                    Roll: <strong>{row.roll_number || 'N/A'}</strong> | {row.batch || row.standard || 'Course'}
                  </span>
                </div>
              )
            },
            {
              key: 'branch',
              title: 'Branch Desk',
              render: (val) => (
                <span className="badge bg-light text-sa-charcoal border small">
                  📍 {val}
                </span>
              )
            },
            {
              key: 'payment_mode',
              title: 'Mode',
              render: (val) => (
                <span
                  className={`badge d-inline-flex align-items-center gap-1 px-2.5 py-1 ${
                    val === 'Cash'
                      ? 'bg-success-subtle text-success border border-success-subtle'
                      : 'bg-primary-subtle text-primary border border-primary-subtle'
                  }`}
                >
                  {val === 'Cash' ? <Banknote size={13} /> : <FileText size={13} />}
                  <span>{val}</span>
                </span>
              )
            },
            {
              key: 'amount',
              title: 'Amount (₹)',
              render: (val) => (
                <span className="fw-extrabold text-sa-charcoal">
                  ₹ {Number(val || 0).toLocaleString()}
                </span>
              )
            },
            {
              key: 'details',
              title: 'Instrument / Depositor Details',
              render: (_, row) => {
                if (row.payment_mode === 'Cheque') {
                  return (
                    <div className="small">
                      <span className="d-block text-sa-charcoal fw-semibold">
                        Cheque #{row.cheque_number || 'N/A'}
                      </span>
                      <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                        {row.bank_name || 'Bank'} | Date: {row.cheque_date || '--'}
                      </span>
                    </div>
                  );
                }
                return (
                  <div className="small">
                    <span className="d-block text-sa-charcoal fw-semibold">
                      Depositor: {row.depositor_name || row.student_name}
                    </span>
                    <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                      {row.notes || 'Cash deposit at counter'}
                    </span>
                  </div>
                );
              }
            },
            {
              key: 'collected_by_faculty',
              title: 'Collected By (Faculty)',
              render: (val, row) => {
                if (val) {
                  return (
                    <div className="d-flex align-items-center gap-1.5">
                      <div className="p-1 rounded-circle bg-primary-subtle text-primary flex-shrink-0">
                        <UserCheck size={14} />
                      </div>
                      <div>
                        <span className="fw-bold text-sa-charcoal d-block small" style={{ fontSize: '0.82rem' }}>{val}</span>
                        <span className="text-muted" style={{ fontSize: '0.70rem' }}>Fee Intake Faculty</span>
                      </div>
                    </div>
                  );
                }
                return (
                  <span className="badge bg-light text-muted border small">
                    Pending Assignment
                  </span>
                );
              }
            },
            {
              key: 'status',
              title: 'Status & Admin Approval',
              render: (val, row) => {
                if (val === 'APPROVED') {
                  return (
                    <div>
                      <span className="badge bg-success-subtle text-success border border-success-subtle px-2.5 py-1 d-inline-flex align-items-center gap-1 mb-1">
                        <CheckCircle2 size={13} /> Approved (#{row.receipt_no || 'Receipted'})
                      </span>
                      <div className="text-muted" style={{ fontSize: '0.74rem' }}>
                        Approved by: <strong className="text-dark">{row.verified_by || 'Academic Admin'}</strong>
                      </div>
                      {row.verified_at && (
                        <div className="text-muted" style={{ fontSize: '0.70rem' }}>
                          {new Date(row.verified_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </div>
                  );
                }
                if (val === 'REJECTED') {
                  return (
                    <div>
                      <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2.5 py-1 d-inline-flex align-items-center gap-1 mb-1">
                        <XCircle size={13} /> Rejected
                      </span>
                      <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                        {row.admin_remarks || 'Declined by admin'}
                      </div>
                    </div>
                  );
                }
                return (
                  <div>
                    <span className="badge bg-warning-subtle text-warning-emphasis border border-warning px-2.5 py-1 d-inline-flex align-items-center gap-1">
                      <Clock size={13} /> Pending Verification
                    </span>
                    <span className="text-muted d-block mt-0.5" style={{ fontSize: '0.72rem' }}>
                      Awaiting Admin confirmation
                    </span>
                  </div>
                );
              }
            },
            {
              key: 'actions',
              title: 'Verification Actions',
              align: 'right',
              render: (_, row) => {
                if (row.status === 'PENDING') {
                  return (
                    <div className="d-flex align-items-center justify-content-end gap-1.5">
                      <button
                        type="button"
                        className="btn btn-sm btn-success d-inline-flex align-items-center gap-1 px-2.5 py-1 rounded-2 shadow-xs fw-semibold"
                        onClick={() => openVerifyModal(row)}
                        title="Verify Deposit & Issue Receipt"
                      >
                        <CheckCircle2 size={13} />
                        <span>Verify & Issue</span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1 px-2 py-1 rounded-2"
                        onClick={() => openRejectModal(row)}
                        title="Reject Request"
                      >
                        <XCircle size={13} />
                      </button>
                    </div>
                  );
                }
                if (row.status === 'APPROVED' && row.receipt_no) {
                  return (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1 px-2.5 py-1 rounded-2"
                      onClick={() => navigate(`/admin/fees/receipt?receiptNo=${row.receipt_no}`)}
                    >
                      <Eye size={13} />
                      <span>View Receipt</span>
                    </button>
                  );
                }
                return <span className="text-muted small">No action needed</span>;
              }
            }
          ]}
          data={filteredRequests}
          loading={loading}
          emptyMessage="No offline fee requests found matching filters."
        />
      </div>

      {/* Verification Modal */}
      <Modal
        isOpen={verifyModalOpen}
        onClose={() => setVerifyModalOpen(false)}
        title="Verify & Issue Official Fee Receipt"
        size="md"
      >
        {selectedRequest && (
          <div className="d-flex flex-column gap-3">
            {/* Student & Deposit Summary Card */}
            <div className="p-3 bg-light rounded-2 border">
              <div className="d-flex justify-content-between mb-1.5">
                <span className="text-muted small">Student Name:</span>
                <span className="fw-bold">{selectedRequest.student_name}</span>
              </div>
              <div className="d-flex justify-content-between mb-1.5">
                <span className="text-muted small">Roll Number:</span>
                <span className="fw-semibold text-danger">{selectedRequest.roll_number}</span>
              </div>
              <div className="d-flex justify-content-between mb-1.5">
                <span className="text-muted small">Campus Branch:</span>
                <span className="fw-bold">📍 {selectedRequest.branch}</span>
              </div>
              <div className="d-flex justify-content-between mb-1.5">
                <span className="text-muted small">Payment Mode:</span>
                <span className="badge bg-secondary text-white">{selectedRequest.payment_mode}</span>
              </div>
              {selectedRequest.payment_mode === 'Cheque' && (
                <>
                  <div className="d-flex justify-content-between mb-1.5">
                    <span className="text-muted small">Cheque Number:</span>
                    <span className="fw-bold">{selectedRequest.cheque_number}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-1.5">
                    <span className="text-muted small">Bank Name:</span>
                    <span>{selectedRequest.bank_name}</span>
                  </div>
                </>
              )}
              <div className="d-flex justify-content-between pt-2 border-top">
                <span className="fw-bold text-sa-charcoal">Amount to Record:</span>
                <span className="fw-extrabold text-success fs-5">
                  ₹ {Number(selectedRequest.amount).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Approver & Faculty Info */}
            <div className="row g-2">
              <div className="col-12 col-sm-6">
                <div className="p-2.5 bg-white rounded-2 border">
                  <span className="text-muted small d-block mb-1">Verifying Approver (Admin):</span>
                  <div className="d-flex align-items-center gap-1.5">
                    <ShieldCheck size={16} className="text-danger" />
                    <strong className="text-sa-charcoal small">{user?.full_name || 'Academic Admin'}</strong>
                  </div>
                </div>
              </div>

              <div className="col-12 col-sm-6">
                <div className="p-2.5 bg-white rounded-2 border">
                  <span className="text-muted small d-block mb-1">Branch Desk:</span>
                  <div className="d-flex align-items-center gap-1.5">
                    <Building2 size={16} className="text-primary" />
                    <strong className="text-sa-charcoal small">{selectedRequest.branch} Campus</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Faculty Intake Field (Who received the cash / cheque) */}
            <div>
              <div className="d-flex align-items-center justify-content-between mb-1">
                <label className="form-label text-sa-charcoal fw-semibold mb-0" style={{ fontSize: '0.85rem' }}>
                  Collected By Faculty *
                </label>
                <button
                  type="button"
                  className="btn btn-link p-0 text-decoration-none small text-danger fw-semibold"
                  onClick={() => setCustomFacultyMode(!customFacultyMode)}
                  style={{ fontSize: '0.78rem' }}
                >
                  {customFacultyMode ? '← Pick from Dropdown' : '+ Add / Enter Custom Faculty'}
                </button>
              </div>

              {customFacultyMode ? (
                <div className="d-flex flex-column gap-2">
                  <div className="d-flex gap-2">
                    <input
                      type="text"
                      className="form-control border-sa-ash shadow-none"
                      placeholder="Enter faculty name (e.g. Prof. Rajesh Sharma)"
                      value={customFacultyName}
                      onChange={(e) => setCustomFacultyName(e.target.value)}
                      autoFocus
                    />
                    <button
                      type="button"
                      className="btn btn-sm btn-primary text-nowrap d-flex align-items-center gap-1 px-2.5"
                      onClick={() => handleAddCustomFaculty()}
                      disabled={!customFacultyName.trim()}
                      title="Save this faculty permanently to dropdown list"
                    >
                      <Plus size={15} /> Save to Dropdown
                    </button>
                  </div>
                  <span className="text-muted" style={{ fontSize: '0.74rem' }}>
                    Type a name and click <strong>Save to Dropdown</strong> to permanently keep it in the list, or proceed to use it for this receipt only.
                  </span>
                </div>
              ) : (
                <div className="d-flex align-items-center gap-2">
                  <select
                    className="form-select border-sa-ash shadow-none flex-grow-1"
                    value={collectedByFaculty}
                    onChange={(e) => setCollectedByFaculty(e.target.value)}
                  >
                    {facultyList.map((fName, idx) => (
                      <option key={idx} value={fName}>
                        {fName}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger border d-flex align-items-center justify-content-center p-0 flex-shrink-0"
                    style={{ width: '38px', height: '38px' }}
                    onClick={() => handleRemoveFaculty(collectedByFaculty)}
                    title="Remove selected faculty from dropdown"
                    disabled={facultyList.length <= 1}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
              <span className="text-muted small mt-1 d-block" style={{ fontSize: '0.75rem' }}>
                This faculty name will be officially recorded on the fee ledger and student receipt.
              </span>
            </div>

            {/* Admin Verification Remarks */}
            <div>
              <label className="form-label text-sa-charcoal fw-semibold mb-1" style={{ fontSize: '0.85rem' }}>
                Admin Verification Remarks
              </label>
              <input
                type="text"
                className="form-control border-sa-ash shadow-none"
                value={verifyRemarks}
                onChange={(e) => setVerifyRemarks(e.target.value)}
                placeholder="e.g. Cash received at counter / Cheque cleared"
              />
            </div>

            {/* Notification Alert Info */}
            <div className="p-2.5 rounded-2 bg-success-subtle border border-success-subtle text-success small d-flex align-items-start gap-2">
              <Bell size={18} className="flex-shrink-0 mt-0.5" />
              <div>
                <strong>Automated Student Notification:</strong>
                <p className="m-0 mt-0.5" style={{ fontSize: '0.78rem' }}>
                  Upon confirmation, <strong>{selectedRequest.student_name}</strong> will receive an instant in-app notification confirming their {selectedRequest.payment_mode} deposit was approved by <strong>{user?.full_name || 'Academic Admin'}</strong> and collected by <strong>{customFacultyMode && customFacultyName ? customFacultyName : (collectedByFaculty || 'Faculty In-Charge')}</strong>.
                </p>
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2 pt-3 border-top">
              <Button variant="outline" onClick={() => setVerifyModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmVerify}
                loading={isVerifying}
                icon={CheckCircle2}
              >
                Confirm & Issue Receipt
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Offline Fee Request"
        size="sm"
      >
        {selectedRequest && (
          <div className="d-flex flex-column gap-3">
            <span className="text-muted small">
              Are you sure you want to reject request <strong>#{selectedRequest.id}</strong> for{' '}
              <strong>{selectedRequest.student_name}</strong>?
            </span>

            <div>
              <label className="form-label text-sa-charcoal fw-semibold mb-1 small">
                Reason for Rejection *
              </label>
              <textarea
                className="form-control border-sa-ash shadow-none"
                rows={3}
                placeholder="e.g. Cash not deposited at counter / Cheque signature mismatch"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>

            <div className="d-flex justify-content-end gap-2 pt-3 border-top">
              <Button variant="outline" onClick={() => setRejectModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                className="btn-danger"
                onClick={handleConfirmReject}
                loading={isRejecting}
              >
                Reject Request
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
