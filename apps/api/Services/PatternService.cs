using TradeMentor.Api.Models;
using TradeMentor.Api.Data.Repositories;

namespace TradeMentor.Api.Services;

public interface IPatternService
{
    Task<ApiResponse<List<EmotionPerformanceDataDto>>> GetEmotionPerformanceDataAsync(string userId, string dateRange);
    Task<ApiResponse<List<WeeklyTrendDataDto>>> GetWeeklyTrendDataAsync(string userId, string dateRange);
    Task<ApiResponse<PatternInsightDto>> GetPatternInsightsAsync(string userId, string dateRange);
}

public class PatternService : IPatternService
{
    private readonly IEmotionCheckRepository _emotionRepository;
    private readonly ITradeRepository _tradeRepository;
    private readonly ILogger<PatternService> _logger;

    public PatternService(
        IEmotionCheckRepository emotionRepository,
        ITradeRepository tradeRepository,
        ILogger<PatternService> logger)
    {
        _emotionRepository = emotionRepository;
        _tradeRepository = tradeRepository;
        _logger = logger;
    }

    public async Task<ApiResponse<List<EmotionPerformanceDataDto>>> GetEmotionPerformanceDataAsync(string userId, string dateRange)
    {
        try
        {
            var (startDate, endDate) = GetDateRange(dateRange);
            
            var emotions = await _emotionRepository.GetByUserIdAndDateRangeAsync(userId, startDate, endDate);
            var trades = await _tradeRepository.GetByUserIdAndDateRangeAsync(userId, startDate, endDate);

            var data = new List<EmotionPerformanceDataDto>();

            foreach (var trade in trades)
            {
                // Find the closest emotion check before the trade
                var emotionCheck = emotions
                    .Where(e => e.Timestamp <= trade.EntryTime)
                    .OrderByDescending(e => e.Timestamp)
                    .FirstOrDefault();

                if (emotionCheck != null)
                {
                    var outcomePercentage = CalculateTradeOutcome(trade);
                    
                    data.Add(new EmotionPerformanceDataDto
                    {
                        EmotionLevel = emotionCheck.Level,
                        TradeOutcome = outcomePercentage,
                        TradeType = trade.Outcome,
                        Date = trade.EntryTime,
                        Symbol = trade.Symbol,
                        Size = Math.Abs(outcomePercentage) + 5 // For bubble size
                    });
                }
            }

            return ApiResponse<List<EmotionPerformanceDataDto>>.SuccessResponse(data);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting emotion performance data for user {UserId}", userId);
            return ApiResponse<List<EmotionPerformanceDataDto>>.ErrorResponse("Failed to get emotion performance data");
        }
    }

    public async Task<ApiResponse<List<WeeklyTrendDataDto>>> GetWeeklyTrendDataAsync(string userId, string dateRange)
    {
        try
        {
            var (startDate, endDate) = GetDateRange(dateRange);
            
            var emotions = await _emotionRepository.GetByUserIdAndDateRangeAsync(userId, startDate, endDate);
            var trades = await _tradeRepository.GetByUserIdAndDateRangeAsync(userId, startDate, endDate);

            var weeklyData = new List<WeeklyTrendDataDto>();
            var currentDate = startDate;
            var weekNumber = 1;

            while (currentDate <= endDate)
            {
                var weekEnd = currentDate.AddDays(7);
                var weekEmotions = emotions.Where(e => e.Timestamp >= currentDate && e.Timestamp < weekEnd);
                var weekTrades = trades.Where(t => t.EntryTime >= currentDate && t.EntryTime < weekEnd);

                if (weekEmotions.Any() || weekTrades.Any())
                {
                    var avgEmotion = weekEmotions.Any() ? weekEmotions.Average(e => e.Level) : 0;
                    var winRate = weekTrades.Any() 
                        ? (double)weekTrades.Count(t => t.Outcome == TradeOutcome.Win) / weekTrades.Count() * 100 
                        : 0;
                    var avgReturn = weekTrades.Where(t => t.Pnl.HasValue).Any()
                        ? (double)weekTrades.Where(t => t.Pnl.HasValue).Average(t => t.Pnl!.Value)
                        : 0;

                    weeklyData.Add(new WeeklyTrendDataDto
                    {
                        Week = $"Week {weekNumber}",
                        AvgEmotion = Math.Round(avgEmotion, 1),
                        WinRate = Math.Round(winRate, 1),
                        TotalTrades = weekTrades.Count(),
                        AvgReturn = Math.Round(avgReturn, 2)
                    });
                }

                currentDate = weekEnd;
                weekNumber++;
            }

            return ApiResponse<List<WeeklyTrendDataDto>>.SuccessResponse(weeklyData);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting weekly trend data for user {UserId}", userId);
            return ApiResponse<List<WeeklyTrendDataDto>>.ErrorResponse("Failed to get weekly trend data");
        }
    }

