
import React, { useEffect, useState } from 'react';
import { StockData, ChartPoint } from '../types';
import { generateHistoryData } from '../services/mockDataService';
import { fetchAIAnalysis } from '../services/geminiService';
import { X, BrainCircuit, Activity, Target, History, AlertTriangle, Loader2, Calendar, TrendingUp, TrendingDown, Bell, MessageCircle, Check, ArrowLeft, Settings, Crosshair, TrendingUp as TrendIcon } from 'lucide-react';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine
} from 'recharts';

interface StockDetailModalProps {
  stock: StockData | null;
  onClose: () => void;
}

interface AIAnalysisResult {
  verdict: string;
  summary: string;
  keyLevels: {
    support: string;
    resistance: string;
    invalidation: string;
  };
  riskAssessment: string;
}

type Tab = 'overview' | 'backtest';

const StockDetailModal: React.FC<StockDetailModalProps> = ({ stock, onClose }) => {
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [errorAi, setErrorAi] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  
  // Alert States
  const [alertSet, setAlertSet] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastSent, setBroadcastSent] = useState(false);

  // Verification States
  const [showVerification, setShowVerification] = useState(false);
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Trade Planner & Indicator States
  const [targetPrice, setTargetPrice] = useState<number>(0);
  const [stopLoss, setStopLoss] = useState<number>(0);
  const [showBB, setShowBB] = useState(false); // Bollinger Bands
  const [showRSI, setShowRSI] = useState(false); // Relative Strength Index

  useEffect(() => {
    if (stock) {
      setChartData(generateHistoryData(stock.price));
      setAiAnalysis(null);
      setErrorAi(null);
      setActiveTab('overview');
      setAlertSet(false);
      setBroadcastSent(false);
      setShowVerification(false);
      setOtp('');
      
      // Initialize Default Trade Plan
      const expectedMoveVal = (stock.price * stock.expectedMove) / 100;
      setTargetPrice(parseFloat((stock.price + expectedMoveVal).toFixed(2)));
      setStopLoss(parseFloat((stock.price - (expectedMoveVal / 2)).toFixed(2)));
    }
  }, [stock]);

  if (!stock) return null;

  const handleRunAnalysis = async () => {
    setLoadingAi(true);
    setErrorAi(null);
    try {
      const result = await fetchAIAnalysis(stock);
      setAiAnalysis(result);
    } catch (err) {
      setErrorAi("Unable to generate analysis. Check API Key or connectivity.");
    } finally {
      setLoadingAi(false);
    }
  };

  const checkVerificationStatus = () => {
     const session = JSON.parse(localStorage.getItem('nse_active_session') || '{}');
     // Allow if explicitly verified or if role is admin
     return session.isWhatsAppVerified === true || session.role === 'admin';
  };

  const updateVerificationStatus = () => {
     // Update Session
     const session = JSON.parse(localStorage.getItem('nse_active_session') || '{}');
     session.isWhatsAppVerified = true;
     localStorage.setItem('nse_active_session', JSON.stringify(session));

     // Update Database
     const db = JSON.parse(localStorage.getItem('nse_users_db') || '[]');
     const userIndex = db.findIndex((u: any) => u.id === session.id);
     if (userIndex !== -1) {
        db[userIndex].isWhatsAppVerified = true;
        localStorage.setItem('nse_users_db', JSON.stringify(db));
     }
  };

  const handleVerifyOtp = () => {
     setIsVerifying(true);
     setTimeout(() => {
        if (otp === '1234') { // Mock OTP
           updateVerificationStatus();
           setShowVerification(false);
           setIsVerifying(false);
           // Proceed to send alert
           sendBroadcast();
        } else {
           alert('Invalid OTP. Use 1234.');
           setIsVerifying(false);
        }
     }, 1000);
  };

  const sendBroadcast = () => {
    setIsBroadcasting(true);
    
    // Simulate network delay for broadcasting to "all login numbers"
    setTimeout(() => {
      setIsBroadcasting(false);
      setAlertSet(true);
      setBroadcastSent(true);
      
      // Auto-dismiss the success toast after 4 seconds
      setTimeout(() => setBroadcastSent(false), 4000);
      
      // Log for debugging
      console.log(`[WhatsApp Mock] Broadcast sent to all active sessions for ${stock.symbol} | Tgt: ${targetPrice}, SL: ${stopLoss}`);
    }, 1500);
  };

  const toggleAlert = () => {
    if (alertSet) {
      // Turn off alert
      setAlertSet(false);
      setBroadcastSent(false);
      return;
    }

    if (!checkVerificationStatus()) {
       setShowVerification(true);
       return;
    }

    sendBroadcast();
  };

  // Helper to color the verdict
  const getVerdictColor = (v: string) => {
    if (v.includes('Buy')) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (v.includes('Sell')) return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
    return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
  };

  // Risk Reward Calculation
  const risk = stock.price - stopLoss;
  const reward = targetPrice - stock.price;
  const rrRatio = risk > 0 ? (reward / risk).toFixed(2) : 'N/A';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative">
        
        {/* Verification Modal Overlay */}
        {showVerification && (
           <div className="absolute inset-0 z-[70] bg-black/60 flex items-center justify-center p-4">
              <div className="bg-slate-800 border border-slate-600 p-6 rounded-lg w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
                 <div className="text-center mb-4">
                    <div className="bg-[#25D366]/20 p-3 rounded-full inline-flex mb-2">
                       <MessageCircle className="text-[#25D366]" size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-white">Verify WhatsApp Number</h3>
                    <p className="text-xs text-slate-400 mt-1">
                       To receive real-time alerts, please verify your registered phone number.
                    </p>
                 </div>
                 <div className="space-y-4">
                    <div>
                       <label className="text-xs font-bold text-slate-400 uppercase">Enter OTP (Demo: 1234)</label>
                       <input 
                          type="text" 
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-center tracking-widest font-mono text-lg focus:border-[#25D366] outline-none mt-1"
                          maxLength={4}
                          placeholder="••••"
                       />
                    </div>
                    <button 
                       onClick={handleVerifyOtp}
                       disabled={isVerifying || otp.length !== 4}
                       className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-2 rounded flex items-center justify-center disabled:opacity-50 transition-colors"
                    >
                       {isVerifying ? <Loader2 className="animate-spin" size={16}/> : 'Verify & Enable Alerts'}
                    </button>
                    <button 
                       onClick={() => setShowVerification(false)}
                       className="w-full text-slate-500 text-xs hover:text-slate-300"
                    >
                       Cancel
                    </button>
                 </div>
              </div>
           </div>
        )}

        {/* Success Toast Notification */}
        {broadcastSent && (
          <div className="absolute top-20 right-6 z-[60] bg-[#075E54] border border-[#25D366]/50 text-white px-4 py-3 rounded-lg shadow-2xl flex items-start space-x-3 max-w-sm animate-in slide-in-from-top-2 fade-in duration-300">
            <MessageCircle className="shrink-0 mt-1 text-[#25D366] fill-current" size={20} />
            <div>
              <p className="font-bold text-sm">WhatsApp Broadcast Sent</p>
              <p className="text-xs text-slate-200 mt-1">
                Alert for <strong>{stock.symbol}</strong> (Tgt: {targetPrice}) sent to active numbers.
              </p>
            </div>
            <button onClick={() => setBroadcastSent(false)} className="text-slate-300 hover:text-white">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/50">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-start gap-3">
              {/* Back Button (Mobile Optimized) */}
              <button 
                onClick={onClose} 
                className="md:hidden mt-1 p-1 -ml-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
                title="Back to Heatmap"
              >
                <ArrowLeft size={24} />
              </button>

              <div>
                <div className="flex items-center space-x-3">
                  <h2 className="text-3xl font-bold text-white">{stock.symbol}</h2>
                  <span className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-300">{stock.sector}</span>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${stock.changePercent >= 0 ? 'bg-emerald-900 text-emerald-300' : 'bg-rose-900 text-rose-300'}`}>
                    {stock.changePercent > 0 ? '+' : ''}{stock.changePercent}%
                  </span>
                </div>
                <p className="text-slate-400 text-sm mt-1">{stock.name} • ₹{stock.price.toFixed(2)}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button 
                onClick={toggleAlert}
                disabled={isBroadcasting}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-300 ${
                  alertSet 
                    ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-500/50' 
                    : 'bg-slate-800 text-slate-300 hover:bg-[#25D366]/20 hover:text-[#25D366] hover:border-[#25D366]/50 border border-transparent'
                }`}
              >
                {isBroadcasting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : alertSet ? (
                  <Check size={16} />
                ) : (
                  <MessageCircle size={16} />
                )}
                <span>
                  {isBroadcasting ? 'Broadcasting...' : alertSet ? 'Alert Active' : 'WhatsApp Alert'}
                </span>
              </button>
              <button onClick={onClose} className="hidden md:block p-2 hover:bg-slate-700 rounded-full transition-colors">
                <X size={24} className="text-slate-400" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-6 border-b border-slate-700/50 -mb-4">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'overview' ? 'text-indigo-400 border-indigo-500' : 'text-slate-400 border-transparent hover:text-slate-200'}`}
            >
              Overview & Analysis
            </button>
            <button 
              onClick={() => setActiveTab('backtest')}
              className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'backtest' ? 'text-indigo-400 border-indigo-500' : 'text-slate-400 border-transparent hover:text-slate-200'}`}
            >
              Backtest Results <span className="ml-1 text-xs bg-slate-700 px-1.5 py-0.5 rounded-full text-slate-300">{stock.pastOccurrences.length}</span>
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-900">
          
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Top Section: Chart & Trade Planner */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Chart Area */}
                <div className="lg:col-span-2 space-y-4">
                   <div className="bg-slate-950 rounded-lg border border-slate-800 p-4 h-[400px] flex flex-col">
                      {/* Chart Controls */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-4">
                           <div className="flex items-center space-x-2">
                              <input 
                                type="checkbox" 
                                id="bb-toggle" 
                                checked={showBB} 
                                onChange={(e) => setShowBB(e.target.checked)}
                                className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                              />
                              <label htmlFor="bb-toggle" className="text-xs text-slate-400 cursor-pointer select-none">Bollinger Bands</label>
                           </div>
                           <div className="flex items-center space-x-2">
                              <input 
                                type="checkbox" 
                                id="rsi-toggle" 
                                checked={showRSI} 
                                onChange={(e) => setShowRSI(e.target.checked)}
                                className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                              />
                              <label htmlFor="rsi-toggle" className="text-xs text-slate-400 cursor-pointer select-none">RSI</label>
                           </div>
                        </div>
                        <span className="text-xs text-slate-500">Interval: 1D</span>
                      </div>

                      {/* Main Chart */}
                      <ResponsiveContainer width="100%" height={showRSI ? "70%" : "100%"}>
                        <ComposedChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis dataKey="time" hide />
                          <YAxis domain={['auto', 'auto']} stroke="#94a3b8" />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
                            itemStyle={{ color: '#e2e8f0' }}
                          />
                          
                          {/* Price & MAs */}
                          <Line type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2} dot={false} name="Price" />
                          <Line type="monotone" dataKey="ma20" stroke="#f59e0b" strokeWidth={1} dot={false} strokeDasharray="4 4" name="MA20" />
                          
                          {/* Bollinger Bands */}
                          {showBB && (
                            <>
                              <Area type="monotone" dataKey="bbUpper" stroke="none" fill="#6366f1" fillOpacity={0.1} />
                              <Area type="monotone" dataKey="bbLower" stroke="none" fill="#6366f1" fillOpacity={0.1} />
                              {/* Hacky way to fill between - requires two areas stacked or just visual approximation with lines */}
                              <Line type="monotone" dataKey="bbUpper" stroke="#6366f1" strokeOpacity={0.3} strokeWidth={1} dot={false} />
                              <Line type="monotone" dataKey="bbLower" stroke="#6366f1" strokeOpacity={0.3} strokeWidth={1} dot={false} />
                            </>
                          )}

                          {/* Target / SL Reference Lines */}
                          <ReferenceLine y={targetPrice} stroke="#10b981" strokeDasharray="3 3" label={{ position: 'right', value: 'TGT', fill: '#10b981', fontSize: 10 }} />
                          <ReferenceLine y={stopLoss} stroke="#f43f5e" strokeDasharray="3 3" label={{ position: 'right', value: 'SL', fill: '#f43f5e', fontSize: 10 }} />

                          {/* Pattern Highlight */}
                          <ReferenceArea x1={chartData[chartData.length - 15]?.time} x2={chartData[chartData.length - 1]?.time} strokeOpacity={0.3} fill="#6366f1" fillOpacity={0.05} />
                        </ComposedChart>
                      </ResponsiveContainer>

                      {/* RSI Chart */}
                      {showRSI && (
                         <div className="h-[30%] border-t border-slate-800 pt-2 mt-2">
                           <ResponsiveContainer width="100%" height="100%">
                              <ComposedChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="time" hide />
                                <YAxis domain={[0, 100]} stroke="#94a3b8" ticks={[30, 50, 70]} style={{ fontSize: 10 }} />
                                <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" />
                                <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" />
                                <Line type="monotone" dataKey="rsi" stroke="#c084fc" strokeWidth={2} dot={false} />
                              </ComposedChart>
                           </ResponsiveContainer>
                         </div>
                      )}
                   </div>
                   
                   {/* Trade Planner */}
                   <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                         <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <Crosshair size={16} className="text-indigo-400" />
                            Trade Planner
                         </h3>
                         <div className="text-xs text-slate-400 bg-slate-900 px-2 py-1 rounded">
                            Risk/Reward: <span className={parseFloat(rrRatio) >= 2 ? "text-emerald-400 font-bold" : "text-slate-200"}>1:{rrRatio}</span>
                         </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                         <div>
                            <label className="text-xs text-slate-500 uppercase font-bold block mb-1">Entry</label>
                            <div className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-300 font-mono text-sm">
                               {stock.price.toFixed(2)}
                            </div>
                         </div>
                         <div>
                            <label className="text-xs text-emerald-500 uppercase font-bold block mb-1">Target</label>
                            <div className="relative">
                               <input 
                                  type="number" 
                                  step="0.05"
                                  value={targetPrice}
                                  onChange={(e) => setTargetPrice(parseFloat(e.target.value))}
                                  className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded px-3 py-2 text-emerald-300 font-mono text-sm outline-none transition-colors"
                               />
                               <span className="absolute right-2 top-2 text-[10px] text-emerald-600/50">INR</span>
                            </div>
                         </div>
                         <div>
                            <label className="text-xs text-rose-500 uppercase font-bold block mb-1">Stop Loss</label>
                            <div className="relative">
                               <input 
                                  type="number" 
                                  step="0.05"
                                  value={stopLoss}
                                  onChange={(e) => setStopLoss(parseFloat(e.target.value))}
                                  className="w-full bg-slate-900 border border-slate-700 focus:border-rose-500 rounded px-3 py-2 text-rose-300 font-mono text-sm outline-none transition-colors"
                               />
                               <span className="absolute right-2 top-2 text-[10px] text-rose-600/50">INR</span>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Stats & Details Column */}
                <div className="space-y-4">
                  <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                    <div className="flex items-center space-x-2 text-indigo-400 mb-2">
                      <Activity size={18} />
                      <span className="font-semibold text-sm uppercase">Pattern Signal</span>
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">{stock.pattern}</div>
                    <div className="flex items-center space-x-2 text-sm text-slate-400">
                      <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500" style={{ width: `${stock.confidenceScore}%` }}></div>
                      </div>
                      <span>{stock.confidenceScore}% Conf.</span>
                    </div>
                  </div>

                  <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                    <div className="flex items-center space-x-2 text-emerald-400 mb-2">
                      <Target size={18} />
                      <span className="font-semibold text-sm uppercase">Exp. Move</span>
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">{stock.expectedMove}%</div>
                    <p className="text-xs text-slate-400">Projected target based on historical volatility expansion.</p>
                  </div>

                  <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                    <div className="flex items-center space-x-2 text-amber-400 mb-2">
                      <History size={18} />
                      <span className="font-semibold text-sm uppercase">Hist. Accuracy</span>
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">{stock.historicalAccuracy}%</div>
                    <p className="text-xs text-slate-400">Win rate of this pattern on this ticker (Last 5y).</p>
                  </div>
                </div>
              </div>

              {/* AI Analysis Section */}
              <div className="border-t border-slate-800 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2 text-white">
                    <BrainCircuit className="text-purple-400" />
                    <h3 className="text-xl font-bold">Quant Analyst Insights</h3>
                  </div>
                  {!aiAnalysis && !loadingAi && (
                    <button 
                      onClick={handleRunAnalysis}
                      className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-2"
                    >
                      <BrainCircuit size={16} />
                      <span>Generate Report</span>
                    </button>
                  )}
                </div>

                {loadingAi && (
                  <div className="flex items-center justify-center p-12 bg-slate-900/50 border border-dashed border-slate-700 rounded-lg">
                    <div className="text-center">
                      <Loader2 className="animate-spin text-purple-500 mx-auto mb-2" size={32} />
                      <p className="text-slate-400 animate-pulse">Running quantitative models & analyzing market structure...</p>
                    </div>
                  </div>
                )}

                {errorAi && (
                  <div className="p-4 bg-rose-900/20 border border-rose-800 rounded-lg text-rose-300 flex items-center space-x-2">
                    <AlertTriangle size={20} />
                    <span>{errorAi}</span>
                  </div>
                )}

                {aiAnalysis && (
                  <div className="bg-slate-800/30 rounded-xl border border-purple-500/20 p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between mb-4">
                        <span className={`px-3 py-1 rounded border text-sm font-bold uppercase ${getVerdictColor(aiAnalysis.verdict)}`}>
                          Verdict: {aiAnalysis.verdict}
                        </span>
                        <span className="text-xs text-slate-500">Generated via Gemini 2.5 Flash</span>
                    </div>
                    
                    <p className="text-slate-300 leading-relaxed mb-6">{aiAnalysis.summary}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Key Levels</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between p-2 bg-slate-900/50 rounded border border-slate-700/50">
                              <span className="text-slate-400">Support</span>
                              <span className="text-white font-mono">{aiAnalysis.keyLevels.support}</span>
                            </div>
                            <div className="flex justify-between p-2 bg-slate-900/50 rounded border border-slate-700/50">
                              <span className="text-slate-400">Resistance</span>
                              <span className="text-white font-mono">{aiAnalysis.keyLevels.resistance}</span>
                            </div>
                            <div className="flex justify-between p-2 bg-rose-900/10 rounded border border-rose-900/30">
                              <span className="text-rose-400">Invalidation (SL)</span>
                              <span className="text-rose-200 font-mono">{aiAnalysis.keyLevels.invalidation}</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Risk Assessment</h4>
                          <div className="p-3 bg-slate-900/50 rounded border border-slate-700/50 text-sm text-slate-300 italic">
                            "{aiAnalysis.riskAssessment}"
                          </div>
                        </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'backtest' && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
               <div className="flex items-center justify-between">
                 <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                    <History size={20} className="text-indigo-400"/>
                    <span>Historical Pattern Occurrences</span>
                 </h3>
                 <span className="text-sm text-slate-400">
                   Backtested over last 24 months
                 </span>
               </div>
               
               {stock.pastOccurrences.length === 0 ? (
                 <div className="p-8 text-center bg-slate-800/50 rounded-lg border border-slate-700 text-slate-400">
                   No sufficient historical data found for {stock.pattern} on this timeframe.
                 </div>
               ) : (
                 <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
                   <table className="w-full text-left text-sm text-slate-400">
                     <thead className="bg-slate-900 uppercase font-bold text-xs">
                       <tr>
                         <th className="px-6 py-3">Date</th>
                         <th className="px-6 py-3">Pattern</th>
                         <th className="px-6 py-3">Hold Period</th>
                         <th className="px-6 py-3 text-right">Outcome</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-800">
                       {stock.pastOccurrences.map((occ) => (
                         <tr key={occ.id} className="hover:bg-slate-800/50 transition-colors">
                           <td className="px-6 py-4 flex items-center space-x-2">
                             <Calendar size={14} />
                             <span>{occ.date}</span>
                           </td>
                           <td className="px-6 py-4">{occ.pattern}</td>
                           <td className="px-6 py-4">{occ.durationDays} days</td>
                           <td className="px-6 py-4 text-right">
                             <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold ${occ.outcomePercent > 0 ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-900' : 'bg-rose-900/50 text-rose-400 border border-rose-900'}`}>
                                {occ.outcomePercent > 0 ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
                                <span>{occ.outcomePercent > 0 ? '+' : ''}{occ.outcomePercent}%</span>
                             </span>
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               )}
               
               <div className="bg-indigo-900/20 border border-indigo-900/50 p-4 rounded-lg flex items-start space-x-3">
                  <Activity className="text-indigo-400 mt-1" size={20} />
                  <div>
                    <h4 className="text-sm font-bold text-indigo-300">Backtest Methodology</h4>
                    <p className="text-xs text-indigo-200/70 mt-1">
                      Historical accuracy is calculated based on the percentage of occurrences where the price met the expected move target within the standard timeframe (14 days) without hitting invalidation levels.
                    </p>
                  </div>
               </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default StockDetailModal;
