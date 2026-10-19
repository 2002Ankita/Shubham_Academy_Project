import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Clock,
  CheckCircle2,
  Zap,
  Plus,
  Trash2,
  Edit3,
  Calendar,
  CalendarDays,
  MapPin,
  Filter,
  Search,
  Printer,
  Layers,
  ChevronRight,
  Check,
  FileSpreadsheet,
  Download,
  Upload
} from 'lucide-react';
import Modal from '../../components/common/Modal';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import curriculumService from '../../services/curriculumService';
import { useConfirm } from '../../context/ConfirmContext';
import { useAuth } from '../../hooks/useAuth';

// Helper to reliably match teacher names regardless of prefixes like Dr., Prof., etc.
const isTeacherMatch = (teacherA, teacherB, subject = '') => {
  if (!teacherA || !teacherB) return false;
  const cleanA = teacherA.toLowerCase().replace(/^(dr\.|prof\.|mr\.|mrs\.|ms\.)\s*/i, '').trim();
  const cleanB = teacherB.toLowerCase().replace(/^(dr\.|prof\.|mr\.|mrs\.|ms\.)\s*/i, '').trim();

  if (cleanA === cleanB) return true;
  if (cleanA.includes(cleanB) || cleanB.includes(cleanA)) return true;

  const tokensA = cleanA.split(/\s+/).filter(t => t.length >= 3);
  const tokensB = cleanB.split(/\s+/).filter(t => t.length >= 3);
  for (const t of tokensA) {
    if (tokensB.includes(t)) return true;
  }

  if (subject) {
    const sub = subject.toLowerCase();
    if (cleanA.includes('priya') || cleanA.includes('shubham') || cleanA.includes('kulkarni')) return sub.includes('phys');
    if (cleanA.includes('sunita') || cleanA.includes('patil')) return sub.includes('chem');
    if (cleanA.includes('rajesh') || cleanA.includes('sharma')) return sub.includes('math');
    if (cleanA.includes('amit') || cleanA.includes('sawant')) return sub.includes('bio');
  }

  return false;
};

