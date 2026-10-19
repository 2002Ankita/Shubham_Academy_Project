import React, { useState, useEffect } from 'react';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';

const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return null;
  const match = String(timeStr).trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
  if (!match) return null;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const ampm = match[3] ? match[3].toUpperCase() : null;
  if (ampm === 'PM' && h < 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return h * 60 + m;
};

const minutesToTimeDisplay = (totalMins) => {
  let h = Math.floor(totalMins / 60) % 24;
  const m = totalMins % 60;
  const ampm = h >= 12 ? 'pm' : 'am';
  const displayH = h % 12 || 12;
  return `${String(displayH).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
};

const parseDurationToMinutes = (durStr) => {
  if (!durStr) return 180;
  const match = String(durStr).match(/(\d+(?:\.\d+)?)/);
  if (!match) return 180;
  return Math.round(parseFloat(match[1]) * 60);
};

export default function ExamForm({ onSubmit, loading, onCancel, teachers = [] }) {
  const [formData, setFormData] = useState({
    title: 'Mid-Term Assessment 2026',
    standard: '',
    subject: 'Physics',
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00 am',
    endTime: '01:00 pm',
    duration: '3 Hours',
    maxMarks: 100,
    passingMarks: 35,
    roomNo: 'Hall A & B',
    teacher_id: ''
  });

  useEffect(() => {
    if (teachers.length > 0 && !formData.teacher_id) {
      setFormData(prev => ({ ...prev, teacher_id: teachers[0].id }));
    }
  }, [teachers]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const next = { ...prev, [name]: value };

      if (name === 'startTime' || name === 'duration') {
        const sMins = parseTimeToMinutes(name === 'startTime' ? value : prev.startTime);
        const dMins = parseDurationToMinutes(name === 'duration' ? value : prev.duration);
        if (sMins !== null && dMins > 0) {
          next.endTime = minutesToTimeDisplay(sMins + dMins);
        }
      } else if (name === 'endTime') {
        const sMins = parseTimeToMinutes(prev.startTime);
        const eMins = parseTimeToMinutes(value);
        if (sMins !== null && eMins !== null && eMins > sMins) {
          const diffMins = eMins - sMins;
          const h = Math.floor(diffMins / 60);
          const m = diffMins % 60;
          if (m === 0) next.duration = `${h} ${h === 1 ? 'Hour' : 'Hours'}`;
          else next.duration = `${h}h ${m}m`;
        }
      }

      return next;
    });
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
              '11th pcm tarabai park',
              '11th pcb tarabai park',
              '11th pcmb tarabai park',
              '12th pcm tarabai park',
              '12th pcb tarabai park',
              '12th pcmb tarabai park',
              '11th pcm Mangalvar peth',
              '11th pcb Mangalvar peth',
              '11th pcmb Mangalvar peth',
              '12th pcm Mangalvar peth',
              '12th pcb Mangalvar peth',
              '12th pcmb Mangalvar peth'
            ]}
            required
          />
        </div>

        <div className="col-12 col-md-6">
          <Select
            label="Subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            options={['Physics', 'Chemistry', 'Mathematics - I', 'Mathematics - II', 'Biology', 'Accountancy', 'Economics']}
          />
        </div>

        <div className="col-12 col-md-6">
          <Select
            label="Assign Invigilator / Teacher"
            name="teacher_id"
            value={formData.teacher_id}
            onChange={handleChange}
            options={teachers.map(t => ({ value: t.id, label: t.name }))}
          />
        </div>

        <div className="col-12 col-md-3">
          <Input
            label="Exam Date"
            name="date"
            type="date"
            value={formData.date}
            onChange={handleChange}
            required
          />
        </div>

        <div className="col-12 col-md-3">
          <Input
            label="Start Time"
            name="startTime"
            value={formData.startTime}
            onChange={handleChange}
            placeholder="e.g. 10:00 AM or 01:00 pm"
            required
          />
        </div>

        <div className="col-12 col-md-3">
          <Input
            label="End Time"
            name="endTime"
            value={formData.endTime}
            onChange={handleChange}
            placeholder="e.g. 01:00 PM or 04:00 pm"
            required
          />
        </div>

        <div className="col-12 col-md-3">
          <Input
            label="Duration"
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            placeholder="e.g. 3 Hours"
            required
          />
        </div>

        <div className="col-12 col-md-6">
          <Input
            label="Maximum Marks"
            name="maxMarks"
            type="number"
            value={formData.maxMarks}
            onChange={handleChange}
            required
          />
        </div>

        <div className="col-12 col-md-6">
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
          <Button variant="light" type="button" onClick={onCancel}>
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
