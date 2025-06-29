using System.ComponentModel.DataAnnotations;

namespace api.DTOs;

public class TradeRequestDto
{
    [Required]
    [MaxLength(10)]
    public string Symbol { get; set; } = string.Empty;
    
    [Required]
    public string Type { get; set; } = string.Empty;
    
    [Required]
    public string Outcome { get; set; } = string.Empty;
    
    public decimal? Pnl { get; set; }
    
    public Guid? EmotionCheckId { get; set; }
}

public class TradeResponseDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Symbol { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Outcome { get; set; } = string.Empty;
    public decimal? Pnl { get; set; }
    public Guid? EmotionCheckId { get; set; }
    public DateTime Timestamp { get; set; }
    public DateTime CreatedAt { get; set; }
    public int? EmotionLevel { get; set; }
}
