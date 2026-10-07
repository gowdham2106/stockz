using System;
using System.Collections.Generic;

namespace TradingTerminal.Api.Models
{
    public class PaperTradeOrderRequest
    {
        public string Symbol { get; set; } = string.Empty;
        public string Side { get; set; } = "BUY"; // "BUY" | "SELL"
        public string OrderType { get; set; } = "MARKET"; // "MARKET" | "LIMIT" | "STOP_LOSS"
        public decimal Quantity { get; set; }
        public decimal? LimitPrice { get; set; }
        public decimal? StopLoss { get; set; }
        public decimal? TakeProfit { get; set; }
        public int Leverage { get; set; } = 1;
    }

    public class PaperPosition
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Symbol { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Side { get; set; } = "BUY"; // "BUY" | "SELL"
        public decimal Quantity { get; set; }
        public decimal EntryPrice { get; set; }
        public decimal CurrentPrice { get; set; }
        public decimal MarginUsed { get; set; }
        public int Leverage { get; set; } = 1;
        public decimal UnrealizedPnl { get; set; }
        public decimal UnrealizedPnlPercent { get; set; }
        public decimal? StopLoss { get; set; }
        public decimal? TakeProfit { get; set; }
        public decimal? LiquidationPrice { get; set; }
        public DateTime OpenedAt { get; set; } = DateTime.UtcNow;
    }

    public class PaperOrder
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Symbol { get; set; } = string.Empty;
        public string Side { get; set; } = "BUY";
        public string OrderType { get; set; } = "LIMIT";
        public decimal Quantity { get; set; }
        public decimal TargetPrice { get; set; }
        public string Status { get; set; } = "OPEN"; // "OPEN" | "FILLED" | "CANCELLED"
        public DateTime PlacedAt { get; set; } = DateTime.UtcNow;
    }

    public class PaperClosedTrade
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Symbol { get; set; } = string.Empty;
        public string Side { get; set; } = "BUY";
        public decimal Quantity { get; set; }
        public decimal EntryPrice { get; set; }
        public decimal ExitPrice { get; set; }
        public decimal RealizedPnl { get; set; }
        public decimal RealizedPnlPercent { get; set; }
        public string CloseReason { get; set; } = "MANUAL"; // "MANUAL" | "STOP_LOSS" | "TAKE_PROFIT" | "LIQUIDATION"
        public DateTime OpenedAt { get; set; }
        public DateTime ClosedAt { get; set; } = DateTime.UtcNow;
    }

    public class PaperAccountSummary
    {
        public decimal VirtualCash { get; set; } = 100000.00m; // Available unallocated cash
        public decimal TotalPortfolioValue { get; set; } = 100000.00m; // Cash + MarginUsed + UnrealizedPnL
        public decimal MarginUsed { get; set; } = 0m; // Margin locked in active positions
        public decimal UnrealizedPnl { get; set; } = 0m;
        public decimal RealizedPnl { get; set; } = 0m;
        public int TotalTrades { get; set; } = 0;
        public int WinningTrades { get; set; } = 0;
        public decimal WinRate => TotalTrades > 0 ? Math.Round((decimal)WinningTrades / TotalTrades * 100m, 1) : 0m;
        public List<PaperPosition> Positions { get; set; } = new();
        public List<PaperOrder> OpenOrders { get; set; } = new();
        public List<PaperClosedTrade> TradeHistory { get; set; } = new();
    }

    public class PaperNotificationDto
    {
        public string Type { get; set; } = "INFO"; // "STOP_LOSS" | "TAKE_PROFIT" | "LIQUIDATION" | "ORDER_FILLED"
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string Symbol { get; set; } = string.Empty;
        public decimal Pnl { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}
