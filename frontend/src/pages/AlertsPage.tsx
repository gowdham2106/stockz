import React, { useState } from 'react';
import { 
  Bell, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Sparkles 
} from 'lucide-react';
import { useMarket } from '../context/MarketContext';
import { AlertItem } from '../types/market';
import { Badge } from '../components/common/Badge';
import { formatPrice, formatTime } from '../utils/formatters';

export const AlertsPage: React.FC = () => {
  const { alerts, addAlert, deleteAlert, assets, openTerminalFor } = useMarket();

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [symbol, setSymbol] = useState<string>('BTC/USDT');
  const [condition, setCondition] = useState<AlertItem['condition']>('GREATER_THAN');
  const [targetValue, setTargetValue] = useState<string>('70000');
  const [note, setNote] = useState<string>('');

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    const asset = assets.find(a => a.symbol === symbol);
    await addAlert({
      symbol,
      condition,
      targetValue: parseFloat(targetValue) || 0,
      currentValue: asset?.price || 0,
      note: note || `Alert on ${symbol}`
    });
    setIsModalOpen(false);
    setNote('');
  };

  const activeAlerts = alerts.filter(a => a.status === 'ACTIVE');
  const triggeredAlerts = alerts.filter(a => a.status === 'TRIGGERED');

  return (
    <div className="p-3 md:p-6 space-y-6 max-w-[1720px] mx-auto select-none">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-trade-primary" />
            <h1 className="text-xl md:text-2xl font-display font-extrabold text-white tracking-tight">
              Real-Time Market Alerts
            </h1>
            <Badge variant="primary" size="xs">
              {activeAlerts.length} ACTIVE ALERTS
            </Badge>
          </div>
          <p className="text-xs md:text-sm text-trade-muted mt-1">
            Configure threshold triggers for price breakouts, RSI levels, and percentage swings.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-trade-primary hover:bg-trade-primaryHover text-white text-xs font-semibold shadow-glow-primary transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Alert</span>
        </button>
      </div>

      {/* Alerts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Active Alerts List (8 Cols) */}
        <div className="lg:col-span-8 bg-trade-surface border border-trade-border rounded-2xl overflow-hidden shadow-card">
          <div className="flex items-center justify-between px-4 py-3 border-b border-trade-border bg-trade-surface2/60">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-trade-primary" />
              <h3 className="text-xs font-bold text-trade-text uppercase tracking-wider">Active Price Triggers</h3>
            </div>
            <span className="text-[11px] font-mono text-emerald-400">● LIVE MONITORING</span>
          </div>

          <div className="divide-y divide-trade-border/40">
            {activeAlerts.length === 0 ? (
              <div className="py-12 text-center text-trade-muted">
                <Bell className="w-8 h-8 mx-auto text-trade-subtle mb-2 opacity-40" />
                <p className="text-xs font-semibold">No active triggers configured</p>
                <p className="text-[11px] text-trade-subtle mt-1">Click "Create New Alert" to set threshold monitors.</p>
              </div>
            ) : (
              activeAlerts.map(alert => (
                <div key={alert.id} className="flex items-center justify-between p-4 hover:bg-trade-surface2/60 transition-colors font-num">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-trade-surface3 border border-trade-border flex items-center justify-center font-bold text-xs text-trade-primary font-sans">
                      {alert.symbol.slice(0, 3)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span 
                          onClick={() => openTerminalFor(alert.symbol)}
                          className="font-bold text-sm text-trade-text hover:text-trade-primary cursor-pointer transition-colors"
                        >
                          {alert.symbol}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-trade-surface3 border border-trade-border text-trade-subtle uppercase font-sans">
                          {alert.condition.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="text-xs text-trade-subtle font-sans mt-0.5">
                        {alert.note || 'Custom alert'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <div className="text-xs font-bold text-trade-text">
                        Target: <strong className="text-trade-primary">${formatPrice(alert.targetValue)}</strong>
                      </div>
                      <div className="text-[11px] text-trade-subtle">
                        Current: ${formatPrice(alert.currentValue)}
                      </div>
                    </div>

                    <button
                      onClick={() => deleteAlert(alert.id)}
                      className="p-1.5 rounded-lg bg-trade-surface3 hover:bg-red-950/60 text-trade-subtle hover:text-red-400 transition-colors"
                      title="Delete Alert"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Triggered History (4 Cols) */}
        <div className="lg:col-span-4 bg-trade-surface border border-trade-border rounded-2xl overflow-hidden shadow-card">
          <div className="flex items-center justify-between px-4 py-3 border-b border-trade-border bg-trade-surface2/60">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-trade-text uppercase tracking-wider">Triggered Alerts</h3>
            </div>
            <span className="text-[11px] font-mono text-trade-subtle">{triggeredAlerts.length} Fired</span>
          </div>

          <div className="divide-y divide-trade-border/30 p-1">
            {triggeredAlerts.length === 0 ? (
              <div className="py-10 text-center text-xs text-trade-subtle">
                No past triggered alerts.
              </div>
            ) : (
              triggeredAlerts.map(alert => (
                <div key={alert.id} className="p-3 hover:bg-trade-surface2/40 rounded-xl transition-all">
                  <div className="flex items-center justify-between text-xs font-bold text-trade-text font-num mb-1">
                    <span>{alert.symbol}</span>
                    <Badge variant="positive" size="xs">TRIGGERED</Badge>
                  </div>
                  <div className="text-xs text-trade-muted">
                    Target ${formatPrice(alert.targetValue)} reached at {formatTime(alert.triggeredAt || new Date().toISOString())}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal: Create Alert */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-md bg-trade-surface border border-trade-border rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-trade-border">
              <h3 className="font-bold text-sm text-trade-text">Configure New Market Alert</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-trade-muted hover:text-trade-text">✕</button>
            </div>

            <form onSubmit={handleCreateAlert} className="space-y-3 text-xs">
              <div>
                <label className="block text-trade-subtle font-medium mb-1">Target Symbol</label>
                <select
                  value={symbol}
                  onChange={e => {
                    setSymbol(e.target.value);
                    const sel = assets.find(a => a.symbol === e.target.value);
                    if (sel) setTargetValue(Math.round(sel.price * 1.05).toString());
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-trade-surface2 border border-trade-border text-trade-text focus:outline-none"
                >
                  {assets.map(a => (
                    <option key={a.symbol} value={a.symbol}>
                      {a.symbol} - {a.name} (${formatPrice(a.price)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-trade-subtle font-medium mb-1">Condition Trigger</label>
                <select
                  value={condition}
                  onChange={e => setCondition(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-trade-surface2 border border-trade-border text-trade-text focus:outline-none"
                >
                  <option value="GREATER_THAN">Price Crosses Above (&gt;)</option>
                  <option value="LESS_THAN">Price Drops Below (&lt;)</option>
                  <option value="RSI_ABOVE">RSI Overbought (&gt; 70)</option>
                  <option value="RSI_BELOW">RSI Oversold (&lt; 30)</option>
                  <option value="CHANGE_PERCENT_ABOVE">24h Gain &gt; Target %</option>
                </select>
              </div>

              <div>
                <label className="block text-trade-subtle font-medium mb-1">Target Threshold Value</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={targetValue}
                  onChange={e => setTargetValue(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-trade-surface2 border border-trade-border text-trade-text focus:outline-none font-num"
                />
              </div>

              <div>
                <label className="block text-trade-subtle font-medium mb-1">Alert Note (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Resistance breakout test"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-trade-surface2 border border-trade-border text-trade-text focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-trade-surface2 text-trade-muted hover:text-trade-text"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-trade-primary text-white font-semibold shadow-glow-primary hover:bg-trade-primaryHover"
                >
                  Create Trigger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
