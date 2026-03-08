import { cn } from '@/lib/utils';
import type { DatabaseColumn } from '@/utils/database';
import { shortenType } from '@/utils/dataFormatters';

interface ColumnChipProps {
    column: DatabaseColumn;
    isDragging?: boolean;
    onRemove?: (columnName: string) => void;
    className?: string;
    showRemove?: boolean;
    showHandle?: boolean;
}

export const getColumnTypeColor = (type: string): string => {
    const upperType = type.toUpperCase();
    if (
        upperType.includes('INT') ||
        upperType.includes('DECIMAL') ||
        upperType.includes('NUMERIC') ||
        upperType.includes('FLOAT') ||
        upperType.includes('DOUBLE') ||
        upperType.includes('REAL')
    ) {
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
    return 'bg-green-100 text-green-800 border-green-200';
};

export function ColumnChip({
    column,
    isDragging,
    onRemove,
    className,
    showRemove = false,
    showHandle = false
}: ColumnChipProps) {
    return (
        <div
            className={cn(
                'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-left w-full sm:w-auto',
                'hover:shadow-sm select-none',
                isDragging ? 'opacity-30 shadow-lg border-dashed' : 'opacity-100',
                getColumnTypeColor(column.type),
                className
            )}
        >
            <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="text-sm font-medium truncate">{column.name}</span>
                <span className="text-[10px] opacity-70 whitespace-nowrap">({shortenType(column.type)})</span>
            </div>

            {showRemove && onRemove && (
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onRemove(column.name);
                    }}
                    className="p-0.5 hover:bg-black/10 rounded transition-colors"
                >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            )}

            {showHandle && (
                <div className="text-xs opacity-40 cursor-grab">⋮⋮</div>
            )}
        </div>
    );
}
