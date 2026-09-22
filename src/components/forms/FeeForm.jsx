import React, { useState } from 'react';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';

export default function FeeForm({ students = [], onSubmit, loading }) {
  const [formData, setFormData] = useState({
    studentId: students[0]?.id || 'STU-001',
    feeHead: 'Term 1 Tuition & Lab Fees',
    totalFees: 45000,
    amountPaid: 15000,
    paymentMode: 'UPI / Online Transfer',
    transactionRef: '',
    remarks: 'Payment acknowledged'
  });

  const handleChange = (e) => {
    const val = e.target.value;
    const name = e.target.name;

    if (name === 'studentId') {
      const selected = students.find(s => s.id === val);
      setFormData({
        ...formData,
        studentId: val,
        totalFees: selected?.totalFees || 45000
      });
      return;
    }

    setFormData({ ...formData, [name]: val });
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

        <div className="col-12 col-md-4">
          <Input
            label="Total Course Fees (₹)"
            name="totalFees"
            type="number"
            value={formData.totalFees}
            onChange={handleChange}
            disabled
          />
        </div>

        <div className="col-12 col-md-4">
          <Input
            label="Amount Paid (₹)"
            name="amountPaid"
            type="number"
            value={formData.amountPaid}
            onChange={handleChange}
            required
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
