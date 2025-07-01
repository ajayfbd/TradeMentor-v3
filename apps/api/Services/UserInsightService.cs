using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using TradeMentor.Api.Data;
using TradeMentor.Api.Models;

namespace TradeMentor.Api.Services;

public class UserInsightService : IUserInsightService
{
    private readonly ApplicationDbContext _context;

    public UserInsightService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<UserInsight> CreateInsightAsync(string userId, string insightType, string title, string description, object? data = null, decimal confidenceScore = 0)
    {
        var insight = new UserInsight
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            InsightType = insightType,
            Title = title,
            Description = description,
            Data = data != null ? JsonDocument.Parse(JsonSerializer.Serialize(data)) : null,
            ConfidenceScore = Math.Max(0, Math.Min(10, confidenceScore)),
            GeneratedAt = DateTime.UtcNow,
            IsActive = true
        };

        _context.UserInsights.Add(insight);
        await _context.SaveChangesAsync();

        return insight;
    }

    public async Task<IEnumerable<UserInsight>> GetInsightsForUserAsync(string userId, string? insightType = null, bool? isActive = true)
    {
        var query = _context.UserInsights.Where(i => i.UserId == userId);

        if (!string.IsNullOrEmpty(insightType))
        {
            query = query.Where(i => i.InsightType == insightType);
        }

        if (isActive.HasValue)
        {
            query = query.Where(i => i.IsActive == isActive.Value);
        }

        return await query.OrderByDescending(i => i.GeneratedAt).ToListAsync();
    }

    public async Task<UserInsight?> GetInsightByIdAsync(Guid insightId)
    {
        return await _context.UserInsights.FindAsync(insightId);
    }

    public async Task<UserInsight> UpdateInsightAsync(Guid insightId, string? title = null, string? description = null, bool? isActive = null)
    {
        var insight = await _context.UserInsights.FindAsync(insightId);
        if (insight == null)
        {
            throw new ArgumentException("Insight not found", nameof(insightId));
        }

        if (!string.IsNullOrEmpty(title))
        {
            insight.Title = title;
        }

        if (!string.IsNullOrEmpty(description))
        {
            insight.Description = description;
        }

        if (isActive.HasValue)
        {
            insight.IsActive = isActive.Value;
        }

        _context.UserInsights.Update(insight);
        await _context.SaveChangesAsync();

        return insight;
    }

    public async Task DeleteInsightAsync(Guid insightId)
    {
        var insight = await _context.UserInsights.FindAsync(insightId);
        if (insight != null)
        {
            _context.UserInsights.Remove(insight);
            await _context.SaveChangesAsync();
        }
    }

    public async Task<IEnumerable<UserInsight>> GetTopInsightsAsync(string userId, int count = 5)
    {
        return await _context.UserInsights
            .Where(i => i.UserId == userId && i.IsActive)
            .OrderByDescending(i => i.ConfidenceScore)
            .ThenByDescending(i => i.GeneratedAt)
            .Take(count)
            .ToListAsync();
    }

    public async Task<UserInsight> GeneratePerformanceCorrelationInsightAsync(string userId)
    {
        // Get user's emotion checks and trades for analysis
        var emotionChecks = await _context.EmotionChecks
            .Where(e => e.UserId == userId)
            .OrderByDescending(e => e.Timestamp)
            .Take(100)
            .ToListAsync();

        var trades = await _context.Trades
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.EntryTime)
            .Take(100)
            .ToListAsync();

        // Simple correlation analysis
        var winningTrades = trades.Where(t => t.Outcome == TradeOutcome.Win).ToList();
        var losingTrades = trades.Where(t => t.Outcome == TradeOutcome.Loss).ToList();

        var avgWinEmotionLevel = 0.0;
        var avgLossEmotionLevel = 0.0;

        if (winningTrades.Any())
        {
            var winEmotions = emotionChecks.Where(e => winningTrades.Any(t => Math.Abs((t.EntryTime - e.Timestamp).TotalHours) < 1)).ToList();
            avgWinEmotionLevel = winEmotions.Any() ? winEmotions.Average(e => e.Level) : 0;
        }

        if (losingTrades.Any())
        {
            var lossEmotions = emotionChecks.Where(e => losingTrades.Any(t => Math.Abs((t.EntryTime - e.Timestamp).TotalHours) < 1)).ToList();
            avgLossEmotionLevel = lossEmotions.Any() ? lossEmotions.Average(e => e.Level) : 0;
        }

        var data = new
        {
            WinningTradesCount = winningTrades.Count,
            LosingTradesCount = losingTrades.Count,
            AvgWinEmotionLevel = avgWinEmotionLevel,
            AvgLossEmotionLevel = avgLossEmotionLevel,
            Correlation = Math.Abs(avgWinEmotionLevel - avgLossEmotionLevel)
        };

        var insight = "Your emotional state shows ";
        var confidenceScore = 5.0m;

        if (avgWinEmotionLevel > avgLossEmotionLevel + 1)
        {
            insight += $"higher emotion levels ({avgWinEmotionLevel:F1}) during winning trades compared to losing trades ({avgLossEmotionLevel:F1}). Consider maintaining this emotional state for better performance.";
            confidenceScore = 7.5m;
        }
        else if (avgLossEmotionLevel > avgWinEmotionLevel + 1)
        {
            insight += $"lower emotion levels ({avgWinEmotionLevel:F1}) during winning trades compared to losing trades ({avgLossEmotionLevel:F1}). Try to stay calm for better trading outcomes.";
            confidenceScore = 7.5m;
        }
        else
        {
            insight += "similar emotion levels during winning and losing trades. Focus on other factors that might affect your performance.";
            confidenceScore = 4.0m;
        }

        return await CreateInsightAsync(userId, UserInsightType.PerformanceCorrelation, "Emotion-Performance Correlation", insight, data, confidenceScore);
    }

    public async Task<UserInsight> GenerateBestTimesInsightAsync(string userId)
    {
        var trades = await _context.Trades
            .Where(t => t.UserId == userId)
            .ToListAsync();

        if (!trades.Any())
        {
            return await CreateInsightAsync(userId, UserInsightType.BestTimes, "Trading Times Analysis", "Not enough trade data to analyze optimal trading times.", null, 2.0m);
        }

        var hourlyPerformance = trades
            .GroupBy(t => t.EntryTime.Hour)
            .Select(g => new
            {
                Hour = g.Key,
                TotalTrades = g.Count(),
                WinRate = g.Count(t => t.Outcome == TradeOutcome.Win) / (double)g.Count() * 100,
                AvgPnL = g.Where(t => t.Pnl.HasValue).Average(t => t.Pnl ?? 0)
            })
            .OrderByDescending(h => h.WinRate)
            .ToList();

        var bestHour = hourlyPerformance.FirstOrDefault();
        var worstHour = hourlyPerformance.LastOrDefault();

        var data = new
        {
            HourlyPerformance = hourlyPerformance,
            BestHour = bestHour,
            WorstHour = worstHour
        };

        var insight = bestHour != null
            ? $"Your best trading performance is at {bestHour.Hour}:00 with a {bestHour.WinRate:F1}% win rate. " +
              $"Consider focusing your trading activity around this time."
            : "Unable to determine optimal trading times from available data.";

        return await CreateInsightAsync(userId, UserInsightType.BestTimes, "Optimal Trading Times", insight, data, 6.5m);
    }

    public async Task<UserInsight> GenerateEmotionPatternInsightAsync(string userId)
    {
        var emotionChecks = await _context.EmotionChecks
            .Where(e => e.UserId == userId && !string.IsNullOrEmpty(e.PrimaryEmotion))
            .OrderByDescending(e => e.Timestamp)
            .Take(50)
            .ToListAsync();

        if (!emotionChecks.Any())
        {
            return await CreateInsightAsync(userId, UserInsightType.EmotionPattern, "Emotion Pattern Analysis", "Not enough emotion data to analyze patterns.", null, 2.0m);
        }

        var emotionFrequency = emotionChecks
            .GroupBy(e => e.PrimaryEmotion)
            .Select(g => new
            {
                Emotion = g.Key,
                Count = g.Count(),
                Percentage = g.Count() / (double)emotionChecks.Count * 100,
                AvgIntensity = g.Where(e => e.Intensity.HasValue).Average(e => e.Intensity ?? 0)
            })
            .OrderByDescending(e => e.Count)
            .ToList();

        var dominantEmotion = emotionFrequency.FirstOrDefault();

        var data = new
        {
            TotalEmotionChecks = emotionChecks.Count,
            EmotionFrequency = emotionFrequency,
            DominantEmotion = dominantEmotion
        };

        var insight = dominantEmotion != null
            ? $"Your dominant emotion during trading is '{dominantEmotion.Emotion}' ({dominantEmotion.Percentage:F1}% of the time). " +
              $"Understanding this pattern can help you develop better emotional management strategies."
            : "Your emotions show good variety during trading sessions.";

        return await CreateInsightAsync(userId, UserInsightType.EmotionPattern, "Emotion Pattern Analysis", insight, data, 7.0m);
    }

    public async Task<UserInsight> GenerateStreakMilestoneInsightAsync(string userId)
    {
        var sessions = await _context.UserSessions
            .Where(s => s.UserId == userId)
            .OrderByDescending(s => s.Date)
            .ToListAsync();

        if (!sessions.Any())
        {
            return await CreateInsightAsync(userId, UserInsightType.StreakMilestone, "Streak Milestone", "Start logging emotions and trades to build your consistency streak!", null, 3.0m);
        }

        var currentStreakCount = 0;
        var maxStreakCount = 0;
        var tempStreakCount = 0;
        var currentDate = DateOnly.FromDateTime(DateTime.UtcNow);

        // Calculate current streak
        foreach (var session in sessions.OrderByDescending(s => s.Date))
        {
            if (session.Date == currentDate || (currentStreakCount > 0 && session.Date == currentDate.AddDays(-currentStreakCount - 1)))
            {
                currentStreakCount++;
                currentDate = session.Date.AddDays(-1);
            }
            else
            {
                break;
            }
        }

        // Calculate max streak
        foreach (var session in sessions.OrderBy(s => s.Date))
        {
            var expectedDate = sessions.Min(s => s.Date).AddDays(tempStreakCount);
            if (session.Date == expectedDate)
            {
                tempStreakCount++;
                maxStreakCount = Math.Max(maxStreakCount, tempStreakCount);
            }
            else
            {
                tempStreakCount = 1;
            }
        }

        var data = new
        {
            CurrentStreak = currentStreakCount,
            MaxStreak = maxStreakCount,
            TotalSessions = sessions.Count
        };

        var insight = "";
        var confidenceScore = 8.0m;

        if (currentStreakCount >= 7)
        {
            insight = $"🔥 Amazing! You've maintained a {currentStreakCount}-day consistency streak! Keep up the excellent work.";
        }
        else if (currentStreakCount >= 3)
        {
            insight = $"Great job! You're on a {currentStreakCount}-day streak. You're building strong trading habits.";
        }
        else if (maxStreakCount >= 7)
        {
            insight = $"You've achieved a {maxStreakCount}-day streak before. You can do it again! Current streak: {currentStreakCount} days.";
        }
        else
        {
            insight = $"Current streak: {currentStreakCount} days. Focus on daily consistency to build stronger trading habits.";
            confidenceScore = 5.0m;
        }

        return await CreateInsightAsync(userId, UserInsightType.StreakMilestone, "Consistency Streak", insight, data, confidenceScore);
    }
}
