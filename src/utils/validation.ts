export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface QueryValidationOptions {
  maxLength: number;
  maxColumns: number;
  maxRows: number;
  allowedKeywords: string[];
  blockedKeywords: string[];
}

export class QueryValidator {
  private static defaultOptions: QueryValidationOptions = {
    maxLength: 10000,
    maxColumns: 1000,
    maxRows: 1000000,
    allowedKeywords: [
      'SELECT', 'FROM', 'WHERE', 'GROUP', 'ORDER', 'LIMIT', 'OFFSET',
      'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'DISTINCT',
      'AND', 'OR', 'NOT', 'IN', 'BETWEEN', 'LIKE', 'IS', 'NULL',
      'ASC', 'DESC', 'AS', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER',
      'UNION', 'INTERSECT', 'EXCEPT'
    ],
    blockedKeywords: [
      'DROP', 'DELETE', 'INSERT', 'UPDATE', 'ALTER', 'CREATE',
      'GRANT', 'REVOKE', 'EXEC', 'EXECUTE', 'SHUTDOWN', 'SYSTEM'
    ]
  };

  static validateQuery(query: string, options?: Partial<QueryValidationOptions>): ValidationResult {
    const opts = { ...this.defaultOptions, ...options };
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Basic length validation
    if (query.length > opts.maxLength) {
      result.errors.push(`Query is too long (${query.length} chars). Maximum is ${opts.maxLength}`);
      result.isValid = false;
    }

    // Basic SQL keyword validation
    const upperQuery = query.toUpperCase();
    
    // Check for blocked keywords
    for (const keyword of opts.blockedKeywords) {
      if (upperQuery.includes(keyword)) {
        result.errors.push(`Blocked keyword detected: ${keyword}`);
        result.isValid = false;
      }
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /\b(UNION\s+ALL|UNION\s+SELECT)/i,
      /\b(SELECT\s+\*\s+FROM\s+\w+)/i,
      /;.+;/g,  // Multiple statements
      /--.*$/gm,  // SQL comments
      /\/\*[\s\S]*?\*\//g  // Block comments
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(query)) {
        result.warnings.push('Query contains potentially unsafe patterns');
        break;
      }
    }

    // Basic structure validation
    const hasSelect = /\bSELECT\b/i.test(upperQuery);
    const hasFrom = /\bFROM\b/i.test(upperQuery);
    
    if (!hasSelect) {
      result.errors.push('Query must contain SELECT statement');
      result.isValid = false;
    }

    if (hasSelect && !hasFrom) {
      result.errors.push('Query must contain FROM clause when using SELECT');
      result.isValid = false;
    }

    return result;
  }

  static validateTableName(tableName: string): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Table name validation
    if (!tableName || tableName.trim().length === 0) {
      result.errors.push('Table name is required');
      result.isValid = false;
    }

    if (tableName.length > 128) {
      result.errors.push('Table name is too long (max 128 characters)');
      result.isValid = false;
    }

    // Check for valid characters (alphanumeric and underscore)
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
      result.errors.push('Table name must start with letter or underscore and contain only alphanumeric characters and underscores');
      result.isValid = false;
    }

    // Check for reserved keywords
    const reservedKeywords = ['SELECT', 'FROM', 'WHERE', 'GROUP', 'ORDER', 'LIMIT', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX'];
    if (reservedKeywords.includes(tableName.toUpperCase())) {
      result.errors.push(`Table name cannot be a reserved keyword: ${tableName}`);
      result.isValid = false;
    }

    return result;
  }

  static validateFile(file: File): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // File size validation (100MB limit)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      result.errors.push(`File is too large (${this.formatBytes(file.size)}). Maximum size is ${this.formatBytes(maxSize)}`);
      result.isValid = false;
    }

    // File format validation
    const allowedExtensions = ['.csv', '.parquet', '.geojson'];
    const fileExtension = '.' + file.name.toLowerCase().split('.').pop();
    
    if (!allowedExtensions.includes(fileExtension)) {
      result.errors.push(`Unsupported file format: ${fileExtension}. Allowed formats: ${allowedExtensions.join(', ')}`);
      result.isValid = false;
    }

    // File name validation
    if (file.name.length > 255) {
      result.errors.push('File name is too long (max 255 characters)');
      result.isValid = false;
    }

    // Empty file check
    if (file.size === 0) {
      result.errors.push('File is empty');
      result.isValid = false;
    }

    return result;
  }

  private static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export class ErrorHandler {
  static handleQueryError(error: any): string {
    if (error?.message) {
      // Handle specific DuckDB errors
      if (error.message.includes('syntax error')) {
        return 'SQL syntax error. Please check your query.';
      }
      if (error.message.includes('no such table')) {
        return 'Table does not exist or has been dropped.';
      }
      if (error.message.includes('no such column')) {
        return 'Column does not exist. Please check column names.';
      }
      if (error.message.includes('memory')) {
        return 'Query requires too much memory. Try limiting results or using filters.';
      }
      
      return `Query failed: ${error.message}`;
    }
    
    return 'An unexpected error occurred while executing the query.';
  }

  static handleFileError(error: any, fileName: string): string {
    if (error?.message) {
      if (error.message.includes('format')) {
        return `File format error in ${fileName}. Please ensure the file is properly formatted.`;
      }
      if (error.message.includes('size')) {
        return `File ${fileName} is too large to process.`;
      }
      
      return `Failed to process ${fileName}: ${error.message}`;
    }
    
    return `An unexpected error occurred while processing ${fileName}.`;
  }

  static handleDuckDBError(error: any): string {
    console.error('DuckDB Error:', error);
    
    if (error?.message) {
      if (error.message.includes('WASM')) {
        return 'Database engine initialization failed. Please refresh the page and try again.';
      }
      if (error.message.includes('permission')) {
        return 'Permission denied. The application may not have sufficient access.';
      }
    }
    
    return 'Database connection error. Please try again.';
  }
}