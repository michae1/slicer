import { useDragDropStore, DropZone, MeasureColumn } from '../dragDropStore';
import type { DatabaseColumn } from '@/utils/database';

describe('useDragDropStore', () => {
  beforeEach(() => {
    useDragDropStore.getState().clearAll();
  });

  const createColumns = (prefix: string, count: number, type: string = 'INTEGER'): DatabaseColumn[] => {
    return Array.from({ length: count }, (_, i) => ({
      name: `${prefix}_${i}`,
      type,
      nullable: true
    }));
  };

  it('4.1 should prevent adding more than 5 items to Dimension (GroupBy) zone', () => {
    const store = useDragDropStore.getState();
    const cols = createColumns('dim', 6);
    
    // Add first 5
    for(let i=0; i<5; i++) {
      useDragDropStore.getState().addToGroupBy(cols[i]);
    }
    
    expect(useDragDropStore.getState().groupByColumns.length).toBe(5);
    
    // Attempt to add 6th
    useDragDropStore.getState().addToGroupBy(cols[5]);
    
    expect(useDragDropStore.getState().groupByColumns.length).toBe(5);
    expect(useDragDropStore.getState().groupByColumns.map(c => c.name)).not.toContain('dim_5');
  });

  it('4.1 should prevent adding more than 5 items to Filters zone', () => {
    const store = useDragDropStore.getState();
    const cols = createColumns('filter', 6);
    
    // Add first 5
    for(let i=0; i<5; i++) {
      useDragDropStore.getState().addToFilters(cols[i]);
    }
    
    expect(useDragDropStore.getState().filterColumns.length).toBe(5);
    
    // Attempt to add 6th
    useDragDropStore.getState().addToFilters(cols[5]);
    
    expect(useDragDropStore.getState().filterColumns.length).toBe(5);
    expect(useDragDropStore.getState().filterColumns.map(c => c.name)).not.toContain('filter_5');
  });

  it('4.1 should prevent adding more than 5 items to Measures zone', () => {
    const store = useDragDropStore.getState();
    const cols = createColumns('measure', 6, 'INTEGER');
    
    // Add first 5
    for(let i=0; i<5; i++) {
      useDragDropStore.getState().addToMeasures(cols[i]);
    }
    
    expect(useDragDropStore.getState().measureColumns.length).toBe(5);
    
    // Attempt to add 6th
    useDragDropStore.getState().addToMeasures(cols[5]);
    
    expect(useDragDropStore.getState().measureColumns.length).toBe(5);
    expect(useDragDropStore.getState().measureColumns.map(c => c.name)).not.toContain('measure_5');
  });

  it('4.2 should verify that non-numeric fields cannot be added to the Measures panel', () => {
    const store = useDragDropStore.getState();
    
    const numericCols = createColumns('num', 3, 'INTEGER');
    const stringCol = { name: 'str_1', type: 'VARCHAR', nullable: true };
    const dateCol = { name: 'date_1', type: 'DATE', nullable: true };
    
    // Add valid numeric columns
    useDragDropStore.getState().addToMeasures(numericCols[0]);
    useDragDropStore.getState().addToMeasures(numericCols[1]);
    
    expect(useDragDropStore.getState().measureColumns.length).toBe(2);
    
    // Attempt to add invalid column
    useDragDropStore.getState().addToMeasures(stringCol);
    expect(useDragDropStore.getState().measureColumns.length).toBe(2);
    
    // Attempt to add invalid column
    useDragDropStore.getState().addToMeasures(dateCol);
    expect(useDragDropStore.getState().measureColumns.length).toBe(2);
  });
  
  it('should set default aggregation to SUM for new measures', () => {
      const store = useDragDropStore.getState();
      const col = { name: 'sales', type: 'INTEGER', nullable: true };
      
      useDragDropStore.getState().addToMeasures(col);
      
      const measures = useDragDropStore.getState().measureColumns;
      expect(measures.length).toBe(1);
      expect(measures[0].aggregation).toBe('SUM');
  });
});
