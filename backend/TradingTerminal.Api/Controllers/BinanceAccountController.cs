using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using TradingTerminal.Api.Models;
using TradingTerminal.Api.Services;

namespace TradingTerminal.Api.Controllers
{
    [ApiController]
    [Route("api/binance")]
    public class BinanceAccountController : ControllerBase
    {
        private readonly IBinanceAccountService _binanceAccountService;

        public BinanceAccountController(IBinanceAccountService binanceAccountService)
        {
            _binanceAccountService = binanceAccountService;
        }

        [HttpGet("account")]
        public async Task<IActionResult> GetAccountDetails([FromQuery] string? apiKey = null, [FromQuery] string? secretKey = null, [FromQuery] bool isTestnet = false)
        {
            var summary = await _binanceAccountService.GetAccountDetailsAsync(apiKey, secretKey, isTestnet);
            return Ok(summary);
        }

        [HttpPost("connect")]
        public async Task<IActionResult> ConnectLiveAccount([FromBody] BinanceConnectRequest request)
        {
            var result = await _binanceAccountService.ConnectAndFetchLiveAccountAsync(request);
            if (!result.IsConnected && !string.IsNullOrEmpty(result.Message))
            {
                return BadRequest(result);
            }
            return Ok(result);
        }
    }
}
