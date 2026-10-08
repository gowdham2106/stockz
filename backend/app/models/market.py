from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, DateTime, Text, JSON, Boolean
from app.database import Base

class AssetModel(Base):
    __tablename__ = "market_assets"

    symbol = Column(String(50), primary_key=True, index=True)
    raw_symbol = Column(String(50), nullable=True)
    name = Column(String(100), nullable=False)
    asset_type = Column(String(50), nullable=False, index=True) # "crypto", "stock", "indian_stock", "index", "forex", "commodity"
    exchange = Column(String(50), default="BINANCE")
    price = Column(Float, nullable=False, default=0.0)
    change = Column(Float, default=0.0)
    change_percent = Column(Float, default=0.0)
    high = Column(Float, nullable=True)
    low = Column(Float, nullable=True)
    open_price = Column(Float, nullable=True)
    previous_close = Column(Float, nullable=True)
    volume = Column(Float, nullable=True)
    market_cap = Column(Float, nullable=True)
    sector = Column(String(100), nullable=True)
    sparkline_data = Column(JSON, nullable=True) # List of floats
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class CandleModel(Base):
    __tablename__ = "market_candles"

    id = Column(String(100), primary_key=True)
    symbol = Column(String(50), index=True, nullable=False)
    timeframe = Column(String(20), index=True, nullable=False) # "1m", "5m", "15m", "1h", "4h", "1d"
    timestamp = Column(DateTime, nullable=False, index=True)
    open = Column(Float, nullable=False)
    high = Column(Float, nullable=False)
    low = Column(Float, nullable=False)
    close = Column(Float, nullable=False)
    volume = Column(Float, default=0.0)

class AlertModel(Base):
    __tablename__ = "price_alerts"

    id = Column(String(50), primary_key=True)
    symbol = Column(String(50), index=True, nullable=False)
    condition = Column(String(50), default="GREATER_THAN") # "GREATER_THAN" | "LESS_THAN" | "PERCENT_CHANGE"
    target_value = Column(Float, nullable=False)
    current_value = Column(Float, default=0.0)
    status = Column(String(50), default="ACTIVE") # "ACTIVE" | "TRIGGERED" | "CANCELLED"
    note = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    triggered_at = Column(DateTime, nullable=True)
