export interface ColumnFormatOptions {
  type: 'numeric' | 'date' | 'text' | 'boolean' | 'currency' | 'percentage';
  decimals?: number;
  currency?: string;
  dateFormat?: 'short' | 'long' | 'time' | 'relative';
  locale?: string;
  timezone?: string;
}

export interface FormattedValue {
  formatted: string;
  raw: any;
  type: string;
  sortable: string | number;
  tooltip?: string;
}

export class DataFormatter {
  private static locale = 'en-US';

  static setLocale(locale: string) {
    this.locale = locale;
  }

  static formatValue(value: any, columnType: string, options?: Partial<ColumnFormatOptions>): FormattedValue {
    const type = this.inferType(columnType);
    const opts = { ...this.getDefaultOptions(type), ...options };

    switch (opts.type) {
      case 'numeric':
        return this.formatNumeric(value, opts);
      case 'currency':
        return this.formatCurrency(value, opts);
      case 'percentage':
        return this.formatPercentage(value, opts);
      case 'date':
        return this.formatDate(value, opts);
      case 'boolean':
        return this.formatBoolean(value);
      case 'text':
      default:
        return this.formatText(value);
    }
  }

  private static inferType(columnType: string): ColumnFormatOptions['type'] {
    const upperType = columnType.toUpperCase();
    
    if (upperType.includes('INT') || upperType.includes('DECIMAL') || upperType.includes('NUMERIC')) {
      return 'numeric';
    }
    if (upperType.includes('FLOAT') || upperType.includes('DOUBLE') || upperType.includes('REAL')) {
      return 'numeric';
    }
    if (upperType.includes('DATE') || upperType.includes('TIME') || upperType.includes('TIMESTAMP')) {
      return 'date';
    }
    if (upperType.includes('BOOL')) {
      return 'boolean';
    }
    if (upperType.includes('CHAR') || upperType.includes('TEXT') || upperType.includes('VARCHAR')) {
      return 'text';
    }
    
    // Check if it looks like currency
    if (columnType.toLowerCase().includes('price') || columnType.toLowerCase().includes('amount')) {
      return 'currency';
    }
    
    return 'text';
  }

  private static getDefaultOptions(type: ColumnFormatOptions['type']): ColumnFormatOptions {
    switch (type) {
      case 'numeric':
        return { type, decimals: 2 };
      case 'currency':
        return { type, currency: 'USD', decimals: 2 };
      case 'percentage':
        return { type, decimals: 1 };
      case 'date':
        return { type, dateFormat: 'short' };
      default:
        return { type };
    }
  }

  private static formatNumeric(value: any, options: ColumnFormatOptions): FormattedValue {
    if (value === null || value === undefined) {
      return { formatted: 'NULL', raw: value, type: 'numeric', sortable: '' };
    }

    const num = Number(value);
    if (isNaN(num)) {
      return { formatted: String(value), raw: value, type: 'numeric', sortable: '' };
    }

    let formatted: string;
    
    // Handle large numbers
    if (Math.abs(num) >= 1000000000) {
      formatted = (num / 1000000000).toLocaleString(this.locale, { 
        maximumFractionDigits: options.decimals 
      }) + 'B';
    } else if (Math.abs(num) >= 1000000) {
      formatted = (num / 1000000).toLocaleString(this.locale, { 
        maximumFractionDigits: options.decimals 
      }) + 'M';
    } else if (Math.abs(num) >= 1000) {
      formatted = (num / 1000).toLocaleString(this.locale, { 
        maximumFractionDigits: options.decimals 
      }) + 'K';
    } else {
      formatted = num.toLocaleString(this.locale, { 
        minimumFractionDigits: options.decimals,
        maximumFractionDigits: options.decimals 
      });
    }

    return {
      formatted,
      raw: value,
      type: 'numeric',
      sortable: num
    };
  }

  private static formatCurrency(value: any, options: ColumnFormatOptions): FormattedValue {
    if (value === null || value === undefined) {
      return { formatted: 'NULL', raw: value, type: 'currency', sortable: '' };
    }

    const num = Number(value);
    if (isNaN(num)) {
      return { formatted: String(value), raw: value, type: 'currency', sortable: '' };
    }

    const formatted = num.toLocaleString(this.locale, {
      style: 'currency',
      currency: options.currency || 'USD',
      minimumFractionDigits: options.decimals,
      maximumFractionDigits: options.decimals
    });

    return {
      formatted,
      raw: value,
      type: 'currency',
      sortable: num
    };
  }

  private static formatPercentage(value: any, options: ColumnFormatOptions): FormattedValue {
    if (value === null || value === undefined) {
      return { formatted: 'NULL', raw: value, type: 'percentage', sortable: '' };
    }

    const num = Number(value);
    if (isNaN(num)) {
      return { formatted: String(value), raw: value, type: 'percentage', sortable: '' };
    }

    // Assume value is already in percentage (0-100) or decimal (0-1)
    const percentage = num > 1 ? num : num * 100;
    
    const formatted = percentage.toLocaleString(this.locale, {
      minimumFractionDigits: options.decimals,
      maximumFractionDigits: options.decimals
    }) + '%';

    return {
      formatted,
      raw: value,
      type: 'percentage',
      sortable: num
    };
  }

