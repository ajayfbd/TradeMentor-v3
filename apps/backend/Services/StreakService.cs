using Microsoft.EntityFrameworkCore;
using TradeMentor.Data;
using TradeMentor.Models;

namespace TradeMentor.Services
{
    public class StreakService
    {
        private readonly ApplicationDbContext _context;
        
        public StreakService(ApplicationDbContext context)
        {
            _context = context;
        }
        
        public async Task<StreakUpdate> UpdateStreakAsync(Guid userId)
        {
            // Get today's date in user's timezone
            var user = await _context.Users.FindAsync(userId);
            var userTimeZone = TimeZoneInfo.FindSystemTimeZoneById(user.Timezone ?? "UTC");
            var userDateTime = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, userTimeZone);
            var today = userDateTime.Date;
            
            // Get user's session for today (create if doesn't exist)
            var todaySession = await _context.UserSessions
                .FirstOrDefaultAsync(s => s.UserId == userId && s.Date == today);
                
            if (todaySession == null)
            {
                todaySession = new UserSession
                {
                    UserId = userId,
                    Date = today,
                    EmotionsLogged = 1
                };
                
                _context.UserSessions.Add(todaySession);
            }
            else
            {
                todaySession.EmotionsLogged++;
            }
            
            // Get yesterday's date
            var yesterday = today.AddDays(-1);
            
            // Calculate current streak
            int currentStreak = 1; // Today counts as 1
            var streakDate = yesterday;
            bool streakBroken = false;
            
            // Loop backward through dates to find streak
            while (true)
            {
                var sessionOnDate = await _context.UserSessions
                    .FirstOrDefaultAsync(s => s.UserId == userId && s.Date == streakDate);
                    
                if (sessionOnDate == null || sessionOnDate.EmotionsLogged == 0)
                {
                    // No session or no emotions logged on this day - streak ends
                    break;
                }
                
                currentStreak++;
                streakDate = streakDate.AddDays(-1);
            }
            
            // Check for longest streak
            var userProfile = await _context.UserProfiles
                .FirstOrDefaultAsync(p => p.UserId == userId);
                
            if (userProfile == null)
            {
                userProfile = new UserProfile
                {
                    UserId = userId,
                    LongestStreak = currentStreak
                };
                
                _context.UserProfiles.Add(userProfile);
            }
            else if (currentStreak > userProfile.LongestStreak)
            {
                userProfile.LongestStreak = currentStreak;
            }
            
            await _context.SaveChangesAsync();
            
            // Check for milestone
            string milestone = CheckMilestone(currentStreak);
            
            // If milestone reached, create an insight
            if (!string.IsNullOrEmpty(milestone))
            {
                var insight = new UserInsight
                {
                    UserId = userId,
                    InsightType = "streak_milestone",
                    Title = milestone,
                    Description = $"You've maintained your emotion tracking streak for {currentStreak} days!",
                    ConfidenceScore = 1.0m, // 100% confidence
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };
                
                _context.UserInsights.Add(insight);
                await _context.SaveChangesAsync();
            }
            
            return new StreakUpdate
            {
                CurrentStreak = currentStreak,
                LongestStreak = userProfile.LongestStreak,
                MilestoneAchieved = milestone,
                StreakBroken = streakBroken
            };
        }
        
        public async Task<StreakData> GetUserStreakAsync(Guid userId)
        {
            var userProfile = await _context.UserProfiles
                .FirstOrDefaultAsync(p => p.UserId == userId);
                
            if (userProfile == null)
            {
                return new StreakData
                {
                    CurrentStreak = 0,
                    LongestStreak = 0
                };
            }
            
            // Calculate current streak
            var user = await _context.Users.FindAsync(userId);
            var userTimeZone = TimeZoneInfo.FindSystemTimeZoneById(user.Timezone ?? "UTC");
            var userDateTime = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, userTimeZone);
            var today = userDateTime.Date;
            
            int currentStreak = 0;
            var streakDate = today;
            
            // Loop backward through dates to find current streak
            while (true)
            {
                var sessionOnDate = await _context.UserSessions
                    .FirstOrDefaultAsync(s => s.UserId == userId && s.Date == streakDate);
                    
                if (sessionOnDate == null || sessionOnDate.EmotionsLogged == 0)
                {
                    // No session or no emotions logged on this day - streak ends
                    break;
                }
                
                currentStreak++;
                streakDate = streakDate.AddDays(-1);
            }
            
            return new StreakData
            {
                CurrentStreak = currentStreak,
                LongestStreak = userProfile.LongestStreak
            };
        }
        
        private string CheckMilestone(int streak)
        {
            if (streak == 100) return "Emotion Tracking Legend! 🏆";
            if (streak == 30) return "Monthly Master! 🎖️";
            if (streak == 14) return "Two Week Champion! 💪";
            if (streak == 7) return "Week Warrior! 🔥";
            
            return null; // No milestone
        }
    }
    
    public class StreakUpdate
    {
        public int CurrentStreak { get; set; }
        public int LongestStreak { get; set; }
        public string MilestoneAchieved { get; set; }
        public bool StreakBroken { get; set; }
    }
    
    public class StreakData
    {
        public int CurrentStreak { get; set; }
        public int LongestStreak { get; set; }
    }
}
