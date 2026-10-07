using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using TradingTerminal.Api.DTOs;
using TradingTerminal.Api.Hubs;
using TradingTerminal.Api.Interfaces;
using TradingTerminal.Api.Models;

namespace TradingTerminal.Api.Services
{
    public class MarketDataService : IMarketDataService
    {
        private readonly IAssetRepository _assetRepository;
        private readonly IHubContext<MarketHub> _hubContext;
        private readonly ILogger<MarketDataService> _logger;

        private readonly ConnectionStatusDto _connectionStatus = new()
        {
            Provider = "Binance Real-Time Multi-Asset Stream",
            Status = "LIVE",
            LatencyMs = 28,
            LastUpdate = DateTime.UtcNow,
            ActiveStreams = 24,
            Mode = "HYBRID_LIVE",
            Endpoint = "wss://stream.binance.com:9443/stream"
        };

        private readonly ConcurrentDictionary<string, DateTime> _lastBroadcastTime = new(StringComparer.OrdinalIgnoreCase);
        private readonly TimeSpan _broadcastThrottle = TimeSpan.FromMilliseconds(15); // Ultra-responsive 15ms throttle

        private readonly IPaperTradingService _paperTradingService;

        public MarketDataService(
            IAssetRepository assetRepository,
            IHubContext<MarketHub> hubContext,
            IPaperTradingService paperTradingService,
            ILogger<MarketDataService> logger)
        {
            _assetRepository = assetRepository;
            _hubContext = hubContext;
            _paperTradingService = paperTradingService;
            _logger = logger;
        }

        public async Task<IReadOnlyList<MarketAsset>> GetAllAssetsAsync()
        {
            return await _assetRepository.GetAllAssetsAsync();
        }

        public async Task<MarketAsset?> GetAssetAsync(string symbol)
        {
            return await _assetRepository.GetAssetBySymbolAsync(symbol);
        }

        public async Task<IReadOnlyList<MarketAsset>> GetAssetsByTypeAsync(string type)
        {
            if (string.IsNullOrWhiteSpace(type) || type.Equals("all", StringComparison.OrdinalIgnoreCase))
            {
                return await _assetRepository.GetAllAssetsAsync();
            }

            var parsed = type.ToLowerInvariant() switch
            {
                "crypto" => AssetType.Crypto,
                "stock" or "stocks" => AssetType.Stock,
                "indian_stock" or "indian_stocks" or "india" => AssetType.IndianStock,
                "index" or "indices" => AssetType.Index,
                "forex" => AssetType.Forex,
                "commodity" or "commodities" => AssetType.Commodity,
                "etf" or "etfs" => AssetType.Etf,
                _ => AssetType.Crypto
            };

            return await _assetRepository.GetAssetsByTypeAsync(parsed);
        }

        public async Task<IReadOnlyList<MarketAsset>> SearchAssetsAsync(string query)
        {
            return await _assetRepository.SearchAssetsAsync(query);
        }

