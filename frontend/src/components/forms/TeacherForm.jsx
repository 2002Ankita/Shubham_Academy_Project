import React, { useState } from 'react';
import { Phone } from 'lucide-react';
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
    password: '',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      // If user types faculty name and email is either empty or matches admin email, suggest faculty email
      if (name === 'name' && (!prev.email || prev.email.includes('admin@shubham.edu'))) {
        const cleanName = value.trim().toLowerCase().replace(/[^a-z0-9]/g, '.').replace(/\.+/g, '.');
        if (cleanName) {
          updated.email = `${cleanName}@shubham.edu`;
        }
      }
      return updated;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Teacher name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (
      formData.email.trim().toLowerCase() === 'admin@shubham.edu' ||
      formData.email.trim().toLowerCase() === 'superadmin@shubham.edu'
    ) {
      newErrors.email = "Please enter the faculty member's personal or official email (cannot use the academy admin account email).";
    }

    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!initialData && !formData.password.trim()) newErrors.password = 'Password is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="p-1" autoComplete="off">
      <div className="row g-3">
        <div className="col-12 col-md-6">
          <Input
            label="Faculty Full Name"
            name="name"
            placeholder="e.g. Dr. Priya Kulkarni"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            autoComplete="off"
            required
          />
        </div>

        <div className="col-12 col-md-6">
          <Input
            label="Faculty Official Email"
            name="email"
            type="email"
            placeholder="e.g. faculty.name@shubham.edu"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            autoComplete="new-password"
            helperText="Provide a unique email for the teacher's login"
            required
          />
        </div>

        <div className="col-12 col-md-6">
          <label className="form-label small fw-semibold text-sa-charcoal mb-1">
            Phone Number <span className="text-danger">*</span>
          </label>
          <div className="sa-custom-input-group">
            <div className="sa-input-icon">
              <Phone size={16} />
            </div>
            <input
              type="tel"
              name="phone"
              placeholder="+91 98220 XXXXX"
              value={formData.phone}
              onChange={handleChange}
              autoComplete="off"
              className={`sa-custom-input ${errors.phone ? 'border-danger' : ''}`}
            />
          </div>
          {errors.phone && <div className="text-danger small mt-1">{errors.phone}</div>}
        </div>

        <div className="col-12 col-md-6">
          <Input
            label="Portal Password"
            name="password"
            type="password"
            placeholder="Create password for faculty login"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            autoComplete="new-password"
            required={!initialData}
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
              'Mathematics - I',
              'Mathematics - II',
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
