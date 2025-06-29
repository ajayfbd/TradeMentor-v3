using System.ComponentModel.DataAnnotations;

namespace api.Models;

public class EmotionCheck
{
    public Guid Id { get; set; }
    
    [Required]
    public Guid UserId { get; set; }
    
    [Required]
    [Range(1, 10)]
    public int Level { get; set; }
    
    [Required]
    [MaxLength(20)]
    public string Context { get; set; } = string.Empty;
    
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    
    public string? Notes { get; set; }
    
    [MaxLength(10)]
    public string? Symbol { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public User User { get; set; } = null!;
}

public static class EmotionContext
{
    public const string PreTrade = "pre-trade";
    public const string PostTrade = "post-trade";
    public const string MarketEvent = "market-event";
}
