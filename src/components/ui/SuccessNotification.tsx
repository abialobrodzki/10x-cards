import React, { useEffect } from "react";

interface SuccessNotificationProps {
  message: string;
  isVisible: boolean;
  autoHideDuration?: number;
  onClose?: () => void;
}

const SuccessNotification: React.FC<SuccessNotificationProps> = ({
  message,
  isVisible,
  autoHideDuration = 0,
  onClose,
}) => {
  useEffect(() => {
    if (isVisible && autoHideDuration > 0 && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoHideDuration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, autoHideDuration, onClose]);

  if (!isVisible) return null;

  return (
    <div className="p-4 mb-4 border rounded-lg bg-green-50 border-green-300 text-green-700" role="alert">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="w-5 h-5 text-green-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium">{message}</p>
        </div>
        {onClose && (
          <button
            type="button"
            className="ml-auto -mx-1.5 -my-1.5 rounded-lg focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 p-1.5 inline-flex items-center justify-center h-8 w-8 text-green-400 hover:bg-green-100"
            aria-label="Close"
            onClick={onClose}
          >
            <span className="sr-only">Zamknij</span>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              ></path>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default SuccessNotification;
