using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TradeMentor.Api.Models;
using TradeMentor.Api.Services;

namespace TradeMentor.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class PatternController : ControllerBase
{
    private readonly IPatternService _patternService;
    private readonly ILogger<PatternController> _logger;

    public PatternController(IPatternService patternService, ILogger<PatternController> logger)
    {
        _patternService = patternService;
        _logger = logger;
    }

    /// <summary>
    /// Get emotion-performance correlation analysis with statistical significance testing
    /// </summary>
    [HttpGet("correlation")]
    public async Task<ActionResult<ApiResponse<EmotionPerformanceCorrelationDto>>> GetEmotionPerformanceCorrelation(
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        [FromQuery] string period = "30d")
    {
        try
        {
            var userId = GetCurrentUserId();

            var dateRange = new DateRangeDto
            {
                StartDate = startDate ?? DateTime.UtcNow.AddDays(-30),
                EndDate = endDate ?? DateTime.UtcNow,
                Period = period
            };

            var correlation = await _patternService.GetEmotionPerformanceCorrelation(userId, dateRange);

            _logger.LogInformation("Generated correlation analysis for user {UserId}, correlation: {Correlation}, significant: {IsSignificant}",
                userId, correlation.CorrelationCoefficient, correlation.IsStatisticallySignificant);

            return Ok(ApiResponse<EmotionPerformanceCorrelationDto>.SuccessResponse(correlation));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting emotion-performance correlation");
            return StatusCode(500, ApiResponse<EmotionPerformanceCorrelationDto>.ErrorResponse(
                "An error occurred while analyzing emotion-performance correlation"));
        }
    }

    /// <summary>
    /// Get weekly emotion trend analysis with advanced trend detection
    /// </summary>
    [HttpGet("weekly-trend")]
    public async Task<ActionResult<ApiResponse<List<WeeklyEmotionTrendDto>>>> GetWeeklyEmotionTrend(
        [FromQuery] int weeks = 12)
    {
        try
        {
            var userId = GetCurrentUserId();

            if (weeks < 1) weeks = 4;
            if (weeks > 52) weeks = 52; // Limit to 1 year

            var trends = await _patternService.GetWeeklyEmotionTrend(userId, weeks);

            _logger.LogInformation("Generated weekly trend analysis for user {UserId}, {Weeks} weeks",
                userId, weeks);

            return Ok(ApiResponse<List<WeeklyEmotionTrendDto>>.SuccessResponse(trends));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting weekly emotion trend");
            return StatusCode(500, ApiResponse<List<WeeklyEmotionTrendDto>>.ErrorResponse(
                "An error occurred while analyzing weekly emotion trends"));
        }
    }

    /// <summary>
    /// Get personalized insights using advanced analytics and pattern recognition
    /// </summary>
    [HttpGet("insights")]
    public async Task<ActionResult<ApiResponse<PersonalizedInsightsDto>>> GetKeyInsights()
    {
        try
        {
            var userId = GetCurrentUserId();

            var insights = await _patternService.GetKeyInsights(userId);

            _logger.LogInformation("Generated {Count} personalized insights for user {UserId}",
                insights.Insights.Count, userId);

            return Ok(ApiResponse<PersonalizedInsightsDto>.SuccessResponse(insights));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating personalized insights");
            return StatusCode(500, ApiResponse<PersonalizedInsightsDto>.ErrorResponse(
                "An error occurred while generating personalized insights"));
        }
    }

    /// <summary>
    /// Get optimal trading conditions analysis with multi-factor optimization
    /// </summary>
    [HttpGet("optimal-conditions")]
    public async Task<ActionResult<ApiResponse<OptimalTradingConditionsDto>>> GetBestTradingConditions()
    {
        try
        {
            var userId = GetCurrentUserId();

            var conditions = await _patternService.GetBestTradingConditions(userId);

            _logger.LogInformation("Generated optimal trading conditions for user {UserId}, optimization score: {Score}",
                userId, conditions.OverallOptimizationScore);

            return Ok(ApiResponse<OptimalTradingConditionsDto>.SuccessResponse(conditions));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error analyzing optimal trading conditions");
            return StatusCode(500, ApiResponse<OptimalTradingConditionsDto>.ErrorResponse(
                "An error occurred while analyzing optimal trading conditions"));
        }
    }

