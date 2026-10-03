"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function LeadTimeHistogram({ leadDays }: { leadDays: number[] }) {
  const buckets = [0, 10, 20, 30, 45, 60, 75, 90];
  const data = buckets.map((start, i) => {
    const end = buckets[i + 1] ?? Infinity;
    const label = end === Infinity ? `${start}+` : `${start}-${end}`;
    return { range: label, count: leadDays.filter((d) => d >= start && d < end).length };
  });

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="range" stroke="#64748b" fontSize={11} label={{ value: "Lead days before milestone", position: "insideBottom", offset: -5, fontSize: 11, fill: "#64748b" }} />
        <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
        <Tooltip />
        <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Milestones" />
      </BarChart>
    </ResponsiveContainer>
  );
}
