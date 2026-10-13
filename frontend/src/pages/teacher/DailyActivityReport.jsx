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
  Calendar,
  Filter,
  Search,
  Printer,
  Layers,
  FileText
} from 'lucide-react';
import Modal from '../../components/common/Modal';
import { toast } from 'react-toastify';

export default function DailyActivityReport() {
  const navigate = useNavigate();

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
        activity: 'Classroom Lecture & Theory',
        subject: 'Physics (Class 12th)',
        batch: '12th Science Tarabai Park (Batch A)',
        topicTaught: 'Wave Optics - Wavefronts & Huygens Principle Derivation',
        timeSlot: '08:30 AM - 10:00 AM',
        hours: 1.5,
        status: 'Completed',
        remarks: 'Derived reflection & refraction laws. Solved 4 numerical problems on slit interference. Homework assigned.'
      },
      {
        id: 'ACT-02',
        activity: 'Practical Lab Session',
        subject: 'Physics Laboratory',
        batch: '11th Science PCM (Batch B)',
        topicTaught: 'Surface Tension by Capillary Rise Method - Hands-on Experiment',
        timeSlot: '10:30 AM - 12:30 PM',
        hours: 2.0,
        status: 'Completed',
        remarks: 'Checked student lab journals, calibrated traveling microscope apparatus for all 24 students.'
      },
      {
        id: 'ACT-03',
        activity: 'Doubt Clearing Masterclass',
        subject: 'Applied Physics',
        batch: '12th Science Tarabai Park (Batch A)',
        topicTaught: 'Electromagnetic Induction - Lenz\'s Law & Self-Inductance Numericals',
        timeSlot: '01:30 PM - 02:30 PM',
        hours: 1.0,
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

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedActivityFilter, setSelectedActivityFilter] = useState('All');
  const [selectedBatchFilter, setSelectedBatchFilter] = useState('All');

  // Modal State
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [newActivity, setNewActivity] = useState({
    activity: 'Classroom Lecture & Theory',
    subject: 'Physics',
    batch: '12th Science Tarabai Park (Batch A)',
    topicTaught: '',
    timeSlot: '03:00 PM - 04:00 PM',
    hours: '1.0',
    status: 'Completed',
    remarks: ''
  });

  // Computed Metrics
  const totalTeachingHoursToday = dailyActivities
    .reduce((sum, act) => sum + (parseFloat(act.hours) || 0), 0)
    .toFixed(1);

  const completedActivitiesCount = dailyActivities.filter(a => a.status === 'Completed').length;
  const uniqueTopicsTaughtCount = dailyActivities.filter(a => a.topicTaught && a.topicTaught.trim().length > 0).length;
  const uniqueBatchesCount = new Set(dailyActivities.map(a => a.batch)).size;

  const targetHours = 6.0;
  const progressPercent = Math.min(Math.round((parseFloat(totalTeachingHoursToday) / targetHours) * 100), 100);

  // Filtered Activities
  const filteredActivities = dailyActivities.filter(item => {
    const matchesSearch = searchTerm === '' ||
      item.topicTaught.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.batch.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesActivity = selectedActivityFilter === 'All' || item.activity === selectedActivityFilter;
    const matchesBatch = selectedBatchFilter === 'All' || item.batch === selectedBatchFilter;

    return matchesSearch && matchesActivity && matchesBatch;
  });

  const handleAddActivity = (e) => {
    e.preventDefault();
    if (!newActivity.topicTaught.trim()) {
      toast.warning('Please enter the topic taught today.');
      return;
    }
    const created = {
      id: `ACT-${Date.now()}`,
      ...newActivity,
      hours: parseFloat(newActivity.hours) || 1.0
    };
    setDailyActivities(prev => [created, ...prev]);
    setIsActivityModalOpen(false);
    setNewActivity({
      activity: 'Classroom Lecture & Theory',
      subject: 'Physics',
      batch: '12th Science Tarabai Park (Batch A)',
      topicTaught: '',
      timeSlot: '03:00 PM - 04:00 PM',
      hours: '1.0',
      status: 'Completed',
      remarks: ''
    });
    toast.success('Teaching activity & topic logged successfully!');
  };

  const handleDeleteActivity = (id) => {
    setDailyActivities(prev => prev.filter(a => a.id !== id));
    toast.info('Activity record removed.');
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
            onClick={handlePrint}
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
            title="Print or export daily activity log"
          >
            <Printer size={15} style={{ color: '#64748B' }} />
            <span>Print Report</span>
          </button>

          <button
            type="button"
            onClick={() => setIsActivityModalOpen(true)}
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
                value={selectedActivityFilter}
                onChange={(e) => setSelectedActivityFilter(e.target.value)}
                style={{ height: '36px', fontSize: '12.5px', borderRadius: '8px', width: '180px' }}
              >
                <option value="All">All Activities</option>
                <option value="Classroom Lecture & Theory">Classroom Lecture</option>
                <option value="Practical Lab Session">Practical Lab</option>
                <option value="Doubt Clearing Masterclass">Doubt Clearing</option>
                <option value="Revision & Numericals Solving">Revision Session</option>
              </select>
            </div>

            <select
              className="form-select form-select-sm"
              value={selectedBatchFilter}
              onChange={(e) => setSelectedBatchFilter(e.target.value)}
              style={{ height: '36px', fontSize: '12.5px', borderRadius: '8px', width: '190px' }}
            >
              <option value="All">All Batches</option>
              <option value="12th Science Tarabai Park (Batch A)">12th Science (Batch A)</option>
              <option value="11th Science PCM (Batch B)">11th Science (Batch B)</option>
            </select>
          </div>
        </div>

        {/* Activities Table */}
        <div className="table-responsive border rounded-3" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table className="table table-hover align-middle m-0" style={{ minWidth: '920px', fontSize: '13px' }}>
            <thead style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              <tr style={{ height: '42px' }}>
                <th style={{ width: '17%', padding: '10px 14px', fontWeight: 600, color: '#1E293B' }}>Activity Type</th>
                <th style={{ width: '17%', padding: '10px 14px', fontWeight: 600, color: '#1E293B' }}>Class / Batch</th>
                <th style={{ width: '32%', padding: '10px 14px', fontWeight: 600, color: '#1E293B' }}>Topic Taught & Outcomes</th>
                <th style={{ width: '13%', padding: '10px 14px', fontWeight: 600, color: '#1E293B' }}>Time Slot</th>
                <th style={{ width: '10%', padding: '10px 14px', fontWeight: 600, color: '#1E293B' }}>Hours Spent</th>
                <th style={{ width: '6%', padding: '10px 14px', fontWeight: 600, color: '#1E293B' }}>Status</th>
                <th style={{ width: '5%', padding: '10px 14px', fontWeight: 600, color: '#1E293B', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-5 text-sa-muted" style={{ fontSize: '13px' }}>
                    No daily activities found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredActivities.map((act) => (
                  <tr key={act.id} style={{ height: '58px', borderBottom: '1px solid #F1F5F9' }}>
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
                        {act.batch}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div className="fw-bold text-sa-charcoal" style={{ fontSize: '13px' }}>
                        {act.topicTaught}
                      </div>
                      {act.remarks && (
                        <div className="text-sa-muted" style={{ fontSize: '11.5px', marginTop: '3px' }}>
                          {act.remarks}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                      <span className="text-sa-charcoal fw-medium" style={{ fontSize: '12.5px' }}>
                        {act.timeSlot}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                      <span className="fw-bold px-2 py-1 rounded" style={{ backgroundColor: '#FDF0F0', color: '#8B1216', fontSize: '13px' }}>
                        {act.hours} hrs
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                      <span className="badge rounded-pill" style={{ backgroundColor: '#EAF6EF', color: '#168554', border: '1px solid #C6E7D2', fontSize: '11px', padding: '4px 10px' }}>
                        ✓ {act.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        type="button"
                        onClick={() => handleDeleteActivity(act.id)}
                        className="btn btn-sm btn-light border text-danger p-1.5 rounded"
                        title="Delete this activity log"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Log Activity Modal */}
      <Modal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        title="Log Today's Teaching Activity & Topic"
        size="lg"
      >
        <form onSubmit={handleAddActivity} className="d-flex flex-column gap-3">
          <p className="text-sa-muted m-0" style={{ fontSize: '13px' }}>
            Record the topic taught, class batch, and teaching duration for today's daily activity report.
          </p>

          <div className="row g-3">
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
                <option value="11th Science PCM (Batch B)">11th Science PCM (Batch B)</option>
                <option value="12th Science PCB (Batch C)">12th Science PCB (Batch C)</option>
                <option value="All Enrolled Batches">All Enrolled Batches</option>
              </select>
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

            <div className="col-12 col-md-6">
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

            <div className="col-12">
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
              onClick={() => setIsActivityModalOpen(false)}
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
              <Plus size={14} />
              <span>Save Activity Log</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
