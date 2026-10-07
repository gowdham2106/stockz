import React, { useState } from 'react';
import { 
  Search, 
  Wifi, 
  WifiOff, 
  Volume2, 
  VolumeX, 
  Bell, 
  User, 
  Sparkles, 
  ShieldCheck, 
  Wallet,
  Globe,
  Radio,
  ChevronDown,
  Zap,
  CheckCircle2,
  AlertTriangle,
  X
} from 'lucide-react';
import { useMarket } from '../../context/MarketContext';
import { Badge } from '../common/Badge';
import { formatPrice } from '../../utils/formatters';

export const TopNavbar: React.FC = () => {
  const { 
    connectionStatus, 
    setIsSearchOpen, 
    isSoundEnabled, 
    setIsSoundEnabled,
    alerts,
    setActivePage,
    activeBrokerAccount,
    brokersList,
    setActiveBrokerId,
    paperAccount,
    paperNotification,
    dismissPaperNotification
  } = useMarket();

  const [showStatusPopover, setShowStatusPopover] = useState(false);
  const [showBrokerDropdown, setShowBrokerDropdown] = useState(false);

  const isLive = connectionStatus.status === 'LIVE';
  const activeAlertsCount = alerts.filter(a => a.status === 'ACTIVE').length;

  const virtualCash = paperAccount?.virtualCash ?? 73630;
  const marginUsed = paperAccount?.marginUsed ?? 26370;
  const totalPortfolio = paperAccount?.totalPortfolioValue ?? 100000;

  return (
    <>
      <header className="sticky top-0 z-40 w-full h-14 bg-trade-surface/90 backdrop-blur-md border-b border-trade-border flex items-center justify-between px-3 md:px-5 select-none">
        {/* Left: Brand & Broker Landing Link */}
        <div className="flex items-center gap-3 md:gap-5">
          <div 
            onClick={() => setActivePage('landing')}
            className="flex items-center gap-2.5 cursor-pointer group"
            title="Back to Broker Gateway"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-trade-primary to-blue-400 p-[1px] shadow-glow-primary">
              <div className="w-full h-full bg-trade-bg rounded-[11px] flex items-center justify-center group-hover:bg-trade-surface transition-colors">
                <Sparkles className="w-4 h-4 text-trade-primary group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div className="hidden sm:block">
              <span className="font-display font-black text-sm tracking-tight bg-gradient-to-r from-white via-slate-100 to-trade-primary bg-clip-text text-transparent">
                STOCKZ
              </span>
              <span className="text-[9px] font-mono text-trade-primary block -mt-1 font-semibold tracking-wider">
                ULTRA-TERMINAL
              </span>
            </div>
          </div>

          {/* Active Broker Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowBrokerDropdown(!showBrokerDropdown)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-trade-surface2/80 hover:bg-trade-surface3 border border-trade-border hover:border-trade-primary/40 transition-all text-xs text-trade-text"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <div className="flex items-center gap-1.5 font-medium truncate max-w-[140px] md:max-w-[200px]">
                <span className="truncate">{activeBrokerAccount?.name || 'Binance'}</span>
                <span className="text-[10px] font-mono bg-trade-surface3 px-1.5 py-0.5 rounded text-trade-subtle border border-trade-border">
                  {activeBrokerAccount?.category?.split(' ')[0] || 'Personal'}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-trade-subtle shrink-0" />
            </button>

            {showBrokerDropdown && (
              <div 
                onMouseLeave={() => setShowBrokerDropdown(false)}
                className="absolute left-0 top-full mt-2 w-72 p-2 bg-trade-surface2 border border-trade-border rounded-xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100 space-y-1"
              >
                <div className="px-2 py-1 text-[10px] font-semibold text-trade-subtle uppercase tracking-wider">
                  Switch Active Broker Connection
                </div>
                {brokersList.map(b => (
                  <button
                    key={b.id}
                    onClick={() => {
                      setActiveBrokerId(b.id);
                      setShowBrokerDropdown(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition-colors text-left ${
                      b.id === activeBrokerAccount.id 
                        ? 'bg-trade-primary/20 text-trade-primary font-semibold border border-trade-primary/30' 
                        : 'hover:bg-trade-surface3 text-trade-text'
                    }`}
                  >
                    <div>
                      <div className="font-semibold">{b.name}</div>
                      <div className="text-[10px] text-trade-subtle">{b.category}</div>
                    </div>
                    <span className="font-num text-[11px] text-trade-muted">
                      ${formatPrice(b.totalBalanceUsd)}
                    </span>
                  </button>
                ))}
                <div className="pt-1 mt-1 border-t border-trade-border">
                  <button
                    onClick={() => {
                      setActivePage('landing');
                      setShowBrokerDropdown(false);
                    }}
                    className="w-full py-1.5 text-center text-xs text-trade-primary hover:underline font-semibold"
                  >
                    View All Supported Brokers & Accounts →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center: Global Omni-Search Bar */}
        <div className="flex-1 max-w-xs md:max-w-md mx-2 md:mx-6">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full flex items-center justify-between px-3 py-1.5 text-xs rounded-xl bg-trade-surface2/80 hover:bg-trade-surface3 border border-trade-border hover:border-trade-borderLight text-trade-muted hover:text-trade-text transition-all shadow-inner group"
          >
            <div className="flex items-center gap-2 truncate">
              <Search className="w-3.5 h-3.5 text-trade-subtle group-hover:text-trade-primary transition-colors shrink-0" />
              <span className="truncate">Search stocks, crypto, indices, forex...</span>
            </div>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded bg-trade-surface3 border border-trade-border text-trade-subtle shrink-0">
              <span>⌘</span>K
            </kbd>
          </button>
        </div>

        {/* Right: Wallet Button, Connection telemetry, Audio, Alerts */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Practice / Paper Trading Wallet Button with Live Balance Deduction */}
          <button
            onClick={() => setActivePage('portfolio')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-trade-surface3 to-trade-surface2 border border-amber-500/40 text-amber-300 hover:text-white hover:border-amber-400 text-xs font-semibold shadow-inner transition-all group"
            title={`Virtual Available Cash: $${formatPrice(virtualCash)} | Margin In Trades: $${formatPrice(marginUsed)} | Total Portfolio: $${formatPrice(totalPortfolio)}`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0 group-hover:rotate-12 transition-transform" />
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1">
                <span className="hidden sm:inline font-num font-bold text-amber-200">
                  ${formatPrice(virtualCash)}
                </span>
                <span className="text-[10px] font-sans text-amber-400/90 font-semibold">Cash</span>
              </div>
            </div>
          </button>

          {/* Real-time Connection Status Indicator */}
          <div className="relative">
            <button
              onClick={() => setShowStatusPopover(!showStatusPopover)}
              onMouseEnter={() => setShowStatusPopover(true)}
              onMouseLeave={() => setShowStatusPopover(false)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                isLive 
                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]' 
                  : 'bg-amber-950/60 text-amber-400 border-amber-500/30'
              }`}
            >
              {isLive ? (
                <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span className="font-num text-[11px] tracking-wide">
                {isLive ? '● LIVE' : `● ${connectionStatus.status}`}
              </span>
            </button>

            {showStatusPopover && (
              <div 
                onMouseEnter={() => setShowStatusPopover(true)}
                onMouseLeave={() => setShowStatusPopover(false)}
                className="absolute right-0 top-full mt-2 w-72 p-3.5 bg-trade-surface2 border border-trade-border rounded-xl shadow-2xl z-50 text-xs text-trade-text animate-in fade-in zoom-in-95 duration-100"
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-trade-border">
                  <div className="flex items-center gap-1.5 font-semibold text-trade-text">
                    <ShieldCheck className="w-4 h-4 text-trade-primary" />
                    <span>Real-Time Gateway</span>
                  </div>
                  <Badge variant={isLive ? 'live' : 'warning'} size="xs" pulse={isLive}>
                    {connectionStatus.status}
                  </Badge>
                </div>

                <div className="space-y-1.5 font-num text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-trade-subtle">Provider:</span>
                    <span className="font-medium text-trade-text">{activeBrokerAccount?.name || 'Binance'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-trade-subtle">Stream Mode:</span>
                    <span className="font-medium text-trade-primary">WebSocket AggTrade (0ms delay)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-trade-subtle">Latency:</span>
                    <span className="font-medium text-emerald-400">{activeBrokerAccount?.latency || '<15ms'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-trade-subtle">Active Streams:</span>
                    <span className="font-medium text-trade-text">{connectionStatus.activeStreams} Feeds</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-trade-border">
                    <span className="text-trade-subtle">Virtual Cash:</span>
                    <span className="font-bold text-amber-300">${formatPrice(virtualCash)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Audio Chimes Toggle */}
          <button
            onClick={() => setIsSoundEnabled(prev => !prev)}
            title={isSoundEnabled ? 'Disable Price Tick Audio' : 'Enable Price Tick Audio'}
            className={`p-1.5 rounded-lg border transition-all ${
              isSoundEnabled 
                ? 'bg-trade-primary/20 border-trade-primary/40 text-trade-primary shadow-glow-primary' 
                : 'bg-trade-surface2 border-trade-border text-trade-muted hover:text-trade-text'
            }`}
          >
            {isSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Alerts Button */}
          <button
            onClick={() => setActivePage('alerts')}
            className="relative p-1.5 rounded-lg bg-trade-surface2 border border-trade-border text-trade-muted hover:text-trade-text transition-colors"
            title="Price Alerts"
          >
            <Bell className="w-4 h-4" />
            {activeAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-trade-primary text-[9px] font-bold text-white shadow-glow-primary">
                {activeAlertsCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Floating Real-Time Trigger Notification Banner (Stop Loss / Take Profit / Orders) */}
      {paperNotification && (
        <div className="sticky top-14 z-50 w-full px-4 py-2.5 bg-gradient-to-r from-red-950/90 via-trade-surface2/95 to-trade-surface border-b border-red-500/40 text-xs shadow-xl animate-in slide-in-from-top-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-lg shrink-0 ${
              paperNotification.type === 'TAKE_PROFIT' 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                : 'bg-red-500/20 text-red-400 border border-red-500/40'
            }`}>
              {paperNotification.type === 'TAKE_PROFIT' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            </div>
            <div>
              <div className="font-bold text-white flex items-center gap-2">
                <span>{paperNotification.title}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-trade-surface3 text-trade-subtle border border-trade-border">
                  {paperNotification.symbol}
                </span>
              </div>
              <p className="text-slate-300 text-[11px]">{paperNotification.message}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActivePage('portfolio')}
              className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] transition-colors"
            >
              View Paper Hub
            </button>
            <button
              onClick={dismissPaperNotification}
              className="p-1 rounded text-trade-muted hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
