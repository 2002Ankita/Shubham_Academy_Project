import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Users,
  Calendar,
  MapPin,
  Clock,
  ArrowLeft,
  Eye,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  CalendarCheck,
  ArrowRight,
  Printer,
  Building2,
  GraduationCap,
  Sparkles,
  DoorOpen,
  Filter,
  RotateCcw,
  CalendarDays,
  Layers,
  Bell,
  AlertCircle,
  HelpCircle,
  Send,
  CheckCircle
} from 'lucide-react';
import { toast } from 'react-toastify';
import AuthContext from '../../context/AuthContext';
import batchService from '../../services/batchService';
import studentService from '../../services/studentService';
import { notificationService } from '../../services/notificationService';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';

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

// Normalize time strings for matching
const normalizeTimeString = (t) => {
  if (!t) return '';
  return t
    .replace(/\s+/g, ' ')
    .replace(/[–—]/g, '-')
    .trim()
    .toLowerCase();
};

// Check if two time strings match
const timesMatch = (t1, t2) => {
  if (!t1 || !t2) return false;
  const n1 = normalizeTimeString(t1);
  const n2 = normalizeTimeString(t2);
  return n1 === n2 || n1.includes(n2) || n2.includes(n1);
};

// Parse start time to minutes from midnight for sorting
const getMinutesFromTimeString = (timeStr) => {
  if (!timeStr) return 0;
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = (match[3] || '').toUpperCase();
  if (meridiem === 'PM' && hours < 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

// Palette helper for standard badges
const getStandardBadgeStyle = (standard, subject = '') => {
  const std = String(standard || '').toLowerCase();
  const sub = String(subject || '').toLowerCase();
  if (std.includes('12')) {
    return {
      bg: '#F3E8FF',
      color: '#7E22CE',
      border: '1px solid #E9D5FF',
      label: '12th'
    };
  }
  if (sub.includes('math')) {
    return {
      bg: '#DCFCE7',
      color: '#15803D',
      border: '1px solid #BBF7D0',
      label: '11th'
    };
  }
  return {
    bg: '#E0F2FE',
    color: '#0369A1',
    border: '1px solid #BAE6FD',
    label: '11th'
  };
};

// Check if a date is today
const isToday = (dateObj) => {
  if (!dateObj) return false;
  const today = new Date();
  return (
    dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear()
  );
};

// Palette helper for timetable slots matching Shubham Academy brand theme
const getTimetableSlotStyle = (classCode = '', subject = '') => {
  const code = String(classCode || '').toUpperCase();
  const sub = String(subject || '').toLowerCase();

  // Physics / 12-A -> Signature Brand Crimson
  if (sub.includes('phys') || code.includes('12-A') || code.includes('11-A')) {
    return {
      bg: '#FFF5F5',
      color: '#8B1216',
      border: '#FECACA',
      borderLeft: '#8B1216',
      accentDot: '#DC2626',
      badgeBg: '#FEE2E2',
      badgeColor: '#8B1216'
    };
  }
  // Chemistry / 12-B -> Warm Honey Amber
  if (sub.includes('chem') || code.includes('12-B') || code.includes('11-B')) {
    return {
      bg: '#FFFBEB',
      color: '#92400E',
      border: '#FDE68A',
      borderLeft: '#D97706',
      accentDot: '#F59E0B',
      badgeBg: '#FEF3C7',
      badgeColor: '#B45309'
    };
  }
  // Mathematics -> Forest Green
  if (sub.includes('math')) {
    return {
      bg: '#F0FDF4',
      color: '#166534',
      border: '#BBF7D0',
      borderLeft: '#16A34A',
      accentDot: '#22C55E',
      badgeBg: '#DCFCE7',
      badgeColor: '#15803D'
    };
  }
  // Biology -> Royal Violet
  if (sub.includes('bio')) {
    return {
      bg: '#FAF5FF',
      color: '#6B21A8',
      border: '#E9D5FF',
      borderLeft: '#9333EA',
      accentDot: '#A855F7',
      badgeBg: '#F3E8FF',
      badgeColor: '#7E22CE'
    };
  }
  // Default Soft Slate
  return {
    bg: '#F8FAFC',
    color: '#334155',
    border: '#E2E8F0',
    borderLeft: '#64748B',
    accentDot: '#94A3B8',
    badgeBg: '#F1F5F9',
    badgeColor: '#475569'
  };
};

export default function MyClasses() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [branchFilter, setBranchFilter] = useState('All');

  // Preview mode toggle when week schedule is not published yet
  const [showRoutinePreview, setShowRoutinePreview] = useState(false);

  // Published weeks registry (current week 2026-10-12 is published by default)
  const [publishedWeeks, setPublishedWeeks] = useState(() => {
    try {
      const saved = localStorage.getItem('sa_published_timetable_weeks');
      return saved ? JSON.parse(saved) : ['2026-10-12'];
    } catch {
      return ['2026-10-12'];
    }
  });

  // Requested timetable weeks by faculty
  const [requestedWeeks, setRequestedWeeks] = useState(() => {
    try {
      const saved = localStorage.getItem('sa_requested_timetable_weeks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modal states (view class details only)
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [batchStudentsList, setBatchStudentsList] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Fetch batches and students from backend
  const fetchClassesAndStudents = async () => {
    try {
      setLoading(true);
      const [batchData, studentData] = await Promise.all([
        batchService.getMyClasses().catch(async () => {
          return await batchService.getBatches().catch(() => []);
        }),
        studentService.getAll().catch(() => [])
      ]);

      setStudents(Array.isArray(studentData) ? studentData : []);

      // Filter batches assigned to current teacher
      let teacherBatches = batchData;
      if (user && user.role === 'teacher' && user.name) {
        teacherBatches = batchData.filter((b) => {
          if (b.teacher_name && isTeacherMatch(user.name, b.teacher_name, b.subject)) return true;
          if (Array.isArray(b.timetable)) {
            return b.timetable.some(s => isTeacherMatch(user.name, s.teacher_name || b.teacher_name, s.subject || b.subject));
          }
          return false;
        });
      }

      // Map backend data into clean format
      const mapped = teacherBatches.map((b) => ({
        originalId: b.id,
        id: b.id ? `CLS-${b.id.substring(b.id.length - 4).toUpperCase()}` : 'N/A',
        name: b.name || 'Unnamed Batch',
        standard: b.standard || b.name || '11th Science',
        subject: b.subject || 'N/A',
        batch: b.batch_name || (b.name && b.name.includes('Batch') ? b.name.split('Batch')[1].trim() : 'A'),
        class_code: b.class_code || `${(b.standard || '11th').match(/\d+/)?.[0] || '11'}-${b.batch_name || 'A'}`,
        studentsCount: b.student_count || 0,
        time: b.time || '09:00 AM – 10:00 AM',
        room: b.room || 'Room 201',
        date: b.date || '',
        branch: b.branch || (b.name && b.name.toLowerCase().includes('mangalwar') ? 'Mangalwar Peth' : 'Tarabai Park'),
        teacher_name: b.teacher_name || user?.name || '',
        days: b.days || ['Monday', 'Wednesday', 'Thursday'],
        timetable: b.timetable || []
      }));

      setClasses(mapped);
    } catch (err) {
      console.error('Failed to fetch class and timetable data:', err);
      toast.error('Failed to load class data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassesAndStudents();
    const handleUpdate = () => {
      fetchClassesAndStudents();
      try {
        const pub = localStorage.getItem('sa_published_timetable_weeks');
        if (pub) setPublishedWeeks(JSON.parse(pub));
        const req = localStorage.getItem('sa_requested_timetable_weeks');
        if (req) setRequestedWeeks(JSON.parse(req));
      } catch (e) {
        console.warn(e);
      }
    };
    window.addEventListener('sa_timetable_updated', handleUpdate);
    window.addEventListener('sa_notifications_updated', handleUpdate);
    return () => {
      window.removeEventListener('sa_timetable_updated', handleUpdate);
      window.removeEventListener('sa_notifications_updated', handleUpdate);
    };
  }, [user]);

  // Handle View Class Modal
  const openViewClassModal = async (cls) => {
    if (!cls) return;
    setSelectedClass(cls);
    setOpenDropdownId(null);
    setBatchStudentsList([]);
    setViewModalOpen(true);

    if (cls.originalId) {
      try {
        setLoadingStudents(true);
        const data = await batchService.getBatchStudents(cls.originalId);
        if (Array.isArray(data) && data.length > 0) {
          setBatchStudentsList(data);
        }
      } catch (err) {
        console.warn('Could not fetch batch-specific students:', err);
      } finally {
        setLoadingStudents(false);
      }
    }
  };

  // Dynamic Week Calculation (Monday to Saturday)
  const currentWeekDays = useMemo(() => {
    const now = new Date();
    // Monday as index 0 (0 = Mon, 1 = Tue, ..., 6 = Sun)
    const dayOfWeek = (now.getDay() + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - dayOfWeek + weekOffset * 7);
    monday.setHours(0, 0, 0, 0);

    const weekDays = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      weekDays.push(d);
    }
    return weekDays;
  }, [weekOffset]);

  // Week range label e.g. "Mon, 12 Oct – Sat, 17 Oct 2026"
  const weekRangeLabel = useMemo(() => {
    if (!currentWeekDays.length) return '';
    const mon = currentWeekDays[0];
    const lastDay = currentWeekDays[currentWeekDays.length - 1];
    const startStr = mon.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
    const endStr = lastDay.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    return `${startStr} – ${endStr}`;
  }, [currentWeekDays]);

  // Unique identifier for the week, e.g. "2026-10-19"
  const currentWeekKey = useMemo(() => {
    if (!currentWeekDays.length) return '';
    return currentWeekDays[0].toISOString().split('T')[0];
  }, [currentWeekDays]);

  // Is this specific week published by Admin?
  // Current week (weekOffset === 0) or past weeks are always considered published.
  // Future weeks (weekOffset > 0) are considered published ONLY IF Admin has published/imported it.
  const isWeekPublished = useMemo(() => {
    if (weekOffset <= 0) return true;
    return publishedWeeks.includes(currentWeekKey);
  }, [weekOffset, publishedWeeks, currentWeekKey]);

  // Has the faculty member or system requested timetable for this week?
  const isWeekRequested = useMemo(() => {
    return requestedWeeks.includes(currentWeekKey);
  }, [requestedWeeks, currentWeekKey]);

  // Auto-notification to Academic Admin when teacher navigates to an unpublished upcoming week
  useEffect(() => {
    if (weekOffset > 0 && !isWeekPublished) {
      const notifiedKey = `sa_auto_notified_${currentWeekKey}`;
      const alreadyNotified = sessionStorage.getItem(notifiedKey);

      if (!alreadyNotified) {
        sessionStorage.setItem(notifiedKey, 'true');

        // Create high-priority timetable request notification for Admin
        notificationService.addNotification({
          id: `NTF-TT-REQ-${currentWeekKey}`,
          title: `Timetable Pending: ${weekRangeLabel}`,
          type: 'timetable_request',
          category: 'Academic Timetable & Scheduling',
          priority: 'High',
          author: `${user?.name || 'Dr. Priya Kulkarni'} (${user?.subject || 'Faculty'})`,
          details: `Faculty member ${user?.name || 'Faculty'} checked the schedule for ${weekRangeLabel}, but the weekly timetable has not been imported or published yet. Please import from Excel or configure slots under Master Weekly Timetable.`,
          forSuperAdminOnly: false
        });

        // Add to requested weeks
        setRequestedWeeks((prev) => {
          if (prev.includes(currentWeekKey)) return prev;
          const next = [...prev, currentWeekKey];
          try {
            localStorage.setItem('sa_requested_timetable_weeks', JSON.stringify(next));
          } catch (e) {
            console.warn(e);
          }
          return next;
        });

        toast.info(`Academic Admin has been notified that the timetable for ${weekRangeLabel} is pending upload.`);
      }
    }
  }, [weekOffset, isWeekPublished, currentWeekKey, weekRangeLabel, user]);

  // Manual notify admin button action
  const handleNotifyAdmin = () => {
    notificationService.addNotification({
      id: `NTF-TT-REQ-${currentWeekKey}-${Date.now()}`,
      title: `Timetable Requested: ${weekRangeLabel}`,
      type: 'timetable_request',
      category: 'Academic Timetable & Scheduling',
      priority: 'High',
      author: `${user?.name || 'Dr. Priya Kulkarni'} (${user?.subject || 'Faculty'})`,
      details: `Faculty member ${user?.name || 'Faculty'} requested the weekly timetable for ${weekRangeLabel}. Please upload or publish lecture slots in Timetable Management.`,
      forSuperAdminOnly: false
    });

    setRequestedWeeks((prev) => {
      const next = Array.from(new Set([...prev, currentWeekKey]));
      try {
        localStorage.setItem('sa_requested_timetable_weeks', JSON.stringify(next));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });

    toast.success(`Schedule request notification sent to Academic Admin for ${weekRangeLabel}!`);
  };

  // Dynamic Timetable Slots List (Standard periods + any custom/imported slots)
  const timetableTimeSlots = useMemo(() => {
    const defaultSlots = [
      '09:00 AM – 10:00 AM',
      '10:00 AM – 11:00 AM',
      '11:00 AM – 12:00 PM',
      '12:00 PM – 01:00 PM',
      '03:00 PM – 04:00 PM'
    ];

    const slotSet = new Set(defaultSlots);
    classes.forEach((c) => {
      if (Array.isArray(c.timetable)) {
        c.timetable.forEach((s) => {
          if (s.time) {
            const norm = s.time.replace(/[-–—]/g, '–').replace(/\s+/g, ' ').trim();
            slotSet.add(norm);
          }
        });
      }
    });

    return Array.from(slotSet).sort((a, b) => getMinutesFromTimeString(a) - getMinutesFromTimeString(b));
  }, [classes]);

  // All weekly timetable entries across assigned batches (filtered strictly for current teacher)
  const allTimetableEntries = useMemo(() => {
    const list = [];
    const teacherName = user?.name || '';

    classes.forEach((c) => {
      const parentBranch = c.branch || (c.name && c.name.toLowerCase().includes('mangalwar') ? 'Mangalwar Peth' : 'Tarabai Park');

      if (Array.isArray(c.timetable) && c.timetable.length > 0) {
        c.timetable.forEach((slot) => {
          const slotTeacher = slot.teacher_name || c.teacher_name || '';
          if (user && user.role === 'teacher' && teacherName) {
            if (!isTeacherMatch(teacherName, slotTeacher, slot.subject || c.subject)) {
              return; // Skip other teachers' slots
            }
          }

          list.push({
            ...slot,
            class_code: slot.class_code || c.class_code || c.name,
            subject: slot.subject || c.subject,
            room: slot.room || c.room,
            branch: slot.branch || parentBranch,
            parentClass: c
          });
        });
      } else {
        const batchTeacher = c.teacher_name || '';
        if (user && user.role === 'teacher' && teacherName) {
          if (!isTeacherMatch(teacherName, batchTeacher, c.subject)) {
            return;
          }
        }

        (c.days || []).forEach((d) => {
          list.push({
            day: d,
            time: c.time,
            room: c.room,
            class_code: c.class_code || c.name,
            subject: c.subject,
            branch: parentBranch,
            parentClass: c
          });
        });
      }
    });
    return list;
  }, [classes, user]);

  // Helper to find slot entry for day and time with optional branch filtering
  const getSlotEntry = (timeSlot, dayName) => {
    return allTimetableEntries.find((e) => {
      if (!e.day || e.day.toLowerCase() !== dayName.toLowerCase()) return false;
      if (!timesMatch(e.time, timeSlot)) return false;
      if (branchFilter !== 'All') {
        const br = (e.branch || '').toLowerCase();
        if (!br.includes(branchFilter.toLowerCase())) return false;
      }
      return true;
    });
  };

  // Executive KPI stats for teacher's timetable
  const totalWeeklyLectures = allTimetableEntries.length;
  const todayDayName = useMemo(() => new Date().toLocaleDateString('en-US', { weekday: 'long' }), []);
  const todayLectures = useMemo(() => {
    return allTimetableEntries.filter(
      (e) => e.day && e.day.toLowerCase() === todayDayName.toLowerCase()
    );
  }, [allTimetableEntries, todayDayName]);

  const uniqueBatches = useMemo(() => {
    return Array.from(new Set(allTimetableEntries.map((e) => e.class_code || e.name).filter(Boolean)));
  }, [allTimetableEntries]);

  const tarabaiCount = useMemo(() => {
    return allTimetableEntries.filter((e) => (e.branch || '').toLowerCase().includes('tarabai')).length;
  }, [allTimetableEntries]);

  const mangalwarCount = useMemo(() => {
    return allTimetableEntries.filter((e) => (e.branch || '').toLowerCase().includes('mangalwar')).length;
  }, [allTimetableEntries]);

  // Filter students for the selected class modal
  const enrolledStudents = useMemo(() => {
    if (!selectedClass) return [];
    if (batchStudentsList && batchStudentsList.length > 0) {
      return batchStudentsList;
    }
    const stdLower = (selectedClass.standard || selectedClass.name || '').toLowerCase();
    const batchLower = (selectedClass.batch || '').toLowerCase();

    return students.filter((s) => {
      const sStd = (s.standard || '').toLowerCase();
      const sBatch = (s.batch || '').toLowerCase();
      return (
        sStd.includes(stdLower) ||
        stdLower.includes(sStd) ||
        (batchLower && sBatch.includes(batchLower))
      );
    });
  }, [selectedClass, students, batchStudentsList]);

  return (
    <div className="d-flex flex-column w-100" style={{ gap: '22px', minWidth: 0, boxSizing: 'border-box' }}>
      <style>{`
        .teacher-content-card {
          background-color: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 16px;
          box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.05);
          box-sizing: border-box;
        }
        .timetable-table {
          width: 100%;
          min-width: 960px;
          table-layout: fixed;
          border-collapse: separate;
          border-spacing: 0;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          overflow: hidden;
        }
        .timetable-slot-card {
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
        }
        .timetable-slot-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 18px rgba(139, 18, 22, 0.12) !important;
          filter: brightness(0.99);
        }
        .empty-slot-placeholder {
          height: 72px;
          border-radius: 10px;
          border: 1px dashed #E2E8F0;
          color: #CBD5E1;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
        }
        .empty-slot-placeholder:hover {
          background-color: #F8FAFC;
          border-color: #CBD5E1;
        }
        .nav-week-btn {
          width: 34px;
          height: 34px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background-color: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          color: #475569;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .nav-week-btn:hover {
          background-color: #FDF0F0;
          border-color: #FECACA;
          color: #8B1216;
        }
        @media print {
          .nav-week-btn, .no-print, button {
            display: none !important;
          }
          .teacher-content-card {
            box-shadow: none !important;
            border: 1px solid #000 !important;
          }
          .timetable-table {
            min-width: 100% !important;
            border: 1px solid #000 !important;
          }
        }
      `}</style>

      {/* 1. Page Header with Back, Title, Jump to Today, Print, and Real-time Badge */}
      <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 pt-0 pb-1 no-print">
        <div className="d-flex align-items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/teacher/dashboard')}
            className="btn btn-light d-inline-flex align-items-center justify-content-center border shadow-xs flex-shrink-0"
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
            aria-label="Back to dashboard"
            title="Back to dashboard"
          >
            <ArrowLeft size={18} />
          </button>

          <div>
            <div className="d-flex align-items-center gap-2">
              <h1 className="brand-font fw-bold m-0" style={{ fontSize: '22px', lineHeight: 1.25, color: '#0F172A' }}>
                My Weekly Timetable
              </h1>
              <span
                className="badge rounded-pill bg-success-subtle text-success border border-success-subtle d-none d-sm-inline-flex align-items-center gap-1.5 px-2.5 py-1"
                style={{ fontSize: '11px', fontWeight: 600 }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#16A34A',
                    display: 'inline-block'
                  }}
                />
                Live Synced
              </span>
            </div>
            <p className="m-0 mt-0.5 text-sa-muted" style={{ fontSize: '13px' }}>
              Allocated weekly classroom schedules, periods and laboratory timings across campuses
            </p>
          </div>
        </div>

        {/* Quick Header Actions */}
        <div className="d-flex align-items-center gap-2 flex-wrap">
          {/* Jump to Current Week if offset is not 0 */}
          {weekOffset !== 0 && (
            <button
              type="button"
              onClick={() => setWeekOffset(0)}
              className="btn btn-sm btn-light border d-inline-flex align-items-center gap-1.5 fw-semibold text-sa-charcoal shadow-xs"
              style={{ height: '36px', borderRadius: '8px', fontSize: '12px' }}
              title="Return to this current week"
            >
              <RotateCcw size={13} style={{ color: '#8B1216' }} />
              <span>Current Week</span>
            </button>
          )}

          {/* Print Schedule */}
          <button
            type="button"
            onClick={() => window.print()}
            className="btn btn-sm btn-light border d-inline-flex align-items-center gap-1.5 fw-medium text-sa-charcoal shadow-xs"
            style={{ height: '36px', borderRadius: '8px', fontSize: '12px', padding: '0 13px' }}
            title="Print weekly schedule"
          >
            <Printer size={14} style={{ color: '#2563EB' }} />
            <span>Print Timetable</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards (4 Cards) */}
      <div className="row g-3 no-print">
        {/* Card 1: Total Weekly Lectures */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div
            className="p-3 bg-white border rounded-4 shadow-xs h-100 d-flex flex-column justify-content-between"
            style={{ borderColor: '#E2E8F0', borderLeft: '4px solid #8B1216' }}
          >
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-sa-muted fw-semibold" style={{ fontSize: '12px' }}>
                Weekly Lecture Slots
              </span>
              <div
                className="rounded-3 d-flex align-items-center justify-content-center"
                style={{ width: '34px', height: '34px', backgroundColor: '#FDF0F0', color: '#8B1216' }}
              >
                <CalendarCheck size={17} />
              </div>
            </div>
            <div>
              <div className="fw-bold brand-font text-sa-charcoal" style={{ fontSize: '24px', lineHeight: 1.15 }}>
                {!isWeekPublished && !showRoutinePreview ? (
                  <span style={{ color: '#B45309', fontSize: '20px' }}>Pending Release</span>
                ) : (
                  <>
                    {totalWeeklyLectures}{' '}
                    <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748B' }}>slots</span>
                  </>
                )}
              </div>
              <span className="text-sa-muted mt-1 d-block" style={{ fontSize: '11px' }}>
                {!isWeekPublished && !showRoutinePreview
                  ? 'Awaiting Academic Admin release'
                  : 'Allocated across Monday to Saturday'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Today's Schedule */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div
            className="p-3 bg-white border rounded-4 shadow-xs h-100 d-flex flex-column justify-content-between"
            style={{ borderColor: '#E2E8F0', borderLeft: '4px solid #168554' }}
          >
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-sa-muted fw-semibold" style={{ fontSize: '12px' }}>
                Today's Schedule
              </span>
              <div
                className="rounded-3 d-flex align-items-center justify-content-center"
                style={{ width: '34px', height: '34px', backgroundColor: '#DCFCE7', color: '#168554' }}
              >
                <Clock size={17} />
              </div>
            </div>
            <div>
              <div className="fw-bold brand-font text-sa-charcoal" style={{ fontSize: '24px', lineHeight: 1.15 }}>
                {!isWeekPublished && !showRoutinePreview ? (
                  <span style={{ color: '#475569', fontSize: '20px' }}>Upcoming Week</span>
                ) : (
                  <>
                    {todayLectures.length}{' '}
                    <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748B' }}>
                      {todayLectures.length === 1 ? 'lecture' : 'lectures'}
                    </span>
                  </>
                )}
              </div>
              <span
                className="mt-1 d-block fw-semibold"
                style={{
                  fontSize: '11px',
                  color: !isWeekPublished && !showRoutinePreview ? '#B45309' : '#16A34A'
                }}
              >
                {!isWeekPublished && !showRoutinePreview
                  ? `Release pending for ${weekRangeLabel}`
                  : (todayLectures.length > 0 ? `Active today (${todayDayName})` : `No lectures scheduled today (${todayDayName})`)}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Assigned Batches */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div
            className="p-3 bg-white border rounded-4 shadow-xs h-100 d-flex flex-column justify-content-between"
            style={{ borderColor: '#E2E8F0', borderLeft: '4px solid #2563EB' }}
          >
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-sa-muted fw-semibold" style={{ fontSize: '12px' }}>
                Assigned Batches
              </span>
              <div
                className="rounded-3 d-flex align-items-center justify-content-center"
                style={{ width: '34px', height: '34px', backgroundColor: '#EFF6FF', color: '#2563EB' }}
              >
                <GraduationCap size={17} />
              </div>
            </div>
            <div>
              <div className="fw-bold brand-font text-sa-charcoal" style={{ fontSize: '24px', lineHeight: 1.15 }}>
                {uniqueBatches.length}{' '}
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748B' }}>batches</span>
              </div>
              <span className="text-sa-muted mt-1 d-block" style={{ fontSize: '11px' }}>
                {uniqueBatches.slice(0, 3).join(', ') || 'Class divisions'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Teaching Campuses */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div
            className="p-3 bg-white border rounded-4 shadow-xs h-100 d-flex flex-column justify-content-between"
            style={{ borderColor: '#E2E8F0', borderLeft: '4px solid #0D9488' }}
          >
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-sa-muted fw-semibold" style={{ fontSize: '12px' }}>
                Campus Distribution
              </span>
              <div
                className="rounded-3 d-flex align-items-center justify-content-center"
                style={{ width: '34px', height: '34px', backgroundColor: '#F0FDFA', color: '#0D9488' }}
              >
                <Building2 size={17} />
              </div>
            </div>
            <div>
              <div className="fw-bold brand-font text-sa-charcoal" style={{ fontSize: '24px', lineHeight: 1.15 }}>
                {tarabaiCount > 0 && mangalwarCount > 0 ? '2 Campuses' : '1 Campus'}{' '}
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748B' }}>
                  ({tarabaiCount + mangalwarCount} slots)
                </span>
              </div>
              <span className="text-sa-muted mt-1 d-block" style={{ fontSize: '11px' }}>
                Tarabai Park ({tarabaiCount}) • Mangalwar Peth ({mangalwarCount})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Timetable Card with Controls & Grid */}
      <div
        className="teacher-content-card bg-white p-4 shadow-xs"
        style={{
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.05)'
        }}
      >
        {/* Toolbar: Campus Filter Tabs + Week Navigation */}
        <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 pb-3 border-bottom mb-3.5 no-print">
          {/* Left: Campus Filter Tabs */}
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <span className="text-sa-muted fw-semibold small d-none d-sm-inline-flex align-items-center gap-1 me-1">
              <Filter size={13} />
              <span>Campus:</span>
            </span>

            <div className="d-flex p-1 bg-light border rounded-3 shadow-xs" style={{ borderColor: '#E2E8F0' }}>
              <button
                type="button"
                onClick={() => setBranchFilter('All')}
                className={`btn btn-sm px-2.5 py-1 fw-semibold transition-all ${
                  branchFilter === 'All' ? 'bg-sa-maroon text-white shadow-xs' : 'text-sa-charcoal'
                }`}
                style={{
                  backgroundColor: branchFilter === 'All' ? '#8B1216' : 'transparent',
                  borderRadius: '6px',
                  fontSize: '12px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                All Campuses ({totalWeeklyLectures})
              </button>
              <button
                type="button"
                onClick={() => setBranchFilter('Tarabai')}
                className={`btn btn-sm px-2.5 py-1 fw-semibold transition-all ${
                  branchFilter === 'Tarabai' ? 'bg-sa-maroon text-white shadow-xs' : 'text-sa-charcoal'
                }`}
                style={{
                  backgroundColor: branchFilter === 'Tarabai' ? '#8B1216' : 'transparent',
                  borderRadius: '6px',
                  fontSize: '12px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Tarabai Park ({tarabaiCount})
              </button>
              <button
                type="button"
                onClick={() => setBranchFilter('Mangalwar')}
                className={`btn btn-sm px-2.5 py-1 fw-semibold transition-all ${
                  branchFilter === 'Mangalwar' ? 'bg-sa-maroon text-white shadow-xs' : 'text-sa-charcoal'
                }`}
                style={{
                  backgroundColor: branchFilter === 'Mangalwar' ? '#8B1216' : 'transparent',
                  borderRadius: '6px',
                  fontSize: '12px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Mangalwar Peth ({mangalwarCount})
              </button>
            </div>
          </div>

          {/* Right: Week Navigator */}
          <div className="d-flex align-items-center gap-2 flex-wrap ms-auto">
            <div
              className="d-flex align-items-center gap-1.5 px-3 py-1.5 rounded-3 border bg-white shadow-xs"
              style={{ borderColor: '#E2E8F0' }}
            >
              <CalendarDays size={14} style={{ color: '#8B1216' }} />
              <span className="fw-semibold text-sa-charcoal" style={{ fontSize: '12.5px' }}>
                {weekRangeLabel}
              </span>
              {!isWeekPublished && (
                <span
                  className="badge rounded-pill fw-semibold ms-1"
                  style={{
                    backgroundColor: '#FEF3C7',
                    color: '#B45309',
                    fontSize: '10px',
                    border: '1px solid #FDE68A'
                  }}
                >
                  Pending Release
                </span>
              )}
            </div>

            <div className="d-flex align-items-center gap-1">
              <button
                type="button"
                className="nav-week-btn shadow-xs"
                onClick={() => setWeekOffset((prev) => prev - 1)}
                aria-label="Previous week"
                title="Previous week"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                className="nav-week-btn shadow-xs"
                onClick={() => setWeekOffset((prev) => prev + 1)}
                aria-label="Next week"
                title="Next week"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* If week is unpublished and not in routine preview mode, render Schedule Coming Soon State */}
        {!isWeekPublished && !showRoutinePreview ? (
          <div
            className="p-4 p-md-5 text-center d-flex flex-column align-items-center justify-content-center"
            style={{
              backgroundColor: '#FAFAFC',
              borderRadius: '14px',
              border: '2px dashed #CBD5E1',
              minHeight: '380px'
            }}
          >
            {/* Glowing Icon */}
            <div className="position-relative mb-3">
              <div
                className="d-flex align-items-center justify-content-center rounded-circle shadow-sm"
                style={{
                  width: '68px',
                  height: '68px',
                  backgroundColor: '#FFF5F5',
                  border: '2px solid #FECACA',
                  color: '#8B1216'
                }}
              >
                <Clock size={32} strokeWidth={2.2} />
              </div>
              <span
                className="position-absolute bottom-0 end-0 rounded-circle d-flex align-items-center justify-content-center"
                style={{
                  width: '24px',
                  height: '24px',
                  backgroundColor: '#D97706',
                  color: '#FFFFFF',
                  border: '2px solid #FFFFFF',
                  fontSize: '11px',
                  fontWeight: 'bold'
                }}
                title="Schedule pending upload"
              >
                ⏳
              </span>
            </div>

            {/* Badges */}
            <div className="d-flex align-items-center gap-2 mb-2 flex-wrap justify-content-center">
              <span
                className="badge rounded-pill px-3 py-1.5 fw-bold d-inline-flex align-items-center gap-1.5"
                style={{
                  backgroundColor: '#FEF3C7',
                  color: '#92400E',
                  border: '1px solid #FDE68A',
                  fontSize: '12px'
                }}
              >
                <CalendarDays size={13} />
                <span>{weekRangeLabel}</span>
              </span>
              <span
                className="badge rounded-pill px-3 py-1.5 fw-semibold"
                style={{
                  backgroundColor: '#FEE2E2',
                  color: '#991B1B',
                  border: '1px solid #FECACA',
                  fontSize: '12px'
                }}
              >
                Pending Admin Release
              </span>
            </div>

            {/* Main Title & Description */}
            <h3 className="brand-font fw-bold text-sa-charcoal mb-2" style={{ fontSize: '22px' }}>
              Weekly Schedule Coming Soon
            </h3>
            <p className="text-sa-muted mb-4 text-center" style={{ maxWidth: '600px', fontSize: '13.5px', lineHeight: 1.6 }}>
              The Academic Administration has not imported or published the timetable for <strong className="text-sa-charcoal">{weekRangeLabel}</strong> yet. 
              Classroom lectures, lab timings, and campus schedules will appear here automatically once uploaded by Admin.
            </p>

            {/* Admin Notification Status Card */}
            <div
              className="p-3 mb-4 rounded-3 d-flex align-items-center gap-2.5 text-start shadow-xs"
              style={{
                backgroundColor: '#F0FDF4',
                border: '1px solid #BBF7D0',
                maxWidth: '640px'
              }}
            >
              <div
                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: '28px', height: '28px', backgroundColor: '#DCFCE7', color: '#15803D' }}
              >
                <CheckCircle2 size={16} />
              </div>
              <div style={{ fontSize: '12.5px', color: '#166534', lineHeight: 1.45 }}>
                <strong>Notification Delivered to Academic Administration:</strong> Academic Admin has been alerted that faculty accessed this upcoming week schedule. You will be alerted once the timetable is uploaded or configured.
              </div>
            </div>

            {/* Action Buttons */}
            <div className="d-flex align-items-center gap-2.5 flex-wrap justify-content-center">
              {/* Return to Current Week */}
              <button
                type="button"
                onClick={() => setWeekOffset(0)}
                className="btn btn-sm btn-white border d-inline-flex align-items-center gap-2 px-3 py-2 fw-semibold text-sa-charcoal shadow-xs"
                style={{
                  height: '38px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  backgroundColor: '#FFFFFF',
                  borderColor: '#CBD5E1'
                }}
              >
                <RotateCcw size={14} style={{ color: '#8B1216' }} />
                <span>Return to Current Week</span>
              </button>

              {/* Notify Admin Button */}
              <button
                type="button"
                onClick={handleNotifyAdmin}
                className="btn btn-sm d-inline-flex align-items-center gap-2 px-3 py-2 fw-semibold text-white shadow-xs"
                style={{
                  height: '38px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  backgroundColor: isWeekRequested ? '#475569' : '#8B1216',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <Bell size={14} />
                <span>{isWeekRequested ? '✓ Alert Sent to Admin (Resend)' : 'Notify Academic Admin'}</span>
              </button>

              {/* Toggle Preview of Routine */}
              <button
                type="button"
                onClick={() => setShowRoutinePreview(true)}
                className="btn btn-sm btn-light border d-inline-flex align-items-center gap-2 px-3 py-2 fw-medium text-sa-charcoal shadow-xs"
                style={{
                  height: '38px',
                  borderRadius: '8px',
                  fontSize: '12.5px'
                }}
                title="View standard recurring schedule routine"
              >
                <Layers size={14} style={{ color: '#2563EB' }} />
                <span>Preview Standard Routine</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* If in preview mode on an unpublished week, show preview alert banner */}
            {!isWeekPublished && showRoutinePreview && (
              <div
                className="p-3 mb-3 rounded-3 border d-flex align-items-center justify-content-between gap-3 shadow-xs"
                style={{
                  backgroundColor: '#FFFBEB',
                  borderColor: '#FDE68A'
                }}
              >
                <div className="d-flex align-items-center gap-2.5">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: '28px', height: '28px', backgroundColor: '#FEF3C7', color: '#92400E' }}
                  >
                    <AlertCircle size={16} />
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#92400E' }}>
                    <strong>Preview Mode:</strong> Displaying standard recurring timetable routine for reference. Official schedule for <strong>{weekRangeLabel}</strong> has not been published by Academic Admin yet.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRoutinePreview(false)}
                  className="btn btn-sm btn-light border fw-semibold text-sa-charcoal flex-shrink-0 shadow-xs"
                  style={{ height: '32px', fontSize: '12px', borderRadius: '6px' }}
                >
                  Close Preview
                </button>
              </div>
            )}

            {/* Timetable Grid Table */}
            <div
              className="table-responsive"
              style={{
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'thin',
                borderRadius: '12px',
                border: '1px solid #E2E8F0'
              }}
            >
          <table className="timetable-table m-0">
            <thead>
              <tr>
                <th
                  style={{
                    width: '160px',
                    minWidth: '160px',
                    backgroundColor: '#F8FAFC',
                    borderBottom: '2px solid #E2E8F0',
                    borderRight: '1.5px solid #E2E8F0',
                    padding: '12px 14px',
                    textAlign: 'left',
                    color: '#475569',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase'
                  }}
                >
                  <div className="d-flex align-items-center gap-1.5">
                    <Clock size={13} style={{ color: '#8B1216' }} />
                    <span>Time Slot</span>
                  </div>
                </th>
                {currentWeekDays.map((dateObj, idx) => {
                  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
                  const dateShort = `${dateObj.getDate()} ${dateObj.toLocaleDateString('en-GB', { month: 'short' })}`;
                  const isCurrentDay = isToday(dateObj);

                  return (
                    <th
                      key={idx}
                      style={{
                        width: '14%',
                        minWidth: '135px',
                        backgroundColor: isCurrentDay ? '#FFF5F5' : '#F8FAFC',
                        borderBottom: isCurrentDay ? '2.5px solid #8B1216' : '2px solid #E2E8F0',
                        borderRight: idx === 5 ? 'none' : '1px solid #E2E8F0',
                        padding: '12px 10px',
                        textAlign: 'center'
                      }}
                    >
                      <div className="d-flex flex-column align-items-center gap-1">
                        <div className="d-flex align-items-center gap-1.5">
                          <span
                            style={{
                              fontSize: '12px',
                              fontWeight: 700,
                              color: isCurrentDay ? '#8B1216' : '#334155',
                              letterSpacing: '0.03em',
                              textTransform: 'uppercase'
                            }}
                          >
                            {dayName}
                          </span>
                          {isCurrentDay && (
                            <span
                              className="badge rounded-pill"
                              style={{
                                backgroundColor: '#8B1216',
                                color: '#FFFFFF',
                                fontSize: '9px',
                                padding: '2px 6px',
                                fontWeight: 700
                              }}
                            >
                              Today
                            </span>
                          )}
                        </div>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            color: isCurrentDay ? '#8B1216' : '#64748B'
                          }}
                        >
                          {dateShort}
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {timetableTimeSlots.map((slot, sIdx) => {
                const parts = slot.split(/[-–—]/);
                const startTime = parts[0]?.trim() || slot;
                const endTime = parts[1]?.trim() || '';

                return (
                  <tr key={sIdx}>
                    {/* Time Slot Column */}
                    <td
                      style={{
                        backgroundColor: '#FAFBFD',
                        borderRight: '1.5px solid #E2E8F0',
                        borderBottom: sIdx === timetableTimeSlots.length - 1 ? 'none' : '1px solid #F1F5F9',
                        padding: '10px 14px',
                        verticalAlign: 'middle',
                        textAlign: 'left'
                      }}
                    >
                      <div className="d-flex flex-column">
                        <span className="fw-bold text-sa-charcoal" style={{ fontSize: '12px', lineHeight: 1.2 }}>
                          {startTime}
                        </span>
                        {endTime && (
                          <span className="text-sa-muted small" style={{ fontSize: '10.5px', marginTop: '2px' }}>
                            to {endTime}
                          </span>
                        )}
                        <span className="badge bg-light text-muted border align-self-start mt-1.5" style={{ fontSize: '9px', padding: '1px 5px' }}>
                          60 mins
                        </span>
                      </div>
                    </td>

                    {/* Day Slot Cells */}
                    {currentWeekDays.map((dateObj, dIdx) => {
                      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
                      const entry = getSlotEntry(slot, dayName);
                      const isCurrentDay = isToday(dateObj);

                      if (!entry) {
                        return (
                          <td
                            key={dIdx}
                            style={{
                              backgroundColor: isCurrentDay ? '#FFFDFD' : '#FFFFFF',
                              borderRight: dIdx === 5 ? 'none' : '1px solid #F8FAFC',
                              borderBottom: sIdx === timetableTimeSlots.length - 1 ? 'none' : '1px solid #F8FAFC',
                              verticalAlign: 'middle',
                              padding: '8px'
                            }}
                          >
                            <div className="empty-slot-placeholder">
                              <span style={{ fontSize: '13px', opacity: 0.5 }}>—</span>
                            </div>
                          </td>
                        );
                      }

                      const style = getTimetableSlotStyle(entry.class_code, entry.subject);
                      const slotBranch = entry.branch || entry.parentClass?.branch || 'Tarabai Park';
                      const isMangalwar = slotBranch.toLowerCase().includes('mangalwar');

                      return (
                        <td
                          key={dIdx}
                          style={{
                            backgroundColor: isCurrentDay ? '#FFFDFD' : '#FFFFFF',
                            borderRight: dIdx === 5 ? 'none' : '1px solid #F8FAFC',
                            borderBottom: sIdx === timetableTimeSlots.length - 1 ? 'none' : '1px solid #F8FAFC',
                            verticalAlign: 'middle',
                            padding: '6px'
                          }}
                        >
                          <div
                            className="timetable-slot-card"
                            style={{
                              backgroundColor: style.bg,
                              border: `1px solid ${style.border}`,
                              borderLeft: `3.5px solid ${style.borderLeft}`,
                              borderRadius: '10px',
                              padding: '9px 10px',
                              cursor: 'pointer',
                              boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
                              textAlign: 'left'
                            }}
                            onClick={() => {
                              const matched = entry.parentClass || classes.find((c) => c.class_code === entry.class_code);
                              if (matched) openViewClassModal(matched);
                            }}
                            title={`${entry.class_code} (${entry.subject}) • ${entry.room || 'Room 201'} • ${slotBranch} - Click to view class roster & details`}
                          >
                            {/* Row 1: Class Code + Room Pill */}
                            <div className="d-flex align-items-center justify-content-between gap-1 mb-1">
                              <span
                                className="fw-bold brand-font"
                                style={{
                                  fontSize: '13px',
                                  color: style.color,
                                  letterSpacing: '0.02em',
                                  lineHeight: 1.1
                                }}
                              >
                                {entry.class_code}
                              </span>
                              {entry.room && (
                                <span
                                  className="d-inline-flex align-items-center gap-1 px-1.5 py-0.5 rounded"
                                  style={{
                                    fontSize: '9.5px',
                                    fontWeight: 600,
                                    backgroundColor: '#FFFFFF',
                                    color: '#475569',
                                    border: '1px solid #E2E8F0'
                                  }}
                                >
                                  <DoorOpen size={9.5} style={{ color: '#64748B' }} />
                                  <span>{entry.room}</span>
                                </span>
                              )}
                            </div>

                            {/* Row 2: Subject with Colored Dot */}
                            <div className="d-flex align-items-center gap-1.5 mb-2">
                              <span
                                style={{
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  backgroundColor: style.accentDot,
                                  flexShrink: 0
                                }}
                              />
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  color: style.color
                                }}
                              >
                                {entry.subject}
                              </span>
                            </div>

                            {/* Row 3: Campus Badge with MapPin */}
                            <div className="d-flex align-items-center justify-content-between">
                              <span
                                className="d-inline-flex align-items-center gap-1 px-2 py-0.5 rounded-pill"
                                style={{
                                  fontSize: '9.5px',
                                  fontWeight: 600,
                                  backgroundColor: isMangalwar ? '#F0FDFA' : '#FFFFFF',
                                  color: isMangalwar ? '#0D9488' : style.color,
                                  border: isMangalwar ? '1px solid #99F6E4' : `1px solid ${style.border}`,
                                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                <MapPin size={9.5} style={{ color: isMangalwar ? '#0D9488' : style.color }} />
                                <span>{slotBranch}</span>
                              </span>

                              <span
                                className="text-muted small fw-medium"
                                style={{ fontSize: '9px' }}
                              >
                                60m
                              </span>
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </>
    )}

        {/* 4. Bottom Legend & Helpful Tips */}
        <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 pt-3 mt-3 border-top no-print">
          <div className="d-flex align-items-center gap-3 flex-wrap">
            <span className="small fw-semibold text-sa-muted" style={{ fontSize: '11.5px' }}>
              Campus Color Key:
            </span>
            <div className="d-flex align-items-center gap-1.5">
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#8B1216' }} />
              <span className="text-sa-charcoal fw-medium small" style={{ fontSize: '11.5px' }}>Tarabai Park</span>
            </div>
            <div className="d-flex align-items-center gap-1.5">
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0D9488' }} />
              <span className="text-sa-charcoal fw-medium small" style={{ fontSize: '11.5px' }}>Mangalwar Peth</span>
            </div>
          </div>
        </div>
      </div>

      {/* VIEW CLASS DETAILS MODAL */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title={selectedClass ? `${selectedClass.name} • ${selectedClass.subject} Details` : 'Class Details'}
        size="lg"
      >
        {selectedClass && (
          <div className="d-flex flex-column gap-3.5">
            {/* Class Details Banner */}
            <div
              className="p-3 rounded-3"
              style={{
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0'
              }}
            >
              <div className="row g-2.5">
                <div className="col-6 col-md-4">
                  <span className="small text-muted d-block" style={{ fontSize: '11.5px' }}>Subject</span>
                  <span className="fw-bold" style={{ color: '#0F172A', fontSize: '13.5px' }}>
                    {selectedClass.subject}
                  </span>
                </div>
                <div className="col-6 col-md-4">
                  <span className="small text-muted d-block" style={{ fontSize: '11.5px' }}>Branch</span>
                  <span className="fw-bold d-flex align-items-center gap-1" style={{ color: '#0F172A', fontSize: '13.5px' }}>
                    <MapPin size={12} style={{ color: '#8B1216' }} />
                    {selectedClass.branch || 'Tarabai Park'}
                  </span>
                </div>
                <div className="col-6 col-md-4">
                  <span className="small text-muted d-block" style={{ fontSize: '11.5px' }}>Batch</span>
                  <span className="fw-bold" style={{ color: '#0F172A', fontSize: '13.5px' }}>
                    Batch {selectedClass.batch}
                  </span>
                </div>
                <div className="col-6 col-md-4">
                  <span className="small text-muted d-block" style={{ fontSize: '11.5px' }}>Classroom / Lab</span>
                  <span className="fw-bold" style={{ color: '#0F172A', fontSize: '13.5px' }}>
                    {selectedClass.room}
                  </span>
                </div>
                <div className="col-6 col-md-4">
                  <span className="small text-muted d-block" style={{ fontSize: '11.5px' }}>Class Timing</span>
                  <span className="fw-bold" style={{ color: '#0F172A', fontSize: '13.5px' }}>
                    {selectedClass.time}
                  </span>
                </div>
                <div className="col-6 col-md-4">
                  <span className="small text-muted d-block" style={{ fontSize: '11.5px' }}>Assigned Faculty</span>
                  <span className="fw-bold" style={{ color: '#0F172A', fontSize: '13.5px' }}>
                    {selectedClass.teacher_name || user?.name || 'Dr. Priya Kulkarni'}
                  </span>
                </div>
                <div className="col-6 col-md-4">
                  <span className="small text-muted d-block" style={{ fontSize: '11.5px' }}>Total Enrollment</span>
                  <span className="fw-bold" style={{ color: '#8B1216', fontSize: '13.5px' }}>
                    {selectedClass.studentsCount} Students
                  </span>
                </div>
              </div>
            </div>

            {/* Direct Navigation & Action Buttons */}
            <div className="d-flex flex-wrap gap-2 pt-2 border-top">
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  setViewModalOpen(false);
                  navigate('/teacher/attendance');
                }}
              >
                <CalendarCheck size={14} className="me-1.5" /> Mark Class Attendance
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setViewModalOpen(false);
                  navigate('/teacher/students');
                }}
              >
                <Users size={14} className="me-1.5" /> Student Directory
              </Button>
            </div>

            {/* Enrolled Students Table */}
            <div>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <h4 className="fw-bold m-0" style={{ fontSize: '14px', color: '#0F172A' }}>
                  Enrolled Students ({enrolledStudents.length > 0 ? enrolledStudents.length : selectedClass.studentsCount})
                </h4>
                <span className="small text-muted" style={{ fontSize: '12px' }}>
                  Batch: {selectedClass.batch} • {selectedClass.standard}
                </span>
              </div>

              {loadingStudents ? (
                <div className="text-center py-4 bg-light rounded border text-muted small">
                  <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                  Loading enrolled students...
                </div>
              ) : enrolledStudents.length === 0 ? (
                <div className="text-center py-4 bg-light rounded border text-muted small">
                  Showing batch summary: {selectedClass.studentsCount} students registered in this batch.
                </div>
              ) : (
                <div className="table-responsive border rounded" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  <table className="table table-hover table-sm m-0" style={{ fontSize: '12.5px' }}>
                    <thead className="table-light position-sticky top-0" style={{ zIndex: 1 }}>
                      <tr>
                        <th>Roll No</th>
                        <th>Student Name</th>
                        <th>Class & Batch</th>
                        <th>Attendance</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrolledStudents.map((s, idx) => (
                        <tr key={idx}>
                          <td className="fw-bold" style={{ color: '#8B1216' }}>
                            {s.rollNumber || s.student_id || `STU-${1000 + idx}`}
                          </td>
                          <td className="fw-semibold text-dark">{s.name || s.full_name}</td>
                          <td>{s.standard} ({s.batch || selectedClass.batch})</td>
                          <td className="text-success fw-bold">
                            {s.attendancePercent ? `${s.attendancePercent}%` : '92%'}
                          </td>
                          <td>
                            <span
                              className="badge rounded-pill fw-medium"
                              style={{
                                backgroundColor: '#ECFDF5',
                                color: '#059669',
                                border: '1px solid #A7F3D0',
                                fontSize: '10px'
                              }}
                            >
                              Active
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
