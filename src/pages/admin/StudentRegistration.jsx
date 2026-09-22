import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentForm from '../../components/forms/StudentForm';
import studentService from '../../services/studentService';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { toast } from 'react-toastify';

export default function StudentRegistration() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData) => {
    setLoading(true);
    try {
      const created = await studentService.create(formData);
      toast.success(`Student ${created.name} registered with Roll No: ${created.rollNumber}!`);
      navigate('/admin/students');
    } catch {
      toast.error('Failed to register student');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex flex-column gap-4" style={{ maxWidth: '900px' }}>
      <div>
        <button
          type="button"
          className="btn btn-link p-0 d-inline-flex align-items-center gap-1 small text-sa-muted mb-2 text-decoration-none"
          onClick={() => navigate('/admin/students')}
        >
          <ArrowLeft size={16} /> Back to Student Directory
        </button>
        <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
          Student Admission & Registration
        </h3>
        <span className="small text-sa-muted">
          Fill in student profile, parent contact for RFID SMS dispatch, and assign smart badge
        </span>
      </div>

      <div className="sa-card p-4">
        <StudentForm
          onSubmit={handleSubmit}
          loading={loading}
          onCancel={() => navigate('/admin/students')}
        />
      </div>
    </div>
  );
}
