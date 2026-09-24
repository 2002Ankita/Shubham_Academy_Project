import React from 'react';

export default function Select({
  label,
  name,
  options = [],
  value,
  onChange,
  error,
  placeholder = 'Select an option',
  required = false,
  disabled = false,
  className = '',
  register,
  ...props
}) {
  const selectProps = register ? register(name) : { name, value, onChange };

  return (
    <div className={`mb-3 ${className}`}>
      {label && (
        <label htmlFor={name} className="form-label">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}
      <select
        id={name}
        disabled={disabled}
        className={`form-select ${error ? 'is-invalid' : ''}`}
        {...selectProps}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt, idx) => {
          const val = typeof opt === 'object' ? opt.value : opt;
          const labelText = typeof opt === 'object' ? opt.label : opt;
          return (
            <option key={idx} value={val}>
              {labelText}
            </option>
          );
        })}
      </select>
      {error && <div className="invalid-feedback d-block text-xs mt-1">{error}</div>}
    </div>
  );
}
