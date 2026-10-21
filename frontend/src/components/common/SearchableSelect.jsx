import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, Check, ChevronDown } from 'lucide-react';

export default function SearchableSelect({
  label,
  required = false,
  options = [],
  value = '',
  onChange,
  placeholder = '-- Choose from options --',
  searchPlaceholder = 'Type name, roll number, or keywords...',
  id,
  className = '',
  disabled = false,
  error = '',
  helperText = '',
  allowClear = true,
  hasSearchButton = true,
  maxDropdownHeight = '230px'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [committedSearch, setCommittedSearch] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Find currently selected option
  const selectedOption = useMemo(() => {
    return options.find(opt => String(opt.value) === String(value));
  }, [options, value]);

  // Filter options based on searchTerm
  const filteredOptions = useMemo(() => {
    const query = (searchTerm || committedSearch).toLowerCase().trim();
    if (!query) return options;
    return options.filter(opt => {
      const labelMatch = (opt.label || '').toLowerCase().includes(query);
      const sublabelMatch = (opt.sublabel || '').toLowerCase().includes(query);
      const badgeMatch = (opt.badge || '').toLowerCase().includes(query);
      const searchKeywords = (opt.keywords || []).some(kw => String(kw).toLowerCase().includes(query));
      return labelMatch || sublabelMatch || badgeMatch || searchKeywords;
    });
  }, [options, searchTerm, committedSearch]);

  const handleSelect = (option) => {
    if (option.disabled) return;
    onChange(option.value, option);
    setIsOpen(false);
    setSearchTerm('');
    setCommittedSearch('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('', null);
    setSearchTerm('');
    setCommittedSearch('');
  };

  const handleSearchButtonClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCommittedSearch(searchTerm);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      setCommittedSearch(searchTerm);
      if (filteredOptions.length === 1 && !filteredOptions[0].disabled) {
        handleSelect(filteredOptions[0]);
      }
    }
  };

  return (
    <div className={`position-relative ${className}`} ref={containerRef}>
      {label && (
        <div className="d-flex justify-content-between align-items-center mb-1.5">
          <label className="form-label small fw-bold mb-0 text-sa-charcoal" htmlFor={id} style={{ fontSize: '12.5px' }}>
            {label} {required && <span className="text-danger">*</span>}
          </label>
        </div>
      )}

      {/* Trigger Box - Sleek, custom styled without Bootstrap's form-select arrow */}
      <div
        id={id}
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        className={`d-flex align-items-center justify-content-between text-start ${
          disabled ? 'bg-light text-muted cursor-not-allowed' : 'cursor-pointer'
        }`}
        style={{
          minHeight: '44px',
          padding: '8px 14px',
          backgroundColor: disabled ? '#F8FAFC' : '#FFFFFF',
          border: error ? '1.5px solid #EF4444' : isOpen ? '1.5px solid #8B1216' : '1.5px solid #D8DEE4',
          borderRadius: '10px',
          boxShadow: isOpen
            ? '0 0 0 3.5px rgba(139, 18, 22, 0.12)'
            : '0 1px 2px rgba(0, 0, 0, 0.04)',
          transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
          userSelect: 'none'
        }}
        onMouseEnter={(e) => {
          if (!disabled && !isOpen) e.currentTarget.style.borderColor = '#94A3B8';
        }}
        onMouseLeave={(e) => {
          if (!disabled && !isOpen) e.currentTarget.style.borderColor = '#D8DEE4';
        }}
      >
        <div className="d-flex align-items-center gap-2 overflow-hidden flex-grow-1 pe-2">
          {selectedOption ? (
            <div className="d-flex align-items-center gap-2 text-truncate flex-grow-1">
              <span className="fw-semibold text-sa-charcoal text-truncate" style={{ fontSize: '13.5px' }}>
                {selectedOption.label}
              </span>
              {selectedOption.badge && (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 500,
                    backgroundColor: '#F1F5F9',
                    color: '#334155',
                    border: '1px solid #E2E8F0',
                    padding: '1.5px 7px',
                    borderRadius: '6px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {selectedOption.badge}
                </span>
              )}
              {selectedOption.sublabel && (
                <span className="small text-muted text-truncate d-none d-sm-inline" style={{ fontSize: '12px' }}>
                  • {selectedOption.sublabel}
                </span>
              )}
            </div>
          ) : (
            <span style={{ fontSize: '13.5px', color: '#94A3B8' }}>
              {placeholder}
            </span>
          )}
        </div>

        {/* Clean right side actions with only ONE chevron */}
        <div className="d-flex align-items-center gap-2 flex-shrink-0">
          {allowClear && selectedOption && !disabled && (
            <button
              type="button"
              className="btn btn-sm btn-link p-0 text-muted"
              onClick={handleClear}
              title="Clear selection"
              style={{
                lineHeight: 1,
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                backgroundColor: '#F1F5F9',
                border: 'none',
                color: '#64748B',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#FEE2E2';
                e.currentTarget.style.color = '#B91C1C';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#F1F5F9';
                e.currentTarget.style.color = '#64748B';
              }}
            >
              <X size={13} />
            </button>
          )}
          <ChevronDown
            size={17}
            style={{
              color: isOpen ? '#8B1216' : '#64748B',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), color 0.2s ease',
              flexShrink: 0
            }}
          />
        </div>
      </div>

      {/* Dropdown Panel */}
      {isOpen && !disabled && (
        <div
          className="position-absolute start-0 end-0 bg-white"
          style={{
            top: 'calc(100% + 6px)',
            zIndex: 1070,
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 16px 36px -4px rgba(15, 23, 42, 0.16), 0 4px 12px -2px rgba(15, 23, 42, 0.08)',
            overflow: 'hidden'
          }}
        >
          {/* Search Header Container */}
          <div
            style={{
              padding: '10px 12px',
              backgroundColor: '#F8FAFC',
              borderBottom: '1px solid #EDF2F7'
            }}
          >
            {/* Unified Search Input Box - Sleek, no red borders, single integrated control */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#FFFFFF',
                border: isInputFocused ? '1.5px solid #8B1216' : '1.5px solid #CBD5E1',
                borderRadius: '8px',
                padding: '5px 6px 5px 12px',
                boxShadow: isInputFocused ? '0 0 0 3px rgba(139, 18, 22, 0.1)' : '0 1px 2px rgba(0,0,0,0.03)',
                transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
                gap: '8px'
              }}
            >
              <Search size={15} style={{ color: isInputFocused ? '#8B1216' : '#94A3B8', flexShrink: 0 }} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                onKeyDown={handleKeyDown}
                style={{
                  border: 'none',
                  outline: 'none',
                  boxShadow: 'none',
                  padding: '0',
                  fontSize: '13px',
                  color: '#1E293B',
                  backgroundColor: 'transparent',
                  width: '100%',
                  minWidth: 0
                }}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setCommittedSearch('');
                    searchInputRef.current?.focus();
                  }}
                  title="Clear search"
                  style={{
                    border: 'none',
                    background: '#F1F5F9',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#64748B',
                    cursor: 'pointer',
                    flexShrink: 0,
                    padding: 0
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#E2E8F0';
                    e.currentTarget.style.color = '#1E293B';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#F1F5F9';
                    e.currentTarget.style.color = '#64748B';
                  }}
                >
                  <X size={12} />
                </button>
              )}
              {hasSearchButton && (
                <button
                  type="button"
                  onClick={handleSearchButtonClick}
                  style={{
                    background: 'linear-gradient(135deg, #8B1216 0%, #A3191E 100%)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '5px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(139, 18, 22, 0.25)',
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                    transition: 'opacity 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.92'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  <Search size={12} />
                  <span>Search</span>
                </button>
              )}
            </div>

            {/* Sub-header status text */}
            <div className="d-flex justify-content-between align-items-center mt-2 px-1">
              <span style={{ fontSize: '11.5px', color: '#64748B' }}>
                {searchTerm ? (
                  <>Found <strong>{filteredOptions.length}</strong> {filteredOptions.length === 1 ? 'match' : 'matches'} for &quot;{searchTerm}&quot;</>
                ) : (
                  <>Showing <strong>{filteredOptions.length}</strong> {filteredOptions.length === 1 ? 'option' : 'options'}</>
                )}
              </span>
              {searchTerm && (
                <button
                  type="button"
                  className="btn btn-link p-0 text-decoration-none small"
                  style={{ fontSize: '11.5px', color: '#8B1216', fontWeight: 500 }}
                  onClick={() => {
                    setSearchTerm('');
                    setCommittedSearch('');
                  }}
                >
                  Clear filter
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div
            className="overflow-y-auto"
            style={{
              maxHeight: maxDropdownHeight,
              padding: '6px',
              scrollbarWidth: 'thin'
            }}
          >
            {filteredOptions.length === 0 ? (
              <div className="text-center py-4 px-3" style={{ color: '#64748B' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    backgroundColor: '#F1F5F9',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '8px',
                    color: '#94A3B8'
                  }}
                >
                  <Search size={18} />
                </div>
                <div className="fw-semibold text-sa-charcoal" style={{ fontSize: '13px' }}>No options found</div>
                <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>
                  Try different search keywords
                </div>
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <div
                    key={opt.value}
                    onClick={() => handleSelect(opt)}
                    className="d-flex align-items-center justify-content-between"
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      marginBottom: '3px',
                      cursor: opt.disabled ? 'not-allowed' : 'pointer',
                      opacity: opt.disabled ? 0.5 : 1,
                      backgroundColor: isSelected ? '#FEF2F2' : 'transparent',
                      borderLeft: isSelected ? '3.5px solid #8B1216' : '3.5px solid transparent',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected && !opt.disabled) e.currentTarget.style.backgroundColor = '#F8FAFC';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected && !opt.disabled) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div className="d-flex align-items-center gap-2.5 overflow-hidden me-2">
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: isSelected ? '#8B1216' : '#F1F5F9',
                          color: isSelected ? '#FFFFFF' : '#64748B',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: 700,
                          flexShrink: 0
                        }}
                      >
                        {opt.label ? opt.label.charAt(0).toUpperCase() : '•'}
                      </div>
                      <div className="d-flex flex-column overflow-hidden">
                        <div className="d-flex align-items-center gap-1.5 flex-wrap">
                          <span
                            style={{
                              fontSize: '13px',
                              fontWeight: isSelected ? 700 : 600,
                              color: isSelected ? '#8B1216' : '#1E293B'
                            }}
                          >
                            {opt.label}
                          </span>
                          {opt.badge && (
                            <span
                              style={{
                                fontSize: '10.5px',
                                fontWeight: 500,
                                backgroundColor: isSelected ? '#FEE2E2' : '#F1F5F9',
                                color: isSelected ? '#8B1216' : '#475569',
                                border: isSelected ? '1px solid #FECACA' : '1px solid #E2E8F0',
                                padding: '1px 6px',
                                borderRadius: '4px'
                              }}
                            >
                              {opt.badge}
                            </span>
                          )}
                          {opt.stockBadge && (
                            <span
                              className={`badge px-1.5 py-0.5 ${opt.stockBadgeColor || 'bg-success-subtle text-success border border-success-subtle'}`}
                              style={{ fontSize: '10px' }}
                            >
                              {opt.stockBadge}
                            </span>
                          )}
                        </div>
                        {opt.sublabel && (
                          <span className="text-truncate mt-0.5" style={{ fontSize: '11.5px', color: '#64748B' }}>
                            {opt.sublabel}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex-shrink-0 ms-2">
                      {isSelected ? (
                        <div
                          style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            backgroundColor: '#8B1216',
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Check size={11} strokeWidth={3} />
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {error && <div className="invalid-feedback d-block text-xs mt-1">{error}</div>}
      {helperText && <div className="small text-muted mt-1" style={{ fontSize: '11.5px' }}>{helperText}</div>}
    </div>
  );
}
