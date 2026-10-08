import os
from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    PROJECT_NAME: str = "Stockz Ultra-Trading Terminal"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api"
    HOST: str = "0.0.0.0"
    PORT: int = 5000
    ENVIRONMENT: str = "development"

    # PostgreSQL Database URL
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/trading_terminal",
        description="Async PostgreSQL Connection String"
    )
    
    # SQLite Fallback URL for ultra-smooth portable development
    SQLITE_FALLBACK_URL: str = "sqlite+aiosqlite:///./trading_terminal.db"

    # CORS Allowed Origins
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ]

    # Binance WebSocket and REST Endpoints
    BINANCE_WS_URL: str = "wss://stream.binance.com:9443/stream"
    BINANCE_API_BASE: str = "https://api.binance.com"

    # Paper Trading Defaults
    DEFAULT_VIRTUAL_CASH: float = 100000.00

    # Feature flags
    # When True, the internal simulated paper-trading bot will start automatically
    ENABLE_PAPER_BOT: bool = False

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
