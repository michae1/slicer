import { QueryBuilderService } from '../queryBuilder';
import type { DatabaseColumn } from '@/utils/database';

// Mock the drag-drop store
jest.mock('@/stores/dragDropStore', () => ({
  useDragDropStore: {
    getState: jest.fn(() => ({
      groupByColumns: [],
      filterColumns: [],
      filterValues: {}
    }))
  }
}));

// Mock the validation module
jest.mock('@/utils/validation', () => ({
  QueryValidator: {
    validateQuery: jest.fn(() => ({
      isValid: true,
      errors: [],
      warnings: []
    }))
  }
}));

describe('QueryBuilderService', () => {
  const mockColumns: DatabaseColumn[] = [
    { name: 'id', type: 'INTEGER', nullable: false },
    { name: 'name', type: 'VARCHAR', nullable: true },
    { name: 'age', type: 'INTEGER', nullable: true },
    { name: 'salary', type: 'DECIMAL', nullable: true }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateQuery', () => {
    it('should generate SELECT * query when no grouping', () => {
      const result = QueryBuilderService.generateQuery('users', mockColumns);

      expect(result.isValid).toBe(true);
      expect(result.sql).toContain('SELECT *');
      expect(result.sql).toContain('FROM users');
    });

    it('should fail validation with empty table name', () => {
      const result = QueryBuilderService.generateQuery('', mockColumns);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Table name is required');
    });

    it('should fail validation with no columns', () => {
      const result = QueryBuilderService.generateQuery('users', []);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('No columns available in table');
    });

    it('should include LIMIT clause by default', () => {
      const result = QueryBuilderService.generateQuery('users', mockColumns);

      expect(result.sql).toContain('LIMIT 1000');
    });

    it('should respect custom limit option', () => {
      const result = QueryBuilderService.generateQuery('users', mockColumns, { defaultLimit: 500 });

      expect(result.sql).toContain('LIMIT 500');
    });

    it('should omit ORDER BY when disabled', () => {
      const result = QueryBuilderService.generateQuery('users', mockColumns, { includeOrderBy: false });

      expect(result.sql).not.toContain('ORDER BY');
    });
  });

  describe('generateQuery with grouping', () => {
    beforeEach(() => {
      const { useDragDropStore } = require('@/stores/dragDropStore');
      useDragDropStore.getState.mockReturnValue({
        groupByColumns: [{ name: 'name', type: 'VARCHAR', nullable: true }],
        filterColumns: [],
        filterValues: {}
      });
    });

    it('should generate GROUP BY query with aggregates', () => {
      const result = QueryBuilderService.generateQuery('users', mockColumns);

      expect(result.sql).toContain('GROUP BY');
      expect(result.sql).toContain('"name"');
      expect(result.sql).toContain('COUNT');
      expect(result.sql).toContain('SUM');
      expect(result.sql).toContain('AVG');
    });

    it('should include group columns in SELECT', () => {
      const result = QueryBuilderService.generateQuery('users', mockColumns);

      expect(result.parameters.groupByColumns).toContain('name');
    });
  });

  describe('generateQuery with filters', () => {
    beforeEach(() => {
      const { useDragDropStore } = require('@/stores/dragDropStore');
      useDragDropStore.getState.mockReturnValue({
        groupByColumns: [],
        filterColumns: [{ name: 'name', type: 'VARCHAR', nullable: true }],
        filterValues: {
          name: ['Alice', 'Bob']
        }
      });
    });

    it('should generate WHERE clause with IN operator', () => {
      const result = QueryBuilderService.generateQuery('users', mockColumns);

      expect(result.sql).toContain('WHERE');
      expect(result.sql).toContain('"name" IN');
      expect(result.sql).toContain("'Alice'");
      expect(result.sql).toContain("'Bob'");
    });

    it('should escape single quotes in filter values', () => {
      const { useDragDropStore } = require('@/stores/dragDropStore');
      useDragDropStore.getState.mockReturnValue({
        groupByColumns: [],
        filterColumns: [{ name: 'name', type: 'VARCHAR', nullable: true }],
        filterValues: {
          name: ["O'Brien"]
        }
      });

      const result = QueryBuilderService.generateQuery('users', mockColumns);

      expect(result.sql).toContain("'O''Brien'");
    });

    it('should handle NULL values in filters', () => {
      const { useDragDropStore } = require('@/stores/dragDropStore');
      useDragDropStore.getState.mockReturnValue({
        groupByColumns: [],
        filterColumns: [{ name: 'name', type: 'VARCHAR', nullable: true }],
        filterValues: {
          name: ['']
        }
      });

      const result = QueryBuilderService.generateQuery('users', mockColumns);

      expect(result.sql).toContain('NULL');
    });
  });

  describe('estimateComplexity', () => {
    it('should estimate low complexity for simple queries', () => {
      const result = QueryBuilderService.generateQuery('users', mockColumns);

      expect(result.estimatedComplexity).toBe('low');
    });

    it('should warn about many group dimensions', () => {
      const { useDragDropStore } = require('@/stores/dragDropStore');
      useDragDropStore.getState.mockReturnValue({
        groupByColumns: [
          { name: 'col1', type: 'VARCHAR', nullable: true },
          { name: 'col2', type: 'VARCHAR', nullable: true },
          { name: 'col3', type: 'VARCHAR', nullable: true },
          { name: 'col4', type: 'VARCHAR', nullable: true }
        ],
        filterColumns: [],
        filterValues: {}
      });

      const result = QueryBuilderService.generateQuery('users', mockColumns);

      expect(result.warnings.some(w => w.includes('group dimensions'))).toBe(true);
    });
  });

  describe('generateDistinctValuesQuery', () => {
    it('should generate DISTINCT query for column', () => {
      const query = QueryBuilderService.generateDistinctValuesQuery('users', 'name');

      expect(query).toContain('SELECT DISTINCT');
      expect(query).toContain('"name"');
      expect(query).toContain('FROM users');
      expect(query).toContain('WHERE "name" IS NOT NULL');
      expect(query).toContain('ORDER BY');
    });

    it('should respect custom limit', () => {
      const query = QueryBuilderService.generateDistinctValuesQuery('users', 'name', 500);

      expect(query).toContain('LIMIT 500');
    });
  });

  describe('generateCountQuery', () => {
    it('should generate COUNT query without filters', () => {
      const query = QueryBuilderService.generateCountQuery('users');

      expect(query).toContain('SELECT COUNT(*) as total');
      expect(query).toContain('FROM users');
      expect(query).not.toContain('WHERE');
    });

    it('should generate COUNT query with filters', () => {
      const filters = {
        name: ['Alice', 'Bob'],
        age: ['30']
      };

      const query = QueryBuilderService.generateCountQuery('users', filters);

      expect(query).toContain('WHERE');
      expect(query).toContain('"name" IN');
      expect(query).toContain('"age" IN');
    });

    it('should escape filter values in COUNT query', () => {
      const filters = {
        name: ["O'Brien"]
      };

      const query = QueryBuilderService.generateCountQuery('users', filters);

      expect(query).toContain("'O''Brien'");
    });
  });
});
