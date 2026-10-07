using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using TradingTerminal.Api.Hubs;
using TradingTerminal.Api.Interfaces;
using TradingTerminal.Api.Models;

namespace TradingTerminal.Api.Services
{
    public interface IPaperTradingService
    {
        Task<PaperAccountSummary> GetAccountSummaryAsync();
        Task<PaperAccountSummary> ExecuteOrderAsync(PaperTradeOrderRequest order);
        Task<PaperAccountSummary> ClosePositionAsync(string positionId, string reason = "MANUAL", decimal? customExitPrice = null);
        Task<PaperAccountSummary> CancelOrderAsync(string orderId);
        Task<PaperAccountSummary> ResetAccountAsync(decimal initialCash = 100000m);
        Task<PaperAccountSummary> DepositVirtualFundsAsync(decimal amount);
        Task CheckTriggersAndFillsAsync(string symbol, decimal currentPrice, decimal high, decimal low);
    }

    public class PaperTradingService : IPaperTradingService
    {
        private readonly IAssetRepository _assetRepository;
        private readonly IHubContext<MarketHub> _hubContext;
        private static readonly object _lock = new();

        private static decimal _virtualCash = 73630.00m; // Starting available cash after initial demo positions
        private static readonly List<PaperPosition> _positions = new();
        private static readonly List<PaperOrder> _openOrders = new();
        private static readonly List<PaperClosedTrade> _history = new();
        private static int _winningTrades = 4;
        private static int _totalTrades = 5;
        private static decimal _realizedPnl = 4820.50m;
        private static bool _isInitialized = false;

        public PaperTradingService(IAssetRepository assetRepository, IHubContext<MarketHub> hubContext)
        {
            _assetRepository = assetRepository;
            _hubContext = hubContext;

            lock (_lock)
            {
                if (!_isInitialized)
                {
                    InitializeDefaultPositions();
                    _isInitialized = true;
                }
            }
        }

        public async Task<PaperAccountSummary> GetAccountSummaryAsync()
        {
            decimal totalUnrealizedPnl = 0m;
            decimal totalMarginUsed = 0m;
            List<PaperPosition> activePositions;
            List<PaperOrder> activeOrders;
            List<PaperClosedTrade> tradeHistory;

            lock (_lock)
            {
                activePositions = _positions.ToList();
                activeOrders = _openOrders.Where(o => o.Status == "OPEN").ToList();
                tradeHistory = _history.OrderByDescending(h => h.ClosedAt).ToList();
            }

            foreach (var pos in activePositions)
            {
                var currentPrice = await GetLivePriceAsync(pos.Symbol);
                pos.CurrentPrice = currentPrice > 0 ? currentPrice : pos.EntryPrice;

                var priceDiff = pos.Side == "BUY" 
                    ? (pos.CurrentPrice - pos.EntryPrice) 
                    : (pos.EntryPrice - pos.CurrentPrice);

                pos.UnrealizedPnl = Math.Round(priceDiff * pos.Quantity * pos.Leverage, 2);
                pos.UnrealizedPnlPercent = pos.EntryPrice > 0 
                    ? Math.Round((priceDiff / pos.EntryPrice) * 100m * pos.Leverage, 2) 
                    : 0m;

                totalUnrealizedPnl += pos.UnrealizedPnl;
                totalMarginUsed += pos.MarginUsed;
            }

            decimal availableCash;
            decimal realized;
            int totalT, winT;

            lock (_lock)
            {
                availableCash = _virtualCash;
                realized = _realizedPnl;
                totalT = _totalTrades;
                winT = _winningTrades;
            }

            return new PaperAccountSummary
            {
                VirtualCash = availableCash,
                TotalPortfolioValue = Math.Round(availableCash + totalMarginUsed + totalUnrealizedPnl, 2),
                MarginUsed = Math.Round(totalMarginUsed, 2),
                UnrealizedPnl = Math.Round(totalUnrealizedPnl, 2),
                RealizedPnl = Math.Round(realized, 2),
                TotalTrades = totalT,
                WinningTrades = winT,
                Positions = activePositions,
                OpenOrders = activeOrders,
                TradeHistory = tradeHistory
            };
        }

