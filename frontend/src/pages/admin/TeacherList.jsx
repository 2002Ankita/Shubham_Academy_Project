import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Table from '../../components/common/Table';
import SearchBar from '../../components/common/SearchBar';
import Button from '../../components/common/Button';
import BackButton from '../../components/common/BackButton';
import teacherService from '../../services/teacherService';
import salaryService from '../../services/salaryService';
import { UserPlus, Mail, Phone, Trash2, Clock, Calendar } from 'lucide-react';
import { toast } from 'react-toastify';
import { useConfirm } from '../../context/ConfirmContext';

export default function TeacherList() {
  const navigate = useNavigate();
  const { confirm } = useConfirm();
  const [teachers, setTeachers] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const currentMonthName = useMemo(() => new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }), []);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthName);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const [data, salData] = await Promise.all([
        teacherService.getAll(),
        salaryService.getAll().catch(() => [])
      ]);
      setTeachers(data);
      setSalaries(Array.isArray(salData) ? salData : []);
    } finally {
      setLoading(false);
    }
  };

  const availableMonths = useMemo(() => {
    const list = [currentMonthName];
    salaries.forEach((s) => {
      if (s.month && !list.some((m) => m.toLowerCase() === s.month.toLowerCase())) {
        list.push(s.month);
      }
    });
    return list;
  }, [salaries, currentMonthName]);

  const monthSalaryMap = useMemo(() => {
    const map = {};
    salaries.forEach((s) => {
      if (s.month && s.month.toLowerCase().includes(selectedMonth.toLowerCase().split(' ')[0])) {
        const key = (s.teacherId || s.teacherName || '').toLowerCase();
        if (key) map[key] = s;
        if (s.teacherName) map[s.teacherName.toLowerCase()] = s;
      }
    });
    return map;
  }, [salaries, selectedMonth]);

  const staffMonthlySummary = useMemo(() => {
    const monthRows = salaries.filter((s) => s.month && s.month.toLowerCase().includes(selectedMonth.toLowerCase().split(' ')[0]));
    const totalNet = monthRows.reduce((acc, r) => acc + Number(r.netPayable || 0), 0);
    const totalPaid = monthRows.reduce((acc, r) => acc + Number(r.amountPaid || 0), 0);
    const totalPending = monthRows.reduce((acc, r) => acc + Number(r.amountPending || 0), 0);
    return { count: teachers.length, totalNet, totalPaid, totalPending };
  }, [salaries, teachers, selectedMonth]);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleDelete = async (id, name) => {
    const isConfirmed = await confirm({
      title: 'Remove Faculty Member',
      message: `Are you sure you want to remove faculty member: ${name}?`,
      subtitle: 'This will remove the faculty record from your academy directory.',
      confirmText: 'Remove Faculty',
      cancelText: 'Cancel',
      type: 'danger'
    });

    if (isConfirmed) {
      await teacherService.delete(id);
      toast.success(`Teacher ${name} removed`);
      setTeachers(teachers.filter(t => t.id !== id));
    }
  };

  const filtered = teachers.filter(t =>
    (t.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.subject || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="d-flex flex-column gap-4">
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
        <div>
          <BackButton to="/admin/dashboard" label="Back to Dashboard" />
          <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
            Faculty & Teaching Staff
          </h3>
          <span className="small text-sa-muted">
            Manage teacher profiles, subject specializations, and monthly payroll
          </span>
        </div>

        <div className="d-flex align-items-center flex-wrap gap-2">
          <Button variant="outline" icon={Clock} onClick={() => navigate('/admin/teachers/attendance')}>
            Check-In & Attendance
          </Button>
          <Button variant="outline" onClick={() => navigate('/admin/teachers/salary')}>
            View Salary Register
          </Button>
          <Button variant="primary" icon={UserPlus} onClick={() => navigate('/admin/teachers/add')}>
            Onboard New Teacher
          </Button>
        </div>
      </div>

      {/* Monthly Staff Salary Overview */}
      <div className="sa-card p-3 p-md-3.5 border shadow-2xs">
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-3">
          <div className="d-flex align-items-center gap-2">
            <Calendar size={17} className="text-danger" />
            <h6 className="fw-bold text-sa-charcoal m-0">Monthly Staff & Salary Collection View</h6>
          </div>
          <select
            className="form-select form-select-sm fw-semibold"
            style={{ width: 'auto', minWidth: '175px' }}
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            {availableMonths.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div className="row g-2.5">
          <div className="col-6 col-md-3">
            <div className="p-2.5 rounded-3 bg-light border">
              <div className="small text-muted">Total Staff</div>
              <div className="fw-bold fs-5 text-sa-charcoal">{staffMonthlySummary.count}</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="p-2.5 rounded-3 bg-light border">
              <div className="small text-muted">Monthly Payroll</div>
              <div className="fw-bold fs-5 text-dark">₹{staffMonthlySummary.totalNet.toLocaleString()}</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="p-2.5 rounded-3 bg-success-subtle border border-success-subtle">
              <div className="small text-success fw-semibold">Disbursed ({selectedMonth.split(' ')[0]})</div>
              <div className="fw-bold fs-5 text-success">₹{staffMonthlySummary.totalPaid.toLocaleString()}</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="p-2.5 rounded-3 bg-warning-subtle border border-warning-subtle">
              <div className="small text-warning-emphasis fw-semibold">Pending ({selectedMonth.split(' ')[0]})</div>
              <div className="fw-bold fs-5 text-warning-emphasis">₹{staffMonthlySummary.totalPending.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="sa-card p-4">
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-3">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by faculty name or subject..."
            className="flex-grow-1"
          />
        </div>

        <Table
          columns={[
            { key: 'id', title: 'Teacher ID', render: (val) => <span className="fw-bold">{val}</span> },
            {
              key: 'name',
              title: 'Faculty Name',
              render: (val, row) => (
                <div>
                  <span className="fw-semibold text-sa-charcoal d-block">{val}</span>
                  <span className="text-sa-muted small" style={{ fontSize: '0.75rem' }}>{row.qualification}</span>
                </div>
              )
            },
            {
              key: 'subject',
              title: 'Subject Domain',
              render: (val) => <span className="badge bg-sa-mustard text-dark fw-bold">{val}</span>
            },
            {
              key: 'email',
              title: 'Contact',
              render: (val, row) => (
                <div className="small">
                  <div>{val}</div>
                  <div className="text-sa-muted">{row.phone}</div>
                </div>
              )
            },
            {
              key: 'monthlySalary',
              title: 'Base Salary',
              render: (val) => <span className="fw-semibold">₹ {val?.toLocaleString()}</span>
            },
            {
              key: 'monthlyStatus',
              title: `${selectedMonth.split(' ')[0]} Payout`,
              render: (_, row) => {
                const sal = monthSalaryMap[(row.id || '').toLowerCase()] || monthSalaryMap[(row.name || '').toLowerCase()];
                if (!sal) return <span className="small text-muted">Not drafted</span>;
                const isPaid = sal.status === 'Disbursed' || sal.status === 'Fully Paid';
                return (
                  <div className="small">
                    <span className={`badge ${isPaid ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning-emphasis'}`}>
                      {isPaid ? 'Paid' : sal.status}
                    </span>
                    <div className="text-muted mt-0.5" style={{ fontSize: '0.72rem' }}>
                      Paid: ₹{Number(sal.amountPaid || 0).toLocaleString()}
                    </div>
                  </div>
                );
              }
            },
            {
              key: 'status',
              title: 'Status',
              render: (val) => <span className="badge-active">{val}</span>
            },
            {
              key: 'id',
              title: 'Action',
              align: 'end',
              render: (val, row) => (
                <div className="d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-light border p-1 text-primary"
                    title="View Working Time"
                    onClick={() => navigate(`/admin/teachers/${val}/working-time`)}
                  >
                    <Clock size={15} />
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
      </div>
    </div>
  );
}
