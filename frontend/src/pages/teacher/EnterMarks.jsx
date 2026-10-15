import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MarksForm from '../../components/forms/MarksForm';
import BulkMarksForm from '../../components/forms/BulkMarksForm';
import marksService from '../../services/marksService';
import studentService from '../../services/studentService';
import examService from '../../services/examService';
import batchService from '../../services/batchService';
import SendMarksModal from '../../components/modals/SendMarksModal';
import {
  ArrowLeft,
  BookText,
  Users,
  CheckCheck,
  Clock3,
  Search,
  Download,
  Send,
  CheckCircle2,
  X,
  Edit3,
  Eye,
  History,
  ChevronLeft,
  ChevronRight,
  MessageCircle
} from 'lucide-react';
import { toast } from 'react-toastify';

export default function EnterMarks() {
  const navigate = useNavigate();
  const [marks, setMarks] = useState([]);
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchStudent, setSearchStudent] = useState('');
  const [editingMark, setEditingMark] = useState(null);
  const [viewingMark, setViewingMark] = useState(null);

  // Selection filters
  const [batchFilter, setBatchFilter] = useState('All Batches');
  const [subjectFilter, setSubjectFilter] = useState('All Subjects');
  const [examFilter, setExamFilter] = useState('All Examinations');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Modal & post-save direct prompt
  const [sendMarksModalOpen, setSendMarksModalOpen] = useState(false);
  const [postSaveNotice, setPostSaveNotice] = useState(null);

  const marksTableRef = useRef(null);
  const formRef = useRef(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mList, sList, eList, bList] = await Promise.all([
        marksService.getAll(),
        studentService.getAll(),
        examService.getAll(),
        batchService.getBatches().catch(() => [])
      ]);
      setMarks(mList || []);
      setStudents(sList || []);
      setExams(eList || []);
      setBatches(bList || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Connected to real database data
  const totalExaminations = exams.length;
  const totalStudents = students.length;
  const marksEntered = marks.length;
  const pending = Math.max(totalStudents - marksEntered, 0);

  // Filter options
  const batchOptions = useMemo(() => {
    const list = new Set();
    batches.forEach(b => b.name && list.add(b.name));
    students.forEach(s => s.batch && list.add(s.batch));
    return ['All Batches', ...Array.from(list)];
  }, [batches, students]);

  const subjectOptions = useMemo(() => {
    const list = new Set();
    exams.forEach(e => e.subject && list.add(e.subject));
    batches.forEach(b => b.subject && list.add(b.subject));
    marks.forEach(m => m.subject && list.add(m.subject));
    if (list.size === 0) {
      ['Mathematics', 'Physics', 'Chemistry', 'Biology'].forEach(s => list.add(s));
    }
    return ['All Subjects', ...Array.from(list)];
  }, [exams, batches, marks]);

  const examOptions = useMemo(() => {
    const list = exams.map(e => e.title || e.exam_name || e.id);
    if (list.length === 0) {
      list.push('Midterm Examination 2026');
    }
    return ['All Examinations', ...list];
  }, [exams]);

  const filteredMarks = useMemo(() => {
    const term = searchStudent.trim().toLowerCase();
    return marks.filter((mark) => {
      // Search term filter
      if (term) {
        const fields = [
          mark.studentName,
          mark.rollNumber,
          mark.examTitle,
          mark.examName,
          mark.subject,
          mark.grade,
          mark.remarks
        ].filter(Boolean).join(' ').toLowerCase();
        if (!fields.includes(term)) return false;
      }

      // Exam filter
      if (examFilter !== 'All Examinations') {
        const examName = mark.examTitle || mark.examName || mark.exam_name || '';
        if (examName !== examFilter && mark.examId !== examFilter) return false;
      }

      // Subject filter
      if (subjectFilter !== 'All Subjects') {
        if ((mark.subject || '').toLowerCase() !== subjectFilter.toLowerCase()) return false;
      }

      // Batch filter
      if (batchFilter !== 'All Batches') {
        const student = students.find(s => s.id === mark.studentId);
        const stuBatch = student?.batch || student?.standard || mark.standard || '';
        if (!stuBatch.toLowerCase().includes(batchFilter.toLowerCase())) return false;
      }

      return true;
    });
  }, [marks, searchStudent, examFilter, subjectFilter, batchFilter, students]);

  // Paginated marks
  const totalRecords = filteredMarks.length;
  const totalPages = Math.ceil(totalRecords / pageSize) || 1;
  const paginatedMarks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredMarks.slice(start, start + pageSize);
  }, [filteredMarks, currentPage, pageSize]);

  // EXACT EXISTING SUMMARY CARDS PRESERVED
  const summaryCards = [
    { label: 'Total Examinations', value: totalExaminations, supporting: 'Assigned to you', icon: BookText, bg: '#EEF3FF', color: '#3B82F6' },
    { label: 'Total Students', value: totalStudents, supporting: 'In this session', icon: Users, bg: '#EAF6EF', color: '#168554' },
    { label: 'Marks Entered', value: marksEntered, supporting: 'Submitted', icon: CheckCheck, bg: '#EEF7E8', color: '#0F766E' },
    { label: 'Pending', value: pending, supporting: 'Yet to update', icon: Clock3, bg: '#FDF0F0', color: '#A91D22' }
  ];

  const handleMarksSubmit = async (formData) => {
    try {
      await marksService.submitMarks(formData);
      if (formData.status === 'Draft') {
        toast.success(`Draft marks saved successfully for ${formData.studentName || 'student'}!`);
        // Draft marks must remain unpublished and must not trigger the "Send Marks to Parents" prompt
        setPostSaveNotice(null);
      } else {
        toast.success(`Marks saved successfully!`);
        const foundExam = exams.find(e => e.id === formData.examId);
        setPostSaveNotice({
          exam: foundExam || { id: formData.examId, title: formData.examTitle },
          count: 1
        });
      }
      setEditingMark(null);
      await fetchData();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to save marks. Please check the inputs.';
      toast.error(msg);
      throw err;
    }
  };

  const handleBulkMarksSubmit = async (examId, entries) => {
    try {
      await marksService.submitBulkMarks(examId, entries, 'Published');
      toast.success(`Marks saved successfully for ${entries.length} student${entries.length === 1 ? '' : 's'}!`);
      const foundExam = exams.find(e => e.id === examId);
      setPostSaveNotice({
        exam: foundExam || { id: examId },
        count: entries.length
      });
      await fetchData();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to save bulk marks.';
      toast.error(msg);
      throw err;
    }
  };

  const handleViewPastRecords = () => {
    marksTableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    toast.info('Showing recent marks records.');
  };

  // Determine which exam to use when opening Send Marks Modal
  const currentActiveExam = useMemo(() => {
    if (examFilter !== 'All Examinations') {
      const found = exams.find(e => (e.title || e.exam_name || e.id) === examFilter);
      if (found) return found;
    }
    if (postSaveNotice?.exam) {
      return postSaveNotice.exam;
    }
    return exams[0] || null;
  }, [examFilter, exams, postSaveNotice]);

  const handleExport = () => {
    const exportRows = filteredMarks.length ? filteredMarks : marks;

    if (!exportRows.length) {
      toast.info('No marks available to export yet.');
      return;
    }

    const headers = ['Roll No.', 'Student Name', 'Examination', 'Class', 'Subject', 'Max Marks', 'Obtained Marks', 'Percentage', 'Grade', 'Status', 'Faculty Remarks'];
    const csvRows = exportRows.map((row) => {
      const student = students.find((item) => item.id === row.studentId);
      const className = student?.standard || student?.class || row.standard || '';
      const pct = row.percentage || (row.obtainedMarks && row.maxMarks ? ((row.obtainedMarks / row.maxMarks) * 100).toFixed(1) : '');
      return [
        row.rollNumber || '',
        row.studentName || '',
        row.examTitle || row.examName || '',
        className,
        row.subject || '',
        row.maxMarks ?? '',
        row.obtainedMarks ?? '',
        pct ? `${pct}%` : '',
        row.grade || '',
        row.status || 'Published',
        row.remarks || ''
      ];
    });

    const csvContent = [headers, ...csvRows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'student_marks_export.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Student marks exported successfully.');
  };

  return (
    <div className="d-flex flex-column w-100" style={{ gap: '18px', minWidth: 0, boxSizing: 'border-box' }}>
      {/* Top Header matching Reference UI */}
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
              Enter Marks
            </h1>
            <p className="m-0 mt-0.5" style={{ fontSize: '13.5px', color: '#64748B' }}>
              Record and publish student results
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleViewPastRecords}
          className="btn btn-light border shadow-sm d-inline-flex align-items-center gap-2"
          style={{
            borderColor: '#E2E8F0',
            backgroundColor: '#FFFFFF',
            color: '#8B1216',
            borderRadius: '10px',
            padding: '8px 16px',
            fontWeight: 600,
            fontSize: '13px',
            whiteSpace: 'nowrap',
            cursor: 'pointer'
          }}
        >
          <History size={16} />
          <span>View Past Records</span>
        </button>
      </div>

      {/* EXACT EXISTING 4 SUMMARY CARDS PRESERVED */}
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
                className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                style={{ width: '42px', height: '42px', backgroundColor: bg, color }}
              >
                <Icon size={18} strokeWidth={2.2} />
              </div>

              <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#5B6475' }}>{label}</div>
                <div style={{ fontSize: '36px', lineHeight: 1.1, fontWeight: 700, color: '#111827', marginTop: '6px' }}>
                  {value}
                </div>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>{supporting}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Student Marks Recording Sheet */}
      <div ref={formRef}>
        <MarksForm
          students={students}
          exams={exams}
          onSubmit={handleMarksSubmit}
          loading={loading}
          editingMark={editingMark}
          onCancelEdit={() => setEditingMark(null)}
        />
      </div>

      {/* Direct Prompt Alert Banner matching Image */}
      {postSaveNotice && (
        <div
          className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 p-3 rounded-3 border shadow-xs"
          style={{ backgroundColor: '#ECFDF5', borderColor: '#A7F3D0', color: '#065F46' }}
        >
          <div className="d-flex align-items-center gap-2.5">
            <CheckCircle2 size={20} className="text-success flex-shrink-0" />
            <div>
              <div className="fw-bold" style={{ fontSize: '14px' }}>Marks saved successfully!</div>
              <div className="small" style={{ color: '#047857' }}>
                The marks have been saved. Do you want to send the marks to parents?
              </div>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-sm text-white fw-semibold d-inline-flex align-items-center gap-1.5 shadow-xs"
              style={{ backgroundColor: '#15803D', borderColor: '#15803D', borderRadius: '8px', padding: '7px 16px', fontSize: '13px' }}
              onClick={() => {
                setSendMarksModalOpen(true);
                setPostSaveNotice(null);
              }}
            >
              <MessageCircle size={15} />
              <span>Send Marks to Parents</span>
            </button>
            <button
              type="button"
              className="btn btn-sm text-muted p-1"
              onClick={() => setPostSaveNotice(null)}
              title="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Unified Student Marks Records Card matching Reference Image */}
      <div
        ref={marksTableRef}
        className="sa-card p-3 p-md-4 bg-white border"
        style={{ borderRadius: '18px', borderColor: '#E6EAF0', boxShadow: '0 3px 10px rgba(15, 23, 42, 0.04)' }}
      >
        {/* Card Header: Title on Top Row */}
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className="d-flex align-items-center gap-2.5">
            <div
              className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
              style={{ width: '36px', height: '36px', backgroundColor: '#FDF0F0', color: '#8B1216' }}
            >
              <Users size={18} />
            </div>
            <div>
              <h2 className="brand-font fw-bold m-0" style={{ fontSize: '18px', color: '#0F172A' }}>
                Student Marks Records
              </h2>
            </div>
          </div>
        </div>

        {/* Controls Toolbar: Below Title, 1 Single Line with Full Width Coverage */}
        <div className="d-flex align-items-center gap-2 mb-3 w-100 flex-nowrap" style={{ overflowX: 'auto' }}>
          {/* Batch / Class */}
          <div style={{ width: '120px', minWidth: '110px', flexShrink: 0 }}>
            <select
              className="form-select"
              value={batchFilter}
              onChange={(e) => { setBatchFilter(e.target.value); setCurrentPage(1); }}
              style={{ height: '38px', borderRadius: '8px', borderColor: '#D9E1EA', fontSize: '12.5px' }}
              aria-label="Filter by Batch or Class"
            >
              {batchOptions.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          {/* Subject */}
          <div style={{ width: '120px', minWidth: '110px', flexShrink: 0 }}>
            <select
              className="form-select"
              value={subjectFilter}
              onChange={(e) => { setSubjectFilter(e.target.value); setCurrentPage(1); }}
              style={{ height: '38px', borderRadius: '8px', borderColor: '#D9E1EA', fontSize: '12.5px' }}
              aria-label="Filter by Subject"
            >
              {subjectOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Examination */}
          <div style={{ width: '145px', minWidth: '135px', flexShrink: 0 }}>
            <select
              className="form-select"
              value={examFilter}
              onChange={(e) => { setExamFilter(e.target.value); setCurrentPage(1); }}
              style={{ height: '38px', borderRadius: '8px', borderColor: '#D9E1EA', fontSize: '12.5px' }}
              aria-label="Filter by Examination"
            >
              {examOptions.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>

          {/* Search Input (stretches to fill remaining space on the line) */}
          <div className="position-relative flex-grow-1" style={{ minWidth: '140px' }}>
            <Search size={15} className="position-absolute text-muted" style={{ left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={searchStudent}
              onChange={(e) => { setSearchStudent(e.target.value); setCurrentPage(1); }}
              placeholder="Search student name or roll no..."
              className="form-control"
              style={{ paddingLeft: '34px', borderColor: '#D9E1EA', borderRadius: '8px', height: '38px', fontSize: '12.5px' }}
            />
          </div>

          {/* Export Result Excel Button */}
          <div className="flex-shrink-0">
            <button
              type="button"
              onClick={handleExport}
              className="btn btn-export-excel border d-inline-flex align-items-center justify-content-center gap-1.5 shadow-xs"
              style={{
                borderColor: '#E2E8F0',
                backgroundColor: '#FFFFFF',
                color: '#8B1216',
                borderRadius: '8px',
                height: '38px',
                padding: '0 14px',
                fontWeight: 600,
                fontSize: '12.5px',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                transition: 'all 0.18s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#FDF0F0';
                e.currentTarget.style.borderColor = '#8B1216';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(139, 18, 22, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#FFFFFF';
                e.currentTarget.style.borderColor = '#E2E8F0';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              title="Export Result to CSV / Excel spreadsheet"
            >
              <Download size={14} />
              <span>Export Result Excel</span>
            </button>
          </div>
        </div>

        {/* Custom Styled Clean Table matching Image without column truncation */}
        <div className="table-responsive border rounded-3" style={{ borderColor: '#E2E8F0', overflowX: 'auto' }}>
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px', width: '100%', minWidth: '850px' }}>
            <thead style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              <tr>
                <th scope="col" style={{ padding: '12px 16px', color: '#475569', fontWeight: 600, fontSize: '12.5px', borderBottom: '1px solid #E2E8F0' }}>
                  Student Name
                </th>
                <th scope="col" style={{ padding: '12px 14px', color: '#475569', fontWeight: 600, fontSize: '12.5px', borderBottom: '1px solid #E2E8F0' }}>
                  Roll No.
                </th>
                <th scope="col" style={{ padding: '12px 14px', color: '#475569', fontWeight: 600, fontSize: '12.5px', borderBottom: '1px solid #E2E8F0' }}>
                  Examination
                </th>
                <th scope="col" style={{ padding: '12px 14px', color: '#475569', fontWeight: 600, fontSize: '12.5px', borderBottom: '1px solid #E2E8F0' }}>
                  Subject
                </th>
                <th scope="col" style={{ padding: '12px 14px', color: '#475569', fontWeight: 600, fontSize: '12.5px', borderBottom: '1px solid #E2E8F0' }}>
                  Obtained Marks
                </th>
                <th scope="col" style={{ padding: '12px 14px', color: '#475569', fontWeight: 600, fontSize: '12.5px', borderBottom: '1px solid #E2E8F0' }}>
                  Status
                </th>
                <th scope="col" style={{ padding: '12px 14px', color: '#475569', fontWeight: 600, fontSize: '12.5px', borderBottom: '1px solid #E2E8F0' }}>
                  Faculty Remark
                </th>
                <th scope="col" style={{ padding: '12px 16px', color: '#475569', fontWeight: 600, fontSize: '12.5px', borderBottom: '1px solid #E2E8F0', textAlign: 'left' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-5 text-muted">
                    Loading records...
                  </td>
                </tr>
              ) : paginatedMarks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-5 text-muted">
                    No marks records match your filters.
                  </td>
                </tr>
              ) : (
                paginatedMarks.map((row, idx) => {
                  const isDraft = row.status === 'Draft';
                  return (
                    <tr key={row.id || idx} style={{ transition: 'background-color 0.15s ease' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <span className="fw-semibold text-sa-charcoal">{row.studentName}</span>
                      </td>
                      <td style={{ padding: '12px 14px', color: '#334155' }}>
                        {row.rollNumber}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#334155' }}>
                        {row.examTitle || row.examName}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#334155' }}>
                        {row.subject}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span className="fw-semibold" style={{ color: '#0F172A' }}>
                          {row.obtainedMarks} / {row.maxMarks}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span
                          className="badge rounded-pill"
                          style={{
                            backgroundColor: isDraft ? '#FEF3C7' : '#DCFCE7',
                            color: isDraft ? '#B45309' : '#15803D',
                            border: `1px solid ${isDraft ? '#FCD34D' : '#86EFAC'}`,
                            fontSize: '11.5px',
                            fontWeight: 600,
                            padding: '4px 10px'
                          }}
                        >
                          {row.status || 'Published'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', color: '#475569' }}>
                        {row.remarks || '-'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'left' }}>
                        <div className="d-flex align-items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const normalizedEditRow = {
                                ...row,
                                studentId: row.studentId || row.student_id,
                                examId: row.examId || row.exam_id,
                                obtainedMarks: row.obtainedMarks !== undefined ? row.obtainedMarks : row.marks_obtained,
                                maxMarks: row.maxMarks || row.max_marks,
                                remarks: row.remarks
                              };
                              setEditingMark(normalizedEditRow);
                              formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              toast.info(`Editing mark for ${row.studentName || 'student'}`);
                            }}
                            className="btn btn-sm d-inline-flex align-items-center gap-1.5 px-2 py-1 border"
                            style={{
                              color: '#8B1216',
                              fontWeight: 600,
                              fontSize: '12.5px',
                              cursor: 'pointer',
                              backgroundColor: 'transparent',
                              borderColor: 'transparent',
                              borderRadius: '6px',
                              transition: 'all 0.18s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#FDF0F0';
                              e.currentTarget.style.borderColor = '#FCA5A5';
                              e.currentTarget.style.transform = 'translateY(-1px)';
                              e.currentTarget.style.boxShadow = '0 2px 6px rgba(139, 18, 22, 0.12)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.borderColor = 'transparent';
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                            title="Edit this record / draft"
                          >
                            <Edit3 size={14} />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setViewingMark(row)}
                            className="btn btn-sm d-inline-flex align-items-center gap-1.5 px-2 py-1 border"
                            style={{
                              color: '#8B1216',
                              fontWeight: 600,
                              fontSize: '12.5px',
                              cursor: 'pointer',
                              backgroundColor: 'transparent',
                              borderColor: 'transparent',
                              borderRadius: '6px',
                              transition: 'all 0.18s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#FDF0F0';
                              e.currentTarget.style.borderColor = '#FCA5A5';
                              e.currentTarget.style.transform = 'translateY(-1px)';
                              e.currentTarget.style.boxShadow = '0 2px 6px rgba(139, 18, 22, 0.12)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.borderColor = 'transparent';
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                            title="View mark details"
                          >
                            <Eye size={14} />
                            <span>View</span>
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

        {/* Pagination Footer matching Image */}
        <div className="d-flex flex-column flex-sm-row align-items-center justify-content-between gap-3 mt-3 pt-2">
          <span className="small text-muted" style={{ fontSize: '12.5px' }}>
            Showing {totalRecords > 0 ? (currentPage - 1) * pageSize + 1 : 0} - {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} students
          </span>

          <div className="d-flex align-items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className="btn btn-sm btn-light border d-flex align-items-center justify-content-center"
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '6px',
                padding: 0,
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
              }}
              aria-label="Previous page"
            >
              <ChevronLeft size={14} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className="btn btn-sm d-flex align-items-center justify-content-center"
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '6px',
                  padding: 0,
                  fontWeight: 600,
                  fontSize: '12px',
                  backgroundColor: currentPage === page ? '#8B1216' : '#FFFFFF',
                  color: currentPage === page ? '#FFFFFF' : '#475569',
                  border: `1px solid ${currentPage === page ? '#8B1216' : '#E2E8F0'}`,
                  cursor: 'pointer'
                }}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className="btn btn-sm btn-light border d-flex align-items-center justify-content-center"
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '6px',
                padding: 0,
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
              }}
              aria-label="Next page"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Marks Entry Card matching Image */}
      <BulkMarksForm
        students={students}
        exams={exams}
        existingMarks={marks}
        onSubmit={handleBulkMarksSubmit}
        loading={loading}
      />

      {/* Send Marks to Parents Modal */}
      <SendMarksModal
        isOpen={sendMarksModalOpen}
        onClose={() => setSendMarksModalOpen(false)}
        exam={currentActiveExam}
        batch={batchFilter !== 'All Batches' ? batchFilter : ''}
        subject={subjectFilter !== 'All Subjects' ? subjectFilter : ''}
        batchOptions={batchOptions}
        subjectOptions={subjectOptions}
        students={students}
        marks={marks}
      />

      {/* Read-only View Mark Details Modal */}
      {viewingMark && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(2px)', zIndex: 1050 }}
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '480px' }}>
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '18px' }}>
              <div className="modal-header border-bottom pb-3" style={{ borderColor: '#E2E8F0' }}>
                <div className="d-flex align-items-center gap-2">
                  <div
                    className="d-flex align-items-center justify-content-center rounded-circle"
                    style={{ width: '32px', height: '32px', backgroundColor: '#FDF0F0', color: '#8B1216' }}
                  >
                    <BookText size={16} />
                  </div>
                  <h5 className="modal-title brand-font fw-bold m-0" style={{ fontSize: '17px', color: '#0F172A' }}>
                    Student Mark Details
                  </h5>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setViewingMark(null)}
                  aria-label="Close"
                />
              </div>

              <div className="modal-body p-4">
                <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                  <div>
                    <div className="fw-bold" style={{ fontSize: '16px', color: '#0F172A' }}>
                      {viewingMark.studentName}
                    </div>
                    <div className="small text-muted">Roll No: {viewingMark.rollNumber}</div>
                  </div>
                  <span
                    className="badge rounded-pill"
                    style={{
                      backgroundColor: viewingMark.status === 'Draft' ? '#FEF3C7' : '#DCFCE7',
                      color: viewingMark.status === 'Draft' ? '#B45309' : '#15803D',
                      border: `1px solid ${viewingMark.status === 'Draft' ? '#FCD34D' : '#86EFAC'}`,
                      fontSize: '12px',
                      padding: '5px 12px'
                    }}
                  >
                    {viewingMark.status || 'Published'}
                  </span>
                </div>

                <div className="row g-2.5 mb-3" style={{ fontSize: '13px' }}>
                  <div className="col-6">
                    <span className="text-muted d-block small">Examination</span>
                    <span className="fw-semibold text-sa-charcoal">{viewingMark.examTitle || viewingMark.examName}</span>
                  </div>
                  <div className="col-6">
                    <span className="text-muted d-block small">Subject</span>
                    <span className="fw-semibold text-sa-charcoal">{viewingMark.subject}</span>
                  </div>
                  <div className="col-6">
                    <span className="text-muted d-block small">Marks Obtained</span>
                    <span className="fw-bold" style={{ color: '#8B1216', fontSize: '15px' }}>
                      {viewingMark.obtainedMarks} / {viewingMark.maxMarks}
                    </span>
                  </div>
                  <div className="col-6">
                    <span className="text-muted d-block small">Percentage & Grade</span>
                    <span className="fw-bold text-success">
                      {viewingMark.percentage ? `${viewingMark.percentage}%` : `${Math.round((viewingMark.obtainedMarks / viewingMark.maxMarks) * 100)}%`} ({viewingMark.grade || 'A'})
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-2 bg-light border" style={{ borderColor: '#E2E8F0' }}>
                  <span className="small text-muted d-block mb-1 fw-medium">Faculty Remarks</span>
                  <p className="m-0 text-sa-charcoal" style={{ fontSize: '13px' }}>
                    {viewingMark.remarks || 'No remarks recorded.'}
                  </p>
                </div>
              </div>

              <div className="modal-footer border-top pt-2" style={{ borderColor: '#E2E8F0' }}>
                <button
                  type="button"
                  className="btn btn-light border"
                  onClick={() => setViewingMark(null)}
                  style={{ borderRadius: '8px', fontSize: '13px', fontWeight: 600, padding: '7px 18px' }}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn text-white"
                  style={{ backgroundColor: '#8B1216', borderRadius: '8px', fontSize: '13px', fontWeight: 600, padding: '7px 18px' }}
                  onClick={() => {
                    const markToEdit = viewingMark;
                    setViewingMark(null);
                    setEditingMark(markToEdit);
                    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                >
                  <Edit3 size={13} className="me-1" />
                  Edit This Mark
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
