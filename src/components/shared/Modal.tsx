import React, { Fragment, useEffect, useState } from 'react';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle, Minimize2, Maximize2 } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  showClose?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;
  showFooter?: boolean;
  footerContent?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  isLoading?: boolean;
  isDestructive?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  variant = 'default',
  showClose = true,
  closeOnBackdrop = true,
  closeOnEsc = true,
  showFooter = false,
  footerContent,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isLoading = false,
  isDestructive = false,
}: ModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (closeOnEsc && e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [closeOnEsc, isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      handleClose();
    }
  };

  const getVariantColors = () => {
    switch (variant) {
      case 'success':
        return {
          icon: CheckCircle,
          color: 'text-green-600 dark:text-green-400',
          bg: 'bg-green-50 dark:bg-green-950/20',
          border: 'border-green-200 dark:border-green-800',
          button: 'bg-green-600 hover:bg-green-700'
        };
      case 'error':
        return {
          icon: AlertCircle,
          color: 'text-red-600 dark:text-red-400',
          bg: 'bg-red-50 dark:bg-red-950/20',
          border: 'border-red-200 dark:border-red-800',
          button: 'bg-red-600 hover:bg-red-700'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          color: 'text-amber-600 dark:text-amber-400',
          bg: 'bg-amber-50 dark:bg-amber-950/20',
          border: 'border-amber-200 dark:border-amber-800',
          button: 'bg-amber-600 hover:bg-amber-700'
        };
      case 'info':
        return {
          icon: Info,
          color: 'text-blue-600 dark:text-blue-400',
          bg: 'bg-blue-50 dark:bg-blue-950/20',
          border: 'border-blue-200 dark:border-blue-800',
          button: 'bg-blue-600 hover:bg-blue-700'
        };
      default:
        return {
          icon: null,
          color: '',
          bg: '',
          border: '',
          button: 'bg-indigo-600 hover:bg-indigo-700'
        };
    }
  };

  const variantStyles = getVariantColors();
  const IconComponent = variantStyles.icon;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
    full: 'max-w-[90vw] max-h-[90vh]',
  };

  if (!isOpen) return null;

  return (
    <Fragment>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isClosing ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={handleBackdropClick}
      />
      
      {/* Modal Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className={`relative w-full ${isFullscreen ? 'max-w-[95vw] max-h-[95vh]' : sizeClasses[size]} 
            bg-white dark:bg-slate-800 rounded-2xl shadow-2xl transform transition-all duration-300
            ${isClosing ? 'animate-slide-down opacity-0 scale-95' : 'animate-slide-up opacity-100 scale-100'}
            ${variant !== 'default' ? variantStyles.border : 'border border-slate-200 dark:border-slate-700'}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          {(title || showClose || variant !== 'default') && (
            <div className={`flex items-center justify-between p-5 border-b ${
              variant !== 'default' 
                ? variantStyles.bg + ' border-' + variantStyles.border
                : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50'
            } rounded-t-2xl`}>
              <div className="flex items-center gap-3">
                {IconComponent && (
                  <div className={`p-1.5 rounded-lg ${variantStyles.bg}`}>
                    <IconComponent className={`w-5 h-5 ${variantStyles.color}`} />
                  </div>
                )}
                {title && (
                  <h3 className={`text-lg font-semibold ${
                    variant !== 'default' ? variantStyles.color : 'text-slate-900 dark:text-white'
                  }`}>
                    {title}
                  </h3>
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* Fullscreen Toggle */}
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                
                {/* Close Button */}
                {showClose && (
                  <button
                    onClick={handleClose}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors hover:rotate-90 transform duration-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          )}
          
          {/* Content */}
          <div className={`p-6 ${isFullscreen ? 'overflow-y-auto max-h-[calc(95vh-130px)]' : ''}`}>
            {children}
          </div>
          
          {/* Footer */}
          {(showFooter || onConfirm) && (
            <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-b-2xl">
              {footerContent ? (
                footerContent
              ) : (
                <>
                  {onCancel && (
                    <button
                      onClick={onCancel}
                      disabled={isLoading}
                      className="px-4 py-2 rounded-xl text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors font-medium disabled:opacity-50"
                    >
                      {cancelText}
                    </button>
                  )}
                  {onConfirm && (
                    <button
                      onClick={onConfirm}
                      disabled={isLoading}
                      className={`px-4 py-2 rounded-xl text-white transition-colors font-medium disabled:opacity-50 ${
                        isDestructive 
                          ? 'bg-red-600 hover:bg-red-700' 
                          : variantStyles.button || 'bg-indigo-600 hover:bg-indigo-700'
                      }`}
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Loading...
                        </span>
                      ) : (
                        confirmText
                      )}
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes slide-down {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
    </Fragment>
  );
}

// Confirmation Modal Helper
interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger' | 'warning';
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  isLoading = false,
}: ConfirmModalProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: AlertCircle,
          color: 'text-red-600 dark:text-red-400',
          bg: 'bg-red-50 dark:bg-red-950/20',
          button: 'bg-red-600 hover:bg-red-700'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          color: 'text-amber-600 dark:text-amber-400',
          bg: 'bg-amber-50 dark:bg-amber-950/20',
          button: 'bg-amber-600 hover:bg-amber-700'
        };
      default:
        return {
          icon: Info,
          color: 'text-blue-600 dark:text-blue-400',
          bg: 'bg-blue-50 dark:bg-blue-950/20',
          button: 'bg-blue-600 hover:bg-blue-700'
        };
    }
  };

  const styles = getVariantStyles();
  const IconComponent = styles.icon;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      showClose={false}
      showFooter={true}
      confirmText={confirmText}
      cancelText={cancelText}
      onConfirm={onConfirm}
      onCancel={onClose}
      isLoading={isLoading}
      isDestructive={variant === 'danger'}
    >
      <div className="text-center">
        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${styles.bg} mb-4`}>
          <IconComponent className={`w-6 h-6 ${styles.color}`} />
        </div>
        <p className="text-slate-600 dark:text-slate-400">
          {message}
        </p>
      </div>
    </Modal>
  );
}

// Alert Modal Helper
interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  variant?: 'success' | 'error' | 'warning' | 'info';
}

export function AlertModal({
  isOpen,
  onClose,
  title,
  message,
  variant = 'info',
}: AlertModalProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          icon: CheckCircle,
          color: 'text-green-600 dark:text-green-400',
          bg: 'bg-green-50 dark:bg-green-950/20',
        };
      case 'error':
        return {
          icon: AlertCircle,
          color: 'text-red-600 dark:text-red-400',
          bg: 'bg-red-50 dark:bg-red-950/20',
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          color: 'text-amber-600 dark:text-amber-400',
          bg: 'bg-amber-50 dark:bg-amber-950/20',
        };
      default:
        return {
          icon: Info,
          color: 'text-blue-600 dark:text-blue-400',
          bg: 'bg-blue-50 dark:bg-blue-950/20',
        };
    }
  };

  const styles = getVariantStyles();
  const IconComponent = styles.icon;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      showClose={true}
      variant={variant}
    >
      <div className="text-center">
        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${styles.bg} mb-4`}>
          <IconComponent className={`w-6 h-6 ${styles.color}`} />
        </div>
        <p className="text-slate-600 dark:text-slate-400">
          {message}
        </p>
      </div>
    </Modal>
  );
}

// Drawer Modal (Side Panel)
interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  position?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg';
}

export function Drawer({
  isOpen,
  onClose,
  title,
  children,
  position = 'right',
  size = 'md',
}: DrawerProps) {
  const sizeClasses = {
    sm: 'w-80',
    md: 'w-96',
    lg: 'w-[30rem]',
  };

  const positionClasses = {
    left: 'left-0 transform -translate-x-full',
    right: 'right-0 transform translate-x-full',
  };

  const positionActiveClasses = {
    left: 'translate-x-0',
    right: 'translate-x-0',
  };

  return (
    <Fragment>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity animate-fade-in"
          onClick={onClose}
        />
      )}
      
      {/* Drawer */}
      <div
        className={`fixed top-0 ${position === 'left' ? 'left-0' : 'right-0'} z-50 h-full 
          ${sizeClasses[size]} bg-white dark:bg-slate-800 shadow-2xl transition-transform duration-300 ease-in-out
          ${isOpen ? positionActiveClasses[position] : positionClasses[position]}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto h-[calc(100%-70px)]">
          {children}
        </div>
      </div>
    </Fragment>
  );
}