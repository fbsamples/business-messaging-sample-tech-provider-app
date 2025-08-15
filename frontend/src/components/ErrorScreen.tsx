import React from 'react';
import { ErrorDisplay } from './ErrorDisplay';

interface ErrorScreenProps {
  error: string;
  onRetry?: () => void;
}

export const ErrorScreen: React.FC<ErrorScreenProps> = ({ error, onRetry }) => {
  return (
    <div className="h-screen flex bg-gray-100">
      <ErrorDisplay
        error={error}
        onDismiss={onRetry}
      />
    </div>
  );
};
