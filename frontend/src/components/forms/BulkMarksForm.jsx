import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import { Users, CheckCircle2, AlertCircle, Clock, X, Check, Save } from 'lucide-react';

const normalize = (value) => String(value || '').trim().toLowerCase();

export default function BulkMarksForm({
  students = [],
  exams = [],
  existingMarks = [],
  onSubmit,
  loading = false
}) {
  const [examId, setExamId] = useState('');
  const [isGridActive, setIsGridActive] = useState(false);
  const [drafts, setDrafts] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Set default exam if available and not selected
  useEffect(() => {
    if (exams.length > 0 && !examId) {
      setExamId(exams[0].id);
    }
  }, [exams, examId]);

  // Sync drafts when examId or existingMarks changes
  useEffect(() => {
    if (!examId) return;
    const currentExamMarks = existingMarks.filter(mark => mark.examId === examId);
    if (currentExamMarks.length > 0) {
      setDrafts(prev => {
        const next = { ...prev };
        currentExamMarks.forEach(mark => {
          if (next[mark.studentId] === undefined) {
            next[mark.studentId] = {
              marksObtained: mark.obtainedMarks !== undefined ? String(mark.obtainedMarks) : '',
              remarks: mark.remarks || ''
            };
          }
        });
        return next;
      });
    }
  }, [examId, existingMarks]);

  const selectedExam = useMemo(() => {
    return exams.find(e => e.id === examId) || null;
  }, [exams, examId]);

  const examMaxMarks = Number(selectedExam?.maxMarks || selectedExam?.max_marks || 100);

  // Students assigned to selected exam/class
  const roster = useMemo(() => {
    if (!selectedExam) return [];
    const normalizedStandard = normalize(selectedExam.standard);
    const normalizedBatch = normalize(selectedExam.batch);

    const filtered = students.filter(student => {
      const stuStandard = normalize(student.standard);
      const stuBatch = normalize(student.batch);

      const standardMatches = stuStandard && normalizedStandard && (
        stuStandard === normalizedStandard ||
        stuStandard.includes(normalizedStandard) ||
        normalizedStandard.includes(stuStandard)
      );

      const batchMatches = stuBatch && (
        stuBatch === normalizedBatch ||
        normalizedBatch.includes(stuBatch) ||
        (stuStandard && stuStandard.includes(stuBatch))
      );

      return standardMatches || batchMatches;
    });

    // If specific filter matches students, return them; otherwise return all available students so data is always accessible
    return filtered.length > 0 ? filtered : students;
  }, [students, selectedExam]);

  // Handle clicking "Start Bulk Entry"
  const handleStartBulkEntry = () => {
    if (!examId || !selectedExam) {
      toast.warning('Please select an examination to start bulk entry.');
      return;
    }
    setIsGridActive(true);
    // Populate draft entries for this exam if not already done
    const currentExamMarks = existingMarks.filter(mark => mark.examId === examId);
    const initialDrafts = {};
    currentExamMarks.forEach(mark => {
      initialDrafts[mark.studentId] = {
        marksObtained: mark.obtainedMarks !== undefined ? String(mark.obtainedMarks) : '',
        remarks: mark.remarks || ''
      };
    });
    setDrafts(prev => ({ ...initialDrafts, ...prev }));
  };

  const updateDraft = (studentId, field, value) => {
    setDrafts(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }));
  };

  // Row validation evaluation
  const evaluatedRows = useMemo(() => {
    return roster.map(student => {
      const draft = drafts[student.id];
      const rawMarks = draft?.marksObtained;
      const remarks = draft?.remarks || '';

      if (rawMarks === undefined || rawMarks === null || String(rawMarks).trim() === '') {
        return {
          student,
          status: 'missing', // missing/unfilled
          message: 'Missing marks',
          value: '',
          remarks
        };
      }

      const num = Number(rawMarks);
      if (isNaN(num)) {
        return {
          student,
          status: 'invalid',
          message: 'Invalid number',
          value: rawMarks,
          remarks
        };
      }
      if (num < 0) {
        return {
          student,
          status: 'invalid',
          message: 'Cannot be negative',
          value: rawMarks,
          remarks
        };
      }
      if (num > examMaxMarks) {
        return {
          student,
          status: 'invalid',
          message: `Exceeds max (${examMaxMarks})`,
          value: rawMarks,
          remarks
        };
      }

      return {
        student,
        status: 'valid',
        message: 'Valid',
        value: num,
        remarks
      };
    });
  }, [roster, drafts, examMaxMarks]);

  const validEntries = useMemo(() => {
    return evaluatedRows
      .filter(r => r.status === 'valid')
      .map(r => ({
        studentId: r.student.id,
        marksObtained: r.value,
        remarks: r.remarks
      }));
  }, [evaluatedRows]);

  const invalidRows = useMemo(() => {
    return evaluatedRows.filter(r => r.status === 'invalid');
  }, [evaluatedRows]);

  const validCount = validEntries.length;
  const invalidCount = invalidRows.length;
  const missingCount = evaluatedRows.filter(r => r.status === 'missing').length;

  const handleSaveAll = async () => {
    if (isSaving || loading) return;

    if (!selectedExam) {
      toast.error('Please select an examination');
      return;
    }

    if (invalidCount > 0) {
      toast.error(`Please correct the ${invalidCount} invalid row(s) before saving.`);
      return;
    }

    if (validEntries.length === 0) {
      toast.error('Please enter valid marks for at least one student before saving.');
      return;
    }

    try {
      setIsSaving(true);
      await onSubmit(selectedExam.id, validEntries);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to save marks. Please check your entries.';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="sa-card p-3 p-md-4 bg-white border"
      style={{
        borderRadius: '18px',
        borderColor: '#E6EAF0',
        boxShadow: '0 3px 10px rgba(15, 23, 42, 0.04)'
      }}
    >
      {/* Top Header Card matching Reference UI */}
      <div className="d-flex flex-column flex-lg-row align-items-start align-items-lg-center justify-content-between gap-3">
        <div className="d-flex align-items-center gap-3">
          <div
            className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
            style={{ width: '42px', height: '42px', backgroundColor: '#FDF0F0', color: '#8B1216' }}
          >
            <Users size={20} />
          </div>
          <div>
            <h2 className="brand-font fw-bold m-0" style={{ fontSize: '18px', color: '#0F172A' }}>
              Bulk Marks Entry
            </h2>
            <p className="m-0 mt-0.5" style={{ fontSize: '13px', color: '#64748B' }}>
              Select an examination to add marks for all students in the selected class.
            </p>
          </div>
        </div>

        <div className="d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center gap-3 w-100 w-lg-auto">
          <div className="d-flex flex-column" style={{ minWidth: '240px' }}>
            <label className="form-label small text-muted mb-1 fw-medium" style={{ fontSize: '12px' }}>
              Examination
            </label>
            <select
              className="form-select"
              value={examId}
              onChange={(e) => {
                setExamId(e.target.value);
                // Reset active grid when switching exam so teacher explicitly starts entry for that exam
                setIsGridActive(false);
              }}
              style={{ height: '40px', borderRadius: '8px', borderColor: '#D9E1EA', fontSize: '13px' }}
            >
              <option value="">Select examination...</option>
              {exams.map(e => (
                <option key={e.id} value={e.id}>
                  {e.title || e.exam_name} {e.subject ? `(${e.subject})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="d-flex align-items-end pt-sm-3">
            <button
              type="button"
              onClick={handleStartBulkEntry}
              className="btn text-white d-inline-flex align-items-center justify-content-center gap-2 shadow-xs"
              style={{
                backgroundColor: '#8B1216',
                borderColor: '#8B1216',
                borderRadius: '10px',
                height: '40px',
                padding: '0 20px',
                fontWeight: 600,
                fontSize: '13.5px',
                whiteSpace: 'nowrap',
                cursor: 'pointer'
              }}
              title="Open editable marks entry grid for all students"
            >
              <Users size={16} />
              <span>Start Bulk Entry</span>
            </button>
          </div>
        </div>
      </div>

      {/* Editable Grid displayed when Start Bulk Entry is activated */}
      {isGridActive && selectedExam && (
        <div className="mt-4 pt-3 border-top" style={{ borderColor: '#F1F5F9' }}>
          {/* Exam Summary Badges & Validation Counters */}
          <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-2 mb-3">
            <div className="d-flex flex-wrap align-items-center gap-2">
              <span className="badge bg-light text-dark border px-2.5 py-1.5" style={{ fontSize: '12px' }}>
                Subject: <strong>{selectedExam.subject || 'N/A'}</strong>
              </span>
              <span className="badge bg-light text-dark border px-2.5 py-1.5" style={{ fontSize: '12px' }}>
                Class: <strong>{selectedExam.standard || 'All'}</strong>
              </span>
              <span className="badge bg-light text-dark border px-2.5 py-1.5" style={{ fontSize: '12px' }}>
                Max Marks: <strong>{examMaxMarks}</strong>
              </span>
              <span className="badge bg-light text-dark border px-2.5 py-1.5" style={{ fontSize: '12px' }}>
                Roster: <strong>{roster.length} Students</strong>
              </span>
            </div>

            <div className="d-flex align-items-center gap-2">
              <span
                className="badge d-inline-flex align-items-center gap-1"
                style={{ backgroundColor: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC', fontSize: '11.5px', padding: '5px 10px' }}
              >
                <Check size={12} /> {validCount} Valid
              </span>
              {invalidCount > 0 && (
                <span
                  className="badge d-inline-flex align-items-center gap-1"
                  style={{ backgroundColor: '#FEE2E2', color: '#B91C1C', border: '1px solid #FCA5A5', fontSize: '11.5px', padding: '5px 10px' }}
                >
                  <AlertCircle size={12} /> {invalidCount} Invalid
                </span>
              )}
              {missingCount > 0 && (
                <span
                  className="badge d-inline-flex align-items-center gap-1"
                  style={{ backgroundColor: '#FEF3C7', color: '#B45309', border: '1px solid #FCD34D', fontSize: '11.5px', padding: '5px 10px' }}
                >
                  <Clock size={12} /> {missingCount} Unfilled
                </span>
              )}
            </div>
          </div>

          {/* Roster Table */}
          {roster.length > 0 ? (
            <>
              <div className="table-responsive border rounded-3 mb-3" style={{ borderColor: '#E2E8F0' }}>
                <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
                  <thead style={{ backgroundColor: '#F8FAFC', color: '#475569', borderBottom: '1px solid #E2E8F0' }}>
                    <tr>
                      <th scope="col" style={{ width: '100px', padding: '12px 14px' }}>Roll No.</th>
                      <th scope="col" style={{ minWidth: '180px', padding: '12px 14px' }}>Student Name</th>
                      <th scope="col" style={{ width: '180px', padding: '12px 14px' }}>Obtained Marks (/ {examMaxMarks}) *</th>
                      <th scope="col" style={{ minWidth: '240px', padding: '12px 14px' }}>Faculty Remark / Feedback</th>
                      <th scope="col" style={{ width: '150px', padding: '12px 14px' }}>Row Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evaluatedRows.map(({ student, status, message }) => {
                      const currentDraft = drafts[student.id] || {};
                      const isInvalid = status === 'invalid';
                      const isValid = status === 'valid';

                      return (
                        <tr
                          key={student.id}
                          style={{
                            backgroundColor: isInvalid ? '#FFF5F5' : 'transparent',
                            transition: 'background-color 0.15s ease'
                          }}
                        >
                          <td className="fw-semibold text-sa-charcoal" style={{ padding: '10px 14px' }}>
                            {student.rollNumber || student.student_id || '-'}
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <div className="fw-semibold text-sa-charcoal">{student.name}</div>
                            <div className="small text-muted d-flex align-items-center gap-1 flex-wrap" style={{ fontSize: '11px' }}>
                              <span>{student.standard || student.batch || ''}</span>
                              {student.branch && (
                                <span
                                  className="badge rounded-pill fw-medium"
                                  style={{
                                    fontSize: '9.5px',
                                    padding: '1px 6px',
                                    backgroundColor: student.branch.toLowerCase().includes('tarabai') ? '#EFF6FF' : '#FEF2F2',
                                    color: student.branch.toLowerCase().includes('tarabai') ? '#1D4ED8' : '#8B1216',
                                    border: `1px solid ${student.branch.toLowerCase().includes('tarabai') ? '#BFDBFE' : '#FECACA'}`
                                  }}
                                >
                                  {student.branch}
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <div className="position-relative">
                              <input
                                type="number"
                                min="0"
                                max={examMaxMarks}
                                step="any"
                                value={currentDraft.marksObtained ?? ''}
                                onChange={(e) => updateDraft(student.id, 'marksObtained', e.target.value)}
                                placeholder="0"
                                className="form-control form-control-sm"
                                style={{
                                  borderColor: isInvalid ? '#EF4444' : isValid ? '#10B981' : '#D9E1EA',
                                  backgroundColor: isInvalid ? '#FEF2F2' : '#FFFFFF',
                                  borderRadius: '6px',
                                  fontSize: '13px',
                                  height: '36px'
                                }}
                                aria-label={`Marks for ${student.name}`}
                              />
                            </div>
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <input
                              type="text"
                              value={currentDraft.remarks ?? ''}
                              onChange={(e) => updateDraft(student.id, 'remarks', e.target.value)}
                              placeholder="e.g. Good grasp of concepts"
                              className="form-control form-control-sm"
                              style={{
                                borderColor: '#D9E1EA',
                                borderRadius: '6px',
                                fontSize: '13px',
                                height: '36px'
                              }}
                              aria-label={`Feedback for ${student.name}`}
                            />
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            {isValid && (
                              <span
                                className="badge rounded-pill d-inline-flex align-items-center gap-1"
                                style={{ backgroundColor: '#DCFCE7', color: '#15803D', fontSize: '11px', padding: '4px 10px' }}
                              >
                                <Check size={12} /> Valid
                              </span>
                            )}
                            {isInvalid && (
                              <span
                                className="badge rounded-pill d-inline-flex align-items-center gap-1"
                                style={{ backgroundColor: '#FEE2E2', color: '#B91C1C', fontSize: '11px', padding: '4px 10px' }}
                              >
                                <AlertCircle size={12} /> {message}
                              </span>
                            )}
                            {status === 'missing' && (
                              <span
                                className="badge rounded-pill d-inline-flex align-items-center gap-1"
                                style={{ backgroundColor: '#F1F5F9', color: '#64748B', fontSize: '11px', padding: '4px 10px' }}
                              >
                                <Clock size={12} /> Unfilled
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Grid Footer Actions */}
              <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-3">
                <div className="small text-muted" style={{ fontSize: '12.5px' }}>
                  {invalidCount > 0 ? (
                    <span className="text-danger fw-semibold d-inline-flex align-items-center gap-1">
                      <AlertCircle size={14} /> Please correct {invalidCount} invalid row(s) before saving.
                    </span>
                  ) : (
                    <span>
                      {validCount} of {roster.length} students have valid marks ready to save.
                    </span>
                  )}
                </div>

                <div className="d-flex align-items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsGridActive(false)}
                    className="btn btn-light border d-inline-flex align-items-center gap-1.5"
                    style={{
                      borderColor: '#E2E8F0',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: 600
                    }}
                  >
                    <X size={15} />
                    <span>Close</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveAll}
                    disabled={isSaving || loading || validCount === 0 || invalidCount > 0}
                    className="btn text-white d-inline-flex align-items-center gap-2 shadow-xs"
                    style={{
                      backgroundColor: '#8B1216',
                      borderColor: '#8B1216',
                      borderRadius: '8px',
                      padding: '8px 20px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: isSaving || loading || validCount === 0 || invalidCount > 0 ? 'not-allowed' : 'pointer',
                      opacity: isSaving || loading || validCount === 0 || invalidCount > 0 ? 0.65 : 1
                    }}
                  >
                    <CheckCircle2 size={16} />
                    <span>{isSaving ? 'Saving Marks...' : `Save All Marks (${validCount})`}</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="alert alert-light border text-center py-4" style={{ borderRadius: '12px' }}>
              <div className="fw-semibold text-muted">No students assigned to this examination/class.</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
