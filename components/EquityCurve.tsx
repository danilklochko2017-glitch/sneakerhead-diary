"use client";

import {
  ComposedChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { EquityPoint } from "@/types/trade";

const MONO: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "-0.022em" };

interface TooltipProps { active?: boolean; payload?: { payload: EquityPoint; value: number; name: string }[]; label?: string }

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div style={{
      backgroundColor: "#080808", border: "1px solid #333333",
      borderRadius: "8px", padding: "12px 16px",
    }}>
      <div style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#949494", marginBottom: "8px" }}>
        {label} · {point.session}
      </div>
      <div style={{ ...MONO, fontSize: "13px", color: "#F3F3F3", display: "flex", flexDirection: "column", gap: "4px" }}>
        <span>Trade: <span style={{ color: point.rr >= 0 ? "#00AC5C" : "#F3F3F3" }}>{point.rr >= 0 ? "+" : ""}{point.rr.toFixed(2)}R</span></span>
        <span>Equity: <span style={{ color: "#E7C59A" }}>{point.cumulative >= 0 ? "+" : ""}{point.cumulative.toFixed(2)}R</span></span>
      </div>
    </div>
  );
}

export default function EquityCurve({ data }: { data: EquityPoint[] }) {
  const fmt = (d: string) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  };

  return (
    <section id="equity" style={{
      backgroundColor: "#101010",
      borderBottom: "1px solid #333333",
      padding: "80px 40px",
    }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

        {/* Header row */}
        <div style={{
          display: "flex", alignItems: "flex-end",
          justifyContent: "space-between", flexWrap: "wrap",
          gap: "16px", marginBottom: "40px",
          paddingBottom: "24px", borderBottom: "1px solid #333333",
        }}>
          <div>
            <p style={{ fontFamily: "Inter", fontSize: "13px", color: "#949494", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "-0.007px" }}>
              Performance
            </p>
            <h2 style={{ fontFamily: "Inter", fontWeight: 700, fontSize: "34px", lineHeight: "1.07", color: "#F3F3F3" }}>
              Equity Curve
            </h2>
          </div>
          <div style={{ display: "flex", gap: "24px" }}>
            {[
              { label: "All", color: "#E7C59A" },
              { label: "London", color: "#949494" },
              { label: "New York", color: "#C1C1C1" },
            ].map(l => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "20px", height: "1px", backgroundColor: l.color, display: "inline-block" }} />
                <span style={{ fontFamily: "Inter", fontSize: "13px", color: "#949494" }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {data.length === 0 ? (
          <div style={{
            border: "1px solid #333333", borderRadius: "8px",
            padding: "64px", textAlign: "center",
            fontFamily: "Inter", fontSize: "14px", color: "#949494",
          }}>
            No trade data yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={360}>
            <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="1 4" stroke="#222222" vertical={false} />
              <ReferenceLine y={0} stroke="#333333" strokeWidth={1} />
              <XAxis
                dataKey="date" tickFormatter={fmt}
                stroke="transparent"
                tick={{ fill: "#949494", fontSize: 12, fontFamily: "IBM Plex Mono" }}
                tickLine={false} axisLine={false} dy={8}
              />
              <YAxis
                stroke="transparent"
                tick={{ fill: "#949494", fontSize: 12, fontFamily: "IBM Plex Mono" }}
                tickLine={false} axisLine={false}
                tickFormatter={v => `${v}R`} dx={-8}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="cumulative" name="All"
                stroke="#E7C59A" strokeWidth={2} dot={false}
                activeDot={{ r: 4, fill: "#E7C59A", strokeWidth: 0 }} />
              <Line type="monotone" dataKey="london" name="London"
                stroke="#949494" strokeWidth={1} strokeDasharray="4 3" dot={false}
                activeDot={{ r: 3, fill: "#949494", strokeWidth: 0 }} connectNulls />
              <Line type="monotone" dataKey="newYork" name="New York"
                stroke="#C1C1C1" strokeWidth={1} strokeDasharray="4 3" dot={false}
                activeDot={{ r: 3, fill: "#C1C1C1", strokeWidth: 0 }} connectNulls />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
