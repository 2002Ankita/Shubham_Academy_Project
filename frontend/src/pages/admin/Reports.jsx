import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import reportService from '../../services/reportService';
import studentService from '../../services/studentService';
import feeService from '../../services/feeService';
import salaryService from '../../services/salaryService';
import passoutService from '../../services/passoutService';
import { useAuth } from '../../hooks/useAuth';
import { getUserBranch, isSuperAdminUser } from '../../utils/branchUtils';
import {
  exportStudentsToExcel,
  exportFeesToExcel,
  exportSalariesToExcel,
  exportDiscountsToExcel,
  exportToExcel
} from '../../utils/excelExporter';
import {
  FileText,
  Download,
  Plus,
  BookOpen,
  ChevronRight,
  FileSpreadsheet,
  Building2,
  ShieldCheck,
  Users,
  CreditCard,
  IndianRupee,
  GraduationCap,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';
import { toast } from 'react-toastify';

export default function AdminReports() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuper = isSuperAdminUser(user);
  const userBranch = getUserBranch(user);

  const [campusFilter, setCampusFilter] = useState(isSuper ? 'ALL' : (userBranch || 'Tarabai Park'));
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportingModule, setExportingModule] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [newReport, setNewReport] = useState({ name: '', type: 'Attendance', fileFormat: 'PDF' });
  const [summaryData, setSummaryData] = useState(null);

  const activeCampusName = isSuper
    ? (campusFilter === 'ALL' ? 'Both Campuses (Consolidated)' : campusFilter)
    : (userBranch || 'Tarabai Park');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [list, summary] = await Promise.all([
        reportService.getAll().catch(() => []),
        reportService.getSummary(isSuper && campusFilter !== 'ALL' ? campusFilter : null).catch(() => null)
      ]);
      setReports(list);
      setSummaryData(summary);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [campusFilter]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    await reportService.generateReport({
      ...newReport,
      campus: activeCampusName,
      generatedBy: user?.full_name || 'Admin'
    });
    toast.success('Custom report generated and archived!');
    setModalOpen(false);
    setNewReport({ name: '', type: 'Attendance', fileFormat: 'PDF' });
    fetchReports();
  };

  const handleDownload = (id) => {
    reportService.downloadReport(id);
    toast.info('Downloading official report document...');
  };

  // Module Excel Exporters
  const handleExportStudents = async () => {
    setExportingModule('students');
    try {
      toast.info('Fetching students dataset for Excel export...');
      const students = await studentService.getAll().catch(() => []);
      let filtered = students || [];
      if (campusFilter !== 'ALL') {
        filtered = filtered.filter(s => (s.branch || '').toLowerCase().includes(campusFilter.toLowerCase()));
      }
      exportStudentsToExcel(filtered, activeCampusName);
      toast.success(`Exported ${filtered.length} student records to Excel (.xlsx)!`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to export students report');
    } finally {
      setExportingModule(null);
    }
  };

  const handleExportFees = async () => {
    setExportingModule('fees');
    try {
      toast.info('Compiling fee collection ledger for Excel export...');
      const payments = await feeService.getPayments().catch(() => []);
      let filtered = payments || [];
      if (campusFilter !== 'ALL') {
        filtered = filtered.filter(p => (p.branch || '').toLowerCase().includes(campusFilter.toLowerCase()));
      }
      exportFeesToExcel(filtered, activeCampusName);
      toast.success(`Exported ${filtered.length} fee collection receipts to Excel (.xlsx)!`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to export fees report');
    } finally {
      setExportingModule(null);
    }
  };

  const handleExportSalary = async () => {
    setExportingModule('salary');
    try {
      toast.info('Compiling faculty payroll records for Excel export...');
      const salaries = await salaryService.getAllDisbursements().catch(() => []);
      let filtered = salaries || [];
      if (campusFilter !== 'ALL') {
        filtered = filtered.filter(s => (s.branch || '').toLowerCase().includes(campusFilter.toLowerCase()));
      }
      exportSalariesToExcel(filtered, activeCampusName);
      toast.success(`Exported ${filtered.length} salary records to Excel (.xlsx)!`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to export salary report');
    } finally {
      setExportingModule(null);
    }
  };

  const handleExportDiscounts = async () => {
    setExportingModule('discounts');
    try {
      toast.info('Compiling student concessions dataset for Excel export...');
      const students = await studentService.getAll().catch(() => []);
      let withDisc = (students || []).filter(s => Number(s.discountAmount || s.discountRequestedAmount || 0) > 0 || s.discountStatus === 'APPROVED');
      if (campusFilter !== 'ALL') {
        withDisc = withDisc.filter(s => (s.branch || '').toLowerCase().includes(campusFilter.toLowerCase()));
      }
      exportDiscountsToExcel(withDisc, activeCampusName);
      toast.success(`Exported ${withDisc.length} concession audit records to Excel (.xlsx)!`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to export concessions report');
    } finally {
      setExportingModule(null);
    }
  };

  const handleExportPassout = async () => {
    setExportingModule('passout');
    try {
      toast.info('Fetching passout alumni records for Excel export...');
      const list = await passoutService.getAll().catch(() => []);
      let filtered = list || [];
      if (campusFilter !== 'ALL') {
        filtered = filtered.filter(p => (p.branch || '').toLowerCase().includes(campusFilter.toLowerCase()));
      }

      const headers = ['Roll Number', 'Student Name', 'Standard', 'Passing Year', 'Final Grade / %', 'Stream', 'Campus Branch', 'Alumni Contact'];
      const rows = filtered.map(p => [
        p.roll_number || p.student_id || 'N/A',
        p.full_name || p.name || 'Alumni',
        p.standard || '12th',
        p.passing_year || '2025',
        p.final_percentage ? `${p.final_percentage}%` : (p.grade || 'A+'),
        p.stream || 'Science',
        p.branch || activeCampusName,
        p.mobile || p.contact_number || 'N/A'
      ]);

      exportToExcel({
        filename: `Shubham_Classes_Kolhapur_Passout_Students_${new Date().toISOString().slice(0, 10)}`,
        sheetName: 'Passout Students',
        title: 'SHUBHAM CLASSES - KOLHAPUR',
        subtitle: 'PASSOUT ALUMNI & ACADEMIC ACHIEVERS REGISTER',
        campus: activeCampusName,
        headers,
        rows
      });
      toast.success(`Exported ${filtered.length} passout student records to Excel (.xlsx)!`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to export passout report');
    } finally {
      setExportingModule(null);
    }
  };

  return (
    <div className="d-flex flex-column gap-4">
      {/* Header Banner with Official Branding */}
      <div
        className="p-4 rounded-4 shadow-sm text-white position-relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #8B1216 0%, #600B0E 60%, #3D0406 100%)',
          border: '1px solid rgba(255, 255, 255, 0.15)'
        }}
      >
        <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3 position-relative" style={{ zIndex: 1 }}>
          <div className="d-flex align-items-center gap-3">
            <img
              src="/assets/shubham-logo.png"
              alt="Shubham Classes - Kolhapur"
              style={{
                maxHeight: '62px',
                width: 'auto',
                filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.4))'
              }}
            />
            <div>
              <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                <span className="badge rounded-pill bg-white text-danger fw-bold px-2.5 py-0.5" style={{ fontSize: '0.72rem' }}>
                  🎓 SHUBHAM CLASSES • KOLHAPUR
                </span>
                <span className="badge rounded-pill bg-warning text-dark fw-bold px-2.5 py-0.5" style={{ fontSize: '0.72rem' }}>
                  {isSuper ? '👑 SUPER ADMIN AUDIT' : '🏛️ CAMPUS ADMIN ACCESS'}
                </span>
              </div>
              <h2 className="m-0 fw-bold" style={{ fontSize: '1.45rem', letterSpacing: '-0.02em' }}>
                Official Academy Audit &amp; Reports Center
              </h2>
              <span className="text-white text-opacity-80 d-block mt-0.5" style={{ fontSize: '0.82rem' }}>
                Generate official Excel reports and view cross-campus ledgers for <strong>Mangalvar Peth</strong> &amp; <strong>Tarabai Park</strong>.
              </span>
            </div>
          </div>

          {/* Campus Switcher for Super Admin */}
          {isSuper && (
            <div className="d-inline-flex align-items-center p-1.5 rounded-pill bg-white bg-opacity-15 border border-white border-opacity-25" style={{ gap: '4px' }}>
              <button
                type="button"
                onClick={() => setCampusFilter('ALL')}
                className={`btn btn-sm rounded-pill px-3 py-1 fw-bold transition-all ${
                  campusFilter === 'ALL'
                    ? 'btn-light text-danger shadow-xs'
                    : 'text-white border-0 bg-transparent'
                }`}
                style={{ fontSize: '0.74rem' }}
              >
                🌐 Both Campuses
              </button>
              <button
                type="button"
                onClick={() => setCampusFilter('Mangalvar Peth')}
                className={`btn btn-sm rounded-pill px-3 py-1 fw-bold transition-all ${
                  campusFilter === 'Mangalvar Peth'
                    ? 'btn-light text-danger shadow-xs'
                    : 'text-white border-0 bg-transparent'
                }`}
                style={{ fontSize: '0.74rem' }}
              >
                🏛️ Mangalvar Peth
              </button>
              <button
                type="button"
                onClick={() => setCampusFilter('Tarabai Park')}
                className={`btn btn-sm rounded-pill px-3 py-1 fw-bold transition-all ${
                  campusFilter === 'Tarabai Park'
                    ? 'btn-light text-danger shadow-xs'
                    : 'text-white border-0 bg-transparent'
                }`}
                style={{ fontSize: '0.74rem' }}
              >
                🌲 Tarabai Park
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Row 1: Excel Generation Suite (Requirement 36) */}
      <div>
        <div className="d-flex align-items-center justify-content-between mb-2.5">
          <div>
            <h4 className="fw-bold text-sa-charcoal m-0 fs-5 d-flex align-items-center gap-2">
              <FileSpreadsheet size={20} className="text-success" />
              <span>Instant Excel Reports Generation</span>
            </h4>
            <span className="text-muted small">
              Export authorized academy modules to structured, filtered Excel spreadsheets (.xlsx) with auto-formatted column headings.
            </span>
          </div>

          <span className="badge bg-light text-secondary border px-2.5 py-1 fw-semibold small">
            Scope: {activeCampusName}
          </span>
        </div>

        <div className="row g-3">
          {/* Card 1: Students Roster & Fee Ledger */}
          <div className="col-12 col-md-6 col-xl-4">
            <div className="sa-card p-3.5 bg-white border rounded-3 h-100 d-flex flex-column justify-content-between shadow-2xs hover-lift transition-all">
              <div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="p-2 rounded-2 bg-primary-subtle text-primary">
                    <Users size={18} />
                  </div>
                  <span className="badge bg-light text-primary border small fw-bold">Students Module</span>
                </div>
                <h6 className="fw-bold text-sa-charcoal mb-1 fs-6">Student Roster &amp; Fee Ledger</h6>
                <p className="text-muted small mb-3" style={{ fontSize: '12px', lineHeight: 1.4 }}>
                  Complete roll numbers, parent mobiles, standard, batches, total fees, collected amount, and outstanding dues.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-outline-success w-100 d-flex align-items-center justify-content-center gap-1.5 fw-semibold py-2 rounded-2"
                onClick={handleExportStudents}
                disabled={exportingModule === 'students'}
              >
                <FileSpreadsheet size={15} />
                <span>{exportingModule === 'students' ? 'Exporting...' : 'Download Students Excel (.xlsx)'}</span>
              </button>
            </div>
          </div>

          {/* Card 2: Fee Collections & Payments */}
          <div className="col-12 col-md-6 col-xl-4">
            <div className="sa-card p-3.5 bg-white border rounded-3 h-100 d-flex flex-column justify-content-between shadow-2xs hover-lift transition-all">
              <div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="p-2 rounded-2 bg-success-subtle text-success">
                    <IndianRupee size={18} />
                  </div>
                  <span className="badge bg-light text-success border small fw-bold">Finance Module</span>
                </div>
                <h6 className="fw-bold text-sa-charcoal mb-1 fs-6">Fee Collections &amp; Audit Trail</h6>
                <p className="text-muted small mb-3" style={{ fontSize: '12px', lineHeight: 1.4 }}>
                  Every receipt transaction, mode (UPI/Cash/Cheque), transaction references, dates, and balance reconciliation.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-outline-success w-100 d-flex align-items-center justify-content-center gap-1.5 fw-semibold py-2 rounded-2"
                onClick={handleExportFees}
                disabled={exportingModule === 'fees'}
              >
                <FileSpreadsheet size={15} />
                <span>{exportingModule === 'fees' ? 'Exporting...' : 'Download Fees Excel (.xlsx)'}</span>
              </button>
            </div>
          </div>

          {/* Card 3: Faculty Payroll & Salary */}
          <div className="col-12 col-md-6 col-xl-4">
            <div className="sa-card p-3.5 bg-white border rounded-3 h-100 d-flex flex-column justify-content-between shadow-2xs hover-lift transition-all">
              <div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="p-2 rounded-2 bg-warning-subtle text-dark">
                    <CreditCard size={18} />
                  </div>
                  <span className="badge bg-light text-warning-emphasis border small fw-bold">Payroll Module</span>
                </div>
                <h6 className="fw-bold text-sa-charcoal mb-1 fs-6">Faculty Salary &amp; Payroll Register</h6>
                <p className="text-muted small mb-3" style={{ fontSize: '12px', lineHeight: 1.4 }}>
                  Disbursement audit: base salary, working hours logged, advance recovery, net payable, and transaction status.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-outline-success w-100 d-flex align-items-center justify-content-center gap-1.5 fw-semibold py-2 rounded-2"
                onClick={handleExportSalary}
                disabled={exportingModule === 'salary'}
              >
                <FileSpreadsheet size={15} />
                <span>{exportingModule === 'salary' ? 'Exporting...' : 'Download Salary Excel (.xlsx)'}</span>
              </button>
            </div>
          </div>

          {/* Card 4: Fee Concessions & Approvals */}
          <div className="col-12 col-md-6 col-xl-4">
            <div className="sa-card p-3.5 bg-white border rounded-3 h-100 d-flex flex-column justify-content-between shadow-2xs hover-lift transition-all">
              <div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="p-2 rounded-2 bg-danger-subtle text-danger">
                    <ShieldCheck size={18} />
                  </div>
                  <span className="badge bg-light text-danger border small fw-bold">Discounts &amp; Limits</span>
                </div>
                <h6 className="fw-bold text-sa-charcoal mb-1 fs-6">Fee Concessions &amp; Approvals Audit</h6>
                <p className="text-muted small mb-3" style={{ fontSize: '12px', lineHeight: 1.4 }}>
                  Audit log of discounts approved by Admin (within ₹10,000 limit) and exceptional cases approved by Super Admin.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-outline-success w-100 d-flex align-items-center justify-content-center gap-1.5 fw-semibold py-2 rounded-2"
                onClick={handleExportDiscounts}
                disabled={exportingModule === 'discounts'}
              >
                <FileSpreadsheet size={15} />
                <span>{exportingModule === 'discounts' ? 'Exporting...' : 'Download Concessions Excel (.xlsx)'}</span>
              </button>
            </div>
          </div>

          {/* Card 5: Passout Alumni Students */}
          <div className="col-12 col-md-6 col-xl-4">
            <div className="sa-card p-3.5 bg-white border rounded-3 h-100 d-flex flex-column justify-content-between shadow-2xs hover-lift transition-all">
              <div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="p-2 rounded-2 bg-info-subtle text-info-emphasis">
                    <GraduationCap size={18} />
                  </div>
                  <span className="badge bg-light text-info-emphasis border small fw-bold">Alumni Module</span>
                </div>
                <h6 className="fw-bold text-sa-charcoal mb-1 fs-6">Passout Students &amp; Alumni Archive</h6>
                <p className="text-muted small mb-3" style={{ fontSize: '12px', lineHeight: 1.4 }}>
                  Archive of passed-out batches, passing years, academic scores/grades, stream, and alumni contact records.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-outline-success w-100 d-flex align-items-center justify-content-center gap-1.5 fw-semibold py-2 rounded-2"
                onClick={handleExportPassout}
                disabled={exportingModule === 'passout'}
              >
                <FileSpreadsheet size={15} />
                <span>{exportingModule === 'passout' ? 'Exporting...' : 'Download Passout Excel (.xlsx)'}</span>
              </button>
            </div>
          </div>

          {/* Card 6: Syllabus Pacing & Topic Duration Matrix */}
          <div className="col-12 col-md-6 col-xl-4">
            <div className="sa-card p-3.5 bg-white border rounded-3 h-100 d-flex flex-column justify-content-between shadow-2xs hover-lift transition-all">
              <div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="p-2 rounded-2 text-white" style={{ backgroundColor: '#8B1216' }}>
                    <BookOpen size={18} />
                  </div>
                  <span className="badge bg-danger-subtle text-danger border small fw-bold">Syllabus Module</span>
                </div>
                <h6 className="fw-bold text-sa-charcoal mb-1 fs-6">Topic Duration &amp; Curriculum Matrix</h6>
                <p className="text-muted small mb-3" style={{ fontSize: '12px', lineHeight: 1.4 }}>
                  Annual academic pacing matrix, period consumption, subject progression, and curriculum targets.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-sm text-white w-100 d-flex align-items-center justify-content-center gap-1.5 fw-semibold py-2 rounded-2 shadow-xs"
                style={{ backgroundColor: '#8B1216' }}
                onClick={() => navigate('/admin/topic-duration')}
              >
                <span>Open Matrix &amp; Excel Exporter</span>
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Archived Report Documents Table */}
      <div className="sa-card p-4 bg-white border rounded-3 shadow-2xs">
        <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom flex-wrap gap-2">
          <div>
            <h5 className="fw-bold text-sa-charcoal m-0 fs-6">Official Archived Report Documents</h5>
            <span className="text-muted small">Generated internal audits and signed certificates</span>
          </div>
          <Button variant="primary" icon={Plus} onClick={() => setModalOpen(true)}>
            Generate Custom Archive Report
          </Button>
        </div>

        <Table
          columns={[
            { key: 'id', title: 'Ref No.', render: (val) => <span className="fw-bold text-sa-charcoal">{val}</span> },
            {
              key: 'name',
              title: 'Report Title',
              render: (val) => (
                <span className="fw-semibold text-sa-charcoal d-flex align-items-center gap-2">
                  <FileText size={16} className="text-sa-primary" />
                  {val}
                </span>
              )
            },
            {
              key: 'type',
              title: 'Domain / Type',
              render: (val) => <span className="badge bg-light text-dark border">{val}</span>
            },
            { key: 'fileFormat', title: 'Format' },
            { key: 'size', title: 'Size' },
            { key: 'generatedDate', title: 'Date' },
            { key: 'generatedBy', title: 'Issued By' },
            {
              key: 'id',
              title: 'Action',
              align: 'end',
              render: (val) => (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 rounded-2"
                  onClick={() => handleDownload(val)}
                >
                  <Download size={14} /> Download
                </button>
              )
            }
          ]}
          data={reports}
          loading={loading}
        />
      </div>

      {/* Modal: Generate Custom Report */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Generate Custom Academy Report">
        <form onSubmit={handleGenerate}>
          <Input
            label="Report Title / Name"
            name="name"
            value={newReport.name}
            onChange={(e) => setNewReport({ ...newReport, name: e.target.value })}
            placeholder="e.g. Term 1 Class-Wise Attendance Analysis"
            required
          />
          <div className="row g-2">
            <div className="col-6">
              <Select
                label="Domain / Category"
                name="type"
                value={newReport.type}
                onChange={(e) => setNewReport({ ...newReport, type: e.target.value })}
                options={['Attendance', 'Financial', 'Academic', 'Security', 'General']}
              />
            </div>
            <div className="col-6">
              <Select
                label="File Format"
                name="fileFormat"
                value={newReport.fileFormat}
                onChange={(e) => setNewReport({ ...newReport, fileFormat: e.target.value })}
                options={['PDF', 'Excel (.xlsx)', 'CSV', 'JSON']}
              />
            </div>
          </div>
          <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            <Button variant="light" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Generate &amp; Archive</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
