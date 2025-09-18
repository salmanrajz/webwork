import { useEffect, useRef } from 'react';
import { 
  getNextModalZIndex, 
  getModalStyles, 
  preventBodyScroll, 
  restoreBodyScroll,
  handleEscapeKey,
  handleOverlayClick
} from '../utils/modalUtils.js';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className = ''
}) => {
  const modalRef = useRef(null);
  const zIndex = getNextModalZIndex();
  const modalStyles = getModalStyles(zIndex);

  useEffect(() => {
    if (isOpen) {
      preventBodyScroll();
      
      if (closeOnEscape) {
        const handleKeyDown = (event) => handleEscapeKey(event, onClose);
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
      }
    } else {
      restoreBodyScroll();
    }
  }, [isOpen, onClose, closeOnEscape]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4'
  };

  return (
    <div
      ref={modalRef}
      className="modal-overlay"
      style={modalStyles.overlay}
      onClick={closeOnOverlayClick ? (e) => handleOverlayClick(e, onClose) : undefined}
    >
      <div
        className={`modal-content ${sizeClasses[size]} ${className}`}
        style={modalStyles.content}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
              {title}
            </h2>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors duration-200"
                aria-label="Close modal"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
