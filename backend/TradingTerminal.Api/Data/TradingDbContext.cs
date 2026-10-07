using Microsoft.EntityFrameworkCore;
using TradingTerminal.Api.Models;

namespace TradingTerminal.Api.Data
{
    public class TradingDbContext : DbContext
    {
        public TradingDbContext(DbContextOptions<TradingDbContext> options) : base(options) { }

        public DbSet<MarketAsset> Assets { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<MarketAsset>().HasKey(a => a.Symbol);
            base.OnModelCreating(modelBuilder);
        }
    }
}
