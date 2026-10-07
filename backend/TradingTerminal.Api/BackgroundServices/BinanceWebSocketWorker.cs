using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using TradingTerminal.Api.Interfaces;

namespace TradingTerminal.Api.BackgroundServices
{
    public class BinanceWebSocketWorker : BackgroundService
    {
        private readonly IMarketDataProvider _binanceProvider;
        private readonly IMarketDataService _marketDataService;
        private readonly ILogger<BinanceWebSocketWorker> _logger;

        public BinanceWebSocketWorker(
            IMarketDataProvider binanceProvider,
            IMarketDataService marketDataService,
            ILogger<BinanceWebSocketWorker> logger)
        {
            _binanceProvider = binanceProvider;
            _marketDataService = marketDataService;
            _logger = logger;

            _binanceProvider.OnAssetUpdated += asset =>
            {
                _ = _marketDataService.ProcessAssetUpdateAsync(asset);
            };

            _binanceProvider.OnOrderBookUpdated += ob =>
            {
                _ = _marketDataService.ProcessOrderBookUpdateAsync(ob);
            };

            _binanceProvider.OnTradeExecuted += trade =>
            {
                _ = _marketDataService.ProcessTradeUpdateAsync(trade);
            };

            _binanceProvider.OnConnectionStatusChanged += (provider, status, latency) =>
            {
                _marketDataService.UpdateConnectionStatus(provider, status, latency);
            };
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Starting Binance WebSocket Worker...");
            await _binanceProvider.StartAsync(stoppingToken);
        }

        public override async Task StopAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("Stopping Binance WebSocket Worker...");
            await _binanceProvider.StopAsync(cancellationToken);
            await base.StopAsync(cancellationToken);
        }
    }
}
