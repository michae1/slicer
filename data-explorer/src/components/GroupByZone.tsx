import React from 'react';
import {
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
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
    draggedItem,
  } = useDragDropStore();

  const { setNodeRef, isOver } = useDroppable({
    id: 'group-by-zone',
  });

  const handleRemove = (columnName: string) => {
    removeFromGroupBy(columnName);
  };

  const handleClearAll = () => {
    groupByColumns.forEach(col => removeFromGroupBy(col.name));
  };

  return (
    <div className={cn('bg-white rounded-lg border border-gray-200 p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 text-blue-600">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-900">Group By</h3>
          <span className="text-xs text-gray-500">({groupByColumns.length})</span>
        </div>

        {groupByColumns.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="text-gray-500 hover:text-red-600"
          >
            Clear all
          </Button>
        )}
      </div>

      <div
        ref={setNodeRef}
        id="group-by-zone"
        className={cn(
          'min-h-[60px] p-3 border-2 border-dashed border-gray-300 rounded-lg transition-colors',
          'hover:border-blue-400 hover:bg-blue-50/50',
          groupByColumns.length > 0 && 'border-solid border-gray-200 bg-gray-50',
          isOver && 'border-blue-500 bg-blue-50'
        )}
      >
        {groupByColumns.length === 0 ? (
          <div className="text-center py-3 text-gray-500">
            <div className="text-2xl mb-2">🗂️</div>
            <p className="text-sm">Drag dimensions here to group data</p>
            <p className="text-xs text-gray-400 mt-1">Create aggregations by grouping data</p>
          </div>
        ) : (
          <SortableContext
            items={groupByColumns.map(col => col.name)}
            strategy={verticalListSortingStrategy}
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
        )}
      </div>
    </div>
  );
}