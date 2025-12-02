import React, { useState, useEffect, useMemo } from 'react';
import { generateMarketData, getSectors } from './services/mockDataService';
import { StockData, FilterState, Trend } from './types';
import HeatmapCell from './components/HeatmapCell';
import StockDetailModal from './components/StockDetailModal';
import LoginScreen from './components/LoginScreen';
import { Search, RefreshCw, BarChart3, Filter, LogOut, CheckSquare, Square, MessageCircle, X, Loader2, Check } from 'lucide-react';

const App: React.FC = () => {
  // Initialize auth state from localStorage (checking active session)
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return !!localStorage.getItem('nse_active_session');
  });
  
  // Data State
  const [data, setData] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStock, setSelectedStock] = useState<StockData | null>(null);
  
  // Selection State
  const [selectedSymbols, setSelectedSymbols] = useState<Set<string>>(new Set());
  const [isBulkBroadcasting, setIsBulkBroadcasting] = useState(false);
  const [bulkBroadcastSent, setBulkBroadcastSent] = useState(false);
  const [bulkCount, setBulkCount] = useState(0);

  // Filters
  const [filters, setFilters] = useState<FilterState>({
    sector: 'All',
    minConfidence: 0,
    trend: 'All',
    search: '',
  });

  const sectors = useMemo(() => ['All', ...getSectors()], []);

  const refreshData = () => {
    setLoading(true);
    // Simulate network delay
    setTimeout(() => {
      setData(generateMarketData());
      setLoading(false);
    }, 800);
  };

  // Only fetch data if logged in
  useEffect(() => {
    if (isLoggedIn) {
      refreshData();
      // Auto-refresh every 30 seconds to simulate market socket
      const interval = setInterval(refreshData, 30000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchSector = filters.sector === 'All' || item.sector === filters.sector;
      const matchSearch = item.symbol.toLowerCase().includes(filters.search.toLowerCase()) || 
                          item.name.toLowerCase().includes(filters.search.toLowerCase());
      const matchConfidence = item.confidenceScore >= filters.minConfidence;
      const matchTrend = filters.trend === 'All' || item.trend === filters.trend;

      return matchSector && matchSearch && matchConfidence && matchTrend;
    });
  }, [data, filters]);

  // Sorting: Put high confidence & bullish first
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => b.confidenceScore - a.confidenceScore);
  }, [filteredData]);

  // Stats
  const stats = useMemo(() => {
    const bullish = data.filter(d => d.trend === Trend.BULLISH).length;
    const bearish = data.filter(d => d.trend === Trend.BEARISH).length;
    const neutral = data.length - bullish - bearish;
    const avgConf = Math.round(data.reduce((acc, curr) => acc + curr.confidenceScore, 0) / (data.length || 1));
    return { bullish, bearish, neutral, avgConf };
  }, [data]);

  // Selection Logic
  const toggleSelectStock = (symbol: string) => {
    const newSet = new Set(selectedSymbols);
    if (newSet.has(symbol)) {
      newSet.delete(symbol);
    } else {
      newSet.add(symbol);
    }
    setSelectedSymbols(newSet);
  };

  const isAllSelected = filteredData.length > 0 && selectedSymbols.size >= filteredData.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedSymbols(new Set());
    } else {
      const newSet = new Set(filteredData.map(d => d.symbol));
      setSelectedSymbols(newSet);
    }
  };

  const checkVerificationStatus = () => {
     const session = JSON.parse(localStorage.getItem('nse_active_session') || '{}');
     return session.isWhatsAppVerified === true;
  };

  const handleBulkAlert = () => {
    if (selectedSymbols.size === 0) return;

    if (!checkVerificationStatus()) {
      alert("Please verify your WhatsApp number first by opening any stock detail.");
      return;
    }

    setIsBulkBroadcasting(true);
    setTimeout(() => {
       setIsBulkBroadcasting(false);
       setBulkCount(selectedSymbols.size);
       setBulkBroadcastSent(true);
       setTimeout(() => setBulkBroadcastSent(false), 5000);
       setSelectedSymbols(new Set()); // Optional: clear selection after send
    }, 2000);
  };

  // Render Login Screen if not authenticated
  if (!isLoggedIn) {
    return <LoginScreen onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-950 relative">
      
      {/* Bulk Toast */}
      {bulkBroadcastSent && (
          <div className="fixed top-24 right-6 z-[60] bg-[#075E54] border border-[#25D366]/50 text-white px-4 py-3 rounded-lg shadow-2xl flex items-start space-x-3 max-w-sm animate-in slide-in-from-top-2 fade-in duration-300">
            <MessageCircle className="shrink-0 mt-1 text-[#25D366] fill-current" size={20} />
            <div>
              <p className="font-bold text-sm">Bulk Alert Sent</p>
              <p className="text-xs text-slate-200 mt-1">
                Signals for <strong>{bulkCount} stocks</strong> have been queued for WhatsApp broadcast.
              </p>
            </div>
            <button onClick={() => setBulkBroadcastSent(false)} className="text-slate-300 hover:text-white">
              <X size={14} />
            </button>
          </div>
      )}

      {/* Navbar */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <BarChart3 className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">NSE PatternAlpha</h1>
              <p className="text-[10px] text-indigo-400 font-mono tracking-widest uppercase">Algorithmic Heatmap</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="hidden md:flex space-x-6 text-sm">
               <div className="flex flex-col items-center">
                 <span className="text-emerald-400 font-bold">{stats.bullish}</span>
                 <span className="text-slate-500 text-xs uppercase">Bullish</span>
               </div>
               <div className="flex flex-col items-center">
                 <span className="text-rose-400 font-bold">{stats.bearish}</span>
                 <span className="text-slate-500 text-xs uppercase">Bearish</span>
               </div>
               <div className="flex flex-col items-center">
                 <span className="text-indigo-400 font-bold">{stats.avgConf}%</span>
                 <span className="text-slate-500 text-xs uppercase">Avg Conf.</span>
               </div>
            </div>

            <div className="flex items-center space-x-2 border-l border-slate-700 pl-4">
              <button 
                onClick={refreshData} 
                className={`p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all ${loading ? 'animate-spin' : ''}`}
                title="Refresh Data"
              >
                <RefreshCw size={20} />
              </button>
              
              <button 
                onClick={() => {
                  localStorage.removeItem('nse_active_session');
                  setIsLoggedIn(false);
                }}
                className="p-2 rounded-full bg-slate-800 hover:bg-rose-900/30 text-slate-300 hover:text-rose-400 transition-all"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Controls */}
      <div className="bg-slate-950 border-b border-slate-800 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-4">
          
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            {/* Search */}
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text" 
                placeholder="Search symbol..." 
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-4 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
              <div className="flex items-center space-x-2">
                  <Filter size={16} className="text-slate-500" />
                  <span className="text-sm text-slate-400">Filters:</span>
              </div>
              
              <select 
                value={filters.sector} 
                onChange={(e) => setFilters({...filters, sector: e.target.value})}
                className="bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-slate-300 outline-none focus:border-indigo-500"
              >
                {sectors.map(s => <option key={s} value={s}>{s}</option>)}
              </select>

              <select 
                value={filters.trend} 
                onChange={(e) => setFilters({...filters, trend: e.target.value})}
                className="bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-slate-300 outline-none focus:border-indigo-500"
              >
                <option value="All">All Trends</option>
                <option value={Trend.BULLISH}>Bullish Only</option>
                <option value={Trend.BEARISH}>Bearish Only</option>
                <option value={Trend.NEUTRAL}>Scanning/Neutral</option>
              </select>

              <select 
                value={filters.minConfidence} 
                onChange={(e) => setFilters({...filters, minConfidence: parseInt(e.target.value)})}
                className="bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-slate-300 outline-none focus:border-indigo-500"
              >
                <option value={0}>All Confidence</option>
                <option value={50}>50%+</option>
                <option value={70}>70%+</option>
                <option value={85}>85%+ (High Prob)</option>
              </select>
            </div>
          </div>

          {/* Bulk Action Bar - Sticky if selected > 0 */}
          <div className="flex items-center justify-between border-t border-slate-800 pt-4">
             <div className="flex items-center space-x-3">
               <button 
                 onClick={toggleSelectAll}
                 className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors"
               >
                 {isAllSelected ? <CheckSquare size={20} className="text-indigo-500" /> : <Square size={20} />}
                 <span className="text-sm font-medium">Select All Filtered</span>
               </button>
               {selectedSymbols.size > 0 && (
                 <span className="text-sm text-slate-500 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">
                    {selectedSymbols.size} selected
                 </span>
               )}
             </div>

             {selectedSymbols.size > 0 && (
               <button
                 onClick={handleBulkAlert}
                 disabled={isBulkBroadcasting}
                 className="flex items-center space-x-2 bg-[#25D366] hover:bg-[#128C7E] text-white px-4 py-1.5 rounded-md text-sm font-bold shadow-lg shadow-green-900/20 transition-all transform hover:scale-105"
               >
                 {isBulkBroadcasting ? <Loader2 size={16} className="animate-spin" /> : <MessageCircle size={16} fill="white" className="text-white" />}
                 <span>Send Alerts ({selectedSymbols.size})</span>
               </button>
             )}
          </div>

        </div>
      </div>

      {/* Heatmap Grid */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {sortedData.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
               <Filter size={48} className="mb-4 opacity-50" />
               <p>No stocks match your criteria.</p>
            </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {sortedData.map((stock) => (
              <HeatmapCell 
                key={stock.symbol} 
                data={stock} 
                onClick={setSelectedStock}
                isSelected={selectedSymbols.has(stock.symbol)}
                onToggleSelect={toggleSelectStock}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500">
          <p>NSE PatternAlpha &copy; 2025. Market Data Simulated. Not Financial Advice.</p>
          <p className="mt-1">System Status: <span className="text-emerald-500">Online</span> • AI Engine: <span className="text-purple-400">Gemini Flash</span> • Latency: 12ms</p>
        </div>
      </footer>

      {/* Modal */}
      {selectedStock && (
        <StockDetailModal 
          stock={selectedStock} 
          onClose={() => setSelectedStock(null)} 
        />
      )}
    </div>
  );
};

export default App;