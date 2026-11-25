import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  CheckCircle2,
  Clock,
  FileText,
  GraduationCap,
  Phone,
  Mail,
  Building2,
  IndianRupee,
  ShieldCheck,
  AlertCircle,
  UserCheck
} from 'lucide-react';
import studentService from '../../services/studentService';
import notificationService from '../../services/notificationService';
import { ADMISSION_TERMS_AND_CONDITIONS } from '../../utils/admissionTerms';

export default function AdmissionConfirmation() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [student, setStudent] = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [acceptedBy, setAcceptedBy] = useState('Father');
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await studentService.getAdmissionConfirmation(token);
        setStudent(data);
        if (data?.admission_confirmation_status === 'CONFIRMED') {
          setTermsAccepted(true);
        }
      } catch (err) {
        console.error('Failed to load admission confirmation:', err);
        setError(err?.response?.data?.detail || 'Invalid or expired admission confirmation link.');
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchDetails();
  }, [token]);

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (!termsAccepted) {
      toast.warning('Please check the box to accept the Terms & Conditions before confirming admission.');
      return;
    }

    setSubmitting(true);
    try {
      const updated = await studentService.acceptAdmissionConfirmation(token, {
        terms_accepted: true,
        accepted_by: acceptedBy,
        remarks: remarks.trim() || undefined
      });
      setStudent(updated);
      notificationService.notifyAdmissionConfirmedByParent(updated);
      toast.success('Admission confirmed! Thank you for accepting the Terms & Conditions.');
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to confirm admission. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-vh-100 d-flex flex-column align-items-center justify-content-center p-4" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="spinner-border text-danger mb-3" role="status" />
        <p className="text-muted fw-medium">Loading admission & inquiry details...</p>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center p-4" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5 text-center" style={{ maxWidth: '520px', width: '100%' }}>
          <AlertCircle size={48} className="text-danger mx-auto mb-3" />
          <h4 className="fw-bold text-dark mb-2">Link Not Found</h4>
          <p className="text-muted small mb-4">{error || 'Unable to locate this admission record.'}</p>
          <button type="button" className="btn btn-outline-secondary btn-sm px-4" onClick={() => navigate('/login')}>
            Go to Portal Login
          </button>
        </div>
      </div>
    );
  }

  const inquiry = student.inquiry_details || {};
  const isConfirmed = student.admission_confirmation_status === 'CONFIRMED';
  const termsList = student.terms_and_conditions || ADMISSION_TERMS_AND_CONDITIONS;

  const fullName = inquiry.full_name || student.full_name || '-';
  const rollNumber = inquiry.student_id || student.student_id || '-';
  const email = inquiry.email || student.email || '-';
  const studentMobile = inquiry.mobile_number || student.mobile_number || '-';
  const fatherMobile = inquiry.father_mobile || student.father_mobile || student.parent_mobile || '-';
  const motherMobile = inquiry.mother_mobile || student.mother_mobile || '-';
  const branch = inquiry.branch || student.branch || 'Tarabai Park';
  const program = inquiry.admission_type || student.admission_type || '11th Standard Only';
  const standard = inquiry.standard || student.standard || '11th Science';
  const academicBatch = inquiry.academic_batch || student.academic_batch || student.batch || '-';
  const session = inquiry.session || student.session || 'Morning';
  const academicYear = inquiry.academic_year || student.academic_year || '2025-2026';

  const origFees = Number(inquiry.original_fees ?? student.original_fees ?? student.total_fees ?? 0);
  const discAmt = Number(inquiry.discount_amount ?? student.discount_amount ?? 0);
  const totalFees = Number(inquiry.total_fees ?? student.total_fees ?? 0);
  const paidFees = Number(inquiry.paid_fees ?? student.paid_fees ?? 0);
  const remFees = Number(inquiry.remaining_fees ?? student.remaining_fees ?? Math.max(0, totalFees - paidFees));

  return (
    <div className="min-vh-100 py-4 px-3 px-md-4" style={{ backgroundColor: '#F8FAFC' }}>
      <div className="container" style={{ maxWidth: '860px' }}>
        {/* Academy Brand Header */}
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
          <div
            className="p-4 text-white d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3"
            style={{ background: 'linear-gradient(135deg, #8B1216 0%, #5F0A0D 100%)' }}
          >
            <div className="d-flex align-items-center gap-3">
              <div className="bg-white rounded-3 p-2 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '48px', height: '48px' }}>
                <GraduationCap size={28} style={{ color: '#8B1216' }} />
              </div>
              <div>
                <h4 className="fw-bold m-0">Shubham Academy</h4>
                <p className="m-0 opacity-75 small">Official Admission Confirmation & Parent Acceptance Portal</p>
              </div>
            </div>
            <span className="badge bg-white text-dark rounded-pill px-3 py-2 fw-semibold align-self-start align-self-sm-center">
              <Building2 size={13} className="me-1" />
              {branch} Campus
            </span>
          </div>

          {/* Status Banner */}
          <div className={`p-3 px-4 d-flex align-items-center gap-2 border-bottom ${isConfirmed ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning-emphasis'}`}>
            {isConfirmed ? (
              <>
                <CheckCircle2 size={20} className="flex-shrink-0" />
                <div className="small fw-semibold">
                  Admission Confirmed! Accepted by <strong>{student.parent_confirmed_by || 'Parent'}</strong>
                  {student.parent_confirmed_at ? ` on ${new Date(student.parent_confirmed_at).toLocaleString()}` : ''}.
                </div>
              </>
            ) : (
              <>
                <Clock size={20} className="flex-shrink-0" />
                <div className="small fw-semibold">
                  <strong>Pending Parent Confirmation:</strong> Please verify all inquiry & fee details below and accept the Terms & Conditions to confirm admission.
                </div>
              </>
            )}
          </div>

          <div className="card-body p-4">
            {/* Section 1: Inquiry & Registration Details */}
            <h6 className="fw-bold text-uppercase small text-muted mb-3 d-flex align-items-center gap-2">
              <FileText size={16} style={{ color: '#8B1216' }} />
              <span>1. Complete Inquiry & Admission Details</span>
            </h6>

            <div className="row g-3 mb-4">
              <div className="col-12 col-md-6">
                <div className="p-3 rounded-3 bg-light border h-100">
                  <div className="small text-muted fw-semibold mb-2">Student & Contact Info</div>
                  <div className="d-flex justify-content-between py-1 border-bottom small">
                    <span className="text-muted">Student Name:</span>
                    <span className="fw-bold text-dark text-end">{fullName}</span>
                  </div>
                  <div className="d-flex justify-content-between py-1 border-bottom small">
                    <span className="text-muted">Roll / Admission ID:</span>
                    <span className="fw-bold text-danger">{rollNumber}</span>
                  </div>
                  <div className="d-flex justify-content-between py-1 border-bottom small">
                    <span className="text-muted"><Mail size={12} className="me-1" />Email (User ID):</span>
                    <span className="fw-semibold text-dark text-break text-end">{email}</span>
                  </div>
                  <div className="d-flex justify-content-between py-1 border-bottom small">
                    <span className="text-muted"><Phone size={12} className="me-1" />Student Mobile:</span>
                    <span className="fw-semibold text-dark">{studentMobile}</span>
                  </div>
                  <div className="d-flex justify-content-between py-1 border-bottom small">
                    <span className="text-muted">Father Mobile:</span>
                    <span className="fw-bold text-dark">{fatherMobile}</span>
                  </div>
                  <div className="d-flex justify-content-between py-1 small">
                    <span className="text-muted">Mother Mobile:</span>
                    <span className="fw-bold text-dark">{motherMobile || 'Not Provided'}</span>
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-6">
                <div className="p-3 rounded-3 bg-light border h-100">
                  <div className="small text-muted fw-semibold mb-2">Academic & Fee Summary</div>
                  <div className="d-flex justify-content-between py-1 border-bottom small">
                    <span className="text-muted">Admission Program:</span>
                    <span className="fw-bold text-dark text-end">{program}</span>
                  </div>
                  <div className="d-flex justify-content-between py-1 border-bottom small">
                    <span className="text-muted">Standard / Year:</span>
                    <span className="fw-semibold text-dark">{standard} ({academicYear})</span>
                  </div>
                  <div className="d-flex justify-content-between py-1 border-bottom small">
                    <span className="text-muted">Batch & Session:</span>
                    <span className="fw-bold text-primary">{academicBatch} • {session}</span>
                  </div>
                  <div className="d-flex justify-content-between py-1 border-bottom small">
                    <span className="text-muted"><IndianRupee size={12} className="me-1" />Gross Course Fee:</span>
                    <span className="fw-semibold text-dark">₹{origFees.toLocaleString()}</span>
                  </div>
                  {discAmt > 0 && (
                    <div className="d-flex justify-content-between py-1 border-bottom small">
                      <span className="text-muted">Concession / Discount:</span>
                      <span className="fw-bold text-success">-₹{discAmt.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="d-flex justify-content-between py-1 border-bottom small">
                    <span className="text-muted">Net Payable Fees:</span>
                    <span className="fw-bold text-dark">₹{totalFees.toLocaleString()}</span>
                  </div>
                  <div className="d-flex justify-content-between py-1 border-bottom small">
                    <span className="text-muted">Amount Paid:</span>
                    <span className="fw-bold text-success">₹{paidFees.toLocaleString()}</span>
                  </div>
                  <div className="d-flex justify-content-between py-1 small">
                    <span className="text-muted">Remaining Balance:</span>
                    <span className="fw-bold text-danger">₹{remFees.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Terms & Conditions */}
            <h6 className="fw-bold text-uppercase small text-muted mb-3 d-flex align-items-center gap-2">
              <ShieldCheck size={16} style={{ color: '#8B1216' }} />
              <span>2. Terms & Conditions</span>
            </h6>

            <div className="p-3 p-md-4 rounded-3 border bg-white mb-4" style={{ borderColor: '#E2E8F0' }}>
              <ul className="list-unstyled m-0 d-flex flex-column gap-2 small text-dark">
                {termsList.map((term, idx) => (
                  <li key={idx} className="d-flex align-items-start gap-2" style={{ lineHeight: 1.5 }}>
                    <span className="text-danger fw-bold">•</span>
                    <span>{term}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Section 3: Parent Acceptance Action */}
            {isConfirmed ? (
              <div className="p-4 rounded-4 bg-success-subtle border border-success text-center">
                <CheckCircle2 size={36} className="text-success mb-2" />
                <h5 className="fw-bold text-success mb-1">Admission Officially Confirmed</h5>
                <p className="small text-dark m-0">
                  Confirmed by <strong>{student.parent_confirmed_by || 'Parent'}</strong> with Terms & Conditions accepted.
                  You may now access the Student Portal using your registered Email ID and mobile password.
                </p>
              </div>
            ) : (
              <form onSubmit={handleConfirm} className="p-3 p-md-4 rounded-4 border" style={{ backgroundColor: '#FFFDFD', borderColor: '#FECACA' }}>
                <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                  <UserCheck size={18} style={{ color: '#8B1216' }} />
                  <span>Parent / Guardian Acceptance</span>
                </h6>

                <div className="row g-3 mb-3">
                  <div className="col-12 col-sm-6">
                    <label className="form-label small fw-semibold text-muted">Confirming As</label>
                    <select
                      className="form-select form-select-sm"
                      value={acceptedBy}
                      onChange={(e) => setAcceptedBy(e.target.value)}
                    >
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Guardian">Parent / Legal Guardian</option>
                    </select>
                  </div>
                  <div className="col-12 col-sm-6">
                    <label className="form-label small fw-semibold text-muted">Parent Remarks (Optional)</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Any note for academy office..."
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-check mb-3">
                  <input
                    id="acceptTermsCheckbox"
                    type="checkbox"
                    className="form-check-input"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    required
                  />
                  <label htmlFor="acceptTermsCheckbox" className="form-check-label small fw-semibold text-dark">
                    I have verified all the inquiry/admission details above and I accept the Shubham Academy Terms & Conditions. I understand that admission will only be confirmed upon clicking Accept below.
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={submitting || !termsAccepted}
                  className="btn w-100 py-2.5 fw-bold text-white border-0 rounded-3 d-flex align-items-center justify-content-center gap-2"
                  style={{ backgroundColor: '#8B1216' }}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm" />
                      <span>Confirming Admission...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} />
                      <span>Accept Terms & Confirm Admission</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
