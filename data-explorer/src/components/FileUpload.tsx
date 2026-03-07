import React, { useCallback, useState } from 'react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  className?: string;
  accept?: string;
  disabled?: boolean;
}

export function FileUpload({ 
  onFileSelect, 
  className,
  accept = '.csv,.parquet,.geojson',
  disabled = false 
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    if (disabled || isProcessing) return;
    
    setIsProcessing(true);
    onFileSelect(file);
    
    // Reset processing state after a short delay
    setTimeout(() => {
      setIsProcessing(false);
    }, 1000);
  }, [onFileSelect, disabled, isProcessing]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled || isProcessing) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      handleFileSelect(file);
    }
  }, [disabled, isProcessing, handleFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  return (
    <div
      className={`
        relative w-full max-w-2xl mx-auto p-12 border-2 border-dashed rounded-2xl transition-all duration-300
        hover:border-purple-400 hover:bg-white/10 backdrop-blur-sm
        ${isDragOver ? 'border-purple-400 bg-purple-500/20 scale-105' : 'border-purple-300/50'}
        ${isProcessing ? 'pointer-events-none opacity-50' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className || ''}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept={accept}
        onChange={handleFileInput}
        disabled={disabled || isProcessing}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        aria-label="Upload file"
      />
      
      <div className="text-center">
        <div className="mx-auto w-16 h-16 mb-6 text-purple-300">
          {isDragOver ? (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="animate-bounce">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          ) : (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          )}
        </div>
        
        {isProcessing ? (
          <div className="space-y-4">
            <div className="animate-spin w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-purple-200">Processing your data...</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xl font-medium text-white">
              {isDragOver ? 'Drop it like it\'s hot 🔥' : 'Drop your file here'}
            </p>
            <p className="text-purple-300">
              or <span className="text-purple-200 font-medium">click to browse</span>
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <span className="px-3 py-1 text-xs rounded-full bg-green-500/20 text-green-300 border border-green-500/30">CSV</span>
              <span className="px-3 py-1 text-xs rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">Parquet</span>
              <span className="px-3 py-1 text-xs rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">GeoJSON</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}