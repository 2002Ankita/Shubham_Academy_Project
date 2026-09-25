import React from 'react';
import { FileText, Download, CheckCircle2, IndianRupee } from 'lucide-react';
import { toast } from 'react-toastify';

export default function SalaryBreakdown({ breakdown }) {
  const handleDownloadSlip = () => {
    toast.info('Downloading Salary Slip (September 2026)...');
    setTimeout(() => {
      toast.success('Payslip downloaded successfully!');
    }, 1000);
  };

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
        {/* Header: Title, Subtitle, Download Payslip Button */}
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

          <button
            onClick={handleDownloadSlip}
            className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1.5 px-3 rounded-2 fw-medium flex-shrink-0 transition-all"
            style={{ fontSize: '12px', height: '34px', borderColor: '#CBD5E1', color: '#475569' }}
          >
            <Download size={13} />
            <span>Download Payslip</span>
          </button>
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
                <span className="fw-semibold text-danger">-₹200</span>
              </div>
              <div className="d-flex justify-content-between align-items-center py-2 border-bottom border-light" style={{ minHeight: '38px' }}>
                <span className="text-sa-charcoal">Leave Without Pay / Deductions</span>
                <span className="fw-semibold text-danger">-₹300</span>
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
              Calculated on 32.5 working hours logged
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
