export interface MemoryStats {
  used: number;
  total: number;
  percentage: number;
}

export class MemoryManager {
  private static instance: MemoryManager;
  private currentTables: Set<string> = new Set();

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  getMemoryStats(): MemoryStats {
    if ('memory' in performance) {
      const mem = (performance as any).memory;
      return {
        used: mem.usedJSHeapSize,
        total: mem.totalJSHeapSize,
        percentage: (mem.usedJSHeapSize / mem.totalJSHeapSize) * 100
      };
    }
    
    return {
      used: 0,
      total: 0,
      percentage: 0
    };
  }

  getMemoryUsageMB(): number {
    const stats = this.getMemoryStats();
    return stats.used / (1024 * 1024);
  }

  isMemoryUsageHigh(): boolean {
    return this.getMemoryUsageMB() > 100; // 100MB threshold
  }

  addTable(tableName: string) {
    this.currentTables.add(tableName);
  }

  removeTable(tableName: string) {
    this.currentTables.delete(tableName);
  }

  clearAllTables() {
    this.currentTables.clear();
  }

  getCurrentTables(): string[] {
    return Array.from(this.currentTables);
  }

  getTableCount(): number {
    return this.currentTables.size;
  }

  // Suggest data sampling for large datasets
  shouldSampleData(rowCount: number): boolean {
    return rowCount > 100000; // Sample if more than 100k rows
  }

  // Get suggested limit for large datasets
  getSuggestedLimit(rowCount: number): number {
    if (this.isMemoryUsageHigh()) {
      return Math.min(1000, Math.floor(rowCount / 10));
    }
    return Math.min(10000, rowCount);
  }

  // Format memory size for display
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}