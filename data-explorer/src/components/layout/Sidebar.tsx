import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { DatabaseColumn } from '@/utils/database';

interface SidebarProps {
  columns: DatabaseColumn[];
  onColumnSelect?: (column: DatabaseColumn) => void;
  className?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface DraggableColumnProps {
  column: DatabaseColumn;
  activeSection: 'dimensions' | 'metrics';
  onColumnSelect?: (column: DatabaseColumn) => void;
}

function DraggableColumn({ column, activeSection, onColumnSelect }: DraggableColumnProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `column-${column.name}`,
    data: {
      type: 'column',
      column: column,
    },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onColumnSelect?.(column)}
      className={cn(
        'p-3 bg-white rounded-lg border border-gray-200 cursor-pointer transition-all',
        'hover:border-blue-300 hover:shadow-sm',
        'active:scale-95',
        activeSection === 'dimensions' ? 'hover:border-green-300' : 'hover:border-purple-300',
        isDragging && 'opacity-50 shadow-lg'
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <svg
              className={cn(
                'w-4 h-4 transition-colors',
                activeSection === 'dimensions' ? 'text-green-500' : 'text-purple-500'
              )}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              {activeSection === 'dimensions' ? (
                <path d="M7 2a2 2 0 00-2 2v1h2V4a2 2 0 012-2h2a2 2 0 012 2v1h2V4a2 2 0 012-2h2a2 2 0 012 2v1a2 2 0 01-2 2h-2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6h-2a2 2 0 01-2-2V4z" />
              ) : (
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
              )}
            </svg>
            <h4 className="text-sm font-medium text-gray-900">{column.name}</h4>
          </div>
          <p className="text-xs text-gray-500 mt-1">{column.type}</p>
          {column.nullable && (
            <span className="inline-block mt-1 px-1.5 py-0.5 bg-red-100 text-red-600 text-xs rounded">
              Nullable
            </span>
          )}
        </div>
        <div className="flex items-center space-x-1">
          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6L6 10L10 14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </div>
  );
}

export function Sidebar({
  columns,
  onColumnSelect,
  className,
  isCollapsed = false,
  onToggleCollapse
}: SidebarProps) {
  const [activeSection, setActiveSection] = useState<'dimensions' | 'metrics'>('dimensions');
  const [searchQuery, setSearchQuery] = useState('');

  const getDataTypeCategory = (type: string): 'dimensions' | 'metrics' => {
    const upperType = type.toUpperCase();
    if (
      upperType.includes('INT') || 
      upperType.includes('DECIMAL') || 
      upperType.includes('NUMERIC') ||
      upperType.includes('FLOAT') || 
      upperType.includes('DOUBLE') || 
      upperType.includes('REAL')
    ) {
      return 'metrics';
    }
    return 'dimensions';
  };

  const filteredColumns = columns.filter(column => {
    const matchesSearch = column.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = getDataTypeCategory(column.type) === activeSection;
    return matchesSearch && matchesCategory;
  });

  if (isCollapsed) {
    return (
      <div className={cn('w-12 bg-gray-50 border-r border-gray-200', className)}>
        <div className="flex flex-col h-full">
          <div className="p-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              className="w-8 h-8"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('w-80 bg-gray-50 border-r border-gray-200 flex flex-col', className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Data Explorer</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="w-8 h-8"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Button>
        </div>

        {/* Section Tabs */}
        <div className="flex space-x-1 bg-white rounded-lg p-1">
          <button
            onClick={() => setActiveSection('dimensions')}
            className={cn(
              'flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors',
              activeSection === 'dimensions'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            🏷️ Dimensions
          </button>
          <button
            onClick={() => setActiveSection('metrics')}
            className={cn(
              'flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors',
              activeSection === 'metrics'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            📊 Metrics
          </button>
        </div>

        {/* Search */}
        <div className="mt-3">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder={`Search ${activeSection}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Column List */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredColumns.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-2xl mb-2">
              {activeSection === 'dimensions' ? '🏷️' : '📊'}
            </div>
            <p className="text-sm">
              No {activeSection} found
              {searchQuery && ' matching your search'}
            </p>
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="mt-2"
              >
                Clear search
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredColumns.map((column, index) => (
              <DraggableColumn
                key={`${column.name}-${index}`}
                column={column}
                activeSection={activeSection}
                onColumnSelect={onColumnSelect}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="text-xs text-gray-500 text-center">
          {activeSection === 'dimensions' ? (
            <p>Drag dimensions to Group By or Filters</p>
          ) : (
            <p>Select metrics for aggregations</p>
          )}
        </div>
      </div>
    </div>
  );
}