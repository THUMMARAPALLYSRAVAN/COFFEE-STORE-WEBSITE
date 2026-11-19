using BrewBlissCoffee.Data;
using BrewBlissCoffee.Models;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddDbContext<CoffeeMachineContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("CoffeeMachineConnection")));

var app = builder.Build();

// Create the database and seed the initial menu on first run.
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<CoffeeMachineContext>();
    await db.Database.EnsureCreatedAsync();

    if (!await db.Drinks.AnyAsync())
    {
        db.Drinks.AddRange(
            new Drink { DrinkName = "Espresso", Description = "Strong, rich and freshly brewed coffee.", Price = 40m, IsAvailable = true },
            new Drink { DrinkName = "Cappuccino", Description = "Espresso with steamed milk and a creamy foam layer.", Price = 80m, IsAvailable = true },
            new Drink { DrinkName = "Latte", Description = "Smooth espresso blended with steamed milk.", Price = 90m, IsAvailable = true },
            new Drink { DrinkName = "Cold Coffee", Description = "Chilled coffee served refreshingly cold.", Price = 100m, IsAvailable = true },
            new Drink { DrinkName = "Tea", Description = "A comforting cup of freshly prepared tea.", Price = 20m, IsAvailable = true }
        );
        await db.SaveChangesAsync();
    }
}

app.UseDefaultFiles();
app.UseStaticFiles();
app.MapControllers();

app.MapGet("/api/health", () => Results.Ok(new
{
    status = "Running",
    application = "Brew Bliss Coffee"
}));

app.Run();
