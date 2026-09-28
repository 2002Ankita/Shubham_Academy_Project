import React, { useState, useEffect } from 'react';
import WorkingTimeSummary from '../components/working-time/WorkingTimeSummary';
import WorkingTimeProgress from '../components/working-time/WorkingTimeProgress';
import WorkingTimeTable from '../components/working-time/WorkingTimeTable';
import { workingTimeSummary } from '../data/workingTimeData';
import attendanceService from '../services/attendanceService';
import useAuth from '../hooks/useAuth';
import { toast } from 'react-toastify';
import Button from '../components/common/Button';

export default function WorkingTime() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = async () => {
    try {
      // For testing we will hardcode a teacher ID if user id is missing
      const data = await attendanceService.getWorkingTime(user?.id || 'TCH-001');
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

  const handleCheckIn = async () => {
    try {
      await attendanceService.checkIn(user?.id || 'TCH-001');
      toast.success('Successfully checked in!');
      fetchRecords();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to check in');
    }
  };

  const handleCheckOut = async () => {
    try {
      await attendanceService.checkOut(user?.id || 'TCH-001');
      toast.success('Successfully checked out!');
      fetchRecords();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to check out');
    }
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
        <div className="d-flex gap-2">
          <Button variant="primary" onClick={handleCheckIn}>Check In</Button>
          <Button variant="outline" onClick={handleCheckOut}>Check Out</Button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <WorkingTimeSummary summary={workingTimeSummary} />

      {/* 3. Monthly Working Hours Progress Bar */}
      <WorkingTimeProgress summary={workingTimeSummary} />

      {/* 4. Daily Working Time Log Table */}
      <WorkingTimeTable records={records} loading={loading} />
    </div>
  );
}
