import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { MarketAsset, MarketPulse, ConnectionStatus, AlertItem, BrokerAccount } from '../types/market';
import { api } from '../services/api';
import { signalRClient } from '../services/signalr';
import { BROKERS_DATA } from '../data/brokersData';

export type PageId = 'landing' | 'wallet' | 'dashboard' | 'markets' | 'terminal' | 'watchlist' | 'scanner' | 'portfolio' | 'ai-insights' | 'alerts' | 'settings';

interface MarketContextType {
  assets: MarketAsset[];
  assetsMap: Map<string, MarketAsset>;
  activeAssetSymbol: string;
  activeAsset: MarketAsset | null;
  activePage: PageId;
  activeBroker: string;
  brokersList: BrokerAccount[];
  activeBrokerAccount: BrokerAccount;
  marketPulse: MarketPulse | null;
  connectionStatus: ConnectionStatus;
  watchlistSymbols: string[];
  alerts: AlertItem[];
  searchQuery: string;
  isSearchOpen: boolean;
  isSoundEnabled: boolean;
  density: 'comfortable' | 'compact';
  flashMap: Record<string, 'up' | 'down'>;
  isLoading: boolean;
  
  setActiveAssetSymbol: (symbol: string) => void;
  setActivePage: (page: PageId) => void;
  setActiveBrokerId: (brokerId: string) => void;
  selectBrokerAndOpenWallet: (brokerId: string) => void;
  openTerminalFor: (symbol: string) => void;
  toggleWatchlist: (symbol: string) => void;
  isWatchlisted: (symbol: string) => boolean;
  setSearchQuery: (query: string) => void;
  setIsSearchOpen: (open: boolean) => void;
  setIsSoundEnabled: (enabled: boolean | ((prev: boolean) => boolean)) => void;
  setDensity: (density: 'comfortable' | 'compact') => void;
  addAlert: (alert: Partial<AlertItem>) => Promise<void>;
  deleteAlert: (id: string) => Promise<void>;
  refreshMarkets: () => Promise<void>;
}

const defaultConnectionStatus: ConnectionStatus = {
  provider: 'Binance & Multi-Asset Feed',
  status: 'LIVE',
  latencyMs: 38,
  lastUpdate: new Date().toISOString(),
  activeStreams: 24,
  mode: 'HYBRID_LIVE',
  endpoint: 'wss://stream.binance.com:9443/stream'
};

const MarketContext = createContext<MarketContextType | undefined>(undefined);

