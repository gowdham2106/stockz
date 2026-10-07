using System;
using System.Collections.Generic;

namespace TradingTerminal.Api.Models
{
    public class BinanceConnectRequest
    {
        public string ApiKey { get; set; } = string.Empty;
        public string SecretKey { get; set; } = string.Empty;
        public bool IsTestnet { get; set; } = false;
    }

    public class BinanceCoinBalance
    {
        public string Asset { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public decimal Free { get; set; }
        public decimal Locked { get; set; }
        public decimal Total => Free + Locked;
        public decimal EstimatedUsdValue { get; set; }
        public decimal Change24h { get; set; }
        public string IconBg { get; set; } = "#F0B90B";
    }

    public class BinanceAccountSummary
    {
        public bool IsConnected { get; set; }
        public string AccountType { get; set; } = "SPOT";
        public string AccountId { get; set; } = "BINANCE-LIVE";
        public bool CanTrade { get; set; }
        public bool CanWithdraw { get; set; }
        public bool CanDeposit { get; set; }
        public long UpdateTime { get; set; }
        public decimal TotalBalanceUsd { get; set; }
        public decimal TotalBalanceBtc { get; set; }
        public decimal SpotBalanceUsd { get; set; }
        public decimal FuturesEstimatedUsd { get; set; }
        public decimal TodayPnlUsd { get; set; }
        public decimal TodayPnlPercent { get; set; }
        public List<BinanceCoinBalance> Balances { get; set; } = new();
        public string MaskedApiKey { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public bool IsRealLiveSync { get; set; }
    }
}
