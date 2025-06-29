using System.ComponentModel.DataAnnotations;

namespace api.DTOs;

public class EmotionCheckRequestDto
{
    [Required]
    [Range(1, 10)]
    public int Level { get; set; }
    
    [Required]
    public string Context { get; set; } = string.Empty;
    
    public string? Notes { get; set; }
    
    [MaxLength(10)]
    public string? Symbol { get; set; }
}

public class EmotionCheckResponseDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public int Level { get; set; }
    public string Context { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public string? Notes { get; set; }
    public string? Symbol { get; set; }
    public DateTime CreatedAt { get; set; }
}
