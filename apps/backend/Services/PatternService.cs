using System;
using System.Collections.Generic;
using System.Linq;

namespace TradeMentor.Services
{
    public class PatternService
    {
        public class TrendAnalysis
        {
            public string Direction { get; set; } = string.Empty;
            public double Slope { get; set; }
            public double Intercept { get; set; }
            public double Confidence { get; set; }
        }

        public class Insight
        {
            public string Id { get; set; } = Guid.NewGuid().ToString();
            public string Type { get; set; } = string.Empty;
            public string Title { get; set; } = string.Empty;
            public string Description { get; set; } = string.Empty;
            public double Confidence { get; set; }
            public string Priority { get; set; } = "medium";
            public bool Actionable { get; set; }
            public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        }

        public class EmotionCheck
        {
            public DateTime Timestamp { get; set; }
            public double EmotionLevel { get; set; }
            public string UserId { get; set; } = string.Empty;
            public string? TradeId { get; set; }
            public string? Notes { get; set; }
        }

        public class EmotionPerformanceRange
        {
            public double EmotionLevel { get; set; }
            public double WinRate { get; set; }
            public int TradeCount { get; set; }
            public double AverageProfit { get; set; }
            public List<string> TradeIds { get; set; } = new List<string>();
        }

        public class UserData
        {
            public List<EmotionCheck> EmotionChecks { get; set; } = new List<EmotionCheck>();
            public List<Trade> Trades { get; set; } = new List<Trade>();
            public string UserId { get; set; } = string.Empty;
        }

        public class Trade
        {
            public string Id { get; set; } = string.Empty;
            public DateTime Timestamp { get; set; }
            public string Symbol { get; set; } = string.Empty;
            public double Profit { get; set; }
            public bool IsWin => Profit > 0;
            public double? PreTradeEmotion { get; set; }
            public double? PostTradeEmotion { get; set; }
        }

        // Calculate emotion trend over time
        public TrendAnalysis CalculateTrend(List<EmotionCheck> emotions)
        {
            var sortedEmotions = emotions.OrderBy(e => e.Timestamp).ToList();
            
            // Linear regression for trend line
            int n = sortedEmotions.Count;
            if (n < 3) return new TrendAnalysis { Direction = "insufficient_data" };
            
            double sumX = sortedEmotions.Select((_, i) => i).Sum();
            double sumY = sortedEmotions.Sum(emotion => emotion.EmotionLevel);
            double sumXY = sortedEmotions.Select((emotion, i) => i * emotion.EmotionLevel).Sum();
            double sumXX = sortedEmotions.Select((_, i) => i * i).Sum();
            
            double slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
            double intercept = (sumY - slope * sumX) / n;
            
            return new TrendAnalysis {
                Direction = slope > 0.1 ? "improving" : slope < -0.1 ? "declining" : "stable",
                Slope = slope,
                Intercept = intercept,
                Confidence = CalculateConfidence(sortedEmotions, slope, intercept)
            };
        }

