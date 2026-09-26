import React, { useState, useEffect } from 'react';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';

export default function MarksForm({ students = [], exams = [], onSubmit, loading }) {
  const [formData, setFormData] = useState({
    studentId: students[0]?.id || '',
    examId: exams[0]?.id || '',
    subject: 'Physics',
    maxMarks: 100,
    obtainedMarks: '',
    remarks: 'Consistent academic performance'
  });

  useEffect(() => {
    if (students.length > 0 && !formData.studentId) setFormData(prev => ({ ...prev, studentId: students[0].id }));
    if (exams.length > 0 && !formData.examId) setFormData(prev => ({ ...prev, examId: exams[0].id }));
  }, [students, exams]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const selectedStu = students.find(s => s.id === formData.studentId) || students[0];
    const selectedExam = exams.find(e => e.id === formData.examId) || exams[0];
    onSubmit({
      ...formData,
      studentName: selectedStu?.name,
      rollNumber: selectedStu?.rollNumber,
      examTitle: selectedExam?.title,
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
            name="examId"
            value={formData.examId}
            onChange={handleChange}
            options={exams.map(e => ({ value: e.id, label: e.title }))}
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
