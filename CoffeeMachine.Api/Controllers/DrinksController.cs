using BrewBlissCoffee.Data;
using BrewBlissCoffee.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BrewBlissCoffee.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DrinksController : ControllerBase
{
    private readonly CoffeeMachineContext _db;

    public DrinksController(CoffeeMachineContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Drink>>> GetAll() =>
        await _db.Drinks.OrderBy(d => d.DrinkId).ToListAsync();

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Drink>> GetById(int id)
    {
        var drink = await _db.Drinks.FindAsync(id);
        return drink is null ? NotFound(new { message = "Drink not found." }) : Ok(drink);
    }

    [HttpPost]
    public async Task<ActionResult<Drink>> Create(Drink drink)
    {
        drink.DrinkId = 0;
        _db.Drinks.Add(drink);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = drink.DrinkId }, drink);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, Drink input)
    {
        var drink = await _db.Drinks.FindAsync(id);
        if (drink is null) return NotFound(new { message = "Drink not found." });

        drink.DrinkName = input.DrinkName;
        drink.Description = input.Description;
        drink.Price = input.Price;
        drink.IsAvailable = input.IsAvailable;
        await _db.SaveChangesAsync();
        return Ok(drink);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var drink = await _db.Drinks.FindAsync(id);
        if (drink is null) return NotFound(new { message = "Drink not found." });

        _db.Drinks.Remove(drink);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
