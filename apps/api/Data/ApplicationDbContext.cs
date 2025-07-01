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
            
            entity.HasOne(e => e.User)
                  .WithMany(u => u.EmotionChecks)
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => new { e.UserId, e.Timestamp });
            entity.HasIndex(e => e.Context);
            
            entity.ToTable(t => t.HasCheckConstraint("CK_EmotionCheck_Level", "\"Level\" >= 1 AND \"Level\" <= 10"));
            entity.ToTable(t => t.HasCheckConstraint("CK_EmotionCheck_Context", 
                "\"Context\" IN ('pre-trade', 'post-trade', 'market-event')"));
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
    }
}
