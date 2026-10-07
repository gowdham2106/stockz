import React, { useState } from 'react';
import { 
  Globe, 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Bookmark, 
  ArrowUpDown, 
  ExternalLink, 
  Filter,
  Layers,
  Sparkles
} from 'lucide-react';
import { useMarket } from '../context/MarketContext';
import { Sparkline } from '../components/common/Sparkline';
import { Badge } from '../components/common/Badge';
import { formatPrice, formatPercent, formatVolume, formatMarketCap, formatCurrencySymbol } from '../utils/formatters';

export const MarketsPage: React.FC = () => {
  const { 
    assets, 
    openTerminalFor, 
    toggleWatchlist, 
    isWatchlisted,
    flashMap 
  } = useMarket();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'price' | 'change' | 'volume' | 'marketCap' | 'name'>('volume');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const categories = [
    { id: 'all', label: 'All Markets' },
    { id: 'crypto', label: 'Crypto' },
    { id: 'stock', label: 'US Stocks' },
    { id: 'indian_stock', label: 'Indian Stocks (NSE)' },
    { id: 'index', label: 'Indices' },
    { id: 'forex', label: 'Forex' },
    { id: 'commodity', label: 'Commodities' },
    { id: 'etf', label: 'ETFs' },
  ];

  const handleSort = (field: 'price' | 'change' | 'volume' | 'marketCap' | 'name') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const filteredAssets = assets
    .filter(asset => {
      const matchCat = activeCategory === 'all' || 
        asset.assetType === activeCategory || 
        asset.assetTypeString === activeCategory;

      const q = searchFilter.trim().toLowerCase();
      if (!q) return matchCat;

      const matchSearch = 
        asset.symbol.toLowerCase().includes(q) ||
        asset.name.toLowerCase().includes(q) ||
        (asset.sector && asset.sector.toLowerCase().includes(q)) ||
        asset.exchange.toLowerCase().includes(q);

      return matchCat && matchSearch;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'price') comparison = a.price - b.price;
      else if (sortBy === 'change') comparison = a.changePercent - b.changePercent;
      else if (sortBy === 'volume') comparison = (a.volume || 0) - (b.volume || 0);
      else if (sortBy === 'marketCap') comparison = (a.marketCap || 0) - (b.marketCap || 0);
      else if (sortBy === 'name') comparison = a.symbol.localeCompare(b.symbol);

      return sortOrder === 'asc' ? comparison : -comparison;
    });

  return (
    <div className="p-3 md:p-6 space-y-6 max-w-[1720px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-trade-primary" />
            <h1 className="text-xl md:text-2xl font-display font-extrabold text-white tracking-tight">
              Multi-Asset Market Intelligence
            </h1>
            <Badge variant="live" size="xs" pulse>
              {assets.length} ASSETS MONITORED
            </Badge>
          </div>
          <p className="text-xs md:text-sm text-trade-muted mt-1">
            Global pricing coverage across digital assets, equities, foreign exchange, commodities, and benchmark indices.
          </p>
        </div>

        {/* Search input in page */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-trade-subtle absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter symbols or name..."
            value={searchFilter}
            onChange={e => setSearchFilter(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-trade-surface border border-trade-border focus:border-trade-primary text-trade-text placeholder:text-trade-subtle focus:outline-none"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all ${
              activeCategory === cat.id
                ? 'bg-trade-primary text-white shadow-glow-primary font-semibold'
                : 'bg-trade-surface border border-trade-border text-trade-muted hover:text-trade-text hover:bg-trade-surface2'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Main Markets Table */}
      <div className="bg-trade-surface border border-trade-border rounded-2xl overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-num">
            <thead>
              <tr className="border-b border-trade-border bg-trade-surface2/70 text-[11px] font-bold text-trade-subtle uppercase tracking-wider font-sans select-none">
                <th className="py-3 px-4 w-12 text-center">★</th>
                <th 
                  onClick={() => handleSort('name')}
                  className="py-3 px-4 cursor-pointer hover:text-trade-text"
                >
                  <div className="flex items-center gap-1">
                    <span>Asset / Exchange</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('price')}
                  className="py-3 px-4 text-right cursor-pointer hover:text-trade-text"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Price</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('change')}
                  className="py-3 px-4 text-right cursor-pointer hover:text-trade-text"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>24h Change</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('volume')}
                  className="py-3 px-4 text-right hidden sm:table-cell cursor-pointer hover:text-trade-text"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Volume</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right hidden md:table-cell">24h High / Low</th>
                <th 
                  onClick={() => handleSort('marketCap')}
                  className="py-3 px-4 text-right hidden lg:table-cell cursor-pointer hover:text-trade-text"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Market Cap</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center hidden xl:table-cell">24h Trend</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-trade-border/40">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-trade-muted font-sans">
                    No matching assets found in this market category.
                  </td>
                </tr>
              ) : (
                filteredAssets.map(asset => {
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
                      {/* Watchlist toggle */}
                      <td 
                        className="py-3.5 px-4 text-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWatchlist(asset.symbol);
                        }}
                      >
                        <button className="text-trade-subtle hover:text-amber-400 transition-colors">
                          <Bookmark className={`w-4 h-4 ${isWatchlisted(asset.symbol) ? 'fill-amber-400 text-amber-400' : ''}`} />
                        </button>
                      </td>

                      {/* Asset Symbol & Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-trade-surface3 border border-trade-border flex items-center justify-center font-bold text-xs text-trade-primary shrink-0">
                            {asset.symbol.slice(0, 3)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 font-bold text-trade-text group-hover:text-trade-primary transition-colors">
                              <span>{asset.symbol}</span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-trade-surface3 border border-trade-border text-trade-subtle uppercase">
                                {asset.exchange}
                              </span>
                            </div>
                            <div className="text-[11px] text-trade-subtle truncate max-w-[160px] font-sans">
                              {asset.name}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-bold text-sm text-trade-text">
                          {currSymbol}{formatPrice(asset.price, asset.assetType)}
                        </span>
                      </td>

                      {/* 24h Change */}
                      <td className="py-3.5 px-4 text-right">
                        <div className={`font-semibold flex items-center justify-end gap-1 ${
                          isPos ? 'text-trade-positive' : 'text-trade-negative'
                        }`}>
                          {isPos ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                          <span>{formatPercent(asset.changePercent)}</span>
                        </div>
                        <div className="text-[10px] text-trade-subtle">
                          {currSymbol}{formatPrice(asset.change, asset.assetType)}
                        </div>
                      </td>

                      {/* Volume */}
                      <td className="py-3.5 px-4 text-right hidden sm:table-cell text-trade-text">
                        {formatVolume(asset.volume || asset.quoteVolume || 1200000)}
                      </td>

                      {/* 24h High / Low */}
                      <td className="py-3.5 px-4 text-right hidden md:table-cell text-trade-subtle">
                        <div>H: {currSymbol}{formatPrice(asset.high || asset.price * 1.02, asset.assetType)}</div>
                        <div>L: {currSymbol}{formatPrice(asset.low || asset.price * 0.98, asset.assetType)}</div>
                      </td>

                      {/* Market Cap */}
                      <td className="py-3.5 px-4 text-right hidden lg:table-cell text-trade-text">
                        {formatMarketCap(asset.marketCap, asset.assetType)}
                      </td>

                      {/* 24h Sparkline */}
                      <td className="py-3.5 px-4 text-center hidden xl:table-cell">
                        <div className="flex justify-center">
                          <Sparkline data={asset.sparkline} isPositive={isPos} width={90} height={26} />
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <Badge variant={asset.tradingStatus === 'LIVE' ? 'live' : 'demo'} size="xs">
                          {asset.tradingStatus}
                        </Badge>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openTerminalFor(asset.symbol);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-trade-surface3 hover:bg-trade-primary text-trade-text hover:text-white border border-trade-border transition-all text-xs font-semibold font-sans"
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
    </div>
  );
};
