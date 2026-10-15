import React, { useState, useEffect } from 'react';
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
  CalendarDays
} from 'lucide-react';
import Modal from '../../components/common/Modal';
import { toast } from 'react-toastify';
import curriculumService from '../../services/curriculumService';
import { useConfirm } from '../../context/ConfirmContext';

export default function TopicDurationPlanner() {
  const navigate = useNavigate();
  const { confirm } = useConfirm();

  const STORAGE_TOPICS_KEY = 'sa_teacher_topic_plans';

  // Topic Plans State
  const [topicPlans, setTopicPlans] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_TOPICS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return [
      {
        id: 'TOPIC-01',
        subject: 'Physics (Class 12th)',
        batch: '12th Science Tarabai Park (Batch A)',
        chapter: 'Chapter 7: Wave Optics',
        topicName: 'Wavefronts & Huygens Principle Derivation',
        requiredPeriods: 3,
        periodDurationMins: 45,
        completedPeriods: 2,
        status: 'In Progress',
        remarks: '2 periods covered. 1 period numerical problem-solving remaining.'
      },
      {
        id: 'TOPIC-02',
        subject: 'Physics Laboratory',
        batch: '11th Science PCM (Batch B)',
        chapter: 'Practical Mechanics & Fluids',
        topicName: 'Surface Tension by Capillary Rise Method',
        requiredPeriods: 2,
        periodDurationMins: 60,
        completedPeriods: 2,
        status: 'Completed',
        remarks: 'Completed hands-on apparatus handling and calculation verification.'
      },
      {
        id: 'TOPIC-03',
        subject: 'Applied Physics',
        batch: '12th Science Tarabai Park (Batch A)',
        chapter: 'Chapter 9: Electromagnetic Induction',
        topicName: 'Lenz\'s Law, Self-Inductance & Mutual Inductance',
        requiredPeriods: 4,
        periodDurationMins: 45,
        completedPeriods: 1,
        status: 'In Progress',
        remarks: 'Need 3 more periods to cover Faraday experiments and JEE problem set.'
      },
      {
        id: 'TOPIC-04',
        subject: 'Physics (Class 12th)',
        batch: '12th Science PCB (Batch C)',
        chapter: 'Chapter 11: Dual Nature of Radiation',
        topicName: 'Photoelectric Effect & Einstein\'s Equation',
        requiredPeriods: 3,
        periodDurationMins: 45,
        completedPeriods: 0,
        status: 'Upcoming',
        remarks: 'Planned for upcoming week.'
      }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_TOPICS_KEY, JSON.stringify(topicPlans));
    } catch (_) {}
  }, [topicPlans]);

  // Sync with backend on component mount
  useEffect(() => {
    curriculumService.getTopicDurations().then(data => {
      if (Array.isArray(data) && data.length > 0) {
        const mapped = data.map(item => ({
          ...item,
          topicName: item.topic_name || item.topicName,
          requiredPeriods: item.required_periods || item.requiredPeriods,
          periodDurationMins: item.period_duration_mins || item.periodDurationMins,
          completedPeriods: item.completed_periods || item.completedPeriods
        }));
        setTopicPlans(mapped);
      }
    });
  }, []);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    subject: 'Physics (Class 12th)',
    batch: '12th Science Tarabai Park (Batch A)',
    chapter: '',
    topicName: '',
    requiredPeriods: '3',
    periodDurationMins: '45',
    completedPeriods: '0',
    status: 'In Progress',
    remarks: ''
  });

  const [dailyActivities] = useState(() => {
    try {
      const saved = localStorage.getItem('sa_teacher_daily_activities');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
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

  // Metrics
  const totalPlannedTopics = topicPlans.length;
  const totalRequiredPeriods = topicPlans.reduce((sum, t) => sum + (parseInt(t.requiredPeriods, 10) || 0), 0);
  const totalCompletedPeriods = topicPlans.reduce((sum, t) => sum + getTopicCompletedPeriods(t), 0);
  const totalPendingPeriods = Math.max(totalRequiredPeriods - totalCompletedPeriods, 0);

  // Filtered List
  const filteredTopics = topicPlans.filter(item => {
    const matchesSearch = searchTerm === '' ||
      item.topicName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.chapter && item.chapter.toLowerCase().includes(searchTerm.toLowerCase())) ||
      item.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.batch.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm({
      subject: 'Physics (Class 12th)',
      batch: '12th Science Tarabai Park (Batch A)',
      chapter: '',
      topicName: '',
      requiredPeriods: '3',
      periodDurationMins: '45',
      completedPeriods: '0',
      status: 'In Progress',
      remarks: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (topic) => {
    setEditingId(topic.id);
    setForm({
      subject: topic.subject || 'Physics (Class 12th)',
      batch: topic.batch || '12th Science Tarabai Park (Batch A)',
      chapter: topic.chapter || '',
      topicName: topic.topicName || '',
      requiredPeriods: String(topic.requiredPeriods || '3'),
      periodDurationMins: String(topic.periodDurationMins || '45'),
      completedPeriods: String(topic.completedPeriods || '0'),
      status: topic.status || 'In Progress',
      remarks: topic.remarks || ''
    });
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.topicName.trim()) {
      toast.warning('Please enter the topic name.');
      return;
    }

    const payload = {
      ...form,
      requiredPeriods: parseInt(form.requiredPeriods, 10) || 1,
      periodDurationMins: parseInt(form.periodDurationMins, 10) || 45,
      completedPeriods: parseInt(form.completedPeriods, 10) || 0
    };

    if (editingId) {
      curriculumService.updateTopicDuration(editingId, {
        subject: payload.subject,
        batch: payload.batch,
        chapter: payload.chapter,
        topic_name: payload.topicName,
        required_periods: payload.requiredPeriods,
        period_duration_mins: payload.periodDurationMins,
        completed_periods: payload.completedPeriods,
        status: payload.status,
        remarks: payload.remarks
      });
      setTopicPlans(prev =>
        prev.map(item => (item.id === editingId ? { ...item, ...payload } : item))
      );
      toast.success('Topic duration plan updated!');
    } else {
      const created = {
        id: `TOPIC-${Date.now()}`,
        ...payload
      };
      curriculumService.createTopicDuration({
        topic_id: created.id,
        subject: payload.subject,
        batch: payload.batch,
        chapter: payload.chapter,
        topic_name: payload.topicName,
        required_periods: payload.requiredPeriods,
        period_duration_mins: payload.periodDurationMins,
        completed_periods: payload.completedPeriods,
        status: payload.status,
        remarks: payload.remarks,
        teacher_name: 'Current Faculty'
      });
      setTopicPlans(prev => [created, ...prev]);
      toast.success('New topic & duration plan created!');
    }

    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleDelete = async (id) => {
    const isConfirmed = await confirm({
      title: 'Delete Topic Plan',
      message: 'Are you sure you want to delete this topic plan?',
      subtitle: 'This will remove the topic from your curriculum planner.',
      confirmText: 'Delete Plan',
      cancelText: 'Keep Plan',
      type: 'danger'
    });

    if (isConfirmed) {
      curriculumService.deleteTopicDuration(id);
      setTopicPlans(prev => prev.filter(t => t.id !== id));
      toast.info('Topic plan removed.');
    }
  };

  // Redirect to Daily Activity Log with this topic prefilled
  const handleLogActivity = (topic) => {
    navigate('/teacher/daily-activity', {
      state: {
        prefillTopic: {
          topicTaught: topic.topicName,
          subject: topic.subject,
          batch: topic.batch,
          periods: '1',
          totalPlannedPeriods: String(topic.requiredPeriods || '2'),
          periodDurationMins: String(topic.periodDurationMins || '45'),
          remarks: topic.remarks || ''
        }
      }
    });
    toast.info(`Redirecting to Daily Activity log for ${topic.topicName}`);
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
              Define how many periods each topic will take and track teaching completion
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
        <div className="d-flex flex-column flex-sm-row align-items-center justify-content-between gap-3">
          <div className="position-relative w-100" style={{ maxWidth: '380px' }}>
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

          <select
            className="form-select form-select-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ height: '36px', fontSize: '12.5px', borderRadius: '8px', width: '180px' }}
          >
            <option value="All">All Statuses</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Upcoming">Upcoming</option>
          </select>
        </div>

        {/* Matrix Table */}
        <div className="table-responsive border rounded-3" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table className="table table-hover align-middle m-0" style={{ minWidth: '940px', fontSize: '13px' }}>
            <thead style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              <tr style={{ height: '42px' }}>
                <th style={{ width: '28%', padding: '10px 14px', fontWeight: 600, color: '#1E293B' }}>Chapter & Topic</th>
                <th style={{ width: '18%', padding: '10px 14px', fontWeight: 600, color: '#1E293B' }}>Subject / Batch</th>
                <th style={{ width: '15%', padding: '10px 14px', fontWeight: 600, color: '#1E293B' }}>Required Duration</th>
                <th style={{ width: '17%', padding: '10px 14px', fontWeight: 600, color: '#1E293B' }}>Pacing Progress</th>
                <th style={{ width: '10%', padding: '10px 14px', fontWeight: 600, color: '#1E293B' }}>Status</th>
                <th style={{ width: '12%', padding: '10px 14px', fontWeight: 600, color: '#1E293B', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTopics.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-5 text-sa-muted" style={{ fontSize: '13px' }}>
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

                  return (
                    <tr key={topic.id} style={{ height: '58px', borderBottom: '1px solid #F1F5F9' }}>
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
                        <span className="text-sa-muted small" style={{ fontSize: '11.5px' }}>
                          ({totalHours} hrs • {topic.periodDurationMins || 45}m/period)
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <div className="d-flex align-items-center justify-content-between mb-1">
                          <span className="small fw-semibold text-sa-charcoal" style={{ fontSize: '11.5px' }}>
                            {completed} / {required} Periods
                          </span>
                          <span className="small fw-bold text-sa-maroon" style={{ fontSize: '11.5px' }}>
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
                            onClick={() => handleDelete(topic.id)}
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
            Set how many lecture periods and duration are needed to complete this syllabus topic.
          </p>

          <div className="row g-3">
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
                <option value="12th Science Tarabai Park (Batch A)">12th Science Tarabai Park (Batch A)</option>
                <option value="11th Science PCM (Batch B)">11th Science PCM (Batch B)</option>
                <option value="12th Science PCB (Batch C)">12th Science PCB (Batch C)</option>
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
