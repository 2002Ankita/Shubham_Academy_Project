import React, { useState } from 'react';
import { Filter, CheckCircle2, Clock, XCircle, AlertCircle, Eye, ArrowLeft } from 'lucide-react';

export default function WorkingTimeTable({ records }) {
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedRecord, setSelectedRecord] = useState(null);

  const filteredRecords = filterStatus === 'All'
    ? records
    : records.filter(r => r.status === filterStatus);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Present':
        return (
          <span
            className="d-inline-flex align-items-center gap-1.5 justify-content-center"
            style={{
              backgroundColor: '#EAF6EF',
              color: '#168554',
              border: '1px solid #C6E7D2',
              borderRadius: '20px',
              padding: '4px 12px',
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '0.02em',
              whiteSpace: 'nowrap'
            }}
          >
            <CheckCircle2 size={12} /> Present
          </span>
        );
      case 'Late':
        return (
          <span
            className="d-inline-flex align-items-center gap-1.5 justify-content-center"
            style={{
              backgroundColor: '#FEF8EB',
              color: '#D97718',
              border: '1px solid #FDE68A',
              borderRadius: '20px',
              padding: '4px 12px',
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '0.02em',
              whiteSpace: 'nowrap'
            }}
          >
            <Clock size={12} /> Late
          </span>
        );
      case 'Half Day':
        return (
          <span
            className="d-inline-flex align-items-center gap-1.5 justify-content-center"
            style={{
              backgroundColor: '#EFF6FF',
              color: '#2563EB',
              border: '1px solid #BFDBFE',
              borderRadius: '20px',
              padding: '4px 12px',
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '0.02em',
              whiteSpace: 'nowrap'
            }}
          >
            <AlertCircle size={12} /> Half Day
          </span>
        );
      case 'Absent':
      default:
        return (
          <span
            className="d-inline-flex align-items-center gap-1.5 justify-content-center"
            style={{
              backgroundColor: '#FDF0F0',
              color: '#A91D22',
              border: '1px solid #F8C6C8',
              borderRadius: '20px',
              padding: '4px 12px',
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '0.02em',
              whiteSpace: 'nowrap'
            }}
          >
            <XCircle size={12} /> Absent
          </span>
        );
    }
  };

  return (
    <div
      className="sa-card bg-white border"
      style={{
        borderColor: '#E1E6ED',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
      }}
    >
      {selectedRecord ? (
        <div className="d-flex flex-column gap-3">
          {/* Back to Timings Button & Status Header */}
          <div className="d-flex align-items-center justify-content-between pb-3 border-bottom flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedRecord(null)}
              className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-2 px-3 py-1.5 rounded-2 fw-medium shadow-xs"
              style={{ fontSize: '12.5px', height: '36px', borderColor: '#CBD5E1', color: '#1E293B' }}
              title="Back to Timings Log"
            >
              <ArrowLeft size={16} />
              <span>Back to Timings</span>
            </button>

            <div className="d-flex align-items-center gap-2">
              <span className="text-sa-muted small">Status:</span>
              {getStatusBadge(selectedRecord.status)}
            </div>
          </div>

          {/* Details Breakdown Card */}
          <div className="p-4 rounded-3 border bg-light" style={{ borderColor: '#E2E8F0' }}>
            <h3 className="brand-font fw-bold m-0 text-sa-charcoal mb-3" style={{ fontSize: '16px' }}>
              Day Timings & Biometric Punch Details
            </h3>
            <div className="row g-3">
              <div className="col-12 col-md-4">
                <span className="text-muted d-block small">Date & Day</span>
                <span className="fw-bold text-sa-charcoal fs-6">{selectedRecord.date} ({selectedRecord.day})</span>
              </div>
              <div className="col-6 col-md-4">
                <span className="text-muted d-block small">Check In (Biometric / RFID)</span>
                <span className="fw-bold text-success fs-6">{selectedRecord.checkIn}</span>
              </div>
              <div className="col-6 col-md-4">
                <span className="text-muted d-block small">Check Out (Biometric / RFID)</span>
                <span className="fw-bold text-primary fs-6">{selectedRecord.checkOut}</span>
              </div>
              <div className="col-6 col-md-4">
                <span className="text-muted d-block small">Break Time Recorded</span>
                <span className="fw-semibold text-sa-charcoal">{selectedRecord.breakTime || '1h 00m'}</span>
              </div>
              <div className="col-6 col-md-4">
                <span className="text-muted d-block small">Effective Total Hours</span>
                <span className="fw-bold text-sa-charcoal fs-6">{selectedRecord.totalHours}</span>
              </div>
              <div className="col-12 col-md-4">
                <span className="text-muted d-block small">Biometric Device Terminal</span>
                <span className="fw-medium text-sa-charcoal">Main Campus RFID Gate 1 & Bio-Device</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Card Header & Filter Section */}
          <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between pb-3 mb-2 border-bottom gap-2.5">
            <div>
              <h2 className="brand-font fw-bold m-0 text-sa-charcoal" style={{ fontSize: '17px', lineHeight: 1.25 }}>
                Daily Working Time Log
              </h2>
              <p className="text-sa-muted m-0 mt-1" style={{ fontSize: '13px' }}>
                Detailed biometric & RFID punch record ({filteredRecords.length} days)
              </p>
            </div>

            {/* Filter Dropdown */}
            <div className="d-flex align-items-center gap-2">
              <Filter size={15} style={{ color: '#64748B' }} />
              <select
                className="form-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{
                  height: '40px',
                  width: '155px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E1E6ED',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#1E293B',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
                  cursor: 'pointer',
                  paddingLeft: '12px',
                  paddingRight: '30px'
                }}
              >
                <option value="All">All Statuses</option>
                <option value="Present">Present</option>
                <option value="Late">Late</option>
                <option value="Half Day">Half Day</option>
                <option value="Absent">Absent</option>
              </select>
            </div>
          </div>

      {/* Table Section */}
      <div className="table-responsive">
        <table className="table m-0 align-middle">
          <thead>
            <tr style={{ height: '46px', backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              <th
                style={{
                  width: '16%',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  color: '#1E293B',
                  paddingLeft: '16px',
                  borderTop: 'none',
                  verticalAlign: 'middle'
                }}
              >
                Date
              </th>
              <th
                style={{
                  width: '14%',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  color: '#1E293B',
                  borderTop: 'none',
                  verticalAlign: 'middle'
                }}
              >
                Day
              </th>
              <th
                style={{
                  width: '14%',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  color: '#1E293B',
                  borderTop: 'none',
                  verticalAlign: 'middle'
                }}
              >
                Check In
              </th>
              <th
                style={{
                  width: '14%',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  color: '#1E293B',
                  borderTop: 'none',
                  verticalAlign: 'middle'
                }}
              >
                Check Out
              </th>
              <th
                style={{
                  width: '12%',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  color: '#1E293B',
                  borderTop: 'none',
                  verticalAlign: 'middle'
                }}
              >
                Break
              </th>
              <th
                style={{
                  width: '13%',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  color: '#1E293B',
                  borderTop: 'none',
                  verticalAlign: 'middle'
                }}
              >
                Total Hours
              </th>
              <th
                style={{
                  width: '13%',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  color: '#1E293B',
                  borderTop: 'none',
                  verticalAlign: 'middle'
                }}
              >
                Status
              </th>
              <th
                style={{
                  width: '13%',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  color: '#1E293B',
                  textAlign: 'right',
                  paddingRight: '16px',
                  borderTop: 'none',
                  verticalAlign: 'middle'
                }}
              >
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-4 text-sa-muted" style={{ fontSize: '13px' }}>
                  No working time records found matching the filter.
                </td>
              </tr>
            ) : (
              filteredRecords.map((row, idx) => (
                <tr
                  key={idx}
                  className="transition-all"
                  style={{
                    height: '60px',
                    borderBottom: '1px solid #F1F5F9',
                    backgroundColor: '#FFFFFF'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FFFBFB'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; }}
                >
                  {/* Date */}
                  <td style={{ paddingLeft: '16px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                    <span className="fw-semibold text-sa-charcoal" style={{ fontSize: '13.5px' }}>
                      {row.date}
                    </span>
                  </td>

                  {/* Day */}
                  <td style={{ verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                    <span className="text-sa-muted" style={{ fontSize: '13.5px' }}>
                      {row.day}
                    </span>
                  </td>

                  {/* Check In */}
                  <td style={{ verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                    <span className="text-sa-charcoal fw-medium" style={{ fontSize: '13.5px' }}>
                      {row.checkIn}
                    </span>
                  </td>

                  {/* Check Out */}
                  <td style={{ verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                    <span className="text-sa-charcoal fw-medium" style={{ fontSize: '13.5px' }}>
                      {row.checkOut}
                    </span>
                  </td>

                  {/* Break */}
                  <td style={{ verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                    <span className="text-sa-muted" style={{ fontSize: '13px' }}>
                      {row.breakTime}
                    </span>
                  </td>

                  {/* Total Hours */}
                  <td style={{ verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                    <span className="fw-bold" style={{ color: '#1E293B', fontSize: '14px' }}>
                      {row.totalHours}
                    </span>
                  </td>

                  {/* Status Badge */}
                  <td style={{ verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                    {getStatusBadge(row.status)}
                  </td>

                  {/* Action / View Details */}
                  <td style={{ textAlign: 'right', paddingRight: '16px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedRecord(row)}
                      className="btn btn-sm btn-light border d-inline-flex align-items-center gap-1.5 text-sa-charcoal"
                      style={{
                        fontSize: '12px',
                        fontWeight: 500,
                        padding: '4px 10px',
                        borderRadius: '6px',
                        borderColor: '#E2E8F0',
                        backgroundColor: '#F8FAFC',
                        cursor: 'pointer'
                      }}
                      title="View Punch Details"
                    >
                      <Eye size={13} style={{ color: '#8B1216' }} />
                      <span>Details</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  )}
</div>
  );
}
