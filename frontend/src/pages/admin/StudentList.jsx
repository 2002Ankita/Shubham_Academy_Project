import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Table from '../../components/common/Table';
import SearchBar from '../../components/common/SearchBar';
import Button from '../../components/common/Button';
import Pagination from '../../components/common/Pagination';
import BackButton from '../../components/common/BackButton';
import studentService from '../../services/studentService';
import feeService from '../../services/feeService';
import notificationService from '../../services/notificationService';
import Modal from '../../components/common/Modal';
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
  Clock,
  Coins,
  CreditCard,
  User,
  Phone,
  Mail,
  Building,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { toast } from 'react-toastify';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { useAuth } from '../../hooks/useAuth';
import { useConfirm } from '../../context/ConfirmContext';
import BranchBatchSelector from '../../components/common/BranchBatchSelector';
import {
  BRANCH_TARABAI,
  BRANCH_MANGALWAR,
  ACADEMIC_BATCHES,
  isSessionRequired,
  formatStudentBatchDisplay,
  matchesStudentFilters
} from '../../config/branchBatchConfig';
import { getUserBranch, CAMPUS } from '../../utils/branchUtils';

const getMatchingCourseFee = (structures, branch, academicBatch, standard, fallbackFee = 55000) => {
  if (!structures || structures.length === 0) return fallbackFee;
  const bLower = (branch || '').toLowerCase();
  const isMangal = bLower.includes('mangal');
  const batchStr = (academicBatch || '').toLowerCase();
  
  let stream = '';
  if (batchStr.includes('pcmb')) stream = 'pcmb';
  else if (batchStr.includes('pcb')) stream = 'pcb';
  else if (batchStr.includes('pcm')) stream = 'pcm';

  if (stream) {
    const streamMatch = structures.find(s => {
      const sBranch = (s.branch || '').toLowerCase();
      const sBatch = (s.batch || '').toLowerCase();
      const branchMatches = isMangal ? sBranch.includes('mangal') : (sBranch.includes('tarabai') || !sBranch.includes('mangal'));
      if (!branchMatches) return false;
      if (stream === 'pcmb') return sBatch.includes('pcmb');
      if (stream === 'pcm') return sBatch.includes('pcm') && !sBatch.includes('pcmb');
      if (stream === 'pcb') return sBatch.includes('pcb') && !sBatch.includes('pcmb');
      return false;
    });
    if (streamMatch && streamMatch.total_fee > 0) return streamMatch.total_fee;
  }

  const batchMatch = structures.find(s => {
    const sBranch = (s.branch || '').toLowerCase();
    const sBatch = (s.batch || '').toLowerCase();
    const branchMatches = isMangal ? sBranch.includes('mangal') : (sBranch.includes('tarabai') || !sBranch.includes('mangal'));
    return branchMatches && sBatch.includes(batchStr);
  });
  if (batchMatch && batchMatch.total_fee > 0) return batchMatch.total_fee;

  return fallbackFee;
};

