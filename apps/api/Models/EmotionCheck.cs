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
    
    // New enhanced fields
    [MaxLength(20)]
    public string? PrimaryEmotion { get; set; }
    
    [Range(1, 5)]
    public int? Intensity { get; set; }
    
    [MaxLength(100)]
    public string? MarketConditions { get; set; }
    
    public Guid? SessionId { get; set; }
    
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

public static class PrimaryEmotion
{
    public const string Fear = "fear";
    public const string Greed = "greed";
    public const string Confidence = "confidence";
    public const string Anxiety = "anxiety";
    public const string Excitement = "excitement";
    public const string Frustration = "frustration";
    public const string Calm = "calm";
    public const string Fomo = "fomo";
}
