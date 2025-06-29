using api.Models;
using api.DTOs;
using api.Data;
using Microsoft.EntityFrameworkCore;

namespace api.Services
{
    public interface IPatternService
    {
        Task<EmotionPatternDto> GetEmotionPatternsAsync(Guid userId, DateTime? startDate = null, DateTime? endDate = null);
        Task<PerformanceCorrelationDto> GetPerformanceCorrelationAsync(Guid userId, DateTime? startDate = null, DateTime? endDate = null);
        Task<List<WeeklyTrendDto>> GetWeeklyTrendsAsync(Guid userId, int weeks = 4);
        Task<List<EmotionDistributionDto>> GetEmotionDistributionAsync(Guid userId, DateTime? startDate = null, DateTime? endDate = null);
    }

    public class PatternService : IPatternService
    {
        private readonly ApplicationDbContext _context;

        public PatternService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<EmotionPatternDto> GetEmotionPatternsAsync(Guid userId, DateTime? startDate = null, DateTime? endDate = null)
        {
            var query = _context.EmotionChecks
                .Where(e => e.UserId == userId);

            if (startDate.HasValue)
                query = query.Where(e => e.Timestamp >= startDate.Value);
            
            if (endDate.HasValue)
                query = query.Where(e => e.Timestamp <= endDate.Value);

            var emotions = await query.ToListAsync();

            if (!emotions.Any())
            {
                return new EmotionPatternDto
                {
                    AverageEmotion = 0,
                    MostCommonEmotion = 0,
                    EmotionVolatility = 0,
                    TotalChecks = 0
                };
            }

            var averageEmotion = emotions.Average(e => e.Level);
            var mostCommonEmotion = emotions
                .GroupBy(e => e.Level)
                .OrderByDescending(g => g.Count())
                .First().Key;

            // Calculate emotional volatility (standard deviation)
            var variance = emotions.Sum(e => Math.Pow(e.Level - averageEmotion, 2)) / emotions.Count;
            var volatility = Math.Sqrt(variance);

            return new EmotionPatternDto
            {
                AverageEmotion = Math.Round(averageEmotion, 2),
                MostCommonEmotion = mostCommonEmotion,
                EmotionVolatility = Math.Round(volatility, 2),
                TotalChecks = emotions.Count
            };
        }

        public async Task<PerformanceCorrelationDto> GetPerformanceCorrelationAsync(Guid userId, DateTime? startDate = null, DateTime? endDate = null)
        {
            var query = from trade in _context.Trades
                        join emotion in _context.EmotionChecks on trade.EmotionCheckId equals emotion.Id
                        where trade.UserId == userId
                        select new { trade, emotion };

            if (startDate.HasValue)
                query = query.Where(x => x.trade.Timestamp >= startDate.Value);
            
            if (endDate.HasValue)
                query = query.Where(x => x.trade.Timestamp <= endDate.Value);

            var tradeEmotions = await query.ToListAsync();

            if (!tradeEmotions.Any())
            {
                return new PerformanceCorrelationDto
                {
                    WinRateByEmotion = new Dictionary<int, double>(),
                    AvgPnlByEmotion = new Dictionary<int, decimal>(),
                    BestPerformingEmotionRange = "No data",
                    WorstPerformingEmotionRange = "No data"
                };
            }

            // Group by emotion level and calculate win rate and average P&L
            var emotionGroups = tradeEmotions
                .GroupBy(x => x.emotion.Level)
                .ToDictionary(
                    g => g.Key,
                    g => new
                    {
                        WinRate = g.Count(x => x.trade.Outcome == "win") / (double)g.Count() * 100,
                        AvgPnl = g.Average(x => x.trade.Pnl ?? 0)
                    }
                );

            var winRateByEmotion = emotionGroups.ToDictionary(kvp => kvp.Key, kvp => Math.Round(kvp.Value.WinRate, 2));
            var avgPnlByEmotion = emotionGroups.ToDictionary(kvp => kvp.Key, kvp => Math.Round(kvp.Value.AvgPnl, 2));

            // Find best and worst performing emotion ranges
            var bestEmotion = emotionGroups.OrderByDescending(kvp => kvp.Value.AvgPnl).First();
            var worstEmotion = emotionGroups.OrderBy(kvp => kvp.Value.AvgPnl).First();

            return new PerformanceCorrelationDto
            {
                WinRateByEmotion = winRateByEmotion,
                AvgPnlByEmotion = avgPnlByEmotion,
                BestPerformingEmotionRange = GetEmotionRange(bestEmotion.Key),
                WorstPerformingEmotionRange = GetEmotionRange(worstEmotion.Key)
            };
        }

