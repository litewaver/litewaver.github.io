
using Microsoft.EntityFrameworkCore;
using PortfolioAPI.Models;

namespace PortfolioAPI.Data;

public class CommentDbContext : DbContext
{
    public CommentDbContext(
        DbContextOptions<CommentDbContext> options)
        : base(options)
    {
    }

    public DbSet<Comment> Comments { get; set; }

    public DbSet<CommentReaction> CommentReactions { get; set; }

    public DbSet<CommentReport> CommentReports { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Comment>()
            .Property(c => c.Name)
            .HasColumnType("nvarchar(max)");

        modelBuilder.Entity<Comment>()
            .Property(c => c.Message)
            .HasColumnType("nvarchar(max)");

        modelBuilder.Entity<Comment>()
            .HasOne(c => c.ParentComment)
            .WithMany(c => c.Replies)
            .HasForeignKey(c => c.ParentCommentId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<CommentReaction>()
            .Property(r => r.VisitorId)
            .HasMaxLength(64)
            .IsRequired();

        modelBuilder.Entity<CommentReaction>()
            .Property(r => r.Emoji)
            .HasMaxLength(16)
            .IsRequired();

        modelBuilder.Entity<CommentReaction>()
            .HasIndex(r => new { r.CommentId, r.VisitorId })
            .IsUnique();

        modelBuilder.Entity<CommentReaction>()
            .HasOne(r => r.Comment)
            .WithMany(c => c.Reactions)
            .HasForeignKey(r => r.CommentId)
            .OnDelete(DeleteBehavior.Cascade);

        // COMMENT REPORTS

        modelBuilder.Entity<CommentReport>()
            .Property(r => r.Reason)
            .HasMaxLength(40)
            .IsRequired();

        modelBuilder.Entity<CommentReport>()
            .Property(r => r.Details)
            .HasMaxLength(500);

        modelBuilder.Entity<CommentReport>()
            .Property(r => r.VisitorId)
            .HasMaxLength(64)
            .IsRequired();

        modelBuilder.Entity<CommentReport>()
            .Property(r => r.Status)
            .HasMaxLength(20)
            .IsRequired();

        // One report per visitor per comment.
        modelBuilder.Entity<CommentReport>()
            .HasIndex(r => new { r.CommentId, r.VisitorId })
            .IsUnique();

        modelBuilder.Entity<CommentReport>()
            .HasIndex(r => new { r.Status, r.CreatedAt });

        modelBuilder.Entity<CommentReport>()
            .HasOne(r => r.Comment)
            .WithMany()
            .HasForeignKey(r => r.CommentId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
