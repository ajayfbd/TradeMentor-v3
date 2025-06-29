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

// Enhanced Pattern Analysis DTOs
public class DateRangeDto
{
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string Period { get; set; } = string.Empty; // "7d", "30d", "90d", "1y", "custom"
}

public class EmotionPerformanceCorrelationDto
{
    public double CorrelationCoefficient { get; set; }
    public double PValue { get; set; }
    public bool IsStatisticallySignificant { get; set; }
    public List<EmotionLevelPerformanceDto> EmotionLevels { get; set; } = new();
    public Dictionary<int, WinRateStatsDto> WinRateByLevel { get; set; } = new();
    public CorrelationInsightsDto Insights { get; set; } = new();
    public int SampleSize { get; set; }
    public string AnalysisPeriod { get; set; } = string.Empty;
}

public class EmotionLevelPerformanceDto
{
    public int EmotionLevel { get; set; }
    public double AverageReturn { get; set; }
    public double WinRate { get; set; }
    public int TradeCount { get; set; }
    public double StandardDeviation { get; set; }
    public double SharpeRatio { get; set; }
    public double MaxDrawdown { get; set; }
    public double ProfitFactor { get; set; }
}

public class WinRateStatsDto
{
    public double WinRate { get; set; }
    public int TotalTrades { get; set; }
    public int WinningTrades { get; set; }
    public int LosingTrades { get; set; }
    public double AverageWin { get; set; }
    public double AverageLoss { get; set; }
    public double ConfidenceInterval { get; set; }
}

public class CorrelationInsightsDto
{
    public string CorrelationStrength { get; set; } = string.Empty; // "Strong", "Moderate", "Weak", "None"
    public string Recommendation { get; set; } = string.Empty;
    public List<string> KeyFindings { get; set; } = new();
    public int[] OptimalEmotionRange { get; set; } = new int[2];
    public int[] AvoidEmotionRange { get; set; } = new int[2];
}

public class WeeklyEmotionTrendDto
{
    public DateTime WeekStartDate { get; set; }
    public DateTime WeekEndDate { get; set; }
    public string WeekLabel { get; set; } = string.Empty;
    public double AverageEmotionLevel { get; set; }
    public double EmotionVolatility { get; set; }
    public double WinRate { get; set; }
    public double AverageReturn { get; set; }
    public int TotalTrades { get; set; }
    public int EmotionChecks { get; set; }
    public TrendDirection TrendDirection { get; set; }
    public double TrendStrength { get; set; }
    public List<DailyEmotionDataDto> DailyBreakdown { get; set; } = new();
}

public class DailyEmotionDataDto
{
    public DateTime Date { get; set; }
    public double AverageEmotion { get; set; }
    public int CheckCount { get; set; }
    public double? TradePerformance { get; set; }
}

public enum TrendDirection
{
    Improving,
    Declining,
    Stable,
    Volatile
}

public class PersonalizedInsightsDto
{
    public List<PersonalizedInsightDto> Insights { get; set; } = new();
    public EmotionalTradingProfileDto TradingProfile { get; set; } = new();
    public List<ActionableRecommendationDto> Recommendations { get; set; } = new();
    public RiskAssessmentDto RiskAssessment { get; set; } = new();
    public ProgressMetricsDto Progress { get; set; } = new();
    public DateTime GeneratedAt { get; set; }
    public string AnalysisPeriod { get; set; } = string.Empty;
}

public class PersonalizedInsightDto
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public InsightType Type { get; set; }
    public InsightPriority Priority { get; set; }
    public double Impact { get; set; }
    public double Confidence { get; set; }
    public List<string> SupportingData { get; set; } = new();
    public string Category { get; set; } = string.Empty;
}

public enum InsightType
{
    Positive,
    Warning,
    Opportunity,
    Pattern,
    Recommendation
}

public enum InsightPriority
{
    Low,
    Medium,
    High,
    Critical
}

