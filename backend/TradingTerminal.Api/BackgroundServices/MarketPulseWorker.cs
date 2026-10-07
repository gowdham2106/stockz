using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using TradingTerminal.Api.DTOs;
using TradingTerminal.Api.Interfaces;
using TradingTerminal.Api.Models;

namespace TradingTerminal.Api.BackgroundServices
{
    public class MarketPulseWorker : BackgroundService
    {
        private readonly IMarketDataService _marketDataService;
        private readonly IAssetRepository _assetRepository;
        private readonly ILogger<MarketPulseWorker> _logger;

        public MarketPulseWorker(
            IMarketDataService marketDataService,
            IAssetRepository assetRepository,
            ILogger<MarketPulseWorker> logger)
        {
            _marketDataService = marketDataService;
            _assetRepository = assetRepository;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("High-Frequency Market Pulse & Multi-Asset Worker started.");
            var rand = new Random();

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    // Ultra-smooth 150ms - 300ms tick cadence
                    await Task.Delay(rand.Next(150, 300), stoppingToken);

                    var allAssets = await _assetRepository.GetAllAssetsAsync();
                    var nonCrypto = allAssets.Where(a => a.AssetType != AssetType.Crypto).ToList();

                    if (nonCrypto.Count > 0)
                    {
                        // Pick 2 random non-crypto assets to micro-tick per cycle
                        int ticksCount = rand.Next(1, 3);
                        for (int i = 0; i < ticksCount; i++)
                        {
                            var target = nonCrypto[rand.Next(nonCrypto.Count)];
                            
                            // Fractional Brownian micro-tick (-0.05% to +0.05%)
                            decimal tickPercent = (decimal)((rand.NextDouble() - 0.495) * 0.001);
                            decimal delta = target.Price * tickPercent;
                            decimal newPrice = Math.Round(target.Price + delta, target.Price > 10 ? 2 : 4);
                            if (newPrice <= 0) newPrice = target.Price;

                            decimal newChange = target.Change + delta;
                            decimal prevClose = target.PreviousClose ?? (newPrice - newChange);
                            decimal newChangePercent = prevClose > 0 ? Math.Round((newChange / prevClose) * 100m, 2) : target.ChangePercent;

                            target.Price = newPrice;
                            target.Change = Math.Round(newChange, 2);
                            target.ChangePercent = newChangePercent;
                            if (target.High == null || newPrice > target.High) target.High = newPrice;
                            if (target.Low == null || newPrice < target.Low) target.Low = newPrice;
                            target.Timestamp = DateTime.UtcNow;

                            var trade = new TradeDto
                            {
                                Id = Guid.NewGuid().ToString("N").Substring(0, 8),
                                Symbol = target.Symbol,
                                Price = newPrice,
                                Amount = Math.Round((decimal)(rand.NextDouble() * 50 + 1) * (target.Price > 1000 ? 0.1m : 5m), 2),
                                Side = delta >= 0 ? "BUY" : "SELL",
                                Timestamp = DateTime.UtcNow
                            };

                            await _marketDataService.ProcessAssetUpdateAsync(target);
                            await _marketDataService.ProcessTradeUpdateAsync(trade);
                        }
                    }
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogTrace("Pulse worker tick exception: {Message}", ex.Message);
                }
            }
        }
    }
}
