using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using TradingTerminal.Api.Interfaces;

namespace TradingTerminal.Api.Hubs
{
    public class MarketHub : Hub
    {
        private readonly IMarketDataService _marketDataService;

        public MarketHub(IMarketDataService marketDataService)
        {
            _marketDataService = marketDataService;
        }

        public override async Task OnConnectedAsync()
        {
            // Join global ticker feed by default
            await Groups.AddToGroupAsync(Context.ConnectionId, "GlobalTickers");
            var connectionStatus = _marketDataService.GetConnectionStatus();
            await Clients.Caller.SendAsync("ConnectionStatusChanged", connectionStatus);
            await base.OnConnectedAsync();
        }

        public async Task SubscribeSymbol(string symbol)
        {
            var normalized = symbol.Replace("/", "").ToUpperInvariant();
            await Groups.AddToGroupAsync(Context.ConnectionId, $"Symbol_{normalized}");
            await Groups.AddToGroupAsync(Context.ConnectionId, $"OrderBook_{normalized}");
            await Groups.AddToGroupAsync(Context.ConnectionId, $"Trades_{normalized}");

            // Send initial asset state
            var asset = await _marketDataService.GetAssetAsync(symbol);
            if (asset != null)
            {
                await Clients.Caller.SendAsync("PriceUpdated", asset);
            }

            var ob = await _marketDataService.GetOrderBookAsync(symbol);
            if (ob != null)
            {
                await Clients.Caller.SendAsync("OrderBookUpdated", ob);
            }
        }

        public async Task UnsubscribeSymbol(string symbol)
        {
            var normalized = symbol.Replace("/", "").ToUpperInvariant();
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"Symbol_{normalized}");
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"OrderBook_{normalized}");
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"Trades_{normalized}");
        }

        public async Task Ping()
        {
            await Clients.Caller.SendAsync("Pong", DateTime.UtcNow);
        }
    }
}
