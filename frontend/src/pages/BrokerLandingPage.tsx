import React from 'react';
import { 
  ShieldCheck, 
  Zap, 
  ArrowRight, 
  Globe, 
  Wallet, 
  Lock, 
  Cpu, 
  CheckCircle2, 
  Flame, 
  Sparkles,
  Layers,
  ChevronRight,
  TrendingUp,
  Server,
  ExternalLink,
  Key
} from 'lucide-react';
import { useMarket } from '../context/MarketContext';
import { BROKERS_DATA } from '../data/brokersData';
import { BrokerAccount } from '../types/market';
import { Badge } from '../components/common/Badge';
import { formatPrice } from '../utils/formatters';

export const BrokerLandingPage: React.FC = () => {
  const { selectBrokerAndOpenWallet, setActivePage } = useMarket();

  const handleSelectBroker = (broker: BrokerAccount) => {
    selectBrokerAndOpenWallet(broker.id);
  };

  const binanceBroker = (BROKERS_DATA || []).find(b => b.id === 'binance') || BROKERS_DATA[0];
  const otherBrokers = (BROKERS_DATA || []).filter(b => b.id !== 'binance');

  return (
    <div className="min-h-[88vh] bg-trade-bg text-trade-text p-3 sm:p-6 lg:p-10 max-w-[1720px] mx-auto select-none space-y-8">
      {/* Hero Banner Section */}
      <div className="relative rounded-3xl bg-gradient-to-br from-trade-surface via-trade-surface2 to-[#09101E] border border-trade-border p-6 sm:p-10 shadow-2xl overflow-hidden">
        {/* Glow backdrop decorative effect */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-trade-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-trade-primary/15 border border-trade-primary/30 text-trade-primary text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>TRADE.AI BROKER GATEWAY PORTAL</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-display font-black tracking-tight text-white leading-tight">
            Connect Your Preferred <span className="text-transparent bg-clip-text bg-gradient-to-r from-trade-primary via-blue-400 to-amber-300">Broker & Exchange</span>
          </h1>

          <p className="text-xs sm:text-base text-trade-muted leading-relaxed max-w-2xl">
            Select Binance or an institutional broker below to inspect your connected account wallet balances, live order books, and real-time WebSocket market streams.
          </p>

          {/* Key Security Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-trade-surface3/60 border border-trade-border text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-trade-text font-medium">Read-Only Telemetry</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-trade-surface3/60 border border-trade-border text-xs">
              <Zap className="w-4 h-4 text-trade-primary shrink-0" />
              <span className="text-trade-text font-medium">&lt;15ms Real-Time Feeds</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-trade-surface3/60 border border-trade-border text-xs">
              <Lock className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-trade-text font-medium">Direct Binance Sync</span>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Primary Broker: BINANCE */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-trade-text">
              Primary Exchange Gateway (Recommended)
            </h2>
          </div>
          <span className="text-xs text-emerald-400 font-num">● Active Live WebSocket Stream</span>
        </div>

        <div className="group relative bg-gradient-to-r from-trade-surface via-trade-surface2 to-[#131B2A] border-2 border-amber-500/40 hover:border-amber-400 p-5 sm:p-7 rounded-3xl shadow-2xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(245,158,11,0.2)]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div 
              onClick={() => handleSelectBroker(binanceBroker)}
              className="flex items-start gap-4 cursor-pointer flex-1"
            >
              {/* Binance Golden Icon */}
              <div className="w-14 h-14 rounded-2xl bg-amber-950/80 border border-amber-500/50 flex items-center justify-center font-black text-2xl text-amber-400 shadow-[0_0_20px_rgba(240,185,11,0.3)] shrink-0 group-hover:scale-105 transition-transform">
                🔶
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-xl font-display font-extrabold text-white tracking-tight group-hover:text-amber-400 transition-colors">
                    {binanceBroker.name}
                  </h3>
                  <Badge variant="warning" size="sm" pulse>
                    {binanceBroker.badge}
                  </Badge>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                    LATENCY: {binanceBroker.latency}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-trade-muted">
                  {binanceBroker.tagline}
                </p>

                <div className="flex items-center gap-3 text-xs text-trade-subtle pt-1 flex-wrap">
                  <span>Account: <strong className="text-trade-text">{binanceBroker.accountId}</strong></span>
                  <span>• Tier: <strong className="text-amber-400">{binanceBroker.vipLevel}</strong></span>
                  <span>• Feeds: <strong className="text-emerald-400">BTC, ETH, SOL, BNB, XRP, DOGE</strong></span>
                </div>
              </div>
            </div>

            {/* Right: Wallet Balance & Action Buttons */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:gap-6 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-trade-border/60">
              <div 
                onClick={() => handleSelectBroker(binanceBroker)}
                className="font-num text-left sm:text-right cursor-pointer"
              >
                <div className="text-[11px] text-trade-subtle font-sans uppercase">Connected Wallet Value</div>
                <div className="text-xl sm:text-2xl font-black text-trade-text">
                  ${formatPrice(binanceBroker.totalBalanceUsd)}
                </div>
                <div className="text-xs font-bold text-trade-positive flex items-center sm:justify-end gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+{binanceBroker.todayPnlPercent}% Today (+${formatPrice(binanceBroker.todayPnl)})</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                <button 
                  onClick={() => handleSelectBroker(binanceBroker)}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:scale-105 transition-all cursor-pointer"
                >
                  <Wallet className="w-4 h-4" />
                  <span>Open Binance Wallet</span>
                  <ChevronRight className="w-4 h-4" />
                </button>

                <a
                  href="https://accounts.binance.com/en/login"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-3 rounded-2xl bg-trade-surface2 hover:bg-trade-surface3 text-trade-muted hover:text-white border border-trade-border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  title="Open Official Binance.com Login"
                >
                  <span>Binance.com</span>
                  <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Other Supported Brokers */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-trade-primary" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-trade-text">
              Multi-Asset & Institutional Brokers
            </h2>
          </div>
          <span className="text-xs text-trade-subtle">
            {otherBrokers.length} Available Gateways
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {otherBrokers.map(broker => {
            const isPos = broker.todayPnl >= 0;

            return (
              <div
                key={broker.id}
                onClick={() => handleSelectBroker(broker)}
                className="group relative bg-trade-surface border border-trade-border hover:border-trade-primary/60 rounded-3xl p-5 shadow-card hover:shadow-2xl transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-11 h-11 rounded-2xl flex items-center justify-center font-black text-xl border border-trade-border shadow-inner shrink-0 group-hover:scale-105 transition-transform"
                        style={{ backgroundColor: `${broker.accentColor}18`, color: broker.accentColor }}
                      >
                        {broker.id === 'coinbase' ? '🔵' :
                         broker.id === 'interactive_brokers' ? '🏛️' :
                         broker.id === 'zerodha' ? '🪁' :
                         broker.id === 'robinhood' ? '🪶' :
                         broker.id === 'metatrader' ? '📈' : '⚡'}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-display font-bold text-base text-white group-hover:text-trade-primary transition-colors">
                            {broker.name}
                          </h3>
                        </div>
                        <span className="text-[11px] text-trade-subtle">
                          {broker.category}
                        </span>
                      </div>
                    </div>

                    <Badge 
                      variant={broker.status === 'CONNECTED' ? 'live' : broker.status === 'READY' ? 'primary' : 'demo'} 
                      size="xs"
                    >
                      {broker.status}
                    </Badge>
                  </div>

                  <p className="text-xs text-trade-muted line-clamp-2 leading-relaxed">
                    {broker.tagline}
                  </p>
                </div>

                {/* Account Details & Balances */}
                <div className="pt-3 border-t border-trade-border/60 font-num space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-trade-subtle font-sans">Account ID:</span>
                    <span className="font-mono text-trade-text">{broker.accountId}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-trade-subtle font-sans">Total Assets:</span>
                    <span className="font-black text-base text-trade-text">
                      ${formatPrice(broker.totalBalanceUsd)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-trade-subtle font-sans">24h Gain:</span>
                    <span className={`font-bold flex items-center gap-1 ${isPos ? 'text-trade-positive' : 'text-trade-negative'}`}>
                      {isPos ? '+' : ''}{broker.todayPnlPercent}% (${formatPrice(Math.abs(broker.todayPnl))})
                    </span>
                  </div>
                </div>

                {/* Card Button */}
                <button className="w-full py-2.5 rounded-xl bg-trade-surface2 group-hover:bg-trade-primary text-trade-text group-hover:text-white font-bold text-xs flex items-center justify-center gap-2 border border-trade-border group-hover:border-transparent transition-all">
                  <Wallet className="w-3.5 h-3.5" />
                  <span>View Connected Wallet</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
