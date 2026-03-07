import { create } from 'zustand';
import type { DatabaseColumn } from '@/utils/database';

export type DropZone = 'groupBy' | 'filters' | null;

interface DragDropState {
  draggedItem: DatabaseColumn | null;
  dropZone: DropZone;
  groupByColumns: DatabaseColumn[];
  filterColumns: DatabaseColumn[];
  filterValues: Record<string, string[]>;

  // Actions
  setDraggedItem: (item: DatabaseColumn | null) => void;
  setDropZone: (zone: DropZone) => void;
  addToGroupBy: (column: DatabaseColumn, index?: number) => void;
  removeFromGroupBy: (columnName: string) => void;
  moveGroupByColumn: (fromIndex: number, toIndex: number) => void;
  addToFilters: (column: DatabaseColumn, index?: number) => void;
  removeFromFilters: (columnName: string) => void;
  setFilterValues: (columnName: string, values: string[]) => void;
  clearAllFilters: () => void;
  clearAll: () => void;
}

export const useDragDropStore = create<DragDropState>((set, get) => ({
  draggedItem: null,
  dropZone: null,
  groupByColumns: [],
  filterColumns: [],
  filterValues: {},

  setDraggedItem: (item) => set({ draggedItem: item }),

  setDropZone: (zone) => set({ dropZone: zone }),

  addToGroupBy: (column, index) => set((state) => {
    const existingIndex = state.groupByColumns.findIndex(col => col.name === column.name);
    if (existingIndex === -1) {
      const newColumns = [...state.groupByColumns];
      if (index !== undefined) {
        newColumns.splice(index, 0, column);
      } else {
        newColumns.push(column);
      }
      return { groupByColumns: newColumns };
    }
    return state;
  }),

  removeFromGroupBy: (columnName) => set((state) => ({
    groupByColumns: state.groupByColumns.filter(col => col.name !== columnName)
  })),

  moveGroupByColumn: (fromIndex, toIndex) => set((state) => {
    const newGroupByColumns = [...state.groupByColumns];
    const [removed] = newGroupByColumns.splice(fromIndex, 1);
    newGroupByColumns.splice(toIndex, 0, removed);
    return { groupByColumns: newGroupByColumns };
  }),

  addToFilters: (column, index) => set((state) => {
    const existingIndex = state.filterColumns.findIndex(col => col.name === column.name);
    if (existingIndex === -1) {
      const newColumns = [...state.filterColumns];
      if (index !== undefined) {
        newColumns.splice(index, 0, column);
      } else {
        newColumns.push(column);
      }
      return {
        filterColumns: newColumns,
        filterValues: {
          ...state.filterValues,
          [column.name]: []
        }
      };
    }
    return state;
  }),

  removeFromFilters: (columnName) => set((state) => {
    const newFilterValues = { ...state.filterValues };
    delete newFilterValues[columnName];

    return {
      filterColumns: state.filterColumns.filter(col => col.name !== columnName),
      filterValues: newFilterValues
    };
  }),

  setFilterValues: (columnName, values) => set((state) => ({
    filterValues: {
      ...state.filterValues,
      [columnName]: values
    }
  })),

  clearAllFilters: () => set({
    filterColumns: [],
    filterValues: {}
  }),

  clearAll: () => set({
    groupByColumns: [],
    filterColumns: [],
    filterValues: {}
  })
}));