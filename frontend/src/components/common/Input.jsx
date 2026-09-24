import React from 'react';

export default function Input({
  label,
  name,
  type = 'text',
  placeholder = '',
  value,
  onChange,
  error,
  helperText,
  icon: Icon,
  required = false,
  disabled = false,
  className = '',
  register,
  ...props
}) {
  const inputProps = register ? register(name) : { name, value, onChange };

  return (
    <div className={`mb-3 ${className}`}>
      {label && (
        <label htmlFor={name} className="form-label d-flex justify-content-between">
          <span>
            {label} {required && <span className="text-danger">*</span>}
          </span>
        </label>
      )}
      <div className="position-relative">
        {Icon && (
          <div
            className="position-absolute top-50 start-0 translate-middle-y ps-3 text-sa-muted pointer-events-none"
            style={{ zIndex: 4 }}
          >
            <Icon size={18} />
          </div>
        )}
        <input
          id={name}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          className={`form-control ${Icon ? 'ps-5' : ''} ${error ? 'is-invalid' : ''}`}
          {...inputProps}
          {...props}
        />
      </div>
      {error && <div className="invalid-feedback d-block text-xs mt-1">{error}</div>}
      {helperText && !error && <div className="form-text text-xs mt-1 text-sa-muted">{helperText}</div>}
    </div>
  );
}
