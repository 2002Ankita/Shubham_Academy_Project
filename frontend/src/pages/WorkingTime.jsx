import React, { useState, useEffect } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import WorkingTimeSummary from '../components/working-time/WorkingTimeSummary';
import WorkingTimeProgress from '../components/working-time/WorkingTimeProgress';
import WorkingTimeTable from '../components/working-time/WorkingTimeTable';
import attendanceService from '../services/attendanceService';
import useAuth from '../hooks/useAuth';
import { toast } from 'react-toastify';

export default function WorkingTime() {
  const { user } = useAuth();
  const { id } = useParams();
  const context = useOutletContext();
  const globalDateFilter = context?.globalDateFilter;
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const targetTeacherId = id || user?.id || 'TCH-001';
  const isAdminView = !!id;

  const fetchRecords = async () => {
    try {
      const data = await attendanceService.getWorkingTime(targetTeacherId);
      setRecords(data);
    } catch (err) {
      toast.error('Failed to load working time records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const totalRequired = 160;
  let totalWorkedMinutes = 0;
  let presentDays = 0;
  let absentDays = 0;
  let lateDays = 0;

  const getWorkedMinutes = (totalHours) => {
    const match = totalHours?.match(/(\d+)h(?:\s*(\d+)m)?/);
    return match ? Number(match[1]) * 60 + Number(match[2] || 0) : 0;
  };

  const currentDate = new Date();
  const currentDateString = currentDate.toISOString().slice(0, 10);
  const currentMonthRecords = records.filter(record => {
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
    const recordDate = new Date(`${record.date}T00:00:00`);
    return recordDate >= currentWeekStart && recordDate <= currentDate;
  }));
  const monthWorked = sumWorkedMinutes(currentMonthRecords);
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
      {/* 1. Page Header */}
      <div className="pt-1 d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div>
          <h1 className="fw-bold brand-font text-sa-charcoal m-0" style={{ fontSize: '22px', lineHeight: 1.25 }}>
            Working Time
          </h1>
          <p className="text-sa-muted m-0 mt-1" style={{ fontSize: '13.5px' }}>
            Track your daily working hours, attendance and punch records
          </p>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <WorkingTimeSummary summary={workingTimeSummary} />

      {/* 3. Monthly Working Hours Progress Bar */}
      <WorkingTimeProgress summary={workingTimeSummary} />

      {!isAdminView && (
        <div className="alert alert-light border mb-0" role="status">
          Your daily check-in and check-out records are available on the Attendance page.
        </div>
      )}
      {isAdminView && <WorkingTimeTable records={filteredRecords} loading={loading} />}
    </div>
  );
}
