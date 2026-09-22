import React, { useState, useEffect } from 'react';
import StatCard from '../../components/dashboard/StatCard';
import AttendanceChart from '../../components/dashboard/AttendanceChart';
import FeeChart from '../../components/dashboard/FeeChart';
import QuickActions from '../../components/dashboard/QuickActions';
import AnnouncementCard from '../../components/dashboard/AnnouncementCard';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import {
  GraduationCap,
  CalendarCheck,
  CreditCard,
  AlertCircle,
  ScanLine,
  ArrowRight
} from 'lucide-react';
import attendanceService from '../../services/attendanceService';
import studentService from '../../services/studentService';
import noticeService from '../../services/noticeService';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [logs, nots] = await Promise.all([
          attendanceService.getLogs(),
          noticeService.getAll(),
        ]);
        setAttendanceLogs(logs.slice(0, 5));
        setNotices(nots);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  return (
    <div className="d-flex flex-column gap-4">
      {/* Welcome Banner */}
      <div className="sa-card p-4 bg-white border d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
        <div>
          <span className="badge bg-sa-mustard text-dark fw-bold mb-2">
            Pune Main Campus • Academic Session 2026-27
          </span>
          <h2 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
            Academy Operations Overview
          </h2>
          <span className="small text-sa-muted">
            Live RFID Gate Telemetry, Fee Cashflow & Academic Progress
          </span>
        </div>

        <div className="d-flex align-items-center gap-2">
          <Button
            variant="primary"
            icon={ScanLine}
            onClick={() => navigate('/admin/attendance')}
          >
            Open RFID Scanner
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/admin/students/register')}
          >
            Admit New Student
          </Button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="row g-3">
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Enrolled Students"
            value="480"
            subtitle="12 Batches (Morning/Evening)"
            icon={GraduationCap}
            color="primary"
            trend="+18 this month"
            trendType="up"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Present Today (RFID)"
            value="442"
            subtitle="92.1% Attendance Rate"
            icon={CalendarCheck}
            color="green"
            trend="Gate 1 & 2 Active"
            trendType="up"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Fees Realized"
            value="₹ 1.52 Cr"
            subtitle="82.2% of target collected"
            icon={CreditCard}
            color="mustard"
            trend="₹ 14 Lakhs in Sept"
            trendType="up"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Pending Dues"
            value="₹ 33 Lakhs"
            subtitle="62 Defaulters flagged"
            icon={AlertCircle}
            color="orange"
            trend="SMS reminders sent"
            trendType="down"
          />
        </div>
      </div>

      {/* Quick Navigation Shortcuts */}
      <QuickActions role="admin" />

      {/* Charts Section */}
      <div className="row g-3">
        <div className="col-12 col-lg-7">
          <AttendanceChart title="Campus Weekly Attendance (Gate Scans)" />
        </div>
        <div className="col-12 col-lg-5">
          <FeeChart title="Monthly Fee Inflow vs Outstanding (₹ Lakhs)" />
        </div>
      </div>

      {/* Live Gate Scans & Notices Grid */}
      <div className="row g-3">
        {/* Recent RFID Scans */}
        <div className="col-12 col-lg-7">
          <div className="sa-card p-4 h-100 d-flex flex-column">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="d-flex align-items-center gap-2">
                <ScanLine size={18} className="text-sa-primary" />
                <h5 className="brand-font fw-bold m-0 text-sa-charcoal fs-6">
                  Live Gate Tap Feed (RFID)
                </h5>
              </div>
              <button
                type="button"
                className="btn btn-link btn-sm p-0 text-sa-primary fw-semibold d-flex align-items-center gap-1"
                onClick={() => navigate('/admin/attendance')}
              >
                <span>Full Ledger</span>
                <ArrowRight size={14} />
              </button>
            </div>

            <Table
              columns={[
                { key: 'time', title: 'Time', render: (val) => <span className="fw-bold">{val}</span> },
                { key: 'studentName', title: 'Student' },
                { key: 'rollNumber', title: 'Roll No.' },
                { key: 'gate', title: 'Gate' },
                {
                  key: 'status',
                  title: 'Status',
                  render: (val) => (
                    <span className={val === 'Present' ? 'badge-present' : 'badge-absent'}>
                      {val}
                    </span>
                  )
                }
              ]}
              data={attendanceLogs}
              loading={loading}
            />
          </div>
        </div>

        {/* Announcements */}
        <div className="col-12 col-lg-5">
          <AnnouncementCard notices={notices} viewAllLink="/admin/notices" />
        </div>
      </div>
    </div>
  );
}
