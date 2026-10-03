import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import studentService from '../../services/studentService';
import attendanceService from '../../services/attendanceService';
import feeService from '../../services/feeService';
import examService from '../../services/examService';
import { useAuth } from '../../hooks/useAuth';
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
  ChevronDown
} from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [attendancePeriod, setAttendancePeriod] = useState('This Week');
  const [feePeriod, setFeePeriod] = useState('This Month');

  // Dynamic Data States
  const [totalStudents, setTotalStudents] = useState(0);
  const [presentToday, setPresentToday] = useState(0);
  const [monthlyFees, setMonthlyFees] = useState(0);
  const [pendingFees, setPendingFees] = useState(0);
  const [recentAdmissions, setRecentAdmissions] = useState([]);
  const [upcomingExams, setUpcomingExams] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [studentsRes, attendanceRes, feesRes, examsRes] = await Promise.allSettled([
          studentService.getAll(),
          attendanceService.getLogs(),
          feeService.getAll(),
          examService.getAll()
        ]);

        if (studentsRes.status === 'fulfilled') {
          const students = studentsRes.value || [];
          setTotalStudents(students.length);
          
          // Sort for recent admissions (mock logic, based on ID for now)
          const sorted = [...students].reverse().slice(0, 5).map((s, idx) => ({
            id: idx + 1,
            name: s.name,
            class: s.standard || 'N/A',
            date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
            status: s.status || 'Active'
          }));
          setRecentAdmissions(sorted);
        }

        if (attendanceRes.status === 'fulfilled') {
          // just an example of dynamic count
          setPresentToday(attendanceRes.value?.length || 0);
        }

        if (feesRes.status === 'fulfilled') {
          const fees = feesRes.value || [];
          const collected = fees.reduce((acc, f) => acc + (Number(f.amountPaid) || 0), 0);
          const pending = fees.reduce((acc, f) => acc + (Number(f.pendingAmount) || 0), 0);
          setMonthlyFees(collected);
          setPendingFees(pending);
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
      } catch (err) {
        console.error('Error fetching admin dashboard data:', err);
      }
    };

    fetchDashboardData();
  }, []);

  // Exact data from reference screenshot
  const attendanceData = [
    { day: 'Mon', present: 0, absent: 0 },
    { day: 'Tue', present: 0, absent: 0 },
    { day: 'Wed', present: 0, absent: 0 },
    { day: 'Thu', present: 0, absent: 0 },
    { day: 'Fri', present: 0, absent: 0 },
    { day: 'Sat', present: 0, absent: 0 },
    { day: 'Sun', present: 0, absent: 0 },
  ];

  const feeData = [
    { name: 'Collected', value: 0, amount: '₹0', color: '#8B1216' },
    { name: 'Pending', value: 0, amount: '₹0', color: '#F5A900' }
  ];

  const scheduleList = [];

  const lowStockItems = [];

  return (
    <div className="d-flex flex-column gap-4 pb-4">
      {/* Top Welcome Hero Banner */}
      <div
        className="bg-white rounded-4 border overflow-hidden shadow-xs"
        style={{
          borderRadius: '18px',
          boxShadow: '0 2px 14px rgba(0, 0, 0, 0.04)',
          borderColor: 'rgba(0, 0, 0, 0.08)'
        }}
      >
        <div className="row g-0 align-items-center">
          {/* Left Text */}
          <div className="col-12 col-md-5 col-lg-5 p-4 ps-md-4 ps-xl-5 py-md-4">
            <h1
              className="fw-bold brand-font text-sa-charcoal m-0"
              style={{ fontSize: '1.85rem', letterSpacing: '-0.01em', lineHeight: 1.25 }}
            >
              Welcome back, {user?.name?.split(' ')[0] || 'Admin'}
            </h1>
            <p
              className="text-sa-charcoal text-opacity-75 m-0 mt-2"
              style={{ fontSize: '0.95rem', fontWeight: 400 }}
            >
              Discipline Today, A Brighter Tomorrow.
            </p>
          </div>

          {/* Right Hero Illustration */}
          <div className="col-12 col-md-7 col-lg-7 d-flex justify-content-end align-items-end pe-0 pe-md-2 pe-xl-3">
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
            className="sa-card bg-white p-3.5 p-xl-4 rounded-3 border h-100 d-flex align-items-center gap-3 transition-all cursor-pointer"
            onClick={() => navigate('/admin/students')}
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
          >
            <div
              className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
              style={{ width: '50px', height: '50px', backgroundColor: '#FDF0F0', color: '#A91D22' }}
            >
              <Users size={24} />
            </div>
            <div className="flex-grow-1">
              <span className="text-sa-muted fw-medium d-block" style={{ fontSize: '0.82rem' }}>
                Total Students
              </span>
              <div className="fw-bold text-sa-charcoal brand-font" style={{ fontSize: '1.6rem', lineHeight: 1.15 }}>
                {totalStudents}
              </div>
              <span className="fw-semibold" style={{ fontSize: '0.78rem', color: '#168554' }}>
                ↗ +0 this month
              </span>
            </div>
          </div>
        </div>

        {/* Present Today */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="sa-card bg-white p-3.5 p-xl-4 rounded-3 border h-100 d-flex align-items-center gap-3 transition-all cursor-pointer"
            onClick={() => navigate('/admin/attendance')}
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
          >
            <div
              className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
              style={{ width: '50px', height: '50px', backgroundColor: '#EAF6EF', color: '#168554' }}
            >
              <UserCheck size={24} />
            </div>
            <div className="flex-grow-1">
              <span className="text-sa-muted fw-medium d-block" style={{ fontSize: '0.82rem' }}>
                Present Today
              </span>
              <div className="fw-bold text-sa-charcoal brand-font" style={{ fontSize: '1.6rem', lineHeight: 1.15 }}>
                {presentToday}
              </div>
              <span className="fw-semibold" style={{ fontSize: '0.78rem', color: '#168554' }}>
                ↗ 0% attendance
              </span>
            </div>
          </div>
        </div>

        {/* Monthly Fees */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="sa-card bg-white p-3.5 p-xl-4 rounded-3 border h-100 d-flex align-items-center gap-3 transition-all cursor-pointer"
            onClick={() => navigate('/admin/fees')}
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
          >
            <div
              className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
              style={{ width: '50px', height: '50px', backgroundColor: '#FEF8EB', color: '#D97718' }}
            >
              <Coins size={24} />
            </div>
            <div className="flex-grow-1">
              <span className="text-sa-muted fw-medium d-block" style={{ fontSize: '0.82rem' }}>
                Monthly Fees
              </span>
              <div className="fw-bold text-sa-charcoal brand-font" style={{ fontSize: '1.6rem', lineHeight: 1.15 }}>
                ₹{monthlyFees.toLocaleString('en-IN')}
              </div>
              <span className="fw-semibold" style={{ fontSize: '0.78rem', color: '#168554' }}>
                ↗ +0% from last month
              </span>
            </div>
          </div>
        </div>

        {/* Pending Fees */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="sa-card bg-white p-3.5 p-xl-4 rounded-3 border h-100 d-flex align-items-center gap-3 transition-all cursor-pointer"
            onClick={() => navigate('/admin/fees/pending')}
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
          >
            <div
              className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
              style={{ width: '50px', height: '50px', backgroundColor: '#FDF0F0', color: '#A91D22' }}
            >
              <ReceiptIndianRupee size={24} />
            </div>
            <div className="flex-grow-1">
              <span className="text-sa-muted fw-medium d-block" style={{ fontSize: '0.82rem' }}>
                Pending Fees
              </span>
              <div className="fw-bold text-sa-charcoal brand-font" style={{ fontSize: '1.6rem', lineHeight: 1.15 }}>
                ₹{pendingFees.toLocaleString('en-IN')}
              </div>
              <span className="fw-semibold" style={{ fontSize: '0.78rem', color: '#DC2626' }}>
                ↗ +0% from last month
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
            <div className="position-relative flex-grow-1 d-flex align-items-center justify-content-center" style={{ minHeight: '200px' }}>
              <ResponsiveContainer width="100%" height={190}>
                <PieChart>
                  <Pie
                    data={feeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
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
              <div className="position-absolute top-50 start-50 translate-middle text-center" style={{ pointerEvents: 'none' }}>
                <div className="fw-extrabold text-sa-charcoal" style={{ fontSize: '1.10rem', lineHeight: 1.1 }}>
                  ₹{monthlyFees.toLocaleString('en-IN')}
                </div>
                <div className="text-sa-muted" style={{ fontSize: '0.72rem' }}>
                  Collected
                </div>
              </div>
            </div>

            {/* Bottom Legend */}
            <div className="d-flex align-items-center justify-content-center gap-3 pt-2 border-top mt-1" style={{ fontSize: '0.78rem' }}>
              <div className="d-flex align-items-center gap-1.5">
                <span className="rounded-circle" style={{ width: '8px', height: '8px', backgroundColor: '#8B1216' }} />
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
                    <th className="fw-semibold pb-2">#</th>
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
                      <td className="fw-semibold text-sa-charcoal py-2">{row.name}</td>
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

        {/* Low Stock Alert */}
        <div className="col-12 col-lg-4">
          <div className="sa-card bg-white p-3.5 p-xl-4 rounded-3 border h-100 d-flex flex-column">
            {/* Header */}
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="d-flex align-items-center gap-2">
                <Package size={18} style={{ color: 'var(--sa-primary-red)' }} />
                <h2 className="m-0 fw-bold text-sa-charcoal" style={{ fontSize: '0.98rem' }}>
                  Low Stock Alert
                </h2>
              </div>
              <button
                onClick={() => navigate('/admin/notes/stock')}
                className="btn btn-link p-0 text-decoration-none fw-semibold"
                style={{ fontSize: '0.78rem', color: 'var(--sa-primary-red)' }}
              >
                View All &rarr;
              </button>
            </div>

            {/* List */}
            <div className="d-flex flex-column gap-2.5 flex-grow-1">
              {lowStockItems.map((item, idx) => (
                <div
                  key={idx}
                  className="d-flex align-items-center justify-content-between py-1.5 px-2 rounded-2"
                  style={{ backgroundColor: '#FCFDFE', border: '1px solid #F1F5F9' }}
                >
                  <span className="text-sa-charcoal fw-medium" style={{ fontSize: '0.84rem' }}>
                    {item.name}
                  </span>
                  <span
                    className="badge rounded-2 fw-semibold px-2 py-1"
                    style={{
                      backgroundColor: item.type === 'danger' ? '#FDF0F0' : '#FEF8EB',
                      color: item.type === 'danger' ? '#DC2626' : '#D97718',
                      fontSize: '0.74rem'
                    }}
                  >
                    {item.count}
                  </span>
                </div>
              ))}
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
