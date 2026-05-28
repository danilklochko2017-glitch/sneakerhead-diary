"use client";

import { useEffect, useRef } from "react";

const BG   = "#191919"; // must match --surface-card
const CW   = 8;         // candle body width px
const GAP  = 5;
const STEP = CW + GAP;

// Price range candles live in
const P_MIN = 60;
const P_MAX = 340;
const P_RANGE = P_MAX - P_MIN;

interface Candle { open: number; close: number; high: number; low: number }

function makeCandles(n: number, startPrice = 200): Candle[] {
  const out: Candle[] = [];
  let p     = startPrice;
  let trend = 0;

  for (let i = 0; i < n; i++) {
    // Mean reversion + trend momentum — keeps price in visible range
    const reversion = (200 - p) * 0.03;
    trend = trend * 0.75 + (Math.random() - 0.5) * 18;
    const move = trend + reversion + (Math.random() - 0.5) * 8;

    const open  = p;
    const close = Math.max(P_MIN + 10, Math.min(P_MAX - 10, p + move));
    p = close;

    const body = Math.abs(close - open);

    // Realistic TradingView-style wicks
    const spike     = Math.random() < 0.10; // 10% spike candles
    const wickScale = spike ? 2.5 + Math.random() * 2 : 0.4 + Math.random() * 1.4;
    const minWick   = 3;
    const upperWick = body * wickScale * (0.4 + Math.random() * 0.6) + minWick;
    const lowerWick = body * wickScale * (0.4 + Math.random() * 0.6) + minWick;

    out.push({
      open,  close,
      high: Math.max(open, close) + upperWick,
      low:  Math.min(open, close) - lowerWick,
    });
  }
  return out;
}

export default function CandleBackground() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const candles = makeCandles(300);
    let offset = 0;
    let W = 0, H = 0;
    let raf = 0, prev = 0;

    function resize() {
      W = canvas!.offsetWidth;
      H = canvas!.offsetHeight;
      canvas!.width  = W;
      canvas!.height = H;
    }
    resize();

    // Candles occupy upper 75% of canvas so they sit high in the card
    function scaleY(p: number) {
      const yTop = H * 0.05;   // P_MAX maps here (near top)
      const yBot = H * 0.80;   // P_MIN maps here (lower portion)
      return yTop + (1 - (p - P_MIN) / P_RANGE) * (yBot - yTop);
    }

    function draw() {
      ctx!.clearRect(0, 0, W, H);

      const first = Math.max(0, Math.floor(offset / STEP) - 1);
      const last  = Math.min(candles.length - 1, Math.ceil((offset + W) / STEP) + 2);

      for (let i = first; i <= last; i++) {
        const c    = candles[i];
        const x    = i * STEP - offset;
        const bull = c.close >= c.open;

        const bTop = scaleY(Math.max(c.open, c.close));
        const bBot = scaleY(Math.min(c.open, c.close));
        const bH   = Math.max(1.5, bBot - bTop);
        const cx   = x + CW / 2;

        // ── Wick ──
        ctx!.lineWidth   = 1;
        ctx!.strokeStyle = bull
          ? "rgba(255,255,255,0.55)"
          : "rgba(255,255,255,0.35)";
        ctx!.beginPath();
        ctx!.moveTo(cx, scaleY(c.high));
        ctx!.lineTo(cx, scaleY(c.low));
        ctx!.stroke();

        // ── Body ──
        if (bull) {
          // Bullish: solid filled white
          ctx!.fillStyle = "rgba(255,255,255,0.65)";
          ctx!.fillRect(x, bTop, CW, bH);
        } else {
          // Bearish: hollow outline — TradingView style on dark bg
          ctx!.strokeStyle = "rgba(255,255,255,0.42)";
          ctx!.lineWidth   = 1;
          ctx!.strokeRect(x + 0.5, bTop + 0.5, CW - 1, bH - 1);
        }
      }

      // grow pool when running low
      if (last >= candles.length - 20)
        candles.push(...makeCandles(60, candles[candles.length - 1].close));

      // ── Gradient masks — fade edges into card bg ──
      const masks: [CanvasGradient, number, number, number, number][] = [];

      const gl = ctx!.createLinearGradient(0, 0, W * 0.18, 0);
      gl.addColorStop(0, BG); gl.addColorStop(1, "transparent");
      masks.push([gl, 0, 0, W * 0.18, H]);

      const gr = ctx!.createLinearGradient(W * 0.82, 0, W, 0);
      gr.addColorStop(0, "transparent"); gr.addColorStop(1, BG);
      masks.push([gr, W * 0.82, 0, W * 0.18, H]);

      const gt = ctx!.createLinearGradient(0, 0, 0, H * 0.12);
      gt.addColorStop(0, BG); gt.addColorStop(1, "transparent");
      masks.push([gt, 0, 0, W, H * 0.12]);

      const gb = ctx!.createLinearGradient(0, H * 0.72, 0, H);
      gb.addColorStop(0, "transparent"); gb.addColorStop(1, BG);
      masks.push([gb, 0, H * 0.72, W, H * 0.28]);

      for (const [g, x, y, w, h] of masks) {
        ctx!.fillStyle = g;
        ctx!.fillRect(x, y, w, h);
      }
    }

    function tick(ts: number) {
      if (prev) offset += (ts - prev) * 0.022;
      prev = ts;
      draw();
      raf = requestAnimationFrame(tick);
    }

    if (reducedMotion) {
      // Static snapshot — no scrolling animation
      resize();
      draw();
    } else {
      raf = requestAnimationFrame(tick);
    }

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  return (
    <canvas
      ref={ref}
      style={{
        position: "absolute", inset: 0,
        width: "100%", height: "100%",
        display: "block", zIndex: 0,
      }}
    />
  );
}
