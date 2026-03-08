import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useChartStore } from '@/stores/chartStore';
import type { QueryResult } from '@/utils/database';
import { mapQueryResultToChartData } from '@/utils/chartHelpers';

const COLORS = [
  '#3b82f6', // blue
  '#f97316', // orange
  '#10b981', // emerald
  '#8b5cf6', // violet
  '#f43f5e', // rose
  '#06b6d4', // cyan
  '#eab308', // yellow
];

interface AdaptiveChartProps {
  result: QueryResult;
}



export const AdaptiveChart: React.FC<AdaptiveChartProps> = ({ result }) => {
  const { chartType, xAxis, yAxis } = useChartStore();

  const data = useMemo(() => {
    return mapQueryResultToChartData(result, xAxis, yAxis);
  }, [result, xAxis, yAxis]);

  if (!xAxis || yAxis.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2 p-12 text-center">
        <span className="text-3xl text-slate-300">⚙️</span>
        <p className="text-sm font-medium">Please select X-Axis and Y-Axis columns</p>
      </div>
    );
  }

  // Bar Chart
  if (chartType === 'bar') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey={xAxis} 
            fontSize={11} 
            tick={{ fill: '#64748b' }} 
            axisLine={{ stroke: '#e2e8f0' }} 
          />
          <YAxis 
            fontSize={11} 
            tick={{ fill: '#64748b' }} 
            axisLine={{ stroke: '#e2e8f0' }} 
            width={40}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
            cursor={{ fill: '#f8fafc' }}
          />
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
          {yAxis.map((measure, index) => (
            <Bar 
              key={measure} 
              dataKey={measure} 
              fill={COLORS[index % COLORS.length]} 
              radius={[4, 4, 0, 0]} 
              barSize={32}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  // Line Chart
  if (chartType === 'line') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis 
            dataKey={xAxis} 
            fontSize={11} 
            tick={{ fill: '#64748b' }} 
            axisLine={{ stroke: '#e2e8f0' }} 
          />
          <YAxis 
            fontSize={11} 
            tick={{ fill: '#64748b' }} 
            axisLine={{ stroke: '#e2e8f0' }}
            width={40}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
          />
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
          {yAxis.map((measure, index) => (
            <Line 
              key={measure} 
              type="monotone" 
              dataKey={measure} 
              stroke={COLORS[index % COLORS.length]} 
              strokeWidth={3} 
              dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  // Pie Chart
  if (chartType === 'pie') {
    if (yAxis.length > 1) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2 p-12 text-center">
          <span className="text-3xl">🥧</span>
          <p className="text-sm font-medium">Pie charts only support one measure at a time</p>
          <p className="text-[10px] text-slate-400">Please deselect other measures in the panel above</p>
        </div>
      );
    }
    const firstMeasure = yAxis[0];
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey={firstMeasure}
            nameKey={xAxis}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
          />
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  return null;
};
