import type { QueryResult } from '@/utils/database';

export interface CacheEntry<T = any> {
  id: string;
  key: string;
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  size: number;
  metadata?: Record<string, any>;
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  misses: number;
  hits: number;
  evictions: number;
  expiredEntries: number;
}

export interface CacheConfig {
  maxSize: number;
  maxEntries: number;
  defaultTTL: number;
  cleanupInterval: number;
}

export class QueryCache {
  private static instance: QueryCache;
  private cache = new Map<string, CacheEntry>();
  private config: CacheConfig;
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    expiredEntries: 0
  };

  private constructor(config?: Partial<CacheConfig>) {
    this.config = {
      maxSize: 100 * 1024 * 1024, // 100MB
      maxEntries: 1000,
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      cleanupInterval: 60 * 1000, // 1 minute
      ...config
    };

    // Start cleanup interval
    this.startCleanupTimer();
  }

  static getInstance(config?: Partial<CacheConfig>): QueryCache {
    if (!QueryCache.instance) {
      QueryCache.instance = new QueryCache(config);
    }
    return QueryCache.instance;
  }

  set(key: string, data: QueryResult, ttl?: number, metadata?: Record<string, any>): void {
    // Check if we need to evict entries
    while (this.cache.size >= this.config.maxEntries || this.getCurrentSize() > this.config.maxSize) {
      this.evictLeastRecentlyUsed();
    }

    const entry: CacheEntry = {
      id: this.generateId(),
      key,
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL,
      accessCount: 0,
      lastAccessed: Date.now(),
      size: this.calculateSize(data),
      metadata
    };

    this.cache.set(key, entry);
  }

  get(key: string): QueryResult | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if entry has expired
    if (this.isExpired(entry)) {
      this.delete(key);
      this.stats.expiredEntries++;
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.stats.hits++;

    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (this.isExpired(entry)) {
      this.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  getStats(): CacheStats {
    return {
      totalEntries: this.cache.size,
      totalSize: this.getCurrentSize(),
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
      hits: this.stats.hits,
      misses: this.stats.misses,
      evictions: this.stats.evictions,
      expiredEntries: this.stats.expiredEntries
    };
  }

  generateQueryKey(
    sql: string,
    parameters: Record<string, any> = {},
    tableName?: string
  ): string {
    const normalizedSql = sql.replace(/\s+/g, ' ').trim().toLowerCase();
    const normalizedParams = JSON.stringify(parameters, Object.keys(parameters).sort());
    const key = `${normalizedSql}:${normalizedParams}`;
    
    // Use a simple hash for the key to keep it shorter
    return this.hashString(key);
  }

  optimizeForQuery(query: string): void {
    // Pre-validate query and perform any query-specific optimizations
    const optimized = query
      .replace(/\bSELECT\s+\*\s+/gi, 'SELECT ')
      .replace(/\bORDER\s+BY\s+\*/gi, 'ORDER BY 1')
      .replace(/\bLIMIT\s+\d+,\s*\d+/gi, 'LIMIT $2 OFFSET $1');

    // Store optimized version hints in metadata
    // In a real implementation, you might analyze query patterns
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private calculateSize(data: QueryResult): number {
    // Rough calculation of memory usage
    let size = 0;
    
    // Estimate string content size
    data.columns.forEach(col => size += col.length * 2); // Unicode characters
    data.rows.forEach(row => {
      row.forEach(cell => {
        if (typeof cell === 'string') {
          size += cell.length * 2;
        } else if (typeof cell === 'number') {
          size += 8; // 8 bytes for number
        } else if (cell === null) {
          size += 4; // null pointer
        }
      });
    });

    return size;
  }

  private getCurrentSize(): number {
    let totalSize = 0;
    for (const entry of this.cache.values()) {
      totalSize += entry.size;
    }
    return totalSize;
  }

  private evictLeastRecentlyUsed(): void {
    if (this.cache.size === 0) return;

    let lruKey = '';
    let lruTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < lruTime) {
        lruTime = entry.lastAccessed;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
      this.stats.evictions++;
    }
  }

  private startCleanupTimer(): void {
    setInterval(() => {
      this.cleanupExpired();
    }, this.config.cleanupInterval);
  }

  private cleanupExpired(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));
    this.stats.expiredEntries += expiredKeys.length;
  }

  // Warm up cache with common queries
  warmup(tableName: string, columns: string[]): void {
    const commonQueries = [
      `SELECT COUNT(*) FROM ${tableName}`,
      `SELECT * FROM ${tableName} LIMIT 10`
    ];

    commonQueries.forEach(query => {
      const key = this.generateQueryKey(query, {}, tableName);
      // In a real implementation, you might pre-execute these queries
      // For now, just store metadata hints
      this.set(key, { 
        columns: [], 
        rows: [], 
        rowCount: 0 
      } as QueryResult, this.config.defaultTTL, {
        warmedUp: true,
        queryType: 'common'
      });
    });
  }

  // Invalidate cache entries related to a specific table
  invalidateTable(tableName: string): void {
    const keysToDelete: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (key.includes(tableName)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }
}