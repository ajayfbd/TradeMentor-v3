using TradeMentor.Api.Models;

namespace TradeMentor.Api.Services;

/// <summary>
/// Advanced trading pattern analysis service with statistical significance testing and AI-driven insights
/// </summary>
public interface IPatternService
{
    /// <summary>
    /// Calculate correlation between emotion levels and trading performance with statistical analysis
    /// </summary>
    /// <param name="userId">User identifier</param>
    /// <param name="dateRange">Date range for analysis</param>
    /// <returns>Comprehensive correlation analysis with statistical significance</returns>
    Task<EmotionPerformanceCorrelationDto> GetEmotionPerformanceCorrelation(string userId, DateRangeDto dateRange);

    /// <summary>
    /// Generate weekly emotion trend analysis with advanced trend detection algorithms
    /// </summary>
    /// <param name="userId">User identifier</param>
    /// <param name="weeks">Number of weeks to analyze (1-52)</param>
    /// <returns>Weekly trend data with trend direction and volatility analysis</returns>
    Task<List<WeeklyEmotionTrendDto>> GetWeeklyEmotionTrend(string userId, int weeks);

    /// <summary>
    /// Generate personalized insights using machine learning-like pattern recognition
    /// </summary>
    /// <param name="userId">User identifier</param>
    /// <returns>Personalized insights with priority classification and actionable recommendations</returns>
    Task<PersonalizedInsightsDto> GetKeyInsights(string userId);

    /// <summary>
    /// Identify optimal trading conditions using multi-factor analysis and optimization algorithms
    /// </summary>
    /// <param name="userId">User identifier</param>
    /// <returns>Comprehensive analysis of optimal trading conditions and emotional readiness</returns>
    Task<OptimalTradingConditionsDto> GetBestTradingConditions(string userId);

    // Legacy methods for backwards compatibility (to be deprecated)
    Task<ApiResponse<List<EmotionPerformanceDataDto>>> GetEmotionPerformanceDataAsync(string userId, string dateRange);
    Task<ApiResponse<List<WeeklyTrendDataDto>>> GetWeeklyTrendDataAsync(string userId, string dateRange);
    Task<ApiResponse<PatternInsightDto>> GetPatternInsightsAsync(string userId, string dateRange);
}
