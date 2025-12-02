
import { StockData, PatternType, Trend, ChartPoint, HistoricalOccurrence } from '../types';

const NSE_TICKERS = [
  { symbol: 'RELIANCE', name: 'Reliance Industries', sector: 'Energy' },
  { symbol: 'TCS', name: 'Tata Consultancy Svcs', sector: 'IT' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank', sector: 'Financials' },
  { symbol: 'INFY', name: 'Infosys', sector: 'IT' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank', sector: 'Financials' },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever', sector: 'Consumer' },
  { symbol: 'ITC', name: 'ITC Ltd', sector: 'Consumer' },
  { symbol: 'SBIN', name: 'State Bank of India', sector: 'Financials' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel', sector: 'Telecom' },
  { symbol: 'LICI', name: 'LIC India', sector: 'Financials' },
  { symbol: 'LT', name: 'Larsen & Toubro', sector: 'Construction' },
  { symbol: 'TATAMOTORS', name: 'Tata Motors', sector: 'Auto' },
  { symbol: 'AXISBANK', name: 'Axis Bank', sector: 'Financials' },
  { symbol: 'SUNPHARMA', name: 'Sun Pharma', sector: 'Healthcare' },
  { symbol: 'MARUTI', name: 'Maruti Suzuki', sector: 'Auto' },
  { symbol: 'ULTRACEMCO', name: 'UltraTech Cement', sector: 'Materials' },
  { symbol: 'ASIANPAINT', name: 'Asian Paints', sector: 'Materials' },
  { symbol: 'TITAN', name: 'Titan Company', sector: 'Consumer' },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance', sector: 'Financials' },
  { symbol: 'WIPRO', name: 'Wipro', sector: 'IT' },
  { symbol: 'HCLTECH', name: 'HCL Technologies', sector: 'IT' },
  { symbol: 'NESTLEIND', name: 'Nestle India', sector: 'Consumer' },
  { symbol: 'ADANIENT', name: 'Adani Enterprises', sector: 'Diversified' },
  { symbol: 'POWERGRID', name: 'Power Grid Corp', sector: 'Utilities' },
  { symbol: 'ONGC', name: 'ONGC', sector: 'Energy' },
  { symbol: 'NTPC', name: 'NTPC', sector: 'Utilities' },
  { symbol: 'GRASIM', name: 'Grasim Industries', sector: 'Materials' },
  { symbol: 'JSWSTEEL', name: 'JSW Steel', sector: 'Materials' },
  { symbol: 'TATASTEEL', name: 'Tata Steel', sector: 'Materials' },
  { symbol: 'M&M', name: 'Mahindra & Mahindra', sector: 'Auto' },
];

const PATTERNS = [
  PatternType.CUP_AND_HANDLE,
  PatternType.HEAD_AND_SHOULDERS,
  PatternType.DOUBLE_BOTTOM,
  PatternType.BULL_FLAG,
  PatternType.BEAR_FLAG,
  PatternType.WEDGE_FALLING,
  PatternType.WEDGE_RISING,
  PatternType.NONE,
];

const getRandomFloat = (min: number, max: number, decimals: number = 2) => {
  const str = (Math.random() * (max - min) + min).toFixed(decimals);
  return parseFloat(str);
};

const getRandomInt = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const getRandomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const generatePastOccurrences = (pattern: PatternType): HistoricalOccurrence[] => {
  if (pattern === PatternType.NONE) return [];
  
  const count = getRandomInt(5, 15);
  const occurrences: HistoricalOccurrence[] = [];
  const now = new Date();
  const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());

  for (let i = 0; i < count; i++) {
    // Bias outcome based on pattern "validity" (just a random seed here)
    const isWin = Math.random() > 0.35; 
    const outcome = isWin ? getRandomFloat(2, 18) : getRandomFloat(-8, -1);
    
    occurrences.push({
      id: `hist-${i}-${Math.random()}`,
      date: getRandomDate(twoYearsAgo, now).toLocaleDateString(),
      pattern: pattern, 
      outcomePercent: outcome,
      durationDays: getRandomInt(3, 25)
    });
  }
  // Sort by date desc
  return occurrences.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const generateMarketData = (): StockData[] => {
  return NSE_TICKERS.map((ticker) => {
    const isPattern = Math.random() > 0.3; // 70% chance of a pattern
    const pattern = isPattern ? PATTERNS[getRandomInt(0, PATTERNS.length - 2)] : PatternType.NONE;
    
    let trend = Trend.NEUTRAL;
    if (pattern !== PatternType.NONE) {
        if ([PatternType.CUP_AND_HANDLE, PatternType.DOUBLE_BOTTOM, PatternType.BULL_FLAG, PatternType.WEDGE_FALLING].includes(pattern)) {
            trend = Trend.BULLISH;
        } else {
            trend = Trend.BEARISH;
        }
    }

    const confidenceScore = pattern === PatternType.NONE ? 0 : getRandomInt(45, 98);
    if (confidenceScore < 50 && pattern !== PatternType.NONE) trend = Trend.NEUTRAL;

    // Generate Backtest Data
    const pastOccurrences = generatePastOccurrences(pattern);
    const wins = pastOccurrences.filter(o => o.outcomePercent > 0).length;
    const historicalAccuracy = pastOccurrences.length > 0 ? Math.round((wins / pastOccurrences.length) * 100) : 0;

    return {
      symbol: ticker.symbol,
      name: ticker.name,
      sector: ticker.sector,
      price: getRandomFloat(100, 4000),
      changePercent: getRandomFloat(-4, 4),
      volume: getRandomInt(50000, 5000000),
      lastUpdated: new Date().toLocaleTimeString(),
      pattern,
      trend,
      confidenceScore,
      historicalAccuracy: pattern === PatternType.NONE ? 0 : historicalAccuracy,
      expectedMove: pattern === PatternType.NONE ? 0 : getRandomFloat(2, 12),
      volatilityScore: getRandomInt(20, 80),
      pastOccurrences
    };
  });
};

export const generateHistoryData = (startPrice: number): ChartPoint[] => {
  const points: ChartPoint[] = [];
  let price = startPrice;
  const now = new Date();
  
  // Generate 60 points (e.g., 60 days or 60 hours)
  for (let i = 60; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 24 * 60 * 60 * 1000).toLocaleDateString();
    const change = getRandomFloat(-2, 2); // Daily volatility
    price = price * (1 + change / 100);
    
    // Simulate Indicators
    const rsi = 50 + Math.sin(i * 0.5) * 20 + (Math.random() * 10 - 5);
    const bbStdDev = price * 0.05; // Simplified 5% width
    const ma20 = i < 50 ? parseFloat((price * (1 + (Math.random() * 0.05 - 0.025))).toFixed(2)) : undefined;
    
    points.push({
      time,
      price: parseFloat(price.toFixed(2)),
      ma20: ma20, 
      ma50: i < 30 ? parseFloat((price * (1 + (Math.random() * 0.1 - 0.05))).toFixed(2)) : undefined,
      rsi: parseFloat(rsi.toFixed(2)),
      bbUpper: parseFloat((ma20 ? ma20 + bbStdDev : price + bbStdDev).toFixed(2)),
      bbLower: parseFloat((ma20 ? ma20 - bbStdDev : price - bbStdDev).toFixed(2)),
    });
  }
  return points;
};

export const getSectors = () => Array.from(new Set(NSE_TICKERS.map(t => t.sector)));
