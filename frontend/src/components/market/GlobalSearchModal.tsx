import React, { useState, useEffect, useRef } from 'react';
import { Search, X, TrendingUp, TrendingDown, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { useMarket } from '../../context/MarketContext';
import { formatPrice, formatPercent, formatCurrencySymbol } from '../../utils/formatters';
import { Badge } from '../common/Badge';

export const GlobalSearchModal: React.FC = () => {
  const { isSearchOpen, setIsSearchOpen, assets, openTerminalFor } = useMarket();
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, setIsSearchOpen]);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isSearchOpen]);

  if (!isSearchOpen) return null;

  const categories = [
    { id: 'all', label: 'All Markets' },
    { id: 'crypto', label: 'Crypto' },
    { id: 'stock', label: 'US Stocks' },
    { id: 'indian_stock', label: 'India NSE' },
    { id: 'index', label: 'Indices' },
    { id: 'forex', label: 'Forex' },
    { id: 'commodity', label: 'Commodities' },
    { id: 'etf', label: 'ETFs' },
  ];

  const filteredAssets = assets.filter(asset => {
    const matchesCategory = selectedCategory === 'all' || 
      asset.assetType === selectedCategory || 
      asset.assetTypeString === selectedCategory;

    const q = query.trim().toLowerCase();
    if (!q) return matchesCategory;

    const matchesQuery = 
      asset.symbol.toLowerCase().includes(q) ||
      asset.name.toLowerCase().includes(q) ||
      (asset.sector && asset.sector.toLowerCase().includes(q)) ||
      asset.exchange.toLowerCase().includes(q);

    return matchesCategory && matchesQuery;
  });

  const handleSelectAsset = (symbol: string) => {
    setIsSearchOpen(false);
    openTerminalFor(symbol);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-black/75 backdrop-blur-md transition-all">
      <div 
        className="w-full max-w-2xl bg-trade-surface border border-trade-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="flex items-center px-4 py-3.5 border-b border-trade-border gap-3 bg-trade-surface2/60">
          <Search className="w-5 h-5 text-trade-primary shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search symbols, crypto, US stocks, Indian NSE, forex, ETFs... (e.g. BTC, NVDA, RELIANCE)"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-transparent text-trade-text placeholder:text-trade-subtle focus:outline-none text-base font-medium"
          />
          <button 
            onClick={() => setIsSearchOpen(false)}
            className="p-1 rounded-lg hover:bg-trade-surface3 text-trade-muted hover:text-trade-text transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-trade-border/60 overflow-x-auto text-xs bg-trade-surface/80 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-trade-primary text-white shadow-glow-primary'
                  : 'text-trade-muted hover:text-trade-text hover:bg-trade-surface2'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Results List */}
        <div className="max-h-[380px] overflow-y-auto divide-y divide-trade-border/40 p-1">
          {filteredAssets.length === 0 ? (
            <div className="py-12 text-center text-trade-muted">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-40 text-trade-primary" />
              <p className="text-sm font-medium">No matching assets found for "{query}"</p>
              <p className="text-xs text-trade-subtle mt-1">Try searching by ticker, company name, or asset class</p>
            </div>
          ) : (
            filteredAssets.slice(0, 15).map(asset => {
              const isPos = asset.changePercent >= 0;
              const currSymbol = formatCurrencySymbol(asset.assetType, asset.exchange);

              return (
                <div
                  key={asset.symbol}
                  onClick={() => handleSelectAsset(asset.symbol)}
                  className="flex items-center justify-between px-3.5 py-2.5 hover:bg-trade-surface2/80 rounded-xl cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-trade-surface3 border border-trade-border flex items-center justify-center font-bold text-xs text-trade-primary font-num shrink-0">
                      {asset.symbol.slice(0, 3)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-trade-text text-sm group-hover:text-trade-primary transition-colors">
                          {asset.symbol}
                        </span>
                        <span className="text-xs text-trade-subtle truncate max-w-[140px] md:max-w-[200px]">
                          {asset.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-trade-surface3 border border-trade-border text-trade-subtle uppercase">
                          {asset.exchange}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-trade-subtle mt-0.5">
                        <span className="capitalize">{asset.assetTypeString || asset.assetType}</span>
                        {asset.sector && <span>• {asset.sector}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right shrink-0">
                    <div>
                      <div className="font-num text-sm font-semibold text-trade-text">
                        {currSymbol}{formatPrice(asset.price, asset.assetType)}
                      </div>
                      <div className={`font-num text-xs font-medium flex items-center justify-end gap-0.5 ${
                        isPos ? 'text-trade-positive' : 'text-trade-negative'
                      }`}>
                        {isPos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {formatPercent(asset.changePercent)}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-trade-muted group-hover:text-trade-primary group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Search Footer */}
        <div className="flex items-center justify-between px-4 py-2 bg-trade-surface2/40 border-t border-trade-border/60 text-[11px] text-trade-subtle">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-trade-surface3 border border-trade-border font-mono text-[10px]">↑↓</kbd> Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-trade-surface3 border border-trade-border font-mono text-[10px]">Enter</kbd> Open Terminal
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-trade-surface3 border border-trade-border font-mono text-[10px]">Esc</kbd> Close
            </span>
          </div>
          <span className="text-trade-primary/80 font-medium">TRADE.AI Engine</span>
        </div>
      </div>
    </div>
  );
};
