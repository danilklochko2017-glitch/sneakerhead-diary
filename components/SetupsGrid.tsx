"use client";

import { useState } from "react";
import type { SetupCard } from "@/types/trade";
import Image from "next/image";

const D = "var(--font-display)";
const M = "var(--font-mono)";
const B = "var(--font-body)";
const AQUA = "#19d0e8";
const INNER = "#141414";

// ─── Inline markdown renderer ─────────────────────────────────────────────────

function renderInline(text: string): React.ReactNode[] {
  const result: React.ReactNode[] = [];
  const boldRx = /\*\*(.+?)\*\*/g;
  let last = 0, m: RegExpExecArray | null;
  while ((m = boldRx.exec(text)) !== null) {
    if (m.index > last) result.push(text.slice(last, m.index));
    result.push(
      <strong key={m.index} style={{ color: AQUA, fontWeight: 500 }}>
        {m[1]}
      </strong>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) result.push(text.slice(last));
  return result;
}

// ─── Section parser ───────────────────────────────────────────────────────────

interface Section {
  title: string;
  lines: string[];
  link?: { label: string; url: string };
}

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
          <span style={{ color: AQUA, fontWeight: 500, flexShrink: 0, fontFamily: M, fontSize: "12px", minWidth: "14px" }}>
            {numM[1]}.
          </span>
          <span style={{ fontFamily: B, fontSize: "12px", color: "var(--color-near-white)", lineHeight: "1.65", letterSpacing: "-0.01em" }}>
            {renderInline(numM[2])}
          </span>
        </div>
      );
      if (line.startsWith("- ")) return (
        <div key={idx} style={{ display: "flex", gap: "10px", marginBottom: "5px" }}>
          <span style={{ color: AQUA, flexShrink: 0, fontFamily: M, fontSize: "12px" }}>–</span>
          <span style={{ fontFamily: B, fontSize: "12px", color: "var(--color-near-white)", lineHeight: "1.65", letterSpacing: "-0.01em" }}>
            {renderInline(line.slice(2))}
          </span>
        </div>
      );
      if (line.trim() === "") return <div key={idx} style={{ height: "4px" }} />;
      return (
        <p key={idx} style={{ fontFamily: B, fontSize: "12px", lineHeight: "1.65", color: "var(--color-near-white)", letterSpacing: "-0.01em" }}>
          {renderInline(line)}
        </p>
      );
    });
}

// ─── Detail panel ─────────────────────────────────────────────────────────────

