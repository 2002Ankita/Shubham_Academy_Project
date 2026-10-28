import React, { useState, useEffect, useMemo } from 'react';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import feeService from '../../services/feeService';
import studentService from '../../services/studentService';
import BranchBatchSelector from '../common/BranchBatchSelector';
import {
  BRANCH_TARABAI,
  BRANCH_MANGALWAR,
  isSessionRequired,
  matchesStudentFilters,
  formatStudentBatchDisplay
} from '../../config/branchBatchConfig';
import {
  Building,
  GraduationCap,
  Search,
  X,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
  Clock,
  Percent,
  Receipt,
  User,
  Phone,
  Layers
} from 'lucide-react';

import { useAuth } from '../../hooks/useAuth';
import { getUserBranch } from '../../utils/branchUtils';

export default function FeeForm({
  onSubmit,
  loading: externalLoading,
  onStudentSelectChange
}) {
  const { user } = useAuth();
  const isSuperAdmin = (user?.role || '').toLowerCase().includes('super');
  const activeBranch = getUserBranch(user);
  const initialBranch = (activeBranch && activeBranch.toLowerCase().includes('mangal')) ? BRANCH_MANGALWAR : BRANCH_TARABAI;

  // 1. Standardized Branch, Session & Academic Batch State
  const [selectedBranch, setSelectedBranch] = useState(initialBranch);
  const [selectedSession, setSelectedSession] = useState('');
  const [selectedAcademicBatch, setSelectedAcademicBatch] = useState('11th PCM');

  // Derived Standard
  const selectedStandard = (selectedAcademicBatch || '').startsWith('12th') ? '12th Science' : '11th Science';
  const isFilterComplete = Boolean(
    selectedBranch && selectedAcademicBatch && (!isSessionRequired(selectedBranch) || selectedSession)
  );

  // 2. Student Data State
  const [eligibleStudents, setEligibleStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);

  // 3. Fee Details & Form State
  const [feeDetails, setFeeDetails] = useState(null);
  const [loadingFeeDetails, setLoadingFeeDetails] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    feeHead: 'Term 1 Tuition & Lab Fees',
    amountPaid: 0,
    paymentMode: 'UPI / Online Transfer',
    transactionRef: '',
    remarks: 'Payment acknowledged',
    totalFees: 0,
    alreadyPaid: 0,
    pendingAmount: 0
  });

  // Fetch eligible students when Branch, Session, and Batch are selected
  useEffect(() => {
    if (!isFilterComplete) {
      setEligibleStudents([]);
      setSelectedStudentId('');
      setSelectedStudent(null);
      setFeeDetails(null);
      if (onStudentSelectChange) {
        onStudentSelectChange(null, null, []);
      }
      return;
    }

    let isMounted = true;
    setLoadingStudents(true);
    setSelectedStudentId('');
    setSelectedStudent(null);
    setFeeDetails(null);
    setStudentSearch('');
    if (onStudentSelectChange) {
      onStudentSelectChange(null, null, []);
    }

    studentService
      .getAll({
        branch: selectedBranch,
        academic_batch: selectedAcademicBatch,
        session: selectedSession
      })
      .then((data) => {
        if (!isMounted) return;
        const filtered = (data || []).filter((s) =>
          matchesStudentFilters(s, {
            branch: selectedBranch,
            session: selectedSession,
            academicBatch: selectedAcademicBatch
          })
        );
        setEligibleStudents(filtered);
      })
      .catch((err) => {
        console.error('Failed to load eligible students:', err);
        if (isMounted) setEligibleStudents([]);
      })
      .finally(() => {
        if (isMounted) setLoadingStudents(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedBranch, selectedSession, selectedAcademicBatch, isFilterComplete]);

  // Filter eligible students based on search term
  const searchFilteredStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    if (!q) return eligibleStudents;
    return eligibleStudents.filter((s) => {
      const nameMatch = (s.name || '').toLowerCase().includes(q);
      const rollMatch = (s.rollNumber || '').toLowerCase().includes(q);
      const phoneMatch = (s.phone || '').toLowerCase().includes(q);
      return nameMatch || rollMatch || phoneMatch;
    });
  }, [eligibleStudents, studentSearch]);

  // When a student is selected, load fee details and payments
  const handleStudentSelect = async (studentId) => {
    setSelectedStudentId(studentId);
    if (!studentId) {
      setSelectedStudent(null);
      setFeeDetails(null);
      setFormData((prev) => ({
        ...prev,
        amountPaid: 0,
        totalFees: 0,
        alreadyPaid: 0,
        pendingAmount: 0
      }));
      if (onStudentSelectChange) {
        onStudentSelectChange(null, null, []);
      }
      return;
    }

    const studentObj = eligibleStudents.find((s) => s.id === studentId);
    setSelectedStudent(studentObj || null);
    setLoadingFeeDetails(true);

    try {
      const [details, allPayments] = await Promise.all([
        feeService.getFeeDetails(studentId, {
          branch: selectedBranch,
          standard: selectedStandard
        }),
        feeService.getAll({
          student_id: studentId,
          branch: selectedBranch,
          standard: selectedStandard
        })
      ]);

      setFeeDetails(details);

      // Student-specific payment history
      const studentPayments = (allPayments || []).filter(
        (p) => String(p.studentId) === String(studentId)
      );

      const totalApplicableFees = Number(details.total_fees || 0);
      const paidSoFar = Number(details.amount_paid || 0);
      const balanceRemaining = Math.max(0, totalApplicableFees - paidSoFar);

      setFormData((prev) => ({
        ...prev,
        studentId,
        amountPaid: 0,
        totalFees: totalApplicableFees,
        originalFees: details.original_fees || totalApplicableFees,
        discountAmount: details.discount_amount || 0,
        discountReason: details.discount_reason || '',
        discountStatus: details.discount_status || 'NONE',
        discountApprovedBy: details.discount_approved_by || '',
        alreadyPaid: paidSoFar,
        pendingAmount: balanceRemaining
      }));

      if (onStudentSelectChange) {
        onStudentSelectChange(studentObj, details, studentPayments);
      }
    } catch (err) {
      console.error('Error fetching student fee details:', err);
    } finally {
      setLoadingFeeDetails(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === 'amountPaid') {
        const newPaid = Number(value) || 0;
        const total = Number(updated.totalFees) || 0;
        const paidSoFar = Number(updated.alreadyPaid) || 0;
        updated.pendingAmount = Math.max(0, total - paidSoFar - newPaid);
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;

    setSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        studentId: selectedStudent.id,
        studentName: selectedStudent.name,
        rollNumber: selectedStudent.rollNumber,
        standard: selectedStudent.standard || selectedStandard,
        branch: selectedBranch,
        academic_batch: selectedAcademicBatch,
        session: selectedSession,
        batch: selectedStudent.batch || `${selectedAcademicBatch} ${selectedBranch}`
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="sa-card p-4 p-lg-4 border shadow-sm">
      {/* Top Card Header */}
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-4 pb-3 border-bottom">
        <div>
          <h5 className="brand-font fw-bold text-sa-charcoal m-0 fs-5 d-flex align-items-center gap-2">
            <Receipt className="text-sa-primary" size={22} />
            Student Fee Collection Counter
          </h5>
          <p className="text-muted small m-0 mt-1">
            Select branch, session (if Mangalwar Peth), and academic batch to locate eligible students.
          </p>
        </div>
        {selectedStudent && (
          <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 rounded-pill fw-semibold small align-self-start align-self-sm-center">
            ● Active Student: {selectedStudent.name} ({formatStudentBatchDisplay(selectedStudent)})
          </span>
        )}
      </div>

      {/* 1. Standardized Branch & Academic Batch Selector */}
      <div className="p-3.5 p-md-4 rounded-3 border bg-light-subtle mb-4">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <label className="form-label fw-bold small text-sa-charcoal d-flex align-items-center gap-1.5 m-0">
            <Building size={16} className="text-sa-primary" /> Branch & Batch Selection (Admission Filter)
          </label>
          {isFilterComplete && (
            <span className="badge py-1 px-2.5 rounded-pill fw-bold" style={{ backgroundColor: '#8B1216', color: '#FFFFFF' }}>
              {selectedBranch} • {selectedSession ? `${selectedSession} • ` : ''}{selectedAcademicBatch}
            </span>
          )}
        </div>
        <BranchBatchSelector
          branch={selectedBranch}
          session={selectedSession}
          academicBatch={selectedAcademicBatch}
          onBranchChange={(b) => {
            setSelectedBranch(b);
            if (!isSessionRequired(b)) setSelectedSession('');
          }}
          onSessionChange={setSelectedSession}
          onBatchChange={setSelectedAcademicBatch}
          required={true}
          showAllOption={false}
          fixedBranch={!isSuperAdmin}
          allowedBranches={!isSuperAdmin ? [initialBranch] : undefined}
        />
      </div>

      {/* 2. Initial State Notice (Before required fields selected) */}
      {!isFilterComplete && (
        <div className="alert alert-light border border-dashed rounded-3 p-4 text-center my-3 bg-light">
          <div className="text-sa-muted mb-2">
            <AlertCircle size={36} className="text-secondary opacity-75" />
          </div>
          <h6 className="fw-bold text-sa-charcoal mb-1">
            Complete Branch and Academic Batch selection to view students.
          </h6>
          <p className="text-muted small mb-0">
            Student fee records remain restricted until the valid branch and batch are chosen.
          </p>
        </div>
      )}

      {/* 3. Student Search and Dropdown Selection (When Filter Complete) */}
      {isFilterComplete && (
        <div className="p-3.5 p-md-4 rounded-3 border bg-white shadow-xs mb-4">
          <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
            <div className="d-flex align-items-center gap-2">
              <User size={16} className="text-sa-primary" />
              <h6 className="fw-bold text-sa-charcoal m-0 small">
                Search & Select Student from Enrolled Batch
              </h6>
            </div>
            <span className="badge bg-light text-sa-charcoal border small">
              Campus: <strong>{selectedBranch}</strong> • <strong>{selectedSession ? `${selectedSession} • ` : ''}{selectedAcademicBatch}</strong>
            </span>
          </div>

          <div className="row g-3">
            {/* Search Student Input */}
            <div className="col-12 col-md-5">
              <label
                htmlFor="student-search-input"
                className="form-label fw-bold small text-sa-charcoal mb-1"
              >
                Search Within Eligible Students
              </label>
              <div className="position-relative">
                <Search
                  size={16}
                  className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted pointer-events-none"
                  style={{ zIndex: 3 }}
                />
                <input
                  id="student-search-input"
                  type="text"
                  className="form-control ps-5 pe-5 py-2.5"
                  placeholder="Search student by name, roll no..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  disabled={loadingStudents || eligibleStudents.length === 0}
                />
                {studentSearch && (
                  <button
                    type="button"
                    className="btn btn-link position-absolute top-50 end-0 translate-middle-y text-muted pe-3 p-0"
                    onClick={() => setStudentSearch('')}
                    title="Clear search"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Select Student Dropdown */}
            <div className="col-12 col-md-7">
              <label
                htmlFor="student-select-dropdown"
                className="form-label fw-bold small text-sa-charcoal mb-1"
              >
                Select Student List
              </label>
              <select
                id="student-select-dropdown"
                className="form-select py-2.5"
                value={selectedStudentId}
                onChange={(e) => handleStudentSelect(e.target.value)}
                disabled={loadingStudents || eligibleStudents.length === 0}
              >
                {loadingStudents ? (
                  <option value="">Loading students...</option>
                ) : eligibleStudents.length === 0 ? (
                  <option value="">-- No students found for this branch and batch --</option>
                ) : searchFilteredStudents.length === 0 ? (
                  <option value="">-- No matching student found --</option>
                ) : (
                  <>
                    <option value="">
                      -- Select eligible student ({searchFilteredStudents.length} available) --
                    </option>
                    {searchFilteredStudents.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.rollNumber} - {s.name} • {formatStudentBatchDisplay(s)}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Feedback messages for edge cases */}
          {!loadingStudents && eligibleStudents.length === 0 && (
            <div className="mt-3 text-warning-emphasis bg-warning-subtle border border-warning-subtle rounded-2 px-3 py-2.5 small d-flex align-items-center gap-2">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>
                <strong>No students found for this batch.</strong> There are currently
                no registered students matching {selectedBranch} • {selectedSession ? `${selectedSession} • ` : ''}{selectedAcademicBatch}.
              </span>
            </div>
          )}

          {!loadingStudents && eligibleStudents.length > 0 && studentSearch && searchFilteredStudents.length === 0 && (
            <div className="mt-3 text-danger bg-danger-subtle border border-danger-subtle rounded-2 px-3 py-2.5 small d-flex align-items-center gap-2">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>
                <strong>No matching student found.</strong> No student matches &ldquo;{studentSearch}&rdquo; in this selected batch.
              </span>
            </div>
          )}
        </div>
      )}

      {/* 5. Display Student Overview & Fee Details Cards (When Student is Selected) */}
      {selectedStudent && (
        <div className="mb-4">
          {/* Selected Student Banner */}
          <div className="p-3.5 p-md-4 mb-4 rounded-3 bg-white border d-flex flex-wrap align-items-center justify-content-between gap-3 shadow-xs">
            <div className="d-flex align-items-center gap-3">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-xs flex-shrink-0"
                style={{
                  width: '48px',
                  height: '48px',
                  background: 'linear-gradient(135deg, #8B1216 0%, #A91D22 100%)',
                  fontSize: '1.2rem'
                }}
              >
                {(selectedStudent.name || 'S').charAt(0).toUpperCase()}
              </div>
              <div>
                <h5 className="fw-bold text-sa-charcoal m-0 fs-6">
                  {selectedStudent.name}
                </h5>
                <div className="d-flex flex-wrap gap-2 align-items-center mt-1">
                  <span className="badge bg-light text-sa-charcoal border small">
                    Roll No: <strong>{selectedStudent.rollNumber}</strong>
                  </span>
                  <span className="badge bg-light text-sa-charcoal border small">
                    Campus: <strong>{selectedBranch}</strong>
                  </span>
                  <span className="badge bg-light text-sa-charcoal border small">
                    Class: <strong>{selectedStudent.standard}</strong>
                  </span>
                  {selectedStudent.batch && (
                    <span className="badge bg-light text-sa-charcoal border small">
                      Batch: <strong>{selectedStudent.batch}</strong>
                    </span>
                  )}
                  {selectedStudent.phone && (
                    <span className="badge bg-light text-sa-charcoal border small">
                      Phone: <strong>{selectedStudent.phone}</strong>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-light-subtle text-sa-charcoal border px-3 py-1.5 small">
                Academic Year: 2025-2026
              </span>
            </div>
          </div>

          {/* Fee Details 4-Column Display */}
          <div className="row g-3 g-lg-4 mb-4">
            {/* 1. Total Fees */}
            <div className="col-12 col-sm-6 col-lg-3">
              <div className="p-3.5 rounded-3 border bg-white h-100 shadow-xs">
                <div className="d-flex align-items-center justify-content-between text-muted small mb-2">
                  <span className="fw-semibold">Total Applicable Fees</span>
                  <div className="p-1.5 rounded-circle bg-danger-subtle text-sa-primary">
                    <IndianRupee size={16} />
                  </div>
                </div>
                <div className="fs-4 fw-extrabold text-sa-charcoal">
                  ₹ {Number(formData.totalFees || 0).toLocaleString()}
                </div>
                {formData.discountStatus === 'APPROVED' && Number(formData.discountAmount) > 0 ? (
                  <div className="text-muted small mt-1.5" style={{ fontSize: '0.72rem' }}>
                    Original: <del>₹{Number(formData.originalFees || 0).toLocaleString()}</del>
                  </div>
                ) : (
                  <div className="text-muted small mt-1.5" style={{ fontSize: '0.72rem' }}>
                    Standard course fee
                  </div>
                )}
              </div>
            </div>

            {/* 2. Approved Discount */}
            <div className="col-12 col-sm-6 col-lg-3">
              <div className="p-3.5 rounded-3 border bg-white h-100 shadow-xs">
                <div className="d-flex align-items-center justify-content-between text-muted small mb-2">
                  <span className="fw-semibold">Approved Discount</span>
                  <div className="p-1.5 rounded-circle bg-success-subtle text-success">
                    <Percent size={16} />
                  </div>
                </div>
                <div className="fs-4 fw-extrabold text-success">
                  ₹{' '}
                  {formData.discountStatus === 'APPROVED'
                    ? Number(formData.discountAmount || 0).toLocaleString()
                    : '0'}
                </div>
                <div className="mt-1.5" style={{ fontSize: '0.72rem' }}>
                  {formData.discountStatus === 'APPROVED' && Number(formData.discountAmount) > 0 ? (
                    <span className="badge bg-success-subtle text-success">
                      ✓ Approved {formData.discountApprovedBy ? `by ${formData.discountApprovedBy}` : ''}
                    </span>
                  ) : formData.discountStatus === 'PENDING' && Number(formData.discountAmount) > 0 ? (
                    <span className="badge bg-warning-subtle text-warning-emphasis">
                      ⏳ Pending Approval
                    </span>
                  ) : (
                    <span className="text-muted">No concession applied</span>
                  )}
                </div>
              </div>
            </div>

            {/* 3. Amount Paid */}
            <div className="col-12 col-sm-6 col-lg-3">
              <div className="p-3.5 rounded-3 border bg-white h-100 shadow-xs">
                <div className="d-flex align-items-center justify-content-between text-muted small mb-2">
                  <span className="fw-semibold">Amount Paid</span>
                  <div className="p-1.5 rounded-circle bg-success-subtle text-success">
                    <CheckCircle2 size={16} />
                  </div>
                </div>
                <div className="fs-4 fw-extrabold text-success">
                  ₹ {Number(formData.alreadyPaid || 0).toLocaleString()}
                </div>
                <div className="mt-1.5" style={{ fontSize: '0.72rem' }}>
                  <div className="d-flex justify-content-between text-muted mb-1">
                    <span>Progress</span>
                    <span>
                      {Number(formData.totalFees) > 0
                        ? `${Math.round(((formData.alreadyPaid || 0) / formData.totalFees) * 100)}%`
                        : '0%'}
                    </span>
                  </div>
                  <div className="progress" style={{ height: '4px' }}>
                    <div
                      className="progress-bar bg-success"
                      style={{
                        width: `${
                          Number(formData.totalFees) > 0
                            ? Math.min(100, Math.round(((formData.alreadyPaid || 0) / formData.totalFees) * 100))
                            : 0
                        }%`
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Pending Balance */}
            <div className="col-12 col-sm-6 col-lg-3">
              <div className="p-3.5 rounded-3 border bg-white h-100 shadow-xs">
                <div className="d-flex align-items-center justify-content-between text-muted small mb-2">
                  <span className="fw-semibold">Pending Balance</span>
                  <div
                    className={`p-1.5 rounded-circle ${
                      formData.pendingAmount > 0 ? 'bg-danger-subtle text-danger' : 'bg-success-subtle text-success'
                    }`}
                  >
                    <Clock size={16} />
                  </div>
                </div>
                <div
                  className={`fs-4 fw-extrabold ${
                    formData.pendingAmount > 0 ? 'text-danger' : 'text-success'
                  }`}
                >
                  ₹ {Number(formData.pendingAmount || 0).toLocaleString()}
                </div>
                <div className="mt-1.5" style={{ fontSize: '0.72rem' }}>
                  {formData.pendingAmount > 0 ? (
                    <span className="badge bg-danger-subtle text-danger">Payment Due</span>
                  ) : (
                    <span className="badge bg-success-subtle text-success">Fully Settled</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 6. Payment Collection Input Fields (When Student is Selected) */}
          <div className="p-3.5 p-md-4 rounded-3 border bg-light-subtle">
            <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
              <div className="d-flex align-items-center gap-2">
                <Receipt size={18} className="text-sa-primary" />
                <h6 className="brand-font fw-bold text-sa-charcoal m-0 fs-6">
                  Record New Payment Entry
                </h6>
              </div>
              <span className="text-muted small">
                Enter installment details to generate receipt
              </span>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="row g-3 g-md-4">
                <div className="col-12 col-md-6">
                  <Select
                    label="Fee Head / Category"
                    name="feeHead"
                    value={formData.feeHead}
                    onChange={handleInputChange}
                    options={[
                      'Annual Full Tuition Fee',
                      'Term 1 Installment',
                      'Term 2 Installment',
                      'Exam & Lab Certification Fee',
                      'Study Material Book Set'
                    ]}
                  />
                </div>

                <div className="col-12 col-md-6">
                  <Select
                    label="Payment Mode"
                    name="paymentMode"
                    value={formData.paymentMode}
                    onChange={handleInputChange}
                    options={[
                      'UPI / Online Transfer',
                      'Cash Counter',
                      'Cheque',
                      'Debit / Credit Card',
                      'NEFT / RTGS'
                    ]}
                  />
                </div>

                <div className="col-12 col-md-4">
                  <Input
                    label="New Amount to Pay (₹)"
                    name="amountPaid"
                    type="number"
                    min="1"
                    value={formData.amountPaid}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="col-12 col-md-4">
                  <Input
                    label="Transaction ID / Cheque No."
                    name="transactionRef"
                    placeholder="e.g. UPI-984210029"
                    value={formData.transactionRef}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="col-12 col-md-4">
                  <Input
                    label="Remarks / Notes"
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="d-flex justify-content-end mt-4 pt-3 border-top">
                <Button
                  type="submit"
                  variant="primary"
                  loading={submitting || externalLoading}
                  className="px-4 py-2.5 fw-semibold shadow-sm d-inline-flex align-items-center gap-2"
                >
                  <CheckCircle2 size={16} />
                  <span>Record Payment & Generate Receipt</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
