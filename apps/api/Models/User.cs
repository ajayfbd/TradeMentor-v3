using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;

namespace TradeMentor.Api.Models;

public class User : IdentityUser
{
    [MaxLength(100)]
    public string? FirstName { get; set; }
    
    [MaxLength(100)]
    public string? LastName { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; set; }
    
    [MaxLength(50)]
    public string Timezone { get; set; } = "UTC";
    
    public int StreakCount { get; set; } = 0;
    public DateOnly? LastCheckDate { get; set; }
    public DateTime? LastEmotionCheckAt { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public virtual ICollection<EmotionCheck> EmotionChecks { get; set; } = new List<EmotionCheck>();
    public virtual ICollection<Trade> Trades { get; set; } = new List<Trade>();
}
