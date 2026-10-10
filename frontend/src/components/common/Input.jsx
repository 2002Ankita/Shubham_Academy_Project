import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

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
  const [showPassword, setShowPassword] = useState(false);
  const inputProps = register ? register(name) : { name, value, onChange };
  
  const isPassword = type === 'password';
  const currentType = isPassword ? (showPassword ? 'text' : 'password') : type;

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
          type={currentType}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`form-control ${Icon ? 'ps-5' : ''} ${error ? 'is-invalid' : ''}`}
          style={isPassword ? { paddingRight: '2.5rem' } : undefined}
          {...inputProps}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            className="position-absolute top-50 end-0 translate-middle-y border-0 bg-transparent text-sa-muted px-3"
            onClick={(e) => {
              e.preventDefault();
              setShowPassword(prev => !prev);
            }}
            tabIndex={-1}
            style={{ zIndex: 5, cursor: 'pointer', outline: 'none' }}
            title={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && <div className="invalid-feedback d-block text-xs mt-1">{error}</div>}
      {helperText && !error && <div className="form-text text-xs mt-1 text-sa-muted">{helperText}</div>}
    </div>
  );
}
