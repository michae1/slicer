import { useDragDropStore } from '@/stores/dragDropStore';
import { QueryValidator } from '@/utils/validation';
import type { DatabaseColumn } from '@/utils/database';

export interface QueryBuilderOptions {
  defaultLimit?: number;
  includeOrderBy?: boolean;
  enableCaching?: boolean;
}

export interface GeneratedQuery {
  sql: string;
  parameters: {
    selectColumns: string[];
    groupByColumns: string[];
    measureColumns?: string[];
    filterConditions: Array<{ column: string; values: string[] }>;
    orderByColumns?: string[];
    limit?: number;
  };
  isValid: boolean;
  errors: string[];
  warnings: string[];
  estimatedComplexity: 'low' | 'medium' | 'high';
}

export class QueryBuilderService {
  private static defaultOptions: QueryBuilderOptions = {
    defaultLimit: 1000,
    includeOrderBy: true,
    enableCaching: true
  };

  static generateQuery(
    tableName: string,
    columns: DatabaseColumn[],
    options?: QueryBuilderOptions
  ): GeneratedQuery {
    const opts = { ...this.defaultOptions, ...options };
    const { groupByColumns, filterColumns, measureColumns, filterValues } = useDragDropStore.getState();

    const result: GeneratedQuery = {
      sql: '',
      parameters: {
        selectColumns: [],
        groupByColumns: groupByColumns.map(col => col.name),
        measureColumns: measureColumns.map(col => col.name),
        filterConditions: [],
        orderByColumns: groupByColumns.map(col => col.name),
        limit: opts.defaultLimit
      },
      isValid: true,
      errors: [],
      warnings: [],
      estimatedComplexity: 'low'
    };

    // Validate inputs
    if (!tableName || tableName.trim().length === 0) {
      result.errors.push('Table name is required');
      result.isValid = false;
      return result;
    }

    if (columns.length === 0) {
      result.errors.push('No columns available in table');
      result.isValid = false;
      return result;
    }

    // Build SELECT clause
    const selectClause = this.buildSelectClause(groupByColumns, measureColumns, columns);
    result.parameters.selectColumns = selectClause.columns;
    
    // Build WHERE clause from filters
    const whereClause = this.buildWhereClause(filterColumns, filterValues);
    result.parameters.filterConditions = whereClause.conditions;
    
    // Build GROUP BY clause
    const groupByClause = this.buildGroupByClause(groupByColumns);
    
    // Build ORDER BY clause
    const orderByClause = this.buildOrderByClause(result.parameters.orderByColumns, opts.includeOrderBy);
    
    // Build LIMIT clause
    const limitClause = this.buildLimitClause(opts.defaultLimit);

    // Construct final SQL
    result.sql = [
      `SELECT ${selectClause.sql}`,
      `FROM ${tableName}`,
      whereClause.sql ? `WHERE ${whereClause.sql}` : '',
      groupByClause.sql ? `GROUP BY ${groupByClause.sql}` : '',
      orderByClause.sql ? `ORDER BY ${orderByClause.sql}` : '',
      limitClause.sql
    ].filter(Boolean).join('\n');

    // Estimate complexity
    result.estimatedComplexity = this.estimateComplexity(result);

    // Add warnings
    if (groupByColumns.length > 3) {
      result.warnings.push('Large number of group dimensions may impact performance');
    }
    
    if (Object.keys(filterValues).length > 5) {
      result.warnings.push('Many filters applied may slow down query execution');
    }

    // Validate generated query
    const validation = QueryValidator.validateQuery(result.sql);
    result.errors = validation.errors;
    result.isValid = validation.isValid && result.errors.length === 0;
    result.warnings = [...result.warnings, ...validation.warnings];

    return result;
  }

