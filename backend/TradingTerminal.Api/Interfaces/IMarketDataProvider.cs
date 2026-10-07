using System;
using System.Threading;
using System.Threading.Tasks;
using TradingTerminal.Api.DTOs;
using TradingTerminal.Api.Models;

namespace TradingTerminal.Api.Interfaces
{
    public interface IMarketDataProvider
    {
        string ProviderName { get; }
        bool IsConnected { get; }
        Task StartAsync(CancellationToken cancellationToken);
        Task StopAsync(CancellationToken cancellationToken);
        
        event Action<MarketAsset>? OnAssetUpdated;
        event Action<OrderBookDto>? OnOrderBookUpdated;
        event Action<TradeDto>? OnTradeExecuted;
        event Action<string, string, int>? OnConnectionStatusChanged;
    }
}
