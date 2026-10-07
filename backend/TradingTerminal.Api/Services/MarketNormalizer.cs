using System;
using System.Collections.Generic;
using System.Globalization;
using System.Text.Json;
using TradingTerminal.Api.DTOs;
using TradingTerminal.Api.Interfaces;
using TradingTerminal.Api.Models;

namespace TradingTerminal.Api.Services
{
    public class MarketNormalizer : IPriceNormalizer
    {
        private static readonly Dictionary<string, (string DisplaySymbol, string Name, decimal MarketCap)> SymbolMeta = new(StringComparer.OrdinalIgnoreCase)
        {
            { "BTCUSDT", ("BTC/USDT", "Bitcoin", 1340000000000m) },
            { "ETHUSDT", ("ETH/USDT", "Ethereum", 310000000000m) },
            { "BNBUSDT", ("BNB/USDT", "BNB Chain", 87000000000m) },
            { "SOLUSDT", ("SOL/USDT", "Solana", 92000000000m) },
            { "XRPUSDT", ("XRP/USDT", "Ripple", 34000000000m) },
            { "DOGEUSDT", ("DOGE/USDT", "Dogecoin", 22000000000m) },
            { "ADAUSDT", ("ADA/USDT", "Cardano", 13000000000m) },
            { "AVAXUSDT", ("AVAX/USDT", "Avalanche", 10500000000m) },
            { "LINKUSDT", ("LINK/USDT", "Chainlink", 7800000000m) }
        };

        public MarketAsset? NormalizeBinanceTicker(JsonElement element)
        {
            try
            {
                string? rawSymbol = null;
                if (element.TryGetProperty("s", out var sProp)) rawSymbol = sProp.GetString();
                if (string.IsNullOrEmpty(rawSymbol) && element.TryGetProperty("symbol", out var symProp)) rawSymbol = symProp.GetString();
                if (string.IsNullOrEmpty(rawSymbol)) return null;

                decimal price = ParseDecimal(element, "c", "lastPrice", "price", "p");
                decimal open = ParseDecimal(element, "o", "openPrice");
                decimal high = ParseDecimal(element, "h", "highPrice");
                decimal low = ParseDecimal(element, "l", "lowPrice");
                decimal volume = ParseDecimal(element, "v", "volume", "q");
                decimal quoteVolume = ParseDecimal(element, "q", "quoteVolume");
                decimal bid = ParseDecimal(element, "b", "bidPrice");
                decimal ask = ParseDecimal(element, "a", "askPrice");

                decimal change = ParseDecimal(element, "p", "priceChange");
                decimal changePercent = ParseDecimal(element, "P", "priceChangePercent");

                // If miniTicker without explicit priceChange, calculate from open
                if (change == 0 && open > 0 && price > 0)
                {
                    change = price - open;
                    changePercent = (change / open) * 100m;
                }

                string displaySymbol = rawSymbol;
                string name = rawSymbol;
                decimal marketCap = 0;

                if (SymbolMeta.TryGetValue(rawSymbol, out var meta))
                {
                    displaySymbol = meta.DisplaySymbol;
                    name = meta.Name;
                    marketCap = meta.MarketCap > 0 ? meta.MarketCap : (price * 19700000m);
                }
                else if (rawSymbol.EndsWith("USDT", StringComparison.OrdinalIgnoreCase))
                {
                    var baseAsset = rawSymbol.Substring(0, rawSymbol.Length - 4);
                    displaySymbol = $"{baseAsset}/USDT";
                    name = baseAsset;
                }

                decimal spread = ask > bid && bid > 0 ? ask - bid : 0;

                return new MarketAsset
                {
                    Symbol = displaySymbol,
                    RawSymbol = rawSymbol,
                    Name = name,
                    AssetType = AssetType.Crypto,
                    Price = price,
                    Change = Math.Round(change, 2),
                    ChangePercent = Math.Round(changePercent, 3),
                    Open = open > 0 ? open : null,
                    High = high > 0 ? high : null,
                    Low = low > 0 ? low : null,
                    Volume = volume > 0 ? volume : null,
                    QuoteVolume = quoteVolume > 0 ? quoteVolume : null,
                    MarketCap = marketCap > 0 ? marketCap : null,
                    Bid = bid > 0 ? bid : null,
                    Ask = ask > 0 ? ask : null,
                    Spread = spread > 0 ? spread : null,
                    Exchange = "BINANCE",
                    TradingStatus = "LIVE",
                    DataSource = "Binance Live Stream",
                    Timestamp = DateTime.UtcNow
                };
            }
            catch
            {
                return null;
            }
        }

