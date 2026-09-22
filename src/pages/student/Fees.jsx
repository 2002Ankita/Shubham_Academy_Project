import React, { useState, useEffect } from 'react';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import feeService from '../../services/feeService';
import { CreditCard, Printer, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function StudentFees() {
  const navigate = useNavigate();
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFees = async () => {
      setLoading(true);
      try {
        const data = await feeService.getAll();
        // Filter to Aarav
        setFees(data.filter(f => f.studentId === 'STU-001'));
      } finally {
        setLoading(false);
      }
    };
    fetchFees();
  }, []);

  return (
    <div className="d-flex flex-column gap-4">
      <div>
        <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
          My Academic Fees & Receipts
        </h3>
        <span className="small text-sa-muted">
          Tuition installments, payment transaction history, and official fee slips
        </span>
      </div>

      <div className="row g-3">
        <div className="col-12 col-md-4">
          <div className="sa-card p-4">
            <span className="small text-sa-muted fw-semibold">TOTAL APPLICABLE FEES</span>
            <h2 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-3">₹ 45,000</h2>
            <span className="small text-sa-muted">12th Science Annual Tuition & Labs</span>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="sa-card p-4">
            <span className="small text-sa-muted fw-semibold">TOTAL AMOUNT CLEARED</span>
            <h2 className="brand-font fw-extrabold text-success m-0 fs-3">₹ 45,000</h2>
            <span className="small text-success d-flex align-items-center gap-1 mt-1">
              <CheckCircle2 size={14} /> 100% Cleared (No Dues)
            </span>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="sa-card p-4">
            <span className="small text-sa-muted fw-semibold">OUTSTANDING BALANCE</span>
            <h2 className="brand-font fw-extrabold text-sa-muted m-0 fs-3">₹ 0</h2>
            <span className="small text-muted">All installments settled</span>
          </div>
        </div>
      </div>

      <div className="sa-card p-4">
        <h5 className="brand-font fw-bold text-sa-charcoal mb-3 fs-6">
          Payment Transactions
        </h5>

        <Table
          columns={[
            { key: 'receiptNo', title: 'Receipt Number', render: (val) => <span className="fw-bold text-sa-primary">{val}</span> },
            { key: 'feeHead', title: 'Fee Particulars' },
            { key: 'paymentDate', title: 'Payment Date' },
            { key: 'amountPaid', title: 'Amount Paid', render: (val) => <span className="fw-bold text-success">₹ {val?.toLocaleString()}</span> },
            { key: 'paymentMode', title: 'Mode' },
            { key: 'transactionId', title: 'Transaction Ref' },
            {
              key: 'status',
              title: 'Status',
              render: (val) => <span className="badge-paid">{val}</span>
            },
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
                  Print Slip
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
