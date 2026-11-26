

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

// 1. SIGNALR
builder.Services.AddSignalR();

// 2. ADMIN COOKIE AUTHENTICATION
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

// 3. RATE LIMITING
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.AddPolicy("comment-submit", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: partition => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
                AutoReplenishment = true
            }));

    options.AddPolicy("admin-login", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: partition => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(5),
                QueueLimit = 0,
                AutoReplenishment = true
            }));
    options.AddPolicy("report-submit", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: partition => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 3,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
                AutoReplenishment = true
            }));
});

// 4. CORS
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

// 5. SQL SERVER DATABASE
builder.Services.AddDbContext<CommentDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")
    )
);

// 6. BUILD APPLICATION
var app = builder.Build();

app.UseRouting();
app.UseCors("PortfolioPolicy");
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

// 7. ANONYMOUS VISITOR IDENTITY
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
            });
    }

    return Results.Ok(new
    {
        message = "Anonymous visitor identity ready."
    });
});

// 8. ADMIN LOGIN
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

    var usernameBytes = Encoding.UTF8.GetBytes(request.Username ?? "");
    var expectedUsernameBytes = Encoding.UTF8.GetBytes(expectedUsername);

    var passwordBytes = Encoding.UTF8.GetBytes(request.Password ?? "");
    var expectedPasswordBytes = Encoding.UTF8.GetBytes(expectedPassword);

    var usernameMatches =
        usernameBytes.Length == expectedUsernameBytes.Length &&
        CryptographicOperations.FixedTimeEquals(
            usernameBytes,
            expectedUsernameBytes
        );

    var passwordMatches =
        passwordBytes.Length == expectedPasswordBytes.Length &&
        CryptographicOperations.FixedTimeEquals(
            passwordBytes,
            expectedPasswordBytes
        );

    if (!usernameMatches || !passwordMatches)
        return Results.Unauthorized();

    var claims = new List<Claim>
    {
        new Claim(ClaimTypes.Name, expectedUsername),
        new Claim(ClaimTypes.Role, "Admin")
    };

    var identity = new ClaimsIdentity(
        claims,
        CookieAuthenticationDefaults.AuthenticationScheme
    );

    await httpContext.SignInAsync(
        CookieAuthenticationDefaults.AuthenticationScheme,
        new ClaimsPrincipal(identity)
    );

    return Results.Ok(new
    {
        message = "Admin login successful."
    });
})
.RequireRateLimiting("admin-login");

// 9. CHECK ADMIN LOGIN
app.MapGet("/api/admin/me", (HttpContext context) =>
{
    return Results.Ok(new
    {
        username = context.User.Identity?.Name,
        isAdmin = context.User.IsInRole("Admin")
    });
})
.RequireAuthorization();
// 9B. GET COMMENT REPORTS (ADMIN ONLY)
app.MapGet("/api/admin/reports", async (CommentDbContext db) =>
{
    var reports = await db.CommentReports
        .AsNoTracking()
        .OrderBy(r => r.Status == "Pending" ? 0 : 1)
        .ThenByDescending(r => r.CreatedAt)
        .Select(r => new
        {
            id = r.Id,
            commentId = r.CommentId,
            reason = r.Reason,
            details = r.Details,
            status = r.Status,
            createdAt = r.CreatedAt,
            reviewedAt = r.ReviewedAt,
            comment = new
            {
                name = r.Comment.Name,
                message = r.Comment.Message,
                isHidden = r.Comment.IsHidden
            }
        })
        .ToListAsync();

    return Results.Ok(reports);
})
.RequireAuthorization();
// 9C. DISMISS A REPORT (ADMIN ONLY)
app.MapPost("/api/admin/reports/{reportId:guid}/dismiss", async (
    Guid reportId,
    CommentDbContext db) =>
{
    var report = await db.CommentReports
        .FirstOrDefaultAsync(r => r.Id == reportId);

    if (report == null)
        return Results.NotFound(new { error = "Report not found." });

    if (report.Status != "Pending")
        return Results.BadRequest(new { error = "Report has already been reviewed." });

    report.Status = "Dismissed";
    report.ReviewedAt = DateTime.UtcNow;

    await db.SaveChangesAsync();

    return Results.Ok(new { message = "Report dismissed." });
})
.RequireAuthorization();


