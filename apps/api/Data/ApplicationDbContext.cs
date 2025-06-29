using Microsoft.EntityFrameworkCore;
using api.Models;

namespace api.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<EmotionCheck> EmotionChecks { get; set; }
    public DbSet<Trade> Trades { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.PasswordHash).IsRequired().HasMaxLength(255);
            entity.Property(e => e.Timezone).HasMaxLength(50).HasDefaultValue("UTC");
            entity.Property(e => e.StreakCount).HasDefaultValue(0);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
        });

        // EmotionCheck configuration
        modelBuilder.Entity<EmotionCheck>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Level).IsRequired();
            entity.Property(e => e.Context).IsRequired().HasMaxLength(20);
            entity.Property(e => e.Symbol).HasMaxLength(10);
            
            entity.HasOne(e => e.User)
                  .WithMany(u => u.EmotionChecks)
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.ToTable(t => t.HasCheckConstraint("CK_EmotionCheck_Level", "\"Level\" >= 1 AND \"Level\" <= 10"));
            entity.ToTable(t => t.HasCheckConstraint("CK_EmotionCheck_Context", 
                "\"Context\" IN ('pre-trade', 'post-trade', 'market-event')"));
        });

        // Trade configuration
        modelBuilder.Entity<Trade>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Symbol).IsRequired().HasMaxLength(10);
            entity.Property(e => e.Type).IsRequired().HasMaxLength(10);
            entity.Property(e => e.Outcome).IsRequired().HasMaxLength(20);
            entity.Property(e => e.Pnl).HasColumnType("decimal(10,2)");

            entity.HasOne(e => e.User)
                  .WithMany(u => u.Trades)
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.EmotionCheck)
                  .WithMany()
                  .HasForeignKey(e => e.EmotionCheckId)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.ToTable(t => t.HasCheckConstraint("CK_Trade_Type", "\"Type\" IN ('buy', 'sell')"));
            entity.ToTable(t => t.HasCheckConstraint("CK_Trade_Outcome", 
                "\"Outcome\" IN ('win', 'loss', 'breakeven')"));
        });
    }
}
