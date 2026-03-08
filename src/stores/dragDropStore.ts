import { create } from 'zustand';
import type { DatabaseColumn } from '@/utils/database';

export type DropZone = 'groupBy' | 'filters' | 'measures' | null;
export type DateGranularity = 'none' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';

export interface MeasureColumn extends DatabaseColumn {
  aggregation?: string;
}

interface DragDropState {
  draggedItem: DatabaseColumn | null;
  dropZone: DropZone;
  groupByColumns: DatabaseColumn[];
  filterColumns: DatabaseColumn[];
  measureColumns: MeasureColumn[];
  filterValues: Record<string, string[]>;
  isGroupByExpanded: boolean;
  isFiltersExpanded: boolean;
  isMeasuresExpanded: boolean;
  dateGranularity: DateGranularity;
  hiddenColumns: Set<string>;
  isSidebarCollapsed: boolean;
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc' | null;

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
  addToMeasures: (column: DatabaseColumn, index?: number) => void;
  removeFromMeasures: (columnName: string) => void;
  updateMeasureAggregation: (columnName: string, aggregation: string) => void;
  moveMeasureColumn: (fromIndex: number, toIndex: number) => void;
  setGroupByExpanded: (expanded: boolean) => void;
  setFiltersExpanded: (expanded: boolean) => void;
  setMeasuresExpanded: (expanded: boolean) => void;
  setDateGranularity: (granularity: DateGranularity) => void;
  toggleColumnVisibility: (columnName: string) => void;
  setHiddenColumns: (columnNames: Set<string>) => void;
  toggleSidebar: () => void;
  collapseAllZones: () => void;
  setSort: (column: string | null, direction: 'asc' | 'desc' | null) => void;
  clearAll: () => void;
}

export const useDragDropStore = create<DragDropState>((set, get) => ({
  draggedItem: null,
  dropZone: null,
  groupByColumns: [],
  filterColumns: [],
  measureColumns: [],
  filterValues: {},
  isGroupByExpanded: false,
  isFiltersExpanded: false,
  isMeasuresExpanded: false,
  dateGranularity: 'none',
  hiddenColumns: new Set<string>(),
  isSidebarCollapsed: false,
  sortColumn: null,
  sortDirection: null,

  setDraggedItem: (item) => set({ draggedItem: item }),

  setDropZone: (zone) => set({ dropZone: zone }),

  addToGroupBy: (column, index) => set((state) => {
    if (state.groupByColumns.length >= 5) {
      return state;
    }
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
    if (state.filterColumns.length >= 5) {
      return state;
    }
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

  addToMeasures: (column, index) => set((state) => {
    // Check type is numeric (validation shouldn't ideally just be here, but good safeguard)
    if (!['INTEGER', 'BIGINT', 'DOUBLE', 'FLOAT'].includes(column.type.toUpperCase()) && 
        !column.type.toLowerCase().includes('int') && 
        !column.type.toLowerCase().includes('float') && 
        !column.type.toLowerCase().includes('double') && 
        !column.type.toLowerCase().includes('numeric') && 
        !column.type.toLowerCase().includes('decimal')) {
      return state;
    }
      
    // Check max 5 (requirement 1)
    if (state.measureColumns.length >= 5) {
      return state;
    }

    const existingIndex = state.measureColumns.findIndex(col => col.name === column.name);
    if (existingIndex === -1) {
      const newColumns = [...state.measureColumns];
      const measureCol: MeasureColumn = { ...column, aggregation: 'SUM' };
      if (index !== undefined) {
        newColumns.splice(index, 0, measureCol);
      } else {
        newColumns.push(measureCol);
      }
      return { measureColumns: newColumns };
    }
    return state;
  }),

  removeFromMeasures: (columnName) => set((state) => ({
    measureColumns: state.measureColumns.filter(col => col.name !== columnName)
  })),

  updateMeasureAggregation: (columnName, aggregation) => set((state) => ({
    measureColumns: state.measureColumns.map(col => 
      col.name === columnName ? { ...col, aggregation } : col
    )
  })),

  moveMeasureColumn: (fromIndex, toIndex) => set((state) => {
    const newMeasureColumns = [...state.measureColumns];
    const [removed] = newMeasureColumns.splice(fromIndex, 1);
    newMeasureColumns.splice(toIndex, 0, removed);
    return { measureColumns: newMeasureColumns };
  }),

  setGroupByExpanded: (expanded) => set({ isGroupByExpanded: expanded }),
  setFiltersExpanded: (expanded) => set({ isFiltersExpanded: expanded }),
  setMeasuresExpanded: (expanded) => set({ isMeasuresExpanded: expanded }),
  setDateGranularity: (granularity) => set({ dateGranularity: granularity }),

  toggleColumnVisibility: (columnName) => set((state) => {
    const newHidden = new Set(state.hiddenColumns);
    if (newHidden.has(columnName)) {
      newHidden.delete(columnName);
    } else {
      newHidden.add(columnName);
    }
    return { hiddenColumns: newHidden };
  }),

  setHiddenColumns: (columnNames) => set({ hiddenColumns: columnNames }),

  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setSort: (column, direction) => set({ sortColumn: column, sortDirection: direction }),

  collapseAllZones: () => set({ 
    isGroupByExpanded: false, 
    isFiltersExpanded: false,
    isMeasuresExpanded: false 
  }),

  clearAll: () => set({
    groupByColumns: [],
    filterColumns: [],
    measureColumns: [],
    filterValues: {},
    isGroupByExpanded: false,
    isFiltersExpanded: false,
    isMeasuresExpanded: false,
    dateGranularity: 'none',
    hiddenColumns: new Set<string>(),
    isSidebarCollapsed: false,
    sortColumn: null,
    sortDirection: null
  })
}));