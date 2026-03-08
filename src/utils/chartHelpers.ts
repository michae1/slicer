import { ChartType } from '@/stores/chartStore';
import { MeasureColumn } from '@/stores/dragDropStore';
import { DatabaseColumn, QueryResult } from '@/utils/database';

export interface AutoChartConfig {
  type: ChartType;
  xAxis: string | null;
  yAxis: string[];
}

export function getAutoChartConfig(
  groupByColumns: DatabaseColumn[],
  measureColumns: MeasureColumn[]
): AutoChartConfig {
  const config: AutoChartConfig = {
    type: 'bar',
    xAxis: null,
    yAxis: [],
  };

  if (groupByColumns.length > 0) {
    // Pick the first dimension as X-axis
    config.xAxis = groupByColumns[0].name;
    
    // If it's a date-like dimension, suggest Line chart
    const lowerType = groupByColumns[0].type.toLowerCase();
    if (lowerType.includes('date') || lowerType.includes('time') || lowerType.includes('timestamp')) {
      config.type = 'line';
    }
  }

  if (measureColumns.length > 0) {
    // Suggest all measures for Y-axis by default
    config.yAxis = measureColumns.map(m => m.name);
    
    // If only one measure and one dimension, Pie chart is a good alternative, 
    // but let's stick to Bar as safer default for auto-config.
  }

  return config;
}

export function mapQueryResultToChartData(
  result: QueryResult,
  xAxis: string | null,
  yAxis: string[]
): Record<string, any>[] {
  if (!result.rows || result.rows.length === 0 || !xAxis) return [];

  // Sample to 1000 rows
  const sampledRows = result.rows.slice(0, 1000);

  return sampledRows.map((row) => {
    const obj: Record<string, any> = {};

    // Helper to safely convert BigInt or other types to number for Recharts
    const formatValue = (val: any) => {
      if (typeof val === 'bigint') {
        return Number(val);
      }
      return val;
    };

    // Map X-axis
    const xIdx = result.columns.findIndex((c) => c.toLowerCase() === xAxis.toLowerCase());
    if (xIdx !== -1) {
      obj[xAxis] = formatValue(row[xIdx]);
    }

    // Map Y-axis (measures)
    yAxis.forEach((measure) => {
      const yIdx = result.columns.findIndex((c) => {
        const lc = c.toLowerCase();
        const lm = measure.toLowerCase();
        return lc === lm || lc.startsWith(lm + '_');
      });
      if (yIdx !== -1) {
        obj[measure] = formatValue(row[yIdx]);
      }
    });

    return obj;
  });
}
