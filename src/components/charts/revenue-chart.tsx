"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

/**
 * One categorical ramp, used by every chart in the app so series colours stay
 * consistent between the dashboard, reports and website analytics.
 */
export const CHART_COLORS = [
  "oklch(0.53 0.098 174)",
  "oklch(0.76 0.126 75)",
  "oklch(0.6 0.13 245)",
  "oklch(0.62 0.15 350)",
  "oklch(0.66 0.13 145)",
  "oklch(0.58 0.12 300)",
];

const axisProps = {
  stroke: "var(--muted-foreground)",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;

function ChartTooltip({
  active,
  payload,
  label,
  money = true,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number; color?: string; dataKey?: string }[];
  label?: string;
  money?: boolean;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-lg">
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="flex items-center gap-2 text-[13px]">
          <span className="size-2 rounded-full" style={{ background: entry.color }} />
          <span className="capitalize text-muted-foreground">{entry.name}</span>
          <span className="ml-auto font-semibold">
            {money ? formatCurrency(entry.value ?? 0, { decimals: false }) : (entry.value ?? 0).toLocaleString()}
          </span>
        </p>
      ))}
    </div>
  );
}

export type SeriesPoint = { label: string; revenue: number; profit: number; expenses: number; orders: number };

export function RevenueChart({ data, height = 260 }: { data: SeriesPoint[]; height?: number }) {
  const tickInterval = Math.max(0, Math.floor(data.length / 7) - 1);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLORS[0]} stopOpacity={0.24} />
            <stop offset="100%" stopColor={CHART_COLORS[0]} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" {...axisProps} interval={tickInterval} />
        <YAxis {...axisProps} width={56} tickFormatter={(v: number) => formatCurrency(v, { compact: true, decimals: false })} />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--border)" }} />
        <Area
          type="monotone"
          dataKey="revenue"
          name="Sales"
          stroke={CHART_COLORS[0]}
          strokeWidth={2}
          fill="url(#revenueFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ProfitChart({ data, height = 260 }: { data: SeriesPoint[]; height?: number }) {
  const tickInterval = Math.max(0, Math.floor(data.length / 7) - 1);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" {...axisProps} interval={tickInterval} />
        <YAxis {...axisProps} width={56} tickFormatter={(v: number) => formatCurrency(v, { compact: true, decimals: false })} />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--border)" }} />
        <Line type="monotone" dataKey="profit" name="Profit" stroke={CHART_COLORS[0]} strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="expenses" name="Expenses" stroke={CHART_COLORS[1]} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function CategoryBarChart({
  data,
  height = 260,
  money = true,
}: {
  data: { label: string; value: number }[];
  height?: number;
  money?: boolean;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis
          {...axisProps}
          width={56}
          tickFormatter={(v: number) => (money ? formatCurrency(v, { compact: true, decimals: false }) : String(v))}
        />
        <Tooltip content={<ChartTooltip money={money} />} cursor={{ fill: "var(--muted)" }} />
        <Bar dataKey="value" name="Total" radius={[6, 6, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DonutChart({
  data,
  height = 240,
  money = true,
}: {
  data: { label: string; value: number }[];
  height?: number;
  money?: boolean;
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <ResponsiveContainer width="100%" height={height} className="max-w-[240px]">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="label" innerRadius="62%" outerRadius="94%" paddingAngle={2} strokeWidth={0}>
            {data.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip money={money} />} />
        </PieChart>
      </ResponsiveContainer>
      <ul className="w-full flex-1 space-y-2">
        {data.map((entry, i) => (
          <li key={entry.label} className="flex items-center gap-2.5 text-[13px]">
            <span className="size-2.5 rounded-sm" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
            <span className="capitalize text-muted-foreground">{entry.label}</span>
            <span className="ml-auto font-medium">
              {money ? formatCurrency(entry.value, { decimals: false }) : entry.value.toLocaleString()}
            </span>
            <span className="w-11 text-right text-[12px] text-muted-foreground">
              {total ? Math.round((entry.value / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
