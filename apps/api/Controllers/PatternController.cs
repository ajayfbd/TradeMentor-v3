using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TradeMentor.Api.Models;
using TradeMentor.Api.Services;

namespace TradeMentor.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
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
    /// Get emotion vs performance correlation data
    /// </summary>
    [HttpGet("emotion-performance")]
    public async Task<ActionResult<ApiResponse<List<EmotionPerformanceDataDto>>>> GetEmotionPerformanceData(
        [FromQuery] string dateRange = "30d")
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _patternService.GetEmotionPerformanceDataAsync(userId, dateRange);

            return result.Success 
                ? Ok(result) 
                : StatusCode(500, result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting emotion performance data for user {UserId}", GetCurrentUserId());
            return StatusCode(500, ApiResponse<List<EmotionPerformanceDataDto>>.ErrorResponse("Failed to get emotion performance data"));
        }
    }

    /// <summary>
    /// Get weekly trend data showing emotion levels and performance over time
    /// </summary>
    [HttpGet("weekly-trend")]
    public async Task<ActionResult<ApiResponse<List<WeeklyTrendDataDto>>>> GetWeeklyTrendData(
        [FromQuery] string dateRange = "30d")
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _patternService.GetWeeklyTrendDataAsync(userId, dateRange);

            return result.Success 
                ? Ok(result) 
                : StatusCode(500, result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting weekly trend data for user {UserId}", GetCurrentUserId());
            return StatusCode(500, ApiResponse<List<WeeklyTrendDataDto>>.ErrorResponse("Failed to get weekly trend data"));
        }
    }

    /// <summary>
    /// Get AI-generated insights about trading patterns
    /// </summary>
    [HttpGet("insights")]
    public async Task<ActionResult<ApiResponse<PatternInsightDto>>> GetPatternInsights(
        [FromQuery] string dateRange = "30d")
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _patternService.GetPatternInsightsAsync(userId, dateRange);

            return result.Success 
                ? Ok(result) 
                : StatusCode(500, result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting pattern insights for user {UserId}", GetCurrentUserId());
            return StatusCode(500, ApiResponse<PatternInsightDto>.ErrorResponse("Failed to get pattern insights"));
        }
    }

    /// <summary>
    /// Get comprehensive pattern analysis combining all data types
    /// </summary>
    [HttpGet("analysis")]
    public async Task<ActionResult<ApiResponse<object>>> GetPatternAnalysis(
        [FromQuery] string dateRange = "30d")
    {
        try
        {
            var userId = GetCurrentUserId();

            // Get all pattern data in parallel
            var emotionPerformanceTask = _patternService.GetEmotionPerformanceDataAsync(userId, dateRange);
            var weeklyTrendTask = _patternService.GetWeeklyTrendDataAsync(userId, dateRange);
            var insightsTask = _patternService.GetPatternInsightsAsync(userId, dateRange);

            await Task.WhenAll(emotionPerformanceTask, weeklyTrendTask, insightsTask);

            var analysis = new
            {
                EmotionPerformance = emotionPerformanceTask.Result.Data,
                WeeklyTrend = weeklyTrendTask.Result.Data,
                Insights = insightsTask.Result.Data,
                DateRange = dateRange,
                GeneratedAt = DateTime.UtcNow
            };

            return Ok(ApiResponse<object>.SuccessResponse(analysis, "Pattern analysis generated successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting pattern analysis for user {UserId}", GetCurrentUserId());
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to get pattern analysis"));
        }
    }

    /// <summary>
    /// Get emotion distribution data
    /// </summary>
    [HttpGet("emotion-distribution")]
    public async Task<ActionResult<ApiResponse<object>>> GetEmotionDistribution(
        [FromQuery] string dateRange = "30d")
    {
        try
        {
            var userId = GetCurrentUserId();
            
            // This could be implemented as a separate service method
            // For now, we'll return a simplified version
            var emotionData = await _patternService.GetEmotionPerformanceDataAsync(userId, dateRange);
            
            if (!emotionData.Success || emotionData.Data == null)
            {
                return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to get emotion data"));
            }

            var distribution = emotionData.Data
                .GroupBy(e => e.EmotionLevel)
                .Select(g => new
                {
                    EmotionLevel = g.Key,
                    Count = g.Count(),
                    Percentage = Math.Round((double)g.Count() / emotionData.Data.Count * 100, 2),
                    AvgOutcome = Math.Round(g.Average(x => x.TradeOutcome), 2)
                })
                .OrderBy(x => x.EmotionLevel)
                .ToList();

            return Ok(ApiResponse<object>.SuccessResponse(distribution));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting emotion distribution for user {UserId}", GetCurrentUserId());
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to get emotion distribution"));
        }
    }

    /// <summary>
    /// Get performance by day of week
    /// </summary>
    [HttpGet("performance-by-day")]
    public async Task<ActionResult<ApiResponse<object>>> GetPerformanceByDay(
        [FromQuery] string dateRange = "30d")
    {
        try
        {
            var userId = GetCurrentUserId();
            var emotionData = await _patternService.GetEmotionPerformanceDataAsync(userId, dateRange);
            
            if (!emotionData.Success || emotionData.Data == null)
            {
                return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to get emotion data"));
            }

            var dayPerformance = emotionData.Data
                .GroupBy(e => e.Date.DayOfWeek)
                .Select(g => new
                {
                    DayOfWeek = g.Key.ToString(),
                    TotalTrades = g.Count(),
                    WinRate = Math.Round((double)g.Count(x => x.TradeType == "win") / g.Count() * 100, 2),
                    AvgReturn = Math.Round(g.Average(x => x.TradeOutcome), 2),
                    AvgEmotion = Math.Round(g.Average(x => x.EmotionLevel), 1)
                })
                .OrderBy(x => (int)Enum.Parse<DayOfWeek>(x.DayOfWeek))
                .ToList();

            return Ok(ApiResponse<object>.SuccessResponse(dayPerformance));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting performance by day for user {UserId}", GetCurrentUserId());
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to get performance by day"));
        }
    }

    private string GetCurrentUserId()
    {
        return User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
            ?? User.FindFirst("userId")?.Value 
            ?? throw new UnauthorizedAccessException("User ID not found in token");
    }
}
