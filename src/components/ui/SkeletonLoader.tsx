import React from "react";

interface SkeletonLoaderProps {
  isVisible: boolean;
  count?: number;
  className?: string;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ isVisible, count = 3, className = "" }) => {
  if (!isVisible) return null;

  return (
    <div className={`space-y-4 ${className}`}>
      {[...Array(count)].map((_, index) => (
        <div
          key={index}
          className="border rounded-lg shadow-sm p-4 animate-pulse"
          role="generic"
          aria-label="skeleton item"
        >
          <div className="flex flex-col md:flex-row md:gap-6">
            <div className="flex-1 space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
            <div className="flex-1 space-y-4 mt-4 md:mt-0">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
            <div className="flex items-center justify-end space-x-2 mt-4 md:mt-0">
              <div className="h-8 bg-gray-200 rounded w-8"></div>
              <div className="h-8 bg-gray-200 rounded w-8"></div>
              <div className="h-8 bg-gray-200 rounded w-8"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SkeletonLoader;
