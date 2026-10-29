import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Table from '../../components/common/Table';
import SearchBar from '../../components/common/SearchBar';
import teacherService from '../../services/teacherService';
import useAuth from '../../hooks/useAuth';
import { ArrowLeft, UserPlus, Building2 } from 'lucide-react';
import { getUserBranch, filterTeachersByBranch } from '../../utils/branchUtils';

export default function TeacherDirectory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userBranch = getUserBranch(user);
  const [teachers, setTeachers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeachers = async () => {
      setLoading(true);
      try {
        let data = await teacherService.getAll();
        let list = Array.isArray(data) ? data : (data ? [data] : []);
        if (list.length === 0) {
          try {
            const me = await teacherService.getMe();
            if (me) list = [me];
          } catch {
            // fallback if /me not available
          }
        }
        setTeachers(list);
      } catch (error) {
        console.error('Failed to fetch teachers:', error);
        try {
          const me = await teacherService.getMe();
          setTeachers(me ? [me] : []);
        } catch {
          setTeachers([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTeachers();
  }, []);

  const scopedTeachers = useMemo(() => {
    return filterTeachersByBranch(teachers, userBranch);
  }, [teachers, userBranch]);

  const filteredTeachers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return scopedTeachers;

    return scopedTeachers.filter((teacher) => {
      const name = teacher.name || '';
      const subject = teacher.subject || '';
      const email = teacher.email || '';
      const phone = teacher.phone || '';
      const classList = (teacher.assignedClasses || []).join(' ');

      return [name, subject, email, phone, classList]
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [scopedTeachers, search]);

  return (
    <div className="d-flex flex-column w-100" style={{ gap: '16px', minWidth: 0, boxSizing: 'border-box' }}>
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
                Faculty Directory
              </h1>
              <span
                className="badge rounded-pill d-inline-flex align-items-center gap-1 px-2.5 py-1"
                style={{
                  backgroundColor: '#FDF0F0',
                  color: '#8B1216',
                  border: '1px solid #F5C2C4',
                  fontSize: '11.5px',
                  fontWeight: 600
                }}
              >
                <Building2 size={12} />
                <span>{userBranch} Campus</span>
              </span>
            </div>
            <p className="m-0 mt-0.5" style={{ fontSize: '13.5px', color: '#64748B' }}>
              Teacher profiles and faculty details for {userBranch} Campus ({filteredTeachers.length} total)
            </p>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search faculty by name, subject, class..."
          />
          <button
            type="button"
            onClick={() => navigate('/teacher/teachers/add')}
            className="btn text-white d-inline-flex align-items-center gap-1.5 fw-semibold px-3 py-2 rounded-2 shadow-xs transition-all"
            style={{ backgroundColor: '#8B1216', fontSize: '13px', whiteSpace: 'nowrap' }}
          >
            <UserPlus size={15} />
            <span>+ Add Faculty</span>
          </button>
        </div>
      </div>

      <Table
        columns={[
          { key: 'id', title: 'Teacher ID', render: (val) => <span className="fw-bold" style={{ color: '#8B1216' }}>{val}</span> },
          {
            key: 'name',
            title: 'Faculty Name',
            render: (val, row) => (
              <div>
                <span className="fw-semibold text-sa-charcoal d-block">{val}</span>
                <span className="text-sa-muted small" style={{ fontSize: '11.5px' }}>{row.qualification || 'Qualified Faculty'}</span>
              </div>
            )
          },
          {
            key: 'subject',
            title: 'Subject',
            render: (val) => (
              <span className="badge rounded-pill fw-medium" style={{ backgroundColor: '#FDF3C7', color: '#A16207', padding: '5px 10px' }}>
                {val || 'General'}
              </span>
            )
          },
          {
            key: 'assignedClasses',
            title: 'Assigned Classes',
            render: (val) => (
              <span className="text-sa-charcoal" style={{ fontSize: '12.5px' }}>
                {(val && val.length ? val.join(', ') : 'N/A')}
              </span>
            )
          },
          {
            key: 'email',
            title: 'Email',
            render: (val) => <span style={{ fontSize: '12.5px' }}>{val || '--'}</span>
          },
          {
            key: 'phone',
            title: 'Mobile',
            render: (val) => <span style={{ fontSize: '12.5px' }}>{val || '--'}</span>
          },
          {
            key: 'status',
            title: 'Status',
            render: (val) => (
              <span
                className="badge rounded-pill fw-medium"
                style={{
                  backgroundColor: val === 'Inactive' ? '#FEE2E2' : '#ECFDF5',
                  color: val === 'Inactive' ? '#B91C1C' : '#059669',
                  border: `1px solid ${val === 'Inactive' ? '#FECACA' : '#A7F3D0'}`,
                  fontSize: '11px',
                  padding: '3px 8px'
                }}
              >
                {val || 'Active'}
              </span>
            )
          }
        ]}
        data={filteredTeachers}
        loading={loading}
        emptyMessage="No teacher records found"
      />
    </div>
  );
}
