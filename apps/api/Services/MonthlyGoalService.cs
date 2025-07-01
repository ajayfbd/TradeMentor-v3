using Microsoft.EntityFrameworkCore;
using TradeMentor.Api.Data;
using TradeMentor.Api.Models;

namespace TradeMentor.Api.Services;

public class MonthlyGoalService : IMonthlyGoalService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<MonthlyGoalService> _logger;

    public MonthlyGoalService(
        ApplicationDbContext context,
        ILogger<MonthlyGoalService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<MonthlyGoal?> GetMonthlyGoalAsync(string userId, DateTime targetMonth)
    {
        try
        {
            var monthStart = new DateTime(targetMonth.Year, targetMonth.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            
            return await _context.MonthlyGoals
                .Where(mg => mg.UserId == userId && 
                            mg.TargetMonth.Year == monthStart.Year && 
                            mg.TargetMonth.Month == monthStart.Month)
                .FirstOrDefaultAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting monthly goal for user {UserId} and month {TargetMonth}", userId, targetMonth);
            throw;
        }
    }

    public async Task<IEnumerable<MonthlyGoal>> GetUserGoalsAsync(string userId, int limit = 12)
    {
        try
        {
            return await _context.MonthlyGoals
                .Where(mg => mg.UserId == userId)
                .OrderByDescending(mg => mg.TargetMonth)
                .Take(limit)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting goals for user {UserId}", userId);
            throw;
        }
    }

    public async Task<MonthlyGoal> CreateOrUpdateGoalAsync(string userId, MonthlyGoal goal)
    {
        try
        {
            var monthStart = new DateTime(goal.TargetMonth.Year, goal.TargetMonth.Month, 1, 0, 0, 0, DateTimeKind.Utc);

            // Check if goal already exists for this month
            var existingGoal = await GetMonthlyGoalAsync(userId, monthStart);

            if (existingGoal != null)
            {
                // Update existing goal
                existingGoal.Goal = goal.Goal;
                existingGoal.Progress = goal.Progress;
                existingGoal.IsCompleted = goal.IsCompleted;
                existingGoal.UpdatedAt = DateTime.UtcNow;

                _context.MonthlyGoals.Update(existingGoal);
                await _context.SaveChangesAsync();

                return existingGoal;
            }
            else
            {
                // Create new goal
                goal.Id = Guid.NewGuid();
                goal.UserId = userId;
                goal.TargetMonth = monthStart;
                goal.CreatedAt = DateTime.UtcNow;
                goal.UpdatedAt = DateTime.UtcNow;

                _context.MonthlyGoals.Add(goal);
                await _context.SaveChangesAsync();

                return goal;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating/updating monthly goal for user {UserId}", userId);
            throw;
        }
    }

    public async Task<bool> DeleteGoalAsync(string userId, Guid goalId)
    {
        try
        {
            var goal = await _context.MonthlyGoals
                .Where(mg => mg.Id == goalId && mg.UserId == userId)
                .FirstOrDefaultAsync();

            if (goal == null)
                return false;

            _context.MonthlyGoals.Remove(goal);
            await _context.SaveChangesAsync();

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting monthly goal {GoalId} for user {UserId}", goalId, userId);
            throw;
        }
    }

    public async Task<MonthlyGoal?> GetCurrentMonthGoalAsync(string userId)
    {
        var currentMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        return await GetMonthlyGoalAsync(userId, currentMonth);
    }

    public async Task<bool> UpdateGoalProgressAsync(string userId, Guid goalId, int progress)
    {
        try
        {
            // Ensure progress is within valid range
            progress = Math.Max(0, Math.Min(100, progress));

            var goal = await _context.MonthlyGoals
                .Where(mg => mg.Id == goalId && mg.UserId == userId)
                .FirstOrDefaultAsync();

            if (goal == null)
                return false;

            goal.Progress = progress;
            goal.IsCompleted = progress >= 100;
            goal.UpdatedAt = DateTime.UtcNow;

            _context.MonthlyGoals.Update(goal);
            await _context.SaveChangesAsync();

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating goal progress for goal {GoalId} and user {UserId}", goalId, userId);
            throw;
        }
    }

    public async Task<bool> MarkGoalCompletedAsync(string userId, Guid goalId)
    {
        try
        {
            var goal = await _context.MonthlyGoals
                .Where(mg => mg.Id == goalId && mg.UserId == userId)
                .FirstOrDefaultAsync();

            if (goal == null)
                return false;

            goal.IsCompleted = true;
            goal.Progress = 100;
            goal.UpdatedAt = DateTime.UtcNow;

            _context.MonthlyGoals.Update(goal);
            await _context.SaveChangesAsync();

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking goal completed for goal {GoalId} and user {UserId}", goalId, userId);
            throw;
        }
    }

    public async Task<IEnumerable<MonthlyGoal>> GetCompletedGoalsAsync(string userId)
    {
        try
        {
            return await _context.MonthlyGoals
                .Where(mg => mg.UserId == userId && mg.IsCompleted)
                .OrderByDescending(mg => mg.TargetMonth)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting completed goals for user {UserId}", userId);
            throw;
        }
    }

    public async Task<IEnumerable<MonthlyGoal>> GetPendingGoalsAsync(string userId)
    {
        try
        {
            return await _context.MonthlyGoals
                .Where(mg => mg.UserId == userId && !mg.IsCompleted)
                .OrderByDescending(mg => mg.TargetMonth)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting pending goals for user {UserId}", userId);
            throw;
        }
    }
}
