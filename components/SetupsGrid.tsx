"use client";

import { useState } from "react";
import type { SetupCard } from "@/types/trade";
import Image from "next/image";

const D = "var(--font-display)";
const M = "var(--font-mono)";
const B = "var(--font-body)";
const AQUA = "#19d0e8";

// ─── Inline markdown renderer ─────────────────────────────────────────────────

function renderInline(text: string): React.ReactNode[] {
  const result: React.ReactNode[] = [];
  const boldRx = /\*\*(.+?)\*\*/g;
  let last = 0, m: RegExpExecArray | null;
  while ((m = boldRx.exec(text)) !== null) {
    if (m.index > last) result.push(text.slice(last, m.index));
    result.push(<strong key={m.index} style={{ color: AQUA, fontWeight: 500 }}>{m[1]}</strong>);
    last = m.index + m[0].length;
  }
  if (last < text.length) result.push(text.slice(last));
  return result;
}

// ─── Section parser ───────────────────────────────────────────────────────────

interface Section { title: string; lines: string[]; link?: { label: string; url: string } }

function parseDescriptionSections(text: string): Section[] {
  const sections: Section[] = [];
  let current: Section = { title: "", lines: [] };
  for (const line of text.split("\n")) {
    if (line.startsWith("### ")) {
      if (current.title || current.lines.some(l => l.trim())) sections.push(current);
      current = { title: line.slice(4).trim(), lines: [] };
    } else {
      const linkM = line.match(/^(.+?):\s+Link\s+\((.+?)\)\s*$/);
      if (linkM) current.link = { label: linkM[1], url: linkM[2] };
      else current.lines.push(line);
    }
  }
  if (current.title || current.lines.some(l => l.trim())) sections.push(current);
  return sections;
}

function renderSectionLines(lines: string[]) {
  return lines
    .filter((line, i, arr) => {
      if (line.trim() !== "") return true;
      const first = arr.findIndex(l => l.trim());
      const last  = arr.length - 1 - [...arr].reverse().findIndex(l => l.trim());
      return i > first && i < last;
    })
    .map((line, idx) => {
      const numM = line.match(/^(\d+)\.\s+(.+)/);
      if (numM) return (
        <div key={idx} style={{ display: "flex", gap: "10px", marginBottom: "5px" }}>
          <span style={{ color: AQUA, fontWeight: 500, flexShrink: 0, fontFamily: M, fontSize: "12px", minWidth: "14px" }}>{numM[1]}.</span>
          <span style={{ fontFamily: B, fontSize: "13px", color: "var(--color-near-white)", lineHeight: "1.65", letterSpacing: "-0.01em" }}>{renderInline(numM[2])}</span>
        </div>
      );
      if (line.startsWith("- ")) return (
        <div key={idx} style={{ display: "flex", gap: "10px", marginBottom: "5px" }}>
          <span style={{ color: AQUA, flexShrink: 0, fontFamily: M, fontSize: "12px" }}>–</span>
          <span style={{ fontFamily: B, fontSize: "13px", color: "var(--color-near-white)", lineHeight: "1.65", letterSpacing: "-0.01em" }}>{renderInline(line.slice(2))}</span>
        </div>
      );
      if (line.trim() === "") return <div key={idx} style={{ height: "4px" }} />;
      return (
        <p key={idx} style={{ fontFamily: B, fontSize: "13px", lineHeight: "1.65", color: "var(--color-near-white)", letterSpacing: "-0.01em" }}>
          {renderInline(line)}
        </p>
      );
    });
}

// ─── Left feature item ────────────────────────────────────────────────────────

