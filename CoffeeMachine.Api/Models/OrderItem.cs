namespace BrewBlissCoffee.Models;

public class OrderItem
{
    public int OrderItemId { get; set; }
    public int OrderId { get; set; }

    // DrinkId is retained as a historical reference; the name and price are snapshots.
    public int DrinkId { get; set; }
    public string DrinkName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal LineTotal { get; set; }
}
