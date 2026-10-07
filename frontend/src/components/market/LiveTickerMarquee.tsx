import React, { useState, useRef } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Flame, 
  Pause, 
  Play, 
  ChevronLeft, 
  ChevronRight,
  SlidersHorizontal
} from 'lucide-react';
import { useMarket } from '../../context/MarketContext';
import { formatPrice, formatPercent, formatCurrencySymbol } from '../../utils/formatters';

type ScrollSpeed = 'super-slow' | 'gentle' | 'steady';

const SPEED_DURATIONS: Record<ScrollSpeed, string> = {
  'super-slow': '1600s', // ~1.5px to 2px per second - nearly stationary, effortless reading
  'gentle': '900s',      // ~3.5px per second - very slow crawl
  'steady': '450s'       // ~7px per second - slow broadcast pace
};

export const LiveTickerMarquee: React.FC = () => {
  const { assets, openTerminalFor, flashMap } = useMarket();
  const [speed, setSpeed] = useState<ScrollSpeed>('super-slow');
  const [isPaused, setIsPaused] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  // Priority highlight symbols for the marquee
  const displayAssets = assets.length > 0 ? assets : [];

  if (displayAssets.length === 0) return null;

  const currentDuration = SPEED_DURATIONS[speed];

  const handleManualNudge = (direction: 'left' | 'right') => {
    if (trackRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      trackRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full h-9 bg-trade-surface border-b border-trade-border/90 overflow-hidden flex items-center select-none relative group z-20 shadow-sm">
      {/* Left Control Center Pill */}
      <div className="flex items-center h-full bg-trade-surface2 border-r border-trade-border px-2 sm:px-3 gap-1.5 shrink-0 z-30 shadow-md">
        <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-amber-400">
          <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span className="hidden sm:inline tracking-wider uppercase font-display text-white">LIVE</span>
        </div>

        {/* Play/Pause Toggle Button */}
        <button
          onClick={() => setIsPaused(!isPaused)}
          className={`px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 border transition-all cursor-pointer ${
            isPaused 
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]' 
              : 'bg-trade-surface3 hover:bg-trade-surface text-trade-muted hover:text-white border-trade-border/60'
          }`}
          title={isPaused ? 'Resume auto-scroll' : 'Pause scrolling completely to read'}
        >
          {isPaused ? (
            <>
              <Play className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-300">Paused</span>
            </>
          ) : (
            <>
              <Pause className="w-3 h-3 text-amber-400" />
              <span>Pause</span>
            </>
          )}
        </button>

        {/* Speed Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowSpeedMenu(!showSpeedMenu)}
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-trade-surface3 hover:bg-trade-surface border border-trade-border/60 text-[10px] font-bold text-trade-text transition-all cursor-pointer"
            title="Choose scroll speed (Super Slow / Gentle / Steady)"
          >
            <SlidersHorizontal className="w-2.5 h-2.5 text-trade-primary" />
            <span>{speed === 'super-slow' ? '🐌 Super Slow' : speed === 'gentle' ? '🚶 Gentle' : '⚡ Steady'}</span>
          </button>

          {showSpeedMenu && (
            <div 
              onMouseLeave={() => setShowSpeedMenu(false)}
              className="absolute left-0 top-full mt-1 w-44 bg-trade-surface border border-trade-border rounded-xl shadow-2xl p-1.5 z-50 text-[11px] space-y-1 animate-in fade-in zoom-in-95"
            >
              <div className="px-2 py-1 text-[9px] font-bold text-trade-subtle uppercase border-b border-trade-border/50">
                Scroll Speed Pace
              </div>

              <button
                onClick={() => { setSpeed('super-slow'); setShowSpeedMenu(false); }}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                  speed === 'super-slow' ? 'bg-trade-primary/20 text-trade-primary font-bold' : 'hover:bg-trade-surface2 text-trade-muted hover:text-white'
                }`}
              >
                <span>🐌 Super Slow (Recommended)</span>
                <span className="text-[9px] text-emerald-400 font-mono">1.5px/s</span>
              </button>

              <button
                onClick={() => { setSpeed('gentle'); setShowSpeedMenu(false); }}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                  speed === 'gentle' ? 'bg-trade-primary/20 text-trade-primary font-bold' : 'hover:bg-trade-surface2 text-trade-muted hover:text-white'
                }`}
              >
                <span>🚶 Gentle Crawl</span>
                <span className="text-[9px] text-trade-subtle font-mono">3.5px/s</span>
              </button>

              <button
                onClick={() => { setSpeed('steady'); setShowSpeedMenu(false); }}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                  speed === 'steady' ? 'bg-trade-primary/20 text-trade-primary font-bold' : 'hover:bg-trade-surface2 text-trade-muted hover:text-white'
                }`}
              >
                <span>⚡ Steady Broadcast</span>
                <span className="text-[9px] text-trade-subtle font-mono">7px/s</span>
              </button>
            </div>
          )}
        </div>

        {/* Step Arrows for Manual Step-by-Step Browsing */}
        <div className="hidden sm:flex items-center gap-0.5 border-l border-trade-border/70 pl-1.5">
          <button
            onClick={() => handleManualNudge('left')}
            className="p-1 rounded hover:bg-trade-surface3 text-trade-muted hover:text-white transition-colors"
            title="Step Left"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleManualNudge('right')}
            className="p-1 rounded hover:bg-trade-surface3 text-trade-muted hover:text-white transition-colors"
            title="Step Right"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Marquee Scrolling Track Container */}
      <div 
        ref={trackRef}
        className="flex-1 overflow-x-auto overflow-y-hidden flex items-center relative no-scrollbar"
      >
        <div 
          className={`ticker-marquee flex items-center gap-4 py-1 pl-4 ${isPaused ? 'ticker-marquee-paused' : ''}`}
          style={{ '--marquee-duration': currentDuration } as React.CSSProperties}
        >
          {/* Duplicate array to create seamless infinite loop */}
          {[...displayAssets, ...displayAssets].map((asset, idx) => {
            const isPos = asset.changePercent >= 0;
            const flash = flashMap[asset.symbol];
            const currSymbol = formatCurrencySymbol(asset.assetType, asset.exchange);

            return (
              <button
                key={`${asset.symbol}-${idx}`}
                onClick={() => openTerminalFor(asset.symbol)}
                className={`flex items-center gap-2.5 px-3 py-1 rounded-xl text-xs bg-trade-surface2/60 hover:bg-trade-surface2 border border-trade-border/70 hover:border-trade-primary/50 transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-sm hover:scale-[1.02] ${
                  flash === 'up' ? 'flash-up' : flash === 'down' ? 'flash-down' : ''
                }`}
                title={`${asset.name} (${asset.symbol}) - Price: ${currSymbol}${formatPrice(asset.price, asset.assetType)} | 24h: ${formatPercent(asset.changePercent)}`}
              >
                {/* Asset Symbol Tag */}
                <span className="font-bold text-white text-[12px] tracking-tight">
                  {asset.symbol}
                </span>

                {/* Live Price Tag */}
                <span className="font-num text-[12px] font-extrabold text-trade-text">
                  {currSymbol}{formatPrice(asset.price, asset.assetType)}
                </span>

                {/* Percentage Change Badge */}
                <span className={`font-num text-[11px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 ${
                  isPos 
                    ? 'text-emerald-400 bg-emerald-950/70 border border-emerald-500/30' 
                    : 'text-red-400 bg-red-950/70 border border-red-500/30'
                }`}>
                  {isPos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {formatPercent(asset.changePercent)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
