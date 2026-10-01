import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Calendar,
  Users,
  FileText,
  Clock,
  TrendingUp,
  AlertCircle,
  BarChart2,
  Zap,
  BookOpen,
  ChevronDown,
  Play,
  Check
} from 'lucide-react';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [attendancePeriod, setAttendancePeriod] = useState('This Month');
  const [showAttendanceDropdown, setShowAttendanceDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowAttendanceDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Dynamic teacher greeting name
  const teacherDisplayName = user?.name
    ? (user.name.includes('Priya') ? "Priya Ma'am" : user.name)
    : "Priya Ma'am";

  // Schedule rows matching exact reference image
  const scheduleRows = [
    {
      time: '8:00 AM',
      subject: 'Mathematics',
      classBatch: 'Class 10 (A)',
      room: 'Room 101',
      status: 'Completed',
      actionText: 'View',
      actionType: 'view',
      path: '/teacher/classes'
    },
    {
      time: '9:00 AM',
      subject: 'Physics',
      classBatch: 'Class 12 (A)',
      room: 'Room 201',
      status: 'Completed',
      actionText: 'View',
      actionType: 'view',
      path: '/teacher/classes'
    },
    {
      time: '11:00 AM',
      subject: 'Science',
      classBatch: 'Class 9 (B)',
      room: 'Room 102',
      status: 'Next Class',
      actionText: 'Start Class',
      actionType: 'start',
      path: '/teacher/classes'
    },
    {
      time: '1:00 PM',
      subject: 'Mathematics',
      classBatch: 'Class 10 (B)',
      room: 'Room 103',
      status: 'Scheduled',
      actionText: 'View',
      actionType: 'view',
      path: '/teacher/classes'
    },
    {
      time: '2:30 PM',
      subject: 'Doubt Session',
      classBatch: 'All Classes',
      room: 'Online',
      status: 'Scheduled',
      actionText: 'Join',
      actionType: 'join',
      path: '/teacher/classes'
    }
  ];

  // Attendance donut data matching exact reference image
  const attendanceDonutData = [
    { name: 'Present', value: 162, percentage: '87.1%', color: '#8B1216' },
    { name: 'Absent', value: 18, percentage: '9.7%', color: '#F59E0B' },
    { name: 'Late', value: 6, percentage: '3.2%', color: '#E11D48' }
  ];

  const periodOptions = ['This Week', 'This Month', 'This Term'];

  return (
    <div className="d-flex flex-column w-100" style={{ gap: '16px', minWidth: 0, boxSizing: 'border-box' }}>
      <style>{`
        .teacher-kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }
        .teacher-main-grid {
          display: grid;
          grid-template-columns: minmax(0, 2.05fr) minmax(0, 1.14fr) minmax(0, 1fr);
          gap: 16px;
          align-items: stretch;
        }
        .teacher-grid-card {
          background-color: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
          box-sizing: border-box;
          min-width: 0;
          width: 100%;
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }
        .teacher-kpi-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }
        .schedule-grid-row {
          display: grid;
          grid-template-columns: 58px 1fr 1fr 62px 74px 74px;
          align-items: center;
          gap: 6px;
        }
        .quick-action-btn {
          transition: all 0.18s ease;
          border-radius: 10px;
          cursor: pointer;
        }
        .quick-action-btn:hover {
          transform: translateX(3px);
          filter: brightness(0.97);
        }
        .action-pill-btn {
          transition: all 0.15s ease;
          border-radius: 6px;
          cursor: pointer;
        }
        .action-pill-btn:hover {
          filter: brightness(0.94);
        }
        @media (max-width: 1199px) {
          .teacher-main-grid {
            grid-template-columns: minmax(0, 1fr);
          }
        }
        @media (max-width: 991px) {
          .teacher-kpi-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 575px) {
          .teacher-kpi-grid {
            grid-template-columns: minmax(0, 1fr);
          }
        }
      `}</style>

      {/* 1. TOP WELCOME SECTION WITH MOTIVATIONAL QUOTE */}
      <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between pt-0 pb-0.5">
        {/* Left: Greeting & Subtitle */}
        <div>
          <h1
            className="fw-bold brand-font m-0"
            style={{ fontSize: '23px', lineHeight: 1.25, color: '#0F172A' }}
          >
            Good Morning, {teacherDisplayName}
          </h1>
          <p className="m-0 mt-0.5" style={{ fontSize: '13.5px', color: '#64748B' }}>
            Ready to inspire young minds today?
          </p>
        </div>

        {/* Right: Motivational Quote with Gold Underline */}
        <div className="d-none d-sm-flex flex-column align-items-end text-end mt-2 mt-sm-0">
          <div
            className="fst-italic"
            style={{
              fontSize: '12.5px',
              lineHeight: 1.35,
              letterSpacing: '0.01em',
              fontWeight: 500,
              color: '#475569',
              fontFamily: 'serif'
            }}
          >
            “Better Teachers<br />Brighter Futures”
          </div>
          <div
            style={{
              width: '40px',
              height: '3px',
              backgroundColor: '#F59E0B',
              borderRadius: '2px',
              marginTop: '4px'
            }}
          />
        </div>
      </div>

      {/* 2. FOUR EQUAL-WIDTH, BALANCED STATISTICS CARDS */}
      <div className="teacher-kpi-grid">
        {/* Card 1: Today's Classes */}
        <div
          className="teacher-grid-card teacher-kpi-card d-flex align-items-center cursor-pointer"
          onClick={() => navigate('/teacher/classes')}
          style={{ padding: '13px 15px', gap: '11px', minHeight: '84px' }}
        >
          <div
            className="d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ width: '42px', height: '42px', backgroundColor: '#FEE2E2', color: '#DC2626', borderRadius: '10px' }}
          >
            <Calendar size={20} />
          </div>
          <div className="flex-grow-1 min-w-0" style={{ overflow: 'hidden' }}>
            <span className="fw-medium d-block text-truncate" style={{ fontSize: '12.5px', color: '#64748B' }}>
              Today's Classes
            </span>
            <div className="fw-bold brand-font" style={{ fontSize: '25px', lineHeight: 1.15, color: '#8B1216' }}>
              5
            </div>
            <div className="d-flex align-items-center gap-1 mt-0.5" style={{ fontSize: '11px', color: '#64748B', whiteSpace: 'nowrap' }}>
              <Clock size={11} className="flex-shrink-0" />
              <span className="text-truncate">2 completed, 3 remaining</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Students */}
        <div
          className="teacher-grid-card teacher-kpi-card d-flex align-items-center cursor-pointer"
          onClick={() => navigate('/teacher/students')}
          style={{ padding: '13px 15px', gap: '11px', minHeight: '84px' }}
        >
          <div
            className="d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ width: '42px', height: '42px', backgroundColor: '#D1FAE5', color: '#059669', borderRadius: '10px' }}
          >
            <Users size={20} />
          </div>
          <div className="flex-grow-1 min-w-0" style={{ overflow: 'hidden' }}>
            <span className="fw-medium d-block text-truncate" style={{ fontSize: '12.5px', color: '#64748B' }}>
              Total Students
            </span>
            <div className="fw-bold brand-font" style={{ fontSize: '25px', lineHeight: 1.15, color: '#0F172A' }}>
              186
            </div>
            <div className="d-flex align-items-center gap-1 mt-0.5" style={{ fontSize: '11px', color: '#059669', fontWeight: 600, whiteSpace: 'nowrap' }}>
              <TrendingUp size={12} className="flex-shrink-0" />
              <span className="text-truncate">+12 from last month</span>
            </div>
          </div>
        </div>

        {/* Card 3: Pending Marks */}
        <div
          className="teacher-grid-card teacher-kpi-card d-flex align-items-center cursor-pointer"
          onClick={() => navigate('/teacher/marks')}
          style={{ padding: '13px 15px', gap: '11px', minHeight: '84px' }}
        >
          <div
            className="d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ width: '42px', height: '42px', backgroundColor: '#FEF3C7', color: '#D97706', borderRadius: '10px' }}
          >
            <FileText size={20} />
          </div>
          <div className="flex-grow-1 min-w-0" style={{ overflow: 'hidden' }}>
            <span className="fw-medium d-block text-truncate" style={{ fontSize: '12.5px', color: '#64748B' }}>
              Pending Marks
            </span>
            <div className="fw-bold brand-font" style={{ fontSize: '25px', lineHeight: 1.15, color: '#D97706' }}>
              24
            </div>
            <div className="d-flex align-items-center gap-1 mt-0.5" style={{ fontSize: '11px', color: '#64748B', whiteSpace: 'nowrap' }}>
              <AlertCircle size={11} className="flex-shrink-0" style={{ color: '#D97706' }} />
              <span className="text-truncate">Across 3 examinations</span>
            </div>
          </div>
        </div>

        {/* Card 4: Working Hours */}
        <div
          className="teacher-grid-card teacher-kpi-card d-flex align-items-center cursor-pointer"
          onClick={() => navigate('/teacher/working-time')}
          style={{ padding: '13px 15px', gap: '11px', minHeight: '84px' }}
        >
          <div
            className="d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ width: '42px', height: '42px', backgroundColor: '#FEE2E2', color: '#DC2626', borderRadius: '10px' }}
          >
            <Clock size={20} />
          </div>
          <div className="flex-grow-1 min-w-0" style={{ overflow: 'hidden' }}>
            <span className="fw-medium d-block text-truncate" style={{ fontSize: '12.5px', color: '#64748B' }}>
              Working Hours
            </span>
            <div className="fw-bold brand-font" style={{ fontSize: '25px', lineHeight: 1.15, color: '#0F172A' }}>
              32.5 hrs
            </div>
            <div className="d-flex align-items-center gap-1 mt-0.5" style={{ fontSize: '11px', color: '#059669', fontWeight: 600, whiteSpace: 'nowrap' }}>
              <TrendingUp size={12} className="flex-shrink-0" />
              <span className="text-truncate">68% of 48 hrs this month</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MAIN SECTION (PERFECTLY PROPORTIONED): Schedule (49%) | Attendance (27%) | Quick Actions (24%) */}
      <div className="teacher-main-grid">
        {/* Column 1: Today's Class Schedule */}
        <div className="teacher-grid-card d-flex flex-column" style={{ padding: '14px 16px', minHeight: '286px' }}>
          {/* Header */}
          <div className="d-flex align-items-center justify-content-between pb-2 flex-shrink-0">
            <div className="d-flex align-items-center gap-2 min-w-0">
              <Calendar size={18} style={{ color: '#DC2626' }} className="flex-shrink-0" />
              <h3 className="brand-font fw-bold m-0 text-truncate" style={{ fontSize: '15.5px', color: '#0F172A' }}>
                Today's Class Schedule
              </h3>
            </div>
            <button
              onClick={() => navigate('/teacher/classes')}
              className="btn btn-link p-0 text-decoration-none fw-semibold d-flex align-items-center gap-1 flex-shrink-0 ms-2"
              style={{ fontSize: '12px', color: '#DC2626', whiteSpace: 'nowrap' }}
            >
              View Full Schedule &rarr;
            </button>
          </div>

          {/* Schedule Table Container */}
          <div className="flex-grow-1 d-flex flex-column" style={{ width: '100%', minWidth: 0, overflowX: 'auto' }}>
            <div style={{ minWidth: '450px', width: '100%' }}>
              {/* Header Row */}
              <div
                className="schedule-grid-row py-1 px-1.5"
                style={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: '6px',
                  height: '32px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#64748B'
                }}
              >
                <div>Time</div>
                <div>Subject</div>
                <div>Class / Batch</div>
                <div>Room</div>
                <div>Status</div>
                <div style={{ textAlign: 'right', paddingRight: '2px' }}>Action</div>
              </div>

              {/* Data Rows */}
              <div className="d-flex flex-column">
                {scheduleRows.map((row, idx) => (
                  <div
                    key={idx}
                    className="schedule-grid-row py-1 px-1.5 border-bottom border-light"
                    style={{ height: '39px', boxSizing: 'border-box' }}
                  >
                    {/* Time */}
                    <div className="fw-bold text-truncate" style={{ fontSize: '11.5px', color: '#0F172A' }}>
                      {row.time}
                    </div>

                    {/* Subject */}
                    <div className="fw-semibold text-truncate" style={{ fontSize: '12px', color: '#0F172A' }}>
                      {row.subject}
                    </div>

                    {/* Class / Batch */}
                    <div className="text-truncate" style={{ fontSize: '11.5px', color: '#64748B' }}>
                      {row.classBatch}
                    </div>

                    {/* Room */}
                    <div className="text-truncate" style={{ fontSize: '11.5px', color: '#64748B' }}>
                      {row.room}
                    </div>

                    {/* Status Pill Badge */}
                    <div>
                      {row.status === 'Completed' ? (
                        <span
                          className="badge rounded-pill fw-medium d-inline-block text-center"
                          style={{
                            backgroundColor: '#ECFDF5',
                            color: '#059669',
                            border: '1px solid #A7F3D0',
                            fontSize: '10px',
                            padding: '2.5px 6px',
                            width: '68px'
                          }}
                        >
                          Completed
                        </span>
                      ) : row.status === 'Next Class' ? (
                        <span
                          className="badge rounded-pill fw-medium d-inline-block text-center"
                          style={{
                            backgroundColor: '#FEF3C7',
                            color: '#D97706',
                            border: '1px solid #FDE68A',
                            fontSize: '10px',
                            padding: '2.5px 6px',
                            width: '68px'
                          }}
                        >
                          Next Class
                        </span>
                      ) : (
                        <span
                          className="badge rounded-pill fw-medium d-inline-block text-center"
                          style={{
                            backgroundColor: '#E0F2FE',
                            color: '#0284C7',
                            border: '1px solid #BAE6FD',
                            fontSize: '10px',
                            padding: '2.5px 6px',
                            width: '68px'
                          }}
                        >
                          Scheduled
                        </span>
                      )}
                    </div>

                    {/* Action Button - Fully Visible, NEVER Clipped */}
                    <div style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end' }}>
                      {row.actionType === 'start' ? (
                        <button
                          onClick={() => navigate(row.path)}
                          className="btn btn-sm d-inline-flex align-items-center justify-content-center gap-1 text-white border-0 fw-semibold action-pill-btn shadow-xs"
                          style={{
                            backgroundColor: '#8B1216',
                            fontSize: '10px',
                            padding: '3px 8px',
                            borderRadius: '5px',
                            whiteSpace: 'nowrap',
                            lineHeight: 1.2
                          }}
                        >
                          <Play size={8} fill="currentColor" />
                          <span>Start Class</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate(row.path)}
                          className="btn btn-sm action-pill-btn fw-semibold"
                          style={{
                            backgroundColor: '#FEF2F2',
                            color: '#DC2626',
                            border: '1px solid #FECACA',
                            fontSize: '10px',
                            padding: '2.5px 12px',
                            borderRadius: '5px',
                            whiteSpace: 'nowrap',
                            lineHeight: 1.2
                          }}
                        >
                          {row.actionText}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: Class Attendance (~27% Section with spacious header) */}
        <div className="teacher-grid-card d-flex flex-column" style={{ padding: '14px 16px', minHeight: '286px' }}>
          {/* Header with plenty of space between title and dropdown */}
          <div className="d-flex align-items-center justify-content-between pb-1 flex-shrink-0" style={{ minWidth: 0, gap: '8px' }}>
            <div className="d-flex align-items-center gap-1.5 flex-shrink-0">
              <BarChart2 size={17} style={{ color: '#DC2626' }} className="flex-shrink-0" />
              <h3 className="brand-font fw-bold m-0" style={{ fontSize: '15px', color: '#0F172A', whiteSpace: 'nowrap' }}>
                Class Attendance
              </h3>
            </div>

            {/* Clean Dropdown without any scrollable cutoff */}
            <div className="position-relative flex-shrink-0" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setShowAttendanceDropdown(!showAttendanceDropdown)}
                className="btn btn-sm d-inline-flex align-items-center gap-1.5 px-2.5 py-1 rounded bg-white text-nowrap"
                style={{
                  fontSize: '11px',
                  color: '#475569',
                  border: '1px solid #CBD5E1',
                  borderRadius: '6px',
                  lineHeight: 1.2,
                  boxShadow: 'none',
                  cursor: 'pointer'
                }}
              >
                <span className="fw-medium">{attendancePeriod}</span>
                <ChevronDown size={11} className="text-muted flex-shrink-0" />
              </button>

              {/* Custom Dropdown Menu */}
              {showAttendanceDropdown && (
                <div
                  className="position-absolute end-0 mt-1 bg-white border rounded-2 shadow-sm py-1"
                  style={{ minWidth: '110px', borderColor: '#E2E8F0', zIndex: 100 }}
                >
                  {periodOptions.map((period) => (
                    <button
                      key={period}
                      type="button"
                      className="dropdown-item px-3 py-1.5 d-flex align-items-center justify-content-between text-start w-100 border-0 bg-transparent"
                      style={{
                        fontSize: '11px',
                        color: attendancePeriod === period ? '#8B1216' : '#334155',
                        fontWeight: attendancePeriod === period ? 600 : 400
                      }}
                      onClick={() => {
                        setAttendancePeriod(period);
                        setShowAttendanceDropdown(false);
                      }}
                    >
                      <span>{period}</span>
                      {attendancePeriod === period && <Check size={11} className="text-danger flex-shrink-0 ms-1" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Centered Donut Chart */}
          <div
            className="position-relative d-flex align-items-center justify-content-center flex-grow-1"
            style={{ height: '132px', minHeight: '128px', maxHeight: '140px', overflow: 'hidden' }}
          >
            <ResponsiveContainer width="100%" height={132}>
              <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <Pie
                  data={attendanceDonutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={43}
                  outerRadius={60}
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
            <div
              className="position-absolute text-center"
              style={{ pointerEvents: 'none', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
            >
              <div className="fw-bold brand-font" style={{ fontSize: '20px', lineHeight: 1, color: '#0F172A' }}>
                186
              </div>
              <div style={{ fontSize: '10.5px', lineHeight: 1, marginTop: '2.5px', color: '#64748B' }}>
                Students
              </div>
            </div>
          </div>

          {/* Attendance Legend List below Chart */}
          <div className="d-flex flex-column gap-1 pt-2 border-top flex-shrink-0" style={{ fontSize: '11px' }}>
            {attendanceDonutData.map((item, idx) => (
              <div key={idx} className="d-flex align-items-center justify-content-between py-0.5">
                <div className="d-flex align-items-center gap-2 min-w-0">
                  <span
                    className="rounded-circle d-inline-block flex-shrink-0"
                    style={{ width: '7px', height: '7px', backgroundColor: item.color }}
                  />
                  <span className="fw-medium text-truncate" style={{ color: '#334155' }}>{item.name}</span>
                </div>
                <div className="d-flex align-items-center gap-2 flex-shrink-0">
                  <span className="fw-bold" style={{ color: '#0F172A' }}>{item.value}</span>
                  <span className="text-end" style={{ width: '36px', color: '#64748B' }}>{item.percentage}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: Quick Actions (~24% Section) */}
        <div className="teacher-grid-card d-flex flex-column" style={{ padding: '14px 16px', minHeight: '286px' }}>
          {/* Header */}
          <div className="d-flex align-items-center gap-2 pb-2 flex-shrink-0">
            <Zap size={18} style={{ color: '#DC2626' }} className="flex-shrink-0" />
            <h3 className="brand-font fw-bold m-0 text-truncate" style={{ fontSize: '15.5px', color: '#0F172A' }}>
              Quick Actions
            </h3>
          </div>

          {/* Exactly Three Balanced Buttons */}
          <div className="d-flex flex-column justify-content-between flex-grow-1" style={{ gap: '11px' }}>
            {/* Action 1: Take Attendance */}
            <div
              onClick={() => navigate('/teacher/attendance')}
              className="quick-action-btn d-flex align-items-center justify-content-between px-3"
              style={{
                backgroundColor: '#FEF2F2',
                height: '49px',
                minHeight: '46px'
              }}
            >
              <div className="d-flex align-items-center gap-2.5 min-w-0">
                <Users size={18} style={{ color: '#DC2626' }} className="flex-shrink-0" />
                <span className="fw-bold text-truncate" style={{ fontSize: '13.5px', color: '#991B1B' }}>
                  Take Attendance
                </span>
              </div>
              <span className="flex-shrink-0 ms-1" style={{ color: '#991B1B', fontSize: '16px', fontWeight: 700 }}>
                &rsaquo;
              </span>
            </div>

            {/* Action 2: Enter Marks */}
            <div
              onClick={() => navigate('/teacher/marks')}
              className="quick-action-btn d-flex align-items-center justify-content-between px-3"
              style={{
                backgroundColor: '#FFFBEB',
                height: '49px',
                minHeight: '46px'
              }}
            >
              <div className="d-flex align-items-center gap-2.5 min-w-0">
                <BarChart2 size={18} style={{ color: '#D97706' }} className="flex-shrink-0" />
                <span className="fw-bold text-truncate" style={{ fontSize: '13.5px', color: '#92400E' }}>
                  Enter Marks
                </span>
              </div>
              <span className="flex-shrink-0 ms-1" style={{ color: '#92400E', fontSize: '16px', fontWeight: 700 }}>
                &rsaquo;
              </span>
            </div>

            {/* Action 3: Upload Material */}
            <div
              onClick={() => navigate('/teacher/study-materials')}
              className="quick-action-btn d-flex align-items-center justify-content-between px-3"
              style={{
                backgroundColor: '#FEF2F2',
                height: '49px',
                minHeight: '46px'
              }}
            >
              <div className="d-flex align-items-center gap-2.5 min-w-0">
                <BookOpen size={18} style={{ color: '#DC2626' }} className="flex-shrink-0" />
                <span className="fw-bold text-truncate" style={{ fontSize: '13.5px', color: '#991B1B' }}>
                  Upload Material
                </span>
              </div>
              <span className="flex-shrink-0 ms-1" style={{ color: '#991B1B', fontSize: '16px', fontWeight: 700 }}>
                &rsaquo;
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
