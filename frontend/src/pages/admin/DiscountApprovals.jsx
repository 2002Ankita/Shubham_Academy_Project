import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Search,
  Percent,
  IndianRupee,
  User,
  Users,
  GraduationCap,
  Calendar,
  RefreshCw,
  Plus,
  ArrowRight,
  Filter,
  FileText,
  BadgePercent,
  Edit3,
  UserPlus,
  ChevronRight
} from 'lucide-react';
import { toast } from 'react-toastify';
import studentService from '../../services/studentService';
import notificationService from '../../services/notificationService';
import { useAuth } from '../../hooks/useAuth';

export default function DiscountApprovals() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const roleNormalized = (user?.role || '').toLowerCase().replace('-', '_');
  const isSuperAdmin = roleNormalized === 'super_admin' || roleNormalized.includes('super') || window.location.pathname.startsWith('/super-admin');
  const currentStaffName = user?.full_name || user?.name || (isSuperAdmin ? 'Superadmin Desk' : 'Admission Admin');

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Search and Filter States (supports ?status=PENDING)
  const initialStatus = (searchParams.get('status') || 'ALL').toUpperCase();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(
    ['ALL', 'PENDING', 'APPROVED', 'REJECTED'].includes(initialStatus) ? initialStatus : 'ALL'
  );
  const [standardFilter, setStandardFilter] = useState('ALL');

  // Modals
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedStudentForReject, setSelectedStudentForReject] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('Discount criteria not met');

  // Edit Concession Modal (Super Admin feature to adjust amount before accepting)
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedStudentForEdit, setSelectedStudentForEdit] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [editPercentage, setEditPercentage] = useState('');

  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [selectedStudentForOffer, setSelectedStudentForOffer] = useState(null);
  const [offerForm, setOfferForm] = useState({
    discountAmount: '',
    discountReason: 'Merit Scholarship',
    notes: ''
  });

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const data = await studentService.getAll();
      setStudents(data || []);
      try {
        notificationService.pruneFinalizedDiscounts(data || []);
        const pending = (data || []).filter(s => s.discountStatus === 'PENDING' && Number(s.discountAmount) > 0);
        notificationService.syncDiscountApprovals(pending);
      } catch (syncErr) {
        console.warn('Sync notification error:', syncErr);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load student discount records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Sync statusFilter if URL search params change
  useEffect(() => {
    const s = (searchParams.get('status') || '').toUpperCase();
    if (['ALL', 'PENDING', 'APPROVED', 'REJECTED'].includes(s)) {
      setStatusFilter(s);
    }
  }, [searchParams]);

  // Filter students who have a discount record or amount
  const discountStudents = useMemo(() => {
    return students.filter((s) => {
      const hasAmount = Number(s.discountAmount) > 0 || Number(s.discountRequestedAmount) > 0;
      const hasStatus = s.discountStatus && s.discountStatus !== 'NONE';
      return hasAmount || hasStatus;
    });
  }, [students]);

  // Derived KPI metrics
  const totalCount = discountStudents.length;
  const pendingList = useMemo(() => discountStudents.filter(s => s.discountStatus === 'PENDING'), [discountStudents]);
  const approvedList = useMemo(() => discountStudents.filter(s => s.discountStatus === 'APPROVED'), [discountStudents]);
  const rejectedList = useMemo(() => discountStudents.filter(s => s.discountStatus === 'REJECTED'), [discountStudents]);

  const totalDiscountGranted = useMemo(() => {
    return approvedList.reduce((acc, s) => acc + (Number(s.discountAmount) || 0), 0);
  }, [approvedList]);

  const totalPendingAmount = useMemo(() => {
    return pendingList.reduce((acc, s) => acc + (Number(s.discountRequestedAmount || s.discountAmount) || 0), 0);
  }, [pendingList]);

  // Unique Standards for filter dropdown
  const availableStandards = useMemo(() => {
    const list = Array.from(new Set(discountStudents.map(s => s.standard).filter(Boolean)));
    return list.sort();
  }, [discountStudents]);

  // Filtered dataset for table
  const filteredData = useMemo(() => {
    return discountStudents.filter((s) => {
      // Status filter
      if (statusFilter !== 'ALL' && s.discountStatus !== statusFilter) {
        return false;
      }
      // Standard filter
      if (standardFilter !== 'ALL' && s.standard !== standardFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = (s.name || '').toLowerCase();
        const roll = (s.rollNumber || s.student_id || '').toLowerCase();
        const reason = (s.discountReason || '').toLowerCase();
        const offeredBy = (s.discountRecommendedBy || s.discountOfferedBy || '').toLowerCase();
        const approvedBy = (s.discountApprovedBy || '').toLowerCase();
        const matches = name.includes(q) || roll.includes(q) || reason.includes(q) || offeredBy.includes(q) || approvedBy.includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [discountStudents, statusFilter, standardFilter, searchQuery]);

  // Handle Approve Discount (Super Admin only) with Optimistic Update
  const handleApprove = async (student) => {
    if (!isSuperAdmin) {
      toast.warning('Final approval must be given by the Super Admin.');
      return;
    }
    const origReq = Number(student.discountRequestedAmount || student.discountAmount || 0);
    if (!window.confirm(`Are you sure you want to approve the discount concession of ₹${origReq.toLocaleString()} for ${student.name} as Super Admin?`)) {
      return;
    }

    setActionLoading(true);
    // Optimistic state update
    const origFee = Number(student.originalFees || student.totalFees || 0);
    setStudents(prev => prev.map(s => s.id === student.id ? {
      ...s,
      discountStatus: 'APPROVED',
      discountAmount: origReq,
      totalFees: Math.max(0, origFee - origReq),
      discountApprovedBy: user?.full_name || 'Shubham Sharma (Superadmin)',
      discountApprovedAt: new Date().toISOString()
    } : s));

    try {
      await studentService.approveDiscount(student.id);
      try {
        notificationService.notifyDiscountDecision({
          studentId: student.id,
          studentName: student.name,
          originalRequested: origReq,
          approvedAmount: origReq,
          isApproved: true,
          approverName: user?.full_name || 'Shubham Sharma (Superadmin)'
        });
      } catch (notifErr) {
        console.warn('Notification sync error:', notifErr);
      }
      toast.success(`Discount for "${student.name}" approved successfully! Admin notified.`);
      await fetchStudents();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || err.message || 'Failed to approve discount');
      await fetchStudents();
    } finally {
      setActionLoading(false);
    }
  };

  // Open Edit Concession Modal before accepting
  const handleOpenEdit = (student) => {
    if (!isSuperAdmin) {
      toast.warning('Final approval decisions must be given by the Super Admin.');
      return;
    }
    const origFees = Number(student.originalFees || student.totalFees || 0);
    const currentDisc = Number(student.discountRequestedAmount || student.discountAmount || 0);
    const pct = origFees > 0 ? Math.round((currentDisc / origFees) * 100) : 0;
    setSelectedStudentForEdit(student);
    setEditAmount(currentDisc);
    setEditPercentage(pct);
    setEditModalOpen(true);
  };

  const handleEditAmountChange = (val) => {
    const num = Number(val) || 0;
    setEditAmount(val);
    const origFees = Number(selectedStudentForEdit?.originalFees || selectedStudentForEdit?.totalFees || 1);
    setEditPercentage(Math.round((num / origFees) * 100));
  };

  const handleEditPercentageChange = (val) => {
    const pct = Number(val) || 0;
    setEditPercentage(val);
    const origFees = Number(selectedStudentForEdit?.originalFees || selectedStudentForEdit?.totalFees || 0);
    setEditAmount(Math.round((origFees * pct) / 100));
  };

  const handleConfirmEditApprove = async () => {
    if (!selectedStudentForEdit) return;
    const finalAmount = Number(editAmount) || 0;
    const origReq = Number(selectedStudentForEdit.discountRequestedAmount || selectedStudentForEdit.discountAmount || 0);
    const origFee = Number(selectedStudentForEdit.originalFees || selectedStudentForEdit.totalFees || 0);

    setActionLoading(true);
    // Optimistic update
    setStudents(prev => prev.map(s => s.id === selectedStudentForEdit.id ? {
      ...s,
      discountStatus: 'APPROVED',
      discountAmount: finalAmount,
      totalFees: Math.max(0, origFee - finalAmount),
      discountApprovedBy: user?.full_name || 'Shubham Sharma (Superadmin)',
      discountApprovedAt: new Date().toISOString()
    } : s));

    try {
      await studentService.approveDiscount(selectedStudentForEdit.id, { discount_amount: finalAmount });
      setEditModalOpen(false);
      const studentName = selectedStudentForEdit.name;
      setSelectedStudentForEdit(null);
      try {
        notificationService.notifyDiscountDecision({
          studentId: selectedStudentForEdit.id,
          studentName: studentName,
          originalRequested: origReq,
          approvedAmount: finalAmount,
          isApproved: true,
          approverName: user?.full_name || 'Shubham Sharma (Superadmin)'
        });
      } catch (notifErr) {
        console.warn('Notification sync error:', notifErr);
      }
      toast.success(`Adjusted concession of ₹${finalAmount.toLocaleString()} approved for ${studentName}! Admin notified.`);
      await fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.detail || err.message || 'Failed to approve adjusted discount');
      await fetchStudents();
    } finally {
      setActionLoading(false);
    }
  };

  // Open Reject Modal
  const handleOpenReject = (student) => {
    if (!isSuperAdmin) {
      toast.warning('Final approval decisions must be given by the Super Admin.');
      return;
    }
    setSelectedStudentForReject(student);
    setRejectionReason('Discount criteria not met');
    setRejectModalOpen(true);
  };

  // Submit Rejection (Super Admin only) with Optimistic Update
  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!selectedStudentForReject) return;
    const origReq = Number(selectedStudentForReject.discountRequestedAmount || selectedStudentForReject.discountAmount || 0);
    const origFee = Number(selectedStudentForReject.originalFees || selectedStudentForReject.totalFees || 0);

    setActionLoading(true);
    // Optimistic update
    setStudents(prev => prev.map(s => s.id === selectedStudentForReject.id ? {
      ...s,
      discountStatus: 'REJECTED',
      totalFees: origFee,
      discountRejectionReason: rejectionReason
    } : s));

    try {
      await studentService.rejectDiscount(selectedStudentForReject.id, rejectionReason);
      setRejectModalOpen(false);
      const studentName = selectedStudentForReject.name;
      const targetId = selectedStudentForReject.id;
      setSelectedStudentForReject(null);
      try {
        notificationService.notifyDiscountDecision({
          studentId: targetId,
          studentName: studentName,
          originalRequested: origReq,
          approvedAmount: 0,
          isApproved: false,
          rejectionReason: rejectionReason,
          approverName: user?.full_name || 'Shubham Sharma (Superadmin)'
        });
      } catch (notifErr) {
        console.warn('Notification sync error:', notifErr);
      }
      toast.info(`Discount request for "${studentName}" was declined. Full fee ₹${origFee.toLocaleString()} restored.`);
      await fetchStudents();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || err.message || 'Failed to reject discount');
      await fetchStudents();
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Offer Discount for an existing student
  const handleConfirmOffer = async (e) => {
    e.preventDefault();
    if (!selectedStudentForOffer) return;

    const amt = Number(offerForm.discountAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error('Please enter a valid positive discount amount');
      return;
    }

    setActionLoading(true);
    try {
      await studentService.offerDiscount(selectedStudentForOffer.id, {
        discountAmount: amt,
        discountReason: offerForm.discountReason,
        discountRecommendedBy: currentStaffName,
        notes: offerForm.notes
      });
      toast.success(`Discount concession offered for "${selectedStudentForOffer.name}". Sent for Super Admin approval.`);
      setOfferModalOpen(false);
      setSelectedStudentForOffer(null);
      setOfferForm({ discountAmount: '', discountReason: 'Merit Scholarship', notes: '' });
      await fetchStudents();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to offer discount');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="d-flex flex-column gap-3.5 w-100 pb-4">
      {/* 1. Header & Primary Action Buttons */}
      <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 pt-1">
        <div>
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <h2 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4" style={{ letterSpacing: '-0.2px' }}>
              Student Discount Approvals & Fee Decisions
            </h2>
            <span
              className="badge px-2.5 py-1 rounded-pill fw-bold"
              style={{
                backgroundColor: isSuperAdmin ? '#FEF2F2' : '#EFF6FF',
                color: isSuperAdmin ? '#991B1B' : '#1D4ED8',
                border: isSuperAdmin ? '1px solid #FECACA' : '1px solid #BFDBFE',
                fontSize: '0.72rem'
              }}
            >
              {isSuperAdmin ? 'Super Admin Approval Console' : 'Admission Concession Tracker'}
            </span>
            {pendingList.length > 0 && (
              <span className="badge bg-warning text-dark px-2.5 py-1 rounded-pill fw-bold" style={{ fontSize: '0.72rem' }}>
                {pendingList.length} Pending Super Admin
              </span>
            )}
          </div>
          <span className="small text-sa-muted mt-1 d-block" style={{ fontSize: '13px' }}>
            Whenever a discount is offered to a student, the system permanently records who approved it. Final approval is authorized by the Super Admin.
          </span>
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => navigate('/admin/students/register')}
            className="btn btn-sm d-inline-flex align-items-center gap-1.5 px-3 py-1.5 fw-semibold text-white shadow-xs"
            style={{ backgroundColor: '#8B1216', borderRadius: '8px', fontSize: '13px', height: '36px' }}
          >
            <UserPlus size={15} />
            <span>Onboard Student & Decide Fees</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/students')}
            className="btn btn-sm btn-light border d-inline-flex align-items-center gap-1.5 px-3 py-1.5 text-secondary fw-semibold shadow-xs"
            style={{ borderRadius: '8px', fontSize: '13px', height: '36px' }}
          >
            <span>Student Directory</span>
          </button>
          <button
            type="button"
            onClick={fetchStudents}
            className="btn btn-sm btn-outline-secondary bg-white d-inline-flex align-items-center gap-1.5 px-3 py-1.5 fw-semibold shadow-xs"
            style={{ borderRadius: '8px', fontSize: '13px', height: '36px' }}
            title="Refresh student records"
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>

          {/* User Requested Button: Display all pending discounts */}
          <button
            type="button"
            onClick={() => {
              setStatusFilter('PENDING');
              setSearchParams({ status: 'PENDING' });
              const el = document.getElementById('discount-approvals-table');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="btn btn-sm btn-warning text-dark fw-bold d-inline-flex align-items-center gap-1.5 px-3.5 py-1.5 shadow-xs"
            style={{ borderRadius: '8px', fontSize: '13px', height: '36px' }}
            title="Display all student discount concessions awaiting Super Admin decision"
          >
            <Clock size={15} />
            <span>Display All Pending Discounts ({pendingList.length})</span>
          </button>
        </div>
      </div>

      {/* Executive Decision Card: Student Fee Concession Decisions (matching reference screenshot) */}
      <div className="sa-card bg-white rounded-3 border shadow-sm overflow-hidden mb-1" style={{ borderColor: '#E2E8F0' }}>
        {/* Card Header */}
        <div
          className="p-3.5 px-4 d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3"
          style={{
            background: 'linear-gradient(135deg, rgba(139, 18, 22, 0.04) 0%, rgba(254, 242, 242, 0.5) 100%)',
            borderBottom: '1px solid #F1F5F9'
          }}
        >
          <div className="d-flex align-items-center gap-3">
            <div
              className="rounded-3 d-flex align-items-center justify-content-center text-white flex-shrink-0 shadow-xs"
              style={{ width: '42px', height: '42px', backgroundColor: '#8B1216' }}
            >
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <h4 className="fw-bold brand-font text-sa-charcoal m-0" style={{ fontSize: '1.08rem' }}>
                  Student Fee Concession Decisions
                </h4>
                {pendingList.length > 0 ? (
                  <span
                    className="badge rounded-pill fw-bold px-2.5 py-1"
                    style={{ backgroundColor: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A', fontSize: '0.72rem' }}
                  >
                    {pendingList.length} Awaiting Your Sign-Off
                  </span>
                ) : (
                  <span
                    className="badge rounded-pill fw-semibold px-2.5 py-1"
                    style={{ backgroundColor: '#DEF7EC', color: '#03543F', border: '1px solid #BCF0DA', fontSize: '0.72rem' }}
                  >
                    ✓ All Concessions Finalized
                  </span>
                )}
                <span className="badge bg-light text-secondary border px-2 py-0.5 rounded-pill small" style={{ fontSize: '0.70rem' }}>
                  Central Super Admin Authority
                </span>
              </div>
              <span className="text-muted small d-block mt-0.5" style={{ fontSize: '0.79rem' }}>
                Concessions offered by Admission Admins during student onboarding are held as pending. You can Accept, Edit, or Decline before fees are finalized.
              </span>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setStatusFilter('PENDING');
                setSearchParams({ status: 'PENDING' });
                const el = document.getElementById('discount-approvals-table');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="btn btn-sm btn-warning text-dark fw-bold px-3 py-1.5 d-inline-flex align-items-center gap-1.5 rounded-2 shadow-xs"
              style={{ fontSize: '0.78rem' }}
              title="Display all pending discounts on the approval console"
            >
              <Clock size={13} />
              <span>Display All Pending Discounts ({pendingList.length})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('ALL');
                setSearchParams({});
                const el = document.getElementById('discount-approvals-table');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="btn btn-sm btn-light border px-3 py-1.5 fw-semibold text-secondary d-inline-flex align-items-center gap-1.5 rounded-2"
              style={{ fontSize: '0.78rem' }}
            >
              <span>View Full Approval Registry</span>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-3.5 px-4">
          {loading ? (
            <div className="py-4 text-center text-muted small">
              <span className="spinner-border spinner-border-sm me-2 text-danger" role="status" />
              Loading concession requests...
            </div>
          ) : pendingList.length === 0 ? (
            <div className="p-4 text-center rounded-3 bg-light border border-dashed">
              <CheckCircle2 size={32} className="text-success mb-2 opacity-75" />
              <h6 className="fw-bold text-sa-charcoal mb-1" style={{ fontSize: '0.92rem' }}>
                No Pending Discount Requests
              </h6>
              <p className="text-muted small m-0 mb-2" style={{ fontSize: '0.80rem' }}>
                All fee concession requests submitted by academy admission desks have been processed.
              </p>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('APPROVED');
                  setSearchParams({ status: 'APPROVED' });
                  const el = document.getElementById('discount-approvals-table');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="btn btn-sm btn-outline-success px-3 py-1 fw-semibold small"
                style={{ fontSize: '0.78rem' }}
              >
                View Approved Concessions Registry →
              </button>
            </div>
          ) : (
            <div className="d-flex flex-column gap-2.5">
              {pendingList.map((s) => {
                const orig = Number(s.originalFees || s.totalFees || 0);
                const reqDisc = Number(s.discountRequestedAmount || s.discountAmount || 0);
                const netPayableIfApproved = Math.max(0, orig - reqDisc);

                return (
                  <div
                    key={s.id}
                    className="p-3 rounded-3 border bg-white d-flex flex-column flex-lg-row align-items-start align-items-lg-center justify-content-between gap-3 transition-all shadow-xs"
                    style={{ borderColor: '#E2E8F0' }}
                  >
                    {/* Left: Student info */}
                    <div className="d-flex align-items-start gap-3">
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center text-white flex-shrink-0 fw-bold mt-0.5"
                        style={{ width: '38px', height: '38px', backgroundColor: '#334155', fontSize: '0.85rem' }}
                      >
                        {s.name ? s.name.charAt(0).toUpperCase() : 'S'}
                      </div>
                      <div>
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          <strong className="text-sa-charcoal" style={{ fontSize: '0.92rem' }}>{s.name}</strong>
                          <span className="badge bg-light text-secondary border" style={{ fontSize: '0.70rem' }}>
                            {s.standard || 'Course'}
                          </span>
                          <span className="badge bg-light text-muted border" style={{ fontSize: '0.70rem' }}>
                            Roll: {s.rollNumber || s.student_id || 'N/A'}
                          </span>
                        </div>
                        <div className="text-muted small mt-1 d-flex align-items-center gap-2 flex-wrap" style={{ fontSize: '0.76rem' }}>
                          <span>Recommended by: <strong>{s.discountRecommendedBy || s.discountOfferedBy || 'Admission Desk'}</strong></span>
                          <span>•</span>
                          <span>Scheme: <em className="text-dark">{s.discountReason || 'Fee Concession'}</em></span>
                          {s.discountOfferedAt && (
                            <>
                              <span>•</span>
                              <span>{new Date(s.discountOfferedAt).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Middle: Fee Breakdown */}
                    <div className="d-flex align-items-center gap-3 px-lg-3 py-1 py-lg-0 border-start-lg border-end-lg text-nowrap">
                      <div>
                        <span className="text-muted d-block small" style={{ fontSize: '0.70rem' }}>Full Tuition Fee</span>
                        <span className="fw-semibold text-secondary" style={{ fontSize: '0.86rem' }}>₹{orig.toLocaleString()}</span>
                      </div>
                      <div className="text-danger">
                        <span className="d-block small" style={{ fontSize: '0.70rem' }}>Requested Concession</span>
                        <span className="fw-bold" style={{ fontSize: '0.90rem' }}>-₹{reqDisc.toLocaleString()}</span>
                      </div>
                      <div className="border-start ps-3">
                        <span className="text-muted d-block small" style={{ fontSize: '0.70rem' }}>Net Fee (If Approved)</span>
                        <span className="fw-bold brand-font" style={{ color: '#8B1216', fontSize: '0.95rem' }}>₹{netPayableIfApproved.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Right: Quick Action Buttons */}
                    <div className="d-flex align-items-center gap-2 flex-wrap ms-lg-auto">
                      {isSuperAdmin ? (
                        <>
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleApprove(s)}
                            className="btn btn-sm btn-success d-inline-flex align-items-center gap-1.5 px-3 py-1.5 fw-bold shadow-xs rounded-2"
                            style={{ fontSize: '0.78rem' }}
                            title="Accept Requested Concession"
                          >
                            <ShieldCheck size={14} />
                            <span>Accept (₹{reqDisc.toLocaleString()})</span>
                          </button>

                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleOpenEdit(s)}
                            className="btn btn-sm btn-light border d-inline-flex align-items-center gap-1.5 px-2.5 py-1.5 fw-semibold text-sa-charcoal rounded-2"
                            style={{ fontSize: '0.78rem' }}
                            title="Edit discount amount or percentage before accepting"
                          >
                            <Edit3 size={13} style={{ color: '#8B1216' }} />
                            <span>Edit & Accept</span>
                          </button>

                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleOpenReject(s)}
                            className="btn btn-sm btn-outline-danger px-2.5 py-1.5 fw-semibold rounded-2"
                            style={{ fontSize: '0.78rem' }}
                            title="Decline this concession"
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <span className="badge bg-light text-secondary border px-2.5 py-1.5 small" style={{ fontSize: '0.75rem' }}>
                          Awaiting Superadmin Authorization
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 3. Summary Metric KPI Cards */}
      <div className="row g-3">
        {/* Card 1: Total Applications */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="sa-card p-3 h-100 border-start border-4 border-primary d-flex flex-column justify-content-between bg-white rounded-3 border shadow-xs cursor-pointer"
            style={{ cursor: 'pointer' }}
            onClick={() => { setStatusFilter('ALL'); setSearchParams({}); }}
            title="Click to view all discount concessions"
          >
            <div>
              <span className="small text-sa-muted fw-bold text-uppercase d-block mb-1" style={{ fontSize: '0.70rem', letterSpacing: '0.5px' }}>
                All Discount Requests
              </span>
              <div className="d-flex align-items-baseline justify-content-between mt-1">
                <span className="fs-4 fw-extrabold text-sa-charcoal brand-font">{totalCount}</span>
                <span className="badge bg-primary-subtle text-primary fw-semibold px-2 py-0.5 rounded-pill" style={{ fontSize: '0.70rem' }}>
                  Total Concessions
                </span>
              </div>
            </div>
            <div className="small text-sa-muted mt-2 pt-2 border-top d-flex align-items-center gap-1" style={{ fontSize: '0.75rem' }}>
              <Users size={12} />
              <span>Registered students with concessions</span>
            </div>
          </div>
        </div>

        {/* Card 2: Pending Super Admin Sign-off (Clickable) */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="sa-card p-3 h-100 border-start border-4 border-warning d-flex flex-column justify-content-between bg-white rounded-3 border shadow-xs cursor-pointer"
            style={{ cursor: 'pointer' }}
            onClick={() => { setStatusFilter('PENDING'); setSearchParams({ status: 'PENDING' }); }}
            title="Click to display pending discounts"
          >
            <div>
              <span className="small text-sa-muted fw-bold text-uppercase d-block mb-1" style={{ fontSize: '0.70rem', letterSpacing: '0.5px' }}>
                Pending Super Admin Sign-Off
              </span>
              <div className="d-flex align-items-baseline justify-content-between mt-1">
                <span className="fs-4 fw-extrabold text-warning-emphasis brand-font">{pendingList.length}</span>
                <span className="badge bg-warning-subtle text-warning-emphasis fw-semibold px-2 py-0.5 rounded-pill" style={{ fontSize: '0.70rem' }}>
                  ₹{totalPendingAmount.toLocaleString()} Pending
                </span>
              </div>
            </div>
            <div className="small text-sa-muted mt-2 pt-2 border-top d-flex align-items-center justify-content-between" style={{ fontSize: '0.75rem' }}>
              <span className="d-flex align-items-center gap-1">
                <Clock size={12} className="text-warning" />
                <span>Awaiting authorization</span>
              </span>
              <span className="text-warning-emphasis fw-bold">Click to filter →</span>
            </div>
          </div>
        </div>

        {/* Card 3: Approved By Super Admin */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="sa-card p-3 h-100 border-start border-4 border-success d-flex flex-column justify-content-between bg-white rounded-3 border shadow-xs cursor-pointer"
            style={{ cursor: 'pointer' }}
            onClick={() => { setStatusFilter('APPROVED'); setSearchParams({ status: 'APPROVED' }); }}
            title="Click to view approved concessions"
          >
            <div>
              <span className="small text-sa-muted fw-bold text-uppercase d-block mb-1" style={{ fontSize: '0.70rem', letterSpacing: '0.5px' }}>
                Approved by Super Admin
              </span>
              <div className="d-flex align-items-baseline justify-content-between mt-1">
                <span className="fs-4 fw-extrabold text-success brand-font">{approvedList.length}</span>
                <span className="badge bg-success-subtle text-success fw-semibold px-2 py-0.5 rounded-pill" style={{ fontSize: '0.70rem' }}>
                  ₹{totalDiscountGranted.toLocaleString()} Granted
                </span>
              </div>
            </div>
            <div className="small text-sa-muted mt-2 pt-2 border-top d-flex align-items-center gap-1" style={{ fontSize: '0.75rem' }}>
              <CheckCircle2 size={12} className="text-success" />
              <span>Approved & applied to tuition fee</span>
            </div>
          </div>
        </div>

        {/* Card 4: Declined Concessions */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="sa-card p-3 h-100 border-start border-4 border-danger d-flex flex-column justify-content-between bg-white rounded-3 border shadow-xs cursor-pointer"
            style={{ cursor: 'pointer' }}
            onClick={() => { setStatusFilter('REJECTED'); setSearchParams({ status: 'REJECTED' }); }}
            title="Click to view declined concessions"
          >
            <div>
              <span className="small text-sa-muted fw-bold text-uppercase d-block mb-1" style={{ fontSize: '0.70rem', letterSpacing: '0.5px' }}>
                Declined Concessions
              </span>
              <div className="d-flex align-items-baseline justify-content-between mt-1">
                <span className="fs-4 fw-extrabold text-danger brand-font">{rejectedList.length}</span>
                <span className="badge bg-danger-subtle text-danger fw-semibold px-2 py-0.5 rounded-pill" style={{ fontSize: '0.70rem' }}>
                  Full Fee Restored
                </span>
              </div>
            </div>
            <div className="small text-sa-muted mt-2 pt-2 border-top d-flex align-items-center gap-1" style={{ fontSize: '0.75rem' }}>
              <XCircle size={12} className="text-danger" />
              <span>Concession criteria rejected</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Filter Toolbar & Search */}
      <div className="sa-card p-3 bg-white rounded-3 border shadow-xs">
        <div className="row g-2 align-items-center">
          {/* Status Tabs */}
          <div className="col-12 col-lg-5">
            <div className="d-flex align-items-center gap-1.5 p-1 bg-light rounded-2 border">
              <button
                type="button"
                onClick={() => { setStatusFilter('ALL'); setSearchParams({}); }}
                className={`btn btn-sm flex-fill fw-bold py-1 border-0 ${statusFilter === 'ALL' ? 'bg-white text-dark shadow-xs' : 'text-muted'}`}
                style={{ fontSize: '12px', borderRadius: '6px' }}
              >
                All ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => { setStatusFilter('PENDING'); setSearchParams({ status: 'PENDING' }); }}
                className={`btn btn-sm flex-fill fw-bold py-1 border-0 ${statusFilter === 'PENDING' ? 'bg-warning text-dark shadow-xs' : 'text-muted'}`}
                style={{ fontSize: '12px', borderRadius: '6px' }}
              >
                <Clock size={12} className="me-1 inline" />
                Pending ({pendingList.length})
              </button>
              <button
                type="button"
                onClick={() => { setStatusFilter('APPROVED'); setSearchParams({ status: 'APPROVED' }); }}
                className={`btn btn-sm flex-fill fw-bold py-1 border-0 ${statusFilter === 'APPROVED' ? 'bg-success text-white shadow-xs' : 'text-muted'}`}
                style={{ fontSize: '12px', borderRadius: '6px' }}
              >
                <CheckCircle2 size={12} className="me-1 inline" />
                Approved ({approvedList.length})
              </button>
              <button
                type="button"
                onClick={() => { setStatusFilter('REJECTED'); setSearchParams({ status: 'REJECTED' }); }}
                className={`btn btn-sm flex-fill fw-bold py-1 border-0 ${statusFilter === 'REJECTED' ? 'bg-danger text-white shadow-xs' : 'text-muted'}`}
                style={{ fontSize: '12px', borderRadius: '6px' }}
              >
                <XCircle size={12} className="me-1 inline" />
                Declined ({rejectedList.length})
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div className="col-12 col-sm-7 col-lg-4">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-white border-end-0">
                <Search size={14} className="text-muted" />
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search student, roll, approver..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ fontSize: '12px' }}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="btn btn-outline-secondary border-start-0 bg-white"
                  onClick={() => setSearchQuery('')}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Standard Filter Dropdown */}
          <div className="col-12 col-sm-5 col-lg-3">
            <select
              className="form-select form-select-sm"
              value={standardFilter}
              onChange={(e) => setStandardFilter(e.target.value)}
              style={{ fontSize: '12px' }}
            >
              <option value="ALL">All Standards</option>
              {availableStandards.map((std) => (
                <option key={std} value={std}>
                  Standard: {std}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 5. Main Approvals Registry Table */}
      <div id="discount-approvals-table" className="sa-card p-3 p-md-4 bg-white rounded-3 border shadow-xs">
        <Table
          columns={[
            {
              key: 'student',
              title: 'Student Details',
              width: '240px',
              render: (_, row) => (
                <div>
                  <div
                    className="fw-bold text-sa-charcoal hover-underline"
                    style={{ cursor: 'pointer', fontSize: '13.5px' }}
                    onClick={() => navigate(`/admin/students/${row.id}`)}
                    title="View Student Profile"
                  >
                    {row.name}
                  </div>
                  <div className="text-muted small mt-0.5" style={{ fontSize: '11.5px' }}>
                    Roll: <strong>{row.rollNumber || row.student_id || 'Auto'}</strong> • {row.standard || 'Science'}
                  </div>
                  {row.batch && (
                    <span className="badge bg-light text-secondary border mt-1" style={{ fontSize: '10.5px' }}>
                      {row.batch}
                    </span>
                  )}
                </div>
              )
            },
            {
              key: 'feeCalculation',
              title: 'Tuition Fee & Concession',
              width: '240px',
              render: (_, row) => {
                const orig = Number(row.originalFees || (Number(row.totalFees || 0) + Number(row.discountAmount || 0)));
                const disc = Number(row.discountAmount || row.discountRequestedAmount || 0);
                const netIfApproved = Math.max(0, orig - disc);

                return (
                  <div>
                    <div className="d-flex align-items-center gap-1.5 flex-wrap">
                      <span className="text-muted text-decoration-line-through small" style={{ fontSize: '11.5px' }}>
                        ₹{orig.toLocaleString()}
                      </span>
                      <span className="badge bg-danger-subtle text-danger fw-bold" style={{ fontSize: '11.5px' }}>
                        -₹{disc.toLocaleString()} Concession
                      </span>
                    </div>

                    {row.discountStatus === 'APPROVED' ? (
                      <div className="mt-1 d-flex align-items-baseline gap-1">
                        <span className="text-success small fw-semibold" style={{ fontSize: '11px' }}>Approved Net Fee:</span>
                        <span className="fw-extrabold brand-font text-success" style={{ fontSize: '14px' }}>
                          ₹{netIfApproved.toLocaleString()}
                        </span>
                      </div>
                    ) : row.discountStatus === 'REJECTED' ? (
                      <div className="mt-1 d-flex align-items-baseline gap-1">
                        <span className="text-danger small fw-semibold" style={{ fontSize: '11px' }}>Full Fee Restored:</span>
                        <span className="fw-extrabold brand-font text-danger" style={{ fontSize: '14px' }}>
                          ₹{orig.toLocaleString()}
                        </span>
                      </div>
                    ) : (
                      <div>
                        <div className="mt-1 d-flex align-items-baseline gap-1">
                          <span className="text-secondary small fw-semibold" style={{ fontSize: '11px' }}>Net Fee (If Approved):</span>
                          <span className="fw-extrabold brand-font" style={{ color: '#8B1216', fontSize: '14px' }}>
                            ₹{netIfApproved.toLocaleString()}
                          </span>
                        </div>
                        <span className="badge bg-light text-muted border" style={{ fontSize: '10px' }}>
                          Full fee ₹{orig.toLocaleString()} held until decision
                        </span>
                      </div>
                    )}
                  </div>
                );
              }
            },
            {
              key: 'discountReason',
              title: 'Concession Scheme',
              width: '180px',
              render: (val, row) => (
                <div>
                  <span className="badge bg-light text-dark border px-2 py-1 fw-semibold d-inline-block text-truncate" style={{ maxWidth: '170px', fontSize: '11.5px' }}>
                    {val || 'Fee Concession'}
                  </span>
                  <div className="small text-muted mt-1" style={{ fontSize: '11px' }}>
                    Offered by: <strong>{row.discountRecommendedBy || row.discountOfferedBy || 'Staff Desk'}</strong>
                  </div>
                  {row.discountOfferedAt && (
                    <div className="text-muted" style={{ fontSize: '10.5px' }}>
                      {new Date(row.discountOfferedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              )
            },
            {
              key: 'discountStatus',
              title: 'Approval Status',
              width: '170px',
              render: (status) => {
                if (status === 'APPROVED') {
                  return (
                    <span className="badge bg-success-subtle text-success border border-success-subtle px-2.5 py-1 rounded-pill fw-bold d-inline-flex align-items-center gap-1" style={{ fontSize: '11.5px' }}>
                      <CheckCircle2 size={12} /> Approved
                    </span>
                  );
                }
                if (status === 'REJECTED') {
                  return (
                    <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2.5 py-1 rounded-pill fw-bold d-inline-flex align-items-center gap-1" style={{ fontSize: '11.5px' }}>
                      <XCircle size={12} /> Declined
                    </span>
                  );
                }
                return (
                  <span className="badge bg-warning-subtle text-warning-emphasis border border-warning px-2.5 py-1 rounded-pill fw-bold d-inline-flex align-items-center gap-1" style={{ fontSize: '11.5px' }}>
                    <Clock size={12} /> Pending Super Admin
                  </span>
                );
              }
            },
            {
              key: 'whoApprovedIt',
              title: 'Who Approved It (System Record)',
              width: '240px',
              render: (_, row) => {
                if (row.discountStatus === 'APPROVED') {
                  return (
                    <div className="p-2 rounded-2 border bg-success-subtle border-success-subtle" style={{ maxWidth: '230px' }}>
                      <div className="d-flex align-items-center gap-1.5 text-success fw-bold small" style={{ fontSize: '12px' }}>
                        <ShieldCheck size={14} className="flex-shrink-0" />
                        <span className="text-truncate">
                          {row.discountApprovedBy || 'Shubham Sharma (Superadmin)'}
                        </span>
                      </div>
                      <div className="text-muted mt-1 small" style={{ fontSize: '10.5px' }}>
                        {row.discountApprovedAt ? (
                          <>Authorized: {new Date(row.discountApprovedAt).toLocaleString()}</>
                        ) : (
                          <>Official Super Admin Seal Verified</>
                        )}
                      </div>
                    </div>
                  );
                }

                if (row.discountStatus === 'REJECTED') {
                  return (
                    <div>
                      <div className="text-danger fw-semibold small d-flex align-items-center gap-1" style={{ fontSize: '12px' }}>
                        <XCircle size={13} />
                        <span>Declined by Super Admin</span>
                      </div>
                      <div className="text-muted small mt-0.5" style={{ fontSize: '11px' }}>
                        Reason: {row.discountRejectionReason || 'Discount criteria not met'}
                      </div>
                    </div>
                  );
                }

                return (
                  <div>
                    <div className="text-warning-emphasis fw-semibold small d-flex align-items-center gap-1" style={{ fontSize: '12px' }}>
                      <Clock size={13} className="text-warning" />
                      <span>Awaiting Super Admin Decision</span>
                    </div>
                    <span className="text-muted" style={{ fontSize: '10.5px' }}>
                      Must be finalized by Super Admin
                    </span>
                  </div>
                );
              }
            },
            {
              key: 'actions',
              title: 'Super Admin Decision',
              align: 'end',
              width: '260px',
              render: (_, row) => {
                // If student discount is still pending:
                if (row.discountStatus === 'PENDING') {
                  if (isSuperAdmin) {
                    return (
                      <div className="d-flex align-items-center justify-content-end gap-1.5">
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => handleApprove(row)}
                          className="btn btn-sm btn-success d-inline-flex align-items-center gap-1 px-2.5 py-1 fw-bold shadow-xs"
                          style={{ fontSize: '12px', borderRadius: '6px' }}
                          title="Grant Final Approval as Super Admin"
                        >
                          <ShieldCheck size={13} /> Accept
                        </button>
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => handleOpenEdit(row)}
                          className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1 px-2 py-1 fw-semibold"
                          style={{ fontSize: '12px', borderRadius: '6px' }}
                          title="Edit discount amount or percentage before accepting"
                        >
                          <Edit3 size={12} /> Edit & Accept
                        </button>
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => handleOpenReject(row)}
                          className="btn btn-sm btn-outline-danger px-2.5 py-1 fw-semibold"
                          style={{ fontSize: '12px', borderRadius: '6px' }}
                          title="Decline Discount Request"
                        >
                          Reject
                        </button>
                      </div>
                    );
                  }

                  // Non-super-admin view
                  return (
                    <div className="text-end">
                      <span className="badge bg-light text-secondary border px-2 py-1 small" style={{ fontSize: '11px' }}>
                        Super Admin Authority Only
                      </span>
                    </div>
                  );
                }

                // If already approved or rejected:
                return (
                  <div className="d-flex align-items-center justify-content-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => navigate(`/admin/students/${row.id}`)}
                      className="btn btn-sm btn-light border px-2.5 py-1 text-secondary fw-semibold small"
                      style={{ fontSize: '11.5px', borderRadius: '6px' }}
                    >
                      Student Details
                    </button>
                    {isSuperAdmin && row.discountStatus === 'REJECTED' && (
                      <button
                        type="button"
                        onClick={() => handleApprove(row)}
                        className="btn btn-sm btn-outline-success px-2 py-1 fw-semibold small"
                        style={{ fontSize: '11px', borderRadius: '6px' }}
                        title="Reconsider & Approve"
                      >
                        Re-Approve
                      </button>
                    )}
                  </div>
                );
              }
            }
          ]}
          data={filteredData}
          loading={loading}
          emptyText="No student discount concessions found matching the selected criteria."
        />
      </div>

      {/* 6. Modal: Super Admin Rejection Reason Prompt */}
      {selectedStudentForReject && (
        <Modal
          isOpen={rejectModalOpen}
          onClose={() => setRejectModalOpen(false)}
          title={`Decline Discount: ${selectedStudentForReject.name}`}
        >
          <form onSubmit={handleConfirmReject} className="d-flex flex-column gap-3">
            <div className="p-3 bg-light rounded-2 border">
              <div className="d-flex justify-content-between align-items-center">
                <span className="fw-bold text-sa-charcoal">{selectedStudentForReject.name}</span>
                <span className="badge bg-danger-subtle text-danger fw-bold">
                  -₹{Number(selectedStudentForReject.discountRequestedAmount || selectedStudentForReject.discountAmount).toLocaleString()}
                </span>
              </div>
              <div className="text-muted small mt-1">
                Standard: <strong>{selectedStudentForReject.standard}</strong> • Scheme: {selectedStudentForReject.discountReason}
              </div>
            </div>

            <div>
              <label className="form-label small fw-bold">Reason for Declining Discount</label>
              <textarea
                className="form-control"
                rows="3"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Concession quota exhausted, documentation incomplete, or standard fee applicable"
                required
              />
              <span className="small text-muted mt-1 d-block">
                This explanation will be logged and visible to the admission desk.
              </span>
            </div>

            <div className="d-flex justify-content-end gap-2 mt-2 pt-3 border-top">
              <Button variant="light" onClick={() => setRejectModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="danger" disabled={actionLoading}>
                Confirm Decline & Restore Full Fee
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* 6.5 Modal: Super Admin Value Adjustment & Approve */}
      {selectedStudentForEdit && (
        <Modal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          title={`Adjust & Approve Concession: ${selectedStudentForEdit.name}`}
        >
          <div className="d-flex flex-column gap-3">
            <div className="p-3 bg-light rounded-2 border">
              <div className="d-flex justify-content-between small text-muted mb-1">
                <span>Student</span>
                <span className="fw-semibold text-dark">{selectedStudentForEdit.name} ({selectedStudentForEdit.standard})</span>
              </div>
              <div className="d-flex justify-content-between small text-muted mb-1">
                <span>Original Gross Fee</span>
                <span className="fw-semibold text-dark">₹{Number(selectedStudentForEdit.originalFees || selectedStudentForEdit.totalFees || 0).toLocaleString()}</span>
              </div>
              <div className="d-flex justify-content-between small text-muted">
                <span>Staff Requested Concession</span>
                <span className="fw-bold text-danger">-₹{Number(selectedStudentForEdit.discountRequestedAmount || selectedStudentForEdit.discountAmount || 0).toLocaleString()}</span>
              </div>
            </div>

            <div className="row g-2">
              <div className="col-7">
                <label className="form-label small fw-bold">Approved Concession Amount (₹)</label>
                <div className="input-group">
                  <span className="input-group-text bg-white">₹</span>
                  <input
                    type="number"
                    className="form-control"
                    min="0"
                    max={Number(selectedStudentForEdit.originalFees || selectedStudentForEdit.totalFees || 0)}
                    value={editAmount}
                    onChange={(e) => handleEditAmountChange(e.target.value)}
                    placeholder="e.g. 3000"
                  />
                </div>
              </div>
              <div className="col-5">
                <label className="form-label small fw-bold">Discount %</label>
                <div className="input-group">
                  <input
                    type="number"
                    className="form-control"
                    min="0"
                    max="100"
                    value={editPercentage}
                    onChange={(e) => handleEditPercentageChange(e.target.value)}
                    placeholder="%"
                  />
                  <span className="input-group-text bg-white">%</span>
                </div>
              </div>
            </div>

            {/* Live calculation */}
            <div className="p-2.5 rounded-2 bg-success-subtle border border-success-subtle text-success-emphasis small">
              <div className="d-flex justify-content-between fw-bold">
                <span>New Net Payable Fee:</span>
                <span>
                  ₹{Math.max(0, Number(selectedStudentForEdit.originalFees || selectedStudentForEdit.totalFees || 0) - Number(editAmount || 0)).toLocaleString()}
                </span>
              </div>
              <div className="small text-muted mt-1" style={{ fontSize: '0.72rem' }}>
                Both the originally requested amount (₹{Number(selectedStudentForEdit.discountRequestedAmount || selectedStudentForEdit.discountAmount || 0).toLocaleString()}) and this approved amount (₹{Number(editAmount || 0).toLocaleString()}) will be notified to the Admission Admin.
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2 pt-2 border-top">
              <Button variant="light" onClick={() => setEditModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmEditApprove}
                disabled={actionLoading || Number(editAmount) <= 0}
              >
                Accept with Adjusted Fee
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 7. Modal: Quick Offer Concession for a Student */}
      {selectedStudentForOffer && (
        <Modal
          isOpen={offerModalOpen}
          onClose={() => setOfferModalOpen(false)}
          title={`Offer Discount Concession: ${selectedStudentForOffer.name}`}
        >
          <form onSubmit={handleConfirmOffer} className="d-flex flex-column gap-3">
            <div className="p-3 bg-light rounded-2 border">
              <div className="small text-muted">Current Decided Fees</div>
              <div className="fw-bold text-sa-charcoal fs-5">
                ₹{Number(selectedStudentForOffer.totalFees).toLocaleString()}
              </div>
              <div className="small text-muted mt-1">
                Class: {selectedStudentForOffer.standard} • Roll: {selectedStudentForOffer.rollNumber || 'Auto'}
              </div>
            </div>

            <div>
              <Input
                label="Discount Concession Amount (₹)"
                name="discountAmount"
                type="number"
                min="100"
                max={selectedStudentForOffer.totalFees}
                value={offerForm.discountAmount}
                onChange={(e) => setOfferForm({ ...offerForm, discountAmount: e.target.value })}
                required
                placeholder="e.g. 5000"
              />
            </div>

            <div>
              <label className="form-label small fw-bold">Concession Scheme / Category</label>
              <select
                className="form-select"
                value={offerForm.discountReason}
                onChange={(e) => setOfferForm({ ...offerForm, discountReason: e.target.value })}
              >
                <option value="Merit Scholarship (90%+ Marks)">Merit Scholarship (90%+ Marks)</option>
                <option value="Sibling Concession">Sibling Concession</option>
                <option value="Early Bird Registration">Early Bird Registration</option>
                <option value="Economically Weaker Section (EWS)">Economically Weaker Section (EWS)</option>
                <option value="Special Director Recommendation">Special Director Recommendation</option>
                <option value="Single Parent Support">Single Parent Support</option>
                <option value="Other Academy Concession">Other Academy Concession</option>
              </select>
            </div>

            <div>
              <label className="form-label small fw-semibold text-muted">Recommended By</label>
              <input
                type="text"
                className="form-control"
                value={currentStaffName}
                disabled
              />
            </div>

            <div className="p-2.5 rounded-2 bg-warning-subtle text-warning-emphasis small border border-warning">
              <Clock size={13} className="me-1 inline" />
              This concession will require final approval from the <strong>Super Admin</strong> before applying to the student's ledger.
            </div>

            <div className="d-flex justify-content-end gap-2 mt-2 pt-3 border-top">
              <Button variant="light" onClick={() => setOfferModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={actionLoading}>
                Submit for Super Admin Approval
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