        public async Task<PaperAccountSummary> ExecuteOrderAsync(PaperTradeOrderRequest order)
        {
            if (order.Quantity <= 0)
            {
                throw new ArgumentException("Order quantity must be greater than zero.");
            }

            var livePrice = await GetLivePriceAsync(order.Symbol);
            if (livePrice <= 0) livePrice = 100.00m;

            var fillPrice = (order.OrderType == "LIMIT" && order.LimitPrice.HasValue && order.LimitPrice.Value > 0) 
                ? order.LimitPrice.Value 
                : livePrice;

            var asset = await _assetRepository.GetAssetBySymbolAsync(order.Symbol);
            var leverage = Math.Max(1, order.Leverage);
            var positionCost = Math.Round((fillPrice * order.Quantity) / leverage, 2);

            // If it's a Limit order placed away from current market (>0.3% delta), queue it in Open Orders
            if (order.OrderType == "LIMIT" && order.LimitPrice.HasValue && Math.Abs(order.LimitPrice.Value - livePrice) > (livePrice * 0.003m))
            {
                lock (_lock)
                {
                    if (_virtualCash < positionCost)
                    {
                        throw new InvalidOperationException($"Insufficient Virtual Cash. Order requires ${positionCost:N2} margin, but available balance is ${_virtualCash:N2}.");
                    }

                    // Reserve margin for pending limit order
                    _virtualCash -= positionCost;

                    _openOrders.Add(new PaperOrder
                    {
                        Symbol = order.Symbol,
                        Side = order.Side,
                        OrderType = "LIMIT",
                        Quantity = order.Quantity,
                        TargetPrice = order.LimitPrice.Value,
                        Status = "OPEN",
                        PlacedAt = DateTime.UtcNow
                    });
                }
            }
            else
            {
                // Instant Market Fill
                lock (_lock)
                {
                    if (_virtualCash < positionCost)
                    {
                        throw new InvalidOperationException($"Insufficient Virtual Cash. Order requires ${positionCost:N2} margin, but available balance is ${_virtualCash:N2}.");
                    }

                    // Immediately deduct margin from available virtual cash
                    _virtualCash -= positionCost;

                    decimal? liqPrice = null;
                    if (leverage > 1)
                    {
                        liqPrice = (order.Side == "BUY")
                            ? Math.Max(0, Math.Round(fillPrice * (1m - 0.90m / leverage), 2))
                            : Math.Round(fillPrice * (1m + 0.90m / leverage), 2);
                    }

                    _positions.Add(new PaperPosition
                    {
                        Symbol = order.Symbol,
                        Name = asset?.Name ?? order.Symbol,
                        Side = order.Side,
                        Quantity = order.Quantity,
                        EntryPrice = fillPrice,
                        CurrentPrice = livePrice,
                        MarginUsed = positionCost,
                        Leverage = leverage,
                        StopLoss = order.StopLoss,
                        TakeProfit = order.TakeProfit,
                        LiquidationPrice = liqPrice,
                        UnrealizedPnl = 0m,
                        UnrealizedPnlPercent = 0m,
                        OpenedAt = DateTime.UtcNow
                    });
                }
            }

            var summary = await GetAccountSummaryAsync();

            // Broadcast account update via SignalR
            try
            {
                await _hubContext.Clients.All.SendAsync("PaperAccountUpdated", summary);
            }
            catch {}

            return summary;
        }

