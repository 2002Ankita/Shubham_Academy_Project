import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Table from '../../components/common/Table';
import SearchBar from '../../components/common/SearchBar';
import Button from '../../components/common/Button';
import Pagination from '../../components/common/Pagination';
import BackButton from '../../components/common/BackButton';
import studentService from '../../services/studentService';
import {
  UserPlus,
  Eye,
  Edit,
  Trash2,
  Upload,
  Download,
  FileSpreadsheet,
  X,
  CheckCircle,
  XCircle,
  ShieldCheck,
  Tag,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { toast } from 'react-toastify';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { useAuth } from '../../hooks/useAuth';
import { useConfirm } from '../../context/ConfirmContext';
import BranchBatchSelector from '../../components/common/BranchBatchSelector';
import {
  formatStudentBatchDisplay,
  matchesStudentFilters
} from '../../config/branchBatchConfig';

export default function StudentList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { confirm } = useConfirm();
  const isSuperAdmin = (user?.role || '').toLowerCase().replace('-', '_').includes('super_admin');
  const [students, setStudents] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'discounts'
  const [discountFilter, setDiscountFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importedFile, setImportedFile] = useState(null);

  // Standardized Branch & Batch Filters
  const [filterBranch, setFilterBranch] = useState('');
  const [filterSession, setFilterSession] = useState('');
  const [filterAcademicBatch, setFilterAcademicBatch] = useState('');

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const data = await studentService.getAll();
      const sorted = [...(data || [])].sort((a, b) => {
        const dateA = a.admissionDate ? new Date(a.admissionDate).getTime() : 0;
        const dateB = b.admissionDate ? new Date(b.admissionDate).getTime() : 0;
        if (dateB !== dateA) return dateB - dateA;
        return (b.id || '').localeCompare(a.id || '');
      });
      setStudents(sorted);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleApproveDiscount = async (id, name) => {
    const isConfirmed = await confirm({
      title: 'Approve Discount',
      message: `Are you sure you want to approve the discount for ${name} as Superadmin?`,
      subtitle: 'This will authorize the fee concession for this student.',
      confirmText: 'Approve Discount',
      cancelText: 'Cancel',
      type: 'warning'
    });
    if (!isConfirmed) return;
    try {
      const studentObj = students.find(s => s.id === id);
      const discAmt = studentObj?.discountRequestedAmount || studentObj?.discountAmount || 0;
      await studentService.approveDiscount(id, {
        approved_amount: Number(discAmt) || 0,
        discount_amount: Number(discAmt) || 0
      });
      toast.success(`Discount for ${name} successfully approved by Superadmin!`);
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to approve discount');
    }
  };

  const handleRejectDiscount = async (id, name) => {
    const reason = window.prompt(`Enter rejection reason for discount (${name}):`, 'Discount criteria not met');
    if (reason === null) return;
    try {
      await studentService.rejectDiscount(id, reason);
      toast.info(`Discount for ${name} rejected.`);
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to reject discount');
    }
  };

  const handleDelete = async (id, name) => {
    const isConfirmed = await confirm({
      title: 'Remove Student Record',
      message: `Are you sure you want to remove student record: ${name}?`,
      subtitle: 'This will permanently remove the student profile.',
      confirmText: 'Remove Student',
      cancelText: 'Cancel',
      type: 'danger'
    });

    if (isConfirmed) {
      await studentService.delete(id);
      toast.success(`Student ${name} removed`);
      setStudents(students.filter(s => s.id !== id));
    }
  };

  // Export students list to CSV
  const handleExportCSV = () => {
    if (filtered.length === 0) {
      toast.warning('No student records available to export.');
      return;
    }
    const headers = ['Roll Number', 'Student Name', 'Email', 'Class/Standard', 'Phone', 'Parent Phone', 'Card UID', 'Attendance %', 'Fee Status'];
    const rows = filtered.map(s => [
      `"${s.rollNumber || ''}"`,
      `"${s.name || ''}"`,
      `"${s.email || ''}"`,
      `"${s.standard || ''}"`,
      `"${s.phone || ''}"`,
      `"${s.parentPhone || ''}"`,
      `"${s.rfidCard || ''}"`,
      `"${s.attendancePercent || 0}%"`,
      `"${s.feesStatus || 'Pending'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `shubham_students_directory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${filtered.length} student records to CSV!`);
  };

  // Download Sample Template for import
  const handleDownloadTemplate = () => {
    const headers = ['Roll Number', 'Full Name', 'Class / Standard', 'Email', 'Student Mobile', 'Parent Mobile', 'Card UID'];
    const sample = [
      ['STD-101', 'Aarav Sharma', '11th Science', 'aarav.sharma@example.com', '+91 98220 11111', '+91 98220 22222', 'RF-90412'],
      ['STD-102', 'Ananya Deshmukh', '12th Science', 'ananya.d@example.com', '+91 98220 33333', '+91 98220 44444', 'RF-90413']
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...sample.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'student_import_sample_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.info('Sample template downloaded!');
  };

  const handleImport = async () => {
    if (!importedFile) {
      toast.warning('Please choose a CSV or Excel file to import.');
      return;
    }

    try {
      setLoading(true);
      let dataToImport = [];

      const readAsBinaryString = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsBinaryString(file);
      });

      const readAsText = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsText(file);
      });

      const ext = importedFile.name.split('.').pop().toLowerCase();
      
      if (ext === 'csv') {
        const csvContent = await readAsText(importedFile);
        const parsed = Papa.parse(csvContent, { header: true, skipEmptyLines: true });
        dataToImport = parsed.data;
      } else if (ext === 'xlsx' || ext === 'xls') {
        const binaryString = await readAsBinaryString(importedFile);
        const workbook = XLSX.read(binaryString, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        dataToImport = XLSX.utils.sheet_to_json(sheet);
      } else {
        toast.error('Unsupported file format. Please upload CSV or Excel.');
        setLoading(false);
        return;
      }

      if (dataToImport.length === 0) {
        toast.warning('The file is empty.');
        setLoading(false);
        return;
      }

      let successCount = 0;
      let failCount = 0;
      const errorMessages = new Set();

      for (const row of dataToImport) {
        const normalizedRow = {};
        for (const key in row) {
          const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
          normalizedRow[cleanKey] = row[key];
        }

        const rawPhone = String(normalizedRow['studentmobile'] || normalizedRow['phone'] || normalizedRow['contact'] || normalizedRow['mobileno'] || '').replace(/\D/g, '');
        let rawParent = String(normalizedRow['parentmobile'] || normalizedRow['parentphone'] || '').replace(/\D/g, '');

        let parsedPhone = rawPhone.slice(-10);
        let parsedParent = rawParent.slice(-10) || '0000000000';
        
        // Backend strictly rejects if student phone == parent phone
        if (parsedPhone === parsedParent) {
          parsedParent = '0000000000';
        }

        const payload = {
          rollNumber: normalizedRow['rollnumber'] || normalizedRow['studentid'] || '',
          name: normalizedRow['fullname'] || normalizedRow['studentname'] || normalizedRow['name'] || normalizedRow['firstname'] || Object.values(normalizedRow)[1] || '',
          email: normalizedRow['email'] || normalizedRow['emailid'] || '',
          password: parsedPhone || undefined,
          phone: parsedPhone,
          parentPhone: parsedParent,
          standard: normalizedRow['classstandard'] || normalizedRow['class'] || normalizedRow['standard'] || 'General',
          rfidCard: normalizedRow['rfiduid'] || normalizedRow['rfid'] || normalizedRow['rfidbadge'] || '',
          batch: 'General',
          branch: 'Tarabai Park',
          totalFees: 0,
          admission_date: normalizedRow['admissiondate'] || normalizedRow['dateofadmission'] || normalizedRow['joiningdate'] ? new Date(normalizedRow['admissiondate'] || normalizedRow['dateofadmission'] || normalizedRow['joiningdate']).toISOString() : undefined
        };

        if (!payload.name) {
          const availableCols = Object.keys(normalizedRow).join(', ');
          errorMessages.add(`Missing student name (Found columns: ${availableCols})`);
          failCount++;
          continue;
        }
        if (!payload.email) {
          errorMessages.add('Missing email address');
          failCount++;
          continue;
        }
        if (payload.phone.length !== 10) {
          errorMessages.add(`Invalid phone number format (must be 10 digits, got ${payload.phone.length})`);
          failCount++;
          continue;
        }

        try {
          await studentService.create(payload);
          successCount++;
        } catch (error) {
          failCount++;
          const errDetail = error.response?.data?.detail;
          if (errDetail) {
            errorMessages.add(Array.isArray(errDetail) ? errDetail[0].msg : errDetail);
          } else {
            errorMessages.add('Unknown error');
          }
          console.error('Failed to import student:', error);
        }
      }

      if (failCount > 0) {
        const reasons = Array.from(errorMessages).join(', ');
        toast.warning(`Import completed: ${successCount} added, ${failCount} failed. Reasons: ${reasons || 'Missing required info in CSV'}`);
      } else {
        toast.success(`Import completed: ${successCount} successfully onboarded!`);
      }
      
      setShowImportModal(false);
      setImportedFile(null);
      fetchStudents();
    } catch (error) {
      toast.error('An error occurred during import.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const discountStudents = students.filter(
    (s) => (s.discountAmount && s.discountAmount > 0) || (s.discountStatus && s.discountStatus !== 'NONE')
  );

  const pendingDiscountsCount = students.filter((s) => s.discountStatus === 'PENDING').length;

  const filteredDiscounts = discountStudents.filter((s) => {
    const matchesPlacement = matchesStudentFilters(s, {
      branch: filterBranch,
      session: filterSession,
      academicBatch: filterAcademicBatch
    });
    if (!matchesPlacement) return false;
    const matchesFilter = discountFilter === 'ALL' || s.discountStatus === discountFilter;
    const matchesSearch =
      !search.trim() ||
      (s.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.rollNumber || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.discountReason || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.discountApprovedBy || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.standard || '').toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filtered = students.filter(s => {
    const matchesPlacement = matchesStudentFilters(s, {
      branch: filterBranch,
      session: filterSession,
      academicBatch: filterAcademicBatch
    });
    if (!matchesPlacement) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (s.name || '').toLowerCase().includes(q) ||
      (s.rollNumber || '').toLowerCase().includes(q) ||
      (s.rfidCard || '').toLowerCase().includes(q) ||
      (s.standard || '').toLowerCase().includes(q) ||
      (s.branch || '').toLowerCase().includes(q) ||
      (s.batch || '').toLowerCase().includes(q)
    );
  });

  const PAGE_SIZE = 10;
  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filtered, currentPage]);

  const paginatedDiscounts = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredDiscounts.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredDiscounts, currentPage]);

  return (
    <div className="d-flex flex-column gap-4">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
        <div>
          <BackButton to="/admin/dashboard" label="Back to Dashboard" />
          <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
            Student Directory & Discount Management
          </h3>
          <span className="small text-sa-muted">
            Manage student enrollments, card allocations, fee concessions, and Superadmin discount approvals
          </span>
        </div>

        {/* Action Buttons: Import, Export, Register */}
        <div className="d-flex flex-wrap align-items-center gap-2">
          <Button
            variant="outline"
            icon={Upload}
            onClick={() => setShowImportModal(true)}
          >
            Import Students
          </Button>

          <Button
            variant="outline"
            icon={Download}
            onClick={handleExportCSV}
          >
            Export
          </Button>

          <Button
            variant="primary"
            icon={UserPlus}
            onClick={() => navigate('/admin/students/register')}
          >
            Register New Student
          </Button>
        </div>
      </div>

      {/* Primary Tabs: All Students vs Discount Approvals */}
      <div className="d-flex flex-wrap align-items-center gap-2 border-bottom pb-2">
        <button
          type="button"
          onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
          className={`btn btn-sm d-flex align-items-center gap-2 px-3 py-2 fw-semibold rounded-2 transition-all`}
          style={{
            backgroundColor: activeTab === 'all' ? '#8B1216' : '#FFFFFF',
            border: '1.5px solid #8B1216',
            color: activeTab === 'all' ? '#FFFFFF' : '#8B1216'
          }}
        >
          <span>All Enrolled Students</span>
          <span
            className="badge rounded-pill"
            style={{
              backgroundColor: activeTab === 'all' ? '#FFFFFF' : '#8B1216',
              color: activeTab === 'all' ? '#8B1216' : '#FFFFFF'
            }}
          >
            {students.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('discounts'); setCurrentPage(1); }}
          className={`btn btn-sm d-flex align-items-center gap-2 px-3 py-2 fw-semibold rounded-2 transition-all`}
          style={{
            backgroundColor: activeTab === 'discounts' ? '#8B1216' : '#FFFFFF',
            border: activeTab === 'discounts' ? '1.5px solid #8B1216' : (pendingDiscountsCount > 0 ? '1.5px solid #D97706' : '1.5px solid #CBD5E1'),
            color: activeTab === 'discounts' ? '#FFFFFF' : (pendingDiscountsCount > 0 ? '#B45309' : '#475569')
          }}
        >
          <ShieldCheck size={16} />
          <span>Discount Approvals</span>
          {pendingDiscountsCount > 0 ? (
            <span
              className="badge rounded-pill fw-bold"
              style={{
                backgroundColor: activeTab === 'discounts' ? '#FEF3C7' : '#F59E0B',
                color: activeTab === 'discounts' ? '#B45309' : '#FFFFFF'
              }}
            >
              {pendingDiscountsCount} Pending Superadmin
            </span>
          ) : (
            <span
              className="badge rounded-pill"
              style={{
                backgroundColor: activeTab === 'discounts' ? '#FFFFFF' : '#E2E8F0',
                color: activeTab === 'discounts' ? '#8B1216' : '#475569'
              }}
            >
              {discountStudents.length}
            </span>
          )}
        </button>
      </div>

      {/* VIEW 1: ALL STUDENTS */}
      {activeTab === 'all' && (
        <div className="sa-card p-4">
          {/* Standardized Branch & Batch Filters */}
          <div className="mb-3 p-3 bg-light rounded-3 border">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="small fw-bold text-sa-charcoal">
                Filter by Admission Branch & Batch:
              </span>
              {(filterBranch || filterSession || filterAcademicBatch) && (
                <button
                  type="button"
                  className="btn btn-xs btn-outline-secondary py-0.5 px-2"
                  style={{ fontSize: '11px' }}
                  onClick={() => {
                    setFilterBranch('');
                    setFilterSession('');
                    setFilterAcademicBatch('');
                  }}
                >
                  Reset Branch Filters
                </button>
              )}
            </div>
            <BranchBatchSelector
              branch={filterBranch}
              onBranchChange={setFilterBranch}
              session={filterSession}
              onSessionChange={setFilterSession}
              academicBatch={filterAcademicBatch}
              onAcademicBatchChange={setFilterAcademicBatch}
              showAllOption={true}
              layout="grid"
            />
          </div>

          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-3">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search by name, roll no, card UID or class..."
              className="flex-grow-1"
            />
            <div className="d-flex align-items-center gap-2">
              <span className="small fw-semibold text-sa-muted">
                Total Enrolled: <strong className="text-sa-charcoal">{filtered.length}</strong>
              </span>
            </div>
          </div>

          <Table
            columns={[
              {
                key: 'rollNumber',
                title: 'Roll Number',
                render: (val) => <span className="fw-bold text-sa-primary">{val}</span>
              },
              {
                key: 'name',
                title: 'Student Name',
                render: (val, row) => (
                  <div>
                    <span className="fw-semibold text-sa-charcoal d-block">{val}</span>
                    <span className="text-sa-muted small" style={{ fontSize: '0.75rem' }}>{row.email}</span>
                  </div>
                )
              },
              {
                key: 'branchBatch',
                title: 'Branch / Batch',
                render: (_, row) => (
                  <div>
                    <span className="badge bg-light text-dark border d-inline-block fw-semibold mb-1">
                      {row.branch || 'Tarabai Park'}
                    </span>
                    <span className="d-block small text-sa-charcoal fw-bold">
                      {row.academicBatch || row.academic_batch || row.batch || row.standard || '11th PCM'}
                      {row.session ? ` • ${row.session}` : ''}
                    </span>
                  </div>
                )
              },
              {
                key: 'rfidCard',
                title: 'Card UID',
                render: (val) => <span className="badge bg-light text-dark border">{val}</span>
              },
              {
                key: 'profileCompleted',
                title: 'Profile Status',
                render: (val, row) => (
                  val ? (
                    <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2.5 py-1 rounded-pill small fw-semibold">
                      Complete ✓
                    </span>
                  ) : (
                    <span className="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 px-2.5 py-1 rounded-pill small fw-semibold" title="Student has not yet completed remaining profile">
                      Pending Entry
                    </span>
                  )
                )
              },
              {
                key: 'attendancePercent',
                title: 'Attendance',
                render: (val) => (
                  <span className={`fw-bold ${val >= 90 ? 'text-success' : val >= 75 ? 'text-warning' : 'text-danger'}`}>
                    {val}%
                  </span>
                )
              },
              {
                key: 'feesStatus',
                title: 'Fee & Discount Status',
                render: (val, row) => (
                  <div>
                    <div className="d-flex align-items-center gap-1">
                      {val === 'Paid' ? (
                        <span className="badge-paid">Paid in Full</span>
                      ) : val === 'Pending' ? (
                        <span className="badge-pending">Partially Paid</span>
                      ) : (
                        <span className="badge-overdue">Overdue</span>
                      )}
                    </div>
                    {row.discountAmount > 0 && (
                      <div className="mt-1" style={{ fontSize: '0.73rem', lineHeight: 1.35 }}>
                        {row.discountStatus === 'APPROVED' ? (
                          <div className="p-1 rounded bg-success-subtle border border-success-subtle">
                            <span className="fw-bold text-success d-block">
                              ✓ ₹{row.discountAmount?.toLocaleString()} Discount
                            </span>
                            <span className="text-dark d-block">
                              Approved by: <strong>{row.discountApprovedBy || 'Superadmin'}</strong>
                            </span>
                          </div>
                        ) : row.discountStatus === 'PENDING' ? (
                          <div className="p-1 rounded bg-warning-subtle border border-warning-subtle text-warning-emphasis">
                            <span className="fw-bold d-block">
                              ⏳ ₹{row.discountAmount?.toLocaleString()} Discount
                            </span>
                            <span>Pending Superadmin Approval</span>
                          </div>
                        ) : row.discountStatus === 'REJECTED' ? (
                          <div className="p-1 rounded bg-danger-subtle text-danger">
                            <span>✗ Discount Rejected</span>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                )
              },
              {
                key: 'id',
                title: 'Actions',
                align: 'end',
                render: (val, row) => (
                  <div className="d-flex align-items-center justify-content-end gap-1">
                    <button
                      type="button"
                      className="btn btn-sm btn-light border p-1"
                      title="View Details"
                      onClick={() => navigate(`/admin/students/${val}`)}
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-light border p-1 text-danger"
                      title="Remove"
                      onClick={() => handleDelete(val, row.name)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )
              }
            ]}
            data={paginatedStudents}
            loading={loading}
          />

          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(filtered.length / 10) || 1}
            onPageChange={setCurrentPage}
            totalItems={filtered.length}
          />
        </div>
      )}

      {/* VIEW 2: DISCOUNT APPROVALS */}
      {activeTab === 'discounts' && (
        <div className="d-flex flex-column gap-3">
          {/* Policy Banner */}
          <div className="p-3.5 rounded-3 border bg-white shadow-sm d-flex align-items-start gap-3">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center text-white flex-shrink-0"
              style={{ width: '38px', height: '38px', backgroundColor: '#8B1216' }}
            >
              <ShieldCheck size={20} />
            </div>
            <div className="flex-grow-1" style={{ fontSize: '0.88rem' }}>
              <h6 className="fw-bold text-sa-charcoal mb-1">
                Superadmin Student Discount Approval Registry
              </h6>
              <p className="text-muted m-0" style={{ fontSize: '0.84rem', lineHeight: 1.5 }}>
                Whenever a discount is offered to a student, the system permanently records and displays <strong>who approved it</strong>. The <strong>final approval must be granted strictly by the Superadmin</strong> before concession discounts take full effect on student accounts and official receipts.
              </p>
            </div>
            {isSuperAdmin && (
              <span className="badge bg-success-subtle text-success border border-success px-2.5 py-1.5 fw-bold flex-shrink-0">
                Logged in as Superadmin
              </span>
            )}
          </div>

          <div className="sa-card p-4">
            {/* Filter buttons & Search */}
            <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-3">
              <div className="d-flex align-items-center gap-1.5">
                {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => { setDiscountFilter(st); setCurrentPage(1); }}
                    className={`btn btn-sm fw-semibold rounded-2 px-3 py-1.5 ${
                      discountFilter === st ? 'btn-dark text-white' : 'btn-light border text-secondary'
                    }`}
                    style={{ fontSize: '0.82rem' }}
                  >
                    {st === 'ALL' && `All (${discountStudents.length})`}
                    {st === 'PENDING' && `Pending (${students.filter(s => s.discountStatus === 'PENDING').length})`}
                    {st === 'APPROVED' && `Approved (${students.filter(s => s.discountStatus === 'APPROVED').length})`}
                    {st === 'REJECTED' && `Rejected (${students.filter(s => s.discountStatus === 'REJECTED').length})`}
                  </button>
                ))}
              </div>

              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Search discount records..."
                className="flex-grow-1"
                style={{ maxWidth: '320px' }}
              />
            </div>

            <Table
              columns={[
                {
                  key: 'name',
                  title: 'Student Details',
                  render: (val, row) => (
                    <div>
                      <span
                        className="fw-bold text-sa-charcoal d-block cursor-pointer hover-underline"
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/admin/students/${row.id}`)}
                      >
                        {val}
                      </span>
                      <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                        Roll: {row.rollNumber || 'N/A'} • {row.standard}
                      </span>
                    </div>
                  )
                },
                {
                  key: 'originalFees',
                  title: 'Original Fee',
                  render: (val, row) => (
                    <span className="text-secondary small fw-semibold">
                      ₹{Number(val || ((row.totalFees || 0) + (row.discountAmount || 0))).toLocaleString()}
                    </span>
                  )
                },
                {
                  key: 'discountAmount',
                  title: 'Discount Concession',
                  render: (val, row) => (
                    <div>
                      <span className="fw-bold text-success d-block" style={{ fontSize: '0.92rem' }}>
                        -₹{Number(val || 0).toLocaleString()}
                      </span>
                      <span className="badge bg-light text-dark border small" style={{ fontSize: '0.70rem' }}>
                        {row.discountReason || 'Concession'}
                      </span>
                    </div>
                  )
                },
                {
                  key: 'totalFees',
                  title: 'Net Course Fee',
                  render: (val) => (
                    <span className="fw-bold" style={{ color: '#8B1216', fontSize: '0.94rem' }}>
                      ₹{Number(val || 0).toLocaleString()}
                    </span>
                  )
                },
                {
                  key: 'discountOfferedBy',
                  title: 'Recommended By',
                  render: (val, row) => (
                    <div className="small">
                      <span className="fw-semibold text-secondary d-block">{row.discountRecommendedBy || val || 'Miss Shilpa'}</span>
                      {row.discountOfferedAt && (
                        <span className="text-muted" style={{ fontSize: '0.70rem' }}>
                          {new Date(row.discountOfferedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  )
                },
                {
                  key: 'discountStatus',
                  title: 'Status',
                  render: (val) => {
                    if (val === 'APPROVED') {
                      return <span className="badge bg-success text-white px-2.5 py-1">Approved</span>;
                    }
                    if (val === 'PENDING') {
                      return <span className="badge bg-warning text-dark px-2.5 py-1">Pending Superadmin</span>;
                    }
                    if (val === 'REJECTED') {
                      return <span className="badge bg-danger text-white px-2.5 py-1">Rejected</span>;
                    }
                    return <span className="badge bg-secondary">None</span>;
                  }
                },
                {
                  key: 'discountApprovedBy',
                  title: 'Who Approved It',
                  render: (val, row) => {
                    if (row.discountStatus === 'APPROVED') {
                      return (
                        <div className="small">
                          <span className="fw-bold text-success d-flex align-items-center gap-1">
                            <CheckCircle size={14} className="text-success" />
                            {val || 'Superadmin'}
                          </span>
                          {row.discountApprovedAt && (
                            <span className="text-muted d-block" style={{ fontSize: '0.70rem' }}>
                              {new Date(row.discountApprovedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      );
                    }
                    if (row.discountStatus === 'PENDING') {
                      return (
                        <span className="small text-warning-emphasis fst-italic d-flex align-items-center gap-1">
                          <Clock size={13} />
                          Awaiting Superadmin Review
                        </span>
                      );
                    }
                    if (row.discountStatus === 'REJECTED') {
                      return (
                        <div className="small text-danger">
                          <span className="d-block fw-semibold">Rejected by Superadmin</span>
                          {row.discountRejectionReason && (
                            <span className="text-muted small" style={{ fontSize: '0.72rem' }}>
                              "{row.discountRejectionReason}"
                            </span>
                          )}
                        </div>
                      );
                    }
                    return <span className="text-muted small">—</span>;
                  }
                },
                {
                  key: 'id',
                  title: 'Approval Action',
                  align: 'end',
                  render: (val, row) => (
                    <div className="d-flex align-items-center justify-content-end gap-1.5">
                      {isSuperAdmin && row.discountStatus === 'PENDING' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleApproveDiscount(val, row.name)}
                            className="btn btn-sm btn-success d-inline-flex align-items-center gap-1 px-2.5 py-1 fw-semibold"
                            style={{ fontSize: '0.78rem' }}
                            title="Approve Discount as Superadmin"
                          >
                            <ShieldCheck size={14} /> Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectDiscount(val, row.name)}
                            className="btn btn-sm btn-outline-danger px-2.5 py-1 fw-semibold"
                            style={{ fontSize: '0.78rem' }}
                            title="Reject Discount"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        className="btn btn-sm btn-light border p-1"
                        title="View Student Profile"
                        onClick={() => navigate(`/admin/students/${val}`)}
                      >
                        <Eye size={15} />
                      </button>
                    </div>
                  )
                }
              ]}
              data={paginatedDiscounts}
              loading={loading}
            />

            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredDiscounts.length / 10) || 1}
              onPageChange={setCurrentPage}
              totalItems={filteredDiscounts.length}
            />
          </div>
        </div>
      )}

      {/* Import Students Preview Modal */}
      {showImportModal && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 1055 }}
          onClick={() => setShowImportModal(false)}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            style={{ maxWidth: '540px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content rounded-4 border-0 shadow-lg overflow-hidden">
              {/* Modal Header */}
              <div className="modal-header border-bottom px-4 py-3 bg-white d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center text-white"
                    style={{ width: '32px', height: '32px', backgroundColor: 'var(--sa-primary-red, #8B1216)' }}
                  >
                    <Upload size={17} />
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold text-sa-charcoal fs-6 mb-0">Import Students Data</h5>
                    <span className="text-muted small" style={{ fontSize: '12px' }}>
                      Upload bulk student records via Excel or CSV
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowImportModal(false)}
                  aria-label="Close"
                />
              </div>

              {/* Modal Body */}
              <div className="modal-body px-4 py-4">
                {/* Drag and Drop Zone */}
                <label
                  htmlFor="bulk-student-file"
                  className="d-flex flex-column align-items-center justify-content-center p-4 rounded-3 border-2 border-dashed text-center w-100 mb-3 cursor-pointer transition-all"
                  style={{
                    borderColor: importedFile ? 'var(--sa-primary-red, #8B1216)' : '#CBD5E1',
                    backgroundColor: importedFile ? '#FFF8F8' : '#F8FAFC',
                    cursor: 'pointer'
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const files = e.dataTransfer.files;
                    if (files && files.length > 0) {
                      const file = files[0];
                      const ext = file.name.split('.').pop().toLowerCase();
                      if (['csv', 'xlsx', 'xls'].includes(ext)) {
                        setImportedFile(file);
                      } else {
                        toast.error('Only CSV or Excel files are allowed.');
                      }
                    }
                  }}
                >
                  <FileSpreadsheet
                    size={42}
                    className="mb-2"
                    style={{ color: importedFile ? 'var(--sa-primary-red, #8B1216)' : '#64748B' }}
                  />
                  {importedFile ? (
                    <div>
                      <span className="fw-bold text-sa-charcoal d-block">{importedFile.name}</span>
                      <span className="small text-muted">{(importedFile.size / 1024).toFixed(1)} KB • Ready to import</span>
                    </div>
                  ) : (
                    <div>
                      <span className="fw-semibold text-sa-charcoal d-block">
                        Click to browse or drag & drop student sheet
                      </span>
                      <span className="small text-muted">Supports CSV, XLSX or XLS (max 5 MB)</span>
                    </div>
                  )}
                  <input
                    id="bulk-student-file"
                    type="file"
                    accept=".csv, .xlsx, .xls"
                    className="d-none"
                    onChange={(e) => {
                      setImportedFile(e.target.files?.[0] || null);
                      e.target.value = null; // reset so the same file can be selected again if needed
                    }}
                  />
                </label>

                {/* Template download link */}
                <div className="d-flex align-items-center justify-content-between p-3 rounded-3 bg-light border mb-3">
                  <div className="d-flex align-items-center gap-2">
                    <FileSpreadsheet size={18} className="text-success" />
                    <div>
                      <span className="small fw-semibold text-sa-charcoal d-block">Need the standard spreadsheet format?</span>
                      <span className="text-muted text-xs" style={{ fontSize: '11.5px' }}>
                        Includes column headers and sample data
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1.5 fw-semibold"
                    style={{ fontSize: '12px' }}
                    onClick={handleDownloadTemplate}
                  >
                    <Download size={13} /> Template (.CSV)
                  </button>
                </div>

                {/* Instructions */}
                <div className="small text-muted" style={{ fontSize: '12px', lineHeight: '1.5' }}>
                  <strong className="text-sa-charcoal">Expected Column Headers:</strong> Roll Number, Full Name, Class / Standard, Email, Student Mobile, Parent Mobile, Card UID.
                </div>
              </div>

              {/* Modal Footer */}
              <div className="modal-footer px-4 py-3 bg-light border-top d-flex align-items-center justify-content-end gap-2">
                <Button variant="light" onClick={() => setShowImportModal(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  icon={Upload}
                  onClick={handleImport}
                  disabled={!importedFile || loading}
                >
                  {loading ? 'Uploading...' : 'Upload & Import'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
