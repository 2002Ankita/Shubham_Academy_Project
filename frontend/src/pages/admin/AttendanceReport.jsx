import React, { useState, useEffect } from 'react';
import AttendanceChart from '../../components/dashboard/AttendanceChart';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import { Download, Calendar, Filter } from 'lucide-react';
import attendanceService from '../../services/attendanceService';
import reportService from '../../services/reportService';
import { toast } from 'react-toastify';

export default function AttendanceReport() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    const load = async () => {
      const data = await attendanceService.getReportSummary();
      setSummary(data);
    };
    load();
  }, []);

  const classData = [
    { standard: '12th Science - Alpha', total: 60, present: 57, absent: 3, percent: 95.0 },
    { standard: '12th Science - Beta', total: 60, present: 55, absent: 5, percent: 91.6 },
    { standard: '11th Science - Alpha', total: 65, present: 61, absent: 4, percent: 93.8 },
    { standard: '11th Science - Beta', total: 65, present: 58, absent: 7, percent: 89.2 },
    { standard: '12th Commerce', total: 55, present: 48, absent: 7, percent: 87.2 },
    { standard: '10th Foundation', total: 50, present: 48, absent: 2, percent: 96.0 },
  ];

  const handleExport = () => {
    reportService.downloadReport('ATTENDANCE_SUMMARY_SEPT_2026');
    toast.success('Attendance report exported successfully!');
  };

  return (
    <div className="d-flex flex-column gap-4">
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
        <div>
          <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
            Attendance Analytics & Reports
          </h3>
          <span className="small text-sa-muted">
            Batch-wise attendance distribution, defaulters, and monthly trends
          </span>
        </div>

        <Button variant="outline" icon={Download} onClick={handleExport}>
          Export Monthly Attendance (.PDF)
        </Button>
      </div>

      <div className="row g-3">
        <div className="col-12 col-lg-8">
          <AttendanceChart data={summary?.weeklyData} title="Aggregated Weekly Attendance" />
        </div>
        <div className="col-12 col-lg-4">
          <div className="sa-card p-4 h-100 d-flex flex-column justify-content-between">
            <h6 className="brand-font fw-bold text-sa-charcoal mb-3 fs-6">Campus Daily Benchmark</h6>
            <div className="d-flex flex-column gap-3">
              <div>
                <span className="small text-sa-muted d-block">Present Count Today</span>
                <h2 className="brand-font fw-extrabold text-success m-0">{summary?.presentToday || 442}</h2>
              </div>
              <div>
                <span className="small text-sa-muted d-block">Absence Count Today</span>
                <h2 className="brand-font fw-extrabold text-danger m-0">{summary?.absentToday || 38}</h2>
              </div>
              <div>
                <span className="small text-sa-muted d-block">Campus Attendance Average</span>
                <h2 className="brand-font fw-extrabold text-sa-primary m-0">{summary?.averagePercent || 92.08}%</h2>
              </div>
            </div>
            <div className="p-3 bg-light rounded-3 small text-muted mt-3">
              SMS gateway sent 38 absence notices to parents at 09:00 AM automatically.
            </div>
          </div>
        </div>
      </div>

      <div className="sa-card p-4">
        <h5 className="brand-font fw-bold text-sa-charcoal mb-3 fs-6">
          Batch-Wise Attendance Performance
        </h5>
        <Table
          columns={[
            { key: 'standard', title: 'Batch / Section', render: (val) => <span className="fw-bold">{val}</span> },
            { key: 'total', title: 'Enrolled Students' },
            { key: 'present', title: 'Present Today', render: (val) => <span className="text-success fw-semibold">{val}</span> },
            { key: 'absent', title: 'Absent Today', render: (val) => <span className="text-danger fw-semibold">{val}</span> },
            {
              key: 'percent',
              title: 'Rate',
              render: (val) => (
                <span className={`fw-bold ${val >= 90 ? 'text-success' : 'text-warning'}`}>
                  {val}%
                </span>
              )
            }
          ]}
          data={classData}
        />
      </div>
    </div>
  );
}
