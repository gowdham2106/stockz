using System.Text.Json;
using TradingTerminal.Api.DTOs;
using TradingTerminal.Api.Models;

namespace TradingTerminal.Api.Interfaces
{
    public interface IPriceNormalizer
    {
        MarketAsset? NormalizeBinanceTicker(JsonElement element);
        OrderBookDto? NormalizeBinanceDepth(JsonElement element, string symbol);
        TradeDto? NormalizeBinanceTrade(JsonElement element, string symbol);
    }
}
