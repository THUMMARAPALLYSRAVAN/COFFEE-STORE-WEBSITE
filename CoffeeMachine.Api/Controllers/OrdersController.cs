using BrewBlissCoffee.Data;
using BrewBlissCoffee.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BrewBlissCoffee.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly CoffeeMachineContext _db;

    public OrdersController(CoffeeMachineContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Order>>> GetAll()
    {
        var orders = await _db.Orders
            .Include(o => o.Items)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        return Ok(orders);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Order>> GetById(int id)
    {
        var order = await _db.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.OrderId == id);

        return order is null ? NotFound(new { message = "Order not found." }) : Ok(order);
    }

    [HttpPost]
    public async Task<ActionResult<Order>> Create(CreateOrderRequest request)
    {
        if (request.Items is null || request.Items.Count == 0)
            return BadRequest(new { message = "Add at least one drink to the order." });

        if (string.IsNullOrWhiteSpace(request.CustomerName))
            return BadRequest(new { message = "Customer name is required." });

        var ids = request.Items.Select(i => i.DrinkId).Distinct().ToList();
        var drinks = await _db.Drinks.Where(d => ids.Contains(d.DrinkId)).ToDictionaryAsync(d => d.DrinkId);

        var order = new Order
        {
            OrderNumber = "BB" + DateTime.UtcNow.ToString("yyyyMMddHHmmss") +
                          Random.Shared.Next(100, 999),
            CustomerName = request.CustomerName.Trim(),
            PhoneNumber = string.IsNullOrWhiteSpace(request.PhoneNumber) ? null : request.PhoneNumber.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        decimal total = 0m;

        foreach (var requestedItem in request.Items)
        {
            if (!drinks.TryGetValue(requestedItem.DrinkId, out var drink))
                return BadRequest(new { message = $"Drink ID {requestedItem.DrinkId} was not found." });

            if (!drink.IsAvailable)
                return BadRequest(new { message = $"{drink.DrinkName} is currently unavailable." });

            if (requestedItem.Quantity < 1 || requestedItem.Quantity > 1000)
                return BadRequest(new { message = "Invalid drink quantity." });

            var lineTotal = decimal.Round(drink.Price * requestedItem.Quantity, 2);
            total += lineTotal;

            order.Items.Add(new OrderItem
            {
                DrinkId = drink.DrinkId,
                DrinkName = drink.DrinkName,
                Quantity = requestedItem.Quantity,
                UnitPrice = drink.Price,
                LineTotal = lineTotal
            });
        }

        total = decimal.Round(total, 2);

        if (request.AmountPaid < total)
            return BadRequest(new { message = $"Insufficient payment. Please pay at least ₹{total:0.00}." });

        order.TotalAmount = total;
        order.AmountPaid = decimal.Round(request.AmountPaid, 2);
        order.ChangeAmount = decimal.Round(order.AmountPaid - total, 2);

        _db.Orders.Add(order);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = order.OrderId }, order);
    }
}
