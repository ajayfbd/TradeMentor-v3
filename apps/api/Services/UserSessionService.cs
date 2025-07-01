using Microsoft.EntityFrameworkCore;
using TradeMentor.Api.Data;
using TradeMentor.Api.Models;

namespace TradeMentor.Api.Services;

public class UserSessionService : IUserSessionService
{
    private readonly ApplicationDbContext _context;

    public UserSessionService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<UserSession?> GetSessionByDateAsync(string userId, DateOnly date)
    {
        return await _context.UserSessions
            .FirstOrDefaultAsync(s => s.UserId == userId && s.Date == date);
    }

    public async Task<IEnumerable<UserSession>> GetSessionsForUserAsync(string userId, DateTime? startDate = null, DateTime? endDate = null)
    {
        var query = _context.UserSessions.Where(s => s.UserId == userId);

        if (startDate.HasValue)
        {
            var startDateOnly = DateOnly.FromDateTime(startDate.Value);
            query = query.Where(s => s.Date >= startDateOnly);
        }

        if (endDate.HasValue)
        {
            var endDateOnly = DateOnly.FromDateTime(endDate.Value);
            query = query.Where(s => s.Date <= endDateOnly);
        }

        return await query.OrderByDescending(s => s.Date).ToListAsync();
    }

    public async Task<UserSession> CreateOrUpdateSessionAsync(string userId, DateOnly date, int emotionsLogged = 0, int tradesLogged = 0)
    {
        var existingSession = await GetSessionByDateAsync(userId, date);

        if (existingSession != null)
        {
            existingSession.EmotionsLogged += emotionsLogged;
            existingSession.TradesLogged += tradesLogged;
            _context.UserSessions.Update(existingSession);
        }
        else
        {
            existingSession = new UserSession
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Date = date,
                EmotionsLogged = emotionsLogged,
                TradesLogged = tradesLogged,
                CreatedAt = DateTime.UtcNow
            };
            _context.UserSessions.Add(existingSession);
        }

        await _context.SaveChangesAsync();
        return existingSession;
    }

    public async Task<UserSession> UpdateSessionQualityScoreAsync(Guid sessionId, decimal qualityScore)
    {
        var session = await _context.UserSessions.FindAsync(sessionId);
        if (session == null)
        {
            throw new ArgumentException("Session not found", nameof(sessionId));
        }

        session.SessionQualityScore = Math.Max(0, Math.Min(10, qualityScore)); // Ensure 0-10 range
        _context.UserSessions.Update(session);
        await _context.SaveChangesAsync();

        return session;
    }

    public async Task<IEnumerable<UserSession>> GetSessionStreakAsync(string userId)
    {
        var sessions = await _context.UserSessions
            .Where(s => s.UserId == userId)
            .OrderByDescending(s => s.Date)
            .ToListAsync();

        var streak = new List<UserSession>();
        var currentDate = DateOnly.FromDateTime(DateTime.UtcNow);

        foreach (var session in sessions)
        {
            if (session.Date == currentDate || (streak.Any() && session.Date == streak.Last().Date.AddDays(-1)))
            {
                streak.Add(session);
                currentDate = session.Date.AddDays(-1);
            }
            else
            {
                break;
            }
        }

        return streak.OrderBy(s => s.Date);
    }

    public async Task<decimal> GetAverageSessionQualityAsync(string userId, DateTime? startDate = null, DateTime? endDate = null)
    {
        var query = _context.UserSessions
            .Where(s => s.UserId == userId && s.SessionQualityScore.HasValue);

        if (startDate.HasValue)
        {
            var startDateOnly = DateOnly.FromDateTime(startDate.Value);
            query = query.Where(s => s.Date >= startDateOnly);
        }

        if (endDate.HasValue)
        {
            var endDateOnly = DateOnly.FromDateTime(endDate.Value);
            query = query.Where(s => s.Date <= endDateOnly);
        }

        var sessions = await query.ToListAsync();
        return sessions.Any() ? sessions.Average(s => s.SessionQualityScore!.Value) : 0;
    }
}
