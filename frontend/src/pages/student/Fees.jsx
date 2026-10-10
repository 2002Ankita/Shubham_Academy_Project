import React, { useState, useEffect } from 'react';
import Table from '../../components/common/Table';
import feeService from '../../services/feeService';
import { CreditCard, Download, CheckCircle2, Calendar } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-toastify';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';

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
          const detailData = await feeService.getFeeDetails(user.id);
          if (detailData && detailData.total_fees > 0) {
            setDetails(detailData);
          }

          const allPayments = await feeService.getAll();
          const userPayments = Array.isArray(allPayments)
            ? allPayments.filter(f => f.studentId === detailData?.student_id || f.studentId === user.id)
            : [];

          if (userPayments && userPayments.length > 0) {
            const mapped = userPayments.map((p, idx) => ({
              id: p.id || `PAY-${idx}`,
              receiptNo: p.receiptNo || `REC-${Math.floor(100000 + Math.random() * 900000)}`,
              feeStructureName: p.feeHead || 'Standard Tuition Fee Structure',
              feeStructureYear: '2025 - 2026',
              totalFees: p.totalFees || 0,
              paidFees: p.amountPaid || 0,
              pendingAmount: p.pendingAmount || 0,
              paymentDate: p.paymentDate || 'N/A',
              paymentMode: p.paymentMode || 'Online Bank Transfer',
              transactionId: p.transactionId || `TXN-SA-${idx + 100}`
            }));
            setFeeStructures(mapped);
          } else {
            // Show one row reflecting their total fees if no payments exist yet
            setFeeStructures([{
              id: 'FS-DEFAULT',
              receiptNo: 'N/A',
              feeStructureName: user?.course || 'Current Course Fees',
              feeStructureYear: '2025 - 2026',
              totalFees: detailData?.total_fees || 0,
              paidFees: detailData?.amount_paid || 0,
              pendingAmount: detailData?.pending_fees || detailData?.total_fees || 0,
              paymentDate: 'N/A',
              paymentMode: 'N/A',
              transactionId: 'N/A',
              status: 'Pending'
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
              <tr>
                <td>Total Applicable Course & Tuition Fees</td>
                <td style="text-align: right; font-weight: 600;">₹ ${(fee.totalFees || 0).toLocaleString()}</td>
              </tr>
              <tr class="highlight-row">
                <td>Total Amount Paid & Cleared</td>
                <td style="text-align: right;">₹ ${(fee.paidFees || 0).toLocaleString()}</td>
              </tr>
              <tr>
                <td style="color: ${fee.pendingAmount > 0 ? '#DC2626' : '#16A34A'}; font-weight: bold;">
                  Outstanding Pending Balance
                </td>
                <td style="text-align: right; font-weight: bold; color: ${fee.pendingAmount > 0 ? '#DC2626' : '#16A34A'};">
                  ₹ ${(fee.pendingAmount || 0).toLocaleString()}
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
            <span className="small text-sa-muted fw-semibold">TOTAL APPLICABLE FEES</span>
            <h2 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-3">
              ₹ {totalFeesCalculated.toLocaleString()}
            </h2>
            <span className="small text-sa-muted">Total Course Fees</span>
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
              title: 'Total Fees',
              width: '130px',
              render: (val) => (
                <span className="fw-bold text-sa-charcoal text-nowrap" style={{ whiteSpace: 'nowrap' }}>
                  ₹ {Number(val || 0).toLocaleString()}
                </span>
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
