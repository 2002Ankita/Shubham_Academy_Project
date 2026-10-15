import React, { useState, useEffect, useContext, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Users,
  Calendar,
  MapPin,
  Clock,
  ArrowLeft,
  MoreVertical,
  Eye,
  ChevronLeft,
  ChevronRight,
  Zap,
  Edit2,
  X,
  CheckCircle2,
  CalendarCheck
} from 'lucide-react';
import { toast } from 'react-toastify';
import AuthContext from '../../context/AuthContext';
import batchService from '../../services/batchService';
import studentService from '../../services/studentService';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

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

// Palette helper for timetable slots
const getTimetableSlotStyle = (classCode = '', subject = '') => {
  const code = String(classCode || '').toUpperCase();
  const sub = String(subject || '').toLowerCase();

  if (code.includes('11-A') || (code.includes('12-A') && sub.includes('phys'))) {
    return {
      bg: '#E0F2FE',
      color: '#0369A1',
      border: '1px solid #BAE6FD'
    };
  }
  if (code.includes('12-B') || code.includes('11-B')) {
    return {
      bg: '#EDE9FE',
      color: '#6D28D9',
      border: '1px solid #DDD6FE'
    };
  }
  return {
    bg: '#DCFCE7',
    color: '#15803D',
    border: '1px solid #BBF7D0'
  };
};

