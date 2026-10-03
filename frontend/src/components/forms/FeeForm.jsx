import React, { useState, useEffect } from 'react';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import feeService from '../../services/feeService';

export default function FeeForm({ students = [], onSubmit, loading }) {
  const [formData, setFormData] = useState({
    studentId: '',
    feeHead: 'Term 1 Tuition & Lab Fees',
    amountPaid: 0,
    paymentMode: 'UPI / Online Transfer',
    transactionRef: '',
    remarks: 'Payment acknowledged',
    totalFees: 0,
    alreadyPaid: 0,
    pendingAmount: 0
  });

  useEffect(() => {
    if (students.length > 0 && !formData.studentId) {
      setFormData(prev => ({ ...prev, studentId: students[0].id }));
    }
  }, [students]);

  useEffect(() => {
    if (formData.studentId) {
      feeService.getFeeDetails(formData.studentId)
        .then(data => {
          setFormData(prev => {
             const pending = Number(data.total_fees) - Number(data.amount_paid) - Number(prev.amountPaid || 0);
             return {
               ...prev,
               totalFees: data.total_fees,
               alreadyPaid: data.amount_paid,
               pendingAmount: Math.max(0, pending)
             };
          });
        })
        .catch(err => console.error(err));
    }
  }, [formData.studentId]);

  const handleChange = (e) => {
    const val = e.target.value;
    const name = e.target.name;

    if (name === 'studentId') {
      setFormData({
        ...formData,
        studentId: val,
        amountPaid: 0
      });
      return;
    }

    setFormData(prev => {
      const newData = { ...prev, [name]: val };
      if (['totalFees', 'alreadyPaid', 'amountPaid'].includes(name)) {
        const pending = Number(newData.totalFees) - Number(newData.alreadyPaid) - Number(newData.amountPaid || 0);
        newData.pendingAmount = Math.max(0, pending);
      }
      return newData;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const selStudent = students.find(s => s.id === formData.studentId) || students[0];
    onSubmit({
      ...formData,
      studentName: selStudent?.name,
      rollNumber: selStudent?.rollNumber,
      standard: selStudent?.standard
    });
  };

  return (
    <form onSubmit={handleSubmit} className="sa-card p-4">
      <h5 className="brand-font fw-bold text-sa-charcoal mb-3 fs-6">
        Student Fee Collection Counter
      </h5>

      <div className="row g-3">
        <div className="col-12 col-md-6">
          <Select
            label="Select Student"
            name="studentId"
            value={formData.studentId}
            onChange={handleChange}
            options={students.map(s => ({
              value: s.id,
              label: `${s.rollNumber} - ${s.name} (${s.standard})`
            }))}
          />
        </div>

        <div className="col-12 col-md-6">
          <Select
            label="Fee Head / Category"
            name="feeHead"
            value={formData.feeHead}
            onChange={handleChange}
            options={[
              'Annual Full Tuition Fee',
              'Term 1 Installment',
              'Term 2 Installment',
              'Exam & Lab Certification Fee',
              'Study Material Book Set'
            ]}
          />
        </div>

        <div className="col-12 col-md-3">
          <Input
            label="Total Course Fees (₹)"
            name="totalFees"
            type="number"
            value={formData.totalFees}
            onChange={handleChange}
          />
        </div>

        <div className="col-12 col-md-3">
          <Input
            label="Already Paid (₹)"
            name="alreadyPaid"
            type="number"
            value={formData.alreadyPaid}
            onChange={handleChange}
            disabled={true}
          />
        </div>

        <div className="col-12 col-md-3">
          <Input
            label="New Amount Paid (₹)"
            name="amountPaid"
            type="number"
            value={formData.amountPaid}
            onChange={handleChange}
            required
          />
        </div>

        <div className="col-12 col-md-3">
          <Input
            label="Balance Pending (₹)"
            name="pendingAmount"
            type="number"
            value={formData.pendingAmount}
            onChange={handleChange}
            disabled={true}
          />
        </div>

        <div className="col-12 col-md-4">
          <Select
            label="Payment Mode"
            name="paymentMode"
            value={formData.paymentMode}
            onChange={handleChange}
            options={[
              'UPI / Online Transfer',
              'Cash Counter',
              'Cheque',
              'Debit / Credit Card',
              'NEFT / RTGS'
            ]}
          />
        </div>

        <div className="col-12 col-md-6">
          <Input
            label="Transaction ID / Cheque No."
            name="transactionRef"
            placeholder="e.g. UPI-984210029"
            value={formData.transactionRef}
            onChange={handleChange}
          />
        </div>

        <div className="col-12 col-md-6">
          <Input
            label="Remarks / Notes"
            name="remarks"
            value={formData.remarks}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="d-flex justify-content-end mt-4">
        <Button type="submit" variant="primary" loading={loading}>
          Record Payment & Generate Receipt
        </Button>
      </div>
    </form>
  );
}
