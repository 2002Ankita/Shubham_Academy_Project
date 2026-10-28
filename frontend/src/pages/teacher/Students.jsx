import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Table from '../../components/common/Table';
import SearchBar from '../../components/common/SearchBar';
import studentService from '../../services/studentService';
import useAuth from '../../hooks/useAuth';
import { ArrowLeft, Building2 } from 'lucide-react';
import { getUserBranch, filterStudentsByBranch } from '../../utils/branchUtils';

export default function TeacherStudents() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userBranch = getUserBranch(user);

  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const data = await studentService.getAll();
        setStudents(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load students:', err);
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const scopedStudents = useMemo(() => {
    return filterStudentsByBranch(students, userBranch);
  }, [students, userBranch]);

  const searchLower = (search || '').trim().toLowerCase();
  const filtered = useMemo(() => {
    return scopedStudents.filter(s =>
      (s.name || '').toLowerCase().includes(searchLower) ||
      (s.rollNumber || '').toLowerCase().includes(searchLower) ||
      (s.standard || '').toLowerCase().includes(searchLower) ||
      (s.batch || '').toLowerCase().includes(searchLower)
    );
  }, [scopedStudents, searchLower]);

  return (
    <div className="d-flex flex-column w-100" style={{ gap: '16px', minWidth: 0, boxSizing: 'border-box' }}>
      {/* Header */}
      <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-3 pt-0 pb-0.5">
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
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <h1 className="brand-font fw-bold m-0" style={{ fontSize: '23px', lineHeight: 1.25, color: '#0F172A' }}>
                Class Student Directory
              </h1>
              <span
                className="badge rounded-pill d-inline-flex align-items-center gap-1.5 px-3 py-1.5"
                style={{
                  backgroundColor: '#FDF0F0',
                  color: '#8B1216',
                  border: '1px solid #F5C2C4',
                  fontSize: '0.82rem',
                  fontWeight: '600'
                }}
              >
                <Building2 size={14} />
                <span>{userBranch} Campus</span>
              </span>
            </div>
            <p className="m-0 mt-0.5" style={{ fontSize: '13.5px', color: '#64748B' }}>
              Students enrolled in your assigned {userBranch} batches ({filtered.length} total)
            </p>
          </div>
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
            key: 'branch',
            title: 'Campus',
            render: (val, row) => (
              <span className="badge rounded-pill bg-light text-dark border small fw-semibold">
                {val || row.campus || userBranch}
              </span>
            )
          },
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
