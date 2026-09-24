import React, { useState, useEffect } from 'react';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import feeService from '../../services/feeService';
import { AlertCircle, Send, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function PendingFees() {
  const navigate = useNavigate();
  const [pendingList, setPendingList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPending = async () => {
      setLoading(true);
      try {
        const data = await feeService.getPending();
        setPendingList(data);
      } finally {
        setLoading(false);
      }
    };
    fetchPending();
  }, []);

  const handleSendReminder = (studentName) => {
    toast.success(`Payment reminder SMS dispatched to ${studentName}'s parents!`);
  };

  const totalOutstanding = pendingList.reduce((acc, curr) => acc + (curr.pendingAmount || 0), 0);

  return (
    <div className="d-flex flex-column gap-4">
      <div>
        <button
          type="button"
          className="btn btn-link p-0 d-inline-flex align-items-center gap-1 small text-sa-muted mb-2 text-decoration-none"
          onClick={() => navigate('/admin/fees')}
        >
          <ArrowLeft size={16} /> Back to Fee Counter
        </button>
        <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
          <div>
            <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
              Fee Defaulters & Outstanding Dues
            </h3>
            <span className="small text-sa-muted">
              Track overdue student accounts and dispatch automated SMS payment gateway links
            </span>
          </div>

          <div className="p-3 bg-white border rounded-3 d-flex align-items-center gap-3 shadow-sm">
            <AlertCircle size={24} className="text-danger" />
            <div>
              <span className="small text-sa-muted d-block lh-1">Total Outstanding</span>
              <span className="fw-extrabold text-danger fs-5">₹ {totalOutstanding.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="sa-card p-4">
        <Table
          columns={[
            { key: 'rollNumber', title: 'Roll No.', render: (val) => <span className="fw-bold">{val}</span> },
            { key: 'studentName', title: 'Student Name' },
            { key: 'standard', title: 'Class / Stream' },
            { key: 'totalFees', title: 'Total Fees', render: (val) => `₹ ${val?.toLocaleString()}` },
            { key: 'amountPaid', title: 'Paid Till Date', render: (val) => `₹ ${val?.toLocaleString()}` },
            {
              key: 'pendingAmount',
              title: 'Overdue Amount',
              render: (val) => <span className="fw-bold text-danger">₹ {val?.toLocaleString()}</span>
            },
            {
              key: 'status',
              title: 'Status',
              render: (val) => <span className="badge-overdue">{val}</span>
            },
            {
              key: 'id',
              title: 'Action',
              align: 'end',
              render: (val, row) => (
                <Button
                  size="sm"
                  variant="outline"
                  icon={Send}
                  onClick={() => handleSendReminder(row.studentName)}
                >
                  Send SMS Alert
                </Button>
              )
            }
          ]}
          data={pendingList}
          loading={loading}
        />
      </div>
    </div>
  );
}
