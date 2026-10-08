from fastapi import APIRouter, HTTPException, Query, Body, status
from typing import Optional
from app.schemas.paper_trading import PaperTradeOrderRequest, PaperAccountSummaryDto
from app.services.paper_trading import paper_trading_service

router = APIRouter(prefix="/papertrading", tags=["Paper Trading"])

@router.get("/account", response_model=PaperAccountSummaryDto)
async def get_paper_account():
    return await paper_trading_service.get_account_summary()

@router.post("/order", response_model=PaperAccountSummaryDto)
async def execute_paper_order(order: PaperTradeOrderRequest):
    try:
        return await paper_trading_service.execute_order(order)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as ex:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(ex))

@router.post("/close/{position_id}", response_model=PaperAccountSummaryDto)
async def close_paper_position(position_id: str, reason: Optional[str] = Query("MANUAL")):
    return await paper_trading_service.close_position(position_id, reason=reason or "MANUAL")

@router.post("/cancel/{order_id}", response_model=PaperAccountSummaryDto)
async def cancel_paper_order(order_id: str):
    return await paper_trading_service.cancel_order(order_id)

@router.post("/reset", response_model=PaperAccountSummaryDto)
async def reset_paper_account(initial_cash: Optional[float] = Query(100000.0, alias="initialCash")):
    return await paper_trading_service.reset_account(initial_cash or 100000.0)

@router.post("/deposit", response_model=PaperAccountSummaryDto)
async def deposit_paper_funds(amount: Optional[float] = Query(25000.0)):
    return await paper_trading_service.deposit_funds(amount or 25000.0)
