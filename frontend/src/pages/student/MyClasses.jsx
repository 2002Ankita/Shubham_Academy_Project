import React, { useState, useEffect, useMemo } from 'react';
import Table from '../../components/common/Table';
import BackButton from '../../components/common/BackButton';
import { BookOpen, UserCheck, Clock, MapPin, Users, Sparkles, AlertTriangle, CalendarX, XCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import studentService from '../../services/studentService';
import batchService from '../../services/batchService';
import curriculumService from '../../services/curriculumService';
import notificationService from '../../services/notificationService';
import { toast } from 'react-toastify';

export default function StudentClasses() {
  const { user } = useAuth();
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentInfo, setStudentInfo] = useState(null);
  const [cancelledLectures, setCancelledLectures] = useState([]);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true);
        const studentId = user?.id || user?._id;
        const studentRes = studentId ? await studentService.getById(studentId).catch(() => null) : null;
        if (studentRes) {
          setStudentInfo(studentRes);
        }

        const activeBranch = studentRes?.branch ||
          user?.branch ||
          (user?.email === 'priya@gmail.com' || user?.email === 'rucha@gmail.com' || (user?.email || '').includes('mangal') ? 'Mangalvar Peth' : 'Tarabai Park');

        const activeBatch = studentRes?.batch ||
          studentRes?.academic_batch ||
          user?.batch ||
          user?.academic_batch ||
          (activeBranch === 'Mangalvar Peth' ? '11th PCMB' : '11th PCM');

        const [batchesRes, dailyActsRes] = await Promise.all([
          batchService.getBatches().catch(() => []),
          curriculumService.getDailyActivities().catch(() => [])
        ]);

        const notifCancelled = notificationService.getCancelledLectures(activeBranch, activeBatch);
        const dailyCancelled = (Array.isArray(dailyActsRes) ? dailyActsRes : []).filter(act => {
          return act.status === 'Cancelled' || act.status === 'cancelled';
        });

        const allCancelled = [];
        dailyCancelled.forEach(c => {
          allCancelled.push({
            id: c.id,
            subject: c.subject || 'Class',
            time: c.time_slot || c.time || '',
            date: c.target_date || c.activity_date || '',
            reason: c.remarks || 'Faculty Emergency'
          });
        });
        notifCancelled.forEach(n => {
          if (!allCancelled.some(x => x.subject === n.subject)) {
            allCancelled.push({
              id: n.id,
              subject: n.subject || 'Class',
              time: n.slotTime || n.time || '',
              date: n.date || '',
              reason: n.cancellationReason || 'Faculty Emergency'
            });
          }
        });
        setCancelledLectures(allCancelled);

        const isMangalvar = activeBranch.toLowerCase().includes('mangal');
        const isTarabai = activeBranch.toLowerCase().includes('tarabai');

        const studentBatchLower = activeBatch.toLowerCase();
        const isStudent11th = studentBatchLower.includes('11');
        const isStudent12th = studentBatchLower.includes('12');
        const studentStream = studentBatchLower.includes('pcmb') ? 'pcmb' : (studentBatchLower.includes('pcb') ? 'pcb' : 'pcm');

        // Filter batches strictly adhering to student campus and enrolled batch
        const matchedBatches = (batchesRes || []).filter(b => {
          const bName = (b.name || '').toLowerCase();
          const bBranch = (b.branch || '').toLowerCase();

          // 1. Strict Campus Isolation
          if (isMangalvar) {
            if (bName.includes('tarabai') || bName.includes(' tp ') || bName.endsWith(' tp') || bName.includes('-tp')) {
              return false;
            }
            if (bBranch && !bBranch.includes('mangal')) {
              return false;
            }
          }

          if (isTarabai) {
            if (bName.includes('mangalvar') || bName.includes('mangalwar') || bName.includes(' mp ') || bName.endsWith(' mp') || bName.includes('-mp')) {
              return false;
            }
            if (bBranch && !bBranch.includes('tarabai')) {
              return false;
            }
          }

          // 2. Standard match: 11th vs 12th
          if (isStudent11th && (bName.includes('12th') || bName.includes('12'))) return false;
          if (isStudent12th && (bName.includes('11th') || bName.includes('11'))) return false;

          // 3. Batch Stream match
          if (studentStream === 'pcm' && (bName.includes('pcb') || bName.includes('biology')) && !bName.includes('pcm')) return false;
          if (studentStream === 'pcb' && (bName.includes('pcm') || bName.includes('math')) && !bName.includes('pcb')) return false;

          return true;
        });

        // Expand timetable items or format batch entries
        const formattedSlots = [];

        matchedBatches.forEach(b => {
          if (Array.isArray(b.timetable) && b.timetable.length > 0) {
            b.timetable.forEach(slot => {
              // Campus guard on slot level as well
              const slotBranch = (slot.branch || '').toLowerCase();
              if (isMangalvar && (slotBranch.includes('tarabai') || (slot.class_code || '').includes('TP'))) return;
              if (isTarabai && (slotBranch.includes('mangal') || (slot.class_code || '').includes('MP'))) return;

              const matchingCancel = allCancelled.find(c =>
                (c.subject || '').toLowerCase() === (slot.subject || b.subject || '').toLowerCase()
              );
              const isCancelled = slot.status === 'Cancelled' || Boolean(matchingCancel);

              formattedSlots.push({
                day: slot.day || 'Weekly',
                time: slot.time || b.time || '08:00 AM – 10:30 AM',
                subject: slot.subject || b.subject || 'Core Session',
                teacher: slot.teacher_name || b.teacher_name || 'Faculty',
                room: slot.room || (isMangalvar ? 'Hall 1 (Mangalvar Peth)' : 'Hall 101 (Tarabai Park)'),
                status: isCancelled ? 'Cancelled' : 'Scheduled',
                cancel_reason: matchingCancel?.reason || slot.cancel_reason || 'Faculty Emergency'
              });
            });
          } else {
            // Batch level timing
            let day = 'Mon, Wed, Fri';
            let time = b.time || (isMangalvar ? '08:00 AM – 10:30 AM' : '10:00 AM – 01:00 PM');
            if (b.time && b.time.includes('(')) {
              const parts = b.time.split('(');
              day = parts[0].trim();
              time = parts[1].replace(')', '').trim();
            }

            formattedSlots.push({
              day: b.date ? `${day} (${b.date})` : day,
              time: time,
              subject: b.subject || 'Core Subjects',
              teacher: b.teacher_name || 'Assigned Faculty',
              room: b.room || (isMangalvar ? 'Hall 1 (Mangalvar Peth)' : 'Room 201 (Tarabai Park)')
            });
          }
        });

        if (formattedSlots.length > 0) {
          setTimetable(formattedSlots);
        } else {
          // Default weekly schedule tailored to their campus and batch
          const fallbackWeekly = [
            {
              day: 'Monday',
              time: isMangalvar ? '08:00 AM – 10:30 AM' : '10:30 AM – 01:00 PM',
              subject: 'Physics',
              teacher: 'Prof. Swami / More A.D',
              room: isMangalvar ? 'Hall 1 (Mangalvar Peth)' : 'Room 101'
            },
            {
              day: 'Tuesday',
              time: isMangalvar ? '08:00 AM – 10:30 AM' : '10:30 AM – 01:00 PM',
              subject: 'Chemistry',
              teacher: 'Prof. Sunita Patil',
              room: isMangalvar ? 'Hall 1 (Mangalvar Peth)' : 'Room 102'
            },
            {
              day: 'Wednesday',
              time: isMangalvar ? '08:00 AM – 10:30 AM' : '10:30 AM – 01:00 PM',
              subject: 'Mathematics',
              teacher: 'Prof. veer 1',
              room: isMangalvar ? 'Hall 1 (Mangalvar Peth)' : 'Room 103'
            },
            {
              day: 'Thursday',
              time: isMangalvar ? '08:00 AM – 10:30 AM' : '10:30 AM – 01:00 PM',
              subject: 'Biology',
              teacher: 'Prof. Shri / Dr. Meena',
              room: isMangalvar ? 'Bio Hall (Mangalvar Peth)' : 'Bio Lab'
            },
            {
              day: 'Friday',
              time: isMangalvar ? '08:00 AM – 10:30 AM' : '10:30 AM – 01:00 PM',
              subject: 'Mathematics Problem Solving & Doubt Clearance',
              teacher: 'Prof. veer 1',
              room: isMangalvar ? 'Hall 2 (Mangalvar Peth)' : 'Room 104'
            },
            {
              day: 'Saturday',
              time: isMangalvar ? '10:30 AM – 01:00 PM' : '10:30 AM – 01:00 PM',
              subject: 'Mathematics Weekly Evaluation & Problem Solving',
              teacher: 'Prof. veer 1',
              room: isMangalvar ? 'Hall 1 (Mangalvar Peth)' : 'Hall 101'
            }
          ].filter(item => {
            if (studentStream === 'pcm' && item.subject.includes('Biology')) return false;
            if (studentStream === 'pcb' && item.subject.includes('Mathematics')) return false;
            return true;
          });

          const enrichedFallback = fallbackWeekly.map(item => {
            const matchingCancel = allCancelled.find(c =>
              (c.subject || '').toLowerCase() === (item.subject || '').toLowerCase()
            );
            return {
              ...item,
              status: matchingCancel ? 'Cancelled' : 'Scheduled',
              cancel_reason: matchingCancel?.reason || 'Faculty Emergency'
            };
          });
          setTimetable(enrichedFallback);
        }
      } catch (err) {
        console.error('Failed to load classes:', err);
        toast.error('Failed to load classes schedule');
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();

    const handleUpdate = () => {
      fetchClasses();
    };

    window.addEventListener('sa_lecture_cancelled', handleUpdate);
    window.addEventListener('sa_timetable_updated', handleUpdate);
    window.addEventListener('sa_notifications_updated', handleUpdate);

    return () => {
      window.removeEventListener('sa_lecture_cancelled', handleUpdate);
      window.removeEventListener('sa_timetable_updated', handleUpdate);
      window.removeEventListener('sa_notifications_updated', handleUpdate);
    };
  }, [user]);

  const displayBranch = studentInfo?.branch ||
    user?.branch ||
    (user?.email === 'priya@gmail.com' || user?.email === 'rucha@gmail.com' || (user?.email || '').includes('mangal') ? 'Mangalvar Peth' : 'Tarabai Park');

  const displayBatch = studentInfo?.batch ||
    studentInfo?.academic_batch ||
    user?.batch ||
    user?.academic_batch ||
    (displayBranch === 'Mangalvar Peth' ? '11th PCMB' : '11th PCM');

  const sessionLabel = studentInfo?.session ? ` (${studentInfo.session})` : '';

  return (
    <div className="d-flex flex-column gap-4">
      <div>
        <BackButton to="/student/dashboard" label="Back to Dashboard" />
      </div>

      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2">
        <div>
          <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
            My Weekly Class Schedule & Timetable
          </h3>
          <span className="small text-sa-muted">
            Weekly lectures, practical slots, and faculty schedule for your enrolled batch
          </span>
        </div>
        <div className="d-inline-flex align-items-center gap-1.5 px-3 py-1.5 bg-light rounded-pill border small fw-semibold text-secondary">
          <Users size={13} className="text-sa-primary" />
          <span>{displayBranch} • {displayBatch}{sessionLabel}</span>
        </div>
      </div>

      {/* Lecture Cancellation Banner */}
      {cancelledLectures.length > 0 && (
        <div className="d-flex flex-column gap-2">
          {cancelledLectures.map((c, i) => (
            <div
              key={c.id || i}
              className="p-3.5 rounded-4 border shadow-xs d-flex align-items-center justify-content-between gap-3 flex-wrap"
              style={{
                background: 'linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 100%)',
                borderColor: '#FDA4AF',
                borderLeft: '5px solid #DC2626'
              }}
            >
              <div className="d-flex align-items-center gap-2.5">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ width: '40px', height: '40px', backgroundColor: '#FEE2E2', color: '#DC2626' }}
                >
                  <CalendarX size={20} />
                </div>
                <div>
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <span className="fw-bold text-danger" style={{ fontSize: '0.96rem' }}>
                      ⚠️ Notice: {c.subject} Lecture Cancelled
                    </span>
                    {c.time && (
                      <span className="badge bg-white text-dark border px-2 py-0.5 rounded-pill small">
                        🕒 {c.time}
                      </span>
                    )}
                  </div>
                  <span className="small text-secondary d-block mt-0.5">
                    Reason: <strong className="text-danger">{c.reason}</strong>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="sa-card p-4">
        <Table
          columns={[
            { key: 'day', title: 'Day', render: (val) => <span className="fw-bold">{val}</span> },
            { key: 'time', title: 'Session Timing', render: (val) => <span className="fw-semibold text-sa-primary">{val}</span> },
            { key: 'subject', title: 'Subject & Topic', render: (val) => <span className="fw-medium text-dark">{val}</span> },
            { key: 'teacher', title: 'Faculty', render: (val) => <span className="text-secondary">{val || 'TBD'}</span> },
            { key: 'room', title: 'Classroom / Lab', render: (val) => <span className="badge bg-light text-dark border">{val}</span> },
            {
              key: 'status',
              title: 'Status',
              render: (val, row) => (
                row.status === 'Cancelled' ? (
                  <div className="d-flex flex-column gap-0.5">
                    <span className="badge bg-danger text-white rounded-pill px-2.5 py-1 small fw-bold d-inline-flex align-items-center gap-1" style={{ width: 'fit-content' }}>
                      <XCircle size={10} /> Cancelled
                    </span>
                    {row.cancel_reason && (
                      <span className="text-danger small" style={{ fontSize: '0.70rem' }}>
                        {row.cancel_reason}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2.5 py-1 small fw-semibold">
                    ✓ Scheduled
                  </span>
                )
              )
            }
          ]}
          data={timetable}
          loading={loading}
          emptyMessage="No class schedules found for your enrolled batch."
        />
      </div>
    </div>
  );
}