  private static formatDate(value: any, options: ColumnFormatOptions): FormattedValue {
    if (value === null || value === undefined) {
      return { formatted: 'NULL', raw: value, type: 'date', sortable: '' };
    }

    let date: Date;
    if (value instanceof Date) {
      date = value;
    } else if (typeof value === 'string') {
      // Try to parse the date string
      date = new Date(value);
      if (isNaN(date.getTime())) {
        return { formatted: String(value), raw: value, type: 'date', sortable: '' };
      }
    } else if (typeof value === 'number') {
      date = new Date(value);
    } else {
      return { formatted: String(value), raw: value, type: 'date', sortable: '' };
    }

    let formatted: string;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    switch (options.dateFormat) {
      case 'relative':
        if (diffDays === 0) {
          formatted = 'Today';
        } else if (diffDays === 1) {
          formatted = 'Yesterday';
        } else if (diffDays < 7) {
          formatted = `${diffDays} days ago`;
        } else if (diffDays < 30) {
          formatted = `${Math.floor(diffDays / 7)} weeks ago`;
        } else if (diffDays < 365) {
          formatted = `${Math.floor(diffDays / 30)} months ago`;
        } else {
          formatted = `${Math.floor(diffDays / 365)} years ago`;
        }
        break;
      
      case 'long':
        formatted = date.toLocaleDateString(this.locale, {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        break;
      
      case 'time':
        formatted = date.toLocaleTimeString(this.locale, {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
        break;
      
      case 'short':
      default:
        formatted = date.toLocaleDateString(this.locale, {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
        break;
    }

    return {
      formatted,
      raw: value,
      type: 'date',
      sortable: date.getTime(),
      tooltip: date.toLocaleString()
    };
  }

  private static formatBoolean(value: any): FormattedValue {
    if (value === null || value === undefined) {
      return { formatted: 'NULL', raw: value, type: 'boolean', sortable: '' };
    }

    const boolValue = Boolean(value);
    const formatted = boolValue ? 'TRUE' : 'FALSE';
    const color = boolValue ? 'text-green-600' : 'text-red-600';

    return {
      formatted,
      raw: value,
      type: 'boolean',
      sortable: boolValue ? 1 : 0
    };
  }

  private static formatText(value: any): FormattedValue {
    if (value === null || value === undefined) {
      return { formatted: 'NULL', raw: value, type: 'text', sortable: '' };
    }

    const str = String(value);
    const isLong = str.length > 50;
    
    return {
      formatted: isLong ? str.substring(0, 47) + '...' : str,
      raw: value,
      type: 'text',
      sortable: str.toLowerCase(),
      tooltip: isLong ? str : undefined
    };
  }

  static getColumnFormatter(columnType: string): (value: any) => FormattedValue {
    return (value: any) => this.formatValue(value, columnType);
  }

  static formatColumnValues(values: any[], columnType: string): FormattedValue[] {
    return values.map(value => this.formatValue(value, columnType));
  }

  // Utility method to detect data type from sample values
  static detectColumnType(samples: any[]): string {
    const nonNullSamples = samples.filter(v => v !== null && v !== undefined);
    
    if (nonNullSamples.length === 0) return 'TEXT';
    
    // Check for numbers
    const numericCount = nonNullSamples.filter(v => !isNaN(Number(v))).length;
    if (numericCount / nonNullSamples.length > 0.8) {
      const hasDecimal = nonNullSamples.some(v => String(v).includes('.'));
      return hasDecimal ? 'FLOAT' : 'INTEGER';
    }
    
    // Check for dates
    const dateCount = nonNullSamples.filter(v => {
      const date = new Date(v);
      return !isNaN(date.getTime());
    }).length;
    if (dateCount / nonNullSamples.length > 0.8) {
      return 'TIMESTAMP';
    }
    
    // Check for booleans
    const booleanCount = nonNullSamples.filter(v => 
      typeof v === 'boolean'
    ).length;
    if (booleanCount / nonNullSamples.length > 0.8) {
      return 'BOOLEAN';
    }
    
    return 'TEXT';
  }
}

export const shortenType = (type: string): string => {
  const upperType = type.toUpperCase();
  if (upperType === 'INTEGER') return 'INT';
  if (upperType === 'BIGINT') return 'BIG';
  if (upperType === 'VARCHAR') return 'STR';
  if (upperType === 'TIMESTAMP') return 'TS';
  if (upperType === 'TIMESTAMP WITH TIME ZONE') return 'TZ';
  if (upperType === 'DOUBLE') return 'DBL';
  if (upperType === 'BOOLEAN') return 'BOOL';
  if (upperType.startsWith('DECIMAL')) return 'DEC';
  return upperType;
};