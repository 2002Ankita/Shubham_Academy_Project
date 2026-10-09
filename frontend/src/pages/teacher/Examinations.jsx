import React, { useState, useEffect, useMemo } from 'react';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import examService from '../../services/examService';
import { useNavigate } from 'react-router-dom';
import { BookCheck, FileSpreadsheet, ArrowLeft, Search, CalendarDays, CheckCircle2, ClipboardList, ChevronDown, NotebookPen } from 'lucide-react';

export default function TeacherExaminations() {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('All Classes');
  const [statusFilter, setStatusFilter] = useState('All Status');

  useEffect(() => {
    const fetchExams = async () => {
      setLoading(true);
      try {
        const data = await examService.getAll();
        setExams(data);
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, []);

  const normalizedStatus = (value) => String(value || '').trim().toLowerCase();

  const totalExams = exams.length;
  const upcomingCount = exams.filter(exam => {
    const status = normalizedStatus(exam.status);
    if (['scheduled', 'upcoming', 'pending'].includes(status)) return true;
    if (['completed', 'finished', 'done'].includes(status)) return false;
    const examDate = exam.date ? new Date(exam.date) : null;
    return examDate ? examDate >= new Date(new Date().setHours(0, 0, 0, 0)) : false;
  }).length;

  const completedCount = exams.filter(exam => ['completed', 'finished', 'done'].includes(normalizedStatus(exam.status))).length;

  const marksPendingCount = exams.filter(exam => {
    const status = normalizedStatus(exam.status);
    return !['completed', 'finished', 'done'].includes(status);
  }).length;

  const classOptions = useMemo(() => {
    const values = exams.map(exam => exam.standard || exam.examStandard || exam.class || 'General');
    return ['All Classes', ...Array.from(new Set(values.filter(Boolean)))];
  }, [exams]);

  const statusOptions = useMemo(() => {
    const values = exams.map(exam => exam.status || 'Scheduled');
    return ['All Status', ...Array.from(new Set(values))];
  }, [exams]);

  const filteredExams = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return exams.filter(exam => {
      const matchesSearch = !term || [
        exam.title,
        exam.standard,
        exam.subject,
        exam.date,
        exam.startTime,
        exam.roomNo,
        exam.status
      ].filter(Boolean).join(' ').toLowerCase().includes(term);

      const matchesClass = classFilter === 'All Classes' || exam.standard === classFilter;
      const matchesStatus = statusFilter === 'All Status' || exam.status === statusFilter;

      return matchesSearch && matchesClass && matchesStatus;
    });
  }, [exams, searchTerm, classFilter, statusFilter]);

  const summaryCards = [
    { label: 'Total Exams', value: totalExams, supporting: 'Assigned to you', icon: NotebookPen, bg: '#EEF3FF', color: '#3B82F6' },
    { label: 'Upcoming', value: upcomingCount, supporting: 'This week', icon: CalendarDays, bg: '#EAF6EF', color: '#168554' },
    { label: 'Completed', value: completedCount, supporting: 'Finished', icon: CheckCircle2, bg: '#EAF6EF', color: '#168554' },
    { label: 'Marks Pending', value: marksPendingCount, supporting: 'Yet to be entered', icon: ClipboardList, bg: '#FDF0F0', color: '#A91D22' }
  ];

  const getStatusBadgeStyle = (status) => {
    const normalized = normalizedStatus(status);
    if (['scheduled', 'upcoming'].includes(normalized)) {
      return { backgroundColor: '#E0F2FE', color: '#0284C7', border: '1px solid #BAE6FD' };
    }
    if (['completed', 'finished', 'done'].includes(normalized)) {
      return { backgroundColor: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' };
    }
    if (['pending', 'in progress', 'in-progress'].includes(normalized)) {
      return { backgroundColor: '#FEF3C7', color: '#B45309', border: '1px solid #FCD34D' };
    }
    if (['cancelled', 'canceled'].includes(normalized)) {
      return { backgroundColor: '#FEE2E2', color: '#B91C1C', border: '1px solid #FCA5A5' };
    }
    return { backgroundColor: '#E0F2FE', color: '#0284C7', border: '1px solid #BAE6FD' };
  };

  return (
    <div className="d-flex flex-column w-100" style={{ gap: '18px', minWidth: 0, boxSizing: 'border-box' }}>
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

        <button
          type="button"
          onClick={() => navigate('/teacher/marks')}
          className="btn d-inline-flex align-items-center gap-1.5 text-white border-0 fw-semibold shadow-xs"
          style={{
            backgroundColor: '#8B1216',
            fontSize: '13px',
            padding: '8px 16px',
            borderRadius: '8px',
            whiteSpace: 'nowrap',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(0.92)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)'; }}
        >
          <FileSpreadsheet size={16} />
          <span>Enter Assessment Marks</span>
        </button>
      </div>

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
          <div className="d-flex flex-column flex-md-row align-items-center gap-3 mb-3">
            <div className="position-relative flex-grow-1" style={{ minWidth: 0 }}>
              <Search size={16} className="position-absolute text-sa-muted" style={{ left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search examinations..."
                className="form-control"
                style={{ paddingLeft: '38px', borderColor: '#D9E1EA', borderRadius: '10px', height: '42px' }}
              />
            </div>

            <div className="position-relative" style={{ minWidth: '180px' }}>
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="form-select"
                style={{ borderColor: '#D9E1EA', borderRadius: '10px', height: '42px', appearance: 'none', paddingRight: '38px' }}
              >
                {classOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <ChevronDown size={16} className="position-absolute text-sa-muted" style={{ right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            </div>

            <div className="position-relative" style={{ minWidth: '160px' }}>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="form-select"
                style={{ borderColor: '#D9E1EA', borderRadius: '10px', height: '42px', appearance: 'none', paddingRight: '38px' }}
              >
                {statusOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <ChevronDown size={16} className="position-absolute text-sa-muted" style={{ right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            </div>
          </div>

          <div className="table-responsive">
            <Table
              columns={[
                { key: 'title', title: 'Examination', render: (val, row) => <span className="fw-bold text-sa-charcoal">{val || row.exam_name || 'N/A'}</span> },
                { key: 'standard', title: 'Class' },
                { key: 'subject', title: 'Subject' },
                { key: 'date', title: 'Date' },
                { key: 'startTime', title: 'Timing', render: (val, row) => `${val || 'N/A'}${row.duration ? ` (${row.duration})` : ''}` },
                { key: 'roomNo', title: 'Room' },
                { key: 'maxMarks', title: 'Max Marks', render: (val, row) => val ?? row.totalMarks ?? row.max_marks ?? 'N/A' },
                {
                  key: 'status',
                  title: 'Status',
                  render: (val) => (
                    <span className="badge rounded-pill fw-medium" style={getStatusBadgeStyle(val)}>
                      {val || 'Scheduled'}
                    </span>
                  )
                },
                {
                  key: 'id',
                  title: 'Action',
                  align: 'end',
                  render: (_, row) => (
                    <Button size="sm" variant="outline" onClick={() => navigate('/teacher/marks', { state: { examId: row.id, examTitle: row.title || row.exam_name } })}>
                      Enter Marks
                    </Button>
                  )
                }
              ]}
              data={filteredExams}
              loading={loading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
