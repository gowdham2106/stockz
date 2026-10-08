import asyncio
import random
import logging
from datetime import datetime
from app.schemas.market import MarketAssetDto
from app.services.market_data import market_data_service

logger = logging.getLogger("trading_terminal.market_pulse")

class MarketPulseWorker:
    def __init__(self):
        self._running = False
        self._task = None

    async def start(self):
        self._running = True
        self._task = asyncio.create_task(self._pulse_loop())
        logger.info("High-Frequency Market Pulse & Multi-Asset Worker started.")

    async def stop(self):
        self._running = False
        if self._task:
            self._task.cancel()

    async def _pulse_loop(self):
        while self._running:
            try:
                # Ultra-smooth 150ms - 300ms micro-tick cadence
                await asyncio.sleep(random.uniform(0.15, 0.30))

                all_assets = await market_data_service.get_all_assets()
                non_crypto = [a for a in all_assets if a.asset_type != "crypto"]

                if non_crypto:
                    target = random.choice(non_crypto)
                    
                    # Brownian micro-tick (-0.05% to +0.05%)
                    tick_percent = (random.random() - 0.495) * 0.001
                    delta = target.price * tick_percent
                    new_price = round(target.price + delta, 2 if target.price > 10 else 4)
                    if new_price <= 0:
                        new_price = target.price

                    new_change = target.change + delta
                    prev_close = target.previous_close or (new_price - new_change)
                    new_change_pct = round((new_change / prev_close) * 100.0, 2) if prev_close > 0 else target.change_percent

                    sparkline = target.sparkline or []
                    sparkline = (sparkline[-29:] + [new_price]) if len(sparkline) > 0 else [new_price]

                    updated = MarketAssetDto(
                        symbol=target.symbol,
                        raw_symbol=target.raw_symbol,
                        name=target.name,
                        asset_type=target.asset_type,
                        exchange=target.exchange,
                        price=new_price,
                        change=round(new_change, 2 if target.price > 10 else 4),
                        change_percent=new_change_pct,
                        high=max(target.high or new_price, new_price),
                        low=min(target.low or new_price, new_price),
                        open=target.open or new_price,
                        previous_close=prev_close,
                        volume=target.volume,
                        market_cap=target.market_cap,
                        sector=target.sector,
                        sparkline=sparkline,
                        timestamp=datetime.utcnow().isoformat()
                    )
                    await market_data_service.upsert_asset(updated)

            except asyncio.CancelledError:
                break
            except Exception as ex:
                logger.trace(f"Pulse worker tick exception: {ex}")

market_pulse_worker = MarketPulseWorker()
