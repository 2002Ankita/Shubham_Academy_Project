import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Users, CheckCircle2, XCircle, Clock3, ArrowLeft } from 'lucide-react';
import { attendanceService } from '../../services/attendanceService';
import useAuth from '../../hooks/useAuth';
import Button from '../../components/common/Button';

export default function TeacherAttendance() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [teacherRecords, setTeacherRecords] = useState([]);
  const [teacherRecordsLoading, setTeacherRecordsLoading] = useState(true);
  const [attendanceActionLoading, setAttendanceActionLoading] = useState(false);

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

  const today = new Date().toISOString().slice(0, 10);
  const todayRecord = teacherRecords.find(record => record.date === today);
  const hasCheckedIn = Boolean(todayRecord && todayRecord.checkIn !== '--');
  const hasCheckedOut = Boolean(todayRecord && todayRecord.checkOut !== '--');
  const recentTeacherRecords = [...teacherRecords]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7);

  const handleTeacherAttendance = async (action) => {
    if (!user?.id) {
      toast.error('Unable to identify your teacher account');
      return;
    }
    setAttendanceActionLoading(true);
    try {
      if (action === 'check-in') {
        await attendanceService.checkIn(user.id);
        toast.success('Successfully checked in!');
      } else {
        await attendanceService.checkOut(user.id);
        toast.success('Successfully checked out!');
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
        <div className="d-flex align-items-center flex-wrap" style={{ gap: '12px' }}>
          <Button
            type="button"
            variant="primary"
            icon={Clock3}
            loading={attendanceActionLoading}
            disabled={attendanceActionLoading || hasCheckedIn || !user?.id}
            onClick={() => handleTeacherAttendance('check-in')}
          >
            {hasCheckedIn ? `Checked in ${todayRecord.checkIn}` : 'Check In'}
          </Button>
          <Button
            type="button"
            variant="outline"
            loading={attendanceActionLoading}
            disabled={attendanceActionLoading || !hasCheckedIn || hasCheckedOut}
            onClick={() => handleTeacherAttendance('check-out')}
          >
            {hasCheckedOut ? `Checked out ${todayRecord.checkOut}` : 'Check Out'}
          </Button>
        </div>
      </div>

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

      {/* 3. MY ATTENDANCE SECTION */}
      <section
        className="sa-card bg-white border rounded-4 p-3 p-md-4"
        aria-labelledby="teacher-attendance-heading"
      >
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-3">
          <div>
            <h2 id="teacher-attendance-heading" className="brand-font fw-bold text-sa-charcoal m-0 fs-6">
              My Attendance
            </h2>
            <p className="text-sa-muted m-0 mt-1" style={{ fontSize: '13px' }}>
              Record and review your daily check-in and check-out
            </p>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Check In</th>
                <th scope="col">Check Out</th>
                <th scope="col">Hours</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {teacherRecordsLoading ? (
                <tr><td colSpan="5" className="text-center text-sa-muted py-4">Loading attendance records…</td></tr>
              ) : recentTeacherRecords.length === 0 ? (
                <tr><td colSpan="5" className="text-center text-sa-muted py-4">No attendance records yet.</td></tr>
              ) : recentTeacherRecords.map(record => (
                <tr key={record.id}>
                  <td>{record.date}</td>
                  <td>{record.checkIn}</td>
                  <td>{record.checkOut}</td>
                  <td>{record.totalHours}</td>
                  <td><span className="badge bg-light text-sa-charcoal border">{record.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
