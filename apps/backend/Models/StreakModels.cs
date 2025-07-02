using System.ComponentModel.DataAnnotations;

namespace TradeMentor.Models
{
    public class UserSession
    {
        [Key]
        public Guid Id { get; set; }
        
        public Guid UserId { get; set; }
        public virtual User User { get; set; }
        
        public DateTime Date { get; set; }
        public int EmotionsLogged { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
    
    public class UserProfile
    {
        [Key]
        public Guid Id { get; set; }
        
        public Guid UserId { get; set; }
        public virtual User User { get; set; }
        
        public int LongestStreak { get; set; } = 0;
        public string PreferredLanguage { get; set; } = "en";
        public string NotificationSettings { get; set; } = "{}"; // JSON string
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
    
    public class UserInsight
    {
        [Key]
        public Guid Id { get; set; }
        
        public Guid UserId { get; set; }
        public virtual User User { get; set; }
        
        public string InsightType { get; set; } // "streak_milestone", "pattern", "warning", etc.
        public string Title { get; set; }
        public string Description { get; set; }
        public decimal ConfidenceScore { get; set; }
        public bool IsActive { get; set; } = true;
        public bool IsRead { get; set; } = false;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
