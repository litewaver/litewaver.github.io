
using PortfolioAPI.Models;
using PortfolioAPI.Hubs;
using PortfolioAPI.Data;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Threading.RateLimiting;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;

var builder = WebApplication.CreateBuilder(args);

// 1. Enable SignalR
builder.Services.AddSignalR();
// Cookie authentication for the admin
builder.Services
    .AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.Cookie.Name = "Litewaver.Admin";
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;

        options.ExpireTimeSpan = TimeSpan.FromHours(8);
        options.SlidingExpiration = true;

        // Return API status codes instead of redirecting to a login page
        options.Events.OnRedirectToLogin = context =>
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.CompletedTask;
        };

        options.Events.OnRedirectToAccessDenied = context =>
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            return Task.CompletedTask;
        };
    });

builder.Services.AddAuthorization();
// 2. Configure rate limiting

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    // Limit comment submissions to 5 per minute
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

    // Limit admin login attempts to 5 per 5 minutes
    options.AddPolicy("admin-login", context =>
    {
        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: partition => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(5),
                QueueLimit = 0,
                AutoReplenishment = true
            });
    });
});


// 3. Enable CORS
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

// 4. Register Entity Framework Core and SQL Server
builder.Services.AddDbContext<CommentDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")
    )
);

// 5. Build application
var app = builder.Build();

app.UseRouting();
app.UseCors("PortfolioPolicy");

app.UseAuthentication();
// Issue a persistent anonymous visitor identity.
app.MapGet("/api/visitor/identity", (HttpContext context) =>
{
    const string cookieName = "Litewaver.Visitor";

    if (!context.Request.Cookies.ContainsKey(cookieName))
    {
        var visitorId = Convert.ToHexString(
            RandomNumberGenerator.GetBytes(32)
        );

        context.Response.Cookies.Append(
            cookieName,
            visitorId,
            new CookieOptions
            {
                HttpOnly = true,
                Secure = context.Request.IsHttps,
                SameSite = context.Request.IsHttps
                    ? SameSiteMode.None
                    : SameSiteMode.Lax,
                IsEssential = true,
                Path = "/",
                MaxAge = TimeSpan.FromDays(365)
            }
        );
    }

    return Results.Ok(new
    {
        message = "Anonymous visitor identity ready."
    });
});
app.UseAuthorization();

app.UseRateLimiter();
// Admin login
app.MapPost("/api/admin/login", async (
    AdminLoginRequest request,
    HttpContext httpContext,
    IConfiguration config) =>
{
    var expectedUsername = config["Admin:Username"];
    var expectedPassword = config["Admin:Password"];

    if (string.IsNullOrWhiteSpace(expectedUsername) ||
        string.IsNullOrWhiteSpace(expectedPassword))
    {
        return Results.Problem(
            "Admin credentials are not configured.",
            statusCode: 500
        );
    }

    var usernameMatches = CryptographicOperations.FixedTimeEquals(
        Encoding.UTF8.GetBytes(request.Username ?? ""),
        Encoding.UTF8.GetBytes(expectedUsername)
    );

    var passwordMatches = CryptographicOperations.FixedTimeEquals(
        Encoding.UTF8.GetBytes(request.Password ?? ""),
        Encoding.UTF8.GetBytes(expectedPassword)
    );

    if (!usernameMatches || !passwordMatches)
    {
        return Results.Unauthorized();
    }

    var claims = new List<Claim>
    {
        new Claim(ClaimTypes.Name, expectedUsername),
        new Claim(ClaimTypes.Role, "Admin")
    };

    var identity = new ClaimsIdentity(
        claims,
        CookieAuthenticationDefaults.AuthenticationScheme
    );

    var principal = new ClaimsPrincipal(identity);

    await httpContext.SignInAsync(
        CookieAuthenticationDefaults.AuthenticationScheme,
        principal
    );

    return Results.Ok(new
    {
        message = "Admin login successful."
    });
})
.RequireRateLimiting("admin-login");

// Check whether the current visitor is authenticated as admin
app.MapGet("/api/admin/me", (HttpContext context) =>
{
    return Results.Ok(new
    {
        username = context.User.Identity?.Name,
        isAdmin = context.User.IsInRole("Admin")
    });
})
.RequireAuthorization();

app.MapGet("/api/comments", async (CommentDbContext db) =>
{
    var comments = await db.Comments
        .Where(c => !c.IsHidden && c.ParentCommentId == null)
        .Include(c => c.Reactions)
        .Include(c => c.Replies.Where(r => !r.IsHidden))
            .ThenInclude(r => r.Reactions)
        .OrderByDescending(c => c.CreatedAt)
        .Take(50)
        .ToListAsync();

    return Results.Ok(comments);
});

// 7. POST: Validate, save, and broadcast comments

