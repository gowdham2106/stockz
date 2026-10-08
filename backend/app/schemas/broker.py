from typing import List, Optional
from pydantic import BaseModel, Field
from app.schemas.market import CamelModel

class BrokerHoldingItemDto(CamelModel):
    symbol: str
    name: str
    asset_type: str
    quantity: float
    avg_price: float
    last_price: float
    market_value: float
    unrealized_pnl: float
    unrealized_pnl_percent: float
    currency: str = "USD"
    exchange: str = "EXCHANGE"

class BinanceBalanceItemDto(CamelModel):
    asset: str
    name: str = ""
    free: float = 0.0
    locked: float = 0.0
    total: float = 0.0
    estimated_usd_value: float = 0.0
    change24h: float = 0.0
    icon_bg: str = "#F0B90B"

class BinanceAccountSummaryDto(CamelModel):
    is_connected: bool = True
    account_type: str = "SPOT & USDⓈ-M"
    account_id: str = "BINANCE-USER-MAIN"
    can_trade: bool = True
    can_withdraw: bool = True
    can_deposit: bool = True
    update_time: int = 0
    total_balance_usd: float = 0.0
    total_balance_btc: float = 0.0
    spot_balance_usd: float = 0.0
    futures_estimated_usd: float = 0.0
    today_pnl_usd: float = 0.0
    today_pnl_percent: float = 0.0
    balances: List[BinanceBalanceItemDto] = []
    masked_api_key: str = ""
    message: str = ""
    is_real_live_sync: bool = False

class UnifiedBrokerAccountDto(CamelModel):
    broker_id: str
    name: str
    category: str
    account_id: str
    account_type: str
    status: str
    is_real_live_sync: bool
    masked_api_key: str
    currency: str
    total_balance: float
    total_balance_usd: float
    available_cash: float
    margin_used: float
    today_pnl: float
    today_pnl_percent: float
    holdings: List[BrokerHoldingItemDto] = []
    balances: Optional[List[BinanceBalanceItemDto]] = None
    spot_balance_usd: Optional[float] = None
    futures_estimated_usd: Optional[float] = None
    today_pnl_usd: Optional[float] = None
    total_balance_btc: Optional[float] = None
    message: str = ""
    official_login_url: str = ""
    api_docs_url: str = ""

class BrokerConnectRequest(CamelModel):
    broker_id: Optional[str] = "binance"
    api_key: str = ""
    secret_key: str = ""
    request_token: Optional[str] = None
    account_id: Optional[str] = None
    password: Optional[str] = None
    server: Optional[str] = None
    is_testnet: bool = False