        public async Task<PaperAccountSummary> ClosePositionAsync(string positionId, string reason = "MANUAL", decimal? customExitPrice = null)
        {
            PaperPosition? pos = null;
            decimal exitPrice = 0m;
            decimal pnl = 0m;
            decimal pnlPercent = 0m;

            lock (_lock)
            {
                pos = _positions.FirstOrDefault(p => p.Id == positionId);
                if (pos != null)
                {
                    exitPrice = customExitPrice.HasValue && customExitPrice.Value > 0 
                        ? customExitPrice.Value 
                        : pos.CurrentPrice;

                    var priceDiff = pos.Side == "BUY" ? (exitPrice - pos.EntryPrice) : (pos.EntryPrice - exitPrice);
                    pnl = Math.Round(priceDiff * pos.Quantity * pos.Leverage, 2);
                    pnlPercent = pos.EntryPrice > 0 ? Math.Round((priceDiff / pos.EntryPrice) * 100m * pos.Leverage, 2) : 0m;

                    // Release margin and add realized PnL back into virtual available cash
                    _virtualCash += (pos.MarginUsed + pnl);
                    _realizedPnl += pnl;
                    _totalTrades++;
                    if (pnl >= 0) _winningTrades++;

                    _history.Add(new PaperClosedTrade
                    {
                        Symbol = pos.Symbol,
                        Side = pos.Side,
                        Quantity = pos.Quantity,
                        EntryPrice = pos.EntryPrice,
                        ExitPrice = exitPrice,
                        RealizedPnl = pnl,
                        RealizedPnlPercent = pnlPercent,
                        CloseReason = reason,
                        OpenedAt = pos.OpenedAt,
                        ClosedAt = DateTime.UtcNow
                    });

                    _positions.Remove(pos);
                }
            }

            var summary = await GetAccountSummaryAsync();

            if (pos != null)
            {
                try
                {
                    await _hubContext.Clients.All.SendAsync("PaperAccountUpdated", summary);

                    string title = reason switch
                    {
                        "STOP_LOSS" => "🚨 Stop Loss Executed",
                        "TAKE_PROFIT" => "🎯 Take Profit Hit",
                        "LIQUIDATION" => "⚠️ Margin Liquidation",
                        _ => "Position Closed"
                    };

                    string msg = reason switch
                    {
                        "STOP_LOSS" => $"Auto-sold {pos.Quantity} {pos.Symbol} at ${exitPrice:N2} to cut loss. Loss: -${Math.Abs(pnl):N2}",
                        "TAKE_PROFIT" => $"Take-Profit executed for {pos.Quantity} {pos.Symbol} at ${exitPrice:N2}! Profit: +${pnl:N2}",
                        "LIQUIDATION" => $"Position {pos.Symbol} was liquidated due to margin depletion.",
                        _ => $"Closed {pos.Side} {pos.Quantity} {pos.Symbol} @ ${exitPrice:N2} (P&L: {(pnl >= 0 ? "+" : "")}${pnl:N2})"
                    };

                    await _hubContext.Clients.All.SendAsync("PaperNotification", new PaperNotificationDto
                    {
                        Type = reason,
                        Title = title,
                        Message = msg,
                        Symbol = pos.Symbol,
                        Pnl = pnl,
                        Timestamp = DateTime.UtcNow
                    });
                }
                catch {}
            }

            return summary;
        }

        public async Task<PaperAccountSummary> CancelOrderAsync(string orderId)
        {
            lock (_lock)
            {
                var order = _openOrders.FirstOrDefault(o => o.Id == orderId && o.Status == "OPEN");
                if (order != null)
                {
                    order.Status = "CANCELLED";
                    // Refund reserved margin back to available cash
                    var reservedCost = order.TargetPrice * order.Quantity;
                    _virtualCash += reservedCost;
                }
            }

            var summary = await GetAccountSummaryAsync();
            try
            {
                await _hubContext.Clients.All.SendAsync("PaperAccountUpdated", summary);
            }
            catch {}

            return summary;
        }

        public async Task<PaperAccountSummary> ResetAccountAsync(decimal initialCash = 100000m)
        {
            lock (_lock)
            {
                _virtualCash = initialCash;
                _positions.Clear();
                _openOrders.Clear();
                _history.Clear();
                _realizedPnl = 0m;
                _totalTrades = 0;
                _winningTrades = 0;
            }

            var summary = await GetAccountSummaryAsync();
            try
            {
                await _hubContext.Clients.All.SendAsync("PaperAccountUpdated", summary);
                await _hubContext.Clients.All.SendAsync("PaperNotification", new PaperNotificationDto
                {
                    Type = "INFO",
                    Title = "Simulator Reset",
                    Message = $"Paper trading account reset to ${initialCash:N2} virtual cash.",
                    Symbol = "ALL",
                    Timestamp = DateTime.UtcNow
                });
            }
            catch {}

            return summary;
        }

