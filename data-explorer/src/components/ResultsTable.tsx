import { useState, useMemo, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { QueryResult } from '@/utils/database';

interface ResultsTableProps {
  result: QueryResult;
  className?: string;
  sortable?: boolean;
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  maxRows?: number;
  executionTime?: number;
}

interface SortState {
  column: string | null;
  direction: 'asc' | 'desc' | null;
}

const PAGE_SIZE = 100;

const escapeCSVValue = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

const convertToCSV = (columns: string[], rows: unknown[][]): string => {
  const header = columns.map(escapeCSVValue).join(',');
  const dataRows = rows.map(row => row.map(escapeCSVValue).join(','));
  return [header, ...dataRows].join('\n');
};

const downloadCSV = (csv: string, filename: string): void => {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export function ResultsTable({
  result,
  className,
  sortable = true,
  onSort,
  maxRows = 10000,
  executionTime
}: ResultsTableProps) {
  const [sortState, setSortState] = useState<SortState>({
    column: null,
    direction: null
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [isExporting, setIsExporting] = useState(false);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const bodyScrollRef = useRef<HTMLDivElement>(null);

  const { columns, rows } = result;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const csv = convertToCSV(columns, rows);
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      downloadCSV(csv, `export_${timestamp}.csv`);
    } finally {
      setIsExporting(false);
    }
  };

  const totalPages = Math.ceil(rows.length / pageSize);
  const startRow = (currentPage - 1) * pageSize;
  const endRow = Math.min(startRow + pageSize, rows.length);

  const handleSort = (columnIndex: number) => {
    if (!sortable) return;

    const column = columns[columnIndex];
    const newDirection: 'asc' | 'desc' =
      sortState.column === column && sortState.direction === 'asc' ? 'desc' : 'asc';

    setSortState({
      column,
      direction: newDirection
    });

    onSort?.(column, newDirection);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTop = 0;
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  // Memoized sorted data
  const sortedData = useMemo(() => {
    if (!sortState.column || !sortState.direction) {
      return rows;
    }

    const columnIndex = columns.indexOf(sortState.column);
    if (columnIndex === -1) return rows;

    return [...rows].sort((a, b) => {
      const aVal = a[columnIndex];
      const bVal = b[columnIndex];

      // Handle null values
      if (aVal === null || aVal === undefined) return sortState.direction === 'asc' ? -1 : 1;
      if (bVal === null || bVal === undefined) return sortState.direction === 'asc' ? 1 : -1;

      // Handle numeric values
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortState.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }

      // Handle string values
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();

      if (aStr < bStr) return sortState.direction === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortState.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [rows, columns, sortState]);

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'NULL';

    if (typeof value === 'number') {
      // Format large numbers with commas
      if (value >= 1000000) {
        return value.toLocaleString();
      }
      // Format decimals
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

  const getSortIcon = (columnIndex: number) => {
    const column = columns[columnIndex];
    if (sortState.column !== column) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }

    return sortState.direction === 'asc' ? (
      <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    );
  };

  if (rows.length === 0) {
    return (
      <div className={cn('bg-white rounded-lg border border-gray-200 p-4 md:p-8', className)}>
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Results</h3>
          <p className="text-sm">Your query returned no data. Try adjusting your filters or Group By settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('bg-white rounded-lg border border-gray-200 flex flex-col', className)}>
      {/* Header */}
      <div className="px-4 md:px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Results</h3>
            <p className="text-sm text-gray-600">
              {rows.length.toLocaleString()} rows • {columns.length} columns
              {rows.length > maxRows && (
                <span className="ml-2 text-yellow-600">
                  (showing first {maxRows.toLocaleString()})
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center space-x-2 flex-wrap gap-2">
            {executionTime !== undefined && (
              <span className="text-xs md:text-sm text-gray-500">
                {executionTime.toFixed(2)}ms
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={isExporting || rows.length === 0}
            >
              {isExporting ? 'Exporting...' : 'Export CSV'}
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Horizontal scroll header */}
        <div
          ref={headerRef}
          className="overflow-hidden border-b border-gray-200 bg-gray-50"
        >
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="px-6 py-3 w-12 sticky left-0 bg-gray-50 z-10 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  #
                </th>
                {columns.map((column, index) => (
                  <th
                    key={index}
                    className={cn(
                      'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]',
                      sortable && 'cursor-pointer hover:bg-gray-100'
                    )}
                    onClick={() => handleSort(index)}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{column}</span>
                      {sortable && getSortIcon(index)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
          </table>
        </div>

        {/* Scrollable body */}
        <div
          ref={bodyScrollRef}
          className="overflow-auto flex-1"
        >
          <table className="min-w-full">
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedData.slice(startRow, Math.min(endRow, maxRows)).map((row, relativeIndex) => {
                const rowIndex = startRow + relativeIndex;
                return (
                  <tr
                    key={rowIndex}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 w-12 sticky left-0 bg-white z-10 text-sm font-medium text-gray-900">
                      {rowIndex + 1}
                    </td>
                    {row.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        className={cn(
                          'px-6 py-4 text-sm min-w-[150px]',
                          cell === null || cell === undefined ? 'text-gray-400 italic' : 'text-gray-900'
                        )}
                      >
                        <div className="max-w-xs truncate" title={String(cell || 'NULL')}>
                          {formatValue(cell)}
                        </div>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {rows.length > pageSize && (
        <div className="px-4 md:px-6 py-3 bg-gray-50 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between gap-2 md:gap-0">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={250}>250</option>
                <option value={500}>500</option>
              </select>
            </div>
            <span className="text-sm text-gray-600 hidden sm:inline">
              Showing {startRow + 1}-{Math.min(endRow, rows.length)} of {rows.length.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center space-x-1 md:space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
            >
              <span className="hidden md:inline">First</span>
              <span className="md:hidden">«</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <span className="hidden md:inline">Previous</span>
              <span className="md:hidden">‹</span>
            </Button>
            <span className="text-sm text-gray-600 px-1 md:px-2">
              {currentPage}/{totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <span className="hidden md:inline">Next</span>
              <span className="md:hidden">›</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
            >
              <span className="hidden md:inline">Last</span>
              <span className="md:hidden">»</span>
            </Button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 md:px-6 py-3 bg-gray-50 text-center text-xs text-gray-500 border-t border-gray-200">
        {executionTime !== undefined && (
          <p className="mb-1">
            Query executed in <span className="font-medium">{executionTime.toFixed(2)}ms</span>
          </p>
        )}
        {sortState.column && sortState.direction && (
          <p>
            Sorted by <span className="font-medium">{sortState.column}</span> in{' '}
            <span className="font-medium">{sortState.direction}</span>ending order
          </p>
        )}
        {!sortState.column && (
          <p>Click column headers to sort • Use filters to refine results</p>
        )}
      </div>
    </div>
  );
}