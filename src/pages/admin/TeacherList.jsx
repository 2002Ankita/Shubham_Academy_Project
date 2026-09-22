import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Table from '../../components/common/Table';
import SearchBar from '../../components/common/SearchBar';
import Button from '../../components/common/Button';
import teacherService from '../../services/teacherService';
import { UserPlus, Mail, Phone, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';

export default function TeacherList() {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const data = await teacherService.getAll();
      setTeachers(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to remove faculty member: ${name}?`)) {
      await teacherService.delete(id);
      toast.success(`Teacher ${name} removed`);
      setTeachers(teachers.filter(t => t.id !== id));
    }
  };

  const filtered = teachers.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.subject.toLowerCase().includes(search.toLowerCase()) ||
    t.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="d-flex flex-column gap-4">
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
        <div>
          <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
            Faculty & Teaching Staff
          </h3>
          <span className="small text-sa-muted">
            Manage teacher profiles, subject specializations, and monthly payroll
          </span>
        </div>

        <div className="d-flex gap-2">
          <Button variant="outline" onClick={() => navigate('/admin/teachers/salary')}>
            View Salary Register
          </Button>
          <Button variant="primary" icon={UserPlus} onClick={() => navigate('/admin/teachers/add')}>
            Onboard New Teacher
          </Button>
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
              key: 'status',
              title: 'Status',
              render: (val) => <span className="badge-active">{val}</span>
            },
            {
              key: 'id',
              title: 'Action',
              align: 'end',
              render: (val, row) => (
                <button
                  type="button"
                  className="btn btn-sm btn-light border p-1 text-danger"
                  title="Remove"
                  onClick={() => handleDelete(val, row.name)}
                >
                  <Trash2 size={15} />
                </button>
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
