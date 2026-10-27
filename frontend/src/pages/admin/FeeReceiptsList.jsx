import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../../components/common/BackButton';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import feeService from '../../services/feeService';
import { useAuth } from '../../hooks/useAuth';
import { getUserBranch, filterFeesByBranch } from '../../utils/branchUtils';
import {
  Printer,
  Search,
  Download,
  Plus
} from 'lucide-react';

export default function FeeReceiptsList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const activeBranch = getUserBranch(user);

  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modeFilter, setModeFilter] = useState('ALL');

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await feeService.getAll({ branch: activeBranch });
      const branchScoped = filterFeesByBranch(data || [], activeBranch);
      setReceipts(branchScoped);
    } catch (err) {
      console.error('Failed to load receipts:', err);
      setReceipts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeBranch]);

  const filteredReceipts = receipts.filter((r) => {
    const matchesSearch =
      !searchQuery ||
      r.receiptNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.rollNumber?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesMode =
      modeFilter === 'ALL' ||
      (r.paymentMode && r.paymentMode.toLowerCase().includes(modeFilter.toLowerCase()));

    return matchesSearch && matchesMode;
  });

  const totalCollected = receipts.reduce((acc, curr) => acc + (Number(curr.amountPaid) || 0), 0);

  // Dynamic statistics for top KPI cards
  const uniqueModes = [...new Set(receipts.map((r) => r.paymentMode).filter(Boolean))];
  const paymentModesSummary =
    uniqueModes.length > 0
      ? uniqueModes.length <= 2
        ? uniqueModes.map(m => m.split('/')[0].trim()).join(' & ')
        : `${uniqueModes.slice(0, 2).map(m => m.split('/')[0].trim()).join(', ')} +${uniqueModes.length - 2}`
      : 'None Recorded';

  const verifiedCount = receipts.filter((r) => Number(r.amountPaid) > 0).length;
  const reconciliationPercent = receipts.length > 0 ? Math.round((verifiedCount / receipts.length) * 100) : 100;

  return (
    <div className="d-flex flex-column gap-4 pb-5">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
        <div>
          <BackButton to="/admin/fees" label="Back to Fee Management" />
          <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
            Fee Receipts Archive
          </h3>
          <span className="small text-sa-muted">
            Official GST-compliant payment receipts, transaction slips, and student fee ledger archives
            {activeBranch ? ` • ${activeBranch}` : ''}
          </span>
        </div>

        <div className="d-flex align-items-center gap-2">
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => navigate('/admin/fees')}
          >
            New Fee Collection
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="row g-3">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="sa-card p-3 border-start border-4 border-primary">
            <span className="text-sa-muted small fw-semibold">Total Receipts Issued</span>
            <h4 className="fw-extrabold text-sa-charcoal m-0 mt-1">{receipts.length}</h4>
            <span className="text-muted small" style={{ fontSize: '0.78rem' }}>Issued & logged</span>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="sa-card p-3 border-start border-4 border-success">
            <span className="text-sa-muted small fw-semibold">Total Collected (Receipts)</span>
            <h4 className="fw-extrabold text-success m-0 mt-1">₹ {totalCollected.toLocaleString()}</h4>
            <span className="text-muted small" style={{ fontSize: '0.78rem' }}>Net realized collections</span>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="sa-card p-3 border-start border-4 border-info">
            <span className="text-sa-muted small fw-semibold">Payment Modes</span>
            <h4 className="fw-extrabold text-info m-0 mt-1">{paymentModesSummary}</h4>
            <span className="text-muted small" style={{ fontSize: '0.78rem' }}>
              {uniqueModes.length} distinct payment channel{uniqueModes.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="sa-card p-3 border-start border-4 border-warning">
            <span className="text-sa-muted small fw-semibold">Status Verification</span>
            <h4 className="fw-extrabold text-warning m-0 mt-1">{reconciliationPercent}% Reconciled</h4>
            <span className="text-muted small" style={{ fontSize: '0.78rem' }}>
              {verifiedCount} of {receipts.length} verified
            </span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="sa-card p-3 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
        <div className="position-relative flex-grow-1" style={{ maxWidth: '420px' }}>
          <Search size={16} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
          <input
            type="text"
            className="form-control ps-5 py-2"
            placeholder="Search receipt #, student name, or roll no..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          <select
            className="form-select form-select-sm py-2 px-3"
            style={{ width: 'auto' }}
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
          >
            <option value="ALL">All Payment Modes</option>
            <option value="UPI">UPI</option>
            <option value="CASH">Cash</option>
            <option value="ONLINE">Online / Netbanking</option>
            <option value="CHEQUE">Cheque</option>
          </select>

          <Button
            variant="outline"
            size="sm"
            icon={Download}
            onClick={() => window.print()}
          >
            Export Table
          </Button>
        </div>
      </div>

      {/* Receipts Table */}
      <div className="sa-card p-4">
        <Table
          columns={[
            {
              key: 'receiptNo',
              title: 'RECEIPT NO.',
              render: (val) => (
                <span className="fw-bold text-sa-primary font-monospace">{val}</span>
              )
            },
            {
              key: 'studentName',
              title: 'STUDENT NAME',
              render: (val, row) => {
                const displayName =
                  val && !val.startsWith('Student ID:') && val.trim() !== ''
                    ? val
                    : (row.student_name || 'Student');
                return (
                  <div>
                    <span className="fw-bold text-sa-charcoal d-block">{displayName}</span>
                    <span className="text-muted small">
                      {row.rollNumber && row.rollNumber !== 'N/A'
                        ? `Roll: ${row.rollNumber}`
                        : (row.batch ? `Batch: ${row.batch}` : (row.standard ? `Standard: ${row.standard}` : 'Registered Student'))}
                    </span>
                  </div>
                );
              }
            },
            {
              key: 'feeHead',
              title: 'FEE PARTICULARS',
              render: (val) => val || 'Tuition & Academic Facilities Fee'
            },
            {
              key: 'amountPaid',
              title: 'AMOUNT PAID',
              render: (val) => (
                <span className="fw-extrabold text-success">₹ {Number(val || 0).toLocaleString()}</span>
              )
            },
            {
              key: 'paymentMode',
              title: 'PAYMENT MODE',
              render: (val) => (
                <span className="badge bg-light text-dark border px-2 py-1 small fw-semibold">
                  {val || 'Cash'}
                </span>
              )
            },
            {
              key: 'paymentDate',
              title: 'DATE ISSUED',
              render: (val) => <span className="small text-muted">{val || 'N/A'}</span>
            },
            {
              key: 'status',
              title: 'PAYMENT STATUS',
              render: (val, row) => {
                const isVerified = (Number(row.amountPaid) || 0) > 0;
                return (
                  <span
                    className={`badge ${
                      isVerified
                        ? 'bg-success bg-opacity-10 text-success border border-success border-opacity-25'
                        : 'bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25'
                    } px-2.5 py-1 rounded-pill small fw-semibold`}
                  >
                    ● {isVerified ? 'Verified' : 'Pending'}
                  </span>
                );
              }
            },
            {
              key: 'receiptNo',
              title: 'ACTION',
              align: 'end',
              render: (val, row) => (
                <div className="d-flex justify-content-end gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    icon={Printer}
                    onClick={() => navigate(`/admin/fees/receipt?receiptNo=${val}`, { state: { receipt: row } })}
                  >
                    Print
                  </Button>
                </div>
              )
            }
          ]}
          data={filteredReceipts}
          loading={loading}
        />
      </div>
    </div>
  );
}
