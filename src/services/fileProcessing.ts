export interface FileInfo {
  name: string;
  size: number;
  type: string;
  format: 'csv' | 'parquet' | 'geojson' | 'unknown';
  lastModified: number;
}

import * as duckdb from '@duckdb/duckdb-wasm';
import { getDuckDB } from './duckdb';

export interface FileProcessingResult {
  tableName: string;
  schema: {
    columns: Array<{
      name: string;
      type: string;
      nullable: boolean;
    }>;
    rowCount: number;
  };
  sampleData: unknown[][];
}

export class FileProcessor {
  static detectFileFormat(file: File): FileInfo {
    const extension = file.name.toLowerCase().split('.').pop();
    let format: 'csv' | 'parquet' | 'geojson' | 'unknown' = 'unknown';

    switch (extension) {
      case 'csv':
        format = 'csv';
        break;
      case 'parquet':
        format = 'parquet';
        break;
      case 'geojson':
        format = 'geojson';
        break;
    }

    return {
      name: file.name,
      size: file.size,
      type: file.type,
      format,
      lastModified: file.lastModified
    };
  }

  static async processFile(
    file: File,
    dbManager: any
  ): Promise<FileProcessingResult> {
    const fileInfo = this.detectFileFormat(file);

    if (fileInfo.format === 'unknown') {
      throw new Error(`Unsupported file format: ${fileInfo.format}`);
    }

    const tableName = this.generateTableName(fileInfo.name);

    switch (fileInfo.format) {
      case 'csv':
        await this.createTableFromCSV(file, tableName, dbManager);
        break;
      case 'parquet':
        // TODO: Implement parquet loading
        throw new Error('Parquet support not yet implemented');
      case 'geojson':
        // TODO: Implement GeoJSON loading
        throw new Error('GeoJSON support not yet implemented');
      default:
        throw new Error(`Unsupported format: ${fileInfo.format}`);
    }
    
    // Get schema information
    const schema = await dbManager.getTableInfo(tableName);
    
    // Get sample data (first 10 rows)
    const sampleData = await this.getSampleData(dbManager, tableName);
    
    return {
      tableName,
      schema,
      sampleData
    };
  }

  private static generateTableName(fileName: string): string {
    const name = fileName
      .toLowerCase()
      .replace(/\.[^/.]+$/, '') // Remove extension
      .replace(/[^a-z0-9_]/g, '_') // Replace non-alphanumeric with underscore
      .replace(/_+/g, '_') // Replace multiple underscores with single
      .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
    
    return name || 'uploaded_data';
  }

  private static async parseCSV(file: File): Promise<{ headers: string[], rows: string[][] }> {
    const content = await this.readFileAsText(file);
    const parsed = this.parseCSVContent(content);

    if (parsed.length < 2) {
      throw new Error('CSV file must have at least a header row and one data row');
    }

    const headers = parsed[0];
    const rows = parsed.slice(1);

    return { headers, rows };
  }

  static parseCSVContent(content: string): string[][] {
    const result: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let inQuotes = false;
    
    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      const nextChar = content[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          currentCell += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++; // Skip \n in \r\n
        }
        if (currentCell !== '' || currentRow.length > 0) {
          currentRow.push(currentCell.trim());
          result.push(currentRow);
          currentRow = [];
          currentCell = '';
        }
      } else {
        currentCell += char;
      }
    }

    // Add final trailing cell/row
    if (currentCell !== '' || currentRow.length > 0) {
      currentRow.push(currentCell.trim());
      result.push(currentRow);
    }

    return result;
  }

  private static inferColumnType(values: string[]): string {
    // Simple type inference - look at first few non-empty values
    const sampleValues = values.filter(v => v && v.trim()).slice(0, 10);

    if (sampleValues.length === 0) return 'VARCHAR';

    // Check if all values are numbers
    const numericValues = sampleValues.filter(v => !isNaN(Number(v)));
    if (numericValues.length === sampleValues.length) {
      return 'DOUBLE';
    }

    // Check if all values are integers
    const integerValues = sampleValues.filter(v => !isNaN(Number(v)) && Number.isInteger(Number(v)));
    if (integerValues.length === sampleValues.length) {
      return 'INTEGER';
    }

    // Check if all values are dates (simple check)
    const dateValues = sampleValues.filter(v => !isNaN(Date.parse(v)));
    if (dateValues.length === sampleValues.length) {
      return 'DATE';
    }

    return 'VARCHAR';
  }

  private static async createParquetTable(file: File, tableName: string): Promise<string> {
    const blobUrl = URL.createObjectURL(file);
    return `
      CREATE OR REPLACE TABLE ${tableName} AS 
      SELECT * FROM read_parquet('${blobUrl}');
    `;
  }

  private static async createGeoJSONTable(file: File, tableName: string): Promise<string> {
    const blobUrl = URL.createObjectURL(file);
    return `
      CREATE OR REPLACE TABLE ${tableName} AS 
      SELECT * FROM read_json_auto('${blobUrl}', 
        format='newline_delimited',
        ignore_errors=true
      );
    `;
  }

  // removed parseCSVLine

  private static async readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  }

  private static async createTableFromCSV(file: File, tableName: string, dbManager: any): Promise<void> {
    const db = await getDuckDB();
    await db.registerFileHandle(file.name, file, duckdb.DuckDBDataProtocol.BROWSER_FILEREADER, true);

    const safeFileName = file.name.replace(/'/g, "''");
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ${tableName} AS 
      SELECT * FROM read_csv_auto('${safeFileName}', header=True, ignore_errors=True);
    `;

    try {
      await dbManager.executeQuery(createTableSQL);
    } finally {
      // Clean up the virtual file after creating the table
      await db.dropFile(file.name).catch(() => {});
    }
  }

  private static async getSampleData(dbManager: any, tableName: string): Promise<unknown[][]> {
    const result = await dbManager.executeQuery(`SELECT * FROM ${tableName} LIMIT 10`);
    return result.rows;
  }
}