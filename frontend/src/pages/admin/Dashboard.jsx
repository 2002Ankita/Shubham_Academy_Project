import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import studentService from '../../services/studentService';
import attendanceService from '../../services/attendanceService';
import feeService from '../../services/feeService';
import examService from '../../services/examService';
import batchService from '../../services/batchService';
import inventoryService from '../../services/inventoryService';
import leaveService from '../../services/leaveService';
import salaryService from '../../services/salaryService';
import teacherService from '../../services/teacherService';
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
  LabelList,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Users,
  UserCheck,
  Coins,
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
  X
} from 'lucide-react';
import { toast } from 'react-toastify';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuperAdmin = (user?.role || '').toLowerCase().replace('-', '_').includes('super_admin');
  const activeBranch = getUserBranch(user);
  const isMangal = Boolean(activeBranch && activeBranch.toLowerCase().includes('mangal'));
  const currentBranch = isMangal ? BRANCH_MANGALWAR : BRANCH_TARABAI;

  const [attendancePeriod, setAttendancePeriod] = useState('This Week');
  const [feePeriod, setFeePeriod] = useState('This Month');

  // Dynamic Data States
  const [totalStudents, setTotalStudents] = useState(0);
  const [allStudents, setAllStudents] = useState([]);
  const [presentToday, setPresentToday] = useState(0);
  const [monthlyFees, setMonthlyFees] = useState(0);
  const [pendingFees, setPendingFees] = useState(0);
  const [recentAdmissions, setRecentAdmissions] = useState([]);
  const [upcomingExams, setUpcomingExams] = useState([]);

  // Faculty Dynamic Data States
  const [facultyLeaves, setFacultyLeaves] = useState([]);
  const [facultyAttendance, setFacultyAttendance] = useState([]);
  const [facultySummary, setFacultySummary] = useState(null);
  const [facultySalaries, setFacultySalaries] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [leaveActionLoading, setLeaveActionLoading] = useState(false);

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

  const fetchDashboardData = async () => {
    try {
      const todayDate = new Date();
      const todayStr = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;

      const [
        studentsRes,
        attendanceRes,
        feesRes,
        examsRes,
        batchesRes,
        summaryRes,
        inventoryRes,
        leavesRes,
        salariesRes,
        teachersRes,
        teacherAttRes,
        teacherSumRes
      ] = await Promise.allSettled([
        studentService.getAll(),
        attendanceService.getLogs(),
        feeService.getAll(),
        examService.getAll(),
        batchService.getBatches(),
        attendanceService.getReportSummary(),
        inventoryService.getItems(),
        leaveService.getAllLeaveRequests(),
        salaryService.getAll(),
        teacherService.getAll(),
        attendanceService.getTeachersAttendance({ date: todayStr }),
        attendanceService.getTeachersSummary({ date: todayStr })
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

      if (studentsRes.status === 'fulfilled') {
        const rawStudents = studentsRes.value || [];
        const students = (!isSuperAdmin && activeBranch)
          ? rawStudents.filter(s => {
              const b = (s.branch || '').toLowerCase();
              return isMangal ? b.includes('mangal') : b.includes('tarabai');
            })
          : rawStudents;
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

      if (feesRes.status === 'fulfilled') {
        try {
          const stats = await feeService.getFeeStats();
          setMonthlyFees(stats.collected);
          setPendingFees(stats.pending);
        } catch { }
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
    fetchDashboardData();
  }, []);

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

  const totalTargetFees = monthlyFees + pendingFees;
  const collectionPercentage = totalTargetFees > 0
    ? Math.round((monthlyFees / totalTargetFees) * 100)
    : 0;

  const feeData = totalTargetFees === 0
    ? [{ name: 'No Data', value: 1, color: '#E2E8F0' }]
    : [
        ...(monthlyFees > 0 ? [{ name: 'Collected', value: monthlyFees, color: '#168554' }] : []),
        ...(pendingFees > 0 ? [{ name: 'Pending', value: pendingFees, color: '#F5A900' }] : [])
      ];

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
            <div className="d-flex align-items-center gap-2 mt-2">
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
                {isMangal ? '🏛️ Mangalvar Peth Campus' : '🌲 Tarabai Park Campus'}
                <span
                  className="badge bg-white text-dark py-0.5 px-1.5 rounded-pill"
                  style={{ fontSize: '0.68rem', fontWeight: 600 }}
                >
                  Fixed from Login
                </span>
              </span>
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
                <span>Onboard Student & Decide Fees</span>
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

        {/* Monthly Fees */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="sa-kpi-glass-card theme-amber p-3 p-xl-3.5 d-flex flex-column justify-content-between h-100"
            onClick={() => navigate('/admin/fees')}
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
                Monthly Fees
              </span>
              <div className="fw-bold text-sa-charcoal brand-font" style={{ fontSize: '1.75rem', lineHeight: 1.15 }}>
                ₹{monthlyFees.toLocaleString('en-IN')}
              </div>
              <span className="fw-semibold" style={{ fontSize: '0.76rem', color: '#168554' }}>
                ▲ +0% from last month
              </span>
            </div>
          </div>
        </div>

        {/* Pending Fees */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="sa-kpi-glass-card theme-red p-3 p-xl-3.5 d-flex flex-column justify-content-between h-100"
            onClick={() => navigate('/admin/fees/pending')}
          >
            <div className="d-flex align-items-start justify-content-between">
              <div className="sa-stat-icon-wrapper sa-stat-icon-red">
                <ReceiptIndianRupee size={22} />
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
                ₹{pendingFees.toLocaleString('en-IN')}
              </div>
              <span className="fw-semibold" style={{ fontSize: '0.76rem', color: '#DC2626' }}>
                ▲ ₹{pendingFees.toLocaleString('en-IN')} overdue
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Analytics & Schedule (3 Cards) */}
      <div className="row g-3 g-xl-4">
        {/* Attendance Overview Card */}
        <div className="col-12 col-xl-5">
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

        {/* Fee Collection Card */}
        <div className="col-12 col-xl-3">
          <div className="sa-card bg-white p-3.5 rounded-3 border h-100 d-flex flex-column">
            {/* Header */}
            <div className="d-flex align-items-center justify-content-between mb-2">
              <div className="d-flex align-items-center gap-2">
                <Coins size={18} style={{ color: '#D97718' }} />
                <h2 className="m-0 fw-bold text-sa-charcoal" style={{ fontSize: '0.98rem' }}>
                  Fee Collection
                </h2>
              </div>
              <div className="dropdown">
                <button
                  className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1.5 py-1 px-2.5 rounded-2"
                  style={{ fontSize: '0.76rem', borderColor: '#E2E8F0', color: '#475569' }}
                >
                  <span>{feePeriod}</span>
                  <ChevronDown size={13} />
                </button>
              </div>
            </div>

            {/* Donut Chart with Centered Value */}
            <div className="position-relative flex-grow-1 d-flex align-items-center justify-content-center" style={{ minHeight: '180px' }}>
              <ResponsiveContainer width="100%" height={175}>
                <PieChart>
                  <Tooltip
                    formatter={(value, name) => [`₹${Number(value).toLocaleString('en-IN')}`, name]}
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      fontSize: '11px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                    }}
                  />
                  <Pie
                    data={feeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={70}
                    startAngle={90}
                    endAngle={-270}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {feeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Center Text */}
              <div className="position-absolute top-50 start-50 translate-middle text-center" style={{ pointerEvents: 'none', maxWidth: '110px' }}>
                <div className="fw-semibold text-sa-muted text-uppercase" style={{ fontSize: '0.66rem', letterSpacing: '0.5px' }}>
                  Total Fees
                </div>
                <div className="fw-extrabold text-sa-charcoal" style={{ fontSize: '1.02rem', lineHeight: 1.15 }}>
                  ₹{totalTargetFees.toLocaleString('en-IN')}
                </div>
                <div className="fw-bold mt-0.5" style={{ fontSize: '0.70rem', color: monthlyFees > 0 ? '#168554' : '#D97718' }}>
                  {collectionPercentage}% Collected
                </div>
              </div>
            </div>

            {/* Bottom Legend */}
            <div className="d-flex align-items-center justify-content-center gap-3 pt-2 border-top mt-1" style={{ fontSize: '0.78rem' }}>
              <div className="d-flex align-items-center gap-1.5">
                <span className="rounded-circle" style={{ width: '8px', height: '8px', backgroundColor: '#168554' }} />
                <span className="text-sa-charcoal fw-semibold">Collected ₹{monthlyFees.toLocaleString('en-IN')}</span>
              </div>
              <div className="d-flex align-items-center gap-1.5">
                <span className="rounded-circle" style={{ width: '8px', height: '8px', backgroundColor: '#F5A900' }} />
                <span className="text-sa-charcoal fw-semibold">Pending ₹{pendingFees.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Schedule Card */}
        <div className="col-12 col-xl-4">
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
                Faculty Operations: Working Time, Leaves & Salary
              </h2>
              <span className="text-sa-muted" style={{ fontSize: '0.80rem' }}>
                Real-time tracking of staff working hours, pending leaves, and payroll records
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
