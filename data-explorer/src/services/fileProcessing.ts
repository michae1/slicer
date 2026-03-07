export interface FileInfo {
  name: string;
  size: number;
  type: string;
  format: 'csv' | 'parquet' | 'geojson' | 'unknown';
  lastModified: number;
}

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
    const lines = content.trim().split('\n');

    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header row and one data row');
    }

    const headers = this.parseCSVLine(lines[0]);
    const rows: string[][] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length > 0) { // Skip empty lines
        rows.push(values);
      }
    }

    return { headers, rows };
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

  private static parseCSVLine(line: string): string[] {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  private static async readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  }

  private static async createTableFromCSV(file: File, tableName: string, dbManager: any): Promise<void> {
    const { headers, rows } = await this.parseCSV(file);

    // Infer column types
    const columns = headers.map((header, index) => {
      const values = rows.map(row => row[index] || '').filter(v => v.trim());
      const type = this.inferColumnType(values);
      return { name: header.trim(), type };
    });

    // Create table with inferred schema
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ${tableName} (
        ${columns.map(col => `"${col.name}" ${col.type}`).join(', ')}
      );
    `;

    await dbManager.executeQuery(createTableSQL);

    // Insert data using regular INSERT statements
    if (rows.length > 0) {
      for (const row of rows) {
        const paddedRow = [...row];
        while (paddedRow.length < columns.length) {
          paddedRow.push('');
        }
        const values = paddedRow.map(value => {
          const trimmed = value.trim();
          if (trimmed === '') return 'NULL';
          if (!isNaN(Number(trimmed)) && trimmed !== '') return trimmed;
          return `'${trimmed.replace(/'/g, "''")}'`;
        }).join(', ');

        const insertSQL = `INSERT INTO ${tableName} VALUES (${values})`;
        await dbManager.executeQuery(insertSQL);
      }
    }
  }

  private static async getSampleData(dbManager: any, tableName: string): Promise<unknown[][]> {
    const result = await dbManager.executeQuery(`SELECT * FROM ${tableName} LIMIT 10`);
    return result.rows;
  }
}