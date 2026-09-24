import React, { useState, useEffect } from 'react';
import Table from '../../components/common/Table';
import attendanceService from '../../services/attendanceService';
import { CalendarCheck, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function StudentAttendance() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const data = await attendanceService.getLogs();
        setLogs(data);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="d-flex flex-column gap-4">
      <div>
        <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
          My RFID Attendance Records
        </h3>
        <span className="small text-sa-muted">
          Automated gate card readings and daily attendance verification
        </span>
      </div>

      <div className="row g-3">
        <div className="col-12 col-md-4">
          <div className="sa-card p-4">
            <span className="small text-sa-muted fw-semibold">TERM ATTENDANCE</span>
            <h2 className="brand-font fw-extrabold text-success m-0 fs-3">94.2%</h2>
            <span className="small text-sa-muted">Requirement: Minimum 75%</span>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="sa-card p-4">
            <span className="small text-sa-muted fw-semibold">ASSIGNED RFID SMART CARD</span>
            <h2 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">RFID-984210</h2>
            <span className="small text-success d-flex align-items-center gap-1 mt-1">
              <CheckCircle2 size={14} /> Active & Linked
            </span>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="sa-card p-4">
            <span className="small text-sa-muted fw-semibold">PARENT SMS ALERT STATUS</span>
            <h2 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">+91 98231 45671</h2>
            <span className="small text-sa-muted">Real-time gate tap notifications enabled</span>
          </div>
        </div>
      </div>

      <div className="sa-card p-4">
        <h5 className="brand-font fw-bold text-sa-charcoal mb-3 fs-6">
          Recent Gate Entry Taps
        </h5>

        <Table
          columns={[
            { key: 'date', title: 'Date', render: (val) => <span className="fw-bold">{val}</span> },
            { key: 'time', title: 'Tap In Time', render: (val) => <span className="fw-semibold text-sa-primary">{val}</span> },
            { key: 'gate', title: 'Gate Terminal' },
            { key: 'mode', title: 'Verification Mode' },
            {
              key: 'status',
              title: 'Status',
              render: (val) => <span className="badge-present">{val}</span>
            },
            { key: 'smsAlert', title: 'Parent SMS Verification' }
          ]}
          data={logs}
          loading={loading}
        />
      </div>
    </div>
  );
}
