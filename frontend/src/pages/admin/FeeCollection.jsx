import React, { useState, useEffect } from 'react';
import FeeForm from '../../components/forms/FeeForm';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import BackButton from '../../components/common/BackButton';
import feeService from '../../services/feeService';
import { Printer, AlertCircle, History, Receipt, Info, QrCode, FileCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function FeeCollection() {
  const navigate = useNavigate();
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [feeDetails, setFeeDetails] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [pendingOfflineCount, setPendingOfflineCount] = useState(0);

  useEffect(() => {
    const fetchOfflineCount = async () => {
      try {
        const reqs = await feeService.getOfflineFeeRequests();
        const count = (reqs || []).filter(r => r.status === 'PENDING').length;
        setPendingOfflineCount(count);
      } catch (err) {
        // silent
      }
    };
    fetchOfflineCount();
    const handleUpdate = () => fetchOfflineCount();
    window.addEventListener('sa_offline_fee_requests_updated', handleUpdate);
    return () => window.removeEventListener('sa_offline_fee_requests_updated', handleUpdate);
  }, []);

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

      // Navigate to printable receipt
      navigate(`/admin/fees/receipt?receiptNo=${res.receipt.receiptNo}`);
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

        <div className="d-flex gap-2 flex-wrap">
          <Button
            variant="primary"
            onClick={() => navigate('/admin/fees/offline-requests')}
            className="d-flex align-items-center gap-1.5"
          >
            <FileCheck size={16} />
            <span>Cash & Cheque Requests</span>
            {pendingOfflineCount > 0 && (
              <span className="badge bg-warning text-dark ms-1 px-1.5 py-0.5 rounded-pill fw-bold" style={{ fontSize: '0.72rem' }}>
                {pendingOfflineCount}
              </span>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate('/admin/fees/upi-scanner')}
            className="d-flex align-items-center gap-1.5"
          >
            <QrCode size={16} /> Branch UPI Scanner
          </Button>

          <Button variant="outline" onClick={() => navigate('/admin/fees/pending')}>
            <AlertCircle size={16} /> View Pending Overdues
          </Button>
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
                  render: (val) => (
                    <Button
                      size="sm"
                      variant="outline"
                      icon={Printer}
                      onClick={() => navigate(`/admin/fees/receipt?receiptNo=${val}`)}
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
