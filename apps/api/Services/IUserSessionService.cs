using TradeMentor.Api.Models;

namespace TradeMentor.Api.Services;

public interface IUserSessionService
{
    Task<UserSession?> GetSessionByDateAsync(string userId, DateOnly date);
    Task<IEnumerable<UserSession>> GetSessionsForUserAsync(string userId, DateTime? startDate = null, DateTime? endDate = null);
    Task<UserSession> CreateOrUpdateSessionAsync(string userId, DateOnly date, int emotionsLogged = 0, int tradesLogged = 0);
    Task<UserSession> UpdateSessionQualityScoreAsync(Guid sessionId, decimal qualityScore);
    Task<IEnumerable<UserSession>> GetSessionStreakAsync(string userId);
    Task<decimal> GetAverageSessionQualityAsync(string userId, DateTime? startDate = null, DateTime? endDate = null);
}
