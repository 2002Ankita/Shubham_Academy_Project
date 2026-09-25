import React from 'react';
import WorkingTimeSummary from '../components/working-time/WorkingTimeSummary';
import WorkingTimeProgress from '../components/working-time/WorkingTimeProgress';
import WorkingTimeTable from '../components/working-time/WorkingTimeTable';
import { workingTimeSummary, dailyWorkingRecords } from '../data/workingTimeData';

export default function WorkingTime() {
  return (
    <div className="d-flex flex-column w-100" style={{ gap: '22px' }}>
      {/* 1. Page Header */}
      <div className="pt-1">
        <h1 className="fw-bold brand-font text-sa-charcoal m-0" style={{ fontSize: '22px', lineHeight: 1.25 }}>
          Working Time
        </h1>
        <p className="text-sa-muted m-0 mt-1" style={{ fontSize: '13.5px' }}>
          Track your daily working hours, attendance and punch records
        </p>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <WorkingTimeSummary summary={workingTimeSummary} />

      {/* 3. Monthly Working Hours Progress Bar */}
      <WorkingTimeProgress summary={workingTimeSummary} />

      {/* 4. Daily Working Time Log Table */}
      <WorkingTimeTable records={dailyWorkingRecords} />
    </div>
  );
}
