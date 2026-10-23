import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AttendanceForm from '../../components/forms/AttendanceForm';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import attendanceService from '../../services/attendanceService';
import TeacherAttendanceTracker from './TeacherAttendanceTracker';
import LectureAttendanceManager from './LectureAttendanceManager';
import { ScanLine, Send, CheckCircle2, UserCheck, ShieldCheck, FileSpreadsheet } from 'lucide-react';
import { toast } from 'react-toastify';

export default function RFIDAttendance() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'lecture'; // Default to lecture attendance & Excel import

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
    if (activeTab === 'students') {
      fetchLogs();
    }
  }, [activeTab]);

  const handleScanRfid = async (rfidCard, gate) => {
    const res = await attendanceService.scanRfid(rfidCard, gate);
    toast.success(res.message);
    fetchLogs();
    return res;
  };

  const handleTabChange = (tab) => {
    setSearchParams({ tab });
  };

  return (
    <div className="d-flex flex-column gap-3 w-100">
      {/* Top Tab Navigator for Academy Admin */}
      <div
        className="d-flex flex-wrap align-items-center gap-2 p-1.5 bg-white border rounded-4 shadow-2xs"
        style={{ width: 'fit-content' }}
      >
        <button
          type="button"
          onClick={() => handleTabChange('lecture')}
          className={`btn btn-sm d-inline-flex align-items-center gap-2 px-3 py-2 fw-semibold rounded-3 transition-all ${
            activeTab === 'lecture'
              ? 'btn-dark text-white shadow-sm'
              : 'btn-light text-sa-charcoal bg-transparent border-0'
          }`}
          style={{ fontSize: '13px' }}
        >
          <FileSpreadsheet size={16} />
          <span>Lecture Attendance & Excel Import</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('teachers')}
          className={`btn btn-sm d-inline-flex align-items-center gap-2 px-3 py-2 fw-semibold rounded-3 transition-all ${
            activeTab === 'teachers'
              ? 'btn-dark text-white shadow-sm'
              : 'btn-light text-sa-charcoal bg-transparent border-0'
          }`}
          style={{ fontSize: '13px' }}
        >
          <UserCheck size={16} />
          <span>Teacher Check-In & Tracking</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('students')}
          className={`btn btn-sm d-inline-flex align-items-center gap-2 px-3 py-2 fw-semibold rounded-3 transition-all ${
            activeTab === 'students'
              ? 'btn-dark text-white shadow-sm'
              : 'btn-light text-sa-charcoal bg-transparent border-0'
          }`}
          style={{ fontSize: '13px' }}
        >
          <ScanLine size={16} />
          <span>Student Gate Attendance</span>
        </button>
      </div>

      {/* Tab 1: Lecture Attendance & Excel Import */}
      {activeTab === 'lecture' && <LectureAttendanceManager />}

      {/* Tab 2: Teacher Check-In & Check-Out Tracking */}
      {activeTab === 'teachers' && <TeacherAttendanceTracker />}

      {/* Tab 3: Student Gate Attendance */}
      {activeTab === 'students' && (

        <div className="d-flex flex-column gap-4">
          <div>
            <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
              Student Gate Attendance Management
            </h3>
            <span className="small text-sa-muted">
              Automated card reader monitoring, gate telemetry & parent SMS gateway
            </span>
          </div>

          {/* Interactive Attendance Terminal Widget */}
          <AttendanceForm onScanRfid={handleScanRfid} />

          {/* Gate Scans Ledger */}
          <div className="sa-card p-4">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h5 className="brand-font fw-bold text-sa-charcoal m-0 fs-6">
                Today's Gate Access Records
              </h5>
              <span className="badge bg-success small">Terminal Online</span>
            </div>

            <Table
              columns={[
                { key: 'time', title: 'Tap Time', render: (val) => <span className="fw-bold">{val}</span> },
                { key: 'studentName', title: 'Student Name' },
                { key: 'rollNumber', title: 'Roll Number' },
                { key: 'rfidCard', title: 'Card UID', render: (val) => <span className="badge bg-light text-dark border">{val}</span> },
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
      )}
    </div>
  );
}
