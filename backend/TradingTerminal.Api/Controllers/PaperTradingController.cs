using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using TradingTerminal.Api.Models;
using TradingTerminal.Api.Services;

namespace TradingTerminal.Api.Controllers
{
    [ApiController]
    [Route("api/papertrading")]
    public class PaperTradingController : ControllerBase
    {
        private readonly IPaperTradingService _paperTradingService;

        public PaperTradingController(IPaperTradingService paperTradingService)
        {
            _paperTradingService = paperTradingService;
        }

        [HttpGet("account")]
        public async Task<IActionResult> GetAccount()
        {
            var summary = await _paperTradingService.GetAccountSummaryAsync();
            return Ok(summary);
        }

        [HttpPost("order")]
        public async Task<IActionResult> ExecuteOrder([FromBody] PaperTradeOrderRequest request)
        {
            try
            {
                var summary = await _paperTradingService.ExecuteOrderAsync(request);
                return Ok(summary);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpPost("close/{positionId}")]
        public async Task<IActionResult> ClosePosition(string positionId, [FromQuery] string reason = "MANUAL")
        {
            var summary = await _paperTradingService.ClosePositionAsync(positionId, reason);
            return Ok(summary);
        }

        [HttpPost("cancel/{orderId}")]
        public async Task<IActionResult> CancelOrder(string orderId)
        {
            var summary = await _paperTradingService.CancelOrderAsync(orderId);
            return Ok(summary);
        }

        [HttpPost("reset")]
        public async Task<IActionResult> ResetAccount([FromQuery] decimal initialCash = 100000m)
        {
            var summary = await _paperTradingService.ResetAccountAsync(initialCash);
            return Ok(summary);
        }

        [HttpPost("deposit")]
        public async Task<IActionResult> DepositFunds([FromQuery] decimal amount = 25000m)
        {
            var summary = await _paperTradingService.DepositVirtualFundsAsync(amount);
            return Ok(summary);
        }
    }
}
