namespace api.DTOs
{
    public class EmotionPatternDto
    {
        public double AverageEmotion { get; set; }
        public int MostCommonEmotion { get; set; }
        public double EmotionVolatility { get; set; }
        public int TotalChecks { get; set; }
    }

    public class PerformanceCorrelationDto
    {
        public Dictionary<int, double> WinRateByEmotion { get; set; } = new();
        public Dictionary<int, decimal> AvgPnlByEmotion { get; set; } = new();
        public string BestPerformingEmotionRange { get; set; } = string.Empty;
        public string WorstPerformingEmotionRange { get; set; } = string.Empty;
    }

    public class WeeklyTrendDto
    {
        public DateTime WeekStartDate { get; set; }
        public double AverageEmotion { get; set; }
        public int TotalTrades { get; set; }
        public decimal TotalPnl { get; set; }
        public double WinRate { get; set; }
    }

    public class EmotionDistributionDto
    {
        public int EmotionLevel { get; set; }
        public int Count { get; set; }
        public double Percentage { get; set; }
    }

    public class PatternAnalysisDto
    {
        public EmotionPatternDto EmotionPatterns { get; set; } = new();
        public PerformanceCorrelationDto PerformanceCorrelation { get; set; } = new();
        public List<WeeklyTrendDto> WeeklyTrends { get; set; } = new();
        public List<EmotionDistributionDto> EmotionDistribution { get; set; } = new();
    }
}
