using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TradeMentor.Api.Data.Repositories;
using TradeMentor.Api.Models;
using TradeMentor.Api.Services;

namespace TradeMentor.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EmotionController : ControllerBase
{
    private readonly IEmotionCheckRepository _emotionRepository;
    private readonly IUserRepository _userRepository;
    private readonly IEmotionService _emotionService;
    private readonly ILogger<EmotionController> _logger;

    public EmotionController(
        IEmotionCheckRepository emotionRepository,
        IUserRepository userRepository,
        IEmotionService emotionService,
        ILogger<EmotionController> logger)
    {
        _emotionRepository = emotionRepository;
        _userRepository = userRepository;
        _emotionService = emotionService;
        _logger = logger;
    }

    /// <summary>
    /// Get paginated emotion history for the current user
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<EmotionResponseDto>>>> GetEmotionHistory(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string? timezone = "UTC",
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        try
        {
            var userId = GetCurrentUserId();

            if (pageSize > 100) pageSize = 100; // Limit page size
            if (pageSize < 1) pageSize = 10;
            if (page < 1) page = 1;

            var emotions = startDate.HasValue && endDate.HasValue
                ? await _emotionRepository.GetByUserIdAndDateRangeAsync(userId, startDate.Value, endDate.Value)
                : await _emotionRepository.GetByUserIdAsync(userId);

            var pagedEmotions = emotions
                .OrderByDescending(e => e.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(e => new EmotionResponseDto
                {
                    Id = e.Id,
                    Level = e.Level,
                    Context = e.Context,
                    Symbol = e.Symbol,
                    Notes = e.Notes,
                    Timestamp = _emotionService.ConvertToUserTimezone(e.Timestamp, timezone ?? "UTC"),
                    CreatedAt = _emotionService.ConvertToUserTimezone(e.CreatedAt, timezone ?? "UTC"),
                    UserId = e.UserId
                })
                .ToList();

            _logger.LogInformation("Retrieved {Count} emotions for user {UserId}, page {Page}", 
                pagedEmotions.Count, userId, page);

            return Ok(ApiResponse<List<EmotionResponseDto>>.SuccessResponse(pagedEmotions));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving emotion history");
            return StatusCode(500, ApiResponse<List<EmotionResponseDto>>.ErrorResponse(
                "An error occurred while retrieving emotion history"));
        }
    }

    /// <summary>
    /// Get a specific emotion check by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<EmotionCheckDto>>> GetEmotionCheck(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var emotion = await _emotionRepository.GetByIdAsync(id);

            if (emotion == null || emotion.UserId != userId)
            {
                return NotFound(ApiResponse<EmotionCheckDto>.ErrorResponse("Emotion check not found"));
            }

            var emotionDto = new EmotionCheckDto
            {
                Id = emotion.Id,
                Level = emotion.Level,
                Context = emotion.Context,
                Timestamp = emotion.Timestamp,
                Notes = emotion.Notes,
                Symbol = emotion.Symbol
            };

            return Ok(ApiResponse<EmotionCheckDto>.SuccessResponse(emotionDto));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting emotion check {Id}", id);
            return StatusCode(500, ApiResponse<EmotionCheckDto>.ErrorResponse("Failed to get emotion check"));
        }
    }

    /// <summary>
    /// Create a new emotion check (max 50 per day)
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ApiResponse<EmotionResponseDto>>> CreateEmotionCheck(
        [FromBody] EmotionCheckDto emotionDto,
        [FromQuery] string? timezone = "UTC")
    {
        try
        {
            var userId = GetCurrentUserId();

            // Rate limiting check
            var canCreate = await _emotionService.CanCreateEmotionCheckAsync(userId);
            if (!canCreate)
            {
                _logger.LogWarning("Rate limit exceeded for user {UserId}", userId);
                return BadRequest(ApiResponse<EmotionResponseDto>.ErrorResponse(
                    "Daily limit of 50 emotion checks exceeded"));
            }

            // Convert timestamp to UTC if provided
            var timestamp = emotionDto.Timestamp ?? DateTime.UtcNow;
            if (emotionDto.Timestamp.HasValue)
            {
                timestamp = _emotionService.ConvertToUtc(emotionDto.Timestamp.Value, timezone ?? "UTC");
            }

            var emotionCheck = new EmotionCheck
            {
                Id = Guid.NewGuid(),
                Level = emotionDto.Level,
                Context = emotionDto.Context,
                Symbol = emotionDto.Symbol?.ToUpper(),
                Notes = emotionDto.Notes,
                Timestamp = timestamp,
                CreatedAt = DateTime.UtcNow,
                UserId = userId
            };

            await _emotionRepository.AddAsync(emotionCheck);

            // Update user streak
            await UpdateUserStreak(userId);

            var responseDto = new EmotionResponseDto
            {
                Id = emotionCheck.Id,
                Level = emotionCheck.Level,
                Context = emotionCheck.Context,
                Symbol = emotionCheck.Symbol,
                Notes = emotionCheck.Notes,
                Timestamp = _emotionService.ConvertToUserTimezone(emotionCheck.Timestamp, timezone ?? "UTC"),
                CreatedAt = _emotionService.ConvertToUserTimezone(emotionCheck.CreatedAt, timezone ?? "UTC"),
                UserId = emotionCheck.UserId
            };

            _logger.LogInformation("Emotion check created for user {UserId}, level {Level}", 
                userId, emotionCheck.Level);

            return CreatedAtAction(nameof(GetEmotionCheck), new { id = emotionCheck.Id },
                ApiResponse<EmotionResponseDto>.SuccessResponse(
                    responseDto, "Emotion check created successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating emotion check");
            return StatusCode(500, ApiResponse<EmotionResponseDto>.ErrorResponse(
                "An error occurred while creating the emotion check"));
        }
    }

    /// <summary>
    /// Update an existing emotion check
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<EmotionCheckDto>>> UpdateEmotionCheck(
        Guid id, [FromBody] EmotionCheckRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
                return BadRequest(ApiResponse<EmotionCheckDto>.ErrorResponse(errors));
            }

            var userId = GetCurrentUserId();
            var emotion = await _emotionRepository.GetByIdAsync(id);

            if (emotion == null || emotion.UserId != userId)
            {
                return NotFound(ApiResponse<EmotionCheckDto>.ErrorResponse("Emotion check not found"));
            }

            emotion.Level = request.Level;
            emotion.Context = request.Context;
            emotion.Notes = request.Notes;
            emotion.Symbol = request.Symbol?.ToUpper();

            await _emotionRepository.UpdateAsync(emotion);

            var emotionDto = new EmotionCheckDto
            {
                Id = emotion.Id,
                Level = emotion.Level,
                Context = emotion.Context,
                Timestamp = emotion.Timestamp,
                Notes = emotion.Notes,
                Symbol = emotion.Symbol
            };

            return Ok(ApiResponse<EmotionCheckDto>.SuccessResponse(emotionDto, "Emotion check updated successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating emotion check {Id}", id);
            return StatusCode(500, ApiResponse<EmotionCheckDto>.ErrorResponse("Failed to update emotion check"));
        }
    }

    /// <summary>
    /// Delete an emotion check
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse>> DeleteEmotionCheck(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var emotion = await _emotionRepository.GetByIdAsync(id);

            if (emotion == null || emotion.UserId != userId)
            {
                return NotFound(ApiResponse.ErrorResponse("Emotion check not found"));
            }

            await _emotionRepository.DeleteAsync(id);

            return Ok(ApiResponse.SuccessResponse("Emotion check deleted successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting emotion check {Id}", id);
            return StatusCode(500, ApiResponse.ErrorResponse("Failed to delete emotion check"));
        }
    }

    /// <summary>
    /// Get average emotion level for a date range
    /// </summary>
    [HttpGet("average")]
    public async Task<ActionResult<ApiResponse<double>>> GetAverageEmotion(
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate)
    {
        try
        {
            var userId = GetCurrentUserId();
            var average = await _emotionRepository.GetAverageEmotionLevelByUserAsync(userId, startDate, endDate);

            return Ok(ApiResponse<double>.SuccessResponse(Math.Round(average, 2)));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting average emotion for user");
            return StatusCode(500, ApiResponse<double>.ErrorResponse("Failed to get average emotion"));
        }
    }

    /// <summary>
    /// Get latest emotion check for the current user
    /// </summary>
    [HttpGet("latest")]
    public async Task<ActionResult<ApiResponse<EmotionCheckDto?>>> GetLatestEmotionCheck()
    {
        try
        {
            var userId = GetCurrentUserId();
            var emotion = await _emotionRepository.GetLatestByUserIdAsync(userId);

            if (emotion == null)
            {
                return Ok(ApiResponse<EmotionCheckDto?>.SuccessResponse(null));
            }

            var emotionDto = new EmotionCheckDto
            {
                Id = emotion.Id,
                Level = emotion.Level,
                Context = emotion.Context,
                Timestamp = emotion.Timestamp,
                Notes = emotion.Notes,
                Symbol = emotion.Symbol
            };

            return Ok(ApiResponse<EmotionCheckDto?>.SuccessResponse(emotionDto));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting latest emotion check for user");
            return StatusCode(500, ApiResponse<EmotionCheckDto?>.ErrorResponse("Failed to get latest emotion check"));
        }
    }

    private string GetCurrentUserId()
    {
        return User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
            ?? User.FindFirst("userId")?.Value 
            ?? throw new UnauthorizedAccessException("User ID not found in token");
    }

    private async Task UpdateUserStreak(string userId)
    {
        try
        {
            var user = await _userRepository.GetByIdAsync(Guid.Parse(userId));
            if (user == null) return;

            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var yesterday = today.AddDays(-1);

            if (user.LastCheckDate == null)
            {
                // First check ever
                user.StreakCount = 1;
                user.LastCheckDate = today;
            }
            else if (user.LastCheckDate == yesterday)
            {
                // Consecutive day
                user.StreakCount++;
                user.LastCheckDate = today;
            }
            else if (user.LastCheckDate != today)
            {
                // Missed days, reset streak
                user.StreakCount = 1;
                user.LastCheckDate = today;
            }
            // If LastCheckDate == today, don't update (already checked today)

            user.LastEmotionCheckAt = DateTime.UtcNow;
            user.UpdatedAt = DateTime.UtcNow;

            await _userRepository.UpdateAsync(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user streak for user {UserId}", userId);
            // Don't throw - streak update is not critical
        }
    }
}
