using System.ComponentModel.DataAnnotations;

namespace BrewBlissCoffee.Models;

public class Drink
{
    public int DrinkId { get; set; }

    [Required, MaxLength(100)]
    public string DrinkName { get; set; } = string.Empty;

    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;

    [Range(typeof(decimal), "0.01", "100000")]
    public decimal Price { get; set; }

    public bool IsAvailable { get; set; } = true;
}
