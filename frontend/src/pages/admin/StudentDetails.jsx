import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import studentService from '../../services/studentService';
import marksService from '../../services/marksService';
import feeService from '../../services/feeService';
import notificationService from '../../services/notificationService';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-toastify';
import { formatStudentBatchDisplay } from '../../config/branchBatchConfig';
import {
  ArrowLeft,
  GraduationCap,
  CalendarCheck,
  CreditCard,
  Award,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Tag,
  Plus,
  Clock,
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function StudentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [student, setStudent] = useState(null);
  const [results, setResults] = useState([]);
  const [feeDetails, setFeeDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  // Discount modal state
  const [discountModalOpen, setDiscountModalOpen] = useState(false);
  const [discountForm, setDiscountForm] = useState({
    discountAmount: '',
    discountReason: 'Academic Merit Scholarship',
    customReason: ''
  });
  const [submittingDiscount, setSubmittingDiscount] = useState(false);

  // Multi-Year Conversion modal state
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [converting, setConverting] = useState(false);
  const [conversionForm, setConversionForm] = useState({
    secondYearAcademicBatch: '12th PCM',
    secondYearAcademicYear: '2026-2027',
    secondYearSession: '',
    concessionType: 'fixed',
    concessionValue: 10000,
    concessionReason: 'Two-Year Integrated Package Discount',
    customReason: '',
    recommendedBy: 'Miss Shilpa (Counselor)'
  });

  const roleStr = (user?.role || '').toLowerCase().replace('-', '_');
  const isSuperAdmin = roleStr === 'super_admin' || roleStr.includes('super');

  const getCatalogFee = (branch, batch, standard) => {
    const isMangal = (branch || '').toLowerCase().includes('mangal');
    const bStr = (batch || '').toLowerCase();
    const isPCMB = bStr.includes('pcmb');
    const isPCB = bStr.includes('pcb') && !isPCMB;
    const is12th = (standard || '').includes('12') || bStr.includes('12');

    if (isMangal) {
      if (is12th) {
        return isPCMB ? 65000 : 60000;
      } else {
        return isPCMB ? 58000 : 52000;
      }
    } else {
      if (is12th) {
        return isPCMB ? 70000 : 65000;
      } else {
        return isPCMB ? 60000 : 55000;
      }
    }
  };

  const handleConversionSubmit = async (e) => {
    e.preventDefault();
    if (!student) return;

    const reason = conversionForm.concessionReason === 'Other'
      ? (conversionForm.customReason || 'Special Multi-Year Concession')
      : conversionForm.concessionReason;

    try {
      setConverting(true);
      await studentService.convertToTwoYear(student.id, {
        second_year_standard: '12th Science',
        second_year_academic_batch: conversionForm.secondYearAcademicBatch,
        second_year_batch: `${conversionForm.secondYearAcademicBatch} ${student.branch || 'Tarabai Park'}`,
        second_year_session: conversionForm.secondYearSession || student.session || undefined,
        second_year_academic_year: conversionForm.secondYearAcademicYear || '2026-2027',
        concession_type: conversionForm.concessionType,
        concession_value: Number(conversionForm.concessionValue) || 0,
        concession_reason: reason,
        recommended_by: conversionForm.recommendedBy || (user?.full_name || user?.name || 'Miss Shilpa')
      });
      toast.success(`Successfully converted ${student.name} to Two-Year Admission! 12th Standard admission linked.`);
      setConvertModalOpen(false);
      await loadDetails();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to convert to Two-Year Admission');
    } finally {
      setConverting(false);
    }
  };

  const loadDetails = async () => {
    try {
      const [stu, res] = await Promise.all([
        studentService.getById(id),
        marksService.getStudentResults(id),
      ]);
      setStudent(stu);
      setResults(res);

      try {
        const fees = await feeService.getFeeDetails(id);
        setFeeDetails(fees);
      } catch (e) {
        console.warn('Fee details fetch failed:', e);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [id]);

  const handleApproveDiscount = async () => {
    try {
      setSubmittingDiscount(true);
      const discAmt = student.discountRequestedAmount || student.discountAmount || 0;
      await studentService.approveDiscount(student.id, {
        approved_amount: Number(discAmt) || 0,
        discount_amount: Number(discAmt) || 0
      });
      try {
        notificationService.notifyDiscountDecision({
          studentId: student.id,
          studentName: student.name,
          originalRequested: discAmt,
          approvedAmount: discAmt,
          isApproved: true,
          approverName: user?.full_name || user?.name || 'Superadmin'
        });
      } catch (syncErr) {
        console.warn('Sync notification error:', syncErr);
      }
      toast.success(`Discount approved successfully by Superadmin (${user?.name || user?.full_name || 'Superadmin'})!`);
      await loadDetails();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to approve discount');
    } finally {
      setSubmittingDiscount(false);
    }
  };

  const handleRejectDiscount = async () => {
    const reason = window.prompt('Please enter the reason for rejecting this discount:', 'Not eligible per academic policy');
    if (reason === null) return;
    try {
      setSubmittingDiscount(true);
      await studentService.rejectDiscount(student.id, reason);
      try {
        notificationService.notifyDiscountDecision({
          studentId: student.id,
          studentName: student.name,
          originalRequested: student.discountRequestedAmount || student.discountAmount || 0,
          approvedAmount: 0,
          isApproved: false,
          rejectionReason: reason,
          approverName: user?.full_name || user?.name || 'Superadmin'
        });
      } catch (syncErr) {
        console.warn('Sync notification error:', syncErr);
      }
      toast.info('Discount request has been rejected');
      await loadDetails();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to reject discount');
    } finally {
      setSubmittingDiscount(false);
    }
  };

  const handleOfferDiscountSubmit = async (e) => {
    e.preventDefault();
    const amount = Number(discountForm.discountAmount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid discount amount greater than 0');
      return;
    }

    const reason = discountForm.discountReason === 'Other' 
      ? (discountForm.customReason || 'Special Concession')
      : discountForm.discountReason;

    try {
      setSubmittingDiscount(true);
      const originalFees = Number(student.originalFees) || Number(student.totalFees) || (amount + Number(student.totalFees));
      await studentService.offerDiscount(student.id, {
        discount_amount: amount,
        discount_reason: reason,
        original_fees: originalFees
      });

      if (isSuperAdmin) {
        toast.success(`Discount of ₹${amount.toLocaleString()} granted and approved by Superadmin!`);
      } else {
        notificationService.addNotification({
          id: `NTF-DISC-${student.id}`,
          title: `🔔 Fee Concession Approval: ${student.name}`,
          type: 'discount_approval',
          category: 'Discount & Fees',
          priority: 'High',
          author: user?.full_name || user?.name || 'Admission Desk',
          details: `${user?.full_name || user?.name || 'Staff'} recommended a concession of ₹${amount.toLocaleString()} for ${student.name}. Superadmin approval is required before student ledger updates.`,
          read: false,
          forSuperAdminOnly: true,
          studentId: student.id,
          studentName: student.name,
          discountAmount: amount,
          recommendedBy: user?.full_name || user?.name
        });
        toast.info(`Discount of ₹${amount.toLocaleString()} submitted. Final approval must be given by the Superadmin.`);
      }
      setDiscountModalOpen(false);
      await loadDetails();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit discount request');
    } finally {
      setSubmittingDiscount(false);
    }
  };

  if (loading) return <Loader fullPage message="Loading student profile..." />;
  if (!student) return <div className="p-4 text-center">Student record not found.</div>;

  const totalFees = feeDetails?.total_fees ?? student.totalFees ?? 0;
  const originalFees = student.originalFees || (student.discountAmount ? totalFees + student.discountAmount : totalFees);
  const paidFees = feeDetails?.amount_paid ?? 0;
  const pendingFees = feeDetails?.pending_fees ?? Math.max(0, totalFees - paidFees);

  const admissionsList = student.admissions?.length > 0
    ? student.admissions
    : (feeDetails?.admissions?.length > 0 ? feeDetails.admissions : []);
  const isTwoYear = Boolean(
    student.admissionType?.includes('Two-Year') ||
    student.admissionType?.includes('11th + 12th') ||
    admissionsList.length > 1
  );
  const is11th = Boolean(
    (student.standard || '').includes('11') ||
    (student.academicBatch || '').includes('11th') ||
    (student.batch || '').includes('11th')
  );
  const canConvertToTwoYear = !isTwoYear && is11th;

  return (
    <div className="d-flex flex-column gap-4">
      <div>
        <button
          type="button"
          className="btn btn-link p-0 d-inline-flex align-items-center gap-1 small text-sa-muted mb-2 text-decoration-none"
          onClick={() => navigate('/admin/students')}
        >
          <ArrowLeft size={16} /> Back to Directory
        </button>
        <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
          <div>
            <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
              {student.name}
            </h3>
            <div className="d-flex align-items-center gap-2 mt-1 flex-wrap">
              <span className="small text-sa-muted">
                Roll No: <strong className="text-sa-primary">{student.rollNumber}</strong> • Class: {student.standard || 'N/A'}
              </span>
              <span className="badge bg-light text-sa-charcoal border px-2 py-0.5 rounded-pill small fw-bold">
                📍 {formatStudentBatchDisplay(student)}
              </span>
              {isTwoYear ? (
                <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2.5 py-0.5 rounded-pill small fw-bold d-inline-flex align-items-center gap-1">
                  <Layers size={13} />
                  11th + 12th Two-Year Admission
                </span>
              ) : (
                <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle px-2 py-0.5 rounded-pill small">
                  {student.admissionType || (student.standard?.includes('12') ? '12th Standard Only' : '11th Standard Only')}
                </span>
              )}
              {student.profileCompleted ? (
                <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-0.5 rounded-pill small">
                  Profile Complete ✓
                </span>
              ) : (
                <span className="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 px-2 py-0.5 rounded-pill small">
                  Pending Student Profile Entry
                </span>
              )}
            </div>
          </div>

          <div className="d-flex gap-2 flex-wrap">
            {canConvertToTwoYear && (
              <Button
                variant="outline"
                className="border-primary text-primary fw-semibold d-inline-flex align-items-center gap-1.5"
                onClick={() => {
                  const y1Batch = student.academicBatch || student.batch || '11th PCM';
                  let y2Batch = '12th PCM';
                  if (y1Batch.toLowerCase().includes('pcmb')) y2Batch = '12th PCMB';
                  else if (y1Batch.toLowerCase().includes('pcb')) y2Batch = '12th PCB';
                  setConversionForm(prev => ({
                    ...prev,
                    secondYearAcademicBatch: y2Batch,
                    secondYearSession: student.session || ''
                  }));
                  setConvertModalOpen(true);
                }}
              >
                <Layers size={16} />
                <span>Convert to Two-Year</span>
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate('/admin/fees')}>
              Collect Fee
            </Button>
            <Button variant="primary" onClick={() => navigate('/admin/marks/entry')}>
              Record Marks
            </Button>
          </div>
        </div>
      </div>

      {/* Profile Overview Card */}
      <div className="row g-3">
        <div className="col-12 col-lg-4">
          <div className="sa-card p-4 h-100">
            <h6 className="fw-bold text-sa-charcoal mb-3 fs-6">Personal & Contact Info</h6>
            <div className="d-flex flex-column gap-2 small">
              <div className="d-flex align-items-center gap-2 text-sa-muted">
                <Mail size={16} className="text-sa-primary flex-shrink-0" />
                <span className="text-truncate">{student.email || 'Email pending student entry'}</span>
              </div>
              <div className="d-flex align-items-center gap-2 text-sa-muted">
                <Phone size={16} className="text-sa-primary flex-shrink-0" />
                <span>{student.phone} <small className="text-muted">(Student Mobile)</small></span>
              </div>
              <div className="d-flex align-items-start gap-2 text-sa-muted">
                <MapPin size={16} className="text-sa-primary flex-shrink-0 mt-1" />
                <span>{student.address || 'Kolhapur, Maharashtra'}</span>
              </div>
              {student.date_of_birth && (
                <div className="d-flex align-items-center gap-2 text-sa-muted">
                  <CalendarCheck size={16} className="text-sa-primary flex-shrink-0" />
                  <span>DOB: {new Date(student.date_of_birth).toLocaleDateString()} ({student.gender || 'N/A'})</span>
                </div>
              )}
            </div>

            <hr className="my-3 opacity-25" />

            <h6 className="fw-bold text-sa-charcoal mb-2 fs-6">Parent Details (SMS Alert)</h6>
            <p className="small text-sa-muted mb-1">
              <strong>Parent Name:</strong> {student.parent_name || student.parentName || 'Pending student entry'}
            </p>
            <p className="small text-sa-muted mb-0">
              <strong>Emergency / Alert Phone:</strong> {student.parent_mobile || student.parentPhone || '+91 98220 00000'}
            </p>

            <hr className="my-3 opacity-25" />

            <h6 className="fw-bold text-sa-charcoal mb-2 fs-6">Admission Placement Details</h6>
            <p className="small text-sa-muted mb-1">
              <strong>Program:</strong> <span className="fw-bold text-dark">{student.admissionType || (isTwoYear ? '11th + 12th Standard (Two-Year Admission)' : (student.standard?.includes('12') ? '12th Standard Only' : '11th Standard Only'))}</span>
            </p>
            <p className="small text-sa-muted mb-1">
              <strong>Branch:</strong> <span className="fw-bold text-dark">{student.branch || 'Tarabai Park'}</span>
            </p>
            <p className="small text-sa-muted mb-1">
              <strong>Academic Batch:</strong> <span className="fw-bold text-dark">{student.academicBatch || student.academic_batch || student.batch || student.standard || '11th PCM'}</span>
            </p>
            {student.session && (
              <p className="small text-sa-muted mb-1">
                <strong>Session:</strong> <span className="badge bg-primary-subtle text-primary border border-primary-subtle">{student.session}</span>
              </p>
            )}
            {isTwoYear && admissionsList[1] && (
              <p className="small text-sa-muted mb-1">
                <strong>Linked Year 2 Batch:</strong> <span className="badge bg-info-subtle text-info-emphasis border border-info-subtle">{admissionsList[1].academic_batch || admissionsList[1].batch || '12th Science'}</span>
              </p>
            )}
            <p className="small text-sa-muted mb-0">
              <strong>Placement Summary:</strong> <span className="badge bg-dark text-white ms-1">{formatStudentBatchDisplay(student)}</span>
            </p>
          </div>
        </div>

        {/* Academics & Fees Summary */}
        <div className="col-12 col-lg-8">
          <div className="row g-3">
            <div className="col-12 col-sm-6">
              <div className="sa-card p-4">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="small text-sa-muted fw-semibold">ATTENDANCE LOG</span>
                  <CalendarCheck size={20} className="text-success" />
                </div>
                <h3 className="brand-font fw-bold text-sa-charcoal m-0 fs-3">
                  {student.attendancePercent || 0}%
                </h3>
                <span className="small text-sa-muted">
                  Total gate attendance taps verified this term
                </span>
              </div>
            </div>

            <div className="col-12 col-sm-6">
              <div className="sa-card p-4">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="small text-sa-muted fw-semibold">FEE LEDGER</span>
                  <CreditCard size={20} className="text-sa-primary" />
                </div>
                <h3 className="brand-font fw-bold text-sa-charcoal m-0 fs-3">
                  ₹ {paidFees.toLocaleString()} / ₹ {totalFees.toLocaleString()}
                </h3>
                <div className="d-flex justify-content-between align-items-center mt-1 flex-wrap gap-1">
                  <span className="small text-sa-muted">
                    Outstanding Due: <strong className={pendingFees > 0 ? 'text-danger' : 'text-success'}>₹ {pendingFees.toLocaleString()}</strong>
                  </span>
                  <span className="small text-sa-muted">
                    Status: <strong className="text-success">{student.feesStatus || (pendingFees <= 0 ? 'Paid' : 'Pending')}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Linked Academic Admissions (Multi-Year Admission Breakdown) */}
            {admissionsList.length > 0 && (
              <div className="col-12">
                <div className="sa-card p-4 border" style={{ backgroundColor: '#FAFBFD' }}>
                  <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-2 mb-3 pb-2 border-bottom">
                    <div className="d-flex align-items-center gap-2">
                      <Layers size={20} className="text-sa-primary" />
                      <div>
                        <h6 className="brand-font fw-bold text-sa-charcoal m-0 fs-6">
                          Linked Academic Programs ({admissionsList.length} Academic {admissionsList.length === 1 ? 'Year' : 'Years'})
                        </h6>
                        <small className="text-muted">
                          Multi-year fee breakdown and status records for Student ID: <strong>{student.rollNumber}</strong>
                        </small>
                      </div>
                    </div>
                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-1.5 rounded-pill fw-semibold small">
                      🎓 {student.admissionType || (admissionsList.length > 1 ? 'Two-Year Admission' : 'Standard Admission')}
                    </span>
                  </div>

                  <div className="row g-3">
                    {admissionsList.map((adm, idx) => {
                      const isYear1 = idx === 0 || (adm.standard || '').includes('11');
                      const isUpcoming = adm.status === 'Upcoming';

                      return (
                        <div key={adm.admission_id || idx} className="col-12 col-md-6">
                          <div
                            className="p-3.5 rounded-3 border bg-white h-100 shadow-xs position-relative"
                            style={{
                              borderLeft: isUpcoming ? '4px solid #F59E0B' : '4px solid #168554'
                            }}
                          >
                            <div className="d-flex align-items-center justify-content-between mb-2 pb-2 border-bottom">
                              <div>
                                <span className="badge bg-light text-sa-charcoal border me-2 small fw-bold">
                                  {isYear1 ? 'Year 1' : 'Year 2'}
                                </span>
                                <strong className="text-sa-charcoal">{adm.standard}</strong>
                              </div>
                              <span
                                className={`badge ${
                                  isUpcoming
                                    ? 'bg-warning-subtle text-warning-emphasis border border-warning-subtle'
                                    : 'bg-success-subtle text-success border border-success-subtle'
                                } rounded-pill px-2.5 py-1 small`}
                              >
                                ● {isUpcoming ? 'Upcoming' : 'Active'}
                              </span>
                            </div>

                            <div className="small text-muted mb-2">
                              <div><strong>Academic Batch:</strong> {adm.academic_batch || adm.batch}</div>
                              <div><strong>Academic Year:</strong> {adm.academic_year} • <strong>Campus:</strong> {adm.branch || student.branch}</div>
                              {adm.admission_id && (
                                <div className="text-secondary mt-1" style={{ fontSize: '11px' }}>
                                  Admission Ref: <code>{adm.admission_id}</code>
                                </div>
                              )}
                            </div>

                            <div className="p-2 rounded bg-light border text-muted small" style={{ fontSize: '11.5px' }}>
                              <span>Academic Enrollment: <strong>{isYear1 ? 'Primary Curriculum (Year 1)' : 'Linked Continuation (Year 2)'}</strong></span>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Single Combined Fee Ledger Summary */}
                    <div className="col-12">
                      <div className="p-3 rounded-2 border bg-white small">
                        <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                          <span className="fw-bold text-sa-charcoal d-flex align-items-center gap-1.5">
                            <CreditCard size={15} className="text-sa-primary" />
                            <span>Combined Two-Year Course Fee Ledger (Single Combined Amount)</span>
                          </span>
                          <span className="badge bg-success-subtle text-success border border-success-subtle">
                            Unified Ledger
                          </span>
                        </div>
                        <div className="row g-2 text-center">
                          <div className="col-6 col-md-3">
                            <span className="text-muted d-block" style={{ fontSize: '11px' }}>Combined Course Fee</span>
                            <span className="fw-semibold text-secondary" style={{ fontSize: '14px' }}>₹{Number(originalFees).toLocaleString()}</span>
                          </div>
                          <div className="col-6 col-md-3">
                            <span className="text-muted d-block" style={{ fontSize: '11px' }}>Total Concession</span>
                            <span className="fw-bold text-success" style={{ fontSize: '14px' }}>
                              {student.discountAmount > 0 ? `- ₹${Number(student.discountAmount).toLocaleString()}` : '₹0'}
                            </span>
                          </div>
                          <div className="col-6 col-md-3">
                            <span className="text-muted d-block" style={{ fontSize: '11px' }}>Final Net Payable Fee</span>
                            <span className="fw-extrabold text-sa-charcoal" style={{ fontSize: '14px' }}>₹{Number(totalFees).toLocaleString()}</span>
                          </div>
                          <div className="col-6 col-md-3">
                            <span className="text-muted d-block" style={{ fontSize: '11px' }}>Total Remaining Balance</span>
                            <span className={`fw-extrabold ${pendingFees > 0 ? 'text-danger' : 'text-success'}`} style={{ fontSize: '14px' }}>
                              ₹{Number(pendingFees).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Student Discount Approval Card */}
            <div className="col-12">
              <div className="sa-card p-4 border" style={{ backgroundColor: '#FDFBFB' }}>
                <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2 mb-3">
                  <div className="d-flex align-items-center gap-2">
                    <Tag size={18} style={{ color: '#8B1216' }} />
                    <h6 className="brand-font fw-bold text-sa-charcoal m-0 fs-6">
                      Student Discount & Superadmin Approval
                    </h6>
                  </div>

                  {student.discountStatus !== 'PENDING' && (
                    <button
                      type="button"
                      className="btn btn-sm d-inline-flex align-items-center gap-1 fw-semibold"
                      style={{ color: '#8B1216', backgroundColor: '#FDF0F0', border: '1px solid #FECACA', borderRadius: '6px' }}
                      onClick={() => {
                        setDiscountForm({
                          discountAmount: student.discountAmount || '',
                          discountReason: student.discountReason || 'Academic Merit Scholarship',
                          customReason: ''
                        });
                        setDiscountModalOpen(true);
                      }}
                    >
                      <Plus size={14} />
                      <span>{student.discountAmount > 0 ? 'Revise / Offer New Discount' : 'Offer Discount'}</span>
                    </button>
                  )}
                </div>

                {/* Scenario 1: Approved Discount */}
                {student.discountStatus === 'APPROVED' && (
                  <div className="p-3 rounded-3 border" style={{ backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }}>
                    <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3">
                      <div>
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <span className="badge d-inline-flex align-items-center gap-1 py-1.5 px-2.5" style={{ backgroundColor: '#168554', color: '#fff', fontSize: '12px' }}>
                            <ShieldCheck size={14} />
                            Discount Approved
                          </span>
                          <span className="fw-bold" style={{ color: '#168554', fontSize: '15px' }}>
                            - ₹{Number(student.discountAmount).toLocaleString()} Concession Applied
                          </span>
                        </div>
                        <div className="small text-secondary mt-1">
                          <span><strong>Reason:</strong> {student.discountReason || 'Academic Scholarship'}</span>
                          {(student.discountRecommendedBy || student.discountOfferedBy) && (
                            <span className="ms-3 text-muted">• Recommended by: <strong>{student.discountRecommendedBy || student.discountOfferedBy}</strong></span>
                          )}
                        </div>
                      </div>

                      {/* Prominent display of who approved it */}
                      <div className="text-md-end p-2 px-3 rounded-2 bg-white border" style={{ minWidth: '220px' }}>
                        <span className="text-muted d-block" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Final Approval Authority
                        </span>
                        <div className="d-flex align-items-center gap-1.5 justify-content-md-end text-success fw-bold" style={{ fontSize: '13.5px' }}>
                          <CheckCircle2 size={16} />
                          <span>{student.discountApprovedBy || 'Shubham Sharma (Superadmin)'}</span>
                        </div>
                        {student.discountApprovedAt && (
                          <span className="text-muted d-block" style={{ fontSize: '11px' }}>
                            {new Date(student.discountApprovedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="row g-2 mt-2 pt-2 border-top small" style={{ borderColor: '#DCFCE7' }}>
                      <div className="col-4">
                        <span className="text-muted d-block">Original Course Fee:</span>
                        <span className="fw-semibold text-secondary">₹{Number(originalFees).toLocaleString()}</span>
                      </div>
                      <div className="col-4">
                        <span className="text-muted d-block">Approved Discount:</span>
                        <span className="fw-bold text-success">- ₹{Number(student.discountAmount).toLocaleString()}</span>
                      </div>
                      <div className="col-4">
                        <span className="text-muted d-block">Net Payable Fee:</span>
                        <span className="fw-bold text-sa-charcoal">₹{Number(totalFees).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Scenario 2: Pending Approval */}
                {student.discountStatus === 'PENDING' && (
                  <div className="p-3 rounded-3 border" style={{ backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }}>
                    <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3">
                      <div>
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <span className="badge d-inline-flex align-items-center gap-1 py-1.5 px-2.5" style={{ backgroundColor: '#D97706', color: '#fff', fontSize: '12px' }}>
                            <Clock size={14} />
                            Pending Superadmin Approval
                          </span>
                          <span className="fw-bold" style={{ color: '#B45309', fontSize: '15px' }}>
                            ₹{Number(student.discountAmount).toLocaleString()} Proposed
                          </span>
                        </div>
                        <div className="small text-secondary mt-1">
                          <span><strong>Reason:</strong> {student.discountReason || 'Fee Concession'}</span>
                          <span className="ms-3 text-muted">• Recommended by: <strong>{student.discountRecommendedBy || student.discountOfferedBy || 'Miss Shilpa'}</strong></span>
                        </div>
                        <div className="alert alert-warning py-1.5 px-2.5 mb-0 mt-2 small d-inline-flex align-items-center gap-1.5" style={{ fontSize: '12px', border: '1px solid #FCD34D' }}>
                          <AlertTriangle size={14} className="text-warning flex-shrink-0" />
                          <span>The final approval must be given by the <strong>Superadmin</strong> before this discount is applied to the student's ledger.</span>
                        </div>
                      </div>

                      {/* Approval Actions (Active for Superadmin) */}
                      <div className="d-flex flex-column gap-2" style={{ minWidth: '180px' }}>
                        {isSuperAdmin ? (
                          <>
                            <Button
                              variant="primary"
                              size="sm"
                              icon={CheckCircle2}
                              loading={submittingDiscount}
                              onClick={handleApproveDiscount}
                              style={{ backgroundColor: '#168554', borderColor: '#168554' }}
                            >
                              Approve Discount
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              icon={XCircle}
                              loading={submittingDiscount}
                              onClick={handleRejectDiscount}
                              className="text-danger border-danger"
                            >
                              Reject
                            </Button>
                          </>
                        ) : (
                          <div className="text-center p-2 rounded bg-white border text-muted small" style={{ fontSize: '11.5px' }}>
                            <span className="d-block fw-semibold text-sa-charcoal">Superadmin Action Required</span>
                            <span>Awaiting review</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Scenario 3: Rejected */}
                {student.discountStatus === 'REJECTED' && (
                  <div className="p-3 rounded-3 border" style={{ backgroundColor: '#FEF2F2', borderColor: '#FECACA' }}>
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <span className="badge bg-danger d-inline-flex align-items-center gap-1">
                        <XCircle size={14} /> Discount Rejected
                      </span>
                      <span className="small text-muted">
                        Reason: {student.discountRejectionReason || 'Rejected per academy guidelines'}
                      </span>
                    </div>
                    <span className="small text-muted d-block mt-1">
                      Original course fees of ₹{Number(totalFees).toLocaleString()} remain fully applicable.
                    </span>
                  </div>
                )}

                {/* Scenario 4: No Discount offered yet */}
                {(!student.discountStatus || student.discountStatus === 'NONE') && !student.discountAmount && (
                  <div className="text-muted small py-2 d-flex align-items-center justify-content-between">
                    <span>No scholarship or fee discount currently applied for this student.</span>
                    <button
                      type="button"
                      className="btn btn-link p-0 text-decoration-none fw-semibold small"
                      style={{ color: '#8B1216' }}
                      onClick={() => setDiscountModalOpen(true)}
                    >
                      + Offer Student Discount
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Exam Results Table */}
            <div className="col-12">
              <div className="sa-card p-4">
                <h6 className="brand-font fw-bold text-sa-charcoal mb-3 fs-6">
                  Published Examination Records
                </h6>
                <div className="table-responsive">
                  <table className="table table-sm sa-table mb-0">
                    <thead>
                      <tr>
                        <th>Exam Title</th>
                        <th>Subject</th>
                        <th>Max</th>
                        <th>Obtained</th>
                        <th>%</th>
                        <th>Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center py-3 text-muted">
                            No exam marks recorded yet.
                          </td>
                        </tr>
                      ) : (
                        results.map((r, i) => (
                          <tr key={i}>
                            <td className="fw-semibold">{r.examTitle}</td>
                            <td>{r.subject}</td>
                            <td>{r.maxMarks}</td>
                            <td className="fw-bold text-sa-primary">{r.obtainedMarks}</td>
                            <td>{r.percentage}%</td>
                            <td>
                              <span className="badge bg-success small">{r.grade}</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Offer Discount Modal */}
      <Modal
        isOpen={discountModalOpen}
        onClose={() => setDiscountModalOpen(false)}
        title="Offer Student Fee Discount"
      >
        <form onSubmit={handleOfferDiscountSubmit} className="d-flex flex-column gap-3">
          <div className="alert alert-light border small p-2.5 mb-1">
            <div className="d-flex justify-content-between mb-1">
              <span className="text-muted">Student:</span>
              <strong className="text-sa-charcoal">{student.name} ({student.rollNumber})</strong>
            </div>
            <div className="d-flex justify-content-between">
              <span className="text-muted">Base Course Fee:</span>
              <strong className="text-sa-charcoal">₹{Number(originalFees).toLocaleString()}</strong>
            </div>
          </div>

          <Input
            label="Discount Concession Amount (₹)"
            type="number"
            min="100"
            max={originalFees}
            value={discountForm.discountAmount}
            onChange={(e) => setDiscountForm({ ...discountForm, discountAmount: e.target.value })}
            placeholder="e.g. 5000"
            required
          />

          <div className="mb-1">
            <label className="form-label small fw-semibold text-sa-charcoal mb-1">
              Discount / Scholarship Reason
            </label>
            <select
              className="form-select form-select-sm"
              value={discountForm.discountReason}
              onChange={(e) => setDiscountForm({ ...discountForm, discountReason: e.target.value })}
            >
              <option value="Academic Merit Scholarship">Academic Merit Scholarship (90%+ 10th)</option>
              <option value="Economically Weaker Section (EWS) Concession">Economically Weaker Section (EWS) Concession</option>
              <option value="Sibling Concession">Sibling Concession (Sibling enrolled in Academy)</option>
              <option value="Staff Ward Discount">Staff / Faculty Ward Concession</option>
              <option value="Early Bird Registration Offer">Early Bird Registration Offer</option>
              <option value="Sports & Extra-Curricular Achievement">Sports & Extra-Curricular Achievement</option>
              <option value="Other">Other (Custom Reason)</option>
            </select>
          </div>

          {discountForm.discountReason === 'Other' && (
            <Input
              label="Specify Custom Reason"
              value={discountForm.customReason}
              onChange={(e) => setDiscountForm({ ...discountForm, customReason: e.target.value })}
              placeholder="Enter concession details..."
              required
            />
          )}

          {/* Role-based notice */}
          <div className="p-2.5 rounded-2 small" style={{ backgroundColor: isSuperAdmin ? '#F0FDF4' : '#FEF8EB', border: isSuperAdmin ? '1px solid #BBF7D0' : '1px solid #FDE68A' }}>
            {isSuperAdmin ? (
              <div className="d-flex align-items-center gap-2 text-success">
                <ShieldCheck size={16} className="flex-shrink-0" />
                <span>You are logged in as <strong>Superadmin</strong>. This discount will be instantly approved under your credentials.</span>
              </div>
            ) : (
              <div className="d-flex align-items-center gap-2 text-warning">
                <AlertTriangle size={16} className="flex-shrink-0 text-warning" />
                <span><strong>Superadmin Approval Policy:</strong> As an Admin, this discount will be submitted with status <em>Pending Superadmin Approval</em>. The final approval must be given by the Superadmin.</span>
              </div>
            )}
          </div>

          {discountForm.discountAmount > 0 && (
            <div className="d-flex justify-content-between p-2 rounded bg-light border small fw-bold">
              <span>Net Fee After Discount:</span>
              <span className="text-sa-primary">₹{Math.max(0, originalFees - Number(discountForm.discountAmount)).toLocaleString()}</span>
            </div>
          )}

          <div className="d-flex justify-content-end gap-2 mt-2 pt-2 border-top">
            <Button variant="light" type="button" onClick={() => setDiscountModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={submittingDiscount}>
              {isSuperAdmin ? 'Grant & Approve Discount' : 'Submit for Superadmin Approval'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Convert to Two-Year Admission Modal */}
      <Modal
        isOpen={convertModalOpen}
        onClose={() => setConvertModalOpen(false)}
        title="Convert to Two-Year Integrated Admission"
      >
        {(() => {
          const convBranch = student.branch || 'Tarabai Park';
          const convY1Batch = student.academicBatch || student.batch || '11th PCM';
          const convFee1 = Number(student.originalFees) || getCatalogFee(convBranch, convY1Batch, '11th Science');
          const convFee2 = getCatalogFee(convBranch, conversionForm.secondYearAcademicBatch, '12th Science');
          const convGross = convFee1 + convFee2;
          const convVal = Number(conversionForm.concessionValue) || 0;
          let convDisc = 0;
          if (conversionForm.concessionType === 'percentage') {
            convDisc = Math.round((convGross * convVal) / 100);
          } else {
            convDisc = convVal;
          }
          convDisc = Math.min(convGross, Math.max(0, convDisc));
          const convFinal = Math.max(0, convGross - convDisc);
          const convPaid = paidFees;
          const convRemaining = Math.max(0, convFinal - convPaid);

          return (
            <form onSubmit={handleConversionSubmit} className="d-flex flex-column gap-3">
              {/* Student Summary Banner */}
              <div className="p-2.5 rounded-2 bg-light border small">
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted">Student Name & Roll No:</span>
                  <strong className="text-sa-charcoal">{student.name} ({student.rollNumber})</strong>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted">Campus & Current 11th Program:</span>
                  <span className="fw-semibold text-secondary">{convBranch} • {convY1Batch}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Current Payments Logged:</span>
                  <span className="fw-bold text-success">₹{convPaid.toLocaleString()} (Fully Preserved)</span>
                </div>
              </div>

              {/* 12th Academic Batch Stream Selection */}
              <div>
                <label className="form-label small fw-semibold text-sa-charcoal mb-1">
                  12th Standard Academic Stream & Batch *
                </label>
                <select
                  className="form-select form-select-sm"
                  value={conversionForm.secondYearAcademicBatch}
                  onChange={(e) => setConversionForm({ ...conversionForm, secondYearAcademicBatch: e.target.value })}
                  required
                >
                  <option value="12th PCM">12th PCM (Physics, Chemistry, Mathematics)</option>
                  <option value="12th PCB">12th PCB (Physics, Chemistry, Biology)</option>
                  <option value="12th PCMB">12th PCMB (Physics, Chemistry, Maths, Biology)</option>
                </select>
                <small className="text-muted">
                  A linked 12th Standard admission record will be created under this student's profile.
                </small>
              </div>

              {/* Concession Type Selector */}
              <div>
                <label className="form-label small fw-semibold text-sa-charcoal mb-1">
                  Two-Year Concession Discount Type
                </label>
                <div className="btn-group w-100" role="group">
                  <button
                    type="button"
                    className={`btn btn-sm ${conversionForm.concessionType === 'fixed' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setConversionForm({ ...conversionForm, concessionType: 'fixed', concessionValue: 10000 })}
                  >
                    Fixed ₹ Amount
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${conversionForm.concessionType === 'percentage' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setConversionForm({ ...conversionForm, concessionType: 'percentage', concessionValue: 10 })}
                  >
                    Percentage (%)
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${conversionForm.concessionType === 'custom' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setConversionForm({ ...conversionForm, concessionType: 'custom', concessionValue: 15000 })}
                  >
                    Custom Concession
                  </button>
                </div>
              </div>

              {/* Concession Value Input */}
              <div>
                <Input
                  label={conversionForm.concessionType === 'percentage' ? 'Concession Percentage (%)' : 'Concession Amount (₹)'}
                  type="number"
                  min="0"
                  max={conversionForm.concessionType === 'percentage' ? 50 : convGross}
                  value={conversionForm.concessionValue}
                  onChange={(e) => setConversionForm({ ...conversionForm, concessionValue: e.target.value })}
                  placeholder={conversionForm.concessionType === 'percentage' ? 'e.g. 10' : 'e.g. 10000'}
                  required
                />
                <div className="d-flex gap-1.5 mt-1.5 flex-wrap">
                  {conversionForm.concessionType === 'percentage' ? (
                    [5, 10, 15, 20].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        className="btn btn-xs btn-outline-secondary py-0.5 px-2 rounded-pill"
                        style={{ fontSize: '11px' }}
                        onClick={() => setConversionForm({ ...conversionForm, concessionValue: pct })}
                      >
                        {pct}%
                      </button>
                    ))
                  ) : (
                    [5000, 10000, 15000, 20000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        className="btn btn-xs btn-outline-secondary py-0.5 px-2 rounded-pill"
                        style={{ fontSize: '11px' }}
                        onClick={() => setConversionForm({ ...conversionForm, concessionValue: amt })}
                      >
                        ₹{amt.toLocaleString()}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Concession Reason Dropdown */}
              <div>
                <label className="form-label small fw-semibold text-sa-charcoal mb-1">
                  Concession Reason / Category
                </label>
                <select
                  className="form-select form-select-sm"
                  value={conversionForm.concessionReason}
                  onChange={(e) => setConversionForm({ ...conversionForm, concessionReason: e.target.value })}
                >
                  <option value="Two-Year Integrated Package Discount">Two-Year Integrated Package Discount</option>
                  <option value="Academic Merit Scholarship (Two-Year)">Academic Merit Scholarship (Two-Year)</option>
                  <option value="Sibling Two-Year Concession">Sibling Two-Year Concession</option>
                  <option value="Early Enrolment Multi-Year Benefit">Early Enrolment Multi-Year Benefit</option>
                  <option value="Other">Other (Custom Reason)</option>
                </select>
              </div>

              {conversionForm.concessionReason === 'Other' && (
                <Input
                  label="Specify Concession Reason"
                  value={conversionForm.customReason}
                  onChange={(e) => setConversionForm({ ...conversionForm, customReason: e.target.value })}
                  placeholder="Enter details..."
                  required
                />
              )}

              {/* Combined Fee Calculation Preview Card */}
              <div className="p-3 rounded-2 border bg-white small">
                <div className="fw-bold text-sa-charcoal mb-2 d-flex align-items-center gap-1.5">
                  <Sparkles size={15} className="text-sa-primary" />
                  <span>Two-Year Combined Fee Calculation Preview (Single Amount)</span>
                </div>
                <div className="row g-2">
                  <div className="col-12 d-flex justify-content-between text-secondary">
                    <span>Combined Course Fee (Gross):</span>
                    <strong>₹{convGross.toLocaleString()}</strong>
                  </div>
                  <div className="col-12 d-flex justify-content-between text-success">
                    <span>Approved Concession ({conversionForm.concessionType}):</span>
                    <strong>- ₹{convDisc.toLocaleString()}</strong>
                  </div>
                  <div className="col-12 d-flex justify-content-between text-sa-charcoal fw-bold pt-1 border-top">
                    <span>Final Net Course Fee (Single Combined Amount):</span>
                    <span className="text-success fs-6">₹{convFinal.toLocaleString()}</span>
                  </div>
                  <div className="col-12 d-flex justify-content-between text-muted">
                    <span>Previous Paid Payments (Preserved):</span>
                    <span className="text-success fw-bold">- ₹{convPaid.toLocaleString()}</span>
                  </div>
                  <div className="col-12 d-flex justify-content-between pt-1 border-top">
                    <span className="fw-bold text-danger">New Outstanding Balance:</span>
                    <span className="fw-extrabold text-danger fs-6">₹{convRemaining.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Role Notice */}
              <div className="p-2.5 rounded-2 small" style={{ backgroundColor: isSuperAdmin ? '#F0FDF4' : '#FEF8EB', border: isSuperAdmin ? '1px solid #BBF7D0' : '1px solid #FDE68A' }}>
                {isSuperAdmin ? (
                  <div className="d-flex align-items-center gap-2 text-success">
                    <ShieldCheck size={16} className="flex-shrink-0" />
                    <span>You are logged in as <strong>Superadmin</strong>. The Two-Year admission and concession will be approved instantly.</span>
                  </div>
                ) : (
                  <div className="d-flex align-items-center gap-2 text-warning">
                    <AlertTriangle size={16} className="flex-shrink-0 text-warning" />
                    <span><strong>Superadmin Approval Policy:</strong> As an Admin, this multi-year concession will be logged with status <em>Pending Superadmin Approval</em>.</span>
                  </div>
                )}
              </div>

              <div className="d-flex justify-content-end gap-2 mt-2 pt-2 border-top">
                <Button variant="light" type="button" onClick={() => setConvertModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" loading={converting} icon={Layers}>
                  Confirm & Convert to Two-Year
                </Button>
              </div>
            </form>
          );
        })()}
      </Modal>
    </div>
  );
}