        public async Task<MarketPulseDto> GetMarketPulseAsync()
        {
            var assets = await _assetRepository.GetAllAssetsAsync();
            var btc = assets.FirstOrDefault(a => a.Symbol == "BTC/USDT");
            var eth = assets.FirstOrDefault(a => a.Symbol == "ETH/USDT");
            var spx = assets.FirstOrDefault(a => a.Symbol == "S&P 500");
            var nifty = assets.FirstOrDefault(a => a.Symbol == "NIFTY 50");
            var eurusd = assets.FirstOrDefault(a => a.Symbol == "EUR/USD");
            var gold = assets.FirstOrDefault(a => a.Symbol == "Gold");

            int gainers = assets.Count(a => a.ChangePercent > 0);
            int losers = assets.Count(a => a.ChangePercent < 0);

            var pulse = new MarketPulseDto
            {
                GlobalStatus = "● Institutional Market Gateway Active",
                FearAndGreedIndex = 68,
                FearAndGreedLabel = "Greed (Bullish Bias)",
                Total24hVolumeUsd = 142850000000m,
                GainersCount = gainers,
                LosersCount = losers,
                PulseCards = new List<MarketPulseCardDto>
                {
                    new MarketPulseCardDto
                    {
                        Id = "crypto-pulse",
                        Title = "Crypto Market",
                        PrimarySymbol = "BTC/USDT",
                        CurrentValue = btc != null ? $"${btc.Price:N2}" : "$86,172.00",
                        ChangePercent = btc?.ChangePercent ?? 1.42m,
                        Status = "24/7 LIVE",
                        Sentiment = "Bullish",
                        Sparkline = btc?.Sparkline ?? new List<decimal> { 85400, 85800, 86100, 86172 }
                    },
                    new MarketPulseCardDto
                    {
                        Id = "us-pulse",
                        Title = "US Equity Markets",
                        PrimarySymbol = "S&P 500",
                        CurrentValue = spx != null ? $"{spx.Price:N2}" : "5,751.13",
                        ChangePercent = spx?.ChangePercent ?? 0.50m,
                        Status = "MARKET OPEN",
                        Sentiment = "Bullish",
                        Sparkline = spx?.Sparkline ?? new List<decimal> { 5720, 5735, 5748, 5751 }
                    },
                    new MarketPulseCardDto
                    {
                        Id = "india-pulse",
                        Title = "Indian Markets",
                        PrimarySymbol = "NIFTY 50",
                        CurrentValue = nifty != null ? $"{nifty.Price:N2}" : "25,014.60",
                        ChangePercent = nifty?.ChangePercent ?? 0.64m,
                        Status = "NSE/BSE ACTIVE",
                        Sentiment = "Bullish",
                        Sparkline = nifty?.Sparkline ?? new List<decimal> { 24890, 24950, 25010, 25014 }
                    },
                    new MarketPulseCardDto
                    {
                        Id = "forex-pulse",
                        Title = "Global FX",
                        PrimarySymbol = "EUR/USD",
                        CurrentValue = eurusd != null ? $"{eurusd.Price:F4}" : "1.0975",
                        ChangePercent = eurusd?.ChangePercent ?? -0.16m,
                        Status = "24/5 ACTIVE",
                        Sentiment = "Neutral",
                        Sparkline = eurusd?.Sparkline ?? new List<decimal> { 1.0990m, 1.0982m, 1.0975m }
                    },
                    new MarketPulseCardDto
                    {
                        Id = "commodity-pulse",
                        Title = "Commodities",
                        PrimarySymbol = "Gold (oz)",
                        CurrentValue = gold != null ? $"${gold.Price:N2}" : "$2,654.80",
                        ChangePercent = gold?.ChangePercent ?? 0.21m,
                        Status = "ACTIVE",
                        Sentiment = "Bullish",
                        Sparkline = gold?.Sparkline ?? new List<decimal> { 2645, 2650, 2655, 2654 }
                    }
                }
            };

            return pulse;
        }

