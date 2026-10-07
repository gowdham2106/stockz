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
  Sliders, 
  Globe, 
  Zap, 
  ExternalLink,
  ChevronRight,
  ArrowRightLeft,
  Key,
  Eye,
  EyeOff,
  Server
} from 'lucide-react';
import { useMarket } from '../context/MarketContext';
import { Badge } from '../components/common/Badge';
import { formatPrice, formatPercent } from '../utils/formatters';
import { api } from '../services/api';
import { BinanceAccountSummary } from '../types/market';

export const BrokerWalletPage: React.FC = () => {
  const { 
    activeBroker, 
    brokersList, 
    setActiveBrokerId, 
    openTerminalFor,
    setActivePage 
  } = useMarket();

  const [activeTab, setActiveTab] = useState<'all' | 'spot' | 'futures' | 'funding'>('all');
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isApiConnectModalOpen, setIsApiConnectModalOpen] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');
  const [actionErrorMsg, setActionErrorMsg] = useState('');

  // Live Binance credentials state
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [secretKeyInput, setSecretKeyInput] = useState('');
  const [isTestnet, setIsTestnet] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [isConnectingApi, setIsConnectingApi] = useState(false);
  const [liveBinanceData, setLiveBinanceData] = useState<BinanceAccountSummary | null>(null);

  const currentBroker = (brokersList || []).find(b => b.id === activeBroker) || brokersList?.[0] || {
    id: 'binance',
    name: 'Binance Pro',
    category: 'Crypto & Derivatives',
    tagline: 'Institutional Spot & USDⓈ-M Futures Gateway',
    logoType: 'binance',
    badge: 'DIRECT WS STREAM',
    accentColor: '#F0B90B',
    status: 'CONNECTED',
    latency: '<15ms',
    accountId: 'BINANCE-VIP-8892',
    accountType: 'Multi-Asset Cross Margin',
    vipLevel: 'VIP Tier 3 (0.012% Maker)',
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

  const isBinance = currentBroker?.id === 'binance';

  // Fetch initial Binance live data from backend
  useEffect(() => {
    if (isBinance) {
      api.getBinanceAccount()
        .then(data => {
          if (data && data.isConnected) {
            setLiveBinanceData(data);
          }
        })
        .catch(err => {
          console.warn('Binance default fetch note:', err);
        });
    }
  }, [isBinance]);

  const handleConnectLiveBinance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim() || !secretKeyInput.trim()) {
      setActionErrorMsg('Please enter both Binance API Key and Secret Key.');
      return;
    }

    try {
      setIsConnectingApi(true);
      setActionErrorMsg('');
      const data = await api.connectBinanceAccount(apiKeyInput.trim(), secretKeyInput.trim(), isTestnet);
      setLiveBinanceData(data);
      setIsApiConnectModalOpen(false);
      setActionSuccessMsg('Successfully connected and synced with your Live Binance Account!');
      setTimeout(() => setActionSuccessMsg(''), 5000);
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Failed to authenticate with Binance API. Please check your credentials and IP permissions.');
    } finally {
      setIsConnectingApi(false);
    }
  };

  const handleSimulatedAction = (msg: string) => {
    setActionSuccessMsg(msg);
    setIsDepositModalOpen(false);
    setIsTransferModalOpen(false);
    setTimeout(() => setActionSuccessMsg(''), 4000);
  };

  // Determine active balances (live synced vs default)
  const displayTotalUsd = (isBinance && liveBinanceData?.isRealLiveSync) 
    ? liveBinanceData.totalBalanceUsd 
    : (currentBroker?.totalBalanceUsd || 148650);

  const displayTotalBtc = (isBinance && liveBinanceData?.isRealLiveSync) 
    ? liveBinanceData.totalBalanceBtc 
    : (currentBroker?.totalBalanceBtc || 2.2048);

  const displaySpotBalance = (isBinance && liveBinanceData?.isRealLiveSync) 
    ? liveBinanceData.spotBalanceUsd 
    : (currentBroker?.spotBalance || 94200);

  const displayFuturesBalance = (isBinance && liveBinanceData?.isRealLiveSync) 
    ? liveBinanceData.futuresEstimatedUsd 
    : (currentBroker?.futuresBalance || 42150.40);

  const displayTodayPnl = (isBinance && liveBinanceData?.isRealLiveSync) 
    ? liveBinanceData.todayPnlUsd 
    : (currentBroker?.todayPnl || 3410.20);

  const displayTodayPnlPct = (isBinance && liveBinanceData?.isRealLiveSync) 
    ? liveBinanceData.todayPnlPercent 
    : (currentBroker?.todayPnlPercent || 2.35);

  const displayCoins = (isBinance && liveBinanceData?.isRealLiveSync && liveBinanceData.balances?.length > 0)
    ? liveBinanceData.balances.map(b => ({
        coin: b.asset,
        name: b.name,
        free: b.free,
        locked: b.locked,
        total: b.total,
        usdValue: b.estimatedUsdValue,
        change24h: b.change24h,
        iconBg: b.iconBg
      }))
    : (currentBroker?.walletCoins || []);

  const isTodayPos = displayTodayPnl >= 0;

  return (
    <div className="p-3 md:p-6 lg:p-8 space-y-6 max-w-[1720px] mx-auto select-none">
      {/* Top Breadcrumb & Actions Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-trade-surface border border-trade-border p-4 md:p-5 rounded-2xl shadow-card">
        <div className="flex items-center gap-3.5">
          <div 
            className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-2xl border border-trade-border shadow-inner shrink-0"
            style={{ backgroundColor: `${currentBroker?.accentColor || '#F0B90B'}20`, color: currentBroker?.accentColor || '#F0B90B' }}
          >
            {isBinance ? '🔶' :
             currentBroker?.id === 'coinbase' ? '🔵' :
             currentBroker?.id === 'interactive_brokers' ? '🏛️' :
             currentBroker?.id === 'zerodha' ? '🪁' :
             currentBroker?.id === 'robinhood' ? '🪶' : '⚡'}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl md:text-2xl font-display font-extrabold text-white tracking-tight">
                {currentBroker?.name || 'Binance Pro'} Wallet & Account
              </h1>
              <Badge variant={liveBinanceData?.isRealLiveSync ? 'positive' : 'live'} size="sm" pulse>
                {liveBinanceData?.isRealLiveSync ? 'REAL LIVE SYNC' : (currentBroker?.status || 'CONNECTED')}
              </Badge>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-trade-surface3 border border-trade-border text-trade-subtle">
                {liveBinanceData?.isRealLiveSync ? (liveBinanceData.maskedApiKey || 'LIVE-KEY') : (currentBroker?.accountId || 'BINANCE-VIP')}
              </span>
            </div>
            <p className="text-xs text-trade-muted mt-0.5">
              {currentBroker?.accountType || 'Multi-Asset Cross Margin'} • {currentBroker?.vipLevel || 'VIP Tier'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {isBinance && (
            <>
              {/* Connect Real Binance API Button */}
              <button
                onClick={() => setIsApiConnectModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-amber-200 text-xs font-bold border border-amber-500/40 flex items-center gap-1.5 shadow-sm transition-all"
                title="Connect real Binance API Key to sync live balances"
              >
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>{liveBinanceData?.isRealLiveSync ? 'API Synced' : 'Sync Live Binance API'}</span>
              </button>

              {/* Direct Redirect to Official Binance Account */}
              <a
                href="https://accounts.binance.com/en/login"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-glow-primary transition-all cursor-pointer"
                title="Open official Binance.com login/dashboard in a new window"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Binance.com</span>
              </a>
            </>
          )}

          <button
            onClick={() => setIsTransferModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-trade-surface2 hover:bg-trade-surface3 text-trade-text text-xs font-semibold border border-trade-border flex items-center gap-1.5 transition-all"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-trade-primary" />
            <span>Transfer</span>
          </button>

          <button
            onClick={() => setIsDepositModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-trade-surface2 hover:bg-trade-surface3 text-trade-text text-xs font-semibold border border-trade-border flex items-center gap-1.5 transition-all"
          >
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
            <span>Deposit</span>
          </button>

          <button
            onClick={() => setActivePage('landing')}
            className="px-3.5 py-2 rounded-xl bg-trade-surface3 hover:bg-trade-surface2 text-trade-muted hover:text-trade-text text-xs font-medium border border-trade-border transition-all"
          >
            <span>Switch Broker</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {actionSuccessMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in zoom-in-95">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">{actionSuccessMsg}</span>
        </div>
      )}

      {/* Official Binance Direct Links Quick Hub Banner */}
      {isBinance && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-trade-surface to-trade-surface border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center font-bold text-amber-400 shrink-0">
              🔶
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>Official Binance.com Account Links</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Direct Verified
                </span>
              </div>
              <p className="text-[11px] text-trade-muted">
                Navigate directly to your live Binance account wallet, API management, or trade execution.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <a
              href="https://www.binance.com/en/my/wallet/account/main"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-trade-surface2 hover:bg-trade-surface3 text-trade-text hover:text-white border border-trade-border text-xs flex items-center gap-1.5 transition-all"
            >
              <span>Spot & Futures Wallet</span>
              <ExternalLink className="w-3 h-3 text-amber-400" />
            </a>

            <a
              href="https://www.binance.com/en/my/settings/api-management"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-trade-surface2 hover:bg-trade-surface3 text-trade-text hover:text-white border border-trade-border text-xs flex items-center gap-1.5 transition-all"
            >
              <span>API Key Manager</span>
              <ExternalLink className="w-3 h-3 text-amber-400" />
            </a>

            <a
              href="https://www.binance.com/en/trade/BTC_USDT"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-trade-surface2 hover:bg-trade-surface3 text-trade-text hover:text-white border border-trade-border text-xs flex items-center gap-1.5 transition-all"
            >
              <span>Binance Pro Trade</span>
              <ExternalLink className="w-3 h-3 text-amber-400" />
            </a>
          </div>
        </div>
      )}

      {/* Overview Balance Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-num">
        {/* Total Estimated Balance */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-trade-surface2 to-trade-surface border border-trade-border shadow-card relative overflow-hidden">
          <div className="text-[11px] text-trade-subtle font-sans font-medium uppercase mb-1">
            Total Estimated Net Worth
          </div>
          <div className="text-2xl sm:text-3xl font-black text-trade-text tracking-tight">
            ${formatPrice(displayTotalUsd)}
          </div>
          <div className="text-xs text-trade-primary font-bold mt-1">
            ≈ {displayTotalBtc} BTC
          </div>
        </div>

        {/* Spot Account */}
        <div className="p-5 rounded-2xl bg-trade-surface border border-trade-border shadow-card">
          <div className="text-[11px] text-trade-subtle font-sans font-medium uppercase mb-1">
            Spot Account Balance
          </div>
          <div className="text-2xl font-black text-trade-text tracking-tight">
            ${formatPrice(displaySpotBalance)}
          </div>
          <div className="text-xs text-trade-subtle font-sans mt-1">
            Free Available: <strong className="text-emerald-400">${formatPrice(displaySpotBalance * 0.92)}</strong>
          </div>
        </div>

        {/* Futures / Margin Account */}
        <div className="p-5 rounded-2xl bg-trade-surface border border-trade-border shadow-card">
          <div className="text-[11px] text-trade-subtle font-sans font-medium uppercase mb-1">
            USD-M Futures & Margin Balance
          </div>
          <div className="text-2xl font-black text-trade-text tracking-tight">
            ${formatPrice(displayFuturesBalance)}
          </div>
          <div className="text-xs text-trade-subtle font-sans mt-1">
            Margin Maintenance Ratio: <strong className="text-emerald-400">1.8% (Safe)</strong>
          </div>
        </div>

        {/* 24h P&L */}
        <div className="p-5 rounded-2xl bg-trade-surface border border-trade-border shadow-card">
          <div className="text-[11px] text-trade-subtle font-sans font-medium uppercase mb-1">
            Today's 24h Unrealized P&L
          </div>
          <div className={`text-2xl font-black tracking-tight ${isTodayPos ? 'text-trade-positive' : 'text-trade-negative'}`}>
            {isTodayPos ? '+' : ''}${formatPrice(displayTodayPnl)}
          </div>
          <div className={`text-xs font-semibold flex items-center gap-1 mt-1 ${isTodayPos ? 'text-trade-positive' : 'text-trade-negative'}`}>
            {isTodayPos ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            <span>+{displayTodayPnlPct}% Today</span>
          </div>
        </div>
      </div>

      {/* Main Breakdown Grid: Coin Holdings + API Security Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Asset / Coin Holdings Table (8 Cols) */}
        <div className="lg:col-span-8 bg-trade-surface border border-trade-border rounded-2xl overflow-hidden shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 border-b border-trade-border bg-trade-surface2/60">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-trade-primary" />
              <h3 className="text-xs font-bold text-trade-text uppercase tracking-wider">
                {currentBroker?.name || 'Binance'} Asset Holdings
              </h3>
              {liveBinanceData?.isRealLiveSync && (
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
                All Balances
              </button>
              <button
                onClick={() => setActiveTab('spot')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  activeTab === 'spot' ? 'bg-trade-primary text-white shadow-glow-primary' : 'text-trade-muted hover:text-trade-text'
                }`}
              >
                Spot
              </button>
              <button
                onClick={() => setActiveTab('futures')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  activeTab === 'futures' ? 'bg-trade-primary text-white shadow-glow-primary' : 'text-trade-muted hover:text-trade-text'
                }`}
              >
                Futures
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-num">
              <thead>
                <tr className="border-b border-trade-border bg-trade-surface2/70 text-[11px] font-bold text-trade-subtle uppercase tracking-wider font-sans select-none">
                  <th className="py-3 px-4">Asset / Coin</th>
                  <th className="py-3 px-4 text-right">Free Available</th>
                  <th className="py-3 px-4 text-right">Locked in Orders</th>
                  <th className="py-3 px-4 text-right">Total Balance</th>
                  <th className="py-3 px-4 text-right">Est. USD Value</th>
                  <th className="py-3 px-4 text-right">24h Gain</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-trade-border/40">
                {displayCoins.map(coin => {
                  const isCoinPos = coin.change24h >= 0;

                  return (
                    <tr
                      key={coin.coin}
                      className="hover:bg-trade-surface2/80 transition-colors group"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div 
                            className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-sm"
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
                          className="px-2.5 py-1 rounded-lg bg-trade-surface3 hover:bg-trade-primary text-trade-text hover:text-white transition-all text-xs font-semibold font-sans"
                        >
                          Trade
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: API Security Status & Key Matrix (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Security & API Status Card */}
          <div className="bg-trade-surface border border-trade-border rounded-2xl p-5 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-trade-border">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-trade-text uppercase tracking-wider">
                  Exchange Security Matrix
                </h3>
              </div>
              <Badge variant={liveBinanceData?.isRealLiveSync ? 'positive' : 'live'} size="xs">
                {liveBinanceData?.isRealLiveSync ? 'LIVE SYNC' : 'SECURE'}
              </Badge>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-trade-surface2/60 border border-trade-border/40">
                <span className="text-trade-subtle">Binance WebSocket:</span>
                <span className="font-semibold text-emerald-400">● Active Sub-15ms</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-trade-surface2/60 border border-trade-border/40">
                <span className="text-trade-subtle">Account Sync:</span>
                <span className="font-semibold text-trade-text">
                  {liveBinanceData?.isRealLiveSync ? 'HMAC-SHA256 Authenticated' : 'Ready to Connect'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-trade-surface2/60 border border-trade-border/40">
                <span className="text-trade-subtle">Withdrawal Privileges:</span>
                <span className="font-semibold text-red-400">Disabled (Safest Policy)</span>
              </div>
            </div>

            {/* Pro Terminal Launch Button */}
            <button
              onClick={() => openTerminalFor('BTC/USDT')}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-trade-primary to-blue-500 hover:from-blue-500 hover:to-trade-primary text-white font-bold text-xs flex items-center justify-center gap-2 shadow-glow-primary transition-all"
            >
              <Zap className="w-4 h-4" />
              <span>Launch Live BTC/USDT Terminal</span>
            </button>
          </div>

          {/* Quick Switcher to Other Brokers */}
          <div className="bg-trade-surface border border-trade-border rounded-2xl p-5 shadow-card space-y-3">
            <h3 className="text-xs font-bold text-trade-subtle uppercase tracking-wider">
              Other Connected Gateways
            </h3>

            <div className="space-y-1.5 text-xs">
              {(brokersList || []).filter(b => b.id !== activeBroker).slice(0, 4).map(b => (
                <button
                  key={b.id}
                  onClick={() => setActiveBrokerId(b.id)}
                  className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-trade-surface2 border border-transparent hover:border-trade-border transition-all text-left group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">
                      {b.id === 'coinbase' ? '🔵' :
                       b.id === 'interactive_brokers' ? '🏛️' :
                       b.id === 'zerodha' ? '🪁' :
                       b.id === 'robinhood' ? '🪶' : '⚡'}
                    </span>
                    <span className="font-semibold text-trade-text group-hover:text-trade-primary transition-colors">
                      {b.name}
                    </span>
                  </div>
                  <span className="font-num text-trade-muted group-hover:text-trade-text">
                    ${formatPrice(b.totalBalanceUsd)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Connect Real Live Binance API Credentials */}
      {isApiConnectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-trade-surface border border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-trade-border">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
                  🔶
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Connect Real Live Binance Account</h3>
                  <p className="text-[11px] text-trade-muted">HMAC-SHA256 Encrypted REST API</p>
                </div>
              </div>
              <button 
                onClick={() => setIsApiConnectModalOpen(false)}
                className="text-trade-muted hover:text-white text-lg p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200 leading-relaxed space-y-1">
              <p className="font-semibold">🔒 Security & Safety Guidelines:</p>
              <ul className="list-disc list-inside text-[11px] text-amber-300/90 space-y-0.5">
                <li>Create an API key in your Binance account with <strong>"Enable Reading"</strong> only.</li>
                <li><strong>NEVER</strong> enable "Enable Withdrawals".</li>
                <li>Your keys are processed securely via HMAC signature.</li>
              </ul>
            </div>

            {actionErrorMsg && (
              <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{actionErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleConnectLiveBinance} className="space-y-4 text-xs">
              <div>
                <label className="block text-trade-text font-semibold mb-1">Binance API Key</label>
                <input
                  type="text"
                  required
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="e.g. vmPUKLavsf... (from Binance API Management)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-trade-surface2 border border-trade-border text-white font-mono placeholder:text-trade-subtle/50 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-trade-text font-semibold mb-1">Binance Secret Key</label>
                <div className="relative">
                  <input
                    type={showSecret ? "text" : "password"}
                    required
                    value={secretKeyInput}
                    onChange={(e) => setSecretKeyInput(e.target.value)}
                    placeholder="e.g. 5x7f9a... (Secret Key)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-trade-surface2 border border-trade-border text-white font-mono placeholder:text-trade-subtle/50 pr-10 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-trade-muted hover:text-white"
                  >
                    {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-trade-surface2 border border-trade-border">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-trade-muted" />
                  <span className="text-trade-text font-medium">Environment</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsTestnet(false)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${!isTestnet ? 'bg-amber-500 text-slate-950' : 'text-trade-muted'}`}
                  >
                    Mainnet (Real)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsTestnet(true)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${isTestnet ? 'bg-trade-primary text-white' : 'text-trade-muted'}`}
                  >
                    Testnet
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isConnectingApi}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-glow-primary disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isConnectingApi ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Authenticating with Binance...</span>
                    </>
                  ) : (
                    <>
                      <Key className="w-4 h-4" />
                      <span>Connect & Sync Real Wallet</span>
                    </>
                  )}
                </button>

                <a
                  href="https://www.binance.com/en/my/settings/api-management"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-3 rounded-xl bg-trade-surface2 hover:bg-trade-surface3 text-trade-muted hover:text-white border border-trade-border font-medium text-xs flex items-center gap-1.5 transition-all"
                >
                  <span>Get API Key</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Simulated Deposit Modal */}
      {isDepositModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-md bg-trade-surface border border-trade-border rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-trade-border">
              <h3 className="font-bold text-sm text-trade-text">{currentBroker?.name || 'Exchange'} Deposit</h3>
              <button onClick={() => setIsDepositModalOpen(false)} className="text-trade-muted hover:text-trade-text">✕</button>
            </div>
            <div className="p-3 rounded-xl bg-trade-surface2 border border-trade-border text-center space-y-2">
              <div className="w-28 h-28 mx-auto bg-white rounded-xl p-2 flex items-center justify-center text-slate-900 font-bold text-xs">
                QR CODE DEMO
              </div>
              <p className="text-[11px] font-mono text-trade-subtle break-all">
                0x71C...8492 (USDT TRC20 / ERC20)
              </p>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-trade-subtle font-medium mb-1">Asset to Credit</label>
                <select className="w-full px-3 py-2 rounded-xl bg-trade-surface2 border border-trade-border text-trade-text">
                  <option>10,000 USDT (Tether Demo)</option>
                  <option>0.25 BTC (Bitcoin Demo)</option>
                  <option>2.50 ETH (Ethereum Demo)</option>
                </select>
              </div>
              <button
                onClick={() => handleSimulatedAction('Simulated 10,000 USDT deposit credited to Spot Wallet.')}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-glow-positive transition-all"
              >
                Confirm Deposit Credit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simulated Transfer Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-md bg-trade-surface border border-trade-border rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-trade-border">
              <h3 className="font-bold text-sm text-trade-text">Internal Sub-Account Transfer</h3>
              <button onClick={() => setIsTransferModalOpen(false)} className="text-trade-muted hover:text-trade-text">✕</button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-trade-subtle font-medium mb-1">From</label>
                <div className="p-2.5 rounded-xl bg-trade-surface2 border border-trade-border text-trade-text font-semibold">
                  Spot Wallet (${formatPrice(displaySpotBalance)})
                </div>
              </div>
              <div>
                <label className="block text-trade-subtle font-medium mb-1">To</label>
                <div className="p-2.5 rounded-xl bg-trade-surface2 border border-trade-border text-trade-text font-semibold">
                  USD-M Futures Margin Account (${formatPrice(displayFuturesBalance)})
                </div>
              </div>
              <div>
                <label className="block text-trade-subtle font-medium mb-1">Transfer Amount (USDT)</label>
                <input
                  type="number"
                  defaultValue={5000}
                  className="w-full px-3 py-2 rounded-xl bg-trade-surface2 border border-trade-border text-trade-text font-num"
                />
              </div>
              <button
                onClick={() => handleSimulatedAction('Transferred 5,000 USDT from Spot to USD-M Futures Margin.')}
                className="w-full py-2.5 rounded-xl bg-trade-primary hover:bg-trade-primaryHover text-white font-bold shadow-glow-primary transition-all"
              >
                Execute Internal Transfer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
