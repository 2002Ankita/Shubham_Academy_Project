import React, { useState, useEffect } from 'react';
import Table from '../../components/common/Table';
import BackButton from '../../components/common/BackButton';
import feeService from '../../services/feeService';
import { CreditCard, Download, CheckCircle2, Calendar } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-toastify';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import studentService from '../../services/studentService';
export default function StudentFees() {
  const { user } = useAuth();
  const [feeStructures, setFeeStructures] = useState([]);
  const [details, setDetails] = useState({ total_fees: 0, amount_paid: 0, pending_fees: 0 });
  const [loading, setLoading] = useState(true);
  
  // Payment Modal States
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('Online');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchFees = async () => {
      setLoading(true);
      try {
        if (user?.id) {
          const [detailData, allPayments, stuObj] = await Promise.all([
            feeService.getFeeDetails(user.id).catch(() => null),
            feeService.getAll().catch(() => []),
            studentService.getById(user.id).catch(() => null)
          ]);

          if (detailData) {
            setDetails(detailData);
          } else if (stuObj) {
            setDetails({
              total_fees: stuObj.totalFees || stuObj.total_fees || 0,
              amount_paid: stuObj.paidFees || stuObj.paid_fees || 0,
              pending_fees: stuObj.remainingFees != null ? stuObj.remainingFees : (stuObj.remaining_fees || 0),
              original_fees: stuObj.originalFees || stuObj.original_fees || 0,
              discount_amount: stuObj.discountAmount || stuObj.discount_amount || 0,
              discount_status: stuObj.discountStatus || stuObj.discount_status || 'NONE',
              discount_reason: stuObj.discountReason || stuObj.discount_reason,
              discount_approved_by: stuObj.discountApprovedBy || stuObj.discount_approved_by
            });
          }

          const userPayments = Array.isArray(allPayments)
            ? allPayments.filter(f =>
                (detailData?.student_id && String(f.studentId) === String(detailData.student_id)) ||
                (stuObj?.id && String(f.studentId) === String(stuObj.id)) ||
                String(f.studentId) === String(user.id) ||
                (detailData?.roll_number && f.rollNumber === detailData.roll_number) ||
                (stuObj?.rollNumber && f.rollNumber === stuObj.rollNumber) ||
                (stuObj?.student_id && f.rollNumber === stuObj.student_id) ||
                (user?.rollNumber && f.rollNumber === user.rollNumber)
              )
            : [];

          if (userPayments && userPayments.length > 0) {
            // Sort user payments chronologically (oldest to newest) to display clear installment progression
            const sortedPayments = [...userPayments].sort((a, b) => {
              const da = new Date(a.paymentDate).getTime() || 0;
              const db = new Date(b.paymentDate).getTime() || 0;
              if (da !== db) return da - db;
              return (a.id || '').localeCompare(b.id || '');
            });

            const mapped = sortedPayments.map((p, idx) => ({
              id: p.id || `PAY-${idx}`,
              receiptNo: p.receiptNo || `REC-${Math.floor(100000 + Math.random() * 900000)}`,
              feeStructureName: p.feeHead || 'Standard Tuition Fee Structure',
              feeStructureYear: '2025 - 2026',
              totalFees: p.totalFees || detailData?.total_fees || stuObj?.total_fees || 0,
              paidFees: p.amountPaid || 0,
              pendingAmount: p.pendingAmount != null ? p.pendingAmount : (detailData?.pending_fees || 0),
              cumulativePaid: p.cumulativePaid || p.amountPaid,
              currentPendingFees: p.currentPendingFees,
              paymentDate: p.paymentDate || 'N/A',
              paymentMode: p.paymentMode || 'Online Bank Transfer',
              transactionId: p.transactionId || `TXN-SA-${idx + 100}`
            }));
            setFeeStructures(mapped);
          } else {
            // Show one row reflecting their total fees if no payments exist yet
            const effectiveTotal = detailData?.total_fees || stuObj?.totalFees || stuObj?.total_fees || 0;
            const effectivePaid = detailData?.amount_paid != null ? detailData.amount_paid : (stuObj?.paidFees || 0);
            const effectivePending = detailData?.pending_fees != null ? detailData.pending_fees : Math.max(0, effectiveTotal - effectivePaid);

            setFeeStructures([{
              id: 'FS-DEFAULT',
              receiptNo: 'N/A',
              feeStructureName: stuObj?.batch || user?.course || 'Academic Course Enrollment Fees',
              feeStructureYear: '2025 - 2026',
              totalFees: effectiveTotal,
              paidFees: effectivePaid,
              pendingAmount: effectivePending,
              paymentDate: 'N/A',
              paymentMode: 'N/A',
              transactionId: 'N/A',
              status: effectivePending <= 0 ? 'Paid' : (effectivePaid > 0 ? 'Partial' : 'Pending')
            }]);
          }
        }
      } catch (err) {
        console.error('Error fetching student fees:', err);
        setFeeStructures([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFees();
  }, [user, refreshTrigger]);

  // Dynamic KPI totals
  const totalFeesCalculated = details.total_fees > 0
    ? details.total_fees
    : feeStructures.reduce((acc, f) => acc + (f.totalFees || 0), 0);

  const amountPaidCalculated = details.amount_paid > 0
    ? details.amount_paid
    : feeStructures.reduce((acc, f) => acc + (f.paidFees || 0), 0);

  const pendingFeesCalculated = details.pending_fees >= 0 && details.total_fees > 0
    ? details.pending_fees
    : Math.max(0, totalFeesCalculated - amountPaidCalculated);

  const handleDownloadReceipt = (fee) => {
    try {
      const studentName = user?.full_name || user?.name || 'Student';
      const rollNumber = user?.roll_number || user?.rollNo || 'N/A';
      const receiptNo = fee.receiptNo || `REC-${Math.floor(100000 + Math.random() * 900000)}`;
      const cleanName = (fee.feeStructureName || 'Fee_Receipt').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `Fee_Receipt_${receiptNo}_${cleanName}.doc`;

      const content = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset="utf-8">
          <title>Fee Receipt - ${receiptNo}</title>
          <style>
            body { font-family: Calibri, 'Segoe UI', Arial, sans-serif; margin: 40px; color: #111827; line-height: 1.5; }
            .header { text-align: center; border-bottom: 2.5px solid #8B1216; padding-bottom: 12px; margin-bottom: 24px; }
            .brand { font-size: 22pt; font-weight: 800; color: #8B1216; margin: 0; }
            .sub-brand { font-size: 10pt; color: #4B5563; margin-top: 4px; }
            .receipt-title { font-size: 14pt; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; color: #111; margin-top: 12px; }
            .meta-box { width: 100%; border: 1px solid #E5E7EB; border-collapse: collapse; margin-bottom: 24px; }
            .meta-box td { padding: 8px 12px; border: 1px solid #E5E7EB; font-size: 10pt; }
            .label { font-weight: bold; background-color: #F9FAFB; width: 25%; color: #374151; }
            .particulars-table { width: 100%; border: 1.5px solid #111; border-collapse: collapse; margin: 20px 0; }
            .particulars-table th { background-color: #8B1216; color: #ffffff; padding: 10px 12px; text-align: left; font-size: 10.5pt; }
            .particulars-table td { padding: 10px 12px; border: 1px solid #E5E7EB; font-size: 10pt; }
            .highlight-row { background-color: #F0FDF4; font-weight: bold; font-size: 11pt; color: #166534; }
            .seal-box { border: 2px dashed #166534; padding: 10px 16px; border-radius: 8px; color: #166534; display: inline-block; font-weight: bold; font-size: 9pt; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="brand">SHUBHAM ACADEMY</div>
            <div class="sub-brand">Higher Secondary Coaching & Competitive Examination Institute</div>
            <div class="sub-brand">Main Campus: Pune, Maharashtra &bull; Reg No: SA-EDU-2026 &bull; GSTIN: 27AABCS1429M1ZQ</div>
            <div class="receipt-title">OFFICIAL PAYMENT FEE RECEIPT</div>
          </div>

          <table class="meta-box">
            <tr>
              <td class="label">Receipt Number:</td>
              <td style="font-weight: bold; color: #8B1216;">${receiptNo}</td>
              <td class="label">Receipt Date:</td>
              <td>${fee.paymentDate || '2026-03-15'}</td>
            </tr>
            <tr>
              <td class="label">Student Name:</td>
              <td style="font-weight: bold;">${studentName}</td>
              <td class="label">Roll Number:</td>
              <td style="font-weight: bold; color: #8B1216;">${rollNumber}</td>
            </tr>
            <tr>
              <td class="label">Fee Structure Name:</td>
              <td colspan="3" style="font-weight: bold;">${fee.feeStructureName}</td>
            </tr>
            <tr>
              <td class="label">Academic Year:</td>
              <td><strong>${fee.feeStructureYear}</strong></td>
              <td class="label">Payment Mode:</td>
              <td>${fee.paymentMode || 'Online Bank Transfer / UPI'}</td>
            </tr>
            <tr>
              <td class="label">Transaction Ref:</td>
              <td colspan="3">${fee.transactionId || `TXN-SA-${Date.now().toString().slice(-8)}`}</td>
            </tr>
          </table>

          <table class="particulars-table">
            <thead>
              <tr>
                <th>Fee Particulars / Structure Breakdown</th>
                <th style="text-align: right; width: 160px;">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${details.discount_status === 'APPROVED' && Number(details.discount_amount || 0) > 0 ? `
              <tr>
                <td style="color: #6B7280;">Original Gross Course Fees</td>
                <td style="text-align: right; color: #6B7280;">₹ ${(Number(details.original_fees) || ((Number(fee.totalFees) || 0) + (Number(details.discount_amount) || 0))).toLocaleString()}</td>
              </tr>
              <tr style="background-color: #F0FDF4; color: #166534;">
                <td><strong>Approved Discount Concession</strong> (${details.discount_reason || 'Concession'} - Approved by ${details.discount_approved_by || 'Superadmin'})</td>
                <td style="text-align: right; font-weight: bold;">-₹ ${(Number(details.discount_amount) || 0).toLocaleString()}</td>
              </tr>
              ` : ''}
              <tr>
                <td><strong>${details.discount_status === 'APPROVED' ? 'Approved Net Course Fees' : 'Total Course & Tuition Fees'}</strong></td>
                <td style="text-align: right; font-weight: 700;">₹ ${(Number(fee.totalFees) || 0).toLocaleString()}</td>
              </tr>
              <tr class="highlight-row">
                <td>Installment Amount Paid & Cleared</td>
                <td style="text-align: right;">₹ ${(Number(fee.paidFees) || 0).toLocaleString()}</td>
              </tr>
              ${fee.cumulativePaid && Number(fee.cumulativePaid) !== Number(fee.paidFees) ? `
              <tr>
                <td style="color: #4B5563;">Cumulative Total Paid to Date</td>
                <td style="text-align: right; font-weight: 600; color: #166534;">₹ ${(Number(fee.cumulativePaid) || 0).toLocaleString()}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="color: ${(Number(fee.pendingAmount) || 0) > 0 ? '#DC2626' : '#16A34A'}; font-weight: bold;">
                  Outstanding Pending Balance After This Payment
                </td>
                <td style="text-align: right; font-weight: bold; color: ${(Number(fee.pendingAmount) || 0) > 0 ? '#DC2626' : '#16A34A'};">
                  ₹ ${(Number(fee.pendingAmount) || 0).toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>

          <div style="margin-top: 15px; font-size: 9.5pt; color: #4B5563;">
            <em>Note: This is a system-generated official computer receipt issued by Shubham Academy Accounts Department. All fees once paid are subject to academy terms.</em>
          </div>

          <table style="width: 100%; margin-top: 40px;">
            <tr>
              <td style="width: 50%; vertical-align: bottom;">
                <div class="seal-box">&#10004; ELECTRONICALLY VERIFIED PAYMENT</div>
              </td>
              <td style="width: 50%; text-align: right; vertical-align: bottom;">
                <div style="border-top: 1px solid #9CA3AF; display: inline-block; padding-top: 5px; width: 180px; text-align: center;">
                  <strong style="font-size: 10pt;">Authorized Signature</strong><br/>
                  <span style="font-size: 9pt; color: #6B7280;">Accounts Officer, Shubham Academy</span>
                </div>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      const blob = new Blob([content], { type: 'application/msword;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Fee receipt "${receiptNo}" downloaded successfully!`);
    } catch (err) {
      console.error('Download error:', err);
      toast.error('Failed to download fee receipt.');
    }
  };

  const handlePayInstallment = async () => {
    if (!paymentAmount || isNaN(paymentAmount) || Number(paymentAmount) <= 0) {
      toast.error('Please enter a valid amount.');
      return;
    }
    
    if (Number(paymentAmount) > pendingFeesCalculated) {
      toast.error('Payment amount cannot exceed the pending balance.');
      return;
    }

    try {
      setIsSubmittingPayment(true);
      const res = await feeService.collectFee({
        studentId: user?.id,
        amountPaid: Number(paymentAmount),
        paymentMode: paymentMode,
        feeHead: 'Tuition Fee Installment'
      });

      if (res.success) {
        toast.success(`Payment of ₹${paymentAmount} successful!`);
        setIsPaymentModalOpen(false);
        setPaymentAmount('');
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (err) {
      console.error('Payment error:', err);
      toast.error(err.response?.data?.detail || 'Failed to process payment. Please try again.');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  return (
    <div className="d-flex flex-column gap-4">
      {/* Back button */}
      <div>
        <BackButton to="/student/dashboard" label="Back to Dashboard" />
      </div>

      {/* 1. Header */}
      <div className="d-flex justify-content-between align-items-end">
        <div>
          <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
            My Academic Fees & Receipts
          </h3>
          <span className="small text-sa-muted">
            Tuition installments, fee structure details, and official fee receipt downloads
          </span>
        </div>
        {pendingFeesCalculated > 0 && (
          <Button 
            variant="primary" 
            icon={CreditCard} 
            onClick={() => setIsPaymentModalOpen(true)}
          >
            Pay Installment
          </Button>
        )}
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="row g-3">
        <div className="col-12 col-md-4">
          <div className="sa-card p-4">
            <span className="small text-sa-muted fw-semibold">
              {details.discount_status === 'APPROVED' ? 'APPROVED NET COURSE FEES' : 'TOTAL APPLICABLE FEES'}
            </span>
            <h2 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-3">
              ₹ {totalFeesCalculated.toLocaleString()}
            </h2>
            <div className="small mt-1">
              {details.discount_status === 'APPROVED' && Number(details.discount_amount) > 0 ? (
                <span className="text-success fw-semibold" style={{ fontSize: '0.78rem' }}>
                  ✓ ₹{Number(details.discount_amount).toLocaleString()} Concession Approved ({details.discount_approved_by || 'Superadmin'})
                </span>
              ) : details.discount_status === 'PENDING' && Number(details.discount_amount) > 0 ? (
                <span className="text-warning-emphasis fw-semibold" style={{ fontSize: '0.78rem' }}>
                  ⏳ Concession of ₹{Number(details.discount_amount).toLocaleString()} Pending Approval
                </span>
              ) : (
                <span className="small text-sa-muted">Total Course Fees</span>
              )}
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="sa-card p-4">
            <span className="small text-sa-muted fw-semibold">TOTAL AMOUNT CLEARED</span>
            <h2 className="brand-font fw-extrabold text-success m-0 fs-3">
              ₹ {amountPaidCalculated.toLocaleString()}
            </h2>
            <span className="small text-success d-flex align-items-center gap-1 mt-1">
              <CheckCircle2 size={14} />{' '}
              {(totalFeesCalculated > 0 ? (amountPaidCalculated / totalFeesCalculated) * 100 : 0).toFixed(0)}% Cleared
            </span>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="sa-card p-4">
            <span className="small text-sa-muted fw-semibold">OUTSTANDING BALANCE</span>
            <h2 className="brand-font fw-extrabold text-danger m-0 fs-3">
              ₹ {pendingFeesCalculated.toLocaleString()}
            </h2>
            <span className="small text-muted">Amount left to pay</span>
          </div>
        </div>
      </div>

      {/* 3. Fee Structures Table */}
      <div className="sa-card p-4">
        <h5 className="brand-font fw-bold text-sa-charcoal mb-3 fs-6">
          Fee Structures & Payment Receipts
        </h5>

        <Table
          columns={[
            {
              key: 'feeStructureName',
              title: 'Fee Structure Name',
              render: (val, row) => (
                <div className="d-flex align-items-center gap-2">
                  <CreditCard size={16} className="text-secondary flex-shrink-0" />
                  <span className="fw-semibold text-sa-charcoal">
                    {val || row.feeHead}
                  </span>
                </div>
              )
            },
            {
              key: 'feeStructureYear',
              title: 'Fee Structure Year',
              width: '170px',
              render: (val) => (
                <div
                  className="d-inline-flex align-items-center gap-1.5 px-2.5 py-1 bg-light border rounded small text-dark fw-medium text-nowrap"
                  style={{ whiteSpace: 'nowrap' }}
                >
                  <Calendar size={13} className="text-secondary flex-shrink-0" />
                  <span className="text-nowrap">{val || '2025 - 2026'}</span>
                </div>
              )
            },
            {
              key: 'totalFees',
              title: 'Course Fee',
              width: '160px',
              render: (val, row) => (
                <div>
                  <span className="fw-bold text-sa-charcoal text-nowrap" style={{ whiteSpace: 'nowrap' }}>
                    ₹ {Number(val || 0).toLocaleString()}
                  </span>
                  {details.discount_status === 'APPROVED' && Number(details.discount_amount) > 0 && (
                    <span className="badge bg-success-subtle text-success d-block mt-0.5" style={{ fontSize: '0.67rem' }}>
                      -₹{Number(details.discount_amount).toLocaleString()} Approved Disc
                    </span>
                  )}
                  {details.discount_status === 'PENDING' && Number(details.discount_amount) > 0 && (
                    <span className="badge bg-warning-subtle text-warning-emphasis d-block mt-0.5" style={{ fontSize: '0.67rem' }}>
                      ⏳ ₹{Number(details.discount_amount).toLocaleString()} Disc Pending
                    </span>
                  )}
                </div>
              )
            },
            {
              key: 'paidFees',
              title: 'Paid Fees',
              width: '130px',
              render: (val, row) => (
                <span className="fw-bold text-success text-nowrap" style={{ whiteSpace: 'nowrap' }}>
                  ₹ {Number(val || row.amountPaid || 0).toLocaleString()}
                </span>
              )
            },
            {
              key: 'pendingAmount',
              title: 'Pending Amount',
              width: '150px',
              render: (val) => (
                Number(val || 0) > 0 ? (
                  <span className="fw-bold text-danger text-nowrap" style={{ whiteSpace: 'nowrap' }}>
                    ₹ {Number(val).toLocaleString()}
                  </span>
                ) : (
                  <span
                    className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2.5 py-1 text-xs fw-semibold text-nowrap"
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    Nil (Paid)
                  </span>
                )
              )
            },
            {
              key: 'downloadAction',
              title: 'Fee Receipt',
              align: 'center',
              width: '130px',
              render: (_, row) => (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1.5 px-3 py-1.5 rounded-2 shadow-xs fw-semibold text-nowrap"
                  style={{ whiteSpace: 'nowrap' }}
                  onClick={() => handleDownloadReceipt(row)}
                  title="Download Fee Receipt"
                >
                  <Download size={14} />
                  <span>Download</span>
                </button>
              )
            }
          ]}
          data={feeStructures}
          loading={loading}
          emptyMessage="No fee structures or receipts found."
        />
      </div>

      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Pay Fee Installment"
        size="md"
      >
        <div className="d-flex flex-column gap-3">
          <div className="p-3 bg-sa-off-white rounded border">
            <div className="d-flex justify-content-between mb-2">
              <span className="text-sa-muted">Total Pending Balance:</span>
              <span className="fw-bold text-danger">₹ {pendingFeesCalculated.toLocaleString()}</span>
            </div>
            <div className="d-flex justify-content-between">
              <span className="text-sa-muted">Student Name:</span>
              <span className="fw-bold">{user?.full_name || user?.name || 'Student'}</span>
            </div>
          </div>
          
          <Input
            label="Installment Amount (₹)"
            type="number"
            min="1"
            max={pendingFeesCalculated}
            placeholder="Enter amount to pay"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
          />

          <div className="d-flex flex-column gap-2 mt-2">
            <label className="form-label text-sa-charcoal fw-semibold mb-0" style={{ fontSize: '0.85rem' }}>
              Payment Mode
            </label>
            <select 
              className="form-select border-sa-ash shadow-none" 
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
            >
              <option value="Online">Online / UPI / NetBanking</option>
              <option value="Cash">Cash (Physical Deposit)</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-3 pt-3 border-top">
            <Button variant="outline" onClick={() => setIsPaymentModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handlePayInstallment}
              loading={isSubmittingPayment}
            >
              Pay Securely
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
