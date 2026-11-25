
using PortfolioAPI.Models;
using PortfolioAPI.Hubs;
using PortfolioAPI.Data;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

// 1. Enable SignalR
builder.Services.AddSignalR();
// Configure rate limiting for comment submissions
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.AddPolicy("comment-submit", context =>
    {
        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",

            factory: partition => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
                AutoReplenishment = true
            });
    });
});

// 2. Enable CORS for your frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("PortfolioPolicy", policy =>
    {
        policy.WithOrigins(
            "http://localhost:5173",
            "http://localhost:5174",
            "https://litewaver.github.io"
        )
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials();
    });
});

// 3. Register Entity Framework Core and SQL Server
builder.Services.AddDbContext<CommentDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")
    )
);

// 4. Build the application
var app = builder.Build();

app.UseRouting();

app.UseCors("PortfolioPolicy");

app.UseRateLimiter();

// 5. GET: Retrieve the latest 50 comments from SQL Server
app.MapGet("/api/comments", async (CommentDbContext db) =>
{
    var comments = await db.Comments
        .OrderByDescending(c => c.CreatedAt)
        .Take(50)
        .ToListAsync();

    return Results.Ok(comments);
});

// 6. POST: Save a new comment to SQL Server and broadcast it
app.MapPost("/api/comments", async (
    CreateCommentRequest request,
    CommentDbContext db,
    IHubContext<CommentsHub> hub) =>
{
    var name = request.Name?.Trim();
    var message = request.Message?.Trim();

    if (string.IsNullOrWhiteSpace(name) ||
        string.IsNullOrWhiteSpace(message))
    {
        return Results.BadRequest("Name and message are required.");
    }

    if (name.Length > 50 || message.Length > 1000)
    {
        return Results.BadRequest("Comment is too long.");
    }

    var comment = new Comment
    {
        Id = Guid.NewGuid(),
        Name = name,
        Message = message,
        CreatedAt = DateTime.UtcNow
    };

    // Save the comment permanently in SQL Server
    db.Comments.Add(comment);
    await db.SaveChangesAsync();

    // Broadcast the saved comment to connected visitors
    await hub.Clients.All.SendAsync("ReceiveComment", comment);

    return Results.Created(
        $"/api/comments/{comment.Id}",
        comment
    );
})
.RequireRateLimiting("comment-submit");

// 7. SignalR connection endpoint
app.MapHub<CommentsHub>("/hubs/comments");

app.Run();

// Request model
public record CreateCommentRequest(
    string? Name,
    string? Message
);
