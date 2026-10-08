import asyncio
import json
import logging
from typing import Set, Dict, Any, List
from fastapi import WebSocket

logger = logging.getLogger("trading_terminal.websocket")

class WebSocketManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self.symbol_subscriptions: Dict[str, Set[WebSocket]] = {}
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        async with self._lock:
            self.active_connections.add(websocket)
        logger.info(f"WebSocket client connected. Total active: {len(self.active_connections)}")

    async def disconnect(self, websocket: WebSocket):
        async with self._lock:
            if websocket in self.active_connections:
                self.active_connections.remove(websocket)
            for symbol, clients in list(self.symbol_subscriptions.items()):
                if websocket in clients:
                    clients.remove(websocket)
        logger.info(f"WebSocket client disconnected. Total active: {len(self.active_connections)}")

    async def subscribe_symbol(self, websocket: WebSocket, symbol: str):
        norm = self._normalize_symbol(symbol)
        async with self._lock:
            if norm not in self.symbol_subscriptions:
                self.symbol_subscriptions[norm] = set()
            self.symbol_subscriptions[norm].add(websocket)
        logger.debug(f"Subscribed client to {norm}")

    async def unsubscribe_symbol(self, websocket: WebSocket, symbol: str):
        norm = self._normalize_symbol(symbol)
        async with self._lock:
            if norm in self.symbol_subscriptions and websocket in self.symbol_subscriptions[norm]:
                self.symbol_subscriptions[norm].remove(websocket)

    async def broadcast(self, message_type: str, data: Any):
        if not self.active_connections:
            return
        payload = json.dumps({"type": message_type, "data": data})
        dead_connections = []
        async with self._lock:
            clients = list(self.active_connections)
        
        for conn in clients:
            try:
                await conn.send_text(payload)
            except Exception:
                dead_connections.append(conn)

        if dead_connections:
            async with self._lock:
                for dead in dead_connections:
                    if dead in self.active_connections:
                        self.active_connections.remove(dead)

    async def send_to_symbol(self, symbol: str, message_type: str, data: Any):
        norm = self._normalize_symbol(symbol)
        async with self._lock:
            subscribers = list(self.symbol_subscriptions.get(norm, set()))
        
        if not subscribers:
            return
            
        payload = json.dumps({"type": message_type, "data": data})
        for conn in subscribers:
            try:
                await conn.send_text(payload)
            except Exception:
                pass

    def _normalize_symbol(self, s: str) -> str:
        if not s:
            return ""
        return s.replace("/", "").replace("-", "").upper()

ws_manager = WebSocketManager()
