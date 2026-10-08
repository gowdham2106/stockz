import asyncio
import logging
import random
from datetime import datetime
from app.services.paper_trading import paper_trading_service

logger = logging.getLogger("trading_terminal.paper_bot")


class PaperTradingBot:
    """A simple, safe paper-trading bot for demonstration.

    - Runs only when `ENABLE_PAPER_BOT` is True in config.
    - Places small market orders probabilistically to simulate activity.
    - Uses conservative sizes to avoid draining virtual cash.
    """

    def __init__(self, market_data_service, interval: float = 5.0):
        self._running = False
        self._task = None
        self.interval = interval
        self.market_data_service = market_data_service

    async def start(self):
        if self._running:
            return
        self._running = True
        self._task = asyncio.create_task(self._loop())
        logger.info("Paper trading bot started.")

    async def stop(self):
        self._running = False
        if self._task:
            self._task.cancel()
        logger.info("Paper trading bot stopped.")

    async def _loop(self):
        while self._running:
            try:
                # Choose a random crypto asset from market data
                assets = await self.market_data_service.get_all_assets()
                crypto = [a for a in assets if a.asset_type == "crypto"]
                if not crypto:
                    await asyncio.sleep(self.interval)
                    continue

                asset = random.choice(crypto)
                price = asset.price or 0.0
                if price <= 0:
                    await asyncio.sleep(self.interval)
                    continue

                # Small order size proportional to price (keep risk small)
                qty = round(max(0.0001, min(0.05, 1.0 / max(1.0, price) * 0.5)), 6)
                side = random.choice(["BUY", "SELL"])

                order = {
                    "symbol": asset.symbol,
                    "side": side,
                    "order_type": "MARKET",
                    "quantity": qty,
                    "leverage": 1
                }

                # Fire-and-forget: use paper_trading_service.execute_order
                try:
                    await paper_trading_service.execute_order(
                        type("Q", (), order)()
                    )
                    logger.info(f"Bot placed {side} {qty} {asset.symbol} @ {price} (simulated)")
                except Exception as e:
                    logger.debug(f"Bot order error: {e}")

                # Wait a bit (randomized) before next action
                await asyncio.sleep(self.interval + random.uniform(-1.0, 2.0))
            except asyncio.CancelledError:
                break
            except Exception as ex:
                logger.exception(f"Paper bot loop exception: {ex}")


paper_trading_bot = None

def init_bot(market_data_service, interval: float = 5.0):
    global paper_trading_bot
    if paper_trading_bot is None:
        paper_trading_bot = PaperTradingBot(market_data_service, interval=interval)
    return paper_trading_bot
