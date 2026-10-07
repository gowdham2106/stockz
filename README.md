# TRADE.AI — Institutional-Grade Multi-Asset Real-Time Trading Terminal

> **High-Precision Multi-Asset Financial Market Intelligence & Real-Time Trading Terminal**  
> *Phase 1: Live Market Telemetry, Order Books, Technical Charting, SignalR Distribution, & Simulated Execution UI.*

---

## 🚀 Overview

`TRADE.AI` is an institutional-grade financial dashboard and real-time trading terminal built with **React, TypeScript, Vite, Tailwind CSS, TradingView Lightweight Charts, and ASP.NET Core .NET 8 Web API with SignalR**.

It connects directly to public exchange WebSocket feeds (such as **Binance Spot WebSocket**) on the backend, normalizes high-frequency market data, and streams unified telemetry down to the frontend using **SignalR Hubs**.

---

## 🏛 Architecture

```text
       ┌────────────────────────┐
       │   External Feeds       │
       │ (Binance WebSocket,    │
       │  Multi-Asset Gateway)  │
       └───────────┬────────────┘
                   │ WebSocket
                   ▼
       ┌────────────────────────┐
       │   .NET 8 Background    │
       │   Worker & Services    │
       └───────────┬────────────┘
                   │
                   ▼
       ┌────────────────────────┐
       │ Market Data Normalizer │
       │  (IMarketDataService)  │
       └───────────┬────────────┘
                   │ SignalR (/hubs/market)
                   ▼
       ┌────────────────────────┐
       │     React Frontend     │
       │  (Terminal & Charts)   │
       └────────────────────────┘
```

### 🔒 Security Guarantee
- **Zero API Secrets in Frontend**: No private exchange keys or withdrawal privileges are ever exposed to the client application.
- **Public Feeds Only**: Connects strictly to public read-only ticker, orderbook, and trade streams.
- **Real-Money Trading Safeguard**: Real order execution is deliberately decoupled and disabled in Phase 1. All order tickets are clearly watermarked as **PAPER TRADING SIMULATION**.

---

## 🌐 Supported Asset Classes

The terminal implements a normalized unified data model supporting:

| Asset Class | Symbols | Key Metrics & Telemetry |
| :--- | :--- | :--- |
| **Crypto** | `BTC/USDT`, `ETH/USDT`, `SOL/USDT`, `BNB/USDT`, `XRP/USDT`, `DOGE/USDT`, `ADA/USDT`, `AVAX/USDT`, `LINK/USDT` | **LIVE Binance WebSocket Stream**, Bid/Ask Spread, Order Book Depth, Real-Time Trades |
| **US Stocks** | `NVDA`, `AAPL`, `MSFT`, `AMZN`, `GOOGL`, `META`, `TSLA`, `AMD`, `NFLX`, `JPM` | Price, 24h Change, P/E, EPS, Volume, Market Cap, Sector |
| **Indian Stocks** | `RELIANCE`, `TCS`, `INFY`, `HDFCBANK`, `ICICIBANK`, `SBIN`, `ITC`, `LT`, `BHARTIARTL`, `MARUTI` | NSE/BSE Symbol structure, Rupee (₹) denomination, Market Cap |
| **Indices** | `NIFTY 50`, `BANK NIFTY`, `SENSEX`, `NASDAQ`, `S&P 500`, `DOW JONES`, `DAX`, `FTSE 100` | Benchmark points, Daily Change, High/Low range |
| **Forex** | `EUR/USD`, `GBP/USD`, `USD/JPY`, `USD/INR`, `AUD/USD` | 4-decimal Bid/Ask spreads, Session range |
| **Commodities** | `Gold (XAU/USD)`, `Silver (XAG/USD)`, `Crude Oil (WTI)`, `Brent Crude`, `Natural Gas` | Spot pricing, Volume, High/Low range |
| **ETFs** | `SPY`, `QQQ`, `VOO`, `VTI`, `GLD` | Total Assets, Volume, Daily Performance |

---

## 🖥 Terminal Features & Screens

1. **Dashboard & Market Pulse**:
   - Live Scrolling Ticker Marquee with real-time green/red price flash animations.
   - Market Pulse Cards with mini sparkline charts (Crypto, US Equities, Indian NSE/BSE, Global FX, Commodities).
   - Top Market Movers (Gainers, Losers, High Volume).
   - Institutional News Desk & AI Lab preview.

