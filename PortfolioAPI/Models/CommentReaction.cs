
namespace PortfolioAPI.Models;

public class CommentReaction
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid CommentId { get; set; }

    public Comment Comment { get; set; } = null!;

    public string Emoji { get; set; } = "";

    public string VisitorId { get; set; } = "";
}
