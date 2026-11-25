
using System.ComponentModel.DataAnnotations;

namespace PortfolioAPI.Models;

public class Comment
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [StringLength(50)]
    public string Name { get; set; } = "Anonymous";

    [Required]
    [StringLength(1000, MinimumLength = 2)]
    public string Message { get; set; } = "";

    public Guid? ParentCommentId { get; set; }

    public Comment? ParentComment { get; set; }

    public List<Comment> Replies { get; set; } = new();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<CommentReaction> Reactions { get; set; } = new();

    public bool IsHidden { get; set; } = false;
}
