import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  ArrowUpRight, 
  ArrowDownLeft, 
  RefreshCw, 
  Layers, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  Globe, 
  Zap, 
  ExternalLink, 
  ChevronRight, 
  ArrowRightLeft, 
  Key, 
  Building2,
  Server
} from 'lucide-react';
import { useMarket } from '../context/MarketContext';
import { Badge } from '../components/common/Badge';
import { formatPrice, formatPercent } from '../utils/formatters';
import { api } from '../services/api';
import { BinanceAccountSummary, UnifiedBrokerAccount } from '../types/market';
import { BrokerConnectModal } from '../components/broker/BrokerConnectModal';

export const BrokerWalletPage: React.FC = () => {
  const { 
    activeBroker, 
    brokersList, 
    setActiveBrokerId, 
    openTerminalFor, 
    setActivePage,
    paperAccount,
    refreshPaperAccount 
  } = useMarket();

  const [activeTab, setActiveTab] = useState<'all' | 'spot' | 'futures' | 'margin'>('all');
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');
  const [unifiedAccount, setUnifiedAccount] = useState<UnifiedBrokerAccount | null>(null);
  const [isLoadingAccount, setIsLoadingAccount] = useState(false);

  const currentBroker = (brokersList || []).find(b => b.id === activeBroker) || brokersList?.[0] || {
    id: 'binance',
    name: 'Binance (Standard & Personal)',
    category: 'Crypto Spot, Futures & Wallet',
    tagline: 'Standard Personal & Retail Binance Account Gateway',
    logoType: 'binance',
    badge: 'ALL ACCOUNTS SUPPORTED',
    accentColor: '#F0B90B',
    status: 'CONNECTED',
    latency: '<15ms',
    accountId: 'BINANCE-USER-MAIN',
    accountType: 'Standard Spot & Futures Account',
    vipLevel: 'Standard User (Personal Account)',
    totalBalanceUsd: 148650.40,
    totalBalanceBtc: 2.2048,
    spotBalance: 94200.00,
    futuresBalance: 42150.40,
    fundingBalance: 12300.00,
    todayPnl: 3410.20,
    todayPnlPercent: 2.35,
    walletCoins: [
      { coin: 'BTC', name: 'Bitcoin', free: 0.8420, locked: 0, total: 0.8420, usdValue: 56762.00, change24h: 3.12, iconBg: '#F7931A' },
      { coin: 'ETH', name: 'Ethereum', free: 8.5000, locked: 0, total: 8.5000, usdValue: 28900.00, change24h: 2.85, iconBg: '#627EEA' },
      { coin: 'USDT', name: 'Tether USD', free: 24100.00, locked: 1200, total: 25300.00, usdValue: 25300.00, change24h: 0.01, iconBg: '#26A17B' },
      { coin: 'BNB', name: 'Binance Coin', free: 35.0000, locked: 0, total: 35.0000, usdValue: 20825.00, change24h: 4.20, iconBg: '#F0B90B' },
      { coin: 'SOL', name: 'Solana', free: 112.5000, locked: 0, total: 112.5000, usdValue: 19687.50, change24h: 5.60, iconBg: '#14F195' },
      { coin: 'FDUSD', name: 'First Digital USD', free: 8375.00, locked: 0, total: 8375.00, usdValue: 8375.00, change24h: 0.00, iconBg: '#002D74' }
    ]
  };

  const isZerodha = currentBroker?.id === 'zerodha';
  const isBinance = currentBroker?.id === 'binance';
  const isIbkr = currentBroker?.id === 'interactive_brokers';
  const isMt5 = currentBroker?.id === 'metatrader';
  const isCoinbase = currentBroker?.id === 'coinbase';

  // Fetch broker account details on switch
  useEffect(() => {
    setIsLoadingAccount(true);
    api.getBrokerAccount(currentBroker.id)
      .then((data: UnifiedBrokerAccount) => {
        if (data) {
          setUnifiedAccount(data);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch backend broker account, using local broker definitions:', err);
      })
      .finally(() => {
        setIsLoadingAccount(false);
      });
  }, [currentBroker.id]);

  const handleSimulatedAction = (msg: string) => {
    setActionSuccessMsg(msg);
    setIsDepositModalOpen(false);
    setIsTransferModalOpen(false);
    setTimeout(() => setActionSuccessMsg(''), 4000);
  };

  const handleConnectSuccess = (account: UnifiedBrokerAccount) => {
    setUnifiedAccount(account);
    setActionSuccessMsg(`Successfully connected and synchronized with ${account.name}!`);
    setTimeout(() => setActionSuccessMsg(''), 5000);
  };

  const currencySymbol = isZerodha ? '₹' : '$';
  const displayTotal = unifiedAccount ? unifiedAccount.totalBalance : (isZerodha ? 1845600 : currentBroker.totalBalanceUsd);
  const displayTodayPnl = unifiedAccount ? unifiedAccount.todayPnl : (isZerodha ? 28450 : currentBroker.todayPnl);
  const displayTodayPnlPct = unifiedAccount ? unifiedAccount.todayPnlPercent : currentBroker.todayPnlPercent;
  const isTodayPos = displayTodayPnl >= 0;

  // Render unified holdings or fallback coins
  const hasUnifiedHoldings = unifiedAccount && unifiedAccount.holdings && unifiedAccount.holdings.length > 0;

  return (
    <div className="p-3 md:p-6 lg:p-8 space-y-6 max-w-[1720px] mx-auto select-none">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-trade-surface border border-trade-border p-4 md:p-5 rounded-2xl shadow-card">
        <div className="flex items-center gap-3.5">
          <div 
            className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-2xl border border-trade-border shadow-inner shrink-0"
            style={{ backgroundColor: `${currentBroker?.accentColor || '#F0B90B'}20`, color: currentBroker?.accentColor || '#F0B90B' }}
          >
            {isZerodha ? '🪁' :
             isCoinbase ? '🔵' :
             isIbkr ? '🏛️' :
             isMt5 ? '📈' :
             isBinance ? '🔶' : '⚡'}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl md:text-2xl font-display font-extrabold text-white tracking-tight">
                {currentBroker?.name || 'Exchange'} Wallet & Portfolio
              </h1>
              <Badge variant={unifiedAccount?.isRealLiveSync ? 'positive' : 'live'} size="sm" pulse>
                {unifiedAccount?.isRealLiveSync ? 'REAL LIVE API SYNC' : (currentBroker?.status || 'CONNECTED')}
              </Badge>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-trade-surface3 border border-trade-border text-trade-subtle">
                {unifiedAccount?.accountId || currentBroker?.accountId || 'ACC-LIVE'}
              </span>
            </div>
            <p className="text-xs text-trade-muted mt-0.5">
              {unifiedAccount?.accountType || currentBroker?.accountType} • {currentBroker?.vipLevel || 'Active Gateway'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Connect Real API Key Button */}
          <button
            onClick={() => setIsConnectModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-trade-primary/20 hover:bg-trade-primary/30 text-trade-primary text-xs font-bold border border-trade-primary/40 flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            title={`Connect real ${currentBroker.name} API credentials`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>{unifiedAccount?.isRealLiveSync ? 'API Synced' : `Connect ${currentBroker.name} API`}</span>
          </button>

          {/* Official Broker Web Login Link */}
          <a
            href={
              isZerodha ? 'https://kite.zerodha.com' :
              isCoinbase ? 'https://www.coinbase.com/login' :
              isIbkr ? 'https://www.interactivebrokers.com/portal' :
              isMt5 ? 'https://trade.mql5.com/trade' :
              isBinance ? 'https://accounts.binance.com/en/login' : 'https://robinhood.com/login'
            }
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-trade-surface2 to-trade-surface3 hover:border-trade-primary text-trade-text hover:text-white border border-trade-border text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5 text-trade-primary" />
            <span>Official {currentBroker.name}</span>
          </a>

          <button
            onClick={() => setIsTransferModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-trade-surface2 hover:bg-trade-surface3 text-trade-text text-xs font-semibold border border-trade-border flex items-center gap-1.5 transition-all"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-trade-primary" />
            <span>Transfer</span>
          </button>

          <button
            onClick={() => setIsDepositModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-trade-surface2 hover:bg-trade-surface3 text-trade-text text-xs font-semibold border border-trade-border flex items-center gap-1.5 transition-all"
          >
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
            <span>Deposit / Funds</span>
          </button>

          <button
            onClick={() => setActivePage('landing')}
            className="px-3 py-2 rounded-xl bg-trade-surface3 hover:bg-trade-surface2 text-trade-muted hover:text-trade-text text-xs font-medium border border-trade-border transition-all"
          >
            <span>Switch Broker</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {actionSuccessMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in zoom-in-95">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">{actionSuccessMsg}</span>
        </div>
      )}

      {/* Zerodha / Broker Direct Quick Actions Banner */}
      {isZerodha && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-trade-surface to-trade-surface border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-400 shrink-0 text-lg">
              🪁
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>Zerodha Kite Connect v3 Integration Active</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  NSE / BSE Live
                </span>
              </div>
              <p className="text-[11px] text-trade-muted">
                Trade Indian Equities, NIFTY 50 / BANKNIFTY Futures & Options with Kite Connect API.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <a
              href="https://kite.zerodha.com/holdings"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-trade-surface2 hover:bg-trade-surface3 text-trade-text hover:text-white border border-trade-border text-xs flex items-center gap-1.5 transition-all"
            >
              <span>Kite Holdings</span>
              <ExternalLink className="w-3 h-3 text-emerald-400" />
            </a>

            <a
              href="https://kite.trade/docs/connect/v3/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-trade-surface2 hover:bg-trade-surface3 text-trade-text hover:text-white border border-trade-border text-xs flex items-center gap-1.5 transition-all"
            >
              <span>Kite API Docs</span>
              <ExternalLink className="w-3 h-3 text-emerald-400" />
            </a>
          </div>
        </div>
      )}

      {/* Paper Trading Practice Wallet Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-trade-surface to-trade-surface border border-amber-500/40 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md font-num">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center font-bold text-amber-400 shrink-0 text-xl">
            ⚡
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <span>Paper Trading Practice Wallet</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 font-sans">
                VIRTUAL FUNDS
              </span>
            </div>
            <div className="text-[11px] text-trade-muted mt-0.5 font-sans">
              Available Cash: <strong className="text-amber-300 font-num">${formatPrice(paperAccount?.virtualCash ?? 73630)}</strong> • Locked in Trades: <strong className="text-white font-num">${formatPrice(paperAccount?.marginUsed ?? 26370)}</strong> • Total Net Worth: <strong className="text-white font-num">${formatPrice(paperAccount?.totalPortfolioValue ?? 100000)}</strong>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap font-sans">
          <button
            onClick={() => setActivePage('portfolio')}
            className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all cursor-pointer"
          >
            Open Paper Hub
          </button>
          <button
            onClick={() => openTerminalFor('BTC/USDT')}
            className="px-3 py-1.5 rounded-lg bg-trade-primary hover:bg-trade-primaryHover text-white text-xs font-bold transition-all cursor-pointer shadow-glow-primary"
          >
            Practice Trade in Terminal
          </button>
        </div>
      </div>

      {/* Overview Balance Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-num">
        {/* Total Net Worth */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-trade-surface2 to-trade-surface border border-trade-border shadow-card relative overflow-hidden">
          <div className="text-[11px] text-trade-subtle font-sans font-medium uppercase mb-1">
            {isZerodha ? 'Total Portfolio (INR)' : 'Total Net Assets (USD)'}
          </div>
          <div className="text-2xl sm:text-3xl font-black text-trade-text tracking-tight">
            {currencySymbol}{formatPrice(displayTotal)}
          </div>
          <div className="text-xs text-trade-primary font-bold mt-1">
            {isZerodha ? `≈ $${formatPrice(displayTotal / 83.5)} USD` : `≈ ${(displayTotal / 67420).toFixed(4)} BTC`}
          </div>
        </div>

        {/* Available Cash / Spot */}
        <div className="p-5 rounded-2xl bg-trade-surface border border-trade-border shadow-card">
          <div className="text-[11px] text-trade-subtle font-sans font-medium uppercase mb-1">
            {isZerodha ? 'Available Equity Cash' : 'Spot Available Balance'}
          </div>
          <div className="text-2xl font-black text-trade-text tracking-tight">
            {currencySymbol}{formatPrice(unifiedAccount ? unifiedAccount.availableCash : (isZerodha ? 425000 : 94200))}
          </div>
          <div className="text-xs text-trade-subtle font-sans mt-1">
            Margin Utilization: <strong className="text-emerald-400">76.8% (Optimal)</strong>
          </div>
        </div>

        {/* Margin / Derivatives */}
        <div className="p-5 rounded-2xl bg-trade-surface border border-trade-border shadow-card">
          <div className="text-[11px] text-trade-subtle font-sans font-medium uppercase mb-1">
            {isZerodha ? 'F&O Margin Used' : 'Futures & Margin Collateral'}
          </div>
          <div className="text-2xl font-black text-trade-text tracking-tight">
            {currencySymbol}{formatPrice(unifiedAccount ? unifiedAccount.marginUsed : (isZerodha ? 1420600 : 42150.40))}
          </div>
          <div className="text-xs text-trade-subtle font-sans mt-1">
            Status: <strong className="text-emerald-400">No Margin Call (Safe)</strong>
          </div>
        </div>

        {/* 24h P&L */}
        <div className="p-5 rounded-2xl bg-trade-surface border border-trade-border shadow-card">
          <div className="text-[11px] text-trade-subtle font-sans font-medium uppercase mb-1">
            Today's Unrealized P&L
          </div>
          <div className={`text-2xl font-black tracking-tight ${isTodayPos ? 'text-trade-positive' : 'text-trade-negative'}`}>
            {isTodayPos ? '+' : ''}{currencySymbol}{formatPrice(displayTodayPnl)}
          </div>
          <div className={`text-xs font-semibold flex items-center gap-1 mt-1 ${isTodayPos ? 'text-trade-positive' : 'text-trade-negative'}`}>
            {isTodayPos ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            <span>+{displayTodayPnlPct}% Today</span>
          </div>
        </div>
      </div>

      {/* Main Content: Asset Holdings Table + Security Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Holdings Table (8 Cols) */}
        <div className="lg:col-span-8 bg-trade-surface border border-trade-border rounded-2xl overflow-hidden shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 border-b border-trade-border bg-trade-surface2/60">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-trade-primary" />
              <h3 className="text-xs font-bold text-trade-text uppercase tracking-wider">
                {currentBroker?.name} Portfolio Holdings
              </h3>
              {unifiedAccount?.isRealLiveSync && (
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                  LIVE REST API SYNC
                </span>
              )}
            </div>

            <div className="flex items-center bg-trade-surface3 rounded-xl p-0.5 border border-trade-border text-xs">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  activeTab === 'all' ? 'bg-trade-primary text-white shadow-glow-primary' : 'text-trade-muted hover:text-trade-text'
                }`}
              >
                All Holdings
              </button>
              <button
                onClick={() => setActiveTab('spot')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  activeTab === 'spot' ? 'bg-trade-primary text-white shadow-glow-primary' : 'text-trade-muted hover:text-trade-text'
                }`}
              >
                {isZerodha ? 'Equity CNC' : 'Spot'}
              </button>
              <button
                onClick={() => setActiveTab('futures')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  activeTab === 'futures' ? 'bg-trade-primary text-white shadow-glow-primary' : 'text-trade-muted hover:text-trade-text'
                }`}
              >
                {isZerodha ? 'F&O Derivatives' : 'Futures'}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-num">
              <thead>
                <tr className="border-b border-trade-border bg-trade-surface2/70 text-[11px] font-bold text-trade-subtle uppercase tracking-wider font-sans select-none">
                  <th className="py-3 px-4">Instrument</th>
                  <th className="py-3 px-4 text-right">Quantity</th>
                  <th className="py-3 px-4 text-right">Avg Price</th>
                  <th className="py-3 px-4 text-right">LTP / Price</th>
                  <th className="py-3 px-4 text-right">Market Value</th>
                  <th className="py-3 px-4 text-right">P&L Gain</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-trade-border/40">
                {hasUnifiedHoldings ? (
                  unifiedAccount.holdings.map(item => {
                    const isPos = item.unrealizedPnl >= 0;
                    return (
                      <tr key={item.symbol} className="hover:bg-trade-surface2/80 transition-colors group">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-trade-primary/20 text-trade-primary border border-trade-primary/30 flex items-center justify-center font-bold text-xs shrink-0">
                              {item.symbol.slice(0, 3)}
                            </div>
                            <div>
                              <div className="font-bold text-trade-text group-hover:text-trade-primary transition-colors">
                                {item.symbol}
                              </div>
                              <div className="text-[11px] text-trade-subtle font-sans truncate max-w-[130px]">
                                {item.name}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right font-semibold text-trade-text">
                          {item.quantity.toLocaleString()}
                        </td>

                        <td className="py-3.5 px-4 text-right text-trade-subtle">
                          {currencySymbol}{formatPrice(item.avgPrice)}
                        </td>

                        <td className="py-3.5 px-4 text-right font-bold text-trade-text">
                          {currencySymbol}{formatPrice(item.lastPrice)}
                        </td>

                        <td className="py-3.5 px-4 text-right font-black text-trade-text">
                          {currencySymbol}{formatPrice(item.marketValue)}
                        </td>

                        <td className="py-3.5 px-4 text-right font-semibold">
                          <span className={isPos ? 'text-trade-positive' : 'text-trade-negative'}>
                            {isPos ? '+' : ''}{currencySymbol}{formatPrice(item.unrealizedPnl)} ({formatPercent(item.unrealizedPnlPercent)})
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => openTerminalFor(item.symbol)}
                            className="px-2.5 py-1 rounded-lg bg-trade-surface3 hover:bg-trade-primary text-trade-text hover:text-white transition-all text-xs font-semibold font-sans cursor-pointer"
                          >
                            Trade
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  (currentBroker.walletCoins || []).map(coin => {
                    const isCoinPos = coin.change24h >= 0;
                    return (
                      <tr key={coin.coin} className="hover:bg-trade-surface2/80 transition-colors group">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div 
                              className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-white shrink-0"
                              style={{ backgroundColor: coin.iconBg || '#5B8CFF' }}
                            >
                              {coin.coin.slice(0, 3)}
                            </div>
                            <div>
                              <div className="font-bold text-trade-text group-hover:text-trade-primary transition-colors">
                                {coin.coin}
                              </div>
                              <div className="text-[11px] text-trade-subtle font-sans truncate max-w-[120px]">
                                {coin.name}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right font-semibold text-trade-text">
                          {coin.free.toLocaleString()}
                        </td>

                        <td className="py-3.5 px-4 text-right text-trade-subtle">
                          {coin.locked > 0 ? coin.locked.toLocaleString() : '--'}
                        </td>

                        <td className="py-3.5 px-4 text-right font-bold text-trade-text">
                          {coin.total.toLocaleString()}
                        </td>

                        <td className="py-3.5 px-4 text-right font-black text-trade-text">
                          ${formatPrice(coin.usdValue)}
                        </td>

                        <td className="py-3.5 px-4 text-right font-semibold">
                          <span className={isCoinPos ? 'text-trade-positive' : 'text-trade-negative'}>
                            {formatPercent(coin.change24h)}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              const sym = coin.coin.includes('/') ? coin.coin : `${coin.coin}/USDT`;
                              openTerminalFor(sym);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-trade-surface3 hover:bg-trade-primary text-trade-text hover:text-white transition-all text-xs font-semibold font-sans cursor-pointer"
                          >
                            Trade
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

        {/* Right: Exchange Security Matrix & Quick Switcher */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-trade-surface border border-trade-border rounded-2xl p-5 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-trade-border">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-trade-text uppercase tracking-wider">
                  Broker Security Matrix
                </h3>
              </div>
              <Badge variant={unifiedAccount?.isRealLiveSync ? 'positive' : 'live'} size="xs">
                {unifiedAccount?.isRealLiveSync ? 'LIVE SYNC' : 'SECURE'}
              </Badge>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-trade-surface2/60 border border-trade-border/40">
                <span className="text-trade-subtle">Gateway Stream:</span>
                <span className="font-semibold text-emerald-400">● Active Sub-15ms</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-trade-surface2/60 border border-trade-border/40">
                <span className="text-trade-subtle">API Authentication:</span>
                <span className="font-semibold text-trade-text">
                  {unifiedAccount?.isRealLiveSync ? (unifiedAccount.maskedApiKey || 'Authenticated') : 'Ready to Connect'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-trade-surface2/60 border border-trade-border/40">
                <span className="text-trade-subtle">Withdrawals:</span>
                <span className="font-semibold text-red-400">Disabled (Zero Trust)</span>
              </div>
            </div>

            <button
              onClick={() => setIsConnectModalOpen(true)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-trade-primary to-blue-500 hover:from-blue-500 hover:to-trade-primary text-white font-bold text-xs flex items-center justify-center gap-2 shadow-glow-primary transition-all cursor-pointer"
            >
              <Key className="w-4 h-4" />
              <span>Connect / Update {currentBroker.name} API</span>
            </button>
          </div>

          {/* Quick Switcher */}
          <div className="bg-trade-surface border border-trade-border rounded-2xl p-5 shadow-card space-y-3">
            <h3 className="text-xs font-bold text-trade-subtle uppercase tracking-wider">
              Other Gateways
            </h3>

            <div className="space-y-1.5 text-xs">
              {(brokersList || []).filter(b => b.id !== activeBroker).slice(0, 5).map(b => (
                <button
                  key={b.id}
                  onClick={() => setActiveBrokerId(b.id)}
                  className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-trade-surface2 border border-transparent hover:border-trade-border transition-all text-left group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">
                      {b.id === 'zerodha' ? '🪁' :
                       b.id === 'coinbase' ? '🔵' :
                       b.id === 'interactive_brokers' ? '🏛️' :
                       b.id === 'metatrader' ? '📈' :
                       b.id === 'binance' ? '🔶' : '⚡'}
                    </span>
                    <span className="font-semibold text-trade-text group-hover:text-trade-primary transition-colors">
                      {b.name}
                    </span>
                  </div>
                  <span className="font-num text-trade-muted group-hover:text-trade-text">
                    {b.id === 'zerodha' ? '₹18.45L' : `$${formatPrice(b.totalBalanceUsd)}`}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Universal Broker Connect Modal */}
      {isConnectModalOpen && (
        <BrokerConnectModal
          broker={currentBroker}
          isOpen={isConnectModalOpen}
          onClose={() => setIsConnectModalOpen(false)}
          onSuccess={handleConnectSuccess}
        />
      )}

      {/* Deposit Modal */}
      {isDepositModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-md bg-trade-surface border border-trade-border rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-trade-border">
              <h3 className="font-bold text-sm text-trade-text">{currentBroker.name} Add / Credit Funds</h3>
              <button onClick={() => setIsDepositModalOpen(false)} className="text-trade-muted hover:text-trade-text">✕</button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-trade-subtle font-medium mb-1">
                  {isZerodha ? 'Add INR Margin (UPI / NetBanking Demo)' : 'Asset to Credit (Demo)'}
                </label>
                <select className="w-full px-3 py-2 rounded-xl bg-trade-surface2 border border-trade-border text-trade-text">
                  {isZerodha ? (
                    <>
                      <option>₹1,00,000 INR (Equity Margin)</option>
                      <option>₹5,00,000 INR (F&O Margin)</option>
                    </>
                  ) : (
                    <>
                      <option>10,000 USDT (Tether Demo)</option>
                      <option>0.25 BTC (Bitcoin Demo)</option>
                    </>
                  )}
                </select>
              </div>
              <button
                onClick={() => handleSimulatedAction(`Simulated funds credited to ${currentBroker.name} account.`)}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-glow-positive transition-all"
              >
                Confirm Credit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-md bg-trade-surface border border-trade-border rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-trade-border">
              <h3 className="font-bold text-sm text-trade-text">Internal Margin Allocation</h3>
              <button onClick={() => setIsTransferModalOpen(false)} className="text-trade-muted hover:text-trade-text">✕</button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-trade-subtle font-medium mb-1">From</label>
                <div className="p-2.5 rounded-xl bg-trade-surface2 border border-trade-border text-trade-text font-semibold">
                  {isZerodha ? 'Equity Margin (Cash)' : 'Spot Available Wallet'}
                </div>
              </div>
              <div>
                <label className="block text-trade-subtle font-medium mb-1">To</label>
                <div className="p-2.5 rounded-xl bg-trade-surface2 border border-trade-border text-trade-text font-semibold">
                  {isZerodha ? 'F&O Derivatives Collateral' : 'Futures Margin Collateral'}
                </div>
              </div>
              <button
                onClick={() => handleSimulatedAction('Internal margin reallocation complete.')}
                className="w-full py-2.5 rounded-xl bg-trade-primary hover:bg-trade-primaryHover text-white font-bold shadow-glow-primary transition-all"
              >
                Confirm Allocation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
