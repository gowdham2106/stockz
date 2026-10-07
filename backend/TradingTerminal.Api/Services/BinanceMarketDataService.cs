using System;
using System.IO;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using TradingTerminal.Api.DTOs;
using TradingTerminal.Api.Interfaces;
using TradingTerminal.Api.Models;

namespace TradingTerminal.Api.Services
{
    public class BinanceMarketDataService : IMarketDataProvider
    {
        public string ProviderName => "Binance Real-Time Gateway";
        public bool IsConnected => _webSocket?.State == WebSocketState.Open;

        private readonly IPriceNormalizer _normalizer;
        private readonly ILogger<BinanceMarketDataService> _logger;
        private ClientWebSocket? _webSocket;
        private readonly string _streamUrl = "wss://stream.binance.com:9443/stream?streams=btcusdt@aggTrade/ethusdt@aggTrade/solusdt@aggTrade/bnbusdt@aggTrade/xrpusdt@aggTrade/dogeusdt@aggTrade/adausdt@aggTrade/avaxusdt@aggTrade/linkusdt@aggTrade/btcusdt@depth20@100ms/ethusdt@depth20@100ms/!miniTicker@arr";

        public event Action<MarketAsset>? OnAssetUpdated;
        public event Action<OrderBookDto>? OnOrderBookUpdated;
        public event Action<TradeDto>? OnTradeExecuted;
        public event Action<string, string, int>? OnConnectionStatusChanged;

        public BinanceMarketDataService(IPriceNormalizer normalizer, ILogger<BinanceMarketDataService> logger)
        {
            _normalizer = normalizer;
            _logger = logger;
        }

        public async Task StartAsync(CancellationToken cancellationToken)
        {
            int retryDelay = 1000;
            const int maxDelay = 15000;

            while (!cancellationToken.IsCancellationRequested)
            {
                try
                {
                    OnConnectionStatusChanged?.Invoke(ProviderName, "CONNECTING", 0);
                    _logger.LogInformation("Connecting to Binance Real-Time WebSocket stream: {Url}", _streamUrl);

                    using (_webSocket = new ClientWebSocket())
                    {
                        var startWatch = DateTime.UtcNow;
                        await _webSocket.ConnectAsync(new Uri(_streamUrl), cancellationToken);
                        var latency = (int)(DateTime.UtcNow - startWatch).TotalMilliseconds;

                        _logger.LogInformation("Connected to Binance WebSocket with sub-millisecond feeds. Latency: {Latency}ms", latency);
                        OnConnectionStatusChanged?.Invoke(ProviderName, "LIVE", latency);
                        retryDelay = 1000;

                        await ReceiveLoopAsync(_webSocket, cancellationToken);
                    }
                }
                catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning("Binance WebSocket stream error: {Message}. Reconnecting in {Delay}ms...", ex.Message, retryDelay);
                    OnConnectionStatusChanged?.Invoke(ProviderName, "RECONNECTING", 0);

                    try
                    {
                        await Task.Delay(retryDelay, cancellationToken);
                        retryDelay = Math.Min(retryDelay * 2, maxDelay);
                    }
                    catch (OperationCanceledException)
                    {
                        break;
                    }
                }
            }

            OnConnectionStatusChanged?.Invoke(ProviderName, "DISCONNECTED", 0);
        }

        public async Task StopAsync(CancellationToken cancellationToken)
        {
            if (_webSocket != null && _webSocket.State == WebSocketState.Open)
            {
                try
                {
                    await _webSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Closing", cancellationToken);
                }
                catch
                {
                    // Ignore during shutdown
                }
            }
        }

        private async Task ReceiveLoopAsync(ClientWebSocket ws, CancellationToken cancellationToken)
        {
            var buffer = new byte[32768];
            using var ms = new MemoryStream();

            while (ws.State == WebSocketState.Open && !cancellationToken.IsCancellationRequested)
            {
                ms.SetLength(0);
                WebSocketReceiveResult result;
                do
                {
                    result = await ws.ReceiveAsync(new ArraySegment<byte>(buffer), cancellationToken);
                    if (result.MessageType == WebSocketMessageType.Close)
                    {
                        await ws.CloseAsync(WebSocketCloseStatus.NormalClosure, "Closed by server", cancellationToken);
                        return;
                    }
                    ms.Write(buffer, 0, result.Count);
                } while (!result.EndOfMessage);

                ms.Seek(0, SeekOrigin.Begin);
                var json = Encoding.UTF8.GetString(ms.ToArray());
                ProcessMessage(json);
            }
        }

        private void ProcessMessage(string json)
        {
            try
            {
                using var doc = JsonDocument.Parse(json);
                var root = doc.RootElement;

                // Combined stream payload: {"stream":"<streamName>", "data":{...}}
                if (root.TryGetProperty("stream", out var streamEl) && root.TryGetProperty("data", out var dataEl))
                {
                    var streamName = streamEl.GetString() ?? "";

                    if (dataEl.ValueKind == JsonValueKind.Array)
                    {
                        // Array of tickers (e.g. !miniTicker@arr)
                        foreach (var item in dataEl.EnumerateArray())
                        {
                            var asset = _normalizer.NormalizeBinanceTicker(item);
                            if (asset != null)
                            {
                                OnAssetUpdated?.Invoke(asset);
                            }
                        }
                    }
                    else if (streamName.Contains("@aggTrade", StringComparison.OrdinalIgnoreCase) || streamName.EndsWith("@trade", StringComparison.OrdinalIgnoreCase))
                    {
                        var symbolPart = streamName.Split('@')[0].ToUpperInvariant();
                        var symbol = symbolPart.EndsWith("USDT") ? $"{symbolPart.Substring(0, symbolPart.Length - 4)}/USDT" : symbolPart;
                        var trade = _normalizer.NormalizeBinanceTrade(dataEl, symbol);
                        if (trade != null)
                        {
                            OnTradeExecuted?.Invoke(trade);
                        }
                    }
                    else if (streamName.Contains("@depth", StringComparison.OrdinalIgnoreCase))
                    {
                        var symbolPart = streamName.Split('@')[0].ToUpperInvariant();
                        var symbol = symbolPart.EndsWith("USDT") ? $"{symbolPart.Substring(0, symbolPart.Length - 4)}/USDT" : symbolPart;
                        var ob = _normalizer.NormalizeBinanceDepth(dataEl, symbol);
                        if (ob != null)
                        {
                            OnOrderBookUpdated?.Invoke(ob);
                        }
                    }
                    else if (streamName.EndsWith("@ticker", StringComparison.OrdinalIgnoreCase) || streamName.EndsWith("@miniTicker", StringComparison.OrdinalIgnoreCase))
                    {
                        var asset = _normalizer.NormalizeBinanceTicker(dataEl);
                        if (asset != null)
                        {
                            OnAssetUpdated?.Invoke(asset);
                        }
                    }
                }
                else if (root.ValueKind == JsonValueKind.Array)
                {
                    foreach (var item in root.EnumerateArray())
                    {
                        var asset = _normalizer.NormalizeBinanceTicker(item);
                        if (asset != null)
                        {
                            OnAssetUpdated?.Invoke(asset);
                        }
                    }
                }
                else
                {
                    var asset = _normalizer.NormalizeBinanceTicker(root);
                    if (asset != null)
                    {
                        OnAssetUpdated?.Invoke(asset);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogTrace("Error parsing websocket message: {Message}", ex.Message);
            }
        }
    }
}