function FeatureItem({ s, active, onClick }: { s: SetupCard; active: boolean; onClick: () => void }) {
  const preview = s.description
    .split("\n")
    .map(l => l.replace(/^###\s+/, "").replace(/\*\*/g, "").trim())
    .find(l => l && !l.startsWith("#")) ?? `${s.timeframe} · ${s.session}`;

  return (
    <button
      onClick={onClick}
      style={{
        all: "unset",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        padding: "16px 18px",
        borderRadius: "var(--radius-default)",
        cursor: "pointer",
        borderLeft: `2px solid ${active ? AQUA : "transparent"}`,
        backgroundColor: active ? "rgba(255,255,255,0.055)" : "transparent",
        transition: "opacity 0.2s, background 0.2s",
        opacity: active ? 1 : 0.42,
        width: "100%",
        boxSizing: "border-box" as const,
        textAlign: "left" as const,
      }}
    >
      <span style={{
        fontFamily: M, fontSize: "14px", fontWeight: 500,
        color: "var(--color-near-white)", lineHeight: 1.2,
      }}>
        {s.name}
      </span>
      <span style={{
        fontFamily: M, fontSize: "11px",
        color: "var(--color-ash-gray)", lineHeight: 1.55,
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical" as const,
        overflow: "hidden",
      }}>
        {preview}
      </span>
    </button>
  );
}

// ─── Right window card ────────────────────────────────────────────────────────

function WindowCard({ s }: { s: SetupCard }) {
  const sections = parseDescriptionSections(s.description);
  const backtest = sections.find(sec => sec.link)?.link;
  const contentSections = sections.filter(sec => sec.title || sec.lines.some(l => l.trim()));

  return (
    <div style={{
      backgroundColor: "#1c1c1c",
      borderRadius: "12px",
      border: "1px solid rgba(255,255,255,0.07)",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      boxShadow: "rgba(0,0,0,0.4) 0px 8px 32px",
    }}>
      {/* ── Title bar with dots ── */}
      <div style={{
        padding: "12px 16px",
        backgroundColor: "#222",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        display: "flex", alignItems: "center", gap: "6px",
        flexShrink: 0,
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.18)" }} />
        ))}
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 24px 16px" }}>
        {/* Name + chips */}
        <h3 style={{
          fontFamily: D, fontWeight: 400, fontSize: "26px",
          lineHeight: 1.05, letterSpacing: "-0.025em",
          color: "var(--color-near-white)", marginBottom: "14px",
        }}>
          {s.name}
        </h3>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "20px" }}>
          {[{ l: "Timeframe", v: s.timeframe }, { l: "Session", v: s.session }].map(item => (
            <div key={item.l} style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "3px 12px",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "var(--radius-buttons)",
              backgroundColor: "rgba(255,255,255,0.04)",
            }}>
              <span style={{ fontFamily: M, fontSize: "9px", fontWeight: 500, color: "var(--color-ash-gray)", textTransform: "uppercase", letterSpacing: "0.12em" }}>{item.l}</span>
              <span style={{ fontFamily: M, fontSize: "10px", fontWeight: 500, color: "var(--color-near-white)" }}>{item.v}</span>
            </div>
          ))}
        </div>

        {/* Description sections */}
        {contentSections.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {contentSections.map((section, i) => (
              <div key={i}>
                {section.title && (
                  <div style={{
                    fontFamily: M, fontSize: "9px", fontWeight: 500,
                    color: "var(--color-ash-gray)", textTransform: "uppercase",
                    letterSpacing: "0.14em", marginBottom: "8px",
                  }}>
                    {section.title}
                  </div>
                )}
                {renderSectionLines(section.lines)}
              </div>
            ))}
          </div>
        )}

        {/* Backtest link */}
        {backtest && (
          <div style={{ marginTop: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontFamily: M, fontSize: "9px", fontWeight: 500, color: "var(--color-ash-gray)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
              {backtest.label}
            </span>
            <a href={backtest.url} target="_blank" rel="noopener noreferrer" style={{
              fontFamily: M, fontSize: "10px", fontWeight: 500,
              color: AQUA, textDecoration: "none",
              border: "1px solid rgba(25,208,232,0.4)",
              backgroundColor: "rgba(25,208,232,0.08)",
              borderRadius: "var(--radius-buttons)", padding: "3px 12px",
              letterSpacing: "0.05em",
            }}>
              Open ↗
            </a>
          </div>
        )}

        {/* Images */}
        {s.imageUrls.length > 0 && (
          <div style={{
            marginTop: "20px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: "8px",
          }}>
            {s.imageUrls.map((url, i) => (
              <div key={i} style={{
                borderRadius: "var(--radius-default)", overflow: "hidden",
                aspectRatio: "16/9", position: "relative",
                backgroundColor: "var(--surface-canvas)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}>
                <Image src={url} alt={`${s.name} chart ${i + 1}`} fill style={{ objectFit: "cover" }} unoptimized />
              </div>
            ))}
          </div>
        )}

        {/* Tags */}
        {s.tags.length > 0 && (
          <div style={{ marginTop: "20px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {s.tags.map(tag => (
              <span key={tag} style={{
                fontFamily: M, fontSize: "9px", fontWeight: 500,
                color: "var(--color-ash-gray)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "var(--radius-buttons)", padding: "2px 10px",
              }}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SetupsGrid({ setups }: { setups: SetupCard[] }) {
  const [selectedId, setSelectedId] = useState<string>(setups[0]?.id ?? "");
  const selected = setups.find(s => s.id === selectedId) ?? setups[0] ?? null;

  if (setups.length === 0) {
    return (
      <div id="setups" style={{
        borderRadius: "var(--radius-cards)", padding: "48px",
        textAlign: "center", fontFamily: M, fontSize: "12px",
        color: "var(--color-ash-gray)", backgroundColor: "#141414",
        border: "1px solid rgba(255,255,255,0.06)",
      }}>
        No setups loaded.
      </div>
    );
  }

  return (
    <div id="setups" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* Eyebrow */}
      <p style={{
        fontFamily: M, fontSize: "10px", fontWeight: 500,
        color: "var(--color-ash-gray)", textTransform: "uppercase", letterSpacing: "0.12em",
      }}>
        Setups
      </p>

      {/* Two-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "24px", alignItems: "start" }}>

        {/* ── Left: feature list ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          {setups.map(s => (
            <FeatureItem
              key={s.id}
              s={s}
              active={s.id === selectedId}
              onClick={() => setSelectedId(s.id)}
            />
          ))}
        </div>

        {/* ── Right: window card ── */}
        {selected && <WindowCard s={selected} />}

      </div>
    </div>
  );
}
