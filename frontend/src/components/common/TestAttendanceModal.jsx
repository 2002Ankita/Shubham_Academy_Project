import React, { useState, useEffect, useMemo } from 'react';
import Modal from './Modal';
import Button from './Button';
import studentService from '../../services/studentService';
import notificationService from '../../services/notificationService';
import {
  Calendar,
  Clock,
  BookOpen,
  GraduationCap,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Send,
  Printer,
  Save,
  CheckCheck,
  FileCheck
} from 'lucide-react';
import { toast } from 'react-toastify';
import { getUserBranch } from '../../utils/branchUtils';

export default function TestAttendanceModal({
  isOpen,
  onClose,
  exam = null,
  initialBranch = ''
}) {
  const activeBranch = initialBranch || getUserBranch() || 'Mangalvar Peth';

  // Form Fields
  const [testName, setTestName] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [standard, setStandard] = useState('11th Science');
  const [batch, setBatch] = useState('11th PCM');
  const [timing, setTiming] = useState('10:00 AM - 01:00 PM');
  const [subject, setSubject] = useState('Physics');
  const [totalMarks, setTotalMarks] = useState(100);

  // Student list and attendance records
  const [allStudents, setAllStudents] = useState([]);
  const [studentRows, setStudentRows] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [notifyingParents, setNotifyingParents] = useState(false);

  // Initialize form fields when exam changes
  useEffect(() => {
    if (exam) {
      setTestName(exam.title || exam.exam_name || exam.examName || 'Unit Test');
      const exDate = exam.date || exam.exam_date || exam.examDate;
      if (exDate && exDate !== 'N/A') {
        const cleanDate = typeof exDate === 'string' ? exDate.split('T')[0] : new Date(exDate).toISOString().split('T')[0];
        setAttendanceDate(cleanDate);
      } else {
        setAttendanceDate(new Date().toISOString().split('T')[0]);
      }

      const examStd = exam.standard || exam.examStandard || '11th Science';
      setStandard(examStd.includes('12') ? '12th Science' : '11th Science');

      const examBatch = exam.batch || exam.section || exam.classBatch || (examStd.includes('12') ? '12th PCM' : '11th PCM');
      setBatch(examBatch);

      const stTime = exam.startTime || exam.start_time || '10:00 AM';
      const enTime = exam.endTime || exam.end_time || '01:00 PM';
      setTiming(`${stTime} - ${enTime}`);

      setSubject(exam.subject || 'Physics');
      setTotalMarks(exam.maxMarks || exam.max_marks || exam.totalMarks || 100);
    } else {
      setTestName('Scheduled Assessment Test');
      setAttendanceDate(new Date().toISOString().split('T')[0]);
      setStandard('11th Science');
      setBatch('11th PCM');
      setTiming('10:00 AM - 01:00 PM');
      setSubject('Physics');
      setTotalMarks(100);
    }
  }, [exam, isOpen]);

  // Fetch students for attendance roster
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setLoadingStudents(true);

    const loadRoster = async () => {
      try {
        const list = await studentService.getAll();
        if (!isMounted) return;
        const validList = Array.isArray(list) ? list : [];
        setAllStudents(validList);

        // Filter students matching batch or standard and branch
        const normBatch = (batch || '').toLowerCase();
        const normStd = (standard || '').toLowerCase().includes('12') ? '12' : '11';

        const filtered = validList.filter(s => {
          const sBatch = (s.batch || '').toLowerCase();
          const sStd = (s.standard || '').toLowerCase();
          const sBranch = (s.branch || '').toLowerCase();
          
          // Check standard match
          const matchesStd = sStd.includes(normStd) || sBatch.includes(normStd);
          if (!matchesStd) return false;

          // Check batch keyword match if specified
          if (normBatch && normBatch !== 'general' && normBatch !== 'all') {
            const isPCM = normBatch.includes('pcm') && !normBatch.includes('pcmb');
            const isPCB = normBatch.includes('pcb') && !normBatch.includes('pcmb');
            const isPCMB = normBatch.includes('pcmb');

            if (isPCMB && !sBatch.includes('pcmb')) return false;
            if (isPCB && !sBatch.includes('pcb')) return false;
            if (isPCM && (!sBatch.includes('pcm') || sBatch.includes('pcmb'))) return false;
          }

          return true;
        });

        // Check if there are previously saved attendance records for this test & date
        const storageKey = `sa_test_att_${(testName || 'test').replace(/\s+/g, '_')}_${attendanceDate}_${batch}`;
        let savedRecords = null;
        try {
          const raw = localStorage.getItem(storageKey);
          if (raw) savedRecords = JSON.parse(raw);
        } catch (_) {}

        const studentRoster = (filtered.length > 0 ? filtered : validList.slice(0, 15)).map((st, idx) => {
          const saved = savedRecords ? savedRecords.find(r => r.studentId === (st.id || st._id)) : null;
          return {
            studentId: String(st.id || st._id || `ST-${idx + 1}`),
            rollNumber: st.roll_number || st.rollNumber || st.roll || `STD-${100 + idx}`,
            studentName: st.name || st.student_name || 'Student',
            parentMobile: st.parent_mobile || st.parent_phone || st.mobile_number || '',
            status: saved ? saved.status : 'Present', // 'Present', 'Absent', 'Exempted'
            paperSubmitted: saved ? Boolean(saved.paperSubmitted) : true,
            remarks: saved ? saved.remarks : ''
          };
        });

        setStudentRows(studentRoster);
      } catch (err) {
        console.warn('Failed to load students roster for test attendance:', err);
      } finally {
        if (isMounted) setLoadingStudents(false);
      }
    };

    loadRoster();
    return () => { isMounted = false; };
  }, [isOpen, batch, standard, testName, attendanceDate]);

  // Status Toggles
  const handleToggleStatus = (studentId, newStatus) => {
    setStudentRows(prev =>
      prev.map(r =>
        r.studentId === studentId
          ? {
              ...r,
              status: newStatus,
              paperSubmitted: newStatus === 'Present'
            }
          : r
      )
    );
  };

  const handleTogglePaper = (studentId) => {
    setStudentRows(prev =>
      prev.map(r =>
        r.studentId === studentId ? { ...r, paperSubmitted: !r.paperSubmitted } : r
      )
    );
  };

  const handleRemarkChange = (studentId, val) => {
    setStudentRows(prev =>
      prev.map(r =>
        r.studentId === studentId ? { ...r, remarks: val } : r
      )
    );
  };

  const handleMarkAll = (statusToSet) => {
    setStudentRows(prev =>
      prev.map(r => ({
        ...r,
        status: statusToSet,
        paperSubmitted: statusToSet === 'Present'
      }))
    );
  };

  // Stats
  const totalStudents = studentRows.length;
  const presentCount = studentRows.filter(r => r.status === 'Present').length;
  const absentCount = studentRows.filter(r => r.status === 'Absent').length;
  const exemptedCount = studentRows.filter(r => r.status === 'Exempted').length;
  const attendanceRate = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

  // Save Test Attendance
  const handleSaveAttendance = async () => {
    setSavingAttendance(true);
    try {
      const storageKey = `sa_test_att_${(testName || 'test').replace(/\s+/g, '_')}_${attendanceDate}_${batch}`;
      const payload = {
        testName,
        attendanceDate,
        standard,
        batch,
        timing,
        subject,
        totalMarks,
        totalStudents,
        presentCount,
        absentCount,
        records: studentRows,
        updatedAt: new Date().toISOString()
      };

      localStorage.setItem(storageKey, JSON.stringify(studentRows));
      localStorage.setItem(`${storageKey}_meta`, JSON.stringify(payload));

      toast.success(
        `Test Attendance recorded successfully! (${presentCount} Present, ${absentCount} Absent)`
      );
      onClose();
    } catch (err) {
      console.error('Error saving test attendance:', err);
      toast.error('Failed to save test attendance records.');
    } finally {
      setSavingAttendance(false);
    }
  };

  // Notify Absent Students' Parents via SMS / WhatsApp
  const handleNotifyAbsentParents = async () => {
    const absentees = studentRows.filter(r => r.status === 'Absent');
    if (absentees.length === 0) {
      toast.info('No students marked absent for this test.');
      return;
    }

    setNotifyingParents(true);
    try {
      const dispatchPayload = {
        testName,
        subject,
        batch,
        testDate: attendanceDate,
        testTime: timing,
        students: absentees.map(a => ({
          student_id: a.studentId,
          name: a.studentName,
          roll_number: a.rollNumber,
          parent_mobile: a.parentMobile
        })),
        channels: ['SMS', 'WhatsApp']
      };

      notificationService.recordTestAttendanceDispatch(dispatchPayload);

      toast.success(
        `Dispatched test absence alerts to ${absentees.length} parents via SMS & WhatsApp!`
      );
    } catch (err) {
      console.error('Failed to dispatch test absence alerts:', err);
      toast.error('Failed to dispatch parent notifications.');
    } finally {
      setNotifyingParents(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Scheduled Test Attendance & Submission Register"
      size="xl"
    >
      <div className="d-flex flex-column gap-3.5">
        {/* Banner with Overview */}
        <div className="p-3 bg-light rounded-3 border d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3">
          <div>
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-danger-subtle text-danger border border-danger-subtle fw-semibold px-2 py-0.5 rounded-pill" style={{ fontSize: '11px' }}>
                Test Day Attendance
              </span>
              <h5 className="fw-bold text-sa-charcoal m-0 fs-6">
                {testName || 'Examination Attendance'}
              </h5>
            </div>
            <span className="small text-muted d-block mt-1" style={{ fontSize: '12px' }}>
              Mark student attendance for the scheduled test day, track question paper submissions, and dispatch absence SMS alerts to parents.
            </span>
          </div>

          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-success-subtle text-success border border-success-subtle fw-bold px-3 py-1.5 rounded-pill" style={{ fontSize: '12px' }}>
              ✓ {presentCount} / {totalStudents} Present ({attendanceRate}%)
            </span>
            {absentCount > 0 && (
              <span className="badge bg-danger-subtle text-danger border border-danger-subtle fw-bold px-3 py-1.5 rounded-pill" style={{ fontSize: '12px' }}>
                ✕ {absentCount} Absent
              </span>
            )}
          </div>
        </div>

        {/* Required Metadata Fields Form */}
        <div className="row g-2.5 p-3 rounded-3" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
          {/* Test Name */}
          <div className="col-12 col-md-6 col-lg-4">
            <label className="form-label small fw-semibold text-sa-charcoal mb-1 d-flex align-items-center gap-1">
              <BookOpen size={13} className="text-sa-maroon" />
              <span>Test / Exam Name <span className="text-danger">*</span></span>
            </label>
            <input
              type="text"
              className="form-control form-control-sm fw-semibold"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              placeholder="e.g. Wave Optics Unit Test 1"
              required
              style={{ height: '34px', fontSize: '12.5px' }}
            />
          </div>

          {/* Attendance Date */}
          <div className="col-12 col-md-6 col-lg-2">
            <label className="form-label small fw-semibold text-sa-charcoal mb-1 d-flex align-items-center gap-1">
              <Calendar size={13} className="text-sa-maroon" />
              <span>Test Date <span className="text-danger">*</span></span>
            </label>
            <input
              type="date"
              className="form-control form-control-sm fw-semibold"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              required
              style={{ height: '34px', fontSize: '12.5px' }}
            />
          </div>

          {/* Standard / Class (11th / 12th) */}
          <div className="col-12 col-md-6 col-lg-3">
            <label className="form-label small fw-semibold text-sa-charcoal mb-1 d-flex align-items-center gap-1">
              <GraduationCap size={13} className="text-sa-maroon" />
              <span>Class / Standard <span className="text-danger">*</span></span>
            </label>
            <select
              className="form-select form-select-sm fw-semibold"
              value={standard}
              onChange={(e) => {
                const s = e.target.value;
                setStandard(s);
                setBatch(s.includes('12') ? '12th PCM' : '11th PCM');
              }}
              required
              style={{ height: '34px', fontSize: '12.5px' }}
            >
              <option value="11th Science">📘 11th Standard (Science)</option>
              <option value="12th Science">📙 12th Standard (Science)</option>
            </select>
          </div>

          {/* Batch */}
          <div className="col-12 col-md-6 col-lg-3">
            <label className="form-label small fw-semibold text-sa-charcoal mb-1 d-flex align-items-center gap-1">
              <Users size={13} className="text-sa-maroon" />
              <span>Batch <span className="text-danger">*</span></span>
            </label>
            <select
              className="form-select form-select-sm fw-semibold"
              value={batch}
              onChange={(e) => setBatch(e.target.value)}
              required
              style={{ height: '34px', fontSize: '12.5px' }}
            >
              {standard.includes('12') ? (
                <>
                  <option value="12th PCM">12th PCM</option>
                  <option value="12th PCB">12th PCB</option>
                  <option value="12th PCMB">12th PCMB</option>
                  <option value="12th pcm Mangalvar Peth (Morning)">12th PCM Mangalwar Peth (Morning)</option>
                  <option value="12th pcm Mangalvar Peth (Afternoon)">12th PCM Mangalwar Peth (Afternoon)</option>
                  <option value="12th pcm tarabai park">12th PCM Tarabai Park</option>
                </>
              ) : (
                <>
                  <option value="11th PCM">11th PCM</option>
                  <option value="11th PCB">11th PCB</option>
                  <option value="11th PCMB">11th PCMB</option>
                  <option value="11th pcm Mangalvar Peth (Morning)">11th PCM Mangalwar Peth (Morning)</option>
                  <option value="11th pcm Mangalvar Peth (Afternoon)">11th PCM Mangalwar Peth (Afternoon)</option>
                  <option value="11th pcm tarabai park">11th PCM Tarabai Park</option>
                </>
              )}
            </select>
          </div>

          {/* Timing / Slot */}
          <div className="col-12 col-md-6 col-lg-4">
            <label className="form-label small fw-semibold text-sa-charcoal mb-1 d-flex align-items-center gap-1">
              <Clock size={13} className="text-sa-maroon" />
              <span>Timing / Exam Slot <span className="text-danger">*</span></span>
            </label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={timing}
              onChange={(e) => setTiming(e.target.value)}
              placeholder="e.g. 10:00 AM - 01:00 PM"
              required
              style={{ height: '34px', fontSize: '12.5px' }}
            />
          </div>

          {/* Subject */}
          <div className="col-12 col-md-6 col-lg-4">
            <label className="form-label small fw-semibold text-sa-charcoal mb-1">
              Subject <span className="text-danger">*</span>
            </label>
            <select
              className="form-select form-select-sm fw-semibold"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              style={{ height: '34px', fontSize: '12.5px' }}
            >
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Biology">Biology</option>
              <option value="Full Mock Test (PCMB)">Full Mock Test (PCMB)</option>
            </select>
          </div>

          {/* Total Marks */}
          <div className="col-12 col-md-6 col-lg-4">
            <label className="form-label small fw-semibold text-sa-charcoal mb-1">
              Total Marks
            </label>
            <input
              type="number"
              className="form-control form-control-sm"
              value={totalMarks}
              onChange={(e) => setTotalMarks(e.target.value)}
              placeholder="e.g. 100"
              style={{ height: '34px', fontSize: '12.5px' }}
            />
          </div>
        </div>

        {/* Quick Batch Actions Toolbar */}
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 p-2 bg-white border rounded-2">
          <div className="d-flex align-items-center gap-1.5 flex-wrap">
            <span className="small fw-bold text-sa-charcoal me-1" style={{ fontSize: '12px' }}>
              Quick Actions:
            </span>
            <button
              type="button"
              className="btn btn-xs btn-outline-success bg-white fw-semibold d-inline-flex align-items-center gap-1 px-2.5 py-1 rounded-2 shadow-2xs"
              onClick={() => handleMarkAll('Present')}
              style={{ fontSize: '11.5px' }}
            >
              <CheckCheck size={13} />
              <span>Mark All Present</span>
            </button>
            <button
              type="button"
              className="btn btn-xs btn-outline-danger bg-white fw-semibold d-inline-flex align-items-center gap-1 px-2.5 py-1 rounded-2 shadow-2xs"
              onClick={() => handleMarkAll('Absent')}
              style={{ fontSize: '11.5px' }}
            >
              <XCircle size={13} />
              <span>Mark All Absent</span>
            </button>
          </div>

          <div className="d-flex align-items-center gap-2">
            {absentCount > 0 && (
              <button
                type="button"
                className="btn btn-xs btn-outline-danger fw-semibold d-inline-flex align-items-center gap-1.5 px-3 py-1 rounded-2 shadow-2xs"
                onClick={handleNotifyAbsentParents}
                disabled={notifyingParents}
                style={{ fontSize: '11.5px', backgroundColor: '#FFF5F5', borderColor: '#FCA5A5' }}
                title="Send automated absent alert SMS to parents of students who missed this test"
              >
                <Send size={12} />
                <span>Notify {absentCount} Absent Parents (SMS)</span>
              </button>
            )}

            <button
              type="button"
              className="btn btn-xs btn-outline-dark fw-semibold d-inline-flex align-items-center gap-1 px-2.5 py-1 rounded-2 shadow-2xs"
              onClick={() => window.print()}
              style={{ fontSize: '11.5px' }}
            >
              <Printer size={12} />
              <span>Print Register</span>
            </button>
          </div>
        </div>

        {/* Student Test Attendance Table */}
        <div className="table-responsive border rounded-3 overflow-hidden" style={{ maxHeight: '420px', overflowY: 'auto' }}>
          <table className="table table-hover table-sm align-middle m-0" style={{ fontSize: '12.5px' }}>
            <thead style={{ backgroundColor: '#FFF5F5', position: 'sticky', top: 0, zIndex: 1, borderBottom: '1.5px solid #FEE2E2' }}>
              <tr>
                <th style={{ width: '45px' }} className="text-center">#</th>
                <th style={{ width: '100px' }}>Roll No</th>
                <th>Student Full Name</th>
                <th style={{ width: '120px' }}>Parent Mobile</th>
                <th style={{ width: '170px' }} className="text-center">Test Attendance</th>
                <th style={{ width: '140px' }} className="text-center">Paper Submitted</th>
                <th style={{ width: '180px' }}>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {loadingStudents ? (
                <tr>
                  <td colSpan={7} className="text-center py-4 text-muted">
                    Loading student roster for {batch}...
                  </td>
                </tr>
              ) : studentRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-4 text-muted">
                    No enrolled students found for {batch}.
                  </td>
                </tr>
              ) : (
                studentRows.map((st, idx) => {
                  const isP = st.status === 'Present';
                  const isA = st.status === 'Absent';
                  const isE = st.status === 'Exempted';

                  return (
                    <tr key={st.studentId}>
                      <td className="text-center text-muted fw-semibold">{idx + 1}</td>
                      <td className="fw-bold text-sa-charcoal">{st.rollNumber}</td>
                      <td>
                        <span className="fw-semibold text-sa-charcoal d-block">{st.studentName}</span>
                      </td>
                      <td className="text-muted font-monospace" style={{ fontSize: '11.5px' }}>
                        {st.parentMobile || '--'}
                      </td>
                      <td className="text-center">
                        <div className="btn-group btn-group-sm" role="group">
                          <button
                            type="button"
                            className={`btn btn-xs fw-bold px-2 py-0.5 ${isP ? 'btn-success text-white' : 'btn-outline-success bg-white text-success'}`}
                            style={{ fontSize: '11px', minWidth: '60px' }}
                            onClick={() => handleToggleStatus(st.studentId, 'Present')}
                          >
                            ✓ Present
                          </button>
                          <button
                            type="button"
                            className={`btn btn-xs fw-bold px-2 py-0.5 ${isA ? 'btn-danger text-white' : 'btn-outline-danger bg-white text-danger'}`}
                            style={{ fontSize: '11px', minWidth: '60px' }}
                            onClick={() => handleToggleStatus(st.studentId, 'Absent')}
                          >
                            ✕ Absent
                          </button>
                          <button
                            type="button"
                            className={`btn btn-xs fw-semibold px-1.5 py-0.5 ${isE ? 'btn-secondary text-white' : 'btn-outline-secondary bg-white text-muted'}`}
                            style={{ fontSize: '10px' }}
                            onClick={() => handleToggleStatus(st.studentId, 'Exempted')}
                            title="Exempted from this test"
                          >
                            Exempt
                          </button>
                        </div>
                      </td>
                      <td className="text-center">
                        <div className="form-check form-check-inline m-0">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            id={`paper_${st.studentId}`}
                            checked={Boolean(st.paperSubmitted)}
                            disabled={!isP}
                            onChange={() => handleTogglePaper(st.studentId)}
                            style={{ cursor: isP ? 'pointer' : 'not-allowed' }}
                          />
                          <label
                            className="form-check-label small ms-1"
                            htmlFor={`paper_${st.studentId}`}
                            style={{ fontSize: '11.5px', cursor: isP ? 'pointer' : 'default', color: isP ? '#15803D' : '#94A3B8' }}
                          >
                            {st.paperSubmitted ? 'Submitted' : 'Pending'}
                          </label>
                        </div>
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm py-0.5 px-2"
                          placeholder="e.g. Left early, Completed 100%"
                          value={st.remarks || ''}
                          onChange={(e) => handleRemarkChange(st.studentId, e.target.value)}
                          style={{ height: '28px', fontSize: '11.5px' }}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Footer Controls */}
        <div className="d-flex align-items-center justify-content-between pt-2 border-top">
          <span className="small text-muted" style={{ fontSize: '12px' }}>
            Records will be saved to Academy Test Register and linked with results.
          </span>
          <div className="d-flex align-items-center gap-2">
            <Button variant="outline" onClick={onClose} disabled={savingAttendance}>
              Cancel
            </Button>
            <Button
              variant="primary"
              icon={Save}
              loading={savingAttendance}
              onClick={handleSaveAttendance}
              disabled={studentRows.length === 0}
            >
              Save Test Attendance
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
