using System.ComponentModel.DataAnnotations;

namespace BrewBlissCoffee.Models;

public class CreateOrderRequest
{
    [Required, MaxLength(100)]
    public string CustomerName { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? PhoneNumber { get; set; }

    [Range(typeof(decimal), "0.01", "1000000")]
    public decimal AmountPaid { get; set; }

    [Required, MinLength(1)]
    public List<CreateOrderItemRequest> Items { get; set; } = new();
}

public class CreateOrderItemRequest
{
    [Range(1, int.MaxValue)]
    public int DrinkId { get; set; }

    [Range(1, 1000)]
    public int Quantity { get; set; }
}
