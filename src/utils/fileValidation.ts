export interface FileValidationError {
  type: 'format' | 'structure' | 'encoding' | 'size' | 'permission';
  message: string;
  line?: number;
  column?: number;
  value?: any;
  suggestion?: string;
}

import { FileProcessor } from '../services/fileProcessing';

export interface ValidationReport {
  isValid: boolean;
  errors: FileValidationError[];
  warnings: FileValidationError[];
  statistics: {
    totalRows: number;
    totalColumns: number;
    nullableColumns: number;
    emptyRows: number;
    duplicateRows: number;
  };
}

export class DataValidator {
  static async validateCSV(file: File): Promise<ValidationReport> {
    const errors: FileValidationError[] = [];
    const warnings: FileValidationError[] = [];
    
    try {
      const content = await this.readFileAsText(file);
      const parsed = FileProcessor.parseCSVContent(content);
      const rows = parsed;
      
      if (rows.length === 0) {
        errors.push({
          type: 'structure',
          message: 'CSV file is empty',
          suggestion: 'Ensure the file contains data'
        });
        return this.createValidationReport(false, errors, warnings, 0, 0);
      }

      // Check for headers
      if (rows.length < 2) {
        warnings.push({
          type: 'structure',
          message: 'CSV file has no data rows',
          suggestion: 'Add at least one data row'
        });
      }

      const headers = rows[0];
      const expectedColumns = headers.length;
      
      // Validate data rows
      let emptyRows = 0;
      let maxColumns = 0;
      
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        maxColumns = Math.max(maxColumns, row.length);
        
        if (row.every(cell => !cell.trim())) {
          emptyRows++;
        }
        
        if (row.length !== expectedColumns) {
          errors.push({
            type: 'structure',
            message: `Row ${i + 1} has ${row.length} columns, expected ${expectedColumns}`,
            line: i + 1,
            suggestion: 'Check for missing commas or extra commas in the row'
          });
        }
      }

      if (maxColumns !== expectedColumns) {
        warnings.push({
          type: 'structure',
          message: `Inconsistent column count across rows (${expectedColumns} header, ${maxColumns} max data)`,
          suggestion: 'Ensure all rows have the same number of columns'
        });
      }

      if (emptyRows > 0) {
        warnings.push({
          type: 'structure',
          message: `${emptyRows} empty rows found`,
          suggestion: 'Consider removing empty rows'
        });
      }

      return this.createValidationReport(
        errors.length === 0,
        errors,
        warnings,
        rows.length - 1,
        expectedColumns,
        emptyRows
      );
    } catch (error) {
      errors.push({
        type: 'encoding',
        message: `Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        suggestion: 'Check file encoding and permissions'
      });
      
      return this.createValidationReport(false, errors, warnings, 0, 0);
    }
  }

  static async validateParquet(file: File): Promise<ValidationReport> {
    const errors: FileValidationError[] = [];
    const warnings: FileValidationError[] = [];
    
    try {
      // Basic file size check
      if (file.size > 100 * 1024 * 1024) { // 100MB
        warnings.push({
          type: 'size',
          message: `Large Parquet file (${this.formatBytes(file.size)})`,
          suggestion: 'Consider using data sampling for better performance'
        });
      }

      // DuckDB will validate the Parquet format when loading
      // This is a placeholder for client-side Parquet validation
      // In a real implementation, you might use parquet-wasm or similar
      
      return this.createValidationReport(true, errors, warnings, 0, 0);
    } catch (error) {
      errors.push({
        type: 'format',
        message: `Invalid Parquet file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        suggestion: 'Ensure the file is a valid Parquet format'
      });
      
      return this.createValidationReport(false, errors, warnings, 0, 0);
    }
  }

  static async validateGeoJSON(file: File): Promise<ValidationReport> {
    const errors: FileValidationError[] = [];
    const warnings: FileValidationError[] = [];
    
    try {
      const content = await this.readFileAsText(file);
      const data = JSON.parse(content);
      
      // Validate GeoJSON structure
      if (!data.type) {
        errors.push({
          type: 'format',
          message: 'Invalid GeoJSON: missing type property',
          suggestion: 'Ensure the file follows GeoJSON specification'
        });
        return this.createValidationReport(false, errors, warnings, 0, 0);
      }

      if (!['Feature', 'FeatureCollection', 'Geometry', 'GeometryCollection'].includes(data.type)) {
        errors.push({
          type: 'format',
          message: `Invalid GeoJSON type: ${data.type}`,
          suggestion: 'Use Feature, FeatureCollection, Geometry, or GeometryCollection'
        });
      }

      if (data.type === 'FeatureCollection' && !Array.isArray(data.features)) {
        errors.push({
          type: 'structure',
          message: 'FeatureCollection must have features array',
          suggestion: 'Add a features array to the FeatureCollection'
        });
      }

      // Count features if available
      let featureCount = 0;
      if (data.type === 'FeatureCollection') {
        featureCount = data.features?.length || 0;
      } else if (data.type === 'Feature') {
        featureCount = 1;
      }

      if (featureCount === 0) {
        errors.push({
          type: 'structure',
          message: 'No features found in GeoJSON',
          suggestion: 'Add at least one feature or feature collection'
        });
      }

      return this.createValidationReport(
        errors.length === 0,
        errors,
        warnings,
        featureCount,
        1
      );
    } catch (error) {
      errors.push({
        type: 'format',
        message: `Invalid GeoJSON: ${error instanceof Error ? error.message : 'JSON parsing failed'}`,
        suggestion: 'Ensure the file contains valid JSON and follows GeoJSON format'
      });
      
      return this.createValidationReport(false, errors, warnings, 0, 0);
    }
  }

  // parseCSVLine was removed as we use FileProcessor.parseCSVContent

  private static async readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  private static createValidationReport(
    isValid: boolean,
    errors: FileValidationError[],
    warnings: FileValidationError[],
    totalRows: number,
    totalColumns: number,
    emptyRows: number = 0
  ): ValidationReport {
    const nullableColumns = totalColumns; // Simplified for now
    
    return {
      isValid,
      errors,
      warnings,
      statistics: {
        totalRows,
        totalColumns,
        nullableColumns,
        emptyRows,
        duplicateRows: 0 // Could be calculated if needed
      }
    };
  }

  private static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}