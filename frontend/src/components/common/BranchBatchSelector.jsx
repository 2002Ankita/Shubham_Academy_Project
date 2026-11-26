import React, { useEffect } from 'react';
import { Building, Clock, Layers, School } from 'lucide-react';
import {
  BRANCHES,
  BRANCH_TARABAI,
  BRANCH_MANGALWAR,
  SESSIONS,
  ACADEMIC_BATCHES,
  isSessionRequired,
  normalizeBranch,
  normalizeAcademicBatch,
  normalizeSession,
  getCenterTypesForBranch,
  getDefaultCenterType
} from '../../config/branchBatchConfig';

/**
 * Standardized Branch, Session, and Academic Batch Selector.
 * 
 * Flow:
 * - Tarabai Park -> Institute Option (Shubham Academy / Shubham Coaching Classes) -> Academic Batch
 * - Mangalwar Peth -> Institute Option (Shubham Tutorial / Shubham Academy) -> Session (Morning / Afternoon) -> Academic Batch
 */
export default function BranchBatchSelector({
  branch = '',
  session = '',
  academicBatch = '',
  batch = '',
  centerType = '',
  onBranchChange,
  onSessionChange,
  onBatchChange,
  onAcademicBatchChange,
  onCenterTypeChange,
  showCenterType = false,
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
  const normalizedBranch = normalizeBranch(branch) || branch || '';
  const needsSession = isSessionRequired(normalizedBranch);
  const selectedBatch = normalizeAcademicBatch(academicBatch || batch) || academicBatch || batch || '';
  const currentSession = normalizeSession(session) || session || '';

  const centerTypeOptions = getCenterTypesForBranch(normalizedBranch);
  const currentCenterType = centerType || (centerTypeOptions.length > 0 ? centerTypeOptions[0] : getDefaultCenterType(normalizedBranch));

  // When branch changes, reset incompatible session if moving to Tarabai Park
  // and ensure centerType matches valid options for the branch
  const handleBranchSelect = (newBranch) => {
    if (onBranchChange) onBranchChange(newBranch);
    if (!isSessionRequired(newBranch)) {
      if (onSessionChange) onSessionChange('');
    } else if (!session && onSessionChange) {
      onSessionChange('Morning');
    }

    if (onCenterTypeChange) {
      const validOpts = getCenterTypesForBranch(newBranch);
      if (!validOpts.includes(centerType)) {
        onCenterTypeChange(validOpts[0]);
      }
    }
  };

  // Academic batch is NEVER blocked or disabled if a branch is present
  const isBatchDisabled = Boolean(disabled || !branch);
  const isSessionDisabled = Boolean(disabled || !branch || !needsSession);

  const selectClass = size === 'sm' ? 'form-select form-select-sm' : 'form-select';
  const labelClass = 'form-label small fw-semibold text-sa-charcoal d-flex align-items-center gap-1.5 mb-1 text-nowrap';

  // Available branch choices
  const branchOptions = allowedBranches && allowedBranches.length > 0
    ? allowedBranches
    : (fixedBranch && branch ? [branch] : BRANCHES);

  const shouldShowAll = showAllOption && !fixedBranch;

  // Responsive column classes to ensure no text truncation and ample breathing room
  let colClass = 'col-12 col-md-6';
  if (layout === 'stacked') {
    colClass = 'w-100';
  } else if (showCenterType) {
    // When Institute / Unit is shown:
    // Mangalwar Peth: 4 items in a 2x2 grid (Branch & Institute on Row 1, Session & Batch on Row 2)
    // Tarabai Park: Branch & Institute on Row 1, Batch on Row 2
    colClass = 'col-12 col-md-6';
  } else {
    colClass = needsSession ? 'col-12 col-md-4' : 'col-12 col-md-6';
  }

  return (
    <div className={`branch-batch-selector ${className}`}>
      <div className={layout === 'stacked' ? 'd-flex flex-column gap-3' : 'row g-3'}>
        {/* Step 1: Branch Display / Dropdown */}
        <div className={colClass}>
          <label className="form-label small fw-semibold text-sa-charcoal d-flex align-items-center gap-2 mb-1">
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
                  padding: '1.5px 7px'
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
                value={branch ? (branch.toLowerCase().includes('mangal') ? '🏛️ Mangalvar Peth Campus' : '🌲 Tarabai Park Campus') : 'Not Selected'}
                className={`${size === 'sm' ? 'form-control form-control-sm' : 'form-control'} fw-bold pe-4`}
                style={{
                  backgroundColor: '#F8FAFC',
                  borderColor: '#E2E8F0',
                  color: '#1E293B',
                  cursor: 'not-allowed',
                  height: size === 'sm' ? '31px' : '38px',
                  fontSize: size === 'sm' ? '0.8rem' : '0.875rem'
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
              style={{
                height: size === 'sm' ? '31px' : '38px',
                fontSize: size === 'sm' ? '0.8rem' : '0.875rem'
              }}
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
          {fixedBranch && (
            <div className="text-muted small mt-1.5" style={{ fontSize: '10.5px' }}>
              Campus: Locked to active login access
            </div>
          )}
        </div>

        {/* Step 2: Center Type / Institute Option (Tarabai vs Mangalwar) */}
        {showCenterType && (
          <div className={colClass}>
            <label className={labelClass}>
              <School size={14} className="text-sa-primary flex-shrink-0" />
              <span>{labels.centerType || 'Institute / Unit'}</span>
              {required && <span className="text-danger">*</span>}
            </label>
            <div className="position-relative">
              <select
                className={`${selectClass} ${!currentCenterType && required ? 'border-warning' : ''} fw-semibold`}
                value={currentCenterType}
                onChange={(e) => onCenterTypeChange && onCenterTypeChange(e.target.value)}
                disabled={disabled || !branch}
                required={required}
                style={{
                  height: size === 'sm' ? '31px' : '38px',
                  fontSize: size === 'sm' ? '0.8rem' : '0.875rem',
                  backgroundColor: disabled || !branch ? '#F8FAFC' : '#FFFFFF',
                  borderColor: '#CBD5E1',
                  color: '#1E293B'
                }}
              >
                {centerTypeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            {/* Quick 1-click pill buttons for instant selection */}
            {centerTypeOptions.length > 0 && !disabled && branch && (
              <div className="d-flex align-items-center gap-1.5 mt-1.5 flex-wrap">
                <span className="text-muted" style={{ fontSize: '10.5px' }}>Choice:</span>
                {centerTypeOptions.map((opt) => {
                  const isSelected = currentCenterType === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => onCenterTypeChange && onCenterTypeChange(opt)}
                      className="btn p-0 px-2 rounded-pill transition-all"
                      style={{
                        fontSize: '11px',
                        lineHeight: '19px',
                        backgroundColor: isSelected ? '#8B1216' : '#F1F5F9',
                        color: isSelected ? '#FFFFFF' : '#475569',
                        border: isSelected ? '1px solid #8B1216' : '1px solid #E2E8F0',
                        fontWeight: isSelected ? 600 : 500,
                        cursor: 'pointer'
                      }}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Session Dropdown (Shown or required for Mangalwar Peth) */}
        {needsSession && (
          <div className={colClass}>
            <label className={labelClass}>
              <Clock size={14} className="text-sa-primary flex-shrink-0" />
              <span>{labels.session || 'Session'}</span>
              {required && <span className="text-danger">*</span>}
            </label>
            <select
              className={`${selectClass} ${needsSession && !session && required ? 'border-warning' : ''} fw-semibold`}
              value={currentSession}
              onChange={(e) => onSessionChange && onSessionChange(e.target.value)}
              disabled={isSessionDisabled}
              required={required && needsSession}
              style={{
                height: size === 'sm' ? '31px' : '38px',
                fontSize: size === 'sm' ? '0.8rem' : '0.875rem',
                backgroundColor: isSessionDisabled ? '#F8FAFC' : '#FFFFFF',
                borderColor: '#CBD5E1',
                color: '#1E293B'
              }}
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
            {/* Quick 1-click pill buttons for session */}
            {!disabled && branch && needsSession && (
              <div className="d-flex align-items-center gap-1.5 mt-1.5 flex-wrap">
                <span className="text-muted" style={{ fontSize: '10.5px' }}>Shift:</span>
                {SESSIONS.map((s) => {
                  const isSelected = currentSession === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => onSessionChange && onSessionChange(s)}
                      className="btn p-0 px-2 rounded-pill transition-all"
                      style={{
                        fontSize: '11px',
                        lineHeight: '19px',
                        backgroundColor: isSelected ? '#8B1216' : '#F1F5F9',
                        color: isSelected ? '#FFFFFF' : '#475569',
                        border: isSelected ? '1px solid #8B1216' : '1px solid #E2E8F0',
                        fontWeight: isSelected ? 600 : 500,
                        cursor: 'pointer'
                      }}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Academic Batch Dropdown */}
        <div className={colClass}>
          <label className={labelClass}>
            <Layers size={14} className="text-sa-primary flex-shrink-0" />
            <span>{labels.batch || 'Academic Batch'}</span>
            {required && <span className="text-danger">*</span>}
          </label>
          <select
            className={`${selectClass} ${!selectedBatch && required ? 'border-warning' : ''} fw-semibold`}
            value={selectedBatch}
            onChange={(e) => {
              const val = e.target.value;
              if (onBatchChange) onBatchChange(val);
              if (onAcademicBatchChange) onAcademicBatchChange(val);
              if (needsSession && !session && onSessionChange) {
                onSessionChange('Morning');
              }
            }}
            disabled={isBatchDisabled}
            required={required}
            style={{
              height: size === 'sm' ? '31px' : '38px',
              fontSize: size === 'sm' ? '0.8rem' : '0.875rem',
              backgroundColor: isBatchDisabled ? '#F8FAFC' : '#FFFFFF',
              borderColor: '#CBD5E1',
              color: '#1E293B'
            }}
          >
            {showAllOption ? (
              <option value="">{allOptionLabel} Academic Batches</option>
            ) : (
              <option value="">
                {!branch ? '-- Select Branch First --' : '-- Choose Academic Batch --'}
              </option>
            )}
            {ACADEMIC_BATCHES.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          {/* Quick 1-click pill buttons for academic batch */}
          {!disabled && branch && (
            <div className="d-flex align-items-center gap-1.5 mt-1.5 flex-wrap">
              <span className="text-muted" style={{ fontSize: '10.5px' }}>Stream:</span>
              {ACADEMIC_BATCHES.map((b) => {
                const isSelected = selectedBatch === b;
                return (
                  <button
                    key={b}
                    type="button"
                    onClick={() => {
                      if (onBatchChange) onBatchChange(b);
                      if (onAcademicBatchChange) onAcademicBatchChange(b);
                      if (needsSession && !session && onSessionChange) {
                        onSessionChange('Morning');
                      }
                    }}
                    className="btn p-0 px-2 rounded-pill transition-all"
                    style={{
                      fontSize: '11px',
                      lineHeight: '19px',
                      backgroundColor: isSelected ? '#8B1216' : '#F1F5F9',
                      color: isSelected ? '#FFFFFF' : '#475569',
                      border: isSelected ? '1px solid #8B1216' : '1px solid #E2E8F0',
                      fontWeight: isSelected ? 600 : 500,
                      cursor: 'pointer'
                    }}
                  >
                    {b}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
