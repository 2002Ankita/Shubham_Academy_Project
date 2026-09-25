import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Users,
  Clock,
  Calendar,
  FileText,
  CheckSquare,
  Square,
  Megaphone,
  Zap,
  BookOpen,
  ChevronDown,
  Coins,
  BarChart2,
  Tv
} from 'lucide-react';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [attendancePeriod, setAttendancePeriod] = useState('This Month');

  // Interactive pending tasks state
  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: 'Enter marks for Class 10 Unit Test',
      subtext: '24 students • Due by 28 May',
      priority: 'High',
      completed: false,
      link: '/teacher/marks'
    },
    {
      id: 2,
      title: 'Upload study material for Class 12',
      subtext: 'Physics – Chapter 2',
      priority: 'Medium',
      completed: false,
      link: '/teacher/study-materials'
    },
    {
      id: 3,
      title: 'Review attendance for Class 9',
      subtext: 'Last 3 working days',
      priority: 'Medium',
      completed: false,
      link: '/teacher/attendance'
    }
  ]);

  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  // Schedule rows matching reference image
  const scheduleRows = [
    { time: '8:00 AM', subject: 'Mathematics', classBatch: 'Class 10 (A)', room: 'Room 101', status: 'Completed', actionText: 'View', actionType: 'view', path: '/teacher/classes' },
    { time: '9:00 AM', subject: 'Physics', classBatch: 'Class 12 (A)', room: 'Room 201', status: 'Completed', actionText: 'View', actionType: 'view', path: '/teacher/classes' },
    { time: '11:00 AM', subject: 'Science', classBatch: 'Class 9 (B)', room: 'Room 102', status: 'Next Class', actionText: 'Start Class', actionType: 'start', path: '/teacher/classes' },
    { time: '1:00 PM', subject: 'Mathematics', classBatch: 'Class 10 (B)', room: 'Room 103', status: 'Scheduled', actionText: 'View', actionType: 'view', path: '/teacher/classes' },
    { time: '2:30 PM', subject: 'Doubt Session', classBatch: 'All Classes', room: 'Online', status: 'Scheduled', actionText: 'Join', actionType: 'join', path: '/teacher/classes' },
  ];

  // Attendance donut data matching reference image
  const attendanceDonutData = [
    { name: 'Present', value: 162, percentage: '87.1%', color: '#8B1216' },
    { name: 'Absent', value: 18, percentage: '9.7%', color: '#D97718' },
    { name: 'Late', value: 6, percentage: '3.2%', color: '#E11D48' },
  ];

  // Upcoming examinations matching reference image
  const upcomingExams = [
    { date: '28 May 2025', subject: 'Mathematics', classBatch: 'Class 10 (A)' },
    { date: '30 May 2025', subject: 'Physics', classBatch: 'Class 12 (A)' },
    { date: '2 Jun 2025', subject: 'Science', classBatch: 'Class 9 (A)' },
  ];

  // Announcements matching reference image
  const recentAnnouncements = [
    { id: '1', title: 'Unit Test Schedule Released', date: '25 May 2025', dotColor: '#A91D22' },
    { id: '2', title: 'Parent-Teacher Meet', date: '24 May 2025', dotColor: '#D97718' },
    { id: '3', title: 'Holiday Notice', date: '22 May 2025', dotColor: '#D97718' },
    { id: '4', title: 'Class 10 Sample Papers', date: '10 May 2025', dotColor: '#0284C7' }
  ];

  return (
    <div className="d-flex flex-column" style={{ gap: '10px' }}>
      <style>{`
        .teacher-kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }
        .teacher-main-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 0.9fr;
          gap: 10px;
        }
        .teacher-bottom-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }
        @media (max-width: 991px) {
          .teacher-kpi-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .teacher-main-grid {
            grid-template-columns: 1fr;
          }
          .teacher-bottom-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 575px) {
          .teacher-kpi-grid {
            grid-template-columns: 1fr;
          }
          .teacher-bottom-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* 1. TOP GREETING & DATE SECTION */}
      <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between pt-0.5" style={{ gap: '6px' }}>
        {/* Left: Greeting & Subtitle */}
        <div>
          <h1 className="fw-bold brand-font text-sa-charcoal m-0" style={{ fontSize: '21px', lineHeight: 1.2 }}>
            Good Morning, Priya Ma'am
          </h1>
          <p className="text-sa-muted m-0 mt-0.5" style={{ fontSize: '13px' }}>
            Ready to inspire young minds today?
          </p>
        </div>

        {/* Right: Date Selector & Motivational Quote */}
        <div className="d-none d-md-flex flex-column align-items-end text-end" style={{ gap: '4px' }}>
          <div
            className="text-sa-muted"
            style={{ fontSize: '11px', lineHeight: 1.2, letterSpacing: '0.01em' }}
          >
            "Better Teachers<br />Brighter Futures"
          </div>
          <div
            className="d-inline-flex align-items-center gap-1.5 px-2.5 py-1 rounded bg-white border shadow-xs"
            style={{ fontSize: '12px', color: '#1E293B', fontWeight: 500 }}
          >
            <Calendar size={13} className="text-danger" />
            <span>Mon, 26 May 2025</span>
            <ChevronDown size={12} className="text-muted ms-0.5" />
          </div>
        </div>
      </div>

      {/* 2. FOUR KPI STAT CARDS */}
      <div className="teacher-kpi-grid">
        {/* Card 1: Today's Classes */}
        <div
          className="sa-card bg-white rounded-3 border d-flex align-items-center gap-2.5 transition-all cursor-pointer"
          onClick={() => navigate('/teacher/classes')}
          style={{ height: '80px', padding: '8px 12px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
        >
          <div
            className="rounded-2 d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ width: '40px', height: '40px', backgroundColor: '#FDF0F0', color: '#A91D22' }}
          >
            <Tv size={20} />
          </div>
          <div className="flex-grow-1 min-w-0">
            <span className="text-sa-muted fw-medium d-block text-truncate" style={{ fontSize: '11.5px' }}>
              Today's Classes
            </span>
            <div className="fw-bold text-sa-charcoal brand-font" style={{ fontSize: '24px', lineHeight: 1.1 }}>
              5
            </div>
            <span className="text-sa-muted d-block text-truncate" style={{ fontSize: '10.5px' }}>
              2 completed, 3 remaining
            </span>
          </div>
        </div>

        {/* Card 2: Total Students */}
        <div
          className="sa-card bg-white rounded-3 border d-flex align-items-center gap-2.5 transition-all cursor-pointer"
          onClick={() => navigate('/teacher/students')}
          style={{ height: '80px', padding: '8px 12px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
        >
          <div
            className="rounded-2 d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ width: '40px', height: '40px', backgroundColor: '#EAF6EF', color: '#168554' }}
          >
            <Users size={20} />
          </div>
          <div className="flex-grow-1 min-w-0">
            <span className="text-sa-muted fw-medium d-block text-truncate" style={{ fontSize: '11.5px' }}>
              Total Students
            </span>
            <div className="fw-bold text-sa-charcoal brand-font" style={{ fontSize: '24px', lineHeight: 1.1 }}>
              186
            </div>
            <span className="fw-semibold d-block text-truncate" style={{ fontSize: '10.5px', color: '#168554' }}>
              ↗ +12 from last month
            </span>
          </div>
        </div>

        {/* Card 3: Pending Marks */}
        <div
          className="sa-card bg-white rounded-3 border d-flex align-items-center gap-2.5 transition-all cursor-pointer"
          onClick={() => navigate('/teacher/marks')}
          style={{ height: '80px', padding: '8px 12px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
        >
          <div
            className="rounded-2 d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ width: '40px', height: '40px', backgroundColor: '#FEF8EB', color: '#D97718' }}
          >
            <FileText size={20} />
          </div>
          <div className="flex-grow-1 min-w-0">
            <span className="text-sa-muted fw-medium d-block text-truncate" style={{ fontSize: '11.5px' }}>
              Pending Marks
            </span>
            <div className="fw-bold text-sa-charcoal brand-font" style={{ fontSize: '24px', lineHeight: 1.1 }}>
              24
            </div>
            <span className="text-sa-muted d-block text-truncate" style={{ fontSize: '10.5px' }}>
              Across 3 examinations
            </span>
          </div>
        </div>

        {/* Card 4: Working Hours */}
        <div
          className="sa-card bg-white rounded-3 border d-flex align-items-center gap-2.5 transition-all"
          style={{ height: '80px', padding: '8px 12px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
        >
          <div
            className="rounded-2 d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ width: '40px', height: '40px', backgroundColor: '#FDF0F0', color: '#A91D22' }}
          >
            <Clock size={20} />
          </div>
          <div className="flex-grow-1 min-w-0">
            <span className="text-sa-muted fw-medium d-block text-truncate" style={{ fontSize: '11.5px' }}>
              Working Hours
            </span>
            <div className="fw-bold text-sa-charcoal brand-font" style={{ fontSize: '24px', lineHeight: 1.1 }}>
              32.5 hrs
            </div>
            <span className="fw-semibold d-block text-truncate" style={{ fontSize: '10.5px', color: '#168554' }}>
              ↗ 68% of 48 hrs this month
            </span>
          </div>
        </div>
      </div>

      {/* 3. MAIN SECTION: Schedule (50-52%) | Class Attendance (25-26%) | Quick Actions (22-23%) */}
      <div className="teacher-main-grid">
        {/* Column 1: Today's Class Schedule */}
        <div
          className="sa-card bg-white rounded-3 border d-flex flex-column"
          style={{ height: '240px', padding: '10px 12px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
        >
          {/* Header */}
          <div className="d-flex align-items-center justify-content-between pb-1.5 border-bottom flex-shrink-0">
            <div className="d-flex align-items-center gap-1.5">
              <Calendar size={14} className="text-danger" />
              <h3 className="brand-font fw-bold m-0 text-sa-charcoal" style={{ fontSize: '13px' }}>
                Today's Class Schedule
              </h3>
            </div>
            <button
              onClick={() => navigate('/teacher/classes')}
              className="btn btn-link p-0 text-decoration-none text-danger fw-semibold d-flex align-items-center gap-0.5"
              style={{ fontSize: '11.5px' }}
            >
              View Full Schedule &rarr;
            </button>
          </div>

          {/* Compact Schedule Table */}
          <div className="table-responsive flex-grow-1 overflow-y-auto mt-1" style={{ fontSize: '11px' }}>
            <table className="table table-borderless table-sm m-0 align-middle">
              <thead>
                <tr className="text-muted border-bottom" style={{ fontSize: '10.5px', height: '24px' }}>
                  <th className="fw-semibold ps-1 py-1" style={{ width: '15%' }}>Time</th>
                  <th className="fw-semibold py-1" style={{ width: '22%' }}>Subject</th>
                  <th className="fw-semibold py-1" style={{ width: '20%' }}>Class / Batch</th>
                  <th className="fw-semibold py-1" style={{ width: '16%' }}>Room</th>
                  <th className="fw-semibold py-1" style={{ width: '15%' }}>Status</th>
                  <th className="fw-semibold pe-1 py-1 text-end" style={{ width: '12%' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {scheduleRows.map((row, idx) => (
                  <tr key={idx} className="border-bottom border-light" style={{ height: '32px' }}>
                    <td className="fw-medium text-sa-charcoal ps-1 py-1" style={{ whiteSpace: 'nowrap' }}>
                      {row.time}
                    </td>
                    <td className="fw-semibold text-sa-charcoal py-1">
                      {row.subject}
                    </td>
                    <td className="text-sa-muted py-1" style={{ whiteSpace: 'nowrap' }}>
                      {row.classBatch}
                    </td>
                    <td className="py-1">
                      <span className="badge bg-light text-muted border fw-normal" style={{ fontSize: '10px', padding: '2px 5px' }}>
                        {row.room}
                      </span>
                    </td>
                    <td className="py-1">
                      {row.status === 'Completed' ? (
                        <span className="badge rounded-pill fw-medium" style={{ backgroundColor: '#EAF6EF', color: '#168554', fontSize: '9.5px', padding: '2px 7px' }}>
                          Completed
                        </span>
                      ) : row.status === 'Next Class' ? (
                        <span className="badge rounded-pill fw-medium" style={{ backgroundColor: '#FEF8EB', color: '#D97718', fontSize: '9.5px', padding: '2px 7px' }}>
                          Next Class
                        </span>
                      ) : (
                        <span className="badge rounded-pill fw-medium" style={{ backgroundColor: '#F1F5F9', color: '#475569', fontSize: '9.5px', padding: '2px 7px' }}>
                          Scheduled
                        </span>
                      )}
                    </td>
                    <td className="pe-1 py-1 text-end">
                      {row.actionType === 'start' ? (
                        <button
                          onClick={() => navigate(row.path)}
                          className="btn btn-sm d-inline-flex align-items-center justify-content-center gap-1 text-white border-0 fw-semibold"
                          style={{
                            backgroundColor: '#A91D22',
                            fontSize: '10px',
                            padding: '2.5px 8px',
                            borderRadius: '4px',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          <span style={{ fontSize: '8px' }}>▶</span> Start Class
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate(row.path)}
                          className="btn btn-sm btn-outline-secondary py-0.5 px-2 text-decoration-none fw-medium"
                          style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px' }}
                        >
                          {row.actionText}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Column 2: Class Attendance */}
        <div
          className="sa-card bg-white rounded-3 border d-flex flex-column"
          style={{ height: '240px', padding: '10px 12px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
        >
          {/* Header */}
          <div className="d-flex align-items-center justify-content-between pb-1 flex-shrink-0">
            <div className="d-flex align-items-center gap-1.5">
              <BarChart2 size={14} className="text-danger" />
              <h3 className="brand-font fw-bold m-0 text-sa-charcoal" style={{ fontSize: '13px' }}>
                Class Attendance
              </h3>
            </div>
            <div
              className="d-inline-flex align-items-center gap-1 px-1.5 py-0.5 rounded border bg-light text-muted"
              style={{ fontSize: '10.5px' }}
            >
              <span>{attendancePeriod}</span>
              <ChevronDown size={10} />
            </div>
          </div>

          {/* Donut Chart with Center Text */}
          <div className="position-relative d-flex align-items-center justify-content-center flex-grow-1" style={{ minHeight: '115px' }}>
            <ResponsiveContainer width="100%" height={115}>
              <PieChart>
                <Pie
                  data={attendanceDonutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={36}
                  outerRadius={52}
                  paddingAngle={2}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {attendanceDonutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="position-absolute text-center" style={{ pointerEvents: 'none', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
              <div className="fw-bold text-sa-charcoal brand-font" style={{ fontSize: '16px', lineHeight: 1 }}>
                186
              </div>
              <div className="text-sa-muted" style={{ fontSize: '9px', lineHeight: 1, marginTop: '2px' }}>
                Students
              </div>
            </div>
          </div>

          {/* Compact Legend Table below Chart */}
          <div className="d-flex flex-column gap-1 pt-1 border-top flex-shrink-0" style={{ fontSize: '10.5px' }}>
            {attendanceDonutData.map((item, idx) => (
              <div key={idx} className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-1.5">
                  <span className="rounded-circle d-inline-block" style={{ width: '7px', height: '7px', backgroundColor: item.color }} />
                  <span className="text-sa-charcoal">{item.name}</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <span className="fw-bold text-sa-charcoal">{item.value}</span>
                  <span className="text-muted" style={{ width: '34px', textAlign: 'right' }}>{item.percentage}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: Quick Actions */}
        <div
          className="sa-card bg-white rounded-3 border d-flex flex-column"
          style={{ height: '240px', padding: '10px 12px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
        >
          {/* Header */}
          <div className="d-flex align-items-center gap-1.5 pb-1.5 border-bottom flex-shrink-0">
            <Zap size={14} className="text-danger" />
            <h3 className="brand-font fw-bold m-0 text-sa-charcoal" style={{ fontSize: '13px' }}>
              Quick Actions
            </h3>
          </div>

          {/* Action Buttons matching reference image */}
          <div className="d-flex flex-column justify-content-between flex-grow-1 pt-1.5" style={{ gap: '7px' }}>
            {/* Action 1: Take Attendance */}
            <button
              onClick={() => navigate('/teacher/attendance')}
              className="btn w-100 text-start d-flex align-items-center justify-content-between border-0 transition-all"
              style={{
                backgroundColor: '#FDF0F0',
                borderRadius: '8px',
                padding: '9px 12px',
                height: '46px'
              }}
            >
              <div className="d-flex align-items-center gap-2">
                <Users size={16} style={{ color: '#A91D22' }} />
                <span className="fw-bold" style={{ fontSize: '12px', color: '#A91D22' }}>
                  Take Attendance
                </span>
              </div>
              <span style={{ color: '#A91D22', fontSize: '14px' }}>&rsaquo;</span>
            </button>

            {/* Action 2: Enter Marks */}
            <button
              onClick={() => navigate('/teacher/marks')}
              className="btn w-100 text-start d-flex align-items-center justify-content-between border-0 transition-all"
              style={{
                backgroundColor: '#FEF8EB',
                borderRadius: '8px',
                padding: '9px 12px',
                height: '46px'
              }}
            >
              <div className="d-flex align-items-center gap-2">
                <BarChart2 size={16} style={{ color: '#D97718' }} />
                <span className="fw-bold" style={{ fontSize: '12px', color: '#D97718' }}>
                  Enter Marks
                </span>
              </div>
              <span style={{ color: '#D97718', fontSize: '14px' }}>&rsaquo;</span>
            </button>

            {/* Action 3: Upload Material */}
            <button
              onClick={() => navigate('/teacher/study-materials')}
              className="btn w-100 text-start d-flex align-items-center justify-content-between border-0 transition-all"
              style={{
                backgroundColor: '#FDF0F0',
                borderRadius: '8px',
                padding: '9px 12px',
                height: '46px'
              }}
            >
              <div className="d-flex align-items-center gap-2">
                <BookOpen size={16} style={{ color: '#A91D22' }} />
                <span className="fw-bold" style={{ fontSize: '12px', color: '#A91D22' }}>
                  Upload Material
                </span>
              </div>
              <span style={{ color: '#A91D22', fontSize: '14px' }}>&rsaquo;</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. BOTTOM ROW: Upcoming Examinations | Pending Tasks | Recent Announcements | This Month's Hours */}
      <div className="teacher-bottom-grid">
        {/* Card 1: Upcoming Examinations */}
        <div
          className="sa-card bg-white rounded-3 border d-flex flex-column"
          style={{ height: '165px', padding: '9px 12px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
        >
          <div className="d-flex align-items-center justify-content-between pb-1 border-bottom flex-shrink-0">
            <div className="d-flex align-items-center gap-1.5">
              <FileText size={13} className="text-danger" />
              <h4 className="brand-font fw-bold m-0 text-sa-charcoal" style={{ fontSize: '12px' }}>
                Upcoming Examinations
              </h4>
            </div>
            <button
              onClick={() => navigate('/teacher/exams')}
              className="btn btn-link p-0 text-decoration-none text-danger fw-semibold"
              style={{ fontSize: '11px' }}
            >
              View All &rarr;
            </button>
          </div>
          <div className="d-flex flex-column justify-content-around flex-grow-1 pt-1" style={{ fontSize: '11px' }}>
            <div className="d-flex justify-content-between text-muted border-bottom pb-0.5" style={{ fontSize: '10px' }}>
              <span>Date</span>
              <span>Subject</span>
              <span>Class / Batch</span>
            </div>
            {upcomingExams.map((exam, idx) => (
              <div key={idx} className="d-flex justify-content-between align-items-center py-0.5">
                <span className="fw-semibold text-danger" style={{ fontSize: '10.5px' }}>{exam.date}</span>
                <span className="fw-medium text-sa-charcoal" style={{ fontSize: '10.5px' }}>{exam.subject}</span>
                <span className="text-sa-muted" style={{ fontSize: '10.5px' }}>{exam.classBatch}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: Pending Tasks */}
        <div
          className="sa-card bg-white rounded-3 border d-flex flex-column"
          style={{ height: '165px', padding: '9px 12px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
        >
          <div className="d-flex align-items-center justify-content-between pb-1 border-bottom flex-shrink-0">
            <div className="d-flex align-items-center gap-1.5">
              <CheckSquare size={13} className="text-danger" />
              <h4 className="brand-font fw-bold m-0 text-sa-charcoal" style={{ fontSize: '12px' }}>
                Pending Tasks
              </h4>
            </div>
            <button
              onClick={() => navigate('/teacher/marks')}
              className="btn btn-link p-0 text-decoration-none text-danger fw-semibold"
              style={{ fontSize: '11px' }}
            >
              View All &rarr;
            </button>
          </div>
          <div className="d-flex flex-column justify-content-around flex-grow-1 pt-1" style={{ gap: '4px' }}>
            {tasks.map((task) => (
              <div
                key={task.id}
                className="d-flex align-items-start gap-1.5 cursor-pointer"
                onClick={() => toggleTask(task.id)}
              >
                <div className="flex-shrink-0 pt-0.5">
                  {task.completed ? (
                    <CheckSquare size={12} className="text-success" />
                  ) : (
                    <Square size={12} className="text-muted" />
                  )}
                </div>
                <div className="flex-grow-1 min-w-0">
                  <div
                    className={`fw-medium text-truncate ${task.completed ? 'text-decoration-line-through text-muted' : 'text-sa-charcoal'}`}
                    style={{ fontSize: '10.5px', lineHeight: 1.2 }}
                  >
                    {task.title}
                  </div>
                  <div className="text-muted" style={{ fontSize: '9.5px', lineHeight: 1 }}>
                    {task.subtext}
                  </div>
                </div>
                <span
                  className="badge flex-shrink-0 fw-normal"
                  style={{
                    fontSize: '9px',
                    padding: '2px 5px',
                    backgroundColor: task.priority === 'High' ? '#FDF0F0' : '#FEF8EB',
                    color: task.priority === 'High' ? '#A91D22' : '#D97718'
                  }}
                >
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 3: Recent Announcements */}
        <div
          className="sa-card bg-white rounded-3 border d-flex flex-column"
          style={{ height: '165px', padding: '9px 12px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
        >
          <div className="d-flex align-items-center justify-content-between pb-1 border-bottom flex-shrink-0">
            <div className="d-flex align-items-center gap-1.5">
              <Megaphone size={13} className="text-danger" />
              <h4 className="brand-font fw-bold m-0 text-sa-charcoal" style={{ fontSize: '12px' }}>
                Recent Announcements
              </h4>
            </div>
            <button
              onClick={() => navigate('/teacher/announcements')}
              className="btn btn-link p-0 text-decoration-none text-danger fw-semibold"
              style={{ fontSize: '11px' }}
            >
              View All &rarr;
            </button>
          </div>
          <div className="d-flex flex-column justify-content-around flex-grow-1 pt-1" style={{ gap: '3px' }}>
            {recentAnnouncements.map((item) => (
              <div key={item.id} className="d-flex align-items-center justify-content-between" style={{ fontSize: '10.5px' }}>
                <div className="d-flex align-items-center gap-1.5 min-w-0">
                  <span className="rounded-circle flex-shrink-0" style={{ width: '6px', height: '6px', backgroundColor: item.dotColor }} />
                  <span className="text-sa-charcoal text-truncate fw-medium">{item.title}</span>
                </div>
                <span className="text-muted flex-shrink-0 ps-1" style={{ fontSize: '9.5px' }}>{item.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 4: This Month's Hours */}
        <div
          className="sa-card bg-white rounded-3 border d-flex flex-column"
          style={{ height: '165px', padding: '9px 12px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
        >
          <div className="d-flex align-items-center gap-1.5 pb-1 border-bottom flex-shrink-0">
            <Clock size={13} className="text-danger" />
            <h4 className="brand-font fw-bold m-0 text-sa-charcoal" style={{ fontSize: '12px' }}>
              This Month's Hours
            </h4>
          </div>
          <div className="d-flex flex-column justify-content-between flex-grow-1 pt-2">
            <div>
              <div className="d-flex align-items-baseline justify-content-between">
                <div>
                  <span className="brand-font fw-bold text-sa-charcoal" style={{ fontSize: '15px' }}>32.5</span>
                  <span className="text-muted" style={{ fontSize: '11px' }}> / 48 hrs</span>
                </div>
                <span className="text-muted" style={{ fontSize: '10px' }}>68%</span>
              </div>
              <div className="progress mt-1" style={{ height: '5px', backgroundColor: '#F1F5F9' }}>
                <div
                  className="progress-bar"
                  role="progressbar"
                  style={{ width: '68%', backgroundColor: '#A91D22', borderRadius: '4px' }}
                  aria-valuenow="68"
                  aria-valuemin="0"
                  aria-valuemax="100"
                />
              </div>
            </div>

            <div
              className="rounded-2 d-flex align-items-center gap-2"
              style={{ backgroundColor: '#FAF8F5', border: '1px solid #F1ECE4', padding: '5px 8px' }}
            >
              <div
                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: '26px', height: '26px', backgroundColor: '#FEF8EB', color: '#D97718' }}
              >
                <Coins size={13} />
              </div>
              <div>
                <div className="text-sa-muted" style={{ fontSize: '9.5px', lineHeight: 1 }}>
                  Estimated Pay
                </div>
                <div className="brand-font fw-bold text-sa-charcoal" style={{ fontSize: '15px', lineHeight: 1.15 }}>
                  ₹26,000
                </div>
                <div className="text-sa-muted" style={{ fontSize: '9px', lineHeight: 1 }}>
                  Based on 48 hrs/month
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
