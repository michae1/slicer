import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressIndicatorProps {
  isProcessing: boolean;
  progress?: number;
  stage?: string;
  message?: string;
  error?: string;
  className?: string;
}

export function ProgressIndicator({
  isProcessing,
  progress,
  stage = 'Processing...',
  message,
  error,
  className
}: ProgressIndicatorProps) {
  if (!isProcessing && !error) {
    return null;
  }

  return (
    <div className={cn('bg-white rounded-lg border shadow-sm p-6', className)}>
      {error ? (
        // Error state
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 text-red-500">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-red-900 mb-2">Processing Failed</h3>
          <p className="text-red-700">{error}</p>
        </div>
      ) : (
        // Processing state
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4">
            <div className="animate-spin w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">{stage}</h3>
          
          {message && (
            <p className="text-gray-600 mb-4">{message}</p>
          )}
          
          {progress !== undefined && (
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              ></div>
            </div>
          )}
          
          {progress !== undefined && (
            <p className="text-sm text-gray-500">{Math.round(progress)}% complete</p>
          )}
          
          <div className="mt-4 text-xs text-gray-400">
            <p>• Parsing file format</p>
            <p>• Inferring schema</p>
            <p>• Loading data into database</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Hook for managing progress state
interface UseProgressStateReturn {
  progress: number;
  stage: string;
  message: string;
  isProcessing: boolean;
  error: string | null;
  startProcessing: (stage: string) => void;
  updateProgress: (progress: number, message?: string) => void;
  completeProcessing: () => void;
  setError: (error: string) => void;
  reset: () => void;
}

export function useProgressState(): UseProgressStateReturn {
  const [progress, setProgress] = React.useState(0);
  const [stage, setStage] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const startProcessing = React.useCallback((initialStage: string) => {
    setStage(initialStage);
    setProgress(0);
    setMessage('');
    setIsProcessing(true);
    setError(null);
  }, []);

  const updateProgress = React.useCallback((newProgress: number, newMessage?: string) => {
    setProgress(newProgress);
    if (newMessage) {
      setMessage(newMessage);
    }
  }, []);

  const completeProcessing = React.useCallback(() => {
    setProgress(100);
    setMessage('Complete!');
    setTimeout(() => {
      setIsProcessing(false);
      setProgress(0);
      setStage('');
      setMessage('');
    }, 1000);
  }, []);

  const setErrorState = React.useCallback((errorMessage: string) => {
    setError(errorMessage);
    setIsProcessing(false);
    setProgress(0);
  }, []);

  const reset = React.useCallback(() => {
    setProgress(0);
    setStage('');
    setMessage('');
    setIsProcessing(false);
    setError(null);
  }, []);

  return {
    progress,
    stage,
    message,
    isProcessing,
    error,
    startProcessing,
    updateProgress,
    completeProcessing,
    setError: setErrorState,
    reset
  };
}