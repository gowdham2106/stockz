using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using TradingTerminal.Api.Interfaces;

namespace TradingTerminal.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MarketsController : ControllerBase
    {
        private readonly IMarketDataService _marketDataService;

        public MarketsController(IMarketDataService marketDataService)
        {
            _marketDataService = marketDataService;
        }

        [HttpGet]
        public async Task<IActionResult> GetMarkets([FromQuery] string? type = null, [FromQuery] string? search = null)
        {
            if (!string.IsNullOrWhiteSpace(search))
            {
                var searchResults = await _marketDataService.SearchAssetsAsync(search);
                return Ok(searchResults);
            }

            var results = await _marketDataService.GetAssetsByTypeAsync(type ?? "all");
            return Ok(results);
        }

        [HttpGet("pulse")]
        public async Task<IActionResult> GetMarketPulse()
        {
            var pulse = await _marketDataService.GetMarketPulseAsync();
            return Ok(pulse);
        }

        [HttpGet("scanner")]
        public async Task<IActionResult> GetScanner([FromQuery] string? preset = "gainers")
        {
            var results = await _marketDataService.GetScannerResultsAsync(preset ?? "gainers");
            return Ok(results);
        }

        [HttpGet("connection-status")]
        public IActionResult GetConnectionStatus()
        {
            var status = _marketDataService.GetConnectionStatus();
            return Ok(status);
        }
    }
}
