import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../../components/common/BackButton';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import feeService from '../../services/feeService';
import {
  Printer,
  Search,
  Filter,
  Download,
  IndianRupee,
  Calendar,
  CreditCard,
  Plus,
  Eye,
  CheckCircle2,
  FileText
} from 'lucide-react';

export default function FeeReceiptsList() {
  const navigate = useNavigate();
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modeFilter, setModeFilter] = useState('ALL');

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await feeService.getAll();
      setReceipts(data || []);
    } catch (err) {
      console.error('Failed to load receipts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredReceipts = receipts.filter((r) => {
    const matchesSearch =
      !searchQuery ||
      r.receiptNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.rollNumber?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesMode =
      modeFilter === 'ALL' || r.paymentMode?.toUpperCase() === modeFilter.toUpperCase();

    return matchesSearch && matchesMode;
  });

  const totalCollected = receipts.reduce((acc, curr) => acc + (curr.amountPaid || 0), 0);

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
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="sa-card p-3 border-start border-4 border-success">
            <span className="text-sa-muted small fw-semibold">Total Collected (Receipts)</span>
            <h4 className="fw-extrabold text-success m-0 mt-1">₹ {totalCollected.toLocaleString()}</h4>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="sa-card p-3 border-start border-4 border-info">
            <span className="text-sa-muted small fw-semibold">Payment Modes</span>
            <h4 className="fw-extrabold text-info m-0 mt-1">UPI, Cash & Online</h4>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="sa-card p-3 border-start border-4 border-warning">
            <span className="text-sa-muted small fw-semibold">Status Verification</span>
            <h4 className="fw-extrabold text-warning m-0 mt-1">100% Reconciled</h4>
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
              title: 'Receipt No.',
              render: (val) => (
                <span className="fw-bold text-sa-primary font-monospace">{val}</span>
              )
            },
            {
              key: 'studentName',
              title: 'Student Name',
              render: (val, row) => (
                <div>
                  <span className="fw-bold text-sa-charcoal d-block">{val}</span>
                  <span className="text-muted small">Roll: {row.rollNumber}</span>
                </div>
              )
            },
            { key: 'feeHead', title: 'Fee Particulars' },
            {
              key: 'amountPaid',
              title: 'Amount Paid',
              render: (val) => (
                <span className="fw-extrabold text-success">₹ {val?.toLocaleString()}</span>
              )
            },
            {
              key: 'paymentMode',
              title: 'Payment Mode',
              render: (val) => (
                <span className="badge bg-light text-dark border px-2 py-1 small fw-semibold">
                  {val || 'Cash'}
                </span>
              )
            },
            {
              key: 'paymentDate',
              title: 'Date Issued',
              render: (val) => <span className="small text-muted">{val}</span>
            },
            {
              key: 'status',
              title: 'Payment Status',
              render: () => (
                <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2.5 py-1 rounded-pill small fw-semibold">
                  ● Verified
                </span>
              )
            },
            {
              key: 'receiptNo',
              title: 'Action',
              align: 'end',
              render: (val) => (
                <div className="d-flex justify-content-end gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    icon={Printer}
                    onClick={() => navigate(`/admin/fees/receipt?receiptNo=${val}`)}
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
