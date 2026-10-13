import React, { useState, useEffect } from 'react';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { 
  Truck, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Search, 
  UserCheck, 
  User, 
  BookMarked, 
  Package, 
  Trash2, 
  Edit3, 
  RefreshCw,
  GraduationCap,
  Briefcase,
  Calendar
} from 'lucide-react';
import { toast } from 'react-toastify';
import inventoryService from '../../services/inventoryService';
import studentService from '../../services/studentService';
import teacherService from '../../services/teacherService';
import { useAuth } from '../../hooks/useAuth';

// Helper to get local ISO string for datetime-local input (YYYY-MM-DDTHH:mm)
const getCurrentLocalDateTime = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 16);
};

export default function NotesDelivery() {
  const { user } = useAuth();
  const currentStaffName = user?.full_name || user?.name || 'Academy Admin';

  const [deliveries, setDeliveries] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [recipientFilter, setRecipientFilter] = useState('All');

  // Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // New Handover Form State
  const [newDelivery, setNewDelivery] = useState({
    recipientType: 'Student', // 'Student' or 'Teacher'
    recipientId: '',
    recipientName: '',
    category: 'Theory', // 'Theory' or 'CET'
    subject: 'Physics', // 'Physics', 'Chemistry', 'Biology', 'Maths'
    status: 'Delivered', // 'Delivered' or 'Pending Pickup'
    date: getCurrentLocalDateTime(),
    handedOverBy: currentStaffName,
    remarks: ''
  });

  // Edit Handover Form State
  const [editingDelivery, setEditingDelivery] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [delivData, itemsData, studentsData, teachersData] = await Promise.all([
        inventoryService.getDeliveries(),
        inventoryService.getItems(),
        studentService.getAll(),
        teacherService.getAll().catch(() => [])
      ]);
      setDeliveries(delivData || []);
      setInventoryItems(itemsData || []);
      setStudents(studentsData || []);
      setTeachers(teachersData || []);
    } catch (err) {
      toast.error('Failed to load books delivery data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update staff name in form if user changes
  useEffect(() => {
    if (user?.full_name || user?.name) {
      const name = user.full_name || user.name;
      setNewDelivery(prev => ({
        ...prev,
        handedOverBy: name
      }));
    }
  }, [user]);

  // Find currently matched inventory item for category & subject
  const getSelectedBookItem = (cat, subj) => {
    return inventoryItems.find(it => {
      const itCat = (it.category || '').toLowerCase();
      const itSubj = (it.subject || '').toLowerCase();
      return itCat === (cat || '').toLowerCase() && itSubj === (subj || '').toLowerCase();
    }) || null;
  };

  const selectedItemStock = getSelectedBookItem(newDelivery.category, newDelivery.subject);

  // Open Log Modal with fresh current time
  const handleOpenAddModal = () => {
    setNewDelivery({
      recipientType: 'Student',
      recipientId: '',
      recipientName: '',
      category: 'Theory',
      subject: 'Physics',
      status: 'Delivered',
      date: getCurrentLocalDateTime(),
      handedOverBy: currentStaffName,
      remarks: ''
    });
    setModalOpen(true);
  };

  // Open Edit Modal with prefilled values
  const handleOpenEditModal = (row) => {
    let initialDate = getCurrentLocalDateTime();
    if (row.rawDate) {
      try {
        const d = new Date(row.rawDate);
        if (!isNaN(d.getTime())) {
          const offset = d.getTimezoneOffset() * 60000;
          initialDate = new Date(d.getTime() - offset).toISOString().slice(0, 16);
        }
      } catch {}
    } else if (row.date && row.date !== '--') {
      try {
        const parsed = new Date(row.date);
        if (!isNaN(parsed.getTime())) {
          const offset = parsed.getTimezoneOffset() * 60000;
          initialDate = new Date(parsed.getTime() - offset).toISOString().slice(0, 16);
        }
      } catch {}
    }

    setEditingDelivery({
      id: row.id,
      recipientType: row.recipientType || (row.rollNumber === 'Faculty Staff' ? 'Teacher' : 'Student'),
      recipientId: row.recipientId || row.studentId || '',
      recipientName: row.recipientName || row.studentName || '',
      category: row.category || 'Theory',
      subject: row.subject || 'Physics',
      status: row.status || 'Delivered',
      date: initialDate,
      handedOverBy: row.handedOverBy && row.handedOverBy !== '--' ? row.handedOverBy : currentStaffName,
      remarks: row.remarks || ''
    });
    setEditModalOpen(true);
  };

  // Quick mark delivered
  const handleMarkDelivered = async (id, recipientName, category, subject) => {
    try {
      await inventoryService.updateDelivery(id, {
        status: 'Delivered',
        date: new Date().toISOString(),
        handed_over_by: currentStaffName,
        verified_by: currentStaffName,
        remarks: 'Confirmed handed over at pickup desk'
      });
      toast.success(`${category} ${subject} marked as handed over to ${recipientName}!`);
      fetchData();
    } catch (err) {
      toast.error('Failed to confirm delivery');
    }
  };

  // Create new handover record
  const handleCreateDelivery = async (e) => {
    e.preventDefault();
    if (newDelivery.recipientType === 'Student' && !newDelivery.recipientId && !newDelivery.recipientName) {
      toast.error('Please select or enter a student name');
      return;
    }
    if (newDelivery.recipientType === 'Teacher' && !newDelivery.recipientId && !newDelivery.recipientName) {
      toast.error('Please select or enter a teacher name');
      return;
    }

    try {
      let resolvedName = newDelivery.recipientName;
      if (newDelivery.recipientType === 'Student' && newDelivery.recipientId) {
        const sObj = students.find(s => String(s.id || s._id || s.student_id) === String(newDelivery.recipientId));
        if (sObj) resolvedName = sObj.name;
      } else if (newDelivery.recipientType === 'Teacher' && newDelivery.recipientId) {
        const tObj = teachers.find(t => String(t.id || t._id) === String(newDelivery.recipientId));
        if (tObj) resolvedName = tObj.name || tObj.full_name;
      }

      const bookItem = getSelectedBookItem(newDelivery.category, newDelivery.subject);

      const payload = {
        recipient_type: newDelivery.recipientType,
        recipient_id: newDelivery.recipientId || null,
        recipient_name: resolvedName || (newDelivery.recipientType === 'Student' ? 'Student' : 'Teacher'),
        student_id: newDelivery.recipientType === 'Student' ? newDelivery.recipientId : null,
        inventory_item_id: bookItem ? bookItem.id : null,
        category: newDelivery.category,
        subject: newDelivery.subject,
        book_title: `${newDelivery.category} - ${newDelivery.subject}`,
        status: newDelivery.status,
        date: newDelivery.date ? new Date(newDelivery.date).toISOString() : new Date().toISOString(),
        handed_over_by: newDelivery.handedOverBy || currentStaffName,
        verified_by: newDelivery.handedOverBy || currentStaffName,
        remarks: newDelivery.remarks
      };

      await inventoryService.createDelivery(payload);
      toast.success(`Handover record created: ${newDelivery.category} ${newDelivery.subject} to ${resolvedName}!`);
      setModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Create delivery error:', err);
      toast.error(err.response?.data?.detail || 'Failed to log book delivery.');
    }
  };

  // Update existing handover record
  const handleUpdateDelivery = async (e) => {
    e.preventDefault();
    if (!editingDelivery) return;

    try {
      let resolvedName = editingDelivery.recipientName;
      if (editingDelivery.recipientType === 'Student' && editingDelivery.recipientId) {
        const sObj = students.find(s => String(s.id || s._id || s.student_id) === String(editingDelivery.recipientId));
        if (sObj) resolvedName = sObj.name;
      } else if (editingDelivery.recipientType === 'Teacher' && editingDelivery.recipientId) {
        const tObj = teachers.find(t => String(t.id || t._id) === String(editingDelivery.recipientId));
        if (tObj) resolvedName = tObj.name || tObj.full_name;
      }

      const payload = {
        recipient_type: editingDelivery.recipientType,
        recipient_id: editingDelivery.recipientId || null,
        recipient_name: resolvedName,
        student_id: editingDelivery.recipientType === 'Student' ? editingDelivery.recipientId : null,
        category: editingDelivery.category,
        subject: editingDelivery.subject,
        book_title: `${editingDelivery.category} - ${editingDelivery.subject}`,
        status: editingDelivery.status,
        date: editingDelivery.date ? new Date(editingDelivery.date).toISOString() : new Date().toISOString(),
        handed_over_by: editingDelivery.handedOverBy || currentStaffName,
        verified_by: editingDelivery.handedOverBy || currentStaffName,
        remarks: editingDelivery.remarks
      };

      await inventoryService.updateDelivery(editingDelivery.id, payload);
      toast.success('Handover record updated successfully!');
      setEditModalOpen(false);
      setEditingDelivery(null);
      fetchData();
    } catch (err) {
      console.error('Update delivery error:', err);
      toast.error(err.response?.data?.detail || 'Failed to update delivery');
    }
  };

  // Delete handover record
  const handleDeleteDelivery = async (id, recipientName) => {
    if (!window.confirm(`Are you sure you want to delete the handover record for ${recipientName || 'this recipient'}?`)) {
      return;
    }
    try {
      await inventoryService.deleteDelivery(id);
      toast.success('Handover record deleted successfully.');
      setDeliveries(prev => prev.filter(d => d.id !== id));
      fetchData();
    } catch (err) {
      console.error('Delete delivery error:', err);
      toast.error(err.response?.data?.detail || 'Failed to remove delivery record');
    }
  };

  // KPIs
  const totalDeliveries = deliveries.length;
  const deliveredCount = deliveries.filter(d => d.status === 'Delivered').length;
  const pendingCount = deliveries.filter(d => d.status === 'Pending Pickup' || d.status === 'Pending').length;
  const totalStockCount = inventoryItems.reduce((acc, it) => acc + (Number(it.in_stock) || 0), 0);

  // Filtered deliveries
  const filteredDeliveries = deliveries.filter(d => {
    const matchesStatus = statusFilter === 'All' || d.status === statusFilter;
    const matchesCat = categoryFilter === 'All' || (d.category || '').toLowerCase() === categoryFilter.toLowerCase();
    const matchesSubj = subjectFilter === 'All' || (d.subject || '').toLowerCase() === subjectFilter.toLowerCase();
    const matchesRecipient = recipientFilter === 'All' || (d.recipientType || 'Student').toLowerCase() === recipientFilter.toLowerCase();
    
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery = !q || 
      (d.recipientName && d.recipientName.toLowerCase().includes(q)) ||
      (d.studentName && d.studentName.toLowerCase().includes(q)) ||
      (d.rollNumber && d.rollNumber.toLowerCase().includes(q)) ||
      (d.subject && d.subject.toLowerCase().includes(q)) ||
      (d.handedOverBy && d.handedOverBy.toLowerCase().includes(q));

    return matchesStatus && matchesCat && matchesSubj && matchesRecipient && matchesQuery;
  });

  return (
    <div className="d-flex flex-column gap-4 pb-4">
      {/* 1. Page Header */}
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
        <div>
          <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4 d-flex align-items-center gap-2">
            <Truck className="text-sa-primary" size={24} />
            <span>Books Delivery & Handover Desk</span>
          </h3>
          <span className="small text-sa-muted">
            Record Theory & CET book handouts to students and teachers, track who handed them over, and save records to database
          </span>
        </div>

        <div className="d-flex align-items-center gap-2">
          <Button variant="outline" icon={RefreshCw} onClick={fetchData}>
            Refresh
          </Button>
          <Button variant="primary" icon={Plus} onClick={handleOpenAddModal}>
            Log New Book Handover
          </Button>
        </div>
      </div>

      {/* 2. Top KPI Cards */}
      <div className="row g-3">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="sa-card p-3 d-flex align-items-center justify-content-between h-100 bg-white border">
            <div>
              <span className="text-sa-muted fw-semibold small d-block">Total Handover Logs</span>
              <div className="fw-bold brand-font text-sa-charcoal fs-3">{totalDeliveries}</div>
              <span className="small text-secondary">Logged in database</span>
            </div>
            <div className="rounded-circle p-2.5 bg-primary bg-opacity-10 text-primary">
              <Truck size={24} />
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="sa-card p-3 d-flex align-items-center justify-content-between h-100 bg-white border">
            <div>
              <span className="text-sa-muted fw-semibold small d-block">Delivered Copies</span>
              <div className="fw-bold brand-font fs-3 text-success">{deliveredCount}</div>
              <span className="small text-success fw-medium">Successfully handed over</span>
            </div>
            <div className="rounded-circle p-2.5 bg-success bg-opacity-10 text-success">
              <CheckCircle2 size={24} />
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="sa-card p-3 d-flex align-items-center justify-content-between h-100 bg-white border">
            <div>
              <span className="text-sa-muted fw-semibold small d-block">Pending Pickups</span>
              <div className="fw-bold brand-font fs-3 text-warning-emphasis">{pendingCount}</div>
              <span className="small text-warning-emphasis fw-medium">Awaiting recipient collection</span>
            </div>
            <div className="rounded-circle p-2.5 bg-warning bg-opacity-10 text-warning-emphasis">
              <Clock size={24} />
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="sa-card p-3 d-flex align-items-center justify-content-between h-100 bg-white border">
            <div>
              <span className="text-sa-muted fw-semibold small d-block">Warehouse Stock Available</span>
              <div className="fw-bold brand-font fs-3" style={{ color: '#8B1216' }}>{totalStockCount} Copies</div>
              <span className="small text-sa-muted">Available in inventory</span>
            </div>
            <div className="rounded-circle p-2.5 text-danger bg-danger bg-opacity-10">
              <Package size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Filters Toolbar */}
      <div className="sa-card p-3 bg-white border">
        <div className="row g-2 align-items-center">
          {/* Search */}
          <div className="col-12 col-md-3 position-relative">
            <Search size={16} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-sa-muted" />
            <input
              type="text"
              className="form-control ps-5 py-2 text-sm"
              placeholder="Search recipient, roll no, or staff..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Recipient Type Filter */}
          <div className="col-6 col-sm-3 col-md-2">
            <select
              className="form-select form-select-sm py-2 shadow-xs fw-medium"
              value={recipientFilter}
              onChange={(e) => setRecipientFilter(e.target.value)}
            >
              <option value="All">All Recipients</option>
              <option value="Student">Students Only</option>
              <option value="Teacher">Teachers Only</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="col-6 col-sm-3 col-md-2.5">
            <select
              className="form-select form-select-sm py-2 shadow-xs fw-medium"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="All">All Book Types</option>
              <option value="Theory">Theory Books</option>
              <option value="CET">CET Books</option>
            </select>
          </div>

          {/* Subject Filter */}
          <div className="col-6 col-sm-3 col-md-2.5">
            <select
              className="form-select form-select-sm py-2 shadow-xs fw-medium"
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
            >
              <option value="All">All Subjects</option>
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Maths">Maths</option>
              <option value="Biology">Biology</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="col-6 col-sm-3 col-md-2">
            <select
              className="form-select form-select-sm py-2 shadow-xs fw-medium"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Delivered">Delivered</option>
              <option value="Pending Pickup">Pending Pickup</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Deliveries Table */}
      <div className="sa-card p-4 bg-white border">
        <Table
          columns={[
            {
              key: 'recipientName',
              title: 'To Whom Handed Over',
              render: (val, row) => {
                const isTeacher = (row.recipientType || '').toLowerCase() === 'teacher' || row.rollNumber === 'Faculty Staff';
                return (
                  <div className="d-flex align-items-center gap-2">
                    <div 
                      className={`rounded-circle p-1.5 flex-shrink-0 ${
                        isTeacher ? 'bg-primary bg-opacity-10 text-primary' : 'bg-danger bg-opacity-10 text-danger'
                      }`}
                    >
                      {isTeacher ? <Briefcase size={15} /> : <GraduationCap size={15} />}
                    </div>
                    <div>
                      <span className="fw-bold text-sa-charcoal d-block">
                        {val || row.studentName || 'Recipient'}
                      </span>
                      <div className="d-flex align-items-center gap-1.5 mt-0.5">
                        <span 
                          className={`badge px-1.5 py-0.5 small fw-semibold ${
                            isTeacher ? 'bg-primary-subtle text-primary border border-primary-subtle' : 'bg-light text-secondary border'
                          }`}
                          style={{ fontSize: '0.68rem' }}
                        >
                          {isTeacher ? 'Teacher' : 'Student'}
                        </span>
                        {!isTeacher && row.rollNumber && row.rollNumber !== 'N/A' && (
                          <span className="text-sa-muted small">Roll: {row.rollNumber}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }
            },
            {
              key: 'category',
              title: 'Book Type',
              width: '110px',
              render: (val, row) => {
                const cat = val || ((row.bookTitle || '').toLowerCase().includes('cet') ? 'CET' : 'Theory');
                return (
                  <span
                    className="badge px-2.5 py-1 fw-bold rounded-pill"
                    style={{
                      fontSize: '0.72rem',
                      backgroundColor: cat.toLowerCase() === 'cet' ? '#FEF3C7' : '#FEE2E2',
                      color: cat.toLowerCase() === 'cet' ? '#92400E' : '#991B1B',
                      border: cat.toLowerCase() === 'cet' ? '1px solid #FCD34D' : '1px solid #FCA5A5'
                    }}
                  >
                    {cat}
                  </span>
                );
              }
            },
            {
              key: 'subject',
              title: 'Subject',
              width: '130px',
              render: (val) => (
                <span className="fw-semibold text-sa-charcoal">{val || 'Physics'}</span>
              )
            },
            {
              key: 'status',
              title: 'Delivery Status',
              width: '140px',
              render: (val) => (
                <span className={val === 'Delivered' ? 'badge-paid' : 'badge-pending'}>
                  {val === 'Delivered' ? <CheckCircle2 size={12} /> : <Clock size={12} />} {val}
                </span>
              )
            },
            {
              key: 'date',
              title: 'Handover Date & Time',
              width: '170px',
              render: (val) => (
                <div className="d-flex align-items-center gap-1.5">
                  <Calendar size={13} className="text-sa-muted flex-shrink-0" />
                  <span className="small text-sa-muted fw-medium">{val}</span>
                </div>
              )
            },
            {
              key: 'handedOverBy',
              title: 'Who Handed Them Over',
              width: '180px',
              render: (val, row) => (
                <div className="d-flex align-items-center gap-1.5">
                  <UserCheck size={14} className="text-success flex-shrink-0" />
                  <span className="fw-semibold text-sa-charcoal small">
                    {val || row.verifiedBy || '--'}
                  </span>
                </div>
              )
            },
            {
              key: 'actions',
              title: 'Actions',
              align: 'end',
              width: '160px',
              render: (_, row) => (
                <div className="d-flex align-items-center justify-content-end gap-1.5">
                  {row.status !== 'Delivered' ? (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleMarkDelivered(row.id, row.recipientName, row.category, row.subject)}
                    >
                      Confirm
                    </Button>
                  ) : (
                    <span className="small text-success fw-bold me-1">✓ Complete</span>
                  )}
                  <button
                    type="button"
                    title="Edit handover record"
                    className="btn btn-sm btn-light border p-1 text-primary"
                    onClick={() => handleOpenEditModal(row)}
                  >
                    <Edit3 size={15} />
                  </button>
                  <button
                    type="button"
                    title="Delete handover record"
                    className="btn btn-sm btn-light border p-1 text-danger"
                    onClick={() => handleDeleteDelivery(row.id, row.recipientName)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              )
            }
          ]}
          data={filteredDeliveries}
          loading={loading}
          emptyText="No book delivery records found in database."
        />
      </div>

      {/* 5. Modal: Log New Book Handover */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Log New Book Handover">
        <form onSubmit={handleCreateDelivery} className="d-flex flex-column gap-3">
          {/* Recipient Type Choice: Student or Teacher */}
          <div>
            <label className="form-label small fw-bold">
              To Whom Handed Over (Select Recipient Type) <span className="text-danger">*</span>
            </label>
            <div className="d-flex gap-2 mb-2">
              <button
                type="button"
                className={`btn btn-sm flex-fill py-2 d-flex align-items-center justify-content-center gap-2 fw-bold rounded-2 ${
                  newDelivery.recipientType === 'Student'
                    ? 'btn-danger text-white'
                    : 'btn-light border text-sa-charcoal'
                }`}
                style={newDelivery.recipientType === 'Student' ? { backgroundColor: '#8B1216', borderColor: '#8B1216' } : {}}
                onClick={() => setNewDelivery({ ...newDelivery, recipientType: 'Student', recipientId: '', recipientName: '' })}
              >
                <GraduationCap size={16} />
                <span>Student</span>
              </button>

              <button
                type="button"
                className={`btn btn-sm flex-fill py-2 d-flex align-items-center justify-content-center gap-2 fw-bold rounded-2 ${
                  newDelivery.recipientType === 'Teacher'
                    ? 'btn-danger text-white'
                    : 'btn-light border text-sa-charcoal'
                }`}
                style={newDelivery.recipientType === 'Teacher' ? { backgroundColor: '#8B1216', borderColor: '#8B1216' } : {}}
                onClick={() => setNewDelivery({ ...newDelivery, recipientType: 'Teacher', recipientId: '', recipientName: '' })}
              >
                <Briefcase size={16} />
                <span>Teacher</span>
              </button>
            </div>

            {/* Recipient Dropdown */}
            {newDelivery.recipientType === 'Student' ? (
              <div>
                <select
                  className="form-select"
                  value={newDelivery.recipientId}
                  onChange={(e) => {
                    const selected = students.find(s => String(s.id || s._id || s.student_id) === String(e.target.value));
                    setNewDelivery({
                      ...newDelivery,
                      recipientId: e.target.value,
                      recipientName: selected ? selected.name : ''
                    });
                  }}
                  required
                >
                  <option value="">-- Choose Student from Database --</option>
                  {students.map(s => (
                    <option key={s.id || s._id} value={s.id || s._id || s.student_id}>
                      {s.name} &bull; Roll: {s.rollNumber || s.student_id || 'N/A'} ({s.standard || 'General'})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <select
                  className="form-select"
                  value={newDelivery.recipientId}
                  onChange={(e) => {
                    const selected = teachers.find(t => String(t.id || t._id) === String(e.target.value));
                    setNewDelivery({
                      ...newDelivery,
                      recipientId: e.target.value,
                      recipientName: selected ? (selected.name || selected.full_name) : ''
                    });
                  }}
                  required
                >
                  <option value="">-- Choose Teacher from Database --</option>
                  {teachers.map(t => (
                    <option key={t.id || t._id} value={t.id || t._id}>
                      {t.name || t.full_name} &bull; Subject: {t.subject || 'Faculty'}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Book Category & Specific Subject */}
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label small fw-bold">Book Type</label>
              <select
                className="form-select"
                value={newDelivery.category}
                onChange={(e) => setNewDelivery({ ...newDelivery, category: e.target.value })}
                required
              >
                <option value="Theory">Theory Book</option>
                <option value="CET">CET Book</option>
              </select>
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label small fw-bold">Subject</label>
              <select
                className="form-select"
                value={newDelivery.subject}
                onChange={(e) => setNewDelivery({ ...newDelivery, subject: e.target.value })}
                required
              >
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Maths">Maths</option>
                <option value="Biology">Biology</option>
              </select>
            </div>
          </div>

          {/* Stock Indicator Box */}
          <div className="p-3 bg-light rounded-2 border d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <BookMarked size={20} className="text-sa-primary" />
              <div>
                <span className="fw-bold text-sa-charcoal d-block">
                  {newDelivery.category} - {newDelivery.subject}
                </span>
                <span className="text-sa-muted small">Target Inventory Item</span>
              </div>
            </div>
            <div className="text-end">
              <span className="small text-sa-muted d-block">Warehouse Stock</span>
              {selectedItemStock ? (
                <span className={`fw-extrabold brand-font ${selectedItemStock.in_stock > 0 ? 'text-success' : 'text-danger'}`}>
                  {selectedItemStock.in_stock} Copies Available
                </span>
              ) : (
                <span className="text-success fw-bold">Stock Verified</span>
              )}
            </div>
          </div>

          {/* Handover Date & Time (Current by default) */}
          <div className="row g-3">
            <div className="col-12 col-md-7">
              <label className="form-label small fw-bold d-flex align-items-center justify-content-between">
                <span>Handover Date & Time</span>
                <button
                  type="button"
                  className="btn btn-link p-0 text-decoration-none small text-sa-primary"
                  onClick={() => setNewDelivery({ ...newDelivery, date: getCurrentLocalDateTime() })}
                >
                  Set to Current
                </button>
              </label>
              <input
                type="datetime-local"
                className="form-control"
                value={newDelivery.date}
                onChange={(e) => setNewDelivery({ ...newDelivery, date: e.target.value })}
                required
              />
              <span className="small text-sa-muted">Defaults to current date and time</span>
            </div>

            <div className="col-12 col-md-5">
              <label className="form-label small fw-bold">Delivery Status</label>
              <select
                className="form-select"
                value={newDelivery.status}
                onChange={(e) => setNewDelivery({ ...newDelivery, status: e.target.value })}
              >
                <option value="Delivered">Delivered (Handed over)</option>
                <option value="Pending Pickup">Pending Pickup (Ready)</option>
              </select>
            </div>
          </div>

          {/* Who Handed Them Over */}
          <div>
            <label className="form-label small fw-bold">
              Who Handed Them Over (Staff Name) <span className="text-danger">*</span>
            </label>
            <div className="input-group">
              <span className="input-group-text bg-white">
                <UserCheck size={16} className="text-success" />
              </span>
              <input
                type="text"
                className="form-control"
                value={newDelivery.handedOverBy}
                onChange={(e) => setNewDelivery({ ...newDelivery, handedOverBy: e.target.value })}
                placeholder="Staff / Admin Name"
                required
              />
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="form-label small fw-semibold text-sa-muted">Remarks / Note (Optional)</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Signature verified at handover counter"
              value={newDelivery.remarks}
              onChange={(e) => setNewDelivery({ ...newDelivery, remarks: e.target.value })}
            />
          </div>

          <div className="d-flex justify-content-end gap-2 mt-3 pt-3 border-top">
            <Button variant="light" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" icon={CheckCircle2}>
              Save Handover Record
            </Button>
          </div>
        </form>
      </Modal>

      {/* 6. Modal: Edit Handover Record */}
      {editModalOpen && editingDelivery && (
        <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title={`Edit Handover Record: ${editingDelivery.id}`}>
          <form onSubmit={handleUpdateDelivery} className="d-flex flex-column gap-3">
            {/* Recipient Type Choice */}
            <div>
              <label className="form-label small fw-bold">To Whom Handed Over (Recipient Type)</label>
              <div className="d-flex gap-2 mb-2">
                <button
                  type="button"
                  className={`btn btn-sm flex-fill py-2 d-flex align-items-center justify-content-center gap-2 fw-bold rounded-2 ${
                    editingDelivery.recipientType === 'Student'
                      ? 'btn-danger text-white'
                      : 'btn-light border text-sa-charcoal'
                  }`}
                  style={editingDelivery.recipientType === 'Student' ? { backgroundColor: '#8B1216', borderColor: '#8B1216' } : {}}
                  onClick={() => setEditingDelivery({ ...editingDelivery, recipientType: 'Student' })}
                >
                  <GraduationCap size={16} />
                  <span>Student</span>
                </button>

                <button
                  type="button"
                  className={`btn btn-sm flex-fill py-2 d-flex align-items-center justify-content-center gap-2 fw-bold rounded-2 ${
                    editingDelivery.recipientType === 'Teacher'
                      ? 'btn-danger text-white'
                      : 'btn-light border text-sa-charcoal'
                  }`}
                  style={editingDelivery.recipientType === 'Teacher' ? { backgroundColor: '#8B1216', borderColor: '#8B1216' } : {}}
                  onClick={() => setEditingDelivery({ ...editingDelivery, recipientType: 'Teacher' })}
                >
                  <Briefcase size={16} />
                  <span>Teacher</span>
                </button>
              </div>

              {/* Recipient Dropdown / Selection */}
              {editingDelivery.recipientType === 'Student' ? (
                <div>
                  <select
                    className="form-select mb-2"
                    value={editingDelivery.recipientId}
                    onChange={(e) => {
                      const selected = students.find(s => String(s.id || s._id || s.student_id) === String(e.target.value));
                      setEditingDelivery({
                        ...editingDelivery,
                        recipientId: e.target.value,
                        recipientName: selected ? selected.name : editingDelivery.recipientName
                      });
                    }}
                  >
                    <option value="">-- Select Registered Student --</option>
                    {students.map(s => (
                      <option key={s.id || s._id} value={s.id || s._id || s.student_id}>
                        {s.name} &bull; Roll: {s.rollNumber || s.student_id || 'N/A'} ({s.standard || 'General'})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <select
                    className="form-select mb-2"
                    value={editingDelivery.recipientId}
                    onChange={(e) => {
                      const selected = teachers.find(t => String(t.id || t._id) === String(e.target.value));
                      setEditingDelivery({
                        ...editingDelivery,
                        recipientId: e.target.value,
                        recipientName: selected ? (selected.name || selected.full_name) : editingDelivery.recipientName
                      });
                    }}
                  >
                    <option value="">-- Select Teacher --</option>
                    {teachers.map(t => (
                      <option key={t.id || t._id} value={t.id || t._id}>
                        {t.name || t.full_name} &bull; Subject: {t.subject || 'Faculty'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Recipient Name Input */}
              <input
                type="text"
                className="form-control"
                placeholder="Recipient Name"
                value={editingDelivery.recipientName}
                onChange={(e) => setEditingDelivery({ ...editingDelivery, recipientName: e.target.value })}
                required
              />
            </div>

            {/* Book Category & Subject */}
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label small fw-bold">Book Type</label>
                <select
                  className="form-select"
                  value={editingDelivery.category}
                  onChange={(e) => setEditingDelivery({ ...editingDelivery, category: e.target.value })}
                  required
                >
                  <option value="Theory">Theory Book</option>
                  <option value="CET">CET Book</option>
                </select>
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label small fw-bold">Subject</label>
                <select
                  className="form-select"
                  value={editingDelivery.subject}
                  onChange={(e) => setEditingDelivery({ ...editingDelivery, subject: e.target.value })}
                  required
                >
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Maths">Maths</option>
                  <option value="Biology">Biology</option>
                </select>
              </div>
            </div>

            {/* Handover Date & Time */}
            <div className="row g-3">
              <div className="col-12 col-md-7">
                <label className="form-label small fw-bold d-flex align-items-center justify-content-between">
                  <span>Handover Date & Time</span>
                  <button
                    type="button"
                    className="btn btn-link p-0 text-decoration-none small text-sa-primary"
                    onClick={() => setEditingDelivery({ ...editingDelivery, date: getCurrentLocalDateTime() })}
                  >
                    Set to Current
                  </button>
                </label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={editingDelivery.date}
                  onChange={(e) => setEditingDelivery({ ...editingDelivery, date: e.target.value })}
                  required
                />
              </div>

              <div className="col-12 col-md-5">
                <label className="form-label small fw-bold">Delivery Status</label>
                <select
                  className="form-select"
                  value={editingDelivery.status}
                  onChange={(e) => setEditingDelivery({ ...editingDelivery, status: e.target.value })}
                >
                  <option value="Delivered">Delivered</option>
                  <option value="Pending Pickup">Pending Pickup</option>
                </select>
              </div>
            </div>

            {/* Who Handed Them Over */}
            <div>
              <label className="form-label small fw-bold">Who Handed Them Over (Staff Name)</label>
              <input
                type="text"
                className="form-control"
                value={editingDelivery.handedOverBy}
                onChange={(e) => setEditingDelivery({ ...editingDelivery, handedOverBy: e.target.value })}
                placeholder="Staff Name"
                required
              />
            </div>

            {/* Remarks */}
            <div>
              <label className="form-label small fw-semibold text-sa-muted">Remarks / Note</label>
              <input
                type="text"
                className="form-control"
                value={editingDelivery.remarks}
                onChange={(e) => setEditingDelivery({ ...editingDelivery, remarks: e.target.value })}
              />
            </div>

            <div className="d-flex justify-content-end gap-2 mt-3 pt-3 border-top">
              <Button variant="light" onClick={() => setEditModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary" icon={CheckCircle2}>
                Update Handover Record
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
