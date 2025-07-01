using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace TradeMentor.Api.Models;

public class UserInsight
{
    public Guid Id { get; set; }
    
    [Required]
    public string UserId { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(50)]
    public string InsightType { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;
    
    [Required]
    public string Description { get; set; } = string.Empty;
    
    [Column(TypeName = "jsonb")]
    public JsonDocument? Data { get; set; }
    
    [Column(TypeName = "decimal(3,2)")]
    [Range(0, 10)]
    public decimal ConfidenceScore { get; set; }
    
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
    
    public bool IsActive { get; set; } = true;
    
    // Navigation properties
    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;
}

public static class UserInsightType
{
    public const string PerformanceCorrelation = "performance_correlation";
    public const string BestTimes = "best_times";
    public const string EmotionPattern = "emotion_pattern";
    public const string StreakMilestone = "streak_milestone";
}
