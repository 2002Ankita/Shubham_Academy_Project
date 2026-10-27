import React, { useState, useEffect, useMemo } from 'react';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import { Plus, Trash2, Building, Layers, Lock, Sparkles, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-toastify';
import batchService from '../../services/batchService';
import teacherService from '../../services/teacherService';
import { useConfirm } from '../../context/ConfirmContext';
import { useAuth } from '../../hooks/useAuth';
import { getUserBranch, normalizeBranch, filterBatchesByBranch, CAMPUS } from '../../utils/branchUtils';

export default function BatchManagement() {
  const { user } = useAuth();
  const { confirm } = useConfirm();

  const userBranch = getUserBranch(user);
  const isSuperAdmin = (user?.role || '').toLowerCase().includes('super');

  // Campus context: SuperAdmins can toggle campuses; regular admins are locked to their assigned branch
  const [selectedCampus, setSelectedCampus] = useState(userBranch || CAMPUS.MANGALVAR_PETH);

  const [batches, setBatches] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    standard: '11th Science',
    section: 'PCM',
    branch: CAMPUS.MANGALVAR_PETH,
    subject: 'Physics, Chemistry, Mathematics',
    room: '',
    time: '08:00 AM – 10:30 AM',
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
      const [batchData, teacherData] = await Promise.all([
        batchService.getBatches({ branch: 'ALL' }),
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
  }, []);

  // Update selectedCampus if user branch becomes available
  useEffect(() => {
    if (userBranch && !isSuperAdmin) {
      setSelectedCampus(userBranch);
    }
  }, [userBranch, isSuperAdmin]);

  // Filter batches displayed in the table for active campus
  const activeBranchFilter = isSuperAdmin ? selectedCampus : (userBranch || CAMPUS.MANGALVAR_PETH);
  const displayedBatches = useMemo(() => {
    if (!activeBranchFilter || activeBranchFilter === 'All') return batches;
    return filterBatchesByBranch(batches, activeBranchFilter);
  }, [batches, activeBranchFilter]);

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
    try {
      const stdNum = String(formData.standard || '').includes('12') ? '12' : '11';
      const branchCode = String(formData.branch || '').toLowerCase().includes('mangal') ? 'MP' : 'TP';
      const code = `${stdNum}-${formData.section}-${branchCode}`;

      const payload = {
        ...formData,
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
      fetchBatches();
    } catch (err) {
      toast.error(editingBatch ? 'Failed to update batch' : 'Failed to create batch');
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

    setFormData({
      name: currentName,
      standard: std,
      section: sec,
      branch: batchBranch,
      subject: batch.subject || getDefaultSubject(sec),
      room: batch.room || '',
      time: batch.time || '',
      date: batch.date || '',
      student_count: batch.student_count || 0,
      teacher_name: batch.teacher_name || ''
    });
    setEditingBatch(batch);
    setModalOpen(true);
  };

  const openCreateModal = () => {
    const targetBranch = isSuperAdmin ? selectedCampus : (userBranch || CAMPUS.MANGALVAR_PETH);
    const defaultStd = '11th Science';
    const defaultSec = 'PCM';
    const autoName = getAutoBatchName(targetBranch, defaultStd, defaultSec);
    const defaultRoom = targetBranch.toLowerCase().includes('mangal')
      ? 'Hall 1 (Mangalvar Peth)'
      : 'Room 101 (Tarabai Park)';

    setFormData({
      name: autoName,
      standard: defaultStd,
      section: defaultSec,
      branch: targetBranch,
      subject: getDefaultSubject(defaultSec),
      room: defaultRoom,
      time: '08:00 AM – 10:30 AM',
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
      {/* Page Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
        <div>
          <div className="d-flex align-items-center gap-2">
            <h3 className="brand-font fw-bold text-sa-charcoal m-0 fs-4">Batch Management</h3>
            <span
              className="badge px-2.5 py-1 rounded-pill fw-bold"
              style={{
                backgroundColor: activeBranchFilter.toLowerCase().includes('mangal') ? '#FDF0F0' : '#EFF6FF',
                color: activeBranchFilter.toLowerCase().includes('mangal') ? '#8B1216' : '#1D4ED8',
                border: activeBranchFilter.toLowerCase().includes('mangal') ? '1px solid #F5C2C7' : '1px solid #BFDBFE',
                fontSize: '0.78rem'
              }}
            >
              🏛️ {activeBranchFilter} Campus
            </span>
          </div>
          <span className="small text-sa-muted">
            Manage class batches, sections, schedules, and faculty allocations
          </span>
        </div>

        <div className="d-flex align-items-center gap-2">
          {/* Campus Switcher for SuperAdmin */}
          {isSuperAdmin && (
            <div className="btn-group bg-light p-1 rounded-3 border">
              <button
                type="button"
                className={`btn btn-sm px-3 py-1 fw-semibold rounded-2 ${selectedCampus === CAMPUS.MANGALVAR_PETH ? 'btn-primary shadow-sm' : 'btn-light text-muted'}`}
                style={{ fontSize: '12px' }}
                onClick={() => setSelectedCampus(CAMPUS.MANGALVAR_PETH)}
              >
                Mangalwar Peth (MP)
              </button>
              <button
                type="button"
                className={`btn btn-sm px-3 py-1 fw-semibold rounded-2 ${selectedCampus === CAMPUS.TARABAI_PARK ? 'btn-primary shadow-sm' : 'btn-light text-muted'}`}
                style={{ fontSize: '12px' }}
                onClick={() => setSelectedCampus(CAMPUS.TARABAI_PARK)}
              >
                Tarabai Park (TP)
              </button>
            </div>
          )}

          <Button variant="primary" icon={Plus} onClick={openCreateModal}>
            Create Batch
          </Button>
        </div>
      </div>

      {/* Batches Table Card */}
      <div className="sa-card p-4">
        <Table
          columns={[
            {
              key: 'name',
              title: 'Batch Name',
              render: (val, row) => (
                <div>
                  <div className="fw-bold text-sa-charcoal">{val}</div>
                  <div className="small text-muted" style={{ fontSize: '11px' }}>
                    {row.branch || activeBranchFilter}
                  </div>
                </div>
              )
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
        title={editingBatch ? "Edit Batch" : "Create New Batch"}
      >
        <form onSubmit={handleSubmit}>
          {/* Branch (Fixed Automatically based on Campus Context) */}
          <div className="mb-3">
            <label className="form-label small fw-semibold text-sa-charcoal d-flex align-items-center justify-content-between mb-1">
              <span className="d-flex align-items-center gap-1.5">
                <Building size={14} className="text-sa-primary" />
                Branch Location (Fixed)
              </span>
              <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-0.5 rounded-pill" style={{ fontSize: '11px' }}>
                <Lock size={10} className="me-1 inline-block" /> Fixed Automatically
              </span>
            </label>
            <div className="input-group">
              <input
                type="text"
                className="form-control bg-light fw-bold text-sa-charcoal"
                value={formData.branch.toLowerCase().includes('mangal') ? 'Mangalwar Peth (MP)' : 'Tarabai Park (TP)'}
                readOnly
                disabled
              />
              <span className="input-group-text bg-light text-muted">
                <Lock size={15} />
              </span>
            </div>
            <div className="form-text text-muted small mt-1">
              Branch is fixed to <strong>{formData.branch.toLowerCase().includes('mangal') ? 'Mangalwar Peth (MP)' : 'Tarabai Park (TP)'}</strong> for this campus. Manual cross-branch selection is disabled.
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
                required
                placeholder="e.g. 08:00 AM – 10:30 AM"
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
            <Button variant="light" onClick={() => { setModalOpen(false); setEditingBatch(null); }}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingBatch ? "Update Batch" : "Create Batch"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

