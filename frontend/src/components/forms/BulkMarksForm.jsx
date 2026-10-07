import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import Button from '../common/Button';

const normalize = (value) => String(value || '').trim().toLowerCase();

export default function BulkMarksForm({
  students = [],
  exams = [],
  existingMarks = [],
  onSubmit,
  loading = false
}) {
  const [examId, setExamId] = useState('');
  const [drafts, setDrafts] = useState({});

  useEffect(() => {
    if (!examId) return;
    const examMarks = existingMarks.filter(mark => mark.examId === examId);
    if (examMarks.length === 0) return;
    setDrafts(current => {
      let updated = current;
      examMarks.forEach(mark => {
        if (Object.prototype.hasOwnProperty.call(updated, mark.studentId)) return;
        if (updated === current) updated = { ...current };
        updated[mark.studentId] = {
          marksObtained: String(mark.obtainedMarks),
          remarks: mark.remarks || ''
        };
      });
      return updated;
    });
  }, [examId, existingMarks]);

  const selectedExam = exams.find(exam => exam.id === examId);
  const examStandard = selectedExam?.examStandard || selectedExam?.standard?.split(' - ')[0];
  const roster = useMemo(() => {
    if (!selectedExam) return [];
    const normalizedStandard = normalize(examStandard);
    const normalizedBatch = normalize(selectedExam.batch);
    const combinedClass = normalize(selectedExam.standard);
    return students.filter(student => {
      const studentStandard = normalize(student.standard);
      const studentBatch = normalize(student.batch);
      const standardMatches = studentStandard && normalizedStandard &&
        studentStandard === normalizedStandard;
      const batchMatches = studentBatch && (
        studentBatch === normalizedBatch ||
        (combinedClass && combinedClass.includes(studentBatch))
      );
      return standardMatches && batchMatches;
    });
  }, [students, selectedExam, examStandard]);

  const entries = roster
    .filter(student => drafts[student.id]?.marksObtained !== undefined && drafts[student.id]?.marksObtained !== '')
    .map(student => ({
      studentId: student.id,
      marksObtained: Number(drafts[student.id].marksObtained),
      remarks: drafts[student.id].remarks || ''
    }));

  const updateDraft = (studentId, field, value) => {
    setDrafts(current => ({
      ...current,
      [studentId]: { ...current[studentId], [field]: value }
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedExam || entries.length === 0) {
      toast.error('Select an exam and enter marks for at least one student');
      return;
    }
    if (entries.some(entry =>
      !Number.isFinite(entry.marksObtained) ||
      entry.marksObtained < 0 ||
      entry.marksObtained > Number(selectedExam.maxMarks)
    )) {
      toast.error(`Enter marks between 0 and ${selectedExam.maxMarks}`);
      return;
    }

    try {
      await onSubmit(selectedExam.id, entries);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save marks');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="sa-card p-3 p-md-4">
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-3">
        <div>
          <h2 className="brand-font fw-bold text-sa-charcoal m-0 fs-6">Bulk Marks Entry</h2>
          <p className="text-sa-muted m-0 mt-1" style={{ fontSize: '13px' }}>
            Select an exam to load its class roster. Blank rows will not be changed.
          </p>
        </div>
        <div className="w-100" style={{ maxWidth: '420px' }}>
          <label htmlFor="bulk-marks-exam" className="form-label fw-semibold" style={{ fontSize: '13px' }}>
            Exam
          </label>
          <select
            id="bulk-marks-exam"
            className="form-select"
            value={examId}
            onChange={(event) => {
              const nextExamId = event.target.value;
              setExamId(nextExamId);
              setDrafts(Object.fromEntries(
                existingMarks
                  .filter(mark => mark.examId === nextExamId)
                  .map(mark => [mark.studentId, {
                    marksObtained: String(mark.obtainedMarks),
                    remarks: mark.remarks || ''
                  }])
              ));
            }}
            required
          >
            <option value="">Select an exam</option>
            {exams.map(exam => (
              <option key={exam.id} value={exam.id}>
                {exam.title} — {exam.subject} ({exam.standard})
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedExam && (
        <>
          <div className="d-flex flex-wrap gap-2 mb-3">
            <span className="badge bg-light text-sa-charcoal border">{selectedExam.subject}</span>
            <span className="badge bg-light text-sa-charcoal border">{selectedExam.batch}</span>
            <span className="badge bg-light text-sa-charcoal border">Maximum: {selectedExam.maxMarks}</span>
            <span className="badge bg-light text-sa-charcoal border">{roster.length} students</span>
          </div>

          {roster.length > 0 ? (
            <>
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead>
                    <tr>
                      <th scope="col">Roll No.</th>
                      <th scope="col">Student</th>
                      <th scope="col" style={{ minWidth: '130px' }}>Marks / {selectedExam.maxMarks}</th>
                      <th scope="col" style={{ minWidth: '220px' }}>Feedback</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roster.map(student => (
                      <tr key={student.id}>
                        <td className="fw-semibold">{student.rollNumber}</td>
                        <td>{student.name}</td>
                        <td>
                          <input
                            type="number"
                            className="form-control"
                            min="0"
                            max={selectedExam.maxMarks}
                            step="any"
                            value={drafts[student.id]?.marksObtained ?? ''}
                            onChange={(event) => updateDraft(student.id, 'marksObtained', event.target.value)}
                            aria-label={`Marks for ${student.name}`}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control"
                            value={drafts[student.id]?.remarks ?? ''}
                            onChange={(event) => updateDraft(student.id, 'remarks', event.target.value)}
                            placeholder="Optional feedback"
                            aria-label={`Feedback for ${student.name}`}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="d-flex justify-content-end">
                <Button type="submit" variant="primary" loading={loading} disabled={loading || entries.length === 0}>
                  Save {entries.length} {entries.length === 1 ? 'Mark' : 'Marks'}
                </Button>
              </div>
            </>
          ) : (
            <div className="alert alert-light border mb-0" role="status">
              No students match this exam’s standard and batch.
            </div>
          )}
        </>
      )}
    </form>
  );
}
