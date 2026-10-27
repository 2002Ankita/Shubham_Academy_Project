import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Calendar,
  CalendarCheck,
  Clock,
  BookOpen,
  FileSpreadsheet,
  Upload,
  Download,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit3,
  Check,
  CheckCircle2,
  Layers,
  User,
  GraduationCap,
  Building2,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  CheckCircle,
  ChevronRight,
  ArrowRight,
  MapPin,
  CalendarDays,
  Grid,
  List,
  Sparkles,
  Bell
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import Modal from '../../components/common/Modal';
import { useConfirm } from '../../context/ConfirmContext';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import curriculumService from '../../services/curriculumService';
import batchService from '../../services/batchService';
import teacherService from '../../services/teacherService';
import { notificationService } from '../../services/notificationService';
import { useAuth } from '../../hooks/useAuth';
import { getUserBranch } from '../../utils/branchUtils';
import { BRANCH_MANGALWAR, BRANCH_TARABAI } from '../../config/branchBatchConfig';

export default function ActivityTimetableManagement() {
  const { user } = useAuth();
  const isSuperAdmin = (user?.role || '').toLowerCase().replace('-', '_').includes('super_admin');
  const activeBranch = getUserBranch(user);
  const isMangal = Boolean(activeBranch && activeBranch.toLowerCase().includes('mangal'));
  const userBranchName = isMangal ? 'Mangalwar Peth' : (activeBranch || 'Tarabai Park');
  const defaultBranchFilter = (!isSuperAdmin && activeBranch) ? userBranchName : 'All';

  const { confirm } = useConfirm();
  const location = useLocation();
  const navigate = useNavigate();

  // Active top-level Tab: 'daily' | 'timetable' | 'syllabus'
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tab') === 'weekly' || params.get('tab') === 'timetable') return 'timetable';
    if (params.get('tab') === 'syllabus' || params.get('tab') === 'lecture-plan') return 'syllabus';
    return 'daily';
  });

  // View mode for activities: 'excel' (as-it-is spreadsheet structure) or 'logs' (detailed log table)
  const [dailyViewMode, setDailyViewMode] = useState('excel');

  // Track published and requested weeks
  const [publishedWeeks, setPublishedWeeks] = useState(() => {
    try {
      const saved = localStorage.getItem('sa_published_timetable_weeks');
      return saved ? JSON.parse(saved) : ['2026-10-12'];
    } catch {
      return ['2026-10-12'];
    }
  });

  const [requestedWeeks, setRequestedWeeks] = useState(() => {
    try {
      const saved = localStorage.getItem('sa_requested_timetable_weeks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Listen for tab query changes from notification clicks
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('tab') === 'weekly' || params.get('tab') === 'timetable') {
      setActiveTab('timetable');
    } else if (params.get('tab') === 'syllabus' || params.get('tab') === 'lecture-plan') {
      setActiveTab('syllabus');
    }
  }, [location.search]);

  // Sync published and requested weeks
  useEffect(() => {
    const syncWeeks = () => {
      try {
        const pub = localStorage.getItem('sa_published_timetable_weeks');
        if (pub) setPublishedWeeks(JSON.parse(pub));
        const req = localStorage.getItem('sa_requested_timetable_weeks');
        if (req) setRequestedWeeks(JSON.parse(req));
      } catch (e) {
        console.warn(e);
      }
    };
    window.addEventListener('sa_timetable_updated', syncWeeks);
    window.addEventListener('sa_notifications_updated', syncWeeks);
    return () => {
      window.removeEventListener('sa_timetable_updated', syncWeeks);
      window.removeEventListener('sa_notifications_updated', syncWeeks);
    };
  }, []);

  // Admin function to publish a week's timetable
  const handlePublishWeek = (weekKey = '2026-10-19', weekLabel = 'Mon, 19 Oct – Sat, 24 Oct 2026') => {
    const updatedPublished = Array.from(new Set([...publishedWeeks, weekKey]));
    setPublishedWeeks(updatedPublished);
    localStorage.setItem('sa_published_timetable_weeks', JSON.stringify(updatedPublished));

    const updatedRequested = requestedWeeks.filter(k => k !== weekKey);
    setRequestedWeeks(updatedRequested);
    localStorage.setItem('sa_requested_timetable_weeks', JSON.stringify(updatedRequested));

    notificationService.addNotification({
      id: `NTF-TT-PUB-${weekKey}-${Date.now()}`,
      title: `Timetable Published: ${weekLabel}`,
      type: 'timetable_published',
      category: 'Academic Timetable & Scheduling',
      priority: 'Normal',
      author: 'Academic Administration',
      details: `The weekly timetable for ${weekLabel} has been officially published and synchronized. Lecture slots are now active under My Classes.`
    });

    window.dispatchEvent(new CustomEvent('sa_timetable_updated'));
    window.dispatchEvent(new CustomEvent('sa_notifications_updated'));
    toast.success(`Weekly timetable published for ${weekLabel}! Respective teacher portals updated.`);
  };

  // Loading state
  const [loading, setLoading] = useState(false);

  // -------------------------------------------------------------
  // DATA STATES
  // -------------------------------------------------------------
  const [dailyActivities, setDailyActivities] = useState([]);
  const [batches, setBatches] = useState([]);
  const [teachers, setTeachers] = useState([]);

  // Faculty mapping presets by Subject using registered faculty
  const defaultFacultyBySubject = {
    'Physics': 'More A.D',
    'Chemistry': 'More A.D',
    'Mathematics': 'veer 1',
    'Biology': 'Shri'
  };

  const facultyColorMap = {
    'Physics': '#1D4ED8',
    'Chemistry': '#BE185D',
    'Mathematics': '#15803D',
    'Biology': '#7E22CE'
  };

  // Dynamically populated from registered faculty in database
  const dynamicFacultyList = useMemo(() => {
    const list = [{ id: 'All', label: 'All Faculty Activities', badge: 'All', color: '#8B1216' }];
    if (teachers && teachers.length > 0) {
      teachers.forEach(t => {
        const name = t.name || t.full_name || (t.user ? t.user.full_name : '');
        if (name && !list.some(x => x.id === name)) {
          list.push({
            id: name,
            label: name,
            badge: t.subject || 'Faculty',
            color: facultyColorMap[t.subject] || '#4F46E5'
          });
        }
      });
    } else {
      [
        { id: 'More A.D', label: 'More A.D', badge: 'Physics', color: '#1D4ED8' },
        { id: 'veer 1', label: 'veer 1', badge: 'Maths', color: '#15803D' },
        { id: 'Shri', label: 'Shri', badge: 'Biology', color: '#7E22CE' },
        { id: 'Swami ', label: 'Swami ', badge: 'Physics', color: '#0284C7' }
      ].forEach(f => list.push(f));
    }
    return list;
  }, [teachers]);

  // Branch list
  const branches = ['Tarabai Park', 'Mangalwar Peth'];

  // -------------------------------------------------------------
  // INITIAL FETCH & REALTIME LISTENERS
  // -------------------------------------------------------------
  const loadData = async () => {
    setLoading(true);
    try {
      const [actData, batchData, teacherData] = await Promise.all([
        curriculumService.getDailyActivities().catch(() => []),
        batchService.getBatches().catch(() => []),
        teacherService.getAll().catch(() => [])
      ]);

      if (Array.isArray(actData) && actData.length > 0) {
        const mapped = actData.map(item => {
          return {
            ...item,
            id: item.id || String(item._id),
            branch: item.branch || '',
            chapter: item.chapter || (item.topic_taught && item.topic_taught.includes('-') ? item.topic_taught.split('-')[0].trim() : (item.topic_taught || 'Curriculum Chapter')),
            topicTaught: item.topic_taught || item.topicTaught || '',
            timeSlot: item.time_slot || item.timeSlot || '',
            periods: parseInt(item.periods || 1, 10),
            totalPlannedPeriods: item.total_planned_periods || item.totalPlannedPeriods || item.periods || 1,
            hours: parseFloat(item.hours || 1.0),
            targetDate: item.target_date || item.targetDate || item.activity_date || '',
            teacherName: item.teacher_name || item.teacherName || '',
            batch: item.batch || '',
            status: item.status || 'Completed'
          };
        });
        setDailyActivities(mapped);
      } else {
        setDailyActivities([]);
      }

      if (Array.isArray(batchData)) {
        setBatches(batchData);
      }
      if (Array.isArray(teacherData)) {
        setTeachers(teacherData);
      }
      await loadSyllabusData();
    } catch (err) {
      console.error('Failed to load activity data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => loadData();
    window.addEventListener('sa_daily_activities_updated', handleUpdate);
    window.addEventListener('sa_timetable_updated', handleUpdate);
    return () => {
      window.removeEventListener('sa_daily_activities_updated', handleUpdate);
      window.removeEventListener('sa_timetable_updated', handleUpdate);
    };
  }, []);

  // -------------------------------------------------------------
  // TAB 3: SYLLABUS & LECTURE BREAKDOWN PLAN (BOARDS VS ENTRANCE)
  // -------------------------------------------------------------
  const [syllabusList, setSyllabusList] = useState([]);
  const [syllabusSubject, setSyllabusSubject] = useState('Physics');
  const [syllabusStandard, setSyllabusStandard] = useState('12th');
  const [syllabusAcademicYear, setSyllabusAcademicYear] = useState('2026 – 2027');
  const [syllabusSearch, setSyllabusSearch] = useState('');
  const syllabusExcelInputRef = useRef(null);

  // Add / Edit chapter modal state
  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
  const [editingChapterId, setEditingChapterId] = useState(null);
  const [chapterForm, setChapterForm] = useState({
    sr_no: '',
    title: '',
    boards_lectures: 6,
    entrance_lectures: 2,
    subject: 'Physics',
    standard: '12th',
    academic_year: '2026 – 2027',
    branch_scope: 'mp/tp'
  });

  const loadSyllabusData = async () => {
    try {
      const data = await curriculumService.getSyllabusPlan({
        subject: 'All',
        standard: syllabusStandard,
        academic_year: syllabusAcademicYear
      });
      if (Array.isArray(data)) {
        setSyllabusList(data);
      }
    } catch (err) {
      console.warn('Failed to load syllabus plan:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'syllabus') {
      loadSyllabusData();
    }
  }, [activeTab]);

  const filteredSyllabusList = useMemo(() => {
    return syllabusList
      .filter((item) => {
        const matchSubject = syllabusSubject === 'All' || !syllabusSubject ||
          (item.subject && item.subject.toLowerCase() === syllabusSubject.toLowerCase());
        const matchSearch = !syllabusSearch.trim() ||
          (item.title && item.title.toLowerCase().includes(syllabusSearch.toLowerCase())) ||
          String(item.sr_no).includes(syllabusSearch);
        return matchSubject && matchSearch;
      })
      .sort((a, b) => {
        const subA = String(a.subject || '');
        const subB = String(b.subject || '');
        if (subA.toLowerCase() !== subB.toLowerCase()) {
          const order = { physics: 1, chemistry: 2, mathematics: 3, maths: 3, biology: 4 };
          const ordA = order[subA.toLowerCase()] || 99;
          const ordB = order[subB.toLowerCase()] || 99;
          if (ordA !== ordB) return ordA - ordB;
          return subA.localeCompare(subB);
        }
        return (Number(a.sr_no) || 0) - (Number(b.sr_no) || 0);
      });
  }, [syllabusList, syllabusSubject, syllabusSearch]);

  const totalSyllabusChapters = filteredSyllabusList.length;
  const totalBoardsLec = filteredSyllabusList.reduce((acc, curr) => acc + (Number(curr.boards_lectures) || 0), 0);
  const totalEntranceLec = filteredSyllabusList.reduce((acc, curr) => acc + (Number(curr.entrance_lectures) || 0), 0);
  const totalAllLec = totalBoardsLec + totalEntranceLec;

  // Strict Column Header Matchers (prevents words like "Current", "Elements", "Differentiation", etc. from being treated as headers)
  const isSrHeader = (val) => /^(sr\.?\s*no\.?|sr|sno|srnum|no\.?)$/i.test(String(val || '').trim());
  const isTitleHeader = (val) => /^(title|chapter|chapter\s*name|topic|topic\s*name|unit)$/i.test(String(val || '').trim());
  const isBoardsHeader = (val) => /^(boards?|board\s*lectures?|theory)$/i.test(String(val || '').trim());
  const isEntranceHeader = (val) => /^(entrance|entrance\s*lectures?|ent|neet|jee|cet)$/i.test(String(val || '').trim());

  // Helper to detect if a cell or header text represents a subject section banner (Strict whole-match to avoid false positives on chapters)
  const isSubjectBannerText = (text = '') => {
    if (!text) return null;
    const s = String(text).trim().toLowerCase();
    if (!s) return null;
    if (/^(11th|12th)?\s*physics(\s*(mp\/tp|curriculum|lecture plan|theory))?$/i.test(s) || /^(subject\s*[:\-])?\s*physics$/i.test(s)) {
      return 'Physics';
    }
    if (/^(11th|12th)?\s*chemistry(\s*(mp\/tp|curriculum|lecture plan|theory))?$/i.test(s) || /^(subject\s*[:\-])?\s*chemistry$/i.test(s)) {
      return 'Chemistry';
    }
    if (/^(11th|12th)?\s*(maths?|mathematics)(\s*(part|part\s*[-–]?\s*[12]|[-–]?\s*[12iI]+))?(\s*(mp\/tp|curriculum|lecture plan))?$/i.test(s) || /^(subject\s*[:\-])?\s*(maths?|mathematics)$/i.test(s)) {
      return 'Mathematics';
    }
    if (/^(11th|12th)?\s*(biology|bio)(\s*(mp\/tp|curriculum|lecture plan))?$/i.test(s) || /^(subject\s*[:\-])?\s*biology$/i.test(s)) {
      return 'Biology';
    }
    return null;
  };

  // Helper to detect subject from chapter title keywords as a secondary fallback
  const detectSubjectFromChapterTitle = (title = '') => {
    const t = String(title).toLowerCase();
    // Biology keywords
    if (/reproduction|inheritance|molecular basis|origin and evalution|origin and evolution|water relation|plant growth|respiration|circulation|control and co-ordination|human health|food production|biotechnology|organisms and populations|ecosystems|biodiversity|botany|zoology/.test(t)) {
      return 'Biology';
    }
    // Chemistry keywords
    if (/solid state|solutions|ionic equilibria|chemical thermodynamics|electrochemistry|chemical kinetics|groups 16|transition|coordination compounds|halogen|alcohols|aldehydes|corboxylic|amines|biomolecules|polymer chemistry|green chemistry/.test(t)) {
      return 'Chemistry';
    }
    // Physics keywords
    if (/rotational dynamics|mechanical properties|kinetic theory|radiation|oscillations|superposition|waves optics|wave optics|electrostatics|current electricity|magnetic fields|magnetic materials|electromagnetic|electromegnetic|ac circuits|atoms and nuclei|semiconductor/.test(t)) {
      return 'Physics';
    }
    // Mathematics keywords
    if (/mathematical logic|matrices|trigonometric|trignometric|straight lines|vectors|line and plane|linear programming|differentiation|applications of derivatives|integration|integrations|differential equations|probability distributions|binomial/.test(t)) {
      return 'Mathematics';
    }
    return null;
  };

  // Smart Multi-Subject Parser for Syllabus Excel Sheets (Handles single-sheet stacked & multi-sheet files)
  const processSyllabusWorkbook = async (workbook, shouldSwitchTab = true) => {
    let totalImportedChapters = 0;
    const chaptersBySubject = {
      'Physics': [],
      'Chemistry': [],
      'Mathematics': [],
      'Biology': []
    };

    let detectedYear = '2026 – 2027';
    let detectedStandard = '12th';
    let detectedScope = 'Mangalwar Peth & Tarabai Park';

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      if (!rawRows || rawRows.length === 0) continue;

      let sheetDefaultSubject = isSubjectBannerText(sheetName);
      let currentSubject = sheetDefaultSubject || (syllabusSubject !== 'All' ? syllabusSubject : 'Physics');
      let colIndexMap = { sr: 0, title: 1, boards: 2, entrance: 3 };

      for (let r = 0; r < rawRows.length; r++) {
        const row = rawRows[r];
        if (!row || row.length === 0) continue;

        const rowCleanStr = row.map(c => String(c).trim()).filter(Boolean).join(' ').toLowerCase();
        if (!rowCleanStr) continue;

        // Check for 12th 2026 - 2027 academic year header
        if (rowCleanStr.includes('2026') || rowCleanStr.includes('2027')) {
          const match = rowCleanStr.match(/(11th|12th)?.*?(202[4-9]\s*[-–]\s*202[5-9])/i);
          if (match) {
            if (match[1]) detectedStandard = match[1];
            if (match[2]) detectedYear = match[2].replace('-', '–');
          }
          continue; // Skip the top year banner
        }

        // Check if this row is a Table Column Header Row (Sr.no, Title, Boards, Entrance)
        let headerMatches = 0;
        const tempMap = { ...colIndexMap };
        row.forEach((cell, cIdx) => {
          if (isSrHeader(cell)) {
            tempMap.sr = cIdx;
            headerMatches++;
          } else if (isTitleHeader(cell)) {
            tempMap.title = cIdx;
            headerMatches++;
          } else if (isBoardsHeader(cell)) {
            tempMap.boards = cIdx;
            headerMatches++;
          } else if (isEntranceHeader(cell)) {
            tempMap.entrance = cIdx;
            headerMatches++;
          }
        });
        if (headerMatches >= 2) {
          colIndexMap = tempMap;
          continue; // Skip the column header row itself
        }

        // Check if this row is a Subject Section Header (e.g. "Physics", "Chemistry", "Maths 1", "Biology")
        let foundSubjectInRow = null;
        for (const cell of row) {
          const sub = isSubjectBannerText(cell);
          if (sub) {
            foundSubjectInRow = sub;
            break;
          }
        }
        if (foundSubjectInRow) {
          currentSubject = foundSubjectInRow;
          continue; // It's a subject banner row, not a chapter!
        }

        // Check for branch scope banner like "No of lec for mp/tp"
        if (rowCleanStr.includes('mp/tp') || rowCleanStr.includes('mp / tp') || (rowCleanStr.includes('mangalwar') && rowCleanStr.includes('tarabai'))) {
          detectedScope = 'Mangalwar Peth & Tarabai Park';
        } else if (rowCleanStr.includes('mangalwar')) {
          detectedScope = 'Mangalwar Peth';
        } else if (rowCleanStr.includes('tarabai')) {
          detectedScope = 'Tarabai Park';
        }

        // Skip banner text rows like "No of lec for mp/tp" or pure year headers
        if (rowCleanStr.includes('no of lec') || rowCleanStr.includes('target completion')) {
          continue;
        }

        // Now inspect the Chapter Title
        const rawTitle = String(row[colIndexMap.title] || row[1] || '').trim();
        if (!rawTitle || /^(title|total|grand total|sub total|target|remark|remarks|no of lec|sr\.?\s*no)/i.test(rawTitle)) {
          continue;
        }

        // If the title itself is just a subject name banner, switch subject and skip row
        const titleAsSubject = isSubjectBannerText(rawTitle);
        if (titleAsSubject) {
          currentSubject = titleAsSubject;
          continue;
        }

        // Determine correct subject for chapter (using currentSubject or title keyword fallback)
        let finalSubject = currentSubject;
        const keywordSubject = detectSubjectFromChapterTitle(rawTitle);
        if (keywordSubject) {
          finalSubject = keywordSubject;
          currentSubject = keywordSubject; // Lock on to this subject for subsequent rows
        }

        // Parse numerical columns
        const rawSr = parseInt(row[colIndexMap.sr], 10);
        const boardsVal = parseInt(row[colIndexMap.boards], 10) || 0;
        const entranceVal = parseInt(row[colIndexMap.entrance], 10) || 0;
        const totalVal = boardsVal + entranceVal;

        if (!chaptersBySubject[finalSubject]) {
          chaptersBySubject[finalSubject] = [];
        }

        const srVal = !isNaN(rawSr) && rawSr > 0 ? rawSr : (chaptersBySubject[finalSubject].length + 1);

        chaptersBySubject[finalSubject].push({
          sr_no: srVal,
          title: rawTitle,
          boards_lectures: boardsVal,
          entrance_lectures: entranceVal,
          total_lectures: totalVal
        });
      }
    }

    // Now save each subject's chapters to MongoDB
    const importedSummary = [];
    let firstImportedSubject = null;

    for (const [sub, chapters] of Object.entries(chaptersBySubject)) {
      if (chapters.length > 0) {
        await curriculumService.saveBulkSyllabusPlan({
          subject: sub,
          standard: detectedStandard,
          academic_year: detectedYear,
          branch_scope: 'mp/tp',
          chapters
        });
        totalImportedChapters += chapters.length;
        importedSummary.push(`${sub}: ${chapters.length}`);
        if (!firstImportedSubject) {
          firstImportedSubject = sub;
        }
      }
    }

    if (totalImportedChapters > 0) {
      toast.success(`Successfully imported ${totalImportedChapters} chapters! (${importedSummary.join(', ')})`);
      // Keep Excel sheet view focused on the first imported subject (e.g. Physics) rather than merging into All
      setSyllabusSubject(firstImportedSubject || 'Physics');
      if (shouldSwitchTab) {
        setActiveTab('syllabus');
      }
      await loadSyllabusData();
      return { success: true, chaptersBySubject, totalImportedChapters, detectedStandard, detectedYear, detectedScope };
    }
    return { success: false, chaptersBySubject: {}, totalImportedChapters: 0, detectedStandard, detectedYear, detectedScope };
  };

  const handleTriggerSyllabusExcel = () => {
    if (syllabusExcelInputRef.current) {
      syllabusExcelInputRef.current.value = '';
      syllabusExcelInputRef.current.click();
    }
  };

  const handleSyllabusExcelUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const binaryString = evt.target.result;
        const workbook = XLSX.read(binaryString, { type: 'binary' });
        const result = await processSyllabusWorkbook(workbook, true);
        if (!result?.success) {
          toast.warning('No valid chapter records found. Please check columns: Sr.no, Title, Boards, Entrance.');
        }
      } catch (err) {
        console.error('Failed to parse syllabus Excel:', err);
        toast.error('Failed to parse Excel file. Please use a valid .xlsx or .xls file.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleExportSyllabusExcel = () => {
    if (!filteredSyllabusList || filteredSyllabusList.length === 0) {
      toast.warning('No syllabus data available to export.');
      return;
    }

    const wsData = [
      ['', `${syllabusStandard} ${syllabusAcademicYear}`, '', ''],
      ['', syllabusSubject, 'No of lec for mp/tp', ''],
      ['Sr.no', 'Title', 'Boards', 'Entrance', 'Total']
    ];

    let totalBoards = 0;
    let totalEntrance = 0;

    filteredSyllabusList.forEach((item, idx) => {
      const b = item.boards_lectures || 0;
      const e = item.entrance_lectures || 0;
      totalBoards += b;
      totalEntrance += e;
      wsData.push([item.sr_no || idx + 1, item.title, b, e, b + e]);
    });

    wsData.push(['', 'Total Lectures', totalBoards, totalEntrance, totalBoards + totalEntrance]);

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!merges'] = [
      { s: { r: 0, c: 1 }, e: { r: 0, c: 3 } },
      { s: { r: 1, c: 2 }, e: { r: 1, c: 3 } }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, syllabusSubject);
    XLSX.writeFile(wb, `${syllabusSubject}_${syllabusStandard}_${syllabusAcademicYear.replace(/\s+/g, '')}_Lecture_Plan.xlsx`);
    toast.success(`Exported ${syllabusSubject} lecture plan to Excel!`);
  };

  const handleDownloadSyllabusTemplate = () => {
    const wb = XLSX.utils.book_new();

    // Physics Sheet
    const physicsData = [
      ['', '12th 2026 – 2027', '', ''],
      ['', 'Physics', 'No of lec for mp/tp', ''],
      ['Sr.no', 'Title', 'Boards', 'Entrance'],
      [1, 'Rotational Dynamics', 7, 3],
      [2, 'Mechanical Properties of Fluids', 7, 3],
      [3, 'Kinetic Theory of Gases and Radiation', 5, 2],
      [4, 'Thermodynamics', 7, 3],
      [5, 'Oscillations', 6, 3],
      [6, 'Superposition of waves', 6, 2],
      [7, 'Waves Optics', 7, 2],
      [8, 'Electrostatics', 7, 3],
      [9, 'Current Electricity', 6, 2],
      [10, 'Magnetic fields due to Electric Current', 6, 2],
      [11, 'Magnetic Materials', 5, 1],
      [12, 'Electromagnetic Induction', 6, 2],
      [13, 'AC circuits', 6, 2],
      [14, 'Dual Nature of Radiation and Matter', 3, 1],
      [15, 'Structure of Atoms and Nuclei', 5, 2],
      [16, 'Semiconductor Devices', 5, 1]
    ];
    const wsPhysics = XLSX.utils.aoa_to_sheet(physicsData);
    wsPhysics['!merges'] = [
      { s: { r: 0, c: 1 }, e: { r: 0, c: 3 } },
      { s: { r: 1, c: 2 }, e: { r: 1, c: 3 } }
    ];
    XLSX.utils.book_append_sheet(wb, wsPhysics, 'Physics');

    // Chemistry Sheet
    const chemData = [
      ['', '12th 2026 – 2027', '', ''],
      ['', 'Chemistry', 'No of lec for mp/tp', ''],
      ['Sr.no', 'Title', 'Boards', 'Entrance'],
      [1, 'Solid State', 6, 3],
      [2, 'Solutions', 7, 3],
      [3, 'Ionic Equilibria', 6, 2],
      [4, 'Chemical Thermodynamics', 7, 3],
      [5, 'Electrochemistry', 5, 3],
      [6, 'Chemical Kinetics', 6, 3],
      [7, 'Elements of groups 16, 17 and 18', 8, 3],
      [8, 'Transition and Inner transition Elements', 5, 3],
      [9, 'Coordination Compounds', 5, 3],
      [10, 'Halogen Derivatives', 6, 3],
      [11, 'Alcohols, Phenols and Ethers', 6, 3],
      [12, 'Aldehydes, Ketones and Carboxylic Acids', 8, 3],
      [13, 'Amines', 4, 2],
      [14, 'Biomolecules', 5, 3],
      [15, 'Introduction to Polymer Chemistry', 4, 2],
      [16, 'Green Chemistry and Nano Chemistry', 3, 1]
    ];
    const wsChem = XLSX.utils.aoa_to_sheet(chemData);
    wsChem['!merges'] = [
      { s: { r: 0, c: 1 }, e: { r: 0, c: 3 } },
      { s: { r: 1, c: 2 }, e: { r: 1, c: 3 } }
    ];
    XLSX.utils.book_append_sheet(wb, wsChem, 'Chemistry');

    // Mathematics Sheet
    const mathData = [
      ['', '12th 2026 – 2027', '', ''],
      ['', 'Mathematics', 'No of lec for mp/tp', ''],
      ['Sr.no', 'Title', 'Boards', 'Entrance'],
      [1, 'Mathematical Logic', 11, 2],
      [2, 'Matrices', 7, 2],
      [3, 'Trigonometric Functions', 11, 2],
      [4, 'Pair of Straight Lines', 6, 2],
      [5, 'Vectors', 5, 4],
      [6, 'Line and Plane', 5, 3],
      [7, 'Linear Programming', 4, 2],
      [8, 'Differentiation', 15, 3],
      [9, 'Applications of Derivatives', 12, 2],
      [10, 'Indefinite Integration', 16, 3],
      [11, 'Definite Integration', 9, 2],
      [12, 'Applications of Definite Integration', 4, 2],
      [13, 'Differential Equations', 9, 2],
      [14, 'Probability Distributions', 5, 2],
      [15, 'Binomial Distribution', 4, 2]
    ];
    const wsMath = XLSX.utils.aoa_to_sheet(mathData);
    wsMath['!merges'] = [
      { s: { r: 0, c: 1 }, e: { r: 0, c: 3 } },
      { s: { r: 1, c: 2 }, e: { r: 1, c: 3 } }
    ];
    XLSX.utils.book_append_sheet(wb, wsMath, 'Mathematics');

    // Biology Sheet
    const bioData = [
      ['', '12th 2026 – 2027', '', ''],
      ['', 'Biology', 'No of lec for mp/tp', ''],
      ['Sr.no', 'Title', 'Boards', 'Entrance'],
      [1, 'Reproduction in Lower and Higher Plants', 8, 2],
      [2, 'Reproduction in Lower and Higher Animals', 8, 2],
      [3, 'Inheritance and Variation', 6, 2],
      [4, 'Molecular Basis of Inheritance', 10, 3],
      [5, 'Origin and Evolution of Life', 6, 2],
      [6, 'Plant Water Relation', 6, 2],
      [7, 'Plant Growth and Mineral Nutrition', 6, 2],
      [8, 'Respiration and Circulation', 10, 3],
      [9, 'Control and Co-ordination', 12, 3],
      [10, 'Human Health and Diseases', 6, 2],
      [11, 'Enhancement of Food Production', 5, 2],
      [12, 'Biotechnology', 8, 2],
      [13, 'Organisms and Populations', 4, 1],
      [14, 'Ecosystems and Energy Flow', 4, 1],
      [15, 'Biodiversity, Conservation and Environmental Issues', 6, 2]
    ];
    const wsBio = XLSX.utils.aoa_to_sheet(bioData);
    wsBio['!merges'] = [
      { s: { r: 0, c: 1 }, e: { r: 0, c: 3 } },
      { s: { r: 1, c: 2 }, e: { r: 1, c: 3 } }
    ];
    XLSX.utils.book_append_sheet(wb, wsBio, 'Biology');

    XLSX.writeFile(wb, 'Shubham_Academy_Syllabus_Plan_Template.xlsx');
    toast.success('Downloaded complete 4-subject syllabus template (Physics, Chemistry, Maths, Biology)!');
  };

  const handleOpenAddChapterModal = (targetSubject) => {
    const defaultSub = (targetSubject && targetSubject !== 'All') ? targetSubject : (syllabusSubject === 'All' ? 'Physics' : syllabusSubject);
    const existingForSub = syllabusList.filter((s) => s.subject && s.subject.toLowerCase() === defaultSub.toLowerCase());
    setEditingChapterId(null);
    setChapterForm({
      sr_no: String(existingForSub.length + 1),
      title: '',
      boards_lectures: 6,
      entrance_lectures: 2,
      subject: defaultSub,
      standard: syllabusStandard,
      academic_year: syllabusAcademicYear,
      branch_scope: 'mp/tp'
    });
    setIsChapterModalOpen(true);
  };

  const handleOpenEditChapterModal = (chapter) => {
    setEditingChapterId(chapter.id || chapter.topic_id);
    setChapterForm({
      sr_no: String(chapter.sr_no || ''),
      title: chapter.title || chapter.topic_name || '',
      boards_lectures: chapter.boards_lectures || 0,
      entrance_lectures: chapter.entrance_lectures || 0,
      subject: chapter.subject || syllabusSubject,
      standard: chapter.standard || syllabusStandard,
      academic_year: chapter.academic_year || syllabusAcademicYear,
      branch_scope: chapter.branch_scope || 'mp/tp'
    });
    setIsChapterModalOpen(true);
  };

  const handleSaveChapterForm = async (e) => {
    e.preventDefault();
    if (!chapterForm.title.trim()) {
      toast.warning('Please enter a chapter title.');
      return;
    }

    try {
      const bLec = parseInt(chapterForm.boards_lectures, 10) || 0;
      const eLec = parseInt(chapterForm.entrance_lectures, 10) || 0;
      const tLec = bLec + eLec;

      if (editingChapterId) {
        await curriculumService.updateTopicDuration(editingChapterId, {
          title: chapterForm.title,
          chapter: chapterForm.title,
          topic_name: chapterForm.title,
          sr_no: parseInt(chapterForm.sr_no, 10) || 1,
          boards_lectures: bLec,
          entrance_lectures: eLec,
          total_lectures: tLec,
          required_periods: tLec,
          subject: chapterForm.subject,
          standard: chapterForm.standard,
          academic_year: chapterForm.academic_year,
          branch_scope: chapterForm.branch_scope
        });
        toast.success(`Updated chapter: ${chapterForm.title}`);
      } else {
        await curriculumService.saveBulkSyllabusPlan({
          subject: chapterForm.subject,
          standard: chapterForm.standard,
          academic_year: chapterForm.academic_year,
          branch_scope: chapterForm.branch_scope,
          chapters: [
            {
              sr_no: parseInt(chapterForm.sr_no, 10) || (filteredSyllabusList.length + 1),
              title: chapterForm.title,
              boards_lectures: bLec,
              entrance_lectures: eLec,
              total_lectures: tLec
            }
          ]
        });
        toast.success(`Added chapter: ${chapterForm.title}`);
      }
      setIsChapterModalOpen(false);
      loadSyllabusData(chapterForm.subject);
    } catch (err) {
      console.error('Failed to save chapter:', err);
      toast.error('Failed to save chapter.');
    }
  };

  const handleDeleteChapter = async (chapter) => {
    const isOk = await confirm({
      title: 'Delete Chapter',
      message: `Are you sure you want to remove "${chapter.title}" from the ${chapter.subject} syllabus plan?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger'
    });
    if (!isOk) return;

    try {
      await curriculumService.deleteTopicDuration(chapter.id || chapter.topic_id);
      toast.success(`Deleted chapter: ${chapter.title}`);
      loadSyllabusData(chapter.subject || syllabusSubject);
    } catch (err) {
      console.error('Failed to delete chapter:', err);
      toast.error('Failed to delete chapter.');
    }
  };

  // -------------------------------------------------------------
  // TAB 1: DAILY ACTIVITIES LOGIC & EXCEL IMPORT
  // -------------------------------------------------------------
  const [dailySearch, setDailySearch] = useState('');
  const [dailyDateFilter, setDailyDateFilter] = useState('');
  const [dailyBranchFilter, setDailyBranchFilter] = useState(defaultBranchFilter);
  const [dailyTeacherFilter, setDailyTeacherFilter] = useState('All');
  const [dailySubjectFilter, setDailySubjectFilter] = useState('All');
  const [dailyBatchFilter, setDailyBatchFilter] = useState('All');
  const [dailyStatusFilter, setDailyStatusFilter] = useState('All');

  // Daily Activity Modal (Add / Edit)
  const [isDailyModalOpen, setIsDailyModalOpen] = useState(false);
  const [editingDailyId, setEditingDailyId] = useState(null);
  const [dailyForm, setDailyForm] = useState({
    branch: (!isSuperAdmin && activeBranch) ? userBranchName : 'Tarabai Park',
    activity: 'Classroom Lecture & Theory',
    subject: 'Physics',
    teacherName: 'More A.D',
    batch: '12th pcm tarabai park',
    chapter: 'Chapter 7: Wave Optics',
    topicTaught: '',
    timeSlot: '03:00 PM - 04:00 PM',
    periods: '1',
    totalPlannedPeriods: '2',
    hours: '1.0',
    targetDate: new Date().toISOString().split('T')[0],
    status: 'Completed',
    remarks: ''
  });

  // Excel Daily Activities Import States
  const dailyExcelInputRef = useRef(null);
  const [isDailyImportModalOpen, setIsDailyImportModalOpen] = useState(false);
  const [dailyParsedData, setDailyParsedData] = useState([]);

  const handleTriggerDailyExcel = () => {
    if (dailyExcelInputRef.current) {
      dailyExcelInputRef.current.value = '';
      dailyExcelInputRef.current.click();
    }
  };

  const handleDailyExcelChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const binaryString = evt.target.result;
        const workbook = XLSX.read(binaryString, { type: 'binary' });

        // Auto-detect if this is the Syllabus / Lecture Plan format (Boards vs Entrance for mp/tp)
        const firstSheetName = workbook.SheetNames[0];
        const sheetDump = JSON.stringify(workbook.Sheets[firstSheetName] || {}).toLowerCase();
        const isSyllabusSheet = (sheetDump.includes('entrance') && (sheetDump.includes('boards') || sheetDump.includes('mp/tp') || sheetDump.includes('rotational') || sheetDump.includes('solid state')));

        if (isSyllabusSheet) {
          // Immediately process syllabus and switch to the exact As-It-Is Excel sheet view
          await processSyllabusWorkbook(workbook, true);
          return;
        }

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json(sheet);

        if (!rawData || rawData.length === 0) {
          toast.warning('The uploaded Excel file has no records.');
          return;
        }

        const parsed = rawData.map((row) => {
          const norm = {};
          for (const k in row) {
            const cleanKey = k.toLowerCase().replace(/[^a-z0-9]/g, '');
            norm[cleanKey] = row[k];
          }

          const branch = String(norm['branch'] || norm['branchname'] || norm['location'] || norm['center'] || norm['campus'] || '').trim();
          const activity = String(norm['activitytype'] || norm['activity'] || norm['type'] || 'Classroom Lecture & Theory').trim();
          let subject = String(norm['subject'] || norm['sub'] || norm['subjectname'] || norm['course'] || '').trim();
          if (subject.toLowerCase().includes('physic')) subject = 'Physics';
          else if (subject.toLowerCase().includes('chem')) subject = 'Chemistry';
          else if (subject.toLowerCase().includes('math')) subject = 'Mathematics';
          else if (subject.toLowerCase().includes('bio')) subject = 'Biology';

          const batch = String(norm['classbatch'] || norm['batch'] || norm['batchname'] || norm['class'] || norm['standard'] || norm['std'] || '').trim();
          const chapter = String(norm['chapter'] || norm['chaptername'] || norm['unit'] || norm['modulename'] || norm['module'] || '').trim();
          const topicTaught = String(norm['topictaught'] || norm['topictaughtsyllabuscovered'] || norm['topic'] || norm['topicname'] || norm['syllabus'] || norm['syllabuscovered'] || norm['title'] || chapter || '').trim();
          const timeSlot = String(norm['timeslot'] || norm['time'] || norm['slot'] || norm['timing'] || '').trim();
          const periods = parseInt(norm['periodstaken'] || norm['periods'] || norm['period'] || norm['lectures'] || norm['lec'] || norm['totallectures'] || norm['totalplannedperiods'] || 1, 10);
          const totalPlannedPeriods = parseInt(norm['totalplannedperiods'] || norm['plannedperiods'] || norm['totalperiods'] || norm['totallectures'] || periods || 1, 10);
          const hours = parseFloat(norm['hoursspentteaching'] || norm['hoursspent'] || norm['hours'] || norm['hrs'] || norm['duration'] || totalPlannedPeriods || 1.0);
          const targetDate = String(norm['targetcompletiondate'] || norm['targetdate'] || norm['completeby'] || norm['deadline'] || norm['enddate'] || norm['date'] || norm['activitydate'] || '').trim();
          const status = String(norm['activitystatus'] || norm['status'] || norm['state'] || 'Planned').trim();
          const remarks = String(norm['remarks'] || norm['remark'] || norm['notes'] || norm['outcomes'] || '').trim();
          const teacherName = String(norm['teachername'] || norm['teacher'] || norm['faculty'] || norm['facultyname'] || norm['instructor'] || norm['staff'] || norm['name'] || '').trim();

          return {
            branch,
            activity,
            subject,
            teacherName,
            batch,
            chapter: chapter || topicTaught,
            topicTaught: topicTaught || chapter,
            timeSlot,
            periods: periods || totalPlannedPeriods,
            totalPlannedPeriods,
            durationDisplay: (periods || totalPlannedPeriods) === totalPlannedPeriods ? `${totalPlannedPeriods} Lectures (${hours}h)` : `${periods} / ${totalPlannedPeriods} Periods (${hours}h)`,
            hours,
            targetDate,
            status,
            remarks
          };
        }).filter(item => item.topicTaught.length > 0 || item.subject.length > 0 || item.chapter.length > 0);

        if (parsed.length === 0) {
          toast.warning('No valid rows found in Excel. Please check columns.');
          return;
        }

        setDailyParsedData(parsed);
        setIsDailyImportModalOpen(true);
        toast.info(`Parsed ${parsed.length} daily activity records from Excel.`);
      } catch (err) {
        console.error('Failed to parse activity Excel:', err);
        toast.error('Failed to parse Excel file. Please use a valid .xlsx or .xls file.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleConfirmDailyImport = async () => {
    if (!dailyParsedData || dailyParsedData.length === 0) return;
    setLoading(true);

    try {
      const payloadList = dailyParsedData.map(item => ({
        branch: item.branch || '',
        activity: item.activity || 'Classroom Lecture & Theory',
        subject: item.subject || '',
        batch: item.batch || '',
        chapter: item.chapter || item.topicTaught || '',
        topic_taught: item.topicTaught || item.chapter || '',
        time_slot: item.timeSlot || '',
        periods: parseInt(item.periods || item.totalPlannedPeriods || 1, 10),
        total_planned_periods: parseInt(item.totalPlannedPeriods || item.periods || 1, 10),
        hours: parseFloat(item.hours || item.periods || 1.0),
        target_date: item.targetDate || '',
        status: item.status || 'Planned',
        teacher_name: item.teacherName || '',
        teacher_id: item.teacherId || null,
        remarks: item.remarks || '',
        frequency: item.frequency || 'Daily',
        activity_date: item.activityDate || item.targetDate || new Date().toISOString().split('T')[0]
      }));

      await curriculumService.bulkCreateDailyActivities(payloadList);
      setIsDailyImportModalOpen(false);
      setDailyParsedData([]);

      // Auto-sync daily activities with schedule into batch timetable if time_slot and subject exist
      try {
        const slotsToSync = payloadList
          .filter(item => item.time_slot && item.subject)
          .map(item => {
            let day = 'Monday';
            if (item.target_date) {
              const d = new Date(item.target_date + 'T00:00:00');
              if (!isNaN(d.getTime())) {
                day = d.toLocaleDateString('en-US', { weekday: 'long' });
              }
            }
            return {
              day,
              time: item.time_slot,
              subject: item.subject,
              teacher_name: item.teacher_name || '',
              batch: item.batch,
              branch: item.branch || '',
              room: 'Room 201'
            };
          });
        if (slotsToSync.length > 0) {
          await batchService.importTimetable(slotsToSync);
          window.dispatchEvent(new CustomEvent('sa_timetable_updated'));
        }
      } catch (syncErr) {
        console.warn('Auto-sync daily import to timetable failed:', syncErr);
      }

      // Reset filters on Daily Logs page so newly imported items are immediately visible and not hidden by filters!
      setDailyBranchFilter('All');
      setDailySubjectFilter('All');
      setDailyTeacherFilter('All');
      setDailyBatchFilter('All');
      setDailyStatusFilter('All');
      setDailySearch('');

      // Keep user on the Daily Logs page!
      setActiveTab('daily');

      // Trigger update event across app
      window.dispatchEvent(new CustomEvent('sa_daily_activities_updated'));
      toast.success(`Successfully imported and saved ${payloadList.length} activities into database!`);
      await loadData();
    } catch (err) {
      console.error('Failed to import activities:', err);
      toast.error('Error importing activities to database.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportDailyActivities = () => {
    if (!dailyActivities || dailyActivities.length === 0) {
      toast.warning('No daily activities available to export.');
      return;
    }

    const exportRows = filteredDailyActivities.map((item, idx) => ({
      "Sr No": idx + 1,
      "Branch": item.branch || 'Tarabai Park',
      "Activity Type": item.activity || 'Classroom Lecture & Theory',
      "Subject": item.subject || '',
      "Assigned Faculty": item.teacherName || '',
      "Class / Batch": item.batch || '',
      "Chapter": item.chapter || '',
      "Topic Taught": item.topicTaught || '',
      "Time Slot": item.timeSlot || '',
      "Periods Taken": item.periods || 1,
      "Total Planned Periods": item.totalPlannedPeriods || 2,
      "Hours Spent": item.hours || 1.0,
      "Target Completion Date": item.targetDate || '',
      "Status": item.status || 'Completed',
      "Remarks": item.remarks || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Daily Activities");
    const today = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Academy_Daily_Activities_${today}.xlsx`);
    toast.success(`Exported ${exportRows.length} daily activities to Excel.`);
  };

  const handleOpenAddDailyModal = () => {
    setEditingDailyId(null);
    setDailyForm({
      branch: 'Tarabai Park',
      activity: 'Classroom Lecture & Theory',
      subject: 'Physics',
      teacherName: 'More A.D',
      batch: '12th pcm tarabai park',
      chapter: 'Chapter 7: Wave Optics',
      topicTaught: '',
      timeSlot: '03:00 PM - 04:00 PM',
      periods: '1',
      totalPlannedPeriods: '2',
      hours: '1.0',
      targetDate: new Date().toISOString().split('T')[0],
      status: 'Completed',
      remarks: ''
    });
    setIsDailyModalOpen(true);
  };

  const handleOpenEditDailyModal = (act) => {
    setEditingDailyId(act.id);
    setDailyForm({
      branch: act.branch || '',
      activity: act.activity || 'Classroom Lecture & Theory',
      subject: act.subject || 'Physics',
      teacherName: act.teacherName || '',
      batch: act.batch || '',
      chapter: act.chapter || '',
      topicTaught: act.topicTaught || '',
      timeSlot: act.timeSlot || '',
      periods: String(act.periods || act.totalPlannedPeriods || '1'),
      totalPlannedPeriods: String(act.totalPlannedPeriods || act.periods || '1'),
      hours: String(act.hours || '1.0'),
      targetDate: act.targetDate || '',
      status: act.status || 'Planned',
      remarks: act.remarks || ''
    });
    setIsDailyModalOpen(true);
  };

  const handleSaveDailyForm = async (e) => {
    e.preventDefault();
    if (!dailyForm.topicTaught.trim()) {
      toast.warning('Please enter Topic Taught / Syllabus Covered.');
      return;
    }

    const payload = {
      branch: dailyForm.branch,
      activity: dailyForm.activity,
      subject: dailyForm.subject,
      batch: dailyForm.batch,
      chapter: dailyForm.chapter,
      topic_taught: dailyForm.topicTaught,
      time_slot: dailyForm.timeSlot,
      periods: parseInt(dailyForm.periods, 10) || 1,
      total_planned_periods: parseInt(dailyForm.totalPlannedPeriods, 10) || 1,
      hours: parseFloat(dailyForm.hours) || 1.0,
      target_date: dailyForm.targetDate,
      status: dailyForm.status,
      teacher_name: dailyForm.teacherName || '',
      remarks: dailyForm.remarks,
      frequency: 'Daily',
      activity_date: dailyForm.targetDate || new Date().toISOString().split('T')[0]
    };

    try {
      if (editingDailyId) {
        await curriculumService.updateDailyActivity(editingDailyId, payload);
        toast.success('Daily activity updated successfully.');
      } else {
        await curriculumService.createDailyActivity(payload);
        toast.success(`Activity logged & routed to ${payload.teacher_name}!`);
      }

      // Auto-sync into batch timetable so it reflects immediately in teacher's My Classes
      if (payload.time_slot && payload.subject) {
        try {
          let day = 'Monday';
          if (payload.target_date) {
            const d = new Date(payload.target_date + 'T00:00:00');
            if (!isNaN(d.getTime())) {
              day = d.toLocaleDateString('en-US', { weekday: 'long' });
            }
          }
          await batchService.addTimetableSlot({
            day,
            time: payload.time_slot,
            subject: payload.subject,
            teacher_name: payload.teacher_name,
            batch: payload.batch,
            branch: payload.branch,
            room: 'Room 201'
          });
          window.dispatchEvent(new CustomEvent('sa_timetable_updated'));
        } catch (syncErr) {
          console.warn('Auto-sync single daily activity to timetable failed:', syncErr);
        }
      }

      setIsDailyModalOpen(false);
      window.dispatchEvent(new CustomEvent('sa_daily_activities_updated'));
      loadData();
    } catch (err) {
      toast.error('Failed to save daily activity record.');
    }
  };

  const handleDeleteDailyActivity = async (id) => {
    const isConfirmed = await confirm({
      title: 'Delete Daily Activity',
      message: 'Are you sure you want to remove this daily activity log?',
      subtitle: 'This will also remove the entry from the faculty portal.',
      confirmText: 'Delete Record',
      cancelText: 'Keep Record',
      type: 'danger'
    });

    if (isConfirmed) {
      await curriculumService.deleteDailyActivity(id);
      window.dispatchEvent(new CustomEvent('sa_daily_activities_updated'));
      toast.info('Daily activity record deleted.');
      loadData();
    }
  };

  // Filtered Daily Activities
  const filteredDailyActivities = useMemo(() => {
    return dailyActivities.filter(item => {
      const q = dailySearch.toLowerCase();
      const matchesSearch = !q ||
        (item.topicTaught && item.topicTaught.toLowerCase().includes(q)) ||
        (item.chapter && item.chapter.toLowerCase().includes(q)) ||
        (item.subject && item.subject.toLowerCase().includes(q)) ||
        (item.batch && item.batch.toLowerCase().includes(q)) ||
        (item.teacherName && item.teacherName.toLowerCase().includes(q));

      const itemDate = item.activity_date || item.activityDate || item.targetDate || item.target_date || '';
      const matchesDate = !dailyDateFilter || itemDate === dailyDateFilter;

      const matchesBranch = dailyBranchFilter === 'All' || 
        item.branch === dailyBranchFilter || 
        (item.branch && dailyBranchFilter !== 'All' && item.branch.toLowerCase().includes(dailyBranchFilter.toLowerCase().split(' ')[0]));
      const matchesTeacher = dailyTeacherFilter === 'All' || item.teacherName === dailyTeacherFilter;
      const matchesSubject = dailySubjectFilter === 'All' || item.subject === dailySubjectFilter;
      const matchesBatch = dailyBatchFilter === 'All' || item.batch === dailyBatchFilter;
      const matchesStatus = dailyStatusFilter === 'All' || item.status === dailyStatusFilter;

      return matchesSearch && matchesDate && matchesBranch && matchesTeacher && matchesSubject && matchesBatch && matchesStatus;
    });
  }, [dailyActivities, dailySearch, dailyDateFilter, dailyBranchFilter, dailyTeacherFilter, dailySubjectFilter, dailyBatchFilter, dailyStatusFilter]);

  // -------------------------------------------------------------
  // TAB 2: MASTER WEEKLY TIMETABLE LOGIC & EXCEL SYNC
  // -------------------------------------------------------------
  const [timetableSearch, setTimetableSearch] = useState('');
  const [timetableBranchFilter, setTimetableBranchFilter] = useState(defaultBranchFilter);
  const [timetableTeacherFilter, setTimetableTeacherFilter] = useState('All');
  const [timetableSubjectFilter, setTimetableSubjectFilter] = useState('All');
  const [timetableDayFilter, setTimetableDayFilter] = useState('All');
  const [timetableViewMode, setTimetableViewMode] = useState('grid'); // 'grid' | 'table'

  // Timetable Add / Edit Modal States
  const [isTimetableModalOpen, setIsTimetableModalOpen] = useState(false);
  const [editingTimetableSlot, setEditingTimetableSlot] = useState(null);
  const [timetableForm, setTimetableForm] = useState({
    day: 'Monday',
    timeSlot: '09:00 AM – 10:00 AM',
    branch: (!isSuperAdmin && activeBranch) ? userBranchName : 'Tarabai Park',
    subject: 'Physics',
    teacherName: 'More A.D',
    batch: '12th pcm tarabai park',
    classCode: '12-A',
    room: 'Room 201'
  });

  // Excel Timetable Import States
  const timetableExcelInputRef = useRef(null);
  const [isTimetableImportModalOpen, setIsTimetableImportModalOpen] = useState(false);
  const [timetableParsedData, setTimetableParsedData] = useState([]);

  // All Timetable Slots Extracted from Batches
  const allTimetableSlots = useMemo(() => {
    const list = [];
    batches.forEach((b) => {
      const parentBranch = b.branch || (b.name && b.name.toLowerCase().includes('mangalwar') ? 'Mangalwar Peth' : 'Tarabai Park');
      if (Array.isArray(b.timetable) && b.timetable.length > 0) {
        b.timetable.forEach((slot, sIdx) => {
          list.push({
            id: `SLOT-${b.id || b._id || 'B'}-${sIdx}-${slot.day}-${slot.time}`,
            batchId: b.id || b._id,
            batchName: b.name,
            class_code: slot.class_code || b.class_code || `${(b.standard || '12th').match(/\\d+/)?.[0] || '12'}-${b.batch_name || 'A'}`,
            day: slot.day ? slot.day.charAt(0).toUpperCase() + slot.day.slice(1).toLowerCase() : 'Monday',
            time: (slot.time || '09:00 AM – 10:00 AM').replace(/[-–—]/g, '–').replace(/\\s+/g, ' ').trim(),
            subject: slot.subject || b.subject || 'Physics',
            teacher_name: slot.teacher_name || b.teacher_name || defaultFacultyBySubject[slot.subject || b.subject] || 'More A.D',
            room: slot.room || b.room || 'Room 201',
            branch: slot.branch || parentBranch,
            batch: b.name
          });
        });
      }
    });
    return list;
  }, [batches, defaultFacultyBySubject]);

  // Filtered Timetable Slots
  const filteredTimetableSlots = useMemo(() => {
    return allTimetableSlots.filter((slot) => {
      const q = timetableSearch.toLowerCase();
      const matchesSearch = !q ||
        (slot.subject && slot.subject.toLowerCase().includes(q)) ||
        (slot.teacher_name && slot.teacher_name.toLowerCase().includes(q)) ||
        (slot.batch && slot.batch.toLowerCase().includes(q)) ||
        (slot.class_code && slot.class_code.toLowerCase().includes(q)) ||
        (slot.room && slot.room.toLowerCase().includes(q)) ||
        (slot.day && slot.day.toLowerCase().includes(q));

      const matchesBranch = timetableBranchFilter === 'All' || slot.branch === timetableBranchFilter;
      const matchesTeacher = timetableTeacherFilter === 'All' || slot.teacher_name === timetableTeacherFilter;
      const matchesSubject = timetableSubjectFilter === 'All' || slot.subject === timetableSubjectFilter;
      const matchesDay = timetableDayFilter === 'All' || slot.day.toLowerCase() === timetableDayFilter.toLowerCase();

      return matchesSearch && matchesBranch && matchesTeacher && matchesSubject && matchesDay;
    });
  }, [allTimetableSlots, timetableSearch, timetableBranchFilter, timetableTeacherFilter, timetableSubjectFilter, timetableDayFilter]);

  // Distinct Time Slots
  const timetableTimeSlots = useMemo(() => {
    const defaultSlots = [
      '09:00 AM – 10:00 AM',
      '10:00 AM – 11:00 AM',
      '11:00 AM – 12:00 PM',
      '12:00 PM – 01:00 PM',
      '03:00 PM – 04:00 PM'
    ];
    const slotSet = new Set(defaultSlots);
    allTimetableSlots.forEach((s) => {
      if (s.time) {
        slotSet.add(s.time);
      }
    });

    const parseMinutes = (timeStr) => {
      if (!timeStr) return 0;
      const match = timeStr.match(/(\\d+):(\\d+)\\s*(AM|PM)?/i);
      if (!match) return 0;
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const meridiem = (match[3] || '').toUpperCase();
      if (meridiem === 'PM' && hours < 12) hours += 12;
      if (meridiem === 'AM' && hours === 12) hours = 0;
      return hours * 60 + minutes;
    };

    return Array.from(slotSet).sort((a, b) => parseMinutes(a) - parseMinutes(b));
  }, [allTimetableSlots]);

  const timetableWeekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const getSlotsForDayAndTime = (dayName, timeSlot) => {
    const norm = (t) => (t || '').replace(/\\s+/g, ' ').replace(/[-–—]/g, '-').trim().toLowerCase();
    const targetNorm = norm(timeSlot);
    return filteredTimetableSlots.filter(
      (s) => s.day.toLowerCase() === dayName.toLowerCase() && norm(s.time) === targetNorm
    );
  };

  const handleTriggerTimetableExcel = () => {
    if (timetableExcelInputRef.current) {
      timetableExcelInputRef.current.value = '';
      timetableExcelInputRef.current.click();
    }
  };

  const handleTimetableExcelChange = (e) => {
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

        const parsed = rawData.map((row) => {
          const norm = {};
          for (const k in row) {
            const cleanKey = k.toLowerCase().replace(/[^a-z0-9]/g, '');
            norm[cleanKey] = row[k];
          }

          let day = String(norm['day'] || norm['weekday'] || 'Monday').trim();
          day = day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();

          const rawTime = String(norm['timeslot'] || norm['time'] || norm['slot'] || '09:00 AM – 10:00 AM').trim();
          const timeSlot = rawTime.replace(/[-–—]/g, '–').replace(/\\s+/g, ' ').trim();

          let subject = String(norm['subject'] || norm['sub'] || norm['subjectname'] || 'Physics').trim();
          if (subject.toLowerCase().includes('phys')) subject = 'Physics';
          else if (subject.toLowerCase().includes('chem')) subject = 'Chemistry';
          else if (subject.toLowerCase().includes('math')) subject = 'Mathematics';
          else if (subject.toLowerCase().includes('bio')) subject = 'Biology';

          let teacherName = String(norm['assignedfaculty'] || norm['faculty'] || norm['teachername'] || norm['teacher'] || '').trim();
          if (!teacherName) {
            teacherName = defaultFacultyBySubject[subject] || 'More A.D';
          }

          let branch = String(norm['branch'] || norm['location'] || '').trim();
          const batchStr = String(norm['classbatch'] || norm['batch'] || norm['class'] || '12th pcm tarabai park').trim();
          if (!branch) {
            branch = batchStr.toLowerCase().includes('mangalwar') ? 'Mangalwar Peth' : 'Tarabai Park';
          }

          const room = String(norm['room'] || norm['classroom'] || norm['lab'] || 'Room 201').trim();
          const classCode = String(norm['classcode'] || norm['code'] || (batchStr.includes('12') ? '12-A' : '11-A')).trim();

          return {
            day,
            time: timeSlot,
            subject,
            teacher_name: teacherName,
            batch: batchStr,
            class_code: classCode,
            room,
            branch
          };
        }).filter(item => item.day && item.time && item.subject);

        if (parsed.length === 0) {
          toast.warning('No valid timetable slot rows found in Excel.');
          return;
        }

        setTimetableParsedData(parsed);
        setIsTimetableImportModalOpen(true);
        toast.info(`Parsed ${parsed.length} timetable slot(s) from Excel.`);
      } catch (err) {
        console.error('Failed to parse timetable Excel:', err);
        toast.error('Failed to parse timetable Excel file. Please use a valid .xlsx or .xls file.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleConfirmTimetableImport = async () => {
    if (!timetableParsedData || timetableParsedData.length === 0) return;
    setLoading(true);
    try {
      await batchService.importTimetable(timetableParsedData);
      setIsTimetableImportModalOpen(false);
      setTimetableParsedData([]);

      // Auto-publish upcoming week
      const updatedPublished = Array.from(new Set([...publishedWeeks, '2026-10-19']));
      setPublishedWeeks(updatedPublished);
      localStorage.setItem('sa_published_timetable_weeks', JSON.stringify(updatedPublished));

      const updatedRequested = requestedWeeks.filter(k => k !== '2026-10-19');
      setRequestedWeeks(updatedRequested);
      localStorage.setItem('sa_requested_timetable_weeks', JSON.stringify(updatedRequested));

      // Notify teachers
      notificationService.addNotification({
        id: `NTF-TT-PUB-IMPORT-${Date.now()}`,
        title: 'Weekly Timetable Uploaded & Published',
        type: 'timetable_published',
        category: 'Academic Timetable & Scheduling',
        priority: 'High',
        author: 'Academic Administration',
        details: `Academic Administration has imported and published the weekly timetable for Mon 19 Oct – Sat, 24 Oct 2026 (${timetableParsedData.length} slots). Schedules are now active under My Classes.`
      });

      window.dispatchEvent(new CustomEvent('sa_timetable_updated'));
      window.dispatchEvent(new CustomEvent('sa_notifications_updated'));
      toast.success(`Successfully imported ${timetableParsedData.length} weekly timetable slots! Timetable published & synchronized to teachers' My Classes.`);
      await loadData();
    } catch (err) {
      console.error('Failed to import timetable:', err);
      toast.error('Error importing timetable to backend.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddTimetableModal = (day = 'Monday', timeSlot = '09:00 AM – 10:00 AM') => {
    setEditingTimetableSlot(null);
    setTimetableForm({
      day: day || 'Monday',
      timeSlot: timeSlot || '09:00 AM – 10:00 AM',
      branch: 'Tarabai Park',
      subject: 'Physics',
      teacherName: 'More A.D',
      batch: '12th pcm tarabai park',
      classCode: '12-A',
      room: 'Room 201'
    });
    setIsTimetableModalOpen(true);
  };

  const handleOpenEditTimetableModal = (slot) => {
    setEditingTimetableSlot(slot);
    setTimetableForm({
      day: slot.day || 'Monday',
      timeSlot: slot.time || '09:00 AM – 10:00 AM',
      branch: slot.branch || 'Tarabai Park',
      subject: slot.subject || 'Physics',
      teacherName: slot.teacher_name || defaultFacultyBySubject[slot.subject] || 'More A.D',
      batch: slot.batch || '12th pcm tarabai park',
      classCode: slot.class_code || '12-A',
      room: slot.room || 'Room 201'
    });
    setIsTimetableModalOpen(true);
  };

  const handleSaveTimetableSlot = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const teacher = timetableForm.teacherName || defaultFacultyBySubject[timetableForm.subject] || 'More A.D';
      const slotPayload = {
        day: timetableForm.day,
        time: timetableForm.timeSlot.replace(/[-–—]/g, '–').replace(/\\s+/g, ' ').trim(),
        subject: timetableForm.subject,
        teacher_name: teacher,
        batch: timetableForm.batch,
        class_code: timetableForm.classCode || (timetableForm.batch.includes('12') ? '12-A' : '11-A'),
        room: timetableForm.room || 'Room 201',
        branch: timetableForm.branch || 'Tarabai Park'
      };

      await batchService.addTimetableSlot(slotPayload);
      setIsTimetableModalOpen(false);
      window.dispatchEvent(new CustomEvent('sa_timetable_updated'));
      toast.success(`Timetable slot saved & synchronized to ${teacher}'s My Classes!`);
      await loadData();
    } catch (err) {
      console.error('Failed to save timetable slot:', err);
      toast.error('Failed to save timetable slot.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTimetableSlot = async (slot) => {
    const isConfirmed = await confirm({
      title: 'Delete Timetable Slot',
      message: `Are you sure you want to delete ${slot.subject} slot (${slot.day} ${slot.time})?`,
      subtitle: `This slot will be removed from ${slot.teacher_name}'s Weekly Timetable in My Classes.`,
      confirmText: 'Delete Slot',
      cancelText: 'Keep Slot',
      type: 'danger'
    });

    if (isConfirmed) {
      setLoading(true);
      try {
        await batchService.deleteTimetableSlot({
          batch_id: slot.batchId,
          batch: slot.batchName,
          day: slot.day,
          time: slot.time,
          subject: slot.subject
        });
        window.dispatchEvent(new CustomEvent('sa_timetable_updated'));
        toast.info('Timetable slot deleted & removed from faculty timetable.');
        await loadData();
      } catch (err) {
        console.error('Failed to delete timetable slot:', err);
        toast.error('Failed to delete timetable slot.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleExportTimetable = () => {
    if (!filteredTimetableSlots || filteredTimetableSlots.length === 0) {
      toast.warning('No timetable slots available to export.');
      return;
    }
    const exportRows = filteredTimetableSlots.map((item, idx) => ({
      "Sr No": idx + 1,
      "Day": item.day,
      "Time Slot": item.time,
      "Branch": item.branch,
      "Class / Batch": item.batch,
      "Subject": item.subject,
      "Assigned Faculty": item.teacher_name,
      "Room": item.room,
      "Class Code": item.class_code
    }));
    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Weekly Timetable");
    const today = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `Shubham_Academy_Weekly_Timetable_${today}.xlsx`);
    toast.success(`Exported ${exportRows.length} timetable slots to Excel.`);
  };



  // Helper styling for subjects
  const getSubjectColor = (subj = '') => {
    const s = subj.toLowerCase();
    if (s.includes('phys')) return { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE', dot: '#2563EB' };
    if (s.includes('chem')) return { bg: '#FDF2F8', text: '#BE185D', border: '#FBCFE8', dot: '#DB2777' };
    if (s.includes('math')) return { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0', dot: '#16A34A' };
    if (s.includes('bio')) return { bg: '#FAF5FF', text: '#7E22CE', border: '#E9D5FF', dot: '#9333EA' };
    return { bg: '#F8FAFC', text: '#475569', border: '#E2E8F0', dot: '#64748B' };
  };

  // Helper styling for branches
  const getBranchBadge = (branch = '') => {
    const b = (branch || '').toLowerCase();
    if ((b.includes('mangalwar') && b.includes('tarabai')) || b.includes('mp/tp') || b.includes('both')) {
      return { bg: '#F5F3FF', text: '#6D28D9', border: '#DDD6FE', label: 'Mangalwar & Tarabai' };
    }
    if (b.includes('mangalwar')) {
      return { bg: '#F0FDFA', text: '#0D9488', border: '#99F6E4', label: 'Mangalwar Peth' };
    }
    if (b.includes('tarabai')) {
      return { bg: '#FDF0F0', text: '#8B1216', border: '#F5C2C4', label: 'Tarabai Park' };
    }
    return { bg: '#F8FAFC', text: '#475569', border: '#E2E8F0', label: branch || 'All Branches' };
  };

  // Helper to format Class / Batch without repeating the branch name
  const formatClassBatch = (batchStr = '') => {
    if (!batchStr) return '—';
    const cleaned = batchStr
      .replace(/Tarabai\s*Park/gi, '')
      .replace(/Mangalwar\s*Peth/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    return cleaned || batchStr;
  };

  // Renders the exact Excel table format for a single subject (keeps authentic format of original Excel sheet)
  const renderSingleSubjectTable = (subjectName, chapters = [], isStacked = false) => {
    const boardsTotal = chapters.reduce((acc, c) => acc + (Number(c.boards_lectures) || 0), 0);
    const entranceTotal = chapters.reduce((acc, c) => acc + (Number(c.entrance_lectures) || 0), 0);
    const lecturesTotal = chapters.reduce((acc, c) => acc + (Number(c.total_lectures) || ((Number(c.boards_lectures) || 0) + (Number(c.entrance_lectures) || 0))), 0);

    return (
      <div
        key={subjectName}
        className={`border rounded-3 overflow-hidden shadow-xs ${isStacked ? 'mb-4' : ''}`}
        style={{ borderColor: '#475569', backgroundColor: '#FFFFFF' }}
      >
        {/* Sheet Top Info Banner */}
        <div
          className="d-flex align-items-center justify-content-between px-3 py-2 border-bottom"
          style={{ backgroundColor: '#F8FAFC', borderColor: '#475569' }}
        >
          <div className="d-flex align-items-center gap-2">
            <span
              className="badge px-2.5 py-1 fw-bold text-white shadow-xs"
              style={{
                backgroundColor: facultyColorMap[subjectName] || '#1E293B',
                fontSize: '11.5px',
                letterSpacing: '0.3px',
                borderRadius: '5px'
              }}
            >
              📑 Sheet: {subjectName}
            </span>
            <span className="text-sa-muted" style={{ fontSize: '12px' }}>
              • {chapters.length} Chapters • {boardsTotal} Boards + {entranceTotal} Entrance = {lecturesTotal} Total Lectures
            </span>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              onClick={() => handleOpenAddChapterModal(subjectName)}
              className="btn btn-sm text-sa-charcoal fw-semibold px-2 py-1 d-inline-flex align-items-center gap-1"
              style={{ fontSize: '11.5px', backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '5px' }}
              title={`Add Chapter to ${subjectName}`}
            >
              <Plus size={13} color="#8B1216" />
              <span>Add Chapter</span>
            </button>
            <button
              type="button"
              onClick={handleTriggerSyllabusExcel}
              className="btn btn-sm text-success fw-semibold px-2 py-1 d-inline-flex align-items-center gap-1"
              style={{ fontSize: '11.5px', backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '5px' }}
              title="Upload / Re-import Excel"
            >
              <FileSpreadsheet size={13} />
              <span>Import</span>
            </button>
          </div>
        </div>

        <div className="table-responsive m-0">
          <table
            className="table table-bordered align-middle m-0"
            style={{
              borderColor: '#475569',
              borderCollapse: 'collapse',
              fontSize: '13px'
            }}
          >
            <thead>
              {/* Row 1: Academic Year Header */}
              <tr style={{ backgroundColor: '#FFFFFF' }}>
                <th
                  colSpan={6}
                  className="text-center fw-bold"
                  style={{
                    color: '#DC2626',
                    fontSize: '17px',
                    padding: '9px 16px',
                    borderColor: '#475569',
                    letterSpacing: '0.5px'
                  }}
                >
                  {syllabusStandard} {syllabusAcademicYear}
                </th>
              </tr>

              {/* Row 2: Subject & No of lec for mp/tp */}
              <tr style={{ backgroundColor: '#FFFFFF' }}>
                <th
                  colSpan={2}
                  className="text-center fw-bold"
                  style={{
                    color: '#DC2626',
                    fontSize: '16px',
                    padding: '8px 16px',
                    borderColor: '#475569'
                  }}
                >
                  {subjectName}
                </th>
                <th
                  colSpan={2}
                  className="text-center fw-bold"
                  style={{
                    color: '#DC2626',
                    fontSize: '15px',
                    padding: '8px 16px',
                    borderColor: '#475569'
                  }}
                >
                  No of lec for mp/tp
                </th>
                <th
                  rowSpan={2}
                  className="text-center fw-bold"
                  style={{
                    width: '90px',
                    color: '#475569',
                    backgroundColor: '#F8FAFC',
                    borderColor: '#475569',
                    verticalAlign: 'middle',
                    fontSize: '12px'
                  }}
                >
                  Total
                </th>
                <th
                  rowSpan={2}
                  className="text-center fw-semibold"
                  style={{
                    width: '80px',
                    color: '#64748B',
                    backgroundColor: '#F8FAFC',
                    borderColor: '#475569',
                    verticalAlign: 'middle',
                    fontSize: '12px'
                  }}
                >
                  Action
                </th>
              </tr>

              {/* Row 3: Column Headers (Sr.no, Title, Boards, Entrance) */}
              <tr style={{ backgroundColor: '#FFFFFF' }}>
                <th
                  style={{
                    width: '70px',
                    textAlign: 'center',
                    color: '#1D4ED8',
                    textDecoration: 'underline',
                    fontWeight: 700,
                    padding: '9px 8px',
                    borderColor: '#475569',
                    backgroundColor: '#FFFFFF',
                    fontSize: '13.5px'
                  }}
                >
                  Sr.no
                </th>
                <th
                  style={{
                    textAlign: 'left',
                    fontWeight: 700,
                    color: '#0F172A',
                    padding: '9px 16px',
                    borderColor: '#475569',
                    backgroundColor: '#FFFFFF',
                    fontSize: '13.5px'
                  }}
                >
                  Title
                </th>
                <th
                  style={{
                    width: '130px',
                    textAlign: 'center',
                    fontWeight: 700,
                    color: '#0F172A',
                    padding: '9px 8px',
                    backgroundColor: '#BDD7EE',
                    borderColor: '#475569',
                    fontSize: '13.5px'
                  }}
                >
                  Boards
                </th>
                <th
                  style={{
                    width: '130px',
                    textAlign: 'center',
                    fontWeight: 700,
                    color: '#0F172A',
                    padding: '9px 8px',
                    backgroundColor: '#BDD7EE',
                    borderColor: '#475569',
                    fontSize: '13.5px'
                  }}
                >
                  Entrance
                </th>
              </tr>
            </thead>
            <tbody>
              {chapters.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-sa-muted">
                    <div className="d-flex flex-column align-items-center justify-content-center gap-1.5">
                      <FileSpreadsheet size={30} color="#94A3B8" />
                      <span className="fw-semibold text-sa-charcoal" style={{ fontSize: '13.5px' }}>
                        No chapters found for {subjectName}
                      </span>
                      <span className="small text-muted" style={{ maxWidth: '380px' }}>
                        Import the Excel sheet or click Add Chapter to populate this subject.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                chapters.map((chapter, idx) => {
                  const boards = chapter.boards_lectures || 0;
                  const entrance = chapter.entrance_lectures || 0;
                  const total = boards + entrance;

                  return (
                    <tr
                      key={chapter.id || chapter.topic_id || `${subjectName}-${idx}`}
                      style={{ backgroundColor: '#FFFFFF' }}
                    >
                      {/* 1. Sr.no */}
                      <td
                        style={{
                          textAlign: 'center',
                          fontWeight: 600,
                          color: '#0F172A',
                          padding: '8px 8px',
                          borderColor: '#475569',
                          fontSize: '13px'
                        }}
                      >
                        {chapter.sr_no || idx + 1}
                      </td>

                      {/* 2. Chapter Title */}
                      <td
                        style={{
                          padding: '8px 16px',
                          fontWeight: 600,
                          color: '#0F172A',
                          borderColor: '#475569',
                          fontSize: '13px'
                        }}
                      >
                        <span>{chapter.title || chapter.topic_name}</span>
                      </td>

                      {/* 3. Boards Lectures (Excel blue shading #BDD7EE) */}
                      <td
                        style={{
                          textAlign: 'center',
                          fontWeight: 700,
                          color: '#0F172A',
                          padding: '8px 8px',
                          backgroundColor: '#BDD7EE',
                          borderColor: '#475569',
                          fontSize: '13.5px'
                        }}
                      >
                        {boards}
                      </td>

                      {/* 4. Entrance Lectures (Excel blue shading #BDD7EE) */}
                      <td
                        style={{
                          textAlign: 'center',
                          fontWeight: 700,
                          color: '#0F172A',
                          padding: '8px 8px',
                          backgroundColor: '#BDD7EE',
                          borderColor: '#475569',
                          fontSize: '13.5px'
                        }}
                      >
                        {entrance}
                      </td>

                      {/* 5. Total Lectures */}
                      <td
                        style={{
                          textAlign: 'center',
                          padding: '8px 8px',
                          borderColor: '#475569'
                        }}
                      >
                        <span
                          className="badge rounded-pill fw-semibold"
                          style={{
                            backgroundColor: '#F1F5F9',
                            color: '#1E293B',
                            fontSize: '11px',
                            padding: '4px 8px'
                          }}
                        >
                          {total} lec
                        </span>
                      </td>

                      {/* 6. Action */}
                      <td
                        style={{
                          textAlign: 'center',
                          padding: '8px 8px',
                          borderColor: '#475569'
                        }}
                      >
                        <div className="d-inline-flex align-items-center justify-content-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditChapterModal(chapter)}
                            className="btn btn-sm d-inline-flex align-items-center justify-content-center p-0"
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              backgroundColor: '#EFF6FF',
                              color: '#2563EB',
                              border: '1px solid #BFDBFE',
                              cursor: 'pointer'
                            }}
                            title="Edit Chapter"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteChapter(chapter)}
                            className="btn btn-sm d-inline-flex align-items-center justify-content-center p-0"
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              backgroundColor: '#FEF2F2',
                              color: '#DC2626',
                              border: '1px solid #FECACA',
                              cursor: 'pointer'
                            }}
                            title="Delete Chapter"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Footer Total */}
            {chapters.length > 0 && (
              <tfoot>
                <tr style={{ backgroundColor: '#F8FAFC', fontWeight: 700 }}>
                  <td colSpan={2} style={{ textAlign: 'right', padding: '9px 16px', borderColor: '#475569', color: '#0F172A', fontSize: '13px' }}>
                    Total ({chapters.length} Chapters):
                  </td>
                  <td style={{ textAlign: 'center', padding: '9px 8px', backgroundColor: '#A9C4E2', borderColor: '#475569', color: '#0F172A', fontSize: '14px', fontWeight: 700 }}>
                    {boardsTotal}
                  </td>
                  <td style={{ textAlign: 'center', padding: '9px 8px', backgroundColor: '#A9C4E2', borderColor: '#475569', color: '#0F172A', fontSize: '14px', fontWeight: 700 }}>
                    {entranceTotal}
                  </td>
                  <td style={{ textAlign: 'center', padding: '9px 8px', borderColor: '#475569', color: '#0F172A', fontSize: '13px' }}>
                    {lecturesTotal} lec
                  </td>
                  <td style={{ borderColor: '#475569' }}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    );
  };

  // Main Excel View Container: Displays individual subject sheet or cleanly separated stacked tables
  const renderAsItIsExcelTable = () => {
    const standardSubjects = ['Physics', 'Chemistry', 'Mathematics', 'Biology'];
    const dynamicSubjects = Array.from(
      new Set(
        syllabusList
          .map((item) => item.subject)
          .filter((sub) => sub && !standardSubjects.some((s) => s.toLowerCase() === sub.toLowerCase()))
      )
    );
    const allKnownSubjects = [...standardSubjects, ...dynamicSubjects];

    const activeSubjects = allKnownSubjects.filter((sub) =>
      syllabusList.some((item) => item.subject && item.subject.toLowerCase() === sub.toLowerCase())
    );
    const subjectsWithData = activeSubjects.length > 0 ? activeSubjects : standardSubjects;

    // When viewing all subjects, render each subject in its own separate, unmerged Excel table
    if (syllabusSubject === 'All') {
      return (
        <div className="d-flex flex-column gap-4">
          {subjectsWithData.map((sub) => {
            const subChapters = syllabusList
              .filter((item) => item.subject && item.subject.toLowerCase() === sub.toLowerCase())
              .filter((item) => {
                if (!syllabusSearch.trim()) return true;
                return (
                  (item.title && item.title.toLowerCase().includes(syllabusSearch.toLowerCase())) ||
                  String(item.sr_no).includes(syllabusSearch)
                );
              })
              .sort((a, b) => (Number(a.sr_no) || 0) - (Number(b.sr_no) || 0));

            if (syllabusSearch.trim() && subChapters.length === 0) return null;

            return renderSingleSubjectTable(sub, subChapters, true);
          })}
        </div>
      );
    }

    // When viewing a specific subject sheet, render ONLY that subject's Excel table
    return renderSingleSubjectTable(syllabusSubject, filteredSyllabusList, false);
  };

  return (
    <div className="d-flex flex-column w-100" style={{ gap: '22px' }}>
      {/* 1. Page Header */}
      <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 pt-1">
        <div>
          <div className="d-flex align-items-center gap-2">
            <h1 className="fw-bold brand-font text-sa-charcoal m-0" style={{ fontSize: '23px', lineHeight: 1.2 }}>
              Daily Logs & Master Timetable Management
            </h1>
          </div>
          <p className="text-sa-muted m-0 mt-1" style={{ fontSize: '13px' }}>
            Import and manage faculty daily activity logs and weekly timetables via Excel or manual entry with instant teacher portal synchronization
          </p>
        </div>

        {/* Top Tab Switcher: Daily Logs vs Weekly Timetable */}
        <div
          className="d-flex p-1 bg-white border rounded-3 shadow-xs"
          style={{ borderColor: '#E2E8F0', height: '42px' }}
        >
          {/* Tab 1: Daily Logs */}
          <button
            type="button"
            onClick={() => setActiveTab('daily')}
            className={`btn btn-sm d-flex align-items-center gap-2 px-3 fw-semibold transition-all ${
              activeTab === 'daily' ? 'bg-sa-maroon text-white shadow-xs' : 'text-sa-charcoal'
            }`}
            style={{
              backgroundColor: activeTab === 'daily' ? '#8B1216' : 'transparent',
              borderRadius: '6px',
              fontSize: '12.5px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <CalendarDays size={14} />
            <span>Daily Logs</span>
            <span
              className="badge rounded-pill"
              style={{
                backgroundColor: activeTab === 'daily' ? 'rgba(255,255,255,0.25)' : '#F1F5F9',
                color: activeTab === 'daily' ? '#FFFFFF' : '#475569',
                fontSize: '10.5px'
              }}
            >
              {dailyActivities.length}
            </span>
          </button>

          {/* Tab 2: Master Weekly Timetable */}
          <button
            type="button"
            onClick={() => setActiveTab('timetable')}
            className={`btn btn-sm d-flex align-items-center gap-2 px-3 fw-semibold transition-all ${
              activeTab === 'timetable' ? 'bg-sa-maroon text-white shadow-xs' : 'text-sa-charcoal'
            }`}
            style={{
              backgroundColor: activeTab === 'timetable' ? '#8B1216' : 'transparent',
              borderRadius: '6px',
              fontSize: '12.5px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <CalendarCheck size={14} />
            <span>Weekly Timetable</span>
            <span
              className="badge rounded-pill"
              style={{
                backgroundColor: activeTab === 'timetable' ? 'rgba(255,255,255,0.25)' : '#F1F5F9',
                color: activeTab === 'timetable' ? '#FFFFFF' : '#475569',
                fontSize: '10.5px'
              }}
            >
              {allTimetableSlots.length}
            </span>
          </button>

          {/* Tab 3: Syllabus & Lecture Plan (mp/tp) */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('syllabus');
              loadSyllabusData(syllabusSubject);
            }}
            className={`btn btn-sm d-flex align-items-center gap-2 px-3 fw-semibold transition-all ${
              activeTab === 'syllabus' ? 'bg-sa-maroon text-white shadow-xs' : 'text-sa-charcoal'
            }`}
            style={{
              backgroundColor: activeTab === 'syllabus' ? '#8B1216' : 'transparent',
              borderRadius: '6px',
              fontSize: '12.5px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <BookOpen size={14} />
            <span>Syllabus & Lecture Plan (mp/tp)</span>
            <span
              className="badge rounded-pill"
              style={{
                backgroundColor: activeTab === 'syllabus' ? 'rgba(255,255,255,0.25)' : '#F1F5F9',
                color: activeTab === 'syllabus' ? '#FFFFFF' : '#475569',
                fontSize: '10.5px'
              }}
            >
              {syllabusList.length}
            </span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards (4 Cards) */}
      <div className="row g-3">
        <div className="col-12 col-sm-6 col-lg-3">
          <div
            className="sa-card bg-white border p-3 rounded-4 shadow-xs h-100 d-flex flex-column justify-content-between"
            style={{ borderColor: '#E2E8F0', borderLeft: '4px solid #8B1216' }}
          >
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-sa-muted fw-semibold" style={{ fontSize: '12px' }}>
                {activeTab === 'timetable' ? 'Weekly Lecture Slots' : activeTab === 'syllabus' ? 'Total Chapters Planned' : 'Total Teaching Hours'}
              </span>
              <div
                className="rounded-3 d-flex align-items-center justify-content-center"
                style={{ width: '34px', height: '34px', backgroundColor: '#FDF0F0', color: '#8B1216' }}
              >
                {activeTab === 'timetable' ? <CalendarCheck size={17} /> : activeTab === 'syllabus' ? <BookOpen size={17} /> : <Clock size={17} />}
              </div>
            </div>
            <div>
              <div className="fw-bold brand-font text-sa-charcoal" style={{ fontSize: '24px', lineHeight: 1.15 }}>
                {activeTab === 'timetable'
                  ? allTimetableSlots.length
                  : activeTab === 'syllabus'
                  ? totalSyllabusChapters
                  : dailyActivities.reduce((acc, a) => acc + (parseFloat(a.hours) || 0), 0).toFixed(1)}{' '}
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748B' }}>
                  {activeTab === 'timetable' ? 'slots' : activeTab === 'syllabus' ? 'chapters' : 'hrs'}
                </span>
              </div>
              <span className="text-sa-muted mt-1 d-block" style={{ fontSize: '11px' }}>
                {activeTab === 'timetable'
                  ? 'Across all batches & faculty'
                  : activeTab === 'syllabus'
                  ? `${syllabusSubject} (${syllabusStandard} ${syllabusAcademicYear})`
                  : 'Logged across all faculty today'}
              </span>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div
            className="sa-card bg-white border p-3 rounded-4 shadow-xs h-100 d-flex flex-column justify-content-between"
            style={{ borderColor: '#E2E8F0', borderLeft: '4px solid #168554' }}
          >
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-sa-muted fw-semibold" style={{ fontSize: '12px' }}>
                {activeTab === 'timetable' ? 'Tarabai Park Slots' : activeTab === 'syllabus' ? 'Boards Lectures' : 'Daily Topics Covered'}
              </span>
              <div
                className="rounded-3 d-flex align-items-center justify-content-center"
                style={{ width: '34px', height: '34px', backgroundColor: '#DCFCE7', color: '#168554' }}
              >
                <CheckCircle2 size={17} />
              </div>
            </div>
            <div>
              <div className="fw-bold brand-font text-sa-charcoal" style={{ fontSize: '24px', lineHeight: 1.15 }}>
                {activeTab === 'timetable'
                  ? allTimetableSlots.filter(s => s.branch === 'Tarabai Park').length
                  : activeTab === 'syllabus'
                  ? totalBoardsLec
                  : dailyActivities.filter(a => a.topicTaught).length}{' '}
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748B' }}>
                  {activeTab === 'timetable' ? 'slots' : activeTab === 'syllabus' ? 'lectures' : 'topics'}
                </span>
              </div>
              <span className="text-success fw-semibold mt-1 d-block" style={{ fontSize: '11px' }}>
                {activeTab === 'syllabus' ? 'State Board Syllabus (mp/tp)' : '✓ Synced to Teacher Portals'}
              </span>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div
            className="sa-card bg-white border p-3 rounded-4 shadow-xs h-100 d-flex flex-column justify-content-between"
            style={{ borderColor: '#E2E8F0', borderLeft: '4px solid #2563EB' }}
          >
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-sa-muted fw-semibold" style={{ fontSize: '12px' }}>
                {activeTab === 'timetable' ? 'Mangalwar Peth Slots' : activeTab === 'syllabus' ? 'Entrance Lectures' : 'Active Classes & Batches'}
              </span>
              <div
                className="rounded-3 d-flex align-items-center justify-content-center"
                style={{ width: '34px', height: '34px', backgroundColor: '#EFF6FF', color: '#2563EB' }}
              >
                <BookOpen size={17} />
              </div>
            </div>
            <div>
              <div className="fw-bold brand-font text-sa-charcoal" style={{ fontSize: '24px', lineHeight: 1.15 }}>
                {activeTab === 'timetable'
                  ? allTimetableSlots.filter(s => s.branch === 'Mangalwar Peth').length
                  : activeTab === 'syllabus'
                  ? totalEntranceLec
                  : new Set(dailyActivities.map(a => a.batch).filter(Boolean)).size}{' '}
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748B' }}>
                  {activeTab === 'timetable' ? 'slots' : activeTab === 'syllabus' ? 'lectures' : 'batches'}
                </span>
              </div>
              <span className="text-sa-muted mt-1 d-block" style={{ fontSize: '11px' }}>
                {activeTab === 'timetable' ? 'Campus scheduled slots' : activeTab === 'syllabus' ? 'CET / JEE / NEET breakdown' : 'Batches with daily activity logs'}
              </span>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div
            className="sa-card bg-white border p-3 rounded-4 shadow-xs h-100 d-flex flex-column justify-content-between"
            style={{ borderColor: '#E2E8F0', borderLeft: '4px solid #0D9488' }}
          >
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-sa-muted fw-semibold" style={{ fontSize: '12px' }}>
                {activeTab === 'timetable' ? 'Scheduled Faculty' : activeTab === 'syllabus' ? 'Total mp/tp Lectures' : 'Active Faculty'}
              </span>
              <div
                className="rounded-3 d-flex align-items-center justify-content-center"
                style={{ width: '34px', height: '34px', backgroundColor: '#F0FDFA', color: '#0D9488' }}
              >
                {activeTab === 'timetable' ? <User size={17} /> : <Building2 size={17} />}
              </div>
            </div>
            <div>
              <div className="fw-bold brand-font text-sa-charcoal" style={{ fontSize: '24px', lineHeight: 1.15 }}>
                {activeTab === 'timetable'
                  ? new Set(allTimetableSlots.map(s => s.teacher_name).filter(Boolean)).size
                  : activeTab === 'syllabus'
                  ? totalAllLec
                  : new Set(dailyActivities.map(a => a.teacherName).filter(Boolean)).size}{' '}
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748B' }}>
                  {activeTab === 'syllabus' ? 'total' : 'Teachers'}
                </span>
              </div>
              <span className="text-sa-muted mt-1 d-block" style={{ fontSize: '11px' }}>
                {activeTab === 'syllabus' ? 'Boards + Entrance planned' : 'Teachers with daily activity logs'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION 1: DAILY ACTIVITIES TAB CONTENT */}
      {/* ========================================================= */}
      {activeTab === 'daily' && (
        <div
          className="sa-card bg-white border rounded-4 p-4 shadow-xs d-flex flex-column gap-3.5"
          style={{ borderColor: '#E2E8F0' }}
        >
          {/* Action Buttons Toolbar */}
          <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 pb-3 border-bottom">
            <div>
              <h2 className="brand-font fw-bold m-0" style={{ fontSize: '18px', color: '#0F172A' }}>
                Daily Faculty Teaching Activities
              </h2>
              <span className="text-sa-muted small" style={{ fontSize: '12.5px' }}>
                Import daily activities via Excel with Chapter, Duration Periods, Target Completion Date, and Branch
              </span>
            </div>

            <div className="d-flex align-items-center gap-2 flex-wrap">
              {/* Hidden File Input for Excel Import */}
              <input
                type="file"
                ref={dailyExcelInputRef}
                accept=".xlsx, .xls, .csv"
                style={{ display: 'none' }}
                onChange={handleDailyExcelChange}
              />

              <button
                type="button"
                onClick={handleTriggerDailyExcel}
                className="btn btn-sm text-white d-inline-flex align-items-center gap-1.5 fw-semibold shadow-xs"
                style={{
                  height: '38px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  padding: '0 15px',
                  backgroundColor: '#168554',
                  borderColor: '#168554',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer'
                }}
                title="Upload Excel to auto-fill daily activities for respective teachers"
              >
                <FileSpreadsheet size={15} />
                <span>Import Daily Activities (Excel)</span>
              </button>

              <button
                type="button"
                onClick={handleExportDailyActivities}
                className="btn btn-sm btn-light border d-inline-flex align-items-center gap-1.5 fw-medium text-sa-charcoal shadow-xs"
                style={{
                  height: '38px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  padding: '0 13px',
                  backgroundColor: '#FFFFFF',
                  borderColor: '#CBD5E1',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer'
                }}
                title="Export activities list to Excel"
              >
                <Download size={14} style={{ color: '#2563EB' }} />
                <span>Export</span>
              </button>

              <button
                type="button"
                onClick={handleOpenAddDailyModal}
                className="btn btn-sm text-white d-inline-flex align-items-center gap-1.5 fw-semibold shadow-xs"
                style={{
                  height: '38px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  padding: '0 15px',
                  backgroundColor: '#8B1216',
                  borderColor: '#8B1216',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer'
                }}
              >
                <Plus size={15} />
                <span>+ Log Daily Activity</span>
              </button>
            </div>
          </div>

          {/* Quick Filters Bar: Branch */}
          <div className="d-flex flex-column gap-2 pt-1 pb-1">
            {/* Quick Branch Filter */}
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <span className="text-sa-muted small fw-semibold" style={{ fontSize: '12px' }}>
                Filter Branch:
              </span>
              {(isSuperAdmin || !activeBranch ? [
                { id: 'All', label: 'All Branches' },
                { id: 'Tarabai Park', label: 'Tarabai Park Branch' },
                { id: 'Mangalwar Peth', label: 'Mangalwar Peth Branch' }
              ] : [
                { id: userBranchName, label: `${userBranchName} [Fixed from Login]` }
              ]).map((b) => {
                const active = dailyBranchFilter === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setDailyBranchFilter(b.id)}
                    className={`btn btn-sm d-inline-flex align-items-center gap-1.5 transition-all shadow-xs ${
                      active ? 'text-white fw-bold' : 'bg-white border text-sa-charcoal'
                    }`}
                    style={{
                      backgroundColor: active ? (b.id === 'Mangalwar Peth' ? '#0D9488' : '#8B1216') : '#FFFFFF',
                      borderColor: active ? (b.id === 'Mangalwar Peth' ? '#0D9488' : '#8B1216') : '#CBD5E1',
                      borderRadius: '20px',
                      fontSize: '12px',
                      padding: '4px 12px',
                      cursor: 'pointer'
                    }}
                  >
                    <MapPin size={12} />
                    <span>{b.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detailed Filters Bar */}
          <div className="row g-2 align-items-center">
            {/* Filter by Date */}
            <div className="col-12 col-md-3">
              <div className="d-flex align-items-center gap-1.5">
                <div className="position-relative flex-grow-1">
                  <Calendar
                    size={14}
                    className="position-absolute"
                    style={{ left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#8B1216' }}
                  />
                  <input
                    type="date"
                    value={dailyDateFilter}
                    onChange={(e) => setDailyDateFilter(e.target.value)}
                    className="form-control form-control-sm border shadow-xs"
                    style={{
                      height: '38px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      paddingLeft: '32px',
                      borderColor: dailyDateFilter ? '#8B1216' : '#CBD5E1',
                      backgroundColor: dailyDateFilter ? '#FFF5F5' : '#FFFFFF',
                      fontWeight: dailyDateFilter ? 600 : 400
                    }}
                    title="Filter by Activity Date"
                  />
                </div>
                {dailyDateFilter ? (
                  <button
                    type="button"
                    onClick={() => setDailyDateFilter('')}
                    className="btn btn-sm btn-outline-secondary px-2 py-1"
                    style={{ height: '38px', borderRadius: '8px', fontSize: '11px', whiteSpace: 'nowrap' }}
                    title="Show All Dates"
                  >
                    All Dates
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDailyDateFilter(new Date().toISOString().split('T')[0])}
                    className="btn btn-sm btn-outline-danger px-2 py-1"
                    style={{ height: '38px', borderRadius: '8px', fontSize: '11px', whiteSpace: 'nowrap' }}
                    title="Filter by Today's Date"
                  >
                    Today
                  </button>
                )}
              </div>
            </div>

            {/* Search */}
            <div className="col-12 col-md-3">
              <div className="position-relative">
                <Search
                  size={15}
                  className="position-absolute"
                  style={{ left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}
                />
                <input
                  type="text"
                  placeholder="Search topic, chapter, subject, teacher..."
                  value={dailySearch}
                  onChange={(e) => setDailySearch(e.target.value)}
                  className="form-control form-control-sm border shadow-xs ps-4"
                  style={{
                    height: '38px',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    paddingLeft: '34px',
                    borderColor: '#CBD5E1'
                  }}
                />
              </div>
            </div>

            {/* Filter by Faculty */}
            <div className="col-6 col-md-2">
              <select
                value={dailyTeacherFilter}
                onChange={(e) => setDailyTeacherFilter(e.target.value)}
                className="form-select form-select-sm border shadow-xs"
                style={{ height: '38px', borderRadius: '8px', fontSize: '12px', borderColor: '#CBD5E1' }}
              >
                <option value="All">All Faculty</option>
                {Array.from(new Set([
                  ...teachers.map(t => t.name),
                  ...dailyActivities.map(a => a.teacherName)
                ])).filter(Boolean).map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Filter by Branch */}
            <div className="col-6 col-md-2">
              <select
                value={dailyBranchFilter}
                onChange={(e) => setDailyBranchFilter(e.target.value)}
                disabled={!isSuperAdmin && Boolean(activeBranch)}
                className="form-select form-select-sm border shadow-xs"
                style={{ height: '38px', borderRadius: '8px', fontSize: '12px', borderColor: '#CBD5E1' }}
              >
                {!isSuperAdmin && activeBranch ? (
                  <option value={userBranchName}>{userBranchName} [Fixed from Login]</option>
                ) : (
                  <>
                    <option value="All">All Branches</option>
                    <option value="Tarabai Park">Tarabai Park</option>
                    <option value="Mangalwar Peth">Mangalwar Peth</option>
                  </>
                )}
              </select>
            </div>

            {/* Filter by Subject */}
            <div className="col-6 col-md-2">
              <select
                value={dailySubjectFilter}
                onChange={(e) => setDailySubjectFilter(e.target.value)}
                className="form-select form-select-sm border shadow-xs"
                style={{ height: '38px', borderRadius: '8px', fontSize: '12px', borderColor: '#CBD5E1' }}
              >
                <option value="All">All Subjects</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Biology">Biology</option>
              </select>
            </div>

            {/* Filter by Batch */}
            <div className="col-6 col-md-2">
              <select
                value={dailyBatchFilter}
                onChange={(e) => setDailyBatchFilter(e.target.value)}
                className="form-select form-select-sm border shadow-xs"
                style={{ height: '38px', borderRadius: '8px', fontSize: '12px', borderColor: '#CBD5E1' }}
              >
                <option value="All">All Batches</option>
                {Array.from(new Set([
                  'Class 12th',
                  'Class 11th',
                  '12th pcm tarabai park',
                  '12th pcb tarabai park',
                  '12th pcmb tarabai park',
                  '12th pcm Mangalvar Peth',
                  '12th pcb Mangalvar Peth',
                  '12th pcmb Mangalvar Peth',
                  '11th pcm tarabai park',
                  '11th pcb tarabai park',
                  '11th pcmb tarabai park',
                  '11th pcm Mangalvar Peth',
                  '11th pcb Mangalvar Peth',
                  '11th pcmb Mangalvar Peth',
                  ...batches.map(b => b.name),
                  ...dailyActivities.map(a => a.batch)
                ])).filter(Boolean).map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* Filter by Status */}
            <div className="col-6 col-md-2">
              <select
                value={dailyStatusFilter}
                onChange={(e) => setDailyStatusFilter(e.target.value)}
                className="form-select form-select-sm border shadow-xs"
                style={{ height: '38px', borderRadius: '8px', fontSize: '12px', borderColor: '#CBD5E1' }}
              >
                <option value="All">All Statuses</option>
                <option value="Completed">Completed</option>
                <option value="In Progress">In Progress</option>
              </select>
            </div>
          </div>

          {/* View Format Switcher */}
          <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-2.5 pt-1">
            <div className="d-flex align-items-center gap-2">
              <span className="fw-bold text-sa-charcoal" style={{ fontSize: '12.5px' }}>View Format:</span>
              <div className="d-flex align-items-center p-0.5 bg-light border rounded-3" style={{ borderColor: '#CBD5E1' }}>
                <button
                  type="button"
                  onClick={() => setDailyViewMode('excel')}
                  className={`btn btn-sm d-inline-flex align-items-center gap-1.5 fw-semibold px-3 py-1 ${
                    dailyViewMode === 'excel' ? 'bg-sa-maroon text-white shadow-xs' : 'text-sa-charcoal'
                  }`}
                  style={{
                    backgroundColor: dailyViewMode === 'excel' ? '#8B1216' : 'transparent',
                    borderRadius: '6px',
                    fontSize: '12px',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <FileSpreadsheet size={13} />
                  <span>Excel Sheet Structure (As-It-Is)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDailyViewMode('logs')}
                  className={`btn btn-sm d-inline-flex align-items-center gap-1.5 fw-semibold px-3 py-1 ${
                    dailyViewMode === 'logs' ? 'bg-sa-maroon text-white shadow-xs' : 'text-sa-charcoal'
                  }`}
                  style={{
                    backgroundColor: dailyViewMode === 'logs' ? '#8B1216' : 'transparent',
                    borderRadius: '6px',
                    fontSize: '12px',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <CalendarDays size={13} />
                  <span>Detailed Activity Logs</span>
                </button>
              </div>
            </div>

            {dailyViewMode === 'excel' && (
              <div className="d-flex align-items-center gap-1.5 flex-wrap">
                {['Physics', 'Chemistry', 'Mathematics', 'Biology', 'All'].map((sub) => {
                  const isSelected = syllabusSubject === sub;
                  return (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => {
                        setSyllabusSubject(sub);
                        loadSyllabusData(sub);
                      }}
                      className="btn btn-sm px-2.5 py-1 fw-semibold"
                      style={{
                        backgroundColor: isSelected ? '#8B1216' : '#FFFFFF',
                        color: isSelected ? '#FFFFFF' : '#475569',
                        border: isSelected ? '1px solid #8B1216' : '1px solid #CBD5E1',
                        borderRadius: '6px',
                        fontSize: '11.5px',
                        cursor: 'pointer'
                      }}
                    >
                      {sub}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {dailyViewMode === 'excel' ? (
            renderAsItIsExcelTable()
          ) : (
            /* Daily Activities Table - Responsive with Sticky Action Column */
            <div className="table-responsive border rounded-3" style={{ borderColor: '#FEE2E2', borderRadius: '12px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'thin' }}>
              <table className="table table-hover align-middle m-0" style={{ fontSize: '12.5px', minWidth: '1150px' }}>
              <thead style={{ backgroundColor: '#FFF5F5', borderBottom: '1.5px solid #FEE2E2' }}>
                <tr style={{ height: '42px' }}>
                  <th style={{ padding: '11px 14px', width: '45px', color: '#8B1216', fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>#</th>
                  <th style={{ padding: '11px 14px', color: '#8B1216', fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Date Covered</th>
                  {dailyBranchFilter === 'All' && (
                    <th style={{ padding: '11px 14px', color: '#8B1216', fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Branch</th>
                  )}
                  {dailyTeacherFilter === 'All' && (
                    <th style={{ padding: '11px 14px', color: '#8B1216', fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Subject & Faculty</th>
                  )}
                  <th style={{ padding: '11px 14px', color: '#8B1216', fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Class / Batch</th>
                  <th style={{ padding: '11px 14px', color: '#8B1216', fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Chapter</th>
                  <th style={{ padding: '11px 14px', color: '#8B1216', fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Topic Taught & Outcomes</th>
                  <th style={{ padding: '11px 14px', color: '#8B1216', fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Time Slot</th>
                  <th style={{ padding: '11px 14px', color: '#8B1216', fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Duration (Periods & Hrs)</th>
                  <th style={{ padding: '11px 14px', color: '#8B1216', fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Status</th>
                  <th
                    style={{
                      padding: '11px 14px',
                      textAlign: 'center',
                      color: '#8B1216',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      position: 'sticky',
                      right: 0,
                      backgroundColor: '#FFF5F5',
                      boxShadow: '-4px 0 8px rgba(0, 0, 0, 0.05)',
                      zIndex: 3,
                      minWidth: '100px',
                      width: '100px'
                    }}
                  >
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredDailyActivities.length === 0 ? (
                  <tr>
                    <td colSpan={8 + (dailyBranchFilter === 'All' ? 1 : 0) + (dailyTeacherFilter === 'All' ? 1 : 0)} className="text-center py-5 text-sa-muted">
                      <div className="d-flex flex-column align-items-center justify-content-center gap-2">
                        <FileSpreadsheet size={32} style={{ color: '#94A3B8' }} />
                        <span className="fw-medium">No daily activity records match the selected filters.</span>
                        <small>Click "Import Daily Activities (Excel)" or "+ Log Daily Activity" to add records.</small>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredDailyActivities.map((item, idx) => {
                    const subjStyle = getSubjectColor(item.subject);
                    const branchStyle = getBranchBadge(item.branch);
                    return (
                      <tr key={item.id || idx}>
                        <td style={{ padding: '11px 16px', color: '#64748B', fontWeight: 500 }}>
                          {idx + 1}
                        </td>
                        <td style={{ padding: '11px 16px', whiteSpace: 'nowrap' }}>
                          <div className="d-flex align-items-center gap-1.5 text-sa-charcoal fw-semibold" style={{ fontSize: '12px' }}>
                            <Calendar size={13} style={{ color: '#8B1216' }} />
                            <span>{item.activity_date || item.activityDate || item.targetDate || '—'}</span>
                          </div>
                        </td>
                        {dailyBranchFilter === 'All' && (
                          <td style={{ padding: '11px 16px', whiteSpace: 'nowrap' }}>
                            <span
                              className="badge fw-semibold d-inline-flex align-items-center gap-1"
                              style={{
                                backgroundColor: branchStyle.bg,
                                color: branchStyle.text,
                                border: `1px solid ${branchStyle.border}`,
                                fontSize: '11px',
                                borderRadius: '6px',
                                padding: '3px 8px'
                              }}
                            >
                              <MapPin size={11} />
                              <span>{branchStyle.label}</span>
                            </span>
                          </td>
                        )}
                        {dailyTeacherFilter === 'All' && (
                          <td style={{ padding: '11px 16px' }}>
                            <div className="d-flex align-items-center gap-2">
                              {item.teacherName && item.teacherName.toLowerCase() !== 'unassigned' ? (
                                <>
                                  <div
                                    className="rounded-circle d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                                    style={{
                                      width: '28px',
                                      height: '28px',
                                      backgroundColor: '#F1F5F9',
                                      color: '#0F172A',
                                      fontSize: '11px'
                                    }}
                                  >
                                    {item.teacherName.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <div className="fw-semibold text-sa-charcoal" style={{ fontSize: '12.5px' }}>
                                      {item.teacherName}
                                    </div>
                                    {item.subject && (
                                      <span
                                        className="badge rounded-pill fw-semibold mt-0.5"
                                        style={{
                                          backgroundColor: subjStyle.bg,
                                          color: subjStyle.text,
                                          border: `1px solid ${subjStyle.border}`,
                                          fontSize: '10.5px'
                                        }}
                                      >
                                        {item.subject}
                                      </span>
                                    )}
                                  </div>
                                </>
                              ) : (
                                <div>
                                  {item.subject && (
                                    <span
                                      className="badge rounded-pill fw-semibold mb-1 d-inline-block"
                                      style={{
                                        backgroundColor: subjStyle.bg,
                                        color: subjStyle.text,
                                        border: `1px solid ${subjStyle.border}`,
                                        fontSize: '10.5px'
                                      }}
                                    >
                                      {item.subject}
                                    </span>
                                  )}
                                  <div className="text-sa-muted" style={{ fontSize: '12px' }}>
                                    Unassigned
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        )}
                        <td style={{ padding: '11px 16px' }}>
                          <span className="text-sa-charcoal fw-medium" style={{ fontSize: '12px' }}>
                            {formatClassBatch(item.batch)}
                          </span>
                        </td>
                        <td style={{ padding: '11px 16px' }}>
                          <div className="fw-semibold text-sa-charcoal" style={{ fontSize: '12.5px' }}>
                            {item.chapter || 'Curriculum Chapter'}
                          </div>
                        </td>
                        <td style={{ padding: '11px 16px', maxWidth: '240px' }}>
                          <div className="fw-bold text-sa-charcoal" style={{ fontSize: '13px' }}>
                            {item.topicTaught}
                          </div>
                          {item.remarks && (
                            <small className="text-sa-muted d-block mt-0.5" style={{ fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {item.remarks}
                            </small>
                          )}
                        </td>
                        <td style={{ padding: '11px 16px', whiteSpace: 'nowrap', color: '#475569', fontSize: '12px' }}>
                          <div className="d-flex align-items-center gap-1">
                            <Clock size={12} style={{ color: '#8B1216' }} />
                            <span>{item.timeSlot || '—'}</span>
                          </div>
                        </td>
                        <td style={{ padding: '11px 16px', whiteSpace: 'nowrap' }}>
                          <div className="d-flex align-items-center gap-1.5">
                            <span
                              className="badge fw-semibold"
                              style={{ backgroundColor: '#F1F5F9', color: '#334155', fontSize: '11.5px', borderRadius: '6px' }}
                            >
                              {item.periods && item.totalPlannedPeriods && item.periods !== item.totalPlannedPeriods
                                ? `${item.periods} / ${item.totalPlannedPeriods} Periods`
                                : `${item.totalPlannedPeriods || item.periods} Lectures`}
                            </span>
                            <span
                              className="badge fw-semibold"
                              style={{ backgroundColor: '#FEE2E2', color: '#B91C1C', fontSize: '11px', borderRadius: '6px' }}
                            >
                              {item.hours || item.totalPlannedPeriods || item.periods}h
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '11px 16px' }}>
                          <span
                            className="badge rounded-pill fw-semibold"
                            style={{
                              backgroundColor: (item.status === 'Completed' || item.status === 'completed') ? '#EAF6EF' : '#FEF3C7',
                              color: (item.status === 'Completed' || item.status === 'completed') ? '#168554' : '#D97706',
                              border: (item.status === 'Completed' || item.status === 'completed') ? '1px solid #C6E7D2' : '1px solid #FDE68A',
                              fontSize: '11px'
                            }}
                          >
                            {(item.status === 'Completed' || item.status === 'completed') ? '✓ Completed' : '⏳ In Progress'}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: '10px 14px',
                            textAlign: 'center',
                            position: 'sticky',
                            right: 0,
                            backgroundColor: '#FFFFFF',
                            boxShadow: '-4px 0 8px rgba(0, 0, 0, 0.04)',
                            zIndex: 2,
                            minWidth: '100px',
                            width: '100px'
                          }}
                        >
                          <div className="d-inline-flex align-items-center justify-content-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditDailyModal(item)}
                              className="btn btn-sm d-inline-flex align-items-center justify-content-center p-0"
                              style={{
                                width: '30px',
                                height: '30px',
                                borderRadius: '8px',
                                backgroundColor: '#EFF6FF',
                                color: '#2563EB',
                                border: '1px solid #BFDBFE',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                              title="Edit Activity"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteDailyActivity(item.id)}
                              className="btn btn-sm d-inline-flex align-items-center justify-content-center p-0"
                              style={{
                                width: '30px',
                                height: '30px',
                                borderRadius: '8px',
                                backgroundColor: '#FEF2F2',
                                color: '#DC2626',
                                border: '1px solid #FECACA',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                              title="Delete Activity"
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
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 2: MASTER WEEKLY TIMETABLE TAB */}
      {/* ========================================================= */}
      {activeTab === 'timetable' && (
        <div
          className="sa-card bg-white border rounded-4 p-4 shadow-xs d-flex flex-column gap-3.5"
          style={{ borderColor: '#E2E8F0' }}
        >
          {/* Action Buttons Toolbar */}
          <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 pb-3 border-bottom">
            <div>
              <h2 className="brand-font fw-bold m-0" style={{ fontSize: '18px', color: '#0F172A' }}>
                Master Weekly Timetable
              </h2>
              <span className="text-sa-muted small" style={{ fontSize: '12.5px' }}>
                Assign weekly lectures across branches & batches. Teachers see their assigned schedule immediately in My Classes.
              </span>
            </div>

            <div className="d-flex align-items-center gap-2 flex-wrap">
              {/* Hidden File Input for Timetable Import */}
              <input
                type="file"
                ref={timetableExcelInputRef}
                accept=".xlsx, .xls, .csv"
                style={{ display: 'none' }}
                onChange={handleTimetableExcelChange}
              />

              {/* View Switcher: Grid vs Table */}
              <div className="btn-group shadow-xs" role="group" style={{ height: '36px' }}>
                <button
                  type="button"
                  onClick={() => setTimetableViewMode('grid')}
                  className={`btn btn-sm d-inline-flex align-items-center gap-1.5 fw-semibold ${
                    timetableViewMode === 'grid' ? 'btn-dark' : 'btn-light border'
                  }`}
                  style={{ fontSize: '12px', borderRadius: '6px 0 0 6px' }}
                >
                  <Grid size={13} />
                  <span>Grid Matrix</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTimetableViewMode('table')}
                  className={`btn btn-sm d-inline-flex align-items-center gap-1.5 fw-semibold ${
                    timetableViewMode === 'table' ? 'btn-dark' : 'btn-light border'
                  }`}
                  style={{ fontSize: '12px', borderRadius: '0 6px 6px 0' }}
                >
                  <List size={13} />
                  <span>Table List</span>
                </button>
              </div>

              {/* Export Timetable */}
              <button
                type="button"
                onClick={handleExportTimetable}
                className="btn btn-sm btn-light border d-inline-flex align-items-center gap-1.5 fw-medium text-sa-charcoal shadow-xs"
                style={{ height: '36px', borderRadius: '6px', fontSize: '12px' }}
              >
                <FileSpreadsheet size={13} className="text-success" />
                <span>Export (.xlsx)</span>
              </button>

              {/* Import Excel Button */}
              <button
                type="button"
                onClick={handleTriggerTimetableExcel}
                className="btn btn-sm text-white d-inline-flex align-items-center gap-1.5 fw-semibold shadow-xs"
                style={{
                  height: '36px',
                  backgroundColor: '#1E293B',
                  borderRadius: '6px',
                  fontSize: '12px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <Upload size={13} />
                <span>Import Excel</span>
              </button>

              {/* Add Single Slot Button */}
              <button
                type="button"
                onClick={() => handleOpenAddTimetableModal()}
                className="btn btn-sm text-white d-inline-flex align-items-center gap-1.5 fw-semibold shadow-xs"
                style={{
                  height: '36px',
                  backgroundColor: '#8B1216',
                  borderRadius: '6px',
                  fontSize: '12.5px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <Plus size={15} />
                <span>Add Timetable Slot</span>
              </button>
            </div>
          </div>

          {/* Week Schedule Status & Faculty Request Alert */}
          {(!publishedWeeks.includes('2026-10-19') || requestedWeeks.length > 0) && (
            <div
              className="p-3 rounded-3 border d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 shadow-xs"
              style={{
                backgroundColor: requestedWeeks.includes('2026-10-19') ? '#FFFBEB' : '#F8FAFC',
                borderColor: requestedWeeks.includes('2026-10-19') ? '#FDE68A' : '#E2E8F0'
              }}
            >
              <div className="d-flex align-items-center gap-2.5">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{
                    width: '34px',
                    height: '34px',
                    backgroundColor: requestedWeeks.includes('2026-10-19') ? '#FEF3C7' : '#EFF6FF',
                    color: requestedWeeks.includes('2026-10-19') ? '#B45309' : '#2563EB'
                  }}
                >
                  <Bell size={16} />
                </div>
                <div>
                  <div className="fw-bold text-sa-charcoal" style={{ fontSize: '13.5px' }}>
                    {requestedWeeks.includes('2026-10-19')
                      ? 'Faculty Timetable Request: Mon, 19 Oct – Sat, 24 Oct 2026'
                      : 'Upcoming Week Timetable: Mon, 19 Oct – Sat, 24 Oct 2026 (Pending Release)'}
                  </div>
                  <span className="text-sa-muted" style={{ fontSize: '12px' }}>
                    {requestedWeeks.includes('2026-10-19')
                      ? 'Faculty visited the calendar and requested timetable release for Mon 19 Oct – Sat, 24 Oct 2026. Import from Excel or click "Publish Schedule" to activate slots in teacher portals.'
                      : 'Weekly timetable for Mon 19 Oct – Sat, 24 Oct 2026 is pending release. Teachers see a "Schedule Coming Soon" placeholder until published.'}
                  </span>
                </div>
              </div>
              <div className="d-flex align-items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handlePublishWeek('2026-10-19', 'Mon, 19 Oct – Sat, 24 Oct 2026')}
                  className="btn btn-sm btn-warning text-dark fw-bold d-inline-flex align-items-center gap-1.5 shadow-xs"
                  style={{ height: '36px', borderRadius: '6px', fontSize: '12px' }}
                >
                  <CheckCircle2 size={15} />
                  <span>Publish Schedule (19 Oct – 24 Oct)</span>
                </button>
              </div>
            </div>
          )}

          {/* Search & Filter Toolbar */}
          <div className="d-flex flex-wrap align-items-center gap-2.5 pb-1">
            {/* Search Input */}
            <div className="position-relative flex-grow-1" style={{ minWidth: '220px' }}>
              <Search
                size={14}
                className="position-absolute text-sa-muted"
                style={{ left: '12px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                placeholder="Search subject, batch, faculty, room..."
                className="form-control form-control-sm border shadow-xs"
                value={timetableSearch}
                onChange={(e) => setTimetableSearch(e.target.value)}
                style={{
                  paddingLeft: '34px',
                  height: '38px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  borderColor: '#E2E8F0'
                }}
              />
            </div>

            {/* Branch Filter */}
            <div style={{ minWidth: '150px' }}>
              <select
                className="form-select form-select-sm border shadow-xs text-sa-charcoal"
                value={timetableBranchFilter}
                onChange={(e) => setTimetableBranchFilter(e.target.value)}
                disabled={!isSuperAdmin && Boolean(activeBranch)}
                style={{ height: '38px', borderRadius: '8px', fontSize: '12px', borderColor: '#E2E8F0' }}
              >
                {!isSuperAdmin && activeBranch ? (
                  <option value={userBranchName}>{userBranchName} [Fixed from Login]</option>
                ) : (
                  <>
                    <option value="All">All Branches</option>
                    {branches.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </>
                )}
              </select>
            </div>

            {/* Faculty Filter */}
            <div style={{ minWidth: '170px' }}>
              <select
                className="form-select form-select-sm border shadow-xs text-sa-charcoal"
                value={timetableTeacherFilter}
                onChange={(e) => setTimetableTeacherFilter(e.target.value)}
                style={{ height: '38px', borderRadius: '8px', fontSize: '12px', borderColor: '#E2E8F0' }}
              >
                <option value="All">All Faculty</option>
                {Array.from(new Set(allTimetableSlots.map(s => s.teacher_name).filter(Boolean))).map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Subject Filter */}
            <div style={{ minWidth: '140px' }}>
              <select
                className="form-select form-select-sm border shadow-xs text-sa-charcoal"
                value={timetableSubjectFilter}
                onChange={(e) => setTimetableSubjectFilter(e.target.value)}
                style={{ height: '38px', borderRadius: '8px', fontSize: '12px', borderColor: '#E2E8F0' }}
              >
                <option value="All">All Subjects</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Biology">Biology</option>
              </select>
            </div>

            {/* Day Filter */}
            <div style={{ minWidth: '130px' }}>
              <select
                className="form-select form-select-sm border shadow-xs text-sa-charcoal"
                value={timetableDayFilter}
                onChange={(e) => setTimetableDayFilter(e.target.value)}
                style={{ height: '38px', borderRadius: '8px', fontSize: '12px', borderColor: '#E2E8F0' }}
              >
                <option value="All">All Days</option>
                {timetableWeekDays.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Reset Filters */}
            {(timetableSearch || timetableBranchFilter !== 'All' || timetableTeacherFilter !== 'All' || timetableSubjectFilter !== 'All' || timetableDayFilter !== 'All') && (
              <button
                type="button"
                onClick={() => {
                  setTimetableSearch('');
                  setTimetableBranchFilter('All');
                  setTimetableTeacherFilter('All');
                  setTimetableSubjectFilter('All');
                  setTimetableDayFilter('All');
                }}
                className="btn btn-sm btn-link text-decoration-none text-sa-maroon fw-semibold p-0"
                style={{ fontSize: '12px' }}
              >
                Reset Filters
              </button>
            )}
          </div>

          {/* VIEW 1: GRID MATRIX VIEW */}
          {timetableViewMode === 'grid' && (
            <div className="table-responsive border rounded-3 bg-white" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table className="table table-bordered align-middle m-0" style={{ minWidth: '920px', fontSize: '12px' }}>
                <thead style={{ backgroundColor: '#F8FAFC' }}>
                  <tr>
                    <th
                      style={{
                        width: '150px',
                        minWidth: '150px',
                        padding: '12px',
                        color: '#475569',
                        fontWeight: 600,
                        backgroundColor: '#F8FAFC',
                        position: 'sticky',
                        left: 0,
                        zIndex: 2,
                        boxShadow: '2px 0 5px rgba(0,0,0,0.03)'
                      }}
                    >
                      <div className="d-flex align-items-center gap-1.5">
                        <Clock size={14} className="text-sa-muted" />
                        <span>Time Slot</span>
                      </div>
                    </th>
                    {timetableWeekDays.map(d => (
                      <th
                        key={d}
                        style={{
                          padding: '12px',
                          color: '#0F172A',
                          fontWeight: 700,
                          textAlign: 'center',
                          backgroundColor: '#F8FAFC',
                          minWidth: '150px'
                        }}
                      >
                        {d}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timetableTimeSlots.map((timeSlot) => (
                    <tr key={timeSlot}>
                      {/* Time Slot Label */}
                      <td
                        style={{
                          padding: '12px',
                          fontWeight: 600,
                          color: '#1E293B',
                          backgroundColor: '#FAFAFA',
                          position: 'sticky',
                          left: 0,
                          zIndex: 2,
                          boxShadow: '2px 0 5px rgba(0,0,0,0.03)',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        <div className="d-flex align-items-center gap-1.5">
                          <span className="badge rounded-pill bg-light text-dark border" style={{ fontSize: '11px', fontWeight: 600 }}>
                            {timeSlot}
                          </span>
                        </div>
                      </td>

                      {/* Day Columns */}
                      {timetableWeekDays.map((day) => {
                        const slots = getSlotsForDayAndTime(day, timeSlot);
                        return (
                          <td
                            key={day}
                            style={{
                              padding: '8px',
                              verticalAlign: 'top',
                              backgroundColor: slots.length > 0 ? '#FFFFFF' : '#FDFDFD',
                              minWidth: '150px'
                            }}
                          >
                            {slots.length > 0 ? (
                              <div className="d-flex flex-column gap-2">
                                {slots.map((s) => {
                                  const subCol = getSubjectColor(s.subject);
                                  const brBadge = getBranchBadge(s.branch);
                                  return (
                                    <div
                                      key={s.id}
                                      className="p-2.5 rounded-3 border position-relative transition-all"
                                      style={{
                                        backgroundColor: subCol.bg,
                                        borderColor: subCol.border,
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                                      }}
                                    >
                                      {/* Top Row: Subject + Class Code */}
                                      <div className="d-flex align-items-center justify-content-between gap-1 mb-1.5">
                                        <span
                                          className="fw-bold"
                                          style={{
                                            fontSize: '12px',
                                            color: subCol.text
                                          }}
                                        >
                                          {s.subject}
                                        </span>
                                        <span
                                          className="badge rounded-pill fw-bold"
                                          style={{
                                            backgroundColor: '#FFFFFF',
                                            color: '#0F172A',
                                            border: `1px solid ${subCol.border}`,
                                            fontSize: '10px'
                                          }}
                                        >
                                          {s.class_code || '12-A'}
                                        </span>
                                      </div>

                                      {/* Faculty Name */}
                                      <div
                                        className="d-flex align-items-center gap-1 text-dark fw-semibold mb-1"
                                        style={{ fontSize: '11.5px' }}
                                      >
                                        <User size={12} style={{ color: subCol.dot }} />
                                        <span className="text-truncate" title={s.teacher_name}>
                                          {s.teacher_name}
                                        </span>
                                      </div>

                                      {/* Room & Branch Pill */}
                                      <div className="d-flex align-items-center justify-content-between gap-1 pt-1 border-top" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                                        <span className="text-sa-muted d-flex align-items-center gap-1" style={{ fontSize: '10.5px' }}>
                                          <MapPin size={10} />
                                          {s.room}
                                        </span>
                                        <span
                                          className="badge rounded-pill"
                                          style={{
                                            backgroundColor: brBadge.bg,
                                            color: brBadge.text,
                                            fontSize: '9.5px',
                                            border: `1px solid ${brBadge.border}`
                                          }}
                                        >
                                          {brBadge.label.split(' ')[0]}
                                        </span>
                                      </div>

                                      {/* Action Buttons: Edit / Delete */}
                                      <div className="d-flex align-items-center justify-content-end gap-1 mt-1.5 pt-1 border-top" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                                        <button
                                          type="button"
                                          onClick={() => handleOpenEditTimetableModal(s)}
                                          className="btn btn-sm btn-link p-0 text-primary d-inline-flex align-items-center gap-0.5 text-decoration-none"
                                          style={{ fontSize: '11px', fontWeight: 600 }}
                                          title="Edit Slot"
                                        >
                                          <Edit3 size={11} />
                                          <span>Edit</span>
                                        </button>
                                        <span className="text-muted" style={{ fontSize: '10px' }}>•</span>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteTimetableSlot(s)}
                                          className="btn btn-sm btn-link p-0 text-danger d-inline-flex align-items-center gap-0.5 text-decoration-none"
                                          style={{ fontSize: '11px', fontWeight: 600 }}
                                          title="Delete Slot"
                                        >
                                          <Trash2 size={11} />
                                          <span>Delete</span>
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenAddTimetableModal(day, timeSlot)}
                                className="btn btn-sm w-100 h-100 d-flex align-items-center justify-content-center text-muted border-0 bg-transparent py-2"
                                style={{ fontSize: '11px', opacity: 0.6 }}
                                title={`Add slot for ${day} at ${timeSlot}`}
                              >
                                <Plus size={13} className="me-1" /> Add
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* VIEW 2: TABLE LIST VIEW */}
          {timetableViewMode === 'table' && (
            <div className="table-responsive border rounded-3 bg-white" style={{ WebkitOverflowScrolling: 'touch' }}>
              <table className="table table-hover align-middle m-0" style={{ minWidth: '900px', fontSize: '12.5px' }}>
                <thead style={{ backgroundColor: '#F8FAFC' }}>
                  <tr>
                    <th style={{ padding: '12px 14px', color: '#64748B', fontWeight: 600, width: '50px' }}>#</th>
                    <th style={{ padding: '12px 14px', color: '#1E293B', fontWeight: 600 }}>Day</th>
                    <th style={{ padding: '12px 14px', color: '#1E293B', fontWeight: 600 }}>Time Slot</th>
                    <th style={{ padding: '12px 14px', color: '#1E293B', fontWeight: 600 }}>Class / Batch</th>
                    <th style={{ padding: '12px 14px', color: '#1E293B', fontWeight: 600 }}>Subject</th>
                    <th style={{ padding: '12px 14px', color: '#1E293B', fontWeight: 600 }}>Assigned Faculty</th>
                    <th style={{ padding: '12px 14px', color: '#1E293B', fontWeight: 600 }}>Room</th>
                    <th style={{ padding: '12px 14px', color: '#1E293B', fontWeight: 600 }}>Branch</th>
                    <th
                      style={{
                        padding: '12px 14px',
                        color: '#1E293B',
                        fontWeight: 600,
                        textAlign: 'center',
                        position: 'sticky',
                        right: 0,
                        backgroundColor: '#F8FAFC',
                        zIndex: 2,
                        minWidth: '100px',
                        width: '100px'
                      }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTimetableSlots.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="text-center py-5 text-sa-muted">
                        <CalendarCheck size={36} className="text-sa-muted mb-2 opacity-50" />
                        <div className="fw-semibold">No timetable slots match the selected filters.</div>
                        <div className="small mt-1">Try resetting filters or click "+ Add Timetable Slot" to schedule a lecture.</div>
                      </td>
                    </tr>
                  ) : (
                    filteredTimetableSlots.map((slot, idx) => {
                      const subCol = getSubjectColor(slot.subject);
                      const brBadge = getBranchBadge(slot.branch);
                      return (
                        <tr key={slot.id}>
                          <td style={{ padding: '12px 14px', color: '#64748B' }}>{idx + 1}</td>
                          <td style={{ padding: '12px 14px', fontWeight: 600, color: '#0F172A' }}>
                            <span className="badge bg-light text-dark border px-2 py-1" style={{ fontSize: '11.5px' }}>
                              {slot.day}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', fontWeight: 500, color: '#334155' }}>
                            <div className="d-flex align-items-center gap-1">
                              <Clock size={12} className="text-sa-muted" />
                              <span>{slot.time}</span>
                            </div>
                          </td>
                          <td style={{ padding: '12px 14px', color: '#0F172A', fontWeight: 600 }}>
                            {slot.batch}
                            <div className="text-sa-muted small" style={{ fontSize: '11px' }}>Code: {slot.class_code}</div>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span
                              className="badge border px-2.5 py-1"
                              style={{
                                backgroundColor: subCol.bg,
                                color: subCol.text,
                                borderColor: subCol.border,
                                fontSize: '11.5px',
                                fontWeight: 600
                              }}
                            >
                              {slot.subject}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', fontWeight: 600, color: '#8B1216' }}>
                            <div className="d-flex align-items-center gap-1.5">
                              <User size={13} />
                              <span>{slot.teacher_name}</span>
                            </div>
                          </td>
                          <td style={{ padding: '12px 14px', color: '#475569' }}>
                            <div className="d-flex align-items-center gap-1">
                              <MapPin size={12} className="text-sa-muted" />
                              <span>{slot.room}</span>
                            </div>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span
                              className="badge rounded-pill"
                              style={{
                                backgroundColor: brBadge.bg,
                                color: brBadge.text,
                                border: `1px solid ${brBadge.border}`,
                                fontSize: '10.5px'
                              }}
                            >
                              {brBadge.label}
                            </span>
                          </td>
                          <td
                            style={{
                              padding: '12px 14px',
                              textAlign: 'center',
                              position: 'sticky',
                              right: 0,
                              backgroundColor: '#FFFFFF',
                              boxShadow: '-4px 0 8px rgba(0, 0, 0, 0.04)',
                              zIndex: 2,
                              minWidth: '100px',
                              width: '100px'
                            }}
                          >
                            <div className="d-inline-flex align-items-center justify-content-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditTimetableModal(slot)}
                                className="btn btn-sm d-inline-flex align-items-center justify-content-center p-0"
                                style={{
                                  width: '30px',
                                  height: '30px',
                                  borderRadius: '8px',
                                  backgroundColor: '#EFF6FF',
                                  color: '#2563EB',
                                  border: '1px solid #BFDBFE',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                                title="Edit Slot"
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteTimetableSlot(slot)}
                                className="btn btn-sm d-inline-flex align-items-center justify-content-center p-0"
                                style={{
                                  width: '30px',
                                  height: '30px',
                                  borderRadius: '8px',
                                  backgroundColor: '#FEF2F2',
                                  color: '#DC2626',
                                  border: '1px solid #FECACA',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                                title="Delete Slot"
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
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 3: SYLLABUS & LECTURE BREAKDOWN PLAN (EXCEL VIEW) */}
      {/* ========================================================= */}
      {activeTab === 'syllabus' && (
        <div
          className="sa-card bg-white border rounded-4 p-4 shadow-xs d-flex flex-column gap-3.5"
          style={{ borderColor: '#E2E8F0' }}
        >
          {/* Action Buttons Toolbar */}
          <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 pb-3 border-bottom">
            <div>
              <div className="d-flex align-items-center gap-2">
                <h2 className="brand-font fw-bold m-0" style={{ fontSize: '18px', color: '#0F172A' }}>
                  Syllabus Breakdown & Lecture Plan (mp/tp)
                </h2>
                <span
                  className="badge rounded-pill fw-semibold"
                  style={{ backgroundColor: '#FDF2F2', color: '#8B1216', border: '1px solid #FECACA', fontSize: '11px', padding: '4px 10px' }}
                >
                  Mangalwar Peth & Tarabai Park
                </span>
              </div>
              <span className="text-sa-muted small" style={{ fontSize: '12.5px' }}>
                Upload and view curriculum chapters with Boards and Entrance lecture allocations exactly as structured in the academic master sheet.
              </span>
            </div>

            <div className="d-flex align-items-center gap-2 flex-wrap">
              {/* Hidden File Input for Syllabus Excel Import */}
              <input
                type="file"
                ref={syllabusExcelInputRef}
                accept=".xlsx, .xls"
                style={{ display: 'none' }}
                onChange={handleSyllabusExcelUpload}
              />

              <button
                type="button"
                onClick={handleTriggerSyllabusExcel}
                className="btn btn-sm text-white d-inline-flex align-items-center gap-1.5 fw-semibold shadow-xs"
                style={{
                  height: '38px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  padding: '0 15px',
                  backgroundColor: '#168554',
                  borderColor: '#168554',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer'
                }}
                title="Upload Excel with chapters and lecture allocations (Boards vs Entrance)"
              >
                <FileSpreadsheet size={15} />
                <span>Upload Syllabus Excel (.xlsx)</span>
              </button>

              <button
                type="button"
                onClick={handleExportSyllabusExcel}
                className="btn btn-sm btn-white border d-inline-flex align-items-center gap-1.5 fw-semibold shadow-xs"
                style={{
                  height: '38px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  padding: '0 14px',
                  color: '#475569',
                  borderColor: '#CBD5E1',
                  whiteSpace: 'nowrap',
                  backgroundColor: '#FFFFFF',
                  cursor: 'pointer'
                }}
                title="Export current subject plan to Excel"
              >
                <Download size={15} />
                <span>Export to Excel</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadSyllabusTemplate}
                className="btn btn-sm btn-light border d-inline-flex align-items-center gap-1.5 fw-semibold shadow-xs"
                style={{
                  height: '38px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  padding: '0 14px',
                  color: '#334155',
                  borderColor: '#E2E8F0',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer'
                }}
                title="Download standard template with Physics and Chemistry pre-filled"
              >
                <Download size={15} />
                <span>Sample Template</span>
              </button>

              <button
                type="button"
                onClick={handleOpenAddChapterModal}
                className="btn btn-sm text-white d-inline-flex align-items-center gap-1.5 fw-semibold shadow-xs"
                style={{
                  height: '38px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  padding: '0 15px',
                  backgroundColor: '#8B1216',
                  borderColor: '#8B1216',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer'
                }}
              >
                <Plus size={15} />
                <span>+ Add Chapter</span>
              </button>
            </div>
          </div>

          {/* Subject Navigation Tabs & Search Controls */}
          <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 flex-wrap">
            {/* Subject Tabs - Authentic Excel Sheet Tabs */}
            <div className="d-flex align-items-center gap-1.5 p-1 bg-light border rounded-3 flex-wrap" style={{ borderColor: '#E2E8F0' }}>
              {['Physics', 'Chemistry', 'Mathematics', 'Biology', 'All'].map((sub) => {
                const count = sub === 'All'
                  ? syllabusList.length
                  : syllabusList.filter((s) => s.subject && s.subject.toLowerCase() === sub.toLowerCase()).length;
                const isSelected = syllabusSubject === sub;
                const label = sub === 'All' ? '📑 All Sheets (Stacked)' : `📑 ${sub}`;
                return (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => {
                      setSyllabusSubject(sub);
                      loadSyllabusData(sub);
                    }}
                    className={`btn btn-sm d-inline-flex align-items-center gap-1.5 fw-semibold transition-all px-3 py-1.5`}
                    style={{
                      backgroundColor: isSelected ? '#8B1216' : '#FFFFFF',
                      color: isSelected ? '#FFFFFF' : '#334155',
                      border: isSelected ? '1px solid #8B1216' : '1px solid #CBD5E1',
                      borderRadius: '6px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    <span>{label}</span>
                    <span
                      className="badge rounded-pill"
                      style={{
                        backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : '#E2E8F0',
                        color: isSelected ? '#FFFFFF' : '#475569',
                        fontSize: '10.5px'
                      }}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Chapter Search Filter */}
            <div className="d-flex align-items-center gap-2" style={{ minWidth: '260px' }}>
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-white border-end-0" style={{ borderColor: '#CBD5E1', color: '#64748B' }}>
                  <Search size={14} />
                </span>
                <input
                  type="text"
                  placeholder="Search chapter title or sr.no..."
                  className="form-control border-start-0"
                  style={{ borderColor: '#CBD5E1', fontSize: '12.5px', height: '36px' }}
                  value={syllabusSearch}
                  onChange={(e) => setSyllabusSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* EXACT EXCEL FORMAT DISPLAY CONTAINER */}
          {renderAsItIsExcelTable()}
        </div>
      )}
      <Modal
        isOpen={isDailyImportModalOpen}
        onClose={() => {
          setIsDailyImportModalOpen(false);
          setDailyParsedData([]);
        }}
        title={`Import Daily Activities (${dailyParsedData.length} Records Found)`}
        size="lg"
      >
        <div className="d-flex flex-column gap-3">
          <div className="p-3 rounded-3 border bg-light d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div>
              <div className="fw-semibold text-sa-charcoal" style={{ fontSize: '13.5px' }}>
                Excel File Processed Successfully
              </div>
              <div className="text-sa-muted small">
                Excel records will be imported and saved into the database exactly as defined in the sheet.
              </div>
            </div>
            <span className="badge rounded-pill bg-success text-white px-2.5 py-1" style={{ fontSize: '11px' }}>
              ✓ Ready to Import
            </span>
          </div>

          <div className="table-responsive border rounded-3" style={{ maxHeight: '300px', overflowY: 'auto' }}>
            <table className="table table-sm table-hover align-middle m-0" style={{ fontSize: '12px' }}>
              <thead className="table-light sticky-top">
                <tr>
                  <th style={{ padding: '8px 12px' }}>#</th>
                  <th style={{ padding: '8px 12px' }}>Branch</th>
                  <th style={{ padding: '8px 12px' }}>Subject & Faculty</th>
                  <th style={{ padding: '8px 12px' }}>Class / Batch</th>
                  <th style={{ padding: '8px 12px' }}>Chapter</th>
                  <th style={{ padding: '8px 12px' }}>Topic Taught</th>
                  <th style={{ padding: '8px 12px' }}>Duration</th>
                  <th style={{ padding: '8px 12px' }}>Target Date</th>
                  <th style={{ padding: '8px 12px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {dailyParsedData.map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: '8px 12px', color: '#64748B' }}>{idx + 1}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <span className="badge bg-light text-dark border" style={{ fontSize: '10.5px' }}>{row.branch || '—'}</span>
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      {row.teacherName ? (
                        <div className="fw-semibold">{row.teacherName}</div>
                      ) : (
                        <div className="text-sa-muted fst-italic" style={{ fontSize: '11px' }}>Unassigned</div>
                      )}
                      {row.subject && (
                        <span className="badge bg-primary-subtle text-primary border" style={{ fontSize: '10px' }}>{row.subject}</span>
                      )}
                    </td>
                    <td style={{ padding: '8px 12px', color: '#475569' }}>
                      {row.batch || '—'}
                    </td>
                    <td style={{ padding: '8px 12px', color: '#1E293B' }}>
                      {row.chapter || '—'}
                    </td>
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: '#0F172A' }}>
                      {row.topicTaught || '—'}
                    </td>
                    <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                      {row.durationDisplay || (row.totalPlannedPeriods ? `${row.totalPlannedPeriods} Periods` : (row.periods ? `${row.periods} Periods` : '—'))}
                    </td>
                    <td style={{ padding: '8px 12px', whiteSpace: 'nowrap', fontWeight: 500, color: '#8B1216' }}>
                      {row.targetDate || '—'}
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <span className="badge bg-success-subtle text-success border border-success-subtle" style={{ fontSize: '10px' }}>
                        {row.status || 'Active'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="d-flex justify-content-end align-items-center gap-2 pt-2 border-top">
            <button
              type="button"
              onClick={() => {
                setIsDailyImportModalOpen(false);
                setDailyParsedData([]);
              }}
              className="btn btn-sm btn-light border px-3 py-1.5 fw-medium"
              style={{ borderRadius: '6px', fontSize: '12px' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDailyImport}
              className="btn btn-sm text-white px-3.5 py-1.5 fw-semibold d-inline-flex align-items-center gap-1.5 shadow-xs"
              style={{ backgroundColor: '#168554', borderRadius: '6px', fontSize: '12px', border: 'none', cursor: 'pointer' }}
            >
              <Check size={14} />
              <span>Confirm & Route to Teachers ({dailyParsedData.length})</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 2: ADD / EDIT DAILY ACTIVITY MANUAL LOG */}
      {/* ========================================================= */}
      <Modal
        isOpen={isDailyModalOpen}
        onClose={() => {
          setIsDailyModalOpen(false);
          setEditingDailyId(null);
        }}
        title={editingDailyId ? "Edit Daily Activity Record" : "Log Faculty Classroom Activity"}
        size="lg"
      >
        <form onSubmit={handleSaveDailyForm} className="d-flex flex-column gap-3">
          <div className="row g-2.5">
            <div className="col-12 col-sm-6">
              <label className="form-label text-sa-muted small fw-semibold mb-1">Branch</label>
              <select
                className="form-select form-select-sm border shadow-xs"
                value={dailyForm.branch}
                disabled={!isSuperAdmin && Boolean(activeBranch)}
                onChange={(e) => {
                  const br = e.target.value;
                  setDailyForm(prev => ({
                    ...prev,
                    branch: br,
                    batch: br === 'Mangalwar Peth'
                      ? '12th pcm Mangalvar Peth'
                      : '12th pcm tarabai park'
                  }));
                }}
                style={{ height: '38px', borderRadius: '8px', fontSize: '12.5px' }}
              >
                <option value="Tarabai Park">Tarabai Park Branch</option>
                <option value="Mangalwar Peth">Mangalwar Peth Branch</option>
              </select>
            </div>

            <div className="col-12 col-sm-6">
              <label className="form-label text-sa-muted small fw-semibold mb-1">Subject</label>
              <select
                className="form-select form-select-sm border shadow-xs"
                value={dailyForm.subject}
                onChange={(e) => {
                  const s = e.target.value;
                  setDailyForm(prev => ({
                    ...prev,
                    subject: s,
                    teacherName: defaultFacultyBySubject[s] || prev.teacherName
                  }));
                }}
                style={{ height: '38px', borderRadius: '8px', fontSize: '12.5px' }}
              >
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Biology">Biology</option>
              </select>
            </div>
          </div>

          <div className="row g-2.5">
            <div className="col-12 col-sm-6">
              <label className="form-label text-sa-muted small fw-semibold mb-1">Assigned Teacher / Faculty</label>
              <select
                className="form-select form-select-sm border shadow-xs"
                value={dailyForm.teacherName}
                onChange={(e) => setDailyForm(prev => ({ ...prev, teacherName: e.target.value }))}
                style={{ height: '38px', borderRadius: '8px', fontSize: '12.5px' }}
              >
                {teachers.length > 0 ? (
                  teachers.map((t) => (
                    <option key={t.id} value={t.name}>{t.name} ({t.subject || (t.subjects && t.subjects[0]) || 'General'})</option>
                  ))
                ) : (
                  <>
                    <option value="veer 1">veer 1 (Mathematics)</option>
                    <option value="More A.D">More A.D (Physics)</option>
                    <option value="Shri">Shri (Biology)</option>
                    <option value="Swami ">Swami  (Physics)</option>
                  </>
                )}
              </select>
            </div>

            <div className="col-12 col-sm-6">
              <label className="form-label text-sa-muted small fw-semibold mb-1">Class / Batch</label>
              <select
                className="form-select form-select-sm border shadow-xs"
                value={dailyForm.batch}
                onChange={(e) => setDailyForm(prev => ({ ...prev, batch: e.target.value }))}
                style={{ height: '38px', borderRadius: '8px', fontSize: '12.5px' }}
              >
                <option value="11th pcm tarabai park">11th pcm tarabai park</option>
                <option value="11th pcb tarabai park">11th pcb tarabai park</option>
                <option value="11th pcmb tarabai park">11th pcmb tarabai park</option>
                <option value="12th pcm tarabai park">12th pcm tarabai park</option>
                <option value="12th pcb tarabai park">12th pcb tarabai park</option>
                <option value="12th pcmb tarabai park">12th pcmb tarabai park</option>
                <option value="11th pcm Mangalvar Peth">11th pcm Mangalvar Peth</option>
                <option value="11th pcb Mangalvar Peth">11th pcb Mangalvar Peth</option>
                <option value="11th pcmb Mangalvar Peth">11th pcmb Mangalvar Peth</option>
                <option value="12th pcm Mangalvar Peth">12th pcm Mangalvar Peth</option>
                <option value="12th pcb Mangalvar Peth">12th pcb Mangalvar Peth</option>
                <option value="12th pcmb Mangalvar Peth">12th pcmb Mangalvar Peth</option>
              </select>
            </div>
          </div>

          <div className="row g-2.5">
            <div className="col-12 col-sm-6">
              <label className="form-label text-sa-muted small fw-semibold mb-1">Chapter / Unit</label>
              <input
                type="text"
                placeholder="e.g. Chapter 7: Wave Optics"
                required
                className="form-control form-control-sm border shadow-xs"
                value={dailyForm.chapter}
                onChange={(e) => setDailyForm(prev => ({ ...prev, chapter: e.target.value }))}
                style={{ height: '38px', borderRadius: '8px', fontSize: '12.5px' }}
              />
            </div>

            <div className="col-12 col-sm-6">
              <label className="form-label text-sa-muted small fw-semibold mb-1">Date Covered / Activity Date <span className="text-danger">*</span></label>
              <input
                type="date"
                required
                className="form-control form-control-sm border shadow-xs"
                value={dailyForm.targetDate}
                onChange={(e) => setDailyForm(prev => ({ ...prev, targetDate: e.target.value }))}
                style={{ height: '38px', borderRadius: '8px', fontSize: '12.5px' }}
              />
            </div>
          </div>

          <div>
            <label className="form-label text-sa-muted small fw-semibold mb-1">
              Topic Taught / Syllabus Covered <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Wave Optics - Wavefronts & Huygens Principle"
              className="form-control form-control-sm border shadow-xs"
              value={dailyForm.topicTaught}
              onChange={(e) => setDailyForm(prev => ({ ...prev, topicTaught: e.target.value }))}
              style={{ height: '38px', borderRadius: '8px', fontSize: '12.5px' }}
            />
          </div>

          <div className="row g-2.5">
            <div className="col-12 col-sm-4">
              <label className="form-label text-sa-muted small fw-semibold mb-1">Time Slot</label>
              <input
                type="text"
                placeholder="03:00 PM - 04:00 PM"
                className="form-control form-control-sm border shadow-xs"
                value={dailyForm.timeSlot}
                onChange={(e) => setDailyForm(prev => ({ ...prev, timeSlot: e.target.value }))}
                style={{ height: '38px', borderRadius: '8px', fontSize: '12.5px' }}
              />
            </div>

            <div className="col-12 col-sm-4">
              <label className="form-label text-sa-muted small fw-semibold mb-1">Periods Taken</label>
              <input
                type="number"
                min="1"
                max="6"
                className="form-control form-control-sm border shadow-xs"
                value={dailyForm.periods}
                onChange={(e) => setDailyForm(prev => ({ ...prev, periods: e.target.value }))}
                style={{ height: '38px', borderRadius: '8px', fontSize: '12.5px' }}
              />
            </div>

            <div className="col-12 col-sm-4">
              <label className="form-label text-sa-muted small fw-semibold mb-1">Total Planned Periods</label>
              <input
                type="number"
                min="1"
                max="10"
                className="form-control form-control-sm border shadow-xs"
                value={dailyForm.totalPlannedPeriods}
                onChange={(e) => setDailyForm(prev => ({ ...prev, totalPlannedPeriods: e.target.value }))}
                style={{ height: '38px', borderRadius: '8px', fontSize: '12.5px' }}
              />
            </div>
          </div>

          <div className="row g-2.5">
            <div className="col-12 col-sm-6">
              <label className="form-label text-sa-muted small fw-semibold mb-1">Hours Spent Teaching</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="8"
                className="form-control form-control-sm border shadow-xs"
                value={dailyForm.hours}
                onChange={(e) => setDailyForm(prev => ({ ...prev, hours: e.target.value }))}
                style={{ height: '38px', borderRadius: '8px', fontSize: '12.5px' }}
              />
            </div>

            <div className="col-12 col-sm-6">
              <label className="form-label text-sa-muted small fw-semibold mb-1">Topic Status</label>
              <select
                className="form-select form-select-sm border shadow-xs"
                value={dailyForm.status}
                onChange={(e) => setDailyForm(prev => ({ ...prev, status: e.target.value }))}
                style={{ height: '38px', borderRadius: '8px', fontSize: '12.5px' }}
              >
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="form-label text-sa-muted small fw-semibold mb-1">Remarks & Learning Outcomes</label>
            <textarea
              rows={2}
              placeholder="e.g. Derived Snell's law. Solved 4 numerical problems on board."
              className="form-control form-control-sm border shadow-xs"
              value={dailyForm.remarks}
              onChange={(e) => setDailyForm(prev => ({ ...prev, remarks: e.target.value }))}
              style={{ borderRadius: '8px', fontSize: '12.5px' }}
            />
          </div>

          <div className="d-flex justify-content-end align-items-center gap-2 pt-2 border-top">
            <button
              type="button"
              onClick={() => {
                setIsDailyModalOpen(false);
                setEditingDailyId(null);
              }}
              className="btn btn-sm btn-light border px-3 py-1.5 fw-medium"
              style={{ borderRadius: '6px', fontSize: '12px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-sm text-white px-3.5 py-1.5 fw-semibold d-inline-flex align-items-center gap-1.5 shadow-xs"
              style={{ backgroundColor: '#8B1216', borderRadius: '6px', fontSize: '12.5px', border: 'none', cursor: 'pointer' }}
            >
              <Check size={14} />
              <span>{editingDailyId ? "Update Activity" : "Save Activity"}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 3: EXCEL MASTER TIMETABLE IMPORT PREVIEW */}
      {/* ========================================================= */}
      <Modal
        isOpen={isTimetableImportModalOpen}
        onClose={() => {
          setIsTimetableImportModalOpen(false);
          setTimetableParsedData([]);
        }}
        title={`Import Weekly Timetable (${timetableParsedData.length} Slots Found)`}
        size="lg"
      >
        <div className="d-flex flex-column gap-3">
          <div className="p-3 rounded-3 border bg-light d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div>
              <div className="fw-semibold text-sa-charcoal" style={{ fontSize: '13.5px' }}>
                Excel Timetable File Parsed Successfully
              </div>
              <div className="text-sa-muted small">
                These lecture slots will immediately synchronize into the MongoDB batch timetable and reflect directly in each subject teacher's My Classes Weekly Timetable.
              </div>
            </div>
            <span className="badge rounded-pill bg-success text-white px-2.5 py-1" style={{ fontSize: '11px' }}>
              ✓ Ready to Sync
            </span>
          </div>

          <div className="table-responsive border rounded-3" style={{ maxHeight: '320px', overflowY: 'auto' }}>
            <table className="table table-sm table-hover align-middle m-0" style={{ fontSize: '12px' }}>
              <thead className="table-light sticky-top">
                <tr>
                  <th style={{ padding: '8px 12px' }}>#</th>
                  <th style={{ padding: '8px 12px' }}>Day</th>
                  <th style={{ padding: '8px 12px' }}>Time Slot</th>
                  <th style={{ padding: '8px 12px' }}>Branch</th>
                  <th style={{ padding: '8px 12px' }}>Class / Batch</th>
                  <th style={{ padding: '8px 12px' }}>Subject</th>
                  <th style={{ padding: '8px 12px' }}>Assigned Faculty</th>
                  <th style={{ padding: '8px 12px' }}>Room</th>
                </tr>
              </thead>
              <tbody>
                {timetableParsedData.map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: '8px 12px', color: '#64748B' }}>{idx + 1}</td>
                    <td style={{ padding: '8px 12px', fontWeight: 600 }}>{row.day}</td>
                    <td style={{ padding: '8px 12px', color: '#0F172A', fontWeight: 500 }}>{row.time}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <span className="badge bg-light text-dark border" style={{ fontSize: '10.5px' }}>{row.branch}</span>
                    </td>
                    <td style={{ padding: '8px 12px', color: '#475569' }}>{row.batch}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <span
                        className="badge border"
                        style={{
                          backgroundColor: getSubjectColor(row.subject).bg,
                          color: getSubjectColor(row.subject).text,
                          borderColor: getSubjectColor(row.subject).border,
                          fontSize: '10.5px'
                        }}
                      >
                        {row.subject}
                      </span>
                    </td>
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: '#8B1216' }}>{row.teacher_name}</td>
                    <td style={{ padding: '8px 12px', color: '#64748B' }}>{row.room}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="d-flex justify-content-end align-items-center gap-2 pt-2 border-top">
            <button
              type="button"
              onClick={() => {
                setIsTimetableImportModalOpen(false);
                setTimetableParsedData([]);
              }}
              className="btn btn-sm btn-light border px-3 py-1.5 fw-medium"
              style={{ borderRadius: '6px', fontSize: '12px' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmTimetableImport}
              disabled={loading}
              className="btn btn-sm text-white px-3.5 py-1.5 fw-semibold d-inline-flex align-items-center gap-1.5 shadow-xs"
              style={{ backgroundColor: '#8B1216', borderRadius: '6px', fontSize: '12.5px', border: 'none', cursor: 'pointer' }}
            >
              <Check size={14} />
              <span>Confirm & Sync to Teacher Portals ({timetableParsedData.length})</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 4: ADD / EDIT TIMETABLE SLOT */}
      {/* ========================================================= */}
      <Modal
        isOpen={isTimetableModalOpen}
        onClose={() => {
          setIsTimetableModalOpen(false);
          setEditingTimetableSlot(null);
        }}
        title={editingTimetableSlot ? "Edit Weekly Timetable Slot" : "Add Weekly Timetable Slot"}
        size="md"
      >
        <form onSubmit={handleSaveTimetableSlot} className="d-flex flex-column gap-3">
          <div className="p-2.5 rounded-3 border bg-light d-flex align-items-center gap-2">
            <Sparkles size={16} className="text-sa-maroon flex-shrink-0" />
            <span style={{ fontSize: '12px', color: '#475569' }}>
              Saving this record synchronizes instantly into <strong>{timetableForm.teacherName || defaultFacultyBySubject[timetableForm.subject] || 'the teacher'}'s My Classes</strong> weekly timetable.
            </span>
          </div>

          <div className="row g-2.5">
            <div className="col-12 col-sm-6">
              <label className="form-label text-sa-muted small fw-semibold mb-1">Day of Week *</label>
              <select
                className="form-select form-select-sm border shadow-xs"
                value={timetableForm.day}
                onChange={(e) => setTimetableForm(prev => ({ ...prev, day: e.target.value }))}
                style={{ height: '38px', borderRadius: '8px', fontSize: '12.5px' }}
                required
              >
                {timetableWeekDays.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="col-12 col-sm-6">
              <label className="form-label text-sa-muted small fw-semibold mb-1">Time Slot *</label>
              <select
                className="form-select form-select-sm border shadow-xs"
                value={timetableForm.timeSlot}
                onChange={(e) => setTimetableForm(prev => ({ ...prev, timeSlot: e.target.value }))}
                style={{ height: '38px', borderRadius: '8px', fontSize: '12.5px' }}
                required
              >
                <option value="08:30 AM – 10:00 AM">08:30 AM – 10:00 AM</option>
                <option value="09:00 AM – 10:00 AM">09:00 AM – 10:00 AM</option>
                <option value="10:00 AM – 11:00 AM">10:00 AM – 11:00 AM</option>
                <option value="11:00 AM – 12:00 PM">11:00 AM – 12:00 PM</option>
                <option value="11:30 AM – 12:30 PM">11:30 AM – 12:30 PM</option>
                <option value="12:00 PM – 01:00 PM">12:00 PM – 01:00 PM</option>
                <option value="01:30 PM – 03:00 PM">01:30 PM – 03:00 PM</option>
                <option value="03:00 PM – 04:00 PM">03:00 PM – 04:00 PM</option>
              </select>
            </div>
          </div>

          <div className="row g-2.5">
            <div className="col-12 col-sm-6">
              <label className="form-label text-sa-muted small fw-semibold mb-1">Subject *</label>
              <select
                className="form-select form-select-sm border shadow-xs"
                value={timetableForm.subject}
                onChange={(e) => {
                  const sub = e.target.value;
                  const autoTeacher = defaultFacultyBySubject[sub] || timetableForm.teacherName;
                  setTimetableForm(prev => ({ ...prev, subject: sub, teacherName: autoTeacher }));
                }}
                style={{ height: '38px', borderRadius: '8px', fontSize: '12.5px' }}
                required
              >
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Biology">Biology</option>
              </select>
            </div>

            <div className="col-12 col-sm-6">
              <label className="form-label text-sa-muted small fw-semibold mb-1">Assigned Faculty *</label>
              <select
                className="form-select form-select-sm border shadow-xs"
                value={timetableForm.teacherName}
                onChange={(e) => setTimetableForm(prev => ({ ...prev, teacherName: e.target.value }))}
                style={{ height: '38px', borderRadius: '8px', fontSize: '12.5px' }}
                required
              >
                {teachers.length > 0 ? (
                  teachers.map(t => (
                    <option key={t.id || t.name} value={t.name}>{t.name} ({t.subject || 'Faculty'})</option>
                  ))
                ) : (
                  <>
                    <option value="More A.D">More A.D (Physics)</option>
                    <option value="veer 1">veer 1 (Mathematics)</option>
                    <option value="Shri">Shri (Biology)</option>
                    <option value="Swami ">Swami  (Physics)</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <div className="row g-2.5">
            <div className="col-12 col-sm-6">
              <label className="form-label text-sa-muted small fw-semibold mb-1">Branch *</label>
              <select
                className="form-select form-select-sm border shadow-xs"
                value={timetableForm.branch}
                disabled={!isSuperAdmin && Boolean(activeBranch)}
                onChange={(e) => {
                  const b = e.target.value;
                  const defaultBatch = b === 'Mangalwar Peth'
                    ? '12th pcm Mangalvar Peth'
                    : '12th pcm tarabai park';
                  setTimetableForm(prev => ({ ...prev, branch: b, batch: defaultBatch }));
                }}
                style={{ height: '38px', borderRadius: '8px', fontSize: '12.5px' }}
                required
              >
                <option value="Tarabai Park">Tarabai Park</option>
                <option value="Mangalwar Peth">Mangalwar Peth</option>
              </select>
            </div>

            <div className="col-12 col-sm-6">
              <label className="form-label text-sa-muted small fw-semibold mb-1">Class / Batch *</label>
              <select
                className="form-select form-select-sm border shadow-xs"
                value={timetableForm.batch}
                onChange={(e) => {
                  const val = e.target.value;
                  const code = val.includes('12') ? '12-A' : '11-A';
                  setTimetableForm(prev => ({ ...prev, batch: val, classCode: code }));
                }}
                style={{ height: '38px', borderRadius: '8px', fontSize: '12.5px' }}
                required
              >
                {batches.length > 0 ? (
                  batches.map(b => (
                    <option key={b.id || b.name} value={b.name}>{b.name}</option>
                  ))
                ) : (
                  <>
                    <option value="11th pcm tarabai park">11th pcm tarabai park</option>
                    <option value="11th pcb tarabai park">11th pcb tarabai park</option>
                    <option value="11th pcmb tarabai park">11th pcmb tarabai park</option>
                    <option value="12th pcm tarabai park">12th pcm tarabai park</option>
                    <option value="12th pcb tarabai park">12th pcb tarabai park</option>
                    <option value="12th pcmb tarabai park">12th pcmb tarabai park</option>
                    <option value="11th pcm Mangalvar Peth">11th pcm Mangalvar Peth</option>
                    <option value="11th pcb Mangalvar Peth">11th pcb Mangalvar Peth</option>
                    <option value="11th pcmb Mangalvar Peth">11th pcmb Mangalvar Peth</option>
                    <option value="12th pcm Mangalvar Peth">12th pcm Mangalvar Peth</option>
                    <option value="12th pcb Mangalvar Peth">12th pcb Mangalvar Peth</option>
                    <option value="12th pcmb Mangalvar Peth">12th pcmb Mangalvar Peth</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <div className="row g-2.5">
            <div className="col-12 col-sm-6">
              <label className="form-label text-sa-muted small fw-semibold mb-1">Room / Lab *</label>
              <input
                type="text"
                placeholder="e.g. Room 201, Room 202, Physics Lab"
                className="form-control form-control-sm border shadow-xs"
                value={timetableForm.room}
                onChange={(e) => setTimetableForm(prev => ({ ...prev, room: e.target.value }))}
                style={{ height: '38px', borderRadius: '8px', fontSize: '12.5px' }}
                required
              />
            </div>

            <div className="col-12 col-sm-6">
              <label className="form-label text-sa-muted small fw-semibold mb-1">Class Code</label>
              <input
                type="text"
                placeholder="e.g. 12-A, 12-B, 11-A"
                className="form-control form-control-sm border shadow-xs"
                value={timetableForm.classCode}
                onChange={(e) => setTimetableForm(prev => ({ ...prev, classCode: e.target.value }))}
                style={{ height: '38px', borderRadius: '8px', fontSize: '12.5px' }}
              />
            </div>
          </div>

          <div className="d-flex justify-content-end align-items-center gap-2 pt-2 border-top">
            <button
              type="button"
              onClick={() => {
                setIsTimetableModalOpen(false);
                setEditingTimetableSlot(null);
              }}
              className="btn btn-sm btn-light border px-3 py-1.5 fw-medium"
              style={{ borderRadius: '6px', fontSize: '12px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-sm text-white px-3.5 py-1.5 fw-semibold d-inline-flex align-items-center gap-1.5 shadow-xs"
              style={{ backgroundColor: '#8B1216', borderRadius: '6px', fontSize: '12.5px', border: 'none', cursor: 'pointer' }}
            >
              <Check size={14} />
              <span>{editingTimetableSlot ? "Update & Sync Slot" : "Save & Sync to Teacher's My Classes"}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 4: ADD / EDIT SYLLABUS CHAPTER PLAN */}
      {/* ========================================================= */}
      <Modal
        isOpen={isChapterModalOpen}
        onClose={() => {
          setIsChapterModalOpen(false);
          setEditingChapterId(null);
        }}
        title={editingChapterId ? "Edit Syllabus Chapter" : "Add Chapter Lecture Allocation"}
      >
        <form onSubmit={handleSaveChapterForm} className="d-flex flex-column gap-3">
          <div className="row g-2.5">
            <div className="col-12 col-sm-6">
              <label className="form-label text-sa-muted small fw-semibold mb-1">Subject</label>
              <select
                className="form-select form-select-sm border shadow-xs"
                value={chapterForm.subject}
                onChange={(e) => setChapterForm(prev => ({ ...prev, subject: e.target.value }))}
                style={{ height: '38px', borderRadius: '8px', fontSize: '12.5px' }}
              >
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Biology">Biology</option>
              </select>
            </div>

            <div className="col-12 col-sm-6">
              <label className="form-label text-sa-muted small fw-semibold mb-1">Sr. No</label>
              <input
                type="number"
                min="1"
                required
                className="form-control form-control-sm border shadow-xs"
                value={chapterForm.sr_no}
                onChange={(e) => setChapterForm(prev => ({ ...prev, sr_no: e.target.value }))}
                style={{ height: '38px', borderRadius: '8px', fontSize: '12.5px' }}
              />
            </div>
          </div>

          <div>
            <label className="form-label text-sa-muted small fw-semibold mb-1">
              Chapter Title / Module <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Rotational Dynamics"
              className="form-control form-control-sm border shadow-xs"
              value={chapterForm.title}
              onChange={(e) => setChapterForm(prev => ({ ...prev, title: e.target.value }))}
              style={{ height: '38px', borderRadius: '8px', fontSize: '12.5px' }}
            />
          </div>

          <div className="row g-2.5">
            <div className="col-12 col-sm-6">
              <label className="form-label text-sa-muted small fw-semibold mb-1">
                Boards Lectures (mp/tp) <span className="text-danger">*</span>
              </label>
              <input
                type="number"
                min="0"
                required
                className="form-control form-control-sm border shadow-xs"
                value={chapterForm.boards_lectures}
                onChange={(e) => setChapterForm(prev => ({ ...prev, boards_lectures: e.target.value }))}
                style={{ height: '38px', borderRadius: '8px', fontSize: '12.5px' }}
              />
            </div>

            <div className="col-12 col-sm-6">
              <label className="form-label text-sa-muted small fw-semibold mb-1">
                Entrance Lectures (CET / JEE / NEET) <span className="text-danger">*</span>
              </label>
              <input
                type="number"
                min="0"
                required
                className="form-control form-control-sm border shadow-xs"
                value={chapterForm.entrance_lectures}
                onChange={(e) => setChapterForm(prev => ({ ...prev, entrance_lectures: e.target.value }))}
                style={{ height: '38px', borderRadius: '8px', fontSize: '12.5px' }}
              />
            </div>
          </div>

          <div className="row g-2.5">
            <div className="col-12 col-sm-6">
              <label className="form-label text-sa-muted small fw-semibold mb-1">Standard</label>
              <input
                type="text"
                className="form-control form-control-sm border shadow-xs"
                value={chapterForm.standard}
                onChange={(e) => setChapterForm(prev => ({ ...prev, standard: e.target.value }))}
                style={{ height: '38px', borderRadius: '8px', fontSize: '12.5px' }}
              />
            </div>

            <div className="col-12 col-sm-6">
              <label className="form-label text-sa-muted small fw-semibold mb-1">Academic Year</label>
              <input
                type="text"
                className="form-control form-control-sm border shadow-xs"
                value={chapterForm.academic_year}
                onChange={(e) => setChapterForm(prev => ({ ...prev, academic_year: e.target.value }))}
                style={{ height: '38px', borderRadius: '8px', fontSize: '12.5px' }}
              />
            </div>
          </div>

          <div className="p-2.5 rounded-3 border bg-light d-flex align-items-center justify-content-between">
            <span className="small text-sa-muted">Calculated Total Lectures:</span>
            <span className="fw-bold text-sa-charcoal" style={{ fontSize: '14px' }}>
              {(parseInt(chapterForm.boards_lectures, 10) || 0) + (parseInt(chapterForm.entrance_lectures, 10) || 0)} lectures
            </span>
          </div>

          <div className="d-flex justify-content-end align-items-center gap-2 pt-2 border-top">
            <button
              type="button"
              onClick={() => {
                setIsChapterModalOpen(false);
                setEditingChapterId(null);
              }}
              className="btn btn-sm btn-light border px-3 py-1.5 fw-medium"
              style={{ borderRadius: '6px', fontSize: '12px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-sm text-white px-3.5 py-1.5 fw-semibold d-inline-flex align-items-center gap-1.5 shadow-xs"
              style={{ backgroundColor: '#8B1216', borderRadius: '6px', fontSize: '12.5px', border: 'none', cursor: 'pointer' }}
            >
              <Check size={14} />
              <span>{editingChapterId ? "Update Chapter Plan" : "Add to Syllabus Plan"}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
