import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DatabaseColumn } from '@/utils/database';
import type { GeneratedQuery } from '@/services/queryBuilder';

export interface QueryHistoryEntry {
  id: string;
  timestamp: number;
  sql: string;
  parameters: {
    selectColumns: string[];
    groupByColumns: string[];
    filterConditions: Array<{ column: string; values: string[] }>;
    orderByColumns?: string[];
    limit?: number;
  };
  tableName: string;
  executionTime?: number;
  rowCount?: number;
  status: 'success' | 'error' | 'cancelled';
  error?: string;
}

export interface QueryState {
  // Current query
  currentQuery: GeneratedQuery | null;
  tableName: string;
  columns: DatabaseColumn[];
  
  // Query history
  history: QueryHistoryEntry[];
  maxHistorySize: number;
  
  // Query settings
  autoExecute: boolean;
  defaultLimit: number;
  executionTimeout: number;
  
  // UI state
  isExecuting: boolean;
  lastExecutionTime?: number;
  totalRows: number;
  
  // Actions
  setCurrentQuery: (query: GeneratedQuery) => void;
  setTableName: (tableName: string) => void;
  setColumns: (columns: DatabaseColumn[]) => void;
  
  // History management
  addToHistory: (entry: Omit<QueryHistoryEntry, 'id' | 'timestamp'>) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;
  loadFromHistory: (id: string) => void;
  
  // Settings
  setAutoExecute: (enabled: boolean) => void;
  setDefaultLimit: (limit: number) => void;
  setExecutionTimeout: (timeout: number) => void;
  
  // Execution state
  startExecution: () => void;
  completeExecution: (success: boolean, executionTime?: number, rowCount?: number, error?: string) => void;
  
  // Query operations
  executeCurrentQuery: () => Promise<void>;
  cancelExecution: () => void;
  
  // Utility
  reset: () => void;
}

export const useQueryStore = create<QueryState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentQuery: null,
      tableName: '',
      columns: [],
      history: [],
      maxHistorySize: 50,
      autoExecute: true,
      defaultLimit: 1000,
      executionTimeout: 30000, // 30 seconds
      isExecuting: false,
      totalRows: 0,

      // Current query setters
      setCurrentQuery: (query) => {
        set((state) => {
          const newState = { ...state, currentQuery: query };
          
          // Add to history if autoExecute is enabled and it's a new query
          if (state.autoExecute && state.tableName) {
            newState.history = [
              {
                id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                timestamp: Date.now(),
                sql: query.sql,
                parameters: query.parameters,
                tableName: state.tableName,
                status: 'success'
              },
              ...state.history.slice(0, state.maxHistorySize - 1)
            ];
          }
          
          return newState;
        });
      },

      setTableName: (tableName) => {
        set((state) => ({ ...state, tableName }));
      },

      setColumns: (columns) => {
        set((state) => ({ ...state, columns }));
      },

      // History management
      addToHistory: (entry) => {
        set((state) => ({
          history: [
            {
              id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              timestamp: Date.now(),
              ...entry
            },
            ...state.history.slice(0, state.maxHistorySize - 1)
          ]
        }));
      },

      removeFromHistory: (id) => {
        set((state) => ({
          history: state.history.filter(entry => entry.id !== id)
        }));
      },

      clearHistory: () => {
        set((state) => ({ ...state, history: [] }));
      },

      loadFromHistory: (id) => {
        const entry = get().history.find(h => h.id === id);
        const currentState = get();
        if (entry && currentState.currentQuery) {
          set({
            ...currentState,
            currentQuery: {
              ...currentState.currentQuery,
              sql: entry.sql,
              parameters: entry.parameters,
              isValid: true,
              errors: [],
              warnings: [],
              estimatedComplexity: 'low'
            }
          });
        }
      },

      // Settings
      setAutoExecute: (enabled) => {
        set((state) => ({ ...state, autoExecute: enabled }));
      },

      setDefaultLimit: (limit) => {
        set((state) => ({ ...state, defaultLimit: limit }));
      },

      setExecutionTimeout: (timeout) => {
        set((state) => ({ ...state, executionTimeout: timeout }));
      },

      // Execution state
      startExecution: () => {
        set((state) => ({ 
          ...state, 
          isExecuting: true, 
          lastExecutionTime: Date.now() 
        }));
      },

      completeExecution: (success, executionTime, rowCount, error) => {
        set((state) => {
          const updates: Partial<QueryState> = {
            ...state,
            isExecuting: false,
            lastExecutionTime: executionTime,
            totalRows: rowCount || 0
          };

          // Update the latest history entry
          if (state.history.length > 0) {
            const updatedHistory = [...state.history];
            updatedHistory[0] = {
              ...updatedHistory[0],
              status: success ? 'success' : 'error',
              executionTime: executionTime,
              rowCount: rowCount,
              error: error
            };
            updates.history = updatedHistory;
          }

          return updates;
        });
      },

      // Query operations
      executeCurrentQuery: async () => {
        const { currentQuery, startExecution, completeExecution, isExecuting } = get();
        
        if (isExecuting) {
          console.warn('Query already executing');
          return;
        }

        if (!currentQuery) {
          console.warn('No current query to execute');
          return;
        }

        try {
          startExecution();
          
          // In a real implementation, this would execute the query against DuckDB
          // For now, we'll simulate execution
          const startTime = Date.now();
          
          // Simulate query execution delay
          await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 500));
          
          const executionTime = Date.now() - startTime;
          const simulatedRowCount = Math.floor(Math.random() * 1000) + 1;
          
          completeExecution(true, executionTime, simulatedRowCount);
          
        } catch (error) {
          completeExecution(false, Date.now() - get().lastExecutionTime!, 0, 
            error instanceof Error ? error.message : 'Unknown error');
        }
      },

      cancelExecution: () => {
        set((state) => ({ 
          ...state, 
          isExecuting: false 
        }));
      },

      // Utility
      reset: () => {
        set((state) => ({
          ...state,
          currentQuery: null,
          tableName: '',
          columns: [],
          isExecuting: false,
          totalRows: 0
        }));
      }
    }),
    {
      name: 'query-store',
      partialize: (state) => ({
        // Only persist certain state
        history: state.history.slice(0, 10), // Limit persisted history
        autoExecute: state.autoExecute,
        defaultLimit: state.defaultLimit,
        executionTimeout: state.executionTimeout,
        maxHistorySize: state.maxHistorySize
      })
    }
  )
);

