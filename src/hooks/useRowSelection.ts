import { useState, useCallback, useEffect } from 'react';

export interface SelectionState {
  selectedRows: Set<number>;
  selectAll: boolean;
  hasSelection: boolean;
  selectionCount: number;
}

export interface UseRowSelectionOptions {
  allowSelectAll?: boolean;
  maxSelection?: number;
  persistSelection?: boolean;
  storageKey?: string;
}

export interface UseRowSelectionReturn {
  selectedRows: Set<number>;
  selectAll: boolean;
  hasSelection: boolean;
  selectionCount: number;
  selectRow: (rowIndex: number, selected?: boolean) => void;
  selectRows: (rowIndices: number[], selected?: boolean) => void;
  toggleRow: (rowIndex: number) => void;
  selectAllRows: () => void;
  clearSelection: () => void;
  selectRange: (start: number, end: number) => void;
  isSelected: (rowIndex: number) => boolean;
  getSelectedRows: () => number[];
  setMaxSelection: (max: number) => void;
}

export function useRowSelection(
  totalRows: number,
  options: UseRowSelectionOptions = {}
): UseRowSelectionReturn {
  const {
    allowSelectAll = true,
    maxSelection,
    persistSelection = false,
    storageKey = 'row-selection'
  } = options;

  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [currentMaxSelection, setCurrentMaxSelection] = useState<number | undefined>(maxSelection);

  // Load persisted selection
  useEffect(() => {
    if (persistSelection && totalRows > 0) {
      try {
        const saved = localStorage.getItem(`${storageKey}-${totalRows}`);
        if (saved) {
          const savedSelection = JSON.parse(saved);
          if (Array.isArray(savedSelection)) {
            const validRows = savedSelection.filter((index: number) => 
              index >= 0 && index < totalRows
            );
            setSelectedRows(new Set(validRows));
          }
        }
      } catch (error) {
        console.warn('Failed to load row selection from storage:', error);
      }
    }
  }, [totalRows, persistSelection, storageKey]);

  // Persist selection
  useEffect(() => {
    if (persistSelection && selectedRows.size > 0) {
      try {
        localStorage.setItem(
          `${storageKey}-${totalRows}`,
          JSON.stringify(Array.from(selectedRows))
        );
      } catch (error) {
        console.warn('Failed to persist row selection:', error);
      }
    }
  }, [selectedRows, persistSelection, totalRows, storageKey]);

  const selectRow = useCallback((rowIndex: number, selected: boolean = true) => {
    setSelectedRows(prev => {
      const newSelection = new Set(prev);
      
      if (selected) {
        // Check max selection limit
        if (currentMaxSelection && newSelection.size >= currentMaxSelection && !newSelection.has(rowIndex)) {
          return prev; // Don't add if at limit
        }
        newSelection.add(rowIndex);
      } else {
        newSelection.delete(rowIndex);
      }
      
      return newSelection;
    });
  }, [currentMaxSelection]);

  const selectRows = useCallback((rowIndices: number[], selected: boolean = true) => {
    setSelectedRows(prev => {
      const newSelection = new Set(prev);
      
      rowIndices.forEach(index => {
        if (selected) {
          if (!currentMaxSelection || newSelection.size < currentMaxSelection || newSelection.has(index)) {
            newSelection.add(index);
          }
        } else {
          newSelection.delete(index);
        }
      });
      
      return newSelection;
    });
  }, [currentMaxSelection]);

  const toggleRow = useCallback((rowIndex: number) => {
    const isCurrentlySelected = selectedRows.has(rowIndex);
    selectRow(rowIndex, !isCurrentlySelected);
  }, [selectedRows, selectRow]);

  const selectAllRows = useCallback(() => {
    if (allowSelectAll) {
      if (currentMaxSelection && totalRows > currentMaxSelection) {
        // Select up to max limit
        setSelectedRows(new Set(Array.from({ length: currentMaxSelection }, (_, i) => i)));
      } else {
        // Select all rows
        setSelectedRows(new Set(Array.from({ length: totalRows }, (_, i) => i)));
      }
    }
  }, [allowSelectAll, totalRows, currentMaxSelection]);

  const clearSelection = useCallback(() => {
    setSelectedRows(new Set());
  }, []);

  const selectRange = useCallback((start: number, end: number) => {
    const range = [];
    const min = Math.max(0, Math.min(start, end));
    const max = Math.min(totalRows - 1, Math.max(start, end));
    
    for (let i = min; i <= max; i++) {
      range.push(i);
    }
    
    selectRows(range, true);
  }, [totalRows, selectRows]);

  const isSelected = useCallback((rowIndex: number): boolean => {
    return selectedRows.has(rowIndex);
  }, [selectedRows]);

  const getSelectedRows = useCallback((): number[] => {
    return Array.from(selectedRows).sort((a, b) => a - b);
  }, [selectedRows]);

  const setMaxSelection = useCallback((max: number) => {
    setCurrentMaxSelection(max);
    
    // If current selection exceeds new limit, trim it
    if (selectedRows.size > max) {
      setSelectedRows(prev => {
        const trimmed = new Set(Array.from(prev).slice(0, max));
        return trimmed;
      });
    }
  }, [selectedRows]);

  return {
    // State
    selectedRows,
    selectAll: selectedRows.size === totalRows,
    hasSelection: selectedRows.size > 0,
    selectionCount: selectedRows.size,
    
    // Actions
    selectRow,
    selectRows,
    toggleRow,
    selectAllRows,
    clearSelection,
    selectRange,
    isSelected,
    getSelectedRows,
    setMaxSelection
  };
}

// Hook for managing selection state in tables
export function useTableSelection(totalRows: number) {
  const {
    selectedRows,
    selectAll,
    hasSelection,
    selectionCount,
    selectRow,
    selectRows,
    toggleRow,
    selectAllRows,
    clearSelection,
    isSelected,
    getSelectedRows
  } = useRowSelection(totalRows);

  // Select all checkbox state
  const getSelectAllState = useCallback(() => {
    if (selectionCount === 0) return false;
    if (selectionCount === totalRows) return true;
    return 'indeterminate' as const;
  }, [selectionCount, totalRows]);

  const handleSelectAll = useCallback(() => {
    if (selectionCount === totalRows) {
      clearSelection();
    } else {
      selectAllRows();
    }
  }, [selectionCount, totalRows, selectAllRows, clearSelection]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'a':
          case 'A':
            event.preventDefault();
            selectAllRows();
            break;
          case 'd':
          case 'D':
            event.preventDefault();
            clearSelection();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectAllRows, clearSelection]);

  return {
    // State
    selectedRows,
    selectAll,
    hasSelection,
    selectionCount,
    
    // Actions
    selectRow,
    selectRows,
    toggleRow,
    selectAllRows: handleSelectAll,
    clearSelection,
    isSelected,
    getSelectedRows,
    getSelectAllState,
    
    // Utilities
    getSelectionSummary: () => {
      const rows = getSelectedRows();
      if (rows.length === 0) return 'No rows selected';
      if (rows.length === totalRows) return 'All rows selected';
      return `${rows.length} of ${totalRows} rows selected`;
    }
  };
}