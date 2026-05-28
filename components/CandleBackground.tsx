"use client";

import { useEffect, useRef } from "react";

const BG = "#191919"; // must match --surface-card
const CW   = 7;       // candle body width
const GAP  = 6;       // gap between candles
const STEP = CW + GAP;

interface Candle { open: number; close: number; high: number; low: number }

function makeCandles(n: number, startPrice = 100): Candle[] {
  const out: Candle[] = [];
  let p = startPrice;
  for (let i = 0; i < n; i++) {
    const move = (Math.random() - 0.47) * 8;
    const open  = p;
    const close = Math.max(15, Math.min(185, p + move));
    p = close;
    out.push({
      open, close,
      high: Math.max(open, close) + Math.random() * 5,
      low:  Math.min(open, close) - Math.random() * 5,
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

    function scaleY(p: number) {
      const pad = 22;
      return pad + (1 - p / 200) * (H - pad * 2);
    }

    function draw() {
      ctx!.clearRect(0, 0, W, H);

      const first = Math.max(0, Math.floor(offset / STEP) - 1);
      const last  = Math.min(candles.length - 1, Math.ceil((offset + W) / STEP) + 2);

      for (let i = first; i <= last; i++) {
        const c = candles[i];
        const x    = i * STEP - offset;
        const bull = c.close >= c.open;
        const bTop = scaleY(Math.max(c.open, c.close));
        const bBot = scaleY(Math.min(c.open, c.close));
        const bH   = Math.max(1.5, bBot - bTop);

        ctx!.strokeStyle = "rgba(255,255,255,0.45)";
        ctx!.fillStyle   = "rgba(255,255,255,0.45)";
        ctx!.lineWidth   = 1;

        // wick
        ctx!.beginPath();
        ctx!.moveTo(x + CW / 2, scaleY(c.high));
        ctx!.lineTo(x + CW / 2, scaleY(c.low));
        ctx!.stroke();

        // body
        if (bull) ctx!.fillRect(x, bTop, CW, bH);
        else       ctx!.strokeRect(x, bTop, CW, bH);
      }

      // grow pool when running low
      if (last >= candles.length - 20)
        candles.push(...makeCandles(60, candles[candles.length - 1].close));

      // ── gradient masks (painted over candles so no hard edges) ──
      const left = ctx!.createLinearGradient(0, 0, W * 0.30, 0);
      left.addColorStop(0, BG); left.addColorStop(1, "transparent");

      const right = ctx!.createLinearGradient(W * 0.70, 0, W, 0);
      right.addColorStop(0, "transparent"); right.addColorStop(1, BG);

      const top = ctx!.createLinearGradient(0, 0, 0, H * 0.30);
      top.addColorStop(0, BG); top.addColorStop(1, "transparent");

      const bottom = ctx!.createLinearGradient(0, H * 0.65, 0, H);
      bottom.addColorStop(0, "transparent"); bottom.addColorStop(1, BG);

      for (const [g, x, y, w, h] of [
        [left,   0,        0,        W * 0.30, H       ],
        [right,  W * 0.70, 0,        W * 0.30, H       ],
        [top,    0,        0,        W,        H * 0.30 ],
        [bottom, 0,        H * 0.65, W,        H * 0.35],
      ] as [CanvasGradient, number, number, number, number][]) {
        ctx!.fillStyle = g;
        ctx!.fillRect(x, y, w, h);
      }
    }

    function tick(ts: number) {
      if (prev) offset += (ts - prev) * 0.020; // ~1.2px/frame → very slow scroll
      prev = ts;
      draw();
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

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
        display: "block",
        zIndex: 0,
      }}
    />
  );
}
