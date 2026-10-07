import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LabelList
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
  BarChart3,
  Table as TableIcon,
  MoreHorizontal,
  Zap,
  UserPlus,
  CreditCard,
  FileText,
  AlertCircle,
  GraduationCap,
  Shield,
  UserCheck,
  Layers,
  X
} from 'lucide-react';

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState('Last 12 Months');
  const [separateGraphMode, setSeparateGraphMode] = useState('separate'); // 'separate' | 'grouped' | 'stacked'
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Active' | 'Pending' | 'Suspended'
  const [selectedAcademy, setSelectedAcademy] = useState(null);

  // 12-Month Academy Growth Dataset
  const growthData12Months = [
    { month: 'Jan', total: 16, active: 13 },
    { month: 'Feb', total: 20, active: 16 },
    { month: 'Mar', total: 24, active: 19 },
    { month: 'Apr', total: 28, active: 23 },
    { month: 'May', total: 32, active: 27 },
    { month: 'Jun', total: 35, active: 30 },
    { month: 'Jul', total: 38, active: 32 },
    { month: 'Aug', total: 40, active: 35 },
    { month: 'Sep', total: 42, active: 37 },
    { month: 'Oct', total: 44, active: 39 },
    { month: 'Nov', total: 46, active: 41 },
    { month: 'Dec', total: 48, active: 43 },
  ];

  const growthData6Months = [
    { month: 'Jul', total: 38, active: 32 },
    { month: 'Aug', total: 40, active: 35 },
    { month: 'Sep', total: 42, active: 37 },
    { month: 'Oct', total: 44, active: 39 },
    { month: 'Nov', total: 46, active: 41 },
    { month: 'Dec', total: 48, active: 43 },
  ];

  const growthData = timeRange === 'Last 6 Months' ? growthData6Months : growthData12Months;

  const recentRegistrations = [
    {
      id: 1,
      name: 'Bright Future Academy',
      shortName: 'Bright',
      owner: 'Rohan Mehta',
      plan: 'Premium',
      users: 245,
      admins: 4,
      teachers: 26,
      students: 215,
      status: 'Active',
      joined: '26 May 2025'
    },
    {
      id: 2,
      name: 'New Era Classes',
      shortName: 'New Era',
      owner: 'Pooja Sharma',
      plan: 'Standard',
      users: 128,
      admins: 2,
      teachers: 16,
      students: 110,
      status: 'Active',
      joined: '25 May 2025'
    },
    {
      id: 3,
      name: 'Vidyam Academy',
      shortName: 'Vidyam',
      owner: 'Amit Verma',
      plan: 'Basic',
      users: 56,
      admins: 1,
      teachers: 8,
      students: 47,
      status: 'Pending',
      joined: '24 May 2025'
    },
    {
      id: 4,
      name: 'Scholars Institute',
      shortName: 'Scholars',
      owner: 'Neha Gupta',
      plan: 'Standard',
      users: 92,
      admins: 2,
      teachers: 12,
      students: 78,
      status: 'Active',
      joined: '24 May 2025'
    },
    {
      id: 5,
      name: 'Elite Coaching Hub',
      shortName: 'Elite',
      owner: 'Karan Patel',
      plan: 'Premium',
      users: 310,
      admins: 5,
      teachers: 35,
      students: 270,
      status: 'Suspended',
      joined: '23 May 2025'
    },
  ];

  const filteredRegistrations = statusFilter === 'All'
    ? recentRegistrations
    : recentRegistrations.filter((r) => r.status === statusFilter);

  const statusCounts = {
    All: recentRegistrations.length,
    Active: recentRegistrations.filter((r) => r.status === 'Active').length,
    Pending: recentRegistrations.filter((r) => r.status === 'Pending').length,
    Suspended: recentRegistrations.filter((r) => r.status === 'Suspended').length,
  };

  const renderStatusAxisTick = ({ x, y, payload }) => {
    const acad = recentRegistrations.find(
      (r) => r.shortName === payload.value || r.name === payload.value
    );
    const statusColor =
      acad?.status === 'Active'
        ? '#168554'
        : acad?.status === 'Pending'
        ? '#D97706'
        : '#DC2626';

    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={13} fill="#475569" fontSize={11} fontWeight={500} textAnchor="middle">
          {payload.value}
        </text>
        <circle cx={0} cy={23} r={3} fill={statusColor} />
      </g>
    );
  };

  const renderStatusTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const acad = payload[0].payload;
      const statusColor =
        acad.status === 'Active'
          ? '#168554'
          : acad.status === 'Pending'
          ? '#D97706'
          : '#DC2626';
      const statusBg =
        acad.status === 'Active'
          ? '#EAF6EF'
          : acad.status === 'Pending'
          ? '#FEF8EB'
          : '#FDF0F0';
      const statusBorder =
        acad.status === 'Active'
          ? '#A7F3D0'
          : acad.status === 'Pending'
          ? '#FDE68A'
          : '#FECACA';

      return (
        <div
          className="bg-white p-2.5 rounded-3 shadow border"
          style={{ fontSize: '11px', minWidth: '175px' }}
        >
          <div className="d-flex align-items-center justify-content-between gap-2 border-bottom pb-1.5 mb-1.5">
            <span className="fw-bold text-sa-charcoal text-truncate" style={{ maxWidth: '110px' }}>
              {acad.name}
            </span>
            <span
              className="badge rounded-pill fw-semibold px-2 py-0.5 d-inline-flex align-items-center gap-1"
              style={{
                backgroundColor: statusBg,
                color: statusColor,
                border: `1px solid ${statusBorder}`,
                fontSize: '0.67rem'
              }}
            >
              <span
                style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  backgroundColor: statusColor
                }}
              />
              {acad.status}
            </span>
          </div>

          <div className="d-flex flex-column gap-1">
            {payload.map((entry, idx) => (
              <div key={idx} className="d-flex align-items-center justify-content-between gap-3">
                <span className="d-flex align-items-center gap-1.5" style={{ color: entry.fill || entry.color, fontWeight: 600 }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: entry.fill || entry.color }} />
                  {entry.name || 'Count'}:
                </span>
                <span className="fw-bold text-sa-charcoal">{entry.value}</span>
              </div>
            ))}
          </div>

          <div className="d-flex align-items-center justify-content-between pt-1.5 mt-1.5 border-top text-sa-muted" style={{ fontSize: '0.68rem' }}>
            <span>Total: <strong>{acad.users}</strong></span>
            <span>Plan: <strong>{acad.plan}</strong></span>
          </div>
        </div>
      );
    }
    return null;
  };

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
          className="sa-kpi-glass-card theme-red p-3 p-xl-3.5 d-flex flex-column justify-content-between"
          onClick={() => navigate('/super-admin/academies')}
        >
          <div className="d-flex align-items-start justify-content-between">
            <div className="sa-stat-icon-wrapper sa-stat-icon-red">
              <Building2 size={22} />
            </div>
            <div className="sa-card-chevron-btn">
              <ChevronRight size={15} />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-sa-muted fw-semibold d-block" style={{ fontSize: '0.80rem' }}>
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
          className="sa-kpi-glass-card theme-green p-3 p-xl-3.5 d-flex flex-column justify-content-between"
          onClick={() => navigate('/super-admin/academies')}
        >
          <div className="d-flex align-items-start justify-content-between">
            <div className="sa-stat-icon-wrapper sa-stat-icon-green rounded-circle">
              <CheckCircle2 size={22} />
            </div>
            <div className="sa-card-chevron-btn">
              <ChevronRight size={15} />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-sa-muted fw-semibold d-block" style={{ fontSize: '0.80rem' }}>
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
          className="sa-kpi-glass-card theme-blue p-3 p-xl-3.5 d-flex flex-column justify-content-between"
          onClick={() => navigate('/super-admin/users')}
        >
          <div className="d-flex align-items-start justify-content-between">
            <div className="sa-stat-icon-wrapper sa-stat-icon-blue">
              <Users size={22} />
            </div>
            <div className="sa-card-chevron-btn">
              <ChevronRight size={15} />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-sa-muted fw-semibold d-block" style={{ fontSize: '0.80rem' }}>
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
          className="sa-kpi-glass-card theme-amber p-3 p-xl-3.5 d-flex flex-column justify-content-between"
          onClick={() => navigate('/super-admin/payments')}
        >
          <div className="d-flex align-items-start justify-content-between">
            <div className="sa-stat-icon-wrapper sa-stat-icon-amber">
              <IndianRupee size={22} />
            </div>
            <div className="sa-card-chevron-btn">
              <ChevronRight size={15} />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-sa-muted fw-semibold d-block" style={{ fontSize: '0.80rem' }}>
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
          className="sa-kpi-glass-card theme-red p-3 p-xl-3.5 d-flex flex-column justify-content-between"
          onClick={() => navigate('/super-admin/academies')}
        >
          <div className="d-flex align-items-start justify-content-between">
            <div className="sa-stat-icon-wrapper sa-stat-icon-red">
              <Clock size={22} />
            </div>
            <div className="sa-card-chevron-btn">
              <ChevronRight size={15} />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-sa-muted fw-semibold d-block" style={{ fontSize: '0.80rem' }}>
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

      {/* Row 2: Analytics - Academy Growth (Full Width, 12 Months) */}
      <div className="row g-3 g-xl-4">
        {/* Academy Growth (Composed Bar + Line Chart) */}
        <div className="col-12">
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
                  Total academies registered on the platform ({timeRange})
                </span>
              </div>
              <div>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="form-select form-select-sm py-1 px-2.5 rounded-2 fw-semibold"
                  style={{
                    fontSize: '0.76rem',
                    borderColor: '#E2E8F0',
                    color: '#475569',
                    width: 'auto',
                    cursor: 'pointer',
                    backgroundColor: '#FFFFFF'
                  }}
                >
                  <option value="Last 12 Months">Last 12 Months</option>
                  <option value="Last 6 Months">Last 6 Months</option>
                </select>
              </div>
            </div>

            {/* Recharts Composed Chart */}
            <div className="flex-grow-1" style={{ width: '100%', minHeight: '260px' }}>
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart
                  data={growthData}
                  margin={{ top: 22, right: 15, left: -15, bottom: 0 }}
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
                    ticks={[0, 10, 20, 30, 40, 50, 60]}
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
                  <Bar dataKey="total" fill="#8B1216" radius={[4, 4, 0, 0]} maxBarSize={34}>
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
      </div>


      {/* Row 3: Recent Academy Registrations & Quick Actions */}
      <div className="row g-3 g-xl-4 align-items-start">
        {/* Recent Academy Registrations with Geometric Role Breakdown Graphs (Left, Wide) */}
        <div className="col-12 col-xl-8">
          <div className="sa-card bg-white p-3.5 p-xl-4 rounded-3 border">
            <div>
              {/* Header */}
              <div className="d-flex flex-column gap-2 mb-3 pb-2 border-bottom">
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                  <div>
                    <div className="d-flex align-items-center gap-2">
                      <Building2 size={18} style={{ color: '#8B1216' }} />
                      <h2 className="m-0 fw-bold text-sa-charcoal" style={{ fontSize: '1.02rem' }}>
                        Recent Academy Registrations
                      </h2>
                    </div>
                    <span className="text-sa-muted d-block mt-0.5" style={{ fontSize: '0.76rem' }}>
                      Geometric role breakdown (Admins, Teachers, Students) with campus status
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

                {/* Sub-bar: Status Filter Buttons & Presentation Switcher */}
                <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2 pt-1">
                  {/* Status Filters */}
                  <div className="d-flex align-items-center gap-1.5 flex-wrap" style={{ fontSize: '0.74rem' }}>
                    <span className="text-sa-muted fw-semibold me-0.5">Status:</span>
                    <button
                      type="button"
                      onClick={() => setStatusFilter('All')}
                      className={`btn btn-sm py-0.5 px-2 rounded-pill fw-semibold border transition-all ${
                        statusFilter === 'All'
                          ? 'btn-dark text-white shadow-xs'
                          : 'btn-light text-sa-charcoal bg-white'
                      }`}
                      style={{ fontSize: '0.70rem' }}
                    >
                      All ({statusCounts.All})
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter('Active')}
                      className={`btn btn-sm py-0.5 px-2 rounded-pill fw-semibold border transition-all ${
                        statusFilter === 'Active'
                          ? 'bg-success text-white border-success shadow-xs'
                          : 'bg-white text-success border-success-subtle'
                      }`}
                      style={{ fontSize: '0.70rem' }}
                    >
                      ● Active ({statusCounts.Active})
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter('Pending')}
                      className={`btn btn-sm py-0.5 px-2 rounded-pill fw-semibold border transition-all ${
                        statusFilter === 'Pending'
                          ? 'bg-warning text-dark border-warning shadow-xs'
                          : 'bg-white text-warning border-warning-subtle'
                      }`}
                      style={{ fontSize: '0.70rem' }}
                    >
                      ● Pending ({statusCounts.Pending})
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter('Suspended')}
                      className={`btn btn-sm py-0.5 px-2 rounded-pill fw-semibold border transition-all ${
                        statusFilter === 'Suspended'
                          ? 'bg-danger text-white border-danger shadow-xs'
                          : 'bg-white text-danger border-danger-subtle'
                      }`}
                      style={{ fontSize: '0.70rem' }}
                    >
                      ● Suspended ({statusCounts.Suspended})
                    </button>
                  </div>

                  {/* Mode Switcher */}
                  <div className="d-inline-flex align-items-center bg-light p-0.5 rounded-2 border">
                    <button
                      type="button"
                      onClick={() => setSeparateGraphMode('separate')}
                      className={`btn btn-sm d-flex align-items-center gap-1 py-1 px-2 rounded-1 fw-semibold border-0 transition-all ${
                        separateGraphMode === 'separate'
                          ? 'bg-white shadow-sm text-sa-primary'
                          : 'text-sa-muted'
                      }`}
                      style={{ fontSize: '0.72rem' }}
                      title="3 Separate Dedicated Graphs"
                    >
                      <BarChart2 size={12} />
                      <span>3 Graphs</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSeparateGraphMode('grouped')}
                      className={`btn btn-sm d-flex align-items-center gap-1 py-1 px-2 rounded-1 fw-semibold border-0 transition-all ${
                        separateGraphMode === 'grouped'
                          ? 'bg-white shadow-sm text-sa-charcoal'
                          : 'text-sa-muted'
                      }`}
                      style={{ fontSize: '0.72rem' }}
                      title="Grouped Comparison"
                    >
                      <BarChart3 size={12} />
                      <span>Grouped</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSeparateGraphMode('stacked')}
                      className={`btn btn-sm d-flex align-items-center gap-1 py-1 px-2 rounded-1 fw-semibold border-0 transition-all ${
                        separateGraphMode === 'stacked'
                          ? 'bg-white shadow-sm text-sa-charcoal'
                          : 'text-sa-muted'
                      }`}
                      style={{ fontSize: '0.72rem' }}
                      title="Stacked Graph"
                    >
                      <Layers size={12} />
                      <span>Stacked</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Dynamic Views */}
              {separateGraphMode === 'separate' ? (
                /* 3 SEPARATE DEDICATED GRAPHS FOR ADMIN, TEACHER, AND STUDENT */
                <div>
                  <div className="row g-2 g-xl-3">
                    {/* 1. Admins Separate Graph */}
                    <div className="col-12 col-md-4">
                      <div
                        className="p-2.5 p-xl-3 rounded-3 h-100 d-flex flex-column justify-content-between"
                        style={{
                          backgroundColor: '#FFFAFA',
                          border: '1.5px solid #FECACA',
                          boxShadow: '0 2px 6px rgba(139, 18, 22, 0.04)'
                        }}
                      >
                        <div className="d-flex align-items-center justify-content-between mb-1.5">
                          <div className="d-flex align-items-center gap-1.5">
                            <div className="p-1 rounded-2 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#FDF0F0' }}>
                              <Shield size={14} style={{ color: '#8B1216' }} />
                            </div>
                            <div>
                              <span className="fw-bold text-sa-charcoal d-block" style={{ fontSize: '0.80rem' }}>
                                Admins
                              </span>
                              <span className="text-sa-muted d-block" style={{ fontSize: '0.67rem' }}>
                                Campus Admins
                              </span>
                            </div>
                          </div>
                          <span
                            className="badge rounded-pill fw-semibold px-2 py-0.5"
                            style={{ backgroundColor: '#FDF0F0', color: '#8B1216', border: '1px solid #FECACA', fontSize: '0.70rem' }}
                          >
                            {filteredRegistrations.reduce((acc, curr) => acc + curr.admins, 0)} Total
                          </span>
                        </div>

                        <div style={{ width: '100%', height: '185px' }}>
                          <ResponsiveContainer width="100%" height={185}>
                            <BarChart data={filteredRegistrations} margin={{ top: 15, right: 6, left: -24, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#FEE2E2" />
                              <XAxis
                                dataKey="shortName"
                                axisLine={false}
                                tickLine={false}
                                tick={renderStatusAxisTick}
                                height={34}
                              />
                              <YAxis
                                domain={[0, 6]}
                                ticks={[0, 2, 4, 6]}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#8B1216', fontSize: 10, fontWeight: 600 }}
                              />
                              <Tooltip content={renderStatusTooltip} />
                              <Bar dataKey="admins" fill="#8B1216" radius={[4, 4, 0, 0]} maxBarSize={24}>
                                <LabelList
                                  dataKey="admins"
                                  position="top"
                                  style={{ fill: '#8B1216', fontSize: '10px', fontWeight: 700 }}
                                />
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>

                        <div className="pt-1.5 border-top d-flex align-items-center justify-content-between flex-wrap gap-1" style={{ fontSize: '0.68rem' }}>
                          <span className="text-sa-muted">Scale: 0–6</span>
                          <span className="fw-semibold d-flex align-items-center gap-1">
                            <span className="text-success">● Active</span>
                            <span className="text-warning">● Pending</span>
                            <span className="text-danger">● Suspended</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 2. Teachers Separate Graph */}
                    <div className="col-12 col-md-4">
                      <div
                        className="p-2.5 p-xl-3 rounded-3 h-100 d-flex flex-column justify-content-between"
                        style={{
                          backgroundColor: '#FFFDF9',
                          border: '1.5px solid #FDE68A',
                          boxShadow: '0 2px 6px rgba(217, 119, 6, 0.04)'
                        }}
                      >
                        <div className="d-flex align-items-center justify-content-between mb-1.5">
                          <div className="d-flex align-items-center gap-1.5">
                            <div className="p-1 rounded-2 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#FEF8EB' }}>
                              <UserCheck size={14} style={{ color: '#D97706' }} />
                            </div>
                            <div>
                              <span className="fw-bold text-sa-charcoal d-block" style={{ fontSize: '0.80rem' }}>
                                Teachers
                              </span>
                              <span className="text-sa-muted d-block" style={{ fontSize: '0.67rem' }}>
                                Instructors
                              </span>
                            </div>
                          </div>
                          <span
                            className="badge rounded-pill fw-semibold px-2 py-0.5"
                            style={{ backgroundColor: '#FEF8EB', color: '#D97706', border: '1px solid #FDE68A', fontSize: '0.70rem' }}
                          >
                            {filteredRegistrations.reduce((acc, curr) => acc + curr.teachers, 0)} Total
                          </span>
                        </div>

                        <div style={{ width: '100%', height: '185px' }}>
                          <ResponsiveContainer width="100%" height={185}>
                            <BarChart data={filteredRegistrations} margin={{ top: 15, right: 6, left: -24, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#FEF3C7" />
                              <XAxis
                                dataKey="shortName"
                                axisLine={false}
                                tickLine={false}
                                tick={renderStatusAxisTick}
                                height={34}
                              />
                              <YAxis
                                domain={[0, 40]}
                                ticks={[0, 10, 20, 30, 40]}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#D97706', fontSize: 10, fontWeight: 600 }}
                              />
                              <Tooltip content={renderStatusTooltip} />
                              <Bar dataKey="teachers" fill="#D97706" radius={[4, 4, 0, 0]} maxBarSize={24}>
                                <LabelList
                                  dataKey="teachers"
                                  position="top"
                                  style={{ fill: '#D97706', fontSize: '10px', fontWeight: 700 }}
                                />
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>

                        <div className="pt-1.5 border-top d-flex align-items-center justify-content-between flex-wrap gap-1" style={{ fontSize: '0.68rem' }}>
                          <span className="text-sa-muted">Scale: 0–40</span>
                          <span className="fw-semibold d-flex align-items-center gap-1">
                            <span className="text-success">● Active</span>
                            <span className="text-warning">● Pending</span>
                            <span className="text-danger">● Suspended</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 3. Students Separate Graph */}
                    <div className="col-12 col-md-4">
                      <div
                        className="p-2.5 p-xl-3 rounded-3 h-100 d-flex flex-column justify-content-between"
                        style={{
                          backgroundColor: '#F8FAFF',
                          border: '1.5px solid #BFDBFE',
                          boxShadow: '0 2px 6px rgba(37, 99, 235, 0.04)'
                        }}
                      >
                        <div className="d-flex align-items-center justify-content-between mb-1.5">
                          <div className="d-flex align-items-center gap-1.5">
                            <div className="p-1 rounded-2 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#EFF6FF' }}>
                              <GraduationCap size={14} style={{ color: '#2563EB' }} />
                            </div>
                            <div>
                              <span className="fw-bold text-sa-charcoal d-block" style={{ fontSize: '0.80rem' }}>
                                Students
                              </span>
                              <span className="text-sa-muted d-block" style={{ fontSize: '0.67rem' }}>
                                Learners
                              </span>
                            </div>
                          </div>
                          <span
                            className="badge rounded-pill fw-semibold px-2 py-0.5"
                            style={{ backgroundColor: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', fontSize: '0.70rem' }}
                          >
                            {filteredRegistrations.reduce((acc, curr) => acc + curr.students, 0)} Total
                          </span>
                        </div>

                        <div style={{ width: '100%', height: '185px' }}>
                          <ResponsiveContainer width="100%" height={185}>
                            <BarChart data={filteredRegistrations} margin={{ top: 15, right: 6, left: -20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#DBEAFE" />
                              <XAxis
                                dataKey="shortName"
                                axisLine={false}
                                tickLine={false}
                                tick={renderStatusAxisTick}
                                height={34}
                              />
                              <YAxis
                                domain={[0, 300]}
                                ticks={[0, 100, 200, 300]}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#2563EB', fontSize: 10, fontWeight: 600 }}
                              />
                              <Tooltip content={renderStatusTooltip} />
                              <Bar dataKey="students" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={24}>
                                <LabelList
                                  dataKey="students"
                                  position="top"
                                  style={{ fill: '#2563EB', fontSize: '10px', fontWeight: 700 }}
                                />
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>

                        <div className="pt-1.5 border-top d-flex align-items-center justify-content-between flex-wrap gap-1" style={{ fontSize: '0.68rem' }}>
                          <span className="text-sa-muted">Scale: 0–300</span>
                          <span className="fw-semibold d-flex align-items-center gap-1">
                            <span className="text-success">● Active</span>
                            <span className="text-warning">● Pending</span>
                            <span className="text-danger">● Suspended</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : separateGraphMode === 'grouped' ? (
                /* CLUSTERED / GROUPED SIDE-BY-SIDE BARS */
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-2" style={{ fontSize: '0.78rem' }}>
                    <div className="d-flex align-items-center gap-3">
                      <div className="d-flex align-items-center gap-1.5">
                        <span className="rounded-1" style={{ width: '10px', height: '10px', backgroundColor: '#8B1216' }} />
                        <span className="fw-semibold text-sa-charcoal">Admins</span>
                      </div>
                      <div className="d-flex align-items-center gap-1.5">
                        <span className="rounded-1" style={{ width: '10px', height: '10px', backgroundColor: '#D97706' }} />
                        <span className="fw-semibold text-sa-charcoal">Teachers</span>
                      </div>
                      <div className="d-flex align-items-center gap-1.5">
                        <span className="rounded-1" style={{ width: '10px', height: '10px', backgroundColor: '#2563EB' }} />
                        <span className="fw-semibold text-sa-charcoal">Students</span>
                      </div>
                    </div>
                    <span className="text-sa-muted" style={{ fontSize: '0.70rem' }}>
                      Grouped bars per campus
                    </span>
                  </div>

                  <div style={{ width: '100%', height: '220px' }}>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={filteredRegistrations} margin={{ top: 15, right: 8, left: -20, bottom: 0 }} barGap={2}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                        <XAxis
                          dataKey="shortName"
                          axisLine={false}
                          tickLine={false}
                          tick={renderStatusAxisTick}
                          height={34}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#64748B', fontSize: 10 }}
                        />
                        <Tooltip content={renderStatusTooltip} />
                        <Bar dataKey="admins" name="Admins" fill="#8B1216" radius={[3, 3, 0, 0]} maxBarSize={16} />
                        <Bar dataKey="teachers" name="Teachers" fill="#D97706" radius={[3, 3, 0, 0]} maxBarSize={16} />
                        <Bar dataKey="students" name="Students" fill="#2563EB" radius={[3, 3, 0, 0]} maxBarSize={16} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                /* STACKED PROPORTIONAL COMPOSITION GRAPH */
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-2" style={{ fontSize: '0.78rem' }}>
                    <div className="d-flex align-items-center gap-3">
                      <div className="d-flex align-items-center gap-1.5">
                        <span className="rounded-1" style={{ width: '10px', height: '10px', backgroundColor: '#8B1216' }} />
                        <span className="fw-semibold text-sa-charcoal">Admins</span>
                      </div>
                      <div className="d-flex align-items-center gap-1.5">
                        <span className="rounded-1" style={{ width: '10px', height: '10px', backgroundColor: '#D97706' }} />
                        <span className="fw-semibold text-sa-charcoal">Teachers</span>
                      </div>
                      <div className="d-flex align-items-center gap-1.5">
                        <span className="rounded-1" style={{ width: '10px', height: '10px', backgroundColor: '#2563EB' }} />
                        <span className="fw-semibold text-sa-charcoal">Students</span>
                      </div>
                    </div>
                    <span className="text-sa-muted" style={{ fontSize: '0.70rem' }}>
                      Stacked cumulative role count
                    </span>
                  </div>

                  <div style={{ width: '100%', height: '220px' }}>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={filteredRegistrations} margin={{ top: 15, right: 8, left: -20, bottom: 0 }} maxBarSize={28}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                        <XAxis
                          dataKey="shortName"
                          axisLine={false}
                          tickLine={false}
                          tick={renderStatusAxisTick}
                          height={34}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#64748B', fontSize: 10 }}
                        />
                        <Tooltip content={renderStatusTooltip} />
                        <Bar dataKey="admins" name="Admins" stackId="users" fill="#8B1216" />
                        <Bar dataKey="teachers" name="Teachers" stackId="users" fill="#D97706" />
                        <Bar dataKey="students" name="Students" stackId="users" fill="#2563EB" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Academy Quick Breakdown Chips with Status */}
            <div className="d-grid pt-2.5 border-top mt-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
              {filteredRegistrations.map((acad) => (
                <div
                  key={acad.id}
                  onClick={() => setSelectedAcademy(acad)}
                  className="p-1.5 p-sm-2 rounded-2 bg-light text-center transition-all"
                  title="Click to inspect role breakdown"
                  style={{ cursor: 'pointer', border: '1px solid #E2E8F0' }}
                >
                  <div className="d-flex align-items-center justify-content-between gap-1 mb-0.5">
                    <span className="fw-bold text-sa-charcoal text-truncate" style={{ fontSize: '0.74rem' }}>
                      {acad.name.split(' ')[0]}
                    </span>
                    <span
                      className="badge rounded-pill fw-semibold px-1.5 py-0.5 d-inline-flex align-items-center gap-1"
                      style={{
                        fontSize: '0.62rem',
                        backgroundColor: acad.status === 'Active' ? '#EAF6EF' : acad.status === 'Pending' ? '#FEF8EB' : '#FDF0F0',
                        color: acad.status === 'Active' ? '#168554' : acad.status === 'Pending' ? '#D97706' : '#DC2626',
                        border: `1px solid ${acad.status === 'Active' ? '#A7F3D0' : acad.status === 'Pending' ? '#FDE68A' : '#FECACA'}`
                      }}
                    >
                      <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: acad.status === 'Active' ? '#168554' : acad.status === 'Pending' ? '#D97706' : '#DC2626' }} />
                      {acad.status}
                    </span>
                  </div>
                  <span className="text-sa-muted d-block mt-0.5" style={{ fontSize: '0.66rem' }}>
                    <span style={{ color: '#8B1216', fontWeight: 600 }}>{acad.admins}A</span> ·{' '}
                    <span style={{ color: '#D97706', fontWeight: 600 }}>{acad.teachers}T</span> ·{' '}
                    <span style={{ color: '#2563EB', fontWeight: 600 }}>{acad.students}S</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions (Right Column, beside Recent Academy Registrations) */}
        <div className="col-12 col-xl-4">
          <div className="sa-card bg-white p-3.5 p-xl-4 rounded-3 border">
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

      {selectedAcademy && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(3px)',
            zIndex: 1050,
            padding: '1rem'
          }}
          onClick={() => setSelectedAcademy(null)}
        >
          <div
            className="bg-white rounded-3 shadow-lg border p-4"
            style={{
              maxWidth: '460px',
              width: '100%',
              animation: 'fadeIn 0.15s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="d-flex align-items-start justify-content-between mb-3 pb-2 border-bottom">
              <div>
                <div className="d-flex align-items-center gap-2">
                  <Building2 size={18} style={{ color: '#8B1216' }} />
                  <h5 className="m-0 fw-bold text-sa-charcoal" style={{ fontSize: '1.05rem' }}>
                    {selectedAcademy.name}
                  </h5>
                </div>
                <span className="text-sa-muted d-block mt-0.5" style={{ fontSize: '0.78rem' }}>
                  Owner: <strong className="text-sa-charcoal">{selectedAcademy.owner}</strong> · Plan: <span className="badge rounded-pill bg-light text-sa-primary border">{selectedAcademy.plan}</span> · Status: <span
                    className="badge rounded-pill fw-semibold px-2 py-0.5 d-inline-flex align-items-center gap-1"
                    style={{
                      fontSize: '0.70rem',
                      backgroundColor: selectedAcademy.status === 'Active' ? '#EAF6EF' : selectedAcademy.status === 'Pending' ? '#FEF8EB' : '#FDF0F0',
                      color: selectedAcademy.status === 'Active' ? '#168554' : selectedAcademy.status === 'Pending' ? '#D97706' : '#DC2626',
                      border: `1px solid ${selectedAcademy.status === 'Active' ? '#A7F3D0' : selectedAcademy.status === 'Pending' ? '#FDE68A' : '#FECACA'}`
                    }}
                  >
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: selectedAcademy.status === 'Active' ? '#168554' : selectedAcademy.status === 'Pending' ? '#D97706' : '#DC2626' }} />
                    {selectedAcademy.status}
                  </span>
                </span>
              </div>
              <button
                className="btn btn-sm btn-light rounded-circle p-1 d-flex align-items-center justify-content-center"
                onClick={() => setSelectedAcademy(null)}
                style={{ width: '28px', height: '28px' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Role Composition Metrics */}
            <div className="mb-3">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="fw-semibold text-sa-charcoal" style={{ fontSize: '0.82rem' }}>
                  Geometric User Distribution
                </span>
                <span className="fw-bold text-sa-charcoal" style={{ fontSize: '0.82rem' }}>
                  {selectedAcademy.users} Total Users
                </span>
              </div>

              {/* Segmented Progress Bar */}
              <div className="d-flex rounded-pill overflow-hidden mb-3" style={{ height: '10px', backgroundColor: '#F1F5F9' }}>
                <div
                  style={{
                    width: `${(selectedAcademy.admins / selectedAcademy.users) * 100}%`,
                    backgroundColor: '#8B1216'
                  }}
                  title={`Admins: ${selectedAcademy.admins}`}
                />
                <div
                  style={{
                    width: `${(selectedAcademy.teachers / selectedAcademy.users) * 100}%`,
                    backgroundColor: '#D97706'
                  }}
                  title={`Teachers: ${selectedAcademy.teachers}`}
                />
                <div
                  style={{
                    width: `${(selectedAcademy.students / selectedAcademy.users) * 100}%`,
                    backgroundColor: '#2563EB'
                  }}
                  title={`Students: ${selectedAcademy.students}`}
                />
              </div>

              {/* 3 Role Metric Cards */}
              <div className="row g-2">
                <div className="col-4">
                  <div className="p-2.5 rounded-2 text-center" style={{ backgroundColor: '#FDF0F0', border: '1px solid #FECACA' }}>
                    <div className="d-flex align-items-center justify-content-center gap-1 mb-1">
                      <Shield size={13} style={{ color: '#8B1216' }} />
                      <span className="fw-semibold" style={{ fontSize: '0.72rem', color: '#8B1216' }}>Admins</span>
                    </div>
                    <span className="d-block fw-bold" style={{ fontSize: '1.1rem', color: '#8B1216' }}>
                      {selectedAcademy.admins}
                    </span>
                    <span className="text-muted d-block" style={{ fontSize: '0.66rem' }}>
                      {((selectedAcademy.admins / selectedAcademy.users) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="col-4">
                  <div className="p-2.5 rounded-2 text-center" style={{ backgroundColor: '#FEF8EB', border: '1px solid #FDE68A' }}>
                    <div className="d-flex align-items-center justify-content-center gap-1 mb-1">
                      <UserCheck size={13} style={{ color: '#D97706' }} />
                      <span className="fw-semibold" style={{ fontSize: '0.72rem', color: '#D97706' }}>Teachers</span>
                    </div>
                    <span className="d-block fw-bold" style={{ fontSize: '1.1rem', color: '#D97706' }}>
                      {selectedAcademy.teachers}
                    </span>
                    <span className="text-muted d-block" style={{ fontSize: '0.66rem' }}>
                      {((selectedAcademy.teachers / selectedAcademy.users) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="col-4">
                  <div className="p-2.5 rounded-2 text-center" style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                    <div className="d-flex align-items-center justify-content-center gap-1 mb-1">
                      <GraduationCap size={13} style={{ color: '#2563EB' }} />
                      <span className="fw-semibold" style={{ fontSize: '0.72rem', color: '#2563EB' }}>Students</span>
                    </div>
                    <span className="d-block fw-bold" style={{ fontSize: '1.1rem', color: '#2563EB' }}>
                      {selectedAcademy.students}
                    </span>
                    <span className="text-muted d-block" style={{ fontSize: '0.66rem' }}>
                      {((selectedAcademy.students / selectedAcademy.users) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Meta Footer */}
            <div className="d-flex align-items-center justify-content-between pt-2 border-top" style={{ fontSize: '0.75rem' }}>
              <span className="text-sa-muted">
                Joined: <strong>{selectedAcademy.joined}</strong>
              </span>
              <button
                onClick={() => {
                  setSelectedAcademy(null);
                  navigate('/super-admin/academies');
                }}
                className="btn btn-sm btn-outline-danger py-1 px-3 rounded-2 fw-semibold"
                style={{ fontSize: '0.75rem' }}
              >
                View Full Academy Profile &rarr;
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
