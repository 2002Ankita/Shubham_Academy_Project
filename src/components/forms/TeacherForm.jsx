import React, { useState } from 'react';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';

export default function TeacherForm({ initialData, onSubmit, loading, onCancel }) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    subject: initialData?.subject || 'Physics',
    qualification: initialData?.qualification || 'M.Sc, B.Ed',
    experience: initialData?.experience || '5 Years',
    monthlySalary: initialData?.monthlySalary || 65000,
    status: initialData?.status || 'Active',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Teacher name is required';
    if (!formData.email.trim()) newErrors.email = 'Email address is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';

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
            label="Faculty Full Name"
            name="name"
            placeholder="e.g. Dr. Priya Kulkarni"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            required
          />
        </div>

        <div className="col-12 col-md-6">
          <Input
            label="Official Email"
            name="email"
            type="email"
            placeholder="faculty@shubham.edu"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            required
          />
        </div>

        <div className="col-12 col-md-6">
          <Input
            label="Phone Number"
            name="phone"
            placeholder="+91 98220 XXXXX"
            value={formData.phone}
            onChange={handleChange}
            error={errors.phone}
            required
          />
        </div>

        <div className="col-12 col-md-6">
          <Select
            label="Primary Subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            options={[
              'Physics',
              'Chemistry',
              'Mathematics',
              'Biology',
              'Computer Science',
              'Accountancy',
              'Economics'
            ]}
          />
        </div>

        <div className="col-12 col-md-6">
          <Input
            label="Educational Qualification"
            name="qualification"
            placeholder="e.g. Ph.D / M.Sc, CSIR-NET"
            value={formData.qualification}
            onChange={handleChange}
            required
          />
        </div>

        <div className="col-12 col-md-6">
          <Input
            label="Teaching Experience"
            name="experience"
            placeholder="e.g. 8 Years"
            value={formData.experience}
            onChange={handleChange}
          />
        </div>

        <div className="col-12 col-md-6">
          <Input
            label="Monthly Base Salary (₹)"
            name="monthlySalary"
            type="number"
            value={formData.monthlySalary}
            onChange={handleChange}
            required
          />
        </div>

        <div className="col-12 col-md-6">
          <Select
            label="Employment Status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            options={['Active', 'On Leave', 'Probation']}
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
          {initialData ? 'Update Teacher' : 'Onboard Teacher'}
        </Button>
      </div>
    </form>
  );
}
