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
  Send,
  UserCheck,
  BookMarked,
  Printer,
  ShieldCheck,
  User,
  Search,
  RefreshCw,
  Package,
  Layers
} from 'lucide-react';
import { toast } from 'react-toastify';
import inventoryService from '../../services/inventoryService';
import studentService from '../../services/studentService';
import { useAuth } from '../../hooks/useAuth';

export default function NotesDelivery() {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const [newDelivery, setNewDelivery] = useState({
    studentId: '',
    inventoryItemId: '',
    handedOverBy: '',
    quantity: 1,
    status: 'Handed Over',
    remarks: 'Direct handout at pickup desk'
  });

  const [voucherModalOpen, setVoucherModalOpen] = useState(false);
  const [viewingVoucher, setViewingVoucher] = useState(null);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const data = await inventoryService.getDeliveries();
      setDeliveries(data);
    } catch (err) {
      toast.error('Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async () => {
    try {
      const data = await inventoryService.getItems();
      setInventoryItems(data);
    } catch (err) {}
  };

  const fetchStudents = async () => {
    try {
      const data = await studentService.getAll();
      setStudents(data);
    } catch (err) {}
  };

  useEffect(() => {
    fetchDeliveries();
    fetchItems();
    fetchStudents();
  }, []);

  const [editingDelivery, setEditingDelivery] = useState(null);

  const handleMarkDelivered = async (id, studentName) => {
    try {
      const staffName = user?.name || user?.full_name || 'Academic Desk';
      await inventoryService.updateDeliveryStatus(id, 'Handed Over', staffName, 'Pickup verified at desk');
      toast.success(`Notes handed over successfully to ${studentName}!`);
      fetchDeliveries();
      fetchItems();
    } catch (err) {
      toast.error('Failed to log handover');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await inventoryService.updateDeliveryStatus(
        editingDelivery.id,
        editingDelivery.status,
        editingDelivery.handedOverBy || user?.name || 'Staff Desk',
        editingDelivery.remarks
      );
      setEditingDelivery(null);
      toast.success('Handover record updated successfully!');
      fetchDeliveries();
      fetchItems();
    } catch (err) {
      toast.error('Failed to update delivery');
    }
  };

  const handleOpenCreateModal = () => {
    const defaultStaff = user?.name || user?.full_name || 'Academic Desk';
    setNewDelivery({
      studentId: students[0]?.id || '',
      inventoryItemId: inventoryItems[0]?.id || '',
      handedOverBy: defaultStaff,
      quantity: 1,
      status: 'Handed Over',
      remarks: 'Direct pickup at academy counter'
    });
    setModalOpen(true);
  };

  const handleCreateDelivery = async (e) => {
    e.preventDefault();
    const selectedItem = inventoryItems.find(i => i.id === newDelivery.inventoryItemId);
    if (selectedItem && selectedItem.inStock < Number(newDelivery.quantity) && newDelivery.status === 'Handed Over') {
      toast.error(`Insufficient stock! Only ${selectedItem.inStock} copies available.`);
      return;
    }

    const stu = students.find(s => s.id === newDelivery.studentId);
    try {
      await inventoryService.createDelivery({
        student_id: newDelivery.studentId,
        inventory_item_id: newDelivery.inventoryItemId,
        handed_over_by: newDelivery.handedOverBy || user?.name || 'Academic Staff',
        handed_over_to: stu ? stu.name : 'Student',
        student_roll_no: stu ? (stu.rollNumber || stu.student_id) : 'N/A',
        quantity: Number(newDelivery.quantity) || 1,
        status: newDelivery.status,
        remarks: newDelivery.remarks
      });
      toast.success('New notes handover logged successfully!');
      setModalOpen(false);
      fetchDeliveries();
      fetchItems();
    } catch (err) {
      toast.error('Failed to log new handover. Check student selection.');
    }
  };

  // KPI calculations
  const totalHandovers = deliveries.length;
  const completedHandovers = deliveries.filter(d => d.status === 'Handed Over' || d.status === 'Delivered').length;
  const pendingHandovers = deliveries.filter(d => d.status === 'Pending Pickup').length;
  const availableStockCount = inventoryItems.reduce((acc, item) => acc + (Number(item.inStock) || 0), 0);

  const filteredDeliveries = deliveries.filter(d => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (d.bookTitle && d.bookTitle.toLowerCase().includes(q)) ||
      (d.studentName && d.studentName.toLowerCase().includes(q)) ||
      (d.rollNumber && d.rollNumber.toLowerCase().includes(q)) ||
      (d.handedOverBy && d.handedOverBy.toLowerCase().includes(q));

    const matchesStatus =
      statusFilter === 'All' ||
      (statusFilter === 'Handed Over' && (d.status === 'Handed Over' || d.status === 'Delivered')) ||
      (statusFilter === 'Pending Pickup' && d.status === 'Pending Pickup');

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="d-flex flex-column gap-3 w-100 pb-4">
      {/* 1. Header & Primary Action Buttons (Single-line heading + compact action buttons) */}
      <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3 pt-1">
        <div style={{ minWidth: 0 }}>
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <h2 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4" style={{ letterSpacing: '-0.2px' }}>
              Notes Handover & Student Pickup Desk
            </h2>
            <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-0.5 rounded-pill fw-semibold" style={{ fontSize: '11px' }}>
              Pickup Verification
            </span>
          </div>
          <span className="small text-sa-muted mt-1 d-block" style={{ fontSize: '12.5px' }}>
            Verify physical study material handouts, student RFID confirmation, and staff handover logs
          </span>
        </div>

        <div className="d-flex align-items-center gap-2 flex-nowrap flex-shrink-0">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary bg-white d-inline-flex align-items-center justify-content-center gap-1.5 px-3 py-1.5 fw-semibold shadow-xs text-nowrap"
            style={{ borderRadius: '8px', fontSize: '13px', height: '36px', whiteSpace: 'nowrap' }}
            onClick={() => { fetchDeliveries(); fetchItems(); }}
            title="Refresh Deliveries data"
          >
            <RefreshCw size={14} className="flex-shrink-0" />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            className="btn btn-sm text-white d-inline-flex align-items-center justify-content-center gap-1.5 px-3.5 py-1.5 fw-semibold shadow-xs text-nowrap"
            style={{ backgroundColor: '#8B1216', borderColor: '#8B1216', borderRadius: '8px', fontSize: '13px', height: '36px', whiteSpace: 'nowrap' }}
            onClick={handleOpenCreateModal}
          >
            <Plus size={16} className="flex-shrink-0" />
            <span>Log New Handover</span>
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Cards */}
      <div className="row g-3">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="sa-card p-3 h-100 border-start border-4 border-primary d-flex flex-column justify-content-between">
            <div>
              <div className="d-flex align-items-center justify-content-between mb-1.5">
                <span className="text-sa-muted small fw-bold text-uppercase tracking-wider" style={{ fontSize: '11px' }}>
                  Total Handovers Logged
                </span>
                <div className="rounded-circle p-1.5 bg-primary-subtle text-primary">
                  <UserCheck size={17} />
                </div>
              </div>
              <div className="d-flex align-items-baseline gap-2">
                <h3 className="fs-3 fw-extrabold text-sa-charcoal mb-0">
                  {totalHandovers}
                </h3>
                <span className="small text-muted fw-semibold" style={{ fontSize: '12px' }}>Total Records</span>
              </div>
            </div>
            <div className="mt-2 small text-primary d-flex align-items-center gap-1" style={{ fontSize: '11.5px' }}>
              <CheckCircle2 size={13} /> Recorded in audit register
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="sa-card p-3 h-100 border-start border-4 border-success d-flex flex-column justify-content-between">
            <div>
              <div className="d-flex align-items-center justify-content-between mb-1.5">
                <span className="text-sa-muted small fw-bold text-uppercase tracking-wider" style={{ fontSize: '11px' }}>
                  Completed Handovers
                </span>
                <div className="rounded-circle p-1.5 bg-success-subtle text-success">
                  <CheckCircle2 size={17} />
                </div>
              </div>
              <div className="d-flex align-items-baseline gap-2">
                <h3 className="fs-3 fw-extrabold text-sa-charcoal mb-0">
                  {completedHandovers}
                </h3>
                <span className="small text-muted fw-semibold" style={{ fontSize: '12px' }}>Disbursed Sets</span>
              </div>
            </div>
            <div className="mt-2 small text-success d-flex align-items-center gap-1" style={{ fontSize: '11.5px' }}>
              <CheckCircle2 size={13} /> Received by students
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="sa-card p-3 h-100 border-start border-4 border-warning d-flex flex-column justify-content-between">
            <div>
              <div className="d-flex align-items-center justify-content-between mb-1.5">
                <span className="text-sa-muted small fw-bold text-uppercase tracking-wider" style={{ fontSize: '11px' }}>
                  Pending Counter Pickup
                </span>
                <div className="rounded-circle p-1.5 bg-warning-subtle text-warning-emphasis">
                  <Clock size={17} />
                </div>
              </div>
              <div className="d-flex align-items-baseline gap-2">
                <h3 className="fs-3 fw-extrabold text-sa-charcoal mb-0">
                  {pendingHandovers}
                </h3>
                <span className="small text-muted fw-semibold" style={{ fontSize: '12px' }}>Awaiting Pickup</span>
              </div>
            </div>
            <div className="mt-2 small text-warning-emphasis d-flex align-items-center gap-1" style={{ fontSize: '11.5px' }}>
              <Clock size={13} /> Ready at admin desk
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="sa-card p-3 h-100 border-start border-4 border-info d-flex flex-column justify-content-between">
            <div>
              <div className="d-flex align-items-center justify-content-between mb-1.5">
                <span className="text-sa-muted small fw-bold text-uppercase tracking-wider" style={{ fontSize: '11px' }}>
                  Available Warehouse Stock
                </span>
                <div className="rounded-circle p-1.5 bg-info-subtle text-info">
                  <Package size={17} />
                </div>
              </div>
              <div className="d-flex align-items-baseline gap-2">
                <h3 className="fs-3 fw-extrabold text-sa-charcoal mb-0">
                  {availableStockCount}
                </h3>
                <span className="small text-muted fw-semibold" style={{ fontSize: '12px' }}>Copies In Stock</span>
              </div>
            </div>
            <div className="mt-2 small text-muted" style={{ fontSize: '11.5px' }}>
              Across {inventoryItems.length} active note packages
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form if selected */}
      {editingDelivery && (
        <form onSubmit={handleUpdate} className="sa-card p-4 bg-light border-start border-4 border-primary">
          <h5 className="fw-bold text-sa-charcoal">Update Handover: #{editingDelivery.id?.slice(-6).toUpperCase()}</h5>
          <div className="row g-3 mt-1">
            <div className="col-12 col-md-3">
              <label className="form-label small fw-bold">To Whom Handed Over (Student)</label>
              <input type="text" className="form-control" value={editingDelivery.studentName} disabled />
            </div>
            <div className="col-12 col-md-3">
              <label className="form-label small fw-bold">Material Package</label>
              <input type="text" className="form-control" value={editingDelivery.bookTitle} disabled />
            </div>
            <div className="col-12 col-md-3">
              <label className="form-label small fw-bold">Who Handed Them Over</label>
              <input
                type="text"
                className="form-control"
                value={editingDelivery.handedOverBy || ''}
                onChange={e => setEditingDelivery({ ...editingDelivery, handedOverBy: e.target.value })}
              />
            </div>
            <div className="col-12 col-md-3">
              <label className="form-label small fw-bold">Handover Status</label>
              <select
                className="form-select"
                value={editingDelivery.status}
                onChange={e => setEditingDelivery({ ...editingDelivery, status: e.target.value })}
              >
                <option value="Handed Over">Handed Over</option>
                <option value="Pending Pickup">Pending Pickup</option>
              </select>
            </div>
            <div className="col-12 d-flex align-items-end gap-2">
              <Button type="submit" variant="primary">Save Changes</Button>
              <Button variant="outline" onClick={() => setEditingDelivery(null)}>Cancel</Button>
            </div>
          </div>
        </form>
      )}

      {/* 3. Main Table Container */}
      <div className="sa-card p-3 p-md-4">
        {/* Search & Filters Bar with Matching Heights */}
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2.5 pb-3 mb-3 border-bottom">
          <div className="d-flex flex-wrap align-items-center gap-2 flex-grow-1" style={{ maxWidth: '850px' }}>
            <div className="input-group" style={{ minWidth: '240px', flex: '1 1 240px', height: '36px' }}>
              <span className="input-group-text bg-white border-end-0 text-muted py-0">
                <Search size={15} />
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0 text-sm"
                style={{ height: '36px', fontSize: '13px' }}
                placeholder="Search by student, roll no, faculty, or package..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <select
              className="form-select form-select-sm"
              style={{ width: 'auto', minWidth: '180px', height: '36px', fontSize: '13px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Handover Statuses</option>
              <option value="Handed Over">Handed Over</option>
              <option value="Pending Pickup">Pending Pickup</option>
            </select>
          </div>

          <span className="small text-muted fw-semibold">
            Total {filteredDeliveries.length} handovers tracked
          </span>
        </div>

        {/* Handover Table with Exact Sized Columns */}
        <Table
          columns={[
            {
              key: 'id',
              title: 'Tracking ID',
              width: '90px',
              render: (val) => (
                <span className="badge bg-light text-dark border font-monospace px-1.5 py-0.5 text-nowrap" style={{ fontSize: '11px' }}>
                  #{val ? val.slice(-6).toUpperCase() : 'HO-001'}
                </span>
              )
            },
            {
              key: 'bookTitle',
              title: 'Notes Package',
              render: (val, row) => (
                <div className="py-0.5">
                  <div className="fw-bold text-sa-charcoal d-flex align-items-center gap-1.5" style={{ fontSize: '13px', lineHeight: 1.25 }}>
                    <BookMarked size={15} className="text-sa-primary flex-shrink-0" />
                    <span>{val}</span>
                  </div>
                  <div className="d-flex align-items-center gap-1.5 mt-0.5 text-muted" style={{ fontSize: '11px' }}>
                    <span>{row.availableStock !== undefined ? `${row.availableStock} in stock` : 'In Stock'}</span>
                    <span>•</span>
                    <span>Qty: {row.quantity || 1} copy</span>
                  </div>
                </div>
              )
            },
            {
              key: 'handedOverBy',
              title: 'Handed Over By',
              width: '180px',
              render: (val) => (
                <div className="d-flex align-items-center gap-2 text-nowrap">
                  <div className="rounded-circle bg-danger-subtle text-danger p-1 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 24, height: 24 }}>
                    <ShieldCheck size={14} />
                  </div>
                  <div>
                    <span className="fw-bold text-sa-charcoal small d-block text-nowrap" style={{ fontSize: '12.5px', lineHeight: 1.2 }}>
                      {val || 'Academic Staff'}
                    </span>
                    <span className="text-muted d-block text-nowrap" style={{ fontSize: '10.5px' }}>
                      Faculty / Staff
                    </span>
                  </div>
                </div>
              )
            },
            {
              key: 'handedOverTo',
              title: 'Recipient Student',
              width: '180px',
              render: (val, row) => (
                <div className="d-flex align-items-center gap-2 text-nowrap">
                  <div className="rounded-circle bg-primary-subtle text-primary p-1 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 24, height: 24 }}>
                    <User size={14} />
                  </div>
                  <div>
                    <span className="fw-bold text-sa-charcoal small d-block text-nowrap" style={{ fontSize: '12.5px', lineHeight: 1.2 }}>
                      {val || row.studentName || 'Student'}
                    </span>
                    <span className="small text-muted font-monospace d-block text-nowrap" style={{ fontSize: '10.5px' }}>
                      Roll: {row.rollNumber || 'N/A'}
                    </span>
                  </div>
                </div>
              )
            },
            {
              key: 'date',
              title: 'Handover Date',
              width: '125px',
              render: (val) => (
                <span className="small text-sa-charcoal fw-semibold text-nowrap" style={{ fontSize: '12px' }}>
                  {val ? (val.length > 12 ? val.slice(0, 11) : val) : '--'}
                </span>
              )
            },
            {
              key: 'status',
              title: 'Status',
              width: '120px',
              render: (val) => (
                <span className={`badge px-2 py-0.5 small d-inline-flex align-items-center gap-1 text-nowrap ${
                  val === 'Delivered' || val === 'Handed Over'
                    ? 'bg-success-subtle text-success border border-success-subtle'
                    : 'bg-warning-subtle text-warning-emphasis border border-warning-subtle'
                }`} style={{ fontSize: '10.5px' }}>
                  {val === 'Delivered' || val === 'Handed Over' ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                  {val}
                </span>
              )
            },
            {
              key: 'id',
              title: 'Action',
              align: 'end',
              width: '175px',
              render: (val, row) => (
                <div className="d-flex gap-1.5 justify-content-end align-items-center text-nowrap">
                  <button
                    type="button"
                    className="btn btn-sm btn-light border px-2 py-1 text-primary d-inline-flex align-items-center gap-1 small"
                    style={{ borderRadius: '6px', fontSize: '12px' }}
                    onClick={() => {
                      setViewingVoucher(row);
                      setVoucherModalOpen(true);
                    }}
                    title="Print Receipt"
                  >
                    <Printer size={12} /> Receipt
                  </button>

                  <button
                    type="button"
                    className="btn btn-sm btn-light border px-2 py-1 text-secondary small"
                    style={{ borderRadius: '6px', fontSize: '12px' }}
                    onClick={() => setEditingDelivery(row)}
                  >
                    Edit
                  </button>

                  {row.status === 'Pending Pickup' && (
                    <button
                      type="button"
                      className="btn btn-sm btn-primary px-2 py-1 small"
                      style={{ borderRadius: '6px', fontSize: '12px' }}
                      onClick={() => handleMarkDelivered(val, row.studentName)}
                    >
                      Confirm
                    </button>
                  )}
                </div>
              )
            }
          ]}
          data={filteredDeliveries}
          loading={loading}
        />
      </div>

      {/* Modal: Log New Delivery */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Log Notes Handover to Student">
        <form onSubmit={handleCreateDelivery} className="d-flex flex-column gap-3">
          <div>
            <label className="form-label small fw-bold">Select Material Package *</label>
            <select
              className="form-select"
              value={newDelivery.inventoryItemId}
              onChange={(e) => setNewDelivery({ ...newDelivery, inventoryItemId: e.target.value })}
              required
            >
              <option value="">-- Choose Module --</option>
              {inventoryItems.map(item => (
                <option key={item.id} value={item.id} disabled={Number(item.inStock) <= 0}>
                  {item.title} ({item.inStock} copies available) {Number(item.inStock) <= 0 ? '[OUT OF STOCK]' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label small fw-bold">To Whom Handed Over (Select Student) *</label>
            <select
              className="form-select"
              value={newDelivery.studentId}
              onChange={(e) => setNewDelivery({ ...newDelivery, studentId: e.target.value })}
              required
            >
              <option value="">-- Select Student --</option>
              {students.map(s => (
                <option key={s.id || s._id} value={s.id || s._id}>
                  {s.name} ({s.rollNumber || s.student_id || 'N/A'}) - {s.standard || '12th'}
                </option>
              ))}
            </select>
          </div>

          <div className="row g-2">
            <div className="col-8">
              <label className="form-label small fw-bold">Who Handed Them Over *</label>
              <input
                type="text"
                className="form-control"
                value={newDelivery.handedOverBy}
                onChange={(e) => setNewDelivery({ ...newDelivery, handedOverBy: e.target.value })}
                placeholder="Faculty or Staff member name"
                required
              />
            </div>
            <div className="col-4">
              <Input
                label="Quantity"
                name="quantity"
                type="number"
                min="1"
                value={newDelivery.quantity}
                onChange={(e) => setNewDelivery({ ...newDelivery, quantity: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="row g-2">
            <div className="col-6">
              <label className="form-label small fw-bold">Status</label>
              <select
                className="form-select"
                value={newDelivery.status}
                onChange={(e) => setNewDelivery({ ...newDelivery, status: e.target.value })}
              >
                <option value="Handed Over">Handed Over</option>
                <option value="Pending Pickup">Pending Pickup</option>
              </select>
            </div>
            <div className="col-6">
              <Input
                label="Remarks"
                name="remarks"
                value={newDelivery.remarks}
                onChange={(e) => setNewDelivery({ ...newDelivery, remarks: e.target.value })}
                placeholder="e.g. RFID card scan verified"
              />
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            <Button variant="light" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" icon={Send}>Log Handover</Button>
          </div>
        </form>
      </Modal>

      {/* Voucher Slip Modal */}
      <Modal isOpen={voucherModalOpen} onClose={() => setVoucherModalOpen(false)} title="Notes Handover Voucher Slip">
        {viewingVoucher && (
          <div className="d-flex flex-column gap-3">
            <div className="p-4 bg-white border rounded-3" id="print-slip">
              <div className="text-center pb-2 border-bottom border-2 border-danger">
                <h4 className="fw-extrabold text-danger m-0">SHUBHAM ACADEMY</h4>
                <div className="small text-muted fw-bold">Notes Handover & Verification Slip</div>
              </div>

              <div className="row g-2 mt-2 py-2 border-bottom small">
                <div className="col-6"><strong>ID:</strong> #{viewingVoucher.id?.slice(-6).toUpperCase()}</div>
                <div className="col-6 text-end"><strong>Date:</strong> {viewingVoucher.date}</div>
              </div>

              <table className="table table-bordered my-3 small">
                <tbody>
                  <tr>
                    <th className="bg-light" style={{ width: '35%' }}>Notes Title</th>
                    <td className="fw-bold">{viewingVoucher.bookTitle}</td>
                  </tr>
                  <tr>
                    <th className="bg-light">Handed Over To (Student)</th>
                    <td className="fw-bold">{viewingVoucher.studentName || viewingVoucher.handedOverTo}</td>
                  </tr>
                  <tr>
                    <th className="bg-light">Roll Number</th>
                    <td>{viewingVoucher.rollNumber || 'N/A'}</td>
                  </tr>
                  <tr>
                    <th className="bg-light">Who Handed Them Over</th>
                    <td className="fw-bold text-danger">{viewingVoucher.handedOverBy}</td>
                  </tr>
                  <tr>
                    <th className="bg-light">Status</th>
                    <td><span className="badge bg-success-subtle text-success">{viewingVoucher.status}</span></td>
                  </tr>
                  <tr>
                    <th className="bg-light">Remarks</th>
                    <td>{viewingVoucher.remarks || 'Confirmed handover'}</td>
                  </tr>
                </tbody>
              </table>

              <div className="row g-4 mt-3 pt-3 border-top text-center small">
                <div className="col-6">
                  <div className="border-bottom pb-4 mb-1"></div>
                  <strong>{viewingVoucher.handedOverBy}</strong>
                  <div className="text-muted">Staff Signature</div>
                </div>
                <div className="col-6">
                  <div className="border-bottom pb-4 mb-1"></div>
                  <strong>{viewingVoucher.studentName || viewingVoucher.handedOverTo}</strong>
                  <div className="text-muted">Student Signature</div>
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2 border-top pt-3">
              <Button variant="light" onClick={() => setVoucherModalOpen(false)}>Close</Button>
              <Button variant="primary" icon={Printer} onClick={() => window.print()}>Print Voucher</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