public class EmotionalTradingProfileDto
{
    public string ProfileType { get; set; } = string.Empty; // "Conservative", "Aggressive", "Balanced", "Emotional"
    public double EmotionalStability { get; set; }
    public double RiskTolerance { get; set; }
    public double PressureHandling { get; set; }
    public double ConsistencyScore { get; set; }
    public List<string> Strengths { get; set; } = new();
    public List<string> WeakAreas { get; set; } = new();
    public Dictionary<string, double> TraitScores { get; set; } = new();
}

public class ActionableRecommendationDto
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public double ExpectedImpact { get; set; }
    public string Timeframe { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public int Priority { get; set; }
}

public class RiskAssessmentDto
{
    public string RiskLevel { get; set; } = string.Empty; // "Low", "Medium", "High", "Very High"
    public double RiskScore { get; set; }
    public List<string> RiskFactors { get; set; } = new();
    public List<string> ProtectiveFactors { get; set; } = new();
    public double EmotionalRiskTolerance { get; set; }
    public string RecommendedPositionSizing { get; set; } = string.Empty;
}

public class ProgressMetricsDto
{
    public double EmotionStabilityTrend { get; set; }
    public double PerformanceImprovement { get; set; }
    public double ConsistencyImprovement { get; set; }
    public int DaysAnalyzed { get; set; }
    public DateTime FirstTradeDate { get; set; }
    public Dictionary<string, double> MonthlyProgress { get; set; } = new();
}

public class OptimalTradingConditionsDto
{
    public List<OptimalConditionDto> BestConditions { get; set; } = new();
    public List<ConditionToAvoidDto> ConditionsToAvoid { get; set; } = new();
    public MarketTimingDto BestMarketTiming { get; set; } = new();
    public EmotionalReadinessDto EmotionalReadiness { get; set; } = new();
    public EnvironmentalFactorsDto EnvironmentalFactors { get; set; } = new();
    public double OverallOptimizationScore { get; set; }
    public DateTime LastUpdated { get; set; }
}

public class OptimalConditionDto
{
    public string ConditionName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public double WinRate { get; set; }
    public double AverageReturn { get; set; }
    public int TradeCount { get; set; }
    public double Confidence { get; set; }
    public Dictionary<string, object> Parameters { get; set; } = new();
}

public class ConditionToAvoidDto
{
    public string ConditionName { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public double WinRate { get; set; }
    public double AverageReturn { get; set; }
    public int TradeCount { get; set; }
    public string Severity { get; set; } = string.Empty; // "Mild", "Moderate", "Severe"
}

public class MarketTimingDto
{
    public List<string> BestDaysOfWeek { get; set; } = new();
    public List<string> BestHoursOfDay { get; set; } = new();
    public List<string> BestMonths { get; set; } = new();
    public Dictionary<string, double> DayPerformance { get; set; } = new();
    public Dictionary<string, double> HourPerformance { get; set; } = new();
}

public class EmotionalReadinessDto
{
    public int[] OptimalEmotionRange { get; set; } = new int[2];
    public int[] CautionEmotionRange { get; set; } = new int[2];
    public int[] AvoidEmotionRange { get; set; } = new int[2];
    public List<EmotionalStateDto> EmotionalStates { get; set; } = new();
    public string CurrentReadinessLevel { get; set; } = string.Empty;
}

public class EmotionalStateDto
{
    public string StateName { get; set; } = string.Empty;
    public int EmotionLevel { get; set; }
    public double PerformanceMultiplier { get; set; }
    public string Recommendation { get; set; } = string.Empty;
}

public class EnvironmentalFactorsDto
{
    public Dictionary<string, double> SymbolPerformance { get; set; } = new();
    public Dictionary<string, double> MarketConditionPerformance { get; set; } = new();
    public Dictionary<string, double> VolatilityPerformance { get; set; } = new();
    public List<string> FavorableMarketConditions { get; set; } = new();
    public List<string> ChallengingMarketConditions { get; set; } = new();
}
