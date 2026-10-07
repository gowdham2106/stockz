using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using TradingTerminal.Api.DTOs;
using TradingTerminal.Api.Interfaces;
using TradingTerminal.Api.Models;

namespace TradingTerminal.Api.Services
{
    public class InMemoryAssetRepository : IAssetRepository
    {
        private readonly ConcurrentDictionary<string, MarketAsset> _assets = new(StringComparer.OrdinalIgnoreCase);
        private readonly ConcurrentDictionary<string, List<CandleStickDto>> _candleCache = new(StringComparer.OrdinalIgnoreCase);

        public InMemoryAssetRepository()
        {
            SeedAssets();
        }

        public Task<IReadOnlyList<MarketAsset>> GetAllAssetsAsync()
        {
            return Task.FromResult<IReadOnlyList<MarketAsset>>(_assets.Values.ToList());
        }

        public Task<MarketAsset?> GetAssetBySymbolAsync(string symbol)
        {
            var key = NormalizeKey(symbol);
            _assets.TryGetValue(key, out var asset);
            if (asset == null)
            {
                // Try searching with or without slashes
                asset = _assets.Values.FirstOrDefault(a => 
                    a.Symbol.Equals(symbol, StringComparison.OrdinalIgnoreCase) ||
                    a.RawSymbol.Equals(symbol, StringComparison.OrdinalIgnoreCase) ||
                    a.Symbol.Replace("/", "").Equals(symbol.Replace("/", ""), StringComparison.OrdinalIgnoreCase));
            }
            return Task.FromResult(asset);
        }

        public Task<IReadOnlyList<MarketAsset>> GetAssetsByTypeAsync(AssetType assetType)
        {
            var list = _assets.Values.Where(a => a.AssetType == assetType).ToList();
            return Task.FromResult<IReadOnlyList<MarketAsset>>(list);
        }

        public Task<IReadOnlyList<MarketAsset>> SearchAssetsAsync(string query)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return Task.FromResult<IReadOnlyList<MarketAsset>>(_assets.Values.ToList());
            }

            var q = query.Trim().ToUpperInvariant();
            var list = _assets.Values.Where(a =>
                a.Symbol.ToUpperInvariant().Contains(q) ||
                a.Name.ToUpperInvariant().Contains(q) ||
                (a.Sector != null && a.Sector.ToUpperInvariant().Contains(q)) ||
                a.Exchange.ToUpperInvariant().Contains(q)
            ).ToList();

