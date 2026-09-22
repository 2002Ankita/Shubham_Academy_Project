import React from 'react';
import StatCard from '../../components/dashboard/StatCard';
import AttendanceChart from '../../components/dashboard/AttendanceChart';
import FeeChart from '../../components/dashboard/FeeChart';
import Table from '../../components/common/Table';
import { Building2, Users, GraduationCap, ShieldCheck, Activity } from 'lucide-react';

export default function SuperAdminDashboard() {
  const branchData = [
    { id: 'BR-01', name: 'Pune Main Campus (Kothrud)', students: 480, faculty: 32, collection: '₹ 1.52 Cr', health: 'Optimal' },
    { id: 'BR-02', name: 'Baner Tech Hub Branch', students: 310, faculty: 22, collection: '₹ 94 Lakhs', health: 'Optimal' },
    { id: 'BR-03', name: 'Viman Nagar Extension', students: 240, faculty: 18, collection: '₹ 72 Lakhs', health: 'Active' },
    { id: 'BR-04', name: 'PCMC Nigdi Campus', students: 390, faculty: 26, collection: '₹ 1.15 Cr', health: 'Optimal' },
  ];

  return (
    <div className="d-flex flex-column gap-4">
      {/* Top Welcome */}
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
        <div>
          <h2 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
            Super Administrator Control Plane
          </h2>
          <span className="small text-sa-muted">
            Multi-branch Academy Operations & System Health Monitoring
          </span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-success py-2 px-3 d-flex align-items-center gap-2">
            <Activity size={14} /> All 4 Campus APIs Operational
          </span>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="row g-3">
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Total Campuses"
            value="4 Branches"
            subtitle="Active Shubham centers"
            icon={Building2}
            color="primary"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Enrolled Students"
            value="1,420"
            subtitle="Across all batches"
            icon={GraduationCap}
            color="mustard"
            trend="8.4% YoY"
            trendType="up"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Teaching Faculty"
            value="98"
            subtitle="Verified subject experts"
            icon={Users}
            color="green"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Total Realized Fees"
            value="₹ 4.33 Cr"
            subtitle="FY 2026-27 Revenue"
            icon={ShieldCheck}
            color="orange"
            trend="14.2%"
            trendType="up"
          />
        </div>
      </div>

      {/* Visual Analytics */}
      <div className="row g-3">
        <div className="col-12 col-lg-7">
          <AttendanceChart title="Consolidated Attendance Trends (All Branches)" />
        </div>
        <div className="col-12 col-lg-5">
          <FeeChart title="Consolidated Branch Revenue Realization" />
        </div>
      </div>

      {/* Academy Branches Table */}
      <div className="sa-card p-4">
        <h5 className="brand-font fw-bold text-sa-charcoal mb-3 fs-6">
          Registered Academy Campuses
        </h5>
        <Table
          columns={[
            { key: 'id', title: 'Branch Code', render: (val) => <span className="fw-bold">{val}</span> },
            { key: 'name', title: 'Campus Name' },
            { key: 'students', title: 'Students' },
            { key: 'faculty', title: 'Faculty' },
            { key: 'collection', title: 'Fees Collected' },
            {
              key: 'health',
              title: 'Gateway Status',
              render: (val) => (
                <span className="badge-active">
                  <span className="rounded-circle" style={{ width: '6px', height: '6px', backgroundColor: 'var(--sa-success-green)' }} />
                  {val}
                </span>
              )
            }
          ]}
          data={branchData}
        />
      </div>
    </div>
  );
}
