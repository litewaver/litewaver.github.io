
using System.ComponentModel.DataAnnotations;

namespace PortfolioAPI.Models;

public class CommentReport
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid CommentId { get; set; }

    public Comment Comment { get; set; } = null!;

    [Required]
    [StringLength(40)]
    public string Reason { get; set; } = "";

    [StringLength(500)]
    public string? Details { get; set; }

    [Required]
    [StringLength(64)]
    public string VisitorId { get; set; } = "";

    [Required]
    [StringLength(20)]
    public string Status { get; set; } = "Pending";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? ReviewedAt { get; set; }
}
