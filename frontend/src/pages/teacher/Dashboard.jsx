import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import studentService from '../../services/studentService';
import examService from '../../services/examService';
import noticeService from '../../services/noticeService';
import batchService from '../../services/batchService';
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

  const [totalStudents, setTotalStudents] = useState(0);
  const [upcomingExamsList, setUpcomingExamsList] = useState([]);
  const [recentAnnouncements, setRecentAnnouncements] = useState([]);
  const [totalExams, setTotalExams] = useState(0);
  const [scheduleRows, setScheduleRows] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [studentsRes, examsRes, noticesRes, batchesRes] = await Promise.allSettled([
          studentService.getAll(),
          examService.getAll(),
          noticeService.getAll(),
          batchService.getBatches()
        ]);

        if (studentsRes.status === 'fulfilled') {
          const students = studentsRes.value || [];
          setTotalStudents(students.length);
        }

        if (examsRes.status === 'fulfilled') {
          const exams = examsRes.value || [];
          setTotalExams(exams.length);
          const upcoming = exams.slice(0, 3).map(e => ({
            date: new Date(e.date || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
            subject: e.title,
            classBatch: e.classBatch || 'All Classes'
          }));
          setUpcomingExamsList(upcoming);
        }

        if (noticesRes.status === 'fulfilled') {
          const notices = noticesRes.value || [];
          const recent = notices.slice(0, 3).map((n, idx) => ({
            id: idx,
            title: n.title,
            date: new Date(n.publishedDate || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
            dotColor: '#A91D22'
          }));
          setRecentAnnouncements(recent);
        }

        if (batchesRes.status === 'fulfilled') {
          const batches = batchesRes.value || [];
          let filteredBatches = batches;
          if (user && user.role === 'teacher' && user.name) {
            const firstName = user.name.split(' ')[0].toLowerCase();
            filteredBatches = batches.filter(b => 
              b.teacher_name && 
              (b.teacher_name.toLowerCase().includes(firstName) || 
               user.name.toLowerCase().includes(b.teacher_name.toLowerCase()))
            );
          }
          const formattedRows = filteredBatches.map(b => ({
            time: b.time || 'TBD',
            subject: b.subject,
            classBatch: b.name,
            room: b.room || 'TBD',
            status: 'Scheduled',
            actionType: 'start',
            actionText: 'Start Class',
            path: '/teacher/attendance'
          }));
          setScheduleRows(formattedRows);
        }
      } catch (err) {
        console.error('Error fetching teacher dashboard data:', err);
      }
    };
    fetchDashboardData();
  }, []);

  // Interactive pending tasks state
  const [tasks, setTasks] = useState([]);

  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const attendanceDonutData = [
    { name: 'Present', value: 0, percentage: '0%', color: '#8B1216' },
    { name: 'Absent', value: 0, percentage: '0%', color: '#D97718' },
    { name: 'Late', value: 0, percentage: '0%', color: '#E11D48' },
  ];

  const upcomingExams = upcomingExamsList;

  return (
    <div className="d-flex flex-column w-100" style={{ gap: '12px' }}>
      <style>{`
        .teacher-kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }
        .teacher-main-grid {
          display: grid;
          grid-template-columns: minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1fr);
          gap: 12px;
        }
        .teacher-bottom-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }
        .teacher-grid-card {
          min-width: 0;
          width: 100%;
          box-sizing: border-box;
        }
        .schedule-table-wrapper {
          width: 100%;
          max-width: 100%;
          min-width: 0;
          overflow-x: auto;
          overflow-y: auto;
          box-sizing: border-box;
        }
        .schedule-table-wrapper::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .schedule-table-wrapper::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 4px;
        }
        .schedule-table-wrapper::-webkit-scrollbar-track {
          background-color: transparent;
        }
        @media (max-width: 1199px) {
          .teacher-bottom-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 991px) {
          .teacher-kpi-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .teacher-main-grid {
            grid-template-columns: minmax(0, 1fr);
          }
          .teacher-bottom-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 575px) {
          .teacher-kpi-grid {
            grid-template-columns: minmax(0, 1fr);
          }
          .teacher-bottom-grid {
            grid-template-columns: minmax(0, 1fr);
          }
        }
      `}</style>

      {/* 1. TOP GREETING & QUOTE SECTION */}
      <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between pt-0 pb-0">
        {/* Left: Greeting & Subtitle */}
        <div>
          <h1 className="fw-bold brand-font text-sa-charcoal m-0" style={{ fontSize: '20px', lineHeight: 1.2 }}>
            Good Morning, {user?.name || 'Teacher'}
          </h1>
          <p className="text-sa-muted m-0 mt-0.5" style={{ fontSize: '12.5px' }}>
            Ready to inspire young minds today?
          </p>
        </div>

        {/* Right: Motivational Quote with Gold Underline */}
        <div className="d-none d-sm-flex flex-column align-items-end text-end mt-1 mt-sm-0">
          <div
            className="text-sa-muted fst-italic"
            style={{ fontSize: '11.5px', lineHeight: 1.3, letterSpacing: '0.01em', fontWeight: 500 }}
          >
            "Better Teachers<br />Brighter Futures"
          </div>
          <div
            style={{
              width: '28px',
              height: '2px',
              backgroundColor: 'var(--sa-mustard-yellow)',
              borderRadius: '2px',
              marginTop: '3px'
            }}
          />
        </div>
      </div>

      {/* 2. FOUR KPI STAT CARDS */}
      <div className="teacher-kpi-grid">
        {/* Card 1: Today's Classes */}
        <div
          className="sa-card teacher-grid-card bg-white rounded-3 border d-flex align-items-center gap-2.5 transition-all cursor-pointer"
          onClick={() => navigate('/teacher/classes')}
          style={{ height: '78px', padding: '10px 14px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
        >
          <div
            className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ width: '38px', height: '38px', backgroundColor: '#FDF0F0', color: '#A91D22' }}
          >
            <Tv size={19} />
          </div>
          <div className="flex-grow-1 min-w-0">
            <span className="text-sa-muted fw-medium d-block text-truncate" style={{ fontSize: '11.5px' }}>
              Today's Classes
            </span>
            <div className="fw-bold text-sa-charcoal brand-font" style={{ fontSize: '22px', lineHeight: 1.15 }}>
              0
            </div>
            <span className="text-sa-muted d-block text-truncate" style={{ fontSize: '10px' }}>
              0 completed, 0 remaining
            </span>
          </div>
        </div>

        {/* Card 2: Total Students */}
        <div
          className="sa-card teacher-grid-card bg-white rounded-3 border d-flex align-items-center gap-2.5 transition-all cursor-pointer"
          onClick={() => navigate('/teacher/students')}
          style={{ height: '78px', padding: '10px 14px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
        >
          <div
            className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ width: '38px', height: '38px', backgroundColor: '#EAF6EF', color: '#168554' }}
          >
            <Users size={19} />
          </div>
          <div className="flex-grow-1 min-w-0">
            <span className="text-sa-muted fw-medium d-block text-truncate" style={{ fontSize: '11.5px' }}>
              Total Students
            </span>
            <div className="fw-bold text-sa-charcoal brand-font" style={{ fontSize: '22px', lineHeight: 1.15 }}>
              {totalStudents}
            </div>
            <span className="fw-semibold d-block text-truncate" style={{ fontSize: '10px', color: '#168554' }}>
              ↗ Total assigned
            </span>
          </div>
        </div>

        {/* Card 3: Pending Marks */}
        <div
          className="sa-card teacher-grid-card bg-white rounded-3 border d-flex align-items-center gap-2.5 transition-all cursor-pointer"
          onClick={() => navigate('/teacher/marks')}
          style={{ height: '78px', padding: '10px 14px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
        >
          <div
            className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ width: '38px', height: '38px', backgroundColor: '#FEF8EB', color: '#D97718' }}
          >
            <FileText size={19} />
          </div>
          <div className="flex-grow-1 min-w-0">
            <span className="text-sa-muted fw-medium d-block text-truncate" style={{ fontSize: '11.5px' }}>
              Pending Marks
            </span>
            <div className="fw-bold text-sa-charcoal brand-font" style={{ fontSize: '22px', lineHeight: 1.15 }}>
              0
            </div>
            <span className="text-sa-muted d-block text-truncate" style={{ fontSize: '10px' }}>
              Across 0 examinations
            </span>
          </div>
        </div>

        {/* Card 4: Working Hours */}
        <div
          className="sa-card teacher-grid-card bg-white rounded-3 border d-flex align-items-center gap-2.5 transition-all cursor-pointer"
          onClick={() => navigate('/teacher/working-time')}
          style={{ height: '78px', padding: '10px 14px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
        >
          <div
            className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ width: '38px', height: '38px', backgroundColor: '#FDF0F0', color: '#A91D22' }}
          >
            <Clock size={19} />
          </div>
          <div className="flex-grow-1 min-w-0">
            <span className="text-sa-muted fw-medium d-block text-truncate" style={{ fontSize: '11.5px' }}>
              Working Hours
            </span>
            <div className="fw-bold text-sa-charcoal brand-font" style={{ fontSize: '22px', lineHeight: 1.15 }}>
              0 hrs
            </div>
            <span className="fw-semibold d-block text-truncate" style={{ fontSize: '10px', color: '#168554' }}>
              ↗ 0% of 0 hrs this month
            </span>
          </div>
        </div>
      </div>

      {/* 3. MAIN SECTION: Schedule (50%) | Class Attendance (25%) | Quick Actions (25%) */}
      <div className="teacher-main-grid">
        {/* Column 1: Today's Class Schedule */}
        <div
          className="sa-card teacher-grid-card bg-white rounded-3 border d-flex flex-column overflow-hidden"
          style={{ height: '238px', padding: '12px 14px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
        >
          {/* Header */}
          <div className="d-flex align-items-center justify-content-between pb-1.5 border-bottom flex-shrink-0">
            <div className="d-flex align-items-center gap-1.5 min-w-0">
              <Calendar size={15} className="text-danger flex-shrink-0" />
              <h3 className="brand-font fw-bold m-0 text-sa-charcoal text-truncate" style={{ fontSize: '13px' }}>
                Today's Class Schedule
              </h3>
            </div>
            <button
              onClick={() => navigate('/teacher/classes')}
              className="btn btn-link p-0 text-decoration-none text-danger fw-semibold d-flex align-items-center gap-0.5 flex-shrink-0 ms-2"
              style={{ fontSize: '11px', whiteSpace: 'nowrap' }}
            >
              View Full Schedule &rarr;
            </button>
          </div>

          {/* Compact Schedule Table with Internal Scroll */}
          <div className="schedule-table-wrapper flex-grow-1 mt-0.5" style={{ fontSize: '10.5px' }}>
            <table className="table table-borderless table-sm m-0 align-middle" style={{ minWidth: '490px', width: '100%' }}>
              <thead>
                <tr className="text-muted border-bottom" style={{ fontSize: '10px', height: '24px' }}>
                  <th className="fw-semibold ps-1 py-0.5" style={{ width: '13%', whiteSpace: 'nowrap' }}>Time</th>
                  <th className="fw-semibold py-0.5" style={{ width: '23%', whiteSpace: 'nowrap' }}>Subject</th>
                  <th className="fw-semibold py-0.5" style={{ width: '20%', whiteSpace: 'nowrap' }}>Class / Batch</th>
                  <th className="fw-semibold py-0.5" style={{ width: '13%', whiteSpace: 'nowrap' }}>Room</th>
                  <th className="fw-semibold py-0.5" style={{ width: '14%', whiteSpace: 'nowrap' }}>Status</th>
                  <th className="fw-semibold pe-1 py-0.5 text-end" style={{ width: '17%', whiteSpace: 'nowrap' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {scheduleRows.map((row, idx) => (
                  <tr key={idx} className="border-bottom border-light" style={{ height: '29px' }}>
                    <td className="fw-medium text-sa-charcoal ps-1 py-0.5" style={{ whiteSpace: 'nowrap' }}>
                      {row.time}
                    </td>
                    <td className="fw-semibold text-sa-charcoal py-0.5" style={{ whiteSpace: 'nowrap' }}>
                      {row.subject}
                    </td>
                    <td className="text-sa-muted py-0.5" style={{ whiteSpace: 'nowrap' }}>
                      {row.classBatch}
                    </td>
                    <td className="py-0.5" style={{ whiteSpace: 'nowrap' }}>
                      <span className="badge bg-light text-muted border fw-normal" style={{ fontSize: '9.5px', padding: '2px 5px' }}>
                        {row.room}
                      </span>
                    </td>
                    <td className="py-0.5" style={{ whiteSpace: 'nowrap' }}>
                      {row.status === 'Completed' ? (
                        <span className="badge rounded-pill fw-medium" style={{ backgroundColor: '#EAF6EF', color: '#168554', fontSize: '9px', padding: '2px 7px' }}>
                          Completed
                        </span>
                      ) : row.status === 'Next Class' ? (
                        <span className="badge rounded-pill fw-medium" style={{ backgroundColor: '#FEF8EB', color: '#D97718', fontSize: '9px', padding: '2px 7px' }}>
                          Next Class
                        </span>
                      ) : (
                        <span className="badge rounded-pill fw-medium" style={{ backgroundColor: '#F1F5F9', color: '#475569', fontSize: '9px', padding: '2px 7px' }}>
                          Scheduled
                        </span>
                      )}
                    </td>
                    <td className="pe-1 py-0.5 text-end" style={{ whiteSpace: 'nowrap' }}>
                      {row.actionType === 'start' ? (
                        <button
                          onClick={() => navigate(row.path)}
                          className="btn btn-sm d-inline-flex align-items-center justify-content-center gap-1 text-white border-0 fw-semibold"
                          style={{
                            backgroundColor: '#A91D22',
                            fontSize: '9.5px',
                            padding: '2.5px 7px',
                            borderRadius: '4px',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          <span style={{ fontSize: '7.5px' }}>▶</span> Start Class
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate(row.path)}
                          className="btn btn-sm btn-outline-secondary text-decoration-none fw-medium"
                          style={{ fontSize: '9.5px', padding: '1.5px 7px', borderRadius: '4px', whiteSpace: 'nowrap' }}
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
          className="sa-card teacher-grid-card bg-white rounded-3 border d-flex flex-column overflow-hidden"
          style={{ height: '238px', padding: '12px 14px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
        >
          {/* Header */}
          <div className="d-flex align-items-center justify-content-between pb-1 flex-shrink-0">
            <div className="d-flex align-items-center gap-1.5 min-w-0">
              <BarChart2 size={15} className="text-danger flex-shrink-0" />
              <h3 className="brand-font fw-bold m-0 text-sa-charcoal text-truncate" style={{ fontSize: '13px' }}>
                Class Attendance
              </h3>
            </div>
            <div
              className="d-inline-flex align-items-center gap-1 px-1.5 py-0.5 rounded border bg-light text-muted flex-shrink-0"
              style={{ fontSize: '10px' }}
            >
              <span>{attendancePeriod}</span>
              <ChevronDown size={10} />
            </div>
          </div>

          {/* Donut Chart with Center Text */}
          <div className="position-relative d-flex align-items-center justify-content-center flex-grow-1" style={{ minHeight: '105px', maxHeight: '112px', overflow: 'hidden' }}>
            <ResponsiveContainer width="100%" height={108}>
              <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <Pie
                  data={attendanceDonutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={32}
                  outerRadius={46}
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
              <div className="fw-bold text-sa-charcoal brand-font" style={{ fontSize: '15px', lineHeight: 1 }}>
                0
              </div>
              <div className="text-sa-muted" style={{ fontSize: '9px', lineHeight: 1, marginTop: '1.5px' }}>
                Students
              </div>
            </div>
          </div>

          {/* Compact Legend Table below Chart */}
          <div className="d-flex flex-column gap-0.5 pt-1 border-top flex-shrink-0" style={{ fontSize: '10.5px' }}>
            {attendanceDonutData.map((item, idx) => (
              <div key={idx} className="d-flex align-items-center justify-content-between py-0.5">
                <div className="d-flex align-items-center gap-1.5 min-w-0">
                  <span className="rounded-circle d-inline-block flex-shrink-0" style={{ width: '6px', height: '6px', backgroundColor: item.color }} />
                  <span className="text-sa-charcoal fw-medium text-truncate">{item.name}</span>
                </div>
                <div className="d-flex align-items-center gap-1.5 flex-shrink-0">
                  <span className="fw-bold text-sa-charcoal">{item.value}</span>
                  <span className="text-muted text-end" style={{ width: '34px' }}>{item.percentage}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: Quick Actions */}
        <div
          className="sa-card teacher-grid-card bg-white rounded-3 border d-flex flex-column overflow-hidden"
          style={{ height: '238px', padding: '12px 14px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
        >
          {/* Header */}
          <div className="d-flex align-items-center gap-1.5 pb-1.5 border-bottom flex-shrink-0">
            <Zap size={15} className="text-danger flex-shrink-0" />
            <h3 className="brand-font fw-bold m-0 text-sa-charcoal text-truncate" style={{ fontSize: '13px' }}>
              Quick Actions
            </h3>
          </div>

          {/* Action Buttons with Balanced Normal Spacing */}
          <div className="d-flex flex-column justify-content-around flex-grow-1 pt-1.5 pb-0.5" style={{ minWidth: 0, gap: '6px' }}>
            {/* Action 1: Take Attendance */}
            <button
              onClick={() => navigate('/teacher/attendance')}
              className="btn w-100 text-start d-flex align-items-center justify-content-between border-0 transition-all shadow-xs"
              style={{
                backgroundColor: '#FDF0F0',
                borderRadius: '7px',
                padding: '7px 11px',
                height: '40px',
                minWidth: 0
              }}
            >
              <div className="d-flex align-items-center gap-2 min-w-0">
                <Users size={15} style={{ color: '#A91D22' }} className="flex-shrink-0" />
                <span className="fw-bold text-truncate" style={{ fontSize: '11.5px', color: '#A91D22' }}>
                  Take Attendance
                </span>
              </div>
              <span className="flex-shrink-0 ms-1" style={{ color: '#A91D22', fontSize: '15px', fontWeight: 600 }}>&rsaquo;</span>
            </button>

            {/* Action 2: Enter Marks */}
            <button
              onClick={() => navigate('/teacher/marks')}
              className="btn w-100 text-start d-flex align-items-center justify-content-between border-0 transition-all shadow-xs"
              style={{
                backgroundColor: '#FEF8EB',
                borderRadius: '7px',
                padding: '7px 11px',
                height: '40px',
                minWidth: 0
              }}
            >
              <div className="d-flex align-items-center gap-2 min-w-0">
                <BarChart2 size={15} style={{ color: '#D97718' }} className="flex-shrink-0" />
                <span className="fw-bold text-truncate" style={{ fontSize: '11.5px', color: '#D97718' }}>
                  Enter Marks
                </span>
              </div>
              <span className="flex-shrink-0 ms-1" style={{ color: '#D97718', fontSize: '15px', fontWeight: 600 }}>&rsaquo;</span>
            </button>

            {/* Action 3: Upload Material */}
            <button
              onClick={() => navigate('/teacher/study-materials')}
              className="btn w-100 text-start d-flex align-items-center justify-content-between border-0 transition-all shadow-xs"
              style={{
                backgroundColor: '#FDF0F0',
                borderRadius: '7px',
                padding: '7px 11px',
                height: '40px',
                minWidth: 0
              }}
            >
              <div className="d-flex align-items-center gap-2 min-w-0">
                <BookOpen size={15} style={{ color: '#A91D22' }} className="flex-shrink-0" />
                <span className="fw-bold text-truncate" style={{ fontSize: '11.5px', color: '#A91D22' }}>
                  Upload Material
                </span>
              </div>
              <span className="flex-shrink-0 ms-1" style={{ color: '#A91D22', fontSize: '15px', fontWeight: 600 }}>&rsaquo;</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. BOTTOM ROW: Upcoming Examinations | Pending Tasks | Recent Announcements | This Month's Hours */}
      <div className="teacher-bottom-grid">
        {/* Card 1: Upcoming Examinations */}
        <div
          className="sa-card teacher-grid-card bg-white rounded-3 border d-flex flex-column overflow-hidden"
          style={{ height: '168px', padding: '10px 12px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
        >
          <div className="d-flex align-items-center justify-content-between pb-1 border-bottom flex-shrink-0">
            <div className="d-flex align-items-center gap-1.5 min-w-0">
              <FileText size={13} className="text-danger flex-shrink-0" />
              <h4 className="brand-font fw-bold m-0 text-sa-charcoal text-truncate" style={{ fontSize: '12px' }}>
                Upcoming Examinations
              </h4>
            </div>
            <button
              onClick={() => navigate('/teacher/exams')}
              className="btn btn-link p-0 text-decoration-none text-danger fw-semibold flex-shrink-0 ms-1"
              style={{ fontSize: '10.5px', whiteSpace: 'nowrap' }}
            >
              View All &rarr;
            </button>
          </div>
          <div className="d-flex flex-column justify-content-around flex-grow-1 pt-0.5" style={{ fontSize: '10.5px', minWidth: 0 }}>
            <div className="d-flex justify-content-between text-muted border-bottom pb-0.5" style={{ fontSize: '9.5px' }}>
              <span style={{ width: '32%' }}>Date</span>
              <span style={{ width: '36%' }}>Subject</span>
              <span className="text-end" style={{ width: '32%' }}>Class / Batch</span>
            </div>
            {upcomingExams.map((exam, idx) => (
              <div key={idx} className="d-flex justify-content-between align-items-center py-0.5">
                <span className="fw-semibold text-danger text-truncate" style={{ fontSize: '10px', width: '32%' }}>{exam.date}</span>
                <span className="fw-medium text-sa-charcoal text-truncate" style={{ fontSize: '10px', width: '36%' }}>{exam.subject}</span>
                <span className="text-sa-muted text-truncate text-end" style={{ fontSize: '10px', width: '32%' }}>{exam.classBatch}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: Pending Tasks */}
        <div
          className="sa-card teacher-grid-card bg-white rounded-3 border d-flex flex-column overflow-hidden"
          style={{ height: '168px', padding: '10px 12px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
        >
          <div className="d-flex align-items-center justify-content-between pb-1 border-bottom flex-shrink-0">
            <div className="d-flex align-items-center gap-1.5 min-w-0">
              <CheckSquare size={13} className="text-danger flex-shrink-0" />
              <h4 className="brand-font fw-bold m-0 text-sa-charcoal text-truncate" style={{ fontSize: '12px' }}>
                Pending Tasks
              </h4>
            </div>
            <button
              onClick={() => navigate('/teacher/marks')}
              className="btn btn-link p-0 text-decoration-none text-danger fw-semibold flex-shrink-0 ms-1"
              style={{ fontSize: '10.5px', whiteSpace: 'nowrap' }}
            >
              View All &rarr;
            </button>
          </div>
          <div className="d-flex flex-column justify-content-around flex-grow-1 pt-0.5" style={{ gap: '4px', minWidth: 0 }}>
            {tasks.map((task) => (
              <div
                key={task.id}
                className="d-flex align-items-start gap-1.5 cursor-pointer min-w-0"
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
                    style={{ fontSize: '10px', lineHeight: 1.2 }}
                  >
                    {task.title}
                  </div>
                  <div className="text-muted text-truncate" style={{ fontSize: '8.5px', lineHeight: 1, marginTop: '1px' }}>
                    {task.subtext}
                  </div>
                </div>
                <span
                  className="badge flex-shrink-0 fw-normal"
                  style={{
                    fontSize: '8px',
                    padding: '1.5px 4.5px',
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
          className="sa-card teacher-grid-card bg-white rounded-3 border d-flex flex-column overflow-hidden"
          style={{ height: '168px', padding: '10px 12px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
        >
          <div className="d-flex align-items-center justify-content-between pb-1 border-bottom flex-shrink-0">
            <div className="d-flex align-items-center gap-1.5 min-w-0">
              <Megaphone size={13} className="text-danger flex-shrink-0" />
              <h4 className="brand-font fw-bold m-0 text-sa-charcoal text-truncate" style={{ fontSize: '12px' }}>
                Recent Announcements
              </h4>
            </div>
            <button
              onClick={() => navigate('/teacher/announcements')}
              className="btn btn-link p-0 text-decoration-none text-danger fw-semibold flex-shrink-0 ms-1"
              style={{ fontSize: '10.5px', whiteSpace: 'nowrap' }}
            >
              View All &rarr;
            </button>
          </div>
          <div className="d-flex flex-column justify-content-around flex-grow-1 pt-0.5" style={{ gap: '3px', minWidth: 0 }}>
            {recentAnnouncements.map((item) => (
              <div key={item.id} className="d-flex align-items-center justify-content-between min-w-0" style={{ fontSize: '10px' }}>
                <div className="d-flex align-items-center gap-1.5 min-w-0">
                  <span className="rounded-circle flex-shrink-0" style={{ width: '5px', height: '5px', backgroundColor: item.dotColor }} />
                  <span className="text-sa-charcoal text-truncate fw-medium">{item.title}</span>
                </div>
                <span className="text-muted flex-shrink-0 ps-1" style={{ fontSize: '9px', whiteSpace: 'nowrap' }}>{item.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 4: This Month's Hours */}
        <div
          className="sa-card teacher-grid-card bg-white rounded-3 border d-flex flex-column overflow-hidden"
          style={{ height: '168px', padding: '10px 12px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
        >
          <div className="d-flex align-items-center justify-content-between pb-1 border-bottom flex-shrink-0">
            <div className="d-flex align-items-center gap-1.5 min-w-0">
              <Clock size={13} className="text-danger flex-shrink-0" />
              <h4 className="brand-font fw-bold m-0 text-sa-charcoal text-truncate" style={{ fontSize: '12px' }}>
                This Month's Hours
              </h4>
            </div>
            <button
              onClick={() => navigate('/teacher/working-time')}
              className="btn btn-link p-0 text-decoration-none text-danger fw-semibold flex-shrink-0 ms-1"
              style={{ fontSize: '10.5px', whiteSpace: 'nowrap' }}
            >
              View Details &rarr;
            </button>
          </div>
          <div className="d-flex flex-column justify-content-between flex-grow-1 pt-1 pb-0" style={{ minWidth: 0 }}>
            <div>
              <div className="d-flex align-items-baseline justify-content-between">
                <div>
                  <span className="brand-font fw-bold text-sa-charcoal" style={{ fontSize: '14.5px' }}>0</span>
                  <span className="text-muted" style={{ fontSize: '10.5px' }}> / 0 hrs</span>
                </div>
                <span className="text-muted fw-semibold" style={{ fontSize: '10px' }}>0%</span>
              </div>
              <div className="progress mt-1" style={{ height: '4.5px', backgroundColor: '#F1F5F9' }}>
                <div
                  className="progress-bar"
                  role="progressbar"
                  style={{ width: '0%', backgroundColor: '#A91D22', borderRadius: '3px' }}
                  aria-valuenow="0"
                  aria-valuemin="0"
                  aria-valuemax="100"
                />
              </div>
            </div>

            <div
              className="rounded-2 d-flex align-items-center gap-1.5 mt-1"
              style={{ backgroundColor: '#FAF8F5', border: '1px solid #F1ECE4', padding: '4px 7px' }}
            >
              <div
                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: '24px', height: '24px', backgroundColor: '#FEF8EB', color: '#D97718' }}
              >
                <Coins size={12} />
              </div>
              <div className="flex-grow-1 min-w-0">
                <div className="d-flex align-items-center justify-content-between">
                  <div className="text-sa-muted" style={{ fontSize: '9px', lineHeight: 1 }}>
                    Estimated Pay
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/teacher/salary');
                    }}
                    className="btn btn-link p-0 text-decoration-none text-danger fw-semibold"
                    style={{ fontSize: '9px', lineHeight: 1 }}
                  >
                    View Salary &rarr;
                  </button>
                </div>
                <div className="brand-font fw-bold text-sa-charcoal" style={{ fontSize: '14px', lineHeight: 1.15 }}>
                  ₹0
                </div>
                <div className="text-sa-muted" style={{ fontSize: '8.5px', lineHeight: 1 }}>
                  Based on 0 hrs/month
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
