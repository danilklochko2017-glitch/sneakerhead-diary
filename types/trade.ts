export type Session = "London" | "New York" | "Asian" | "Other";
export type Direction = "Long" | "Short" | "Unknown";
export type Result = "Win" | "Loss" | "BE" | "Pending";

export interface Trade {
  id: string;
  date: string;
  session: Session;
  instrument: string;
  direction: Direction;
  entry: number | null;   // not stored in this DB — always null
  sl: number | null;      // not stored in this DB — always null
  tp: number | null;      // not stored in this DB — always null
  rr: number;
  result: Result;
  notes: string;          // entry type (e.g. "1M CISD")
  setup?: string;         // setup name from Notion "Setup" relation/select (e.g. "GFM")
  note?: string;          // free-text note from the "Note" Notion field
  riskPct?: number;       // Risk (%) column
}

export interface TradeStats {
  netPnL: number;
  winRate: number;
  maxDrawdown: number;
  totalTrades: number;
  avgRR: number;
}

export interface EquityPoint {
  date: string;
  cumulative: number;
  london: number | null;
  newYork: number | null;
  session: Session;
  rr: number;
}

export interface SetupCard {
  id: string;
  name: string;
  description: string;
  instrument: string;
  timeframe: string;  // e.g. "1H / 15M / 1M"
  session: string;
  imageUrls: string[];
  tags: string[];
}

export interface MonthlyReview {
  month: string;      // "May"
  year: number;       // 2025
  trades: number;
  wins: number;
  losses: number;
  winRate: number;
  netRR: number;
  bestTrade: number;
  worstTrade: number;
  wentWell: string;
  toImprove: string;
}
