# STOCKZ ULTRA-TERMINAL — Python (FastAPI) + PostgreSQL + React Architecture

> **High-Precision Multi-Asset Financial Market Intelligence & Real-Time Trading Terminal**  
> *Powered by Python (FastAPI), PostgreSQL (SQLAlchemy Async), React (TypeScript + Vite), and Live Binance WebSockets.*

---

## 🚀 Tech Stack Overview

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Backend Engine** | **Python 3.14 + FastAPI** | High-performance asynchronous REST API and native WebSocket feed engine with sub-millisecond execution loops. |
| **Database** | **PostgreSQL (with SQLAlchemy Async & AsyncPG)** | Relational database modeling assets, orders, positions, trade history, alerts, and broker accounts with automatic resilient fallback. |
| **Frontend UI** | **React 19 + TypeScript + Vite + Tailwind CSS** | Ultra-responsive institutional terminal UI with TradingView Lightweight Charts, real-time audio chimes, and instant order book rendering. |
| **Real-Time Telemetry** | **Binance WebSocket & Custom Pulse Engine** | Continuous live AggTrade, depth, and micro-tick pricing stream with automated Stop-Loss and Take-Profit execution triggers. |

---

## 🏛 System Architecture

```text
       ┌────────────────────────┐
       │   External Feeds       │
       │ (Binance WebSocket,    │
       │  Multi-Asset Gateway)  │
       └───────────┬────────────┘
                   │ Live WebSockets
                   ▼
       ┌────────────────────────┐
       │     Python FastAPI     │
       │  (Async Worker Engine) │
       └─────┬────────────┬─────┘
             │            │
             ▼            ▼
   ┌─────────────────┐  ┌──────────────────┐
   │   PostgreSQL    │  │ Native WebSocket │
   │   (SQLAlchemy)  │  │   (/ws/market)   │
   └─────────────────┘  └─────────┬────────┘
                                  │ Live Telemetry
                                  ▼
                        ┌──────────────────┐
                        │  React Frontend  │
                        │(Terminal & Charts│
                        └──────────────────┘
```

---

## 🛠 Running the Application

### 1. Start the Python FastAPI Backend (Port 5000)

```bash
# Navigate to backend directory and install dependencies
cd backend
pip install -r requirements.txt

# Run the FastAPI server with Uvicorn
python run.py
```
* **API Documentation (Swagger UI)**: `http://localhost:5000/docs`
* **Health Check**: `http://localhost:5000/health`
* **WebSocket Endpoint**: `ws://localhost:5000/ws/market`

### 2. Start the React Frontend (Port 3000)

```bash
cd frontend
npm install
npm run dev
```
* **Terminal Interface**: `http://localhost:3000`

---

## ⚡ Core Features & Capabilities

1. **Real-Time Automated Stop-Loss & Take-Profit Engine**:
   - Sub-millisecond tick evaluations on every live Binance trade and simulated micro-tick.
   - Automatically auto-sells long positions when `Price <= StopLoss` and auto-buys short positions when `Price >= StopLoss`.
   - Automatically executes Take Profit targets and auto-liquidates positions exceeding 90% margin erosion.
   - Instantly returns margin and realized profit/loss to available virtual cash.

2. **Multi-Broker Gateway**:
   - **Binance**: Live account authentication and balances sync via HMAC SHA-256 API signature.
   - **Zerodha Kite**: Dedicated Indian stock market gateway (NSE/BSE) supporting Reliance, TCS, HDFC Bank, Infosys, and NIFTY 50.
   - **Coinbase Advanced**, **Interactive Brokers (IBKR)**, **MetaTrader 5**, and **Robinhood**.

3. **Paper Trading Practice Command Center**:
   - Live positions monitor with distance-to-stop-loss indicators.
   - Real-time wallet balance deductions immediately upon taking trades.
   - Working limit orders book and complete permanent trade history log.
   - 1-Click `$100k Virtual Cash Reset` and `+$25k Virtual Deposit`.
