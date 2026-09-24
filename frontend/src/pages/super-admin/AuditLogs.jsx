import React from 'react';
import Table from '../../components/common/Table';
import { ShieldCheck, Download } from 'lucide-react';
import Button from '../../components/common/Button';

export default function AuditLogs() {
  const logs = [
    { id: 'LOG-8812', timestamp: '2026-09-19 08:14:02', user: 'RFID Gate 1 Sensor', event: 'Card Tap Verified (STU-001 / Aarav)', ip: '192.168.1.104', status: 'Success' },
    { id: 'LOG-8811', timestamp: '2026-09-19 08:10:45', user: 'admin@shubham.edu', event: 'User Login Authenticated (JWT Issued)', ip: '49.36.110.22', status: 'Success' },
    { id: 'LOG-8810', timestamp: '2026-09-18 16:40:12', user: 'admin@shubham.edu', event: 'Fee Receipt REC-99120 Dispatched to SMS Gateway', ip: '49.36.110.22', status: 'Success' },
    { id: 'LOG-8809', timestamp: '2026-09-18 14:15:30', user: 'priya.k@shubham.edu', event: 'Marks Entry Submitted: Unit Test 1', ip: '103.22.44.11', status: 'Success' },
    { id: 'LOG-8808', timestamp: '2026-09-18 11:00:22', user: 'superadmin@shubham.edu', event: 'Academy Campus Registered: Hadapsar Branch', ip: '115.110.12.8', status: 'Success' },
    { id: 'LOG-8807', timestamp: '2026-09-17 09:22:15', user: 'Unknown (Guest)', event: 'Unauthorized Route Access Blocked (/super-admin)', ip: '182.74.88.9', status: 'Blocked (403)' },
  ];

  return (
    <div className="d-flex flex-column gap-4">
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
        <div>
          <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">Security & Audit Logs</h3>
          <span className="small text-sa-muted">Immutable system audit trail, API events, and device communications</span>
        </div>
        <Button variant="outline" icon={Download} onClick={() => alert('Exporting encrypted audit trail...')}>
          Export Audit Trail (.CSV)
        </Button>
      </div>

      <div className="sa-card p-4">
        <Table
          columns={[
            { key: 'id', title: 'Audit ID', render: (val) => <span className="fw-bold">{val}</span> },
            { key: 'timestamp', title: 'Timestamp' },
            { key: 'user', title: 'Actor / System Node' },
            { key: 'event', title: 'Event Details' },
            { key: 'ip', title: 'Source IP' },
            {
              key: 'status',
              title: 'Resolution',
              render: (val) => val.includes('Blocked') ? <span className="badge-absent">{val}</span> : <span className="badge-active">{val}</span>
            }
          ]}
          data={logs}
        />
      </div>
    </div>
  );
}
