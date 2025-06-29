using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TradeMentor.Api.Models;
using TradeMentor.Api.Data.Repositories;

namespace TradeMentor.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TradeController : ControllerBase
{
    private readonly ITradeRepository _tradeRepository;
    private readonly IEmotionCheckRepository _emotionRepository;
    private readonly ILogger<TradeController> _logger;

    public TradeController(
        ITradeRepository tradeRepository,
        IEmotionCheckRepository emotionRepository,
        ILogger<TradeController> logger)
    {
        _tradeRepository = tradeRepository;
        _emotionRepository = emotionRepository;
        _logger = logger;
    }

    /// <summary>
    /// Get all trades for the current user
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<TradeDto>>>> GetTrades(
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        [FromQuery] string? symbol = null,
        [FromQuery] string? outcome = null)
    {
        try
        {
            var userId = GetCurrentUserId();
            
            var trades = startDate.HasValue && endDate.HasValue
                ? await _tradeRepository.GetByUserIdAndDateRangeAsync(userId, startDate.Value, endDate.Value)
                : await _tradeRepository.GetByUserIdAsync(userId);

            // Apply additional filters
            if (!string.IsNullOrEmpty(symbol))
            {
                trades = trades.Where(t => t.Symbol.Equals(symbol, StringComparison.OrdinalIgnoreCase));
            }

            if (!string.IsNullOrEmpty(outcome))
            {
                trades = trades.Where(t => t.Outcome.Equals(outcome, StringComparison.OrdinalIgnoreCase));
            }

            var tradeDtos = trades.Select(t => new TradeDto
            {
                Id = t.Id,
                Symbol = t.Symbol,
                Type = t.Type,
                Outcome = t.Outcome,
                Pnl = t.Pnl,
                EntryPrice = t.EntryPrice,
                ExitPrice = t.ExitPrice,
                Quantity = t.Quantity,
                EntryTime = t.EntryTime,
                ExitTime = t.ExitTime,
                EmotionCheck = t.EmotionCheck != null ? new EmotionCheckDto
                {
                    Id = t.EmotionCheck.Id,
                    Level = t.EmotionCheck.Level,
                    Context = t.EmotionCheck.Context,
                    Timestamp = t.EmotionCheck.Timestamp,
                    Notes = t.EmotionCheck.Notes,
                    Symbol = t.EmotionCheck.Symbol
                } : null
            }).ToList();

            return Ok(ApiResponse<List<TradeDto>>.SuccessResponse(tradeDtos));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting trades for user");
            return StatusCode(500, ApiResponse<List<TradeDto>>.ErrorResponse("Failed to get trades"));
        }
    }

    /// <summary>
    /// Get a specific trade by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<TradeDto>>> GetTrade(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var trade = await _tradeRepository.GetByIdAsync(id);

            if (trade == null || trade.UserId != userId)
            {
                return NotFound(ApiResponse<TradeDto>.ErrorResponse("Trade not found"));
            }

            var tradeDto = new TradeDto
            {
                Id = trade.Id,
                Symbol = trade.Symbol,
                Type = trade.Type,
                Outcome = trade.Outcome,
                Pnl = trade.Pnl,
                EntryPrice = trade.EntryPrice,
                ExitPrice = trade.ExitPrice,
                Quantity = trade.Quantity,
                EntryTime = trade.EntryTime,
                ExitTime = trade.ExitTime,
                EmotionCheck = trade.EmotionCheck != null ? new EmotionCheckDto
                {
                    Id = trade.EmotionCheck.Id,
                    Level = trade.EmotionCheck.Level,
                    Context = trade.EmotionCheck.Context,
                    Timestamp = trade.EmotionCheck.Timestamp,
                    Notes = trade.EmotionCheck.Notes,
                    Symbol = trade.EmotionCheck.Symbol
                } : null
            };

