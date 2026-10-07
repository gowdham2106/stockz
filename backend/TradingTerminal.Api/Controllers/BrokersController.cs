using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using TradingTerminal.Api.Models;
using TradingTerminal.Api.Services;

namespace TradingTerminal.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BrokersController : ControllerBase
    {
        private readonly IBrokerGatewayService _brokerGatewayService;

        public BrokersController(IBrokerGatewayService brokerGatewayService)
        {
            _brokerGatewayService = brokerGatewayService;
        }

        [HttpGet("{brokerId}")]
        public async Task<IActionResult> GetBrokerAccount(string brokerId)
        {
            var account = await _brokerGatewayService.GetBrokerAccountAsync(brokerId);
            return Ok(account);
        }

        [HttpGet]
        public async Task<IActionResult> GetAllBrokers()
        {
            var list = await _brokerGatewayService.GetAllConnectedBrokersAsync();
            return Ok(list);
        }

        [HttpPost("connect")]
        public async Task<IActionResult> ConnectBroker([FromBody] BrokerConnectRequest request)
        {
            var result = await _brokerGatewayService.ConnectBrokerAsync(request);
            return Ok(result);
        }
    }
}