// 9D. HIDE A REPORTED COMMENT (ADMIN ONLY)
app.MapPost("/api/admin/reports/{reportId:guid}/hide", async (
    Guid reportId,
    CommentDbContext db) =>
{
    var report = await db.CommentReports
        .Include(r => r.Comment)
        .FirstOrDefaultAsync(r => r.Id == reportId);

    if (report == null)
        return Results.NotFound(new { error = "Report not found." });

    if (report.Status != "Pending")
        return Results.BadRequest(new { error = "Report has already been reviewed." });

    report.Comment.IsHidden = true;
    report.Status = "ActionTaken";
    report.ReviewedAt = DateTime.UtcNow;

    await db.SaveChangesAsync();

    return Results.Ok(new { message = "Comment hidden and report reviewed." });
})
.RequireAuthorization();
// 9E. RESTORE A HIDDEN COMMENT (ADMIN ONLY)
app.MapPost("/api/admin/comments/{commentId:guid}/restore", async (
    Guid commentId,
    CommentDbContext db) =>
{
    var comment = await db.Comments
        .FirstOrDefaultAsync(c => c.Id == commentId);

    if (comment == null)
        return Results.NotFound(new { error = "Comment not found." });

    comment.IsHidden = false;

    await db.SaveChangesAsync();

    return Results.Ok(new { message = "Comment restored." });
})
.RequireAuthorization();


// 10. GET COMMENTS, REPLIES AND REACTIONS
// Return simple objects instead of EF entities to prevent JSON cycles.

