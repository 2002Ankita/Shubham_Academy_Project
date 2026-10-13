import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import studentService from '../../services/studentService';
import marksService from '../../services/marksService';
import feeService from '../../services/feeService';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-toastify';
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
  Clock
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

  const isSuperAdmin = (user?.role || '').toLowerCase().replace('-', '_').includes('super_admin');

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
      await studentService.approveDiscount(student.id);
      toast.success(`Discount approved successfully by Superadmin (${user?.name})!`);
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
            <span className="small text-sa-muted">
              Roll No: <strong className="text-sa-primary">{student.rollNumber}</strong> • RFID UID: {student.rfid_tag || student.rfidCard || 'N/A'} • Class: {student.standard}
            </span>
          </div>

          <div className="d-flex gap-2">
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
                <span className="text-truncate">{student.email}</span>
              </div>
              <div className="d-flex align-items-center gap-2 text-sa-muted">
                <Phone size={16} className="text-sa-primary flex-shrink-0" />
                <span>{student.phone}</span>
              </div>
              <div className="d-flex align-items-start gap-2 text-sa-muted">
                <MapPin size={16} className="text-sa-primary flex-shrink-0 mt-1" />
                <span>{student.address || 'Kolhapur, Maharashtra'}</span>
              </div>
            </div>

            <hr className="my-3 opacity-25" />

            <h6 className="fw-bold text-sa-charcoal mb-2 fs-6">Parent Details (SMS Alert)</h6>
            <p className="small text-sa-muted mb-1">
              <strong>Parent:</strong> {student.parent_name || student.parentName || 'Parent / Guardian'}
            </p>
            <p className="small text-sa-muted mb-0">
              <strong>Emergency / Alert:</strong> {student.parent_mobile || student.parentPhone || '+91 98220 00000'}
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
                  {student.attendancePercent || 94.2}%
                </h3>
                <span className="small text-sa-muted">
                  Total RFID gate taps verified this term
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
                <span className="small text-sa-muted">
                  Outstanding Due: <strong className={pendingFees > 0 ? 'text-danger' : 'text-success'}>₹ {pendingFees.toLocaleString()}</strong>
                </span>
              </div>
            </div>

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
    </div>
  );
}
