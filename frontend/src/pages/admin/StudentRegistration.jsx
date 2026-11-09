import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import BackButton from '../../components/common/BackButton';
import {
  User,
  Phone,
  CreditCard,
  AlertCircle,
  FileText,
  ShieldCheck,
  Lock,
  UserCheck,
  Mail,
  GraduationCap,
  Users,
  Tag,
  ArrowRight,
  RotateCcw,
  Layers
} from 'lucide-react';
import studentService from '../../services/studentService';
import batchService from '../../services/batchService';
import feeService from '../../services/feeService';
import notificationService from '../../services/notificationService';
import { useAuth } from '../../hooks/useAuth';
import BranchBatchSelector from '../../components/common/BranchBatchSelector';
import {
  BRANCH_TARABAI,
  BRANCH_MANGALWAR,
  ACADEMIC_BATCHES,
  isSessionRequired,
  formatStudentBatchDisplay
} from '../../config/branchBatchConfig';
import { getUserBranch } from '../../utils/branchUtils';

export const STANDARD_BATCHES = [
  '11th PCM',
  '11th PCB',
  '11th PCMB',
  '12th PCM',
  '12th PCB',
  '12th PCMB'
];

export const getMatchingCourseFee = (structures, branch, academicBatch, standard, fallbackFee = 55000) => {
  if (!structures || structures.length === 0) return fallbackFee;
  
  const bLower = (branch || '').toLowerCase();
  const isMangal = bLower.includes('mangal');
  const std = standard || (academicBatch?.startsWith('12th') ? '12th Science' : '11th Science');
  const batchStr = (academicBatch || '').toLowerCase();
  
  // Extract stream: 'pcmb', 'pcb', 'pcm'
  let stream = '';
  if (batchStr.includes('pcmb')) stream = 'pcmb';
  else if (batchStr.includes('pcb')) stream = 'pcb';
  else if (batchStr.includes('pcm')) stream = 'pcm';
  
  // 1. Exact match: branch + standard + specific stream
  if (stream) {
    const streamMatch = structures.find(s => {
      const sBranch = (s.branch || '').toLowerCase();
      const sBatch = (s.batch || '').toLowerCase();
      const sStd = (s.standard || '').toLowerCase();
      const branchMatches = isMangal ? sBranch.includes('mangal') : (sBranch.includes('tarabai') || !sBranch.includes('mangal'));
      const stdMatches = sStd.includes(std.startsWith('12') ? '12' : '11');
      if (!branchMatches || !stdMatches) return false;
      
      if (stream === 'pcmb') return sBatch.includes('pcmb');
      if (stream === 'pcm') return sBatch.includes('pcm') && !sBatch.includes('pcmb');
      if (stream === 'pcb') return sBatch.includes('pcb') && !sBatch.includes('pcmb');
      return false;
    });
    if (streamMatch && streamMatch.total_fee > 0) return streamMatch.total_fee;
  }
  
  // 2. Branch + batch name includes academic batch
  const batchMatch = structures.find(s => {
    const sBranch = (s.branch || '').toLowerCase();
    const sBatch = (s.batch || '').toLowerCase();
    const branchMatches = isMangal ? sBranch.includes('mangal') : (sBranch.includes('tarabai') || !sBranch.includes('mangal'));
    return branchMatches && sBatch.includes(batchStr);
  });
  if (batchMatch && batchMatch.total_fee > 0) return batchMatch.total_fee;

  // 3. Branch + standard match
  const stdMatch = structures.find(s => {
    const sBranch = (s.branch || '').toLowerCase();
    const sStd = (s.standard || '').toLowerCase();
    const branchMatches = isMangal ? sBranch.includes('mangal') : (sBranch.includes('tarabai') || !sBranch.includes('mangal'));
    return branchMatches && sStd.includes(std.startsWith('12') ? '12' : '11');
  });
  if (stdMatch && stdMatch.total_fee > 0) return stdMatch.total_fee;

  return fallbackFee;
};