export default function MyClasses() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);

  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [editForm, setEditForm] = useState({ time: '', room: '', date: '' });

  // Dropdown menu state
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch batches and students from backend
  const fetchClassesAndStudents = async () => {
    try {
      setLoading(true);
      const [batchData, studentData] = await Promise.all([
        batchService.getBatches().catch(() => []),
        studentService.getAll().catch(() => [])
      ]);

      setStudents(Array.isArray(studentData) ? studentData : []);

      // Filter batches assigned to current teacher
      let teacherBatches = batchData;
      if (user && user.role === 'teacher' && user.name) {
        const firstName = user.name.split(' ')[0].toLowerCase();
        teacherBatches = batchData.filter((b) => {
          if (!b.teacher_name) return true;
          const bTeacher = b.teacher_name.toLowerCase();
          return (
            bTeacher.includes(firstName) ||
            user.name.toLowerCase().includes(bTeacher)
          );
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
  }, [user]);

  // Handle Edit Schedule
  const openEditModal = (c) => {
    setEditingClass(c);
    setEditForm({ time: c.time, room: c.room, date: c.date });
    setOpenDropdownId(null);
    setEditModalOpen(true);
  };

  const handleUpdateSchedule = async (e) => {
    e.preventDefault();
    if (!editingClass) return;
    try {
      await batchService.updateBatch(editingClass.originalId, {
        name: editingClass.name,
        standard: editingClass.standard,
        subject: editingClass.subject,
        student_count: editingClass.studentsCount,
        teacher_name: editingClass.teacher_name,
        batch_name: editingClass.batch,
        class_code: editingClass.class_code,
        days: editingClass.days,
        timetable: editingClass.timetable,
        time: editForm.time,
        date: editForm.date,
        room: editForm.room
      });
      toast.success('Schedule updated successfully');
      setEditModalOpen(false);
      fetchClassesAndStudents();
    } catch (err) {
      toast.error('Failed to update schedule');
    }
  };

  // Handle View Class Modal
  const openViewClassModal = (cls) => {
    if (!cls) return;
    setSelectedClass(cls);
    setOpenDropdownId(null);
    setViewModalOpen(true);
  };

  // Dynamic Week Calculation (Monday to Friday)
  const currentWeekDays = useMemo(() => {
    const now = new Date();
    // Monday as index 0 (0 = Mon, 1 = Tue, ..., 6 = Sun)
    const dayOfWeek = (now.getDay() + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - dayOfWeek + weekOffset * 7);
    monday.setHours(0, 0, 0, 0);

    const weekDays = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      weekDays.push(d);
    }
    return weekDays;
  }, [weekOffset]);

  // Week range label e.g. "Mon, 12 Oct – Fri, 16 Oct 2026"
  const weekRangeLabel = useMemo(() => {
    if (!currentWeekDays.length) return '';
    const mon = currentWeekDays[0];
    const fri = currentWeekDays[4];
    const startStr = mon.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
    const endStr = fri.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    return `${startStr} – ${endStr}`;
  }, [currentWeekDays]);

  // Today's formatted label e.g. "Thu, 15 Oct 2026"
  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }, []);

  // Today's day name in lowercase
  const todayDayName = useMemo(() => {
    return new Date().toLocaleDateString('en-US', { weekday: 'long' });
  }, []);

  // Tomorrow's day name in lowercase
  const tomorrowDayName = useMemo(() => {
    const tom = new Date();
    tom.setDate(tom.getDate() + 1);
    return tom.toLocaleDateString('en-US', { weekday: 'long' });
  }, []);

  // Timetable Slots List (4 standard periods)
  const timetableTimeSlots = useMemo(() => {
    return [
      '09:00 AM – 10:00 AM',
      '10:00 AM – 11:00 AM',
      '11:00 AM – 12:00 PM',
      '12:00 PM – 01:00 PM'
    ];
  }, []);

  // All weekly timetable entries across assigned batches
  const allTimetableEntries = useMemo(() => {
    const list = [];
    classes.forEach((c) => {
      if (Array.isArray(c.timetable) && c.timetable.length > 0) {
        c.timetable.forEach((slot) => {
          list.push({
            ...slot,
            class_code: slot.class_code || c.class_code || c.name,
            subject: slot.subject || c.subject,
            room: slot.room || c.room,
            parentClass: c
          });
        });
      } else {
        (c.days || []).forEach((d) => {
          list.push({
            day: d,
            time: c.time,
            room: c.room,
            class_code: c.class_code || c.name,
            subject: c.subject,
            parentClass: c
          });
        });
      }
    });
    return list;
  }, [classes]);

  // Helper to find slot entry for day and time
  const getSlotEntry = (timeSlot, dayName) => {
    return allTimetableEntries.find(
      (e) =>
        e.day &&
        e.day.toLowerCase() === dayName.toLowerCase() &&
        timesMatch(e.time, timeSlot)
    );
  };

  // Today's Classes List
  const todayClassesList = useMemo(() => {
    const list = classes.filter((c) => {
      if (c.days && c.days.some((d) => d.toLowerCase() === todayDayName.toLowerCase())) {
        return true;
      }
      if (c.timetable && c.timetable.some((t) => t.day && t.day.toLowerCase() === todayDayName.toLowerCase())) {
        return true;
      }
      return false;
    });

    const result = list.length > 0 ? list : classes;
    return [...result].sort(
      (a, b) => getMinutesFromTimeString(a.time) - getMinutesFromTimeString(b.time)
    );
  }, [classes, todayDayName]);

  // Upcoming Classes List grouped by Today & Tomorrow
  const upcomingClassesGroups = useMemo(() => {
    const groups = {
      today: [],
      tomorrow: []
    };

    if (todayClassesList.length > 0) {
      groups.today = todayClassesList.slice(1, 2).map((c) => ({
        time: c.time ? c.time.split(/[–-]/)[0].trim() : '12:30 PM',
        title: `${c.standard || c.name} – ${c.subject}`,
        room: c.room || 'Room 305',
        badgeBg: '#F3E8FF',
        badgeColor: '#7E22CE',
        classRef: c
      }));
    }

    const tomorrowClasses = classes.filter((c) => {
      if (c.days && c.days.some((d) => d.toLowerCase() === tomorrowDayName.toLowerCase())) {
        return true;
      }
      if (c.timetable && c.timetable.some((t) => t.day && t.day.toLowerCase() === tomorrowDayName.toLowerCase())) {
        return true;
      }
      return false;
    });

    const tomList = tomorrowClasses.length > 0 ? tomorrowClasses : classes.slice(0, 2);
    groups.tomorrow = tomList.map((c, idx) => ({
      time: c.time ? c.time.split(/[–-]/)[0].trim() : idx === 0 ? '09:00 AM' : '11:30 AM',
      title: `${c.standard || c.name} – ${c.subject}`,
      room: c.room || (idx === 0 ? 'Room 201' : 'Room 202'),
      badgeBg: idx === 0 ? '#E0F2FE' : '#DCFCE7',
      badgeColor: idx === 0 ? '#0369A1' : '#15803D',
      classRef: c
    }));

    return groups;
  }, [classes, todayClassesList, tomorrowDayName]);

  // Filter students for the selected class modal
  const enrolledStudents = useMemo(() => {
    if (!selectedClass) return [];
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
  }, [selectedClass, students]);

  return (
    <div className="d-flex flex-column w-100" style={{ gap: '22px', minWidth: 0, boxSizing: 'border-box' }}>
      <style>{`
        .teacher-content-card {
          background-color: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 14px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
          box-sizing: border-box;
        }
        .class-card-item {
          background-color: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          transition: transform 0.16s ease, box-shadow 0.16s ease;
          padding: 16px 18px;
        }
        .class-card-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05);
        }
        .view-class-btn {
          background-color: #8B1216;
          color: #FFFFFF;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 13px;
          padding: 8px 12px;
          height: 36px;
          transition: background-color 0.15s ease;
          cursor: pointer;
        }
        .view-class-btn:hover {
          background-color: #730E12;
          color: #FFFFFF;
        }
        .timetable-table {
          width: 100%;
          table-layout: fixed;
          border-collapse: separate;
          border-spacing: 0;
        }
        .timetable-table th {
          background-color: #FAFAFA;
          border-bottom: 1px solid #E2E8F0;
          border-right: 1px solid #F1F5F9;
          padding: 10px 8px;
          text-align: center;
          font-size: 12px;
          color: #0F172A;
          font-weight: 600;
        }
        .timetable-table th:first-child {
          text-align: left;
          padding-left: 14px;
          font-size: 12px;
        }
        .timetable-table th:last-child,
        .timetable-table td:last-child {
          border-right: none;
        }
        .timetable-table td {
          border-bottom: 1px solid #F1F5F9;
          border-right: 1px solid #F1F5F9;
          padding: 8px 6px;
          vertical-align: middle;
          text-align: center;
          height: 58px;
          box-sizing: border-box;
        }
        .timetable-table td:first-child {
          text-align: left;
          padding-left: 14px;
          padding-right: 10px;
          font-size: 12px;
          font-weight: 500;
          color: #475569;
          white-space: nowrap;
        }
        .timetable-table tr:last-child td {
          border-bottom: none;
        }
        .timetable-slot-pill {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 5px 8px;
          border-radius: 6px;
          width: 100%;
          max-width: 130px;
          margin: 0 auto;
          box-sizing: border-box;
          transition: transform 0.12s ease;
          cursor: pointer;
        }
        .timetable-slot-pill:hover {
          transform: scale(1.02);
          opacity: 0.95;
        }
        .nav-week-btn {
          width: 28px;
          height: 28px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background-color: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 6px;
          color: #475569;
          cursor: pointer;
          transition: background-color 0.15s ease, border-color 0.15s ease;
        }
        .nav-week-btn:hover {
          background-color: #F8FAFC;
          border-color: #CBD5E1;
        }
        .today-class-row {
          border-bottom: 1px solid #F1F5F9;
          padding-bottom: 14px;
        }
        .today-class-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .action-dropdown-menu {
          position: absolute;
          right: 0;
          top: 100%;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
          z-index: 50;
          min-width: 150px;
          padding: 4px 0;
        }
        .action-dropdown-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 7px 14px;
          font-size: 12px;
          color: #334155;
          text-decoration: none;
          background: none;
          border: none;
          width: 100%;
          text-align: left;
          cursor: pointer;
        }
        .action-dropdown-item:hover {
          background-color: #F8FAFC;
          color: #0F172A;
        }
        .upcoming-item-clickable {
          cursor: pointer;
          border-radius: 8px;
          padding: 6px 10px;
          margin: -4px -8px;
          transition: background-color 0.15s ease;
        }
        .upcoming-item-clickable:hover {
          background-color: #F8FAFC;
        }
      `}</style>

      {/* 1. Page Header */}
      <div className="d-flex align-items-center gap-3 pt-0 pb-0.5">
        <button
          type="button"
          onClick={() => navigate('/teacher/dashboard')}
          className="btn btn-light d-inline-flex align-items-center justify-content-center border shadow-sm flex-shrink-0"
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
          <h1 className="brand-font fw-bold m-0" style={{ fontSize: '23px', lineHeight: 1.25, color: '#0F172A' }}>
            My Classes & Timetable
          </h1>
          <p className="m-0 mt-0.5" style={{ fontSize: '13.5px', color: '#64748B' }}>
            Active teaching batches, course syllabus pacing, and classroom schedules
          </p>
        </div>
      </div>

      {/* CARD 1: My Classes (Full Width) */}
      <div className="teacher-content-card p-4" ref={dropdownRef}>
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between mb-3.5">
          <div className="d-flex align-items-center gap-2">
            <div
              className="d-flex align-items-center justify-content-center"
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                backgroundColor: '#FEE2E2',
                color: '#8B1216'
              }}
            >
              <Zap size={16} />
            </div>
            <h2 className="brand-font fw-bold m-0" style={{ fontSize: '16.5px', color: '#0F172A' }}>
              My Classes
            </h2>
          </div>

          <span
            className="badge rounded-pill fw-semibold"
            style={{
              backgroundColor: '#FEE2E2',
              color: '#8B1216',
              border: '1px solid #FECACA',
              fontSize: '12px',
              padding: '5px 12px'
            }}
          >
            {classes.length} Classes Assigned
          </span>
        </div>

        {/* Class Cards Grid */}
        {loading ? (
          <div className="text-center py-5 text-muted small">Loading assigned classes...</div>
        ) : classes.length === 0 ? (
          <div className="text-center py-5 text-muted small">No classes assigned yet.</div>
        ) : (
          <div className="row g-3.5">
            {classes.map((c, i) => {
              const badgeStyle = getStandardBadgeStyle(c.standard, c.subject);
              const isDropdownOpen = openDropdownId === c.id;

              return (
                <div key={c.id || i} className="col-12 col-md-4">
                  <div className="class-card-item h-100 d-flex flex-column justify-content-between">
                    <div>
                      {/* Top Row: Pill + Name + 3-dot Menu */}
                      <div className="d-flex align-items-center justify-content-between mb-3 position-relative">
                        <div className="d-flex align-items-center gap-2 min-w-0">
                          <span
                            className="badge fw-bold flex-shrink-0"
                            style={{
                              backgroundColor: badgeStyle.bg,
                              color: badgeStyle.color,
                              border: badgeStyle.border,
                              fontSize: '11px',
                              padding: '3px 8px',
                              borderRadius: '6px'
                            }}
                          >
                            {badgeStyle.label}
                          </span>
                          <h3
                            className="brand-font fw-bold m-0 text-truncate"
                            style={{ fontSize: '15px', color: '#0F172A' }}
                            title={c.name}
                          >
                            {c.name}
                          </h3>
                        </div>

                        {/* 3-dots Menu Button */}
                        <div className="position-relative flex-shrink-0">
                          <button
                            type="button"
                            className="btn btn-sm btn-link p-1 text-secondary text-decoration-none"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdownId(isDropdownOpen ? null : c.id);
                            }}
                            aria-label="Class actions"
                            title="Class Options"
                          >
                            <MoreVertical size={16} />
                          </button>

                          {isDropdownOpen && (
                            <div className="action-dropdown-menu">
                              <button
                                type="button"
                                className="action-dropdown-item"
                                onClick={() => openViewClassModal(c)}
                              >
                                <Eye size={13} /> View Class
                              </button>
                              <button
                                type="button"
                                className="action-dropdown-item"
                                onClick={() => openEditModal(c)}
                              >
                                <Edit2 size={13} /> Edit Schedule
                              </button>
                              <button
                                type="button"
                                className="action-dropdown-item"
                                onClick={() => navigate('/teacher/attendance')}
                              >
                                <CalendarCheck size={13} /> Attendance
                              </button>
                              <button
                                type="button"
                                className="action-dropdown-item"
                                onClick={() => navigate('/teacher/students')}
                              >
                                <Users size={13} /> Students
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Class Attributes with exact spacing */}
                      <div className="d-flex flex-column gap-2 mb-3.5 small">
                        <div className="d-flex align-items-center gap-2">
                          <BookOpen size={14} className="flex-shrink-0" style={{ color: '#64748B' }} />
                          <span style={{ fontSize: '12.5px', color: '#334155', fontWeight: 600 }}>
                            {c.subject}
                          </span>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <Calendar size={14} className="flex-shrink-0" style={{ color: '#64748B' }} />
                          <span style={{ fontSize: '12.5px', color: '#475569' }}>
                            Batch: {c.batch}
                          </span>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <Users size={14} className="flex-shrink-0" style={{ color: '#64748B' }} />
                          <span style={{ fontSize: '12.5px', color: '#475569' }}>
                            Students: {c.studentsCount}
                          </span>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <MapPin size={14} className="flex-shrink-0" style={{ color: '#64748B' }} />
                          <span style={{ fontSize: '12.5px', color: '#475569' }}>
                            {c.room}
                          </span>
                        </div>
                        <div className="d-flex align-items-center gap-2" style={{ minWidth: 0 }}>
                          <Clock size={14} className="flex-shrink-0" style={{ color: '#64748B' }} />
                          <span style={{ fontSize: '12px', color: '#475569', whiteSpace: 'nowrap' }} title={`Time: ${c.time}`}>
                            Time: {c.time}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom View Class Button */}
                    <button
                      type="button"
                      className="view-class-btn w-100 d-flex align-items-center justify-content-center gap-1.5 shadow-sm mt-1"
                      onClick={() => openViewClassModal(c)}
                    >
                      <Eye size={15} />
                      <span>View Class</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CARD 2: Weekly Timetable (Full Width) */}
      <div className="teacher-content-card p-4">
        {/* Header with Navigation */}
        <div className="d-flex align-items-center justify-content-between mb-3.5">
          <div className="d-flex align-items-center gap-2">
            <div
              className="d-flex align-items-center justify-content-center"
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                backgroundColor: '#FEE2E2',
                color: '#8B1216'
              }}
            >
              <Calendar size={16} />
            </div>
            <h2 className="brand-font fw-bold m-0" style={{ fontSize: '16.5px', color: '#0F172A' }}>
              Weekly Timetable
            </h2>
          </div>

          <div className="d-flex align-items-center gap-2.5">
            <span className="small fw-medium text-secondary text-nowrap" style={{ fontSize: '12.5px' }}>
              {weekRangeLabel}
            </span>
            <div className="d-flex align-items-center gap-1 flex-shrink-0">
              <button
                type="button"
                className="nav-week-btn"
                onClick={() => setWeekOffset((prev) => prev - 1)}
                aria-label="Previous week"
                title="Previous week"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                type="button"
                className="nav-week-btn"
                onClick={() => setWeekOffset((prev) => prev + 1)}
                aria-label="Next week"
                title="Next week"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Timetable Grid Table - Full Width with generous column space */}
        <div className="table-responsive" style={{ overflowX: 'auto' }}>
          <table className="timetable-table">
            <thead>
              <tr>
                <th style={{ width: '20%' }}>Time</th>
                {currentWeekDays.map((dateObj, idx) => {
                  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
                  const dateShort = `${dateObj.getDate()} ${dateObj.toLocaleDateString('en-GB', { month: 'short' })}`;
                  return (
                    <th key={idx} style={{ width: '16%' }}>
                      <div>{dayName}</div>
                      <div className="fw-normal text-muted" style={{ fontSize: '11px', marginTop: '2px' }}>
                        {dateShort}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {timetableTimeSlots.map((slot, sIdx) => (
                <tr key={sIdx}>
                  <td>{slot}</td>
                  {currentWeekDays.map((dateObj, dIdx) => {
                    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
                    const entry = getSlotEntry(slot, dayName);

                    if (!entry) {
                      return (
                        <td key={dIdx}>
                          <span style={{ color: '#94A3B8', fontSize: '14px' }}>—</span>
                        </td>
                      );
                    }

                    const style = getTimetableSlotStyle(entry.class_code, entry.subject);

                    return (
                      <td key={dIdx}>
                        <div
                          className="timetable-slot-pill"
                          style={{
                            backgroundColor: style.bg,
                            color: style.color,
                            border: style.border
                          }}
                          onClick={() => {
                            const matched = entry.parentClass || classes.find((c) => c.class_code === entry.class_code);
                            if (matched) openViewClassModal(matched);
                          }}
                          title={`${entry.class_code} (${entry.subject}) - Click to view class details`}
                        >
                          <span style={{ fontWeight: 700, fontSize: '11.5px', lineHeight: 1.2 }}>
                            {entry.class_code}
                          </span>
                          <span style={{ fontSize: '10.5px', fontWeight: 500, opacity: 0.9 }}>
                            ({entry.subject})
                          </span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ROW BELOW: Today's Classes & Upcoming Classes Side-by-Side */}
      <div className="row g-4">
        {/* CARD 3: Today's Classes */}
        <div className="col-12 col-lg-6">
          <div className="teacher-content-card p-4 h-100 d-flex flex-column justify-content-between">
            <div>
              {/* Header */}
              <div className="d-flex align-items-center justify-content-between mb-3.5">
                <div className="d-flex align-items-center gap-2">
                  <div
                    className="d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '8px',
                      backgroundColor: '#FEE2E2',
                      color: '#8B1216'
                    }}
                  >
                    <Calendar size={16} />
                  </div>
                  <h2 className="brand-font fw-bold m-0" style={{ fontSize: '16.5px', color: '#0F172A' }}>
                    Today's Classes
                  </h2>
                </div>

                <span className="small text-secondary fw-medium" style={{ fontSize: '12.5px' }}>
                  {todayFormatted}
                </span>
              </div>

              {/* List */}
              {todayClassesList.length === 0 ? (
                <div className="text-center py-5 text-muted small">No classes scheduled for today.</div>
              ) : (
                <div className="d-flex flex-column gap-3.5">
                  {todayClassesList.map((item, idx) => {
                    const badgeStyle = getStandardBadgeStyle(item.standard, item.subject);

                    return (
                      <div key={idx} className="today-class-row d-flex flex-column gap-2">
                        {/* Time pill */}
                        <div>
                          <span
                            className="badge fw-semibold"
                            style={{
                              backgroundColor: badgeStyle.bg,
                              color: badgeStyle.color,
                              border: badgeStyle.border,
                              fontSize: '11.5px',
                              padding: '4px 10px',
                              borderRadius: '10px'
                            }}
                          >
                            {item.time}
                          </span>
                        </div>

                        {/* Info & View Button */}
                        <div className="d-flex align-items-center justify-content-between gap-2">
                          <div className="min-w-0">
                            <div
                              className="fw-bold text-truncate"
                              style={{ fontSize: '13.5px', color: '#0F172A' }}
                              title={`${item.standard || item.name} • ${item.subject}`}
                            >
                              {item.standard || item.name} • {item.subject}
                            </div>
                            <div className="d-flex align-items-center gap-1 small text-secondary mt-0.5" style={{ fontSize: '12px' }}>
                              <MapPin size={13} style={{ color: '#64748B' }} />
                              <span>{item.room}</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary px-3 py-1 fw-medium flex-shrink-0"
                            style={{
                              fontSize: '12px',
                              borderRadius: '6px',
                              borderColor: '#CBD5E1',
                              color: '#334155',
                              backgroundColor: '#FFFFFF',
                              height: '30px',
                              display: 'flex',
                              alignItems: 'center',
                              cursor: 'pointer'
                            }}
                            onClick={() => openViewClassModal(item)}
                          >
                            View
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CARD 4: Upcoming Classes */}
        <div className="col-12 col-lg-6">
          <div className="teacher-content-card p-4 h-100 d-flex flex-column justify-content-between">
            <div>
              {/* Header */}
              <div className="d-flex align-items-center gap-2 mb-3.5">
                <div
                  className="d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '8px',
                    backgroundColor: '#FEE2E2',
                    color: '#8B1216'
                  }}
                >
                  <Clock size={16} />
                </div>
                <h2 className="brand-font fw-bold m-0" style={{ fontSize: '16.5px', color: '#0F172A' }}>
                  Upcoming Classes
                </h2>
              </div>

              {/* List Grouped by Today / Tomorrow */}
              <div className="d-flex flex-column gap-3.5">
                {/* Group Today */}
                {upcomingClassesGroups.today.length > 0 && (
                  <div>
                    <div className="fw-bold mb-2" style={{ fontSize: '13px', color: '#0F172A' }}>
                      Today
                    </div>
                    <div className="d-flex flex-column gap-2.5">
                      {upcomingClassesGroups.today.map((item, idx) => (
                        <div
                          key={idx}
                          className="d-flex align-items-center gap-2.5 upcoming-item-clickable"
                          onClick={() => item.classRef && openViewClassModal(item.classRef)}
                          title="Click to view class details"
                        >
                          <span
                            className="badge fw-semibold flex-shrink-0"
                            style={{
                              backgroundColor: item.badgeBg,
                              color: item.badgeColor,
                              fontSize: '11px',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              minWidth: '65px',
                              textAlign: 'center'
                            }}
                          >
                            {item.time}
                          </span>
                          <div className="flex-grow-1 min-w-0">
                            <div
                              className="fw-semibold text-truncate"
                              style={{ fontSize: '13px', color: '#0F172A' }}
                              title={item.title}
                            >
                              {item.title}
                            </div>
                            <div className="d-flex align-items-center gap-1 text-secondary" style={{ fontSize: '12px' }}>
                              <MapPin size={12} style={{ color: '#64748B' }} />
                              <span>{item.room}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Group Tomorrow */}
                {upcomingClassesGroups.tomorrow.length > 0 && (
                  <div>
                    <div className="fw-bold mb-2" style={{ fontSize: '13px', color: '#0F172A' }}>
                      Tomorrow
                    </div>
                    <div className="d-flex flex-column gap-2.5">
                      {upcomingClassesGroups.tomorrow.map((item, idx) => (
                        <div
                          key={idx}
                          className="d-flex align-items-center gap-2.5 upcoming-item-clickable"
                          onClick={() => item.classRef && openViewClassModal(item.classRef)}
                          title="Click to view class details"
                        >
                          <span
                            className="badge fw-semibold flex-shrink-0"
                            style={{
                              backgroundColor: item.badgeBg,
                              color: item.badgeColor,
                              fontSize: '11px',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              minWidth: '65px',
                              textAlign: 'center'
                            }}
                          >
                            {item.time}
                          </span>
                          <div className="flex-grow-1 min-w-0">
                            <div
                              className="fw-semibold text-truncate"
                              style={{ fontSize: '13px', color: '#0F172A' }}
                              title={item.title}
                            >
                              {item.title}
                            </div>
                            <div className="d-flex align-items-center gap-1 text-secondary" style={{ fontSize: '12px' }}>
                              <MapPin size={12} style={{ color: '#64748B' }} />
                              <span>{item.room}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {upcomingClassesGroups.today.length === 0 &&
                  upcomingClassesGroups.tomorrow.length === 0 && (
                    <div className="text-center py-4 text-muted small">
                      No upcoming classes scheduled.
                    </div>
                  )}
              </div>
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
              <Button
                size="sm"
                variant="light"
                onClick={() => {
                  setViewModalOpen(false);
                  openEditModal(selectedClass);
                }}
              >
                <Edit2 size={13} className="me-1.5" /> Edit Schedule
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

              {enrolledStudents.length === 0 ? (
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

      {/* EDIT SCHEDULE MODAL */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Class Schedule">
        <form onSubmit={handleUpdateSchedule}>
          <div className="mb-3">
            <Input
              label="Date (Optional)"
              type="date"
              value={editForm.date || ''}
              onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
            />
          </div>
          <div className="mb-3">
            <Input
              label="Time Schedule"
              value={editForm.time}
              onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
              placeholder="e.g. 09:00 AM – 10:00 AM"
              required
            />
          </div>
          <div className="mb-3">
            <Input
              label="Room / Location"
              value={editForm.room}
              onChange={(e) => setEditForm({ ...editForm, room: e.target.value })}
              placeholder="e.g. Room 201"
              required
            />
          </div>
          <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            <Button variant="light" type="button" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
