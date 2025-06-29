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
public class TradesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public TradesController(ApplicationDbContext context)
    {
        _context = context;
    }

    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.Parse(userIdClaim!);
    }

    [HttpPost]
    public async Task<ActionResult<TradeResponseDto>> CreateTrade(TradeRequestDto request)
    {
        try
        {
            var userId = GetCurrentUserId();

            // Validate type and outcome
            var validTypes = new[] { TradeType.Buy, TradeType.Sell };
            var validOutcomes = new[] { TradeOutcome.Win, TradeOutcome.Loss, TradeOutcome.Breakeven };

            if (!validTypes.Contains(request.Type))
            {
                return BadRequest(new { message = "Invalid trade type. Must be buy or sell" });
            }

            if (!validOutcomes.Contains(request.Outcome))
            {
                return BadRequest(new { message = "Invalid outcome. Must be win, loss, or breakeven" });
            }

            // Validate emotion check if provided
            if (request.EmotionCheckId.HasValue)
            {
                var emotionExists = await _context.EmotionChecks
                    .AnyAsync(e => e.Id == request.EmotionCheckId && e.UserId == userId);
                
                if (!emotionExists)
                {
                    return BadRequest(new { message = "Invalid emotion check ID" });
                }
            }

            var trade = new Trade
            {
                UserId = userId,
                Symbol = request.Symbol.ToUpper(),
                Type = request.Type,
                Outcome = request.Outcome,
                Pnl = request.Pnl,
                EmotionCheckId = request.EmotionCheckId,
                Timestamp = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };

            _context.Trades.Add(trade);
            await _context.SaveChangesAsync();

            // Get emotion level if linked
            int? emotionLevel = null;
            if (request.EmotionCheckId.HasValue)
            {
                var emotion = await _context.EmotionChecks
                    .Where(e => e.Id == request.EmotionCheckId)
                    .Select(e => e.Level)
                    .FirstOrDefaultAsync();
                emotionLevel = emotion;
            }

            var response = new TradeResponseDto
            {
                Id = trade.Id,
                UserId = trade.UserId,
                Symbol = trade.Symbol,
                Type = trade.Type,
                Outcome = trade.Outcome,
                Pnl = trade.Pnl,
                EmotionCheckId = trade.EmotionCheckId,
                Timestamp = trade.Timestamp,
                CreatedAt = trade.CreatedAt,
                EmotionLevel = emotionLevel
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Internal server error", details = ex.Message });
        }
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TradeResponseDto>>> GetTrades(
        [FromQuery] int limit = 50, 
        [FromQuery] int offset = 0)
    {
        try
        {
            var userId = GetCurrentUserId();

            var trades = await _context.Trades
                .Where(t => t.UserId == userId)
                .OrderByDescending(t => t.Timestamp)
                .Skip(offset)
                .Take(Math.Min(limit, 100))
                .Select(t => new TradeResponseDto
                {
                    Id = t.Id,
                    UserId = t.UserId,
                    Symbol = t.Symbol,
                    Type = t.Type,
                    Outcome = t.Outcome,
                    Pnl = t.Pnl,
                    EmotionCheckId = t.EmotionCheckId,
                    Timestamp = t.Timestamp,
                    CreatedAt = t.CreatedAt,
                    EmotionLevel = t.EmotionCheck != null ? t.EmotionCheck.Level : null
                })
                .ToListAsync();

            return Ok(trades);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Internal server error", details = ex.Message });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<TradeResponseDto>> GetTrade(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();

            var trade = await _context.Trades
                .Include(t => t.EmotionCheck)
                .Where(t => t.Id == id && t.UserId == userId)
                .Select(t => new TradeResponseDto
                {
                    Id = t.Id,
                    UserId = t.UserId,
                    Symbol = t.Symbol,
                    Type = t.Type,
                    Outcome = t.Outcome,
                    Pnl = t.Pnl,
                    EmotionCheckId = t.EmotionCheckId,
                    Timestamp = t.Timestamp,
                    CreatedAt = t.CreatedAt,
                    EmotionLevel = t.EmotionCheck != null ? t.EmotionCheck.Level : null
                })
                .FirstOrDefaultAsync();

            if (trade == null)
            {
                return NotFound(new { message = "Trade not found" });
            }

            return Ok(trade);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Internal server error", details = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<TradeResponseDto>> UpdateTrade(Guid id, TradeRequestDto request)
    {
        try
        {
            var userId = GetCurrentUserId();

            var trade = await _context.Trades
                .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);

            if (trade == null)
            {
                return NotFound(new { message = "Trade not found" });
            }

            // Validate type and outcome
            var validTypes = new[] { TradeType.Buy, TradeType.Sell };
            var validOutcomes = new[] { TradeOutcome.Win, TradeOutcome.Loss, TradeOutcome.Breakeven };

            if (!validTypes.Contains(request.Type))
            {
                return BadRequest(new { message = "Invalid trade type. Must be buy or sell" });
            }

            if (!validOutcomes.Contains(request.Outcome))
            {
                return BadRequest(new { message = "Invalid outcome. Must be win, loss, or breakeven" });
            }

            trade.Symbol = request.Symbol.ToUpper();
            trade.Type = request.Type;
            trade.Outcome = request.Outcome;
            trade.Pnl = request.Pnl;
            trade.EmotionCheckId = request.EmotionCheckId;

            await _context.SaveChangesAsync();

            // Get emotion level if linked
            int? emotionLevel = null;
            if (request.EmotionCheckId.HasValue)
            {
                var emotion = await _context.EmotionChecks
                    .Where(e => e.Id == request.EmotionCheckId)
                    .Select(e => e.Level)
                    .FirstOrDefaultAsync();
                emotionLevel = emotion;
            }

            var response = new TradeResponseDto
            {
                Id = trade.Id,
                UserId = trade.UserId,
                Symbol = trade.Symbol,
                Type = trade.Type,
                Outcome = trade.Outcome,
                Pnl = trade.Pnl,
                EmotionCheckId = trade.EmotionCheckId,
                Timestamp = trade.Timestamp,
                CreatedAt = trade.CreatedAt,
                EmotionLevel = emotionLevel
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Internal server error", details = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteTrade(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();

            var trade = await _context.Trades
                .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);

            if (trade == null)
            {
                return NotFound(new { message = "Trade not found" });
            }

            _context.Trades.Remove(trade);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Internal server error", details = ex.Message });
        }
    }
}
