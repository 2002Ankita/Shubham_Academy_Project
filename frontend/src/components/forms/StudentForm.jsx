import React, { useState, useEffect } from 'react';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import BranchBatchSelector from '../common/BranchBatchSelector';
import { useAuth } from '../../hooks/useAuth';
import { getUserBranch } from '../../utils/branchUtils';
import {
  BRANCH_TARABAI,
  BRANCH_MANGALWAR,
  parseLegacyBatch,
  formatStudentBatchDisplay
} from '../../config/branchBatchConfig';

export default function StudentForm({ initialData, onSubmit, loading, onCancel }) {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SuperAdmin';
  const activeBranch = getUserBranch(user);
  const isMangal = Boolean(activeBranch && activeBranch.toLowerCase().includes('mangal'));
  const fallbackBranch = (!isSuperAdmin && activeBranch) ? (isMangal ? BRANCH_MANGALWAR : BRANCH_TARABAI) : BRANCH_TARABAI;
  const fallbackSession = (!isSuperAdmin && isMangal) ? 'Morning' : '';

  const parsed = parseLegacyBatch(initialData?.batch || initialData?.academic_batch || '');
  const defaultBranchVal = initialData?.branch || parsed.branch || fallbackBranch;
  const defaultSessionVal = initialData?.session || parsed.session || (defaultBranchVal === BRANCH_MANGALWAR ? (fallbackSession || 'Morning') : '');

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    standard: initialData?.standard || '12th Science',
    branch: defaultBranchVal,
    academicBatch: initialData?.academicBatch || initialData?.academic_batch || parsed.academicBatch,
    session: defaultSessionVal,
    batch: initialData?.batch || formatStudentBatchDisplay({
      branch: defaultBranchVal,
      session: defaultSessionVal,
      academicBatch: initialData?.academicBatch || initialData?.academic_batch || parsed.academicBatch
    }),
    rollNumber: initialData?.rollNumber || initialData?.student_id || '',
    totalFees: initialData?.totalFees || 45000,
    parentName: initialData?.parentName || '',
    parentPhone: initialData?.parentPhone || '',
    address: initialData?.address || '',
    password: '',
  });

  const [errors, setErrors] = useState({});
  const [feeStructures, setFeeStructures] = useState([]);

  useEffect(() => {
    import('../../services/feeService').then(mod => {
      mod.default.getStructures().then(data => {
        if (Array.isArray(data)) setFeeStructures(data);
      }).catch(err => console.error(err));
    });
  }, []);

  useEffect(() => {
    if (feeStructures.length > 0) {
      const match = feeStructures.find(s => 
        (s.batch && s.batch.toLowerCase() === formData.batch?.toLowerCase()) ||
        (s.standard === formData.standard && s.batch === formData.batch)
      );
      if (match && match.total_fee > 0) {
        setFormData(prev => ({ ...prev, totalFees: match.total_fee }));
      }
    }
  }, [formData.standard, formData.batch, feeStructures]);

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
    if (formData.phone.trim() && formData.parentPhone.trim() && formData.phone.trim() === formData.parentPhone.trim()) {
      newErrors.parentPhone = 'Student and parent mobile numbers must be different';
    }
    if (!initialData && !formData.password.trim()) newErrors.password = 'Password is required';

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
            label="Password"
            name="password"
            type="password"
            placeholder="Enter password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            required={!initialData}
          />
        </div>

        <div className="col-12 col-md-6">
          <Input
            label="Roll Number / Admission ID"
            name="rollNumber"
            placeholder="e.g. STD-111"
            value={formData.rollNumber}
            onChange={handleChange}
            helperText="Auto-assigned sequentially as per entry sequence"
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

        <div className="col-12">
          <BranchBatchSelector
            branch={formData.branch}
            onBranchChange={(b) => setFormData(prev => ({
              ...prev,
              branch: b,
              batch: formatStudentBatchDisplay({ branch: b, session: prev.session, academicBatch: prev.academicBatch })
            }))}
            session={formData.session}
            onSessionChange={(s) => setFormData(prev => ({
              ...prev,
              session: s,
              batch: formatStudentBatchDisplay({ branch: prev.branch, session: s, academicBatch: prev.academicBatch })
            }))}
            academicBatch={formData.academicBatch}
            onAcademicBatchChange={(ab) => setFormData(prev => ({
              ...prev,
              academicBatch: ab,
              batch: formatStudentBatchDisplay({ branch: prev.branch, session: prev.session, academicBatch: ab }),
              standard: ab.includes('12th') ? '12th Science' : '11th Science'
            }))}
            layout="grid"
            fixedBranch={!isSuperAdmin}
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
            helperText="Attendance gate notifications will be sent to this number"
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
            helperText="Fetched automatically based on assigned standard/batch, but can be overridden"
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
