import { 
  MarketAsset, 
  MarketPulse, 
  MarketScannerItem, 
  CandleStick, 
  OrderBook, 
  Trade, 
  AiInsight, 
  Portfolio, 
  AlertItem, 
  ConnectionStatus 
} from '../types/market';

const API_BASE = '/api';

export const api = {
  async getMarkets(type?: string, search?: string): Promise<MarketAsset[]> {
    const params = new URLSearchParams();
    if (type && type !== 'all') params.append('type', type);
    if (search) params.append('search', search);
    
    const res = await fetch(`${API_BASE}/markets?${params.toString()}`);
    if (!res.ok) throw new Error(`Failed to fetch markets: ${res.statusText}`);
    return res.json();
  },

  async getMarketPulse(): Promise<MarketPulse> {
    const res = await fetch(`${API_BASE}/markets/pulse`);
    if (!res.ok) throw new Error(`Failed to fetch pulse: ${res.statusText}`);
    return res.json();
  },

  async getScanner(preset: string = 'gainers'): Promise<MarketScannerItem[]> {
    const res = await fetch(`${API_BASE}/markets/scanner?preset=${encodeURIComponent(preset)}`);
    if (!res.ok) throw new Error(`Failed to fetch scanner: ${res.statusText}`);
    return res.json();
  },

  async getConnectionStatus(): Promise<ConnectionStatus> {
    const res = await fetch(`${API_BASE}/markets/connection-status`);
    if (!res.ok) throw new Error(`Failed to fetch connection status: ${res.statusText}`);
    return res.json();
  },

  async getAsset(symbol: string): Promise<MarketAsset> {
    const res = await fetch(`${API_BASE}/asset/${encodeURIComponent(symbol)}`);
    if (!res.ok) throw new Error(`Failed to fetch asset: ${res.statusText}`);
    return res.json();
  },

  async getCandles(symbol: string, timeframe: string = '1h'): Promise<CandleStick[]> {
    const res = await fetch(`${API_BASE}/asset/${encodeURIComponent(symbol)}/candles?timeframe=${encodeURIComponent(timeframe)}`);
    if (!res.ok) throw new Error(`Failed to fetch candles: ${res.statusText}`);
    return res.json();
  },

  async getOrderBook(symbol: string): Promise<OrderBook> {
    const res = await fetch(`${API_BASE}/asset/${encodeURIComponent(symbol)}/orderbook`);
    if (!res.ok) throw new Error(`Failed to fetch orderbook: ${res.statusText}`);
    return res.json();
  },

  async getTrades(symbol: string): Promise<Trade[]> {
    const res = await fetch(`${API_BASE}/asset/${encodeURIComponent(symbol)}/trades`);
    if (!res.ok) throw new Error(`Failed to fetch trades: ${res.statusText}`);
    return res.json();
  },

  async getAiInsight(symbol: string): Promise<AiInsight> {
    const res = await fetch(`${API_BASE}/asset/${encodeURIComponent(symbol)}/ai-insight`);
    if (!res.ok) throw new Error(`Failed to fetch AI insight: ${res.statusText}`);
    return res.json();
  },

  async getPortfolio(): Promise<Portfolio> {
    const res = await fetch(`${API_BASE}/portfolio`);
    if (!res.ok) throw new Error(`Failed to fetch portfolio: ${res.statusText}`);
    return res.json();
  },

  async getWatchlistGroups(): Promise<Record<string, MarketAsset[]>> {
    const res = await fetch(`${API_BASE}/watchlist`);
    if (!res.ok) throw new Error(`Failed to fetch watchlist: ${res.statusText}`);
    return res.json();
  },

  async getAlerts(): Promise<AlertItem[]> {
    const res = await fetch(`${API_BASE}/alerts`);
    if (!res.ok) throw new Error(`Failed to fetch alerts: ${res.statusText}`);
    return res.json();
  },

  async createAlert(alert: Partial<AlertItem>): Promise<AlertItem> {
    const res = await fetch(`${API_BASE}/alerts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alert),
    });
    if (!res.ok) throw new Error(`Failed to create alert: ${res.statusText}`);
    return res.json();
  },

  async deleteAlert(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/alerts/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`Failed to delete alert: ${res.statusText}`);
  },

  async getBinanceAccount(apiKey?: string, secretKey?: string, isTestnet?: boolean) {
    const params = new URLSearchParams();
    if (apiKey) params.append('apiKey', apiKey);
    if (secretKey) params.append('secretKey', secretKey);
    if (isTestnet) params.append('isTestnet', 'true');
    const res = await fetch(`${API_BASE}/binance/account?${params.toString()}`);
    if (!res.ok) throw new Error(`Failed to fetch Binance account: ${res.statusText}`);
    return res.json();
  },

  async connectBinanceAccount(apiKey: string, secretKey: string, isTestnet: boolean = false) {
    const res = await fetch(`${API_BASE}/binance/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey, secretKey, isTestnet }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to connect Binance account');
    }
    return data;
  }
};
