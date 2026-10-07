import React, { useState } from 'react';
import { 
  Bookmark, 
  Plus, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  Search, 
  ArrowUpRight, 
  Sparkles,
  ExternalLink 
} from 'lucide-react';
import { useMarket } from '../context/MarketContext';
import { Sparkline } from '../components/common/Sparkline';
import { Badge } from '../components/common/Badge';
import { formatPrice, formatPercent, formatVolume, formatMarketCap, formatCurrencySymbol } from '../utils/formatters';

export const WatchlistPage: React.FC = () => {
  const { 
    watchlistSymbols, 
    toggleWatchlist, 
    assets, 
    assetsMap, 
    openTerminalFor,
    setIsSearchOpen,
    flashMap
  } = useMarket();

  const [activeGroup, setActiveGroup] = useState<string>('all');
  const [filterQuery, setFilterQuery] = useState<string>('');

  const groups = [
    { id: 'all', label: 'My Watchlist' },
    { id: 'crypto', label: 'Crypto' },
    { id: 'stock', label: 'US Stocks' },
    { id: 'indian_stock', label: 'Indian Stocks' },
    { id: 'macro', label: 'Macro & Commodities' },
  ];

  const watchlistedAssets = watchlistSymbols
    .map(sym => assetsMap.get(sym.toUpperCase()) || assetsMap.get(sym.replace('/', '').toUpperCase()))
    .filter((a): a is NonNullable<typeof a> => a !== undefined)
    .filter(a => {
      if (activeGroup === 'crypto') return a.assetType === 'crypto' || a.assetTypeString === 'crypto';
      if (activeGroup === 'stock') return a.assetType === 'stock' || a.assetTypeString === 'stock';
      if (activeGroup === 'indian_stock') return a.assetType === 'indian_stock' || a.assetTypeString === 'indian_stock';
      if (activeGroup === 'macro') return a.assetType === 'forex' || a.assetType === 'commodity' || a.assetType === 'index';
      return true;
    })
    .filter(a => {
      const q = filterQuery.toLowerCase().trim();
      if (!q) return true;
      return a.symbol.toLowerCase().includes(q) || a.name.toLowerCase().includes(q);
    });

  const avgChange = watchlistedAssets.length > 0
    ? watchlistedAssets.reduce((sum, a) => sum + a.changePercent, 0) / watchlistedAssets.length
    : 0;

  return (
    <div className="p-3 md:p-6 space-y-6 max-w-[1720px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-amber-400 fill-amber-400" />
            <h1 className="text-xl md:text-2xl font-display font-extrabold text-white tracking-tight">
              Institutional Watchlist
            </h1>
            <Badge variant="primary" size="xs">
              {watchlistedAssets.length} ASSETS
            </Badge>
          </div>
          <p className="text-xs md:text-sm text-trade-muted mt-1">
            Real-time multi-asset telemetry and alerts configured for your high-priority portfolio monitors.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-trade-primary hover:bg-trade-primaryHover text-white text-xs font-semibold shadow-glow-primary transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Asset</span>
          </button>
        </div>
      </div>

      {/* Watchlist Group Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs no-scrollbar">
          {groups.map(g => (
            <button
              key={g.id}
              onClick={() => setActiveGroup(g.id)}
              className={`px-3.5 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all ${
                activeGroup === g.id
                  ? 'bg-trade-surface2 text-trade-primary border border-trade-primary/40 font-semibold'
                  : 'bg-trade-surface border border-trade-border text-trade-muted hover:text-trade-text'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-trade-subtle absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search within watchlist..."
            value={filterQuery}
            onChange={e => setFilterQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-trade-surface border border-trade-border focus:border-trade-primary text-trade-text placeholder:text-trade-subtle focus:outline-none"
          />
        </div>
      </div>

      {/* Watchlist Table */}
      <div className="bg-trade-surface border border-trade-border rounded-2xl overflow-hidden shadow-card">
        {watchlistedAssets.length === 0 ? (
          <div className="py-16 text-center text-trade-muted">
            <Bookmark className="w-10 h-10 mx-auto text-trade-subtle mb-3 opacity-40" />
            <h3 className="text-sm font-bold text-trade-text">No Assets in this Watchlist Group</h3>
            <p className="text-xs text-trade-subtle mt-1 max-w-sm mx-auto">
              Use the global search or market table to bookmark crypto, stocks, or indices to your watchlist.
            </p>
            <button
              onClick={() => setIsSearchOpen(true)}
              className="mt-4 px-4 py-2 rounded-xl bg-trade-primary text-white text-xs font-semibold shadow-glow-primary"
            >
              Search & Add Assets
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-num">
              <thead>
                <tr className="border-b border-trade-border bg-trade-surface2/70 text-[11px] font-bold text-trade-subtle uppercase tracking-wider font-sans select-none">
                  <th className="py-3 px-4">Symbol</th>
                  <th className="py-3 px-4 text-right">Last Price</th>
                  <th className="py-3 px-4 text-right">24h Movement</th>
                  <th className="py-3 px-4 text-right hidden sm:table-cell">Volume</th>
                  <th className="py-3 px-4 text-right hidden md:table-cell">Market Cap</th>
                  <th className="py-3 px-4 text-center hidden lg:table-cell">24h Sparkline</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-trade-border/40">
                {watchlistedAssets.map(asset => {
                  const isPos = asset.changePercent >= 0;
                  const flash = flashMap[asset.symbol];
                  const currSymbol = formatCurrencySymbol(asset.assetType, asset.exchange);

                  return (
                    <tr
                      key={asset.symbol}
                      onClick={() => openTerminalFor(asset.symbol)}
                      className={`hover:bg-trade-surface2/80 cursor-pointer transition-colors group ${
                        flash === 'up' ? 'flash-up' : flash === 'down' ? 'flash-down' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-trade-surface3 border border-trade-border flex items-center justify-center font-bold text-xs text-trade-primary shrink-0">
                            {asset.symbol.slice(0, 3)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 font-bold text-trade-text group-hover:text-trade-primary transition-colors">
                              <span>{asset.symbol}</span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-trade-surface3 border border-trade-border text-trade-subtle uppercase">
                                {asset.exchange}
                              </span>
                            </div>
                            <div className="text-[11px] text-trade-subtle font-sans truncate max-w-[150px]">
                              {asset.name}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-sm text-trade-text">
                        {currSymbol}{formatPrice(asset.price, asset.assetType)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-semibold">
                        <div className={`flex items-center justify-end gap-1 ${
                          isPos ? 'text-trade-positive' : 'text-trade-negative'
                        }`}>
                          {isPos ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                          <span>{formatPercent(asset.changePercent)}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right hidden sm:table-cell text-trade-text">
                        {formatVolume(asset.volume || 1500000)}
                      </td>

                      <td className="py-3.5 px-4 text-right hidden md:table-cell text-trade-text">
                        {formatMarketCap(asset.marketCap, asset.assetType)}
                      </td>

                      <td className="py-3.5 px-4 text-center hidden lg:table-cell">
                        <div className="flex justify-center">
                          <Sparkline data={asset.sparkline} isPositive={isPos} width={90} height={26} />
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <Badge variant={asset.tradingStatus === 'LIVE' ? 'live' : 'demo'} size="xs">
                          {asset.tradingStatus}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openTerminalFor(asset.symbol);
                            }}
                            className="p-1.5 rounded-lg bg-trade-surface3 hover:bg-trade-primary text-trade-text hover:text-white transition-colors"
                            title="Open in Pro Terminal"
                          >
                            <ArrowUpRight className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleWatchlist(asset.symbol);
                            }}
                            className="p-1.5 rounded-lg bg-trade-surface3 hover:bg-red-950/60 text-trade-subtle hover:text-red-400 transition-colors"
                            title="Remove from Watchlist"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
