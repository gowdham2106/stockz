import React, { useState } from 'react';
import { ShieldAlert, CheckCircle2, ArrowRight, Wallet, Sliders, Info } from 'lucide-react';
import { MarketAsset } from '../../types/market';
import { formatPrice, formatCurrencySymbol } from '../../utils/formatters';

interface OrderTicketSimulationProps {
  asset: MarketAsset;
}

export const OrderTicketSimulation: React.FC<OrderTicketSimulationProps> = ({ asset }) => {
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [orderType, setOrderType] = useState<'LIMIT' | 'MARKET'>('LIMIT');
  const [limitPrice, setLimitPrice] = useState<string>(asset.price.toString());
  const [quantity, setQuantity] = useState<string>('1.0');
  const [percentSlider, setPercentSlider] = useState<number>(25);
  const [isSuccessToast, setIsSuccessToast] = useState<boolean>(false);
  const [lastExecutedOrder, setLastExecutedOrder] = useState<string>('');

  const currSymbol = formatCurrencySymbol(asset.assetType, asset.exchange);
  const priceVal = orderType === 'LIMIT' ? (parseFloat(limitPrice) || asset.price) : asset.price;
  const qtyVal = parseFloat(quantity) || 0;
  const totalValue = priceVal * qtyVal;

  const handleSliderChange = (percent: number) => {
    setPercentSlider(percent);
    // Simulation demo balance: $50,000
    const alloc = 50000 * (percent / 100);
    const calculatedQty = priceVal > 0 ? (alloc / priceVal) : 1;
    setQuantity(calculatedQty.toFixed(calculatedQty > 10 ? 2 : 4));
  };

  const handleExecuteSimulatedTrade = (e: React.FormEvent) => {
    e.preventDefault();
    const summary = `${side} ${qtyVal} ${asset.symbol} @ ${currSymbol}${formatPrice(priceVal, asset.assetType)}`;
    setLastExecutedOrder(summary);
    setIsSuccessToast(true);
    setTimeout(() => setIsSuccessToast(false), 4500);
  };

  return (
    <div className="flex flex-col bg-trade-surface border border-trade-border rounded-2xl overflow-hidden shadow-card p-4">
      {/* Simulation Watermark Notice */}
      <div className="flex items-center justify-between px-3 py-1.5 mb-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs">
        <div className="flex items-center gap-1.5 font-semibold">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <span>PAPER TRADING SIMULATOR</span>
        </div>
        <span className="text-[10px] font-mono uppercase bg-amber-400/20 px-1.5 py-0.5 rounded text-amber-200">
          DEMO MODE
        </span>
      </div>

      {/* Buy / Sell Tabs */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-trade-surface2 rounded-xl mb-3 border border-trade-border">
        <button
          type="button"
          onClick={() => setSide('BUY')}
          className={`py-2 rounded-lg text-xs font-bold transition-all ${
            side === 'BUY'
              ? 'bg-trade-positive text-white shadow-glow-positive'
              : 'text-trade-muted hover:text-trade-text'
          }`}
        >
          BUY / LONG
        </button>
        <button
          type="button"
          onClick={() => setSide('SELL')}
          className={`py-2 rounded-lg text-xs font-bold transition-all ${
            side === 'SELL'
              ? 'bg-trade-negative text-white shadow-glow-negative'
              : 'text-trade-muted hover:text-trade-text'
          }`}
        >
          SELL / SHORT
        </button>
      </div>

      {/* Order Type Toggle */}
      <div className="flex items-center gap-2 mb-3">
        <button
          type="button"
          onClick={() => setOrderType('LIMIT')}
          className={`flex-1 py-1 text-xs font-medium rounded-lg border transition-all ${
            orderType === 'LIMIT'
              ? 'bg-trade-surface3 text-trade-primary border-trade-primary/40'
              : 'bg-transparent text-trade-muted border-trade-border hover:bg-trade-surface2'
          }`}
        >
          Limit Order
        </button>
        <button
          type="button"
          onClick={() => setOrderType('MARKET')}
          className={`flex-1 py-1 text-xs font-medium rounded-lg border transition-all ${
            orderType === 'MARKET'
              ? 'bg-trade-surface3 text-trade-primary border-trade-primary/40'
              : 'bg-transparent text-trade-muted border-trade-border hover:bg-trade-surface2'
          }`}
        >
          Market Order
        </button>
      </div>

      <form onSubmit={handleExecuteSimulatedTrade} className="space-y-3 font-num text-xs">
        {/* Limit Price Input */}
        {orderType === 'LIMIT' && (
          <div>
            <label className="block text-[11px] text-trade-subtle mb-1 font-sans font-medium">
              Limit Price ({currSymbol})
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                value={limitPrice}
                onChange={e => setLimitPrice(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-trade-surface2 border border-trade-border focus:border-trade-primary text-trade-text focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setLimitPrice(asset.price.toString())}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-trade-primary font-medium hover:underline"
              >
                LAST
              </button>
            </div>
          </div>
        )}

        {/* Quantity Input */}
        <div>
          <label className="block text-[11px] text-trade-subtle mb-1 font-sans font-medium">
            Quantity Amount
          </label>
          <div className="relative">
            <input
              type="number"
              step="any"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-trade-surface2 border border-trade-border focus:border-trade-primary text-trade-text focus:outline-none"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-trade-subtle uppercase">
              {asset.symbol.split('/')[0]}
            </span>
          </div>
        </div>

        {/* Percentage Slider */}
        <div>
          <div className="flex justify-between text-[11px] text-trade-subtle mb-1.5 font-sans">
            <span>Allocation Size</span>
            <span className="font-num text-trade-text font-semibold">{percentSlider}%</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {[25, 50, 75, 100].map(p => (
              <button
                key={p}
                type="button"
                onClick={() => handleSliderChange(p)}
                className={`py-1 rounded text-[10px] font-medium border transition-all ${
                  percentSlider === p
                    ? 'bg-trade-primary text-white border-trade-primary'
                    : 'bg-trade-surface2 border-trade-border text-trade-muted hover:bg-trade-surface3'
                }`}
              >
                {p}%
              </button>
            ))}
          </div>
        </div>

        {/* Cost Summary Box */}
        <div className="p-2.5 rounded-xl bg-trade-surface2/60 border border-trade-border/60 space-y-1 text-[11px]">
          <div className="flex justify-between">
            <span className="text-trade-subtle font-sans">Order Value:</span>
            <span className="font-semibold text-trade-text">{currSymbol}{formatPrice(totalValue)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-trade-subtle font-sans">Est. Fee (0.05% Demo):</span>
            <span className="text-trade-subtle">{currSymbol}{(totalValue * 0.0005).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-trade-subtle font-sans">Available Demo Cash:</span>
            <span className="text-emerald-400 font-semibold">$32,450.00</span>
          </div>
        </div>

        {/* Simulated Execute Button */}
        <button
          type="submit"
          className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-white shadow-lg transition-all active:scale-[0.99] ${
            side === 'BUY'
              ? 'bg-gradient-to-r from-emerald-600 to-trade-positive hover:from-emerald-500 hover:to-emerald-400 shadow-glow-positive'
              : 'bg-gradient-to-r from-red-600 to-trade-negative hover:from-red-500 hover:to-red-400 shadow-glow-negative'
          }`}
        >
          Simulate {side} {asset.symbol}
        </button>
      </form>

      {/* Success Notification Toast */}
      {isSuccessToast && (
        <div className="mt-3 p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in zoom-in-95">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="min-w-0">
            <div className="font-bold">Simulated Fill Confirmed</div>
            <div className="text-[11px] truncate text-emerald-200">{lastExecutedOrder}</div>
          </div>
        </div>
      )}

      {/* Security notice */}
      <div className="mt-3 text-[10px] text-trade-subtle leading-tight text-center">
        No real capital is risked. Live order execution is intentionally disabled in this terminal phase.
      </div>
    </div>
  );
};
