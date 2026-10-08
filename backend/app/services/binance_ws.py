import asyncio
import json
import logging
from datetime import datetime
import websockets
import httpx
from app.config import settings
from app.schemas.market import MarketAssetDto
from app.services.market_data import market_data_service

logger = logging.getLogger("trading_terminal.binance_ws")

STREAMS = [
    "btcusdt@aggTrade",
    "ethusdt@aggTrade",
    "solusdt@aggTrade",
    "bnbusdt@aggTrade",
    "xrpusdt@aggTrade",
    "dogeusdt@aggTrade",
    "adausdt@aggTrade",
    "avaxusdt@aggTrade",
    "linkusdt@aggTrade",
    "dotusdt@aggTrade",
    "nearusdt@aggTrade",
    "suiusdt@aggTrade",
    "pepeusdt@aggTrade",
    "shibusdt@aggTrade",
    "ltcusdt@aggTrade",
    "uniusdt@aggTrade",
    "aptusdt@aggTrade",
    "fetusdt@aggTrade",
    "renderusdt@aggTrade",
    "taousdt@aggTrade",
    "!miniTicker@arr"
]

class BinanceWebSocketService:
    def __init__(self):
        self._running = False
        self._task = None

    async def start(self):
        self._running = True
        # 1. First fetch real-time 24hr stats from Binance REST
        asyncio.create_task(self._fetch_initial_tickers())
        # 2. Start WebSocket stream
        self._task = asyncio.create_task(self._run_loop())
        logger.info("Binance Real-Time WebSocket stream worker started.")

    async def stop(self):
        self._running = False
        if self._task:
            self._task.cancel()

    async def _fetch_initial_tickers(self):
        try:
            url = f"{settings.BINANCE_API_BASE}/api/v3/ticker/24hr"
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url)
                if resp.status_code == 200:
                    data = resp.json()
                    for item in data:
                        sym = item.get("symbol", "").upper()
                        if sym.endswith("USDT"):
                            sym_formatted = f"{sym[:-4]}/USDT"
                            existing = await market_data_service.get_asset(sym_formatted)
                            if existing:
                                last_price = float(item.get("lastPrice", 0.0))
                                price_change = float(item.get("priceChange", 0.0))
                                price_change_pct = float(item.get("priceChangePercent", 0.0))
                                high_price = float(item.get("highPrice", 0.0))
                                low_price = float(item.get("lowPrice", 0.0))
                                open_price = float(item.get("openPrice", 0.0))
                                prev_close = float(item.get("prevClosePrice", 0.0))
                                quote_volume = float(item.get("quoteVolume", 0.0))

                                updated = MarketAssetDto(
                                    symbol=existing.symbol,
                                    raw_symbol=sym,
                                    name=existing.name,
                                    asset_type=existing.asset_type,
                                    exchange="BINANCE",
                                    price=last_price,
                                    change=round(price_change, 2 if last_price > 10 else 4),
                                    change_percent=round(price_change_pct, 2),
                                    high=high_price,
                                    low=low_price,
                                    open=open_price,
                                    previous_close=prev_close,
                                    volume=quote_volume,
                                    market_cap=existing.market_cap,
                                    sector=existing.sector,
                                    sparkline=existing.sparkline,
                                    timestamp=datetime.utcnow().isoformat()
                                )
                                await market_data_service.upsert_asset(updated)
                    logger.info("Successfully fetched real 24hr Binance market statistics.")
        except Exception as ex:
            logger.warning(f"Could not fetch initial Binance 24hr tickers: {ex}")

    async def _run_loop(self):
        url = f"{settings.BINANCE_WS_URL}?streams={'/'.join(STREAMS)}"
        while self._running:
            try:
                logger.info(f"Connecting to Binance WebSocket: {url}")
                start_time = datetime.utcnow()
                async with websockets.connect(url, ping_interval=20, ping_timeout=20) as ws:
                    latency = int((datetime.utcnow() - start_time).total_seconds() * 1000)
                    market_data_service.update_connection_status("Binance Real-Time WebSocket Stream", "LIVE", latency)
                    logger.info(f"Connected to Binance WebSocket with sub-millisecond feeds. Latency: {latency}ms")

                    while self._running:
                        msg_text = await ws.recv()
                        msg = json.loads(msg_text)
                        await self._handle_message(msg)

            except asyncio.CancelledError:
                break
            except Exception as ex:
                logger.warning(f"Binance WebSocket connection error: {ex}. Reconnecting in 2 seconds...")
                market_data_service.update_connection_status("Binance Stream (Reconnecting)", "RECONNECTING", 0)
                await asyncio.sleep(2)

    async def _handle_message(self, msg: dict):
        stream = msg.get("stream", "")
        data = msg.get("data", {})

        if "aggTrade" in stream:
            symbol_raw = data.get("s", "").upper()
            price = float(data.get("p", 0.0))
            if price <= 0:
                return

            symbol_formatted = f"{symbol_raw[:-4]}/USDT" if symbol_raw.endswith("USDT") else symbol_raw
            existing = await market_data_service.get_asset(symbol_formatted)

            if existing:
                delta = price - existing.price
                change = existing.change + delta
                prev_close = existing.previous_close or (price - change)
                change_pct = round((change / prev_close) * 100.0, 2) if prev_close > 0 else existing.change_percent

                sparkline = existing.sparkline or []
                sparkline = (sparkline[-29:] + [price]) if len(sparkline) > 0 else [price]

                updated = MarketAssetDto(
                    symbol=existing.symbol,
                    raw_symbol=symbol_raw,
                    name=existing.name,
                    asset_type=existing.asset_type,
                    exchange=existing.exchange,
                    price=price,
                    change=round(change, 2 if price > 10 else 4),
                    change_percent=change_pct,
                    high=max(existing.high or price, price),
                    low=min(existing.low or price, price),
                    open=existing.open or price,
                    previous_close=prev_close,
                    volume=existing.volume,
                    market_cap=existing.market_cap,
                    sector=existing.sector,
                    sparkline=sparkline,
                    timestamp=datetime.utcnow().isoformat()
                )
                await market_data_service.upsert_asset(updated)

        elif "!miniTicker@arr" in stream and isinstance(data, list):
            for item in data:
                sym = item.get("s", "").upper()
                if sym.endswith("USDT"):
                    c_price = float(item.get("c", 0.0))
                    h_price = float(item.get("h", 0.0))
                    l_price = float(item.get("l", 0.0))
                    o_price = float(item.get("o", 0.0))
                    vol = float(item.get("q", item.get("v", 0.0)))

                    symbol_formatted = f"{sym[:-4]}/USDT"
                    existing = await market_data_service.get_asset(symbol_formatted)
                    if existing and c_price > 0:
                        change = c_price - o_price
                        change_pct = round((change / o_price) * 100.0, 2) if o_price > 0 else 0.0

                        updated = MarketAssetDto(
                            symbol=existing.symbol,
                            raw_symbol=sym,
                            name=existing.name,
                            asset_type=existing.asset_type,
                            exchange="BINANCE",
                            price=c_price,
                            change=round(change, 2 if c_price > 10 else 4),
                            change_percent=change_pct,
                            high=h_price,
                            low=l_price,
                            open=o_price,
                            previous_close=o_price,
                            volume=vol,
                            market_cap=existing.market_cap,
                            sector=existing.sector,
                            sparkline=existing.sparkline,
                            timestamp=datetime.utcnow().isoformat()
                        )
                        await market_data_service.upsert_asset(updated)

binance_ws_service = BinanceWebSocketService()
