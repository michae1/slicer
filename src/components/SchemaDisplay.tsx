import React from 'react';
import { cn } from '@/lib/utils';
import type { DatabaseColumn } from '@/utils/database';

interface SchemaDisplayProps {
  tableName: string;
  rowCount: number;
  columns: DatabaseColumn[];
  className?: string;
}

export function SchemaDisplay({
  tableName,
  rowCount,
  columns,
  className
}: SchemaDisplayProps) {
  const getTypeIcon = (type: string): string => {
    const upperType = type.toUpperCase();
    if (upperType.includes('INT') || upperType.includes('DECIMAL') || upperType.includes('NUMERIC')) {
      return '🔢';
    }
    if (upperType.includes('FLOAT') || upperType.includes('DOUBLE') || upperType.includes('REAL')) {
      return '📊';
    }
    if (upperType.includes('CHAR') || upperType.includes('TEXT') || upperType.includes('VARCHAR')) {
      return '📝';
    }
    if (upperType.includes('DATE') || upperType.includes('TIME') || upperType.includes('TIMESTAMP')) {
      return '📅';
    }
    if (upperType.includes('BOOL')) {
      return '✅';
    }
    return '📄';
  };

  const getTypeColor = (type: string): string => {
    const upperType = type.toUpperCase();
    if (upperType.includes('INT') || upperType.includes('DECIMAL') || upperType.includes('NUMERIC')) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    }
    if (upperType.includes('FLOAT') || upperType.includes('DOUBLE') || upperType.includes('REAL')) {
      return 'bg-purple-100 text-purple-800 border-purple-200';
    }
    if (upperType.includes('CHAR') || upperType.includes('TEXT') || upperType.includes('VARCHAR')) {
      return 'bg-green-100 text-green-800 border-green-200';
    }
    if (upperType.includes('DATE') || upperType.includes('TIME') || upperType.includes('TIMESTAMP')) {
      return 'bg-orange-100 text-orange-800 border-orange-200';
    }
    if (upperType.includes('BOOL')) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getDataTypeCategory = (type: string): 'dimension' | 'metric' => {
    const upperType = type.toUpperCase();
    if (
      upperType.includes('INT') || 
      upperType.includes('DECIMAL') || 
      upperType.includes('NUMERIC') ||
      upperType.includes('FLOAT') || 
      upperType.includes('DOUBLE') || 
      upperType.includes('REAL')
    ) {
      return 'metric';
    }
    return 'dimension';
  };

  const dimensions = columns.filter(col => getDataTypeCategory(col.type) === 'dimension');
  const metrics = columns.filter(col => getDataTypeCategory(col.type) === 'metric');

  return (
    <div className={cn('bg-white rounded-lg border shadow-sm', className)}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Schema: {tableName}</h3>
            <p className="text-sm text-gray-600">
              {rowCount.toLocaleString()} rows • {columns.length} columns
            </p>
          </div>
          <div className="text-right text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              <span>📊 {metrics.length} metrics</span>
              <span>🏷️ {dimensions.length} dimensions</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Dimensions Section */}
        {dimensions.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
              <span className="mr-2">🏷️</span>
              Dimensions ({dimensions.length})
              <span className="ml-2 text-xs text-gray-500">(String/Categorical fields)</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {dimensions.map((column, index) => (
                <div
                  key={index}
                  className={cn(
                    'p-3 rounded-lg border',
                    getTypeColor(column.type)
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">{getTypeIcon(column.type)}</span>
                      <div>
                        <p className="font-medium text-sm">{column.name}</p>
                        <p className="text-xs opacity-75">{column.type}</p>
                      </div>
                    </div>
                    {column.nullable && (
                      <span className="text-red-500 text-xs" title="Nullable">?</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Metrics Section */}
        {metrics.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
              <span className="mr-2">📊</span>
              Metrics ({metrics.length})
              <span className="ml-2 text-xs text-gray-500">(Numeric fields for aggregation)</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {metrics.map((column, index) => (
                <div
                  key={index}
                  className={cn(
                    'p-3 rounded-lg border',
                    getTypeColor(column.type)
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">{getTypeIcon(column.type)}</span>
                      <div>
                        <p className="font-medium text-sm">{column.name}</p>
                        <p className="text-xs opacity-75">{column.type}</p>
                      </div>
                    </div>
                    {column.nullable && (
                      <span className="text-red-500 text-xs" title="Nullable">?</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Columns Table View */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Complete Schema</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Column</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Type</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Category</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Nullable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {columns.map((column, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium">{column.name}</td>
                    <td className="px-4 py-2">
                      <span className={cn('px-2 py-1 rounded text-xs', getTypeColor(column.type))}>
                        {column.type}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span className={cn(
                        'px-2 py-1 rounded text-xs',
                        getDataTypeCategory(column.type) === 'metric' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      )}>
                        {getDataTypeCategory(column.type)}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {column.nullable ? (
                        <span className="text-red-600">Yes</span>
                      ) : (
                        <span className="text-green-600">No</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}