import React from 'react';
import { Download, IndianRupee, CalendarDays, ChevronDown } from 'lucide-react';

export default function SalaryBreakdown({
  breakdown,
  selectedMonth = 'October 2026',
  onMonthChange,
  monthOptions = ['October 2026'],
  onDownloadReceipt
}) {
  return (
    <>
      <style>{`
        .salary-breakdown-card {
          width: 100%;
          min-width: 0;
          box-sizing: border-box;
          background-color: #ffffff;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
          padding: 20px 24px;
        }
        .salary-breakdown-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          padding-bottom: 14px;
          margin-bottom: 18px;
          border-bottom: 1px solid #e5e7eb;
          flex-wrap: wrap;
        }
        .salary-breakdown-columns {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 28px;
          width: 100%;
          box-sizing: border-box;
        }
        @media (max-width: 767px) {
          .salary-breakdown-columns {
            grid-template-columns: minmax(0, 1fr);
            gap: 20px;
          }
        }
      `}</style>

      <div className="sa-card salary-breakdown-card">
        {/* Header: Title, Subtitle, Month Selector & Download Monthly Receipt Button */}
        <div className="salary-breakdown-header">
          <div className="d-flex align-items-center gap-2 min-w-0">
            <IndianRupee size={17} className="text-danger flex-shrink-0" />
            <div className="min-w-0">
              <h3 className="brand-font fw-bold m-0 text-sa-charcoal" style={{ fontSize: '14.5px', lineHeight: 1.25 }}>
                Salary Breakdown
              </h3>
              <p className="text-sa-muted m-0 mt-0.5 text-truncate" style={{ fontSize: '12px' }}>
                Itemized pay components for current billing cycle
              </p>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2 flex-wrap">
            {/* Month Selector for Monthly Receipts */}
            <div className="position-relative d-inline-flex align-items-center">
              <CalendarDays
                size={13}
                className="position-absolute"
                style={{ left: '9px', pointerEvents: 'none', color: '#64748B' }}
              />
              <select
                id="salary-month-select"
                aria-label="Select salary month"
                value={selectedMonth}
                onChange={(e) => onMonthChange && onMonthChange(e.target.value)}
                className="form-select form-select-sm"
                style={{
                  fontSize: '12px',
                  height: '34px',
                  borderColor: '#CBD5E1',
                  color: '#334155',
                  paddingLeft: '28px',
                  paddingRight: '26px',
                  borderRadius: '6px',
                  backgroundColor: '#FFFFFF',
                  cursor: 'pointer',
                  appearance: 'none',
                  WebkitAppearance: 'none'
                }}
              >
                {monthOptions.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={12}
                className="position-absolute"
                style={{ right: '8px', pointerEvents: 'none', color: '#64748B' }}
              />
            </div>

            {/* Download Monthly Receipt Button */}
            <button
              id="download-monthly-receipt-btn"
              type="button"
              onClick={onDownloadReceipt}
              className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1.5 px-3 rounded-2 fw-medium flex-shrink-0 transition-all"
              style={{ fontSize: '12px', height: '34px', borderColor: '#CBD5E1', color: '#475569' }}
              aria-label="Download Monthly Receipt"
              title="Download Monthly Receipt"
            >
              <Download size={13} />
              <span>Download Monthly Receipt</span>
            </button>
          </div>
        </div>

        {/* Two-Column Breakdown: Earnings & Additions | Deductions & Taxes */}
        <div className="salary-breakdown-columns">
          {/* Earnings Column */}
          <div className="d-flex flex-column min-w-0">
            <div className="d-flex align-items-center justify-content-between pb-2 mb-1 border-bottom" style={{ borderColor: '#E2E8F0' }}>
              <span className="fw-bold" style={{ fontSize: '13px', color: '#168554', letterSpacing: '0.01em' }}>
                Earnings & Additions
              </span>
            </div>
            <div className="d-flex flex-column" style={{ fontSize: '13px' }}>
              <div className="d-flex justify-content-between align-items-center py-2 border-bottom border-light" style={{ minHeight: '38px' }}>
                <span className="text-sa-charcoal">Basic Salary</span>
                <span className="fw-semibold text-sa-charcoal">₹{breakdown.basicSalary.toLocaleString()}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center py-2 border-bottom border-light" style={{ minHeight: '38px' }}>
                <span className="text-sa-charcoal">Working Hours Pay</span>
                <span className="fw-semibold text-sa-charcoal">₹{breakdown.workingHoursPay.toLocaleString()}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center py-2 border-bottom border-light" style={{ minHeight: '38px' }}>
                <span className="text-sa-charcoal">Overtime / Doubt Sessions</span>
                <span className="fw-semibold text-sa-charcoal">₹{breakdown.overtime.toLocaleString()}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center py-2 border-bottom border-light" style={{ minHeight: '38px' }}>
                <span className="text-sa-charcoal">Other Allowances</span>
                <span className="fw-semibold text-sa-charcoal">₹{breakdown.allowances.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Deductions Column */}
          <div className="d-flex flex-column min-w-0">
            <div className="d-flex align-items-center justify-content-between pb-2 mb-1 border-bottom" style={{ borderColor: '#E2E8F0' }}>
              <span className="fw-bold" style={{ fontSize: '13px', color: '#DC2626', letterSpacing: '0.01em' }}>
                Deductions & Taxes
              </span>
            </div>
            <div className="d-flex flex-column" style={{ fontSize: '13px' }}>
              <div className="d-flex justify-content-between align-items-center py-2 border-bottom border-light" style={{ minHeight: '38px' }}>
                <span className="text-sa-charcoal">Professional Tax (PT)</span>
                <span className="fw-semibold text-danger">-₹{breakdown.pt.toLocaleString()}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center py-2 border-bottom border-light" style={{ minHeight: '38px' }}>
                <span className="text-sa-charcoal">Leave Without Pay / Deductions</span>
                <span className="fw-semibold text-danger">-₹{breakdown.otherDeductions.toLocaleString()}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center py-2 border-bottom border-light" style={{ minHeight: '38px' }}>
                <span className="text-sa-charcoal fw-medium">Total Deductions</span>
                <span className="fw-bold text-danger">-₹{breakdown.deductions.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Total Net Salary Section */}
        <div
          className="d-flex align-items-center justify-content-between mt-4 px-3.5 py-3 rounded-2"
          style={{ backgroundColor: '#FAF8F5', border: '1px solid #F1ECE4', boxSizing: 'border-box', width: '100%' }}
        >
          <div className="min-w-0">
            <span className="text-sa-charcoal fw-bold d-block brand-font" style={{ fontSize: '13.5px' }}>
              Total Net Salary Payable
            </span>
            <span className="text-sa-muted d-block text-truncate" style={{ fontSize: '11.5px', marginTop: '2px' }}>
              Calculated on {breakdown.workingHours} working hours logged
            </span>
          </div>
          <div className="text-end flex-shrink-0 ms-3">
            <span className="brand-font fw-bold text-sa-primary" style={{ fontSize: '24px', lineHeight: 1.1 }}>
              ₹{breakdown.netSalary.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
