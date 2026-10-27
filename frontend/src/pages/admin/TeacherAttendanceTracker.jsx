import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Table from '../../components/common/Table';
import SearchBar from '../../components/common/SearchBar';
import Button from '../../components/common/Button';
import BackButton from '../../components/common/BackButton';
import Modal from '../../components/common/Modal';
import attendanceService from '../../services/attendanceService';
import teacherService from '../../services/teacherService';
import salaryService from '../../services/salaryService';
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
  Check,
  IndianRupee,
  Layers,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  FileSpreadsheet,
  Calculator,
  ArrowUpRight
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useConfirm } from '../../context/ConfirmContext';

export default function TeacherAttendanceTracker() {
  const navigate = useNavigate();
  const { confirm } = useConfirm();

  // View Mode: 'daily' (Daily Punch Ledger) or 'monthly' (Monthly Working Hours & Salary Calculator)
  const [viewMode, setViewMode] = useState('daily');

  // Daily State
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

  // Monthly Working Hours & Salary State
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });
  const [monthlyData, setMonthlyData] = useState(null);
  const [loadingMonthly, setLoadingMonthly] = useState(false);
  const [monthlySearch, setMonthlySearch] = useState('');
  const [monthlyFilter, setMonthlyFilter] = useState('All');
  const [syncingPayroll, setSyncingPayroll] = useState(false);

  // Modal State for Manual / Edit Punch Entry
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

  // Modal State for Quick Hourly Rate Editing
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [rateEditTeacher, setRateEditTeacher] = useState({ id: '', name: '', hourly_rate: 500 });
  const [rateSubmitting, setRateSubmitting] = useState(false);

  // 1. Load teachers list for dropdowns
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

  // 2. Fetch Daily Attendance Records and Summary
  const fetchDailyData = async () => {
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

  // 3. Fetch Monthly Working Hours and Salary Calculations
  const fetchMonthlyData = async () => {
    setLoadingMonthly(true);
    try {
      const data = await attendanceService.getTeachersMonthlyHours({ month: selectedMonth });
      setMonthlyData(data);
    } catch (error) {
      console.warn('Failed to load monthly hours summary:', error);
      // Construct fallback summary from teachers list
      setMonthlyData({
        month: selectedMonth,
        month_label: new Date(`${selectedMonth}-01`).toLocaleString('default', { month: 'long', year: 'numeric' }),
        total_teachers: teachersList.length,
        active_teachers_this_month: 0,
        total_hours_worked: 0.0,
        total_hours_formatted: '0h 00m',
        total_calculated_payroll: 0.0,
        average_hours_per_teacher: 0.0,
        faculty_records: teachersList.map(t => ({
          teacher_id: t.id,
          teacher_name: t.name || t.full_name,
          employee_id: t.employee_id || '--',
          subjects: t.subjects || [t.subject],
          days_worked: 0,
          total_minutes: 0,
          total_hours: 0.0,
          total_hours_formatted: '0h 00m',
          hourly_rate: t.hourly_rate || 500.0,
          calculated_salary: 0.0,
          salary_status: 'Calculated (Hourly)'
        }))
      });
    } finally {
      setLoadingMonthly(false);
    }
  };

  useEffect(() => {
    fetchDailyData();
  }, [selectedDate]);

  useEffect(() => {
    fetchMonthlyData();
  }, [selectedMonth, teachersList.length]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDailyData();
    fetchMonthlyData();
  };

  // Quick lookup map: teacher_id or name -> monthly stats for daily table pill
  const monthlyFacultyMap = useMemo(() => {
    const map = {};
    if (monthlyData?.faculty_records) {
      monthlyData.faculty_records.forEach(f => {
        if (f.teacher_id) map[f.teacher_id] = f;
        if (f.teacher_name) map[f.teacher_name.toLowerCase()] = f;
      });
    }
    return map;
  }, [monthlyData]);

  // Navigate months
  const handleMonthStep = (offset) => {
    try {
      const [y, m] = selectedMonth.split('-').map(Number);
      const d = new Date(y, m - 1 + offset, 1);
      const newMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      setSelectedMonth(newMonth);
    } catch {}
  };

  // Sync Monthly Hours with Payroll Register
  const handleSyncPayroll = async () => {
    try {
      setSyncingPayroll(true);
      const monthLabel = monthlyData?.month_label || new Date(`${selectedMonth}-01`).toLocaleString('default', { month: 'long', year: 'numeric' });
      await salaryService.generateDrafts(monthLabel);
      toast.success(`Successfully synchronized faculty hours & calculated salaries for ${monthLabel}!`);
      fetchMonthlyData();
    } catch (err) {
      toast.error('Failed to synchronize with payroll register.');
    } finally {
      setSyncingPayroll(false);
    }
  };

  // Open Modal for Hourly Rate Edit
  const handleOpenRateModal = (faculty) => {
    setRateEditTeacher({
      id: faculty.teacher_id,
      name: faculty.teacher_name,
      hourly_rate: faculty.hourly_rate || 500
    });
    setIsRateModalOpen(true);
  };

  const handleSaveRate = async (e) => {
    e.preventDefault();
    if (!rateEditTeacher.id) return;
    setRateSubmitting(true);
    try {
      await teacherService.update(rateEditTeacher.id, {
        hourly_rate: Number(rateEditTeacher.hourly_rate)
      });
      toast.success(`Updated hourly rate for ${rateEditTeacher.name} to ₹${rateEditTeacher.hourly_rate}/hr`);
      setIsRateModalOpen(false);
      fetchMonthlyData();
    } catch (err) {
      toast.error('Failed to update faculty hourly rate.');
    } finally {
      setRateSubmitting(false);
    }
  };

  // Open Modal for new manual punch entry
  const handleOpenCreateModal = () => {
    setModalMode('create');
    setEditingRecordId(null);
    const now = new Date();
    const curHM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setFormData({
      teacher_id: teachersList[0]?.id || '',
      date: selectedDate,
      status: 'Working',
      check_in_time: curHM,
      check_out_time: '',
      remarks: 'Campus Duty & Lectures'
    });
    setIsModalOpen(true);
  };

  // Real-time automatic working duration calculation for modal
  const modalCalculatedDuration = useMemo(() => {
    if (!formData.check_in_time) return null;
    if (formData.check_out_time) {
      const [inH, inM] = formData.check_in_time.split(':').map(Number);
      const [outH, outM] = formData.check_out_time.split(':').map(Number);
      let diff = (outH * 60 + outM) - (inH * 60 + inM);
      if (diff < 0) diff += 24 * 60;
      const h = Math.floor(diff / 60);
      const m = diff % 60;
      return `${h}h ${m}m`;
    }
    if (formData.status === 'Working') {
      return 'Active / In Progress';
    }
    return null;
  }, [formData.check_in_time, formData.check_out_time, formData.status]);

  // Open Modal to edit existing record
  const handleOpenEditModal = (rec) => {
    setModalMode('edit');
    setEditingRecordId(rec.id);

    const getHM = (isoStr) => {
      if (!isoStr) return '';
      const s = typeof isoStr === 'string' && !isoStr.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(isoStr)
        ? isoStr + 'Z'
        : isoStr;
      const d = new Date(s);
      if (isNaN(d.getTime())) return '';
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

  // Handle Punch Form Submit
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
        const timePart = formData.check_in_time.length === 5 
          ? `${formData.check_in_time}:00` 
          : formData.check_in_time;
        const d = new Date(`${baseDate}T${timePart}`);
        if (!isNaN(d.getTime())) {
          checkInIso = d.toISOString();
        }
      }

      if (formData.check_out_time) {
        const timePart = formData.check_out_time.length === 5 
          ? `${formData.check_out_time}:00` 
          : formData.check_out_time;
        const d = new Date(`${baseDate}T${timePart}`);
        if (!isNaN(d.getTime())) {
          checkOutIso = d.toISOString();
        }
      }

      let finalStatus = formData.status;
      if (checkOutIso && finalStatus === 'Working') {
        finalStatus = 'Present';
      } else if (!checkOutIso && checkInIso && finalStatus === 'Present') {
        finalStatus = 'Working';
      }

      if (modalMode === 'create') {
        await attendanceService.markTeacherManual({
          teacher_id: formData.teacher_id,
          date: new Date(baseDate).toISOString(),
          status: finalStatus,
          check_in_time: checkInIso,
          check_out_time: checkOutIso,
          remarks: formData.remarks
        });
        toast.success('Teacher attendance logged successfully!');
      } else {
        await attendanceService.updateAttendance(editingRecordId, {
          teacher_id: formData.teacher_id,
          date: new Date(baseDate).toISOString(),
          status: finalStatus,
          check_in_time: checkInIso,
          check_out_time: checkOutIso,
          remarks: formData.remarks
        });
        toast.success('Attendance record updated successfully!');
      }

      setIsModalOpen(false);
      fetchDailyData();
      fetchMonthlyData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save attendance record');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Quick 1-click Check Out action
  const handleQuickCheckOut = async (rec) => {
    const isConfirmed = await confirm({
      title: 'Check Out Faculty',
      message: `Check out faculty member: ${rec.teacher_name} now?`,
      subtitle: 'This will record the official check-out time.',
      confirmText: 'Check Out',
      cancelText: 'Cancel',
      type: 'warning'
    });

    if (isConfirmed) {
      try {
        await attendanceService.checkOut(rec.teacher_id, 'Checked out by Admin');
        toast.success(`${rec.teacher_name} successfully checked out!`);
        fetchDailyData();
        fetchMonthlyData();
      } catch (err) {
        toast.error(err.response?.data?.detail || 'Failed to check out teacher');
      }
    }
  };

  // Delete record
  const handleDeleteRecord = async (id, name) => {
    const isConfirmed = await confirm({
      title: 'Delete Attendance Record',
      message: `Are you sure you want to delete attendance record for ${name}?`,
      subtitle: 'This action cannot be undone.',
      confirmText: 'Delete Record',
      cancelText: 'Cancel',
      type: 'danger'
    });

    if (isConfirmed) {
      try {
        await attendanceService.deleteAttendance(id);
        toast.success('Attendance record deleted');
        setRecords(records.filter((r) => r.id !== id));
        fetchMonthlyData();
      } catch (err) {
        toast.error('Failed to delete attendance record');
      }
    }
  };

  // Export CSV (Daily or Monthly)
  const handleExportCSV = () => {
    if (viewMode === 'monthly') {
      const facList = monthlyData?.faculty_records || [];
      if (facList.length === 0) {
        toast.info('No faculty records to export for this month');
        return;
      }
      const headers = ['Faculty Name,Employee ID,Month,Days Worked,Total Working Hours,Hourly Rate (INR),Calculated Monthly Salary (INR),Status\n'];
      const rows = facList.map((f) => {
        const cleanName = (f.teacher_name || '').replace(/,/g, ' ');
        return `"${cleanName}","${f.employee_id}","${monthlyData?.month_label || selectedMonth}","${f.days_worked}","${f.total_hours_formatted} (${f.total_hours} hrs)","${f.hourly_rate}","${f.calculated_salary}","${f.salary_status}"`;
      });
      const csvContent = headers.concat(rows).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Faculty_Monthly_Hours_Salary_${selectedMonth}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`Exported monthly hours & salary report for ${monthlyData?.month_label || selectedMonth}!`);
      return;
    }

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

  // Filtered Daily Records
  const filteredDailyRecords = useMemo(() => {
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

  // Filtered Monthly Records
  const filteredMonthlyFaculty = useMemo(() => {
    const list = monthlyData?.faculty_records || [];
    return list.filter((f) => {
      const q = monthlySearch.toLowerCase();
      const matchesSearch =
        (f.teacher_name || '').toLowerCase().includes(q) ||
        (f.employee_id || '').toLowerCase().includes(q) ||
        (f.subjects || []).join(' ').toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (monthlyFilter === 'Active') {
        return f.total_minutes > 0 || f.days_worked > 0;
      }
      if (monthlyFilter === 'Zero') {
        return f.total_minutes === 0 && f.days_worked === 0;
      }
      return true;
    });
  }, [monthlyData, monthlySearch, monthlyFilter]);

  // Helpers for formatting
  const formatTime = (isoStr) => {
    if (!isoStr) return '--';
    try {
      const s = typeof isoStr === 'string' && !isoStr.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(isoStr)
        ? isoStr + 'Z'
        : isoStr;
      return new Date(s).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
      {/* 1. Header & View Mode Switcher */}
      <div className="d-flex flex-column flex-lg-row align-items-start align-items-lg-center justify-content-between gap-3 pt-1">
        <div className="d-flex align-items-center gap-3">
          <BackButton to="/admin/teachers" label="Back to Faculty" />
          <div>
            <h1 className="fw-bold brand-font text-sa-charcoal m-0" style={{ fontSize: '22px', lineHeight: 1.25 }}>
              Teacher Check-In & Check-Out Tracking
            </h1>
            <p className="text-sa-muted m-0 mt-1" style={{ fontSize: '13px' }}>
              Real-time faculty punch records, monthly on-duty hours & automated salary compensation ledger
            </p>
          </div>
        </div>

        {/* View Mode Segmented Controls */}
        <div className="d-flex align-items-center bg-light p-1 rounded-3 border flex-shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('daily')}
            className={`btn btn-sm d-inline-flex align-items-center gap-1.5 px-3 py-1.5 rounded-2 fw-semibold transition-all ${
              viewMode === 'daily'
                ? 'bg-white text-sa-charcoal shadow-xs border'
                : 'text-sa-muted border-0'
            }`}
            style={{ fontSize: '12.5px' }}
          >
            <Calendar size={14} className={viewMode === 'daily' ? 'text-sa-primary' : ''} />
            <span>Daily Punch Ledger</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('monthly')}
            className={`btn btn-sm d-inline-flex align-items-center gap-1.5 px-3 py-1.5 rounded-2 fw-semibold transition-all ${
              viewMode === 'monthly'
                ? 'bg-white text-sa-charcoal shadow-xs border'
                : 'text-sa-muted border-0'
            }`}
            style={{ fontSize: '12.5px' }}
          >
            <Calculator size={14} className={viewMode === 'monthly' ? 'text-sa-primary' : ''} />
            <span>Monthly Hours & Salary</span>
          </button>
        </div>
      </div>

      {/* 2. Top Control Bar: Contextual to Selected View Mode */}
      <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 bg-white border p-3 rounded-4 shadow-2xs">
        {/* Left: Current Filter & Target Label */}
        <div className="d-flex align-items-center gap-2 flex-wrap">
          {viewMode === 'daily' ? (
            <>
              <div className="d-flex align-items-center gap-2 bg-light border px-2.5 py-1.5 rounded-3">
                <Calendar size={15} className="text-sa-primary" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border-0 bg-transparent text-sa-charcoal fw-semibold"
                  style={{ fontSize: '13px', outline: 'none', cursor: 'pointer' }}
                  aria-label="Select attendance date"
                />
              </div>
              {selectedDate !== new Date().toISOString().slice(0, 10) && (
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date();
                    setSelectedDate(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
                  }}
                  className="btn btn-sm btn-link text-decoration-none p-0 text-primary fw-medium small"
                >
                  Reset to Today
                </button>
              )}
            </>
          ) : (
            <>
              {/* Monthly Selector */}
              <div className="d-flex align-items-center gap-1.5 bg-light border p-1 rounded-3">
                <button
                  type="button"
                  onClick={() => handleMonthStep(-1)}
                  className="btn btn-sm btn-light border-0 p-1 rounded-2"
                  title="Previous Month"
                >
                  <ChevronLeft size={16} />
                </button>

                <div className="d-flex align-items-center gap-1 px-2">
                  <CalendarDays size={15} className="text-sa-primary" />
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="border-0 bg-transparent text-sa-charcoal fw-bold"
                    style={{ fontSize: '13px', outline: 'none', cursor: 'pointer' }}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleMonthStep(1)}
                  className="btn btn-sm btn-light border-0 p-1 rounded-2"
                  title="Next Month"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {selectedMonth !== new Date().toISOString().slice(0, 7) && (
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date();
                    setSelectedMonth(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`);
                  }}
                  className="btn btn-sm btn-link text-decoration-none p-0 text-primary fw-medium small"
                >
                  Current Month
                </button>
              )}
            </>
          )}

          {/* Refresh Button */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing || loadingMonthly}
            className="btn btn-sm btn-light border d-inline-flex align-items-center justify-content-center p-2 rounded-2"
            title="Refresh records"
            aria-label="Refresh records"
          >
            <RefreshCw size={15} className={refreshing || loadingMonthly ? 'spin-animation' : ''} />
          </button>
        </div>

        {/* Right: Actions */}
        <div className="d-flex align-items-center gap-2 flex-wrap">
          {viewMode === 'monthly' ? (
            <>
              {/* Sync With Payroll Register */}
              <Button
                variant="outline"
                icon={Briefcase}
                onClick={handleSyncPayroll}
                disabled={syncingPayroll}
                style={{ fontSize: '13px', padding: '7px 13px', whiteSpace: 'nowrap' }}
                title="Push calculated monthly hours to payroll register"
              >
                {syncingPayroll ? 'Syncing...' : 'Sync with Payroll'}
              </Button>

              {/* Export Monthly Report */}
              <Button
                variant="primary"
                icon={Download}
                onClick={handleExportCSV}
                style={{ fontSize: '13px', padding: '7px 14px', whiteSpace: 'nowrap' }}
              >
                Export Monthly Salary (CSV)
              </Button>
            </>
          ) : (
            <>
              {/* Export Daily CSV */}
              <Button
                variant="outline"
                icon={Download}
                onClick={handleExportCSV}
                style={{ fontSize: '13px', padding: '7px 13px', whiteSpace: 'nowrap' }}
              >
                Export Timesheet
              </Button>

              {/* Manual Entry */}
              <Button
                variant="primary"
                icon={PlusCircle}
                onClick={handleOpenCreateModal}
                style={{ fontSize: '13px', padding: '7px 14px', whiteSpace: 'nowrap' }}
              >
                Manual Punch / Entry
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 3. VIEW MODE A: DAILY PUNCH LEDGER VIEW                               */}
      {/* ===================================================================== */}
      {viewMode === 'daily' && (
        <>
          {/* Daily Key Metrics Summary Cards */}
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

          {/* Daily Filter Bar & Table */}
          <div className="sa-card bg-white border rounded-4 p-3 p-md-4 shadow-sm" style={{ borderColor: '#E2E8F0' }}>
            <div className="d-flex flex-column flex-md-row align-items-stretch align-items-md-center justify-content-between gap-3 mb-3 pb-3 border-bottom">
              <div style={{ maxWidth: '380px', width: '100%' }}>
                <SearchBar
                  value={search}
                  onChange={setSearch}
                  placeholder="Search by faculty name, ID, or subject..."
                />
              </div>

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

            {/* Daily Ledger Table */}
            <div className="table-responsive">
              <table className="table align-middle table-hover mb-0">
                <thead style={{ backgroundColor: '#F8FAFC' }}>
                  <tr style={{ fontSize: '12px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    <th scope="col" className="py-3 px-3">Faculty Member</th>
                    <th scope="col" className="py-3 px-3">Date</th>
                    <th scope="col" className="py-3 px-3">Check-In Time</th>
                    <th scope="col" className="py-3 px-3">Check-Out Time</th>
                    <th scope="col" className="py-3 px-3">Duration & Month Total</th>
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
                  ) : filteredDailyRecords.length === 0 ? (
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
                    filteredDailyRecords.map((rec) => {
                      const isCurrentlyWorking = rec.status === 'Working' || (rec.check_in_time && !rec.check_out_time);
                      const monthStat = monthlyFacultyMap[rec.teacher_id] || monthlyFacultyMap[(rec.teacher_name || '').toLowerCase()];

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

                          {/* Total Duration & Monthly Cumulative */}
                          <td className="px-3 py-3">
                            <div className="d-flex flex-column">
                              <span className="fw-bold text-sa-charcoal" style={{ fontSize: '13.5px' }}>
                                {rec.total_hours || '--'}
                              </span>
                              {monthStat && (
                                <button
                                  type="button"
                                  onClick={() => setViewMode('monthly')}
                                  className="btn btn-link text-decoration-none p-0 text-start d-inline-flex align-items-center gap-1 text-primary fw-semibold mt-0.5"
                                  style={{ fontSize: '11px' }}
                                  title="View faculty monthly working hours & salary"
                                >
                                  <span>Month: {monthStat.total_hours_formatted}</span>
                                  {monthStat.calculated_salary > 0 && (
                                    <span className="text-success">(₹{monthStat.calculated_salary.toLocaleString()})</span>
                                  )}
                                </button>
                              )}
                            </div>
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
        </>
      )}

      {/* ===================================================================== */}
      {/* 4. VIEW MODE B: MONTHLY WORKING HOURS & SALARY CALCULATOR             */}
      {/* ===================================================================== */}
      {viewMode === 'monthly' && (
        <>
          {/* Monthly Summary KPI Cards */}
          <div className="row g-3">
            {/* 1. Total Faculty Members */}
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
                    Total Faculty Roster
                  </div>
                  <div className="brand-font fw-bold text-sa-charcoal" style={{ fontSize: '24px', lineHeight: 1.15 }}>
                    {monthlyData?.total_teachers || teachersList.length}
                  </div>
                  <div className="text-sa-muted small" style={{ fontSize: '11px', marginTop: '2px' }}>
                    Registered faculty members
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Active Teachers This Month */}
            <div className="col-12 col-sm-6 col-xl-3">
              <div
                className="sa-card bg-white border p-3 d-flex align-items-center gap-3 h-100"
                style={{ borderRadius: '14px', borderColor: '#BFDBFE', boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)' }}
              >
                <div
                  className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                  style={{ width: '44px', height: '44px', backgroundColor: '#EFF6FF', color: '#2563EB' }}
                >
                  <Briefcase size={20} />
                </div>
                <div>
                  <div className="text-sa-muted fw-medium" style={{ fontSize: '11.5px' }}>
                    Active Duty Faculty
                  </div>
                  <div className="brand-font fw-bold text-primary" style={{ fontSize: '24px', lineHeight: 1.15 }}>
                    {monthlyData?.active_teachers_this_month || 0}
                  </div>
                  <div className="text-sa-muted small" style={{ fontSize: '11px', marginTop: '2px' }}>
                    Punched in during {monthlyData?.month_label || selectedMonth}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Total Monthly Hours Worked */}
            <div className="col-12 col-sm-6 col-xl-3">
              <div
                className="sa-card bg-white border p-3 d-flex align-items-center gap-3 h-100"
                style={{ borderRadius: '14px', borderColor: '#BBF7D0', boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)' }}
              >
                <div
                  className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                  style={{ width: '44px', height: '44px', backgroundColor: '#EAF6EF', color: '#168554' }}
                >
                  <Clock size={20} />
                </div>
                <div>
                  <div className="fw-semibold text-success d-flex align-items-center gap-1.5" style={{ fontSize: '11.5px' }}>
                    Total Working Hours
                  </div>
                  <div className="brand-font fw-bold text-success" style={{ fontSize: '24px', lineHeight: 1.15 }}>
                    {monthlyData?.total_hours_formatted || '0h 00m'}
                  </div>
                  <div className="text-sa-muted small" style={{ fontSize: '11px', marginTop: '2px' }}>
                    {monthlyData?.total_hours_worked || 0} cumulative hours logged
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Calculated Monthly Salary / Payroll */}
            <div className="col-12 col-sm-6 col-xl-3">
              <div
                className="sa-card bg-white border p-3 d-flex align-items-center gap-3 h-100"
                style={{ borderRadius: '14px', borderColor: '#FDE68A', boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)' }}
              >
                <div
                  className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                  style={{ width: '44px', height: '44px', backgroundColor: '#FEF3C7', color: '#B45309' }}
                >
                  <IndianRupee size={20} />
                </div>
                <div>
                  <div className="text-sa-muted fw-medium" style={{ fontSize: '11.5px' }}>
                    Calculated Monthly Payroll
                  </div>
                  <div className="brand-font fw-bold" style={{ fontSize: '24px', lineHeight: 1.15, color: '#8B1216' }}>
                    ₹{Number(monthlyData?.total_calculated_payroll || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-sa-muted small" style={{ fontSize: '11px', marginTop: '2px' }}>
                    Calculated strictly: Hours × Hourly Rate
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Faculty Hours & Salary Ledger */}
          <div className="sa-card bg-white border rounded-4 p-3 p-md-4 shadow-sm" style={{ borderColor: '#E2E8F0' }}>
            <div className="d-flex flex-column flex-md-row align-items-stretch align-items-md-center justify-content-between gap-3 mb-3 pb-3 border-bottom">
              <div>
                <h5 className="fw-bold brand-font text-sa-charcoal m-0" style={{ fontSize: '16px' }}>
                  Faculty Monthly Working Hours & Salary Calculation Register
                </h5>
                <span className="small text-sa-muted">
                  Official breakdown for <strong>{monthlyData?.month_label || selectedMonth}</strong>. Faculty compensation is computed from verified duty hours.
                </span>
              </div>

              {/* Search & Filter */}
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <div style={{ maxWidth: '280px', width: '100%' }}>
                  <SearchBar
                    value={monthlySearch}
                    onChange={setMonthlySearch}
                    placeholder="Search by faculty name or ID..."
                  />
                </div>

                <div className="d-flex align-items-center gap-1 bg-light p-1 rounded-pill border">
                  {[
                    { key: 'All', label: 'All Faculty' },
                    { key: 'Active', label: 'Worked Hours' },
                    { key: 'Zero', label: 'Zero Hours' }
                  ].map((pill) => (
                    <button
                      key={pill.key}
                      type="button"
                      onClick={() => setMonthlyFilter(pill.key)}
                      className={`btn btn-sm rounded-pill px-2.5 py-1 fw-medium transition-all ${
                        monthlyFilter === pill.key
                          ? 'btn-dark text-white'
                          : 'btn-light text-sa-charcoal border-0 bg-transparent'
                      }`}
                      style={{ fontSize: '11.5px' }}
                    >
                      {pill.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Monthly Hours & Salary Table */}
            <div className="table-responsive">
              <table className="table align-middle table-hover mb-0">
                <thead style={{ backgroundColor: '#F8FAFC' }}>
                  <tr style={{ fontSize: '12px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    <th scope="col" className="py-3 px-3">Faculty Member</th>
                    <th scope="col" className="py-3 px-3 text-center">Duty Days in Month</th>
                    <th scope="col" className="py-3 px-3">Monthly Working Hours</th>
                    <th scope="col" className="py-3 px-3">Hourly Rate (₹/hr)</th>
                    <th scope="col" className="py-3 px-3">Calculated Monthly Salary</th>
                    <th scope="col" className="py-3 px-3">Payroll Status</th>
                    <th scope="col" className="py-3 px-3 text-end">Actions</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: '13px' }}>
                  {loadingMonthly ? (
                    <tr>
                      <td colSpan="7" className="text-center py-5 text-sa-muted">
                        <div className="spinner-border spinner-border-sm text-primary me-2" role="status" />
                        Calculating monthly hours and salary compensation for faculty…
                      </td>
                    </tr>
                  ) : filteredMonthlyFaculty.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-5 text-sa-muted">
                        <div className="d-flex flex-column align-items-center justify-content-center gap-2">
                          <Users size={36} className="opacity-50" />
                          <div className="fw-semibold text-sa-charcoal">No faculty records match the selected filter</div>
                          <p className="text-sa-muted small m-0">Try clearing your search query or selecting a different month.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredMonthlyFaculty.map((f) => {
                      const hasHours = f.total_minutes > 0;
                      return (
                        <tr key={f.teacher_id} style={{ verticalAlign: 'middle' }}>
                          {/* Faculty Member */}
                          <td className="px-3 py-3">
                            <div className="d-flex align-items-center gap-2.5">
                              <div
                                className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
                                style={{
                                  width: '40px',
                                  height: '40px',
                                  backgroundColor: '#8B1216',
                                  fontSize: '13.5px'
                                }}
                              >
                                {(f.teacher_name || 'T')
                                  .split(' ')
                                  .map((n) => n[0])
                                  .slice(0, 2)
                                  .join('')
                                  .toUpperCase()}
                              </div>
                              <div>
                                <div className="fw-bold text-sa-charcoal" style={{ fontSize: '14px' }}>
                                  {f.teacher_name}
                                </div>
                                <div className="d-flex align-items-center gap-1.5 mt-0.5">
                                  <span className="badge bg-light text-sa-muted border" style={{ fontSize: '10.5px' }}>
                                    {f.employee_id}
                                  </span>
                                  {f.subjects && f.subjects.length > 0 && (
                                    <span className="badge" style={{ backgroundColor: '#FEF3C7', color: '#92400E', fontSize: '10.5px' }}>
                                      {f.subjects[0]}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Duty Days */}
                          <td className="px-3 py-3 text-center">
                            <span
                              className={`badge px-2.5 py-1 fw-semibold ${
                                f.days_worked > 0
                                  ? 'bg-light text-dark border'
                                  : 'bg-light text-muted border'
                              }`}
                              style={{ fontSize: '12px' }}
                            >
                              {f.days_worked} {f.days_worked === 1 ? 'Day' : 'Days'}
                            </span>
                          </td>

                          {/* Monthly Working Hours */}
                          <td className="px-3 py-3">
                            <div className="d-flex flex-column">
                              <span
                                className={`fw-extrabold ${hasHours ? 'text-sa-charcoal' : 'text-sa-muted'}`}
                                style={{ fontSize: '14.5px' }}
                              >
                                {f.total_hours_formatted}
                              </span>
                              <span className="text-sa-muted" style={{ fontSize: '11px' }}>
                                {f.total_hours} decimal hours
                              </span>
                            </div>
                          </td>

                          {/* Hourly Rate */}
                          <td className="px-3 py-3">
                            <div className="d-inline-flex align-items-center gap-1.5">
                              <span className="fw-bold text-sa-charcoal">
                                ₹{Number(f.hourly_rate).toFixed(2)}
                              </span>
                              <span className="text-sa-muted small">/ hr</span>
                              <button
                                type="button"
                                onClick={() => handleOpenRateModal(f)}
                                className="btn btn-sm btn-link p-0 text-muted ms-1"
                                title="Edit hourly rate"
                              >
                                <Edit2 size={12} />
                              </button>
                            </div>
                          </td>

                          {/* Calculated Monthly Salary */}
                          <td className="px-3 py-3">
                            <div className="d-flex flex-column">
                              <span
                                className="fw-extrabold"
                                style={{
                                  fontSize: '15.5px',
                                  color: f.calculated_salary > 0 ? '#168554' : '#64748B'
                                }}
                              >
                                ₹{Number(f.calculated_salary).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </span>
                              <span className="text-sa-muted" style={{ fontSize: '10.5px' }}>
                                {f.total_hours}h × ₹{f.hourly_rate}
                              </span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-3 py-3">
                            {f.salary_status === 'Disbursed' ? (
                              <span
                                className="badge px-2.5 py-1 fw-semibold"
                                style={{ backgroundColor: '#EAF6EF', color: '#168554', border: '1px solid #B7E4C7', borderRadius: '12px' }}
                              >
                                Disbursed
                              </span>
                            ) : f.salary_status === 'Payroll Draft Ready' ? (
                              <span
                                className="badge px-2.5 py-1 fw-semibold"
                                style={{ backgroundColor: '#EFF6FF', color: '#1E40AF', border: '1px solid #BFDBFE', borderRadius: '12px' }}
                              >
                                Draft Ready
                              </span>
                            ) : (
                              <span
                                className="badge bg-light text-dark border px-2.5 py-1 fw-semibold"
                                style={{ borderRadius: '12px', fontSize: '11px' }}
                              >
                                Calculated (Hourly)
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-3 py-3 text-end">
                            <div className="d-inline-flex align-items-center gap-1.5 justify-content-end">
                              {/* View Timesheet */}
                              <button
                                type="button"
                                onClick={() => navigate(`/admin/teachers/${f.teacher_id}/working-time`)}
                                className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1 px-2.5 py-1"
                                style={{ fontSize: '11.5px', borderRadius: '6px' }}
                                title="View detailed timesheet for this teacher"
                              >
                                <Clock size={13} />
                                <span>Timesheet</span>
                              </button>

                              {/* Edit Hourly Rate */}
                              <button
                                type="button"
                                onClick={() => handleOpenRateModal(f)}
                                className="btn btn-sm btn-light border p-1 text-secondary"
                                style={{ borderRadius: '6px' }}
                                title="Adjust Hourly Rate"
                              >
                                <Edit2 size={13} />
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
        </>
      )}

      {/* ===================================================================== */}
      {/* 5. MODAL: LOG MANUAL TEACHER PUNCH / ATTENDANCE                       */}
      {/* ===================================================================== */}
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
                  {t.name || t.full_name} ({t.employee_id || t.subject || 'Faculty'})
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
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

          {/* Status */}
          <div>
            <label className="form-label small fw-semibold text-sa-charcoal mb-1">
              Attendance Status <span className="text-danger">*</span>
            </label>
            <select
              className="form-select form-select-sm"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              required
            >
              <option value="Present">Present (Completed)</option>
              <option value="Working">Working (Currently In Campus)</option>
              <option value="Absent">Absent</option>
              <option value="On Leave">On Leave</option>
            </select>
          </div>

          {/* Check-In and Check-Out Times */}
          <div className="row g-2">
            <div className="col-6">
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
            <div className="col-6">
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

          {/* Calculated Duration Preview */}
          {modalCalculatedDuration && (
            <div className="p-2.5 rounded-3 bg-light border d-flex align-items-center justify-content-between">
              <span className="small text-sa-muted fw-semibold">Calculated Duration:</span>
              <span className="badge bg-primary-subtle text-primary border border-primary-subtle fw-bold">
                {modalCalculatedDuration}
              </span>
            </div>
          )}

          {/* Remarks */}
          <div>
            <label className="form-label small fw-semibold text-sa-charcoal mb-1">
              Remarks / Classroom / Task
            </label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              placeholder="e.g. Physics lecture conducted in Hall 101"
            />
          </div>

          <div className="d-flex align-items-center justify-content-end gap-2 mt-2 pt-2 border-top">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={formSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={formSubmitting}
            >
              {formSubmitting ? 'Saving...' : modalMode === 'create' ? 'Save Punch Entry' : 'Update Record'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ===================================================================== */}
      {/* 6. MODAL: EDIT FACULTY HOURLY RATE                                   */}
      {/* ===================================================================== */}
      <Modal
        isOpen={isRateModalOpen}
        onClose={() => {
          if (!rateSubmitting) setIsRateModalOpen(false);
        }}
        title={`Adjust Hourly Rate • ${rateEditTeacher.name}`}
      >
        <form onSubmit={handleSaveRate} className="d-flex flex-column gap-3">
          <p className="text-sa-muted small m-0">
            Faculty compensation is calculated based on total logged hours multiplied by this hourly rate.
          </p>

          <div>
            <label className="form-label small fw-semibold text-sa-charcoal mb-1">
              Hourly Compensation Rate (₹ / Hour) <span className="text-danger">*</span>
            </label>
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light text-sa-muted fw-bold">₹</span>
              <input
                type="number"
                step="0.5"
                min="0"
                className="form-control"
                value={rateEditTeacher.hourly_rate}
                onChange={(e) => setRateEditTeacher({ ...rateEditTeacher, hourly_rate: e.target.value })}
                required
              />
              <span className="input-group-text bg-light text-sa-muted">per hour</span>
            </div>
          </div>

          <div className="p-3 rounded-3 bg-light border small text-sa-muted">
            <div className="d-flex justify-content-between mb-1">
              <span>Standard Full-Month Basis (160 Hours):</span>
              <strong className="text-sa-charcoal">
                ₹{(Number(rateEditTeacher.hourly_rate || 0) * 160).toLocaleString('en-IN')}
              </strong>
            </div>
            <div className="d-flex justify-content-between">
              <span>Hourly Rate Applied:</span>
              <strong className="text-success">
                ₹{Number(rateEditTeacher.hourly_rate || 0).toFixed(2)} / hr
              </strong>
            </div>
          </div>

          <div className="d-flex align-items-center justify-content-end gap-2 mt-2 pt-2 border-top">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRateModalOpen(false)}
              disabled={rateSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={rateSubmitting}
            >
              {rateSubmitting ? 'Updating...' : 'Save Hourly Rate'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
