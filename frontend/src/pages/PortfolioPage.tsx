import React, { useEffect, useState } from 'react';
import { 
  PieChart, 
  TrendingUp, 
  TrendingDown, 
  ShieldAlert, 
  Wallet, 
  DollarSign, 
  Layers, 
  ArrowUpRight,
  Sparkles,
  RotateCcw,
  Zap,
  CheckCircle2,
  AlertCircle,
  XCircle,
  PlusCircle,
  Clock,
  ChevronRight,
  Percent,
  Target,
  RefreshCw,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { useMarket } from '../context/MarketContext';
import { PaperAccountSummary, PaperPosition, PaperOrder } from '../types/market';
import { api } from '../services/api';
import { Badge } from '../components/common/Badge';
import { formatPrice, formatPercent } from '../utils/formatters';

export const PortfolioPage: React.FC = () => {
  const { openTerminalFor, setActivePage, paperAccount, refreshPaperAccount } = useMarket();
  const [activeTab, setActiveTab] = useState<'positions' | 'orders' | 'history'>('positions');
  const [actionNotice, setActionNotice] = useState<string>('');
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);

  useEffect(() => {
    refreshPaperAccount();
    const interval = setInterval(refreshPaperAccount, 1500);
    return () => clearInterval(interval);
  }, [refreshPaperAccount]);

  const handleClosePosition = async (positionId: string, symbol: string) => {
    try {
      setIsActionLoading(true);
      await api.closePaperPosition(positionId);
      await refreshPaperAccount();
      setActionNotice(`Closed position on ${symbol}. Realized P&L credited to virtual cash.`);
      setTimeout(() => setActionNotice(''), 4000);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string, symbol: string) => {
    try {
      setIsActionLoading(true);
      await api.cancelPaperOrder(orderId);
      await refreshPaperAccount();
      setActionNotice(`Cancelled open order for ${symbol}. Reserved margin refunded.`);
      setTimeout(() => setActionNotice(''), 4000);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleResetSimulator = async () => {
    if (window.confirm('Reset virtual paper trading balance back to $100,000 USD?')) {
      setIsActionLoading(true);
      await api.resetPaperAccount(100000);
      await refreshPaperAccount();
      setActionNotice('Practice portfolio reset to $100,000 virtual balance.');
      setTimeout(() => setActionNotice(''), 4000);
      setIsActionLoading(false);
    }
  };

  const handleDepositFunds = async () => {
    setIsActionLoading(true);
    await api.depositPaperFunds(25000);
    await refreshPaperAccount();
    setActionNotice('Deposited +$25,000 virtual trading liquidity.');
    setTimeout(() => setActionNotice(''), 4000);
    setIsActionLoading(false);
  };

  const paperData = paperAccount || {
    virtualCash: 73630,
    totalPortfolioValue: 100000,
    marginUsed: 26370,
    unrealizedPnl: 2300,
    realizedPnl: 4820.50,
    totalTrades: 5,
    winningTrades: 4,
    winRate: 80,
    positions: [],
    openOrders: [],
    tradeHistory: []
  };

  const isUnrealizedPos = paperData.unrealizedPnl >= 0;
  const isRealizedPos = paperData.realizedPnl >= 0;

  return (
    <div className="p-3 md:p-6 lg:p-8 space-y-6 max-w-[1720px] mx-auto select-none">
      {/* Top Banner & Mode Watermark */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-trade-surface to-trade-surface border border-amber-500/40 shadow-card">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-2xl shrink-0">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-black text-xl text-white">
                Paper Trading Practice Account
              </h1>
              <Badge variant="demo" size="sm" pulse>
                SIMULATION MODE
              </Badge>
            </div>
            <p className="text-xs text-trade-muted mt-0.5">
              Zero-risk simulated environment with live WebSocket prices, automatic Stop Loss execution, and instant margin accounting.
            </p>
          </div>
        </div>

        {/* Quick Management Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleDepositFunds}
            disabled={isActionLoading}
            className="px-3.5 py-2 rounded-xl bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 font-bold text-xs border border-emerald-500/40 flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>+$25k Virtual Funds</span>
          </button>

          <button
            onClick={handleResetSimulator}
            disabled={isActionLoading}
            className="px-3.5 py-2 rounded-xl bg-trade-surface2 hover:bg-trade-surface3 text-trade-muted hover:text-white font-semibold text-xs border border-trade-border flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Reset ($100k)</span>
          </button>

          <button
            onClick={() => setActivePage('terminal')}
            className="px-4 py-2 rounded-xl bg-trade-primary hover:bg-trade-primaryHover text-white font-bold text-xs flex items-center gap-1.5 shadow-glow-primary transition-all cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Trade in Terminal</span>
          </button>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in zoom-in-95">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">{actionNotice}</span>
        </div>
      )}

      {/* Overview Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-num">
        {/* Available Virtual Cash (The wallet amount) */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-950/20 via-trade-surface2 to-trade-surface border border-amber-500/30 shadow-card relative overflow-hidden">
          <div className="flex items-center justify-between text-[11px] text-amber-400 font-sans font-bold uppercase mb-1">
            <span>Available Virtual Cash</span>
            <Wallet className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-300 tracking-tight">
            ${formatPrice(paperData.virtualCash)}
          </div>
          <div className="text-xs text-trade-muted font-sans mt-1">
            Ready to deploy in new trades
          </div>
        </div>

        {/* Total Virtual Portfolio Net Worth */}
        <div className="p-5 rounded-2xl bg-trade-surface border border-trade-border shadow-card">
          <div className="text-[11px] text-trade-subtle font-sans font-medium uppercase mb-1">
            Total Virtual Net Worth
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            ${formatPrice(paperData.totalPortfolioValue)}
          </div>
          <div className="text-xs text-trade-subtle font-sans mt-1">
            Margin in Trades: <strong className="text-amber-400">${formatPrice(paperData.marginUsed)}</strong>
          </div>
        </div>

        {/* Live Unrealized P&L */}
        <div className="p-5 rounded-2xl bg-trade-surface border border-trade-border shadow-card">
          <div className="text-[11px] text-trade-subtle font-sans font-medium uppercase mb-1">
            Open Positions Unrealized P&L
          </div>
          <div className={`text-2xl font-black tracking-tight ${isUnrealizedPos ? 'text-trade-positive' : 'text-trade-negative'}`}>
            {isUnrealizedPos ? '+' : ''}${formatPrice(paperData.unrealizedPnl)}
          </div>
          <div className={`text-xs font-semibold flex items-center gap-1 mt-1 ${isUnrealizedPos ? 'text-trade-positive' : 'text-trade-negative'}`}>
            {isUnrealizedPos ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            <span>All open positions active</span>
          </div>
        </div>

        {/* Realized Profit & Win Rate */}
        <div className="p-5 rounded-2xl bg-trade-surface border border-trade-border shadow-card">
          <div className="text-[11px] text-trade-subtle font-sans font-medium uppercase mb-1">
            All-Time Realized Profit
          </div>
          <div className={`text-2xl font-black tracking-tight ${isRealizedPos ? 'text-trade-positive' : 'text-trade-negative'}`}>
            {isRealizedPos ? '+' : ''}${formatPrice(paperData.realizedPnl)}
          </div>
          <div className="text-xs text-trade-subtle font-sans mt-1 flex items-center justify-between">
            <span>Trades: <strong className="text-white">{paperData.totalTrades}</strong></span>
            <span className="text-emerald-400 font-bold">{paperData.winRate.toFixed(1)}% Win Rate</span>
          </div>
        </div>
      </div>

      {/* Main Tabs Container: Active Positions | Open Orders | Trade History */}
      <div className="bg-trade-surface border border-trade-border rounded-2xl overflow-hidden shadow-card">
        {/* Tab Switcher Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-b border-trade-border bg-trade-surface2/60">
          <div className="flex items-center gap-1.5 bg-trade-surface3 p-1 rounded-xl border border-trade-border text-xs">
            <button
              onClick={() => setActiveTab('positions')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'positions'
                  ? 'bg-trade-primary text-white shadow-glow-primary'
                  : 'text-trade-muted hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Active Positions ({paperData.positions.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'orders'
                  ? 'bg-trade-primary text-white shadow-glow-primary'
                  : 'text-trade-muted hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Open Limit Orders ({paperData.openOrders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-trade-primary text-white shadow-glow-primary'
                  : 'text-trade-muted hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Trade History ({paperData.tradeHistory.length})</span>
            </button>
          </div>

          <div className="text-xs text-trade-subtle font-sans flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Auto Stop-Loss & Take-Profit Active</span>
          </div>
        </div>

        {/* Tab 1: Active Open Positions */}
        {activeTab === 'positions' && (
          <div className="overflow-x-auto">
            {paperData.positions.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Zap className="w-10 h-10 mx-auto text-trade-subtle opacity-50" />
                <h3 className="font-bold text-sm text-white">No Open Positions</h3>
                <p className="text-xs text-trade-muted max-w-sm mx-auto">
                  Place an order with Stop Loss or Take Profit in the terminal to practice risk-managed trading.
                </p>
                <button
                  onClick={() => openTerminalFor('BTC/USDT')}
                  className="px-4 py-2 rounded-xl bg-trade-primary text-white font-bold text-xs shadow-glow-primary cursor-pointer"
                >
                  Trade BTC/USDT in Terminal
                </button>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs font-num">
                <thead>
                  <tr className="border-b border-trade-border bg-trade-surface2/70 text-[11px] font-bold text-trade-subtle uppercase tracking-wider font-sans select-none">
                    <th className="py-3 px-4">Instrument</th>
                    <th className="py-3 px-4">Side / Lev</th>
                    <th className="py-3 px-4 text-right">Quantity</th>
                    <th className="py-3 px-4 text-right">Entry Price</th>
                    <th className="py-3 px-4 text-right">Current Price</th>
                    <th className="py-3 px-4 text-right">Margin Deducted</th>
                    <th className="py-3 px-4 text-right">Unrealized P&L</th>
                    <th className="py-3 px-4 text-center">Stop Loss Protection</th>
                    <th className="py-3 px-4 text-center">Take Profit</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-trade-border/40">
                  {paperData.positions.map(pos => {
                    const isPos = pos.unrealizedPnl >= 0;
                    const slDist = pos.stopLoss ? ((pos.currentPrice - pos.stopLoss) / pos.currentPrice * 100) : null;
                    const tpDist = pos.takeProfit ? ((pos.takeProfit - pos.currentPrice) / pos.currentPrice * 100) : null;

                    return (
                      <tr key={pos.id} className="hover:bg-trade-surface2/80 transition-colors group">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-trade-primary/20 text-trade-primary border border-trade-primary/30 flex items-center justify-center font-bold text-xs shrink-0">
                              {pos.symbol.slice(0, 3)}
                            </div>
                            <div>
                              <div className="font-bold text-white group-hover:text-trade-primary transition-colors">
                                {pos.symbol}
                              </div>
                              <div className="text-[10px] text-trade-subtle font-sans truncate max-w-[120px]">
                                {pos.name}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              pos.side === 'BUY'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-red-500/20 text-red-300 border border-red-500/30'
                            }`}>
                              {pos.side}
                            </span>
                            <span className="text-[10px] font-bold text-amber-400 font-mono">
                              {pos.leverage}x
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right font-semibold text-white">
                          {pos.quantity.toLocaleString()}
                        </td>

                        <td className="py-3.5 px-4 text-right text-trade-subtle">
                          ${formatPrice(pos.entryPrice)}
                        </td>

                        <td className="py-3.5 px-4 text-right font-bold text-white">
                          ${formatPrice(pos.currentPrice)}
                        </td>

                        <td className="py-3.5 px-4 text-right font-bold text-amber-400">
                          ${formatPrice(pos.marginUsed)}
                        </td>

                        <td className="py-3.5 px-4 text-right font-black">
                          <div className={isPos ? 'text-trade-positive' : 'text-trade-negative'}>
                            {isPos ? '+' : ''}${formatPrice(pos.unrealizedPnl)}
                          </div>
                          <div className={`text-[10px] ${isPos ? 'text-trade-positive' : 'text-trade-negative'}`}>
                            {formatPercent(pos.unrealizedPnlPercent)}
                          </div>
                        </td>

                        {/* Stop Loss Column */}
                        <td className="py-3.5 px-4 text-center">
                          {pos.stopLoss ? (
                            <div className="inline-flex flex-col items-center px-2 py-1 rounded-lg bg-red-950/40 border border-red-500/30 text-[10px]">
                              <span className="font-bold text-red-300">${formatPrice(pos.stopLoss)}</span>
                              {slDist !== null && (
                                <span className="text-red-400/80 font-mono text-[9px]">
                                  {slDist >= 0 ? `-${Math.abs(slDist).toFixed(1)}%` : `+${Math.abs(slDist).toFixed(1)}%`}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-trade-subtle text-[10px] font-sans">No SL set</span>
                          )}
                        </td>

                        {/* Take Profit Column */}
                        <td className="py-3.5 px-4 text-center">
                          {pos.takeProfit ? (
                            <div className="inline-flex flex-col items-center px-2 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-[10px]">
                              <span className="font-bold text-emerald-300">${formatPrice(pos.takeProfit)}</span>
                              {tpDist !== null && (
                                <span className="text-emerald-400/80 font-mono text-[9px]">
                                  {tpDist >= 0 ? `+${Math.abs(tpDist).toFixed(1)}%` : `-${Math.abs(tpDist).toFixed(1)}%`}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-trade-subtle text-[10px] font-sans">No TP set</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleClosePosition(pos.id, pos.symbol)}
                            disabled={isActionLoading}
                            className="px-3 py-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 text-red-300 hover:text-white border border-red-500/40 text-xs font-bold font-sans transition-all cursor-pointer shadow-sm"
                          >
                            Close
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 2: Open Limit Orders */}
        {activeTab === 'orders' && (
          <div className="overflow-x-auto">
            {paperData.openOrders.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <Clock className="w-10 h-10 mx-auto text-trade-subtle opacity-50" />
                <h3 className="font-bold text-sm text-white">No Working Limit Orders</h3>
                <p className="text-xs text-trade-muted">Place a Limit order from the order ticket to see it queued here.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs font-num">
                <thead>
                  <tr className="border-b border-trade-border bg-trade-surface2/70 text-[11px] font-bold text-trade-subtle uppercase tracking-wider font-sans select-none">
                    <th className="py-3 px-4">Symbol</th>
                    <th className="py-3 px-4">Side</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4 text-right">Quantity</th>
                    <th className="py-3 px-4 text-right">Target Price</th>
                    <th className="py-3 px-4 text-right">Placed At</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-trade-border/40">
                  {paperData.openOrders.map(ord => (
                    <tr key={ord.id} className="hover:bg-trade-surface2/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white">{ord.symbol}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ord.side === 'BUY' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                        }`}>
                          {ord.side}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-trade-subtle font-mono">{ord.orderType}</td>
                      <td className="py-3.5 px-4 text-right font-semibold text-white">{ord.quantity}</td>
                      <td className="py-3.5 px-4 text-right font-bold text-amber-400">${formatPrice(ord.targetPrice)}</td>
                      <td className="py-3.5 px-4 text-right text-trade-subtle text-[11px] font-sans">
                        {new Date(ord.placedAt).toLocaleTimeString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleCancelOrder(ord.id, ord.symbol)}
                          className="px-2.5 py-1 rounded bg-trade-surface3 hover:bg-trade-surface2 text-trade-muted hover:text-white border border-trade-border text-xs cursor-pointer"
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 3: Trade History Log with Close Reason Badges */}
        {activeTab === 'history' && (
          <div className="overflow-x-auto">
            {paperData.tradeHistory.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 mx-auto text-trade-subtle opacity-50" />
                <h3 className="font-bold text-sm text-white">No Trade History Yet</h3>
                <p className="text-xs text-trade-muted">Closed paper trading positions and Stop Loss executions will be recorded here.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs font-num">
                <thead>
                  <tr className="border-b border-trade-border bg-trade-surface2/70 text-[11px] font-bold text-trade-subtle uppercase tracking-wider font-sans select-none">
                    <th className="py-3 px-4">Instrument</th>
                    <th className="py-3 px-4">Side</th>
                    <th className="py-3 px-4">Trigger / Close Reason</th>
                    <th className="py-3 px-4 text-right">Quantity</th>
                    <th className="py-3 px-4 text-right">Entry Price</th>
                    <th className="py-3 px-4 text-right">Exit Price</th>
                    <th className="py-3 px-4 text-right">Realized P&L</th>
                    <th className="py-3 px-4 text-right">ROI %</th>
                    <th className="py-3 px-4 text-right">Closed Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-trade-border/40">
                  {paperData.tradeHistory.map(th => {
                    const isPos = th.realizedPnl >= 0;
                    const reason = th.closeReason || 'MANUAL';

                    return (
                      <tr key={th.id} className="hover:bg-trade-surface2/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-white">{th.symbol}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            th.side === 'BUY' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                          }`}>
                            {th.side}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {reason === 'STOP_LOSS' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950/80 text-red-300 border border-red-500/40 inline-flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              <span>STOP LOSS TRIGGERED</span>
                            </span>
                          ) : reason === 'TAKE_PROFIT' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>TAKE PROFIT HIT</span>
                            </span>
                          ) : reason === 'LIQUIDATION' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-500/40">
                              LIQUIDATED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-trade-surface3 text-trade-muted border border-trade-border">
                              MANUAL CLOSE
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-white">{th.quantity}</td>
                        <td className="py-3.5 px-4 text-right text-trade-subtle">${formatPrice(th.entryPrice)}</td>
                        <td className="py-3.5 px-4 text-right font-bold text-white">${formatPrice(th.exitPrice)}</td>
                        <td className={`py-3.5 px-4 text-right font-black ${isPos ? 'text-trade-positive' : 'text-trade-negative'}`}>
                          {isPos ? '+' : ''}${formatPrice(th.realizedPnl)}
                        </td>
                        <td className={`py-3.5 px-4 text-right font-bold ${isPos ? 'text-trade-positive' : 'text-trade-negative'}`}>
                          {formatPercent(th.realizedPnlPercent)}
                        </td>
                        <td className="py-3.5 px-4 text-right text-trade-subtle text-[11px] font-sans">
                          {new Date(th.closedAt).toLocaleTimeString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