    /// <summary>
    /// Get comprehensive pattern analysis dashboard data
    /// </summary>
    [HttpGet("dashboard")]
    public async Task<ActionResult<ApiResponse<object>>> GetPatternDashboard(
        [FromQuery] string period = "30d")
    {
        try
        {
            var userId = GetCurrentUserId();

            // Get all pattern data for dashboard
            var dateRange = new DateRangeDto
            {
                StartDate = period switch
                {
                    "7d" => DateTime.UtcNow.AddDays(-7),
                    "30d" => DateTime.UtcNow.AddDays(-30),
                    "90d" => DateTime.UtcNow.AddDays(-90),
                    "1y" => DateTime.UtcNow.AddYears(-1),
                    _ => DateTime.UtcNow.AddDays(-30)
                },
                EndDate = DateTime.UtcNow,
                Period = period
            };

            var weeks = period switch
            {
                "7d" => 2,
                "30d" => 5,
                "90d" => 13,
                "1y" => 52,
                _ => 5
            };

            // Gather all analytics in parallel for better performance
            var correlationTask = _patternService.GetEmotionPerformanceCorrelation(userId, dateRange);
            var trendsTask = _patternService.GetWeeklyEmotionTrend(userId, weeks);
            var insightsTask = _patternService.GetKeyInsights(userId);
            var conditionsTask = _patternService.GetBestTradingConditions(userId);

            await Task.WhenAll(correlationTask, trendsTask, insightsTask, conditionsTask);

            var dashboard = new
            {
                Period = period,
                GeneratedAt = DateTime.UtcNow,
                Correlation = await correlationTask,
                WeeklyTrends = await trendsTask,
                Insights = await insightsTask,
                OptimalConditions = await conditionsTask,
                Summary = new
                {
                    TotalInsights = (await insightsTask).Insights.Count,
                    HighPriorityInsights = (await insightsTask).Insights.Count(i => i.Priority == InsightPriority.High),
                    CorrelationStrength = (await correlationTask).Insights.CorrelationStrength,
                    OptimizationScore = (await conditionsTask).OverallOptimizationScore,
                    RecentTrendDirection = (await trendsTask).LastOrDefault()?.TrendDirection.ToString() ?? "Unknown"
                }
            };

            _logger.LogInformation("Generated complete pattern dashboard for user {UserId}, period: {Period}",
                userId, period);

            return Ok(ApiResponse<object>.SuccessResponse(dashboard));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating pattern dashboard");
            return StatusCode(500, ApiResponse<object>.ErrorResponse(
                "An error occurred while generating the pattern dashboard"));
        }
    }

    /// <summary>
    /// Get emotion level performance breakdown
    /// </summary>
    [HttpGet("emotion-performance")]
    public async Task<ActionResult<ApiResponse<List<EmotionLevelPerformanceDto>>>> GetEmotionLevelPerformance(
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        try
        {
            var userId = GetCurrentUserId();

            var dateRange = new DateRangeDto
            {
                StartDate = startDate ?? DateTime.UtcNow.AddDays(-90),
                EndDate = endDate ?? DateTime.UtcNow,
                Period = "custom"
            };

            var correlation = await _patternService.GetEmotionPerformanceCorrelation(userId, dateRange);

            _logger.LogInformation("Generated emotion level performance for user {UserId}",
                userId);

            return Ok(ApiResponse<List<EmotionLevelPerformanceDto>>.SuccessResponse(correlation.EmotionLevels));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting emotion level performance");
            return StatusCode(500, ApiResponse<List<EmotionLevelPerformanceDto>>.ErrorResponse(
                "An error occurred while analyzing emotion level performance"));
        }
    }

    /// <summary>
    /// Get trading recommendations based on current emotional state
    /// </summary>
    [HttpGet("recommendations")]
    public async Task<ActionResult<ApiResponse<object>>> GetTradingRecommendations(
        [FromQuery] int currentEmotionLevel = 5)
    {
        try
        {
            var userId = GetCurrentUserId();

            var insights = await _patternService.GetKeyInsights(userId);
            var conditions = await _patternService.GetBestTradingConditions(userId);

            // Determine readiness based on current emotion level
            var emotionalReadiness = conditions.EmotionalReadiness;
            var isOptimal = currentEmotionLevel >= emotionalReadiness.OptimalEmotionRange[0] && 
                           currentEmotionLevel <= emotionalReadiness.OptimalEmotionRange[1];
            var isCaution = currentEmotionLevel >= emotionalReadiness.CautionEmotionRange[0] && 
                           currentEmotionLevel <= emotionalReadiness.CautionEmotionRange[1];
            var shouldAvoid = currentEmotionLevel >= emotionalReadiness.AvoidEmotionRange[0] && 
                             currentEmotionLevel <= emotionalReadiness.AvoidEmotionRange[1];

            var recommendation = new
            {
                CurrentEmotionLevel = currentEmotionLevel,
                ReadinessLevel = isOptimal ? "Optimal" : (isCaution ? "Caution" : (shouldAvoid ? "Avoid" : "Neutral")),
                ShouldTrade = isOptimal,
                RiskLevel = shouldAvoid ? "High" : (isCaution ? "Medium" : "Low"),
                Recommendations = insights.Recommendations.Where(r => r.Priority <= 3).ToList(),
                OptimalConditions = conditions.BestConditions.Take(3).ToList(),
                ConditionsToAvoid = conditions.ConditionsToAvoid.Take(3).ToList(),
                MarketTiming = conditions.BestMarketTiming,
                ConfidenceScore = conditions.OverallOptimizationScore
            };

            _logger.LogInformation("Generated trading recommendations for user {UserId}, emotion level: {Level}, readiness: {Readiness}",
                userId, currentEmotionLevel, recommendation.ReadinessLevel);

            return Ok(ApiResponse<object>.SuccessResponse(recommendation));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating trading recommendations");
            return StatusCode(500, ApiResponse<object>.ErrorResponse(
                "An error occurred while generating trading recommendations"));
        }
    }

    private string GetCurrentUserId()
    {
        return User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
            ?? User.FindFirst("userId")?.Value 
            ?? throw new UnauthorizedAccessException("User ID not found in token");
    }
}
