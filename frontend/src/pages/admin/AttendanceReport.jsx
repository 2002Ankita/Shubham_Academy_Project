import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import BackButton from '../../components/common/BackButton';
import attendanceService from '../../services/attendanceService';
import studentService from '../../services/studentService';
import notificationService from '../../services/notificationService';
import {
  Download,
  Calendar,
  Filter,
  Printer,
  FileSpreadsheet,
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  User,
  Search,
  RefreshCw,
  Upload
} from 'lucide-react';
import { toast } from 'react-toastify';
import BranchBatchSelector from '../../components/common/BranchBatchSelector';
import {
  BRANCH_TARABAI,
  BRANCH_MANGALWAR,
  ACADEMIC_BATCHES,
  formatStudentBatchDisplay
} from '../../config/branchBatchConfig';
import { useAuth } from '../../hooks/useAuth';
import { getUserBranch } from '../../utils/branchUtils';

export default function AttendanceReport() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuperAdmin = (user?.role || '').toLowerCase().replace('-', '_').includes('super_admin') || (user?.role || '').toLowerCase().includes('super');
  const activeBranch = getUserBranch(user);
  const isMP = Boolean(activeBranch && activeBranch.toLowerCase().includes('mangal'));
  const defaultBranch = isMP ? BRANCH_MANGALWAR : (activeBranch || BRANCH_TARABAI);

  // Active Report View: 'batch', 'date', 'student'
  const [activeTab, setActiveTab] = useState('batch');

  // Standardized Filter States
  const [reportBranch, setReportBranch] = useState(defaultBranch);
  const [reportSession, setReportSession] = useState('');
  const [reportAcademicBatch, setReportAcademicBatch] = useState(ACADEMIC_BATCHES[0]);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentSearch, setStudentSearch] = useState('');

  // Data States
  const [loading, setLoading] = useState(true);
  const [batchData, setBatchData] = useState(null);
  const [dateData, setDateData] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [allStudents, setAllStudents] = useState([]);

  const reportBatchLabel = formatStudentBatchDisplay({
    branch: reportBranch,
    session: reportSession,
    academicBatch: reportAcademicBatch
  });

  // Load students for autocomplete
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const list = await studentService.getAll();
        setAllStudents(list || []);
        if (list && list.length > 0 && !selectedStudentId) {
          setSelectedStudentId(list[0].student_id || list[0].id);
        }
      } catch (err) {
        console.warn('Student list fetch error:', err);
      }
    };
    fetchStudents();
  }, []);

  // Fetch report based on active tab
  const fetchReport = async () => {
    setLoading(true);
    try {
      if (activeTab === 'batch') {
        const res = await attendanceService.getBatchReport({
          branch: reportBranch,
          session: reportSession,
          academicBatch: reportAcademicBatch
        });
        setBatchData(res);
      } else if (activeTab === 'date') {
        const res = await attendanceService.getDateReport({
          date: selectedDate,
          branch: reportBranch,
          session: reportSession,
          academicBatch: reportAcademicBatch
        });
        setDateData(res);
      } else if (activeTab === 'student') {
        const targetId = selectedStudentId || (allStudents[0] ? allStudents[0].student_id || allStudents[0].id : 'SA-1001');
        const res = await attendanceService.getStudentReport(targetId);
        setStudentData(res);
      }
    } catch (err) {
      console.warn('Report fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeTab, reportBranch, reportSession, reportAcademicBatch, selectedDate, selectedStudentId]);

  // Export to Excel client-side using XLSX
  const handleExportExcel = () => {
    try {
      let exportRows = [];
      let filename = 'Attendance_Report.xlsx';

      if (activeTab === 'batch') {
        filename = `Batch_Attendance_${reportBatchLabel.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
        exportRows = (batchData?.students || []).map(s => ({
          'Roll Number': s.roll_number,
          'Student Name': s.student_name,
          'Batch': s.batch,
          'Parent Mobile': s.parent_mobile,
          'Lecture 1 (Morning) Present': s.lecture_1_present,
          'Lecture 1 Total': s.lecture_1_total,
          'Lecture 2 (Afternoon) Present': s.lecture_2_present,
          'Lecture 2 Total': s.lecture_2_total,
          'Total Lectures': s.total_lectures,
          'Total Attended': s.total_present,
          'Total Absent': s.total_absent,
          'Attendance Rate': `${s.attendance_rate}%`,
          'Status': s.status
        }));
      } else if (activeTab === 'date') {
        filename = `Date_Attendance_${selectedDate}_${reportBatchLabel.replace(/\s+/g, '_')}.xlsx`;
        exportRows = (dateData?.records || []).map(r => ({
          'Roll Number': r.roll_number,
          'Student Name': r.student_name,
          'Batch': r.batch,
          'Parent Mobile': r.parent_mobile,
          'Lecture 1 Status': r.lecture_1?.status || 'Not Marked',
          'Lecture 1 Subject': r.lecture_1?.subject || '--',
          'Lecture 1 Time': r.lecture_1?.time || '--',
          'Lec 1 Parent Alert': r.lecture_1?.notification_sent ? 'SMS & WhatsApp Delivered' : 'None',
          'Lecture 2 Status': r.lecture_2?.status || 'Not Marked',
          'Lecture 2 Subject': r.lecture_2?.subject || '--',
          'Lecture 2 Time': r.lecture_2?.time || '--',
          'Lec 2 Parent Alert': r.lecture_2?.notification_sent ? 'SMS & WhatsApp Delivered' : 'None'
        }));
      } else {
        const st = studentData?.student || {};
        filename = `Student_Attendance_${st.roll_number || 'Record'}.xlsx`;
        exportRows = (studentData?.history || []).map(h => ({
          'Date': h.date,
          'Lecture Slot': h.lecture_slot,
          'Subject': h.subject,
          'Batch': h.batch,
          'Status': h.status,
          'Check-In Time': h.check_in_time,
          'Parent Alerts Dispatched': h.notification_sent ? 'SMS & WhatsApp Sent' : 'No',
          'Source': h.source,
          'Remarks': h.remarks
        }));
      }

      if (exportRows.length === 0) {
        toast.warning('No data available to export');
        return;
      }

      const ws = XLSX.utils.json_to_sheet(exportRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Attendance Report');
      XLSX.writeFile(wb, filename);
      toast.success('Attendance report exported to Excel successfully!');
    } catch (err) {
      console.error('Export Excel error:', err);
      toast.error('Failed to export Excel report');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Filter students for student picker dropdown
  const filteredStudents = allStudents.filter(s => {
    const q = studentSearch.toLowerCase();
    const name = (s.full_name || s.name || '').toLowerCase();
    const roll = (s.student_id || s.roll_number || '').toLowerCase();
    return name.includes(q) || roll.includes(q);
  });

  return (
    <div className="d-flex flex-column gap-4 w-100">
      {/* Top Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 bg-white p-3.5 rounded-4 border shadow-2xs">
        <div>
          <BackButton to="/admin/dashboard" label="Back to Dashboard" />
          <div className="d-flex align-items-center gap-2 mt-1">
            <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
              Attendance Analytics & Reports
            </h3>
            <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
              Official Academic Ledger
            </span>
          </div>
          <span className="small text-sa-muted">
            View and download batch-wise, date-wise, and student-wise reports with 2-lectures/day tracking.
          </span>
        </div>

        <div className="d-flex flex-wrap align-items-center gap-2">
          <Button variant="outline" icon={Printer} onClick={handlePrint}>
            Print / PDF
          </Button>

          <Button variant="primary" icon={Download} onClick={handleExportExcel}>
            Download Excel (.xlsx)
          </Button>

          <Button
            variant="outline"
            icon={Upload}
            onClick={() => navigate('/admin/attendance?tab=lecture')}
          >
            Upload Attendance
          </Button>
        </div>
      </div>

      {/* Report Mode Tabs */}
      <div className="d-flex align-items-center gap-2 p-1.5 bg-white border rounded-4 shadow-2xs" style={{ width: 'fit-content' }}>
        <button
          type="button"
          onClick={() => setActiveTab('batch')}
          className={`btn btn-sm d-inline-flex align-items-center gap-2 px-3.5 py-2 fw-semibold rounded-3 transition-all ${
            activeTab === 'batch'
              ? 'btn-dark text-white shadow-sm'
              : 'btn-light text-sa-charcoal bg-transparent border-0'
          }`}
          style={{ fontSize: '13px' }}
        >
          <Users size={16} />
          <span>Batch-Wise Report</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('date')}
          className={`btn btn-sm d-inline-flex align-items-center gap-2 px-3.5 py-2 fw-semibold rounded-3 transition-all ${
            activeTab === 'date'
              ? 'btn-dark text-white shadow-sm'
              : 'btn-light text-sa-charcoal bg-transparent border-0'
          }`}
          style={{ fontSize: '13px' }}
        >
          <Calendar size={16} />
          <span>Date-Wise Report (Lecture 1 & 2)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('student')}
          className={`btn btn-sm d-inline-flex align-items-center gap-2 px-3.5 py-2 fw-semibold rounded-3 transition-all ${
            activeTab === 'student'
              ? 'btn-dark text-white shadow-sm'
              : 'btn-light text-sa-charcoal bg-transparent border-0'
          }`}
          style={{ fontSize: '13px' }}
        >
          <User size={16} />
          <span>Student-Wise Report</span>
        </button>
      </div>

      {/* FILTER CONTROLS BAR */}
      <div className="sa-card p-3.5 bg-white">
        {activeTab !== 'student' && (
          <div className="mb-3">
            <BranchBatchSelector
              branch={reportBranch}
              onBranchChange={setReportBranch}
              session={reportSession}
              onSessionChange={setReportSession}
              academicBatch={reportAcademicBatch}
              onAcademicBatchChange={setReportAcademicBatch}
              showAllOption={isSuperAdmin}
              fixedBranch={!isSuperAdmin}
              allowedBranches={!isSuperAdmin ? [defaultBranch] : undefined}
              layout="grid"
            />
          </div>
        )}

        <div className="row g-3 align-items-end">
          {/* Date Selector (For Date view) */}
          {activeTab === 'date' && (
            <div className="col-12 col-md-4">
              <label className="small text-muted fw-semibold mb-1 d-block">Lecture Date</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{ height: '33px' }}
              />
            </div>
          )}

          {/* Student Selector (For Student view) */}
          {activeTab === 'student' && (
            <div className="col-12 col-md-8">
              <label className="small text-muted fw-semibold mb-1 d-block">Search / Select Student (Filtered by Admission Placement)</label>
              <div className="position-relative">
                <select
                  className="form-select form-select-sm"
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  style={{ height: '33px' }}
                >
                  {allStudents.map(s => (
                    <option key={s.id} value={s.student_id || s.id}>
                      {s.student_id ? `[${s.student_id}] ` : ''}{s.full_name || s.name} • {formatStudentBatchDisplay(s)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="col-12 col-md-2 ms-auto">
            {(activeTab === 'date' || activeTab === 'student') && (
              <label className="small mb-1 d-none d-md-block opacity-0" style={{ userSelect: 'none' }}>&nbsp;</label>
            )}
            <button
              type="button"
              className="btn btn-sm btn-light border w-100 d-inline-flex align-items-center justify-content-center gap-1.5"
              onClick={fetchReport}
              disabled={loading}
              style={{ height: '33px' }}
            >
              <RefreshCw size={13} className={loading ? 'spin' : ''} />
              <span>Update View</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: BATCH-WISE REPORT */}
      {/* ========================================================================= */}
      {activeTab === 'batch' && (
        <div className="d-flex flex-column gap-4">
          {/* Summary KPIs */}
          <div className="row g-3">
            <div className="col-12 col-sm-6 col-lg-3">
              <div className="sa-card p-3.5 bg-white h-100">
                <span className="small text-sa-muted d-block fw-medium">Students Enrolled</span>
                <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 mt-1">
                  {batchData?.total_students || 0}
                </h3>
                <span className="small text-muted d-block mt-1" style={{ fontSize: '11px' }}>
                  Batch: {reportBatchLabel}
                </span>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-lg-3">
              <div className="sa-card p-3.5 bg-white h-100 border-start border-4 border-success">
                <span className="small text-sa-muted d-block fw-medium">Overall Attendance Rate</span>
                <h3 className="brand-font fw-extrabold text-success m-0 mt-1">
                  {batchData?.overall_attendance_percent || 0}%
                </h3>
                <span className="small text-muted d-block mt-1" style={{ fontSize: '11px' }}>
                  {batchData?.total_present || 0} Lectures Attended
                </span>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-lg-3">
              <div className="sa-card p-3.5 bg-white h-100 border-start border-4 border-primary">
                <span className="small text-sa-muted d-block fw-medium">Total Student Lectures</span>
                <h3 className="brand-font fw-extrabold text-primary m-0 mt-1">
                  {batchData?.total_lectures_conducted || 0}
                </h3>
                <span className="small text-muted d-block mt-1" style={{ fontSize: '11px' }}>
                  Lecture 1 & 2 Logged Separately
                </span>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-lg-3">
              <div className="sa-card p-3.5 bg-white h-100 border-start border-4 border-danger">
                <span className="small text-sa-muted d-block fw-medium">Attendance Defaulters (&lt;75%)</span>
                <h3 className="brand-font fw-extrabold text-danger m-0 mt-1">
                  {batchData?.defaulters_count || 0}
                </h3>
                <span className="small text-muted d-block mt-1" style={{ fontSize: '11px' }}>
                  Requires Academic Counseling
                </span>
              </div>
            </div>
          </div>

          {/* Student Breakdown Table */}
          <div className="sa-card p-4 bg-white">
            <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
              <h5 className="brand-font fw-bold text-sa-charcoal m-0 fs-6">
                Batch Student Attendance Breakdown ({batchData?.students?.length || 0} Students)
              </h5>
              <span className="small text-muted">
                Dual lecture tracking: Lecture 1 & Lecture 2 recorded independently.
              </span>
            </div>

            <Table
              columns={[
                {
                  key: 'roll_number',
                  title: 'Roll Number',
                  render: (val) => <span className="fw-bold text-sa-charcoal">{val}</span>
                },
                {
                  key: 'student_name',
                  title: 'Student Name',
                  render: (val, row) => (
                    <div>
                      <span className="fw-semibold text-sa-charcoal d-block">{val}</span>
                      <span className="small text-muted" style={{ fontSize: '11px' }}>
                        Ph: {row.parent_mobile || 'N/A'}
                      </span>
                    </div>
                  )
                },
                {
                  key: 'lecture_1_present',
                  title: 'Lecture 1 (Morning)',
                  render: (val, row) => (
                    <span className="fw-medium text-sa-charcoal">
                      {val} / {row.lecture_1_total}
                    </span>
                  )
                },
                {
                  key: 'lecture_2_present',
                  title: 'Lecture 2 (Afternoon)',
                  render: (val, row) => (
                    <span className="fw-medium text-sa-charcoal">
                      {val} / {row.lecture_2_total}
                    </span>
                  )
                },
                {
                  key: 'total_lectures',
                  title: 'Total Lectures',
                  render: (val) => <span className="fw-semibold">{val}</span>
                },
                {
                  key: 'total_present',
                  title: 'Attended',
                  render: (val) => <span className="text-success fw-bold">{val}</span>
                },
                {
                  key: 'total_absent',
                  title: 'Absent',
                  render: (val) => <span className="text-danger fw-bold">{val}</span>
                },
                {
                  key: 'attendance_rate',
                  title: 'Attendance %',
                  render: (val) => {
                    const num = Number(val || 0);
                    return (
                      <span className={`fw-bold ${num >= 75 ? 'text-success' : 'text-danger'}`}>
                        {num}%
                      </span>
                    );
                  }
                },
                {
                  key: 'status',
                  title: 'Academic Status',
                  render: (val) => (
                    <span
                      className={`badge ${
                        val.includes('Defaulter')
                          ? 'bg-danger-subtle text-danger border border-danger-subtle'
                          : 'bg-success-subtle text-success border border-success-subtle'
                      }`}
                    >
                      {val}
                    </span>
                  )
                }
              ]}
              data={batchData?.students || []}
              loading={loading}
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DATE-WISE REPORT */}
      {/* ========================================================================= */}
      {activeTab === 'date' && (
        <div className="d-flex flex-column gap-4">
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <div className="sa-card p-3.5 bg-white border-start border-4 border-success">
                <span className="small text-sa-muted d-block fw-medium">
                  Lecture 1 (Morning Session Performance)
                </span>
                <div className="d-flex align-items-baseline gap-2 mt-1">
                  <h3 className="brand-font fw-extrabold text-success m-0">
                    {dateData?.lecture_1_summary?.present || 0}
                  </h3>
                  <span className="small text-muted">
                    Present ({dateData?.lecture_1_summary?.rate || 0}%)
                  </span>
                </div>
                <span className="small text-danger d-block mt-1" style={{ fontSize: '11px' }}>
                  {dateData?.lecture_1_summary?.absent || 0} Absent Students (SMS Sent to Parents)
                </span>
              </div>
            </div>

            <div className="col-12 col-md-6">
              <div className="sa-card p-3.5 bg-white border-start border-4 border-primary">
                <span className="small text-sa-muted d-block fw-medium">
                  Lecture 2 (Afternoon Session Performance)
                </span>
                <div className="d-flex align-items-baseline gap-2 mt-1">
                  <h3 className="brand-font fw-extrabold text-primary m-0">
                    {dateData?.lecture_2_summary?.present || 0}
                  </h3>
                  <span className="small text-muted">
                    Present ({dateData?.lecture_2_summary?.rate || 0}%)
                  </span>
                </div>
                <span className="small text-danger d-block mt-1" style={{ fontSize: '11px' }}>
                  {dateData?.lecture_2_summary?.absent || 0} Absent Students (SMS Sent to Parents)
                </span>
              </div>
            </div>
          </div>

          <div className="sa-card p-4 bg-white">
            <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
              <div>
                <h5 className="brand-font fw-bold text-sa-charcoal m-0 fs-6">
                  Date Attendance Ledger: {dateData?.formatted_date || selectedDate}
                </h5>
                <span className="small text-muted">
                  Batch: {batch} — Individual lecture attendance records for morning and afternoon sessions
                </span>
              </div>
            </div>

            <Table
              columns={[
                {
                  key: 'roll_number',
                  title: 'Roll Number',
                  render: (val) => <span className="fw-bold">{val}</span>
                },
                {
                  key: 'student_name',
                  title: 'Student Name',
                  render: (val, row) => (
                    <div>
                      <span className="fw-semibold text-sa-charcoal d-block">{val}</span>
                      <span className="small text-muted" style={{ fontSize: '11px' }}>
                        Parent: {row.parent_mobile || 'N/A'}
                      </span>
                    </div>
                  )
                },
                {
                  key: 'lecture_1',
                  title: 'Lecture 1 (Morning)',
                  render: (val) => {
                    const st = val?.status || 'Not Marked';
                    return (
                      <div>
                        <span className={`badge ${st === 'Present' ? 'bg-success' : st === 'Absent' ? 'bg-danger' : 'bg-light text-muted border'}`}>
                          {st}
                        </span>
                        <span className="small text-muted d-block mt-0.5" style={{ fontSize: '10px' }}>
                          {val?.subject || 'Lecture 1'} {val?.time && val.time !== '--' ? `• ${val.time}` : ''}
                        </span>
                      </div>
                    );
                  }
                },
                {
                  key: 'lecture_2',
                  title: 'Lecture 2 (Afternoon)',
                  render: (val) => {
                    const st = val?.status || 'Not Marked';
                    return (
                      <div>
                        <span className={`badge ${st === 'Present' ? 'bg-success' : st === 'Absent' ? 'bg-danger' : 'bg-light text-muted border'}`}>
                          {st}
                        </span>
                        <span className="small text-muted d-block mt-0.5" style={{ fontSize: '10px' }}>
                          {val?.subject || 'Lecture 2'} {val?.time && val.time !== '--' ? `• ${val.time}` : ''}
                        </span>
                      </div>
                    );
                  }
                },
                {
                  key: 'parentAlert',
                  title: 'Absence Parent Alerts',
                  render: (_, row) => {
                    const isAbs = row.lecture_1?.status === 'Absent' || row.lecture_2?.status === 'Absent';
                    if (!isAbs) return <span className="small text-muted">—</span>;
                    return (
                      <div className="d-flex flex-column gap-1">
                        <div className="d-flex align-items-center gap-1">
                          <span className="badge bg-success-subtle text-success border border-success-subtle" style={{ fontSize: '10.5px' }}>
                            💬 WhatsApp
                          </span>
                          <span className="badge bg-primary-subtle text-primary border border-primary-subtle" style={{ fontSize: '10.5px' }}>
                            📱 SMS
                          </span>
                        </div>
                        {row.parent_mobile && (
                          <button
                            type="button"
                            onClick={() => {
                              const text = `*Shubham Academy • Attendance Update*\n\nDear Parent, your ward *${row.student_name}* (${row.roll_number}) was recorded absent for today's lecture session (${selectedDate}). Please contact academy administration for inquiries.\n\n_Shubham Academy_`;
                              notificationService.sendWhatsAppWeb(row.parent_mobile, text);
                            }}
                            className="btn btn-xs btn-outline-success d-inline-flex align-items-center gap-1 py-0.5 px-2 mt-0.5 rounded-2"
                            style={{ fontSize: '10px', width: 'fit-content' }}
                            title="Open direct WhatsApp chat with parent"
                          >
                            <span>💬 Chat on WhatsApp</span>
                          </button>
                        )}
                      </div>
                    );
                  }
                }
              ]}
              data={dateData?.records || []}
              loading={loading}
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: STUDENT-WISE REPORT */}
      {/* ========================================================================= */}
      {activeTab === 'student' && (
        <div className="d-flex flex-column gap-4">
          {/* Student Profile & KPI Summary */}
          {studentData && (
            <div className="sa-card p-4 bg-white">
              <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 border-bottom pb-3 mb-3">
                <div className="d-flex align-items-center gap-3">
                  <div className="p-3 bg-danger-subtle text-danger rounded-circle fw-bold fs-4">
                    {studentData.student?.full_name?.charAt(0) || 'S'}
                  </div>
                  <div>
                    <h4 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-5">
                      {studentData.student?.full_name}
                    </h4>
                    <span className="small text-muted">
                      Roll Number: <strong>{studentData.student?.roll_number}</strong> • Batch: <strong>{studentData.student?.batch}</strong>
                    </span>
                    <span className="small text-muted d-block mt-0.5">
                      Parent Contact: {studentData.student?.parent_name} ({studentData.student?.parent_mobile})
                    </span>
                  </div>
                </div>

                <div className="text-md-end">
                  <span className="small text-muted d-block">Overall Attendance Rate</span>
                  <h2 className={`brand-font fw-extrabold m-0 ${studentData.stats?.defaulter ? 'text-danger' : 'text-success'}`}>
                    {studentData.stats?.attendance_rate}%
                  </h2>
                  <span className={`badge mt-1 ${studentData.stats?.defaulter ? 'bg-danger text-white' : 'bg-success text-white'}`}>
                    {studentData.stats?.defaulter ? 'Defaulter (<75%)' : 'Satisfactory Attendance'}
                  </span>
                </div>
              </div>

              {/* Individual Lecture Breakdown */}
              <div className="row g-3">
                <div className="col-12 col-md-4">
                  <div className="p-3 rounded-3 bg-light border">
                    <span className="small text-muted d-block">Total Lectures Scheduled</span>
                    <h4 className="fw-bold text-sa-charcoal m-0 mt-1">{studentData.stats?.total_lectures || 0}</h4>
                    <span className="small text-muted mt-1 d-block">
                      {studentData.stats?.total_present || 0} Attended • {studentData.stats?.total_absent || 0} Absent
                    </span>
                  </div>
                </div>

                <div className="col-12 col-md-4">
                  <div className="p-3 rounded-3 bg-light border border-success-subtle">
                    <span className="small text-muted d-block">Lecture 1 (Morning) Rate</span>
                    <h4 className="fw-bold text-success m-0 mt-1">{studentData.stats?.lecture_1?.rate || 0}%</h4>
                    <span className="small text-muted mt-1 d-block">
                      {studentData.stats?.lecture_1?.present || 0} / {studentData.stats?.lecture_1?.total || 0} Sessions
                    </span>
                  </div>
                </div>

                <div className="col-12 col-md-4">
                  <div className="p-3 rounded-3 bg-light border border-primary-subtle">
                    <span className="small text-muted d-block">Lecture 2 (Afternoon) Rate</span>
                    <h4 className="fw-bold text-primary m-0 mt-1">{studentData.stats?.lecture_2?.rate || 0}%</h4>
                    <span className="small text-muted mt-1 d-block">
                      {studentData.stats?.lecture_2?.present || 0} / {studentData.stats?.lecture_2?.total || 0} Sessions
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Detailed Student Lecture History */}
          <div className="sa-card p-4 bg-white">
            <h5 className="brand-font fw-bold text-sa-charcoal mb-3 fs-6">
              Complete Lecture Attendance Timeline ({studentData?.history?.length || 0} Records)
            </h5>

            <Table
              columns={[
                { key: 'date', title: 'Date' },
                {
                  key: 'lecture_slot',
                  title: 'Lecture Slot',
                  render: (val) => <span className="fw-semibold">{val}</span>
                },
                { key: 'subject', title: 'Subject' },
                {
                  key: 'status',
                  title: 'Status',
                  render: (val) => (
                    <span className={`badge ${val === 'Present' ? 'bg-success' : val === 'Absent' ? 'bg-danger' : 'bg-secondary'}`}>
                      {val}
                    </span>
                  )
                },
                { key: 'check_in_time', title: 'Punch Time' },
                {
                  key: 'notification_sent',
                  title: 'Parent Absence Alert',
                  render: (val, row) => (val || row.status === 'Absent') ? (
                    <div className="d-flex align-items-center gap-1">
                      <span className="badge bg-success-subtle text-success border border-success-subtle" style={{ fontSize: '10.5px' }}>
                        💬 WhatsApp
                      </span>
                      <span className="badge bg-primary-subtle text-primary border border-primary-subtle" style={{ fontSize: '10.5px' }}>
                        📱 SMS
                      </span>
                    </div>
                  ) : <span className="text-muted small">—</span>
                },
                { key: 'source', title: 'Source' },
                { key: 'remarks', title: 'Remarks' }
              ]}
              data={studentData?.history || []}
              loading={loading}
            />
          </div>
        </div>
      )}
    </div>
  );
}
