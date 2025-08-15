import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorDisplayProps {
  error: string;
  onDismiss?: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onDismiss }) => {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50 p-8">
      <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <AlertCircle className="text-red-500 flex-shrink-0" size={24} />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-red-400 hover:text-red-600 transition-colors"
              aria-label="Dismiss error"
            >
              ×
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
