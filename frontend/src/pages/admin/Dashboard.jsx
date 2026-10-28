import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import studentService from '../../services/studentService';
import attendanceService from '../../services/attendanceService';
import examService from '../../services/examService';
import batchService from '../../services/batchService';
import inventoryService from '../../services/inventoryService';
import leaveService from '../../services/leaveService';
import salaryService from '../../services/salaryService';
import teacherService from '../../services/teacherService';
import curriculumService from '../../services/curriculumService';
import feeService from '../../services/feeService';
import { useAuth } from '../../hooks/useAuth';
import { getUserBranch } from '../../utils/branchUtils';
import { BRANCH_MANGALWAR, BRANCH_TARABAI } from '../../config/branchBatchConfig';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LabelList
} from 'recharts';
import {
  Users,
  UserCheck,
  ReceiptIndianRupee,
  BarChart2,
  Calendar,
  UserPlus,
  Package,
  FileText,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Tag,
  Clock,
  Sparkles,
  BookOpen,
  BookMarked,
  Truck,
  Check,
  X,
  GraduationCap,
  Coins,
  CreditCard,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-toastify';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuperAdmin = (user?.role || '').toLowerCase().replace('-', '_').includes('super_admin');
  const activeBranch = getUserBranch(user);
  const isMangal = Boolean(activeBranch && activeBranch.toLowerCase().includes('mangal'));
  const currentBranch = isMangal ? BRANCH_MANGALWAR : BRANCH_TARABAI;

  // Selected campus state - allows dynamic switching between Tarabai Park & Mangalvar Peth
  const [selectedCampus, setSelectedCampus] = useState(isMangal ? BRANCH_MANGALWAR : BRANCH_TARABAI);

  // Dynamic Fee Stats State
  const [feeStats, setFeeStats] = useState({
    totalTarget: 0,
    collected: 0,
    pending: 0,
    collectionRate: 0
  });
  const [loadingFeeStats, setLoadingFeeStats] = useState(false);

  const [attendancePeriod, setAttendancePeriod] = useState('This Week');

  // Dynamic Data States
  const [totalStudents, setTotalStudents] = useState(0);
  const [allStudents, setAllStudents] = useState([]);
  const [presentToday, setPresentToday] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);
  const [recentAdmissions, setRecentAdmissions] = useState([]);
  const [upcomingExams, setUpcomingExams] = useState([]);

  // Faculty Dynamic Data States
  const [facultyLeaves, setFacultyLeaves] = useState([]);
  const [facultyAttendance, setFacultyAttendance] = useState([]);
  const [facultySummary, setFacultySummary] = useState(null);
  const [facultySalaries, setFacultySalaries] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [leaveActionLoading, setLeaveActionLoading] = useState(false);
  const [teacherActivities, setTeacherActivities] = useState([]);
  const [activityBranchFilter, setActivityBranchFilter] = useState('Current Campus');

  const [attendanceData, setAttendanceData] = useState([
    { day: 'Mon', present: 0, absent: 0 },
    { day: 'Tue', present: 0, absent: 0 },
    { day: 'Wed', present: 0, absent: 0 },
    { day: 'Thu', present: 0, absent: 0 },
    { day: 'Fri', present: 0, absent: 0 },
    { day: 'Sat', present: 0, absent: 0 },
    { day: 'Sun', present: 0, absent: 0 },
  ]);
  const [scheduleList, setScheduleList] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);

  const fetchFeeStats = async (branchToFetch = selectedCampus) => {
    try {
      setLoadingFeeStats(true);
      const stats = await feeService.getFeeStats(branchToFetch);
      if (stats) {
        setFeeStats({
          totalTarget: Number(stats.totalTarget) || 0,
          collected: Number(stats.collected) || 0,
          pending: Number(stats.pending) || 0,
          collectionRate: Number(stats.collectionRate) || 0
        });
      }
    } catch (err) {
      console.error('Error fetching fee stats for dashboard:', err);
    } finally {
      setLoadingFeeStats(false);
    }
  };

  const fetchDashboardData = async (targetCampus = selectedCampus) => {
    try {
      const todayDate = new Date();
      const todayStr = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;
      const isTargetMangal = Boolean(targetCampus && targetCampus.toLowerCase().includes('mangal'));

      const [
        studentsRes,
        attendanceRes,
        examsRes,
        batchesRes,
        summaryRes,
        inventoryRes,
        leavesRes,
        salariesRes,
        teachersRes,
        teacherAttRes,
        teacherSumRes,
        activitiesRes
      ] = await Promise.allSettled([
        studentService.getAll(),
        attendanceService.getLogs(),
        examService.getAll(),
        batchService.getBatches({ branch: targetCampus }),
        attendanceService.getReportSummary(),
        inventoryService.getItems(),
        leaveService.getAllLeaveRequests(),
        salaryService.getAll(),
        teacherService.getAll(),
        attendanceService.getTeachersAttendance({ date: todayStr }),
        attendanceService.getTeachersSummary({ date: todayStr }),
        curriculumService.getDailyActivities().catch(() => [])
      ]);

      if (leavesRes.status === 'fulfilled') {
        setFacultyLeaves(leavesRes.value || []);
      }
      if (salariesRes.status === 'fulfilled') {
        setFacultySalaries(salariesRes.value || []);
      }
      if (teachersRes.status === 'fulfilled') {
        setFacultyList(teachersRes.value || []);
      }
      if (teacherAttRes.status === 'fulfilled') {
        setFacultyAttendance(teacherAttRes.value || []);
      }
      if (teacherSumRes.status === 'fulfilled') {
        setFacultySummary(teacherSumRes.value || null);
      }
      if (activitiesRes.status === 'fulfilled' && Array.isArray(activitiesRes.value)) {
        setTeacherActivities(activitiesRes.value);
      }

      if (studentsRes.status === 'fulfilled') {
        const rawStudents = studentsRes.value || [];
        const students = rawStudents.filter(s => {
          const b = (s.branch || '').toLowerCase();
          return isTargetMangal ? b.includes('mangal') : b.includes('tarabai');
        });
        setTotalStudents(students.length);
        setAllStudents(students);

        // Sort for recent admissions
        const sorted = [...students].reverse().slice(0, 5).map((s, idx) => ({
          id: s.id || idx + 1,
          name: s.name,
          class: s.standard || 'N/A',
          date: s.admissionDate ? new Date(s.admissionDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
          status: s.status || 'Active',
          totalFees: s.totalFees || 0,
          originalFees: s.originalFees || s.totalFees || 0,
          discountAmount: s.discountAmount || 0,
          discountReason: s.discountReason || '',
          discountStatus: s.discountStatus || 'NONE',
          discountApprovedBy: s.discountApprovedBy || ''
        }));
        setRecentAdmissions(sorted);
      }

      if (attendanceRes.status === 'fulfilled') {
        const logs = attendanceRes.value || [];
        const present = logs.filter(l => l.status === 'Present').length;
        setPresentToday(present > 0 ? present : logs.length);
      }

      if (summaryRes.status === 'fulfilled' && summaryRes.value?.weeklyData?.length > 0) {
        setAttendanceData(summaryRes.value.weeklyData);
      } else if (attendanceRes.status === 'fulfilled') {
        const logs = attendanceRes.value || [];
        const present = logs.filter(l => l.status === 'Present').length || logs.length || 0;
        setAttendanceData([
          { day: 'Mon', present: Math.max(0, present - 2), absent: 2 },
          { day: 'Tue', present: Math.max(0, present - 1), absent: 1 },
          { day: 'Wed', present: present, absent: 0 },
          { day: 'Thu', present: Math.max(0, present - 3), absent: 3 },
          { day: 'Fri', present: Math.max(0, present - 2), absent: 2 },
          { day: 'Sat', present: Math.max(0, present - 4), absent: 4 },
          { day: 'Sun', present: 0, absent: 0 },
        ]);
      }

      if (examsRes.status === 'fulfilled') {
        const exams = examsRes.value || [];
        const upcoming = exams.slice(0, 4).map(e => ({
          day: new Date(e.date || Date.now()).getDate().toString().padStart(2, '0'),
          month: new Date(e.date || Date.now()).toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
          title: e.title,
          class: e.classBatch || 'All',
          countdown: 'Upcoming'
        }));
        setUpcomingExams(upcoming);
      }

      if (batchesRes.status === 'fulfilled') {
        const batches = batchesRes.value || [];
        setTotalBatches(batches.length);
        const formatted = batches.slice(0, 4).map(b => ({
          time: b.time || '10:00 AM',
          subject: b.subject,
          classBatch: b.name,
          teacher: b.teacher_name || 'TBD',
          status: 'Upcoming'
        }));
        setScheduleList(formatted);
      }

      if (inventoryRes.status === 'fulfilled' && Array.isArray(inventoryRes.value)) {
        setInventoryItems(inventoryRes.value);
      }
    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
    }
  };

  useEffect(() => {
    fetchDashboardData(selectedCampus);
    fetchFeeStats(selectedCampus);

    const handleActivitiesUpdate = async () => {
      try {
        const data = await curriculumService.getDailyActivities();
        if (Array.isArray(data) && data.length > 0) {
          setTeacherActivities(data);
          return;
        }
      } catch (_) {}
      try {
        const saved = localStorage.getItem('sa_teacher_daily_activities');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setTeacherActivities(parsed);
        }
      } catch (_) {}
    };

    const handleFeesUpdate = () => {
      fetchFeeStats(selectedCampus);
    };

    window.addEventListener('sa_daily_activities_updated', handleActivitiesUpdate);
    window.addEventListener('sa_timetable_updated', () => fetchDashboardData(selectedCampus));
    window.addEventListener('sa_fees_updated', handleFeesUpdate);
    window.addEventListener('focus', handleActivitiesUpdate);
    window.addEventListener('focus', handleFeesUpdate);
    window.addEventListener('storage', handleActivitiesUpdate);

    return () => {
      window.removeEventListener('sa_daily_activities_updated', handleActivitiesUpdate);
      window.removeEventListener('sa_timetable_updated', () => fetchDashboardData(selectedCampus));
      window.removeEventListener('sa_fees_updated', handleFeesUpdate);
      window.removeEventListener('focus', handleActivitiesUpdate);
      window.removeEventListener('focus', handleFeesUpdate);
      window.removeEventListener('storage', handleActivitiesUpdate);
    };
  }, [selectedCampus]);

  // Filtered teacher activities for live admin view - dynamically synced to selected branch
  const filteredTeacherActivities = useMemo(() => {
    const isCurrentMangal = Boolean(selectedCampus && selectedCampus.toLowerCase().includes('mangal'));
    return teacherActivities.filter(act => {
      const actBranch = (act.branch || '').toLowerCase();
      const actBatch = (act.batch || '').toLowerCase();
      const isMangalAct = actBranch.includes('mangal') || actBatch.includes('mangal') || actBranch.includes('mp') || actBatch.includes('mp');
      const isTarabaiAct = actBranch.includes('tarabai') || actBatch.includes('tarabai') || (!isMangalAct);

      if (activityBranchFilter === 'Tarabai Park') {
        return isTarabaiAct;
      }
      if (activityBranchFilter === 'Mangalwar Peth' || activityBranchFilter === 'Mangalvar Peth') {
        return isMangalAct;
      }
      if (activityBranchFilter === 'All') {
        return true;
      }

      // Default: 'Current Campus' -> follows selectedCampus
      return isCurrentMangal ? isMangalAct : isTarabaiAct;
    });
  }, [teacherActivities, activityBranchFilter, selectedCampus]);

  // Faculty calculations
  const pendingLeaves = facultyLeaves.filter(
    (l) => (l.status || '').toLowerCase() === 'pending'
  );
  const approvedLeavesCount = facultyLeaves.filter(
    (l) => (l.status || '').toLowerCase() === 'approved'
  );

  const totalTeachers = facultyList.length;
  const presentTeachers = facultySummary?.present_count ?? facultyAttendance.filter(
    (r) => r.status === 'Present' || r.status === 'Working'
  ).length;
  const workingTeachers = facultySummary?.working_count ?? facultyAttendance.filter(
    (r) => r.status === 'Working'
  ).length;
  const absentTeachers = facultySummary?.absent_count ?? Math.max(0, totalTeachers - presentTeachers);

  // Total shift hours today
  let totalFacultyHoursToday = 0;
  facultyAttendance.forEach(r => {
    const raw = r.total_hours || r.totalHours;
    if (raw) {
      const match = raw.match(/(\d+)\s*h(?:\s*(\d+)\s*m)?/i);
      if (match) {
        totalFacultyHoursToday += Number(match[1]) + (Number(match[2] || 0) / 60);
      }
    }
  });

  // Salary calculations
  const totalSalaryLiability = facultySalaries.reduce(
    (acc, s) => acc + (Number(s.netPayable) || Number(s.baseSalary) || 0),
    0
  );
  const totalSalaryDisbursed = facultySalaries.reduce(
    (acc, s) => acc + ((Number(s.netPayable) || 0) - (Number(s.amountPending) || 0)),
    0
  );
  const totalSalaryPending = facultySalaries.reduce(
    (acc, s) => acc + (Number(s.amountPending) || 0),
    0
  );
  const salaryDisbursedPercent = totalSalaryLiability > 0
    ? Math.min(100, Math.round((totalSalaryDisbursed / totalSalaryLiability) * 100))
    : 0;

  const handleQuickLeaveAction = async (id, status) => {
    setLeaveActionLoading(true);
    try {
      await leaveService.updateLeaveStatus(
        id,
        status,
        status === 'Approved' ? 'Approved by Admin' : 'Rejected by Admin'
      );
      toast.success(`Leave request ${status.toLowerCase()} successfully!`);
      const updated = await leaveService.getAllLeaveRequests();
      setFacultyLeaves(updated || []);
    } catch (err) {
      toast.error(`Failed to ${status.toLowerCase()} leave request`);
    } finally {
      setLeaveActionLoading(false);
    }
  };

  const pendingDiscounts = allStudents.filter(
    (s) => s.discountStatus === 'PENDING' && Number(s.discountAmount) > 0
  );



  const lowStockItems = [];

  return (
    <div className="d-flex flex-column gap-4 pb-4">
      {/* Top Welcome Hero Banner */}
      <div
        className="rounded-4 border overflow-hidden position-relative superadmin-hero-banner"
        style={{
          borderRadius: '20px',
          background: 'linear-gradient(135deg, rgba(255, 248, 238, 0.95) 0%, rgba(255, 243, 235, 0.90) 50%, rgba(254, 244, 234, 0.85) 100%)',
          border: '1px solid rgba(220, 38, 38, 0.14)',
          boxShadow: '0 8px 30px rgba(185, 28, 28, 0.05), inset 0 1px 2px rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)'
        }}
      >
        <div className="row g-0 align-items-center">
          {/* Left Text */}
          <div className="col-12 col-md-6 col-lg-6 p-4 ps-md-4 ps-xl-5 py-md-4">
            <h1
              className="fw-bold brand-font text-sa-charcoal m-0"
              style={{ fontSize: '1.85rem', letterSpacing: '-0.01em', lineHeight: 1.25 }}
            >
              Welcome back, {user?.name?.split(' ')[0] || 'Admin'}
            </h1>
            <div className="d-flex align-items-center gap-2 mt-2 flex-wrap">
              <span
                className="badge py-1.5 px-3 rounded-pill fw-bold d-inline-flex align-items-center gap-1.5"
                style={{
                  backgroundColor: '#8B1216',
                  color: '#FFFFFF',
                  fontSize: '0.80rem',
                  letterSpacing: '0.02em',
                  boxShadow: '0 2px 6px rgba(139,18,22,0.18)'
                }}
              >
                {selectedCampus === BRANCH_MANGALWAR ? '🏛️ Mangalvar Peth Campus' : '🌲 Tarabai Park Campus'}
                <span
                  className="badge bg-white text-dark py-0.5 px-1.5 rounded-pill"
                  style={{ fontSize: '0.68rem', fontWeight: 600 }}
                >
                  Active Campus
                </span>
              </span>

              {/* Quick Campus Switcher */}
              <div className="btn-group p-0.5 rounded-pill bg-white border shadow-xs" role="group" aria-label="Campus quick switch">
                <button
                  type="button"
                  onClick={() => setSelectedCampus(BRANCH_TARABAI)}
                  className={`btn btn-xs px-2.5 py-0.5 rounded-pill fw-semibold border-0 transition-all ${
                    selectedCampus === BRANCH_TARABAI
                      ? 'btn-danger text-white shadow-xs'
                      : 'text-secondary'
                  }`}
                  style={{
                    fontSize: '0.74rem',
                    backgroundColor: selectedCampus === BRANCH_TARABAI ? '#8B1216' : 'transparent'
                  }}
                >
                  🌲 Tarabai Park
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCampus(BRANCH_MANGALWAR)}
                  className={`btn btn-xs px-2.5 py-0.5 rounded-pill fw-semibold border-0 transition-all ${
                    selectedCampus === BRANCH_MANGALWAR
                      ? 'btn-danger text-white shadow-xs'
                      : 'text-secondary'
                  }`}
                  style={{
                    fontSize: '0.74rem',
                    backgroundColor: selectedCampus === BRANCH_MANGALWAR ? '#8B1216' : 'transparent'
                  }}
                >
                  🏛️ Mangalvar Peth
                </button>
              </div>
            </div>
            <p
              className="text-sa-charcoal text-opacity-75 m-0 mt-2"
              style={{ fontSize: '0.95rem', fontWeight: 400 }}
            >
              Discipline Today, A Brighter Tomorrow.
            </p>

            {/* Quick Actions: Student Onboarding & Fee Deciding */}
            <div className="d-flex flex-wrap align-items-center gap-2.5 mt-3 pt-1">
              <button
                type="button"
                onClick={() => navigate('/admin/students/register')}
                className="btn d-inline-flex align-items-center gap-2 px-3.5 py-2 rounded-2 fw-semibold text-white shadow-sm transition-all"
                style={{ backgroundColor: '#8B1216', fontSize: '0.86rem', border: 'none' }}
              >
                <UserPlus size={16} />
                <span>Onboard Student</span>
              </button>

              {pendingDiscounts.length > 0 && (
                <button
                  type="button"
                  onClick={() => navigate('/admin/discounts?status=PENDING')}
                  className="btn d-inline-flex align-items-center gap-1.5 px-3 py-2 rounded-2 fw-bold text-decoration-none shadow-sm transition-all"
                  style={{
                    backgroundColor: '#FEF3C7',
                    border: '1.5px solid #F59E0B',
                    color: '#B45309',
                    fontSize: '0.84rem'
                  }}
                  title="View pending discount concessions"
                >
                  <ShieldCheck size={16} />
                  <span>{pendingDiscounts.length} Discounts Pending Superadmin</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Hero Illustration */}
          <div className="col-12 col-md-6 col-lg-6 d-flex justify-content-end align-items-end pe-0 pe-md-2 pe-xl-3">
            <img
              src="/assets/superadminhero.png"
              alt="Shubham Academy Celebration"
              className="img-fluid"
              style={{
                maxHeight: '155px',
                width: 'auto',
                objectFit: 'contain',
                objectPosition: 'bottom right'
              }}
            />
          </div>
        </div>
      </div>

      {/* Row 1: KPI Stat Cards */}
      <div className="row g-3 g-xl-4">
        {/* Total Students */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="sa-kpi-glass-card theme-red p-3 p-xl-3.5 d-flex flex-column justify-content-between h-100"
            onClick={() => navigate('/admin/students')}
          >
            <div className="d-flex align-items-start justify-content-between">
              <div className="sa-stat-icon-wrapper sa-stat-icon-red">
                <Users size={22} />
              </div>
              <div className="sa-card-chevron-btn">
                <ChevronRight size={15} />
              </div>
            </div>
            <div className="mt-2.5">
              <span className="text-sa-muted fw-semibold d-block" style={{ fontSize: '0.80rem' }}>
                Total Students
              </span>
              <div className="fw-bold text-sa-charcoal brand-font" style={{ fontSize: '1.75rem', lineHeight: 1.15 }}>
                {totalStudents}
              </div>
              <span className="fw-semibold" style={{ fontSize: '0.76rem', color: '#168554' }}>
                ▲ +0 this month
              </span>
            </div>
          </div>
        </div>

        {/* Present Today */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="sa-kpi-glass-card theme-green p-3 p-xl-3.5 d-flex flex-column justify-content-between h-100"
            onClick={() => navigate('/admin/attendance')}
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
                Present Today
              </span>
              <div className="fw-bold text-sa-charcoal brand-font" style={{ fontSize: '1.75rem', lineHeight: 1.15 }}>
                {presentToday}
              </div>
              <span className="fw-semibold" style={{ fontSize: '0.76rem', color: '#168554' }}>
                ↗ 0% attendance
              </span>
            </div>
          </div>
        </div>

        {/* Total Faculty */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="sa-kpi-glass-card theme-amber p-3 p-xl-3.5 d-flex flex-column justify-content-between h-100"
            onClick={() => navigate('/admin/teachers')}
          >
            <div className="d-flex align-items-start justify-content-between">
              <div className="sa-stat-icon-wrapper sa-stat-icon-amber">
                <GraduationCap size={22} />
              </div>
              <div className="sa-card-chevron-btn">
                <ChevronRight size={15} />
              </div>
            </div>
            <div className="mt-2.5">
              <span className="text-sa-muted fw-semibold d-block" style={{ fontSize: '0.80rem' }}>
                Total Faculty
              </span>
              <div className="fw-bold text-sa-charcoal brand-font" style={{ fontSize: '1.75rem', lineHeight: 1.15 }}>
                {totalTeachers}
              </div>
              <span className="fw-semibold" style={{ fontSize: '0.76rem', color: '#168554' }}>
                {presentTeachers > 0 ? `▲ ${presentTeachers} on duty today` : '↗ Qualified Educators'}
              </span>
            </div>
          </div>
        </div>

        {/* Active Batches */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="sa-kpi-glass-card theme-blue p-3 p-xl-3.5 d-flex flex-column justify-content-between h-100"
            onClick={() => navigate('/admin/batches')}
          >
            <div className="d-flex align-items-start justify-content-between">
              <div className="sa-stat-icon-wrapper sa-stat-icon-blue">
                <BookOpen size={22} />
              </div>
              <div className="sa-card-chevron-btn">
                <ChevronRight size={15} />
              </div>
            </div>
            <div className="mt-2.5">
              <span className="text-sa-muted fw-semibold d-block" style={{ fontSize: '0.80rem' }}>
                Active Batches
              </span>
              <div className="fw-bold text-sa-charcoal brand-font" style={{ fontSize: '1.75rem', lineHeight: 1.15 }}>
                {totalBatches}
              </div>
              <span className="fw-semibold" style={{ fontSize: '0.76rem', color: '#2563EB' }}>
                ↗ Classroom & Crash Batches
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Fees Collection Overview Section for Tarabai Park and Mangalvar Peth */}
      <div id="dashboard-fees-overview" className="sa-card bg-white p-3.5 p-xl-4 rounded-3 border shadow-xs">
        <div className="d-flex flex-column flex-lg-row align-items-start align-items-lg-center justify-content-between gap-3 mb-3">
          <div className="d-flex align-items-center gap-2.5">
            <div
              className="rounded-3 d-flex align-items-center justify-content-center text-white shadow-xs"
              style={{ width: '38px', height: '38px', background: 'linear-gradient(135deg, #8B1216 0%, #B91C1C 100%)' }}
            >
              <Coins size={20} />
            </div>
            <div>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <h2 className="brand-font fw-bold text-sa-charcoal m-0" style={{ fontSize: '1.1rem' }}>
                  Fees Collection Overview
                </h2>
                <span
                  className="badge rounded-pill fw-bold px-2.5 py-1 d-inline-flex align-items-center gap-1.5"
                  style={{
                    backgroundColor: selectedCampus === BRANCH_MANGALWAR ? '#F0FDFA' : '#FDF0F0',
                    color: selectedCampus === BRANCH_MANGALWAR ? '#0D9488' : '#8B1216',
                    border: selectedCampus === BRANCH_MANGALWAR ? '1px solid #99F6E4' : '1px solid #F5C2C4',
                    fontSize: '0.74rem'
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: '#168554',
                      display: 'inline-block'
                    }}
                  />
                  {selectedCampus === BRANCH_MANGALWAR ? '🏛️ Mangalvar Peth Campus' : '🌲 Tarabai Park Campus'}
                </span>
                <span className="badge bg-light text-muted fw-semibold border" style={{ fontSize: '0.70rem' }}>
                  Live Dynamic DB
                </span>
              </div>
              <span className="text-sa-muted" style={{ fontSize: '0.80rem' }}>
                Real-time collection targets, realized revenue, and pending dues for {selectedCampus}
              </span>
            </div>
          </div>

          {/* Campus Switcher Tabs & Quick Navigation */}
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <div className="btn-group p-0.5 rounded-2 bg-light border" role="group" aria-label="Campus selector">
              <button
                type="button"
                onClick={() => setSelectedCampus(BRANCH_TARABAI)}
                className={`btn btn-sm px-2.5 py-1 rounded-2 fw-semibold d-inline-flex align-items-center gap-1.5 transition-all ${
                  selectedCampus === BRANCH_TARABAI
                    ? 'btn-danger text-white shadow-xs'
                    : 'btn-light text-secondary'
                }`}
                style={{
                  fontSize: '0.78rem',
                  backgroundColor: selectedCampus === BRANCH_TARABAI ? '#8B1216' : 'transparent',
                  borderColor: selectedCampus === BRANCH_TARABAI ? '#8B1216' : 'transparent'
                }}
              >
                <span>🌲 Tarabai Park</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedCampus(BRANCH_MANGALWAR)}
                className={`btn btn-sm px-2.5 py-1 rounded-2 fw-semibold d-inline-flex align-items-center gap-1.5 transition-all ${
                  selectedCampus === BRANCH_MANGALWAR
                    ? 'btn-danger text-white shadow-xs'
                    : 'btn-light text-secondary'
                }`}
                style={{
                  fontSize: '0.78rem',
                  backgroundColor: selectedCampus === BRANCH_MANGALWAR ? '#8B1216' : 'transparent',
                  borderColor: selectedCampus === BRANCH_MANGALWAR ? '#8B1216' : 'transparent'
                }}
              >
                <span>🏛️ Mangalvar Peth</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => navigate('/admin/fees')}
              className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1.5 rounded-2 px-2.5 py-1"
              style={{ fontSize: '0.78rem', fontWeight: 600 }}
              title="Open Fee Collection Counter"
            >
              <CreditCard size={14} />
              <span>Fee Counter</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/fees/pending')}
              className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1.5 rounded-2 px-2.5 py-1"
              style={{ fontSize: '0.78rem', fontWeight: 600 }}
              title="View Pending Fee Overdues"
            >
              <AlertCircle size={14} />
              <span>Pending Dues</span>
            </button>
          </div>
        </div>

        {/* 4 Dynamic KPI Cards */}
        <div className="row g-3">
          {/* Fees Collected */}
          <div className="col-12 col-sm-6 col-xl-3">
            <div
              className="sa-kpi-glass-card theme-green p-3 p-xl-3.5 d-flex flex-column justify-content-between h-100"
              onClick={() => navigate('/admin/fees')}
              style={{ cursor: 'pointer' }}
            >
              <div className="d-flex align-items-start justify-content-between">
                <div className="sa-stat-icon-wrapper sa-stat-icon-green rounded-circle">
                  <CreditCard size={22} />
                </div>
                <div className="sa-card-chevron-btn">
                  <ChevronRight size={15} />
                </div>
              </div>
              <div className="mt-2.5">
                <span className="text-sa-muted fw-semibold d-block" style={{ fontSize: '0.80rem' }}>
                  Fees Collected
                </span>
                <div className="fw-bold text-sa-charcoal brand-font" style={{ fontSize: '1.75rem', lineHeight: 1.15 }}>
                  ₹{feeStats.collected.toLocaleString('en-IN')}
                </div>
                <span className="fw-semibold" style={{ fontSize: '0.76rem', color: '#168554' }}>
                  ▲ Realized Inflow • {feeStats.collectionRate}%
                </span>
              </div>
            </div>
          </div>

          {/* Pending Fees */}
          <div className="col-12 col-sm-6 col-xl-3">
            <div
              className="sa-kpi-glass-card theme-red p-3 p-xl-3.5 d-flex flex-column justify-content-between h-100"
              onClick={() => navigate('/admin/fees/pending')}
              style={{ cursor: 'pointer' }}
            >
              <div className="d-flex align-items-start justify-content-between">
                <div className="sa-stat-icon-wrapper sa-stat-icon-red">
                  <AlertCircle size={22} />
                </div>
                <div className="sa-card-chevron-btn">
                  <ChevronRight size={15} />
                </div>
              </div>
              <div className="mt-2.5">
                <span className="text-sa-muted fw-semibold d-block" style={{ fontSize: '0.80rem' }}>
                  Pending Fees
                </span>
                <div className="fw-bold text-sa-charcoal brand-font" style={{ fontSize: '1.75rem', lineHeight: 1.15 }}>
                  ₹{feeStats.pending.toLocaleString('en-IN')}
                </div>
                <span className="fw-semibold" style={{ fontSize: '0.76rem', color: '#DC2626' }}>
                  ▲ Overdue Dues in {selectedCampus}
                </span>
              </div>
            </div>
          </div>

          {/* Total Target Fees */}
          <div className="col-12 col-sm-6 col-xl-3">
            <div
              className="sa-kpi-glass-card theme-amber p-3 p-xl-3.5 d-flex flex-column justify-content-between h-100"
              onClick={() => navigate('/admin/fees/structure')}
              style={{ cursor: 'pointer' }}
            >
              <div className="d-flex align-items-start justify-content-between">
                <div className="sa-stat-icon-wrapper sa-stat-icon-amber">
                  <Coins size={22} />
                </div>
                <div className="sa-card-chevron-btn">
                  <ChevronRight size={15} />
                </div>
              </div>
              <div className="mt-2.5">
                <span className="text-sa-muted fw-semibold d-block" style={{ fontSize: '0.80rem' }}>
                  Total Target Fees
                </span>
                <div className="fw-bold text-sa-charcoal brand-font" style={{ fontSize: '1.75rem', lineHeight: 1.15 }}>
                  ₹{feeStats.totalTarget.toLocaleString('en-IN')}
                </div>
                <span className="fw-semibold" style={{ fontSize: '0.76rem', color: '#B45309' }}>
                  ★ Annual Target • 2025-2026
                </span>
              </div>
            </div>
          </div>

          {/* Collection Rate */}
          <div className="col-12 col-sm-6 col-xl-3">
            <div
              className="sa-kpi-glass-card theme-blue p-3 p-xl-3.5 d-flex flex-column justify-content-between h-100"
              onClick={() => navigate('/admin/fees')}
              style={{ cursor: 'pointer' }}
            >
              <div className="d-flex align-items-start justify-content-between">
                <div className="sa-stat-icon-wrapper sa-stat-icon-blue">
                  <TrendingUp size={22} />
                </div>
                <div className="sa-card-chevron-btn">
                  <ChevronRight size={15} />
                </div>
              </div>
              <div className="mt-2.5">
                <span className="text-sa-muted fw-semibold d-block" style={{ fontSize: '0.80rem' }}>
                  Collection Rate
                </span>
                <div className="fw-bold text-sa-charcoal brand-font" style={{ fontSize: '1.75rem', lineHeight: 1.15 }}>
                  {feeStats.collectionRate}%
                </div>
                <div className="mt-1">
                  <div className="progress" style={{ height: '4px', backgroundColor: '#E2E8F0', borderRadius: '2px' }}>
                    <div
                      className="progress-bar"
                      style={{
                        width: `${Math.min(100, feeStats.collectionRate)}%`,
                        backgroundColor: '#2563EB',
                        borderRadius: '2px'
                      }}
                    />
                  </div>
                </div>
                <span className="fw-semibold mt-1 d-block" style={{ fontSize: '0.74rem', color: '#2563EB' }}>
                  ↗ Realization for {selectedCampus}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Analytics & Schedule (2 Cards) */}
      <div className="row g-3 g-xl-4">
        {/* Attendance Overview Card */}
        <div className="col-12 col-xl-7">
          <div className="sa-card bg-white p-3.5 p-xl-4 rounded-3 border h-100 d-flex flex-column">
            {/* Header */}
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="d-flex align-items-center gap-2">
                <BarChart2 size={18} style={{ color: 'var(--sa-primary-red)' }} />
                <h2 className="m-0 fw-bold text-sa-charcoal" style={{ fontSize: '0.98rem' }}>
                  Attendance Overview
                </h2>
              </div>
              <div className="dropdown">
                <button
                  className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1.5 py-1 px-2.5 rounded-2"
                  style={{ fontSize: '0.76rem', borderColor: '#E2E8F0', color: '#475569' }}
                >
                  <span>{attendancePeriod}</span>
                  <ChevronDown size={13} />
                </button>
              </div>
            </div>

            {/* Recharts Bar Chart */}
            <div className="flex-grow-1" style={{ width: '100%', minHeight: '235px' }}>
              <ResponsiveContainer width="100%" height={235}>
                <BarChart
                  data={attendanceData}
                  margin={{ top: 22, right: 10, left: -22, bottom: 0 }}
                  barGap={3}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748B', fontSize: 11 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748B', fontSize: 10 }}
                    domain={[0, 1300]}
                    ticks={[0, 300, 600, 900, 1200]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      fontSize: '11px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                    }}
                  />
                  <Bar dataKey="present" fill="#8B1216" radius={[3, 3, 0, 0]} maxBarSize={18}>
                    <LabelList
                      dataKey="present"
                      position="top"
                      style={{ fill: '#475569', fontSize: '9px', fontWeight: 600 }}
                    />
                  </Bar>
                  <Bar dataKey="absent" fill="#F5B8B8" radius={[3, 3, 0, 0]} maxBarSize={18}>
                    <LabelList
                      dataKey="absent"
                      position="top"
                      style={{ fill: '#94A3B8', fontSize: '9px' }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Bottom Legend */}
            <div className="d-flex align-items-center justify-content-center gap-4 pt-2 border-top mt-1" style={{ fontSize: '0.80rem' }}>
              <div className="d-flex align-items-center gap-1.5">
                <span className="rounded-circle" style={{ width: '8px', height: '8px', backgroundColor: '#8B1216' }} />
                <span className="text-sa-charcoal fw-medium">Present</span>
              </div>
              <div className="d-flex align-items-center gap-1.5">
                <span className="rounded-circle" style={{ width: '8px', height: '8px', backgroundColor: '#F5B8B8' }} />
                <span className="text-sa-muted fw-medium">Absent</span>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Schedule Card */}
        <div className="col-12 col-xl-5">
          <div className="sa-card bg-white p-3.5 p-xl-4 rounded-3 border h-100 d-flex flex-column">
            {/* Header */}
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="d-flex align-items-center gap-2">
                <Calendar size={18} style={{ color: 'var(--sa-primary-red)' }} />
                <h2 className="m-0 fw-bold text-sa-charcoal" style={{ fontSize: '0.98rem' }}>
                  Today's Schedule
                </h2>
              </div>
              <span className="text-sa-muted" style={{ fontSize: '0.78rem', fontWeight: 500 }}>
                Mon, 26 May 2025
              </span>
            </div>

            {/* Schedule Timeline Entries */}
            <div className="d-flex flex-column gap-2.5 flex-grow-1">
              {scheduleList.map((item, idx) => (
                <div
                  key={idx}
                  className="d-flex align-items-center gap-2.5 py-1 px-1 rounded-2 transition-all hover-schedule-row"
                >
                  <span
                    className="text-sa-muted fw-semibold flex-shrink-0"
                    style={{ fontSize: '0.78rem', width: '70px' }}
                  >
                    {item.time}
                  </span>
                  <span
                    className="rounded-circle flex-shrink-0"
                    style={{ width: '8px', height: '8px', backgroundColor: item.color }}
                  />
                  <span className="text-sa-charcoal fw-medium text-truncate" style={{ fontSize: '0.84rem' }}>
                    {item.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* FACULTY OPERATIONS: LEAVES, WORKING TIME & SALARY */}
      <div className="d-flex flex-column gap-3 pt-2">
        {/* Section Header */}
        <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-2.5 pb-1 border-bottom" style={{ borderColor: 'rgba(220, 38, 38, 0.12)' }}>
          <div className="d-flex align-items-center gap-2.5">
            <div
              className="rounded-3 d-flex align-items-center justify-content-center text-white shadow-xs"
              style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #8B1216 0%, #B91C1C 100%)' }}
            >
              <Users size={19} />
            </div>
            <div>
              <h2 className="brand-font fw-bold text-sa-charcoal m-0" style={{ fontSize: '1.20rem', lineHeight: 1.25 }}>
                Faculty Operations: Working Time, Leaves & Daily Logs
              </h2>
              <span className="text-sa-muted" style={{ fontSize: '0.80rem' }}>
                Real-time tracking of staff working hours, teacher classroom activity logs, and payroll records
              </span>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => navigate('/admin/teachers/attendance')}
              className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1.5 rounded-2"
              style={{ fontSize: '0.78rem', fontWeight: 600 }}
            >
              <Clock size={13} />
              <span>Full Attendance</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/teachers/leave-approvals')}
              className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1.5 rounded-2"
              style={{ fontSize: '0.78rem', fontWeight: 600 }}
            >
              <Calendar size={13} />
              <span>Leave Approvals</span>
              {pendingLeaves.length > 0 && (
                <span className="badge rounded-pill bg-danger ms-1" style={{ fontSize: '10px' }}>
                  {pendingLeaves.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/teacher-activities')}
              className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1.5 rounded-2"
              style={{ fontSize: '0.78rem', fontWeight: 600 }}
            >
              <FileText size={13} />
              <span>Daily Log Activity</span>
              {teacherActivities.length > 0 && (
                <span className="badge rounded-pill bg-danger ms-1" style={{ fontSize: '10px' }}>
                  {teacherActivities.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/teachers/salary')}
              className="btn btn-sm text-white d-inline-flex align-items-center gap-1.5 rounded-2 shadow-xs"
              style={{ backgroundColor: '#8B1216', fontSize: '0.78rem', fontWeight: 600 }}
            >
              <ReceiptIndianRupee size={13} />
              <span>Salary Register</span>
            </button>
          </div>
        </div>

        {/* 3 Cards: Working Time, Leaves, Salary */}
        <div className="row g-3 g-xl-4">
          {/* Card 1: Faculty Working Time & Attendance */}
          <div className="col-12 col-lg-4">
            <div className="sa-card bg-white p-3.5 p-xl-4 rounded-3 border h-100 d-flex flex-column">
              {/* Header */}
              <div className="d-flex align-items-center justify-content-between mb-2.5">
                <div className="d-flex align-items-center gap-2">
                  <Clock size={18} style={{ color: 'var(--sa-primary-red)' }} />
                  <h3 className="m-0 fw-bold text-sa-charcoal" style={{ fontSize: '0.98rem' }}>
                    Faculty Working Time
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/admin/teachers/attendance')}
                  className="btn btn-link p-0 text-decoration-none fw-semibold"
                  style={{ fontSize: '0.78rem', color: 'var(--sa-primary-red)' }}
                >
                  View Tracker &rarr;
                </button>
              </div>

              {/* KPI Pill */}
              <div
                className="d-flex align-items-center justify-content-between p-2 rounded-2 mb-2.5"
                style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
              >
                <div className="text-center flex-grow-1 border-end">
                  <div className="text-sa-muted" style={{ fontSize: '0.68rem', fontWeight: 600 }}>ON DUTY</div>
                  <div className="fw-bold brand-font" style={{ fontSize: '1.1rem', color: '#166534' }}>
                    {presentTeachers} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748B' }}>/ {totalTeachers}</span>
                  </div>
                </div>
                <div className="text-center flex-grow-1 border-end">
                  <div className="text-sa-muted" style={{ fontSize: '0.68rem', fontWeight: 600 }}>WORKING NOW</div>
                  <div className="fw-bold brand-font" style={{ fontSize: '1.1rem', color: '#D97706' }}>
                    {workingTeachers}
                  </div>
                </div>
                <div className="text-center flex-grow-1">
                  <div className="text-sa-muted" style={{ fontSize: '0.68rem', fontWeight: 600 }}>HOURS TODAY</div>
                  <div className="fw-bold brand-font" style={{ fontSize: '1.1rem', color: '#8B1216' }}>
                    {totalFacultyHoursToday.toFixed(1)}h
                  </div>
                </div>
              </div>

              {/* Attendance Entries */}
              <div className="d-flex flex-column gap-2 flex-grow-1 overflow-auto" style={{ maxHeight: '220px' }}>
                {facultyAttendance.length === 0 ? (
                  <div className="text-center py-4 text-sa-muted flex-grow-1 d-flex flex-column align-items-center justify-content-center">
                    <Clock size={24} className="text-muted mb-1.5 opacity-50" />
                    <span style={{ fontSize: '0.80rem' }}>No teacher punches recorded today</span>
                    <button
                      type="button"
                      onClick={() => navigate('/admin/teachers/attendance')}
                      className="btn btn-sm btn-link p-0 mt-1"
                      style={{ fontSize: '0.76rem', color: '#8B1216' }}
                    >
                      Record Check-In Manually
                    </button>
                  </div>
                ) : (
                  facultyAttendance.slice(0, 4).map((record, idx) => {
                    const isWorking = record.status === 'Working';
                    const isPresent = record.status === 'Present';
                    return (
                      <div
                        key={record.id || idx}
                        className="d-flex align-items-center justify-content-between p-2 rounded-2"
                        style={{ backgroundColor: '#FCFDFE', border: '1px solid #F1F5F9' }}
                      >
                        <div className="min-w-0 pe-2">
                          <div className="fw-semibold text-sa-charcoal text-truncate" style={{ fontSize: '0.82rem', lineHeight: 1.25 }}>
                            {record.teacher_name || record.name || 'Faculty Member'}
                          </div>
                          <div className="text-sa-muted small mt-0.5" style={{ fontSize: '0.70rem' }}>
                            In: {record.check_in_time ? new Date(record.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'} • Out: {record.check_out_time ? new Date(record.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (isWorking ? 'In Progress' : '--')}
                          </div>
                        </div>
                        <div className="d-flex align-items-center gap-1.5 flex-shrink-0">
                          <span
                            className="badge rounded-pill fw-semibold px-2 py-0.5"
                            style={{
                              fontSize: '0.68rem',
                              backgroundColor: isWorking ? '#FEF3C7' : isPresent ? '#EAF6EF' : '#FEE2E2',
                              color: isWorking ? '#B45309' : isPresent ? '#168554' : '#DC2626'
                            }}
                          >
                            {record.status || 'Present'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Card Footer */}
              <div className="mt-2.5 pt-2 border-top d-flex align-items-center justify-content-between text-sa-muted" style={{ fontSize: '0.74rem' }}>
                <span>Daily shift standard: 8h/day</span>
                <span className="fw-semibold text-sa-charcoal">{presentTeachers} of {totalTeachers} present today</span>
              </div>
            </div>
          </div>

          {/* Card 2: Faculty Leaves */}
          <div className="col-12 col-lg-4">
            <div className="sa-card bg-white p-3.5 p-xl-4 rounded-3 border h-100 d-flex flex-column">
              {/* Header */}
              <div className="d-flex align-items-center justify-content-between mb-2.5">
                <div className="d-flex align-items-center gap-2">
                  <Calendar size={18} style={{ color: 'var(--sa-primary-red)' }} />
                  <h3 className="m-0 fw-bold text-sa-charcoal" style={{ fontSize: '0.98rem' }}>
                    Faculty Leaves
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/admin/teachers/leave-approvals')}
                  className="btn btn-link p-0 text-decoration-none fw-semibold"
                  style={{ fontSize: '0.78rem', color: 'var(--sa-primary-red)' }}
                >
                  Review All &rarr;
                </button>
              </div>

              {/* KPI Pill */}
              <div
                className="d-flex align-items-center justify-content-between p-2 rounded-2 mb-2.5"
                style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
              >
                <div className="text-center flex-grow-1 border-end">
                  <div className="text-sa-muted" style={{ fontSize: '0.68rem', fontWeight: 600 }}>PENDING APPROVAL</div>
                  <div className="fw-bold brand-font" style={{ fontSize: '1.1rem', color: pendingLeaves.length > 0 ? '#DC2626' : '#166534' }}>
                    {pendingLeaves.length}
                  </div>
                </div>
                <div className="text-center flex-grow-1 border-end">
                  <div className="text-sa-muted" style={{ fontSize: '0.68rem', fontWeight: 600 }}>APPROVED</div>
                  <div className="fw-bold brand-font" style={{ fontSize: '1.1rem', color: '#166534' }}>
                    {approvedLeavesCount.length}
                  </div>
                </div>
                <div className="text-center flex-grow-1">
                  <div className="text-sa-muted" style={{ fontSize: '0.68rem', fontWeight: 600 }}>TOTAL REQUESTS</div>
                  <div className="fw-bold brand-font text-sa-charcoal" style={{ fontSize: '1.1rem' }}>
                    {facultyLeaves.length}
                  </div>
                </div>
              </div>

              {/* Leaves List with Quick Action */}
              <div className="d-flex flex-column gap-2 flex-grow-1 overflow-auto" style={{ maxHeight: '220px' }}>
                {facultyLeaves.length === 0 ? (
                  <div className="text-center py-4 text-sa-muted flex-grow-1 d-flex flex-column align-items-center justify-content-center">
                    <Calendar size={24} className="text-muted mb-1.5 opacity-50" />
                    <span style={{ fontSize: '0.80rem' }}>No leave requests submitted yet</span>
                    <span className="text-muted" style={{ fontSize: '0.72rem' }}>All faculty members on active duty</span>
                  </div>
                ) : (
                  facultyLeaves.slice(0, 4).map((leave, idx) => {
                    const isPending = (leave.status || '').toLowerCase() === 'pending';
                    const isApproved = (leave.status || '').toLowerCase() === 'approved';
                    const fromDateStr = leave.from_date ? new Date(leave.from_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '';
                    const toDateStr = leave.to_date ? new Date(leave.to_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '';
                    return (
                      <div
                        key={leave.id || idx}
                        className="d-flex align-items-center justify-content-between p-2 rounded-2"
                        style={{ backgroundColor: '#FCFDFE', border: '1px solid #F1F5F9' }}
                      >
                        <div className="min-w-0 pe-2">
                          <div className="fw-semibold text-sa-charcoal text-truncate" style={{ fontSize: '0.82rem', lineHeight: 1.25 }}>
                            {leave.teacher_name || 'Faculty Member'}
                          </div>
                          <div className="text-sa-muted small mt-0.5 text-truncate" style={{ fontSize: '0.70rem' }} title={leave.reason}>
                            <span className="fw-semibold text-dark">{leave.leave_type || 'Leave'}</span> • {fromDateStr} to {toDateStr} ({leave.number_of_days}d)
                          </div>
                        </div>

                        {/* Status or Instant Action Buttons */}
                        <div className="d-flex align-items-center gap-1.5 flex-shrink-0">
                          {isPending ? (
                            <div className="d-flex align-items-center gap-1">
                              <button
                                type="button"
                                disabled={leaveActionLoading}
                                onClick={() => handleQuickLeaveAction(leave.id, 'Approved')}
                                className="btn btn-sm btn-success p-1 d-flex align-items-center justify-content-center shadow-xs"
                                style={{ width: '24px', height: '24px', borderRadius: '6px' }}
                                title="Quick Approve Leave"
                              >
                                <Check size={14} />
                              </button>
                              <button
                                type="button"
                                disabled={leaveActionLoading}
                                onClick={() => handleQuickLeaveAction(leave.id, 'Rejected')}
                                className="btn btn-sm btn-outline-danger p-1 d-flex align-items-center justify-content-center shadow-xs"
                                style={{ width: '24px', height: '24px', borderRadius: '6px' }}
                                title="Quick Reject Leave"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <span
                              className="badge rounded-pill fw-semibold px-2 py-0.5"
                              style={{
                                fontSize: '0.68rem',
                                backgroundColor: isApproved ? '#EAF6EF' : '#FEE2E2',
                                color: isApproved ? '#168554' : '#DC2626'
                              }}
                            >
                              {leave.status}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Card Footer */}
              <div className="mt-2.5 pt-2 border-top d-flex align-items-center justify-content-between text-sa-muted" style={{ fontSize: '0.74rem' }}>
                <span className="text-truncate">Instant 1-click approvals supported</span>
                <button
                  type="button"
                  onClick={() => navigate('/admin/teachers/leave-approvals')}
                  className="btn btn-link p-0 text-decoration-none fw-semibold"
                  style={{ fontSize: '0.74rem', color: '#8B1216' }}
                >
                  Manage Approvals &rarr;
                </button>
              </div>
            </div>
          </div>

          {/* Card 3: Faculty Salary & Payroll */}
          <div className="col-12 col-lg-4">
            <div className="sa-card bg-white p-3.5 p-xl-4 rounded-3 border h-100 d-flex flex-column">
              {/* Header */}
              <div className="d-flex align-items-center justify-content-between mb-2.5">
                <div className="d-flex align-items-center gap-2">
                  <ReceiptIndianRupee size={18} style={{ color: '#168554' }} />
                  <h3 className="m-0 fw-bold text-sa-charcoal" style={{ fontSize: '0.98rem' }}>
                    Faculty Salary & Payroll
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/admin/teachers/salary')}
                  className="btn btn-link p-0 text-decoration-none fw-semibold"
                  style={{ fontSize: '0.78rem', color: 'var(--sa-primary-red)' }}
                >
                  Salary Register &rarr;
                </button>
              </div>

              {/* KPI Pill */}
              <div
                className="d-flex align-items-center justify-content-between p-2 rounded-2 mb-2"
                style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
              >
                <div className="text-center flex-grow-1 border-end">
                  <div className="text-sa-muted" style={{ fontSize: '0.68rem', fontWeight: 600 }}>TOTAL PAYROLL</div>
                  <div className="fw-bold brand-font text-sa-charcoal" style={{ fontSize: '1.05rem' }}>
                    ₹{totalSalaryLiability.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="text-center flex-grow-1 border-end">
                  <div className="text-sa-muted" style={{ fontSize: '0.68rem', fontWeight: 600 }}>DISBURSED</div>
                  <div className="fw-bold brand-font" style={{ fontSize: '1.05rem', color: '#168554' }}>
                    ₹{totalSalaryDisbursed.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="text-center flex-grow-1">
                  <div className="text-sa-muted" style={{ fontSize: '0.68rem', fontWeight: 600 }}>PENDING</div>
                  <div className="fw-bold brand-font" style={{ fontSize: '1.05rem', color: totalSalaryPending > 0 ? '#DC2626' : '#64748B' }}>
                    ₹{totalSalaryPending.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-2.5 px-0.5">
                <div className="d-flex align-items-center justify-content-between small text-muted mb-1" style={{ fontSize: '0.70rem' }}>
                  <span>Disbursement Progress</span>
                  <span className="fw-bold text-dark">{salaryDisbursedPercent}% Completed</span>
                </div>
                <div className="progress" style={{ height: '5px', backgroundColor: '#F1F5F9', borderRadius: '3px' }}>
                  <div
                    className="progress-bar"
                    style={{
                      width: `${salaryDisbursedPercent}%`,
                      backgroundColor: '#168554',
                      borderRadius: '3px'
                    }}
                  />
                </div>
              </div>

              {/* Salaries List */}
              <div className="d-flex flex-column gap-2 flex-grow-1 overflow-auto" style={{ maxHeight: '185px' }}>
                {facultySalaries.length === 0 ? (
                  <div className="text-center py-4 text-sa-muted flex-grow-1 d-flex flex-column align-items-center justify-content-center">
                    <ReceiptIndianRupee size={24} className="text-muted mb-1.5 opacity-50" />
                    <span style={{ fontSize: '0.80rem' }}>No salary records generated for this month</span>
                    <button
                      type="button"
                      onClick={() => navigate('/admin/teachers/salary')}
                      className="btn btn-sm btn-link p-0 mt-1"
                      style={{ fontSize: '0.76rem', color: '#8B1216' }}
                    >
                      Generate Drafts in Salary Register
                    </button>
                  </div>
                ) : (
                  facultySalaries.slice(0, 4).map((sal, idx) => {
                    const isDisbursed = sal.status === 'Disbursed';
                    const isPartial = sal.status === 'Partially Paid';
                    return (
                      <div
                        key={sal.id || idx}
                        className="d-flex align-items-center justify-content-between p-2 rounded-2"
                        style={{ backgroundColor: '#FCFDFE', border: '1px solid #F1F5F9' }}
                      >
                        <div className="min-w-0 pe-2">
                          <div className="fw-semibold text-sa-charcoal text-truncate" style={{ fontSize: '0.82rem', lineHeight: 1.25 }}>
                            {sal.teacherName || 'Faculty Member'}
                          </div>
                          <div className="text-sa-muted small mt-0.5" style={{ fontSize: '0.70rem' }}>
                            Net: ₹{(Number(sal.netPayable) || 0).toLocaleString('en-IN')} • Pend: ₹{(Number(sal.amountPending) || 0).toLocaleString('en-IN')}
                          </div>
                        </div>
                        <div className="d-flex align-items-center gap-1.5 flex-shrink-0">
                          <span
                            className="badge rounded-pill fw-semibold px-2 py-0.5"
                            style={{
                              fontSize: '0.68rem',
                              backgroundColor: isDisbursed ? '#EAF6EF' : isPartial ? '#FEF3C7' : '#FEE2E2',
                              color: isDisbursed ? '#168554' : isPartial ? '#B45309' : '#DC2626'
                            }}
                          >
                            {sal.status || 'Pending'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Card Footer */}
              <div className="mt-2.5 pt-2 border-top d-flex align-items-center justify-content-between text-sa-muted" style={{ fontSize: '0.74rem' }}>
                <span>Payroll cycle: Monthly 1st-30th</span>
                <button
                  type="button"
                  onClick={() => navigate('/admin/teachers/salary')}
                  className="btn btn-link p-0 text-decoration-none fw-semibold"
                  style={{ fontSize: '0.74rem', color: '#8B1216' }}
                >
                  Disburse &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Row: Teacher Daily Activity Logs */}
        <div className="mt-3.5 pt-3 border-top">
          <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-2.5 mb-3">
            <div className="d-flex align-items-center gap-2.5">
              <div
                className="rounded-2 d-flex align-items-center justify-content-center shadow-xs flex-shrink-0"
                style={{ width: '34px', height: '34px', backgroundColor: '#FDF0F0', color: '#8B1216', border: '1px solid #F5C2C4' }}
              >
                <FileText size={17} />
              </div>
              <div>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <h3 className="m-0 fw-bold text-sa-charcoal" style={{ fontSize: '0.98rem' }}>
                    Teacher Daily Activity Logs
                  </h3>
                  <span
                    className="badge rounded-pill fw-semibold"
                    style={{ fontSize: '0.70rem', backgroundColor: '#FDF0F0', color: '#8B1216', border: '1px solid #F5C2C4' }}
                  >
                    {filteredTeacherActivities.length} Activities Recorded
                  </span>
                  <span className="badge rounded-pill bg-success-subtle text-success fw-medium" style={{ fontSize: '0.68rem' }}>
                    ● Live Synced
                  </span>
                </div>
                <span className="text-sa-muted" style={{ fontSize: '0.74rem' }}>
                  Teaching topics, lecture duration, and classroom progress logged by teachers across branches
                </span>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2 flex-wrap">
              {/* Branch Quick Filter Tabs */}
              <div className="d-flex align-items-center bg-light p-1 rounded-2 border" style={{ fontSize: '0.74rem' }}>
                <button
                  type="button"
                  onClick={() => setActivityBranchFilter('Current Campus')}
                  className={`btn btn-sm py-0.5 px-2 rounded-1 fw-semibold border-0 ${activityBranchFilter === 'Current Campus' ? 'bg-white text-sa-charcoal shadow-xs' : 'text-sa-muted'}`}
                  title={`View activities for active campus: ${selectedCampus}`}
                >
                  📍 Current Campus ({selectedCampus === BRANCH_MANGALWAR ? 'Mangalwar Peth' : 'Tarabai Park'})
                </button>
                <button
                  type="button"
                  onClick={() => setActivityBranchFilter('Tarabai Park')}
                  className={`btn btn-sm py-0.5 px-2 rounded-1 fw-semibold border-0 ${activityBranchFilter === 'Tarabai Park' ? 'bg-white text-sa-maroon shadow-xs' : 'text-sa-muted'}`}
                >
                  Tarabai Park
                </button>
                <button
                  type="button"
                  onClick={() => setActivityBranchFilter('Mangalwar Peth')}
                  className={`btn btn-sm py-0.5 px-2 rounded-1 fw-semibold border-0 ${activityBranchFilter === 'Mangalwar Peth' ? 'bg-white text-teal shadow-xs' : 'text-sa-muted'}`}
                  style={{ color: activityBranchFilter === 'Mangalwar Peth' ? '#0D9488' : undefined }}
                >
                  Mangalwar Peth
                </button>
                <button
                  type="button"
                  onClick={() => setActivityBranchFilter('All')}
                  className={`btn btn-sm py-0.5 px-2 rounded-1 fw-semibold border-0 ${activityBranchFilter === 'All' ? 'bg-white text-sa-charcoal shadow-xs' : 'text-sa-muted'}`}
                >
                  All Campuses
                </button>
              </div>

              <button
                type="button"
                onClick={() => navigate('/admin/teacher-activities', { state: { branch: selectedCampus } })}
                className="btn btn-sm btn-light border text-sa-charcoal d-inline-flex align-items-center gap-1.5 fw-semibold"
                style={{ fontSize: '0.75rem', height: '30px' }}
                title="Open Daily Log Activity Management"
              >
                <span>Full Logs Table</span>
                <ChevronRight size={13} />
              </button>
            </div>
          </div>

          {/* Activities List / Table */}
          {filteredTeacherActivities.length === 0 ? (
            <div className="text-center py-4 bg-light rounded-3 border text-sa-muted d-flex flex-column align-items-center justify-content-center">
              <FileText size={24} className="text-muted mb-1.5 opacity-50" />
              <span className="fw-semibold" style={{ fontSize: '0.84rem', color: '#475569' }}>
                No teacher activity logs submitted yet
              </span>
              <span style={{ fontSize: '0.74rem' }}>
                When teachers log lecture activities, topics taught, and periods from their portal, they will instantly appear here.
              </span>
            </div>
          ) : (
            <div className="table-responsive border rounded-3 overflow-hidden bg-white shadow-xs">
              <table className="table table-hover align-middle m-0" style={{ fontSize: '0.80rem' }}>
                <thead style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <tr className="text-sa-muted text-uppercase" style={{ fontSize: '0.68rem', letterSpacing: '0.04em' }}>
                    <th className="fw-semibold py-2 ps-3">Teacher / Faculty</th>
                    <th className="fw-semibold py-2">Campus & Batch</th>
                    <th className="fw-semibold py-2">Subject</th>
                    <th className="fw-semibold py-2">Topic Taught & Chapter</th>
                    <th className="fw-semibold py-2 text-center">Periods / Hours</th>
                    <th className="fw-semibold py-2">Activity Date</th>
                    <th className="fw-semibold py-2 pe-3 text-end">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeacherActivities.slice(0, 6).map((act, idx) => {
                    const rawBranch = (act.branch || '').toLowerCase();
                    const rawBatch = (act.batch || '').toLowerCase();
                    const isMangal = rawBranch.includes('mangal') || rawBatch.includes('mangal');
                    const isMorning = rawBatch.includes('morning');
                    const isEvening = rawBatch.includes('evening');
                    const isCompleted = (act.status || '').toLowerCase() === 'completed';

                    const facultyName = act.teacher_name || act.teacherName || 'Faculty Member';
                    const initials = facultyName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

                    return (
                      <tr key={act.id || idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td className="py-2 ps-3">
                          <div className="d-flex align-items-center gap-2">
                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                              style={{
                                width: '28px',
                                height: '28px',
                                fontSize: '11px',
                                backgroundColor: isMangal ? '#CCFBF1' : '#FEE2E2',
                                color: isMangal ? '#0F766E' : '#991B1B'
                              }}
                            >
                              {initials}
                            </div>
                            <div>
                              <div className="fw-bold text-sa-charcoal" style={{ fontSize: '0.82rem', lineHeight: 1.2 }}>
                                {facultyName}
                              </div>
                              <span className="text-sa-muted small" style={{ fontSize: '0.68rem' }}>
                                {act.activity || 'Classroom Lecture'}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-2">
                          <div className="d-flex flex-column gap-0.5">
                            <span
                              className="badge rounded-pill fw-semibold text-truncate d-inline-block"
                              style={{
                                maxWidth: '140px',
                                fontSize: '0.68rem',
                                backgroundColor: isMangal ? '#F0FDFA' : '#FDF0F0',
                                color: isMangal ? '#0D9488' : '#8B1216',
                                border: isMangal ? '1px solid #99F6E4' : '1px solid #F5C2C4'
                              }}
                            >
                              {isMangal ? 'Mangalwar Peth' : 'Tarabai Park'}
                            </span>
                            <div className="d-flex align-items-center gap-1 mt-0.5">
                              <span className="text-sa-charcoal fw-semibold" style={{ fontSize: '0.72rem' }}>
                                {act.batch ? act.batch.replace(/tarabai\s*park|mangalwar\s*peth|mangalvar\s*peth/gi, '').trim() || act.batch : 'General Batch'}
                              </span>
                              {isMorning && (
                                <span className="badge bg-warning-subtle text-warning-emphasis p-0 px-1" style={{ fontSize: '9.5px' }}>
                                  ☀️ Morning
                                </span>
                              )}
                              {isEvening && (
                                <span className="badge bg-purple-subtle text-primary-emphasis p-0 px-1" style={{ fontSize: '9.5px', backgroundColor: '#F3E8FF', color: '#6B21A8' }}>
                                  🌙 Evening
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-2">
                          <span className="fw-semibold text-sa-charcoal" style={{ fontSize: '0.78rem' }}>
                            {act.subject || 'Physics'}
                          </span>
                        </td>

                        <td className="py-2" style={{ maxWidth: '280px' }}>
                          <div className="fw-semibold text-sa-charcoal text-truncate" title={act.topic_taught || act.topicTaught}>
                            {act.topic_taught || act.topicTaught || 'Curriculum Topic'}
                          </div>
                          {act.chapter && (
                            <div className="text-sa-muted text-truncate" style={{ fontSize: '0.69rem' }} title={act.chapter}>
                              {act.chapter}
                            </div>
                          )}
                        </td>

                        <td className="py-2 text-center">
                          <span className="fw-bold brand-font text-sa-charcoal" style={{ fontSize: '0.84rem' }}>
                            {act.periods || 1} <span style={{ fontSize: '0.70rem', fontWeight: 500, color: '#64748B' }}>periods</span>
                          </span>
                          <div className="text-sa-muted" style={{ fontSize: '0.68rem' }}>
                            {act.hours || 1.0} hrs
                          </div>
                        </td>

                        <td className="py-2">
                          <div className="text-sa-charcoal fw-semibold" style={{ fontSize: '0.74rem' }}>
                            {act.activity_date || act.target_date || 'Today'}
                          </div>
                          <div className="text-sa-muted" style={{ fontSize: '0.68rem' }}>
                            {act.time_slot || act.timeSlot || '08:30 AM'}
                          </div>
                        </td>

                        <td className="py-2 pe-3 text-end">
                          <span
                            className="badge rounded-pill fw-semibold px-2 py-0.5"
                            style={{
                              fontSize: '0.68rem',
                              backgroundColor: isCompleted ? '#EAF6EF' : '#FEF3C7',
                              color: isCompleted ? '#168554' : '#B45309',
                              border: isCompleted ? '1px solid #BBF7D0' : '1px solid #FDE68A'
                            }}
                          >
                            {isCompleted ? '✓ Completed' : '⏳ In Progress'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer link to complete daily activity log page */}
          <div className="mt-2.5 d-flex align-items-center justify-content-between text-sa-muted" style={{ fontSize: '0.74rem' }}>
            <span>Showing recent {Math.min(6, filteredTeacherActivities.length)} of {filteredTeacherActivities.length} activities</span>
            <button
              type="button"
              onClick={() => navigate('/admin/teacher-activities', { state: { branch: selectedCampus } })}
              className="btn btn-link p-0 text-decoration-none fw-semibold"
              style={{ fontSize: '0.75rem', color: '#8B1216' }}
            >
              Open Daily Log Activity Panel &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Row 3: Activity & Inventory (3 Cards) */}
      <div className="row g-3 g-xl-4">
        {/* Recent Admissions */}
        <div className="col-12 col-lg-4">
          <div className="sa-card bg-white p-3.5 p-xl-4 rounded-3 border h-100 d-flex flex-column">
            {/* Header */}
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="d-flex align-items-center gap-2">
                <UserPlus size={18} style={{ color: 'var(--sa-primary-red)' }} />
                <h2 className="m-0 fw-bold text-sa-charcoal" style={{ fontSize: '0.98rem' }}>
                  Recent Admissions
                </h2>
              </div>
              <button
                onClick={() => navigate('/admin/students')}
                className="btn btn-link p-0 text-decoration-none fw-semibold"
                style={{ fontSize: '0.78rem', color: 'var(--sa-primary-red)' }}
              >
                View All &rarr;
              </button>
            </div>

            {/* Table */}
            <div className="table-responsive flex-grow-1">
              <table className="table table-sm table-borderless align-middle m-0" style={{ fontSize: '0.82rem' }}>
                <thead>
                  <tr className="text-sa-muted text-uppercase" style={{ fontSize: '0.70rem', letterSpacing: '0.04em', borderBottom: '1px solid #F1F5F9' }}>
                    <th className="fw-semibold pb-2">Student ID</th>
                    <th className="fw-semibold pb-2">Student Name</th>
                    <th className="fw-semibold pb-2">Class</th>
                    <th className="fw-semibold pb-2">Admission Date</th>
                    <th className="fw-semibold pb-2 text-end">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAdmissions.map((row) => (
                    <tr key={row.id} style={{ borderBottom: '1px solid #F8FAFC' }}>
                      <td className="text-sa-muted py-2">{row.id}</td>
                      <td className="py-2">
                        <span
                          className="fw-semibold text-sa-charcoal d-block cursor-pointer hover-underline"
                          style={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/admin/students/${row.id}`)}
                        >
                          {row.name}
                        </span>
                        {Number(row.discountAmount) > 0 && (
                          <div className="small mt-0.5" style={{ fontSize: '0.69rem', lineHeight: 1.25 }}>
                            {row.discountStatus === 'APPROVED' ? (
                              <span className="text-success fw-semibold">
                                ✓ ₹{Number(row.discountAmount).toLocaleString()} Disc • By: <strong>{row.discountApprovedBy || 'Superadmin'}</strong>
                              </span>
                            ) : (
                              <span className="text-warning-emphasis fw-semibold">
                                ⏳ ₹{Number(row.discountAmount).toLocaleString()} Disc (Pending Superadmin)
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="text-sa-muted py-2">{row.class}</td>
                      <td className="text-sa-muted py-2">{row.date}</td>
                      <td className="text-end py-2">
                        <span
                          className="badge rounded-pill fw-semibold px-2 py-0.5"
                          style={{ backgroundColor: '#EAF6EF', color: '#168554', fontSize: '0.70rem' }}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Books & Stock Inventory */}
        <div className="col-12 col-lg-4">
          <div className="sa-card bg-white p-3.5 p-xl-4 rounded-3 border h-100 d-flex flex-column">
            {/* Header */}
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="d-flex align-items-center gap-2">
                <BookMarked size={18} style={{ color: 'var(--sa-primary-red)' }} />
                <h2 className="m-0 fw-bold text-sa-charcoal" style={{ fontSize: '0.98rem' }}>
                  Books & Stock Inventory
                </h2>
              </div>
              <button
                onClick={() => navigate('/admin/books/stock')}
                className="btn btn-link p-0 text-decoration-none fw-semibold"
                style={{ fontSize: '0.78rem', color: 'var(--sa-primary-red)' }}
              >
                Manage Stock &rarr;
              </button>
            </div>

            {/* Quick Stats Pill */}
            <div className="d-flex align-items-center justify-content-between p-2 rounded-2 mb-2.5" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
              <div className="text-center flex-grow-1 border-end">
                <div className="text-sa-muted" style={{ fontSize: '0.68rem', fontWeight: 600 }}>TOTAL COPIES</div>
                <div className="fw-bold text-sa-charcoal brand-font" style={{ fontSize: '1.05rem' }}>
                  {inventoryItems.reduce((acc, it) => acc + (Number(it.in_stock) || 0), 0)}
                </div>
              </div>
              <div className="text-center flex-grow-1 border-end">
                <div className="text-sa-muted" style={{ fontSize: '0.68rem', fontWeight: 600 }}>THEORY BOOKS</div>
                <div className="fw-bold brand-font" style={{ fontSize: '1.05rem', color: '#8B1216' }}>
                  {inventoryItems.filter(it => (it.category || '').toLowerCase() === 'theory').reduce((acc, it) => acc + (Number(it.in_stock) || 0), 0)}
                </div>
              </div>
              <div className="text-center flex-grow-1">
                <div className="text-sa-muted" style={{ fontSize: '0.68rem', fontWeight: 600 }}>CET BOOKS</div>
                <div className="fw-bold brand-font" style={{ fontSize: '1.05rem', color: '#D97706' }}>
                  {inventoryItems.filter(it => (it.category || '').toLowerCase() === 'cet').reduce((acc, it) => acc + (Number(it.in_stock) || 0), 0)}
                </div>
              </div>
            </div>

            {/* Book Subjects Stock List */}
            <div className="d-flex flex-column gap-2 flex-grow-1 overflow-auto" style={{ maxHeight: '215px' }}>
              {inventoryItems.length > 0 ? (
                inventoryItems.slice(0, 6).map((item, idx) => {
                  const isLow = Number(item.in_stock) <= Number(item.reorder_level);
                  const isCET = (item.category || '').toLowerCase() === 'cet';
                  return (
                    <div
                      key={item.id || idx}
                      className="d-flex align-items-center justify-content-between py-1.5 px-2 rounded-2"
                      style={{ backgroundColor: '#FCFDFE', border: '1px solid #F1F5F9' }}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <span
                          className="badge rounded-1 px-1.5 py-0.5 fw-bold"
                          style={{
                            fontSize: '0.66rem',
                            backgroundColor: isCET ? '#FEF3C7' : '#FEE2E2',
                            color: isCET ? '#B45309' : '#991B1B'
                          }}
                        >
                          {item.category || (isCET ? 'CET' : 'Theory')}
                        </span>
                        <span className="text-sa-charcoal fw-semibold text-truncate" style={{ fontSize: '0.82rem', maxWidth: '140px' }}>
                          {item.subject ? `${item.subject}` : item.title}
                        </span>
                      </div>
                      <div className="d-flex align-items-center gap-1.5">
                        <span className="fw-bold" style={{ fontSize: '0.82rem', color: isLow ? '#DC2626' : '#168554' }}>
                          {item.in_stock} Copies
                        </span>
                        {isLow && (
                          <span className="badge rounded-pill bg-danger-subtle text-danger" style={{ fontSize: '0.65rem' }}>
                            Low
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center text-sa-muted py-3 small">
                  Loading books & stock inventory...
                </div>
              )}
            </div>

            {/* Quick Action Footer */}
            <div className="mt-3 pt-2.5 border-top d-flex gap-2">
              <button
                type="button"
                onClick={() => navigate('/admin/books/stock')}
                className="btn btn-sm btn-outline-secondary w-50 d-flex align-items-center justify-content-center gap-1 rounded-2"
                style={{ fontSize: '0.76rem', fontWeight: 600 }}
              >
                <BookOpen size={13} />
                <span>Books Stock</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/books/delivery')}
                className="btn btn-sm text-white w-50 d-flex align-items-center justify-content-center gap-1 rounded-2 shadow-xs"
                style={{ backgroundColor: '#8B1216', fontSize: '0.76rem', fontWeight: 600 }}
              >
                <Truck size={13} />
                <span>Books Delivery</span>
              </button>
            </div>
          </div>
        </div>

        {/* Upcoming Examinations */}
        <div className="col-12 col-lg-4">
          <div className="sa-card bg-white p-3.5 p-xl-4 rounded-3 border h-100 d-flex flex-column">
            {/* Header */}
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="d-flex align-items-center gap-2">
                <FileText size={18} style={{ color: 'var(--sa-primary-red)' }} />
                <h2 className="m-0 fw-bold text-sa-charcoal" style={{ fontSize: '0.98rem' }}>
                  Upcoming Examinations
                </h2>
              </div>
              <button
                onClick={() => navigate('/admin/exams')}
                className="btn btn-link p-0 text-decoration-none fw-semibold"
                style={{ fontSize: '0.78rem', color: 'var(--sa-primary-red)' }}
              >
                View All &rarr;
              </button>
            </div>

            {/* Exams List */}
            <div className="d-flex flex-column gap-2.5 flex-grow-1">
              {upcomingExams.map((exam, idx) => (
                <div
                  key={idx}
                  className="d-flex align-items-center justify-content-between py-1 px-1"
                >
                  <div className="d-flex align-items-center gap-2.5">
                    {/* Date Block */}
                    <div
                      className="d-flex flex-column align-items-center justify-content-center rounded-2 border flex-shrink-0"
                      style={{ width: '42px', height: '42px', backgroundColor: '#FAFAF9', borderColor: '#E7E5E4' }}
                    >
                      <span className="fw-extrabold text-sa-charcoal lh-1" style={{ fontSize: '0.88rem' }}>
                        {exam.day}
                      </span>
                      <span className="text-sa-muted fw-bold" style={{ fontSize: '0.62rem', letterSpacing: '0.05em' }}>
                        {exam.month}
                      </span>
                    </div>

                    {/* Exam Name & Class */}
                    <div>
                      <div className="fw-semibold text-sa-charcoal" style={{ fontSize: '0.84rem', lineHeight: 1.2 }}>
                        {exam.title}
                      </div>
                      <span className="text-sa-muted" style={{ fontSize: '0.74rem' }}>
                        {exam.class}
                      </span>
                    </div>
                  </div>

                  {/* Countdown Badge */}
                  <span
                    className="badge rounded-2 fw-semibold px-2 py-1 flex-shrink-0"
                    style={{ backgroundColor: '#FEF8EB', color: '#D97718', fontSize: '0.74rem' }}
                  >
                    {exam.countdown}
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
