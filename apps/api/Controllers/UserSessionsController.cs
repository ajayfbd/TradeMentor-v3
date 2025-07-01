using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TradeMentor.Api.Models;
using TradeMentor.Api.Services;

namespace TradeMentor.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UserSessionsController : ControllerBase
{
    private readonly IUserSessionService _userSessionService;

    public UserSessionsController(IUserSessionService userSessionService)
    {
        _userSessionService = userSessionService;
    }

    private string GetUserId()
    {
        return User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? throw new UnauthorizedAccessException();
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserSession>>> GetSessions([FromQuery] DateTime? startDate = null, [FromQuery] DateTime? endDate = null)
    {
        var userId = GetUserId();
        var sessions = await _userSessionService.GetSessionsForUserAsync(userId, startDate, endDate);
        return Ok(sessions);
    }

    [HttpGet("{date}")]
    public async Task<ActionResult<UserSession>> GetSessionByDate(DateOnly date)
    {
        var userId = GetUserId();
        var session = await _userSessionService.GetSessionByDateAsync(userId, date);
        
        if (session == null)
        {
            return NotFound();
        }

        return Ok(session);
    }

    [HttpPost]
    public async Task<ActionResult<UserSession>> CreateOrUpdateSession([FromBody] CreateSessionRequest request)
    {
        var userId = GetUserId();
        var session = await _userSessionService.CreateOrUpdateSessionAsync(
            userId, 
            request.Date, 
            request.EmotionsLogged, 
            request.TradesLogged
        );
        
        return Ok(session);
    }

    [HttpPut("{sessionId}/quality-score")]
    public async Task<ActionResult<UserSession>> UpdateQualityScore(Guid sessionId, [FromBody] UpdateQualityScoreRequest request)
    {
        try
        {
            var session = await _userSessionService.UpdateSessionQualityScoreAsync(sessionId, request.QualityScore);
            return Ok(session);
        }
        catch (ArgumentException)
        {
            return NotFound();
        }
    }

    [HttpGet("streak")]
    public async Task<ActionResult<IEnumerable<UserSession>>> GetStreak()
    {
        var userId = GetUserId();
        var streak = await _userSessionService.GetSessionStreakAsync(userId);
        return Ok(streak);
    }

    [HttpGet("average-quality")]
    public async Task<ActionResult<decimal>> GetAverageQuality([FromQuery] DateTime? startDate = null, [FromQuery] DateTime? endDate = null)
    {
        var userId = GetUserId();
        var averageQuality = await _userSessionService.GetAverageSessionQualityAsync(userId, startDate, endDate);
        return Ok(averageQuality);
    }
}

public class CreateSessionRequest
{
    public DateOnly Date { get; set; }
    public int EmotionsLogged { get; set; } = 0;
    public int TradesLogged { get; set; } = 0;
}

public class UpdateQualityScoreRequest
{
    public decimal QualityScore { get; set; }
}
