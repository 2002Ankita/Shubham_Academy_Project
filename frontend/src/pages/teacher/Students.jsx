import React, { useState, useEffect } from 'react';
import Table from '../../components/common/Table';
import SearchBar from '../../components/common/SearchBar';
import BackButton from '../../components/common/BackButton';
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
    <div className="d-flex flex-column w-100" style={{ gap: '16px', minWidth: 0, boxSizing: 'border-box' }}>
      {/* Header */}
      <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-3 pt-0 pb-0.5">
        <div>
          <BackButton to="/teacher/dashboard" label="Back to Dashboard" />
          <h1 className="brand-font fw-bold m-0" style={{ fontSize: '23px', lineHeight: 1.25, color: '#0F172A' }}>
            Class Student Directory
          </h1>
          <p className="m-0 mt-0.5" style={{ fontSize: '13.5px', color: '#64748B' }}>
            Students enrolled in your assigned Physics batches
          </p>
        </div>

        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Filter students by name, roll no..."
        />
      </div>

      {/* Main Table without outer double-border card */}
      <Table
        columns={[
          { key: 'rollNumber', title: 'Roll No.', render: (val) => <span className="fw-bold" style={{ color: '#8B1216' }}>{val}</span> },
          { key: 'name', title: 'Student Name', render: (val) => <span className="fw-semibold text-sa-charcoal">{val}</span> },
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
            render: (val) => (
              <span
                className="badge rounded-pill fw-medium"
                style={{
                  backgroundColor: '#ECFDF5',
                  color: '#059669',
                  border: '1px solid #A7F3D0',
                  fontSize: '11px',
                  padding: '3px 8px'
                }}
              >
                {val || 'Active'}
              </span>
            )
          },
          { key: 'parentName', title: 'Parent Guardian' },
          { key: 'parentPhone', title: 'Emergency Contact' }
        ]}
        data={filtered}
        loading={loading}
      />
    </div>
  );
}
