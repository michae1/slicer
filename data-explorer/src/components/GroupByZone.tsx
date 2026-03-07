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

  const getTypeColor = (type: string): string => {
    const upperType = type.toUpperCase();
    if (upperType.includes('INT') || upperType.includes('DECIMAL')) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    }
    if (upperType.includes('FLOAT') || upperType.includes('DOUBLE')) {
      return 'bg-purple-100 text-purple-800 border-purple-200';
    }
    return 'bg-green-100 text-green-800 border-green-200';
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-move transition-all',
        'hover:shadow-sm',
        isDragging ? 'opacity-50 shadow-lg' : 'opacity-100',
        getTypeColor(column.type)
      )}
    >
      <span className="text-sm font-medium">{column.name}</span>
      <span className="text-xs opacity-75">({column.type})</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(column.name);
        }}
        className="ml-1 p-0.5 hover:bg-white/20 rounded transition-colors"
      >
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
      <div className="ml-1 text-xs opacity-60">⋮⋮</div>
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

  const handleDragStart = (event: DragStartEvent) => {
    // Drag start is handled at App level
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      return;
    }

    // Handle dropping a column from sidebar to Group By zone
    if (over.id === 'group-by-zone' && draggedItem) {
      addToGroupBy(draggedItem);
      return;
    }

    // Handle sorting within the Group By zone
    if (over.id === 'group-by-zone' || groupByColumns.some(col => col.name === over.id)) {
      if (active.id !== over.id) {
        const activeId = active.id as string;
        const isFromSidebar = activeId.startsWith('column-');
        
        // If dropping from sidebar, add the column
        if (isFromSidebar && draggedItem) {
          addToGroupBy(draggedItem);
          return;
        }
        
        // If reordering within Group By zone
        const oldIndex = groupByColumns.findIndex(col => col.name === activeId);
        const newIndex = over.id === 'group-by-zone' 
          ? groupByColumns.length 
          : groupByColumns.findIndex(col => col.name === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          moveGroupByColumn(oldIndex, newIndex);
        }
      }
    }
  };

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

      <DragOverlay>
        {draggedItem ? (
          <div className={cn(
            'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-white shadow-lg',
            'opacity-90'
          )}>
            <span className="text-sm font-medium">{draggedItem.name}</span>
            <span className="text-xs text-gray-500">({draggedItem.type})</span>
          </div>
        ) : null}
      </DragOverlay>
    </div>
  );
}