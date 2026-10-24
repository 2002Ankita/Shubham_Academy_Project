import React, { useEffect } from 'react';
import { Trash2, AlertTriangle, AlertCircle, Info, X, ShieldCheck, CheckCircle2, LogOut } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  subtitle = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger', // 'danger' | 'warning' | 'info' | 'success' | 'logout'
  customIcon,
  onConfirm,
  onCancel
}) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel?.();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onConfirm?.();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onConfirm, onCancel]);

  if (!isOpen) return null;

  // Icon & Theme Styling based on type
  const getTheme = () => {
    switch (type) {
      case 'logout':
        return {
          icon: <LogOut size={28} strokeWidth={2.2} />,
          iconBg: '#FEE2E2',
          iconColor: '#DC2626',
          iconBorder: '#FECACA',
          confirmBtnBg: '#8B1216', // Shubham Academy signature crimson/maroon
          confirmBtnHover: '#730E12',
          confirmShadow: 'rgba(139, 18, 22, 0.3)'
        };
      case 'success':
        return {
          icon: <ShieldCheck size={28} strokeWidth={2.2} />,
          iconBg: '#DCFCE7',
          iconColor: '#16A34A',
          iconBorder: '#BBF7D0',
          confirmBtnBg: '#16A34A',
          confirmBtnHover: '#15803D',
          confirmShadow: 'rgba(22, 163, 74, 0.25)'
        };
      case 'warning':
        return {
          icon: <AlertCircle size={28} strokeWidth={2.2} />,
          iconBg: '#FEF3C7',
          iconColor: '#D97706',
          iconBorder: '#FDE68A',
          confirmBtnBg: '#D97706',
          confirmBtnHover: '#B45309',
          confirmShadow: 'rgba(217, 119, 6, 0.25)'
        };
      case 'info':
        return {
          icon: <Info size={28} strokeWidth={2.2} />,
          iconBg: '#DBEAFE',
          iconColor: '#2563EB',
          iconBorder: '#BFDBFE',
          confirmBtnBg: '#2563EB',
          confirmBtnHover: '#1D4ED8',
          confirmShadow: 'rgba(37, 99, 235, 0.25)'
        };
      case 'danger':
      default:
        return {
          icon: <Trash2 size={28} strokeWidth={2.2} />,
          iconBg: '#FEE2E2',
          iconColor: '#DC2626',
          iconBorder: '#FECACA',
          confirmBtnBg: '#8B1216', // Shubham Academy signature crimson/maroon
          confirmBtnHover: '#730E12',
          confirmShadow: 'rgba(139, 18, 22, 0.3)'
        };
    }
  };

  const theme = getTheme();

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        padding: '16px',
        animation: 'saFadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel?.();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        style={{
          width: '100%',
          maxWidth: '430px',
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35), 0 0 0 1px rgba(226, 232, 240, 0.9)',
          padding: '28px 24px',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          animation: 'saScaleIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onCancel}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: '#F1F5F9',
            color: '#64748B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#E2E8F0';
            e.currentTarget.style.color = '#0F172A';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#F1F5F9';
            e.currentTarget.style.color = '#64748B';
          }}
          aria-label="Close"
        >
          <X size={16} />
        </button>

        {/* Top Icon Badge */}
        <div
          style={{
            width: '58px',
            height: '58px',
            borderRadius: '50%',
            backgroundColor: theme.iconBg,
            color: theme.iconColor,
            border: `4px solid ${theme.iconBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.04)'
          }}
        >
          {customIcon || theme.icon}
        </div>

        {/* Title */}
        <h4
          style={{
            fontSize: '18.5px',
            fontWeight: 700,
            color: '#0F172A',
            margin: '0 0 8px 0',
            fontFamily: 'Outfit, sans-serif',
            letterSpacing: '-0.01em',
            lineHeight: 1.3
          }}
        >
          {title}
        </h4>

        {/* Message */}
        <p
          style={{
            fontSize: '14px',
            color: '#475569',
            lineHeight: 1.5,
            margin: '0 0 4px 0',
            wordBreak: 'break-word',
            padding: '0 6px'
          }}
        >
          {message}
        </p>

        {/* Subtitle / Notice */}
        {subtitle && (
          <span
            style={{
              fontSize: '12px',
              color: '#94A3B8',
              display: 'block',
              marginBottom: '22px'
            }}
          >
            {subtitle}
          </span>
        )}

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            width: '100%',
            marginTop: subtitle ? '0' : '18px'
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            style={{
              flex: 1,
              height: '42px',
              borderRadius: '10px',
              border: '1px solid #CBD5E1',
              backgroundColor: '#FFFFFF',
              color: '#334155',
              fontSize: '13.5px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F8FAFC';
              e.currentTarget.style.borderColor = '#94A3B8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#FFFFFF';
              e.currentTarget.style.borderColor = '#CBD5E1';
            }}
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            autoFocus
            style={{
              flex: 1,
              height: '42px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: theme.confirmBtnBg,
              color: '#FFFFFF',
              fontSize: '13.5px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: `0 4px 12px ${theme.confirmShadow}`,
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.confirmBtnHover;
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme.confirmBtnBg;
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes saFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes saScaleIn {
          from {
            opacity: 0;
            transform: scale(0.92);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
