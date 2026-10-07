using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using TradingTerminal.Api.Interfaces;

namespace TradingTerminal.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AssetController : ControllerBase
    {
        private readonly IMarketDataService _marketDataService;

        public AssetController(IMarketDataService marketDataService)
        {
            _marketDataService = marketDataService;
        }

        [HttpGet("{symbol}")]
        public async Task<IActionResult> GetAsset(string symbol)
        {
            var decoded = Uri.UnescapeDataString(symbol);
            var asset = await _marketDataService.GetAssetAsync(decoded);
            if (asset == null)
            {
                return NotFound(new { message = $"Asset '{symbol}' not found." });
            }
            return Ok(asset);
        }

        [HttpGet("{symbol}/candles")]
        public async Task<IActionResult> GetCandles(string symbol, [FromQuery] string? timeframe = "1h")
        {
            var decoded = Uri.UnescapeDataString(symbol);
            var candles = await _marketDataService.GetCandlesAsync(decoded, timeframe ?? "1h");
            return Ok(candles);
        }

        [HttpGet("{symbol}/orderbook")]
        public async Task<IActionResult> GetOrderBook(string symbol)
        {
            var decoded = Uri.UnescapeDataString(symbol);
            var ob = await _marketDataService.GetOrderBookAsync(decoded);
            return Ok(ob);
        }

        [HttpGet("{symbol}/trades")]
        public async Task<IActionResult> GetTrades(string symbol)
        {
            var decoded = Uri.UnescapeDataString(symbol);
            var trades = await _marketDataService.GetRecentTradesAsync(decoded);
            return Ok(trades);
        }

        [HttpGet("{symbol}/ai-insight")]
        public async Task<IActionResult> GetAiInsight(string symbol)
        {
            var decoded = Uri.UnescapeDataString(symbol);
            var insight = await _marketDataService.GetAiInsightAsync(decoded);
            return Ok(insight);
        }
    }
}
