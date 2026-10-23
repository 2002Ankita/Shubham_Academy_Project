import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import BackButton from '../../components/common/BackButton';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import SearchableSelect from '../../components/common/SearchableSelect';
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
  RefreshCw,
  Truck
} from 'lucide-react';
import { toast } from 'react-toastify';
import inventoryService from '../../services/inventoryService';
import studentService from '../../services/studentService';
import teacherService from '../../services/teacherService';
import { useAuth } from '../../hooks/useAuth';
import BranchBatchSelector from '../../components/common/BranchBatchSelector';
import {
  BRANCH_TARABAI,
  BRANCH_MANGALWAR,
  matchesStudentFilters,
  formatStudentBatchDisplay
} from '../../config/branchBatchConfig';

export default function BooksStock() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab routing with URL parameter sync
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam === 'handovers' ? 'handovers' : 'stock'); // 'stock' | 'handovers'

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', newTab);
    setSearchParams(newParams, { replace: true });
  };

  useEffect(() => {
    if (tabParam === 'handovers' || tabParam === 'stock') {
      setActiveTab(tabParam);
    }
  }, [tabParam]);
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

  // Branch & Batch selection state for Handover modal
  const [handoverBranch, setHandoverBranch] = useState(BRANCH_TARABAI);
  const [handoverSession, setHandoverSession] = useState('');
  const [handoverAcademicBatch, setHandoverAcademicBatch] = useState('11th PCM');

  const eligibleHandoverStudents = React.useMemo(() => {
    return students.filter(s =>
      matchesStudentFilters(s, {
        branch: handoverBranch,
        session: handoverSession,
        academicBatch: handoverAcademicBatch
      })
    );
  }, [students, handoverBranch, handoverSession, handoverAcademicBatch]);

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
  const [restockRemarks, setRestockRemarks] = useState('');

  const [newBook, setNewBook] = useState({
    title: '',
    category: 'Theory',
    subject: 'Physics',
    standard: '11th & 12th Science',
    inStock: 50,
    reorderLevel: 15,
    unitCost: 350
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
      toast.error('Failed to load books stock data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openHandoverModal = (preselectedItemId = '') => {
    const defaultStaff = user?.name || user?.full_name || (user?.role === 'teacher' ? 'Faculty Member' : 'Academic Admin Desk');
    setHandoverBranch(BRANCH_TARABAI);
    setHandoverSession('');
    setHandoverAcademicBatch('11th PCM');
    setHandoverForm({
      inventoryItemId: preselectedItemId || (stock[0]?.id || ''),
      studentId: '', // Clean empty default so user can easily search and select
      manualStudentName: '',
      manualRollNo: '',
      quantity: 1,
      handedOverBy: defaultStaff,
      status: 'Handed Over',
      remarks: 'Direct distribution & student acknowledgment'
    });
    setHandoverModalOpen(true);
  };

  // Auto-open handover modal if URL has ?action=handover or ?action=distribute
  useEffect(() => {
    const action = searchParams.get('action');
    const pkgId = searchParams.get('packageId') || searchParams.get('itemId');
    if (action === 'handover' || action === 'distribute') {
      openHandoverModal(pkgId || '');
    }
  }, [searchParams, stock]);

  const openRestockModal = (item) => {
    setSelectedItemForRestock(item);
    setRestockQty(25);
    setRestockRemarks('');
    setRestockModalOpen(true);
  };

  const handleHandoverSubmit = async (e) => {
    e.preventDefault();
    const item = stock.find(s => s.id === handoverForm.inventoryItemId);
    if (!item) {
      toast.error('Please select a valid note package');
      return;
    }

    const qty = Number(handoverForm.quantity);
    if (isNaN(qty) || qty <= 0) {
      toast.error('Handover quantity must be greater than 0');
      return;
    }

    if (Number(item.inStock) < qty) {
      toast.error(`Not enough stock available! Only ${item.inStock} copies remaining.`);
      return;
    }

    let studentName = handoverForm.manualStudentName;
    let rollNo = handoverForm.manualRollNo;
    let standard = item.standard;
    let branch = handoverBranch;
    let academicBatch = handoverAcademicBatch;
    let session = handoverSession;
    let batch = `${handoverAcademicBatch} ${handoverBranch}`;

    if (handoverForm.studentId) {
      const selectedStudent = students.find(s => String(s.id || s._id || s.student_id) === String(handoverForm.studentId));
      if (selectedStudent) {
        studentName = selectedStudent.name;
        rollNo = selectedStudent.rollNumber || selectedStudent.student_id;
        standard = selectedStudent.standard || item.standard;
        branch = selectedStudent.branch || branch;
        academicBatch = selectedStudent.academic_batch || selectedStudent.academicBatch || academicBatch;
        session = selectedStudent.session || session;
        batch = selectedStudent.batch || batch;
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
        handed_over_by: handoverForm.handedOverBy || user?.name || user?.full_name || 'Academic Staff',
        handed_over_to: studentName,
        student_roll_no: rollNo || 'N/A',
        standard: standard,
        branch: branch,
        academic_batch: academicBatch,
        session: session,
        batch: batch,
        quantity: qty,
        status: handoverForm.status,
        remarks: handoverForm.remarks
      });

      toast.success(`Handover recorded! Handed over ${qty} ${qty > 1 ? 'copies' : 'copy'} to ${studentName}.`);
      setHandoverModalOpen(false);
      await loadData();
      // Redirect / route directly to Handovers tab so the user sees the newly logged record
      handleTabChange('handovers');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to record handover';
      toast.error(msg);
    }
  };

  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItemForRestock) return;
    const qty = Number(restockQty);
    if (isNaN(qty) || qty <= 0) {
      toast.error('Restock quantity must be greater than 0');
      return;
    }
    try {
      await inventoryService.restockItem(selectedItemForRestock.id, qty, restockRemarks);
      toast.success(`Added +${qty} copies to "${selectedItemForRestock.title}"!`);
      setRestockModalOpen(false);
      await loadData();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to restock item';
      toast.error(msg);
    }
  };

  const handleAddNewBook = async (e) => {
    e.preventDefault();
    if (!newBook.title.trim()) {
      toast.error('Please enter a book/package title');
      return;
    }
    const inStock = Number(newBook.inStock);
    if (isNaN(inStock) || inStock < 0) {
      toast.error('Initial stock must be a non-negative number');
      return;
    }
    const reorderLevel = Number(newBook.reorderLevel);
    if (isNaN(reorderLevel) || reorderLevel < 0) {
      toast.error('Reorder level must be a non-negative number');
      return;
    }
    const unitCost = Number(newBook.unitCost);
    if (isNaN(unitCost) || unitCost < 0) {
      toast.error('Unit cost must be a non-negative number');
      return;
    }

    try {
      await inventoryService.createItem({
        title: newBook.title.trim(),
        category: newBook.category || 'Theory',
        subject: newBook.subject,
        standard: newBook.standard,
        in_stock: inStock,
        total_stock: inStock,
        reorder_level: reorderLevel,
        unit_cost: unitCost
      });
      toast.success(`"${newBook.title.trim()}" added to inventory catalog!`);
      setAddStockModalOpen(false);
      setNewBook({
        title: '',
        category: 'Theory',
        subject: 'Physics',
        standard: '11th & 12th Science',
        inStock: 50,
        reorderLevel: 15,
        unitCost: 350
      });
      await loadData();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to add book module';
      toast.error(msg);
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
      await loadData();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to update status';
      toast.error(msg);
    }
  };

  // KPI calculations
  const totalAvailableStock = stock.reduce((sum, item) => sum + (Number(item.inStock) || 0), 0);
  const totalHandedOverCopies = deliveries.reduce((sum, del) => (del.status === 'Handed Over' || del.status === 'Delivered') ? sum + (Number(del.quantity) || 1) : sum, 0);
  const lowStockCount = stock.filter(item => Number(item.inStock) <= Number(item.reorderLevel)).length;
  const totalModulesCount = stock.length;

  // Dynamic streams extracted from stock catalog + standard academy options
  const streamOptions = Array.from(
    new Set([
      '11th & 12th Science',
      '12th pcm tarabai park',
      '12th pcb tarabai park',
      '12th pcmb tarabai park',
      '11th pcm tarabai park',
      '11th pcb tarabai park',
      '11th pcmb tarabai park',
      '12th pcm Mangalvar peth',
      '12th pcb Mangalvar peth',
      ...stock.map(s => s.standard).filter(Boolean)
    ])
  );

  // Filtered stock list
  const filteredStock = stock.filter(item => {
    const q = searchStock.trim().toLowerCase();
    const matchesSearch = !q ||
      (item.title && item.title.toLowerCase().includes(q)) ||
      (item.subject && item.subject.toLowerCase().includes(q)) ||
      (item.standard && item.standard.toLowerCase().includes(q)) ||
      (item.id && item.id.toLowerCase().includes(q));

    const matchesStream = selectedStockStream === 'All' || 
      (item.standard && item.standard.toLowerCase() === selectedStockStream.toLowerCase());

    let matchesStatus = true;
    const currentStock = Number(item.inStock) || 0;
    const reorderLvl = Number(item.reorderLevel) || 0;

    if (selectedStockStatus === 'Low Stock') {
      matchesStatus = currentStock > 0 && currentStock <= reorderLvl;
    } else if (selectedStockStatus === 'In Stock') {
      matchesStatus = currentStock > reorderLvl;
    } else if (selectedStockStatus === 'Out of Stock') {
      matchesStatus = currentStock === 0;
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
    <div className="d-flex flex-column gap-3.5 w-100 pb-4">
      {/* 1. Header & Primary Action Buttons */}
      <div className="mb-1">
        <BackButton
          to={user?.role === 'teacher' ? '/teacher/notes' : '/admin/notes'}
          label="Back to Notes"
          className="mb-2"
        />
        <div className="d-flex flex-column flex-lg-row align-items-lg-start justify-content-between gap-3 pt-0.5">
          <div style={{ minWidth: 0 }}>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <h2 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4" style={{ letterSpacing: '-0.2px', lineHeight: 1.25 }}>
                Books Stock & Handover Tracking
              </h2>
              <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-0.5 rounded-pill fw-semibold" style={{ fontSize: '11px' }}>
                Inventory & Distribution
              </span>
            </div>
            <span className="small text-sa-muted mt-1.5 d-block" style={{ fontSize: '13px' }}>
              Monitor physical stock levels, who handed over books, and to which students materials were distributed
            </span>
          </div>

          <div className="d-flex align-items-center gap-2 flex-nowrap flex-shrink-0" style={{ marginTop: '0px' }}>
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
              onClick={() => navigate(user?.role === 'teacher' ? '/teacher/books/delivery' : '/admin/books/delivery')}
              title="Go to Books Delivery Register & History"
            >
              <Truck size={14} className="flex-shrink-0" />
              <span>Delivery Register</span>
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
      </div>

      {/* 2. Key Metrics Cards */}
      <div className="row g-3">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="sa-card p-3 h-100 border-start border-4 border-primary d-flex flex-column justify-content-between">
            <div>
              <div className="d-flex align-items-center justify-content-between mb-1.5">
                <span className="text-sa-muted small fw-bold text-uppercase tracking-wider" style={{ fontSize: '11px' }}>
                  Available Stock of Books
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
              onClick={() => handleTabChange('stock')}
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
              <span>Available Books Stock</span>
              <span className={`badge rounded-pill ${activeTab === 'stock' ? 'bg-danger-subtle text-danger' : 'bg-secondary-subtle text-secondary'}`} style={{ fontSize: '11px' }}>
                {stock.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('handovers')}
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

        {/* Tab 1: Available Books Stock */}
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
                  {streamOptions.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>

                <select
                  className="form-select form-select-sm"
                  style={{ width: 'auto', minWidth: '150px', height: '36px', fontSize: '13px' }}
                  value={selectedStockStatus}
                  onChange={(e) => setSelectedStockStatus(e.target.value)}
                >
                  <option value="All">All Stock Levels</option>
                  <option value="In Stock">In Stock</option>
                  <option value="Low Stock">Low Stock</option>
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
                <span>New Book Title</span>
              </button>
            </div>

            {/* Books Stock Table */}
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
                  title: 'Book Package',
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
                    const stockVal = Number(val) || 0;
                    const reorderVal = Number(row.reorderLevel) || 0;
                    const isOut = stockVal === 0;
                    const isLow = !isOut && stockVal <= reorderVal;
                    const total = Number(row.totalStock) || (stockVal > 0 ? stockVal : 1);
                    const percentage = Math.min(100, Math.max(0, Math.round((stockVal / total) * 100)));

                    return (
                      <div style={{ width: '150px' }}>
                        <div className="d-flex align-items-center justify-content-between gap-1 mb-1">
                          <span className={`fw-bold small ${isOut ? 'text-danger' : isLow ? 'text-warning-emphasis' : 'text-success'}`}>
                            {stockVal} Copies
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
                          {stockVal} of {total} printed copies left
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
                  title: 'Book Package',
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

      {/* 4. Modal: Record Books Handover to Student */}
      <Modal
        isOpen={handoverModalOpen}
        onClose={() => setHandoverModalOpen(false)}
        title="Distribute & Hand Over Books to Student"
      >
        <form onSubmit={handleHandoverSubmit} className="d-flex flex-column gap-3">
          <div>
            <SearchableSelect
              id="handover-material-package"
              label="Select Material Package"
              required
              options={stock.map(item => ({
                value: item.id,
                label: item.title,
                badge: item.standard || 'General',
                stockBadge: Number(item.inStock) > 0 ? `${item.inStock} copies available` : 'OUT OF STOCK',
                stockBadgeColor: Number(item.inStock) > 0 ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-danger text-white',
                disabled: Number(item.inStock) <= 0,
                keywords: [item.title, item.subject, item.standard, item.category]
              }))}
              value={handoverForm.inventoryItemId}
              onChange={(val) => setHandoverForm({ ...handoverForm, inventoryItemId: val })}
              placeholder="-- Choose Module --"
              searchPlaceholder="Search material package by title or stream..."
            />
          </div>

          <div className="d-flex flex-column gap-2">
            <div className="p-3 bg-light rounded-2 border">
              <div className="small fw-bold text-sa-charcoal mb-2 d-flex align-items-center justify-content-between">
                <span>Filter by Admission Branch & Batch:</span>
                <span className="badge bg-secondary-subtle text-secondary" style={{ fontSize: '0.75rem' }}>
                  {eligibleHandoverStudents.length} Students in this Batch
                </span>
              </div>
              <BranchBatchSelector
                branch={handoverBranch}
                session={handoverSession}
                academicBatch={handoverAcademicBatch}
                onBranchChange={(b) => {
                  setHandoverBranch(b);
                  setHandoverForm(prev => ({ ...prev, studentId: '', manualStudentName: '' }));
                }}
                onSessionChange={(s) => {
                  setHandoverSession(s);
                  setHandoverForm(prev => ({ ...prev, studentId: '', manualStudentName: '' }));
                }}
                onBatchChange={(b) => {
                  setHandoverAcademicBatch(b);
                  setHandoverForm(prev => ({ ...prev, studentId: '', manualStudentName: '' }));
                }}
                size="sm"
                showAllOption={false}
              />
            </div>

            <SearchableSelect
              id="handover-student-select"
              label="To Whom Handed Over (Select Student from Enrolled Batch)"
              required={!handoverForm.manualStudentName}
              options={eligibleHandoverStudents.map(s => {
                const id = s.id || s._id || s.student_id;
                const roll = s.rollNumber || s.student_id || 'N/A';
                const assignment = formatStudentBatchDisplay(s);
                return {
                  value: id,
                  label: s.name,
                  badge: `Roll: ${roll}`,
                  sublabel: assignment,
                  keywords: [s.name, roll, s.standard, s.batch, s.branch, s.academic_batch]
                };
              })}
              value={handoverForm.studentId}
              onChange={(val) => setHandoverForm({ ...handoverForm, studentId: val })}
              placeholder={eligibleHandoverStudents.length === 0 ? '-- No students in this batch --' : '-- Choose Student from Selected Batch --'}
              searchPlaceholder="Search student by name, roll number, or class..."
              helperText="Search by name, roll number or stream. Or enter manual recipient below if not found in directory:"
            />

            {handoverForm.studentId && (() => {
              const sel = students.find(s => String(s.id || s._id || s.student_id) === String(handoverForm.studentId));
              if (sel) {
                return (
                  <div className="p-2 rounded bg-success-subtle text-success border border-success-subtle small d-flex align-items-center justify-content-between">
                    <span>Admission Record Verified:</span>
                    <span className="fw-bold">{formatStudentBatchDisplay(sel)}</span>
                  </div>
                );
              }
              return null;
            })()}
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
                placeholder="e.g. Card scanned, signed slip"
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

            <div>
              <label className="form-label small fw-bold">Restock Remarks / Supplier Note (Optional)</label>
              <input
                type="text"
                className="form-control"
                value={restockRemarks}
                onChange={(e) => setRestockRemarks(e.target.value)}
                placeholder="e.g. Received reprint batch from printer"
              />
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
              <Button variant="light" onClick={() => setRestockModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary">Confirm Restock</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* 6. Modal: Add New Book Module to Catalog */}
      <Modal
        isOpen={addStockModalOpen}
        onClose={() => setAddStockModalOpen(false)}
        title="Add New Study Book / Module"
      >
        <form onSubmit={handleAddNewBook} className="d-flex flex-column gap-3">
          <Input
            label="Module / Book Title *"
            name="title"
            value={newBook.title}
            onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
            placeholder="e.g. Theory - Physics or Modern Physics Guide"
            required
          />

          <div className="row g-2">
            <div className="col-6">
              <Select
                label="Module Category"
                name="category"
                value={newBook.category}
                onChange={(e) => setNewBook({ ...newBook, category: e.target.value })}
                options={['Theory', 'CET', 'Foundation', 'Board Exam']}
              />
            </div>
            <div className="col-6">
              <Select
                label="Subject"
                name="subject"
                value={newBook.subject}
                onChange={(e) => setNewBook({ ...newBook, subject: e.target.value })}
                options={['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Foundation', 'General']}
              />
            </div>
          </div>

          <div className="row g-2">
            <div className="col-6">
              <Select
                label="Target Class Stream"
                name="standard"
                value={newBook.standard}
                onChange={(e) => setNewBook({ ...newBook, standard: e.target.value })}
                options={streamOptions}
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
                min="0"
              />
            </div>
          </div>

          <div className="row g-2">
            <div className="col-6">
              <Input
                label="Initial Printed Stock Quantity *"
                name="inStock"
                type="number"
                value={newBook.inStock}
                onChange={(e) => setNewBook({ ...newBook, inStock: e.target.value })}
                required
                min="0"
              />
            </div>
            <div className="col-6">
              <Input
                label="Low Stock Alert Threshold *"
                name="reorderLevel"
                type="number"
                value={newBook.reorderLevel}
                onChange={(e) => setNewBook({ ...newBook, reorderLevel: e.target.value })}
                required
                min="0"
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
        title="Official Books Handover Voucher"
      >
        {viewingVoucher && (
          <div className="d-flex flex-column gap-3">
            <div className="p-4 bg-white border rounded-3" id="printable-voucher">
              <div className="text-center pb-3 border-bottom border-2 border-danger">
                <h4 className="fw-extrabold text-danger m-0" style={{ letterSpacing: '0.5px' }}>
                  SHUBHAM ACADEMY
                </h4>
                <div className="small text-muted fw-bold">
                  Official Physical Study Material & Books Handover Voucher
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
                    <th className="bg-light" style={{ width: '35%' }}>Book Package Title</th>
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
