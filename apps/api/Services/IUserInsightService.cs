using System.Text.Json;
using TradeMentor.Api.Models;

namespace TradeMentor.Api.Services;

public interface IUserInsightService
{
    Task<UserInsight> CreateInsightAsync(string userId, string insightType, string title, string description, object? data = null, decimal confidenceScore = 0);
    Task<IEnumerable<UserInsight>> GetInsightsForUserAsync(string userId, string? insightType = null, bool? isActive = true);
    Task<UserInsight?> GetInsightByIdAsync(Guid insightId);
    Task<UserInsight> UpdateInsightAsync(Guid insightId, string? title = null, string? description = null, bool? isActive = null);
    Task DeleteInsightAsync(Guid insightId);
    Task<IEnumerable<UserInsight>> GetTopInsightsAsync(string userId, int count = 5);
    Task<UserInsight> GeneratePerformanceCorrelationInsightAsync(string userId);
    Task<UserInsight> GenerateBestTimesInsightAsync(string userId);
    Task<UserInsight> GenerateEmotionPatternInsightAsync(string userId);
    Task<UserInsight> GenerateStreakMilestoneInsightAsync(string userId);
}
