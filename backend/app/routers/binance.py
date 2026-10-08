from fastapi import APIRouter, HTTPException, Query, Body
from typing import Optional
from app.schemas.broker import UnifiedBrokerAccountDto, BrokerConnectRequest
from app.services.broker_gateway import broker_gateway_service

router = APIRouter(prefix="/binance", tags=["Binance"])

@router.get("/account", response_model=UnifiedBrokerAccountDto)
async def get_binance_account(
    api_key: Optional[str] = Query(None, alias="apiKey"),
    secret_key: Optional[str] = Query(None, alias="secretKey"),
    is_testnet: Optional[bool] = Query(False, alias="isTestnet")
):
    if api_key and secret_key:
        req = BrokerConnectRequest(
            broker_id="binance",
            api_key=api_key,
            secret_key=secret_key,
            is_testnet=bool(is_testnet)
        )
        return await broker_gateway_service.connect_broker(req)
    return await broker_gateway_service.get_broker_account("binance")

@router.post("/connect", response_model=UnifiedBrokerAccountDto)
async def connect_binance(request: BrokerConnectRequest):
    request.broker_id = "binance"
    return await broker_gateway_service.connect_broker(request)

@router.get("/wallet-overview", response_model=UnifiedBrokerAccountDto)
async def get_wallet_overview():
    return await broker_gateway_service.get_broker_account("binance")
