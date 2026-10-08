from fastapi import APIRouter, HTTPException, Query, Body
from typing import List, Optional, Dict, Any
from urllib.parse import unquote

from app.schemas.market import (
    MarketAssetDto,
    CandleStickDto,
    OrderBookDto,
    TradeDto,
    MarketPulseDto,
    MarketScannerItemDto,
    AiInsightDto,
    ConnectionStatusDto,
    AlertItemDto,
    PortfolioDto
)
from app.services.market_data import market_data_service

router = APIRouter(tags=["Markets"])

@router.get("/portfolio", response_model=PortfolioDto)
async def get_portfolio():
    return await market_data_service.get_simulated_portfolio()

@router.get("/watchlist", response_model=Dict[str, List[MarketAssetDto]])
async def get_watchlist():
    return await market_data_service.get_watchlist_groups()

@router.get("/health")
async def get_health():
    status = market_data_service.get_connection_status()
    return {
        "status": "Healthy",
        "service": "TradingTerminal.PythonApi",
        "stack": "Python FastAPI + PostgreSQL + React",
        "version": "2.0.0",
        "gateway": status
    }


@router.get("/markets", response_model=List[MarketAssetDto])
async def get_markets(type: Optional[str] = Query(None), search: Optional[str] = Query(None)):
    if search:
        return await market_data_service.search_assets(search)
    return await market_data_service.get_assets_by_type(type or "all")

@router.get("/markets/pulse", response_model=MarketPulseDto)
async def get_market_pulse():
    return await market_data_service.get_market_pulse()

@router.get("/markets/scanner", response_model=List[MarketScannerItemDto])
async def get_scanner(preset: Optional[str] = Query("gainers")):
    return await market_data_service.get_scanner_results(preset or "gainers")

@router.get("/markets/connection-status", response_model=ConnectionStatusDto)
async def get_connection_status():
    return market_data_service.get_connection_status()

@router.get("/alerts", response_model=List[AlertItemDto])
async def get_alerts():
    return await market_data_service.get_alerts()

@router.post("/alerts", response_model=AlertItemDto)
async def create_alert(alert: Dict[str, Any] = Body(...)):
    return await market_data_service.create_alert(alert)

@router.delete("/alerts/{alert_id}")
async def delete_alert(alert_id: str):
    await market_data_service.delete_alert(alert_id)
    return {"success": True, "deleted": alert_id}

@router.get("/asset/{symbol:path}/candles", response_model=List[CandleStickDto])
async def get_candles(symbol: str, timeframe: Optional[str] = Query("1h")):
    decoded_symbol = unquote(symbol)
    return await market_data_service.get_candles(decoded_symbol, timeframe or "1h")

@router.get("/asset/{symbol:path}/orderbook", response_model=OrderBookDto)
async def get_order_book(symbol: str):
    decoded_symbol = unquote(symbol)
    return await market_data_service.get_order_book(decoded_symbol)

@router.get("/asset/{symbol:path}/trades", response_model=List[TradeDto])
async def get_recent_trades(symbol: str):
    decoded_symbol = unquote(symbol)
    return await market_data_service.get_recent_trades(decoded_symbol)

@router.get("/asset/{symbol:path}/ai-insight", response_model=AiInsightDto)
async def get_ai_insight(symbol: str):
    decoded_symbol = unquote(symbol)
    return await market_data_service.get_ai_insight(decoded_symbol)

@router.get("/asset/{symbol:path}", response_model=MarketAssetDto)
async def get_asset(symbol: str):
    decoded_symbol = unquote(symbol)
    asset = await market_data_service.get_asset(decoded_symbol)
    if not asset:
        raise HTTPException(status_code=404, detail=f"Asset {decoded_symbol} not found")
    return asset
