import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Users, CheckCircle2, XCircle, Clock3, ArrowLeft, Download, Calendar, ChevronDown, ChevronUp, Eye, LogIn, LogOut, Check } from 'lucide-react';
import * as XLSX from 'xlsx';
import { attendanceService } from '../../services/attendanceService';
import useAuth from '../../hooks/useAuth';
import Button from '../../components/common/Button';

// Date parsing helper to prevent timezone offset shifts
const parseRecordDate = (dateStr) => {
  if (!dateStr) return null;
  const parts = String(dateStr).split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
};

const getLocalDateString = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateDisplay = (dateStr) => {
  if (!dateStr) return '--';
  const d = parseRecordDate(dateStr);
  if (!d) return dateStr;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getDayName = (record) => {
  if (record.day) return record.day;
  const d = parseRecordDate(record.date);
  if (!d) return '--';
  return d.toLocaleDateString('en-US', { weekday: 'long' });
};

// Monday–Sunday week range calculation
const getWeekRange = (dateInput = new Date()) => {
  const d = new Date(dateInput);
  d.setHours(0, 0, 0, 0);
  const dayIndex = (d.getDay() + 6) % 7; // Monday = 0, ..., Sunday = 6
  const start = new Date(d);
  start.setDate(d.getDate() - dayIndex);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

const formatWeekLabel = (start, end) => {
  const startDay = String(start.getDate()).padStart(2, '0');
  const startMonth = start.toLocaleDateString('en-GB', { month: 'short' });
  const startYear = start.getFullYear();

  const endDay = String(end.getDate()).padStart(2, '0');
  const endMonth = end.toLocaleDateString('en-GB', { month: 'short' });
  const endYear = end.getFullYear();

  if (startYear !== endYear) {
    return `${startDay} ${startMonth} ${startYear} – ${endDay} ${endMonth} ${endYear}`;
  }
  if (startMonth !== endMonth) {
    return `${startDay} ${startMonth} – ${endDay} ${endMonth} ${endYear}`;
  }
  return `${startDay} ${startMonth} – ${endDay} ${endMonth} ${endYear}`;
};

// Excel Export Utility
const exportWeeklyAttendanceToExcel = (weekLabel, records, teacherName = 'Teacher') => {
  try {
    const sheetData = [
      ['SHUBHAM ACADEMY'],
      ['TEACHER WEEKLY ATTENDANCE REGISTER'],
      ['Teacher Name:', teacherName, 'Week Period:', weekLabel],
      ['Export Date:', new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })],
      [],
      ['Date', 'Day', 'Check In', 'Check Out', 'Hours', 'Status']
    ];

    if (!records || records.length === 0) {
      sheetData.push(['No attendance recorded for this week.', '', '', '', '', '']);
    } else {
      records.forEach((r) => {
        sheetData.push([
          formatDateDisplay(r.date),
          getDayName(r),
          r.checkIn || '--',
          r.checkOut || '--',
          r.totalHours || '--',
          r.status || 'Present'
        ]);
      });
    }

    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    ws['!cols'] = [
      { wch: 16 }, // Date
      { wch: 14 }, // Day
      { wch: 14 }, // Check In
      { wch: 14 }, // Check Out
      { wch: 14 }, // Hours
      { wch: 16 }  // Status
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Weekly Attendance');
    const safeLabel = weekLabel.replace(/[^a-zA-Z0-9]/g, '_');
    XLSX.writeFile(wb, `Attendance_${safeLabel}.xlsx`);
    toast.success(`Exported attendance for ${weekLabel}`);
  } catch (err) {
    console.error('Failed to export attendance to Excel:', err);
    toast.error('Failed to export Excel file');
  }
};

export default function TeacherAttendance() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [teacherRecords, setTeacherRecords] = useState([]);
  const [teacherRecordsLoading, setTeacherRecordsLoading] = useState(true);
  const [attendanceActionLoading, setAttendanceActionLoading] = useState(false);
  const [expandedWeekKeys, setExpandedWeekKeys] = useState([]);

  const fetchTeacherRecords = async () => {
    if (!user?.id) {
      setTeacherRecordsLoading(false);
      return;
    }
    try {
      const data = await attendanceService.getWorkingTime(user.id);
      setTeacherRecords(data || []);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to load your attendance records');
      setTeacherRecords([]);
    } finally {
      setTeacherRecordsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeacherRecords();
  }, [user?.id]);

  const todayDateStr = getLocalDateString();
  const isoToday = new Date().toISOString().slice(0, 10);
  const todayRecord = teacherRecords.find(record => record.date === todayDateStr || record.date === isoToday);
  const hasCheckedIn = Boolean(todayRecord && todayRecord.checkIn !== '--');
  const hasCheckedOut = Boolean(todayRecord && todayRecord.checkOut !== '--' && todayRecord.checkOut !== 'In Progress');
  const isWorkingNow = hasCheckedIn && !hasCheckedOut;

  // Compute Current Week Bounds dynamically
  const currentWeek = useMemo(() => {
    const range = getWeekRange(new Date());
    return {
      ...range,
      label: formatWeekLabel(range.start, range.end),
      key: getLocalDateString(range.start)
    };
  }, []);

  // Deduplicate teacher records to avoid any duplicate entries
  const deduplicatedRecords = useMemo(() => {
    const map = new Map();
    (teacherRecords || []).forEach(r => {
      const key = r.id || `${r.date}_${r.checkIn}`;
      if (!map.has(key)) {
        map.set(key, r);
      }
    });
    return Array.from(map.values());
  }, [teacherRecords]);

  // Filter records for the CURRENT active week only
  const currentWeekRecords = useMemo(() => {
    return deduplicatedRecords
      .filter(record => {
        const d = parseRecordDate(record.date);
        return d && d >= currentWeek.start && d <= currentWeek.end;
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [deduplicatedRecords, currentWeek]);

  // Group historical records into COMPLETED past weeks (strictly before currentWeek.start)
  const pastWeeks = useMemo(() => {
    const groups = new Map();

    deduplicatedRecords.forEach(record => {
      const d = parseRecordDate(record.date);
      if (d && d < currentWeek.start) {
        const week = getWeekRange(d);
        const weekKey = getLocalDateString(week.start);
        if (!groups.has(weekKey)) {
          groups.set(weekKey, {
            key: weekKey,
            start: week.start,
            end: week.end,
            label: formatWeekLabel(week.start, week.end),
            records: []
          });
        }
        groups.get(weekKey).records.push(record);
      }
    });

    return Array.from(groups.values())
      .map(w => ({
        ...w,
        records: w.records.sort((a, b) => a.date.localeCompare(b.date))
      }))
      .sort((a, b) => b.start.getTime() - a.start.getTime()); // Most recent past week first
  }, [deduplicatedRecords, currentWeek]);

  const toggleWeekExpansion = (weekKey) => {
    setExpandedWeekKeys(prev =>
      prev.includes(weekKey) ? prev.filter(k => k !== weekKey) : [...prev, weekKey]
    );
  };

  const handleTeacherAttendance = async (action) => {
    if (!user?.id) {
      toast.error('Unable to identify your teacher account');
      return;
    }
    setAttendanceActionLoading(true);
    try {
      if (action === 'check-in') {
        await attendanceService.checkIn(user.id);
        toast.success('Successfully checked in! Have a productive day.');
      } else {
        await attendanceService.checkOut(user.id);
        toast.success('Successfully checked out! Great work today.');
      }
      await fetchTeacherRecords();
    } catch (error) {
      toast.error(error.response?.data?.detail || `Failed to ${action === 'check-in' ? 'check in' : 'check out'}`);
    } finally {
      setAttendanceActionLoading(false);
    }
  };

  const presentCount = teacherRecords.filter(record => (record.status || '').toLowerCase() === 'present').length;
  const absentCount = teacherRecords.filter(record => (record.status || '').toLowerCase() === 'absent').length;
  const onLeaveCount = teacherRecords.filter(record => /leave/i.test(record.status || '')).length;
  const totalTeacherCount = teacherRecords.length || 0;

  const summaryCards = [
    {
      title: 'Total Records',
      value: totalTeacherCount,
      icon: Users,
      iconBg: '#E8F3FF',
      iconColor: '#346EBA'
    },
    {
      title: 'Present',
      value: presentCount,
      icon: CheckCircle2,
      iconBg: '#EAF6EF',
      iconColor: '#168554'
    },
    {
      title: 'Absent',
      value: absentCount,
      icon: XCircle,
      iconBg: '#FDF0F0',
      iconColor: '#A91D22'
    },
    {
      title: 'On Leave',
      value: onLeaveCount,
      icon: Clock3,
      iconBg: '#EEF3FF',
      iconColor: '#3B82F6'
    }
  ];

  const renderStatusBadge = (recordOrStatus) => {
    const isObj = recordOrStatus && typeof recordOrStatus === 'object';
    const status = isObj ? (recordOrStatus.status || 'Present') : (recordOrStatus || 'Present');
    const isAuto = isObj && (recordOrStatus.isAutoClosed || (recordOrStatus.remarks && recordOrStatus.remarks.toLowerCase().includes('auto closed')));
    const s = status.toLowerCase();

    if (s.includes('working')) {
      return (
        <span
          className="badge border d-inline-flex align-items-center gap-1.5"
          style={{ backgroundColor: '#ECFDF5', color: '#047857', borderColor: '#A7F3D0', fontSize: '12px', padding: '5px 10px', borderRadius: '8px' }}
        >
          <span className="rounded-circle" style={{ width: '6px', height: '6px', backgroundColor: '#10B981' }} />
          Working
        </span>
      );
    }
    if (s.includes('present')) {
      return (
        <div className="d-inline-flex flex-wrap align-items-center gap-1.5">
          <span
            className="badge border"
            style={{ backgroundColor: '#EAF6EF', color: '#168554', borderColor: '#C4EAD4', fontSize: '12px', padding: '5px 10px', borderRadius: '8px' }}
          >
            Present
          </span>
          {isAuto && (
            <span
              className="badge border"
              style={{
                backgroundColor: '#EFF6FF',
                color: '#1E40AF',
                borderColor: '#DBEAFE',
                fontSize: '11px',
                padding: '3px 8px',
                borderRadius: '6px',
                fontWeight: 600
              }}
              title="Automatically closed based on scheduled timetable lecture hours"
            >
              Auto Closed
            </span>
          )}
        </div>
      );
    }
    if (s.includes('absent')) {
      return (
        <span
          className="badge border"
          style={{ backgroundColor: '#FDF0F0', color: '#A91D22', borderColor: '#F8D2D3', fontSize: '12px', padding: '5px 10px', borderRadius: '8px' }}
        >
          {status}
        </span>
      );
    }
    if (s.includes('leave')) {
      return (
        <span
          className="badge border"
          style={{ backgroundColor: '#EEF3FF', color: '#3B82F6', borderColor: '#D3E0FD', fontSize: '12px', padding: '5px 10px', borderRadius: '8px' }}
        >
          {status}
        </span>
      );
    }
    return <span className="badge bg-light text-sa-charcoal border" style={{ fontSize: '12px', padding: '5px 10px', borderRadius: '8px' }}>{status}</span>;
  };

  const teacherDisplayName = user?.name || user?.full_name || 'Teacher';

  return (
    <div className="d-flex flex-column w-100" style={{ gap: '22px' }}>
      {/* 1. TOP HEADER & ACTION AREA */}
      <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 pt-1">
        <div className="d-flex align-items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/teacher/dashboard')}
            className="btn btn-light d-inline-flex align-items-center justify-content-center border shadow-sm"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              borderColor: '#E2E8F0',
              backgroundColor: '#FFFFFF',
              color: '#0F172A',
              padding: 0,
              cursor: 'pointer'
            }}
            aria-label="Back to dashboard"
            title="Back to dashboard"
          >
            <ArrowLeft size={18} />
          </button>

          <div>
            <h1 className="fw-bold brand-font text-sa-charcoal m-0" style={{ fontSize: '22px', lineHeight: 1.25 }}>
              Attendance Register
            </h1>
            <p className="text-sa-muted m-0 mt-1" style={{ fontSize: '13.5px' }}>
              Daily check-in, check-out and attendance records
            </p>
          </div>
        </div>

        {/* Right: Controls & Actions */}
        <div className="d-flex align-items-center flex-wrap gap-2.5">
          {/* State 1: Shift Completed Today */}
          {hasCheckedIn && hasCheckedOut ? (
            <div
              className="d-inline-flex align-items-center flex-wrap gap-2 px-3 py-2 bg-white border shadow-sm"
              style={{
                borderColor: '#E2E8F0',
                borderRadius: '12px'
              }}
            >
              <div className="d-flex align-items-center gap-1.5 text-success fw-semibold" style={{ fontSize: '13px' }}>
                <CheckCircle2 size={16} />
                <span>Shift Completed</span>
              </div>
              <span className="text-sa-muted" style={{ fontSize: '12px' }}>•</span>
              <span className="text-sa-charcoal fw-medium" style={{ fontSize: '12.5px' }}>
                In: <strong className="text-dark">{todayRecord?.checkIn}</strong>
              </span>
              <span className="text-sa-muted" style={{ fontSize: '12px' }}>•</span>
              <span className="text-sa-charcoal fw-medium" style={{ fontSize: '12.5px' }}>
                Out: <strong className="text-dark">{todayRecord?.checkOut}</strong>
              </span>
              <span
                className="badge border ms-1"
                style={{
                  backgroundColor: '#EFF6FF',
                  color: '#1D4ED8',
                  borderColor: '#BFDBFE',
                  fontSize: '11.5px',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontWeight: 600
                }}
              >
                {todayRecord?.totalHours || '0h 0m'}
              </span>
            </div>
          ) : isWorkingNow ? (
            /* State 2: Active Working Shift (Checked in, pending checkout) */
            <div className="d-flex align-items-center flex-wrap gap-2">
              <div
                className="d-inline-flex align-items-center gap-2 px-3 py-2 border"
                style={{
                  backgroundColor: '#ECFDF5',
                  borderColor: '#A7F3D0',
                  borderRadius: '12px',
                  color: '#065F46',
                  fontSize: '13px',
                  fontWeight: 600
                }}
              >
                <span
                  className="rounded-circle d-inline-block"
                  style={{
                    width: '8px',
                    height: '8px',
                    backgroundColor: '#10B981',
                    boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.3)'
                  }}
                />
                <span>Checked In: {todayRecord?.checkIn}</span>
              </div>
              <button
                type="button"
                onClick={() => handleTeacherAttendance('check-out')}
                disabled={attendanceActionLoading}
                className="btn d-inline-flex align-items-center gap-2 px-3.5 py-2 text-white shadow-sm fw-semibold"
                style={{
                  background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
                  borderRadius: '12px',
                  fontSize: '13.5px',
                  border: 'none',
                  boxShadow: '0 4px 14px rgba(220, 38, 38, 0.3)',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(220, 38, 38, 0.4)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(220, 38, 38, 0.3)'; }}
              >
                <LogOut size={16} />
                <span>{attendanceActionLoading ? 'Processing...' : 'Check Out Now'}</span>
              </button>
            </div>
          ) : (
            /* State 3: Not Checked In Yet Today */
            <div className="d-flex align-items-center flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleTeacherAttendance('check-in')}
                disabled={attendanceActionLoading || !user?.id}
                className="btn d-inline-flex align-items-center gap-2 px-3.5 py-2 text-white shadow-sm fw-semibold"
                style={{
                  background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)',
                  borderRadius: '12px',
                  fontSize: '13.5px',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(22, 163, 74, 0.35)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(22, 163, 74, 0.25)'; }}
              >
                <LogIn size={16} />
                <span>{attendanceActionLoading ? 'Checking in...' : 'Check In'}</span>
              </button>

              <button
                type="button"
                disabled
                className="btn d-inline-flex align-items-center gap-2 px-3 py-2 text-muted fw-semibold border"
                style={{
                  backgroundColor: '#F8FAFC',
                  borderColor: '#E2E8F0',
                  borderRadius: '12px',
                  fontSize: '13.5px',
                  cursor: 'not-allowed',
                  opacity: 0.65
                }}
                title="Please check in first"
              >
                <LogOut size={16} />
                <span>Check Out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Live Active Duty Status Banner */}
      {isWorkingNow && (
        <div
          className="p-3 rounded-4 d-flex align-items-center justify-content-between flex-wrap gap-3"
          style={{
            backgroundColor: '#F0FDF4',
            border: '1px solid #BBF7D0',
            color: '#166534'
          }}
        >
          <div className="d-flex align-items-center gap-2.5">
            <span
              className="rounded-circle"
              style={{
                width: '10px',
                height: '10px',
                backgroundColor: '#16A34A',
                boxShadow: '0 0 0 3px rgba(22, 163, 74, 0.25)'
              }}
            />
            <div>
              <span className="fw-bold" style={{ fontSize: '14px' }}>
                Active Shift: You checked in today at {todayRecord.checkIn}
              </span>
              <span className="d-block text-success mt-0.5" style={{ fontSize: '12px' }}>
                Your working session is currently recorded and visible to Academy Admin. Don't forget to Check Out when leaving.
              </span>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            loading={attendanceActionLoading}
            onClick={() => handleTeacherAttendance('check-out')}
            style={{ fontSize: '12.5px', padding: '6px 14px' }}
          >
            Check Out Now
          </Button>
        </div>
      )}

      {/* 2. SUMMARY CARDS */}
      <div className="row g-3 align-items-stretch" style={{ margin: 0 }}>
        {summaryCards.map(({ title, value, icon: Icon, iconBg, iconColor }) => (
          <div key={title} className="col-12 col-sm-6 col-xl-3" style={{ minWidth: 0 }}>
            <div
              className="h-100 bg-white border"
              style={{
                borderRadius: '18px',
                borderColor: '#E6EAF0',
                boxShadow: '0 3px 10px rgba(15, 23, 42, 0.04)',
                padding: '18px 18px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                minHeight: '110px'
              }}
            >
              <div
                className="d-flex align-items-center justify-content-center rounded-circle"
                style={{
                  width: '42px',
                  height: '42px',
                  backgroundColor: iconBg,
                  color: iconColor,
                  flexShrink: 0
                }}
              >
                <Icon size={18} strokeWidth={2.2} />
              </div>

              <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.02em', color: '#5B6475', textTransform: 'none' }}>
                  {title}
                </div>
                <div style={{ fontSize: '32px', lineHeight: 1.1, fontWeight: 700, color: '#111827', marginTop: '6px' }}>
                  {value}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 3. MY ATTENDANCE SECTION (CURRENT WEEK ONLY) */}
      <section
        className="sa-card bg-white border rounded-4 p-3 p-md-4"
        aria-labelledby="teacher-attendance-heading"
      >
        <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 mb-3">
          <div>
            <div className="d-flex flex-wrap align-items-center gap-2">
              <h2 id="teacher-attendance-heading" className="brand-font fw-bold text-sa-charcoal m-0 fs-6">
                My Attendance
              </h2>
              <span
                className="badge border"
                style={{
                  backgroundColor: '#E8F3FF',
                  color: '#2563EB',
                  borderColor: '#BFDBFE',
                  fontWeight: 600,
                  fontSize: '12.5px',
                  padding: '4px 10px',
                  borderRadius: '6px'
                }}
              >
                Week: {currentWeek.label}
              </span>
            </div>
            <p className="text-sa-muted m-0 mt-1" style={{ fontSize: '13px' }}>
              Current week attendance records ({currentWeek.label})
            </p>
          </div>

          <div className="d-flex align-items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={Download}
              onClick={() => exportWeeklyAttendanceToExcel(currentWeek.label, currentWeekRecords, teacherDisplayName)}
              disabled={currentWeekRecords.length === 0}
              title="Export current week to Excel"
            >
              Export Excel
            </Button>
          </div>
        </div>

        <div className="table-responsive border rounded-3 overflow-hidden" style={{ borderColor: '#FEE2E2', borderRadius: '12px' }}>
          <table className="table align-middle mb-0" style={{ minWidth: '650px' }}>
            <thead style={{ backgroundColor: '#FFF5F5', borderBottom: '1.5px solid #FEE2E2' }}>
              <tr style={{ height: '42px' }}>
                <th scope="col" style={{ fontSize: '11.5px', fontWeight: 700, color: '#8B1216', textTransform: 'uppercase', letterSpacing: '0.04em', padding: '10px 14px' }}>Date</th>
                <th scope="col" style={{ fontSize: '11.5px', fontWeight: 700, color: '#8B1216', textTransform: 'uppercase', letterSpacing: '0.04em', padding: '10px 14px' }}>Day</th>
                <th scope="col" style={{ fontSize: '11.5px', fontWeight: 700, color: '#8B1216', textTransform: 'uppercase', letterSpacing: '0.04em', padding: '10px 14px' }}>Check In</th>
                <th scope="col" style={{ fontSize: '11.5px', fontWeight: 700, color: '#8B1216', textTransform: 'uppercase', letterSpacing: '0.04em', padding: '10px 14px' }}>Check Out</th>
                <th scope="col" style={{ fontSize: '11.5px', fontWeight: 700, color: '#8B1216', textTransform: 'uppercase', letterSpacing: '0.04em', padding: '10px 14px' }}>Hours</th>
                <th scope="col" style={{ fontSize: '11.5px', fontWeight: 700, color: '#8B1216', textTransform: 'uppercase', letterSpacing: '0.04em', padding: '10px 14px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {teacherRecordsLoading ? (
                <tr>
                  <td colSpan="6" className="text-center text-sa-muted py-4">
                    Loading attendance records…
                  </td>
                </tr>
              ) : currentWeekRecords.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center text-sa-muted py-4">
                    No attendance recorded for this week yet.
                  </td>
                </tr>
              ) : (
                currentWeekRecords.map(record => (
                  <tr key={record.id || `${record.date}_${record.checkIn}`}>
                    <td style={{ fontSize: '13px' }}>{formatDateDisplay(record.date)}</td>
                    <td style={{ fontSize: '13px', fontWeight: 500 }}>{getDayName(record)}</td>
                    <td style={{ fontSize: '13px' }}>{record.checkIn}</td>
                    <td style={{ fontSize: '13px' }}>
                      <div className="d-flex flex-column">
                        <span className={record.checkOut === 'In Progress' ? 'text-primary fw-semibold' : 'text-dark'}>
                          {record.checkOut}
                        </span>
                        {record.isAutoClosed && (
                          <span className="text-sa-muted" style={{ fontSize: '11px' }}>
                            Auto Closed
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ fontSize: '13px', fontWeight: 600 }}>
                      <div className="d-flex flex-column">
                        <span className="text-dark">{record.totalHours}</span>
                        {record.isAutoClosed && (
                          <span className="text-sa-muted fw-normal" style={{ fontSize: '11px' }}>
                            Lecture Hours
                          </span>
                        )}
                      </div>
                    </td>
                    <td>{renderStatusBadge(record)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. PAST RECORDS SECTION */}
      <section
        className="sa-card bg-white border rounded-4 p-3 p-md-4"
        aria-labelledby="past-attendance-heading"
      >
        <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 mb-3">
          <div>
            <h2 id="past-attendance-heading" className="brand-font fw-bold text-sa-charcoal m-0 fs-6">
              Past Records
            </h2>
            <p className="text-sa-muted m-0 mt-1" style={{ fontSize: '13px' }}>
              Attendance history and reports from previous completed weeks
            </p>
          </div>
        </div>

        {teacherRecordsLoading ? (
          <div className="text-center text-sa-muted py-4">Loading past records…</div>
        ) : pastWeeks.length === 0 ? (
          <div
            className="text-center text-sa-muted py-4 border rounded-3 bg-light"
            style={{ borderColor: '#E2E8F0', fontSize: '13.5px' }}
          >
            No past attendance records available.
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {pastWeeks.map((week) => {
              const isExpanded = expandedWeekKeys.includes(week.key);
              return (
                <div
                  key={week.key}
                  className="border rounded-3 p-3 bg-white"
                  style={{
                    borderColor: '#E6EAF0',
                    boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)'
                  }}
                >
                  <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-3">
                    <div className="d-flex align-items-center gap-3">
                      <div
                        className="d-flex align-items-center justify-content-center rounded-3 border"
                        style={{
                          width: '40px',
                          height: '40px',
                          backgroundColor: '#F8FAFC',
                          borderColor: '#E2E8F0',
                          color: '#475569',
                          flexShrink: 0
                        }}
                      >
                        <Calendar size={18} />
                      </div>
                      <div>
                        <div className="fw-bold text-sa-charcoal" style={{ fontSize: '14px' }}>
                          Week: {week.label}
                        </div>
                        <div className="text-sa-muted small">
                          {week.records.length} {week.records.length === 1 ? 'day recorded' : 'days recorded'}
                        </div>
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        icon={isExpanded ? ChevronUp : Eye}
                        onClick={() => toggleWeekExpansion(week.key)}
                        title={isExpanded ? 'Hide week details' : 'View week details'}
                      >
                        {isExpanded ? 'Hide' : 'View'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        icon={Download}
                        onClick={() => exportWeeklyAttendanceToExcel(week.label, week.records, teacherDisplayName)}
                        title={`Export ${week.label} to Excel`}
                      >
                        Export Excel
                      </Button>
                    </div>
                  </div>

                  {/* Expandable Table for this specific past week */}
                  {isExpanded && (
                    <div className="table-responsive mt-3 pt-3 border-top">
                      <table className="table align-middle mb-0">
                        <thead>
                          <tr className="table-light">
                            <th scope="col" style={{ fontSize: '12.5px', fontWeight: 600 }}>Date</th>
                            <th scope="col" style={{ fontSize: '12.5px', fontWeight: 600 }}>Day</th>
                            <th scope="col" style={{ fontSize: '12.5px', fontWeight: 600 }}>Check In</th>
                            <th scope="col" style={{ fontSize: '12.5px', fontWeight: 600 }}>Check Out</th>
                            <th scope="col" style={{ fontSize: '12.5px', fontWeight: 600 }}>Hours</th>
                            <th scope="col" style={{ fontSize: '12.5px', fontWeight: 600 }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {week.records.map((record) => (
                            <tr key={record.id || `${record.date}_${record.checkIn}`}>
                              <td style={{ fontSize: '13px' }}>{formatDateDisplay(record.date)}</td>
                              <td style={{ fontSize: '13px', fontWeight: 500 }}>{getDayName(record)}</td>
                              <td style={{ fontSize: '13px' }}>{record.checkIn}</td>
                              <td style={{ fontSize: '13px' }}>
                                <div className="d-flex flex-column">
                                  <span className={record.checkOut === 'In Progress' ? 'text-primary fw-semibold' : 'text-dark'}>
                                    {record.checkOut}
                                  </span>
                                  {record.isAutoClosed && (
                                    <span className="text-sa-muted" style={{ fontSize: '11px' }}>
                                      Auto Closed
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td style={{ fontSize: '13px', fontWeight: 600 }}>
                                <div className="d-flex flex-column">
                                  <span className="text-dark">{record.totalHours}</span>
                                  {record.isAutoClosed && (
                                    <span className="text-sa-muted fw-normal" style={{ fontSize: '11px' }}>
                                      Lecture Hours
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td>{renderStatusBadge(record)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

