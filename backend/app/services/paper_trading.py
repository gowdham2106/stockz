import asyncio
import logging
from datetime import datetime
from typing import List, Optional, Dict
import uuid

from app.schemas.paper_trading import (
    PaperTradeOrderRequest,
    PaperPositionDto,
    PaperOrderDto,
    PaperClosedTradeDto,
    PaperAccountSummaryDto,
    PaperNotificationDto
)
from app.websocket_manager import ws_manager

logger = logging.getLogger("trading_terminal.paper_trading")

class PaperTradingService:
    def __init__(self):
        self._lock = asyncio.Lock()
        # Start with configured default virtual cash; keep initial demo positions optional
        from app.config import settings
        self._virtual_cash: float = float(settings.DEFAULT_VIRTUAL_CASH)
        self._positions: List[Dict] = []
        self._open_orders: List[Dict] = []
        self._history: List[Dict] = []
        self._total_trades: int = 5
        self._winning_trades: int = 4
        self._realized_pnl: float = 4820.50
        self._market_data_service = None
        self._initialize_default_positions()

    def set_market_data_service(self, market_data_service):
        self._market_data_service = market_data_service

    def _initialize_default_positions(self):
        self._positions = [
            {
                "id": str(uuid.uuid4()),
                "symbol": "BTC/USDT",
                "name": "Bitcoin",
                "side": "BUY",
                "quantity": 0.5,
                "entry_price": 65800.00,
                "current_price": 67420.00,
                "margin_used": 16450.00,
                "leverage": 2,
                "unrealized_pnl": 1620.00,
                "unrealized_pnl_percent": 4.92,
                "stop_loss": 63500.00,
                "take_profit": 72000.00,
                "liquidation_price": 36190.00,
                "opened_at": datetime.utcnow().isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "symbol": "NVDA",
                "name": "NVIDIA Corp",
                "side": "BUY",
                "quantity": 80.0,
                "entry_price": 124.00,
                "current_price": 138.50,
                "margin_used": 9920.00,
                "leverage": 1,
                "unrealized_pnl": 1160.00,
                "unrealized_pnl_percent": 11.69,
                "stop_loss": 118.00,
                "take_profit": 145.00,
                "liquidation_price": 12.40,
                "opened_at": datetime.utcnow().isoformat()
            }
        ]

    async def get_account_summary(self) -> PaperAccountSummaryDto:
        total_unrealized_pnl = 0.0
        total_margin_used = 0.0

        async with self._lock:
            positions_copy = [dict(p) for p in self._positions]
            orders_copy = [dict(o) for o in self._open_orders if o.get("status") == "OPEN"]
            history_copy = [dict(h) for h in self._history]
            available_cash = self._virtual_cash
            realized_pnl = self._realized_pnl
            total_trades = self._total_trades
            winning_trades = self._winning_trades

        # Recalculate with live prices
        for pos in positions_copy:
            current_price = await self._get_live_price(pos["symbol"])
            if current_price > 0:
                pos["current_price"] = current_price
            else:
                current_price = pos["current_price"]

            price_diff = (current_price - pos["entry_price"]) if pos["side"] == "BUY" else (pos["entry_price"] - current_price)
            unrealized = round(price_diff * pos["quantity"] * pos["leverage"], 2)
            unrealized_pct = round((price_diff / pos["entry_price"]) * 100.0 * pos["leverage"], 2) if pos["entry_price"] > 0 else 0.0

            pos["unrealized_pnl"] = unrealized
            pos["unrealized_pnl_percent"] = unrealized_pct

            total_unrealized_pnl += unrealized
            total_margin_used += pos["margin_used"]

        win_rate = round((winning_trades / total_trades * 100.0), 1) if total_trades > 0 else 0.0
        total_portfolio_value = round(available_cash + total_margin_used + total_unrealized_pnl, 2)

        return PaperAccountSummaryDto(
            virtual_cash=round(available_cash, 2),
            total_portfolio_value=total_portfolio_value,
            margin_used=round(total_margin_used, 2),
            unrealized_pnl=round(total_unrealized_pnl, 2),
            realized_pnl=round(realized_pnl, 2),
            total_trades=total_trades,
            winning_trades=winning_trades,
            win_rate=win_rate,
            positions=[PaperPositionDto(**p) for p in positions_copy],
            open_orders=[PaperOrderDto(**o) for o in orders_copy],
            trade_history=[PaperClosedTradeDto(**h) for h in sorted(history_copy, key=lambda x: x.get("closed_at", ""), reverse=True)]
        )

    async def execute_order(self, order: PaperTradeOrderRequest) -> PaperAccountSummaryDto:
        if order.quantity <= 0:
            raise ValueError("Order quantity must be greater than zero.")

        live_price = await self._get_live_price(order.symbol)
        if live_price <= 0:
            live_price = 100.0

        fill_price = order.limit_price if (order.order_type == "LIMIT" and order.limit_price and order.limit_price > 0) else live_price
        leverage = max(1, order.leverage or 1)
        position_cost = round((fill_price * order.quantity) / leverage, 2)

        # If Limit order placed away from market (>0.3% delta)
        if order.order_type == "LIMIT" and order.limit_price and abs(order.limit_price - live_price) > (live_price * 0.003):
            async with self._lock:
                if self._virtual_cash < position_cost:
                    raise ValueError(f"Insufficient Virtual Cash. Order requires ${position_cost:N2} margin, but available balance is ${self._virtual_cash:N2}.")

                # Reserve margin for pending limit order
                self._virtual_cash -= position_cost

                new_order = {
                    "id": str(uuid.uuid4()),
                    "symbol": order.symbol,
                    "side": order.side,
                    "order_type": "LIMIT",
                    "quantity": order.quantity,
                    "target_price": order.limit_price,
                    "status": "OPEN",
                    "placed_at": datetime.utcnow().isoformat()
                }
                self._open_orders.append(new_order)
        else:
            # Immediate Market Fill
            async with self._lock:
                if self._virtual_cash < position_cost:
                    raise ValueError(f"Insufficient Virtual Cash. Order requires ${position_cost:,.2f} margin, but available balance is ${self._virtual_cash:,.2f}.")

                # Immediately deduct margin from available virtual cash
                self._virtual_cash -= position_cost

                liq_price = None
                if leverage > 1:
                    liq_price = max(0.0, round(fill_price * (1.0 - 0.90 / leverage), 2)) if order.side == "BUY" else round(fill_price * (1.0 + 0.90 / leverage), 2)

                name = order.symbol
                if self._market_data_service:
                    asset = await self._market_data_service.get_asset(order.symbol)
                    if asset:
                        name = asset.name

                new_pos = {
                    "id": str(uuid.uuid4()),
                    "symbol": order.symbol,
                    "name": name,
                    "side": order.side,
                    "quantity": order.quantity,
                    "entry_price": fill_price,
                    "current_price": live_price,
                    "margin_used": position_cost,
                    "leverage": leverage,
                    "stop_loss": order.stop_loss,
                    "take_profit": order.take_profit,
                    "liquidation_price": liq_price,
                    "unrealized_pnl": 0.0,
                    "unrealized_pnl_percent": 0.0,
                    "opened_at": datetime.utcnow().isoformat()
                }
                self._positions.append(new_pos)

        summary = await self.get_account_summary()
        await ws_manager.broadcast("PaperAccountUpdated", summary.model_dump(by_alias=True))
        return summary

    async def close_position(self, position_id: str, reason: str = "MANUAL", custom_exit_price: Optional[float] = None) -> PaperAccountSummaryDto:
        closed_pos = None
        exit_price = 0.0
        pnl = 0.0
        pnl_percent = 0.0

        async with self._lock:
            for p in list(self._positions):
                if p["id"] == position_id:
                    closed_pos = p
                    self._positions.remove(p)
                    break

            if closed_pos:
                exit_price = custom_exit_price if (custom_exit_price and custom_exit_price > 0) else closed_pos.get("current_price", closed_pos["entry_price"])
                price_diff = (exit_price - closed_pos["entry_price"]) if closed_pos["side"] == "BUY" else (closed_pos["entry_price"] - exit_price)
                pnl = round(price_diff * closed_pos["quantity"] * closed_pos["leverage"], 2)
                pnl_percent = round((price_diff / closed_pos["entry_price"]) * 100.0 * closed_pos["leverage"], 2) if closed_pos["entry_price"] > 0 else 0.0

                # Release margin and credit realized PnL back into virtual available cash
                self._virtual_cash += (closed_pos["margin_used"] + pnl)
                self._realized_pnl += pnl
                self._total_trades += 1
                if pnl >= 0:
                    self._winning_trades += 1

                self._history.append({
                    "id": str(uuid.uuid4()),
                    "symbol": closed_pos["symbol"],
                    "side": closed_pos["side"],
                    "quantity": closed_pos["quantity"],
                    "entry_price": closed_pos["entry_price"],
                    "exit_price": exit_price,
                    "realized_pnl": pnl,
                    "realized_pnl_percent": pnl_percent,
                    "close_reason": reason,
                    "opened_at": closed_pos["opened_at"],
                    "closed_at": datetime.utcnow().isoformat()
                })

        summary = await self.get_account_summary()
        await ws_manager.broadcast("PaperAccountUpdated", summary.model_dump(by_alias=True))

        if closed_pos:
            title = {
                "STOP_LOSS": "🚨 Stop Loss Executed",
                "TAKE_PROFIT": "🎯 Take Profit Hit",
                "LIQUIDATION": "⚠️ Margin Liquidation"
            }.get(reason, "Position Closed")

            msg = {
                "STOP_LOSS": f"Auto-sold {closed_pos['quantity']} {closed_pos['symbol']} at ${exit_price:,.2f} to cut loss. Loss: -${abs(pnl):,.2f}",
                "TAKE_PROFIT": f"Take-Profit executed for {closed_pos['quantity']} {closed_pos['symbol']} at ${exit_price:,.2f}! Profit: +${pnl:,.2f}",
                "LIQUIDATION": f"Position {closed_pos['symbol']} was liquidated due to 90% margin depletion."
            }.get(reason, f"Closed {closed_pos['side']} {closed_pos['quantity']} {closed_pos['symbol']} @ ${exit_price:,.2f} (P&L: {'+' if pnl >= 0 else ''}${pnl:,.2f})")

            notif = PaperNotificationDto(
                type=reason,
                title=title,
                message=msg,
                symbol=closed_pos["symbol"],
                pnl=pnl,
                timestamp=datetime.utcnow().isoformat()
            )
            await ws_manager.broadcast("PaperNotification", notif.model_dump(by_alias=True))

        return summary

    async def cancel_order(self, order_id: str) -> PaperAccountSummaryDto:
        async with self._lock:
            for o in self._open_orders:
                if o["id"] == order_id and o.get("status") == "OPEN":
                    o["status"] = "CANCELLED"
                    # Refund reserved margin back to available cash
                    reserved = o["target_price"] * o["quantity"]
                    self._virtual_cash += reserved
                    break

        summary = await self.get_account_summary()
        await ws_manager.broadcast("PaperAccountUpdated", summary.model_dump(by_alias=True))
        return summary

    async def reset_account(self, initial_cash: float = 100000.00) -> PaperAccountSummaryDto:
        async with self._lock:
            self._virtual_cash = initial_cash
            self._positions.clear()
            self._open_orders.clear()
            self._history.clear()
            self._realized_pnl = 0.0
            self._total_trades = 0
            self._winning_trades = 0

        summary = await self.get_account_summary()
        await ws_manager.broadcast("PaperAccountUpdated", summary.model_dump(by_alias=True))
        await ws_manager.broadcast("PaperNotification", PaperNotificationDto(
            type="INFO",
            title="Simulator Reset",
            message=f"Paper trading account reset to ${initial_cash:,.2f} virtual cash.",
            symbol="ALL",
            timestamp=datetime.utcnow().isoformat()
        ).model_dump(by_alias=True))
        return summary

    async def deposit_funds(self, amount: float = 25000.00) -> PaperAccountSummaryDto:
        async with self._lock:
            self._virtual_cash += amount

        summary = await self.get_account_summary()
        await ws_manager.broadcast("PaperAccountUpdated", summary.model_dump(by_alias=True))
        await ws_manager.broadcast("PaperNotification", PaperNotificationDto(
            type="INFO",
            title="Virtual Funds Credited",
            message=f"Added +${amount:,.2f} virtual cash to your practice wallet.",
            symbol="USD",
            timestamp=datetime.utcnow().isoformat()
        ).model_dump(by_alias=True))
        return summary

    async def check_triggers_and_fills(self, symbol: str, current_price: float, high: float, low: float):
        if current_price <= 0:
            return

        norm_symbol = self._normalize_symbol(symbol)
        async with self._lock:
            positions_to_check = [dict(p) for p in self._positions if self._normalize_symbol(p["symbol"]) == norm_symbol]
            orders_to_check = [dict(o) for o in self._open_orders if o.get("status") == "OPEN" and self._normalize_symbol(o["symbol"]) == norm_symbol]

        # 1. Evaluate Active Positions for Stop-Loss, Take-Profit, and Liquidation
        for pos in positions_to_check:
            should_close = False
            reason = "MANUAL"
            trigger_exit_price = current_price

            # Long (BUY) Position
            if pos["side"] == "BUY":
                if pos.get("stop_loss") and pos["stop_loss"] > 0 and current_price <= pos["stop_loss"]:
                    should_close = True
                    reason = "STOP_LOSS"
                    trigger_exit_price = pos["stop_loss"]
                elif pos.get("take_profit") and pos["take_profit"] > 0 and current_price >= pos["take_profit"]:
                    should_close = True
                    reason = "TAKE_PROFIT"
                    trigger_exit_price = pos["take_profit"]
                elif pos.get("liquidation_price") and pos["liquidation_price"] > 0 and current_price <= pos["liquidation_price"]:
                    should_close = True
                    reason = "LIQUIDATION"
                    trigger_exit_price = pos["liquidation_price"]
            # Short (SELL) Position
            elif pos["side"] == "SELL":
                if pos.get("stop_loss") and pos["stop_loss"] > 0 and current_price >= pos["stop_loss"]:
                    should_close = True
                    reason = "STOP_LOSS"
                    trigger_exit_price = pos["stop_loss"]
                elif pos.get("take_profit") and pos["take_profit"] > 0 and current_price <= pos["take_profit"]:
                    should_close = True
                    reason = "TAKE_PROFIT"
                    trigger_exit_price = pos["take_profit"]
                elif pos.get("liquidation_price") and pos["liquidation_price"] > 0 and current_price >= pos["liquidation_price"]:
                    should_close = True
                    reason = "LIQUIDATION"
                    trigger_exit_price = pos["liquidation_price"]

            if should_close:
                await self.close_position(pos["id"], reason, trigger_exit_price)

        # 2. Evaluate Open Limit Orders for Auto-Fill
        for order in orders_to_check:
            should_fill = False
            if order["side"] == "BUY" and current_price <= order["target_price"]:
                should_fill = True
            elif order["side"] == "SELL" and current_price >= order["target_price"]:
                should_fill = True

            if should_fill:
                async with self._lock:
                    for o in self._open_orders:
                        if o["id"] == order["id"]:
                            o["status"] = "FILLED"
                            break

                    name = order["symbol"]
                    if self._market_data_service:
                        asset = await self._market_data_service.get_asset(order["symbol"])
                        if asset:
                            name = asset.name

                    self._positions.append({
                        "id": str(uuid.uuid4()),
                        "symbol": order["symbol"],
                        "name": name,
                        "side": order["side"],
                        "quantity": order["quantity"],
                        "entry_price": order["target_price"],
                        "current_price": current_price,
                        "margin_used": order["target_price"] * order["quantity"],
                        "leverage": 1,
                        "stop_loss": None,
                        "take_profit": None,
                        "liquidation_price": None,
                        "unrealized_pnl": 0.0,
                        "unrealized_pnl_percent": 0.0,
                        "opened_at": datetime.utcnow().isoformat()
                    })

                summary = await self.get_account_summary()
                await ws_manager.broadcast("PaperAccountUpdated", summary.model_dump(by_alias=True))
                await ws_manager.broadcast("PaperNotification", PaperNotificationDto(
                    type="ORDER_FILLED",
                    title="Limit Order Filled",
                    message=f"Limit {order['side']} filled: {order['quantity']} {order['symbol']} @ ${order['target_price']:,.2f}",
                    symbol=order["symbol"],
                    timestamp=datetime.utcnow().isoformat()
                ).model_dump(by_alias=True))

    async def _get_live_price(self, symbol: str) -> float:
        if self._market_data_service:
            asset = await self._market_data_service.get_asset(symbol)
            if asset and asset.price > 0:
                return asset.price

        norm = self._normalize_symbol(symbol)
        defaults = {
            "BTCUSDT": 83920.00,
            "ETHUSDT": 3450.00,
            "SOLUSDT": 178.50,
            "BNBUSDT": 595.00,
            "NVDA": 138.50,
            "AAPL": 228.40,
            "RELIANCE": 2960.50,
            "TCS": 4120.00,
            "EURUSD": 1.0885,
            "GOLD": 2685.00,
            "XAUUSD": 2685.00
        }
        return defaults.get(norm, 100.0)

    def _normalize_symbol(self, s: str) -> str:
        if not s:
            return ""
        return s.replace("/", "").replace("-", "").upper()

paper_trading_service = PaperTradingService()
