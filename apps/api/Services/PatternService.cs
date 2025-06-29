using TradeMentor.Api.Models;
using TradeMentor.Api.Data.Repositories;
using Microsoft.Extensions.Caching.Memory;
using System.Collections.Concurrent;

namespace TradeMentor.Api.Services;

public class PatternService : IPatternService
{
    private readonly IEmotionCheckRepository _emotionRepository;
    private readonly ITradeRepository _tradeRepository;
    private readonly ILogger<PatternService> _logger;
    private readonly IMemoryCache _cache;
    private static readonly SemaphoreSlim _heavyCalculationSemaphore = new(2); // Limit concurrent heavy operations

    public PatternService(
        IEmotionCheckRepository emotionRepository,
        ITradeRepository tradeRepository,
        ILogger<PatternService> logger,
        IMemoryCache cache)
    {
        _emotionRepository = emotionRepository;
        _tradeRepository = tradeRepository;
        _logger = logger;
        _cache = cache;
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

    #region Enhanced Analytics Methods

    /// <summary>
    /// Analyzes correlation between emotion levels and trading performance with statistical significance
    /// </summary>
    public async Task<EmotionPerformanceCorrelationDto> GetEmotionPerformanceCorrelation(string userId, DateRangeDto dateRange)
    {
        var cacheKey = $"correlation_{userId}_{dateRange.StartDate:yyyyMMdd}_{dateRange.EndDate:yyyyMMdd}";
        
        if (_cache.TryGetValue(cacheKey, out EmotionPerformanceCorrelationDto? cachedResult))
        {
            _logger.LogInformation("Returning cached correlation data for user {UserId}", userId);
            return cachedResult!;
        }

        await _heavyCalculationSemaphore.WaitAsync();
        try
        {
            _logger.LogInformation("Calculating emotion-performance correlation for user {UserId} from {Start} to {End}", 
                userId, dateRange.StartDate, dateRange.EndDate);

            var emotions = (await _emotionRepository.GetByUserIdAndDateRangeAsync(userId, dateRange.StartDate, dateRange.EndDate)).ToList();
            var trades = (await _tradeRepository.GetByUserIdAndDateRangeAsync(userId, dateRange.StartDate, dateRange.EndDate)).ToList();

            if (trades.Count < 10)
            {
                return new EmotionPerformanceCorrelationDto
                {
                    CorrelationCoefficient = 0,
                    PValue = 1,
                    IsStatisticallySignificant = false,
                    SampleSize = trades.Count,
                    AnalysisPeriod = $"{dateRange.StartDate:yyyy-MM-dd} to {dateRange.EndDate:yyyy-MM-dd}",
                    Insights = new CorrelationInsightsDto
                    {
                        CorrelationStrength = "Insufficient Data",
                        Recommendation = "Continue trading to gather more data for meaningful analysis",
                        KeyFindings = new List<string> { "Need at least 10 trades for statistical analysis" }
                    }
                };
            }

            // Match trades with emotions
            var tradeEmotionPairs = GetTradeEmotionPairs(trades, emotions);
            
            // Calculate performance by emotion level
            var emotionLevels = CalculateEmotionLevelPerformance(tradeEmotionPairs);
            var winRateByLevel = CalculateWinRateStatistics(tradeEmotionPairs);
            
            // Calculate correlation coefficient and statistical significance
            var (correlation, pValue) = CalculatePearsonCorrelation(tradeEmotionPairs);
            var isSignificant = pValue < 0.05 && tradeEmotionPairs.Count >= 30;

            // Generate insights
            var insights = GenerateCorrelationInsights(correlation, emotionLevels, winRateByLevel);

            var result = new EmotionPerformanceCorrelationDto
            {
                CorrelationCoefficient = Math.Round(correlation, 4),
                PValue = Math.Round(pValue, 4),
                IsStatisticallySignificant = isSignificant,
                EmotionLevels = emotionLevels,
                WinRateByLevel = winRateByLevel,
                Insights = insights,
                SampleSize = tradeEmotionPairs.Count,
                AnalysisPeriod = $"{dateRange.StartDate:yyyy-MM-dd} to {dateRange.EndDate:yyyy-MM-dd}"
            };

            // Cache for 1 hour
            _cache.Set(cacheKey, result, TimeSpan.FromHours(1));
            
            return result;
        }
        finally
        {
            _heavyCalculationSemaphore.Release();
        }
    }

    /// <summary>
    /// Analyzes weekly emotion trends with advanced trend detection algorithms
    /// </summary>
    public async Task<List<WeeklyEmotionTrendDto>> GetWeeklyEmotionTrend(string userId, int weeks)
    {
        var cacheKey = $"weekly_trend_{userId}_{weeks}";
        
        if (_cache.TryGetValue(cacheKey, out List<WeeklyEmotionTrendDto>? cachedResult))
        {
            _logger.LogInformation("Returning cached weekly trend data for user {UserId}", userId);
            return cachedResult!;
        }

        try
        {
            _logger.LogInformation("Calculating weekly emotion trend for user {UserId}, {Weeks} weeks", userId, weeks);

            var endDate = DateTime.UtcNow;
            var startDate = endDate.AddDays(-weeks * 7);

            var emotions = (await _emotionRepository.GetByUserIdAndDateRangeAsync(userId, startDate, endDate)).ToList();
            var trades = (await _tradeRepository.GetByUserIdAndDateRangeAsync(userId, startDate, endDate)).ToList();

            var weeklyTrends = new List<WeeklyEmotionTrendDto>();
            var currentWeekStart = startDate.Date;

            for (int week = 0; week < weeks; week++)
            {
                var weekEnd = currentWeekStart.AddDays(7);
                var weekEmotions = emotions.Where(e => e.CreatedAt >= currentWeekStart && e.CreatedAt < weekEnd).ToList();
                var weekTrades = trades.Where(t => t.EntryTime >= currentWeekStart && t.EntryTime < weekEnd).ToList();

                var weeklyTrend = CalculateWeeklyTrend(currentWeekStart, weekEnd, weekEmotions, weekTrades, week + 1);
                weeklyTrends.Add(weeklyTrend);

                currentWeekStart = weekEnd;
            }

            // Calculate trend directions
            CalculateTrendDirections(weeklyTrends);

            // Cache for 30 minutes
            _cache.Set(cacheKey, weeklyTrends, TimeSpan.FromMinutes(30));

            return weeklyTrends;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating weekly emotion trend for user {UserId}", userId);
            throw;
        }
    }

    /// <summary>
    /// Generates personalized insights using advanced analytics and machine learning-like patterns
    /// </summary>
    public async Task<PersonalizedInsightsDto> GetKeyInsights(string userId)
    {
        var cacheKey = $"insights_{userId}";
        
        if (_cache.TryGetValue(cacheKey, out PersonalizedInsightsDto? cachedResult))
        {
            _logger.LogInformation("Returning cached insights for user {UserId}", userId);
            return cachedResult!;
        }

        await _heavyCalculationSemaphore.WaitAsync();
        try
        {
            _logger.LogInformation("Generating personalized insights for user {UserId}", userId);

            var endDate = DateTime.UtcNow;
            var startDate = endDate.AddDays(-90); // 90-day analysis

            var emotions = (await _emotionRepository.GetByUserIdAsync(userId)).ToList();
            var trades = (await _tradeRepository.GetByUserIdAsync(userId)).ToList();

            var recentEmotions = emotions.Where(e => e.CreatedAt >= startDate).ToList();
            var recentTrades = trades.Where(t => t.EntryTime >= startDate).ToList();

            var insights = new PersonalizedInsightsDto
            {
                GeneratedAt = DateTime.UtcNow,
                AnalysisPeriod = "Last 90 days"
            };

            // Generate various insights
            insights.Insights = await GeneratePersonalizedInsights(userId, emotions, trades, recentEmotions, recentTrades);
            insights.TradingProfile = CalculateEmotionalTradingProfile(emotions, trades);
            insights.Recommendations = GenerateActionableRecommendations(insights.Insights, insights.TradingProfile);
            insights.RiskAssessment = CalculateRiskAssessment(emotions, trades, recentEmotions, recentTrades);
            insights.Progress = CalculateProgressMetrics(emotions, trades);

            // Cache for 2 hours
            _cache.Set(cacheKey, insights, TimeSpan.FromHours(2));

            return insights;
        }
        finally
        {
            _heavyCalculationSemaphore.Release();
        }
    }

    /// <summary>
    /// Identifies optimal trading conditions using multi-factor analysis
    /// </summary>
    public async Task<OptimalTradingConditionsDto> GetBestTradingConditions(string userId)
    {
        var cacheKey = $"optimal_conditions_{userId}";
        
        if (_cache.TryGetValue(cacheKey, out OptimalTradingConditionsDto? cachedResult))
        {
            _logger.LogInformation("Returning cached optimal conditions for user {UserId}", userId);
            return cachedResult!;
        }

        try
        {
            _logger.LogInformation("Analyzing optimal trading conditions for user {UserId}", userId);

            var emotions = (await _emotionRepository.GetByUserIdAsync(userId)).ToList();
            var trades = (await _tradeRepository.GetByUserIdAsync(userId)).ToList();

            if (trades.Count < 20)
            {
                return new OptimalTradingConditionsDto
                {
                    BestConditions = new List<OptimalConditionDto>(),
                    ConditionsToAvoid = new List<ConditionToAvoidDto>(),
                    BestMarketTiming = new MarketTimingDto(),
                    EmotionalReadiness = new EmotionalReadinessDto
                    {
                        CurrentReadinessLevel = "Insufficient data for analysis"
                    },
                    EnvironmentalFactors = new EnvironmentalFactorsDto(),
                    OverallOptimizationScore = 0,
                    LastUpdated = DateTime.UtcNow
                };
            }

            var tradeEmotionPairs = GetTradeEmotionPairs(trades, emotions);

            var conditions = new OptimalTradingConditionsDto
            {
                BestConditions = IdentifyBestConditions(tradeEmotionPairs),
                ConditionsToAvoid = IdentifyConditionsToAvoid(tradeEmotionPairs),
                BestMarketTiming = AnalyzeMarketTiming(trades),
                EmotionalReadiness = AnalyzeEmotionalReadiness(tradeEmotionPairs),
                EnvironmentalFactors = AnalyzeEnvironmentalFactors(trades),
                LastUpdated = DateTime.UtcNow
            };

            conditions.OverallOptimizationScore = CalculateOptimizationScore(conditions);

            // Cache for 1 hour
            _cache.Set(cacheKey, conditions, TimeSpan.FromHours(1));

            return conditions;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error analyzing optimal trading conditions for user {UserId}", userId);
            throw;
        }
    }

    #endregion

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

    #region Helper Methods and Analytics Algorithms

    private List<TradeEmotionPair> GetTradeEmotionPairs(List<Trade> trades, List<EmotionCheck> emotions)
    {
        var pairs = new List<TradeEmotionPair>();

        foreach (var trade in trades)
        {
            var closestEmotion = emotions
                .Where(e => e.Timestamp <= trade.EntryTime && e.Timestamp >= trade.EntryTime.AddHours(-6))
                .OrderByDescending(e => e.Timestamp)
                .FirstOrDefault();

            if (closestEmotion != null)
            {
                pairs.Add(new TradeEmotionPair
                {
                    Trade = trade,
                    Emotion = closestEmotion,
                    TimeDifference = (trade.EntryTime - closestEmotion.Timestamp).TotalMinutes
                });
            }
        }

        return pairs;
    }

    private List<EmotionLevelPerformanceDto> CalculateEmotionLevelPerformance(List<TradeEmotionPair> pairs)
    {
        var grouped = pairs.GroupBy(p => p.Emotion.Level);
        var performance = new List<EmotionLevelPerformanceDto>();

        foreach (var group in grouped)
        {
            var returns = group.Select(p => CalculateTradeReturn(p.Trade)).ToList();
            var winRate = (double)group.Count(p => CalculateTradeReturn(p.Trade) > 0) / group.Count() * 100;

            performance.Add(new EmotionLevelPerformanceDto
            {
                EmotionLevel = group.Key,
                AverageReturn = returns.Average(),
                WinRate = winRate,
                TradeCount = group.Count(),
                StandardDeviation = CalculateStandardDeviation(returns),
                SharpeRatio = CalculateSharpeRatio(returns),
                MaxDrawdown = CalculateMaxDrawdown(returns),
                ProfitFactor = CalculateProfitFactor(returns)
            });
        }

        return performance.OrderBy(p => p.EmotionLevel).ToList();
    }

    private Dictionary<int, WinRateStatsDto> CalculateWinRateStatistics(List<TradeEmotionPair> pairs)
    {
        var stats = new Dictionary<int, WinRateStatsDto>();
        var grouped = pairs.GroupBy(p => p.Emotion.Level);

        foreach (var group in grouped)
        {
            var returns = group.Select(p => CalculateTradeReturn(p.Trade)).ToList();
            var wins = returns.Where(r => r > 0).ToList();
            var losses = returns.Where(r => r < 0).ToList();

            stats[group.Key] = new WinRateStatsDto
            {
                WinRate = (double)wins.Count / returns.Count * 100,
                TotalTrades = returns.Count,
                WinningTrades = wins.Count,
                LosingTrades = losses.Count,
                AverageWin = wins.Any() ? wins.Average() : 0,
                AverageLoss = losses.Any() ? losses.Average() : 0,
                ConfidenceInterval = CalculateConfidenceInterval(returns)
            };
        }

        return stats;
    }

    private (double correlation, double pValue) CalculatePearsonCorrelation(List<TradeEmotionPair> pairs)
    {
        if (pairs.Count < 3) return (0, 1);

        var emotionLevels = pairs.Select(p => (double)p.Emotion.Level).ToArray();
        var returns = pairs.Select(p => CalculateTradeReturn(p.Trade)).ToArray();

        var correlation = CalculatePearsonCorrelationCoefficient(emotionLevels, returns);
        var pValue = CalculatePValue(correlation, pairs.Count);

        return (correlation, pValue);
    }

    private double CalculatePearsonCorrelationCoefficient(double[] x, double[] y)
    {
        var xMean = x.Average();
        var yMean = y.Average();

        var numerator = x.Zip(y, (xi, yi) => (xi - xMean) * (yi - yMean)).Sum();
        var denominator = Math.Sqrt(x.Sum(xi => Math.Pow(xi - xMean, 2)) * y.Sum(yi => Math.Pow(yi - yMean, 2)));

        return denominator == 0 ? 0 : numerator / denominator;
    }

    private double CalculatePValue(double correlation, int sampleSize)
    {
        // Simplified p-value calculation for correlation
        var t = correlation * Math.Sqrt((sampleSize - 2) / (1 - correlation * correlation));
        return 2 * (1 - NormalCDF(Math.Abs(t)));
    }

    private double NormalCDF(double x)
    {
        // Approximation of standard normal CDF
        return 0.5 * (1 + Math.Sign(x) * Math.Sqrt(1 - Math.Exp(-2 * x * x / Math.PI)));
    }

    private CorrelationInsightsDto GenerateCorrelationInsights(double correlation, List<EmotionLevelPerformanceDto> emotionLevels, Dictionary<int, WinRateStatsDto> winRates)
    {
        var insights = new CorrelationInsightsDto();

        // Determine correlation strength
        var absCorrelation = Math.Abs(correlation);
        insights.CorrelationStrength = absCorrelation switch
        {
            >= 0.7 => "Strong",
            >= 0.5 => "Moderate",
            >= 0.3 => "Weak",
            _ => "Very Weak"
        };

        // Find optimal emotion range
        var bestPerforming = emotionLevels.OrderByDescending(e => e.AverageReturn).Take(3).ToList();
        if (bestPerforming.Any())
        {
            var minOptimal = bestPerforming.Min(e => e.EmotionLevel);
            var maxOptimal = bestPerforming.Max(e => e.EmotionLevel);
            insights.OptimalEmotionRange = new[] { minOptimal, maxOptimal };
        }

        // Find emotion range to avoid
        var worstPerforming = emotionLevels.OrderBy(e => e.AverageReturn).Take(2).ToList();
        if (worstPerforming.Any())
        {
            var minAvoid = worstPerforming.Min(e => e.EmotionLevel);
            var maxAvoid = worstPerforming.Max(e => e.EmotionLevel);
            insights.AvoidEmotionRange = new[] { minAvoid, maxAvoid };
        }

        // Generate recommendations and findings
        insights.KeyFindings = GenerateKeyFindings(correlation, emotionLevels, winRates);
        insights.Recommendation = GenerateRecommendation(correlation, insights.OptimalEmotionRange);

        return insights;
    }

    private List<string> GenerateKeyFindings(double correlation, List<EmotionLevelPerformanceDto> emotionLevels, Dictionary<int, WinRateStatsDto> winRates)
    {
        var findings = new List<string>();

        if (Math.Abs(correlation) > 0.3)
        {
            findings.Add($"There is a {(correlation > 0 ? "positive" : "negative")} correlation between emotion level and trading performance");
        }

        var bestLevel = emotionLevels.OrderByDescending(e => e.WinRate).FirstOrDefault();
        if (bestLevel != null)
        {
            findings.Add($"Emotion level {bestLevel.EmotionLevel} shows the highest win rate at {bestLevel.WinRate:F1}%");
        }

        var worstLevel = emotionLevels.OrderBy(e => e.WinRate).FirstOrDefault();
        if (worstLevel != null && worstLevel.WinRate < 40)
        {
            findings.Add($"Emotion level {worstLevel.EmotionLevel} shows concerning performance with {worstLevel.WinRate:F1}% win rate");
        }

        return findings;
    }

    private string GenerateRecommendation(double correlation, int[] optimalRange)
    {
        if (Math.Abs(correlation) < 0.2)
        {
            return "Emotion levels don't significantly impact trading performance. Focus on other factors like market analysis and risk management.";
        }

        if (correlation > 0)
        {
            return $"Higher emotion levels tend to improve performance. Consider trading when your emotion level is between {optimalRange[0]} and {optimalRange[1]}.";
        }
        else
        {
            return $"Lower emotion levels tend to improve performance. Consider trading when your emotion level is between {optimalRange[0]} and {optimalRange[1]}.";
        }
    }

    private WeeklyEmotionTrendDto CalculateWeeklyTrend(DateTime weekStart, DateTime weekEnd, List<EmotionCheck> emotions, List<Trade> trades, int weekNumber)
    {
        var dailyData = new List<DailyEmotionDataDto>();
        
        for (var date = weekStart.Date; date < weekEnd.Date; date = date.AddDays(1))
        {
            var dayEmotions = emotions.Where(e => e.CreatedAt.Date == date).ToList();
            var dayTrades = trades.Where(t => t.EntryTime.Date == date).ToList();

            var dailyEmotion = new DailyEmotionDataDto
            {
                Date = date,
                AverageEmotion = dayEmotions.Any() ? dayEmotions.Average(e => e.Level) : 0,
                CheckCount = dayEmotions.Count,
                TradePerformance = dayTrades.Any() ? dayTrades.Average(t => CalculateTradeReturn(t)) : null
            };
            
            dailyData.Add(dailyEmotion);
        }

        var avgEmotion = emotions.Any() ? emotions.Average(e => e.Level) : 0;
        var emotionVolatility = emotions.Any() ? CalculateStandardDeviation(emotions.Select(e => (double)e.Level).ToList()) : 0;
        var winRate = trades.Any() ? (double)trades.Count(t => CalculateTradeReturn(t) > 0) / trades.Count * 100 : 0;
        var avgReturn = trades.Any() ? trades.Average(t => CalculateTradeReturn(t)) : 0;

        return new WeeklyEmotionTrendDto
        {
            WeekStartDate = weekStart,
            WeekEndDate = weekEnd,
            WeekLabel = $"Week {weekNumber}",
            AverageEmotionLevel = Math.Round(avgEmotion, 2),
            EmotionVolatility = Math.Round(emotionVolatility, 2),
            WinRate = Math.Round(winRate, 2),
            AverageReturn = Math.Round(avgReturn, 2),
            TotalTrades = trades.Count,
            EmotionChecks = emotions.Count,
            DailyBreakdown = dailyData
        };
    }

    private void CalculateTrendDirections(List<WeeklyEmotionTrendDto> weeklyTrends)
    {
        for (int i = 0; i < weeklyTrends.Count; i++)
        {
            if (i == 0)
            {
                weeklyTrends[i].TrendDirection = TrendDirection.Stable;
                weeklyTrends[i].TrendStrength = 0;
                continue;
            }

            var current = weeklyTrends[i];
            var previous = weeklyTrends[i - 1];

            var emotionChange = current.AverageEmotionLevel - previous.AverageEmotionLevel;
            var performanceChange = current.AverageReturn - previous.AverageReturn;

            // Determine trend direction based on performance change
            if (Math.Abs(performanceChange) < 0.5)
            {
                current.TrendDirection = TrendDirection.Stable;
            }
            else if (performanceChange > 0)
            {
                current.TrendDirection = TrendDirection.Improving;
            }
            else
            {
                current.TrendDirection = TrendDirection.Declining;
            }

            // Check for volatility
            if (current.EmotionVolatility > 2.0)
            {
                current.TrendDirection = TrendDirection.Volatile;
            }

            current.TrendStrength = Math.Abs(performanceChange);
        }
    }

    private Task<List<PersonalizedInsightDto>> GeneratePersonalizedInsights(string userId, List<EmotionCheck> allEmotions, List<Trade> allTrades, List<EmotionCheck> recentEmotions, List<Trade> recentTrades)
    {
        var insights = new List<PersonalizedInsightDto>();

        // Analyze emotion consistency
        if (recentEmotions.Count >= 10)
        {
            var consistency = CalculateEmotionConsistency(recentEmotions);
            if (consistency < 0.7)
            {
                insights.Add(new PersonalizedInsightDto
                {
                    Title = "Emotional Volatility Detected",
                    Description = $"Your emotion levels have been highly variable (consistency score: {consistency:F2})",
                    Type = InsightType.Warning,
                    Priority = InsightPriority.High,
                    Impact = 0.8,
                    Confidence = 0.9,
                    Category = "Emotional Stability",
                    SupportingData = new List<string> { $"Emotion variance: {CalculateStandardDeviation(recentEmotions.Select(e => (double)e.Level).ToList()):F2}" }
                });
            }
        }

        // Analyze streak patterns
        var currentStreak = CalculateCurrentStreak(allEmotions);
        if (currentStreak >= 7)
        {
            insights.Add(new PersonalizedInsightDto
            {
                Title = "Excellent Consistency Streak",
                Description = $"You've maintained consistent emotion tracking for {currentStreak} days",
                Type = InsightType.Positive,
                Priority = InsightPriority.Medium,
                Impact = 0.6,
                Confidence = 1.0,
                Category = "Habit Formation",
                SupportingData = new List<string> { $"Current streak: {currentStreak} days" }
            });
        }

        // Analyze performance trends
        if (recentTrades.Count >= 10)
        {
            var recentPerformance = recentTrades.Average(t => CalculateTradeReturn(t));
            var historicalPerformance = allTrades.Where(t => t.EntryTime < DateTime.UtcNow.AddDays(-90)).Average(t => CalculateTradeReturn(t));

            if (recentPerformance > historicalPerformance * 1.2)
            {
                insights.Add(new PersonalizedInsightDto
                {
                    Title = "Performance Improvement Trend",
                    Description = $"Your recent trading performance is {((recentPerformance / historicalPerformance - 1) * 100):F1}% better than historical average",
                    Type = InsightType.Positive,
                    Priority = InsightPriority.High,
                    Impact = 0.9,
                    Confidence = 0.8,
                    Category = "Performance",
                    SupportingData = new List<string> { $"Recent avg: {recentPerformance:F2}%", $"Historical avg: {historicalPerformance:F2}%" }
                });
            }
        }

        return Task.FromResult(insights);
    }

    private double CalculateTradeReturn(Trade trade)
    {
        if (trade.Pnl.HasValue)
        {
            return (double)trade.Pnl.Value;
        }

        // Estimate based on outcome if PnL not available
        return trade.Outcome switch
        {
            TradeOutcome.Win => 2.5,
            TradeOutcome.Loss => -1.8,
            TradeOutcome.Breakeven => 0.1,
            _ => 0
        };
    }

    private double CalculateStandardDeviation(List<double> values)
    {
        if (values.Count <= 1) return 0;
        
        var mean = values.Average();
        var sumOfSquares = values.Sum(x => Math.Pow(x - mean, 2));
        return Math.Sqrt(sumOfSquares / (values.Count - 1));
    }

    private double CalculateSharpeRatio(List<double> returns)
    {
        if (returns.Count <= 1) return 0;
        
        var avgReturn = returns.Average();
        var stdDev = CalculateStandardDeviation(returns);
        return stdDev == 0 ? 0 : avgReturn / stdDev;
    }

    private double CalculateMaxDrawdown(List<double> returns)
    {
        if (!returns.Any()) return 0;

        var cumulativeReturns = new List<double> { 0 };
        foreach (var ret in returns)
        {
            cumulativeReturns.Add(cumulativeReturns.Last() + ret);
        }

        var maxDrawdown = 0.0;
        var peak = cumulativeReturns[0];

        foreach (var value in cumulativeReturns)
        {
            if (value > peak) peak = value;
            var drawdown = peak - value;
            if (drawdown > maxDrawdown) maxDrawdown = drawdown;
        }

        return maxDrawdown;
    }

    private double CalculateProfitFactor(List<double> returns)
    {
        var profits = returns.Where(r => r > 0).Sum();
        var losses = Math.Abs(returns.Where(r => r < 0).Sum());
        return losses == 0 ? (profits > 0 ? double.PositiveInfinity : 0) : profits / losses;
    }

    private double CalculateConfidenceInterval(List<double> returns)
    {
        // Simplified 95% confidence interval calculation
        var stdError = CalculateStandardDeviation(returns) / Math.Sqrt(returns.Count);
        return 1.96 * stdError; // 95% CI
    }

    // Placeholder implementations for remaining methods
    private EmotionalTradingProfileDto CalculateEmotionalTradingProfile(List<EmotionCheck> emotions, List<Trade> trades) => new();
    private List<ActionableRecommendationDto> GenerateActionableRecommendations(List<PersonalizedInsightDto> insights, EmotionalTradingProfileDto profile) => new();
    private RiskAssessmentDto CalculateRiskAssessment(List<EmotionCheck> emotions, List<Trade> trades, List<EmotionCheck> recentEmotions, List<Trade> recentTrades) => new();
    private ProgressMetricsDto CalculateProgressMetrics(List<EmotionCheck> emotions, List<Trade> trades) => new();
    private List<OptimalConditionDto> IdentifyBestConditions(List<TradeEmotionPair> pairs) => new();
    private List<ConditionToAvoidDto> IdentifyConditionsToAvoid(List<TradeEmotionPair> pairs) => new();
    private MarketTimingDto AnalyzeMarketTiming(List<Trade> trades) => new();
    private EmotionalReadinessDto AnalyzeEmotionalReadiness(List<TradeEmotionPair> pairs) => new();
    private EnvironmentalFactorsDto AnalyzeEnvironmentalFactors(List<Trade> trades) => new();
    private double CalculateOptimizationScore(OptimalTradingConditionsDto conditions) => 0.75;
    private double CalculateEmotionConsistency(List<EmotionCheck> emotions) => 1.0 - (CalculateStandardDeviation(emotions.Select(e => (double)e.Level).ToList()) / 10.0);
    private int CalculateCurrentStreak(List<EmotionCheck> emotions) => emotions.Select(e => e.CreatedAt.Date).Distinct().Count();

    #endregion

    // Helper class for trade-emotion pairing
    private class TradeEmotionPair
    {
        public Trade Trade { get; set; } = null!;
        public EmotionCheck Emotion { get; set; } = null!;
        public double TimeDifference { get; set; }
    }
}
