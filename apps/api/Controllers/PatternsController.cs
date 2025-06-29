using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using api.Services;
using api.DTOs;

namespace api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PatternsController : ControllerBase
    {
        private readonly IPatternService _patternService;

        public PatternsController(IPatternService patternService)
        {
            _patternService = patternService;
        }

        private Guid GetUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.Parse(userIdClaim ?? Guid.Empty.ToString());
        }

        [HttpGet("analysis")]
        public async Task<ActionResult<PatternAnalysisDto>> GetPatternAnalysis(
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            try
            {
                var userId = GetUserId();
                if (userId == Guid.Empty)
                    return Unauthorized("Invalid user token");

                var emotionPatterns = await _patternService.GetEmotionPatternsAsync(userId, startDate, endDate);
                var performanceCorrelation = await _patternService.GetPerformanceCorrelationAsync(userId, startDate, endDate);
                var weeklyTrends = await _patternService.GetWeeklyTrendsAsync(userId);
                var emotionDistribution = await _patternService.GetEmotionDistributionAsync(userId, startDate, endDate);

                var analysis = new PatternAnalysisDto
                {
                    EmotionPatterns = emotionPatterns,
                    PerformanceCorrelation = performanceCorrelation,
                    WeeklyTrends = weeklyTrends,
                    EmotionDistribution = emotionDistribution
                };

                return Ok(analysis);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving pattern analysis", error = ex.Message });
            }
        }

        [HttpGet("emotion-patterns")]
        public async Task<ActionResult<EmotionPatternDto>> GetEmotionPatterns(
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            try
            {
                var userId = GetUserId();
                if (userId == Guid.Empty)
                    return Unauthorized("Invalid user token");

                var patterns = await _patternService.GetEmotionPatternsAsync(userId, startDate, endDate);
                return Ok(patterns);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving emotion patterns", error = ex.Message });
            }
        }

        [HttpGet("performance-correlation")]
        public async Task<ActionResult<PerformanceCorrelationDto>> GetPerformanceCorrelation(
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            try
            {
                var userId = GetUserId();
                if (userId == Guid.Empty)
                    return Unauthorized("Invalid user token");

                var correlation = await _patternService.GetPerformanceCorrelationAsync(userId, startDate, endDate);
                return Ok(correlation);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving performance correlation", error = ex.Message });
            }
        }

        [HttpGet("weekly-trends")]
        public async Task<ActionResult<List<WeeklyTrendDto>>> GetWeeklyTrends(
            [FromQuery] int weeks = 4)
        {
            try
            {
                var userId = GetUserId();
                if (userId == Guid.Empty)
                    return Unauthorized("Invalid user token");

                if (weeks < 1 || weeks > 52)
                    return BadRequest("Weeks must be between 1 and 52");

                var trends = await _patternService.GetWeeklyTrendsAsync(userId, weeks);
                return Ok(trends);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving weekly trends", error = ex.Message });
            }
        }

        [HttpGet("emotion-distribution")]
        public async Task<ActionResult<List<EmotionDistributionDto>>> GetEmotionDistribution(
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            try
            {
                var userId = GetUserId();
                if (userId == Guid.Empty)
                    return Unauthorized("Invalid user token");

                var distribution = await _patternService.GetEmotionDistributionAsync(userId, startDate, endDate);
                return Ok(distribution);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving emotion distribution", error = ex.Message });
            }
        }

        [HttpGet("insights")]
        public async Task<ActionResult<object>> GetInsights()
        {
            try
            {
                var userId = GetUserId();
                if (userId == Guid.Empty)
                    return Unauthorized("Invalid user token");

                // Get data for the last 30 days
                var endDate = DateTime.UtcNow;
                var startDate = endDate.AddDays(-30);

                var emotionPatterns = await _patternService.GetEmotionPatternsAsync(userId, startDate, endDate);
                var performanceCorrelation = await _patternService.GetPerformanceCorrelationAsync(userId, startDate, endDate);

                // Generate insights based on the data
                var insights = GenerateInsights(emotionPatterns, performanceCorrelation);

                return Ok(new { insights });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error generating insights", error = ex.Message });
            }
        }

        private List<string> GenerateInsights(EmotionPatternDto patterns, PerformanceCorrelationDto correlation)
        {
            var insights = new List<string>();

            // Emotion volatility insights
            if (patterns.EmotionVolatility > 2.5)
            {
                insights.Add("Your emotional state shows high volatility. Consider implementing calming techniques before trading.");
            }
            else if (patterns.EmotionVolatility < 1)
            {
                insights.Add("Your emotions are quite stable, which is excellent for consistent trading performance.");
            }

            // Average emotion insights
            if (patterns.AverageEmotion < 4)
            {
                insights.Add("Your average emotional state is quite low. Consider taking breaks or implementing stress management techniques.");
            }
            else if (patterns.AverageEmotion > 7)
            {
                insights.Add("You're maintaining a high emotional state - great for confident trading decisions!");
            }

            // Performance correlation insights
            if (correlation.WinRateByEmotion.Any())
            {
                var bestEmotionLevel = correlation.WinRateByEmotion.OrderByDescending(kvp => kvp.Value).First();
                var worstEmotionLevel = correlation.WinRateByEmotion.OrderBy(kvp => kvp.Value).First();

                if (bestEmotionLevel.Value > worstEmotionLevel.Value + 20)
                {
                    insights.Add($"You perform significantly better when your emotion level is {bestEmotionLevel.Key} (win rate: {bestEmotionLevel.Value:F1}%).");
                }

                if (correlation.AvgPnlByEmotion.Any())
                {
                    var mostProfitableEmotion = correlation.AvgPnlByEmotion.OrderByDescending(kvp => kvp.Value).First();
                    insights.Add($"Your most profitable trades occur at emotion level {mostProfitableEmotion.Key} with average P&L of ${mostProfitableEmotion.Value:F2}.");
                }
            }

            // Add default insight if no specific insights found
            if (!insights.Any())
            {
                insights.Add("Keep tracking your emotions to build more insights about your trading patterns!");
            }

            return insights;
        }
    }
}
