from app.routers.markets import router as markets_router
from app.routers.papertrading import router as papertrading_router
from app.routers.binance import router as binance_router
from app.routers.brokers import router as brokers_router
from app.routers.websocket import router as websocket_router

__all__ = [
    "markets_router",
    "papertrading_router",
    "binance_router",
    "brokers_router",
    "websocket_router"
]
