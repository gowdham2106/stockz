using System;
using System.Collections.Generic;

namespace TradingTerminal.Api.DTOs
{
    public class CandleStickDto
    {
        public long Time { get; set; } // Unix timestamp in seconds
        public decimal Open { get; set; }
        public decimal High { get; set; }
        public decimal Low { get; set; }
        public decimal Close { get; set; }
        public decimal Volume { get; set; }
    }

    public class OrderBookLevel
    {
        public decimal Price { get; set; }
        public decimal Amount { get; set; }
        public decimal Total { get; set; }
    }

    public class OrderBookDto
    {
        public string Symbol { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public List<OrderBookLevel> Asks { get; set; } = new();
        public List<OrderBookLevel> Bids { get; set; } = new();
        public decimal Spread => Asks.Count > 0 && Bids.Count > 0 ? Asks[0].Price - Bids[0].Price : 0;
        public decimal MidPrice => Asks.Count > 0 && Bids.Count > 0 ? (Asks[0].Price + Bids[0].Price) / 2m : 0;
    }

    public class TradeDto
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Symbol { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public decimal Amount { get; set; }
        public string Side { get; set; } = "BUY"; // "BUY" | "SELL"
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }

    public class MarketPulseCardDto
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string PrimarySymbol { get; set; } = string.Empty;
        public string CurrentValue { get; set; } = string.Empty;
        public decimal ChangePercent { get; set; }
        public string Status { get; set; } = "OPEN"; // "OPEN" | "ACTIVE" | "24/7" | "CLOSED"
        public List<decimal> Sparkline { get; set; } = new();
        public string Sentiment { get; set; } = "Bullish"; // Bullish | Neutral | Bearish
    }

    public class MarketPulseDto
    {
        public string GlobalStatus { get; set; } = "● Live Market Data";
        public int FearAndGreedIndex { get; set; } = 68; // 0-100
        public string FearAndGreedLabel { get; set; } = "Greed";
        public decimal Total24hVolumeUsd { get; set; } = 142850000000m;
        public int GainersCount { get; set; } = 42;
        public int LosersCount { get; set; } = 18;
        public List<MarketPulseCardDto> PulseCards { get; set; } = new();
    }

    public class ConnectionStatusDto
    {
        public string Provider { get; set; } = "Binance WebSocket";
        public string Status { get; set; } = "LIVE"; // "LIVE" | "CONNECTING" | "DISCONNECTED" | "RECONNECTING"
        public int LatencyMs { get; set; } = 45;
        public DateTime LastUpdate { get; set; } = DateTime.UtcNow;
        public int ActiveStreams { get; set; } = 12;
        public string Mode { get; set; } = "HYBRID_LIVE"; // "LIVE" | "DEMO"
        public string Endpoint { get; set; } = "wss://stream.binance.com:9443/stream";
    }

    public class MarketScannerItemDto
    {
        public string Symbol { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string AssetType { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public decimal ChangePercent { get; set; }
        public decimal Volume { get; set; }
        public decimal MarketCap { get; set; }
        public decimal Rsi { get; set; }
        public string Volatility { get; set; } = "MEDIUM"; // LOW | MEDIUM | HIGH | EXTREME
        public string Trend { get; set; } = "BULLISH"; // BULLISH | BEARISH | NEUTRAL
        public string Signal { get; set; } = "MOMENTUM_BREAKOUT";
        public decimal Ema20Distance { get; set; }
    }

    public class AiInsightDto
    {
        public string Symbol { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Trend { get; set; } = "BULLISH";
        public string Momentum { get; set; } = "STRONG";
        public string Volatility { get; set; } = "MEDIUM";
        public string MarketRegime { get; set; } = "TRENDING UPWARD";
        public int AiConfidence { get; set; } = 78;
        public string Signal { get; set; } = "BUY BIAS (SIMULATED)";
        public decimal SupportLevel { get; set; }
        public decimal ResistanceLevel { get; set; }
        public decimal TargetPrice { get; set; }
        public decimal StopLossLevel { get; set; }
        public List<string> Reasoning { get; set; } = new();
        public List<TechnicalFactorDto> Factors { get; set; } = new();
        public string Disclaimer { get; set; } = "DEMO ANALYSIS ONLY • Not financial advice • AI Engine preview for architecture testing";
        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
    }

    public class TechnicalFactorDto
    {
        public string Name { get; set; } = string.Empty;
        public string Value { get; set; } = string.Empty;
        public string Sentiment { get; set; } = "BULLISH"; // BULLISH | BEARISH | NEUTRAL
    }

    public class AlertDto
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Symbol { get; set; } = string.Empty;
        public string Condition { get; set; } = "GREATER_THAN"; // "GREATER_THAN" | "LESS_THAN" | "RSI_ABOVE" | "RSI_BELOW" | "CHANGE_PERCENT_ABOVE"
        public decimal TargetValue { get; set; }
        public decimal CurrentValue { get; set; }
        public string Status { get; set; } = "ACTIVE"; // "ACTIVE" | "TRIGGERED" | "DISABLED"
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? TriggeredAt { get; set; }
        public string Note { get; set; } = string.Empty;
    }

    public class HoldingDto
    {
        public string Symbol { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string AssetType { get; set; } = "crypto";
        public decimal Quantity { get; set; }
        public decimal AvgBuyPrice { get; set; }
        public decimal CurrentPrice { get; set; }
        public decimal MarketValue => Quantity * CurrentPrice;
        public decimal TotalCost => Quantity * AvgBuyPrice;
        public decimal UnrealizedPnL => MarketValue - TotalCost;
        public decimal UnrealizedPnLPercent => TotalCost > 0 ? (UnrealizedPnL / TotalCost) * 100m : 0;
        public decimal AllocationPercent { get; set; }
    }

    public class PortfolioDto
    {
        public string Mode { get; set; } = "SIMULATION";
        public string AccountName { get; set; } = "Demo Institutional Trader";
        public decimal TotalPortfolioValue { get; set; }
        public decimal AvailableCash { get; set; }
        public decimal InvestedValue { get; set; }
        public decimal TodayPnL { get; set; }
        public decimal TodayPnLPercent { get; set; }
        public decimal AllTimePnL { get; set; }
        public decimal AllTimePnLPercent { get; set; }
        public List<HoldingDto> Holdings { get; set; } = new();
        public List<PortfolioHistoryPointDto> PerformanceHistory { get; set; } = new();
    }

    public class PortfolioHistoryPointDto
    {
        public string Date { get; set; } = string.Empty;
        public decimal Value { get; set; }
        public decimal PnL { get; set; }
    }
}
