using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TradeMentor.Api.Models;

public class WeeklyReflection
{
    public Guid Id { get; set; }
    
    [Required]
    public string UserId { get; set; } = string.Empty;
    
    [Required]
    public DateTime WeekStartDate { get; set; }
    
    [Required]
    public DateTime WeekEndDate { get; set; }
    
    [Required]
    [MaxLength(2000)]
    public string Wins { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(2000)]
    public string Losses { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(2000)]
    public string Lessons { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(2000)]
    public string EmotionalInsights { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(2000)]
    public string NextWeekGoals { get; set; } = string.Empty;
    
    [Column(TypeName = "decimal(3,1)")]
    public decimal? AverageEmotionLevel { get; set; }
    
    [Column(TypeName = "decimal(5,2)")]
    public decimal? WinRate { get; set; }
    
    [Column(TypeName = "decimal(18,2)")]
    public decimal? TotalPnL { get; set; }
    
    public int? TotalTrades { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;
}

public class MonthlyGoal
{
    public Guid Id { get; set; }
    
    [Required]
    public string UserId { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(500)]
    public string Goal { get; set; } = string.Empty;
    
    [Range(0, 100)]
    public int Progress { get; set; } = 0;
    
    public bool IsCompleted { get; set; } = false;
    
    [Required]
    public DateTime TargetMonth { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;
}