            return Ok(ApiResponse<TradeDto>.SuccessResponse(tradeDto));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting trade {Id}", id);
            return StatusCode(500, ApiResponse<TradeDto>.ErrorResponse("Failed to get trade"));
        }
    }

    /// <summary>
    /// Create a new trade
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ApiResponse<TradeDto>>> CreateTrade([FromBody] TradeRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
                return BadRequest(ApiResponse<TradeDto>.ErrorResponse(errors));
            }

            var userId = GetCurrentUserId();

            // Validate emotion check exists if provided
            if (request.EmotionCheckId.HasValue)
            {
                var emotionCheck = await _emotionRepository.GetByIdAsync(request.EmotionCheckId.Value);
                if (emotionCheck == null || emotionCheck.UserId != userId)
                {
                    return BadRequest(ApiResponse<TradeDto>.ErrorResponse("Invalid emotion check ID"));
                }
            }

            var trade = new Trade
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Symbol = request.Symbol.ToUpper(),
                Type = request.Type,
                Outcome = request.Outcome,
                Pnl = request.Pnl,
                EntryPrice = request.EntryPrice,
                ExitPrice = request.ExitPrice,
                Quantity = request.Quantity,
                EmotionCheckId = request.EmotionCheckId,
                EntryTime = request.EntryTime ?? DateTime.UtcNow,
                ExitTime = request.ExitTime,
                CreatedAt = DateTime.UtcNow
            };

            await _tradeRepository.AddAsync(trade);

            // Load emotion check for response
            if (trade.EmotionCheckId.HasValue)
            {
                trade.EmotionCheck = await _emotionRepository.GetByIdAsync(trade.EmotionCheckId.Value);
            }

            var tradeDto = new TradeDto
            {
                Id = trade.Id,
                Symbol = trade.Symbol,
                Type = trade.Type,
                Outcome = trade.Outcome,
                Pnl = trade.Pnl,
                EntryPrice = trade.EntryPrice,
                ExitPrice = trade.ExitPrice,
                Quantity = trade.Quantity,
                EntryTime = trade.EntryTime,
                ExitTime = trade.ExitTime,
                EmotionCheck = trade.EmotionCheck != null ? new EmotionCheckDto
                {
                    Id = trade.EmotionCheck.Id,
                    Level = trade.EmotionCheck.Level,
                    Context = trade.EmotionCheck.Context,
                    Timestamp = trade.EmotionCheck.Timestamp,
                    Notes = trade.EmotionCheck.Notes,
                    Symbol = trade.EmotionCheck.Symbol
                } : null
            };

            return CreatedAtAction(nameof(GetTrade), new { id = trade.Id }, 
                ApiResponse<TradeDto>.SuccessResponse(tradeDto, "Trade created successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating trade");
            return StatusCode(500, ApiResponse<TradeDto>.ErrorResponse("Failed to create trade"));
        }
    }

    /// <summary>
    /// Update an existing trade
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<TradeDto>>> UpdateTrade(Guid id, [FromBody] TradeRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
                return BadRequest(ApiResponse<TradeDto>.ErrorResponse(errors));
            }

            var userId = GetCurrentUserId();
            var trade = await _tradeRepository.GetByIdAsync(id);

            if (trade == null || trade.UserId != userId)
            {
                return NotFound(ApiResponse<TradeDto>.ErrorResponse("Trade not found"));
            }

            // Validate emotion check exists if provided
            if (request.EmotionCheckId.HasValue)
            {
                var emotionCheck = await _emotionRepository.GetByIdAsync(request.EmotionCheckId.Value);
                if (emotionCheck == null || emotionCheck.UserId != userId)
                {
                    return BadRequest(ApiResponse<TradeDto>.ErrorResponse("Invalid emotion check ID"));
                }
            }

            trade.Symbol = request.Symbol.ToUpper();
            trade.Type = request.Type;
            trade.Outcome = request.Outcome;
            trade.Pnl = request.Pnl;
            trade.EntryPrice = request.EntryPrice;
            trade.ExitPrice = request.ExitPrice;
            trade.Quantity = request.Quantity;
            trade.EmotionCheckId = request.EmotionCheckId;
            trade.EntryTime = request.EntryTime ?? trade.EntryTime;
            trade.ExitTime = request.ExitTime;

            await _tradeRepository.UpdateAsync(trade);

            // Load emotion check for response
            if (trade.EmotionCheckId.HasValue)
            {
                trade.EmotionCheck = await _emotionRepository.GetByIdAsync(trade.EmotionCheckId.Value);
            }

            var tradeDto = new TradeDto
            {
                Id = trade.Id,
                Symbol = trade.Symbol,
                Type = trade.Type,
                Outcome = trade.Outcome,
                Pnl = trade.Pnl,
                EntryPrice = trade.EntryPrice,
                ExitPrice = trade.ExitPrice,
                Quantity = trade.Quantity,
                EntryTime = trade.EntryTime,
                ExitTime = trade.ExitTime,
                EmotionCheck = trade.EmotionCheck != null ? new EmotionCheckDto
                {
                    Id = trade.EmotionCheck.Id,
                    Level = trade.EmotionCheck.Level,
                    Context = trade.EmotionCheck.Context,
                    Timestamp = trade.EmotionCheck.Timestamp,
                    Notes = trade.EmotionCheck.Notes,
                    Symbol = trade.EmotionCheck.Symbol
                } : null
            };

            return Ok(ApiResponse<TradeDto>.SuccessResponse(tradeDto, "Trade updated successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating trade {Id}", id);
            return StatusCode(500, ApiResponse<TradeDto>.ErrorResponse("Failed to update trade"));
        }
    }

    /// <summary>
    /// Delete a trade
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse>> DeleteTrade(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var trade = await _tradeRepository.GetByIdAsync(id);

            if (trade == null || trade.UserId != userId)
            {
                return NotFound(ApiResponse.ErrorResponse("Trade not found"));
            }

            await _tradeRepository.DeleteAsync(id);

            return Ok(ApiResponse.SuccessResponse("Trade deleted successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting trade {Id}", id);
            return StatusCode(500, ApiResponse.ErrorResponse("Failed to delete trade"));
        }
    }

    /// <summary>
    /// Get trading statistics for the current user
    /// </summary>
    [HttpGet("stats")]
    public async Task<ActionResult<ApiResponse<object>>> GetTradingStats()
    {
        try
        {
            var userId = GetCurrentUserId();
            
            var totalPnl = await _tradeRepository.GetTotalPnlByUserAsync(userId);
            var winRate = await _tradeRepository.GetWinRateByUserAsync(userId);
            var trades = await _tradeRepository.GetByUserIdAsync(userId);

            var stats = new
            {
                TotalTrades = trades.Count(),
                TotalPnl = totalPnl,
                WinRate = Math.Round(winRate, 2),
                WinningTrades = trades.Count(t => t.Outcome == TradeOutcome.Win),
                LosingTrades = trades.Count(t => t.Outcome == TradeOutcome.Loss),
                BreakevenTrades = trades.Count(t => t.Outcome == TradeOutcome.Breakeven),
                AveragePnl = trades.Where(t => t.Pnl.HasValue).Any() 
                    ? Math.Round(trades.Where(t => t.Pnl.HasValue).Average(t => t.Pnl!.Value), 2) 
                    : 0,
                BestTrade = trades.Where(t => t.Pnl.HasValue).Any() 
                    ? trades.Where(t => t.Pnl.HasValue).Max(t => t.Pnl!.Value) 
                    : 0,
                WorstTrade = trades.Where(t => t.Pnl.HasValue).Any() 
                    ? trades.Where(t => t.Pnl.HasValue).Min(t => t.Pnl!.Value) 
                    : 0
            };

            return Ok(ApiResponse<object>.SuccessResponse(stats));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting trading stats for user");
            return StatusCode(500, ApiResponse<object>.ErrorResponse("Failed to get trading stats"));
        }
    }

    private string GetCurrentUserId()
    {
        return User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
            ?? User.FindFirst("userId")?.Value 
            ?? throw new UnauthorizedAccessException("User ID not found in token");
    }
}
