import React, { useEffect } from 'react';
import { Building, Clock, Layers } from 'lucide-react';
import {
  BRANCHES,
  BRANCH_TARABAI,
  BRANCH_MANGALWAR,
  SESSIONS,
  ACADEMIC_BATCHES,
  isSessionRequired
} from '../../config/branchBatchConfig';

/**
 * Standardized Branch, Session, and Academic Batch Selector.
 * 
 * Flow:
 * - Tarabai Park -> Direct Academic Batch
 * - Mangalwar Peth -> Session (Morning / Afternoon) -> Academic Batch
 */
export default function BranchBatchSelector({
  branch = '',
  session = '',
  academicBatch = '',
  onBranchChange,
  onSessionChange,
  onBatchChange,
  onAcademicBatchChange,
  showAllOption = false,
  allOptionLabel = 'All',
  required = false,
  disabled = false,
  size = 'md', // 'sm' | 'md'
  layout = 'row', // 'row' | 'stacked' | 'grid'
  labels = {},
  className = ''
}) {
  const needsSession = isSessionRequired(branch);

  // When branch changes, reset incompatible session if moving to Tarabai Park
  const handleBranchSelect = (newBranch) => {
    if (onBranchChange) onBranchChange(newBranch);
    if (!isSessionRequired(newBranch)) {
      if (onSessionChange) onSessionChange('');
    }
  };

  const isBatchDisabled = disabled || !branch || (needsSession && !session && !showAllOption);
  const isSessionDisabled = disabled || !branch || !needsSession;

  const selectClass = size === 'sm' ? 'form-select form-select-sm' : 'form-select';
  const labelClass = 'form-label small fw-semibold text-sa-charcoal d-flex align-items-center gap-1.5 mb-1';

  return (
    <div className={`branch-batch-selector ${className}`}>
      <div className={layout === 'stacked' ? 'd-flex flex-column gap-3' : 'row g-3 align-items-end'}>
        {/* Step 1: Branch Dropdown */}
        <div className={layout === 'stacked' ? 'w-100' : (needsSession ? 'col-12 col-md-4' : 'col-12 col-md-6')}>
          <label className={labelClass}>
            <Building size={14} className="text-sa-primary" />
            <span>{labels.branch || 'Select Branch'}</span>
            {required && <span className="text-danger">*</span>}
          </label>
          <select
            className={`${selectClass} ${!branch && required ? 'border-warning' : ''}`}
            value={branch || ''}
            onChange={(e) => handleBranchSelect(e.target.value)}
            disabled={disabled}
            required={required}
          >
            {showAllOption ? (
              <option value="">{allOptionLabel} Branches</option>
            ) : (
              <option value="">-- Choose Branch --</option>
            )}
            {BRANCHES.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        {/* Step 2: Session Dropdown (Shown or required for Mangalwar Peth) */}
        {needsSession && (
          <div className={layout === 'stacked' ? 'w-100' : 'col-12 col-md-4'}>
            <label className={labelClass}>
              <Clock size={14} className="text-sa-primary" />
              <span>{labels.session || 'Session'}</span>
              {required && <span className="text-danger">*</span>}
            </label>
            <select
              className={`${selectClass} ${needsSession && !session && required ? 'border-warning' : ''}`}
              value={session || ''}
              onChange={(e) => onSessionChange && onSessionChange(e.target.value)}
              disabled={isSessionDisabled}
              required={required && needsSession}
            >
              {showAllOption ? (
                <option value="">{allOptionLabel} Sessions</option>
              ) : (
                <option value="">-- Choose Session --</option>
              )}
              {SESSIONS.map((s) => (
                <option key={s} value={s}>
                  {s} Session
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Step 3: Academic Batch Dropdown */}
        <div className={layout === 'stacked' ? 'w-100' : (needsSession ? 'col-12 col-md-4' : 'col-12 col-md-6')}>
          <label className={labelClass}>
            <Layers size={14} className="text-sa-primary" />
            <span>{labels.batch || 'Academic Batch'}</span>
            {required && <span className="text-danger">*</span>}
          </label>
          <select
            className={`${selectClass} ${!academicBatch && required ? 'border-warning' : ''}`}
            value={academicBatch || ''}
            onChange={(e) => {
              const val = e.target.value;
              if (onBatchChange) onBatchChange(val);
              if (onAcademicBatchChange) onAcademicBatchChange(val);
            }}
            disabled={isBatchDisabled}
            required={required}
          >
            {showAllOption ? (
              <option value="">{allOptionLabel} Academic Batches</option>
            ) : (
              <option value="">
                {!branch ? '-- Select Branch First --' : (needsSession && !session ? '-- Select Session First --' : '-- Choose Academic Batch --')}
              </option>
            )}
            {ACADEMIC_BATCHES.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
