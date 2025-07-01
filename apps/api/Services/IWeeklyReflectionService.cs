using TradeMentor.Api.Models;

namespace TradeMentor.Api.Services;

public interface IWeeklyReflectionService
{
    Task<WeeklyReflection?> GetWeeklyReflectionAsync(string userId, DateTime weekStartDate);
    Task<IEnumerable<WeeklyReflection>> GetUserReflectionsAsync(string userId, int limit = 10);
    Task<WeeklyReflection> CreateOrUpdateReflectionAsync(string userId, WeeklyReflection reflection);
    Task<bool> DeleteReflectionAsync(string userId, Guid reflectionId);
    Task<WeeklyReflection?> GetCurrentWeekReflectionAsync(string userId);
    Task<WeeklyReflection?> GetPreviousWeekReflectionAsync(string userId);
    Task CalculateWeeklyMetricsAsync(string userId, Guid reflectionId);
}
