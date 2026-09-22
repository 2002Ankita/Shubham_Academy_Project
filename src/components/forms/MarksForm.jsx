import React, { useState } from 'react';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';

export default function MarksForm({ students = [], exams = [], onSubmit, loading }) {
  const [formData, setFormData] = useState({
    studentId: students[0]?.id || 'STU-001',
    examTitle: exams[0]?.title || 'Mid-Term Assessment 2026',
    subject: 'Physics',
    maxMarks: 100,
    obtainedMarks: '',
    remarks: 'Consistent academic performance'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const selectedStu = students.find(s => s.id === formData.studentId) || students[0];
    onSubmit({
      ...formData,
      studentName: selectedStu?.name,
      rollNumber: selectedStu?.rollNumber,
      maxMarks: Number(formData.maxMarks),
      obtainedMarks: Number(formData.obtainedMarks)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="sa-card p-4">
      <h5 className="brand-font fw-bold text-sa-charcoal mb-3 fs-6">
        Student Marks Recording Sheet
      </h5>

      <div className="row g-3">
        <div className="col-12 col-md-6">
          <Select
            label="Select Student"
            name="studentId"
            value={formData.studentId}
            onChange={handleChange}
            options={students.map(s => ({ value: s.id, label: `${s.rollNumber} - ${s.name} (${s.standard})` }))}
          />
        </div>

        <div className="col-12 col-md-6">
          <Select
            label="Examination"
            name="examTitle"
            value={formData.examTitle}
            onChange={handleChange}
            options={[
              'Mid-Term Assessment 2026',
              'Unit Test 1 (Physics & Chemistry)',
              'Unit Test 2 (Mathematics)',
              'Preliminary Board Exam 2026'
            ]}
          />
        </div>

        <div className="col-12 col-md-4">
          <Select
            label="Subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            options={['Physics', 'Chemistry', 'Mathematics', 'Biology', 'English']}
          />
        </div>

        <div className="col-12 col-md-4">
          <Input
            label="Max Marks"
            name="maxMarks"
            type="number"
            value={formData.maxMarks}
            onChange={handleChange}
            required
          />
        </div>

        <div className="col-12 col-md-4">
          <Input
            label="Obtained Marks"
            name="obtainedMarks"
            type="number"
            placeholder="e.g. 88"
            value={formData.obtainedMarks}
            onChange={handleChange}
            required
          />
        </div>

        <div className="col-12">
          <Input
            label="Faculty Remarks / Feedback"
            name="remarks"
            placeholder="e.g. Excellent command over numerical problems"
            value={formData.remarks}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="d-flex justify-content-end mt-4">
        <Button type="submit" variant="primary" loading={loading}>
          Save & Publish Mark
        </Button>
      </div>
    </form>
  );
}
