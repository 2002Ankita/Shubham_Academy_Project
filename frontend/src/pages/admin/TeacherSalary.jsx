import React, { useState, useEffect, useMemo } from 'react';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import salaryService from '../../services/salaryService';
import notificationService from '../../services/notificationService';
import { useAuth } from '../../hooks/useAuth';
import {
  CreditCard,
  CheckCircle,
  Clock,
  Edit2,
  Calendar,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Users,
  Download,
  Bell
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';

// Helper to check if month matches
const matchesMonth = (m1, m2) => {
  if (!m1 || !m2) return false;
  const s1 = String(m1).trim().toLowerCase();
  const s2 = String(m2).trim().toLowerCase();
  if (s1 === s2) return true;
  return s1.includes(s2) || s2.includes(s1);
};

export default function TeacherSalary() {
  const { user } = useAuth();
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [editForm, setEditForm] = useState({
    baseSalary: 0,
    allowances: 0,
    deductions: 0,
    recovery: 0,
    yearlySalary: 0,
    accountType: 'Academy',
    paymentMode: 'NEFT',
    workingHours: 160,
    netPayable: 0
  });
  const [generating, setGenerating] = useState(false);
  const [disburseModalOpen, setDisburseModalOpen] = useState(false);
  const [disburseForm, setDisburseForm] = useState({ id: null, name: '', amount: '', paymentMode: 'NEFT', accountType: 'Academy' });

  // Filter & Search states
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('detailed'); // 'detailed' | 'monthly'

  // Determine current calendar month (e.g., 'November 2026')
  const currentMonthName = useMemo(() => {
    return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, []);

  const fetchSalaries = async () => {
    setLoading(true);
    try {
      const data = await salaryService.getAll();
      setSalaries(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load salaries:', err);
      toast.error('Failed to load salary register');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalaries();
  }, []);

  // Compute unique months list with current month always present at top
  const availableMonths = useMemo(() => {
    const list = [currentMonthName];
    salaries.forEach((s) => {
      if (s.month && !list.some((m) => matchesMonth(m, s.month))) {
        list.push(s.month);
      }
    });

    const now = new Date();
    for (let i = 1; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStr = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      if (!list.some((m) => matchesMonth(m, mStr))) {
        list.push(mStr);
      }
    }
    return list;
  }, [salaries, currentMonthName]);

  // Filtered salaries based on active month selection and search query
  const filteredSalaries = useMemo(() => {
    return salaries.filter((s) => {
      if (selectedMonth !== 'ALL' && !matchesMonth(s.month, selectedMonth)) {
        return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const tName = (s.teacherName || '').toLowerCase();
        const sub = (s.subject || '').toLowerCase();
        const m = (s.month || '').toLowerCase();
        if (!tName.includes(q) && !sub.includes(q) && !m.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [salaries, selectedMonth, searchQuery]);

  // Summary statistics for current or filtered view
  const stats = useMemo(() => {
    const targetSet = selectedMonth === 'ALL'
      ? salaries.filter((s) => matchesMonth(s.month, currentMonthName))
      : filteredSalaries;

    const dataset = targetSet.length > 0 ? targetSet : filteredSalaries;

    let totalGross = 0;
    let totalNet = 0;
    let totalPaid = 0;
    let totalPending = 0;
    let fullyPaidCount = 0;
    let pendingCount = 0;

    dataset.forEach((s) => {
      const isPaid = s.status === 'Disbursed' || s.status === 'Fully Paid';
      const net = Number(s.netPayable) || 0;
      const paid = isPaid ? (Number(s.amountPaid) || net) : (Number(s.amountPaid) || 0);
      const pend = isPaid ? 0 : (s.amountPending != null ? Number(s.amountPending) : Math.max(0, net - paid));
      totalGross += (Number(s.baseSalary) || 0) + (Number(s.allowances) || 0);
      totalNet += net;
      totalPaid += paid;
      totalPending += pend;
      if (isPaid) {
        fullyPaidCount++;
      } else {
        pendingCount++;
      }
    });

    return {
      totalGross,
      totalNet,
      totalPaid,
      totalPending,
      fullyPaidCount,
      pendingCount,
      facultyCount: dataset.length
    };
  }, [salaries, filteredSalaries, selectedMonth, currentMonthName]);

  // Monthly Summary View aggregation
  const monthlySummaries = useMemo(() => {
    const map = {};
    salaries.forEach((s) => {
      const m = s.month || currentMonthName;
      if (!map[m]) {
        map[m] = {
          month: m,
          facultyCount: 0,
          totalNet: 0,
          totalPaid: 0,
          totalRecovery: 0,
          totalPending: 0,
          totalHours: 0,
          academyCount: 0,
          tutorialCount: 0,
          neftAmount: 0,
          cashAmount: 0
        };
      }
      const isPaid = s.status === 'Disbursed' || s.status === 'Fully Paid';
      const net = Number(s.netPayable || 0);
      const paid = isPaid ? (Number(s.amountPaid) || net) : (Number(s.amountPaid) || 0);
      const pend = isPaid ? 0 : (s.amountPending != null ? Number(s.amountPending) : Math.max(0, net - paid));
      const rec = Number(s.recovery ?? s.deductions ?? 0);
      const hrs = Number(s.workingHours ?? 0);
      const acc = (s.accountType || 'Academy').toLowerCase();
      const mode = (s.paymentMode || (String(s.transactionRef || '').toUpperCase().startsWith('CASH') ? 'Cash' : 'NEFT')).toLowerCase();

      map[m].facultyCount += 1;
      map[m].totalNet += net;
      map[m].totalPaid += paid;
      map[m].totalRecovery += rec;
      map[m].totalPending += pend;
      map[m].totalHours += hrs;
      if (acc === 'tutorial') map[m].tutorialCount += 1;
      else map[m].academyCount += 1;
      if (mode === 'cash') map[m].cashAmount += paid;
      else map[m].neftAmount += paid;
    });
    return Object.values(map);
  }, [salaries, currentMonthName]);

  const handleDisburseClick = (row) => {
    const inferredMode = row.paymentMode || (String(row.transactionRef || '').toUpperCase().startsWith('CASH') ? 'Cash' : 'NEFT');
    setDisburseForm({
      id: row.id,
      name: row.teacherName || 'Faculty Member',
      amount: '',
      paymentMode: inferredMode,
      accountType: row.accountType || 'Academy'
    });
    setDisburseModalOpen(true);
  };

  const submitDisburse = async (e) => {
    e.preventDefault();
    try {
      const updated = await salaryService.disburseSalary(
        disburseForm.id,
        Number(disburseForm.amount),
        disburseForm.paymentMode,
        disburseForm.accountType
      );
      const targetRow = salaries.find((s) => s.id === disburseForm.id) || {};
      try {
        notificationService.notifySalaryDisbursedToSuperAdmin({
          teacherName: updated?.teacherName || disburseForm.name,
          amount: Number(disburseForm.amount),
          recovery: updated?.recovery ?? targetRow.recovery ?? targetRow.deductions ?? 0,
          yearlySalary: updated?.yearlySalary ?? targetRow.yearlySalary ?? Math.round(Number(updated?.netPayable || targetRow.netPayable || 0) * 12),
          accountType: disburseForm.accountType || updated?.accountType || 'Academy',
          workingHours: updated?.workingHours ?? targetRow.workingHours ?? 0,
          paymentMode: disburseForm.paymentMode || updated?.paymentMode || 'NEFT',
          month: updated?.month || targetRow.month || '',
          paidBy: user?.full_name || user?.name || 'Academy Admin',
          branch: user?.branch || 'Central Campus',
          transactionRef: updated?.transactionRef || ''
        });
      } catch (notifErr) {
        console.warn('Could not send Super Admin salary notification:', notifErr);
      }
      toast.success(`Payment of ₹${Number(disburseForm.amount).toLocaleString()} (${disburseForm.paymentMode}) disbursed to ${disburseForm.name}! Super Admin notified.`);
      setDisburseModalOpen(false);
      fetchSalaries();
    } catch (err) {
      toast.error('Failed to disburse salary.');
    }
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const targetMonth = selectedMonth !== 'ALL' ? selectedMonth : currentMonthName;
      await salaryService.generateDrafts(targetMonth);
      toast.success(`Generated/refreshed salary drafts for ${targetMonth}`);
      fetchSalaries();
    } catch (err) {
      toast.error('Failed to generate drafts.');
    } finally {
      setGenerating(false);
    }
  };

  const handleEditClick = (row) => {
    setSelectedRow(row);
    const inferredMode = row.paymentMode || (String(row.transactionRef || '').toUpperCase().startsWith('CASH') ? 'Cash' : 'NEFT');
    const netVal = Number(row.netPayable ?? row.baseSalary ?? 0);
    setEditForm({
      baseSalary: row.baseSalary,
      allowances: row.allowances,
      deductions: row.deductions,
      recovery: row.recovery ?? row.deductions ?? 0,
      yearlySalary: row.yearlySalary ?? Math.round(netVal * 12),
      accountType: row.accountType || 'Academy',
      paymentMode: inferredMode,
      workingHours: row.workingHours ?? 160,
      netPayable: row.netPayable
    });
    setEditModalOpen(true);
  };

  // Auto calculate net payable & yearly salary when base, allowances or deductions change
  useEffect(() => {
    if (editModalOpen) {
      const net = Number(editForm.baseSalary) + Number(editForm.allowances) - Number(editForm.deductions);
      setEditForm((prev) => ({
        ...prev,
        netPayable: net,
        yearlySalary: Math.round(net * 12)
      }));
    }
  }, [editForm.baseSalary, editForm.allowances, editForm.deductions, editModalOpen]);

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!selectedRow) return;
    try {
      await salaryService.updateSalary(selectedRow.id, {
        baseSalary: Number(editForm.baseSalary),
        allowances: Number(editForm.allowances),
        deductions: Number(editForm.deductions),
        recovery: Number(editForm.recovery),
        yearlySalary: Number(editForm.yearlySalary),
        accountType: editForm.accountType,
        paymentMode: editForm.paymentMode,
        workingHours: Number(editForm.workingHours),
        netPayable: Number(editForm.netPayable)
      });
      toast.success('Salary updated & notification sent!');
      try {
        notificationService.notifyTeacherSalaryUpdate({
          teacherName: selectedRow.teacherName,
          month: selectedRow.month,
          baseSalary: Number(editForm.baseSalary),
          netPayable: Number(editForm.netPayable),
          amountPaid: Number(selectedRow.amountPaid || 0),
          amountPending: Math.max(0, Number(editForm.netPayable) - Number(selectedRow.amountPaid || 0)),
          workingHours: Number(editForm.workingHours),
          accountType: editForm.accountType,
          paymentMode: editForm.paymentMode,
          updatedBy: user?.full_name || user?.name || 'Academy Admin',
          branch: user?.branch || 'Central Campus'
        });
      } catch (e) {
        console.warn('Salary update notification failed:', e);
      }
      setEditModalOpen(false);
      fetchSalaries();
    } catch (err) {
      toast.error('Failed to update salary');
    }
  };

  const handleExportExcel = () => {
    const dataset = filteredSalaries.length > 0 ? filteredSalaries : salaries;
    if (!dataset || dataset.length === 0) {
      toast.warning('No salary records available to export.');
      return;
    }

    const rows = dataset.map((row) => {
      const netAmount = Number(row.netPayable ?? row.baseSalary ?? 0);
      const recoveryVal = Number(row.recovery ?? row.deductions ?? 0);
      const yearlyVal = Number(row.yearlySalary ?? Math.round(netAmount * 12));
      const accType = row.accountType || 'Academy';
      const hoursVal = Number(row.workingHours ?? 0);
      const payMode = row.paymentMode || (String(row.transactionRef || '').toUpperCase().startsWith('CASH') ? 'Cash' : 'NEFT');

      return {
        Name: row.teacherName || 'Academy Faculty',
        Amount: netAmount,
        Recovery: recoveryVal,
        'Yearly Salary': yearlyVal,
        'Account Type': accType,
        Hours: hoursVal,
        'NEFT or Cash': payMode,
        Month: row.month || '',
        'Amount Paid': Number(row.amountPaid || 0),
        Pending: Number(row.amountPending || 0),
        Status: row.status || 'Processing'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet['!cols'] = [
      { wch: 24 }, // Name
      { wch: 14 }, // Amount
      { wch: 14 }, // Recovery
      { wch: 16 }, // Yearly Salary
      { wch: 16 }, // Account Type
      { wch: 10 }, // Hours
      { wch: 14 }, // NEFT or Cash
      { wch: 18 }, // Month
      { wch: 14 }, // Amount Paid
      { wch: 14 }, // Pending
      { wch: 14 }  // Status
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Faculty Salary');
    const monthTag = (selectedMonth === 'ALL' ? currentMonthName : selectedMonth).replace(/\s+/g, '_');
    XLSX.writeFile(workbook, `Faculty_Salary_${monthTag}.xlsx`);
    toast.success(`Exported ${rows.length} salary records to Excel!`);
  };

  return (
    <div className="d-flex flex-column gap-4">
      {/* 1. Header with Title & Auto-Draft Trigger */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
        <div>
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
              Faculty Salary & Payroll Register
            </h3>
            <span
              className="badge rounded-pill d-inline-flex align-items-center gap-1.5 px-2.5 py-1"
              style={{
                backgroundColor: '#FDF0F0',
                color: '#8B1216',
                border: '1px solid #FECACA',
                fontSize: '11.5px',
                fontWeight: 600
              }}
            >
              <Calendar size={12} />
              <span>Active Month: {currentMonthName}</span>
            </span>
          </div>
          <span className="small text-sa-muted mt-1 d-block">
            Manage teacher monthly compensation, auto-drafted payroll schedules, deductions, and installment disbursements
          </span>
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          <div className="btn-group btn-group-sm" role="group" aria-label="Salary View Mode">
            <button
              type="button"
              className={`btn fw-semibold ${viewMode === 'detailed' ? 'btn-dark' : 'btn-outline-secondary'}`}
              onClick={() => setViewMode('detailed')}
            >
              Detailed Register
            </button>
            <button
              type="button"
              className={`btn fw-semibold ${viewMode === 'monthly' ? 'btn-dark' : 'btn-outline-secondary'}`}
              onClick={() => setViewMode('monthly')}
            >
              Monthly Collection & Payout View
            </button>
          </div>
          <Button
            variant="outline"
            icon={Download}
            onClick={handleExportExcel}
            className="d-inline-flex align-items-center gap-1.5 shadow-xs"
          >
            Export Excel
          </Button>
          <Button
            variant="primary"
            onClick={handleGenerate}
            disabled={generating}
            className="d-inline-flex align-items-center gap-1.5 shadow-sm"
          >
            <RefreshCw size={14} className={generating ? 'spinner-border spinner-border-sm p-0 m-0 border-2' : ''} />
            <span>{generating ? 'Processing...' : `Refresh ${selectedMonth === 'ALL' ? currentMonthName : selectedMonth} Drafts`}</span>
          </Button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="row g-3">
        {/* Card 1: Active Month & Total Payroll */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div
            className="p-3 bg-white border rounded-4 shadow-xs h-100 d-flex flex-column justify-content-between"
            style={{ borderColor: '#E2E8F0', borderLeft: '4px solid #8B1216' }}
          >
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-sa-muted fw-semibold" style={{ fontSize: '12px' }}>
                {selectedMonth === 'ALL' ? `${currentMonthName} (Net)` : `${selectedMonth} Payroll`}
              </span>
              <div
                className="rounded-3 d-flex align-items-center justify-content-center"
                style={{ width: '34px', height: '34px', backgroundColor: '#FDF0F0', color: '#8B1216' }}
              >
                <DollarSign size={17} />
              </div>
            </div>
            <div>
              <div className="fw-bold brand-font text-sa-charcoal" style={{ fontSize: '22px', lineHeight: 1.15 }}>
                ₹ {stats.totalNet.toLocaleString()}
              </div>
              <span className="text-sa-muted mt-1 d-block" style={{ fontSize: '11px' }}>
                Gross: ₹ {stats.totalGross.toLocaleString()} • {stats.facultyCount} faculty members
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Disbursed / Paid Amount */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div
            className="p-3 bg-white border rounded-4 shadow-xs h-100 d-flex flex-column justify-content-between"
            style={{ borderColor: '#E2E8F0', borderLeft: '4px solid #16A34A' }}
          >
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-sa-muted fw-semibold" style={{ fontSize: '12px' }}>
                Disbursed Amount
              </span>
              <div
                className="rounded-3 d-flex align-items-center justify-content-center"
                style={{ width: '34px', height: '34px', backgroundColor: '#DCFCE7', color: '#16A34A' }}
              >
                <CheckCircle size={17} />
              </div>
            </div>
            <div>
              <div className="fw-bold brand-font text-success" style={{ fontSize: '22px', lineHeight: 1.15 }}>
                ₹ {stats.totalPaid.toLocaleString()}
              </div>
              <span className="text-muted mt-1 d-block" style={{ fontSize: '11px' }}>
                {stats.fullyPaidCount} faculty fully paid
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Pending Disbursals */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div
            className="p-3 bg-white border rounded-4 shadow-xs h-100 d-flex flex-column justify-content-between"
            style={{ borderColor: '#E2E8F0', borderLeft: '4px solid #D97706' }}
          >
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-sa-muted fw-semibold" style={{ fontSize: '12px' }}>
                Pending Balance
              </span>
              <div
                className="rounded-3 d-flex align-items-center justify-content-center"
                style={{ width: '34px', height: '34px', backgroundColor: '#FEF3C7', color: '#D97706' }}
              >
                <Clock size={17} />
              </div>
            </div>
            <div>
              <div className="fw-bold brand-font" style={{ fontSize: '22px', lineHeight: 1.15, color: stats.totalPending > 0 ? '#B45309' : '#16A34A' }}>
                ₹ {stats.totalPending.toLocaleString()}
              </div>
              <span className="text-muted mt-1 d-block" style={{ fontSize: '11px' }}>
                {stats.pendingCount} faculty pending payment
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Month Status & Auto-Sync */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div
            className="p-3 bg-white border rounded-4 shadow-xs h-100 d-flex flex-column justify-content-between"
            style={{ borderColor: '#E2E8F0', borderLeft: '4px solid #2563EB' }}
          >
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-sa-muted fw-semibold" style={{ fontSize: '12px' }}>
                Current Active Period
              </span>
              <div
                className="rounded-3 d-flex align-items-center justify-content-center"
                style={{ width: '34px', height: '34px', backgroundColor: '#EFF6FF', color: '#2563EB' }}
              >
                <Sparkles size={17} />
              </div>
            </div>
            <div>
              <div className="fw-bold brand-font text-sa-charcoal" style={{ fontSize: '18px', lineHeight: 1.2 }}>
                {currentMonthName}
              </div>
              <span className="text-success mt-1 d-block fw-semibold" style={{ fontSize: '11px' }}>
                ● Auto-Synchronized on Month Start
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Filter Bar & Quick Month Pills */}
      <div className="sa-card p-3 d-flex flex-column gap-3">
        <div className="d-flex flex-column flex-md-row align-items-stretch align-items-md-center justify-content-between gap-3">
          {/* Quick Month Filter Pills */}
          <div className="d-flex align-items-center gap-1.5 flex-wrap">
            <span className="small text-muted fw-semibold me-1 d-none d-sm-inline" style={{ fontSize: '12px' }}>
              <Filter size={13} className="me-1 inline-block" /> Filter Month:
            </span>
            <button
              type="button"
              onClick={() => setSelectedMonth('ALL')}
              className="btn btn-sm px-3 py-1.5 rounded-pill fw-semibold"
              style={{
                fontSize: '12px',
                backgroundColor: selectedMonth === 'ALL' ? '#8B1216' : '#F1F5F9',
                color: selectedMonth === 'ALL' ? '#FFFFFF' : '#475569',
                border: selectedMonth === 'ALL' ? '1px solid #8B1216' : '1px solid #E2E8F0'
              }}
            >
              All Months ({salaries.length})
            </button>
            {availableMonths.slice(0, 4).map((m) => {
              const isSelected = selectedMonth !== 'ALL' && matchesMonth(m, selectedMonth);
              const isCurrent = matchesMonth(m, currentMonthName);
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setSelectedMonth(m)}
                  className="btn btn-sm px-3 py-1.5 rounded-pill fw-semibold d-inline-flex align-items-center gap-1"
                  style={{
                    fontSize: '12px',
                    backgroundColor: isSelected ? '#8B1216' : '#FFFFFF',
                    color: isSelected ? '#FFFFFF' : '#334155',
                    border: isSelected ? '1px solid #8B1216' : '1px solid #CBD5E1'
                  }}
                >
                  <span>{m}</span>
                  {isCurrent && (
                    <span
                      className="badge rounded-pill"
                      style={{
                        backgroundColor: isSelected ? '#FFFFFF' : '#FEE2E2',
                        color: isSelected ? '#8B1216' : '#B91C1C',
                        fontSize: '9.5px',
                        padding: '1px 5px'
                      }}
                    >
                      Current
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search & Month Dropdown */}
          <div className="d-flex align-items-center gap-2">
            <div className="input-group input-group-sm" style={{ width: '220px' }}>
              <span className="input-group-text bg-light border-end-0 text-muted">
                <Search size={14} />
              </span>
              <input
                type="text"
                placeholder="Search faculty or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-control bg-light border-start-0"
                style={{ fontSize: '12px' }}
              />
            </div>

            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="form-select form-select-sm"
              style={{ width: '170px', fontSize: '12px', fontWeight: 500 }}
            >
              <option value="ALL">All Months</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {m} {matchesMonth(m, currentMonthName) ? '(Current Month)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 4. Monthly Collection & Payout View OR Faculty Salary Register Table */}
      {viewMode === 'monthly' ? (
        <div className="sa-card p-3 p-md-4">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div>
              <h5 className="brand-font fw-bold text-sa-charcoal m-0 fs-6">
                Monthly Teacher Salary & Staff Payout View
              </h5>
              <span className="small text-sa-muted">
                Month-wise summary of payable, paid (NEFT vs Cash), recovery, hours, and account type split
              </span>
            </div>
          </div>
          <Table
            loading={loading}
            data={monthlySummaries}
            emptyMessage="No monthly salary records available."
            columns={[
              { key: 'month', title: 'Month', render: (v) => <span className="fw-bold text-sa-charcoal">{v}</span> },
              { key: 'facultyCount', title: 'Staff Count', render: (v) => <span className="badge bg-light text-dark border">{v} staff</span> },
              { key: 'totalNet', title: 'Total Payable (₹)', render: (v) => <span className="fw-semibold">₹ {Number(v || 0).toLocaleString()}</span> },
              { key: 'totalPaid', title: 'Paid (₹)', render: (v) => <span className="fw-bold text-success">₹ {Number(v || 0).toLocaleString()}</span> },
              { key: 'totalRecovery', title: 'Recovery (₹)', render: (v) => <span className="text-danger">₹ {Number(v || 0).toLocaleString()}</span> },
              { key: 'totalPending', title: 'Pending (₹)', render: (v) => <span className="fw-semibold text-warning-emphasis">₹ {Number(v || 0).toLocaleString()}</span> },
              {
                key: 'neftAmount',
                title: 'NEFT / Cash',
                render: (_, r) => (
                  <div className="small">
                    <div>NEFT: <strong>₹{Number(r.neftAmount || 0).toLocaleString()}</strong></div>
                    <div className="text-muted">Cash: <strong>₹{Number(r.cashAmount || 0).toLocaleString()}</strong></div>
                  </div>
                )
              },
              {
                key: 'academyCount',
                title: 'Account Split',
                render: (_, r) => (
                  <div className="small text-muted">
                    Academy: <strong>{r.academyCount}</strong> • Tutorial: <strong>{r.tutorialCount}</strong>
                  </div>
                )
              },
              {
                key: 'action',
                title: 'Inspect',
                align: 'end',
                render: (_, r) => (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedMonth(r.month);
                      setViewMode('detailed');
                    }}
                  >
                    View Month
                  </Button>
                )
              }
            ]}
          />
        </div>
      ) : (
      <div className="sa-card p-4">
        <Table
          columns={[
            {
              key: 'month',
              title: 'Salary Month',
              render: (val) => {
                const isCurrent = matchesMonth(val, currentMonthName);
                return (
                  <div className="d-flex align-items-center gap-1.5">
                    <span className="fw-bold text-sa-charcoal">{val}</span>
                    {isCurrent && (
                      <span
                        className="badge rounded-pill fw-semibold"
                        style={{
                          backgroundColor: '#FDF0F0',
                          color: '#8B1216',
                          border: '1px solid #FECACA',
                          fontSize: '10px',
                          padding: '2px 7px'
                        }}
                      >
                        Current Month
                      </span>
                    )}
                  </div>
                );
              }
            },
            {
              key: 'teacherName',
              title: 'Faculty',
              render: (val) => (
                <div className="fw-semibold text-sa-charcoal">
                  {val || 'Academy Faculty'}
                </div>
              )
            },
            {
              key: 'subject',
              title: 'Subject',
              render: (val) => (
                <span className="badge bg-light text-sa-muted border px-2 py-1 rounded-pill" style={{ fontSize: '11px' }}>
                  {val || 'General'}
                </span>
              )
            },
            {
              key: 'baseSalary',
              title: 'Base (₹)',
              render: (val) => <span className="fw-medium">₹ {Number(val || 0).toLocaleString()}</span>
            },
            {
              key: 'allowances',
              title: 'Allowances',
              render: (val) => (
                <span className="text-success small fw-medium">
                  +₹ {Number(val || 0).toLocaleString()}
                </span>
              )
            },
            {
              key: 'workingHours',
              title: 'Hours',
              render: (val) => (
                <span className="badge bg-light text-dark border d-inline-flex align-items-center gap-1 fw-semibold" style={{ fontSize: '11px' }}>
                  <Clock size={11} className="text-primary" />
                  <span>{Number(val || 0)} hrs</span>
                </span>
              )
            },
            {
              key: 'accountType',
              title: 'Account & Mode',
              render: (val, row) => {
                const mode = row.paymentMode || (String(row.transactionRef || '').toUpperCase().startsWith('CASH') ? 'Cash' : 'NEFT');
                return (
                  <div className="d-flex flex-column gap-1">
                    <span className="badge bg-light text-dark border" style={{ fontSize: '10.5px', width: 'fit-content' }}>
                      {val || 'Academy'}
                    </span>
                    <span className="text-muted" style={{ fontSize: '11px' }}>
                      <strong>{mode}</strong>
                    </span>
                  </div>
                );
              }
            },
            {
              key: 'netPayable',
              title: 'Net / Pending',
              render: (val, row) => (
                <div>
                  <span className="fw-bold text-sa-primary d-block">
                    ₹ {Number(val || 0).toLocaleString()}
                  </span>
                  <span
                    className="small fw-medium"
                    style={{
                      fontSize: '11px',
                      color: (row.status === 'Disbursed' || row.status === 'Fully Paid' || Number(row.amountPending || 0) <= 0) ? '#16A34A' : '#B45309'
                    }}
                  >
                    Pending: ₹ {Number(
                      (row.status === 'Disbursed' || row.status === 'Fully Paid')
                        ? 0
                        : (row.amountPending != null ? row.amountPending : Math.max(0, Number(val || 0) - Number(row.amountPaid || 0)))
                    ).toLocaleString()}
                  </span>
                </div>
              )
            },
            {
              key: 'status',
              title: 'Payment Status',
              render: (val, row) => {
                const isPaid = val === 'Disbursed' || val === 'Fully Paid';
                const isPartial = val === 'Partially Paid';
                return (
                  <div>
                    <span
                      className={`badge rounded-pill fw-semibold px-2.5 py-1 ${
                        isPaid ? 'badge-paid' : isPartial ? 'badge text-bg-warning text-dark' : 'badge-pending'
                      }`}
                      style={{ fontSize: '11px' }}
                    >
                      {isPaid ? 'Fully Paid' : val}
                    </span>
                    {row.installments && row.installments.length > 0 && (
                      <div className="mt-2" style={{ fontSize: '0.72rem', minWidth: '120px' }}>
                        <div className="text-muted mb-1 text-uppercase fw-semibold" style={{ fontSize: '0.65rem' }}>
                          History:
                        </div>
                        {row.installments.map((inst, i) => (
                          <div key={i} className="d-flex justify-content-between border-bottom pb-1 mb-1">
                            <span className="text-muted">Inst {i + 1}:</span>
                            <span className="text-success fw-bold">+₹{Number(inst.amount).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
            },
            {
              key: 'id',
              title: 'Action',
              align: 'end',
              render: (val, row) => (
                <div className="d-flex gap-1.5 justify-content-end flex-wrap">
                  <Button
                    size="sm"
                    variant="outline"
                    icon={Bell}
                    title="Send salary notification"
                    onClick={() => {
                      const mode = row.paymentMode || (String(row.transactionRef || '').toUpperCase().startsWith('CASH') ? 'Cash' : 'NEFT');
                      notificationService.notifyTeacherSalaryUpdate({
                        teacherName: row.teacherName,
                        month: row.month,
                        baseSalary: row.baseSalary,
                        netPayable: row.netPayable,
                        amountPaid: row.amountPaid,
                        amountPending: row.amountPending,
                        workingHours: row.workingHours,
                        accountType: row.accountType || 'Academy',
                        paymentMode: mode,
                        updatedBy: user?.full_name || user?.name || 'Academy Admin',
                        branch: user?.branch || 'Central Campus'
                      });
                      toast.success(`Salary notification sent for ${row.teacherName}!`);
                    }}
                  >
                    Notify
                  </Button>
                  {['Processing', 'Partially Paid'].includes(row.status) ? (
                    <>
                      <Button size="sm" variant="outline" icon={Edit2} onClick={() => handleEditClick(row)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="primary" onClick={() => handleDisburseClick(row)}>
                        Pay Installment
                      </Button>
                    </>
                  ) : (
                    <span className="small text-success fw-bold d-flex align-items-center gap-1 ms-1">
                      <CheckCircle size={14} /> Fully Paid
                    </span>
                  )}
                </div>
              )
            }
          ]}
          data={filteredSalaries}
          loading={loading}
        />
      </div>
      )}

      {/* Edit Salary Modal */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title={`Edit Salary: ${selectedRow?.teacherName || 'Faculty'}`}>
        <form onSubmit={handleSaveEdit}>
          <div className="mb-3">
            <Input
              label="Base Salary (₹) *"
              type="number"
              value={editForm.baseSalary}
              onChange={(e) => {
                const val = e.target.value;
                setEditForm((prev) => ({ ...prev, baseSalary: val }));
              }}
              required
            />
          </div>
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <Input
                label="Allowances (₹) *"
                type="number"
                value={editForm.allowances}
                onChange={(e) => {
                  const val = e.target.value;
                  setEditForm((prev) => ({ ...prev, allowances: val }));
                }}
                required
              />
            </div>
            <div className="col-12 col-md-6">
              <Input
                label="Deductions (₹) *"
                type="number"
                value={editForm.deductions}
                onChange={(e) => {
                  const val = e.target.value;
                  setEditForm((prev) => ({ ...prev, deductions: val }));
                }}
                required
              />
            </div>
          </div>
          <div className="row g-3 mt-1">
            <div className="col-6 col-md-4">
              <Input
                label="Recovery (₹)"
                type="number"
                value={editForm.recovery}
                onChange={(e) => setEditForm((prev) => ({ ...prev, recovery: e.target.value }))}
              />
            </div>
            <div className="col-6 col-md-4">
              <Input
                label="Working Hours"
                type="number"
                step="0.5"
                value={editForm.workingHours}
                onChange={(e) => setEditForm((prev) => ({ ...prev, workingHours: e.target.value }))}
              />
            </div>
            <div className="col-12 col-md-4">
              <Input
                label="Yearly Salary (₹)"
                type="number"
                value={editForm.yearlySalary}
                onChange={(e) => setEditForm((prev) => ({ ...prev, yearlySalary: e.target.value }))}
              />
            </div>
          </div>
          <div className="row g-3 mt-1">
            <div className="col-12 col-md-6">
              <label className="form-label small fw-semibold text-sa-charcoal mb-1">Account Type</label>
              <select
                className="form-select"
                value={editForm.accountType}
                onChange={(e) => setEditForm((prev) => ({ ...prev, accountType: e.target.value }))}
              >
                <option value="Academy">Academy</option>
                <option value="Tutorial">Tutorial</option>
              </select>
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label small fw-semibold text-sa-charcoal mb-1">Payment Mode (NEFT / Cash)</label>
              <select
                className="form-select"
                value={editForm.paymentMode}
                onChange={(e) => setEditForm((prev) => ({ ...prev, paymentMode: e.target.value }))}
              >
                <option value="NEFT">NEFT</option>
                <option value="Cash">Cash</option>
              </select>
            </div>
          </div>
          <div className="mb-3 mt-3">
            <Input
              label="Net Payable (₹) *"
              type="number"
              value={editForm.netPayable}
              onChange={(e) => {
                const val = e.target.value;
                setEditForm((prev) => ({ ...prev, netPayable: val }));
              }}
              required
            />
          </div>
          <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            <Button variant="light" type="button" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Disburse Payment Modal */}
      <Modal isOpen={disburseModalOpen} onClose={() => setDisburseModalOpen(false)} title={`Disburse Payment: ${disburseForm.name}`}>
        <form onSubmit={submitDisburse}>
          <div className="mb-3">
            <Input
              label="Installment Amount (₹) *"
              type="number"
              placeholder="Enter amount to pay..."
              value={disburseForm.amount}
              onChange={(e) => setDisburseForm((prev) => ({ ...prev, amount: e.target.value }))}
              min={1}
              required
            />
          </div>
          <div className="row g-3 mb-3">
            <div className="col-6">
              <label className="form-label small fw-semibold text-sa-charcoal mb-1">Account Type</label>
              <select
                className="form-select"
                value={disburseForm.accountType}
                onChange={(e) => setDisburseForm((prev) => ({ ...prev, accountType: e.target.value }))}
              >
                <option value="Academy">Academy</option>
                <option value="Tutorial">Tutorial</option>
              </select>
            </div>
            <div className="col-6">
              <label className="form-label small fw-semibold text-sa-charcoal mb-1">Payment Mode</label>
              <select
                className="form-select"
                value={disburseForm.paymentMode}
                onChange={(e) => setDisburseForm((prev) => ({ ...prev, paymentMode: e.target.value }))}
              >
                <option value="NEFT">NEFT</option>
                <option value="Cash">Cash</option>
              </select>
            </div>
          </div>
          <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            <Button variant="light" type="button" onClick={() => setDisburseModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Confirm Payment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
