using System.ComponentModel.DataAnnotations;

namespace api.Models;

public class Trade
{
    public Guid Id { get; set; }
    
    [Required]
    public Guid UserId { get; set; }
    
    [Required]
    [MaxLength(10)]
    public string Symbol { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(10)]
    public string Type { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(20)]
    public string Outcome { get; set; } = string.Empty;
    
    public decimal? Pnl { get; set; }
    
    public Guid? EmotionCheckId { get; set; }
    
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public User User { get; set; } = null!;
    public EmotionCheck? EmotionCheck { get; set; }
}

public static class TradeType
{
    public const string Buy = "buy";
    public const string Sell = "sell";
}

public static class TradeOutcome
{
    public const string Win = "win";
    public const string Loss = "loss";
    public const string Breakeven = "breakeven";
}
