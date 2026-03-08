import { useEffect, useState, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { FileUpload } from './components/FileUpload';
import { Sidebar } from './components/layout/Sidebar';
import { GroupByZone } from './components/GroupByZone';
import { FiltersZone } from './components/FiltersZone';
import { MeasuresZone } from './components/MeasuresZone';
import { ResultsTable } from './components/ResultsTable';
import { ChartPanel } from './components/ChartPanel';
import { Splitter } from './components/Splitter';
import { ResizablePanel } from './components/ResizablePanel';
import { ProgressIndicator, useProgressState } from './components/ProgressIndicator';
import { useFileValidation } from './hooks/useFileValidation';
import { FileProcessor } from './services/fileProcessing';
import { DatabaseManager } from './utils/database';
import { QueryBuilderService } from './services/queryBuilder';
import { MemoryManager } from './utils/memory';
import { useDragDropStore } from './stores/dragDropStore';
import { ColumnChip } from './components/ColumnChip';
import type { DatabaseColumn, QueryResult } from './utils/database';

function App() {
  const [currentTable, setCurrentTable] = useState<string | null>(null);
  const [columns, setColumns] = useState<DatabaseColumn[]>([]);
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [availableValues, setAvailableValues] = useState<Record<string, string[]>>({});
  const [isLoadingValues, setIsLoadingValues] = useState<Record<string, boolean>>({});

  const { progress, stage, isProcessing, error, startProcessing, updateProgress, completeProcessing, reset } = useProgressState();
  const { validateFile } = useFileValidation();
  const {
    setDraggedItem,
    addToGroupBy,
    addToFilters,
    addToMeasures,
    moveGroupByColumn,
    moveMeasureColumn,
    groupByColumns,
    filterColumns,
    measureColumns,
    filterValues,
    draggedItem,
    dateGranularity,
    clearAll,
    collapseAllZones
  } = useDragDropStore();

  const dbManager = DatabaseManager.getInstance();
  const memoryManager = MemoryManager.getInstance();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === 'column') {
      setDraggedItem(active.data.current.column);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    // Reset dragged item state when drag ends
    setDraggedItem(null);

    if (!over) {
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Handle drops from sidebar to zones
    if (activeId.startsWith('column-')) {
      const column = active.data.current?.column;
      if (!column) return;

      const overGroupByItemIndex = groupByColumns.findIndex(col => col.name === overId);
      const overFilterItemIndex = filterColumns.findIndex(col => col.name === overId);
      const overMeasureItemIndex = measureColumns.findIndex(col => col.name === overId);

      if (overId === 'group-by-zone') {
        addToGroupBy(column); // Add to end of group by zone
      } else if (overGroupByItemIndex !== -1) {
        // Dropped over an existing item in Group By zone, insert at its index
        addToGroupBy(column, overGroupByItemIndex);
      } else if (overId === 'filters-zone' || overFilterItemIndex !== -1) {
        addToFilters(column, overFilterItemIndex !== -1 ? overFilterItemIndex : undefined);
        refreshAvailableValues(column.name);
      } else if (overId === 'measures-zone' || overMeasureItemIndex !== -1) {
        addToMeasures(column, overMeasureItemIndex !== -1 ? overMeasureItemIndex : undefined);
      }
      return;
    }

    // Handle sorting within Group By zone
    const activeIndex = groupByColumns.findIndex(col => col.name === activeId);
    if (activeIndex !== -1) {
      const overIndex = groupByColumns.findIndex(col => col.name === overId);

      if (overIndex !== -1 && activeIndex !== overIndex) {
        moveGroupByColumn(activeIndex, overIndex);
      } else if (overId === 'group-by-zone') {
        moveGroupByColumn(activeIndex, groupByColumns.length - 1);
      }
      return;
    }

    // Handle sorting within Measures zone
    const activeMeasureIndex = measureColumns.findIndex(col => col.name === activeId);
    if (activeMeasureIndex !== -1) {
      const overIndex = measureColumns.findIndex(col => col.name === overId);

      if (overIndex !== -1 && activeMeasureIndex !== overIndex) {
        moveMeasureColumn(activeMeasureIndex, overIndex);
      } else if (overId === 'measures-zone') {
        moveMeasureColumn(activeMeasureIndex, measureColumns.length - 1);
      }
    }
  };

  const refreshAvailableValues = async (columnName: string) => {
    if (!currentTable) return;

    setIsLoadingValues(prev => ({ ...prev, [columnName]: true }));
    try {
      const query = `SELECT DISTINCT "${columnName}" FROM ${currentTable} WHERE "${columnName}" IS NOT NULL ORDER BY "${columnName}" LIMIT 1000`;
      const result = await dbManager.executeQuery(query);
      const values = result.rows.map(row => String(row[0]));

      setAvailableValues(prev => ({
        ...prev,
        [columnName]: values
      }));
    } catch (err) {
      console.error(`Failed to fetch values for ${columnName}: `, err);
    } finally {
      setIsLoadingValues(prev => ({ ...prev, [columnName]: false }));
    }
  };

  const handleFileSelect = async (file: File) => {
    console.log('Starting file processing for:', file.name);
    reset();
    clearAll();
    setAvailableValues({});
    setIsLoadingValues({});
    startProcessing('Validating file...');

    try {
      // Validate file
      updateProgress(10, 'Validating file format...');
      console.log('Validating file...');
      const isValid = await validateFile(file);
      console.log('File validation result:', isValid);

      if (!isValid) {
        console.log('File validation failed, resetting...');
        setTimeout(() => {
          reset();
        }, 3000);
        return;
      }

      // Process file
      updateProgress(30, 'Processing file...');
      console.log('Starting file processing...');
      const result = await FileProcessor.processFile(file, dbManager);
      console.log('File processing result:', result);

      // Update state
      setCurrentTable(result.tableName);
      setColumns(result.schema.columns);
      setIsDataLoaded(true);

      // Get initial data preview
      updateProgress(80, 'Loading data preview...');
      console.log('Loading data preview...');
      const previewQuery = `SELECT * FROM ${result.tableName} LIMIT 10`;
      const previewResult = await dbManager.executeQuery(previewQuery);
      console.log('Preview result:', previewResult);
      setQueryResult(previewResult);

      // Track memory usage
      memoryManager.addTable(result.tableName);

      console.log('Processing complete!');
      completeProcessing();

    } catch (error) {
      console.error('File processing failed:', error);
      updateProgress(0, 'Processing failed');
      setTimeout(() => reset(), 3000);
    }
  };

  const runAnalysis = useCallback(async () => {
    if (!currentTable || !isDataLoaded) return;

    try {
      const startTime = Date.now();
      const result = QueryBuilderService.generateQuery(currentTable, columns);
      
      if (!result.isValid) {
        console.error('Query generation failed:', result.errors);
        return;
      }

      console.log('Running analysis query:', result.sql);
      const queryResponse = await dbManager.executeQuery(result.sql);
      
      setQueryResult({
        ...queryResponse,
        executionTime: Date.now() - startTime
      });
    } catch (err) {
      console.error('Analysis query failed:', err);
    }
  }, [currentTable, isDataLoaded, groupByColumns, measureColumns, filterValues, dateGranularity, columns]);

  // Re-run analysis when query state changes
  useEffect(() => {
    if (isDataLoaded) {
      runAnalysis();
    }
  }, [runAnalysis, isDataLoaded]);

  const handleColumnSelect = (column: DatabaseColumn) => {
    console.log('Column selected:', column.name);
    // In a real implementation, this could open a column details panel
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {!isDataLoaded ? (
        // Upload State
        <div className="min-h-screen flex items-center justify-center p-8">
          <div className="w-full max-w-4xl">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 mb-6 shadow-lg shadow-purple-500/30">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
                Data Explorer
              </h1>
              <p className="text-xl text-purple-200 max-w-2xl mx-auto">
                Transform your data into insights. Upload CSV or Parquet files and explore with powerful queries — all in your browser.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-8 mb-12 max-w-2xl mx-auto">
              {[
                { icon: 'M13 10V3L4 14h7v7l9-11h-7z', label: 'Fast', desc: 'In-browser processing' },
                { icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', label: 'Secure', desc: 'Data stays local' },
                { icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', label: 'Powerful', desc: 'SQL queries' },
              ].map((item, i) => (
                <div key={i} className="text-center group">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4 transition-all duration-300 group-hover:bg-white/20 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-purple-500/20">
                    <svg className="w-7 h-7 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                    </svg>
                  </div>
                  <p className="text-white font-bold text-lg mb-1 tracking-tight">{item.label}</p>
                  <p className="text-purple-300/80 text-sm leading-tight px-2">{item.desc}</p>
                </div>
              ))}
            </div>

            {isProcessing || error ? (
              <ProgressIndicator
                isProcessing={isProcessing}
                progress={progress}
                stage={stage}
                error={error || undefined}
              />
            ) : (
              <FileUpload
                onFileSelect={handleFileSelect}
                disabled={isProcessing}
              />
            )}

            <p className="text-center text-purple-400 text-sm mt-8">
              Powered by DuckDB WASM • No server required
            </p>
          </div>
        </div>
      ) : (
        // Main Application State
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="h-screen flex">
            {/* Sidebar */}
            <Sidebar
              columns={columns}
              onColumnSelect={handleColumnSelect}
              className="flex-shrink-0"
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Header */}
              <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900">
                      {currentTable ? `Table: ${currentTable}` : 'Data Explorer'}
                    </h1>
                    <p className="text-sm text-gray-600">
                      {columns.length} columns • Drag dimensions and metrics to explore
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIsDataLoaded(false);
                      setCurrentTable(null);
                      setColumns([]);
                      setQueryResult(null);
                      setAvailableValues({});
                      setIsLoadingValues({});
                      clearAll();
                      reset();
                    }}
                    className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                  >
                    Upload New File
                  </button>
                </div>
              </div>

              {/* Content Area */}
              <div 
                className="flex-1 flex flex-col overflow-hidden p-6 space-y-6"
                onClick={() => collapseAllZones()}
              >
                {/* Query Builder Zones */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <GroupByZone />
                  <FiltersZone
                    availableValues={availableValues}
                    isLoadingValues={isLoadingValues}
                  />
                  <MeasuresZone />
                </div>

                {/* Results - Split View */}
                <div className="flex-1 min-h-0 flex bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                  {queryResult ? (
                    <>
                      {/* Left: Chart Panel */}
                      <ResizablePanel id="chart-panel">
                        <ChartPanel result={queryResult} />
                      </ResizablePanel>

                      {/* Middle: Splitter */}
                      <Splitter />

                      {/* Right: Table Panel */}
                      <ResizablePanel id="table-panel" className="flex-1">
                        <ResultsTable
                          result={queryResult}
                          className="h-full w-full"
                          sortable={true}
                          executionTime={queryResult.executionTime}
                        />
                      </ResizablePanel>
                    </>
                  ) : (
                    <div className="flex-1 bg-white p-12 text-center flex flex-col items-center justify-center">
                      <div className="text-6xl mb-6 grayscale opacity-20">📊</div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2 leading-tight">No Query Results Yet</h3>
                      <p className="max-w-xs text-slate-500 text-sm leading-relaxed">
                        Drag columns into **Group By** or **Measures** above to build your visualization and see the results.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <DragOverlay dropAnimation={null}>
            {draggedItem ? (
              <div className="z-[9999] pointer-events-none shadow-2xl">
                <ColumnChip
                  column={draggedItem}
                  className="bg-white/95 scale-105 ring-2 ring-blue-500/50 shadow-xl"
                  showHandle={true}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}

export default App;
