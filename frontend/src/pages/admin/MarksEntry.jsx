import React, { useState, useEffect, useMemo } from 'react';
import MarksForm from '../../components/forms/MarksForm';
import Table from '../../components/common/Table';
import marksService from '../../services/marksService';
import studentService from '../../services/studentService';
import examService from '../../services/examService';
import { toast } from 'react-toastify';
import { Award, CheckCircle, Building2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
  getUserBranch,
  filterMarksByBranch,
  filterStudentsByBranch,
  filterExamsByBranch,
  CAMPUS
} from '../../utils/branchUtils';

export default function MarksEntry() {
  const { user } = useAuth();
  const userBranch = getUserBranch(user);
  const isSuperAdmin = (user?.role || '').toLowerCase().includes('super');

  const [marks, setMarks] = useState([]);
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState(isSuperAdmin ? 'All' : (userBranch || CAMPUS.MANGALVAR_PETH));

  // Regular admin is strictly auto-scoped to their login campus
  const effectiveBranch = isSuperAdmin ? selectedBranch : (userBranch || CAMPUS.MANGALVAR_PETH);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mList, sList, eList] = await Promise.all([
        marksService.getAll(),
        studentService.getAll(),
        examService.getAll()
      ]);
      setMarks(mList || []);
      setStudents(sList || []);
      setExams(eList || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleMarksSubmit = async (formData) => {
    await marksService.submitMarks(formData);
    toast.success(`Marks published for ${formData.studentName}!`);
    fetchData();
  };

  // Branch-scoped records
  const filteredStudents = useMemo(() => {
    return filterStudentsByBranch(students, effectiveBranch);
  }, [students, effectiveBranch]);

  const filteredExams = useMemo(() => {
    return filterExamsByBranch(exams, effectiveBranch);
  }, [exams, effectiveBranch]);

  const displayedMarks = useMemo(() => {
    return filterMarksByBranch(marks, effectiveBranch);
  }, [marks, effectiveBranch]);

  // Counts for campus switcher
  const totalCount = marks.length;
  const manglavarCount = useMemo(() => filterMarksByBranch(marks, 'Manglavar Peth').length, [marks]);
  const tarabaiCount = useMemo(() => filterMarksByBranch(marks, 'Tarabai Park').length, [marks]);

  return (
    <div className="d-flex flex-column gap-4">
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
        <div>
          <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
            Examination Marks Recording
          </h3>
          <span className="small text-sa-muted">
            Input student scorecards, calculate percentage and auto-assign letter grades by branch
          </span>
        </div>

        {/* Branch badge for regular admin */}
        {!isSuperAdmin && (
          <div
            className="d-inline-flex align-items-center gap-1.5 px-3 py-1.5 rounded-pill shadow-xs"
            style={{
              backgroundColor: effectiveBranch.toLowerCase().includes('mangal') ? '#FDF0F0' : '#EFF6FF',
              border: effectiveBranch.toLowerCase().includes('mangal') ? '1px solid #FECACA' : '1px solid #BFDBFE',
              color: effectiveBranch.toLowerCase().includes('mangal') ? '#8B1216' : '#1D4ED8',
              fontSize: '12.5px',
              fontWeight: 600
            }}
          >
            <Building2 size={14} />
            <span>{effectiveBranch}</span>
          </div>
        )}

        {/* Unified Branch Filter Dropdown - Only shown to SuperAdmin */}
        {isSuperAdmin && (
          <div className="position-relative d-inline-flex align-items-center" style={{ minWidth: '220px' }}>
            <Building2
              size={15}
              className="position-absolute"
              style={{
                left: '12px',
                pointerEvents: 'none',
                color: selectedBranch === 'All' ? '#64748B' : (selectedBranch.toLowerCase().includes('mangal') ? '#8B1216' : '#1D4ED8')
              }}
            />
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="form-select fw-semibold"
              style={{
                paddingLeft: '36px',
                paddingRight: '32px',
                height: '40px',
                borderRadius: '10px',
                borderColor: '#D8DEE4',
                backgroundColor: '#FFFFFF',
                color: '#0F172A',
                fontSize: '13px',
                boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
                cursor: 'pointer'
              }}
              aria-label="Filter by Branch Campus"
            >
              <option value="All">All Branches ({totalCount} Scores)</option>
              <option value="Manglavar Peth">Manglavar Peth ({manglavarCount} Scores)</option>
              <option value="Tarabai Park">Tarabai Park ({tarabaiCount} Scores)</option>
            </select>
          </div>
        )}
      </div>

      <MarksForm
        students={filteredStudents}
        exams={filteredExams}
        onSubmit={handleMarksSubmit}
      />

      <div className="sa-card p-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h5 className="brand-font fw-bold text-sa-charcoal m-0 fs-6">
            Recently Recorded Examination Scores
            {effectiveBranch !== 'All' && (
              <span className="text-sa-muted fw-normal ms-2" style={{ fontSize: '13px' }}>
                ({effectiveBranch})
              </span>
            )}
          </h5>
          <span className="small text-muted">
            Showing {displayedMarks.length} record{displayedMarks.length === 1 ? '' : 's'}
          </span>
        </div>

        <Table
          columns={[
            { key: 'studentName', title: 'Student', render: (val) => <span className="fw-bold">{val}</span> },
            { key: 'rollNumber', title: 'Roll No.' },
            {
              key: 'branch',
              title: 'Branch',
              render: (val, row) => {
                const br = val || row.branch || (row.rollNumber?.startsWith('TP') ? 'Tarabai Park' : 'Manglavar Peth');
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
              key: 'batch',
              title: 'Batch / Class',
              render: (val, row) => <span className="text-sa-charcoal">{val || row.standard || 'General'}</span>
            },
            { key: 'examTitle', title: 'Examination' },
            { key: 'subject', title: 'Subject' },
            {
              key: 'obtainedMarks',
              title: 'Score',
              render: (val, row) => <span className="fw-bold text-sa-primary">{val} / {row.maxMarks}</span>
            },
            {
              key: 'percentage',
              title: 'Percentage',
              render: (val) => `${val}%`
            },
            {
              key: 'grade',
              title: 'Grade',
              render: (val) => <span className="badge bg-success small">{val}</span>
            },
            { key: 'remarks', title: 'Remarks' }
          ]}
          data={displayedMarks}
          loading={loading}
        />
      </div>
    </div>
  );
}
