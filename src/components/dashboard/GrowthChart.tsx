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
              <stop offset="5%" stopColor="#f5654a" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#f5654a" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis 
            dataKey="time" 
            stroke="#71717a" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="#71717a" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}`}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#121216', 
              borderColor: 'rgba(255,255,255,0.1)',
              borderRadius: '10px',
              color: '#ededed'
            }}
            itemStyle={{ color: '#f5654a' }}
          />
          <Area
            type="monotone"
            dataKey="score"
            stroke="#f5654a"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorScore)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
