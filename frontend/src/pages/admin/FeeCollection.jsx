import React, { useState, useEffect } from 'react';
import FeeForm from '../../components/forms/FeeForm';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import BackButton from '../../components/common/BackButton';
import feeService from '../../services/feeService';
import studentService from '../../services/studentService';
import { CreditCard, Printer, Eye, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function FeeCollection() {
  const navigate = useNavigate();
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [feeList, stuList] = await Promise.all([
        feeService.getAll(),
        studentService.getAll()
      ]);
      setFees(feeList);
      setStudents(stuList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFeeSubmit = async (formData) => {
    const res = await feeService.collectFee(formData);
    toast.success(`Fee collected! Receipt #${res.receipt.receiptNo} generated.`);
    fetchData();
    navigate(`/admin/fees/receipt?receiptNo=${res.receipt.receiptNo}`);
  };

  return (
    <div className="d-flex flex-column gap-4">
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
        <div>
          <BackButton to="/admin/dashboard" label="Back to Dashboard" />
          <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
            Fee Collection Counter
          </h3>
          <span className="small text-sa-muted">
            Record tuition payments, generate GST receipts, and manage student fee ledgers
          </span>
        </div>

        <div className="d-flex gap-2">
          <Button variant="outline" onClick={() => navigate('/admin/fees/pending')}>
            <AlertCircle size={16} /> View Pending Overdues
          </Button>
        </div>
      </div>

      {/* Collection Form */}
      <FeeForm students={students} onSubmit={handleFeeSubmit} />

      {/* Recent Receipts Table */}
      <div className="sa-card p-4">
        <h5 className="brand-font fw-bold text-sa-charcoal mb-3 fs-6">
          Recent Fee Payments & Receipts
        </h5>

        <Table
          columns={[
            {
              key: 'receiptNo',
              title: 'Receipt No.',
              render: (val) => <span className="fw-bold text-sa-primary">{val}</span>
            },
            { key: 'studentName', title: 'Student Name' },
            { key: 'rollNumber', title: 'Roll No.' },
            { key: 'feeHead', title: 'Fee Particulars' },
            {
              key: 'totalFees',
              title: 'Course Fee & Concession',
              render: (val, row) => (
                <div>
                  <span className="fw-semibold d-block">₹ {val?.toLocaleString() || 0}</span>
                  {row.discountAmount > 0 && row.discountStatus === 'APPROVED' && (
                    <div className="small mt-0.5" style={{ fontSize: '0.70rem' }}>
                      <span className="badge bg-success-subtle text-success">
                        -₹{row.discountAmount.toLocaleString()} Approved Concession
                      </span>
                      {row.discountApprovedBy && (
                        <span className="text-muted d-block" style={{ fontSize: '0.67rem' }}>
                          By: <strong>{row.discountApprovedBy}</strong>
                        </span>
                      )}
                    </div>
                  )}
                  {row.discountAmount > 0 && row.discountStatus === 'PENDING' && (
                    <div className="small mt-0.5" style={{ fontSize: '0.70rem' }}>
                      <span className="badge bg-warning-subtle text-warning-emphasis">
                        ⏳ ₹{row.discountAmount.toLocaleString()} Concession Pending
                      </span>
                    </div>
                  )}
                </div>
              )
            },
            {
              key: 'amountPaid',
              title: 'Amount Paid',
              render: (val) => <span className="fw-bold text-success">₹ {val?.toLocaleString()}</span>
            },
            {
              key: 'pendingAmount',
              title: 'Balance Due',
              render: (val) => (
                <span className={val > 0 ? 'text-danger fw-semibold' : 'text-muted'}>
                  ₹ {val?.toLocaleString()}
                </span>
              )
            },
            { key: 'paymentMode', title: 'Payment Mode' },
            { key: 'paymentDate', title: 'Date' },
            {
              key: 'receiptNo',
              title: 'Receipt',
              align: 'end',
              render: (val) => (
                <Button
                  size="sm"
                  variant="outline"
                  icon={Printer}
                  onClick={() => navigate(`/admin/fees/receipt?receiptNo=${val}`)}
                >
                  Print
                </Button>
              )
            }
          ]}
          data={fees}
          loading={loading}
        />
      </div>
    </div>
  );
}
