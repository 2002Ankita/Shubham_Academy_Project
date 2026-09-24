import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import feeService from '../../services/feeService';
import Button from '../../components/common/Button';
import { Printer, ArrowLeft, GraduationCap, CheckCircle2 } from 'lucide-react';

export default function FeeReceipt() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const receiptNo = searchParams.get('receiptNo') || 'REC-99120';
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    const fetchRec = async () => {
      const data = await feeService.getReceipt(receiptNo);
      setReceipt(data);
    };
    fetchRec();
  }, [receiptNo]);

  const handlePrint = () => {
    window.print();
  };

  if (!receipt) return <div className="p-4 text-center">Loading receipt details...</div>;

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
            />
            <div>
              <span className="small text-muted d-block">Pune Main Campus • Higher Secondary & Coaching</span>
              <span className="text-xs text-muted">Affiliation No: SA-EDU-2026 • GSTIN: 27AABCS1429M1ZQ</span>
            </div>
          </div>
          <div className="text-end">
            <span className="badge bg-light text-dark border fw-bold px-3 py-2 fs-6">
              {receipt.receiptNo}
            </span>
            <span className="small text-muted d-block mt-1">Date: {receipt.paymentDate}</span>
          </div>
        </div>

        {/* Student Particulars */}
        <div className="row g-3 py-4 border-bottom small">
          <div className="col-6">
            <span className="text-muted d-block">Student Name:</span>
            <strong className="fs-6">{receipt.studentName}</strong>
          </div>
          <div className="col-6 text-end">
            <span className="text-muted d-block">Roll Number:</span>
            <strong className="fs-6 text-sa-primary">{receipt.rollNumber}</strong>
          </div>
          <div className="col-6">
            <span className="text-muted d-block">Course & Standard:</span>
            <span>{receipt.standard}</span>
          </div>
          <div className="col-6 text-end">
            <span className="text-muted d-block">Payment Mode:</span>
            <span>{receipt.paymentMode} ({receipt.transactionId})</span>
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
                <td>{receipt.feeHead || 'Tuition & Academic Facilities Fee'}</td>
                <td className="text-end fw-semibold">₹ {receipt.amountPaid?.toLocaleString()}</td>
              </tr>
              <tr>
                <td className="text-muted">Total Applicable Course Fees</td>
                <td className="text-end text-muted">₹ {receipt.totalFees?.toLocaleString()}</td>
              </tr>
              <tr>
                <td className="fw-bold">Total Amount Received (Paid)</td>
                <td className="text-end fw-extrabold text-success fs-6">
                  ₹ {receipt.amountPaid?.toLocaleString()}
                </td>
              </tr>
              <tr>
                <td className="text-muted">Outstanding Balance Due</td>
                <td className="text-end fw-semibold text-danger">
                  ₹ {receipt.pendingAmount?.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer & Signature */}
        <div className="d-flex align-items-end justify-content-between pt-4 border-top">
          <div className="d-flex align-items-center gap-2 text-success small">
            <CheckCircle2 size={18} />
            <span className="fw-semibold">Electronically Verified Payment</span>
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