  private static buildSelectClause(
    groupByColumns: DatabaseColumn[], 
    measureColumns: DatabaseColumn[], 
    allColumns: DatabaseColumn[]
  ): {
    sql: string;
    columns: string[];
  } {
    if (groupByColumns.length === 0 && measureColumns.length === 0) {
      // No grouping - select all columns
      return {
        sql: '*',
        columns: allColumns.map(col => col.name)
      };
    }

    // With grouping - select group columns and aggregate functions for numeric columns
    const selectParts: string[] = [];
    const selectColumns: string[] = [];

    // Add group columns
    groupByColumns.forEach(column => {
      selectParts.push(`"${column.name}"`);
      selectColumns.push(column.name);
    });

    if (measureColumns && measureColumns.length > 0) {
      measureColumns.forEach(column => {
        // cast because we don't import MeasureColumn here to avoid circular dep if any, or just accept `any` for aggregation
        const agg = (column as any).aggregation || 'SUM';
        selectParts.push(`${agg}("${column.name}") as "${column.name}_${agg.toLowerCase()}"`);
        selectColumns.push(`${column.name}_${agg.toLowerCase()}`);
      });
    } else {
      // Create aggregations for numeric columns implicitly for backward compatibility
      const numericColumns = allColumns.filter(col => {
        const upperType = col.type.toUpperCase();
        return upperType.includes('INT') || 
               upperType.includes('DECIMAL') || 
               upperType.includes('NUMERIC') ||
               upperType.includes('FLOAT') || 
               upperType.includes('DOUBLE') || 
               upperType.includes('REAL');
      });

      numericColumns.forEach(column => {
        if (!groupByColumns.some(groupCol => groupCol.name === column.name)) {
          selectParts.push(`COUNT("${column.name}") as count_${column.name}`);
          selectColumns.push(`count_${column.name}`);
          
          selectParts.push(`SUM("${column.name}") as sum_${column.name}`);
          selectColumns.push(`sum_${column.name}`);
          
          selectParts.push(`AVG("${column.name}") as avg_${column.name}`);
          selectColumns.push(`avg_${column.name}`);
          
          selectParts.push(`MIN("${column.name}") as min_${column.name}`);
          selectColumns.push(`min_${column.name}`);
          
          selectParts.push(`MAX("${column.name}") as max_${column.name}`);
          selectColumns.push(`max_${column.name}`);
        }
      });
    }

    return {
      sql: selectParts.join(', '),
      columns: selectColumns
    };
  }

  private static buildWhereClause(filterColumns: DatabaseColumn[], filterValues: Record<string, string[]>): {
    sql: string;
    conditions: Array<{ column: string; values: string[] }>;
  } {
    const conditions: Array<{ column: string; values: string[] }> = [];
    const whereParts: string[] = [];

    Object.entries(filterValues).forEach(([columnName, values]) => {
      if (values.length > 0) {
        conditions.push({ column: columnName, values });
        
        // Escape values to prevent SQL injection
        const escapedValues = values.map(value => {
          if (value === null || value === undefined || value === '') {
            return 'NULL';
          }
          return `'${String(value).replace(/'/g, "''")}'`;
        });

        whereParts.push(`"${columnName}" IN (${escapedValues.join(', ')})`);
      }
    });

    return {
      sql: whereParts.join(' AND '),
      conditions
    };
  }

  private static buildGroupByClause(groupByColumns: DatabaseColumn[]): {
    sql: string;
  } {
    if (groupByColumns.length === 0) {
      return { sql: '' };
    }

    const groupParts = groupByColumns.map(col => `"${col.name}"`);
    return {
      sql: groupParts.join(', ')
    };
  }

  private static buildOrderByClause(orderByColumns?: string[], includeOrderBy: boolean = true): {
    sql: string;
  } {
    if (!includeOrderBy || !orderByColumns || orderByColumns.length === 0) {
      return { sql: '' };
    }

    const orderParts = orderByColumns.map(col => `"${col}" ASC`);
    return {
      sql: orderParts.join(', ')
    };
  }

  private static buildLimitClause(defaultLimit?: number): {
    sql: string;
  } {
    if (!defaultLimit || defaultLimit <= 0) {
      return { sql: '' };
    }

    return {
      sql: `LIMIT ${defaultLimit}`
    };
  }

  private static estimateComplexity(query: GeneratedQuery): 'low' | 'medium' | 'high' {
    let score = 0;

    // Score based on group by complexity
    score += query.parameters.groupByColumns.length * 2;

    // Score based on filter complexity
    score += Object.keys(query.parameters.filterConditions).length * 1;

    // Score based on selected columns
    score += query.parameters.selectColumns.length * 0.5;

    if (score <= 5) return 'low';
    if (score <= 15) return 'medium';
    return 'high';
  }

  static generateDistinctValuesQuery(tableName: string, columnName: string, limit: number = 1000): string {
    return `
      SELECT DISTINCT "${columnName}"
      FROM ${tableName}
      WHERE "${columnName}" IS NOT NULL
      ORDER BY "${columnName}"
      LIMIT ${limit}
    `;
  }

  static generateCountQuery(tableName: string, filters?: Record<string, string[]>): string {
    let whereClause = '';
    if (filters && Object.keys(filters).length > 0) {
      const whereParts: string[] = [];
      Object.entries(filters).forEach(([columnName, values]) => {
        if (values.length > 0) {
          const escapedValues = values.map(value => 
            `'${String(value).replace(/'/g, "''")}'`
          );
          whereParts.push(`"${columnName}" IN (${escapedValues.join(', ')})`);
        }
      });
      if (whereParts.length > 0) {
        whereClause = `WHERE ${whereParts.join(' AND ')}`;
      }
    }

    return `SELECT COUNT(*) as total FROM ${tableName} ${whereClause}`;
  }
}