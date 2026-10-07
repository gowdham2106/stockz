using System;
using System.Collections.Generic;

namespace TradingTerminal.Api.Models
{
    public class BrokerConnectRequest
    {
        public string BrokerId { get; set; } = string.Empty; // "zerodha", "coinbase", "interactive_brokers", "robinhood", "metatrader", "binance"
        public string ApiKey { get; set; } = string.Empty;
        public string SecretKey { get; set; } = string.Empty;
        public string? RequestToken { get; set; } // for Zerodha Kite Connect
        public string? AccountId { get; set; } // for IBKR / MT5 / Zerodha
        public string? Password { get; set; } // for MT5
        public string? Server { get; set; } // for MT5
        public bool IsTestnet { get; set; } = false;
    }

    public class BrokerHoldingItem
    {
        public string Symbol { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string AssetType { get; set; } = "stock"; // stock, crypto, forex, commodity
        public decimal Quantity { get; set; }
        public decimal AvgPrice { get; set; }
        public decimal LastPrice { get; set; }
        public decimal MarketValue { get; set; }
        public decimal UnrealizedPnl { get; set; }
        public decimal UnrealizedPnlPercent { get; set; }
        public string Currency { get; set; } = "USD"; // USD, INR, EUR
        public string Exchange { get; set; } = "NSE"; // NSE, BSE, NASDAQ, NYSE, BINANCE
    }

    public class UnifiedBrokerAccount
    {
        public string BrokerId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string AccountId { get; set; } = string.Empty;
        public string AccountType { get; set; } = "Equity & Derivatives";
        public string Status { get; set; } = "CONNECTED"; // CONNECTED | LIVE_SYNCED | DEMO
        public bool IsRealLiveSync { get; set; }
        public string MaskedApiKey { get; set; } = string.Empty;
        public string Currency { get; set; } = "USD"; // INR for Zerodha, USD for others
        public decimal TotalBalance { get; set; }
        public decimal TotalBalanceUsd { get; set; }
        public decimal AvailableCash { get; set; }
        public decimal MarginUsed { get; set; }
        public decimal TodayPnl { get; set; }
        public decimal TodayPnlPercent { get; set; }
        public List<BrokerHoldingItem> Holdings { get; set; } = new();
        public string Message { get; set; } = string.Empty;
        public string OfficialLoginUrl { get; set; } = string.Empty;
        public string ApiDocsUrl { get; set; } = string.Empty;
    }
}
