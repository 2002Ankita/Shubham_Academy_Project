import React, { useState } from 'react';
import Table from '../../components/common/Table';
import SearchBar from '../../components/common/SearchBar';
import Button from '../../components/common/Button';
import { UserPlus, Shield, UserCheck, GraduationCap } from 'lucide-react';

export default function Users() {
  const [search, setSearch] = useState('');
  const [usersList] = useState([
    { id: 'USR-01', name: 'Shubham Sharma', email: 'superadmin@shubham.edu', role: 'Super Admin', campus: 'Headquarters', status: 'Active' },
    { id: 'USR-02', name: 'Rajesh Patil', email: 'admin@shubham.edu', role: 'Academy Admin', campus: 'Pune Main Campus', status: 'Active' },
    { id: 'USR-03', name: 'Dr. Priya Kulkarni', email: 'priya.k@shubham.edu', role: 'Teacher', campus: 'Pune Main Campus', status: 'Active' },
    { id: 'USR-04', name: 'Prof. Amit Sawant', email: 'amit.s@shubham.edu', role: 'Teacher', campus: 'Baner Tech Hub', status: 'Active' },
    { id: 'USR-05', name: 'Aarav Deshmukh', email: 'aarav.d@shubham.edu', role: 'Student', campus: 'Pune Main Campus', status: 'Active' },
    { id: 'USR-06', name: 'Mrs. Sunita Deshmukh', email: 'sunita.d@shubham.edu', role: 'Academy Admin', campus: 'Viman Nagar', status: 'Active' },
  ]);

  const filtered = usersList.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase()) ||
    u.campus.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="d-flex flex-column gap-4">
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
        <div>
          <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">Global Users & Access Roles</h3>
          <span className="small text-sa-muted">Platform identity accounts, RBAC permissions, and campus associations</span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <SearchBar value={search} onChange={setSearch} placeholder="Filter users..." />
        </div>
      </div>

      <div className="sa-card p-4">
        <Table
          columns={[
            { key: 'id', title: 'User ID', render: (val) => <span className="fw-bold">{val}</span> },
            { key: 'name', title: 'Full Name' },
            { key: 'email', title: 'Email' },
            {
              key: 'role',
              title: 'Assigned Role',
              render: (val) => (
                <span className="badge bg-light text-dark border fw-semibold">
                  {val}
                </span>
              )
            },
            { key: 'campus', title: 'Campus Assignment' },
            {
              key: 'status',
              title: 'Status',
              render: (val) => <span className="badge-active">{val}</span>
            }
          ]}
          data={filtered}
        />
      </div>
    </div>
  );
}
