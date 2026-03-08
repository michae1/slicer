import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { DatabaseColumn } from '@/utils/database';
import { cn } from '@/lib/utils';

interface ColumnVisibilityToggleProps {
  columns: DatabaseColumn[];
  hiddenColumns: Set<string>;
  onToggle: (columnName: string) => void;
  className?: string;
}

export function ColumnVisibilityToggle({ 
  columns, 
  hiddenColumns, 
  onToggle,
  className 
}: ColumnVisibilityToggleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredColumns = useMemo(() => {
    if (!search.trim()) return columns;
    const lowerSearch = search.toLowerCase();
    return columns.filter(col => col.name.toLowerCase().includes(lowerSearch));
  }, [columns, search]);

  const visibleCount = useMemo(() => {
    return columns.filter(col => !hiddenColumns.has(col.name)).length;
  }, [columns, hiddenColumns]);

  return (
    <div className={cn("relative inline-block", className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
      >
        <span className="text-sm font-medium">Columns</span>
        <span className="bg-slate-100 px-1.5 py-0.5 rounded-full text-xs text-slate-600">
          {visibleCount}/{columns.length}
        </span>
      </Button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 z-[100] overflow-hidden flex flex-col max-h-[70vh] ring-1 ring-black/5">
            <div className="p-2 border-bottom border-slate-100">
              <input
                type="text"
                placeholder="Search columns..."
                className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>
            
            <div className="overflow-y-auto py-1">
              {filteredColumns.map((col) => {
                const isHidden = hiddenColumns.has(col.name);
                return (
                  <label
                    key={col.name}
                    className="flex items-center px-4 py-2 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      checked={!isHidden}
                      onChange={() => onToggle(col.name)}
                    />
                    <span className="ml-3 text-sm text-slate-700 truncate flex-1">
                      {col.name}
                    </span>
                    <span className="ml-2 text-[10px] text-slate-400 font-mono">
                      {col.type.substring(0, 3)}
                    </span>
                  </label>
                );
              })}

              {filteredColumns.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-slate-500">
                  No columns found
                </div>
              )}
            </div>
            
            <div className="p-2 bg-slate-50 border-t border-slate-100 flex justify-between">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs h-8"
                onClick={() => {
                   columns.forEach(c => {
                     if (hiddenColumns.has(c.name)) onToggle(c.name);
                   });
                }}
              >
                All
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs h-8"
                onClick={() => {
                   columns.forEach(c => {
                     if (!hiddenColumns.has(c.name)) onToggle(c.name);
                   });
                }}
              >
                None
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
