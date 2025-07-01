using Microsoft.EntityFrameworkCore;
using TradeMentor.Api.Data;
using TradeMentor.Api.Models;

namespace TradeMentor.Api.Services;

public class WeeklyReflectionService : IWeeklyReflectionService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<WeeklyReflectionService> _logger;

    public WeeklyReflectionService(
        ApplicationDbContext context,
        ILogger<WeeklyReflectionService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<WeeklyReflection?> GetWeeklyReflectionAsync(string userId, DateTime weekStartDate)
    {
        try
        {
            var startOfWeek = GetStartOfWeek(weekStartDate);
            
            return await _context.WeeklyReflections
                .Where(wr => wr.UserId == userId && wr.WeekStartDate.Date == startOfWeek.Date)
                .FirstOrDefaultAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting weekly reflection for user {UserId} and week {WeekStart}", userId, weekStartDate);
            throw;
        }
    }

    public async Task<IEnumerable<WeeklyReflection>> GetUserReflectionsAsync(string userId, int limit = 10)
    {
        try
        {
            return await _context.WeeklyReflections
                .Where(wr => wr.UserId == userId)
                .OrderByDescending(wr => wr.WeekStartDate)
                .Take(limit)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting reflections for user {UserId}", userId);
            throw;
        }
    }

    public async Task<WeeklyReflection> CreateOrUpdateReflectionAsync(string userId, WeeklyReflection reflection)
    {
        try
        {
            var startOfWeek = GetStartOfWeek(reflection.WeekStartDate);
            var endOfWeek = startOfWeek.AddDays(6);

            // Check if reflection already exists for this week
            var existingReflection = await GetWeeklyReflectionAsync(userId, startOfWeek);

            if (existingReflection != null)
            {
                // Update existing reflection
                existingReflection.Wins = reflection.Wins;
                existingReflection.Losses = reflection.Losses;
                existingReflection.Lessons = reflection.Lessons;
                existingReflection.EmotionalInsights = reflection.EmotionalInsights;
                existingReflection.NextWeekGoals = reflection.NextWeekGoals;
                existingReflection.UpdatedAt = DateTime.UtcNow;

                _context.WeeklyReflections.Update(existingReflection);
                await _context.SaveChangesAsync();

                // Calculate metrics after saving
                await CalculateWeeklyMetricsAsync(userId, existingReflection.Id);

                return existingReflection;
            }
            else
            {
                // Create new reflection
                reflection.Id = Guid.NewGuid();
                reflection.UserId = userId;
                reflection.WeekStartDate = startOfWeek;
                reflection.WeekEndDate = endOfWeek;
                reflection.CreatedAt = DateTime.UtcNow;
                reflection.UpdatedAt = DateTime.UtcNow;

                _context.WeeklyReflections.Add(reflection);
                await _context.SaveChangesAsync();

                // Calculate metrics after saving
                await CalculateWeeklyMetricsAsync(userId, reflection.Id);

                return reflection;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating/updating weekly reflection for user {UserId}", userId);
            throw;
        }
    }

    public async Task<bool> DeleteReflectionAsync(string userId, Guid reflectionId)
    {
        try
        {
            var reflection = await _context.WeeklyReflections
                .Where(wr => wr.Id == reflectionId && wr.UserId == userId)
                .FirstOrDefaultAsync();

            if (reflection == null)
                return false;

            _context.WeeklyReflections.Remove(reflection);
            await _context.SaveChangesAsync();

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting weekly reflection {ReflectionId} for user {UserId}", reflectionId, userId);
            throw;
        }
    }

    public async Task<WeeklyReflection?> GetCurrentWeekReflectionAsync(string userId)
    {
        var currentWeekStart = GetStartOfWeek(DateTime.UtcNow);
        return await GetWeeklyReflectionAsync(userId, currentWeekStart);
    }

    public async Task<WeeklyReflection?> GetPreviousWeekReflectionAsync(string userId)
    {
        var previousWeekStart = GetStartOfWeek(DateTime.UtcNow).AddDays(-7);
        return await GetWeeklyReflectionAsync(userId, previousWeekStart);
    }

    public async Task CalculateWeeklyMetricsAsync(string userId, Guid reflectionId)
    {
        try
        {
            var reflection = await _context.WeeklyReflections
                .Where(wr => wr.Id == reflectionId && wr.UserId == userId)
                .FirstOrDefaultAsync();

            if (reflection == null)
                return;

            // Get trades for the week
            var trades = await _context.Trades
                .Where(t => t.UserId == userId && 
                           t.EntryTime >= reflection.WeekStartDate && 
                           t.EntryTime <= reflection.WeekEndDate)
                .ToListAsync();

            // Get emotion checks for the week  
            var emotionChecks = await _context.EmotionChecks
                .Where(ec => ec.UserId == userId && 
                            ec.Timestamp >= reflection.WeekStartDate && 
                            ec.Timestamp <= reflection.WeekEndDate)
                .ToListAsync();

            // Calculate metrics
            reflection.TotalTrades = trades.Count;
            
            if (trades.Any())
            {
                var winningTrades = trades.Count(t => t.Outcome == "win");
                reflection.WinRate = Math.Round((decimal)winningTrades / trades.Count * 100, 2);
                reflection.TotalPnL = trades.Sum(t => t.Pnl);
            }
            else
            {
                reflection.WinRate = null;
                reflection.TotalPnL = null;
            }

            if (emotionChecks.Any())
            {
                reflection.AverageEmotionLevel = Math.Round((decimal)emotionChecks.Average(ec => ec.Level), 1);
            }
            else
            {
                reflection.AverageEmotionLevel = null;
            }

            reflection.UpdatedAt = DateTime.UtcNow;
            
            _context.WeeklyReflections.Update(reflection);
            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating weekly metrics for reflection {ReflectionId}", reflectionId);
            throw;
        }
    }

    private static DateTime GetStartOfWeek(DateTime date)
    {
        // Get Monday as start of week
        var diff = (7 + (date.DayOfWeek - DayOfWeek.Monday)) % 7;
        return date.AddDays(-1 * diff).Date;
    }
}