export default function StudentRegistration() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuperAdmin = (user?.role || '').toLowerCase().includes('super');
  const activeBranch = getUserBranch(user);
  const isMangal = Boolean(activeBranch && activeBranch.toLowerCase().includes('mangal'));
  const initialBranch = isMangal ? BRANCH_MANGALWAR : (activeBranch || BRANCH_TARABAI);
  const [loading, setLoading] = useState(false);
  const [batches, setBatches] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [feeStructures, setFeeStructures] = useState([]);

  // Admin Role-Based Form State:
  // Admin fills: Student Name, Student Email ID, Student Mobile, Parent Mobile, Branch, Session, Academic Batch, Fee Details
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobileNumber: '',
    parentPhone: '',
    rollNumber: '',
    admissionType: '11th Standard Only', // '11th Standard Only', '12th Standard Only', '11th + 12th Standard (Two-Year Admission)'
    branch: initialBranch,
    session: isMangal ? 'Morning' : '',
    academicBatch: '11th PCM',
    standard: '11th Science',
    batch: `${initialBranch} • ${isMangal ? 'Morning • ' : ''}11th PCM`,
    secondYearAcademicBatch: '12th PCM',
    secondYearAcademicYear: '2026-2027',
    secondYearSession: isMangal ? 'Morning' : '',
    originalFees: 55000,
    concessionType: 'fixed', // 'fixed', 'percentage', 'custom'
    concessionValue: 0,
    discountAmount: 0,
    discountReason: '',
    discountRecommendedBy: 'Miss Shilpa (Counselor)',
    totalFees: 55000,
    paidFees: 15000,
    remainingFees: 40000,
    password: '',
    admissionDate: new Date().toISOString().split('T')[0]
  });

  const [errors, setErrors] = useState({});
  const [existingStudents, setExistingStudents] = useState([]);

  // Dynamic fee calculation engine
  const computeAdmissionFees = (
    admType,
    branch,
    batch1,
    batch2,
    cType,
    cVal,
    paidInput,
    customOrig = null
  ) => {
    const isTwo = admType === '11th + 12th Standard (Two-Year Admission)';
    const is12 = admType === '12th Standard Only';

    const y1Std = is12 ? '12th Science' : '11th Science';
    const fee1 = getMatchingCourseFee(feeStructures, branch, batch1, y1Std, is12 ? 65000 : 55000);

    let fee2 = 0;
    if (isTwo) {
      const y2Std = '12th Science';
      const b2 = batch2 || '12th PCM';
      fee2 = getMatchingCourseFee(feeStructures, branch, b2, y2Std, 65000);
    }

    const grossOriginal = customOrig !== null && customOrig > 0 ? customOrig : (isTwo ? (fee1 + fee2) : fee1);

    let disc = 0;
    const numericVal = Number(cVal) || 0;
    if (cType === 'percentage') {
      disc = Math.round((grossOriginal * numericVal) / 100);
    } else if (cType === 'custom') {
      disc = numericVal;
    } else {
      disc = numericVal;
    }
    disc = Math.min(grossOriginal, Math.max(0, disc));

    const net = Math.max(0, grossOriginal - disc);
    const paid = Number(paidInput) || 0;
    const rem = Math.max(0, net - paid);

    return {
      fee1,
      fee2,
      grossOriginal,
      discountAmount: disc,
      netTotal: net,
      paidFees: paid,
      remainingFees: rem
    };
  };

  useEffect(() => {
    studentService.getAll()
      .then((data) => {
        if (Array.isArray(data)) {
          setExistingStudents(data);
        }
      })
      .catch((err) => console.warn('Could not load existing students for uniqueness check:', err));
  }, []);

  useEffect(() => {
    studentService.getNextRollNumber(activeBranch)
      .then((nextRoll) => {
        if (nextRoll) {
          setFormData(prev => ({ ...prev, rollNumber: prev.rollNumber || nextRoll }));
        }
      })
      .catch((err) => console.warn('Could not fetch next roll number:', err));
  }, [activeBranch]);

  useEffect(() => {
    if (activeBranch) {
      const isMP = activeBranch.toLowerCase().includes('mangal');
      const targetBranch = isMP ? BRANCH_MANGALWAR : BRANCH_TARABAI;
      const targetSession = isMP ? (formData.session || 'Morning') : '';
      const currentAcademic = formData.academicBatch || '11th PCM';
      const std = currentAcademic.startsWith('12th') ? '12th Science' : '11th Science';
      const fullBatch = `${currentAcademic} ${targetBranch}${targetSession ? ` (${targetSession})` : ''}`;

      setFormData(prev => {
        const calc = computeAdmissionFees(
          prev.admissionType,
          targetBranch,
          currentAcademic,
          prev.secondYearAcademicBatch,
          prev.concessionType,
          prev.concessionValue,
          prev.paidFees
        );
        return {
          ...prev,
          branch: targetBranch,
          session: targetSession,
          academicBatch: currentAcademic,
          standard: std,
          batch: fullBatch,
          originalFees: calc.grossOriginal,
          discountAmount: calc.discountAmount,
          totalFees: calc.netTotal,
          remainingFees: calc.remainingFees
        };
      });
    }
  }, [activeBranch]);

  useEffect(() => {
    feeService.getStructures(activeBranch).then((data) => {
      if (Array.isArray(data)) {
        setFeeStructures(data);
        setFormData(prev => {
          const isTwo = prev.admissionType === '11th + 12th Standard (Two-Year Admission)';
          const is12 = prev.admissionType === '12th Standard Only';
          const y1Std = is12 ? '12th Science' : '11th Science';
          const fee1 = getMatchingCourseFee(data, prev.branch, prev.academicBatch, y1Std, is12 ? 65000 : 55000);
          const fee2 = isTwo ? getMatchingCourseFee(data, prev.branch, prev.secondYearAcademicBatch || '12th PCM', '12th Science', 65000) : 0;
          const gross = isTwo ? (fee1 + fee2) : fee1;

          let disc = 0;
          const numericVal = Number(prev.concessionValue) || Number(prev.discountAmount) || 0;
          if (prev.concessionType === 'percentage') {
            disc = Math.round((gross * numericVal) / 100);
          } else {
            disc = numericVal;
          }
          disc = Math.min(gross, Math.max(0, disc));
          const net = Math.max(0, gross - disc);
          const paid = Number(prev.paidFees) || 0;

          return {
            ...prev,
            originalFees: gross,
            discountAmount: disc,
            totalFees: net,
            remainingFees: Math.max(0, net - paid)
          };
        });
      }
    }).catch((err) => console.warn('Could not load fee structures:', err));
  }, [activeBranch]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let updated = { ...formData, [name]: value };

    // When mobile number is typed, keep password synced to mobile number
    if (name === 'mobileNumber') {
      const clean = value.replace(/\D/g, '');
      updated.password = clean;
    }

    if (name === 'admissionType') {
      const is12 = value === '12th Standard Only';
      const curBatch = is12 ? (formData.academicBatch.startsWith('12') ? formData.academicBatch : '12th PCM') : (formData.academicBatch.startsWith('11') ? formData.academicBatch : '11th PCM');
      const curStd = is12 ? '12th Science' : '11th Science';
      const stream = curBatch.includes('PCMB') ? 'PCMB' : (curBatch.includes('PCB') ? 'PCB' : 'PCM');
      const y2Batch = `12th ${stream}`;

      const calc = computeAdmissionFees(value, formData.branch, curBatch, y2Batch, formData.concessionType, formData.concessionValue, formData.paidFees);
      updated.admissionType = value;
      updated.academicBatch = curBatch;
      updated.standard = curStd;
      updated.secondYearAcademicBatch = y2Batch;
      updated.originalFees = calc.grossOriginal;
      updated.discountAmount = calc.discountAmount;
      updated.totalFees = calc.netTotal;
      updated.remainingFees = calc.remainingFees;
    }

    if (name === 'concessionType' || name === 'concessionValue') {
      const cType = name === 'concessionType' ? value : updated.concessionType;
      const cVal = name === 'concessionValue' ? Number(value) : Number(updated.concessionValue);
      const calc = computeAdmissionFees(updated.admissionType, updated.branch, updated.academicBatch, updated.secondYearAcademicBatch, cType, cVal, updated.paidFees, Number(updated.originalFees));
      updated.concessionType = cType;
      updated.concessionValue = cVal;
      updated.discountAmount = calc.discountAmount;
      updated.totalFees = calc.netTotal;
      updated.remainingFees = calc.remainingFees;
    }

    if (name === 'secondYearAcademicBatch') {
      const calc = computeAdmissionFees(updated.admissionType, updated.branch, updated.academicBatch, value, updated.concessionType, updated.concessionValue, updated.paidFees);
      updated.secondYearAcademicBatch = value;
      updated.originalFees = calc.grossOriginal;
      updated.discountAmount = calc.discountAmount;
      updated.totalFees = calc.netTotal;
      updated.remainingFees = calc.remainingFees;
    }

    // Real-time calculation for Fees with Discount
    if (name === 'originalFees' || name === 'discountAmount' || name === 'totalFees' || name === 'paidFees') {
      const orig = Number(name === 'originalFees' ? value : updated.originalFees) || 0;
      const disc = Number(name === 'discountAmount' ? value : updated.discountAmount) || 0;
      const net = Math.max(0, orig - disc);
      const paid = Number(name === 'paidFees' ? value : updated.paidFees) || 0;
      updated.totalFees = net;
      updated.remainingFees = Math.max(0, net - paid);
    }

    setFormData(updated);

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleBranchChange = (newBranch) => {
    const sessionNeeded = isSessionRequired(newBranch);
    const newSession = sessionNeeded ? (formData.session || 'Morning') : '';
    const currentAcademic = formData.academicBatch || '11th PCM';
    const is12 = formData.admissionType === '12th Standard Only';
    const std = is12 ? '12th Science' : '11th Science';
    const fullBatch = `${currentAcademic} ${newBranch}${newSession ? ` (${newSession})` : ''}`;

    const calc = computeAdmissionFees(formData.admissionType, newBranch, currentAcademic, formData.secondYearAcademicBatch, formData.concessionType, formData.concessionValue, formData.paidFees);

    setFormData((prev) => ({
      ...prev,
      branch: newBranch,
      session: newSession,
      academicBatch: currentAcademic,
      batch: fullBatch,
      standard: std,
      originalFees: calc.grossOriginal,
      discountAmount: calc.discountAmount,
      totalFees: calc.netTotal,
      remainingFees: calc.remainingFees
    }));

    setErrors((prev) => ({ ...prev, branch: '', session: '', academicBatch: '' }));
  };

  const handleSessionChange = (newSession) => {
    const currentAcademic = formData.academicBatch || '11th PCM';
    const fullBatch = `${currentAcademic} ${formData.branch}${newSession ? ` (${newSession})` : ''}`;
    setFormData((prev) => ({
      ...prev,
      session: newSession,
      batch: fullBatch
    }));
    setErrors((prev) => ({ ...prev, session: '' }));
  };

  const handleAcademicBatchChange = (newAcademicBatch) => {
    const is12 = formData.admissionType === '12th Standard Only';
    const std = is12 ? '12th Science' : '11th Science';
    const stream = newAcademicBatch.includes('PCMB') ? 'PCMB' : (newAcademicBatch.includes('PCB') ? 'PCB' : 'PCM');
    const y2Batch = `12th ${stream}`;
    const fullBatch = `${newAcademicBatch} ${formData.branch}${formData.session ? ` (${formData.session})` : ''}`;

    const calc = computeAdmissionFees(formData.admissionType, formData.branch, newAcademicBatch, y2Batch, formData.concessionType, formData.concessionValue, formData.paidFees);

    setFormData((prev) => ({
      ...prev,
      academicBatch: newAcademicBatch,
      batch: fullBatch,
      standard: std,
      secondYearAcademicBatch: y2Batch,
      originalFees: calc.grossOriginal,
      discountAmount: calc.discountAmount,
      totalFees: calc.netTotal,
      remainingFees: calc.remainingFees
    }));

    setErrors((prev) => ({ ...prev, academicBatch: '', batch: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.fullName.trim()) {
      errs.fullName = 'Student Full Name is required';
    } else if (formData.fullName.trim().length < 3) {
      errs.fullName = 'Full Name must be at least 3 characters';
    }

    const cleanEmail = (formData.email || '').trim().toLowerCase();
    if (!cleanEmail) {
      errs.email = 'Student Email ID is required (Used as portal User ID)';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      errs.email = 'Please enter a valid email address';
    } else if (existingStudents.some(s => (s.email || '').trim().toLowerCase() === cleanEmail)) {
      errs.email = 'This Email ID is already registered for another student';
    }

    const cleanMobile = formData.mobileNumber.replace(/\D/g, '');
    if (!cleanMobile) {
      errs.mobileNumber = 'Student Mobile Number is required (Used as default Password)';
    } else if (cleanMobile.length !== 10) {
      errs.mobileNumber = 'Must be a valid 10-digit mobile number';
    } else if (existingStudents.some(s => {
      const sMob = (s.mobile_number || s.phone || '').replace(/\D/g, '');
      return sMob && sMob.endsWith(cleanMobile);
    })) {
      errs.mobileNumber = 'This Mobile Number is already registered for another student';
    }

    const cleanParentMobile = formData.parentPhone.replace(/\D/g, '');
    if (!cleanParentMobile) {
      errs.parentPhone = 'Parent Mobile Number is required for alerts';
    } else if (cleanParentMobile.length !== 10) {
      errs.parentPhone = 'Must be a valid 10-digit mobile number';
    } else if (cleanMobile && cleanMobile === cleanParentMobile) {
      errs.parentPhone = 'Parent mobile must be different from student mobile';
    }

    if (!formData.branch) {
      errs.branch = 'Please select a branch';
    }
    if (isSessionRequired(formData.branch) && !formData.session) {
      errs.session = 'Please select Morning or Afternoon session';
    }
    if (!formData.academicBatch) {
      errs.academicBatch = 'Please select an academic batch';
    }

    const orig = Number(formData.originalFees);
    const disc = Number(formData.discountAmount);
    const total = Number(formData.totalFees);
    const paid = Number(formData.paidFees);

    if (isNaN(orig) || orig < 0) {
      errs.originalFees = 'Course fee must be a valid positive amount';
    }
    if (isNaN(disc) || disc < 0) {
      errs.discountAmount = 'Discount amount cannot be negative';
    } else if (disc > orig) {
      errs.discountAmount = 'Discount cannot exceed course fee';
    }
    if (isNaN(total) || total < 0) {
      errs.totalFees = 'Total fee must be a valid positive amount';
    }
    if (isNaN(paid) || paid < 0) {
      errs.paidFees = 'Paid fee amount cannot be negative';
    } else if (paid > total) {
      errs.paidFees = 'Paid amount cannot exceed total course fee';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please correct the highlighted fields before submitting.');
      return;
    }

    setLoading(true);
    try {
      const cleanMobile = formData.mobileNumber.replace(/\D/g, '');
      const cleanParentMobile = formData.parentPhone.replace(/\D/g, '');
      const discAmount = Number(formData.discountAmount) || 0;
      const origFees = Number(formData.originalFees) || 0;
      const paidFees = Number(formData.paidFees) || 0;
      const effectiveTotalFees = Math.max(0, origFees - discAmount);
      const remainingFees = Math.max(0, effectiveTotalFees - paidFees);

      const payload = {
        name: formData.fullName.trim(),
        full_name: formData.fullName.trim(),
        rollNumber: formData.rollNumber?.trim() || undefined,
        student_id: formData.rollNumber?.trim() || undefined,
        email: formData.email?.trim() || undefined,
        phone: cleanMobile,
        mobile_number: cleanMobile,
        parentPhone: cleanParentMobile,
        parent_mobile: cleanParentMobile,
        branch: formData.branch,
        session: formData.session || undefined,
        academic_batch: formData.academicBatch,
        academicBatch: formData.academicBatch,
        standard: formData.standard || undefined,
        batch: formData.batch || `${formData.academicBatch} ${formData.branch}`,
        totalFees: effectiveTotalFees,
        total_fees: effectiveTotalFees,
        original_fees: origFees,
        discountAmount: discAmount,
        discount_amount: discAmount,
        discountRequestedAmount: discAmount,
        discount_requested_amount: discAmount,
        discountReason: formData.discountReason || (discAmount > 0 ? 'Scholarship / Merit Concession' : ''),
        discount_reason: formData.discountReason || (discAmount > 0 ? 'Scholarship / Merit Concession' : ''),
        discountRecommendedBy: discAmount > 0 ? (formData.discountRecommendedBy || 'Miss Shilpa (Counselor)') : '',
        discount_recommended_by: discAmount > 0 ? (formData.discountRecommendedBy || 'Miss Shilpa (Counselor)') : '',
        discountOfferedBy: discAmount > 0 ? (formData.discountRecommendedBy || 'Miss Shilpa (Counselor)') : '',
        discount_offered_by: discAmount > 0 ? (formData.discountRecommendedBy || 'Miss Shilpa (Counselor)') : '',
        paidFees: paidFees,
        paid_fees: paidFees,
        remainingFees: remainingFees,
        remaining_fees: remainingFees,
        password: formData.password || formData.mobileNumber?.replace(/\D/g, '') || undefined,
        admission_date: new Date(formData.admissionDate).toISOString(),
        admission_type: formData.admissionType,
        admissionType: formData.admissionType,
        concession_type: formData.concessionType,
        concessionType: formData.concessionType,
        concession_value: Number(formData.concessionValue) || discAmount,
        second_year_standard: '12th Science',
        second_year_academic_batch: formData.admissionType === '11th + 12th Standard (Two-Year Admission)' ? formData.secondYearAcademicBatch : undefined,
        second_year_academic_year: formData.admissionType === '11th + 12th Standard (Two-Year Admission)' ? (formData.secondYearAcademicYear || '2026-2027') : undefined,
        second_year_batch: formData.admissionType === '11th + 12th Standard (Two-Year Admission)' ? `${formData.secondYearAcademicBatch} ${formData.branch}` : undefined,
        second_year_session: formData.admissionType === '11th + 12th Standard (Two-Year Admission)' ? (formData.secondYearSession || formData.session) : undefined
      };

      const result = await studentService.create(payload);

      // If discount was recommended, submit real-time notification to Superadmin dashboard
      if (discAmount > 0) {
        try {
          notificationService.addNotification({
            id: `NTF-DISC-${result?.id || Date.now()}`,
            title: `🔔 Fee Concession Approval: ${formData.fullName}`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            formattedDateTime: new Date().toLocaleString(),
            type: 'discount_approval',
            category: 'Discount & Fees',
            priority: 'High',
            author: formData.discountRecommendedBy?.trim() || 'Miss Shilpa (Counselor)',
            details: `${formData.discountRecommendedBy?.trim() || 'Counselor'} recommended a concession of ₹${discAmount.toLocaleString()} for ${formData.fullName} (${formData.batch || formData.standard || 'Course'}). Superadmin approval is required before student ledger updates.`,
            read: false,
            forSuperAdminOnly: true,
            branch: activeBranch,
            studentId: result?.id,
            studentName: formData.fullName,
            discountAmount: discAmount,
            recommendedBy: formData.discountRecommendedBy?.trim() || 'Miss Shilpa'
          });
        } catch (notifErr) {
          console.warn('Could not add local concession notification:', notifErr);
        }
      }

      toast.success(
        discAmount > 0
          ? `Student ${formData.fullName} successfully registered! Concession of ₹${discAmount.toLocaleString()} submitted to Superadmin for approval.`
          : `Student ${formData.fullName} successfully registered to ${formData.batch || 'Batch'}! ID: ${result?.student_id || result?.rollNumber || 'Created'}`
      );
      navigate('/admin/students');
    } catch (error) {
      console.error('Registration failed:', error);
      const detail = error.response?.data?.detail;
      let errMsg = 'Failed to register student';
      if (typeof detail === 'string') {
        errMsg = detail;
      } else if (Array.isArray(detail) && detail.length > 0) {
        const item = detail[0];
        const fieldName = Array.isArray(item.loc) ? item.loc.filter(l => l !== 'body' && l !== 'response').join(' ') : '';
        errMsg = fieldName ? `${fieldName}: ${item.msg}` : (item.msg || 'Validation error');
      } else if (error.message === 'Network Error') {
        errMsg = 'Network Error: Cannot reach backend server. Please verify backend is active at port 8000.';
      } else if (error.message) {
        errMsg = error.message;
      }
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid px-0 px-md-3 py-2" style={{ maxWidth: '1100px' }}>
      {/* Top Header & Breadcrumb */}
      <div className="mb-3">
        <BackButton to="/admin/students" label="Back to Student Directory" />
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mt-2">
          <div>
            <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
              Student Registration
            </h3>
            <span className="small text-sa-muted">
              Admin Entry: Fill in initial basic details and fee structure. Student completes the rest after login.
            </span>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/admin/students')}
              className="btn d-inline-flex align-items-center gap-2 px-3 py-1.5 rounded-2 fw-semibold transition-all shadow-sm"
              style={{
                border: '1.5px solid #8B1216',
                color: '#8B1216',
                fontSize: '0.85rem',
                backgroundColor: '#FFFFFF'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#8B1216';
                e.currentTarget.style.color = '#FFFFFF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#FFFFFF';
                e.currentTarget.style.color = '#8B1216';
              }}
            >
              <span>View All Students</span>
              <ArrowRight size={14} />
            </button>

            <span
              className="badge py-2 px-3 rounded-pill fw-semibold"
              style={{
                backgroundColor: 'rgba(139, 18, 22, 0.08)',
                color: '#8B1216',
                border: '1px solid rgba(139, 18, 22, 0.2)'
              }}
            >
              <ShieldCheck size={14} className="me-1 inline-block" /> Role-Based Data Entry
            </span>
          </div>
        </div>
      </div>

      {/* Info Notice Box */}
      <div
        className="rounded-3 p-3 mb-4 d-flex align-items-start gap-3"
        style={{
          backgroundColor: '#FFF8F0',
          border: '1px solid #FFE0B2'
        }}
      >
        <AlertCircle size={20} className="text-warning flex-shrink-0 mt-0.5" />
        <div className="small text-sa-charcoal">
          <strong>Workflow Note:</strong> The Admin registers the student with their name, contact details, assigned
          study batch, and course fees. These fields are permanently locked (read-only) for the student. The student
          will log in to their dashboard to complete their remaining personal and profile details.
        </div>
      </div>

      {/* Registration Form & Summary Container */}
      <div className="row g-4">
        {/* Main Form Column */}
        <div className="col-12 col-lg-8">
          <form onSubmit={handleSubmit} noValidate>
            <div className="bg-white rounded-3 border shadow-sm p-4 mb-4">
              {/* Section 1: Basic Information */}
              <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: '32px', height: '32px', backgroundColor: '#FDF0F0', color: '#8B1216' }}
                >
                  <User size={18} />
                </div>
                <div>
                  <h6 className="fw-bold m-0 text-sa-charcoal">1. Student & Parent Contact Details</h6>
                  <span className="text-muted small" style={{ fontSize: '0.8rem' }}>
                    Admin-entered basic identification
                  </span>
                </div>
              </div>

              <div className="row g-3 mb-4">
                {/* Student Full Name */}
                <div className="col-12 col-md-6">
                  <div className="d-flex justify-content-between align-items-center mb-1.5" style={{ minHeight: '24px' }}>
                    <label className="form-label small fw-semibold text-sa-charcoal m-0 text-nowrap">
                      Student Full Name <span className="text-danger">*</span>
                    </label>
                  </div>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted" style={{ height: '38px' }}>
                      <User size={16} />
                    </span>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="e.g., Rohan Ajay Sharma"
                      className={`form-control ${errors.fullName ? 'is-invalid' : ''}`}
                      style={{ height: '38px' }}
                      disabled={loading}
                    />
                    {errors.fullName && <div className="invalid-feedback">{errors.fullName}</div>}
                  </div>
                  <span className="text-muted small d-block mt-1" style={{ fontSize: '0.75rem', minHeight: '18px' }}>
                    Enter official name as per previous records.
                  </span>
                </div>

                {/* Roll Number / Admission ID (Auto-assigned per entry) */}
                <div className="col-12 col-md-6">
                  <div className="d-flex justify-content-between align-items-center mb-1.5" style={{ minHeight: '24px' }}>
                    <label className="form-label small fw-semibold text-sa-charcoal m-0 text-nowrap">
                      Roll Number / Admission ID
                    </label>
                    <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 fw-semibold text-nowrap" style={{ fontSize: '0.70rem' }}>
                      Auto-assigned
                    </span>
                  </div>
                  <div className="input-group">
                    <span className="input-group-text bg-light fw-bold text-muted" style={{ fontSize: '0.85rem', height: '38px' }}>
                      #
                    </span>
                    <input
                      type="text"
                      name="rollNumber"
                      value={formData.rollNumber}
                      onChange={handleInputChange}
                      placeholder="e.g. STD-111"
                      className="form-control"
                      style={{ height: '38px' }}
                      disabled={loading}
                    />
                  </div>
                  <span className="text-muted small d-block mt-1" style={{ fontSize: '0.75rem', minHeight: '18px' }}>
                    Sequential entry ID. Auto-assigned or customize.
                  </span>
                </div>

                {/* Student Email ID - Required Unique User ID */}
                <div className="col-12 col-md-6">
                  <div className="d-flex justify-content-between align-items-center mb-1.5" style={{ minHeight: '24px' }}>
                    <label className="form-label small fw-semibold text-sa-charcoal m-0 text-nowrap">
                      Student Email ID (User ID) <span className="text-danger">*</span>
                    </label>
                  </div>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted" style={{ height: '38px' }}>
                      <Mail size={16} />
                    </span>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="e.g., student.name@gmail.com"
                      className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                      style={{ height: '38px' }}
                      disabled={loading}
                    />
                    {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                  </div>
                  <span className="text-muted small d-block mt-1" style={{ fontSize: '0.75rem', minHeight: '18px' }}>
                    Student portal login User ID. Must be unique.
                  </span>
                </div>

                {/* Student Mobile Number - Required Unique Password & Contact */}
                <div className="col-12 col-md-6">
                  <div className="d-flex justify-content-between align-items-center mb-1.5" style={{ minHeight: '24px' }}>
                    <label className="form-label small fw-semibold text-sa-charcoal m-0 text-nowrap">
                      Student Mobile Number (Password) <span className="text-danger">*</span>
                    </label>
                  </div>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted" style={{ height: '38px' }}>
                      <Phone size={16} />
                    </span>
                    <input
                      type="tel"
                      name="mobileNumber"
                      value={formData.mobileNumber}
                      onChange={handleInputChange}
                      maxLength={10}
                      placeholder="10-digit mobile number"
                      className={`form-control ${errors.mobileNumber ? 'is-invalid' : ''}`}
                      style={{ height: '38px' }}
                      disabled={loading}
                    />
                    {errors.mobileNumber && <div className="invalid-feedback">{errors.mobileNumber}</div>}
                  </div>
                  <span className="text-muted small d-block mt-1" style={{ fontSize: '0.75rem', minHeight: '18px' }}>
                    Default portal Password & contact. Must be unique.
                  </span>
                </div>

                {/* Parent Mobile Number */}
                <div className="col-12 col-md-6">
                  <div className="d-flex justify-content-between align-items-center mb-1.5" style={{ minHeight: '24px' }}>
                    <label className="form-label small fw-semibold text-sa-charcoal m-0 text-nowrap">
                      Parent Mobile Number <span className="text-danger">*</span>
                    </label>
                  </div>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted" style={{ height: '38px' }}>
                      <Phone size={16} />
                    </span>
                    <input
                      type="tel"
                      name="parentPhone"
                      value={formData.parentPhone}
                      onChange={handleInputChange}
                      maxLength={10}
                      placeholder="Parent 10-digit mobile"
                      className={`form-control ${errors.parentPhone ? 'is-invalid' : ''}`}
                      style={{ height: '38px' }}
                      disabled={loading}
                    />
                    {errors.parentPhone && <div className="invalid-feedback">{errors.parentPhone}</div>}
                  </div>
                  <span className="text-muted small d-block mt-1" style={{ fontSize: '0.75rem', minHeight: '18px' }}>
                    Used for gate entry notifications and fee reminder SMS.
                  </span>
                </div>
              </div>

              {/* Section 2: Admission Type Selection */}
              <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: '32px', height: '32px', backgroundColor: '#FDF0F0', color: '#8B1216' }}
                >
                  <Layers size={18} />
                </div>
                <div>
                  <h6 className="fw-bold m-0 text-sa-charcoal">2. Admission Type & Academic Program</h6>
                  <span className="text-muted small" style={{ fontSize: '0.8rem' }}>
                    Select single-year standard or integrated two-year program (11th + 12th)
                  </span>
                </div>
              </div>

              <div className="row g-3 mb-4">
                {[
                  {
                    id: '11th Standard Only',
                    title: '11th Standard Only',
                    subtitle: 'Single Year (2025-2026)',
                    desc: 'Admission for 11th Standard curriculum only.',
                    badge: 'Standard 1-Year'
                  },
                  {
                    id: '12th Standard Only',
                    title: '12th Standard Only',
                    subtitle: 'Single Year (2025-2026)',
                    desc: 'Direct admission for 12th Standard board / entrance prep.',
                    badge: 'Standard 1-Year'
                  },
                  {
                    id: '11th + 12th Standard (Two-Year Admission)',
                    title: '11th + 12th Standard',
                    subtitle: 'Two-Year Admission (2025-2027)',
                    desc: 'Combined 2-year integrated course with linked academic records & concession.',
                    badge: '✨ Integrated 2-Year'
                  }
                ].map(opt => {
                  const isSelected = formData.admissionType === opt.id;
                  return (
                    <div key={opt.id} className="col-12 col-md-4">
                      <div
                        onClick={() => handleInputChange({ target: { name: 'admissionType', value: opt.id } })}
                        className="p-3 rounded-3 border h-100 transition-all"
                        style={{
                          backgroundColor: isSelected ? '#FFF8F8' : '#FFFFFF',
                          borderColor: isSelected ? '#8B1216' : '#E2E8F0',
                          borderWidth: isSelected ? '2px' : '1px',
                          cursor: 'pointer',
                          boxShadow: isSelected ? '0 2px 8px rgba(139, 18, 22, 0.12)' : 'none'
                        }}
                      >
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span
                            className="badge"
                            style={{
                              backgroundColor: isSelected ? 'rgba(139,18,22,0.1)' : '#F1F5F9',
                              color: isSelected ? '#8B1216' : '#475569',
                              fontSize: '10px'
                            }}
                          >
                            {opt.badge}
                          </span>
                          <input
                            type="radio"
                            name="admissionType"
                            checked={isSelected}
                            onChange={() => {}}
                            className="form-check-input"
                            style={{ accentColor: '#8B1216' }}
                          />
                        </div>
                        <h6 className="fw-bold mb-1" style={{ color: isSelected ? '#8B1216' : '#1E293B', fontSize: '13.5px' }}>
                          {opt.title}
                        </h6>
                        <span className="text-muted d-block small mb-1" style={{ fontSize: '11px' }}>
                          {opt.subtitle}
                        </span>
                        <p className="text-muted m-0" style={{ fontSize: '11px', lineHeight: 1.35 }}>
                          {opt.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Section 3: Branch & Batch Allocation */}
              <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: '32px', height: '32px', backgroundColor: '#FDF0F0', color: '#8B1216' }}
                >
                  <GraduationCap size={18} />
                </div>
                <div>
                  <h6 className="fw-bold m-0 text-sa-charcoal">
                    {formData.admissionType === '11th + 12th Standard (Two-Year Admission)'
                      ? '3. Academic Batch Allocation (Year 1 & Year 2)'
                      : '3. Branch & Batch Allocation (Admission Source of Truth)'}
                  </h6>
                  <span className="text-muted small" style={{ fontSize: '0.8rem' }}>
                    {formData.admissionType === '11th + 12th Standard (Two-Year Admission)'
                      ? 'Configure 11th Standard Active batch and linked 12th Standard Upcoming batch'
                      : 'Select Branch first, followed by Session (if Mangalvar Peth) and Academic Batch'}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-light rounded-3 border mb-4">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2 py-1 fw-bold" style={{ fontSize: '11px' }}>
                    {formData.admissionType === '11th + 12th Standard (Two-Year Admission)' ? 'Year 1: 11th Standard (Active)' : 'Enrolled Standard'}
                  </span>
                </div>
                <BranchBatchSelector
                  branch={formData.branch}
                  session={formData.session}
                  academicBatch={formData.academicBatch}
                  onBranchChange={handleBranchChange}
                  onSessionChange={handleSessionChange}
                  onBatchChange={handleAcademicBatchChange}
                  required={true}
                  disabled={loading}
                  fixedBranch={!isSuperAdmin}
                  allowedBranches={!isSuperAdmin ? [initialBranch] : undefined}
                  showAllOption={false}
                />

                {(errors.branch || errors.session || errors.academicBatch) && (
                  <div className="text-danger small mt-2">
                    {errors.branch || errors.session || errors.academicBatch}
                  </div>
                )}

                {/* If Two-Year Admission, show 2nd Year Linked Allocation Box */}
                {formData.admissionType === '11th + 12th Standard (Two-Year Admission)' && (
                  <div className="mt-3 pt-3 border-top">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1 fw-bold" style={{ fontSize: '11px' }}>
                        Year 2: 12th Standard (Linked Academic Record - Upcoming)
                      </span>
                      <span className="small text-muted" style={{ fontSize: '11px' }}>
                        Academic Year: <strong>{formData.secondYearAcademicYear || '2026-2027'}</strong>
                      </span>
                    </div>

                    <div className="row g-2 align-items-center">
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-semibold text-sa-charcoal m-0 mb-1">
                          12th Academic Batch Stream
                        </label>
                        <select
                          name="secondYearAcademicBatch"
                          value={formData.secondYearAcademicBatch}
                          onChange={handleInputChange}
                          className="form-select form-select-sm"
                          style={{ height: '36px' }}
                        >
                          <option value="12th PCM">12th PCM (Physics, Chemistry, Maths)</option>
                          <option value="12th PCB">12th PCB (Physics, Chemistry, Biology)</option>
                          <option value="12th PCMB">12th PCMB (Integrated All-4)</option>
                        </select>
                      </div>

                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-semibold text-sa-charcoal m-0 mb-1">
                          Linked Placement Tag
                        </label>
                        <input
                          type="text"
                          readOnly
                          value={`${formData.secondYearAcademicBatch || '12th PCM'} ${formData.branch}${formData.session ? ` (${formData.session})` : ''}`}
                          className="form-control form-control-sm bg-white"
                          style={{ height: '36px' }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-3 pt-2 border-top">
                  <div className="small text-sa-charcoal">
                    <span className="text-muted">Enrolled Program:</span>{' '}
                    <span className="badge bg-white text-dark border px-2 py-1 fw-bold">
                      {formData.admissionType}
                    </span>
                  </div>
                  <div className="small text-sa-charcoal">
                    <span className="text-muted">Primary Active Placement:</span>{' '}
                    <span className="badge py-1 px-2.5 rounded-pill fw-bold" style={{ backgroundColor: '#8B1216', color: '#FFFFFF' }}>
                      {formData.branch} • {formData.session ? `${formData.session} • ` : ''}{formData.academicBatch}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 4: Fee Details */}
              <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: '32px', height: '32px', backgroundColor: '#FDF0F0', color: '#8B1216' }}
                >
                  <CreditCard size={18} />
                </div>
                <div>
                  <h6 className="fw-bold m-0 text-sa-charcoal">4. Fee Details & Initial Collection</h6>
                  <span className="text-muted small" style={{ fontSize: '0.8rem' }}>
                    {formData.admissionType === '11th + 12th Standard (Two-Year Admission)'
                      ? 'Combined two-year course pricing, initial deposit, and remaining balance'
                      : 'Course pricing, initial deposit, and remaining balance'}
                  </span>
                </div>
              </div>

              <div className="row g-3 mb-4">
                {/* Total / Course Fees */}
                <div className="col-12 col-md-4">
                  <div className="d-flex justify-content-between align-items-center mb-1.5" style={{ minHeight: '24px' }}>
                    <label className="form-label small fw-semibold text-sa-charcoal m-0 text-nowrap">
                      {formData.admissionType === '11th + 12th Standard (Two-Year Admission)'
                        ? 'Combined Gross Fee (₹)'
                        : 'Course Fee (Gross) (₹)'} <span className="text-danger">*</span>
                    </label>
                  </div>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted fw-bold" style={{ height: '38px' }}>₹</span>
                    <input
                      type="number"
                      name="originalFees"
                      value={formData.originalFees}
                      onChange={handleInputChange}
                      min="0"
                      step="500"
                      placeholder="e.g. 45000"
                      className={`form-control ${errors.originalFees ? 'is-invalid' : ''}`}
                      style={{ height: '38px' }}
                      disabled={loading}
                    />
                    {errors.originalFees && <div className="invalid-feedback">{errors.originalFees}</div>}
                  </div>
                  <span className="text-muted small d-block mt-1" style={{ fontSize: '0.75rem', minHeight: '18px' }}>
                    {formData.admissionType === '11th + 12th Standard (Two-Year Admission)'
                      ? 'Combined 11th + 12th catalog fee'
                      : 'Standard course catalog fee'}
                  </span>
                </div>

                {/* Paid Fees */}
                <div className="col-12 col-md-4">
                  <div className="d-flex justify-content-between align-items-center mb-1.5" style={{ minHeight: '24px' }}>
                    <label className="form-label small fw-semibold text-sa-charcoal m-0 text-nowrap">
                      Paid Fees (Initial) (₹) <span className="text-danger">*</span>
                    </label>
                  </div>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted fw-bold" style={{ height: '38px' }}>₹</span>
                    <input
                      type="number"
                      name="paidFees"
                      value={formData.paidFees}
                      onChange={handleInputChange}
                      min="0"
                      step="500"
                      placeholder="e.g. 15000"
                      className={`form-control ${errors.paidFees ? 'is-invalid' : ''}`}
                      style={{ height: '38px' }}
                      disabled={loading}
                    />
                    {errors.paidFees && <div className="invalid-feedback">{errors.paidFees}</div>}
                  </div>
                  <span className="text-muted small d-block mt-1" style={{ fontSize: '0.75rem', minHeight: '18px' }}>
                    Initial deposit collected at admission
                  </span>
                </div>

                {/* Remaining Fees */}
                <div className="col-12 col-md-4">
                  <div className="d-flex justify-content-between align-items-center mb-1.5" style={{ minHeight: '24px' }}>
                    <label className="form-label small fw-semibold text-sa-charcoal m-0 text-nowrap">
                      Remaining Fees (₹)
                    </label>
                  </div>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted fw-bold" style={{ height: '38px' }}>₹</span>
                    <input
                      type="text"
                      name="remainingFees"
                      value={formData.remainingFees}
                      readOnly
                      className="form-control fw-bold text-danger bg-light"
                      style={{ height: '38px' }}
                    />
                  </div>
                  <span className="text-muted small d-block mt-1" style={{ fontSize: '0.75rem', minHeight: '18px' }}>
                    Auto-calculated balance
                  </span>
                </div>
              </div>

              {/* Section 5: Fee Concession & Scholarship (Configurable) */}
              <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: '32px', height: '32px', backgroundColor: '#FDF0F0', color: '#8B1216' }}
                >
                  <Tag size={18} />
                </div>
                <div>
                  <h6 className="fw-bold m-0 text-sa-charcoal">5. Fee Concession & Scholarship (Configurable)</h6>
                  <span className="text-muted small" style={{ fontSize: '0.8rem' }}>
                    Configure concession as Fixed Amount, Percentage, or Custom Amount (Requires Superadmin approval)
                  </span>
                </div>
              </div>

              {/* Concession Type Switcher */}
              <div className="mb-3">
                <label className="form-label small fw-semibold text-sa-charcoal mb-1.5 d-block">
                  Concession Mode:
                </label>
                <div className="btn-group w-100" role="group">
                  {[
                    { id: 'fixed', label: 'Fixed Amount (₹)' },
                    { id: 'percentage', label: 'Percentage (%)' },
                    { id: 'custom', label: 'Custom Amount (₹)' }
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleInputChange({ target: { name: 'concessionType', value: m.id } })}
                      className="btn btn-sm py-1.5 fw-semibold transition-all"
                      style={{
                        backgroundColor: formData.concessionType === m.id ? '#8B1216' : '#FFFFFF',
                        color: formData.concessionType === m.id ? '#FFFFFF' : '#475569',
                        borderColor: '#CBD5E1',
                        fontSize: '12px'
                      }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="row g-3 mb-4">
                {/* Concession Value Input */}
                <div className="col-12 col-md-4">
                  <div className="d-flex justify-content-between align-items-center mb-1.5" style={{ minHeight: '24px' }}>
                    <label className="form-label small fw-semibold text-sa-charcoal m-0 text-nowrap">
                      {formData.concessionType === 'percentage'
                        ? 'Concession (%)'
                        : 'Concession Amount (₹)'}
                    </label>
                    {Number(formData.discountAmount) > 0 ? (
                      <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle fw-bold text-nowrap" style={{ fontSize: '10px' }}>
                        - ₹{Number(formData.discountAmount).toLocaleString('en-IN')}
                      </span>
                    ) : (
                      <span className="badge bg-light text-muted border fw-normal text-nowrap" style={{ fontSize: '10px' }}>
                        ₹0
                      </span>
                    )}
                  </div>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted fw-bold" style={{ height: '38px' }}>
                      {formData.concessionType === 'percentage' ? '%' : '₹'}
                    </span>
                    <input
                      type="number"
                      name="concessionValue"
                      value={formData.concessionValue}
                      onChange={handleInputChange}
                      min="0"
                      step={formData.concessionType === 'percentage' ? '1' : '500'}
                      placeholder={formData.concessionType === 'percentage' ? 'e.g. 10' : 'e.g. 5000'}
                      className="form-control"
                      style={{ height: '38px' }}
                      disabled={loading}
                    />
                  </div>
                  <span className="text-muted small d-block mt-1 text-truncate" style={{ fontSize: '11px', minHeight: '17px' }}>
                    {formData.concessionType === 'percentage'
                      ? `Calculates ₹${Number(formData.discountAmount).toLocaleString('en-IN')} off combined course fee`
                      : 'Deducted from gross course fee'}
                  </span>
                </div>

                {/* Concession Reason */}
                <div className="col-12 col-md-4">
                  <div className="d-flex justify-content-between align-items-center mb-1.5" style={{ minHeight: '24px' }}>
                    <label className="form-label small fw-semibold text-sa-charcoal m-0 text-nowrap">
                      Concession Reason
                    </label>
                    <span className="badge bg-light text-muted border fw-normal text-nowrap" style={{ fontSize: '10px' }}>
                      Optional
                    </span>
                  </div>
                  <input
                    type="text"
                    name="discountReason"
                    value={formData.discountReason}
                    onChange={handleInputChange}
                    placeholder="e.g., Merit Scholarship, Two-Year Package"
                    className="form-control"
                    style={{ height: '38px' }}
                    disabled={loading}
                  />
                  <span className="text-muted small d-block mt-1 text-truncate" style={{ fontSize: '11px', minHeight: '17px' }}>
                    Reason for Admin / Superadmin approval
                  </span>
                </div>

                {/* Recommended By */}
                <div className="col-12 col-md-4">
                  <div className="d-flex justify-content-between align-items-center mb-1.5" style={{ minHeight: '24px' }}>
                    <label className="form-label small fw-semibold text-sa-charcoal m-0 text-nowrap">
                      Recommended By
                    </label>
                    <span className="badge bg-light text-muted border fw-normal text-nowrap" style={{ fontSize: '10px' }}>
                      Authorized Officer
                    </span>
                  </div>
                  <input
                    type="text"
                    name="discountRecommendedBy"
                    value={formData.discountRecommendedBy}
                    onChange={handleInputChange}
                    placeholder="e.g., Miss Shilpa (Counselor)"
                    className="form-control"
                    style={{ height: '38px' }}
                    disabled={loading}
                  />
                  <span className="text-muted small d-block mt-1 text-truncate" style={{ fontSize: '11px', minHeight: '17px' }}>
                    Authorizing officer recommending concession
                  </span>
                </div>

                {/* Quick Presets based on concession type */}
                <div className="col-12 mt-1">
                  <div
                    className="d-flex align-items-center gap-1.5 flex-wrap p-2 rounded-2"
                    style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
                  >
                    <span className="text-muted small fw-semibold me-1" style={{ fontSize: '11px' }}>
                      ⚡ Quick Presets:
                    </span>
                    {(formData.concessionType === 'percentage'
                      ? [
                          { label: '5%', val: 5 },
                          { label: '10%', val: 10 },
                          { label: '15%', val: 15 },
                          { label: '20%', val: 20 },
                          { label: '25%', val: 25 },
                          { label: '0%', val: 0 }
                        ]
                      : [
                          { label: '₹2,000', val: 2000 },
                          { label: '₹5,000', val: 5000 },
                          { label: '₹10,000', val: 10000 },
                          { label: '₹15,000', val: 15000 },
                          { label: '₹20,000', val: 20000 },
                          { label: 'Clear (₹0)', val: 0 }
                        ]
                    ).map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => {
                          handleInputChange({ target: { name: 'concessionValue', value: p.val } });
                        }}
                        className="btn btn-xs py-0.5 px-2.5 rounded-pill fw-semibold transition-all"
                        style={{
                          fontSize: '11px',
                          backgroundColor: Number(formData.concessionValue) === p.val ? '#FEF3C7' : '#FFFFFF',
                          color: Number(formData.concessionValue) === p.val ? '#B45309' : '#475569',
                          border: Number(formData.concessionValue) === p.val ? '1.5px solid #F59E0B' : '1px solid #CBD5E1'
                        }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Year-wise Breakdown Card for Two-Year Admission */}
                {formData.admissionType === '11th + 12th Standard (Two-Year Admission)' && (
                  <div className="col-12 mt-2">
                    <div className="p-3 rounded-2 border" style={{ backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }}>
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="fw-bold text-success small">
                          📊 Two-Year Academic Concession Breakdown:
                        </span>
                        <span className="badge bg-success text-white" style={{ fontSize: '10px' }}>
                          Linked Academic Records
                        </span>
                      </div>
                      <div className="row g-2 text-center small">
                        <div className="col-6 col-md-3">
                          <div className="p-2 bg-white rounded border">
                            <span className="text-muted d-block" style={{ fontSize: '10px' }}>11th Catalog Fee</span>
                            <strong className="text-sa-charcoal" style={{ fontSize: '13px' }}>
                              ₹{getMatchingCourseFee(feeStructures, formData.branch, formData.academicBatch, '11th Science', 55000).toLocaleString('en-IN')}
                            </strong>
                          </div>
                        </div>
                        <div className="col-6 col-md-3">
                          <div className="p-2 bg-white rounded border">
                            <span className="text-muted d-block" style={{ fontSize: '10px' }}>12th Catalog Fee</span>
                            <strong className="text-sa-charcoal" style={{ fontSize: '13px' }}>
                              ₹{getMatchingCourseFee(feeStructures, formData.branch, formData.secondYearAcademicBatch || '12th PCM', '12th Science', 65000).toLocaleString('en-IN')}
                            </strong>
                          </div>
                        </div>
                        <div className="col-6 col-md-3">
                          <div className="p-2 bg-white rounded border">
                            <span className="text-muted d-block" style={{ fontSize: '10px' }}>Combined Original</span>
                            <strong className="text-primary" style={{ fontSize: '13px' }}>
                              ₹{Number(formData.originalFees).toLocaleString('en-IN')}
                            </strong>
                          </div>
                        </div>
                        <div className="col-6 col-md-3">
                          <div className="p-2 bg-white rounded border">
                            <span className="text-muted d-block" style={{ fontSize: '10px' }}>Net 2-Year Payable</span>
                            <strong className="text-success fw-bold" style={{ fontSize: '13px' }}>
                              ₹{Number(formData.totalFees).toLocaleString('en-IN')}
                            </strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {Number(formData.discountAmount) > 0 && (
                  <div className="col-12">
                    <div
                      className="p-2.5 rounded-2 d-flex align-items-center gap-2 small"
                      style={{ backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', color: '#92400E' }}
                    >
                      <ShieldCheck size={16} className="text-warning-emphasis flex-shrink-0" />
                      <span style={{ fontSize: '11.5px', lineHeight: 1.4 }}>
                        <strong>Concession Policy:</strong> Concession request of ₹{Number(formData.discountAmount).toLocaleString('en-IN')} reduces gross fees from ₹{Number(formData.originalFees).toLocaleString('en-IN')} to ₹{Math.max(0, Number(formData.originalFees) - Number(formData.discountAmount)).toLocaleString('en-IN')}. Superadmin approval is logged automatically.
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Fee Breakdown Visual Indicator */}
              <div
                className="mt-4 p-3 rounded-3"
                style={{ backgroundColor: '#F8F9FA', border: '1px solid #E9ECEF' }}
              >
                <div className="d-flex justify-content-between align-items-center mb-1 small">
                  <span className="text-muted fw-semibold">Fee Collection Progress:</span>
                  <span className="fw-bold text-sa-charcoal">
                    ₹{Number(formData.paidFees || 0).toLocaleString('en-IN')} of ₹
                    {Number(formData.totalFees || 0).toLocaleString('en-IN')} (
                    {formData.totalFees > 0
                      ? Math.round(((formData.paidFees || 0) / formData.totalFees) * 100)
                      : 0}
                    %)
                  </span>
                </div>
                <div className="progress" style={{ height: '8px', borderRadius: '4px' }}>
                  <div
                    className="progress-bar transition-all"
                    role="progressbar"
                    style={{
                      width: `${
                        formData.totalFees > 0
                          ? Math.min(100, ((formData.paidFees || 0) / formData.totalFees) * 100)
                          : 0
                      }%`,
                      backgroundColor: '#8B1216',
                      borderRadius: '4px'
                    }}
                  />
                </div>

                {/* 5-Card Financial Breakdown Banner */}
                <div className="row g-2 mt-2 pt-2 border-top">
                  <div className="col-6 col-md">
                    <div className="p-2 rounded-2 bg-white border text-center h-100 shadow-2xs">
                      <span className="small text-muted d-block" style={{ fontSize: '10.5px' }}>1. Gross Tuition</span>
                      <strong className="text-sa-charcoal d-block mt-0.5" style={{ fontSize: '14.5px' }}>
                        ₹{Number(formData.originalFees || 0).toLocaleString('en-IN')}
                      </strong>
                      <span className="text-muted text-xs" style={{ fontSize: '10px' }}>Standard Fee</span>
                    </div>
                  </div>

                  <div className="col-6 col-md">
                    <div
                      className="p-2 rounded-2 bg-white border text-center h-100 shadow-2xs"
                      style={{ borderColor: Number(formData.discountAmount) > 0 ? '#FCD34D' : '#E2E8F0' }}
                    >
                      <span className="small text-muted d-block" style={{ fontSize: '10.5px' }}>2. Concession</span>
                      <strong className="d-block mt-0.5 text-warning-emphasis" style={{ fontSize: '14.5px' }}>
                        {Number(formData.discountAmount) > 0 ? `- ₹${Number(formData.discountAmount).toLocaleString('en-IN')}` : '₹0'}
                      </strong>
                      <span className="text-muted text-xs" style={{ fontSize: '10px' }}>
                        {Number(formData.discountAmount) > 0 ? 'Concession Applied' : 'No Concession'}
                      </span>
                    </div>
                  </div>

                  <div className="col-6 col-md">
                    <div className="p-2 rounded-2 bg-white border text-center h-100 shadow-2xs" style={{ borderColor: '#93C5FD', backgroundColor: '#F0F9FF' }}>
                      <span className="small text-muted d-block" style={{ fontSize: '10.5px' }}>3. Net Course Fee</span>
                      <strong className="d-block mt-0.5 text-primary fw-bold" style={{ fontSize: '14.5px' }}>
                        ₹{Math.max(0, Number(formData.originalFees || 0) - Number(formData.discountAmount || 0)).toLocaleString('en-IN')}
                      </strong>
                      <span className="text-primary text-opacity-75 text-xs fw-semibold" style={{ fontSize: '10px' }}>Net Payable</span>
                    </div>
                  </div>

                  <div className="col-6 col-md">
                    <div className="p-2 rounded-2 bg-white border text-center h-100 shadow-2xs">
                      <span className="small text-muted d-block" style={{ fontSize: '10.5px' }}>4. Downpayment</span>
                      <strong className="d-block mt-0.5 text-success" style={{ fontSize: '14.5px' }}>
                        ₹{Number(formData.paidFees || 0).toLocaleString('en-IN')}
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
                        ₹{Math.max(0, Math.max(0, Number(formData.originalFees || 0) - Number(formData.discountAmount || 0)) - Number(formData.paidFees || 0)).toLocaleString('en-IN')}
                      </strong>
                      <span className="text-danger text-opacity-75 text-xs" style={{ fontSize: '10px' }}>Net − Paid</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button Section */}
              <div className="d-flex flex-column-reverse flex-sm-row align-items-stretch align-items-sm-center justify-content-between gap-3 mt-4 pt-3 border-top">
                <button
                  type="button"
                  className="btn btn-outline-secondary px-4 py-2.5 fw-semibold d-inline-flex align-items-center justify-content-center gap-2 text-nowrap rounded-3 transition-all"
                  style={{ minHeight: '44px', fontSize: '14px' }}
                  onClick={() => {
                    const isMP = activeBranch && activeBranch.toLowerCase().includes('mangal');
                    const branchToUse = isMP ? BRANCH_MANGALWAR : (activeBranch || BRANCH_TARABAI);
                    const sessionToUse = isMP ? 'Morning' : '';
                    setFormData({
                      fullName: '',
                      email: '',
                      mobileNumber: '',
                      parentPhone: '',
                      branch: branchToUse,
                      session: sessionToUse,
                      academicBatch: '11th PCM',
                      standard: '11th Science',
                      batch: `${branchToUse} • ${sessionToUse ? `${sessionToUse} • ` : ''}11th PCM`,
                      originalFees: 55000,
                      discountAmount: 0,
                      discountReason: '',
                      discountRecommendedBy: 'Miss Shilpa (Counselor)',
                      totalFees: 55000,
                      paidFees: 15000,
                      remainingFees: 40000,
                      password: '',
                      admissionDate: new Date().toISOString().split('T')[0]
                    });
                  }}
                  disabled={loading}
                >
                  <RotateCcw size={16} className="flex-shrink-0" />
                  <span>Clear Form</span>
                </button>

                <button
                  type="submit"
                  className="btn text-white px-4 py-2.5 fw-semibold d-inline-flex align-items-center justify-content-center gap-2 text-nowrap rounded-3 shadow-sm transition-all"
                  style={{
                    backgroundColor: '#8B1216',
                    border: '1.5px solid #8B1216',
                    minHeight: '44px',
                    fontSize: '14px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#700E12';
                    e.currentTarget.style.borderColor = '#700E12';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#8B1216';
                    e.currentTarget.style.borderColor = '#8B1216';
                  }}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm flex-shrink-0" role="status" aria-hidden="true" />
                      <span>Creating Student Account...</span>
                    </>
                  ) : (
                    <>
                      <UserCheck size={18} className="flex-shrink-0" />
                      <span>Register Student Account</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Sidebar Summary & Live Preview */}
        <div className="col-12 col-lg-4">
          <div className="bg-white rounded-3 border shadow-sm p-4 sticky-top" style={{ top: '20px' }}>
            <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
              <FileText size={20} style={{ color: '#8B1216' }} />
              <h6 className="fw-bold m-0 text-sa-charcoal">Registration Summary</h6>
            </div>

            <div className="d-flex flex-column gap-3 small">
              <div className="d-flex justify-content-between border-bottom pb-2">
                <span className="text-muted">Student Name:</span>
                <span className="fw-bold text-sa-charcoal text-end">
                  {formData.fullName || <em className="text-muted fw-normal">Not entered</em>}
                </span>
              </div>

              <div className="d-flex justify-content-between border-bottom pb-2">
                <span className="text-muted">Student Email:</span>
                <span className="fw-semibold text-sa-charcoal text-end text-truncate" style={{ maxWidth: '170px' }} title={formData.email}>
                  {formData.email || <em className="text-muted fw-normal">Auto-generated</em>}
                </span>
              </div>

              <div className="d-flex justify-content-between border-bottom pb-2">
                <span className="text-muted">Student Mobile:</span>
                <span className="fw-semibold text-sa-charcoal">
                  {formData.mobileNumber || <em className="text-muted fw-normal">Pending</em>}
                </span>
              </div>

              <div className="d-flex justify-content-between border-bottom pb-2">
                <span className="text-muted">Parent Mobile:</span>
                <span className="fw-semibold text-sa-charcoal">
                  {formData.parentPhone || <em className="text-muted fw-normal">Pending</em>}
                </span>
              </div>

              <div className="d-flex justify-content-between border-bottom pb-2">
                <span className="text-muted">Admission Program:</span>
                <span className="badge py-1 px-2 rounded fw-bold text-nowrap" style={{ backgroundColor: '#FDF0F0', color: '#8B1216', border: '1px solid rgba(139,18,22,0.2)' }}>
                  {formData.admissionType}
                </span>
              </div>

              <div className="d-flex justify-content-between border-bottom pb-2">
                <span className="text-muted">Branch:</span>
                <span className="fw-bold text-sa-charcoal">
                  {formData.branch}
                </span>
              </div>

              {formData.session ? (
                <div className="d-flex justify-content-between border-bottom pb-2">
                  <span className="text-muted">Session:</span>
                  <span className="badge bg-primary-subtle text-primary border">
                    {formData.session}
                  </span>
                </div>
              ) : null}

              <div className="d-flex justify-content-between border-bottom pb-2">
                <span className="text-muted">Academic Batch:</span>
                <span className="fw-bold text-sa-primary">
                  {formData.academicBatch}
                </span>
              </div>

              <div className="d-flex justify-content-between border-bottom pb-2">
                <span className="text-muted">Standard / Class:</span>
                <span className="fw-semibold text-sa-charcoal">
                  {formData.standard || '11th Science'}
                </span>
              </div>

              <div className="d-flex justify-content-between border-bottom pb-2">
                <span className="text-muted">Gross Course Fee:</span>
                <span className="fw-bold text-sa-charcoal">
                  ₹{Number(formData.originalFees || formData.totalFees || 0).toLocaleString()}
                </span>
              </div>

              {Number(formData.discountAmount) > 0 && (
                <div className="d-flex justify-content-between border-bottom pb-2">
                  <span className="text-muted">Recommended Discount:</span>
                  <span className="fw-bold text-success">
                    -₹{Number(formData.discountAmount).toLocaleString()}
                    <span className="badge bg-warning-subtle text-warning ms-1" style={{ fontSize: '0.7rem' }}>
                      Pending Approval
                    </span>
                  </span>
                </div>
              )}

              <div className="d-flex justify-content-between border-bottom pb-2">
                <span className="text-muted">Net Payable Fees:</span>
                <span className="fw-bold text-sa-charcoal">
                  ₹{Number(formData.totalFees || 0).toLocaleString()}
                </span>
              </div>

              <div className="d-flex justify-content-between border-bottom pb-2">
                <span className="text-muted">Amount Paid:</span>
                <span className="fw-bold text-success">
                  ₹{Number(formData.paidFees || 0).toLocaleString()}
                </span>
              </div>

              <div className="d-flex justify-content-between border-bottom pb-2">
                <span className="text-muted">Remaining Balance:</span>
                <span className="fw-bold text-danger">
                  ₹{Number(formData.remainingFees || 0).toLocaleString()}
                </span>
              </div>

              <div className="d-flex justify-content-between border-bottom pb-2">
                <span className="text-muted">Default Password:</span>
                <span className="badge bg-light text-dark font-monospace border">
                  {formData.mobileNumber ? formData.mobileNumber.replace(/\D/g, '') : <span className="text-muted">Same as Mobile No.</span>}
                </span>
              </div>

              <div className="d-flex justify-content-between">
                <span className="text-muted">Profile Status:</span>
                <span className="badge bg-warning text-dark fw-semibold">
                  Pending Student Entry
                </span>
              </div>
            </div>

            {/* Role Responsibility Card */}
            <div
              className="mt-4 p-3 rounded-3"
              style={{ backgroundColor: '#FDF0F0', border: '1px solid rgba(139, 18, 22, 0.15)' }}
            >
              <div className="d-flex align-items-center gap-2 mb-1" style={{ color: '#8B1216' }}>
                <Lock size={15} />
                <span className="fw-bold small">Read-Only Enforced</span>
              </div>
              <p className="text-muted small m-0" style={{ fontSize: '0.78rem' }}>
                Once registered, Student Name, Student Mobile, Parent Mobile, Assigned Batch, and Fees will be strictly read-only for
                the student.
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
