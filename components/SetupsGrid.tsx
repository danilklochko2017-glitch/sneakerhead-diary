"use client";

import { useState } from "react";
import type { SetupCard } from "@/types/trade";
import Image from "next/image";

const DISPLAY = "var(--font-mono)";
const BODY    = "var(--font-mono)";
const INNER   = "#22242A";

// ─── Inline markdown renderer ────────────────────────────────────────────────

function renderInline(text: string): React.ReactNode[] {
  const result: React.ReactNode[] = [];
  const boldRx = /\*\*(.+?)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = boldRx.exec(text)) !== null) {
    if (m.index > last) result.push(text.slice(last, m.index));
    result.push(
      <strong key={m.index} style={{ color: "#FFF93C", fontWeight: 700 }}>
        {m[1]}
      </strong>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) result.push(text.slice(last));
  return result;
}

// ─── Section parser (splits on ### headings) ────────────────────────────────

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
      if (current.title || current.lines.some((l) => l.trim())) {
        sections.push(current);
      }
      current = { title: line.slice(4).trim(), lines: [] };
    } else {
      // detect backtest link anywhere
      const linkM = line.match(/^(.+?):\s+Link\s+\((.+?)\)\s*$/);
      if (linkM) {
        current.link = { label: linkM[1], url: linkM[2] };
      } else {
        current.lines.push(line);
      }
    }
  }
  if (current.title || current.lines.some((l) => l.trim())) {
    sections.push(current);
  }
  return sections;
}

function renderSectionLines(lines: string[]) {
  return lines
    .filter((line, i, arr) => {
      // trim leading/trailing empty lines
      if (line.trim() !== "") return true;
      const firstContent = arr.findIndex((l) => l.trim());
      const lastContent  = arr.length - 1 - [...arr].reverse().findIndex((l) => l.trim());
      return i > firstContent && i < lastContent;
    })
    .map((line, idx) => {
      const numM = line.match(/^(\d+)\.\s+(.+)/);
      if (numM) {
        return (
          <div key={idx} style={{ display: "flex", gap: "10px", marginBottom: "5px" }}>
            <span style={{ color: "#FFF93C", fontWeight: 700, flexShrink: 0, fontFamily: BODY, fontSize: "14px", minWidth: "14px" }}>
              {numM[1]}.
            </span>
            <span style={{ fontFamily: BODY, fontSize: "14px", color: "#e5e7eb", lineHeight: "1.7" }}>
              {renderInline(numM[2])}
            </span>
          </div>
        );
      }
      if (line.startsWith("- ")) {
        return (
          <div key={idx} style={{ display: "flex", gap: "10px", marginBottom: "5px" }}>
            <span style={{ color: "#FFF93C", flexShrink: 0, fontFamily: BODY, fontSize: "14px" }}>—</span>
            <span style={{ fontFamily: BODY, fontSize: "14px", color: "#e5e7eb", lineHeight: "1.7" }}>
              {renderInline(line.slice(2))}
            </span>
          </div>
        );
      }
      if (line.trim() === "") return <div key={idx} style={{ height: "4px" }} />;
      return (
        <p key={idx} style={{ fontFamily: BODY, fontSize: "14px", lineHeight: "1.7", color: "#e5e7eb" }}>
          {renderInline(line)}
        </p>
      );
    });
}

