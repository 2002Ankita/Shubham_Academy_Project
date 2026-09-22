import React from 'react';
import Table from '../../components/common/Table';
import { BookOpen, UserCheck, Clock, MapPin } from 'lucide-react';

export default function StudentClasses() {
  const timetable = [
    { day: 'Monday', time: '08:00 AM - 09:30 AM', subject: 'Physics (Advanced Mechanics)', teacher: 'Dr. Priya Kulkarni', room: 'Hall 2' },
    { day: 'Monday', time: '10:00 AM - 11:30 AM', subject: 'Mathematics (Calculus)', teacher: 'Prof. Amit Sawant', room: 'Hall 2' },
    { day: 'Tuesday', time: '08:00 AM - 09:30 AM', subject: 'Chemistry (Physical Chemistry)', teacher: 'Mrs. Neha Deshpande', room: 'Hall 2' },
    { day: 'Wednesday', time: '08:00 AM - 09:30 AM', subject: 'Physics (Wave Optics)', teacher: 'Dr. Priya Kulkarni', room: 'Hall 2' },
    { day: 'Wednesday', time: '10:00 AM - 11:30 AM', subject: 'Mathematics (Vectors)', teacher: 'Prof. Amit Sawant', room: 'Hall 2' },
    { day: 'Thursday', time: '08:00 AM - 10:00 AM', subject: 'Physics Practical Lab', teacher: 'Dr. Priya Kulkarni', room: 'Physics Lab 1' },
    { day: 'Friday', time: '08:00 AM - 09:30 AM', subject: 'Chemistry (Organic Reaction Mechanisms)', teacher: 'Mrs. Neha Deshpande', room: 'Hall 2' },
  ];

  return (
    <div className="d-flex flex-column gap-4">
      <div>
        <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
          My Weekly Class Schedule & Timetable
        </h3>
        <span className="small text-sa-muted">
          Class 12th Science (Batch Alpha) • Pune Main Campus
        </span>
      </div>

      <div className="sa-card p-4">
        <Table
          columns={[
            { key: 'day', title: 'Day', render: (val) => <span className="fw-bold">{val}</span> },
            { key: 'time', title: 'Session Timing', render: (val) => <span className="fw-semibold text-sa-primary">{val}</span> },
            { key: 'subject', title: 'Subject & Topic' },
            { key: 'teacher', title: 'Faculty' },
            { key: 'room', title: 'Classroom / Lab', render: (val) => <span className="badge bg-light text-dark border">{val}</span> }
          ]}
          data={timetable}
        />
      </div>
    </div>
  );
}
