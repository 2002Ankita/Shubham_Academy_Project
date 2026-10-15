import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Calendar,
  Clock,
  CheckCircle2,
  Download,
  Search,
  BookOpen,
  Layers,
  FileSpreadsheet,
  User,
  GraduationCap,
  Filter,
  Check,
  ChevronRight,
  RotateCcw,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import curriculumService from '../../services/curriculumService';

export default function AdminTopicDurationReport() {
  const STORAGE_TOPICS_KEY = 'sa_teacher_topic_plans';
  const STORAGE_ACTIVITIES_KEY = 'sa_teacher_daily_activities';

  // Master Topics Database across all subjects, teachers, and batches
  const masterTopics = [
    // 1. PHYSICS - Prof. Shubham Shinde - 12th Science Tarabai Park (Batch A)
    {
      id: 'TOP-PHY-01',
      standard: 'Class 12th',
      batch: '12th Science Tarabai Park (Batch A)',
      subject: 'Physics',
      teacher: 'Prof. Shubham Shinde',
      chapter: 'Chapter 7: Wave Optics',
      topicName: 'Wavefronts & Huygens Principle Derivation',
      startDate: '2026-06-15',
      endDate: '2026-07-02',
      requiredPeriods: 3,
      periodDurationMins: 45,
      completedPeriods: 3,
      status: 'Completed',
      academicYear: '2026-2027',
      month: 'June 2026',
      remarks: 'Derived reflection and refraction laws. Solved slit interference numericals.'
    },
    {
      id: 'TOP-PHY-02',
      standard: 'Class 12th',
      batch: '12th Science Tarabai Park (Batch A)',
      subject: 'Physics',
      teacher: 'Prof. Shubham Shinde',
      chapter: 'Chapter 9: Electromagnetic Induction',
      topicName: 'Lenz\'s Law, Self-Inductance & Mutual Inductance',
      startDate: '2026-07-20',
      endDate: '2026-08-14',
      requiredPeriods: 4,
      periodDurationMins: 45,
      completedPeriods: 3,
      status: 'In Progress',
      academicYear: '2026-2027',
      month: 'August 2026',
      remarks: 'Faraday laws completed. Mutual inductance numerical session pending.'
    },
    {
      id: 'TOP-PHY-03',
      standard: 'Class 12th',
      batch: '12th Science Tarabai Park (Batch A)',
      subject: 'Physics',
      teacher: 'Prof. Shubham Shinde',
      chapter: 'Chapter 12: Atoms & Nuclei',
      topicName: 'Bohr Model, Hydrogen Spectrum & Energy Levels',
      startDate: '2026-09-08',
      endDate: '2026-09-29',
      requiredPeriods: 4,
      periodDurationMins: 45,
      completedPeriods: 4,
      status: 'Completed',
      academicYear: '2026-2027',
      month: 'September 2026',
      remarks: 'Spectral series (Lyman, Balmer, Paschen) and Rydberg formula covered.'
    },
    {
      id: 'TOP-PHY-04',
      standard: 'Class 12th',
      batch: '12th Science Tarabai Park (Batch A)',
      subject: 'Physics',
      teacher: 'Prof. Shubham Shinde',
      chapter: 'Chapter 14: Semiconductor Electronics',
      topicName: 'P-N Junction Diodes, Rectifiers & Zener Breakdown',
      startDate: '2026-10-01',
      endDate: '2026-10-26',
      requiredPeriods: 5,
      periodDurationMins: 45,
      completedPeriods: 2,
      status: 'In Progress',
      academicYear: '2026-2027',
      month: 'October 2026',
      remarks: 'Forward/reverse I-V characteristics taught. Full wave rectifier pending.'
    },
    {
      id: 'TOP-PHY-05',
      standard: 'Class 12th',
      batch: '12th Science Tarabai Park (Batch A)',
      subject: 'Physics',
      teacher: 'Prof. Shubham Shinde',
      chapter: 'Chapter 15: Ray Optics & Instruments',
      topicName: 'Compound Microscope & Astronomical Telescope Magnification',
      startDate: '2026-11-05',
      endDate: '2026-11-30',
      requiredPeriods: 4,
      periodDurationMins: 45,
      completedPeriods: 0,
      status: 'Upcoming',
      academicYear: '2026-2027',
      month: 'November 2026',
      remarks: 'Scheduled for Term 2 practical theory sessions.'
    },

    // 2. PHYSICS - Prof. Shubham Shinde - 12th Science PCB (Batch C)
    {
      id: 'TOP-PHY-06',
      standard: 'Class 12th',
      batch: '12th Science PCB (Batch C)',
      subject: 'Physics',
      teacher: 'Prof. Shubham Shinde',
      chapter: 'Chapter 11: Dual Nature of Radiation',
      topicName: 'Photoelectric Effect & Einstein\'s Equation',
      startDate: '2026-08-18',
      endDate: '2026-09-05',
      requiredPeriods: 3,
      periodDurationMins: 45,
      completedPeriods: 3,
      status: 'Completed',
      academicYear: '2026-2027',
      month: 'August 2026',
      remarks: 'Cut-off frequency graphs and experimental setups verified.'
    },
    {
      id: 'TOP-PHY-07',
      standard: 'Class 12th',
      batch: '12th Science PCB (Batch C)',
      subject: 'Physics',
      teacher: 'Prof. Shubham Shinde',
      chapter: 'Chapter 7: Wave Optics',
      topicName: 'Young\'s Double Slit Experiment & Fringe Width',
      startDate: '2026-09-10',
      endDate: '2026-09-28',
      requiredPeriods: 4,
      periodDurationMins: 45,
      completedPeriods: 4,
      status: 'Completed',
      academicYear: '2026-2027',
      month: 'September 2026',
      remarks: 'Fringe width derivation and interference intensity graph completed.'
    },
    {
      id: 'TOP-PHY-08',
      standard: 'Class 12th',
      batch: '12th Science PCB (Batch C)',
      subject: 'Physics',
      teacher: 'Prof. Shubham Shinde',
      chapter: 'Chapter 14: Semiconductor Electronics',
      topicName: 'Solar Cell, Photodiode & LED Working Principles',
      startDate: '2026-10-05',
      endDate: '2026-10-25',
      requiredPeriods: 3,
      periodDurationMins: 45,
      completedPeriods: 1,
      status: 'In Progress',
      academicYear: '2026-2027',
      month: 'October 2026',
      remarks: 'Photodiode characteristics covered. Solar cell pending.'
    },

    // 3. CHEMISTRY - Prof. Sunita Patil - 12th Science Tarabai Park (Batch A)
    {
      id: 'TOP-CHM-01',
      standard: 'Class 12th',
      batch: '12th Science Tarabai Park (Batch A)',
      subject: 'Chemistry',
      teacher: 'Prof. Sunita Patil',
      chapter: 'Chapter 3: Chemical Kinetics',
      topicName: 'Integrated Rate Law & Arrhenius Equation',
      startDate: '2026-07-10',
      endDate: '2026-07-28',
      requiredPeriods: 4,
      periodDurationMins: 45,
      completedPeriods: 4,
      status: 'Completed',
      academicYear: '2026-2027',
      month: 'July 2026',
      remarks: 'Zero and first order rate constants and half-life derivations completed.'
    },
    {
      id: 'TOP-CHM-02',
      standard: 'Class 12th',
      batch: '12th Science Tarabai Park (Batch A)',
      subject: 'Chemistry',
      teacher: 'Prof. Sunita Patil',
      chapter: 'Chapter 2: Solutions',
      topicName: 'Raoult\'s Law, Colligative Properties & Van\'t Hoff Factor',
      startDate: '2026-08-02',
      endDate: '2026-08-24',
      requiredPeriods: 5,
      periodDurationMins: 45,
      completedPeriods: 5,
      status: 'Completed',
      academicYear: '2026-2027',
      month: 'August 2026',
      remarks: 'Osmotic pressure and elevation in boiling point problems solved.'
    },
    {
      id: 'TOP-CHM-03',
      standard: 'Class 12th',
      batch: '12th Science Tarabai Park (Batch A)',
      subject: 'Chemistry',
      teacher: 'Prof. Sunita Patil',
      chapter: 'Chapter 8: d- and f-Block Elements',
      topicName: 'Transition Elements Electronic Configuration & Oxidation States',
      startDate: '2026-09-02',
      endDate: '2026-09-22',
      requiredPeriods: 4,
      periodDurationMins: 45,
      completedPeriods: 4,
      status: 'Completed',
      academicYear: '2026-2027',
      month: 'September 2026',
      remarks: 'Catalytic properties, color formation, and Lanthanoid contraction covered.'
    },
    {
      id: 'TOP-CHM-04',
      standard: 'Class 12th',
      batch: '12th Science Tarabai Park (Batch A)',
      subject: 'Chemistry',
      teacher: 'Prof. Sunita Patil',
      chapter: 'Chapter 9: Coordination Compounds',
      topicName: 'IUPAC Nomenclature, Werner\'s Theory & Crystal Field Splitting',
      startDate: '2026-10-04',
      endDate: '2026-10-28',
      requiredPeriods: 5,
      periodDurationMins: 45,
      completedPeriods: 2,
      status: 'In Progress',
      academicYear: '2026-2027',
      month: 'October 2026',
      remarks: 'Octahedral and tetrahedral CFT splitting diagrams introduced.'
    },
    {
      id: 'TOP-CHM-05',
      standard: 'Class 12th',
      batch: '12th Science Tarabai Park (Batch A)',
      subject: 'Chemistry',
      teacher: 'Prof. Sunita Patil',
      chapter: 'Chapter 10: Haloalkanes & Haloarenes',
      topicName: 'SN1 and SN2 Reaction Mechanisms & Optical Activity',
      startDate: '2026-11-02',
      endDate: '2026-11-26',
      requiredPeriods: 5,
      periodDurationMins: 45,
      completedPeriods: 0,
      status: 'Upcoming',
      academicYear: '2026-2027',
      month: 'November 2026',
      remarks: 'Planned for Term 2 organic chemistry module.'
    },

    // 4. MATHEMATICS - Prof. Rajesh Sharma - 12th Science Tarabai Park (Batch A)
    {
      id: 'TOP-MTH-01',
      standard: 'Class 12th',
      batch: '12th Science Tarabai Park (Batch A)',
      subject: 'Mathematics',
      teacher: 'Prof. Rajesh Sharma',
      chapter: 'Chapter 5: Continuity & Differentiability',
      topicName: 'Chain Rule, Implicit Functions & Logarithmic Differentiation',
      startDate: '2026-07-15',
      endDate: '2026-08-08',
      requiredPeriods: 6,
      periodDurationMins: 45,
      completedPeriods: 6,
      status: 'Completed',
      academicYear: '2026-2027',
      month: 'August 2026',
      remarks: 'Solved 25 Board and JEE numerical problems.'
    },
    {
      id: 'TOP-MTH-02',
      standard: 'Class 12th',
      batch: '12th Science Tarabai Park (Batch A)',
      subject: 'Mathematics',
      teacher: 'Prof. Rajesh Sharma',
      chapter: 'Chapter 6: Application of Derivatives',
      topicName: 'Maxima & Minima, Increasing & Decreasing Functions',
      startDate: '2026-08-14',
      endDate: '2026-09-06',
      requiredPeriods: 5,
      periodDurationMins: 45,
      completedPeriods: 5,
      status: 'Completed',
      academicYear: '2026-2027',
      month: 'August 2026',
      remarks: 'First and second derivative tests with geometric applications.'
    },
    {
      id: 'TOP-MTH-03',
      standard: 'Class 12th',
      batch: '12th Science Tarabai Park (Batch A)',
      subject: 'Mathematics',
      teacher: 'Prof. Rajesh Sharma',
      chapter: 'Chapter 7: Integrals',
      topicName: 'Definite Integrals & Properties of Definite Integrals',
      startDate: '2026-09-12',
      endDate: '2026-10-06',
      requiredPeriods: 6,
      periodDurationMins: 45,
      completedPeriods: 6,
      status: 'Completed',
      academicYear: '2026-2027',
      month: 'September 2026',
      remarks: 'Mastered properties P0 to P7 with 30 practice problems.'
    },
    {
      id: 'TOP-MTH-04',
      standard: 'Class 12th',
      batch: '12th Science Tarabai Park (Batch A)',
      subject: 'Mathematics',
      teacher: 'Prof. Rajesh Sharma',
      chapter: 'Chapter 9: Differential Equations',
      topicName: 'Variable Separable Method & Homogeneous Equations',
      startDate: '2026-10-10',
      endDate: '2026-10-31',
      requiredPeriods: 5,
      periodDurationMins: 45,
      completedPeriods: 3,
      status: 'In Progress',
      academicYear: '2026-2027',
      month: 'October 2026',
      remarks: 'Linear differential equations integrating factor session in progress.'
    },
    {
      id: 'TOP-MTH-05',
      standard: 'Class 12th',
      batch: '12th Science Tarabai Park (Batch A)',
      subject: 'Mathematics',
      teacher: 'Prof. Rajesh Sharma',
      chapter: 'Chapter 10: Vector Algebra',
      topicName: 'Scalar and Vector Products, Direction Cosines',
      startDate: '2026-11-04',
      endDate: '2026-11-28',
      requiredPeriods: 5,
      periodDurationMins: 45,
      completedPeriods: 0,
      status: 'Upcoming',
      academicYear: '2026-2027',
      month: 'November 2026',
      remarks: 'Scheduled for Term 2 vectors and 3D geometry.'
    },

    // 5. BIOLOGY - Prof. Amit Sawant - 12th Science PCB (Batch C)
    {
      id: 'TOP-BIO-01',
      standard: 'Class 12th',
      batch: '12th Science PCB (Batch C)',
      subject: 'Biology',
      teacher: 'Prof. Amit Sawant',
      chapter: 'Chapter 2: Flowering Plants Reproduction',
      topicName: 'Microsporogenesis & Megasporogenesis Mechanism',
      startDate: '2026-07-08',
      endDate: '2026-07-26',
      requiredPeriods: 4,
      periodDurationMins: 45,
      completedPeriods: 4,
      status: 'Completed',
      academicYear: '2026-2027',
      month: 'July 2026',
      remarks: 'Pollen grain development and embryo sac diagrams thoroughly covered.'
    },
    {
      id: 'TOP-BIO-02',
      standard: 'Class 12th',
      batch: '12th Science PCB (Batch C)',
      subject: 'Biology',
      teacher: 'Prof. Amit Sawant',
      chapter: 'Chapter 5: Principles of Inheritance',
      topicName: 'Mendelian Monohybrid & Dihybrid Cross, Incomplete Dominance',
      startDate: '2026-08-16',
      endDate: '2026-09-10',
      requiredPeriods: 5,
      periodDurationMins: 45,
      completedPeriods: 5,
      status: 'Completed',
      academicYear: '2026-2027',
      month: 'August 2026',
      remarks: 'Punnett squares and test cross numericals completed.'
    },
    {
      id: 'TOP-BIO-03',
      standard: 'Class 12th',
      batch: '12th Science PCB (Batch C)',
      subject: 'Biology',
      teacher: 'Prof. Amit Sawant',
      chapter: 'Chapter 6: Molecular Basis of Inheritance',
      topicName: 'DNA Replication Fork & Transcription in Prokaryotes',
      startDate: '2026-09-14',
      endDate: '2026-10-06',
      requiredPeriods: 5,
      periodDurationMins: 45,
      completedPeriods: 4,
      status: 'In Progress',
      academicYear: '2026-2027',
      month: 'September 2026',
      remarks: 'Okazaki fragments covered. Translation mechanism in progress.'
    },
    {
      id: 'TOP-BIO-04',
      standard: 'Class 12th',
      batch: '12th Science PCB (Batch C)',
      subject: 'Biology',
      teacher: 'Prof. Amit Sawant',
      chapter: 'Chapter 11: Biotechnology: Principles',
      topicName: 'Recombinant DNA Technology, Restriction Enzymes & Vectors',
      startDate: '2026-10-12',
      endDate: '2026-11-04',
      requiredPeriods: 4,
      periodDurationMins: 45,
      completedPeriods: 1,
      status: 'In Progress',
      academicYear: '2026-2027',
      month: 'October 2026',
      remarks: 'Gel electrophoresis and PCR cycle introduced.'
    },
    {
      id: 'TOP-BIO-05',
      standard: 'Class 12th',
      batch: '12th Science PCB (Batch C)',
      subject: 'Biology',
      teacher: 'Prof. Amit Sawant',
      chapter: 'Chapter 13: Organisms & Populations',
      topicName: 'Population Attributes, Growth Curves & Adaptations',
      startDate: '2026-11-05',
      endDate: '2026-11-28',
      requiredPeriods: 4,
      periodDurationMins: 45,
      completedPeriods: 0,
      status: 'Upcoming',
      academicYear: '2026-2027',
      month: 'November 2026',
      remarks: 'Term 2 ecology module scheduled.'
    },

    // 6. CHEMISTRY - Prof. Sunita Patil - 11th Science PCM (Batch B)
    {
      id: 'TOP-CHM-06',
      standard: 'Class 11th',
      batch: '11th Science PCM (Batch B)',
      subject: 'Chemistry',
      teacher: 'Prof. Sunita Patil',
      chapter: 'Chapter 4: Chemical Bonding',
      topicName: 'VSEPR Theory & Hybridization (sp, sp2, sp3)',
      startDate: '2026-08-01',
      endDate: '2026-08-22',
      requiredPeriods: 5,
      periodDurationMins: 45,
      completedPeriods: 5,
      status: 'Completed',
      academicYear: '2026-2027',
      month: 'August 2026',
      remarks: 'Molecular geometry, bond angles, and resonance structures demonstrated.'
    },

    // 7. MATHEMATICS - Prof. Rajesh Sharma - 11th Science PCM (Batch B)
    {
      id: 'TOP-MTH-06',
      standard: 'Class 11th',
      batch: '11th Science PCM (Batch B)',
      subject: 'Mathematics',
      teacher: 'Prof. Rajesh Sharma',
      chapter: 'Chapter 3: Trigonometric Functions',
      topicName: 'Trigonometric Identities & General Solutions',
      startDate: '2026-09-15',
      endDate: '2026-10-06',
      requiredPeriods: 5,
      periodDurationMins: 45,
      completedPeriods: 5,
      status: 'Completed',
      academicYear: '2026-2027',
      month: 'September 2026',
      remarks: 'Standard transformation formulae and equation solving completed.'
    }
  ];

  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Helper to merge topics from master, localStorage, and backend
  const mergeTopics = (baseMaster, localList, backendList) => {
    const map = new Map();

    // 1. Base master topics
    baseMaster.forEach(t => {
      const key = `${t.subject}__${t.batch}__${t.topicName}`.toLowerCase();
      map.set(key, { ...t });
    });

    // 2. Local storage topics (teacher additions / modifications)
    localList.forEach(t => {
      const subj = t.subject || 'Physics';
      const batch = t.batch || '12th Science Tarabai Park (Batch A)';
      const name = t.topicName || t.topic_name || '';
      if (!name) return;
      const key = `${subj}__${batch}__${name}`.toLowerCase();
      const existing = map.get(key) || {};
      map.set(key, {
        ...existing,
        ...t,
        id: t.id || existing.id || `TOPIC-${Date.now()}`,
        subject: subj,
        batch: batch,
        topicName: name,
        teacher: t.teacher || t.teacher_name || existing.teacher || 'Prof. Shubham Shinde',
        status: t.status || existing.status || 'In Progress',
        completedPeriods: t.completedPeriods !== undefined ? t.completedPeriods : (t.completed_periods !== undefined ? t.completed_periods : (existing.completedPeriods || 1)),
        requiredPeriods: t.requiredPeriods !== undefined ? t.requiredPeriods : (t.required_periods !== undefined ? t.required_periods : (existing.requiredPeriods || 3)),
        startDate: t.startDate || t.start_date || existing.startDate,
        endDate: t.endDate || t.end_date || existing.endDate,
        chapter: t.chapter || existing.chapter || 'Curriculum Unit',
        remarks: t.remarks || existing.remarks
      });
    });

    // 3. Backend MongoDB topics
    backendList.forEach(item => {
      const subj = item.subject;
      const batch = item.batch;
      const name = item.topic_name || item.topicName;
      if (!name) return;
      const key = `${subj}__${batch}__${name}`.toLowerCase();
      const existing = map.get(key) || {};
      map.set(key, {
        ...existing,
        ...item,
        id: item.id || item.topic_id || existing.id,
        subject: subj,
        batch: batch,
        topicName: name,
        teacher: item.teacher_name || item.teacher || existing.teacher || 'Prof. Shubham Shinde',
        status: item.status || existing.status || 'In Progress',
        completedPeriods: item.completed_periods !== undefined ? item.completed_periods : (item.completedPeriods !== undefined ? item.completedPeriods : (existing.completedPeriods || 1)),
        requiredPeriods: item.required_periods !== undefined ? item.required_periods : (item.requiredPeriods !== undefined ? item.requiredPeriods : (existing.requiredPeriods || 3)),
        startDate: item.start_date || item.startDate || existing.startDate,
        endDate: item.end_date || item.endDate || existing.endDate,
        remarks: item.remarks || existing.remarks,
        chapter: item.chapter || existing.chapter
      });
    });

    return Array.from(map.values());
  };

  // Topic list state initialized with merged data (master + local storage)
  const [topicList, setTopicList] = useState(() => {
    let local = [];
    try {
      const s = localStorage.getItem(STORAGE_TOPICS_KEY);
      if (s) local = JSON.parse(s);
    } catch (_) {}
    return mergeTopics(masterTopics, local, []);
  });

  // Highlighted topic when redirected from Daily Activity
  const [highlightedTopicName, setHighlightedTopicName] = useState(() => {
    return location.state?.highlightTopic || searchParams.get('topic') || '';
  });

  // Sync with backend on component mount and merge
  useEffect(() => {
    let local = [];
    try {
      const s = localStorage.getItem(STORAGE_TOPICS_KEY);
      if (s) local = JSON.parse(s);
    } catch (_) {}

    curriculumService.getTopicDurations().then(data => {
      if (Array.isArray(data) && data.length > 0) {
        const merged = mergeTopics(masterTopics, local, data);
        setTopicList(merged);
      }
    });
  }, []);

  // Daily teacher activities for cross-verifying actual periods
  const [dailyActivities] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_ACTIVITIES_KEY);
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return [];
  });

  // The 3 MANDATORY FILTERS: Subject, Faculty, Batch (Supports Auto-Prefill via Redirect)
  const [selectedSubject, setSelectedSubject] = useState(() => {
    return location.state?.prefillSubject || searchParams.get('subject') || '';
  });
  const [selectedTeacher, setSelectedTeacher] = useState(() => {
    return location.state?.prefillTeacher || searchParams.get('teacher') || '';
  });
  const [selectedBatch, setSelectedBatch] = useState(() => {
    return location.state?.prefillBatch || searchParams.get('batch') || '';
  });

  // Secondary optional filters
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Auto-prefill if redirected from another page
  useEffect(() => {
    const preSubj = location.state?.prefillSubject || searchParams.get('subject');
    const preTeacher = location.state?.prefillTeacher || searchParams.get('teacher');
    const preBatch = location.state?.prefillBatch || searchParams.get('batch');
    const preTopic = location.state?.highlightTopic || searchParams.get('topic');

    if (preSubj) setSelectedSubject(preSubj);
    if (preTeacher) setSelectedTeacher(preTeacher);
    if (preBatch) setSelectedBatch(preBatch);
    if (preTopic) setHighlightedTopicName(preTopic);
  }, [location.state, searchParams]);

  // Helper lists for the 3 dropdowns
  const availableSubjects = useMemo(() => {
    return Array.from(new Set(topicList.map(t => t.subject))).sort();
  }, [topicList]);

  // Filter available teachers based on subject if selected
  const availableTeachers = useMemo(() => {
    let pool = topicList;
    if (selectedSubject) {
      pool = pool.filter(t => t.subject === selectedSubject);
    }
    return Array.from(new Set(pool.map(t => t.teacher))).sort();
  }, [topicList, selectedSubject]);

  // Filter available batches based on subject and teacher
  const availableBatches = useMemo(() => {
    let pool = topicList;
    if (selectedSubject) {
      pool = pool.filter(t => t.subject === selectedSubject);
    }
    if (selectedTeacher) {
      pool = pool.filter(t => t.teacher === selectedTeacher);
    }
    return Array.from(new Set(pool.map(t => t.batch))).sort();
  }, [topicList, selectedSubject, selectedTeacher]);

  // Auto reset teacher or batch if they become invalid after subject change
  const handleSubjectChange = (subj) => {
    setSelectedSubject(subj);
    const validTeachers = Array.from(new Set(topicList.filter(t => !subj || t.subject === subj).map(t => t.teacher)));
    if (selectedTeacher && !validTeachers.includes(selectedTeacher)) {
      setSelectedTeacher('');
    }
    const validBatches = Array.from(new Set(topicList.filter(t => !subj || t.subject === subj).map(t => t.batch)));
    if (selectedBatch && !validBatches.includes(selectedBatch)) {
      setSelectedBatch('');
    }
  };

  const handleTeacherChange = (teacher) => {
    setSelectedTeacher(teacher);
    const validBatches = Array.from(
      new Set(topicList.filter(t => (!selectedSubject || t.subject === selectedSubject) && (!teacher || t.teacher === teacher)).map(t => t.batch))
    );
    if (selectedBatch && !validBatches.includes(selectedBatch)) {
      setSelectedBatch('');
    }
  };

  // CHECK: ARE ALL 3 MANDATORY FILTERS SELECTED?
  const isSelectionComplete = Boolean(selectedSubject && selectedTeacher && selectedBatch);

  // Filtered topics ONLY calculated when all 3 filters are selected
  const filteredTopics = useMemo(() => {
    if (!isSelectionComplete) return [];

    return topicList.filter(topic => {
      if (topic.subject !== selectedSubject) return false;
      if (topic.teacher !== selectedTeacher) return false;
      if (topic.batch !== selectedBatch) return false;

      // Month filter
      if (selectedMonth !== 'All' && topic.month !== selectedMonth) return false;

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matches =
          (topic.topicName || '').toLowerCase().includes(q) ||
          (topic.chapter || '').toLowerCase().includes(q) ||
          (topic.remarks || '').toLowerCase().includes(q) ||
          (topic.status || '').toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [isSelectionComplete, selectedSubject, selectedTeacher, selectedBatch, selectedMonth, searchTerm]);

  // Dynamic KPI Metrics (Calculated strictly based on the 3 selected filters)
  const totalTopicsCount = filteredTopics.length;
  const totalPlannedPeriods = filteredTopics.reduce((sum, t) => sum + (parseInt(t.requiredPeriods, 10) || 0), 0);
  const totalCompletedPeriods = filteredTopics.reduce((sum, t) => sum + (parseInt(t.completedPeriods, 10) || 0), 0);
  const completionPercentage = totalPlannedPeriods > 0 ? Math.round((totalCompletedPeriods / totalPlannedPeriods) * 100) : 0;
  const completedCount = filteredTopics.filter(t => t.status === 'Completed').length;
  const inProgressCount = filteredTopics.filter(t => t.status === 'In Progress').length;
  const upcomingCount = filteredTopics.filter(t => t.status === 'Upcoming').length;

  // Duration in calendar days
  const calculateDurationDays = (start, end) => {
    if (!start) return '-';
    if (!end) {
      const s = new Date(start);
      const diff = Math.max(1, Math.round((new Date() - s) / (1000 * 60 * 60 * 24)));
      return `${diff} Days`;
    }
    const s = new Date(start);
    const e = new Date(end);
    const diff = Math.max(1, Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1);
    return `${diff} Days`;
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Not Set';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (_) {
      return dateStr;
    }
  };

  // Reset all 3 filters
  const handleResetFilters = () => {
    setSelectedSubject('');
    setSelectedTeacher('');
    setSelectedBatch('');
    setSelectedMonth('All');
    setSearchTerm('');
  };

  // EXPORT 1: Monthly Curriculum Topic Duration Report (.xlsx)
  const handleExportMonthly = () => {
    if (!isSelectionComplete || filteredTopics.length === 0) {
      toast.warning('Please select Subject, Faculty, and Batch first.');
      return;
    }

    try {
      const monthLabel = selectedMonth === 'All' ? 'All_Months' : selectedMonth.replace(/\s+/g, '_');
      const sanitizedBatch = selectedBatch.replace(/[^a-zA-Z0-9]/g, '_');

      const sheetData = [
        ['SHUBHAM ACADEMY - ACADEMIC ADMINISTRATION'],
        ['MONTHLY CURRICULUM TOPIC DURATION & PERIOD ALLOCATION AUDIT REPORT'],
        ['Subject:', selectedSubject, 'Faculty / Teacher:', selectedTeacher],
        ['Batch:', selectedBatch, 'Report Month:', selectedMonth, 'Date:', new Date().toLocaleDateString('en-US')],
        [],
        [
          'S.No',
          'Topic Ref ID',
          'Chapter Name',
          'Topic Title',
          'Start Date',
          'End Date',
          'Duration (Days)',
          'Planned Periods',
          'Period Duration (Mins)',
          'Actual Completed Periods',
          'Period Variance',
          'Status',
          'Syllabus & Pacing Remarks'
        ]
      ];

      filteredTopics.forEach((t, idx) => {
        const required = parseInt(t.requiredPeriods, 10) || 0;
        const completed = parseInt(t.completedPeriods, 10) || 0;
        const variance = completed - required;
        const durationDays = calculateDurationDays(t.startDate, t.endDate);

        sheetData.push([
          idx + 1,
          t.id,
          t.chapter || '-',
          t.topicName,
          t.startDate ? formatDate(t.startDate) : 'Not Started',
          t.endDate ? formatDate(t.endDate) : (t.status === 'Completed' ? 'Completed' : 'In Progress'),
          durationDays,
          required,
          t.periodDurationMins || 45,
          completed,
          variance >= 0 ? `+${variance}` : `${variance}`,
          t.status,
          t.remarks || 'Standard syllabus progression.'
        ]);
      });

      sheetData.push([]);
      sheetData.push([
        'SUMMARY TOTALS',
        '',
        `Total Topics: ${totalTopicsCount}`,
        '',
        '',
        '',
        '',
        `Total Planned: ${totalPlannedPeriods}`,
        '',
        `Total Completed: ${totalCompletedPeriods}`,
        `Completion Rate: ${completionPercentage}%`,
        '',
        'Official Academic Record'
      ]);

      const ws = XLSX.utils.aoa_to_sheet(sheetData);
      ws['!cols'] = [
        { wch: 6 },
        { wch: 14 },
        { wch: 30 },
        { wch: 42 },
        { wch: 16 },
        { wch: 16 },
        { wch: 16 },
        { wch: 15 },
        { wch: 15 },
        { wch: 16 },
        { wch: 16 },
        { wch: 14 },
        { wch: 45 }
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Monthly Pacing');
      XLSX.writeFile(wb, `Shubham_Academy_Monthly_Topic_Duration_${sanitizedBatch}_${monthLabel}.xlsx`);

      toast.success(`Monthly duration report downloaded for ${selectedSubject} (${selectedBatch})!`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to export Monthly Excel report.');
    }
  };

  // EXPORT 2: Full Academic Year Matrix (.xlsx) for Next-Year Planning
  const handleExportYearly = () => {
    if (!isSelectionComplete || filteredTopics.length === 0) {
      toast.warning('Please select Subject, Faculty, and Batch first.');
      return;
    }

    try {
      const sanitizedBatch = selectedBatch.replace(/[^a-zA-Z0-9]/g, '_');

      const sheetData = [
        ['SHUBHAM ACADEMY - ANNUAL CURRICULUM ARCHIVE & NEXT-YEAR PLANNING MATRIX'],
        ['FULL ACADEMIC YEAR TOPIC DURATION & HISTORICAL PERIOD AUDIT'],
        ['Subject:', selectedSubject, 'Faculty / Teacher:', selectedTeacher],
        ['Batch:', selectedBatch, 'Academic Year:', '2026-2027', 'Generated On:', new Date().toLocaleDateString('en-US')],
        [
          'Objective:',
          'Historical time and period consumption data to facilitate manual planning and syllabus pacing for the upcoming academic year.'
        ],
        [],
        [
          'S.No',
          'Topic Ref ID',
          'Chapter Title',
          'Topic Covered',
          'Start Date',
          'End Date',
          'Duration (Days)',
          'Allocated Periods',
          'Period Duration (Mins)',
          'Actual Periods Consumed',
          'Period Variance',
          'Pacing Analysis',
          'Recommended Periods For Next Year (Planning Reference)',
          'Status',
          'Syllabus Remarks'
        ]
      ];

      filteredTopics.forEach((t, idx) => {
        const required = parseInt(t.requiredPeriods, 10) || 0;
        const completed = parseInt(t.completedPeriods, 10) || 0;
        const variance = completed - required;
        const durationDays = calculateDurationDays(t.startDate, t.endDate);

        let pacingReview = 'On Schedule';
        let recommendedPeriods = required;
        if (completed > required) {
          pacingReview = `Required +${completed - required} extra periods`;
          recommendedPeriods = completed;
        } else if (completed < required && t.status === 'Completed') {
          pacingReview = `Completed early (${required - completed} periods saved)`;
          recommendedPeriods = completed;
        }

        sheetData.push([
          idx + 1,
          t.id,
          t.chapter || '-',
          t.topicName,
          t.startDate ? formatDate(t.startDate) : 'Not Started',
          t.endDate ? formatDate(t.endDate) : (t.status === 'Completed' ? 'Completed' : 'In Progress'),
          durationDays,
          required,
          t.periodDurationMins || 45,
          completed,
          variance === 0 ? '0 (Exact)' : (variance > 0 ? `+${variance}` : `${variance}`),
          pacingReview,
          `${recommendedPeriods} Periods`,
          t.status,
          t.remarks || 'Standard syllabus pacing.'
        ]);
      });

      sheetData.push([]);
      sheetData.push([
        'ANNUAL MASTER TOTALS',
        '',
        `Total Topics: ${totalTopicsCount}`,
        '',
        '',
        '',
        '',
        `Total Allocated: ${totalPlannedPeriods} Periods`,
        '',
        `Total Consumed: ${totalCompletedPeriods} Periods`,
        '',
        '',
        'Use this data for next year timetable and period budget planning.',
        '',
        ''
      ]);

      const ws = XLSX.utils.aoa_to_sheet(sheetData);
      ws['!cols'] = [
        { wch: 6 },
        { wch: 14 },
        { wch: 30 },
        { wch: 44 },
        { wch: 16 },
        { wch: 16 },
        { wch: 16 },
        { wch: 16 },
        { wch: 15 },
        { wch: 18 },
        { wch: 15 },
        { wch: 22 },
        { wch: 24 },
        { wch: 14 },
        { wch: 45 }
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Annual Pacing');
      XLSX.writeFile(wb, `Shubham_Academy_Yearly_Curriculum_Plan_${sanitizedBatch}.xlsx`);

      toast.success(`Full Academic Year Planning Matrix downloaded for ${selectedSubject}!`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to export Yearly Excel matrix.');
    }
  };

  return (
    <div className="d-flex flex-column gap-4 pb-5">
      {/* Top Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
        <div>
          <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4 d-flex align-items-center gap-2">
            <BookOpen className="text-sa-primary" size={24} />
            Topic Duration & Period Allocation Report
          </h3>
          <span className="small text-muted">
            Select Subject, Faculty, and Batch to generate topic timeline and download pacing reports.
          </span>
        </div>

        {/* ONLY show Export Options when the 3 mandatory filters are selected */}
        {isSelectionComplete && (
          <div className="d-flex flex-wrap align-items-center gap-2 animate-fadeIn">
            {/* Monthly Export Button */}
            <button
              type="button"
              className="btn btn-outline-danger d-flex align-items-center gap-2 fw-semibold px-3 py-2 rounded-3 shadow-sm"
              onClick={handleExportMonthly}
              title="Download Monthly Curriculum Pacing Excel Sheet"
            >
              <Download size={16} />
              <span>Monthly Export (.xlsx)</span>
            </button>

            {/* Yearly Export Button */}
            <button
              type="button"
              className="btn text-white d-flex align-items-center gap-2 fw-semibold px-3 py-2 rounded-3 shadow-sm hover-shadow"
              style={{ backgroundColor: '#A91F1F', border: 'none' }}
              onClick={handleExportYearly}
              title="Download Full Academic Year Matrix for Next-Year Planning"
            >
              <FileSpreadsheet size={16} />
              <span>Yearly Export (Annual Plan .xlsx)</span>
            </button>
          </div>
        )}
      </div>

      {/* FILTER CARD (Always Visible as the Primary Action Interface) */}
      <div className="sa-card p-4 border rounded-3 bg-white shadow-sm">
        <div className="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom">
          <div className="d-flex align-items-center gap-3">
            <div
              className="rounded-3 text-white d-flex align-items-center justify-content-center flex-shrink-0 shadow-xs"
              style={{
                width: '38px',
                height: '38px',
                minWidth: '38px',
                minHeight: '38px',
                backgroundColor: '#A91F1F'
              }}
            >
              <Filter size={18} strokeWidth={2.2} />
            </div>
            <div>
              <h6 className="fw-bold text-sa-charcoal m-0 fs-6 lh-sm">Curriculum Selection Filters</h6>
              <span className="text-muted d-block mt-0.5" style={{ fontSize: '12.5px' }}>
                Select Subject, Faculty, and Batch to load the Topic Duration Matrix
              </span>
            </div>
          </div>

          {isSelectionComplete && (
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1.5 rounded-pill px-3 py-1"
              style={{ fontSize: '12px' }}
              onClick={handleResetFilters}
            >
              <RotateCcw size={13} />
              <span>Reset Selection</span>
            </button>
          )}
        </div>

        {/* The 3 Required Dropdowns in a Responsive Row */}
        <div className="row g-3">
          {/* 1. Subject Filter (Mandatory) */}
          <div className="col-12 col-md-4">
            <label className="form-label small fw-bold text-dark d-flex align-items-center gap-1">
              <span>1. Select Subject</span>
              <span className="text-danger">*</span>
              {selectedSubject && <Check size={14} className="text-success ms-1" />}
            </label>
            <select
              className={`form-select ${selectedSubject ? 'border-success' : 'border-secondary-subtle'}`}
              value={selectedSubject}
              onChange={(e) => handleSubjectChange(e.target.value)}
              style={{ fontSize: '13.5px', height: '42px' }}
            >
              <option value="">-- Choose Subject --</option>
              {availableSubjects.map((subj) => (
                <option key={subj} value={subj}>
                  {subj}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Faculty Filter (Mandatory) */}
          <div className="col-12 col-md-4">
            <label className="form-label small fw-bold text-dark d-flex align-items-center gap-1">
              <span>2. Select Faculty / Teacher</span>
              <span className="text-danger">*</span>
              {selectedTeacher && <Check size={14} className="text-success ms-1" />}
            </label>
            <select
              className={`form-select ${selectedTeacher ? 'border-success' : 'border-secondary-subtle'}`}
              value={selectedTeacher}
              onChange={(e) => handleTeacherChange(e.target.value)}
              style={{ fontSize: '13.5px', height: '42px' }}
            >
              <option value="">-- Choose Faculty --</option>
              {availableTeachers.map((teacher) => (
                <option key={teacher} value={teacher}>
                  {teacher}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Batch Filter (Mandatory) */}
          <div className="col-12 col-md-4">
            <label className="form-label small fw-bold text-dark d-flex align-items-center gap-1">
              <span>3. Select Batch</span>
              <span className="text-danger">*</span>
              {selectedBatch && <Check size={14} className="text-success ms-1" />}
            </label>
            <select
              className={`form-select ${selectedBatch ? 'border-success' : 'border-secondary-subtle'}`}
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              style={{ fontSize: '13.5px', height: '42px' }}
            >
              <option value="">-- Choose Batch --</option>
              {availableBatches.map((batch) => (
                <option key={batch} value={batch}>
                  {batch}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Secondary Filters shown once the 3 primary filters are chosen */}
        {isSelectionComplete && (
          <div className="row g-2 align-items-center pt-3 mt-3 border-top animate-fadeIn">
            <div className="col-12 col-md-6">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light border-end-0">
                  <Search size={14} className="text-muted" />
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Filter by topic title, chapter, or status..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ height: '36px', fontSize: '13px' }}
                />
              </div>
            </div>

            <div className="col-12 col-md-6">
              <div className="d-flex align-items-center gap-2 justify-content-md-end">
                <span className="small text-muted fw-semibold">Month:</span>
                <select
                  className="form-select form-select-sm"
                  style={{ width: '180px', height: '36px', fontSize: '12.5px' }}
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  <option value="All">All Months (Full Year)</option>
                  <option value="June 2026">June 2026</option>
                  <option value="July 2026">July 2026</option>
                  <option value="August 2026">August 2026</option>
                  <option value="September 2026">September 2026</option>
                  <option value="October 2026">October 2026</option>
                  <option value="November 2026">November 2026</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* STATE 1: INITIAL STATE (Before all 3 filters are selected) */}
      {!isSelectionComplete && (
        <div className="sa-card p-5 border rounded-3 bg-white text-center shadow-xs">
          <div className="d-flex flex-column align-items-center justify-content-center py-4" style={{ maxWidth: '520px', margin: '0 auto' }}>
            <div
              className="rounded-circle d-flex align-items-center justify-content-center mb-3"
              style={{ width: '68px', height: '68px', backgroundColor: '#fbeeed', color: '#A91F1F' }}
            >
              <BookOpen size={32} />
            </div>

            <h5 className="fw-bold text-sa-charcoal mb-2">No Curriculum Matrix Loaded Yet</h5>
            <p className="text-muted small mb-4 lh-base">
              To view topic start/end dates, required periods, and export reports, please select a{' '}
              <strong className="text-dark">Subject</strong>, assigned{' '}
              <strong className="text-dark">Faculty</strong>, and target{' '}
              <strong className="text-dark">Batch</strong> from the filter card above.
            </p>

            <div className="d-flex flex-wrap align-items-center justify-content-center gap-2">
              <span className={`badge px-3 py-1.5 rounded-pill ${selectedSubject ? 'bg-success text-white' : 'bg-light text-secondary border'}`}>
                1. Subject {selectedSubject ? `(${selectedSubject})` : 'Pending'}
              </span>
              <span className={`badge px-3 py-1.5 rounded-pill ${selectedTeacher ? 'bg-success text-white' : 'bg-light text-secondary border'}`}>
                2. Faculty {selectedTeacher ? `(${selectedTeacher})` : 'Pending'}
              </span>
              <span className={`badge px-3 py-1.5 rounded-pill ${selectedBatch ? 'bg-success text-white' : 'bg-light text-secondary border'}`}>
                3. Batch {selectedBatch ? 'Selected' : 'Pending'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* STATE 2: ACTIVE REPORT (Only visible when all 3 filters are selected) */}
      {isSelectionComplete && (
        <div className="d-flex flex-column gap-4 animate-fadeIn">
          {/* Active Selection Badge Bar */}
          <div className="p-3 rounded-3 border d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 bg-white shadow-xs">
            <div className="d-flex flex-wrap align-items-center gap-3">
              <span className="small text-muted fw-semibold text-uppercase">Active Report:</span>
              <div className="d-flex align-items-center gap-1.5">
                <span className="badge bg-primary-subtle text-primary fw-bold px-2.5 py-1 rounded">
                  Subject: {selectedSubject}
                </span>
              </div>
              <div className="d-flex align-items-center gap-1.5">
                <span className="badge bg-danger-subtle text-danger fw-bold px-2.5 py-1 rounded">
                  Faculty: {selectedTeacher}
                </span>
              </div>
              <div className="d-flex align-items-center gap-1.5">
                <span className="badge bg-success-subtle text-success fw-bold px-2.5 py-1 rounded">
                  Batch: {selectedBatch}
                </span>
              </div>
            </div>
          </div>

          {/* Dynamic KPI Cards (Reflecting Strictly this Subject, Faculty, and Batch) */}
          <div className="row g-3">
            <div className="col-12 col-sm-6 col-xl-3">
              <div className="sa-card p-3 border rounded-3 bg-white h-100 shadow-sm d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-muted small fw-semibold text-uppercase d-block mb-1">Topics Monitored</span>
                  <h4 className="fw-extrabold text-sa-charcoal m-0 fs-3">{totalTopicsCount}</h4>
                  <span className="text-secondary small mt-1 d-block" style={{ fontSize: '11px' }}>
                    In this curriculum syllabus
                  </span>
                </div>
                <div className="p-3 rounded-circle text-white" style={{ backgroundColor: '#A91F1F' }}>
                  <Layers size={22} />
                </div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-xl-3">
              <div className="sa-card p-3 border rounded-3 bg-white h-100 shadow-sm d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-muted small fw-semibold text-uppercase d-block mb-1">Planned Periods</span>
                  <h4 className="fw-extrabold text-sa-charcoal m-0 fs-3">{totalPlannedPeriods}</h4>
                  <span className="text-muted small mt-1 d-block" style={{ fontSize: '11px' }}>
                    Allocated teaching hours
                  </span>
                </div>
                <div className="p-3 rounded-circle text-white" style={{ backgroundColor: '#D5A61C' }}>
                  <Clock size={22} />
                </div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-xl-3">
              <div className="sa-card p-3 border rounded-3 bg-white h-100 shadow-sm d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-muted small fw-semibold text-uppercase d-block mb-1">Completed Periods</span>
                  <h4 className="fw-extrabold text-success m-0 fs-3">{totalCompletedPeriods}</h4>
                  <span className="text-muted small mt-1 d-block" style={{ fontSize: '11px' }}>
                    {totalPlannedPeriods - totalCompletedPeriods > 0
                      ? `${totalPlannedPeriods - totalCompletedPeriods} periods remaining`
                      : 'Target achieved'}
                  </span>
                </div>
                <div className="p-3 rounded-circle text-white" style={{ backgroundColor: '#168554' }}>
                  <CheckCircle2 size={22} />
                </div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-xl-3">
              <div className="sa-card p-3 border rounded-3 bg-white h-100 shadow-sm d-flex flex-column justify-content-between">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-muted small fw-semibold text-uppercase">Curriculum Progress</span>
                  <span className="badge bg-success-subtle text-success fw-bold">{completionPercentage}%</span>
                </div>
                <div className="progress" style={{ height: '8px', borderRadius: '4px' }}>
                  <div
                    className="progress-bar"
                    role="progressbar"
                    style={{ width: `${Math.min(completionPercentage, 100)}%`, backgroundColor: '#168554' }}
                  />
                </div>
                <div className="d-flex justify-content-between align-items-center mt-2 small text-muted" style={{ fontSize: '11px' }}>
                  <span>{completedCount} Completed</span>
                  <span>{inProgressCount} In Progress</span>
                  <span>{upcomingCount} Upcoming</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Topics Table */}
          <div className="sa-card border rounded-3 bg-white shadow-sm overflow-hidden">
            <div className="p-3 bg-light border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2">
              <div className="d-flex align-items-center gap-2">
                <span className="fw-bold text-sa-charcoal">
                  Topic Duration & Period Allocation Matrix ({selectedSubject})
                </span>
                <span className="badge bg-secondary-subtle text-secondary rounded-pill">
                  {filteredTopics.length} Topics
                </span>
              </div>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
                <thead className="table-light" style={{ borderBottom: '2px solid #e9ecef', fontSize: '11.5px' }}>
                  <tr className="text-secondary text-uppercase fw-bold">
                    <th style={{ width: '45px' }} className="text-center">#</th>
                    <th style={{ minWidth: '320px' }}>Chapter & Topic Title</th>
                    <th style={{ minWidth: '130px' }}>Start Date</th>
                    <th style={{ minWidth: '130px' }}>End Date</th>
                    <th style={{ minWidth: '100px' }} className="text-center">Duration</th>
                    <th style={{ minWidth: '150px' }}>Periods (Req / Done)</th>
                    <th style={{ minWidth: '110px' }} className="text-center pe-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTopics.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-5 text-muted">
                        <div className="d-flex flex-column align-items-center justify-content-center gap-2">
                          <BookOpen size={36} className="text-secondary opacity-50" />
                          <p className="m-0 fw-semibold">No topic records match the current month/search filter.</p>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary mt-1"
                            onClick={() => {
                              setSelectedMonth('All');
                              setSearchTerm('');
                            }}
                          >
                            Reset Month / Search
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredTopics.map((topic, index) => {
                      const required = parseInt(topic.requiredPeriods, 10) || 1;
                      const completed = parseInt(topic.completedPeriods, 10) || 0;
                      const pct = Math.min(Math.round((completed / required) * 100), 100);
                      const durationDays = calculateDurationDays(topic.startDate, topic.endDate);
                      const isHighlighted = Boolean(
                        highlightedTopicName && (
                          (topic.topicName || '').toLowerCase().includes(highlightedTopicName.toLowerCase()) ||
                          highlightedTopicName.toLowerCase().includes((topic.topicName || '').toLowerCase())
                        )
                      );

                      return (
                        <tr
                          key={topic.id || index}
                          style={{
                            backgroundColor: isHighlighted ? '#FFFBEB' : undefined,
                            borderLeft: isHighlighted ? '4px solid #D97706' : undefined
                          }}
                        >
                          {/* S.No */}
                          <td className="text-center text-muted fw-semibold">{index + 1}</td>

                          {/* Chapter & Topic Title */}
                          <td>
                            <div className="d-flex flex-column">
                              <div className="d-flex align-items-center flex-wrap gap-1">
                                <span className="fw-bold text-sa-charcoal lh-sm" style={{ fontSize: '13.5px' }}>
                                  {topic.topicName}
                                </span>
                                {isHighlighted && (
                                  <span className="badge bg-warning text-dark border border-warning-subtle px-2 py-0.5 rounded-pill fw-semibold" style={{ fontSize: '10.5px' }}>
                                    ⚡ Synced from Daily Activity (In Progress)
                                  </span>
                                )}
                              </div>
                              <div className="d-flex align-items-center gap-2 mt-1">
                                <span className="badge bg-light text-secondary border px-2 py-0.5 rounded" style={{ fontSize: '11px' }}>
                                  {topic.chapter || 'Chapter'}
                                </span>
                                <span className="text-muted" style={{ fontSize: '11px' }}>
                                  Ref: {topic.id}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Start Date */}
                          <td>
                            <div className="d-flex align-items-center gap-1.5">
                              <div
                                className="rounded p-1 d-flex align-items-center justify-content-center text-primary"
                                style={{ backgroundColor: '#eef2ff' }}
                              >
                                <Calendar size={13} />
                              </div>
                              <span className="fw-semibold text-dark">
                                {formatDate(topic.startDate)}
                              </span>
                            </div>
                          </td>

                          {/* End Date */}
                          <td>
                            <div className="d-flex align-items-center gap-1.5">
                              <div
                                className={`rounded p-1 d-flex align-items-center justify-content-center ${
                                  topic.status === 'Completed'
                                    ? 'text-success'
                                    : topic.status === 'In Progress'
                                    ? 'text-warning'
                                    : 'text-secondary'
                                }`}
                                style={{
                                  backgroundColor:
                                    topic.status === 'Completed'
                                      ? '#e8f5e9'
                                      : topic.status === 'In Progress'
                                      ? '#fff8e1'
                                      : '#f5f5f5'
                                }}
                              >
                                {topic.status === 'Completed' ? (
                                  <CheckCircle2 size={13} />
                                ) : (
                                  <Clock size={13} />
                                )}
                              </div>
                              <span className="fw-semibold text-dark">
                                {topic.endDate ? (
                                  formatDate(topic.endDate)
                                ) : (
                                  <span className="badge bg-warning-subtle text-warning-emphasis py-0.5 px-1.5 fw-normal">
                                    In Progress
                                  </span>
                                )}
                              </span>
                            </div>
                          </td>

                          {/* Duration in Days */}
                          <td className="text-center">
                            <span className="badge bg-light text-dark border px-2 py-1 fw-semibold">
                              {durationDays}
                            </span>
                          </td>

                          {/* Periods: Required vs Completed */}
                          <td>
                            <div className="d-flex flex-column" style={{ minWidth: '130px' }}>
                              <div className="d-flex align-items-center justify-content-between small mb-1">
                                <span className="fw-bold text-dark">
                                  {completed} / {required} <span className="text-muted fw-normal">Periods</span>
                                </span>
                                <span className="text-muted" style={{ fontSize: '11px' }}>
                                  ({topic.periodDurationMins || 45}m)
                                </span>
                              </div>
                              <div className="progress" style={{ height: '6px', borderRadius: '3px' }}>
                                <div
                                  className={`progress-bar ${
                                    completed >= required
                                      ? 'bg-success'
                                      : completed > 0
                                      ? 'bg-primary'
                                      : 'bg-secondary'
                                  }`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="text-center pe-3">
                            {topic.status === 'Completed' ? (
                              <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 rounded-pill">
                                Completed
                              </span>
                            ) : topic.status === 'In Progress' ? (
                              <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 rounded-pill">
                                In Progress
                              </span>
                            ) : (
                              <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle px-2 py-1 rounded-pill">
                                Upcoming
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer Summary Bar */}
            <div className="p-3 bg-light border-top d-flex flex-wrap align-items-center justify-content-between gap-3 text-secondary small">
              <div>
                Showing <strong className="text-dark">{filteredTopics.length}</strong> topics for{' '}
                <strong className="text-dark">{selectedSubject}</strong> taught by{' '}
                <strong className="text-dark">{selectedTeacher}</strong>.
              </div>
              <div className="d-flex align-items-center gap-3">
                <span>
                  Total Planned: <strong className="text-dark">{totalPlannedPeriods} Periods</strong>
                </span>
                <span className="text-muted">|</span>
                <span>
                  Total Logged: <strong className="text-success">{totalCompletedPeriods} Periods</strong>
                </span>
                <span className="text-muted">|</span>
                <span>
                  Completion: <strong className="text-primary">{completionPercentage}%</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
