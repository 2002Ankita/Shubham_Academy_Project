import React from 'react';
import StatCard from '../../components/dashboard/StatCard';
import QuickActions from '../../components/dashboard/QuickActions';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import { BookOpen, Users, CalendarCheck, FileSpreadsheet, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const todaySchedule = [
    { time: '08:00 AM - 09:30 AM', subject: 'Physics - Wave Optics', standard: '12th Science - Alpha', room: 'Hall 2' },
    { time: '10:00 AM - 11:30 AM', subject: 'Physics - Rotational Dynamics', standard: '11th Science - Beta', room: 'Hall 4' },
    { time: '02:00 PM - 03:30 PM', subject: 'Physics Lab - Practical Set A', standard: '12th Science - Alpha', room: 'Physics Lab' },
    { time: '04:00 PM - 05:00 PM', subject: 'Doubt Clearing Clinic', standard: 'All Batches', room: 'Faculty Room' },
  ];

  return (
    <div className="d-flex flex-column gap-4">
      {/* Welcome Banner */}
      <div className="sa-card p-4 bg-white border d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
        <div>
          <span className="badge bg-sa-mustard text-dark fw-bold mb-2">
            Faculty Portal • Senior Faculty
          </span>
          <h2 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
            Welcome, {user?.name || 'Dr. Priya Kulkarni'}
          </h2>
          <span className="small text-sa-muted">
            Physics Department • 120 Active Students Under Mentorship
          </span>
        </div>

        <div className="d-flex gap-2">
          <Button variant="primary" onClick={() => navigate('/teacher/marks')}>
            Enter Marks
          </Button>
          <Button variant="outline" onClick={() => navigate('/teacher/study-materials')}>
            Upload Notes
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="row g-3">
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="My Batches"
            value="3 Classes"
            subtitle="12th Alpha, 11th Beta, NEET"
            icon={BookOpen}
            color="primary"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Total Students"
            value="120"
            subtitle="Across 3 assigned streams"
            icon={Users}
            color="green"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Lectures Today"
            value="4 Sessions"
            subtitle="3 Theory + 1 Practical"
            icon={CalendarCheck}
            color="mustard"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Pending Marks"
            value="1 Exam"
            subtitle="Unit Test 1 (Class 12th)"
            icon={FileSpreadsheet}
            color="orange"
          />
        </div>
      </div>

      {/* Shortcuts */}
      <QuickActions role="teacher" />

      {/* Today's Teaching Schedule */}
      <div className="sa-card p-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className="d-flex align-items-center gap-2">
            <Clock size={18} className="text-sa-primary" />
            <h5 className="brand-font fw-bold m-0 text-sa-charcoal fs-6">
              Today's Lecture Schedule
            </h5>
          </div>
          <span className="badge bg-success small">Current Term Active</span>
        </div>

        <Table
          columns={[
            { key: 'time', title: 'Timing', render: (val) => <span className="fw-bold text-sa-primary">{val}</span> },
            { key: 'subject', title: 'Subject & Topic' },
            { key: 'standard', title: 'Batch / Section' },
            { key: 'room', title: 'Classroom / Lab', render: (val) => <span className="badge bg-light text-dark border">{val}</span> }
          ]}
          data={todaySchedule}
        />
      </div>
    </div>
  );
}
