import React, { useState, useEffect } from 'react';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
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
  AlertCircle,
  Filter,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { toast } from 'react-toastify';
import inventoryService from '../../services/inventoryService';
import studentService from '../../services/studentService';
import { useAuth } from '../../hooks/useAuth';

export default function NotesDelivery() {
  const { user } = useAuth();
  const currentStaffName = user?.full_name || user?.name || 'Academy Admin';

  const [deliveries, setDeliveries] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [subjectFilter, setSubjectFilter] = useState('All');

  // Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState(null);

  // New Handover Form State
  const [newDelivery, setNewDelivery] = useState({
    studentId: '',
    category: 'Theory',
    subject: 'Physics',
    status: 'Delivered',
    handedOverBy: currentStaffName,
    remarks: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [delivData, itemsData, studentsData] = await Promise.all([
        inventoryService.getDeliveries(),
        inventoryService.getItems(),
        studentService.getAll()
      ]);
      setDeliveries(delivData || []);
      setInventoryItems(itemsData || []);
      setStudents(studentsData || []);
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
      setNewDelivery(prev => ({
        ...prev,
        handedOverBy: user.full_name || user.name
      }));
    }
  }, [user]);

  // Find currently matched inventory item for category & subject
  const getSelectedBookItem = (cat, subj) => {
    return inventoryItems.find(it => {
      const itCat = (it.category || '').toLowerCase();
      const itSubj = (it.subject || '').toLowerCase();
      return itCat === cat.toLowerCase() && itSubj === subj.toLowerCase();
    }) || inventoryItems.find(it => it.title.toLowerCase().includes(cat.toLowerCase()) && it.title.toLowerCase().includes(subj.toLowerCase()));
  };

  const selectedItemStock = getSelectedBookItem(newDelivery.category, newDelivery.subject);

  const handleMarkDelivered = async (id, studentName, bookTitle) => {
    try {
      await inventoryService.updateDeliveryStatus(id, 'Delivered', currentStaffName, 'Handover confirmed at pickup desk');
      toast.success(`Book "${bookTitle}" successfully handed over to ${studentName}!`);
      fetchData();
    } catch (err) {
      toast.error('Failed to confirm delivery');
    }
  };

  const handleCreateDelivery = async (e) => {
    e.preventDefault();
    if (!newDelivery.studentId) {
      toast.error('Please select a student');
      return;
    }

    try {
      const bookItem = getSelectedBookItem(newDelivery.category, newDelivery.subject);
      const studentObj = students.find(s => (s.id || s._id || s.student_id) === newDelivery.studentId);
      const studentDisplayName = studentObj ? studentObj.name : 'Student';

      await inventoryService.createDelivery({
        student_id: newDelivery.studentId,
        inventory_item_id: bookItem ? bookItem.id : null,
        category: newDelivery.category,
        subject: newDelivery.subject,
        book_title: bookItem ? bookItem.title : `${newDelivery.category} - ${newDelivery.subject}`,
        status: newDelivery.status,
        handed_over_by: newDelivery.handedOverBy || currentStaffName,
        verified_by: newDelivery.handedOverBy || currentStaffName,
        remarks: newDelivery.remarks
      });

      toast.success(`Handover record created: ${newDelivery.category} ${newDelivery.subject} to ${studentDisplayName}!`);
      setModalOpen(false);
      setNewDelivery({
        studentId: '',
        category: 'Theory',
        subject: 'Physics',
        status: 'Delivered',
        handedOverBy: currentStaffName,
        remarks: ''
      });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to log book delivery. Check student selection.');
    }
  };

  const handleUpdateDelivery = async (e) => {
    e.preventDefault();
    if (!editingDelivery) return;
    try {
      await inventoryService.updateDeliveryStatus(
        editingDelivery.id,
        editingDelivery.status,
        editingDelivery.handedOverBy || currentStaffName,
        editingDelivery.remarks
      );
      toast.success('Handover record updated successfully!');
      setEditingDelivery(null);
      fetchData();
    } catch (err) {
      toast.error('Failed to update delivery');
    }
  };

  const handleDeleteDelivery = async (id, studentName) => {
    if (!window.confirm(`Delete delivery record for ${studentName}?`)) return;
    try {
      await inventoryService.deleteDelivery(id);
      toast.info('Delivery record removed.');
      fetchData();
    } catch (err) {
      toast.error('Failed to remove delivery record');
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
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery = !q || 
      (d.studentName && d.studentName.toLowerCase().includes(q)) ||
      (d.rollNumber && d.rollNumber.toLowerCase().includes(q)) ||
      (d.bookTitle && d.bookTitle.toLowerCase().includes(q)) ||
      (d.handedOverBy && d.handedOverBy.toLowerCase().includes(q));

    return matchesStatus && matchesCat && matchesSubj && matchesQuery;
  });

  return (
    <div className="d-flex flex-column gap-4 pb-4">
      {/* 1. Page Header */}
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
        <div>
          <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4 d-flex align-items-center gap-2">
            <Truck className="text-sa-primary" size={24} />
            <span>Books Delivery & Student Handover Desk</span>
          </h3>
          <span className="small text-sa-muted">
            Record Theory & CET book handouts to students, track who handed them over, and save records to database
          </span>
        </div>

        <div className="d-flex align-items-center gap-2">
          <Button variant="outline" icon={RefreshCw} onClick={fetchData}>
            Refresh
          </Button>
          <Button variant="primary" icon={Plus} onClick={() => setModalOpen(true)}>
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
              <span className="small text-secondary">Logged in system</span>
            </div>
            <div className="rounded-circle p-2.5 bg-primary bg-opacity-10 text-primary">
              <Truck size={24} />
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="sa-card p-3 d-flex align-items-center justify-content-between h-100 bg-white border">
            <div>
              <span className="text-sa-muted fw-semibold small d-block">Delivered to Students</span>
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
              <span className="small text-warning-emphasis fw-medium">Awaiting student collection</span>
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
              <span className="small text-sa-muted">Ready for distribution</span>
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
          <div className="col-12 col-md-4 position-relative">
            <Search size={16} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-sa-muted" />
            <input
              type="text"
              className="form-control ps-5 py-2 text-sm"
              placeholder="Search student, roll no, or staff..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Category Filter */}
          <div className="col-12 col-sm-4 col-md-2.5">
            <select
              className="form-select form-select-sm py-2 shadow-xs fw-medium"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="All">All Categories</option>
              <option value="Theory">Theory Books</option>
              <option value="CET">CET Books</option>
            </select>
          </div>

          {/* Subject Filter */}
          <div className="col-12 col-sm-4 col-md-2.5">
            <select
              className="form-select form-select-sm py-2 shadow-xs fw-medium"
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
            >
              <option value="All">All Subjects</option>
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Biology">Biology</option>
              <option value="Maths">Mathematics</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="col-12 col-sm-4 col-md-3">
            <select
              className="form-select form-select-sm py-2 shadow-xs fw-medium"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Delivery Status</option>
              <option value="Delivered">Delivered Only</option>
              <option value="Pending Pickup">Pending Pickup Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Edit Delivery Bar (if editing) */}
      {editingDelivery && (
        <form onSubmit={handleUpdateDelivery} className="sa-card p-3.5 bg-light border border-primary border-opacity-25">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <h6 className="m-0 fw-bold text-sa-charcoal">
              Edit Handover Record: {editingDelivery.id}
            </h6>
            <button
              type="button"
              className="btn btn-sm btn-close"
              onClick={() => setEditingDelivery(null)}
            />
          </div>
          <div className="row g-2 align-items-end">
            <div className="col-12 col-md-3">
              <label className="form-label small fw-semibold text-sa-muted">Student</label>
              <input type="text" className="form-control form-control-sm" value={`${editingDelivery.studentName} (${editingDelivery.rollNumber})`} disabled />
            </div>
            <div className="col-12 col-md-3">
              <label className="form-label small fw-semibold text-sa-muted">Book Title</label>
              <input type="text" className="form-control form-control-sm" value={editingDelivery.bookTitle} disabled />
            </div>
            <div className="col-12 col-md-2">
              <label className="form-label small fw-semibold text-sa-muted">Delivery Status</label>
              <select
                className="form-select form-select-sm"
                value={editingDelivery.status}
                onChange={e => setEditingDelivery({ ...editingDelivery, status: e.target.value })}
              >
                <option value="Delivered">Delivered</option>
                <option value="Pending Pickup">Pending Pickup</option>
              </select>
            </div>
            <div className="col-12 col-md-2">
              <label className="form-label small fw-semibold text-sa-muted">Who Handed Over</label>
              <input
                type="text"
                className="form-control form-control-sm"
                value={editingDelivery.handedOverBy}
                onChange={e => setEditingDelivery({ ...editingDelivery, handedOverBy: e.target.value })}
                placeholder="Staff Name"
              />
            </div>
            <div className="col-12 col-md-2 d-flex gap-2">
              <Button type="submit" size="sm" variant="primary" className="w-100">Save</Button>
              <Button size="sm" variant="light" onClick={() => setEditingDelivery(null)}>Cancel</Button>
            </div>
          </div>
        </form>
      )}

      {/* 5. Deliveries Table */}
      <div className="sa-card p-4 bg-white border">
        <Table
          columns={[
            {
              key: 'studentName',
              title: 'To Whom Handed Over (Student)',
              render: (val, row) => (
                <div className="d-flex align-items-center gap-2">
                  <div className="rounded-circle p-1.5 bg-danger bg-opacity-10 text-danger flex-shrink-0">
                    <User size={15} />
                  </div>
                  <div>
                    <span className="fw-bold text-sa-charcoal d-block">{val}</span>
                    <span className="text-sa-muted small">Roll: {row.rollNumber}</span>
                  </div>
                </div>
              )
            },
            {
              key: 'category',
              title: 'Book Type',
              width: '110px',
              render: (val, row) => (
                <span
                  className="badge px-2.5 py-1 fw-bold rounded-pill"
                  style={{
                    fontSize: '0.72rem',
                    backgroundColor: (val || '').toLowerCase() === 'cet' ? '#FEF3C7' : '#FEE2E2',
                    color: (val || '').toLowerCase() === 'cet' ? '#92400E' : '#991B1B',
                    border: (val || '').toLowerCase() === 'cet' ? '1px solid #FCD34D' : '1px solid #FCA5A5'
                  }}
                >
                  {val || ((row.bookTitle || '').toLowerCase().includes('cet') ? 'CET' : 'Theory')}
                </span>
              )
            },
            {
              key: 'subject',
              title: 'Subject',
              width: '120px',
              render: (val, row) => (
                <span className="fw-semibold text-sa-charcoal">{val || 'General'}</span>
              )
            },
            {
              key: 'bookTitle',
              title: 'Book Module Title',
              render: (val) => (
                <div className="d-flex align-items-center gap-1.5">
                  <BookMarked size={16} className="text-secondary flex-shrink-0" />
                  <span className="fw-semibold text-sa-charcoal">{val}</span>
                </div>
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
              width: '160px',
              render: (val) => <span className="small text-sa-muted fw-medium">{val}</span>
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
                      onClick={() => handleMarkDelivered(row.id, row.studentName, row.bookTitle)}
                    >
                      Confirm
                    </Button>
                  ) : (
                    <span className="small text-success fw-bold me-1">✓ Complete</span>
                  )}
                  <button
                    type="button"
                    title="Edit record"
                    className="btn btn-sm btn-light border p-1 text-primary"
                    onClick={() => setEditingDelivery(row)}
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    type="button"
                    title="Delete record"
                    className="btn btn-sm btn-light border p-1 text-danger"
                    onClick={() => handleDeleteDelivery(row.id, row.studentName)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )
            }
          ]}
          data={filteredDeliveries}
          loading={loading}
          emptyText="No book delivery records found."
        />
      </div>

      {/* 6. Modal: Log New Book Handover */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Log New Book Handover">
        <form onSubmit={handleCreateDelivery} className="d-flex flex-column gap-3">
          {/* Student Selector */}
          <div>
            <label className="form-label small fw-bold">
              To Whom Handed Over (Select Student) <span className="text-danger">*</span>
            </label>
            <select
              className="form-select form-select-lg"
              value={newDelivery.studentId}
              onChange={(e) => setNewDelivery({ ...newDelivery, studentId: e.target.value })}
              required
            >
              <option value="">-- Choose Student --</option>
              {students.map(s => (
                <option key={s.id || s._id} value={s.id || s._id || s.student_id}>
                  {s.name} &bull; Roll: {s.rollNumber || s.student_id || 'N/A'} ({s.standard || 'General'})
                </option>
              ))}
            </select>
          </div>

          {/* Book Category & Subject */}
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label small fw-bold">Book Category</label>
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
                <option value="Biology">Biology</option>
                <option value="Maths">Mathematics</option>
              </select>
            </div>
          </div>

          {/* Available Stock Indicator Box */}
          <div className="p-3 bg-light rounded-2 border d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <BookMarked size={20} className="text-sa-primary" />
              <div>
                <span className="fw-bold text-sa-charcoal d-block">
                  {newDelivery.category} - {newDelivery.subject}
                </span>
                <span className="text-sa-muted small">Standard curriculum module</span>
              </div>
            </div>
            <div className="text-end">
              <span className="small text-sa-muted d-block">Available Stock</span>
              {selectedItemStock ? (
                <span className={`fw-extrabold brand-font ${selectedItemStock.in_stock > 0 ? 'text-success' : 'text-danger'}`}>
                  {selectedItemStock.in_stock} Copies left
                </span>
              ) : (
                <span className="text-success fw-bold">In Stock</span>
              )}
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
                placeholder="Staff / Admin Name who handed over the books"
                required
              />
            </div>
            <span className="small text-sa-muted mt-1 d-block">
              Recorded in database under handover verification records
            </span>
          </div>

          {/* Delivery Status */}
          <div>
            <label className="form-label small fw-bold">Delivery Status</label>
            <select
              className="form-select"
              value={newDelivery.status}
              onChange={(e) => setNewDelivery({ ...newDelivery, status: e.target.value })}
            >
              <option value="Delivered">Delivered (Handed over right now)</option>
              <option value="Pending Pickup">Pending Pickup (Ready for collection)</option>
            </select>
          </div>

          {/* Remarks */}
          <div>
            <label className="form-label small fw-semibold text-sa-muted">Remarks / Note (Optional)</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Verified with RFID badge scan"
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
    </div>
  );
}
