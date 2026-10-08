import json
import logging
from datetime import datetime
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.websocket_manager import ws_manager
from app.services.market_data import market_data_service

logger = logging.getLogger("trading_terminal.ws_router")

router = APIRouter(tags=["WebSocket"])

async def handle_market_ws(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        # Send initial connection status
        status = market_data_service.get_connection_status()
        await websocket.send_text(json.dumps({
            "type": "ConnectionStatusChanged",
            "data": status.model_dump(by_alias=True)
        }))

        while True:
            data_text = await websocket.receive_text()
            try:
                msg = json.loads(data_text)
                action = msg.get("action", "") or msg.get("type", "")
                
                if action in ["subscribe", "SubscribeSymbol"]:
                    symbol = msg.get("symbol", msg.get("target", ""))
                    if symbol:
                        await ws_manager.subscribe_symbol(websocket, symbol)
                        asset = await market_data_service.get_asset(symbol)
                        if asset:
                            await websocket.send_text(json.dumps({
                                "type": "PriceUpdated",
                                "data": asset.model_dump(by_alias=True)
                            }))
                        ob = await market_data_service.get_order_book(symbol)
                        if ob:
                            await websocket.send_text(json.dumps({
                                "type": "OrderBookUpdated",
                                "data": ob.model_dump(by_alias=True)
                            }))

                elif action in ["unsubscribe", "UnsubscribeSymbol"]:
                    symbol = msg.get("symbol", "")
                    if symbol:
                        await ws_manager.unsubscribe_symbol(websocket, symbol)

                elif action in ["ping", "Ping"]:
                    await websocket.send_text(json.dumps({
                        "type": "pong",
                        "timestamp": datetime.utcnow().isoformat()
                    }))

            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        await ws_manager.disconnect(websocket)
    except Exception as ex:
        logger.warning(f"WebSocket client loop exception: {ex}")
        await ws_manager.disconnect(websocket)

@router.websocket("/ws/market")
async def websocket_market_endpoint(websocket: WebSocket):
    await handle_market_ws(websocket)

@router.websocket("/hubs/market")
async def websocket_market_compat_endpoint(websocket: WebSocket):
    await handle_market_ws(websocket)
