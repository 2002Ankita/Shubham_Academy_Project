import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  GraduationCap,
  Building2,
  Plus,
  Search,
  Download,
  Edit2,
  Trash2,
  Award,
  CalendarCheck,
  FileText,
  MapPin,
  BookOpen,
  Eye
} from 'lucide-react';
import BackButton from '../../components/common/BackButton';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import { useAuth } from '../../hooks/useAuth';
import { useConfirm } from '../../context/ConfirmContext';
import { getUserBranch, CAMPUS } from '../../utils/branchUtils';
import passoutService from '../../services/passoutService';
import studentService from '../../services/studentService';

const EMPTY_FORM = {
  student_id: '',
  roll_number: '',
  student_name: '',
  branch: 'Tarabai Park',
  standard: '12th Science',
  academic_batch: '',
  passing_year: '2025-2026',
  mobile_number: '',
  parent_mobile: '',
  college_name: '',
  college_city: '',
  course_or_degree: '',
  entrance_exam: 'MHT-CET',
  entrance_score: '',
  attendance_percentage: '',
  daily_logs_count: '',
  remarks: ''
};

export default function PassoutStudents() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const confirm = useConfirm();
  const isSuperAdmin = (user?.role || '').toLowerCase().includes('super');
  const userBranch = getUserBranch(user) || CAMPUS.TARABAI_PARK;

  const [records, setRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState(isSuperAdmin ? 'ALL' : userBranch);
  const [passingYearFilter, setPassingYearFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [formData, setFormData] = useState({ ...EMPTY_FORM, branch: userBranch });
  const [saving, setSaving] = useState(false);

  const [logsModalOpen, setLogsModalOpen] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsData, setLogsData] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [passoutList, studentList] = await Promise.all([
        passoutService.getAll({ branch: selectedBranch === 'ALL' ? undefined : selectedBranch }),
        studentService.getAll().catch(() => [])
      ]);
      setRecords(Array.isArray(passoutList) ? passoutList : []);
      setStudents(Array.isArray(studentList) ? studentList : []);
    } catch (err) {
      toast.error('Failed to load passout students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [selectedBranch]);

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (passingYearFilter !== 'ALL' && r.passing_year !== passingYearFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const hay = `${r.student_name || ''} ${r.roll_number || ''} ${r.college_name || ''} ${r.college_city || ''} ${r.course_or_degree || ''} ${r.entrance_exam || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [records, passingYearFilter, searchQuery]);

  const uniqueYears = useMemo(() => {
    const yrs = new Set(['2025-2026', '2024-2025', '2023-2024']);
    records.forEach((r) => r.passing_year && yrs.add(r.passing_year));
    return Array.from(yrs).sort().reverse();
  }, [records]);

  const uniqueCollegesCount = useMemo(() => {
    return new Set(filteredRecords.map((r) => (r.college_name || '').trim().toLowerCase()).filter(Boolean)).size;
  }, [filteredRecords]);

  const avgAttendance = useMemo(() => {
    if (filteredRecords.length === 0) return 0;
    const sum = filteredRecords.reduce((acc, r) => acc + (Number(r.attendance_percentage) || 0), 0);
    return Math.round((sum / filteredRecords.length) * 10) / 10;
  }, [filteredRecords]);

  const totalDailyLogs = useMemo(() => {
    return filteredRecords.reduce((acc, r) => acc + (Number(r.daily_logs_count) || 0), 0);
  }, [filteredRecords]);

  const openAddModal = () => {
    setEditingRecord(null);
    setFormData({
      ...EMPTY_FORM,
      branch: selectedBranch === 'ALL' ? userBranch : selectedBranch
    });
    setIsModalOpen(true);
  };

  const openEditModal = (rec) => {
    setEditingRecord(rec);
    setFormData({
      student_id: rec.student_id || '',
      roll_number: rec.roll_number || '',
      student_name: rec.student_name || '',
      branch: rec.branch || userBranch,
      standard: rec.standard || '12th Science',
      academic_batch: rec.academic_batch || '',
      passing_year: rec.passing_year || '2025-2026',
      mobile_number: rec.mobile_number || '',
      parent_mobile: rec.parent_mobile || '',
      college_name: rec.college_name || '',
      college_city: rec.college_city || '',
      course_or_degree: rec.course_or_degree || '',
      entrance_exam: rec.entrance_exam || 'MHT-CET',
      entrance_score: rec.entrance_score || '',
      attendance_percentage: rec.attendance_percentage ?? '',
      daily_logs_count: rec.daily_logs_count ?? '',
      remarks: rec.remarks || ''
    });
    setIsModalOpen(true);
  };

  const handleSelectExistingStudent = (studentId) => {
    const found = students.find((s) => (s.id === studentId || s.student_id === studentId));
    if (!found) {
      setFormData((prev) => ({ ...prev, student_id: '' }));
      return;
    }
    setFormData((prev) => ({
      ...prev,
      student_id: found.id || found.student_id || '',
      roll_number: found.student_id || found.rollNumber || '',
      student_name: found.full_name || found.name || '',
      branch: found.branch || prev.branch,
      standard: found.standard || '12th Science',
      academic_batch: found.academic_batch || found.batch || '',
      mobile_number: found.mobile_number || found.phone || '',
      parent_mobile: found.father_mobile || found.parent_mobile || ''
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.student_name.trim() || !formData.college_name.trim()) {
      toast.error('Please enter Student Name and Admitted College Name');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...formData,
        attendance_percentage: formData.attendance_percentage === '' ? undefined : Number(formData.attendance_percentage),
        daily_logs_count: formData.daily_logs_count === '' ? undefined : Number(formData.daily_logs_count)
      };
      if (editingRecord) {
        await passoutService.update(editingRecord.id, payload);
        toast.success('Passout student record updated!');
      } else {
        await passoutService.create(payload);
        toast.success('Passout student & college admission recorded!');
      }
      setIsModalOpen(false);
      fetchAll();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to save passout student record');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (rec) => {
    const ok = await confirm({
      title: 'Delete Passout Record',
      message: `Remove passout record for ${rec.student_name} (${rec.college_name})?`,
      confirmText: 'Delete',
      type: 'danger'
    });
    if (!ok) return;
    try {
      await passoutService.remove(rec.id);
      toast.success('Record deleted');
      fetchAll();
    } catch {
      toast.error('Failed to delete record');
    }
  };

  const handleViewLogs = async (rec) => {
    setLogsModalOpen(true);
    setLogsLoading(true);
    setLogsData({ passout: rec, attendance_records: [], daily_logs: [] });
    try {
      const res = await passoutService.getLogs(rec.id);
      setLogsData(res);
    } catch {
      // keep summary
    } finally {
      setLogsLoading(false);
    }
  };

  const handleExportCsv = () => {
    const headers = [
      'Roll Number',
      'Student Name',
      'Branch',
      'Batch',
      'Passing Year',
      'Admitted College',
      'City',
      'Course / Degree',
      'Entrance Exam',
      'Score',
      'Attendance %',
      'Daily Logs'
    ];
    const rows = filteredRecords.map((r) => [
      `"${r.roll_number || ''}"`,
      `"${r.student_name || ''}"`,
      `"${r.branch || ''}"`,
      `"${r.academic_batch || ''}"`,
      `"${r.passing_year || ''}"`,
      `"${r.college_name || ''}"`,
      `"${r.college_city || ''}"`,
      `"${r.course_or_degree || ''}"`,
      `"${r.entrance_exam || ''}"`,
      `"${r.entrance_score || ''}"`,
      `"${r.attendance_percentage || 0}%"`,
      `"${r.daily_logs_count || 0}"`
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `passout_students_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="d-flex flex-column gap-4">
      {/* Header */}
      <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
        <div>
          <BackButton to="/admin/students" label="Back to Students" />
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
              Passout Students & College Admissions
            </h3>
            <span className="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill px-2.5 py-1">
              Alumni Tracker
            </span>
          </div>
          <span className="small text-sa-muted">
            Track graduated students, admitted colleges, entrance scores, attendance history & daily activity logs
          </span>
        </div>

        <div className="d-flex flex-column flex-sm-row flex-wrap align-items-stretch align-items-sm-center gap-2">
          {isSuperAdmin ? (
            <select
              className="form-select form-select-sm fw-semibold"
              style={{ minWidth: '175px', height: '38px' }}
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
            >
              <option value="ALL">All Campuses</option>
              <option value={CAMPUS.TARABAI_PARK}>Tarabai Park Campus</option>
              <option value={CAMPUS.MANGALVAR_PETH}>Mangalvar Peth Campus</option>
            </select>
          ) : (
            <span className="badge bg-light text-dark border px-3 py-2 d-inline-flex align-items-center gap-1.5" style={{ height: '38px' }}>
              <Building2 size={14} className="text-danger" />
              <span>{userBranch} Campus</span>
            </span>
          )}

          <Button variant="outline" icon={Download} onClick={handleExportCsv} style={{ height: '38px' }}>
            Export CSV
          </Button>
          <Button variant="primary" icon={Plus} onClick={openAddModal} style={{ height: '38px' }}>
            Record Passout Student
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="row g-3">
        <div className="col-6 col-xl-3">
          <div className="sa-card p-3 border-start border-4 border-danger shadow-2xs h-100">
            <div className="d-flex align-items-center justify-content-between">
              <span className="small text-sa-muted fw-semibold">Total Passouts</span>
              <GraduationCap size={18} className="text-danger" />
            </div>
            <h4 className="fw-extrabold text-sa-charcoal m-0 mt-1">{filteredRecords.length}</h4>
            <span className="text-muted" style={{ fontSize: '0.74rem' }}>Graduated & placed students</span>
          </div>
        </div>
        <div className="col-6 col-xl-3">
          <div className="sa-card p-3 border-start border-4 border-primary shadow-2xs h-100">
            <div className="d-flex align-items-center justify-content-between">
              <span className="small text-sa-muted fw-semibold">Colleges Admitted</span>
              <Award size={18} className="text-primary" />
            </div>
            <h4 className="fw-extrabold text-sa-charcoal m-0 mt-1">{uniqueCollegesCount}</h4>
            <span className="text-muted" style={{ fontSize: '0.74rem' }}>Unique institutions</span>
          </div>
        </div>
        <div className="col-6 col-xl-3">
          <div className="sa-card p-3 border-start border-4 border-success shadow-2xs h-100">
            <div className="d-flex align-items-center justify-content-between">
              <span className="small text-sa-muted fw-semibold">Avg Attendance</span>
              <CalendarCheck size={18} className="text-success" />
            </div>
            <h4 className="fw-extrabold text-sa-charcoal m-0 mt-1">{avgAttendance}%</h4>
            <span className="text-muted" style={{ fontSize: '0.74rem' }}>Course lecture attendance</span>
          </div>
        </div>
        <div className="col-6 col-xl-3">
          <div className="sa-card p-3 border-start border-4 border-warning shadow-2xs h-100">
            <div className="d-flex align-items-center justify-content-between">
              <span className="small text-sa-muted fw-semibold">Daily Logs Tracked</span>
              <FileText size={18} className="text-warning" />
            </div>
            <h4 className="fw-extrabold text-sa-charcoal m-0 mt-1">{totalDailyLogs}</h4>
            <span className="text-muted" style={{ fontSize: '0.74rem' }}>Batch activity logs</span>
          </div>
        </div>
      </div>

      {/* Filters + Quick Links to Attendance & Daily Logs */}
      <div className="sa-card p-3 d-flex flex-column flex-md-row align-items-stretch align-items-md-center justify-content-between gap-2.5">
        <div className="d-flex flex-column flex-sm-row gap-2 flex-grow-1">
          <div className="position-relative flex-grow-1" style={{ maxWidth: '380px' }}>
            <Search size={15} className="position-absolute text-muted" style={{ left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="form-control form-control-sm ps-5"
              style={{ height: '36px' }}
              placeholder="Search student, college, course, or exam..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="form-select form-select-sm"
            style={{ width: 'auto', minWidth: '155px', height: '36px' }}
            value={passingYearFilter}
            onChange={(e) => setPassingYearFilter(e.target.value)}
          >
            <option value="ALL">All Passing Years</option>
            {uniqueYears.map((yr) => (
              <option key={yr} value={yr}>{yr}</option>
            ))}
          </select>
        </div>

        <div className="d-flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1.5 fw-semibold"
            onClick={() => navigate('/admin/attendance')}
          >
            <CalendarCheck size={14} />
            <span>Attendance Register</span>
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1.5 fw-semibold"
            onClick={() => navigate('/admin/activity-timetable')}
          >
            <FileText size={14} />
            <span>Daily Logs</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="sa-card p-3 p-md-4">
        <Table
          loading={loading}
          data={filteredRecords}
          emptyMessage="No passout student records yet. Click 'Record Passout Student' to add college admission details."
          columns={[
            {
              key: 'student_name',
              title: 'Student',
              render: (val, row) => (
                <div>
                  <div className="fw-bold text-sa-charcoal">{val}</div>
                  <div className="small text-muted">
                    {row.roll_number || row.passout_id} • {row.branch}
                  </div>
                </div>
              )
            },
            {
              key: 'passing_year',
              title: 'Batch & Year',
              render: (val, row) => (
                <div>
                  <span className="badge bg-light text-dark border">{val}</span>
                  <div className="small text-muted mt-0.5">{row.academic_batch || row.standard || '-'}</div>
                </div>
              )
            },
            {
              key: 'college_name',
              title: 'Admitted College',
              render: (val, row) => (
                <div>
                  <div className="fw-bold text-danger d-flex align-items-center gap-1">
                    <GraduationCap size={14} className="flex-shrink-0" />
                    <span>{val}</span>
                  </div>
                  {row.college_city && (
                    <div className="small text-muted d-flex align-items-center gap-1">
                      <MapPin size={11} />
                      <span>{row.college_city}</span>
                    </div>
                  )}
                </div>
              )
            },
            {
              key: 'course_or_degree',
              title: 'Course & Exam',
              render: (val, row) => (
                <div>
                  <div className="fw-semibold text-dark small">{val || '-'}</div>
                  {(row.entrance_exam || row.entrance_score) && (
                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle mt-0.5" style={{ fontSize: '0.7rem' }}>
                      {row.entrance_exam || 'Score'}: {row.entrance_score || '-'}
                    </span>
                  )}
                </div>
              )
            },
            {
              key: 'attendance_percentage',
              title: 'Attendance & Daily Logs',
              render: (val, row) => (
                <div className="d-flex flex-column gap-1">
                  <span className="small fw-semibold text-success">
                    Attendance: {val || 0}%
                  </span>
                  <span className="small text-muted">
                    Daily Logs: <strong>{row.daily_logs_count || 0}</strong>
                  </span>
                </div>
              )
            },
            {
              key: 'actions',
              title: 'Actions',
              render: (_, row) => (
                <div className="d-flex align-items-center gap-1.5">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary py-1 px-2"
                    title="View Attendance & Daily Logs"
                    onClick={() => handleViewLogs(row)}
                  >
                    <Eye size={14} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary py-1 px-2"
                    title="Edit"
                    onClick={() => openEditModal(row)}
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger py-1 px-2"
                    title="Delete"
                    onClick={() => handleDelete(row)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )
            }
          ]}
        />
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRecord ? 'Edit Passout Student Record' : 'Record Passout Student & College Admission'}
        size="lg"
      >
        <form onSubmit={handleSave} className="d-flex flex-column gap-3">
          {!editingRecord && students.length > 0 && (
            <div className="p-2.5 rounded-3 bg-light border">
              <label className="form-label small fw-semibold text-muted mb-1">
                Quick Fill from Existing Student (Optional)
              </label>
              <select
                className="form-select form-select-sm"
                value={formData.student_id}
                onChange={(e) => handleSelectExistingStudent(e.target.value)}
              >
                <option value="">-- Select student to auto-fill details & attendance/logs --</option>
                {students.map((s) => (
                  <option key={s.id || s.student_id} value={s.id || s.student_id}>
                    {s.full_name} ({s.student_id || 'No Roll'}) - {s.branch || 'Campus'}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="row g-2.5">
            <div className="col-12 col-md-6">
              <label className="form-label small fw-semibold">Student Name *</label>
              <input
                type="text"
                className="form-control form-control-sm"
                required
                value={formData.student_name}
                onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                placeholder="Full Name"
              />
            </div>
            <div className="col-6 col-md-3">
              <label className="form-label small fw-semibold">Roll Number</label>
              <input
                type="text"
                className="form-control form-control-sm"
                value={formData.roll_number}
                onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
                placeholder="e.g. STD-101"
              />
            </div>
            <div className="col-6 col-md-3">
              <label className="form-label small fw-semibold">Passing Year *</label>
              <input
                type="text"
                className="form-control form-control-sm"
                required
                value={formData.passing_year}
                onChange={(e) => setFormData({ ...formData, passing_year: e.target.value })}
                placeholder="2025-2026"
              />
            </div>

            <div className="col-6 col-md-4">
              <label className="form-label small fw-semibold">Branch</label>
              <select
                className="form-select form-select-sm"
                value={formData.branch}
                disabled={!isSuperAdmin}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
              >
                <option value={CAMPUS.TARABAI_PARK}>Tarabai Park</option>
                <option value={CAMPUS.MANGALVAR_PETH}>Mangalvar Peth</option>
              </select>
            </div>
            <div className="col-6 col-md-4">
              <label className="form-label small fw-semibold">Academic Batch</label>
              <input
                type="text"
                className="form-control form-control-sm"
                value={formData.academic_batch}
                onChange={(e) => setFormData({ ...formData, academic_batch: e.target.value })}
                placeholder="e.g. 12th PCM"
              />
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label small fw-semibold">Student Mobile</label>
              <input
                type="text"
                className="form-control form-control-sm"
                value={formData.mobile_number}
                onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                placeholder="10-digit mobile"
              />
            </div>
          </div>

          <hr className="my-1 opacity-25" />
          <div className="fw-bold small text-danger d-flex align-items-center gap-1.5">
            <GraduationCap size={16} />
            <span>College Admission Details</span>
          </div>

          <div className="row g-2.5">
            <div className="col-12 col-md-8">
              <label className="form-label small fw-semibold">Admitted College Name *</label>
              <input
                type="text"
                className="form-control form-control-sm"
                required
                value={formData.college_name}
                onChange={(e) => setFormData({ ...formData, college_name: e.target.value })}
                placeholder="e.g. COEP Technological University, Pune"
              />
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label small fw-semibold">College City</label>
              <input
                type="text"
                className="form-control form-control-sm"
                value={formData.college_city}
                onChange={(e) => setFormData({ ...formData, college_city: e.target.value })}
                placeholder="e.g. Pune / Mumbai"
              />
            </div>

            <div className="col-12 col-md-5">
              <label className="form-label small fw-semibold">Course / Degree Admitted In</label>
              <input
                type="text"
                className="form-control form-control-sm"
                value={formData.course_or_degree}
                onChange={(e) => setFormData({ ...formData, course_or_degree: e.target.value })}
                placeholder="e.g. B.Tech Computer Science / MBBS"
              />
            </div>
            <div className="col-6 col-md-4">
              <label className="form-label small fw-semibold">Entrance Exam</label>
              <select
                className="form-select form-select-sm"
                value={formData.entrance_exam}
                onChange={(e) => setFormData({ ...formData, entrance_exam: e.target.value })}
              >
                <option value="MHT-CET">MHT-CET</option>
                <option value="JEE Main">JEE Main</option>
                <option value="JEE Advanced">JEE Advanced</option>
                <option value="NEET">NEET</option>
                <option value="Board Merit">12th Board Merit</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="col-6 col-md-3">
              <label className="form-label small fw-semibold">Score / Percentile</label>
              <input
                type="text"
                className="form-control form-control-sm"
                value={formData.entrance_score}
                onChange={(e) => setFormData({ ...formData, entrance_score: e.target.value })}
                placeholder="e.g. 99.2 %ile"
              />
            </div>

            <div className="col-12">
              <label className="form-label small fw-semibold">Remarks / Scholarship Notes</label>
              <input
                type="text"
                className="form-control form-control-sm"
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                placeholder="Optional admission round or achievement note..."
              />
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 pt-2 border-top">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" loading={saving}>
              {editingRecord ? 'Update Record' : 'Save Passout Record'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Attendance & Daily Logs Modal */}
      <Modal
        isOpen={logsModalOpen}
        onClose={() => setLogsModalOpen(false)}
        title={`Attendance & Daily Logs — ${logsData?.passout?.student_name || ''}`}
        size="lg"
      >
        {logsData && (
          <div className="d-flex flex-column gap-3">
            <div className="p-3 rounded-3 bg-light border d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div>
                <div className="fw-bold text-danger d-flex align-items-center gap-1.5">
                  <GraduationCap size={16} />
                  <span>{logsData.passout.college_name}</span>
                </div>
                <div className="small text-muted">
                  {logsData.passout.course_or_degree || 'Course'} • {logsData.passout.entrance_exam || ''} {logsData.passout.entrance_score || ''}
                </div>
              </div>
              <div className="d-flex gap-3 small">
                <div>
                  <span className="text-muted">Attendance:</span>{' '}
                  <strong className="text-success">{logsData.passout.attendance_percentage || 0}%</strong>
                </div>
                <div>
                  <span className="text-muted">Daily Logs:</span>{' '}
                  <strong>{logsData.daily_logs?.length || logsData.passout.daily_logs_count || 0}</strong>
                </div>
              </div>
            </div>

            {logsLoading ? (
              <div className="text-center py-4 small text-muted">Loading attendance & daily logs...</div>
            ) : (
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <h6 className="fw-bold small text-uppercase text-muted mb-2 d-flex align-items-center gap-1.5">
                    <CalendarCheck size={14} className="text-success" />
                    <span>Attendance History ({logsData.attendance_records?.length || 0})</span>
                  </h6>
                  <div className="border rounded-3 overflow-auto" style={{ maxHeight: '260px' }}>
                    {(!logsData.attendance_records || logsData.attendance_records.length === 0) ? (
                      <div className="p-3 small text-muted text-center">No individual lecture attendance records linked.</div>
                    ) : (
                      <table className="table table-sm table-hover m-0 small">
                        <thead className="table-light">
                          <tr>
                            <th>Date</th>
                            <th>Subject</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {logsData.attendance_records.map((a, idx) => (
                            <tr key={a.id || idx}>
                              <td>{a.date}</td>
                              <td>{a.subject}</td>
                              <td>
                                <span className={`badge ${String(a.status).toLowerCase() === 'present' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                                  {a.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                <div className="col-12 col-md-6">
                  <h6 className="fw-bold small text-uppercase text-muted mb-2 d-flex align-items-center gap-1.5">
                    <BookOpen size={14} className="text-primary" />
                    <span>Batch Daily Logs ({logsData.daily_logs?.length || 0})</span>
                  </h6>
                  <div className="border rounded-3 overflow-auto" style={{ maxHeight: '260px' }}>
                    {(!logsData.daily_logs || logsData.daily_logs.length === 0) ? (
                      <div className="p-3 small text-muted text-center">No daily activity logs found for this batch.</div>
                    ) : (
                      <table className="table table-sm table-hover m-0 small">
                        <thead className="table-light">
                          <tr>
                            <th>Date</th>
                            <th>Subject / Topic</th>
                            <th>Faculty</th>
                          </tr>
                        </thead>
                        <tbody>
                          {logsData.daily_logs.map((d, idx) => (
                            <tr key={d.id || idx}>
                              <td>{d.date}</td>
                              <td>
                                <div className="fw-semibold">{d.subject}</div>
                                <div className="text-muted" style={{ fontSize: '0.72rem' }}>{d.topic || d.chapter}</div>
                              </td>
                              <td>{d.teacher_name}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
