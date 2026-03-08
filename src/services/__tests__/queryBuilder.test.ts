import { QueryBuilderService } from '../queryBuilder';
import { useDragDropStore } from '@/stores/dragDropStore';
import type { DatabaseColumn } from '@/utils/database';
import { shortenType } from '@/utils/dataFormatters';

// Mock the drag-drop store
jest.mock('@/stores/dragDropStore', () => ({
  useDragDropStore: {
    getState: jest.fn()
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

const mockGetState = useDragDropStore.getState as jest.Mock;

describe('QueryBuilderService', () => {
  const mockColumns: DatabaseColumn[] = [
    { name: 'id', type: 'INTEGER', nullable: false },
    { name: 'name', type: 'VARCHAR', nullable: true },
    { name: 'age', type: 'INTEGER', nullable: true },
    { name: 'salary', type: 'DECIMAL', nullable: true }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetState.mockReturnValue({
      groupByColumns: [],
      filterColumns: [],
      measureColumns: [],
      filterValues: {},
      dateGranularity: 'none'
    });
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
      mockGetState.mockReturnValue({
        groupByColumns: [{ name: 'name', type: 'VARCHAR', nullable: true }],
        filterColumns: [],
        measureColumns: [],
        filterValues: {},
        dateGranularity: 'none'
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

  describe('generateQuery with grouping and measures', () => {
    beforeEach(() => {
      mockGetState.mockReturnValue({
        groupByColumns: [{ name: 'department', type: 'VARCHAR', nullable: true }],
        filterColumns: [],
        measureColumns: [{ name: 'salary', type: 'DECIMAL', nullable: true, aggregation: 'SUM' }],
        filterValues: {},
        dateGranularity: 'none'
      });
    });

    it('should generate correct SQL for Measures with default SUM aggregation', () => {
      const result = QueryBuilderService.generateQuery('employees', mockColumns);

      // Verify that SUM(salary) as ... is generated
      expect(result.sql).toContain('SUM("salary") as "salary_sum"');
      expect(result.sql).toContain('GROUP BY "department"');
    });
  });

  describe('generateQuery with filters', () => {
    it('should generate WHERE clause with IN operator', () => {
      mockGetState.mockReturnValue({
        groupByColumns: [],
        filterColumns: [{ name: 'name', type: 'VARCHAR', nullable: true }],
        measureColumns: [],
        filterValues: {
          name: ['Alice', 'Bob']
        },
        dateGranularity: 'none'
      });

      const result = QueryBuilderService.generateQuery('users', mockColumns);

      expect(result.sql).toContain('WHERE');
      expect(result.sql).toContain('"name" IN');
      expect(result.sql).toContain("'Alice'");
      expect(result.sql).toContain("'Bob'");
    });

    it('should escape single quotes in filter values', () => {
      mockGetState.mockReturnValue({
        groupByColumns: [],
        filterColumns: [{ name: 'name', type: 'VARCHAR', nullable: true }],
        measureColumns: [],
        filterValues: {
          name: ["O'Brien"]
        },
        dateGranularity: 'none'
      });

      const result = QueryBuilderService.generateQuery('users', mockColumns);

      expect(result.sql).toContain("'O''Brien'");
    });

    it('should handle NULL values in filters', () => {
      mockGetState.mockReturnValue({
        groupByColumns: [],
        filterColumns: [{ name: 'name', type: 'VARCHAR', nullable: true }],
        measureColumns: [],
        filterValues: {
          name: ['']
        },
        dateGranularity: 'none'
      });

      const result = QueryBuilderService.generateQuery('users', mockColumns);

      expect(result.sql).toContain('NULL');
    });

    it('should generate range filters for date columns', () => {
      mockGetState.mockReturnValue({
        groupByColumns: [],
        filterColumns: [{ name: 'published_at', type: 'TIMESTAMP', nullable: true }],
        measureColumns: [],
        filterValues: {
          published_at: ['range:2024-01-01;2024-12-31']
        },
        dateGranularity: 'none'
      });

      const result = QueryBuilderService.generateQuery('posts', [
        { name: 'published_at', type: 'TIMESTAMP', nullable: true }
      ]);

      expect(result.sql).toContain('BETWEEN');
      expect(result.sql).toContain("'2024-01-01'::TIMESTAMP");
      expect(result.sql).toContain("'2024-12-31'::TIMESTAMP");
    });

    it('should handle partial range filters (After only)', () => {
      mockGetState.mockReturnValue({
        groupByColumns: [],
        filterColumns: [{ name: 'published_at', type: 'TIMESTAMP', nullable: true }],
        measureColumns: [],
        filterValues: {
          published_at: ['range:2024-01-01;']
        },
        dateGranularity: 'none'
      });

      const result = QueryBuilderService.generateQuery('posts', [
        { name: 'published_at', type: 'TIMESTAMP', nullable: true }
      ]);

      expect(result.sql).toContain('>=');
      expect(result.sql).toContain("'2024-01-01'::TIMESTAMP");
      expect(result.sql).not.toContain('BETWEEN');
    });
  });

  describe('generateQuery with date granularity', () => {
    it('should apply DATE_TRUNC to date columns', () => {
      mockGetState.mockReturnValue({
        groupByColumns: [{ name: 'created_at', type: 'TIMESTAMP', nullable: true }],
        filterColumns: [],
        measureColumns: [],
        filterValues: {},
        dateGranularity: 'month'
      });

      const result = QueryBuilderService.generateQuery('logs', [
        { name: 'created_at', type: 'TIMESTAMP', nullable: true }
      ]);

      expect(result.sql).toContain("DATE_TRUNC('month'");
      expect(result.sql).toContain('"created_at"::TIMESTAMP');
    });

    it('should handle numeric date columns with TO_TIMESTAMP', () => {
      mockGetState.mockReturnValue({
        groupByColumns: [{ name: 'created_at', type: 'BIGINT', nullable: true }],
        filterColumns: [],
        measureColumns: [],
        filterValues: {},
        dateGranularity: 'month'
      });

      const result = QueryBuilderService.generateQuery('logs', [
        { name: 'created_at', type: 'BIGINT', nullable: true }
      ]);

      expect(result.sql).toContain('CASE');
      expect(result.sql).toContain('WHEN "created_at" > 1000000000000');
      expect(result.sql).toContain('TO_TIMESTAMP');
    });
  });

  describe('shortenType utility', () => {
    it('should shorten common types', () => {
      expect(shortenType('INTEGER')).toBe('INT');
      expect(shortenType('VARCHAR')).toBe('STR');
      expect(shortenType('TIMESTAMP')).toBe('TS');
      expect(shortenType('BIGINT')).toBe('BIG');
      expect(shortenType('DOUBLE')).toBe('DBL');
    });

    it('should return original for unknown types', () => {
      expect(shortenType('BOOLEAN')).toBe('BOOL');
      expect(shortenType('UNKNOWN_TYPE')).toBe('UNKNOWN_TYPE');
    });
  });

  describe('estimateComplexity', () => {
    it('should estimate low complexity for simple queries', () => {
      mockGetState.mockReturnValue({
        groupByColumns: [],
        filterColumns: [],
        measureColumns: [],
        filterValues: {},
        dateGranularity: 'none'
      });

      const result = QueryBuilderService.generateQuery('users', mockColumns);

      expect(result.estimatedComplexity).toBe('low');
    });

    it('should warn about many group dimensions', () => {
      mockGetState.mockReturnValue({
        groupByColumns: [
          { name: 'col1', type: 'VARCHAR', nullable: true },
          { name: 'col2', type: 'VARCHAR', nullable: true },
          { name: 'col3', type: 'VARCHAR', nullable: true },
          { name: 'col4', type: 'VARCHAR', nullable: true }
        ],
        filterColumns: [],
        measureColumns: [],
        filterValues: {},
        dateGranularity: 'none'
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
