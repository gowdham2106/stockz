from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict
from pydantic.alias_generators import to_camel
from app.schemas.market import CamelModel

class PaperTradeOrderRequest(CamelModel):
    symbol: str
    side: str = "BUY"  # "BUY" | "SELL"
    order_type: str = "MARKET"  # "MARKET" | "LIMIT" | "STOP_LOSS"
    quantity: float
    limit_price: Optional[float] = None
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None
    leverage: int = 1

class PaperPositionDto(CamelModel):
    id: str
    symbol: str
    name: str
    side: str
    quantity: float
    entry_price: float
    current_price: float
    margin_used: float
    leverage: int
    unrealized_pnl: float
    unrealized_pnl_percent: float
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None
    liquidation_price: Optional[float] = None
    opened_at: str

class PaperOrderDto(CamelModel):
    id: str
    symbol: str
    side: str
    order_type: str
    quantity: float
    target_price: float
    status: str
    placed_at: str

class PaperClosedTradeDto(CamelModel):
    id: str
    symbol: str
    side: str
    quantity: float
    entry_price: float
    exit_price: float
    realized_pnl: float
    realized_pnl_percent: float
    close_reason: Optional[str] = "MANUAL"
    opened_at: str
    closed_at: str

class PaperAccountSummaryDto(CamelModel):
    virtual_cash: float
    total_portfolio_value: float
    margin_used: float
    unrealized_pnl: float
    realized_pnl: float
    total_trades: int
    winning_trades: int
    win_rate: float
    positions: List[PaperPositionDto]
    open_orders: List[PaperOrderDto]
    trade_history: List[PaperClosedTradeDto]

class PaperNotificationDto(CamelModel):
    type: str  # "STOP_LOSS" | "TAKE_PROFIT" | "LIQUIDATION" | "ORDER_FILLED" | "INFO"
    title: str
    message: str
    symbol: str
    pnl: Optional[float] = None
    timestamp: str
