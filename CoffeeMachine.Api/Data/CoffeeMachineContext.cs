using BrewBlissCoffee.Models;
using Microsoft.EntityFrameworkCore;

namespace BrewBlissCoffee.Data;

public class CoffeeMachineContext : DbContext
{
    public CoffeeMachineContext(DbContextOptions<CoffeeMachineContext> options) : base(options) { }

    public DbSet<Drink> Drinks => Set<Drink>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Drink>().Property(d => d.Price).HasPrecision(10, 2);

        modelBuilder.Entity<Order>().HasIndex(o => o.OrderNumber).IsUnique();
        modelBuilder.Entity<Order>().Property(o => o.TotalAmount).HasPrecision(10, 2);
        modelBuilder.Entity<Order>().Property(o => o.AmountPaid).HasPrecision(10, 2);
        modelBuilder.Entity<Order>().Property(o => o.ChangeAmount).HasPrecision(10, 2);

        modelBuilder.Entity<OrderItem>().Property(i => i.UnitPrice).HasPrecision(10, 2);
        modelBuilder.Entity<OrderItem>().Property(i => i.LineTotal).HasPrecision(10, 2);

        modelBuilder.Entity<Order>()
            .HasMany(o => o.Items)
            .WithOne()
            .HasForeignKey(i => i.OrderId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
