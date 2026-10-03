"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TimeBucket } from "@/lib/analytics/signal-stats";

export function SignalTimelineChart({ data }: { data: TimeBucket[] }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="signalFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="date" stroke="#64748b" fontSize={11} minTickGap={40} />
        <YAxis stroke="#64748b" fontSize={11} width={28} />
        <Tooltip />
        <Area type="monotone" dataKey="weighted" stroke="#4f46e5" fill="url(#signalFill)" strokeWidth={2} name="Weighted signal activity" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
