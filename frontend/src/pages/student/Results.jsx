import React, { useState, useEffect, useMemo } from 'react';
import Table from '../../components/common/Table';
import BackButton from '../../components/common/BackButton';
import marksService from '../../services/marksService';
import studentService from '../../services/studentService';
import { Calendar, UserCheck, Download, Award, CheckCircle2, TrendingUp, BookOpen, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import useAuth from '../../hooks/useAuth';
import { exportExamFullMarkSheet } from '../../utils/resultExport';

export default function StudentResults() {
  const [results, setResults] = useState([]);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const studentId = user?.id || user?._id || 'std-101';
        const [studentProfile, marksData] = await Promise.all([
          studentId ? studentService.getById(studentId).catch(() => null) : null,
          studentId ? marksService.getStudentResults(studentId).catch(() => []) : []
        ]);

        if (studentProfile) {
          setStudent(studentProfile);
        }

        if (marksData && Array.isArray(marksData) && marksData.length > 0) {
          setResults(marksData);
        } else {
          // Fallback if empty
          const allMarks = await marksService.getAll().catch(() => []);
          const studentRoll = studentProfile?.student_id || studentProfile?.roll_number;
          const matching = allMarks.filter(
            m => (studentRoll && (m.rollNumber === studentRoll || m.studentName === user?.full_name))
          );
          setResults(matching.length > 0 ? matching : marksData);
        }
      } catch (err) {
        console.warn('Failed to load student results:', err);
        toast.error('Failed to load published mark sheets');
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [user]);

  // Dynamic KPI Summary calculations
  const totalExams = results.length;

  const averagePercentage = useMemo(() => {
    if (totalExams === 0) return '0.0';
    const sum = results.reduce((acc, r) => {
      const pct = r.percentage != null
        ? Number(r.percentage)
        : (r.obtainedMarks && r.maxMarks ? (Number(r.obtainedMarks) / Number(r.maxMarks)) * 100 : 0);
      return acc + pct;
    }, 0);
    return (sum / totalExams).toFixed(1);
  }, [results, totalExams]);

  const passedCount = useMemo(() => {
    return results.filter(r => {
      if (r.pass_status !== undefined) return Boolean(r.pass_status);
      if (r.status === 'Fail' || r.grade === 'F') return false;
      const pct = Number(r.percentage) || (r.obtainedMarks ? (r.obtainedMarks / (r.maxMarks || 100)) * 100 : 0);
      return pct >= 35;
    }).length;
  }, [results]);

  // Download teacher's uploaded full mark sheet list for the exam
  const handleDownloadFullList = (row) => {
    try {
      exportExamFullMarkSheet(row, user);
      const formatLabel = row.fileType === 'word' ? 'Word (.doc)' : 'Excel (.xls)';
      toast.success(
        `Mark Sheet for "${row.examName || row.examTitle}" downloaded in ${formatLabel}!`
      );
    } catch (err) {
      toast.error('Failed to download exam mark sheet');
    }
  };

  const getGradeBadgeClass = (grade) => {
    switch ((grade || '').toUpperCase()) {
      case 'A+':
      case 'A':
        return 'bg-success-subtle text-success border border-success-subtle';
      case 'B':
      case 'B+':
        return 'bg-primary-subtle text-primary border border-primary-subtle';
      case 'C':
        return 'bg-warning-subtle text-warning border border-warning-subtle';
      case 'F':
        return 'bg-danger-subtle text-danger border border-danger-subtle';
      default:
        return 'bg-secondary-subtle text-secondary';
    }
  };

  return (
    <div className="d-flex flex-column gap-4">
      {/* Back button */}
      <div>
        <BackButton to="/student/dashboard" label="Back to Dashboard" />
      </div>

      {/* Header Banner */}
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2">
        <div>
          <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
            Published Exam Mark Sheets & Results
          </h3>
          <span className="small text-sa-muted">
            Live subject evaluations, teacher-verified scores, grades, and official mark sheets
          </span>
        </div>
        {(student?.branch || student?.batch) && (
          <div className="d-inline-flex align-items-center gap-1.5 px-3 py-1.5 bg-light rounded-pill border small fw-semibold text-secondary">
            <Award size={13} className="text-sa-primary" />
            <span>{student?.branch || 'Campus'} • {student?.batch || student?.academic_batch || 'Batch'}</span>
          </div>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="row g-3">
        <div className="col-12 col-md-4">
          <div className="sa-card p-4 h-100 d-flex flex-column justify-content-between">
            <div>
              <span className="small text-sa-muted fw-semibold">OVERALL AVERAGE SCORE</span>
              <h2 className="brand-font fw-extrabold text-sa-primary m-0 fs-3">
                {averagePercentage}%
              </h2>
            </div>
            <div className="mt-2 d-flex align-items-center gap-1.5 small text-sa-muted">
              <TrendingUp size={14} className="text-success" />
              <span>Calculated across {totalExams} evaluated exams</span>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="sa-card p-4 h-100 d-flex flex-column justify-content-between">
            <div>
              <span className="small text-sa-muted fw-semibold">TOTAL EXAMS TAKEN</span>
              <h2 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-3">
                {totalExams}
              </h2>
            </div>
            <div className="mt-2 d-flex align-items-center gap-1.5 small text-sa-muted">
              <BookOpen size={14} className="text-sa-primary" />
              <span>Published by academy faculty</span>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="sa-card p-4 h-100 d-flex flex-column justify-content-between">
            <div>
              <span className="small text-sa-muted fw-semibold">PASS STATUS & SUCCESS RATE</span>
              <h2 className="brand-font fw-extrabold text-success m-0 fs-3">
                {totalExams > 0 ? `${passedCount} / ${totalExams}` : '0 / 0'}
              </h2>
            </div>
            <div className="mt-2 d-flex align-items-center gap-1.5 small text-success fw-medium">
              <CheckCircle2 size={14} />
              <span>
                {totalExams > 0 ? `${Math.round((passedCount / totalExams) * 100)}% Pass Clearance` : 'No exams completed yet'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Published Mark Sheets Section */}
      <div className="sa-card p-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h5 className="brand-font fw-bold text-sa-charcoal m-0 fs-6">
            Evaluation Ledger & Subject Breakdown
          </h5>
          <span className="small text-sa-muted">
            Showing {results.length} published records
          </span>
        </div>

        <Table
          columns={[
            {
              key: 'examName',
              title: 'Exam Name',
              render: (val, row) => (
                <div className="d-flex flex-column">
                  <span className="fw-bold text-sa-charcoal">
                    {val || row.examTitle || 'Semester Exam'}
                  </span>
                  {row.remarks && (
                    <span className="text-sa-muted text-truncate" style={{ fontSize: '0.75rem', maxWidth: '240px' }} title={row.remarks}>
                      "{row.remarks}"
                    </span>
                  )}
                </div>
              )
            },
            {
              key: 'subject',
              title: 'Subject',
              render: (val) => (
                <span className="fw-semibold text-dark">
                  {val || 'General'}
                </span>
              )
            },
            {
              key: 'date',
              title: 'Date',
              render: (val) => (
                <div className="d-inline-flex align-items-center gap-1 px-2 py-1 bg-light border rounded small text-dark fw-medium">
                  <Calendar size={13} className="text-secondary" />
                  <span>{val || 'N/A'}</span>
                </div>
              )
            },
            {
              key: 'obtainedMarks',
              title: 'Marks Obtained',
              render: (val, row) => {
                const max = row.maxMarks || 100;
                const score = val !== undefined ? val : (row.marks_obtained !== undefined ? row.marks_obtained : '--');
                return (
                  <div className="d-flex align-items-baseline gap-1">
                    <span className="fw-bold fs-6 text-sa-charcoal">{score}</span>
                    <span className="small text-sa-muted">/ {max}</span>
                  </div>
                );
              }
            },
            {
              key: 'percentage',
              title: 'Percentage',
              render: (val, row) => {
                const pct = val != null ? Number(val).toFixed(1) : (row.obtainedMarks ? ((row.obtainedMarks / (row.maxMarks || 100)) * 100).toFixed(1) : '--');
                return (
                  <span className="fw-bold text-sa-primary">
                    {pct !== '--' ? `${pct}%` : '--'}
                  </span>
                );
              }
            },
            {
              key: 'grade',
              title: 'Grade',
              render: (val, row) => {
                const gradeStr = val || row.grade || 'A';
                return (
                  <span className={`badge px-2 py-1 fw-bold ${getGradeBadgeClass(gradeStr)}`}>
                    {gradeStr}
                  </span>
                );
              }
            },
            {
              key: 'teacher',
              title: 'Teacher',
              render: (val) => (
                <div className="d-flex align-items-center gap-1">
                  <UserCheck size={14} className="text-success flex-shrink-0" />
                  <span className="fw-medium text-sa-charcoal small">{val || 'Faculty'}</span>
                </div>
              )
            },
            {
              key: 'downloadAction',
              title: 'Mark Sheet',
              align: 'center',
              render: (_, row) => (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1.5 px-3 py-1.5 rounded-2 shadow-xs fw-semibold"
                  onClick={() => handleDownloadFullList(row)}
                  title={`Download mark sheet for ${row.examName || row.examTitle}`}
                >
                  <Download size={14} />
                  <span>Download</span>
                </button>
              )
            }
          ]}
          data={results}
          loading={loading}
          emptyMessage="No published mark sheets available yet."
        />
      </div>
    </div>
  );
}
