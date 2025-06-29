using TradeMentor.Api.Data.Repositories;
using TradeMentor.Api.Models;

namespace TradeMentor.Api.Services;

public interface IEmotionService
{
    Task<bool> CanCreateEmotionCheckAsync(string userId);
    Task<EmotionStatsDto> GetEmotionStatsAsync(string userId, string userTimezone = "UTC");
    Task<List<EmotionResponseDto>> GetEmotionHistoryAsync(string userId, int page = 1, int pageSize = 50, string userTimezone = "UTC");
    DateTime ConvertToUserTimezone(DateTime utcDateTime, string userTimezone);
    DateTime ConvertToUtc(DateTime userDateTime, string userTimezone);
}

public class EmotionService : IEmotionService
{
    private readonly IEmotionCheckRepository _emotionRepository;
    private readonly ILogger<EmotionService> _logger;
    private const int MaxChecksPerDay = 50;

    public EmotionService(
        IEmotionCheckRepository emotionRepository,
        ILogger<EmotionService> logger)
    {
        _emotionRepository = emotionRepository;
        _logger = logger;
    }

    public async Task<bool> CanCreateEmotionCheckAsync(string userId)
    {
        try
        {
            var today = DateTime.UtcNow.Date;
            var tomorrow = today.AddDays(1);
            
            var todayChecks = (await _emotionRepository.GetByUserIdAsync(userId)).ToList();
            var todayCount = todayChecks.Count(e => e.CreatedAt >= today && e.CreatedAt < tomorrow);
            
            _logger.LogInformation("User {UserId} has {Count} checks today", userId, todayCount);
            return todayCount < MaxChecksPerDay;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking rate limit for user {UserId}", userId);
            return false;
        }
    }

    public async Task<EmotionStatsDto> GetEmotionStatsAsync(string userId, string userTimezone = "UTC")
    {
        try
        {
            var emotions = (await _emotionRepository.GetByUserIdAsync(userId)).ToList();
            var now = DateTime.UtcNow;
            var weekAgo = now.AddDays(-7);
            var monthAgo = now.AddDays(-30);

            var weeklyEmotions = emotions.Where(e => e.CreatedAt >= weekAgo).ToList();
            var monthlyEmotions = emotions.Where(e => e.CreatedAt >= monthAgo).ToList();

            var stats = new EmotionStatsDto
            {
                TotalChecks = emotions.Count,
                AverageLevel = emotions.Any() ? Math.Round(emotions.Average(e => e.Level), 2) : 0,
                WeeklyChecks = weeklyEmotions.Count,
                MonthlyChecks = monthlyEmotions.Count,
                WeeklyAverage = weeklyEmotions.Any() ? Math.Round(weeklyEmotions.Average(e => e.Level), 2) : 0,
                MonthlyAverage = monthlyEmotions.Any() ? Math.Round(monthlyEmotions.Average(e => e.Level), 2) : 0,
                StreakDays = CalculateStreakDays(emotions),
                LatestCheck = emotions.OrderByDescending(e => e.CreatedAt).FirstOrDefault() != null 
                    ? MapToResponseDto(emotions.OrderByDescending(e => e.CreatedAt).First(), userTimezone) 
                    : null,
                WeeklyTrend = GenerateWeeklyTrend(weeklyEmotions, userTimezone),
                ContextDistribution = emotions.GroupBy(e => e.Context)
                    .ToDictionary(g => g.Key, g => g.Count())
            };

            return stats;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting emotion stats for user {UserId}", userId);
            throw;
        }
    }

    public async Task<List<EmotionResponseDto>> GetEmotionHistoryAsync(string userId, int page = 1, int pageSize = 50, string userTimezone = "UTC")
    {
        try
        {
            var emotions = (await _emotionRepository.GetByUserIdAsync(userId)).ToList();
            
            var pagedEmotions = emotions
                .OrderByDescending(e => e.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            return pagedEmotions.Select(e => MapToResponseDto(e, userTimezone)).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting emotion history for user {UserId}", userId);
            throw;
        }
    }

    public DateTime ConvertToUserTimezone(DateTime utcDateTime, string userTimezone)
    {
        try
        {
            if (userTimezone == "UTC") return utcDateTime;
            
            var timeZoneInfo = TimeZoneInfo.FindSystemTimeZoneById(userTimezone);
            return TimeZoneInfo.ConvertTimeFromUtc(utcDateTime, timeZoneInfo);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to convert timezone {Timezone}, using UTC", userTimezone);
            return utcDateTime;
        }
    }

    public DateTime ConvertToUtc(DateTime userDateTime, string userTimezone)
    {
        try
        {
            if (userTimezone == "UTC") return userDateTime;
            
            var timeZoneInfo = TimeZoneInfo.FindSystemTimeZoneById(userTimezone);
            return TimeZoneInfo.ConvertTimeToUtc(userDateTime, timeZoneInfo);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to convert timezone {Timezone}, using UTC", userTimezone);
            return userDateTime;
        }
    }

    private int CalculateStreakDays(List<EmotionCheck> emotions)
    {
        if (!emotions.Any()) return 0;

        var distinctDays = emotions
            .Select(e => e.CreatedAt.Date)
            .Distinct()
            .OrderByDescending(d => d)
            .ToList();

        int streak = 0;
        var currentDate = DateTime.UtcNow.Date;

        foreach (var day in distinctDays)
        {
            if (day == currentDate.AddDays(-streak))
            {
                streak++;
            }
            else
            {
                break;
            }
        }

        return streak;
    }

    private List<EmotionTrendDto> GenerateWeeklyTrend(List<EmotionCheck> emotions, string userTimezone)
    {
        var trend = new List<EmotionTrendDto>();
        var today = DateTime.UtcNow.Date;

        for (int i = 6; i >= 0; i--)
        {
            var date = today.AddDays(-i);
            var dayEmotions = emotions.Where(e => e.CreatedAt.Date == date).ToList();
            
            trend.Add(new EmotionTrendDto
            {
                Date = ConvertToUserTimezone(date, userTimezone),
                AverageLevel = dayEmotions.Any() ? Math.Round(dayEmotions.Average(e => e.Level), 2) : 0,
                CheckCount = dayEmotions.Count
            });
        }

        return trend;
    }

    private EmotionResponseDto MapToResponseDto(EmotionCheck emotion, string userTimezone)
    {
        return new EmotionResponseDto
        {
            Id = emotion.Id,
            Level = emotion.Level,
            Context = emotion.Context,
            Symbol = emotion.Symbol,
            Notes = emotion.Notes,
            Timestamp = ConvertToUserTimezone(emotion.Timestamp, userTimezone),
            CreatedAt = ConvertToUserTimezone(emotion.CreatedAt, userTimezone),
            UserId = emotion.UserId
        };
    }
}
