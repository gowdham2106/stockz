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
  RotateCcw
} from 'lucide-react';
import { useMarket } from '../context/MarketContext';
import { Portfolio } from '../types/market';
import { api } from '../services/api';
import { Badge } from '../components/common/Badge';
import { formatPrice, formatPercent, formatVolume } from '../utils/formatters';

export const PortfolioPage: React.FC = () => {
  const { openTerminalFor } = useMarket();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    api.getPortfolio()
      .then(p => {
        if (isMounted) {
          setPortfolio(p);
          setIsLoading(false);
        }
      })
      .catch(console.warn);

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading || !portfolio) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center text-trade-muted">
          <PieChart className="w-8 h-8 mx-auto text-trade-primary animate-pulse mb-2" />
          <p className="font-semibold text-sm">Calculating Simulated Institutional Balances...</p>
        </div>
      </div>
    );
  }

  const isTodayPos = portfolio.todayPnL >= 0;
  const isAllTimePos = portfolio.allTimePnL >= 0;

  return (
    <div className="p-3 md:p-6 space-y-6 max-w-[1720px] mx-auto select-none">
      {/* Simulation Watermark Alert */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-300">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <div className="font-bold text-sm text-amber-200">
              SIMULATED PORTFOLIO DEMO • NOT REAL MONEY
            </div>
            <div className="text-xs text-amber-300/80">
              This sandbox environment allows backtesting allocation strategies and risk modeling without live capital exposure.
            </div>
          </div>
        </div>
        <Badge variant="demo" size="sm">
          DEMO PAPER TRADING
        </Badge>
      </div>

      {/* Overview Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-num">
        <div className="p-4 rounded-2xl bg-trade-surface border border-trade-border shadow-card">
          <div className="text-[11px] text-trade-subtle font-sans font-medium uppercase mb-1">
            Total Portfolio Value
          </div>
          <div className="text-2xl font-black text-trade-text tracking-tight">
            ${formatPrice(portfolio.totalPortfolioValue)}
          </div>
          <div className="text-[11px] text-trade-subtle font-sans mt-1">
            Invested: <strong className="text-trade-text">${formatPrice(portfolio.investedValue)}</strong>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-trade-surface border border-trade-border shadow-card">
          <div className="text-[11px] text-trade-subtle font-sans font-medium uppercase mb-1">
            Today's Unrealized P&L
          </div>
          <div className={`text-2xl font-black tracking-tight ${isTodayPos ? 'text-trade-positive' : 'text-trade-negative'}`}>
            {isTodayPos ? '+' : ''}${formatPrice(portfolio.todayPnL)}
          </div>
          <div className={`text-xs font-semibold flex items-center gap-1 mt-1 ${isTodayPos ? 'text-trade-positive' : 'text-trade-negative'}`}>
            {isTodayPos ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {formatPercent(portfolio.todayPnLPercent)}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-trade-surface border border-trade-border shadow-card">
          <div className="text-[11px] text-trade-subtle font-sans font-medium uppercase mb-1">
            Total Cumulative P&L
          </div>
          <div className={`text-2xl font-black tracking-tight ${isAllTimePos ? 'text-trade-positive' : 'text-trade-negative'}`}>
            {isAllTimePos ? '+' : ''}${formatPrice(portfolio.allTimePnL)}
          </div>
          <div className={`text-xs font-semibold flex items-center gap-1 mt-1 ${isAllTimePos ? 'text-trade-positive' : 'text-trade-negative'}`}>
            {isAllTimePos ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {formatPercent(portfolio.allTimePnLPercent)}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-trade-surface border border-trade-border shadow-card">
          <div className="text-[11px] text-trade-subtle font-sans font-medium uppercase mb-1">
            Available Demo Cash
          </div>
          <div className="text-2xl font-black text-trade-primary tracking-tight">
            ${formatPrice(portfolio.availableCash)}
          </div>
          <div className="text-[11px] text-emerald-400 font-sans mt-1">
            ● 100% Reserve Backed (Demo)
          </div>
        </div>
      </div>

      {/* Asset Allocation & Performance Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Holdings Table (8 Cols) */}
        <div className="lg:col-span-8 bg-trade-surface border border-trade-border rounded-2xl overflow-hidden shadow-card">
          <div className="flex items-center justify-between px-4 py-3 border-b border-trade-border bg-trade-surface2/60">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-trade-primary" />
              <h3 className="text-xs font-bold text-trade-text uppercase tracking-wider">Active Portfolio Holdings</h3>
            </div>
            <span className="text-[11px] font-mono text-trade-subtle">
              {portfolio.holdings.length} Positions Active
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-num">
              <thead>
                <tr className="border-b border-trade-border bg-trade-surface2/70 text-[11px] font-bold text-trade-subtle uppercase tracking-wider font-sans select-none">
                  <th className="py-3 px-4">Asset</th>
                  <th className="py-3 px-4 text-right">Holdings Qty</th>
                  <th className="py-3 px-4 text-right">Avg Cost</th>
                  <th className="py-3 px-4 text-right">Live Price</th>
                  <th className="py-3 px-4 text-right">Market Value</th>
                  <th className="py-3 px-4 text-right">Unrealized P&L</th>
                  <th className="py-3 px-4 text-center">Alloc (%)</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-trade-border/40">
                {portfolio.holdings.map(h => {
                  const isHoldingPos = h.unrealizedPnL >= 0;

                  return (
                    <tr
                      key={h.symbol}
                      onClick={() => openTerminalFor(h.symbol)}
                      className="hover:bg-trade-surface2/80 cursor-pointer transition-colors group"
                    >
                      <td className="py-3.5 px-4 font-bold text-trade-text group-hover:text-trade-primary transition-colors">
                        <div className="flex items-center gap-2">
                          <span>{h.symbol}</span>
                          <span className="text-[10px] text-trade-subtle font-normal font-sans">
                            {h.name}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right text-trade-text font-medium">
                        {h.quantity}
                      </td>

                      <td className="py-3.5 px-4 text-right text-trade-subtle">
                        ${formatPrice(h.avgBuyPrice)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-trade-text">
                        ${formatPrice(h.currentPrice)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-trade-text">
                        ${formatPrice(h.marketValue)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-semibold">
                        <div className={isHoldingPos ? 'text-trade-positive' : 'text-trade-negative'}>
                          {isHoldingPos ? '+' : ''}${formatPrice(h.unrealizedPnL)}
                        </div>
                        <div className={`text-[10px] ${isHoldingPos ? 'text-trade-positive' : 'text-trade-negative'}`}>
                          {formatPercent(h.unrealizedPnLPercent)}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded bg-trade-surface3 border border-trade-border text-trade-text font-bold">
                          {h.allocationPercent}%
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openTerminalFor(h.symbol);
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

        {/* Right: Allocation Visualizer & Performance (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-trade-surface border border-trade-border rounded-2xl p-4 shadow-card">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-trade-border">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-trade-primary" />
                <h3 className="text-xs font-bold text-trade-text uppercase tracking-wider">Asset Allocation</h3>
              </div>
              <span className="text-[10px] text-trade-subtle font-mono">MULTI-ASSET</span>
            </div>

            {/* Allocation Breakdown Progress Bars */}
            <div className="space-y-3 font-num text-xs">
              {portfolio.holdings.map(h => (
                <div key={h.symbol}>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="font-semibold text-trade-text">{h.symbol}</span>
                    <span className="text-trade-muted">{h.allocationPercent}% (${formatPrice(h.marketValue)})</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-trade-surface3 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-trade-primary to-blue-400 rounded-full"
                      style={{ width: `${Math.min(100, h.allocationPercent)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Trend Snapshot */}
          <div className="bg-trade-surface border border-trade-border rounded-2xl p-4 shadow-card">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-trade-border">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-trade-primary" />
                <h3 className="text-xs font-bold text-trade-text uppercase tracking-wider">30-Day Simulated Growth</h3>
              </div>
              <span className="text-[11px] text-emerald-400 font-num font-bold">+18.5% TTM</span>
            </div>

            <div className="space-y-2 font-num text-xs">
              {portfolio.performanceHistory.map(pt => (
                <div key={pt.date} className="flex items-center justify-between p-2 rounded-lg bg-trade-surface2/60 border border-trade-border/40">
                  <span className="text-trade-subtle font-sans">{pt.date}</span>
                  <span className="font-bold text-trade-text">${formatPrice(pt.value)}</span>
                  <span className={`font-semibold ${pt.pnl >= 0 ? 'text-trade-positive' : 'text-trade-negative'}`}>
                    {pt.pnl >= 0 ? '+' : ''}${formatPrice(pt.pnl)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
