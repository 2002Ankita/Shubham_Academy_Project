import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md', // 'sm', 'md', 'lg', 'xl'
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getSizeClass = () => {
    switch (size) {
      case 'sm': return 'modal-sm';
      case 'lg': return 'modal-lg';
      case 'xl': return 'modal-xl';
      default: return '';
    }
  };

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      style={{ backgroundColor: 'rgba(37, 37, 37, 0.65)', backdropFilter: 'blur(3px)', zIndex: 1060 }}
    >
      <div className={`modal-dialog modal-dialog-centered ${getSizeClass()}`}>
        <div className="modal-content sa-card border-0 shadow-lg">
          <div className="modal-header border-bottom py-3 px-4 d-flex align-items-center justify-content-between">
            <h5 className="modal-title fw-bold text-sa-charcoal brand-font m-0">{title}</h5>
            <button
              type="button"
              className="btn btn-sm btn-light rounded-circle p-1 d-flex align-items-center justify-content-center"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
          <div className="modal-body p-4">{children}</div>
          {footer && <div className="modal-footer border-top px-4 py-3 bg-light rounded-bottom">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
