import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Bookmark, 
  Share2, 
  Bell, 
  Sparkles, 
  Layers, 
  History, 
  Sliders, 
  Info,
  Radio,
  Zap
} from 'lucide-react';
import { useMarket } from '../context/MarketContext';
import { FinancialChart } from '../components/charts/FinancialChart';
import { OrderBookPanel } from '../components/orderbook/OrderBookPanel';
import { RecentTradesPanel } from '../components/trades/RecentTradesPanel';
import { OrderTicketSimulation } from '../components/market/OrderTicketSimulation';
import { AssetStatsPanel } from '../components/market/AssetStatsPanel';
import { Badge } from '../components/common/Badge';
import { formatPrice, formatPercent, formatVolume, formatCurrencySymbol } from '../utils/formatters';

export const AssetDetailPage: React.FC = () => {
  const { 
    activeAsset, 
    toggleWatchlist, 
    isWatchlisted, 
    flashMap,
    setActivePage,
    addAlert
  } = useMarket();

  const [rightPanelTab, setRightPanelTab] = useState<'orderbook' | 'trades' | 'orderTicket'>('orderbook');

  if (!activeAsset) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center text-trade-muted">
          <Zap className="w-8 h-8 mx-auto text-trade-primary animate-pulse mb-2" />
          <p className="font-semibold text-sm">Loading Real-Time Asset Stream...</p>
        </div>
      </div>
    );
  }

  const isPos = activeAsset.changePercent >= 0;
  const flash = flashMap[activeAsset.symbol];
  const currSymbol = formatCurrencySymbol(activeAsset.assetType, activeAsset.exchange);

  return (
    <div className="p-2.5 md:p-5 space-y-4 max-w-[1920px] mx-auto">
      {/* Terminal Top Asset Bar */}
      <div className={`flex flex-wrap items-center justify-between gap-3 p-3.5 bg-trade-surface border border-trade-border rounded-2xl shadow-card transition-all ${
        flash === 'up' ? 'flash-up' : flash === 'down' ? 'flash-down' : ''
      }`}>
        {/* Symbol & Name Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-trade-surface3 to-trade-surface2 border border-trade-borderLight flex items-center justify-center font-bold text-sm text-trade-primary font-num shrink-0 shadow-inner">
            {activeAsset.symbol.slice(0, 3)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg md:text-xl font-extrabold text-trade-text tracking-tight font-num">
                {activeAsset.symbol}
              </h1>
              <span className="text-xs text-trade-muted font-sans truncate">
                {activeAsset.name}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-trade-surface3 border border-trade-border text-trade-subtle uppercase">
                {activeAsset.exchange}
              </span>
              <Badge variant={activeAsset.tradingStatus === 'LIVE' ? 'live' : 'demo'} size="xs" pulse={activeAsset.tradingStatus === 'LIVE'}>
                {activeAsset.tradingStatus === 'LIVE' ? 'LIVE EXCHANGE FEED' : 'SIMULATION MODE'}
              </Badge>
            </div>
            <div className="text-[11px] text-trade-subtle mt-0.5 flex items-center gap-2">
              <span className="capitalize">{activeAsset.assetTypeString || activeAsset.assetType}</span>
              {activeAsset.sector && <span>• {activeAsset.sector}</span>}
              <span className="hidden sm:inline text-emerald-400">• Stream: {activeAsset.dataSource}</span>
            </div>
          </div>
        </div>

        {/* Real-time Large Price & Change */}
        <div className="flex items-center gap-4 md:gap-8 shrink-0 font-num">
          <div>
            <div className="text-xl md:text-2xl font-black text-trade-text tracking-tight">
              {currSymbol}{formatPrice(activeAsset.price, activeAsset.assetType)}
            </div>
            <div className={`text-xs md:text-sm font-bold flex items-center gap-1 ${
              isPos ? 'text-trade-positive' : 'text-trade-negative'
            }`}>
              {isPos ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{formatPercent(activeAsset.changePercent)}</span>
              <span className="text-xs font-normal text-trade-subtle">
                ({currSymbol}{formatPrice(activeAsset.change, activeAsset.assetType)})
              </span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => toggleWatchlist(activeAsset.symbol)}
              className={`p-2 rounded-xl border transition-all ${
                isWatchlisted(activeAsset.symbol)
                  ? 'bg-amber-950/50 border-amber-500/40 text-amber-400'
                  : 'bg-trade-surface2 border-trade-border text-trade-muted hover:text-trade-text'
              }`}
              title="Toggle Watchlist"
            >
              <Bookmark className={`w-4 h-4 ${isWatchlisted(activeAsset.symbol) ? 'fill-amber-400' : ''}`} />
            </button>

            <button
              onClick={() => {
                addAlert({
                  symbol: activeAsset.symbol,
                  condition: 'GREATER_THAN',
                  targetValue: Math.round(activeAsset.price * 1.05),
                  currentValue: activeAsset.price,
                  note: `Alert above ${Math.round(activeAsset.price * 1.05)}`
                });
                setActivePage('alerts');
              }}
              className="p-2 rounded-xl bg-trade-surface2 border border-trade-border text-trade-muted hover:text-trade-text transition-colors"
              title="Create Alert"
            >
              <Bell className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActivePage('ai-insights')}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-trade-primary to-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-glow-primary hover:opacity-95 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">AI Analysis</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Trading Terminal Multi-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Financial Chart & Asset Stats (8 Columns) */}
        <div className="lg:col-span-8 space-y-4">
          <FinancialChart asset={activeAsset} />
          <AssetStatsPanel asset={activeAsset} />
        </div>

        {/* Right: Order Book / Trades / Order Ticket Simulation (4 Columns) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Right Panel Tab Selector */}
          <div className="flex items-center bg-trade-surface border border-trade-border rounded-xl p-1 text-xs">
            <button
              onClick={() => setRightPanelTab('orderbook')}
              className={`flex-1 py-1.5 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
                rightPanelTab === 'orderbook'
                  ? 'bg-trade-primary text-white shadow-glow-primary'
                  : 'text-trade-muted hover:text-trade-text'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Order Book</span>
            </button>
            <button
              onClick={() => setRightPanelTab('trades')}
              className={`flex-1 py-1.5 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
                rightPanelTab === 'trades'
                  ? 'bg-trade-primary text-white shadow-glow-primary'
                  : 'text-trade-muted hover:text-trade-text'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Trades</span>
            </button>
            <button
              onClick={() => setRightPanelTab('orderTicket')}
              className={`flex-1 py-1.5 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
                rightPanelTab === 'orderTicket'
                  ? 'bg-trade-primary text-white shadow-glow-primary'
                  : 'text-trade-muted hover:text-trade-text'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Paper Trade</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="h-[520px]">
            {rightPanelTab === 'orderbook' && <OrderBookPanel asset={activeAsset} />}
            {rightPanelTab === 'trades' && <RecentTradesPanel asset={activeAsset} />}
            {rightPanelTab === 'orderTicket' && <OrderTicketSimulation asset={activeAsset} />}
          </div>
        </div>
      </div>
    </div>
  );
};
