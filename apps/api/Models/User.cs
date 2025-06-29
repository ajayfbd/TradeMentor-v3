using System.ComponentModel.DataAnnotations;

namespace api.Models;

public class User
{
    public Guid Id { get; set; }
    
    [Required]
    [EmailAddress]
    [MaxLength(255)]
    public string Email { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(255)]
    public string PasswordHash { get; set; } = string.Empty;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    [MaxLength(50)]
    public string Timezone { get; set; } = "UTC";
    
    public int StreakCount { get; set; } = 0;
    
    public DateOnly? LastCheckDate { get; set; }
    
    public bool IsActive { get; set; } = true;
    
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<EmotionCheck> EmotionChecks { get; set; } = new List<EmotionCheck>();
    public ICollection<Trade> Trades { get; set; } = new List<Trade>();
}
