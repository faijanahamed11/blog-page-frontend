import React, { useEffect } from 'react';

const DeleteModal = ({ isOpen, onClose, onConfirm, title, message, loading = false }) => {
  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed top-0 left-0 w-screen h-screen z-50 flex items-center justify-center animate-fadeIn" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-90 max-h-90 overflow-hidden animate-slideIn relative z-50 m-5" onClick={(e) => e.stopPropagation()}>
        <div className="p-0">
          {/* Header */}
          <div className="flex items-center gap-3 px-6 py-6 pb-4 border-b border-gray-200">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-50 text-red-500">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#e74c3c"/>
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-800 m-0">{title}</h2>
          </div>

          {/* Body */}
          <div className="px-6 py-5">
            <p className="text-base text-gray-800 m-0 mb-3 leading-relaxed">{message}</p>
            <p className="text-sm text-gray-500 m-0 italic">
              This action cannot be undone.
            </p>
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-6 py-4 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-300 text-gray-800 border-none rounded cursor-pointer text-sm font-semibold transition-all duration-200 ease-out flex items-center justify-center gap-2 hover:bg-gray-400 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-3 bg-red-500 text-white border-none rounded cursor-pointer text-sm font-semibold transition-all duration-200 ease-out flex items-center justify-center gap-2 hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="31.416" strokeDashoffset="31.416">
                      <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
                      <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
                    </circle>
                  </svg>
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;
