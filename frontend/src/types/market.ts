export type AssetType = 'crypto' | 'stock' | 'indian_stock' | 'index' | 'forex' | 'commodity' | 'etf';

export interface MarketAsset {
  symbol: string;
  name: string;
  rawSymbol: string;
  assetType: AssetType | string;
  assetTypeString?: string;
  price: number;
  change: number;
  changePercent: number;
  open?: number;
  high?: number;
  low?: number;
  previousClose?: number;
  volume?: number;
  quoteVolume?: number;
  marketCap?: number;
  bid?: number;
  ask?: number;
  spread?: number;
  pe?: number;
  eps?: number;
  sector?: string;
  exchange: string;
  tradingStatus: 'LIVE' | 'DEMO' | 'CLOSED' | string;
  dataSource: string;
  timestamp: string;
  sparkline: number[];
}

export interface CandleStick {
  time: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface OrderBookLevel {
  price: number;
  amount: number;
  total: number;
}

export interface OrderBook {
  symbol: string;
  timestamp: string;
  asks: OrderBookLevel[];
  bids: OrderBookLevel[];
  spread: number;
  midPrice: number;
}

export interface Trade {
  id: string;
  symbol: string;
  price: number;
  amount: number;
  side: 'BUY' | 'SELL';
  timestamp: string;
}

export interface MarketPulseCard {
  id: string;
  title: string;
  primarySymbol: string;
  currentValue: string;
  changePercent: number;
  status: string;
  sparkline: number[];
  sentiment: string;
}

export interface MarketPulse {
  globalStatus: string;
  fearAndGreedIndex: number;
  fearAndGreedLabel: string;
  total24hVolumeUsd: number;
  gainersCount: number;
  losersCount: number;
  pulseCards: MarketPulseCard[];
}

export interface ConnectionStatus {
  provider: string;
  status: 'LIVE' | 'CONNECTING' | 'DISCONNECTED' | 'RECONNECTING';
  latencyMs: number;
  lastUpdate: string;
  activeStreams: number;
  mode: string;
  endpoint: string;
}

export interface MarketScannerItem {
  symbol: string;
  name: string;
  assetType: string;
  price: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  rsi: number;
  volatility: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME' | string;
  trend: string;
  signal: string;
  ema20Distance: number;
}

export interface TechnicalFactor {
  name: string;
  value: string;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
}

export interface AiInsight {
  symbol: string;
  name: string;
  trend: string;
  momentum: string;
  volatility: string;
  marketRegime: string;
  aiConfidence: number;
  signal: string;
  supportLevel: number;
  resistanceLevel: number;
  targetPrice: number;
  stopLossLevel: number;
  reasoning: string[];
  factors: TechnicalFactor[];
  disclaimer: string;
  generatedAt: string;
}

export interface AlertItem {
  id: string;
  symbol: string;
  condition: 'GREATER_THAN' | 'LESS_THAN' | 'RSI_ABOVE' | 'RSI_BELOW' | 'CHANGE_PERCENT_ABOVE';
  targetValue: number;
  currentValue: number;
  status: 'ACTIVE' | 'TRIGGERED' | 'DISABLED';
  createdAt: string;
  triggeredAt?: string;
  note: string;
}

export interface Holding {
  symbol: string;
  name: string;
  assetType: string;
  quantity: number;
  avgBuyPrice: number;
  currentPrice: number;
  marketValue: number;
  totalCost: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  allocationPercent: number;
}

export interface PortfolioHistoryPoint {
  date: string;
  value: number;
  pnl: number;
}

export interface Portfolio {
  mode: string;
  accountName: string;
  totalPortfolioValue: number;
  availableCash: number;
  investedValue: number;
  todayPnL: number;
  todayPnLPercent: number;
  allTimePnL: number;
  allTimePnLPercent: number;
  holdings: Holding[];
  performanceHistory: PortfolioHistoryPoint[];
}

// Broker & Connected Wallet Types
export interface BrokerWalletCoin {
  coin: string;
  name: string;
  free: number;
  locked: number;
  total: number;
  usdValue: number;
  change24h: number;
  iconBg?: string;
}

export interface BrokerAccount {
  id: 'binance' | 'coinbase' | 'interactive_brokers' | 'zerodha' | 'robinhood' | 'metatrader' | 'simulation' | string;
  name: string;
  category: string;
  tagline: string;
  logoType: string;
  badge: string;
  accentColor: string;
  status: 'CONNECTED' | 'READY' | 'SANDBOX';
  latency: string;
  accountId: string;
  accountType: string;
  vipLevel: string;
  totalBalanceUsd: number;
  totalBalanceBtc: number;
  spotBalance: number;
  futuresBalance: number;
  fundingBalance: number;
  todayPnl: number;
  todayPnlPercent: number;
  walletCoins: BrokerWalletCoin[];
  apiStatus?: {
    isReadOnly: boolean;
    canTrade: boolean;
    canWithdraw: boolean;
    ipWhitelist: boolean;
    lastSynced: string;
  };
}

export interface BinanceAccountSummary {
  isConnected: boolean;
  accountType: string;
  accountId: string;
  canTrade: boolean;
  canWithdraw: boolean;
  canDeposit: boolean;
  updateTime: number;
  totalBalanceUsd: number;
  totalBalanceBtc: number;
  spotBalanceUsd: number;
  futuresEstimatedUsd: number;
  todayPnlUsd: number;
  todayPnlPercent: number;
  balances: Array<{
    asset: string;
    name: string;
    free: number;
    locked: number;
    total: number;
    estimatedUsdValue: number;
    change24h: number;
    iconBg: string;
  }>;
  maskedApiKey: string;
  message: string;
  isRealLiveSync: boolean;
}

export interface BrokerConnectRequest {
  brokerId: string;
  apiKey: string;
  secretKey: string;
  requestToken?: string;
  accountId?: string;
  password?: string;
  server?: string;
  isTestnet?: boolean;
}

export interface BrokerHoldingItem {
  symbol: string;
  name: string;
  assetType: string;
  quantity: number;
  avgPrice: number;
  lastPrice: number;
  marketValue: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  currency: string;
  exchange: string;
}

export interface UnifiedBrokerAccount {
  brokerId: string;
  name: string;
  category: string;
  accountId: string;
  accountType: string;
  status: string;
  isRealLiveSync: boolean;
  maskedApiKey: string;
  currency: string;
  totalBalance: number;
  totalBalanceUsd: number;
  availableCash: number;
  marginUsed: number;
  todayPnl: number;
  todayPnlPercent: number;
  holdings: BrokerHoldingItem[];
  message: string;
  officialLoginUrl: string;
  apiDocsUrl: string;
}

export interface PaperTradeOrderRequest {
  symbol: string;
  side: 'BUY' | 'SELL';
  orderType: 'MARKET' | 'LIMIT' | 'STOP_LOSS';
  quantity: number;
  limitPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  leverage?: number;
}

export interface PaperPosition {
  id: string;
  symbol: string;
  name: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  marginUsed: number;
  leverage: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  stopLoss?: number;
  takeProfit?: number;
  liquidationPrice?: number;
  openedAt: string;
}

export interface PaperOrder {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  orderType: 'LIMIT' | 'MARKET' | 'STOP_LOSS';
  quantity: number;
  targetPrice: number;
  status: 'OPEN' | 'FILLED' | 'CANCELLED';
  placedAt: string;
}

export interface PaperClosedTrade {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  entryPrice: number;
  exitPrice: number;
  realizedPnl: number;
  realizedPnlPercent: number;
  closeReason?: 'MANUAL' | 'STOP_LOSS' | 'TAKE_PROFIT' | 'LIQUIDATION' | string;
  openedAt: string;
  closedAt: string;
}

export interface PaperNotification {
  type: 'STOP_LOSS' | 'TAKE_PROFIT' | 'LIQUIDATION' | 'ORDER_FILLED' | 'INFO' | string;
  title: string;
  message: string;
  symbol: string;
  pnl?: number;
  timestamp: string;
}

export interface PaperAccountSummary {
  virtualCash: number;
  totalPortfolioValue: number;
  marginUsed: number;
  unrealizedPnl: number;
  realizedPnl: number;
  totalTrades: number;
  winningTrades: number;
  winRate: number;
  positions: PaperPosition[];
  openOrders: PaperOrder[];
  tradeHistory: PaperClosedTrade[];
}


