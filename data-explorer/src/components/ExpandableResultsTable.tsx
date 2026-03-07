import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { QueryResult } from '@/utils/database';

interface ExpandableResultsTableProps {
  result: QueryResult;
  className?: string;
  groupedData?: boolean;
  maxRows?: number;
}

interface GroupedRow {
  key: string;
  values: any[];
  children: any[][];
  expanded: boolean;
  level: number;
}

export function ExpandableResultsTable({
  result,
  className,
  groupedData = false,
  maxRows = 10000
}: ExpandableResultsTableProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  const { columns, rows } = result;

  // Group data by first few columns for demonstration
  const groupedRows = useMemo(() => {
    if (!groupedData || columns.length < 2) return [];

    const groups: Map<string, GroupedRow> = new Map();
    
    rows.forEach((row, index) => {
      // Create group key from first 1-2 columns
      const groupKey = row.slice(0, Math.min(2, columns.length - 1)).join(' | ');
      
      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          key: groupKey,
          values: row.slice(0, Math.min(2, columns.length - 1)),
          children: [],
          expanded: expandedGroups.has(groupKey),
          level: 0
        });
      }
      
      groups.get(groupKey)!.children.push(row);
    });

    return Array.from(groups.values()).map((group, index) => ({
      ...group,
      index
    }));
  }, [rows, columns, groupedData, expandedGroups]);

  const handleGroupToggle = (groupKey: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
  };

  const handleRowSelect = (rowIndex: number, selected: boolean) => {
    const newSelectedRows = new Set(selectedRows);
    if (selected) {
      newSelectedRows.add(rowIndex);
    } else {
      newSelectedRows.delete(rowIndex);
    }
    setSelectedRows(newSelectedRows);
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'NULL';
    
    if (typeof value === 'number') {
      if (value >= 1000000) {
        return value.toLocaleString();
      }
      if (value % 1 !== 0) {
        return value.toLocaleString(undefined, { 
          minimumFractionDigits: 2, 
          maximumFractionDigits: 6 
        });
      }
      return value.toLocaleString();
    }
    
    if (typeof value === 'boolean') {
      return value ? 'TRUE' : 'FALSE';
    }
    
    if (typeof value === 'string' && value.length > 50) {
      return value.substring(0, 47) + '...';
    }
    
    return String(value);
  };

  if (rows.length === 0) {
    return (
      <div className={cn('bg-white rounded-lg border border-gray-200 p-8', className)}>
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Results</h3>
          <p className="text-sm">Your query returned no data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className || ''}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Results</h3>
            <p className="text-sm text-gray-600">
              {groupedData 
                ? `${groupedRows.length} groups • ${rows.length} total rows`
                : `${rows.length.toLocaleString()} rows • ${columns.length} columns`
              }
              {rows.length > maxRows && (
                <span className="ml-2 text-yellow-600">
                  (showing first {maxRows.toLocaleString()})
                </span>
              )}
            </p>
          </div>
          {groupedData && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setExpandedGroups(new Set(groupedRows.map(g => g.key)))}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                Expand All
              </button>
              <button
                onClick={() => setExpandedGroups(new Set())}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Collapse All
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-h-96">
        <table className="min-w-full">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-6 py-3 w-12 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {groupedData ? 'Group' : '#'}
              </th>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {groupedData ? (
              groupedRows.map((group, groupIndex) => (
                <React.Fragment key={group.key}>
                  {/* Group Header */}
                  <tr className="bg-blue-50 hover:bg-blue-100">
                    <td className="px-6 py-3">
                      <button
                        onClick={() => handleGroupToggle(group.key)}
                        className="flex items-center space-x-2 text-blue-700 hover:text-blue-900"
                      >
                        <svg
                          className={cn(
                            'w-4 h-4 transition-transform',
                            group.expanded ? 'rotate-90' : ''
                          )}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="text-sm font-medium">
                          {group.children.length} rows
                        </span>
                      </button>
                    </td>
                    {group.values.map((value, index) => (
                      <td
                        key={index}
                        className="px-6 py-3 text-sm font-medium text-blue-900"
                      >
                        {formatValue(value)}
                      </td>
                    ))}
                    {/* Fill remaining columns */}
                    {columns.slice(group.values.length).map((_, index) => (
                      <td key={`empty-${index}`} className="px-6 py-3"></td>
                    ))}
                  </tr>

                  {/* Group Children */}
                  {group.expanded && group.children.map((row, rowIndex) => (
                    <tr
                      key={`${group.key}-${rowIndex}`}
                      className="hover:bg-gray-50 pl-8 border-l-2 border-blue-200"
                    >
                      <td className="px-6 py-3 text-sm text-gray-500">
                        {rowIndex + 1}
                      </td>
                      {row.map((cell, cellIndex) => (
                        <td
                          key={cellIndex}
                          className="px-6 py-3 text-sm text-gray-900"
                        >
                          <div className="max-w-xs truncate" title={String(cell || 'NULL')}>
                            {formatValue(cell)}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </React.Fragment>
              ))
            ) : (
              rows.slice(0, maxRows).map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={cn(
                    'hover:bg-gray-50 transition-colors',
                    selectedRows.has(rowIndex) && 'bg-blue-50'
                  )}
                >
                  <td className="px-6 py-3 text-sm font-medium text-gray-900">
                    {rowIndex + 1}
                  </td>
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="px-6 py-3 text-sm text-gray-900"
                    >
                      <div className="max-w-xs truncate" title={String(cell || 'NULL')}>
                        {formatValue(cell)}
                      </div>
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-50 text-center text-xs text-gray-500 border-t border-gray-200">
        {groupedData ? (
          <p>
            Grouped view • Click group headers to expand/collapse • 
            {expandedGroups.size} of {groupedRows.length} groups expanded
          </p>
        ) : (
          <p>Interactive data table • Click to select rows</p>
        )}
      </div>
    </div>
  );
}