            return Task.FromResult<IReadOnlyList<MarketAsset>>(list);
        }

        public Task UpsertAssetAsync(MarketAsset asset)
        {
            var key = NormalizeKey(asset.Symbol);
            _assets.AddOrUpdate(key, asset, (k, existing) =>
            {
                // Preserve metadata if new update only has tick data
                if (string.IsNullOrEmpty(asset.Name)) asset.Name = existing.Name;
                if (asset.MarketCap == null || asset.MarketCap == 0) asset.MarketCap = existing.MarketCap;
                if (string.IsNullOrEmpty(asset.Sector)) asset.Sector = existing.Sector;
                if (asset.PE == null) asset.PE = existing.PE;
                if (asset.EPS == null) asset.EPS = existing.EPS;
                if (asset.Sparkline.Count == 0 && existing.Sparkline.Count > 0)
                {
                    asset.Sparkline = new List<decimal>(existing.Sparkline);
                    asset.Sparkline.Add(asset.Price);
                    if (asset.Sparkline.Count > 30) asset.Sparkline.RemoveAt(0);
                }
                return asset;
            });
            return Task.CompletedTask;
        }

        public Task<IReadOnlyList<CandleStickDto>> GetCandlesAsync(string symbol, string timeframe, int limit = 100)
        {
            var key = $"{NormalizeKey(symbol)}_{timeframe.ToLowerInvariant()}";
            if (_candleCache.TryGetValue(key, out var cached) && cached.Count >= limit)
            {
                return Task.FromResult<IReadOnlyList<CandleStickDto>>(cached);
            }

            var asset = _assets.Values.FirstOrDefault(a => 
                a.Symbol.Equals(symbol, StringComparison.OrdinalIgnoreCase) || 
                a.RawSymbol.Equals(symbol, StringComparison.OrdinalIgnoreCase) ||
                a.Symbol.Replace("/", "").Equals(symbol.Replace("/", ""), StringComparison.OrdinalIgnoreCase));

            decimal basePrice = asset?.Price > 0 ? asset.Price : 100m;
            int secondsPerBar = timeframe.ToLowerInvariant() switch
            {
                "1m" => 60,
                "5m" => 300,
                "15m" => 900,
                "1h" => 3600,
                "4h" => 14400,
                "1d" => 86400,
                "1w" => 604800,
                "1mth" => 2592000,
                _ => 300
            };

            var now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            // Align to current timeframe boundary
            var currentBarTime = now - (now % secondsPerBar);

            var candles = new List<CandleStickDto>();
            var rand = new Random(Math.Abs(symbol.GetHashCode()) + timeframe.GetHashCode());

            // Generate synthetic past candles matching current price
            decimal currentClose = basePrice;
            decimal volatility = (basePrice * 0.008m); // 0.8% typical bar range

            // We generate backwards then reverse
            for (int i = limit - 1; i >= 0; i--)
            {
                long barTime = currentBarTime - (i * secondsPerBar);
                
                // Random delta
                decimal delta = (decimal)(rand.NextDouble() - 0.49) * volatility * 2m;
                decimal open = currentClose - delta;
                decimal high = Math.Max(open, currentClose) + (decimal)rand.NextDouble() * volatility * 0.8m;
                decimal low = Math.Min(open, currentClose) - (decimal)rand.NextDouble() * volatility * 0.8m;
                if (low <= 0) low = open * 0.9m;
                decimal volume = (decimal)(rand.NextDouble() * 50 + 10) * (basePrice > 1000 ? 1.5m : 50m);

                candles.Add(new CandleStickDto
                {
                    Time = barTime,
                    Open = Math.Round(open, 2),
                    High = Math.Round(high, 2),
                    Low = Math.Round(low, 2),
                    Close = Math.Round(currentClose, 2),
                    Volume = Math.Round(volume, 2)
                });

                // Next iteration's starting close
                currentClose = open;
            }

            // Adjust so the latest bar matches exact current price
            if (candles.Count > 0 && asset != null)
            {
                var last = candles.Last();
                last.Close = asset.Price;
                if (last.Close > last.High) last.High = last.Close;
                if (last.Close < last.Low) last.Low = last.Close;
            }

            _candleCache[key] = candles;
            return Task.FromResult<IReadOnlyList<CandleStickDto>>(candles);
        }

        public Task<OrderBookDto> GetOrderBookAsync(string symbol)
        {
            var asset = _assets.Values.FirstOrDefault(a => 
                a.Symbol.Equals(symbol, StringComparison.OrdinalIgnoreCase) || 
                a.RawSymbol.Equals(symbol, StringComparison.OrdinalIgnoreCase) ||
                a.Symbol.Replace("/", "").Equals(symbol.Replace("/", ""), StringComparison.OrdinalIgnoreCase));

            decimal mid = asset?.Price > 0 ? asset.Price : 50000m;
            decimal tickSize = mid > 1000 ? 0.5m : (mid > 50 ? 0.05m : 0.0001m);

            var ob = new OrderBookDto
            {
                Symbol = asset?.Symbol ?? symbol,
                Timestamp = DateTime.UtcNow
            };

            var rand = new Random();
            decimal runningAskTotal = 0;
            decimal runningBidTotal = 0;

            for (int i = 1; i <= 15; i++)
            {
                decimal askPrice = Math.Round(mid + (i * tickSize * (decimal)(1 + rand.NextDouble() * 0.5)), mid > 10 ? 2 : 4);
                decimal askAmt = Math.Round((decimal)(rand.NextDouble() * 2.5 + 0.1) * (mid > 1000 ? 0.8m : 15m), 4);
                runningAskTotal += askAmt;
                ob.Asks.Add(new OrderBookLevel { Price = askPrice, Amount = askAmt, Total = Math.Round(runningAskTotal, 4) });

                decimal bidPrice = Math.Round(mid - (i * tickSize * (decimal)(1 + rand.NextDouble() * 0.5)), mid > 10 ? 2 : 4);
                decimal bidAmt = Math.Round((decimal)(rand.NextDouble() * 2.5 + 0.1) * (mid > 1000 ? 0.8m : 15m), 4);
                runningBidTotal += bidAmt;
                ob.Bids.Add(new OrderBookLevel { Price = bidPrice, Amount = bidAmt, Total = Math.Round(runningBidTotal, 4) });
            }

            return Task.FromResult(ob);
        }

        public Task<IReadOnlyList<TradeDto>> GetRecentTradesAsync(string symbol, int limit = 30)
        {
            var asset = _assets.Values.FirstOrDefault(a => 
                a.Symbol.Equals(symbol, StringComparison.OrdinalIgnoreCase) || 
                a.RawSymbol.Equals(symbol, StringComparison.OrdinalIgnoreCase) ||
                a.Symbol.Replace("/", "").Equals(symbol.Replace("/", ""), StringComparison.OrdinalIgnoreCase));

            decimal mid = asset?.Price > 0 ? asset.Price : 50000m;
            var rand = new Random();
            var trades = new List<TradeDto>();
            var now = DateTime.UtcNow;

            for (int i = 0; i < limit; i++)
            {
                decimal spreadVariance = (decimal)(rand.NextDouble() - 0.5) * (mid * 0.001m);
                decimal price = Math.Round(mid + spreadVariance, mid > 10 ? 2 : 4);
                decimal amount = Math.Round((decimal)(rand.NextDouble() * 1.5 + 0.05) * (mid > 1000 ? 0.5m : 25m), 4);
                string side = rand.Next(2) == 0 ? "BUY" : "SELL";

                trades.Add(new TradeDto
                {
                    Id = (1000000 + i).ToString(),
                    Symbol = asset?.Symbol ?? symbol,
                    Price = price,
                    Amount = amount,
                    Side = side,
                    Timestamp = now.AddSeconds(-i * (rand.Next(1, 4)))
                });
            }

            return Task.FromResult<IReadOnlyList<TradeDto>>(trades);
        }

        public Task<AiInsightDto> GetAiInsightAsync(string symbol)
        {
            var asset = _assets.Values.FirstOrDefault(a => 
                a.Symbol.Equals(symbol, StringComparison.OrdinalIgnoreCase) || 
                a.RawSymbol.Equals(symbol, StringComparison.OrdinalIgnoreCase) ||
                a.Symbol.Replace("/", "").Equals(symbol.Replace("/", ""), StringComparison.OrdinalIgnoreCase));

            decimal price = asset?.Price > 0 ? asset.Price : 100m;
            bool isPositive = asset != null && asset.ChangePercent >= 0;

            var insight = new AiInsightDto
            {
                Symbol = asset?.Symbol ?? symbol,
                Name = asset?.Name ?? symbol,
                Trend = isPositive ? "BULLISH" : "BEARISH",
                Momentum = isPositive ? "STRONG EXPANSION" : "CONSOLIDATION",
                Volatility = "MODERATE",
                MarketRegime = isPositive ? "TREND FOLLOWING" : "RANGE BOUND",
                AiConfidence = isPositive ? 84 : 71,
                Signal = isPositive ? "BUY BIAS (SIMULATED)" : "HOLD / NEUTRAL (SIMULATED)",
                SupportLevel = Math.Round(price * 0.965m, 2),
                ResistanceLevel = Math.Round(price * 1.042m, 2),
                TargetPrice = Math.Round(price * (isPositive ? 1.085m : 0.94m), 2),
                StopLossLevel = Math.Round(price * (isPositive ? 0.955m : 1.035m), 2),
                Reasoning = new List<string>
                {
                    $"Price trading {(isPositive ? "above" : "testing")} 20-period EMA support with elevated volume.",
                    $"Multi-timeframe momentum alignment in { (isPositive ? "bullish expansion" : "neutral distribution") }.",
                    $"Order book depth indicates { (isPositive ? "strong institutional bid absorption" : "balanced liquidity layers") }.",
                    $"Volatility compression suggests an impending directional liquidity expansion."
                },
                Factors = new List<TechnicalFactorDto>
                {
                    new TechnicalFactorDto { Name = "EMA 20/50 Cross", Value = isPositive ? "Golden Alignment" : "Neutral Cross", Sentiment = isPositive ? "BULLISH" : "NEUTRAL" },
                    new TechnicalFactorDto { Name = "RSI (14)", Value = isPositive ? "62.4 (Healthy Bullish)" : "48.1 (Neutral)", Sentiment = isPositive ? "BULLISH" : "NEUTRAL" },
                    new TechnicalFactorDto { Name = "MACD Histogram", Value = isPositive ? "+18.4 (Positive Divergence)" : "-4.2 (Mild Contraction)", Sentiment = isPositive ? "BULLISH" : "BEARISH" },
                    new TechnicalFactorDto { Name = "VWAP Ratio", Value = "1.014 (+1.4% above benchmark)", Sentiment = "BULLISH" },
                    new TechnicalFactorDto { Name = "Bollinger Bands", Value = "Expanding Upper Band", Sentiment = isPositive ? "BULLISH" : "NEUTRAL" }
                },
                GeneratedAt = DateTime.UtcNow
            };

            return Task.FromResult(insight);
        }

        private static string NormalizeKey(string symbol)
        {
            return symbol.Replace("/", "").ToUpperInvariant();
        }

        private void SeedAssets()
        {
            // Seed Crypto
            AddAsset(new MarketAsset
            {
                Symbol = "BTC/USDT",
                RawSymbol = "BTCUSDT",
                Name = "Bitcoin",
                AssetType = AssetType.Crypto,
                Price = 68421.32m,
                Change = 956.31m,
                ChangePercent = 1.42m,
                Open = 67465.01m,
                High = 68980.00m,
                Low = 67120.50m,
                PreviousClose = 67465.01m,
                Volume = 28450.42m,
                QuoteVolume = 1946580000m,
                MarketCap = 1350000000000m,
                Bid = 68420.80m,
                Ask = 68421.50m,
                Spread = 0.70m,
                Exchange = "BINANCE",
                TradingStatus = "LIVE",
                DataSource = "Binance Live Stream",
                Sparkline = GenerateSparkline(68421.32m, 1.42m)
            });

            AddAsset(new MarketAsset
            {
                Symbol = "ETH/USDT",
                RawSymbol = "ETHUSDT",
                Name = "Ethereum",
                AssetType = AssetType.Crypto,
                Price = 2431.20m,
                Change = 19.80m,
                ChangePercent = 0.82m,
                Open = 2411.40m,
                High = 2465.00m,
                Low = 2390.10m,
                PreviousClose = 2411.40m,
                Volume = 195420.15m,
                QuoteVolume = 475100000m,
                MarketCap = 292000000000m,
                Bid = 2431.10m,
                Ask = 2431.30m,
                Spread = 0.20m,
                Exchange = "BINANCE",
                TradingStatus = "LIVE",
                DataSource = "Binance Live Stream",
                Sparkline = GenerateSparkline(2431.20m, 0.82m)
            });

            AddAsset(new MarketAsset
            {
                Symbol = "SOL/USDT",
                RawSymbol = "SOLUSDT",
                Name = "Solana",
                AssetType = AssetType.Crypto,
                Price = 176.50m,
                Change = 6.40m,
                ChangePercent = 3.76m,
                Open = 170.10m,
                High = 179.80m,
                Low = 168.50m,
                Volume = 3450120m,
                MarketCap = 82400000000m,
                Bid = 176.45m,
                Ask = 176.55m,
                Spread = 0.10m,
                Exchange = "BINANCE",
                TradingStatus = "LIVE",
                DataSource = "Binance Live Stream",
                Sparkline = GenerateSparkline(176.50m, 3.76m)
            });

            AddAsset(new MarketAsset
            {
                Symbol = "BNB/USDT",
                RawSymbol = "BNBUSDT",
                Name = "BNB",
                AssetType = AssetType.Crypto,
                Price = 582.40m,
                Change = -3.20m,
                ChangePercent = -0.55m,
                Open = 585.60m,
                High = 590.20m,
                Low = 578.00m,
                Volume = 412500m,
                MarketCap = 85000000000m,
                Bid = 582.30m,
                Ask = 582.50m,
                Exchange = "BINANCE",
                TradingStatus = "LIVE",
                DataSource = "Binance Live Stream",
                Sparkline = GenerateSparkline(582.40m, -0.55m)
            });

            AddAsset(new MarketAsset
            {
                Symbol = "XRP/USDT",
                RawSymbol = "XRPUSDT",
                Name = "Ripple",
                AssetType = AssetType.Crypto,
                Price = 0.5842m,
                Change = 0.0124m,
                ChangePercent = 2.17m,
                Open = 0.5718m,
                High = 0.5920m,
                Low = 0.5680m,
                Volume = 125000000m,
                MarketCap = 33000000000m,
                Bid = 0.5841m,
                Ask = 0.5843m,
                Exchange = "BINANCE",
                TradingStatus = "LIVE",
                DataSource = "Binance Live Stream",
                Sparkline = GenerateSparkline(0.5842m, 2.17m)
            });

            AddAsset(new MarketAsset
            {
                Symbol = "DOGE/USDT",
                RawSymbol = "DOGEUSDT",
                Name = "Dogecoin",
                AssetType = AssetType.Crypto,
                Price = 0.1425m,
                Change = 0.0068m,
                ChangePercent = 5.01m,
                Volume = 450000000m,
                MarketCap = 20800000000m,
                Exchange = "BINANCE",
                TradingStatus = "LIVE",
                DataSource = "Binance Live Stream",
                Sparkline = GenerateSparkline(0.1425m, 5.01m)
            });

            AddAsset(new MarketAsset
            {
                Symbol = "ADA/USDT",
                RawSymbol = "ADAUSDT",
                Name = "Cardano",
                AssetType = AssetType.Crypto,
                Price = 0.3850m,
                Change = 0.0045m,
                ChangePercent = 1.18m,
                Volume = 95000000m,
                MarketCap = 13800000000m,
                Exchange = "BINANCE",
                TradingStatus = "LIVE",
                DataSource = "Binance Live Stream",
                Sparkline = GenerateSparkline(0.3850m, 1.18m)
            });

            AddAsset(new MarketAsset
            {
                Symbol = "AVAX/USDT",
                RawSymbol = "AVAXUSDT",
                Name = "Avalanche",
                AssetType = AssetType.Crypto,
                Price = 28.40m,
                Change = 0.85m,
                ChangePercent = 3.09m,
                Volume = 8400000m,
                MarketCap = 11500000000m,
                Exchange = "BINANCE",
                TradingStatus = "LIVE",
                DataSource = "Binance Live Stream",
                Sparkline = GenerateSparkline(28.40m, 3.09m)
            });

            AddAsset(new MarketAsset
            {
                Symbol = "LINK/USDT",
                RawSymbol = "LINKUSDT",
                Name = "Chainlink",
                AssetType = AssetType.Crypto,
                Price = 12.15m,
                Change = 0.35m,
                ChangePercent = 2.97m,
                Volume = 14500000m,
                MarketCap = 7300000000m,
                Exchange = "BINANCE",
                TradingStatus = "LIVE",
                DataSource = "Binance Live Stream",
                Sparkline = GenerateSparkline(12.15m, 2.97m)
            });

            // Seed US Stocks
            AddAsset(new MarketAsset
            {
                Symbol = "NVDA",
                RawSymbol = "NVDA",
                Name = "NVIDIA Corporation",
                AssetType = AssetType.Stock,
                Price = 138.25m,
                Change = 3.12m,
                ChangePercent = 2.31m,
                Open = 135.50m,
                High = 139.10m,
                Low = 135.10m,
                PreviousClose = 135.13m,
                Volume = 48500000m,
                MarketCap = 3390000000000m,
                PE = 48.5m,
                EPS = 2.85m,
                Sector = "Semiconductors",
                Exchange = "NASDAQ",
                TradingStatus = "DEMO",
                DataSource = "US Market Feed (Simulated)",
                Sparkline = GenerateSparkline(138.25m, 2.31m)
            });

            AddAsset(new MarketAsset
            {
                Symbol = "AAPL",
                RawSymbol = "AAPL",
                Name = "Apple Inc.",
                AssetType = AssetType.Stock,
                Price = 232.50m,
                Change = -0.95m,
                ChangePercent = -0.41m,
                Open = 233.80m,
                High = 234.40m,
                Low = 231.90m,
                PreviousClose = 233.45m,
                Volume = 38400000m,
                MarketCap = 3540000000000m,
                PE = 33.4m,
                EPS = 6.95m,
                Sector = "Consumer Electronics",
                Exchange = "NASDAQ",
                TradingStatus = "DEMO",
                DataSource = "US Market Feed (Simulated)",
                Sparkline = GenerateSparkline(232.50m, -0.41m)
            });

            AddAsset(new MarketAsset
            {
                Symbol = "MSFT",
                RawSymbol = "MSFT",
                Name = "Microsoft Corporation",
                AssetType = AssetType.Stock,
                Price = 428.15m,
                Change = 4.35m,
                ChangePercent = 1.03m,
                Volume = 18200000m,
                MarketCap = 3180000000000m,
                PE = 36.2m,
                EPS = 11.82m,
                Sector = "Software & Cloud",
                Exchange = "NASDAQ",
                TradingStatus = "DEMO",
                DataSource = "US Market Feed (Simulated)",
                Sparkline = GenerateSparkline(428.15m, 1.03m)
            });

            AddAsset(new MarketAsset
            {
                Symbol = "AMZN",
                RawSymbol = "AMZN",
                Name = "Amazon.com Inc.",
                AssetType = AssetType.Stock,
                Price = 186.40m,
                Change = 1.80m,
                ChangePercent = 0.98m,
                Volume = 24500000m,
                MarketCap = 1940000000000m,
                PE = 42.1m,
                EPS = 4.42m,
                Sector = "E-Commerce & Cloud",
                Exchange = "NASDAQ",
                TradingStatus = "DEMO",
                DataSource = "US Market Feed (Simulated)",
                Sparkline = GenerateSparkline(186.40m, 0.98m)
            });

            AddAsset(new MarketAsset
            {
                Symbol = "GOOGL",
                RawSymbol = "GOOGL",
                Name = "Alphabet Inc.",
                AssetType = AssetType.Stock,
                Price = 168.90m,
                Change = -1.10m,
                ChangePercent = -0.65m,
                Volume = 19800000m,
                MarketCap = 2100000000000m,
                PE = 24.3m,
                EPS = 6.95m,
                Sector = "Internet Content",
                Exchange = "NASDAQ",
                TradingStatus = "DEMO",
                DataSource = "US Market Feed (Simulated)",
                Sparkline = GenerateSparkline(168.90m, -0.65m)
            });

            AddAsset(new MarketAsset
            {
                Symbol = "META",
                RawSymbol = "META",
                Name = "Meta Platforms Inc.",
                AssetType = AssetType.Stock,
                Price = 584.20m,
                Change = 8.50m,
                ChangePercent = 1.48m,
                Volume = 12400000m,
                MarketCap = 1480000000000m,
                PE = 28.1m,
                EPS = 20.80m,
                Sector = "Social Media",
                Exchange = "NASDAQ",
                TradingStatus = "DEMO",
                DataSource = "US Market Feed (Simulated)",
                Sparkline = GenerateSparkline(584.20m, 1.48m)
            });

            AddAsset(new MarketAsset
            {
                Symbol = "TSLA",
                RawSymbol = "TSLA",
                Name = "Tesla Inc.",
                AssetType = AssetType.Stock,
                Price = 218.80m,
                Change = 7.40m,
                ChangePercent = 3.50m,
                Volume = 68400000m,
                MarketCap = 698000000000m,
                PE = 62.4m,
                EPS = 3.50m,
                Sector = "Automotive & Energy",
                Exchange = "NASDAQ",
                TradingStatus = "DEMO",
                DataSource = "US Market Feed (Simulated)",
                Sparkline = GenerateSparkline(218.80m, 3.50m)
            });

            AddAsset(new MarketAsset
            {
                Symbol = "AMD",
                RawSymbol = "AMD",
                Name = "Advanced Micro Devices",
                AssetType = AssetType.Stock,
                Price = 156.30m,
                Change = 3.80m,
                ChangePercent = 2.49m,
                Volume = 32100000m,
                MarketCap = 252000000000m,
                PE = 112.0m,
                EPS = 1.40m,
                Sector = "Semiconductors",
                Exchange = "NASDAQ",
                TradingStatus = "DEMO",
                DataSource = "US Market Feed (Simulated)",
                Sparkline = GenerateSparkline(156.30m, 2.49m)
            });

            AddAsset(new MarketAsset
            {
                Symbol = "NFLX",
                RawSymbol = "NFLX",
                Name = "Netflix Inc.",
                AssetType = AssetType.Stock,
                Price = 710.50m,
                Change = 5.20m,
                ChangePercent = 0.74m,
                Volume = 4200000m,
                MarketCap = 305000000000m,
                PE = 41.2m,
                EPS = 17.25m,
                Sector = "Entertainment",
                Exchange = "NASDAQ",
                TradingStatus = "DEMO",
                DataSource = "US Market Feed (Simulated)",
                Sparkline = GenerateSparkline(710.50m, 0.74m)
            });

            AddAsset(new MarketAsset
            {
                Symbol = "JPM",
                RawSymbol = "JPM",
                Name = "JPMorgan Chase & Co.",
                AssetType = AssetType.Stock,
                Price = 224.60m,
                Change = 1.10m,
                ChangePercent = 0.49m,
                Volume = 8900000m,
                MarketCap = 642000000000m,
                PE = 12.8m,
                EPS = 17.55m,
                Sector = "Financial Services",
                Exchange = "NYSE",
                TradingStatus = "DEMO",
                DataSource = "US Market Feed (Simulated)",
                Sparkline = GenerateSparkline(224.60m, 0.49m)
            });

            // Seed Indian Stocks (NSE/BSE ready)
            AddAsset(new MarketAsset
            {
                Symbol = "RELIANCE",
                RawSymbol = "RELIANCE.NS",
                Name = "Reliance Industries Ltd",
                AssetType = AssetType.IndianStock,
                Price = 2745.20m,
                Change = 18.50m,
                ChangePercent = 0.68m,
                Volume = 5400000m,
                MarketCap = 18500000000000m, // INR
                Sector = "Energy & Retail",
                Exchange = "NSE",
                TradingStatus = "DEMO",
                DataSource = "NSE Feed (Simulated)",
                Sparkline = GenerateSparkline(2745.20m, 0.68m)
            });

            AddAsset(new MarketAsset
            {
                Symbol = "TCS",
                RawSymbol = "TCS.NS",
                Name = "Tata Consultancy Services",
                AssetType = AssetType.IndianStock,
                Price = 4250.00m,
                Change = 32.00m,
                ChangePercent = 0.76m,
                Volume = 1800000m,
                MarketCap = 15300000000000m,
                Sector = "IT Services",
                Exchange = "NSE",
                TradingStatus = "DEMO",
                DataSource = "NSE Feed (Simulated)",
                Sparkline = GenerateSparkline(4250.00m, 0.76m)
            });

            AddAsset(new MarketAsset
            {
                Symbol = "INFY",
                RawSymbol = "INFY.NS",
                Name = "Infosys Limited",
                AssetType = AssetType.IndianStock,
                Price = 1910.40m,
                Change = 14.20m,
                ChangePercent = 0.75m,
                Volume = 3200000m,
                MarketCap = 7900000000000m,
                Sector = "IT Services",
                Exchange = "NSE",
                TradingStatus = "DEMO",
                DataSource = "NSE Feed (Simulated)",
                Sparkline = GenerateSparkline(1910.40m, 0.75m)
            });

            AddAsset(new MarketAsset
            {
                Symbol = "HDFCBANK",
                RawSymbol = "HDFCBANK.NS",
                Name = "HDFC Bank Ltd",
                AssetType = AssetType.IndianStock,
                Price = 1680.50m,
                Change = -8.20m,
                ChangePercent = -0.49m,
                Volume = 7800000m,
                MarketCap = 12700000000000m,
                Sector = "Private Banking",
                Exchange = "NSE",
                TradingStatus = "DEMO",
                DataSource = "NSE Feed (Simulated)",
                Sparkline = GenerateSparkline(1680.50m, -0.49m)
            });

            AddAsset(new MarketAsset
            {
                Symbol = "ICICIBANK",
                RawSymbol = "ICICIBANK.NS",
                Name = "ICICI Bank Ltd",
                AssetType = AssetType.IndianStock,
                Price = 1240.20m,
                Change = 12.40m,
                ChangePercent = 1.01m,
                Volume = 6200000m,
                MarketCap = 8700000000000m,
                Sector = "Private Banking",
                Exchange = "NSE",
                TradingStatus = "DEMO",
                DataSource = "NSE Feed (Simulated)",
                Sparkline = GenerateSparkline(1240.20m, 1.01m)
            });

            AddAsset(new MarketAsset
            {
                Symbol = "SBIN",
                RawSymbol = "SBIN.NS",
                Name = "State Bank of India",
                AssetType = AssetType.IndianStock,
                Price = 795.30m,
                Change = 5.60m,
                ChangePercent = 0.71m,
                Volume = 9400000m,
                MarketCap = 7100000000000m,
                Sector = "Public Banking",
                Exchange = "NSE",
                TradingStatus = "DEMO",
                DataSource = "NSE Feed (Simulated)",
                Sparkline = GenerateSparkline(795.30m, 0.71m)
            });

            AddAsset(new MarketAsset
            {
                Symbol = "ITC",
                RawSymbol = "ITC.NS",
                Name = "ITC Limited",
                AssetType = AssetType.IndianStock,
                Price = 502.10m,
                Change = -1.20m,
                ChangePercent = -0.24m,
                Volume = 5100000m,
                MarketCap = 6200000000000m,
                Sector = "FMCG",
                Exchange = "NSE",
                TradingStatus = "DEMO",
                DataSource = "NSE Feed (Simulated)",
                Sparkline = GenerateSparkline(502.10m, -0.24m)
            });

            AddAsset(new MarketAsset
            {
                Symbol = "LT",
                RawSymbol = "LT.NS",
                Name = "Larsen & Toubro Ltd",
                AssetType = AssetType.IndianStock,
                Price = 3560.00m,
                Change = 42.00m,
                ChangePercent = 1.19m,
                Volume = 1400000m,
                MarketCap = 4900000000000m,
                Sector = "Capital Goods & Infra",
                Exchange = "NSE",
                TradingStatus = "DEMO",
                DataSource = "NSE Feed (Simulated)",
                Sparkline = GenerateSparkline(3560.00m, 1.19m)
            });

            AddAsset(new MarketAsset
            {
                Symbol = "BHARTIARTL",
                RawSymbol = "BHARTIARTL.NS",
                Name = "Bharti Airtel Ltd",
                AssetType = AssetType.IndianStock,
                Price = 1660.80m,
                Change = 15.60m,
                ChangePercent = 0.95m,
                Volume = 3800000m,
                MarketCap = 9800000000000m,
                Sector = "Telecom",
                Exchange = "NSE",
                TradingStatus = "DEMO",
                DataSource = "NSE Feed (Simulated)",
                Sparkline = GenerateSparkline(1660.80m, 0.95m)
            });

            AddAsset(new MarketAsset
            {
                Symbol = "MARUTI",
                RawSymbol = "MARUTI.NS",
                Name = "Maruti Suzuki India",
                AssetType = AssetType.IndianStock,
                Price = 12450.00m,
                Change = -95.00m,
                ChangePercent = -0.76m,
                Volume = 450000m,
                MarketCap = 3900000000000m,
                Sector = "Automotive",
                Exchange = "NSE",
                TradingStatus = "DEMO",
                DataSource = "NSE Feed (Simulated)",
                Sparkline = GenerateSparkline(12450.00m, -0.76m)
            });

            // Seed Indices
            AddAsset(new MarketAsset
            {
                Symbol = "NIFTY 50",
                RawSymbol = "^NSEI",
                Name = "NIFTY 50 Index",
                AssetType = AssetType.Index,
                Price = 25014.60m,
                Change = 159.20m,
                ChangePercent = 0.64m,
                High = 25080.00m,
                Low = 24920.10m,
                Exchange = "NSE",
                TradingStatus = "DEMO",
                DataSource = "Index Benchmark (Simulated)",
                Sparkline = GenerateSparkline(25014.60m, 0.64m)
            });

            AddAsset(new MarketAsset
            {
                Symbol = "BANK NIFTY",
                RawSymbol = "^NSEBANK",
                Name = "NIFTY Bank Index",
                AssetType = AssetType.Index,
                Price = 51460.20m,
                Change = 310.50m,
                ChangePercent = 0.61m,
                Exchange = "NSE",
                TradingStatus = "DEMO",
                DataSource = "Index Benchmark (Simulated)",
                Sparkline = GenerateSparkline(51460.20m, 0.61m)
            });

            AddAsset(new MarketAsset
            {
                Symbol = "SENSEX",
                RawSymbol = "^BSESN",
                Name = "BSE SENSEX",
                AssetType = AssetType.Index,
                Price = 81688.45m,
                Change = 512.30m,
                ChangePercent = 0.63m,
                Exchange = "BSE",
                TradingStatus = "DEMO",
                DataSource = "Index Benchmark (Simulated)",
                Sparkline = GenerateSparkline(81688.45m, 0.63m)
            });

            AddAsset(new MarketAsset
            {
                Symbol = "NASDAQ",
                RawSymbol = "^IXIC",
                Name = "NASDAQ Composite",
                AssetType = AssetType.Index,
                Price = 18342.90m,
                Change = 145.60m,
                ChangePercent = 0.80m,
                Exchange = "NASDAQ",
                TradingStatus = "DEMO",
                DataSource = "Index Benchmark (Simulated)",
                Sparkline = GenerateSparkline(18342.90m, 0.80m)
            });

            AddAsset(new MarketAsset
            {
                Symbol = "S&P 500",
                RawSymbol = "^GSPC",
                Name = "S&P 500 Index",
                AssetType = AssetType.Index,
                Price = 5751.13m,
                Change = 28.40m,
                ChangePercent = 0.50m,
                Exchange = "CBOE",
                TradingStatus = "DEMO",
                DataSource = "Index Benchmark (Simulated)",
                Sparkline = GenerateSparkline(5751.13m, 0.50m)
            });

            AddAsset(new MarketAsset
            {
                Symbol = "DOW JONES",
                RawSymbol = "^DJI",
                Name = "Dow Jones Industrial Average",
                AssetType = AssetType.Index,
                Price = 42352.75m,
                Change = 126.80m,
                ChangePercent = 0.30m,
                Exchange = "NYSE",
                TradingStatus = "DEMO",
                DataSource = "Index Benchmark (Simulated)",
                Sparkline = GenerateSparkline(42352.75m, 0.30m)
            });

            AddAsset(new MarketAsset
            {
                Symbol = "DAX",
                RawSymbol = "^GDAXI",
                Name = "DAX Index",
                AssetType = AssetType.Index,
                Price = 19210.90m,
                Change = 68.30m,
                ChangePercent = 0.36m,
                Exchange = "XETRA",
                TradingStatus = "DEMO",
                DataSource = "Index Benchmark (Simulated)",
                Sparkline = GenerateSparkline(19210.90m, 0.36m)
            });

            AddAsset(new MarketAsset
            {
                Symbol = "FTSE 100",
                RawSymbol = "^FTSE",
                Name = "FTSE 100 Index",
                AssetType = AssetType.Index,
                Price = 8280.60m,
                Change = -15.40m,
                ChangePercent = -0.19m,
                Exchange = "LSE",
                TradingStatus = "DEMO",
                DataSource = "Index Benchmark (Simulated)",
                Sparkline = GenerateSparkline(8280.60m, -0.19m)
            });

            // Seed Forex
            AddAsset(new MarketAsset
            {
                Symbol = "EUR/USD",
                RawSymbol = "EURUSD",
                Name = "Euro / US Dollar",
                AssetType = AssetType.Forex,
                Price = 1.0975m,
                Change = -0.0018m,
                ChangePercent = -0.16m,
                Bid = 1.0974m,
                Ask = 1.0976m,
                Spread = 0.0002m,
                Exchange = "FX",
                TradingStatus = "DEMO",
                DataSource = "Global FX (Simulated)",
                Sparkline = GenerateSparkline(1.0975m, -0.16m)
            });

            AddAsset(new MarketAsset
            {
                Symbol = "GBP/USD",
                RawSymbol = "GBPUSD",
                Name = "British Pound / US Dollar",
                AssetType = AssetType.Forex,
                Price = 1.3080m,
                Change = 0.0022m,
                ChangePercent = 0.17m,
                Bid = 1.3079m,
                Ask = 1.3081m,
                Spread = 0.0002m,
                Exchange = "FX",
                TradingStatus = "DEMO",
                DataSource = "Global FX (Simulated)",
                Sparkline = GenerateSparkline(1.3080m, 0.17m)
            });

            AddAsset(new MarketAsset
            {
                Symbol = "USD/JPY",
                RawSymbol = "USDJPY",
                Name = "US Dollar / Japanese Yen",
                AssetType = AssetType.Forex,
                Price = 148.65m,
                Change = 0.42m,
                ChangePercent = 0.28m,
                Bid = 148.64m,
                Ask = 148.66m,
                Exchange = "FX",
                TradingStatus = "DEMO",
                DataSource = "Global FX (Simulated)",
                Sparkline = GenerateSparkline(148.65m, 0.28m)
            });

            AddAsset(new MarketAsset
            {
                Symbol = "USD/INR",
                RawSymbol = "USDINR",
                Name = "US Dollar / Indian Rupee",
                AssetType = AssetType.Forex,
                Price = 83.95m,
                Change = 0.04m,
                ChangePercent = 0.05m,
                Bid = 83.94m,
                Ask = 83.96m,
                Exchange = "FX",
                TradingStatus = "DEMO",
                DataSource = "Global FX (Simulated)",
                Sparkline = GenerateSparkline(83.95m, 0.05m)
            });

            AddAsset(new MarketAsset
            {
                Symbol = "AUD/USD",
                RawSymbol = "AUDUSD",
                Name = "Australian Dollar / US Dollar",
                AssetType = AssetType.Forex,
                Price = 0.6750m,
                Change = -0.0025m,
                ChangePercent = -0.37m,
                Exchange = "FX",
                TradingStatus = "DEMO",
                DataSource = "Global FX (Simulated)",
                Sparkline = GenerateSparkline(0.6750m, -0.37m)
            });

            // Seed Commodities
            AddAsset(new MarketAsset
            {
                Symbol = "Gold",
                RawSymbol = "XAUUSD",
                Name = "Gold Spot (USD/oz)",
                AssetType = AssetType.Commodity,
                Price = 2654.80m,
                Change = 5.60m,
                ChangePercent = 0.21m,
                High = 2662.40m,
                Low = 2648.10m,
                Exchange = "COMEX",
                TradingStatus = "DEMO",
                DataSource = "Commodities Feed (Simulated)",
                Sparkline = GenerateSparkline(2654.80m, 0.21m)
            });

            AddAsset(new MarketAsset
            {
                Symbol = "Silver",
                RawSymbol = "XAGUSD",
                Name = "Silver Spot (USD/oz)",
                AssetType = AssetType.Commodity,
                Price = 32.40m,
                Change = 0.38m,
                ChangePercent = 1.19m,
                High = 32.85m,
                Low = 31.90m,
                Exchange = "COMEX",
                TradingStatus = "DEMO",
                DataSource = "Commodities Feed (Simulated)",
                Sparkline = GenerateSparkline(32.40m, 1.19m)
            });

            AddAsset(new MarketAsset
            {
                Symbol = "Crude Oil (WTI)",
                RawSymbol = "CL",
                Name = "Crude Oil WTI",
                AssetType = AssetType.Commodity,
                Price = 74.20m,
                Change = 1.15m,
                ChangePercent = 1.57m,
                Exchange = "NYMEX",
                TradingStatus = "DEMO",
                DataSource = "Commodities Feed (Simulated)",
                Sparkline = GenerateSparkline(74.20m, 1.57m)
            });

            AddAsset(new MarketAsset
            {
                Symbol = "Brent Crude",
                RawSymbol = "BZ",
                Name = "Brent Crude Oil",
                AssetType = AssetType.Commodity,
                Price = 77.85m,
                Change = 1.25m,
                ChangePercent = 1.63m,
                Exchange = "ICE",
                TradingStatus = "DEMO",
                DataSource = "Commodities Feed (Simulated)",
                Sparkline = GenerateSparkline(77.85m, 1.63m)
            });

            AddAsset(new MarketAsset
            {
                Symbol = "Natural Gas",
                RawSymbol = "NG",
                Name = "Natural Gas",
                AssetType = AssetType.Commodity,
                Price = 2.85m,
                Change = -0.06m,
                ChangePercent = -2.06m,
                Exchange = "NYMEX",
                TradingStatus = "DEMO",
                DataSource = "Commodities Feed (Simulated)",
                Sparkline = GenerateSparkline(2.85m, -2.06m)
            });

            // Seed ETFs
            AddAsset(new MarketAsset
            {
                Symbol = "SPY",
                RawSymbol = "SPY",
                Name = "SPDR S&P 500 ETF Trust",
                AssetType = AssetType.Etf,
                Price = 573.20m,
                Change = 2.85m,
                ChangePercent = 0.50m,
                Volume = 48500000m,
                MarketCap = 590000000000m,
                Exchange = "ARCA",
                TradingStatus = "DEMO",
                DataSource = "ETF Market Feed (Simulated)",
                Sparkline = GenerateSparkline(573.20m, 0.50m)
            });

            AddAsset(new MarketAsset
            {
                Symbol = "QQQ",
                RawSymbol = "QQQ",
                Name = "Invesco QQQ Trust Series 1",
                AssetType = AssetType.Etf,
                Price = 488.50m,
                Change = 3.90m,
                ChangePercent = 0.81m,
                Volume = 32000000m,
                MarketCap = 285000000000m,
                Exchange = "NASDAQ",
                TradingStatus = "DEMO",
                DataSource = "ETF Market Feed (Simulated)",
                Sparkline = GenerateSparkline(488.50m, 0.81m)
            });

            AddAsset(new MarketAsset
            {
                Symbol = "VOO",
                RawSymbol = "VOO",
                Name = "Vanguard S&P 500 ETF",
                AssetType = AssetType.Etf,
                Price = 526.40m,
                Change = 2.60m,
                ChangePercent = 0.50m,
                Volume = 5100000m,
                MarketCap = 480000000000m,
                Exchange = "ARCA",
                TradingStatus = "DEMO",
                DataSource = "ETF Market Feed (Simulated)",
                Sparkline = GenerateSparkline(526.40m, 0.50m)
            });

            AddAsset(new MarketAsset
            {
                Symbol = "VTI",
                RawSymbol = "VTI",
                Name = "Vanguard Total Stock Market ETF",
                AssetType = AssetType.Etf,
                Price = 278.90m,
                Change = 1.35m,
                ChangePercent = 0.49m,
                Volume = 3400000m,
                MarketCap = 410000000000m,
                Exchange = "ARCA",
                TradingStatus = "DEMO",
                DataSource = "ETF Market Feed (Simulated)",
                Sparkline = GenerateSparkline(278.90m, 0.49m)
            });

            AddAsset(new MarketAsset
            {
                Symbol = "GLD",
                RawSymbol = "GLD",
                Name = "SPDR Gold Shares ETF",
                AssetType = AssetType.Etf,
                Price = 245.10m,
                Change = 0.52m,
                ChangePercent = 0.21m,
                Volume = 6200000m,
                MarketCap = 68000000000m,
                Exchange = "ARCA",
                TradingStatus = "DEMO",
                DataSource = "ETF Market Feed (Simulated)",
                Sparkline = GenerateSparkline(245.10m, 0.21m)
            });
        }

        private void AddAsset(MarketAsset asset)
        {
            var key = NormalizeKey(asset.Symbol);
            _assets[key] = asset;
        }

        private static List<decimal> GenerateSparkline(decimal currentPrice, decimal changePercent)
        {
            var list = new List<decimal>();
            var rand = new Random(Math.Abs(currentPrice.GetHashCode()));
            decimal startPrice = currentPrice / (1 + (changePercent / 100m));
            decimal step = (currentPrice - startPrice) / 15m;
            decimal val = startPrice;

            for (int i = 0; i < 15; i++)
            {
                decimal noise = (decimal)(rand.NextDouble() - 0.48) * (currentPrice * 0.003m);
                val += step + noise;
                list.Add(Math.Round(val, currentPrice > 10 ? 2 : 4));
            }
            list.Add(currentPrice);
            return list;
        }
    }
}
