import React from 'react';
import { Calendar, CheckCircle2, Clock } from 'lucide-react';

export default function SalaryHistory({ history }) {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Disbursed':
        return (
          <span
            className="badge rounded-pill fw-medium d-inline-flex align-items-center gap-1"
            style={{ backgroundColor: '#EAF6EF', color: '#168554', fontSize: '0.74rem', padding: '3px 8px' }}
          >
            <CheckCircle2 size={11} /> Fully Paid
          </span>
        );
      case 'Partially Paid':
        return (
          <span
            className="badge rounded-pill fw-medium d-inline-flex align-items-center gap-1"
            style={{ backgroundColor: '#FEF8EB', color: '#D97718', fontSize: '0.74rem', padding: '3px 8px' }}
          >
            <Clock size={11} /> Partially Paid
          </span>
        );
      case 'Processing':
      default:
        return (
          <span
            className="badge rounded-pill fw-medium d-inline-flex align-items-center gap-1"
            style={{ backgroundColor: '#F1F5F9', color: '#64748B', fontSize: '0.74rem', padding: '3px 8px' }}
          >
            <Clock size={11} /> Processing
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
              <th className="py-2.5">Net / Pending</th>
              <th className="py-2.5">Payment Date</th>
              <th className="py-2.5 pe-2 text-end">Status</th>
            </tr>
          </thead>
          <tbody>
            {history.map((row, idx) => (
              <React.Fragment key={idx}>
                <tr>
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
                    <div>
                      <span className="d-block">₹{row.netSalary.toLocaleString()}</span>
                      <span className="text-muted small fw-normal" style={{ fontSize: '11px' }}>Pending: ₹{row.amountPending.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="text-sa-muted" style={{ whiteSpace: 'nowrap' }}>
                    {row.paymentDate}
                  </td>
                  <td className="pe-2 text-end" style={{ whiteSpace: 'nowrap' }}>
                    {getStatusBadge(row.status)}
                  </td>
                </tr>
                {row.installments && row.installments.length > 0 && (
                  <tr className="bg-light">
                    <td colSpan="7" className="ps-4 py-3 border-bottom">
                      <div className="d-flex flex-column gap-2">
                        <span className="small fw-semibold text-sa-muted text-uppercase" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>Installment History</span>
                        {row.installments.map((inst, i) => (
                          <div key={i} className="d-flex align-items-center gap-3" style={{ fontSize: '12px' }}>
                            <span className="text-sa-charcoal fw-medium" style={{ minWidth: '90px' }}>
                              {i + 1}{i===0?'st':i===1?'nd':i===2?'rd':'th'} Installment:
                            </span>
                            <span className="text-success fw-bold" style={{ minWidth: '70px' }}>+₹{inst.amount.toLocaleString()}</span>
                            <span className="text-muted d-flex align-items-center gap-1" style={{ minWidth: '130px' }}><Clock size={11} /> {inst.date}</span>
                            <span className="text-muted border-start ps-3 ms-2">Ref: {inst.transactionRef}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
