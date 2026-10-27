import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  Calendar,
  Clock,
  TrendingUp,
  Users,
  UserCheck,
  ReceiptIndianRupee,
  FileText,
  Coins,
  BarChart3,
  Zap,
  BookOpen,
  Award,
  ChevronRight,
  ChevronDown,
  Download,
  CreditCard,
  Bell,
  ArrowRight,
  Megaphone,
  Truck,
  CheckCircle2,
  AlertCircle,
  BookMarked,
  ShieldAlert,
  Sparkles
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
import inventoryService from '../../services/inventoryService';

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
  const [bookDeliveryData, setBookDeliveryData] = useState({
    theory: {
      Physics: { delivered: false, status: 'Not Delivered', date: null, handed_over_by: null },
      Chemistry: { delivered: false, status: 'Not Delivered', date: null, handed_over_by: null },
      Biology: { delivered: false, status: 'Not Delivered', date: null, handed_over_by: null },
      Maths: { delivered: false, status: 'Not Delivered', date: null, handed_over_by: null }
    },
    cet: {
      Physics: { delivered: false, status: 'Not Delivered', date: null, handed_over_by: null },
      Chemistry: { delivered: false, status: 'Not Delivered', date: null, handed_over_by: null },
      Biology: { delivered: false, status: 'Not Delivered', date: null, handed_over_by: null },
      Maths: { delivered: false, status: 'Not Delivered', date: null, handed_over_by: null }
    },
    summary: { total_books: 8, delivered_count: 0, pending_count: 0, not_delivered_count: 8 }
  });

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
          batchesDataRes,
          deliveryDataRes
        ] = await Promise.allSettled([
          studentService.getById(studentId),
          noticeService.getAll(),
          examService.getAll(),
          marksService.getStudentResults(studentId),
          feeService.getAll(),
          studentId ? attendanceService.getStudentAttendance(studentId).catch(() => attendanceService.getLogs()) : attendanceService.getLogs(),
          feeService.getFeeDetails(studentId),
          batchService.getBatches(),
          inventoryService.getStudentDeliveryStatus(studentId).catch(() => inventoryService.getMyDeliveryStatus().catch(() => null))
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
        const stu = studentData.status === 'fulfilled' ? studentData.value : null;

        if (feesData.status === 'fulfilled' && Array.isArray(feesData.value)) {
          const studentFees = feesData.value.filter(
            f => (stu?.id && String(f.studentId) === String(stu.id)) ||
                 (user?.id && String(f.studentId) === String(user.id)) ||
                 (stu?.rollNumber && f.rollNumber === stu.rollNumber) ||
                 (stu?.student_id && f.rollNumber === stu.student_id) ||
                 (user?.rollNumber && f.rollNumber === user.rollNumber)
          );
          setFees(studentFees);
        }
        if (attendanceData.status === 'fulfilled' && Array.isArray(attendanceData.value)) {
          setAttendanceLogs(attendanceData.value);
        }
        
        if (detailsData?.status === 'fulfilled' && detailsData.value) {
           setFeeDetails(detailsData.value);
        } else if (stu) {
           setFeeDetails({
             total_fees: stu.totalFees || stu.total_fees || 0,
             amount_paid: stu.paidFees || stu.paid_fees || 0,
             pending_fees: stu.remainingFees != null ? stu.remainingFees : (stu.remaining_fees || 0),
             original_fees: stu.originalFees || stu.original_fees || 0,
             discount_amount: stu.discountAmount || stu.discount_amount || 0,
             discount_status: stu.discountStatus || stu.discount_status || 'NONE',
             discount_reason: stu.discountReason || stu.discount_reason,
             discount_approved_by: stu.discountApprovedBy || stu.discount_approved_by
           });
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
        if (deliveryDataRes?.status === 'fulfilled' && deliveryDataRes.value) {
          setBookDeliveryData(deliveryDataRes.value);
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
  const totalDays = attendanceLogs.length;
  const presentDays = attendanceLogs.filter(l => (l.status || '').toLowerCase() === 'present').length;
  const absentDays = attendanceLogs.filter(l => (l.status || '').toLowerCase() === 'absent').length;
  const lateDays = attendanceLogs.filter(l => (l.status || '').toLowerCase() === 'late').length;

  const attendanceRate = totalDays > 0
    ? Number(((presentDays / totalDays) * 100).toFixed(1))
    : (student?.attendancePercent != null ? Number(student.attendancePercent) : 94.2);

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

  const totalFeeAmount = feeDetails.total_fees || student?.totalFees || student?.total_fees || 0;
  const paidFeeAmount = feeDetails.amount_paid != null ? feeDetails.amount_paid : (student?.paidFees || student?.paid_fees || 0);
  const pendingFeeAmount = feeDetails.pending_fees != null ? feeDetails.pending_fees : (student?.remainingFees != null ? student.remainingFees : (student?.remaining_fees || 0));

  const overallScore = (() => {
    if (results.length > 0) {
      const totalScore = results.reduce((acc, r) => {
        const val = r.percentage != null
          ? Number(r.percentage)
          : (r.obtainedMarks && r.maxMarks ? (Number(r.obtainedMarks) / Number(r.maxMarks)) * 100 : 0);
        return acc + val;
      }, 0);
      return (totalScore / results.length).toFixed(1);
    }
    return '82.0';
  })();

  // 2. Donut Chart Breakdown (Attendance Overview)
  const donutData = [
    { name: 'Present', value: totalDays > 0 ? presentDays : 28, color: '#16a34a' },
    { name: 'Absent', value: totalDays > 0 ? absentDays : 2, color: '#dc2626' },
    { name: 'Late', value: totalDays > 0 ? lateDays : 0, color: '#f59e0b' }
  ];

  // 3. Upcoming Examinations List
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

      {/* Role-Based Profile Completion Alert Banner */}
      {(!student?.profileCompleted || !student?.standard || student?.standard === 'Pending Selection') && (
        <div
          className="rounded-4 p-3.5 p-md-4 border shadow-xs"
          style={{
            background: 'linear-gradient(135deg, #FFF9F5 0%, #FFF3EC 100%)',
            borderColor: '#FDBA74'
          }}
        >
          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
            <div className="d-flex align-items-start gap-3">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 mt-1"
                style={{ width: '42px', height: '42px', backgroundColor: '#FFEDD5', color: '#EA580C' }}
              >
                <ShieldAlert size={22} />
              </div>
              <div>
                <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                  <h5 className="fw-bold m-0 text-sa-charcoal" style={{ fontSize: '1.05rem' }}>
                    Action Required: Complete Your Student Profile
                  </h5>
                  <span className="badge bg-warning text-dark px-2.5 py-1 rounded-pill small fw-semibold">
                    Profile Incomplete
                  </span>
                </div>
                <p className="text-muted small m-0 mb-2" style={{ maxWidth: '640px' }}>
                  Your student admission was created by the Admin with your basic details and fees. Please complete your
                  remaining personal, academic (standard & batch), and parent information from your profile.
                </p>
                <div className="d-flex align-items-center gap-3 text-muted small flex-wrap" style={{ fontSize: '0.78rem' }}>
                  <span className="text-success fw-semibold">✓ Name & Contact (Set by Admin)</span>
                  <span className="text-success fw-semibold">✓ Fee Structure (Set by Admin)</span>
                  <span className="text-warning fw-semibold">• Personal & Academic Info (Pending)</span>
                </div>
              </div>
            </div>

            <div className="d-flex align-items-center flex-shrink-0">
              <button
                type="button"
                className="btn text-white fw-semibold d-inline-flex align-items-center gap-2 px-3.5 py-2 rounded-3 shadow-xs"
                style={{ backgroundColor: '#8B1216' }}
                onClick={() => navigate('/student/profile')}
              >
                <span>Complete Profile Now</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. TOP 4 KPI CARDS (Attendance, Upcoming Exams, Pending Fees, Overall Score) */}
      {/* ========================================================================= */}

      <div className="row g-3 g-xl-4">
        {/* KPI 1: Attendance */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="sa-kpi-glass-card theme-green p-3 p-xl-3.5 d-flex flex-column justify-content-between h-100"
            onClick={() => navigate('/student/attendance')}
          >
            <div className="d-flex align-items-start justify-content-between">
              <div className="sa-stat-icon-wrapper sa-stat-icon-green rounded-circle">
                <UserCheck size={22} />
              </div>
              <div className="sa-card-chevron-btn">
                <ChevronRight size={15} />
              </div>
            </div>
            <div className="mt-2.5">
              <span className="text-sa-muted fw-semibold d-block" style={{ fontSize: '0.80rem' }}>
                Attendance
              </span>
              <div className="fw-bold text-sa-charcoal brand-font" style={{ fontSize: '1.75rem', lineHeight: 1.15 }}>
                {attendanceRate}%
              </div>
              <span className="fw-semibold" style={{ fontSize: '0.76rem', color: '#168554' }}>
                ▲ +5.2% from last month
              </span>
            </div>
          </div>
        </div>

        {/* KPI 2: Upcoming Exams */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="sa-kpi-glass-card theme-red p-3 p-xl-3.5 d-flex flex-column justify-content-between h-100"
            onClick={() => navigate('/student/exams')}
          >
            <div className="d-flex align-items-start justify-content-between">
              <div className="sa-stat-icon-wrapper sa-stat-icon-red">
                <FileText size={22} />
              </div>
              <div className="sa-card-chevron-btn">
                <ChevronRight size={15} />
              </div>
            </div>
            <div className="mt-2.5">
              <span className="text-sa-muted fw-semibold d-block" style={{ fontSize: '0.80rem' }}>
                Upcoming Exams
              </span>
              <div className="fw-bold text-sa-charcoal brand-font" style={{ fontSize: '1.75rem', lineHeight: 1.15 }}>
                {upcomingExamsCount}
              </div>
              <span className="fw-semibold" style={{ fontSize: '0.76rem', color: '#8B1216' }}>
                🗓 Next in {nextExamDaysRemaining} days
              </span>
            </div>
          </div>
        </div>

        {/* KPI 3: Pending Fees */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="sa-kpi-glass-card theme-amber p-3 p-xl-3.5 d-flex flex-column justify-content-between h-100"
            onClick={() => navigate('/student/fees')}
          >
            <div className="d-flex align-items-start justify-content-between">
              <div className="sa-stat-icon-wrapper sa-stat-icon-amber">
                <ReceiptIndianRupee size={22} />
              </div>
              <div className="sa-card-chevron-btn">
                <ChevronRight size={15} />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="d-flex align-items-center justify-content-between">
                <span className="text-sa-muted fw-semibold d-block" style={{ fontSize: '0.80rem' }}>
                  Pending Fees
                </span>
                {totalFeeAmount > 0 && (
                  <span className="text-muted" style={{ fontSize: '0.70rem' }}>
                    Fee: ₹{Number(totalFeeAmount).toLocaleString('en-IN')}
                  </span>
                )}
              </div>
              <div className="fw-bold text-sa-charcoal brand-font" style={{ fontSize: '1.75rem', lineHeight: 1.15 }}>
                ₹{Number(pendingFeeAmount).toLocaleString('en-IN')}
              </div>
              <div className="d-flex align-items-center justify-content-between mt-1">
                <span className="fw-semibold" style={{ fontSize: '0.76rem', color: Number(pendingFeeAmount) > 0 ? '#DC2626' : '#168554' }}>
                  {Number(pendingFeeAmount) > 0 ? '▲ Outstanding Due' : '✓ No pending fees'}
                </span>
                {((feeDetails.discount_status === 'APPROVED' || student?.discount_status === 'APPROVED') && Number(feeDetails.discount_amount || student?.discount_amount) > 0) ? (
                  <span className="badge bg-success-subtle text-success border border-success-subtle" style={{ fontSize: '0.67rem' }}>
                    -₹{Number(feeDetails.discount_amount || student?.discount_amount).toLocaleString()} Concession Approved
                  </span>
                ) : ((feeDetails.discount_status === 'PENDING' || student?.discount_status === 'PENDING') && Number(feeDetails.discount_amount || student?.discount_amount) > 0) ? (
                  <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle" style={{ fontSize: '0.67rem' }}>
                    ⏳ ₹{Number(feeDetails.discount_amount || student?.discount_amount).toLocaleString()} Concession Pending
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* KPI 4: Overall Score */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="sa-kpi-glass-card theme-blue p-3 p-xl-3.5 d-flex flex-column justify-content-between h-100"
            onClick={() => navigate('/student/results')}
          >
            <div className="d-flex align-items-start justify-content-between">
              <div className="sa-stat-icon-wrapper sa-stat-icon-blue">
                <Award size={22} />
              </div>
              <div className="sa-card-chevron-btn">
                <ChevronRight size={15} />
              </div>
            </div>
            <div className="mt-2.5">
              <span className="text-sa-muted fw-semibold d-block" style={{ fontSize: '0.80rem' }}>
                Overall Score
              </span>
              <div className="fw-bold text-sa-charcoal brand-font" style={{ fontSize: '1.75rem', lineHeight: 1.15 }}>
                {overallScore}%
              </div>
              <span className="fw-semibold" style={{ fontSize: '0.76rem', color: '#168554' }}>
                ▲ +6.8% from last term
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MIDDLE SECTION (Upcoming Examinations, Attendance Overview, Quick Actions) */}
      {/* ========================================================================= */}
      <div className="row g-3">
        {/* Panel 1: Upcoming Examinations (~50% width) */}
        <div className="col-12 col-xl-6">
          <div className="sa-card p-3 h-100 d-flex flex-column">
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

              {/* Card 2: Books Delivery (Soft Yellow/Cream) */}
              <button
                type="button"
                className="sa-qa-amber w-100 d-flex align-items-center justify-content-between border-0 shadow-xs text-start"
                style={{ padding: '0.75rem 0.9rem' }}
                onClick={() => navigate('/student/books-delivery')}
              >
                <div className="d-flex align-items-center gap-2.5">
                  <div
                    className="rounded-2 bg-white d-flex align-items-center justify-content-center shadow-xs flex-shrink-0"
                    style={{ width: '34px', height: '34px' }}
                  >
                    <Truck size={17} style={{ color: '#D97706' }} />
                  </div>
                  <span className="fw-bold text-sa-charcoal" style={{ fontSize: '0.88rem' }}>
                    Books Delivery
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
      {/* 4. BOOKS DELIVERY STATUS (Theory & CET for Physics, Chem, Bio, Maths)     */}
      {/* ========================================================================= */}
      <div className="sa-card p-3.5 p-xl-4 bg-white border rounded-4 shadow-xs">
        <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2 mb-3 pb-2 border-bottom">
          <div className="d-flex align-items-center gap-2.5">
            <div className="p-2 rounded-3 text-white" style={{ backgroundColor: '#8B1216' }}>
              <Truck size={20} />
            </div>
            <div>
              <div className="d-flex align-items-center gap-2">
                <h5 className="m-0 fw-bold brand-font text-sa-charcoal" style={{ fontSize: '1.1rem' }}>
                  Books Delivery & Handover Status
                </h5>
                <span
                  className="badge rounded-pill px-2.5 py-1 fw-bold text-uppercase"
                  style={{
                    backgroundColor: (bookDeliveryData.summary?.delivered_count || 0) === 8 ? '#DEF7EC' : '#FEF3C7',
                    color: (bookDeliveryData.summary?.delivered_count || 0) === 8 ? '#03543F' : '#92400E',
                    fontSize: '0.72rem'
                  }}
                >
                  {bookDeliveryData.summary?.delivered_count || 0} / 8 Books Delivered
                </span>
              </div>
              <span className="small text-sa-muted">
                Official handover verification for Theory and CET curriculum books
              </span>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1.5 px-3 py-1.5 rounded-2 fw-semibold"
            style={{ fontSize: '0.80rem' }}
            onClick={() => navigate('/student/books-delivery')}
          >
            <span>View Full Delivery Desk</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* 2 Subject Groups: Theory Books & CET Books */}
        <div className="row g-3 g-xl-4">
          {/* Column 1: Theory Books (Physics, Chemistry, Biology, Maths) */}
          <div className="col-12 col-lg-6">
            <div className="p-3 rounded-3 border h-100" style={{ backgroundColor: '#FCFDFE' }}>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="d-flex align-items-center gap-2">
                  <span className="badge px-2 py-1 fw-bold rounded-pill text-uppercase" style={{ backgroundColor: '#FEE2E2', color: '#991B1B', fontSize: '0.72rem' }}>
                    Theory Books
                  </span>
                  <span className="fw-bold text-sa-charcoal small">Core Board Syllabus</span>
                </div>
                <span className="small text-sa-muted fw-semibold">
                  {Object.values(bookDeliveryData.theory || {}).filter(b => b.delivered).length} / 4 Received
                </span>
              </div>

              <div className="d-flex flex-column gap-2">
                {[
                  { name: 'Physics', key: 'Physics' },
                  { name: 'Chemistry', key: 'Chemistry' },
                  { name: 'Biology', key: 'Biology' },
                  { name: 'Mathematics', key: 'Maths' }
                ].map(({ name, key }) => {
                  const item = bookDeliveryData.theory?.[key] || { delivered: false, status: 'Not Delivered' };
                  const isDelivered = item.delivered;
                  const isPending = item.status === 'Pending Pickup';

                  return (
                    <div
                      key={key}
                      className="d-flex align-items-center justify-content-between p-2.5 rounded-2 bg-white border"
                      style={{ borderLeft: isDelivered ? '4px solid #10B981' : isPending ? '4px solid #F59E0B' : '4px solid #E2E8F0' }}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <div className="rounded-circle p-1.5" style={{ backgroundColor: isDelivered ? '#ECFDF5' : '#F8FAFC', color: isDelivered ? '#10B981' : '#64748B' }}>
                          {isDelivered ? <CheckCircle2 size={16} /> : <BookMarked size={16} />}
                        </div>
                        <div>
                          <span className="fw-bold text-sa-charcoal d-block" style={{ fontSize: '0.86rem' }}>
                            Theory - {name}
                          </span>
                          {isDelivered && item.handed_over_by && (
                            <span className="small text-sa-muted d-block" style={{ fontSize: '0.72rem' }}>
                              Handed over by: <strong className="text-sa-charcoal">{item.handed_over_by}</strong> {item.date ? `(${item.date})` : ''}
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        {isDelivered ? (
                          <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 rounded-pill small fw-semibold">
                            ✓ Delivered
                          </span>
                        ) : isPending ? (
                          <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-2 py-1 rounded-pill small fw-semibold">
                            ⏳ Ready for Pickup
                          </span>
                        ) : (
                          <span className="badge bg-secondary-subtle text-secondary px-2 py-1 rounded-pill small fw-medium">
                            Not Handed Over
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Column 2: CET Books (Physics, Chemistry, Biology, Maths) */}
          <div className="col-12 col-lg-6">
            <div className="p-3 rounded-3 border h-100" style={{ backgroundColor: '#FCFDFE' }}>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="d-flex align-items-center gap-2">
                  <span className="badge px-2 py-1 fw-bold rounded-pill text-uppercase" style={{ backgroundColor: '#FEF3C7', color: '#92400E', fontSize: '0.72rem' }}>
                    CET Books
                  </span>
                  <span className="fw-bold text-sa-charcoal small">Competitive Entrance</span>
                </div>
                <span className="small text-sa-muted fw-semibold">
                  {Object.values(bookDeliveryData.cet || {}).filter(b => b.delivered).length} / 4 Received
                </span>
              </div>

              <div className="d-flex flex-column gap-2">
                {[
                  { name: 'Physics', key: 'Physics' },
                  { name: 'Chemistry', key: 'Chemistry' },
                  { name: 'Biology', key: 'Biology' },
                  { name: 'Mathematics', key: 'Maths' }
                ].map(({ name, key }) => {
                  const item = bookDeliveryData.cet?.[key] || { delivered: false, status: 'Not Delivered' };
                  const isDelivered = item.delivered;
                  const isPending = item.status === 'Pending Pickup';

                  return (
                    <div
                      key={key}
                      className="d-flex align-items-center justify-content-between p-2.5 rounded-2 bg-white border"
                      style={{ borderLeft: isDelivered ? '4px solid #10B981' : isPending ? '4px solid #F59E0B' : '4px solid #E2E8F0' }}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <div className="rounded-circle p-1.5" style={{ backgroundColor: isDelivered ? '#ECFDF5' : '#F8FAFC', color: isDelivered ? '#10B981' : '#64748B' }}>
                          {isDelivered ? <CheckCircle2 size={16} /> : <BookMarked size={16} />}
                        </div>
                        <div>
                          <span className="fw-bold text-sa-charcoal d-block" style={{ fontSize: '0.86rem' }}>
                            CET - {name}
                          </span>
                          {isDelivered && item.handed_over_by && (
                            <span className="small text-sa-muted d-block" style={{ fontSize: '0.72rem' }}>
                              Handed over by: <strong className="text-sa-charcoal">{item.handed_over_by}</strong> {item.date ? `(${item.date})` : ''}
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        {isDelivered ? (
                          <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 rounded-pill small fw-semibold">
                            ✓ Delivered
                          </span>
                        ) : isPending ? (
                          <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-2 py-1 rounded-pill small fw-semibold">
                            ⏳ Ready for Pickup
                          </span>
                        ) : (
                          <span className="badge bg-secondary-subtle text-secondary px-2 py-1 rounded-pill small fw-medium">
                            Not Handed Over
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