// Query history utilities
export class QueryHistoryManager {
  static exportHistory(history: QueryHistoryEntry[]): string {
    const exportData = history.map(entry => ({
      timestamp: new Date(entry.timestamp).toISOString(),
      tableName: entry.tableName,
      sql: entry.sql,
      parameters: entry.parameters,
      executionTime: entry.executionTime,
      rowCount: entry.rowCount,
      status: entry.status,
      error: entry.error
    }));

    return JSON.stringify(exportData, null, 2);
  }

  static importHistory(jsonString: string): QueryHistoryEntry[] {
    try {
      const imported = JSON.parse(jsonString);
      return imported.map((entry: any, index: number) => ({
        id: `imported_${Date.now()}_${index}`,
        timestamp: new Date(entry.timestamp).getTime(),
        sql: entry.sql,
        parameters: entry.parameters,
        tableName: entry.tableName,
        executionTime: entry.executionTime,
        rowCount: entry.rowCount,
        status: entry.status,
        error: entry.error
      }));
    } catch (error) {
      throw new Error('Invalid history export format');
    }
  }

  static getStatistics(history: QueryHistoryEntry[]) {
    const total = history.length;
    const successful = history.filter(entry => entry.status === 'success').length;
    const failed = history.filter(entry => entry.status === 'error').length;
    const cancelled = history.filter(entry => entry.status === 'cancelled').length;
    
    const avgExecutionTime = history
      .filter(entry => entry.executionTime)
      .reduce((sum, entry) => sum + (entry.executionTime || 0), 0) / Math.max(1, successful);

    const totalRows = history
      .filter(entry => entry.rowCount)
      .reduce((sum, entry) => sum + (entry.rowCount || 0), 0);

    return {
      total,
      successful,
      failed,
      cancelled,
      successRate: total > 0 ? successful / total : 0,
      avgExecutionTime: Math.round(avgExecutionTime),
      totalRows
    };
  }

  static getMostUsedTables(history: QueryHistoryEntry[]) {
    const tableUsage: Record<string, number> = {};
    
    history.forEach(entry => {
      tableUsage[entry.tableName] = (tableUsage[entry.tableName] || 0) + 1;
    });

    return Object.entries(tableUsage)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
  }
}