import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useDragDropStore } from '@/stores/dragDropStore';
import type { DatabaseColumn } from '@/utils/database';
import { ColumnChip, getColumnTypeColor } from '@/components/ColumnChip';

interface FiltersZoneProps {
  className?: string;
  availableValues?: Record<string, string[]>;
  isLoadingValues?: boolean;
}

interface FilterSectionProps {
  column: DatabaseColumn;
  selectedValues: string[];
  availableValues: string[];
  onValuesChange: (values: string[]) => void;
  onRemove: (columnName: string) => void;
  isLoading?: boolean;
}

function FilterSection({
  column,
  selectedValues,
  availableValues,
  onValuesChange,
  onRemove,
  isLoading = false
}: FilterSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredValues = availableValues.filter(value =>
    value.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleValueToggle = (value: string) => {
    const newSelected = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    onValuesChange(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedValues.length === filteredValues.length) {
      onValuesChange([]);
    } else {
      onValuesChange(filteredValues);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden shrink-0">
      {/* Filter Header */}
      <div className={cn('p-2', getColumnTypeColor(column.type))}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-black/10 rounded transition-colors"
            >
              <svg
                className={cn('w-3.5 h-3.5 transition-transform', isExpanded ? 'rotate-90' : '')}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium truncate">{column.name}</h4>
              <p className="text-[10px] opacity-70">({column.type})</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] opacity-70 whitespace-nowrap">
              {selectedValues.length}/{availableValues.length}
            </span>
            <button
              onClick={() => onRemove(column.name)}
              className="p-1 hover:bg-black/10 rounded transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Content */}
      {isExpanded && (
        <div className="p-3 bg-white">
          {/* Search and Controls */}
          <div className="mb-3 space-y-2">
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
                placeholder="Search values..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="text-xs"
              >
                {selectedValues.length === filteredValues.length ? 'Deselect all' : 'Select all'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onValuesChange([])}
                className="text-xs text-gray-500"
              >
                Clear
              </Button>
            </div>
          </div>

          {/* Values List */}
          <div className="max-h-48 overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Loading values...</p>
              </div>
            ) : filteredValues.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <p className="text-sm">
                  {searchQuery ? 'No values match your search' : 'No values available'}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredValues.map((value, index) => (
                  <label
                    key={index}
                    className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedValues.includes(value)}
                      onChange={() => handleValueToggle(value)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-900 flex-1 truncate" title={value}>
                      {value || '(null)'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {/* Could show count here if available */}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function FiltersZone({
  className,
  availableValues = {},
  isLoadingValues = false
}: FiltersZoneProps) {
  const {
    filterColumns,
    filterValues,
    removeFromFilters,
    setFilterValues,
  } = useDragDropStore();

  const { setNodeRef, isOver } = useDroppable({
    id: 'filters-zone',
  });

  const handleFilterValuesChange = (columnName: string, values: string[]) => {
    setFilterValues(columnName, values);
  };

  const handleClearAllFilters = () => {
    filterColumns.forEach(col => removeFromFilters(col.name));
  };

  return (
    <div className={cn('bg-white rounded-lg border border-gray-200 p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 text-green-600">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
          <span className="text-xs text-gray-500">({filterColumns.length})</span>
        </div>

        {filterColumns.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAllFilters}
            className="text-gray-500 hover:text-red-600"
          >
            Clear all
          </Button>
        )}
      </div>

      <div
        ref={setNodeRef}
        id="filters-zone"
        className={cn(
          'min-h-[60px] p-3 border-2 border-dashed border-gray-300 rounded-lg transition-colors',
          'hover:border-green-400 hover:bg-green-50/50',
          filterColumns.length > 0 && 'border-solid border-gray-200 bg-gray-50',
          isOver && 'border-green-500 bg-green-50'
        )}
      >
        {filterColumns.length === 0 ? (
          <div className="text-center py-3 text-gray-500">
            <div className="text-2xl mb-2">🔍</div>
            <p className="text-sm">Drag dimensions here to add filters</p>
            <p className="text-xs text-gray-400 mt-1">Select specific values to focus your analysis</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filterColumns.map((column) => (
              <FilterSection
                key={column.name}
                column={column}
                selectedValues={filterValues[column.name] || []}
                availableValues={availableValues[column.name] || []}
                onValuesChange={(values) => handleFilterValuesChange(column.name, values)}
                onRemove={removeFromFilters}
                isLoading={isLoadingValues}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}