app.MapGet("/api/comments", async (CommentDbContext db) =>
{
    var comments = await db.Comments
        .AsNoTracking()
        .Where(c => !c.IsHidden && c.ParentCommentId == null)
        .OrderByDescending(c => c.CreatedAt)
        .Take(50)
        .Select(c => new
        {
            id = c.Id,
            name = c.Name,
            message = c.Message,
            createdAt = c.CreatedAt,

            reactions = c.Reactions.Select(r => new
            {
                emoji = r.Emoji
            }).ToList(),

            replies = c.Replies
                .Where(r => !r.IsHidden)
                .Select(r => new
                {
                    id = r.Id,
                    name = r.Name,
                    message = r.Message,
                    createdAt = r.CreatedAt,

                    reactions = r.Reactions.Select(reaction => new
                    {
                        emoji = reaction.Emoji
                    }).ToList()
                }).ToList()
        })
        .ToListAsync();

    return Results.Ok(comments);
});
// 10B. REPORT A COMMENT OR REPLY
app.MapPost("/api/comments/{id:guid}/reports", async (
    Guid id,
    ReportCommentRequest request,
    HttpContext context,
    CommentDbContext db) =>
{
    const string cookieName = "Litewaver.Visitor";

    var visitorId = context.Request.Cookies[cookieName];

    if (string.IsNullOrWhiteSpace(visitorId))
    {
        return Results.Unauthorized();
    }

    var allowedReasons = new[]
    {
        "Spam",
        "Harassment",
        "Hate speech",
        "Inappropriate content",
        "Other"
    };

    var reason = request.Reason?.Trim();
    var details = request.Details?.Trim();

    if (string.IsNullOrWhiteSpace(reason) ||
        !allowedReasons.Contains(reason))
    {
        return Results.BadRequest(new
        {
            error = "Please select a valid report reason."
        });
    }

    if (details?.Length > 500)
    {
        return Results.BadRequest(new
        {
            error = "Report details cannot exceed 500 characters."
        });
    }

    var comment = await db.Comments
        .FirstOrDefaultAsync(c => c.Id == id && !c.IsHidden);

    if (comment == null)
    {
        return Results.NotFound(new
        {
            error = "Comment not found."
        });
    }

    var existingReport = await db.CommentReports
        .AnyAsync(r =>
            r.CommentId == id &&
            r.VisitorId == visitorId);

    if (existingReport)
    {
        return Results.Conflict(new
        {
            error = "You have already reported this comment."
        });
    }

    var report = new CommentReport
    {
        Id = Guid.NewGuid(),
        CommentId = id,
        VisitorId = visitorId,
        Reason = reason,
        Details = string.IsNullOrWhiteSpace(details)
            ? null
            : details,
        Status = "Pending",
        CreatedAt = DateTime.UtcNow
    };

    db.CommentReports.Add(report);

    try
    {
        await db.SaveChangesAsync();
    }
    catch (DbUpdateException)
    {
        return Results.Conflict(new
        {
            error = "You have already reported this comment."
        });
    }

    return Results.Created(
        $"/api/comments/{id}/reports",
        new
        {
            message = "Report submitted successfully.",
            status = report.Status
        }
    );
})
.RequireRateLimiting("report-submit");
// 11. CREATE A COMMENT
app.MapPost("/api/comments", async (
    CreateCommentRequest request,
    CommentDbContext db,
    IHubContext<CommentsHub> hub) =>
{
    var name = string.IsNullOrWhiteSpace(request.Name)
        ? "Anonymous"
        : request.Name.Trim();

    var message = request.Message?.Trim();

    if (name.Length > 50)
    {
        return Results.BadRequest(new
        {
            error = "Name cannot exceed 50 characters."
        });
    }

    if (string.IsNullOrWhiteSpace(message) ||
        message.Length < 10 ||
        message.Length > 1000)
    {
        return Results.BadRequest(new
        {
            error = "Message must contain between 10 and 1000 characters."
        });
    }

    var comment = new Comment
    {
        Id = Guid.NewGuid(),
        Name = name,
        Message = message,
        CreatedAt = DateTime.UtcNow
    };

    db.Comments.Add(comment);
    await db.SaveChangesAsync();

    var responseComment = new
    {
        id = comment.Id,
        name = comment.Name,
        message = comment.Message,
        createdAt = comment.CreatedAt,
        reactions = Array.Empty<object>(),
        replies = Array.Empty<object>()
    };

    await hub.Clients.All.SendAsync(
        "ReceiveComment",
        responseComment
    );

    return Results.Created(
        $"/api/comments/{comment.Id}",
        responseComment
    );
})
.RequireRateLimiting("comment-submit");

// 12. REPLY TO A COMMENT
app.MapPost("/api/comments/{id:guid}/replies", async (
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

    var responseReply = new
    {
        id = reply.Id,
        name = reply.Name,
        message = reply.Message,
        createdAt = reply.CreatedAt,
        parentCommentId = id,
        reactions = Array.Empty<object>(),
        replies = Array.Empty<object>()
    };

    await hub.Clients.All.SendAsync(
        "ReceiveComment",
        responseReply
    );

    return Results.Created(
        $"/api/comments/{reply.Id}",
        responseReply
    );
})
.RequireRateLimiting("comment-submit");

// 13. ALLOWED EMOJI REACTIONS
var allowedEmojis = new[]
{
    "\u2764\uFE0F",
    "\uD83D\uDC4D",
    "\uD83D\uDD25",
    "\uD83D\uDE02",
    "\uD83D\uDC4F",
    "\uD83D\uDCA1"
};

// 14. ADD OR UPDATE A REACTION
app.MapPost("/api/comments/{id:guid}/reactions", async (
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

    if (request.Emoji == null ||
        !allowedEmojis.Contains(request.Emoji))
    {
        return Results.BadRequest(new
        {
            error = "Invalid reaction."
        });
    }

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

// 15. REMOVE A REACTION
app.MapDelete("/api/comments/{id:guid}/reactions", async (
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

// 16. SIGNALR HUB
app.MapHub<CommentsHub>("/hubs/comments");

// 17. START APPLICATION
app.Run();

// 18. REQUEST MODELS
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
public record ReportCommentRequest(
    string? Reason,
    string? Details
);
