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
  ChevronDown
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
    setActiveBrokerId
  } = useMarket();

  const [showStatusPopover, setShowStatusPopover] = useState(false);
  const [showBrokerDropdown, setShowBrokerDropdown] = useState(false);

  const isLive = connectionStatus.status === 'LIVE';
  const activeAlertsCount = alerts.filter(a => a.status === 'ACTIVE').length;

  return (
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
              <Sparkles className="w-4 h-4 text-trade-primary animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-extrabold text-base tracking-tight text-white group-hover:text-trade-primary transition-colors">
                TRADE<span className="text-trade-primary">.AI</span>
              </span>
              <span className="hidden sm:inline-block text-[9px] font-semibold px-1.5 py-0.5 rounded bg-trade-primary/20 text-trade-primary uppercase tracking-wider border border-trade-primary/30">
                GATEWAY
              </span>
            </div>
            <p className="hidden md:block text-[10px] text-trade-subtle font-medium tracking-wide">
              Intelligent Market Intelligence
            </p>
          </div>
        </div>

        {/* Active Connected Broker Pill with Dropdown */}
        <div className="relative hidden lg:block">
          <button
            onClick={() => setShowBrokerDropdown(!showBrokerDropdown)}
            className="flex items-center gap-2 px-3 py-1 rounded-xl bg-trade-surface2 hover:bg-trade-surface3 border border-trade-border text-xs transition-all cursor-pointer shadow-inner"
          >
            <span className="text-sm">
              {activeBrokerAccount?.id === 'binance' ? '🔶' :
               activeBrokerAccount?.id === 'coinbase' ? '🔵' :
               activeBrokerAccount?.id === 'interactive_brokers' ? '🏛️' :
               activeBrokerAccount?.id === 'zerodha' ? '🪁' :
               activeBrokerAccount?.id === 'robinhood' ? '🪶' : '⚡'}
            </span>
            <span className="font-bold text-trade-text">{activeBrokerAccount?.name || 'Binance Pro'}</span>
            <span className="font-num text-[11px] text-emerald-400 font-semibold">
              ${formatPrice(activeBrokerAccount?.totalBalanceUsd || 148650)}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-trade-muted" />
          </button>

          {showBrokerDropdown && (
            <div 
              onMouseLeave={() => setShowBrokerDropdown(false)}
              className="absolute left-0 top-full mt-2 w-64 p-2 bg-trade-surface2 border border-trade-border rounded-xl shadow-2xl z-50 text-xs space-y-1 animate-in fade-in zoom-in-95"
            >
              <div className="px-2.5 py-1.5 text-[10px] font-bold text-trade-subtle uppercase border-b border-trade-border/60">
                Connected Broker Gateways
              </div>
              {(brokersList || []).map(b => (
                <button
                  key={b.id}
                  onClick={() => {
                    setActiveBrokerId(b.id);
                    setShowBrokerDropdown(false);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                    activeBrokerAccount?.id === b.id ? 'bg-trade-primary/15 text-trade-primary font-bold' : 'hover:bg-trade-surface3 text-trade-text'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-sm">
                      {b.id === 'binance' ? '🔶' :
                       b.id === 'coinbase' ? '🔵' :
                       b.id === 'interactive_brokers' ? '🏛️' :
                       b.id === 'zerodha' ? '🪁' :
                       b.id === 'robinhood' ? '🪶' : '⚡'}
                    </span>
                    <span className="truncate">{b.name}</span>
                  </div>
                  <span className="font-num text-[11px] text-trade-muted shrink-0">${formatPrice(b.totalBalanceUsd)}</span>
                </button>
              ))}
              <div className="pt-1 border-t border-trade-border/60">
                <button
                  onClick={() => {
                    setActivePage('landing');
                    setShowBrokerDropdown(false);
                  }}
                  className="w-full py-1.5 text-center text-trade-primary hover:underline text-[11px] font-semibold"
                >
                  Browse All 7 Exchange Gateways →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center: Search Trigger */}
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
        {/* Wallet Direct Access Button */}
        <button
          onClick={() => setActivePage('wallet')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-trade-surface3 border border-amber-500/40 text-amber-300 hover:text-white hover:border-amber-400 text-xs font-semibold shadow-inner transition-all"
          title="Open Account Wallet"
        >
          <Wallet className="w-4 h-4 text-amber-400" />
          <span className="hidden sm:inline font-num">${formatPrice(activeBrokerAccount?.totalBalanceUsd || 148650)}</span>
          <span className="sm:hidden font-sans">Wallet</span>
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
                  <span className="font-medium text-trade-text">{activeBrokerAccount?.name || 'Binance Pro'}</span>
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
  );
};
