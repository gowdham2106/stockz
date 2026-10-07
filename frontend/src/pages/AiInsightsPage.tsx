import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Sparkles, 
  ShieldAlert, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Target, 
  ShieldCheck, 
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import { useMarket } from '../context/MarketContext';
import { AiInsight } from '../types/market';
import { api } from '../services/api';
import { Badge } from '../components/common/Badge';
import { formatPrice } from '../utils/formatters';

export const AiInsightsPage: React.FC = () => {
  const { assets, openTerminalFor } = useMarket();
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTC/USDT');
  const [insight, setInsight] = useState<AiInsight | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const featuredSymbols = ['BTC/USDT', 'ETH/USDT', 'NVDA', 'AAPL', 'RELIANCE', 'Gold', 'SPY'];

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    api.getAiInsight(selectedSymbol)
      .then(data => {
        if (isMounted) {
          setInsight(data);
          setIsLoading(false);
        }
      })
      .catch(err => {
        console.warn('Failed to fetch AI insight:', err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedSymbol]);

  return (
    <div className="p-3 md:p-6 space-y-6 max-w-[1720px] mx-auto select-none">
      {/* Simulation Watermark Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-blue-950/50 via-trade-surface2 to-purple-950/50 border border-blue-500/30 text-blue-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-trade-primary/20 border border-trade-primary/40 flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5 text-trade-primary animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base md:text-lg font-bold text-white tracking-tight">
                AI Quantitative Market Intelligence
              </h1>
              <Badge variant="demo" size="xs">
                DEMO PREVIEW ONLY
              </Badge>
            </div>
            <p className="text-xs text-blue-300/80 mt-0.5">
              Deterministic Multi-Factor Scoring & Regime Detection preview. Not financial advice.
            </p>
          </div>
        </div>
      </div>

      {/* Asset Selector Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
        {featuredSymbols.map(sym => (
          <button
            key={sym}
            onClick={() => setSelectedSymbol(sym)}
            className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
              selectedSymbol === sym
                ? 'bg-trade-primary text-white shadow-glow-primary'
                : 'bg-trade-surface border border-trade-border text-trade-muted hover:text-trade-text hover:bg-trade-surface2'
            }`}
          >
            {sym}
          </button>
        ))}
      </div>

      {isLoading || !insight ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="text-center text-trade-muted">
            <RefreshCw className="w-8 h-8 mx-auto text-trade-primary animate-spin mb-2" />
            <p className="font-semibold text-sm">Synthesizing AI Confluence Vectors...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: AI Verdict & Key Confluence Levels (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Main AI Verdict Card */}
            <div className="bg-trade-surface border border-trade-border rounded-2xl p-5 shadow-card space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-trade-border">
                <div>
                  <h2 className="text-xl font-black text-trade-text font-num">{insight.symbol}</h2>
                  <p className="text-xs text-trade-subtle">{insight.name}</p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-trade-subtle uppercase">Confidence Score</div>
                  <div className="text-xl font-black text-trade-primary font-num">{insight.aiConfidence}%</div>
                </div>
              </div>

              {/* Signal Badge */}
              <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/30 text-center">
                <div className="text-[10px] text-emerald-400 font-bold tracking-widest uppercase">Signal Status</div>
                <div className="text-base font-extrabold text-emerald-300 mt-0.5">{insight.signal}</div>
              </div>

              {/* Metric Grid */}
              <div className="grid grid-cols-2 gap-2.5 text-xs font-num">
                <div className="p-2.5 rounded-xl bg-trade-surface2/70 border border-trade-border/60">
                  <span className="text-[10px] text-trade-subtle uppercase block">Trend Bias</span>
                  <span className="font-bold text-trade-positive">{insight.trend}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-trade-surface2/70 border border-trade-border/60">
                  <span className="text-[10px] text-trade-subtle uppercase block">Momentum</span>
                  <span className="font-bold text-trade-primary">{insight.momentum}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-trade-surface2/70 border border-trade-border/60">
                  <span className="text-[10px] text-trade-subtle uppercase block">Volatility</span>
                  <span className="font-bold text-amber-400">{insight.volatility}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-trade-surface2/70 border border-trade-border/60">
                  <span className="text-[10px] text-trade-subtle uppercase block">Market Regime</span>
                  <span className="font-bold text-trade-text">{insight.marketRegime}</span>
                </div>
              </div>

              {/* Support / Resistance Levels */}
              <div className="p-3 rounded-xl bg-trade-surface2/40 border border-trade-border/60 space-y-2 text-xs font-num">
                <div className="text-[11px] font-bold text-trade-subtle uppercase tracking-wider font-sans">
                  Key Algorithmic Pivots
                </div>
                <div className="flex justify-between">
                  <span className="text-trade-subtle">Target Price (Simulated):</span>
                  <strong className="text-trade-positive">${formatPrice(insight.targetPrice)}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-trade-subtle">Resistance Boundary:</span>
                  <strong className="text-trade-text">${formatPrice(insight.resistanceLevel)}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-trade-subtle">Support Floor:</span>
                  <strong className="text-trade-text">${formatPrice(insight.supportLevel)}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-trade-subtle">Stop Loss Benchmark:</span>
                  <strong className="text-trade-negative">${formatPrice(insight.stopLossLevel)}</strong>
                </div>
              </div>

              <button
                onClick={() => openTerminalFor(insight.symbol)}
                className="w-full py-2.5 rounded-xl bg-trade-primary hover:bg-trade-primaryHover text-white font-bold text-xs flex items-center justify-center gap-2 shadow-glow-primary transition-all"
              >
                <span>Open in Live Terminal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right: Technical Factors Checklist & Reasoning (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Reasoning Card */}
            <div className="bg-trade-surface border border-trade-border rounded-2xl p-5 shadow-card">
              <div className="flex items-center gap-2 pb-3 mb-3 border-b border-trade-border">
                <Sparkles className="w-4 h-4 text-trade-primary" />
                <h3 className="text-xs font-bold text-trade-text uppercase tracking-wider">
                  Algorithmic Confluence Analysis
                </h3>
              </div>

              <div className="space-y-2.5 mb-4">
                {insight.reasoning.map((reason, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-trade-text">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{reason}</span>
                  </div>
                ))}
              </div>

              {/* Technical Indicator Scoring Matrix */}
              <div className="border-t border-trade-border pt-4">
                <div className="text-[11px] font-bold text-trade-subtle uppercase tracking-wider mb-2.5">
                  Technical Factor Scoring
                </div>
                <div className="space-y-2 font-num text-xs">
                  {insight.factors.map((f, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-trade-surface2/60 border border-trade-border/40">
                      <span className="font-semibold text-trade-text font-sans">{f.name}</span>
                      <span className="text-trade-muted">{f.value}</span>
                      <Badge variant={f.sentiment === 'BULLISH' ? 'positive' : (f.sentiment === 'BEARISH' ? 'negative' : 'neutral')} size="xs">
                        {f.sentiment}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Roadmap Disclaimer */}
            <div className="p-4 rounded-2xl bg-trade-surface2/40 border border-trade-border text-xs text-trade-subtle space-y-1 leading-relaxed">
              <div className="font-semibold text-trade-text font-sans">
                🔒 Institutional Pipeline Architecture Note:
              </div>
              <p>
                In future platform phases, this module connects to fine-tuned machine learning models and deterministic risk managers. Automated trade execution remains strictly decoupled.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