// Helper to format Class / Batch without repeating the branch name
const formatClassBatch = (batchStr = '') => {
  if (!batchStr) return 'General Class';
  return batchStr
    .replace(/Tarabai\s*Park/gi, '')
    .replace(/Mangalwar\s*Peth/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
};

export default function DailyActivityReport() {
  const navigate = useNavigate();
  const location = useLocation();
  const { confirm } = useConfirm();
  const { user } = useAuth();

  // Storage key shared with Dashboard
  const STORAGE_KEY = 'sa_teacher_daily_activities';

  const [dailyActivities, setDailyActivities] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return [
      {
        id: 'ACT-01',
        branch: 'Tarabai Park',
        activity: 'Classroom Lecture & Theory',
        subject: 'Physics (Class 12th)',
        batch: '12th Science Tarabai Park (Batch A)',
        chapter: 'Chapter 7: Wave Optics',
        topicTaught: 'Wave Optics - Wavefronts & Huygens Principle Derivation',
        timeSlot: '08:30 AM - 10:00 AM',
        hours: 1.5,
        periods: 2,
        totalPlannedPeriods: 3,
        targetDate: '2026-10-24',
        status: 'Completed',
        remarks: 'Derived reflection & refraction laws. Solved 4 numerical problems on slit interference. Homework assigned.'
      },
      {
        id: 'ACT-02',
        branch: 'Tarabai Park',
        activity: 'Practical Lab Session',
        subject: 'Physics Laboratory',
        batch: '11th Science PCM (Batch B)',
        chapter: 'Practical Mechanics & Fluids',
        topicTaught: 'Surface Tension by Capillary Rise Method - Hands-on Experiment',
        timeSlot: '10:30 AM - 12:30 PM',
        hours: 2.0,
        periods: 2,
        totalPlannedPeriods: 2,
        targetDate: '2026-10-20',
        status: 'Completed',
        remarks: 'Checked student lab journals, calibrated traveling microscope apparatus for all 24 students.'
      },
      {
        id: 'ACT-03',
        branch: 'Tarabai Park',
        activity: 'Doubt Clearing Masterclass',
        subject: 'Applied Physics',
        batch: '12th Science Tarabai Park (Batch A)',
        chapter: 'Chapter 9: Electromagnetic Induction',
        topicTaught: 'Electromagnetic Induction - Lenz\'s Law & Self-Inductance Numericals',
        timeSlot: '01:30 PM - 02:30 PM',
        hours: 1.0,
        periods: 1,
        totalPlannedPeriods: 4,
        targetDate: '2026-10-28',
        status: 'Completed',
        remarks: 'Solved JEE / NEET PYQs on induced EMF with 18 attending students.'
      }
    ];
  });

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dailyActivities));
    } catch (_) {}
  }, [dailyActivities]);

  // Sync with backend on component mount and on realtime updates from admin
  useEffect(() => {
    const fetchActivities = () => {
      curriculumService.getDailyActivities().then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map(item => {
            const rawBatch = (item.batch || '').toLowerCase();
            const rawBranch = (item.branch || '').toLowerCase();
            const branch = (rawBatch.includes('mangalwar') || rawBranch.includes('mangalwar'))
              ? 'Mangalwar Peth'
              : (rawBatch.includes('tarabai') || rawBranch.includes('tarabai') ? 'Tarabai Park' : (item.branch || 'Tarabai Park'));

            return {
              ...item,
              branch,
              chapter: item.chapter || (item.topic_taught && item.topic_taught.includes('-') ? item.topic_taught.split('-')[0].trim() : (item.topic_taught && item.topic_taught.includes(':') ? item.topic_taught.split(':')[0].trim() : 'Curriculum Module')),
              targetDate: item.target_date || item.targetDate || item.activity_date || '',
              topicTaught: item.topic_taught || item.topicTaught,
              timeSlot: item.time_slot || item.timeSlot,
              totalPlannedPeriods: item.total_planned_periods || item.totalPlannedPeriods
            };
          });
          setDailyActivities(mapped);
        }
      });
    };

    fetchActivities();
    window.addEventListener('sa_daily_activities_updated', fetchActivities);
    return () => window.removeEventListener('sa_daily_activities_updated', fetchActivities);
  }, []);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('All');
  const [selectedActivityFilter, setSelectedActivityFilter] = useState('All');
  const [selectedBatchFilter, setSelectedBatchFilter] = useState('All');

  // Modal State (Add & Edit)
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [editingActivityId, setEditingActivityId] = useState(null);
  const [newActivity, setNewActivity] = useState({
    branch: 'Tarabai Park',
    activity: 'Classroom Lecture & Theory',
    subject: 'Physics',
    batch: '12th Science Tarabai Park (Batch A)',
    chapter: '',
    topicTaught: '',
    timeSlot: '03:00 PM - 04:00 PM',
    hours: '1.0',
    periods: '1',
    totalPlannedPeriods: '2',
    targetDate: new Date().toISOString().split('T')[0],
    status: 'Completed',
    remarks: ''
  });

  // Excel Import States & Ref
  const excelInputRef = useRef(null);
  const [isExcelPreviewModalOpen, setIsExcelPreviewModalOpen] = useState(false);
  const [excelParsedData, setExcelParsedData] = useState([]);

  const handleTriggerExcelUpload = () => {
    if (excelInputRef.current) {
      excelInputRef.current.value = '';
      excelInputRef.current.click();
    }
  };

  const handleExcelFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const binaryString = evt.target.result;
        const workbook = XLSX.read(binaryString, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json(sheet);

        if (!rawData || rawData.length === 0) {
          toast.warning('The uploaded Excel file has no records.');
          return;
        }

        const parsedActivities = rawData.map((row) => {
          const norm = {};
          for (const k in row) {
            const cleanKey = k.toLowerCase().replace(/[^a-z0-9]/g, '');
            norm[cleanKey] = row[k];
          }

          const topic = String(norm['topictaught'] || norm['topic'] || norm['topicname'] || norm['syllabus'] || norm['topics'] || '').trim();
          const subject = String(norm['subject'] || norm['sub'] || norm['subjectname'] || 'Physics').trim();
          const batch = String(norm['classbatch'] || norm['batch'] || norm['class'] || norm['division'] || '12th Science Tarabai Park (Batch A)').trim();
          let branch = String(norm['branch'] || norm['branchname'] || norm['location'] || '').trim();
          if (!branch) {
            branch = batch.toLowerCase().includes('mangalwar') ? 'Mangalwar Peth' : 'Tarabai Park';
          }
          const chapter = String(norm['chapter'] || norm['unit'] || norm['chaptername'] || '').trim();
          const targetDate = String(norm['targetcompletiondate'] || norm['targetdate'] || norm['completeby'] || norm['deadline'] || '').trim();
          const activity = String(norm['activitytype'] || norm['activity'] || norm['type'] || 'Classroom Lecture & Theory').trim();
          const timeSlot = String(norm['timeslot'] || norm['time'] || norm['slot'] || '03:00 PM - 04:00 PM').trim();
          const hours = String(norm['hours'] || norm['teachinghours'] || norm['hrs'] || '1.0');
          const periods = String(norm['periodstaken'] || norm['periods'] || norm['period'] || '1');
          const totalPlannedPeriods = String(norm['totalplannedperiods'] || norm['plannedperiods'] || norm['totalperiods'] || '2');
          const status = String(norm['status'] || 'Completed').trim();
          const remarks = String(norm['remarks'] || norm['remark'] || norm['notes'] || norm['outcomes'] || '').trim();

          return {
            branch,
            activity,
            subject,
            batch,
            chapter,
            targetDate: targetDate || new Date().toISOString().split('T')[0],
            topicTaught: topic,
            timeSlot,
            hours,
            periods,
            totalPlannedPeriods,
            status,
            remarks
          };
        }).filter(item => item.topicTaught.length > 0 || item.subject.length > 0);

        if (parsedActivities.length === 0) {
          toast.warning('No valid activities found in the Excel file. Please ensure there is a "Topic Taught" or "Topic" column.');
          return;
        }

        if (parsedActivities.length === 1) {
          // Exactly 1 row: automatically populate the Log Activity modal and open it!
          setNewActivity(parsedActivities[0]);
          setEditingActivityId(null);
          setIsActivityModalOpen(true);
          toast.success(`Activity "${parsedActivities[0].topicTaught || 'Session'}" auto-filled from Excel! Review and click Save.`);
        } else {
          // Multiple rows: show review preview modal for bulk import or selecting
          setExcelParsedData(parsedActivities);
          setIsExcelPreviewModalOpen(true);
          toast.info(`Found ${parsedActivities.length} activities in Excel.`);
        }
      } catch (err) {
        console.error('Failed to parse Excel file:', err);
        toast.error('Failed to parse Excel file. Please ensure it is a valid .xlsx, .xls, or .csv file.');
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleExportExcel = () => {
    const listToExport = filteredActivities && filteredActivities.length > 0 ? filteredActivities : (myActivities || dailyActivities);

    if (!listToExport || listToExport.length === 0) {
      toast.warning('No activity records available to export.');
      return;
    }

    const exportRows = listToExport.map((item, idx) => ({
      "Sr No": idx + 1,
      "Branch": item.branch || 'Tarabai Park',
      "Activity Type": item.activity || '',
      "Subject": item.subject || '',
      "Class / Batch": item.batch || '',
      "Chapter": item.chapter || '',
      "Topic Taught": item.topicTaught || '',
      "Target Completion Date": item.targetDate || '',
      "Time Slot": item.timeSlot || '',
      "Hours Spent": item.hours || 1.0,
      "Periods Taken": item.periods || 1,
      "Total Planned Periods": item.totalPlannedPeriods || 1,
      "Status": item.status || 'Completed',
      "Remarks / Outcomes": item.remarks || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Daily Activities");

    const todayDate = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Teacher_Daily_Activities_${todayDate}.xlsx`);
    toast.success(`Exported ${exportRows.length} daily activities to Excel!`);
  };

  const handleDownloadSampleExcel = () => {
    const sampleData = [
      {
        "Branch": "Tarabai Park",
        "Activity Type": "Classroom Lecture & Theory",
        "Subject": "Physics",
        "Class / Batch": "12th Science Tarabai Park (Batch A)",
        "Chapter": "Chapter 7: Wave Optics",
        "Topic Taught": "Wave Optics - Wavefronts & Huygens Principle",
        "Target Completion Date": "2026-10-24",
        "Time Slot": "08:30 AM - 10:00 AM",
        "Hours": 1.5,
        "Periods Taken": 2,
        "Total Planned Periods": 3,
        "Status": "Completed",
        "Remarks": "Derived reflection and refraction laws. Assigned homework problems."
      },
      {
        "Branch": "Mangalwar Peth",
        "Activity Type": "Practical Lab Session",
        "Subject": "Physics Laboratory",
        "Class / Batch": "11th Science Mangalwar Peth (Batch A)",
        "Chapter": "Practical Mechanics & Fluids",
        "Topic Taught": "Surface Tension - Capillary Rise Experiment",
        "Target Completion Date": "2026-10-25",
        "Time Slot": "10:30 AM - 12:30 PM",
        "Hours": 2.0,
        "Periods Taken": 2,
        "Total Planned Periods": 2,
        "Status": "Completed",
        "Remarks": "Hands-on apparatus handling and verification completed with students."
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Daily Activities");
    XLSX.writeFile(workbook, "Teacher_Daily_Activity_Template.xlsx");
    toast.info("Sample Excel template downloaded.");
  };

  const handleBulkImportActivities = async (activitiesToImport) => {
    if (!activitiesToImport || activitiesToImport.length === 0) return;

    let savedList = [];
    for (let i = 0; i < activitiesToImport.length; i++) {
      const item = activitiesToImport[i];
      let stdSubject = (item.subject || 'Physics').trim();
      const lowerSubj = stdSubject.toLowerCase();
      if (lowerSubj.includes('physic')) stdSubject = 'Physics';
      else if (lowerSubj.includes('chem')) stdSubject = 'Chemistry';
      else if (lowerSubj.includes('math')) stdSubject = 'Mathematics';
      else if (lowerSubj.includes('bio')) stdSubject = 'Biology';

      const payload = {
        branch: item.branch || (item.batch?.toLowerCase().includes('mangalwar') ? 'Mangalwar Peth' : 'Tarabai Park'),
        activity: item.activity || 'Classroom Lecture & Theory',
        subject: stdSubject,
        batch: item.batch || '12th Science Tarabai Park (Batch A)',
        chapter: item.chapter || '',
        target_date: item.targetDate || new Date().toISOString().split('T')[0],
        topic_taught: item.topicTaught,
        time_slot: item.timeSlot || '09:00 AM - 10:30 AM',
        hours: parseFloat(item.hours) || 1.0,
        periods: parseInt(item.periods, 10) || 1,
        total_planned_periods: parseInt(item.totalPlannedPeriods, 10) || 2,
        status: item.status || 'Completed',
        remarks: item.remarks || ''
      };

      const created = {
        id: `ACT-${Date.now()}-${i}`,
        ...payload,
        targetDate: payload.target_date,
        topicTaught: payload.topic_taught,
        timeSlot: payload.time_slot,
        totalPlannedPeriods: payload.total_planned_periods
      };

      try {
        await curriculumService.createDailyActivity(payload);
      } catch (e) {
        console.warn('Backend save activity failed:', e);
      }
      savedList.push(created);
    }

    setDailyActivities(prev => [...savedList, ...prev]);
    setIsExcelPreviewModalOpen(false);
    setExcelParsedData([]);
    toast.success(`Successfully imported and logged ${savedList.length} activities from Excel!`);
  };

  // Handle redirect from Topic Duration Matrix if topic was sent
  useEffect(() => {
    if (location.state?.prefillTopic) {
      const topic = location.state.prefillTopic;
      setEditingActivityId(null);
      setNewActivity({
        branch: topic.branch || 'Tarabai Park',
        activity: 'Classroom Lecture & Theory',
        subject: topic.subject || 'Physics',
        batch: topic.batch || '12th Science Tarabai Park (Batch A)',
        chapter: topic.chapter || '',
        topicTaught: topic.topicTaught || topic.topicName || '',
        timeSlot: '03:00 PM - 04:00 PM',
        hours: '1.0',
        periods: topic.periods || '1',
        totalPlannedPeriods: topic.totalPlannedPeriods || topic.requiredPeriods || '2',
        targetDate: topic.targetDate || topic.endDate || new Date().toISOString().split('T')[0],
        status: 'Completed',
        remarks: topic.remarks || ''
      });
      setIsActivityModalOpen(true);
    }
  }, [location.state]);

  // Filter activities strictly for the logged-in teacher (if role is teacher)
  const myActivities = useMemo(() => {
    if (!user || user.role !== 'teacher') {
      return dailyActivities;
    }
    const currentTeacherName = user.name || '';
    return dailyActivities.filter(item => {
      const itemTeacher = item.teacher_name || item.teacherName || '';
      if (itemTeacher && isTeacherMatch(currentTeacherName, itemTeacher, item.subject)) {
        return true;
      }
      // If item doesn't have teacher name set, match by subject
      const sub = (item.subject || '').toLowerCase();
      const tName = currentTeacherName.toLowerCase();
      if ((tName.includes('priya') || tName.includes('shubham') || tName.includes('kulkarni')) && sub.includes('phys')) return true;
      if ((tName.includes('sunita') || tName.includes('patil')) && sub.includes('chem')) return true;
      if ((tName.includes('rajesh') || tName.includes('sharma')) && sub.includes('math')) return true;
      if ((tName.includes('amit') || tName.includes('sawant')) && sub.includes('bio')) return true;

      return false;
    });
  }, [dailyActivities, user]);

  // Computed Metrics based on teacher's own activities
  const totalTeachingHoursToday = myActivities
    .reduce((sum, act) => sum + (parseFloat(act.hours) || 0), 0)
    .toFixed(1);

  const completedActivitiesCount = myActivities.filter(a => a.status === 'Completed').length;
  const uniqueTopicsTaughtCount = myActivities.filter(a => a.topicTaught && a.topicTaught.trim().length > 0).length;
  const uniqueBatchesCount = new Set(myActivities.map(a => a.batch)).size;

  const targetHours = 6.0;
  const progressPercent = Math.min(Math.round((parseFloat(totalTeachingHoursToday) / targetHours) * 100), 100);

  // Filtered Activities
  const filteredActivities = myActivities.filter(item => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === '' ||
      (item.topicTaught && item.topicTaught.toLowerCase().includes(q)) ||
      (item.chapter && item.chapter.toLowerCase().includes(q)) ||
      (item.subject && item.subject.toLowerCase().includes(q)) ||
      (item.batch && item.batch.toLowerCase().includes(q));

    const matchesBranch = selectedBranchFilter === 'All' || item.branch === selectedBranchFilter;
    const matchesActivity = selectedActivityFilter === 'All' || item.activity === selectedActivityFilter;
    const matchesBatch = selectedBatchFilter === 'All' || item.batch === selectedBatchFilter;

    return matchesSearch && matchesBranch && matchesActivity && matchesBatch;
  });

  const handleOpenAddModal = () => {
    setEditingActivityId(null);
    setNewActivity({
      branch: 'Tarabai Park',
      activity: 'Classroom Lecture & Theory',
      subject: 'Physics',
      batch: '12th Science Tarabai Park (Batch A)',
      chapter: '',
      topicTaught: '',
      timeSlot: '03:00 PM - 04:00 PM',
      hours: '1.0',
      periods: '1',
      totalPlannedPeriods: '2',
      targetDate: new Date().toISOString().split('T')[0],
      status: 'Completed',
      remarks: ''
    });
    setIsActivityModalOpen(true);
  };

  const handleOpenEditModal = (act) => {
    setEditingActivityId(act.id);
    setNewActivity({
      branch: act.branch || 'Tarabai Park',
      activity: act.activity || 'Classroom Lecture & Theory',
      subject: act.subject || 'Physics',
      batch: act.batch || '12th Science Tarabai Park (Batch A)',
      chapter: act.chapter || '',
      topicTaught: act.topicTaught || '',
      timeSlot: act.timeSlot || '03:00 PM - 04:00 PM',
      hours: String(act.hours || '1.0'),
      periods: String(act.periods || '1'),
      totalPlannedPeriods: String(act.totalPlannedPeriods || '2'),
      targetDate: act.targetDate || new Date().toISOString().split('T')[0],
      status: act.status || 'Completed',
      remarks: act.remarks || ''
    });
    setIsActivityModalOpen(true);
  };

  const handleSaveActivity = (e) => {
    e.preventDefault();
    if (!newActivity.topicTaught.trim()) {
      toast.warning('Please enter the topic taught today.');
      return;
    }

    const payload = {
      ...newActivity,
      hours: parseFloat(newActivity.hours) || 1.0,
      periods: parseInt(newActivity.periods, 10) || 1,
      totalPlannedPeriods: parseInt(newActivity.totalPlannedPeriods, 10) || 1
    };

    // Standardize subject name
    let stdSubject = payload.subject.trim();
    const lowerSubj = stdSubject.toLowerCase();
    if (lowerSubj.includes('physic')) stdSubject = 'Physics';
    else if (lowerSubj.includes('chem')) stdSubject = 'Chemistry';
    else if (lowerSubj.includes('math')) stdSubject = 'Mathematics';
    else if (lowerSubj.includes('bio')) stdSubject = 'Biology';

    // Determine faculty name
    let faculty = 'Prof. Shubham Shinde';
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      if (u.name) faculty = u.name;
    } catch (_) {}
    if (!faculty || faculty === 'Assigned Faculty') {
      if (stdSubject === 'Physics') faculty = 'Prof. Shubham Shinde';
      else if (stdSubject === 'Chemistry') faculty = 'Prof. Sunita Patil';
      else if (stdSubject === 'Mathematics') faculty = 'Prof. Rajesh Sharma';
      else if (stdSubject === 'Biology') faculty = 'Prof. Amit Sawant';
    }

    const todayDate = new Date().toISOString().split('T')[0];
    const todayMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const stdGrade = payload.batch.includes('11th') ? 'Class 11th' : 'Class 12th';

    if (editingActivityId) {
      curriculumService.updateDailyActivity(editingActivityId, {
        branch: payload.branch,
        activity: payload.activity,
        subject: stdSubject,
        batch: payload.batch,
        chapter: payload.chapter,
        target_date: payload.targetDate,
        topic_taught: payload.topicTaught,
        time_slot: payload.timeSlot,
        hours: payload.hours,
        periods: payload.periods,
        total_planned_periods: payload.totalPlannedPeriods,
        status: payload.status,
        remarks: payload.remarks
      });
      setDailyActivities(prev =>
        prev.map(item => (item.id === editingActivityId ? { ...item, ...payload, subject: stdSubject } : item))
      );
      toast.success('Teaching activity updated successfully!');
    } else {
      const created = {
        id: `ACT-${Date.now()}`,
        ...payload,
        subject: stdSubject
      };

      // 1. Save daily activity in backend & local state
      curriculumService.createDailyActivity({
        branch: payload.branch,
        activity: payload.activity,
        subject: stdSubject,
        batch: payload.batch,
        chapter: payload.chapter,
        target_date: payload.targetDate,
        topic_taught: payload.topicTaught,
        time_slot: payload.timeSlot,
        hours: payload.hours,
        periods: payload.periods,
        total_planned_periods: payload.totalPlannedPeriods,
        status: payload.status,
        remarks: payload.remarks
      });
      setDailyActivities(prev => [created, ...prev]);

      // 2. Synchronize to Topic Duration Matrix (sa_teacher_topic_plans) -> ALWAYS 'In Progress'
      try {
        let topicPlans = [];
        const savedPlans = localStorage.getItem('sa_teacher_topic_plans');
        if (savedPlans) topicPlans = JSON.parse(savedPlans);

        const matchIdx = topicPlans.findIndex(
          t => (t.topicName || '').toLowerCase() === payload.topicTaught.trim().toLowerCase() &&
               (t.batch || '').toLowerCase() === payload.batch.trim().toLowerCase()
        );

        if (matchIdx >= 0) {
          const target = topicPlans[matchIdx];
          const newDone = (parseInt(target.completedPeriods, 10) || 0) + payload.periods;
          const req = parseInt(target.requiredPeriods, 10) || payload.totalPlannedPeriods || 3;
          topicPlans[matchIdx] = {
            ...target,
            completedPeriods: newDone,
            status: newDone >= req ? 'Completed' : 'In Progress',
            startDate: target.startDate || todayDate
          };
        } else {
          const chapterName = payload.topicTaught.includes('-')
            ? payload.topicTaught.split('-')[0].trim()
            : (payload.topicTaught.includes(':') ? payload.topicTaught.split(':')[0].trim() : 'Curriculum Chapter');

          const newTopicPlan = {
            id: `TOP-${Date.now()}`,
            standard: stdGrade,
            batch: payload.batch,
            subject: stdSubject,
            teacher: faculty,
            chapter: chapterName,
            topicName: payload.topicTaught.trim(),
            startDate: todayDate,
            endDate: null,
            requiredPeriods: Math.max(payload.totalPlannedPeriods || 3, payload.periods || 1),
            periodDurationMins: 45,
            completedPeriods: payload.periods || 1,
            status: 'In Progress', // Added to In Progress
            academicYear: '2026-2027',
            month: todayMonth,
            remarks: payload.remarks || 'Initiated from Teacher Daily Activity Log'
          };
          topicPlans.unshift(newTopicPlan);
        }

        // Deduplicate local storage topic plans
        const uniqueTopicMap = new Map();
        for (const tp of topicPlans) {
          const k = `${(tp.subject || '').trim().toLowerCase()}__${(tp.batch || '').trim().toLowerCase()}__${(tp.topicName || tp.topic_name || '').trim().toLowerCase()}`;
          if (!uniqueTopicMap.has(k)) {
            uniqueTopicMap.set(k, tp);
          }
        }
        localStorage.setItem('sa_teacher_topic_plans', JSON.stringify(Array.from(uniqueTopicMap.values())));
      } catch (err) {
        console.warn('Local topic duration plan sync error:', err);
      }

      toast.success(
        `Teaching activity logged & added to Topic Duration Matrix under "In Progress"!`
      );
    }

    setIsActivityModalOpen(false);
    setEditingActivityId(null);
  };

  const handleDeleteActivity = async (id) => {
    const isConfirmed = await confirm({
      title: 'Delete Activity Record',
      message: 'Are you sure you want to delete this activity log?',
      subtitle: 'This will remove the activity from your daily report.',
      confirmText: 'Delete Record',
      cancelText: 'Keep Record',
      type: 'danger'
    });

    if (isConfirmed) {
      curriculumService.deleteDailyActivity(id);
      setDailyActivities(prev => prev.filter(a => a.id !== id));
      toast.info('Activity record removed.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="d-flex flex-column w-100" style={{ gap: '20px' }}>
      {/* 1. Page Header with Back Button */}
      <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-3 pt-1">
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
            aria-label="Back to Dashboard"
            title="Back to Dashboard"
          >
            <ArrowLeft size={18} />
          </button>

          <div>
            <div className="d-flex align-items-center gap-2">
              <h1 className="fw-bold brand-font text-sa-charcoal m-0" style={{ fontSize: '22px', lineHeight: 1.25 }}>
                Teacher Daily Activity Report
              </h1>
              <span className="badge rounded-pill fw-semibold" style={{ backgroundColor: '#EAF6EF', color: '#168554', fontSize: '11px', border: '1px solid #C6E7D2' }}>
                Today's Log
              </span>
            </div>
            <p className="text-sa-muted m-0 mt-1" style={{ fontSize: '13px' }}>
              Track completed activities, topics taught, and hours spent teaching today
            </p>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2 flex-nowrap flex-shrink-0">
          <div
            className="border px-3 d-inline-flex align-items-center gap-1.5 shadow-xs bg-white text-sa-charcoal"
            style={{
              height: '38px',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: 500,
              borderColor: '#CBD5E1',
              whiteSpace: 'nowrap'
            }}
          >
            <Calendar size={15} style={{ color: '#8B1216' }} />
            <span>{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>

          <button
            type="button"
            onClick={handleExportExcel}
            className="btn btn-sm btn-light border d-inline-flex align-items-center gap-1.5 fw-medium text-sa-charcoal shadow-xs"
            style={{
              height: '38px',
              borderRadius: '8px',
              fontSize: '12.5px',
              padding: '0 14px',
              backgroundColor: '#FFFFFF',
              borderColor: '#CBD5E1',
              whiteSpace: 'nowrap',
              cursor: 'pointer'
            }}
            title="Export daily activities to Excel (.xlsx)"
          >
            <Download size={15} style={{ color: '#2563EB' }} />
            <span>Export Excel</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="btn btn-sm text-white d-inline-flex align-items-center gap-1.5 fw-semibold shadow-xs"
            style={{
              height: '38px',
              backgroundColor: '#8B1216',
              borderRadius: '8px',
              fontSize: '12.5px',
              padding: '0 16px',
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            <Plus size={16} />
            <span>Log Activity / Topic</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards (4 Cards) */}
      <div className="row g-3">
        {/* KPI 1: Total Teaching Hours Today */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div
            className="sa-card bg-white border p-3 rounded-4 shadow-xs h-100 d-flex flex-column justify-content-between"
            style={{ borderColor: '#E2E8F0', borderLeft: '4px solid #8B1216' }}
          >
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-sa-muted fw-semibold" style={{ fontSize: '12px' }}>
                Teaching Hours Today
              </span>
              <div
                className="rounded-3 d-flex align-items-center justify-content-center"
                style={{ width: '34px', height: '34px', backgroundColor: '#FDF0F0', color: '#8B1216' }}
              >
                <Clock size={17} />
              </div>
            </div>
            <div>
              <div className="fw-bold brand-font text-sa-charcoal" style={{ fontSize: '24px', lineHeight: 1.15 }}>
                {totalTeachingHoursToday} <span style={{ fontSize: '14px', fontWeight: 500, color: '#64748B' }}>hrs</span>
              </div>
              <span className="text-success fw-semibold mt-1 d-block" style={{ fontSize: '11px' }}>
                ✓ {progressPercent}% of {targetHours}h daily target
              </span>
            </div>
          </div>
        </div>

        {/* KPI 2: Topics Taught Today */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div
            className="sa-card bg-white border p-3 rounded-4 shadow-xs h-100 d-flex flex-column justify-content-between"
            style={{ borderColor: '#E2E8F0', borderLeft: '4px solid #168554' }}
          >
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-sa-muted fw-semibold" style={{ fontSize: '12px' }}>
                Topics Taught Today
              </span>
              <div
                className="rounded-3 d-flex align-items-center justify-content-center"
                style={{ width: '34px', height: '34px', backgroundColor: '#DCFCE7', color: '#168554' }}
              >
                <BookOpen size={17} />
              </div>
            </div>
            <div>
              <div className="fw-bold brand-font text-sa-charcoal" style={{ fontSize: '24px', lineHeight: 1.15 }}>
                {uniqueTopicsTaughtCount} <span style={{ fontSize: '14px', fontWeight: 500, color: '#64748B' }}>topics</span>
              </div>
              <span className="text-sa-muted mt-1 d-block" style={{ fontSize: '11px' }}>
                Syllabus progress logged
              </span>
            </div>
          </div>
        </div>

        {/* KPI 3: Completed Activities */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div
            className="sa-card bg-white border p-3 rounded-4 shadow-xs h-100 d-flex flex-column justify-content-between"
            style={{ borderColor: '#E2E8F0', borderLeft: '4px solid #D97718' }}
          >
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-sa-muted fw-semibold" style={{ fontSize: '12px' }}>
                Completed Activities
              </span>
              <div
                className="rounded-3 d-flex align-items-center justify-content-center"
                style={{ width: '34px', height: '34px', backgroundColor: '#FEF8EB', color: '#D97718' }}
              >
                <Zap size={17} />
              </div>
            </div>
            <div>
              <div className="fw-bold brand-font text-sa-charcoal" style={{ fontSize: '24px', lineHeight: 1.15 }}>
                {completedActivitiesCount} / {dailyActivities.length}
              </div>
              <span className="text-warning-emphasis fw-semibold mt-1 d-block" style={{ fontSize: '11px' }}>
                100% on schedule today
              </span>
            </div>
          </div>
        </div>

        {/* KPI 4: Batches Taught */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div
            className="sa-card bg-white border p-3 rounded-4 shadow-xs h-100 d-flex flex-column justify-content-between"
            style={{ borderColor: '#E2E8F0', borderLeft: '4px solid #2563EB' }}
          >
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-sa-muted fw-semibold" style={{ fontSize: '12px' }}>
                Batches Conducted
              </span>
              <div
                className="rounded-3 d-flex align-items-center justify-content-center"
                style={{ width: '34px', height: '34px', backgroundColor: '#EFF6FF', color: '#2563EB' }}
              >
                <Layers size={17} />
              </div>
            </div>
            <div>
              <div className="fw-bold brand-font text-sa-charcoal" style={{ fontSize: '24px', lineHeight: 1.15 }}>
                {uniqueBatchesCount} <span style={{ fontSize: '14px', fontWeight: 500, color: '#64748B' }}>batches</span>
              </div>
              <span className="text-sa-muted mt-1 d-block" style={{ fontSize: '11px' }}>
                Class 11th & 12th divisions
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Daily Teaching Target Progress Bar */}
      <div
        className="sa-card bg-white border p-3.5 rounded-4 shadow-xs"
        style={{ borderColor: '#E2E8F0' }}
      >
        <div className="d-flex align-items-center justify-content-between mb-2">
          <div className="d-flex align-items-center gap-2">
            <Clock size={16} style={{ color: '#8B1216' }} />
            <span className="fw-bold text-sa-charcoal" style={{ fontSize: '13.5px' }}>
              Daily Teaching Hours Target Progress
            </span>
          </div>
          <span className="fw-bold text-sa-charcoal" style={{ fontSize: '13px' }}>
            {totalTeachingHoursToday} / {targetHours} hrs ({progressPercent}%)
          </span>
        </div>
        <div className="progress rounded-pill" style={{ height: '8px', backgroundColor: '#F1F5F9' }}>
          <div
            className="progress-bar rounded-pill"
            role="progressbar"
            style={{ width: `${progressPercent}%`, backgroundColor: '#8B1216', transition: 'width 0.4s ease' }}
            aria-valuenow={progressPercent}
            aria-valuemin="0"
            aria-valuemax="100"
          />
        </div>
      </div>

      {/* 4. Filter, Search & Table Card */}
      <div
        className="sa-card bg-white border rounded-4 p-4 shadow-xs d-flex flex-column gap-3"
        style={{ borderColor: '#E2E8F0' }}
      >
        {/* Table Header with Redirect Button to Topic Duration & Period Allocation Matrix */}
        <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-3 pb-2 border-bottom">
          <div>
            <h2 className="brand-font fw-bold m-0" style={{ fontSize: '18px', color: '#0F172A' }}>
              Student Teaching & Classroom Activity Log
            </h2>
            <span className="text-sa-muted small" style={{ fontSize: '12px' }}>
              Showing {filteredActivities.length} lecture activities logged for today
            </span>
          </div>

          {/* Button to redirect to Topic Duration & Period Allocation Matrix Page */}
          <button
            type="button"
            onClick={() => navigate('/teacher/topic-duration')}
            className="btn btn-sm btn-light border text-sa-maroon d-inline-flex align-items-center gap-2 fw-semibold shadow-xs"
            style={{
              borderColor: '#FBCFE8',
              backgroundColor: '#FDF2F8',
              fontSize: '12.5px',
              borderRadius: '8px',
              padding: '7px 14px',
              cursor: 'pointer'
            }}
            title="Open Topic Duration & Period Allocation Matrix"
          >
            <Clock size={15} />
            <span>Topic Duration & Period Allocation Matrix</span>
            <ChevronRight size={15} />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="d-flex flex-column flex-md-row align-items-stretch align-items-md-center justify-content-between gap-3 pb-3 border-bottom">
          <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ maxWidth: '380px' }}>
            <div className="position-relative w-100">
              <Search size={15} className="position-absolute text-muted" style={{ top: '10px', left: '12px' }} />
              <input
                type="text"
                className="form-control form-control-sm ps-5"
                placeholder="Search by topic, subject, or batch..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ height: '36px', fontSize: '12.5px', borderRadius: '8px' }}
              />
            </div>
          </div>

          <div className="d-flex align-items-center gap-2 flex-wrap">
            <div className="d-flex align-items-center gap-1.5">
              <Filter size={14} className="text-muted" />
              <select
                className="form-select form-select-sm"
                value={selectedBranchFilter}
                onChange={(e) => setSelectedBranchFilter(e.target.value)}
                style={{ height: '36px', fontSize: '12.5px', borderRadius: '8px', width: '160px' }}
              >
                <option value="All">All Branches</option>
                <option value="Tarabai Park">Tarabai Park</option>
                <option value="Mangalwar Peth">Mangalwar Peth</option>
              </select>
            </div>

            <div className="d-flex align-items-center gap-1.5">
              <select
                className="form-select form-select-sm"
                value={selectedActivityFilter}
                onChange={(e) => setSelectedActivityFilter(e.target.value)}
                style={{ height: '36px', fontSize: '12.5px', borderRadius: '8px', width: '180px' }}
              >
                <option value="All">All Activities</option>
                <option value="Classroom Lecture & Theory">Classroom Lecture</option>
                <option value="Practical Lab Session">Practical Lab</option>
                <option value="Doubt Clearing Masterclass">Doubt Clearing</option>
                <option value="Revision & Numericals Solving">Revision Session</option>
                <option value="Test / Exam Evaluation & Analysis">Test Evaluation</option>
                <option value="Study Notes & Assignment Discussion">Study Notes Discussion</option>
              </select>
            </div>

            <select
              className="form-select form-select-sm"
              value={selectedBatchFilter}
              onChange={(e) => setSelectedBatchFilter(e.target.value)}
              style={{ height: '36px', fontSize: '12.5px', borderRadius: '8px', width: '190px' }}
            >
              <option value="All">All Batches</option>
              <option value="12th Science Tarabai Park (Batch A)">12th Science (Tarabai Park)</option>
              <option value="12th Science Mangalwar Peth (Batch A)">12th Science (Mangalwar Peth)</option>
              <option value="11th Science PCM (Batch B)">11th Science (Batch B)</option>
              <option value="12th Science PCB (Batch C)">12th Science (Batch C)</option>
            </select>
          </div>
        </div>

        {/* Activities Table with Edit & Delete Options */}
        <div className="table-responsive border rounded-3 overflow-hidden" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'thin', borderColor: '#FEE2E2', borderRadius: '12px' }}>
          <table className="table table-hover align-middle m-0" style={{ minWidth: '1050px', fontSize: '13px' }}>
            <thead style={{ backgroundColor: '#FFF5F5', borderBottom: '1.5px solid #FEE2E2' }}>
              <tr style={{ height: '42px' }}>
                {selectedBranchFilter === 'All' && (
                  <th style={{ width: '11%', padding: '10px 14px', fontWeight: 700, color: '#8B1216', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Branch</th>
                )}
                <th style={{ width: '16%', padding: '10px 14px', fontWeight: 700, color: '#8B1216', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Activity Type & Subject</th>
                <th style={{ width: '16%', padding: '10px 14px', fontWeight: 700, color: '#8B1216', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Class / Batch</th>
                <th style={{ width: '27%', padding: '10px 14px', fontWeight: 700, color: '#8B1216', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Chapter & Topic Taught</th>
                <th style={{ width: '14%', padding: '10px 14px', fontWeight: 700, color: '#8B1216', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Duration & Time</th>
                <th style={{ width: '10%', padding: '10px 14px', fontWeight: 700, color: '#8B1216', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Status</th>
                <th style={{ width: '6%', padding: '10px 14px', fontWeight: 700, color: '#8B1216', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan={selectedBranchFilter === 'All' ? 7 : 6} className="text-center py-5 text-sa-muted" style={{ fontSize: '13px' }}>
                    No daily activities found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredActivities.map((act) => {
                  const isMangalwar = (act.branch || '').toLowerCase().includes('mangalwar') || (act.batch || '').toLowerCase().includes('mangalwar');

                  return (
                    <tr key={act.id} style={{ height: '58px', borderBottom: '1px solid #F1F5F9' }}>
                      {selectedBranchFilter === 'All' && (
                        <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                          <span
                            className="badge fw-semibold d-inline-flex align-items-center gap-1"
                            style={{
                              backgroundColor: isMangalwar ? '#F0FDFA' : '#FDF0F0',
                              color: isMangalwar ? '#0D9488' : '#8B1216',
                              border: isMangalwar ? '1px solid #99F6E4' : '1px solid #F5C2C4',
                              fontSize: '11px',
                              borderRadius: '6px',
                              padding: '3px 8px'
                            }}
                          >
                            <MapPin size={11} />
                            <span>{isMangalwar ? 'Mangalwar Peth' : 'Tarabai Park'}</span>
                          </span>
                        </td>
                      )}
                      <td style={{ padding: '10px 14px' }}>
                        <div className="fw-semibold text-sa-charcoal" style={{ fontSize: '13px' }}>
                          {act.activity}
                        </div>
                        <span className="text-sa-muted small" style={{ fontSize: '11px' }}>
                          {act.subject}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span className="badge bg-light text-secondary border fw-medium px-2 py-1" style={{ fontSize: '11.5px' }}>
                          {formatClassBatch(act.batch)}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <div className="fw-bold text-sa-charcoal" style={{ fontSize: '13px' }}>
                          {act.topicTaught}
                        </div>
                        {act.chapter && (
                          <div className="text-sa-muted small d-flex align-items-center gap-1 mt-0.5" style={{ fontSize: '11px' }}>
                            <BookOpen size={11} className="text-secondary" />
                            <span>{act.chapter}</span>
                          </div>
                        )}
                        {act.targetDate && (
                          <div className="d-flex align-items-center gap-1 text-sa-maroon fw-semibold mt-1" style={{ fontSize: '11px' }}>
                            <Calendar size={11} />
                            <span>Complete By: {act.targetDate}</span>
                          </div>
                        )}
                        {act.remarks && (
                          <div className="text-sa-muted fst-italic mt-1" style={{ fontSize: '11px' }}>
                            {act.remarks}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        <div className="fw-bold text-sa-charcoal" style={{ fontSize: '12.5px' }}>
                          {act.periods || 1} / {act.totalPlannedPeriods || 2} periods
                        </div>
                        <div className="text-sa-muted small mt-0.5" style={{ fontSize: '11px' }}>
                          {act.hours} hrs • {act.timeSlot}
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        <span className="badge rounded-pill" style={{ backgroundColor: '#EAF6EF', color: '#168554', border: '1px solid #C6E7D2', fontSize: '11px', padding: '4px 10px' }}>
                          ✓ {act.status}
                        </span>
                      </td>
                      {/* Action Column with Edit and Delete buttons */}
                      <td style={{ padding: '10px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div className="d-inline-flex align-items-center justify-content-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(act)}
                            className="btn btn-sm btn-light border text-primary rounded shadow-xs"
                            title="Edit this activity log"
                            style={{ borderColor: '#CBD5E1', cursor: 'pointer', width: '32px', height: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteActivity(act.id)}
                            className="btn btn-sm btn-light border text-danger rounded shadow-xs"
                            title="Delete this activity log"
                            style={{ borderColor: '#CBD5E1', cursor: 'pointer', width: '32px', height: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Trash2 size={14} />
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
      </div>

      {/* 5. Log / Edit Activity Modal */}
      <Modal
        isOpen={isActivityModalOpen}
        onClose={() => {
          setIsActivityModalOpen(false);
          setEditingActivityId(null);
        }}
        title={editingActivityId ? "Edit Daily Activity & Topic Record" : "Log Today's Teaching Activity & Topic"}
        size="lg"
      >
        <form onSubmit={handleSaveActivity} className="d-flex flex-column gap-3">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
            <p className="text-sa-muted m-0" style={{ fontSize: '13px' }}>
              {editingActivityId
                ? "Update the activity details, topic duration, and teaching outcomes below."
                : "Record the topic taught, class batch, and teaching duration for today's daily activity report."}
            </p>
            {!editingActivityId && (
              <button
                type="button"
                onClick={handleTriggerExcelUpload}
                className="btn btn-sm btn-light border text-success d-inline-flex align-items-center gap-1.5 fw-semibold shadow-xs"
                style={{ fontSize: '12px', padding: '5px 12px', borderColor: '#BBF7D0', backgroundColor: '#F0FDF4', cursor: 'pointer' }}
                title="Select an Excel file to automatically populate all fields below"
              >
                <FileSpreadsheet size={14} />
                <span>Auto-fill from Excel</span>
              </button>
            )}
          </div>

          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold small text-sa-charcoal mb-1">Branch</label>
              <select
                className="form-select form-select-sm"
                value={newActivity.branch}
                onChange={(e) => setNewActivity({ ...newActivity, branch: e.target.value })}
                required
              >
                <option value="Tarabai Park">Tarabai Park Branch</option>
                <option value="Mangalwar Peth">Mangalwar Peth Branch</option>
              </select>
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold small text-sa-charcoal mb-1">Activity Type</label>
              <select
                className="form-select form-select-sm"
                value={newActivity.activity}
                onChange={(e) => setNewActivity({ ...newActivity, activity: e.target.value })}
                required
              >
                <option value="Classroom Lecture & Theory">Classroom Lecture & Theory</option>
                <option value="Practical Lab Session">Practical Lab Session</option>
                <option value="Doubt Clearing Masterclass">Doubt Clearing Masterclass</option>
                <option value="Revision & Numericals Solving">Revision & Numericals Solving</option>
                <option value="Test / Exam Evaluation & Analysis">Test / Exam Evaluation & Analysis</option>
                <option value="Study Notes & Assignment Discussion">Study Notes & Assignment Discussion</option>
              </select>
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold small text-sa-charcoal mb-1">Subject</label>
              <input
                type="text"
                className="form-control form-control-sm"
                value={newActivity.subject}
                onChange={(e) => setNewActivity({ ...newActivity, subject: e.target.value })}
                placeholder="e.g. Physics, Chemistry, Maths"
                required
              />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold small text-sa-charcoal mb-1">Class / Batch</label>
              <select
                className="form-select form-select-sm"
                value={newActivity.batch}
                onChange={(e) => setNewActivity({ ...newActivity, batch: e.target.value })}
                required
              >
                <option value="12th Science Tarabai Park (Batch A)">12th Science Tarabai Park (Batch A)</option>
                <option value="11th Science Tarabai Park (Batch A)">11th Science Tarabai Park (Batch A)</option>
                <option value="12th Science Mangalwar Peth (Batch A)">12th Science Mangalwar Peth (Batch A)</option>
                <option value="11th Science Mangalwar Peth (Batch A)">11th Science Mangalwar Peth (Batch A)</option>
                <option value="11th Science PCM (Batch B)">11th Science PCM (Batch B)</option>
                <option value="12th Science PCB (Batch C)">12th Science PCB (Batch C)</option>
                <option value="All Enrolled Batches">All Enrolled Batches</option>
              </select>
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold small text-sa-charcoal mb-1">Chapter / Unit</label>
              <input
                type="text"
                className="form-control form-control-sm"
                value={newActivity.chapter}
                onChange={(e) => setNewActivity({ ...newActivity, chapter: e.target.value })}
                placeholder="e.g. Chapter 7: Wave Optics"
              />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold small text-sa-charcoal mb-1">Target Completion Date ("Complete By")</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={newActivity.targetDate}
                onChange={(e) => setNewActivity({ ...newActivity, targetDate: e.target.value })}
              />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold small text-sa-charcoal mb-1">Time Slot</label>
              <input
                type="text"
                className="form-control form-control-sm"
                value={newActivity.timeSlot}
                onChange={(e) => setNewActivity({ ...newActivity, timeSlot: e.target.value })}
                placeholder="e.g. 02:00 PM - 03:30 PM"
                required
              />
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label fw-semibold small text-sa-charcoal mb-1">Periods Taken</label>
              <input
                type="number"
                min="1"
                max="8"
                className="form-control form-control-sm"
                value={newActivity.periods}
                onChange={(e) => setNewActivity({ ...newActivity, periods: e.target.value })}
                placeholder="e.g. 1 or 2 periods"
                required
              />
              <span className="text-sa-muted" style={{ fontSize: '11px' }}>Number of lecture periods</span>
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label fw-semibold small text-sa-charcoal mb-1">Total Planned Periods</label>
              <input
                type="number"
                min="1"
                max="20"
                className="form-control form-control-sm"
                value={newActivity.totalPlannedPeriods}
                onChange={(e) => setNewActivity({ ...newActivity, totalPlannedPeriods: e.target.value })}
                placeholder="e.g. 3 periods"
              />
              <span className="text-sa-muted" style={{ fontSize: '11px' }}>Total estimated periods</span>
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label fw-semibold small text-sa-charcoal mb-1">Hours Spent Teaching</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="12"
                className="form-control form-control-sm"
                value={newActivity.hours}
                onChange={(e) => setNewActivity({ ...newActivity, hours: e.target.value })}
                required
              />
              <span className="text-sa-muted" style={{ fontSize: '11px' }}>Total clock hours today</span>
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold small text-sa-charcoal mb-1">Activity Status</label>
              <select
                className="form-select form-select-sm"
                value={newActivity.status}
                onChange={(e) => setNewActivity({ ...newActivity, status: e.target.value })}
              >
                <option value="Completed">Completed</option>
                <option value="In Progress">In Progress</option>
              </select>
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold small text-sa-charcoal mb-1">Topic Taught / Syllabus Covered</label>
              <input
                type="text"
                className="form-control form-control-sm"
                value={newActivity.topicTaught}
                onChange={(e) => setNewActivity({ ...newActivity, topicTaught: e.target.value })}
                placeholder="e.g. Wave Optics - Wavefronts & Interference Formulae"
                required
              />
            </div>

            <div className="col-12">
              <label className="form-label fw-semibold small text-sa-charcoal mb-1">Remarks / Learning Outcomes (Optional)</label>
              <textarea
                className="form-control form-control-sm"
                rows={2}
                value={newActivity.remarks}
                onChange={(e) => setNewActivity({ ...newActivity, remarks: e.target.value })}
                placeholder="e.g. Discussed textbook derivations and assigned 5 practice numericals."
              />
            </div>
          </div>

          <div className="d-flex justify-content-end align-items-center gap-2 pt-2 border-top mt-2">
            <button
              type="button"
              onClick={() => {
                setIsActivityModalOpen(false);
                setEditingActivityId(null);
              }}
              className="btn btn-sm btn-light border px-3 py-1.5 fw-medium"
              style={{ borderRadius: '6px', fontSize: '12px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-sm text-white px-3 py-1.5 fw-semibold d-inline-flex align-items-center gap-1.5"
              style={{ backgroundColor: '#8B1216', borderRadius: '6px', fontSize: '12px', border: 'none' }}
            >
              <Check size={14} />
              <span>{editingActivityId ? "Update Activity Log" : "Save Activity Log"}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
