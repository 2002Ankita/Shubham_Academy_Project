import React, { useState, useEffect } from 'react';
import StatCard from '../../components/dashboard/StatCard';
import QuickActions from '../../components/dashboard/QuickActions';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import { GraduationCap, CalendarCheck, CreditCard, Award, ArrowRight, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import attendanceService from '../../services/attendanceService';
import noticeService from '../../services/noticeService';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notices, setNotices] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      const data = await noticeService.getAll();
      setNotices(data);
    };
    loadData();
  }, []);

  const upcomingLectures = [
    { time: '08:00 AM - 09:30 AM', subject: 'Physics (Wave Optics)', teacher: 'Dr. Priya Kulkarni', room: 'Hall 2' },
    { time: '10:00 AM - 11:30 AM', subject: 'Mathematics (Calculus)', teacher: 'Prof. Amit Sawant', room: 'Hall 2' },
    { time: '12:00 PM - 01:30 PM', subject: 'Chemistry (Polymers)', teacher: 'Mrs. Neha Deshpande', room: 'Hall 2' },
  ];

  return (
    <div className="d-flex flex-column gap-4">
      {/* Student Welcome Banner */}
      <div className="sa-card p-4 bg-white border d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
        <div className="d-flex align-items-center gap-3">
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80'}
            alt="Student"
            className="rounded-circle border"
            style={{ width: '60px', height: '60px', objectFit: 'cover' }}
          />
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span className="badge bg-sa-primary text-white">Student Portal</span>
              <span className="badge bg-light text-dark border">RFID: RFID-984210</span>
            </div>
            <h2 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
              Welcome, {user?.name || 'Aarav Deshmukh'}
            </h2>
            <span className="small text-sa-muted">
              Roll No: <strong className="text-sa-charcoal">SA-2026-1042</strong> • Class: 12th Science (Batch Alpha)
            </span>
          </div>
        </div>

        <div className="d-flex gap-2">
          <Button variant="outline" onClick={() => navigate('/student/fees')}>
            View Fee Receipt
          </Button>
          <Button variant="primary" onClick={() => navigate('/student/results')}>
            My Report Card
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="row g-3">
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Gate Attendance"
            value="94.2%"
            subtitle="Verified RFID card taps"
            icon={CalendarCheck}
            color="green"
            trend="Active record"
            trendType="up"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Fee Status"
            value="Paid in Full"
            subtitle="₹ 45,000 cleared"
            icon={CreditCard}
            color="primary"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Class Rank"
            value="Rank #1"
            subtitle="Physics Unit Assessment"
            icon={Award}
            color="mustard"
            trend="94% Score"
            trendType="up"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Next Examination"
            value="16 Days"
            subtitle="Mid-Term Assessment"
            icon={BookOpen}
            color="orange"
          />
        </div>
      </div>

      {/* Shortcuts */}
      <QuickActions role="student" />

      {/* Today's Lectures & Circulars */}
      <div className="row g-3">
        <div className="col-12 col-lg-7">
          <div className="sa-card p-4 h-100">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h5 className="brand-font fw-bold m-0 text-sa-charcoal fs-6">
                Today's Lectures & Classroom Schedule
              </h5>
              <span className="badge bg-success small">Morning Batch</span>
            </div>
            <Table
              columns={[
                { key: 'time', title: 'Timing', render: (val) => <span className="fw-bold text-sa-primary">{val}</span> },
                { key: 'subject', title: 'Subject & Topic' },
                { key: 'teacher', title: 'Faculty' },
                { key: 'room', title: 'Room', render: (val) => <span className="badge bg-light text-dark border">{val}</span> }
              ]}
              data={upcomingLectures}
            />
          </div>
        </div>

        <div className="col-12 col-lg-5">
          <div className="sa-card p-4 h-100">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h5 className="brand-font fw-bold m-0 text-sa-charcoal fs-6">
                Academy Notices
              </h5>
              <button
                type="button"
                className="btn btn-link p-0 text-sa-primary small fw-semibold d-flex align-items-center gap-1"
                onClick={() => navigate('/student/announcements')}
              >
                <span>All Notices</span>
                <ArrowRight size={14} />
              </button>
            </div>
            <div className="d-flex flex-column gap-3">
              {notices.slice(0, 2).map((n, idx) => (
                <div key={idx} className="p-3 rounded-3 border bg-light bg-opacity-50">
                  <span className="badge bg-danger small mb-1">{n.category}</span>
                  <h6 className="fw-bold text-sa-charcoal mb-1 fs-6">{n.title}</h6>
                  <p className="text-sa-muted small mb-0 line-clamp-2" style={{ fontSize: '0.82rem' }}>
                    {n.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
