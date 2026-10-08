import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_database
from app.services.binance_ws import binance_ws_service
from app.services.paper_bot import init_bot, paper_trading_bot
from app.routers import (
    markets_router,
    papertrading_router,
    binance_router,
    brokers_router,
    websocket_router
)

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("trading_terminal")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION}...")
    
    # 1. Initialize Database (PostgreSQL with async fallback)
    try:
        await init_database()
    except Exception as ex:
        logger.error(f"Database init warning: {ex}")

    # 2. Start Real-time Live Binance WebSocket Streamer
    try:
        await binance_ws_service.start()
    except Exception as ex:
        logger.error(f"Background worker startup error: {ex}")

    # 3. Optionally start paper trading bot (safe, opt-in)
    try:
        if settings.ENABLE_PAPER_BOT:
            bot = init_bot(binance_ws_service)
            await bot.start()
    except Exception as ex:
        logger.error(f"Paper bot startup error: {ex}")

    yield

    # Teardown
    logger.info("Shutting down background workers...")
    await binance_ws_service.stop()
    try:
        if paper_trading_bot:
            await paper_trading_bot.stop()
    except Exception:
        pass
    logger.info("Shutdown complete.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Python FastAPI + PostgreSQL Real-Time Institutional Trading Engine",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(markets_router, prefix="/api")
app.include_router(papertrading_router, prefix="/api")
app.include_router(binance_router, prefix="/api")
app.include_router(brokers_router, prefix="/api")
app.include_router(websocket_router)

@app.get("/")
async def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "stack": "Python FastAPI + PostgreSQL + React",
        "status": "ONLINE",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "engine": "FastAPI Async Engine", "database": "PostgreSQL"}
