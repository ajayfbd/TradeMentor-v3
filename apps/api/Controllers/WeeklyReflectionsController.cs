using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TradeMentor.Api.Models;
using TradeMentor.Api.Services;
using TradeMentor.Api.Validation;

namespace TradeMentor.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class WeeklyReflectionsController : ControllerBase
{
    private readonly IWeeklyReflectionService _weeklyReflectionService;
    private readonly ILogger<WeeklyReflectionsController> _logger;

    public WeeklyReflectionsController(
        IWeeklyReflectionService weeklyReflectionService,
        ILogger<WeeklyReflectionsController> logger)
    {
        _weeklyReflectionService = weeklyReflectionService;
        _logger = logger;
    }

    /// <summary>
    /// Get weekly reflection for specific week
    /// </summary>
    [HttpGet("{weekStartDate:datetime}")]
    public async Task<ActionResult<WeeklyReflection>> GetWeeklyReflection(DateTime weekStartDate)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var reflection = await _weeklyReflectionService.GetWeeklyReflectionAsync(userId, weekStartDate);
            
            if (reflection == null)
                return NotFound();

            return Ok(reflection);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting weekly reflection for week {WeekStart}", weekStartDate);
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Get current week's reflection
    /// </summary>
    [HttpGet("current")]
    public async Task<ActionResult<WeeklyReflection>> GetCurrentWeekReflection()
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var reflection = await _weeklyReflectionService.GetCurrentWeekReflectionAsync(userId);
            
            if (reflection == null)
                return NotFound();

            return Ok(reflection);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting current week reflection");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Get previous week's reflection
    /// </summary>
    [HttpGet("previous")]
    public async Task<ActionResult<WeeklyReflection>> GetPreviousWeekReflection()
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var reflection = await _weeklyReflectionService.GetPreviousWeekReflectionAsync(userId);
            
            if (reflection == null)
                return NotFound();

            return Ok(reflection);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting previous week reflection");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Get user's recent reflections
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<WeeklyReflection>>> GetUserReflections([FromQuery] int limit = 10)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var reflections = await _weeklyReflectionService.GetUserReflectionsAsync(userId, limit);
            return Ok(reflections);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user reflections");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Create or update weekly reflection
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<WeeklyReflection>> CreateOrUpdateReflection([FromBody] CreateWeeklyReflectionRequest request)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            // Validate input
            if (!InputValidator.IsValidText(request.Wins, 2000) ||
                !InputValidator.IsValidText(request.Losses, 2000) ||
                !InputValidator.IsValidText(request.Lessons, 2000) ||
                !InputValidator.IsValidText(request.EmotionalInsights, 2000) ||
                !InputValidator.IsValidText(request.NextWeekGoals, 2000))
            {
                return BadRequest("Invalid input: Text fields must be less than 2000 characters");
            }

            var reflection = new WeeklyReflection
            {
                Wins = request.Wins,
                Losses = request.Losses,
                Lessons = request.Lessons,
                EmotionalInsights = request.EmotionalInsights,
                NextWeekGoals = request.NextWeekGoals,
                WeekStartDate = request.WeekStartDate
            };

            var result = await _weeklyReflectionService.CreateOrUpdateReflectionAsync(userId, reflection);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating/updating weekly reflection");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Delete weekly reflection
    /// </summary>
    [HttpDelete("{reflectionId:guid}")]
    public async Task<IActionResult> DeleteReflection(Guid reflectionId)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var success = await _weeklyReflectionService.DeleteReflectionAsync(userId, reflectionId);
            
            if (!success)
                return NotFound();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting weekly reflection {ReflectionId}", reflectionId);
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Recalculate weekly metrics
    /// </summary>
    [HttpPost("{reflectionId:guid}/calculate-metrics")]
    public async Task<IActionResult> CalculateMetrics(Guid reflectionId)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            await _weeklyReflectionService.CalculateWeeklyMetricsAsync(userId, reflectionId);
            return Ok();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating metrics for reflection {ReflectionId}", reflectionId);
            return StatusCode(500, "Internal server error");
        }
    }
}

public class CreateWeeklyReflectionRequest
{
    public required string Wins { get; set; }
    public required string Losses { get; set; }
    public required string Lessons { get; set; }
    public required string EmotionalInsights { get; set; }
    public required string NextWeekGoals { get; set; }
    public DateTime WeekStartDate { get; set; }
}
