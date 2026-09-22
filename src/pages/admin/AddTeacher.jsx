import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TeacherForm from '../../components/forms/TeacherForm';
import teacherService from '../../services/teacherService';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';

export default function AddTeacher() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData) => {
    setLoading(true);
    try {
      const created = await teacherService.create(formData);
      toast.success(`Faculty ${created.name} onboarded successfully!`);
      navigate('/admin/teachers');
    } catch {
      toast.error('Failed to onboard faculty member');
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
          onClick={() => navigate('/admin/teachers')}
        >
          <ArrowLeft size={16} /> Back to Faculty Directory
        </button>
        <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
          Onboard New Faculty Member
        </h3>
        <span className="small text-sa-muted">
          Add teacher credentials, subject expertise, and payroll structure
        </span>
      </div>

      <div className="sa-card p-4">
        <TeacherForm
          onSubmit={handleSubmit}
          loading={loading}
          onCancel={() => navigate('/admin/teachers')}
        />
      </div>
    </div>
  );
}
