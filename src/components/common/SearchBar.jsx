import React from 'react';
import { Search, X } from 'lucide-react';

export default function SearchBar({
  value = '',
  onChange,
  onClear,
  placeholder = 'Search by name, ID, phone or roll number...',
  className = '',
}) {
  return (
    <div className={`position-relative ${className}`} style={{ minWidth: '260px' }}>
      <div
        className="position-absolute top-50 start-0 translate-middle-y ps-3 text-sa-muted pointer-events-none"
        style={{ zIndex: 4 }}
      >
        <Search size={17} />
      </div>
      <input
        type="text"
        className="form-control ps-5 pe-5 py-2"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          type="button"
          className="btn btn-link position-absolute top-50 end-0 translate-middle-y text-sa-muted pe-3 p-0"
          onClick={() => {
            if (onClear) onClear();
            else onChange('');
          }}
          aria-label="Clear search"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
