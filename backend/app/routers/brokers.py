from fastapi import APIRouter, HTTPException, Query, Body
from typing import List
from app.schemas.broker import UnifiedBrokerAccountDto, BrokerConnectRequest
from app.services.broker_gateway import broker_gateway_service

router = APIRouter(prefix="/brokers", tags=["Brokers"])

@router.get("/account/{broker_id}", response_model=UnifiedBrokerAccountDto)
async def get_broker_account(broker_id: str):
    return await broker_gateway_service.get_broker_account(broker_id)

@router.get("/all", response_model=List[UnifiedBrokerAccountDto])
async def get_all_brokers():
    return await broker_gateway_service.get_all_connected_brokers()

@router.post("/connect", response_model=UnifiedBrokerAccountDto)
async def connect_broker(request: BrokerConnectRequest):
    return await broker_gateway_service.connect_broker(request)
