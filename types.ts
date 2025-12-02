
export enum Trend {
  BULLISH = 'Bullish',
  BEARISH = 'Bearish',
  NEUTRAL = 'Neutral',
}

export enum PatternType {
  CUP_AND_HANDLE = 'Cup & Handle',
  HEAD_AND_SHOULDERS = 'Head & Shoulders',
  DOUBLE_BOTTOM = 'Double Bottom',
  BULL_FLAG = 'Bull Flag',
  BEAR_FLAG = 'Bear Flag',
  WEDGE_FALLING = 'Falling Wedge',
  WEDGE_RISING = 'Rising Wedge',
  NONE = 'No Pattern',
}

export interface HistoricalOccurrence {
  id: string;
  date: string;
  pattern: PatternType;
  outcomePercent: number; // e.g. +5.2%
  durationDays: number;
}

export interface StockData {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  changePercent: number;
  volume: number;
  lastUpdated: string;
  pattern: PatternType;
  trend: Trend;
  confidenceScore: number; // 0-100
  historicalAccuracy: number; // 0-100%
  expectedMove: number; // Percentage
  volatilityScore: number; // 0-100 (IV/ATR based)
  pastOccurrences: HistoricalOccurrence[];
}

export interface ChartPoint {
  time: string;
  price: number;
  ma20?: number;
  ma50?: number;
  rsi?: number;      // Relative Strength Index
  bbUpper?: number;  // Bollinger Band Upper
  bbLower?: number;  // Bollinger Band Lower
}

export interface FilterState {
  sector: string;
  minConfidence: number;
  trend: string;
  search: string;
}
