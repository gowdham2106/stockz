from typing import List, Optional, Any
from pydantic import BaseModel, Field, ConfigDict
from pydantic.alias_generators import to_camel

class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True
    )

class MarketAssetDto(CamelModel):
    symbol: str
    raw_symbol: Optional[str] = None
    name: str
    asset_type: str
    exchange: str = "BINANCE"
    price: float
    change: float = 0.0
    change_percent: float = 0.0
    high: Optional[float] = None
    low: Optional[float] = None
    open: Optional[float] = None
    previous_close: Optional[float] = None
    volume: Optional[float] = None
    market_cap: Optional[float] = None
    sector: Optional[str] = None
    sparkline: Optional[List[float]] = None
    timestamp: str

class CandleStickDto(CamelModel):
    time: int
    timestamp: Optional[str] = None
    open: float
    high: float
    low: float
    close: float
    volume: float

class OrderBookEntry(CamelModel):
    price: float
    amount: float
    total: float

class OrderBookDto(CamelModel):
    symbol: str
    bids: List[OrderBookEntry]
    asks: List[OrderBookEntry]
    timestamp: str

class TradeDto(CamelModel):
    id: str
    symbol: str
    price: float
    amount: float
    side: str
    timestamp: str

class MarketPulseCardDto(CamelModel):
    id: str
    title: str
    primary_symbol: str
    current_value: str
    change_percent: float
    status: str
    sentiment: str
    sparkline: List[float]

class MarketPulseDto(CamelModel):
    global_status: str
    fear_and_greed_index: int
    fear_and_greed_label: str
    total_24h_volume_usd: float
    gainers_count: int
    losers_count: int
    pulse_cards: List[MarketPulseCardDto]

class MarketScannerItemDto(CamelModel):
    symbol: str
    name: str
    asset_type: str
    price: float
    change_percent: float
    volume: float
    market_cap: float
    rsi: float
    volatility: str
    trend: str
    signal: str
    ema_20_distance: float

class AiKeyIndicatorDto(CamelModel):
    name: str
    value: str
    signal: str

class AiInsightDto(CamelModel):
    symbol: str
    bias: str
    signal: str
    confidence_score: int
    summary: str
    catalyst: str
    support_levels: List[float]
    resistance_levels: List[float]
    key_indicators: List[AiKeyIndicatorDto]

class ConnectionStatusDto(CamelModel):
    provider: str
    status: str
    latency_ms: int
    last_update: str
    active_streams: int
    mode: str
    endpoint: str

class AlertItemDto(CamelModel):
    id: str
    symbol: str
    condition: str
    target_value: float
    current_value: float
    status: str
    created_at: str
    note: Optional[str] = None

class HoldingDto(CamelModel):
    symbol: str
    name: str
    asset_type: str
    quantity: float
    avg_buy_price: float
    current_price: float
    market_value: float = 0.0
    total_cost: float = 0.0
    unrealized_pnl: float = 0.0
    unrealized_pnl_percent: float = 0.0
    allocation_percent: float = 0.0

class PortfolioHistoryPointDto(CamelModel):
    date: str
    value: float
    pnl: float

class PortfolioDto(CamelModel):
    mode: str = "SIMULATION"
    account_name: str = "Paper / Pro Simulated Portfolio"
    total_portfolio_value: float
    available_cash: float
    invested_value: float
    today_pnl: float
    today_pnl_percent: float
    all_time_pnl: float
    all_time_pnl_percent: float
    holdings: List[HoldingDto]
    performance_history: List[PortfolioHistoryPointDto]

