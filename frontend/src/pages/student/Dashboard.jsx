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
import batchService from '../../services/batchService';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Data States
  const [student, setStudent] = useState(null);
  const [notices, setNotices] = useState([]);
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [fees, setFees] = useState([]);
  const [feeDetails, setFeeDetails] = useState({ total_fees: 0, amount_paid: 0, pending_fees: 0 });
  const [todaysClasses, setTodaysClasses] = useState([]);
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
          attendanceData,
          detailsData,
          batchesDataRes
        ] = await Promise.allSettled([
          studentService.getById(studentId),
          noticeService.getAll(),
          examService.getAll(),
          marksService.getStudentResults(studentId),
          feeService.getAll(),
          attendanceService.getLogs(),
          feeService.getFeeDetails(studentId),
          batchService.getBatches()
        ]);

        if (studentData.status === 'fulfilled' && studentData.value) {
          setStudent(studentData.value);
        }
        if (noticesData.status === 'fulfilled' && Array.isArray(noticesData.value)) {
          setNotices(noticesData.value);
        }
        if (examsData.status === 'fulfilled' && Array.isArray(examsData.value)) {
          const stu = studentData.status === 'fulfilled' ? studentData.value : null;
          const sBatch = (stu?.batch || '').toLowerCase();
          const sStream = sBatch.split(' ')[1] || '';
          
          const filteredExams = examsData.value.filter(e => {
            const subj = (e.subject || e.title || '').toLowerCase();
            let hasSubjectCheck = false;
            let subjectMatched = false;
            
            if (subj.includes('physics')) { hasSubjectCheck = true; if (sStream.includes('p')) subjectMatched = true; }
            if (subj.includes('chemistry')) { hasSubjectCheck = true; if (sStream.includes('c')) subjectMatched = true; }
            if (subj.includes('math')) { hasSubjectCheck = true; if (sStream.includes('m')) subjectMatched = true; }
            if (subj.includes('biology') || subj.includes('bio')) { hasSubjectCheck = true; if (sStream.includes('b')) subjectMatched = true; }
            
            if (hasSubjectCheck && sStream) return subjectMatched;
            return true;
          });
          setExams(filteredExams);
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
        
        if (detailsData?.status === 'fulfilled' && detailsData.value) {
           setFeeDetails(detailsData.value);
        }
        if (batchesDataRes?.status === 'fulfilled' && Array.isArray(batchesDataRes.value)) {
           const stu = studentData.status === 'fulfilled' ? studentData.value : null;
           if (stu) {
              const isMatch = (b, stu) => {
                 const bName = (b.name || '').toLowerCase();
                 const bStd = (b.standard || '').toLowerCase();
                 const sBatch = (stu.batch || '').toLowerCase();
                 const sStd = (stu.standard || '').toLowerCase();
                 const subj = (b.subject || '').toLowerCase();
                 
                 if (bName === sBatch && bName !== '') return true;
                 
                 const bStdPrefix = (bName.split(' ')[0] || bStd.split(' ')[0] || '').replace(/\s+/g, '').replace('th','').replace('st','').replace('nd','').replace('rd','');
                 const sStdPrefix = (sBatch.split(' ')[0] || sStd.split(' ')[0] || '').replace(/\s+/g, '').replace('th','').replace('st','').replace('nd','').replace('rd','');
                 const sStream = sBatch.split(' ')[1] || '';
                 
                 if (bStdPrefix === sStdPrefix && sStream) {
                    let subjectMatched = false;
                    let hasSubjectCheck = false;
                    
                    if (subj.includes('physics')) { hasSubjectCheck = true; if (sStream.includes('p')) subjectMatched = true; }
                    if (subj.includes('chemistry')) { hasSubjectCheck = true; if (sStream.includes('c')) subjectMatched = true; }
                    if (subj.includes('math')) { hasSubjectCheck = true; if (sStream.includes('m')) subjectMatched = true; }
                    if (subj.includes('biology')) { hasSubjectCheck = true; if (sStream.includes('b')) subjectMatched = true; }
                    
                    if (hasSubjectCheck) return subjectMatched;
                    
                    if (sStream.includes('pcmb') && (bName.includes('pcm') || bName.includes('pcb'))) return true;
                    if (bName.includes('pcmb') && (sStream.includes('pcm') || sStream.includes('pcb'))) return true;
                 }
                 
                 if (bStd === sStd && bStd !== '' && !bName.includes('pcm') && !bName.includes('pcb')) return true;
                 return false;
              };
              const matchedBatches = batchesDataRes.value.filter(b => isMatch(b, stu));
               setTodaysClasses(matchedBatches.map(b => ({
                 id: b.id || Math.random().toString(),
                 time: b.time || '10:00 AM',
                 date: b.date || '',
                 subject: b.subject,
                 teacher: b.teacher_name,
                 room: b.room || 'N/A',
                 status: 'Scheduled',
                 isOngoing: false
              })));
           }
        }
      } catch (err) {
        console.warn('Dashboard service loading fallback:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user]);

  // Derived Dynamic Greeting & Student Name
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12 ? 'Good Morning' : currentHour < 17 ? 'Good Afternoon' : 'Good Evening';
  const studentFullName = user?.full_name || user?.name || student?.name || 'Student';
  const studentFirstName = studentFullName.split(' ')[0] || 'Student';

  // Dynamic Date string matching reference format
  const formattedDate = new Date().toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  // 1. Dynamic Metric Calculations from Services
  const attendanceRate = student?.attendancePercent ?? 0;

  const scheduledExams = exams.filter(e => e.status === 'Scheduled' || !e.status);
  const upcomingExamsCount = scheduledExams.length > 0 ? scheduledExams.length : 0;

  const nextExamDaysRemaining = (() => {
    if (scheduledExams.length > 0 && scheduledExams[0].date) {
      const examDate = new Date(scheduledExams[0].date);
      const today = new Date();
      const diffTime = examDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 0;
    }
    return 0;
  })();

  const totalFeeAmount = feeDetails.total_fees || 0;
  const paidFeeAmount = feeDetails.amount_paid || 0;
  const pendingFeeAmount = feeDetails.pending_fees || 0;

  const overallScore = (() => {
    if (results.length > 0) {
      const totalScore = results.reduce((acc, r) => acc + (Number(r.percentage) || 0), 0);
      return (totalScore / results.length).toFixed(1);
    }
    return '0';
  })();

  // 2. Donut Chart Breakdown (Attendance Overview)
  const totalDays = 0;
  const presentDays = 0;
  const absentDays = 0;
  const lateDays = 0;

  const donutData = [
    { name: 'Present', value: presentDays, color: '#A91D22' },
    { name: 'Absent', value: absentDays, color: '#F5A900' },
    { name: 'Late', value: lateDays, color: '#FCA5A5' }
  ];

  // 3. Today's Classes List
  // dynamically populated via setTodaysClasses

  // 4. Upcoming Examinations List
  const upcomingExaminations = scheduledExams.slice(0, 5).map(e => {
    const examDate = new Date(e.exam_date || e.date);
    const diffDays = Math.ceil((examDate - new Date()) / (1000 * 60 * 60 * 24));
    return {
      date: examDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      subject: e.subject || e.exam_name,
      class: e.standard || 'All',
      countdown: diffDays > 0 ? `${diffDays} Days` : diffDays === 0 ? 'Today' : 'Passed'
    };
  });



  return (
    <div className="d-flex flex-column gap-3 pb-3">
      {/* ========================================================================= */}
      {/* 1. TOP WELCOME SECTION WITH DYNAMIC GREETING                              */}
      {/* ========================================================================= */}
      <div
        className="bg-white rounded-4 border overflow-hidden shadow-xs"
        style={{
          borderRadius: '18px',
          boxShadow: '0 2px 14px rgba(0, 0, 0, 0.04)',
          borderColor: 'rgba(0, 0, 0, 0.08)'
        }}
      >
        <div className="row g-0 align-items-center">
          <div className="col-12 col-md-6 col-lg-6 p-4 ps-md-4 ps-xl-5 py-md-4">
            <h1
              className="fw-bold brand-font text-sa-charcoal m-0"
              style={{ fontSize: '1.85rem', letterSpacing: '-0.01em', lineHeight: 1.25 }}
            >
              {greeting}, {studentFirstName}!
            </h1>
            <p
              className="text-sa-charcoal text-opacity-75 m-0 mt-2"
              style={{ fontSize: '0.95rem', fontWeight: 400 }}
            >
              Keep learning—your progress looks great.
            </p>
          </div>
          <div className="col-12 col-md-6 col-lg-6 d-flex justify-content-end align-items-end pe-0 pe-md-2 pe-xl-3 overflow-hidden">
            <img
              src="/assets/superadminhero.png"
              alt="Shubham Academy Celebration"
              className="img-fluid"
              style={{
                maxHeight: '160px',
                width: 'auto',
                objectFit: 'contain',
                objectPosition: 'bottom right'
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
        {/* Panel 1: Upcoming Examinations (~50% width) */}
        <div className="col-12 col-xl-6">
          <div className="d-flex flex-column gap-3 h-100">
            <div className="sa-card p-3 d-flex flex-column flex-grow-1">
              <div className="sa-section-header mb-2">
                <h5 className="sa-section-title">
                  <BookOpen size={18} className="text-sa-primary" />
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
                      <th className="rounded-start">Time / Date</th>
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
                        <td className="text-sa-charcoal">
                          <div className="fw-bold">{cls.time}</div>
                          {cls.date && <div className="text-sa-muted" style={{ fontSize: '0.75rem' }}>{cls.date}</div>}
                        </td>
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

            <div className="sa-card p-3 d-flex flex-column flex-grow-1">
              <div className="sa-section-header mb-2">
                <h5 className="sa-section-title">
                  <FileText size={18} className="text-sa-primary" />
                  <span>Upcoming Examinations</span>
                </h5>
                <button
                  type="button"
                  className="btn btn-link p-0 sa-link-more"
                  onClick={() => navigate('/student/exams')}
                >
                  <span>View Full Schedule</span>
                  <ArrowRight size={13} />
                </button>
              </div>

              <div className="table-responsive flex-grow-1">
                <table className="table align-middle table-borderless m-0">
                  <thead>
                    <tr className="sa-table-header-row">
                      <th className="rounded-start">Date</th>
                      <th>Subject</th>
                      <th>Class</th>
                      <th className="text-end rounded-end">Countdown</th>
                    </tr>
                  </thead>
                  <tbody className="sa-table-compact">
                    {upcomingExaminations.length > 0 ? (
                      upcomingExaminations.map((ex, i) => (
                        <tr key={i} className="border-bottom border-light">
                          <td className="fw-bold text-sa-charcoal">{ex.date}</td>
                          <td className="text-sa-charcoal fw-semibold">{ex.subject}</td>
                          <td className="text-sa-muted">{ex.class}</td>
                          <td className="text-end">
                            <span className="badge-countdown-pill">{ex.countdown}</span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="text-center text-muted py-4">
                          No upcoming examinations scheduled.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
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
                    0%
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
                    0%
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

    </div>
  );
}
