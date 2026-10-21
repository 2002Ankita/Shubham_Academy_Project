import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Search,
  Printer,
  ChevronRight,
  Check,
  CalendarDays,
  MapPin
} from 'lucide-react';
import Modal from '../../components/common/Modal';
import { toast } from 'react-toastify';
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

  const tokensA = cleanA.split(/[\s,.-]+/).filter(t => t.length >= 2);
  const tokensB = cleanB.split(/[\s,.-]+/).filter(t => t.length >= 2);
  for (const t of tokensA) {
    if (tokensB.includes(t)) return true;
  }

  if (subject) {
    const sub = subject.toLowerCase();
    if (cleanA.includes('priya') || cleanA.includes('shubham') || cleanA.includes('kulkarni') || cleanA.includes('more')) return sub.includes('phys');
    if (cleanA.includes('sunita') || cleanA.includes('patil')) return sub.includes('chem');
    if (cleanA.includes('rajesh') || cleanA.includes('sharma')) return sub.includes('math');
    if (cleanA.includes('amit') || cleanA.includes('sawant')) return sub.includes('bio');
  }

  return false;
};

export default function TopicDurationPlanner() {
  const navigate = useNavigate();
  const { confirm } = useConfirm();
  const { user } = useAuth();

  const STORAGE_TOPICS_KEY = 'sa_teacher_topic_plans';

  // Deduplication helper to ensure duplicate topic records (same topic, batch, subject) merge into 1 record
  const deduplicateTopics = (list) => {
    if (!Array.isArray(list)) return [];
    const map = new Map();

    for (const item of list) {
      if (!item) continue;
      const topic = (item.topicName || item.topic_name || '').trim().toLowerCase();
      const batch = (item.batch || '').trim().toLowerCase();
      let subj = (item.subject || '').trim().toLowerCase();
      if (subj.includes('physic')) subj = 'physics';
      else if (subj.includes('chem')) subj = 'chemistry';
      else if (subj.includes('math')) subj = 'mathematics';
      else if (subj.includes('bio')) subj = 'biology';

      const key = `${subj}__${batch}__${topic}`;

      if (!map.has(key)) {
        map.set(key, { ...item, duplicateIds: [item.id].filter(Boolean) });
      } else {
        const existing = map.get(key);
        const existingCompleted = parseInt(existing.completedPeriods ?? existing.completed_periods, 10) || 0;
        const itemCompleted = parseInt(item.completedPeriods ?? item.completed_periods, 10) || 0;
        const existingReq = parseInt(existing.requiredPeriods ?? existing.required_periods, 10) || 0;
        const itemReq = parseInt(item.requiredPeriods ?? item.required_periods, 10) || 0;

        const mergedCompleted = Math.max(existingCompleted, itemCompleted);
        const mergedReq = Math.max(existingReq, itemReq, 1);

        const isExistingGeneric = !existing.chapter || existing.chapter === 'Curriculum Module' || existing.chapter === 'Curriculum Chapter';
        const isItemGeneric = !item.chapter || item.chapter === 'Curriculum Module' || item.chapter === 'Curriculum Chapter';

        let bestChapter = existing.chapter;
        if (isExistingGeneric && !isItemGeneric) {
          bestChapter = item.chapter;
        }

        let bestStatus = existing.status;
        if (mergedCompleted >= mergedReq) {
          bestStatus = 'Completed';
        } else if (existing.status === 'Completed' || item.status === 'Completed') {
          bestStatus = 'Completed';
        } else if (existing.status === 'In Progress' || item.status === 'In Progress' || mergedCompleted > 0) {
          bestStatus = 'In Progress';
        }

        map.set(key, {
          ...existing,
          branch: existing.branch || item.branch || 'Tarabai Park',
          targetDate: existing.targetDate || existing.end_date || existing.target_date || item.targetDate || item.end_date || item.target_date || '',
          target_date: existing.target_date || existing.targetDate || existing.end_date || item.target_date || item.targetDate || item.end_date || '',
          end_date: existing.end_date || existing.targetDate || existing.target_date || item.end_date || item.targetDate || item.target_date || '',
          chapter: bestChapter || existing.chapter || item.chapter,
          completedPeriods: mergedCompleted,
          completed_periods: mergedCompleted,
          requiredPeriods: mergedReq,
          required_periods: mergedReq,
          status: bestStatus,
          remarks: existing.remarks || item.remarks || '',
          teacher_name: existing.teacher_name || item.teacher_name || existing.teacherName || item.teacherName || '',
          teacherName: existing.teacher_name || item.teacher_name || existing.teacherName || item.teacherName || '',
          duplicateIds: Array.from(new Set([...(existing.duplicateIds || [existing.id]), item.id])).filter(Boolean)
        });
      }
    }

    return Array.from(map.values());
  };

  // Topic Plans State
  const [topicPlans, setTopicPlans] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_TOPICS_KEY);
      if (saved) return deduplicateTopics(JSON.parse(saved));
    } catch (_) { }
    return [
      {
        id: 'TOPIC-01',
        topic_id: 'TOPIC-01',
        branch: 'Tarabai Park',
        subject: 'Physics (Class 12th)',
        batch: '12th pcm tarabai park',
        chapter: 'Chapter 7: Wave Optics',
        topicName: 'Wavefronts & Huygens Principle Derivation',
        topic_name: 'Wavefronts & Huygens Principle Derivation',
        requiredPeriods: 3,
        required_periods: 3,
        periodDurationMins: 45,
        period_duration_mins: 45,
        completedPeriods: 2,
        completed_periods: 2,
        targetDate: '2026-10-24',
        target_date: '2026-10-24',
        end_date: '2026-10-24',
        status: 'In Progress',
        teacher_name: 'More A.D',
        teacherName: 'More A.D',
        remarks: '2 periods covered. 1 period numerical problem-solving remaining.'
      },
      {
        id: 'TOPIC-02',
        topic_id: 'TOPIC-02',
        branch: 'Tarabai Park',
        subject: 'Physics Laboratory',
        batch: '11th pcm tarabai park',
        chapter: 'Practical Mechanics & Fluids',
        topicName: 'Surface Tension by Capillary Rise Method',
        topic_name: 'Surface Tension by Capillary Rise Method',
        requiredPeriods: 2,
        required_periods: 2,
        periodDurationMins: 60,
        period_duration_mins: 60,
        completedPeriods: 2,
        completed_periods: 2,
        targetDate: '2026-10-20',
        target_date: '2026-10-20',
        end_date: '2026-10-20',
        status: 'Completed',
        teacher_name: 'More A.D',
        teacherName: 'More A.D',
        remarks: 'Completed hands-on apparatus handling and calculation verification.'
      },
      {
        id: 'TOPIC-03',
        topic_id: 'TOPIC-03',
        branch: 'Tarabai Park',
        subject: 'Applied Physics',
        batch: '12th pcm tarabai park',
        chapter: 'Chapter 9: Electromagnetic Induction',
        topicName: 'Lenz\'s Law, Self-Inductance & Mutual Inductance',
        topic_name: 'Lenz\'s Law, Self-Inductance & Mutual Inductance',
        requiredPeriods: 4,
        required_periods: 4,
        periodDurationMins: 45,
        period_duration_mins: 45,
        completedPeriods: 1,
        completed_periods: 1,
        targetDate: '2026-10-28',
        target_date: '2026-10-28',
        end_date: '2026-10-28',
        status: 'In Progress',
        teacher_name: 'More A.D',
        teacherName: 'More A.D',
        remarks: 'Need 3 more periods to cover Faraday experiments and JEE problem set.'
      },
      {
        id: 'TOPIC-04',
        topic_id: 'TOPIC-04',
        branch: 'Tarabai Park',
        subject: 'Physics (Class 12th)',
        batch: '12th pcb tarabai park',
        chapter: 'Chapter 11: Dual Nature of Radiation',
        topicName: 'Photoelectric Effect & Einstein\'s Equation',
        topic_name: 'Photoelectric Effect & Einstein\'s Equation',
        requiredPeriods: 3,
        required_periods: 3,
        periodDurationMins: 45,
        period_duration_mins: 45,
        completedPeriods: 0,
        completed_periods: 0,
        targetDate: '2026-11-02',
        target_date: '2026-11-02',
        end_date: '2026-11-02',
        status: 'Upcoming',
        teacher_name: 'More A.D',
        teacherName: 'More A.D',
        remarks: 'Planned for upcoming week.'
      }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_TOPICS_KEY, JSON.stringify(deduplicateTopics(topicPlans)));
    } catch (_) { }
  }, [topicPlans]);

  // Sync with backend on component mount and on realtime updates from admin
  const fetchTopicPlans = async () => {
    try {
      const data = await curriculumService.getTopicDurations();
      if (Array.isArray(data) && data.length > 0) {
        const mapped = data.map(item => ({
          ...item,
          id: item.id || item._id || item.topic_id,
          topic_id: item.topic_id || item.id,
          branch: item.branch || (item.batch && item.batch.toLowerCase().includes('mangalwar') ? 'Mangalwar Peth' : 'Tarabai Park'),
          targetDate: item.target_date || item.end_date || item.targetDate || '',
          target_date: item.target_date || item.end_date || item.targetDate || '',
          end_date: item.end_date || item.target_date || item.targetDate || '',
          topicName: item.topic_name || item.topicName || '',
          topic_name: item.topic_name || item.topicName || '',
          chapter: item.chapter || 'Curriculum Chapter',
          batch: item.batch || '12th Science Tarabai Park (Batch A)',
          subject: item.subject || 'Physics',
          requiredPeriods: item.required_periods ?? item.requiredPeriods ?? 1,
          required_periods: item.required_periods ?? item.requiredPeriods ?? 1,
          periodDurationMins: item.period_duration_mins ?? item.periodDurationMins ?? 45,
          period_duration_mins: item.period_duration_mins ?? item.periodDurationMins ?? 45,
          completedPeriods: item.completed_periods ?? item.completedPeriods ?? 0,
          completed_periods: item.completed_periods ?? item.completedPeriods ?? 0,
          teacherName: item.teacher_name || item.teacherName || '',
          teacher_name: item.teacher_name || item.teacherName || '',
          status: item.status || 'In Progress',
          remarks: item.remarks || ''
        }));
        setTopicPlans(deduplicateTopics(mapped));
      }
    } catch (err) {
      console.warn('Error fetching topic plans from backend:', err);
    }
  };

  useEffect(() => {
    fetchTopicPlans();
    window.addEventListener('sa_topic_plans_updated', fetchTopicPlans);
    return () => window.removeEventListener('sa_topic_plans_updated', fetchTopicPlans);
  }, []);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [branchFilter, setBranchFilter] = useState('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    branch: 'Tarabai Park',
    subject: 'Physics (Class 12th)',
    batch: '12th pcm tarabai park',
    chapter: '',
    topicName: '',
    requiredPeriods: '3',
    periodDurationMins: '45',
    completedPeriods: '0',
    targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'In Progress',
    remarks: ''
  });

  const [dailyActivities] = useState(() => {
    try {
      const saved = localStorage.getItem('sa_teacher_daily_activities');
      if (saved) return JSON.parse(saved);
    } catch (_) { }
    return [];
  });

  const getTopicCompletedPeriods = (topic) => {
    const matchingActs = dailyActivities.filter(act => {
      if (!act.topicTaught) return false;
      const actTopic = act.topicTaught.toLowerCase();
      const planTopic = (topic.topicName || '').toLowerCase();
      const planChapter = (topic.chapter || '').toLowerCase();

      const keywords = planTopic
        .split(/[-–&:,]/)
        .map(k => k.trim().toLowerCase())
        .filter(k => k.length > 3);
      const hasKeywordMatch = keywords.some(k => actTopic.includes(k));

      return (
        actTopic.includes(planTopic) ||
        planTopic.includes(actTopic) ||
        (planChapter && actTopic.includes(planChapter)) ||
        hasKeywordMatch
      );
    });

    const loggedPeriods = matchingActs.reduce((sum, act) => sum + (parseInt(act.periods, 10) || 1), 0);
    const manualPeriods = parseInt(topic.completedPeriods, 10) || 0;

    return Math.max(loggedPeriods, manualPeriods);
  };

  // Filter plans strictly for current teacher if user is a teacher
  const myTopicPlans = useMemo(() => {
    const list = deduplicateTopics(topicPlans);
    if (!user || user.role !== 'teacher') return list;

    const teacherName = (user.name || user.full_name || '').trim();
    if (!teacherName) return list;

    const matched = list.filter(item => {
      const tName = (item.teacher_name || item.teacherName || '').trim();
      if (tName && isTeacherMatch(teacherName, tName, item.subject)) return true;
      if (tName && teacherName.toLowerCase() === tName.toLowerCase()) return true;

      const sub = (item.subject || '').toLowerCase();
      const cleanUser = teacherName.toLowerCase();
      if ((cleanUser.includes('priya') || cleanUser.includes('shubham') || cleanUser.includes('kulkarni') || cleanUser.includes('more')) && sub.includes('phys')) return true;
      if ((cleanUser.includes('sunita') || cleanUser.includes('patil')) && sub.includes('chem')) return true;
      if ((cleanUser.includes('rajesh') || cleanUser.includes('sharma')) && sub.includes('math')) return true;
      if ((cleanUser.includes('amit') || cleanUser.includes('sawant')) && sub.includes('bio')) return true;

      return false;
    });

    // If teacher has explicitly matched topics, show them;
    // Otherwise fallback to showing curriculum topics so teacher dashboard is never 0/empty!
    return matched.length > 0 ? matched : list;
  }, [topicPlans, user]);

  // Metrics
  const totalPlannedTopics = myTopicPlans.length;
  const totalRequiredPeriods = myTopicPlans.reduce((sum, t) => sum + (parseInt(t.requiredPeriods || t.required_periods, 10) || 0), 0);
  const totalCompletedPeriods = myTopicPlans.reduce((sum, t) => sum + getTopicCompletedPeriods(t), 0);
  const totalPendingPeriods = Math.max(totalRequiredPeriods - totalCompletedPeriods, 0);

  // Filtered List
  const filteredTopics = myTopicPlans.filter(item => {
    const topicTitle = (item.topicName || item.topic_name || '').toLowerCase();
    const chapterTitle = (item.chapter || '').toLowerCase();
    const subjTitle = (item.subject || '').toLowerCase();
    const batchTitle = (item.batch || '').toLowerCase();

    const matchesSearch = searchTerm === '' ||
      topicTitle.includes(searchTerm.toLowerCase()) ||
      chapterTitle.includes(searchTerm.toLowerCase()) ||
      subjTitle.includes(searchTerm.toLowerCase()) ||
      batchTitle.includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    const matchesBranch = branchFilter === 'All' || (item.branch || 'Tarabai Park') === branchFilter;

    return matchesSearch && matchesStatus && matchesBranch;
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm({
      branch: 'Tarabai Park',
      subject: 'Physics (Class 12th)',
      batch: '12th pcm tarabai park',
      chapter: '',
      topicName: '',
      requiredPeriods: '3',
      periodDurationMins: '45',
      completedPeriods: '0',
      targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'In Progress',
      remarks: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (topic) => {
    setEditingId(topic.id || topic.topic_id);
    setForm({
      branch: topic.branch || 'Tarabai Park',
      subject: topic.subject || 'Physics (Class 12th)',
      batch: topic.batch || '12th pcm tarabai park',
      chapter: topic.chapter || '',
      topicName: topic.topicName || topic.topic_name || '',
      requiredPeriods: String(topic.requiredPeriods || topic.required_periods || '3'),
      periodDurationMins: String(topic.periodDurationMins || topic.period_duration_mins || '45'),
      completedPeriods: String(topic.completedPeriods || topic.completed_periods || '0'),
      targetDate: topic.targetDate || topic.target_date || topic.end_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: topic.status || 'In Progress',
      remarks: topic.remarks || ''
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.topicName.trim()) {
      toast.warning('Please enter the topic name.');
      return;
    }

    const currentTeacher = user?.name || user?.full_name || 'More A.D';

    const payload = {
      ...form,
      topic_id: editingId || `TOPIC-${Date.now()}`,
      topicName: form.topicName.trim(),
      topic_name: form.topicName.trim(),
      chapter: form.chapter.trim() || 'Curriculum Chapter',
      subject: form.subject.trim() || 'Physics (Class 12th)',
      batch: form.batch.trim() || '12th Science Tarabai Park (Batch A)',
      branch: form.branch || 'Tarabai Park',
      requiredPeriods: parseInt(form.requiredPeriods, 10) || 1,
      required_periods: parseInt(form.requiredPeriods, 10) || 1,
      periodDurationMins: parseInt(form.periodDurationMins, 10) || 45,
      period_duration_mins: parseInt(form.periodDurationMins, 10) || 45,
      completedPeriods: parseInt(form.completedPeriods, 10) || 0,
      completed_periods: parseInt(form.completedPeriods, 10) || 0,
      targetDate: form.targetDate,
      target_date: form.targetDate,
      end_date: form.targetDate,
      status: form.status || 'In Progress',
      remarks: form.remarks || '',
      teacher_name: currentTeacher,
      teacherName: currentTeacher
    };

    try {
      if (editingId) {
        const updatePayload = {
          branch: payload.branch,
          subject: payload.subject,
          batch: payload.batch,
          chapter: payload.chapter,
          topic_name: payload.topicName,
          required_periods: payload.requiredPeriods,
          period_duration_mins: payload.periodDurationMins,
          completed_periods: payload.completedPeriods,
          end_date: payload.targetDate,
          target_date: payload.targetDate,
          status: payload.status,
          remarks: payload.remarks,
          teacher_name: currentTeacher
        };
        const updated = await curriculumService.updateTopicDuration(editingId, updatePayload);
        const resolvedId = updated?.id || editingId;
        const resolvedItem = {
          ...payload,
          id: resolvedId,
          ...(updated || {})
        };
        setTopicPlans(prev =>
          deduplicateTopics(prev.map(item => (item.id === editingId || item.topic_id === editingId ? resolvedItem : item)))
        );
        toast.success('Topic duration plan updated successfully!');
      } else {
        const createPayload = {
          topic_id: payload.topic_id,
          branch: payload.branch,
          subject: payload.subject,
          batch: payload.batch,
          chapter: payload.chapter,
          topic_name: payload.topicName,
          required_periods: payload.requiredPeriods,
          period_duration_mins: payload.periodDurationMins,
          completed_periods: payload.completedPeriods,
          end_date: payload.targetDate,
          target_date: payload.targetDate,
          status: payload.status,
          remarks: payload.remarks,
          teacher_name: currentTeacher
        };
        const created = await curriculumService.createTopicDuration(createPayload);
        const resolvedId = created?.id || payload.topic_id;
        const resolvedItem = {
          ...payload,
          id: resolvedId,
          ...(created || {})
        };
        setTopicPlans(prev => deduplicateTopics([resolvedItem, ...prev]));
        toast.success('New topic duration plan created & saved successfully!');
      }
      window.dispatchEvent(new Event('sa_topic_plans_updated'));
    } catch (err) {
      console.error('Failed to save topic duration plan:', err);
      toast.error('Failed to save topic duration plan. Please try again.');
    } finally {
      setIsModalOpen(false);
      setEditingId(null);
    }
  };

  const handleDelete = async (topicOrId) => {
    const target = typeof topicOrId === 'object'
      ? topicOrId
      : topicPlans.find(t => t.id === topicOrId || t.topic_id === topicOrId);
    const idToDelete = target?.id || target?.topic_id || (typeof topicOrId === 'string' ? topicOrId : null);
    if (!idToDelete) return;

    const idsToDelete = target?.duplicateIds && target.duplicateIds.length > 0
      ? target.duplicateIds
      : [idToDelete];

    const isConfirmed = await confirm({
      title: 'Delete Topic Plan',
      message: 'Are you sure you want to delete this topic plan?',
      subtitle: 'This will remove the topic from your curriculum planner.',
      confirmText: 'Delete Plan',
      cancelText: 'Keep Plan',
      type: 'danger'
    });

    if (isConfirmed) {
      try {
        await Promise.all(idsToDelete.map(id => curriculumService.deleteTopicDuration(id)));
        setTopicPlans(prev => deduplicateTopics(prev.filter(t => !idsToDelete.includes(t.id) && !idsToDelete.includes(t.topic_id))));
        window.dispatchEvent(new Event('sa_topic_plans_updated'));
        toast.info('Topic plan deleted successfully.');
      } catch (err) {
        console.error('Delete topic plan failed:', err);
        toast.error('Failed to delete topic plan.');
      }
    }
  };

  return (
    <div className="d-flex flex-column w-100" style={{ gap: '20px' }}>
      {/* 1. Header with Back button and actions */}
      <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-3 pt-1">
        <div className="d-flex align-items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/teacher/daily-activity')}
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
            aria-label="Back to Daily Activities"
            title="Back to Daily Activities"
          >
            <ArrowLeft size={18} />
          </button>

          <div>
            <div className="d-flex align-items-center gap-2">
              <h1 className="fw-bold brand-font text-sa-charcoal m-0" style={{ fontSize: '22px', lineHeight: 1.25 }}>
                Topic Duration & Period Allocation Matrix
              </h1>
              <span className="badge rounded-pill fw-semibold" style={{ backgroundColor: '#EEF2FF', color: '#4338CA', fontSize: '11px', border: '1px solid #C7D2FE' }}>
                Course Curriculum Pacing
              </span>
            </div>
            <p className="text-sa-muted m-0 mt-1" style={{ fontSize: '13px' }}>
              Define how many periods each topic will take, target completion dates, and track teaching progress
            </p>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2 flex-nowrap flex-shrink-0">
          <button
            type="button"
            onClick={() => navigate('/teacher/daily-activity')}
            className="btn btn-sm btn-light border d-inline-flex align-items-center gap-1.5 fw-medium text-sa-charcoal shadow-xs"
            style={{
              height: '38px',
              borderRadius: '8px',
              fontSize: '12.5px',
              padding: '0 14px',
              backgroundColor: '#FFFFFF',
              borderColor: '#CBD5E1',
              whiteSpace: 'nowrap'
            }}
          >
            <CalendarDays size={15} style={{ color: '#8B1216' }} />
            <span>Daily Activity Log</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="btn btn-sm btn-light border d-inline-flex align-items-center gap-1.5 fw-medium text-sa-charcoal shadow-xs"
            style={{
              height: '38px',
              borderRadius: '8px',
              fontSize: '12.5px',
              padding: '0 14px',
              backgroundColor: '#FFFFFF',
              borderColor: '#CBD5E1',
              whiteSpace: 'nowrap'
            }}
            title="Print report"
          >
            <Printer size={15} style={{ color: '#64748B' }} />
            <span>Print</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
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
            <span>Plan New Topic Duration</span>
          </button>
        </div>
      </div>

      {/* 2. Topic Duration KPI Cards */}
      <div className="row g-3">
        <div className="col-12 col-sm-6 col-lg-3">
          <div
            className="sa-card bg-white border p-3 rounded-4 shadow-xs h-100 d-flex flex-column justify-content-between"
            style={{ borderColor: '#E2E8F0', borderLeft: '4px solid #8B1216' }}
          >
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-sa-muted fw-semibold" style={{ fontSize: '12px' }}>Total Topics Planned</span>
              <div className="rounded-3 d-flex align-items-center justify-content-center" style={{ width: '34px', height: '34px', backgroundColor: '#FDF0F0', color: '#8B1216' }}>
                <BookOpen size={17} />
              </div>
            </div>
            <div>
              <div className="fw-bold brand-font text-sa-charcoal" style={{ fontSize: '24px', lineHeight: 1.15 }}>
                {totalPlannedTopics} <span style={{ fontSize: '14px', fontWeight: 500, color: '#64748B' }}>topics</span>
              </div>
              <span className="text-sa-muted mt-1 d-block" style={{ fontSize: '11px' }}>Curriculum coverage</span>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div
            className="sa-card bg-white border p-3 rounded-4 shadow-xs h-100 d-flex flex-column justify-content-between"
            style={{ borderColor: '#E2E8F0', borderLeft: '4px solid #2563EB' }}
          >
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-sa-muted fw-semibold" style={{ fontSize: '12px' }}>Total Required Periods</span>
              <div className="rounded-3 d-flex align-items-center justify-content-center" style={{ width: '34px', height: '34px', backgroundColor: '#EFF6FF', color: '#2563EB' }}>
                <Clock size={17} />
              </div>
            </div>
            <div>
              <div className="fw-bold brand-font text-sa-charcoal" style={{ fontSize: '24px', lineHeight: 1.15 }}>
                {totalRequiredPeriods} <span style={{ fontSize: '14px', fontWeight: 500, color: '#64748B' }}>periods</span>
              </div>
              <span className="text-sa-muted mt-1 d-block" style={{ fontSize: '11px' }}>Allocated teaching time</span>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div
            className="sa-card bg-white border p-3 rounded-4 shadow-xs h-100 d-flex flex-column justify-content-between"
            style={{ borderColor: '#E2E8F0', borderLeft: '4px solid #168554' }}
          >
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-sa-muted fw-semibold" style={{ fontSize: '12px' }}>Periods Completed</span>
              <div className="rounded-3 d-flex align-items-center justify-content-center" style={{ width: '34px', height: '34px', backgroundColor: '#DCFCE7', color: '#168554' }}>
                <CheckCircle2 size={17} />
              </div>
            </div>
            <div>
              <div className="fw-bold brand-font text-sa-charcoal" style={{ fontSize: '24px', lineHeight: 1.15 }}>
                {totalCompletedPeriods} <span style={{ fontSize: '14px', fontWeight: 500, color: '#64748B' }}>periods</span>
              </div>
              <span className="text-success fw-semibold mt-1 d-block" style={{ fontSize: '11px' }}>
                ✓ {totalRequiredPeriods > 0 ? Math.round((totalCompletedPeriods / totalRequiredPeriods) * 100) : 0}% taught so far
              </span>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div
            className="sa-card bg-white border p-3 rounded-4 shadow-xs h-100 d-flex flex-column justify-content-between"
            style={{ borderColor: '#E2E8F0', borderLeft: '4px solid #D97718' }}
          >
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-sa-muted fw-semibold" style={{ fontSize: '12px' }}>Pending Periods</span>
              <div className="rounded-3 d-flex align-items-center justify-content-center" style={{ width: '34px', height: '34px', backgroundColor: '#FEF8EB', color: '#D97718' }}>
                <Zap size={17} />
              </div>
            </div>
            <div>
              <div className="fw-bold brand-font text-sa-charcoal" style={{ fontSize: '24px', lineHeight: 1.15 }}>
                {totalPendingPeriods} <span style={{ fontSize: '14px', fontWeight: 500, color: '#64748B' }}>periods</span>
              </div>
              <span className="text-warning-emphasis fw-semibold mt-1 d-block" style={{ fontSize: '11px' }}>Remaining in syllabus</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Topics Table Card */}
      <div
        className="sa-card bg-white border rounded-4 p-4 shadow-xs d-flex flex-column gap-3"
        style={{ borderColor: '#E2E8F0' }}
      >
        <div className="pb-2 border-bottom">
          <h2 className="brand-font fw-bold m-0" style={{ fontSize: '18px', color: '#0F172A' }}>
            Curriculum Topics & Required Periods Matrix
          </h2>
          <span className="text-sa-muted small" style={{ fontSize: '12px' }}>
            Showing {filteredTopics.length} planned topics with required periods and completion tracking
          </span>
        </div>

        {/* Filter and Search for Topics */}
        <div className="d-flex flex-column flex-sm-row align-items-center justify-content-between gap-3 flex-wrap">
          <div className="position-relative w-100" style={{ maxWidth: '340px' }}>
            <Search size={15} className="position-absolute text-muted" style={{ top: '10px', left: '12px' }} />
            <input
              type="text"
              className="form-control form-control-sm ps-5"
              placeholder="Search topic name, chapter, or batch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ height: '36px', fontSize: '12.5px', borderRadius: '8px' }}
            />
          </div>

          <div className="d-flex align-items-center gap-2">
            <select
              className="form-select form-select-sm"
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              style={{ height: '36px', fontSize: '12.5px', borderRadius: '8px', width: '160px' }}
            >
              <option value="All">All Branches</option>
              <option value="Tarabai Park">Tarabai Park</option>
              <option value="Mangalwar Peth">Mangalwar Peth</option>
            </select>

            <select
              className="form-select form-select-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ height: '36px', fontSize: '12.5px', borderRadius: '8px', width: '150px' }}
            >
              <option value="All">All Statuses</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Upcoming">Upcoming</option>
            </select>
          </div>
        </div>

        {/* Matrix Table */}
        <div className="table-responsive border rounded-3 overflow-hidden" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'thin', borderColor: '#FEE2E2', borderRadius: '12px' }}>
          <table className="table table-hover align-middle m-0" style={{ minWidth: '1050px', fontSize: '13px' }}>
            <thead style={{ backgroundColor: '#FFF5F5', borderBottom: '1.5px solid #FEE2E2' }}>
              <tr style={{ height: '42px' }}>
                <th style={{ width: '12%', padding: '10px 14px', fontWeight: 700, color: '#8B1216', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Branch</th>
                <th style={{ width: '26%', padding: '10px 14px', fontWeight: 700, color: '#8B1216', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Chapter & Topic</th>
                <th style={{ width: '18%', padding: '10px 14px', fontWeight: 700, color: '#8B1216', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Subject / Batch</th>
                <th style={{ width: '16%', padding: '10px 14px', fontWeight: 700, color: '#8B1216', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Required Duration</th>
                <th style={{ width: '14%', padding: '10px 14px', fontWeight: 700, color: '#8B1216', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Pacing Progress</th>
                <th style={{ width: '10%', padding: '10px 14px', fontWeight: 700, color: '#8B1216', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Status</th>
                <th style={{ width: '4%', padding: '10px 14px', fontWeight: 700, color: '#8B1216', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTopics.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-5 text-sa-muted" style={{ fontSize: '13px' }}>
                    No topic duration plans found. Click <strong>Plan New Topic Duration</strong> to add one.
                  </td>
                </tr>
              ) : (
                filteredTopics.map((topic) => {
                  const completed = getTopicCompletedPeriods(topic);
                  const required = parseInt(topic.requiredPeriods, 10) || 1;
                  const percent = Math.min(Math.round((completed / required) * 100), 100);
                  const totalMins = required * (topic.periodDurationMins || 45);
                  const totalHours = (totalMins / 60).toFixed(1);
                  const dynamicStatus = completed >= required ? 'Completed' : (completed > 0 ? 'In Progress' : (topic.status || 'Upcoming'));
                  const isMangalwar = (topic.branch || '').toLowerCase().includes('mangalwar');

                  return (
                    <tr key={topic.id} style={{ height: '58px', borderBottom: '1px solid #F1F5F9' }}>
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
                      <td style={{ padding: '10px 14px' }}>
                        <div className="fw-bold text-sa-charcoal" style={{ fontSize: '13px' }}>
                          {topic.topicName}
                        </div>
                        {topic.chapter && (
                          <span className="text-sa-muted small d-block" style={{ fontSize: '11px' }}>
                            📖 {topic.chapter}
                          </span>
                        )}
                        {topic.remarks && (
                          <span className="text-sa-muted small fst-italic" style={{ fontSize: '11px' }}>
                            {topic.remarks}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <div className="fw-medium text-sa-charcoal" style={{ fontSize: '12.5px' }}>
                          {topic.subject}
                        </div>
                        <span className="badge bg-light text-secondary border fw-normal px-1.5 py-0.5 mt-0.5" style={{ fontSize: '11px' }}>
                          {topic.batch}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        <div className="fw-bold text-sa-charcoal" style={{ fontSize: '13px' }}>
                          {required} Period{required > 1 ? 's' : ''}
                        </div>
                        <span className="text-sa-muted small d-block" style={{ fontSize: '11px' }}>
                          ({totalHours} hrs • {topic.periodDurationMins || 45}m/period)
                        </span>
                        {topic.targetDate && (
                          <div className="d-flex align-items-center gap-1 text-sa-maroon fw-semibold mt-1" style={{ fontSize: '11px' }}>
                            <Calendar size={11} />
                            <span>Target: {topic.targetDate}</span>
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <div className="d-flex align-items-center justify-content-between mb-1">
                          <span className="small fw-semibold text-sa-charcoal" style={{ fontSize: '11px' }}>
                            {completed} / {required} Periods
                          </span>
                          <span className="small fw-bold text-sa-maroon" style={{ fontSize: '11px' }}>
                            {percent}%
                          </span>
                        </div>
                        <div className="progress rounded-pill" style={{ height: '6px', backgroundColor: '#F1F5F9' }}>
                          <div
                            className="progress-bar rounded-pill"
                            style={{
                              width: `${percent}%`,
                              backgroundColor: percent >= 100 ? '#168554' : '#8B1216'
                            }}
                          />
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        <span
                          className="badge rounded-pill fw-medium"
                          style={{
                            backgroundColor:
                              dynamicStatus === 'Completed'
                                ? '#EAF6EF'
                                : dynamicStatus === 'In Progress'
                                  ? '#FEF8EB'
                                  : '#F1F5F9',
                            color:
                              dynamicStatus === 'Completed'
                                ? '#168554'
                                : dynamicStatus === 'In Progress'
                                  ? '#D97718'
                                  : '#475569',
                            border: '1px solid currentColor',
                            fontSize: '11px',
                            padding: '3px 8px'
                          }}
                        >
                          {dynamicStatus}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div className="d-inline-flex align-items-center justify-content-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(topic)}
                            className="btn btn-sm btn-light border text-primary rounded shadow-xs"
                            title="Edit topic duration"
                            style={{ borderColor: '#CBD5E1', width: '32px', height: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(topic)}
                            className="btn btn-sm btn-light border text-danger rounded shadow-xs"
                            title="Delete topic plan"
                            style={{ borderColor: '#CBD5E1', width: '32px', height: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
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

      {/* Modal: Plan / Edit Topic Duration */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingId(null);
        }}
        title={editingId ? "Edit Topic Duration & Periods Plan" : "Plan Topic Duration & Allocated Periods"}
        size="lg"
      >
        <form onSubmit={handleSave} className="d-flex flex-column gap-3">
          <p className="text-sa-muted m-0" style={{ fontSize: '13px' }}>
            Set how many lecture periods, branch, and target completion date are needed to complete this syllabus topic.
          </p>

          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold small text-sa-charcoal mb-1">Branch</label>
              <select
                className="form-select form-select-sm"
                value={form.branch}
                onChange={(e) => {
                  const b = e.target.value;
                  setForm({
                    ...form,
                    branch: b,
                    batch: b === 'Mangalwar Peth'
                      ? '12th pcm Mangalvar Peth'
                      : '12th pcm tarabai park'
                  });
                }}
              >
                <option value="Tarabai Park">Tarabai Park Branch</option>
                <option value="Mangalwar Peth">Mangalwar Peth Branch</option>
              </select>
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold small text-sa-charcoal mb-1">Target Completion Date ("Complete By")</label>
              <input
                type="date"
                required
                className="form-control form-control-sm"
                value={form.targetDate}
                onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
              />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold small text-sa-charcoal mb-1">Chapter / Unit</label>
              <input
                type="text"
                className="form-control form-control-sm"
                value={form.chapter}
                onChange={(e) => setForm({ ...form, chapter: e.target.value })}
                placeholder="e.g. Chapter 7: Wave Optics"
                required
              />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold small text-sa-charcoal mb-1">Topic Name</label>
              <input
                type="text"
                className="form-control form-control-sm"
                value={form.topicName}
                onChange={(e) => setForm({ ...form, topicName: e.target.value })}
                placeholder="e.g. Wavefronts & Huygens Principle"
                required
              />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold small text-sa-charcoal mb-1">Subject</label>
              <input
                type="text"
                className="form-control form-control-sm"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="e.g. Physics (Class 12th)"
                required
              />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold small text-sa-charcoal mb-1">Target Class / Batch</label>
              <select
                className="form-select form-select-sm"
                value={form.batch}
                onChange={(e) => setForm({ ...form, batch: e.target.value })}
                required
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
                <option value="All Enrolled Batches">All Enrolled Batches</option>
              </select>
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label fw-semibold small text-sa-charcoal mb-1">Required Periods</label>
              <input
                type="number"
                min="1"
                max="30"
                className="form-control form-control-sm"
                value={form.requiredPeriods}
                onChange={(e) => setForm({ ...form, requiredPeriods: e.target.value })}
                placeholder="e.g. 3"
                required
              />
              <span className="text-sa-muted" style={{ fontSize: '11px' }}>Total periods to finish topic</span>
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label fw-semibold small text-sa-charcoal mb-1">Duration per Period (Minutes)</label>
              <select
                className="form-select form-select-sm"
                value={form.periodDurationMins}
                onChange={(e) => setForm({ ...form, periodDurationMins: e.target.value })}
              >
                <option value="45">45 Minutes (Standard)</option>
                <option value="60">60 Minutes (1 Hour)</option>
                <option value="90">90 Minutes (1.5 Hours Lab)</option>
                <option value="120">120 Minutes (2 Hours)</option>
              </select>
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label fw-semibold small text-sa-charcoal mb-1">Completed Periods</label>
              <input
                type="number"
                min="0"
                max="30"
                className="form-control form-control-sm"
                value={form.completedPeriods}
                onChange={(e) => setForm({ ...form, completedPeriods: e.target.value })}
                placeholder="e.g. 1"
              />
              <span className="text-sa-muted" style={{ fontSize: '11px' }}>Periods already taught</span>
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold small text-sa-charcoal mb-1">Topic Progress Status</label>
              <select
                className="form-select form-select-sm"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Upcoming">Upcoming</option>
              </select>
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold small text-sa-charcoal mb-1">Pacing Notes / Remarks</label>
              <input
                type="text"
                className="form-control form-control-sm"
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                placeholder="e.g. 1 period for theory, 2 periods for numericals"
              />
            </div>
          </div>

          <div className="d-flex justify-content-end align-items-center gap-2 pt-2 border-top mt-2">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setEditingId(null);
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
              <span>{editingId ? "Update Topic Plan" : "Save Topic Plan"}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
