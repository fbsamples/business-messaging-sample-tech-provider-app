import React, { useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';

interface ErrorToastProps {
  message: string;
  onClose: () => void;
  duration?: number; // Auto-close duration in milliseconds
}

export const ErrorToast: React.FC<ErrorToastProps> = ({
  message,
  onClose,
  duration = 5000
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm text-red-800">
              {message}
            </p>
          </div>
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={onClose}
              className="inline-flex text-red-400 hover:text-red-600 focus:outline-none focus:text-red-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
