using System.ComponentModel.DataAnnotations;

namespace BrewBlissCoffee.Models;

public class Order
{
    public int OrderId { get; set; }

    [Required, MaxLength(30)]
    public string OrderNumber { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string CustomerName { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? PhoneNumber { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public decimal TotalAmount { get; set; }
    public decimal AmountPaid { get; set; }
    public decimal ChangeAmount { get; set; }

    public List<OrderItem> Items { get; set; } = new();
}
