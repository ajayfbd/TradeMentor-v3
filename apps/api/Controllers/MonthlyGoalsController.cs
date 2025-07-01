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
public class MonthlyGoalsController : ControllerBase
{
    private readonly IMonthlyGoalService _monthlyGoalService;
    private readonly ILogger<MonthlyGoalsController> _logger;

    public MonthlyGoalsController(
        IMonthlyGoalService monthlyGoalService,
        ILogger<MonthlyGoalsController> logger)
    {
        _monthlyGoalService = monthlyGoalService;
        _logger = logger;
    }

    /// <summary>
    /// Get monthly goal for specific month
    /// </summary>
    [HttpGet("{targetMonth:datetime}")]
    public async Task<ActionResult<MonthlyGoal>> GetMonthlyGoal(DateTime targetMonth)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var goal = await _monthlyGoalService.GetMonthlyGoalAsync(userId, targetMonth);
            
            if (goal == null)
                return NotFound();

            return Ok(goal);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting monthly goal for month {TargetMonth}", targetMonth);
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Get current month's goal
    /// </summary>
    [HttpGet("current")]
    public async Task<ActionResult<MonthlyGoal>> GetCurrentMonthGoal()
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var goal = await _monthlyGoalService.GetCurrentMonthGoalAsync(userId);
            
            if (goal == null)
                return NotFound();

            return Ok(goal);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting current month goal");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Get user's goals
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<MonthlyGoal>>> GetUserGoals([FromQuery] int limit = 12)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var goals = await _monthlyGoalService.GetUserGoalsAsync(userId, limit);
            return Ok(goals);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user goals");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Get completed goals
    /// </summary>
    [HttpGet("completed")]
    public async Task<ActionResult<IEnumerable<MonthlyGoal>>> GetCompletedGoals()
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var goals = await _monthlyGoalService.GetCompletedGoalsAsync(userId);
            return Ok(goals);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting completed goals");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Get pending goals
    /// </summary>
    [HttpGet("pending")]
    public async Task<ActionResult<IEnumerable<MonthlyGoal>>> GetPendingGoals()
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var goals = await _monthlyGoalService.GetPendingGoalsAsync(userId);
            return Ok(goals);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting pending goals");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Create or update monthly goal
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<MonthlyGoal>> CreateOrUpdateGoal([FromBody] CreateMonthlyGoalRequest request)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            // Validate input
            if (!InputValidator.IsValidText(request.Goal, 500))
            {
                return BadRequest("Invalid input: Goal must be less than 500 characters");
            }

            // Validate progress range
            if (request.Progress < 0 || request.Progress > 100)
            {
                return BadRequest("Progress must be between 0 and 100");
            }

            var goal = new MonthlyGoal
            {
                Goal = request.Goal,
                Progress = request.Progress,
                IsCompleted = request.IsCompleted,
                TargetMonth = request.TargetMonth
            };

            var result = await _monthlyGoalService.CreateOrUpdateGoalAsync(userId, goal);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating/updating monthly goal");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Update goal progress
    /// </summary>
    [HttpPatch("{goalId:guid}/progress")]
    public async Task<IActionResult> UpdateGoalProgress(Guid goalId, [FromBody] UpdateProgressRequest request)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            // Validate progress range
            if (request.Progress < 0 || request.Progress > 100)
            {
                return BadRequest("Progress must be between 0 and 100");
            }

            var success = await _monthlyGoalService.UpdateGoalProgressAsync(userId, goalId, request.Progress);
            
            if (!success)
                return NotFound();

            return Ok();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating goal progress for goal {GoalId}", goalId);
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Mark goal as completed
    /// </summary>
    [HttpPatch("{goalId:guid}/complete")]
    public async Task<IActionResult> MarkGoalCompleted(Guid goalId)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var success = await _monthlyGoalService.MarkGoalCompletedAsync(userId, goalId);
            
            if (!success)
                return NotFound();

            return Ok();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking goal completed for goal {GoalId}", goalId);
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Delete monthly goal
    /// </summary>
    [HttpDelete("{goalId:guid}")]
    public async Task<IActionResult> DeleteGoal(Guid goalId)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var success = await _monthlyGoalService.DeleteGoalAsync(userId, goalId);
            
            if (!success)
                return NotFound();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting monthly goal {GoalId}", goalId);
            return StatusCode(500, "Internal server error");
        }
    }
}

public class CreateMonthlyGoalRequest
{
    public required string Goal { get; set; }
    public int Progress { get; set; } = 0;
    public bool IsCompleted { get; set; } = false;
    public DateTime TargetMonth { get; set; }
}

public class UpdateProgressRequest
{
    public int Progress { get; set; }
}
