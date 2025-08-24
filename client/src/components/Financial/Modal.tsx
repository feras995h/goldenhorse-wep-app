import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  footer?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  footer
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return (
    <div className="modal-overlay">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`modal-content ${sizeClasses[size]} fade-in`}>
        {/* Header */}
        <div className="modal-header">
          <h3 className="text-subheading">{title}</h3>
          <button
            onClick={onClose}
            className="text-dark-400 hover:text-dark-600 transition-colors p-1 rounded-lg hover:bg-golden-100"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {/* Content */}
        <div className="modal-body">
          {children}
        </div>
        
        {/* Footer */}
        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
