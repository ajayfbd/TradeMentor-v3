using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TradeMentor.Api.Models;

public class UserSession
{
    public Guid Id { get; set; }
    
    [Required]
    public string UserId { get; set; } = string.Empty;
    
    [Required]
    public DateOnly Date { get; set; }
    
    public int EmotionsLogged { get; set; } = 0;
    
    public int TradesLogged { get; set; } = 0;
    
    [Column(TypeName = "decimal(3,2)")]
    [Range(0, 10)]
    public decimal? SessionQualityScore { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;
}
