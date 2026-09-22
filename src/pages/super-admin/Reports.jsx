import React, { useState } from 'react';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import { FileText, Download, Filter } from 'lucide-react';
import reportService from '../../services/reportService';

export default function SuperAdminReports() {
  const [reports] = useState([
    { id: 'GLB-01', name: 'Annual Consolidated Academic Performance 2025-26', campus: 'All Campuses', period: 'Full Year', size: '5.2 MB', generated: '2026-09-01' },
    { id: 'GLB-02', name: 'Quarterly Revenue & Defaulters Analysis Q2', campus: 'All Campuses', period: 'Q2 2026', size: '3.8 MB', generated: '2026-09-10' },
    { id: 'GLB-03', name: 'Faculty Attendance & Workload Audit', campus: 'All Campuses', period: 'August 2026', size: '2.1 MB', generated: '2026-09-15' },
    { id: 'GLB-04', name: 'RFID Hardware Health & Network Diagnostics', campus: 'All Campuses', period: 'Last 30 Days', size: '1.4 MB', generated: '2026-09-18' },
  ]);

  const handleDownload = (id) => {
    reportService.downloadReport(id);
  };

  return (
    <div className="d-flex flex-column gap-4">
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
        <div>
          <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">Consolidated System Reports</h3>
          <span className="small text-sa-muted">Organization-level intelligence, financials, and performance archives</span>
        </div>
      </div>

      <div className="sa-card p-4">
        <Table
          columns={[
            { key: 'id', title: 'Report Ref', render: (val) => <span className="fw-bold">{val}</span> },
            { key: 'name', title: 'Report Title', render: (val) => <span className="fw-semibold text-sa-charcoal d-flex align-items-center gap-2"><FileText size={16} className="text-sa-primary" />{val}</span> },
            { key: 'campus', title: 'Scope' },
            { key: 'period', title: 'Time Period' },
            { key: 'size', title: 'File Size' },
            { key: 'generated', title: 'Generated On' },
            {
              key: 'id',
              title: 'Action',
              align: 'end',
              render: (val) => (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                  onClick={() => handleDownload(val)}
                >
                  <Download size={14} />
                  <span>Download</span>
                </button>
              )
            }
          ]}
          data={reports}
        />
      </div>
    </div>
  );
}
