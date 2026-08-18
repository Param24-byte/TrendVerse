"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";

interface GrowthChartProps {
  data: { time: string; score: number }[];
}

export function GrowthChart({ data }: GrowthChartProps) {
  if (!data || data.length === 0) return null;

  return (
    <div className="glass mt-6 h-64 w-full rounded-2xl p-4">
      <div className="mb-4 px-2 text-sm font-medium text-slate-400">
        Velocity Score (Last 24h)
      </div>
      <ResponsiveContainer width="100%" height="80%">
        <AreaChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis 
            dataKey="time" 
            stroke="#64748b" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="#64748b" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}`}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#0f1629', 
              borderColor: 'rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#f8fafc'
            }}
            itemStyle={{ color: '#6366f1' }}
          />
          <Area
            type="monotone"
            dataKey="score"
            stroke="#6366f1"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorScore)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
