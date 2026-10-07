import React, { useState, useEffect } from 'react';
import { 
  SlidersHorizontal, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  ArrowUpRight, 
  Flame, 
  Compass, 
  Layers, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { useMarket } from '../context/MarketContext';
import { MarketScannerItem } from '../types/market';
import { api } from '../services/api';
import { Badge } from '../components/common/Badge';
import { formatPrice, formatPercent, formatVolume } from '../utils/formatters';

export const ScannerPage: React.FC = () => {
  const { openTerminalFor } = useMarket();

  const [preset, setPreset] = useState<string>('gainers');
  const [items, setItems] = useState<MarketScannerItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Custom filters
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [minChange, setMinChange] = useState<string>('');
  const [minRsi, setMinRsi] = useState<string>('');
  const [maxRsi, setMaxRsi] = useState<string>('');

  const presets = [
    { id: 'gainers', label: 'Top Gainers', icon: TrendingUp },
    { id: 'losers', label: 'Top Losers', icon: TrendingDown },
    { id: 'breakouts', label: 'Momentum Breakouts', icon: Zap },
    { id: 'volume', label: 'High Liquidity & Volume', icon: Flame },
    { id: 'oversold', label: 'RSI Oversold (<40)', icon: Compass },
    { id: 'overbought', label: 'RSI Overbought (>65)', icon: Layers },
    { id: 'volatility', label: 'High Volatility', icon: SlidersHorizontal },
    { id: 'trending', label: 'Strong Bullish Trend', icon: Sparkles },
  ];

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    api.getScanner(preset)
      .then(data => {
        if (isMounted) {
          setItems(data);
          setIsLoading(false);
        }
      })
      .catch(err => {
        console.warn('Failed to fetch scanner:', err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [preset]);

  const filteredItems = items.filter(item => {
    if (minPrice && item.price < parseFloat(minPrice)) return false;
    if (maxPrice && item.price > parseFloat(maxPrice)) return false;
    if (minChange && item.changePercent < parseFloat(minChange)) return false;
    if (minRsi && item.rsi < parseFloat(minRsi)) return false;
    if (maxRsi && item.rsi > parseFloat(maxRsi)) return false;
    return true;
  });

  const resetFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setMinChange('');
    setMinRsi('');
    setMaxRsi('');
  };

  return (
    <div className="p-3 md:p-6 space-y-6 max-w-[1720px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-trade-primary" />
            <h1 className="text-xl md:text-2xl font-display font-extrabold text-white tracking-tight">
              Institutional Market Scanner
            </h1>
            <Badge variant="primary" size="xs">
              ANALYTICAL ENGINE
            </Badge>
          </div>
          <p className="text-xs md:text-sm text-trade-muted mt-1">
            Real-time algorithmic screening across RSI, EMA displacement, volume anomalies, and breakout regimes.
          </p>
        </div>
      </div>

      {/* Preset Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
        {presets.map(p => {
          const Icon = p.icon;
          const isActive = preset === p.id;

          return (
            <button
              key={p.id}
              onClick={() => setPreset(p.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-trade-primary text-white shadow-glow-primary font-semibold'
                  : 'bg-trade-surface border border-trade-border text-trade-muted hover:text-trade-text hover:bg-trade-surface2'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{p.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-trade-surface border border-trade-border rounded-2xl p-4 shadow-card">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-trade-border text-xs font-semibold text-trade-text">
          <span className="uppercase tracking-wider text-[11px] text-trade-subtle">Quantitative Filter Criteria</span>
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 text-[11px] text-trade-muted hover:text-trade-primary transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Criteria</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
          <div>
            <label className="block text-[10px] uppercase font-bold text-trade-subtle mb-1">Min Price ($)</label>
            <input
              type="number"
              placeholder="e.g. 10"
              value={minPrice}
              onChange={e => setMinPrice(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-trade-surface2 border border-trade-border text-trade-text placeholder:text-trade-subtle focus:outline-none focus:border-trade-primary font-num"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-trade-subtle mb-1">Max Price ($)</label>
            <input
              type="number"
              placeholder="e.g. 50000"
              value={maxPrice}
              onChange={e => setMaxPrice(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-trade-surface2 border border-trade-border text-trade-text placeholder:text-trade-subtle focus:outline-none focus:border-trade-primary font-num"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-trade-subtle mb-1">Min 24h Change (%)</label>
            <input
              type="number"
              placeholder="e.g. 2.0"
              value={minChange}
              onChange={e => setMinChange(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-trade-surface2 border border-trade-border text-trade-text placeholder:text-trade-subtle focus:outline-none focus:border-trade-primary font-num"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-trade-subtle mb-1">Min RSI (14)</label>
            <input
              type="number"
              placeholder="e.g. 30"
              value={minRsi}
              onChange={e => setMinRsi(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-trade-surface2 border border-trade-border text-trade-text placeholder:text-trade-subtle focus:outline-none focus:border-trade-primary font-num"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-trade-subtle mb-1">Max RSI (14)</label>
            <input
              type="number"
              placeholder="e.g. 70"
              value={maxRsi}
              onChange={e => setMaxRsi(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-trade-surface2 border border-trade-border text-trade-text placeholder:text-trade-subtle focus:outline-none focus:border-trade-primary font-num"
            />
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-trade-surface border border-trade-border rounded-2xl overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-num">
            <thead>
              <tr className="border-b border-trade-border bg-trade-surface2/70 text-[11px] font-bold text-trade-subtle uppercase tracking-wider font-sans select-none">
                <th className="py-3 px-4">Symbol</th>
                <th className="py-3 px-4 text-right">Price</th>
                <th className="py-3 px-4 text-right">24h Change</th>
                <th className="py-3 px-4 text-center">RSI (14)</th>
                <th className="py-3 px-4 text-center">Volatility</th>
                <th className="py-3 px-4 text-center">Trend Status</th>
                <th className="py-3 px-4 text-center">Technical Signal</th>
                <th className="py-3 px-4 text-right">Volume</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-trade-border/40">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-trade-muted font-sans">
                    Screening live order flow and technical indicators...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-trade-muted font-sans">
                    No symbols match current scanner filter configuration.
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => {
                  const isPos = item.changePercent >= 0;

                  return (
                    <tr
                      key={item.symbol}
                      onClick={() => openTerminalFor(item.symbol)}
                      className="hover:bg-trade-surface2/80 cursor-pointer transition-colors group"
                    >
                      <td className="py-3.5 px-4 font-bold text-trade-text group-hover:text-trade-primary transition-colors">
                        <div className="flex items-center gap-2">
                          <span>{item.symbol}</span>
                          <span className="text-[10px] text-trade-subtle font-normal font-sans truncate max-w-[120px]">
                            {item.name}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-trade-text">
                        ${formatPrice(item.price)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-semibold">
                        <span className={isPos ? 'text-trade-positive' : 'text-trade-negative'}>
                          {formatPercent(item.changePercent)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          item.rsi > 70 ? 'bg-red-950/60 text-red-400 border border-red-500/30' :
                          item.rsi < 35 ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30' :
                          'bg-trade-surface3 text-trade-muted border border-trade-border'
                        }`}>
                          {item.rsi}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center font-sans text-[11px] text-trade-subtle">
                        {item.volatility}
                      </td>

                      <td className="py-3.5 px-4 text-center font-sans font-semibold text-[11px]">
                        <span className={item.trend.includes('BULLISH') ? 'text-trade-positive' : 'text-trade-negative'}>
                          {item.trend}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded bg-trade-primary/10 text-trade-primary border border-trade-primary/20 text-[10px] font-mono font-bold">
                          {item.signal}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right text-trade-text">
                        {formatVolume(item.volume)}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openTerminalFor(item.symbol);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-trade-surface3 hover:bg-trade-primary text-trade-text hover:text-white transition-all text-xs font-semibold font-sans"
                        >
                          Analyze
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
