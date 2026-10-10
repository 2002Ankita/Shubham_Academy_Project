import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MarksForm from '../../components/forms/MarksForm';
import BulkMarksForm from '../../components/forms/BulkMarksForm';
import Table from '../../components/common/Table';
import marksService from '../../services/marksService';
import studentService from '../../services/studentService';
import examService from '../../services/examService';
import batchService from '../../services/batchService';
import SendMarksModal from '../../components/modals/SendMarksModal';
import { ArrowLeft, BookText, Users, CheckCheck, Clock3, Search, Download, Send, CheckCircle2, X } from 'lucide-react';
import { toast } from 'react-toastify';

export default function EnterMarks() {
  const navigate = useNavigate();
  const [marks, setMarks] = useState([]);
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchStudent, setSearchStudent] = useState('');
  
  // Selection filters
  const [batchFilter, setBatchFilter] = useState('All Batches');
  const [subjectFilter, setSubjectFilter] = useState('All Subjects');
  const [examFilter, setExamFilter] = useState('All Examinations');
  
  // Modal & post-save direct prompt
  const [sendMarksModalOpen, setSendMarksModalOpen] = useState(false);
  const [postSaveNotice, setPostSaveNotice] = useState(null);

  const marksTableRef = useRef(null);

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
    return ['All Subjects', ...Array.from(list)];
  }, [exams, batches, marks]);

  const examOptions = useMemo(() => {
    return ['All Examinations', ...exams.map(e => e.title || e.exam_name || e.id)];
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

  const summaryCards = [
    { label: 'Total Examinations', value: totalExaminations, supporting: 'Assigned to you', icon: BookText, bg: '#EEF3FF', color: '#3B82F6' },
    { label: 'Total Students', value: totalStudents, supporting: 'In this session', icon: Users, bg: '#EAF6EF', color: '#168554' },
    { label: 'Marks Entered', value: marksEntered, supporting: 'Submitted', icon: CheckCheck, bg: '#EEF7E8', color: '#0F766E' },
    { label: 'Pending', value: pending, supporting: 'Yet to update', icon: Clock3, bg: '#FDF0F0', color: '#A91D22' }
  ];

  const handleMarksSubmit = async (formData) => {
    await marksService.submitMarks(formData);
    toast.success(`Marks published for ${formData.studentName}!`);
    const foundExam = exams.find(e => e.id === formData.examId);
    setPostSaveNotice({
      exam: foundExam || { id: formData.examId, title: formData.examTitle },
      count: 1
    });
    fetchData();
  };

  const handleBulkMarksSubmit = async (examId, entries) => {
    await marksService.submitBulkMarks(examId, entries);
    toast.success(`Marks saved for ${entries.length} student${entries.length === 1 ? '' : 's'}.`);
    const foundExam = exams.find(e => e.id === examId);
    setPostSaveNotice({
      exam: foundExam || { id: examId },
      count: entries.length
    });
    await fetchData();
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

  const handleOpenSendMarks = () => {
    if (!currentActiveExam) {
      toast.warning('Please select an examination before sending marks.');
      return;
    }
    setSendMarksModalOpen(true);
  };

  const handleExport = () => {
    const exportRows = filteredMarks.length ? filteredMarks : marks;

    if (!exportRows.length) {
      toast.info('No marks available to export yet.');
      return;
    }

    const headers = ['Roll No.', 'Student Name', 'Examination', 'Class', 'Subject', 'Max Marks', 'Obtained Marks', 'Status'];
    const csvRows = exportRows.map((row) => {
      const student = students.find((item) => item.id === row.studentId);
      const className = student?.standard || student?.class || row.standard || '';
      return [
        row.rollNumber || '',
        row.studentName || '',
        row.examTitle || row.examName || '',
        className,
        row.subject || '',
        row.maxMarks ?? '',
        row.obtainedMarks ?? '',
        row.status || 'Published'
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
              Enter student marks for examinations
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
            color: '#0F172A',
            borderRadius: '10px',
            padding: '8px 14px',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            cursor: 'pointer'
          }}
        >
          <span>View Past Records</span>
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
                style={{ width: '42px', height: '42px', backgroundColor: bg, color, flexShrink: 0 }}
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

      <MarksForm students={students} exams={exams} onSubmit={handleMarksSubmit} />

      {postSaveNotice && (
        <div
          className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 p-3 rounded-3 border"
          style={{ backgroundColor: '#ECFDF5', borderColor: '#A7F3D0', color: '#065F46' }}
        >
          <div className="d-flex align-items-center gap-2.5">
            <CheckCircle2 size={20} className="text-success flex-shrink-0" />
            <div>
              <div className="fw-bold" style={{ fontSize: '14px' }}>Marks saved successfully!</div>
              <div className="small" style={{ color: '#047857' }}>
                You can now directly send marks to parents via WhatsApp or SMS.
              </div>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-sm text-white fw-semibold d-inline-flex align-items-center gap-1.5 shadow-xs"
              style={{ backgroundColor: '#059669', borderRadius: '8px', padding: '7px 16px', fontSize: '13px' }}
              onClick={() => {
                setSendMarksModalOpen(true);
                setPostSaveNotice(null);
              }}
            >
              <Send size={14} />
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

      {/* Filter Selection Controls */}
      <div className="sa-card p-3 p-md-4" style={{ borderRadius: '18px', boxShadow: '0 3px 10px rgba(15, 23, 42, 0.04)' }}>
        <h3 className="brand-font fw-bold m-0 mb-3" style={{ fontSize: '16px', color: '#0F172A' }}>
          Filter Marks by Batch, Subject & Examination
        </h3>
        <div className="row g-2.5 align-items-center">
          <div className="col-12 col-md-4">
            <label className="form-label small text-muted mb-1 fw-medium">Batch / Class</label>
            <select
              className="form-select"
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value)}
              style={{ height: '40px', borderRadius: '8px', borderColor: '#D9E1EA', fontSize: '13px' }}
            >
              {batchOptions.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <div className="col-12 col-md-4">
            <label className="form-label small text-muted mb-1 fw-medium">Subject</label>
            <select
              className="form-select"
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              style={{ height: '40px', borderRadius: '8px', borderColor: '#D9E1EA', fontSize: '13px' }}
            >
              {subjectOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="col-12 col-md-4">
            <label className="form-label small text-muted mb-1 fw-medium">Examination</label>
            <select
              className="form-select"
              value={examFilter}
              onChange={(e) => setExamFilter(e.target.value)}
              style={{ height: '40px', borderRadius: '8px', borderColor: '#D9E1EA', fontSize: '13px' }}
            >
              {examOptions.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div ref={marksTableRef} className="sa-card p-3 p-md-4" style={{ borderRadius: '18px', boxShadow: '0 3px 10px rgba(15, 23, 42, 0.04)' }}>
        <div className="d-flex flex-column flex-lg-row align-items-start align-items-lg-center justify-content-between gap-3 mb-3">
          <div className="d-flex align-items-center gap-2">
            <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: '32px', height: '32px', backgroundColor: '#FDF0F0', color: '#8B1216' }}>
              <BookText size={16} />
            </div>
            <div>
              <h2 className="brand-font fw-bold m-0" style={{ fontSize: '20px', color: '#0F172A' }}>Student Marks</h2>
              <span className="small text-muted" style={{ fontSize: '12px' }}>
                Showing {filteredMarks.length} records ({batchFilter} • {subjectFilter} • {examFilter})
              </span>
            </div>
          </div>

          <div className="d-flex flex-column flex-sm-row align-items-stretch gap-2 w-100" style={{ maxWidth: '620px' }}>
            <div className="position-relative flex-grow-1">
              <Search size={15} className="position-absolute text-sa-muted" style={{ left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                placeholder="Search students..."
                className="form-control"
                style={{ paddingLeft: '38px', borderColor: '#D9E1EA', borderRadius: '10px', height: '42px', fontSize: '13px' }}
              />
            </div>

            <button
              type="button"
              onClick={handleExport}
              className="btn border d-inline-flex align-items-center justify-content-center gap-2"
              style={{
                borderColor: '#E2E8F0',
                backgroundColor: '#FFFFFF',
                color: '#8B1216',
                borderRadius: '10px',
                height: '42px',
                padding: '8px 14px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '13px',
                whiteSpace: 'nowrap'
              }}
              title="Export Result to CSV / Excel spreadsheet"
            >
              <Download size={16} />
              <span>Export Result Excel</span>
            </button>

            <button
              type="button"
              onClick={handleOpenSendMarks}
              className="btn text-white d-inline-flex align-items-center justify-content-center gap-2 shadow-xs"
              style={{
                backgroundColor: '#8B1216',
                borderRadius: '10px',
                height: '42px',
                padding: '8px 16px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '13px',
                whiteSpace: 'nowrap'
              }}
              title="Send marks directly to parent/guardian via WhatsApp or SMS"
            >
              <Send size={15} />
              <span>Send Marks</span>
            </button>
          </div>
        </div>

        <Table
          columns={[
            { key: 'studentName', title: 'Student Name', render: (val) => <span className="fw-semibold text-sa-charcoal">{val}</span> },
            { key: 'rollNumber', title: 'Roll No.' },
            { key: 'examTitle', title: 'Examination' },
            { key: 'subject', title: 'Subject' },
            {
              key: 'obtainedMarks',
              title: 'Obtained Marks',
              render: (val, row) => <span className="fw-bold" style={{ color: '#8B1216' }}>{val} / {row.maxMarks}</span>
            },
            { key: 'status', title: 'Status', render: (val) => <span className="badge rounded-pill bg-success-subtle text-success">{val || 'Published'}</span> },
            { key: 'remarks', title: 'Faculty Remark' }
          ]}
          data={filteredMarks}
          loading={loading}
        />
      </div>

      <BulkMarksForm
        students={students}
        exams={exams}
        existingMarks={marks}
        onSubmit={handleBulkMarksSubmit}
        loading={loading}
      />

      <SendMarksModal
        isOpen={sendMarksModalOpen}
        onClose={() => setSendMarksModalOpen(false)}
        exam={currentActiveExam}
        batch={batchFilter !== 'All Batches' ? batchFilter : ''}
        subject={subjectFilter !== 'All Subjects' ? subjectFilter : ''}
        students={students}
        marks={marks}
      />
    </div>
  );
}
