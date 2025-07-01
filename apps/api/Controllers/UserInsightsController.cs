using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TradeMentor.Api.Models;
using TradeMentor.Api.Services;

namespace TradeMentor.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UserInsightsController : ControllerBase
{
    private readonly IUserInsightService _userInsightService;

    public UserInsightsController(IUserInsightService userInsightService)
    {
        _userInsightService = userInsightService;
    }

    private string GetUserId()
    {
        return User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? throw new UnauthorizedAccessException();
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserInsight>>> GetInsights([FromQuery] string? insightType = null, [FromQuery] bool? isActive = true)
    {
        var userId = GetUserId();
        var insights = await _userInsightService.GetInsightsForUserAsync(userId, insightType, isActive);
        return Ok(insights);
    }

    [HttpGet("{insightId}")]
    public async Task<ActionResult<UserInsight>> GetInsight(Guid insightId)
    {
        var insight = await _userInsightService.GetInsightByIdAsync(insightId);
        
        if (insight == null)
        {
            return NotFound();
        }

        // Ensure user can only access their own insights
        var userId = GetUserId();
        if (insight.UserId != userId)
        {
            return Forbid();
        }

        return Ok(insight);
    }

    [HttpGet("top")]
    public async Task<ActionResult<IEnumerable<UserInsight>>> GetTopInsights([FromQuery] int count = 5)
    {
        var userId = GetUserId();
        var insights = await _userInsightService.GetTopInsightsAsync(userId, count);
        return Ok(insights);
    }

    [HttpPost("generate/performance-correlation")]
    public async Task<ActionResult<UserInsight>> GeneratePerformanceCorrelation()
    {
        var userId = GetUserId();
        var insight = await _userInsightService.GeneratePerformanceCorrelationInsightAsync(userId);
        return Ok(insight);
    }

    [HttpPost("generate/best-times")]
    public async Task<ActionResult<UserInsight>> GenerateBestTimes()
    {
        var userId = GetUserId();
        var insight = await _userInsightService.GenerateBestTimesInsightAsync(userId);
        return Ok(insight);
    }

    [HttpPost("generate/emotion-patterns")]
    public async Task<ActionResult<UserInsight>> GenerateEmotionPatterns()
    {
        var userId = GetUserId();
        var insight = await _userInsightService.GenerateEmotionPatternInsightAsync(userId);
        return Ok(insight);
    }

    [HttpPost("generate/streak-milestone")]
    public async Task<ActionResult<UserInsight>> GenerateStreakMilestone()
    {
        var userId = GetUserId();
        var insight = await _userInsightService.GenerateStreakMilestoneInsightAsync(userId);
        return Ok(insight);
    }

    [HttpPost("generate/all")]
    public async Task<ActionResult<IEnumerable<UserInsight>>> GenerateAllInsights()
    {
        var userId = GetUserId();
        
        var insights = new List<UserInsight>
        {
            await _userInsightService.GeneratePerformanceCorrelationInsightAsync(userId),
            await _userInsightService.GenerateBestTimesInsightAsync(userId),
            await _userInsightService.GenerateEmotionPatternInsightAsync(userId),
            await _userInsightService.GenerateStreakMilestoneInsightAsync(userId)
        };

        return Ok(insights);
    }

    [HttpPut("{insightId}")]
    public async Task<ActionResult<UserInsight>> UpdateInsight(Guid insightId, [FromBody] UpdateInsightRequest request)
    {
        try
        {
            // First check if the insight exists and belongs to the user
            var existingInsight = await _userInsightService.GetInsightByIdAsync(insightId);
            if (existingInsight == null)
            {
                return NotFound();
            }

            var userId = GetUserId();
            if (existingInsight.UserId != userId)
            {
                return Forbid();
            }

            var insight = await _userInsightService.UpdateInsightAsync(insightId, request.Title, request.Description, request.IsActive);
            return Ok(insight);
        }
        catch (ArgumentException)
        {
            return NotFound();
        }
    }

    [HttpDelete("{insightId}")]
    public async Task<ActionResult> DeleteInsight(Guid insightId)
    {
        // First check if the insight exists and belongs to the user
        var existingInsight = await _userInsightService.GetInsightByIdAsync(insightId);
        if (existingInsight == null)
        {
            return NotFound();
        }

        var userId = GetUserId();
        if (existingInsight.UserId != userId)
        {
            return Forbid();
        }

        await _userInsightService.DeleteInsightAsync(insightId);
        return NoContent();
    }
}

public class UpdateInsightRequest
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public bool? IsActive { get; set; }
}
