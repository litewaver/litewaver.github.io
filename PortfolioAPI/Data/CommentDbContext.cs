
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

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
modelBuilder.Entity<Comment>()
    .Property(c => c.Name)
    .HasColumnType("nvarchar(max)");

modelBuilder.Entity<Comment>()
    .Property(c => c.Message)
    .HasColumnType("nvarchar(max)");
        // Connect replies to their parent comments.
        modelBuilder.Entity<Comment>()
            .HasOne(c => c.ParentComment)
            .WithMany(c => c.Replies)
            .HasForeignKey(c => c.ParentCommentId)
            .OnDelete(DeleteBehavior.Restrict);

        // Limit reaction field lengths for SQL Server.
        modelBuilder.Entity<CommentReaction>()
            .Property(r => r.VisitorId)
            .HasMaxLength(64)
            .IsRequired();

        modelBuilder.Entity<CommentReaction>()
            .Property(r => r.Emoji)
            .HasMaxLength(16)
            .IsRequired();

        // Prevent duplicate reactions from one visitor
        // to the same comment.
        modelBuilder.Entity<CommentReaction>()
            .HasIndex(r => new { r.CommentId, r.VisitorId })
            .IsUnique();

        // Connect reactions to comments.
        modelBuilder.Entity<CommentReaction>()
            .HasOne(r => r.Comment)
            .WithMany(c => c.Reactions)
            .HasForeignKey(r => r.CommentId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