        public async Task<IReadOnlyList<MarketScannerItemDto>> GetScannerResultsAsync(string preset)
        {
            var assets = await _assetRepository.GetAllAssetsAsync();
            var rand = new Random(42);

            var items = assets.Select(a =>
            {
                var isPos = a.ChangePercent >= 0;
                var rsi = isPos ? (55m + (decimal)rand.NextDouble() * 25m) : (30m + (decimal)rand.NextDouble() * 25m);
                var volatility = Math.Abs(a.ChangePercent) > 3.0m ? "HIGH" : (Math.Abs(a.ChangePercent) > 1.2m ? "MEDIUM" : "LOW");
                var trend = a.ChangePercent > 1.5m ? "STRONG BULLISH" : (a.ChangePercent > 0 ? "BULLISH" : (a.ChangePercent < -1.5m ? "STRONG BEARISH" : "NEUTRAL"));

                string signal = "MOMENTUM_CONSOLIDATION";
                if (rsi > 70) signal = "OVERBOUGHT_EXTREME";
                else if (rsi < 35) signal = "OVERSOLD_REVERSAL";
                else if (a.ChangePercent > 2.0m) signal = "BULLISH_BREAKOUT";
                else if (a.ChangePercent < -2.0m) signal = "BEARISH_BREAKDOWN";

                return new MarketScannerItemDto
                {
                    Symbol = a.Symbol,
                    Name = a.Name,
                    AssetType = a.AssetTypeString,
                    Price = a.Price,
                    ChangePercent = a.ChangePercent,
                    Volume = a.Volume ?? (a.Price * 12500m),
                    MarketCap = a.MarketCap ?? (a.Price * 50000000m),
                    Rsi = Math.Round(rsi, 1),
                    Volatility = volatility,
                    Trend = trend,
                    Signal = signal,
                    Ema20Distance = Math.Round(a.ChangePercent * 0.45m, 2)
                };
            }).ToList();

            var normalizedPreset = preset?.ToLowerInvariant() ?? "all";
            return normalizedPreset switch
            {
                "gainers" or "top-gainers" => items.OrderByDescending(x => x.ChangePercent).Take(20).ToList(),
                "losers" or "top-losers" => items.OrderBy(x => x.ChangePercent).Take(20).ToList(),
                "volume" or "high-volume" => items.OrderByDescending(x => x.Volume).Take(20).ToList(),
                "volatility" or "high-volatility" => items.OrderByDescending(x => Math.Abs(x.ChangePercent)).Take(20).ToList(),
                "breakouts" => items.Where(x => x.Signal.Contains("BREAKOUT")).ToList(),
                "oversold" => items.Where(x => x.Rsi < 40).OrderBy(x => x.Rsi).ToList(),
                "overbought" => items.Where(x => x.Rsi > 65).OrderByDescending(x => x.Rsi).ToList(),
                "trending" => items.Where(x => x.Trend.Contains("BULLISH")).OrderByDescending(x => x.ChangePercent).ToList(),
                _ => items
            };
        }

        public async Task<IReadOnlyList<CandleStickDto>> GetCandlesAsync(string symbol, string timeframe)
        {
            return await _assetRepository.GetCandlesAsync(symbol, timeframe);
        }

        public async Task<OrderBookDto> GetOrderBookAsync(string symbol)
        {
            return await _assetRepository.GetOrderBookAsync(symbol);
        }

        public async Task<IReadOnlyList<TradeDto>> GetRecentTradesAsync(string symbol)
        {
            return await _assetRepository.GetRecentTradesAsync(symbol);
        }

        public async Task<AiInsightDto> GetAiInsightAsync(string symbol)
        {
            return await _assetRepository.GetAiInsightAsync(symbol);
        }

