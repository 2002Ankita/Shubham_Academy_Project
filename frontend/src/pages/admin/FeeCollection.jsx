import React, { useState, useEffect } from 'react';
import FeeForm from '../../components/forms/FeeForm';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import BackButton from '../../components/common/BackButton';
import feeService from '../../services/feeService';
import {
  Printer,
  AlertCircle,
  History,
  Receipt,
  Info,
  Coins,
  ReceiptIndianRupee,
  CreditCard,
  TrendingUp,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getUserBranch } from '../../utils/branchUtils';
import { BRANCH_MANGALWAR, BRANCH_TARABAI } from '../../config/branchBatchConfig';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function FeeCollection() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const activeBranch = getUserBranch(user);
  const isMangal = Boolean(activeBranch && activeBranch.toLowerCase().includes('mangal'));
  const currentBranch = isMangal ? BRANCH_MANGALWAR : BRANCH_TARABAI;
  const [selectedCampus, setSelectedCampus] = useState(isMangal ? BRANCH_MANGALWAR : BRANCH_TARABAI);

  // Automatically keep campus synchronized with user's assigned branch
  useEffect(() => {
    if (activeBranch) {
      const isM = Boolean(activeBranch.toLowerCase().includes('mangal'));
      setSelectedCampus(isM ? BRANCH_MANGALWAR : BRANCH_TARABAI);
    }
  }, [activeBranch]);

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [feeDetails, setFeeDetails] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [feeStats, setFeeStats] = useState({
    totalTarget: 0,
    collected: 0,
    pending: 0,
    collectionRate: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);

  const fetchStats = async (branchToFetch = selectedCampus) => {
    try {
      setLoadingStats(true);
      const stats = await feeService.getFeeStats(branchToFetch);
      if (stats) {
        setFeeStats({
          totalTarget: Number(stats.totalTarget) || 0,
          collected: Number(stats.collected) || 0,
          pending: Number(stats.pending) || 0,
          collectionRate: stats.collectionRate || 0
        });
      }
    } catch (err) {
      console.error('Failed to load fee stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats(selectedCampus);
  }, [selectedCampus]);

  // Callback triggered when student selection changes in FeeForm
  const handleStudentSelectChange = (student, details, payments) => {
    setSelectedStudent(student);
    setFeeDetails(details);
    setPaymentHistory(payments || []);
  };

  const handleFeeSubmit = async (formData) => {
    try {
      const res = await feeService.collectFee(formData);
      toast.success(`Fee collected! Receipt #${res.receipt.receiptNo} generated.`);

      // Refresh payment history and fee details for this student
      if (selectedStudent?.id) {
        setLoadingHistory(true);
        try {
          const [updatedDetails, updatedPayments] = await Promise.all([
            feeService.getFeeDetails(selectedStudent.id, {
              branch: formData.branch,
              standard: formData.standard
            }),
            feeService.getAll({
              student_id: selectedStudent.id,
              branch: formData.branch,
              standard: formData.standard
            })
          ]);
          setFeeDetails(updatedDetails);
          const stuPayments = (updatedPayments || []).filter(
            (p) => String(p.studentId) === String(selectedStudent.id)
          );
          setPaymentHistory(stuPayments);
        } catch (err) {
          console.error('Failed to refresh student payment history:', err);
        } finally {
          setLoadingHistory(false);
        }
      }

      // Refresh overall fee stats
      fetchStats();

      // Navigate to printable receipt
      navigate(`/admin/fees/receipt?receiptNo=${res.receipt.receiptNo}`, {
        state: { receipt: res.receipt }
      });
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to record fee payment.');
      throw err;
    }
  };

  return (
    <div className="d-flex flex-column gap-4">
      {/* Top Header */}
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

      {/* Fees Overview Section */}
      <div id="fees-overview" className="d-flex flex-column gap-3">
        <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-2">
          <div className="d-flex align-items-center gap-2">
            <div
              className="rounded-3 d-flex align-items-center justify-content-center text-white shadow-xs"
              style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #D97718 0%, #B45309 100%)' }}
            >
              <Coins size={17} />
            </div>
            <div>
              <div className="d-flex align-items-center gap-2">
                <h4 className="brand-font fw-bold text-sa-charcoal m-0" style={{ fontSize: '1.05rem', lineHeight: 1.2 }}>
                  Fees Overview
                </h4>
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
              <span className="text-sa-muted" style={{ fontSize: '0.78rem' }}>
                Summary of total target fees, collections, and pending dues for {selectedCampus}
              </span>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2 flex-wrap">

            <button
              type="button"
              onClick={() => navigate('/admin/fees/pending')}
              className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1.5 rounded-2 px-2.5 py-1"
              style={{ fontSize: '0.76rem', fontWeight: 600 }}
            >
              <AlertCircle size={13} />
              <span>Pending Defaulters List</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/fees/receipts')}
              className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1.5 rounded-2 px-2.5 py-1"
              style={{ fontSize: '0.76rem', fontWeight: 600 }}
            >
              <Receipt size={13} />
              <span>All Receipts</span>
            </button>
          </div>
        </div>

        {/* KPI Cards Row */}
        <div className="row g-3 g-xl-4">
          {/* 1. Total Target Fees */}
          <div className="col-12 col-sm-6 col-xl-3">
            <div className="sa-kpi-glass-card theme-blue p-3 p-xl-3.5 d-flex flex-column justify-content-between h-100">
              <div className="d-flex align-items-start justify-content-between">
                <div className="sa-stat-icon-wrapper sa-stat-icon-blue">
                  <CreditCard size={22} />
                </div>
                <div className="sa-card-chevron-btn">
                  <ChevronRight size={15} />
                </div>
              </div>
              <div className="mt-2.5">
                <span className="text-sa-muted fw-semibold d-block" style={{ fontSize: '0.80rem' }}>
                  Total Target Fees
                </span>
                <div className="fw-bold text-sa-charcoal brand-font" style={{ fontSize: '1.75rem', lineHeight: 1.15 }}>
                  {loadingStats ? '...' : `₹${feeStats.totalTarget.toLocaleString('en-IN')}`}
                </div>
                <span className="fw-semibold" style={{ fontSize: '0.76rem', color: '#2563EB' }}>
                  ↗ Total Academic Revenue
                </span>
              </div>
            </div>
          </div>

          {/* 2. Monthly Fees Collected (from Dashboard) */}
          <div className="col-12 col-sm-6 col-xl-3">
            <div className="sa-kpi-glass-card theme-amber p-3 p-xl-3.5 d-flex flex-column justify-content-between h-100">
              <div className="d-flex align-items-start justify-content-between">
                <div className="sa-stat-icon-wrapper sa-stat-icon-amber">
                  <Coins size={22} />
                </div>
                <div className="sa-card-chevron-btn">
                  <ChevronRight size={15} />
                </div>
              </div>
              <div className="mt-2.5">
                <span className="text-sa-muted fw-semibold d-block" style={{ fontSize: '0.80rem' }}>
                  Fees Collected ({isMangal ? 'Mangalvar' : 'Tarabai'})
                </span>
                <div className="fw-bold text-sa-charcoal brand-font" style={{ fontSize: '1.75rem', lineHeight: 1.15 }}>
                  {loadingStats ? '...' : `₹${feeStats.collected.toLocaleString('en-IN')}`}
                </div>
                <span className="fw-semibold" style={{ fontSize: '0.76rem', color: '#168554' }}>
                  ▲ {loadingStats ? '0' : feeStats.collectionRate}% Realized Payments
                </span>
              </div>
            </div>
          </div>

          {/* 3. Pending Fees (from Dashboard) */}
          <div className="col-12 col-sm-6 col-xl-3">
            <div
              className="sa-kpi-glass-card theme-red p-3 p-xl-3.5 d-flex flex-column justify-content-between h-100 cursor-pointer"
              onClick={() => navigate('/admin/fees/pending')}
              title="Click to view pending defaulters & send reminders"
            >
              <div className="d-flex align-items-start justify-content-between">
                <div className="sa-stat-icon-wrapper sa-stat-icon-red">
                  <ReceiptIndianRupee size={22} />
                </div>
                <div className="sa-card-chevron-btn">
                  <ChevronRight size={15} />
                </div>
              </div>
              <div className="mt-2.5">
                <span className="text-sa-muted fw-semibold d-block" style={{ fontSize: '0.80rem' }}>
                  Pending Fees ({isMangal ? 'Mangalvar' : 'Tarabai'})
                </span>
                <div className="fw-bold text-sa-charcoal brand-font" style={{ fontSize: '1.75rem', lineHeight: 1.15 }}>
                  {loadingStats ? '...' : `₹${feeStats.pending.toLocaleString('en-IN')}`}
                </div>
                <span className="fw-semibold" style={{ fontSize: '0.76rem', color: '#DC2626' }}>
                  ▲ Outstanding Overdue • Click to view
                </span>
              </div>
            </div>
          </div>

          {/* 4. Collection Rate */}
          <div className="col-12 col-sm-6 col-xl-3">
            <div className="sa-kpi-glass-card theme-green p-3 p-xl-3.5 d-flex flex-column justify-content-between h-100">
              <div className="d-flex align-items-start justify-content-between">
                <div className="sa-stat-icon-wrapper sa-stat-icon-green rounded-circle">
                  <TrendingUp size={22} />
                </div>
                <div className="sa-card-chevron-btn">
                  <ChevronRight size={15} />
                </div>
              </div>
              <div className="mt-2.5">
                <span className="text-sa-muted fw-semibold d-block" style={{ fontSize: '0.80rem' }}>
                  Collection Rate
                </span>
                <div className="fw-bold text-sa-charcoal brand-font" style={{ fontSize: '1.75rem', lineHeight: 1.15 }}>
                  {loadingStats ? '...' : `${feeStats.collectionRate}%`}
                </div>
                <span className="fw-semibold" style={{ fontSize: '0.76rem', color: '#168554' }}>
                  ✓ Overall Recovery Progress
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fee Collection Form with Branch + Standard Filter and Student Selection */}
      <FeeForm
        onSubmit={handleFeeSubmit}
        onStudentSelectChange={handleStudentSelectChange}
      />

      {/* Selected Student Payment History Section */}
      <div className="sa-card p-4 p-lg-4 border shadow-sm">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className="d-flex align-items-center gap-2">
            <History size={18} className="text-sa-primary" />
            <h5 className="brand-font fw-bold text-sa-charcoal m-0 fs-6">
              {selectedStudent
                ? `Payment History — ${selectedStudent.name} (${selectedStudent.rollNumber})`
                : 'Student Payment History'}
            </h5>
          </div>
          {selectedStudent && paymentHistory.length > 0 && (
            <span className="badge bg-light text-sa-charcoal border px-2.5 py-1 small">
              {paymentHistory.length} {paymentHistory.length === 1 ? 'Record' : 'Records'} Found
            </span>
          )}
        </div>

        {selectedStudent ? (
          paymentHistory.length > 0 ? (
            <Table
              columns={[
                {
                  key: 'receiptNo',
                  title: 'Receipt No.',
                  render: (val) => <span className="fw-bold text-sa-primary">{val}</span>
                },
                { key: 'paymentDate', title: 'Payment Date' },
                { key: 'feeHead', title: 'Fee Particulars / Remarks' },
                {
                  key: 'amountPaid',
                  title: 'Amount Paid',
                  render: (val) => (
                    <span className="fw-bold text-success">
                      ₹ {Number(val || 0).toLocaleString()}
                    </span>
                  )
                },
                {
                  key: 'pendingAmount',
                  title: 'Balance Due',
                  render: (val) => (
                    <span
                      className={
                        Number(val) > 0 ? 'text-danger fw-semibold' : 'text-success fw-semibold'
                      }
                    >
                      ₹ {Number(val || 0).toLocaleString()}
                    </span>
                  )
                },
                { key: 'paymentMode', title: 'Payment Mode' },
                {
                  key: 'transactionId',
                  title: 'Reference / Txn ID',
                  render: (val) => <span className="text-muted small">{val || 'N/A'}</span>
                },
                {
                  key: 'receiptNo',
                  title: 'Action',
                  align: 'end',
                  render: (val, row) => (
                    <Button
                      size="sm"
                      variant="outline"
                      icon={Printer}
                      onClick={() => navigate(`/admin/fees/receipt?receiptNo=${val}`, { state: { receipt: row } })}
                    >
                      Print Receipt
                    </Button>
                  )
                }
              ]}
              data={paymentHistory}
              loading={loadingHistory}
            />
          ) : (
            <div className="alert alert-light border border-dashed rounded-3 p-4 text-center my-2">
              <Receipt size={28} className="text-secondary opacity-75 mb-2" />
              <h6 className="fw-bold text-sa-charcoal mb-1">
                No payment history found for this student.
              </h6>
              <p className="text-muted small mb-0">
                This student has not made any fee payments yet. You can record their first tuition installment using the form above.
              </p>
            </div>
          )
        ) : (
          <div className="alert alert-light border border-dashed rounded-3 p-4 text-center my-2 text-muted">
            <Info size={28} className="text-secondary opacity-75 mb-2" />
            <h6 className="fw-bold text-sa-charcoal mb-1">
              No Student Selected
            </h6>
            <p className="small mb-0">
              Select Branch, Standard, and an eligible student above to view their fee ledger and past payment receipts.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
