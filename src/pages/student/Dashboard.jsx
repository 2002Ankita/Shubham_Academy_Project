import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  Calendar,
  Clock,
  TrendingUp,
  Users,
  FileText,
  Coins,
  BarChart3,
  Zap,
  BookOpen,
  Award,
  ChevronRight,
  ChevronDown,
  Download,
  Play,
  CreditCard,
  Bell,
  ArrowRight,
  Megaphone
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { toast } from 'react-toastify';

// Service Integrations
import studentService from '../../services/studentService';
import attendanceService from '../../services/attendanceService';
import feeService from '../../services/feeService';
import examService from '../../services/examService';
import marksService from '../../services/marksService';
import noticeService from '../../services/noticeService';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Data States
  const [student, setStudent] = useState(null);
  const [notices, setNotices] = useState([]);
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [fees, setFees] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('This Month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const studentId = user?.id || 'STU-001';

        const [
          studentData,
          noticesData,
          examsData,
          marksData,
          feesData,
          attendanceData
        ] = await Promise.allSettled([
          studentService.getById(studentId),
          noticeService.getAll(),
          examService.getAll(),
          marksService.getStudentResults(studentId),
          feeService.getAll(),
          attendanceService.getLogs()
        ]);

        if (studentData.status === 'fulfilled' && studentData.value) {
          setStudent(studentData.value);
        }
        if (noticesData.status === 'fulfilled' && Array.isArray(noticesData.value)) {
          setNotices(noticesData.value);
        }
        if (examsData.status === 'fulfilled' && Array.isArray(examsData.value)) {
          setExams(examsData.value);
        }
        if (marksData.status === 'fulfilled' && Array.isArray(marksData.value)) {
          setResults(marksData.value);
        }
        if (feesData.status === 'fulfilled' && Array.isArray(feesData.value)) {
          const studentFees = feesData.value.filter(
            f => f.studentId === studentId || f.rollNumber === user?.rollNumber
          );
          setFees(studentFees.length > 0 ? studentFees : feesData.value);
        }
        if (attendanceData.status === 'fulfilled' && Array.isArray(attendanceData.value)) {
          setAttendanceLogs(attendanceData.value);
        }
      } catch (err) {
        console.warn('Dashboard service loading fallback:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user]);

  // Derived Dynamic Greeting
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12 ? 'Good Morning' : currentHour < 17 ? 'Good Afternoon' : 'Good Evening';
  const studentFirstName = user?.name ? user.name.split(' ')[0] : 'Aarav';

  // Dynamic Date string matching reference format
  const formattedDate = new Date().toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  // 1. Dynamic Metric Calculations from Services
  const attendanceRate = student?.attendancePercent ?? 89.8;

  const scheduledExams = exams.filter(e => e.status === 'Scheduled' || !e.status);
  const upcomingExamsCount = scheduledExams.length > 0 ? scheduledExams.length : 3;

  const nextExamDaysRemaining = (() => {
    if (scheduledExams.length > 0 && scheduledExams[0].date) {
      const examDate = new Date(scheduledExams[0].date);
      const today = new Date();
      const diffTime = examDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 5;
    }
    return 5;
  })();

  const totalFeeAmount = fees.length > 0
    ? fees.reduce((acc, f) => acc + (Number(f.totalFees) || 0), 0)
    : 60000;
  const paidFeeAmount = fees.length > 0
    ? fees.reduce((acc, f) => acc + (Number(f.amountPaid) || 0), 0)
    : 47500;
  const pendingFeeAmount = fees.length > 0
    ? fees.reduce((acc, f) => acc + (Number(f.pendingAmount) || 0), 0)
    : 12500;

  const overallScore = (() => {
    if (results.length > 0) {
      const totalScore = results.reduce((acc, r) => acc + (Number(r.percentage) || 0), 0);
      return (totalScore / results.length).toFixed(1);
    }
    return '82.4';
  })();

  // 2. Donut Chart Breakdown (Attendance Overview)
  const totalDays = 186;
  const presentDays = Math.round((attendanceRate / 100) * totalDays);
  const absentDays = Math.round((9.7 / 100) * totalDays);
  const lateDays = Math.max(0, totalDays - presentDays - absentDays);

  const donutData = [
    { name: 'Present', value: presentDays, color: '#A91D22' },
    { name: 'Absent', value: absentDays, color: '#F5A900' },
    { name: 'Late', value: lateDays, color: '#FCA5A5' }
  ];

  // 3. Today's Classes List
  const todaysClasses = [
    {
      time: '8:00 AM',
      subject: 'Mathematics',
      teacher: 'Ms. Neha Verma',
      room: 'Room 101',
      status: 'Ongoing',
      isOngoing: true
    },
    {
      time: '10:00 AM',
      subject: 'Physics',
      teacher: 'Mr. Rohit Mehta',
      room: 'Room 102',
      status: 'Upcoming',
      isOngoing: false
    },
    {
      time: '12:00 PM',
      subject: 'Chemistry',
      teacher: 'Dr. Anjali Rao',
      room: 'Room 201',
      status: 'Upcoming',
      isOngoing: false
    },
    {
      time: '2:00 PM',
      subject: 'English',
      teacher: 'Ms. Kavita Singh',
      room: 'Room 103',
      status: 'Upcoming',
      isOngoing: false
    }
  ];

  // 4. Upcoming Examinations List
  const upcomingExaminations = [
    {
      date: '31 May 2025',
      subject: 'Mathematics',
      class: 'Class 10 (A)',
      countdown: '5 days'
    },
    {
      date: '4 Jun 2025',
      subject: 'Physics',
      class: 'Class 10 (A)',
      countdown: '9 days'
    },
    {
      date: '10 Jun 2025',
      subject: 'Chemistry',
      class: 'Class 10 (A)',
      countdown: '15 days'
    }
  ];

  // 5. Recent Results List
  const recentResultsList = results.length > 0
    ? results.slice(0, 4).map(r => ({
        subject: `${r.subject} (${r.examTitle || 'Unit Test'})`,
        marks: `${r.obtainedMarks} / ${r.maxMarks}`,
        grade: r.grade || 'A'
      }))
    : [
        { subject: 'Science (Unit Test)', marks: '85 / 100', grade: 'A' },
        { subject: 'Mathematics (Unit Test)', marks: '78 / 100', grade: 'B+' },
        { subject: 'English (Unit Test)', marks: '82 / 100', grade: 'A' },
        { subject: 'Social Science (Unit Test)', marks: '76 / 100', grade: 'B+' }
      ];

  // 6. Study Materials List
  const studyMaterialsList = [
    {
      id: 'mat-01',
      title: 'Class 10 - Science Notes (Ch 1-3)',
      uploadDate: '24 May 2025',
      fileName: 'Science_Notes_Ch1-3.pdf'
    },
    {
      id: 'mat-02',
      title: 'Mathematics Formulas Sheet',
      uploadDate: '22 May 2025',
      fileName: 'Math_Formula_CheatSheet.pdf'
    },
    {
      id: 'mat-03',
      title: 'English Practice Questions',
      uploadDate: '20 May 2025',
      fileName: 'English_Practice_Bank.pdf'
    }
  ];

  // 7. Announcements List
  const announcementsList = notices.length > 0
    ? notices.slice(0, 3).map(n => ({
        title: n.title,
        date: n.publishedDate || '25 May 2025'
      }))
    : [
        { title: 'Unit Test Schedule Released', date: '25 May 2025' },
        { title: 'Library Hours Extended', date: '24 May 2025' },
        { title: 'Career Guidance Session', date: '22 May 2025' }
      ];

  const handleDownloadMaterial = (title) => {
    toast.success(`Downloading "${title}"...`);
  };

  const handlePayNow = () => {
    navigate('/student/fees');
  };

  return (
    <div className="d-flex flex-column gap-3 pb-3">
      {/* ========================================================================= */}
      {/* 1. TOP WELCOME SECTION                                                    */}
      {/* ========================================================================= */}
      <div className="d-flex flex-column flex-lg-row align-items-start align-items-lg-center justify-content-between gap-3 pt-0">
        <div>
          <h2 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-3">
            {greeting}, {studentFirstName}!
          </h2>
          <p className="text-sa-muted small mb-0 mt-1" style={{ fontSize: '0.88rem' }}>
            Keep learning—your progress looks great.
          </p>
        </div>

        <div className="d-flex flex-wrap align-items-center gap-3">
          {/* Date Picker Badge */}
          <div
            className="d-flex align-items-center gap-2 px-3 py-1.5 bg-white rounded-3 border shadow-xs"
            style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--sa-charcoal)' }}
          >
            <Calendar size={15} className="text-sa-primary" />
            <span>{formattedDate}</span>
            <ChevronDown size={13} className="text-muted ms-1" />
          </div>

          {/* Motivational Quote with yellow underline */}
          <div
            className="d-none d-sm-flex flex-column justify-content-center px-3 py-1.5 bg-white rounded-3 border shadow-xs text-center"
            style={{ minHeight: '40px' }}
          >
            <span
              className="text-sa-charcoal fst-italic"
              style={{ fontSize: '0.76rem', fontWeight: 500 }}
            >
              "A little progress each day adds up to big results."
            </span>
            <div
              className="mt-1 mx-auto rounded-pill"
              style={{
                width: '36px',
                height: '2px',
                backgroundColor: 'var(--sa-mustard-yellow)'
              }}
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TOP 4 KPI CARDS (Attendance, Upcoming Exams, Pending Fees, Overall Score) */}
      {/* ========================================================================= */}
      <div className="row g-3">
        {/* KPI 1: Attendance */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="sa-card p-3 h-100 d-flex align-items-center">
            <div className="d-flex align-items-center gap-3 w-100">
              <div
                className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: '48px', height: '48px', backgroundColor: '#EAF7EE', color: '#10B981' }}
              >
                <Users size={24} />
              </div>
              <div className="d-flex flex-column min-w-0">
                <span className="text-sa-muted small fw-semibold lh-1 mb-1" style={{ fontSize: '0.8rem' }}>
                  Attendance
                </span>
                <div className="kpi-number text-kpi-green">
                  {attendanceRate}%
                </div>
                <span className="kpi-subtitle text-success">
                  <TrendingUp size={12} /> +5.2% from last month
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* KPI 2: Upcoming Exams */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="sa-card p-3 h-100 d-flex align-items-center">
            <div className="d-flex align-items-center gap-3 w-100">
              <div
                className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: '48px', height: '48px', backgroundColor: '#FDF1F1', color: '#A91D22' }}
              >
                <FileText size={24} />
              </div>
              <div className="d-flex flex-column min-w-0">
                <span className="text-sa-muted small fw-semibold lh-1 mb-1" style={{ fontSize: '0.8rem' }}>
                  Upcoming Exams
                </span>
                <div className="kpi-number text-kpi-red">
                  {upcomingExamsCount}
                </div>
                <span className="kpi-subtitle text-sa-primary">
                  <Calendar size={12} /> Next in {nextExamDaysRemaining} days
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* KPI 3: Pending Fees */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="sa-card p-3 h-100 d-flex align-items-center">
            <div className="d-flex align-items-center gap-3 w-100">
              <div
                className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: '48px', height: '48px', backgroundColor: '#FEF8EC', color: '#D97706' }}
              >
                <Coins size={24} />
              </div>
              <div className="d-flex flex-column min-w-0">
                <span className="text-sa-muted small fw-semibold lh-1 mb-1" style={{ fontSize: '0.8rem' }}>
                  Pending Fees
                </span>
                <div className="kpi-number text-kpi-orange">
                  ₹{Number(pendingFeeAmount).toLocaleString('en-IN')}
                </div>
                <span className="kpi-subtitle text-kpi-orange">
                  <Clock size={12} /> Due by 10 Jun 2025
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* KPI 4: Overall Score */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="sa-card p-3 h-100 d-flex align-items-center">
            <div className="d-flex align-items-center gap-3 w-100">
              <div
                className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: '48px', height: '48px', backgroundColor: '#FDF1F1', color: '#A91D22' }}
              >
                <BarChart3 size={24} />
              </div>
              <div className="d-flex flex-column min-w-0">
                <span className="text-sa-muted small fw-semibold lh-1 mb-1" style={{ fontSize: '0.8rem' }}>
                  Overall Score
                </span>
                <div className="kpi-number text-kpi-red">
                  {overallScore}%
                </div>
                <span className="kpi-subtitle text-success">
                  <TrendingUp size={12} /> +6.8% from last term
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MIDDLE SECTION (Today's Classes, Attendance Overview, Quick Actions)     */}
      {/* ========================================================================= */}
      <div className="row g-3">
        {/* Panel 1: Today's Classes (~50% width) */}
        <div className="col-12 col-xl-6">
          <div className="sa-card p-3 h-100 d-flex flex-column">
            <div className="sa-section-header mb-2">
              <h5 className="sa-section-title">
                <Calendar size={18} className="text-sa-primary" />
                <span>Today's Classes</span>
              </h5>
              <button
                type="button"
                className="btn btn-link p-0 sa-link-more"
                onClick={() => navigate('/student/classes')}
              >
                <span>View Full Timetable</span>
                <ArrowRight size={13} />
              </button>
            </div>

            <div className="table-responsive flex-grow-1">
              <table className="table align-middle table-borderless m-0">
                <thead>
                  <tr className="sa-table-header-row">
                    <th className="rounded-start">Time</th>
                    <th>Subject</th>
                    <th>Teacher</th>
                    <th>Room</th>
                    <th>Status</th>
                    <th className="text-end rounded-end">Action</th>
                  </tr>
                </thead>
                <tbody className="sa-table-compact">
                  {todaysClasses.map((cls, idx) => (
                    <tr key={idx} className="border-bottom border-light">
                      <td className="fw-bold text-sa-charcoal">{cls.time}</td>
                      <td className="fw-semibold text-sa-charcoal">{cls.subject}</td>
                      <td className="text-sa-muted">{cls.teacher}</td>
                      <td className="text-sa-muted">{cls.room}</td>
                      <td>
                        <span className={cls.isOngoing ? 'badge-status-ongoing' : 'badge-status-upcoming'}>
                          {cls.status}
                        </span>
                      </td>
                      <td className="text-end">
                        {cls.isOngoing ? (
                          <button
                            type="button"
                            className="btn-view-class-ongoing"
                            onClick={() => navigate('/student/classes')}
                          >
                            <Play size={9} fill="currentColor" />
                            <span>View Class</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn-action-view-soft"
                            onClick={() => navigate('/student/classes')}
                          >
                            View
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Panel 2: Attendance Overview Donut Chart (~27% width) */}
        <div className="col-12 col-lg-6 col-xl-3">
          <div className="sa-card p-3 h-100 d-flex flex-column">
            <div className="sa-section-header mb-1">
              <h5 className="sa-section-title">
                <BarChart3 size={18} className="text-sa-primary" />
                <span>Attendance Overview</span>
              </h5>
              <div className="dropdown">
                <button
                  className="btn btn-sm btn-light border py-1 px-2 d-flex align-items-center gap-1 rounded-2"
                  style={{ fontSize: '0.74rem', fontWeight: 600 }}
                  type="button"
                >
                  <span>{selectedMonth}</span>
                  <ChevronDown size={12} />
                </button>
              </div>
            </div>

            {/* Donut Chart Container */}
            <div className="position-relative d-flex justify-content-center align-items-center my-0" style={{ height: '135px' }}>
              <ResponsiveContainer width="100%" height={135}>
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={60}
                    paddingAngle={2}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val, name) => [`${val} Days`, name]}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      fontSize: '11px',
                      padding: '4px 8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Total Days in center */}
              <div
                className="position-absolute top-50 start-50 translate-middle text-center"
                style={{ pointerEvents: 'none' }}
              >
                <span className="brand-font fw-extrabold text-sa-charcoal fs-4 m-0 d-block lh-1">
                  {totalDays}
                </span>
                <span className="text-sa-muted" style={{ fontSize: '0.66rem', fontWeight: 600 }}>
                  Total Days
                </span>
              </div>
            </div>

            {/* Attendance Legend matching reference layout */}
            <div className="d-flex flex-column gap-1 pt-1 pb-2" style={{ fontSize: '0.76rem' }}>
              <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2">
                  <span
                    className="rounded-circle"
                    style={{ width: '8px', height: '8px', backgroundColor: '#A91D22' }}
                  />
                  <span className="text-sa-charcoal fw-medium">Present</span>
                </div>
                <div className="d-flex align-items-center gap-3">
                  <span className="fw-bold text-sa-charcoal">{presentDays}</span>
                  <span className="text-sa-muted" style={{ minWidth: '38px', textAlign: 'right' }}>
                    {attendanceRate}%
                  </span>
                </div>
              </div>

              <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2">
                  <span
                    className="rounded-circle"
                    style={{ width: '8px', height: '8px', backgroundColor: '#F5A900' }}
                  />
                  <span className="text-sa-charcoal fw-medium">Absent</span>
                </div>
                <div className="d-flex align-items-center gap-3">
                  <span className="fw-bold text-sa-charcoal">{absentDays}</span>
                  <span className="text-sa-muted" style={{ minWidth: '38px', textAlign: 'right' }}>
                    9.7%
                  </span>
                </div>
              </div>

              <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2">
                  <span
                    className="rounded-circle"
                    style={{ width: '8px', height: '8px', backgroundColor: '#FCA5A5' }}
                  />
                  <span className="text-sa-charcoal fw-medium">Late</span>
                </div>
                <div className="d-flex align-items-center gap-3">
                  <span className="fw-bold text-sa-charcoal">{lateDays}</span>
                  <span className="text-sa-muted" style={{ minWidth: '38px', textAlign: 'right' }}>
                    3.2%
                  </span>
                </div>
              </div>
            </div>

            {/* Target Progress Bar */}
            <div className="pt-2 border-top mt-auto">
              <div className="d-flex align-items-center justify-content-between mb-1">
                <span className="text-sa-muted small fw-semibold" style={{ fontSize: '0.73rem' }}>
                  Attendance Target (90%)
                </span>
                <span className="fw-bold text-success" style={{ fontSize: '0.76rem' }}>
                  {attendanceRate}%
                </span>
              </div>
              <div className="progress" style={{ height: '6px', backgroundColor: '#EEF2F6', borderRadius: '9999px' }}>
                <div
                  className="progress-bar rounded-pill"
                  role="progressbar"
                  style={{ width: `${Math.min(100, attendanceRate)}%`, backgroundColor: '#10B981' }}
                  aria-valuenow={attendanceRate}
                  aria-valuemin="0"
                  aria-valuemax="100"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Panel 3: Quick Actions (~23% width) */}
        <div className="col-12 col-lg-6 col-xl-3">
          <div className="sa-card p-3 h-100 d-flex flex-column">
            <div className="sa-section-header mb-2">
              <h5 className="sa-section-title">
                <Zap size={18} className="text-sa-primary" />
                <span>Quick Actions</span>
              </h5>
            </div>

            <div className="d-flex flex-column gap-2.5 flex-grow-1 justify-content-between">
              {/* Card 1: View Timetable (Soft Pink/Red) */}
              <button
                type="button"
                className="sa-qa-red w-100 d-flex align-items-center justify-content-between border-0 shadow-xs text-start"
                style={{ padding: '0.75rem 0.9rem' }}
                onClick={() => navigate('/student/classes')}
              >
                <div className="d-flex align-items-center gap-2.5">
                  <div
                    className="rounded-2 bg-white d-flex align-items-center justify-content-center shadow-xs flex-shrink-0"
                    style={{ width: '34px', height: '34px' }}
                  >
                    <Calendar size={17} className="text-sa-primary" />
                  </div>
                  <span className="fw-bold text-sa-charcoal" style={{ fontSize: '0.88rem' }}>
                    View Timetable
                  </span>
                </div>
                <ChevronRight size={17} className="text-sa-primary" />
              </button>

              {/* Card 2: Download Notes (Soft Yellow/Cream) */}
              <button
                type="button"
                className="sa-qa-amber w-100 d-flex align-items-center justify-content-between border-0 shadow-xs text-start"
                style={{ padding: '0.75rem 0.9rem' }}
                onClick={() => navigate('/student/study-materials')}
              >
                <div className="d-flex align-items-center gap-2.5">
                  <div
                    className="rounded-2 bg-white d-flex align-items-center justify-content-center shadow-xs flex-shrink-0"
                    style={{ width: '34px', height: '34px' }}
                  >
                    <BookOpen size={17} style={{ color: '#D97706' }} />
                  </div>
                  <span className="fw-bold text-sa-charcoal" style={{ fontSize: '0.88rem' }}>
                    Download Notes
                  </span>
                </div>
                <ChevronRight size={17} style={{ color: '#D97706' }} />
              </button>

              {/* Card 3: View Results (Soft Pink/Red) */}
              <button
                type="button"
                className="sa-qa-red w-100 d-flex align-items-center justify-content-between border-0 shadow-xs text-start"
                style={{ padding: '0.75rem 0.9rem' }}
                onClick={() => navigate('/student/results')}
              >
                <div className="d-flex align-items-center gap-2.5">
                  <div
                    className="rounded-2 bg-white d-flex align-items-center justify-content-center shadow-xs flex-shrink-0"
                    style={{ width: '34px', height: '34px' }}
                  >
                    <BarChart3 size={17} className="text-sa-primary" />
                  </div>
                  <span className="fw-bold text-sa-charcoal" style={{ fontSize: '0.88rem' }}>
                    View Results
                  </span>
                </div>
                <ChevronRight size={17} className="text-sa-primary" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. BOTTOM SECTION (4 Columns: Exams, Results, Study Materials, Fees & Notices) */}
      {/* ========================================================================= */}
      <div className="row g-3">
        {/* Card 1: Upcoming Examinations */}
        <div className="col-12 col-md-6 col-xl-3">
          <div className="sa-card p-3 h-100 d-flex flex-column">
            <div className="sa-section-header mb-2">
              <h6 className="sa-section-title">
                <FileText size={17} className="text-sa-primary" />
                <span>Upcoming Examinations</span>
              </h6>
              <button
                type="button"
                className="btn btn-link p-0 sa-link-more"
                onClick={() => navigate('/student/exams')}
              >
                <span>View All</span>
                <ArrowRight size={12} />
              </button>
            </div>

            <div className="table-responsive flex-grow-1">
              <table className="table table-borderless m-0 align-middle">
                <thead>
                  <tr className="sa-table-header-row">
                    <th className="rounded-start">Date</th>
                    <th>Subject</th>
                    <th>Class</th>
                    <th className="text-end rounded-end">Countdown</th>
                  </tr>
                </thead>
                <tbody className="sa-table-compact">
                  {upcomingExaminations.map((ex, i) => (
                    <tr key={i} className="border-bottom border-light">
                      <td className="fw-bold text-sa-charcoal">{ex.date}</td>
                      <td className="text-sa-charcoal fw-semibold">{ex.subject}</td>
                      <td className="text-sa-muted">{ex.class}</td>
                      <td className="text-end">
                        <span className="badge-countdown-pill">{ex.countdown}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Card 2: Recent Results */}
        <div className="col-12 col-md-6 col-xl-3">
          <div className="sa-card p-3 h-100 d-flex flex-column">
            <div className="sa-section-header mb-2">
              <h6 className="sa-section-title">
                <BarChart3 size={17} className="text-sa-primary" />
                <span>Recent Results</span>
              </h6>
              <button
                type="button"
                className="btn btn-link p-0 sa-link-more"
                onClick={() => navigate('/student/results')}
              >
                <span>View All</span>
                <ArrowRight size={12} />
              </button>
            </div>

            <div className="table-responsive flex-grow-1">
              <table className="table table-borderless m-0 align-middle">
                <thead>
                  <tr className="sa-table-header-row">
                    <th className="rounded-start">Subject</th>
                    <th className="text-center">Marks</th>
                    <th className="text-end rounded-end">Grade</th>
                  </tr>
                </thead>
                <tbody className="sa-table-compact">
                  {recentResultsList.map((res, i) => (
                    <tr key={i} className="border-bottom border-light">
                      <td className="fw-semibold text-sa-charcoal">{res.subject}</td>
                      <td className="text-center fw-bold text-sa-charcoal">{res.marks}</td>
                      <td className="text-end">
                        <span className={res.grade.includes('A') ? 'badge-grade-a' : 'badge-grade-b'}>
                          {res.grade}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Card 3: Study Materials */}
        <div className="col-12 col-md-6 col-xl-3">
          <div className="sa-card p-3 h-100 d-flex flex-column">
            <div className="sa-section-header mb-2">
              <h6 className="sa-section-title">
                <BookOpen size={17} className="text-sa-primary" />
                <span>Study Materials</span>
              </h6>
              <button
                type="button"
                className="btn btn-link p-0 sa-link-more"
                onClick={() => navigate('/student/study-materials')}
              >
                <span>View All</span>
                <ArrowRight size={12} />
              </button>
            </div>

            <div className="table-responsive flex-grow-1">
              <table className="table table-borderless m-0 align-middle">
                <thead>
                  <tr className="sa-table-header-row">
                    <th className="rounded-start">Title</th>
                    <th>Upload Date</th>
                    <th className="text-end rounded-end">Action</th>
                  </tr>
                </thead>
                <tbody className="sa-table-compact">
                  {studyMaterialsList.map((mat) => (
                    <tr key={mat.id} className="border-bottom border-light">
                      <td className="fw-semibold text-sa-charcoal" style={{ maxWidth: '130px' }}>
                        <span className="text-truncate d-block" title={mat.title}>
                          {mat.title}
                        </span>
                      </td>
                      <td className="text-sa-muted">{mat.uploadDate}</td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn-download-pink"
                          onClick={() => handleDownloadMaterial(mat.title)}
                        >
                          Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Card 4: Fee Summary & Announcements */}
        <div className="col-12 col-md-6 col-xl-3 d-flex flex-column gap-3">
          {/* Sub-Card A: Fee Summary */}
          <div className="sa-card p-3">
            <div className="sa-section-header mb-2">
              <h6 className="sa-section-title">
                <CreditCard size={17} className="text-sa-primary" />
                <span>Fee Summary</span>
              </h6>
              <button
                type="button"
                className="btn btn-link p-0 sa-link-more"
                onClick={() => navigate('/student/fees')}
              >
                <span>View Details</span>
                <ArrowRight size={12} />
              </button>
            </div>

            {/* Fee Stats 3-column block */}
            <div className="d-flex justify-content-between text-center py-2 mb-2 border-top border-bottom border-light">
              <div className="text-start">
                <span className="text-sa-muted d-block" style={{ fontSize: '0.68rem' }}>Total Fee</span>
                <strong className="text-sa-charcoal" style={{ fontSize: '0.86rem' }}>
                  ₹{Number(totalFeeAmount).toLocaleString('en-IN')}
                </strong>
              </div>
              <div>
                <span className="text-sa-muted d-block" style={{ fontSize: '0.68rem' }}>Paid</span>
                <strong className="text-success" style={{ fontSize: '0.86rem' }}>
                  ₹{Number(paidFeeAmount).toLocaleString('en-IN')}
                </strong>
              </div>
              <div className="text-end">
                <span className="text-sa-muted d-block" style={{ fontSize: '0.68rem' }}>Pending</span>
                <strong className="text-sa-primary" style={{ fontSize: '0.86rem' }}>
                  ₹{Number(pendingFeeAmount).toLocaleString('en-IN')}
                </strong>
              </div>
            </div>

            {/* Pay Now Button */}
            <button
              type="button"
              className="btn-pay-now"
              onClick={handlePayNow}
            >
              Pay Now
            </button>
          </div>

          {/* Sub-Card B: Announcements */}
          <div className="sa-card p-3 flex-grow-1">
            <div className="sa-section-header mb-2">
              <h6 className="sa-section-title">
                <Megaphone size={17} className="text-sa-primary" />
                <span>Announcements</span>
              </h6>
              <button
                type="button"
                className="btn btn-link p-0 sa-link-more"
                onClick={() => navigate('/student/announcements')}
              >
                <span>View All</span>
                <ArrowRight size={12} />
              </button>
            </div>

            <div className="d-flex flex-column gap-2" style={{ fontSize: '0.78rem' }}>
              {announcementsList.map((ann, idx) => (
                <div key={idx} className="d-flex align-items-center justify-content-between gap-2 py-0.5">
                  <div className="d-flex align-items-center gap-2 overflow-hidden">
                    <span
                      className="rounded-circle flex-shrink-0"
                      style={{ width: '6px', height: '6px', backgroundColor: 'var(--sa-mustard-yellow)' }}
                    />
                    <span className="text-sa-charcoal fw-semibold text-truncate" title={ann.title}>
                      {ann.title}
                    </span>
                  </div>
                  <span className="text-sa-muted flex-shrink-0" style={{ fontSize: '0.72rem' }}>
                    {ann.date}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