2. **Pro Trading Terminal (`AssetDetailPage`)**:
   - **High-Performance Candlestick & Volume Chart**: Powered by TradingView `lightweight-charts` v5 with timeframes (`1m`, `5m`, `15m`, `1H`, `4H`, `1D`, `1W`), Indicators (`EMA 20`, `EMA 50`, `Volume`), hover OHLC tooltip, and fullscreen mode.
   - **Real-Time Order Book**: Visualizes bids and asks with dynamic depth background bars, spread calculation, and precision controls.
   - **Recent Trades Stream**: Live execution feed displaying BUY/SELL tags, execution prices, quantities, and timestamps.
   - **Paper Trading Order Ticket**: Simulated Limit & Market orders with allocation sliders and execution confirmation toasts.
   - **Key Metrics & Range Bar**: 24h Low/High needle gauge, P/E, EPS, Market Cap, and Sector.

3. **Multi-Asset Markets (`MarketsPage`)**:
   - Interactive category tabs with multi-column table, sorting by price, change %, volume, and market cap.
   - Direct bookmarking to watchlists and one-click launch into the Pro Terminal.

4. **Quantitative Market Scanner (`ScannerPage`)**:
   - Algorithmic presets: *Top Gainers, Top Losers, Momentum Breakouts, High Volume, RSI Oversold (<40), RSI Overbought (>65), High Volatility, Strong Bullish Trend*.
   - Multi-field filter criteria (Min/Max Price, Min Change %, Min/Max RSI).

5. **Simulated Portfolio Dashboard (`PortfolioPage`)**:
   - Total simulated value, 24h P&L, Cumulative P&L, available cash.
   - Asset allocation breakdown progress bars and 30-day simulated equity growth.

6. **AI Market Intelligence Lab (`AiInsightsPage`)**:
   - Multi-asset algorithmic confluence scores (Trend, Momentum, Volatility, Regime, AI Confidence %).
   - Support, Resistance, Target, and Stop-Loss pivot calculations.
   - Technical factor scoring matrix.

7. **Alerts System (`AlertsPage`)**:
   - Configurable price triggers (Price crosses above, drops below, RSI thresholds, 24h gain %).
   - Active and Triggered alert tracking.

8. **Settings & Gateway Telemetry (`SettingsPage`)**:
   - SignalR and Binance WebSocket stream status, latency monitoring, and feed resync.
   - Audio chime toggles for live price updates.
   - Platform Architecture Roadmap (Phases 1 to 10).

---

## 🛠 Tech Stack

- **Frontend**: React 18/19, TypeScript, Vite, Tailwind CSS, Lucide React, TradingView Lightweight Charts (`@tradingview/lightweight-charts`), `@microsoft/signalr`.
- **Backend**: ASP.NET Core .NET 8 Web API, SignalR Hubs (`/hubs/market`), Entity Framework Core In-Memory, System.Net.WebSockets Client.

---

## 🏃‍♂️ How to Run Locally

### 1. Start the Backend (.NET 8 Web API)
```bash
cd backend/TradingTerminal.Api
dotnet run --launch-profile http
```
*API & SignalR Hub will be available at:* `http://localhost:5000`  
*Swagger Documentation:* `http://localhost:5000/swagger`

### 2. Start the Frontend (Vite + React)
```bash
cd frontend
npm install
npm run dev
```
*Open your browser at:* `http://localhost:3000`

---

## 🗺 Platform Evolution Roadmap

- **Phase 1 (CURRENT)**: Live Market Telemetry, Terminal UI, Order Books, SignalR Distribution.
- **Phase 2**: Advanced Technical Indicators (VWAP, ATR, MACD Histograms).
- **Phase 3**: PostgreSQL Historical Tick Database & Time-Series Aggregation.
- **Phase 4**: Quantitative Backtesting Engine.
- **Phase 5**: Paper Trading Engine with Order Fill Simulator.
- **Phase 6**: Machine Learning Volatility & Regime Forecasting.
- **Phase 7**: AI Autonomous Multi-Factor Strategy Generator.
- **Phase 8**: Deterministic Capital Safeguard & Risk Manager.
- **Phase 9**: Exchange Testnet Gateway (Binance Testnet).
- **Phase 10**: Institutional Live Exchange Execution.
