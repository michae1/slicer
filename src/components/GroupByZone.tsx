import React, { useState, useEffect } from 'react';
import {
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
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
import { useDragDropStore } from '@/stores/dragDropStore';
import type { DatabaseColumn } from '@/utils/database';

import { ColumnChip } from '@/components/ColumnChip';

interface GroupByZoneProps {
  className?: string;
}

interface SortableChipProps {
  column: DatabaseColumn;
  onRemove: (columnName: string) => void;
}

function SortableChip({ column, onRemove }: SortableChipProps) {
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
      className="cursor-move"
    >
      <ColumnChip
        column={column}
        isDragging={isDragging}
        onRemove={onRemove}
        showRemove={true}
        showHandle={true}
      />
    </div>
  );
}

export function GroupByZone({ className }: GroupByZoneProps) {
  const {
    groupByColumns,
    addToGroupBy,
    removeFromGroupBy,
    moveGroupByColumn,
    isGroupByExpanded,
    setGroupByExpanded,
    draggedItem,
  } = useDragDropStore();

  const { setNodeRef, isOver } = useDroppable({
    id: 'group-by-zone',
  });

  // Auto-expand when a column is added
  useEffect(() => {
    if (groupByColumns.length > 0) {
      setGroupByExpanded(true);
    }
  }, [groupByColumns.length]);

  // Auto-expand during drag over
  useEffect(() => {
    if (isOver) {
      setGroupByExpanded(true);
    }
  }, [isOver]);

  const handleRemove = (columnName: string) => {
    removeFromGroupBy(columnName);
  };

  const handleClearAll = () => {
    groupByColumns.forEach(col => removeFromGroupBy(col.name));
  };

  return (
    <div className={cn('bg-white rounded-lg border border-gray-200 flex flex-col relative', className)}>
      <div className="flex items-center justify-between p-3 border-b border-gray-100">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 text-blue-600">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-900">Group By</h3>
          <span className="text-xs text-gray-500">({groupByColumns.length})</span>
        </div>

        <div className="flex items-center space-x-1">
          {groupByColumns.length > 0 && (
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
                onClick={() => setGroupByExpanded(!isGroupByExpanded)}
                className="h-8 w-8 p-0"
              >
                <svg
                  className={cn('w-4 h-4 transition-transform', isGroupByExpanded ? 'rotate-180' : '')}
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
        id="group-by-zone"
        onClick={() => setGroupByExpanded(!isGroupByExpanded)}
        className={cn(
          'p-3 transition-colors touch-none h-[64px] flex items-center justify-center cursor-pointer',
          isOver && 'bg-blue-50 border-2 border-dashed border-blue-400 rounded-b-lg'
        )}
      >
        {groupByColumns.length === 0 ? (
          <div className="flex items-center space-x-2 text-gray-400">
            <span className="text-lg">🗂️</span>
            <span className="text-xs">Drag here</span>
          </div>
        ) : (
          <div className="text-xs text-blue-600 font-medium bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 max-w-full truncate">
            <span className="opacity-70 mr-1">By:</span>
            {groupByColumns.map(c => c.name).join(', ')}
          </div>
        )}
      </div>

      {/* Expanded Content Panel - Overlay */}
      {isGroupByExpanded && groupByColumns.length > 0 && (
        <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-[60] bg-white rounded-lg border border-gray-200 shadow-xl p-4 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
          <div className="max-h-[300px] overflow-y-auto pr-1">
            <SortableContext
              items={groupByColumns.map(col => col.name)}
              strategy={rectSortingStrategy}
            >
              <div className="flex flex-wrap gap-2">
                {groupByColumns.map((column) => (
                  <SortableChip
                    key={column.name}
                    column={column}
                    onRemove={handleRemove}
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