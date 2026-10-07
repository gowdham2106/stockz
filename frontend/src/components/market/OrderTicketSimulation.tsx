import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  ArrowRight, 
  Wallet, 
  Sliders, 
  Info, 
  Zap, 
  Layers, 
  AlertCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { MarketAsset } from '../../types/market';
import { formatPrice, formatPercent, formatCurrencySymbol } from '../../utils/formatters';
import { api } from '../../services/api';
import { useMarket } from '../../context/MarketContext';

interface OrderTicketSimulationProps {
  asset: MarketAsset;
}

export const OrderTicketSimulation: React.FC<OrderTicketSimulationProps> = ({ asset }) => {
  const { setActivePage, paperAccount, refreshPaperAccount } = useMarket();
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT' | 'STOP_LOSS'>('MARKET');
  const [limitPrice, setLimitPrice] = useState<string>(asset.price.toString());
  const [quantity, setQuantity] = useState<string>('0.5');
  const [leverage, setLeverage] = useState<number>(1);
  const [stopLoss, setStopLoss] = useState<string>('');
  const [takeProfit, setTakeProfit] = useState<string>('');
  const [percentSlider, setPercentSlider] = useState<number>(25);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccessToast, setIsSuccessToast] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [lastExecutedSummary, setLastExecutedSummary] = useState<string>('');

  // Sync current price on asset update
  useEffect(() => {
    if (orderType === 'MARKET') {
      setLimitPrice(asset.price.toString());
    }
  }, [asset.price, orderType]);

  const currSymbol = formatCurrencySymbol(asset.assetType, asset.exchange);
  const priceVal = orderType === 'LIMIT' ? (parseFloat(limitPrice) || asset.price) : asset.price;
  const qtyVal = parseFloat(quantity) || 0;
  const positionValue = priceVal * qtyVal;
  const marginRequired = positionValue / leverage;
  const virtualCash = paperAccount?.virtualCash ?? 73630;
  const isInsufficientFunds = marginRequired > virtualCash && qtyVal > 0;

  const handleSliderChange = (percent: number) => {
    setPercentSlider(percent);
    const availableAlloc = virtualCash * (percent / 100) * leverage;
    const calculatedQty = priceVal > 0 ? (availableAlloc / priceVal) : 1;
    setQuantity(calculatedQty > 10 ? calculatedQty.toFixed(2) : calculatedQty.toFixed(4));
  };

  const applyPresetStopLoss = (pct: number) => {
    const slPrice = side === 'BUY'
      ? priceVal * (1 - pct / 100)
      : priceVal * (1 + pct / 100);
    setStopLoss(slPrice > 10 ? slPrice.toFixed(2) : slPrice.toFixed(4));
  };

  const applyPresetTakeProfit = (pct: number) => {
    const tpPrice = side === 'BUY'
      ? priceVal * (1 + pct / 100)
      : priceVal * (1 - pct / 100);
    setTakeProfit(tpPrice > 10 ? tpPrice.toFixed(2) : tpPrice.toFixed(4));
  };

  const handleExecutePaperTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (qtyVal <= 0) return;
    setErrorMessage('');

    if (isInsufficientFunds) {
      setErrorMessage(`Insufficient Virtual Cash. Order requires $${formatPrice(marginRequired)}, but available cash is $${formatPrice(virtualCash)}.`);
      return;
    }

    try {
      setIsSubmitting(true);
      const parsedSL = stopLoss ? parseFloat(stopLoss) : undefined;
      const parsedTP = takeProfit ? parseFloat(takeProfit) : undefined;

      await api.executePaperOrder({
        symbol: asset.symbol,
        side,
        orderType,
        quantity: qtyVal,
        limitPrice: orderType === 'LIMIT' ? parseFloat(limitPrice) : undefined,
        stopLoss: parsedSL,
        takeProfit: parsedTP,
        leverage
      });

      await refreshPaperAccount();

      const summary = `Executed Paper ${side} ${qtyVal} ${asset.symbol} @ ${currSymbol}${formatPrice(priceVal, asset.assetType)} (${leverage}x leverage)`;
      setLastExecutedSummary(summary);
      setIsSuccessToast(true);
      setTimeout(() => setIsSuccessToast(false), 6000);
    } catch (err: any) {
      console.error('Order execution error:', err);
      const msg = err?.response?.data?.message || err?.message || 'Failed to place simulated trade.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col bg-trade-surface border border-trade-border rounded-2xl overflow-hidden shadow-card p-4 space-y-3.5 select-none">
      {/* Simulation Watermark Notice */}
      <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs">
        <div className="flex items-center gap-1.5 font-bold">
          <Zap className="w-4 h-4 text-amber-400 shrink-0" />
          <span>REAL-TIME PAPER TRADING</span>
        </div>
        <span className="text-[10px] font-mono uppercase bg-amber-400/20 px-2 py-0.5 rounded text-amber-200 font-bold">
          PRACTICE MODE
        </span>
      </div>

      {/* Available Virtual Buying Power & Cash */}
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-trade-surface2/70 border border-trade-border text-xs font-num">
        <div className="flex items-center gap-1.5 text-trade-subtle font-sans">
          <Wallet className="w-3.5 h-3.5 text-trade-primary shrink-0" />
          <span>Available Cash:</span>
        </div>
        <div className="text-right">
          <div className="font-bold text-white text-xs">
            ${formatPrice(virtualCash)} <span className="text-[10px] text-amber-400 font-sans font-bold">USD</span>
          </div>
          {leverage > 1 && (
            <div className="text-[10px] text-trade-subtle font-sans">
              Buying Power: ${formatPrice(virtualCash * leverage)} ({leverage}x)
            </div>
          )}
        </div>
      </div>

      {/* Error Alert Banner */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-red-950/90 border border-red-500/50 text-red-300 text-xs space-y-1 animate-in fade-in">
          <div className="flex items-center gap-1.5 font-bold">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>Order Rejected</span>
          </div>
          <p className="text-[11px] text-red-200/90">{errorMessage}</p>
        </div>
      )}

      {/* Success Toast Banner */}
      {isSuccessToast && (
        <div className="p-3 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs space-y-1.5 animate-in fade-in zoom-in-95">
          <div className="flex items-center gap-1.5 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Order Filled & Cash Deducted!</span>
          </div>
          <p className="text-[11px] font-mono text-emerald-200/90">{lastExecutedSummary}</p>
          <div className="text-[10px] text-emerald-300/80">
            Available Virtual Cash updated: <span className="font-bold text-white">${formatPrice(virtualCash)}</span>
          </div>
          <button
            onClick={() => setActivePage('portfolio')}
            className="mt-1 px-2.5 py-1 rounded bg-emerald-500 text-slate-950 font-bold text-[10px] flex items-center gap-1 hover:bg-emerald-400 transition-colors cursor-pointer"
          >
            <span>Track in Paper Practice Hub</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Buy / Sell Tabs */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-trade-surface2 rounded-xl border border-trade-border">
        <button
          type="button"
          onClick={() => setSide('BUY')}
          className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
          className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            side === 'SELL'
              ? 'bg-trade-negative text-white shadow-glow-negative'
              : 'text-trade-muted hover:text-trade-text'
          }`}
        >
          SELL / SHORT
        </button>
      </div>

      {/* Order Type Toggle */}
      <div className="grid grid-cols-3 gap-1.5">
        {(['MARKET', 'LIMIT', 'STOP_LOSS'] as const).map(type => (
          <button
            key={type}
            type="button"
            onClick={() => setOrderType(type)}
            className={`py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
              orderType === type
                ? 'bg-trade-surface3 text-trade-primary border-trade-primary/50 shadow-inner'
                : 'bg-trade-surface2/50 text-trade-muted border-trade-border hover:bg-trade-surface2'
            }`}
          >
            {type === 'MARKET' ? 'Market' : type === 'LIMIT' ? 'Limit' : 'Stop'}
          </button>
        ))}
      </div>

      {/* Order Execution Form */}
      <form onSubmit={handleExecutePaperTrade} className="space-y-3 text-xs font-num">
        {/* Limit / Trigger Price Field */}
        {orderType !== 'MARKET' && (
          <div>
            <div className="flex justify-between text-trade-subtle font-sans mb-1 text-[11px]">
              <span>Limit Target Price</span>
              <span>LTP: {currSymbol}{formatPrice(asset.price, asset.assetType)}</span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-trade-subtle font-bold">
                {currSymbol}
              </span>
              <input
                type="number"
                step="any"
                required
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-trade-surface2 border border-trade-border text-trade-text font-bold focus:outline-none focus:border-trade-primary"
              />
            </div>
          </div>
        )}

        {/* Quantity Field */}
        <div>
          <div className="flex justify-between text-trade-subtle font-sans mb-1 text-[11px]">
            <span>Order Quantity</span>
            <span>Total Value: ≈ {currSymbol}{formatPrice(positionValue, asset.assetType)}</span>
          </div>
          <div className="relative">
            <input
              type="number"
              step="any"
              min="0.0001"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-trade-surface2 border border-trade-border text-trade-text font-bold focus:outline-none focus:border-trade-primary"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-trade-subtle font-sans font-semibold text-[10px]">
              {asset.symbol.split('/')[0]}
            </span>
          </div>
        </div>

        {/* Quick Percent Allocation Slider */}
        <div className="space-y-1 pt-0.5">
          <div className="flex justify-between text-[11px] text-trade-subtle font-sans">
            <span>Cash Allocation</span>
            <span className="text-trade-primary font-bold">{percentSlider}%</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {[25, 50, 75, 100].map(pct => (
              <button
                key={pct}
                type="button"
                onClick={() => handleSliderChange(pct)}
                className={`py-1 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${
                  percentSlider === pct
                    ? 'bg-trade-primary/20 text-trade-primary border-trade-primary/50'
                    : 'bg-trade-surface2 text-trade-muted border-trade-border hover:bg-trade-surface3'
                }`}
              >
                {pct}%
              </button>
            ))}
          </div>
        </div>

        {/* Leverage Selector (1x, 2x, 5x, 10x) */}
        <div className="space-y-1 pt-1">
          <div className="flex justify-between text-[11px] text-trade-subtle font-sans">
            <span>Simulated Leverage</span>
            <span className="font-bold text-amber-400">{leverage}x Margin</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {[1, 2, 5, 10].map(lev => (
              <button
                key={lev}
                type="button"
                onClick={() => setLeverage(lev)}
                className={`py-1 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${
                  leverage === lev
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                    : 'bg-trade-surface2 text-trade-muted border-trade-border hover:bg-trade-surface3'
                }`}
              >
                {lev}x
              </button>
            ))}
          </div>
        </div>

        {/* TP / SL Inputs with Quick Preset Chips */}
        <div className="grid grid-cols-2 gap-2 pt-1 font-sans">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] text-trade-subtle font-medium">Take Profit ({currSymbol})</label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => applyPresetTakeProfit(2)}
                  className="text-[9px] px-1 py-0.2 rounded bg-trade-surface2 text-emerald-400 hover:bg-emerald-950/40"
                >
                  +2%
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetTakeProfit(5)}
                  className="text-[9px] px-1 py-0.2 rounded bg-trade-surface2 text-emerald-400 hover:bg-emerald-950/40"
                >
                  +5%
                </button>
              </div>
            </div>
            <input
              type="number"
              step="any"
              value={takeProfit}
              onChange={(e) => setTakeProfit(e.target.value)}
              placeholder="Target TP"
              className="w-full px-2.5 py-1.5 rounded-lg bg-trade-surface2 border border-trade-border text-white text-xs font-num focus:outline-none focus:border-emerald-400"
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] text-trade-subtle font-medium">Stop Loss ({currSymbol})</label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => applyPresetStopLoss(2)}
                  className="text-[9px] px-1 py-0.2 rounded bg-trade-surface2 text-red-400 hover:bg-red-950/40"
                >
                  -2%
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetStopLoss(5)}
                  className="text-[9px] px-1 py-0.2 rounded bg-trade-surface2 text-red-400 hover:bg-red-950/40"
                >
                  -5%
                </button>
              </div>
            </div>
            <input
              type="number"
              step="any"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              placeholder="Cut Loss SL"
              className="w-full px-2.5 py-1.5 rounded-lg bg-trade-surface2 border border-trade-border text-white text-xs font-num focus:outline-none focus:border-red-400"
            />
          </div>
        </div>

        {/* Protection Note */}
        {stopLoss && (
          <div className="flex items-center gap-1.5 p-2 rounded-lg bg-red-950/30 border border-red-500/30 text-[10px] text-red-300 font-sans">
            <ShieldCheck className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <span>Auto-protection active: position auto-sells immediately at ${formatPrice(parseFloat(stopLoss) || 0)}</span>
          </div>
        )}

        {/* Cost & Margin Summary */}
        <div className="p-2.5 rounded-xl bg-trade-surface2/60 border border-trade-border text-[11px] space-y-1 font-sans">
          <div className="flex justify-between">
            <span className="text-trade-subtle">Total Position Value:</span>
            <span className="font-bold text-trade-text font-num">{currSymbol}{formatPrice(positionValue, asset.assetType)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-trade-subtle">Cash Margin to Deduct:</span>
            <span className={`font-bold font-num ${isInsufficientFunds ? 'text-red-400' : 'text-amber-400'}`}>
              {currSymbol}{formatPrice(marginRequired, asset.assetType)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-trade-subtle">Available After Trade:</span>
            <span className="text-trade-muted font-num">
              ${formatPrice(Math.max(0, virtualCash - marginRequired))}
            </span>
          </div>
        </div>

        {/* Main Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || qtyVal <= 0 || isInsufficientFunds}
          className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50 ${
            isInsufficientFunds
              ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
              : side === 'BUY'
                ? 'bg-trade-positive hover:bg-emerald-500 text-white shadow-glow-positive'
                : 'bg-trade-negative hover:bg-red-500 text-white shadow-glow-negative'
          }`}
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Deducting Margin & Placing Order...</span>
            </>
          ) : isInsufficientFunds ? (
            <>
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span>Insufficient Virtual Cash</span>
            </>
          ) : (
            <>
              <span>Place Paper {side} Order</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};
