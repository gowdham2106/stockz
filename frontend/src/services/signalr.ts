import { MarketAsset, OrderBook, Trade, ConnectionStatus, PaperAccountSummary, PaperNotification } from '../types/market';

type TickerCallback = (asset: MarketAsset) => void;
type OrderBookCallback = (orderBook: OrderBook) => void;
type TradeCallback = (trade: Trade) => void;
type ConnectionStatusCallback = (status: ConnectionStatus) => void;
type PaperAccountCallback = (summary: PaperAccountSummary) => void;
type PaperNotificationCallback = (notification: PaperNotification) => void;

class RealtimeMarketClient {
  private ws: WebSocket | null = null;
  private tickerListeners: Set<TickerCallback> = new Set();
  private symbolPriceListeners: Map<string, Set<TickerCallback>> = new Map();
  private orderBookListeners: Map<string, Set<OrderBookCallback>> = new Map();
  private tradeListeners: Map<string, Set<TradeCallback>> = new Map();
  private statusListeners: Set<ConnectionStatusCallback> = new Set();
  private paperAccountListeners: Set<PaperAccountCallback> = new Set();
  private paperNotificationListeners: Set<PaperNotificationCallback> = new Set();
  private isConnecting: boolean = false;
  private reconnectTimer: any = null;
  private pingInterval: any = null;

  public connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    if (this.isConnecting) return;
    this.isConnecting = true;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws/market`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnecting = false;
        this.notifyStatus({
          provider: 'Python FastAPI & Binance Feed',
          status: 'LIVE',
          latencyMs: 18,
          lastUpdate: new Date().toISOString(),
          activeStreams: 24,
          mode: 'HYBRID_LIVE',
          endpoint: '/ws/market'
        });

        // Re-subscribe all registered symbols
        this.resubscribeAll();

        // Heartbeat ping
        if (this.pingInterval) clearInterval(this.pingInterval);
        this.pingInterval = setInterval(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ action: 'ping' }));
          }
        }, 15000);
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          const type = msg.type;
          const data = msg.data;

          if (type === 'TickerUpdated' && data) {
            this.tickerListeners.forEach(cb => cb(data));
          } else if (type === 'PriceUpdated' && data) {
            const key = this.normalizeSymbol(data.symbol);
            const callbacks = this.symbolPriceListeners.get(key);
            if (callbacks) {
              callbacks.forEach(cb => cb(data));
            }
            this.tickerListeners.forEach(cb => cb(data));
          } else if (type === 'OrderBookUpdated' && data) {
            const key = this.normalizeSymbol(data.symbol);
            const callbacks = this.orderBookListeners.get(key);
            if (callbacks) {
              callbacks.forEach(cb => cb(data));
            }
          } else if (type === 'TradeUpdated' && data) {
            const key = this.normalizeSymbol(data.symbol);
            const callbacks = this.tradeListeners.get(key);
            if (callbacks) {
              callbacks.forEach(cb => cb(data));
            }
          } else if (type === 'ConnectionStatusChanged' && data) {
            this.statusListeners.forEach(cb => cb(data));
          } else if (type === 'PaperAccountUpdated' && data) {
            this.paperAccountListeners.forEach(cb => cb(data));
          } else if (type === 'PaperNotification' && data) {
            this.paperNotificationListeners.forEach(cb => cb(data));
          }
        } catch (err) {
          console.warn('WS message parse error:', err);
        }
      };

      this.ws.onclose = () => {
        this.isConnecting = false;
        if (this.pingInterval) clearInterval(this.pingInterval);
        this.notifyStatus({
          provider: 'FastAPI Stream (Reconnecting)',
          status: 'RECONNECTING',
          latencyMs: 0,
          lastUpdate: new Date().toISOString(),
          activeStreams: 0,
          mode: 'RECONNECTING',
          endpoint: '/ws/market'
        });

        // Auto-reconnect in 2s
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => {
          this.connect();
        }, 2000);
      };

      this.ws.onerror = () => {
        this.isConnecting = false;
      };

    } catch (err) {
      this.isConnecting = false;
      console.warn('WebSocket connection attempt failed:', err);
    }
  }

  public onTicker(callback: TickerCallback): () => void {
    this.tickerListeners.add(callback);
    return () => this.tickerListeners.delete(callback);
  }

  public onStatus(callback: ConnectionStatusCallback): () => void {
    this.statusListeners.add(callback);
    return () => this.statusListeners.delete(callback);
  }

  public onPaperAccount(callback: PaperAccountCallback): () => void {
    this.paperAccountListeners.add(callback);
    return () => this.paperAccountListeners.delete(callback);
  }

  public onPaperNotification(callback: PaperNotificationCallback): () => void {
    this.paperNotificationListeners.add(callback);
    return () => this.paperNotificationListeners.delete(callback);
  }

  public subscribeSymbol(symbol: string, onPrice: TickerCallback, onOrderBook?: OrderBookCallback, onTrade?: TradeCallback): () => void {
    const key = this.normalizeSymbol(symbol);

    if (!this.symbolPriceListeners.has(key)) {
      this.symbolPriceListeners.set(key, new Set());
    }
    this.symbolPriceListeners.get(key)!.add(onPrice);

    if (onOrderBook) {
      if (!this.orderBookListeners.has(key)) {
        this.orderBookListeners.set(key, new Set());
      }
      this.orderBookListeners.get(key)!.add(onOrderBook);
    }

    if (onTrade) {
      if (!this.tradeListeners.has(key)) {
        this.tradeListeners.set(key, new Set());
      }
      this.tradeListeners.get(key)!.add(onTrade);
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ action: 'subscribe', symbol }));
    }

    return () => {
      this.symbolPriceListeners.get(key)?.delete(onPrice);
      if (onOrderBook) this.orderBookListeners.get(key)?.delete(onOrderBook);
      if (onTrade) this.tradeListeners.get(key)?.delete(onTrade);

      const hasRemaining = (this.symbolPriceListeners.get(key)?.size || 0) +
                           (this.orderBookListeners.get(key)?.size || 0) +
                           (this.tradeListeners.get(key)?.size || 0);

      if (hasRemaining === 0) {
        this.symbolPriceListeners.delete(key);
        this.orderBookListeners.delete(key);
        this.tradeListeners.delete(key);
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ action: 'unsubscribe', symbol }));
        }
      }
    };
  }

  private resubscribeAll() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const allSymbols = new Set([
      ...this.symbolPriceListeners.keys(),
      ...this.orderBookListeners.keys(),
      ...this.tradeListeners.keys()
    ]);

    allSymbols.forEach(sym => {
      this.ws?.send(JSON.stringify({ action: 'subscribe', symbol: sym }));
    });
  }

  private notifyStatus(status: ConnectionStatus) {
    this.statusListeners.forEach(cb => cb(status));
  }

  private normalizeSymbol(symbol: string): string {
    return symbol.replace('/', '').toUpperCase();
  }
}

export const signalRClient = new RealtimeMarketClient();
