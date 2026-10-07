using System;
using System.Collections.Generic;

namespace TradingTerminal.Api.Models
{
    public enum AssetType
    {
        Crypto,
        Stock,
        IndianStock,
        Index,
        Forex,
        Commodity,
        Etf
    }

    public class MarketAsset
    {
        public string Symbol { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string RawSymbol { get; set; } = string.Empty; // e.g. BTCUSDT, AAPL, RELIANCE.NS
        public AssetType AssetType { get; set; }
        public string AssetTypeString => AssetType switch
        {
            AssetType.Crypto => "crypto",
            AssetType.Stock => "stock",
            AssetType.IndianStock => "indian_stock",
            AssetType.Index => "index",
            AssetType.Forex => "forex",
            AssetType.Commodity => "commodity",
            AssetType.Etf => "etf",
            _ => "crypto"
        };

        public decimal Price { get; set; }
        public decimal Change { get; set; }
        public decimal ChangePercent { get; set; }

        public decimal? Open { get; set; }
        public decimal? High { get; set; }
        public decimal? Low { get; set; }
        public decimal? PreviousClose { get; set; }

        public decimal? Volume { get; set; }
        public decimal? QuoteVolume { get; set; }
        public decimal? MarketCap { get; set; }

        public decimal? Bid { get; set; }
        public decimal? Ask { get; set; }
        public decimal? Spread { get; set; }

        public decimal? PE { get; set; }
        public decimal? EPS { get; set; }
        public string? Sector { get; set; }
        public string Exchange { get; set; } = string.Empty;

        public string TradingStatus { get; set; } = "LIVE"; // "LIVE" | "DEMO" | "CLOSED"
        public string DataSource { get; set; } = "Binance"; // "Binance" | "Simulation" | "NSE"
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        public List<decimal> Sparkline { get; set; } = new();
    }
}
