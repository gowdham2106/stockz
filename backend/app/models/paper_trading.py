from datetime import datetime
import uuid
from sqlalchemy import Column, String, Float, Integer, DateTime, Text, JSON, Boolean
from app.database import Base

class PaperAccountStateModel(Base):
    __tablename__ = "paper_account_state"

    id = Column(String(50), primary_key=True, default="default")
    virtual_cash = Column(Float, default=100000.00)
    realized_pnl = Column(Float, default=4820.50)
    total_trades = Column(Integer, default=5)
    winning_trades = Column(Integer, default=4)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class PaperPositionModel(Base):
    __tablename__ = "paper_positions"

    id = Column(String(50), primary_key=True, default=lambda: str(uuid.uuid4()))
    symbol = Column(String(50), index=True, nullable=False)
    name = Column(String(100), nullable=False)
    side = Column(String(10), nullable=False) # "BUY" | "SELL"
    quantity = Column(Float, nullable=False)
    entry_price = Column(Float, nullable=False)
    current_price = Column(Float, nullable=False)
    margin_used = Column(Float, nullable=False)
    leverage = Column(Integer, default=1)
    unrealized_pnl = Column(Float, default=0.0)
    unrealized_pnl_percent = Column(Float, default=0.0)
    stop_loss = Column(Float, nullable=True)
    take_profit = Column(Float, nullable=True)
    liquidation_price = Column(Float, nullable=True)
    opened_at = Column(DateTime, default=datetime.utcnow)

class PaperOrderModel(Base):
    __tablename__ = "paper_orders"

    id = Column(String(50), primary_key=True, default=lambda: str(uuid.uuid4()))
    symbol = Column(String(50), index=True, nullable=False)
    side = Column(String(10), nullable=False)
    order_type = Column(String(20), default="LIMIT") # "LIMIT" | "MARKET" | "STOP_LOSS"
    quantity = Column(Float, nullable=False)
    target_price = Column(Float, nullable=False)
    status = Column(String(20), default="OPEN") # "OPEN" | "FILLED" | "CANCELLED"
    placed_at = Column(DateTime, default=datetime.utcnow)

class PaperClosedTradeModel(Base):
    __tablename__ = "paper_closed_trades"

    id = Column(String(50), primary_key=True, default=lambda: str(uuid.uuid4()))
    symbol = Column(String(50), index=True, nullable=False)
    side = Column(String(10), nullable=False)
    quantity = Column(Float, nullable=False)
    entry_price = Column(Float, nullable=False)
    exit_price = Column(Float, nullable=False)
    realized_pnl = Column(Float, nullable=False)
    realized_pnl_percent = Column(Float, nullable=False)
    close_reason = Column(String(50), default="MANUAL") # "MANUAL" | "STOP_LOSS" | "TAKE_PROFIT" | "LIQUIDATION"
    opened_at = Column(DateTime, nullable=False)
    closed_at = Column(DateTime, default=datetime.utcnow)