        // Generate personalized insights
        public List<Insight> GenerateInsights(string userId, UserData data)
        {
            var insights = new List<Insight>();
            
            // Best performance emotion range
            var emotionPerformance = AnalyzeEmotionPerformance(data);
            var bestRange = emotionPerformance
                .OrderByDescending(r => r.WinRate)
                .FirstOrDefault();
            
            if (bestRange != null && bestRange.WinRate > 0.7 && bestRange.TradeCount >= 5)
            {
                insights.Add(new Insight {
                    Type = "performance_correlation",
                    Title = "Your Sweet Spot",
                    Description = $"You win {Math.Round(bestRange.WinRate * 100)}% when emotion level is {bestRange.EmotionLevel}",
                    Confidence = CalculateInsightConfidence(bestRange.TradeCount),
                    Priority = "high",
                    Actionable = true
                });
            }
            
            // Check for adverse emotional patterns
            var worstRange = emotionPerformance
                .Where(r => r.TradeCount >= 3)
                .OrderBy(r => r.WinRate)
                .FirstOrDefault();
                
            if (worstRange != null && worstRange.WinRate < 0.3)
            {
                insights.Add(new Insight {
                    Type = "warning",
                    Title = "Danger Zone Detected",
                    Description = $"You only win {Math.Round(worstRange.WinRate * 100)}% when emotion level is {worstRange.EmotionLevel}",
                    Confidence = CalculateInsightConfidence(worstRange.TradeCount),
                    Priority = "high",
                    Actionable = true
                });
            }

            // Emotion trend analysis
            var trendAnalysis = CalculateTrend(data.EmotionChecks);
            if (trendAnalysis.Direction != "insufficient_data" && trendAnalysis.Confidence > 60)
            {
                string trendMessage = trendAnalysis.Direction switch
                {
                    "improving" => "Your emotional state has been steadily improving over time. Keep up the great work!",
                    "declining" => "Your emotional state shows a declining trend. Consider implementing stress management techniques.",
                    "stable" => "Your emotional state remains stable. Consistency is key for trading success.",
                    _ => "Unable to determine emotional trend."
                };

                insights.Add(new Insight
                {
                    Type = "trend",
                    Title = $"Emotional Trend: {char.ToUpper(trendAnalysis.Direction[0]) + trendAnalysis.Direction[1..]}",
                    Description = trendMessage,
                    Confidence = trendAnalysis.Confidence,
                    Priority = trendAnalysis.Direction == "declining" ? "high" : "medium",
                    Actionable = true
                });
            }

            // Volatility insights
            var emotionVolatility = CalculateEmotionVolatility(data.EmotionChecks);
            if (emotionVolatility.StandardDeviation > 2.0)
            {
                insights.Add(new Insight
                {
                    Type = "warning",
                    Title = "High Emotional Volatility",
                    Description = $"Your emotions vary significantly (±{emotionVolatility.StandardDeviation:F1}). Consider mindfulness practices to stabilize your emotional state.",
                    Confidence = 85,
                    Priority = "high",
                    Actionable = true
                });
            }

            // Time-based patterns
            var timeBasedInsights = AnalyzeTimePatterns(data);
            insights.AddRange(timeBasedInsights);

            return insights.OrderByDescending(i => i.Priority == "high" ? 3 : i.Priority == "medium" ? 2 : 1)
                          .ThenByDescending(i => i.Confidence)
                          .ToList();
        }

        // Analyze emotion performance by level
        public List<EmotionPerformanceRange> AnalyzeEmotionPerformance(UserData data)
        {
            var emotionRanges = new List<EmotionPerformanceRange>();

            // Group trades by emotion level (rounded to nearest integer)
            for (int emotionLevel = 1; emotionLevel <= 10; emotionLevel++)
            {
                var tradesInRange = data.Trades
                    .Where(t => t.PreTradeEmotion.HasValue && 
                               Math.Round(t.PreTradeEmotion.Value) == emotionLevel)
                    .ToList();

                if (tradesInRange.Any())
                {
                    var winCount = tradesInRange.Count(t => t.IsWin);
                    var winRate = (double)winCount / tradesInRange.Count;
                    var averageProfit = tradesInRange.Average(t => t.Profit);

                    emotionRanges.Add(new EmotionPerformanceRange
                    {
                        EmotionLevel = emotionLevel,
                        WinRate = winRate,
                        TradeCount = tradesInRange.Count,
                        AverageProfit = averageProfit,
                        TradeIds = tradesInRange.Select(t => t.Id).ToList()
                    });
                }
            }

            return emotionRanges;
        }

        // Calculate confidence for linear regression
        private double CalculateConfidence(List<EmotionCheck> emotions, double slope, double intercept)
        {
            if (emotions.Count < 3) return 0;

            // Calculate R-squared
            double meanY = emotions.Average(e => e.EmotionLevel);
            double totalSumSquares = emotions.Sum(e => Math.Pow(e.EmotionLevel - meanY, 2));
            
            double residualSumSquares = emotions.Select((e, i) => {
                double predicted = slope * i + intercept;
                return Math.Pow(e.EmotionLevel - predicted, 2);
            }).Sum();

            double rSquared = 1 - (residualSumSquares / totalSumSquares);
            
            // Convert R-squared to confidence percentage, adjusted for sample size
            double sampleSizeAdjustment = Math.Min(1.0, emotions.Count / 20.0);
            return Math.Max(0, Math.Min(100, rSquared * 100 * sampleSizeAdjustment));
        }

