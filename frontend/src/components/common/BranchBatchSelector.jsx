import React, { useEffect } from 'react';
import { Building, Clock, Layers } from 'lucide-react';
import {
  BRANCHES,
  BRANCH_TARABAI,
  BRANCH_MANGALWAR,
  SESSIONS,
  ACADEMIC_BATCHES,
  isSessionRequired,
  normalizeBranch
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
  fixedBranch = false,
  allowedBranches = null,
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
  const labelClass = 'form-label small fw-semibold text-sa-charcoal d-flex align-items-center gap-1.5 mb-1 text-nowrap';

  // Available branch choices
  const branchOptions = allowedBranches && allowedBranches.length > 0
    ? allowedBranches
    : (fixedBranch && branch ? [branch] : BRANCHES);

  const shouldShowAll = showAllOption && !fixedBranch;

  return (
    <div className={`branch-batch-selector ${className}`}>
      <div className={layout === 'stacked' ? 'd-flex flex-column gap-3' : 'row g-3 align-items-end'}>
        {/* Step 1: Branch Display / Dropdown */}
        <div className={layout === 'stacked' ? 'w-100' : (needsSession ? 'col-12 col-md-4' : 'col-12 col-md-6')}>
          <label className="form-label small fw-semibold text-sa-charcoal d-flex align-items-center justify-content-between mb-1">
            <span className="d-inline-flex align-items-center gap-1.5 text-nowrap">
              <Building size={14} className="text-sa-primary flex-shrink-0" />
              <span>{labels.branch || 'Branch / Campus'}</span>
              {required && <span className="text-danger">*</span>}
            </span>
            {fixedBranch && (
              <span
                className="badge rounded-pill flex-shrink-0"
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  backgroundColor: '#ECFDF5',
                  color: '#065F46',
                  border: '1px solid #A7F3D0',
                  padding: '2px 8px'
                }}
              >
                Fixed
              </span>
            )}
          </label>
          {fixedBranch ? (
            <div className="position-relative">
              <input
                type="text"
                readOnly
                disabled
                tabIndex={-1}
                value={branch ? (branch.toLowerCase().includes('mangal') ? '🏛️ Mangalvar Peth' : '🌲 Tarabai Park') : 'Not Selected'}
                className={`${size === 'sm' ? 'form-control form-control-sm' : 'form-control'} fw-bold pe-4`}
                style={{
                  backgroundColor: '#F8FAFC',
                  borderColor: '#E2E8F0',
                  color: '#1E293B',
                  cursor: 'not-allowed',
                  height: size === 'sm' ? '31px' : '38px',
                  fontSize: size === 'sm' ? '0.8rem' : '0.875rem',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden'
                }}
              />
              <span
                className="position-absolute end-0 top-50 translate-middle-y me-2.5 text-muted pointer-events-none"
                style={{ fontSize: '11px', opacity: 0.65 }}
                title="Locked to your login campus"
              >
                🔒
              </span>
            </div>
          ) : (
            <select
              className={`${selectClass} ${!branch && required ? 'border-warning' : ''}`}
              value={normalizeBranch(branch) || branch || ''}
              onChange={(e) => handleBranchSelect(e.target.value)}
              disabled={disabled}
              required={required}
            >
              {shouldShowAll ? (
                <option value="">{allOptionLabel} Branches</option>
              ) : (
                <option value="">-- Choose Branch --</option>
              )}
              {branchOptions.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          )}
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
