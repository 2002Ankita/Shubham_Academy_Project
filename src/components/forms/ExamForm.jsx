import React, { useState } from 'react';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';

export default function ExamForm({ onSubmit, loading, onCancel }) {
  const [formData, setFormData] = useState({
    title: 'Mid-Term Assessment 2026',
    standard: '12th Science',
    subject: 'Physics',
    date: '2026-10-15',
    startTime: '10:00 AM',
    duration: '3 Hours',
    maxMarks: 100,
    passingMarks: 35,
    roomNo: 'Hall A & B'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      maxMarks: Number(formData.maxMarks),
      passingMarks: Number(formData.passingMarks)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="sa-card p-4">
      <h5 className="brand-font fw-bold text-sa-charcoal mb-3 fs-6">
        Schedule New Examination
      </h5>

      <div className="row g-3">
        <div className="col-12 col-md-6">
          <Input
            label="Examination Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>

        <div className="col-12 col-md-6">
          <Select
            label="Target Standard / Class"
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

        <div className="col-12 col-md-4">
          <Select
            label="Subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            options={['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Accountancy', 'Economics']}
          />
        </div>

        <div className="col-12 col-md-4">
          <Input
            label="Exam Date"
            name="date"
            type="date"
            value={formData.date}
            onChange={handleChange}
            required
          />
        </div>

        <div className="col-12 col-md-4">
          <Input
            label="Start Time"
            name="startTime"
            value={formData.startTime}
            onChange={handleChange}
            placeholder="e.g. 10:00 AM"
            required
          />
        </div>

        <div className="col-12 col-md-4">
          <Input
            label="Duration"
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            placeholder="e.g. 3 Hours"
            required
          />
        </div>

        <div className="col-12 col-md-4">
          <Input
            label="Maximum Marks"
            name="maxMarks"
            type="number"
            value={formData.maxMarks}
            onChange={handleChange}
            required
          />
        </div>

        <div className="col-12 col-md-4">
          <Input
            label="Assigned Examination Hall"
            name="roomNo"
            value={formData.roomNo}
            onChange={handleChange}
            placeholder="e.g. Hall A"
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
          Create & Announce Exam
        </Button>
      </div>
    </form>
  );
}
