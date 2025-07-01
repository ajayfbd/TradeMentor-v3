using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using TradeMentor.Api.Models;

namespace TradeMentor.Api.Data;

public class ApplicationDbContext : IdentityDbContext<User>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<EmotionCheck> EmotionChecks { get; set; }
    public DbSet<Trade> Trades { get; set; }
    public DbSet<WeeklyReflection> WeeklyReflections { get; set; }
    public DbSet<MonthlyGoal> MonthlyGoals { get; set; }
    public DbSet<UserSession> UserSessions { get; set; }
    public DbSet<UserInsight> UserInsights { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Configure User entity
        builder.Entity<User>(entity =>
        {
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.Timezone).HasMaxLength(50).HasDefaultValue("UTC");
            entity.Property(e => e.StreakCount).HasDefaultValue(0);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
        });

        // Configure EmotionCheck entity
        builder.Entity<EmotionCheck>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.Timestamp).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.Level).IsRequired();
            entity.Property(e => e.Context).IsRequired().HasMaxLength(20);
            entity.Property(e => e.Symbol).HasMaxLength(10);
            entity.Property(e => e.Notes).HasMaxLength(1000);
            
            // New enhanced fields
            entity.Property(e => e.PrimaryEmotion).HasMaxLength(20);
            entity.Property(e => e.Intensity);
            entity.Property(e => e.MarketConditions).HasMaxLength(100);
            entity.Property(e => e.SessionId);
            
            entity.HasOne(e => e.User)
                  .WithMany(u => u.EmotionChecks)
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => new { e.UserId, e.Timestamp });
            entity.HasIndex(e => e.Context);
            entity.HasIndex(e => e.PrimaryEmotion);
            
            entity.ToTable(t => t.HasCheckConstraint("CK_EmotionCheck_Level", "\"Level\" >= 1 AND \"Level\" <= 10"));
            entity.ToTable(t => t.HasCheckConstraint("CK_EmotionCheck_Context", 
                "\"Context\" IN ('pre-trade', 'post-trade', 'market-event')"));
            entity.ToTable(t => t.HasCheckConstraint("CK_EmotionCheck_PrimaryEmotion", 
                "\"PrimaryEmotion\" IN ('fear', 'greed', 'confidence', 'anxiety', 'excitement', 'frustration', 'calm', 'fomo')"));
            entity.ToTable(t => t.HasCheckConstraint("CK_EmotionCheck_Intensity", "\"Intensity\" >= 1 AND \"Intensity\" <= 5"));
        });

        // Configure Trade entity
        builder.Entity<Trade>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.EntryTime).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.Symbol).IsRequired().HasMaxLength(10);
            entity.Property(e => e.Type).IsRequired().HasMaxLength(10);
            entity.Property(e => e.Outcome).IsRequired().HasMaxLength(20);
            entity.Property(e => e.Pnl).HasColumnType("decimal(18,2)");
            entity.Property(e => e.EntryPrice).HasColumnType("decimal(18,2)");
            entity.Property(e => e.ExitPrice).HasColumnType("decimal(18,2)");
            
            // New enhanced fields
            entity.Property(e => e.SetupQuality);
            entity.Property(e => e.ExecutionQuality);
            
            entity.HasOne(e => e.User)
                  .WithMany(u => u.Trades)
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.EmotionCheck)
                  .WithMany()
                  .HasForeignKey(e => e.EmotionCheckId)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasIndex(e => new { e.UserId, e.EntryTime });
            entity.HasIndex(e => e.Symbol);
            entity.HasIndex(e => e.Outcome);
            
            entity.ToTable(t => t.HasCheckConstraint("CK_Trade_Type", "\"Type\" IN ('buy', 'sell', 'long', 'short')"));
            entity.ToTable(t => t.HasCheckConstraint("CK_Trade_Outcome", 
                "\"Outcome\" IN ('win', 'loss', 'breakeven')"));
            entity.ToTable(t => t.HasCheckConstraint("CK_Trade_SetupQuality", "\"SetupQuality\" >= 1 AND \"SetupQuality\" <= 5"));
            entity.ToTable(t => t.HasCheckConstraint("CK_Trade_ExecutionQuality", "\"ExecutionQuality\" >= 1 AND \"ExecutionQuality\" <= 5"));
        });

        // Configure WeeklyReflection entity
        builder.Entity<WeeklyReflection>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.WeekStartDate).IsRequired();
            entity.Property(e => e.WeekEndDate).IsRequired();
            entity.Property(e => e.Wins).HasMaxLength(2000);
            entity.Property(e => e.Losses).HasMaxLength(2000);
            entity.Property(e => e.Lessons).HasMaxLength(2000);
            entity.Property(e => e.EmotionalInsights).HasMaxLength(2000);
            entity.Property(e => e.NextWeekGoals).HasMaxLength(2000);
            entity.Property(e => e.AverageEmotionLevel).HasColumnType("decimal(3,1)");
            entity.Property(e => e.TotalTrades).HasDefaultValue(0);
            entity.Property(e => e.WinRate).HasColumnType("decimal(5,2)");
            entity.Property(e => e.TotalPnL).HasColumnType("decimal(18,2)");
            
            entity.HasOne(e => e.User)
                  .WithMany(u => u.WeeklyReflections)
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => new { e.UserId, e.WeekStartDate }).IsUnique();
            entity.HasIndex(e => e.WeekStartDate);
            
            entity.ToTable(t => t.HasCheckConstraint("CK_WeeklyReflection_AverageEmotionLevel", 
                "\"AverageEmotionLevel\" >= 1.0 AND \"AverageEmotionLevel\" <= 10.0"));
            entity.ToTable(t => t.HasCheckConstraint("CK_WeeklyReflection_WinRate", 
                "\"WinRate\" >= 0.00 AND \"WinRate\" <= 100.00"));
        });

        // Configure MonthlyGoal entity
        builder.Entity<MonthlyGoal>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.Goal).IsRequired().HasMaxLength(500);
            entity.Property(e => e.Progress).HasDefaultValue(0);
            entity.Property(e => e.IsCompleted).HasDefaultValue(false);
            entity.Property(e => e.TargetMonth).IsRequired();
            
            entity.HasOne(e => e.User)
                  .WithMany(u => u.MonthlyGoals)
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => new { e.UserId, e.TargetMonth });
            entity.HasIndex(e => e.TargetMonth);
            
            entity.ToTable(t => t.HasCheckConstraint("CK_MonthlyGoal_Progress", 
                "\"Progress\" >= 0 AND \"Progress\" <= 100"));
        });

        // Configure UserSession entity
        builder.Entity<UserSession>(entity =>
        {
            entity.HasKey(s => s.Id);
            entity.Property(s => s.Id).ValueGeneratedOnAdd();
            entity.Property(s => s.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(s => s.Date).IsRequired();
            entity.Property(s => s.EmotionsLogged).HasDefaultValue(0);
            entity.Property(s => s.TradesLogged).HasDefaultValue(0);
            entity.Property(s => s.SessionQualityScore).HasColumnType("decimal(3,2)");
            
            entity.HasOne(s => s.User)
                  .WithMany(u => u.Sessions)
                  .HasForeignKey(s => s.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
                  
            entity.HasIndex(s => new { s.UserId, s.Date }).IsUnique();
            entity.HasIndex(s => s.Date);
            
            entity.ToTable(t => t.HasCheckConstraint("CK_UserSession_SessionQualityScore", 
                "\"SessionQualityScore\" >= 0.00 AND \"SessionQualityScore\" <= 10.00"));
        });

        // Configure UserInsight entity
        builder.Entity<UserInsight>(entity =>
        {
            entity.HasKey(i => i.Id);
            entity.Property(i => i.Id).ValueGeneratedOnAdd();
            entity.Property(i => i.GeneratedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(i => i.InsightType).IsRequired().HasMaxLength(50);
            entity.Property(i => i.Title).IsRequired().HasMaxLength(200);
            entity.Property(i => i.Description).IsRequired();
            entity.Property(i => i.Data).HasColumnType("jsonb");
            entity.Property(i => i.ConfidenceScore).HasColumnType("decimal(3,2)");
            entity.Property(i => i.IsActive).HasDefaultValue(true);
            
            entity.HasOne(i => i.User)
                  .WithMany(u => u.Insights)
                  .HasForeignKey(i => i.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
                  
            entity.HasIndex(i => new { i.UserId, i.InsightType });
            entity.HasIndex(i => i.IsActive);
            
            entity.ToTable(t => t.HasCheckConstraint("CK_UserInsight_InsightType", 
                "\"InsightType\" IN ('performance_correlation', 'best_times', 'emotion_pattern', 'streak_milestone')"));
            entity.ToTable(t => t.HasCheckConstraint("CK_UserInsight_ConfidenceScore", 
                "\"ConfidenceScore\" >= 0.00 AND \"ConfidenceScore\" <= 10.00"));
        });
    }
}