function SetupDetail({ s }: { s: SetupCard }) {
  const sections = parseDescriptionSections(s.description);
  const backtest = sections.find(sec => sec.link)?.link;
  const contentSections = sections.filter(sec => sec.title || sec.lines.some(l => l.trim()));

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

      {/* Header */}
      <div style={{ padding: "16px 20px 14px", borderBottom: "1px solid #0a0a0a", flexShrink: 0 }}>
        <h3 style={{
          fontFamily: D, fontWeight: 400, fontSize: "22px",
          lineHeight: 1.1, color: "var(--color-near-white)",
          letterSpacing: "-0.02em", marginBottom: "10px",
        }}>
          {s.name}
        </h3>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {[{ l: "Timeframe", v: s.timeframe }, { l: "Session", v: s.session }].map(item => (
            <div key={item.l} style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "3px 10px",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "var(--radius-buttons)",
              backgroundColor: "rgba(255,255,255,0.04)",
            }}>
              <span style={{ fontFamily: M, fontSize: "9px", fontWeight: 500, color: "var(--color-ash-gray)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                {item.l}
              </span>
              <span style={{ fontFamily: M, fontSize: "10px", fontWeight: 500, color: "var(--color-near-white)" }}>
                {item.v}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0" }}>

        {/* Description sections */}
        {contentSections.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1px", backgroundColor: "#0a0a0a" }}>
            {contentSections.map((section, i) => (
              <div key={i} style={{ padding: "12px 20px", backgroundColor: INNER }}>
                {section.title && (
                  <div style={{
                    fontFamily: M, fontSize: "9px", fontWeight: 500,
                    color: "var(--color-ash-gray)", textTransform: "uppercase",
                    letterSpacing: "0.12em", marginBottom: "8px",
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
          <div style={{
            marginTop: "1px", padding: "10px 20px",
            backgroundColor: INNER,
            display: "flex", alignItems: "center", gap: "10px",
          }}>
            <span style={{ fontFamily: M, fontSize: "9px", fontWeight: 500, color: "var(--color-ash-gray)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
              {backtest.label}
            </span>
            <a
              href={backtest.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: M, fontSize: "10px", fontWeight: 500,
                color: AQUA, textDecoration: "none",
                border: "1px solid rgba(25,208,232,0.4)",
                backgroundColor: "rgba(25,208,232,0.08)",
                borderRadius: "var(--radius-buttons)", padding: "2px 10px",
                letterSpacing: "0.05em",
              }}
            >
              Open ↗
            </a>
          </div>
        )}

        {/* Images */}
        {s.imageUrls.length > 0 && (
          <div style={{
            marginTop: "1px",
            padding: "12px 20px",
            backgroundColor: INNER,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: "6px",
          }}>
            {s.imageUrls.map((url, i) => (
              <div key={i} style={{
                borderRadius: "var(--radius-small)", overflow: "hidden",
                aspectRatio: "16/9", position: "relative",
                backgroundColor: "var(--surface-canvas)",
                border: "1px solid var(--color-dark-charcoal)",
              }}>
                <Image src={url} alt={`${s.name} chart ${i + 1}`} fill style={{ objectFit: "cover" }} unoptimized />
              </div>
            ))}
          </div>
        )}

        {/* Tags */}
        {s.tags.length > 0 && (
          <div style={{
            marginTop: "1px", padding: "10px 20px",
            backgroundColor: INNER,
            display: "flex", gap: "6px", flexWrap: "wrap",
          }}>
            {s.tags.map(tag => (
              <span key={tag} style={{
                fontFamily: M, fontSize: "9px", fontWeight: 500,
                color: "var(--color-ash-gray)",
                border: "1px solid var(--color-dark-charcoal)",
                backgroundColor: "transparent",
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

// ─── Grid ─────────────────────────────────────────────────────────────────────

export default function SetupsGrid({ setups }: { setups: SetupCard[] }) {
  const [selectedId, setSelectedId] = useState<string>(setups[0]?.id ?? "");
  const selected = setups.find(s => s.id === selectedId) ?? setups[0] ?? null;

  return (
    <div id="setups" className="card-glow" style={{
      backgroundColor: "var(--surface-card)",
      borderRadius: "var(--radius-cards)",
      padding: "var(--card-padding)",
    }}>
      {/* Eyebrow */}
      <div style={{ marginBottom: "16px" }}>
        <p style={{ fontFamily: M, fontSize: "10px", fontWeight: 500, color: "var(--color-ash-gray)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
          Setups
        </p>
      </div>

      {setups.length === 0 ? (
        <div style={{
          borderRadius: "var(--radius-default)", padding: "48px",
          textAlign: "center", fontFamily: M, fontSize: "12px",
          color: "var(--color-ash-gray)", backgroundColor: INNER,
        }}>
          No setups loaded.
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "180px 1fr",
          borderRadius: "var(--radius-default)",
          overflow: "hidden",
          border: "1px solid #111",
          minHeight: "360px",
        }}>

          {/* ── Left: setup list ── */}
          <div style={{
            display: "flex", flexDirection: "column",
            gap: "1px", backgroundColor: "#0a0a0a",
            borderRight: "1px solid #0a0a0a",
          }}>
            {setups.map(s => {
              const active = s.id === selectedId;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedId(s.id)}
                  style={{
                    all: "unset",
                    display: "flex", flexDirection: "column",
                    gap: "4px",
                    padding: "14px 16px",
                    cursor: "pointer",
                    backgroundColor: active ? "#1c1c1c" : INNER,
                    borderLeft: `2px solid ${active ? AQUA : "transparent"}`,
                    transition: "background 0.15s, border-color 0.15s",
                  }}
                  onMouseEnter={e => {
                    if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = "#181818";
                  }}
                  onMouseLeave={e => {
                    if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = INNER;
                  }}
                >
                  <span style={{
                    fontFamily: D, fontWeight: 400, fontSize: "15px",
                    lineHeight: 1.15, letterSpacing: "-0.02em",
                    color: active ? "var(--color-near-white)" : "var(--color-ash-gray)",
                    transition: "color 0.15s",
                  }}>
                    {s.name}
                  </span>
                  <span style={{
                    fontFamily: M, fontSize: "9px", fontWeight: 500,
                    color: active ? AQUA : "#404040",
                    letterSpacing: "0.08em", textTransform: "uppercase",
                    transition: "color 0.15s",
                  }}>
                    {s.timeframe}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── Right: detail panel ── */}
          <div style={{ backgroundColor: INNER, overflow: "hidden" }}>
            {selected ? (
              <SetupDetail s={selected} />
            ) : (
              <div style={{ padding: "48px", textAlign: "center", fontFamily: M, fontSize: "12px", color: "var(--color-ash-gray)" }}>
                Select a setup
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
