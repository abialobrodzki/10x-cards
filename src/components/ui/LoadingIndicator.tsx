import React from "react";

interface LoadingIndicatorProps {
  isVisible: boolean;
  message?: string;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ isVisible, message = "Ładowanie..." }) => {
  if (!isVisible) return null;

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative w-12 h-12">
        <div className="absolute top-0 left-0 w-full h-full border-4 border-gray-200 rounded-full"></div>
        <div className="absolute top-0 left-0 w-full h-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
      </div>
      {message && <p className="mt-3 text-sm text-center text-gray-600">{message}</p>}
    </div>
  );
};

export default LoadingIndicator;
