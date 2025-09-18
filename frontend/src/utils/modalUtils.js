// Modal z-index management utility
let modalZIndex = 1000;

export const getNextModalZIndex = () => {
  modalZIndex += 10;
  return modalZIndex;
};

export const resetModalZIndex = () => {
  modalZIndex = 1000;
};

// Modal overlay styles for different z-index levels
export const getModalOverlayStyles = (zIndex = 1000) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: zIndex,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  backdropFilter: 'blur(4px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1rem'
});

export const getModalContentStyles = (zIndex = 1001) => ({
  position: 'relative',
  zIndex: zIndex,
  backgroundColor: 'white',
  borderRadius: '0.75rem',
  border: '1px solid #e2e8f0',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  maxWidth: '90vw',
  maxHeight: '90vh',
  overflow: 'auto'
});

// Dark mode modal styles
export const getDarkModalOverlayStyles = (zIndex = 1000) => ({
  ...getModalOverlayStyles(zIndex),
  backgroundColor: 'rgba(0, 0, 0, 0.7)'
});

export const getDarkModalContentStyles = (zIndex = 1001) => ({
  ...getModalContentStyles(zIndex),
  backgroundColor: '#1e293b',
  border: '1px solid #334155',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
});

// Check if we're in dark mode
export const isDarkMode = () => {
  return document.documentElement.classList.contains('dark');
};

// Get appropriate modal styles based on theme
export const getModalStyles = (zIndex = 1000) => {
  const isDark = isDarkMode();
  return {
    overlay: isDark ? getDarkModalOverlayStyles(zIndex) : getModalOverlayStyles(zIndex),
    content: isDark ? getDarkModalContentStyles(zIndex + 1) : getModalContentStyles(zIndex + 1)
  };
};

// Prevent body scroll when modal is open
export const preventBodyScroll = () => {
  document.body.style.overflow = 'hidden';
};

export const restoreBodyScroll = () => {
  document.body.style.overflow = 'unset';
};

// Modal stack management
const modalStack = [];

export const pushModal = (modalId) => {
  modalStack.push(modalId);
};

export const popModal = (modalId) => {
  const index = modalStack.indexOf(modalId);
  if (index > -1) {
    modalStack.splice(index, 1);
  }
};

export const getTopModal = () => {
  return modalStack[modalStack.length - 1];
};

export const isModalOnTop = (modalId) => {
  return getTopModal() === modalId;
};

// Close modal on escape key
export const handleEscapeKey = (event, onClose) => {
  if (event.key === 'Escape') {
    onClose();
  }
};

// Close modal on overlay click
export const handleOverlayClick = (event, onClose) => {
  if (event.target === event.currentTarget) {
    onClose();
  }
};
