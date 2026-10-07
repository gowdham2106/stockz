using System.Collections.Generic;
using System.Threading.Tasks;
using TradingTerminal.Api.DTOs;
using TradingTerminal.Api.Models;

namespace TradingTerminal.Api.Interfaces
{
    public interface IMarketDataService
    {
        Task<IReadOnlyList<MarketAsset>> GetAllAssetsAsync();
        Task<MarketAsset?> GetAssetAsync(string symbol);
        Task<IReadOnlyList<MarketAsset>> GetAssetsByTypeAsync(string type);
        Task<IReadOnlyList<MarketAsset>> SearchAssetsAsync(string query);
        Task<MarketPulseDto> GetMarketPulseAsync();
        Task<IReadOnlyList<MarketScannerItemDto>> GetScannerResultsAsync(string preset);
        Task<IReadOnlyList<CandleStickDto>> GetCandlesAsync(string symbol, string timeframe);
        Task<OrderBookDto> GetOrderBookAsync(string symbol);
        Task<IReadOnlyList<TradeDto>> GetRecentTradesAsync(string symbol);
        Task<AiInsightDto> GetAiInsightAsync(string symbol);
        Task<PortfolioDto> GetSimulatedPortfolioAsync();
        ConnectionStatusDto GetConnectionStatus();
        Task ProcessAssetUpdateAsync(MarketAsset asset);
        Task ProcessOrderBookUpdateAsync(OrderBookDto orderBook);
        Task ProcessTradeUpdateAsync(TradeDto trade);
        void UpdateConnectionStatus(string provider, string status, int latencyMs);
    }
}
