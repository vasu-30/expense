"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fmtMoney, type SeriesPoint } from "@/lib/finance";

interface TooltipEntry {
  name?: string;
  dataKey?: string | number;
  value?: number | string | null;
  color?: string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
  currency: string;
}

function ChartTooltip({ active, payload, label, currency }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const get = (key: string) => {
    const item = payload.find((p) => p.dataKey === key);
    return typeof item?.value === "number" ? item.value : null;
  };
  const daily = get("daily");
  const cumulative = get("cumulative");
  const pace = get("pace");
  return (
    <div className="rounded-xl border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-semibold text-foreground">Day {label}</p>
      {daily !== null && (
        <p className="flex items-center gap-1.5 text-foreground/80">
          <span className="inline-block size-2 rounded-full bg-rose-400" />
          Spent this day: {fmtMoney(daily, currency)}
        </p>
      )}
      {cumulative !== null && (
        <p className="flex items-center gap-1.5 text-foreground/80">
          <span className="inline-block size-2 rounded-full bg-emerald-500" />
          Total so far: {fmtMoney(cumulative, currency)}
        </p>
      )}
      {pace !== null && (
        <p className="flex items-center gap-1.5 text-muted-foreground">
          <span className="inline-block h-0.5 w-2.5 rounded-full bg-slate-400" />
          Budget pace: {fmtMoney(pace, currency)}
        </p>
      )}
    </div>
  );
}

export function ProgressChart({
  series,
  currency,
  daysInMonth,
}: {
  series: SeriesPoint[];
  currency: string;
  daysInMonth: number;
}) {
  const tickInterval = Math.max(1, Math.round(daysInMonth / 10));
  return (
    <div className="w-full" aria-label="Daily spending progress chart">
      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border" />
          <XAxis
            dataKey="day"
            interval={tickInterval}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            className="text-muted-foreground"
          />
          <YAxis
            width={44}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => fmtMoney(v, currency, true)}
            className="text-muted-foreground"
          />
          <Tooltip content={<ChartTooltip currency={currency} />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
          <Bar dataKey="daily" fill="#fb7185" fillOpacity={0.45} radius={[3, 3, 0, 0]} barSize={6} name="Daily spent" />
          <Line
            type="monotone"
            dataKey="cumulative"
            stroke="#10b981"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4 }}
            name="Total so far"
          />
          <Line
            type="linear"
            dataKey="pace"
            stroke="#94a3b8"
            strokeWidth={1.5}
            strokeDasharray="6 5"
            dot={false}
            name="Budget pace"
          />
        </ComposedChart>
      </ResponsiveContainer>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 rounded bg-emerald-500" /> Total so far
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2 rounded-sm bg-rose-400/70" /> Spent each day
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 rounded border-t border-dashed border-slate-400" /> Budget pace
        </span>
      </div>
    </div>
  );
}
