import React, { useState, useEffect } from 'react';
import AttendanceForm from '../../components/forms/AttendanceForm';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import attendanceService from '../../services/attendanceService';
import { ScanLine, Send, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-toastify';

export default function RFIDAttendance() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await attendanceService.getLogs();
      setLogs(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleScanRfid = async (rfidCard, gate) => {
    const res = await attendanceService.scanRfid(rfidCard, gate);
    toast.success(res.message);
    fetchLogs();
    return res;
  };

  return (
    <div className="d-flex flex-column gap-4">
      <div>
        <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
          RFID Gate Attendance Management
        </h3>
        <span className="small text-sa-muted">
          Automated smart card reader monitoring, gate telemetry & parent SMS gateway
        </span>
      </div>

      {/* Interactive RFID Terminal Widget */}
      <AttendanceForm onScanRfid={handleScanRfid} />

      {/* Gate Scans Ledger */}
      <div className="sa-card p-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h5 className="brand-font fw-bold text-sa-charcoal m-0 fs-6">
            Today's Gate Access Records
          </h5>
          <span className="badge bg-success small">RFID Broker Online</span>
        </div>

        <Table
          columns={[
            { key: 'time', title: 'Tap Time', render: (val) => <span className="fw-bold">{val}</span> },
            { key: 'studentName', title: 'Student Name' },
            { key: 'rollNumber', title: 'Roll Number' },
            { key: 'rfidCard', title: 'Badge Card UID', render: (val) => <span className="badge bg-light text-dark border">{val}</span> },
            { key: 'gate', title: 'Gate Terminal' },
            {
              key: 'status',
              title: 'Status',
              render: (val) => <span className={val === 'Present' ? 'badge-present' : 'badge-absent'}>{val}</span>
            },
            {
              key: 'smsAlert',
              title: 'Parent SMS Dispatch',
              render: (val) => (
                <span className="small text-muted d-flex align-items-center gap-1">
                  <Send size={13} className="text-success" />
                  {val}
                </span>
              )
            }
          ]}
          data={logs}
          loading={loading}
        />
      </div>
    </div>
  );
}
