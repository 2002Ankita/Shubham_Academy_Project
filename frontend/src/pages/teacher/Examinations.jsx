import React, { useState, useEffect, useMemo, useContext } from 'react';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import examService from '../../services/examService';
import marksService from '../../services/marksService';
import batchService from '../../services/batchService';
import studentService from '../../services/studentService';
import AuthContext from '../../context/AuthContext';
import { getUserBranch, filterExamsByBranch } from '../../utils/branchUtils';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  BookCheck,
  FileSpreadsheet,
  ArrowLeft,
  Search,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  ChevronDown,
  NotebookPen,
  Plus,
  Eye,
  Edit2,
  Trash2,
  Ban,
  RotateCcw,
  MoreVertical
} from 'lucide-react';

export default function TeacherExaminations() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const userBranch = getUserBranch(user);
  const isSuperAdmin = (user?.role || '').toLowerCase().includes('super');

  const [exams, setExams] = useState([]);
  const [marks, setMarks] = useState([]);
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active 3-dots action menu row ID
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState(isSuperAdmin ? 'All Branches' : (userBranch || 'All Branches'));
  const [classFilter, setClassFilter] = useState('All Classes');
  const [subjectFilter, setSubjectFilter] = useState('All Subjects');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ title: '', message: '', onConfirm: null, confirmText: 'Confirm', confirmVariant: 'danger' });
  const [editingExam, setEditingExam] = useState(null);
  const [viewingExam, setViewingExam] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Create / Edit Form State
  const initialForm = {
    exam_name: '',
    exam_type: 'Regular',
    branch: userBranch || 'Mangalvar Peth',
    standard: '',
    section: '',
    subject: '',
    exam_date: new Date().toISOString().split('T')[0],
    start_time: '10:00',
    end_time: '12:00',
    duration: '2 Hours',
    room_no: 'Room 101',
    max_marks: 100
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [eData, mData, bData, sData] = await Promise.all([
        examService.getAll().catch(() => []),
        marksService.getAll().catch(() => []),
        batchService.getBatches().catch(() => []),
        studentService.getAll().catch(() => [])
      ]);
      setExams(eData || []);
      setMarks(mData || []);
      setBatches(bData || []);
      setStudents(sData || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Close 3-dots actions menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.exam-actions-menu')) {
        setActiveMenuId(null);
      }
    };
    if (activeMenuId) {
      document.addEventListener('click', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [activeMenuId]);

  const normalizedStatus = (value) => String(value || '').trim().toLowerCase();

  // Dynamic Status Calculator
  const computeStatus = (exam) => {
    const rawStatus = (exam.status || '').trim();
    if (['cancelled', 'canceled'].includes(rawStatus.toLowerCase())) {
      return 'Cancelled';
    }
    const dateStr = exam.date || exam.examDate;
    if (!dateStr || dateStr === 'N/A') return rawStatus || 'Scheduled';

    const startTimeStr = exam.startTimeInput || '10:00';
    const endTimeStr = exam.endTimeInput || '12:00';

    const [year, month, day] = dateStr.split('-').map(Number);
    const [startH, startM] = startTimeStr.split(':').map(Number);
    const [endH, endM] = endTimeStr.split(':').map(Number);

    const startDt = new Date(year, month - 1, day, startH || 0, startM || 0, 0);
    const endDt = new Date(year, month - 1, day, endH || 0, endM || 0, 0);
    const now = new Date();

    if (isNaN(startDt.getTime()) || isNaN(endDt.getTime())) {
      return rawStatus || 'Scheduled';
    }

    if (now > endDt) {
      return 'Completed';
    }
    if (now >= startDt && now <= endDt) {
      return 'Ongoing';
    }
    return 'Scheduled';
  };

  // Summary counts computed from real data
  const totalExams = exams.length;
  const upcomingCount = exams.filter(exam => {
    const st = computeStatus(exam);
    return st === 'Scheduled' || st === 'Upcoming';
  }).length;

  const completedCount = exams.filter(exam => {
    const st = computeStatus(exam);
    return st === 'Completed';
  }).length;

  // Real Marks Pending calculation
  const marksPendingCount = exams.filter(exam => {
    const st = computeStatus(exam);
    const isCompleted = st === 'Completed' || ['completed', 'finished', 'done'].includes(normalizedStatus(exam.status));
    const hasMarks = marks.some(m => String(m.examId || m.exam_id) === String(exam.id));
    return isCompleted && !hasMarks;
  }).length;

  // Dynamic Filter Options
  const classOptions = useMemo(() => {
    const values = new Set();
    exams.forEach(exam => {
      if (exam.standard) values.add(exam.standard);
      if (exam.examStandard) values.add(exam.examStandard);
    });
    batches.forEach(b => b.standard && values.add(b.standard));
    return ['All Classes', ...Array.from(values)];
  }, [exams, batches]);

  const subjectOptions = useMemo(() => {
    const values = new Set();
    exams.forEach(exam => exam.subject && values.add(exam.subject));
    batches.forEach(b => b.subject && values.add(b.subject));
    return ['All Subjects', ...Array.from(values)];
  }, [exams, batches]);

  const statusOptions = ['All Status', 'Scheduled', 'Upcoming', 'Ongoing', 'Completed', 'Cancelled'];

  // Dynamic Class/Section/Subject for Create/Edit Modal
  const availableClasses = useMemo(() => {
    const set = new Set();
    batches.forEach(b => b.standard && set.add(b.standard));
    students.forEach(s => s.standard && set.add(s.standard));
    exams.forEach(e => e.standard && set.add(e.standard));
    if (set.size === 0) {
      set.add('12th Science');
      set.add('11th Science');
    }
    return Array.from(set);
  }, [batches, students, exams]);

  const availableSections = useMemo(() => {
    const targetClass = formData.standard || availableClasses[0];
    const set = new Set();
    batches.filter(b => b.standard === targetClass).forEach(b => b.name && set.add(b.name));
    students.filter(s => s.standard === targetClass).forEach(s => s.batch && set.add(s.batch));
    if (set.size === 0) {
      return ['Morning', 'Evening', 'Section A', 'Section B', 'General'];
    }
    return Array.from(set);
  }, [formData.standard, availableClasses, batches, students]);

  const availableSubjects = useMemo(() => {
    const targetClass = formData.standard || availableClasses[0];
    const set = new Set();
    batches.filter(b => !targetClass || b.standard === targetClass).forEach(b => b.subject && set.add(b.subject));
    exams.filter(e => !targetClass || e.standard === targetClass).forEach(e => e.subject && set.add(e.subject));
    if (set.size === 0) {
      return ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'General'];
    }
    return Array.from(set);
  }, [formData.standard, availableClasses, batches, exams]);

  // Duration auto-calculation
  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return '';
    const [sH, sM] = startTime.split(':').map(Number);
    const [eH, eM] = endTime.split(':').map(Number);
    const diffMinutes = (eH * 60 + eM) - (sH * 60 + sM);
    if (diffMinutes <= 0) return '';
    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    if (mins === 0) return `${hours} ${hours === 1 ? 'Hour' : 'Hours'}`;
    if (hours === 0) return `${mins} Mins`;
    return `${hours}h ${mins}m`;
  };

  // Handle Form changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'start_time' || name === 'end_time') {
        const sTime = name === 'start_time' ? value : prev.start_time;
        const eTime = name === 'end_time' ? value : prev.end_time;
        const dur = calculateDuration(sTime, eTime);
        if (dur) updated.duration = dur;
      }
      return updated;
    });
  };

  // Room conflict validation
  const checkRoomConflict = (room, date, start, end, excludeId = null) => {
    if (!room || !date || !start || !end) return null;
    const roomClean = room.trim().toLowerCase();

    for (const ex of exams) {
      if (excludeId && String(ex.id) === String(excludeId)) continue;
      if (String(ex.status || '').toLowerCase() === 'cancelled') continue;

      const exRoom = String(ex.roomNo || ex.room_no || '').trim().toLowerCase();
      if (exRoom !== roomClean) continue;

      const exDate = ex.date || ex.examDate;
      if (exDate !== date) continue;

      const exStart = ex.startTimeInput || '10:00';
      const exEnd = ex.endTimeInput || '12:00';

      if (start < exEnd && end > exStart) {
        return `${room.trim()} is already booked during this time.`;
      }
    }
    return null;
  };

  // Open Create Exam Modal
  const openCreateModal = () => {
    const defaultClass = availableClasses[0] || '12th Science';
    const defaultSec = availableSections[0] || 'Morning';
    const defaultSub = availableSubjects[0] || 'Physics';

    setEditingExam(null);
    setFormData({
      exam_name: '',
      exam_type: 'Regular',
      branch: branchFilter !== 'All Branches' ? branchFilter : 'Mangalvar Peth',
      standard: defaultClass,
      section: defaultSec,
      subject: defaultSub,
      exam_date: new Date().toISOString().split('T')[0],
      start_time: '10:00',
      end_time: '12:00',
      duration: '2 Hours',
      room_no: 'Room 101',
      max_marks: 100
    });
    setShowCreateModal(true);
  };

  // Open Edit Exam Modal
  const handleEdit = (exam) => {
    setEditingExam(exam);
    setFormData({
      exam_name: exam.title || exam.exam_name || '',
      exam_type: exam.examType || exam.exam_type || 'Regular',
      branch: exam.branch || (exam.title?.toLowerCase().includes('tarabai') ? 'Tarabai Park' : 'Mangalvar Peth'),
      standard: exam.examStandard || exam.standard || availableClasses[0] || '',
      section: exam.section || '',
      subject: exam.subject || availableSubjects[0] || '',
      exam_date: exam.date && exam.date !== 'N/A' ? exam.date : new Date().toISOString().split('T')[0],
      start_time: exam.startTimeInput || '10:00',
      end_time: exam.endTimeInput || '12:00',
      duration: exam.duration || '2 Hours',
      room_no: exam.roomNo || exam.room_no || 'Room 101',
      max_marks: exam.maxMarks ?? exam.max_marks ?? 100
    });
    setShowCreateModal(true);
  };

  // Open View Exam Modal
  const handleView = (exam) => {
    setViewingExam(exam);
    setShowViewModal(true);
  };

  // Save (Create or Update)
  const handleSaveExam = async (e) => {
    e.preventDefault();

    if (!formData.exam_name || !formData.standard || !formData.subject || !formData.exam_date || !formData.start_time || !formData.end_time) {
      toast.error('Please fill in all required fields.');
      return;
    }

    if (formData.start_time >= formData.end_time) {
      toast.error('End time must be later than start time.');
      return;
    }

    const conflict = checkRoomConflict(formData.room_no, formData.exam_date, formData.start_time, formData.end_time, editingExam?.id);
    if (conflict) {
      toast.error(conflict);
      return;
    }

    setFormLoading(true);
    try {
      if (editingExam) {
        await examService.update(editingExam.id, {
          title: formData.exam_name,
          examName: formData.exam_name,
          exam_name: formData.exam_name,
          examType: formData.exam_type,
          exam_type: formData.exam_type,
          branch: formData.branch || 'Mangalvar Peth',
          standard: formData.standard,
          section: formData.section,
          batch: formData.section || 'General',
          subject: formData.subject,
          date: formData.exam_date,
          startTime: formData.start_time,
          endTime: formData.end_time,
          duration: formData.duration || calculateDuration(formData.start_time, formData.end_time),
          roomNo: formData.room_no,
          maxMarks: Number(formData.max_marks)
        });
        toast.success('Exam updated successfully.');
      } else {
        await examService.create({
          title: formData.exam_name,
          examName: formData.exam_name,
          exam_name: formData.exam_name,
          examType: formData.exam_type,
          exam_type: formData.exam_type,
          branch: formData.branch || 'Mangalvar Peth',
          standard: formData.standard,
          section: formData.section,
          batch: formData.section || 'General',
          subject: formData.subject,
          date: formData.exam_date,
          startTime: formData.start_time,
          endTime: formData.end_time,
          duration: formData.duration || calculateDuration(formData.start_time, formData.end_time),
          roomNo: formData.room_no,
          maxMarks: Number(formData.max_marks),
          teacher_id: user?.id || ''
        });
        toast.success('Exam created successfully.');
      }
      setShowCreateModal(false);
      fetchData();
    } catch (err) {
      const detail = err.response?.data?.detail;
      toast.error(detail || (editingExam ? 'Failed to update exam.' : 'Failed to create exam.'));
    } finally {
      setFormLoading(false);
    }
  };

  // Delete Exam Action with confirmation
  const handleDeleteExam = (exam) => {
    setConfirmConfig({
      title: 'Delete Examination',
      message: `Are you sure you want to delete this exam "${exam.title || exam.exam_name}"? This action cannot be undone.`,
      confirmText: 'Delete Exam',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          await examService.delete(exam.id);
          toast.success('Exam deleted successfully.');
          fetchData();
        } catch (err) {
          toast.error(err.response?.data?.detail || 'Failed to delete exam.');
        } finally {
          setShowConfirmModal(false);
        }
      }
    });
    setShowConfirmModal(true);
  };

  // Cancel Exam Action with confirmation
  const handleCancelExam = (exam) => {
    setConfirmConfig({
      title: 'Cancel Examination',
      message: `Are you sure you want to cancel the exam "${exam.title || exam.exam_name}"?`,
      confirmText: 'Cancel Exam',
      confirmVariant: 'warning',
      onConfirm: async () => {
        try {
          await examService.update(exam.id, { status: 'Cancelled' });
          toast.success('Exam cancelled successfully.');
          fetchData();
        } catch (err) {
          toast.error(err.response?.data?.detail || 'Failed to cancel exam.');
        } finally {
          setShowConfirmModal(false);
        }
      }
    });
    setShowConfirmModal(true);
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setBranchFilter('All Branches');
    setClassFilter('All Classes');
    setSubjectFilter('All Subjects');
    setStatusFilter('All Status');
    setFromDate('');
    setToDate('');
  };

  // Filtered examinations list
  const filteredExams = useMemo(() => {
    const branchScoped = filterExamsByBranch(exams, branchFilter);
    const term = searchTerm.trim().toLowerCase();
    return branchScoped.filter(exam => {
      if (term) {
        const matchName = (exam.title || exam.exam_name || '').toLowerCase().includes(term);
        const matchClass = (exam.standard || exam.examStandard || exam.classBatch || '').toLowerCase().includes(term);
        const matchSubject = (exam.subject || '').toLowerCase().includes(term);
        if (!matchName && !matchClass && !matchSubject) return false;
      }

      if (classFilter !== 'All Classes') {
        const matchesClass =
          exam.standard === classFilter ||
          exam.examStandard === classFilter ||
          exam.batch === classFilter ||
          exam.classBatch === classFilter;
        if (!matchesClass) return false;
      }

      if (subjectFilter !== 'All Subjects') {
        if ((exam.subject || '').toLowerCase() !== subjectFilter.toLowerCase()) return false;
      }

      if (statusFilter !== 'All Status') {
        const effStatus = computeStatus(exam);
        if (normalizedStatus(effStatus) !== normalizedStatus(statusFilter) &&
            normalizedStatus(exam.status) !== normalizedStatus(statusFilter)) {
          return false;
        }
      }

      const examDateStr = exam.date || exam.examDate;
      if (fromDate && examDateStr && examDateStr !== 'N/A' && examDateStr < fromDate) return false;
      if (toDate && examDateStr && examDateStr !== 'N/A' && examDateStr > toDate) return false;

      return true;
    });
  }, [exams, branchFilter, searchTerm, classFilter, subjectFilter, statusFilter, fromDate, toDate]);

  const summaryCards = [
    { label: 'Total Exams', value: totalExams, supporting: 'Assigned to you', icon: NotebookPen, bg: '#EEF3FF', color: '#3B82F6' },
    { label: 'Upcoming', value: upcomingCount, supporting: 'Scheduled ahead', icon: CalendarDays, bg: '#EAF6EF', color: '#168554' },
    { label: 'Completed', value: completedCount, supporting: 'Finished', icon: CheckCircle2, bg: '#EAF6EF', color: '#168554' },
    { label: 'Marks Pending', value: marksPendingCount, supporting: 'Yet to be entered', icon: ClipboardList, bg: '#FDF0F0', color: '#A91D22' }
  ];

  const getStatusBadgeStyle = (status) => {
    const normalized = normalizedStatus(status);
    if (['scheduled', 'upcoming'].includes(normalized)) {
      return { backgroundColor: '#E0F2FE', color: '#0284C7', border: '1px solid #BAE6FD' };
    }
    if (['ongoing', 'in progress', 'in-progress'].includes(normalized)) {
      return { backgroundColor: '#FEF3C7', color: '#B45309', border: '1px solid #FCD34D' };
    }
    if (['completed', 'finished', 'done'].includes(normalized)) {
      return { backgroundColor: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' };
    }
    if (['cancelled', 'canceled'].includes(normalized)) {
      return { backgroundColor: '#FEE2E2', color: '#B91C1C', border: '1px solid #FCA5A5' };
    }
    return { backgroundColor: '#E0F2FE', color: '#0284C7', border: '1px solid #BAE6FD' };
  };

  return (
    <div className="d-flex flex-column w-100" style={{ gap: '18px', minWidth: 0, boxSizing: 'border-box' }}>
      {/* Top Header */}
      <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-3 pt-0 pb-0.5">
        <div className="d-flex align-items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/teacher/dashboard')}
            className="btn btn-light d-inline-flex align-items-center justify-content-center border shadow-sm"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              borderColor: '#E2E8F0',
              backgroundColor: '#FFFFFF',
              color: '#0F172A',
              padding: 0,
              cursor: 'pointer'
            }}
            aria-label="Back to dashboard"
            title="Back to dashboard"
          >
            <ArrowLeft size={18} />
          </button>

          <div>
            <h1 className="brand-font fw-bold m-0" style={{ fontSize: '23px', lineHeight: 1.25, color: '#0F172A' }}>
              Assigned Examinations
            </h1>
            <p className="m-0 mt-0.5" style={{ fontSize: '13.5px', color: '#64748B' }}>
              Track examination invigilation, timetable, and enter marks
            </p>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2.5">
          <button
            type="button"
            onClick={openCreateModal}
            className="btn d-inline-flex align-items-center justify-content-center gap-2 text-white border-0 fw-semibold shadow-xs"
            style={{
              backgroundColor: '#8B1216',
              fontSize: '13.5px',
              height: '40px',
              padding: '0 18px',
              borderRadius: '10px',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              lineHeight: 1
            }}
            onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(0.92)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)'; }}
          >
            <Plus size={16} strokeWidth={2.4} />
            <span>Create Exam</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/teacher/marks')}
            className="btn d-inline-flex align-items-center justify-content-center gap-2 border fw-semibold shadow-xs"
            style={{
              borderColor: '#E2E8F0',
              backgroundColor: '#FFFFFF',
              color: '#0F172A',
              fontSize: '13.5px',
              height: '40px',
              padding: '0 18px',
              borderRadius: '10px',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              lineHeight: 1
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F8FAFC'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; }}
          >
            <FileSpreadsheet size={16} />
            <span>Enter Assessment Marks</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="row g-3 align-items-stretch" style={{ margin: 0 }}>
        {summaryCards.map(({ label, value, supporting, icon: Icon, bg, color }) => (
          <div key={label} className="col-12 col-sm-6 col-xl-3" style={{ minWidth: 0 }}>
            <div
              className="h-100 bg-white border"
              style={{
                borderRadius: '16px',
                borderColor: '#E6EAF0',
                boxShadow: '0 3px 10px rgba(15, 23, 42, 0.04)',
                padding: '16px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                minHeight: '110px'
              }}
            >
              <div
                className="d-flex align-items-center justify-content-center rounded-circle"
                style={{
                  width: '42px',
                  height: '42px',
                  backgroundColor: bg,
                  color,
                  flexShrink: 0
                }}
              >
                <Icon size={18} strokeWidth={2.2} />
              </div>

              <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#5B6475' }}>{label}</div>
                <div style={{ fontSize: '36px', lineHeight: 1.1, fontWeight: 700, color: '#111827', marginTop: '6px' }}>{value}</div>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>{supporting}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Exam Schedule Table Card */}
      <div className="sa-card bg-white border rounded-4" style={{ borderColor: '#E1E6ED', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)' }}>
        <div className="d-flex flex-column flex-md-row align-items-center justify-content-between gap-3 p-3 px-4 border-bottom" style={{ borderColor: '#E2E8F0' }}>
          <div className="d-flex align-items-center gap-2">
            <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: '32px', height: '32px', backgroundColor: '#FDF0F0', color: '#8B1216' }}>
              <BookCheck size={16} />
            </div>
            <h2 className="brand-font fw-bold m-0" style={{ fontSize: '19px', color: '#0F172A' }}>Exam Schedule</h2>
          </div>
        </div>

        <div className="p-3 px-4">
          {/* Filters Bar */}
          <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
            {/* Search */}
            <div className="position-relative flex-grow-1" style={{ minWidth: '220px' }}>
              <Search size={16} className="position-absolute text-sa-muted" style={{ left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search examinations, classes, subjects..."
                className="form-control"
                style={{ paddingLeft: '38px', borderColor: '#D9E1EA', borderRadius: '10px', height: '42px' }}
              />
            </div>

            {/* Date Range: From Date */}
            <div className="d-flex align-items-center gap-1.5" style={{ minWidth: '150px' }}>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                title="From Date"
                className="form-control"
                style={{ borderColor: '#D9E1EA', borderRadius: '10px', height: '42px', fontSize: '13px' }}
              />
            </div>

            {/* Date Range: To Date */}
            <div className="d-flex align-items-center gap-1.5" style={{ minWidth: '150px' }}>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                title="To Date"
                className="form-control"
                style={{ borderColor: '#D9E1EA', borderRadius: '10px', height: '42px', fontSize: '13px' }}
              />
            </div>

            {/* Branch Filter - Dropdown for SuperAdmin, Badge for teacher/regular user */}
            {isSuperAdmin ? (
              <div className="position-relative" style={{ minWidth: '160px' }}>
                <select
                  value={branchFilter}
                  onChange={(e) => setBranchFilter(e.target.value)}
                  className="form-select"
                  style={{ borderColor: '#D9E1EA', borderRadius: '10px', height: '42px', appearance: 'none', paddingRight: '38px', fontSize: '13.5px' }}
                  aria-label="Filter by Branch"
                >
                  <option value="All Branches">All Branches</option>
                  <option value="Mangalvar Peth">Manglavar Peth</option>
                  <option value="Tarabai Park">Tarabai Park</option>
                </select>
                <ChevronDown size={16} className="position-absolute text-sa-muted" style={{ right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              </div>
            ) : (
              <div
                className="d-inline-flex align-items-center gap-1.5 px-3 py-1.5 rounded-pill shadow-xs"
                style={{
                  backgroundColor: (userBranch || 'Mangalvar Peth').toLowerCase().includes('mangal') ? '#FDF0F0' : '#EFF6FF',
                  border: (userBranch || 'Mangalvar Peth').toLowerCase().includes('mangal') ? '1px solid #FECACA' : '1px solid #BFDBFE',
                  color: (userBranch || 'Mangalvar Peth').toLowerCase().includes('mangal') ? '#8B1216' : '#1D4ED8',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  height: '42px'
                }}
              >
                <span>{userBranch || 'Mangalvar Peth'}</span>
              </div>
            )}

            {/* Class Filter */}
            <div className="position-relative" style={{ minWidth: '160px' }}>
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="form-select"
                style={{ borderColor: '#D9E1EA', borderRadius: '10px', height: '42px', appearance: 'none', paddingRight: '38px', fontSize: '13.5px' }}
              >
                {classOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <ChevronDown size={16} className="position-absolute text-sa-muted" style={{ right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            </div>

            {/* Subject Filter */}
            <div className="position-relative" style={{ minWidth: '150px' }}>
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="form-select"
                style={{ borderColor: '#D9E1EA', borderRadius: '10px', height: '42px', appearance: 'none', paddingRight: '38px', fontSize: '13.5px' }}
              >
                {subjectOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <ChevronDown size={16} className="position-absolute text-sa-muted" style={{ right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            </div>

            {/* Status Filter */}
            <div className="position-relative" style={{ minWidth: '140px' }}>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="form-select"
                style={{ borderColor: '#D9E1EA', borderRadius: '10px', height: '42px', appearance: 'none', paddingRight: '38px', fontSize: '13.5px' }}
              >
                {statusOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <ChevronDown size={16} className="position-absolute text-sa-muted" style={{ right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            </div>

            {/* Reset Filters */}
            <button
              type="button"
              onClick={handleResetFilters}
              className="btn btn-light border d-inline-flex align-items-center gap-1.5"
              style={{ height: '42px', borderRadius: '10px', borderColor: '#D9E1EA', fontSize: '13px', color: '#475569' }}
              title="Reset all filters"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          </div>

          {/* Table */}
          <div className="table-responsive">
            <Table
              columns={[
                {
                  key: 'title',
                  title: 'Examination',
                  render: (val, row) => (
                    <div>
                      <span className="fw-bold text-sa-charcoal">{val || row.exam_name || 'N/A'}</span>
                      <div className="mt-1">
                        <span
                          className="badge rounded-pill fw-medium"
                          style={{
                            backgroundColor: '#F1F5F9',
                            color: '#475569',
                            border: '1px solid #E2E8F0',
                            fontSize: '11px',
                            padding: '2px 8px'
                          }}
                        >
                          {row.examType || row.exam_type || 'Regular'}
                        </span>
                      </div>
                    </div>
                  )
                },
                {
                  key: 'standard',
                  title: 'Class & Batch',
                  render: (_, row) => (
                    <div>
                      <div className="fw-medium text-sa-charcoal">{row.examStandard || row.standard || 'General'}</div>
                      {(row.section || row.batch) && (
                        <div className="text-sa-muted" style={{ fontSize: '12px' }}>
                          Sec: {row.section || row.batch}
                        </div>
                      )}
                    </div>
                  )
                },
                {
                  key: 'branch',
                  title: 'Branch',
                  render: (_, row) => {
                    const br = row.branch || (row.title?.toLowerCase().includes('tarabai') ? 'Tarabai Park' : 'Manglavar Peth');
                    const isTarabai = br.toLowerCase().includes('tarabai');
                    return (
                      <span
                        className="badge rounded-pill fw-semibold"
                        style={{
                          backgroundColor: isTarabai ? '#EFF6FF' : '#FEF2F2',
                          color: isTarabai ? '#1D4ED8' : '#8B1216',
                          border: `1px solid ${isTarabai ? '#BFDBFE' : '#FECACA'}`,
                          fontSize: '11px',
                          padding: '3px 8px'
                        }}
                      >
                        {br}
                      </span>
                    );
                  }
                },
                {
                  key: 'subject',
                  title: 'Subject',
                  render: (val) => <span className="text-sa-charcoal">{val || 'N/A'}</span>
                },
                {
                  key: 'date',
                  title: 'Date & Time',
                  render: (_, row) => (
                    <div>
                      <div className="text-sa-charcoal fw-medium">{row.date || 'N/A'}</div>
                      <div className="text-sa-muted" style={{ fontSize: '12px' }}>
                        {row.startTime}{row.endTime ? ` – ${row.endTime}` : ''}
                      </div>
                    </div>
                  )
                },
                {
                  key: 'duration',
                  title: 'Duration',
                  render: (val) => <span className="text-sa-charcoal">{val || '2 Hours'}</span>
                },
                {
                  key: 'roomNo',
                  title: 'Room',
                  render: (val, row) => <span className="text-sa-charcoal">{val || row.room_no || 'Room 101'}</span>
                },
                {
                  key: 'maxMarks',
                  title: 'Max Marks',
                  render: (val, row) => <span className="text-sa-charcoal">{val ?? row.totalMarks ?? row.max_marks ?? 100}</span>
                },
                {
                  key: 'status',
                  title: 'Status',
                  render: (_, row) => {
                    const st = computeStatus(row);
                    return (
                      <span className="badge rounded-pill fw-medium" style={getStatusBadgeStyle(st)}>
                        {st}
                      </span>
                    );
                  }
                },
                {
                  key: 'id',
                  title: 'Actions',
                  align: 'end',
                  render: (_, row, rowIndex) => {
                    const isNearBottom = rowIndex >= Math.max(filteredExams.length - 2, 0) && filteredExams.length > 2;
                    return (
                      <div className="d-flex align-items-center justify-content-end gap-2" style={{ whiteSpace: 'nowrap' }}>
                        <button
                          type="button"
                          className="btn btn-sm d-inline-flex align-items-center justify-content-center fw-medium shadow-2xs"
                          style={{
                            backgroundColor: '#FFF5F5',
                            color: '#8B1216',
                            border: '1px solid #FCA5A5',
                            height: '32px',
                            fontSize: '12.5px',
                            padding: '0 12px',
                            borderRadius: '8px',
                            lineHeight: 1,
                            transition: 'all 0.15s ease'
                          }}
                          onClick={() => navigate('/teacher/marks', { state: { examId: row.id, examTitle: row.title || row.exam_name } })}
                          title="Enter Assessment Marks"
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#8B1216'; e.currentTarget.style.color = '#FFFFFF'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFF5F5'; e.currentTarget.style.color = '#8B1216'; }}
                        >
                          Enter Marks
                        </button>

                        <span style={{ width: '1px', height: '18px', backgroundColor: '#E2E8F0', margin: '0 2px' }} />

                        <button
                          type="button"
                          className="btn btn-sm d-inline-flex align-items-center justify-content-center p-0"
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            backgroundColor: '#F8FAFC',
                            border: '1px solid #E2E8F0',
                            color: '#475569',
                            transition: 'all 0.15s ease'
                          }}
                          onClick={() => handleView(row)}
                          title="View Exam Details"
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#E2E8F0'; e.currentTarget.style.color = '#0F172A'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#F8FAFC'; e.currentTarget.style.color = '#475569'; }}
                        >
                          <Eye size={15} />
                        </button>

                        <button
                          type="button"
                          className="btn btn-sm d-inline-flex align-items-center justify-content-center p-0"
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            backgroundColor: '#EFF6FF',
                            border: '1px solid #BFDBFE',
                            color: '#2563EB',
                            transition: 'all 0.15s ease'
                          }}
                          onClick={() => handleEdit(row)}
                          title="Edit Exam"
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#2563EB'; e.currentTarget.style.color = '#FFFFFF'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#EFF6FF'; e.currentTarget.style.color = '#2563EB'; }}
                        >
                          <Edit2 size={14} />
                        </button>

                        {/* 3-dots Menu for Cancel and Delete */}
                        <div className="position-relative exam-actions-menu">
                          <button
                            type="button"
                            className="btn btn-sm d-inline-flex align-items-center justify-content-center p-0"
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              backgroundColor: activeMenuId === row.id ? '#E2E8F0' : '#F8FAFC',
                              border: '1px solid #E2E8F0',
                              color: '#475569',
                              transition: 'all 0.15s ease'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(activeMenuId === row.id ? null : row.id);
                            }}
                            title="More Actions"
                            onMouseEnter={(e) => { if (activeMenuId !== row.id) e.currentTarget.style.backgroundColor = '#EEF2F6'; }}
                            onMouseLeave={(e) => { if (activeMenuId !== row.id) e.currentTarget.style.backgroundColor = '#F8FAFC'; }}
                          >
                            <MoreVertical size={15} />
                          </button>

                          {activeMenuId === row.id && (
                            <div
                              className="position-absolute rounded-3 py-1 bg-white border"
                              style={{
                                right: 0,
                                ...(isNearBottom ? { bottom: '36px' } : { top: '36px' }),
                                minWidth: '155px',
                                zIndex: 1050,
                                borderColor: '#E2E8F0',
                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08)'
                              }}
                            >
                              <button
                                type="button"
                                className="dropdown-item d-flex align-items-center gap-2 px-3 py-2 w-100 border-0 bg-transparent text-start"
                                style={{ fontSize: '13px', color: '#D97706', cursor: 'pointer' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuId(null);
                                  handleCancelExam(row);
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FEF3C7'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                              >
                                <Ban size={14} />
                                <span>Cancel Exam</span>
                              </button>

                              <button
                                type="button"
                                className="dropdown-item d-flex align-items-center gap-2 px-3 py-2 w-100 border-0 bg-transparent text-start"
                                style={{ fontSize: '13px', color: '#DC2626', cursor: 'pointer' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuId(null);
                                  handleDeleteExam(row);
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FEE2E2'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                              >
                                <Trash2 size={14} />
                                <span>Delete Exam</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                }
              ]}
              data={filteredExams}
              loading={loading}
            />
          </div>
        </div>
      </div>

      {/* Create / Edit Exam Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={editingExam ? 'Edit Examination' : 'Schedule New Examination'}
        size="lg"
      >
        <form onSubmit={handleSaveExam} className="d-flex flex-column gap-3">
          <div className="row g-3">
            {/* 1. Examination Name */}
            <div className="col-12 col-md-8">
              <Input
                label="Examination Name"
                name="exam_name"
                value={formData.exam_name}
                onChange={handleFormChange}
                placeholder="e.g. Mid-Term Examination 2026"
                required
              />
            </div>

            {/* 2. Exam Type */}
            <div className="col-12 col-md-4">
              <Select
                label="Exam Type"
                name="exam_type"
                value={formData.exam_type}
                onChange={handleFormChange}
                options={['Regular', 'Unit Test', 'Practical']}
                required
              />
            </div>

            {/* Branch Selection */}
            <div className="col-12 col-md-4">
              <Select
                label="Branch / Campus"
                name="branch"
                value={formData.branch}
                onChange={handleFormChange}
                options={['Mangalvar Peth', 'Tarabai Park']}
                disabled={!isSuperAdmin}
                required
              />
            </div>

            {/* 3. Class */}
            <div className="col-12 col-md-4">
              <Select
                label="Class"
                name="standard"
                value={formData.standard}
                onChange={handleFormChange}
                options={availableClasses}
                required
              />
            </div>

            {/* 4. Section */}
            <div className="col-12 col-md-4">
              <Select
                label="Section"
                name="section"
                value={formData.section}
                onChange={handleFormChange}
                options={availableSections}
              />
            </div>

            {/* 5. Subject */}
            <div className="col-12 col-md-4">
              <Select
                label="Subject"
                name="subject"
                value={formData.subject}
                onChange={handleFormChange}
                options={availableSubjects}
                required
              />
            </div>

            {/* 6. Exam Date */}
            <div className="col-12 col-md-4">
              <Input
                label="Exam Date"
                name="exam_date"
                type="date"
                value={formData.exam_date}
                onChange={handleFormChange}
                required
              />
            </div>

            {/* 7. Start Time */}
            <div className="col-12 col-md-4">
              <Input
                label="Start Time"
                name="start_time"
                type="time"
                value={formData.start_time}
                onChange={handleFormChange}
                required
              />
            </div>

            {/* 8. End Time */}
            <div className="col-12 col-md-4">
              <Input
                label="End Time"
                name="end_time"
                type="time"
                value={formData.end_time}
                onChange={handleFormChange}
                required
              />
            </div>

            {/* 9. Duration (Calculated) */}
            <div className="col-12 col-md-4">
              <Input
                label="Duration"
                name="duration"
                value={formData.duration}
                onChange={handleFormChange}
                placeholder="e.g. 2 Hours"
                helperText="Auto-calculated from Start & End Time"
              />
            </div>

            {/* 10. Room / Examination Hall */}
            <div className="col-12 col-md-4">
              <Input
                label="Room / Exam Hall"
                name="room_no"
                value={formData.room_no}
                onChange={handleFormChange}
                placeholder="e.g. Room 101"
                required
              />
            </div>

            {/* 11. Maximum Marks */}
            <div className="col-12 col-md-4">
              <Input
                label="Maximum Marks"
                name="max_marks"
                type="number"
                min="1"
                value={formData.max_marks}
                onChange={handleFormChange}
                placeholder="100"
                required
              />
            </div>
          </div>

          <div className="d-flex align-items-center justify-content-end gap-2 mt-4 pt-3 border-top">
            <Button variant="light" type="button" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={formLoading}>
              {editingExam ? 'Save Changes' : 'Schedule Exam'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Exam Read-Only Modal */}
      {viewingExam && (
        <Modal
          isOpen={showViewModal}
          onClose={() => setShowViewModal(false)}
          title="Examination Details"
          size="md"
        >
          <div className="d-flex flex-column gap-3">
            <div className="d-flex align-items-center justify-content-between p-3 rounded-3" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
              <div>
                <h5 className="fw-bold m-0 text-sa-charcoal">{viewingExam.title || viewingExam.exam_name}</h5>
                <span className="small text-muted">{viewingExam.examType || viewingExam.exam_type || 'Regular'}</span>
              </div>
              <div>
                <span className="badge rounded-pill fw-medium" style={getStatusBadgeStyle(computeStatus(viewingExam))}>
                  {computeStatus(viewingExam)}
                </span>
              </div>
            </div>

            <div className="row g-2.5 pt-1" style={{ fontSize: '13.5px' }}>
              <div className="col-6">
                <span className="text-muted d-block small">Branch</span>
                <span className="fw-semibold text-sa-charcoal">{viewingExam.branch || (viewingExam.title?.toLowerCase().includes('tarabai') ? 'Tarabai Park' : 'Mangalvar Peth')}</span>
              </div>
              <div className="col-6">
                <span className="text-muted d-block small">Class</span>
                <span className="fw-semibold text-sa-charcoal">{viewingExam.examStandard || viewingExam.standard || 'General'}</span>
              </div>
              <div className="col-6">
                <span className="text-muted d-block small">Section</span>
                <span className="fw-semibold text-sa-charcoal">{viewingExam.section || viewingExam.batch || 'General'}</span>
              </div>
              <div className="col-6">
                <span className="text-muted d-block small">Subject</span>
                <span className="fw-semibold text-sa-charcoal">{viewingExam.subject || 'N/A'}</span>
              </div>
              <div className="col-6">
                <span className="text-muted d-block small">Maximum Marks</span>
                <span className="fw-semibold text-sa-charcoal">{viewingExam.maxMarks ?? viewingExam.max_marks ?? 100} Marks</span>
              </div>
              <div className="col-6">
                <span className="text-muted d-block small">Exam Date</span>
                <span className="fw-semibold text-sa-charcoal">{viewingExam.date || viewingExam.examDate || 'N/A'}</span>
              </div>
              <div className="col-6">
                <span className="text-muted d-block small">Timings</span>
                <span className="fw-semibold text-sa-charcoal">{viewingExam.startTime}{viewingExam.endTime ? ` – ${viewingExam.endTime}` : ''}</span>
              </div>
              <div className="col-6">
                <span className="text-muted d-block small">Duration</span>
                <span className="fw-semibold text-sa-charcoal">{viewingExam.duration || '2 Hours'}</span>
              </div>
              <div className="col-6">
                <span className="text-muted d-block small">Room / Exam Hall</span>
                <span className="fw-semibold text-sa-charcoal">{viewingExam.roomNo || viewingExam.room_no || 'Room 101'}</span>
              </div>
            </div>

            <div className="d-flex align-items-center justify-content-end gap-2 mt-3 pt-3 border-top">
              <Button variant="light" onClick={() => setShowViewModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirmation Modal for Delete and Cancel */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title={confirmConfig.title}
        size="sm"
      >
        <div className="d-flex flex-column gap-3">
          <p className="m-0 text-sa-charcoal" style={{ fontSize: '14px', lineHeight: 1.5 }}>
            {confirmConfig.message}
          </p>

          <div className="d-flex align-items-center justify-content-end gap-2 pt-2 border-top">
            <Button variant="light" onClick={() => setShowConfirmModal(false)}>
              Cancel
            </Button>
            <Button
              variant={confirmConfig.confirmVariant || 'danger'}
              onClick={confirmConfig.onConfirm}
            >
              {confirmConfig.confirmText}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
