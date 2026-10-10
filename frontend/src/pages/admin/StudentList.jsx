import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Table from '../../components/common/Table';
import SearchBar from '../../components/common/SearchBar';
import Button from '../../components/common/Button';
import Pagination from '../../components/common/Pagination';
import BackButton from '../../components/common/BackButton';
import studentService from '../../services/studentService';
import { UserPlus, Eye, Edit, Trash2, Upload, Download, FileSpreadsheet, X } from 'lucide-react';
import { toast } from 'react-toastify';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export default function StudentList() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importedFile, setImportedFile] = useState(null);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const data = await studentService.getAll();
      setStudents(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to remove student record: ${name}?`)) {
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
    const headers = ['Roll Number', 'Student Name', 'Email', 'Class/Standard', 'Phone', 'Parent Phone', 'RFID UID', 'Attendance %', 'Fee Status'];
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
    const headers = ['Roll Number', 'Full Name', 'Class / Standard', 'Email', 'Student Mobile', 'Parent Mobile', 'RFID UID'];
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
          password: 'password123',
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

  const filtered = students.filter(s =>
    (s.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.rollNumber || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.rfidCard || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.standard || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="d-flex flex-column gap-4">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
        <div>
          <BackButton to="/admin/dashboard" label="Back to Dashboard" />
          <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
            Student Directory
          </h3>
          <span className="small text-sa-muted">
            Manage student enrollments, RFID smart card allocations, and parent contacts
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

      {/* Filter and Search Bar */}
      <div className="sa-card p-4">
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-3">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by name, roll no, RFID card or class..."
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
            { key: 'standard', title: 'Class / Stream' },
            {
              key: 'rfidCard',
              title: 'RFID Badge UID',
              render: (val) => <span className="badge bg-light text-dark border">{val}</span>
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
              title: 'Fee Status',
              render: (val) => {
                if (val === 'Paid') return <span className="badge-paid">Paid in Full</span>;
                if (val === 'Pending') return <span className="badge-pending">Partially Paid</span>;
                return <span className="badge-overdue">Overdue</span>;
              }
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
          data={filtered}
          loading={loading}
        />

        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(filtered.length / 10) || 1}
          onPageChange={setCurrentPage}
          totalItems={filtered.length}
        />
      </div>

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
                  <strong className="text-sa-charcoal">Expected Column Headers:</strong> Roll Number, Full Name, Class / Standard, Email, Student Mobile, Parent Mobile, RFID UID.
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
