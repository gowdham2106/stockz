from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, DateTime, Text, JSON, Boolean
from app.database import Base

class BrokerAccountModel(Base):
    __tablename__ = "broker_accounts"

    broker_id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    category = Column(String(100), nullable=False)
    account_id = Column(String(100), nullable=False)
    account_type = Column(String(100), nullable=False)
    status = Column(String(50), default="CONNECTED")
    is_real_live_sync = Column(Boolean, default=False)
    masked_api_key = Column(String(100), nullable=True)
    currency = Column(String(10), default="USD")
    total_balance = Column(Float, default=0.0)
    total_balance_usd = Column(Float, default=0.0)
    available_cash = Column(Float, default=0.0)
    margin_used = Column(Float, default=0.0)
    today_pnl = Column(Float, default=0.0)
    today_pnl_percent = Column(Float, default=0.0)
    holdings_json = Column(JSON, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
