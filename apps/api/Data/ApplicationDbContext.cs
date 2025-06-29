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
    }
}
