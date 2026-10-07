using System.Collections.Generic;
using System.Threading.Tasks;
using TradingTerminal.Api.DTOs;
using TradingTerminal.Api.Models;

namespace TradingTerminal.Api.Interfaces
{
    public interface IAssetRepository
    {
        Task<IReadOnlyList<MarketAsset>> GetAllAssetsAsync();
        Task<MarketAsset?> GetAssetBySymbolAsync(string symbol);
        Task<IReadOnlyList<MarketAsset>> GetAssetsByTypeAsync(AssetType assetType);
        Task<IReadOnlyList<MarketAsset>> SearchAssetsAsync(string query);
        Task UpsertAssetAsync(MarketAsset asset);
        Task<IReadOnlyList<CandleStickDto>> GetCandlesAsync(string symbol, string timeframe, int limit = 100);
        Task<OrderBookDto> GetOrderBookAsync(string symbol);
        Task<IReadOnlyList<TradeDto>> GetRecentTradesAsync(string symbol, int limit = 30);
        Task<AiInsightDto> GetAiInsightAsync(string symbol);
    }
}
