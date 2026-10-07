using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using TradingTerminal.Api.Interfaces;

namespace TradingTerminal.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PortfolioController : ControllerBase
    {
        private readonly IMarketDataService _marketDataService;

        public PortfolioController(IMarketDataService marketDataService)
        {
            _marketDataService = marketDataService;
        }

        [HttpGet]
        public async Task<IActionResult> GetPortfolio()
        {
            var portfolio = await _marketDataService.GetSimulatedPortfolioAsync();
            return Ok(portfolio);
        }
    }
}
