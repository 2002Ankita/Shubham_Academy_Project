import React, { useState } from 'react';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';

export default function StudentForm({ initialData, onSubmit, loading, onCancel }) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    standard: initialData?.standard || '12th Science',
    batch: initialData?.batch || 'Batch Alpha (Morning)',
    rfidCard: initialData?.rfidCard || 'RFID-' + Math.floor(100000 + Math.random() * 900000),
    totalFees: initialData?.totalFees || 45000,
    parentName: initialData?.parentName || '',
    parentPhone: initialData?.parentPhone || '',
    address: initialData?.address || '',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Student name is required';
    if (!formData.email.trim()) newErrors.email = 'Email address is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.parentPhone.trim()) newErrors.parentPhone = 'Parent phone is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="p-1">
      <div className="row g-3">
        <div className="col-12 col-md-6">
          <Input
            label="Full Name"
            name="name"
            placeholder="e.g. Aarav Deshmukh"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            required
          />
        </div>

        <div className="col-12 col-md-6">
          <Input
            label="Email Address"
            name="email"
            type="email"
            placeholder="student@shubham.edu"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            required
          />
        </div>

        <div className="col-12 col-md-6">
          <Input
            label="Student Phone Number"
            name="phone"
            placeholder="+91 98231 XXXXX"
            value={formData.phone}
            onChange={handleChange}
            error={errors.phone}
            required
          />
        </div>

        <div className="col-12 col-md-6">
          <Input
            label="Assigned RFID Smart Card"
            name="rfidCard"
            placeholder="RFID-XXXXXX"
            value={formData.rfidCard}
            onChange={handleChange}
            helperText="Tap badge on RFID reader or enter code"
            required
          />
        </div>

        <div className="col-12 col-md-6">
          <Select
            label="Standard / Stream"
            name="standard"
            value={formData.standard}
            onChange={handleChange}
            options={[
              '12th Science',
              '11th Science',
              '12th Commerce',
              '11th Commerce',
              '10th Foundation'
            ]}
          />
        </div>

        <div className="col-12 col-md-6">
          <Select
            label="Batch Assignment"
            name="batch"
            value={formData.batch}
            onChange={handleChange}
            options={[
              'Batch Alpha (Morning: 07:30 - 11:30)',
              'Batch Beta (Evening: 03:30 - 07:30)',
              'NEET Intensive Batch',
              'Foundation Weekend Batch'
            ]}
          />
        </div>

        <div className="col-12 col-md-6">
          <Input
            label="Parent / Guardian Name"
            name="parentName"
            placeholder="e.g. Sanjay Deshmukh"
            value={formData.parentName}
            onChange={handleChange}
            required
          />
        </div>

        <div className="col-12 col-md-6">
          <Input
            label="Parent Phone (SMS Gateway Alerts)"
            name="parentPhone"
            placeholder="+91 98231 XXXXX"
            value={formData.parentPhone}
            onChange={handleChange}
            error={errors.parentPhone}
            helperText="RFID gate notifications will be sent to this number"
            required
          />
        </div>

        <div className="col-12 col-md-6">
          <Input
            label="Total Course Fees (₹)"
            name="totalFees"
            type="number"
            value={formData.totalFees}
            onChange={handleChange}
            required
          />
        </div>

        <div className="col-12 col-md-6">
          <Input
            label="Residential Address"
            name="address"
            placeholder="Flat / House No, Street, City"
            value={formData.address}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="d-flex align-items-center justify-content-end gap-2 mt-4 pt-3 border-top">
        {onCancel && (
          <Button variant="light" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" variant="primary" loading={loading}>
          {initialData ? 'Update Student Record' : 'Complete Registration'}
        </Button>
      </div>
    </form>
  );
}
