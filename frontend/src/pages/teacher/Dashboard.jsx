import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import studentService from '../../services/studentService';
import examService from '../../services/examService';
import noticeService from '../../services/noticeService';
import batchService from '../../services/batchService';
import { attendanceService } from '../../services/attendanceService';
import salaryService from '../../services/salaryService';
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
  BookMarked,
  ChevronDown,
  ChevronRight,
  Coins,
  BarChart2,
  Tv
} from 'lucide-react';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [attendancePeriod, setAttendancePeriod] = useState('This Month');

  const [totalStudents, setTotalStudents] = useState(0);
  const [dailyActivitiesCount, setDailyActivitiesCount] = useState(() => {
    try {
      const saved = localStorage.getItem('sa_teacher_daily_activities');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.length;
      }
    } catch (_) { }
    return 3;
  });
  const [upcomingExamsList, setUpcomingExamsList] = useState([]);
  const [recentAnnouncements, setRecentAnnouncements] = useState([]);
  const [totalExams, setTotalExams] = useState(0);
  const [scheduleRows, setScheduleRows] = useState([]);
  const [totalWorkingHours, setTotalWorkingHours] = useState(0);
  const [salaryDetails, setSalaryDetails] = useState({ pending: 0, status: 'N/A' });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [studentsRes, examsRes, noticesRes, batchesRes] = await Promise.allSettled([
          studentService.getAll(),
          examService.getAll(),
          noticeService.getAll(),
          batchService.getBatches()
        ]);

        if (user && user.id) {
          try {
            const records = await attendanceService.getWorkingTime(user.id);
            let totalHours = 0;
            records.forEach(r => {
              if (r.totalHours && r.totalHours !== '--') {
                const match = r.totalHours.match(/(\d+)\s*h\s*(\d+)\s*m/i);
                if (match) {
                  totalHours += parseInt(match[1], 10) + parseInt(match[2], 10) / 60;
                }
              }
            });
            setTotalWorkingHours(totalHours.toFixed(1));
          } catch (e) {
            console.error('Failed to fetch working time', e);
          }

          try {
            const salaries = await salaryService.getMySalaries();
            if (salaries && salaries.length > 0) {
              const currentSalary = salaries[salaries.length - 1]; // Assume latest is current
              const statusText = currentSalary?.status === 'Disbursed' ? 'Fully paid' :
                currentSalary?.status === 'Partially Paid' ? 'Installment paid' : 'Pending';
              setSalaryDetails({
                pending: Number(currentSalary.amountPending) || 0,
                status: statusText
              });
            }
          } catch (e) {
            console.error('Failed to fetch salary details', e);
          }
        }

        if (studentsRes.status === 'fulfilled') {
          const students = studentsRes.value || [];
          setTotalStudents(students.length);
        }

        let examsList = [];
        if (examsRes.status === 'fulfilled') {
          examsList = examsRes.value || [];
          setTotalExams(examsList.length);

          // Filter for scheduled / upcoming exams
          const scheduled = examsList.filter(e => {
            const st = String(e.status || '').toLowerCase();
            return !['completed', 'finished', 'done', 'cancelled', 'canceled'].includes(st);
          }).sort((a, b) => {
            const dateA = a.date && a.date !== 'N/A' ? new Date(a.date).getTime() : Infinity;
            const dateB = b.date && b.date !== 'N/A' ? new Date(b.date).getTime() : Infinity;
            return dateA - dateB;
          });

          const upcoming = (scheduled.length > 0 ? scheduled : examsList).slice(0, 3).map(e => {
            let formattedDate = e.date || 'TBD';
            if (e.date && e.date !== 'N/A') {
              try {
                const parsed = new Date(e.date);
                if (!isNaN(parsed.getTime())) {
                  formattedDate = parsed.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                }
              } catch (_) { }
            }
            return {
              id: e.id,
              date: formattedDate,
              subject: e.subject || e.title,
              title: e.title,
              classBatch: e.classBatch || e.batch || e.examStandard || e.standard || 'All Classes',
              status: e.status || 'Scheduled'
            };
          });
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

          // Also include scheduled exams in teacher's schedule view
          const scheduledExams = examsList.filter(e => {
            const st = String(e.status || '').toLowerCase();
            return ['scheduled', 'upcoming'].includes(st);
          }).slice(0, 2).map(e => ({
            time: e.startTime ? `${e.startTime}` : '10:00 AM',
            subject: `${e.subject} [Exam: ${e.title}]`,
            classBatch: e.batch || e.examStandard || e.standard || 'Scheduled Exam',
            room: e.roomNo || 'Exam Hall',
            status: 'Scheduled',
            actionType: 'exam',
            actionText: 'View Exam',
            path: '/teacher/exams'
          }));

          setScheduleRows([...formattedRows, ...scheduledExams]);
        }
      } catch (err) {
        console.error('Error fetching teacher dashboard data:', err);
      }
    };
    fetchDashboardData();
  }, []);

  // Interactive pending tasks state
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Upload Wave Optics formulas & worksheet', subtext: 'Class 12th Science • Physics', priority: 'High', completed: false },
    { id: 2, title: 'Enter Weekly Test #3 Marks', subtext: 'Batch Tarabai Park • 24 Students', priority: 'High', completed: false },
    { id: 3, title: 'Verify Lab attendance journal logs', subtext: 'Class 11th Practical Lab', priority: 'Normal', completed: true },
  ]);

  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const attendanceDonutData = [
    { name: 'Present', value: 0, percentage: '0%', color: '#8B1216' },
    { name: 'Absent', value: 0, percentage: '0%', color: '#D97718' },
    { name: 'Late', value: 0, percentage: '0%', color: '#E11D48' },
  ];

  const upcomingExams = upcomingExamsList;

  const totalAttendanceStudents = attendanceDonutData.reduce((acc, d) => acc + d.value, 0);
  const attendanceChartData = totalAttendanceStudents > 0
    ? attendanceDonutData
    : [{ name: 'No Data', value: 1, color: '#E2E8F0' }];

  return (
    <div className="teacher-dashboard-page d-flex flex-column w-100" style={{ gap: '18px' }}>
      <style>{`
        .teacher-kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }
        .teacher-two-col-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }
        .teacher-grid-card {
          min-width: 0;
          width: 100%;
          box-sizing: border-box;
          border-radius: 16px !important;
          border: 1px solid rgba(255, 255, 255, 0.9) !important;
          border-top: 1.5px solid rgba(255, 255, 255, 0.98) !important;
          border-bottom: 1px solid rgba(220, 38, 38, 0.1) !important;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.92) 0%, rgba(255, 255, 255, 0.75) 100%) !important;
          backdrop-filter: blur(20px) saturate(180%) !important;
          -webkit-backdrop-filter: blur(20px) saturate(180%) !important;
          box-shadow:
            0 8px 24px -4px rgba(139, 18, 22, 0.06),
            0 4px 12px -2px rgba(0, 0, 0, 0.04),
            inset 0 1px 2px 0 rgba(255, 255, 255, 0.95) !important;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .teacher-grid-card:hover {
          border-color: rgba(220, 38, 38, 0.22) !important;
          box-shadow:
            0 16px 32px -6px rgba(139, 18, 22, 0.10),
            0 6px 16px -2px rgba(0, 0, 0, 0.05),
            inset 0 1px 2px 0 rgba(255, 255, 255, 1) !important;
          transform: translateY(-2px) !important;
        }
        .teacher-card-heading {
          font-size: 13.5px;
          font-weight: 700;
          color: #1E293B;
          margin: 0;
          letter-spacing: -0.01em;
          white-space: nowrap;
        }
        .teacher-kpi-card {
          min-height: 88px;
          padding: 12px 14px;
        }
        .teacher-action-card-btn {
          transition: all 0.2s ease;
          border-radius: 12px;
          padding: 8px 12px;
        }
        .teacher-action-card-btn:hover {
          transform: translateX(3px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
        }
        @media (max-width: 1199px) {
          .teacher-kpi-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 767px) {
          .teacher-kpi-grid {
            grid-template-columns: minmax(0, 1fr);
          }
          .teacher-two-col-grid {
            grid-template-columns: minmax(0, 1fr);
          }
        }
      `}</style>

      {/* 1. TOP GREETING & HERO BANNER */}
      <div
        className="teacher-welcome-banner rounded-4 border overflow-hidden position-relative"
        style={{
          borderRadius: '20px',
          background: 'linear-gradient(135deg, rgba(255, 248, 238, 0.95) 0%, rgba(255, 243, 235, 0.90) 50%, rgba(254, 244, 234, 0.85) 100%)',
          border: '1px solid rgba(220, 38, 38, 0.14)',
          boxShadow: '0 8px 30px rgba(185, 28, 28, 0.05), inset 0 1px 2px rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)'
        }}
      >
        <div className="row g-0 align-items-center">
          <div className="col-12 col-md-7 p-4 ps-md-4 ps-xl-5 py-md-4">
            <h1
              className="fw-bold brand-font text-sa-charcoal m-0"
              style={{ fontSize: '1.85rem', letterSpacing: '-0.01em', lineHeight: 1.25 }}
            >
              Good Morning, {user?.name || 'Teacher'}
            </h1>
            <p
              className="text-sa-charcoal text-opacity-75 m-0 mt-2"
              style={{ fontSize: '0.95rem', fontWeight: 400 }}
            >
              Ready to inspire young minds today?
            </p>
            <div
              className="d-inline-flex align-items-center gap-2 mt-3 px-3 py-1.5 rounded-pill"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                border: '1px solid rgba(220, 38, 38, 0.12)',
                fontSize: '0.85rem',
                color: '#8B1216',
                fontWeight: 600
              }}
            >
              <span>✨</span>
              <span>"Better Teachers • Brighter Futures"</span>
            </div>
          </div>
          <div className="col-12 col-md-5 d-flex justify-content-end align-items-end pe-0 pe-md-3 pe-xl-4 overflow-hidden">
            <img
              src="/assets/superadminhero.png"
              alt="Shubham Academy Celebration"
              className="img-fluid"
              style={{
                maxHeight: '150px',
                width: 'auto',
                objectFit: 'contain',
                objectPosition: 'bottom right'
              }}
            />
          </div>
        </div>
      </div>

      {/* 2. FOUR KPI STAT CARDS (NORMAL COMFORTABLE SPACING & MATCHING ADMIN PANEL) */}
      <div className="row g-3 g-xl-4">
        {/* Card 1: Today's Classes */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="sa-kpi-glass-card theme-red p-3.5 p-xl-4 d-flex flex-column justify-content-between h-100"
            onClick={() => navigate('/teacher/classes')}
            style={{ cursor: 'pointer', minHeight: '150px' }}
          >
            <div className="d-flex align-items-start justify-content-between mb-3">
              <div className="sa-stat-icon-wrapper sa-stat-icon-red">
                <Tv size={22} />
              </div>
              <div className="sa-card-chevron-btn">
                <ChevronRight size={15} />
              </div>
            </div>
            <div>
              <span className="text-sa-muted fw-semibold d-block mb-1.5" style={{ fontSize: '0.82rem', letterSpacing: '0.01em' }}>
                Today's Classes
              </span>
              <div className="fw-bold text-sa-charcoal brand-font mb-1.5" style={{ fontSize: '1.85rem', lineHeight: 1.2 }}>
                {scheduleRows.length}
              </div>
              <span className="text-sa-muted fw-medium d-block text-truncate" style={{ fontSize: '0.78rem', letterSpacing: '0.01em' }}>
                {scheduleRows.filter(r => r.status === 'Completed').length} completed, {scheduleRows.filter(r => r.status !== 'Completed').length} remaining
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Daily Activity */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="sa-kpi-glass-card theme-green p-3.5 p-xl-4 d-flex flex-column justify-content-between h-100"
            onClick={() => navigate('/teacher/daily-activity')}
            style={{ cursor: 'pointer', minHeight: '150px' }}
          >
            <div className="d-flex align-items-start justify-content-between mb-3">
              <div className="sa-stat-icon-wrapper sa-stat-icon-green rounded-circle">
                <BookOpen size={22} />
              </div>
              <div className="sa-card-chevron-btn">
                <ChevronRight size={15} />
              </div>
            </div>
            <div>
              <span className="text-sa-muted fw-semibold d-block mb-1.5" style={{ fontSize: '0.82rem', letterSpacing: '0.01em' }}>
                Daily Activity
              </span>
              <div className="fw-bold text-sa-charcoal brand-font mb-1.5" style={{ fontSize: '1.85rem', lineHeight: 1.2 }}>
                {dailyActivitiesCount} <span style={{ fontSize: '0.92rem', fontWeight: 500, color: '#64748B' }}>topics</span>
              </div>
              <span className="fw-semibold d-block text-truncate" style={{ fontSize: '0.78rem', color: '#168554', letterSpacing: '0.01em' }}>
                ↗ Logged today
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Pending Salary */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="sa-kpi-glass-card theme-amber p-3.5 p-xl-4 d-flex flex-column justify-content-between h-100"
            onClick={() => navigate('/teacher/salary')}
            style={{ cursor: 'pointer', minHeight: '150px' }}
          >
            <div className="d-flex align-items-start justify-content-between mb-3">
              <div className="sa-stat-icon-wrapper sa-stat-icon-amber">
                <Coins size={22} />
              </div>
              <div className="sa-card-chevron-btn">
                <ChevronRight size={15} />
              </div>
            </div>
            <div>
              <span className="text-sa-muted fw-semibold d-block mb-1.5" style={{ fontSize: '0.82rem', letterSpacing: '0.01em' }}>
                Pending Salary
              </span>
              <div className="fw-bold text-sa-charcoal brand-font mb-1.5" style={{ fontSize: '1.85rem', lineHeight: 1.2 }}>
                ₹{salaryDetails.pending.toLocaleString()}
              </div>
              <span className="text-sa-muted fw-medium d-block text-truncate" style={{ fontSize: '0.78rem', letterSpacing: '0.01em' }}>
                Status: {salaryDetails.status}
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Working Hours */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="sa-kpi-glass-card theme-red p-3.5 p-xl-4 d-flex flex-column justify-content-between h-100"
            onClick={() => navigate('/teacher/working-time')}
            style={{ cursor: 'pointer', minHeight: '150px' }}
          >
            <div className="d-flex align-items-start justify-content-between mb-3">
              <div className="sa-stat-icon-wrapper sa-stat-icon-red">
                <Clock size={22} />
              </div>
              <div className="sa-card-chevron-btn">
                <ChevronRight size={15} />
              </div>
            </div>
            <div>
              <span className="text-sa-muted fw-semibold d-block mb-1.5" style={{ fontSize: '0.82rem', letterSpacing: '0.01em' }}>
                Working Hours
              </span>
              <div className="fw-bold text-sa-charcoal brand-font mb-1.5" style={{ fontSize: '1.85rem', lineHeight: 1.2 }}>
                {totalWorkingHours} hrs
              </div>
              <span className="fw-semibold d-block text-truncate" style={{ fontSize: '0.78rem', color: '#168554', letterSpacing: '0.01em' }}>
                ↗ {Math.round((parseFloat(totalWorkingHours) / 160) * 100)}% of 160 hrs
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. TODAY'S CLASS SCHEDULE (FULL WIDTH CARD - NO OVERLAP) */}
      <div
        className="teacher-grid-card d-flex flex-column"
        style={{ minHeight: '190px', padding: '16px 20px' }}
      >
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between pb-2.5 mb-2 border-bottom flex-shrink-0" style={{ borderColor: 'rgba(220, 38, 38, 0.08)' }}>
          <div className="d-flex align-items-center gap-2 min-w-0 flex-shrink-0">
            <Calendar size={17} style={{ color: '#8B1216' }} className="flex-shrink-0" />
            <h3 className="teacher-card-heading">
              Today's Class Schedule
            </h3>
          </div>
          <button
            onClick={() => navigate('/teacher/classes')}
            className="btn btn-link p-0 text-decoration-none fw-semibold flex-shrink-0 ms-2"
            style={{ fontSize: '12px', whiteSpace: 'nowrap', color: '#8B1216' }}
          >
            View Full Schedule &rarr;
          </button>
        </div>

        {/* Schedule Content */}
        {scheduleRows.length === 0 ? (
          <div className="d-flex flex-column align-items-center justify-content-center text-center py-4 flex-grow-1">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center mb-2"
              style={{ width: '42px', height: '42px', backgroundColor: '#FDF0F0', color: '#8B1216' }}
            >
              <Calendar size={20} />
            </div>
            <div className="fw-semibold text-sa-charcoal" style={{ fontSize: '13px' }}>
              No classes scheduled for today
            </div>
            <div className="text-sa-muted mt-0.5" style={{ fontSize: '11.5px' }}>
              Your timetable for today is clear. Relax or prepare upcoming lecture materials!
            </div>
          </div>
        ) : (
          <div className="table-responsive flex-grow-1">
            <table className="table table-borderless table-sm m-0 align-middle w-100" style={{ tableLayout: 'fixed' }}>
              <thead>
                <tr className="text-muted border-bottom" style={{ fontSize: '11px', height: '28px' }}>
                  <th className="fw-semibold ps-2 py-1 text-uppercase" style={{ width: '12%', letterSpacing: '0.02em' }}>Time</th>
                  <th className="fw-semibold py-1 text-uppercase" style={{ width: '32%', letterSpacing: '0.02em' }}>Subject</th>
                  <th className="fw-semibold py-1 text-uppercase" style={{ width: '20%', letterSpacing: '0.02em' }}>Batch</th>
                  <th className="fw-semibold py-1 text-uppercase" style={{ width: '12%', letterSpacing: '0.02em' }}>Room</th>
                  <th className="fw-semibold py-1 text-uppercase" style={{ width: '12%', letterSpacing: '0.02em' }}>Status</th>
                  <th className="fw-semibold pe-2 py-1 text-end text-uppercase" style={{ width: '12%', letterSpacing: '0.02em' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {scheduleRows.map((row, idx) => (
                  <tr key={idx} className="border-bottom border-light" style={{ height: '38px' }}>
                    <td className="fw-semibold text-sa-charcoal ps-2 py-1.5" style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                      {row.time}
                    </td>
                    <td className="py-1.5" style={{ overflow: 'hidden' }}>
                      <div className="fw-semibold text-sa-charcoal text-truncate" title={row.subject} style={{ fontSize: '12.5px' }}>
                        {row.subject}
                      </div>
                    </td>
                    <td className="py-1.5" style={{ overflow: 'hidden' }}>
                      <div className="text-sa-muted text-truncate" title={row.classBatch} style={{ fontSize: '12px' }}>
                        {row.classBatch}
                      </div>
                    </td>
                    <td className="py-1.5">
                      <span className="badge bg-light text-muted border fw-normal text-truncate d-inline-block" style={{ fontSize: '10.5px', padding: '3px 8px', maxWidth: '100%' }}>
                        {row.room}
                      </span>
                    </td>
                    <td className="py-1.5">
                      {row.status === 'Completed' ? (
                        <span className="badge rounded-pill fw-medium" style={{ backgroundColor: '#EAF6EF', color: '#168554', fontSize: '10.5px', padding: '3px 8px' }}>
                          Completed
                        </span>
                      ) : row.status === 'Next Class' ? (
                        <span className="badge rounded-pill fw-medium" style={{ backgroundColor: '#FEF8EB', color: '#D97718', fontSize: '10.5px', padding: '3px 8px' }}>
                          Next Class
                        </span>
                      ) : (
                        <span className="badge rounded-pill fw-medium" style={{ backgroundColor: '#F1F5F9', color: '#475569', fontSize: '10.5px', padding: '3px 8px' }}>
                          Scheduled
                        </span>
                      )}
                    </td>
                    <td className="pe-2 py-1.5 text-end">
                      {row.actionType === 'start' ? (
                        <button
                          onClick={() => navigate(row.path)}
                          className="btn btn-sm d-inline-flex align-items-center justify-content-center gap-1.5 text-white border-0 fw-semibold"
                          style={{
                            backgroundColor: '#8B1216',
                            fontSize: '11px',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          <span>▶</span> Start Class
                        </button>
                      ) : row.actionType === 'exam' ? (
                        <button
                          onClick={() => navigate(row.path)}
                          className="btn btn-sm d-inline-flex align-items-center justify-content-center gap-1.5 text-white border-0 fw-semibold"
                          style={{
                            backgroundColor: '#0284C7',
                            fontSize: '11px',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          <FileText size={11} /> View Exam
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate(row.path)}
                          className="btn btn-sm btn-outline-secondary text-decoration-none fw-medium"
                          style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '6px', whiteSpace: 'nowrap' }}
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
        )}
      </div>

      {/* 4. CLASS ATTENDANCE & QUICK ACTIONS (2 EQUAL COLUMNS - ZERO OVERLAP) */}
      <div className="teacher-two-col-grid">
        {/* Card 1: Class Attendance */}
        <div
          className="teacher-grid-card d-flex flex-column overflow-hidden"
          style={{ minHeight: '235px', padding: '16px 18px' }}
        >
          {/* Header */}
          <div className="d-flex align-items-center justify-content-between pb-2 mb-1.5 border-bottom flex-shrink-0" style={{ borderColor: 'rgba(220, 38, 38, 0.08)' }}>
            <div className="d-flex align-items-center gap-2 min-w-0 flex-shrink-0">
              <BarChart2 size={16} style={{ color: '#8B1216' }} className="flex-shrink-0" />
              <h3 className="teacher-card-heading">
                Class Attendance
              </h3>
            </div>
            <div
              className="d-inline-flex align-items-center gap-1.5 px-2 py-0.5 rounded border bg-light text-muted flex-shrink-0 ms-auto"
              style={{ fontSize: '11px', whiteSpace: 'nowrap' }}
            >
              <span>{attendancePeriod}</span>
              <ChevronDown size={11} />
            </div>
          </div>

          {/* Donut Chart with Center Text */}
          <div className="position-relative d-flex align-items-center justify-content-center flex-grow-1" style={{ minHeight: '115px', overflow: 'hidden' }}>
            <ResponsiveContainer width="100%" height={115}>
              <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <Pie
                  data={attendanceChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={36}
                  outerRadius={50}
                  paddingAngle={totalAttendanceStudents > 0 ? 2 : 0}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {attendanceChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="position-absolute text-center" style={{ pointerEvents: 'none', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
              <div className="fw-bold text-sa-charcoal brand-font" style={{ fontSize: '18px', lineHeight: 1 }}>
                {totalAttendanceStudents}
              </div>
              <div className="text-sa-muted" style={{ fontSize: '10px', lineHeight: 1, marginTop: '2px' }}>
                Students
              </div>
            </div>
          </div>

          {/* Legend Table below Chart */}
          <div className="d-flex align-items-center justify-content-around pt-2 border-top flex-shrink-0" style={{ fontSize: '11.5px', borderColor: 'rgba(220, 38, 38, 0.08)' }}>
            {attendanceDonutData.map((item, idx) => (
              <div key={idx} className="d-flex align-items-center gap-1.5">
                <span className="rounded-circle d-inline-block flex-shrink-0" style={{ width: '8px', height: '8px', backgroundColor: item.color }} />
                <span className="text-sa-charcoal fw-medium">{item.name}:</span>
                <span className="fw-bold text-sa-charcoal">{item.value}</span>
                <span className="text-muted">({item.percentage})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: Quick Actions */}
        <div
          className="teacher-grid-card d-flex flex-column overflow-hidden"
          style={{ minHeight: '235px', padding: '16px 18px' }}
        >
          {/* Header */}
          <div className="d-flex align-items-center gap-2 pb-2 mb-2 border-bottom flex-shrink-0" style={{ borderColor: 'rgba(220, 38, 38, 0.08)' }}>
            <Zap size={16} style={{ color: '#8B1216' }} className="flex-shrink-0" />
            <h3 className="teacher-card-heading">
              Quick Actions
            </h3>
          </div>

          {/* Action Buttons */}
          <div className="d-flex flex-column justify-content-between flex-grow-1" style={{ gap: '8px' }}>
            {/* Action 1: Take Attendance */}
            <button
              onClick={() => navigate('/teacher/attendance')}
              className="btn teacher-action-card-btn w-100 text-start d-flex align-items-center justify-content-between border shadow-xs"
              style={{
                backgroundColor: '#FDF0F0',
                borderColor: 'rgba(220, 38, 38, 0.16)',
                height: '46px'
              }}
            >
              <div className="d-flex align-items-center gap-2.5 min-w-0">
                <div
                  className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ width: '32px', height: '32px', backgroundColor: 'rgba(139, 18, 22, 0.1)', color: '#8B1216' }}
                >
                  <Users size={16} />
                </div>
                <div className="min-w-0">
                  <span className="fw-bold d-block text-truncate" style={{ fontSize: '12.5px', color: '#8B1216', lineHeight: 1.2 }}>
                    Take Attendance
                  </span>
                  <span className="text-muted d-block text-truncate" style={{ fontSize: '10px', lineHeight: 1.1, marginTop: '1px' }}>
                    Mark student presence
                  </span>
                </div>
              </div>
              <ChevronRight size={15} style={{ color: '#8B1216' }} className="flex-shrink-0 ms-1" />
            </button>

            {/* Action 2: Enter Marks */}
            <button
              onClick={() => navigate('/teacher/marks')}
              className="btn teacher-action-card-btn w-100 text-start d-flex align-items-center justify-content-between border shadow-xs"
              style={{
                backgroundColor: '#FEF8EB',
                borderColor: 'rgba(245, 158, 11, 0.22)',
                height: '46px'
              }}
            >
              <div className="d-flex align-items-center gap-2.5 min-w-0">
                <div
                  className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ width: '32px', height: '32px', backgroundColor: 'rgba(217, 119, 24, 0.12)', color: '#D97718' }}
                >
                  <BarChart2 size={16} />
                </div>
                <div className="min-w-0">
                  <span className="fw-bold d-block text-truncate" style={{ fontSize: '12.5px', color: '#D97718', lineHeight: 1.2 }}>
                    Enter Marks
                  </span>
                  <span className="text-muted d-block text-truncate" style={{ fontSize: '10px', lineHeight: 1.1, marginTop: '1px' }}>
                    Exam & test grading
                  </span>
                </div>
              </div>
              <ChevronRight size={15} style={{ color: '#D97718' }} className="flex-shrink-0 ms-1" />
            </button>

            {/* Action 3: Upload Material */}
            <button
              onClick={() => navigate('/teacher/study-materials')}
              className="btn teacher-action-card-btn w-100 text-start d-flex align-items-center justify-content-between border shadow-xs"
              style={{
                backgroundColor: '#FDF0F0',
                borderColor: 'rgba(220, 38, 38, 0.16)',
                height: '46px'
              }}
            >
              <div className="d-flex align-items-center gap-2.5 min-w-0">
                <div
                  className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ width: '32px', height: '32px', backgroundColor: 'rgba(139, 18, 22, 0.1)', color: '#8B1216' }}
                >
                  <BookOpen size={16} />
                </div>
                <div className="min-w-0">
                  <span className="fw-bold d-block text-truncate" style={{ fontSize: '12.5px', color: '#8B1216', lineHeight: 1.2 }}>
                    Upload Material
                  </span>
                  <span className="text-muted d-block text-truncate" style={{ fontSize: '10px', lineHeight: 1.1, marginTop: '1px' }}>
                    Share notes & worksheets
                  </span>
                </div>
              </div>
              <ChevronRight size={15} style={{ color: '#8B1216' }} className="flex-shrink-0 ms-1" />
            </button>

            {/* Action 4: Books Stock & Handover */}
            <button
              onClick={() => navigate('/teacher/books-stock')}
              className="btn teacher-action-card-btn w-100 text-start d-flex align-items-center justify-content-between border shadow-xs"
              style={{
                backgroundColor: '#F0FDF4',
                borderColor: 'rgba(22, 101, 52, 0.16)',
                height: '46px'
              }}
            >
              <div className="d-flex align-items-center gap-2.5 min-w-0">
                <div
                  className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ width: '32px', height: '32px', backgroundColor: 'rgba(22, 101, 52, 0.1)', color: '#166534' }}
                >
                  <BookMarked size={16} />
                </div>
                <div className="min-w-0">
                  <span className="fw-bold d-block text-truncate" style={{ fontSize: '12.5px', color: '#166534', lineHeight: 1.2 }}>
                    Books Stock & Handover
                  </span>
                  <span className="text-muted d-block text-truncate" style={{ fontSize: '10px', lineHeight: 1.1, marginTop: '1px' }}>
                    Track inventory & handouts
                  </span>
                </div>
              </div>
              <ChevronRight size={15} style={{ color: '#166534' }} className="flex-shrink-0 ms-1" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. UPCOMING EXAMINATIONS & PENDING TASKS (2 EQUAL COLUMNS - ZERO OVERLAP) */}
      <div className="teacher-two-col-grid">
        {/* Card 1: Upcoming Examinations */}
        <div
          className="teacher-grid-card d-flex flex-column overflow-hidden"
          style={{ minHeight: '210px', padding: '14px 18px' }}
        >
          <div className="d-flex align-items-center justify-content-between pb-2 mb-1.5 border-bottom flex-shrink-0" style={{ borderColor: 'rgba(220, 38, 38, 0.08)' }}>
            <div className="d-flex align-items-center gap-2 min-w-0 flex-shrink-0">
              <FileText size={16} style={{ color: '#8B1216' }} className="flex-shrink-0" />
              <h4 className="teacher-card-heading">
                Upcoming Examinations
              </h4>
            </div>
            <button
              onClick={() => navigate('/teacher/exams')}
              className="btn btn-link p-0 text-decoration-none fw-semibold flex-shrink-0 ms-2"
              style={{ fontSize: '11.5px', whiteSpace: 'nowrap', color: '#8B1216' }}
            >
              View All &rarr;
            </button>
          </div>

          <div className="d-flex flex-column justify-content-between flex-grow-1" style={{ fontSize: '11.5px' }}>
            <div className="d-flex justify-content-between text-muted border-bottom pb-1" style={{ fontSize: '10.5px' }}>
              <span style={{ width: '22%' }}>Date</span>
              <span style={{ width: '48%' }}>Subject / Exam</span>
              <span className="text-end" style={{ width: '30%' }}>Batch</span>
            </div>
            {upcomingExams.length === 0 ? (
              <div className="d-flex flex-column align-items-center justify-content-center text-center py-4 flex-grow-1 text-sa-muted" style={{ fontSize: '11.5px' }}>
                <span>No scheduled examinations</span>
              </div>
            ) : (
              <div className="d-flex flex-column justify-content-around flex-grow-1 py-1" style={{ gap: '6px' }}>
                {upcomingExams.map((exam, idx) => (
                  <div
                    key={idx}
                    onClick={() => navigate('/teacher/exams')}
                    className="d-flex justify-content-between align-items-center py-1 cursor-pointer rounded px-1"
                    style={{ transition: 'background-color 0.15s ease' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.04)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    title={`${exam.title || exam.subject} - Click to view in Examinations`}
                  >
                    <span className="fw-bold text-truncate" style={{ fontSize: '11.5px', width: '22%', color: '#8B1216' }}>{exam.date}</span>
                    <span className="fw-semibold text-sa-charcoal text-truncate pe-2" style={{ fontSize: '12px', width: '48%' }}>{exam.subject}</span>
                    <span className="text-sa-muted text-end text-truncate" style={{ fontSize: '11.5px', width: '30%' }}>{exam.classBatch}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Pending Tasks */}
        <div
          className="teacher-grid-card d-flex flex-column overflow-hidden"
          style={{ minHeight: '210px', padding: '14px 18px' }}
        >
          <div className="d-flex align-items-center justify-content-between pb-2 mb-1.5 border-bottom flex-shrink-0" style={{ borderColor: 'rgba(220, 38, 38, 0.08)' }}>
            <div className="d-flex align-items-center gap-2 min-w-0 flex-shrink-0">
              <CheckSquare size={16} style={{ color: '#8B1216' }} className="flex-shrink-0" />
              <h4 className="teacher-card-heading">
                Pending Tasks
              </h4>
            </div>
            <button
              onClick={() => navigate('/teacher/marks')}
              className="btn btn-link p-0 text-decoration-none fw-semibold flex-shrink-0 ms-2"
              style={{ fontSize: '11.5px', whiteSpace: 'nowrap', color: '#8B1216' }}
            >
              View All &rarr;
            </button>
          </div>

          <div className="d-flex flex-column justify-content-around flex-grow-1" style={{ gap: '8px' }}>
            {tasks.map((task) => (
              <div
                key={task.id}
                className="d-flex align-items-center gap-2.5 cursor-pointer p-1 rounded"
                style={{ transition: 'background-color 0.15s ease' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.03)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                onClick={() => toggleTask(task.id)}
              >
                <div className="flex-shrink-0">
                  {task.completed ? (
                    <CheckSquare size={15} className="text-success" />
                  ) : (
                    <Square size={15} className="text-muted" />
                  )}
                </div>
                <div className="flex-grow-1 min-w-0 pe-2">
                  <div
                    className={`fw-semibold text-truncate ${task.completed ? 'text-decoration-line-through text-muted' : 'text-sa-charcoal'}`}
                    style={{ fontSize: '12px', lineHeight: 1.25 }}
                  >
                    {task.title}
                  </div>
                  <div className="text-muted text-truncate" style={{ fontSize: '11px', lineHeight: 1.2, marginTop: '2px' }}>
                    {task.subtext}
                  </div>
                </div>
                <span
                  className="badge flex-shrink-0 fw-medium rounded-pill ms-auto"
                  style={{
                    fontSize: '10px',
                    padding: '3px 8px',
                    backgroundColor: task.priority === 'High' ? '#FDF0F0' : '#FEF8EB',
                    color: task.priority === 'High' ? '#8B1216' : '#D97718'
                  }}
                >
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 6. RECENT ANNOUNCEMENTS & THIS MONTH'S HOURS (2 EQUAL COLUMNS - ZERO OVERLAP) */}
      <div className="teacher-two-col-grid">
        {/* Card 1: Recent Announcements */}
        <div
          className="teacher-grid-card d-flex flex-column overflow-hidden"
          style={{ minHeight: '210px', padding: '14px 18px' }}
        >
          <div className="d-flex align-items-center justify-content-between pb-2 mb-1.5 border-bottom flex-shrink-0" style={{ borderColor: 'rgba(220, 38, 38, 0.08)' }}>
            <div className="d-flex align-items-center gap-2 min-w-0 flex-shrink-0">
              <Megaphone size={16} style={{ color: '#8B1216' }} className="flex-shrink-0" />
              <h4 className="teacher-card-heading">
                Recent Announcements
              </h4>
            </div>
            <button
              onClick={() => navigate('/teacher/announcements')}
              className="btn btn-link p-0 text-decoration-none fw-semibold flex-shrink-0 ms-2"
              style={{ fontSize: '11.5px', whiteSpace: 'nowrap', color: '#8B1216' }}
            >
              View All &rarr;
            </button>
          </div>

          <div className="d-flex flex-column justify-content-around flex-grow-1" style={{ gap: '8px' }}>
            {recentAnnouncements.length === 0 ? (
              <div className="text-center py-4 text-sa-muted" style={{ fontSize: '11.5px' }}>
                No recent announcements
              </div>
            ) : (
              recentAnnouncements.map((item) => (
                <div key={item.id} className="d-flex align-items-start justify-content-between p-1 rounded" style={{ fontSize: '11.5px', gap: '8px' }}>
                  <div className="d-flex align-items-start gap-2 min-w-0">
                    <span className="rounded-circle flex-shrink-0 mt-1" style={{ width: '6px', height: '6px', backgroundColor: item.dotColor }} />
                    <span className="text-sa-charcoal fw-medium" style={{ fontSize: '12px', lineHeight: 1.35 }}>{item.title}</span>
                  </div>
                  <span className="text-muted flex-shrink-0 ps-2" style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>{item.date}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Card 2: This Month's Hours */}
        <div
          className="teacher-grid-card d-flex flex-column overflow-hidden"
          style={{ minHeight: '210px', padding: '14px 18px' }}
        >
          <div className="d-flex align-items-center justify-content-between pb-2 mb-1.5 border-bottom flex-shrink-0" style={{ borderColor: 'rgba(220, 38, 38, 0.08)' }}>
            <div className="d-flex align-items-center gap-2 min-w-0 flex-shrink-0">
              <Clock size={16} style={{ color: '#8B1216' }} className="flex-shrink-0" />
              <h4 className="teacher-card-heading">
                This Month's Hours
              </h4>
            </div>
            <button
              onClick={() => navigate('/teacher/working-time')}
              className="btn btn-link p-0 text-decoration-none fw-semibold flex-shrink-0 ms-2"
              style={{ fontSize: '11.5px', whiteSpace: 'nowrap', color: '#8B1216' }}
            >
              View Details &rarr;
            </button>
          </div>

          <div className="d-flex flex-column justify-content-between flex-grow-1 pt-1">
            {/* Progress Bar Section */}
            <div>
              <div className="d-flex align-items-baseline justify-content-between">
                <div>
                  <span className="brand-font fw-bold text-sa-charcoal" style={{ fontSize: '16px' }}>{totalWorkingHours}</span>
                  <span className="text-muted" style={{ fontSize: '11.5px' }}> / 160 hrs</span>
                </div>
                <span className="fw-bold" style={{ fontSize: '11.5px', color: '#168554' }}>
                  {Math.min(100, Math.round((parseFloat(totalWorkingHours) / 160) * 100))}%
                </span>
              </div>
              <div className="progress mt-1.5" style={{ height: '6px', backgroundColor: '#F1F5F9', borderRadius: '4px' }}>
                <div
                  className="progress-bar"
                  role="progressbar"
                  style={{
                    width: `${Math.min(100, Math.round((parseFloat(totalWorkingHours) / 160) * 100))}%`,
                    backgroundColor: '#8B1216',
                    borderRadius: '4px'
                  }}
                  aria-valuenow={Math.round((parseFloat(totalWorkingHours) / 160) * 100)}
                  aria-valuemin="0"
                  aria-valuemax="100"
                />
              </div>
            </div>

            {/* Estimated Pay Section */}
            <div
              className="rounded-3 d-flex align-items-center gap-2.5 mt-2"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.85)',
                border: '1px solid rgba(220, 38, 38, 0.12)',
                padding: '8px 12px'
              }}
            >
              <div
                className="sa-stat-icon-wrapper sa-stat-icon-amber rounded-circle flex-shrink-0 d-flex align-items-center justify-content-center"
                style={{ width: '32px', height: '32px' }}
              >
                <Coins size={16} />
              </div>
              <div className="flex-grow-1 min-w-0">
                <div className="d-flex align-items-center justify-content-between">
                  <div className="text-sa-muted" style={{ fontSize: '10.5px', lineHeight: 1.2 }}>
                    Pending / Est. Pay
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/teacher/salary');
                    }}
                    className="btn btn-link p-0 text-decoration-none fw-semibold"
                    style={{ fontSize: '10.5px', lineHeight: 1.2, color: '#8B1216' }}
                  >
                    View Salary &rarr;
                  </button>
                </div>
                <div className="brand-font fw-bold text-sa-charcoal mt-0.5" style={{ fontSize: '15px', lineHeight: 1.2 }}>
                  ₹{salaryDetails.pending.toLocaleString()}
                </div>
                <div className="text-sa-muted" style={{ fontSize: '10px', lineHeight: 1.2 }}>
                  Status: {salaryDetails.status}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
