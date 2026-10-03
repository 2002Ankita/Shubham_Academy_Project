import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
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
  Building2,
  Users,
  CheckCircle2,
  IndianRupee,
  Clock,
  ChevronRight,
  ChevronDown,
  BarChart2,
  PieChart as PieChartIcon,
  Activity,
  Server,
  Database,
  HardDrive,
  Cloud,
  MoreHorizontal,
  Zap,
  UserPlus,
  CreditCard,
  FileText,
  AlertCircle,
  GraduationCap
} from 'lucide-react';

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState('Last 6 Months');

  // Exact data from reference screenshot
  const growthData = [
    { month: 'Jan', total: 28, active: 23 },
    { month: 'Feb', total: 32, active: 27 },
    { month: 'Mar', total: 35, active: 30 },
    { month: 'Apr', total: 40, active: 35 },
    { month: 'May', total: 45, active: 40 },
    { month: 'Jun', total: 48, active: 43 },
  ];

  const subscriptionData = [
    { name: 'Basic', count: 20, percentage: '41.7%', color: '#8B1216' },
    { name: 'Standard', count: 14, percentage: '29.2%', color: '#D99B26' },
    { name: 'Premium', count: 9, percentage: '18.8%', color: '#1E3A8A' },
    { name: 'Enterprise', count: 5, percentage: '10.4%', color: '#64748B' },
  ];

  const recentRegistrations = [
    { id: 1, name: 'Bright Future Academy', owner: 'Rohan Mehta', plan: 'Premium', users: 245, status: 'Active', joined: '26 May 2025' },
    { id: 2, name: 'New Era Classes', owner: 'Pooja Sharma', plan: 'Standard', users: 128, status: 'Active', joined: '25 May 2025' },
    { id: 3, name: 'Vidyam Academy', owner: 'Amit Verma', plan: 'Basic', users: 56, status: 'Pending', joined: '24 May 2025' },
    { id: 4, name: 'Scholars Institute', owner: 'Neha Gupta', plan: 'Standard', users: 92, status: 'Active', joined: '24 May 2025' },
    { id: 5, name: 'Elite Coaching Hub', owner: 'Karan Patel', plan: 'Premium', users: 310, status: 'Suspended', joined: '23 May 2025' },
  ];


  return (
    <div className="d-flex flex-column gap-4 pb-4">
      {/* Top Hero Welcome Banner matching screenshot */}
      <div
        className="rounded-4 border overflow-hidden position-relative"
        style={{
          borderRadius: '20px',
          background: 'linear-gradient(135deg, rgba(255, 248, 238, 0.95) 0%, rgba(255, 243, 235, 0.90) 50%, rgba(254, 244, 234, 0.85) 100%)',
          border: '1px solid rgba(220, 38, 38, 0.14)',
          boxShadow: '0 8px 30px rgba(185, 28, 28, 0.05), inset 0 1px 2px rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)'
        }}
      >
        <div className="row g-0 align-items-center">
          {/* Left Text & Badges */}
          <div className="col-12 col-lg-6 p-4 ps-md-4 ps-xl-5 py-md-4 d-flex flex-column justify-content-center">
            <h1
              className="fw-bold brand-font text-sa-charcoal m-0"
              style={{ fontSize: '2.05rem', letterSpacing: '-0.02em', lineHeight: 1.15 }}
            >
              Platform <span style={{ color: '#8B1216' }}>Overview</span>
            </h1>
            <p
              className="text-sa-charcoal text-opacity-75 m-0 mt-2"
              style={{ fontSize: '0.94rem', fontWeight: 400 }}
            >
              Manage academies, users, subscriptions and system operations.
            </p>

            {/* 3 Pills from screenshot */}
            <div className="d-flex flex-wrap align-items-center gap-3 mt-3.5 pt-1">
              <div className="d-flex align-items-center gap-1.5" style={{ fontSize: '0.84rem', fontWeight: 600, color: '#334155' }}>
                <GraduationCap size={18} style={{ color: '#8B1216' }} />
                <span>More Academies</span>
              </div>
              <div className="d-flex align-items-center gap-1.5" style={{ fontSize: '0.84rem', fontWeight: 600, color: '#334155' }}>
                <Users size={17} style={{ color: '#8B1216' }} />
                <span>Better Education</span>
              </div>
              <div className="d-flex align-items-center gap-1.5" style={{ fontSize: '0.84rem', fontWeight: 600, color: '#334155' }}>
                <BarChart2 size={17} style={{ color: '#8B1216' }} />
                <span>Stronger Tomorrow</span>
              </div>
            </div>
          </div>

          {/* Right Hero Illustration */}
          <div className="col-12 col-lg-6 d-flex justify-content-end align-items-end pe-0 pe-md-2 pe-xl-3 overflow-hidden">
            <img
              src="/assets/superadminhero.png"
              alt="Shubham Academy Celebration"
              className="img-fluid"
              style={{
                maxHeight: '175px',
                width: 'auto',
                objectFit: 'contain',
                objectPosition: 'bottom right'
              }}
            />
          </div>
        </div>
      </div>

      {/* Row 1: KPI Stat Cards (5 in a single row) */}
      <div
        className="superadmin-kpi-grid d-grid gap-3"
        style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))'
        }}
      >
        {/* Total Academies */}
        <div
          className="sa-card bg-white p-3 p-xl-3.5 rounded-3 border d-flex flex-column justify-content-between transition-all cursor-pointer"
          onClick={() => navigate('/super-admin/academies')}
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)', minHeight: '110px' }}
        >
          <div className="d-flex align-items-start justify-content-between">
            <div
              className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
              style={{ width: '44px', height: '44px', backgroundColor: '#FDF0F0', color: '#8B1216' }}
            >
              <Building2 size={22} />
            </div>
            <ChevronRight size={16} className="text-sa-muted opacity-50" />
          </div>
          <div className="mt-2.5">
            <span className="text-sa-muted fw-medium d-block" style={{ fontSize: '0.80rem' }}>
              Total Academies
            </span>
            <div className="fw-bold text-sa-charcoal brand-font" style={{ fontSize: '1.75rem', lineHeight: 1.15 }}>
              48
            </div>
            <span className="fw-semibold" style={{ fontSize: '0.76rem', color: '#168554' }}>
              ▲ +12 this month
            </span>
          </div>
        </div>

        {/* Active Academies */}
        <div
          className="sa-card bg-white p-3 p-xl-3.5 rounded-3 border d-flex flex-column justify-content-between transition-all cursor-pointer"
          onClick={() => navigate('/super-admin/academies')}
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)', minHeight: '110px' }}
        >
          <div className="d-flex align-items-start justify-content-between">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
              style={{ width: '44px', height: '44px', backgroundColor: '#EAF6EF', color: '#168554' }}
            >
              <CheckCircle2 size={22} />
            </div>
            <ChevronRight size={16} className="text-sa-muted opacity-50" />
          </div>
          <div className="mt-2.5">
            <span className="text-sa-muted fw-medium d-block" style={{ fontSize: '0.80rem' }}>
              Active Academies
            </span>
            <div className="fw-bold text-sa-charcoal brand-font" style={{ fontSize: '1.75rem', lineHeight: 1.15 }}>
              43
            </div>
            <span className="fw-medium text-sa-muted" style={{ fontSize: '0.76rem' }}>
              89.6% of total
            </span>
          </div>
        </div>

        {/* Total Users */}
        <div
          className="sa-card bg-white p-3 p-xl-3.5 rounded-3 border d-flex flex-column justify-content-between transition-all cursor-pointer"
          onClick={() => navigate('/super-admin/users')}
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)', minHeight: '110px' }}
        >
          <div className="d-flex align-items-start justify-content-between">
            <div
              className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
              style={{ width: '44px', height: '44px', backgroundColor: '#EFF6FF', color: '#2563EB' }}
            >
              <Users size={22} />
            </div>
            <ChevronRight size={16} className="text-sa-muted opacity-50" />
          </div>
          <div className="mt-2.5">
            <span className="text-sa-muted fw-medium d-block" style={{ fontSize: '0.80rem' }}>
              Total Users
            </span>
            <div className="fw-bold text-sa-charcoal brand-font" style={{ fontSize: '1.75rem', lineHeight: 1.15 }}>
              12,680
            </div>
            <span className="fw-semibold" style={{ fontSize: '0.76rem', color: '#168554' }}>
              ▲ +18.4% from last month
            </span>
          </div>
        </div>

        {/* Monthly Revenue */}
        <div
          className="sa-card bg-white p-3 p-xl-3.5 rounded-3 border d-flex flex-column justify-content-between transition-all cursor-pointer"
          onClick={() => navigate('/super-admin/payments')}
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)', minHeight: '110px' }}
        >
          <div className="d-flex align-items-start justify-content-between">
            <div
              className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
              style={{ width: '44px', height: '44px', backgroundColor: '#FEF8EB', color: '#D97718' }}
            >
              <IndianRupee size={22} />
            </div>
            <ChevronRight size={16} className="text-sa-muted opacity-50" />
          </div>
          <div className="mt-2.5">
            <span className="text-sa-muted fw-medium d-block" style={{ fontSize: '0.80rem' }}>
              Monthly Revenue
            </span>
            <div className="fw-bold text-sa-charcoal brand-font" style={{ fontSize: '1.75rem', lineHeight: 1.15 }}>
              ₹18.4L
            </div>
            <span className="fw-semibold" style={{ fontSize: '0.76rem', color: '#168554' }}>
              ▲ +26.7% from last month
            </span>
          </div>
        </div>

        {/* Pending Approvals */}
        <div
          className="sa-card bg-white p-3 p-xl-3.5 rounded-3 border d-flex flex-column justify-content-between transition-all cursor-pointer"
          onClick={() => navigate('/super-admin/academies')}
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)', minHeight: '110px' }}
        >
          <div className="d-flex align-items-start justify-content-between">
            <div
              className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
              style={{ width: '44px', height: '44px', backgroundColor: '#FDF0F0', color: '#DC2626' }}
            >
              <Clock size={22} />
            </div>
            <ChevronRight size={16} className="text-sa-muted opacity-50" />
          </div>
          <div className="mt-2.5">
            <span className="text-sa-muted fw-medium d-block" style={{ fontSize: '0.80rem' }}>
              Pending Approvals
            </span>
            <div className="fw-bold text-sa-charcoal brand-font" style={{ fontSize: '1.75rem', lineHeight: 1.15 }}>
              06
            </div>
            <span className="fw-medium text-sa-muted" style={{ fontSize: '0.76rem' }}>
              4 academy | 2 admin
            </span>
          </div>
        </div>
      </div>

      {/* Row 2: Analytics & Quick Actions (3 Cards) */}
      <div className="row g-3 g-xl-4">
        {/* Academy Growth (Composed Bar + Line Chart) */}
        <div className="col-12 col-xl-4">
          <div className="sa-card bg-white p-3.5 p-xl-4 rounded-3 border h-100 d-flex flex-column">
            {/* Header */}
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div>
                <div className="d-flex align-items-center gap-2">
                  <BarChart2 size={18} style={{ color: '#8B1216' }} />
                  <h2 className="m-0 fw-bold text-sa-charcoal" style={{ fontSize: '1.02rem' }}>
                    Academy Growth
                  </h2>
                </div>
                <span className="text-sa-muted d-block mt-0.5" style={{ fontSize: '0.76rem' }}>
                  Total academies registered on the platform
                </span>
              </div>
              <div className="dropdown">
                <button
                  className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1.5 py-1 px-2.5 rounded-2"
                  style={{ fontSize: '0.76rem', borderColor: '#E2E8F0', color: '#475569' }}
                >
                  <span>{timeRange}</span>
                  <ChevronDown size={13} />
                </button>
              </div>
            </div>

            {/* Recharts Composed Chart */}
            <div className="flex-grow-1" style={{ width: '100%', minHeight: '225px' }}>
              <ResponsiveContainer width="100%" height={225}>
                <ComposedChart
                  data={growthData}
                  margin={{ top: 22, right: 10, left: -22, bottom: 0 }}
                  barGap={0}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748B', fontSize: 11 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748B', fontSize: 10 }}
                    domain={[0, 60]}
                    ticks={[0, 10, 20, 30, 40, 60]}
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
                  <Bar dataKey="total" fill="#8B1216" radius={[4, 4, 0, 0]} maxBarSize={28}>
                    <LabelList
                      dataKey="total"
                      position="top"
                      style={{ fill: '#334155', fontSize: '10px', fontWeight: 700 }}
                    />
                  </Bar>
                  <Line
                    type="monotone"
                    dataKey="active"
                    stroke="#F5A900"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#FFFFFF', stroke: '#F5A900', strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Bottom Legend */}
            <div className="d-flex align-items-center justify-content-center gap-4 pt-2 border-top mt-1" style={{ fontSize: '0.80rem' }}>
              <div className="d-flex align-items-center gap-1.5">
                <span className="rounded-circle" style={{ width: '9px', height: '9px', backgroundColor: '#8B1216' }} />
                <span className="text-sa-charcoal fw-medium">Total Academies</span>
              </div>
              <div className="d-flex align-items-center gap-1.5">
                <span className="rounded-circle" style={{ width: '9px', height: '9px', backgroundColor: '#F5A900' }} />
                <span className="text-sa-charcoal fw-medium">Active Academies</span>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Distribution (Donut Chart + Side Legend) */}
        <div className="col-12 col-xl-4">
          <div className="sa-card bg-white p-3.5 p-xl-4 rounded-3 border h-100 d-flex flex-column">
            {/* Header */}
            <div className="mb-2">
              <div className="d-flex align-items-center gap-2">
                <PieChartIcon size={18} style={{ color: '#8B1216' }} />
                <h2 className="m-0 fw-bold text-sa-charcoal" style={{ fontSize: '1.02rem' }}>
                  Subscription Distribution
                </h2>
              </div>
              <span className="text-sa-muted d-block mt-0.5" style={{ fontSize: '0.76rem' }}>
                Academies by subscription plan
              </span>
            </div>

            {/* Donut Chart & Legend Side by Side */}
            <div className="d-flex align-items-center justify-content-between flex-grow-1" style={{ minHeight: '210px' }}>
              {/* Donut with Center Text */}
              <div className="position-relative d-flex align-items-center justify-content-center" style={{ width: '170px', height: '170px' }}>
                <ResponsiveContainer width="100%" height={170}>
                  <PieChart>
                    <Pie
                      data={subscriptionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={74}
                      paddingAngle={2}
                      dataKey="count"
                      strokeWidth={0}
                    >
                      {subscriptionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                {/* Center Text */}
                <div className="position-absolute top-50 start-50 translate-middle text-center" style={{ pointerEvents: 'none' }}>
                  <div className="fw-extrabold text-sa-charcoal" style={{ fontSize: '1.40rem', lineHeight: 1 }}>
                    48
                  </div>
                  <div className="text-sa-muted" style={{ fontSize: '0.68rem', fontWeight: 600 }}>
                    Total<br />Academies
                  </div>
                </div>
              </div>

              {/* Right Side Legend */}
              <div className="d-flex flex-column gap-2 ps-2 flex-grow-1" style={{ fontSize: '0.80rem' }}>
                {subscriptionData.map((item, idx) => (
                  <div key={idx} className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-1.5">
                      <span className="rounded-circle flex-shrink-0" style={{ width: '8px', height: '8px', backgroundColor: item.color }} />
                      <span className="text-sa-charcoal fw-medium">{item.name}</span>
                    </div>
                    <div>
                      <span className="fw-bold text-sa-charcoal me-1">{item.count}</span>
                      <span className="text-sa-muted" style={{ fontSize: '0.72rem' }}>({item.percentage})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions (In place of System Health) */}
        <div className="col-12 col-xl-4">
          <div className="sa-card bg-white p-3.5 p-xl-4 rounded-3 border h-100 d-flex flex-column justify-content-between">
            <div>
              {/* Header */}
              <div className="d-flex align-items-center justify-content-between mb-1">
                <div className="d-flex align-items-center gap-2">
                  <Zap size={18} style={{ color: '#8B1216' }} />
                  <h2 className="m-0 fw-bold text-sa-charcoal" style={{ fontSize: '1.02rem' }}>
                    Quick Actions
                  </h2>
                </div>
                <span
                  className="badge px-2.5 py-1 rounded-pill"
                  style={{ backgroundColor: '#FDF0F0', color: 'var(--sa-primary)', fontSize: '0.72rem' }}
                >
                  Admin Shortcuts
                </span>
              </div>
              <span className="text-sa-muted d-block mb-3" style={{ fontSize: '0.76rem' }}>
                Frequently used administrative tasks & shortcuts
              </span>

              {/* 4 Action Buttons in 2x2 grid with clear spacing */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
                <button
                  onClick={() => navigate('/super-admin/academies')}
                  className="btn w-100 d-flex align-items-center justify-content-between rounded-3 transition-all"
                  style={{
                    backgroundColor: '#8B1216',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '10px 12px',
                    fontSize: '0.80rem',
                    fontWeight: 600,
                    boxShadow: '0 2px 8px rgba(139, 18, 22, 0.22)'
                  }}
                >
                  <div className="d-flex align-items-center" style={{ gap: '7px' }}>
                    <Building2 size={16} className="flex-shrink-0" />
                    <span className="text-nowrap">Add Academy</span>
                  </div>
                  <ChevronRight size={14} className="flex-shrink-0" />
                </button>

                <button
                  onClick={() => navigate('/super-admin/admins')}
                  className="btn w-100 d-flex align-items-center justify-content-between rounded-3 transition-all"
                  style={{
                    backgroundColor: '#D97706',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '10px 12px',
                    fontSize: '0.80rem',
                    fontWeight: 600,
                    boxShadow: '0 2px 8px rgba(217, 119, 6, 0.22)'
                  }}
                >
                  <div className="d-flex align-items-center" style={{ gap: '7px' }}>
                    <UserPlus size={16} className="flex-shrink-0" />
                    <span className="text-nowrap">Create Admin</span>
                  </div>
                  <ChevronRight size={14} className="flex-shrink-0" />
                </button>

                <button
                  onClick={() => navigate('/super-admin/subscriptions')}
                  className="btn w-100 d-flex align-items-center justify-content-between rounded-3 transition-all"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    color: '#8B1216',
                    border: '1.5px solid rgba(220, 38, 38, 0.25)',
                    padding: '10px 12px',
                    fontSize: '0.80rem',
                    fontWeight: 600
                  }}
                >
                  <div className="d-flex align-items-center" style={{ gap: '7px' }}>
                    <CreditCard size={16} className="flex-shrink-0" />
                    <span className="text-nowrap">Manage Plans</span>
                  </div>
                  <ChevronRight size={14} className="flex-shrink-0" />
                </button>

                <button
                  onClick={() => navigate('/super-admin/audit-logs')}
                  className="btn w-100 d-flex align-items-center justify-content-between rounded-3 transition-all"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    color: '#8B1216',
                    border: '1.5px solid rgba(220, 38, 38, 0.25)',
                    padding: '10px 12px',
                    fontSize: '0.80rem',
                    fontWeight: 600
                  }}
                >
                  <div className="d-flex align-items-center" style={{ gap: '7px' }}>
                    <FileText size={16} className="flex-shrink-0" />
                    <span className="text-nowrap">View Audit Logs</span>
                  </div>
                  <ChevronRight size={14} className="flex-shrink-0" />
                </button>
              </div>
            </div>

            {/* Quick Directory Link */}
            <div className="mt-3 pt-2.5 border-top d-flex align-items-center justify-content-between" style={{ fontSize: '0.74rem' }}>
              <span className="text-sa-muted">
                Need campus directory or support?
              </span>
              <button
                onClick={() => navigate('/super-admin/contact')}
                className="btn btn-link p-0 text-decoration-none fw-semibold"
                style={{ fontSize: '0.74rem', color: 'var(--sa-primary-red)' }}
              >
                Directory &gt;
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Recent Registrations & Quick Actions/Activity (2 Columns) */}
      <div className="row g-3 g-xl-4">
        {/* Recent Academy Registrations (Left, Wide) */}
        <div className="col-12 col-xl-8">
          <div className="sa-card bg-white p-3.5 p-xl-4 rounded-3 border h-100 d-flex flex-column">
            {/* Header */}
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div>
                <div className="d-flex align-items-center gap-2">
                  <Building2 size={18} style={{ color: '#8B1216' }} />
                  <h2 className="m-0 fw-bold text-sa-charcoal" style={{ fontSize: '1.02rem' }}>
                    Recent Academy Registrations
                  </h2>
                </div>
                <span className="text-sa-muted d-block mt-0.5" style={{ fontSize: '0.76rem' }}>
                  Latest academies that joined the platform
                </span>
              </div>
              <button
                onClick={() => navigate('/super-admin/academies')}
                className="btn btn-sm btn-outline-secondary py-1 px-3 rounded-2 fw-semibold"
                style={{ fontSize: '0.78rem', borderColor: '#E2E8F0', color: '#334155' }}
              >
                View All
              </button>
            </div>

            {/* Table */}
            <div className="table-responsive flex-grow-1">
              <table className="table table-sm table-borderless align-middle m-0" style={{ fontSize: '0.82rem' }}>
                <thead>
                  <tr className="text-sa-muted text-uppercase" style={{ fontSize: '0.70rem', letterSpacing: '0.04em', borderBottom: '1px solid #F1F5F9' }}>
                    <th className="fw-semibold pb-2" style={{ width: '35px' }}>#</th>
                    <th className="fw-semibold pb-2">Academy</th>
                    <th className="fw-semibold pb-2">Owner</th>
                    <th className="fw-semibold pb-2">Plan</th>
                    <th className="fw-semibold pb-2">Users</th>
                    <th className="fw-semibold pb-2">Status</th>
                    <th className="fw-semibold pb-2">Joined</th>
                    <th className="fw-semibold pb-2 text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRegistrations.map((row) => (
                    <tr key={row.id} style={{ borderBottom: '1px solid #F8FAFC' }}>
                      <td className="text-sa-muted py-2">{row.id}</td>
                      <td className="fw-semibold text-sa-charcoal py-2">{row.name}</td>
                      <td className="text-sa-muted py-2">{row.owner}</td>
                      <td className="py-2">
                        <span
                          className="badge rounded-pill fw-semibold px-2 py-0.5"
                          style={{
                            backgroundColor:
                              row.plan === 'Premium' ? '#EFF6FF' : row.plan === 'Standard' ? '#FEF8EB' : '#FDF0F0',
                            color:
                              row.plan === 'Premium' ? '#1D4ED8' : row.plan === 'Standard' ? '#B45309' : '#B91C1C',
                            border:
                              row.plan === 'Premium' ? '1px solid #BFDBFE' : row.plan === 'Standard' ? '1px solid #FDE68A' : '1px solid #FECACA',
                            fontSize: '0.72rem'
                          }}
                        >
                          {row.plan}
                        </span>
                      </td>
                      <td className="text-sa-charcoal fw-medium py-2">{row.users}</td>
                      <td className="py-2">
                        <span
                          className="badge rounded-pill fw-semibold px-2 py-0.5 d-inline-flex align-items-center gap-1"
                          style={{
                            backgroundColor:
                              row.status === 'Active' ? '#EAF6EF' : row.status === 'Pending' ? '#FEF8EB' : '#FDF0F0',
                            color:
                              row.status === 'Active' ? '#168554' : row.status === 'Pending' ? '#D97706' : '#DC2626',
                            fontSize: '0.72rem'
                          }}
                        >
                          <span
                            className="rounded-circle"
                            style={{
                              width: '6px',
                              height: '6px',
                              backgroundColor:
                                row.status === 'Active' ? '#168554' : row.status === 'Pending' ? '#D97706' : '#DC2626'
                            }}
                          />
                          {row.status}
                        </span>
                      </td>
                      <td className="text-sa-muted py-2">{row.joined}</td>
                      <td className="text-end py-2">
                        <button
                          className="btn btn-sm btn-link p-0 text-sa-muted text-decoration-none"
                          style={{ cursor: 'pointer' }}
                        >
                          <MoreHorizontal size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* System Health (Right Column) */}
        <div className="col-12 col-xl-4">
          {/* System Health Card */}
          <div className="sa-card bg-white p-3.5 p-xl-4 rounded-3 border h-100 d-flex flex-column justify-content-between">
            <div>
              {/* Header */}
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="d-flex align-items-center gap-2">
                  <Activity size={18} style={{ color: '#DC2626' }} />
                  <h2 className="m-0 fw-bold text-sa-charcoal" style={{ fontSize: '0.98rem' }}>
                    System Health
                  </h2>
                </div>
                <span className="badge bg-success-subtle text-success small border border-success-subtle d-inline-flex align-items-center gap-1" style={{ fontSize: '0.70rem' }}>
                  <CheckCircle2 size={11} /> All Systems Live
                </span>
              </div>
              <span className="text-sa-muted d-block mb-3.5" style={{ fontSize: '0.74rem' }}>
                Live status of platform infrastructure
              </span>

              {/* Health Metrics List */}
              <div className="d-flex flex-column gap-3">
                {/* Server Status */}
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <div
                      className="rounded-2 d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{ width: '34px', height: '34px', backgroundColor: '#F1F5F9', color: '#475569' }}
                    >
                      <Server size={16} />
                    </div>
                    <span className="fw-medium text-sa-charcoal" style={{ fontSize: '0.84rem' }}>
                      Server Status
                    </span>
                  </div>
                  <div className="text-end">
                    <div className="fw-bold" style={{ fontSize: '0.82rem', color: '#168554' }}>
                      ● Online
                    </div>
                    <span className="text-sa-muted" style={{ fontSize: '0.72rem' }}>
                      Uptime 99.9%
                    </span>
                  </div>
                </div>

                {/* Database */}
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <div
                      className="rounded-2 d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{ width: '34px', height: '34px', backgroundColor: '#F1F5F9', color: '#475569' }}
                    >
                      <Database size={16} />
                    </div>
                    <span className="fw-medium text-sa-charcoal" style={{ fontSize: '0.84rem' }}>
                      Database
                    </span>
                  </div>
                  <div className="text-end">
                    <div className="fw-bold" style={{ fontSize: '0.82rem', color: '#168554' }}>
                      ● Healthy
                    </div>
                    <span className="text-sa-muted" style={{ fontSize: '0.72rem' }}>
                      All systems operational
                    </span>
                  </div>
                </div>

                {/* Storage Usage */}
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <div
                      className="rounded-2 d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{ width: '34px', height: '34px', backgroundColor: '#F1F5F9', color: '#475569' }}
                    >
                      <HardDrive size={16} />
                    </div>
                    <span className="fw-medium text-sa-charcoal" style={{ fontSize: '0.84rem' }}>
                      Storage Usage
                    </span>
                  </div>
                  <div className="text-end" style={{ width: '105px' }}>
                    <div className="d-flex align-items-center gap-1.5 justify-content-end mb-1">
                      <div className="progress flex-grow-1" style={{ height: '6px', backgroundColor: '#E2E8F0', borderRadius: '4px' }}>
                        <div
                          className="progress-bar"
                          role="progressbar"
                          style={{ width: '68%', backgroundColor: '#F5A900', borderRadius: '4px' }}
                        />
                      </div>
                      <span className="fw-bold text-sa-charcoal" style={{ fontSize: '0.76rem' }}>68%</span>
                    </div>
                    <span className="text-sa-muted" style={{ fontSize: '0.70rem' }}>
                      342 GB / 500 GB
                    </span>
                  </div>
                </div>

                {/* Last Backup */}
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <div
                      className="rounded-2 d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{ width: '34px', height: '34px', backgroundColor: '#F1F5F9', color: '#475569' }}
                    >
                      <Cloud size={16} />
                    </div>
                    <span className="fw-medium text-sa-charcoal" style={{ fontSize: '0.84rem' }}>
                      Last Backup
                    </span>
                  </div>
                  <div className="text-end">
                    <div className="fw-bold" style={{ fontSize: '0.82rem', color: '#168554' }}>
                      ● Completed
                    </div>
                    <span className="text-sa-muted" style={{ fontSize: '0.72rem' }}>
                      Today, 02:30 AM
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Status Footer */}
            <div className="mt-3 pt-2.5 border-top d-flex align-items-center justify-content-between" style={{ fontSize: '0.74rem' }}>
              <span className="text-sa-muted">
                Audit logs & diagnostic history
              </span>
              <button
                onClick={() => navigate('/super-admin/audit-logs')}
                className="btn btn-link p-0 text-decoration-none fw-semibold"
                style={{ fontSize: '0.74rem', color: 'var(--sa-primary-red)' }}
              >
                View Audit Logs &gt;
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