// POST: Create and broadcast an anonymous comment
app.MapPost("/api/comments", async (
    CreateCommentRequest request,
    CommentDbContext db,
    IHubContext<CommentsHub> hub) =>
{
    // Use Anonymous when the visitor leaves the name blank.
    var name = string.IsNullOrWhiteSpace(request.Name)
        ? "Anonymous"
        : request.Name.Trim();

    var message = request.Message?.Trim();

    // Validate name.
    if (name.Length > 50)
    {
        return Results.BadRequest(new
        {
            error = "Name cannot exceed 50 characters."
        });
    }

    // Validate message.
    if (string.IsNullOrWhiteSpace(message) ||
        message.Length < 10 ||
        message.Length > 1000)
    {
        return Results.BadRequest(new
        {
            error = "Message must contain between 10 and 1000 characters."
        });
    }

    // Create the comment.
    var comment = new Comment
    {
        Id = Guid.NewGuid(),
        Name = name,
        Message = message,
        CreatedAt = DateTime.UtcNow
    };

    // Save to SQL Server.
    db.Comments.Add(comment);
    await db.SaveChangesAsync();

    // Notify all connected visitors.
    await hub.Clients.All.SendAsync("ReceiveComment", comment);

    return Results.Created(
        $"/api/comments/{comment.Id}",
        comment
    );
})
.RequireRateLimiting("comment-submit");

app.MapPost("/api/comments/{id:guid}/replies",
async (
    Guid id,
    CreateCommentRequest request,
    CommentDbContext db,
    IHubContext<CommentsHub> hub) =>
{
    var parent = await db.Comments
        .FirstOrDefaultAsync(c => c.Id == id && !c.IsHidden);

    if (parent == null)
        return Results.NotFound(new { error = "Comment not found." });

    var name = string.IsNullOrWhiteSpace(request.Name)
        ? "Anonymous"
        : request.Name.Trim();

    var message = request.Message?.Trim();

    if (name.Length > 50 ||
        string.IsNullOrWhiteSpace(message) ||
        message.Length < 2 ||
        message.Length > 1000)
    {
        return Results.BadRequest(new
        {
            error = "Invalid name or message."
        });
    }

    var reply = new Comment
    {
        Id = Guid.NewGuid(),
        Name = name,
        Message = message,
        ParentCommentId = id,
        CreatedAt = DateTime.UtcNow
    };

    db.Comments.Add(reply);
    await db.SaveChangesAsync();

    await hub.Clients.All.SendAsync("ReceiveComment", reply);

    return Results.Created(
        $"/api/comments/{reply.Id}",
        reply
    );
})
.RequireRateLimiting("comment-submit");
// 8. SignalR endpoint


app.MapPost("/api/comments/{id:guid}/reactions",
async (
    Guid id,
    ReactionRequest request,
    HttpContext context,
    CommentDbContext db,
    IHubContext<CommentsHub> hub) =>
{
    const string cookieName = "Litewaver.Visitor";

    var visitorId = context.Request.Cookies[cookieName];

    if (string.IsNullOrWhiteSpace(visitorId))
        return Results.Unauthorized();

    var allowedEmojis = new[] { "❤️", "👍", "🔥", "😂", "👏", "💡" };

    if (request.Emoji == null ||
        !allowedEmojis.Contains(request.Emoji))
    {
        return Results.BadRequest(new
        {
            error = "Invalid reaction."
        });
    }

app.MapDelete("/api/comments/{id:guid}/reactions",
async (
    Guid id,
    HttpContext context,
    CommentDbContext db,
    IHubContext<CommentsHub> hub) =>
{
    const string cookieName = "Litewaver.Visitor";

    var visitorId = context.Request.Cookies[cookieName];

    if (string.IsNullOrWhiteSpace(visitorId))
        return Results.Unauthorized();

    var reaction = await db.CommentReactions
        .FirstOrDefaultAsync(r =>
            r.CommentId == id &&
            r.VisitorId == visitorId);

    if (reaction == null)
        return Results.NotFound();

    db.CommentReactions.Remove(reaction);

    await db.SaveChangesAsync();

    var counts = await db.CommentReactions
        .Where(r => r.CommentId == id)
        .GroupBy(r => r.Emoji)
        .Select(g => new
        {
            emoji = g.Key,
            count = g.Count()
        })
        .ToListAsync();

    await hub.Clients.All.SendAsync("ReceiveReaction", new
    {
        commentId = id,
        reactions = counts
    });

    return Results.Ok(new
    {
        message = "Reaction removed.",
        reactions = counts
    });
});


    var comment = await db.Comments
        .FirstOrDefaultAsync(c => c.Id == id && !c.IsHidden);

    if (comment == null)
        return Results.NotFound();

    var existingReaction = await db.CommentReactions
        .FirstOrDefaultAsync(r =>
            r.CommentId == id &&
            r.VisitorId == visitorId);

    if (existingReaction == null)
    {
        db.CommentReactions.Add(new CommentReaction
        {
            CommentId = id,
            VisitorId = visitorId,
            Emoji = request.Emoji
        });
    }
    else
    {
        existingReaction.Emoji = request.Emoji;
    }

    await db.SaveChangesAsync();

    var counts = await db.CommentReactions
        .Where(r => r.CommentId == id)
        .GroupBy(r => r.Emoji)
        .Select(g => new
        {
            emoji = g.Key,
            count = g.Count()
        })
        .ToListAsync();

    await hub.Clients.All.SendAsync("ReceiveReaction", new
    {
        commentId = id,
        reactions = counts
    });

    return Results.Ok(new
    {
        message = "Reaction saved.",
        reactions = counts
    });
});

app.MapHub<CommentsHub>("/hubs/comments");

app.Run();
public record CreateCommentRequest(
    string? Name,
    string? Message,
    Guid? ParentCommentId = null
);
public record ReactionRequest(string? Emoji);
public record AdminLoginRequest(
    string? Username,
    string? Password
);
// Request model
