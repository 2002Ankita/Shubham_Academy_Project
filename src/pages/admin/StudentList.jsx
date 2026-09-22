import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Table from '../../components/common/Table';
import SearchBar from '../../components/common/SearchBar';
import Button from '../../components/common/Button';
import Pagination from '../../components/common/Pagination';
import studentService from '../../services/studentService';
import { UserPlus, Eye, Edit, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';

export default function StudentList() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

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

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.rollNumber.toLowerCase().includes(search.toLowerCase()) ||
    s.rfidCard.toLowerCase().includes(search.toLowerCase()) ||
    s.standard.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="d-flex flex-column gap-4">
      {/* Header */}
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
        <div>
          <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
            Student Directory
          </h3>
          <span className="small text-sa-muted">
            Manage student enrollments, RFID smart card allocations, and parent contacts
          </span>
        </div>

        <Button
          variant="primary"
          icon={UserPlus}
          onClick={() => navigate('/admin/students/register')}
        >
          Register New Student
        </Button>
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
    </div>
  );
}
