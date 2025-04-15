import React from "react";

interface ErrorNotificationProps {
  message: string;
  type?: "error" | "warning" | "info";
  isVisible: boolean;
  onClose?: () => void;
}

const ErrorNotification: React.FC<ErrorNotificationProps> = ({ message, type = "error", isVisible, onClose }) => {
  if (!isVisible) return null;

  const bgColor = {
    error: "bg-red-50 border-red-300 text-red-700",
    warning: "bg-yellow-50 border-yellow-300 text-yellow-700",
    info: "bg-blue-50 border-blue-300 text-blue-700",
  }[type];

  const iconColor = {
    error: "text-red-400",
    warning: "text-yellow-400",
    info: "text-blue-400",
  }[type];

  return (
    <div className={`p-4 mb-4 border rounded-lg ${bgColor}`} role="alert">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {type === "error" && (
            <svg
              className={`w-5 h-5 ${iconColor}`}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          )}
          {type === "warning" && (
            <svg
              className={`w-5 h-5 ${iconColor}`}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          )}
          {type === "info" && (
            <svg
              className={`w-5 h-5 ${iconColor}`}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium">{message}</p>
        </div>
        {onClose && (
          <button
            type="button"
            className={`ml-auto -mx-1.5 -my-1.5 rounded-lg focus:ring-2 focus:ring-opacity-50 p-1.5 inline-flex items-center justify-center h-8 w-8 ${iconColor} hover:bg-opacity-10`}
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

export default ErrorNotification;
