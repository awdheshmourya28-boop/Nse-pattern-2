import React from 'react';
import { StockData, Trend } from '../types';
import { TrendingUp, TrendingDown, Minus, Check } from 'lucide-react';

interface HeatmapCellProps {
  data: StockData;
  onClick: (stock: StockData) => void;
  isSelected: boolean;
  onToggleSelect: (symbol: string) => void;
}

const HeatmapCell: React.FC<HeatmapCellProps> = ({ data, onClick, isSelected, onToggleSelect }) => {
  // Determine color intensity based on confidence and trend
  const getBackgroundColor = () => {
    if (isSelected) return 'ring-2 ring-offset-2 ring-offset-slate-950 ring-indigo-500'; // Highlighting selected
    if (data.trend === Trend.NEUTRAL) return 'bg-slate-700 hover:bg-slate-600';
    
    // Tailoring tailwind opacity classes roughly for demo, or using inline styles for precision
    if (data.trend === Trend.BULLISH) {
      if (data.confidenceScore > 80) return 'bg-emerald-500 hover:bg-emerald-400 text-black';
      if (data.confidenceScore > 60) return 'bg-emerald-700 hover:bg-emerald-600';
      return 'bg-emerald-900/50 hover:bg-emerald-800/50';
    } else {
      if (data.confidenceScore > 80) return 'bg-rose-500 hover:bg-rose-400 text-black';
      if (data.confidenceScore > 60) return 'bg-rose-700 hover:bg-rose-600';
      return 'bg-rose-900/50 hover:bg-rose-800/50';
    }
  };

  const getBaseColor = () => {
     if (data.trend === Trend.NEUTRAL) return 'bg-slate-700 hover:bg-slate-600';
     if (data.trend === Trend.BULLISH) {
        if (data.confidenceScore > 80) return 'bg-emerald-500 hover:bg-emerald-400 text-black';
        if (data.confidenceScore > 60) return 'bg-emerald-700 hover:bg-emerald-600';
        return 'bg-emerald-900/50 hover:bg-emerald-800/50';
     } else {
        if (data.confidenceScore > 80) return 'bg-rose-500 hover:bg-rose-400 text-black';
        if (data.confidenceScore > 60) return 'bg-rose-700 hover:bg-rose-600';
        return 'bg-rose-900/50 hover:bg-rose-800/50';
     }
  }

  const Icon = data.trend === Trend.BULLISH ? TrendingUp : data.trend === Trend.BEARISH ? TrendingDown : Minus;

  return (
    <div 
      className={`relative p-3 rounded-lg cursor-pointer transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg border border-slate-700/50 flex flex-col justify-between h-32 ${getBaseColor()} ${isSelected ? 'ring-2 ring-offset-2 ring-offset-slate-950 ring-indigo-500 z-10' : ''}`}
      onClick={() => onClick(data)}
    >
      {/* Selection Checkbox Overlay */}
      <div 
        className="absolute top-2 right-2 z-20"
        onClick={(e) => {
          e.stopPropagation();
          onToggleSelect(data.symbol);
        }}
      >
        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'bg-black/20 border-white/30 hover:border-white/70'}`}>
          {isSelected && <Check size={12} className="text-white" />}
        </div>
      </div>

      <div className="flex justify-between items-start pr-6">
        <span className="font-bold text-sm tracking-wide truncate">{data.symbol}</span>
      </div>
      <div className="text-xs font-mono opacity-80 -mt-6">{data.price.toFixed(1)}</div>

      <div className="flex flex-col items-center justify-center space-y-1 mt-1">
         {data.trend !== Trend.NEUTRAL && (
           <span className="text-xs font-bold uppercase opacity-90 text-center leading-tight truncate w-full">
             {data.pattern}
           </span>
         )}
         {data.trend === Trend.NEUTRAL && (
            <span className="text-xs text-slate-400">Scanning...</span>
         )}
         <div className="flex items-center space-x-1">
            <Icon size={16} />
            <span className="text-xs font-mono">{data.confidenceScore > 0 ? `${data.confidenceScore}%` : '-'}</span>
         </div>
      </div>
      
      <div className="text-[10px] text-right opacity-70 truncate">
        {data.sector}
      </div>
    </div>
  );
};

export default HeatmapCell;