        public async Task<PortfolioDto> GetSimulatedPortfolioAsync()
        {
            var assets = await _assetRepository.GetAllAssetsAsync();
            var btc = assets.FirstOrDefault(a => a.Symbol == "BTC/USDT");
            var eth = assets.FirstOrDefault(a => a.Symbol == "ETH/USDT");
            var sol = assets.FirstOrDefault(a => a.Symbol == "SOL/USDT");
            var nvda = assets.FirstOrDefault(a => a.Symbol == "NVDA");
            var aapl = assets.FirstOrDefault(a => a.Symbol == "AAPL");
            var rel = assets.FirstOrDefault(a => a.Symbol == "RELIANCE");
            var gold = assets.FirstOrDefault(a => a.Symbol == "Gold");

            var holdings = new List<HoldingDto>
            {
                new HoldingDto
                {
                    Symbol = "BTC/USDT",
                    Name = "Bitcoin",
                    AssetType = "crypto",
                    Quantity = 0.85m,
                    AvgBuyPrice = 61250.00m,
                    CurrentPrice = btc?.Price ?? 86172.00m,
                    AllocationPercent = 38.5m
                },
                new HoldingDto
                {
                    Symbol = "ETH/USDT",
                    Name = "Ethereum",
                    AssetType = "crypto",
                    Quantity = 8.2m,
                    AvgBuyPrice = 2280.00m,
                    CurrentPrice = eth?.Price ?? 2715.20m,
                    AllocationPercent = 13.2m
                },
                new HoldingDto
                {
                    Symbol = "NVDA",
                    Name = "NVIDIA Corp",
                    AssetType = "stock",
                    Quantity = 150m,
                    AvgBuyPrice = 118.40m,
                    CurrentPrice = nvda?.Price ?? 138.25m,
                    AllocationPercent = 13.7m
                },
                new HoldingDto
                {
                    Symbol = "AAPL",
                    Name = "Apple Inc",
                    AssetType = "stock",
                    Quantity = 80m,
                    AvgBuyPrice = 215.00m,
                    CurrentPrice = aapl?.Price ?? 232.50m,
                    AllocationPercent = 12.3m
                },
                new HoldingDto
                {
                    Symbol = "SOL/USDT",
                    Name = "Solana",
                    AssetType = "crypto",
                    Quantity = 60m,
                    AvgBuyPrice = 142.00m,
                    CurrentPrice = sol?.Price ?? 176.50m,
                    AllocationPercent = 7.0m
                },
                new HoldingDto
                {
                    Symbol = "Gold",
                    Name = "Gold Spot",
                    AssetType = "commodity",
                    Quantity = 6.0m,
                    AvgBuyPrice = 2480.00m,
                    CurrentPrice = gold?.Price ?? 2654.80m,
                    AllocationPercent = 10.5m
                },
                new HoldingDto
                {
                    Symbol = "RELIANCE",
                    Name = "Reliance Industries",
                    AssetType = "indian_stock",
                    Quantity = 200m,
                    AvgBuyPrice = 2620.00m,
                    CurrentPrice = rel?.Price ?? 2745.20m,
                    AllocationPercent = 4.8m
                }
            };

            decimal totalHoldingsValue = holdings.Sum(h => h.MarketValue);
            decimal totalCost = holdings.Sum(h => h.TotalCost);
            decimal cash = 32450.00m;
            decimal totalPortfolio = totalHoldingsValue + cash;
            decimal totalPnL = totalHoldingsValue - totalCost;
            decimal totalPnLPercent = totalCost > 0 ? (totalPnL / totalCost) * 100m : 0;
            decimal todayPnL = holdings.Sum(h => h.MarketValue * 0.0125m);
            decimal todayPnLPercent = totalPortfolio > 0 ? (todayPnL / totalPortfolio) * 100m : 0;

            foreach (var h in holdings)
            {
                h.AllocationPercent = totalPortfolio > 0 ? Math.Round((h.MarketValue / totalPortfolio) * 100m, 1) : 0;
            }

            var portfolio = new PortfolioDto
            {
                Mode = "SIMULATION",
                AccountName = "Institutional Alpha Portfolio (Demo)",
                TotalPortfolioValue = Math.Round(totalPortfolio, 2),
                AvailableCash = cash,
                InvestedValue = Math.Round(totalHoldingsValue, 2),
                TodayPnL = Math.Round(todayPnL, 2),
                TodayPnLPercent = Math.Round(todayPnLPercent, 2),
                AllTimePnL = Math.Round(totalPnL, 2),
                AllTimePnLPercent = Math.Round(totalPnLPercent, 2),
                Holdings = holdings,
                PerformanceHistory = new List<PortfolioHistoryPointDto>
                {
                    new PortfolioHistoryPointDto { Date = "Day -30", Value = 132000, PnL = 0 },
                    new PortfolioHistoryPointDto { Date = "Day -25", Value = 134500, PnL = 2500 },
                    new PortfolioHistoryPointDto { Date = "Day -20", Value = 138200, PnL = 6200 },
                    new PortfolioHistoryPointDto { Date = "Day -15", Value = 136100, PnL = 4100 },
                    new PortfolioHistoryPointDto { Date = "Day -10", Value = 142800, PnL = 10800 },
                    new PortfolioHistoryPointDto { Date = "Day -5", Value = 147500, PnL = 15500 },
                    new PortfolioHistoryPointDto { Date = "Today", Value = Math.Round(totalPortfolio, 2), PnL = Math.Round(totalPnL, 2) }
                }
            };

            return portfolio;
        }

