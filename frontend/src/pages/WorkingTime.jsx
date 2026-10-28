import React, { useState, useEffect } from 'react';
import { useParams, useOutletContext, useNavigate } from 'react-router-dom';
import WorkingTimeSummary from '../components/working-time/WorkingTimeSummary';
import WorkingTimeProgress from '../components/working-time/WorkingTimeProgress';
import WorkingTimeTable from '../components/working-time/WorkingTimeTable';
import attendanceService from '../services/attendanceService';
import salaryService from '../services/salaryService';
import teacherService from '../services/teacherService';
import useAuth from '../hooks/useAuth';
import { ArrowLeft, Building2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { getUserBranch } from '../utils/branchUtils';

export default function WorkingTime() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const context = useOutletContext();
  const globalDateFilter = context?.globalDateFilter;
  const [records, setRecords] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teacherDetails, setTeacherDetails] = useState(null);

  const [targetTeacherId, setTargetTeacherId] = useState(id || (user?.role?.includes('teacher') ? user?.id : null));

  useEffect(() => {
    const resolveTarget = async () => {
      if (id) {
        setTargetTeacherId(id);
      } else if (user?.id && (user?.role?.toLowerCase().includes('teacher'))) {
        setTargetTeacherId(user.id);
      } else {
        try {
          const allT = await teacherService.getAll();
          if (allT && allT.length > 0) {
            setTargetTeacherId(allT[0].id);
          }
        } catch (_) {}
      }
    };
    resolveTarget();
  }, [id, user]);

  useEffect(() => {
    if (!targetTeacherId) return;
    const fetchData = async () => {
      try {
        const [attData, salData, teacherData] = await Promise.all([
          attendanceService.getWorkingTime(targetTeacherId).catch(() => []),
          salaryService.getMySalaries().catch(() => []),
          teacherService.getById(targetTeacherId).catch(() => null)
        ]);
        setRecords(attData || []);
        setSalaries(salData || []);
        if (teacherData) {
          setTeacherDetails(teacherData);
        }
      } catch (err) {
        console.error('Error fetching working time data:', err);
        toast.error('Failed to load working time records');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [targetTeacherId]);

  const totalRequired = 160;
  let totalWorkedMinutes = 0;
  let presentDays = 0;
  let absentDays = 0;
  let lateDays = 0;

  const getWorkedMinutes = (totalHours) => {
    if (!totalHours || totalHours === '--') return 0;
    const match = totalHours.match(/(\d+)\s*h(?:\s*(\d+)\s*m)?/i);
    return match ? Number(match[1]) * 60 + Number(match[2] || 0) : 0;
  };

  const currentDate = new Date();
  const currentDateString = currentDate.toISOString().slice(0, 10);
  const currentMonthRecords = records.filter(record => {
    if (!record.date) return false;
    const recordDate = new Date(`${record.date}T00:00:00`);
    return recordDate.getMonth() === currentDate.getMonth() &&
      recordDate.getFullYear() === currentDate.getFullYear();
  });

  const currentWeekStart = new Date(currentDate);
  currentWeekStart.setHours(0, 0, 0, 0);
  currentWeekStart.setDate(currentWeekStart.getDate() - ((currentWeekStart.getDay() + 6) % 7));

  const sumWorkedMinutes = (rows) => rows.reduce((total, record) => total + getWorkedMinutes(record.totalHours), 0);
  const formatHours = (minutes) => `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`;
  
  const todayWorked = sumWorkedMinutes(records.filter(record => record.date === currentDateString));
  const weekWorked = sumWorkedMinutes(records.filter(record => {
    if (!record.date) return false;
    const recordDate = new Date(`${record.date}T00:00:00`);
    return recordDate >= currentWeekStart && recordDate <= currentDate;
  }));
  const monthWorked = sumWorkedMinutes(currentMonthRecords.length > 0 ? currentMonthRecords : records);
  const monthPercentage = Math.min(Math.round((monthWorked / (totalRequired * 60)) * 100), 100);

  const filteredRecords = records.filter(r => {
    if (!globalDateFilter) return true;
    if (globalDateFilter === 'month') {
      const recordDate = new Date(r.date);
      return recordDate.getMonth() === currentDate.getMonth() && recordDate.getFullYear() === currentDate.getFullYear();
    }
    return r.date === globalDateFilter;
  });

  filteredRecords.forEach(r => {
    if (r.status === 'Present' || r.status === 'Working') presentDays++;
    else if (r.status === 'Absent') absentDays++;
    else if (r.status === 'Late') lateDays++;
    totalWorkedMinutes += getWorkedMinutes(r.totalHours);
  });

  const workingTimeSummary = {
    totalWorkedHours: formatHours(totalWorkedMinutes),
    totalRequiredHours: `${totalRequired}h`,
    averageDailyHours: presentDays > 0 ? `${(totalWorkedMinutes / 60 / presentDays).toFixed(1)}h` : '0h',
    presentDays,
    absentDays,
    lateDays,
    todayHours: formatHours(todayWorked),
    thisWeek: formatHours(weekWorked),
    thisMonth: formatHours(monthWorked),
    percentage: monthPercentage,
    monthlyTarget: `${totalRequired}h`,
    completedHours: Math.floor(monthWorked / 60),
    targetHours: totalRequired,
    remainingHours: Math.max(totalRequired - Math.floor(monthWorked / 60), 0),
    monthLabel: currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  };

  return (
    <div className="d-flex flex-column w-100" style={{ gap: '22px' }}>
      {/* 1. Page Header with Back button */}
      <div className="pt-1 d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div className="d-flex align-items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (user?.role === 'admin' || user?.role === 'super-admin' || user?.role === 'super_admin') {
                navigate('/admin/teachers/attendance');
              } else {
                navigate('/teacher/dashboard');
              }
            }}
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
            aria-label="Back"
            title="Back"
          >
            <ArrowLeft size={18} />
          </button>

          <div>
            <h1 className="fw-bold brand-font text-sa-charcoal m-0" style={{ fontSize: '22px', lineHeight: 1.25 }}>
              {teacherDetails ? `${teacherDetails.name}'s Working Time` : 'Working Time'}
            </h1>
            <p className="text-sa-muted m-0 mt-1" style={{ fontSize: '13px' }}>
              {teacherDetails
                ? `Faculty ID: ${teacherDetails.employee_id} • Subject: ${teacherDetails.subject} • Daily punch & attendance records`
                : 'Track your daily working hours, attendance and punch records'}
            </p>
          </div>
        </div>

        <span
          className="badge rounded-pill d-inline-flex align-items-center gap-1.5 px-3 py-1.5"
          style={{
            backgroundColor: '#FDF0F0',
            color: '#8B1216',
            border: '1px solid #F5C2C4',
            fontSize: '0.82rem',
            fontWeight: '600'
          }}
        >
          <Building2 size={14} />
          <span>{teacherDetails?.branch || getUserBranch(user)} Campus</span>
        </span>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <WorkingTimeSummary summary={workingTimeSummary} />

      {/* 3. Monthly Working Hours Progress Bar */}
      <WorkingTimeProgress summary={workingTimeSummary} />

      {/* 4. Daily Working Time Log Table */}
      <WorkingTimeTable records={filteredRecords} loading={loading} />
    </div>
  );
}
