import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Zap, 
  Compass, 
  Flame, 
  ArrowUpRight, 
  Bookmark, 
  Newspaper, 
  Layers, 
  ShieldCheck, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useMarket } from '../context/MarketContext';
import { Sparkline } from '../components/common/Sparkline';
import { Badge } from '../components/common/Badge';
import { formatPrice, formatPercent, formatVolume, formatCurrencySymbol } from '../utils/formatters';

export const DashboardPage: React.FC = () => {
  const { 
    marketPulse, 
    assets, 
    openTerminalFor, 
    toggleWatchlist, 
    isWatchlisted,
    setActivePage,
    flashMap
  } = useMarket();

  const [activeTab, setActiveTab] = useState<'gainers' | 'losers' | 'volume'>('gainers');

  const topGainers = [...assets].sort((a, b) => b.changePercent - a.changePercent).slice(0, 5);
  const topLosers = [...assets].sort((a, b) => a.changePercent - b.changePercent).slice(0, 5);
  const topVolume = [...assets].sort((a, b) => (b.volume || 0) - (a.volume || 0)).slice(0, 5);

  const displayedList = activeTab === 'gainers' ? topGainers : (activeTab === 'losers' ? topLosers : topVolume);

  const newsItems = [
    {
      id: 'news-1',
      tag: 'MACRO',
      title: 'US Federal Reserve Signals Balanced Rate Trajectory; Global Equity Indices Consolidate',
      time: '18m ago',
      source: 'Global Macro Feed',
    },
    {
      id: 'news-2',
      tag: 'CRYPTO',
      title: 'Institutional Bitcoin ETF Inflows Surpass $850M in Multi-Day Acceleration Phase',
      time: '42m ago',
      source: 'Institutional Flow Tracker',
    },
    {
      id: 'news-3',
      tag: 'INDIA',
      title: 'NSE Nifty 50 Holds Critical 25,000 Support Supported by Banking & IT Heavyweights',
      time: '1h ago',
      source: 'Dalal Street Telemetry',
    },
    {
      id: 'news-4',
      tag: 'COMMODITIES',
      title: 'Spot Gold Tests New Highs as Central Bank Accumulation and Safe-Haven Demand Deepens',
      time: '2h ago',
      source: 'Bullion Desk',
    },
  ];

  return (
    <div className="p-3 md:p-6 space-y-6 max-w-[1720px] mx-auto">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-trade-surface2 via-trade-surface to-trade-surface2 p-4 md:p-5 rounded-2xl border border-trade-border shadow-card">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-display font-extrabold text-white tracking-tight">
              Institutional Market Pulse
            </h1>
            <Badge variant="live" pulse size="sm">
              REAL-TIME GATEWAY
            </Badge>
          </div>
          <p className="text-xs md:text-sm text-trade-muted mt-1">
            Unified multi-asset intelligence across Crypto, US Equities, Indian NSE/BSE, Indices, FX, and Commodities.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => openTerminalFor('BTC/USDT')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-trade-primary hover:bg-trade-primaryHover text-white font-semibold text-xs shadow-glow-primary transition-all cursor-pointer"
          >
            <Zap className="w-4 h-4" />
            <span>Launch Pro Terminal</span>
          </button>
          <button
            onClick={() => setActivePage('scanner')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-trade-surface3 hover:bg-trade-surface2 text-trade-text font-medium text-xs border border-trade-border transition-all"
          >
            <Compass className="w-4 h-4 text-trade-primary" />
            <span>Market Scanner</span>
          </button>
        </div>
      </div>

      {/* SECTION 8: Market Pulse Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-trade-primary" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-trade-text">
              Market Pulse & Macro Gateways
            </h2>
          </div>
          <div className="text-[11px] font-num text-trade-subtle">
            Fear & Greed: <strong className="text-emerald-400">68 (Greed)</strong> • 24h Vol: <strong className="text-trade-text">$142.8B</strong>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {marketPulse?.pulseCards.map(card => {
            const isPos = card.changePercent >= 0;

            return (
              <div
                key={card.id}
                onClick={() => {
                  const targetAsset = assets.find(a => a.symbol === card.primarySymbol || a.name.includes(card.primarySymbol));
                  if (targetAsset) openTerminalFor(targetAsset.symbol);
                }}
                className="bg-trade-surface border border-trade-border hover:border-trade-primary/50 p-3.5 rounded-2xl shadow-card glass-panel-hover cursor-pointer transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-trade-muted truncate uppercase tracking-tight">
                    {card.title}
                  </span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                    card.status.includes('LIVE') ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30' : 'bg-trade-surface3 text-trade-subtle border-trade-border'
                  }`}>
                    {card.status}
                  </span>
                </div>

                <div className="my-1">
                  <div className="font-num text-lg font-bold text-trade-text tracking-tight">
                    {card.currentValue}
                  </div>
                  <div className={`font-num text-xs font-semibold flex items-center gap-1 mt-0.5 ${
                    isPos ? 'text-trade-positive' : 'text-trade-negative'
                  }`}>
                    {isPos ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    {formatPercent(card.changePercent)}
                    <span className="text-[10px] text-trade-subtle font-sans ml-1">({card.primarySymbol})</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-trade-border/40 mt-2 flex items-center justify-between">
                  <span className="text-[10px] text-trade-subtle">Sentiment: <strong className={isPos ? 'text-trade-positive' : 'text-trade-negative'}>{card.sentiment}</strong></span>
                  <Sparkline data={card.sparkline} isPositive={isPos} width={80} height={24} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Movers Table + Quick Watchlist + Market Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Top Movers & Asset Overview (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-trade-surface border border-trade-border rounded-2xl overflow-hidden shadow-card">
            {/* Header & Tabs */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-trade-border bg-trade-surface2/60">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-trade-primary" />
                <h3 className="text-xs font-bold text-trade-text uppercase tracking-wider">Top Market Movers</h3>
              </div>

              <div className="flex items-center bg-trade-surface3 rounded-xl p-0.5 border border-trade-border text-xs">
                <button
                  onClick={() => setActiveTab('gainers')}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    activeTab === 'gainers' ? 'bg-trade-primary text-white shadow-glow-primary' : 'text-trade-muted hover:text-trade-text'
                  }`}
                >
                  Top Gainers
                </button>
                <button
                  onClick={() => setActiveTab('losers')}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    activeTab === 'losers' ? 'bg-trade-primary text-white shadow-glow-primary' : 'text-trade-muted hover:text-trade-text'
                  }`}
                >
                  Top Losers
                </button>
                <button
                  onClick={() => setActiveTab('volume')}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    activeTab === 'volume' ? 'bg-trade-primary text-white shadow-glow-primary' : 'text-trade-muted hover:text-trade-text'
                  }`}
                >
                  High Volume
                </button>
              </div>
            </div>

            {/* Movers Table */}
            <div className="divide-y divide-trade-border/40 font-num">
              {displayedList.map(asset => {
                const isPos = asset.changePercent >= 0;
                const flash = flashMap[asset.symbol];
                const currSymbol = formatCurrencySymbol(asset.assetType, asset.exchange);

                return (
                  <div
                    key={asset.symbol}
                    onClick={() => openTerminalFor(asset.symbol)}
                    className={`flex items-center justify-between px-4 py-3 hover:bg-trade-surface2/80 cursor-pointer transition-all group ${
                      flash === 'up' ? 'flash-up' : flash === 'down' ? 'flash-down' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWatchlist(asset.symbol);
                        }}
                        className="p-1 text-trade-subtle hover:text-amber-400 transition-colors"
                        title="Add to Watchlist"
                      >
                        <Bookmark className={`w-4 h-4 ${isWatchlisted(asset.symbol) ? 'fill-amber-400 text-amber-400' : ''}`} />
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-trade-text group-hover:text-trade-primary transition-colors">
                            {asset.symbol}
                          </span>
                          <span className="text-xs text-trade-subtle truncate max-w-[130px] sm:max-w-[200px] font-sans">
                            {asset.name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-trade-surface3 border border-trade-border text-trade-subtle uppercase">
                            {asset.exchange}
                          </span>
                        </div>
                        <div className="text-[11px] text-trade-subtle font-sans mt-0.5 flex items-center gap-2">
                          <span className="capitalize">{asset.assetTypeString || asset.assetType}</span>
                          <span>• Vol: {formatVolume(asset.volume || 10000)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-right shrink-0">
                      <div className="hidden sm:block">
                        <Sparkline data={asset.sparkline} isPositive={isPos} width={80} height={24} />
                      </div>
                      <div className="min-w-[80px]">
                        <div className="text-sm font-bold text-trade-text">
                          {currSymbol}{formatPrice(asset.price, asset.assetType)}
                        </div>
                        <div className={`text-xs font-semibold flex items-center justify-end gap-0.5 ${
                          isPos ? 'text-trade-positive' : 'text-trade-negative'
                        }`}>
                          {isPos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {formatPercent(asset.changePercent)}
                        </div>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-trade-muted group-hover:text-trade-primary group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3 bg-trade-surface2/40 border-t border-trade-border/60 text-center">
              <button
                onClick={() => setActivePage('markets')}
                className="text-xs font-semibold text-trade-primary hover:underline flex items-center justify-center gap-1 mx-auto"
              >
                <span>Explore All Multi-Asset Markets</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right: AI Lab Preview + Institutional News (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* AI Intelligence Card */}
          <div className="bg-gradient-to-br from-trade-surface2 via-trade-surface to-trade-surface3 border border-trade-border rounded-2xl p-4 shadow-card">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-trade-border">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-trade-primary" />
                <h3 className="text-xs font-bold text-trade-text uppercase tracking-wider">AI Intelligence Lab</h3>
              </div>
              <Badge variant="demo" size="xs">
                ARCHITECTURE DEMO
              </Badge>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-trade-surface/80 border border-trade-border/80">
                <div>
                  <div className="text-[11px] text-trade-subtle uppercase">Top Confluence Asset</div>
                  <div className="font-bold text-sm text-trade-text mt-0.5">BTC/USDT</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-emerald-400">BUY BIAS (84% CONF.)</div>
                  <div className="text-[10px] text-trade-subtle">Regime: Trend Following</div>
                </div>
              </div>

              <div className="text-xs text-trade-muted leading-relaxed">
                Multi-timeframe algorithm indicates price stability above EMA 20 support, order book bid absorption, and volatility compression across crypto assets.
              </div>

              <button
                onClick={() => setActivePage('ai-insights')}
                className="w-full py-2 rounded-xl bg-trade-surface3 hover:bg-trade-surface2 border border-trade-border text-trade-text font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <span>View Full AI Confluence Matrix</span>
                <ArrowRight className="w-3.5 h-3.5 text-trade-primary" />
              </button>
            </div>
          </div>

          {/* Institutional News Stream */}
          <div className="bg-trade-surface border border-trade-border rounded-2xl overflow-hidden shadow-card">
            <div className="flex items-center justify-between px-4 py-3 border-b border-trade-border bg-trade-surface2/60">
              <div className="flex items-center gap-2">
                <Newspaper className="w-4 h-4 text-trade-primary" />
                <h3 className="text-xs font-bold text-trade-text uppercase tracking-wider">Market Intelligence News</h3>
              </div>
              <span className="text-[10px] font-mono text-trade-subtle">LIVE SAMPLE DESK</span>
            </div>

            <div className="divide-y divide-trade-border/30 p-1">
              {newsItems.map(item => (
                <div key={item.id} className="p-3 hover:bg-trade-surface2/60 rounded-xl transition-all">
                  <div className="flex items-center justify-between text-[10px] text-trade-subtle mb-1">
                    <span className="px-1.5 py-0.2 rounded bg-trade-surface3 border border-trade-border font-semibold text-trade-primary">
                      {item.tag}
                    </span>
                    <span>{item.time} • {item.source}</span>
                  </div>
                  <p className="text-xs font-medium text-trade-text hover:text-trade-primary cursor-pointer line-clamp-2 transition-colors">
                    {item.title}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
