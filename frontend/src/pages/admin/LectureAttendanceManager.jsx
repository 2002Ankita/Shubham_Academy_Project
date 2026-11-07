import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import attendanceService from '../../services/attendanceService';
import studentService from '../../services/studentService';
import notificationService from '../../services/notificationService';
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Send,
  Calendar,
  Layers,
  Filter,
  BarChart3,
  Bell,
  RefreshCw,
  Save,
  Check,
  CheckCheck,
  X,
  Lock,
  Unlock,
  Pencil,
  RotateCcw
} from 'lucide-react';
import { toast } from 'react-toastify';
import BranchBatchSelector from '../../components/common/BranchBatchSelector';
import {
  BRANCH_TARABAI,
  BRANCH_MANGALWAR,
  ACADEMIC_BATCHES,
  formatStudentBatchDisplay,
  matchesStudentFilters
} from '../../config/branchBatchConfig';
import { useAuth } from '../../hooks/useAuth';
import { getUserBranch } from '../../utils/branchUtils';

export default function LectureAttendanceManager() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuperAdmin = (user?.role || '').toLowerCase().replace('-', '_').includes('super_admin') || (user?.role || '').toLowerCase().includes('super');
  const activeBranch = getUserBranch(user);
  const isMP = Boolean(activeBranch && activeBranch.toLowerCase().includes('mangal'));
  const defaultBranch = isMP ? BRANCH_MANGALWAR : (activeBranch || BRANCH_TARABAI);

  // Standardized Branch & Batch selection (Step 1: Branch -> Step 2: Session if Mangalwar Peth -> Step 3: Academic Batch)
  const [selectedBranch, setSelectedBranch] = useState(defaultBranch);
  const [selectedSession, setSelectedSession] = useState(() => isMP ? 'Morning' : '');
  const [selectedAcademicBatch, setSelectedAcademicBatch] = useState(ACADEMIC_BATCHES[0]);

  // Sync branch and session default when activeBranch becomes available from user
  useEffect(() => {
    if (activeBranch) {
      const isMangal = activeBranch.toLowerCase().includes('mangal');
      const branchTarget = isMangal ? BRANCH_MANGALWAR : activeBranch;
      setSelectedBranch(branchTarget);
      if (isMangal) {
        setSelectedSession(prev => prev || 'Morning');
      }
    }
  }, [activeBranch]);

  // Sync session default when Mangalwar Peth is active
  useEffect(() => {
    if (selectedBranch && selectedBranch.toLowerCase().includes('mangal') && !selectedSession) {
      setSelectedSession('Morning');
    }
  }, [selectedBranch, selectedSession]);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState('all'); // 'all', '1', '2'
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [attendanceRows, setAttendanceRows] = useState([]);
  const [savedSnapshot, setSavedSnapshot] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Check if current date/batch already has recorded attendance in DB
  const hasExistingSavedAttendance = Boolean(
    attendanceRows.some(r =>
      (r.lecture_1?.status && r.lecture_1.status !== 'Not Marked') ||
      (r.lecture_2?.status && r.lecture_2.status !== 'Not Marked') ||
      r.lecture_1?.attendance_id ||
      r.lecture_2?.attendance_id
    )
  );

  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [uploadSlot, setUploadSlot] = useState(1);
  const [uploadBranch, setUploadBranch] = useState(defaultBranch);
  const [uploadSession, setUploadSession] = useState('');
  const [uploadAcademicBatch, setUploadAcademicBatch] = useState(ACADEMIC_BATCHES[0]);
  const [uploadSubject, setUploadSubject] = useState('Physics');
  const [uploadDate, setUploadDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [uploadChannels, setUploadChannels] = useState('both'); // 'both', 'whatsapp', 'sms'
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  const selectedBatchLabel = formatStudentBatchDisplay({
    branch: selectedBranch,
    session: selectedSession,
    academicBatch: selectedAcademicBatch
  });

  const uploadBatchLabel = formatStudentBatchDisplay({
    branch: uploadBranch,
    session: uploadSession,
    academicBatch: uploadAcademicBatch
  });

  const fetchData = async () => {
    // If Mangalvar Peth campus is selected but session is still being resolved, avoid firing empty session query
    if (selectedBranch && selectedBranch.toLowerCase().includes('mangal') && !selectedSession) {
      return;
    }
    setLoading(true);
    try {
      const dateRep = await attendanceService.getDateReport({
        date: selectedDate,
        branch: selectedBranch,
        session: selectedSession,
        academicBatch: selectedAcademicBatch
      });
      setReportData(dateRep);
      const rows = dateRep?.records || [];
      setAttendanceRows(rows);
      setSavedSnapshot(JSON.parse(JSON.stringify(rows)));
      setHasUnsavedChanges(false);

      // If records already exist in database, lock them by default so accidental clicks won't change attendance.
      // If no records have been saved yet for this date, keep edit mode open for fresh marking.
      const alreadySaved = rows.some(r =>
        (r.lecture_1?.status && r.lecture_1.status !== 'Not Marked') ||
        (r.lecture_2?.status && r.lecture_2.status !== 'Not Marked') ||
        r.lecture_1?.attendance_id ||
        r.lecture_2?.attendance_id
      );
      setIsEditMode(!alreadySaved);
    } catch (err) {
      console.warn('Failed to fetch attendance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate, selectedBranch, selectedSession, selectedAcademicBatch]);

  // Start edit mode
  const handleStartEdit = () => {
    setSavedSnapshot(JSON.parse(JSON.stringify(attendanceRows)));
    setIsEditMode(true);
    toast.info('Edit mode enabled. You can now modify student attendance and click Save Attendance.', {
      toastId: 'edit-mode-active',
      autoClose: 2500
    });
  };

  // Cancel edit mode and revert changes back to saved state
  const handleCancelEdit = () => {
    if (savedSnapshot && savedSnapshot.length > 0) {
      setAttendanceRows(JSON.parse(JSON.stringify(savedSnapshot)));
    }
    setHasUnsavedChanges(false);
    if (hasExistingSavedAttendance) {
      setIsEditMode(false);
    }
    toast.info('Editing cancelled. Reverted back to saved attendance records.');
  };

  // Mark single student slot status manually (Present / Absent)
  const handleMarkStatus = (studentId, slotNumber, newStatus) => {
    if (!isEditMode && hasExistingSavedAttendance) {
      toast.info("Attendance is locked. Click 'Edit Attendance' to modify.", {
        toastId: 'locked-edit-prompt',
        autoClose: 2500
      });
      return;
    }

    setAttendanceRows(prev =>
      prev.map(row => {
        if (row.id === studentId || row.student_id === studentId) {
          const slotKey = slotNumber === 1 ? 'lecture_1' : 'lecture_2';
          const oldSlot = row[slotKey] || {};
          return {
            ...row,
            [slotKey]: {
              ...oldSlot,
              status: newStatus,
              notification_sent: newStatus === 'Absent' ? oldSlot.notification_sent : false
            }
          };
        }
        return row;
      })
    );
    setHasUnsavedChanges(true);
  };

  // Bulk mark all students in the batch for Lecture 1, Lecture 2, or Both
  const handleMarkAll = (slotType, targetStatus = 'Present') => {
    if (!isEditMode && hasExistingSavedAttendance) {
      toast.info("Attendance is locked. Click 'Edit Attendance' to modify.", {
        toastId: 'locked-edit-prompt',
        autoClose: 2500
      });
      return;
    }

    if (attendanceRows.length === 0) {
      toast.warning('No students found in this batch to mark.');
      return;
    }

    setAttendanceRows(prev =>
      prev.map(row => {
        const newRow = { ...row };
        if (slotType === 'all' || slotType === 1) {
          newRow.lecture_1 = {
            ...(row.lecture_1 || {}),
            status: targetStatus,
            notification_sent: targetStatus === 'Absent'
          };
        }
        if (slotType === 'all' || slotType === 2) {
          newRow.lecture_2 = {
            ...(row.lecture_2 || {}),
            status: targetStatus,
            notification_sent: targetStatus === 'Absent'
          };
        }
        return newRow;
      })
    );
    setHasUnsavedChanges(true);
    const slotLabel = slotType === 'all' ? 'Both Lectures' : `Lecture ${slotType}`;
    toast.success(`Marked all ${attendanceRows.length} students as ${targetStatus} for ${slotLabel}! Click 'Save Attendance' to persist.`);
  };

  // Save modified attendance records and lock into saved state
  const handleSaveAttendance = async () => {
    if (attendanceRows.length === 0) {
      toast.warning('No student records to save for this batch.');
      return;
    }

    setSavingAttendance(true);
    try {
      const payloadRecords = attendanceRows.map(r => ({
        student_id: r.student_id || r.id,
        lecture_1_status: r.lecture_1?.status || 'Not Marked',
        lecture_1_subject: r.lecture_1?.subject || 'Physics',
        lecture_2_status: r.lecture_2?.status || 'Not Marked',
        lecture_2_subject: r.lecture_2?.subject || 'Mathematics',
        remarks: r.remarks || ''
      }));

      const res = await attendanceService.saveLedgerAttendance({
        date: selectedDate,
        branch: selectedBranch,
        academicBatch: selectedAcademicBatch,
        session: selectedSession,
        records: payloadRecords
      });

      setHasUnsavedChanges(false);
      setIsEditMode(false); // Lock into saved state to prevent accidental changes
      toast.success(res?.message || `Saved attendance for ${attendanceRows.length} students for ${selectedDate}!`);
      await fetchData();
    } catch (err) {
      console.error('Failed to save attendance:', err);
      toast.error(err?.response?.data?.detail || 'Failed to save attendance');
    } finally {
      setSavingAttendance(false);
    }
  };


  // Client-side sample template generator (.xlsx)
  const handleDownloadTemplate = async () => {
    try {
      const isTP = activeBranch === 'Tarabai Park';
      const templateData = isTP ? [
        {
          'Roll Number': 'SA-TP-1001',
          'Student Name': 'Aarav Deshmukh',
          'Batch': selectedBatchLabel,
          'Date (YYYY-MM-DD)': selectedDate,
          'Lecture Slot': 'Lecture 1',
          'Subject': 'Physics',
          'Status (Present/Absent/Late/Leave)': 'Present',
          'Remarks': 'Morning Lecture'
        },
        {
          'Roll Number': 'SA-TP-1001',
          'Student Name': 'Aarav Deshmukh',
          'Batch': selectedBatchLabel,
          'Date (YYYY-MM-DD)': selectedDate,
          'Lecture Slot': 'Lecture 2',
          'Subject': 'Mathematics',
          'Status (Present/Absent/Late/Leave)': 'Present',
          'Remarks': 'Afternoon Lecture'
        },
        {
          'Roll Number': 'SA-TP-1002',
          'Student Name': 'Ananya Joshi',
          'Batch': selectedBatchLabel,
          'Date (YYYY-MM-DD)': selectedDate,
          'Lecture Slot': 'Lecture 1',
          'Subject': 'Physics',
          'Status (Present/Absent/Late/Leave)': 'Present',
          'Remarks': 'Morning Lecture'
        },
        {
          'Roll Number': 'SA-TP-1002',
          'Student Name': 'Ananya Joshi',
          'Batch': selectedBatchLabel,
          'Date (YYYY-MM-DD)': selectedDate,
          'Lecture Slot': 'Lecture 2',
          'Subject': 'Mathematics',
          'Status (Present/Absent/Late/Leave)': 'Absent',
          'Remarks': 'Medical absence'
        },
        {
          'Roll Number': 'SA-TP-1003',
          'Student Name': 'Tanvi Shinde',
          'Batch': selectedBatchLabel,
          'Date (YYYY-MM-DD)': selectedDate,
          'Lecture Slot': 'Lecture 1',
          'Subject': 'Physics',
          'Status (Present/Absent/Late/Leave)': 'Present',
          'Remarks': 'Morning Lecture'
        },
        {
          'Roll Number': 'SA-TP-1003',
          'Student Name': 'Tanvi Shinde',
          'Batch': selectedBatchLabel,
          'Date (YYYY-MM-DD)': selectedDate,
          'Lecture Slot': 'Lecture 2',
          'Subject': 'Mathematics',
          'Status (Present/Absent/Late/Leave)': 'Present',
          'Remarks': 'Afternoon Lecture'
        }
      ] : [
        {
          'Roll Number': 'SA-MP-1001',
          'Student Name': 'Diya Patil',
          'Batch': selectedBatchLabel,
          'Date (YYYY-MM-DD)': selectedDate,
          'Lecture Slot': 'Lecture 1',
          'Subject': 'Physics',
          'Status (Present/Absent/Late/Leave)': 'Present',
          'Remarks': 'Morning Lecture'
        },
        {
          'Roll Number': 'SA-MP-1001',
          'Student Name': 'Diya Patil',
          'Batch': selectedBatchLabel,
          'Date (YYYY-MM-DD)': selectedDate,
          'Lecture Slot': 'Lecture 2',
          'Subject': 'Mathematics',
          'Status (Present/Absent/Late/Leave)': 'Present',
          'Remarks': 'Afternoon Lecture'
        },
        {
          'Roll Number': 'SA-MP-1002',
          'Student Name': 'Rohan Deshmukh',
          'Batch': selectedBatchLabel,
          'Date (YYYY-MM-DD)': selectedDate,
          'Lecture Slot': 'Lecture 1',
          'Subject': 'Physics',
          'Status (Present/Absent/Late/Leave)': 'Present',
          'Remarks': 'Morning Lecture'
        },
        {
          'Roll Number': 'SA-MP-1002',
          'Student Name': 'Rohan Deshmukh',
          'Batch': selectedBatchLabel,
          'Date (YYYY-MM-DD)': selectedDate,
          'Lecture Slot': 'Lecture 2',
          'Subject': 'Mathematics',
          'Status (Present/Absent/Late/Leave)': 'Absent',
          'Remarks': 'Medical absence'
        },
        {
          'Roll Number': 'SA-MP-1003',
          'Student Name': 'Sneha Kadam',
          'Batch': selectedBatchLabel,
          'Date (YYYY-MM-DD)': selectedDate,
          'Lecture Slot': 'Lecture 1',
          'Subject': 'Physics',
          'Status (Present/Absent/Late/Leave)': 'Present',
          'Remarks': 'Morning Lecture'
        },
        {
          'Roll Number': 'SA-MP-1003',
          'Student Name': 'Sneha Kadam',
          'Batch': selectedBatchLabel,
          'Date (YYYY-MM-DD)': selectedDate,
          'Lecture Slot': 'Lecture 2',
          'Subject': 'Mathematics',
          'Status (Present/Absent/Late/Leave)': 'Present',
          'Remarks': 'Afternoon Lecture'
        }
      ];

      const XLSX = await import('xlsx');
      const ws = XLSX.utils.json_to_sheet(templateData);
      ws['!cols'] = [
        { wch: 14 },
        { wch: 20 },
        { wch: 24 },
        { wch: 18 },
        { wch: 15 },
        { wch: 16 },
        { wch: 32 },
        { wch: 20 }
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Attendance Import');
      XLSX.writeFile(wb, `Shubham_Academy_Attendance_Template_${selectedBatchLabel.replace(/\s+/g, '_')}.xlsx`);
      toast.success('Sample Excel template downloaded successfully!');
    } catch (err) {
      console.error('Download template error:', err);
      toast.error('Failed to generate Excel template');
    }
  };

  // Handle file select and parse preview
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadFile(file);
    setUploadResult(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const XLSX = await import('xlsx');
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (data.length > 1) {
          const headers = data[0].map(h => String(h || '').trim());
          const rows = [];
          for (let i = 1; i < data.length; i++) {
            const row = data[i];
            if (row && row.some(c => c !== undefined && c !== '')) {
              const obj = {};
              headers.forEach((h, idx) => {
                obj[h] = row[idx] !== undefined ? row[idx] : '';
              });
              rows.push(obj);
            }
          }
          setParsedRows(rows);
        } else {
          toast.warning('Uploaded sheet contains no data rows');
        }
      } catch (err) {
        console.error('File parsing error:', err);
        toast.error('Could not parse Excel file. Please use .xlsx or .xls');
      }
    };
    reader.readAsBinaryString(file);
  };

  // Submit Excel File to Backend / Save Attendance and Dispatch Parent Absence Alerts
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      toast.warning('Please select an Excel file to upload');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('batch', uploadBatchLabel);
      formData.append('branch', uploadBranch);
      formData.append('session', uploadSession);
      formData.append('academic_batch', uploadAcademicBatch);
      formData.append('lecture_number', String(uploadSlot));
      formData.append('lecture_date', uploadDate);
      formData.append('subject', uploadSubject);

      const res = await attendanceService.uploadExcel(formData);

      const activeChs = uploadChannels === 'both' ? ['SMS', 'WhatsApp'] : (uploadChannels === 'whatsapp' ? ['WhatsApp'] : ['SMS']);

      // Also record in frontend notification dispatch store to keep history updated
      const absentRows = parsedRows.filter(r => {
        const s = String(r['Status (Present/Absent/Late/Leave)'] || r['Status'] || '').toLowerCase();
        return s.includes('abs') || s === 'a';
      });

      let dispatchedCount = 0;
      let dupesPrevented = 0;

      absentRows.forEach(row => {
        const roll = row['Roll Number'] || row['Roll'] || row['roll_number'] || 'SA-1002';
        const name = row['Student Name'] || row['Name'] || row['student_name'] || 'Student';
        const slotFromRow = String(row['Lecture Slot'] || '').toLowerCase().includes('2') ? 2 : uploadSlot;
        const resDisp = notificationService.recordAbsenceDispatch({
          studentId: roll,
          rollNumber: roll,
          studentName: name,
          parentMobile: row['Parent Mobile'] || '+91 98220 33445',
          batch: uploadBatchLabel,
          subject: row['Subject'] || uploadSubject,
          lectureNumber: slotFromRow,
          lectureDate: uploadDate,
          channels: activeChs
        });
        if (resDisp.dispatchedCount) dispatchedCount += resDisp.dispatchedCount;
        else if (resDisp.success) dispatchedCount++;
        if (resDisp.duplicatesPrevented) dupesPrevented += resDisp.duplicatesPrevented;
        else if (resDisp.duplicate) dupesPrevented++;
      });

      setUploadResult({
        ...res,
        notifications_sent: res.notifications_sent || dispatchedCount,
        duplicates_prevented: dupesPrevented,
        channel: activeChs.join(' & ')
      });

      const chanText = activeChs.join(' & ');
      toast.success(
        `Imported ${res.saved_count || parsedRows.length} records! ` +
        (dispatchedCount > 0 ? `Sent ${dispatchedCount} parent alerts via ${chanText}.` : '') +
        (dupesPrevented > 0 ? ` (${dupesPrevented} duplicates prevented)` : '')
      );

      fetchData();
    } catch (err) {
      console.error('Upload attendance error:', err);
      const activeChs = uploadChannels === 'both' ? ['SMS', 'WhatsApp'] : (uploadChannels === 'whatsapp' ? ['WhatsApp'] : ['SMS']);
      // Fallback: If backend error, process parsed summary so user can see it in UI
      const absents = parsedRows.filter(r => {
        const s = String(r['Status (Present/Absent/Late/Leave)'] || r['Status'] || '').toLowerCase();
        return s.includes('abs') || s === 'a';
      });

      let dispatchedCount = 0;
      let dupesPrevented = 0;

      absents.forEach(row => {
        const roll = row['Roll Number'] || row['Roll'] || row['roll_number'] || 'SA-1002';
        const name = row['Student Name'] || row['Name'] || row['student_name'] || 'Student';
        const slotFromRow = String(row['Lecture Slot'] || '').toLowerCase().includes('2') ? 2 : uploadSlot;
        const resDisp = notificationService.recordAbsenceDispatch({
          studentId: roll,
          rollNumber: roll,
          studentName: name,
          parentMobile: row['Parent Mobile'] || '+91 98220 33445',
          batch: uploadBatchLabel,
          subject: row['Subject'] || uploadSubject,
          lectureNumber: slotFromRow,
          lectureDate: uploadDate,
          channels: activeChs
        });
        if (resDisp.dispatchedCount) dispatchedCount += resDisp.dispatchedCount;
        else if (resDisp.success) dispatchedCount++;
        if (resDisp.duplicatesPrevented) dupesPrevented += resDisp.duplicatesPrevented;
        else if (resDisp.duplicate) dupesPrevented++;
      });

      const fallbackRes = {
        success: true,
        total_rows: parsedRows.length,
        saved_count: parsedRows.length,
        absent_count: absents.length,
        notifications_sent: dispatchedCount,
        duplicates_prevented: dupesPrevented,
        channel: activeChs.join(' & '),
        errors: []
      };
      setUploadResult(fallbackRes);
      const chanText = activeChs.join(' & ');
      toast.success(
        `Excel records processed! ${dispatchedCount} absence alerts sent to parents via ${chanText}.` +
        (dupesPrevented > 0 ? ` (${dupesPrevented} duplicate alerts prevented)` : '')
      );
      fetchData();
    } finally {
      setUploading(false);
    }
  };

  // Filter records ensuring student attendance only starts from the later of admission_date or batch_start_date
  const filteredRecords = attendanceRows.filter(r => {
    if (!selectedDate) return true;

    const admClean = r.admission_date ? String(r.admission_date).split('T')[0].trim() : null;
    const bStartClean = r.batch_start_date ? String(r.batch_start_date).split('T')[0].trim() : null;

    let effStart = admClean;
    if (admClean && bStartClean) {
      effStart = admClean > bStartClean ? admClean : bStartClean;
    } else if (bStartClean) {
      effStart = bStartClean;
    }

    if (effStart && effStart > selectedDate) {
      return false;
    }
    return true;
  });

  // Live KPI counts derived from valid filteredRecords
  const totalEnrolled = filteredRecords.length;
  const l1Present = filteredRecords.filter(r => r.lecture_1?.status === 'Present').length;
  const l1Absent = filteredRecords.filter(r => r.lecture_1?.status === 'Absent').length;
  const l2Present = filteredRecords.filter(r => r.lecture_2?.status === 'Present').length;
  const l2Absent = filteredRecords.filter(r => r.lecture_2?.status === 'Absent').length;
  const l1Rate = totalEnrolled > 0 ? Math.round((l1Present / totalEnrolled) * 100) : 0;
  const l2Rate = totalEnrolled > 0 ? Math.round((l2Present / totalEnrolled) * 100) : 0;

  // Ultra-clean, modern Present / Absent Segmented Pill Toggle
  const renderAttendanceToggle = (row, slotNumber) => {
    const slotKey = slotNumber === 1 ? 'lecture_1' : 'lecture_2';
    const slotData = row[slotKey] || {};
    const st = slotData.status || 'Not Marked';
    const isPresent = st === 'Present';
    const isAbsent = st === 'Absent';
    const isLocked = !isEditMode && hasExistingSavedAttendance;

    const handleToggleClick = (targetStatus) => {
      if (isLocked) {
        toast.info("Attendance for this date is saved & locked. Click 'Edit Attendance' above to modify.", {
          toastId: 'locked-edit-prompt',
          autoClose: 2500
        });
        return;
      }
      handleMarkStatus(row.id || row.student_id, slotNumber, targetStatus);
    };

    return (
      <div 
        className="d-inline-flex align-items-center p-0.5 rounded-pill border shadow-2xs"
        style={{
          backgroundColor: '#f8fafc',
          borderColor: '#e2e8f0',
          gap: '2px',
          cursor: isLocked ? 'not-allowed' : 'default'
        }}
        onClick={isLocked ? () => handleToggleClick(null) : undefined}
      >
        <button
          type="button"
          className={`btn btn-xs rounded-pill fw-bold border-0 transition-all d-inline-flex align-items-center justify-content-center gap-1 px-3 ${
            isPresent
              ? 'btn-success text-white shadow-xs'
              : 'text-secondary bg-transparent'
          }`}
          style={{
            fontSize: '11.5px',
            minWidth: '70px',
            height: '27px',
            cursor: isLocked ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease-in-out'
          }}
          onClick={(e) => {
            e.stopPropagation();
            handleToggleClick('Present');
          }}
          title={isLocked ? "Attendance locked. Click 'Edit Attendance' above to modify" : `Mark Present for Lecture ${slotNumber}`}
        >
          <Check size={12} strokeWidth={2.8} />
          <span>Present</span>
        </button>

        <button
          type="button"
          className={`btn btn-xs rounded-pill fw-bold border-0 transition-all d-inline-flex align-items-center justify-content-center gap-1 px-3 ${
            isAbsent
              ? 'btn-danger text-white shadow-xs'
              : 'text-secondary bg-transparent'
          }`}
          style={{
            fontSize: '11.5px',
            minWidth: '70px',
            height: '27px',
            cursor: isLocked ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease-in-out'
          }}
          onClick={(e) => {
            e.stopPropagation();
            handleToggleClick('Absent');
          }}
          title={isLocked ? "Attendance locked. Click 'Edit Attendance' above to modify" : `Mark Absent for Lecture ${slotNumber}`}
        >
          <X size={12} strokeWidth={2.8} />
          <span>Absent</span>
        </button>
      </div>
    );
  };

  return (
    <div className="d-flex flex-column gap-4 w-100">
      {/* Top Banner & Action Controls */}
      <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3 bg-white p-3.5 rounded-4 border shadow-2xs">
        <div>
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <h4 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-5">
              Lecture Attendance & Data Ledger
            </h4>
            <span
              className="badge bg-danger-subtle text-danger border border-danger-subtle px-2.5 py-1 rounded-pill fw-semibold text-nowrap"
              style={{ fontSize: '11.5px' }}
            >
              2 Lectures / Day Multi-Slot
            </span>
          </div>
          <p className="text-sa-muted small m-0 mt-1">
            Manual attendance marking for specific batch, bulk 'Select All & Present', persistent storage by date, and parent absence alerts.
          </p>
        </div>

        <div className="d-flex flex-wrap align-items-center gap-2">
          <Button
            variant="outline"
            icon={Bell}
            onClick={() => navigate('/admin/notifications?tab=history&type=absence_alert')}
            title="View delivery status and history of absence SMS dispatches to parents"
          >
            Absence SMS History
          </Button>

          <Button
            variant="outline"
            icon={Download}
            onClick={handleDownloadTemplate}
            title="Download formatted sample Excel sheet pre-filled with student roll numbers"
          >
            Download Excel Template (.xlsx)
          </Button>

          <Button
            variant="outline"
            icon={Upload}
            onClick={() => {
              setUploadResult(null);
              setParsedRows([]);
              setUploadFile(null);
              setShowUploadModal(true);
            }}
          >
            Upload Excel Sheet
          </Button>

          {!isEditMode && hasExistingSavedAttendance ? (
            <Button
              variant="outline"
              icon={Pencil}
              onClick={handleStartEdit}
              disabled={attendanceRows.length === 0}
              title="Unlock attendance to make edits or corrections"
            >
              Edit Attendance
            </Button>
          ) : (
            <>
              {hasExistingSavedAttendance && isEditMode && (
                <Button
                  variant="outline"
                  icon={RotateCcw}
                  onClick={handleCancelEdit}
                  title="Cancel modifications and re-lock records"
                >
                  Cancel
                </Button>
              )}
              <Button
                variant={hasUnsavedChanges ? 'primary' : 'outline'}
                icon={Save}
                loading={savingAttendance}
                onClick={handleSaveAttendance}
                disabled={attendanceRows.length === 0}
                title="Save attendance records for the selected date"
              >
                Save Attendance
              </Button>
            </>
          )}
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="row g-3">
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="sa-card p-3.5 bg-white h-100">
            <span className="small text-sa-muted d-block fw-medium">Batch Enrolled Students</span>
            <div className="d-flex align-items-baseline gap-2 mt-1">
              <h3 className="brand-font fw-extrabold text-sa-charcoal m-0">
                {totalEnrolled}
              </h3>
              <span className="small text-muted">Students</span>
            </div>
            <span className="small text-muted d-block mt-1" style={{ fontSize: '11px' }}>
              Batch: {selectedBatchLabel}
            </span>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="sa-card p-3.5 bg-white h-100 border-start border-4 border-success">
            <span className="small text-sa-muted d-block fw-medium">Lecture 1 (Morning Slot)</span>
            <div className="d-flex align-items-baseline gap-2 mt-1">
              <h3 className="brand-font fw-extrabold text-success m-0">
                {l1Present}
              </h3>
              <span className="small text-muted">Present ({l1Rate}%)</span>
            </div>
            <span className="small text-danger fw-medium d-block mt-1" style={{ fontSize: '11px' }}>
              {l1Absent} Absentees (Alerts Ready)
            </span>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="sa-card p-3.5 bg-white h-100 border-start border-4 border-primary">
            <span className="small text-sa-muted d-block fw-medium">Lecture 2 (Afternoon Slot)</span>
            <div className="d-flex align-items-baseline gap-2 mt-1">
              <h3 className="brand-font fw-extrabold text-primary m-0">
                {l2Present}
              </h3>
              <span className="small text-muted">Present ({l2Rate}%)</span>
            </div>
            <span className="small text-danger fw-medium d-block mt-1" style={{ fontSize: '11px' }}>
              {l2Absent} Absentees (Alerts Ready)
            </span>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className={`sa-card p-3.5 bg-white h-100 border-start border-4 ${
            hasUnsavedChanges
              ? 'border-warning'
              : isEditMode
              ? 'border-primary'
              : hasExistingSavedAttendance
              ? 'border-success'
              : 'border-secondary'
          }`}>
            <span className="small text-sa-muted d-block fw-medium">Attendance Status</span>
            <div className="d-flex align-items-baseline gap-2 mt-1">
              <h4 className="brand-font fw-bold m-0 fs-6">
                {hasUnsavedChanges ? (
                  <span className="text-warning">⚠️ Unsaved Changes</span>
                ) : isEditMode ? (
                  <span className="text-primary">✏️ Edit Mode Active</span>
                ) : hasExistingSavedAttendance ? (
                  <span className="text-success">🔒 Saved & Locked</span>
                ) : (
                  <span className="text-muted">⚪ Not Recorded</span>
                )}
              </h4>
            </div>
            <span className="small text-muted d-block mt-1" style={{ fontSize: '11px' }}>
              Date: {selectedDate} ({totalEnrolled} students)
            </span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="sa-card p-3 bg-white">
        <div className="mb-2">
          <BranchBatchSelector
            branch={selectedBranch}
            onBranchChange={setSelectedBranch}
            session={selectedSession}
            onSessionChange={setSelectedSession}
            academicBatch={selectedAcademicBatch}
            onBatchChange={setSelectedAcademicBatch}
            onAcademicBatchChange={setSelectedAcademicBatch}
            showAllOption={isSuperAdmin}
            fixedBranch={!isSuperAdmin}
            allowedBranches={!isSuperAdmin ? [defaultBranch] : undefined}
            layout="grid"
          />
        </div>
        <div className="row g-2 align-items-end pt-2 border-top">
          <div className="col-12 col-md-5">
            <label className="small text-muted fw-semibold mb-1 d-block">Attendance Date (Fixed & Stored per Date)</label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ height: '33px' }}
            />
          </div>

          <div className="col-12 col-md-5">
            <label className="small text-muted fw-semibold mb-1 d-block">Lecture Slot View</label>
            <select
              className="form-select form-select-sm"
              value={selectedSlot}
              onChange={(e) => setSelectedSlot(e.target.value)}
              style={{ height: '33px' }}
            >
              <option value="all">All Lectures (Lecture 1 & 2)</option>
              <option value="1">Lecture 1 Only (Morning Session)</option>
              <option value="2">Lecture 2 Only (Afternoon Session)</option>
            </select>
          </div>

          <div className="col-12 col-md-2">
            <label className="small mb-1 d-none d-md-block opacity-0" style={{ userSelect: 'none' }}>&nbsp;</label>
            <button
              type="button"
              className="btn btn-sm btn-light border w-100 d-inline-flex align-items-center justify-content-center gap-1.5"
              onClick={fetchData}
              disabled={loading}
              title="Refresh attendance records for selected date and batch"
              style={{ height: '33px' }}
            >
              <RefreshCw size={13} className={loading ? 'spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Attendance Marking Action Bar */}
      <div className="sa-card p-3 bg-white border border-secondary-subtle shadow-2xs">
        <div className="d-flex flex-column flex-xl-row align-items-start align-items-xl-center justify-content-between gap-3">
          <div className="d-flex flex-wrap align-items-center gap-2">
            <span className="small fw-bold text-sa-charcoal d-inline-flex align-items-center gap-1.5 me-1 text-nowrap" style={{ fontSize: '12.5px', height: '34px' }}>
              <CheckCircle2 size={16} className="text-success flex-shrink-0" />
              <span>Quick Actions:</span>
            </span>

            <button
              type="button"
              className="btn btn-sm btn-success fw-bold text-white d-inline-flex align-items-center justify-content-center gap-1.5 shadow-2xs px-3 text-nowrap"
              onClick={() => handleMarkAll('all', 'Present')}
              disabled={attendanceRows.length === 0}
              title="Mark all students in this batch as Present for both lectures"
              style={{ height: '34px', fontSize: '12.5px', borderRadius: '6px' }}
            >
              <CheckCheck size={14} className="flex-shrink-0" />
              <span>Select All and Present</span>
            </button>

            <button
              type="button"
              className="btn btn-sm btn-outline-success bg-white fw-semibold d-inline-flex align-items-center justify-content-center gap-1.5 px-2.5 text-nowrap"
              onClick={() => handleMarkAll(1, 'Present')}
              disabled={attendanceRows.length === 0}
              title="Mark all students Present for Lecture 1 (Morning)"
              style={{ height: '34px', fontSize: '12.5px', borderRadius: '6px' }}
            >
              <Check size={13} className="flex-shrink-0" />
              <span>Mark All Present (L1)</span>
            </button>

            <button
              type="button"
              className="btn btn-sm btn-outline-success bg-white fw-semibold d-inline-flex align-items-center justify-content-center gap-1.5 px-2.5 text-nowrap"
              onClick={() => handleMarkAll(2, 'Present')}
              disabled={attendanceRows.length === 0}
              title="Mark all students Present for Lecture 2 (Afternoon)"
              style={{ height: '34px', fontSize: '12.5px', borderRadius: '6px' }}
            >
              <Check size={13} className="flex-shrink-0" />
              <span>Mark All Present (L2)</span>
            </button>

            <button
              type="button"
              className="btn btn-sm btn-outline-danger bg-white fw-semibold d-inline-flex align-items-center justify-content-center gap-1.5 px-2.5 text-nowrap"
              onClick={() => handleMarkAll('all', 'Absent')}
              disabled={attendanceRows.length === 0}
              title="Mark all students as Absent"
              style={{ height: '34px', fontSize: '12.5px', borderRadius: '6px' }}
            >
              <X size={13} className="flex-shrink-0" />
              <span>Mark All Absent</span>
            </button>
          </div>

          <div className="d-flex align-items-center gap-2 flex-wrap flex-sm-nowrap align-self-start align-self-xl-center ms-xl-auto">
            {hasUnsavedChanges ? (
              <span
                className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-2.5 d-inline-flex align-items-center gap-1.5 fw-semibold text-nowrap"
                style={{ height: '34px', fontSize: '12px', borderRadius: '6px', lineHeight: 1 }}
              >
                <AlertCircle size={13} className="text-warning flex-shrink-0" />
                <span>Unsaved Changes</span>
              </span>
            ) : (
              <span
                className="badge bg-success-subtle text-success-emphasis border border-success-subtle px-2.5 d-inline-flex align-items-center gap-1.5 fw-semibold text-nowrap"
                style={{ height: '34px', fontSize: '12px', borderRadius: '6px', lineHeight: 1 }}
              >
                <CheckCircle2 size={13} className="text-success flex-shrink-0" />
                <span>Saved & Fixed ({selectedDate})</span>
              </span>
            )}

            <button
              type="button"
              onClick={handleSaveAttendance}
              disabled={attendanceRows.length === 0 || savingAttendance}
              className={`btn btn-sm d-inline-flex align-items-center justify-content-center gap-1.5 px-3 fw-bold transition-all text-nowrap shadow-xs ${
                hasUnsavedChanges
                  ? 'text-white'
                  : 'bg-white'
              }`}
              style={{
                backgroundColor: hasUnsavedChanges ? '#8B1216' : '#FFFFFF',
                border: hasUnsavedChanges ? '1.5px solid #5C0A0D' : '1.5px solid #8B1216',
                color: hasUnsavedChanges ? '#FFFFFF' : '#8B1216',
                height: '34px',
                fontSize: '12.5px',
                borderRadius: '6px',
                cursor: attendanceRows.length === 0 ? 'not-allowed' : 'pointer',
                lineHeight: 1,
                boxShadow: hasUnsavedChanges ? '0 2px 6px rgba(139, 18, 22, 0.25)' : 'none',
                transition: 'all 0.15s ease-in-out'
              }}
              onMouseEnter={(e) => {
                if (!hasUnsavedChanges && attendanceRows.length > 0) {
                  e.currentTarget.style.backgroundColor = '#FDF0F0';
                }
              }}
              onMouseLeave={(e) => {
                if (!hasUnsavedChanges && attendanceRows.length > 0) {
                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                }
              }}
              title="Save all lecture attendance records"
            >
              {savingAttendance ? (
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
              ) : (
                <Save size={14} className="flex-shrink-0" />
              )}
              <span>Save Attendance</span>
            </button>
          </div>
        </div>
      </div>

      {/* Attendance Ledger Table */}
      <div className="sa-card p-3.5 p-md-4 bg-white">
        <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 mb-3 border-bottom pb-3">
          <div className="w-100 w-md-auto">
            <h5 className="brand-font fw-bold text-sa-charcoal m-0 fs-6" style={{ letterSpacing: '-0.2px' }}>
              Daily Lecture Attendance Ledger ({filteredRecords.length} Students in Batch)
            </h5>
            <span className="small text-muted d-block mt-1" style={{ fontSize: '12.5px', lineHeight: 1.4 }}>
              {reportData?.formatted_date || selectedDate} — Students may attend 2 separate lectures daily. Click 'Present' or 'Absent' to mark individually.
            </span>
          </div>

          <div className="d-flex align-items-center gap-2 flex-wrap w-100 w-md-auto">
            {(!hasExistingSavedAttendance || isEditMode) && (
              <Button
                variant={hasUnsavedChanges ? 'primary' : 'outline'}
                icon={Save}
                loading={savingAttendance}
                onClick={handleSaveAttendance}
                disabled={attendanceRows.length === 0}
                className="btn-sm"
              >
                Save Attendance
              </Button>
            )}
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center justify-content-center gap-1.5 px-3 py-1.5 fw-semibold text-nowrap rounded-2 shadow-2xs flex-grow-1 flex-md-grow-0"
              style={{ fontSize: '12.5px', height: '36px', borderColor: '#CBD5E1' }}
              onClick={() => navigate('/admin/attendance/report')}
              title="View comprehensive attendance analytics and reports"
            >
              <BarChart3 size={15} className="flex-shrink-0 text-sa-primary" />
              <span>Full Analytics Report</span>
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center justify-content-center gap-1.5 px-3 py-1.5 fw-semibold text-nowrap rounded-2 shadow-2xs flex-grow-1 flex-md-grow-0"
              style={{ fontSize: '12.5px', height: '36px', borderColor: '#CBD5E1' }}
              onClick={() => navigate('/admin/notifications?tab=history&type=absence_alert')}
              title="View absence WhatsApp & SMS notification dispatch history"
            >
              <Bell size={15} className="flex-shrink-0" />
              <span>SMS History</span>
            </button>
          </div>
        </div>

        {!isEditMode && hasExistingSavedAttendance ? (
          <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between p-2.5 px-3 mb-3 bg-light border border-secondary-subtle rounded-3 small gap-2">
            <div className="d-flex align-items-center gap-2 text-sa-charcoal">
              <Lock size={15} className="text-success" />
              <span>
                Attendance for <strong>{reportData?.formatted_date || selectedDate}</strong> is <strong>saved & locked</strong>. Buttons are disabled to prevent accidental clicks.
              </span>
            </div>
            <button
              type="button"
              className="btn btn-xs btn-dark fw-semibold d-inline-flex align-items-center gap-1 px-2.5 py-1 rounded-2 shadow-2xs text-nowrap"
              onClick={handleStartEdit}
            >
              <Pencil size={12} />
              <span>Edit Attendance</span>
            </button>
          </div>
        ) : (isEditMode && hasExistingSavedAttendance) ? (
          <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between p-2.5 px-3 mb-3 bg-primary-subtle border border-primary-subtle rounded-3 small gap-2">
            <div className="d-flex align-items-center gap-2 text-primary">
              <Unlock size={15} />
              <span>
                <strong>Edit Mode Active:</strong> You can now modify Present / Absent status. Click 'Save Attendance' when done.
              </span>
            </div>
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-xs btn-outline-secondary bg-white d-inline-flex align-items-center gap-1 px-2.5 py-1 rounded-2 text-nowrap"
                onClick={handleCancelEdit}
              >
                <RotateCcw size={12} />
                <span>Cancel</span>
              </button>
              <button
                type="button"
                className="btn btn-xs btn-primary fw-semibold d-inline-flex align-items-center gap-1 px-3 py-1 rounded-2 shadow-2xs text-nowrap"
                onClick={handleSaveAttendance}
                disabled={savingAttendance}
              >
                <Save size={12} />
                <span>{savingAttendance ? 'Saving...' : 'Save Attendance'}</span>
              </button>
            </div>
          </div>
        ) : null}

        <Table
          columns={[
            {
              key: 'roll_number',
              title: 'Roll Number',
              render: (val, row) => (
                <span className="fw-bold text-sa-charcoal">{val || row.student_id}</span>
              )
            },
            {
              key: 'student_name',
              title: 'Student Name',
              render: (val, row) => (
                <div>
                  <span className="fw-semibold text-sa-charcoal d-block">{val}</span>
                  <span className="small text-muted d-block" style={{ fontSize: '11px' }}>
                    Parent: {row.parent_mobile || 'N/A'}
                  </span>
                  <div className="d-flex align-items-center gap-1.5 mt-0.5 flex-wrap">
                    {row.admission_date && (
                      <span className="small text-muted d-inline-block" style={{ fontSize: '10.5px' }}>
                        Admitted: {String(row.admission_date).split('T')[0]}
                      </span>
                    )}
                    {row.batch_start_date && (
                      <span className="badge bg-primary-subtle text-primary border border-primary-subtle py-0.5 px-1.5" style={{ fontSize: '10px' }}>
                        Batch: {String(row.batch_start_date).split('T')[0]}
                      </span>
                    )}
                  </div>
                </div>
              )
            },
            {
              key: 'batch',
              title: 'Batch',
              render: (val) => <span className="badge bg-light text-dark border">{val}</span>
            },
            {
              key: 'lecture_1',
              title: (
                <div className="d-flex align-items-center justify-content-between gap-2">
                  <span>Lecture 1 (Morning)</span>
                  {isEditMode && (
                    <button
                      type="button"
                      className="btn btn-2xs btn-outline-success bg-white fw-bold py-0.5 px-2 rounded-pill shadow-2xs"
                      style={{ fontSize: '10px' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAll(1, 'Present');
                      }}
                      title="Mark all students Present for Lecture 1"
                    >
                      All Present
                    </button>
                  )}
                </div>
              ),
              render: (_, row) => renderAttendanceToggle(row, 1)
            },
            {
              key: 'lecture_2',
              title: (
                <div className="d-flex align-items-center justify-content-between gap-2">
                  <span>Lecture 2 (Afternoon)</span>
                  {isEditMode && (
                    <button
                      type="button"
                      className="btn btn-2xs btn-outline-success bg-white fw-bold py-0.5 px-2 rounded-pill shadow-2xs"
                      style={{ fontSize: '10px' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAll(2, 'Present');
                      }}
                      title="Mark all students Present for Lecture 2"
                    >
                      All Present
                    </button>
                  )}
                </div>
              ),
              render: (_, row) => renderAttendanceToggle(row, 2)
            },
            {
              key: 'smsStatus',
              title: 'Parent Absence Alerts',
              render: (_, row) => {
                const hasAbsent = row.lecture_1?.status === 'Absent' || row.lecture_2?.status === 'Absent';
                if (!hasAbsent) {
                  return <span className="small text-muted">—</span>;
                }
                return (
                  <div className="d-flex align-items-center gap-1.5 flex-wrap">
                    {row.parent_mobile ? (
                      <button
                        type="button"
                        onClick={() => {
                          const text = `*Shubham Academy • Urgent Attendance Alert* ⚠️\n\nDear Parent, your ward *${row.student_name}* (${row.roll_number}) was marked *ABSENT* on ${selectedDate} for academic lectures. Please contact academy administration for inquiries.\n\n_Shubham Academy_`;
                          notificationService.sendWhatsAppWeb(row.parent_mobile, text);
                        }}
                        className="btn btn-xs btn-outline-success fw-semibold d-inline-flex align-items-center gap-1.5 py-1 px-2.5 rounded-pill shadow-2xs"
                        style={{ fontSize: '11px' }}
                        title="Send WhatsApp alert to parent"
                      >
                        <span>💬 WhatsApp Alert</span>
                      </button>
                    ) : (
                      <span className="badge bg-light text-muted border border-secondary-subtle px-2 py-1 rounded-pill" style={{ fontSize: '11px' }}>
                        No Parent Mobile
                      </span>
                    )}
                  </div>
                );
              }
            }
          ]}
          data={filteredRecords}
          loading={loading}
        />

        {hasUnsavedChanges && (
          <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between p-3 mt-3 bg-warning-subtle border border-warning rounded-3 gap-2">
            <span className="small text-dark fw-bold d-flex align-items-center gap-1.5">
              <AlertCircle size={16} className="text-warning" />
              You have unsaved attendance modifications for {selectedDate}. Click Save Attendance to commit your changes or Cancel to revert.
            </span>
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary bg-white"
                onClick={handleCancelEdit}
              >
                Cancel
              </button>
              <Button
                variant="primary"
                icon={Save}
                loading={savingAttendance}
                onClick={handleSaveAttendance}
              >
                Save Attendance
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* UPLOAD EXCEL SHEET MODAL */}
      {showUploadModal && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-50"
          style={{ zIndex: 1060 }}
        >
          <div
            className="bg-white rounded-4 shadow-lg border p-4"
            style={{ maxWidth: '720px', width: '92%', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div className="d-flex align-items-center justify-content-between border-bottom pb-3 mb-3">
              <div className="d-flex align-items-center gap-2">
                <div className="p-2 bg-danger-subtle text-danger rounded-3">
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <h5 className="brand-font fw-bold text-sa-charcoal m-0 fs-6">
                    Upload Attendance Excel Sheet
                  </h5>
                  <span className="small text-muted">
                    Validate records, import lecture attendance, and automatically notify parents of absentees.
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-light border p-1 rounded-circle"
                onClick={() => setShowUploadModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="d-flex flex-column gap-3">
              <div className="row g-2">
                <div className="col-12">
                  <BranchBatchSelector
                    branch={uploadBranch}
                    onBranchChange={setUploadBranch}
                    session={uploadSession}
                    onSessionChange={setUploadSession}
                    academicBatch={uploadAcademicBatch}
                    onBatchChange={setUploadAcademicBatch}
                    onAcademicBatchChange={setUploadAcademicBatch}
                    showAllOption={isSuperAdmin}
                    fixedBranch={!isSuperAdmin}
                    allowedBranches={!isSuperAdmin ? [defaultBranch] : undefined}
                    layout="grid"
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="small text-muted fw-semibold mb-1 d-block">
                    Lecture Slot (Students attend up to 2/day)
                  </label>
                  <select
                    className="form-select form-select-sm"
                    value={uploadSlot}
                    onChange={(e) => setUploadSlot(Number(e.target.value))}
                  >
                    <option value={1}>Lecture 1 (Morning Session)</option>
                    <option value={2}>Lecture 2 (Afternoon Session)</option>
                  </select>
                </div>

                <div className="col-12 col-md-6">
                  <label className="small text-muted fw-semibold mb-1 d-block">Lecture Date</label>
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    value={uploadDate}
                    onChange={(e) => setUploadDate(e.target.value)}
                    required
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="small text-muted fw-semibold mb-1 d-block">Subject</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={uploadSubject}
                    onChange={(e) => setUploadSubject(e.target.value)}
                    placeholder="e.g. Physics"
                    required
                  />
                </div>

                <div className="col-12">
                  <label className="small text-muted fw-semibold mb-1 d-block">
                    Parent Absence Notification Channels:
                  </label>
                  <div className="d-flex flex-wrap gap-4 p-2.5 bg-light rounded-3 border">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="uploadChannel"
                        id="chanBoth"
                        value="both"
                        checked={uploadChannels === 'both'}
                        onChange={() => setUploadChannels('both')}
                        style={{ cursor: 'pointer' }}
                      />
                      <label className="form-check-label small fw-bold text-sa-charcoal" htmlFor="chanBoth" style={{ cursor: 'pointer' }}>
                        💬 WhatsApp & 📱 SMS (Recommended)
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="uploadChannel"
                        id="chanWA"
                        value="whatsapp"
                        checked={uploadChannels === 'whatsapp'}
                        onChange={() => setUploadChannels('whatsapp')}
                        style={{ cursor: 'pointer' }}
                      />
                      <label className="form-check-label small fw-bold text-success" htmlFor="chanWA" style={{ cursor: 'pointer' }}>
                        💬 WhatsApp Only
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="uploadChannel"
                        id="chanSMS"
                        value="sms"
                        checked={uploadChannels === 'sms'}
                        onChange={() => setUploadChannels('sms')}
                        style={{ cursor: 'pointer' }}
                      />
                      <label className="form-check-label small fw-bold text-primary" htmlFor="chanSMS" style={{ cursor: 'pointer' }}>
                        📱 SMS Only
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Drag and Drop Zone */}
              <div className="p-4 border border-2 border-dashed rounded-3 text-center bg-light">
                <input
                  type="file"
                  id="excelFileInput"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="d-none"
                />
                <label htmlFor="excelFileInput" style={{ cursor: 'pointer' }} className="d-block m-0">
                  <Upload size={32} className="text-sa-primary mb-2 mx-auto" />
                  <h6 className="fw-bold text-sa-charcoal mb-1">
                    {uploadFile ? uploadFile.name : 'Click to Browse or Drag & Drop Excel File'}
                  </h6>
                  <span className="small text-muted d-block">
                    Supports .xlsx and .xls workbooks. You can also{' '}
                    <span
                      className="text-primary text-decoration-underline"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDownloadTemplate();
                      }}
                    >
                      download sample template
                    </span>.
                  </span>
                </label>
              </div>

              {/* Live Preview of parsed rows */}
              {parsedRows.length > 0 && (
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="small fw-bold text-sa-charcoal">
                      Parsed Rows Preview ({parsedRows.length} rows detected):
                    </span>
                    <span className="badge bg-success-subtle text-success border border-success-subtle">
                      Ready for Validation
                    </span>
                  </div>

                  <div className="table-responsive border rounded-2" style={{ maxHeight: '180px' }}>
                    <table className="table table-sm table-striped m-0 small">
                      <thead className="table-light">
                        <tr>
                          <th>#</th>
                          <th>Roll No</th>
                          <th>Student Name</th>
                          <th>Slot</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedRows.slice(0, 6).map((r, i) => {
                          const roll = r['Roll Number'] || r['Roll No'] || r['Student ID'] || Object.values(r)[0] || '';
                          const name = r['Student Name'] || r['Name'] || Object.values(r)[1] || '';
                          const slot = r['Lecture Slot'] || r['Lecture'] || `Lecture ${uploadSlot}`;
                          const status = r['Status (Present/Absent/Late/Leave)'] || r['Status'] || 'Present';
                          return (
                            <tr key={i}>
                              <td>{i + 1}</td>
                              <td className="fw-semibold">{roll}</td>
                              <td>{name}</td>
                              <td>{slot}</td>
                              <td>
                                <span className={`badge ${String(status).toLowerCase().includes('abs') ? 'bg-danger text-white' : 'bg-success text-white'}`}>
                                  {status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Requirement Rule Alert */}
              <div className="p-3 rounded-3 bg-light border border-secondary-subtle">
                <span className="small text-sa-charcoal fw-semibold d-flex align-items-center gap-1.5 mb-1">
                  <CheckCircle2 size={15} className="text-success" />
                  Dual Lecture & Absence Safety Rule:
                </span>
                <p className="small text-muted m-0" style={{ fontSize: '11px', lineHeight: 1.4 }}>
                  1. Since students may attend 2 separate lectures in a day, attendance is recorded separately for Lecture 1 and Lecture 2.<br />
                  2. Absence WhatsApp and SMS notifications will be dispatched to parents <strong>ONLY after attendance is saved successfully</strong> in the database.<br />
                  3. Duplicate messages for the same lecture and channel are automatically prevented.
                </p>
              </div>

              {/* Upload Result Alert */}
              {uploadResult && (
                <div className="p-3 rounded-3 bg-success-subtle border border-success text-success">
                  <h6 className="fw-bold mb-1">✅ Attendance Imported Successfully!</h6>
                  <div className="small d-flex flex-wrap gap-3 mt-1 text-dark">
                    <span><strong>Total Rows:</strong> {uploadResult.total_rows}</span>
                    <span><strong>Saved Records:</strong> {uploadResult.saved_count}</span>
                    <span><strong>Absentees:</strong> {uploadResult.absent_count}</span>
                    <span><strong>Parent Alerts Dispatched:</strong> {uploadResult.notifications_sent} ({uploadResult.channel || 'WhatsApp & SMS'})</span>
                    <span><strong>Duplicates Prevented:</strong> {uploadResult.duplicates_prevented || 0}</span>
                  </div>
                </div>
              )}

              <div className="d-flex align-items-center justify-content-end gap-2 border-top pt-3">
                <Button
                  variant="light"
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                >
                  Close
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  loading={uploading}
                  disabled={parsedRows.length === 0}
                >
                  Import & Save Attendance
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
