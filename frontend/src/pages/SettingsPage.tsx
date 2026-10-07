import React from 'react';
import { 
  Settings as SettingsIcon, 
  Wifi, 
  Volume2, 
  VolumeX, 
  Layers, 
  ShieldCheck, 
  Database, 
  Cpu, 
  Sparkles, 
  RefreshCw 
} from 'lucide-react';
import { useMarket } from '../context/MarketContext';
import { Badge } from '../components/common/Badge';

export const SettingsPage: React.FC = () => {
  const { 
    connectionStatus, 
    isSoundEnabled, 
    setIsSoundEnabled, 
    density, 
    setDensity, 
    refreshMarkets 
  } = useMarket();

  const isLive = connectionStatus.status === 'LIVE';

  const roadmapPhases = [
    { phase: 'Phase 1 (CURRENT)', title: 'Institutional Real-Time Terminal & Multi-Asset Feed', status: 'COMPLETED / ACTIVE' },
    { phase: 'Phase 2', title: 'Expanded Technical Indicators (VWAP, ATR, Ichimoku)', status: 'UPCOMING' },
    { phase: 'Phase 3', title: 'PostgreSQL Historical Market Database & Aggregates', status: 'UPCOMING' },
    { phase: 'Phase 4', title: 'Deterministic Quantitative Backtesting Engine', status: 'UPCOMING' },
    { phase: 'Phase 5', title: 'Simulated Paper Trading Engine with Order Fills', status: 'UPCOMING' },
    { phase: 'Phase 6', title: 'Machine Learning Price Predictor & Volatility Forecaster', status: 'FUTURE' },
    { phase: 'Phase 7', title: 'AI Autonomous Strategy & Multi-Factor Agent', status: 'FUTURE' },
    { phase: 'Phase 8', title: 'Deterministic Risk Manager & Capital Safeguard Engine', status: 'FUTURE' },
    { phase: 'Phase 9', title: 'Exchange Testnet Integration (Binance Testnet)', status: 'FUTURE' },
    { phase: 'Phase 10', title: 'Institutional Real Exchange Execution Gateway', status: 'FUTURE' },
  ];

  return (
    <div className="p-3 md:p-6 space-y-6 max-w-[1720px] mx-auto select-none">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-trade-primary" />
          <h1 className="text-xl md:text-2xl font-display font-extrabold text-white tracking-tight">
            Terminal Settings & Gateway Configuration
          </h1>
        </div>
        <p className="text-xs md:text-sm text-trade-muted mt-1">
          Real-time connection telemetry, audio notifications, display density, and platform architecture.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Preferences & Telemetry (6 Cols) */}
        <div className="lg:col-span-6 space-y-4">
          {/* Gateway Status Box */}
          <div className="bg-trade-surface border border-trade-border rounded-2xl p-5 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-trade-border">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-trade-primary" />
                <h3 className="text-xs font-bold text-trade-text uppercase tracking-wider">Market Data Gateway</h3>
              </div>
              <Badge variant={isLive ? 'live' : 'warning'} size="xs" pulse={isLive}>
                {connectionStatus.status}
              </Badge>
            </div>

            <div className="space-y-2 text-xs font-num">
              <div className="flex justify-between p-2 rounded-xl bg-trade-surface2/60 border border-trade-border/40">
                <span className="text-trade-subtle font-sans">Primary Feed:</span>
                <span className="font-semibold text-trade-text">{connectionStatus.provider}</span>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-trade-surface2/60 border border-trade-border/40">
                <span className="text-trade-subtle font-sans">Stream Endpoint:</span>
                <span className="font-mono text-trade-primary text-[11px]">{connectionStatus.endpoint}</span>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-trade-surface2/60 border border-trade-border/40">
                <span className="text-trade-subtle font-sans">Gateway Latency:</span>
                <span className="font-bold text-emerald-400">{connectionStatus.latencyMs} ms</span>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-trade-surface2/60 border border-trade-border/40">
                <span className="text-trade-subtle font-sans">Active WebSockets:</span>
                <span className="font-semibold text-trade-text">{connectionStatus.activeStreams} Streams</span>
              </div>
            </div>

            <button
              onClick={() => refreshMarkets()}
              className="w-full py-2.5 rounded-xl bg-trade-surface3 hover:bg-trade-surface2 border border-trade-border text-trade-text text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-trade-primary" />
              <span>Resync All Market Data Feeds</span>
            </button>
          </div>

          {/* User Interface & Audio Preferences */}
          <div className="bg-trade-surface border border-trade-border rounded-2xl p-5 shadow-card space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-trade-border">
              <Layers className="w-4 h-4 text-trade-primary" />
              <h3 className="text-xs font-bold text-trade-text uppercase tracking-wider">Audio & Display</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-trade-surface2/60 border border-trade-border/40">
                <div>
                  <div className="font-semibold text-trade-text">Real-Time Tick Sound Chimes</div>
                  <div className="text-[11px] text-trade-subtle">Play subtle harmonic audio cues on price increments</div>
                </div>
                <button
                  onClick={() => setIsSoundEnabled(prev => !prev)}
                  className={`p-2 rounded-xl border transition-all ${
                    isSoundEnabled ? 'bg-trade-primary text-white border-trade-primary' : 'bg-trade-surface3 border-trade-border text-trade-muted'
                  }`}
                >
                  {isSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-trade-surface2/60 border border-trade-border/40">
                <div>
                  <div className="font-semibold text-trade-text">Terminal Information Density</div>
                  <div className="text-[11px] text-trade-subtle">Adjust padding and row heights across tables</div>
                </div>
                <div className="flex items-center bg-trade-surface3 rounded-lg p-0.5 border border-trade-border text-xs">
                  <button
                    onClick={() => setDensity('comfortable')}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium ${
                      density === 'comfortable' ? 'bg-trade-surface text-trade-primary shadow' : 'text-trade-muted'
                    }`}
                  >
                    Comfortable
                  </button>
                  <button
                    onClick={() => setDensity('compact')}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium ${
                      density === 'compact' ? 'bg-trade-surface text-trade-primary shadow' : 'text-trade-muted'
                    }`}
                  >
                    Compact
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Architectural Roadmap & Security Guarantee (6 Cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-trade-surface border border-trade-border rounded-2xl p-5 shadow-card">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-trade-border">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-trade-primary" />
                <h3 className="text-xs font-bold text-trade-text uppercase tracking-wider">Future Platform Roadmap</h3>
              </div>
              <span className="text-[10px] font-mono text-trade-subtle">PHASED EXECUTION</span>
            </div>

            <div className="space-y-2 text-xs">
              {roadmapPhases.map((r, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-trade-surface2/60 border border-trade-border/40">
                  <div>
                    <span className="text-[10px] font-bold text-trade-primary uppercase tracking-wider mr-2">{r.phase}</span>
                    <span className="font-medium text-trade-text">{r.title}</span>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                    r.status.includes('COMPLETED') ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30' :
                    r.status.includes('UPCOMING') ? 'bg-blue-950/60 text-blue-400 border-blue-500/30' :
                    'bg-trade-surface3 text-trade-subtle border-trade-border'
                  }`}>
                    {r.status}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-trade-border/60 text-[11px] text-trade-subtle space-y-1">
              <div className="flex items-center gap-1.5 text-trade-text font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Zero-Trust API Security Policy</span>
              </div>
              <p>
                No exchange API secrets or withdrawal keys are stored or exposed in this terminal. All market data operations use public WebSocket feeds.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
