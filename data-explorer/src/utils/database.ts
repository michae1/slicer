import { getDuckDBConnection } from '@/services/duckdb';

export interface DatabaseTable {
  name: string;
  columns: DatabaseColumn[];
  rowCount?: number;
}

export interface DatabaseColumn {
  name: string;
  type: string;
  nullable: boolean;
  description?: string;
}

export interface QueryResult {
  columns: string[];
  rows: unknown[][];
  rowCount: number;
  executionTime?: number;
}

export class DatabaseManager {
  private static instance: DatabaseManager;
  private currentTable: string | null = null;

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  async executeQuery(query: string): Promise<QueryResult> {
    const startTime = Date.now();

    try {
      const conn = await getDuckDBConnection();
      const result = await conn.query(query);

      // Convert Table to our QueryResult format
      const columns = result.schema.fields.map(field => field.name);
      const rows = [];

      for (let i = 0; i < result.numRows; i++) {
        const row = result.schema.fields.map(field => {
          const value = (result as any).get(i);
          return value[field.name];
        });
        rows.push(row);
      }

      const executionTime = Date.now() - startTime;

      return {
        columns,
        rows,
        rowCount: result.numRows,
        executionTime
      };
    } catch (error) {
      console.error('Query execution failed:', error);
      throw new Error(`Query failed: ${error}`);
    }
  }

  async getTableInfo(tableName: string): Promise<DatabaseTable> {
    const query = `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = '${tableName}'
      ORDER BY ordinal_position;
    `;
    
    const result = await this.executeQuery(query);
    
    const columns: DatabaseColumn[] = result.rows.map(row => ({
      name: row[0] as string,
      type: row[1] as string,
      nullable: row[2] as string === 'YES',
      description: row[3] as string || undefined
    }));

    // Get row count
    const countResult = await this.executeQuery(`SELECT COUNT(*) as count FROM ${tableName}`);
    const rowCount = countResult.rows[0][0] as number;

    return {
      name: tableName,
      columns,
      rowCount
    };
  }

  async getAllTables(): Promise<string[]> {
    const query = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'main' 
      AND table_type = 'BASE TABLE';
    `;
    
    const result = await this.executeQuery(query);
    return result.rows.map(row => row[0] as string);
  }

  async dropTable(tableName: string): Promise<void> {
    const query = `DROP TABLE IF EXISTS ${tableName};`;
    await this.executeQuery(query);
  }

  setCurrentTable(tableName: string | null) {
    this.currentTable = tableName;
  }

  getCurrentTable(): string | null {
    return this.currentTable;
  }
}