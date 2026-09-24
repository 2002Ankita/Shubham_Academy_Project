import React from 'react';

export default function Button({
  children,
  type = 'button',
  variant = 'primary', // 'primary', 'outline', 'mustard', 'secondary', 'danger', 'light'
  size = 'md',
  onClick,
  disabled = false,
  loading = false,
  icon: Icon,
  className = '',
  ...props
}) {
  const getVariantClass = () => {
    switch (variant) {
      case 'primary': return 'btn-sa-primary';
      case 'outline': return 'btn-sa-outline';
      case 'mustard': return 'btn-sa-mustard';
      case 'secondary': return 'btn btn-secondary';
      case 'danger': return 'btn btn-outline-danger';
      case 'light': return 'btn btn-light border';
      default: return 'btn-sa-primary';
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case 'sm': return 'btn-sm py-1 px-2 text-sm';
      case 'lg': return 'btn-lg py-3 px-4';
      default: return '';
    }
  };

  return (
    <button
      type={type}
      className={`${getVariantClass()} ${getSizeClass()} ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" />
      ) : Icon ? (
        <Icon size={18} className="flex-shrink-0" />
      ) : null}
      {children}
    </button>
  );
}
