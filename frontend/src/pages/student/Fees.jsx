import React, { useState, useEffect } from 'react';
import Table from '../../components/common/Table';
import BackButton from '../../components/common/BackButton';
import feeService from '../../services/feeService';
import {
  CreditCard,
  Download,
  CheckCircle2,
  Calendar,
  QrCode,
  Banknote,
  FileText,
  Building2,
  AlertCircle,
  Clock,
  ShieldCheck,
  ArrowRight,
  Eye,
  Check
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-toastify';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import studentService from '../../services/studentService';
import { getUserBranch } from '../../utils/branchUtils';
import UpiQrDisplay from '../../components/common/UpiQrDisplay';

const DEFAULT_FEE_STRUCTURES = [
  {
    id: 'FS-2026-001',
    receiptNo: 'REC-2026-8812',
    feeStructureName: 'HSC Science (12th Standard) - Comprehensive Coaching',
    feeStructureYear: '2025 - 2026',
    totalFees: 65000,
    paidFees: 45000,
    pendingAmount: 20000,
    paymentDate: '2026-03-15',
    paymentMode: 'Online NetBanking / UPI',
    transactionId: 'TXN-HSC-992381',
    status: 'Partial'
  },
  {
    id: 'FS-2026-002',
    receiptNo: 'REC-2026-7540',
    feeStructureName: 'MHT-CET & JEE Main Target Batch Test Series & Practical Fees',
    feeStructureYear: '2025 - 2026',
    totalFees: 25000,
    paidFees: 25000,
    pendingAmount: 0,
    paymentDate: '2026-03-18',
    paymentMode: 'UPI / GooglePay',
    transactionId: 'TXN-JEE-881204',
    status: 'Paid'
  },
  {
    id: 'FS-2026-003',
    receiptNo: 'REC-2025-6119',
    feeStructureName: '11th Science Foundation & Entrance Coaching Program',
    feeStructureYear: '2024 - 2025',
    totalFees: 55000,
    paidFees: 55000,
    pendingAmount: 0,
    paymentDate: '2025-04-10',
    paymentMode: 'Online Bank Transfer',
    transactionId: 'TXN-FND-773412',
    status: 'Paid'
  },
  {
    id: 'FS-2026-004',
    receiptNo: 'REC-2026-9201',
    feeStructureName: 'Special Mathematics & Physics Booster Problem-Solving Module',
    feeStructureYear: '2025 - 2026',
    totalFees: 15000,
    paidFees: 10000,
    pendingAmount: 5000,
    paymentDate: '2026-03-22',
    paymentMode: 'Debit Card / POS',
    transactionId: 'TXN-MOD-661902',
    status: 'Partial'
  }
];
export default function StudentFees() {
  const { user } = useAuth();
  const studentBranch = user?.branch || getUserBranch(user) || 'Tarabai Park';
  const [feeStructures, setFeeStructures] = useState([]);
  const [details, setDetails] = useState({ total_fees: 0, amount_paid: 0, pending_fees: 0 });
  const [loading, setLoading] = useState(true);
  
  // Payment Modal States
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('Online');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Branch Scanner & Payment Specific States
  const [branchScanner, setBranchScanner] = useState(null);
  const [loadingScanner, setLoadingScanner] = useState(false);
  const [upiUtr, setUpiUtr] = useState('');
  const [depositorName, setDepositorName] = useState('');
  const [cashNotes, setCashNotes] = useState('');
  const [chequeNumber, setChequeNumber] = useState('');
  const [chequeBank, setChequeBank] = useState('');
  const [chequeDate, setChequeDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [chequeDepositor, setChequeDepositor] = useState('');
  const [submittedTicket, setSubmittedTicket] = useState(null);
  const [offlineRequests, setOfflineRequests] = useState([]);

  // Load branch scanner uploaded by Academic Admin for student's branch
  const loadBranchScanner = async () => {
    setLoadingScanner(true);
    try {
      const scanner = await feeService.getBranchUpiScanner(studentBranch);
      setBranchScanner(scanner);
    } catch (err) {
      console.warn('Failed to load branch scanner:', err);
    } finally {
      setLoadingScanner(false);
    }
  };

  // Load offline fee requests submitted by this student
  const loadOfflineRequests = async () => {
    try {
      const all = await feeService.getOfflineFeeRequests({ branch: studentBranch });
      const currentStudentName = (user?.full_name || user?.name || '').trim().toLowerCase();
      const currentRoll = (user?.roll_number || user?.rollNo || '').trim().toLowerCase();
      const currentId = String(user?.id || '').trim().toLowerCase();

      const myRequests = (all || []).filter((r) => {
        const rId = String(r.student_id || '').trim().toLowerCase();
        const rRoll = (r.roll_number || '').trim().toLowerCase();
        const rName = (r.student_name || '').trim().toLowerCase();

        return (
          (currentId && (rId === currentId || currentId.includes(rId) || rId.includes(currentId))) ||
          (currentRoll && rRoll && rRoll === currentRoll) ||
          (currentStudentName && rName && (rName === currentStudentName || rName.includes(currentStudentName) || currentStudentName.includes(rName)))
        );
      });
      setOfflineRequests(myRequests);
    } catch (err) {
      console.warn('Failed to load offline fee requests:', err);
    }
  };

  useEffect(() => {
    loadBranchScanner();
    loadOfflineRequests();
    const handleScannerUpdate = () => loadBranchScanner();
    const handleRequestsUpdate = () => {
      loadOfflineRequests();
      setRefreshTrigger(prev => prev + 1);
    };
    window.addEventListener('sa_upi_scanner_updated', handleScannerUpdate);
    window.addEventListener('sa_offline_fee_requests_updated', handleRequestsUpdate);
    window.addEventListener('sa_fee_updated', handleRequestsUpdate);
    return () => {
      window.removeEventListener('sa_upi_scanner_updated', handleScannerUpdate);
      window.removeEventListener('sa_offline_fee_requests_updated', handleRequestsUpdate);
      window.removeEventListener('sa_fee_updated', handleRequestsUpdate);
    };
  }, [studentBranch]);

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

          const currentStudentName = (user?.full_name || user?.name || '').trim().toLowerCase();
          const currentRoll = (user?.roll_number || user?.rollNo || '').trim().toLowerCase();
          const currentId = String(user?.id || '').trim().toLowerCase();

          const userPayments = Array.isArray(allPayments)
            ? allPayments.filter(f => {
                const fId = String(f.studentId || '').trim().toLowerCase();
                const fRoll = (f.rollNumber || '').trim().toLowerCase();
                const fName = (f.studentName || '').trim().toLowerCase();
                return (
                  (detailData?.student_id && String(f.studentId) === String(detailData.student_id)) ||
                  (stuObj?.id && String(f.studentId) === String(stuObj.id)) ||
                  (currentId && (fId === currentId || fId === String(detailData?.student_id || '').toLowerCase())) ||
                  (detailData?.roll_number && f.rollNumber === detailData.roll_number) ||
                  (stuObj?.rollNumber && f.rollNumber === stuObj.rollNumber) ||
                  (stuObj?.student_id && f.rollNumber === stuObj.student_id) ||
                  (currentRoll && fRoll && fRoll === currentRoll) ||
                  (currentStudentName && fName && (fName === currentStudentName || fName.includes(currentStudentName) || currentStudentName.includes(fName)))
                );
              })
            : [];

          const totalPaidSoFar = userPayments.reduce((acc, p) => acc + Number(p.amountPaid || 0), 0);
          const remainingPending = Math.max(0, totalCourseFee - totalPaidSoFar);

          setDetails({
            total_fees: totalCourseFee,
            amount_paid: totalPaidSoFar,
            pending_fees: remainingPending,
            original_fees: detailData?.original_fees || totalCourseFee,
            discount_amount: detailData?.discount_amount || 0,
            discount_status: detailData?.discount_status || 'NONE',
            discount_reason: detailData?.discount_reason || '',
            discount_approved_by: detailData?.discount_approved_by || ''
          });

          if (userPayments && userPayments.length > 0) {
            // Sort user payments chronologically (oldest to newest) to display clear installment progression
            const sortedPayments = [...userPayments].sort((a, b) => {
              const da = new Date(a.paymentDate).getTime() || 0;
              const db = new Date(b.paymentDate).getTime() || 0;
              if (da !== db) return da - db;
              return (a.id || '').localeCompare(b.id || '');
            });

            let runningPaid = 0;
            const effectiveTotal = detailData?.total_fees || stuObj?.total_fees || 0;
            const mapped = sortedPayments.map((p, idx) => {
              const paid = Number(p.amountPaid || 0);
              runningPaid += paid;
              const postPending = p.currentPendingFees != null ? p.currentPendingFees : (effectiveTotal > 0 ? Math.max(0, effectiveTotal - runningPaid) : p.pendingAmount);
              return {
                id: p.id || `PAY-${idx}`,
                receiptNo: p.receiptNo || `REC-${Math.floor(100000 + Math.random() * 900000)}`,
                feeStructureName: p.feeHead || 'Standard Tuition Fee Structure',
                feeStructureYear: '2025 - 2026',
                totalFees: p.totalFees || effectiveTotal,
                paidFees: paid,
                pendingAmount: postPending,
                cumulativePaid: p.cumulativePaid || runningPaid,
                currentPendingFees: postPending,
                paymentDate: p.paymentDate || 'N/A',
                paymentMode: p.paymentMode || 'Online Bank Transfer',
                transactionId: p.transactionId || `TXN-SA-${idx + 100}`,
                status: 'Paid',
                collectedByFaculty: p.collectedByFaculty,
                verifiedBy: p.verifiedBy
              };
            });
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
    loadOfflineRequests();
  }, [user, refreshTrigger]);

  // Dynamic KPI totals with Discount deduction
  const rawOriginalFee = Number(details.original_fees || details.total_fees || 45000);
  const approvedDiscount = details.discount_status === 'APPROVED' ? Number(details.discount_amount || 0) : 0;

  // Net total fees after deducting approved discount concession
  const totalFeesCalculated = details.total_fees > 0
    ? (details.original_fees && details.original_fees > details.total_fees
        ? details.total_fees
        : Math.max(0, details.total_fees - approvedDiscount))
    : Math.max(0, rawOriginalFee - approvedDiscount);

  const amountPaidCalculated = details.amount_paid > 0
    ? details.amount_paid
    : feeStructures.reduce((acc, f) => acc + (Number(f.paidFees) || 0), 0);

  // Outstanding balance is strictly Net Course Fees minus Cleared Amount!
  const pendingFeesCalculated = Math.max(0, totalFeesCalculated - amountPaidCalculated);

  const handleOpenPaymentModal = () => {
    setPaymentAmount(pendingFeesCalculated > 0 ? String(pendingFeesCalculated) : '');
    setSubmittedTicket(null);
    setIsPaymentModalOpen(true);
  };

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

      if (paymentMode === 'Online') {
        const txnRef = upiUtr.trim() || `UPI-TXN-${Date.now().toString().slice(-8)}`;
        const res = await feeService.collectFee({
          studentId: user?.id,
          amountPaid: Number(paymentAmount),
          paymentMode: 'UPI',
          transactionRef: txnRef,
          feeHead: `Tuition Fee Installment (UPI Scanner - ${studentBranch})`,
          branch: studentBranch
        });

        if (res.success) {
          toast.success(`UPI Payment of ₹${Number(paymentAmount).toLocaleString()} verified and completed!`);
          setIsPaymentModalOpen(false);
          setPaymentAmount('');
          setUpiUtr('');
          setRefreshTrigger(prev => prev + 1);
        }
      } else if (paymentMode === 'Cash') {
        const ticket = await feeService.submitOfflineFeeRequest({
          student_id: String(user?.id || 'stu-tp-101'),
          student_name: user?.full_name || user?.name || 'Aarav Deshmukh',
          roll_number: user?.roll_number || user?.rollNo || 'SA-TP-1001',
          branch: studentBranch,
          batch: user?.batch || user?.academic_batch || '11th Science',
          standard: user?.standard || '12th Science',
          amount: Number(paymentAmount),
          payment_mode: 'Cash',
          depositor_name: depositorName.trim() || user?.full_name || user?.name || 'Student',
          notes: cashNotes.trim() || `Cash deposit request for ${studentBranch} accounts counter`
        });
        setSubmittedTicket(ticket);
        toast.success(`Cash payment request forwarded to ${studentBranch} Academic Admin!`);
        loadOfflineRequests();
        setRefreshTrigger(prev => prev + 1);
      } else if (paymentMode === 'Cheque') {
        if (!chequeNumber.trim() || chequeNumber.trim().length < 4) {
          toast.error('Please enter a valid 6-digit cheque number.');
          setIsSubmittingPayment(false);
          return;
        }
        if (!chequeBank.trim()) {
          toast.error('Please enter the issuing bank name and branch.');
          setIsSubmittingPayment(false);
          return;
        }
        const ticket = await feeService.submitOfflineFeeRequest({
          student_id: String(user?.id || 'stu-tp-101'),
          student_name: user?.full_name || user?.name || 'Aarav Deshmukh',
          roll_number: user?.roll_number || user?.rollNo || 'SA-TP-1001',
          branch: studentBranch,
          batch: user?.batch || user?.academic_batch || '11th Science',
          standard: user?.standard || '12th Science',
          amount: Number(paymentAmount),
          payment_mode: 'Cheque',
          cheque_number: chequeNumber.trim(),
          bank_name: chequeBank.trim(),
          cheque_date: chequeDate,
          depositor_name: chequeDepositor.trim() || user?.full_name || user?.name || 'Student',
          notes: `Cheque #${chequeNumber.trim()} deposit for ${studentBranch} accounts counter`
        });
        setSubmittedTicket(ticket);
        toast.success(`Cheque payment request forwarded to ${studentBranch} Academic Admin!`);
        loadOfflineRequests();
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
        {pendingFeesCalculated > 0 ? (
          <Button 
            variant="primary" 
            icon={CreditCard} 
            onClick={handleOpenPaymentModal}
          >
            Pay Installment (₹ {pendingFeesCalculated.toLocaleString()} Left)
          </Button>
        ) : (
          <div className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 fw-semibold d-flex align-items-center gap-1.5 fs-7">
            <CheckCircle2 size={16} /> All Fees Cleared
          </div>
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
                <div className="d-flex flex-column gap-0.5">
                  <span className="text-muted" style={{ fontSize: '0.72rem', textDecoration: 'line-through' }}>
                    Gross Standard: ₹{Number(details.original_fees || (totalFeesCalculated + Number(details.discount_amount))).toLocaleString()}
                  </span>
                  <span className="text-success fw-semibold" style={{ fontSize: '0.78rem' }}>
                    ✓ ₹{Number(details.discount_amount).toLocaleString()} Concession Deducted ({details.discount_approved_by || 'Superadmin'})
                  </span>
                </div>
              ) : details.discount_status === 'PENDING' && Number(details.discount_amount) > 0 ? (
                <span className="text-warning-emphasis fw-semibold" style={{ fontSize: '0.78rem' }}>
                  ⏳ Concession of ₹{Number(details.discount_amount).toLocaleString()} Pending Approval
                </span>
              ) : (
                <span className="small text-sa-muted">Total Net Course Fees</span>
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
            <span className="small text-muted">
              {pendingFeesCalculated > 0 ? `₹ ${pendingFeesCalculated.toLocaleString()} left to pay` : 'All fees fully cleared!'}
            </span>
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
                    ₹ {Number(totalFeesCalculated || val || 0).toLocaleString()}
                  </span>
                  {details.discount_status === 'APPROVED' && Number(details.discount_amount) > 0 && (
                    <span className="badge bg-success-subtle text-success d-block mt-0.5" style={{ fontSize: '0.67rem' }}>
                      -₹{Number(details.discount_amount).toLocaleString()} Disc Deducted
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
              render: (val, row) => {
                const rem = row.pendingAmount != null ? Number(row.pendingAmount) : pendingFeesCalculated;
                return rem > 0 ? (
                  <span className="fw-bold text-danger text-nowrap" style={{ whiteSpace: 'nowrap' }}>
                    ₹ {rem.toLocaleString()}
                  </span>
                ) : (
                  <span
                    className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2.5 py-1 text-xs fw-semibold text-nowrap"
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    Nil (Paid)
                  </span>
                );
              }
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
        />
      </div>

      {/* 4. Student's Offline Payment Requests Tracker (Cash & Cheque) */}
      {offlineRequests.length > 0 && (
        <div className="sa-card p-4 border shadow-sm">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div className="d-flex align-items-center gap-2">
              <Building2 size={18} className="text-danger" />
              <h5 className="brand-font fw-bold text-sa-charcoal m-0 fs-6">
                My Offline Payment Submissions (Cash & Cheque Tracker)
              </h5>
            </div>
            <span className="badge bg-light text-sa-charcoal border small">
              📍 Routed to {studentBranch} Campus Desk
            </span>
          </div>

          <Table
            columns={[
              {
                key: 'id',
                title: 'Request Reference',
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
                key: 'instrument',
                title: 'Instrument / Depositor',
                render: (_, row) =>
                  row.payment_mode === 'Cheque' ? (
                    <div className="small">
                      <span className="fw-semibold text-sa-charcoal d-block">Cheque #{row.cheque_number}</span>
                      <span className="text-muted">{row.bank_name || 'Bank'}</span>
                    </div>
                  ) : (
                    <div className="small">
                      <span className="fw-semibold text-sa-charcoal d-block">Depositor: {row.depositor_name}</span>
                      <span className="text-muted">{row.notes || 'Counter deposit'}</span>
                    </div>
                  )
              },
              {
                key: 'collected_by_faculty',
                title: 'Collected By (Faculty)',
                render: (val) =>
                  val ? (
                    <span className="fw-semibold text-sa-charcoal small d-inline-flex align-items-center gap-1">
                      👤 {val}
                    </span>
                  ) : (
                    <span className="text-muted small fst-italic">Pending at counter</span>
                  )
              },
              {
                key: 'status',
                title: 'Academic Admin Verification',
                render: (val, row) => {
                  if (val === 'APPROVED') {
                    return (
                      <div>
                        <span className="badge bg-success-subtle text-success border border-success-subtle px-2.5 py-1 d-inline-flex align-items-center gap-1 mb-0.5">
                          ✓ Approved ({row.receipt_no || 'Receipted'})
                        </span>
                        <div className="text-muted small" style={{ fontSize: '0.72rem' }}>
                          Verified by: <strong>{row.verified_by || 'Academic Admin'}</strong>
                        </div>
                      </div>
                    );
                  }
                  if (val === 'REJECTED') {
                    return (
                      <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2.5 py-1">
                        ✕ Rejected: {row.admin_remarks || 'Cancelled'}
                      </span>
                    );
                  }
                  return (
                    <span className="badge bg-warning-subtle text-warning-emphasis border border-warning px-2.5 py-1">
                      ⏳ Pending {row.branch} Admin Verification
                    </span>
                  );
                }
              }
            ]}
            data={offlineRequests}
            emptyMessage="No offline requests submitted yet."
          />
        </div>
      )}

      {/* Pay Fee Installment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSubmittedTicket(null);
        }}
        title={submittedTicket ? 'Payment Request Submitted to Admin' : 'Pay Fee Installment'}
        size={submittedTicket ? 'md' : 'lg'}
      >
        {submittedTicket ? (
          /* Confirmation Screen after submitting Cash or Cheque */
          <div className="d-flex flex-column align-items-center text-center p-2">
            <div className="p-3 bg-success-subtle text-success rounded-circle mb-3 shadow-xs">
              <CheckCircle2 size={44} />
            </div>

            <h5 className="fw-extrabold text-sa-charcoal m-0 fs-5">
              Request Forwarded to {studentBranch} Admin!
            </h5>
            <p className="text-muted small mt-1 mb-3">
              Your <strong>{submittedTicket.payment_mode}</strong> fee payment submission has been routed directly to the{' '}
              <strong>{studentBranch} Academic Admin Desk</strong>.
            </p>

            <div className="w-100 p-3 bg-light rounded-3 border text-start small mb-3">
              <div className="d-flex justify-content-between mb-1.5 pb-1.5 border-bottom">
                <span className="text-muted">Request Reference:</span>
                <span className="fw-bold text-danger">{submittedTicket.id}</span>
              </div>
              <div className="d-flex justify-content-between mb-1.5 pb-1.5 border-bottom">
                <span className="text-muted">Payment Mode:</span>
                <span className="badge bg-secondary text-white">{submittedTicket.payment_mode}</span>
              </div>
              <div className="d-flex justify-content-between mb-1.5 pb-1.5 border-bottom">
                <span className="text-muted">Amount Payable:</span>
                <span className="fw-extrabold text-success fs-6">
                  ₹ {Number(submittedTicket.amount).toLocaleString()}
                </span>
              </div>
              <div className="d-flex justify-content-between mb-1.5 pb-1.5 border-bottom">
                <span className="text-muted">Assigned Branch Counter:</span>
                <span className="fw-bold text-sa-charcoal">📍 {studentBranch} Accounts Counter</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-muted">Verification Status:</span>
                <span className="badge bg-warning-subtle text-warning-emphasis">
                  ⏳ Pending Branch Admin Verification
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-2 bg-info-subtle border border-info-subtle text-info-emphasis small text-start w-100 mb-3 d-flex align-items-center gap-2">
              <AlertCircle size={18} className="flex-shrink-0 text-info" />
              <span>
                <strong>Next Step:</strong> Please hand over physical {submittedTicket.payment_mode.toLowerCase()} at the{' '}
                <strong>{studentBranch} Academic Admin desk</strong>. Once marked received by admin, your official fee receipt will be activated here immediately.
              </span>
            </div>

            <Button
              variant="primary"
              className="w-100"
              onClick={() => {
                setIsPaymentModalOpen(false);
                setSubmittedTicket(null);
                setPaymentAmount('');
              }}
            >
              Done / Return to Fees
            </Button>
          </div>
        ) : (
          /* Payment Form */
          <div className="d-flex flex-column gap-3">
            {/* Pending Balance & Student Info Box */}
            <div className="p-3 bg-sa-off-white rounded-3 border">
              <div className="d-flex justify-content-between mb-1.5 pb-1.5 border-bottom">
                <span className="text-sa-muted small">Total Net Course Fees:</span>
                <span className="fw-bold text-sa-charcoal">₹ {totalFeesCalculated.toLocaleString()}</span>
              </div>
              {details.discount_status === 'APPROVED' && Number(details.discount_amount) > 0 && (
                <div className="d-flex justify-content-between mb-1.5 pb-1.5 border-bottom text-success small">
                  <span>Approved Concession ({details.discount_approved_by || 'Superadmin'}):</span>
                  <span className="fw-bold">- ₹ {Number(details.discount_amount).toLocaleString()}</span>
                </div>
              )}
              <div className="d-flex justify-content-between mb-1.5 pb-1.5 border-bottom">
                <span className="text-sa-muted small">Already Cleared:</span>
                <span className="fw-bold text-success">₹ {amountPaidCalculated.toLocaleString()}</span>
              </div>
              <div className="d-flex justify-content-between mb-1.5 pb-1.5 border-bottom">
                <span className="text-danger fw-bold small">Outstanding Balance to Pay:</span>
                <span className="fw-bold text-danger fs-6">₹ {pendingFeesCalculated.toLocaleString()}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-sa-muted small">Student & Campus:</span>
                <span className="badge bg-danger-subtle text-danger border border-danger-subtle fw-semibold">
                  {user?.full_name || user?.name || 'Student'} &bull; 📍 {studentBranch}
                </span>
              </div>
            </div>

            {/* Installment Amount Input with Quick Full Pay Button */}
            <div>
              <div className="d-flex align-items-center justify-content-between mb-1">
                <label className="form-label text-sa-charcoal fw-semibold mb-0" style={{ fontSize: '0.85rem' }}>
                  Installment Amount (₹) *
                </label>
                {pendingFeesCalculated > 0 && (
                  <button
                    type="button"
                    className="btn btn-link p-0 text-decoration-none small text-danger fw-semibold"
                    style={{ fontSize: '0.78rem' }}
                    onClick={() => setPaymentAmount(String(pendingFeesCalculated))}
                  >
                    ⚡ Pay Full Remaining (₹ {pendingFeesCalculated.toLocaleString()})
                  </button>
                )}
              </div>
              <Input
                type="number"
                min="1"
                max={pendingFeesCalculated}
                placeholder="Enter amount to pay"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
            </div>

            {/* Payment Mode Selector */}
            <div className="d-flex flex-column gap-1.5">
              <label className="form-label text-sa-charcoal fw-semibold mb-0" style={{ fontSize: '0.85rem' }}>
                Payment Mode
              </label>
              <select
                className="form-select border-sa-ash shadow-none fw-semibold text-sa-charcoal"
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
              >
                <option value="Online">Online / UPI / QR Scanner (Instant)</option>
                <option value="Cash">Cash (Physical Branch Counter Deposit)</option>
                <option value="Cheque">Cheque (Bank Cheque Submission)</option>
              </select>
            </div>

            {/* MODE 1: ONLINE / UPI SCANNER */}
            {paymentMode === 'Online' && (
              <div className="d-flex flex-column gap-3 mt-1 pt-2 border-top">
                <div className="d-flex align-items-center gap-2">
                  <QrCode size={18} className="text-danger" />
                  <span className="fw-bold text-sa-charcoal small">
                    {studentBranch} Official UPI QR Scanner
                  </span>
                  <span className="badge bg-success-subtle text-success small ms-auto">
                    ● Real-Time Scanner
                  </span>
                </div>

                {/* Render the Branch-Specific UPI QR Scanner uploaded by Academic Admin */}
                <UpiQrDisplay
                  branch={studentBranch}
                  upiId={branchScanner?.upi_id || 'shubham.tarabaipark@upi'}
                  accountName={branchScanner?.account_name || `Shubham Academy (${studentBranch})`}
                  amount={paymentAmount || ''}
                  qrImageUrl={branchScanner?.qr_image_url}
                  size={200}
                />

                {/* UPI UTR / Transaction Reference Input */}
                <div>
                  <Input
                    label="UPI Reference / UTR Number (12 Digits)"
                    placeholder="e.g. 529104829102"
                    value={upiUtr}
                    onChange={(e) => setUpiUtr(e.target.value)}
                  />
                  <span className="text-muted small mt-1 d-block" style={{ fontSize: '0.78rem' }}>
                    Scan QR with GPay / PhonePe / Paytm / BHIM, pay the amount, and enter the 12-digit UTR reference above.
                  </span>
                </div>
              </div>
            )}

            {/* MODE 2: CASH (PHYSICAL DEPOSIT AT BRANCH) */}
            {paymentMode === 'Cash' && (
              <div className="d-flex flex-column gap-3 mt-1 pt-2 border-top">
                {/* Branch Routing Notice */}
                <div className="p-3 rounded-3 bg-success-subtle border border-success-subtle d-flex align-items-start gap-2.5">
                  <Banknote size={22} className="text-success flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="fw-bold text-success d-block small">
                      Redirects to: {studentBranch} Academic Admin Counter
                    </span>
                    <span className="text-success-emphasis small">
                      Physical cash must be submitted at the <strong>{studentBranch}</strong> accounts office. Submitting this request immediately notifies the campus admin queue.
                    </span>
                  </div>
                </div>

                <Input
                  label="Depositor / Payer Name"
                  placeholder="e.g. Aarav Deshmukh / Parent Name"
                  value={depositorName || user?.full_name || user?.name || ''}
                  onChange={(e) => setDepositorName(e.target.value)}
                />

                <div>
                  <label className="form-label text-sa-charcoal fw-semibold mb-1" style={{ fontSize: '0.85rem' }}>
                    Deposit Notes / Remarks (Optional)
                  </label>
                  <textarea
                    className="form-control border-sa-ash shadow-none"
                    rows={2}
                    placeholder={`e.g. Cash fee deposit at ${studentBranch} reception`}
                    value={cashNotes}
                    onChange={(e) => setCashNotes(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* MODE 3: CHEQUE SUBMISSION */}
            {paymentMode === 'Cheque' && (
              <div className="d-flex flex-column gap-3 mt-1 pt-2 border-top">
                {/* Branch Routing Notice */}
                <div className="p-3 rounded-3 bg-primary-subtle border border-primary-subtle d-flex align-items-start gap-2.5">
                  <FileText size={22} className="text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="fw-bold text-primary d-block small">
                      Redirects to: {studentBranch} Academic Admin Counter
                    </span>
                    <span className="text-primary-emphasis small">
                      Cheques should be drawn in favor of <strong>'Shubham Academy'</strong> and handed over at the <strong>{studentBranch}</strong> accounts counter.
                    </span>
                  </div>
                </div>

                <div className="row g-2">
                  <div className="col-12 col-md-6">
                    <Input
                      label="Cheque Number (6 digits) *"
                      placeholder="e.g. 004218"
                      value={chequeNumber}
                      onChange={(e) => setChequeNumber(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <Input
                      label="Bank Name & Branch *"
                      placeholder="e.g. State Bank of India, Kolhapur"
                      value={chequeBank}
                      onChange={(e) => setChequeBank(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <Input
                      label="Cheque Date *"
                      type="date"
                      value={chequeDate}
                      onChange={(e) => setChequeDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <Input
                      label="Account Holder / Depositor Name"
                      placeholder="e.g. Suresh Deshmukh"
                      value={chequeDepositor || user?.full_name || user?.name || ''}
                      onChange={(e) => setChequeDepositor(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="d-flex justify-content-end gap-2 mt-3 pt-3 border-top">
              <Button variant="outline" onClick={() => setIsPaymentModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handlePayInstallment}
                loading={isSubmittingPayment}
                icon={paymentMode === 'Online' ? CreditCard : ArrowRight}
              >
                {paymentMode === 'Online'
                  ? `Pay Securely via UPI (₹${paymentAmount ? Number(paymentAmount).toLocaleString() : '0'})`
                  : paymentMode === 'Cash'
                  ? `Submit Cash Request to ${studentBranch} Admin`
                  : `Submit Cheque to ${studentBranch} Admin`}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
