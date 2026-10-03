"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export interface AggregateRow {
  windowDays: number;
  windowIntensity: number;
  baselineIntensity: number;
}

export function BacktestChart({ data }: { data: AggregateRow[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="windowDays" tickFormatter={(d) => `${d}d`} stroke="#64748b" fontSize={12} />
        <YAxis stroke="#64748b" fontSize={12} />
        <Tooltip />
        <Legend />
        <Bar dataKey="windowIntensity" name="Pre-milestone window" fill="#4f46e5" radius={[4, 4, 0, 0]} />
        <Bar dataKey="baselineIntensity" name="Equal-length baseline" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
