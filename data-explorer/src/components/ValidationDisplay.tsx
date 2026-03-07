import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ValidationDisplayProps {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  isValidating?: boolean;
  className?: string;
  onRetry?: () => void;
}

export function ValidationDisplay({
  isValid,
  errors,
  warnings,
  isValidating = false,
  className,
  onRetry
}: ValidationDisplayProps) {
  if (isValidating) {
    return (
      <div className={cn('flex items-center space-x-2 text-sm text-gray-600', className)}>
        <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div>
        <span>Validating file...</span>
      </div>
    );
  }

  if (isValid) {
    if (warnings.length > 0) {
      return (
        <div className={cn('bg-yellow-50 border border-yellow-200 rounded-md p-3', className)}>
          <div className="flex items-start space-x-2">
            <div className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-800">File validation completed with warnings</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc list-inside space-y-1">
                  {warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={cn('flex items-center space-x-2 text-sm text-green-600', className)}>
        <div className="w-5 h-5">
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
        <span>File validated successfully</span>
      </div>
    );
  }

  return (
    <div className={cn('bg-red-50 border border-red-200 rounded-md p-3', className)}>
      <div className="flex items-start space-x-2">
        <div className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5">
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800">File validation failed</h3>
          <div className="mt-2 text-sm text-red-700">
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
          {onRetry && (
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="text-red-700 border-red-300 hover:bg-red-100"
              >
                Try Again
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}