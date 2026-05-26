"use client";

import { useMemo, useState, useEffect } from "react";
import {
  ComposedChart, Line, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import type { EquityPoint } from "@/types/trade";

const BODY = "var(--font-mono)";
const MONO = "var(--font-mono)";

interface TooltipProps {
  active?: boolean;
  payload?: { payload: EquityPoint; value: number }[];
  label?: string;
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  const fmt = (d: string) => d
    ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })
    : "";
  return (
    <div style={{
      backgroundColor: "#14151a", border: "1px solid #3a3a3f",
      borderRadius: "8px", padding: "10px 14px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    }}>
      <div style={{ fontFamily: BODY, fontSize: "12px", color: "#6b7280", marginBottom: "6px" }}>{fmt(point.date)}</div>
      <div style={{ fontFamily: MONO, fontSize: "12px", display: "flex", flexDirection: "column", gap: "3px" }}>
        <span style={{ color: point.rr >= 0 ? "#34d399" : "#f87171", fontWeight: 600 }}>
          {point.rr >= 0 ? "+" : ""}{point.rr.toFixed(2)}R
        </span>
        <span style={{ color: "#FFF93C", fontWeight: 500 }}>
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

  // Derive available months from data
  const months = useMemo(() => {
    const seen = new Set<string>();
    data.forEach((p) => { if (p.date) seen.add(p.date.substring(0, 7)); });
    return Array.from(seen)
      .sort()
      .map((key) => {
        const [y, m] = key.split("-");
        const d = new Date(Number(y), Number(m) - 1, 1);
        const label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }); // "May '26"
        return { key, label };
      });
  }, [data]);

  // Default to latest month; "all" = show every data point
  const latestMonth = months.length > 0 ? months[months.length - 1].key : "";
  const [activeMonth, setActiveMonth] = useState<string>("");
  const currentMonth = activeMonth || latestMonth;

  // Delay last-dot visibility to match line animation duration (1500ms)
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
    // Add a numeric index so each trade gets its own X position
    // even when multiple trades share the same date
    return base.map((p, i) => ({ ...p, _idx: i }));
  }, [data, currentMonth]);

  if (data.length === 0) {
    return (
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: BODY, fontSize: "12px", color: "#6b7280",
      }}>
        No trade data yet
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      {/* Top row: label + month tabs */}
      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "8px", flexShrink: 0,
        paddingLeft: "56px", paddingRight: "16px",
        flexWrap: "wrap", gap: "8px",
      }}>
        <div style={{
          fontFamily: BODY, fontSize: "12px", color: "#6b7280",
          textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600,
          display: "flex", alignItems: "center", gap: "8px",
        }}>
          <span style={{ width: "14px", height: "2px", backgroundColor: "#FFF93C", display: "inline-block", borderRadius: "1px" }} />
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
                    fontFamily: BODY, fontSize: "12px", fontWeight: 600,
                    padding: "3px 10px", borderRadius: "9999px",
                    border: `1px solid ${isActive ? "rgba(255,249,60,0.4)" : "#3a3a3f"}`,
                    backgroundColor: isActive ? "rgba(255,249,60,0.10)" : "transparent",
                    color: isActive ? "#FFF93C" : "#6b7280",
                    cursor: "pointer",
                    transition: "all 0.15s",
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
                <stop offset="0%"   stopColor="#FFF93C" stopOpacity={0.22} />
                <stop offset="60%"  stopColor="#FFF93C" stopOpacity={0.04} />
                <stop offset="100%" stopColor="#FFF93C" stopOpacity={0}    />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="2 6" stroke="#1f2028" vertical={false} />
            <ReferenceLine y={0} stroke="#3a3a3f" strokeWidth={1} />

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
              tick={{ fill: "#6b7280", fontSize: 12, fontFamily: "var(--font-mono)" }}
              tickLine={false} axisLine={false} dy={6}
            />
            <YAxis
              stroke="transparent"
              tick={{ fill: "#6b7280", fontSize: 12, fontFamily: "var(--font-mono)" }}
              tickLine={false} axisLine={false}
              tickFormatter={v => `${v >= 0 ? "+" : ""}${v}R`}
              width={52} dx={0}
            />

            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#3a3a3f", strokeWidth: 1 }} />

            {/* Glow area fill */}
            <Area
              type="monotone" dataKey="cumulative"
              stroke="none" fill="url(#equityGlow)"
              fillOpacity={1}
              isAnimationActive={true}
              animationDuration={1500}
              animationEasing="ease"
            />

            {/* Main line */}
            <Line
              type="monotone" dataKey="cumulative" name="Equity"
              stroke="#FFF93C" strokeWidth={2.5}
              activeDot={{ r: 5, fill: "#FFF93C", strokeWidth: 0 }}
              animationDuration={1500}
              animationEasing="ease"
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              dot={(props: any) => {
                const { cx, cy, index } = props;
                if (index !== filtered.length - 1 || !dotVisible) return <g key={index} />;
                return (
                  <g key="last-dot">
                    {/* Pulsing ring */}
                    <circle cx={cx} cy={cy} r={5} fill="#FFF93C">
                      <animate attributeName="r"       from="5"  to="20" dur="1.8s" repeatCount="indefinite" />
                      <animate attributeName="opacity" from="0.6" to="0"  dur="1.8s" repeatCount="indefinite" />
                    </circle>
                    {/* Soft glow halo */}
                    <circle cx={cx} cy={cy} r={7} fill="#FFF93C" opacity={0.12} />
                    {/* Core dot */}
                    <circle cx={cx} cy={cy} r={4} fill="#FFF93C" stroke="#14151a" strokeWidth={2} />
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
