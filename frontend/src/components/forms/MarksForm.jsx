import React, { useState, useEffect, useMemo } from 'react';
import Select from '../common/Select';
import { Bookmark, Send, BookText, X } from 'lucide-react';
import { toast } from 'react-toastify';

export default function MarksForm({
  students = [],
  exams = [],
  onSubmit,
  loading = false,
  editingMark = null,
  onCancelEdit = null
}) {
  const [formData, setFormData] = useState({
    studentId: students[0]?.id || '',
    examId: exams[0]?.id || '',
    subject: 'Mathematics',
    maxMarks: 100,
    obtainedMarks: '',
    remarks: 'Consistent academic performance'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync initial student and exam if not set
  useEffect(() => {
    if (students.length > 0 && !formData.studentId && !editingMark) {
      setFormData(prev => ({ ...prev, studentId: students[0].id }));
    }
    if (exams.length > 0 && !formData.examId && !editingMark) {
      setFormData(prev => ({ ...prev, examId: exams[0].id }));
    }
  }, [students, exams, editingMark]);

  // Sync when editing a mark from the table
  useEffect(() => {
    if (editingMark) {
      const sId = editingMark.studentId || editingMark.student_id || editingMark.student?._id || '';
      const eId = editingMark.examId || editingMark.exam_id || editingMark.exam?._id || '';
      const subj = editingMark.subject || '';
      const maxM = editingMark.maxMarks || editingMark.max_marks || 100;
      const obtM = editingMark.obtainedMarks !== undefined 
        ? String(editingMark.obtainedMarks) 
        : (editingMark.marks_obtained !== undefined ? String(editingMark.marks_obtained) : '');
      const rem = editingMark.remarks || '';

      setFormData({
        studentId: sId,
        examId: eId,
        subject: subj || 'Mathematics',
        maxMarks: maxM,
        obtainedMarks: obtM,
        remarks: rem
      });
    }
  }, [editingMark]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'examId') {
      const foundExam = exams.find(ex => ex.id === value);
      setFormData(prev => ({
        ...prev,
        examId: value,
        maxMarks: foundExam?.max_marks || foundExam?.maxMarks || prev.maxMarks,
        subject: foundExam?.subject || prev.subject
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Dynamically resolve subjects connected to teacher's exams
  const subjectOptions = useMemo(() => {
    const set = new Set();
    const currentExam = exams.find(e => e.id === formData.examId);
    if (currentExam?.subject) {
      set.add(currentExam.subject);
    }
    exams.forEach(e => e.subject && set.add(e.subject));
    if (set.size === 0) {
      ['Mathematics', 'Physics', 'Chemistry', 'Biology'].forEach(s => set.add(s));
    }
    return Array.from(set);
  }, [exams, formData.examId]);

  // Live calculation of Percentage & Grade
  const { percentage, grade } = useMemo(() => {
    const numObtained = parseFloat(formData.obtainedMarks);
    const numMax = parseFloat(formData.maxMarks) || 100;
    if (isNaN(numObtained) || numMax <= 0) {
      return { percentage: null, grade: '-' };
    }
    const pct = Math.round((numObtained / numMax) * 100);
    let grd = 'F';
    if (pct >= 90) grd = 'A+';
    else if (pct >= 80) grd = 'A';
    else if (pct >= 70) grd = 'B';
    else if (pct >= 60) grd = 'C';
    else if (pct >= 50) grd = 'D';
    else grd = 'F';
    return { percentage: pct, grade: grd };
  }, [formData.obtainedMarks, formData.maxMarks]);

  const handleSaveAction = async (status) => {
    if (isSubmitting || loading) return;

    if (!formData.studentId) {
      toast.error('Please select a student');
      return;
    }
    if (!formData.examId) {
      toast.error('Please select an examination');
      return;
    }

    const maxVal = Number(formData.maxMarks);
    if (isNaN(maxVal) || maxVal <= 0) {
      toast.error('Maximum marks must be greater than zero');
      return;
    }

    if (formData.obtainedMarks === '' || formData.obtainedMarks === null) {
      toast.error('Please enter obtained marks');
      return;
    }

    const marksVal = Number(formData.obtainedMarks);
    if (isNaN(marksVal)) {
      toast.error('Obtained marks must be a valid number');
      return;
    }
    if (marksVal < 0) {
      toast.error('Obtained marks cannot be negative');
      return;
    }
    if (marksVal > maxVal) {
      toast.error(`Obtained marks cannot exceed maximum marks (${maxVal})`);
      return;
    }

    const selectedStu = students.find(s => s.id === formData.studentId) || students[0];
    const selectedExam = exams.find(e => e.id === formData.examId) || exams[0];

    try {
      setIsSubmitting(true);
      await onSubmit({
        ...formData,
        student: selectedStu,
        studentName: selectedStu?.name,
        rollNumber: selectedStu?.rollNumber,
        parentPhone: selectedStu?.parentPhone || selectedStu?.parent_mobile || selectedStu?.phone,
        parentName: selectedStu?.parentName || selectedStu?.parent_name,
        examTitle: selectedExam?.title || selectedExam?.exam_name,
        maxMarks: maxVal,
        obtainedMarks: marksVal,
        percentage: percentage,
        grade: grade,
        status: status
      });
      if (editingMark && onCancelEdit) {
        onCancelEdit();
      }
    } catch {
      // Error handled by parent or toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="sa-card p-4 bg-white border"
      style={{
        borderRadius: '18px',
        borderColor: '#E6EAF0',
        boxShadow: '0 3px 10px rgba(15, 23, 42, 0.04)'
      }}
    >
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div className="d-flex align-items-center gap-2">
          <div
            className="d-flex align-items-center justify-content-center rounded-circle"
            style={{ width: '32px', height: '32px', backgroundColor: '#FDF0F0', color: '#8B1216' }}
          >
            <BookText size={16} />
          </div>
          <div>
            <h2 className="brand-font fw-bold m-0" style={{ fontSize: '18px', color: '#0F172A' }}>
              Student Marks Recording Sheet
            </h2>
          </div>
        </div>

        {editingMark && (
          <div className="d-flex align-items-center gap-2">
            <span
              className="badge"
              style={{
                backgroundColor: editingMark.status === 'Draft' ? '#FEF3C7' : '#DCFCE7',
                color: editingMark.status === 'Draft' ? '#B45309' : '#15803D',
                fontSize: '12px',
                padding: '5px 10px',
                borderRadius: '6px'
              }}
            >
              Editing {editingMark.status || 'Draft'}: {editingMark.studentName}
            </span>
            {onCancelEdit && (
              <button
                type="button"
                onClick={onCancelEdit}
                className="btn btn-sm btn-light border p-1"
                title="Cancel Edit"
                style={{ borderRadius: '6px' }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="row g-3">
        {/* Row 1: Select Student, Examination, Subject (4 cols each = 12) */}
        <div className="col-12 col-md-4">
          <label className="form-label" style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A', marginBottom: '6px' }}>
            Select Student <span className="text-danger">*</span>
          </label>
          <select
            name="studentId"
            value={formData.studentId}
            onChange={handleChange}
            className="form-select"
            style={{ height: '40px', borderRadius: '8px', borderColor: '#D9E1EA', fontSize: '13px' }}
            required
          >
            {students.map(s => (
              <option key={s.id} value={s.id}>
                {s.name || s.student_id} (Roll No. {s.rollNumber || s.student_id}) - {s.standard || 'Class 10'}
              </option>
            ))}
          </select>
        </div>

        <div className="col-12 col-md-4">
          <label className="form-label" style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A', marginBottom: '6px' }}>
            Examination <span className="text-danger">*</span>
          </label>
          <select
            name="examId"
            value={formData.examId}
            onChange={handleChange}
            className="form-select"
            style={{ height: '40px', borderRadius: '8px', borderColor: '#D9E1EA', fontSize: '13px' }}
            required
          >
            {exams.map(e => (
              <option key={e.id} value={e.id}>
                {e.title || e.exam_name}
              </option>
            ))}
          </select>
        </div>

        <div className="col-12 col-md-4">
          <label className="form-label" style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A', marginBottom: '6px' }}>
            Subject <span className="text-danger">*</span>
          </label>
          <select
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            className="form-select"
            style={{ height: '40px', borderRadius: '8px', borderColor: '#D9E1EA', fontSize: '13px' }}
            required
          >
            {subjectOptions.map(sub => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
        </div>

        {/* Row 2: Maximum Marks (3), Obtained Marks (3), Result Preview (6) = 12 */}
        <div className="col-12 col-sm-6 col-md-3">
          <label className="form-label" style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A', marginBottom: '6px' }}>
            Maximum Marks <span className="text-danger">*</span>
          </label>
          <input
            type="number"
            name="maxMarks"
            value={formData.maxMarks}
            onChange={handleChange}
            className="form-control"
            style={{ height: '40px', borderRadius: '8px', borderColor: '#D9E1EA', fontSize: '13.5px' }}
            required
          />
        </div>

        <div className="col-12 col-sm-6 col-md-3">
          <label className="form-label" style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A', marginBottom: '6px' }}>
            Obtained Marks <span className="text-danger">*</span>
          </label>
          <input
            type="number"
            name="obtainedMarks"
            placeholder="e.g. 85"
            value={formData.obtainedMarks}
            onChange={handleChange}
            className="form-control"
            style={{ height: '40px', borderRadius: '8px', borderColor: '#D9E1EA', fontSize: '13.5px' }}
            required
          />
        </div>

        {/* Live Calculation Preview Box on same row as Obtained Marks */}
        <div className="col-12 col-md-6 d-flex flex-column justify-content-end">
          <div
            className="d-flex align-items-center justify-content-around px-3 border"
            style={{
              height: '40px',
              backgroundColor: '#F0FDF4',
              borderColor: '#BBF7D0',
              borderRadius: '8px'
            }}
          >
            <div className="d-flex align-items-center gap-2">
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#166534' }}>Percentage</span>
              <span style={{ fontSize: '16px', fontWeight: 700, color: '#15803D' }}>
                {percentage !== null ? `${percentage}%` : '-'}
              </span>
            </div>
            <div style={{ width: '1px', height: '20px', backgroundColor: '#BBF7D0' }} />
            <div className="d-flex align-items-center gap-2">
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#166534' }}>Grade</span>
              <span
                className="badge"
                style={{
                  backgroundColor: '#DCFCE7',
                  color: '#15803D',
                  fontSize: '12px',
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: '6px',
                  border: '1px solid #86EFAC'
                }}
              >
                {grade}
              </span>
            </div>
          </div>
        </div>

        {/* Row 3: Faculty Remarks / Feedback */}
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <label className="form-label m-0" style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>
              Faculty Remarks / Feedback
            </label>
            <span style={{ fontSize: '11px', color: '#94A3B8' }}>
              {(formData.remarks || '').length}/500
            </span>
          </div>
          <input
            type="text"
            name="remarks"
            maxLength={500}
            placeholder="e.g. Excellent performance. Keep it up!"
            value={formData.remarks}
            onChange={handleChange}
            className="form-control"
            style={{ height: '40px', borderRadius: '8px', borderColor: '#D9E1EA', fontSize: '13.5px' }}
          />
        </div>
      </div>

      {/* Row 4: Action Buttons properly aligned at bottom right */}
      <div className="d-flex justify-content-end align-items-center gap-2 mt-4">
        <button
          type="button"
          onClick={() => handleSaveAction('Draft')}
          disabled={isSubmitting || loading}
          className="btn btn-save-draft d-inline-flex align-items-center justify-content-center gap-2 border shadow-xs"
          style={{
            borderColor: '#8B1216',
            color: '#8B1216',
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            height: '40px',
            padding: '0 22px',
            fontWeight: 600,
            fontSize: '13px',
            cursor: isSubmitting || loading ? 'not-allowed' : 'pointer',
            opacity: isSubmitting || loading ? 0.7 : 1
          }}
          title="Save as unpublished draft"
        >
          <Bookmark size={15} />
          <span>Save Draft</span>
        </button>

        <button
          type="button"
          onClick={() => handleSaveAction('Published')}
          disabled={isSubmitting || loading}
          className="btn btn-save-publish text-white d-inline-flex align-items-center justify-content-center gap-2 shadow-xs"
          style={{
            backgroundColor: '#8B1216',
            borderColor: '#8B1216',
            borderRadius: '8px',
            height: '40px',
            padding: '0 22px',
            fontWeight: 600,
            fontSize: '13px',
            cursor: isSubmitting || loading ? 'not-allowed' : 'pointer',
            opacity: isSubmitting || loading ? 0.7 : 1
          }}
          title="Save and publish marks"
        >
          <Send size={15} />
          <span>Save & Publish Marks</span>
        </button>
      </div>
    </div>
  );
}
