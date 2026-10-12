import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MarksForm from '../../components/forms/MarksForm';
import BulkMarksForm from '../../components/forms/BulkMarksForm';
import Table from '../../components/common/Table';
import marksService from '../../services/marksService';
import studentService from '../../services/studentService';
import examService from '../../services/examService';
import { ArrowLeft, BookText, Users, CheckCheck, Clock3, Search, Download } from 'lucide-react';
import { toast } from 'react-toastify';

export default function EnterMarks() {
  const navigate = useNavigate();
  const [marks, setMarks] = useState([]);
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchStudent, setSearchStudent] = useState('');
  const marksTableRef = useRef(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mList, sList, eList] = await Promise.all([
        marksService.getAll(),
        studentService.getAll(),
        examService.getAll()
      ]);
      setMarks(mList);
      setStudents(sList);
      setExams(eList);
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

  const filteredMarks = useMemo(() => {
    const term = searchStudent.trim().toLowerCase();
    if (!term) return marks;
    return marks.filter((mark) => {
      const fields = [
        mark.studentName,
        mark.rollNumber,
        mark.examTitle,
        mark.subject,
        mark.grade,
        mark.remarks
      ].filter(Boolean).join(' ').toLowerCase();
      return fields.includes(term);
    });
  }, [marks, searchStudent]);

  const summaryCards = [
    { label: 'Total Examinations', value: totalExaminations, supporting: 'Assigned to you', icon: BookText, bg: '#EEF3FF', color: '#3B82F6' },
    { label: 'Total Students', value: totalStudents, supporting: 'In this session', icon: Users, bg: '#EAF6EF', color: '#168554' },
    { label: 'Marks Entered', value: marksEntered, supporting: 'Submitted', icon: CheckCheck, bg: '#EEF7E8', color: '#0F766E' },
    { label: 'Pending', value: pending, supporting: 'Yet to update', icon: Clock3, bg: '#FDF0F0', color: '#A91D22' }
  ];

  const handleMarksSubmit = async (formData) => {
    await marksService.submitMarks(formData);
    toast.success(`Marks published for ${formData.studentName}!`);
    fetchData();
  };

  const handleBulkMarksSubmit = async (examId, entries) => {
    await marksService.submitBulkMarks(examId, entries);
    toast.success(`Marks saved for ${entries.length} student${entries.length === 1 ? '' : 's'}.`);
    await fetchData();
  };

  const handleViewPastRecords = () => {
    marksTableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    toast.info('Showing recent marks records.');
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

      <div className="sa-card p-4" style={{ borderRadius: '18px', boxShadow: '0 3px 10px rgba(15, 23, 42, 0.04)' }}>
        <h2 className="brand-font fw-bold m-0" style={{ fontSize: '22px', color: '#0F172A' }}>Select Examination</h2>
        <div className="mt-3">
          <MarksForm students={students} exams={exams} onSubmit={handleMarksSubmit} />
        </div>
      </div>

      <div
        className="d-flex align-items-center justify-content-center text-center rounded-3 border"
        style={{ backgroundColor: '#FFF7F5', borderColor: '#F4C6B8', color: '#8B1216', minHeight: '48px', padding: '12px 16px' }}
      >
        <span style={{ fontSize: '14px', fontWeight: 500 }}>
          Please select the examination, class and subject to view and enter marks.
        </span>
      </div>

      <div ref={marksTableRef} className="sa-card p-3 p-md-4" style={{ borderRadius: '18px', boxShadow: '0 3px 10px rgba(15, 23, 42, 0.04)' }}>
        <div className="d-flex flex-column flex-md-row align-items-center justify-content-between gap-3 mb-3">
          <div className="d-flex align-items-center gap-2">
            <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: '32px', height: '32px', backgroundColor: '#FDF0F0', color: '#8B1216' }}>
              <BookText size={16} />
            </div>
            <h2 className="brand-font fw-bold m-0" style={{ fontSize: '20px', color: '#0F172A' }}>Student Marks</h2>
          </div>

          <div className="d-flex flex-column flex-sm-row align-items-stretch gap-2" style={{ width: '100%', maxWidth: '420px' }}>
            <div className="position-relative flex-grow-1">
              <Search size={15} className="position-absolute text-sa-muted" style={{ left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                placeholder="Search students..."
                className="form-control"
                style={{ paddingLeft: '38px', borderColor: '#D9E1EA', borderRadius: '10px', height: '42px' }}
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
                minWidth: '120px',
                height: '42px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              <Download size={16} />
              <span>Export</span>
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
    </div>
  );
}