export default function StudentList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const activeBranch = getUserBranch(user);
  const { confirm } = useConfirm();
  const isSuperAdmin = (user?.role || '').toLowerCase().replace('-', '_').includes('super_admin') || (user?.role || '').toLowerCase().includes('super');
  const isMP = Boolean(activeBranch && activeBranch.toLowerCase().includes('mangal'));
  const userBranchNormalized = activeBranch ? (isMP ? CAMPUS.MANGALVAR_PETH : CAMPUS.TARABAI_PARK) : '';
  const defaultBranch = isSuperAdmin ? '' : (isMP ? BRANCH_MANGALWAR : (activeBranch || BRANCH_TARABAI));
  const [students, setStudents] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'discounts'
  const [discountFilter, setDiscountFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importedFile, setImportedFile] = useState(null);

  // Standardized Branch & Batch Filters
  const [filterBranch, setFilterBranch] = useState(defaultBranch);
  const [filterSession, setFilterSession] = useState('');
  const [filterAcademicBatch, setFilterAcademicBatch] = useState('');

  const effectiveBranch = isSuperAdmin ? filterBranch : (userBranchNormalized || defaultBranch);

  // Complete Student Onboarding & Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [feeStructures, setFeeStructures] = useState([]);
  const [editSaving, setEditSaving] = useState(false);
  const [editErrors, setEditErrors] = useState({});
  const [editFormData, setEditFormData] = useState({
    id: '',
    rollNumber: '',
    fullName: '',
    email: '',
    mobileNumber: '',
    parentName: '',
    parentPhone: '',
    relation: 'Father',
    date_of_birth: '',
    gender: 'Male',
    address: '',
    branch: 'Mangalvar Peth',
    session: 'Morning',
    academicBatch: '11th PCM',
    standard: '11th Science',
    originalFees: 55000,
    discountAmount: 0,
    discountReason: 'Academic Merit Scholarship',
    discountRecommendedBy: 'Miss Shilpa (Counselor)',
    paidFees: 0,
    totalFees: 55000,
    remainingFees: 55000
  });

  useEffect(() => {
    feeService.getStructures(activeBranch).then((data) => {
      if (Array.isArray(data)) setFeeStructures(data);
    }).catch((err) => console.warn('Could not load fee structures in StudentList:', err));
  }, [activeBranch]);

  useEffect(() => {
    if (activeBranch && !isSuperAdmin) {
      const isMangal = activeBranch.toLowerCase().includes('mangal');
      setFilterBranch(isMangal ? BRANCH_MANGALWAR : BRANCH_TARABAI);
    }
  }, [activeBranch, isSuperAdmin]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const data = await studentService.getAll({ branch: effectiveBranch });
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
  }, [effectiveBranch]);

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

  const handleOpenEditModal = (stu) => {
    setEditingStudent(stu);
    const stuBranch = stu.branch || activeBranch || 'Mangalvar Peth';
    const isMP = stuBranch.toLowerCase().includes('mangal');
    const defaultSec = isMP ? 'Morning' : '';
    const stuSession = stu.session || defaultSec;
    const academicBatch = stu.academicBatch || stu.academic_batch || stu.batch || '11th PCM';
    const standard = stu.standard || (academicBatch.startsWith('12') ? '12th Science' : '11th Science');
    const origFees = Number(stu.originalFees) || (Number(stu.totalFees) > 0 ? Number(stu.totalFees) : getMatchingCourseFee(feeStructures, stuBranch, academicBatch, standard, 55000));
    const discAmount = Number(stu.discountAmount) || 0;
    const paidFees = Number(stu.paidFees) || 0;
    const effectiveTotal = Math.max(0, origFees - discAmount);
    const remaining = Math.max(0, effectiveTotal - paidFees);

    setEditFormData({
      id: stu.id,
      rollNumber: stu.rollNumber || stu.student_id || '',
      fullName: stu.name || stu.full_name || '',
      email: stu.email || '',
      mobileNumber: stu.phone || stu.mobile_number || '',
      parentName: stu.parentName || stu.parent_name || '',
      parentPhone: stu.parentPhone || stu.parent_mobile || '',
      relation: stu.relation || 'Father',
      date_of_birth: stu.date_of_birth ? new Date(stu.date_of_birth).toISOString().split('T')[0] : '',
      gender: stu.gender || 'Male',
      address: stu.address || '',
      branch: stuBranch,
      session: stuSession,
      academicBatch: academicBatch,
      standard: standard,
      originalFees: origFees,
      discountAmount: discAmount,
      discountReason: stu.discountReason || 'Academic Merit Scholarship',
      discountRecommendedBy: stu.discountRecommendedBy || 'Miss Shilpa (Counselor)',
      paidFees: paidFees,
      totalFees: effectiveTotal,
      remainingFees: remaining
    });
    setEditErrors({});
    setShowEditModal(true);
  };

  const handleApplyPresetDiscount = (presetVal) => {
    const orig = Number(editFormData.originalFees) || 0;
    const paid = Number(editFormData.paidFees) || 0;
    let disc = 0;
    if (typeof presetVal === 'string' && presetVal.endsWith('%')) {
      const pct = parseFloat(presetVal);
      disc = Math.round((orig * pct) / 100);
    } else {
      disc = Number(presetVal) || 0;
    }
    disc = Math.min(disc, orig);
    const net = Math.max(0, orig - disc);
    const rem = Math.max(0, net - paid);
    setEditFormData(prev => ({
      ...prev,
      discountAmount: disc,
      totalFees: net,
      remainingFees: rem,
      discountReason: disc > 0 ? (prev.discountReason || 'Academic Merit Scholarship') : prev.discountReason
    }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    let updated = { ...editFormData, [name]: value };

    if (name === 'academicBatch') {
      const std = value.startsWith('12th') ? '12th Science' : '11th Science';
      updated.standard = std;
      const matchedFee = getMatchingCourseFee(feeStructures, updated.branch, value, std, updated.originalFees);
      if (matchedFee > 0) {
        updated.originalFees = matchedFee;
        const disc = Number(updated.discountAmount) || 0;
        const net = Math.max(0, matchedFee - disc);
        updated.totalFees = net;
        const paid = Number(updated.paidFees) || 0;
        updated.remainingFees = Math.max(0, net - paid);
      }
    }

    if (name === 'originalFees' || name === 'discountAmount' || name === 'paidFees') {
      const orig = Number(name === 'originalFees' ? value : updated.originalFees) || 0;
      const disc = Number(name === 'discountAmount' ? value : updated.discountAmount) || 0;
      const paid = Number(name === 'paidFees' ? value : updated.paidFees) || 0;
      const net = Math.max(0, orig - disc);
      updated.totalFees = net;
      updated.remainingFees = Math.max(0, net - paid);
    }

    setEditFormData(updated);
    if (editErrors[name]) {
      setEditErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSaveEdit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const errs = {};
    if (!editFormData.fullName.trim()) errs.fullName = 'Student Full Name is required';
    const cleanMobile = editFormData.mobileNumber.replace(/\D/g, '');
    if (!cleanMobile || cleanMobile.length !== 10) errs.mobileNumber = 'Must be a 10-digit mobile number';
    const cleanParent = editFormData.parentPhone.replace(/\D/g, '');
    if (!cleanParent || cleanParent.length !== 10) {
      errs.parentPhone = 'Parent Mobile Number is required (10 digits)';
    } else if (cleanMobile && cleanMobile === cleanParent) {
      errs.parentPhone = 'Parent mobile must be different from student mobile';
    }

    if (Object.keys(errs).length > 0) {
      setEditErrors(errs);
      toast.error('Please correct the highlighted fields before saving.');
      return;
    }

    try {
      setEditSaving(true);
      const discAmount = Number(editFormData.discountAmount) || 0;
      const origFees = Number(editFormData.originalFees) || 0;
      const paidFees = Number(editFormData.paidFees) || 0;
      const netTotal = Math.max(0, origFees - discAmount);
      const remainingFees = Math.max(0, netTotal - paidFees);

      const payload = {
        fullName: editFormData.fullName.trim(),
        name: editFormData.fullName.trim(),
        rollNumber: editFormData.rollNumber.trim() || undefined,
        mobileNumber: cleanMobile,
        phone: cleanMobile,
        email: editFormData.email.trim() || undefined,
        parentName: editFormData.parentName.trim() || undefined,
        parentPhone: cleanParent,
        relation: editFormData.relation,
        gender: editFormData.gender,
        dob: editFormData.date_of_birth || undefined,
        address: editFormData.address.trim() || undefined,
        branch: editFormData.branch,
        session: editFormData.session || undefined,
        academicBatch: editFormData.academicBatch,
        standard: editFormData.standard,
        batch: `${editFormData.academicBatch} ${editFormData.branch}${editFormData.session ? ` (${editFormData.session})` : ''}`,
        originalFees: origFees,
        discountAmount: discAmount,
        discountReason: editFormData.discountReason || (discAmount > 0 ? 'Scholarship / Merit Concession' : ''),
        discountRecommendedBy: discAmount > 0 ? (editFormData.discountRecommendedBy || 'Miss Shilpa (Counselor)') : '',
        paidFees: paidFees,
        totalFees: netTotal,
        remainingFees: remainingFees,
        profileCompleted: true
      };

      await studentService.update(editingStudent.id, payload);

      if (discAmount > 0) {
        notificationService.addNotification({
          id: `NTF-DISC-${editingStudent.id}-${Date.now()}`,
          title: `🔔 Fee Concession Approval: ${editFormData.fullName}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          formattedDateTime: new Date().toLocaleString(),
          type: 'discount_approval',
          category: 'Discount & Fees',
          priority: 'High',
          author: editFormData.discountRecommendedBy?.trim() || 'Miss Shilpa (Counselor)',
          details: `${editFormData.discountRecommendedBy?.trim() || 'Counselor'} recommended a concession of ₹${discAmount.toLocaleString()} for ${editFormData.fullName} (${editFormData.academicBatch}). Superadmin approval is required.`,
          read: false,
          forSuperAdminOnly: true,
          branch: editFormData.branch,
          studentId: editingStudent.id,
          studentName: editFormData.fullName,
          discountAmount: discAmount,
          recommendedBy: editFormData.discountRecommendedBy?.trim() || 'Miss Shilpa'
        });
      }

      toast.success(`Onboarding & fee confirmation for ${editFormData.fullName} saved successfully!`);
      setShowEditModal(false);
      setEditingStudent(null);
      fetchStudents();
    } catch (err) {
      let msg = err.response?.data?.detail;
      if (Array.isArray(msg)) {
        msg = msg.map(m => m.msg || JSON.stringify(m)).join(', ');
      } else if (typeof msg === 'object' && msg !== null) {
        msg = JSON.stringify(msg);
      }
      toast.error(msg || err.message || 'Failed to update student details');
    } finally {
      setEditSaving(false);
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
    const headers = ['Roll Number', 'Student Name', 'Email', 'Class/Standard', 'Phone', 'Parent Phone', 'Attendance %', 'Fee Status'];
    const rows = filtered.map(s => [
      `"${s.rollNumber || ''}"`,
      `"${s.name || ''}"`,
      `"${s.email || ''}"`,
      `"${s.standard || ''}"`,
      `"${s.phone || ''}"`,
      `"${s.parentPhone || ''}"`,
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
    const headers = ['Roll Number', 'Full Name', 'Class / Standard', 'Email', 'Student Mobile', 'Parent Mobile'];
    const sample = [
      ['STD-101', 'Aarav Sharma', '11th Science', 'aarav.sharma@example.com', '+91 98220 11111', '+91 98220 22222'],
      ['STD-102', 'Ananya Deshmukh', '12th Science', 'ananya.d@example.com', '+91 98220 33333', '+91 98220 44444']
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
          batch: normalizedRow['batch'] || (activeBranch === 'Tarabai Park' ? '11th pcm tarabai park' : '11th pcm Mangalvar peth'),
          branch: activeBranch || 'Mangalvar Peth',
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
      branch: effectiveBranch,
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
      branch: effectiveBranch,
      session: filterSession,
      academicBatch: filterAcademicBatch
    });
    if (!matchesPlacement) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (s.name || '').toLowerCase().includes(q) ||
      (s.rollNumber || '').toLowerCase().includes(q) ||
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
            {filtered.length}
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
              {filteredDiscounts.length}
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
              {(filterSession || filterAcademicBatch || (isSuperAdmin && filterBranch)) && (
                <button
                  type="button"
                  className="btn btn-xs btn-outline-secondary py-0.5 px-2"
                  style={{ fontSize: '11px' }}
                  onClick={() => {
                    setFilterBranch(isSuperAdmin ? '' : defaultBranch);
                    setFilterSession('');
                    setFilterAcademicBatch('');
                  }}
                >
                  Reset Batch Filters
                </button>
              )}
            </div>
            <BranchBatchSelector
              branch={effectiveBranch}
              onBranchChange={isSuperAdmin ? setFilterBranch : undefined}
              session={filterSession}
              onSessionChange={setFilterSession}
              academicBatch={filterAcademicBatch}
              onAcademicBatchChange={setFilterAcademicBatch}
              showAllOption={isSuperAdmin}
              fixedBranch={!isSuperAdmin}
              allowedBranches={!isSuperAdmin && userBranchNormalized ? [userBranchNormalized] : undefined}
              layout="grid"
            />
          </div>

          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-3">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search by name, roll no, or class..."
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
                      className="btn btn-sm btn-light border p-1 text-primary"
                      title="Edit Student & Complete Onboarding"
                      onClick={() => handleOpenEditModal(row)}
                    >
                      <Edit size={15} />
                    </button>
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
                  <strong className="text-sa-charcoal">Expected Column Headers:</strong> Roll Number, Full Name, Class / Standard, Email, Student Mobile, Parent Mobile.
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

      {/* Complete Student Onboarding & Edit Modal */}
      {showEditModal && editingStudent && (
        <Modal
          isOpen={showEditModal}
          onClose={() => { setShowEditModal(false); setEditingStudent(null); }}
          title={
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <span>Complete Student Onboarding & Edit</span>
              <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2.5 py-1 rounded-pill" style={{ fontSize: '12px' }}>
                {editFormData.rollNumber || 'Enrolled Student'}
              </span>
            </div>
          }
          size="xl"
          maxWidth="940px"
          footer={
            <div className="d-flex align-items-center justify-content-between w-100 flex-wrap gap-2">
              <span className="small text-muted" style={{ fontSize: '12px' }}>
                ✓ Saving confirms fees, discount recommendation & marks profile <strong>Complete</strong>.
              </span>
              <div className="d-flex align-items-center gap-2">
                <Button variant="light" onClick={() => { setShowEditModal(false); setEditingStudent(null); }}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSaveEdit} disabled={editSaving}>
                  {editSaving ? 'Saving Changes...' : 'Save & Confirm Onboarding'}
                </Button>
              </div>
            </div>
          }
        >
          <form onSubmit={handleSaveEdit} noValidate>
            {/* Context Notice */}
            <div
              className="rounded-3 p-3 mb-3 d-flex align-items-start gap-2.5"
              style={{ backgroundColor: '#FFF8F0', border: '1px solid #FFE0B2' }}
            >
              <AlertTriangle size={18} className="text-warning flex-shrink-0 mt-0.5" />
              <div className="small text-sa-charcoal" style={{ fontSize: '12.5px', lineHeight: 1.45 }}>
                <strong>Onboarding Completion:</strong> When students are imported via Excel, basic information is registered while full parent details, fee confirmation, discount approval request, and starting pending dues remain pending. Complete the required remaining information below.
              </div>
            </div>

            {/* Section 1: Basic Information */}
            <div className="bg-light p-3 rounded-3 border mb-3">
              <div className="d-flex align-items-center gap-2 mb-2 pb-1 border-bottom">
                <User size={16} className="text-sa-primary" />
                <h6 className="fw-bold m-0 text-sa-charcoal" style={{ fontSize: '13.5px' }}>
                  1. Student Personal & Identification
                </h6>
              </div>
              <div className="row g-2.5">
                <div className="col-12 col-md-4">
                  <label className="form-label small fw-semibold text-sa-charcoal mb-1">
                    Student Full Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={editFormData.fullName}
                    onChange={handleEditInputChange}
                    className={`form-control form-control-sm ${editErrors.fullName ? 'is-invalid' : ''}`}
                    placeholder="Official Student Name"
                    required
                  />
                  {editErrors.fullName && <div className="invalid-feedback small">{editErrors.fullName}</div>}
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label small fw-semibold text-sa-charcoal mb-1">
                    Student Mobile Number <span className="text-danger">*</span>
                  </label>
                  <input
                    type="tel"
                    name="mobileNumber"
                    value={editFormData.mobileNumber}
                    onChange={handleEditInputChange}
                    maxLength={10}
                    className={`form-control form-control-sm ${editErrors.mobileNumber ? 'is-invalid' : ''}`}
                    placeholder="10-digit mobile"
                    required
                  />
                  {editErrors.mobileNumber && <div className="invalid-feedback small">{editErrors.mobileNumber}</div>}
                  <span className="text-muted" style={{ fontSize: '11px' }}>Used as default portal login password</span>
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label small fw-semibold text-sa-charcoal mb-1">
                    Student Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={editFormData.email}
                    onChange={handleEditInputChange}
                    className="form-control form-control-sm"
                    placeholder="student@example.com (Optional)"
                  />
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label small fw-semibold text-sa-charcoal mb-1">
                    Roll Number / Admission ID
                  </label>
                  <input
                    type="text"
                    name="rollNumber"
                    value={editFormData.rollNumber}
                    onChange={handleEditInputChange}
                    className="form-control form-control-sm"
                    placeholder="e.g. STD-110"
                  />
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label small fw-semibold text-sa-charcoal mb-1">Gender</label>
                  <select
                    name="gender"
                    value={editFormData.gender}
                    onChange={handleEditInputChange}
                    className="form-select form-select-sm"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label small fw-semibold text-sa-charcoal mb-1">Date of Birth</label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={editFormData.date_of_birth}
                    onChange={handleEditInputChange}
                    className="form-control form-control-sm"
                  />
                </div>

                <div className="col-12 col-md-8">
                  <label className="form-label small fw-semibold text-sa-charcoal mb-1">Residential Address</label>
                  <input
                    type="text"
                    name="address"
                    value={editFormData.address}
                    onChange={handleEditInputChange}
                    className="form-control form-control-sm"
                    placeholder="Local residential address, city"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Guardian & Academic Allocation */}
            <div className="bg-light p-3 rounded-3 border mb-3">
              <div className="d-flex align-items-center gap-2 mb-2 pb-1 border-bottom">
                <Phone size={16} className="text-sa-primary" />
                <h6 className="fw-bold m-0 text-sa-charcoal" style={{ fontSize: '13.5px' }}>
                  2. Parent / Guardian Details & Academic Allocation
                </h6>
              </div>
              <div className="row g-2.5">
                <div className="col-12 col-md-4">
                  <label className="form-label small fw-semibold text-sa-charcoal mb-1">
                    Parent / Guardian Full Name
                  </label>
                  <input
                    type="text"
                    name="parentName"
                    value={editFormData.parentName}
                    onChange={handleEditInputChange}
                    className="form-control form-control-sm"
                    placeholder="e.g. Ajay Sharma"
                  />
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label small fw-semibold text-sa-charcoal mb-1">
                    Parent Mobile Number <span className="text-danger">*</span>
                  </label>
                  <input
                    type="tel"
                    name="parentPhone"
                    value={editFormData.parentPhone}
                    onChange={handleEditInputChange}
                    maxLength={10}
                    className={`form-control form-control-sm ${editErrors.parentPhone ? 'is-invalid' : ''}`}
                    placeholder="10-digit mobile"
                    required
                  />
                  {editErrors.parentPhone && <div className="invalid-feedback small">{editErrors.parentPhone}</div>}
                  <span className="text-muted" style={{ fontSize: '11px' }}>Required for attendance & fee alerts</span>
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label small fw-semibold text-sa-charcoal mb-1">Relationship</label>
                  <select
                    name="relation"
                    value={editFormData.relation}
                    onChange={handleEditInputChange}
                    className="form-select form-select-sm"
                  >
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Guardian">Guardian</option>
                  </select>
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label small fw-semibold text-sa-charcoal mb-1">
                    Campus / Branch (Fixed)
                  </label>
                  <div className="input-group input-group-sm">
                    <input
                      type="text"
                      value={editFormData.branch}
                      disabled
                      readOnly
                      className="form-control form-control-sm bg-white fw-bold text-sa-charcoal"
                    />
                    <span className="input-group-text bg-white text-muted">
                      <Lock size={13} />
                    </span>
                  </div>
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label small fw-semibold text-sa-charcoal mb-1">Session</label>
                  <select
                    name="session"
                    value={editFormData.session}
                    onChange={handleEditInputChange}
                    className="form-select form-select-sm"
                  >
                    <option value="Morning">Morning Session</option>
                    <option value="Afternoon">Afternoon Session</option>
                    <option value="Evening">Evening Session</option>
                  </select>
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label small fw-semibold text-sa-charcoal mb-1">
                    Academic Batch & Stream <span className="text-danger">*</span>
                  </label>
                  <select
                    name="academicBatch"
                    value={editFormData.academicBatch}
                    onChange={handleEditInputChange}
                    className="form-select form-select-sm fw-semibold"
                  >
                    <option value="11th PCM">11th PCM (Physics, Chem, Maths)</option>
                    <option value="11th PCB">11th PCB (Physics, Chem, Bio)</option>
                    <option value="11th PCMB">11th PCMB (All Four Subjects)</option>
                    <option value="12th PCM">12th PCM (Physics, Chem, Maths)</option>
                    <option value="12th PCB">12th PCB (Physics, Chem, Bio)</option>
                    <option value="12th PCMB">12th PCMB (All Four Subjects)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: Fee Confirmation & Initial Payment */}
            <div
              className="p-3.5 rounded-3 border mb-3 shadow-2xs"
              style={{
                backgroundColor: '#FFFDF9',
                borderColor: '#FDBA74'
              }}
            >
              <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom flex-wrap gap-2">
                <div className="d-flex align-items-center gap-2">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center"
                    style={{ width: '30px', height: '30px', backgroundColor: '#FEF3C7', color: '#D97706' }}
                  >
                    <Coins size={16} />
                  </div>
                  <div>
                    <h6 className="fw-bold m-0 text-sa-charcoal" style={{ fontSize: '13.5px' }}>
                      3. Fee Confirmation & Initial Payment
                    </h6>
                    <span className="text-muted text-xs" style={{ fontSize: '11px' }}>
                      Standard curriculum tuition fee, initial admission payment, and pending dues balance
                    </span>
                  </div>
                </div>
                <span className="badge bg-light text-muted border px-2.5 py-1 rounded-pill small">
                  Financial Base
                </span>
              </div>

              <div className="row g-3">
                {/* Gross Course Fee */}
                <div className="col-12 col-md-4">
                  <div className="d-flex justify-content-between align-items-center mb-1" style={{ minHeight: '20px' }}>
                    <label className="form-label small fw-semibold text-sa-charcoal m-0">
                      Gross Course Fee (₹) <span className="text-danger">*</span>
                    </label>
                    <span className="badge bg-light text-muted border fw-normal" style={{ fontSize: '10px' }}>
                      Base Tuition
                    </span>
                  </div>
                  <div className="input-group input-group-sm">
                    <span className="input-group-text bg-white fw-bold text-muted border-end-0" style={{ fontSize: '13px' }}>
                      ₹
                    </span>
                    <input
                      type="number"
                      name="originalFees"
                      value={editFormData.originalFees}
                      onChange={handleEditInputChange}
                      min={0}
                      step={500}
                      className="form-control form-control-sm fw-bold border-start-0 text-sa-charcoal"
                      placeholder="e.g. 52000"
                      required
                    />
                  </div>
                  <span className="text-muted d-block mt-1" style={{ fontSize: '11px' }}>Standard curriculum tuition fee</span>
                </div>

                {/* Initial Downpayment / Paid Fees */}
                <div className="col-12 col-md-4">
                  <div className="d-flex justify-content-between align-items-center mb-1" style={{ minHeight: '20px' }}>
                    <label className="form-label small fw-semibold text-sa-charcoal m-0">
                      Initial Downpayment / Paid Fees (₹)
                    </label>
                    <span className="badge bg-success-subtle text-success border border-success-subtle fw-semibold" style={{ fontSize: '10px' }}>
                      Paid
                    </span>
                  </div>
                  <div className="input-group input-group-sm">
                    <span className="input-group-text bg-white fw-bold text-success border-end-0" style={{ fontSize: '13px' }}>
                      ₹
                    </span>
                    <input
                      type="number"
                      name="paidFees"
                      value={editFormData.paidFees}
                      onChange={handleEditInputChange}
                      min={0}
                      step={500}
                      className="form-control form-control-sm text-success fw-bold border-start-0"
                      placeholder="0"
                    />
                  </div>
                  <span className="text-muted d-block mt-1" style={{ fontSize: '11px' }}>Starting fee payment received</span>
                </div>

                {/* Starting Pending Dues */}
                <div className="col-12 col-md-4">
                  <div className="d-flex justify-content-between align-items-center mb-1" style={{ minHeight: '20px' }}>
                    <label className="form-label small fw-semibold text-sa-charcoal m-0">
                      Starting Pending Dues (₹)
                    </label>
                    <span className="badge bg-danger-subtle text-danger border border-danger-subtle fw-bold" style={{ fontSize: '10px' }}>
                      Balance
                    </span>
                  </div>
                  <div className="input-group input-group-sm">
                    <span className="input-group-text bg-light text-danger fw-bold border-end-0" style={{ fontSize: '13px' }}>
                      ₹
                    </span>
                    <input
                      type="text"
                      readOnly
                      value={Number(editFormData.remainingFees || 0).toLocaleString('en-IN')}
                      className="form-control form-control-sm fw-bold border-start-0 text-danger bg-light"
                    />
                  </div>
                  <span className="text-muted d-block mt-1" style={{ fontSize: '11px' }}>Net payable fee − Initial downpayment</span>
                </div>
              </div>
            </div>

            {/* Section 4: Fee Concession & Scholarship (Optional) */}
            <div
              className="p-3.5 rounded-3 border mb-2 shadow-2xs"
              style={{
                backgroundColor: '#FFFFFF',
                borderColor: '#E2E8F0'
              }}
            >
              <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom flex-wrap gap-2">
                <div className="d-flex align-items-center gap-2">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center"
                    style={{ width: '32px', height: '32px', backgroundColor: '#FDF0F0', color: '#8B1216' }}
                  >
                    <Tag size={18} />
                  </div>
                  <div>
                    <h6 className="fw-bold m-0 text-sa-charcoal" style={{ fontSize: '14px' }}>
                      4. Fee Concession & Scholarship (Optional)
                    </h6>
                    <span className="text-muted text-xs" style={{ fontSize: '11.5px' }}>
                      Recommend scholarship discount requiring Super Admin approval
                    </span>
                  </div>
                </div>

                <div>
                  {editingStudent?.discountStatus === 'APPROVED' ? (
                    <span className="badge bg-success bg-opacity-15 text-success border border-success border-opacity-25 px-2.5 py-1 rounded-pill small fw-semibold d-inline-flex align-items-center gap-1">
                      <CheckCircle size={12} />
                      Concession Approved by Superadmin
                    </span>
                  ) : Number(editFormData.discountAmount) > 0 ? (
                    <span className="badge bg-warning bg-opacity-20 text-warning-emphasis border border-warning px-2.5 py-1 rounded-pill small fw-semibold d-inline-flex align-items-center gap-1">
                      <Clock size={12} />
                      Superadmin Approval Required for Concessions
                    </span>
                  ) : (
                    <span className="badge bg-light text-muted border px-2.5 py-1 rounded-pill small">
                      Standard Tuition Policy
                    </span>
                  )}
                </div>
              </div>

              <div className="row g-3">
                {/* 1. Discount / Concession (₹) */}
                <div className="col-12 col-md-4">
                  <div className="d-flex justify-content-between align-items-center mb-1.5" style={{ minHeight: '24px' }}>
                    <label className="form-label small fw-semibold text-sa-charcoal m-0">
                      Discount / Concession (₹)
                    </label>
                    {Number(editFormData.discountAmount) > 0 ? (
                      <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle fw-bold" style={{ fontSize: '10px' }}>
                        - ₹{Number(editFormData.discountAmount).toLocaleString('en-IN')}
                      </span>
                    ) : (
                      <span className="badge bg-light text-muted border fw-normal" style={{ fontSize: '10px' }}>
                        ₹0
                      </span>
                    )}
                  </div>
                  <div className="input-group input-group-sm">
                    <span className="input-group-text bg-white fw-bold text-muted border-end-0" style={{ fontSize: '13px', height: '34px' }}>
                      ₹
                    </span>
                    <input
                      type="number"
                      name="discountAmount"
                      value={editFormData.discountAmount}
                      onChange={handleEditInputChange}
                      min={0}
                      max={Number(editFormData.originalFees) || 100000}
                      step={500}
                      className="form-control form-control-sm fw-bold border-start-0 text-warning-emphasis"
                      style={{ height: '34px' }}
                      placeholder="0"
                    />
                  </div>
                  <span className="text-muted d-block mt-1" style={{ fontSize: '11px', minHeight: '17px' }}>
                    Deducted from gross course fee
                  </span>
                </div>

                {/* 2. Concession Reason / Category (Optional) */}
                <div className="col-12 col-md-4">
                  <div className="d-flex justify-content-between align-items-center mb-1.5" style={{ minHeight: '24px' }}>
                    <label className="form-label small fw-semibold text-sa-charcoal m-0">
                      Concession Reason / Category
                    </label>
                    <span className="badge bg-light text-muted border fw-normal" style={{ fontSize: '10px' }}>
                      Optional
                    </span>
                  </div>
                  <input
                    type="text"
                    name="discountReason"
                    value={editFormData.discountReason}
                    onChange={handleEditInputChange}
                    placeholder="e.g., Merit Scholarship, Sibling"
                    className="form-control form-control-sm"
                    style={{ height: '34px' }}
                  />
                  <span className="text-muted d-block mt-1" style={{ fontSize: '11px', minHeight: '17px' }}>
                    Justification for discount approval
                  </span>
                </div>

                {/* 3. Recommended By (Staff / Counselor) (Optional) */}
                <div className="col-12 col-md-4">
                  <div className="d-flex justify-content-between align-items-center mb-1.5" style={{ minHeight: '24px' }}>
                    <label className="form-label small fw-semibold text-sa-charcoal m-0 text-nowrap">
                      Recommended By Staff
                    </label>
                    <span className="badge bg-light text-muted border fw-normal" style={{ fontSize: '10px' }}>
                      Optional
                    </span>
                  </div>
                  <input
                    type="text"
                    name="discountRecommendedBy"
                    value={editFormData.discountRecommendedBy}
                    onChange={handleEditInputChange}
                    placeholder="e.g., Miss Shilpa (Counselor)"
                    className="form-control form-control-sm"
                    style={{ height: '34px' }}
                  />
                  <span className="text-muted d-block mt-1" style={{ fontSize: '11px', minHeight: '17px' }}>
                    Authorizing officer recommending concession
                  </span>
                </div>

                {/* Full-width Quick Concession Presets Row */}
                <div className="col-12 mt-1">
                  <div
                    className="d-flex align-items-center gap-1.5 flex-wrap p-2 rounded-2"
                    style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
                  >
                    <span className="text-muted small fw-semibold me-1" style={{ fontSize: '11px' }}>
                      ⚡ Quick Presets:
                    </span>
                    {[
                      { label: '₹2,000', val: 2000 },
                      { label: '₹5,000', val: 5000 },
                      { label: '₹10,000', val: 10000 },
                      { label: '10% Off', val: '10%' },
                      { label: '20% Off', val: '20%' },
                      { label: 'Clear (₹0)', val: 0 }
                    ].map((preset) => {
                      const orig = Number(editFormData.originalFees) || 0;
                      const presetAmount = typeof preset.val === 'string' ? Math.round((orig * parseFloat(preset.val)) / 100) : preset.val;
                      const isSelected = Number(editFormData.discountAmount) === presetAmount;
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => handleApplyPresetDiscount(preset.val)}
                          className="btn btn-xs py-0.5 px-2.5 rounded-pill fw-semibold transition-all"
                          style={{
                            fontSize: '11px',
                            backgroundColor: isSelected ? '#FEF3C7' : '#FFFFFF',
                            color: isSelected ? '#B45309' : '#475569',
                            border: isSelected ? '1.5px solid #F59E0B' : '1px solid #CBD5E1'
                          }}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Concession Notice when discount > 0 */}
                {Number(editFormData.discountAmount) > 0 && (
                  <div className="col-12">
                    <div
                      className="p-2.5 rounded-2 d-flex align-items-center gap-2 small"
                      style={{ backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', color: '#92400E' }}
                    >
                      <ShieldCheck size={16} className="text-warning-emphasis flex-shrink-0" />
                      <span style={{ fontSize: '11.5px', lineHeight: 1.4 }}>
                        <strong>Concession Policy:</strong> Concession request of ₹{Number(editFormData.discountAmount).toLocaleString('en-IN')} reduces standard course fee from ₹{Number(editFormData.originalFees).toLocaleString('en-IN')} to ₹{Math.max(0, Number(editFormData.originalFees) - Number(editFormData.discountAmount)).toLocaleString('en-IN')}. Super Admin approval is logged automatically.
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Fee Collection Progress Bar (matching Image 2) */}
              <div
                className="mt-3 p-2.5 rounded-3"
                style={{ backgroundColor: '#F8F9FA', border: '1px solid #E9ECEF' }}
              >
                <div className="d-flex justify-content-between align-items-center mb-1 small">
                  <span className="text-muted fw-semibold" style={{ fontSize: '11.5px' }}>Fee Collection Progress:</span>
                  <span className="fw-bold text-sa-charcoal" style={{ fontSize: '12px' }}>
                    ₹{Number(editFormData.paidFees || 0).toLocaleString('en-IN')} of ₹
                    {Number(editFormData.totalFees || 0).toLocaleString('en-IN')} (
                    {editFormData.totalFees > 0
                      ? Math.round(((Number(editFormData.paidFees) || 0) / Number(editFormData.totalFees)) * 100)
                      : 0}
                    %)
                  </span>
                </div>
                <div className="progress" style={{ height: '7px', borderRadius: '4px' }}>
                  <div
                    className="progress-bar transition-all"
                    role="progressbar"
                    style={{
                      width: `${
                        editFormData.totalFees > 0
                          ? Math.min(100, ((Number(editFormData.paidFees) || 0) / Number(editFormData.totalFees)) * 100)
                          : 0
                      }%`,
                      backgroundColor: '#8B1216',
                      borderRadius: '4px'
                    }}
                  />
                </div>
              </div>

              {/* Real-time 5-Card Financial Breakdown Banner */}
              <div className="row g-2 mt-2 pt-2 border-top">
                <div className="col-6 col-md">
                  <div className="p-2 rounded-2 bg-white border text-center h-100 shadow-2xs">
                    <span className="small text-muted d-block" style={{ fontSize: '10.5px' }}>1. Gross Tuition</span>
                    <strong className="text-sa-charcoal d-block mt-0.5" style={{ fontSize: '14.5px' }}>
                      ₹{Number(editFormData.originalFees || 0).toLocaleString('en-IN')}
                    </strong>
                    <span className="text-muted text-xs" style={{ fontSize: '10px' }}>Standard Fee</span>
                  </div>
                </div>

                <div className="col-6 col-md">
                  <div
                    className="p-2 rounded-2 bg-white border text-center h-100 shadow-2xs"
                    style={{ borderColor: Number(editFormData.discountAmount) > 0 ? '#FCD34D' : '#E2E8F0' }}
                  >
                    <span className="small text-muted d-block" style={{ fontSize: '10.5px' }}>2. Concession</span>
                    <strong className="d-block mt-0.5 text-warning-emphasis" style={{ fontSize: '14.5px' }}>
                      {Number(editFormData.discountAmount) > 0 ? `- ₹${Number(editFormData.discountAmount).toLocaleString('en-IN')}` : '₹0'}
                    </strong>
                    <span className="text-muted text-xs" style={{ fontSize: '10px' }}>
                      {Number(editFormData.discountAmount) > 0 ? 'Concession Applied' : 'No Concession'}
                    </span>
                  </div>
                </div>

                <div className="col-6 col-md">
                  <div className="p-2 rounded-2 bg-white border text-center h-100 shadow-2xs" style={{ borderColor: '#93C5FD', backgroundColor: '#F0F9FF' }}>
                    <span className="small text-muted d-block" style={{ fontSize: '10.5px' }}>3. Net Course Fee</span>
                    <strong className="d-block mt-0.5 text-primary fw-bold" style={{ fontSize: '14.5px' }}>
                      ₹{Math.max(0, Number(editFormData.originalFees || 0) - Number(editFormData.discountAmount || 0)).toLocaleString('en-IN')}
                    </strong>
                    <span className="text-primary text-opacity-75 text-xs fw-semibold" style={{ fontSize: '10px' }}>Net Payable</span>
                  </div>
                </div>

                <div className="col-6 col-md">
                  <div className="p-2 rounded-2 bg-white border text-center h-100 shadow-2xs">
                    <span className="small text-muted d-block" style={{ fontSize: '10.5px' }}>4. Downpayment</span>
                    <strong className="d-block mt-0.5 text-success" style={{ fontSize: '14.5px' }}>
                      ₹{Number(editFormData.paidFees || 0).toLocaleString('en-IN')}
                    </strong>
                    <span className="text-success text-opacity-75 text-xs" style={{ fontSize: '10px' }}>Paid to Date</span>
                  </div>
                </div>

                <div className="col-12 col-md">
                  <div
                    className="p-2 rounded-2 border text-center h-100 shadow-2xs"
                    style={{ backgroundColor: '#FFF5F5', borderColor: '#FCA5A5' }}
                  >
                    <span className="small text-danger d-block fw-semibold" style={{ fontSize: '10.5px' }}>5. Pending Dues</span>
                    <strong className="d-block mt-0.5 text-danger fw-extrabold" style={{ fontSize: '15px' }}>
                      ₹{Math.max(0, Math.max(0, Number(editFormData.originalFees || 0) - Number(editFormData.discountAmount || 0)) - Number(editFormData.paidFees || 0)).toLocaleString('en-IN')}
                    </strong>
                    <span className="text-danger text-opacity-75 text-xs" style={{ fontSize: '10px' }}>Net − Paid</span>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

