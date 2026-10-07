import React, { useEffect, useState } from 'react';
import { Layers, ArrowUpDown } from 'lucide-react';
import { OrderBook, MarketAsset, OrderBookLevel } from '../../types/market';
import { api } from '../../services/api';
import { signalRClient } from '../../services/signalr';
import { formatPrice } from '../../utils/formatters';

interface OrderBookPanelProps {
  asset: MarketAsset;
}

export const OrderBookPanel: React.FC<OrderBookPanelProps> = ({ asset }) => {
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null);

  useEffect(() => {
    let isMounted = true;

    // Fetch initial orderbook
    api.getOrderBook(asset.symbol)
      .then(ob => {
        if (isMounted) setOrderBook(ob);
      })
      .catch(console.warn);

    // Subscribe to live orderbook updates via SignalR
    const unsub = signalRClient.subscribeSymbol(
      asset.symbol,
      () => {}, // price handled in context
      (newOb) => {
        if (isMounted) setOrderBook(newOb);
      }
    );

    return () => {
      isMounted = false;
      unsub();
    };
  }, [asset.symbol]);

  const asks: OrderBookLevel[] = (orderBook as any)?.Asks || orderBook?.asks || [];
  const bids: OrderBookLevel[] = (orderBook as any)?.Bids || orderBook?.bids || [];

  const maxAskTotal = asks.length > 0 ? (asks[asks.length - 1].total || (asks[asks.length - 1] as any).Total || 100) : 100;
  const maxBidTotal = bids.length > 0 ? (bids[bids.length - 1].total || (bids[bids.length - 1] as any).Total || 100) : 100;
  const maxTotal = Math.max(maxAskTotal, maxBidTotal, 1);

  const bestAsk = asks.length > 0 ? (asks[0].price || (asks[0] as any).Price || asset.price) : asset.price * 1.0001;
  const bestBid = bids.length > 0 ? (bids[0].price || (bids[0] as any).Price || asset.price) : asset.price * 0.9999;
  const spread = Math.max(0, bestAsk - bestBid);
  const spreadPercent = bestAsk > 0 ? (spread / bestAsk) * 100 : 0;

  return (
    <div className="flex flex-col bg-trade-surface border border-trade-border rounded-2xl overflow-hidden shadow-card h-full select-none">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-trade-border bg-trade-surface2/60">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-trade-primary" />
          <h3 className="text-xs font-bold tracking-wider text-trade-text uppercase">Order Book</h3>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-trade-subtle">
          <span>Tick: <strong>0.01</strong></span>
          <span className="text-emerald-400">● LIVE DEPTH</span>
        </div>
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-3 px-3 py-1.5 text-[10px] font-bold text-trade-subtle uppercase border-b border-trade-border/40 bg-trade-surface/80">
        <span>Price (USDT)</span>
        <span className="text-right">Size</span>
        <span className="text-right">Total</span>
      </div>

      {/* Asks (Sells) - Reversed so lowest ask is at bottom */}
      <div className="flex-1 overflow-hidden flex flex-col justify-end divide-y divide-trade-border/20 py-1">
        {asks.slice(0, 8).reverse().map((ask: any, i: number) => {
          const price = ask.Price ?? ask.price ?? 0;
          const amount = ask.Amount ?? ask.amount ?? 0;
          const total = ask.Total ?? ask.total ?? 0;
          const depthPercent = Math.min(100, Math.round((total / maxTotal) * 100));

          return (
            <div key={`ask-${i}`} className="relative grid grid-cols-3 px-3 py-0.5 text-xs font-num group hover:bg-trade-surface3/50 transition-colors">
              {/* Depth background bar */}
              <div 
                className="absolute right-0 top-0 bottom-0 bg-red-950/35 group-hover:bg-red-900/40 pointer-events-none transition-all"
                style={{ width: `${depthPercent}%` }}
              />
              <span className="relative font-semibold text-trade-negative">{formatPrice(price, asset.assetType)}</span>
              <span className="relative text-right text-trade-text">{amount.toFixed(3)}</span>
              <span className="relative text-right text-trade-subtle">{total.toFixed(3)}</span>
            </div>
          );
        })}
      </div>

      {/* Current Spread & Mid Price Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-trade-surface2 border-y border-trade-border font-num text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-trade-text">
            {formatPrice(asset.price, asset.assetType)}
          </span>
          <span className="text-[10px] text-trade-subtle">
            Spread: <strong className="text-trade-warning">{spread.toFixed(2)}</strong> ({spreadPercent.toFixed(3)}%)
          </span>
        </div>
        <ArrowUpDown className="w-3.5 h-3.5 text-trade-muted" />
      </div>

      {/* Bids (Buys) */}
      <div className="flex-1 overflow-hidden flex flex-col divide-y divide-trade-border/20 py-1">
        {bids.slice(0, 8).map((bid: any, i: number) => {
          const price = bid.Price ?? bid.price ?? 0;
          const amount = bid.Amount ?? bid.amount ?? 0;
          const total = bid.Total ?? bid.total ?? 0;
          const depthPercent = Math.min(100, Math.round((total / maxTotal) * 100));

          return (
            <div key={`bid-${i}`} className="relative grid grid-cols-3 px-3 py-0.5 text-xs font-num group hover:bg-trade-surface3/50 transition-colors">
              {/* Depth background bar */}
              <div 
                className="absolute right-0 top-0 bottom-0 bg-emerald-950/35 group-hover:bg-emerald-900/40 pointer-events-none transition-all"
                style={{ width: `${depthPercent}%` }}
              />
              <span className="relative font-semibold text-trade-positive">{formatPrice(price, asset.assetType)}</span>
              <span className="relative text-right text-trade-text">{amount.toFixed(3)}</span>
              <span className="relative text-right text-trade-subtle">{total.toFixed(3)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
