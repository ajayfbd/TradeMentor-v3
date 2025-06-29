using Microsoft.EntityFrameworkCore;
using TradeMentor.Api.Models;

namespace TradeMentor.Api.Data.Repositories;

public class Repository<T> : IRepository<T> where T : class
{
    protected readonly ApplicationDbContext _context;
    protected readonly DbSet<T> _dbSet;

    public Repository(ApplicationDbContext context)
    {
        _context = context;
        _dbSet = context.Set<T>();
    }

    public virtual async Task<T?> GetByIdAsync(Guid id)
    {
        return await _dbSet.FindAsync(id);
    }

    public virtual async Task<IEnumerable<T>> GetAllAsync()
    {
        return await _dbSet.ToListAsync();
    }

    public virtual async Task<T> AddAsync(T entity)
    {
        await _dbSet.AddAsync(entity);
        await _context.SaveChangesAsync();
        return entity;
    }

    public virtual async Task<T> UpdateAsync(T entity)
    {
        _dbSet.Update(entity);
        await _context.SaveChangesAsync();
        return entity;
    }

    public virtual async Task DeleteAsync(Guid id)
    {
        var entity = await GetByIdAsync(id);
        if (entity != null)
        {
            _dbSet.Remove(entity);
            await _context.SaveChangesAsync();
        }
    }

    public virtual async Task<bool> ExistsAsync(Guid id)
    {
        return await _dbSet.FindAsync(id) != null;
    }
}

public class UserRepository : Repository<User>, IUserRepository
{
    public UserRepository(ApplicationDbContext context) : base(context) { }

    public async Task<User?> GetByEmailAsync(string email)
    {
        return await _dbSet.FirstOrDefaultAsync(u => u.Email == email);
    }

    public async Task<bool> EmailExistsAsync(string email)
    {
        return await _dbSet.AnyAsync(u => u.Email == email);
    }

    public async Task<IEnumerable<User>> GetActiveUsersAsync()
    {
        return await _dbSet.Where(u => u.IsActive).ToListAsync();
    }
}

public class EmotionCheckRepository : Repository<EmotionCheck>, IEmotionCheckRepository
{
    public EmotionCheckRepository(ApplicationDbContext context) : base(context) { }

    public async Task<IEnumerable<EmotionCheck>> GetByUserIdAsync(string userId)
    {
        return await _dbSet
            .Where(e => e.UserId == userId)
            .OrderByDescending(e => e.Timestamp)
            .ToListAsync();
    }

    public async Task<IEnumerable<EmotionCheck>> GetByUserIdAndDateRangeAsync(string userId, DateTime startDate, DateTime endDate)
    {
        return await _dbSet
            .Where(e => e.UserId == userId && e.Timestamp >= startDate && e.Timestamp <= endDate)
            .OrderByDescending(e => e.Timestamp)
            .ToListAsync();
    }

    public async Task<EmotionCheck?> GetLatestByUserIdAsync(string userId)
    {
        return await _dbSet
            .Where(e => e.UserId == userId)
            .OrderByDescending(e => e.Timestamp)
            .FirstOrDefaultAsync();
    }

    public async Task<IEnumerable<EmotionCheck>> GetByContextAsync(string context)
    {
        return await _dbSet
            .Where(e => e.Context == context)
            .OrderByDescending(e => e.Timestamp)
            .ToListAsync();
    }

    public async Task<double> GetAverageEmotionLevelByUserAsync(string userId, DateTime startDate, DateTime endDate)
    {
        var emotions = await _dbSet
            .Where(e => e.UserId == userId && e.Timestamp >= startDate && e.Timestamp <= endDate)
            .ToListAsync();

        return emotions.Any() ? emotions.Average(e => e.Level) : 0;
    }
}

public class TradeRepository : Repository<Trade>, ITradeRepository
{
    public TradeRepository(ApplicationDbContext context) : base(context) { }

    public async Task<IEnumerable<Trade>> GetByUserIdAsync(string userId)
    {
        return await _dbSet
            .Where(t => t.UserId == userId)
            .Include(t => t.EmotionCheck)
            .OrderByDescending(t => t.EntryTime)
            .ToListAsync();
    }

    public async Task<IEnumerable<Trade>> GetByUserIdAndDateRangeAsync(string userId, DateTime startDate, DateTime endDate)
    {
        return await _dbSet
            .Where(t => t.UserId == userId && t.EntryTime >= startDate && t.EntryTime <= endDate)
            .Include(t => t.EmotionCheck)
            .OrderByDescending(t => t.EntryTime)
            .ToListAsync();
    }

    public async Task<IEnumerable<Trade>> GetBySymbolAsync(string symbol)
    {
        return await _dbSet
            .Where(t => t.Symbol == symbol)
            .Include(t => t.EmotionCheck)
            .OrderByDescending(t => t.EntryTime)
            .ToListAsync();
    }

    public async Task<IEnumerable<Trade>> GetByOutcomeAsync(string outcome)
    {
        return await _dbSet
            .Where(t => t.Outcome == outcome)
            .Include(t => t.EmotionCheck)
            .OrderByDescending(t => t.EntryTime)
            .ToListAsync();
    }

    public async Task<decimal> GetTotalPnlByUserAsync(string userId)
    {
        var trades = await _dbSet
            .Where(t => t.UserId == userId && t.Pnl.HasValue)
            .ToListAsync();

        return trades.Sum(t => t.Pnl ?? 0);
    }

    public async Task<double> GetWinRateByUserAsync(string userId)
    {
        var trades = await _dbSet
            .Where(t => t.UserId == userId)
            .ToListAsync();

        if (!trades.Any()) return 0;

        var wins = trades.Count(t => t.Outcome == TradeOutcome.Win);
        return (double)wins / trades.Count * 100;
    }
}