function renderDescriptionBlocks(text: string) {
  const sections = parseDescriptionSections(text);

  // collect any link from any section
  const backtest = sections.find((s) => s.link)?.link;

  const contentSections = sections.filter((s) => s.title || s.lines.some((l) => l.trim()));

  return (
    <div>
      <div style={{
        display: "flex", flexDirection: "column",
        gap: "1px", backgroundColor: "#3a3a3f",
      }}>
        {contentSections.map((section, i) => (
          <div key={i} style={{ padding: "16px 20px", backgroundColor: INNER }}>
            {section.title && (
              <div style={{
                fontFamily: BODY, fontSize: "12px", fontWeight: 700,
                color: "#6b7280", textTransform: "uppercase",
                letterSpacing: "0.06em", marginBottom: "10px",
              }}>
                {section.title}
              </div>
            )}
            {renderSectionLines(section.lines)}
          </div>
        ))}
      </div>

      {/* Backtest link — own block at the bottom */}
      {backtest && (
        <div style={{
          marginTop: "1px", padding: "14px 20px",
          backgroundColor: INNER,
          display: "flex", alignItems: "center", gap: "10px",
        }}>
          <span style={{ fontFamily: BODY, fontSize: "12px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {backtest.label}
          </span>
          <a
            href={backtest.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: BODY, fontSize: "12px", fontWeight: 600,
              color: "#FFF93C", textDecoration: "none",
              border: "1px solid rgba(255,249,60,0.4)",
              backgroundColor: "rgba(255,249,60,0.08)",
              borderRadius: "9999px", padding: "2px 10px",
            }}
          >
            Открыть ↗
          </a>
        </div>
      )}
    </div>
  );
}

// ─── Setup Card (accordion) ──────────────────────────────────────────────────

function SetupCardUI({ s }: { s: SetupCard }) {
  const [open, setOpen] = useState(false);

  const metaItems = [
    { l: "Timeframes", v: s.timeframe },
    { l: "Sessions",   v: s.session   },
  ];

  return (
    <div style={{ backgroundColor: INNER, borderRadius: "10px", overflow: "hidden" }}>
      {/* ── Header ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%", background: "none", border: "none",
          padding: "0 20px", minHeight: "72px", cursor: "pointer",
          display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: "12px",
          flexWrap: "wrap", textAlign: "left",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <span style={{
            fontFamily: DISPLAY, fontWeight: 700, fontSize: "18px",
            lineHeight: 1.1, color: "#ffffff", letterSpacing: "-0.01em",
          }}>
            {s.name}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
          {metaItems.map((item) => (
            <div key={item.l} style={{ textAlign: "right" }}>
              <div style={{
                fontFamily: BODY, fontSize: "12px", fontWeight: 600,
                color: "#6b7280", marginBottom: "2px",
                textTransform: "uppercase", letterSpacing: "0.06em",
              }}>
                {item.l}
              </div>
              <div style={{ fontFamily: BODY, fontSize: "12px", fontWeight: 500, color: "#e5e7eb" }}>
                {item.v}
              </div>
            </div>
          ))}

          <div style={{
            width: "26px", height: "26px", borderRadius: "9999px",
            border: "1px solid #3a3a3f",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "transform 0.25s",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            flexShrink: 0,
          }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 4.5L6 7.5L10 4.5" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </button>

      {/* ── Expanded body ── */}
      {open && (
        <div style={{ borderTop: "1px solid #3a3a3f" }}>
          {/* Description blocks */}
          {renderDescriptionBlocks(s.description)}

          {/* Images */}
          {s.imageUrls.length > 0 && (
            <div style={{
              padding: "0 20px 20px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: "10px",
            }}>
              {s.imageUrls.map((url, i) => (
                <div key={i} style={{
                  borderRadius: "8px", overflow: "hidden",
                  aspectRatio: "16/9", position: "relative",
                  backgroundColor: "#14151a", border: "1px solid #3a3a3f",
                }}>
                  <Image src={url} alt={`${s.name} chart ${i + 1}`}
                    fill style={{ objectFit: "cover" }} unoptimized />
                </div>
              ))}
            </div>
          )}

          {/* Tags */}
          {s.tags.length > 0 && (
            <div style={{
              padding: "16px 20px",
              borderTop: "1px solid #3a3a3f",
              display: "flex", gap: "8px", flexWrap: "wrap",
            }}>
              {s.tags.map((tag) => (
                <span key={tag} style={{
                  fontFamily: BODY, fontSize: "12px", fontWeight: 500,
                  color: "#6b7280", border: "1px solid rgba(107,114,128,0.25)",
                  backgroundColor: "rgba(107,114,128,0.08)",
                  borderRadius: "9999px", padding: "3px 10px",
                }}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Grid ────────────────────────────────────────────────────────────────────

export default function SetupsGrid({ setups }: { setups: SetupCard[] }) {
  return (
    <div id="setups" className="card-glow" style={{
      backgroundColor: "#14151a",
      borderRadius: "12px",
      boxShadow: "0 8px 48px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2)",
      padding: "32px",
    }}>
      <div style={{ marginBottom: "20px" }}>
        <p style={{
          fontFamily: BODY, fontSize: "12px", fontWeight: 600,
          color: "#6b7280", marginBottom: "6px",
          textTransform: "uppercase", letterSpacing: "0.06em",
        }}>
          Playbook
        </p>
        <h2 style={{
          fontFamily: DISPLAY, fontWeight: 700, fontSize: "24px",
          lineHeight: 1.1, color: "#ffffff", letterSpacing: "-0.01em",
        }}>
          Setups
        </h2>
      </div>

      {setups.length === 0 ? (
        <div style={{
          borderRadius: "10px", padding: "48px",
          textAlign: "center", fontFamily: BODY, fontSize: "14px",
          color: "#6b7280", backgroundColor: INNER,
        }}>
          No setups loaded.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {setups.map((s) => <SetupCardUI key={s.id} s={s} />)}
        </div>
      )}
    </div>
  );
}