        public async Task<PaperAccountSummary> DepositVirtualFundsAsync(decimal amount)
        {
            lock (_lock)
            {
                _virtualCash += amount;
            }

            var summary = await GetAccountSummaryAsync();
            try
            {
                await _hubContext.Clients.All.SendAsync("PaperAccountUpdated", summary);
                await _hubContext.Clients.All.SendAsync("PaperNotification", new PaperNotificationDto
                {
                    Type = "INFO",
                    Title = "Virtual Funds Credited",
                    Message = $"Added +${amount:N2} virtual cash to your practice wallet.",
                    Symbol = "USD",
                    Timestamp = DateTime.UtcNow
                });
            }
            catch {}

            return summary;
        }

        public async Task CheckTriggersAndFillsAsync(string symbol, decimal currentPrice, decimal high, decimal low)
        {
            if (currentPrice <= 0) return;

            var normSymbol = NormalizeSymbol(symbol);
            List<PaperPosition> positionsToCheck;
            List<PaperOrder> ordersToCheck;

            lock (_lock)
            {
                positionsToCheck = _positions.Where(p => NormalizeSymbol(p.Symbol) == normSymbol).ToList();
                ordersToCheck = _openOrders.Where(o => o.Status == "OPEN" && NormalizeSymbol(o.Symbol) == normSymbol).ToList();
            }

            // 1. Evaluate Active Positions for Stop-Loss, Take-Profit, and Liquidation triggers
            foreach (var pos in positionsToCheck)
            {
                bool shouldClose = false;
                string reason = "MANUAL";
                decimal triggerExitPrice = currentPrice;

                // Long (BUY) Position
                if (pos.Side == "BUY")
                {
                    // Stop Loss Trigger
                    if (pos.StopLoss.HasValue && pos.StopLoss.Value > 0 && currentPrice <= pos.StopLoss.Value)
                    {
                        shouldClose = true;
                        reason = "STOP_LOSS";
                        triggerExitPrice = pos.StopLoss.Value;
                    }
                    // Take Profit Trigger
                    else if (pos.TakeProfit.HasValue && pos.TakeProfit.Value > 0 && currentPrice >= pos.TakeProfit.Value)
                    {
                        shouldClose = true;
                        reason = "TAKE_PROFIT";
                        triggerExitPrice = pos.TakeProfit.Value;
                    }
                    // Liquidation Trigger
                    else if (pos.LiquidationPrice.HasValue && pos.LiquidationPrice.Value > 0 && currentPrice <= pos.LiquidationPrice.Value)
                    {
                        shouldClose = true;
                        reason = "LIQUIDATION";
                        triggerExitPrice = pos.LiquidationPrice.Value;
                    }
                }
                // Short (SELL) Position
                else if (pos.Side == "SELL")
                {
                    // Stop Loss Trigger (Short triggers when price rises above SL)
                    if (pos.StopLoss.HasValue && pos.StopLoss.Value > 0 && currentPrice >= pos.StopLoss.Value)
                    {
                        shouldClose = true;
                        reason = "STOP_LOSS";
                        triggerExitPrice = pos.StopLoss.Value;
                    }
                    // Take Profit Trigger (Short triggers when price drops below TP)
                    else if (pos.TakeProfit.HasValue && pos.TakeProfit.Value > 0 && currentPrice <= pos.TakeProfit.Value)
                    {
                        shouldClose = true;
                        reason = "TAKE_PROFIT";
                        triggerExitPrice = pos.TakeProfit.Value;
                    }
                    // Liquidation Trigger
                    else if (pos.LiquidationPrice.HasValue && pos.LiquidationPrice.Value > 0 && currentPrice >= pos.LiquidationPrice.Value)
                    {
                        shouldClose = true;
                        reason = "LIQUIDATION";
                        triggerExitPrice = pos.LiquidationPrice.Value;
                    }
                }

                if (shouldClose)
                {
                    await ClosePositionAsync(pos.Id, reason, triggerExitPrice);
                }
            }

            // 2. Evaluate Pending Limit Orders for Auto-Fill
            foreach (var order in ordersToCheck)
            {
                bool shouldFill = false;
                if (order.Side == "BUY" && currentPrice <= order.TargetPrice)
                {
                    shouldFill = true;
                }
                else if (order.Side == "SELL" && currentPrice >= order.TargetPrice)
                {
                    shouldFill = true;
                }

                if (shouldFill)
                {
                    var asset = await _assetRepository.GetAssetBySymbolAsync(order.Symbol);
                    lock (_lock)
                    {
                        order.Status = "FILLED";
                        _positions.Add(new PaperPosition
                        {
                            Symbol = order.Symbol,
                            Name = asset?.Name ?? order.Symbol,
                            Side = order.Side,
                            Quantity = order.Quantity,
                            EntryPrice = order.TargetPrice,
                            CurrentPrice = currentPrice,
                            MarginUsed = order.TargetPrice * order.Quantity,
                            Leverage = 1,
                            OpenedAt = DateTime.UtcNow
                        });
                    }

                    var summary = await GetAccountSummaryAsync();
                    try
                    {
                        await _hubContext.Clients.All.SendAsync("PaperAccountUpdated", summary);
                        await _hubContext.Clients.All.SendAsync("PaperNotification", new PaperNotificationDto
                        {
                            Type = "ORDER_FILLED",
                            Title = "Limit Order Filled",
                            Message = $"Limit {order.Side} filled: {order.Quantity} {order.Symbol} @ ${order.TargetPrice:N2}",
                            Symbol = order.Symbol,
                            Timestamp = DateTime.UtcNow
                        });
                    }
                    catch {}
                }
            }
        }

