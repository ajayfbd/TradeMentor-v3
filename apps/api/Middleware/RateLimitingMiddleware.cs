using System.Collections.Concurrent;
using System.Net;

namespace TradeMentor.Api.Middleware;

public class RateLimitingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RateLimitingMiddleware> _logger;
    private static readonly ConcurrentDictionary<string, UserRateLimit> _clients = new();

    public RateLimitingMiddleware(RequestDelegate next, ILogger<RateLimitingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var endpoint = context.Request.Path.Value?.ToLower();
        var clientId = GetClientIdentifier(context);

        // Apply rate limiting to auth endpoints
        if (endpoint?.Contains("/api/auth") == true)
        {
            if (!IsRequestAllowed(clientId, endpoint))
            {
                context.Response.StatusCode = (int)HttpStatusCode.TooManyRequests;
                await context.Response.WriteAsync("Rate limit exceeded. Please try again later.");
                _logger.LogWarning("Rate limit exceeded for client: {ClientId} on endpoint: {Endpoint}", clientId, endpoint);
                return;
            }
        }

        await _next(context);
    }

    private string GetClientIdentifier(HttpContext context)
    {
        // Use IP address as client identifier
        var forwardedFor = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        return forwardedFor ?? context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    }

    private bool IsRequestAllowed(string clientId, string endpoint)
    {
        var now = DateTime.UtcNow;
        var rateLimit = _clients.GetOrAdd(clientId, _ => new UserRateLimit());

        lock (rateLimit)
        {
            // Clean old entries (older than 15 minutes)
            rateLimit.Requests.RemoveAll(r => (now - r).TotalMinutes > 15);

            // Different limits for different endpoints
            var maxRequests = endpoint.Contains("login") || endpoint.Contains("register") ? 5 : 10;
            
            if (rateLimit.Requests.Count >= maxRequests)
            {
                return false;
            }

            rateLimit.Requests.Add(now);
            return true;
        }
    }

    private class UserRateLimit
    {
        public List<DateTime> Requests { get; } = new();
    }
}
