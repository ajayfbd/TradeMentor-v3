using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TradeMentor.Api.Models;

public class Trade
{
    public Guid Id { get; set; }
    
    [Required]
    public string UserId { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(10)]
    public string Symbol { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(10)]
    public string Type { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(20)]
    public string Outcome { get; set; } = string.Empty;
    
    [Column(TypeName = "decimal(18,2)")]
    public decimal? Pnl { get; set; }
    
    [Column(TypeName = "decimal(18,2)")]
    public decimal? EntryPrice { get; set; }
    
    [Column(TypeName = "decimal(18,2)")]
    public decimal? ExitPrice { get; set; }
    
    public int? Quantity { get; set; }
    
    public Guid? EmotionCheckId { get; set; }
    
    // New enhanced fields
    [Range(1, 5)]
    public int? SetupQuality { get; set; }
    
    [Range(1, 5)]
    public int? ExecutionQuality { get; set; }
    
    public DateTime EntryTime { get; set; } = DateTime.UtcNow;
    public DateTime? ExitTime { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;
    
    [ForeignKey("EmotionCheckId")]
    public virtual EmotionCheck? EmotionCheck { get; set; }
}

public static class TradeType
{
    public const string Buy = "buy";
    public const string Sell = "sell";
    public const string Long = "long";
    public const string Short = "short";
}

public static class TradeOutcome
{
    public const string Win = "win";
    public const string Loss = "loss";
    public const string Breakeven = "breakeven";
}
