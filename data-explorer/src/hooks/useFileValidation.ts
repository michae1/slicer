import { useState, useCallback } from 'react';
import { QueryValidator, type ValidationResult } from '@/utils/validation';

interface FileValidationState {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  isValidating: boolean;
}

interface UseFileValidationReturn {
  validationState: FileValidationState;
  validateFile: (file: File) => Promise<boolean>;
  resetValidation: () => void;
}

export function useFileValidation(): UseFileValidationReturn {
  const [validationState, setValidationState] = useState<FileValidationState>({
    isValid: true,
    errors: [],
    warnings: [],
    isValidating: false
  });

  const validateFile = useCallback(async (file: File): Promise<boolean> => {
    setValidationState(prev => ({ ...prev, isValidating: true }));

    try {
      // Simulate async validation (could be extended with actual file analysis)
      await new Promise(resolve => setTimeout(resolve, 100));

      const result = QueryValidator.validateFile(file);
      
      setValidationState({
        isValid: result.isValid,
        errors: result.errors,
        warnings: result.warnings,
        isValidating: false
      });

      return result.isValid;
    } catch (error) {
      setValidationState({
        isValid: false,
        errors: [`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: [],
        isValidating: false
      });
      return false;
    }
  }, []);

  const resetValidation = useCallback(() => {
    setValidationState({
      isValid: true,
      errors: [],
      warnings: [],
      isValidating: false
    });
  }, []);

  return {
    validationState,
    validateFile,
    resetValidation
  };
}