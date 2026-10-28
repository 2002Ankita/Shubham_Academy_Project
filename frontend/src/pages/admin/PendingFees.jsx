import React, { useState, useEffect } from 'react';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import feeService from '../../services/feeService';
import { useAuth } from '../../hooks/useAuth';
import { getUserBranch } from '../../utils/branchUtils';
import { BRANCH_MANGALWAR, BRANCH_TARABAI } from '../../config/branchBatchConfig';
import { AlertCircle, Send, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function PendingFees() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const activeBranch = getUserBranch(user);
  const isMangal = Boolean(activeBranch && activeBranch.toLowerCase().includes('mangal'));
  const [selectedCampus, setSelectedCampus] = useState(isMangal ? BRANCH_MANGALWAR : BRANCH_TARABAI);

  const [pendingList, setPendingList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPending = async (campus = selectedCampus) => {
    setLoading(true);
    try {
      const data = await feeService.getPending({ branch: campus });
      setPendingList(data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending(selectedCampus);
  }, [selectedCampus]);

  const handleSendReminder = (studentName) => {
    toast.success(`Payment reminder SMS dispatched to ${studentName}'s parents!`);
  };

  const totalOutstanding = pendingList.reduce((acc, curr) => acc + (Number(curr.pendingAmount) || 0), 0);

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
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
                Fee Defaulters & Outstanding Dues
              </h3>
              <span
                className="badge rounded-pill fw-semibold px-2 py-0.5"
                style={{
                  backgroundColor: selectedCampus === BRANCH_MANGALWAR ? '#F0FDFA' : '#FDF0F0',
                  color: selectedCampus === BRANCH_MANGALWAR ? '#0D9488' : '#8B1216',
                  border: selectedCampus === BRANCH_MANGALWAR ? '1px solid #99F6E4' : '1px solid #F5C2C4',
                  fontSize: '0.70rem'
                }}
              >
                {selectedCampus === BRANCH_MANGALWAR ? '🏛️ Mangalvar Peth Campus' : '🌲 Tarabai Park Campus'}
              </span>
            </div>
            <span className="small text-sa-muted">
              Track overdue student accounts and dispatch automated SMS payment gateway links for {selectedCampus}
            </span>
          </div>

          <div className="d-flex align-items-center gap-3 flex-wrap">
            {/* Campus Selector */}
            <div className="btn-group p-0.5 rounded-2 bg-light border" role="group" aria-label="Campus selector">
              <button
                type="button"
                onClick={() => setSelectedCampus(BRANCH_TARABAI)}
                className={`btn btn-sm px-2.5 py-1 rounded-2 fw-semibold d-inline-flex align-items-center gap-1.5 transition-all ${
                  selectedCampus === BRANCH_TARABAI
                    ? 'btn-danger text-white shadow-xs'
                    : 'btn-light text-secondary'
                }`}
                style={{
                  fontSize: '0.78rem',
                  backgroundColor: selectedCampus === BRANCH_TARABAI ? '#8B1216' : 'transparent',
                  borderColor: selectedCampus === BRANCH_TARABAI ? '#8B1216' : 'transparent'
                }}
              >
                <span>🌲 Tarabai Park</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedCampus(BRANCH_MANGALWAR)}
                className={`btn btn-sm px-2.5 py-1 rounded-2 fw-semibold d-inline-flex align-items-center gap-1.5 transition-all ${
                  selectedCampus === BRANCH_MANGALWAR
                    ? 'btn-danger text-white shadow-xs'
                    : 'btn-light text-secondary'
                }`}
                style={{
                  fontSize: '0.78rem',
                  backgroundColor: selectedCampus === BRANCH_MANGALWAR ? '#8B1216' : 'transparent',
                  borderColor: selectedCampus === BRANCH_MANGALWAR ? '#8B1216' : 'transparent'
                }}
              >
                <span>🏛️ Mangalvar Peth</span>
              </button>
            </div>

            <div className="p-2.5 px-3 bg-white border rounded-3 d-flex align-items-center gap-3 shadow-sm">
              <AlertCircle size={22} className="text-danger" />
              <div>
                <span className="small text-sa-muted d-block lh-1" style={{ fontSize: '0.72rem' }}>Total Outstanding</span>
                <span className="fw-extrabold text-danger fs-5">₹ {totalOutstanding.toLocaleString('en-IN')}</span>
              </div>
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
