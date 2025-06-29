using TradeMentor.Api.Models;

namespace TradeMentor.Api.Data.Repositories;

public interface IRepository<T> where T : class
{
    Task<T?> GetByIdAsync(Guid id);
    Task<IEnumerable<T>> GetAllAsync();
    Task<T> AddAsync(T entity);
    Task<T> UpdateAsync(T entity);
    Task DeleteAsync(Guid id);
    Task<bool> ExistsAsync(Guid id);
}

public interface IUserRepository : IRepository<User>
{
    Task<User?> GetByEmailAsync(string email);
    Task<bool> EmailExistsAsync(string email);
    Task<IEnumerable<User>> GetActiveUsersAsync();
}

public interface IEmotionCheckRepository : IRepository<EmotionCheck>
{
    Task<IEnumerable<EmotionCheck>> GetByUserIdAsync(string userId);
    Task<IEnumerable<EmotionCheck>> GetByUserIdAndDateRangeAsync(string userId, DateTime startDate, DateTime endDate);
    Task<EmotionCheck?> GetLatestByUserIdAsync(string userId);
    Task<IEnumerable<EmotionCheck>> GetByContextAsync(string context);
    Task<double> GetAverageEmotionLevelByUserAsync(string userId, DateTime startDate, DateTime endDate);
}

public interface ITradeRepository : IRepository<Trade>
{
    Task<IEnumerable<Trade>> GetByUserIdAsync(string userId);
    Task<IEnumerable<Trade>> GetByUserIdAndDateRangeAsync(string userId, DateTime startDate, DateTime endDate);
    Task<IEnumerable<Trade>> GetBySymbolAsync(string symbol);
    Task<IEnumerable<Trade>> GetByOutcomeAsync(string outcome);
    Task<decimal> GetTotalPnlByUserAsync(string userId);
    Task<double> GetWinRateByUserAsync(string userId);
}
