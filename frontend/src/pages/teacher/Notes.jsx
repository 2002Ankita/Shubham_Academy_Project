import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { useAuth } from '../../hooks/useAuth';
import notesService from '../../services/notesService';
import studentService from '../../services/studentService';
import {
  StickyNote,
  Plus,
  Send,
  Save,
  Search,
  CheckCircle2,
  Clock,
  Paperclip,
  Trash2,
  Edit,
  Eye,
  Users,
  User,
  FileText,
  AlertCircle,
  Download,
  Calendar,
  X
} from 'lucide-react';
import { toast } from 'react-toastify';

export default function TeacherNotes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Notes state
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentsList, setStudentsList] = useState([]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedClass, setSelectedClass] = useState('All');

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [viewingNote, setViewingNote] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const initialFormState = {
    id: null,
    title: '',
    content: '',
    recipientType: 'Class', // 'Class' or 'Student'
    targetClass: '12th Science - Alpha',
    studentId: '',
    studentName: '',
    attachment: null
  };

  const [formState, setFormState] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});

  // Class options matching Shubham Academy batches
  const CLASS_OPTIONS = [
    '12th Science - Alpha',
    '11th Science - Beta',
    '12th NEET Special',
    '11th NEET',
    '12th Commerce',
    '11th Commerce',
    'All Classes'
  ];

  // Load Notes & Students from real backend/data service
  const loadNotes = async () => {
    try {
      setLoading(true);
      const data = await notesService.getAll();
      setNotes(data);
    } catch (err) {
      toast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      const data = await studentService.getAll();
      if (Array.isArray(data)) {
        setStudentsList(data);
      }
    } catch (err) {
      console.warn('Could not load students for dropdown:', err);
    }
  };

  useEffect(() => {
    loadNotes();
    loadStudents();
  }, []);

  // Allowed file extensions & size limit (15MB)
  const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'jpg', 'jpeg', 'png'];
  const MAX_FILE_SIZE_MB = 15;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const extension = file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      setFormErrors(prev => ({
        ...prev,
        attachment: `Unsupported file format. Please upload: ${ALLOWED_EXTENSIONS.join(', ').toUpperCase()}`
      }));
      return;
    }

    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      setFormErrors(prev => ({
        ...prev,
        attachment: `File size exceeds ${MAX_FILE_SIZE_MB} MB limit.`
      }));
      return;
    }

    setFormErrors(prev => {
      const next = { ...prev };
      delete next.attachment;
      return next;
    });

    const formattedSize = fileSizeMB < 1
      ? `${(file.size / 1024).toFixed(1)} KB`
      : `${fileSizeMB.toFixed(1)} MB`;

    // Read file via FileReader
    const reader = new FileReader();
    reader.onload = () => {
      setFormState(prev => ({
        ...prev,
        attachment: {
          name: file.name,
          size: formattedSize,
          type: file.type,
          dataUrl: reader.result
        }
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAttachment = () => {
    setFormState(prev => ({ ...prev, attachment: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setIsEditing(false);
    setFormState(initialFormState);
    setFormErrors({});
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (note) => {
    if (note.teacherId && user?.id && note.teacherId !== user.id && user?.role === 'teacher') {
      toast.error('Unauthorized: You can only edit notes you created.');
      return;
    }
    setIsEditing(true);
    setFormState({
      id: note.id,
      title: note.title,
      content: note.content,
      recipientType: note.recipientType || 'Class',
      targetClass: note.targetClass || '12th Science - Alpha',
      studentId: note.studentId || '',
      studentName: note.studentName || '',
      attachment: note.attachment || null
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  // Open View Modal
  const handleOpenView = (note) => {
    setViewingNote(note);
    setIsViewModalOpen(true);
  };

  // Validate Form
  const validateForm = () => {
    const errors = {};
    if (!formState.title.trim()) {
      errors.title = 'Note title is required';
    } else if (formState.title.trim().length < 3) {
      errors.title = 'Title must be at least 3 characters';
    }

    if (!formState.content.trim()) {
      errors.content = 'Note content/description is required';
    }

    if (formState.recipientType === 'Student' && !formState.studentId) {
      errors.studentId = 'Please select a recipient student';
    }

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error('Please complete all required fields.');
      return false;
    }
    return true;
  };

  // Save Note (Draft or Sent)
  const handleSaveNote = async (targetStatus) => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      let selectedStudentName = '';
      if (formState.recipientType === 'Student') {
        const found = studentsList.find(s => s.id === formState.studentId);
        selectedStudentName = found ? found.name : formState.studentName;
      }

      const payload = {
        title: formState.title.trim(),
        content: formState.content.trim(),
        recipientType: formState.recipientType,
        targetClass: formState.targetClass,
        studentId: formState.recipientType === 'Student' ? formState.studentId : null,
        studentName: formState.recipientType === 'Student' ? selectedStudentName : null,
        teacherId: user?.id || 'usr_003',
        teacherName: user?.name || 'Dr. Priya Kulkarni',
        subject: user?.subject || 'Physics',
        status: targetStatus,
        attachment: formState.attachment
      };

      if (isEditing && formState.id) {
        await notesService.update(formState.id, payload);
        toast.success(targetStatus === 'Sent' ? 'Note updated and sent successfully!' : 'Draft updated successfully!');
      } else {
        await notesService.create(payload);
        toast.success(targetStatus === 'Sent' ? 'Note sent to students successfully!' : 'Note saved as draft!');
      }

      setIsFormModalOpen(false);
      setFormState(initialFormState);
      setFormErrors({});
      await loadNotes();
    } catch (err) {
      toast.error('Failed to save note. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Note with confirmation and authorization check
  const handleDeleteNote = async (id, title) => {
    const target = notes.find(n => n.id === id);
    if (target && target.teacherId && user?.id && target.teacherId !== user.id && user?.role === 'teacher') {
      toast.error('Unauthorized: You can only delete notes you created.');
      return;
    }

    if (window.confirm(`Are you sure you want to delete note "${title}"?`)) {
      try {
        await notesService.delete(id);
        toast.info(`Note "${title}" has been deleted.`);
        await loadNotes();
      } catch (err) {
        toast.error('Failed to delete note');
      }
    }
  };

  // Download attachment
  const handleDownloadAttachment = (attachment, noteTitle) => {
    if (attachment?.dataUrl) {
      const link = document.createElement('a');
      link.href = attachment.dataUrl;
      link.download = attachment.name || `${noteTitle}_attachment.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Downloaded "${attachment.name}"`);
    } else {
      toast.info(`Downloading attachment "${attachment?.name || 'file'}"...`);
    }
  };

  // Filtered Notes
  const filteredNotes = notes.filter(n => {
    const matchesSearch = searchQuery.trim() === '' ||
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.studentName && n.studentName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (n.targetClass && n.targetClass.toLowerCase().includes(searchQuery.toLowerCase())) ||
      n.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = selectedStatus === 'All' || n.status.toLowerCase() === selectedStatus.toLowerCase();
    const matchesClass = selectedClass === 'All' || n.targetClass === selectedClass;

    return matchesSearch && matchesStatus && matchesClass;
  });

  // Overview Counts calculated from real data
  const totalCount = notes.length;
  const sentCount = notes.filter(n => n.status === 'Sent').length;
  const draftCount = notes.filter(n => n.status === 'Draft').length;
  const classesReached = new Set(notes.map(n => n.targetClass)).size;

  // Date parser helper
  const parseDateParts = (dateStr) => {
    if (!dateStr) return { date: '--', time: '' };
    if (dateStr.includes(',')) {
      const parts = dateStr.split(',').map(s => s.trim());
      return { date: parts[0], time: parts[1] || '' };
    }
    return { date: dateStr, time: '' };
  };

  return (
    <div className="d-flex flex-column w-100" style={{ gap: '16px', minWidth: 0, boxSizing: 'border-box' }}>
      {/* 2. PAGE HEADER */}
      <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-3 pt-0 pb-0.5">
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
            aria-label="Back to dashboard"
            title="Back to dashboard"
          >
            <ArrowLeft size={18} />
          </button>

          <div>
            <h1 className="brand-font fw-bold m-0" style={{ fontSize: '23px', lineHeight: 1.25, color: '#0F172A' }}>
              Notes
            </h1>
            <p className="m-0 mt-0.5" style={{ fontSize: '13.5px', color: '#64748B' }}>
              Create and share notes with your students.
            </p>
          </div>
        </div>

        {/* + Add Note Primary Button */}
        <button
          type="button"
          onClick={handleOpenCreate}
          className="btn d-inline-flex align-items-center gap-1.5 text-white border-0 fw-semibold shadow-xs"
          style={{
            backgroundColor: '#8B1216',
            fontSize: '13px',
            padding: '8px 16px',
            borderRadius: '8px',
            whiteSpace: 'nowrap',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(0.92)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)'; }}
        >
          <Plus size={16} />
          <span>Add Note</span>
        </button>
      </div>

      {/* 3. NOTES SUMMARY SECTION */}
      <style>{`
        .notes-summary-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
          width: 100%;
        }
        @media (max-width: 991px) {
          .notes-summary-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px;
          }
        }
        @media (max-width: 575px) {
          .notes-summary-grid {
            grid-template-columns: minmax(0, 1fr);
            gap: 12px;
          }
        }
        .notes-summary-card {
          background-color: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
          padding: 13px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
          width: 100%;
          min-height: 82px;
          box-sizing: border-box;
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }
        .notes-summary-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }
        .notes-filter-card {
          background-color: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
          padding: 12px 16px;
        }
      `}</style>
      <div className="notes-summary-grid">
        {/* Card 1: Total Notes */}
        <div className="notes-summary-card">
          <div
            className="d-flex align-items-center justify-content-center flex-shrink-0"
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: '#FEE2E2',
              color: '#DC2626'
            }}
          >
            <FileText size={20} />
          </div>
          <div className="d-flex flex-column justify-content-center min-w-0 flex-grow-1" style={{ overflow: 'hidden' }}>
            <span
              className="text-truncate fw-medium"
              style={{ fontSize: '12.5px', color: '#64748B', lineHeight: 1.2, marginBottom: '2px' }}
            >
              Total Notes
            </span>
            <div
              className="fw-bold brand-font lh-1 text-truncate"
              style={{ fontSize: '24px', color: '#8B1216' }}
            >
              {totalCount}
            </div>
          </div>
        </div>

        {/* Card 2: Sent Notes */}
        <div className="notes-summary-card">
          <div
            className="d-flex align-items-center justify-content-center flex-shrink-0"
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: '#D1FAE5',
              color: '#059669'
            }}
          >
            <Send size={20} />
          </div>
          <div className="d-flex flex-column justify-content-center min-w-0 flex-grow-1" style={{ overflow: 'hidden' }}>
            <span
              className="text-truncate fw-medium"
              style={{ fontSize: '12.5px', color: '#64748B', lineHeight: 1.2, marginBottom: '2px' }}
            >
              Sent Notes
            </span>
            <div
              className="fw-bold brand-font lh-1 text-truncate"
              style={{ fontSize: '24px', color: '#059669' }}
            >
              {sentCount}
            </div>
          </div>
        </div>

        {/* Card 3: Drafts */}
        <div className="notes-summary-card">
          <div
            className="d-flex align-items-center justify-content-center flex-shrink-0"
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: '#FEF3C7',
              color: '#D97706'
            }}
          >
            <Clock size={20} />
          </div>
          <div className="d-flex flex-column justify-content-center min-w-0 flex-grow-1" style={{ overflow: 'hidden' }}>
            <span
              className="text-truncate fw-medium"
              style={{ fontSize: '12.5px', color: '#64748B', lineHeight: 1.2, marginBottom: '2px' }}
            >
              Drafts
            </span>
            <div
              className="fw-bold brand-font lh-1 text-truncate"
              style={{ fontSize: '24px', color: '#D97706' }}
            >
              {draftCount}
            </div>
          </div>
        </div>

        {/* Card 4: Batches Reached */}
        <div className="notes-summary-card">
          <div
            className="d-flex align-items-center justify-content-center flex-shrink-0"
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: '#E0F2FE',
              color: '#0284C7'
            }}
          >
            <Users size={20} />
          </div>
          <div className="d-flex flex-column justify-content-center min-w-0 flex-grow-1" style={{ overflow: 'hidden' }}>
            <span
              className="text-truncate fw-medium"
              style={{ fontSize: '12.5px', color: '#64748B', lineHeight: 1.2, marginBottom: '2px' }}
            >
              Batches Reached
            </span>
            <div
              className="fw-bold brand-font lh-1 text-truncate"
              style={{ fontSize: '24px', color: '#0284C7' }}
              title={`${classesReached} Batches`}
            >
              {classesReached}
            </div>
          </div>
        </div>
      </div>

      {/* 4. NOTES TOOLBAR / FILTER SECTION */}
      <div className="notes-filter-card">
        <div className="row g-2 align-items-center">
          {/* Left: Search input */}
          <div className="col-12 col-md-6 col-lg-7">
            <div className="position-relative">
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '12px',
                  transform: 'translateY(-50%)',
                  color: '#94A3B8',
                  pointerEvents: 'none'
                }}
              />
              <input
                type="text"
                className="form-control"
                style={{
                  paddingLeft: '36px',
                  height: '38px',
                  fontSize: '13px',
                  borderColor: '#CBD5E1',
                  borderRadius: '8px'
                }}
                placeholder="Search notes by title, content, or recipient..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search notes"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="btn btn-sm position-absolute top-50 end-0 translate-middle-y me-2 text-secondary border-0 p-1"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Right: Status dropdown & Batch dropdown */}
          <div className="col-12 col-md-6 col-lg-5">
            <div className="d-flex align-items-center gap-2">
              <div className="flex-fill">
                <select
                  className="form-select"
                  style={{
                    height: '38px',
                    fontSize: '13px',
                    borderColor: '#CBD5E1',
                    borderRadius: '8px'
                  }}
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  aria-label="Filter by status"
                >
                  <option value="All">All Statuses</option>
                  <option value="Sent">Sent</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>

              <div className="flex-fill">
                <select
                  className="form-select"
                  style={{
                    height: '38px',
                    fontSize: '13px',
                    borderColor: '#CBD5E1',
                    borderRadius: '8px'
                  }}
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  aria-label="Filter by batch"
                >
                  <option value="All">All Batches</option>
                  {CLASS_OPTIONS.map((c, i) => (
                    <option key={i} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {(searchQuery || selectedStatus !== 'All' || selectedClass !== 'All') && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary text-nowrap"
                  style={{
                    height: '38px',
                    fontSize: '12.5px',
                    padding: '0 14px',
                    borderRadius: '8px'
                  }}
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedStatus('All');
                    setSelectedClass('All');
                  }}
                  title="Reset all filters"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 5. NOTES CONTENT SECTION */}
      {loading ? (
        /* 12. LOADING STATE */
        <div className="sa-card p-5 text-center">
          <div className="spinner-border text-danger mb-3" role="status" style={{ width: '2.5rem', height: '2.5rem' }}>
            <span className="visually-hidden">Loading notes...</span>
          </div>
          <div className="text-sa-muted small">Loading notes records...</div>
        </div>
      ) : filteredNotes.length === 0 ? (
        /* 11. EMPTY STATE */
        <div className="sa-card p-5 text-center">
          <div
            className="rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center"
            style={{ width: '64px', height: '64px', backgroundColor: '#FDF0F0', color: 'var(--sa-primary-red)' }}
          >
            <StickyNote size={30} />
          </div>
          <h5 className="brand-font fw-bold text-sa-charcoal mb-1">
            {searchQuery || selectedStatus !== 'All' || selectedClass !== 'All'
              ? 'No Matching Notes Found'
              : 'No Notes Yet'}
          </h5>
          <p className="text-sa-muted small mx-auto mb-3" style={{ maxWidth: '380px' }}>
            {searchQuery || selectedStatus !== 'All' || selectedClass !== 'All'
              ? 'No notes match your current filter criteria. Try adjusting your search query or reset filters.'
              : 'You haven\'t created any notes yet. Create your first note to share information with your students.'}
          </p>
          {searchQuery || selectedStatus !== 'All' || selectedClass !== 'All' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setSelectedStatus('All');
                setSelectedClass('All');
              }}
            >
              Clear Filters
            </Button>
          ) : (
            <Button
              variant="primary"
              icon={Plus}
              onClick={handleOpenCreate}
            >
              + Create Note
            </Button>
          )}
        </div>
      ) : (
        /* Main Notes Content Table without nested double-border padding */
        <Table
          columns={[
            /* 6. NOTE COLUMN */
            {
              key: 'title',
              title: 'NOTE',
              render: (val, row) => (
                <div className="d-flex align-items-start gap-2.5 py-1">
                  <div
                    className="p-2 rounded-2 d-flex align-items-center justify-content-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: '#FDF0F0', color: 'var(--sa-primary-red)', width: '38px', height: '38px' }}
                  >
                    <FileText size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="fw-bold text-sa-charcoal lh-sm">{val}</div>
                    {row.content && (
                      <div
                        className="text-sa-muted text-xs mt-1 text-truncate"
                        style={{ maxWidth: '380px' }}
                        title={row.content}
                      >
                        {row.content}
                      </div>
                    )}
                    {row.attachment && (
                      <div className="mt-1.5">
                        <span
                          className="badge bg-light text-sa-charcoal border border-secondary border-opacity-25 d-inline-flex align-items-center gap-1.5 py-1 px-2.5 text-xs fw-normal"
                          style={{ cursor: 'pointer', borderRadius: '6px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadAttachment(row.attachment, val);
                          }}
                          title="Click to download attachment"
                        >
                          <Paperclip size={12} className="text-sa-primary flex-shrink-0" />
                          <span className="text-truncate fw-medium" style={{ maxWidth: '240px' }}>
                            {row.attachment.name}
                          </span>
                          <span className="text-sa-muted ms-0.5">({row.attachment.size})</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )
            },

            /* 7. RECIPIENT / CLASS COLUMN */
            {
              key: 'recipient',
              title: 'RECIPIENT / CLASS',
              width: '190px',
              minWidth: '170px',
              style: { whiteSpace: 'nowrap' },
              render: (val, row) => (
                row.recipientType === 'Student' ? (
                  <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 d-inline-flex align-items-center gap-1.5 px-2.5 py-1.5 text-xs fw-medium rounded-2 text-nowrap">
                    <User size={12} />
                    <span>{row.studentName || 'Student'}</span>
                  </span>
                ) : (
                  <span className="badge bg-light text-sa-charcoal border d-inline-flex align-items-center gap-1.5 px-2.5 py-1.5 text-xs fw-medium rounded-2 text-nowrap">
                    <Users size={12} className="text-sa-muted" />
                    <span>{row.targetClass || 'All Classes'}</span>
                  </span>
                )
              )
            },

            /* 8. CREATED DATE COLUMN (Fixed spacing & wrapping) */
            {
              key: 'createdAt',
              title: 'CREATED DATE',
              width: '160px',
              minWidth: '150px',
              style: { whiteSpace: 'nowrap' },
              render: (val) => {
                const { date, time } = parseDateParts(val);
                return (
                  <div className="py-0.5 text-nowrap">
                    <div className="small fw-semibold text-sa-charcoal text-nowrap">{date}</div>
                    {time && (
                      <div className="text-sa-muted text-xs mt-0.5 text-nowrap d-flex align-items-center gap-1">
                        <Clock size={11} className="text-sa-muted opacity-75" />
                        <span>{time}</span>
                      </div>
                    )}
                  </div>
                );
              }
            },

            /* 9. STATUS COLUMN */
            {
              key: 'status',
              title: 'STATUS',
              width: '110px',
              minWidth: '100px',
              style: { whiteSpace: 'nowrap' },
              render: (val) => (
                val === 'Sent' ? (
                  <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 d-inline-flex align-items-center gap-1.5 py-1 px-2.5 rounded-2 text-xs fw-medium text-nowrap">
                    <CheckCircle2 size={12} />
                    <span>Sent</span>
                  </span>
                ) : (
                  <span className="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 d-inline-flex align-items-center gap-1.5 py-1 px-2.5 rounded-2 text-xs fw-medium text-nowrap">
                    <Clock size={12} />
                    <span>Draft</span>
                  </span>
                )
              )
            },

            /* 10. ACTIONS COLUMN */
            {
              key: 'id',
              title: 'ACTIONS',
              align: 'end',
              width: '130px',
              minWidth: '120px',
              style: { whiteSpace: 'nowrap' },
              render: (val, row) => (
                <div className="d-flex align-items-center justify-content-end gap-1.5 text-nowrap">
                  {/* View Details */}
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary border-0 p-1.5 rounded-2 hover-bg-light"
                    style={{ width: '32px', height: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                    title="View Note Details"
                    aria-label="View note"
                    onClick={() => handleOpenView(row)}
                  >
                    <Eye size={16} />
                  </button>

                  {/* Edit Note */}
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary border-0 p-1.5 rounded-2 hover-bg-light"
                    style={{ width: '32px', height: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Edit Note"
                    aria-label="Edit note"
                    onClick={() => handleOpenEdit(row)}
                  >
                    <Edit size={16} />
                  </button>

                  {/* Delete Note */}
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger border-0 p-1.5 rounded-2 hover-bg-light"
                    style={{ width: '32px', height: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Delete Note"
                    aria-label="Delete note"
                    onClick={() => handleDeleteNote(val, row.title)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )
            }
          ]}
          data={filteredNotes}
        />
      )}

      {/* CREATE / EDIT NOTE MODAL */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => !submitting && setIsFormModalOpen(false)}
        title={isEditing ? 'Edit Note' : 'Create New Note'}
        size="lg"
      >
        <form onSubmit={(e) => e.preventDefault()}>
          {/* Note Title */}
          <div className="mb-3">
            <Input
              label="Note Title"
              name="title"
              value={formState.title}
              onChange={(e) => setFormState({ ...formState, title: e.target.value })}
              placeholder="e.g. Chapter 4 Formulas & Exam Tips"
              error={formErrors.title}
              required
            />
          </div>

          {/* Recipient Type Selector */}
          <div className="mb-3">
            <label className="form-label fw-semibold text-sa-charcoal small d-block">
              Send To <span className="text-danger">*</span>
            </label>
            <div className="d-flex gap-3">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name="recipientType"
                  id="recipientClass"
                  checked={formState.recipientType === 'Class'}
                  onChange={() => setFormState({ ...formState, recipientType: 'Class', studentId: '', studentName: '' })}
                />
                <label className="form-check-label text-sm fw-medium" htmlFor="recipientClass">
                  Entire Class / Batch
                </label>
              </div>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name="recipientType"
                  id="recipientStudent"
                  checked={formState.recipientType === 'Student'}
                  onChange={() => setFormState({ ...formState, recipientType: 'Student' })}
                />
                <label className="form-check-label text-sm fw-medium" htmlFor="recipientStudent">
                  Individual Student
                </label>
              </div>
            </div>
          </div>

          {/* Recipient Selection Dropdowns */}
          <div className="row g-3 mb-3">
            <div className="col-12 col-md-6">
              <Select
                label="Target Batch / Stream"
                name="targetClass"
                value={formState.targetClass}
                onChange={(e) => setFormState({ ...formState, targetClass: e.target.value })}
                options={CLASS_OPTIONS}
                required
              />
            </div>

            {formState.recipientType === 'Student' && (
              <div className="col-12 col-md-6">
                <label className="form-label d-flex justify-content-between">
                  <span>
                    Select Student <span className="text-danger">*</span>
                  </span>
                </label>
                <select
                  className={`form-select ${formErrors.studentId ? 'is-invalid' : ''}`}
                  value={formState.studentId}
                  onChange={(e) => {
                    const id = e.target.value;
                    const st = studentsList.find(s => s.id === id);
                    setFormState({
                      ...formState,
                      studentId: id,
                      studentName: st ? st.name : ''
                    });
                  }}
                >
                  <option value="">-- Choose Student --</option>
                  {studentsList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.rollNumber || s.standard})
                    </option>
                  ))}
                </select>
                {formErrors.studentId && (
                  <div className="invalid-feedback d-block text-xs mt-1">
                    {formErrors.studentId}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Note Content / Description */}
          <div className="mb-3">
            <label className="form-label d-flex justify-content-between">
              <span>
                Note Content / Details <span className="text-danger">*</span>
              </span>
            </label>
            <textarea
              className={`form-control ${formErrors.content ? 'is-invalid' : ''}`}
              rows={4}
              placeholder="Enter the detailed note, homework reminder, derivation hints, or revision instructions..."
              value={formState.content}
              onChange={(e) => setFormState({ ...formState, content: e.target.value })}
            />
            {formErrors.content && (
              <div className="invalid-feedback d-block text-xs mt-1">
                {formErrors.content}
              </div>
            )}
          </div>

          {/* File Attachment Upload */}
          <div className="mb-3">
            <label className="form-label d-flex justify-content-between">
              <span>Attach Document / File (Optional)</span>
              <span className="text-sa-muted text-xs">PDF, Word, PPT, Images (Max 15MB)</span>
            </label>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png"
              className="d-none"
              id="teacher-note-attachment-input"
            />

            {!formState.attachment ? (
              <div
                className={`border-2 border-dashed rounded-3 p-3 text-center cursor-pointer transition-all ${
                  formErrors.attachment ? 'border-danger bg-danger bg-opacity-10' : 'border-secondary border-opacity-25 bg-light'
                }`}
                onClick={() => fileInputRef.current?.click()}
                style={{ cursor: 'pointer' }}
              >
                <Paperclip size={20} className="text-sa-muted mb-1" />
                <div className="fw-semibold text-sa-charcoal small">
                  Click to attach a file from your computer
                </div>
                <div className="text-sa-muted text-xs">
                  Supports PDF, Word Documents, Slides, or Images
                </div>
              </div>
            ) : (
              <div className="d-flex align-items-center justify-content-between p-2.5 rounded-3 border bg-light">
                <div className="d-flex align-items-center gap-2 min-w-0">
                  <div className="p-1.5 rounded bg-white border text-primary">
                    <FileText size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="fw-semibold text-sa-charcoal small text-truncate">
                      {formState.attachment.name}
                    </div>
                    <div className="text-sa-muted text-xs">{formState.attachment.size}</div>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger border-0 p-1 rounded"
                  onClick={handleRemoveAttachment}
                  title="Remove attachment"
                  aria-label="Remove attachment"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            )}

            {formErrors.attachment && (
              <div className="d-flex align-items-center gap-1 text-danger text-xs mt-1.5">
                <AlertCircle size={13} />
                <span>{formErrors.attachment}</span>
              </div>
            )}
          </div>

          {/* Modal Action Buttons */}
          <div className="d-flex justify-content-between align-items-center pt-3 border-top mt-4">
            <Button
              type="button"
              variant="light"
              onClick={() => setIsFormModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>

            <div className="d-flex gap-2">
              <Button
                type="button"
                variant="outline"
                icon={Save}
                onClick={() => handleSaveNote('Draft')}
                disabled={submitting}
              >
                Save Draft
              </Button>
              <Button
                type="button"
                variant="primary"
                icon={Send}
                onClick={() => handleSaveNote('Sent')}
                disabled={submitting}
                className="shadow-sm"
              >
                {submitting ? 'Saving...' : 'Send Note'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* VIEW NOTE DETAILS MODAL */}
      {viewingNote && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title="Note Details"
          size="md"
        >
          <div className="d-flex flex-column gap-3">
            {/* Header info */}
            <div>
              <div className="d-flex align-items-center justify-content-between gap-2 mb-1">
                <span className="badge bg-light text-sa-primary border font-monospace text-xs">
                  {viewingNote.id}
                </span>
                {viewingNote.status === 'Sent' ? (
                  <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 d-inline-flex align-items-center gap-1 py-1 px-2.5">
                    <CheckCircle2 size={12} />
                    <span>Sent</span>
                  </span>
                ) : (
                  <span className="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 d-inline-flex align-items-center gap-1 py-1 px-2.5">
                    <Clock size={12} />
                    <span>Draft</span>
                  </span>
                )}
              </div>
              <h5 className="brand-font fw-bold text-sa-charcoal m-0">{viewingNote.title}</h5>
            </div>

            {/* Metadata Pills */}
            <div className="p-3 rounded-3 bg-light border text-xs d-flex flex-column gap-1.5">
              <div className="d-flex justify-content-between">
                <span className="text-sa-muted">Sender:</span>
                <span className="fw-semibold text-sa-charcoal">{viewingNote.teacherName} ({viewingNote.subject})</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-sa-muted">Recipient:</span>
                <span className="fw-semibold text-sa-charcoal">
                  {viewingNote.recipientType === 'Student'
                    ? `${viewingNote.studentName} (Individual Student)`
                    : `${viewingNote.targetClass} (Class)`}
                </span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-sa-muted">Created:</span>
                <span className="fw-medium text-sa-charcoal">{viewingNote.createdAt}</span>
              </div>
            </div>

            {/* Note Content */}
            <div>
              <div className="text-sa-muted small fw-semibold mb-1">Message Content:</div>
              <div
                className="p-3 rounded-3 border bg-white text-sa-charcoal text-sm"
                style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}
              >
                {viewingNote.content}
              </div>
            </div>

            {/* Attachment */}
            {viewingNote.attachment && (
              <div>
                <div className="text-sa-muted small fw-semibold mb-1">Attachment:</div>
                <div className="d-flex align-items-center justify-content-between p-2.5 rounded-3 border bg-light">
                  <div className="d-flex align-items-center gap-2 min-w-0">
                    <Paperclip size={16} className="text-primary flex-shrink-0" />
                    <span className="text-sm fw-medium text-sa-charcoal text-truncate">
                      {viewingNote.attachment.name} ({viewingNote.attachment.size})
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    icon={Download}
                    onClick={() => handleDownloadAttachment(viewingNote.attachment, viewingNote.title)}
                  >
                    Download
                  </Button>
                </div>
              </div>
            )}

            {/* Modal Close Button */}
            <div className="d-flex justify-content-end pt-3 border-top">
              <Button variant="light" onClick={() => setIsViewModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
