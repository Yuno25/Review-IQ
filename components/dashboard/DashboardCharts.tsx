"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface DataPoint {
  date: string;
  reviews: number;
  score: number;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-overlay border border-surface-border rounded-lg px-3 py-2 shadow-card text-xs font-mono">
      <p className="text-text-muted mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: <span className="font-semibold">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

export function DashboardCharts({ data }: { data: DataPoint[] }) {
  const formatted = data.map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={formatted} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="reviewsGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#00D4FF" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#00D4FF" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#3FB950" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#3FB950" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#21262D" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: "#484F58", fontSize: 11, fontFamily: "JetBrains Mono" }}
          axisLine={false}
          tickLine={false}
          interval={2}
        />
        <YAxis
          tick={{ fill: "#484F58", fontSize: 11, fontFamily: "JetBrains Mono" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="reviews"
          name="Reviews"
          stroke="#00D4FF"
          strokeWidth={2}
          fill="url(#reviewsGrad)"
          dot={false}
          activeDot={{ r: 4, fill: "#00D4FF", strokeWidth: 0 }}
        />
        <Area
          type="monotone"
          dataKey="score"
          name="Score"
          stroke="#3FB950"
          strokeWidth={2}
          fill="url(#scoreGrad)"
          dot={false}
          activeDot={{ r: 4, fill: "#3FB950", strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