        public async Task<List<WeeklyTrendDto>> GetWeeklyTrendsAsync(Guid userId, int weeks = 4)
        {
            var endDate = DateTime.UtcNow;
            var startDate = endDate.AddDays(-weeks * 7);

            var emotions = await _context.EmotionChecks
                .Where(e => e.UserId == userId && e.Timestamp >= startDate && e.Timestamp <= endDate)
                .ToListAsync();

            var trades = await _context.Trades
                .Where(t => t.UserId == userId && t.Timestamp >= startDate && t.Timestamp <= endDate)
                .ToListAsync();

            var weeklyTrends = new List<WeeklyTrendDto>();

            for (int i = 0; i < weeks; i++)
            {
                var weekStart = startDate.AddDays(i * 7);
                var weekEnd = weekStart.AddDays(7);

                var weekEmotions = emotions.Where(e => e.Timestamp >= weekStart && e.Timestamp < weekEnd).ToList();
                var weekTrades = trades.Where(t => t.Timestamp >= weekStart && t.Timestamp < weekEnd).ToList();

                weeklyTrends.Add(new WeeklyTrendDto
                {
                    WeekStartDate = weekStart,
                    AverageEmotion = weekEmotions.Any() ? Math.Round(weekEmotions.Average(e => e.Level), 2) : 0,
                    TotalTrades = weekTrades.Count,
                    TotalPnl = Math.Round(weekTrades.Sum(t => t.Pnl ?? 0), 2),
                    WinRate = weekTrades.Any() ? Math.Round(weekTrades.Count(t => t.Outcome == "win") / (double)weekTrades.Count * 100, 2) : 0
                });
            }

            return weeklyTrends;
        }

        public async Task<List<EmotionDistributionDto>> GetEmotionDistributionAsync(Guid userId, DateTime? startDate = null, DateTime? endDate = null)
        {
            var query = _context.EmotionChecks
                .Where(e => e.UserId == userId);

            if (startDate.HasValue)
                query = query.Where(e => e.Timestamp >= startDate.Value);
            
            if (endDate.HasValue)
                query = query.Where(e => e.Timestamp <= endDate.Value);

            var emotions = await query.ToListAsync();

            if (!emotions.Any())
            {
                // Return empty distribution with all levels at 0%
                return Enumerable.Range(1, 10)
                    .Select(i => new EmotionDistributionDto
                    {
                        EmotionLevel = i,
                        Count = 0,
                        Percentage = 0
                    })
                    .ToList();
            }

            var distribution = emotions
                .GroupBy(e => e.Level)
                .Select(g => new EmotionDistributionDto
                {
                    EmotionLevel = g.Key,
                    Count = g.Count(),
                    Percentage = Math.Round(g.Count() / (double)emotions.Count * 100, 2)
                })
                .OrderBy(d => d.EmotionLevel)
                .ToList();

            // Ensure all emotion levels 1-10 are represented
            for (int i = 1; i <= 10; i++)
            {
                if (!distribution.Any(d => d.EmotionLevel == i))
                {
                    distribution.Add(new EmotionDistributionDto
                    {
                        EmotionLevel = i,
                        Count = 0,
                        Percentage = 0
                    });
                }
            }

            return distribution.OrderBy(d => d.EmotionLevel).ToList();
        }

        private string GetEmotionRange(int emotion)
        {
            return emotion switch
            {
                >= 1 and <= 3 => "Low (1-3)",
                >= 4 and <= 6 => "Medium (4-6)",
                >= 7 and <= 10 => "High (7-10)",
                _ => "Unknown"
            };
        }
    }
}
