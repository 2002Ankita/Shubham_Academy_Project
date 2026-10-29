import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import feeService from '../../services/feeService';
import Button from '../../components/common/Button';
import { Printer, ArrowLeft, CheckCircle2 } from 'lucide-react';

// Format currency amounts safely without ever rendering "NaN"
const formatCurrency = (val, fallback = 0) => {
  if (val === null || val === undefined || val === '') {
    return Number(fallback || 0).toLocaleString('en-IN');
  }
  if (typeof val === 'number') {
    return isNaN(val) ? Number(fallback || 0).toLocaleString('en-IN') : val.toLocaleString('en-IN');
  }
  if (typeof val === 'string') {
    const cleaned = val.replace(/[^0-9.-]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? Number(fallback || 0).toLocaleString('en-IN') : num.toLocaleString('en-IN');
  }
  const num = Number(val);
  return isNaN(num) ? Number(fallback || 0).toLocaleString('en-IN') : num.toLocaleString('en-IN');
};

// Extract safe numeric values, defaulting gracefully
const getNumericValue = (val, fallback = 0) => {
  if (val === null || val === undefined || val === '') return fallback;
  if (typeof val === 'number') {
    return isNaN(val) ? fallback : val;
  }
  if (typeof val === 'string') {
    const cleaned = val.replace(/[^0-9.-]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? fallback : num;
  }
  const num = Number(val);
  return isNaN(num) ? fallback : num;
};

export default function FeeReceipt() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const receiptNo = searchParams.get('receiptNo') || '';
  const stateReceipt = location.state?.receipt;

  const [receipt, setReceipt] = useState(stateReceipt || null);
  const [loading, setLoading] = useState(!stateReceipt);

  useEffect(() => {
    let isMounted = true;
    const fetchRec = async () => {
      // If we already have a matching receipt from route state, use it immediately
      if (stateReceipt && (stateReceipt.receiptNo === receiptNo || !receiptNo)) {
        setReceipt(stateReceipt);
        setLoading(false);
        return;
      }

      if (!receiptNo) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const data = await feeService.getReceipt(receiptNo);
        if (isMounted) {
          setReceipt(data);
        }
      } catch (err) {
        console.error('Failed to load receipt:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchRec();
    return () => {
      isMounted = false;
    };
  }, [receiptNo, stateReceipt]);

  const handlePrint = () => {
    window.print();
  };

  if (loading && !receipt) {
    return <div className="p-5 text-center text-sa-muted">Loading official fee receipt...</div>;
  }

  if (!loading && !receipt) {
    return (
      <div className="p-5 text-center d-flex flex-column align-items-center gap-3">
        <div className="text-danger fw-bold fs-5">Receipt Not Found</div>
        <p className="text-muted small">
          No official receipt could be located matching identifier "{receiptNo || 'N/A'}".
        </p>
        <Button variant="outline" onClick={() => navigate('/admin/fees/receipts')}>
          Return to Fee Receipts Archive
        </Button>
      </div>
    );
  }

  // Safe field extractions
  const rData = receipt || {};
  const studentName = rData.studentName || rData.student_name || 'Student';
  const rollNumber = rData.rollNumber || rData.roll_number || 'N/A';
  const standard = rData.standard || rData.batch || 'Higher Secondary Coaching';
  const paymentMode = rData.paymentMode || rData.payment_method || 'Online / Cash Counter';
  const transactionId = rData.transactionId || rData.transaction_reference || 'TXN-PAID';
  const paymentDate = rData.paymentDate || (rData.payment_date ? rData.payment_date.split('T')[0] : new Date().toISOString().split('T')[0]);
  const feeHead = rData.feeHead || rData.remarks || 'Tuition & Academic Facilities Fee';

  // Safe numerical calculations ensuring NO "NaN" ever appears in table
  const amountPaidNum = getNumericValue(rData.amountPaid ?? rData.amount_paid, 0);
  const totalFeesNum = getNumericValue(rData.totalFees ?? rData.total_fees, 0);
  const discountAmountNum = getNumericValue(rData.discountAmount ?? rData.discount_amount, 0);
  const originalFeesNum = getNumericValue(
    rData.originalFees ?? rData.original_fees,
    (totalFeesNum + discountAmountNum) || totalFeesNum
  );
  const pendingAmountNum = getNumericValue(
    rData.pendingAmount ?? rData.pending_fees,
    Math.max(0, totalFeesNum - amountPaidNum)
  );

  return (
    <div className="d-flex flex-column gap-4 align-items-center">
      <div className="w-100 d-flex align-items-center justify-content-between print-hidden" style={{ maxWidth: '680px' }}>
        <button
          type="button"
          className="btn btn-link p-0 d-inline-flex align-items-center gap-1 small text-sa-muted text-decoration-none"
          onClick={() => navigate('/admin/fees')}
        >
          <ArrowLeft size={16} /> Back to Fees
        </button>

        <Button variant="primary" icon={Printer} onClick={handlePrint}>
          Print Official Receipt
        </Button>
      </div>

      {/* Printable Receipt Paper Container */}
      <div
        className="sa-card p-5 bg-white border shadow-sm w-100"
        style={{ maxWidth: '680px', color: '#111' }}
        id="printable-receipt"
      >
        {/* Receipt Header */}
        <div className="d-flex align-items-center justify-content-between pb-4 border-bottom">
          <div className="d-flex align-items-center gap-3">
            <img
              src="/assets/shubham-logo.png"
              alt="Shubham Academy"
              style={{ maxHeight: '60px', width: 'auto' }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <div>
              <h5 className="brand-font fw-extrabold m-0 text-sa-primary" style={{ letterSpacing: '0.02em' }}>
                SHUBHAM ACADEMY
              </h5>
              <span className="small text-muted d-block">Pune & Kolhapur Campuses • Higher Secondary & Coaching</span>
              <span className="text-xs text-muted" style={{ fontSize: '0.72rem' }}>
                Affiliation No: SA-EDU-2026 • GSTIN: 27AABCS1429M1ZQ
              </span>
            </div>
          </div>
          <div className="text-end">
            <span className="badge bg-light text-dark border fw-bold px-3 py-2 fs-6">
              {rData.receiptNo || receiptNo}
            </span>
            <span className="small text-muted d-block mt-1">Date: {paymentDate}</span>
          </div>
        </div>

        {/* Student Particulars */}
        <div className="row g-3 py-4 border-bottom small">
          <div className="col-6">
            <span className="text-muted d-block">Student Name:</span>
            <strong className="fs-6">{studentName}</strong>
          </div>
          <div className="col-6 text-end">
            <span className="text-muted d-block">Roll Number:</span>
            <strong className="fs-6 text-sa-primary">{rollNumber}</strong>
          </div>
          <div className="col-6">
            <span className="text-muted d-block">Course & Standard:</span>
            <span>{standard}</span>
          </div>
          <div className="col-6 text-end">
            <span className="text-muted d-block">Payment Mode:</span>
            <span>{paymentMode} ({transactionId})</span>
          </div>
        </div>

        {/* Particulars Table */}
        <div className="py-4">
          <table className="table table-bordered mb-0">
            <thead className="table-light">
              <tr>
                <th>Description / Fee Head</th>
                <th className="text-end" style={{ width: '160px' }}>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{feeHead}</td>
                <td className="text-end fw-semibold">₹ {formatCurrency(amountPaidNum)}</td>
              </tr>
              {discountAmountNum > 0 && rData.discountStatus === 'APPROVED' && (
                <>
                  <tr>
                    <td className="text-muted">Original Gross Course Fees</td>
                    <td className="text-end text-muted">
                      ₹ {formatCurrency(originalFeesNum)}
                    </td>
                  </tr>
                  <tr className="table-light">
                    <td>
                      <div className="fw-semibold text-success">
                        Approved Discount Concession ({rData.discountReason || 'Approved Concession'})
                      </div>
                      <div className="small mt-0.5" style={{ fontSize: '0.80rem' }}>
                        <span className="text-success fw-semibold">
                          ✓ Approved by: <strong>{rData.discountApprovedBy || 'Superadmin'}</strong>
                        </span>
                      </div>
                    </td>
                    <td className="text-end fw-bold text-success">
                      -₹ {formatCurrency(discountAmountNum)}
                    </td>
                  </tr>
                </>
              )}
              {discountAmountNum > 0 && rData.discountStatus === 'PENDING' && (
                <tr className="table-warning bg-warning bg-opacity-10">
                  <td colSpan="2" className="small text-warning-emphasis">
                    ⏳ Concession request of ₹{formatCurrency(discountAmountNum)} is pending Superadmin approval. Official standard fee applies until approved.
                  </td>
                </tr>
              )}
              <tr>
                <td className="text-muted fw-bold">
                  {rData.discountStatus === 'APPROVED' ? 'Approved Net Course Fees' : 'Total Course Fees'}
                </td>
                <td className="text-end fw-bold fs-6">₹ {formatCurrency(totalFeesNum)}</td>
              </tr>
              <tr>
                <td className="fw-bold">Total Amount Received (Paid)</td>
                <td className="text-end fw-extrabold text-success fs-6">
                  ₹ {formatCurrency(amountPaidNum)}
                </td>
              </tr>
              <tr>
                <td className="text-muted">Outstanding Balance Due</td>
                <td className="text-end fw-semibold text-danger">
                  ₹ {formatCurrency(pendingAmountNum)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer & Signature */}
        <div className="d-flex align-items-end justify-content-between pt-4 border-top">
          <div>
            <div className="d-flex align-items-center gap-2 text-success small mb-1">
              <CheckCircle2 size={18} />
              <span className="fw-semibold">Electronically Verified Payment</span>
            </div>
            {receipt.collectedByFaculty && (
              <div className="text-muted small" style={{ fontSize: '0.78rem' }}>
                Collected by Faculty: <strong className="text-dark">{receipt.collectedByFaculty}</strong>
              </div>
            )}
            {receipt.verifiedBy && (
              <div className="text-muted small" style={{ fontSize: '0.78rem' }}>
                Verified by Admin: <strong className="text-dark">{receipt.verifiedBy}</strong>
              </div>
            )}
            {(discountAmountNum > 0 || Number(receipt.discountAmount) > 0) && (rData.discountApprovedBy || receipt.discountApprovedBy) && (
              <div className="text-muted small" style={{ fontSize: '0.78rem' }}>
                Discount Concession Approved by:{' '}
                <strong className="text-dark">{rData.discountApprovedBy || receipt.discountApprovedBy}</strong>
              </div>
            )}
          </div>
          <div className="text-center" style={{ minWidth: '160px' }}>
            <div className="border-bottom pb-4 mb-1" />
            <span className="small text-muted d-block">Accounts Officer</span>
            <span className="small text-muted fw-bold">Shubham Academy</span>
          </div>
        </div>
      </div>
    </div>
  );
}
