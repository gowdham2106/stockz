import React from 'react';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Building, Globe, Zap, Shield } from 'lucide-react';
import { MarketAsset } from '../../types/market';
import { formatPrice, formatPercent, formatVolume, formatMarketCap, formatCurrencySymbol } from '../../utils/formatters';

interface AssetStatsPanelProps {
  asset: MarketAsset;
}

export const AssetStatsPanel: React.FC<AssetStatsPanelProps> = ({ asset }) => {
  const isPos = asset.changePercent >= 0;
  const currSymbol = formatCurrencySymbol(asset.assetType, asset.exchange);

  const high = asset.high || asset.price * 1.025;
  const low = asset.low || asset.price * 0.975;
  const range = high - low || 1;
  const currentProgress = Math.min(100, Math.max(0, ((asset.price - low) / range) * 100));

  return (
    <div className="bg-trade-surface border border-trade-border rounded-2xl p-4 shadow-card">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-trade-border">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-trade-primary" />
          <h3 className="text-xs font-bold text-trade-text uppercase tracking-wider">Key Metrics & Fundamentals</h3>
        </div>
        <span className="text-[11px] text-trade-subtle font-num uppercase">
          {asset.exchange} • {asset.tradingStatus}
        </span>
      </div>

      {/* 24h Price Range Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs font-num text-trade-subtle mb-1.5">
          <span>24h Low: <strong className="text-trade-text">{currSymbol}{formatPrice(low, asset.assetType)}</strong></span>
          <span>Current: <strong className="text-trade-primary">{currSymbol}{formatPrice(asset.price, asset.assetType)}</strong></span>
          <span>24h High: <strong className="text-trade-text">{currSymbol}{formatPrice(high, asset.assetType)}</strong></span>
        </div>
        <div className="w-full h-2 rounded-full bg-trade-surface3 overflow-hidden relative">
          <div 
            className="h-full bg-gradient-to-r from-trade-negative via-amber-400 to-trade-positive rounded-full"
            style={{ width: '100%' }}
          />
          {/* Needle Indicator */}
          <div 
            className="absolute top-0 bottom-0 w-1.5 bg-white shadow-glow-primary rounded -translate-x-1/2"
            style={{ left: `${currentProgress}%` }}
          />
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs font-num">
        <div className="p-2.5 rounded-xl bg-trade-surface2/60 border border-trade-border/60">
          <div className="text-[10px] text-trade-subtle font-sans font-medium uppercase mb-0.5">24h Change</div>
          <div className={`font-semibold flex items-center gap-1 ${isPos ? 'text-trade-positive' : 'text-trade-negative'}`}>
            {isPos ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {formatPercent(asset.changePercent)} ({currSymbol}{formatPrice(asset.change, asset.assetType)})
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-trade-surface2/60 border border-trade-border/60">
          <div className="text-[10px] text-trade-subtle font-sans font-medium uppercase mb-0.5">24h Volume</div>
          <div className="font-semibold text-trade-text">
            {formatVolume(asset.volume || asset.quoteVolume || 1285000)}
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-trade-surface2/60 border border-trade-border/60">
          <div className="text-[10px] text-trade-subtle font-sans font-medium uppercase mb-0.5">Market Cap</div>
          <div className="font-semibold text-trade-text">
            {formatMarketCap(asset.marketCap, asset.assetType)}
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-trade-surface2/60 border border-trade-border/60">
          <div className="text-[10px] text-trade-subtle font-sans font-medium uppercase mb-0.5">Bid / Ask Spread</div>
          <div className="font-semibold text-trade-text">
            {asset.spread ? `${currSymbol}${asset.spread.toFixed(4)}` : '0.05%'}
          </div>
        </div>

        {asset.pe !== undefined && asset.pe !== null && (
          <div className="p-2.5 rounded-xl bg-trade-surface2/60 border border-trade-border/60">
            <div className="text-[10px] text-trade-subtle font-sans font-medium uppercase mb-0.5">P/E Ratio</div>
            <div className="font-semibold text-trade-text">{asset.pe.toFixed(1)}x</div>
          </div>
        )}

        {asset.eps !== undefined && asset.eps !== null && (
          <div className="p-2.5 rounded-xl bg-trade-surface2/60 border border-trade-border/60">
            <div className="text-[10px] text-trade-subtle font-sans font-medium uppercase mb-0.5">EPS (TTM)</div>
            <div className="font-semibold text-trade-text">${asset.eps.toFixed(2)}</div>
          </div>
        )}

        {asset.sector && (
          <div className="p-2.5 rounded-xl bg-trade-surface2/60 border border-trade-border/60">
            <div className="text-[10px] text-trade-subtle font-sans font-medium uppercase mb-0.5">Sector</div>
            <div className="font-semibold text-trade-text truncate font-sans">{asset.sector}</div>
          </div>
        )}

        <div className="p-2.5 rounded-xl bg-trade-surface2/60 border border-trade-border/60">
          <div className="text-[10px] text-trade-subtle font-sans font-medium uppercase mb-0.5">Data Feed</div>
          <div className="font-semibold text-emerald-400 truncate font-sans">{asset.dataSource}</div>
        </div>
      </div>
    </div>
  );
};
