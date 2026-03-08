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
    defaultLimit: 500000,
    includeOrderBy: true,
    enableCaching: true
  };

  static generateQuery(
    tableName: string,
    columns: DatabaseColumn[],
    options?: QueryBuilderOptions
  ): GeneratedQuery {
    const opts = { ...this.defaultOptions, ...options };
    const { 
      groupByColumns, 
      filterColumns, 
      measureColumns, 
      filterValues,
      dateGranularity,
      sortColumn,
      sortDirection
    } = useDragDropStore.getState();

    const result: GeneratedQuery = {
      sql: '',
      parameters: {
        selectColumns: [],
        groupByColumns: groupByColumns.map(col => col.name),
        measureColumns: measureColumns.map(col => col.name),
        filterConditions: [],
        orderByColumns: sortColumn 
          ? [sortColumn] 
          : groupByColumns.map(col => col.name),
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
    const selectClause = this.buildSelectClause(groupByColumns, measureColumns, columns, dateGranularity);
    result.parameters.selectColumns = selectClause.columns;
    
    // Build WHERE clause from filters
    const whereClause = this.buildWhereClause(filterColumns, filterValues, columns);
    result.parameters.filterConditions = whereClause.conditions;
    
    // Build GROUP BY clause
    const groupByClause = this.buildGroupByClause(groupByColumns, dateGranularity);
    
    // Build ORDER BY clause
    const orderByClause = this.buildOrderByClause(result.parameters.orderByColumns, sortDirection || 'ASC', opts.includeOrderBy, result.parameters.selectColumns);
    
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
    allColumns: DatabaseColumn[],
    dateGranularity: string = 'none'
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
      if (dateGranularity !== 'none' && this.isDateColumn(column)) {
        const expression = this.wrapWithDateTrunc(column, dateGranularity);
        selectParts.push(`${expression} as "${column.name}"`);
      } else {
        selectParts.push(`"${column.name}"`);
      }
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

  private static isDateColumn(column: DatabaseColumn): boolean {
    const type = column.type.toUpperCase();
    const name = column.name.toLowerCase();
    
    return (
      type.includes('DATE') || 
      type.includes('TIMESTAMP') || 
      type.includes('TIME') ||
      name.includes('date') || 
      name.includes('time') || 
      name.endsWith('_at')
    );
  }

  private static wrapWithDateTrunc(column: DatabaseColumn, granularity: string): string {
    const type = column.type.toUpperCase();
    let columnExpression = `"${column.name}"`;
    
    // If it's stored as a number (Unix timestamp), convert to TIMESTAMP
    if (type.includes('INT') || type.includes('DOUBLE') || type.includes('FLOAT') || type.includes('NUMERIC')) {
      // Logic from ResultsTable: JS timestamps (ms) vs Seconds
      // DuckDB can handle division directly
      // However, for simplicity and robustness in SQL, we can check if values are large
      // but standard SQL doesn't have a clean "if" without subqueries for granularity selection
      // We will assume that if it's numeric and treated as date, it's either seconds or ms
      // Most common for JS is ms. But DuckDB read_csv_auto often reads as INT/BIGINT.
      // We'll use a heuristic for TO_TIMESTAMP
      columnExpression = `CASE 
        WHEN "${column.name}" > 1000000000000 THEN TO_TIMESTAMP("${column.name}" / 1000)
        ELSE TO_TIMESTAMP("${column.name}")
      END`;
    }
    
    return `DATE_TRUNC('${granularity}', ${columnExpression}::TIMESTAMP)`;
  }

  private static buildWhereClause(
    filterColumns: DatabaseColumn[], 
    filterValues: Record<string, string[]>,
    allColumns: DatabaseColumn[]
  ): {
    sql: string;
    conditions: Array<{ column: string; values: string[] }>;
  } {
    const conditions: Array<{ column: string; values: string[] }> = [];
    const whereParts: string[] = [];

    Object.entries(filterValues).forEach(([columnName, values]) => {
      if (values.length > 0) {
        conditions.push({ column: columnName, values });
        const column = allColumns.find(col => col.name === columnName);
        const isDate = column ? this.isDateColumn(column) : false;

        // Check for range search
        if (isDate && values[0]?.startsWith('range:')) {
          const [after, before] = values[0].replace('range:', '').split(';');
          let colExpr = `"${columnName}"`;
          
          if (column && ['INTEGER', 'BIGINT', 'DOUBLE', 'FLOAT', 'NUMERIC'].some(t => column.type.toUpperCase().includes(t))) {
            colExpr = `CASE 
              WHEN "${columnName}" > 1000000000000 THEN TO_TIMESTAMP("${columnName}" / 1000)
              ELSE TO_TIMESTAMP("${columnName}")
            END::TIMESTAMP`;
          } else if (column) {
            colExpr = `"${columnName}"::TIMESTAMP`;
          }

          if (after && before) {
            whereParts.push(`${colExpr} BETWEEN '${after}'::TIMESTAMP AND '${before}'::TIMESTAMP`);
          } else if (after) {
            whereParts.push(`${colExpr} >= '${after}'::TIMESTAMP`);
          } else if (before) {
            whereParts.push(`${colExpr} <= '${before}'::TIMESTAMP`);
          }
        } else {
          // Standard IN clause
          const escapedValues = values.map(value => {
            if (value === null || value === undefined || value === '') {
              return 'NULL';
            }
            return `'${String(value).replace(/'/g, "''")}'`;
          });
          whereParts.push(`"${columnName}" IN (${escapedValues.join(', ')})`);
        }
      }
    });

    return {
      sql: whereParts.join(' AND '),
      conditions
    };
  }

  private static buildGroupByClause(
    groupByColumns: DatabaseColumn[],
    dateGranularity: string = 'none'
  ): {
    sql: string;
  } {
    if (groupByColumns.length === 0) {
      return { sql: '' };
    }

    const groupParts = groupByColumns.map(column => {
      if (dateGranularity !== 'none' && this.isDateColumn(column)) {
        return this.wrapWithDateTrunc(column, dateGranularity);
      }
      return `"${column.name}"`;
    });
    
    return {
      sql: groupParts.join(', ')
    };
  }

  private static buildOrderByClause(orderByColumns?: string[], direction: string = 'ASC', includeOrderBy: boolean = true, selectColumns?: string[]): {
    sql: string;
  } {
    if (!includeOrderBy || !orderByColumns || orderByColumns.length === 0) {
      return { sql: '' };
    }

    const validOrderByColumns = selectColumns 
      ? orderByColumns.filter(col => selectColumns.includes(col))
      : orderByColumns;
    
    if (validOrderByColumns.length === 0) {
      return { sql: '' };
    }

    const orderParts = validOrderByColumns.map(col => `"${col}" ${direction.toUpperCase()}`);
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

  static generateDistinctValuesQuery(tableName: string, columnName: string, limit: number = 50000): string {
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