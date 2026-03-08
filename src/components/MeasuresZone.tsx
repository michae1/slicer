import React, { useEffect } from 'react';
import {
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useDragDropStore, type MeasureColumn } from '@/stores/dragDropStore';
import { ColumnChip } from '@/components/ColumnChip';

interface MeasuresZoneProps {
  className?: string;
}

interface SortableMeasureChipProps {
  column: MeasureColumn;
  onRemove: (columnName: string) => void;
  onAggregationChange: (columnName: string, aggregation: string) => void;
}

const AGGREGATIONS = ['SUM', 'AVG', 'MIN', 'MAX', 'COUNT'];

function SortableMeasureChip({ column, onRemove, onAggregationChange }: SortableMeasureChipProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.name });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn("cursor-move flex flex-col gap-1 items-start bg-blue-50/50 p-1.5 rounded-lg border border-blue-100", isDragging && "opacity-50")}
    >
      <ColumnChip
        column={column}
        isDragging={isDragging}
        onRemove={onRemove}
        showRemove={true}
        showHandle={true}
      />
      
      {/* Aggregation Select */}
      {/* use onPointerDown capture to prevent drag on select click */}
      <select 
        className="text-xs bg-white border border-gray-200 rounded px-1.5 py-1 text-gray-700 w-full hover:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
        value={column.aggregation || 'SUM'}
        onChange={(e) => onAggregationChange(column.name, e.target.value)}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {AGGREGATIONS.map(agg => (
          <option key={agg} value={agg}>{agg}</option>
        ))}
      </select>
    </div>
  );
}

export function MeasuresZone({ className }: MeasuresZoneProps) {
  const {
    measureColumns,
    addToMeasures,
    removeFromMeasures,
    moveMeasureColumn,
    updateMeasureAggregation,
    isMeasuresExpanded,
    setMeasuresExpanded,
  } = useDragDropStore();

  const { setNodeRef, isOver } = useDroppable({
    id: 'measures-zone',
  });

  // Auto-expand when a column is added
  useEffect(() => {
    if (measureColumns.length > 0) {
      setMeasuresExpanded(true);
    }
  }, [measureColumns.length]);

  // Auto-expand during drag over
  useEffect(() => {
    if (isOver) {
      setMeasuresExpanded(true);
    }
  }, [isOver]);

  const handleRemove = (columnName: string) => {
    removeFromMeasures(columnName);
  };

  const handleClearAll = () => {
    measureColumns.forEach(col => removeFromMeasures(col.name));
  };

  return (
    <div className={cn('bg-white rounded-lg border border-gray-200 flex flex-col relative', className)}>
      <div className="flex items-center justify-between p-3 border-b border-gray-100">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 text-purple-600">
            <svg fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-900">Метрики / Measures</h3>
          <span className="text-xs text-gray-500">({measureColumns.length})</span>
        </div>

        <div className="flex items-center space-x-1">
          {measureColumns.length > 0 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="h-8 text-[11px] text-gray-500 hover:text-red-600 px-2"
              >
                Clear all
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMeasuresExpanded(!isMeasuresExpanded)}
                className="h-8 w-8 p-0"
              >
                <svg
                  className={cn('w-4 h-4 transition-transform', isMeasuresExpanded ? 'rotate-180' : '')}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Drop Area - Fixed Height */}
      <div
        ref={setNodeRef}
        id="measures-zone"
        onClick={() => setMeasuresExpanded(!isMeasuresExpanded)}
        className={cn(
          'p-3 transition-colors touch-none h-[64px] flex items-center justify-center cursor-pointer',
          isOver && 'bg-purple-50 border-2 border-dashed border-purple-400 rounded-b-lg'
        )}
      >
        {measureColumns.length === 0 ? (
          <div className="flex items-center space-x-2 text-gray-400">
            <span className="text-lg">📈</span>
            <span className="text-xs">Drag numeric fields here</span>
          </div>
        ) : (
          <div className="text-xs text-purple-600 font-medium bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
            {measureColumns.length} measure{measureColumns.length > 1 ? 's' : ''} active
          </div>
        )}
      </div>

      {/* Expanded Content Panel - Overlay */}
      {isMeasuresExpanded && measureColumns.length > 0 && (
        <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-[60] bg-white rounded-lg border border-gray-200 shadow-xl p-4 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
          <div className="max-h-[300px] overflow-y-auto pr-1">
            <SortableContext
              items={measureColumns.map(col => col.name)}
              strategy={rectSortingStrategy}
            >
              <div className="flex flex-wrap gap-2">
                {measureColumns.map((column) => (
                  <SortableMeasureChip
                    key={column.name}
                    column={column}
                    onRemove={handleRemove}
                    onAggregationChange={updateMeasureAggregation}
                  />
                ))}
              </div>
            </SortableContext>
          </div>
        </div>
      )}
    </div>
  );
}
