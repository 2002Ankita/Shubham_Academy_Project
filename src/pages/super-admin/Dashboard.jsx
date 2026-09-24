import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  ChevronDown,
  ArrowRight,
  Clock
} from 'lucide-react';

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [attendancePeriod, setAttendancePeriod] = useState('This Week');
  const [feePeriod, setFeePeriod] = useState('This Month');

  // Exact data from reference screenshot
  const attendanceData = [
    { day: 'Mon', present: 1052, absent: 196 },
    { day: 'Tue', present: 1089, absent: 159 },
    { day: 'Wed', present: 1076, absent: 172 },
    { day: 'Thu', present: 1103, absent: 145 },
    { day: 'Fri', present: 1086, absent: 162 },
    { day: 'Sat', present: 980, absent: 268 },
    { day: 'Sun', present: 910, absent: 338 },
  ];

  const feeData = [
    { name: 'Collected', value: 86.9, amount: '₹8.45L', color: '#8B1216' },
    { name: 'Pending', value: 13.1, amount: '₹1.28L', color: '#F5A900' }
  ];

  const scheduleList = [
    { time: '09:00 AM', title: 'Mathematics (Class 10)', color: '#8B1216' },
    { time: '10:00 AM', title: 'Physics (Class 12)', color: '#F5A900' },
    { time: '11:00 AM', title: 'English (Class 9)', color: '#F5A900' },
    { time: '12:00 PM', title: 'Chemistry (Class 11)', color: '#8B1216' },
    { time: '02:00 PM', title: 'Doubt Session', color: '#F5A900' },
    { time: '04:00 PM', title: 'Parent Meeting', color: '#8B1216' },
  ];

  const recentAdmissions = [
    { id: 1, name: 'Aarav Sharma', class: '11th', date: '26 May 2025', status: 'Active' },
    { id: 2, name: 'Sneha Verma', class: '9th', date: '25 May 2025', status: 'Active' },
    { id: 3, name: 'Rohan Patel', class: '12th', date: '24 May 2025', status: 'Active' },
    { id: 4, name: 'Isha Maurya', class: '10th', date: '24 May 2025', status: 'Active' },
    { id: 5, name: 'Kunal Singh', class: '9th', date: '23 May 2025', status: 'Active' },
  ];

  const lowStockItems = [
    { name: 'Classmate Notebook (200 Pages)', count: '8 left', type: 'danger' },
    { name: 'Blue Ball Pen', count: '12 left', type: 'danger' },
    { name: 'A4 Practical File', count: '15 left', type: 'warning' },
    { name: 'White Board Marker', count: '7 left', type: 'danger' },
    { name: 'Exam Answer Sheet', count: '18 left', type: 'warning' },
  ];

  const upcomingExams = [
    { day: '28', month: 'MAY', title: 'Unit Test - Mathematics', class: 'Class 10', countdown: '3 days left' },
    { day: '30', month: 'MAY', title: 'Monthly Test - Science', class: 'Class 9', countdown: '5 days left' },
    { day: '02', month: 'JUN', title: 'Half Yearly - English', class: 'Class 12', countdown: '8 days left' },
    { day: '05', month: 'JUN', title: 'Unit Test - Social Science', class: 'Class 8', countdown: '11 days left' },
  ];

  return (
    <div className="d-flex flex-column gap-3.5 pb-4">
      {/* Top Welcome Banner */}
      <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 pt-1">
        <div>
          <h1 className="fw-bold brand-font text-sa-charcoal m-0" style={{ fontSize: '1.65rem' }}>
            Welcome back, {user?.name?.split(' ')[0] || 'Admin'}
          </h1>
          <p className="text-sa-muted m-0 mt-1" style={{ fontSize: '0.90rem' }}>
            Here's what's happening at Shubham Academy today.
          </p>
        </div>

        <div className="d-none d-md-flex flex-column align-items-end text-end">
          <div
            className="text-sa-charcoal fw-semibold"
            style={{ fontSize: '0.82rem', letterSpacing: '0.02em', fontStyle: 'normal' }}
          >
            "Discipline Today<br />A Brighter Tomorrow"
          </div>
          <div
            className="rounded-pill mt-1.5"
            style={{ width: '48px', height: '3px', backgroundColor: 'var(--sa-mustard-yellow)' }}
          />
        </div>
      </div>

      {/* Row 1: KPI Stat Cards */}
      <div className="row g-3">
        {/* Total Students */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="sa-card bg-white p-3.5 rounded-3 border h-100 d-flex align-items-center gap-3 transition-all cursor-pointer"
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
                1,248
              </div>
              <span className="fw-semibold" style={{ fontSize: '0.78rem', color: '#168554' }}>
                ↗ +12 this month
              </span>
            </div>
          </div>
        </div>

        {/* Present Today */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="sa-card bg-white p-3.5 rounded-3 border h-100 d-flex align-items-center gap-3 transition-all cursor-pointer"
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
                1,086
              </div>
              <span className="fw-semibold" style={{ fontSize: '0.78rem', color: '#168554' }}>
                ↗ 87.1% attendance
              </span>
            </div>
          </div>
        </div>

        {/* Monthly Fees */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="sa-card bg-white p-3.5 rounded-3 border h-100 d-flex align-items-center gap-3 transition-all cursor-pointer"
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
                ₹8.45L
              </div>
              <span className="fw-semibold" style={{ fontSize: '0.78rem', color: '#168554' }}>
                ↗ +6.2% from last month
              </span>
            </div>
          </div>
        </div>

        {/* Pending Fees */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="sa-card bg-white p-3.5 rounded-3 border h-100 d-flex align-items-center gap-3 transition-all cursor-pointer"
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
                ₹1.28L
              </div>
              <span className="fw-semibold" style={{ fontSize: '0.78rem', color: '#DC2626' }}>
                ↗ +4.8% from last month
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Analytics & Schedule (3 Cards) */}
      <div className="row g-3">
        {/* Attendance Overview Card */}
        <div className="col-12 col-xl-5">
          <div className="sa-card bg-white p-3.5 rounded-3 border h-100 d-flex flex-column">
            {/* Header */}
            <div className="d-flex align-items-center justify-content-between mb-2">
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
                  ₹8.45L
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
                <span className="text-sa-charcoal fw-semibold">Collected ₹8.45L</span>
              </div>
              <div className="d-flex align-items-center gap-1.5">
                <span className="rounded-circle" style={{ width: '8px', height: '8px', backgroundColor: '#F5A900' }} />
                <span className="text-sa-charcoal fw-semibold">Pending ₹1.28L</span>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Schedule Card */}
        <div className="col-12 col-xl-4">
          <div className="sa-card bg-white p-3.5 rounded-3 border h-100 d-flex flex-column">
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
      <div className="row g-3">
        {/* Recent Admissions */}
        <div className="col-12 col-lg-4">
          <div className="sa-card bg-white p-3.5 rounded-3 border h-100 d-flex flex-column">
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
          <div className="sa-card bg-white p-3.5 rounded-3 border h-100 d-flex flex-column">
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
          <div className="sa-card bg-white p-3.5 rounded-3 border h-100 d-flex flex-column">
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
