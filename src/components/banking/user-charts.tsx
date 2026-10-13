"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const BRAND = "#ba1110";
const CHARCOAL = "#1a1a1a";

export function SpendingByCategoryChart({
  rows,
  hidden,
}: {
  rows: { name: string; value: number }[];
  hidden?: boolean;
}) {
  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm text-muted">No spending data for this period.</p>;
  }
  const data = hidden ? rows.map((r) => ({ ...r, value: 1 })) : rows;
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={52} outerRadius={80} paddingAngle={2}>
          {data.map((_, index) => (
            <Cell key={index} fill={index % 2 === 0 ? BRAND : CHARCOAL} fillOpacity={index % 2 === 0 ? 0.85 : 0.35} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => (hidden ? "Hidden" : `£${value.toFixed(2)}`)} />
        <Legend verticalAlign="bottom" height={36} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function MonthlyCashflowChart({
  rows,
  hidden,
}: {
  rows: { month: string; in: number; out: number }[];
  hidden?: boolean;
}) {
  const data = hidden ? rows.map((r) => ({ ...r, in: 0, out: 0 })) : rows;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data}>
        <CartesianGrid stroke="#eee" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => (hidden ? "•" : `£${v}`)} />
        <Tooltip formatter={(value: number) => (hidden ? "Hidden" : `£${Number(value).toFixed(2)}`)} />
        <Legend />
        <Bar dataKey="in" name="Paid in" fill="#067a46" radius={3} />
        <Bar dataKey="out" name="Paid out" fill={BRAND} radius={3} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function AllocationChart({ rows }: { rows: { name: string; pct: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 16 }}>
        <CartesianGrid stroke="#eee" horizontal={false} />
        <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="name" width={72} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v: number) => `${v}% (illustrative)`} />
        <Bar dataKey="pct" fill={BRAND} fillOpacity={0.75} radius={3} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function PerformanceLineChart({ rows }: { rows: { label: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={rows}>
        <CartesianGrid stroke="#eee" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} unit="%" />
        <Tooltip formatter={(v: number) => `${v}% (illustrative)`} />
        <Bar dataKey="value" fill={CHARCOAL} fillOpacity={0.35} radius={3} />
      </BarChart>
    </ResponsiveContainer>
  );
}