    public async Task<ApiResponse<PatternInsightDto>> GetPatternInsightsAsync(string userId, string dateRange)
    {
        try
        {
            var (startDate, endDate) = GetDateRange(dateRange);
            
            var emotions = await _emotionRepository.GetByUserIdAndDateRangeAsync(userId, startDate, endDate);
            var trades = await _tradeRepository.GetByUserIdAndDateRangeAsync(userId, startDate, endDate);

            var insights = new PatternInsightDto();

            // High emotion win rate (emotion level 7+)
            var highEmotionTrades = trades.Where(t => 
                emotions.Any(e => e.Timestamp <= t.EntryTime && e.Level >= 7))
                .ToList();
            
            insights.HighEmotionWinRate = highEmotionTrades.Any() 
                ? (double)highEmotionTrades.Count(t => t.Outcome == TradeOutcome.Win) / highEmotionTrades.Count * 100
                : 0;

            // Best trading days
            var dayPerformance = trades
                .GroupBy(t => t.EntryTime.DayOfWeek)
                .Select(g => new 
                { 
                    Day = g.Key, 
                    WinRate = (double)g.Count(t => t.Outcome == TradeOutcome.Win) / g.Count() * 100 
                })
                .OrderByDescending(x => x.WinRate)
                .Take(2)
                .ToList();

            insights.BestTradingDays = dayPerformance.Select(d => d.Day.ToString()).ToList();

            // Anxiety threshold (simplified - level where win rate drops significantly)
            insights.AnxietyThreshold = 6;

            // Optimal emotion range
            var emotionGrouped = trades
                .Where(t => emotions.Any(e => e.Timestamp <= t.EntryTime))
                .GroupBy(t => emotions
                    .Where(e => e.Timestamp <= t.EntryTime)
                    .OrderByDescending(e => e.Timestamp)
                    .First().Level)
                .Select(g => new 
                { 
                    Level = g.Key, 
                    WinRate = (double)g.Count(t => t.Outcome == TradeOutcome.Win) / g.Count() * 100 
                })
                .OrderByDescending(x => x.WinRate)
                .ToList();

            if (emotionGrouped.Any())
            {
                var bestLevel = emotionGrouped.First().Level;
                insights.OptimalEmotionRange = new[] { Math.Max(1, bestLevel - 1), Math.Min(10, bestLevel + 1) };
            }
            else
            {
                insights.OptimalEmotionRange = new[] { 6, 8 };
            }

            // Correlation strength (simplified calculation)
            insights.CorrelationStrength = CalculateCorrelation(emotions, trades);

            insights.TotalPatterns = trades.Count();

            return ApiResponse<PatternInsightDto>.SuccessResponse(insights);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting pattern insights for user {UserId}", userId);
            return ApiResponse<PatternInsightDto>.ErrorResponse("Failed to get pattern insights");
        }
    }

    private (DateTime startDate, DateTime endDate) GetDateRange(string dateRange)
    {
        var endDate = DateTime.UtcNow;
        var startDate = dateRange switch
        {
            "7d" => endDate.AddDays(-7),
            "30d" => endDate.AddDays(-30),
            "90d" => endDate.AddDays(-90),
            "1y" => endDate.AddYears(-1),
            _ => endDate.AddYears(-10) // "all"
        };

        return (startDate, endDate);
    }

    private double CalculateTradeOutcome(Trade trade)
    {
        if (trade.Pnl.HasValue)
        {
            return (double)trade.Pnl.Value;
        }

        // If no PnL, estimate based on outcome
        return trade.Outcome switch
        {
            TradeOutcome.Win => Random.Shared.NextDouble() * 15 + 1, // 1-16%
            TradeOutcome.Loss => Random.Shared.NextDouble() * -15 - 1, // -1 to -16%
            TradeOutcome.Breakeven => Random.Shared.NextDouble() * 2 - 1, // -1 to 1%
            _ => 0
        };
    }

    private double CalculateCorrelation(IEnumerable<EmotionCheck> emotions, IEnumerable<Trade> trades)
    {
        var data = trades
            .Select(t => new
            {
                EmotionLevel = emotions
                    .Where(e => e.Timestamp <= t.EntryTime)
                    .OrderByDescending(e => e.Timestamp)
                    .FirstOrDefault()?.Level ?? 5,
                TradeOutcome = CalculateTradeOutcome(t)
            })
            .Where(x => x.EmotionLevel > 0)
            .ToList();

        if (data.Count < 2) return 0;

        var avgEmotion = data.Average(x => x.EmotionLevel);
        var avgOutcome = data.Average(x => x.TradeOutcome);

        var numerator = data.Sum(x => (x.EmotionLevel - avgEmotion) * (x.TradeOutcome - avgOutcome));
        var denominator = Math.Sqrt(
            data.Sum(x => Math.Pow(x.EmotionLevel - avgEmotion, 2)) *
            data.Sum(x => Math.Pow(x.TradeOutcome - avgOutcome, 2))
        );

        return denominator == 0 ? 0 : Math.Abs(numerator / denominator);
    }
}