        public OrderBookDto? NormalizeBinanceDepth(JsonElement element, string symbol)
        {
            try
            {
                var ob = new OrderBookDto
                {
                    Symbol = symbol,
                    Timestamp = DateTime.UtcNow
                };

                if (element.TryGetProperty("bids", out var bidsEl) && bidsEl.ValueKind == JsonValueKind.Array)
                {
                    decimal runningTotal = 0;
                    foreach (var item in bidsEl.EnumerateArray())
                    {
                        var price = decimal.Parse(item[0].GetString() ?? "0", CultureInfo.InvariantCulture);
                        var amount = decimal.Parse(item[1].GetString() ?? "0", CultureInfo.InvariantCulture);
                        runningTotal += amount;
                        ob.Bids.Add(new OrderBookLevel { Price = price, Amount = amount, Total = runningTotal });
                    }
                }
                else if (element.TryGetProperty("b", out var bEl) && bEl.ValueKind == JsonValueKind.Array)
                {
                    decimal runningTotal = 0;
                    foreach (var item in bEl.EnumerateArray())
                    {
                        var price = decimal.Parse(item[0].GetString() ?? "0", CultureInfo.InvariantCulture);
                        var amount = decimal.Parse(item[1].GetString() ?? "0", CultureInfo.InvariantCulture);
                        runningTotal += amount;
                        ob.Bids.Add(new OrderBookLevel { Price = price, Amount = amount, Total = runningTotal });
                    }
                }

                if (element.TryGetProperty("asks", out var asksEl) && asksEl.ValueKind == JsonValueKind.Array)
                {
                    decimal runningTotal = 0;
                    foreach (var item in asksEl.EnumerateArray())
                    {
                        var price = decimal.Parse(item[0].GetString() ?? "0", CultureInfo.InvariantCulture);
                        var amount = decimal.Parse(item[1].GetString() ?? "0", CultureInfo.InvariantCulture);
                        runningTotal += amount;
                        ob.Asks.Add(new OrderBookLevel { Price = price, Amount = amount, Total = runningTotal });
                    }
                }
                else if (element.TryGetProperty("a", out var aEl) && aEl.ValueKind == JsonValueKind.Array)
                {
                    decimal runningTotal = 0;
                    foreach (var item in aEl.EnumerateArray())
                    {
                        var price = decimal.Parse(item[0].GetString() ?? "0", CultureInfo.InvariantCulture);
                        var amount = decimal.Parse(item[1].GetString() ?? "0", CultureInfo.InvariantCulture);
                        runningTotal += amount;
                        ob.Asks.Add(new OrderBookLevel { Price = price, Amount = amount, Total = runningTotal });
                    }
                }

                return ob;
            }
            catch
            {
                return null;
            }
        }

        public TradeDto? NormalizeBinanceTrade(JsonElement element, string symbol)
        {
            try
            {
                var price = decimal.Parse(element.GetProperty("p").GetString() ?? "0", CultureInfo.InvariantCulture);
                var amount = decimal.Parse(element.GetProperty("q").GetString() ?? "0", CultureInfo.InvariantCulture);
                bool isBuyerMaker = element.TryGetProperty("m", out var mEl) && mEl.GetBoolean();

                string tradeId = element.TryGetProperty("t", out var tEl) ? tEl.GetInt64().ToString() :
                                 element.TryGetProperty("a", out var aEl) ? aEl.GetInt64().ToString() :
                                 Guid.NewGuid().ToString("N");

                long tradeTimeMs = element.TryGetProperty("T", out var timeEl) ? timeEl.GetInt64() :
                                   element.TryGetProperty("E", out var eEl) ? eEl.GetInt64() :
                                   DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

                return new TradeDto
                {
                    Id = tradeId,
                    Symbol = symbol,
                    Price = price,
                    Amount = amount,
                    Side = isBuyerMaker ? "SELL" : "BUY",
                    Timestamp = DateTimeOffset.FromUnixTimeMilliseconds(tradeTimeMs).UtcDateTime
                };
            }
            catch
            {
                return null;
            }
        }

        private static decimal ParseDecimal(JsonElement el, params string[] propertyNames)
        {
            foreach (var prop in propertyNames)
            {
                if (el.TryGetProperty(prop, out var val))
                {
                    if (val.ValueKind == JsonValueKind.String && decimal.TryParse(val.GetString(), NumberStyles.Any, CultureInfo.InvariantCulture, out var dVal))
                        return dVal;
                    if (val.ValueKind == JsonValueKind.Number && val.TryGetDecimal(out var numVal))
                        return numVal;
                }
            }
            return 0m;
        }
    }
}
