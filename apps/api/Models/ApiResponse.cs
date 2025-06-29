using System.ComponentModel.DataAnnotations;

namespace TradeMentor.Api.Models;

public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public T? Data { get; set; }
    public List<string> Errors { get; set; } = new();
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public static ApiResponse<T> SuccessResponse(T data, string message = "Success")
    {
        return new ApiResponse<T>
        {
            Success = true,
            Message = message,
            Data = data
        };
    }

    public static ApiResponse<T> ErrorResponse(string message, List<string>? errors = null)
    {
        return new ApiResponse<T>
        {
            Success = false,
            Message = message,
            Errors = errors ?? new List<string>()
        };
    }

    public static ApiResponse<T> ErrorResponse(List<string> errors)
    {
        return new ApiResponse<T>
        {
            Success = false,
            Message = "Validation failed",
            Errors = errors
        };
    }
}

public class ApiResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<string> Errors { get; set; } = new();
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public static ApiResponse SuccessResponse(string message = "Success")
    {
        return new ApiResponse
        {
            Success = true,
            Message = message
        };
    }

    public static ApiResponse ErrorResponse(string message, List<string>? errors = null)
    {
        return new ApiResponse
        {
            Success = false,
            Message = message,
            Errors = errors ?? new List<string>()
        };
    }
}

// DTOs for requests and responses
public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class RegisterRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
}

public class LoginResponse
{
    public string Token { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public UserDto User { get; set; } = null!;
}

public class UserDto
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public int StreakCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
}

public class EmotionCheckRequest
{
    public int Level { get; set; }
    public string Context { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public string? Symbol { get; set; }
}

public class EmotionCheckDto
{
    public Guid Id { get; set; }
    
    [Required(ErrorMessage = "Emotion level is required")]
    [Range(1, 10, ErrorMessage = "Emotion level must be between 1 and 10")]
    public int Level { get; set; }

    [Required(ErrorMessage = "Context is required")]
    [StringLength(20, ErrorMessage = "Context must not exceed 20 characters")]
    public required string Context { get; set; }

    [StringLength(10, ErrorMessage = "Symbol must not exceed 10 characters")]
    public string? Symbol { get; set; }

    [StringLength(1000, ErrorMessage = "Notes must not exceed 1000 characters")]
    public string? Notes { get; set; }

    public DateTime? Timestamp { get; set; }
}

public class EmotionResponseDto
{
    public Guid Id { get; set; }
    public int Level { get; set; }
    public string Context { get; set; } = string.Empty;
    public string? Symbol { get; set; }
    public string? Notes { get; set; }
    public DateTime Timestamp { get; set; }
    public DateTime CreatedAt { get; set; }
    public string UserId { get; set; } = string.Empty;
}

public class EmotionStatsDto
{
    public double AverageLevel { get; set; }
    public int TotalChecks { get; set; }
    public int WeeklyChecks { get; set; }
    public int MonthlyChecks { get; set; }
    public double WeeklyAverage { get; set; }
    public double MonthlyAverage { get; set; }
    public int StreakDays { get; set; }
    public EmotionResponseDto? LatestCheck { get; set; }
    public List<EmotionTrendDto> WeeklyTrend { get; set; } = new();
    public Dictionary<string, int> ContextDistribution { get; set; } = new();
}

public class EmotionTrendDto
{
    public DateTime Date { get; set; }
    public double AverageLevel { get; set; }
    public int CheckCount { get; set; }
}

public class TradeRequest
{
    public string Symbol { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Outcome { get; set; } = string.Empty;
    public decimal? Pnl { get; set; }
    public decimal? EntryPrice { get; set; }
    public decimal? ExitPrice { get; set; }
    public int? Quantity { get; set; }
    public Guid? EmotionCheckId { get; set; }
    public DateTime? EntryTime { get; set; }
    public DateTime? ExitTime { get; set; }
}

public class TradeDto
{
    public Guid Id { get; set; }
    public string Symbol { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Outcome { get; set; } = string.Empty;
    public decimal? Pnl { get; set; }
    public decimal? EntryPrice { get; set; }
    public decimal? ExitPrice { get; set; }
    public int? Quantity { get; set; }
    public DateTime EntryTime { get; set; }
    public DateTime? ExitTime { get; set; }
    public EmotionCheckDto? EmotionCheck { get; set; }
}

public class PatternInsightDto
{
    public double HighEmotionWinRate { get; set; }
    public List<string> BestTradingDays { get; set; } = new();
    public int AnxietyThreshold { get; set; }
    public int[] OptimalEmotionRange { get; set; } = new int[2];
    public double CorrelationStrength { get; set; }
    public int TotalPatterns { get; set; }
}

public class EmotionPerformanceDataDto
{
    public int EmotionLevel { get; set; }
    public double TradeOutcome { get; set; }
    public string TradeType { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public string? Symbol { get; set; }
    public double Size { get; set; }
}

public class WeeklyTrendDataDto
{
    public string Week { get; set; } = string.Empty;
    public double AvgEmotion { get; set; }
    public double WinRate { get; set; }
    public int TotalTrades { get; set; }
    public double AvgReturn { get; set; }
}

// Authentication DTOs
public class RegisterRequestDto
{
    public required string Email { get; set; }
    public required string Password { get; set; }
    public string? Timezone { get; set; } = "UTC";
}

public class LoginRequestDto
{
    public required string Email { get; set; }
    public required string Password { get; set; }
}

public class LoginResponseDto
{
    public required string Token { get; set; }
    public required UserDto User { get; set; }
}
