"use client";

import { useMemo, useState, useEffect } from "react";
import {
  ComposedChart, Line, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import type { EquityPoint } from "@/types/trade";

const M = "var(--font-mono)";   // DM Mono
const AQUA = "#19d0e8";

interface TooltipProps {
  active?: boolean;
  payload?: { payload: EquityPoint; value: number }[];
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  const fmt = (d: string) => d
    ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })
    : "";
  return (
    <div style={{
      backgroundColor: "#191919",
      border: "1px solid #282828",
      borderRadius: "var(--radius-default)",
      padding: "10px 14px",
      boxShadow: "var(--shadow-sm)",
    }}>
      <div style={{ fontFamily: M, fontSize: "12px", color: "var(--color-ash-gray)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
        {fmt(point.date)}
      </div>
      <div style={{ fontFamily: M, fontSize: "12px", display: "flex", flexDirection: "column", gap: "3px" }}>
        <span style={{ color: point.rr >= 0 ? "var(--color-win)" : "var(--color-loss)", fontWeight: 500 }}>
          {point.rr >= 0 ? "+" : ""}{point.rr.toFixed(2)}R
        </span>
        <span style={{ color: AQUA, fontWeight: 500 }}>
          {point.cumulative >= 0 ? "+" : ""}{point.cumulative.toFixed(2)}R total
        </span>
      </div>
    </div>
  );
}

export default function HeroChart({ data }: { data: EquityPoint[] }) {
  const fmt = (d: string) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  };

  const months = useMemo(() => {
    const seen = new Set<string>();
    data.forEach((p) => { if (p.date) seen.add(p.date.substring(0, 7)); });
    return Array.from(seen).sort().map((key) => {
      const [y, m] = key.split("-");
      const d = new Date(Number(y), Number(m) - 1, 1);
      const label = `${d.toLocaleDateString("en-US", { month: "short" })} '${String(y).slice(-2)}`;
      return { key, label };
    });
  }, [data]);

  const latestMonth = months.length > 0 ? months[months.length - 1].key : "";
  const [activeMonth, setActiveMonth] = useState<string>("");
  const currentMonth = activeMonth || latestMonth;

  const [dotVisible, setDotVisible] = useState(false);
  useEffect(() => {
    setDotVisible(false);
    const t = setTimeout(() => setDotVisible(true), 1500);
    return () => clearTimeout(t);
  }, [currentMonth]);

  const filtered = useMemo(() => {
    const base = (!currentMonth || currentMonth === "all")
      ? data
      : data.filter((p) => p.date && p.date.startsWith(currentMonth));
    return base.map((p, i) => ({ ...p, _idx: i }));
  }, [data, currentMonth]);

  if (data.length === 0) {
    return (
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: M, fontSize: "12px", color: "var(--color-ash-gray)",
      }}>
        No trade data yet
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      {/* Top row */}
      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "10px", flexShrink: 0,
        paddingLeft: "56px", paddingRight: "16px",
        flexWrap: "wrap", gap: "8px",
      }}>
        <div style={{
          fontFamily: M, fontSize: "12px", color: "var(--color-ash-gray)",
          textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 500,
          display: "flex", alignItems: "center", gap: "8px",
        }}>
          <span style={{ width: "14px", height: "1.5px", backgroundColor: AQUA, display: "inline-block", borderRadius: "1px" }} />
          Equity Curve
        </div>

        {/* Month tabs */}
        {months.length > 0 && (
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {[{ key: "all", label: "All" }, ...months].map((m) => {
              const isActive = m.key === currentMonth;
              return (
                <button
                  key={m.key}
                  onClick={() => setActiveMonth(m.key)}
                  style={{
                    fontFamily: M, fontSize: "12px", fontWeight: 500,
                    padding: "3px 10px",
                    borderRadius: "var(--radius-buttons)",
                    border: `1px solid ${isActive ? "rgba(25,208,232,0.5)" : "var(--color-dark-charcoal)"}`,
                    backgroundColor: isActive ? "rgba(25,208,232,0.10)" : "transparent",
                    color: isActive ? AQUA : "var(--color-ash-gray)",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                  }}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Chart */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={filtered} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="equityGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={AQUA} stopOpacity={0.25} />
                <stop offset="60%"  stopColor={AQUA} stopOpacity={0.05} />
                <stop offset="100%" stopColor={AQUA} stopOpacity={0}    />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="2 6" stroke="#1a1a1a" vertical={false} />
            <ReferenceLine y={0} stroke="#282828" strokeWidth={1} />

            <XAxis
              dataKey="_idx"
              type="number"
              domain={[0, Math.max(filtered.length - 1, 1)]}
              ticks={filtered.map((_, i) => i).filter((_, i, arr) =>
                arr.length <= 10 || i % Math.ceil(arr.length / 10) === 0 || i === arr.length - 1
              )}
              tickFormatter={(val: number) => {
                const p = filtered[val];
                return p ? fmt(p.date) : "";
              }}
              stroke="transparent"
              tick={{ fill: "var(--color-ash-gray)", fontSize: 12, fontFamily: M }}
              tickLine={false} axisLine={false} dy={6}
            />
            <YAxis
              stroke="transparent"
              tick={{ fill: "var(--color-ash-gray)", fontSize: 12, fontFamily: M }}
              tickLine={false} axisLine={false}
              tickFormatter={v => `${v >= 0 ? "+" : ""}${v}R`}
              width={48} dx={0}
            />

            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#282828", strokeWidth: 1 }} />

            <Area
              type="monotone" dataKey="cumulative"
              stroke="none" fill="url(#equityGlow)"
              fillOpacity={1}
              isAnimationActive={true}
              animationDuration={1500}
              animationEasing="ease"
            />

            <Line
              type="monotone" dataKey="cumulative" name="Equity"
              stroke={AQUA} strokeWidth={2}
              activeDot={{ r: 4, fill: AQUA, strokeWidth: 0 }}
              animationDuration={1500}
              animationEasing="ease"
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              dot={(props: any) => {
                const { cx, cy, index } = props;
                if (index !== filtered.length - 1 || !dotVisible) return <g key={index} />;
                return (
                  <g key="last-dot">
                    <circle cx={cx} cy={cy} r={5} fill={AQUA}>
                      <animate attributeName="r"       from="5"   to="20" dur="1.8s" repeatCount="indefinite" />
                      <animate attributeName="opacity" from="0.5" to="0"  dur="1.8s" repeatCount="indefinite" />
                    </circle>
                    <circle cx={cx} cy={cy} r={6} fill={AQUA} opacity={0.1} />
                    <circle cx={cx} cy={cy} r={3.5} fill={AQUA} stroke="#000" strokeWidth={1.5} />
                  </g>
                );
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
