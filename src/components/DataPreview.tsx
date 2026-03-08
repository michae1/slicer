import React from 'react';
import { cn } from '@/lib/utils';

interface DataPreviewProps {
  tableName: string;
  rowCount: number;
  columns: Array<{
    name: string;
    type: string;
    nullable: boolean;
  }>;
  sampleData: any[][];
  className?: string;
}

export function DataPreview({
  tableName,
  rowCount,
  columns,
  sampleData,
  className
}: DataPreviewProps) {
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'NULL';
    if (typeof value === 'string' && value.length > 50) {
      return value.substring(0, 47) + '...';
    }
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    return String(value);
  };

  const getTypeColor = (type: string): string => {
    const upperType = type.toUpperCase();
    if (upperType.includes('INT') || upperType.includes('FLOAT') || upperType.includes('DECIMAL')) {
      return 'text-blue-600 bg-blue-100';
    }
    if (upperType.includes('CHAR') || upperType.includes('TEXT') || upperType.includes('VARCHAR')) {
      return 'text-green-600 bg-green-100';
    }
    if (upperType.includes('DATE') || upperType.includes('TIME')) {
      return 'text-purple-600 bg-purple-100';
    }
    if (upperType.includes('BOOL')) {
      return 'text-orange-600 bg-orange-100';
    }
    return 'text-gray-600 bg-gray-100';
  };

  return (
    <div className={cn('bg-white rounded-lg border shadow-sm', className)}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Data Preview</h3>
            <p className="text-sm text-gray-600">
              Table: <span className="font-medium">{tableName}</span> • 
              <span className="ml-1">{rowCount.toLocaleString()} rows</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">
              Showing <span className="font-medium">{Math.min(10, rowCount)}</span> of{' '}
              <span className="font-medium">{rowCount.toLocaleString()}</span> rows
            </p>
          </div>
        </div>
      </div>

      {/* Schema Information */}
      <div className="px-6 py-4 border-b border-gray-100">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Schema</h4>
        <div className="flex flex-wrap gap-2">
          {columns.map((column, index) => (
            <div
              key={index}
              className={cn(
                'px-2 py-1 rounded text-xs font-medium',
                getTypeColor(column.type)
              )}
            >
              <span className="font-semibold">{column.name}</span>
              <span className="ml-1 opacity-75">({column.type})</span>
              {column.nullable && (
                <span className="ml-1 text-red-500" title="Nullable">?</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Sample Data Table */}
      <div className="overflow-x-auto">
        {sampleData.length > 0 ? (
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Row
                </th>
                {columns.map((column, index) => (
                  <th
                    key={index}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {column.name}
                    <div className={cn('text-xs mt-0.5', getTypeColor(column.type))}>
                      {column.type}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sampleData.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {rowIndex + 1}
                  </td>
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                    >
                      <div className="max-w-xs truncate" title={String(cell)}>
                        {formatValue(cell)}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">No sample data available</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-50 text-center">
        <p className="text-xs text-gray-500">
          Ready to start analysis • Drag dimensions and metrics to explore your data
        </p>
      </div>
    </div>
  );
}