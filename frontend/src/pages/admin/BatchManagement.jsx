import React, { useState, useEffect, useMemo } from 'react';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import { Plus, Trash2, Building, Building2, Layers, Lock, Sparkles, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-toastify';
import batchService from '../../services/batchService';
import teacherService from '../../services/teacherService';
import { useConfirm } from '../../context/ConfirmContext';
import { useAuth } from '../../hooks/useAuth';
import { getUserBranch, normalizeBranch, filterBatchesByBranch, CAMPUS } from '../../utils/branchUtils';
import {
  formatStandardTimeRange,
  expandDaysList,
  ALL_STANDARD_WEEKDAYS
} from '../../utils/timeScheduleUtils';

export default function BatchManagement() {
  const { user } = useAuth();
  const { confirm } = useConfirm();

  const isSuperAdmin = (user?.role || '').toLowerCase().includes('super');
  const rawBranch = getUserBranch(user) || user?.branch;
  const userBranch = rawBranch ? (rawBranch.toLowerCase().includes('mangal') ? CAMPUS.MANGALVAR_PETH : CAMPUS.TARABAI_PARK) : CAMPUS.TARABAI_PARK;

  // Campus context: SuperAdmin can view All, Mangalvar Peth, or Tarabai Park
  const [selectedCampus, setSelectedCampus] = useState(isSuperAdmin ? 'All' : userBranch);

  // Regular admin is strictly scoped to their logged-in campus
  const effectiveCampus = isSuperAdmin ? selectedCampus : userBranch;

  const [batches, setBatches] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    standard: '11th Science',
    section: 'PCM',
    branch: userBranch,
    subject: 'Physics, Chemistry, Mathematics',
    room: '',
    time: '10:30 AM – 01:00 PM',
    days: ALL_STANDARD_WEEKDAYS,
    date: '',
    student_count: 24,
    teacher_name: ''
  });

  // Helper to compute batch name automatically according to Section, Standard & Branch
  const getAutoBatchName = (branch, standard, section) => {
    const is12th = String(standard || '').includes('12');
    const std = is12th ? '12th' : '11th';
    const sec = String(section || 'PCM').toLowerCase().trim();
    const isMP = String(branch || '').toLowerCase().includes('mangal');

    if (isMP) {
      return `${std} ${sec} Mangalvar Peth`;
    } else {
      return `${std} ${sec} tarabai park`;
    }
  };

  const getDefaultSubject = (section) => {
    const sec = String(section || '').toUpperCase();
    if (sec === 'PCMB') return 'Physics, Chemistry, Maths, Biology';
    if (sec === 'PCB') return 'Physics, Chemistry, Biology';
    return 'Physics, Chemistry, Mathematics';
  };

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const branchParam = isSuperAdmin ? selectedCampus : userBranch;
      const [batchData, teacherData] = await Promise.all([
        batchService.getBatches({ branch: branchParam }),
        teacherService.getAll()
      ]);
      setBatches(batchData || []);
      setTeachers(teacherData || []);
    } catch (err) {
      toast.error('Failed to load batches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, [effectiveCampus]);

  // Counts per campus
  const mpCount = useMemo(() => {
    return filterBatchesByBranch(batches, CAMPUS.MANGALVAR_PETH).length;
  }, [batches]);

  const tpCount = useMemo(() => {
    return filterBatchesByBranch(batches, CAMPUS.TARABAI_PARK).length;
  }, [batches]);

  // Filter batches displayed in the table for active campus
  const displayedBatches = useMemo(() => {
    if (!isSuperAdmin) {
      return filterBatchesByBranch(batches, userBranch);
    }
    if (!effectiveCampus || effectiveCampus === 'All') return batches;
    return filterBatchesByBranch(batches, effectiveCampus);
  }, [batches, effectiveCampus, isSuperAdmin, userBranch]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // When standard or section changes, update batch name and subject automatically
  const handleSectionOrStandardChange = (field, value) => {
    setFormData(prev => {
      const nextStd = field === 'standard' ? value : prev.standard;
      const nextSec = field === 'section' ? value : prev.section;
      const nextBranch = prev.branch;
      const autoName = getAutoBatchName(nextBranch, nextStd, nextSec);
      const autoSub = field === 'section' ? getDefaultSubject(nextSec) : prev.subject;

      return {
        ...prev,
        [field]: value,
        name: autoName,
        subject: autoSub
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const stdNum = String(formData.standard || '').includes('12') ? '12' : '11';
      const branchCode = String(formData.branch || '').toLowerCase().includes('mangal') ? 'MP' : 'TP';
      const code = `${stdNum}-${formData.section}-${branchCode}`;
      const formattedTime = formatStandardTimeRange(formData.time || '10:30 AM – 01:00 PM');
      const activeDays = expandDaysList(formData.days || ALL_STANDARD_WEEKDAYS);

      const payload = {
        ...formData,
        time: formattedTime,
        days: activeDays,
        batch_name: code,
        class_code: code,
        student_count: Number(formData.student_count) || 0,
        branch: formData.branch
      };

      const batchId = editingBatch?.id || editingBatch?._id;
      if (editingBatch && batchId) {
        await batchService.updateBatch(batchId, payload);
        toast.success(`Batch '${formData.name}' updated successfully`);
      } else {
        await batchService.createBatch(payload);
        toast.success(`Batch '${formData.name}' created successfully`);
      }
      setModalOpen(false);
      setEditingBatch(null);
      await fetchBatches();
    } catch (err) {
      console.error('Batch update error:', err);
      const detail = err.response?.data?.detail;
      const errMsg = typeof detail === 'string' ? detail : (err.message || (editingBatch ? 'Failed to update batch' : 'Failed to create batch'));
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (batch) => {
    const rawBranch = batch.branch || batch.name || '';
    const batchBranch = rawBranch.toLowerCase().includes('mangal')
      ? CAMPUS.MANGALVAR_PETH
      : CAMPUS.TARABAI_PARK;

    const std = batch.standard || (String(batch.name || '').includes('12') ? '12th Science' : '11th Science');

    const nameLower = String(batch.name || '').toLowerCase();
    let sec = 'PCM';
    if (nameLower.includes('pcmb')) sec = 'PCMB';
    else if (nameLower.includes('pcb')) sec = 'PCB';
    else if (nameLower.includes('pcm')) sec = 'PCM';
    else if (batch.section) sec = batch.section;

    // Accurately preserve and display the existing batch name for Mangalwar Peth / Tarabai Park
    const currentName = batch.name || getAutoBatchName(batchBranch, std, sec);

    let cleanDate = '';
    if (batch.date) {
      const dStr = String(batch.date).trim();
      if (/^\d{4}-\d{2}-\d{2}/.test(dStr)) {
        cleanDate = dStr.substring(0, 10);
      } else if (/^\d{2}-\d{2}-\d{4}$/.test(dStr)) {
        const parts = dStr.split('-');
        cleanDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
      } else {
        try {
          const parsed = new Date(batch.date);
          if (!isNaN(parsed.getTime())) {
            cleanDate = parsed.toISOString().split('T')[0];
          }
        } catch (_) {}
      }
    }

    setFormData({
      name: currentName,
      standard: std,
      section: sec,
      branch: batchBranch,
      subject: batch.subject || getDefaultSubject(sec),
      room: batch.room || '',
      time: formatStandardTimeRange(batch.time || '10:30 AM – 01:00 PM'),
      days: expandDaysList(batch.days || ALL_STANDARD_WEEKDAYS),
      date: cleanDate,
      student_count: batch.student_count || 0,
      teacher_name: batch.teacher_name || ''
    });
    setEditingBatch(batch);
    setModalOpen(true);
  };

  const handleBranchChange = (newBranch) => {
    const autoName = getAutoBatchName(newBranch, formData.standard, formData.section);
    const defaultRoom = newBranch.toLowerCase().includes('mangal')
      ? 'Hall 1 (Manglavar Peth)'
      : 'Room 101 (Tarabai Park)';

    setFormData(prev => ({
      ...prev,
      branch: newBranch,
      name: autoName,
      room: prev.room && !prev.room.includes('Hall 1') && !prev.room.includes('Room 101') ? prev.room : defaultRoom
    }));
  };

  const openCreateModal = () => {
    const targetBranch = isSuperAdmin
      ? (selectedCampus !== 'All' ? selectedCampus : (userBranch || CAMPUS.MANGALVAR_PETH))
      : (userBranch || CAMPUS.MANGALVAR_PETH);
    const defaultStd = '11th Science';
    const defaultSec = 'PCM';
    const autoName = getAutoBatchName(targetBranch, defaultStd, defaultSec);
    const defaultRoom = targetBranch.toLowerCase().includes('mangal')
      ? 'Hall 1 (Manglavar Peth)'
      : 'Room 101 (Tarabai Park)';

    setFormData({
      name: autoName,
      standard: defaultStd,
      section: defaultSec,
      branch: targetBranch,
      subject: getDefaultSubject(defaultSec),
      room: defaultRoom,
      time: '10:30 AM – 01:00 PM',
      days: ALL_STANDARD_WEEKDAYS,
      date: '',
      student_count: 24,
      teacher_name: teachers[0]?.full_name || teachers[0]?.name || ''
    });
    setEditingBatch(null);
    setModalOpen(true);
  };

  const handleDelete = async (id, batchObj = null) => {
    const isConfirmed = await confirm({
      title: 'Delete Class Batch',
      message: 'Are you sure you want to delete this batch?',
      subtitle: 'This will remove the batch allocation from your schedule.',
      confirmText: 'Delete Batch',
      cancelText: 'Cancel',
      type: 'danger'
    });

    if (isConfirmed) {
      try {
        await batchService.deleteBatch(id, batchObj);
        toast.success('Batch deleted successfully');
        fetchBatches();
      } catch (err) {
        toast.error('Failed to delete batch');
      }
    }
  };

  return (
    <div className="d-flex flex-column gap-4">
      {/* Page Header with Clean Unified Branch Selection */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
        <div>
          <h3 className="brand-font fw-bold text-sa-charcoal m-0 fs-4">Batch Schedule & Management</h3>
          <span className="small text-sa-muted">
            {isSuperAdmin
              ? 'Manage class batches, sections, schedules, and faculty allocations separately for Manglavar Peth and Tarabai Park'
              : `Manage class batches, sections, schedules, and faculty allocations for ${effectiveCampus}`}
          </span>
        </div>

        <div className="d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center gap-2.5 w-100 w-md-auto">
          {/* Branch context indicator for regular Admin */}
          {!isSuperAdmin && (
            <div
              className="d-inline-flex align-items-center justify-content-center gap-1.5 px-3 py-1.5 rounded-pill shadow-xs w-100 w-sm-auto text-nowrap"
              style={{
                backgroundColor: effectiveCampus.toLowerCase().includes('mangal') ? '#FDF0F0' : '#EFF6FF',
                border: effectiveCampus.toLowerCase().includes('mangal') ? '1px solid #FECACA' : '1px solid #BFDBFE',
                color: effectiveCampus.toLowerCase().includes('mangal') ? '#8B1216' : '#1D4ED8',
                fontSize: '12.5px',
                fontWeight: 600,
                height: '40px'
              }}
            >
              <Building2 size={14} />
              <span>{effectiveCampus}</span>
            </div>
          )}

          {/* Unified Branch Filter Dropdown - Only shown to SuperAdmin */}
          {isSuperAdmin && (
            <div className="position-relative d-inline-flex align-items-center w-100 w-sm-auto" style={{ minWidth: '200px' }}>
              <Building2
                size={15}
                className="position-absolute"
                style={{
                  left: '12px',
                  pointerEvents: 'none',
                  color: selectedCampus === 'All' ? '#64748B' : (selectedCampus.toLowerCase().includes('mangal') ? '#8B1216' : '#1D4ED8')
                }}
              />
              <select
                value={selectedCampus}
                onChange={(e) => setSelectedCampus(e.target.value)}
                className="form-select fw-semibold w-100"
                style={{
                  paddingLeft: '36px',
                  paddingRight: '32px',
                  height: '40px',
                  borderRadius: '10px',
                  borderColor: '#D8DEE4',
                  backgroundColor: '#FFFFFF',
                  color: '#0F172A',
                  fontSize: '13px',
                  boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
                  cursor: 'pointer'
                }}
                aria-label="Filter by Branch Campus"
              >
                <option value="All">All Branches ({batches.length} Batches)</option>
                <option value={CAMPUS.MANGALVAR_PETH}>Manglavar Peth ({mpCount} Batches)</option>
                <option value={CAMPUS.TARABAI_PARK}>Tarabai Park ({tpCount} Batches)</option>
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={openCreateModal}
            className="btn d-inline-flex align-items-center justify-content-center gap-2 text-white border-0 fw-semibold shadow-xs w-100 w-sm-auto text-nowrap"
            style={{
              backgroundColor: '#8B1216',
              fontSize: '13px',
              height: '40px',
              padding: '0 18px',
              borderRadius: '10px',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              lineHeight: 1
            }}
            onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(0.92)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)'; }}
          >
            <Plus size={16} strokeWidth={2.4} />
            <span>Create Batch Schedule</span>
          </button>
        </div>
      </div>

      {/* Batches Table Card */}
      <div className="sa-card p-4">
        <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2">
            <h5 className="brand-font fw-bold text-sa-charcoal m-0 fs-6">
              Active Batch Schedules
            </h5>
            <span
              className="badge rounded-pill fw-semibold"
              style={{
                backgroundColor: effectiveCampus === 'All' ? '#F1F5F9' : (effectiveCampus.toLowerCase().includes('mangal') ? '#FDF0F0' : '#EFF6FF'),
                color: effectiveCampus === 'All' ? '#475569' : (effectiveCampus.toLowerCase().includes('mangal') ? '#8B1216' : '#1D4ED8'),
                border: effectiveCampus === 'All' ? '1px solid #E2E8F0' : (effectiveCampus.toLowerCase().includes('mangal') ? '1px solid #FECACA' : '1px solid #BFDBFE'),
                fontSize: '11px',
                padding: '3px 9px'
              }}
            >
              {effectiveCampus === 'All' ? `All Campuses (${displayedBatches.length})` : `${effectiveCampus} (${displayedBatches.length})`}
            </span>
          </div>
          <span className="small text-muted">
            {isSuperAdmin
              ? `Showing ${displayedBatches.length} of ${batches.length} total batches`
              : `Showing ${displayedBatches.length} batches for ${effectiveCampus}`}
          </span>
        </div>
        <Table
          columns={[
            {
              key: 'name',
              title: 'Batch Name',
              render: (val, row) => (
                <div>
                  <div className="fw-bold text-sa-charcoal">{val}</div>
                  <div className="small text-muted" style={{ fontSize: '11px' }}>
                    {row.standard || 'Science'} • {row.section || 'General'}
                  </div>
                </div>
              )
            },
            {
              key: 'branch',
              title: 'Branch',
              render: (val, row) => {
                const br = val || row.branch || (row.name && row.name.toLowerCase().includes('mangal') ? 'Manglavar Peth' : 'Tarabai Park');
                const isMP = br.toLowerCase().includes('mangal');
                return (
                  <span
                    className="badge rounded-pill fw-semibold px-2.5 py-1"
                    style={{
                      backgroundColor: isMP ? '#FDF0F0' : '#EFF6FF',
                      color: isMP ? '#8B1216' : '#1D4ED8',
                      border: isMP ? '1px solid #F5C2C7' : '1px solid #BFDBFE',
                      fontSize: '11px'
                    }}
                  >
                    {isMP ? 'Manglavar Peth' : 'Tarabai Park'}
                  </span>
                );
              }
            },
            { key: 'standard', title: 'Standard' },
            { key: 'subject', title: 'Subject' },
            { key: 'room', title: 'Lecture Hall' },
            {
              key: 'time',
              title: 'Schedule / Time',
              render: (val, row) => (
                <div>
                  <div style={{ color: '#0F172A', fontWeight: 500 }}>{row.time || 'N/A'}</div>
                  <div className="text-muted" style={{ fontSize: '11.5px' }}>{row.date || 'Regular'}</div>
                </div>
              )
            },
            { key: 'student_count', title: 'Students' },
            { key: 'teacher_name', title: 'Teacher' },
            {
              key: 'id',
              title: 'Action',
              align: 'end',
              render: (val, row) => (
                <div className="d-flex justify-content-end gap-2">
                  <button className="btn btn-sm btn-outline-primary" onClick={() => handleEdit(row)}>
                    Edit
                  </button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(val || row._id || row.id, row)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              )
            }
          ]}
          data={displayedBatches}
          loading={loading}
        />
      </div>

      {/* Create / Edit Batch Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingBatch(null); }}
        title={editingBatch ? "Edit Batch Schedule" : "Create New Batch Schedule"}
      >
        <form onSubmit={handleSubmit}>
          {/* Branch Selection Option */}
          <div className="mb-3">
            <label className="form-label small fw-semibold text-sa-charcoal d-flex align-items-center justify-content-between mb-1">
              <span className="d-flex align-items-center gap-1.5">
                <Building size={14} className="text-sa-primary" />
                Branch Location *
              </span>
              <span className="badge bg-light text-sa-primary border px-2 py-0.5 rounded-pill" style={{ fontSize: '11px' }}>
                {isSuperAdmin ? 'Separate Schedule' : 'Fixed to Your Branch'}
              </span>
            </label>
            {isSuperAdmin ? (
              <select
                name="branch"
                value={formData.branch}
                onChange={(e) => handleBranchChange(e.target.value)}
                className="form-select fw-semibold"
                required
              >
                <option value={CAMPUS.MANGALVAR_PETH}>Manglavar Peth (MP)</option>
                <option value={CAMPUS.TARABAI_PARK}>Tarabai Park (TP)</option>
              </select>
            ) : (
              <div className="d-flex align-items-center justify-content-between p-2.5 rounded-3 border bg-light">
                <span className="fw-semibold text-sa-charcoal" style={{ fontSize: '13.5px' }}>
                  {formData.branch.toLowerCase().includes('mangal') ? 'Manglavar Peth (MP)' : 'Tarabai Park (TP)'}
                </span>
                <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-0.5 rounded-pill" style={{ fontSize: '11px' }}>
                  Active Campus
                </span>
              </div>
            )}
            <div className="form-text text-muted small mt-1">
              Schedule and batch allocations will be managed for <strong>{formData.branch.toLowerCase().includes('mangal') ? 'Manglavar Peth' : 'Tarabai Park'}</strong>.
            </div>
          </div>

          {/* Standard & Section Selection */}
          <div className="row g-2 mb-3">
            <div className="col-6">
              <label className="form-label small fw-semibold text-sa-charcoal mb-1">Class / Standard *</label>
              <select
                name="standard"
                value={formData.standard}
                onChange={(e) => handleSectionOrStandardChange('standard', e.target.value)}
                className="form-select"
                required
              >
                <option value="11th Science">11th Science</option>
                <option value="12th Science">12th Science</option>
              </select>
            </div>
            <div className="col-6">
              <label className="form-label small fw-semibold text-sa-charcoal mb-1">Section (Stream) *</label>
              <select
                name="section"
                value={formData.section}
                onChange={(e) => handleSectionOrStandardChange('section', e.target.value)}
                className="form-select"
                required
              >
                <option value="PCM">PCM (Physics, Chemistry, Maths)</option>
                <option value="PCB">PCB (Physics, Chemistry, Biology)</option>
                <option value="PCMB">PCMB (Maths & Biology)</option>
              </select>
            </div>
          </div>

          {/* Batch Name (Fixed Automatically according to Section & Branch) */}
          <div className="mb-3">
            <label className="form-label small fw-semibold text-sa-charcoal d-flex align-items-center justify-content-between mb-1">
              <span className="d-flex align-items-center gap-1.5">
                <Layers size={14} className="text-sa-primary" />
                Batch Name (Auto-Fixed from Section) *
              </span>
              <span className="badge bg-light text-sa-muted border px-2 py-0.5 rounded-pill" style={{ fontSize: '11px' }}>
                <Sparkles size={10} className="text-warning me-1 inline-block" /> Auto-Generated from Section
              </span>
            </label>
            <div className="input-group">
              <input
                type="text"
                name="name"
                value={formData.name}
                className="form-control bg-light fw-bold text-sa-primary"
                readOnly
                placeholder="Batch Name will be auto-generated"
                required
              />
              <span className="input-group-text bg-light text-muted">
                <Lock size={15} />
              </span>
            </div>
            <div className="form-text text-muted small mt-1">
              Batch name is automatically fixed based on selected Section (<strong>{formData.section}</strong>) and Branch (<strong>{formData.branch.toLowerCase().includes('mangal') ? 'Mangalwar Peth (MP)' : 'Tarabai Park (TP)'}</strong>).
            </div>
          </div>

          {/* Subject & Room */}
          <div className="row g-2 mb-3">
            <div className="col-6">
              <Input
                label="Subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                placeholder="e.g. Physics, Chemistry, Maths"
              />
            </div>
            <div className="col-6">
              <Input
                label="Lecture Hall"
                name="room"
                value={formData.room}
                onChange={handleChange}
                required
                placeholder="e.g. Hall A (Mangalvar Peth)"
              />
            </div>
          </div>

          {/* Time & Students */}
          <div className="row g-2 mb-3">
            <div className="col-6">
              <Input
                label="Time Schedule"
                name="time"
                value={formData.time || ''}
                onChange={handleChange}
                onBlur={() => {
                  if (formData.time) {
                    setFormData(prev => ({ ...prev, time: formatStandardTimeRange(prev.time) }));
                  }
                }}
                required
                placeholder="e.g. 10:30 AM – 01:00 PM"
              />
            </div>
            <div className="col-6">
              <Input
                label="Student Capacity"
                name="student_count"
                type="number"
                value={formData.student_count}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Schedule Days */}
          <div className="mb-3">
            <label className="form-label small fw-semibold text-sa-charcoal mb-1 d-flex justify-content-between align-items-center">
              <span>Batch Schedule Days *</span>
              <span className="small text-muted" style={{ fontSize: '11px' }}>
                Active: <strong>{Array.isArray(formData.days) ? formData.days.length : 6} days/week</strong>
              </span>
            </label>
            <div className="d-flex flex-wrap gap-1.5 mb-2">
              {[
                { label: 'All Weekdays (Mon – Sat)', value: 'ALL', days: ALL_STANDARD_WEEKDAYS },
                { label: 'Tue, Thu, Sat (TTS)', value: 'TTS', days: ['Tuesday', 'Thursday', 'Saturday'] },
                { label: 'Mon, Wed, Fri (MWF)', value: 'MWF', days: ['Monday', 'Wednesday', 'Friday'] }
              ].map((preset) => {
                const isSelected = Array.isArray(formData.days) &&
                  formData.days.length === preset.days.length &&
                  preset.days.every(d => formData.days.includes(d));
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, days: preset.days }))}
                    className="btn btn-sm px-2.5 py-1 rounded-pill fw-semibold"
                    style={{
                      fontSize: '11px',
                      backgroundColor: isSelected ? '#8B1216' : '#F1F5F9',
                      color: isSelected ? '#FFFFFF' : '#475569',
                      border: isSelected ? '1px solid #8B1216' : '1px solid #E2E8F0'
                    }}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
            {/* Day toggles for custom selection */}
            <div className="d-flex flex-wrap gap-1.5 p-2 bg-light rounded-3 border" style={{ borderColor: '#E2E8F0' }}>
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                const active = Array.isArray(formData.days) && formData.days.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => {
                      setFormData(prev => {
                        const current = Array.isArray(prev.days) ? [...prev.days] : [...ALL_STANDARD_WEEKDAYS];
                        const idx = current.indexOf(day);
                        if (idx >= 0) {
                          if (current.length > 1) current.splice(idx, 1);
                        } else {
                          current.push(day);
                        }
                        return { ...prev, days: current };
                      });
                    }}
                    className="btn btn-sm px-2 py-0.5 rounded-2 fw-medium"
                    style={{
                      fontSize: '11px',
                      backgroundColor: active ? '#FEE2E2' : '#FFFFFF',
                      color: active ? '#8B1216' : '#64748B',
                      border: active ? '1px solid #FCA5A5' : '1px solid #CBD5E1'
                    }}
                  >
                    {day.substring(0, 3)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date & Teacher */}
          <div className="row g-2 mb-3">
            <div className="col-6">
              <Input
                label="Effective Date (Optional)"
                name="date"
                type="date"
                value={formData.date || ''}
                onChange={handleChange}
              />
            </div>
            <div className="col-6">
              <label className="form-label small fw-semibold text-sa-charcoal mb-1">Assigned Teacher</label>
              <select
                name="teacher_name"
                value={formData.teacher_name || ''}
                onChange={handleChange}
                className="form-select"
              >
                <option value="">Select Teacher</option>
                {teachers.map(t => (
                  <option key={t.id || t._id} value={t.full_name || t.name}>
                    {t.full_name || t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            <Button
              variant="light"
              onClick={() => { setModalOpen(false); setEditingBatch(null); }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={submitting}
              disabled={submitting}
              id="btn-update-batch"
            >
              {editingBatch ? "Update Batch" : "Create Batch"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

