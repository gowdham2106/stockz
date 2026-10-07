using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using TradingTerminal.Api.BackgroundServices;
using TradingTerminal.Api.Data;
using TradingTerminal.Api.Hubs;
using TradingTerminal.Api.Interfaces;
using TradingTerminal.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Add Controllers & Swagger
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// SignalR with camelCase serialization
builder.Services.AddSignalR(hubOptions =>
{
    hubOptions.EnableDetailedErrors = true;
    hubOptions.KeepAliveInterval = TimeSpan.FromSeconds(15);
    hubOptions.ClientTimeoutInterval = TimeSpan.FromSeconds(30);
});

// Database Context for future persistence
builder.Services.AddDbContext<TradingDbContext>(options =>
{
    options.UseInMemoryDatabase("TradingTerminalDb");
});

// Core Trading Terminal Services
builder.Services.AddHttpClient();
builder.Services.AddSingleton<IPriceNormalizer, MarketNormalizer>();
builder.Services.AddSingleton<IAssetRepository, InMemoryAssetRepository>();
builder.Services.AddSingleton<IPaperTradingService, PaperTradingService>();
builder.Services.AddSingleton<IMarketDataProvider, BinanceMarketDataService>();
builder.Services.AddSingleton<IMarketDataService, MarketDataService>();
builder.Services.AddSingleton<IBinanceAccountService, BinanceAccountService>();
builder.Services.AddSingleton<IBrokerGatewayService, BrokerGatewayService>();

// Real-time background workers
builder.Services.AddHostedService<BinanceWebSocketWorker>();
builder.Services.AddHostedService<MarketPulseWorker>();

// Configure CORS for Vite React frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowViteFrontend", policy =>
    {
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment() || true)
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowViteFrontend");

app.UseAuthorization();

app.MapControllers();
app.MapHub<MarketHub>("/hubs/market");

app.Run();