        // Calculate insight confidence based on sample size
        private double CalculateInsightConfidence(int sampleSize)
        {
            // Statistical confidence increases with sample size
            if (sampleSize < 3) return 30;
            if (sampleSize < 5) return 50;
            if (sampleSize < 10) return 70;
            if (sampleSize < 20) return 85;
            return 95;
        }

        // Calculate emotion volatility
        private (double StandardDeviation, double Variance) CalculateEmotionVolatility(List<EmotionCheck> emotions)
        {
            if (emotions.Count < 2) return (0, 0);

            double mean = emotions.Average(e => e.EmotionLevel);
            double variance = emotions.Sum(e => Math.Pow(e.EmotionLevel - mean, 2)) / emotions.Count;
            double standardDeviation = Math.Sqrt(variance);

            return (standardDeviation, variance);
        }

        // Analyze time-based patterns
        private List<Insight> AnalyzeTimePatterns(UserData data)
        {
            var insights = new List<Insight>();

            // Analyze performance by day of week
            var dayOfWeekPerformance = data.Trades
                .Where(t => t.PreTradeEmotion.HasValue)
                .GroupBy(t => t.Timestamp.DayOfWeek)
                .Select(g => new
                {
                    DayOfWeek = g.Key,
                    WinRate = g.Count(t => t.IsWin) / (double)g.Count(),
                    TradeCount = g.Count(),
                    AverageEmotion = g.Average(t => t.PreTradeEmotion!.Value)
                })
                .Where(d => d.TradeCount >= 3)
                .ToList();

            var bestDay = dayOfWeekPerformance.OrderByDescending(d => d.WinRate).FirstOrDefault();
            var worstDay = dayOfWeekPerformance.OrderBy(d => d.WinRate).FirstOrDefault();

            if (bestDay != null && worstDay != null && bestDay.WinRate - worstDay.WinRate > 0.3)
            {
                insights.Add(new Insight
                {
                    Type = "performance_correlation",
                    Title = "Day-of-Week Pattern",
                    Description = $"You perform best on {bestDay.DayOfWeek}s ({bestDay.WinRate:P0} win rate) and worst on {worstDay.DayOfWeek}s ({worstDay.WinRate:P0})",
                    Confidence = CalculateInsightConfidence(bestDay.TradeCount + worstDay.TradeCount),
                    Priority = "medium",
                    Actionable = true
                });
            }

            // Analyze performance by time of day
            var hourlyPerformance = data.Trades
                .Where(t => t.PreTradeEmotion.HasValue)
                .GroupBy(t => t.Timestamp.Hour)
                .Select(g => new
                {
                    Hour = g.Key,
                    WinRate = g.Count(t => t.IsWin) / (double)g.Count(),
                    TradeCount = g.Count(),
                    AverageEmotion = g.Average(t => t.PreTradeEmotion!.Value)
                })
                .Where(h => h.TradeCount >= 3)
                .ToList();

            var bestHour = hourlyPerformance.OrderByDescending(h => h.WinRate).FirstOrDefault();
            var worstHour = hourlyPerformance.OrderBy(h => h.WinRate).FirstOrDefault();

            if (bestHour != null && worstHour != null && bestHour.WinRate - worstHour.WinRate > 0.4)
            {
                string bestHourDisplay = bestHour.Hour == 0 ? "12 AM" : 
                                       bestHour.Hour < 12 ? $"{bestHour.Hour} AM" : 
                                       bestHour.Hour == 12 ? "12 PM" : $"{bestHour.Hour - 12} PM";
                
                string worstHourDisplay = worstHour.Hour == 0 ? "12 AM" : 
                                        worstHour.Hour < 12 ? $"{worstHour.Hour} AM" : 
                                        worstHour.Hour == 12 ? "12 PM" : $"{worstHour.Hour - 12} PM";

                insights.Add(new Insight
                {
                    Type = "performance_correlation",
                    Title = "Time-of-Day Pattern",
                    Description = $"You trade best around {bestHourDisplay} ({bestHour.WinRate:P0} win rate) and struggle around {worstHourDisplay} ({worstHour.WinRate:P0})",
                    Confidence = CalculateInsightConfidence(bestHour.TradeCount + worstHour.TradeCount),
                    Priority = "medium",
                    Actionable = true
                });
            }

            return insights;
        }
    }
}
