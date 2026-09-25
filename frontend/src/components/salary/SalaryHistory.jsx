import React from 'react';
import { Calendar, CheckCircle2, Clock } from 'lucide-react';

export default function SalaryHistory({ history }) {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Paid':
        return (
          <span
            className="badge rounded-pill fw-medium d-inline-flex align-items-center gap-1"
            style={{ backgroundColor: '#EAF6EF', color: '#168554', fontSize: '0.74rem', padding: '3px 8px' }}
          >
            <CheckCircle2 size={11} /> Paid
          </span>
        );
      case 'Pending':
      default:
        return (
          <span
            className="badge rounded-pill fw-medium d-inline-flex align-items-center gap-1"
            style={{ backgroundColor: '#FEF8EB', color: '#D97718', fontSize: '0.74rem', padding: '3px 8px' }}
          >
            <Clock size={11} /> Pending
          </span>
        );
    }
  };

  return (
    <div
      className="sa-card bg-white rounded-3 border shadow-xs"
      style={{
        width: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
        padding: '20px 24px',
        borderRadius: '8px',
        borderColor: '#e5e7eb',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
      }}
    >
      <div className="d-flex align-items-center justify-content-between pb-3 mb-3 border-bottom flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2 min-w-0">
          <Calendar size={17} className="text-danger flex-shrink-0" />
          <div className="min-w-0">
            <h3 className="brand-font fw-bold m-0 text-sa-charcoal" style={{ fontSize: '14.5px', lineHeight: 1.25 }}>
              Salary History
            </h3>
            <p className="text-sa-muted m-0 mt-0.5 text-truncate" style={{ fontSize: '12px' }}>
              Past monthly compensation disbursements and payment statements
            </p>
          </div>
        </div>
      </div>

      <div className="table-responsive" style={{ width: '100%', overflowX: 'auto' }}>
        <table className="table table-hover align-middle m-0" style={{ fontSize: '13px', minWidth: '650px' }}>
          <thead>
            <tr className="text-muted border-bottom bg-light" style={{ fontSize: '0.76rem' }}>
              <th className="py-2.5 ps-2">Month</th>
              <th className="py-2.5">Working Hours</th>
              <th className="py-2.5">Gross Salary</th>
              <th className="py-2.5">Deductions</th>
              <th className="py-2.5">Net Salary</th>
              <th className="py-2.5">Payment Date</th>
              <th className="py-2.5 pe-2 text-end">Status</th>
            </tr>
          </thead>
          <tbody>
            {history.map((row, idx) => (
              <tr key={idx}>
                <td className="ps-2 fw-semibold text-sa-charcoal" style={{ whiteSpace: 'nowrap' }}>
                  {row.month}
                </td>
                <td className="text-sa-charcoal" style={{ whiteSpace: 'nowrap' }}>
                  {row.workingHours}
                </td>
                <td className="text-sa-charcoal" style={{ whiteSpace: 'nowrap' }}>
                  {row.grossSalary}
                </td>
                <td className="text-danger" style={{ whiteSpace: 'nowrap' }}>
                  -{row.deductions}
                </td>
                <td className="fw-bold text-sa-charcoal" style={{ whiteSpace: 'nowrap' }}>
                  {row.netSalary}
                </td>
                <td className="text-sa-muted" style={{ whiteSpace: 'nowrap' }}>
                  {row.paymentDate}
                </td>
                <td className="pe-2 text-end" style={{ whiteSpace: 'nowrap' }}>
                  {getStatusBadge(row.status)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
