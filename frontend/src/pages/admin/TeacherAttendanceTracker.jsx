import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Table from '../../components/common/Table';
import SearchBar from '../../components/common/SearchBar';
import Button from '../../components/common/Button';
import BackButton from '../../components/common/BackButton';
import Modal from '../../components/common/Modal';
import attendanceService from '../../services/attendanceService';
import teacherService from '../../services/teacherService';
import {
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  CalendarDays,
  Calendar,
  Download,
  PlusCircle,
  RefreshCw,
  LogOut,
  Edit2,
  Trash2,
  ArrowRight,
  Filter,
  Activity,
  Check
} from 'lucide-react';
import { toast } from 'react-toastify';

export default function TeacherAttendanceTracker() {
  const navigate = useNavigate();

  // State
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [teachersList, setTeachersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal State for Manual / Edit Entry
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [editingRecordId, setEditingRecordId] = useState(null);
  const [formData, setFormData] = useState({
    teacher_id: '',
    date: selectedDate,
    status: 'Present',
    check_in_time: '',
    check_out_time: '',
    remarks: ''
  });
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Load teachers for dropdown
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const teachers = await teacherService.getAll();
        setTeachersList(teachers || []);
      } catch (err) {
        console.error('Failed to load teachers list', err);
      }
    };
    fetchTeachers();
  }, []);

  // Fetch Attendance Records and Summary
  const fetchData = async () => {
    setLoading(true);
    try {
      const [recs, sum] = await Promise.all([
        attendanceService.getTeachersAttendance({ date: selectedDate }).catch(() => []),
        attendanceService.getTeachersSummary({ date: selectedDate }).catch(() => null)
      ]);
      setRecords(recs || []);
      setSummary(sum);
    } catch (error) {
      toast.error('Failed to load teacher attendance records');
      setRecords([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Open Modal for new manual entry
  const handleOpenCreateModal = () => {
    setModalMode('create');
    setEditingRecordId(null);
    setFormData({
      teacher_id: teachersList[0]?.id || '',
      date: selectedDate,
      status: 'Present',
      check_in_time: '09:00',
      check_out_time: '17:00',
      remarks: 'Manual attendance entry'
    });
    setIsModalOpen(true);
  };

  // Open Modal to edit existing record
  const handleOpenEditModal = (rec) => {
    setModalMode('edit');
    setEditingRecordId(rec.id);

    const getHM = (isoStr) => {
      if (!isoStr) return '';
      const d = new Date(isoStr);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    setFormData({
      teacher_id: rec.teacher_id,
      date: rec.date ? rec.date.split('T')[0] : selectedDate,
      status: rec.status || 'Present',
      check_in_time: getHM(rec.check_in_time),
      check_out_time: getHM(rec.check_out_time),
      remarks: rec.remarks || ''
    });
    setIsModalOpen(true);
  };

  // Handle Form Submit
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.teacher_id) {
      toast.error('Please select a faculty member');
      return;
    }

    setFormSubmitting(true);
    try {
      const baseDate = formData.date || selectedDate;
      let checkInIso = null;
      let checkOutIso = null;

      if (formData.check_in_time) {
        checkInIso = new Date(`${baseDate}T${formData.check_in_time}:00`).toISOString();
      }
      if (formData.check_out_time) {
        checkOutIso = new Date(`${baseDate}T${formData.check_out_time}:00`).toISOString();
      }

      if (modalMode === 'create') {
        await attendanceService.markTeacherManual({
          teacher_id: formData.teacher_id,
          date: new Date(baseDate).toISOString(),
          status: formData.status,
          check_in_time: checkInIso,
          check_out_time: checkOutIso,
          remarks: formData.remarks
        });
        toast.success('Teacher attendance logged successfully!');
      } else {
        await attendanceService.updateAttendance(editingRecordId, {
          status: formData.status,
          check_in_time: checkInIso,
          check_out_time: checkOutIso,
          remarks: formData.remarks
        });
        toast.success('Attendance record updated successfully!');
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save attendance record');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Quick 1-click Check Out action for a teacher who is currently working
  const handleQuickCheckOut = async (rec) => {
    if (window.confirm(`Check out faculty member: ${rec.teacher_name} now?`)) {
      try {
        await attendanceService.checkOut(rec.teacher_id, 'Checked out by Admin');
        toast.success(`${rec.teacher_name} successfully checked out!`);
        fetchData();
      } catch (err) {
        toast.error(err.response?.data?.detail || 'Failed to check out teacher');
      }
    }
  };

  // Delete record
  const handleDeleteRecord = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete attendance record for ${name}?`)) {
      try {
        await attendanceService.deleteAttendance(id);
        toast.success('Attendance record deleted');
        setRecords(records.filter((r) => r.id !== id));
      } catch (err) {
        toast.error('Failed to delete attendance record');
      }
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (records.length === 0) {
      toast.info('No records to export for selected date');
      return;
    }

    const headers = ['Faculty Name,Employee ID,Date,Check In,Check Out,Total Hours,Status,Remarks\n'];
    const rows = records.map((r) => {
      const inTime = r.check_in_time ? new Date(r.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--';
      const outTime = r.check_out_time ? new Date(r.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (r.check_in_time ? 'Working' : '--');
      const cleanRemarks = (r.remarks || '').replace(/,/g, ';');
      return `"${r.teacher_name}","${r.employee_id}","${selectedDate}","${inTime}","${outTime}","${r.total_hours}","${r.status}","${cleanRemarks}"`;
    });

    const csvContent = headers.concat(rows).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Faculty_Attendance_${selectedDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Attendance report downloaded successfully!');
  };

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchesSearch =
        (r.teacher_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (r.employee_id || '').toLowerCase().includes(search.toLowerCase()) ||
        (r.subjects || []).join(' ').toLowerCase().includes(search.toLowerCase());

      const statusLower = (r.status || '').toLowerCase();
      let matchesStatus = true;
      if (statusFilter === 'Working') {
        matchesStatus = statusLower === 'working' || (r.check_in_time && !r.check_out_time);
      } else if (statusFilter === 'Completed' || statusFilter === 'Present') {
        matchesStatus = statusLower === 'present' || statusLower === 'completed';
      } else if (statusFilter === 'Absent') {
        matchesStatus = statusLower === 'absent';
      } else if (statusFilter === 'On Leave') {
        matchesStatus = statusLower.includes('leave');
      }

      return matchesSearch && matchesStatus;
    });
  }, [records, search, statusFilter]);

  // Helpers for formatting
  const formatTime = (isoStr) => {
    if (!isoStr) return '--';
    try {
      return new Date(isoStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '--';
    }
  };

  const getStatusBadge = (status, hasCheckIn, hasCheckOut) => {
    const s = (status || '').toLowerCase();
    if (s === 'working' || (hasCheckIn && !hasCheckOut)) {
      return (
        <span
          className="badge d-inline-flex align-items-center gap-1.5 px-2.5 py-1 fw-semibold"
          style={{ backgroundColor: '#EAF6EF', color: '#168554', border: '1px solid #B7E4C7', borderRadius: '14px', fontSize: '11.5px' }}
        >
          <span
            className="rounded-circle"
            style={{
              width: '7px',
              height: '7px',
              backgroundColor: '#168554',
              boxShadow: '0 0 0 2px rgba(22, 133, 84, 0.25)',
              animation: 'pulse 1.8s infinite'
            }}
          />
          Working Now
        </span>
      );
    }
    if (s === 'present' || s === 'completed') {
      return (
        <span
          className="badge d-inline-flex align-items-center gap-1 px-2.5 py-1 fw-semibold"
          style={{ backgroundColor: '#E8F3FF', color: '#1E40AF', border: '1px solid #BFDBFE', borderRadius: '14px', fontSize: '11.5px' }}
        >
          <Check size={12} strokeWidth={2.5} />
          Present
        </span>
      );
    }
    if (s === 'absent') {
      return (
        <span
          className="badge px-2.5 py-1 fw-semibold"
          style={{ backgroundColor: '#FDF0F0', color: '#DC2626', border: '1px solid #FECACA', borderRadius: '14px', fontSize: '11.5px' }}
        >
          Absent
        </span>
      );
    }
    if (s.includes('leave')) {
      return (
        <span
          className="badge px-2.5 py-1 fw-semibold"
          style={{ backgroundColor: '#F3E8FF', color: '#7E22CE', border: '1px solid #E9D5FF', borderRadius: '14px', fontSize: '11.5px' }}
        >
          On Leave
        </span>
      );
    }
    return (
      <span
        className="badge bg-light text-dark border px-2.5 py-1 fw-semibold"
        style={{ borderRadius: '14px', fontSize: '11.5px' }}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="d-flex flex-column gap-4 w-100">
      {/* 1. Header & Quick Actions */}
      <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 pt-1">
        <div className="d-flex align-items-center gap-3">
          <BackButton to="/admin/teachers" label="Back to Faculty" />
          <div>
            <h1 className="fw-bold brand-font text-sa-charcoal m-0" style={{ fontSize: '22px', lineHeight: 1.25 }}>
              Teacher Check-In & Check-Out Tracking
            </h1>
            <p className="text-sa-muted m-0 mt-1" style={{ fontSize: '13px' }}>
              Real-time faculty punch records, active on-duty hours & daily campus attendance ledger
            </p>
          </div>
        </div>

        {/* Top Control Bar: Date Selector, Manual Entry & Export */}
        <div className="d-flex align-items-center flex-wrap gap-2">
          {/* Date Selector */}
          <div className="d-flex align-items-center gap-2 bg-white border px-2.5 py-1 rounded-3 shadow-2xs">
            <Calendar size={15} className="text-sa-muted" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border-0 bg-transparent text-sa-charcoal fw-semibold"
              style={{ fontSize: '13px', outline: 'none', cursor: 'pointer' }}
              aria-label="Select attendance date"
            />
            {selectedDate !== new Date().toISOString().slice(0, 10) && (
              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  setSelectedDate(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
                }}
                className="btn btn-sm btn-link text-decoration-none p-0 text-primary fw-medium"
                style={{ fontSize: '11.5px' }}
              >
                Today
              </button>
            )}
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn btn-sm btn-light border d-inline-flex align-items-center justify-content-center p-2 rounded-2"
            title="Refresh records"
            aria-label="Refresh records"
          >
            <RefreshCw size={15} className={refreshing ? 'spin-animation' : ''} />
          </button>

          {/* Export CSV */}
          <Button
            variant="outline"
            icon={Download}
            onClick={handleExportCSV}
            style={{ fontSize: '13px', padding: '7px 14px' }}
          >
            Export Timesheet
          </Button>

          {/* Manual Entry */}
          <Button
            variant="primary"
            icon={PlusCircle}
            onClick={handleOpenCreateModal}
            style={{ fontSize: '13px', padding: '7px 15px' }}
          >
            Manual Punch / Entry
          </Button>
        </div>
      </div>

      {/* 2. Key Metrics Summary Cards */}
      <div className="row g-3">
        {/* Total Faculty */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="sa-card bg-white border p-3 d-flex align-items-center gap-3 h-100"
            style={{ borderRadius: '14px', borderColor: '#E2E8F0', boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)' }}
          >
            <div
              className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
              style={{ width: '44px', height: '44px', backgroundColor: '#F1F5F9', color: '#475569' }}
            >
              <Users size={20} />
            </div>
            <div>
              <div className="text-sa-muted fw-medium" style={{ fontSize: '11.5px' }}>
                Total Active Faculty
              </div>
              <div className="brand-font fw-bold text-sa-charcoal" style={{ fontSize: '24px', lineHeight: 1.15 }}>
                {summary?.total_teachers ?? teachersList.length}
              </div>
              <div className="text-sa-muted small" style={{ fontSize: '11px', marginTop: '2px' }}>
                Assigned to campus
              </div>
            </div>
          </div>
        </div>

        {/* Working Now */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="sa-card bg-white border p-3 d-flex align-items-center gap-3 h-100"
            style={{ borderRadius: '14px', borderColor: '#BBF7D0', boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)' }}
          >
            <div
              className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
              style={{ width: '44px', height: '44px', backgroundColor: '#EAF6EF', color: '#168554' }}
            >
              <Activity size={20} />
            </div>
            <div>
              <div className="fw-semibold text-success d-flex align-items-center gap-1.5" style={{ fontSize: '11.5px' }}>
                <span
                  className="rounded-circle"
                  style={{ width: '6px', height: '6px', backgroundColor: '#168554' }}
                />
                Currently Working
              </div>
              <div className="brand-font fw-bold text-success" style={{ fontSize: '24px', lineHeight: 1.15 }}>
                {summary?.working_count ?? records.filter((r) => r.status === 'Working' || (r.check_in_time && !r.check_out_time)).length}
              </div>
              <div className="text-sa-muted small" style={{ fontSize: '11px', marginTop: '2px' }}>
                Checked in, on duty now
              </div>
            </div>
          </div>
        </div>

        {/* Shift Completed */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="sa-card bg-white border p-3 d-flex align-items-center gap-3 h-100"
            style={{ borderRadius: '14px', borderColor: '#BFDBFE', boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)' }}
          >
            <div
              className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
              style={{ width: '44px', height: '44px', backgroundColor: '#EFF6FF', color: '#2563EB' }}
            >
              <CheckCircle2 size={20} />
            </div>
            <div>
              <div className="text-sa-muted fw-medium" style={{ fontSize: '11.5px' }}>
                Completed Shift Today
              </div>
              <div className="brand-font fw-bold text-primary" style={{ fontSize: '24px', lineHeight: 1.15 }}>
                {summary?.completed_count ?? records.filter((r) => r.check_out_time).length}
              </div>
              <div className="text-sa-muted small" style={{ fontSize: '11px', marginTop: '2px' }}>
                Punched out successfully
              </div>
            </div>
          </div>
        </div>

        {/* Absent / Pending */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="sa-card bg-white border p-3 d-flex align-items-center gap-3 h-100"
            style={{ borderRadius: '14px', borderColor: '#FECACA', boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)' }}
          >
            <div
              className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
              style={{ width: '44px', height: '44px', backgroundColor: '#FDF0F0', color: '#DC2626' }}
            >
              <AlertCircle size={20} />
            </div>
            <div>
              <div className="text-sa-muted fw-medium" style={{ fontSize: '11.5px' }}>
                Absent / No Punch
              </div>
              <div className="brand-font fw-bold text-danger" style={{ fontSize: '24px', lineHeight: 1.15 }}>
                {summary?.absent_count ?? Math.max(0, (summary?.total_teachers || teachersList.length) - records.length)}
              </div>
              <div className="text-sa-muted small" style={{ fontSize: '11px', marginTop: '2px' }}>
                {summary?.on_leave_count ? `${summary.on_leave_count} on approved leave` : 'Not punched today'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Filter Bar & Ledger Table */}
      <div className="sa-card bg-white border rounded-4 p-3 p-md-4 shadow-sm" style={{ borderColor: '#E2E8F0' }}>
        {/* Filter controls row */}
        <div className="d-flex flex-column flex-md-row align-items-stretch align-items-md-center justify-content-between gap-3 mb-3 pb-3 border-bottom">
          {/* Search bar */}
          <div style={{ maxWidth: '380px', width: '100%' }}>
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search by faculty name, ID, or subject..."
            />
          </div>

          {/* Status Filter Pills */}
          <div className="d-flex align-items-center gap-1.5 flex-wrap">
            {['All', 'Working', 'Completed', 'Absent', 'On Leave'].map((pill) => (
              <button
                key={pill}
                type="button"
                onClick={() => setStatusFilter(pill)}
                className={`btn btn-sm rounded-pill px-3 py-1 fw-medium transition-all ${
                  statusFilter === pill
                    ? 'btn-dark text-white'
                    : 'btn-light text-sa-charcoal border bg-white'
                }`}
                style={{ fontSize: '12px' }}
              >
                {pill}
              </button>
            ))}
          </div>
        </div>

        {/* Ledger Table */}
        <div className="table-responsive">
          <table className="table align-middle table-hover mb-0">
            <thead style={{ backgroundColor: '#F8FAFC' }}>
              <tr style={{ fontSize: '12px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                <th scope="col" className="py-3 px-3">Faculty Member</th>
                <th scope="col" className="py-3 px-3">Date</th>
                <th scope="col" className="py-3 px-3">Check-In Time</th>
                <th scope="col" className="py-3 px-3">Check-Out Time</th>
                <th scope="col" className="py-3 px-3">Total Duration</th>
                <th scope="col" className="py-3 px-3">Status</th>
                <th scope="col" className="py-3 px-3">Remarks / Location</th>
                <th scope="col" className="py-3 px-3 text-end">Action</th>
              </tr>
            </thead>
            <tbody style={{ fontSize: '13px' }}>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-5 text-sa-muted">
                    <div className="spinner-border spinner-border-sm text-primary me-2" role="status" />
                    Loading faculty check-in & check-out records…
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-5">
                    <div className="d-flex flex-column align-items-center justify-content-center gap-2">
                      <Clock size={36} className="text-sa-muted opacity-50" />
                      <div className="fw-semibold text-sa-charcoal">No check-in records found for this date</div>
                      <p className="text-sa-muted small m-0" style={{ maxWidth: '360px' }}>
                        Teachers who check in via their portal will automatically appear here. You can also manually log a punch record.
                      </p>
                      <button
                        type="button"
                        onClick={handleOpenCreateModal}
                        className="btn btn-sm btn-outline-primary mt-2 d-inline-flex align-items-center gap-1.5"
                      >
                        <PlusCircle size={14} />
                        <span>Log Manual Check-In</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => {
                  const isCurrentlyWorking = rec.status === 'Working' || (rec.check_in_time && !rec.check_out_time);
                  return (
                    <tr key={rec.id} style={{ verticalAlign: 'middle' }}>
                      {/* Teacher Profile */}
                      <td className="px-3 py-3">
                        <div className="d-flex align-items-center gap-2.5">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
                            style={{
                              width: '38px',
                              height: '38px',
                              backgroundColor: '#8B1216',
                              fontSize: '13px'
                            }}
                          >
                            {(rec.teacher_name || 'T')
                              .split(' ')
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join('')
                              .toUpperCase()}
                          </div>
                          <div>
                            <div className="fw-bold text-sa-charcoal" style={{ fontSize: '13.5px' }}>
                              {rec.teacher_name}
                            </div>
                            <div className="d-flex align-items-center gap-1.5 mt-0.5">
                              <span className="badge bg-light text-sa-muted border" style={{ fontSize: '10.5px' }}>
                                {rec.employee_id}
                              </span>
                              {rec.subjects && rec.subjects.length > 0 && (
                                <span className="badge" style={{ backgroundColor: '#FEF3C7', color: '#92400E', fontSize: '10.5px' }}>
                                  {rec.subjects[0]}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-3 py-3 text-sa-charcoal fw-medium">
                        {new Date(rec.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>

                      {/* Check-In */}
                      <td className="px-3 py-3">
                        {rec.check_in_time ? (
                          <div className="d-inline-flex align-items-center gap-1.5 fw-semibold text-sa-charcoal">
                            <span
                              className="rounded-circle"
                              style={{ width: '8px', height: '8px', backgroundColor: '#16A34A' }}
                            />
                            {formatTime(rec.check_in_time)}
                          </div>
                        ) : (
                          <span className="text-sa-muted">--</span>
                        )}
                      </td>

                      {/* Check-Out */}
                      <td className="px-3 py-3">
                        {rec.check_out_time ? (
                          <div className="d-inline-flex align-items-center gap-1.5 fw-semibold text-sa-charcoal">
                            <span
                              className="rounded-circle"
                              style={{ width: '8px', height: '8px', backgroundColor: '#DC2626' }}
                            />
                            {formatTime(rec.check_out_time)}
                          </div>
                        ) : isCurrentlyWorking ? (
                          <span className="text-success fw-medium small d-inline-flex align-items-center gap-1">
                            <Clock size={13} className="text-success" />
                            In Progress
                          </span>
                        ) : (
                          <span className="text-sa-muted">--</span>
                        )}
                      </td>

                      {/* Total Duration */}
                      <td className="px-3 py-3 fw-bold text-sa-charcoal">
                        {rec.total_hours || '--'}
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3">
                        {getStatusBadge(rec.status, Boolean(rec.check_in_time), Boolean(rec.check_out_time))}
                      </td>

                      {/* Remarks */}
                      <td className="px-3 py-3 text-sa-muted" style={{ maxWidth: '220px' }}>
                        <div className="text-truncate" title={rec.remarks || 'None'}>
                          {rec.remarks || '--'}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-3 py-3 text-end">
                        <div className="d-inline-flex align-items-center gap-1.5 justify-content-end">
                          {/* Quick Checkout button if currently working */}
                          {isCurrentlyWorking && (
                            <button
                              type="button"
                              onClick={() => handleQuickCheckOut(rec)}
                              className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1 px-2 py-1"
                              style={{ fontSize: '11.5px', borderRadius: '6px' }}
                              title="Mark Check Out for teacher"
                            >
                              <LogOut size={12} />
                              <span>Check Out</span>
                            </button>
                          )}

                          {/* View Timesheet */}
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/teachers/${rec.teacher_id}/working-time`)}
                            className="btn btn-sm btn-light border p-1 text-primary"
                            style={{ borderRadius: '6px' }}
                            title="View Full Monthly Timesheet"
                            aria-label="View Full Monthly Timesheet"
                          >
                            <Clock size={14} />
                          </button>

                          {/* Edit Record */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(rec)}
                            className="btn btn-sm btn-light border p-1 text-secondary"
                            style={{ borderRadius: '6px' }}
                            title="Edit Attendance Record"
                            aria-label="Edit Attendance Record"
                          >
                            <Edit2 size={14} />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDeleteRecord(rec.id, rec.teacher_name)}
                            className="btn btn-sm btn-light border p-1 text-danger"
                            style={{ borderRadius: '6px' }}
                            title="Delete Record"
                            aria-label="Delete Record"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Manual Punch / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          if (!formSubmitting) setIsModalOpen(false);
        }}
        title={modalMode === 'create' ? 'Log Manual Teacher Punch / Attendance' : 'Edit Faculty Attendance Record'}
      >
        <form onSubmit={handleFormSubmit} className="d-flex flex-column gap-3">
          {/* Teacher Selection */}
          <div>
            <label className="form-label small fw-semibold text-sa-charcoal mb-1">
              Faculty Member <span className="text-danger">*</span>
            </label>
            <select
              className="form-select form-select-sm"
              value={formData.teacher_id}
              onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
              disabled={modalMode === 'edit'}
              required
            >
              <option value="">Select Faculty...</option>
              {teachersList.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.employee_id || 'Faculty'}) - {t.subject || 'All Subjects'}
                </option>
              ))}
            </select>
          </div>

          {/* Date & Status */}
          <div className="row g-2">
            <div className="col-12 col-sm-6">
              <label className="form-label small fw-semibold text-sa-charcoal mb-1">
                Date <span className="text-danger">*</span>
              </label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div className="col-12 col-sm-6">
              <label className="form-label small fw-semibold text-sa-charcoal mb-1">
                Attendance Status <span className="text-danger">*</span>
              </label>
              <select
                className="form-select form-select-sm"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                required
              >
                <option value="Present">Present (Shift Completed)</option>
                <option value="Working">Working (Checked In, On Duty)</option>
                <option value="Absent">Absent</option>
                <option value="Late">Late Arrival</option>
                <option value="Half Day">Half Day</option>
                <option value="Leave">On Leave</option>
              </select>
            </div>
          </div>

          {/* Check-In & Check-Out Times */}
          <div className="row g-2">
            <div className="col-12 col-sm-6">
              <label className="form-label small fw-semibold text-sa-charcoal mb-1">
                Check-In Time
              </label>
              <input
                type="time"
                className="form-control form-control-sm"
                value={formData.check_in_time}
                onChange={(e) => setFormData({ ...formData, check_in_time: e.target.value })}
              />
            </div>
            <div className="col-12 col-sm-6">
              <label className="form-label small fw-semibold text-sa-charcoal mb-1">
                Check-Out Time
              </label>
              <input
                type="time"
                className="form-control form-control-sm"
                value={formData.check_out_time}
                onChange={(e) => setFormData({ ...formData, check_out_time: e.target.value })}
              />
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="form-label small fw-semibold text-sa-charcoal mb-1">
              Remarks / Duty Notes
            </label>
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="e.g. Regular lectures, Gate verification, Doubt session"
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            />
          </div>

          {/* Modal Actions */}
          <div className="d-flex justify-content-end align-items-center gap-2 pt-3 border-top mt-2">
            <button
              type="button"
              disabled={formSubmitting}
              onClick={() => setIsModalOpen(false)}
              className="btn btn-sm btn-light border px-3"
            >
              Cancel
            </button>
            <Button
              type="submit"
              variant="primary"
              loading={formSubmitting}
              disabled={formSubmitting}
              style={{ fontSize: '13px' }}
            >
              {modalMode === 'create' ? 'Save Attendance Entry' : 'Update Record'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
