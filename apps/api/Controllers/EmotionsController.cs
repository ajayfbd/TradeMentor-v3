using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using api.Data;
using api.DTOs;
using api.Models;

namespace api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EmotionsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public EmotionsController(ApplicationDbContext context)
    {
        _context = context;
    }

    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.Parse(userIdClaim!);
    }

    [HttpPost]
    public async Task<ActionResult<EmotionCheckResponseDto>> CreateEmotionCheck(EmotionCheckRequestDto request)
    {
        try
        {
            var userId = GetCurrentUserId();

            // Validate context
            var validContexts = new[] { EmotionContext.PreTrade, EmotionContext.PostTrade, EmotionContext.MarketEvent };
            if (!validContexts.Contains(request.Context))
            {
                return BadRequest(new { message = "Invalid context. Must be pre-trade, post-trade, or market-event" });
            }

            var emotionCheck = new EmotionCheck
            {
                UserId = userId,
                Level = request.Level,
                Context = request.Context,
                Notes = request.Notes,
                Symbol = request.Symbol?.ToUpper(),
                Timestamp = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };

            _context.EmotionChecks.Add(emotionCheck);
            
            // Update user streak
            var user = await _context.Users.FindAsync(userId);
            if (user != null)
            {
                var today = DateOnly.FromDateTime(DateTime.UtcNow);
                if (user.LastCheckDate == today.AddDays(-1))
                {
                    user.StreakCount++;
                }
                else if (user.LastCheckDate != today)
                {
                    user.StreakCount = 1;
                }
                user.LastCheckDate = today;
                user.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            var response = new EmotionCheckResponseDto
            {
                Id = emotionCheck.Id,
                UserId = emotionCheck.UserId,
                Level = emotionCheck.Level,
                Context = emotionCheck.Context,
                Timestamp = emotionCheck.Timestamp,
                Notes = emotionCheck.Notes,
                Symbol = emotionCheck.Symbol,
                CreatedAt = emotionCheck.CreatedAt
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Internal server error", details = ex.Message });
        }
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<EmotionCheckResponseDto>>> GetEmotionChecks(
        [FromQuery] int limit = 50, 
        [FromQuery] int offset = 0)
    {
        try
        {
            var userId = GetCurrentUserId();

            var emotionChecks = await _context.EmotionChecks
                .Where(e => e.UserId == userId)
                .OrderByDescending(e => e.Timestamp)
                .Skip(offset)
                .Take(Math.Min(limit, 100))
                .Select(e => new EmotionCheckResponseDto
                {
                    Id = e.Id,
                    UserId = e.UserId,
                    Level = e.Level,
                    Context = e.Context,
                    Timestamp = e.Timestamp,
                    Notes = e.Notes,
                    Symbol = e.Symbol,
                    CreatedAt = e.CreatedAt
                })
                .ToListAsync();

            return Ok(emotionChecks);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Internal server error", details = ex.Message });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<EmotionCheckResponseDto>> GetEmotionCheck(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();

            var emotionCheck = await _context.EmotionChecks
                .Where(e => e.Id == id && e.UserId == userId)
                .Select(e => new EmotionCheckResponseDto
                {
                    Id = e.Id,
                    UserId = e.UserId,
                    Level = e.Level,
                    Context = e.Context,
                    Timestamp = e.Timestamp,
                    Notes = e.Notes,
                    Symbol = e.Symbol,
                    CreatedAt = e.CreatedAt
                })
                .FirstOrDefaultAsync();

            if (emotionCheck == null)
            {
                return NotFound(new { message = "Emotion check not found" });
            }

            return Ok(emotionCheck);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Internal server error", details = ex.Message });
        }
    }
}