        private async Task<decimal> GetLivePriceAsync(string symbol)
        {
            try
            {
                var asset = await _assetRepository.GetAssetBySymbolAsync(symbol);
                if (asset != null && asset.Price > 0) return asset.Price;
            }
            catch {}

            return NormalizeSymbol(symbol) switch
            {
                "BTCUSDT" => 67420.00m,
                "ETHUSDT" => 3450.00m,
                "SOLUSDT" => 175.50m,
                "BNBUSDT" => 595.00m,
                "NVDA" => 132.50m,
                "AAPL" => 228.40m,
                "RELIANCE" => 2960.50m,
                "TCS" => 4120.00m,
                "EURUSD" => 1.0885m,
                "GOLD" or "XAUUSD" => 2685.00m,
                _ => 100.00m
            };
        }

        private static string NormalizeSymbol(string s)
        {
            if (string.IsNullOrEmpty(s)) return string.Empty;
            return s.Replace("/", "").Replace("-", "").ToUpperInvariant();
        }

        private void InitializeDefaultPositions()
        {
            if (_positions.Count == 0)
            {
                _positions.Add(new PaperPosition
                {
                    Symbol = "BTC/USDT",
                    Name = "Bitcoin",
                    Side = "BUY",
                    Quantity = 0.5m,
                    EntryPrice = 65800.00m,
                    CurrentPrice = 67420.00m,
                    MarginUsed = 16450.00m,
                    Leverage = 2,
                    UnrealizedPnl = 1620.00m,
                    UnrealizedPnlPercent = 4.92m,
                    StopLoss = 63500.00m,
                    TakeProfit = 72000.00m,
                    LiquidationPrice = 36190.00m,
                    OpenedAt = DateTime.UtcNow.AddHours(-18)
                });

                _positions.Add(new PaperPosition
                {
                    Symbol = "NVDA",
                    Name = "NVIDIA Corp",
                    Side = "BUY",
                    Quantity = 80m,
                    EntryPrice = 124.00m,
                    CurrentPrice = 132.50m,
                    MarginUsed = 9920.00m,
                    Leverage = 1,
                    UnrealizedPnl = 680.00m,
                    UnrealizedPnlPercent = 6.85m,
                    StopLoss = 118.00m,
                    TakeProfit = 145.00m,
                    LiquidationPrice = 12.40m,
                    OpenedAt = DateTime.UtcNow.AddHours(-42)
                });
            }
        }
    }
}
