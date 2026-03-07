import { QueryValidator, ErrorHandler } from '../validation';

describe('QueryValidator', () => {
  describe('validateQuery', () => {
    it('should validate a correct SELECT query', () => {
      const query = 'SELECT * FROM users WHERE id = 1';
      const result = QueryValidator.validateQuery(query);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject queries without SELECT', () => {
      const query = 'FROM users';
      const result = QueryValidator.validateQuery(query);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('SELECT'))).toBe(true);
    });

    it('should reject queries without FROM', () => {
      const query = 'SELECT *';
      const result = QueryValidator.validateQuery(query);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('FROM'))).toBe(true);
    });

    it('should reject queries with blocked keywords', () => {
      const queries = [
        'DROP TABLE users',
        'DELETE FROM users',
        'INSERT INTO users VALUES (1)',
        'UPDATE users SET name = "test"',
        'ALTER TABLE users ADD COLUMN test'
      ];

      queries.forEach(query => {
        const result = QueryValidator.validateQuery(query);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.includes('Blocked keyword'))).toBe(true);
      });
    });

    it('should reject queries that are too long', () => {
      const longQuery = 'SELECT * FROM users WHERE ' + 'id = 1 OR '.repeat(1000);
      const result = QueryValidator.validateQuery(longQuery, { maxLength: 100 });

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('too long'))).toBe(true);
    });

    it('should warn about suspicious patterns', () => {
      const query = 'SELECT * FROM users -- comment';
      const result = QueryValidator.validateQuery(query);

      expect(result.warnings.some(w => w.includes('unsafe patterns'))).toBe(true);
    });

    it('should accept complex valid queries', () => {
      const query = `
        SELECT name, COUNT(*) as count
        FROM users
        WHERE age > 18 AND status IN ('active', 'pending')
        GROUP BY name
        ORDER BY count DESC
        LIMIT 100
      `;
      const result = QueryValidator.validateQuery(query);

      expect(result.isValid).toBe(true);
    });
  });

  describe('validateTableName', () => {
    it('should validate correct table names', () => {
      const validNames = ['users', 'user_data', 'Users123', '_temp_table'];

      validNames.forEach(name => {
        const result = QueryValidator.validateTableName(name);
        expect(result.isValid).toBe(true);
      });
    });

    it('should reject empty table names', () => {
      const result = QueryValidator.validateTableName('');

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('required'))).toBe(true);
    });

    it('should reject table names that are too long', () => {
      const longName = 'a'.repeat(200);
      const result = QueryValidator.validateTableName(longName);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('too long'))).toBe(true);
    });

    it('should reject table names with invalid characters', () => {
      const invalidNames = ['user-data', 'user.data', 'user data', '123users', 'user@data'];

      invalidNames.forEach(name => {
        const result = QueryValidator.validateTableName(name);
        expect(result.isValid).toBe(false);
      });
    });

    it('should reject reserved keywords as table names', () => {
      const reservedNames = ['SELECT', 'FROM', 'WHERE', 'COUNT'];

      reservedNames.forEach(name => {
        const result = QueryValidator.validateTableName(name);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.includes('reserved keyword'))).toBe(true);
      });
    });
  });

  describe('validateFile', () => {
    it('should validate correct CSV files', () => {
      const file = new File(['data'], 'test.csv', { type: 'text/csv' });
      const result = QueryValidator.validateFile(file);

      expect(result.isValid).toBe(true);
    });

    it('should validate correct Parquet files', () => {
      const file = new File(['data'], 'test.parquet', { type: 'application/octet-stream' });
      const result = QueryValidator.validateFile(file);

      expect(result.isValid).toBe(true);
    });

    it('should validate correct GeoJSON files', () => {
      const file = new File(['data'], 'test.geojson', { type: 'application/json' });
      const result = QueryValidator.validateFile(file);

      expect(result.isValid).toBe(true);
    });

    it('should reject files that are too large', () => {
      const largeData = new Uint8Array(150 * 1024 * 1024); // 150MB
      const file = new File([largeData], 'large.csv', { type: 'text/csv' });
      const result = QueryValidator.validateFile(file);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('too large'))).toBe(true);
    });

    it('should reject unsupported file formats', () => {
      const file = new File(['data'], 'test.txt', { type: 'text/plain' });
      const result = QueryValidator.validateFile(file);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Unsupported file format'))).toBe(true);
    });

    it('should reject empty files', () => {
      const file = new File([], 'empty.csv', { type: 'text/csv' });
      const result = QueryValidator.validateFile(file);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('empty'))).toBe(true);
    });

    it('should reject files with names that are too long', () => {
      const longName = 'a'.repeat(300) + '.csv';
      const file = new File(['data'], longName, { type: 'text/csv' });
      const result = QueryValidator.validateFile(file);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('too long'))).toBe(true);
    });
  });
});

describe('ErrorHandler', () => {
  describe('handleQueryError', () => {
    it('should handle syntax errors', () => {
      const error = { message: 'syntax error at line 1' };
      const result = ErrorHandler.handleQueryError(error);

      expect(result).toContain('syntax error');
    });

    it('should handle table not found errors', () => {
      const error = { message: 'no such table: users' };
      const result = ErrorHandler.handleQueryError(error);

      expect(result).toContain('does not exist');
    });

    it('should handle column not found errors', () => {
      const error = { message: 'no such column: invalid_column' };
      const result = ErrorHandler.handleQueryError(error);

      expect(result).toContain('Column does not exist');
    });

    it('should handle memory errors', () => {
      const error = { message: 'out of memory' };
      const result = ErrorHandler.handleQueryError(error);

      expect(result).toContain('memory');
    });

    it('should handle unknown errors', () => {
      const error = { message: 'unknown error' };
      const result = ErrorHandler.handleQueryError(error);

      expect(result).toContain('Query failed');
    });

    it('should handle errors without message', () => {
      const error = {};
      const result = ErrorHandler.handleQueryError(error);

      expect(result).toContain('unexpected error');
    });
  });

  describe('handleFileError', () => {
    it('should handle format errors', () => {
      const error = { message: 'invalid format' };
      const result = ErrorHandler.handleFileError(error, 'test.csv');

      expect(result).toContain('format error');
      expect(result).toContain('test.csv');
    });

    it('should handle size errors', () => {
      const error = { message: 'file size exceeds limit' };
      const result = ErrorHandler.handleFileError(error, 'large.csv');

      expect(result).toContain('too large');
      expect(result).toContain('large.csv');
    });

    it('should handle generic file errors', () => {
      const error = { message: 'read error' };
      const result = ErrorHandler.handleFileError(error, 'test.csv');

      expect(result).toContain('Failed to process');
      expect(result).toContain('test.csv');
    });
  });

  describe('handleDuckDBError', () => {
    it('should handle WASM initialization errors', () => {
      const error = { message: 'WASM initialization failed' };
      const result = ErrorHandler.handleDuckDBError(error);

      expect(result).toContain('initialization failed');
    });

    it('should handle permission errors', () => {
      const error = { message: 'permission denied' };
      const result = ErrorHandler.handleDuckDBError(error);

      expect(result).toContain('Permission denied');
    });

    it('should handle generic database errors', () => {
      const error = { message: 'connection error' };
      const result = ErrorHandler.handleDuckDBError(error);

      expect(result).toContain('Database connection error');
    });
  });
});
