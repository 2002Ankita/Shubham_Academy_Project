import React, { useState, useEffect } from 'react';
import Table from '../../components/common/Table';
import SearchBar from '../../components/common/SearchBar';
import studentService from '../../services/studentService';

export default function TeacherStudents() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const data = await studentService.getAll();
        setStudents(data);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.rollNumber.toLowerCase().includes(search.toLowerCase()) ||
    s.standard.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="d-flex flex-column gap-4">
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
        <div>
          <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
            Class Student Directory
          </h3>
          <span className="small text-sa-muted">
            Students enrolled in your assigned Physics batches
          </span>
        </div>

        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Filter students..."
        />
      </div>

      <div className="sa-card p-4">
        <Table
          columns={[
            { key: 'rollNumber', title: 'Roll No.', render: (val) => <span className="fw-bold text-sa-primary">{val}</span> },
            { key: 'name', title: 'Student Name' },
            { key: 'standard', title: 'Class & Batch' },
            {
              key: 'attendancePercent',
              title: 'Attendance',
              render: (val) => (
                <span className={`fw-bold ${val >= 90 ? 'text-success' : 'text-warning'}`}>
                  {val}%
                </span>
              )
            },
            {
              key: 'status',
              title: 'Enrollment',
              render: (val) => <span className="badge-active">{val}</span>
            },
            { key: 'parentName', title: 'Parent Guardian' },
            { key: 'parentPhone', title: 'Emergency Contact' }
          ]}
          data={filtered}
          loading={loading}
        />
      </div>
    </div>
  );
}
