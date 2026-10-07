import React, { useEffect, useState } from 'react';
import { History, Zap } from 'lucide-react';
import { Trade, MarketAsset } from '../../types/market';
import { api } from '../../services/api';
import { signalRClient } from '../../services/signalr';
import { formatPrice, formatTime } from '../../utils/formatters';

interface RecentTradesPanelProps {
  asset: MarketAsset;
}

export const RecentTradesPanel: React.FC<RecentTradesPanelProps> = ({ asset }) => {
  const [trades, setTrades] = useState<Trade[]>([]);

  useEffect(() => {
    let isMounted = true;

    // Fetch initial trades
    api.getTrades(asset.symbol)
      .then(initialTrades => {
        if (isMounted) setTrades(initialTrades);
      })
      .catch(console.warn);

    // Subscribe to live trades via SignalR
    const unsub = signalRClient.subscribeSymbol(
      asset.symbol,
      () => {},
      () => {},
      (newTrade) => {
        if (isMounted) {
          setTrades(prev => [newTrade, ...prev.slice(0, 40)]);
        }
      }
    );

    return () => {
      isMounted = false;
      unsub();
    };
  }, [asset.symbol]);

  return (
    <div className="flex flex-col bg-trade-surface border border-trade-border rounded-2xl overflow-hidden shadow-card h-full select-none">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-trade-border bg-trade-surface2/60">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-trade-primary" />
          <h3 className="text-xs font-bold tracking-wider text-trade-text uppercase">Recent Trades</h3>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
          <Zap className="w-3 h-3 animate-pulse" />
          <span>REAL-TIME STREAM</span>
        </div>
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-3 px-3 py-1.5 text-[10px] font-bold text-trade-subtle uppercase border-b border-trade-border/40 bg-trade-surface/80">
        <span>Price (USDT)</span>
        <span className="text-right">Size</span>
        <span className="text-right">Time</span>
      </div>

      {/* Trades Stream */}
      <div className="flex-1 overflow-y-auto divide-y divide-trade-border/20 py-1 font-num text-xs">
        {trades.slice(0, 20).map((t, idx) => {
          const isBuy = t.side === 'BUY' || (t as any).Side === 'BUY';
          const price = t.price || (t as any).Price;
          const amount = t.amount || (t as any).Amount;
          const timestamp = t.timestamp || (t as any).Timestamp;

          return (
            <div
              key={t.id || `trade-${idx}`}
              className={`grid grid-cols-3 px-3 py-1 hover:bg-trade-surface3/40 transition-colors ${
                idx === 0 ? 'animate-pulse' : ''
              }`}
            >
              <span className={`font-semibold ${isBuy ? 'text-trade-positive' : 'text-trade-negative'}`}>
                {formatPrice(price, asset.assetType)}
              </span>
              <span className="text-right text-trade-text">{amount ? amount.toFixed(4) : '--'}</span>
              <span className="text-right text-trade-subtle text-[11px]">{formatTime(timestamp)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
