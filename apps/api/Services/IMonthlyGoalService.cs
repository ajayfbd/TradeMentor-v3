using TradeMentor.Api.Models;

namespace TradeMentor.Api.Services;

public interface IMonthlyGoalService
{
    Task<MonthlyGoal?> GetMonthlyGoalAsync(string userId, DateTime targetMonth);
    Task<IEnumerable<MonthlyGoal>> GetUserGoalsAsync(string userId, int limit = 12);
    Task<MonthlyGoal> CreateOrUpdateGoalAsync(string userId, MonthlyGoal goal);
    Task<bool> DeleteGoalAsync(string userId, Guid goalId);
    Task<MonthlyGoal?> GetCurrentMonthGoalAsync(string userId);
    Task<bool> UpdateGoalProgressAsync(string userId, Guid goalId, int progress);
    Task<bool> MarkGoalCompletedAsync(string userId, Guid goalId);
    Task<IEnumerable<MonthlyGoal>> GetCompletedGoalsAsync(string userId);
    Task<IEnumerable<MonthlyGoal>> GetPendingGoalsAsync(string userId);
}
