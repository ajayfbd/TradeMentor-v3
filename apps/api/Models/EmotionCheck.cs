using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TradeMentor.Api.Models;

public class EmotionCheck
{
    public Guid Id { get; set; }
    
    [Required]
    public string UserId { get; set; } = string.Empty;
    
    [Required]
    [Range(1, 10)]
    public int Level { get; set; }
    
    [Required]
    [MaxLength(20)]
    public string Context { get; set; } = string.Empty;
    
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    
    [MaxLength(1000)]
    public string? Notes { get; set; }
    
    [MaxLength(10)]
    public string? Symbol { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;
}

public static class EmotionContext
{
    public const string PreTrade = "pre-trade";
    public const string PostTrade = "post-trade";
    public const string MarketEvent = "market-event";
}
