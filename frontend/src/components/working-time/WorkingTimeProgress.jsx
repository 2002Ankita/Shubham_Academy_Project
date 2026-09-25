import React from 'react';
import { Clock } from 'lucide-react';

export default function WorkingTimeProgress({ summary }) {
  return (
    <div
      className="sa-card bg-white border"
      style={{
        borderColor: '#E1E6ED',
        borderRadius: '16px',
        padding: '20px 24px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
      }}
    >
      <div className="d-flex align-items-center justify-content-between pb-2 mb-3 border-bottom flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2">
          <div
            className="rounded-2 d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ width: '32px', height: '32px', backgroundColor: '#FDF0F0', color: 'var(--sa-primary-red)' }}
          >
            <Clock size={16} />
          </div>
          <div>
            <h3 className="brand-font fw-bold m-0 text-sa-charcoal" style={{ fontSize: '15px' }}>
              Monthly Working Hours Progress
            </h3>
            <span className="text-sa-muted" style={{ fontSize: '12.5px' }}>
              Academic session hours tracking against monthly contract quota
            </span>
          </div>
        </div>
        <span
          className="badge bg-light text-sa-charcoal border px-2.5 py-1.5 fw-medium"
          style={{ fontSize: '12px', borderColor: '#E1E6ED' }}
        >
          September 2026
        </span>
      </div>

      <div className="row g-3 align-items-center">
        {/* Progress Bar & Big Numbers */}
        <div className="col-12 col-md-7">
          <div className="d-flex align-items-baseline justify-content-between mb-1.5">
            <div>
              <span className="brand-font fw-bold text-sa-charcoal" style={{ fontSize: '22px' }}>
                {summary.completedHours}
              </span>
              <span className="text-sa-muted" style={{ fontSize: '14px' }}> / {summary.targetHours} hrs</span>
            </div>
            <span className="fw-bold brand-font" style={{ fontSize: '16px', color: 'var(--sa-primary-red)' }}>
              {summary.percentage}%
            </span>
          </div>

          <div className="progress" style={{ height: '7px', backgroundColor: '#F1F5F9', borderRadius: '4px' }}>
            <div
              className="progress-bar"
              role="progressbar"
              style={{ width: `${summary.percentage}%`, backgroundColor: 'var(--sa-primary-red)', borderRadius: '4px' }}
              aria-valuenow={summary.percentage}
              aria-valuemin="0"
              aria-valuemax="100"
            />
          </div>

          <div className="d-flex justify-content-between text-sa-muted mt-2" style={{ fontSize: '11.5px' }}>
            <span>0 hrs (Start)</span>
            <span>Target: {summary.targetHours} hrs</span>
          </div>
        </div>

        {/* 3 Metric Pills */}
        <div className="col-12 col-md-5">
          <div className="row g-2">
            <div className="col-4">
              <div className="p-2 bg-light rounded-2 text-center border" style={{ borderColor: '#F1F5F9' }}>
                <span className="text-sa-muted d-block text-truncate" style={{ fontSize: '11px' }}>Completed</span>
                <span className="fw-bold text-success" style={{ fontSize: '14px' }}>{summary.completedHours}h</span>
              </div>
            </div>
            <div className="col-4">
              <div className="p-2 bg-light rounded-2 text-center border" style={{ borderColor: '#F1F5F9' }}>
                <span className="text-sa-muted d-block text-truncate" style={{ fontSize: '11px' }}>Target</span>
                <span className="fw-bold text-sa-charcoal" style={{ fontSize: '14px' }}>{summary.targetHours}h</span>
              </div>
            </div>
            <div className="col-4">
              <div className="p-2 bg-light rounded-2 text-center border" style={{ borderColor: '#F1F5F9' }}>
                <span className="text-sa-muted d-block text-truncate" style={{ fontSize: '11px' }}>Remaining</span>
                <span className="fw-bold" style={{ fontSize: '14px', color: 'var(--sa-primary-red)' }}>{summary.remainingHours}h</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
