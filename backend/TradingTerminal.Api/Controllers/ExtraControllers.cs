using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using TradingTerminal.Api.DTOs;
using TradingTerminal.Api.Interfaces;

namespace TradingTerminal.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class WatchlistController : ControllerBase
    {
        private readonly IMarketDataService _marketDataService;

        public WatchlistController(IMarketDataService marketDataService)
        {
            _marketDataService = marketDataService;
        }

        [HttpGet]
        public async Task<IActionResult> GetWatchlistGroups()
        {
            var allAssets = await _marketDataService.GetAllAssetsAsync();
            var groups = new Dictionary<string, object>
            {
                { "Default", allAssets.Where(a => new[] { "BTC/USDT", "ETH/USDT", "NVDA", "AAPL", "RELIANCE", "Gold", "SPY" }.Contains(a.Symbol)).ToList() },
                { "Crypto Alpha", allAssets.Where(a => a.AssetTypeString == "crypto").ToList() },
                { "US Mega Caps", allAssets.Where(a => a.AssetTypeString == "stock").ToList() },
                { "India Growth", allAssets.Where(a => a.AssetTypeString == "indian_stock").ToList() },
                { "Global Macro", allAssets.Where(a => a.AssetTypeString == "forex" || a.AssetTypeString == "commodity" || a.AssetTypeString == "index").ToList() }
            };
            return Ok(groups);
        }
    }

    [ApiController]
    [Route("api/[controller]")]
    public class AlertsController : ControllerBase
    {
        private static readonly List<AlertDto> _alerts = new()
        {
            new AlertDto
            {
                Id = "alert-1",
                Symbol = "BTC/USDT",
                Condition = "GREATER_THAN",
                TargetValue = 70000m,
                CurrentValue = 68421.32m,
                Status = "ACTIVE",
                Note = "Breakout alert for ATH test"
            },
            new AlertDto
            {
                Id = "alert-2",
                Symbol = "AAPL",
                Condition = "LESS_THAN",
                TargetValue = 230m,
                CurrentValue = 232.50m,
                Status = "ACTIVE",
                Note = "Dip buy trigger zone"
            },
            new AlertDto
            {
                Id = "alert-3",
                Symbol = "NIFTY 50",
                Condition = "CHANGE_PERCENT_ABOVE",
                TargetValue = 1.5m,
                CurrentValue = 0.64m,
                Status = "ACTIVE",
                Note = "Momentum trend day trigger"
            },
            new AlertDto
            {
                Id = "alert-4",
                Symbol = "ETH/USDT",
                Condition = "RSI_BELOW",
                TargetValue = 30m,
                CurrentValue = 48.5m,
                Status = "TRIGGERED",
                TriggeredAt = DateTime.UtcNow.AddHours(-3),
                Note = "Oversold bounce confluence"
            }
        };

        [HttpGet]
        public IActionResult GetAlerts()
        {
            return Ok(_alerts);
        }

        [HttpPost]
        public IActionResult CreateAlert([FromBody] AlertDto alert)
        {
            alert.Id = Guid.NewGuid().ToString("N").Substring(0, 8);
            alert.CreatedAt = DateTime.UtcNow;
            alert.Status = "ACTIVE";
            _alerts.Insert(0, alert);
            return Ok(alert);
        }

        [HttpDelete("{id}")]
        public IActionResult DeleteAlert(string id)
        {
            _alerts.RemoveAll(a => a.Id == id);
            return Ok(new { success = true });
        }
    }

    [ApiController]
    [Route("api/[controller]")]
    public class HealthController : ControllerBase
    {
        private readonly IMarketDataService _marketDataService;

        public HealthController(IMarketDataService marketDataService)
        {
            _marketDataService = marketDataService;
        }

        [HttpGet]
        public IActionResult GetHealth()
        {
            var status = _marketDataService.GetConnectionStatus();
            return Ok(new
            {
                status = "Healthy",
                service = "TradingTerminal.Api",
                version = "1.0.0",
                timestamp = DateTime.UtcNow,
                gateway = status
            });
        }
    }
}
