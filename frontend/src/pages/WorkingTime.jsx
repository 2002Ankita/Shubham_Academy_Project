import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/common/Modal';
import attendanceService from '../services/attendanceService';
import salaryService from '../services/salaryService';
import useAuth from '../hooks/useAuth';
import {
  ArrowLeft,
  Calendar,
  CalendarDays,
  Clock,
  TrendingUp,
  AlertCircle,
  IndianRupee,
  ChevronDown,
  Upload,
  UploadCloud,
  Download,
  Info
} from 'lucide-react';
import { toast } from 'react-toastify';
import { downloadSalaryReceipt } from '../utils/salaryReceipt';

export default function WorkingTime() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('October 2026');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const targetTeacherId = user?.id || 'TCH-001';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [attData, salData] = await Promise.all([
          attendanceService.getWorkingTime(targetTeacherId).catch(() => []),
          salaryService.getMySalaries().catch(() => [])
        ]);
        setRecords(attData || []);
        setSalaries(salData || []);
      } catch (err) {
        console.error('Error fetching working time data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [targetTeacherId]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUploadSubmit = (e) => {
    e?.preventDefault();
    if (!selectedFile) {
      toast.error('Please select a timesheet or attendance file to upload');
      return;
    }
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      toast.success(`Timesheet "${selectedFile.name}" uploaded successfully!`);
      setSelectedFile(null);
      setUploadModalOpen(false);
    }, 600);
  };

  const handleDownloadTemplate = () => {
    const templateContent = `Date,CheckIn,CheckOut,HoursWorked,Subject,Class,Notes\n2026-10-01,09:00 AM,05:00 PM,8,Mathematics,Class 10A,Regular lecture & doubts\n2026-10-02,09:00 AM,05:00 PM,8,Mathematics,Class 10B,Regular lecture\n2026-10-03,09:00 AM,05:00 PM,8,Mathematics,Class 10A,Practical assessment\n`;
    const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Timesheet_Template_October_2026.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Timesheet template downloaded successfully!');
  };

  const monthOptions = useMemo(() => {
    const defaultMonths = [
      'October 2026',
      'September 2026',
      'August 2026',
      'July 2026',
      'June 2026',
      'May 2026',
      'April 2026',
      'March 2026',
      'February 2026',
      'January 2026'
    ];
    const list = new Set(defaultMonths);
    salaries.forEach((s) => {
      if (s.month) list.add(s.month);
    });
    return Array.from(list);
  }, [salaries]);

  // Find salary matching selected month
  const currentSalary = useMemo(() => {
    if (!salaries || salaries.length === 0) return null;
    return salaries.find(
      (s) => (s.month || '').toLowerCase() === selectedMonth.toLowerCase()
    );
  }, [salaries, selectedMonth]);

  const safeNum = (val) => Number(val) || 0;

  // Calculate today's and weekly hours
  const todayMinutes = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todayRec = records.find((r) => r.date === today);
    if (!todayRec?.totalHours) return 0;
    const match = todayRec.totalHours.match(/(\d+)h(?:\s*(\d+)m)?/);
    return match ? Number(match[1]) * 60 + Number(match[2] || 0) : 0;
  }, [records]);

  const formatHoursMinutes = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${String(m).padStart(2, '0')}m`;
  };

  const summary = {
    todayHours: todayMinutes > 0 ? formatHoursMinutes(todayMinutes) : '0h 00m',
    weeklyHours: '0 hrs',
    hourlyRate: currentSalary?.hourlyRate ? `₹${currentSalary.hourlyRate}` : '₹0',
    paymentStatus: currentSalary?.status || 'N/A'
  };

  const breakdown = {
    basicSalary: safeNum(currentSalary?.baseSalary),
    workingHoursPay: 0,
    overtime: 0,
    allowances: safeNum(currentSalary?.allowances),
    totalEarnings: safeNum(currentSalary?.baseSalary) + safeNum(currentSalary?.allowances),
    pt: Math.min(200, safeNum(currentSalary?.deductions)),
    otherDeductions: Math.max(0, safeNum(currentSalary?.deductions) - Math.min(200, safeNum(currentSalary?.deductions))),
    totalDeductions: safeNum(currentSalary?.deductions),
    netSalary: safeNum(currentSalary?.netPayable)
  };

  const handleDownloadPayslip = () => {
    downloadSalaryReceipt({
      month: selectedMonth,
      record: currentSalary,
      user,
      breakdown: {
        basicSalary: breakdown.basicSalary,
        workingHoursPay: breakdown.workingHoursPay,
        overtime: breakdown.overtime,
        allowances: breakdown.allowances,
        deductions: breakdown.totalDeductions,
        pt: breakdown.pt,
        otherDeductions: breakdown.otherDeductions,
        netSalary: breakdown.netSalary,
        workingHours: 160,
        payPeriod: selectedMonth
      },
      summary: {
        workingHours: '160 hrs',
        hourlyRate: summary.hourlyRate,
        paymentStatus: summary.paymentStatus
      }
    });
  };

  return (
    <div className="d-flex flex-column w-100" style={{ gap: '22px' }}>
      {/* 1. Page Header */}
      <div className="pt-1 d-flex justify-content-between align-items-center flex-wrap gap-3">
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
            <h1 className="fw-bold brand-font text-sa-charcoal m-0" style={{ fontSize: '22px', lineHeight: 1.25 }}>
              Working Time
            </h1>
            <p className="text-sa-muted m-0 mt-1" style={{ fontSize: '13px' }}>
              Track your daily working hours, attendance and punch records
            </p>
          </div>
        </div>

        {/* Top Action Area: Download Template & View Attendance Logs */}
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="btn btn-sm d-inline-flex align-items-center gap-2 bg-white border fw-medium shadow-2xs"
            style={{
              borderColor: '#E2E8F0',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '13px',
              color: '#8B151B',
              whiteSpace: 'nowrap',
              cursor: 'pointer'
            }}
            aria-label="Download Template"
            title="Download Template"
          >
            <Download size={15} style={{ color: '#8B151B' }} />
            <span>Download Template</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/teacher/attendance')}
            className="btn btn-sm d-inline-flex align-items-center gap-2 text-white border-0 fw-medium"
            style={{
              backgroundColor: '#8B151B',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '13px',
              whiteSpace: 'nowrap'
            }}
            aria-label="View Attendance Logs"
            title="View Attendance Logs"
          >
            <CalendarDays size={15} />
            <span>View Attendance Logs</span>
          </button>
        </div>
      </div>

      {/* 2. Four Summary KPI Cards */}
      <div className="row g-3">
        {/* Today's Hours */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="sa-card bg-white border d-flex align-items-center gap-3 h-100"
            style={{
              minHeight: '88px',
              padding: '14px 18px',
              borderColor: '#E5E7EB',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)'
            }}
          >
            <div
              className="d-flex align-items-center justify-content-center flex-shrink-0 rounded-circle"
              style={{
                width: '42px',
                height: '42px',
                backgroundColor: '#FDF0F0',
                color: '#DC2626'
              }}
            >
              <Clock size={20} />
            </div>
            <div className="min-w-0 flex-grow-1">
              <div className="text-sa-muted fw-medium text-truncate" style={{ fontSize: '11.5px' }}>
                Today's Hours
              </div>
              <div className="brand-font fw-bold text-sa-charcoal text-truncate" style={{ fontSize: '20px', lineHeight: 1.2 }}>
                {summary.todayHours}
              </div>
              <div className="text-sa-muted text-truncate" style={{ fontSize: '11px', marginTop: '2px' }}>
                Active logged today
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Hours */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="sa-card bg-white border d-flex align-items-center gap-3 h-100"
            style={{
              minHeight: '88px',
              padding: '14px 18px',
              borderColor: '#E5E7EB',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)'
            }}
          >
            <div
              className="d-flex align-items-center justify-content-center flex-shrink-0 rounded-circle"
              style={{
                width: '42px',
                height: '42px',
                backgroundColor: '#EAF6EF',
                color: '#168554'
              }}
            >
              <Calendar size={20} />
            </div>
            <div className="min-w-0 flex-grow-1">
              <div className="text-sa-muted fw-medium text-truncate" style={{ fontSize: '11.5px' }}>
                Weekly Hours
              </div>
              <div className="brand-font fw-bold text-sa-charcoal text-truncate" style={{ fontSize: '20px', lineHeight: 1.2 }}>
                {summary.weeklyHours}
              </div>
              <div className="text-sa-muted text-truncate" style={{ fontSize: '11px', marginTop: '2px' }}>
                -
              </div>
            </div>
          </div>
        </div>

        {/* Hourly Rate */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="sa-card bg-white border d-flex align-items-center gap-3 h-100"
            style={{
              minHeight: '88px',
              padding: '14px 18px',
              borderColor: '#E5E7EB',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)'
            }}
          >
            <div
              className="d-flex align-items-center justify-content-center flex-shrink-0 rounded-circle"
              style={{
                width: '42px',
                height: '42px',
                backgroundColor: '#F0F9FF',
                color: '#0284C7'
              }}
            >
              <TrendingUp size={20} />
            </div>
            <div className="min-w-0 flex-grow-1">
              <div className="text-sa-muted fw-medium text-truncate" style={{ fontSize: '11.5px' }}>
                Hourly Rate
              </div>
              <div className="brand-font fw-bold text-sa-charcoal text-truncate" style={{ fontSize: '20px', lineHeight: 1.2 }}>
                {summary.hourlyRate}
              </div>
              <div className="text-sa-muted text-truncate" style={{ fontSize: '11px', marginTop: '2px' }}>
                -
              </div>
            </div>
          </div>
        </div>

        {/* Payment Status */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="sa-card bg-white border d-flex align-items-center gap-3 h-100"
            style={{
              minHeight: '88px',
              padding: '14px 18px',
              borderColor: '#E5E7EB',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)'
            }}
          >
            <div
              className="d-flex align-items-center justify-content-center flex-shrink-0 rounded-circle"
              style={{
                width: '42px',
                height: '42px',
                backgroundColor: '#FEF8EB',
                color: '#D97718'
              }}
            >
              <AlertCircle size={20} />
            </div>
            <div className="min-w-0 flex-grow-1">
              <div className="text-sa-muted fw-medium text-truncate" style={{ fontSize: '11.5px' }}>
                Payment Status
              </div>
              <div className="brand-font fw-bold text-truncate" style={{ fontSize: '20px', lineHeight: 1.2, color: '#D97718' }}>
                {summary.paymentStatus}
              </div>
              <div className="text-sa-muted text-truncate" style={{ fontSize: '11px', marginTop: '2px' }}>
                Not yet processed
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Salary Breakdown Card */}
      <div
        className="sa-card bg-white border"
        style={{
          width: '100%',
          minWidth: 0,
          boxSizing: 'border-box',
          borderRadius: '12px',
          borderColor: '#E5E7EB',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          padding: '22px 24px'
        }}
      >
        {/* Card Header: Title & Right Actions (Month dropdown -> Upload Timesheet -> Download Payslip) */}
        <div
          className="d-flex justify-content-between align-items-center flex-wrap gap-3 pb-3 mb-3 border-bottom"
          style={{ borderColor: '#E5E7EB' }}
        >
          {/* Left: Icon, Title & Subtitle */}
          <div className="d-flex align-items-center gap-2.5 min-w-0">
            <div
              className="d-flex align-items-center justify-content-center flex-shrink-0 rounded-circle"
              style={{
                width: '38px',
                height: '38px',
                backgroundColor: '#FDF0F0',
                color: '#DC2626'
              }}
            >
              <IndianRupee size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="brand-font fw-bold m-0 text-sa-charcoal" style={{ fontSize: '15px', lineHeight: 1.25 }}>
                Salary Breakdown
              </h3>
              <p className="text-sa-muted m-0 mt-0.5 text-truncate" style={{ fontSize: '12px' }}>
                Itemized pay components for current billing cycle
              </p>
            </div>
          </div>

          {/* Right Action Area in EXACT Requested Order:
              [October 2026 dropdown] [Upload Timesheet] [Download Payslip] */}
          <div className="d-flex align-items-center gap-2 flex-wrap">
            {/* 1. Month Dropdown */}
            <div className="position-relative d-inline-flex align-items-center">
              <CalendarDays
                size={13}
                className="position-absolute"
                style={{ left: '9px', pointerEvents: 'none', color: '#64748B' }}
              />
              <select
                id="working-time-month-select"
                aria-label="Select salary month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="form-select form-select-sm"
                style={{
                  fontSize: '12px',
                  height: '34px',
                  borderColor: '#CBD5E1',
                  color: '#334155',
                  paddingLeft: '28px',
                  paddingRight: '26px',
                  borderRadius: '6px',
                  backgroundColor: '#FFFFFF',
                  cursor: 'pointer',
                  appearance: 'none',
                  WebkitAppearance: 'none'
                }}
              >
                {monthOptions.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={12}
                className="position-absolute"
                style={{ right: '8px', pointerEvents: 'none', color: '#64748B' }}
              />
            </div>

            {/* 2. Upload Timesheet Button */}
            <button
              id="upload-timesheet-breakdown-btn"
              type="button"
              onClick={() => setUploadModalOpen(true)}
              className="btn btn-sm d-inline-flex align-items-center gap-1.5 px-3 rounded-2 fw-medium flex-shrink-0 transition-all"
              style={{
                fontSize: '12px',
                height: '34px',
                borderColor: '#E05D52',
                color: '#DC2626',
                backgroundColor: '#FFFFFF'
              }}
              aria-label="Upload Timesheet"
              title="Upload Timesheet"
            >
              <Upload size={13} style={{ color: '#DC2626' }} />
              <span>Upload Timesheet</span>
            </button>

            {/* 3. Download Payslip Button */}
            <button
              id="download-payslip-breakdown-btn"
              type="button"
              onClick={handleDownloadPayslip}
              className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1.5 px-3 rounded-2 fw-medium flex-shrink-0 transition-all"
              style={{
                fontSize: '12px',
                height: '34px',
                borderColor: '#CBD5E1',
                color: '#475569',
                backgroundColor: '#FFFFFF'
              }}
              aria-label="Download Payslip"
              title="Download Payslip"
            >
              <Download size={13} />
              <span>Download Payslip</span>
            </button>
          </div>
        </div>

        {/* Two-Column Breakdown: Earnings & Additions | Deductions & Taxes */}
        <div className="row g-4 pt-1">
          {/* Column 1: Earnings & Additions */}
          <div className="col-12 col-md-6 d-flex flex-column">
            <div className="pb-2 mb-1 border-bottom" style={{ borderColor: '#E2E8F0' }}>
              <span className="fw-bold" style={{ fontSize: '13px', color: '#168554', letterSpacing: '0.01em' }}>
                Earnings & Additions
              </span>
            </div>
            <div className="d-flex flex-column" style={{ fontSize: '13px' }}>
              <div className="d-flex justify-content-between align-items-center py-2 border-bottom border-light" style={{ minHeight: '38px' }}>
                <span className="text-sa-charcoal">Basic Salary</span>
                <span className="fw-semibold text-sa-charcoal">₹{breakdown.basicSalary.toLocaleString()}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center py-2 border-bottom border-light" style={{ minHeight: '38px' }}>
                <span className="text-sa-charcoal">Working Hours Pay</span>
                <span className="fw-semibold text-sa-charcoal">₹{breakdown.workingHoursPay.toLocaleString()}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center py-2 border-bottom border-light" style={{ minHeight: '38px' }}>
                <span className="text-sa-charcoal">Overtime / Doubt Sessions</span>
                <span className="fw-semibold text-sa-charcoal">₹{breakdown.overtime.toLocaleString()}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center py-2 border-bottom border-light" style={{ minHeight: '38px' }}>
                <span className="text-sa-charcoal">Other Allowances</span>
                <span className="fw-semibold text-sa-charcoal">₹{breakdown.allowances.toLocaleString()}</span>
              </div>
              {/* Total Earnings Strip */}
              <div
                className="d-flex justify-content-between align-items-center px-3 py-2.5 mt-2 rounded-2"
                style={{ backgroundColor: '#EAF6EF' }}
              >
                <span className="fw-bold" style={{ color: '#168554', fontSize: '13px' }}>
                  Total Earnings
                </span>
                <span className="fw-bold" style={{ color: '#168554', fontSize: '13px' }}>
                  ₹{breakdown.totalEarnings.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Column 2: Deductions & Taxes */}
          <div className="col-12 col-md-6 d-flex flex-column">
            <div className="pb-2 mb-1 border-bottom" style={{ borderColor: '#E2E8F0' }}>
              <span className="fw-bold" style={{ fontSize: '13px', color: '#DC2626', letterSpacing: '0.01em' }}>
                Deductions & Taxes
              </span>
            </div>
            <div className="d-flex flex-column" style={{ fontSize: '13px' }}>
              <div className="d-flex justify-content-between align-items-center py-2 border-bottom border-light" style={{ minHeight: '38px' }}>
                <span className="text-sa-charcoal">Professional Tax (PT)</span>
                <span className="fw-semibold text-danger">-₹{breakdown.pt.toLocaleString()}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center py-2 border-bottom border-light" style={{ minHeight: '38px' }}>
                <span className="text-sa-charcoal">Leave Without Pay / Deductions</span>
                <span className="fw-semibold text-danger">-₹{breakdown.otherDeductions.toLocaleString()}</span>
              </div>
              {/* Total Deductions Row */}
              <div className="d-flex justify-content-between align-items-center py-2 mt-2">
                <span className="fw-bold text-danger" style={{ fontSize: '13px' }}>
                  Total Deductions
                </span>
                <span className="fw-bold text-danger" style={{ fontSize: '13px' }}>
                  -₹{breakdown.totalDeductions.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Information Message */}
        <div
          className="d-flex align-items-center gap-2.5 rounded-2 mt-4 px-3 py-2.5"
          style={{
            backgroundColor: '#EFF6FF',
            border: '1px solid #DBEAFE',
            fontSize: '12.5px',
            color: '#1D4ED8'
          }}
        >
          <Info size={16} className="flex-shrink-0" style={{ color: '#2563EB' }} />
          <span>
            Your salary is processed as per the school's payroll policy. For any queries, please contact the administration office.
          </span>
        </div>
      </div>

      {/* Upload Timesheet Modal */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => {
          if (!isUploading) {
            setUploadModalOpen(false);
            setSelectedFile(null);
          }
        }}
        title="Upload Timesheet Records"
      >
        <form onSubmit={handleUploadSubmit} className="d-flex flex-column gap-3">
          <p className="text-sa-muted m-0" style={{ fontSize: '13px' }}>
            Upload your monthly timesheet, punch records, or attendance logs to sync with your working hours quota.
          </p>

          <label
            htmlFor="timesheet-file-input"
            className="d-flex flex-column align-items-center justify-content-center border border-2 rounded-4 p-4 text-center"
            style={{
              borderColor: selectedFile ? '#22B477' : '#CBD5E1',
              borderStyle: 'dashed',
              backgroundColor: selectedFile ? '#F0FDF4' : '#F8FAFC',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <input
              id="timesheet-file-input"
              type="file"
              accept=".csv,.xlsx,.xls,.pdf,.txt"
              onChange={handleFileSelect}
              className="d-none"
            />
            <div
              className="d-flex align-items-center justify-content-center rounded-circle mb-2"
              style={{
                width: '48px',
                height: '48px',
                backgroundColor: selectedFile ? '#DCFCE7' : '#FEF2F2',
                color: selectedFile ? '#16A34A' : '#8B1216'
              }}
            >
              <UploadCloud size={24} />
            </div>

            {selectedFile ? (
              <div>
                <div className="fw-bold text-sa-charcoal" style={{ fontSize: '14px' }}>
                  {selectedFile.name}
                </div>
                <div className="text-sa-muted mt-1" style={{ fontSize: '12px' }}>
                  {(selectedFile.size / 1024).toFixed(1)} KB &bull; Ready to upload
                </div>
              </div>
            ) : (
              <div>
                <div className="fw-semibold text-sa-charcoal" style={{ fontSize: '14px' }}>
                  Click to browse or drag & drop file here
                </div>
                <div className="text-sa-muted mt-1" style={{ fontSize: '12px' }}>
                  Supports Excel (.xlsx, .xls), CSV (.csv), or PDF up to 10MB
                </div>
              </div>
            )}
          </label>

          {selectedFile && (
            <div className="d-flex justify-content-end">
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="btn btn-sm btn-link text-danger text-decoration-none p-0"
                style={{ fontSize: '12px' }}
              >
                Remove selected file
              </button>
            </div>
          )}

          <div className="d-flex justify-content-end align-items-center gap-2 pt-2 border-top mt-2">
            <button
              type="button"
              onClick={() => {
                setUploadModalOpen(false);
                setSelectedFile(null);
              }}
              disabled={isUploading}
              className="btn btn-light border px-3 py-2 fw-medium"
              style={{ borderRadius: '8px', fontSize: '13px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedFile || isUploading}
              className="btn text-white px-4 py-2 fw-semibold d-inline-flex align-items-center gap-2"
              style={{
                backgroundColor: '#8B1216',
                borderRadius: '8px',
                fontSize: '13px',
                opacity: !selectedFile || isUploading ? 0.7 : 1
              }}
            >
              <Upload size={14} />
              {isUploading ? 'Uploading...' : 'Upload Timesheet'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
