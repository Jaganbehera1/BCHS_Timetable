import React, { Fragment } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showClose?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showClose = true,
}: ModalProps) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  };

  return (
    <Fragment>
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className={`relative w-full ${sizeClasses[size]} bg-white dark:bg-slate-800 rounded-2xl shadow-2xl transform transition-all animate-slide-up`}
          onClick={(e) => e.stopPropagation()}
        >
          {(title || showClose) && (
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              {title && (
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {title}
                </h3>
              )}
              {showClose && (
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          )}
          <div className="p-4">{children}</div>
        </div>
      </div>
    </Fragment>
  );
}