        public ConnectionStatusDto GetConnectionStatus()
        {
            _connectionStatus.LastUpdate = DateTime.UtcNow;
            return _connectionStatus;
        }

        public void UpdateConnectionStatus(string provider, string status, int latencyMs)
        {
            _connectionStatus.Provider = provider;
            _connectionStatus.Status = status;
            if (latencyMs > 0) _connectionStatus.LatencyMs = latencyMs;
            _connectionStatus.LastUpdate = DateTime.UtcNow;

            _hubContext.Clients.All.SendAsync("ConnectionStatusChanged", _connectionStatus);
        }

        public async Task ProcessAssetUpdateAsync(MarketAsset asset)
        {
            await _assetRepository.UpsertAssetAsync(asset);

            // Immediately check paper trading Stop-Loss, Take-Profit, and Limit order triggers
            _ = _paperTradingService.CheckTriggersAndFillsAsync(asset.Symbol, asset.Price, asset.High ?? asset.Price, asset.Low ?? asset.Price);

            var now = DateTime.UtcNow;
            if (_lastBroadcastTime.TryGetValue(asset.Symbol, out var lastTime) && (now - lastTime) < _broadcastThrottle)
            {
                return;
            }
            _lastBroadcastTime[asset.Symbol] = now;

            // Broadcast to all clients immediately
            await _hubContext.Clients.All.SendAsync("TickerUpdated", asset);

            // Broadcast to specific symbol room
            var normalizedSymbol = asset.Symbol.Replace("/", "").ToUpperInvariant();
            await _hubContext.Clients.Group($"Symbol_{normalizedSymbol}").SendAsync("PriceUpdated", asset);
        }

        public async Task ProcessOrderBookUpdateAsync(OrderBookDto orderBook)
        {
            var normalizedSymbol = orderBook.Symbol.Replace("/", "").ToUpperInvariant();
            await _hubContext.Clients.Group($"OrderBook_{normalizedSymbol}").SendAsync("OrderBookUpdated", orderBook);
        }

        public async Task ProcessTradeUpdateAsync(TradeDto trade)
        {
            var normalizedSymbol = trade.Symbol.Replace("/", "").ToUpperInvariant();
            await _hubContext.Clients.Group($"Trades_{normalizedSymbol}").SendAsync("TradeUpdated", trade);

            // Update asset price from live trade immediately
            var existingAsset = await _assetRepository.GetAssetBySymbolAsync(trade.Symbol);
            if (existingAsset != null && trade.Price > 0)
            {
                decimal delta = trade.Price - existingAsset.Price;
                existingAsset.Price = trade.Price;
                existingAsset.Change += delta;
                if (existingAsset.Open > 0)
                {
                    existingAsset.ChangePercent = Math.Round(((existingAsset.Price - existingAsset.Open.Value) / existingAsset.Open.Value) * 100m, 3);
                }
                if (existingAsset.High == null || trade.Price > existingAsset.High) existingAsset.High = trade.Price;
                if (existingAsset.Low == null || trade.Price < existingAsset.Low) existingAsset.Low = trade.Price;
                existingAsset.Timestamp = DateTime.UtcNow;

                await ProcessAssetUpdateAsync(existingAsset);
            }
        }
    }
}
