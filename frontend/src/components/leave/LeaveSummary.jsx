import React from 'react';
import { CalendarCheck2, Clock, CheckCircle2 } from 'lucide-react';

export default function LeaveSummary({ balance }) {
  return (
    <div className="row g-3">
      {/* 1. Available Leave */}
      <div className="col-12 col-sm-6 col-md-4">
        <div
          className="sa-card bg-white rounded-3 border d-flex align-items-center gap-3 p-3 shadow-xs h-100"
          style={{ borderLeft: '4px solid #168554' }}
        >
          <div
            className="rounded-2 d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ width: '44px', height: '44px', backgroundColor: '#EAF6EF', color: '#168554' }}
          >
            <CheckCircle2 size={22} />
          </div>
          <div className="flex-grow-1 min-w-0">
            <span className="text-sa-muted fw-medium d-block text-truncate small">
              Available Leave
            </span>
            <div className="fw-bold text-sa-charcoal brand-font fs-4" style={{ lineHeight: 1.15 }}>
              {balance.available} <span className="fs-6 fw-normal text-sa-muted">Days</span>
            </div>
            <span className="text-sa-muted d-block text-truncate" style={{ fontSize: '0.72rem' }}>
              Out of {balance.totalAnnual} annual leaves
            </span>
          </div>
        </div>
      </div>

      {/* 2. Used Leave */}
      <div className="col-12 col-sm-6 col-md-4">
        <div
          className="sa-card bg-white rounded-3 border d-flex align-items-center gap-3 p-3 shadow-xs h-100"
          style={{ borderLeft: '4px solid #8B1216' }}
        >
          <div
            className="rounded-2 d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ width: '44px', height: '44px', backgroundColor: '#FDF0F0', color: '#8B1216' }}
          >
            <CalendarCheck2 size={22} />
          </div>
          <div className="flex-grow-1 min-w-0">
            <span className="text-sa-muted fw-medium d-block text-truncate small">
              Used Leave
            </span>
            <div className="fw-bold text-sa-charcoal brand-font fs-4" style={{ lineHeight: 1.15 }}>
              {balance.used} <span className="fs-6 fw-normal text-sa-muted">Days</span>
            </div>
            <span className="text-sa-muted d-block text-truncate" style={{ fontSize: '0.72rem' }}>
              Utilized this academic year
            </span>
          </div>
        </div>
      </div>

      {/* 3. Pending Requests */}
      <div className="col-12 col-sm-6 col-md-4">
        <div
          className="sa-card bg-white rounded-3 border d-flex align-items-center gap-3 p-3 shadow-xs h-100"
          style={{ borderLeft: '4px solid #D97718' }}
        >
          <div
            className="rounded-2 d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ width: '44px', height: '44px', backgroundColor: '#FEF8EB', color: '#D97718' }}
          >
            <Clock size={22} />
          </div>
          <div className="flex-grow-1 min-w-0">
            <span className="text-sa-muted fw-medium d-block text-truncate small">
              Pending Requests
            </span>
            <div className="fw-bold text-sa-charcoal brand-font fs-4" style={{ lineHeight: 1.15 }}>
              {balance.pending}
            </div>
            <span className="text-sa-muted d-block text-truncate" style={{ fontSize: '0.72rem' }}>
              Awaiting admin approval
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
