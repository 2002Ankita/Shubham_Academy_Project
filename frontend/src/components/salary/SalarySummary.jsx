import React from 'react';
import { IndianRupee, Clock, TrendingUp, AlertCircle } from 'lucide-react';

export default function SalarySummary({ summary }) {
  return (
    <>
      <style>{`
        .salary-summary-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
          width: 100%;
          box-sizing: border-box;
        }
        .salary-summary-card {
          height: 88px;
          min-width: 0;
          width: 100%;
          box-sizing: border-box;
          padding: 12px 14px;
          background-color: #ffffff;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
          display: flex;
          align-items: center;
          gap: 12px;
          overflow: hidden;
        }
        @media (max-width: 991px) {
          .salary-summary-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px;
          }
        }
        @media (max-width: 575px) {
          .salary-summary-grid {
            grid-template-columns: minmax(0, 1fr);
            gap: 12px;
          }
        }
      `}</style>

      <div className="salary-summary-grid">
        {/* 1. Current Month Salary */}
        <div className="sa-card salary-summary-card">
          <div
            className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ width: '40px', height: '40px', backgroundColor: '#FDF0F0', color: '#8B1216' }}
          >
            <IndianRupee size={20} />
          </div>
          <div className="flex-grow-1 min-w-0" style={{ overflow: 'hidden' }}>
            <span className="text-sa-muted fw-medium d-block text-truncate" style={{ fontSize: '11.5px' }}>
              Current Month Salary
            </span>
            <div className="fw-bold text-sa-charcoal brand-font text-truncate" style={{ fontSize: '22px', lineHeight: 1.15 }}>
              {summary.currentMonthSalary}
            </div>
            <span className="text-sa-muted d-block text-truncate" style={{ fontSize: '10.5px' }}>
              Estimated for {summary.payPeriod}
            </span>
          </div>
        </div>

        {/* 2. Working Hours */}
        <div className="sa-card salary-summary-card">
          <div
            className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ width: '40px', height: '40px', backgroundColor: '#EAF6EF', color: '#168554' }}
          >
            <Clock size={20} />
          </div>
          <div className="flex-grow-1 min-w-0" style={{ overflow: 'hidden' }}>
            <span className="text-sa-muted fw-medium d-block text-truncate" style={{ fontSize: '11.5px' }}>
              Working Hours
            </span>
            <div className="fw-bold text-sa-charcoal brand-font text-truncate" style={{ fontSize: '22px', lineHeight: 1.15 }}>
              {summary.workingHours}
            </div>
            <span className="fw-semibold d-block text-truncate" style={{ fontSize: '10.5px', color: '#168554' }}>
              68% of 48 hrs quota
            </span>
          </div>
        </div>

        {/* 3. Hourly Rate */}
        <div className="sa-card salary-summary-card">
          <div
            className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ width: '40px', height: '40px', backgroundColor: '#F0F9FF', color: '#0284C7' }}
          >
            <TrendingUp size={20} />
          </div>
          <div className="flex-grow-1 min-w-0" style={{ overflow: 'hidden' }}>
            <span className="text-sa-muted fw-medium d-block text-truncate" style={{ fontSize: '11.5px' }}>
              Hourly Rate
            </span>
            <div className="fw-bold text-sa-charcoal brand-font text-truncate" style={{ fontSize: '22px', lineHeight: 1.15 }}>
              {summary.hourlyRate}
            </div>
            <span className="text-sa-muted d-block text-truncate" style={{ fontSize: '10.5px' }}>
              Contract teaching slab
            </span>
          </div>
        </div>

        {/* 4. Payment Status */}
        <div className="sa-card salary-summary-card">
          <div
            className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ width: '40px', height: '40px', backgroundColor: '#FEF8EB', color: '#D97718' }}
          >
            <AlertCircle size={20} />
          </div>
          <div className="flex-grow-1 min-w-0" style={{ overflow: 'hidden' }}>
            <span className="text-sa-muted fw-medium d-block text-truncate" style={{ fontSize: '11.5px' }}>
              Payment Status
            </span>
            <div className="fw-bold brand-font text-truncate" style={{ fontSize: '22px', lineHeight: 1.15, color: '#D97718' }}>
              {summary.paymentStatus}
            </div>
            <span className="text-sa-muted d-block text-truncate" style={{ fontSize: '10.5px' }}>
              Disbursement by 5th Oct
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
