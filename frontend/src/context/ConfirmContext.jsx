import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import ConfirmModal from '../components/common/ConfirmModal';

const ConfirmContext = createContext(null);

export const ConfirmProvider = ({ children }) => {
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    title: 'Confirm Action',
    message: '',
    subtitle: 'This action cannot be undone.',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: 'danger' // 'danger' | 'warning' | 'info'
  });

  const resolverRef = useRef(null);

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      if (typeof options === 'string') {
        setDialogState({
          isOpen: true,
          title: 'Confirm Action',
          message: options,
          subtitle: 'This action cannot be undone.',
          confirmText: 'Confirm',
          cancelText: 'Cancel',
          type: 'danger'
        });
      } else {
        setDialogState({
          isOpen: true,
          title: options.title || 'Confirm Action',
          message: options.message || 'Are you sure you want to proceed?',
          subtitle: options.subtitle !== undefined ? options.subtitle : 'This action cannot be undone.',
          confirmText: options.confirmText || 'Confirm',
          cancelText: options.cancelText || 'Cancel',
          type: options.type || 'danger'
        });
      }
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setDialogState(prev => ({ ...prev, isOpen: false }));
    if (resolverRef.current) {
      resolverRef.current(true);
      resolverRef.current = null;
    }
  }, []);

  const handleCancel = useCallback(() => {
    setDialogState(prev => ({ ...prev, isOpen: false }));
    if (resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }
  }, []);

  // Expose globally for convenience
  if (typeof window !== 'undefined') {
    window.confirmDialog = confirm;
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <ConfirmModal
        isOpen={dialogState.isOpen}
        title={dialogState.title}
        message={dialogState.message}
        subtitle={dialogState.subtitle}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        type={dialogState.type}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
};

export default ConfirmContext;
