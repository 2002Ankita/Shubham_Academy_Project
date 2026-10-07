import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TeacherForm from '../../components/forms/TeacherForm';
import teacherService from '../../services/teacherService';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import '../../styles/teacherOnboarding.css';

export default function AddTeacher() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(1);

  const handleStepClick = (step, elementId) => {
    setActiveStep(step);
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleSubmit = async (formData) => {
    setLoading(true);
    try {
      const created = await teacherService.create(formData);
      // Auto-generate salary drafts for the new teacher so they appear in the payroll register
      try {
        const salaryService = (await import('../../services/salaryService')).default;
        const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
        await salaryService.generateDrafts(currentMonth);
      } catch (e) {
        console.warn('Could not auto-generate salary draft', e);
      }
      
      toast.success(`Faculty ${created.full_name || created.name || formData.name} onboarded successfully!`);
      navigate('/admin/teachers');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to onboard faculty member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex flex-column gap-3 pb-5 teacher-onboarding-container">
      {/* Back Link */}
      <div>
        <button
          type="button"
          className="btn btn-link p-0 d-inline-flex align-items-center gap-1.5 small text-sa-charcoal fw-semibold text-decoration-none"
          onClick={() => navigate('/admin/teachers')}
          style={{ fontSize: '13.5px' }}
        >
          <ArrowLeft size={16} />
          <span>Back to Faculty Directory</span>
        </button>
      </div>

      {/* Header with Title & Stepper */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
        <div>
          <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
            Onboard New Faculty Member
          </h3>
          <span className="small text-sa-muted">
            Create a faculty profile, assign academic details and configure employment information.
          </span>
        </div>

        {/* Stepper Progress */}
        <div className="sa-stepper-container">
          {/* Step 1 */}
          <div
            className="sa-stepper-node cursor-pointer"
            onClick={() => handleStepClick(1, 'personal-section')}
            style={{ cursor: 'pointer' }}
          >
            <div className={`sa-stepper-circle ${activeStep === 1 ? 'active' : 'inactive'}`}>
              1
            </div>
            <span className={`sa-stepper-label ${activeStep === 1 ? 'active' : 'inactive'}`}>
              Personal Details
            </span>
          </div>

          <div className="sa-stepper-line" />

          {/* Step 2 */}
          <div
            className="sa-stepper-node cursor-pointer"
            onClick={() => handleStepClick(2, 'academic-section')}
            style={{ cursor: 'pointer' }}
          >
            <div className={`sa-stepper-circle ${activeStep === 2 ? 'active' : 'inactive'}`}>
              2
            </div>
            <span className={`sa-stepper-label ${activeStep === 2 ? 'active' : 'inactive'}`}>
              Academic Details
            </span>
          </div>

          <div className="sa-stepper-line" />

          {/* Step 3 */}
          <div
            className="sa-stepper-node cursor-pointer"
            onClick={() => handleStepClick(3, 'employment-section')}
            style={{ cursor: 'pointer' }}
          >
            <div className={`sa-stepper-circle ${activeStep === 3 ? 'active' : 'inactive'}`}>
              3
            </div>
            <span className={`sa-stepper-label ${activeStep === 3 ? 'active' : 'inactive'}`}>
              Employment
            </span>
          </div>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="sa-card p-4 p-lg-4 bg-white rounded-4 shadow-sm border">
        <TeacherForm
          onSubmit={handleSubmit}
          loading={loading}
          onCancel={() => navigate('/admin/teachers')}
        />
      </div>
    </div>
  );
}
