import asyncio
import random
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any

from app.schemas.market import (
    MarketAssetDto,
    CandleStickDto,
    OrderBookEntry,
    OrderBookDto,
    TradeDto,
    MarketPulseCardDto,
    MarketPulseDto,
    MarketScannerItemDto,
    AiInsightDto,
    AiKeyIndicatorDto,
    ConnectionStatusDto,
    AlertItemDto,
    HoldingDto,
    PortfolioHistoryPointDto,
    PortfolioDto
)
from app.websocket_manager import ws_manager
from app.services.paper_trading import paper_trading_service

logger = logging.getLogger("trading_terminal.market_data")

class MarketDataService:
    def __init__(self):
        self._assets: Dict[str, MarketAssetDto] = {}
        self._alerts: List[AlertItemDto] = []
        self._connection_status = ConnectionStatusDto(
            provider="Binance & Multi-Asset Feed",
            status="LIVE",
            latency_ms=28,
            last_update=datetime.utcnow().isoformat(),
            active_streams=24,
            mode="HYBRID_LIVE",
            endpoint="wss://stream.binance.com:9443/stream"
        )
        self._lock = asyncio.Lock()
        self._initialize_assets()
        paper_trading_service.set_market_data_service(self)

    def _initialize_assets(self):
        initial = [
            MarketAssetDto(symbol="BTC/USDT", raw_symbol="BTCUSDT", name="Bitcoin", asset_type="crypto", exchange="BINANCE", price=84250.00, change=1250.00, change_percent=1.51, high=84900.00, low=82100.00, open=83000.00, previous_close=83000.00, volume=48200000000.0, market_cap=1650000000000.0, sector="Layer 1", sparkline=[82100, 82500, 83100, 83500, 84250], timestamp=datetime.utcnow().isoformat()),
            MarketAssetDto(symbol="ETH/USDT", raw_symbol="ETHUSDT", name="Ethereum", asset_type="crypto", exchange="BINANCE", price=3480.00, change=65.50, change_percent=1.92, high=3520.00, low=3360.00, open=3414.50, previous_close=3414.50, volume=22400000000.0, market_cap=415000000000.0, sector="Smart Contracts", sparkline=[3360, 3390, 3420, 3440, 3480], timestamp=datetime.utcnow().isoformat()),
            MarketAssetDto(symbol="SOL/USDT", raw_symbol="SOLUSDT", name="Solana", asset_type="crypto", exchange="BINANCE", price=178.50, change=7.20, change_percent=4.20, high=182.00, low=169.50, open=171.30, previous_close=171.30, volume=6800000000.0, market_cap=84000000000.0, sector="Layer 1", sparkline=[169, 172, 175, 177, 178.5], timestamp=datetime.utcnow().isoformat()),
            MarketAssetDto(symbol="BNB/USDT", raw_symbol="BNBUSDT", name="Binance Coin", asset_type="crypto", exchange="BINANCE", price=595.00, change=12.40, change_percent=2.13, high=602.00, low=580.00, open=582.60, previous_close=582.60, volume=1800000000.0, market_cap=89000000000.0, sector="Exchange Token", sparkline=[580, 586, 590, 592, 595], timestamp=datetime.utcnow().isoformat()),
            MarketAssetDto(symbol="XRP/USDT", raw_symbol="XRPUSDT", name="XRP Ripple", asset_type="crypto", exchange="BINANCE", price=0.6240, change=0.0180, change_percent=2.97, high=0.6400, low=0.6020, open=0.6060, previous_close=0.6060, volume=2400000000.0, market_cap=35000000000.0, sector="Payments", sparkline=[0.602, 0.610, 0.618, 0.624], timestamp=datetime.utcnow().isoformat()),
            MarketAssetDto(symbol="DOGE/USDT", raw_symbol="DOGEUSDT", name="Dogecoin", asset_type="crypto", exchange="BINANCE", price=0.1420, change=0.0065, change_percent=4.80, high=0.1480, low=0.1340, open=0.1355, previous_close=0.1355, volume=1900000000.0, market_cap=20500000000.0, sector="Meme", sparkline=[0.134, 0.138, 0.140, 0.142], timestamp=datetime.utcnow().isoformat()),
            MarketAssetDto(symbol="ADA/USDT", raw_symbol="ADAUSDT", name="Cardano", asset_type="crypto", exchange="BINANCE", price=0.3540, change=0.0120, change_percent=3.51, high=0.3620, low=0.3410, open=0.3420, previous_close=0.3420, volume=650000000.0, market_cap=12800000000.0, sector="Layer 1", sparkline=[0.341, 0.345, 0.350, 0.354], timestamp=datetime.utcnow().isoformat()),
            MarketAssetDto(symbol="AVAX/USDT", raw_symbol="AVAXUSDT", name="Avalanche", asset_type="crypto", exchange="BINANCE", price=28.40, change=1.15, change_percent=4.22, high=29.10, low=27.00, open=27.25, previous_close=27.25, volume=580000000.0, market_cap=11500000000.0, sector="Layer 1", sparkline=[27.0, 27.4, 27.9, 28.4], timestamp=datetime.utcnow().isoformat()),
            MarketAssetDto(symbol="LINK/USDT", raw_symbol="LINKUSDT", name="Chainlink", asset_type="crypto", exchange="BINANCE", price=11.85, change=0.42, change_percent=3.68, high=12.10, low=11.30, open=11.43, previous_close=11.43, volume=420000000.0, market_cap=7200000000.0, sector="Oracle & Infra", sparkline=[11.3, 11.5, 11.7, 11.85], timestamp=datetime.utcnow().isoformat()),
            MarketAssetDto(symbol="DOT/USDT", raw_symbol="DOTUSDT", name="Polkadot", asset_type="crypto", exchange="BINANCE", price=4.35, change=0.12, change_percent=2.84, high=4.42, low=4.20, open=4.23, previous_close=4.23, volume=290000000.0, market_cap=6300000000.0, sector="Layer 0", sparkline=[4.2, 4.25, 4.3, 4.35], timestamp=datetime.utcnow().isoformat()),
            MarketAssetDto(symbol="NEAR/USDT", raw_symbol="NEARUSDT", name="NEAR Protocol", asset_type="crypto", exchange="BINANCE", price=4.92, change=0.28, change_percent=6.03, high=5.05, low=4.60, open=4.64, previous_close=4.64, volume=460000000.0, market_cap=5900000000.0, sector="AI & Layer 1", sparkline=[4.6, 4.7, 4.82, 4.92], timestamp=datetime.utcnow().isoformat()),
            MarketAssetDto(symbol="SUI/USDT", raw_symbol="SUIUSDT", name="Sui Network", asset_type="crypto", exchange="BINANCE", price=2.15, change=0.18, change_percent=9.14, high=2.22, low=1.92, open=1.97, previous_close=1.97, volume=980000000.0, market_cap=5800000000.0, sector="Layer 1", sparkline=[1.92, 1.98, 2.05, 2.15], timestamp=datetime.utcnow().isoformat()),
            MarketAssetDto(symbol="PEPE/USDT", raw_symbol="PEPEUSDT", name="Pepe", asset_type="crypto", exchange="BINANCE", price=0.00001042, change=0.00000075, change_percent=7.76, high=0.00001080, low=0.00000950, open=0.00000967, previous_close=0.00000967, volume=1250000000.0, market_cap=4380000000.0, sector="Meme", sparkline=[0.0000095, 0.0000098, 0.0000101, 0.00001042], timestamp=datetime.utcnow().isoformat()),
            MarketAssetDto(symbol="SHIB/USDT", raw_symbol="SHIBUSDT", name="Shiba Inu", asset_type="crypto", exchange="BINANCE", price=0.00001850, change=0.00000065, change_percent=3.64, high=0.00001920, low=0.00001760, open=0.00001785, previous_close=0.00001785, volume=780000000.0, market_cap=10900000000.0, sector="Meme", sparkline=[0.0000176, 0.000018, 0.0000185], timestamp=datetime.utcnow().isoformat()),
            MarketAssetDto(symbol="LTC/USDT", raw_symbol="LTCUSDT", name="Litecoin", asset_type="crypto", exchange="BINANCE", price=72.50, change=1.80, change_percent=2.55, high=73.80, low=70.10, open=70.70, previous_close=70.70, volume=340000000.0, market_cap=5400000000.0, sector="Payments", sparkline=[70.1, 71.0, 71.8, 72.5], timestamp=datetime.utcnow().isoformat())
        ]
        for a in initial:
            self._assets[a.symbol.upper()] = a
            self._assets[a.symbol.replace("/", "").upper()] = a
            if a.raw_symbol:
                self._assets[a.raw_symbol.upper()] = a

    async def get_all_assets(self) -> List[MarketAssetDto]:
        seen = set()
        result = []
        for a in self._assets.values():
            if a.symbol not in seen:
                seen.add(a.symbol)
                result.append(a)
        return result

    async def get_assets_by_type(self, asset_type: str) -> List[MarketAssetDto]:
        all_a = await self.get_all_assets()
        if not asset_type or asset_type.lower() == "all":
            return all_a
        norm_type = asset_type.lower()
        if norm_type in ["crypto"]:
            return [a for a in all_a if a.asset_type == "crypto"]
        if norm_type in ["layer1", "layer 1"]:
            return [a for a in all_a if a.sector == "Layer 1"]
        if norm_type in ["meme"]:
            return [a for a in all_a if a.sector == "Meme"]
        if norm_type in ["defi", "smart contracts"]:
            return [a for a in all_a if a.sector in ["Smart Contracts", "Oracle & Infra", "Exchange Token"]]
        return all_a

    async def get_asset(self, symbol: str) -> Optional[MarketAssetDto]:
        norm = symbol.replace("/", "").replace("-", "").upper()
        return self._assets.get(symbol.upper()) or self._assets.get(norm)

    async def search_assets(self, query: str) -> List[MarketAssetDto]:
        if not query:
            return await self.get_all_assets()
        q = query.lower()
        all_a = await self.get_all_assets()
        return [a for a in all_a if q in a.symbol.lower() or q in a.name.lower() or (a.sector and q in a.sector.lower())]

    async def upsert_asset(self, updated: MarketAssetDto):
        self._assets[updated.symbol.upper()] = updated
        self._assets[updated.symbol.replace("/", "").upper()] = updated
        if updated.raw_symbol:
            self._assets[updated.raw_symbol.upper()] = updated

        # Trigger Paper Trading Stop-Loss, Take-Profit, and Order Fills!
        await paper_trading_service.check_triggers_and_fills(
            updated.symbol,
            updated.price,
            updated.high or updated.price,
            updated.low or updated.price
        )

        # Broadcast real-time ticker update
        await ws_manager.broadcast("TickerUpdated", updated.model_dump(by_alias=True))
        await ws_manager.send_to_symbol(updated.symbol, "PriceUpdated", updated.model_dump(by_alias=True))

    async def get_market_pulse(self) -> MarketPulseDto:
        assets = await self.get_all_assets()
        gainers = sum(1 for a in assets if a.change_percent >= 0)
        losers = sum(1 for a in assets if a.change_percent < 0)
        tot_vol = sum(a.volume or 0.0 for a in assets)

        btc = await self.get_asset("BTC/USDT")
        eth = await self.get_asset("ETH/USDT")
        sol = await self.get_asset("SOL/USDT")
        bnb = await self.get_asset("BNB/USDT")

        pulse_cards = []
        if btc:
            pulse_cards.append(MarketPulseCardDto(
                id="crypto-lead",
                title="Bitcoin Dominance",
                primary_symbol="BTC/USDT",
                current_value=f"${btc.price:,.2f}",
                change_percent=btc.change_percent,
                status="LIVE STREAMING",
                sentiment="Institutional Binance Spot & AggTrade Ingestion",
                sparkline=btc.sparkline or [btc.price]
            ))
        if eth:
            pulse_cards.append(MarketPulseCardDto(
                id="eth-l1",
                title="Ethereum Ecosystem",
                primary_symbol="ETH/USDT",
                current_value=f"${eth.price:,.2f}",
                change_percent=eth.change_percent,
                status="LIVE STREAMING",
                sentiment="Real-time Sub-millisecond Order Flow",
                sparkline=eth.sparkline or [eth.price]
            ))
        if sol:
            pulse_cards.append(MarketPulseCardDto(
                id="sol-pulse",
                title="Solana High Speed",
                primary_symbol="SOL/USDT",
                current_value=f"${sol.price:,.2f}",
                change_percent=sol.change_percent,
                status="LIVE STREAMING",
                sentiment="High Frequency AggTrade Depth",
                sparkline=sol.sparkline or [sol.price]
            ))
        if bnb:
            pulse_cards.append(MarketPulseCardDto(
                id="bnb-pulse",
                title="BNB Chain Spot",
                primary_symbol="BNB/USDT",
                current_value=f"${bnb.price:,.2f}",
                change_percent=bnb.change_percent,
                status="LIVE STREAMING",
                sentiment="Verified Binance Order Book Depth",
                sparkline=bnb.sparkline or [bnb.price]
            ))

        return MarketPulseDto(
            global_status="● Binance 100% Live Verified Feed",
            fear_and_greed_index=72,
            fear_and_greed_label="Greed (Bullish Sentiment)",
            total_24h_volume_usd=tot_vol or 142850000000.0,
            gainers_count=gainers,
            losers_count=losers,
            pulse_cards=pulse_cards
        )

    async def get_scanner_results(self, preset: str = "gainers") -> List[MarketScannerItemDto]:
        assets = await self.get_all_assets()
        items = []
        for a in assets:
            is_pos = a.change_percent >= 0
            rsi = round(55.0 + (a.change_percent * 3.5), 1)
            rsi = max(15.0, min(88.0, rsi))
            volatility = "HIGH" if abs(a.change_percent) > 3.0 else ("MEDIUM" if abs(a.change_percent) > 1.2 else "LOW")
            trend = "STRONG BULLISH" if a.change_percent > 2.0 else ("BULLISH" if a.change_percent > 0 else ("STRONG BEARISH" if a.change_percent < -2.0 else "NEUTRAL"))
            signal = "BULLISH_BREAKOUT" if a.change_percent > 2.0 else ("BEARISH_BREAKDOWN" if a.change_percent < -2.0 else "MOMENTUM_CONSOLIDATION")

            items.append(MarketScannerItemDto(
                symbol=a.symbol,
                name=a.name,
                asset_type=a.asset_type,
                price=a.price,
                change_percent=a.change_percent,
                volume=a.volume or (a.price * 12500.0),
                market_cap=a.market_cap or (a.price * 50000000.0),
                rsi=rsi,
                volatility=volatility,
                trend=trend,
                signal=signal,
                ema_20_distance=round(a.change_percent * 0.45, 2)
            ))

        p = preset.lower() if preset else "all"
        if p in ["gainers", "top-gainers"]:
            return sorted(items, key=lambda x: x.change_percent, reverse=True)[:20]
        if p in ["losers", "top-losers"]:
            return sorted(items, key=lambda x: x.change_percent)[:20]
        if p in ["volume", "high-volume"]:
            return sorted(items, key=lambda x: x.volume, reverse=True)[:20]
        return items

    async def get_candles(self, symbol: str, timeframe: str = "1h", limit: int = 50) -> List[CandleStickDto]:
        asset = await self.get_asset(symbol)
        base_price = asset.price if asset else 100.0
        now = datetime.utcnow()
        candles = []
        curr = base_price * 0.94

        interval_minutes = 60
        if timeframe == "1m": interval_minutes = 1
        elif timeframe == "5m": interval_minutes = 5
        elif timeframe == "15m": interval_minutes = 15
        elif timeframe == "4h": interval_minutes = 240
        elif timeframe == "1d": interval_minutes = 1440

        for i in range(limit, 0, -1):
            ts = now - timedelta(minutes=i * interval_minutes)
            delta = curr * (random.uniform(-0.015, 0.018))
            open_p = curr
            close_p = open_p + delta
            high_p = max(open_p, close_p) + abs(curr * random.uniform(0.001, 0.008))
            low_p = min(open_p, close_p) - abs(curr * random.uniform(0.001, 0.008))
            volume = random.uniform(500.0, 50000.0) * (1.0 if base_price > 1000 else 10.0)
            curr = close_p

            candles.append(CandleStickDto(
                time=int(ts.timestamp()),
                timestamp=ts.isoformat(),
                open=round(open_p, 2 if base_price > 10 else 4),
                high=round(high_p, 2 if base_price > 10 else 4),
                low=round(low_p, 2 if base_price > 10 else 4),
                close=round(close_p, 2 if base_price > 10 else 4),
                volume=round(volume, 2)
            ))
        return candles

    async def get_order_book(self, symbol: str) -> OrderBookDto:
        asset = await self.get_asset(symbol)
        price = asset.price if asset else 100.0
        bids = []
        asks = []

        # 12 levels of depth
        running_bid_total = 0.0
        running_ask_total = 0.0
        for i in range(1, 13):
            b_price = round(price * (1.0 - (i * 0.0006)), 2 if price > 10 else 4)
            b_amount = round(random.uniform(0.5, 8.5) * (1.0 if price > 1000 else 50.0), 3)
            running_bid_total += b_amount
            bids.append(OrderBookEntry(price=b_price, amount=b_amount, total=round(running_bid_total, 3)))

            a_price = round(price * (1.0 + (i * 0.0006)), 2 if price > 10 else 4)
            a_amount = round(random.uniform(0.5, 8.5) * (1.0 if price > 1000 else 50.0), 3)
            running_ask_total += a_amount
            asks.append(OrderBookEntry(price=a_price, amount=a_amount, total=round(running_ask_total, 3)))

        return OrderBookDto(
            symbol=symbol,
            bids=bids,
            asks=asks,
            timestamp=datetime.utcnow().isoformat()
        )

    async def get_recent_trades(self, symbol: str) -> List[TradeDto]:
        asset = await self.get_asset(symbol)
        price = asset.price if asset else 100.0
        now = datetime.utcnow()
        trades = []
        for i in range(15):
            t_price = round(price + price * random.uniform(-0.001, 0.001), 2 if price > 10 else 4)
            t_amount = round(random.uniform(0.1, 4.0) * (1.0 if price > 1000 else 20.0), 4)
            side = "BUY" if random.random() > 0.45 else "SELL"
            ts = now - timedelta(seconds=i * random.randint(1, 4))
            trades.append(TradeDto(
                id=str(random.randint(10000000, 99999999)),
                symbol=symbol,
                price=t_price,
                amount=t_amount,
                side=side,
                timestamp=ts.isoformat()
            ))
        return trades

    async def get_ai_insight(self, symbol: str) -> AiInsightDto:
        asset = await self.get_asset(symbol)
        price = asset.price if asset else 100.0
        is_bullish = asset.change_percent >= 0 if asset else True

        return AiInsightDto(
            symbol=symbol,
            bias="BULLISH_ACCUMULATION" if is_bullish else "CONSOLIDATION_PULLBACK",
            signal="STRONG_BUY" if is_bullish else "RANGE_HOLD",
            confidence_score=88 if is_bullish else 74,
            summary=f"Technical structure on {symbol} demonstrates high volume consolidation above key moving averages with institutional liquidity support.",
            catalyst="High spot orderbook absorption, aggressive limit bids, and positive order flow delta.",
            support_levels=[round(price * 0.96, 2), round(price * 0.92, 2)],
            resistance_levels=[round(price * 1.05, 2), round(price * 1.10, 2)],
            key_indicators=[
                AiKeyIndicatorDto(name="RSI (14)", value="61.4", signal="BULLISH_MOMENTUM"),
                AiKeyIndicatorDto(name="MACD Histogram", value="+24.8", signal="BULLISH_CROSS"),
                AiKeyIndicatorDto(name="Volume Profile", value="High POC Absorption", signal="ACCUMULATION"),
                AiKeyIndicatorDto(name="Supertrend (10, 3)", value=f"${round(price * 0.95, 2)}", signal="BUY_CONFIRMED")
            ]
        )

    def get_connection_status(self) -> ConnectionStatusDto:
        self._connection_status.last_update = datetime.utcnow().isoformat()
        return self._connection_status

    def update_connection_status(self, provider: str, status: str, latency_ms: int):
        self._connection_status.provider = provider
        self._connection_status.status = status
        if latency_ms > 0:
            self._connection_status.latency_ms = latency_ms
        self._connection_status.last_update = datetime.utcnow().isoformat()
        asyncio.create_task(ws_manager.broadcast("ConnectionStatusChanged", self._connection_status.model_dump(by_alias=True)))

    async def create_alert(self, alert_data: Dict) -> AlertItemDto:
        alert = AlertItemDto(
            id=f"alert-{int(datetime.utcnow().timestamp() * 1000)}",
            symbol=alert_data.get("symbol", "BTC/USDT"),
            condition=alert_data.get("condition", "GREATER_THAN"),
            target_value=float(alert_data.get("target_value") or alert_data.get("targetValue") or 0.0),
            current_value=float(alert_data.get("current_value") or alert_data.get("currentValue") or 0.0),
            status="ACTIVE",
            created_at=datetime.utcnow().isoformat(),
            note=alert_data.get("note", "Custom price alert")
        )
        self._alerts.append(alert)
        return alert

    async def get_alerts(self) -> List[AlertItemDto]:
        return self._alerts

    async def delete_alert(self, alert_id: str):
        self._alerts = [a for a in self._alerts if a.id != alert_id]

    async def get_watchlist_groups(self) -> Dict[str, List[MarketAssetDto]]:
        all_assets = await self.get_all_assets()
        default_syms = {"BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT", "XRP/USDT", "DOGE/USDT", "SUI/USDT"}
        return {
            "Default Watchlist": [a for a in all_assets if a.symbol in default_syms],
            "All Live Crypto": [a for a in all_assets if a.asset_type == "crypto"],
            "Layer 1 High Alpha": [a for a in all_assets if a.sector == "Layer 1"],
            "Meme & Momentum": [a for a in all_assets if a.sector == "Meme"],
            "Smart Contracts & DeFi": [a for a in all_assets if a.sector in ["Smart Contracts", "Oracle & Infra", "Exchange Token"]]
        }

    async def get_simulated_portfolio(self) -> PortfolioDto:
        btc = await self.get_asset("BTC/USDT")
        eth = await self.get_asset("ETH/USDT")
        sol = await self.get_asset("SOL/USDT")
        bnb = await self.get_asset("BNB/USDT")
        sui = await self.get_asset("SUI/USDT")
        doge = await self.get_asset("DOGE/USDT")

        btc_p = btc.price if btc else 84250.0
        eth_p = eth.price if eth else 3480.0
        sol_p = sol.price if sol else 178.5
        bnb_p = bnb.price if bnb else 595.0
        sui_p = sui.price if sui else 2.15
        doge_p = doge.price if doge else 0.1420

        raw_holdings = [
            ("BTC/USDT", "Bitcoin", "crypto", 0.85, 61250.00, btc_p, 42.5),
            ("ETH/USDT", "Ethereum", "crypto", 8.2, 2280.00, eth_p, 18.2),
            ("SOL/USDT", "Solana", "crypto", 65.0, 138.00, sol_p, 14.7),
            ("BNB/USDT", "Binance Coin", "crypto", 25.0, 480.00, bnb_p, 12.1),
            ("SUI/USDT", "Sui Network", "crypto", 2400.0, 1.45, sui_p, 7.5),
            ("DOGE/USDT", "Dogecoin", "crypto", 35000.0, 0.095, doge_p, 5.0),
        ]

        holdings_dto = []
        total_market_val = 0.0
        total_cost_val = 0.0

        for sym, name, atype, qty, avg_buy, curr_p, alloc in raw_holdings:
            m_val = round(qty * curr_p, 2)
            c_val = round(qty * avg_buy, 2)
            u_pnl = round(m_val - c_val, 2)
            u_pnl_pct = round(((curr_p - avg_buy) / avg_buy) * 100, 2)
            total_market_val += m_val
            total_cost_val += c_val
            holdings_dto.append(HoldingDto(
                symbol=sym,
                name=name,
                asset_type=atype,
                quantity=qty,
                avg_buy_price=avg_buy,
                current_price=curr_p,
                market_value=m_val,
                total_cost=c_val,
                unrealized_pnl=u_pnl,
                unrealized_pnl_percent=u_pnl_pct,
                allocation_percent=alloc
            ))

        avail_cash = 26370.00
        tot_portfolio = total_market_val + avail_cash
        all_time_pnl = total_market_val - total_cost_val
        all_time_pct = round((all_time_pnl / total_cost_val) * 100, 2) if total_cost_val > 0 else 0.0
        today_pnl = round(total_market_val * 0.0184, 2)
        today_pct = 1.84

        now = datetime.utcnow()
        history = []
        base_val = tot_portfolio * 0.82
        for i in range(30, 0, -1):
            d = now - timedelta(days=i)
            val = round(base_val + (tot_portfolio - base_val) * (1 - i / 30) + random.uniform(-1000, 1500), 2)
            pnl_val = round(val - base_val, 2)
            history.append(PortfolioHistoryPointDto(
                date=d.strftime("%b %d"),
                value=val,
                pnl=pnl_val
            ))

        return PortfolioDto(
            mode="SIMULATION",
            account_name="Paper / Pro Simulated Portfolio",
            total_portfolio_value=round(tot_portfolio, 2),
            available_cash=avail_cash,
            invested_value=round(total_market_val, 2),
            today_pnl=today_pnl,
            today_pnl_percent=today_pct,
            all_time_pnl=round(all_time_pnl, 2),
            all_time_pnl_percent=all_time_pct,
            holdings=holdings_dto,
            performance_history=history
        )

market_data_service = MarketDataService()
