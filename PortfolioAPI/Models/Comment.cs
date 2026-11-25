
namespace PortfolioAPI.Models;

public class Comment
{
    public Guid Id { get; set; }

    public string Name { get; set; } = "";

    public string Message { get; set; } = "";

    public DateTime CreatedAt { get; set; }
}