export const MarketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [assets, setAssets] = useState<MarketAsset[]>([]);
  const [activeAssetSymbol, setActiveAssetSymbol] = useState<string>('BTC/USDT');
  const [activePage, setActivePage] = useState<PageId>('landing'); // Default start at broker selection landing page
  const [activeBroker, setActiveBroker] = useState<string>('binance');
  const [brokersList] = useState<BrokerAccount[]>(BROKERS_DATA);
  const [marketPulse, setMarketPulse] = useState<MarketPulse | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(defaultConnectionStatus);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(false);
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [flashMap, setFlashMap] = useState<Record<string, 'up' | 'down'>>({});

  const [watchlistSymbols, setWatchlistSymbols] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('trade_ai_watchlist');
      if (saved) return JSON.parse(saved);
    } catch {}
    return ['BTC/USDT', 'ETH/USDT', 'NVDA', 'AAPL', 'RELIANCE', 'Gold', 'SPY'];
  });

  const audioContextRef = useRef<AudioContext | null>(null);

  const playChime = useCallback((type: 'up' | 'down') => {
    if (!isSoundEnabled) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(type === 'up' ? 880 : 440, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch {}
  }, [isSoundEnabled]);

  const loadInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [marketsData, pulseData, alertsData] = await Promise.allSettled([
        api.getMarkets('all'),
        api.getMarketPulse(),
        api.getAlerts()
      ]);

      if (marketsData.status === 'fulfilled' && marketsData.value.length > 0) {
        setAssets(marketsData.value);
      }
      if (pulseData.status === 'fulfilled') {
        setMarketPulse(pulseData.value);
      }
      if (alertsData.status === 'fulfilled') {
        setAlerts(alertsData.value);
      }
    } catch (err) {
      console.warn('Initial data load error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    try {
      localStorage.setItem('trade_ai_watchlist', JSON.stringify(watchlistSymbols));
    } catch {}
  }, [watchlistSymbols]);

  // Real-Time SignalR Subscription
  useEffect(() => {
    signalRClient.connect();

    const unsubTicker = signalRClient.onTicker((updatedAsset) => {
      setAssets(prev => {
        const index = prev.findIndex(a => 
          a.symbol.toLowerCase() === updatedAsset.symbol.toLowerCase() ||
          a.rawSymbol?.toLowerCase() === updatedAsset.rawSymbol?.toLowerCase() ||
          a.symbol.replace('/', '').toLowerCase() === updatedAsset.symbol.replace('/', '').toLowerCase()
        );

        if (index >= 0) {
          const old = prev[index];
          const direction = updatedAsset.price > old.price ? 'up' : (updatedAsset.price < old.price ? 'down' : null);
          
          if (direction) {
            setFlashMap(f => ({ ...f, [updatedAsset.symbol]: direction }));
            setTimeout(() => {
              setFlashMap(f => {
                const next = { ...f };
                delete next[updatedAsset.symbol];
                return next;
              });
            }, 700);

            if (updatedAsset.symbol === activeAssetSymbol) {
              playChime(direction);
            }
          }

          const nextList = [...prev];
          nextList[index] = {
            ...old,
            ...updatedAsset,
            name: old.name || updatedAsset.name,
            sector: old.sector || updatedAsset.sector,
            marketCap: updatedAsset.marketCap || old.marketCap,
            sparkline: old.sparkline?.length ? [...old.sparkline.slice(-29), updatedAsset.price] : [updatedAsset.price]
          };
          return nextList;
        } else {
          return [updatedAsset, ...prev];
        }
      });
    });

    const unsubStatus = signalRClient.onStatus((status) => {
      setConnectionStatus(status);
    });

    return () => {
      unsubTicker();
      unsubStatus();
    };
  }, [activeAssetSymbol, playChime]);

  const assetsMap = React.useMemo(() => {
    const map = new Map<string, MarketAsset>();
    assets.forEach(a => {
      map.set(a.symbol.toUpperCase(), a);
      map.set(a.symbol.replace('/', '').toUpperCase(), a);
      if (a.rawSymbol) map.set(a.rawSymbol.toUpperCase(), a);
    });
    return map;
  }, [assets]);

  const activeAsset = React.useMemo(() => {
    return assetsMap.get(activeAssetSymbol.toUpperCase()) ||
           assetsMap.get(activeAssetSymbol.replace('/', '').toUpperCase()) ||
           assets[0] || null;
  }, [assetsMap, activeAssetSymbol, assets]);

  const activeBrokerAccount = React.useMemo(() => {
    return (brokersList || []).find(b => b.id === activeBroker) || brokersList?.[0] || BROKERS_DATA[0];
  }, [brokersList, activeBroker]);

  const selectBrokerAndOpenWallet = useCallback((brokerId: string) => {
    setActiveBroker(brokerId);
    setActivePage('wallet');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const setActiveBrokerId = useCallback((brokerId: string) => {
    setActiveBroker(brokerId);
  }, []);

  const toggleWatchlist = useCallback((symbol: string) => {
    setWatchlistSymbols(prev => {
      if (prev.includes(symbol)) {
        return prev.filter(s => s !== symbol);
      } else {
        return [...prev, symbol];
      }
    });
  }, []);

  const isWatchlisted = useCallback((symbol: string) => {
    return watchlistSymbols.includes(symbol);
  }, [watchlistSymbols]);

  const openTerminalFor = useCallback((symbol: string) => {
    setActiveAssetSymbol(symbol);
    setActivePage('terminal');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const addAlert = useCallback(async (alertData: Partial<AlertItem>) => {
    try {
      const created = await api.createAlert(alertData);
      setAlerts(prev => [created, ...prev]);
    } catch {
      const localAlert: AlertItem = {
        id: `alert-${Date.now()}`,
        symbol: alertData.symbol || 'BTC/USDT',
        condition: alertData.condition || 'GREATER_THAN',
        targetValue: alertData.targetValue || 0,
        currentValue: alertData.currentValue || 0,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        note: alertData.note || 'Custom user alert'
      };
      setAlerts(prev => [localAlert, ...prev]);
    }
  }, []);

  const deleteAlert = useCallback(async (id: string) => {
    try {
      await api.deleteAlert(id);
    } catch {}
    setAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  const refreshMarkets = useCallback(async () => {
    await loadInitialData();
  }, [loadInitialData]);

  return (
    <MarketContext.Provider
      value={{
        assets,
        assetsMap,
        activeAssetSymbol,
        activeAsset,
        activePage,
        activeBroker,
        brokersList,
        activeBrokerAccount,
        marketPulse,
        connectionStatus,
        watchlistSymbols,
        alerts,
        searchQuery,
        isSearchOpen,
        isSoundEnabled,
        density,
        flashMap,
        isLoading,
        setActiveAssetSymbol,
        setActivePage,
        setActiveBrokerId,
        selectBrokerAndOpenWallet,
        openTerminalFor,
        toggleWatchlist,
        isWatchlisted,
        setSearchQuery,
        setIsSearchOpen,
        setIsSoundEnabled,
        setDensity,
        addAlert,
        deleteAlert,
        refreshMarkets
      }}
    >
      {children}
    </MarketContext.Provider>
  );
};

export const useMarket = () => {
  const context = useContext(MarketContext);
  if (!context) {
    throw new Error('useMarket must be used within a MarketProvider');
  }
  return context;
};
