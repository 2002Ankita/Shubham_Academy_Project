import React, { useState, useEffect } from 'react';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import {
  BookMarked,
  Plus,
  AlertTriangle,
  Send,
  UserCheck,
  CheckCircle2,
  Clock,
  Search,
  Package,
  Layers,
  FileCheck2,
  Printer,
  TrendingDown,
  User,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { toast } from 'react-toastify';
import inventoryService from '../../services/inventoryService';
import studentService from '../../services/studentService';
import teacherService from '../../services/teacherService';
import { useAuth } from '../../hooks/useAuth';

export default function NotesStock() {
  const { user } = useAuth();

  // State
  const [activeTab, setActiveTab] = useState('stock'); // 'stock' | 'handovers'
  const [stock, setStock] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchStock, setSearchStock] = useState('');
  const [selectedStockStream, setSelectedStockStream] = useState('All');
  const [selectedStockStatus, setSelectedStockStatus] = useState('All');

  const [searchHandover, setSearchHandover] = useState('');
  const [selectedHandoverStatus, setSelectedHandoverStatus] = useState('All');
  const [selectedHandoverFaculty, setSelectedHandoverFaculty] = useState('All');

  // Modals state
  const [handoverModalOpen, setHandoverModalOpen] = useState(false);
  const [addStockModalOpen, setAddStockModalOpen] = useState(false);
  const [restockModalOpen, setRestockModalOpen] = useState(false);
  const [selectedItemForRestock, setSelectedItemForRestock] = useState(null);
  const [voucherModalOpen, setVoucherModalOpen] = useState(false);
  const [viewingVoucher, setViewingVoucher] = useState(null);

  // Form states
  const [handoverForm, setHandoverForm] = useState({
    inventoryItemId: '',
    studentId: '',
    manualStudentName: '',
    manualRollNo: '',
    quantity: 1,
    handedOverBy: '',
    status: 'Handed Over',
    remarks: 'Direct classroom distribution'
  });

  const [restockQty, setRestockQty] = useState(25);

  const [newBook, setNewBook] = useState({
    title: '',
    category: 'Theory',
    subject: 'Physics',
    standard: '12th pcm tarabai park',
    inStock: 50,
    reorderLevel: 15,
    unitCost: 400
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [itemsData, deliveriesData, studentsData, teachersData] = await Promise.allSettled([
        inventoryService.getItems(),
        inventoryService.getDeliveries(),
        studentService.getAll(),
        teacherService.getAll()
      ]);

      if (itemsData.status === 'fulfilled') {
        setStock(itemsData.value || []);
      }
      if (deliveriesData.status === 'fulfilled') {
        setDeliveries(deliveriesData.value || []);
      }
      if (studentsData.status === 'fulfilled') {
        setStudents(studentsData.value || []);
      }
      if (teachersData.status === 'fulfilled') {
        setTeachers(teachersData.value || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load notes stock data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openHandoverModal = (preselectedItemId = '') => {
    const defaultStaff = user?.name || user?.full_name || (user?.role === 'teacher' ? 'Faculty Member' : 'Academic Admin Desk');
    setHandoverForm({
      inventoryItemId: preselectedItemId || (stock[0]?.id || ''),
      studentId: students[0]?.id || '',
      manualStudentName: '',
      manualRollNo: '',
      quantity: 1,
      handedOverBy: defaultStaff,
      status: 'Handed Over',
      remarks: 'Direct distribution & student acknowledgment'
    });
    setHandoverModalOpen(true);
  };

  const openRestockModal = (item) => {
    setSelectedItemForRestock(item);
    setRestockQty(25);
    setRestockModalOpen(true);
  };

  const handleHandoverSubmit = async (e) => {
    e.preventDefault();
    const item = stock.find(s => s.id === handoverForm.inventoryItemId);
    if (!item) {
      toast.error('Please select a valid note package');
      return;
    }

    if (item.inStock < Number(handoverForm.quantity)) {
      toast.error(`Not enough stock available! Only ${item.inStock} copies remaining.`);
      return;
    }

    let studentName = handoverForm.manualStudentName;
    let rollNo = handoverForm.manualRollNo;
    let standard = item.standard;

    if (handoverForm.studentId) {
      const selectedStudent = students.find(s => (s.id || s._id) === handoverForm.studentId);
      if (selectedStudent) {
        studentName = selectedStudent.name;
        rollNo = selectedStudent.rollNumber || selectedStudent.student_id;
        standard = selectedStudent.standard || item.standard;
      }
    }

    if (!studentName) {
      toast.error('Please select or specify a student recipient');
      return;
    }

    try {
      await inventoryService.createDelivery({
        student_id: handoverForm.studentId || null,
        inventory_item_id: item.id,
        handed_over_by: handoverForm.handedOverBy || user?.name || 'Academic Staff',
        handed_over_to: studentName,
        student_roll_no: rollNo || 'N/A',
        standard: standard,
        quantity: Number(handoverForm.quantity) || 1,
        status: handoverForm.status,
        remarks: handoverForm.remarks
      });

      toast.success(`Handover recorded! Handed over to ${studentName}.`);
      setHandoverModalOpen(false);
      loadData();
    } catch (err) {
      toast.error('Failed to record handover');
    }
  };

  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItemForRestock) return;
    try {
      await inventoryService.restockItem(selectedItemForRestock.id, Number(restockQty));
      toast.success(`Added +${restockQty} copies to "${selectedItemForRestock.title}"!`);
      setRestockModalOpen(false);
      loadData();
    } catch (err) {
      toast.error('Failed to restock item');
    }
  };

  const handleAddNewBook = async (e) => {
    e.preventDefault();
    try {
      await inventoryService.createItem({
        title: newBook.title,
        category: newBook.category || 'Theory',
        subject: newBook.subject,
        standard: newBook.standard,
        in_stock: Number(newBook.inStock),
        total_stock: Number(newBook.inStock),
        reorder_level: Number(newBook.reorderLevel),
        unit_cost: Number(newBook.unitCost)
      });
      toast.success(`"${newBook.title}" added to inventory catalog!`);
      setAddStockModalOpen(false);
      setNewBook({
        title: '',
        category: 'Theory',
        subject: 'Physics',
        standard: '12th pcm tarabai park',
        inStock: 50,
        reorderLevel: 15,
        unitCost: 400
      });
      loadData();
    } catch (err) {
      toast.error('Failed to add book module');
    }
  };

  const handleMarkHandoverComplete = async (deliveryId, studentName) => {
    try {
      await inventoryService.updateDeliveryStatus(
        deliveryId,
        'Handed Over',
        user?.name || user?.full_name || 'Academic Staff',
        'Handover confirmed upon student pickup'
      );
      toast.success(`Handover confirmed for ${studentName}!`);
      loadData();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  // KPI calculations
  const totalAvailableStock = stock.reduce((sum, item) => sum + (Number(item.inStock) || 0), 0);
  const totalHandedOverCopies = deliveries.reduce((sum, del) => del.status === 'Handed Over' || del.status === 'Delivered' ? sum + (Number(del.quantity) || 1) : sum, 0);
  const lowStockCount = stock.filter(item => Number(item.inStock) <= Number(item.reorderLevel)).length;
  const totalModulesCount = stock.length;

  // Filtered stock list
  const filteredStock = stock.filter(item => {
    const matchesSearch =
      (item.title && item.title.toLowerCase().includes(searchStock.toLowerCase())) ||
      (item.subject && item.subject.toLowerCase().includes(searchStock.toLowerCase())) ||
      (item.id && item.id.toLowerCase().includes(searchStock.toLowerCase()));

    const matchesStream = selectedStockStream === 'All' || item.standard === selectedStockStream;

    let matchesStatus = true;
    if (selectedStockStatus === 'Low Stock') {
      matchesStatus = Number(item.inStock) <= Number(item.reorderLevel);
    } else if (selectedStockStatus === 'In Stock') {
      matchesStatus = Number(item.inStock) > Number(item.reorderLevel);
    } else if (selectedStockStatus === 'Out of Stock') {
      matchesStatus = Number(item.inStock) === 0;
    }

    return matchesSearch && matchesStream && matchesStatus;
  });

  // Filtered deliveries list
  const filteredDeliveries = deliveries.filter(del => {
    const q = searchHandover.toLowerCase();
    const matchesSearch =
      (del.bookTitle && del.bookTitle.toLowerCase().includes(q)) ||
      (del.studentName && del.studentName.toLowerCase().includes(q)) ||
      (del.handedOverTo && del.handedOverTo.toLowerCase().includes(q)) ||
      (del.rollNumber && del.rollNumber.toLowerCase().includes(q)) ||
      (del.handedOverBy && del.handedOverBy.toLowerCase().includes(q));

    const matchesStatus = selectedHandoverStatus === 'All' || del.status === selectedHandoverStatus;

    const matchesFaculty =
      selectedHandoverFaculty === 'All' ||
      (del.handedOverBy && del.handedOverBy.toLowerCase().includes(selectedHandoverFaculty.toLowerCase()));

    return matchesSearch && matchesStatus && matchesFaculty;
  });

  return (
    <div className="d-flex flex-column gap-3 w-100 pb-4">
      {/* 1. Header & Primary Action Buttons */}
      <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3 pt-1">
        <div style={{ minWidth: 0 }}>
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <h2 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4" style={{ letterSpacing: '-0.2px' }}>
              Notes Stock & Handover Tracking
            </h2>
            <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-0.5 rounded-pill fw-semibold" style={{ fontSize: '11px' }}>
              Inventory & Distribution
            </span>
          </div>
          <span className="small text-sa-muted mt-1 d-block" style={{ fontSize: '12.5px' }}>
            Monitor physical stock levels, who handed over notes, and to which students materials were distributed
          </span>
        </div>

        <div className="d-flex align-items-center gap-2 flex-nowrap flex-shrink-0">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary bg-white d-inline-flex align-items-center justify-content-center gap-1.5 px-3 py-1.5 fw-semibold shadow-xs text-nowrap"
            style={{ borderRadius: '8px', fontSize: '13px', height: '36px', whiteSpace: 'nowrap' }}
            onClick={loadData}
            title="Reload latest inventory counts"
          >
            <RefreshCw size={14} className="flex-shrink-0" />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            className="btn btn-sm btn-outline-secondary bg-white d-inline-flex align-items-center justify-content-center gap-1.5 px-3 py-1.5 fw-semibold shadow-xs text-nowrap"
            style={{ borderRadius: '8px', fontSize: '13px', height: '36px', whiteSpace: 'nowrap' }}
            onClick={() => setAddStockModalOpen(true)}
          >
            <Plus size={14} className="flex-shrink-0" />
            <span>Add New Module</span>
          </button>

          <button
            type="button"
            className="btn btn-sm text-white d-inline-flex align-items-center justify-content-center gap-1.5 px-3.5 py-1.5 fw-semibold shadow-xs text-nowrap"
            style={{ backgroundColor: '#8B1216', borderColor: '#8B1216', borderRadius: '8px', fontSize: '13px', height: '36px', whiteSpace: 'nowrap' }}
            onClick={() => openHandoverModal()}
          >
            <Send size={14} className="flex-shrink-0" />
            <span>Log Handover</span>
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
                  Available Stock of Notes
                </span>
                <div className="rounded-circle p-1.5 bg-primary-subtle text-primary">
                  <Package size={17} />
                </div>
              </div>
              <div className="d-flex align-items-baseline gap-2">
                <h3 className="fs-3 fw-extrabold text-sa-charcoal mb-0">
                  {totalAvailableStock}
                </h3>
                <span className="small text-muted fw-semibold" style={{ fontSize: '12px' }}>Total Copies</span>
              </div>
            </div>
            <div className="mt-2 small text-primary d-flex align-items-center gap-1" style={{ fontSize: '11.5px' }}>
              <CheckCircle2 size={13} /> Stored across academy lockers
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="sa-card p-3 h-100 border-start border-4 border-success d-flex flex-column justify-content-between">
            <div>
              <div className="d-flex align-items-center justify-content-between mb-1.5">
                <span className="text-sa-muted small fw-bold text-uppercase tracking-wider" style={{ fontSize: '11px' }}>
                  Handed Over to Students
                </span>
                <div className="rounded-circle p-1.5 bg-success-subtle text-success">
                  <UserCheck size={17} />
                </div>
              </div>
              <div className="d-flex align-items-baseline gap-2">
                <h3 className="fs-3 fw-extrabold text-sa-charcoal mb-0">
                  {totalHandedOverCopies}
                </h3>
                <span className="small text-muted fw-semibold" style={{ fontSize: '12px' }}>Disbursed Copies</span>
              </div>
            </div>
            <div className="mt-2 small text-primary d-flex align-items-center gap-1" style={{ fontSize: '11.5px' }}>
              <FileCheck2 size={13} /> Recorded in handover audit
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="sa-card p-3 h-100 border-start border-4 border-info d-flex flex-column justify-content-between">
            <div>
              <div className="d-flex align-items-center justify-content-between mb-1.5">
                <span className="text-sa-muted small fw-bold text-uppercase tracking-wider" style={{ fontSize: '11px' }}>
                  Printed Note Modules
                </span>
                <div className="rounded-circle p-1.5 bg-info-subtle text-info">
                  <Layers size={17} />
                </div>
              </div>
              <div className="d-flex align-items-baseline gap-2">
                <h3 className="fs-3 fw-extrabold text-sa-charcoal mb-0">
                  {totalModulesCount}
                </h3>
                <span className="small text-muted fw-semibold" style={{ fontSize: '12px' }}>Active Titles</span>
              </div>
            </div>
            <div className="mt-2 small text-muted" style={{ fontSize: '11.5px' }}>
              Physics, Chem, Maths & Bio
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className={`sa-card p-3 h-100 border-start border-4 ${lowStockCount > 0 ? 'border-danger' : 'border-secondary'} d-flex flex-column justify-content-between`}>
            <div>
              <div className="d-flex align-items-center justify-content-between mb-1.5">
                <span className="text-sa-muted small fw-bold text-uppercase tracking-wider" style={{ fontSize: '11px' }}>
                  Reorder Threshold Alerts
                </span>
                <div className={`rounded-circle p-1.5 ${lowStockCount > 0 ? 'bg-danger-subtle text-danger' : 'bg-light text-muted'}`}>
                  <AlertTriangle size={17} />
                </div>
              </div>
              <div className="d-flex align-items-baseline gap-2">
                <h3 className={`fs-3 fw-extrabold mb-0 ${lowStockCount > 0 ? 'text-danger' : 'text-sa-charcoal'}`}>
                  {lowStockCount}
                </h3>
                <span className="small text-muted fw-semibold" style={{ fontSize: '12px' }}>Low Stock Titles</span>
              </div>
            </div>
            <div className="mt-2 small text-danger d-flex align-items-center gap-1" style={{ fontSize: '11.5px' }}>
              {lowStockCount > 0 ? (
                <>
                  <TrendingDown size={13} /> Needs reprint order
                </>
              ) : (
                <span className="text-success d-flex align-items-center gap-1">
                  <CheckCircle2 size={13} /> All stock levels healthy
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Content Container (Tabs + Filter Bar + Table) */}
      <div className="sa-card p-3 p-md-4">
        {/* Modern Segmented Tab Switcher */}
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 pb-3 mb-3 border-bottom">
          <div className="d-inline-flex p-1 bg-light rounded-3 border" style={{ backgroundColor: '#F8FAFC' }}>
            <button
              type="button"
              onClick={() => setActiveTab('stock')}
              className={`btn btn-sm d-flex align-items-center gap-2 px-3 py-1.5 rounded-2 fw-semibold transition-all border-0 ${
                activeTab === 'stock'
                  ? 'bg-white shadow-xs'
                  : 'text-secondary hover-bg-light'
              }`}
              style={{
                color: activeTab === 'stock' ? '#8B1216' : '#64748B',
                boxShadow: activeTab === 'stock' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              <Package size={15} />
              <span>Available Notes Stock</span>
              <span className={`badge rounded-pill ${activeTab === 'stock' ? 'bg-danger-subtle text-danger' : 'bg-secondary-subtle text-secondary'}`} style={{ fontSize: '11px' }}>
                {stock.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('handovers')}
              className={`btn btn-sm d-flex align-items-center gap-2 px-3 py-1.5 rounded-2 fw-semibold transition-all border-0 ${
                activeTab === 'handovers'
                  ? 'bg-white shadow-xs'
                  : 'text-secondary hover-bg-light'
              }`}
              style={{
                color: activeTab === 'handovers' ? '#8B1216' : '#64748B',
                boxShadow: activeTab === 'handovers' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              <UserCheck size={15} />
              <span>Handover Tracking Register</span>
              <span className={`badge rounded-pill ${activeTab === 'handovers' ? 'bg-danger-subtle text-danger' : 'bg-secondary-subtle text-secondary'}`} style={{ fontSize: '11px' }}>
                {deliveries.length}
              </span>
            </button>
          </div>

          <span className="small text-muted fw-semibold">
            {activeTab === 'stock'
              ? `Showing ${filteredStock.length} of ${stock.length} catalog items`
              : `Showing ${filteredDeliveries.length} handover transactions`}
          </span>
        </div>

        {/* Tab 1: Available Notes Stock */}
        {activeTab === 'stock' && (
          <div className="d-flex flex-column gap-3">
            {/* Filter Bar with Matching Heights */}
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2.5">
              <div className="d-flex flex-wrap align-items-center gap-2 flex-grow-1" style={{ maxWidth: '850px' }}>
                <div className="input-group" style={{ minWidth: '240px', flex: '1 1 240px', height: '36px' }}>
                  <span className="input-group-text bg-white border-end-0 text-muted py-0 d-flex align-items-center">
                    <Search size={15} />
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0 ps-0 text-sm"
                    style={{ height: '36px', fontSize: '13px' }}
                    placeholder="Search package title, subject, or code..."
                    value={searchStock}
                    onChange={(e) => setSearchStock(e.target.value)}
                  />
                </div>

                <select
                  className="form-select form-select-sm"
                  style={{ width: 'auto', minWidth: '190px', height: '36px', fontSize: '13px' }}
                  value={selectedStockStream}
                  onChange={(e) => setSelectedStockStream(e.target.value)}
                >
                  <option value="All">All Streams & Centers</option>
                  <option value="12th pcm tarabai park">12th PCM Tarabai Park</option>
                  <option value="12th pcb tarabai park">12th PCB Tarabai Park</option>
                  <option value="12th pcmb tarabai park">12th PCMB Tarabai Park</option>
                  <option value="11th pcm tarabai park">11th PCM Tarabai Park</option>
                  <option value="11th pcmb tarabai park">11th PCMB Tarabai Park</option>
                  <option value="12th pcm Mangalvar peth">12th PCM Mangalwar Peth</option>
                  <option value="12th pcb Mangalvar peth">12th PCB Mangalwar Peth</option>
                </select>

                <select
                  className="form-select form-select-sm"
                  style={{ width: 'auto', minWidth: '150px', height: '36px', fontSize: '13px' }}
                  value={selectedStockStatus}
                  onChange={(e) => setSelectedStockStatus(e.target.value)}
                >
                  <option value="All">All Stock Levels</option>
                  <option value="In Stock">In Stock Healthy</option>
                  <option value="Low Stock">Low Stock Alert</option>
                  <option value="Out of Stock">Out of Stock</option>
                </select>
              </div>

              <button
                type="button"
                className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1.5 px-3 py-1.5 fw-semibold shadow-xs"
                style={{ borderRadius: '8px', fontSize: '13px', height: '36px' }}
                onClick={() => setAddStockModalOpen(true)}
              >
                <Plus size={14} />
                <span>New Notes Title</span>
              </button>
            </div>

            {/* Notes Stock Table */}
            <Table
              columns={[
                {
                  key: 'id',
                  title: 'SKU / ID',
                  width: '85px',
                  render: (val) => (
                    <span className="badge bg-light text-dark border font-monospace px-1.5 py-0.5 text-nowrap" style={{ fontSize: '11px' }}>
                      #{val ? val.slice(-5).toUpperCase() : 'BK-01'}
                    </span>
                  )
                },
                {
                  key: 'title',
                  title: 'Notes Package',
                  render: (val, row) => (
                    <div className="py-0.5">
                      <div className="fw-bold text-sa-charcoal d-flex align-items-center gap-1.5" style={{ fontSize: '13.5px', lineHeight: 1.25 }}>
                        <BookMarked size={16} className="text-sa-primary flex-shrink-0" />
                        <span>{val}</span>
                      </div>
                      <div className="d-flex align-items-center gap-2 mt-1 text-muted" style={{ fontSize: '11px' }}>
                        <span className="badge bg-light text-secondary border px-1.5 py-0">{row.subject || 'General'}</span>
                        <span>•</span>
                        <span>Unit: ₹{row.unitCost || 350}</span>
                      </div>
                    </div>
                  )
                },
                {
                  key: 'standard',
                  title: 'Class Stream',
                  width: '180px',
                  render: (val) => (
                    <span className="badge bg-light text-sa-charcoal border text-uppercase px-2 py-1 text-nowrap" style={{ fontSize: '11px' }}>
                      {val || 'General Stream'}
                    </span>
                  )
                },
                {
                  key: 'inStock',
                  title: 'Available Stock',
                  width: '180px',
                  render: (val, row) => {
                    const isLow = Number(val) <= Number(row.reorderLevel);
                    const isOut = Number(val) === 0;
                    const total = Number(row.totalStock) || Number(val) || 1;
                    const percentage = Math.min(100, Math.round((Number(val) / total) * 100));

                    return (
                      <div style={{ width: '150px' }}>
                        <div className="d-flex align-items-center justify-content-between gap-1 mb-1">
                          <span className={`fw-bold small ${isOut ? 'text-danger' : isLow ? 'text-warning-emphasis' : 'text-success'}`}>
                            {val} Copies
                          </span>
                          <span className={`badge px-1.5 py-0.5 small ${isOut ? 'bg-danger text-white' : isLow ? 'bg-danger-subtle text-danger border border-danger-subtle' : 'bg-success-subtle text-success border border-success-subtle'}`} style={{ fontSize: '10px' }}>
                            {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                          </span>
                        </div>
                        <div className="progress" style={{ height: '4px' }}>
                          <div
                            className={`progress-bar ${isOut ? 'bg-danger' : isLow ? 'bg-warning' : 'bg-success'}`}
                            role="progressbar"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-muted d-block mt-0.5 text-nowrap" style={{ fontSize: '10px' }}>
                          {val} of {total} printed copies left
                        </span>
                      </div>
                    );
                  }
                },
                {
                  key: 'reorderLevel',
                  title: 'Reorder Level',
                  width: '110px',
                  render: (val) => (
                    <span className="small text-muted fw-semibold text-nowrap">
                      {val} Copies
                    </span>
                  )
                },
                {
                  key: 'id',
                  title: 'Actions',
                  align: 'end',
                  width: '180px',
                  render: (val, row) => (
                    <div className="d-flex gap-1.5 justify-content-end align-items-center text-nowrap">
                      <button
                        type="button"
                        className="btn btn-sm btn-light border px-2 py-1 small d-inline-flex align-items-center gap-1 text-secondary text-nowrap"
                        style={{ borderRadius: '6px', fontSize: '12px' }}
                        onClick={() => openRestockModal(row)}
                        title="Add more printed copies"
                      >
                        <Plus size={13} /> Restock
                      </button>

                      <button
                        type="button"
                        className="btn btn-sm text-white px-2.5 py-1 small d-inline-flex align-items-center gap-1 text-nowrap"
                        style={{ backgroundColor: '#8B1216', borderColor: '#8B1216', borderRadius: '6px', fontSize: '12px' }}
                        onClick={() => openHandoverModal(row.id)}
                        disabled={Number(row.inStock) === 0}
                        title={Number(row.inStock) === 0 ? 'Out of stock' : 'Hand over copies to student'}
                      >
                        <Send size={13} /> Hand Over
                      </button>
                    </div>
                  )
                }
              ]}
              data={filteredStock}
              loading={loading}
            />
          </div>
        )}

        {/* Tab 2: Handover Tracking Register */}
        {activeTab === 'handovers' && (
          <div className="d-flex flex-column gap-3">
            {/* Filter Bar with Matching Heights */}
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2.5">
              <div className="d-flex flex-wrap align-items-center gap-2 flex-grow-1" style={{ maxWidth: '850px' }}>
                <div className="input-group" style={{ minWidth: '240px', flex: '1 1 240px', height: '36px' }}>
                  <span className="input-group-text bg-white border-end-0 text-muted py-0 d-flex align-items-center">
                    <Search size={15} />
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0 ps-0 text-sm"
                    style={{ height: '36px', fontSize: '13px' }}
                    placeholder="Search by student, faculty (who handed over), or module..."
                    value={searchHandover}
                    onChange={(e) => setSearchHandover(e.target.value)}
                  />
                </div>

                <select
                  className="form-select form-select-sm"
                  style={{ width: 'auto', minWidth: '190px', height: '36px', fontSize: '13px' }}
                  value={selectedHandoverFaculty}
                  onChange={(e) => setSelectedHandoverFaculty(e.target.value)}
                >
                  <option value="All">All Faculty & Staff</option>
                  <option value="Priya Kulkarni">Dr. Priya Kulkarni</option>
                  <option value="Shubham">Prof. Shubham Sharma</option>
                  <option value="Rajesh Patil">Prof. Rajesh Patil</option>
                  <option value="Sneha Deshmukh">Dr. Sneha Deshmukh</option>
                </select>

                <select
                  className="form-select form-select-sm"
                  style={{ width: 'auto', minWidth: '150px', height: '36px', fontSize: '13px' }}
                  value={selectedHandoverStatus}
                  onChange={(e) => setSelectedHandoverStatus(e.target.value)}
                >
                  <option value="All">All Statuses</option>
                  <option value="Handed Over">Handed Over</option>
                  <option value="Pending Pickup">Pending Pickup</option>
                </select>
              </div>

              <button
                type="button"
                className="btn btn-sm text-white px-3 py-1.5 fw-bold d-inline-flex align-items-center gap-1.5 text-nowrap"
                style={{ backgroundColor: '#8B1216', borderRadius: '8px', fontSize: '13px', height: '36px' }}
                onClick={() => openHandoverModal()}
              >
                <Send size={14} />
                <span>Log New Handover</span>
              </button>
            </div>

            {/* Handover Tracking Register Table */}
            <Table
              columns={[
                {
                  key: 'id',
                  title: 'Tracking ID',
                  width: '95px',
                  render: (val) => (
                    <span className="badge bg-light text-dark border font-monospace px-1.5 py-0.5 text-nowrap" style={{ fontSize: '11px' }}>
                      #{val ? val.slice(-6).toUpperCase() : 'HO-001'}
                    </span>
                  )
                },
                {
                  key: 'bookTitle',
                  title: 'Notes Package',
                  minWidth: '220px',
                  render: (val, row) => (
                    <div>
                      <div className="fw-bold text-sa-charcoal d-flex align-items-center gap-1.5" style={{ fontSize: '13px' }}>
                        <BookMarked size={15} className="text-sa-primary flex-shrink-0" />
                        <span>{val}</span>
                      </div>
                      <div className="d-flex align-items-center gap-1.5 mt-0.5 text-muted text-nowrap" style={{ fontSize: '11px' }}>
                        <span>Qty: {row.quantity || 1} copy</span>
                        <span>•</span>
                        <span>Stock left: {row.availableStock !== undefined ? `${row.availableStock} copies` : 'In Stock'}</span>
                      </div>
                    </div>
                  )
                },
                {
                  key: 'handedOverBy',
                  title: 'Who Handed Them Over',
                  width: '210px',
                  render: (val) => (
                    <div className="d-flex align-items-center gap-2 text-nowrap">
                      <div className="rounded-circle bg-danger-subtle text-danger p-1 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 26, height: 26 }}>
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
                  title: 'To Whom Handed Over (Student)',
                  width: '200px',
                  render: (val, row) => (
                    <div className="d-flex align-items-center gap-2 text-nowrap">
                      <div className="rounded-circle bg-primary-subtle text-primary p-1 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 26, height: 26 }}>
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
                  title: 'Handover Timestamp',
                  width: '160px',
                  render: (val) => (
                    <span className="small text-sa-charcoal fw-semibold text-nowrap" style={{ fontSize: '12px' }}>
                      {val || '--'}
                    </span>
                  )
                },
                {
                  key: 'status',
                  title: 'Status',
                  width: '120px',
                  render: (val) => (
                    <span className={`badge px-2 py-0.5 small d-inline-flex align-items-center gap-1 text-nowrap ${
                      val === 'Handed Over' || val === 'Delivered'
                        ? 'bg-success-subtle text-success border border-success-subtle'
                        : 'bg-warning-subtle text-warning-emphasis border border-warning-subtle'
                    }`} style={{ fontSize: '10.5px' }}>
                      {val === 'Handed Over' || val === 'Delivered' ? (
                        <>
                          <CheckCircle2 size={11} /> Handed Over
                        </>
                      ) : (
                        <>
                          <Clock size={11} /> Pending Pickup
                        </>
                      )}
                    </span>
                  )
                },
                {
                  key: 'id',
                  title: 'Action',
                  align: 'end',
                  width: '150px',
                  render: (val, row) => (
                    <div className="d-flex gap-1.5 justify-content-end align-items-center text-nowrap">
                      <button
                        type="button"
                        className="btn btn-sm btn-light border px-2 py-1 text-primary d-inline-flex align-items-center gap-1 small text-nowrap"
                        style={{ borderRadius: '6px', fontSize: '12px' }}
                        onClick={() => {
                          setViewingVoucher(row);
                          setVoucherModalOpen(true);
                        }}
                        title="Print / View Handover Voucher"
                      >
                        <Printer size={12} /> Voucher
                      </button>

                      {row.status === 'Pending Pickup' && (
                        <button
                          type="button"
                          className="btn btn-sm btn-primary px-2 py-1 small text-nowrap"
                          style={{ borderRadius: '6px', fontSize: '12px' }}
                          onClick={() => handleMarkHandoverComplete(val, row.studentName || row.handedOverTo)}
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
        )}
      </div>

      {/* 4. Modal: Record Notes Handover to Student */}
      <Modal
        isOpen={handoverModalOpen}
        onClose={() => setHandoverModalOpen(false)}
        title="Distribute & Hand Over Notes to Student"
      >
        <form onSubmit={handleHandoverSubmit} className="d-flex flex-column gap-3">
          <div>
            <label className="form-label small fw-bold">Select Material Package *</label>
            <select
              className="form-select"
              value={handoverForm.inventoryItemId}
              onChange={(e) => setHandoverForm({ ...handoverForm, inventoryItemId: e.target.value })}
              required
            >
              <option value="">-- Choose Module --</option>
              {stock.map(item => (
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
              value={handoverForm.studentId}
              onChange={(e) => setHandoverForm({ ...handoverForm, studentId: e.target.value })}
            >
              <option value="">-- Choose Student from Directory --</option>
              {students.map(s => (
                <option key={s.id || s._id} value={s.id || s._id}>
                  {s.name} ({s.rollNumber || s.student_id || 'N/A'}) - {s.standard || '12th'}
                </option>
              ))}
            </select>
            <div className="small text-muted mt-1">Or write manual recipient name if not in directory:</div>
          </div>

          {!handoverForm.studentId && (
            <div className="row g-2">
              <div className="col-7">
                <Input
                  label="Student Full Name"
                  name="manualStudentName"
                  value={handoverForm.manualStudentName}
                  onChange={(e) => setHandoverForm({ ...handoverForm, manualStudentName: e.target.value })}
                  placeholder="e.g. Atharva Kulkarni"
                />
              </div>
              <div className="col-5">
                <Input
                  label="Roll / ID Number"
                  name="manualRollNo"
                  value={handoverForm.manualRollNo}
                  onChange={(e) => setHandoverForm({ ...handoverForm, manualRollNo: e.target.value })}
                  placeholder="e.g. STU-2026-088"
                />
              </div>
            </div>
          )}

          <div className="row g-2">
            <div className="col-8">
              <label className="form-label small fw-bold">Who Handed Them Over (Faculty / Staff Name) *</label>
              <input
                type="text"
                className="form-control"
                value={handoverForm.handedOverBy}
                onChange={(e) => setHandoverForm({ ...handoverForm, handedOverBy: e.target.value })}
                placeholder="Staff / Teacher Name"
                required
              />
            </div>
            <div className="col-4">
              <Input
                label="Copies"
                name="quantity"
                type="number"
                min="1"
                value={handoverForm.quantity}
                onChange={(e) => setHandoverForm({ ...handoverForm, quantity: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="row g-2">
            <div className="col-6">
              <label className="form-label small fw-bold">Handover Status</label>
              <select
                className="form-select"
                value={handoverForm.status}
                onChange={(e) => setHandoverForm({ ...handoverForm, status: e.target.value })}
              >
                <option value="Handed Over">Handed Over (Physical Distribution)</option>
                <option value="Pending Pickup">Pending Pickup at Desk</option>
              </select>
            </div>
            <div className="col-6">
              <Input
                label="Remarks / Verification"
                name="remarks"
                value={handoverForm.remarks}
                onChange={(e) => setHandoverForm({ ...handoverForm, remarks: e.target.value })}
                placeholder="e.g. RFID scanned, signed slip"
              />
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            <Button variant="light" onClick={() => setHandoverModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" icon={Send}>Record Handover</Button>
          </div>
        </form>
      </Modal>

      {/* 5. Modal: Quick Restock Copies */}
      {selectedItemForRestock && (
        <Modal
          isOpen={restockModalOpen}
          onClose={() => setRestockModalOpen(false)}
          title={`Restock Printed Copies: ${selectedItemForRestock.title}`}
        >
          <form onSubmit={handleRestockSubmit} className="d-flex flex-column gap-3">
            <div className="p-3 bg-light rounded-3 border">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="small text-muted fw-bold">Current Stock Level:</span>
                <span className="badge bg-secondary">{selectedItemForRestock.inStock} copies available</span>
              </div>
              <div className="small text-muted">
                Class Stream: <strong>{selectedItemForRestock.standard}</strong>
              </div>
            </div>

            <div>
              <label className="form-label small fw-bold">Number of New Copies to Add *</label>
              <input
                type="number"
                className="form-control form-control-lg fw-bold"
                value={restockQty}
                onChange={(e) => setRestockQty(e.target.value)}
                min="1"
                required
              />
              <div className="d-flex gap-2 mt-2">
                {[10, 25, 50, 100].map(qty => (
                  <button
                    key={qty}
                    type="button"
                    className="btn btn-sm btn-outline-secondary flex-grow-1"
                    onClick={() => setRestockQty(qty)}
                  >
                    +{qty}
                  </button>
                ))}
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
              <Button variant="light" onClick={() => setRestockModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary">Confirm Restock</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* 6. Modal: Add New Note Module to Catalog */}
      <Modal
        isOpen={addStockModalOpen}
        onClose={() => setAddStockModalOpen(false)}
        title="Add New Study Notes Module"
      >
        <form onSubmit={handleAddNewBook} className="d-flex flex-column gap-3">
          <Input
            label="Module / Book Title"
            name="title"
            value={newBook.title}
            onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
            placeholder="e.g. Modern Physics Numerical Formula Guide"
            required
          />

          <div className="row g-2">
            <div className="col-6">
              <Select
                label="Subject"
                name="subject"
                value={newBook.subject}
                onChange={(e) => setNewBook({ ...newBook, subject: e.target.value })}
                options={['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Foundation']}
              />
            </div>
            <div className="col-6">
              <Input
                label="Cost per Unit (₹)"
                name="unitCost"
                type="number"
                value={newBook.unitCost}
                onChange={(e) => setNewBook({ ...newBook, unitCost: e.target.value })}
                required
              />
            </div>
          </div>

          <Select
            label="Target Class Stream"
            name="standard"
            value={newBook.standard}
            onChange={(e) => setNewBook({ ...newBook, standard: e.target.value })}
            options={[
              '11th & 12th Science',
              '11th pcm tarabai park',
              '11th pcb tarabai park',
              '11th pcmb tarabai park',
              '12th pcm tarabai park',
              '12th pcb tarabai park',
              '12th pcmb tarabai park',
              '11th pcm Mangalvar peth',
              '11th pcb Mangalvar peth',
              '12th pcm Mangalvar peth'
            ]}
          />

          <div className="row g-2">
            <div className="col-6">
              <Input
                label="Initial Printed Stock Quantity"
                name="inStock"
                type="number"
                value={newBook.inStock}
                onChange={(e) => setNewBook({ ...newBook, inStock: e.target.value })}
                required
                min="1"
              />
            </div>
            <div className="col-6">
              <Input
                label="Low Stock Alert Threshold"
                name="reorderLevel"
                type="number"
                value={newBook.reorderLevel}
                onChange={(e) => setNewBook({ ...newBook, reorderLevel: e.target.value })}
                required
                min="1"
              />
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            <Button variant="light" onClick={() => setAddStockModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Register Module in Inventory</Button>
          </div>
        </form>
      </Modal>

      {/* 7. Modal: Official Printable Handover Voucher */}
      <Modal
        isOpen={voucherModalOpen}
        onClose={() => setVoucherModalOpen(false)}
        title="Official Notes Handover Voucher"
      >
        {viewingVoucher && (
          <div className="d-flex flex-column gap-3">
            <div className="p-4 bg-white border rounded-3" id="printable-voucher">
              <div className="text-center pb-3 border-bottom border-2 border-danger">
                <h4 className="fw-extrabold text-danger m-0" style={{ letterSpacing: '0.5px' }}>
                  SHUBHAM ACADEMY
                </h4>
                <div className="small text-muted fw-bold">
                  Official Physical Study Material & Notes Handover Voucher
                </div>
              </div>

              <div className="row g-2 mt-2 py-2 border-bottom small">
                <div className="col-6">
                  <strong>Voucher Tracking ID:</strong> #{viewingVoucher.id ? viewingVoucher.id.slice(-6).toUpperCase() : 'HO-001'}
                </div>
                <div className="col-6 text-end">
                  <strong>Handover Date:</strong> {viewingVoucher.date || '--'}
                </div>
              </div>

              <table className="table table-bordered my-3 small">
                <tbody>
                  <tr>
                    <th className="bg-light" style={{ width: '35%' }}>Notes Package Title</th>
                    <td className="fw-bold text-sa-charcoal">{viewingVoucher.bookTitle}</td>
                  </tr>
                  <tr>
                    <th className="bg-light">Handed Over To (Student)</th>
                    <td className="fw-bold">{viewingVoucher.studentName || viewingVoucher.handedOverTo}</td>
                  </tr>
                  <tr>
                    <th className="bg-light">Student Roll Number</th>
                    <td className="font-monospace">{viewingVoucher.rollNumber || 'N/A'}</td>
                  </tr>
                  <tr>
                    <th className="bg-light">Who Handed Them Over</th>
                    <td className="fw-bold text-danger">{viewingVoucher.handedOverBy}</td>
                  </tr>
                  <tr>
                    <th className="bg-light">Quantity Handed Over</th>
                    <td>{viewingVoucher.quantity || 1} Printed Copy</td>
                  </tr>
                  <tr>
                    <th className="bg-light">Available Stock Remaining</th>
                    <td>{viewingVoucher.availableStock !== undefined ? `${viewingVoucher.availableStock} Copies in Stock` : 'Tracked in System'}</td>
                  </tr>
                  <tr>
                    <th className="bg-light">Handover Status</th>
                    <td>
                      <span className="badge bg-success-subtle text-success">
                        {viewingVoucher.status}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <th className="bg-light">Verification Remarks</th>
                    <td>{viewingVoucher.remarks || 'Direct distribution confirmed'}</td>
                  </tr>
                </tbody>
              </table>

              <div className="row g-4 mt-4 pt-3 border-top text-center small">
                <div className="col-6">
                  <div className="border-bottom pb-4 mb-1"></div>
                  <strong className="d-block">{viewingVoucher.handedOverBy}</strong>
                  <span className="text-muted">Faculty / Staff Signature</span>
                </div>
                <div className="col-6">
                  <div className="border-bottom pb-4 mb-1"></div>
                  <strong className="d-block">{viewingVoucher.studentName || viewingVoucher.handedOverTo}</strong>
                  <span className="text-muted">Student Acknowledgment Signature</span>
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2 border-top pt-3">
              <Button variant="light" onClick={() => setVoucherModalOpen(false)}>Close</Button>
              <Button
                variant="primary"
                icon={Printer}
                onClick={() => {
                  window.print();
                }}
              >
                Print Voucher Slip
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
