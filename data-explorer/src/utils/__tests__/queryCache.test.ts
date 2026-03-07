import { QueryCache } from '../queryCache';
import type { QueryResult } from '../database';

describe('QueryCache', () => {
  let cache: QueryCache;

  beforeEach(() => {
    QueryCache.resetInstance();
    cache = QueryCache.getInstance({ 
      maxSize: 1024 * 1024, 
      maxEntries: 10,
      defaultTTL: 1000,
      cleanupInterval: 60000
    });
  });

  afterEach(() => {
    cache.destroy();
    QueryCache.resetInstance();
  });

  describe('set and get', () => {
    it('should store and retrieve query results', () => {
      const key = 'test-query';
      const data: QueryResult = {
        columns: ['id', 'name'],
        rows: [[1, 'Alice'], [2, 'Bob']],
        rowCount: 2
      };

      cache.set(key, data);
      const result = cache.get(key);

      expect(result).toEqual(data);
    });

    it('should return null for non-existent keys', () => {
      const result = cache.get('non-existent');
      expect(result).toBeNull();
    });

    it('should update access statistics on get', () => {
      const key = 'test-query';
      const data: QueryResult = {
        columns: ['id'],
        rows: [[1]],
        rowCount: 1
      };

      cache.set(key, data);
      cache.get(key);
      cache.get(key);

      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
    });
  });

  describe('has', () => {
    it('should return true for existing keys', () => {
      const key = 'test-query';
      const data: QueryResult = {
        columns: ['id'],
        rows: [[1]],
        rowCount: 1
      };

      cache.set(key, data);
      expect(cache.has(key)).toBe(true);
    });

    it('should return false for non-existent keys', () => {
      expect(cache.has('non-existent')).toBe(false);
    });
  });

  describe('delete', () => {
    it('should remove entries from cache', () => {
      const key = 'test-query';
      const data: QueryResult = {
        columns: ['id'],
        rows: [[1]],
        rowCount: 1
      };

      cache.set(key, data);
      expect(cache.has(key)).toBe(true);

      cache.delete(key);
      expect(cache.has(key)).toBe(false);
    });
  });

  describe('clear', () => {
    it('should remove all entries from cache', () => {
      cache.set('key1', { columns: [], rows: [], rowCount: 0 });
      cache.set('key2', { columns: [], rows: [], rowCount: 0 });

      cache.clear();

      const stats = cache.getStats();
      expect(stats.totalEntries).toBe(0);
    });
  });

  describe('generateQueryKey', () => {
    it('should generate consistent keys for same queries', () => {
      const sql = 'SELECT * FROM users WHERE id = 1';
      const params = { limit: 10 };

      const key1 = cache.generateQueryKey(sql, params);
      const key2 = cache.generateQueryKey(sql, params);

      expect(key1).toBe(key2);
    });

    it('should generate different keys for different queries', () => {
      const sql1 = 'SELECT * FROM users';
      const sql2 = 'SELECT * FROM products';

      const key1 = cache.generateQueryKey(sql1);
      const key2 = cache.generateQueryKey(sql2);

      expect(key1).not.toBe(key2);
    });

    it('should normalize whitespace in SQL', () => {
      const sql1 = 'SELECT   *   FROM   users';
      const sql2 = 'SELECT * FROM users';

      const key1 = cache.generateQueryKey(sql1);
      const key2 = cache.generateQueryKey(sql2);

      expect(key1).toBe(key2);
    });
  });

  describe('getStats', () => {
    it('should track cache statistics', () => {
      const data: QueryResult = {
        columns: ['id'],
        rows: [[1]],
        rowCount: 1
      };

      cache.set('key1', data);
      cache.get('key1'); // hit
      cache.get('key2'); // miss

      const stats = cache.getStats();

      expect(stats.totalEntries).toBe(1);
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBeCloseTo(0.5);
    });
  });

  describe('eviction', () => {
    it('should evict entries when max entries reached', () => {
      QueryCache.resetInstance();
      const smallCache = QueryCache.getInstance({ 
        maxEntries: 3,
        defaultTTL: 10000,
        cleanupInterval: 60000
      });

      const data: QueryResult = { columns: [], rows: [], rowCount: 0 };

      smallCache.set('key1', data);
      smallCache.set('key2', data);
      smallCache.set('key3', data);
      
      expect(smallCache.getStats().totalEntries).toBe(3);
      
      smallCache.set('key4', data);

      expect(smallCache.getStats().totalEntries).toBe(3);
      expect(smallCache.has('key4')).toBe(true);
      
      smallCache.destroy();
    });
  });

  describe('TTL and expiration', () => {
    it('should expire entries after TTL', async () => {
      QueryCache.resetInstance();
      const shortTTLCache = QueryCache.getInstance({ 
        defaultTTL: 100,
        cleanupInterval: 60000
      });

      const data: QueryResult = { columns: [], rows: [], rowCount: 0 };
      shortTTLCache.set('key1', data, 100);

      expect(shortTTLCache.has('key1')).toBe(true);

      await new Promise(resolve => setTimeout(resolve, 150));

      expect(shortTTLCache.has('key1')).toBe(false);
      
      shortTTLCache.destroy();
    });
  });

  describe('invalidateTable', () => {
    it('should remove all entries related to a table', () => {
      const data: QueryResult = { columns: [], rows: [], rowCount: 0 };

      cache.set('users-query-1', data);
      cache.set('users-query-2', data);
      cache.set('products-query-1', data);

      cache.invalidateTable('users');

      expect(cache.has('users-query-1')).toBe(false);
      expect(cache.has('users-query-2')).toBe(false);
      expect(cache.has('products-query-1')).toBe(true);
    });
  });
});
